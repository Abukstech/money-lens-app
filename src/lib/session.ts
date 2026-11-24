export type User = {
  userId: string;
  email: string;
  firstName: string | null;
  emailVerifiedAt: string | null;
};
export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}
export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 0,
  ) {
    super(code);
  }
}
export type Transport = (
  url: string,
  options?: RequestInit,
) => Promise<Response>;
export class Session {
  user: User | null = null;
  private tokens: Tokens | null = null;
  private expiresAt = 0;
  private remember = false;
  private refreshing: Promise<string> | null = null;
  private epoch = 0;
  private signingOut = false;
  private persistence: Promise<void> = Promise.resolve();
  private persist(refreshToken: string | null) {
    const write = this.persistence
      .catch(() => {})
      .then(async () => {
        if (refreshToken)
          await this.storage.setItem("moneylens.refresh", refreshToken);
        else await this.storage.deleteItem("moneylens.refresh");
      });
    this.persistence = write;
    return write;
  }
  private listeners = new Set<() => void>();
  constructor(
    public readonly baseUrl: string,
    private storage: Storage,
    // Browser fetch must not receive this Session instance as its receiver.
    private transport: Transport = (url, options) => fetch(url, options),
  ) {}
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }
  async publicRequest<T>(
    path: string,
    body?: unknown,
    method = "POST",
  ): Promise<T> {
    return this.send<T>(path, body, method);
  }
  private async send<T>(
    path: string,
    body: unknown,
    method: string,
    token?: string,
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.transport(`${this.baseUrl}${path}`, {
        method,
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new ApiError("NETWORK_ERROR");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new ApiError(data.code ?? "REQUEST_FAILED", response.status);
    return data as T;
  }
  async establish(tokens: Tokens, remember: boolean) {
    const current = ++this.epoch;
    this.tokens = tokens;
    this.remember = remember;
    this.expiresAt = Date.now() + tokens.expiresIn * 1000;
    try {
      await this.persist(remember ? tokens.refreshToken : null);
      const user = await this.request<User>("/auth/me");
      if (current !== this.epoch) throw new ApiError("UNAUTHORIZED", 401);
      this.user = user;
      this.emit();
    } catch (error) {
      if (current === this.epoch) await this.clear();
      throw error;
    }
  }
  async restore() {
    const refreshToken = await this.storage.getItem("moneylens.refresh");
    if (!refreshToken) return;
    this.remember = true;
    this.tokens = { refreshToken, accessToken: "", expiresIn: 0 };
    this.expiresAt = 0;
    this.user = await this.request<User>("/auth/me");
    this.emit();
  }
  async accessToken(): Promise<string> {
    if (!this.tokens || this.signingOut)
      throw new ApiError("UNAUTHORIZED", 401);
    if (this.expiresAt > Date.now() + 30000) return this.tokens.accessToken;
    if (this.refreshing) return this.refreshing;
    const epoch = this.epoch;
    const refreshToken = this.tokens.refreshToken;
    const refresh = (async () => {
      try {
        const next = await this.publicRequest<Tokens>("/auth/refresh", {
          refreshToken,
        });
        if (epoch !== this.epoch) throw new ApiError("UNAUTHORIZED", 401);
        this.tokens = next;
        this.expiresAt = Date.now() + next.expiresIn * 1000;
        if (this.remember) await this.persist(next.refreshToken);
        if (epoch !== this.epoch) throw new ApiError("UNAUTHORIZED", 401);
        return next.accessToken;
      } catch (error) {
        if (
          epoch === this.epoch &&
          error instanceof ApiError &&
          error.status === 401
        )
          await this.clear();
        throw error;
      }
    })();
    this.refreshing = refresh;
    try {
      return await refresh;
    } finally {
      if (this.refreshing === refresh) this.refreshing = null;
    }
  }
  async request<T>(path: string, body?: unknown, method = "GET"): Promise<T> {
    const current = this.epoch;
    const ensureCurrent = (value: T) => {
      if (current !== this.epoch) throw new ApiError("UNAUTHORIZED", 401);
      return value;
    };
    const token = await this.accessToken();
    try {
      return ensureCurrent(await this.send<T>(path, body, method, token));
    } catch (error) {
      if (current !== this.epoch) throw new ApiError("UNAUTHORIZED", 401);
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      // Refresh only if this request used the current access token.
      if (this.tokens?.accessToken === token) this.expiresAt = 0;
      const fresh = await this.accessToken();
      try {
        return ensureCurrent(await this.send<T>(path, body, method, fresh));
      } catch (retryError) {
        if (
          current === this.epoch &&
          retryError instanceof ApiError &&
          retryError.status === 401
        )
          await this.clear();
        throw retryError;
      }
    }
  }
  async refreshUser() {
    this.user = await this.request<User>("/auth/me");
    this.emit();
  }
  async personalize(firstName: string) {
    this.user = await this.request<User>("/auth/me", { firstName }, "PATCH");
    this.emit();
  }
  async clear() {
    this.epoch++;
    this.tokens = null;
    this.user = null;
    this.expiresAt = 0;
    this.refreshing = null;
    this.signingOut = false;
    try {
      await this.persist(null);
    } finally {
      this.emit();
    }
  }
  async logout() {
    this.signingOut = true;
    try {
      if (this.refreshing) await this.refreshing.catch(() => {});
      const token = this.tokens?.refreshToken;
      if (token)
        await this.publicRequest("/auth/logout", { refreshToken: token });
    } finally {
      await this.clear();
    }
  }
  async deleteAccount() {
    await this.request("/auth/account", undefined, "DELETE");
    await this.clear();
  }
}
