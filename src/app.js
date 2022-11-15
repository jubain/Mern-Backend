const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gphr2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

const app = express();
app.use(bodyParser.json());

app.use(express.static(__dirname));

// CORS - adding headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
})

app.use('/api/places', placesRoutes) //=>/api/places
app.use('/api/users', usersRoutes) //=>/api/users

// Error handling for unsupported routes
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404)
    throw error
})

// Error handling middleware function (executes if any middleware above it throws an error)
app.use((error, req, res, next) => {
    // If req has file delete the file
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500);
    res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose.connect(uri)
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log('server listening on port 5000')
        })
    })
    .catch(err => {
        console.log(err)
    });
