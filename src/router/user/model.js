const Joi = require('joi');
const Schema = require('./Joi.schema');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const { getCollections } = require('../../db');
const Collections = getCollections();

const defaultUserProject = {
    email: 1,
    name: 1,
    surname: 1,
    patronymic: 1,
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

    async findOne(match) {
        return Collections.users.findOne(match);
    },

    async create(req) {
        const { body } = req;

        let params;

        try {
            params = await Joi.validate(body, Schema.create);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        return Collections.users.insertOne(params);
    },
};
