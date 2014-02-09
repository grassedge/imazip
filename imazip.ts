/// <reference path="d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
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
            onClickImage: (e) => { this.onClickImage(e) }
        };

        this.$el = $(JST['image-container.ejs']({
            urls:this.urls,
            title:$('title').text()
        }));
        $(document.body).append(this.$el);

        $(document.body).on('imazip:end', this.callbacks.onEnd);
        this.$el.on('click', '.imazip-download-button.close', this.callbacks.onClickClose);
        this.$el.on('click', '.imazip-download-button.download', this.callbacks.onClickDownload);
        this.$el.on('click', '.imazip-image-container', this.callbacks.onClickImage);
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

    onClickClose(e) {
        this.destroy()
        chrome.runtime.sendMessage({
            name: "imazip:close",
        }, function(res) {
            console.log(res);
        });
    }
}

class UrlPicker {
    HIGHLIGHT_SHADOW:string = '0 0 30px rgba(0,0,128,0.5)';
    originalShadow:any;
    highlightTarget:any;
    callbacks:any;

    constructor() {
        this.callbacks = {
            onMouseover : (e) => this.onMouseover(e),
            onMouseout  : (e) => this.onMouseout(e),
            onClick     : (e) => this.onClick(e),
            onEnd       : (e) => this.onEnd(e),
        };

        $(document.body).on('mouseover',  this.callbacks.onMouseover);
        $(document.body).on('mouseout',   this.callbacks.onMouseout);
        $(document.body).on('click',      this.callbacks.onClick);
        $(document.body).on('imazip:end', this.callbacks.onEnd);
    }

    private onMouseover(e) {
        var target = this.highlightTarget = e.target;
        this.originalShadow = $(e.target).css('box-shadow');
        $(e.target).css({'box-shadow':this.HIGHLIGHT_SHADOW});
    }

    private onMouseout(e) {
        var target = e.target;
        $(e.target).css({'box-shadow':this.originalShadow});
    }

    private onClick(e) {
        var urls = Array.prototype.filter.call($(e.target).find('img'), (img) => {
            return (img.width >= 300 && img.height >= 300) ? 1 : 0;
        }).map((img) => {
            var $img = $(img);
            var $a = $(img).closest('a');
            if (!$img.attr('src')) return;
            return ($a.length > 0 && $a.attr('href').match(/(jpeg|jpg|png|gif)$/i))
                ? $a.attr('href') : $(img).attr('src')
        }).filter((url) => url ? 1 : 0);

        $(this).trigger('picked', urls);

        new ImageSelector({urls:urls});
    }

    private onEnd(e) {
        $(this.highlightTarget).css({'box-shadow':this.originalShadow});
        $(document.body).off('mouseover', this.callbacks.onMouseover);
        $(document.body).off('mouseout',  this.callbacks.onMouseout);
        $(document.body).off('click',     this.callbacks.onClick);
        $(document.body).off('end',       this.callbacks.onEnd);
    }
}

(function() {

    chrome.runtime.onConnect.addListener(function(port) {
        console.log(port);
        console.assert(port.name == "imazip");

        port.onMessage.addListener(function(msg) {
            console.log(msg)
            if (msg.command === 'imazip:start') {
                var picker = new UrlPicker();
                $(picker).on('picked', function(e, ...urls) {
                    $(document.body).trigger('imazip:end');
                });
            }
            if (msg.command === 'imazip:end') {
                $(document.body).trigger('imazip:end');
            }
        });
    });
})();
