const uuid = require('uuid/v1');
const AWS = require('aws-sdk');
const path = require('path');
const { isEmpty, isFinite, toNumber } = require('lodash');

AWS.config.loadFromPath(path.join(__dirname, '..', 'aws-config.json'));
const s3 = new AWS.S3();

const incompleteAssets = new Map();
const completeAssets = new Set();

const newAssetHandler = (req, res) => {
  const id = uuid();
  const params = {
    Bucket: 'ts-engineering-test',
    Key: id
  };

  s3.getSignedUrl('putObject', params, function(err, url) {
    if (err) {
      console.error(err);
      res.status(500).send('Error creating asset on S3');
      return;
    }
    incompleteAssets.set(id, url);
    res.json({
      upload_url: url,
      id
    });
  });
};

const completeAssetUpload = (req, res) => {
  const id = req.params.id;
  if (isEmpty(id)) {
    return res.status(400).send('Missing asset id');
  }

  const { status } = req.body;
  if (status === 'uploaded' && incompleteAssets.has(id)) {
    incompleteAssets.delete(id);
    completeAssets.add(id);
  }
  res.sendStatus(200);
};

const getCompletedAsset = (req, res) => {
  const id = req.params.id;
  if (isEmpty(id)) {
    return res.status(400).send('Missing asset id');
  }
  if (!completeAssets.has(id)) {
    return res
      .status(400)
      .send('Only complete assets are allowed to be fetched');
  }

  const { timeout = 60 } = req.query;
  const params = {
    Bucket: 'ts-engineering-test',
    Key: id,
    Expires: isFinite(toNumber(timeout)) ? toNumber(timeout) : 60
  };

  s3.getSignedUrl('getObject', params, function(err, url) {
    if (err) {
      console.error(err);
      res.status(500).send('Error getting signed URL for asset download');
      return;
    }

    res.json({
      download_url: url
    });
  });
};

module.exports = {
  newAssetHandler,
  completeAssetUpload,
  getCompletedAsset
};
