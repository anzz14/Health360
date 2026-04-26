import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
import { useAuth } from "@/context/auth-context";
import { Link } from "expo-router";
import { ScanHeart } from "lucide-react-native";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    View,
} from "react-native";

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
    // On success, _layout.tsx auth listener auto-redirects to (tabs)
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center pt-12 pb-6">
            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 border border-gray-200">
              <ScanHeart size={48} color="#069494" />
            </View>
            <Typography
              variant="h3"
              color="heading"
              className="-tracking-[1px]"
            >
              Welcome Back
            </Typography>
            <Typography variant="body" color="secondary" className="mt-2">
              Log in to your family health portal
            </Typography>
          </View>

          <View className="flex-1 px-6 pb-14 gap-4 mt-4">
            <View>
              <Typography
                variant="body-small"
                color="default"
                className="mb-1 ml-1"
              >
                Email
              </Typography>
              <Input
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Typography
                variant="body-small"
                color="default"
                className="mb-1 ml-1"
              >
                Password
              </Typography>
              <Input
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <Typography variant="body-small" color="error" className="ml-1">
                {error}
              </Typography>
            ) : null}

            <Button
              title="Log In"
              onPress={handleLogin}
              variant="primary"
              rounded="2xl"
              size="lg"
              loading={loading}
              className="mt-2"
            />

            <View className="items-center mt-4">
              <Typography variant="body-small" color="default">
                Don't have an account?{" "}
                <Link href="/(auth)/createAccount">
                  <Typography variant="body-small" color="primary">
                    {" "}
                    Sign Up
                  </Typography>
                </Link>
              </Typography>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}