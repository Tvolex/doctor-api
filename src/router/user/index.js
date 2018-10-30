const express = require('express');
const Router = express.Router();
const CheckAuth = require('../auth/checkAuth');
const UserModel = require('./model');

Router.get('/user', async (req, res, next) => {
    const users = await UserModel.get(req);

    res.send(users);
});

Router.post('/user', CheckAuth, async (req, res, next) => {
    const user = await UserModel.create(req);

    res.send(user);
});

module.exports = Router;
