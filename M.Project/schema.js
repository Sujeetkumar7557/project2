const Joi = require("Joi");
const Listing = require("./models/listing");

module.exports.ListingSchema = Joi.object({
    Listing : Joi.object({
    title: Joi.object().required(),
    description:Joi.object().required(),
    location:Joi.object().required(),
    country:Joi.object().required(),
    price:Joi.number().required(),
     image:Joi.string().allow("",null),
    }).required()




});