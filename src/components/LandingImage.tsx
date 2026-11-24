import { useEffect, useState } from "react";
import { Image, StyleProp, View, ViewStyle } from "react-native";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { SvgXml } from "react-native-svg";
import { landingAssets, LandingAssetName } from "./landingAssets";

export type LandingImageProps = {
  name: LandingAssetName;
  width: number;
  height: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
  fit?: "contain" | "cover";
};
const svgCache = new Map<number, Promise<string>>();

function loadSvg(source: number) {
  let pending = svgCache.get(source);
  if (!pending) {
    pending = Asset.fromModule(source).downloadAsync().then((asset) => {
      if (!asset.localUri) throw new Error("Landing artwork could not be loaded");
      return new File(asset.localUri).text();
    });
    svgCache.set(source, pending);
    void pending.catch(() => svgCache.delete(source));
  }
  return pending;
}

/** Preserve the original SVG geometry while fitting its containing design slot. */
export function LandingImage({ name, width, height, label, style, fit = "contain" }: LandingImageProps) {
  const asset = landingAssets[name];
  const [xml, setXml] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (asset.svg) {
      void loadSvg(asset.source).then((text) => { if (active) setXml(text); }).catch(() => {});
    }
    return () => { active = false; };
  }, [asset]);
  if (!asset.svg) return <View style={[{ width, height }, style]}><Image source={asset.source} accessibilityLabel={label} accessible={!!label}
    resizeMode={fit} style={{ width, height }} /></View>;
  const scale = Math.min(width / asset.width, height / asset.height);
  return <View accessibilityLabel={label} accessible={!!label}
    style={[{ width, height, alignItems: "center", justifyContent: "center" }, style]}>
    <View style={{ width: asset.width, height: asset.height, transform: [{ scale }] }}>
      <SvgXml xml={xml} />
    </View>
  </View>;
}
