/// <reference path="../typings/jquery/jquery.d.ts" />
declare var chrome:any;
declare var JST:any;

class EventEmitter {

    private handlers:any = {};

    on(name:string, func:(...values:any[]) => any) {
        if (!this.handlers[name]) this.handlers[name] = [];
        this.handlers[name].push(func);
    }

    off(name?:string, func?:(...values:any[]) => any) {
        if (name === undefined) {
            this.handlers = {};
        } else if (func === undefined) {
            this.handlers[name] = [];
        } else {
            this.handlers[name] = this.handlers[name].filter(
                (handler) => (handler !== func)
            );
        }
    }

    emit(name:string, event?) {
        var handlers = this.handlers[name] || [];
        for (var i = 0, len = handlers.length; i < len; i++) {
            handlers[i](event);
        }
    }
}

enum UrlType {
    SRC,
    ANCHOR
}

interface UrlSet {
    url      : string;
    srcUrl   : string;
    anchorUrl: string;
}

// ---- model ----

class ImageModel {
    url: string;
    srcUrl: string;
    anchorUrl: string;
    appliedUrl: UrlType = UrlType.SRC;

    width: number;
    height: number;

    isSelectedManually: bool;

    constructor(urlSet: UrlSet) {
        this.url       = urlSet.url;
        this.srcUrl    = urlSet.srcUrl;
        this.anchorUrl = urlSet.anchorUrl;
    }
}

// ---- service ----

class ImageService extends EventEmitter {
    constructor() { super() }

    changeThumbnailFilter(isChecked:boolean) {
        this.emit('change:thumbnailfilter', isChecked);
    }

    fetchUrls() {
        chrome.runtime.sendMessage({
            name: "imazip:page:loaded",
        }, (res:{urls:UrlSet[];title:string;}) => {
            this.emit('fetch:urls', res);
        });
    }
}

// ---- controller ----

class ImageContainer {
    imageService: ImageService;
    imageModel: ImageModel;
    $el: JQuery;

    constructor(args: {
        imageService: ImageService;
        imageModel: ImageModel;
        $el:JQuery
    }) {
        this.imageService = args.imageService;
        this.imageModel = args.imageModel;
        this.$el        = args.$el;

        this.imageService.on('change:thumbnailfilter', this.onChangeThumbnailFilter);
        this.$el.find('img').on('load', this.onLoadImage)
        this.$el.find('img').on('error', this.onErrorLoadingImage);
        this.$el.on('click', this.onClickImage);
    }

    private onChangeThumbnailFilter = (e:boolean) => {
        var src = e ? this.imageModel.anchorUrl : this.imageModel.srcUrl;
        if (src) {
            this.$el.find('.imazip-image').attr('src', src);
        } else {
            this.$el.hide()
        }
    }

    private onLoadImage = (e) => {
        var img = <HTMLImageElement>e.target;
        this.imageModel.width  = img.naturalWidth;
        this.imageModel.height = img.naturalHeight;
        if (img.naturalHeight < 100 || img.naturalWidth < 100) {
            this.$el.hide();
        }
        this.$el.find('.image-size-width-label').text(img.naturalWidth);
        this.$el.find('.image-size-height-label').text(img.naturalHeight);
        this.$el.find('.image-url').attr('href', img.src).text(img.src);
    }

    private onErrorLoadingImage = (e) => {
        var img = <HTMLImageElement>e.target;
        $(img).closest('.image-container').hide();
    }

    private onClickImage = (e) => {
        if ($(e.target).closest('.image-meta-container').length !== 0) return;
        this.$el.toggleClass('checked');
    }
}

class Downloader {
    private imageModels: ImageModel[];
    private filename: string;
    private filterWidth: number = 100;
    private filterHeight: number = 100;
    private $el: JQuery;
    private imageService: ImageService;

    constructor(args: { $el: JQuery; imageService: ImageService; }) {
        this.$el = args.$el;
        this.imageService = args.imageService;

        this.imageService.on('fetch:urls', this.onFetchUrls);
        this.$el.on('click', '.close-button', this.onClickClose);
        this.$el.on('click', '.download-button', this.onClickDownload);
        this.$el.on('change', '.image-size', this.onChangeImageSizeDisplay);
        this.$el.on('input', '.image-size-filter', this.onInputImageSizeFilter);
        this.$el.on('input', '.image-url-filter', this.onChangeImageUrlFilter);
        this.$el.on('change', '.image-thumbnail-filter', this.onClickThumbnailFilter);
    }

    render() {
        $('.download-filename').val(this.filename);
        var $elements = this.imageModels.map((imageModel) => {
            var $container = $(JST['download-image-container']({url:imageModel.url}));
            new ImageContainer({
                imageService: this.imageService,
                imageModel:imageModel,
                $el:$container
            });
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

    // handlers

    private onFetchUrls = (res) => {
        this.imageModels = res.urls.map((url) => new ImageModel(url));
        this.filename    = res.title;
        this.render();
    }

    private onClickDownload = (e) => {
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
    };

    private onClickClose = (e) => {
        close();
    };

    private onChangeImageSizeDisplay = (e) => {
        var range = $(e.target).val();
        this.resizeImage(6 - range);
    };

    private onInputImageSizeFilter = (e) => {
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
            var img = <HTMLImageElement>el.querySelector('img');
            return img.naturalWidth > this.filterWidth
                && img.naturalHeight > this.filterHeight;
        }).show();
    };

    private onChangeImageUrlFilter = (e) => {
        var $target = $(e.target);
        var pattern = $target.val();

        var $containers = this.$el.find('.image-container');
        $containers.hide();
        $containers.filter((idx, el) => {
            var img = <HTMLImageElement>el.querySelector('img');
            return (new RegExp(pattern)).test(img.src);
        }).show();
    };

    private onClickThumbnailFilter = (e) => {
        var $target = $(e.target);
        var isChecked = $target.prop('checked');
        this.imageService.changeThumbnailFilter(isChecked);
    };
}

$(function() {
    var imageService = new ImageService();
    new Downloader({
        $el: $(document.body),
        imageService: imageService,
    });

    imageService.fetchUrls();
});
