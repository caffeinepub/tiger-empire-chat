import type { Message, RoomDetails, UserProfile } from "@/backend.d.ts";

const SKELETON_MSG_CONFIGS = [
  { key: "sk-msg-a", reverse: false, width: "w-48" },
  { key: "sk-msg-b", reverse: true, width: "w-64" },
  { key: "sk-msg-c", reverse: false, width: "w-36" },
  { key: "sk-msg-d", reverse: false, width: "w-48" },
  { key: "sk-msg-e", reverse: true, width: "w-56" },
];
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetMessages,
  useLeaveRoom,
  useSendMessage,
} from "@/hooks/useQueries";
import {
  ArrowLeft,
  Hash,
  Loader2,
  LogOut,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ChatRoomScreenProps {
  room: RoomDetails;
  userProfile: UserProfile;
  onBack: () => void;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Consistent color per sender name
const AVATAR_COLORS = [
  "bg-amber-500/20 text-amber-400",
  "bg-orange-500/20 text-orange-400",
  "bg-yellow-500/20 text-yellow-400",
  "bg-red-500/20 text-red-400",
  "bg-rose-500/20 text-rose-400",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showSender: boolean;
}

function MessageBubble({ message, isSelf, showSender }: MessageBubbleProps) {
  return (
    <motion.div
      className={`flex gap-2.5 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!isSelf && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-auto border border-border">
          <AvatarFallback
            className={`text-xs font-bold ${getAvatarColor(message.sender)}`}
          >
            {getInitials(message.sender)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[75%] ${isSelf ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        {showSender && !isSelf && (
          <span className="text-xs font-semibold text-gold ml-1">
            {message.sender}
          </span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isSelf
              ? "message-bubble-self rounded-tr-sm text-foreground"
              : "message-bubble-other rounded-tl-sm text-foreground"
          }`}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

export default function ChatRoomScreen({
  room,
  userProfile,
  onBack,
}: ChatRoomScreenProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  const { data: messages, isLoading } = useGetMessages(room.id);
  const sendMessage = useSendMessage();
  const leaveRoom = useLeaveRoom();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length !== prevMessageCount.current) {
      prevMessageCount.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content) return;
    setMessageText("");
    try {
      await sendMessage.mutateAsync({
        roomId: room.id,
        senderName: userProfile.displayName,
        content,
      });
    } catch {
      toast.error("Failed to send message. Please try again.");
      setMessageText(content);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveRoom.mutateAsync(room.id);
      toast.success(`Left "${room.name}"`);
      onBack();
    } catch {
      toast.error("Failed to leave room.");
    }
  };

  // Sort messages oldest first
  const sortedMessages = messages
    ? [...messages].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
    : [];

  return (
    <div className="h-screen flex flex-col empire-bg">
      {/* Header */}
      <header className="flex-shrink-0 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-3 h-16 flex items-center gap-3">
          <Button
            data-ocid="chat.back_button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-gold hover:bg-gold/10 w-9 h-9 rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-gold" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-base truncate">
              {room.name}
            </p>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {Number(room.memberCount).toLocaleString()} members
              </span>
            </div>
          </div>

          {/* Leave room */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-9 h-9 rounded-xl flex-shrink-0"
                title="Leave room"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              data-ocid="chat.dialog"
              className="bg-card border-border"
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">
                  Leave Room?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  You'll leave "{room.name}" and can rejoin anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  data-ocid="chat.cancel_button"
                  className="border-border bg-secondary"
                >
                  Stay
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="chat.confirm_button"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleLeave}
                >
                  {leaveRoom.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {isLoading ? (
            <div data-ocid="chat.loading_state" className="space-y-4">
              {SKELETON_MSG_CONFIGS.map((cfg) => (
                <div
                  key={cfg.key}
                  className={`flex gap-3 ${cfg.reverse ? "flex-row-reverse" : ""}`}
                >
                  <Skeleton className="w-8 h-8 rounded-full bg-secondary flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton
                      className={`h-10 bg-secondary rounded-2xl ${cfg.width}`}
                    />
                    <Skeleton className="h-2.5 w-12 bg-secondary rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedMessages.length === 0 ? (
            <div
              data-ocid="chat.empty_state"
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-gold/60" />
              </div>
              <p className="font-display font-semibold text-foreground/60">
                No messages yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to speak in the empire!
              </p>
            </div>
          ) : (
            <div data-ocid="chat.messages_list" className="space-y-3 pb-2">
              <AnimatePresence initial={false}>
                {sortedMessages.map((msg, index) => {
                  const isSelf = msg.sender === userProfile.displayName;
                  const prevSender =
                    index > 0 ? sortedMessages[index - 1].sender : null;
                  const showSender = prevSender !== msg.sender;
                  return (
                    <MessageBubble
                      key={msg.id.toString()}
                      message={msg}
                      isSelf={isSelf}
                      showSender={showSender}
                    />
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="flex-shrink-0 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                data-ocid="chat.message_input"
                placeholder={`Message #${room.name}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                className="bg-secondary border-border focus:border-gold/50 focus:ring-gold/30 rounded-xl resize-none min-h-[44px] max-h-[120px] py-2.5 px-4 text-sm"
                style={{ overflowY: "auto" }}
              />
            </div>
            <Button
              data-ocid="chat.send_button"
              className="tiger-gradient text-primary-foreground w-11 h-11 rounded-xl p-0 flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
              onClick={handleSend}
              disabled={sendMessage.isPending || !messageText.trim()}
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
