import { jest } from "@jest/globals";
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";
jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

jest.mock("expo-router", () => jest.requireActual("./router-mock"));
// Native font registration is supplied by the OS in the app; no filesystem asset
// registry exists in Jest's renderer. Layout tests do not exercise font loading.
jest.mock("expo-font", () => ({
  isLoaded: () => true,
  isLoading: () => false,
  loadAsync: jest.fn(async () => {}),
  useFonts: () => [true, null],
}));
