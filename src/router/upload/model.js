const Joi = require('joi');
const _ = require('lodash');
const AWS = require('aws-sdk');
const fs = require('fs');
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment');
const { getCollections } = require('../../db');
const {
    AWS_ACCESS_KEY_ID,
    AWS_S3_BUCKET_NAME,
    AWS_S3_BUCKET_REGION,
    AWS_SECRET_ACCESS_KEY,
} = require('../../../config');
const Collections = getCollections();

AWS.config.update({ AWS_S3_BUCKET_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY });
const S3 = new AWS.S3();

function customErr(description, status) {
    const error = new Error(description);
    error.status = status || 500;
    error.isCustom = true;
    throw error;
}

module.exports = {

    async findOne(match) {
        return Collections.images.findOne(match);
    },

    async find(match) {
        return Collections.images.find(match).toArray();
    },

    async add(obj) {
        return Collections.images.insertOne(obj);
    },

    async upload(file) {
        if (!file) {
            return customErr(400, 'No such file')
        }

        let stream = fs.createReadStream(file.path);

        const options = {
            Key: file.originalFilename,
            Body: stream,
            ACL: 'public-read',
            ContentType: file.type,
            Bucket: AWS_S3_BUCKET_NAME,
        } ;

        const result = await S3.upload(options).promise();

        fs.unlink(file.path, function (err) {
            if (err) {
                console.error(err);
            }
            console.log(`Temp File Delete: ${file.path}`);
        });

        return result;
    },
};
