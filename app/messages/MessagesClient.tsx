"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Send, 
  Inbox,
  SendHorizontal,
  Search,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ConversationData {
  id: string;
  participant: User;
  lastMessage: {
    text: string;
    timestamp: Date;
    isRead: boolean;
    isSentByMe: boolean;
  };
  unreadCount: number;
}

interface MessageData {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

interface MessagesClientProps {
  initialConversations?: ConversationData[];
}

export default function MessagesClient({ initialConversations = [] }: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/conversations"],
    initialData: initialConversations,
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageData[]>({
    queryKey: ["/api/conversations", selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: selectedConversation ? 3000 : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; body: string }) => {
      return await apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return;

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return;

    sendMessageMutation.mutate({
      recipientId: conversation.participant.id,
      body: messageText,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const renderConversationList = () => (
    <Card className={isMobile && selectedConversation ? "hidden" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-9"
              data-testid="input-search-conversations"
            />
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">
              <SendHorizontal className="w-4 h-4 mr-2" />
              Sent
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        {conversationsLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm">Start a conversation with other traders</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className={`p-4 cursor-pointer hover-elevate ${
                  selectedConversation === conv.id ? "bg-muted" : ""
                }`}
                data-testid={`conversation-${conv.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{conv.participant.username[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{conv.participant.username}</span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2" data-testid={`badge-unread-${conv.id}`}>
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage.isSentByMe && "You: "}
                      {conv.lastMessage.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMessageView = () => {
    if (!selectedConversation) {
      return (
        <Card className={isMobile ? "hidden" : ""}>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              Select a conversation to view messages
            </p>
          </CardContent>
        </Card>
      );
    }

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <Card className={isMobile && !selectedConversation ? "hidden" : ""}>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                data-testid="button-back-to-conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar>
              <AvatarFallback>{conversation.participant.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{conversation.participant.username}</CardTitle>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUser?.id ? "justify-end" : "justify-start"
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === currentUser?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === currentUser?.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="resize-none min-h-[60px] max-h-[120px]"
                  data-testid="input-message-text"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={currentUser?.totalCoins || 0} />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Messages</h1>
          <p className="text-lg text-muted-foreground">
            Connect with other traders privately
          </p>
        </div>

        {isMobile ? (
          <div className="space-y-6">
            {renderConversationList()}
            {renderMessageView()}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">{renderConversationList()}</div>
            <div className="lg:col-span-2">{renderMessageView()}</div>
          </div>
        )}
      </main>

      <EnhancedFooter />
    </div>
  );
}
