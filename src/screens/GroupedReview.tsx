import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { AppScreen, AppSheet, p } from "../components/AppUI";
import { ReviewCard, ReviewChoice, ReviewTone } from "../components/ReviewCard";
import { Button, C, ErrorNote, Label, useHardwareBack } from "../components/ui";
import {
  CategoryOption,
  confirmTransactionGroup,
  getTransaction,
  listCategories,
  listReviewGroups,
  messageFor,
  ReviewGroup,
  reviewGroupMembers,
  Transaction,
} from "../lib/api";
import { categoryLabel } from "../lib/review";
import { formatMoney } from "../lib/validation";

const creditCategories = [
  "income",
  "gift_received",
  "loan_received",
  "repayment_received",
  "refund",
  "internal_transfer",
];
const fallbackDebitCategories = [
  "groceries",
  "dining",
  "housing",
  "utilities",
  "transport",
  "telecommunications",
  "healthcare",
  "education",
  "shopping",
  "entertainment",
  "subscriptions",
  "travel",
  "personal_care",
  "family_support",
  "donations_gifts",
  "business_expenses",
  "savings",
  "investments",
  "debt_repayment",
  "financial_fees",
  "insurance",
  "taxes",
  "gambling",
  "cash_withdrawal",
  "internal_transfer",
  "other",
];
const optionStyle = {
  borderWidth: 1,
  borderColor: "#DCF1FE",
  backgroundColor: "#F0F9FF",
  borderRadius: 16,
  padding: 14,
  minHeight: 44,
  justifyContent: "center" as const,
};

type MemberPage = { items: Transaction[]; nextCursor: string | null };

function groupTitle(group: ReviewGroup, first: Transaction | undefined) {
  if (group.count > 1) return `${group.count} matching transactions`;
  return first?.merchant?.name ?? first?.description ?? "Transaction";
}

function groupReference(group: ReviewGroup, first: Transaction | undefined) {
  if (group.count > 1)
    return (
      group.proposedConditions?.narrationTokens.join(" · ") ||
      group.previews.map((row) => row.description).join(" · ")
    );
  return first?.merchant?.name ? first.description : undefined;
}

function groupDate(group: ReviewGroup, first: Transaction | undefined) {
  if (!first) return "";
  return group.count > 1 ? `${first.date} +${group.count - 1} more` : first.date;
}

export function GroupedReview({
  statementId,
  transactionId,
}: {
  statementId: string;
  transactionId?: string;
}) {
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [groupCursor, setGroupCursor] = useState<string | null>(null);
  const [totalGroups, setTotalGroups] = useState(0);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<Record<string, MemberPage>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [groupAnswers, setGroupAnswers] = useState<Record<string, string>>({});
  const [remember, setRemember] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [picker, setPicker] = useState<{ key: string; rowId?: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(true);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reload, setReload] = useState(0);
  const leave = () =>
    router.replace({
      pathname: "/",
      params: {
        view: "results",
        statementId,
        reviewed: String(Date.now()),
      },
    });
  useHardwareBack(() => {
    leave();
    return true;
  });

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    void (async () => {
      try {
        const categoryList = await listCategories().catch(() => []);
        if (!active) return;
        setCategories(categoryList);
        if (transactionId) {
          const row = await getTransaction(transactionId);
          if (!active) return;
          if (row.statementId !== statementId || row.validationIssues?.length)
            throw new Error("ROW_NOT_REVIEWABLE");
          setGroups([
            {
              key: row.id,
              count: 1,
              totalAmount: row.amount,
              direction: row.direction,
              currency: row.currency,
              suggestedCategory: row.suggestedCategory ?? null,
              previews: [row],
              memoryEligible: false,
              proposedConditions: null,
            },
          ]);
          setMembers({ [row.id]: { items: [row], nextCursor: null } });
          setSelected({ [row.id]: true });
          setTotalGroups(1);
          setGroupCursor(null);
        } else {
          const page = await listReviewGroups(statementId);
          if (!active) return;
          setGroups(page.items);
          setGroupCursor(page.nextCursor);
          setTotalGroups(page.groupCount);
          setMembers({});
          setSelected({});
          setExpanded({});
        }
      } catch (e) {
        if (active) setError(messageFor(e));
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [statementId, transactionId, reload]);

  const answerRows = (key: string, rows: Transaction[], category: string) => {
    const nextSelected = { ...selected };
    let count = Object.values(nextSelected).filter(Boolean).length;
    const ids: string[] = [];
    for (const row of rows) {
      if (!(row.id in nextSelected)) {
        if (count >= 100) continue;
        nextSelected[row.id] = true;
        count++;
      }
      if (nextSelected[row.id]) ids.push(row.id);
    }
    setSelected(nextSelected);
    setAnswers((old) => ({
      ...old,
      ...Object.fromEntries(ids.map((id) => [id, category])),
    }));
    setGroupAnswers((old) => ({ ...old, [key]: category }));
  };

  const applyGroup = async (group: ReviewGroup, category: string) => {
    setPicker(null);
    const loaded = members[group.key];
    if (loaded) {
      const selectedRows = loaded.items.filter((row) => selected[row.id]);
      answerRows(
        group.key,
        selectedRows.length ? selectedRows : loaded.items,
        category,
      );
      return;
    }
    if (group.count === 1) {
      setMembers((old) => ({
        ...old,
        [group.key]: { items: group.previews, nextCursor: null },
      }));
      answerRows(group.key, group.previews, category);
      return;
    }
    setLoadingKey(group.key);
    setError("");
    try {
      const page = await reviewGroupMembers(statementId, group.key);
      setMembers((old) => ({
        ...old,
        [group.key]: { items: page.items, nextCursor: page.nextCursor },
      }));
      answerRows(group.key, page.items, category);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setLoadingKey(null);
    }
  };

  const inspect = async (group: ReviewGroup, cursor?: string | null) => {
    if (!cursor) {
      const open = !!expanded[group.key];
      setExpanded((old) => ({ ...old, [group.key]: !open }));
      if (open || members[group.key]) return;
    }
    setLoadingKey(group.key);
    setError("");
    try {
      const page = await reviewGroupMembers(statementId, group.key, cursor);
      setMembers((old) => ({
        ...old,
        [group.key]: {
          items: cursor
            ? [...(old[group.key]?.items ?? []), ...page.items]
            : page.items,
          nextCursor: page.nextCursor,
        },
      }));
      // Loading a group never selects rows beyond the explicit 100-row save limit.
      setSelected((old) => {
        let count = Object.values(old).filter(Boolean).length;
        const next = { ...old };
        for (const row of page.items)
          if (!(row.id in next) && count < 100) {
            next[row.id] = true;
            count++;
          }
        return next;
      });
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setLoadingKey(null);
    }
  };

  const choose = (category: string) => {
    if (!picker) return;
    const group = groups.find((item) => item.key === picker.key);
    if (!group) {
      setPicker(null);
      return;
    }
    if (picker.rowId) {
      setAnswers((old) => ({ ...old, [picker.rowId!]: category }));
      setSelected((old) => ({ ...old, [picker.rowId!]: true }));
      setPicker(null);
      return;
    }
    void applyGroup(group, category);
  };

  const chosenRows = groups.flatMap((group) =>
    (members[group.key]?.items ?? [])
      .filter((row) => selected[row.id] && answers[row.id])
      .map((row) => ({ row, group })),
  );
  const save = async () => {
    if (!chosenRows.length || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      for (const group of groups) {
        const chosen = chosenRows
          .filter((item) => item.group.key === group.key)
          .map((item) => item.row);
        for (const category of new Set(chosen.map((row) => answers[row.id]))) {
          const subset = chosen.filter((row) => answers[row.id] === category);
          const canRemember =
            group.memoryEligible &&
            subset.length === group.count &&
            !!group.proposedConditions;
          await confirmTransactionGroup(
            subset.map((row) => ({
              transactionId: row.id,
              revision: row.revision,
            })),
            category,
            remember[group.key] && canRemember
              ? group.proposedConditions!
              : undefined,
          );
        }
      }
      leave();
    } catch (e) {
      // Earlier batches may have succeeded; refresh revisions before another save.
      setAnswers({});
      setRemember({});
      setGroupAnswers({});
      setReload((value) => value + 1);
      setSaveError(messageFor(e));
    } finally {
      setSaving(false);
    }
  };
  const activeGroup = groups.find((group) => group.key === picker?.key);
  const options =
    activeGroup?.direction === "credit"
      ? creditCategories
      : (categories.length
          ? categories.map((category) => category.id)
          : fallbackDebitCategories
        ).filter(
          (id) =>
            ![
              ...creditCategories.filter((id) => id !== "internal_transfer"),
              "unknown",
              "transfer_unknown",
            ].includes(id),
        );

  return (
    <AppScreen navigation={false} back={leave}>
      <View style={styles.step}>
        <View style={styles.stepDot} />
        <Label style={{ fontSize: 12 }}>Step 2 of 2</Label>
      </View>
      <Label style={[p.heading, { marginTop: 32 }]}>
        {transactionId ? "Change transaction category" : "Review your transactions"}
      </Label>
      <Label style={p.caption}>
        {transactionId
          ? "Choose the category that best describes this transaction."
          : "This helps MoneyLens confirm anything it is not sure about. You can leave the rest for later."}
      </Label>
      <ErrorNote message={saveError || error} />
      {busy ? (
        <ActivityIndicator color={C.blue} style={{ marginTop: 24 }} />
      ) : (
        <>
          {!groups.length && !error && (
            <Label style={p.body}>Nothing needs your review</Label>
          )}
          {!transactionId && groups.length > 0 && (
            <Label style={[p.caption, { marginBottom: 16 }]}>
              {totalGroups} review group{totalGroups === 1 ? "" : "s"} ·{" "}
              {chosenRows.length} selected answer
              {chosenRows.length === 1 ? "" : "s"} ready
            </Label>
          )}
          {groups.map((group) => {
            const loaded = members[group.key];
            const rows = loaded?.items ?? group.previews;
            const first = rows[0];
            const suggested = group.suggestedCategory;
            const groupAnswer = groupAnswers[group.key];
            const positive = group.direction === "credit";
            const direction = positive ? "Money in" : "Money out";
            const tone: ReviewTone = transactionId
              ? "category"
              : suggested
                ? "optional"
                : "required";
            const helper = transactionId
              ? "Improves your breakdown"
              : !suggested
                ? "These affect your totals"
                : suggested === "internal_transfer"
                  ? "Helps separate your account"
                  : "Improves your breakdown";
            const question = suggested
              ? `Is this ${categoryLabel(groupAnswer ?? suggested)}?`
              : positive
                ? "What was this money?"
                : "What kind of spending is this?";
            const choices: ReviewChoice[] = suggested
              ? [
                  {
                    id: "confirm",
                    label: `Confirm ${categoryLabel(suggested)}`,
                    icon: "reviewCheck",
                  },
                  {
                    id: "choose",
                    label: "Choose a different category",
                    icon: "reviewTransfer",
                  },
                ]
              : [];
            const isOpen = !!expanded[group.key];
            const canRemember =
              group.memoryEligible &&
              !!group.proposedConditions &&
              !!loaded &&
              !loaded.nextCursor &&
              loaded.items.length === group.count &&
              loaded.items.every(
                (row) =>
                  selected[row.id] &&
                  answers[row.id] &&
                  answers[row.id] === groupAnswers[group.key],
              );
            return (
              <ReviewCard
                key={group.key}
                tone={tone}
                helper={helper}
                title={groupTitle(group, first)}
                reference={groupReference(group, first)}
                date={groupDate(group, first)}
                direction={direction}
                amount={`${positive ? "+" : "−"}${formatMoney(group.totalAmount)}`}
                positive={positive}
                category={categoryLabel(groupAnswer ?? suggested)}
                question={question}
                choices={choices}
                selected={
                  groupAnswer && groupAnswer === suggested ? "confirm" : undefined
                }
                onSelect={(id) => {
                  if (id === "confirm" && suggested)
                    void applyGroup(group, suggested);
                  else if (id === "choose") setPicker({ key: group.key });
                }}
                categoryActionLabel={
                  suggested
                    ? undefined
                    : groupAnswer
                      ? categoryLabel(groupAnswer)
                      : "Select a category"
                }
                onChooseCategory={
                  suggested ? undefined : () => setPicker({ key: group.key })
                }
              >
                {group.count > 1 && (
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title={
                        isOpen
                          ? "Hide individual transactions"
                          : `Review ${group.count} transactions individually`
                      }
                      secondary
                      loading={loadingKey === group.key}
                      disabled={saving}
                      onPress={() => void inspect(group)}
                    />
                  </View>
                )}
                {isOpen && loaded && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {rows.map((row) => (
                      <View key={row.id} style={{ gap: 6 }}>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityLabel={`Include ${row.description}`}
                          accessibilityState={{
                            checked: !!selected[row.id],
                            disabled: saving,
                          }}
                          disabled={saving}
                          onPress={() =>
                            setSelected((old) => {
                              if (
                                !old[row.id] &&
                                Object.values(old).filter(Boolean).length >= 100
                              )
                                return old;
                              return { ...old, [row.id]: !old[row.id] };
                            })
                          }
                          style={[
                            optionStyle,
                            {
                              borderColor: selected[row.id]
                                ? C.blue
                                : "#DCF1FE",
                            },
                          ]}
                        >
                          <Label>
                            {selected[row.id] ? "✓ " : "○ "}
                            {row.description}
                          </Label>
                          <Label style={p.caption}>
                            {row.date} · {formatMoney(row.amount)}
                          </Label>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Choose category for ${row.description}`}
                          disabled={saving}
                          onPress={() =>
                            setPicker({ key: group.key, rowId: row.id })
                          }
                          style={optionStyle}
                        >
                          <Label>
                            {answers[row.id]
                              ? categoryLabel(answers[row.id])
                              : "Choose individual category"}
                          </Label>
                        </Pressable>
                      </View>
                    ))}
                    {!!loaded.nextCursor && (
                      <Button
                        title="Load more matching transactions"
                        secondary
                        disabled={saving}
                        loading={loadingKey === group.key}
                        onPress={() => void inspect(group, loaded.nextCursor)}
                      />
                    )}
                  </View>
                )}
                {canRemember && (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel="Remember matching payments"
                    accessibilityState={{
                      checked: !!remember[group.key],
                    }}
                    disabled={saving}
                    onPress={() =>
                      setRemember((old) => ({
                        ...old,
                        [group.key]: !old[group.key],
                      }))
                    }
                    style={[optionStyle, { marginTop: 12 }]}
                  >
                    <Label>
                      {remember[group.key] ? "✓ " : "○ "}Remember matching
                      payments
                    </Label>
                    <Label style={p.caption}>
                      Use {categoryLabel(groupAnswers[group.key])} for the same
                      recipient, {group.proposedConditions!.direction},{" "}
                      {group.proposedConditions!.currency},{" "}
                      {formatMoney(group.proposedConditions!.minAmount)}–
                      {formatMoney(group.proposedConditions!.maxAmount)},
                      containing:{" "}
                      {group.proposedConditions!.narrationTokens.join(", ")}.
                    </Label>
                  </Pressable>
                )}
                {!group.memoryEligible && group.count > 1 && (
                  <Label style={[p.caption, { marginTop: 12 }]}>
                    Future memory needs a reliable recipient identifier and
                    matching purpose clues.
                  </Label>
                )}
              </ReviewCard>
            );
          })}
          {!!groupCursor && (
            <Button
              title="Load more review groups"
              secondary
              disabled={saving || !!loadingKey}
              onPress={() => {
                setLoadingKey("groups");
                void listReviewGroups(statementId, groupCursor)
                  .then((page) => {
                    setGroups((old) => [...old, ...page.items]);
                    setGroupCursor(page.nextCursor);
                  })
                  .catch((e) => setError(messageFor(e)))
                  .finally(() => setLoadingKey(null));
              }}
            />
          )}
          <Label style={[p.caption, { marginTop: 16 }]}>
            {chosenRows.length} selected answer
            {chosenRows.length === 1 ? "" : "s"} ready. Save up to 100
            transactions at a time.
          </Label>
          <Button
            title="Save selected answers"
            disabled={!chosenRows.length || !!loadingKey || busy}
            loading={saving}
            onPress={() => void save()}
          />
          <View style={{ marginTop: 12 }}>
            <Button
              title="Review later"
              secondary
              disabled={saving}
              onPress={leave}
            />
          </View>
          <Label
            style={[
              p.caption,
              { fontSize: 12, marginTop: 16, textAlign: "center" },
            ]}
          >
            Selections apply only to your statement.
          </Label>
        </>
      )}
      <AppSheet
        visible={!!picker}
        title="Select a category"
        onClose={() => setPicker(null)}
      >
        <View style={{ gap: 8 }}>
          {options.map((category) => (
            <Pressable
              key={category}
              accessibilityRole="radio"
              accessibilityLabel={categoryLabel(category)}
              accessibilityState={{
                checked: picker?.rowId
                  ? answers[picker.rowId] === category
                  : groupAnswers[picker?.key ?? ""] === category,
              }}
              onPress={() => choose(category)}
              style={optionStyle}
            >
              <Label>{categoryLabel(category)}</Label>
            </Pressable>
          ))}
        </View>
      </AppSheet>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: -20,
    backgroundColor: "#DCF1FE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: C.blue },
});
