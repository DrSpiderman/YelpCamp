const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers");

try {
    mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
    console.log("DB IS HERE!")
} catch(err) {
    console.log(err);
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected");
});

// function that returns array element with a index of random number in range of 0 to array.length argument

const randy = arr => arr[Math.floor(Math.random() * arr.length)];

//title is chosen from combining two arrays of string using randy function

const seedDb = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++){
        const price = Math.floor(Math.random() * 20) + 10;
        const newCity = randy(cities);
        const camp = new Campground(
            {
                title: `${randy(descriptors)} ${randy(places)}`,
                location: `${newCity.city}, ${newCity.state}`,
                images: [
                    {
                      url: 'https://res.cloudinary.com/dpkhkvn2o/image/upload/v1715188309/YelpCamp/ejb5il2kbeyqxcicyfw7.jpg',
                      filename: 'YelpCamp/ejb5il2kbeyqxcicyfw7',
                    },
                    {
                      url: 'https://res.cloudinary.com/dpkhkvn2o/image/upload/v1715188309/YelpCamp/s56r7xianuoafhjv2amw.jpg',
                      filename: 'YelpCamp/s56r7xianuoafhjv2amw',
                    }
                ],
                description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Unde nesciunt voluptatem est qui repellendus. Nihil maxime, esse animi mollitia recusandae omnis inventore numquam labore nemo, ex quos, fuga quibusdam porro!",
                author: "65f1e0a2e06349c12a94a7f1",
                price: 15,
                geometry: { type: 'Point', coordinates: [ newCity.longitude, newCity.latitude ] },
            });
        await camp.save();
    }
}

seedDb()
.then(() => {
    mongoose.connection.close();
});