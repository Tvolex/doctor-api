const Joi = require('joi');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
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
    async get(query) {
        console.log('Get users');
        try {
            params = await Joi.validate(query, Schema.get);
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

        pipeline.push({
            $project: defaultUserProject,
        });

        return Collections.users.aggregate(pipeline).toArray();
    },
    async getById(id) {
        return Collections.users.find({_id: ObjectId(id)}).next();
    },

    async getUserByPersonalKey(personalKey) {
        return Collections.users.find({personalKey}).next();
    },

    async findOne(match) {
        return Collections.users.findOne(match);
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
        patient.type = 'patient';

        try {
            await Collections.users.insertOne(patient);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        return this.getById(patient._id);
    },

    has(match) {
        return Collections.users.find(match).hasNext();
    }
};
