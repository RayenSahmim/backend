// authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();


const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      next(); // User is authenticated, proceed to the next middleware
    } else {
      res.status(401).json({ msg: "Unauthorized" });
    }
  };
  

module.exports = isAuthenticated;
