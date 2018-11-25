const Joi = require('joi');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment');
const keygen = require("keygenerator");
const { getCollections } = require('../../db');
const Notificator = require('../notification');
const Schema = require('./Joi.schema');
const Collections = getCollections();

function customErr(description, status) {
    const error = new Error(description);
    error.status = status || 500;
    error.isCustom = true;
    throw error;
}

const defaultUserProject = {
    city: 1,
    name: 1,
    type: 1,
    email: 1,
    admin: 1,
    house: 1,
    street: 1,
    avatar: 1,
    cabinet: 1,
    events: 1,
    surname: 1,
    fullName: 1,
    birthdate: 1,
    apartment: 1,
    patronymic: 1,
    personalKey: 1,
    passportSeries: 1,
    passportNumber: 1,
    specialization: 1,
};
const avatarLookup = [
    {
        $lookup: {
            from: 'images',
            let: {
                avatarId: '$avatar',
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $eq: ["$_id", "$$avatarId"]
                        }
                    }
                },
            ],
            as: 'avatar',
        }
    },
    {
        $addFields: {
            "avatar": {
                $cond: [
                    { $eq: ["$avatar", []] },
                    null,
                    { $arrayElemAt: ["$avatar", 0] },
                ]
            }
        }
    },
    {
        $addFields: {
            "avatar": {
                $cond: [
                    { $eq: ["$avatar", []] },
                    null,
                    "$avatar.Location",
                ]
            }
        }
    }
];

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

        if (option && option.forStatistics) {
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
                    },
                },
                {
                    $unwind: {
                        path : "$events",
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $group: {
                        _id: "$_id",
                        patient: {
                            "$first": "$$ROOT"
                        }
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: "$patient"
                    }
                }
            ]);
        }

        pipeline.push(...avatarLookup);

        pipeline.push({
            $project: defaultUserProject,
        });

        return Collections.users.aggregate(pipeline).toArray();
    },

    async getPatients(req) {
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

        if (!_.isEmpty(params.search)) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            email: {
                                $regex: `.*${params.search}.*`,
                                $options: 'i',
                            }
                        },
                        {
                            fullName: {
                                $regex: `.*${params.search}.*`,
                                $options: 'i',
                            }
                        },
                        {
                            city: {
                                $regex: `.*${params.search}.*`,
                                $options: 'i',
                            }
                        },
                        {
                            street: {
                                $regex: `.*${params.search}.*`,
                                $options: 'i',
                            }
                        },
                        {
                            birthdate: {
                                $regex: `.*${params.search}.*`,
                                $options: 'i',
                            }
                        },
                        {
                            passportNumber: {
                                $regex: `.*${params.search}.*`,
                                $options: 'i',
                            }
                        },
                    ],
                }
            });
        }

        let $andForMatchByDate = null;
        if (params.filter && params.filter.fromDate && params.filter.toDate) {
            $andForMatchByDate = matchByDate(params.filter.fromDate, params.filter.toDate);
        }

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
                        }
                    ],
                    as: 'events',
                },
            },
            {
                $addFields: {
                    "hadEvents": {
                        $cond: [
                            {$ne: ["$events", []]},
                            true,
                            false
                        ],
                    },
                },
            },
            {
                $facet: {
                    withEvents: [
                        {
                            $match: {
                                "hadEvents": true,
                            }
                        },
                        ...avatarLookup,
                        {
                            $project: defaultUserProject,
                        },
                    ],
                    withoutEvents: [
                        {
                            $lookup: {
                                from: 'events',
                                let: {
                                    patient: '$_id',
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ['$patient', '$$patient']
                                            },
                                        }
                                    },
                                ],
                                as: 'events',
                            },
                        },
                        {
                            $match: {
                                events: { $eq: [] },
                            },
                        },
                        ...avatarLookup,
                        {
                            $project: defaultUserProject,
                        }
                    ],
                    groupByDate: [
                        {
                            $match: {
                                "hadEvents": true,
                            },
                        },
                        {
                            $replaceRoot: {
                                newRoot: { events: "$events" }
                            }
                        },
                        {
                            $unwind: {
                                path: "$events",
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    date: "$events.date",
                                    month: "$events.month",
                                    year: "$events.year"
                                },
                                count: { $sum: 1 },
                            }
                        },
                    ],
                }
            },
        ]);

        return Collections.users.aggregate(pipeline).next();
    },

    async getById(id, doctor) {
        const pipeline = [
            {
                $match: {
                    _id: ObjectId(id),
                }
            },
            ...avatarLookup,
        ];

        pipeline.push({
            $project: defaultUserProject,
        });

        return Collections.users.aggregate(pipeline).next();
    },

    async getUserWithEvents(id, doctor) {
        let lookupMatchPipeline;

        if (doctor) {
            lookupMatchPipeline = {
                $and: [
                    {
                        $eq: ['$patient', '$$user'],
                    },
                    {
                        $eq: ['$doctor', ObjectId(doctor)],
                    },
                ],
            }
        } else {
            lookupMatchPipeline = {
                $or: [
                    {
                        $eq: ['$patient', '$$user'],
                    },
                    {
                        $eq: ['$doctor', '$$user'],
                    },
                ],
            }
        }

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
                                    ...lookupMatchPipeline,
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'specializations',
                                let: {
                                    specialization: "$specialization",
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$specialization"]
                                            }
                                        }
                                    }
                                ],
                                as: "specialization"
                            }
                        },
                        {
                            $unwind: {
                                path: "$specialization",
                            }
                        },
                        {
                            $addFields: {
                                specialization: "$specialization.name",
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
                                                $eq: ["$_id", "$$patient"]
                                            }
                                        }
                                    }
                                ],
                                as: "patient"
                            }
                        },
                        {
                            $unwind: {
                                path: "$patient",
                            }
                        },
                        {
                            $addFields: {
                                patient: "$patient._id",
                                patientFullName: "$patient.fullName",
                            }
                        }
                    ],
                    as: 'events',
                }
            },
            ...avatarLookup,
        ];

        pipeline.push({
            $project: defaultUserProject,
        });

        return Collections.users.aggregate(pipeline).next();
    },

    async getEventsByPatient(patient, doctor) {
        const $and = [];

        if (doctor) {
            $and.push({ $eq: ['$doctor', ObjectId(doctor)] });
        }
        if (patient) {
            $and.push({  $eq: ['$patient', '$$patient'] });
        }

        const pipeline = [
            {
                $match: {
                    _id: ObjectId(uId),
                }
            },
            {
                $lookup: {
                    from: 'events',
                    let: {
                        patient: '$_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and
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

        if ( await this.has({ email: patient.email }) ) {
            return customErr('Цей Email вже використовуэться іншим пацієнтом!', 400);
        }
        if ( await this.has({ passportSeries: patient.passportSeries, passportNumber: patient.passportNumber}) ) {
            return customErr('Пацієнт з такими паспортними даними вже існує!', 400);
        }

        patient._id = new ObjectId();
        patient.avatar = patient.avatar ? ObjectId(patient.avatar) : null;
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

        // Notificator.sendSMS('+380508554730', `Ваш персональний ключ: ${patient.personalKey}`);
        Notificator.sendEmail(patient.email, `Ваш персональний ключ: </b>${patient.personalKey}</b> . При наступному записі просто використовуйте цей ключ.`);

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
        doctor.avatar = doctor.avatar ? ObjectId(doctor.avatar) : null;
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

    async updateOne(_id, updateFields) {
        return Collections.users.findOneAndUpdate(
            {
                _id: ObjectId(_id)
            },
            {
                $set: updateFields
            },
            {
                new : true,
            }
        )
    },

    has(match) {
        return Collections.users.find(match).hasNext();
    }
};
