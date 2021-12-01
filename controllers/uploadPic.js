const {client} = require('../connection.js');
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
const SDC = require('statsd-client');
const logger = require('../logger');
sdc = new SDC({host: 'localhost', port: 8125});
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
    let startTime = Date.now();
    sdc.increment('endpoint.user.upload.pic');
    logger.info('Made user upload pic api call');
    let date = new Date().toISOString().slice(0, 10);
    const fetchUser = `Select id, verified from users where username = $1`
    const get_user_start_time = Date.now();
    client.query(fetchUser, [username], (err, result) => {
        const get_user_end_time = Date.now();
        let get_user_time_elapsed = get_user_end_time - get_user_start_time;
        sdc.timing('query.get.user.upload.pic.api.call', get_user_time_elapsed);
        if (!result.rows.length) {
            logger.error('Bad Request, No such user found for uploading pic');
            res.status(400).json({
                status: 400,
                error: "Bad Request, No such user found"
            });
            client.end();
        } else if(!result.rows[0].verified) {
            logger.error('User not verified to perform any action');
            return res.status(400).json({
                status: 400,
                error: "User not verified"
            });
        } else {
            const img = getImage(profilePic.contents);
            const userId = result.rows[0].id
            const get_path_start_time = Date.now();
            client.query(`Select path from photos where user_id = $1`, [userId], (err, result) => {
                const get_path_end_time = Date.now();
                let get_path_time_elapsed = get_path_end_time - get_path_start_time;
                sdc.timing('query.path.from.photos.upload.pic.api.call', get_path_time_elapsed);
                if (result.rows.length) {
                    s3.deleteObject({
                        Bucket: process.env.S3_BUCKET,
                        Key: result.rows[0].path
                    },function (err,data){
                        if(data) {
                            const get_delete_start_time = Date.now();
                            client.query(`DELETE FROM photos WHERE user_id = $1`, [userId], (error, r) => {
                                const get_delete_end_time = Date.now();
                let get_delete_time_elapsed = get_delete_end_time - get_delete_start_time;
                sdc.timing('query.delete.pic.upload.pic.api.call', get_delete_time_elapsed);
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
                const upload_pic_start_time = Date.now();
                const text = 'INSERT INTO photos(id, user_id, file_name, url, upload_date, path) VALUES($1, $2,  $3, $4, $5, $6) RETURNING id, user_id, file_name, url, upload_date, path';
                const values = [uuidv4(), userId, req.body.profilePic.filename, data.Location, date, data.Key];
                client.query(text, values, (err, result) => {
                    const upload_pic_end_time = Date.now();
                    let upload_pic_time_elapsed = upload_pic_end_time - upload_pic_start_time;
                    sdc.timing('query.upload.pic.api.call', upload_pic_time_elapsed);
                    // console.log(err, 'result')
                    if (err) {
                        logger.error('Bad Request while inserting for uploading pic');
                        res.status(400).json({
                            status: 204,
                            description: 'Bad Request'
                        });
                    } else {
                        logger.info('Photo uploaded successfully');
                        res.status(201).json({
                            status: 204,
                            description: result.rows[0]
                        });
                    }
                });
            })
        }
    });
    let endTime = Date.now();
    var elapsed = endTime - startTime;
    sdc.timing('timing.user.upload.pic.api', elapsed);
}
exports.uploadPic = uploadPic;
