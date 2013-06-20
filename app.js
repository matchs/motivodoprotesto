var express = require('express')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , validator = require('validator');


var dbconf = require("./config/database_local.json");

mongoose.connect(dbconf.mongo.string);
var conn = mongoose.connection;

conn.once('open', function () { //Conectar no banco!
    var app = new express();
    app.use(express.bodyParser());

    app.all('*', function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    var protesto = mongoose.model('protesto', {
        desc: String,
        count: {type: Number, default: 1},
        date: {type: Date, default: Date.now}
    });

    app.post('/protesto', appendHeaders, function (req, res) {
        var regex = new RegExp('^' + escapeRegExp(req.body.desc), 'i');

        protesto.findOneAndUpdate({
            desc: {
                $regex: regex
            }
        }, {
            $inc: {
                count: 1
            }
        }).exec(function (err, protestos) {
                if (err || !protestos || protestos.length <= 0) {

                    var model = new protesto(req.body);

                    model.save(function (err, prot) {
                        if (!err)
                            res.json(prot, 201);
                        else
                            res.send('Error', 500);

                    });

                } else {
                    res.json(protestos, 201);
                }
            });
    });

    app.get('/protesto', appendHeaders, function (req, res) {
        if (req.query.query)
            var filter = {
                desc: {
                    $regex: new RegExp(escapeRegExp(req.query.query), 'i')
                }
            }
        else filter = {};

        protesto.find(filter).exec(function (err, protestos) {
            if (!err){
                var resp = [];

                for(var i in protestos)
                    resp.push(protestos[i].desc);

                res.json({suggestions:resp}, 200);

            }else res.send('Error', 500);

        });
    });

    app.get('/rank', appendHeaders, function (req, res) {
        protesto.find(null, null, {
            skip:0,
            limit:10,
            sort:{
                count:-1
            }
        })
            .exec(function (err, protestos) {
                if (!err)
                    res.json(protestos, 200)
                else
                    res.send('Error', 500)
            });
    });

    app.options('/rank', appendHeaders, sayOK);
    app.options('/protesto', appendHeaders, sayOK);


    app.listen(8088);
});

conn.on('error', function () {
    console.log('DILMAAAAAAA!!!!');
})

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function appendHeaders(err, req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    next();

}

function sayOK(req, res){
    res.send('ok',200);
}
