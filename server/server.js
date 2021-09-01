const PORT = 3000;
const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
})
const sockets = require('./socket.js')
const server = require('./listen.js')
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.use(cors())

const url = 'mongodb://localhost:27017'
MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    // Connection callback
    if (err) {
        return console.log(err)
    } else {
        const dbName = 'harmony'
        const db = client.db(dbName)

        require('./routes/auth')(db, app, path);

        sockets.connect(db, io, PORT)
        server.listen(http, PORT)
    }
})



