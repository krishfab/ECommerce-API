// Import the Vendia serverless-express adapter to run Express inside AWS Lambda
const serverlessExpress = require('@codegenie/serverless-express');

// Import the Express app from index.js (destructured from the exported object)
const { app } = require('./index');

// Exporting handler connects AWS API Gateway to your Express app.
// “Hey API Gateway — when someone makes a request, run this Express app to handle it.”
exports.handler = serverlessExpress({ app });