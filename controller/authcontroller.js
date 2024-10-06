const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const registerUser =  async (req, res) => {
    let { name, email, password } = req.body;

    // Check if all fields are present
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({ name, email, password: hashedPassword });
        await user.save();

        res.status(200).json({ message: 'User registered successfully', user: { name: user.name, email: user.email } });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({message:'Server error'});
    }
};

const Login = async(req, res)=>{ 
    const {email, password} = req.body;

    // Check if all fields are present
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.cookie('token', token, { httpOnly: true,maxAge  : 24 * 60 * 60 * 1000 });
        res.status(200).json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({message:'Server error'});
    }

    
}
module.exports = {
    registerUser,
    Login
}