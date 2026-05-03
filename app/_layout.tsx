import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { useAppStore } from "@/store/app-store";
>>>>>>> c2de038cc344cc7f0559012f7cce5c82e84996fc
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
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

  // Check if user_profiles row exists whenever session changes
  useEffect(() => {
    if (!session?.user) {
      setHasProfile(null);
      setProfileChecked(false);
      return;
    }

    let cancelled = false;

    const checkProfile = async () => {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!cancelled) {
          setHasProfile(!!data);
          setProfileChecked(true);
        }
      } catch {
        if (!cancelled) {
          // On error, assume no profile → send to onboarding
          setHasProfile(false);
          setProfileChecked(true);
        }
      }
    };

    checkProfile();
    return () => { cancelled = true; };
  }, [session]);

  // Routing logic runs after both auth and profile check are done
  useEffect(() => {
    if (loading) return;
    if (session && !profileChecked) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(tabs)" && segments[1] === "onboarding";

    if (!session) {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    if (!hasProfile) {
      // Logged in but no profile → onboarding
      if (!inOnboarding) router.replace("/(tabs)/onboarding/userDetail");
    } else {
      // Profile exists → dashboard
      if (inAuthGroup || inOnboarding) {
        router.replace("/(tabs)/familyCareDashboard");
      }
    }
  }, [session, loading, profileChecked, hasProfile, segments, router]);

  // Spinner while auth loads or profile check is in flight
  if (loading || (session && !profileChecked)) {
  // Initialize global store when user logs in / out
  useEffect(() => {
    if (session) fetchAll();
    else resetStore();
  }, [session, fetchAll, resetStore]);

  if (loading) {
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
    <AuthProvider>
      <BottomSheetModalProvider>
        <ThemeProvider value={colorScheme === "light" ? DarkTheme : DefaultTheme}>
          <RootNavigator />
          <StatusBar style="auto" />
        </ThemeProvider>
      </BottomSheetModalProvider>
    </AuthProvider>
  );
}