/// <reference path="../../typings/jquery/jquery.d.ts" />

function helper(nodeList: NodeList) {
    for (var i = 0; i < nodeList.length; i++) {
        var article = <HTMLElement>nodeList[i];
        var divs = article.querySelectorAll('[data-lightbox]');
        var urls = $(divs).map((idx, div) => {
            return JSON.parse(div.getAttribute('data-lightbox'));
        }).toArray();
        article.setAttribute('data-imazip', JSON.stringify(urls));
    }
}

var mutationObserver = new MutationObserver((records: MutationRecord[]) => {
    records.forEach((record) => {
        if (!$(record.target).is('#search_posts')) return;
        helper(record.addedNodes);
    })
});

var container = document.querySelector('#search_posts');
mutationObserver.observe(container, { childList: true, subtree: true });
var articles = container.querySelectorAll('article')
helper(articles)