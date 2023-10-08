const mongoose = require('mongoose');

// user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    ipAddress: String, // Add ipAddress field to store the user's IP address
}, { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
