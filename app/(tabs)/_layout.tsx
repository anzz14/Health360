import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { User, UserPlus } from "lucide-react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="login"
        options={{
          title: "Login",
          tabBarIcon: ({ color }) => {
            return <User size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="createAccount"
        options={{
          title: "CreateAccount",
          tabBarIcon: ({ color }) => {
            return <UserPlus size={28} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
