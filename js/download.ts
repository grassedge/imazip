/// <reference path="../typings/jquery/jquery.d.ts" />
declare var chrome:any;
declare var JST:any;

class ImageContainer {
    url: string;
    $el: JQuery;

    constructor(args: {
        url:string;
        $el:JQuery
    }) {
        this.url = args.url;
        this.$el = args.$el;

        this.$el.find('img').on('load', (e) => this.onLoadImage(e))
        this.$el.find('img').on('error', (e) => this.onErrorLoadingImage(e));
        this.$el.on('click', (e) => this.onClickImage(e));
    }

    private onLoadImage(e) {
        var img = <HTMLImageElement>e.target;
        if (img.naturalHeight < 100 || img.naturalWidth < 100) {
            $(img).closest('.image-container').hide();
        }
        this.$el.find('.image-size-width-label').text(img.naturalWidth);
        this.$el.find('.image-size-height-label').text(img.naturalHeight);
    }

    private onErrorLoadingImage(e) {
        var img = <HTMLImageElement>e.target;
        $(img).closest('.image-container').hide();
    }

    private onClickImage(e) {
        if ($(e.target).closest('.image-meta-container').length !== 0) return;
        this.$el.toggleClass('checked');
    }
}

class Downloader {
    urls: string[];
    pageUrl: string;
    filename: string;
    filterWidth: number = 100;
    filterHeight: number = 100;
    $el: JQuery;
    callbacks: any;

    constructor() {
        this.$el = $(document.body);

        this.callbacks = {
            onClickClose: (e) => { this.onClickClose(e) },
            onClickDownload: (e) => { this.onClickDownload(e) },
            onChangeImageSizeDisplay: (e) => { this.onChangeImageSizeDisplay(e) },
            onInputImageSizeFilter: (e) => { this.onInputImageSizeFilter(e) },
            onChangeImageUrlFilter: (e) => { this.onChangeImageUrlFilter(e) },
        };

        this.$el.on('click', '.close-button', this.callbacks.onClickClose);
        this.$el.on('click', '.download-button', this.callbacks.onClickDownload);
        this.$el.on('change', '.image-size', this.callbacks.onChangeImageSizeDisplay);
        this.$el.on('input', '.image-size-filter', this.callbacks.onInputImageSizeFilter);
        this.$el.on('input', '.image-url-filter', this.callbacks.onChangeImageUrlFilter);
        this.fetchUrls();
    }

    render() {
        $('.download-filename').val(this.filename);
        var $elements = this.urls.map((url) => {
            var $container = $(JST['download-image-container']({url:url}));
            new ImageContainer({url:url, $el:$container});
            return $container;
        })
        $('.imazip-content').append($elements);

        this.resizeImage(5);
    }

    private resizeImage(imageNum:number) {
        var containerWidth = $('.imazip-container').width();
        var size = (containerWidth / imageNum) - 28;
        this.$el.find('.image-container').css({width:size});
        this.$el.find('.image-content').css({width:size});
    }

    private fetchUrls() {
        chrome.runtime.sendMessage({
            name: "imazip:page:loaded",
        }, (res:{urls:string[];title:string;}) => {
            this.urls    = res.urls;
            this.filename = res.title;
            this.render();
        });
    }

    private onClickDownload(e) {
        var zipping = this.$el.find('.zipping').prop('checked');
        var filename = this.$el.find('.download-filename').val();
        var urls = Array.prototype.map.call(
            this.$el.find('.image-container.checked:visible img'),
            (img) => $(img).attr('src')
        ).filter((url) => url ? 1 : 0);
        chrome.runtime.sendMessage({
            name: "imazip",
            page_url: location.href,
            urls: urls,
            filename: filename,
            zipping: zipping,
        }, function(res) {
            console.log(res);
            this.$el.remove();
        });
    }

    private onClickClose(e) {
        close();
    }

    private onChangeImageSizeDisplay(e) {
        var range = $(e.target).val();
        this.resizeImage(6 - range);
    }

    private onInputImageSizeFilter(e) {
        var $target = $(e.target);
        $target.parent().find('.image-size-filter').val($target.val())

        var direction = $target.closest('[data-direction]').attr('data-direction');
        if (direction === 'width') {
            this.filterWidth = +$target.val();
        } else if (direction === 'height') {
            this.filterHeight = +$target.val();
        }

        var $containers = this.$el.find('.image-container');
        $containers.hide();
        $containers.filter((idx, el) => {
            var img = el.querySelector('img');
            return img.naturalWidth > this.filterWidth
                && img.naturalHeight > this.filterHeight;
        }).show();
    }

    private onChangeImageUrlFilter(e) {
        var $target = $(e.target);
        var pattern = $target.val();

        var $containers = this.$el.find('.image-container');
        $containers.hide();
        $containers.filter((idx, el) => {
            var img = el.querySelector('img');
            return (new RegExp(pattern)).test(img.src);
        }).show();
    }
}

$(function() {
    new Downloader();
});
