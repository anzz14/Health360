import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    BriefcaseMedical,
    ClipboardList,
    House,
    Users,
} from "lucide-react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="familyCareDashboard"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="familyCareDashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => {
            return <House size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="familyInfo"
        options={{
          title: "Family",
          tabBarIcon: ({ color }) => {
            return <Users size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="manageFamily"
        options={{
          title: "Manage",
          tabBarIcon: ({ color }) => {
            return <ClipboardList size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="userDetail"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => {
            return <BriefcaseMedical size={28} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
