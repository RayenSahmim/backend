const express = require('express');
const connectDB = require('../backend/config/config');
const routes = require('./routes/route');
const app = express();


connectDB();

// Middleware
app.use(express.json());
app.use('/api', routes);
// Connect to MongoDB




// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT ,  () => {
    console.log(`Server running on port ${PORT}`);
});
