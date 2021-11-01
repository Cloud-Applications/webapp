const client = require('../connection.js');
const multer  = require('multer');
const {
    v4: uuidv4
} = require('uuid');
var AWS = require("aws-sdk");
const bucket = process.env.S3_BUCKET;
const { Buffer } = require('buffer');
AWS.config.update({region: "us-east-1"})
const s3 = new AWS.S3()
const {deleteUtility} = require('./deleteUtility.js');
const getImage = (base64) => {
    const converted = base64.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(converted, 'base64')
};

//Attach a file to Question
const uploadPic = (req, res) => {
    const {
        username,
        profilePic
    } = req.body;
let date = new Date().toISOString().slice(0, 10);
    const fetchUser = `Select id from users where username = $1`
    client.query(fetchUser, [username], (err, result) => {
        if (!result.rows.length) {
            res.status(400).json({
                status: 400,
                error: "Bad Request, No such user found"
            });
            client.end();
        } else {
            const img = getImage(profilePic.contents);
            const userId = result.rows[0].id
            client.query(`Select path from photos where user_id = $1`, [userId], (err, result) => {
                if (result.rows.length) {
                    s3.deleteObject({
                        Bucket: process.env.S3_BUCKET,
                        Key: result.rows[0].path
                    },function (err,data){
                        if(data) {
                            client.query(`DELETE FROM photos WHERE user_id = $1`, [userId], (error, r) => {
                            })
                        }
                    })
                }
            });
            var imgData = `images/${userId}_${date}/` + req.body.profilePic.filename;
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: imgData,
                Body: img,
                Metadata: {file_name: req.body.profilePic.filename,
                    id: uuidv4(),
                    upload_date: date,
                    user_id: userId },
            }
            s3.upload(params, (err, data) => {
                if(err) {
                    throw(err);
                }
                const text = 'INSERT INTO photos(id, user_id, file_name, url, upload_date, path) VALUES($1, $2,  $3, $4, $5, $6) RETURNING id, user_id, file_name, url, upload_date, path';
                const values = [uuidv4(), userId, req.body.profilePic.filename, data.Location, date, data.Key];
                client.query(text, values, (err, result) => {
                    console.log(err, 'result')
                    if (err) {
                        res.status(400).json('Bad Request');
                    } else {
                        res.status(201).json(result.rows[0]);
                    }
                });
            })
        }
    });
}
