const express = require('express');
const Router = express.Router();
const user = require('./user');
const auth = require('./auth');

Router.use(user);
Router.use(auth);

module.exports = Router;
