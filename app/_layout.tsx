import "@/global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View, ActivityIndicator } from "react-native";
import "@/lib/_core/nativewind-pressable";

import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { CompanyProvider } from "@/lib/company-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { flushLogs } from "@/lib/logger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export const unstable_settings = {
  anchor: "(auth)",
};

/**
 * AuthGuard — controla a navegação baseada no estado de autenticação.
 *
 * Regras:
 * - Enquanto isLoading=true: mostra tela de carregamento, não navega
 * - Não autenticado + fora do grupo (auth): redireciona para login
 * - Autenticado + dentro do grupo (auth): redireciona para tabs
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = (segments as string[])[0];
    const inAuthGroup = firstSegment === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login" as never);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)" as never);
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1A3A5C",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    return () => {
      flushLogs();
    };
  }, []);

  const content = (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CompanyProvider>
              <ToastProvider>
                <AuthGuard>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="settings-url" />
                    <Stack.Screen name="users/[id]" />
                    <Stack.Screen name="users/new" />
                    <Stack.Screen name="users/[id]/edit" />
                    <Stack.Screen name="users/[id]/permissions" />
                    <Stack.Screen name="companies/[id]" />
                    <Stack.Screen name="companies/new" />
                    <Stack.Screen name="companies/[id]/edit" />
                    <Stack.Screen name="apps/[id]" />
                    <Stack.Screen name="apps/new" />
                    <Stack.Screen name="apps/[id]/edit" />
                    <Stack.Screen name="apps/[id]/roles" />
                    <Stack.Screen name="oauth/callback" />
                  </Stack>
                </AuthGuard>
                <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
              </ToastProvider>
            </CompanyProvider>
          </AuthProvider>
        </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {content}
    </SafeAreaProvider>
  );
}
