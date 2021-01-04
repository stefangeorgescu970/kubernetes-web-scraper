import express from "express";

const app = express();
const port = 3000;
app.get("/", async (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});
