this["JST"] = this["JST"] || {};

this["JST"]["download-image-container"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 urls.forEach(function(url) { ;
__p += '\n<div class="image-container checked">\n  <img class="imazip-image" src="' +
((__t = ( url )) == null ? '' : __t) +
'">\n</div>\n';
 }); ;
__p += '\n';

}
return __p
};