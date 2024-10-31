const AWS = require('aws-sdk');
const Image = require('../models/image');
const { v4: uuidv4 } = require('uuid');
const { logger, statsDClient } = require('../logger'); // Import centralized logger and metrics

// Configure AWS S3
AWS.config.update({
  region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

exports.uploadProfilePic = async (req, res) => {
  if (!req.file) {
    return res.status(400).json();
  }

  const start = Date.now();
  try {
    const existingImage = await Image.findOne({ where: { userId: req.user.id } });
    if (existingImage) {
      return res.status(400).json();
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
    const duration = Date.now() - start;
    statsDClient.timing('s3.upload.duration', duration);
    logger.info(`S3 upload duration for user ID ${req.user.id}: ${duration}ms`);

    const image = await Image.create({
      fileName: file.originalname,
      url: uploadResult.Location,
      userId: req.user.id
    });

    res.status(201).json(image);
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Error uploading file for user ID ${req.user.id}: ${error.message} - Duration: ${duration}ms`);
    statsDClient.increment('s3.upload.fail');
    res.status(500).json();
  }
};

exports.deleteProfilePic = async (req, res) => {
  if (Object.keys(req.body).length > 0 || req.file || req.files) {
    return res.status(400).json();
  }

  const start = Date.now();
  try {
    const image = await Image.findOne({ where: { userId: req.user.id } });
    if (!image) {
      logger.info(`No image found for user ID: ${req.user.id}`);
      return res.status(404).json();
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${req.user.id}/${image.fileName}`
    };

    await s3.deleteObject(params).promise();
    await image.destroy();

    const duration = Date.now() - start;
    statsDClient.timing('s3.delete.duration', duration);
    logger.info(`Image deleted for user ID: ${req.user.id} - Duration: ${duration}ms`);
    res.sendStatus(204);
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Error deleting profile picture for user ID ${req.user.id}: ${error.message} - Duration: ${duration}ms`);
    statsDClient.increment('s3.delete.fail');
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
      logger.info(`No profile picture found for user ID: ${req.user.id}`);
      return res.status(404).json();
    }

    logger.info(`Profile picture retrieved for user ID: ${req.user.id}`);
    res.json(image);
  } catch (error) {
    logger.error(`Error retrieving profile picture for user ID ${req.user.id}: ${error.message}`);
    res.status(500).json();
  }
};
