import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Switch,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appsApi, rolesApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { AppRole } from "@/lib/types/api";

export default function AppRolesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [roleName, setRoleName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [roleAtivo, setRoleAtivo] = useState(true);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppRole | null>(null);

  const { data: app } = useQuery({
    queryKey: ["app", id],
    queryFn: () => appsApi.get(Number(id)),
    enabled: !!id,
  });

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesApi.list(Number(id)),
    enabled: !!id,
  });

  const createRole = useMutation({
    mutationFn: () =>
      rolesApi.create(Number(id), {
        name: roleName.trim(),
        key: roleKey.trim().toUpperCase(),
        ativo: roleAtivo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
      showSuccess("Role criada!");
      setRoleName("");
      setRoleKey("");
      setRoleAtivo(true);
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  const updateRole = useMutation({
    mutationFn: () =>
      rolesApi.update(Number(id), editingRole!.id, {
        name: roleName.trim(),
        key: editingRole!.key,
        ativo: roleAtivo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
      showSuccess("Role atualizada!");
      setEditingRole(null);
      setRoleName("");
      setRoleKey("");
      setRoleAtivo(true);
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  const deleteRole = useMutation({
    mutationFn: () => rolesApi.delete(Number(id), deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
      showSuccess("Role excluída.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
      setDeleteTarget(null);
    },
  });

  function startEdit(role: AppRole) {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleKey(role.key);
    setRoleAtivo(role.ativo);
  }

  function cancelEdit() {
    setEditingRole(null);
    setRoleName("");
    setRoleKey("");
    setRoleAtivo(true);
  }

  function handleSave() {
    if (!roleName.trim()) { showError("Nome é obrigatório."); return; }
    if (!editingRole && !roleKey.trim()) { showError("Chave é obrigatória."); return; }
    if (editingRole) {
      updateRole.mutate();
    } else {
      createRole.mutate();
    }
  }

  const isSubmitting = createRole.isPending || updateRole.isPending;

  return (
    <ScreenContainer>
      <ScreenHeader title="Roles" subtitle={app?.name} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Formulário */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="shield.fill" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {editingRole ? `Editar: ${editingRole.name}` : "Nova Role"}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nome <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={roleName}
              onChangeText={setRoleName}
              placeholder="Ex: Administrador"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
            />
          </View>

          {!editingRole && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Chave (Key) <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={roleKey}
                onChangeText={(t) => setRoleKey(t.toUpperCase())}
                placeholder="Ex: ADMIN"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.foreground }]}>Role Ativa</Text>
            <Switch
              value={roleAtivo}
              onValueChange={setRoleAtivo}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={roleAtivo ? colors.primary : colors.muted}
            />
          </View>

          <View style={styles.formButtons}>
            {editingRole && (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={cancelEdit}
              >
                <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary, flex: editingRole ? 1 : undefined },
                isSubmitting && styles.disabled,
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{editingRole ? "Salvar" : "Criar Role"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Roles */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Roles ({roles.length})
          </Text>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : roles.length === 0 ? (
            <EmptyState icon="shield.fill" title="Nenhuma role" subtitle="Crie a primeira role acima" />
          ) : (
            roles.map((role) => (
              <View
                key={role.id}
                style={[styles.roleItem, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <View style={styles.roleInfo}>
                  <View style={styles.roleRow}>
                    <View style={[styles.keyBadge, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.keyBadgeText, { color: colors.primary }]}>{role.key}</Text>
                    </View>
                    <Text style={[styles.roleName, { color: colors.foreground }]}>{role.name}</Text>
                  </View>
                  <StatusBadge active={role.ativo} size="sm" />
                </View>
                <View style={styles.roleActions}>
                  <TouchableOpacity
                    style={[styles.roleActionBtn, { backgroundColor: colors.primary + "15" }]}
                    onPress={() => startEdit(role)}
                  >
                    <IconSymbol name="pencil" size={14} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleActionBtn, { backgroundColor: colors.error + "15" }]}
                    onPress={() => setDeleteTarget(role)}
                  >
                    <IconSymbol name="trash.fill" size={14} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Excluir Role"
        message={`Deseja excluir a role "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={deleteRole.isPending}
        onConfirm={() => deleteRole.mutate()}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 20 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: "center", minWidth: 120 },
  disabled: { opacity: 0.7 },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  roleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  roleInfo: { flex: 1, gap: 6 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  keyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  keyBadgeText: { fontSize: 11, fontWeight: "700" },
  roleName: { fontSize: 14, fontWeight: "600" },
  roleActions: { flexDirection: "row", gap: 8 },
  roleActionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
