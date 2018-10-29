const { getCollections } = require('../../db');
const Collections = getCollections();

module.exports = {
    async get() {
        return Collections.users.find({}).toArray();
    },

    async create() {
        return Collections.users.find({}).toArray();
    },
};
