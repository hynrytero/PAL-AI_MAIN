// user
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, Tabs, usePathname } from "expo-router";
import { AuthProvider } from "../../context/AuthContext";
import { icons } from "../../constants";
import CustomFAB from "../../components/CustomFloatingActionButton";
import { NotificationProvider, useNotification } from "../../context/NotificationContext";
import { Provider as PaperProvider } from 'react-native-paper';

// Get screen dimensions
const { height } = Dimensions.get('window');

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

const CustomMapsButton = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.mapsButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={icons.maps}
        resizeMode="contain"
        tintColor="#FFFFFF"
        style={styles.mapsIcon}
      />
      <Text style={styles.mapsText}>Maps</Text>
    </TouchableOpacity>
  );
};

// Create a wrapper component for tabs content to use context
const TabsContent = () => {
  const pathname = usePathname();
  const isOnMapsScreen = pathname === "/maps";
  const isOnProfileScreen = pathname === "/profile";

  return (
    <>
      {/* Custom Maps Button at the top - only show when NOT on maps and profile screen */}
      {!isOnMapsScreen && !isOnProfileScreen && (
        <View style={styles.mapsContainer}>
          <CustomMapsButton onPress={() => router.push("maps")} />
        </View>
      )}
      
      {/* This code is for bottom navigation bar */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2C9C4B",
          tabBarInactiveTintColor: "#000064",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#C8C8C8",
            height: 84,
            justifyContent: "space-between", 
          },
        }}
      >
        {/* This tab is for home screen (weather) */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.home}
                color={color}
                name="Home"
                focused={focused}
              />
            ),
          }}
        />
        {/* This tab is for the history of the disease captured */}
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.clock}
                color={color}
                name="History"
                focused={focused}
              />
            ),
          }}
        />
        {/* Maps tab - hidden but still available for navigation */}
        <Tabs.Screen
          name="maps"
          options={{
            title: "Maps",
            headerShown: false,
            tabBarButton: () => null, 
          }}
        />
        {/* Dummy tab for spacing */}
        <Tabs.Screen
          name="empty"
          options={{
            title: "Camera",
            headerShown: false,
            // Non-interactive custom tab button
            tabBarButton: (props) => (
              <View
                style={[
                  props.style,
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 57, 
                  },
                ]}
              >
                <TabIcon color="#2C9C4B" />
                <Text 
                  style={{ 
                    color: "#2C9C4B", 
                    fontWeight: "bold", 
                    fontSize: 12, 
                    marginTop: 5,
                  }}
                >
                  Capture
                </Text>
              </View>
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
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Profile"
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>

      {/* Floating Action Button */}
      <CustomFAB
        onPress={() => router.push("camera")}
        iconSource={icons.camera}
      />
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
  mapsContainer: {
    position: "absolute",
    bottom: 93, 
    right: 20,
    zIndex: 999, 
  },
  mapsButton: {
    backgroundColor: "#2C9C4B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapsIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  mapsText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
    zIndex: 999,
  }
});

export default TabsLayout;