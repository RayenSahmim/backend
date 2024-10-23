// middleware/sessionMiddleware.js
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

const corsMiddleware = cors({
  origin: 'http://localhost:5173',
  credentials: true,
});

module.exports = { sessionMiddleware, corsMiddleware };
