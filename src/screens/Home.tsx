import { DesignAsset } from "../components/DesignAsset";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import {
  Brand,
  Button,
  C,
  ErrorNote,
  fonts,
  Icon,
  Illustration,
  Label,
  Link,
  s,
  Screen,
  useReducedMotion,
  useHardwareBack,
} from "../components/ui";
import {
  messageFor,
  normalizeTransaction,
  Page,
  session,
  Statement,
  Transaction,
  ClassificationSummary,
  uploadStatement,
} from "../lib/api";
import { ApiError } from "../lib/session";
import { useAppState } from "../lib/AppProvider";
import { formatMoney } from "../lib/validation";
import {
  categoryLabel,
  reviewQuestionsNeeded,
  transactionNeedsCorrection,
  transactionNeedsReview,
} from "../lib/review";
import {
  HomeIcon,
  HomeNavigation,
  StatementFolder,
} from "../components/HomeNavigation";

type SelectedFile = {
  uri: string;
  name: string;
  size: number;
  webFile?: File | globalThis.File;
};
async function cleanup(file: SelectedFile | null) {
  if (file && !file.webFile && file.uri.startsWith(Paths.cache.uri)) {
    try {
      const cached = new File(file.uri);
      if (cached.exists) cached.delete();
    } catch {
      /* OS may already have reclaimed the temporary file. */
    }
  }
}
export function Home() {
  const reducedMotion = useReducedMotion();
  const { activeStatementId, saveActiveStatement, clearActiveStatement } =
    useAppState();
  const params = useLocalSearchParams<{
    view?: string;
    statementId?: string;
    reviewed?: string;
  }>();
  const setScreen = (view: "home" | "upload" | "results", statementId?: string) =>
    router.setParams({
      view,
      statementId: statementId ?? "",
      reviewed: "",
    });
  const paramId = params.statementId || undefined;
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const selectedRef = useRef<SelectedFile | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "analysing">(
    "idle",
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [failure, setFailure] = useState(false);
  const [info, setInfo] = useState(false);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ClassificationSummary | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const screen =
    params.view === "results" && (statement || paramId || activeStatementId)
      ? "results"
      : params.view === "upload"
        ? "upload"
        : params.view === "home"
          ? "home"
          : activeStatementId
            ? "results"
            : "home";
  const statementId =
    screen === "results" ? paramId || activeStatementId || undefined : undefined;
  const reviewableCount = summary?.reviewableTransactionCount ?? summary?.unresolvedTransactionCount ?? reviewQuestionsNeeded(items);
  const [listBusy, setListBusy] = useState(Boolean(statementId));
  const cancelRef = useRef<(() => void) | null>(null);
  const attempt = useRef(0);
  const alive = useRef(true);
  const picking = useRef(false);
  const reviewedRef = useRef("");
  const summaryRequest = useRef(0);
  useEffect(() => {
    alive.current = true;
    const lifecycle = attempt;
    return () => {
      alive.current = false;
      lifecycle.current++;
      cancelRef.current?.();
      void cleanup(selectedRef.current);
    };
  }, []);
  const choose = async () => {
    if (picking.current || phase !== "idle") return;
    picking.current = true;
    setError("");
    setFailure(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const next: SelectedFile = {
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? asset.file?.size ?? new File(asset.uri).size,
        webFile: asset.file,
      };
      if (!alive.current) {
        await cleanup(next);
        return;
      }
      if (next.size <= 0 || next.size > 20 * 1024 * 1024) {
        await cleanup(next);
        setError("Choose a non-empty PDF smaller than 20 MB.");
        return;
      }
      if (!/\.pdf$/i.test(next.name) && asset.mimeType !== "application/pdf") {
        await cleanup(next);
        setError("Choose a PDF bank statement.");
        return;
      }
      await cleanup(selectedRef.current);
      selectedRef.current = next;
      setSelected(next);
    } catch {
      setError("We couldn’t open the file picker. Please try again.");
    } finally {
      picking.current = false;
    }
  };
  const remove = async () => {
    await cleanup(selectedRef.current);
    selectedRef.current = null;
    setSelected(null);
  };
  const loadRows = async (id: string, nextCursor: string | null = null) => {
    setListBusy(true);
    setError("");
    const summaryToken = nextCursor ? summaryRequest.current : ++summaryRequest.current;
    if (!nextCursor) setSummary(null);
    try {
      const [page, totals] = await Promise.all([
        session.request<Page>(`/moneylens/statements/${id}/transactions${nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : ""}`),
        nextCursor ? Promise.resolve(null) : session.request<ClassificationSummary>(`/moneylens/classification/summary?statementId=${encodeURIComponent(id)}`).catch(() => null),
      ]);
      if (!alive.current) return null;
      const rows = page.items.map(normalizeTransaction);
      setItems((old) =>
        nextCursor
          ? [
              ...old,
              ...rows.filter(
                (row) => !old.some((existing) => existing.id === row.id),
              ),
            ]
          : rows,
      );
      setCursor(page.nextCursor);
      if (!nextCursor && summaryToken === summaryRequest.current) {
        setSummary(totals && typeof totals.classificationCoverage === 'number' ? totals : null);
      }
      return { ...page, items: rows };
    } catch (e) {
      if (alive.current) setError(messageFor(e));
      return null;
    } finally {
      if (alive.current) setListBusy(false);
    }
  };
  const waitForProcessing = async (id: string, current: number) => {
    const deadline = Date.now() + 45000;
    let latest: Statement | null = null;
    while (
      alive.current &&
      current === attempt.current &&
      Date.now() < deadline
    ) {
      try {
        latest = await session.request<Statement>(`/moneylens/statements/${id}`);
      } catch {
        break;
      }
      if (!alive.current || current !== attempt.current) return null;
      if (latest.classificationStatus === "processed") return latest;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return latest;
  };
  const analyse = async () => {
    const file = selectedRef.current;
    if (!file || phase !== "idle") return;
    const current = ++attempt.current;
    setError("");
    setFailure(false);
    setProcessing(false);
    setProgress(0);
    setPhase("uploading");
    try {
      const token = await session.accessToken();
      if (!alive.current || current !== attempt.current) return;
      const upload = uploadStatement(
        { ...file, webFile: file.webFile as globalThis.File | undefined },
        token,
        (value) => {
          if (alive.current && current === attempt.current) setProgress(value);
        },
        () => {
          if (alive.current && current === attempt.current)
            setPhase("analysing");
        },
      );
      cancelRef.current = upload.cancel;
      const result = await upload.promise;
      if (!alive.current || current !== attempt.current) return;
      await saveActiveStatement(result.id);
      setStatement(result);
      setItems([]);
      setCursor(null);
      setPhase("idle");
      setScreen("results", result.id);
      await loadRows(result.id);
      if (!alive.current || current !== attempt.current) return;
      if (result.classificationStatus !== "processed") {
        setProcessing(true);
        void (async () => {
          const latest = await waitForProcessing(result.id, current);
          if (!alive.current || current !== attempt.current) return;
          if (latest) setStatement(latest);
          await loadRows(result.id);
          if (alive.current && current === attempt.current) setProcessing(false);
        })();
      }
    } catch (e) {
      if (alive.current && current === attempt.current) {
        setError(messageFor(e));
        setFailure(true);
      }
      if (e instanceof ApiError && e.status === 401) await session.clear();
    } finally {
      await cleanup(file);
      if (alive.current && current === attempt.current) {
        selectedRef.current = null;
        setSelected(null);
        setPhase("idle");
        cancelRef.current = null;
      }
    }
  };
  const cancel = () => {
    attempt.current++;
    cancelRef.current?.();
    cancelRef.current = null;
    setPhase("idle");
    setFailure(false);
    setError("Upload cancelled. Select your statement to try again.");
    void remove();
  };
  useHardwareBack(() => {
    if (phase !== "idle") cancel();
    else if (screen !== "home") {
      void remove();
      setScreen("home");
      setError("");
      setFailure(false);
    } else return false;
  });
  useEffect(() => {
    const id = screen === "results" ? statementId : undefined;
    if (!id || phase !== "idle") return;
    const loaded = statement?.id === id;
    // Returning from review passes `reviewed`, so the results list refreshes
    // even though the statement itself is already loaded.
    const reviewed = params.reviewed || "";
    const refresh = reviewed.length > 0 && reviewedRef.current !== reviewed;
    if (loaded && !refresh) return;
    if (refresh) reviewedRef.current = reviewed;
    let active = true;
    setListBusy(true);
    void (async () => {
      try {
        if (!loaded) {
          const result = await session.request<Statement>(
            `/moneylens/statements/${id}`,
          );
          if (!active || !alive.current) return;
          setStatement(result);
          void saveActiveStatement(id);
        }
        await loadRows(id);
      } catch (e) {
        if (!active || !alive.current) return;
        if (e instanceof ApiError && e.status === 404) {
          await clearActiveStatement();
          if (!active || !alive.current) return;
          setStatement(null);
          setItems([]);
          setCursor(null);
          setSummary(null);
          setListBusy(false);
          setScreen("home");
          setError(
            "Your last statement is no longer available. Upload a new one to continue.",
          );
          return;
        }
        setError(messageFor(e));
        setListBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [
    screen,
    params.reviewed,
    statementId,
    statement?.id,
    phase,
    saveActiveStatement,
    clearActiveStatement,
  ]);
  return (
    <>
      <Screen
        colors={["#FFFFFF", "#F0F9FF"]}
        header={
          screen === "upload" ? (
            <View style={styles.badge}>
              <View style={styles.dot} />
              <Label style={{ fontSize: 12 }}>Step 1 of 2</Label>
            </View>
          ) : undefined
        }
        dock={
          <HomeNavigation
            initial={session.user?.firstName?.charAt(0).toUpperCase() || "M"}
            onProfile={() => router.push("/profile")}
            onAsk={() => router.push("/ask")}
            onHome={() => {
              if (phase !== "idle") cancel();
              else void remove();
              setFailure(false);
              setScreen("home");
              setError("");
            }}
          />
        }
        back={
          screen === "home"
            ? undefined
            : () => {
                if (phase !== "idle") cancel();
                else void remove();
                setFailure(false);
                setScreen("home");
                setError("");
              }
        }
      >
        {screen === "home" ? (
          <>
            <View style={styles.header}>
              <Brand small />
              <View
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                accessibilityHint="Not available yet"
                accessibilityState={{ disabled: true }}
                style={styles.notification}
              >
                <HomeIcon name="bell" size={25} />
              </View>
            </View>
            <Label style={{ color: C.muted, marginTop: 36, fontSize: 18 }}>
              Hi {session.user?.firstName}!
            </Label>
            <Label
              style={[
                s.title,
                {
                  marginTop: 8,
                  fontSize: 28,
                  lineHeight: 35,
                  fontFamily: fonts.medium,
                },
              ]}
            >
              See the story behind{"\n"}your money.
            </Label>
            <View style={{ alignSelf: "flex-start", marginTop: 24 }}>
              <Button
                title="Analyse my statement"
                trailing={<DesignAsset name="arrow" width={16} />}
                compact
                onPress={() => {
                  setScreen("upload");
                  setError("");
                }}
              />
            </View>
            {activeStatementId && (
              <View style={{ marginTop: 16 }}>
                <Button
                  title="Continue your last statement"
                  secondary
                  compact
                  onPress={() => {
                    setError("");
                    setScreen("results", activeStatementId);
                  }}
                />
                <Label
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    marginTop: 10,
                  }}
                >
                  Your last uploaded statement is still available until you
                  upload a new one or sign out.
                </Label>
              </View>
            )}
            <View style={{ alignSelf: "flex-start", marginTop: 17 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="More information" onPress={() => setInfo(!info)} style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
                <Label style={{ color: C.blue, fontSize: 12 }}>More information</Label>
                <DesignAsset name="chevron" width={16} style={{ transform: [{ rotate: info ? "180deg" : "0deg" }] }} />
              </Pressable>
            </View>
            {info && (
              <View style={styles.info}>
                <Label style={{ fontSize: 13, lineHeight: 21, color: C.muted }}>
                  Upload a Nigerian bank statement in PDF format. Money Lens
                  extracts transactions so you can see where your money went.
                  Uncertain transactions stay marked for review.
                </Label>
              </View>
            )}
            <Label
              style={{
                fontFamily: fonts.medium,
                marginTop: 40,
                marginBottom: 24,
                fontSize: 16,
              }}
            >
              How it works
            </Label>
            {[
              ["Upload your statement", "Any supported Nigerian bank PDF."],
              [
                "Review the transactions",
                "See which transactions need a closer look.",
              ],
              ["Get your money story", "See your money in and money out."],
            ].map(([title, subtitle], i) => (
              <View style={styles.step} key={title}>
                {i < 2 && <View style={styles.connector} />}
                <View style={styles.number}>
                  <Label
                    style={{
                      color: C.blue,
                      fontSize: 10,
                      fontFamily: fonts.bold,
                    }}
                  >
                    0{i + 1}
                  </Label>
                </View>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontSize: 14, fontFamily: fonts.medium }}>
                    {title}
                  </Label>
                  <Label
                    style={{
                      color: C.muted,
                      fontSize: 12,
                      marginTop: 2,
                      lineHeight: 16,
                    }}
                  >
                    {subtitle}
                  </Label>
                </View>
              </View>
            ))}
            <View style={{ gap: 20, marginTop: 12 }}>
              <Link onPress={() => router.push("/story")}>Money story</Link>
            </View>
          </>
        ) : screen === "upload" ? (
          <>
            <Label
              style={[
                s.title,
                {
                  marginTop: 30,
                  fontSize: 28,
                  lineHeight: 35,
                  fontFamily: fonts.medium,
                },
              ]}
            >
              Upload your bank{"\n"}statement
            </Label>
            <Label style={[s.subtitle, { marginTop: 8, marginBottom: 32 }]}>
              Select your bank statement for Money Lens to analyse.
            </Label>
            <View style={styles.uploadCard}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <StatementFolder />
                <View style={{ flex: 1 }}>
                  <Label
                    numberOfLines={2}
                    style={{ fontFamily: fonts.medium, fontSize: 16 }}
                  >
                    {selected?.name ?? "Choose PDF"}
                  </Label>
                  <Label style={{ fontSize: 12, color: "#A5ACB6", marginTop: 2 }}>
                    {selected
                      ? `${(selected.size / 1024 / 1024).toFixed(1)} MB`
                      : "Select and upload a PDF document"}
                  </Label>
                </View>
              </View>
              {!selected ? (
                <View style={styles.dropZone}>
                  <View style={styles.filePrompt}>
                    <HomeIcon name="upload" size={30} color="#A5AEB9" />
                    <View style={{ flexShrink: 1 }}>
                      <Label
                        style={{ color: C.muted, fontSize: 12, lineHeight: 17 }}
                      >
                        Choose a file from your device
                      </Label>
                      <Label style={{ fontSize: 12, lineHeight: 17 }}>
                        PDF files up to 20 MB
                      </Label>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Browse files"
                    hitSlop={6}
                    onPress={() => void choose()}
                    style={styles.browseButton}
                  >
                    <Label
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontFamily: fonts.medium,
                      }}
                    >
                      Browse File
                    </Label>
                  </Pressable>
                </View>
              ) : phase === "uploading" ? (
                <View style={styles.statusBox}>
                  <View style={styles.header}>
                    <Label style={{ fontSize: 13 }}>Uploading…</Label>
                    <Label style={{ fontFamily: fonts.bold }}>
                      {progress}%
                    </Label>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${progress}%` }]} />
                  </View>
                  <Link onPress={cancel}>Cancel upload</Link>
                </View>
              ) : (
                <View style={{ marginTop: 18 }}>
                  <View style={styles.statusBox}>
                    <View style={styles.header}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon name="check" size={16} color="#22A67B" />
                        <Label style={{ fontSize: 12 }}>Ready to analyse</Label>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Remove selected file"
                        onPress={() => void remove()}
                        hitSlop={10}
                      >
                        <HomeIcon name="trash" size={18} color={C.muted} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <Button
                      title="Analyse"
                      compact
                      onPress={() => void analyse()}
                      disabled={phase !== "idle"}
                    />
                  </View>
                </View>
              )}
            </View>
            <View style={{ marginTop: 18 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "flex-start",
                }}
              >
                <HomeIcon name="info" size={16} color="#99A7B5" />
                <Label
                  style={{
                    flex: 1,
                    fontSize: 14,
                    lineHeight: 18,
                    color: "#808893",
                  }}
                >
                  Your original PDF isn’t retained after processing.{" "}
                  <Label
                    accessibilityRole="button"
                    onPress={() => setInfo(!info)}
                    style={{ fontSize: 14, color: C.blue }}
                  >
                    Learn more
                  </Label>
                </Label>
              </View>
              {info && (
                <Label
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    marginTop: 12,
                    lineHeight: 18,
                  }}
                >
                  The temporary copy used for upload is removed from this app
                  after processing, cancellation, or failure. Your original file
                  stays in its current location.
                </Label>
              )}
            </View>
          </>
        ) : (
          <>
            <Label style={[s.title, { marginTop: 30 }]}>
              Your transactions
            </Label>
            <Label style={s.subtitle}>
              Extracted from your bank statement.
            </Label>
            {processing && (
              <View style={styles.reviewPrompt}>
                <Label style={{ fontFamily: fonts.medium }}>
                  Still analysing
                </Label>
                <Label style={{ marginTop: 6, fontSize: 13, lineHeight: 20 }}>
                  Some categories and totals may update. You can start reviewing
                  now.
                </Label>
              </View>
            )}
            {summary && <View style={styles.reviewPrompt}>
              <Label style={{ fontFamily: fonts.medium }}>{summary.analysisComplete ? 'Spending summary' : 'Partial spending summary'}</Label>
              <Label style={{ marginTop: 8 }}>Known spending: {formatMoney(summary.classifiedExpenseAmount)}</Label>
              <Label>Unresolved money out: {formatMoney(summary.unclassifiedDebitAmount)}</Label>
              <Label>Unresolved money in: {formatMoney(summary.unclassifiedCreditAmount)}</Label>
              <Label style={{ marginTop: 8 }}>{Math.round(summary.classificationCoverage * 100)}% of transactions classified</Label>
              {!summary.analysisComplete && <Label style={{ marginTop: 8 }}>Unresolved amounts are excluded from known spending. You can review them later.</Label>}
            </View>}
            {statement?.status === "needs_review" && (
              <View style={styles.warning}>
                <Label style={{ fontSize: 13, lineHeight: 20 }}>
                  Some rows could not be fully verified. Review them below or
                  upload a clearer PDF to try again.
                </Label>
              </View>
            )}
            {reviewableCount > 0 && (
              <View style={styles.reviewPrompt}>
                <Label style={{ fontSize: 13, lineHeight: 20 }}>
                  {reviewableCount} transaction
                  {reviewableCount === 1 ? "" : "s"}{" "}
                  {reviewableCount === 1 ? "needs" : "need"} your review.
                </Label>
                <View style={{ marginTop: 12, alignSelf: "flex-start" }}>
                  <Button
                    title="Review transactions"
                    compact
                    onPress={() => {
                      const id = statement?.id || statementId;
                      if (id)
                        router.push({
                          pathname: "/review",
                          params: { statementId: id },
                        });
                    }}
                  />
                </View>
              </View>
            )}
            {items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.transaction,
                  {
                    borderTopColor:
                      transactionNeedsCorrection(item) ||
                      transactionNeedsReview(item)
                        ? "#F59E0B"
                        : C.blue,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Label
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {item.description || "Transaction"}
                    </Label>
                    <Label
                      style={{ color: C.muted, fontSize: 11, marginTop: 7 }}
                    >
                      {item.date.slice(0, 10)}
                    </Label>
                  </View>
                  <Label
                    style={{
                      fontFamily: fonts.bold,
                      color: item.direction === "credit" ? "#14865E" : C.ink,
                      fontSize: 14,
                    }}
                  >
                    {item.direction === "credit" ? "+" : "−"}
                    {formatMoney(item.amount)}
                  </Label>
                </View>
                <Label style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>
                  {transactionNeedsCorrection(item)
                    ? "Needs correction"
                    : transactionNeedsReview(item)
                      ? "Needs review"
                      : categoryLabel(item.category)}{" "}
                  · {item.direction === "credit" ? "Money in" : "Money out"}
                </Label>
                {!transactionNeedsCorrection(item) && <Pressable accessibilityRole="button"
                  accessibilityLabel={`Change category for ${item.description || 'transaction'}`}
                  onPress={() => router.push({ pathname: '/review', params: {
                    statementId: item.statementId || statement?.id || statementId, transactionId: item.id,
                  } })} style={{ marginTop: 12, minHeight: 40, justifyContent: 'center' }}>
                  <Label style={{ color: C.blue }}>Change category</Label>
                </Pressable>}
              </View>
            ))}
            {!items.length && !listBusy && !error && (
              <Label style={{ color: C.muted }}>No transactions found.</Label>
            )}
            {listBusy && (
              <ActivityIndicator
                color={C.blue}
                style={{ marginVertical: 25 }}
              />
            )}
            {cursor && (
              <Button
                title="Load more"
                loading={listBusy}
                onPress={() => {
                  if (statement) void loadRows(statement.id, cursor);
                }}
              />
            )}
            {!!error && statement && (
              <Link
                onPress={() =>
                  void loadRows(statement.id, items.length ? cursor : null)
                }
              >
                Retry loading transactions
              </Link>
            )}
            <View style={{ marginTop: 24 }}>
              <Button
                title="Upload another statement"
                secondary
                onPress={() => {
                  setScreen("upload");
                  setError("");
                }}
              />
            </View>
          </>
        )}
        <ErrorNote message={failure ? "" : error} />
      </Screen>
      <Modal
        transparent
        visible={phase === "analysing" || failure}
        animationType={reducedMotion ? "none" : "fade"}
        onRequestClose={
          phase === "analysing" ? cancel : () => setFailure(false)
        }
      >
        <View style={styles.scrim}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <Illustration kind={failure ? "error" : "analysing"} />
            <Label style={[s.title, s.center, { fontSize: 24, lineHeight: 28 }]}>
              {failure ? "Unable to read statement" : "Analysing…"}
            </Label>
            <Label style={[s.subtitle, s.center, { fontSize: 14, lineHeight: 16 }]}>
              {failure
                ? error
                : "Money Lens is going through your bank statement. Please wait…"}
            </Label>
            {failure ? (
              <Button
                title="Try again"
                onPress={() => {
                  setFailure(false);
                  setError("");
                  void choose();
                }}
              />
            ) : (
              <>
                <ActivityIndicator
                  color={C.blue}
                  style={{ marginBottom: 24 }}
                />
                <Button title="Cancel" secondary onPress={cancel} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notification: {
    backgroundColor: "#E5F4FE",
    width: 42,
    height: 42,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: 16,
    backgroundColor: "#FFFFFF90",
    borderRadius: 18,
    marginTop: 16,
  },
  step: { flexDirection: "row", gap: 9, minHeight: 73, position: "relative" },
  connector: {
    position: "absolute",
    top: 22,
    bottom: 0,
    left: 15,
    width: 1,
    backgroundColor: "#D8E9F3",
  },
  number: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7F1F6",
  },
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DDF2FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { backgroundColor: C.blue, width: 6, height: 6, borderRadius: 6 },
  uploadCard: {
    backgroundColor: "#F3F4F5",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#E4E9ED",
    padding: 20,
    paddingTop: 27,
  },
  dropZone: {
    backgroundColor: "#E5E7EB",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  filePrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: C.blue,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
    justifyContent: "center",
  },
  statusBox: {
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
  },
  track: {
    height: 5,
    backgroundColor: "#D5DDE3",
    borderRadius: 5,
    marginTop: 13,
    marginBottom: 18,
  },
  fill: { backgroundColor: C.blue, height: 5, borderRadius: 5 },
  scrim: { flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "white",
    borderRadius: 50,
    padding: 25,
    paddingBottom: 20,
    maxWidth: 520,
    width: "96%",
    alignSelf: "center",
    marginBottom: 10,
  },
  transaction: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderTopWidth: 2,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0A3152",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  warning: {
    backgroundColor: "#FFF1CE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  reviewPrompt: {
    backgroundColor: "#E8F6FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C9E9FC",
    padding: 16,
    marginBottom: 16,
  },
});
