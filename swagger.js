const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Todo-nodejs API Documentation",
    version: "1.0.0",
    description: "Todo-nodejs API",
    contact: {
      email: "rahulrajdahal@gmail.com",
      name: "Rahul Raj Dahal",
      website: "rahulrajdahal.vercel.app",
    },
  },
  tags: [
    { name: "User", description: "User Apis" },
    { name: "Todo", description: "Todo Apis" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      "Register User": {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the user." },
          email: { type: "string", description: "Email of the user." },
          password: {
            type: "string",
            description: "Password for the user account.",
          },
        },
        required: ["name", "email", "password"],
      },
      "Login User": {
        type: "object",
        properties: {
          email: { type: "string", description: "Email of the user." },
          password: {
            type: "string",
            description: "Password for the user account.",
          },
        },
        required: ["email", "password"],
      },
      "Update User": {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the user." },
          email: { type: "string", description: "Email of the user." },
          password: {
            type: "string",
            description: "Password for the user account.",
          },
        },
      },
      "Upload Avatar": {
        type: "object",
        properties: {
          avatar: {
            type: "string",
            format: "binary",
            description: "The user profile photo.",
          },
        },
        required: ["avatar"],
      },
      "POST Todo": {
        type: "object",
        properties: {
          description: { type: "string", description: "Title for the todo" },
          completed: {
            type: "boolean",
            description: "State handler for the todo.",
          },
        },
        required: ["title"],
      },
      "Update Todo": {
        type: "object",
        properties: {
          description: { type: "string", description: "Title for the todo" },
          completed: {
            type: "boolean",
            description: "State handler for the todo.",
          },
        },
      },
    },
  },
};

const options = {
  explorer: true,
  swaggerDefinition,
  apis: [`${__dirname}/src/routers/*.js`], // Path to the API routes in your Node.js application
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
