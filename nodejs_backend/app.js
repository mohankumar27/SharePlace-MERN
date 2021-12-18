const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const placesRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/uploads/images", express.static(path.join("uploads", "images")));

//To avoid blocked by CORS policy error
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", userRoutes);

app.use((req, res, next) => {
  const error = new HttpError("could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error occured!" });
});

const MONGO_DB = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mern.mklvi.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
mongoose
  .connect(MONGO_DB, { useNewUrlParser: true })
  .then(() => {
    console.log("connection Established");
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
