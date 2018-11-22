const express = require('express');
const Router = express.Router();
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const CheckAuth = require('../auth/checkAuth');
const ImagesModel = require('./model');

Router.post('/', CheckAuth, multipartMiddleware, async (req, res, next) => {

    if (!req.files && !req.files.image) {
        return res.status(400).send("Фото не завантажено!");
    }

    let insertedImage;
    let uploaded;
    try {
        uploaded = await ImagesModel.upload(req.files.image);
    } catch (err) {
        console.log(err);
        return res.status(500).send(err.message);
    }

    if (uploaded.Location) {
        insertedImage = await ImagesModel.add(uploaded);
    }

    return res.status(200).send({_id: insertedImage.insertedId.toString()});
});



module.exports = Router;
