const express = require("express");
const connectDB = require("../backend/config/config");
const routes = require("./routes/route");
const app = express();
const cors = require("cors");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const http = require('http'); // Import the HTTP module
const socketIO = require('socket.io'); // Import Socket.IO
const socketController = require('../backend/controller/socketcontroller'); // Import your socket controller

// Connect to MongoDB
connectDB();

// Session Middleware (Used by both Express and Socket.IO)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // A secret key to sign the session ID cookie
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Your MongoDB connection string
    collectionName: 'sessions', // The collection to store sessions
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true, // Prevent JavaScript access to the session cookie
    secure: process.env.NODE_ENV === 'production', // Only send cookies over HTTPS in production
    sameSite: 'strict', // Helps prevent CSRF attacks
  },
});

// Apply CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Change this to your client URL
    credentials: true, // Allow credentials to be sent
  })
);

// Use the session middleware with Express
app.use(sessionMiddleware);

// Parse JSON
app.use(express.json());

// Use the routes
app.use("/api", routes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173", // Change this to your client URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Use session middleware with Socket.IO
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
