const express = require('express');
const { check } = require('express-validator')
const { getPlaceById, getPlacesByUserId, createPlace, updatePlaceById, deletePlaceById } = require('../controllers/places-controller');
const checkAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

// To make middleware
const router = express.Router();

// Adding logic function to the controller
router.get('/:placeId', getPlaceById)

router.get('/user/:userId', getPlacesByUserId)

// Check token to protect route
router.use(checkAuth); 
// Need to Validate Post and Patch
router.post('/',
    fileUpload.single('image'),
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 }),
        check('address').not().isEmpty(),
    ],
    createPlace)

router.patch('/:pid',
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 }),
    ]
    , updatePlaceById)

router.delete('/:pid', deletePlaceById)

module.exports = router