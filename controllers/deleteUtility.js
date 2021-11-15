const client = require('../connection.js');
const AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"})
const SDC = require('statsd-client');
const logger = require('../logger');
const s3 = new AWS.S3()
sdc = new SDC({host: 'localhost', port: 8125});
const deleteUtility = (userId, res) => {
    const get_user_start_time = Date.now();
    client.query(`Select path, id, user_id from photos where user_id = $1`, [userId], (err, result) => {
        const get_user_end_time = Date.now();
        let get_user_time_elapsed = get_user_end_time - get_user_start_time;
        sdc.timing('query.user.get.delete.pic.api', get_user_time_elapsed);
        if (!result.rows.length) {
            logger.error('Unauthorized to delete a pic of a user');
            res.status(401).json('Unauthorized');
        } else {
            const delete_user_photo_start_time = Date.now();
            client.query(`DELETE FROM photos WHERE user_id = $1`, [userId], (error, r) => {
                const delete_user_photo_end_time = Date.now();
                let delete_user_photo_time_elapsed = delete_user_photo_end_time - delete_user_photo_start_time;
                sdc.timing('query.user.delete.pic.api', delete_user_photo_time_elapsed);
                if(error) {
                    logger.error('error in executing delete user pic query');
                    res.status(401).json({test_error: error});
                }
                if (!r.rowCount) {
                    logger.error('no such pic exist to delete');
                    res.status(404).json({row: r, result: result, id: result.rows[0].id, userId: userId, userId_test: result.rows[0].user_id});
                } else {
                    s3.deleteObject({
                        Bucket: process.env.S3_BUCKET,
                        Key: result.rows[0].path
                    },function (err,data){
                        if(data) {
                            logger.info('Picture deleted');
                            res.status(204).json(result.rows[0], data, r);
                        } else {
                            logger.error('Error in deleting Picture from s3 bucket');
                            res.status(400).json(result.rows[0], err);
                        }
                    })
                }
            })
        }
    });
}

exports.deleteUtility = deleteUtility;