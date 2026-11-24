import { Image, ImageStyle, StyleProp } from "react-native";

/* Metro requires literal paths for bundled assets. */
/* eslint-disable @typescript-eslint/no-require-imports */
export const designAssets = {
  storyPatternTexture: require("../../assets/figma/storyPatternTexture.png"),
  storyPiggyBank: require("../../assets/figma/storyPiggyBank.png"),
  storyIncome: require("../../assets/figma/storyIncome.png"),
  storySpent: require("../../assets/figma/storySpent.png"),
  storyBalance: require("../../assets/figma/storyBalance.png"),
  storyPatternArrow: require("../../assets/figma/storyPatternArrow.png"),
  heroCircleBottom: require("../../assets/figma/heroCircleBottom.png"),
  askSelected: require("../../assets/figma/askSelected.png"),
  search: require("../../assets/figma/search.png"),
  historyTrash: require("../../assets/figma/historyTrash.png"),
  reviewCheck: require("../../assets/figma/reviewCheck.png"),
  reviewTransfer: require("../../assets/figma/reviewTransfer.png"),
  optionalCheck: require("../../assets/figma/optionalCheck.png"),
  optionalTransfer: require("../../assets/figma/optionalTransfer.png"),

  avatar: require("../../assets/figma/avatar.png"),
  edit: require("../../assets/figma/edit.png"),
  personal: require("../../assets/figma/personal.png"),
  notify: require("../../assets/figma/notify.png"),
  security: require("../../assets/figma/security.png"),
  support: require("../../assets/figma/support.png"),
  policies: require("../../assets/figma/policies.png"),
  logout: require("../../assets/figma/logout.png"),
  deleteAccount: require("../../assets/figma/deleteAccount.png"),
  rowChevron: require("../../assets/figma/rowChevron.png"),
  homeOutline: require("../../assets/figma/homeOutline.png"),
  house: require("../../assets/figma/house.png"),
  food: require("../../assets/figma/food.png"),
  car: require("../../assets/figma/car.png"),
  sparkle: require("../../assets/figma/sparkle.png"),
  externalArrow: require("../../assets/figma/externalArrow.png"),
  heroCircle: require("../../assets/figma/heroCircle.png"),
  heroCircleSmall: require("../../assets/figma/heroCircleSmall.png"),
  heroDot: require("../../assets/figma/heroDot.png"),
  clock: require("../../assets/figma/clock.png"),
  compose: require("../../assets/figma/compose.png"),
  lensBlue: require("../../assets/figma/lensBlue.png"),
  send: require("../../assets/figma/send.png"),

  apple: require("../../assets/figma/apple.png"),
  google: require("../../assets/figma/google.png"),
  email: require("../../assets/figma/email.png"),
  code: require("../../assets/figma/code.png"),
  name: require("../../assets/figma/name.png"),
  lock: require("../../assets/figma/lock.png"),
  success: require("../../assets/figma/success.png"),
  error: require("../../assets/figma/error.png"),
  analysing: require("../../assets/figma/analysing.png"),
  financialClarity: require("../../assets/figma/financialClarity.png"),
  spendingTitle: require("../../assets/figma/spendingTitle.png"),
  moneyTitle: require("../../assets/figma/moneyTitle.png"),
  savingTitle: require("../../assets/figma/savingTitle.png"),
  back: require("../../assets/figma/back.png"),
  mail: require("../../assets/figma/mail.png"),
  padlock: require("../../assets/figma/padlock.png"),
  eye: require("../../assets/figma/eye.png"),
  home: require("../../assets/figma/home.png"),
  ask: require("../../assets/figma/ask.png"),
  bell: require("../../assets/figma/bell.png"),
  info: require("../../assets/figma/info.png"),
  trash: require("../../assets/figma/trash.png"),
  upload: require("../../assets/figma/upload.png"),
  arrow: require("../../assets/figma/arrow.png"),
  chevron: require("../../assets/figma/chevron.png"),
  folder: require("../../assets/figma/folder.png"),
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Bundled Figma artwork, rendered at its design geometry without redrawing. */
export function DesignAsset({ name, width, height = width, label, style }: {
  name: keyof typeof designAssets;
  width: number;
  height?: number;
  label?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return <Image source={designAssets[name]} resizeMode="contain"
    accessible={!!label} accessibilityLabel={label}
    style={[{ width, height, flexShrink: 0 }, style]} />;
}
