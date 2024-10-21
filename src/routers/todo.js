const express = require("express");

const auth = require("../middleware/auth");
const Todo = require("../models/todo");
const { getAllTodos } = require("../controllers/todo");

const router = new express.Router();

/**
 * @openapi
 * /todos:
 *   get:
 *     tags:
 *       - Todo
 *     security:
 *       - bearerAuth: []
 *     description: Get user todos
 *     responses:
 *       200:
 *         description: Fetches user todos in the database.
 *       500:
 *         description: Internal server error`.
 */
router.get("/todos", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "todos",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.todos);
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * @openapi
 * /todos:
 *   post:
 *     tags:
 *       - Todo
 *     description: Create a new todo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              $ref: "#/components/schemas/POST Todo"
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/POST Todo"
 *     responses:
 *       201:
 *         description: Created a new todo.
 *       401:
 *         description: Unauthorized Error.
 *       400:
 *         description: Bad Request.
 */
router.post("/todos", auth, async (req, res) => {
  const todo = new Todo({ ...req.body, owner: req.user._id });

  try {
    await todo.save();
    res.status(201).send(todo);
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   get:
 *     tags:
 *       - Todo
 *     description: Get a todo by specified Id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Unique identifier of the todo item.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fetched Todo successfully.
 *       401:
 *         description: Unauthorized Error.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/todos/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const todo = await Todo.findOne({ _id, owner: req.user._id });

    if (!todo) {
      return res.status(404).send();
    }

    res.send(todo);
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   patch:
 *     tags:
 *       - Todo
 *     description: Update a todo by specified Id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Unique identifier of the todo item.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              $ref: "#/components/schemas/Update Todo"
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Update Todo"
 *     responses:
 *       204:
 *         description: Updated Todo successfully.
 *       401:
 *         description: Unauthorized Error.
 *       400:
 *         description: Bad Request Error.
 */
router.patch("/todos/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isvalidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isvalidOperation) {
    return res.status(400).send({ error: "Invalid Update!" });
  }
  try {
    const todo = await Todo.findOne({ _id, owner: req.user._id });

    if (!todo) {
      return res.status(404).send();
    }

    updates.forEach((update) => (todo[update] = req.body[update]));
    await todo.save();
    res.send(todo);
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   delete:
 *     tags:
 *       - Todo
 *     description: Delete a todo by specified Id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Unique identifier of the todo item.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted Todo successfully.
 *       401:
 *         description: Unauthorized Error.
 *       500:
 *         description: Internal Server Error.
 */
router.delete("/todos/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const todo = await Todo.findOneAndDelete({ _id, owner: req.user._id });

    if (!todo) {
      res.status(400).send();
    }

    res.send(todo);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
