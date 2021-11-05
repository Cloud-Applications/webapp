const client = require('./connection.js')
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const {getUsers} = require('./controllers/getUsers');
const {createUsers} = require('./controllers/createUsers');
const {updateUser} = require('./controllers/updateUser');
const {uploadPic} = require('./controllers/uploadPic');
const {getPic} = require('./controllers/getPic');
const {deletePic} = require('./controllers/deletePic');
const {
    v4: uuidv4
} = require('uuid');
app.listen(3300, () => {
    // console.log("Sever is now listening at port 3300");
})
client.connect((err) => {
    if (err) throw err;
    client.query('create table if not exists public.users(id UUID NOT NULL,username VARCHAR(100),password VARCHAR(100),first_name VARCHAR(50),last_name VARCHAR(50),account_created timestamp with time zone,account_updated timestamp with time zone,PRIMARY KEY (id));', function(error, result) {
        console.log(result);
    });
    client.query('create table if not exists public.photos(id UUID NOT NULL,user_id UUID NOT NULL,file_name VARCHAR(100),url text,upload_date Date,path VARCHAR(255), PRIMARY KEY (id), CONSTRAINT fk_users FOREIGN KEY(user_id) REFERENCES users(id));', function(error, result) {
        console.log(result);
    });

});

app.use(bodyParser.json());
const id = uuidv4();

app.get('/v1/user/self', getUsers);

app.post('/v1/user', createUsers);

app.put('/v1/user/self', updateUser);

app.get('/v1/user/self/pic', getPic);
app.post('/v1/user/self/pic', uploadPic);

app.delete('/v1/user/self/pic', deletePic);

module.exports = app;