import { Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../../context/AuthContext";
import { NotificationProvider } from "../../context/NotificationContext";

const ScreenLayout = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <>
          <Stack>
            <Stack.Screen
              name="camera"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="result"
              options={{
                title: "Result",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="treatment"
              options={{
                title: "treatment",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="nearby"
              options={{
                title: "Store Nearby",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="editprofile"
              options={{
                title: "Edit Profile",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="manage"
              options={{
                title: "Manage",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="recommend-treatments"
              options={{
                title: "Recommend Treatments",
                headerShown: false,
              }}
            />
          </Stack>

          <StatusBar style="dark" />
        </>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default ScreenLayout;
