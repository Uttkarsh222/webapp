const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Function to check if file is an image
const imageFileFilter = (req, file, cb) => {
    // Accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFileFilter
});

// POST route for uploading an image
router.post('/pic', authMiddleware, upload.single('profilePic'), (req, res, next) => {
    const methodNotAllowedMethods = ['HEAD', 'OPTIONS', 'PATCH'];
    if (req.fileValidationError) {
        return res.status(400).send(req.fileValidationError);
    }
    next();
}, imageController.uploadProfilePic);

// GET route for retrieving the profile picture
router.get('/pic', authMiddleware, imageController.getProfilePic);

// DELETE route for deleting the profile picture
router.delete('/pic', authMiddleware, imageController.deleteProfilePic);

// Handle unsupported methods on the /pic endpoint
router.all('/pic', (req, res) => {
    res.status(405).send('Method Not Allowed');
});

module.exports = router;
