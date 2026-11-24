import { Asset } from "expo-asset";
import { Image, View } from "react-native";
import type { LandingImageProps } from "./LandingImage";
import { landingAssets } from "./landingAssets";

export function LandingImage({ name, width, height, label, style, fit = "contain" }: LandingImageProps) {
  const asset = landingAssets[name];
  if (!asset.svg) return <View style={[{ width, height }, style]}><Image source={asset.source} accessibilityLabel={label} accessible={!!label}
    resizeMode={fit} style={{ width, height }} /></View>;
  // Scale the wrapper so the downloaded SVG keeps its intrinsic root dimensions.
  const scale = Math.min(width / asset.width, height / asset.height);
  return <View style={[{ width, height, alignItems: "center", justifyContent: "center" }, style]}>
    <img src={Asset.fromModule(asset.source).uri} alt={label ?? ""}
      width={asset.width} height={asset.height}
      draggable={false} style={{ display: "block", flexShrink: 0, transform: `scale(${scale})` }} />
  </View>;
}
