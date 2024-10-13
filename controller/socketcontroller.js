const MessageModal = require('../models/ModalMessage');
module.exports = (socket) => {
    const userSession = socket.request.session?.user; // Access user session
  
    if (!userSession) {
      console.log("Unauthorized user.");
      socket.disconnect(); // Disconnect unauthenticated users
      return;
    }
  
    console.log(`${userSession.name} connected`);
  
    MessageModal.find({})
    .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
    .limit(50) // Limit to last 50 messages
    .then((messages) => {
      socket.emit('previousMessages', messages);
    })
    .catch((err) => {
      console.error('Error fetching messages from DB:', err);
    });

    // Listen for 'message' event from client
    socket.on('message', async (msg) => {
      console.log('Message received:', msg);


      try {
        const newMessage = new MessageModal({
          user: userSession.name,  // Username from the session
          message: msg,            // Message content
        });
        await newMessage.save(); // Save the message to the database
        console.log('Message saved to DB:', newMessage);
      // Broadcast the message along with the user's name
      socket.broadcast.emit('message', { user: userSession.name, message: msg });
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });
  
    // Handle typing event
    socket.on('typing', () => {
      socket.broadcast.emit('typing', `${userSession.name} is typing...`);
    });
  
    // Handle disconnect event
    socket.on('disconnect', () => {
      console.log(`${userSession.name} disconnected`);
    });
  };
  