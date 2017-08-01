var secret = '93z8heodsa'

if(process.argv.length >= 3){
  secret = process.argv[2]
}

//var render = require('svift-render'),
var express = require('express'),
  bodyParser = require('body-parser'),
  Sequelize = require('sequelize'),
  session = require('express-session'),
  sqlite3 = require('sqlite3').verbose()

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
    "storage": "./svift_session_db.sqlite"
  }
);

var store = new SequelizeStore({
  db: sequelize
});

var db = new sqlite3.Database('svift_session_db.sqlite');
queue.init(db, function(){ /*init done*/ })
 
// configure express 
var app = express()

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
  setTimeout(function(){
    res.status(200).send(JSON.stringify(req.body))  
  }, 3000)
})

//status of the render pipeline
app.get("/status", function (req, res) {
  queue.stats(function(stats){
    res.status(200).send(JSON.stringify(stats))
  })
})

app.get("/" + secret + "/vis", function (req, res) {
  res.sendFile(__dirname + '/http/vis.html')
})

app.get("/" + secret + "/vis.html", function (req, res) {
  res.sendFile(__dirname + '/http/vis.html')
})

app.get("/" + secret + "/kill", function (req, res) {
  queue.exit()
  db.close()
  process.exit()
})

app.get("/" + secret + "/assets/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/'+req.params.file)
})


var port = process.env.PORT || 5000;
app.listen(port, function() {
 console.log("Listening on " + port);
});