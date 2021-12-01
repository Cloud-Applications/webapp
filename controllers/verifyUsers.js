const client = require('../connection.js');
const logger = require('../logger');

const verifyUsers = (req, res) => {
    console.log(req, res);
    logger.info({req: req, msg: 'request body', res: res, msg: 'msg response', request: req.request});
    const a = req.request._parsedUrl.query;
    const username = a.split("=")[1].split("&")[0]
    const text = 'UPDATE public.users SET verified = $1, verified_on = $2 WHERE username =$3'
    const values = [true, new Date().toISOString(), username];
    client.query(text1, value1, (error, results) => {
        if(error) {
            logger.error('Error while verifying user');
            return res.status(400).json({
                status: 400,
                error: err
            });
        } else {
            logger.info('User verified successfully');
            return res.status(204).json({
                status: 204,
                description: 'User verified successfully'
            });
        }
    });
}

exports.verifyUsers = verifyUsers;