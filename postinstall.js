var imports = require("google-font-import"),
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
        
      }
    })

	console.log('postinstall complete')

});