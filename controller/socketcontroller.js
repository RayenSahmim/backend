const MessageModal = require("../models/ModalMessage");
const User = require("../models/User");
const Room = require("../models/Room"); // New Room model
const NotificationModal = require("../models/NotificationModal");
const { encrypt,decrypt } = require("../utils/crypto");

const connectedUsers = new Map(); // More efficient for large numbers of users

module.exports = (socket) => {
  async function sendNotification({
    recipient,
    rommId,
    senderId,
    senderName,
    message,
    connectedUsers,
  }) {
    const recipientId = recipient._id.toString();

    console.log("Attempting to send notification to:", {
      toUserId: recipientId,
      fromUser: senderName,
      fromUserId: senderId,
    });
    const content = `New message : ${message}`
    const encryptedContent = encrypt(content); // Encrypt the content
    const type = encrypt("new_message");
    try {

      // Save the notification to the database
      const notification = new NotificationModal({
        user: recipientId, // Recipient
        from: senderId, // Sender
        type: type,
        content: encryptedContent ,
        timestamp: new Date(),
      });
      await notification.save();

      console.log("Notification saved successfully");

      // Check if the recipient is connected
      if (connectedUsers.has(recipientId)) {
        try {
          socket.to(connectedUsers.get(recipientId)).emit("notification", {
            from: senderId,
            fromName: senderName,
            type: type,
            content: content,
            timestamp: new Date(),
          });

          console.log(`Notification sent to ${recipientId}`);
        } catch (notificationError) {
          console.error(
            `Error sending notification to ${recipientId}:`,
            notificationError
          );
        }
      }
    } catch (err) {
      console.error("Error saving notification to database:", err);
    }
  }

  const userSession = socket.request.session?.user;

  if (!userSession) {
    console.log("Unauthorized user.");
    socket.disconnect();
    return;
  }

  // Mark the user as connected
  connectedUsers.set(userSession.id, socket.id);

  console.log(`${userSession.name} connected`);

  // Broadcast online users to all connected clients
  const broadcastOnlineUsers = () => {
    console.log("connectedUsers", connectedUsers);
    const onlineUsers = Array.from(connectedUsers.keys());
    socket.broadcast.emit("onlineUsers", onlineUsers);
    socket.emit("onlineUsers", onlineUsers);
    
  };

  socket.on("getOnlineUsers", () => {
    const onlineUsers = Array.from(connectedUsers.keys());
    socket.emit("onlineUsers", onlineUsers);
  });

  broadcastOnlineUsers();




  // Listen for a 'joinRoom' event to join a specific room by roomID
  socket.on("joinRoom", async ({ roomId }) => {
    try {
      // Fetch the room by roomId
      const room = await Room.findById(roomId);

      if (!room) {
        console.log(`Room with ID ${roomId} not found.`);
        return;
      }

      // Check if the user is a member of the room
      const isMember = room.users.some((user) =>
        user._id.equals(userSession.id)
      );

      if (!isMember) {
        console.log(
          `${userSession.name} is not a member of the room ${roomId}`
        );
        return;
      }

      // Join the room
      socket.join(roomId);
      console.log(`${userSession.name} joined room: ${roomId}`);

      // Fetch previous messages for this room from the DB
      const messages = await MessageModal.find({ room: roomId })
        .sort({ timestamp: 1 })
        .limit(50)
        .populate("user");

      const formattedMessages = messages.map((msg) => ({
        user: decrypt(msg.user.name),
        message: decrypt(msg.message),
        timestamp: msg.timestamp,
      }));

      // Send previous messages of this room to the user
      socket.emit("previousMessages", formattedMessages);
    } catch (err) {
      console.error("Error joining room:", err);
    }
  });

  

  // Listen for 'message' event from the client (within the room)
  socket.on("message", async ({ roomId, msg }) => {
    console.log(`Message received in room ${roomId}:`, msg);
    console.log("Current user session:", userSession);

    try {
      const [user, room] = await Promise.all([
        User.findById(userSession.id),
        Room.findById(roomId).populate("users")
      ]);

      if (!user || !room) {
        console.error("User or room not found");
        return;
      }

      // Create a new message and save it to the database
      const newMessage = new MessageModal({
        user: userSession.id,
        room: roomId,
        message: encrypt(msg), // Encrypt the msg,
        timestamp: new Date(),
      });
      await newMessage.save();

      // Format the message and broadcast it to the room
      const formattedMessage = {
        user: user.name,
        message: msg,
        timestamp: newMessage.timestamp,
      };

      socket.to(roomId).emit("message", formattedMessage);

      

      // Send notifications to other users in the room
      const otherUsers = room.users.filter(
        (roomUser) => roomUser._id.toString() !== userSession.id
      );

      console.log(
        "Other users in room:",
        otherUsers.map((u) => u._id.toString())
      );
      console.log("Connected users:", connectedUsers);

      const notificationPromises = otherUsers.map(recipient => 
        sendNotification({
          recipient,
          rommId: room._id.toString(),
          senderId: userSession.id,
          senderName: userSession.name,
          message: msg,
          connectedUsers,
        })
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error("Complete error in message handling:", error);
    }
  });

  // Handle typing event
  socket.on("typing", ({ roomId }) => {
    socket.to(roomId).emit("typing", `${userSession.name} is typing...`);
  });

  socket.on("callUser", ({ roomId, offer }) => {
    socket.to(roomId).emit("receiveCall", { from: socket.id, offer });
    socket.to(roomId).emit("ringing", { caller: socket.id });
  });

  socket.on("answerCall", ({ roomId, answer }) => {
    socket.to(roomId).emit("callAnswered", { answer });
  });

  socket.on("iceCandidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("iceCandidate", candidate);
    console.log("ICE candidate received:", candidate);
  });

  socket.on("declineCall", ({ roomId }) => {
    socket.to(roomId).emit("callDeclined");
  });

  socket.on("endCall", ({ roomId }) => {
    socket.to(roomId).emit("callEnded");
  });

  socket.on("logout", () => {
    console.log(`${userSession.name} logged out`);

    // Remove the user from the connected list
    connectedUsers.delete(userSession.id);

    // Notify all clients about the updated online users list
    broadcastOnlineUsers();

    // Disconnect the socket explicitly
    socket.disconnect(true);
  });

  socket.on("muteAudio", ({ roomId, isMuted }) => {
    // Broadcast audio mute/unmute state to other users in the room
    socket.to(roomId).emit("audioMuted", {
      user: userSession.id,
      isMuted,
    });
    console.log(
      `${userSession.name} has ${
        isMuted ? "muted" : "unmuted"
      } audio in room ${roomId}`
    );
  });

  socket.on("muteVideo", ({ roomId, isMuted }) => {
    // Broadcast video mute/unmute state to other users in the room
    socket.to(roomId).emit("videoMuted", {
      user: userSession.id,
      isMuted,
    });
    console.log(
      `${userSession.name} has ${
        isMuted ? "muted" : "unmuted"
      } video in room ${roomId}`
    );
  });

  socket.on("markNotificationsAsRead", async ({ notificationId }) => {
    try {
      // Mark a single notification as read
      await NotificationModal.updateOne(
        { _id: notificationId, user: userSession.id },
        { isRead: true }
      );

      console.log(
        `Notification ${notificationId} marked as read for user ${userSession.name}`
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  });

  socket.on("markAllNotificationsAsRead", async () => {
    try {
      // Mark all notifications as read for a user
      await NotificationModal.updateMany(
        { user: userSession.id },
        { isRead: true }
      );

      console.log(`All notifications marked as read for user ${userSession.name}`);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  });

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log(`${userSession.name} disconnected`);

    connectedUsers.delete(userSession.id); // Remove the user from the connected list
    broadcastOnlineUsers(); // Update the list of online users for remaining clients
  });
};
