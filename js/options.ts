/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />

declare var JST:any;

var filters = [
    {
        name: 'size fileter',
        pageUrl: { regexp: /.*/ },
        filterScript: (urlsWithImages:any[]):any[] => {
            return urlsWithImages.filter((image) => {
                var img = image.img;
                return (img.width >= 200 && img.height >= 200) ? true : false;
            });
        },
    },
    {
        name: 'thumbnail filter',
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
        name: 'naver matome converter',
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
        name: 'cosp converter',
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

class Converter {
    name: string;
    description: string;
    pageUrl: any;
    filterScript: string;

    constructor(args) {
        this.name         = args.name;
        this.description  = args.description;
        this.pageUrl      = args.pageUrl || {};
        this.filterScript = args.filterScript;
    }

    pageUrlIsRegexp():boolean {
        return !!this.pageUrl.regexp;
    }
}

class OptionController {
    converters: Converter[];

    constructor() {
        this.converters = filters.map((f) => new Converter(f));
        this.render();

        $('.add-button').on('click', (e) => this.onClickAddButton(e));
    }

    render() {
        this.converters.forEach((converter) => {
            var html = JST['option-converter']({converter:converter});
            $('.main-container').append(html);
        });
    }

    onClickAddButton(e) {
        var html = JST['option-converter']({converter:new Converter({})});
        $('.main-container').append(html);
    }
}

$(function() {
    new OptionController();
});
