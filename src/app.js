const express = require("express");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("../swagger");

require("./db/mongoose");
const userRouter = require("./routers/user");
const todoRouter = require("./routers/todo");

const app = express();

app.use(express.json());

app.use("/api/v1/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use(userRouter);
app.use(todoRouter);

module.exports = app;
