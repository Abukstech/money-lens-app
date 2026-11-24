import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  Session,
  Storage,
  Tokens,
  Transport,
} from "../src/lib/session";
const user = {
  userId: "u1",
  email: "chidera@example.test",
  firstName: "Chidera",
  emailVerifiedAt: null,
};
const tokens: Tokens = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  expiresIn: 900,
};
function setup() {
  const values = new Map<string, string>();
  const storage: Storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    deleteItem: async (key) => {
      values.delete(key);
    },
  };
  const transport = vi.fn<Transport>();
  const session = new Session("http://test/api", storage, transport);
  return { session, storage, transport, values };
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
describe("Session lifecycle", () => {
  afterEach(() => vi.restoreAllMocks());
  it("calls the default browser fetch without binding it to the session", async () => {
    const { storage } = setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(function (this: unknown) {
      // Browser fetch rejects arbitrary receivers before any request is sent.
      if (this !== undefined && this !== globalThis)
        throw new TypeError("Illegal invocation");
      return Promise.resolve(json({ challengeId: "challenge-1" }));
    });
    const session = new Session("http://test/api", storage);
    await expect(session.publicRequest("/auth/email/request-code", {})).resolves.toEqual({
      challengeId: "challenge-1",
    });
  });
  it("persists only the refresh token when remembered", async () => {
    const { session, transport, values } = setup();
    transport.mockResolvedValue(json(user));
    await session.establish(tokens, true);
    expect([...values.values()]).toEqual(["refresh-1"]);
    expect(session.user).toEqual(user);
  });
  it("keeps an unremembered session only in memory", async () => {
    const { session, transport, values } = setup();
    values.set("moneylens.refresh", "old");
    transport.mockResolvedValue(json(user));
    await session.establish(tokens, false);
    expect(values.size).toBe(0);
    expect(await session.accessToken()).toBe("access-1");
  });
  it("restores a remembered session and stores the rotated refresh token", async () => {
    const { session, transport, values } = setup();
    values.set("moneylens.refresh", "refresh-1");
    transport
      .mockResolvedValueOnce(json({ ...tokens, refreshToken: "rotated" }))
      .mockResolvedValueOnce(json(user));
    await session.restore();
    expect(session.user).toEqual(user);
    expect(values.get("moneylens.refresh")).toBe("rotated");
  });
  it("serializes concurrent refresh requests", async () => {
    const { session, transport } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 901000);
    transport.mockClear();
    transport.mockResolvedValueOnce(
      json({
        ...tokens,
        accessToken: "new-access",
        refreshToken: "new-refresh",
      }),
    );
    expect(
      await Promise.all([
        session.accessToken(),
        session.accessToken(),
        session.accessToken(),
      ]),
    ).toEqual(["new-access", "new-access", "new-access"]);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("retries expired access once with a rotated session", async () => {
    const { session, transport } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    transport
      .mockResolvedValueOnce(json({ code: "UNAUTHORIZED" }, 401))
      .mockResolvedValueOnce(json({ ...tokens, accessToken: "new" }))
      .mockResolvedValueOnce(json({ ok: true }));
    expect(await session.request("/protected")).toEqual({ ok: true });
  });
  it("clears credentials after a definitive refresh rejection", async () => {
    const { session, transport, values } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 901000);
    transport.mockResolvedValueOnce(json({ code: "INVALID_SESSION" }, 401));
    await expect(session.accessToken()).rejects.toBeInstanceOf(ApiError);
    expect(session.user).toBeNull();
    expect(values.size).toBe(0);
  });
  it("preserves remembered credentials through a transient outage", async () => {
    const { session, transport, values } = setup();
    values.set("moneylens.refresh", tokens.refreshToken);
    transport.mockRejectedValueOnce(new Error("offline"));
    await expect(session.restore()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(values.get("moneylens.refresh")).toBe(tokens.refreshToken);
  });
  it("clears local credentials when logout cannot reach the server", async () => {
    const { session, transport, values } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    transport.mockRejectedValueOnce(new Error("offline"));
    await expect(session.logout()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(session.user).toBeNull();
    expect(values.size).toBe(0);
  });
  it("does not resurrect a session when refresh completes after logout", async () => {
    const { session, transport, values } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 901000);
    let resolve!: (response: Response) => void;
    transport.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolve = res;
        }),
    );
    const pending = session.accessToken();
    await session.clear();
    resolve(json(tokens));
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(session.user).toBeNull();
    expect(values.size).toBe(0);
  });
  it("refreshes profile state and deletes the account through the authenticated API", async () => {
    const { session, transport, values } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    transport.mockResolvedValueOnce(json({ ...user, firstName: "Ada" }));
    await session.refreshUser();
    expect(session.user?.firstName).toBe("Ada");
    expect(transport.mock.calls.at(-1)).toEqual(["http://test/api/auth/me", expect.objectContaining({ method: "GET", headers: expect.objectContaining({ Authorization: "Bearer access-1" }) })]);
    transport.mockResolvedValueOnce(json({ ...user, firstName: "Faith" }));
    await session.personalize("Faith");
    expect(session.user?.firstName).toBe("Faith");
    expect(transport.mock.calls.at(-1)).toEqual(["http://test/api/auth/me", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ firstName: "Faith" }) })]);
    transport.mockResolvedValueOnce(json({ deleted: true }));
    await session.deleteAccount();
    expect(transport.mock.calls.at(-1)).toEqual(["http://test/api/auth/account", expect.objectContaining({ method: "DELETE" })]);
    expect(session.user).toBeNull();
    expect(values.size).toBe(0);
  });
  it("preserves the user and credentials when a profile save or account deletion fails", async () => {
    const { session, transport, values } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    transport.mockResolvedValueOnce(json({ code: "INVALID_REQUEST" }, 400));
    await expect(session.personalize("Faith")).rejects.toMatchObject({ status: 400 });
    expect(session.user).toEqual(user);
    transport.mockRejectedValueOnce(new Error("offline"));
    await expect(session.deleteAccount()).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(session.user).toEqual(user);
    expect(values.get("moneylens.refresh")).toBe("refresh-1");
  });
  it("discards a profile reload that completes after sign-out", async () => {
    const { session, transport } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    let finish!: (response: Response) => void;
    transport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const loading = session.refreshUser();
    await vi.waitFor(() => expect(finish).toBeDefined());
    await session.clear();
    finish(json({ ...user, firstName: "Late response" }));
    await expect(loading).rejects.toMatchObject({ status: 401 });
    expect(session.user).toBeNull();
  });
});

describe("Session races", () => {
  afterEach(() => vi.restoreAllMocks());
  it("discards a profile response that arrives after local sign-out", async () => {
    const { session, transport, values } = setup();
    let finish!: (response: Response) => void;
    transport.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const establishing = session.establish(tokens, true);
    await vi.waitFor(() => expect(finish).toBeDefined());
    await session.clear();
    finish(json(user));
    await expect(establishing).rejects.toMatchObject({ status: 401 });
    expect(session.user).toBeNull();
    expect(values.size).toBe(0);
  });
  it("orders secure-store writes so a delayed rotation cannot persist after sign-out", async () => {
    const { session, transport, storage, values } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 901000);
    let completeWrite!: () => void;
    const write = storage.setItem;
    vi.spyOn(storage, "setItem").mockImplementationOnce(
      (key, value) =>
        new Promise((resolve) => {
          completeWrite = () => {
            void write(key, value).then(resolve);
          };
        }),
    );
    transport.mockResolvedValueOnce(
      json({ ...tokens, refreshToken: "rotated" }),
    );
    const rotation = session.accessToken();
    await vi.waitFor(() => expect(completeWrite).toBeDefined());
    const clearing = session.clear();
    completeWrite();
    await expect(rotation).rejects.toMatchObject({ status: 401 });
    await clearing;
    expect(values.size).toBe(0);
    expect(session.user).toBeNull();
  });
  it("logs out the rotated token when refresh was already in flight", async () => {
    const { session, transport } = setup();
    transport.mockResolvedValueOnce(json(user));
    await session.establish(tokens, true);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 901000);
    let finish!: (response: Response) => void;
    transport
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(json({ loggedOut: true }));
    const rotation = session.accessToken();
    const logout = session.logout();
    finish(json({ ...tokens, refreshToken: "rotated" }));
    await rotation;
    await logout;
    expect(JSON.parse(transport.mock.calls.at(-1)![1]!.body as string)).toEqual(
      { refreshToken: "rotated" },
    );
    expect(session.user).toBeNull();
  });
});
