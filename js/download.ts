/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
declare var chrome:any;
declare var JST:any;
declare var _:any;

class ImageSelector {
    urls: string[];
    pageUrl: string;
    $el: JQuery;
    callbacks: any;

    constructor() {
        this.$el = $(document.body);

        this.callbacks = {
            onMessage: (e) => { this.onMessage(e) },
            onClickClose: (e) => { this.onClickClose(e) },
            onClickDownload: (e) => { this.onClickDownload(e) },
            onClickImage: (e) => { this.onClickImage(e) },
            onDblClickImage: (e) => { this.onDblClickImage(e) },
        };

        chrome.runtime.onMessage.addListener(this.callbacks.onMessage);
        this.$el.on('click', '.close-button', this.callbacks.onClickClose);
        this.$el.on('click', '.download-button', this.callbacks.onClickDownload);
        this.$el.on('click', '.image-container', this.callbacks.onClickImage);
        this.$el.on('dblclick', '.image-container', this.callbacks.onDblClickImage);
    }

    render() {
        // XXX filename.
        $('.download-filename').val('hoge'/*this.filename*/);
        var html = $(JST['download-image-container']({urls:this.urls}));
        $('.imazip-content').append(html);
    }

    private onMessage(req /* , sender, sendResponse */) {
        this.urls    = req.urls;
        this.pageUrl = req.pageUrl;

        this.render();
    }

    private onClickDownload(e) {
        var filename = this.$el.find('.download-filename').val();
        var urls = Array.prototype.map.call(
            this.$el.find('.image-container.checked img'),
            (img) => $(img).attr('src')
        ).filter((url) => url ? 1 : 0);
        chrome.runtime.sendMessage({
            name: "imazip",
            page_url: location.href,
            urls: urls,
            filename: filename
        }, function(res) {
            console.log(res);
            this.$el.remove();
        });
    }

    private onClickImage(e) {
        $(e.currentTarget).toggleClass('checked');
    }

    private onDblClickImage(e) {
        var url = $(e.currentTarget).find('img').attr('src');
        window.open(url);
    }

    private onClickClose(e) {
        close();
    }
}

$(function() {
    new ImageSelector();
});
