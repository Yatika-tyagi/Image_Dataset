require('dotenv').config()
var express = require('express')
var ejs = require('ejs')
var cors = require('cors')
var multer = require('multer');
var bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const https = require('https')
var request = require('request');


const client = new MongoClient('mongodb://admin:hello@ec2-52-76-55-57.ap-southeast-1.compute.amazonaws.com:27017?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
var AWS = require('aws-sdk');
AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, accessSecretKey: process.env.AWS_SECRET_ACCESS_KEY, region: process.env.AWS_DEFAULT_REGION });
var s3 = new AWS.S3({ region: process.env.AWS_DEFAULT_REGION });

var app = express();
app.use(cors())

client.connect((err, db) => {
    if (err) {
        console.error(err)
        db.close(); //call this when you are done.
        throw err
    } else {
        app.listen(3002, function () {
            console.log('App listening on port ' + 3002)
        })
    }
})

app.set('view engine', 'ejs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/getimage', async function (req, res, next) {
    try {
        var n = await client.db("prod_accounts").collection("data_factory").find({
            "dlib_data.image_meta_data.percentage": { "$gt": 15 },
            "is_golden_set": { "$exists": false }
        }).count()
        var r = Math.floor(Math.random() * n);
        console.log(n, r, "vbfdmbvfn")

        var result = await client.db("prod_accounts").collection("data_factory").find({
            "dlib_data.image_meta_data.percentage": { "$gt": 15 },
            "is_golden_set": { "$exists": false }
        }
        ).limit(-1).skip(r).next()
        let pendingCount = await client.db("prod_accounts").collection("data_factory").find({
            "dlib_data.image_meta_data.percentage": { "$gt": 15 },
            "is_golden_set": { "$exists": false }
        }).count()
        let reviewCount = await client.db("prod_accounts").collection("data_factory").find({
            "dlib_data.image_meta_data.percentage": { "$gt": 15 },
            "is_golden_set": { "$exists": true }
        }).count()
        let fppCount = await client.db("prod_accounts").collection("data_factory").find({
            "dlib_data.image_meta_data.percentage": { "$gt": 15 },
            "fpp": { "$exists": true }
        }).count()
        return res.render('dataset', {
            result,
            pendingCount,
            reviewCount,
            fppCount
        })

        // client.db("prod_accounts").collection("data_factory").findOne({
        //     "dlib_data.image_meta_data.percentage": {"$gt": 15},
        //     "is_golden_set": {"$exists":false}
        // })
        // .then(result => {
        //     console.log(result)
        //     return res.render('dataset', {
        //         result,
        //     })
        // })
        // .catch(err => next(err))
    } catch (error) {
        console.log(error)
        // client.close()
    }

})

app.put('/saveimage/:id/:action', function (req, res, next) {
    try {
        console.log({
            _id: ObjectId(req.params.id),
            is_golden_set: Boolean(req.params.action),
        })
        client.db("prod_accounts").collection("data_factory").findOneAndUpdate({
            _id: ObjectId(req.params.id)
        }, {
            $set: {
                is_golden_set: req.params.action === 'true' ? true : false
            }
        })
            .then(result => {
                console.log("S3 Bucket", result.value.image_url)
                console.log(req.params.action, "ACtion")
                if (req.params.action == 'true') {
                    copyObject(result.value.image_url)
                } else {
                    console.log("False Image")
                }
                console.log(result)
                return res.send({ success: true, data: result })
            })
            .catch(err => next(err))
    } catch (error) {
        console.log(error)
        // client.close()
    }


})

function copyObject(url) {
    try {
        if (url.includes("amazonaws.com")) {
            var images = url.split('amazonaws.com/').pop()
        } else {
            var images = url.split('//').pop();
        }
        var image = images.split('/').pop();
        var Bucket = 'data-factory'
        var params = {
            Bucket: Bucket,
            CopySource: `/${images}`,
            Key: Bucket + '/' + 'dataset_image' + `/${image}`,
        };
        console.log(params, "Params")
        s3.copyObject(params, function (err, data) {
            if (err) {
                console.log(err, "err")
            } else {
                // console.log("Success", data);
                return data;
            }
        });
    }
    catch (error) {
        console.log(error)
    }

}

app.get('/', function (req, res) {
    return res.render('uploadImage', {
        faceShapes: 123
    })
});
app.get('/camera', function (req, res) {
    return res.render('uploadImageCamera', {
        faceShapes: 123
    })
});
const upload = multer({
    limits: {
        fileSize: 4 * 1024 * 1024,
    }
});

// exports.handler = (event, context, callback) => {
//     const fs = require(‘fs’);
//     var image = fs.readFileSync(‘./car.png’);
//     var response = {
//         statusCode: 200,
//         headers:
//             {
//     “Content - Type”: “image / png”
// },
//     body: image.toString(‘base64’),
//         isBase64Encoded: true
//       };
// callback(null, response);
//    }

app.post('/faceupload', function (req, res, next) {
    if (req.body) {
        var resObj = JSON.stringify(req.body)
        resObj = resObj+"="
        // console.log(resObj)
        var headersOpt = {
            "content-type": "application/json",
        };
        // var options = {
        //     uri: 'https://esyjh53xid.execute-api.ap-south-1.amazonaws.com/faceshape/',
        //     method: 'POST',
        //     // json: { "image": resObj },
        //     body: {"image":resObj}, 
        //     headers: headersOpt,
        //     json: true,
        // };
        var options = {
            method: 'POST',
            url: 'https://esyjh53xid.execute-api.ap-south-1.amazonaws.com/faceshape/',
            headers:
            {
                'postman-token': 'ae1b8cfa-2f30-8fd7-7ccf-da30f17a8dda',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                accept: '*/*'
            },
            body: { image: resObj },
            json: true
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the shortened url.
                var faceShapes = body
                res.send(body)
            }
        });
        res.status(200)
    }
    else throw 'error';
});



app.post('/upload', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var dir = 'uploads';

        fs.mkdir(dir, function (err) {
            fs
                .readFile(files.RemoteFile.path, function (err, data) {
                    // save file from temp dir to new dir
                    var fileName = path.join(__dirname, dir, files.RemoteFile.name);
                    console.log(fileName);
                    fs.writeFile(fileName, data, function (err) {
                        if (err)
                            throw err;

                        res.json({ success: 'true' });
                    });
                });
        });

    });
});


process.on('SIGINT', function () {
    client.close(function () {
        console.log('Mongoose disconnected on app termination');
        process.exit(0);
    });
});