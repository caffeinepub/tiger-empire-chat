import type { RoomDetails, UserProfile } from "@/backend.d.ts";

const SKELETON_ROOM_KEYS = ["sk-room-a", "sk-room-b", "sk-room-c", "sk-room-d"];
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCreateRoom, useGetRooms, useJoinRoom } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Crown,
  Hash,
  Loader2,
  LogOut,
  Plus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface RoomsScreenProps {
  userProfile: UserProfile;
  onEnterRoom: (room: RoomDetails) => void;
}

export default function RoomsScreen({
  userProfile,
  onEnterRoom,
}: RoomsScreenProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: rooms, isLoading } = useGetRooms();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const totalMembers =
    rooms?.reduce((acc, r) => acc + Number(r.memberCount), 0) ?? 0;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    const roomId = newRoomName.trim().toLowerCase().replace(/\s+/g, "-");
    try {
      await createRoom.mutateAsync({ roomId, name: newRoomName.trim() });
      toast.success(`Room "${newRoomName.trim()}" created!`);
      setNewRoomName("");
      setShowCreateForm(false);
    } catch {
      toast.error("Failed to create room. It may already exist.");
    }
  };

  const handleJoinRoom = async (room: RoomDetails) => {
    setJoiningRoomId(room.id);
    try {
      await joinRoom.mutateAsync(room.id);
      onEnterRoom(room);
    } catch {
      // Room may already be joined, just enter
      onEnterRoom(room);
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="min-h-screen empire-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/30">
              <img
                src="/assets/generated/tiger-empire-logo-transparent.dim_200x200.png"
                alt="Tiger Empire"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display font-black text-lg tiger-text-gradient">
              Tiger Empire
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="w-7 h-7 border border-gold/30">
                <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground/80 max-w-[120px] truncate">
                {userProfile.displayName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Stats bar */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <Hash className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-foreground">
                {rooms?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Active Rooms</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-foreground">
                {totalMembers.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </div>
        </motion.div>

        {/* Rooms section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              Chat Rooms
            </h2>
            <Button
              size="sm"
              className="tiger-gradient text-primary-foreground font-semibold rounded-lg h-8 gap-1.5 text-xs"
              onClick={() => setShowCreateForm((v) => !v)}
            >
              {showCreateForm ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {showCreateForm ? "Cancel" : "New Room"}
            </Button>
          </div>

          {/* Create room form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                className="mb-4 bg-card border border-gold/20 rounded-xl p-4 space-y-3"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-sm font-medium text-gold">
                  Create a new room
                </p>
                <div className="flex gap-2">
                  <Input
                    data-ocid="rooms.create_input"
                    placeholder="Room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                    className="bg-secondary border-border focus:border-gold/50 h-10 rounded-lg flex-1"
                  />
                  <Button
                    data-ocid="rooms.create_button"
                    className="tiger-gradient text-primary-foreground font-semibold rounded-lg h-10 px-4"
                    onClick={handleCreateRoom}
                    disabled={createRoom.isPending || !newRoomName.trim()}
                  >
                    {createRoom.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rooms list */}
          <div data-ocid="rooms.list" className="space-y-2">
            {isLoading ? (
              SKELETON_ROOM_KEYS.map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                >
                  <Skeleton className="w-10 h-10 rounded-lg bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36 bg-secondary" />
                    <Skeleton className="h-3 w-24 bg-secondary" />
                  </div>
                </div>
              ))
            ) : !rooms || rooms.length === 0 ? (
              <div
                data-ocid="rooms.empty_state"
                className="text-center py-16 bg-card border border-border rounded-xl"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-gold/60" />
                </div>
                <p className="font-display font-semibold text-foreground/70">
                  No rooms yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to create a room!
                </p>
              </div>
            ) : (
              rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  data-ocid={`rooms.item.${index + 1}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 room-card-hover cursor-pointer group"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => handleJoinRoom(room)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                      {room.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {Number(room.memberCount).toLocaleString()} members
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gold/10 text-gold border-gold/20 hidden sm:flex"
                    >
                      {Number(room.memberCount).toLocaleString()}
                    </Badge>
                    {joiningRoomId === room.id ? (
                      <Loader2 className="w-4 h-4 text-gold animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
