import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supaseClient";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return false;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        await subscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // For now, we'll just track that user wants notifications
      // Full VAPID implementation would require server-side keys
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // Store that user has enabled notifications
        await supabase.from("push_subscriptions").upsert({
          user_id: session.user.id,
          endpoint: "browser_notifications_enabled",
          p256dh: "placeholder",
          auth: "placeholder"
        }, {
          onConflict: "user_id,endpoint"
        });
      }

      setIsSubscribed(true);
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    }
  };

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options
      });
    }
  }, [permission]);

  return {
    permission,
    isSubscribed,
    loading,
    requestPermission,
    showLocalNotification,
    isSupported: "Notification" in window && "serviceWorker" in navigator
  };
};