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
                    .send({ type: 'info', message: `Запис по персональному ключу успішний!`});
            }

        } else if (body.newPatient) {
            user = await EventModel.create(body);

            if (user) {
                return res
                    .status(200)
                    .send({ type: 'info', message: `Ви були успішно зареєстровані! Ваш персональний ключ був відправлений вам на пошту (також перевірте СПАМ).`});
            }
        } else {
            return res.status(400).send({
                type: 'warning',
                message: 'Необхідний персональний ключ!'
            })
        }
    } catch (err) {
        console.log(err);

        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    return res
        .status(500)
        .send({ type: 'error', message: 'Щось пійшло не так!'});

});

Router.put('/status/:_id', async (req, res, next) => {
    const { body: { status, comment } } = req;
    const { _id } = req.params;

    let eventAfterUpdate;
    try {
        eventAfterUpdate = await EventModel.updateStatus(_id, {status, comment});
    } catch (err) {
        console.log(err);

        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    if (eventAfterUpdate.ok) {
        return res
            .status(200)
            .send({ type: 'info', message: `Статус успішно змінений!`});
    }

    return res
        .status(500)
        .send({ type: 'error', message: 'Щось пішло не так!'});

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

Router.get('/', async (req, res, next) => {
    const { doctor, patient } = req.query;

    EventModel.getEventsByUserId({doctor, patient}).then((events) => {
        return res.status(200).send(events);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});

Router.get('/times', async (req, res, next) => {
    const { fullDate, doctor } = req.query;
    console.log(`Get times. full date: ${fullDate}`);
    EventModel.getAvailableTimes(doctor, fullDate).then((times) => {
        return res.status(200).send(times);
    }).catch((err) => {
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    });
});



module.exports = Router;
