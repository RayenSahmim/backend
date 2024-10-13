// authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Your secret key (must be the same used to sign the JWT)

// Middleware to verify JWT from cookies
const SECRET_KEY = process.env.JWT_SECRET ;

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      next(); // User is authenticated, proceed to the next middleware
    } else {
      res.status(401).json({ msg: "Unauthorized" });
    }
  };
  

module.exports = isAuthenticated;
