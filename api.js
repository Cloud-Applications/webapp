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
client.connect();

app.use(bodyParser.json());
const id = uuidv4();

app.get('/v1/user/self', getUsers);

app.post('/v1/user', createUsers);

app.put('/v1/user/self', updateUser);

module.exports = app;