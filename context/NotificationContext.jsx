import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]); // Store history of notifications
  const [error, setError] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Handler for clearing notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setNotification(null);
  }, []);

  // Handler for removing a specific notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.request.identifier !== notificationId)
    );
  }, []);

  // Handler for sending local notifications
  const sendLocalNotification = useCallback(async (content) => {
    try {
      const notificationContent = {
        title: content.title || "Notification",
        body: content.body,
        data: content.data || {},
      };

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: content.trigger || null,
      });
    } catch (error) {
      setError(error);
      console.error("Error sending local notification:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (isMounted) setExpoPushToken(token);
      } catch (error) {
        if (isMounted) setError(error);
      }
    };

    initializeNotifications();

    // Set up notification received listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("🔔 Notification Received: ", notification);
      if (isMounted) {
        setNotification(notification);
        setNotifications(prev => [...prev, notification]);
      }
    });

    // Set up notification response listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(
        "🔔 Notification Response: ",
        JSON.stringify(response, null, 2),
        JSON.stringify(response.notification.request.content.data, null, 2)
      );
      
      // Add custom handling for notification responses here
      // For example, navigation or data processing
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const value = {
    expoPushToken,
    notification,
    notifications, // Expose notification history
    error,
    clearNotifications, // Expose clear function
    removeNotification, // Expose remove function
    sendLocalNotification, // Expose local notification function
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};