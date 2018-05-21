const request = require('request-promise-native'),
      fs = require('fs')

let options = {
      url: "https://api.github.com/repos/sebastian-meier/svift-custom-instances/contents/custom/taz-200x44.jpg",
      method: 'GET',
      headers: {
        "User-Agent": "SVIFT-via-HEROKU",
        "Authorization": "token 118f2d716e1b514b5ae8aeedf6477536177a5dd5",
        "Accept": "application/vnd.github.v3.raw"
      },
      "encoding": null
  }

  request(options)
    .then(body => {
      fs.writeFileSync('test.jpg', body)
    })
    .catch(err=>{
      console.log(err)
    });