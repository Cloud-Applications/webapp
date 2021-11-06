const client = require('../connection.js');
const AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"})
const s3 = new AWS.S3()
const deleteUtility = (userId, res) => {
    client.query(`Select path, id, user_id from photos where user_id = $1`, [userId], (err, result) => {
        if (!result.rows.length) {
            res.status(401).json('Unauthorized');
        } else {
            client.query(`DELETE FROM photos WHERE user_id = $1`, [userId], (error, r) => {
                if(error) {
                    res.status(401).json({test_error: error});
                }
                if (!r.rows.length) {
                    res.status(404).json({row: r, result: result, id: result.rows[0].id, userId: userId, userId_test: result.rows[0].userId});
                } else {
                    s3.deleteObject({
                        Bucket: process.env.S3_BUCKET,
                        Key: result.rows[0].path
                    },function (err,data){
                        if(data) {
                            res.status(204).json(result.rows[0], data, r);
                        } else {
                            res.status(400).json(result.rows[0], err);
                        }
                    })
                }
            })
            // console.log(result.rows[0].path, 'result.rows[0].path')
            // s3.deleteObject({
            //     Bucket: process.env.S3_BUCKET,
            //     Key: result.rows[0].path
            // },function (err,data){
            //     console.log(error, 'data', data);
            //     if(data) {
            //         client.query(`DELETE FROM photos WHERE user_id = $1`, [userId], (error, r) => {
            //             if (!result.rows.length) {
            //                 res.status(404).json("No record found");
            //             } else {
            //                 res.status(204).json(result.rows[0]);
            //             }
            //         })
            //     }
            // })
        }
    });
}

exports.deleteUtility = deleteUtility;