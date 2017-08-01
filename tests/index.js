var request = require('request');

console.log('starting test, let\'s give the server a little while to startup')

setTimeout(function (){
  request.post({
    headers: {'content-type':'application/json'},
    url:     'http://localhost:5000/render',
    json:    {Hello:"World"}
  }, function(error, response, body){
    if(body.Hello == "World"){
      console.log('test successful')
    }
    console.log('exiting')
    request.get({
      url:     'http://localhost:5000/kill_93z8heodsa'
    }, function(error, response, body){
      process.exit()
    })
  })
}, 5000)