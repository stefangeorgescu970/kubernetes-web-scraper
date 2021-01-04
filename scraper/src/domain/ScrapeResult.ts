export enum ScrapeResultSource {
    URI = "URI",
    REGEX = "REGEX",
}

export enum ScrapeResultType {
    PHONE = "PHONE",
    EMAIL = "EMAIL",
}

export interface IScrapeResult {
    info?: string;
    type?: ScrapeResultType;
    source?: ScrapeResultSource;
    page?: string;
}

export default class ScrapeResult {
    public info: string;
    public page: string;
    public type: ScrapeResultType;
    public source: ScrapeResultSource;

    constructor(args: IScrapeResult) {
        this.info = args.info || "";
        this.type = args.type || ScrapeResultType.EMAIL;
        this.source = args.source || ScrapeResultSource.REGEX;
        this.page = args.page || "";
    }
}
