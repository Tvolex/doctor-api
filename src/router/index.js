const express = require('express');
const Router = express.Router();
const user = require('./user');
const auth = require('./auth');

Router.use('/user', user);
Router.use('/auth', auth);

module.exports = Router;
