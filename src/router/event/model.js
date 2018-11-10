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

const getWorkTimes = () => {

    const times = [];

    ['10', '11', '12', '13', '14', '15', '16', '17']
        .forEach(hour => times.push(`${hour}:00`));

    return times;
};

module.exports = {

    async getEventsByUserId(id) {
        const pipeline = [];

        pipeline.push({
            $match: {
                $or: [
                    { patient: ObjectId(id) },
                    { doctor: ObjectId(id) }
                ]
            }
        });

        pipeline.push({
            $sort: {
                fullDate: -1,
            }
        });
        return Collections.events.aggregate(pipeline).toArray();
    },

    async isDoctorBusy(_id, fullDate) {
        const doctorEvents = await this.getEventsByUserId(_id);

        let busy = false;

        doctorEvents.forEach(event => {
            if (_.isEqual(moment(event.fullDate, "YYYY-MM-DD:HH-mm"), moment(fullDate, "YYYY-MM-DD:HH-mm"))) {
                busy = true;
            }
        });

        return busy;
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

        event.fullDate = moment(event.date, "YYYY-MM-DD")
            .set('hour', hour)
            .set('minute', minute)
            .startOf('second')
            .format("YYYY-MM-DD:HH-mm");
        event.year = moment(event.fullDate, "YYYY-MM-DD:HH-mm").get('year');
        event.month = moment(event.fullDate, "YYYY-MM-DD:HH-mm").get('month');
        event.date = moment(event.fullDate, "YYYY-MM-DD:HH-mm").get('date');
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
            patient: user._id,
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

        event.fullDate = moment(event.date, "YYYY-MM-DD")
            .set('hour', hour)
            .set('minute', minute)
            .startOf('second')
            .format("YYYY-MM-DD:HH-mm");
        event.year = moment(event.fullDate, "YYYY-MM-DD:HH-mm").get('year');
        event.month = moment(event.fullDate, "YYYY-MM-DD:HH-mm").get('month');
        event.date = moment(event.fullDate, "YYYY-MM-DD:HH-mm").get('date');

        event.doctor = ObjectId(event.doctor);

        const usersEvents = await this.getEventsByUserId(user._id);

        const isEventAlreadyExist = usersEvents.filter(uEvent => _.isEqual(uEvent.fullDate, event.fullDate) &&
            _.isEqual(uEvent.specialization, event.specialization) &&
            _.isEqual(uEvent.doctor.toString(), event.doctor.toString()));

        if (!_.isEmpty(isEventAlreadyExist)) {
            return customErr('Користувач вже був зареєстрований до поточного лікаря, за поточною спеціалізацією та датою!', 400);
        }

        if (await this.isDoctorBusy(event.doctor, event.fullDate)) {
            return customErr('Нажаль лікар зайнятий на цей час, будь-ласка виберіть інший!', 400);
        }


        const eventFullData = {
            ...event,
            patient: user._id,
        };

        return Collections.events.insertOne(eventFullData);
    },

    async getAvailableTimes(doctor, fullDate) {
        let userEvents;

        try {
            userEvents = await this.getEventsByUserId(doctor);
        } catch(err)  {
            return customErr(err.message, 400);
        }

        const plannedUserEvents = userEvents.filter(event =>
            moment(event.fullDate, "YYYY-MM-DD:HH-mm")
                .isBetween(
                    moment(fullDate, "YYYY-MM-DD:HH-mm").startOf('day'),
                    moment(fullDate, "YYYY-MM-DD:HH-mm").endOf('day')
                )
        );

        const busyTimes = plannedUserEvents.map(event => event.time);

        return getWorkTimes().filter(time => !busyTimes.includes(time));
    }
};
