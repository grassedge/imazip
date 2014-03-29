/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
/// <reference path="./util.ts" />
/// <reference path="./converter.ts" />

declare var JST:any;

// built-in converters
var builtinConverters = [
    // {
    //     name: 'size fileter',
    //     pageUrl: { regexp: /.*/ },
    //     filterScript: (urlsWithImages:any[]):any[] => {
    //         return urlsWithImages.filter((image) => {
    //             var img = image.img;
    //             return (img.width >= 200 && img.height >= 200) ? true : false;
    //         });
    //     },
    // },
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

class OptionController {
    converters: IndexedList<Converter>;

    constructor(args) {
        this.converters = new IndexedList<Converter>(args.converters);
        this.render();

        $(document.body).on('click', '.add-button', (e) => this.onClickAddButton(e));
        $(document.body).on('click', '.edit-button', (e) => this.onClickEditButton(e));
        $(document.body).on('click', '.save-button', (e) => this.onClickSaveButton(e));
        $(document.body).on('click', '.delete-button', (e) => this.onClickDeleteButton(e));
    }

    render() {
        this.converters.forEach((converter) => {
            var html = JST['option-converter']({converter:converter});
            $('.main-container').append(html);
        });
    }

    onClickAddButton(e) {
        var converter = new Converter({name:'new converter'});
        this.converters.push(converter);
        var html = JST['option-edit-converter']({converter:converter});
        $('.main-container').append(html);
    }

    onClickEditButton(e) {
        var $button = $(e.target);
        var $filterItem = $button.closest('.filter-item')
        var id = $filterItem.attr('data-id');
        var filterName = $filterItem.find('.filter-name').text();

        var converter = this.converters.get(id);
        if (converter === undefined) throw new Error('no converter in list');
        var html = JST['option-edit-converter']({converter:converter});
        $filterItem.replaceWith(html);
    }

    onClickSaveButton(e) {
        var $button = $(e.target);
        var $filterItem = $button.closest('.edit-filter-item')
        var id = $filterItem.attr('data-id');
        var filterName = $filterItem.find('.filter-name').val();
        var filterPageUrl = $filterItem.find('.filter-page-url').val();
        var filterText = $filterItem.find('.filter-text').val();

        var converter = this.converters.get(id);
        converter.name         = filterName;
        converter.pageUrl      = { regexp : filterPageUrl };
        converter.filterText = filterText;

        localStorage['converters'] = JSON.stringify(this.converters.getList());

        var html = JST['option-converter']({converter:converter});
        $filterItem.replaceWith(html);
    }

    onClickDeleteButton(e) {
        var $button = $(e.target);
        var $filterItem = $button.closest('.edit-filter-item')
        var id = $filterItem.attr('data-id');
        var idx = this.converters.indexOf(this.converters.get(id));
        this.converters.splice(idx, 1);
        
        localStorage['converters'] = JSON.stringify(this.converters.getList());

        $filterItem.remove();
    }
}

$(function() {
    // var converters = builtinConverters.map((f) => new Converter(f));
    var converters = JSON.parse(localStorage['converters'] || '[]').map((c) => new Converter(c));
    new OptionController({converters:converters});
});
