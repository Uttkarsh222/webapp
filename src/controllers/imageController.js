const AWS = require('aws-sdk');
const Image = require('../models/image');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
AWS.config.update({
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

exports.uploadProfilePic = async (req, res) => {
  if (!req.file) {
    return res.status(400).json();
  }

  try {
    const existingImage = await Image.findOne({ where: { userId: req.user.id } });
    if (existingImage) {
      return res.status(403).json();
    }

    const file = req.file;
    const key = `${req.user.id}/${file.originalname}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    const image = await Image.create({
      fileName: file.originalname,
      url: uploadResult.Location,
      userId: req.user.id
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json();
  }
};

exports.deleteProfilePic = async (req, res) => {
    if (Object.keys(req.body).length > 0 || req.file|| req.files) {
        return res.status(400).json();
    }

    try {
        const image = await Image.findOne({ where: { userId: req.user.id } });
        if (!image) {
            console.log(`No image found for user ID: ${req.user.id}`);
            return res.status(404).json()
        }

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${req.user.id}/${image.fileName}`
        };

        await s3.deleteObject(params).promise();
        await image.destroy();
        console.log(`Image deleted for user ID: ${req.user.id}`);
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json();
    }
};


exports.getProfilePic = async (req, res) => {
    if (Object.keys(req.body).length > 0) {
      return res.status(400).json();
    }
  
    try {
      const image = await Image.findOne({ where: { userId: req.user.id } });
      if (!image) {
        return res.status(404).json();
      }
      res.json(image);
    } catch (error) {
      console.error('Error retrieving profile picture:', error);
      res.status(500).json();
    }
  };
  


