import { Ellipsis, HeartPulse } from "lucide-react-native";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center bg-gradient-to-br from-[#279978] to-[#1B3A4F] p-6">
      <View className="flex-1 items-center justify-center">
        <View className="flex items-center justify-center bg-white w-[150px] h-[150px] rounded-3xl mb-5">
          <HeartPulse size={80} color="#279978" />
        </View>

        <Text className="text-6xl font-semibold text-white mb-2">
          Health360
        </Text>

        <Text className="text-white text-lg">
          Your Family Health. All in one Place
        </Text>
      </View>

      <Ellipsis size={40} color="white" className="mt-auto" />
    </View>
  );
}
