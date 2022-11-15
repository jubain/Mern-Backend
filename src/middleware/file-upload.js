const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const fileUpload = multer({
    limits: 500000,
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../uploads/images'));
            // cb(null,'../uploads/images')
        },
        filename: (req, file, cb) => {
            const extractedExtension = MIME_TYPE_MAP[file.mimetype];
            cb(null, uuidv4() + '.' + extractedExtension)
        }
    }),
    fileFilter: (req, file, cb) => {
        // !! convert undefined or null to false
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error('Invalid mime type')
        cb(error, isValid);
    }
});

module.exports = fileUpload;