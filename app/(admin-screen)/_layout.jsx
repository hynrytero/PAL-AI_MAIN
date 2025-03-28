// _layout.jsx in (admin-screen) folder
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../../context/AuthContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { PaperProvider } from "react-native-paper";

const AdminScreenLayout = () => {
  return (
    <PaperProvider>
      <NotificationProvider>
        <AuthProvider>
          <>
            <Stack>
              <Stack.Screen
                name="treatment-details"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="viewuser"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="disease-treatments"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="view-treatments"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="notification-manager"
                options={{
                  headerShown: false,
                }}
              />
              
            </Stack>

            <StatusBar style="dark" />
          </>
        </AuthProvider>
      </NotificationProvider>
    </PaperProvider>
  );
};

export default AdminScreenLayout;
