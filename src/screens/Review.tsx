import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, C, Label } from "../components/ui";
import { AppScreen, AppSheet, p, SampleDataNotice } from "../components/AppUI";
import {
  ReviewCard,
  ReviewChoice,
  ReviewTone,
} from "../components/ReviewCard";
import { useAppState } from "../lib/AppProvider";
import { GroupedReview } from "./GroupedReview";

type SampleTransaction = {
  title: string;
  reference: string;
  date: string;
  direction: string;
  directionColor?: string;
  amount: string;
  positive?: boolean;
  category?: string;
  question: string;
  tone: ReviewTone;
  helper: string;
  choices?: ReviewChoice[];
  categoryAction?: boolean;
};

const transactions: SampleTransaction[] = [
  {
    title: "Interswitch Ltd",
    reference: "INTERSWITCH PAYMENT 0701234567",
    date: "1 Jul 2026",
    direction: "Money in",
    directionColor: "#009666",
    amount: "+₦620,000",
    positive: true,
    category: "Income",
    question: "Is this your main salary or income?",
    tone: "required",
    helper: "These affect your totals",
    choices: [
      { id: "income", label: "Yes, it’s my income", icon: "reviewCheck" },
      { id: "transfer", label: "It’s a transfer in", icon: "reviewTransfer" },
    ],
  },
  {
    title: "OPay Transfer",
    reference: "TRF/OPAY/0801234567/PAYMENT",
    date: "8 Jul 2026",
    direction: "Direction unclear",
    directionColor: "#F59E0B",
    amount: "₦15,000",
    category: "Transfers",
    question: "We’re not sure if you sent or received this. Which is it?",
    tone: "required",
    helper: "These affect your totals",
    choices: [
      { id: "spent", label: "I spent this money", icon: "reviewCheck" },
      { id: "received", label: "I received this money", icon: "reviewTransfer" },
    ],
  },
  {
    title: "Access Bank",
    reference: "TRF TO FAITH N / ACCESS SAVINGS",
    date: "5 Jul 2026",
    direction: "Money out",
    amount: "−₦50,000",
    category: "Transfers",
    question: "Did you transfer this to your own account?",
    tone: "optional",
    helper: "Helps separate your account",
    choices: [
      { id: "own", label: "Yes, my own account", icon: "optionalCheck" },
      { id: "expense", label: "No, it’s an expense", icon: "optionalTransfer" },
    ],
  },
  {
    title: "Quickmart Lekki",
    reference: "QUICKMART LEKKI 00147",
    date: "14 Jul 2026",
    direction: "Money out",
    amount: "−₦4,200",
    question: "What kind of spending is this?",
    tone: "category",
    helper: "Improves your breakdown",
    categoryAction: true,
  },
];

function SampleReview() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  return (
    <AppScreen navigation={false} back={() => router.replace("/story")}>
      <View style={styles.step}>
        <View style={styles.stepDot} />
        <Label style={{ fontSize: 12 }}>Step 2 of 2</Label>
      </View>
      <Label style={[p.heading, { marginTop: 32 }]}>
        Review your transactions
      </Label>
      <Label style={p.caption}>
        This helps MoneyLens confirm anything it is not sure about.
      </Label>
      <SampleDataNotice />
      {transactions.map((item, index) => (
        <ReviewCard
          key={item.title}
          tone={item.tone}
          helper={item.helper}
          title={item.title}
          reference={item.reference}
          date={item.date}
          direction={item.direction}
          directionColor={item.directionColor}
          amount={item.amount}
          positive={item.positive}
          category={item.category}
          question={item.question}
          choices={item.choices}
          selected={answers[index]}
          onSelect={(id) => setAnswers({ ...answers, [index]: id })}
          categoryActionLabel={
            item.categoryAction
              ? (answers[index] ?? "Select a category")
              : undefined
          }
          onChooseCategory={
            item.categoryAction ? () => setCategoryOpen(true) : undefined
          }
        />
      ))}
      <Button
        title="Review"
        disabled={!answers[0] || !answers[1]}
        onPress={() => router.replace("/story")}
      />
      <Label
        style={[
          p.caption,
          { fontSize: 12, marginTop: 16, textAlign: "center" },
        ]}
      >
        Selections apply only to this sample statement.
      </Label>
      <AppSheet
        visible={categoryOpen}
        title="Select a category"
        onClose={() => setCategoryOpen(false)}
      >
        <View style={{ gap: 8 }}>
          {["Food", "Shopping", "Transport", "Housing", "Other"].map((label) => (
            <Pressable
              key={label}
              accessibilityRole="radio"
              accessibilityState={{ checked: answers[3] === label }}
              onPress={() => {
                setAnswers({ ...answers, 3: label });
                setCategoryOpen(false);
              }}
              style={[
                styles.option,
                {
                  backgroundColor: "#F0F9FF",
                  borderColor: answers[3] === label ? C.blue : "#DCF1FE",
                },
              ]}
            >
              <Label>{label}</Label>
            </Pressable>
          ))}
        </View>
      </AppSheet>
    </AppScreen>
  );
}

function NoStatement() {
  return (
    <AppScreen back={() => router.replace("/")}>
      <Label style={[p.heading, { marginTop: 32 }]}>
        Review your transactions
      </Label>
      <Label style={p.caption}>
        This helps MoneyLens confirm anything it is not sure about.
      </Label>
      <View style={[p.card, { marginTop: 24 }]}>
        <Label style={p.body}>
          Upload a statement to review your transactions.
        </Label>
        <Label style={[p.caption, { marginBottom: 16 }]}>
          Your last statement stays here until you upload a new one or sign out.
        </Label>
        <Button
          title="Upload a statement"
          onPress={() =>
            router.replace({ pathname: "/", params: { view: "upload" } })
          }
        />
      </View>
    </AppScreen>
  );
}

export function Review() {
  const params = useLocalSearchParams<{
    statementId?: string;
    transactionId?: string;
    sample?: string;
  }>();
  const { activeStatementId } = useAppState();
  if (params.sample === "1") return <SampleReview />;
  const statementId = params.statementId || activeStatementId;
  if (!statementId) return <NoStatement />;
  return (
    <GroupedReview
      statementId={statementId}
      transactionId={params.transactionId}
    />
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
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 28,
    minHeight: 40,
    justifyContent: "center",
  },
});
