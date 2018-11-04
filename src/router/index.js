const express = require('express');
const Router = express.Router();
const user = require('./user');
const auth = require('./auth');
const event = require('./event');

Router.use('/user', user);
Router.use('/auth', auth);
Router.use('/event', event);

module.exports = Router;
