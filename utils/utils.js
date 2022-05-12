const rateLimit = require("express-rate-limit");
const config = require("../config.json");

const vowels = "aeiou";
const consonants = "bcdfghjklmnpqrstvwxyz";

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getRandom = (array) => {
    return array[getRandomInt(0, array.length - 1)];
}

const getRandomPhoneticKey = (length) => {
    let key = "";

    for (let i = 0; i < length; i++) {
        key += i % 2 === 0 ? getRandom(consonants) : getRandom(vowels);
    }

    return key;
};

const loadLimiter = rateLimit({
	windowMs: config.ratelimit.load.time_window,
	max: config.ratelimit.load.max_requests,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers["cf-connecting-ip"] || req.ip;
    }
});

const createLimiter = rateLimit({
	windowMs: config.ratelimit.create.time_window,
	max: config.ratelimit.create.max_requests,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers["cf-connecting-ip"] || req.ip;
    }
});

module.exports = {
    getRandomInt,
    getRandom,
    getRandomPhoneticKey,
    loadLimiter,
    createLimiter,
};
