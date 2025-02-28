import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";

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

  const notificationListener = useRef();
  const responseListener = useRef();

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
          if (isMounted) setNotification(notification);
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
          // Handle the notification response here
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

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
};
