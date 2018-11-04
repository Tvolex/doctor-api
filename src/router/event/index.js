const express = require('express');
const Router = express.Router();
const CheckAuth = require('../auth/checkAuth');
const EventModel = require('./model');

Router.post('/', async (req, res, next) => {
    const { body } = req;

    let user;

    try {
        if (body.parsonalKey) {
            user = await EventModel.createByPersonalKey(body);
        } else if (body.newPatient) {
            user = await EventModel.create(body);
        } else {
            return res.status(400).send({
                type: 'warning',
                message: 'Need a personal key or user data'
            })
        }
    } catch (err) {
        console.log(err);
        return res.status(400)
            .send({
                type: 'error',
                message: "Error in EventModel"
            })
    }

    console.log('Create event by user: ' + user._id);

    if (user) {
        return res
            .status(200)
            .send({ type: 'info', message: `Ви були зареєстровані, при наступному запису використовуйте цей ключ: ${user.personalKey}`});
    }
    res
        .status(200)
        .send({ type: 'error', message: 'Something went wrong'});
});


module.exports = Router;
