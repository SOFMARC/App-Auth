/**
 * IconSymbol — Ícones cross-platform usando MaterialIcons.
 *
 * IMPORTANTE: NÃO importar expo-symbols aqui — é uma biblioteca iOS-only
 * que tenta carregar um módulo nativo ao ser importada, causando crash no Android.
 * Os tipos são definidos localmente.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// Mapeamento SF Symbols (iOS) → Material Icons (Android/Web)
const MAPPING = {
  // Navegação / Tabs
  "house.fill": "home",
  "person.2.fill": "people",
  "building.2.fill": "business",
  "square.grid.2x2.fill": "grid-view",
  "gearshape.fill": "settings",
  // Navegação geral
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "paperplane.fill": "send",
  // Ações CRUD
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
  // Status / Segurança
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
  // Empresa / App
  "building.fill": "business",
  "app.fill": "apps",
  // Logs / Diagnóstico
  "doc.text.fill": "description",
  "doc.text.magnifyingglass": "manage-search",
  "list.bullet": "list",
  "chart.bar.fill": "bar-chart",
  "exclamationmark.circle.fill": "error",
  "ant.fill": "bug-report",
  "clock.fill": "schedule",
  "calendar": "calendar-today",
  // Misc
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-horiz",
  "arrow.right.square.fill": "logout",
  "wifi": "wifi",
  "wifi.slash": "wifi-off",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "filter.fill": "filter-list",
  "bell.fill": "notifications",
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Componente de ícone cross-platform.
 * Usa Material Icons em todas as plataformas (Android, iOS, Web).
 * Os nomes seguem a convenção SF Symbols para consistência de código.
 */
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
  weight?: string; // aceito mas ignorado — apenas para compatibilidade de tipos
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
