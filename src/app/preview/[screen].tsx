import { Redirect, useLocalSearchParams } from "expo-router";
const targets = { profile: "/profile", settings: "/settings", ask: "/ask", history: "/history", story: "/story", spending: "/spending", review: "/review" } as const;
export function generateStaticParams() {
  return Object.keys(targets).map(screen => ({ screen }));
}
export default function LegacyPreviewRoute() {
  const { screen, section, q } = useLocalSearchParams<{ screen?: string; section?: string; q?: string }>();
  const key = screen ?? "";
  const target = Object.hasOwn(targets, key) ? targets[key as keyof typeof targets] : "/";
  return (
    <Redirect
      href={{
        pathname: target,
        params: {
          ...(section ? { section } : {}),
          ...(q ? { q } : {}),
          ...(key === "review" ? { sample: "1" } : {}),
        },
      }}
    />
  );
}
