const _ = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const UserModel = require('../user/model');
const { getCollections } = require('../../db');
const Collections = getCollections();

function customErr(description, status) {
    const error = new Error(description);
    error.status = status || 500;
    error.isCustom = true;
    throw error;
}

module.exports = {
    async get() {
        return Collections.specializations.find().toArray();
    },

    async getOneById(id) {
        return Collections.specializations.find({_id: ObjectId(id)}).next();
    },

    async getByMatch(match) {
        return Collections.specializations.find(match).toArray();
    },

    async add(name) {
        const isExistWithSameName = await this.getByMatch({name});

        if (!_.isEmpty(isExistWithSameName)) {
            return customErr('Така спеціалізація вже існує.', 400)
        }

        return Collections.specializations.insertOne({name});
    }
};
