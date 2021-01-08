import express from "express";
import ScrapeUtils from "./domain/ScrapeUtils";

const app = express();
const port = 3000;
app.get("/", async (req, res) => {
    try {
        const domain: string = req.query.domain.toString();
        const scraper = new ScrapeUtils();

        if (domain) {
            scraper
                .extractInformation(domain)
                .then(scrapeResults => {
                    res.send(JSON.stringify(scrapeResults));
                    console.log("Done scraping");
                })
                .catch(err => {
                    console.log("Error extracting information.");
                });
        } else {
            res.send("Please provide parameter");
        }
    } catch (error) {
        res.send("Error processing request.");
        console.log(error.stack);
    }
});

app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});
