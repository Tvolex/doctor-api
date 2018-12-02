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
const apartment = Joi.number().allow(null);
const passportSeries = Joi.string().max(3);
const avatar = Joi.string();
const cabinet = Joi.number();
const passportNumber = Joi.number();
const type = Joi.string().valid(['doctor', 'patient']);
const personalKey = Joi.string().min(32).max(32);
const contact = Joi.string();

const specialization = Joi.array().items(Joi.string().regex(OBJECT_ID_REGEX));

module.exports = {
    createNewDoctor: Joi.object().keys({
        email: email.required(),
        name: name.required(),
        specialization: specialization.required(),
        surname: surname.required(),
        patronymic: patronymic.required(),
        avatar: avatar.allow([null, '']),
        cabinet: cabinet.required(),
        birthdate: birthdate.required(),
        contact: contact.required(),
        city: city.required(),
        street: street.required(),
        house: house.required(),
        apartment,
        passportSeries: passportSeries.required(),
        passportNumber: passportNumber.required(),
    }),
    createNewPatient: Joi.object().keys({
        email: email.required(),
        name: name.required(),
        surname: surname.required(),
        patronymic: patronymic.required(),
        contact: contact.required(),
        birthdate: birthdate.required(),
        avatar: avatar.allow([null, '']),
        city: city.required(),
        street: street.required(),
        house: house.required(),
        apartment,
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
            fromDate: Joi.date(),
            toDate: Joi.date(),
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

    update: Joi.object().keys({
        email,
        name,
        surname,
        patronymic,
        birthdate,
        avatar,
        password,
        city,
        street,
        house,
        apartment,
        passportSeries,
        passportNumber,
        specialization,
        cabinet,
    }),
};
