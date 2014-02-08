chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.query({active:true}, function(tabs) {
        var tab = tabs[0];
        chrome.tabs.executeScript(tab.id, {file: "jquery-2.0.3.js"});
        chrome.tabs.executeScript(tab.id, {file: "html2canvas.js"});
        chrome.tabs.executeScript(tab.id, {file: "underscore.js"});
        chrome.tabs.executeScript(tab.id, {file: "image-container.js"});
        chrome.tabs.executeScript(tab.id, {file: "imazip.js"});
    });
});

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
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
                zip.file(filename, arrayBuffer, { binary: true });
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
