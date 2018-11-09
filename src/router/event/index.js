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

        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    return res
        .status(500)
        .send({ type: 'error', message: 'Something went wrong'});

});

Router.put('/status/:_id', async (req, res, next) => {
    const { body: { status } } = req;
    const { _id } = req.params;

    let eventAfterUpdate;
    try {
        eventAfterUpdate = await EventModel.updateStatus({ _id, status});
    } catch (err) {
        console.log(err);

        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    if (eventAfterUpdate.status === status) {
        return res
            .status(200)
            .send({ type: 'info', message: `Статус успішно встановлений на ${status}`});
    }

    return res
        .status(500)
        .send({ type: 'error', message: 'Something went wrong'});

});

Router.put('/:_id', async (req, res, next) => {
    const { body: { status } } = req;
    const { _id } = req.params;

    let eventAfterUpdate;
    try {

    } catch (err) {
        console.log(err);

        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    // if (eventAfterUpdate.status === status) {
    //     return res
    //         .status(200)
    //         .send({ type: 'info', message: `Статус успішно встановлений на ${status}`});
    // }

    return res
        .status(500)
        .send({ type: 'error', message: 'Something went wrong'});

});

Router.get('/busy', async (req, res, next) => {
    const { doctor, fullDate } = req.query;

    let isDoctorBusy;
    try {
        isDoctorBusy = await EventModel.isDoctorBusy(doctor, fullDate);
    } catch (err) {
        console.log(err);
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    return res
        .status(200)
        .send(isDoctorBusy);
});


module.exports = Router;
