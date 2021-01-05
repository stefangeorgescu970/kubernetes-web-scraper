import express from "express";
import ScrapeUtils from "./domain/ScrapeUtils";

const app = express();
const port = 3000;
app.get("/", async (req, res) => {
    try {
        const domain: string = req.query.domain.toString();
        const scraper = new ScrapeUtils();

        if (domain) {
            const scrapeResults = await scraper.extractInformation(domain);
            res.send(JSON.stringify(scrapeResults));
            console.log("Done scraping");
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
