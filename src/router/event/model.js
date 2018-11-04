const Joi = require('joi');
const Schema = require('./Joi.schema');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const { getCollections } = require('../../db');
const Collections = getCollections();
const UserModel = require('../user/model');

module.exports = {

    async create(body) {
        let event;
        try {
            event = await Joi.validate(body.event, Schema.event);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        let patient;
        try {
            patient = await Joi.validate(body.newPatient, Schema.newPatient);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        const user = await UserModel.createNewPatient(patient);

        if (!user) {
            const err = new Error('Error in createNewPatient');
            err.status = 400;
            throw err;
        }

        const eventFullData = {
            event,
            user: user._id,
        };

        try {
            await Collections.events.insertOne(eventFullData);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        return UserModel.getById(user._id);
    },

    async createByPersonalKey(body) {
        let event;
        try {
            event = await Joi.validate(body.event, Schema.event);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        let personalKey;
        try {
            personalKey = await Joi.validate(body.personalKey, Schema.personalKey);
        } catch (err) {
            err.status = 400;
            console.log(err);
            throw err;
        }

        const user = UserModel.getUserByPersonalKey(personalKey);

        if (!user) {
            const err = new Error('Персонального ключа не існує');
            err.status = 400;
            throw err;
        }

        const eventFullData = {
            ...event,
            user: user._id,
        };

        return Collections.events.insertOne(eventFullData);
    },
};
