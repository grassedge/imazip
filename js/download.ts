/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
declare var chrome:any;
declare var JST:any;
declare var _:any;

class ImageSelector {
    urls:string[];
    $el:any;
    callbacks:any;
    constructor(args:{urls:string[];}) {
        this.urls = args.urls;
        this.callbacks = {
            onEnd: (e) => { this.onEnd(e) },
            onClickClose: (e) => { this.onClickClose(e) },
            onClickDownload: (e) => { this.onClickDownload(e) },
            onClickImage: (e) => { this.onClickImage(e) },
            onDblClickImage: (e) => { this.onDblClickImage(e) }
        };

        this.$el = $('.imazip-screen');
        var $el = $(JST['download-image-container']({
            urls:this.urls,
            title:$('title').text()
        }));
        $('.imazip-content').append($el);

        $(document.body).on('imazip:end', this.callbacks.onEnd);
        this.$el.on('click', '.imazip-download-button.close', this.callbacks.onClickClose);
        this.$el.on('click', '.imazip-download-button.download', this.callbacks.onClickDownload);
        this.$el.on('click', '.imazip-image-container', this.callbacks.onClickImage);
        this.$el.on('dblclick', '.imazip-image-container', this.callbacks.onDblClickImage);
    }

    destroy() {
        this.$el.remove();
        $(document.body).off('imazip:end', this.callbacks.onEnd);
    }

    onEnd(e) {
        this.destroy();
    }

    onClickDownload(e) {
        var filename = this.$el.find('.imazip-download-filename').val();
        var urls = Array.prototype.map.call(
            this.$el.find('.imazip-image-container.checked img'),
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

    onClickImage(e) {
        $(e.currentTarget).toggleClass('checked');
    }

    onDblClickImage(e) {
        var url = $(e.currentTarget).find('img').attr('src');
        window.open(url);
    }

    onClickClose(e) {
        this.destroy()
        chrome.runtime.sendMessage({
            name: "imazip:close",
        }, function(res) {
            console.log(res);
        });
    }
}

$(function() {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        var urls = req.urls;
        new ImageSelector({urls:urls});
    });
});
