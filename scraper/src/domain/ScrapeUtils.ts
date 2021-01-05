import cheerio from "cheerio";
import fs from "fs";
import puppeteer from "puppeteer";
import ScrapeResult, {
    ScrapeResultSource,
    ScrapeResultType,
} from "./ScrapeResult";

export default class ScrapeUtils {
    private regexEnabled = false;
    private depthScraping = true;

    private emailRegex = new RegExp(
        fs.readFileSync("./resources/email-regex.txt").toString(),
    );
    private phoneRegex = new RegExp(
        fs.readFileSync("./resources/phone-regex.txt").toString(),
    );

    public async extractInformation(domain: string): Promise<ScrapeResult[]> {
        const pages: string[] = [domain];
        const filteredScrapeResults: ScrapeResult[] = [];
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
          });
        const page = await browser.newPage();

        for (const currentPage of pages) {
            console.log(`LOG - Scraping page ${currentPage}`);

            try {
                await page.goto(
                    currentPage.startsWith("http")
                        ? currentPage
                        : `https://${currentPage}`,
                    { waitUntil: "networkidle0" },
                );
                const html = await page.evaluate(() => document.querySelector("*").outerHTML);
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
                console.log(error.stack);
            }
        }

        await browser.close();

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
        // Method added as a response to the regular expressions sometimes matching empty strings.

        return results.filter((result) => {
            return result.info !== "";
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
