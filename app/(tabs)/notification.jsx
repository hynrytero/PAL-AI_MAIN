import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { Avatar, Card, IconButton, Menu, Button, Divider, Surface } from "react-native-paper";
import { images } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { useNotification } from "../../context/NotificationContext";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const API_URL = API_URL_BCNKEND;

const { width, height } = Dimensions.get('window');

const Notification = () => {

  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const groups = {};

    notifications.forEach(notification => {
      const date = new Date(notification.timestamp);
      const dateKey = format(date, "MMMM d, yyyy");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(notification);
    });

    return groups;
  };

  const fetchNotifications = async () => {
    if (!user || !user.id) return;

    try {
      const response = await axios.get(`${API_URL}/notifications/user/${user.id}`, {
        headers: {
          'X-API-Key': AUTH_KEY
        }
      });

      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_URL}/notifications/notifications-user/${notificationId}/read`,
        null,
        {
          headers: {
            'X-API-Key': AUTH_KEY
          }
        }
      );

      // Update local state to mark notification as read
      setNotifications(notifications.map(note =>
        note.id === notificationId ? { ...note, read: true } : note
      ));

      // Trigger refresh for badge counter
      triggerRefresh();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/notifications-user/${notificationId}/unread`,
        null,
        {
          headers: {
            'X-API-Key': AUTH_KEY
          }
        });

      // Update local state to mark notification as unread
      setNotifications(notifications.map(note =>
        note.id === notificationId ? { ...note, read: false } : note
      ));

      // Trigger refresh for badge counter
      triggerRefresh();
    } catch (error) {
      console.error("Error marking notification as unread:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !user.id) return;

    try {
      await axios.put(`${API_URL}/notifications/notifications-all/${user.id}/read-all`,
        null,
        {
          headers: {
            'X-API-Key': AUTH_KEY
          }
        });

      // Update local state
      setNotifications(notifications.map(note => ({ ...note, read: true })));
      Alert.alert("Success", "All notifications marked as read");

      // Trigger refresh for badge counter
      triggerRefresh();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      Alert.alert("Error", "Failed to mark notifications as read");
    }
  };

  const markAllAsUnread = async () => {
    if (!user || !user.id) return;

    try {
      await axios.put(`${API_URL}/notifications/notifications-all/${user.id}/unread-all`,
        null,
        {
          headers: {
            'X-API-Key': AUTH_KEY
          }
        });

      // Update local state
      setNotifications(notifications.map(note => ({ ...note, read: false })));
      Alert.alert("Success", "All notifications marked as unread");

      // Trigger refresh for badge counter
      triggerRefresh();
    } catch (error) {
      console.error("Error marking all notifications as unread:", error);
      Alert.alert("Error", "Failed to mark notifications as unread");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API_URL}/notifications/delete/${notificationId}`, {
        headers: {
          'X-API-Key': AUTH_KEY
        }
      });

      // Remove from local state
      setNotifications(notifications.filter(note => note.id !== notificationId));

      // Trigger refresh for badge counter
      triggerRefresh();
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  const clearAllNotifications = async () => {
    if (!user || !user.id) return;

    try {
      await axios.delete(`${API_URL}/notifications/delete-all/${user.id}/clear`, {
        headers: {
          'X-API-Key': AUTH_KEY
        }
      });

      setNotifications([]);
      Alert.alert("Success", "All notifications cleared");

      // Trigger refresh for badge counter
      triggerRefresh();
    } catch (error) {
      console.error("Error clearing notifications:", error);
      Alert.alert("Error", "Failed to clear notifications");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, refreshTrigger]);

  const showMenu = (id) => setMenuVisible(id);
  const hideMenu = () => setMenuVisible(null);

  const getIconName = (iconName) => {
    // Default to bell if icon name is not recognized
    const validIcons = ["leaf", "weather-rainy", "weather-sunny", "bell", "alert"];
    return validIcons.includes(iconName) ? iconName : "bell";
  };

  const handleNotificationPress = (notification) => {
    // Mark as read when viewing details
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Set the selected notification and show modal
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    // Add a small delay before clearing the selected notification to prevent visual glitches
    setTimeout(() => setSelectedNotification(null), 300);
  };

  // Function to open mark-all menu
  const [markAllMenuVisible, setMarkAllMenuVisible] = useState(false);
  const toggleMarkAllMenu = () => setMarkAllMenuVisible(!markAllMenuVisible);

  const renderNotificationModal = () => {
    if (!selectedNotification) return null;

    // Format the timestamp more attractively
    const formattedTime = format(new Date(selectedNotification.timestamp), "EEEE, MMM d, yyyy 'at' h:mm a");

    // Get a suitable background color based on notification type or category
    const getModalHeaderColor = () => {
      const iconColor = selectedNotification.iconBgColor || '#4285F4';
      return iconColor;
    };

    return (
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 justify-end">
            <Surface className="bg-white rounded-t-3xl overflow-hidden elevation-5" style={{ maxHeight: height * 0.85 }}>
              {/* Colorful header based on notification type */}
              <View style={{ backgroundColor: getModalHeaderColor(), padding: 16 }}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Avatar.Icon
                      size={36}
                      icon={getIconName(selectedNotification.icon)}
                      color="white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                    />
                    <Text className="text-white font-psemibold text-lg ml-2">Notification</Text>
                  </View>
                  <IconButton
                    icon="close"
                    iconColor="white"
                    onPress={closeModal}
                  />
                </View>
              </View>

              {/* Pull handle */}
              <View className="items-center py-2">
                <View className="w-10 h-1 rounded-full bg-gray-300" />
              </View>

              {/* Notification content section */}
              <ScrollView 
                className="px-5" 
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                {/* Title */}
                <Text className="font-psemibold text-xl mt-2 mb-3">{selectedNotification.title}</Text>

                {/* Timestamp in nice format */}
                <View className="flex-row items-center mb-4">
                  <IconButton icon="clock-outline" size={20} style={{ margin: 0 }} />
                  <Text className="text-gray-500 text-xs ml-1">{formattedTime}</Text>
                </View>

                <Divider className="mb-5" />

                {/* Subtitle/content in a card for better visual separation */}
                <Surface className="bg-gray-50 p-4 rounded-lg mb-5 elevation-1">
                  <Text className="text-base">{selectedNotification.subtitle}</Text>
                </Surface>

                {/* Display image from data column if available */}
                {selectedNotification.data && selectedNotification.data.imageUrl && (
                  <View className="mb-5">
                    <Text className="font-pmedium mb-1">Notification Image</Text>
                    <Surface className="bg-gray-50 p-4 rounded-lg elevation-1">
                      <Image
                        source={{ uri: selectedNotification.data.imageUrl }}
                        className="w-full h-48 rounded-lg"
                        resizeMode="cover"
                      />
                    </Surface>
                  </View>
                )}

                {/* If there are any additional details */}
                {selectedNotification.details && (
                  <View className="mb-5">
                    <Text className="font-pmedium mb-2">Additional Information</Text>
                    <Surface className="bg-gray-50 p-4 rounded-lg elevation-1">
                      <Text>{selectedNotification.details}</Text>
                    </Surface>
                  </View>
                )}
              </ScrollView>

              {/* Action buttons */}
              <Surface className="p-4 bg-white border-t border-gray-300 flex-row justify-end space-x-3 elevation-2">

                <Button
                  mode="outlined"
                  icon="delete-outline"
                  onPress={() => {
                    deleteNotification(selectedNotification.id);
                    closeModal();
                  }}
                  textColor="#228B22"
                  style={{
                    borderColor: '#228B22',
                    borderWidth: 2
                  }}
                >
                  Delete
                </Button>
                <Button
                  mode="contained"
                  icon="check"
                  onPress={closeModal}
                  buttonColor="#228B22"
                >
                  Done
                </Button>
              </Surface>
            </Surface>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <ImageBackground
        source={images.background_history}
        className="flex-1 h-full w-full bg-white"
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </ImageBackground>
    );
  }

  const groupedNotifications = groupNotificationsByDate();

  return (
    <ImageBackground
      source={images.background_history}
      className="flex-1 h-full w-full bg-white"
    >
      <StatusBar translucent backgroundColor="transparent" />
      <ScrollView
        className="mt-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SafeAreaView className="px-7 w-full h-full mb-10">
          <View className="flex-row items-center justify-between w-full mb-3">
            <Text className="font-pmedium text-[30px]">Notification</Text>
            <View className="flex-row">
              {/* Mark all menu */}
              <Menu
                visible={markAllMenuVisible}
                onDismiss={() => setMarkAllMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="check-all"
                    onPress={toggleMarkAllMenu}
                  />
                }
                contentStyle={{ backgroundColor: 'white' }}
              >
                <Menu.Item
                  onPress={() => {
                    markAllAsRead();
                    setMarkAllMenuVisible(false);
                  }}
                  title="Mark all as read"
                  leadingIcon="email-check"
                />
                <Menu.Item
                  onPress={() => {
                    markAllAsUnread();
                    setMarkAllMenuVisible(false);
                  }}
                  title="Mark all as unread"
                  leadingIcon="email-mark-as-unread"
                />
              </Menu>

              <IconButton
                icon="delete-sweep"
                onPress={() => {
                  Alert.alert(
                    "Clear Notifications",
                    "Are you sure you want to delete all notifications?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      {
                        text: "Delete",
                        onPress: () => clearAllNotifications(),
                        style: "destructive"
                      }
                    ]
                  );
                }}
              />
            </View>
          </View>

          {Object.keys(groupedNotifications).length > 0 ? (
            Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
              <View key={date}>
                <Text className="font-psemibold mt-2">{date}</Text>
                {dateNotifications.map(notification => (
                  <Card
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    style={{
                      marginVertical: 4,
                      backgroundColor: notification.read ? 'white' : '#f0f6ff',
                    }}
                    elevation={notification.read ? 1 : 3}
                  >
                    <Card.Title
                      title={notification.title}
                      subtitle={notification.subtitle}
                      titleStyle={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                      left={(props) => (
                        <Avatar.Icon
                          {...props}
                          icon={getIconName(notification.icon)}
                          color="white"
                          style={{ backgroundColor: notification.iconBgColor }}
                        />
                      )}
                      right={(props) => (
                        <Menu
                          visible={menuVisible === notification.id}
                          onDismiss={hideMenu}
                          anchor={
                            <IconButton
                              {...props}
                              icon="dots-vertical"
                              onPress={() => showMenu(notification.id)}
                            />
                          }
                          contentStyle={{ backgroundColor: 'white' }}
                        >
                          {notification.read ? (
                            <Menu.Item
                              onPress={() => {
                                markAsUnread(notification.id);
                                hideMenu();
                              }}
                              title="Mark as unread"
                              leadingIcon="email-mark-as-unread"
                            />
                          ) : (
                            <Menu.Item
                              onPress={() => {
                                markAsRead(notification.id);
                                hideMenu();
                              }}
                              title="Mark as read"
                              leadingIcon="email-check"
                            />
                          )}
                          <Menu.Item
                            onPress={() => {
                              deleteNotification(notification.id);
                              hideMenu();
                            }}
                            title="Delete"
                            leadingIcon="delete"
                          />
                        </Menu>
                      )}
                    />
                  </Card>
                ))}
              </View>
            ))
          ) : (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="font-pmedium text-lg text-gray-500">No notifications</Text>
            </View>
          )}
        </SafeAreaView>
      </ScrollView>

      {renderNotificationModal()}
    </ImageBackground>
  );
};

export default Notification;