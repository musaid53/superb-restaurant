const mongoose = require("mongoose");
const url = process.env.MONGO_URL || "mongodb://localhost:27017/tables"

module.exports = mongoose
    .connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((connection) => {
        console.log("Connection established ");
        return connection;
    })
    .catch((err) => {
        console.log("Connection failed");
        console.log(err);
    });
