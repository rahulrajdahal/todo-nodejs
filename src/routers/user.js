const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const router = new express.Router();

const User = require("../models/user");
const auth = require("../middleware/auth");

// Create a User | Sign up User

/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - User
 *     description: Register a new User
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              $ref: "#/components/schemas/Register User"
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Register User"
 *     responses:
 *       201:
 *         description: Registers the requested user.
 *       400:
 *         description: Bad Request.
 */
router.post("/users", async (req, res) => {
  console.log(req.body, "req");
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @openapi
 * /users/login:
 *   post:
 *     tags:
 *       - User
 *     description: Login User registered user.
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              $ref: "#/components/schemas/Login User"
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Login User"
 *     responses:
 *       200:
 *         description: User logged into the system.
 *       400:
 *         description: Bad Request.
 */
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

/**
 * @openapi
 * /users/logout:
 *   post:
 *     tags:
 *       - User
 *     description: Logout, End user session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out of the system.
 *       401:
 *         description: Unauthorized Error.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token != req.token
    );
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags:
 *       - User
 *     description: Get user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the logged in user.
 *       401:
 *         description: Unauthorized Error.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags:
 *       - User
 *     description: Update user profile.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              $ref: "#/components/schemas/Update User"
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Update User"
 *     responses:
 *       204:
 *         description: User is updated.
 *       401:
 *         description: Unauthorized Error.
 *       400:
 *         description: Bad Request.
 */
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Update" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @openapi
 * /users/me:
 *   delete:
 *     tags:
 *       - User
 *     description: Delete the user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: User is removed.
 *       401:
 *         description: Unauthorized Error.
 *       500:
 *         description: Internal Server Error.
 */
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

// Add User Avatar
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     tags:
 *       - User
 *     description: Add the user avatar.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              $ref: "#/components/schemas/Upload Avatar"
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Upload Avatar"
 *     responses:
 *       200:
 *         description: Uploads the user avatar successfully.
 *       401:
 *         description: Unauthorized Error.
 *       400:
 *         description: Bad Request.
 */
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({
        width: 250,
        height: 250,
      })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

/**
 * @openapi
 * /users/me/avatar:
 *   delete:
 *     tags:
 *       - User
 *     description: Removes the user avatar.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user avatar is removed.
 *       401:
 *         description: Unauthorized Error.
 *       404:
 *         description: Not Found Error.
 */
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

/**
 * @openapi
 * /users/{id}/avatar:
 *   get:
 *     tags:
 *       - User
 *     description: Get user avatar.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User avatar is fetched.
 *       401:
 *         description: Unauthorized Error.
 *       404:
 *         description: Not Found Error.
 */
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
