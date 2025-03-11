// _layout.jsx in (admin-screen) folder
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../../context/AuthContext";
import { NotificationProvider } from "../../context/NotificationContext";

const AdminScreenLayout = () => {
  return (
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
              name="edit-treatment"
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
              name="farmers-treatment"
              options={{
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

export default AdminScreenLayout;
