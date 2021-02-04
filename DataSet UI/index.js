var express = require('express')
var ejs = require('ejs')
var bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const client = new MongoClient('mongodb://admin:hello@localhost:27017?authSource=admin', {
	useNewUrlParser: true,
	// useUnifiedTopology: true
})

var app = express()

client.connect((err, val) => {
    if(err){
        console.error(err)
        throw err
    } else {
        app.listen(3001, function() {
            console.log('App listening on port ' + 3001)
        })
    }
})

app.set('view engine', 'ejs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/getimage', function(req, res, next) {
    client.db("prod_accounts").collection("data_factory").findOne({
        "dlib_data.image_meta_data.percentage": {"$gt": 15},
        "is_golden_set": {"$exists":false}
    })
    .then(result => {
        return res.render('dataset', {
            result,
        })
    })
    .catch(err => next(err))
})

app.put('/saveimage/:id/:action', function(req, res, next) {
    console.log({
        _id: ObjectId(req.params.id),
        is_golden_set: Boolean(req.params.action),
    })
    client.db("prod_accounts").collection("data_factory").updateOne({
        _id: ObjectId(req.params.id)
    }, {
        $set: {
            is_golden_set: req.params.action === 'true' ? true : false
        }
    })
    .then(result => {
        console.log({result})
        return res.send({ success: true, data: result })
    })
    .catch(err => next(err))
})
