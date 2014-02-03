/// <reference path="d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
declare var chrome:any;

class UrlPicker {
    HIGHLIGHT_SHADOW:string = '0 0 30px rgba(0,0,128,0.5)';
    originalShadow:any;
    highlightTarget:any;
    callbacks:any;

    constructor() {
        this.callbacks = {
            onMouseover : (e) => this.onMouseover(e),
            onMouseout  : (e) => this.onMouseout(e),
            onClick     : (e) => this.onClick(e)
        };

        $(document.body).on('mouseover', this.callbacks.onMouseover);
        $(document.body).on('mouseout',  this.callbacks.onMouseout);
        $(document.body).on('click',     this.callbacks.onClick);
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

        $(this.highlightTarget).css({'box-shadow':this.originalShadow});
        $(document.body).off('mouseover', this.callbacks.onMouseover);
        $(document.body).off('mouseout',  this.callbacks.onMouseout);
        $(document.body).off('click',     this.callbacks.onClick);
        $(this).trigger('picked', urls);
    }

}

(function() {
    var picker = new UrlPicker();
    $(picker).on('picked', function(e, ...urls) {
        chrome.runtime.sendMessage({
            name: "imazip",
            page_url: location.href,
            urls: urls
        }, function(res) {
            // response handle
        });
    });
})();
