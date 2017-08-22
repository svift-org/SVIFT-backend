var request = require('request'),
  config = require('../config.json');

console.log('starting test, let\'s give the server a little while to startup')

setTimeout(function (){
  request.post({
    headers: {'content-type':'application/json'},
    url:     'http://localhost:5000/render',
    json:    {
      "params":{
        "dev":true,
        "duration":100
      },
      "vis":{
        "type":"columnchart"
      },
      "data":{
        "columns":["Jahr","Wert"],
        "types":["date","int"],
        "data":[
          [2017,3.9],
          [2016,4.1],
          [2015,4.6],
          [2014,5.0],
          [2013,5.2],
          [2012,5.5],
          [2011,5.9],
          [2010,7.1],
          [2009,7.8]
        ]
      }
    }
  }, function(error, response, body){
    if(response.statusCode == 200){
      console.log('test successful')
      console.log('id', body)
      let id = body,
        start = new Date()

      let interval = setInterval(function(){
        request.get({
          url:     'http://localhost:5000/status/'+id
        }, function(error, response, body){
          let duration = new Date() - start;
          process.stdout.write("Rendering " + duration + " ms\r");

          if(body == 2){
            console.log('')
            console.log('done')
            clearInterval(interval)
            exit();      
          }

        })
      }, 250)

    }else{
      console.log('response', response.statusCode);
      exit();
    }
  })
}, 5) //000

function exit(){
  request.get({
    url:     'http://localhost:5000/kill_'+config.secret
  }, function(error, response, body){
    console.log('exit')
    process.exit()
  })
}