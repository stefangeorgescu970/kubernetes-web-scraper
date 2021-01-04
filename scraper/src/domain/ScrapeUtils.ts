import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import fetch from "node-fetch";
import ScrapeResult, {
    ScrapeResultSource,
    ScrapeResultType,
} from "./ScrapeResult";

export default class ScrapeUtils {
    private regexEnabled = false;
    private depthScraping = true;

    private emailRegex = new RegExp(
        fs.readFileSync("../resources/email-regex.txt").toString(),
    );
    private phoneRegex = new RegExp(
        fs.readFileSync("../resources/phone-regex.txt").toString(),
    );

    public async extractInformation(domain: string): Promise<ScrapeResult[]> {
        const pages: string[] = [domain];
        const filteredScrapeResults: ScrapeResult[] = [];

        for (let index = 0; index < pages.length; index++) {
            const currentPage = pages[index];
            console.log(`LOG - Scraping page ${currentPage}`);

            try {
                const res = await axios.get(
                    currentPage.startsWith("https")
                        ? currentPage
                        : `https://${currentPage}`,
                );
                const html = res.data;
                const scrapeResults = this.parseRequiredData(html, currentPage);
                filteredScrapeResults.push(
                    ...this.filterScrapeResults(scrapeResults),
                );

                if (this.depthScraping) {
                    const domainLinks = this.getDomainLinksFromPage(html, domain);
                    domainLinks.forEach((link) => {
                        if (!pages.includes(link)) {
                            pages.push(link);
                        }
                    });
                }
            } catch (error) {
                console.log(`LOG - error when processing page ${currentPage}`);
            }
        }

        return this.mergeScrapeResults(filteredScrapeResults);
    }

    private getDomainLinksFromPage(html: string, domain: string): string[] {
        const result: string[] = [];
        const $ = cheerio.load(html);
        $("a").each((index, elem) => {
            const hrefText = $(elem).attr("href");

            if (hrefText) {
                if (
                    hrefText.indexOf(domain) !== -1 &&
                    hrefText.indexOf("mailto") === -1 &&
                    !hrefText.endsWith(".jpg") &&
                    !hrefText.endsWith(".png") &&
                    !hrefText.endsWith(".pdf") &&
                    hrefText.indexOf("?") === -1 &&
                    (hrefText.indexOf("about") !== -1 || hrefText.indexOf("contact") !== -1)
                ) {
                    result.push(hrefText);
                }
            }
        });

        return result;
    }

    private parseRequiredData(html: string, source: string): ScrapeResult[] {
        const results: ScrapeResult[] = [];

        const $ = cheerio.load(html);
        $("a").each((index, elem) => {
            const hrefText = $(elem).attr("href");

            if (hrefText) {
                if (hrefText.startsWith("tel:")) {
                    results.push(
                        new ScrapeResult({
                            info: hrefText.slice(hrefText.indexOf(":") + 1),
                            pages: [source],
                            source: ScrapeResultSource.URI,
                            type: ScrapeResultType.PHONE,
                        }),
                    );
                }

                if (hrefText.startsWith("mailto:")) {
                    results.push(
                        new ScrapeResult({
                            info: hrefText.slice(hrefText.indexOf(":") + 1),
                            pages: [source],
                            source: ScrapeResultSource.URI,
                            type: ScrapeResultType.EMAIL,
                        }),
                    );
                }
            }
        });

        if (this.regexEnabled) {
            const emails = html.match(this.emailRegex);
            if (emails) {
                emails.forEach((email) => {
                    results.push(
                        new ScrapeResult({
                            info: email,
                            pages: [source],
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
                            pages: [source],
                            source: ScrapeResultSource.REGEX,
                            type: ScrapeResultType.PHONE,
                        }),
                    );
                });
            }
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

    private mergeScrapeResults(results: ScrapeResult[]): ScrapeResult[] {
        const mergedResults: ScrapeResult[] = [];

        results.forEach((result) => {
            let indexOf = -1;
            for (let index = 0; index < mergedResults.length; index++) {
                if (result.info === mergedResults[index].info && result.source === mergedResults[index].source) {
                    indexOf = index;
                    break;
                }
            }

            if (indexOf !== -1) {
                mergedResults[indexOf].pages.push(...result.pages);
            } else {
                mergedResults.push(result);
            }
        });

        return mergedResults;
    }
}
