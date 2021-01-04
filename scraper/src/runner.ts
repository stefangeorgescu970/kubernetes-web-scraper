import fs from "fs";
import ScrapeUtils from "./domain/ScrapeUtils";

fs.readFile("../resources/sample-websites.csv", async (err, data) => {
    if (err) {
        throw err;
    }
    const websites = data.toString().split("\n").slice(1); // remove title from csv
    const scraper = new ScrapeUtils();

    console.log("LOG - Starting website processing");

    for (let index = 0; index < 99; index++) {
        const website = websites[index];
        console.log(`LOG - Processing website ${website}`);
        const scrapeData = await scraper.extractInformation(website);
        console.log(scrapeData);
    }
});
