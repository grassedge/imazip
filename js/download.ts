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

interface UrlSet {
    url      : string;
    srcUrl   : string;
    anchorUrl: string;
}

interface URL {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    username: string;
    password: string;
    origin: string;
    new(url: string): URL;
}

class ImazipURL {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    username: string;
    password: string;
    origin: string;

    constructor(urlString: string) {
        var url = new URL(urlString);
        // google images
        if (url.hostname + url.pathname === 'www.google.co.jp/imgres') {
            var params = this.parseParams(url);
            url = new URL(decodeURIComponent(decodeURIComponent(params.imgurl)));
        }

        this.href     = url.href;
        this.protocol = url.protocol;
        this.host     = url.host;
        this.hostname = url.hostname;
        this.port     = url.port;
        this.pathname = url.pathname;
        this.search   = url.search;
        this.hash     = url.hash;
        this.username = url.username;
        this.password = url.password;
        this.origin   = url.origin;
    }

    private parseParams(url: URL) {
        return url.search.substr(1).split('&')
            .map((kv) => kv.split('='))
            .reduce((params, kv) => { params[kv[0]] = kv[1]; return params }, <any>{});
    }
};

// ---- model ----

class ImageModel {
    url      : ImazipURL;
    srcUrl   : ImazipURL;
    anchorUrl: ImazipURL;

    width: number;
    height: number;

    isSelectedManually: bool;

    constructor(urlSet: UrlSet) {
        this.url       = urlSet.url ? new ImazipURL(urlSet.url) : null;
        this.srcUrl    = urlSet.srcUrl ? new ImazipURL(urlSet.srcUrl) : null;
        this.anchorUrl = urlSet.anchorUrl ? new ImazipURL(urlSet.anchorUrl) : null;
    }
}

// ---- service ----

class ImageService extends EventEmitter {
    constructor() { super() }

    filterThumbnail(isChecked:boolean) {
        this.emit('filter:thumbnail', isChecked);
    }

    filterImageBySize(width: number, height: number) {
        this.emit('filter:image:size', { width: width, height: height });
    }

    filterImageByUrl(urlRegExp: RegExp) {
        this.emit('filter:image:url', urlRegExp);
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
    private imageService: ImageService;
    private imageModel: ImageModel;
    private $el: JQuery;
    private filterWidth : number = 100;
    private filterHeight: number = 100;
    private urlRegExp: RegExp = /(?:)/;

    constructor(args: {
        imageService: ImageService;
        imageModel: ImageModel;
        $el:JQuery
    }) {
        this.imageService = args.imageService;
        this.imageModel = args.imageModel;
        this.$el        = args.$el;

        this.imageService.on('filter:thumbnail', this.onFilterThumbnail);
        this.imageService.on('filter:image:url', this.onFilterImageByUrl);
        this.imageService.on('filter:image:size', this.onFilterImageBySize);
        this.$el.find('img').on('load', this.onLoadImage)
        this.$el.find('img').on('error', this.onErrorLoadingImage);
        this.$el.on('click', this.onClickImage);
    }

    render() {
        var img = <HTMLImageElement>this.$el.find('img')[0];
        if (img.naturalWidth  > this.filterWidth &&
            img.naturalHeight > this.filterHeight &&
            this.imageModel.url &&
            this.urlRegExp.test(this.imageModel.url.href)) {
            this.$el.addClass('checked');
        } else {
            this.$el.removeClass('checked');
        }
        this.$el.find('.image-size-width-label').text(img.naturalWidth);
        this.$el.find('.image-size-height-label').text(img.naturalHeight);
        this.$el.find('.image-url').attr('href', img.src).text(img.src);
    }

    private onFilterThumbnail = (useAnchorUrl:boolean) => {
        this.imageModel.url = useAnchorUrl ? this.imageModel.anchorUrl
                                           : this.imageModel.srcUrl;
        if (this.imageModel.url) {
            this.$el.find('.imazip-image').attr('src', this.imageModel.url.href);
        }
        this.render();
    }

    private onFilterImageByUrl = (urlRegExp: RegExp) => {
        this.urlRegExp = urlRegExp;
        this.render();
    }

    private onFilterImageBySize = (size: { width: number; height: number; }) => {
        this.filterWidth = size.width;
        this.filterHeight = size.height;
        this.render();
    }

    private onLoadImage = (e) => {
        var img = <HTMLImageElement>e.target;
        this.imageModel.width  = img.naturalWidth;
        this.imageModel.height = img.naturalHeight;
        this.render();
    }

    private onErrorLoadingImage = (e) => {
        var img = <HTMLImageElement>e.target;
        $(img).closest('.image-container').removeClass('checked');
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
        this.$el.on('change', '.image-thumbnail-filter', this.onChangeThumbnailFilterButton);
    }

    render() {
        $('.download-filename').val(this.filename);
        var $elements = this.imageModels.map((imageModel) => {
            var $container = $(JST['download-image-container']({url:imageModel.url.href}));
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
        var width  = this.$el.find('[data-direction="width"] .filter-value').val()
        var height = this.$el.find('[data-direction="height"] .filter-value').val()
        this.imageService.filterImageBySize(width, height);
    };

    private onChangeImageUrlFilter = (e) => {
        var $target = $(e.target);
        var pattern = $target.val();
        this.imageService.filterImageByUrl(new RegExp(pattern));
    };

    private onChangeThumbnailFilterButton = (e) => {
        var $target = $(e.target);
        var isChecked = $target.prop('checked');
        this.imageService.filterThumbnail(isChecked);
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
