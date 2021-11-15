const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const {
    v4: uuidv4
} = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const SDC = require('statsd-client');
const logger = require('../logger');
sdc = new SDC({host: 'localhost', port: 8125});
const updateData = (username, password, req, res) => {
    const {
        account_created,
        account_updated,
        id
    } = req.body;
    const data = Object.keys(req.body);
    const filter = ['first_name','last_name','password','username']
    for(i in data){
        if(!filter.includes(data[i])){
            logger.error('No extra information allowed while updating user');
            return res.status(400).json({
                status: 400,
                msg: 'No extra information allowed'
            })
        }
    }

    if(req.body && req.username && req.body.username !== username) {
        logger.error('Incorrect username passed to update a user');
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect username passed'
        })
    }
    if (account_created || account_updated || id) {
        logger.error('No additional information can be changed while updating user');
        return res.status(400).json({
            status: 400,
            msg: 'No additional information can be changed'
        })
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        logger.error('Incorrect email format for updating user');
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email'
        })
    }

    const accountUpdated = new Date().toISOString();

    const text1 = 'Select first_name, last_name, password from users where username =$1 '
    const value1 = [username];
    const get_user_start_time = Date.now();
    client.query(text1, value1, (error, results) => {
        const get_user_end_time = Date.now();
        let get_user_time_elapsed = get_user_end_time - get_user_start_time;
        sdc.timing('query.get.user.update.api.call', get_user_time_elapsed);
        if (results.rows.length) {
            const first_name = req.body.first_name ? req.body.first_name : results.rows[0].first_name;
            const last_name = req.body.last_name ? req.body.last_name : results.rows[0].last_name;
            const password = req.body.password ? req.body.password : results.rows[0].password;
            bcrypt.genSalt(saltRounds, function (err, salt) {
                bcrypt.hash(password, salt, function (err, hash) {
                    const get_user_update_start_time = Date.now();
                    const text = 'UPDATE public.users SET first_name=$1, last_name=$2, password=$3, account_updated=$4 WHERE username =$5'
                    const values = [first_name, last_name, hash, accountUpdated, username];
                    client.query(text, values, (err, result) => {
                        const get_user_update_end_time = Date.now();
                        let get_user_update_time_elapsed = get_user_update_end_time - get_user_update_start_time;
                        sdc.timing('query.user.update.api.call', get_user_update_time_elapsed);
                        if (err) {
console.log(process.env.host)
                            logger.error('Error while updating user');
                            res.status(400).json({
                                status: 400,
                                error: err
                            });
                        } else {
                            logger.info('User data updated sucessfully');
                            res.status(204).json({
                                status: 204,
                                description: 'Values are updated'
                            });
                        }
                    });
                    client.end;
                });
            });
        } else {
            logger.error('No such user found');
            return res.status(400).json({
                status: 400,
                error: 'No email found'
            });
        }
    });
}

const updateUser = (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.update');
    logger.info('Made user update api call');
    const authorization = req.headers.authorization;
    if(!authorization) {
        logger.error('No authorization provided to update a user');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden Request'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username || !password) {
        logger.error('Incorrect username or password provided to update a user');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden Request'
        })
    }
    const fetchUser = `Select password from users where username = $1`
    const get_user_password_start_time = Date.now();
    client.query(fetchUser, [username])
        .then(data => {
            const get_user_password_end_time = Date.now();
            let get_user_password_time_elapsed = get_user_password_end_time - get_user_password_start_time;
            sdc.timing('query.user.get.password.update.user.api', get_user_password_time_elapsed);
            if (data && data.rows.length) {
                compare(password, data.rows[0].password)
                    .then(test => {
                        if (test) return updateData(username, password, req, res);
                        logger.error('Incorrect password provided in authorization to update a user');
                        return res.status(400).json({
                            status: 400,
                            msg: 'Incorrect password'
                        });
                    })
            } else {
                logger.error('Incorrect username provided to update a user');
                return res.status(400).json({
                    status: 400,
                    msg: 'Username incorrect'
                });
            }
        })
        let endTime = Date.now();
        var elapsed = endTime - startTime;
        sdc.timing('timing.user.update.api', elapsed);
};

exports.updateUser = updateUser;