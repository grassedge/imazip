/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
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
    }

    private onLoadImage(e) {
        var img = <HTMLImageElement>e.target;
        if (img.naturalHeight < 100 || img.naturalWidth < 100) {
            $(img).closest('.image-container').hide();
        }
        this.$el.find('.image-size-width-label').text(img.naturalWidth);
        this.$el.find('.image-size-height-label').text(img.naturalHeight);
        this.$el.find('.image-url').text(this.url);
    }

    private onErrorLoadingImage(e) {
        var img = <HTMLImageElement>e.target;
        $(img).closest('.image-container').hide();
    }
}

class Downloader {
    urls: string[];
    pageUrl: string;
    filename: string;
    $el: JQuery;
    callbacks: any;

    constructor() {
        this.$el = $(document.body);

        this.callbacks = {
            onClickClose: (e) => { this.onClickClose(e) },
            onClickDownload: (e) => { this.onClickDownload(e) },
            onClickImage: (e) => { this.onClickImage(e) },
            onDblClickImage: (e) => { this.onDblClickImage(e) },
            onChangeImageSize: (e) => { this.onChangeImageSize(e) },
            onChangeImageSizeFilter: (e) => { this.onChangeImageSizeFilter(e) },
            onChangeImageUrlFilter: (e) => { this.onChangeImageUrlFilter(e) },
        };

        this.$el.on('click', '.close-button', this.callbacks.onClickClose);
        this.$el.on('click', '.download-button', this.callbacks.onClickDownload);
        this.$el.on('click', '.image-container', this.callbacks.onClickImage);
        this.$el.on('dblclick', '.image-container', this.callbacks.onDblClickImage);
        this.$el.on('change', '.image-size', this.callbacks.onChangeImageSize);
        this.$el.on('change', '.image-size-filter', this.callbacks.onChangeImageSizeFilter);
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
        var size = (containerWidth / imageNum) - 26;
        this.$el.find('.image-container').css({height:size, width:size});
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

    private onClickImage(e) {
        $(e.currentTarget).toggleClass('checked');
    }

    private onDblClickImage(e) {
        var url = $(e.currentTarget).find('img').attr('src');
        window.open(url);
    }

    private onClickClose(e) {
        close();
    }

    private onChangeImageSize(e) {
        var range = $(e.target).val();
        this.resizeImage(6 - range);
    }

    private onChangeImageSizeFilter(e) {
        var $target = $(e.target);
        var direction = $target.attr('date-direction');

        var $containers = this.$el.find('.image-container');
        $containers.hide();
        $containers.filter((idx, el) => {
            var img = el.querySelector('img');
            if (direction === 'width') {
                return img.naturalWidth > $target.val()
            } else if (direction === 'height') {
                return img.naturalHeight > $target.val()
            }
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
