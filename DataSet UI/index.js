require('dotenv').config()
var express = require('express')
var ejs = require('ejs')
var cors = require('cors')

var bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const client = new MongoClient('mongodb://admin:hello@ec2-52-76-55-57.ap-southeast-1.compute.amazonaws.com:27017?authSource=admin', {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
var AWS = require('aws-sdk');
AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID, accessSecretKey: process.env.AWS_SECRET_ACCESS_KEY, region: process.env.AWS_DEFAULT_REGION});
var s3 = new AWS.S3({region: process.env.AWS_DEFAULT_REGION});

var app = express();
app.use(cors())

client.connect((err, db) => {
    if(err){
        console.error(err)
        db.close(); //call this when you are done.
        throw err
    } else {
        app.listen(3002, function() {
            console.log('App listening on port ' + 3002)
        })
    }
})

app.set('view engine', 'ejs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/getimage',async function(req, res, next) {
    try {
        var n = await client.db("prod_accounts").collection("data_factory").find({
            "dlib_data.image_meta_data.percentage": {"$gt": 15},
            "is_golden_set": {"$exists":false}
        }).count()
            
    
            var r = Math.floor(Math.random() * n);
            console.log(n,r, "vbfdmbvfn")
    
            var result = await client.db("prod_accounts").collection("data_factory").find({
                    "dlib_data.image_meta_data.percentage": {"$gt": 15},
                    "is_golden_set": {"$exists":false}
                }
                ).limit(-1).skip(r).next()
    
            return res.render('dataset', {
                        result,
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

app.put('/saveimage/:id/:action', function(req, res, next) {
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
            console.log("S3 Bucket",result.value.image_url)
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
    try{
        if(url.includes("amazonaws.com")) {
            var images =  url.split('amazonaws.com/').pop()
          } else {
            var images = url.split('//').pop(); 
          }
          var image = images.split('/').pop();
          var Bucket = 'data-factory'
          var params = {
              Bucket: Bucket,
              CopySource: `/${images}`,
              Key: Bucket+'/'+'dataset_image'+`/${image}`,
          };
          console.log(params, "Params")
          s3.copyObject(params, function(err, data) {
              if (err) {
                  console.log(err, "err")
              }  else {
                  // console.log("Success", data);
                  return data;
              }
          });
    }
    catch(error){
        console.log(error)
    }

}

process.on('SIGINT', function() {
    client.close(function () {
      console.log('Mongoose disconnected on app termination');
      process.exit(0);
    });
  });