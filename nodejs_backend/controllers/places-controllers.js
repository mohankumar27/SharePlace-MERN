const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HttpError = require("../models/http-error");
const getCoordinatesFromAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/users");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; //{pid:"p1"}
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Server Error: could not find place", 500));
  }
  if (!place) {
    return next(new HttpError("could not find place", 404));
  }
  res.json({ place: place.toObject({ getters: true }) }); //javascript shortcut [if variable name and key name are same ie {place:place} can be written as {place}]
};

const getPlacesByUser = async (req, res, next) => {
  const userId = req.params.uid; //{uid:"u1"}
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    return next(
      new HttpError("Server Error: could not find places for user", 500)
    );
  }
  if (!places || places.length === 0) {
    return next(new HttpError("could not find places for specified user", 404)); //both throw and next can be used. Most preffered is "next"
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  }); //javascript shortcut [if variable name and key name are same ie {place:place} can be written as {place}]
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs passed", 422));
  }
  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordinatesFromAddress(address);
  } catch (error) {
    console.log(error);
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Server Error: place creation failed", 500));
  }

  if (!user) {
    return next(new HttpError("could not find user for provided id", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("Server Error: Place creation failed", 500));
  }
  res.status(201).json({ createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Fields cannot be empty", 422));
  }
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Server Error: could not update place", 500));
  }
  if (!place) {
    return next(new HttpError("place not found", 404));
  }
  const { title, description } = req.body;
  title && (place.title = title);
  description && (place.description = description);
  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not allowed to Edit this place", 403));
  }

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError("Server Error: Updated place cannot be saved", 500)
    );
  }

  res.status(200).send({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(new HttpError("Server Error: cannot find place", 500));
  }
  if (!place) {
    return next(new HttpError("place not found", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to Delete this place", 403));
  }

  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("Server Error: cannot delete place", 500));
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).send({ success: "place deleted" });
};

module.exports = {
  getPlaceById,
  getPlacesByUser,
  createPlace,
  updatePlace,
  deletePlace,
};
