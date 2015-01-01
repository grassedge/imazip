/// <reference path="../typings/jquery/jquery.d.ts" />

declare var chrome:any;

class UrlPicker {
    MASK_STYLE = {
        position: 'absolute',
        backgroundColor: "#c0c0c0",
        zIndex: 999999,
        opacity: 0.8,
    };
    highlightTarget: Element;
    $container: JQuery;
    $topFrame: JQuery;
    $leftFrame: JQuery;
    $rightFrame: JQuery;
    $bottomFrame: JQuery;

    constructor() {
        this.initScreen();
        chrome.runtime.onMessage.addListener(this.onMessage);
        $(document.body).on('mousemove',  this.onMousemove);
        $(document.body).on('click',      this.onClick);
        $(document.body).on('imazip:end', this.onEnd);
    }

    private initScreen() {
        this.$container = $('<div>');
        $(document.body).append(this.$container);
    }

    private onMessage = (e) => {
        if (e.command === 'imazip:end') {
            $(document.body).trigger('imazip:end');
        }
    }

    private onMousemove = (e) => {
        var x = e.clientX;
        var y = e.clientY;
        this.$container.hide();

        var target = document.elementFromPoint(x, y);
        this.$container.show();

        if (this.highlightTarget === target) { return; }
        this.highlightTarget = target;
        var offset = $(target).offset();

        if (this.$topFrame)    this.$topFrame.remove();
        if (this.$bottomFrame) this.$bottomFrame.remove();
        if (this.$leftFrame)   this.$leftFrame.remove();
        if (this.$rightFrame)  this.$rightFrame.remove();

        this.$bottomFrame = $('<div>').css(this.MASK_STYLE).css({
            top: offset.top + $(target).height(),
            left: 0,
            right: 0,
            height: document.body.clientHeight - (offset.top + $(target).height()),
        });
        this.$leftFrame = $('<div>').css(this.MASK_STYLE).css({
            top: offset.top,
            height: $(target).height(),
            left: 0,
            width: offset.left,
        });
        this.$rightFrame = $('<div>').css(this.MASK_STYLE).css({
            top: offset.top,
            height: $(target).height(),
            right: 0,
            width: document.body.clientWidth - (offset.left + $(target).width()),
        });
        this.$topFrame = $('<div>').css(this.MASK_STYLE).css({
            top: 0,
            left: 0,
            right: 0,
            height: offset.top,
        });
        this.$container.append(this.$topFrame);
        this.$container.append(this.$leftFrame);
        this.$container.append(this.$rightFrame);
        this.$container.append(this.$bottomFrame);
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
        this.$container.remove();
        chrome.runtime.onMessage.removeListener(this.onMessage);
        $(document.body).off('mousemove',  this.onMousemove);
        $(document.body).off('click',      this.onClick);
        $(document.body).off('imazip:end', this.onEnd);
    }
}

new UrlPicker();
