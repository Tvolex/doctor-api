const Joi = require('joi');
Joi.ObjectId = require('joi-objectid')(Joi);
const { OBJECT_ID_REGEX } = require('../../const');

const currentDate = new Date();

const search = Joi.string().allow(['']).default(null);

const _id = Joi.ObjectId();
const email = Joi.string().email({ minDomainAtoms: 2 });
const password = Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/);
const name = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u).min(3).max(30);
const surname = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u).min(3).max(30);
const patronymic = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u).min(3).max(30);
const birthdate = Joi.date();
const city = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u);
const street = Joi.string().regex(/[a-zA-Zа-яёА-ЯЁ]/u);
const house = Joi.number();
const apartment = Joi.number();
const passportSeries = Joi.string().max(3);
const passportNumber = Joi.number();
const type = Joi.string().valid(['doctor', 'patient']);
const personalKey = Joi.string().min(32).max(32);

const specialization = Joi.array().items(Joi.string().regex(OBJECT_ID_REGEX));

module.exports = {
    createNewDoctor: Joi.object().keys({
        email: email.required(),
        name: name.required(),
        specialization: specialization.required(),
        surname: surname.required(),
        patronymic: patronymic.required(),
    }),
    createNewPatient: Joi.object().keys({
        email: email.required(),
        name: name.required(),
        surname: surname.required(),
        patronymic: patronymic.required(),
        birthdate: birthdate.required(),
        city: city.required(),
        street: street.required(),
        house: house.required(),
        apartment: apartment.required(),
        passportSeries: passportSeries.required(),
        passportNumber: passportNumber.required(),
    }),

    get: Joi.object().keys({
        filter: Joi.object().keys({
            birthdate,
            city,
            street,
            house,
            apartment,
            type: Joi.array().items(type),
            specialization,
        }),
        search,
    }),

    has: Joi.object().keys({
        _id,
        email,
        name,
        surname,
        patronymic,
        personalKey,
    }),
};
