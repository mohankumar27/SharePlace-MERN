const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const fileupload = require("../middleware/file-upload");

const router = express.Router();

router.get("/", usersControllers.getAllUsers);

router.post(
  "/signup",
  fileupload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.userSignup
);

router.post(
  "/login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  usersControllers.userLogin
);

module.exports = router;
