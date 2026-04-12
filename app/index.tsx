import { useRouter } from "expo-router";
import { Ellipsis, HeartPulse } from "lucide-react-native";
import { Text, View } from "react-native";
import { useEffect } from "react";

export default function HomeScreen() {
  const routers = useRouter();

  useEffect(() => {
    setTimeout(() => {
      routers.push("/(auth)/login");
    }, 1000);
  }, []);

  return (
    <>
      <View className="flex-1 justify-between items-center p-6 bg-primary">
        <View className="items-center justify-center flex-1">
          <View className="items-center justify-center bg-white w-[130px] h-[115px] rounded-3xl mb-8">
            <HeartPulse size={90} color="#279978" />
          </View>

          <Text className="text-6xl font-semibold text-white mb-2">
            Health360
          </Text>

          <Text className="text-white text-lg">
            Your Family Health. All in one Place
          </Text>
        </View>

        <Ellipsis size={40} color="#e5e7eb" />
      </View>
    </>
  );
}
