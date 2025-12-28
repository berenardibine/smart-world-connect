import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supaseClient";

const VAPID_PUBLIC_KEY = 'placeholder_vapid_key'; // Would need real VAPID key for production

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    registerServiceWorker();
    checkSubscription();
  }, []);

  const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log("Service Worker registered:", reg);
      setRegistration(reg);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("Service Worker ready");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
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
      const reg = await navigator.serviceWorker.ready;
      
      // Store subscription preference in database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // Store that user has enabled notifications
        await supabase.from("push_subscriptions").upsert({
          user_id: session.user.id,
          endpoint: "browser_notifications_enabled",
          p256dh: "enabled",
          auth: "enabled"
        }, {
          onConflict: "user_id,endpoint"
        });
      }

      setIsSubscribed(true);
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", session.user.id);
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  };

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === "granted" && registration) {
      registration.showNotification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        ...options
      });
    } else if (permission === "granted") {
      // Fallback to basic notification
      new Notification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        ...options
      });
    }
  }, [permission, registration]);

  return {
    permission,
    isSubscribed,
    loading,
    requestPermission,
    unsubscribe,
    showLocalNotification,
    isSupported: "Notification" in window && "serviceWorker" in navigator
  };
};
