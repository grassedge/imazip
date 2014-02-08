/// <reference path="d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
declare var chrome:any;
declare var html2canvas:any;
declare var JST:any;
declare var _:any;

class ImagePreview {
    timerId:any;
    target:any;
    previewImg:any;
    callbacks:any;
    clientX:number;
    clientY:number;

    constructor() {
        this.callbacks = {
            onMouseover : (e) => this.onMouseover(e),
            onEnd       : (e) => this.onEnd(e),
        };

        $(document.body).on('mouseover', this.callbacks.onMouseover);
        $(document.body).on('imazip:end', this.callbacks.onEnd);
    }

    private createPreview(dataURI):any {
        var $img = $('<img>').attr('src', dataURI);
        $img.css({
            width:'100%',
            height:'100%',
        });
        var $container = $('<div>').append($img);
        $container.css({
            position: 'fixed',
            maxWidth: '300px',
            maxHeight: '300px',
            backgroundColor: 'white',
            top: this.clientY,
            left: this.clientX,
            zIndex: 10000
        });
        return $container;
    }

    private onMouseover(e) {
        var target = this.target = e.target;

        clearTimeout(this.timerId);
        if (this.previewImg) {
            this.previewImg.remove();
            delete this.previewImg;
        }
        this.clientX = e.clientX;
        this.clientY = e.clientY;
        this.timerId = setTimeout(() => {
            // なぜか html2canvas を呼ぶと一番上にスクロールされる
            html2canvas(this.target, {
                onrendered: (canvas) => {
                    var dataURI = canvas.toDataURL('image/png');
                    this.previewImg = this.createPreview(dataURI);
                    $('body').append(this.previewImg);
                }
            });
            console.log('zutto ita');
        }, 1000)
    }

    private onEnd(e) {
        $(document.body).off('mouseover', this.callbacks.onMouseover);
        $(document.body).off('end', this.callbacks.onEnd);
    }
}

class ImageSelector {
    urls:string[];
    $el:any;
    callbacks:any;
    constructor(args:{urls:string[];}) {
        this.urls = args.urls;
        this.callbacks = {
            onClickClose: (e) => { this.onClickClose(e) },
            onClickDownload: (e) => { this.onClickDownload(e) },
            onClickImage: (e) => { this.onClickImage(e) }
        };

        this.$el = $(JST['image-container.ejs']({
            urls:this.urls,
            title:$('title').text()
        }));
        $(document.body).append(this.$el);

        this.$el.on('click', '.imazip-download-button.close', this.callbacks.onClickClose);
        this.$el.on('click', '.imazip-download-button.download', this.callbacks.onClickDownload);
        this.$el.on('click', '.imazip-image-container', this.callbacks.onClickImage);
    }

    onClickDownload(e) {
        var filename = this.$el.find('.imazip-download-filename').val();
        chrome.runtime.sendMessage({
            name: "imazip",
            page_url: location.href,
            urls: this.urls,
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
        this.$el.remove();
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
        var urls = Array.prototype.map.call($(e.target).find('img'), (img) => {
            var $img = $(img);
            var $a = $(img).closest('a');
            if (!$img.attr('src').match(/(jpeg|jpg|png|gif)$/i)) return;
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
    var picker = new UrlPicker();
    // var preview = new ImagePreview();
    $(picker).on('picked', function(e, ...urls) {
        $(document.body).trigger('imazip:end');
    });
})();
