import { Button } from "@/components/button/button";
import { Input } from "@/components/inputs/input";
import { Typography } from "@/components/typography/typography";
import { useAuth } from "@/context/auth-context";
import { Link, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";

import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";

export default function CreateAccountScreen() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirm) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      // On success -> _layout.tsx detects session + no phone -> redirects to addPhone
    }
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
          <View className="px-4 pt-4 h-16 justify-center">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full items-center justify-center"
            >
              <ArrowLeft size={22} color="#374151" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-7 pt-4">
            <View className="items-center mb-9">
              <Typography variant="h2" color="heading" className="mb-2.5">
                Create Account
              </Typography>
              <Typography variant="body" color="default">
                Join thousands of families managing health together
              </Typography>
            </View>

            <View className="gap-5">
              <View>
                <Typography
                  variant="body"
                  color="heading"
                  className="mb-2 ml-0.5"
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
                  variant="body"
                  color="heading"
                  className="mb-2 ml-0.5"
                >
                  Password
                </Typography>
                <Input
                  placeholder="Min. 6 characters"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View>
                <Typography
                  variant="body"
                  color="heading"
                  className="mb-2 ml-0.5"
                >
                  Confirm Password
                </Typography>
                <Input
                  placeholder="Repeat password"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
            </View>

            {error ? (
              <Typography
                variant="body-small"
                color="error"
                className="mt-3 ml-1"
              >
                {error}
              </Typography>
            ) : null}

            <Button
              title="Create Account"
              onPress={handleSignUp}
              variant="primary"
              rounded="full"
              size="lg"
              loading={loading}
              className="mt-6"
            />

            <View className="flex-1 justify-end pb-8 pt-8 items-center">
              <Typography variant="body-small" color="default">
                Already have an account?{" "}
                <Link href="/(auth)/login">
                  <Typography variant="body-small" color="primary">
                    {" "}
                    Log In
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