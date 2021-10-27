const client = require('./connection.js')
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const {getUsers} = require('./controllers/getUsers');
const {createUsers} = require('./controllers/createUsers');
const {updateUser} = require('./controllers/updateUser');
const {
    v4: uuidv4
} = require('uuid');
// const { updateUser } = require('./controllers/updateUser.js');
app.listen(3300, () => {
    console.log("Sever is now listening at port 3300");
})
const saltRounds = 10;
client.connect((err) => {
    if (err) throw err;
    client.query('CREATE DATABASE IF NOT EXISTS postgres;');
    client.query('USE postgres;');
    client.query('create table public.users(id UUID NOT NULL,username VARCHAR(100),password VARCHAR(100),first_name VARCHAR(50),last_name VARCHAR(50),account_created timestamp with time zone,account_updated timestamp with time zone,PRIMARY KEY (id));', function(error, result, fields) {
        console.log(result);
    });

});
// const createTable = 'CREATE DATABASE IF NOT EXISTS postgres;';
// client.query(createTable)
// client.query('CREATE DATABASE IF NOT EXISTS postgres;');
// await client.query(`DROP DATABASE IF EXISTS ${dbname};`)
//         await client.query(`CREATE DATABASE ${dbname};`)

app.use(bodyParser.json());
const id = uuidv4();

app.get('/v1/user/self', getUsers);

app.post('/v1/user', createUsers);

app.put('/v1/user/self', updateUser);

module.exports = app;