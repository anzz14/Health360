import { Tabs } from "expo-router";
import { Platform, View, StyleSheet, Text } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import {
  Home,
  ClipboardList,
  ShoppingCart,
  User,
} from "lucide-react-native";
import { BlurView } from "expo-blur";

const TEAL = "#069594";
const INACTIVE = "#94A3B8";
const BORDER = "#E2E8F0";

function ConsultTabButton({ onPress }: any) {
  return (
    <View style={styles.fabWrapper} pointerEvents="box-none">
      <View style={styles.fabShadow} />
      <View style={styles.fabButton}>
        <View style={styles.fabIconContainer}>
          <Text style={styles.fabIcon}>＋</Text>
        </View>
      </View>
      <Text style={styles.fabLabel}>Consult</Text>
    </View>
  );
}

function TabIcon({
  Icon,
  color,
  size = 20,
}: {
  Icon: any;
  color: string;
  size?: number;
}) {
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="familyCareDashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TEAL,
        tabBarInactiveTintColor: INACTIVE,
        tabBarButton: HapticTab,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              tint="light"
              intensity={60}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />
          ),
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="familyCareDashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon Icon={Home} color={color} />,
        }}
      />

      {/* Records */}
      <Tabs.Screen
        name="familyInfo"
        options={{
          title: "Records",
          tabBarIcon: ({ color }) => (
            <TabIcon Icon={ClipboardList} color={color} />
          ),
        }}
      />

      {/* Consult — center FAB */}
      <Tabs.Screen
        name="manageFamily"
        options={{
          title: "",
          tabBarButton: (props) => <ConsultTabButton {...props} />,
        }}
      />

      {/* Orders */}
      <Tabs.Screen
        name="userDetail"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <TabIcon Icon={ShoppingCart} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon Icon={User} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.8)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarAndroid: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  tabItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },

  // FAB styles
  fabWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: 56,
    bottom: 20,
    position: "relative",
  },
  fabShadow: {
    position: "absolute",
    top: 0,
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: "transparent",
    shadowColor: "#2ECC8B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: TEAL,
    borderWidth: 4,
    borderColor: "#F8FDFB",
    alignItems: "center",
    justifyContent: "center",
  },
  fabIconContainer: {
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "300",
  },
  fabLabel: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: INACTIVE,
    fontWeight: "500",
    textAlign: "center",
  },
});