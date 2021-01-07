import axios from "axios";
import fs from "fs";
import ScrapeResult from "./domain/ScrapeResult";

function batch(array: string[], size: number): string[][] {
    const batched: string[][] = [];

    let index = 0;
    while (index < array.length) {
        batched.push(array.slice(index, size + index));
        index += size;
    }

    return batched;
}

fs.readFile("./resources/sample-websites.csv", async (err, data) => {
    if (err) {
        throw err;
    }
    const websites = data.toString().split("\n").slice(1); // remove title from csv

    console.log("LOG - Starting website processing");

    for (const currentBatch of batch(websites, 15)) {
        try {
            const results = await Promise.all(
                currentBatch.map(website =>
                    axios.get(`http://192.168.64.2/?domain=${website}`)
                )
            );
            console.log(
                JSON.stringify(
                    results.map(result =>
                        result.data.map(
                            scrapeData =>
                                new ScrapeResult({
                                    info: scrapeData.info,
                                    pages: scrapeData.pages,
                                    source: scrapeData.source,
                                    type: scrapeData.type,
                                })
                        )
                    )
                )
            );
        } catch (exc) {
            console.log(exc);
        }
    }
});
