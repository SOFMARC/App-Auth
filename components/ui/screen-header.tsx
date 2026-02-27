import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./icon-symbol";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
    color?: string;
  };
}

export function ScreenHeader({ title, subtitle, showBack = true, rightAction }: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction ? (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={rightAction.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol
            name={rightAction.icon as never}
            size={22}
            color={rightAction.color ?? colors.primary}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
  },
  rightButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  rightPlaceholder: {
    width: 36,
  },
});
