import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { DesignAsset } from "./DesignAsset";
import { C, Label } from "./ui";

export type ReviewTone = "required" | "optional" | "category";

export type ReviewChoice = {
  id: string;
  label: string;
  icon: "reviewCheck" | "reviewTransfer" | "optionalCheck" | "optionalTransfer";
};

const tones = {
  required: { color: "#EF3E2E", pale: "#FFF1F1" },
  optional: { color: "#F59E0B", pale: "#FFF8EC" },
  category: { color: C.blue, pale: "#F0F9FF" },
};

/**
 * The Figma review card. Both the design sample and the live review screen use
 * this component so real review groups keep the same visual language.
 */
export function ReviewCard({
  tone = "required",
  helper,
  title,
  reference,
  date,
  direction,
  directionColor,
  amount,
  positive = false,
  category,
  question,
  choices = [],
  selected,
  onSelect,
  categoryActionLabel,
  onChooseCategory,
  children,
  style,
}: {
  tone?: ReviewTone;
  helper?: string;
  title: string;
  reference?: string;
  date: string;
  direction: string;
  directionColor?: string;
  amount: string;
  positive?: boolean;
  category?: string;
  question: string;
  choices?: ReviewChoice[];
  selected?: string;
  onSelect?: (id: string) => void;
  categoryActionLabel?: string;
  onChooseCategory?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { color, pale } = tones[tone];
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.badgeRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Label style={{ fontSize: 12 }}>
            {tone === "required" ? "Required" : "Optional"}
          </Label>
        </View>
        {!!helper && <Label style={styles.helper}>{helper}</Label>}
      </View>
      <View style={[styles.transaction, { borderTopColor: color }]}>
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <View style={{ flex: 1 }}>
            <Label style={styles.body}>{title}</Label>
            {!!reference && <Label style={styles.meta}>{reference}</Label>}
            <Label style={styles.meta}>
              {date}  ·  <Label style={[styles.meta, { color: directionColor ?? (positive ? "#009666" : "#808893") }]}>{direction}</Label>
            </Label>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <Label style={{ fontSize: 14, color: positive ? "#009666" : "black" }}>
              {amount}
            </Label>
            {!!category && (
              <Label style={[styles.category, { backgroundColor: pale, color }]}>
                {category}
              </Label>
            )}
          </View>
        </View>
        <View style={styles.rule} />
        <Label style={styles.question}>{question}</Label>
        {!!choices.length && (
          <View style={{ gap: 8 }}>
            {choices.map((choice) => {
              const checked = selected === choice.id;
              return (
                <Pressable
                  key={choice.id}
                  accessibilityRole="radio"
                  accessibilityLabel={choice.label}
                  accessibilityState={{ checked }}
                  onPress={() => onSelect?.(choice.id)}
                  style={[
                    styles.option,
                    {
                      borderColor: checked ? color : pale,
                      backgroundColor: pale,
                    },
                  ]}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <DesignAsset
                      name={choice.icon}
                      width={
                        choice.icon === "reviewCheck" ||
                        choice.icon === "optionalCheck"
                          ? 10
                          : 11
                      }
                    />
                    <Label style={{ fontSize: 12, color }}>{choice.label}</Label>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        {!!categoryActionLabel && !!onChooseCategory && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={categoryActionLabel}
            onPress={onChooseCategory}
            style={[
              styles.option,
              styles.row,
              {
                borderColor: pale,
                backgroundColor: pale,
                marginTop: choices.length ? 8 : 0,
              },
            ]}
          >
            <Label style={{ fontSize: 12 }}>{categoryActionLabel}</Label>
            <DesignAsset name="chevron" width={16} />
          </Pressable>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 7 },
  helper: { fontSize: 11, color: "#808893" },
  transaction: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    borderTopWidth: 2,
    shadowColor: "#0A3152",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  body: { fontSize: 14, lineHeight: 18 },
  meta: { fontSize: 11, color: "#808893", marginTop: 5, lineHeight: 14 },
  category: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    overflow: "hidden",
  },
  rule: { height: 1, backgroundColor: "#D6D6D6", marginVertical: 16 },
  question: {
    fontSize: 14,
    lineHeight: 18,
    color: "#48505B",
    marginBottom: 16,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 28,
    minHeight: 40,
    justifyContent: "center",
  },
});
