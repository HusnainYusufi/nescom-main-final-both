const mongoose = require('mongoose');

try {
    'use strict';

    const UserSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 50
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null
        },
        profilePic: {
            type: String,
            default: ''
        },
        cnic: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            default: ''
        },
        phoneNumber: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    UserSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    const User = mongoose.model('User', UserSchema);

    module.exports = User;

} catch (error) {
    console.error('Error creating the User schema:', error);
}
