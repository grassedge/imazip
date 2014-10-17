this["JST"] = this["JST"] || {};

this["JST"]["download-image-container"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="image-container checked" style="position:relative">\n  <img class="imazip-image" src="' +
((__t = ( url )) == null ? '' : __t) +
'">\n  <div style="position:absolute;bottom:20px;right:5px;">\n    <span class="image-size-width-label"></span> x\n    <span class="image-size-height-label"></span>\n  </div>\n  <a class="image-url" style="display:block;position:absolute;bottom:5px;left:5px;right:5px;overflow-x:hidden;text-overflow:ellipsis">\n  </a>\n</div>\n';

}
return __p
};