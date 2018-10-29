const mongodb = require ('mongodb');
const MongoClient = mongodb.MongoClient;
const { DB_URI } = require('../config');

const Collections = [];
let isConnected = false;
let client = null;

async function init () {
    try {
        client = await MongoClient.connect(DB_URI);
        isConnected = !!client;
    } catch (err) {
        console.log(err);
    }

    return client;
};

const checkIsConnected = () => {
    return isConnected;
};

const initCollections = async () => {
    if (isConnected) {
        Collections.users = client.db('dev').collection('users');

        return Collections;
    }
    return null;
};

const getCollections = () => {
    return Collections;
};

module.exports = { init, initCollections, getCollections, checkIsConnected };
