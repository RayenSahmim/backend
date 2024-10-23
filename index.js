const express = require("express");
const connectDB = require("../backend/config/config");
const routes = require("./routes/route");
const app = express();
const http = require('http'); // Import the HTTP module
const socketIO = require('socket.io'); // Import Socket.IO
const socketController = require('../backend/controller/socketcontroller'); // Import your socket controller
const {sessionMiddleware, corsMiddleware} = require('../backend/middleware/sessionMiddleware');
connectDB();

app.use(sessionMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use("/api", routes);
const server = http.createServer(app);
// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173", // Change this to your client URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next); // Pass session to the socket request
});

// Socket.IO connection
io.on('connection', (socket) => {
  socketController(socket); // Pass the socket to the controller
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
