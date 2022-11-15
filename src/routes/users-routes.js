const express = require('express');
const { check } = require('express-validator')

const { getAllUsers, login, signup } = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', getAllUsers)

router.post(
    '/signup',
    fileUpload.single('image'),  // Middleware to retrieve a single file
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 }),
    ]
    , signup
);

router.post('/login',
    [
        check('email').isEmail(),
        check('password').not().isEmpty()
    ]
    , login
);

module.exports = router;