const Joi = require('joi');

const currentDate = new Date();

const email = Joi.string().email({ minDomainAtoms: 2 }).required();
const password = Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required();
const name = Joi.string().alphanum().min(3).max(30).required();
const surname = Joi.string().alphanum().min(3).max(30).required();
const patronymic = Joi.string().alphanum().min(3).max(30).required();
const birthdate = Joi.date().required();
const city = Joi.string().required();
const street = Joi.string().required();
const house = Joi.number().required();
const apartment = Joi.number();
const passportSeries = Joi.string().max(4).required();
const passportNumber = Joi.number().min(5).max(7).required();

module.exports = {
    create: Joi.object().keys({
        email,
        password,
        name,
        surname,
        patronymic,
        birthdate,
        city,
        street,
        house,
        apartment,
        passportSeries,
        passportNumber,
    }),
    registerPatient: Joi.object().keys({
        email,
        name,
        surname,
        patronymic,
        birthdate,
        city,
        street,
        house,
        apartment,
        passportSeries,
        passportNumber,
    }),

    get: Joi.object().keys({
        filter: Joi.object().keys({
            birthdate: Joi.date(),
            city:   Joi.string(),
            street:  Joi.string(),
            house: Joi.number(),
            apartment: Joi.number(),
            type: Joi.array().items(Joi.string()),
            specialization: Joi.array().items(Joi.string()),
        }),
    }),
};