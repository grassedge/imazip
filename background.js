chrome.browserAction.setBadgeBackgroundColor({
    color: '#00FF00'
});
chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.query({active:true}, function(tabs) {
        var tab = tabs[0];

        new Promise(function(resolve, reject) {
            chrome.tabs.executeScript(tab.id, {file: "confirmInitialized.js"}, function(result) {
                var inited = result[0];
                if (inited) {
                    resolve();
                } else {
                    chrome.tabs.executeScript(tab.id, {file: "jquery-2.0.3.js"});
                    chrome.tabs.executeScript(tab.id, {file: "underscore.js"});
                    chrome.tabs.executeScript(tab.id, {file: "image-container.js"});
                    chrome.tabs.executeScript(tab.id, {file: "imazip.js"}, function(result) {
                        resolve();
                    });
                }
            });
        }).then(function() {
            return new Promise(function(resolve, reject) {
                chrome.browserAction.getBadgeText(
                    { tabId : tab.id },
                    function(badgeText) { resolve(badgeText) }
                );
            });
        }).then(function(badgeText) {
            console.log(badgeText);
            var port = chrome.tabs.connect(tab.id, {name:'imazip'});

            if (badgeText === 'on') {
                port.postMessage({command:'imazip:end'});
                chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' })
            } else {
                port.postMessage({command:'imazip:start'});
                chrome.browserAction.setBadgeText({ tabId: tab.id, text: 'on' })
            }
        });
    });
});

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    if (req.name === 'imazip:close') {
        chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: '' })
    }
    if (req.name !== 'imazip') return;
    var page_url = req.page_url;
    var urls     = req.urls;
    var filename = req.filename.replace(/[:\/|"*<>?]/g, '');
    filename += filename.match(/\.zip$/) ? '' : '.zip';

    var zip = new JSZip();

    var promises = urls.map(function (url) {
        var resolvedUrl = URI.resolve(page_url, url);
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", resolvedUrl);
            xhr.responseType = "arraybuffer";

            xhr.onload = function (event) {
                var arrayBuffer = xhr.response;
                var filename = resolvedUrl.replace(/^(.*)\//, '');
                var mime = xhr.getResponseHeader('Content-Type');
                var ext  = mimeTypes[mime];
                console.log(ext);
                filename += filename.match(new RegExp('\\.' + ext + '$')) ? '' : '.' + ext;
                zip.file(filename, arrayBuffer, { binary : true });
                resolve(true);
            };
            xhr.onerror = function (event) {
                resolve(false);
            };
            xhr.send();
        });
    });
    Promise.all(promises).then(function () {
        var blob = zip.generate({ type: "blob" });
        var objectUrl = URL.createObjectURL(blob);

        chrome.downloads.download({
            url:objectUrl,
            filename:filename
        }, function() {
            console.log('complete');
            sendResponse('complete');
        })
    });
});

var mimeTypes = {
    'image/bmp'                      : 'bmp',
    'image/cgm'                      : 'cgm',
    'image/g3fax'                    : 'g3',
    'image/gif'                      : 'gif',
    'image/ief'                      : 'ief',
    'image/jpeg'                     : 'jpg',
    'image/ktx'                      : 'ktx',
    'image/png'                      : 'png',
    'image/prs.btif'                 : 'btif',
    'image/sgi'                      : 'sgi',
    'image/svg+xml'                  : 'svg',
    'image/tiff'                     : 'tiff',
    'image/vnd.adobe.photoshop'      : 'psd',
    'image/vnd.dece.graphic'         : 'uvi',
    'image/vnd.dvb.subtitle'         : 'sub',
    'image/vnd.djvu'                 : 'djvu',
    'image/vnd.dwg'                  : 'dwg',
    'image/vnd.dxf'                  : 'dxf',
    'image/vnd.fastbidsheet'         : 'fbs',
    'image/vnd.fpx'                  : 'fpx',
    'image/vnd.fst'                  : 'fst',
    'image/vnd.fujixerox.edmics-mmr' : 'mmr',
    'image/vnd.fujixerox.edmics-rlc' : 'rlc',
    'image/vnd.ms-modi'              : 'mdi',
    'image/vnd.ms-photo'             : 'wdp',
    'image/vnd.net-fpx'              : 'npx',
    'image/vnd.wap.wbmp'             : 'wbmp',
    'image/vnd.xiff'                 : 'xif',
    'image/webp'                     : 'webp',
    'image/x-3ds'                    : '3ds',
    'image/x-cmu-raster'             : 'ras',
    'image/x-cmx'                    : 'cmx',
    'image/x-freehand'               : 'fh',
    'image/x-icon'                   : 'ico',
    'image/x-mrsid-image'            : 'sid',
    'image/x-pcx'                    : 'pcx',
    'image/x-pict'                   : 'pic',
    'image/x-portable-anymap'        : 'pnm',
    'image/x-portable-bitmap'        : 'pbm',
    'image/x-portable-graymap'       : 'pgm',
    'image/x-portable-pixmap'        : 'ppm',
    'image/x-rgb'                    : 'rgb',
    'image/x-tga'                    : 'tga',
    'image/x-xbitmap'                : 'xbm',
    'image/x-xpixmap'                : 'xpm',
    'image/x-xwindowdump'            : 'xwd'
}
