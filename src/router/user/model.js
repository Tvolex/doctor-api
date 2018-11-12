const Joi = require('joi');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment');
const keygen = require("keygenerator");
const { getCollections } = require('../../db');
const Schema = require('./Joi.schema');
const Collections = getCollections();

const defaultUserProject = {
    email: 1,
    name: 1,
    surname: 1,
    patronymic: 1,
    fullName: 1,
    birthdate: 1,
    city: 1,
    street: 1,
    house: 1,
    apartment: 1,
    passportSeries: 1,
    passportNumber: 1,
    type: 1,
    specialization: 1,
};

const filterBuilder = (filters) => {
    const $and = [];

    for (let filter in filters) {
        switch (filter) {
            case "city":
                $and.push({city: { $in: filters.city} });
                break;
            case "street":
                $and.push({street: { $in: filters.street} });
                break;
            case "house":
                $and.push({house: { $in: filters.house} });
                break;
            case "apartment":
                $and.push({apartment: { $in: filters.apartment} });
                break;
            case "birthdate":
                $and.push({birthdate: { $in: filters.birthdate} });
                break;
            case "type":
                $and.push({type: { $in: filters.type} });
                break;
            case "specialization":
                $and.push({specialization: { $in: filters.specialization} });
                break;
        }
    }

    return $and;
};

module.exports = {
    async get(req, option) {
        console.log('Get users');
        let params;
        try {
            params = await Joi.validate(req.query, Schema.get);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        const pipeline = [];

        if (!_.isEmpty(params.filter)) {
            pipeline.push({
                $match: {
                    $and: filterBuilder(params.filter),
                }
            });
        }

        if (option && option.filterByEvents) {
            pipeline.push(...[
                {
                    $match: {
                        type:  'patient',
                    }
                },
                {
                    $lookup: {
                        from: 'events',
                        let: {
                            patient: '$_id',
                            doctor: ObjectId(req.session.uId),
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$doctor', '$$doctor'] },
                                            { $eq: ['$patient', '$$patient'] },
                                        ],

                                    }
                                }
                            },
                        ],
                        as: 'events',
                    }
                },
            ]);
        }


        pipeline.push({
            $project: defaultUserProject,
        });

        return Collections.users.aggregate(pipeline).toArray();
    },
    async getById(id) {
        const pipeline = [
            {
                $match: {
                    _id: ObjectId(id),
                }
            },
            {
                $lookup: {
                    from: 'events',
                    let: {
                        user: '$_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $eq: ['$doctor', '$$user'],

                                        },
                                        {
                                            $eq: ['$patient', '$$user'],
                                        },
                                    ],
                                }
                            }
                        }
                    ],
                    as: 'events',
                }
            },
        ];

        return Collections.users.aggregate(pipeline).next();
    },

    async getUserByPersonalKey(personalKey) {
        return Collections.users.find({personalKey}).next();
    },

    async findOne(match) {
        return Collections.users.findOne(match);
    },

    async find(match) {
        return Collections.users.find(match).toArray();
    },

    async createNewPatient(newPatient) {
        let patient;
        try {
            patient = await Joi.validate(newPatient, Schema.createNewPatient);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        patient._id = new ObjectId();
        patient.fullName = `${patient.surname} ${patient.name} ${patient.patronymic}`;
        patient.personalKey = keygen._({forceUppercase: true});
        patient.birthdate = moment(patient.birthdate).format("YYYY-MM-DD");
        patient.type = 'patient';
        patient.createdBy = {
            date: new Date().toISOString(),
        };

        try {
            await Collections.users.insertOne(patient);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        console.log('Created new user with id: ' + patient._id);

        return this.getById(patient._id);
    },

    async createNewDoctor(newDoctor) {
        let doctor;
        try {
            doctor = await Joi.validate(newDoctor, Schema.createNewDoctor);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        doctor._id = new ObjectId();
        doctor.fullName = `${doctor.surname} ${doctor.name} ${doctor.patronymic}`;
        doctor.type = 'doctor';
        doctor.password = '123';
        doctor.createdBy = {
            date: new Date().toISOString(),
        };

        try {
            await Collections.users.insertOne(doctor);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        console.log('Created new user with id: ' + doctor._id);

        return this.getById(doctor._id);
    },

    has(match) {
        return Collections.users.find(match).hasNext();
    }
};
