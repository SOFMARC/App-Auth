import "@/global.css";
import { useEffect, useCallback, useMemo, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Platform, View, ActivityIndicator } from "react-native";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";

import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { CompanyProvider } from "@/lib/company-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  SafeAreaProvider,
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { ErrorBoundary } from "@/components/error-boundary";
import { flushLogs } from "@/lib/logger";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  // Âncora padrão — necessário para o Expo Router funcionar corretamente
  anchor: "(auth)",
};

/**
 * AuthGuard — controla a navegação baseada no estado de autenticação.
 *
 * Regras:
 * - Enquanto isLoading=true: não navega (mostra loading)
 * - Não autenticado + fora do grupo (auth): redireciona para login
 * - Autenticado + dentro do grupo (auth): redireciona para tabs
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Aguardar a restauração da sessão antes de qualquer redirect
    if (isLoading) return;

    const firstSegment = (segments as string[])[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";

    if (!isAuthenticated && !inAuthGroup) {
      // Usuário não autenticado tentando acessar área protegida
      router.replace("/(auth)/login" as never);
    } else if (isAuthenticated && inAuthGroup) {
      // Usuário autenticado na tela de login — redirecionar para o app
      router.replace("/(tabs)" as never);
    }
    // Se já está no lugar certo, não faz nada
  }, [isAuthenticated, isLoading, segments]);

  // Mostrar loading enquanto verifica a sessão salva
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A3A5C" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
    return () => { flushLogs(); };
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      })
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
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
        </trpc.Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );

  if (Platform.OS === "web") {
    return (
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>
            {content}
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
  );
}
