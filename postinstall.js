var imports = require("google-font-import");
 
var opts = {
  src: './http/template/vis.html',
  htmlpath: './http/vis.html',
  fontpath: './http/assets/fonts',
  stylepath: './http/assets/style'
};
 
imports(opts).then(function () { });