import type { RoomDetails } from "@/backend.d.ts";
import ChatRoomScreen from "@/components/chat/ChatRoomScreen";
import LoginScreen from "@/components/chat/LoginScreen";
import RoomsScreen from "@/components/chat/RoomsScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "@/hooks/useQueries";
import { useState } from "react";

function AppLoader() {
  return (
    <div className="min-h-screen empire-bg flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gold/30">
        <img
          src="/assets/generated/tiger-empire-logo-transparent.dim_200x200.png"
          alt="Tiger Empire"
          className="w-full h-full object-cover opacity-60"
        />
      </div>
      <div className="space-y-2 flex flex-col items-center">
        <Skeleton className="h-3 w-40 bg-gold/10 rounded-full" />
        <Skeleton className="h-2 w-24 bg-gold/5 rounded-full" />
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [activeRoom, setActiveRoom] = useState<RoomDetails | null>(null);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Show loader while identity is initializing
  if (isInitializing) {
    return <AppLoader />;
  }

  // Show loader while profile is loading (prevent flash of setup screen)
  if (isAuthenticated && (profileLoading || !profileFetched)) {
    return <AppLoader />;
  }

  // Show login/setup screen if not authenticated or no profile
  const showSetup = !isAuthenticated || !userProfile;
  if (showSetup) {
    return (
      <>
        <LoginScreen />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  // Show chat room if one is active
  if (activeRoom) {
    return (
      <>
        <ChatRoomScreen
          room={activeRoom}
          userProfile={userProfile}
          onBack={() => setActiveRoom(null)}
        />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  // Show rooms list
  return (
    <>
      <RoomsScreen
        userProfile={userProfile}
        onEnterRoom={(room) => setActiveRoom(room)}
      />
      <Toaster richColors position="top-center" />
    </>
  );
}
