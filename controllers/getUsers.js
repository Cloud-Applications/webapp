const client = require('../connection.js');
const SDC = require('statsd-client');
const logger = require('../logger');
const {validateEmail, compare} = require('../helperFunctions');
sdc = new SDC({host: 'localhost', port: 8125});
const getUsers =  (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.get');
    logger.info('Made user get api call');
    const authorization = req.headers.authorization;
    if (!authorization) {
        logger.error('No authorization provided to get a user');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username || !password) {
        logger.error('Incorrect username or password provided to get a user');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        logger.error('Incorrect email type provided to get a user');
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email type'
        })
    }
    const fetchUser = `Select password from users where username = $1`
    const get_user_password_start_time = Date.now();
    client.query(fetchUser, [username])
        .then(data => {
            const get_user_password_end_time = Date.now();
            let get_user_password_time_elapsed = get_user_password_end_time - get_user_password_start_time;
            sdc.timing('query.user.get.password', get_user_password_time_elapsed);
            if (data && data.rows.length) {
                compare(password, data.rows[0].password)
                    .then(test => {
                        if(test) {
                            const get_user_start_time = Date.now();
                            client.query(`Select id, first_name, last_name, username, account_created, account_updated, verified, verified_on from users where username = $1`, [username], (err, result) => {
                                const get_user_end_time = Date.now();
                                let get_user_time_elapsed = get_user_end_time - get_user_start_time;
                                sdc.timing('query.user.get.api', get_user_time_elapsed);
                                if (!result.rows.length) {
                                    logger.error('User not found while fetching him for get user request');
                                    res.status(500).json({
                                        status: 403,
                                        error: "User not found"
                                    });
                                } else if(!result.rows[0].verified) {
                                    logger.error('User not Verified to perform get operation');
                                    return res.status(400).json({
                                        status: 400,
                                        error: 'User not Verified to perform get operation'
                                    });
                                } else {
                                    logger.info('User successfully found for get user request');
                                    res.status(200).json(
                                        result.rows[0]
                                    );
                                }
                            });
                            client.end;
                        } else {
                            logger.error('Incorrect password provided to get a user');
                            return res.status(400).json({
                                status: 400,
                                msg: 'Incorrect password in authorization'
                            }) 
                        }
                        
                    });
            } else {
                logger.error('Username doesn\'t exist. Please create a new user');
                return res.status(400).json({
                    status: 400,
                    msg: 'Username doesn\'t exist. Please create a new user'
                }) 
            }
        })
        .catch(err => {
            logger.error('API not found for get user request');
            return res.status(500).json({
                status: 500,
                msg: 'API not found'
            }) 
        })
        let endTime = Date.now();
        var elapsed = endTime - startTime;
        sdc.timing('timing.user.post.get', elapsed);
};
exports.getUsers = getUsers;