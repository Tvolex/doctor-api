const Joi = require('joi');
const Schema = require('./Joi.schema');
const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');
const { getCollections } = require('../../db');
const Collections = getCollections();

const defaultUserProject = {
    _id: 1,
    email: 1,
    password: 1,
    username: 1,
    birthyear: 1,
    birthmonth: 1,
    birthday: 1,
    city: 1,
    street: 1,
    house: 1,
    apartment: 1,
    passportSeries: 1,
    passportNumber: 1,
};

const filterBuilder = (filters) => {
    const $and = [];

    for (let filter in filters) {
        switch (filter) {
            case "city":
                $and.push({city: filter.city});
                break;
            case "street":
                $and.push({street: filter.street});
                break;
            case "house":
                $and.push({house: filter.house});
                break;
            case "apartment":
                $and.push({apartment: filter.apartment});
                break;
            case "birthyear":
                $and.push({birthyear: filter.birthyear});
                break;
            case "birthmonth":
                $and.push({birthmonth: filter.birthmonth});
                break;
            case "birthday":
                $and.push({birthday: filter.birthday});
                break;
        }
    }

    return $and;
};

module.exports = {
    async get(req) {
        const { query, body } = req;

        let params;

        try {
            params = await Joi.validate(query, Schema.get);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        const pipeline = [];

        if (!_.isEmpty(params.filter)) {
            pipeline.push(filterBuilder(filter));
        }

        return Collections.users.aggregate(pipeline).toArray();
    },

    async findByCredential({email, password}) {
        return Collections.users.find({email, password}).next();
    },

    async findOne(match) {
        return Collections.users.findOne(match);
    },

    async getById(_id) {
        return Collections.users.findOne({ _id: ObjectID(_id) });
    },

    async updateUserSession({_id, session}){
        return Collections.users.findOneAndUpdate({
            _id: ObjectID(_id)
        }, {
            $set: { session }
        }, {
            projection: defaultUserProject
        });
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
