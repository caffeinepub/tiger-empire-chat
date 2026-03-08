import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Timestamp = Int;

  type UserProfile = {
    principal : Principal;
    username : Text;
    displayName : Text;
    lastActive : Timestamp;
  };

  module UserProfile {
    public func compare(p1 : UserProfile, p2 : UserProfile) : Order.Order {
      switch (Text.compare(p1.username, p2.username)) {
        case (#equal) { Text.compare(p1.displayName, p2.displayName) };
        case (ordering) { ordering };
      };
    };
  };

  type ChatRoom = {
    id : Text;
    name : Text;
    owner : Text;
    memberCount : Nat;
  };

  type Message = {
    id : Nat;
    sender : Text;
    content : Text;
    timestamp : Timestamp;
  };

  type RoomDetails = {
    id : Text;
    name : Text;
    owner : Text;
    memberCount : Nat;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let chatRooms = Map.empty<Text, ChatRoom>();
  let messagesForRoom = Map.empty<Text, [Message]>();
  let roomMemberships = Map.empty<Principal, Set.Set<Text>>();

  var nextMessageId = 0;

  func getCurrentTime() : Timestamp {
    Time.now();
  };

  // AUTH
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ROOMS
  public shared ({ caller }) func createRoom(roomId : Text, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };

    let newRoom : ChatRoom = {
      id = roomId;
      name;
      owner = caller.toText();
      memberCount = 0;
    };

    chatRooms.add(roomId, newRoom);
  };

  public shared ({ caller }) func joinRoom(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };

    switch (chatRooms.get(roomId)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        let membershipSet = switch (roomMemberships.get(caller)) {
          case (null) { Set.empty<Text>() };
          case (?existingSet) { existingSet };
        };
        membershipSet.add(roomId);

        chatRooms.add(
          roomId,
          { room with memberCount = room.memberCount + 1 }
        );
      };
    };
  };

  public shared ({ caller }) func leaveRoom(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave rooms");
    };

    switch (chatRooms.get(roomId)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        switch (roomMemberships.get(caller)) {
          case (null) {};
          case (?rooms) {
            rooms.remove(roomId);
            chatRooms.add(
              roomId,
              { room with memberCount = if (room.memberCount > 1) { room.memberCount - 1 } else { 0 } },
            );
          };
        };
      };
    };
  };

  public shared ({ caller }) func sendMessage(roomId : Text, senderName : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let message : Message = {
      id = nextMessageId;
      sender = senderName;
      content;
      timestamp = getCurrentTime();
    };

    nextMessageId += 1;

    let roomMessages = switch (messagesForRoom.get(roomId)) {
      case (null) { [message] };
      case (?existingMessages) {
        existingMessages.concat([message]);
      };
    };
    messagesForRoom.add(roomId, roomMessages);
  };

  // QUERIES
  public query ({ caller }) func getRoomMessages(roomId : Text, count : Nat, offset : Nat) : async [Message] {
    switch (messagesForRoom.get(roomId)) {
      case (null) { [] };
      case (?messages) {
        let sliceStart = offset;
        let sliceEnd = offset + count;
        messages.sliceToArray(sliceStart, sliceEnd);
      };
    };
  };

  public query ({ caller }) func getRoomsOfUser(user : Principal) : async [Text] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own room memberships");
    };
    switch (roomMemberships.get(user)) {
      case (null) { [] };
      case (?rooms) { rooms.toArray() };
    };
  };

  public query ({ caller }) func getRooms() : async [RoomDetails] {
    chatRooms.values().toArray().map(
      func(room) {
        {
          id = room.id;
          name = room.name;
          owner = room.owner;
          memberCount = room.memberCount;
        };
      }
    );
  };
};
