/// <reference path="d.ts/DefinitelyTyped/jquery/jquery.d.ts" />

var UrlPicker = (function () {
    function UrlPicker() {
        var _this = this;
        this.HIGHLIGHT_SHADOW = '0 0 30px rgba(0,0,128,0.5)';
        this.callbacks = {
            onMouseover: function (e) {
                return _this.onMouseover(e);
            },
            onMouseout: function (e) {
                return _this.onMouseout(e);
            },
            onClick: function (e) {
                return _this.onClick(e);
            }
        };

        $(document.body).on('mouseover', this.callbacks.onMouseover);
        $(document.body).on('mouseout', this.callbacks.onMouseout);
        $(document.body).on('click', this.callbacks.onClick);
    }
    UrlPicker.prototype.onMouseover = function (e) {
        var target = this.highlightTarget = e.target;
        this.originalShadow = $(e.target).css('box-shadow');
        $(e.target).css({ 'box-shadow': this.HIGHLIGHT_SHADOW });
    };

    UrlPicker.prototype.onMouseout = function (e) {
        var target = e.target;
        $(e.target).css({ 'box-shadow': this.originalShadow });
    };

    UrlPicker.prototype.onClick = function (e) {
        var urls = Array.prototype.map.call($(e.target).find('img'), function (img) {
            var $img = $(img);
            var $a = $(img).closest('a');
            if (!$img.attr('src').match(/(jpeg|jpg|png|gif)$/i))
                return;
            return ($a.length > 0 && $a.attr('href').match(/(jpeg|jpg|png|gif)$/i)) ? $a.attr('href') : $(img).attr('src');
        }).filter(function (url) {
            return url ? 1 : 0;
        });

        $(this.highlightTarget).css({ 'box-shadow': this.originalShadow });
        $(document.body).off('mouseover', this.callbacks.onMouseover);
        $(document.body).off('mouseout', this.callbacks.onMouseout);
        $(document.body).off('click', this.callbacks.onClick);
        $(this).trigger('picked', urls);
    };
    return UrlPicker;
})();

(function () {
    var picker = new UrlPicker();
    $(picker).on('picked', function (e) {
        var urls = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            urls[_i] = arguments[_i + 1];
        }
        chrome.runtime.sendMessage({
            name: "imazip",
            page_url: location.href,
            urls: urls
        }, function (res) {
            // response handle
        });
    });
})();
