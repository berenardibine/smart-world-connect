import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supaseClient";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const installed = localStorage.getItem("pwa_installed") === "true";
    setIsInstalled(installed);

    // Check if we should show reminder
    const lastReminder = localStorage.getItem("pwa_last_reminder");
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    const shouldShowReminder = !installed && (!lastReminder || now - parseInt(lastReminder) > threeDays);

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      localStorage.setItem("installPromptAvailable", "true");
      
      if (shouldShowReminder) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem("pwa_installed", "true");
      logInstallEvent("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if running as standalone (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      localStorage.setItem("pwa_installed", "true");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const logInstallEvent = async (eventType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("pwa_installs_log").insert({
        user_id: session?.user?.id || null,
        event_type: eventType
      });

      // Update profile if user is logged in
      if (session?.user?.id && eventType === "installed") {
        await supabase
          .from("profiles")
          .update({ installed_pwa: true, installed_at: new Date().toISOString() })
          .eq("id", session.user.id);
      }
    } catch (error) {
      console.error("Error logging install event:", error);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    logInstallEvent("prompt_shown");
    await deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      logInstallEvent("accepted");
      setIsInstalled(true);
      localStorage.setItem("pwa_installed", "true");
    } else {
      logInstallEvent("dismissed");
      localStorage.setItem("pwa_last_reminder", Date.now().toString());
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_last_reminder", Date.now().toString());
    logInstallEvent("reminder_dismissed");
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 animate-in slide-in-from-bottom-5">
      <Card className="shadow-2xl border-primary/20 bg-gradient-to-r from-primary/5 to-background">
        <CardContent className="p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-primary-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install Smart World Connect</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get the full app experience with offline access & notifications
              </p>
              
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="mt-3 w-full h-9"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
