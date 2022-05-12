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

module.exports = {
    getRandomInt,
    getRandom,
    getRandomPhoneticKey,
};
