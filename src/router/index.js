const express = require('express');
const Router = express.Router();
const user = require('./user');
const auth = require('./auth');
const event = require('./event');
const specializations = require('./specialization');

Router.use('/user', user);
Router.use('/auth', auth);
Router.use('/event', event);
Router.use('/specialization', specializations);

module.exports = Router;
