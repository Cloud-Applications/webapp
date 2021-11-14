const client = require('../connection.js');
const SDC = require('statsd-client');
const {validateEmail, compare} = require('../helperFunctions');
const logger = require('../logger');
const {
    v4: uuidv4
} = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10;
sdc = new SDC({host: 'localhost', port: 8125});
const createUsers =  (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.post');
    logger('Made user create api call');
    const {
        username,
        first_name,
        last_name,
        password
    } = req.body;
    if(!Object.keys(req.body).length) {
        logger('No information provided to create a user');
        return res.status(400).json({
            status: 400,
            msg: 'No information provided to create a user'
        })
    }

    const data = Object.keys(req.body);
    const filter = ['first_name','last_name','password','username']
    for(i in data){
        if(!filter.includes(data[i])){
            logger('Only First, LastName, Password, and Username is required for creating user');
            return res.status(400).json({
                status: 400,
                msg: 'Only First, LastName, Password, and Username is required'
            })
        }
    }

    const isEmailCorrect = validateEmail(username);
    if (!password || !first_name || !last_name ||!isEmailCorrect || password.length < 5 || !first_name.length || !last_name.length) {
        logger('Incorrect data format for creating user');
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
                    const text = 'INSERT INTO users(first_name, last_name, password, username, account_created, account_updated, id) VALUES($1, $2,  $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, username, account_created, account_updated'
                    const create_user_start_time = Date.now();
                    const values = [first_name, last_name, hash, username, account_created, account_updated, id];
                    client.query(text, values, (err, result) => {
                        
                        if (err) {
                            logger('Error inserting data to database while creating user');
                            res.status(400).json({
                                status: 400,
                            });
                        } else {
                            logger('User succcessfully created');
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
                    logger('Email already in use while creating user');
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