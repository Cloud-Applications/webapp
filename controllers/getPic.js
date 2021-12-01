const {db2} = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const SDC = require('statsd-client');
const logger = require('../logger.js');
sdc = new SDC({host: 'localhost', port: 8125});
const client = db2;
const getPic =  (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.get.pic');
    logger.info('Made user get photo api call');
    const authorization = req.headers.authorization;
    if (!authorization) {
        logger.error('No authorization provided for getting users');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username) {
        logger.error('No username authorization provided for getting users');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        logger.error('Incorrect email format in authorization provided for getting users');
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email type'
        })
    }
    const fetchUser = `Select id, verified from users where username = $1`
    const get_user_start_time = Date.now();
    client.query(fetchUser, [username])
        .then(data => {
            const get_user_end_time = Date.now();
            let get_user_time_elapsed = get_user_end_time - get_user_start_time;
            sdc.timing('query.user.get.pic.api', get_user_time_elapsed);
            if (data && data.rows.length) {
                if(!data.rows[0].verified) {
                    logger.info({data: data.rows});
                    logger.info('User not Verified to perform get pic operation');
                    
                    return res.status(400).json({
                        status: 400,
                        error: 'User not Verified to perform get pic operation'
                    });
                } 
                let userId = data.rows[0].id;
                const get_user_photo_start_time = Date.now();
                client.query(`Select id, user_id, file_name, url, upload_date from photos where user_id = $1`, [userId], (err, result) => {
                    const get_user_photo_end_time = Date.now();
                    let get_user_photo_time_elapsed = get_user_photo_end_time - get_user_photo_start_time;
                    sdc.timing('query.user.get.pic.api.call', get_user_photo_time_elapsed);
                    if (!result.rows.length) {
                        logger.error('Image not found');
                        res.status(500).json({
                            status: 403,
                            error: "Image not found"
                        });
                    } else {
                        logger.info('Fetched Picture Successfully')
                        res.status(200).json(result.rows[0]);
                    }
                });
            } else {
                logger.error('User not found')
                return res.status(404).json({
                    status: 404,
                    msg: 'User Not Found'
                }) 
            }
        })
        .catch(err => {
            logger.error('Incorrect get photo query')
            return res.status(500).json({
                status: 500,
                msg: 'Incorrect get photo query'
            }) 
        })
        let endTime = Date.now();
        var elapsed = endTime - startTime;
        sdc.timing('timing.user.get.pic', elapsed);
}

exports.getPic = getPic;