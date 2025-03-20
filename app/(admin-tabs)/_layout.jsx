// admin
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Tabs } from "expo-router";
import { AuthProvider } from "../../context/AuthContext";
import { icons } from "../../constants";
import { NotificationProvider, useNotification } from "../../context/NotificationContext";
import { Provider as PaperProvider } from "react-native-paper";

const TabIcon = ({ icon, color, name, focused, showBadge = false }) => {
  return (
    <View className="items-center justify-center gap-2">
      <View>
        <Image
          source={icon}
          resizeMode="contain"
          tintColor={color}
          className="w-6 h-6"
        />
        {showBadge && (
          <View 
            className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3"
            style={styles.badge}
          />
        )}
      </View>
      <Text
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  );
};

// Wrapper for notification tab that includes badge
const NotificationTabWithBadge = ({ color, focused }) => {
  const { unreadCount } = useNotification();
  
  return (
    <TabIcon
      icon={icons.bell}
      color={color}
      name="Notification"
      focused={focused}
      showBadge={unreadCount > 0}
    />
  );
};

// Create a wrapper component for tabs content to use context
const TabsContent = () => {
  return (
    <>
      {/* This code is for bottom navigation bar */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2C9C4B",
          tabBarInactiveTintColor: "#000064",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 2,
            borderTopColor: "#C8C8C8",
            height: 84,
            justifyContent: "space-between", // Ensure tabs are evenly spaced
          },
        }}
      >
        {/* This tab is for home screen (weather) */}
        <Tabs.Screen
          name="report"
          options={{
            title: "Report",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.report}
                color={color}
                name="Report"
                focused={focused}
              />
            ),
          }}
        />
        {/* This tab is for the history of the disease captured */}
        <Tabs.Screen
          name="treatment"
          options={{
            title: "Treatment",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.treatment}
                color={color}
                name="Treatment"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Notification",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <NotificationTabWithBadge
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Users"
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
      <StatusBar style="dark" />
    </>
  );
};

const TabsLayout = () => {
  return (
    <PaperProvider>
      <NotificationProvider>
        <AuthProvider>
          <TabsContent />
        </AuthProvider>
      </NotificationProvider>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 50, // Adjust based on your tab bar height
    alignSelf: "center",
    backgroundColor: "#2C9C4B", // Green background for FAB
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // Adds shadow for Android
    shadowColor: "#000", // Adds shadow for iOS
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  badge: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    elevation: 2,
  }
});

export default TabsLayout;