const HttpError = require("../models/http-error");
const { validationResult } = require('express-validator')
const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getAllUsers = async (req, res, next) => {
    let users
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError('Fetching users failed', 500)
        return next(error);
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) })
}

const signup = async (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    };

    const { name, email, password } = req.body

    let userExist
    try {
        userExist = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Sorry, Something went wrong', 500)
        return next(error);
    }

    if (userExist) {
        const error = new HttpError('User already Exist with the same email', 422)
        return next(error);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcryptjs.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Cannot create user', 500)
        return next(error);
    }

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        image: `uploads/images/${req.file.filename}`,
        places: []
    })

    try {
        await newUser.save();
    } catch (err) {
        const error = new HttpError('Cannot create user', 500)
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError('Signing up failed', 500)
        return next(error);
    }

    res.status(201);
    res.json({ userId: newUser.id, email: newUser.email, token: token });
}

const login = async (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        const resError = new HttpError('Invalid input passed', 422);
        return next(resError);
    }
    const { email, password } = req.body
    let user
    try {
        user = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Sorry, Something went wrong', 500)
        return next(error);
    }
    // If the user with email does not exist or password is incorrect
    if (!user) {
        const error = new HttpError('Could not identify user', 403)
        return next(error);
    }

    // Check password
    let isValidPassword = false;
    try {
        isValidPassword = await bcryptjs.compare(password, user.password);
    } catch (err) {
        const error = new HttpError('Could not log you in', 500)
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Could not identify user', 403)
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError('Logging in failed', 500)
        return next(error);
    }

    res.status(200).json({
        userId: user.id,
        email: user.email,
        token: token
    })
}

module.exports = { getAllUsers, signup, login, }