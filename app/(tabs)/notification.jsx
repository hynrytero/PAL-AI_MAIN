import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { Avatar, Card, IconButton } from "react-native-paper";
import { useNotification } from "../../context/NotificationContext";
import { images } from "../../constants";

const NotificationScreen = () => {
  const { 
    notification, 
    notifications: contextNotifications, 
    error,
    clearNotifications,
    removeNotification,
    sendLocalNotification 
  } = useNotification();

  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Convert incoming notifications to grouped format
  const processNotification = (notificationData) => {
    const { title, body, data } = notificationData.request.content;
    
    return {
      id: notificationData.request.identifier,
      title,
      subtitle: body,
      icon: data?.icon || "bell",
      iconBgColor: data?.iconBgColor || "gray",
      iconColor: "white",
      type: data?.type || "general",
      timestamp: new Date(notificationData.date).getTime()
    };
  };

  // Group notifications by date
  const groupNotificationsByDate = (notificationsList) => {
    const groups = notificationsList.reduce((acc, notification) => {
      const date = new Date(notification.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const existingGroup = acc.find(group => group.date === date);
      
      if (existingGroup) {
        existingGroup.items.push(notification);
      } else {
        acc.push({
          id: date,
          date,
          items: [notification]
        });
      }
      
      return acc;
    }, []);

    // Sort groups by date (newest first) and sort items within groups
    return groups
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(group => ({
        ...group,
        items: group.items.sort((a, b) => b.timestamp - a.timestamp)
      }));
  };

  // Update notifications when context changes
  useEffect(() => {
    if (contextNotifications?.length) {
      const processedNotifications = contextNotifications.map(processNotification);
      const groupedNotifications = groupNotificationsByDate(processedNotifications);
      setNotifications(groupedNotifications);
    }
  }, [contextNotifications]);

  // Handle new notification received
  useEffect(() => {
    if (notification) {
      const processedNotification = processNotification(notification);
      setNotifications(prevNotifications => {
        const allNotifications = [...prevNotifications.flatMap(group => group.items), processedNotification];
        return groupNotificationsByDate(allNotifications);
      });
    }
  }, [notification]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Implement your refresh logic here
      // For example, re-fetch notifications from your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleNotificationPress = (notification) => {
    Alert.alert(
      notification.title,
      notification.subtitle,
      [
        {
          text: "View Details",
          onPress: () => {
            // Implement navigation to detailed view
            console.log("Navigate to details for:", notification);
          }
        },
        {
          text: "Dismiss",
          style: "cancel"
        }
      ]
    );
  };

  const handleNotificationOptions = (notification) => {
    Alert.alert(
      "Options",
      "Choose an action",
      [
        {
          text: "Mark as Read",
          onPress: () => {
            // Implement mark as read logic
            console.log("Mark as read:", notification.id);
          }
        },
        {
          text: "Delete",
          onPress: () => {
            removeNotification(notification.id);
          },
          style: "destructive"
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleSettingsPress = () => {
    Alert.alert(
      "Notification Settings",
      "Choose an option",
      [
        {
          text: "Mark All as Read",
          onPress: () => {
            // Implement mark all as read logic
            console.log("Mark all as read");
          }
        },
        {
          text: "Clear All",
          onPress: () => clearNotifications(),
          style: "destructive"
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const renderNotificationCard = (notification) => (
    <TouchableOpacity
      key={`${notification.id}-${notification.title}`}
      onPress={() => handleNotificationPress(notification)}
    >
      <Card.Title
        title={notification.title}
        subtitle={notification.subtitle}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={notification.icon}
            color={notification.iconColor}
            style={{ backgroundColor: notification.iconBgColor }}
          />
        )}
        right={(props) => (
          <IconButton
            {...props}
            icon="dots-vertical"
            onPress={() => handleNotificationOptions(notification)}
          />
        )}
      />
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={images.background_history}
      className="flex-1 h-full w-full bg-white"
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView
        className="mt-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SafeAreaView className="px-7 w-full h-full mb-10">
          <View className="flex-row items-center justify-between w-full mb-3">
            <Text className="font-pmedium text-[30px]">Notifications</Text>
            <IconButton
              icon="bell-outline"
              size={24}
              onPress={handleSettingsPress}
            />
          </View>

          {error && (
            <View className="bg-red-100 p-3 rounded-lg mb-3">
              <Text className="text-red-500">
                Error: {error.message}
              </Text>
            </View>
          )}

          {notifications.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Avatar.Icon
                size={64}
                icon="bell-off-outline"
                style={{ backgroundColor: '#e0e0e0' }}
              />
              <Text className="text-gray-500 mt-4 text-center">
                No notifications yet
              </Text>
            </View>
          ) : (
            notifications.map((group) => (
              <View key={group.id} className="mb-6">
                <Text className="font-psemibold mb-2">{group.date}</Text>
                {group.items.map(renderNotificationCard)}
              </View>
            ))
          )}
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

export default NotificationScreen;