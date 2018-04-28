var imports = require("google-font-import"),
	fs = require('fs')

if (!fs.existsSync('./http/assets')) {
  fs.mkdirSync('./http/assets')
}

var opts = {
  src: './http/template/vis.html',
  htmlpath: './http',
  fontpath: './http/assets/fonts',
  stylepath: './http/assets/style'
};
 
imports(opts).then(function () {

	fs.readdirSync('./http/assets/style').forEach(file => {
      if(file.indexOf('css_family') > -1){
        let css = fs.readFileSync('./http/assets/style/'+file, 'utf8'),
        	vis = fs.readFileSync('./http/vis.html', 'utf8'),
        	v1 = vis.indexOf('<link rel="stylesheet" href="assets/style/css_family'),
        	v2 = vis.indexOf('>', v1)

        css = css.split('../fonts').join('./assets/fonts')

        let nvis = vis.substr(0,v1)+'<style type="text/css">'+css+'</style>'+vis.substr(v2+1)

        fs.writeFileSync('./http/vis.html', nvis, 'utf8')

        
		        
      }
    })

	console.log('postinstall complete')

});