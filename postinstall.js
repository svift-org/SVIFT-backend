var imports = require("google-font-import");
 
var opts = {
  src: './http/template/vis.html',
  htmlpath: './http',
  fontpath: './http/assets/fonts',
  stylepath: './http/assets/style'
};
 
imports(opts).then(function () {

	console.log('google fonts download')

});