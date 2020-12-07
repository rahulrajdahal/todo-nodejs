const express = require("express");

const auth = require("../middleware/auth");
const { update } = require("../models/todo");
const Todo = require("../models/todo");

const router = new express.Router();

// Get all Todos
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

// Create a Todo
router.post("/todos", auth, async (req, res) => {
  const todo = new Todo({ ...req.body, owner: req.user._id });

  try {
    await todo.save();
    res.status(201).send(todo);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get Todo by Id
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

// Update Todo
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

module.exports = router;
