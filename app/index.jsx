import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { images } from "../constants";
import CustomButton from "../components/CustomButton";
import { useAuth } from "../context/AuthContext"; // Adjust path as needed

export default function Index() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      // if (user.isAuthenticated && user.roleId === 1) {
      //   router.replace("/home");
      // }else if (user.isAuthenticated && user.roleId === 0) {
      //   router.replace("/report");
      // } else {
      //   setIsLoading(false);
      // }
      setIsLoading(false);
    }, 1000); 
    return () => clearTimeout(timer);
  }, [user.isAuthenticated]);

  return (
    <ImageBackground
      source={images.background1}
      className="flex-1 w-full"
      imageStyle={{ opacity: 0.4 }}
    >
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="w-full justify-center items-center h-[85vh] px-7 pt-14">
          <Image
            source={images.logo}
            className="w-[200px] h-[200px]"
            resizeMode="contain"
          />
          <Text className="text-[35px] font-pmedium text-black mt-5 text-center">
            WELCOME TO <Text className="font-psemibold">PAL-AI</Text>
          </Text>

          {isLoading ? (
            <View className="mt-10 p-6 items-center">
              <ActivityIndicator size="large" color="#228B22" style={{ transform: [{ scale: 1.3 }] }} />
              <Text className="mt-4 font-pmedium text-base text-[#228B22] text-center">
                Checking Account...
              </Text>
            </View>
          ) : (
            <>
              <CustomButton
                title="GET STARTED"
                handlePress={() => router.push("/sign-up")}
                containerStyles="w-full mt-3"
              />
              <Text className="mt-3 font-pmedium text-sm text-[#4B4B4B]">
                Have an account?{" "}
                <Link href="/sign-in" className="font-pbold text-secondary">
                  Login
                </Link>
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}