module.exports = {
  preset: "jest-expo",
  testMatch: ["**/test/**/*.native.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/test/native-setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo-google-fonts/.*|react-native-svg|react-native-safe-area-context|@react-native-async-storage/.*)/)",
  ],
};
