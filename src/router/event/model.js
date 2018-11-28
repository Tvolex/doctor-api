const Joi = require('joi');
const moment = require('moment');
const Schema = require('./Joi.schema');
const UserSchema = require('../user/Joi.schema');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const { getCollections } = require('../../db');
const { EVENT_STATUS } = require('../../const');
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

const matchByDate = (fromDate, toDate) => {
    const $and = [];
    if (fromDate) {
        $and.push({
            fullDate: {
                $gte: new Date(fromDate),
            },
        });
    }

    if (toDate) {
        $and.push({
            fullDate: {
                $lte: new Date(toDate),
            },
        });
    }

    return $and;
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

        const existedDoctor = await UserModel.findOne({_id: ObjectId(event.doctor)});
        if (!existedDoctor) {
            return customErr('Такого лікаря не існує', 400);
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
        event.cabinet = existedDoctor.cabinet;
        event.specialization = ObjectId(event.specialization);

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

    async updateStatus(_id, { status, comment }) {
        let event;
        try {
            event = await Joi.validate({_id, status, comment}, Schema.updateEventStatus);
        } catch (err) {
            err.status = 400;
            throw err;
        }

        return Collections.events.findOneAndUpdate({
            _id: ObjectId(event._id),
        },{
            $set: {
                status: event.status,
                comment: event.comment,
            }
        }, {
            new: true,
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
        event.specialization = ObjectId(event.specialization);

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

    async getEventsByStatus(status = EVENT_STATUS.PLANNED) {
        const pipeline = [
            {
                $match: {
                    status
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {
                        patient: "$patient",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$patient"] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "patient"
                }
            },
            {
                $unwind: {
                    path: "$patient"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {
                        doctor: "$doctor",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$doctor"],
                                }
                            }
                        }
                    ],
                    as: "doctor"
                }
            },
            {
                $unwind: {
                    path: "$doctor"
                }
            },
        ];

        return Collections.events.aggregate(pipeline).toArray();
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
    },

    async groupForStatisticsByDoctor(req) {
        let params;
        try {
            params = await Joi.validate(req.query, UserSchema.get);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        const pipeline = [];

        let $andForMatchByDate = null;
        if (params.filter && params.filter.fromDate && params.filter.toDate) {
            $andForMatchByDate = matchByDate(params.filter.fromDate, params.filter.toDate);
        }

        pipeline.push(...[
            {
                $addFields: {
                    fullDate: {
                        $dateFromString: {
                            dateString: "$fullDate",
                            format: "%Y-%m-%d:%H-%M",
                        }
                    }
                }
            },
            {
                $match: {
                    $and: $andForMatchByDate || [
                        {
                            $expr: {
                                $eq: ["$_id", "$_id"],
                            }
                        }
                    ],
                }
            },
            {
                $group: {
                    _id: "$doctor",
                    count: {
                        $sum: 1,
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: {
                        doctor: "$_id",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$doctor"]
                                }
                            }
                        }
                    ],
                    as: "doctor"
                }
            },
            {
                $unwind: {
                    path: "$doctor"
                }
            },
            {
                $addFields: {
                    doctor: "$doctor.fullName"
                }
            },
            {
                $sort: {
                    count: -1,
                }
            }
        ]);

        return Collections.events.aggregate(pipeline).toArray();
    }
};
