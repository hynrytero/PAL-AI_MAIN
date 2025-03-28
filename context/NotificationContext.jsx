import React, { 
  createContext, 
  useContext, 
  useState,  
  useEffect, 
  useRef 
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { API_URL_BCNKEND, AUTH_KEY } from '@env';

const API_URL = API_URL_BCNKEND;

const NotificationContext = createContext(undefined);

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
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();
  const currentUserId = useRef(null);

  useEffect(() => {
    // Create a variable to track if the component is mounted
    let isMounted = true;
    
    registerForPushNotificationsAsync()
      .then(token => {
        if (isMounted) setExpoPushToken(token);
      })
      .catch(err => {
        if (isMounted) setError(err);
      });

    // Only set up listeners if they don't already exist
    if (!notificationListener.current) {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        notification => {
          console.log("🔔 Notification Received:", notification);
          if (isMounted) {
            setNotification(notification);
            // Trigger refresh when notification is received
            setRefreshTrigger(prev => prev + 1);
          }
        }
      );
    }

    if (!responseListener.current) {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        response => {
          console.log(
            "🔔 Notification Response:",
            JSON.stringify(response, null, 2),
            JSON.stringify(response.notification.request.content.data, null, 2)
          );
          // Also trigger refresh when user responds to a notification
          if (isMounted) {
            setRefreshTrigger(prev => prev + 1);
          }
        }
      );
    }

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
        notificationListener.current = null;
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = null;
      }
    };
  }, []);

  // Reset unread count when user changes
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      currentUserId.current = null;
      return;
    }

    // Check if user ID has changed
    if (user.id !== currentUserId.current) {
      // Reset unread count immediately when switching users
      setUnreadCount(0);
      currentUserId.current = user.id;
      // Then trigger a refresh to fetch the correct count
      setRefreshTrigger(prev => prev + 1);
    }
  }, [user]);

  // Fetch unread count whenever user changes or refresh is triggered
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user || !user.id) {
        setUnreadCount(0);
        return;
      }
  
      try {
        const response = await axios.get(`${API_URL}/notifications/user/${user.id}`, {
          headers: {
            'X-API-Key': AUTH_KEY
          }
        });
        
        // Count unread notifications from the existing endpoint
        const unreadNotifications = response.data.filter(notification => !notification.read);
        const count = unreadNotifications.length;
        console.log(`Unread notifications count: ${count}`); // Add logging
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread notification count:", error);
        setUnreadCount(0);
      }
    };
  
    fetchUnreadCount();
  }, [user, refreshTrigger]);

  // trigger a refresh
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <NotificationContext.Provider value={{ 
      expoPushToken, 
      notification, 
      error, 
      refreshTrigger,
      triggerRefresh,
      unreadCount,
      currentUserId: currentUserId.current // Expose current user ID for debugging if needed
    }}>
      {children}
    </NotificationContext.Provider>
  );
};