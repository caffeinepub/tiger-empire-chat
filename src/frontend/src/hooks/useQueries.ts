import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, RoomDetails, UserProfile } from "../backend.d.ts";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─────────────────────────────────────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      displayName,
    }: {
      username: string;
      displayName: string;
    }) => {
      if (!actor || !identity)
        throw new Error("Actor or identity not available");
      const profile: UserProfile = {
        principal: identity.getPrincipal(),
        username,
        displayName,
        lastActive: BigInt(Date.now()) * BigInt(1_000_000),
      };
      await actor.saveCallerUserProfile(profile);
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Rooms
// ─────────────────────────────────────────────────────────────────────────────

export function useGetRooms() {
  const { actor, isFetching } = useActor();

  return useQuery<RoomDetails[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRooms();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, name }: { roomId: string; name: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createRoom(roomId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useJoinRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.joinRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useLeaveRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.leaveRoom(roomId);
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.removeQueries({ queryKey: ["messages", roomId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

export function useGetMessages(roomId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRoomMessages(roomId, BigInt(50), BigInt(0));
    },
    enabled: !!actor && !isFetching && !!roomId,
    refetchInterval: 3_000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      senderName,
      content,
    }: {
      roomId: string;
      senderName: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendMessage(roomId, senderName, content);
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
    },
  });
}
