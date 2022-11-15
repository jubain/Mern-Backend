const fs = require('fs');
const path = require('path');
const HttpError = require("../models/http-error");
const { validationResult } = require('express-validator');
const getCoordsForAddress = require("../utils/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require('mongoose');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.placeId;
    let place
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        // If GET request fails
        const error = new HttpError('Something went wrong, Could not find a place', 500)
        return next(error);
    }
    // If request is fine but there is no place with the given id
    if (!place) {
        const error = new HttpError('Could not find place for provided id', 404)
        return next(error);
    }
    // Setting _id to id 
    res.json({ place: place.toObject({ getters: true }) })
}

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.userId;
    let places;
    // Alternatively
    let userWithPlaces
    try {
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        // If GET request fails
        const error = new HttpError('Something went wrong, Could not find places of the user', 500)
        return next(error);
    }

    if (!userWithPlaces || !userWithPlaces.places.length) {
        const error = new HttpError('Could not find places for provided user id', 404)
        return next(error);
    }
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) })
}

const createPlace = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const resError = new HttpError('Invalid input passed', 422);
        return next(resError);
    }
    const { title, description, address } = req.body;

    let coordinates;
    // Converting address into coordinates
    try {
        coordinates = await getCoordsForAddress(address)
    } catch (error) {
        return next(error);
    }
    // Create a new place instance
    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: `uploads/images/${req.file.filename}`,
        creator: req.userData.userId,
    });
    // Check if the user with the id exists
    let user;
    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('Creating place failed', 500)
        return next(error);
    }
    if (!user) {
        const error = new HttpError('Could not find the user with the given id', 404)
        return next(error);
    };

    // Create a new place in the DB
    try {
        // TRANSACTION allows you to do multiple things at once, it is build on session
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);     // Adding place id to user model
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        const err = new HttpError('Could not create add the place. Please try again', 500);
        return next(err);
    }
    res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const resError = new HttpError('Invalid input passed', 422);
        return next(resError);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Something went wrong, Could not find the update', 500)
        return next(error);
    }

    // Check if the user is creator of the post
    // Gets userId from check-auth middleware after verifying token(userId is saved in the token)
    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError('You are not creator of this content', 401);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, Could not find the update', 500)
        return next(error);
    }

    res.status(200).json({ place: place.toObject({ getters: true }) })
};

const deletePlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError('Something went wrong, Could not find the place', 500)
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find the place', 404)
        return next(error);
    }

    // Check if the user is creator of the post
    // Gets userId from check-auth middleware after verifying token(userId is saved in the token)
    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError('You are not creator of this content, so you cannot delete.', 401);
        return next(error);
    }

    const imagePath = path.join(__dirname, `../${place.image}`);

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place);   // Remove place id to user model
        await place.creator.save({ session: sess }); // Save updated change
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Something went wrong, Could not delete the place', 500)
        return next(error);
    }
    fs.unlink(imagePath, err => {
        console.log(err);
        res.status(200).json({ message: "Place is deleted" });
    })

};

module.exports = { getPlaceById, getPlacesByUserId, createPlace, updatePlaceById, deletePlaceById }