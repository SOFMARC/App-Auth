import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi, appsApi, rolesApi, iamApi, usersApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Company, App, AppRole, AccessSnapshot } from "@/lib/types/api";
import { useAuth } from "@/lib/auth-context";

function DropdownPicker<T extends { id: number; name: string }>({
  label,
  items,
  selectedId,
  onSelect,
  placeholder,
  loading,
}: {
  label: string;
  items: T[];
  selectedId: number | null;
  onSelect: (item: T) => void;
  placeholder: string;
  loading?: boolean;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === selectedId);

  return (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerLabel, { color: colors.foreground }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.pickerText, { color: selected ? colors.foreground : colors.muted }]}>
              {selected?.name ?? placeholder}
            </Text>
            <IconSymbol
              name={open ? "xmark" : "chevron.right"}
              size={16}
              color={colors.muted}
            />
          </>
        )}
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {items.length === 0 ? (
            <Text style={[styles.dropdownEmpty, { color: colors.muted }]}>Nenhum item</Text>
          ) : (
            items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownItem,
                  item.id === selectedId && { backgroundColor: colors.primary + "15" },
                ]}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: item.id === selectedId ? colors.primary : colors.foreground },
                  ]}
                >
                  {item.name}
                </Text>
                {item.id === selectedId && (
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function UserPermissionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const { access: myAccess } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AccessSnapshot | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.get(Number(id)),
    enabled: !!id,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companiesApi.list(),
  });

  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => appsApi.list(),
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles", selectedApp?.id],
    queryFn: () => rolesApi.list(selectedApp!.id),
    enabled: !!selectedApp,
  });

  // Acessos atuais do usuário (via snapshot do login ou endpoint)
  const { data: userAccess = [], refetch: refetchAccess } = useQuery({
    queryKey: ["user-access", id],
    queryFn: () => iamApi.getUserAccess(Number(id)),
    enabled: !!id,
  });

  const grantAccess = useMutation({
    mutationFn: () =>
      iamApi.grant({
        userId: Number(id),
        companyId: selectedCompany!.id,
        appKey: selectedApp!.key,
        roleKey: selectedRole!.key,
      }),
    onSuccess: () => {
      showSuccess("Permissão concedida com sucesso!");
      refetchAccess();
      setSelectedCompany(null);
      setSelectedApp(null);
      setSelectedRole(null);
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  const revokeAccess = useMutation({
    mutationFn: () =>
      iamApi.revoke({
        userId: Number(id),
        companyId: revokeTarget!.companyId,
        appKey: revokeTarget!.appKey,
      }),
    onSuccess: () => {
      showSuccess("Permissão revogada.");
      refetchAccess();
      setRevokeTarget(null);
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
      setRevokeTarget(null);
    },
  });

  function handleGrant() {
    if (!selectedCompany) { showError("Selecione uma empresa."); return; }
    if (!selectedApp) { showError("Selecione um app."); return; }
    if (!selectedRole) { showError("Selecione uma role."); return; }
    grantAccess.mutate();
  }

  const appsWithName = apps.map((a) => ({ ...a, name: `${a.name} (${a.key})` }));
  const rolesWithName = roles.map((r) => ({ ...r, name: `${r.name} (${r.key})` }));

  // Usar acessos do snapshot se o endpoint não retornar dados
  const displayAccess = userAccess.length > 0 ? userAccess : [];

  return (
    <ScreenContainer>
      <ScreenHeader title="Permissões" subtitle={user?.nome} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Conceder Permissão */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="key.fill" size={18} color={colors.success} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Conceder Permissão</Text>
          </View>

          <DropdownPicker
            label="Empresa"
            items={companies.map((c) => ({ ...c, id: c.id, name: c.name }))}
            selectedId={selectedCompany?.id ?? null}
            onSelect={(c) => setSelectedCompany(c as Company)}
            placeholder="Selecione uma empresa..."
            loading={loadingCompanies}
          />

          <DropdownPicker
            label="App"
            items={appsWithName}
            selectedId={selectedApp?.id ?? null}
            onSelect={(a) => {
              setSelectedApp(a as App);
              setSelectedRole(null);
            }}
            placeholder="Selecione um app..."
            loading={loadingApps}
          />

          {selectedApp && (
            <DropdownPicker
              label="Role"
              items={rolesWithName}
              selectedId={selectedRole?.id ?? null}
              onSelect={(r) => setSelectedRole(r as AppRole)}
              placeholder="Selecione uma role..."
              loading={loadingRoles}
            />
          )}

          <TouchableOpacity
            style={[
              styles.grantButton,
              { backgroundColor: colors.success },
              grantAccess.isPending && styles.disabled,
            ]}
            onPress={handleGrant}
            disabled={grantAccess.isPending}
            activeOpacity={0.8}
          >
            {grantAccess.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
                <Text style={styles.grantButtonText}>Conceder Acesso</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Permissões Atuais */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="shield.fill" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Permissões Atuais</Text>
          </View>

          {displayAccess.length === 0 ? (
            <EmptyState
              icon="key.fill"
              title="Nenhuma permissão"
              subtitle="Conceda acesso usando o formulário acima"
            />
          ) : (
            displayAccess.map((access, idx) => (
              <View
                key={idx}
                style={[styles.accessItem, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <View style={styles.accessInfo}>
                  <View style={styles.accessRow}>
                    <View style={[styles.appBadge, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.appBadgeText, { color: colors.primary }]}>
                        {access.appKey}
                      </Text>
                    </View>
                    <Text style={[styles.roleName, { color: colors.foreground }]}>
                      {access.roleName}
                    </Text>
                  </View>
                  <Text style={[styles.companyName, { color: colors.muted }]}>
                    {access.companyName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.revokeBtn, { backgroundColor: colors.error + "15" }]}
                  onPress={() => setRevokeTarget(access as AccessSnapshot)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="xmark" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={!!revokeTarget}
        title="Revogar Permissão"
        message={`Deseja revogar o acesso ao app "${revokeTarget?.appKey}" na empresa "${revokeTarget?.companyName}"?`}
        confirmLabel="Revogar"
        destructive
        loading={revokeAccess.isPending}
        onConfirm={() => revokeAccess.mutate()}
        onCancel={() => setRevokeTarget(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  pickerContainer: { gap: 6 },
  pickerLabel: { fontSize: 13, fontWeight: "600" },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  pickerText: { fontSize: 14, flex: 1 },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: { fontSize: 14, flex: 1 },
  dropdownEmpty: { padding: 14, fontSize: 13 },
  grantButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  disabled: { opacity: 0.7 },
  grantButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  accessItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  accessInfo: { flex: 1, gap: 4 },
  accessRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  appBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  appBadgeText: { fontSize: 11, fontWeight: "700" },
  roleName: { fontSize: 14, fontWeight: "600" },
  companyName: { fontSize: 12 },
  revokeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
