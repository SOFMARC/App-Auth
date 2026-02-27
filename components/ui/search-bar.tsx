import { useEffect, useRef, useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./icon-symbol";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar...",
  debounceMs = 400,
}: SearchBarProps) {
  const colors = useColors();
  const [localValue, setLocalValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(text: string) {
    setLocalValue(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChangeText(text), debounceMs);
  }

  function handleClear() {
    setLocalValue("");
    onChangeText("");
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={localValue}
        onChangeText={handleChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="xmark" size={16} color={colors.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
});
