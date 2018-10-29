const express = require('express');
const Router = express.Router();
const UserModel = require('./model');

Router.get('/users', async (req, res, next) => {
    const users = await UserModel.get();

    res.send(users);
});

module.exports = Router;
