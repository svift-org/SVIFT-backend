var config = require('./config.json')

var express = require('express'),
  express = require('fs'),
  bodyParser = require('body-parser'),
  Sequelize = require('sequelize'),
  session = require('express-session'),
  sqlite3 = require('sqlite3')//.verbose() // > only for dev

const uuidv1 = require('uuid/v1')

var state = 'starting',
  queue = require('svift-queue')

// initalize sequelize with session store 
var SequelizeStore = require('connect-session-sequelize')(session.Store);
 
// create database
var sequelize = new Sequelize(
  "svift_session_db",
  "svift",
  "FdL@=J2&D8+aM2", 
  {
    "dialect": "sqlite",
    "storage": "./svift_session_db.sqlite",
    "logging": false
  }
);

var store = new SequelizeStore({
  db: sequelize
});

var db = new sqlite3.Database('svift_session_db.sqlite').configure('trace', function(t){ console.log('t',t); });
queue.init(db, __dirname, function(){ /*init done*/ })
 
// configure express 
var app = express()

//output folder
if (!fs.existsSync('./output')) {
  fs.mkdirSync('./output');
}
app.use(express.static('output'));

app.use(session({
  genid: function(req) {
    return uuidv1() // use UUIDs for session IDs
  },
  secret: 'Uf?NWRT9thYs4c+G3Rp7;dVL9CQLtxtsPKJcQq>sMrqfffaBZbMD]s;UU+k2Bwot',
  store: store,
  resave: false,
  saveUninitialized: true,
  proxy: true // if you do SSL outside of node. 
}))

store.sync()

app.use(bodyParser.json())

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
  next();
})

//Default page
app.get("/", function(req, res) {
  res.sendFile(__dirname + '/http/default.html')
});

//Test for saying hello
app.get("/hello", function(req, res) {

  //storing data in the session > auto save for the form fields (maybe)
  var data = req.session.data

  if (!data) {
    data = req.session.data = {count:0}
  }

  data.count++

  res.status(200).send(data.count.toString());
});

//status of a render job
//TODO: Test if this is better done with SOCKET.IO
app.get("/status/:id", function(req, res) {
  queue.jobStat(req.params.id, function(err, stat){
    if(err){
      console.log(err)
    }
    res.status(200).send(JSON.stringify(stat))
  })
})

//send a render job 
app.post("/render", function(req, res) {
  if(JSON.stringify(req.body).length > 0){
    queue.addJob(req.body, function(id){
      res.status(200).send(id)
    })
  }
})

//status of the render pipeline
app.get("/status", function (req, res) {
  queue.stats(function(stats){
    res.status(200).send(JSON.stringify(stats))
  })
})

app.get("/" + config.secret + "/vis\.:ext?", function (req, res) {
  res.sendFile(__dirname + '/http/vis.html')
})

app.get("/" + config.secret + "/kill", function (req, res) {
  queue.exit()
  db.close()
  res.status(200).send('exit')
  process.exit()
})

app.get("/" + config.secret + "/assets/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/'+req.params.file)
})


var port = process.env.PORT || 8080;
app.listen(port, function() {
 console.log("Listening on " + port);
});