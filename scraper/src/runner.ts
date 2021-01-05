import fs from "fs";
import ScrapeResult from "./domain/ScrapeResult";
import ScrapeUtils from "./domain/ScrapeUtils";

fs.readFile("../resources/sample-websites.csv", async (err, data) => {
    if (err) {
        throw err;
    }
    const websites = data.toString().split("\n").slice(1); // remove title from csv
    const scraper = new ScrapeUtils();
    const scrapingResults: ScrapeResult[] = [];
    const numberOfDomainsToScrape = 100;

    console.log("LOG - Starting website processing");

    for (let index = 0; index < numberOfDomainsToScrape; index++) {
        const website = websites[index];
        console.log(`LOG - Processing website ${website} (${index + 1} of ${numberOfDomainsToScrape})`);
        const scrapeData = await scraper.extractInformation(website);
        scrapingResults.push(...scrapeData);
    }

    fs.writeFile("./results-dev.json", JSON.stringify(scrapingResults), (error) => {
        if (error) { throw error; }
        console.log("LOG - Processing complete");
    });
});
