const request = require('request-promise-native'),
      imports = require("google-font-import"),
      fs = require('fs')

if (!fs.existsSync(__dirname + '/http/assets')) {
  fs.mkdirSync(__dirname + '/http/assets')
}

var opts = {
  src: __dirname + '/http/template/vis.html',
  htmlpath: __dirname + '/http/dump',
  fontpath: __dirname + '/http/assets/fonts',
  stylepath: __dirname + '/http/assets/style'
};
 
imports(opts).then(function () {

  console.log(__dirname + '/http/assets/style');

	fs.readdirSync(__dirname + '/http/assets/style').forEach(file => {
      console.log('READDIR', file)

      if(file.indexOf('css_family') > -1){
        console.log('READ FILE', file)

        let css = fs.readFileSync(__dirname + '/http/assets/style/'+file, 'utf8'),
        	vis = fs.readFileSync(__dirname + '/http/template/vis.html', 'utf8'),
        	v1 = vis.indexOf('<link rel="stylesheet" href="https://fonts.googleapis'),
        	v2 = vis.indexOf('>', v1)

        css = css.split('../fonts').join('./assets/fonts')

        let nvis = vis.substr(0,v1)+'<style type="text/css">'+css+'</style>'+vis.substr(v2+1)

        fs.writeFileSync(__dirname + '/http/vis.html', nvis, 'utf8')

        console.log('vis.html')

        customize(nvis)
        
      }
    })

});

function customize(nvis){
  //check if this is a custom instance
  if(process.env.CUSTOM && process.env.CUSTOM.length > 0){

    let options = {
        url: process.env.CUSTOM,
        method: 'GET',
        headers: {
          "User-Agent": "SVIFT-via-HEROKU",
          "Authorization": "token "+process.env.GIT_KEY,
          "Accept": "application/vnd.github.v3.raw"
        }
    }

    request(options)
      .then(body => {

        const customJSON = JSON.parse(body)

        if (!fs.existsSync(__dirname + '/http/assets/custom')) {
            fs.mkdirSync(__dirname + '/http/assets/custom');
        }

        if (!fs.existsSync(__dirname + '/http/assets/custom/fonts')) {
            fs.mkdirSync(__dirname + '/http/assets/custom/fonts');
        }

        if (!fs.existsSync(__dirname + '/http/assets/custom/fonts/'+customJSON.fonts.fontFolder)) {
            fs.mkdirSync(__dirname + '/http/assets/custom/fonts/'+customJSON.fonts.fontFolder);
        }

        let downloads = [customJSON.css, customJSON.logo.url].concat(customJSON.fonts.fontURLs)

        const promises = downloads.map(url => {
          let opts = {
            url: url,
            method: 'GET',
            headers: {
              "User-Agent": "SVIFT-via-HEROKU",
              "Authorization": "token "+process.env.GIT_KEY,
              "Accept": "application/vnd.github.v3.raw"
            }
          }

          if(url.indexOf('css')==-1 && url.indexOf('json')==-1){
            opts.encoding = null
          }
          
          return request(opts)
        });

        Promise.all(promises).then((data) => {
          
          let css_name = ''  

          data.forEach((d,di)=>{
            let filePath = downloads[di].split('/')
            let name = filePath[filePath.length-1]
            if(di == 0) css_name = name
            if(di<=1){
              fs.writeFileSync(__dirname+'/http/assets/custom/'+name, d)
            }else{
              fs.writeFileSync(__dirname+'/http/assets/custom/fonts/'+name, d)
            }
          })

          nvis = nvis.replace('<!--CUSTOMCSS-->', '<link rel="stylesheet" href="./assets/custom/'+css_name+'" type="text/css">')
          nvis = nvis.replace('/*CUSTOMJSON*/', 'custom = '+JSON.stringify(customJSON)+';')

          console.log(nvis)

          fs.writeFileSync(__dirname + '/http/vis.html', nvis, 'utf8')

          console.log('vis.html customized')

          console.log('postinstall complete')

        })
        .catch(err=>{
          console.log(err)
        });
    })
    .catch(err=>{
      console.log(err)
    })
  }else{
      console.log('postinstall complete')
  }
}