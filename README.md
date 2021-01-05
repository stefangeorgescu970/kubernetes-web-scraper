# Kubernetes Web Scraper
This repository contains the code reuqired to run a project given as an interview task. Each requirement of the project is discussed below.

## Programming Task

The task at hand was to extract emails and phone numbers from the first 100 webistes found in this [list](resources/sample-websites.csv). The purpose was to extract as many valid information as possible from the domains. The tech stack was not imposed.

### Technologies Used

I decided to use Node.js as a starting point. I have configured the project to use Typescript. 
Initially I have attempted to use [axios](https://www.npmjs.com/package/axios) to send requests for the webpages. It was quite unstable and I decided to switch to [Puppeteer](https://www.npmjs.com/package/puppeteer) and [cheerio](https://www.npmjs.com/package/cheerio) to find elements in the HTML code.
[Express](https://www.npmjs.com/package/express) has also been added to the project for this stage but only for testing the Typescript configuration. It will be used in the following tasks.

### Solution Description
For this task, two classes were implemented. 

The [ScrapeResult](scraper/src/domain/ScrapeResult.ts) is used to encapsulate the scraping results. It holds the information found, be it an email or a phone number, the type of the information (again, email or phone number), the type of extraction used (from an URI or by matching a regex) and the pages from where this information was sourced.

The [ScrapeUtils](scraper/src/domain/ScrapeUtils.ts) is used to perform all the scraping logic. It exposes a single public method, `extractInformation`. This method receives a domain and will scrape some of the pages associated with that domain that the scraper can find on the landing page, based on some conditions (I have attempted to make the process more efficient by only scraping pages that usually contain contact information. I have attempted this by selecting the URLs that contain `contact` or `about` in the path. It then builds a queue of websites it has to process. 
Extracting the phone numbers and emails is done during the same step. The scraper looks for URI tags (`tel` and `mailto`), merges the identical results and adds all the different sources to the `ScrapeResult` object. The `extractInformation` method returns a Promise containing an array of `ScrapeResult` objects.

[runner.ts](scraper/src/runner.ts) has been implemented such that this task can be ran independently from the command line. The code within this file iterates over the first 100 websites in the list and processes each domain sequentially. The scraping results are saved as a JSON in the [results.json](results.json) file.

### Issues Encountered
Firstly, one issue that I was not able to solve was the precision of the regular expressions. It is obvious that I used online sources to find the regular expressions present in the [resources](resources) directory. During testing I have found that a lot of other numbers get misinterpreted as phone numbers. Additionally, the email regex was matching with scripts from the header of the HTML page that had the `@` sign in them (which is a starting point for extracting technologies from websites). I have decided not to spend time on fine-tuning the regular expressions, but I am sure that with some work maybe more phone numbers will be extracted from the websites (from what websites I looked over before implementing, I have noticed that almost all emails are added with a `mailto` URI, while phone numbers are usually just plain text). I have added a flag to control wether this information is extracted and I have set it to false.

Another issue that I ran into was an infinite loop generated by a login page that could be accessed from the about page. The about was present in the URL, since it was kept as a return path for the login flow as a parameter. Accessing the URL again would just re-add the full return path to the parameter. In a number of steps the URL was three rows long in my terminal. I have mitigated this issue by not visiting URLs in which `?` is present. This had no impact on the amout of data scraped from the first 100 websited.

Finally, towards the end of the day, I encountered a different issue. I noticed that with every run the scraper was slower. I have not fully ruled out the possibility that my script is bad, but I have managed to run it without issue by booting up a virtual machine and running it there. I assume that due to a lot of requests, I was getting throttled. 

### Running this Task
The code can be ran with `npm run start:runner` within the [scraper](scraper) directory.