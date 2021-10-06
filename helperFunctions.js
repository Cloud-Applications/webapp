const bcrypt = require('bcrypt');
// client.connect();
function compare(password, hashedPassword) {
    // Cannot bcrypt compare when one is undefined
    if (!password || !hashedPassword) {
        return Promise.resolve(false);
    }

    return Promise.resolve(bcrypt.compare(password, hashedPassword));
}
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

exports.validateEmail = validateEmail;
exports.compare = compare;
