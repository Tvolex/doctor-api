const Joi = require('joi');
const Schema = require('./Joi.schema');
const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');
const { getCollections } = require('../../db');
const Collections = getCollections();

const defaultUserProject = {
    email: 1,
    name: 1,
    surname: 1,
    patronymic: 1,
    birthdate: 1,
    city: 1,
    admin: 1,
    street: 1,
    house: 1,
    apartment: 1,
    passportSeries: 1,
    passportNumber: 1,
    type: 1,
    specialization: 1,
};

module.exports = {
    async updateUserSession({_id, session}){
        return Collections.users.findOneAndUpdate({
            _id: ObjectID(_id)
        }, {
            $set: { session }
        }, {
            projection: defaultUserProject
        });
    },

};
