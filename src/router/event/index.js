const express = require('express');
const Router = express.Router();
const CheckAuth = require('../auth/checkAuth');
const EventModel = require('./model');

Router.post('/', async (req, res, next) => {
    const { body } = req;

    try {
        if (body.personalKey) {
            const dataOfInserting = await EventModel.createByPersonalKey(body);

            if (dataOfInserting.insertedId && dataOfInserting.result.ok) {
                return res
                    .status(200)
                    .send({ type: 'info', message: `Ви були успішно зареєстровані по вашому персональному ключу`});
            }

        } else if (body.newPatient) {
            user = await EventModel.create(body);

            if (user) {
                return res
                    .status(200)
                    .send({ type: 'info', message: `Ви були зареєстровані, при наступному запису використовуйте цей ключ: ${user.personalKey}`});
            }
        } else {
            return res.status(400).send({
                type: 'warning',
                message: 'Need a personal key or user data'
            })
        }
    } catch (err) {
        console.log(err);

        if (err.isCustom) {
            return res.status(err.status).send({type: 'info', message: err.message});
        }

        return res.status(500)
            .send({
                type: 'error',
                message: "Error in EventModel"
            })
    }

    return res
        .status(200)
        .send({ type: 'error', message: 'Something went wrong'});

});


module.exports = Router;
