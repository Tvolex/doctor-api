const express = require('express');
const Router = express.Router();
const user = require('./user');

Router.use(user);

module.exports = Router;
