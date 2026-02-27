import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useCompany } from "@/lib/company-context";
import { IconSymbol } from "./icon-symbol";
import { StatusBadge } from "./status-badge";
import type { Company } from "@/lib/types/api";

interface CompanySelectorProps {
  visible: boolean;
  onClose: () => void;
}

function CompanyOption({
  company,
  isSelected,
  onPress,
}: {
  company: Company;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.option,
        {
          backgroundColor: isSelected ? colors.primary + "12" : colors.background,
          borderColor: isSelected ? colors.primary + "40" : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: isSelected ? colors.primary + "20" : colors.surface },
        ]}
      >
        <IconSymbol name="building.fill" size={18} color={isSelected ? colors.primary : colors.muted} />
      </View>
      <View style={styles.optionInfo}>
        <Text
          style={[
            styles.optionName,
            { color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? "700" : "500" },
          ]}
          numberOfLines={1}
        >
          {company.name}
        </Text>
        <Text style={[styles.optionId, { color: colors.muted }]}>ID: {company.id}</Text>
      </View>
      <View style={styles.optionRight}>
        <StatusBadge active={company.ativo} size="sm" />
        {isSelected && (
          <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export function CompanySelectorModal({ visible, onClose }: CompanySelectorProps) {
  const colors = useColors();
  const { companies, selectedCompany, selectCompany, isLoading } = useCompany();

  function handleSelect(company: Company | null) {
    selectCompany(company);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Selecionar Empresa
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
                Filtra dados em todas as telas
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Opção "Todas" */}
          <TouchableOpacity
            style={[
              styles.allOption,
              {
                backgroundColor: !selectedCompany ? colors.primary + "12" : colors.surface,
                borderColor: !selectedCompany ? colors.primary + "40" : colors.border,
                marginHorizontal: 16,
                marginTop: 12,
              },
            ]}
            onPress={() => handleSelect(null)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: !selectedCompany ? colors.primary + "20" : colors.background }]}>
              <IconSymbol name="building.2.fill" size={18} color={!selectedCompany ? colors.primary : colors.muted} />
            </View>
            <View style={styles.optionInfo}>
              <Text
                style={[
                  styles.optionName,
                  { color: !selectedCompany ? colors.primary : colors.foreground, fontWeight: !selectedCompany ? "700" : "500" },
                ]}
              >
                Todas as Empresas
              </Text>
              <Text style={[styles.optionId, { color: colors.muted }]}>
                Sem filtro aplicado
              </Text>
            </View>
            {!selectedCompany && (
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Lista de empresas */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Carregando empresas...</Text>
            </View>
          ) : (
            <FlatList
              data={companies}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <CompanyOption
                  company={item}
                  isSelected={selectedCompany?.id === item.id}
                  onPress={() => handleSelect(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Botão compacto para abrir o seletor de empresa — usado nos headers das telas */
export function CompanySelectorButton({
  onPress,
}: {
  onPress: () => void;
}) {
  const colors = useColors();
  const { selectedCompany } = useCompany();

  return (
    <TouchableOpacity
      style={[
        styles.selectorButton,
        {
          backgroundColor: selectedCompany ? colors.primary + "15" : colors.surface,
          borderColor: selectedCompany ? colors.primary + "40" : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol
        name="building.fill"
        size={14}
        color={selectedCompany ? colors.primary : colors.muted}
      />
      <Text
        style={[
          styles.selectorButtonText,
          { color: selectedCompany ? colors.primary : colors.muted },
        ]}
        numberOfLines={1}
      >
        {selectedCompany ? selectedCompany.name : "Todas"}
      </Text>
      <IconSymbol name="chevron.right" size={12} color={selectedCompany ? colors.primary : colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  sheetSubtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  allOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  divider: {
    height: 0.5,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: { flex: 1, gap: 3 },
  optionName: { fontSize: 15 },
  optionId: { fontSize: 12 },
  optionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 160,
  },
  selectorButtonText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
