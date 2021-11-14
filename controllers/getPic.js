const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const SDC = require('statsd-client');
sdc = new SDC({host: 'localhost', port: 8125});
const getPic =  (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.get.pic');
    logger('Made user get photo api call');
    const authorization = req.headers.authorization;
    if (!authorization) {
        logger('No authorization provided for getting users');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username) {
        logger('No username authorization provided for getting users');
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        logger('Incorrect email format in authorization provided for getting users');
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email type'
        })
    }
    const fetchUser = `Select id from users where username = $1`
    const get_user_start_time = Date.now();
    client.query(fetchUser, [username])
        .then(data => {
            let get_user_time_elapsed = get_user_end_time - get_user_start_time;
            sdc.timing('query.user.get.pic.api', get_user_time_elapsed);
            logger('Incorrect email format in authorization provided for getting users');
            if (data && data.rows.length) {
                let userId = data.rows[0].id;
                const get_user_photo_start_time = Date.now();
                client.query(`Select id, user_id, file_name, url, upload_date from photos where user_id = $1`, [userId], (err, result) => {
                    console.log(err, result, 'get');
                    const get_user_photo_end_time = Date.now();
                    let get_user_photo_time_elapsed = get_user_photo_end_time - get_user_photo_start_time;
                    sdc.timing('query.user.get.pic.api.call', get_user_photo_time_elapsed);
                    logger('Incorrect email format in authorization provided for getting users');
                    if (!result.rows.length) {
                        res.status(500).json({
                            status: 403,
                            error: "User not found"
                        });
                    } else {
                        res.status(200).json(result.rows[0]);
                    }
                });
            } else {
                return res.status(404).json({
                    status: 404,
                    msg: 'Not Found'
                }) 
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: 500,
                msg: 'API not found'
            }) 
        })
        let endTime = Date.now();
        var elapsed = endTime - startTime;
        sdc.timing('timing.user.get.pic', elapsed);
}

exports.getPic = getPic;