import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navegação
  "house.fill": "home",
  "person.2.fill": "people",
  "building.2.fill": "business",
  "app.fill": "apps",
  "gearshape.fill": "settings",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "paperplane.fill": "send",
  // Ações
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "pencil": "edit",
  "trash.fill": "delete",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "xmark": "close",
  "magnifyingglass": "search",
  "arrow.clockwise": "refresh",
  "power": "power-settings-new",
  // Status
  "checkmark.seal.fill": "verified",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "key.fill": "key",
  "shield.fill": "security",
  // Usuário
  "person.fill": "person",
  "person.crop.circle.fill": "account-circle",
  "person.badge.plus.fill": "person-add",
  "person.badge.minus.fill": "person-remove",
  // Empresa
  "building.fill": "business",
  // App
  "square.grid.2x2.fill": "grid-view",
  // Misc
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-horiz",
  "arrow.right.square.fill": "logout",
  "wifi": "wifi",
  "wifi.slash": "wifi-off",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
