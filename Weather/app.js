const express = require("express");
const unirest = require("unirest");
const path = require("path");
const handlebars = require("express-handlebars");
const wFunctions = require("./functions.js");
const fs = require("fs");

const config = {
    port: 3000,
    app_id: ""
}
if (config.app_id == "") throw new Error("No APPID Defined!");

const weatherList = JSON.parse(fs.readFileSync(`${__dirname}/city.list.json`));
const abbrev = JSON.parse(fs.readFileSync(`${__dirname}/abbreviations.json`));
const locations = JSON.parse(fs.readFileSync(`${__dirname}/locations.json`));

const app = express();
const handlebars_instance = handlebars.create({
    extname: ".handlebars",
    compilerOptions: {
        preventIndent: true
    },
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials")
});
app.engine("handlebars", handlebars_instance.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views", "pages"));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, "/public")));

app.route("/").get((req, res) => {
    res.redirect("/Weather");
});

app.route("/Weather").get((req, res) => {
    res.render("input", {
        title: "Input Information"
    });
}).post((req, res) => {
    const urlParams = `${wFunctions.wParse(req.body, weatherList, abbrev, locations)}`;
    console.log(`urlParams: ${urlParams}`);
    res.redirect(`/Weather/Info/${urlParams}`);
});

app.route("/Weather/Info/:location").get((req, res) => {
    let weather = {};
    const urlParams = `https://api.openweathermap.org/data/2.5/forecast?q=${req.params.location},US&APPID=${config.app_id}&units=imperial`
    console.log(urlParams);
    let request = unirest.get(urlParams);
    request.end((response) => {
        const d1 = new Date(response.body.list[0].dt_txt);
        const d2 = new Date(); d2.setDate(d1.getDate() + 1);
        const d3 = new Date(); d3.setDate(d1.getDate() + 2);
        const d4 = new Date(); d4.setDate(d1.getDate() + 3);
        const d5 = new Date(); d5.setDate(d1.getDate() + 4);
        let days = [];
        for (let i = 0, j = 0; i < 40; i += 8, j++) {
            days.push(wFunctions.getAverages(response.body, i));
        }
        weather = response;
        let currTime = new Date(weather.body.list[0].dt * 1000);
        let morningOrEvening = currTime.getHours() < 12 ? "AM" : "PM";
        fs.writeFileSync("output.json", JSON.stringify(response, null, 2));
        res.render("weather", {
            title: `${req.params.location} Weather`,
            weather: {
                time: `${currTime.getHours() % 12}:00 ${morningOrEvening}`,
                location: `${req.params.location}`,
                temp: `${weather.body.list[0].main.temp}°F`,
                status: `${weather.body.list[0].weather[0].main}`,
                "feels-like": `${weather.body.list[0].main.feels_like}°F`,
                humidity: `${weather.body.list[0].main.humidity}%`,
                high: `${days[0].highest_temp}°F`,
                low: `${days[0].lowest_temp}°F`,
                image: wFunctions.getImageFromCode(Number(weather.body.list[0].weather[0].id))
            },
            days: {
                d1: {
                    date: `${d1.getMonth()}/${d1.getDate()}`,
                    high_low: `${days[0].highest_temp}°F/${days[0].lowest_temp}°F`
                },
                d2: {
                    date: `${d2.getMonth()}/${d2.getDate()}`,
                    high_low: `${days[1].highest_temp}°F/${days[1].lowest_temp}°F`
                },
                d3: {
                    date: `${d3.getMonth()}/${d3.getDate()}`,
                    high_low: `${days[2].highest_temp}°F/${days[2].lowest_temp}°F`
                },
                d4: {
                    date: `${d4.getMonth()}/${d4.getDate()}`,
                    high_low: `${days[3].highest_temp}°F/${days[3].lowest_temp}°F`
                },
                d5: {
                    date: `${d5.getMonth()}/${d5.getDate()}`,
                    high_low: `${days[4].highest_temp}°F/${days[4].lowest_temp}°F`
                },
            }
        });
    })
});

app.listen(config.port, () => {
    console.log(`express app running on port ${config.port}`);
});