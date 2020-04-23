/*
 * Includes:
 */
const express = require("express");
const unirest = require("unirest");
const path = require("path");
const handlebars = require("express-handlebars");
const wFunctions = require("./functions.js");
const fs = require("fs");

/*
 * Globals contained in config object:
 * The "app_id" component is the API Key obtained from openweathermap.org,
 *  and it is not included in the GitHub repository, hence the error throw.
 */
const config = {
    port: 3000, // 3000 for localhost, 80 for server
    app_id: ""
}
if (config.app_id == "") throw new Error("No APPID Defined!");

// List of states and their abbreviations:
const abbrev = JSON.parse(fs.readFileSync(`${__dirname}/abbreviations.json`));
// List of cities and their corresponding ID
let citiesByCodes = JSON.parse(fs.readFileSync(`${__dirname}/citiesByCodes.json`));

const app = express(); // Express web-app
const handlebars_instance = handlebars.create({ // Handlebars templating language
    extname: ".handlebars",
    compilerOptions: {
        preventIndent: true
    },
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials")
});
app.engine("handlebars", handlebars_instance.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views", "pages")); // set up directories for handlebars
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, "/public")));

// Redirect default page to weather app:
app.route("/").get((req, res) => {
    res.redirect("/Weather");
});

// "domain.com/Weather":
app.route("/Weather").get((req, res) => {
    // Render default input page:
    res.render("input", {
        title: "Location Search"
    });
}).post((req, res) => {
    // Given the input form, parse input and return an ID:
    const urlParams = wFunctions.wParse(req.body, citiesByCodes, abbrev);
    console.log(urlParams);
    // If there are multiple possible locations, redirect to a page that gives the options:
    if (urlParams.status == "Multiples") {
        res.redirect(`/Weather/Select/${urlParams.url}`);
        return;
    }
    res.redirect(`/Weather/Info/${urlParams.url}`);
});

// "domain.com/Weather/Select/Lexington":
app.route("/Weather/Select/:cityName").get((req, res) => {
    if (citiesByCodes[req.params.cityName] == undefined) {
        res.render("404", {
            title: "Page Not Found"
        })
        return;
    }
    res.render("select", {
        title: "Selection",
        city: req.params.cityName,
        list: citiesByCodes[req.params.cityName].instances
    })
}).post((req, res) => {
    res.redirect(`/Weather/Info/id=${req.body.code}`);
});

// "domain.com/Weather/Info/123456":
app.route("/Weather/Info/:location").get((req, res) => {
    // Generate URL for 5-day forecast API:
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?${req.params.location}&APPID=${config.app_id}&units=imperial`
    // Generate URL for current weather API:
    const currentWeatherURL = `https://api.openweathermap.org/data/2.5/weather?${req.params.location}&APPID=${config.app_id}&units=imperial`;

    // Request 5-day forecast:
    let request = unirest.get(forecastURL);
    request.end((response1) => {
        // Error if location is not found:
        if (response1.statusCode != 200) {
            console.log(response1.statusCode);
            res.render("404", {
                title: "Page Not Found"
            })
            return;
        }
        // Create array of day objects containing date and low/high temperatures:
        let days = [];
        for (let i = 0, j = 0; i < 40; i += 8, j++) {
            days.push(wFunctions.getAverages(response1.body, i));
        }

        // Create object containing forecast of current day:
        const forecast = wFunctions.createForecastObject(response1.body, days[0]);

        let request1 = unirest.get(currentWeatherURL);
        request1.end((response2) => {
            const currTime = new Date(response2.headers.date);
            const weather = {
                temp: Math.trunc(Number(response2.body.main.temp)),
                "feels-like": Math.trunc(Number(response2.body.main.feels_like)),
                humidity: response2.body.main.humidity,
                time: currTime.toLocaleTimeString()
            }
            console.log(days);
            res.render("weather", {
                title: `${forecast.location} Weather`,
                forecast: forecast,
                weather: weather,
                days: days
            });
        });
    });
}).post((req,res) => {
    res.redirect("/Weather");
})

// Unspecified routes lead to Not Found:
app.route("*").get((req, res) => {
    res.render("404", {
        title: "Page Not Found"
    });
});

/*
 * Host on port 80 for website, 3000 for localhost:
 */
app.listen(config.port, () => {
    console.log(`express app running on port ${config.port}`);
});
