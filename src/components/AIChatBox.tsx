import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! 👋 I'm your Smart Market AI assistant. I can help you find products, answer questions, and guide you around. What can I help you with today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    "Find products near me",
    "How to sell on Smart Market?",
    "Track my orders",
    "Contact support",
  ];

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("near me") || lowerMessage.includes("products")) {
      return "I can help you find products near your location! 📍 Use the location filter on the homepage to see products from sellers in your area. Would you like me to guide you there?";
    }
    if (lowerMessage.includes("sell") || lowerMessage.includes("seller")) {
      return "Great choice! To start selling on Smart Market:\n1. Create an account or sign in\n2. Go to your Seller Dashboard\n3. Add your products with photos and descriptions\n4. Set your prices and start selling! 🎉";
    }
    if (lowerMessage.includes("order") || lowerMessage.includes("track")) {
      return "To track your orders, go to your Profile > Orders. You can see the status of all your purchases and communicate with sellers directly. 📦";
    }
    if (lowerMessage.includes("support") || lowerMessage.includes("help") || lowerMessage.includes("contact")) {
      return "You can reach our support team through:\n• Contact Us page in the menu\n• Email: support@smartmarket.rw\n• WhatsApp: +250 xxx xxx xxx\n\nWe're here to help! 💪";
    }
    
    return "I understand you're asking about that. Let me help you! You can explore our homepage for products, visit the Shops section to find local sellers, or check out our Academy for learning resources. Is there anything specific you'd like to know?";
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-50 p-4 rounded-full shadow-float transition-all duration-300",
          isOpen 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary text-primary-foreground pulse-glow"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] bg-background rounded-3xl shadow-float border border-border overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-foreground/20">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-foreground">Smart AI Assistant</h3>
              <p className="text-xs text-primary-foreground/70">Always here to help</p>
            </div>
            <div className="flex items-center gap-1.5 text-primary-foreground/70 text-xs">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 h-[calc(100%-160px)] overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.isBot ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line",
                    message.isBot
                      ? "bg-muted text-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleSendMessage(action)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent transition-colors"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl bg-muted/50 border-0"
              />
              <Button type="submit" size="icon" className="rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
