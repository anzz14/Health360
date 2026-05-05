import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/store/app-store";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "@/lib/supabase";
import "react-native-reanimated";
import "./global.css";

import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { session, loading } = useAuth();
  const fetchAll = useAppStore((s) => s.fetchAll);
  const resetStore = useAppStore((s) => s.reset);
  const segments = useSegments();
  const router = useRouter();

  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const prevSegments = useRef<typeof segments | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setHasProfile(null);
      setProfileChecked(false);
      return;
    }

    let cancelled = false;

    const checkProfile = async () => {
      try {
        // ✅ Use the correct 'profiles' table and join via auth_user_id
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (!cancelled) {
          // Profile exists if we got a row with a non‑empty full_name
          setHasProfile(!!data?.full_name?.trim());
          setProfileChecked(true);
        }
      } catch (err) {
        console.error("Profile check error:", err);
        if (!cancelled) {
          setHasProfile(false);
          setProfileChecked(true);
        }
      }
    };

    checkProfile();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (loading) return;
    if (session && !profileChecked) return;

    const inAuthGroup = segments[0] === "(auth)";
    // ✅ Correct onboarding path segments: (tabs)/onboarding/profileDetails
    const inOnboarding = segments[0] === "(tabs)" && segments[1] === "onboarding";
    const wasInOnboarding =
      prevSegments.current?.[0] === "(tabs)" &&
      prevSegments.current?.[1] === "onboarding";

    prevSegments.current = segments;

    // Not logged in → go to login
    if (!session) {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    // Logged in but no profile → go to profile details screen
    if (!hasProfile) {
      if (!inOnboarding && !wasInOnboarding) {
        // ✅ Use the correct route name: profileDetails (not userDetail)
        router.replace("/(tabs)/onboarding/userDetail");
      }
      return;
    }

    // Logged in and has profile → go to main dashboard
    if (inAuthGroup) {
      router.replace("/(tabs)/familyCareDashboard");
    }
  }, [session, loading, profileChecked, hasProfile, segments, router]);

  useEffect(() => {
    if (session) fetchAll();
    else resetStore();
  }, [session, fetchAll, resetStore]);

  if (loading || (session && !profileChecked)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#069594" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const colorScheme = useColorScheme();
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={colorScheme === "light" ? DarkTheme : DefaultTheme}>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}