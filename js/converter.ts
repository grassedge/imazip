class Converter {
    private _id:number;
    name: string;
    description: string;
    pageUrl: any;
    filterText: string;

    constructor(args) {
        this._id          = args._id || Math.floor(Math.random() * (1 << 30));
        this.name         = args.name;
        this.description  = args.description;
        this.pageUrl      = args.pageUrl || {};
        this.filterText   = args.filterText;
    }

    pageUrlAsString():string {
        return this.pageUrl.regexp;
    }

    pageUrlRegexpAsString():string {
        return (this.pageUrl.regexp || '').toString();
    }

    pageUrlIsRegexp():boolean {
        return !!this.pageUrl.regexp;
    }

    filterScript() {
        return new Function('urls', this.filterText);
    }

    id() {
        return this._id;
    }
}

