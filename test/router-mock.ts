import { jest } from "@jest/globals";
import { useEffect, useState } from "react";
const listeners = new Set<(next: Record<string, string>) => void>();
export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  setParams: (next: Record<string, string>) => {
    listeners.forEach((update) => update(next));
  },
};
export function useLocalSearchParams() {
  const [params, setParams] = useState<Record<string, string>>({});
  useEffect(() => {
    listeners.add(setParams);
    return () => {
      listeners.delete(setParams);
    };
  }, []);
  return params;
}
