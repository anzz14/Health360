import { useRouter } from "expo-router";
import { Ellipsis, HeartPulse } from "lucide-react-native";
import { Text, View } from "react-native";
import { useEffect } from "react";

export default function HomeScreen() {
  const routers = useRouter();

  useEffect(() => {
    setTimeout(() => {
      routers.push("/(tabs)/login");
    }, 1000);
  }, []);

  return (
    <>
      {/* <LinearGradient
        colors={["#008080", "#fff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 justify-center items-center p-6"
      > */}
      <View className="flex-1 justify-center items-center p-6 bg-primary">
        <View className=" items-center justify-center ">
          <View className="flex items-center justify-center bg-white w-[150px] h-[150px] rounded-3xl mb-5">
            <Text>
              <HeartPulse size={80} color="#279978" />
            </Text>
          </View>

          <Text className="text-6xl font-semibold text-white mb-2">
            Health360
          </Text>

          <Text className="text-white text-lg">
            Your Family Health. All in one Place
          </Text>
          <Ellipsis size={40} color="white" className="mt-auto" />
        </View>
      </View>

      {/* </LinearGradient> */}
    </>
  );
}
