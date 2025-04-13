import { View, Text, Image, ImageBackground, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import axios from "axios";
import { TextInput, Checkbox } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { AUTH_KEY, API_URL_BCNKEND } from "@env";

const API_URL = API_URL_BCNKEND;

const SignIn = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { expoPushToken } = useNotification();

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedCredentials = await SecureStore.getItemAsync("credentials");
      if (savedCredentials) {
        const { identifier, password } = JSON.parse(savedCredentials);
        setForm({ identifier, password });
        setRememberMe(true);
      }
    } catch (error) {
      console.log("Error loading saved credentials:", error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync(
          "credentials",
          JSON.stringify({
            identifier: form.identifier,
            password: form.password,
          })
        );
      } else {
        await SecureStore.deleteItemAsync("credentials");
      }
    } catch (error) {
      console.log("Error saving credentials:", error);
    }
  };

  const registerPushToken = async (userId, token) => {
    if (!userId || !token) return;

    try {
      const response = await axios.post(
        `${API_URL}/auth/pushToken`,
        {
          user_id: userId,
          token: token,
        },
        {
          headers: {
            "X-API-Key": AUTH_KEY,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log(
        "Error in registerPushToken:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  const handleLogin = async () => {
    if (!form.identifier || !form.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    console.log(`Logged In`);
    setIsSubmitting(true);
   // console.log(AUTH_KEY);
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          identifier: form.identifier,
          password: form.password,
        },
        {
          headers: {
            "X-API-Key": AUTH_KEY,
          },
        }
      );

      console.log("Response data:", response.data.message);

      if (response.data.user) {
        await login({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          roleId: response.data.user.roleId,
        });
        await saveCredentials();

        // Register push token if available
        if (expoPushToken) {
          try {
            await registerPushToken(response.data.user.id, expoPushToken);
            console.log("Push token registered successfully");
          } catch (tokenError) {
            console.log("Error registering push token:", tokenError);
          }
        }
        console.log("User ID : ", response.data.user.id);
        console.log("Push token: ", expoPushToken);

        // Role-based routing
        if (response.data.user.roleId === 0) {
          router.push("report");
        } else if (response.data.user.roleId === 1) {
          router.push("home");
        }
      }
    } catch (error) {
      console.log(error.response?.data?.message);
      const errorMsg = error.response?.data?.message || "Login failed";
      Alert.alert("Error", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={images.background_signin}
      className="flex-1 h-full"
      resizeMode="cover"
    >
      <View className="flex-1 h-full justify-center">
        <View className="w-full justify-center p-7">
          <View className="flex-row items-center">
            <Image
              source={images.logo}
              resizeMode="contain"
              className="w-[100px] h-[100px] mr-3"
            />
            <Text className="font-psemibold text-3xl">PAL-AI</Text>
          </View>
          <Text className="font-psemibold text-3xl mt-6">Log in</Text>
          <Text className="text-lg">Welcome! Please enter your details.</Text>
          <TextInput
            label="Username / Email"
            value={form.identifier}
            onChangeText={(text) => setForm({ ...form, identifier: text })}
            className="w-full mt-3"
            mode="outlined"
            activeOutlineColor="#006400"
            outlineColor="#CBD2E0"
            textColor="#2D3648"
            theme={{ colors: { background: 'white' } }}
            style={{ backgroundColor: 'white' }}
          />
          <TextInput
            label="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry={!passwordVisible}
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-off" : "eye"}
                color="#006400"
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
            className="w-full mt-1"
            mode="outlined"
            activeOutlineColor="#006400"
            outlineColor="#CBD2E0"
            textColor="#2D3648"
            theme={{ colors: { background: 'white' } }}
            style={{ backgroundColor: 'white' }}
          />
          <View className="flex-row justify-between items-center mt-4">
            <View className="flex-row items-center">
              <Checkbox
                status={rememberMe ? "checked" : "unchecked"}
                onPress={() => setRememberMe(!rememberMe)}
                color="#006400"
              />
              <Text className="ml-2">Remember me</Text>
            </View>
            <Text className="font-semibold text-secondary">
              <Link href="/forgot-password">Forgot password?</Link>
            </Text>
          </View>
          <CustomButton
            title="Log in"
            handlePress={handleLogin}
            // handlePress={() => router.push("report")}
            // handlePress={() => router.push("recommend-treatments")}
            // handlePress={() => router.push("farmers-treatment")}
            containerStyles="w-full mt-5"
            isLoading={isSubmitting}
          />
          <View className="items-center">
            <Text className="mt-3 font-pregular text-sm text-[#4B4B4B]">
              Need an account?{" "}
              <Link href="/sign-up" className="font-psemibold text-secondary">
                Sign up
              </Link>
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default SignIn;
