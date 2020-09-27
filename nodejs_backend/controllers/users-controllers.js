const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/users");

const getAllUsers = async (req, res, next) => {
  let allUsers;
  try {
    allUsers = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("Server Error: cannot get users", 500));
  }
  res.json({
    allUsers: allUsers.map((user) => user.toObject({ getters: true })),
  });
};

const userSignup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs", 422));
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Server Error: signup failed", 500));
  }
  if (existingUser) {
    return next(new HttpError("Email already exists", 403));
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user. Please try again", 500));
  }
  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new HttpError("Server Error: User creation failed", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    return next(new HttpError("Server Error: User creation failed", 500));
  }

  res.status(201).json({ userId: newUser.id, email: newUser.email, token });
};

const userLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs", 422));
  }
  const { email, password } = req.body;
  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Server Error: Login failed", 500));
  }
  if (!user) {
    return next(new HttpError("email does not exist", 404));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (err) {
    return next(
      new HttpError("could not login, please check you credentials", 500)
    );
  }
  if (!isValidPassword) {
    return next(new HttpError("password is incorrect", 404));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    return next(new HttpError("Server Error: User login failed", 500));
  }

  res.json({
    userId: user.id,
    email: user.email,
    token,
  });
};

module.exports = {
  getAllUsers,
  userSignup,
  userLogin,
};
