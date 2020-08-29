const AWS = require("aws-sdk");
const sqs = new AWS.SQS({
  region: process.env.region,
});

const DEVIVERY_COMPANY_QUEUE = process.env.deliveryCompanyQueue;

module.exports.deliveryOrder = (orderFullfilled) => {};
