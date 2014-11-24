this["JST"] = this["JST"] || {};

this["JST"]["download-image-container"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="image-container checked" style="align-items: center">\n  <div class="image-content">\n    <img class="imazip-image" src="' +
((__t = ( url )) == null ? '' : __t) +
'">\n  </div>\n  <div class="image-meta-container">\n    <div>\n      <span class="image-size-width-label"></span> x\n      <span class="image-size-height-label"></span>\n    </div>\n    <div class="image-url-container">\n      <a class="image-url" target="_blank" href="' +
((__t = ( url )) == null ? '' : __t) +
'"></a>\n    </div>\n  </div>\n</div>\n';

}
return __p
};