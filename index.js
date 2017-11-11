var express = require('express'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  utils = require('svift-utils'),
  session = require('express-session')

const { Client } = require('pg')
const uuidv1 = require('uuid/v1')

var state = 'starting',
  queue = require('svift-queue')

const db = new Client({ connectionString: process.env.DATABASE_URL })
db.connect()

queue.init(db, __dirname, function(){  })  

db.query('DROP TABLE IF EXISTS "session";'+
  'CREATE TABLE "session" ('+
    '"sid" varchar NOT NULL COLLATE "default",'+
    '"sess" json NOT NULL,'+
    '"expire" timestamp(6) NOT NULL'+
  ')'+
  'WITH (OIDS=FALSE);'+
  'ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;', function(err){
    if(err){
      console.log(err)
    }
  });

// configure express 
var app = express()

//output folder
if (!fs.existsSync('./output')) {
  fs.mkdirSync('./output')
}

app.use('output', express.static('output'))

app.use(session({
  genid: function(req) {
    return uuidv1() // use UUIDs for session IDs
  },
  store: new (require('connect-pg-simple')(session))(),
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: true,
  //proxy: true, // if you do SSL outside of node. 
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days 
}))

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

app.get("/" + process.env.EXPRESS_SECRET + "/vis\.:ext?", function (req, res) {
  res.sendFile(__dirname + '/http/vis.html')
})

app.get("/" + process.env.EXPRESS_SECRET + "/kill", function (req, res) {
  queue.exit()
  db.end()

  res.status(200).send('exit')
  process.exit()
})

app.get("/" + process.env.EXPRESS_SECRET + "/db/export", function (req, res) {
  
  db.query("SELECT id, job_id, status , added, start_time, end_time FROM svift_queue ORDER BY id", function(err, result){

    let cols = ['id','job_id','status','added','start','end']
    let rows = []

    result.rows.forEach(r=>{
      let row = []
      cols.forEach(c=>{
        row.push(r[c])
      })
      rows.push(row)
    })

    rest.status(200).send(utils.array2csv(rows, cols))
  })
})

//TODO: merge the three below into one regex

app.get("/" + process.env.EXPRESS_SECRET + "/assets/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/assets/fonts/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/fonts/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/assets/style/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/style/'+req.params.file)
})


var port = process.env.PORT || 8080;
app.listen(port, function() {
 console.log("Listening on " + port);
});