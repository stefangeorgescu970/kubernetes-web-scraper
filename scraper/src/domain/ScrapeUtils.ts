import fs from "fs";
import fetch from "node-fetch";
import ScrapeResult, {
    ScrapeResultSource,
    ScrapeResultType,
} from "./ScrapeResult";

export default class ScrapeUtils {
    private emailRegex = new RegExp(
        fs.readFileSync("../resources/email-regex.txt").toString(),
    );
    private phoneRegex = new RegExp(
        fs.readFileSync("../resources/phone-regex.txt").toString(),
    );

    public async extractInformation(path: string): Promise<ScrapeResult[]> {
        const html = await this.loadHTML(path);
        const scrapeResults = this.parseRequiredData(html, path);
        const filteredScrapeResults = this.filterScrapeResults(scrapeResults);
        return filteredScrapeResults;
    }

    private async loadHTML(path: string): Promise<string> {
        const res = await fetch(`http://${path}`);
        const html = await res.text();

        return html;
    }

    private parseRequiredData(html: string, source: string): ScrapeResult[] {
        const results: ScrapeResult[] = [];

        const emails = html.match(this.emailRegex);
        if (emails) {
            emails.forEach((email) => {
                results.push(
                    new ScrapeResult({
                        info: email,
                        page: source,
                        source: ScrapeResultSource.REGEX,
                        type: ScrapeResultType.EMAIL,
                    }),
                );
            });
        }

        const phones = html.match(this.phoneRegex);
        if (phones) {
            phones.forEach((phone) => {
                results.push(
                    new ScrapeResult({
                        info: phone,
                        page: source,
                        source: ScrapeResultSource.REGEX,
                        type: ScrapeResultType.PHONE,
                    }),
                );
            });
        }

        return results;
    }

    private filterScrapeResults(results: ScrapeResult[]): ScrapeResult[] {
        return results.filter((result) => {
            if (result.info === "") {
                return false;
            }
            return true;
        });
    }
}
