// admin
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Tabs } from "expo-router";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { icons } from "../../constants";
import { NotificationProvider, useNotification } from "../../context/NotificationContext";
import { Provider as PaperProvider } from "react-native-paper";
import { useRouter } from "expo-router";

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

// Custom tab bar that includes logout button
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login screen after logout
      router.replace("sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
          >
            {options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? "#2C9C4B" : "#000064",
            })}
          </TouchableOpacity>
        );
      })}
      
      {/* Logout Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={handleLogout}
      >
        <TabIcon
          icon={icons.logout || icons.profile}
          color="#000064"
          name="Logout"
          focused={false}
        />
      </TouchableOpacity>
    </View>
  );
};

// Create a wrapper component for tabs content to use context
const TabsContent = () => {
  return (
    <>
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
        tabBar={(props) => <CustomTabBar {...props} />}
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
  badge: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 2,
    borderTopColor: '#C8C8C8',
    height: 84,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default TabsLayout;