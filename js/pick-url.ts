/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
declare var chrome:any;

    // (urlsWithImages:any[]):any[] => {
    //     return urlsWithImages.map((image) => {
    //         try  {
    //             var func = new Function("image", this.filter);
    //             return func(image);
    //         } catch (e) {
    //             console.log(e);
    //         }
    //     });
    // },

var filters = [
    {
        pageUrl: { regexp: /.*/ },
        filterScript: (urlsWithImages:any[]):any[] => {
            return urlsWithImages.filter((image) => {
                var img = image.img;
                return (img.width >= 200 && img.height >= 200) ? true : false;
            });
        },
    },
    {
        pageUrl: { regexp: /.*/ },
        filterScript: (urlsWithImages:any[]):any[] => {
            return urlsWithImages.map((urlWithImage) => {
                var img = urlWithImage.img;
                var $img = $(img);
                var $a = $img.closest('a');
                if (!$img.attr('src')) return;
                var url = ($a.length > 0 && $a.attr('href').match(/(jpeg|jpg|png|gif)$/i))
                    ? $a.attr('href') : $img.attr('src');
                return { img : img, url : url };
            });
        }
    },
    {
        pageUrl: { regexp : /matome.naver.jp/ },
        filterScript: function (urlsWithImages) {
            return urlsWithImages.map(function (urlWithImage) {
                var img = urlWithImage.img;
                var $img = $(img);
                var $a = $img.closest('a');
                var href = $a.attr('href');
                var pageUrl = $a.attr('href');
                var d = $.Deferred();
                $.get(pageUrl).done(function (body) {
                    var url = $(body).find('.mdMTMEnd01Wrap img').attr('src');
                    d.resolve({ url: url, img: img });
                });
                return d.promise();
            });
        }
    },
    {
        pageUrl: { regexp : /^http:\/\/www.cosp.jp/ },
        filterScript: (urlsWithImages:any[]):any[] => {
            return urlsWithImages.map((urlWithImage) => {
                var img = urlWithImage.img;
                var $img = $(img);
                var $a = $img.closest('a');
                var href = $a.attr('href');
                if (!href || href[0] !== '/') return urlWithImage;
                var pageUrl = 'http://www.cosp.jp' + $a.attr('href');
                var d = $.Deferred();
                $.get(pageUrl).done((body) => {
                    var url = $(body).find('#imgView').attr('src');
                    // console.log(url)
                    d.resolve({ url : url, img : img });
                })
                return d.promise();
            });
        },
    }
];

class UrlPicker {
    HIGHLIGHT_SHADOW:string = '0 0 30px rgba(0,0,128,0.5)';
    originalShadow:any;
    highlightTarget:any;
    callbacks:any;
    filter:string;

    constructor() {
        this.callbacks = {
            onMessage   : (e) => this.onMessage(e),
            onMouseover : (e) => this.onMouseover(e),
            onMouseout  : (e) => this.onMouseout(e),
            onClick     : (e) => this.onClick(e),
            onEnd       : (e) => this.onEnd(e),
        };

        chrome.runtime.onMessage.addListener(this.callbacks.onMessage);
        $(document.body).on('mouseover',  this.callbacks.onMouseover);
        $(document.body).on('mouseout',   this.callbacks.onMouseout);
        $(document.body).on('click',      this.callbacks.onClick);
        $(document.body).on('imazip:end', this.callbacks.onEnd);
    }

    private onMessage(e) {
        if (e.command === 'imazip:start') {
            this.filter = e.filter;
        }
        if (e.command === 'imazip:end') {
            $(document.body).trigger('imazip:end');
        }
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
            return { img : img, url : img.src }
        });
        var urlsWithImages = urls;

        var pageUrl = location.href;
        var f = filters.filter((filter) => !!location.href.match(filter.pageUrl.regexp))
                       .map((filter) => filter.filterScript);
        var promise = f.reduce((promise:JQueryPromise<any>, converter) => {
            return promise.then((...urlsWithImages) => {
                return $.when.apply($, converter(urlsWithImages));
            });
        }, $.when.apply($, urlsWithImages));

        promise.then((...urlsWithImages:any[]) => {
            urlsWithImages = urlsWithImages.filter((url) => url ? true : false);

            var urls = urlsWithImages.map((urlWithImage):string => urlWithImage.url);

            chrome.runtime.sendMessage({
                name: "imazip:url:picked",
                urls: urls,
            });
            $(document.body).trigger('imazip:end');
        });
    }

    private onEnd(e) {
        $(this.highlightTarget).css({'box-shadow':this.originalShadow});
        chrome.runtime.onMessage.removeListener(this.callbacks.onMessage);
        $(document.body).off('mouseover',  this.callbacks.onMouseover);
        $(document.body).off('mouseout',   this.callbacks.onMouseout);
        $(document.body).off('click',      this.callbacks.onClick);
        $(document.body).off('imazip:end', this.callbacks.onEnd);
    }
}

new UrlPicker();
