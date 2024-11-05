const MessageModal = require('../models/ModalMessage');
const User = require('../models/User');
const Room = require('../models/Room'); // New Room model

const connectedUsers = {}; // Store connected users by session ID

module.exports = (socket) => {
  const userSession = socket.request.session?.user;

  if (!userSession) {
    console.log("Unauthorized user.");
    socket.disconnect();
    return;
  }

  // Mark the user as connected
  connectedUsers[userSession.id] = socket.id;

  console.log(`${userSession.name} connected`);

  // Listen for a 'joinRoom' event to join a specific room by roomID
  socket.on('joinRoom', async ({ roomId }) => {
    try {
      // Fetch the room by roomId
      const room = await Room.findById(roomId);
      console.log("room : ", room);

      if (!room) {
        console.log(`Room with ID ${roomId} not found.`);
        return;
      }

      // Check if the user is a member of the room
      const isMember = room.users.some((user) => user._id.equals(userSession.id));

      if (!isMember) {
        console.log(`${userSession.name} is not a member of the room ${roomId}`);
        return;
      }

      // Join the room
      socket.join(roomId);
      console.log(`${userSession.name} joined room: ${roomId}`);

      // Fetch previous messages for this room from the DB
      const messages = await MessageModal.find({ room: roomId })
        .sort({ timestamp: 1 })
        .limit(50)
        .populate('user');

      const formattedMessages = messages.map((msg) => ({
        user: msg.user.name,
        message: msg.message,
        timestamp: msg.timestamp,
      }));

      // Send previous messages of this room to the user
      socket.emit('previousMessages', formattedMessages);
    } catch (err) {
      console.error('Error joining room:', err);
    }
  });

  // Listen for 'message' event from the client (within the room)
  socket.on('message', async ({ roomId, msg }) => {
    console.log(`Message received in room ${roomId}:`, msg);

    try {
      const user = await User.findById(userSession.id);

      if (!user) {
        console.log('User not found');
        return;
      }

      // Create a new message and save it to the database (with roomId)
      const newMessage = new MessageModal({
        user: userSession.id,
        room: roomId,
        message: msg,
        timestamp: new Date(),
      });
      await newMessage.save();

      // Format the message and broadcast it only to the room
      const formattedMessage = {
        user: user.name,
        message: msg,
        timestamp: newMessage.timestamp,
      };

      // Emit the message to the specific room
      socket.to(roomId).emit('message', formattedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle typing event
  socket.on('typing', ({ roomId }) => {
    socket.to(roomId).emit('typing', `${userSession.name} is typing...`);
  });

  socket.on('callUser', ({ roomId, offer }) => {
    socket.to(roomId).emit('receiveCall', { from: socket.id, offer });
    socket.to(roomId).emit('ringing', { caller: socket.id });
  });
  
  
  socket.on('answerCall', ({ roomId, answer }) => {
    socket.to(roomId).emit('callAnswered', { answer });
  });
  
  socket.on('iceCandidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('iceCandidate', candidate);
    console.log("ICE candidate received:", candidate);
  });

  socket.on('declineCall', ({ roomId }) => {
    socket.to(roomId).emit('callDeclined');
  });
  
  socket.on('endCall', ({ roomId }) => {
    socket.to(roomId).emit('callEnded');
  });
  
  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log(`${userSession.name} disconnected`);
    delete connectedUsers[userSession.id]; // Remove the user from the connected list
  });
};
