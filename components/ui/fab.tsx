import { TouchableOpacity, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./icon-symbol";

interface FABProps {
  onPress: () => void;
  label?: string;
  icon?: string;
  color?: string;
}

export function FAB({ onPress, label, icon = "plus", color }: FABProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bgColor = color ?? colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: bgColor, bottom: 24 + insets.bottom },
        label ? styles.fabExtended : styles.fabRound,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <IconSymbol name={icon as never} size={22} color="#fff" />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabRound: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
  },
  fabExtended: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
