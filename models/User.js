const mongoose = require('mongoose');

// Define a schema for chat messages
const userschema = new mongoose.Schema({
    name : {
        type: String,
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        required: true
    },
    ImageURL : {
        type: String,

    },
    

});

// Create a model based on the schema
const User = mongoose.model('User', userschema);

module.exports = User;
