const express = require('express');
const Router = express.Router();
const _ = require('lodash');
const moment = require('moment');
const config = require('../../../config');
const CheckAuth = require('../auth/checkAuth');
const UserModel = require('../user/model');
const EventModel = require('./model');
const Notificator = require('../notification');
const { EVENT_STATUS } = require('../../const');

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

Router.put('/status/:_id', CheckAuth, async (req, res, next) => {
    const { body: { status, comment } } = req;
    const { _id } = req.params;

    let eventAfterUpdate;
    try {
        eventAfterUpdate = await EventModel.updateStatus(_id, {status, comment});
    } catch (err) {
        console.log(err);

        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    let user;
    try {
        user = await UserModel.getById(eventAfterUpdate.value.patient);
    } catch (err) {
        console.log(err);
        return res.status(err.status || 500).send({type: 'error', message: err.message});
    }

    if (!eventAfterUpdate.ok) {
        return res
            .status(2)
            .send({ type: 'error', message: `Статус не змінений!`});
    }

    if (_.isEqual(status, EVENT_STATUS.REJECTED)) {
        if (user.email && eventAfterUpdate.value.comment) {
            Notificator.sendEmail(user.email,
                `На жаль, ваш запис на дату: ${eventAfterUpdate.value.fullDate.replace(':', ' та час: ')} відхилений з наступним коментарієм: "${eventAfterUpdate.value.comment}"`);
        }

        if (user.contact && eventAfterUpdate.value.comment) {
            Notificator.sendSMS(user.contact, `На жаль, ваш запис на дату: ${eventAfterUpdate.value.fullDate.replace(':', ' та час: ')} відхилений з наступним коментарієм: "${eventAfterUpdate.value.comment}"`);
        }
    }

    return res
        .status(200)
        .send({ type: 'info', message: `Статус успішно змінений!`});
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
    let { fromDate, toDate } = req.query;
    let { uId } = req.session;

    const currentDate = moment();
    currentDate.utcOffset(config.TZ);

    if (fromDate && toDate) {
        fromDate = moment(fromDate, "YYYY-MM-DD:HH-mm").utcOffset(config.TZ).startOf('day').format("YYYY-MM-DD:HH-mm");
        toDate = moment(toDate, "YYYY-MM-DD:HH-mm").utcOffset(config.TZ).endOf('day').format("YYYY-MM-DD:HH-mm");
    } else {
        fromDate = currentDate.startOf('day').format("YYYY-MM-DD:HH-mm");
        toDate = currentDate.endOf('day').format("YYYY-MM-DD:HH-mm");
    }

    EventModel.getEventsByStatusAndTime(Object.values(EVENT_STATUS), { fromDate, toDate, doctor: uId }).then((events) => {
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
