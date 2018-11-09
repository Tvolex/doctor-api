const Joi = require('joi');
const moment = require('moment');
const Schema = require('./Joi.schema');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const { getCollections } = require('../../db');
const Collections = getCollections();
const UserModel = require('../user/model');

function customErr(description, status) {
    const error = new Error(description);
    error.status = status || 500;
    error.isCustom = true;
    throw error;
}

module.exports = {

    async getEventsByUserId(id) {
        return Collections.events.find({user: ObjectId(id)}).sort({fullDate: -1}).toArray();
    },

    async isDoctorBusy(_id, fullDate) {
        const doctorEvents = await this.getEventsByUserId(_id);

        doctorEvents.forEach(event => {
            if (_.isEqual(event.fullDate, fullDate)) {
                return true;
            }
        });

        return false;
    },

    async create(body) {
        let event;
        try {
            event = await Joi.validate(body.event, Schema.createEvent);
        } catch (err) {
            return customErr(err.message, 400);
        }

        let patient;
        try {
            patient = await Joi.validate(body.newPatient, Schema.newPatient);
        } catch (err) {
            return customErr(err.message, 400);
        }

        const existedUser = await UserModel.findOne({email: patient.email});
        if (existedUser !== null) {
            return customErr('Користувач з таким емайлом вже зареєстрований!', 400);
        }

        const [ hour, minute ] = event.time.split(':');

        event.fullDate = moment(event.date)
            .set('hour', hour)
            .set('minute', minute)
            .startOf('second')
            .format();
        event.year = moment(event.fullDate).get('year');
        event.month = moment(event.fullDate).get('month');
        event.date = moment(event.fullDate).get('date');
        event.doctor = ObjectId(event.doctor);

        if (await this.isDoctorBusy(event.doctor, event.fullDate)) {
            return customErr('Нажаль лікар зайнятий на цей час, будь-ласка виберіть інший!', 400);
        }

        const user = await UserModel.createNewPatient(patient);

        if (!user) {
            return customErr('Error in createNewPatient', 400);
        }

        const eventFullData = {
            ...event,
            user: user._id,
        };

        try {
            await Collections.events.insertOne(eventFullData);
        } catch (err) {
            return customErr(err.message, 400);
        }

        return UserModel.getById(user._id);
    },

    async updateStatus(_id, status) {
        let event;
        try {
            event = await Joi.validate({_id, status}, Schema.updateEventStatus);
        } catch (err) {
            throw err;
        }

        return Collections.events.findOneAndUpdate({
            _id: ObjectId(event._id),
        },{
            status: event.status,
        }, {
            returnNewDocument: true,
        });
    },

    async createByPersonalKey(body) {
        let event;
        try {
            event = await Joi.validate(body.event, Schema.createEvent);
        } catch (err) {
            return customErr(err.message, 400);
        }

        let personalKey;
        try {
            personalKey = await Joi.validate(body.personalKey, Schema.personalKey);
        } catch (err) {
            return customErr(err.message, 400);
        }

        const user = await UserModel.getUserByPersonalKey(personalKey);

        if (!user) {
            return customErr('Персонального ключа не існує', 400);
        }

        const [ hour, minute ] = event.time.split(':');

        event.fullDate = moment(event.date)
            .set('hour', hour)
            .set('minute', minute)
            .startOf('second')
            .format();
        event.year = moment(event.fullDate).get('year');
        event.month = moment(event.fullDate).get('month');
        event.date = moment(event.fullDate).get('date');

        event.doctor = ObjectId(event.doctor);

        const usersEvents = await this.getEventsByUserId(user._id);

        const isEventAlreadyExist = usersEvents.filter(uEvent => _.isEqual(uEvent.fullDate, event.fullDate) &&
            _.isEqual(uEvent.specialization, event.specialization) &&
            _.isEqual(uEvent.doctor.toString(), event.doctor.toString()));

        if (!_.isEmpty(isEventAlreadyExist)) {
            return customErr('Користувач вже був зареєстрований до поточного лікаря, за поточною спеціалізацією та датою!', 400);
        }

        const eventFullData = {
            ...event,
            user: user._id,
        };

        return Collections.events.insertOne(eventFullData);
    },
};
