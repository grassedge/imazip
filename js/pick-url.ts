/// <reference path="../typings/jquery/jquery.d.ts" />

declare var chrome:any;

class UrlPicker {
    HIGHLIGHT_SHADOW:string = '0 0 30px rgba(0,0,128,0.5)';
    originalShadow:any;
    highlightTarget:any;

    constructor() {
        chrome.runtime.onMessage.addListener(this.onMessage);
        $(document.body).on('mouseover',  this.onMouseover);
        $(document.body).on('mouseout',   this.onMouseout);
        $(document.body).on('click',      this.onClick);
        $(document.body).on('imazip:end', this.onEnd);
    }

    private onMessage = (e) => {
        if (e.command === 'imazip:end') {
            $(document.body).trigger('imazip:end');
        }
    }

    private onMouseover = (e) => {
        var target = this.highlightTarget = e.target;
        this.originalShadow = $(e.target).css('box-shadow');
        $(e.target).css({'box-shadow':this.HIGHLIGHT_SHADOW});
    }

    private onMouseout = (e) => {
        var target = e.target;
        $(e.target).css({'box-shadow':this.originalShadow});
    }

    private onClick = (e) => {
        // tumblr
        var urls;
        if (location.hostname === 'www.tumblr.com' && location.pathname.match(/^\/search\//)) {
            urls = $(e.target).find('article').toArray().map((article) => {
                var urlSetList = JSON.parse($(article).attr('data-imazip'));
                return urlSetList.map((urlSet) => {
                    return {
                        anchorUrl : urlSet["high_res"],
                        srcUrl    : urlSet["low_res"],
                        url       : urlSet["low_res"],
                    };
                });
            }).reduce((ary, urlSetList) => {
                return ary.concat(urlSetList);
            }, []);
        } else {
            urls = $(e.target).find('img').toArray().filter((img) => img.src).map((img) => {
                var anchorUrl = $(img).closest('a').attr('href');
                return {
                    anchorUrl : anchorUrl,
                    srcUrl    : img.src,
                    url       : img.src,
                }
            });
        }
        chrome.runtime.sendMessage({
            name: "imazip:url:picked",
            urls: urls,
            title: $('title').text(),
        });
        $(document.body).trigger('imazip:end');
    }

    private onEnd = (e) => {
        $(this.highlightTarget).css({'box-shadow':this.originalShadow});
        chrome.runtime.onMessage.removeListener(this.onMessage);
        $(document.body).off('mouseover',  this.onMouseover);
        $(document.body).off('mouseout',   this.onMouseout);
        $(document.body).off('click',      this.onClick);
        $(document.body).off('imazip:end', this.onEnd);
    }
}

new UrlPicker();
