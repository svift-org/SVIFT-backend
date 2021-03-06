var express = require('express'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  utils = require('svift-utils'),
  session = require('express-session')

let customConfig = false

if(process.env.CUSTOM && process.env.CUSTOM.length > 0){
  customConfig = require(__dirname + '/http/assets/custom/custom.json')
}

const { Client } = require('pg')
const uuidv1 = require('uuid/v1')

var state = 'starting',
  queue = require('svift-queue')

let vis_types = JSON.parse(fs.readFileSync('./http/assets/vis_types.json', 'utf8'))
  vis_types.forEach((v,i)=>{
    vis_types[i] = v.replace('svift-vis-','')
  })

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
  name:'svift-session-cookie',
  saveUninitialized: false,
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

//Make sure options are not handled as post requests
app.options("/*", function(req, res, next){
  res.sendStatus(200);
});

//send a render job 
app.post("/render", function(req, res) {
  if(JSON.stringify(req.body).length > 0){
    if(vis_types.indexOf(req.body.vis.type)==-1){
      res.status(404).send('vis.type ('+req.body.vis.type+') unknown')
    }else{
      queue.addJob(req.body, function(id){
        res.status(200).send(id)
      })
    }
  }else{
    res.status(204).send('empty request')
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
  
  db.query("SELECT id, job_id, status, to_char(added, 'YYYY-MM-DD HH:MI:SS') AS time_added, to_char(start_time, 'YYYY-MM-DD HH:MI:SS') AS time_start, to_char(end_time, 'YYYY-MM-DD HH:MI:SS') AS time_end FROM svift_queue ORDER BY id", function(err, result){
    if(err){
      console.log(err)
    }

    let cols = ['id','job_id','status','time_added','time_start','time_end']
    let rows = []

    result.rows.forEach(r=>{
      let row = []
      cols.forEach(c=>{
        row.push(r[c])
      })
      rows.push(row)
    })

    res.status(200).send(utils.array2csv(rows, cols))
  })
})

//TODO: merge the three below into one regex

app.get("/" + process.env.EXPRESS_SECRET + "/assets/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/assets/custom/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/custom/'+req.params.file)
})

if(customConfig){
  app.get("/" + process.env.EXPRESS_SECRET + "/assets/custom/fonts/"+customConfig.fonts.fontFolder+"/:file", function (req, res) {
    res.sendFile(__dirname + '/http/assets/custom/fonts/'+customConfig.fonts.fontFolder+'/'+req.params.file)
  })  
}

app.get("/" + process.env.EXPRESS_SECRET + "/assets/fonts/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/fonts/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/assets/style/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/style/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/vis/assets/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/vis/assets/fonts/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/fonts/'+req.params.file)
})

app.get("/" + process.env.EXPRESS_SECRET + "/vis/assets/style/:file", function (req, res) {
  res.sendFile(__dirname + '/http/assets/style/'+req.params.file)
})


var port = process.env.PORT || 8080;
app.listen(port, function() {
 console.log("Listening on " + port);
});