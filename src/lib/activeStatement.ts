import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "moneylens.activeStatement";

export type StoredActiveStatement = {
  userId: string;
  statementId: string;
  savedAt: number;
};

/** Only the statement ID is stored locally; transactions stay on the backend. */
export async function readActiveStatement(): Promise<StoredActiveStatement | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredActiveStatement>;
    if (
      typeof value.userId !== "string" ||
      typeof value.statementId !== "string" ||
      typeof value.savedAt !== "number"
    )
      return null;
    return {
      userId: value.userId,
      statementId: value.statementId,
      savedAt: value.savedAt,
    };
  } catch {
    return null;
  }
}

export async function writeActiveStatement(
  value: StoredActiveStatement,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

export async function clearActiveStatement(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
