const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const {
    v4: uuidv4
} = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const createUsers =  (req, res) => {
    const {
        username,
        first_name,
        last_name,
        password
    } = req.body;
    if(!Object.keys(req.body).length) {
        return res.status(400).json({
            status: 400,
            msg: 'No information provided to create a user'
        })
    }

    const data = Object.keys(req.body);
    const filter = ['first_name','last_name','password','username']
    for(i in data){
        if(!filter.includes(data[i])){
            return res.status(400).json({
                status: 400,
                msg: 'Only First, LastName, Password, and Username is required'
            })
        }
    }

    const isEmailCorrect = validateEmail(username);
    if (!password || !first_name || !last_name ||!isEmailCorrect || password.length < 5 || !first_name.length || !last_name.length) {
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
            const text1 = 'Select * from users where username =$1'
            const value1 = [username];
            client.query(text1, value1, (error, results) => {
                if (!results.rows.length) {
                    const text = 'INSERT INTO users(first_name, last_name, password, username, account_created, account_updated, id) VALUES($1, $2,  $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, username, account_created, account_updated'
                    const values = [first_name, last_name, hash, username, account_created, account_updated, id];
                    client.query(text, values, (err, result) => {
                        if (err) {
                            res.status(400).json({
                                status: 400,
                            });
                        } else {
                            res.status(200).json({
                                status: 200,
                                result: result.rows[0]
                            });
                        }
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
};

exports.createUsers = createUsers;