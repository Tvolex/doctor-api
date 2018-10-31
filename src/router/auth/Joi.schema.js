const Joi = require('joi');

const currentDate = new Date();

module.exports = {
    create: Joi.object().keys({
        email: Joi.string().email({ minDomainAtoms: 2 }).required(),
        password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
        username: Joi.string().alphanum().min(3).max(30).required(),
        birthyear: Joi.number().integer().min(1900).max(currentDate.getFullYear()).required(),
        birthmonth: Joi.number().integer().min(0).max(12).required(),
        birthday: Joi.number().integer().min(1).max(31).required(),
        city:   Joi.string().required(),
        street:  Joi.string().required(),
        house: Joi.number().required(),
        apartment: Joi.number(),
        passportSeries: Joi.string().max(4).required(),
        passportNumber: Joi.number().min(5).max(7).required(),
    }),
    get: Joi.object().keys({
        email: Joi.string().email({ minDomainAtoms: 2 }).required(),
        password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
    }),
    get: Joi.object().keys({
        filter: Joi.object().keys({
            birthyear: Joi.number().integer().min(1900).max(currentDate.getFullYear()).required(),
            birthmonth: Joi.number().integer().min(0).max(12).required(),
            birthday: Joi.number().integer().min(1).max(31).required(),
            city:   Joi.string().required(),
            street:  Joi.string().required(),
            house: Joi.number().required(),
            apartment: Joi.number(),
        }),
    }),

};