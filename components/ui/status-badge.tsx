import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
  size = "md",
}: StatusBadgeProps) {
  const colors = useColors();
  const color = active ? colors.success : colors.error;
  const label = active ? activeLabel : inactiveLabel;

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }, size === "sm" && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === "sm" && styles.smText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  smText: {
    fontSize: 11,
  },
});
