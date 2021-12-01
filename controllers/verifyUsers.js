const {client} = require('../connection.js');
const logger = require('../logger');
var aws = require("aws-sdk");
var dynamo = new aws.DynamoDB({ region: 'us-east-1'})
var DynamoDB = new aws.DynamoDB.DocumentClient({service: dynamo});

const verifyUsers = (req, res) => {
    console.log(req, res);
    logger.info({req: req, msg: 'request body', res: res, msg: 'msg response', request: req.request});
    const a = req._parsedUrl.query;
    const username = a.split("=")[1].split("&")[0];
    const token = a.split("token=")[1];
    logger.info({username: username, token: token});
    let searchParams = {
        TableName: "dynamo_db",
        Key: {
            "token": token
        }
    };
    DynamoDB.get(searchParams, function(error, record){
        if(error) {
            logger.info({msg: "Error in DynamoDB get method ", error: error});
            console.log("Error in DynamoDB get method ",error);
            return res.status(400).json({
                status: 400,
                error: error
            });
        } else {
            let isTokenValid = false;
            console.log("Checking if record already present in DB!!");
            if (record.Item == null || record.Item == undefined) {
                logger.info({msg: "No record in Dynamo ", record: record});
                isTokenValid = false;
            } else {
                if(record.Item.ttl < Math.floor(Date.now() / 1000)) {
                    logger.info({msg: "ttl expired ", record: record});
                    isTokenValid = false;
                } else {
                    logger.info({msg: "ttl found ", record: record});
                    isTokenValid = true;
                }
            }
            if(isTokenValid) {
                const text = 'UPDATE public.users SET verified = $1, verified_on = $2 WHERE username =$3'
                const values = [true, new Date().toISOString(), username];
                client.query(text, values, (error, results) => {
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
            } else {
                logger.info('User cannot be verified as token expired');
                return res.status(204).json({
                    status: 400,
                    description: 'Token Expired'
                });
            }
        }
    })
}

exports.verifyUsers = verifyUsers;