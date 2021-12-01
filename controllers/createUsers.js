const client = require('../connection.js');
const SDC = require('statsd-client');
const AWS = require("aws-sdk");
var crypt = require('crypto');
const {validateEmail, compare, getToken} = require('../helperFunctions');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
AWS.config.update({region: 'us-east-1'});
var dynamo = new AWS.DynamoDB({ region: 'us-east-1'})
var DynamoDB = new AWS.DynamoDB.DocumentClient({service: dynamo});
const {
    v4: uuidv4
} = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10;
sdc = new SDC({host: 'localhost', port: 8125});
const a = () => {}
console.log(typeof a, 'logger');
const SNS = new AWS.SNS({apiVersion: '2010-03-31'});

const generateAccessToken = (username) => {
    
    let SHA= crypt.createHash('sha256');
    SHA.update(username);
    let HASH = SHA.digest('hex');
    return HASH;
}

const createUsers =  (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.post');
    logger.info('Made user create api call');
    const {
        username,
        first_name,
        last_name,
        password
    } = req.body;
    if(!Object.keys(req.body).length) {
        logger.error('No information provided to create a user');
        return res.status(400).json({
            status: 400,
            msg: 'No information provided to create a user'
        })
    }

    const data = Object.keys(req.body);
    const filter = ['first_name','last_name','password','username']
    for(i in data){
        if(!filter.includes(data[i])){
            logger.error('Only First, LastName, Password, and Username is required for creating user');
            return res.status(400).json({
                status: 400,
                msg: 'Only First, LastName, Password, and Username is required'
            })
        }
    }

    const isEmailCorrect = validateEmail(username);
    if (!password || !first_name || !last_name ||!isEmailCorrect || password.length < 5 || !first_name.length || !last_name.length) {
        logger.error('Incorrect data format for creating user');
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect data format'
        })
    }
    
    const id = uuidv4();
    const account_created = new Date().toISOString();
    const account_updated = new Date().toISOString();
    bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            const get_user_start_time = Date.now();
            const text1 = 'Select * from users where username =$1'
            const value1 = [username];
            client.query(text1, value1, (error, results) => {
                const get_user_end_time = Date.now();
                let get_user_time_elapsed = get_user_end_time - get_user_start_time;
                sdc.timing('query.user.get.post', get_user_time_elapsed);
                if (!results.rows.length) {
                    const text = 'INSERT INTO users(first_name, last_name, password, username, account_created, account_updated, id, verified, verified_on) VALUES($1, $2,  $3, $4, $5, $6, $7, $8, $9) RETURNING id, first_name, last_name, username, account_created, account_updated'
                    const create_user_start_time = Date.now();
                    const values = [first_name, last_name, hash, username, account_created, account_updated, id, true, account_updated];
                    client.query(text, values, (err, result) => {
                        
                        if (err) {
                            logger.error('Error inserting data to database while creating user test');
                            res.status(400).json({
                                status: 400,
                            });
                        } else {
                            const current = Math.floor(Date.now() / 1000)
                            let ttl = 60 * 5
                            const expiresIn = ttl + current
                            const token = generateAccessToken(username);
                            const dbdata = {
                                Item: {
                                    token,
                                    username,
                                    ttl: expiresIn,
                                },
                                TableName: "dynamo_db"
                            }
                            logger.info({token: token, msg: 'token for dynamo'});
                            console.log('test..')
                            DynamoDB.put(dbdata, function (error, data) {
                                if (error){
                                    logger.error('error');
                                    console.log("Error in putting item in DynamoDB ", error);
                                }
                                else {
                                    logger.info('success dynamo');
                                }
                            });
                            logger.info('after dynamo');
                            logger.info({env: process.env, msg: 'env'})
                            const params = {
                                Message: JSON.stringify({username, token, messageType: "Create User", domainName: process.env.DOMAIN_NAME, first_name: first_name}),
                                TopicArn: process.env.TOPIC_ARN,
                            }
                            let publishTextPromise = SNS.publish(params).promise();
                            publishTextPromise.then(
                                function(data) {
                                    logger.info('promise dynamo');
                                    console.log(`Message sent to the topic ${params.TopicArn}`);
                                    console.log("MessageID is " + data.MessageId);
                                    // res.status(201).send(result.toJSON());
                                    // logger.info("Answer has been posted..!");
            
                                }).catch(
                                function(err) {
                                    logger.error({errorMsg: 'promise dynamo db', err: err});
                                    console.error(err, err.stack);
                                    // res.status(500).send(err)
                                }); 
                            logger.info('User successfully created');
                            res.status(200).json({
                                status: 200,
                                result: result.rows[0]
                            });
                        }
                        const create_user_end_time = Date.now();
                        let create_user_time_elapsed = create_user_end_time - create_user_start_time;
                        sdc.timing('query.user.create', create_user_time_elapsed);
                    });
                    client.end;
                } else {
                    return res.status(400).json({
                        status: 400,
                        msg: 'Email already in use'
                    })
                }
            })
        });
    });
    let endTime = Date.now();
    var elapsed = endTime - startTime;
    sdc.timing('timing.user.post.create', elapsed);
};

exports.createUsers = createUsers;