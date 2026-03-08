import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: bigint;
    content: string;
    sender: string;
    timestamp: Timestamp;
}
export type Timestamp = bigint;
export interface RoomDetails {
    id: string;
    owner: string;
    name: string;
    memberCount: bigint;
}
export interface UserProfile {
    principal: Principal;
    username: string;
    displayName: string;
    lastActive: Timestamp;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoom(roomId: string, name: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRoomMessages(roomId: string, count: bigint, offset: bigint): Promise<Array<Message>>;
    getRooms(): Promise<Array<RoomDetails>>;
    getRoomsOfUser(user: Principal): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(roomId: string): Promise<void>;
    leaveRoom(roomId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(roomId: string, senderName: string, content: string): Promise<void>;
}
