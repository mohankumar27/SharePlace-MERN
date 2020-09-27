const HttpError = require("../models/http-error");

const axios = require("axios");

const API = process.env.GOOGLE_LOCATION_API;

async function getCoordinatesFromAddress(address) {
  const request = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )},+CA&key=${API}`;
  const response = await axios.get(request);
  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError("Could not find location for specified address", 422);
  }
  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordinatesFromAddress;
