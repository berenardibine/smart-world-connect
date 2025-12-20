import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, Check, X } from "lucide-react";

interface Suggestion {
  id: string;
  suggestion_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AISuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("ai_suggestions")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("ai_suggestions")
      .update({ is_read: true })
      .eq("id", id);

    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, is_read: true } : s
    ));
  };

  const dismissSuggestion = async (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (loading) {
    return null;
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "referral_tip":
        return "👥";
      case "marketing_tip":
        return "📢";
      case "performance_tip":
        return "📈";
      default:
        return "💡";
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border-purple-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.filter(s => !s.is_read).slice(0, 3).map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-3 bg-background/50 rounded-lg border border-border/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">{getTypeIcon(suggestion.suggestion_type)}</span>
                <div>
                  <p className="font-medium text-sm">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.message}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => markAsRead(suggestion.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => dismissSuggestion(suggestion.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AISuggestions;
