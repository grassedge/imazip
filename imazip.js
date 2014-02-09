
var ImageSelector = (function () {
    function ImageSelector(args) {
        var _this = this;
        this.urls = args.urls;
        this.callbacks = {
            onEnd: function (e) {
                _this.onEnd(e);
            },
            onClickClose: function (e) {
                _this.onClickClose(e);
            },
            onClickDownload: function (e) {
                _this.onClickDownload(e);
            },
            onClickImage: function (e) {
                _this.onClickImage(e);
            }
        };

        this.$el = $(JST['image-container.ejs']({
            urls: this.urls,
            title: $('title').text()
        }));
        $(document.body).append(this.$el);

        $(document.body).on('imazip:end', this.callbacks.onEnd);
        this.$el.on('click', '.imazip-download-button.close', this.callbacks.onClickClose);
        this.$el.on('click', '.imazip-download-button.download', this.callbacks.onClickDownload);
        this.$el.on('click', '.imazip-image-container', this.callbacks.onClickImage);
    }
    ImageSelector.prototype.destroy = function () {
        this.$el.remove();
        $(document.body).off('imazip:end', this.callbacks.onEnd);
    };

    ImageSelector.prototype.onEnd = function (e) {
        this.destroy();
    };

    ImageSelector.prototype.onClickDownload = function (e) {
        var filename = this.$el.find('.imazip-download-filename').val();
        var urls = Array.prototype.map.call(this.$el.find('.imazip-image-container.checked img'), function (img) {
            return $(img).attr('src');
        }).filter(function (url) {
            return url ? 1 : 0;
        });
        chrome.runtime.sendMessage({
            name: "imazip",
            page_url: location.href,
            urls: urls,
            filename: filename
        }, function (res) {
            console.log(res);
            this.$el.remove();
        });
    };

    ImageSelector.prototype.onClickImage = function (e) {
        $(e.currentTarget).toggleClass('checked');
    };

    ImageSelector.prototype.onClickClose = function (e) {
        this.destroy();
        chrome.runtime.sendMessage({
            name: "imazip:close"
        }, function (res) {
            console.log(res);
        });
    };
    return ImageSelector;
})();

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
            },
            onEnd: function (e) {
                return _this.onEnd(e);
            }
        };

        $(document.body).on('mouseover', this.callbacks.onMouseover);
        $(document.body).on('mouseout', this.callbacks.onMouseout);
        $(document.body).on('click', this.callbacks.onClick);
        $(document.body).on('imazip:end', this.callbacks.onEnd);
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
        var urls = Array.prototype.filter.call($(e.target).find('img'), function (img) {
            return (img.width >= 300 && img.height >= 300) ? 1 : 0;
        }).map(function (img) {
            var $img = $(img);
            var $a = $(img).closest('a');
            if (!$img.attr('src'))
                return;
            return ($a.length > 0 && $a.attr('href').match(/(jpeg|jpg|png|gif)$/i)) ? $a.attr('href') : $(img).attr('src');
        }).filter(function (url) {
            return url ? 1 : 0;
        });

        $(this).trigger('picked', urls);

        new ImageSelector({ urls: urls });
    };

    UrlPicker.prototype.onEnd = function (e) {
        $(this.highlightTarget).css({ 'box-shadow': this.originalShadow });
        $(document.body).off('mouseover', this.callbacks.onMouseover);
        $(document.body).off('mouseout', this.callbacks.onMouseout);
        $(document.body).off('click', this.callbacks.onClick);
        $(document.body).off('end', this.callbacks.onEnd);
    };
    return UrlPicker;
})();

(function () {
    chrome.runtime.onConnect.addListener(function (port) {
        console.log(port);
        console.assert(port.name == "imazip");

        port.onMessage.addListener(function (msg) {
            console.log(msg);
            if (msg.command === 'imazip:start') {
                var picker = new UrlPicker();
                $(picker).on('picked', function (e) {
                    var urls = [];
                    for (var _i = 0; _i < (arguments.length - 1); _i++) {
                        urls[_i] = arguments[_i + 1];
                    }
                    $(document.body).trigger('imazip:end');
                });
            }
            if (msg.command === 'imazip:end') {
                $(document.body).trigger('imazip:end');
            }
        });
    });
})();
