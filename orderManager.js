"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const { EVENT_TYPES } = require("./enums");

const dynamo = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();

const TABLE_NAME = process.env.orderTableName;
const STREAM_NAME = process.env.orderStreamName;

module.exports.createOrder = (body) => {
  const order = {
    orderId: uuidv4(),
    name: body.name,
    address: body.address,
    productId: body.productId,
    quantity: body.quantity,
    orderDate: Date.now(),
    eventType: EVENT_TYPES.ORDER_PLACED,
  };
  return order;
};

module.exports.placeNewOrder = async (order) => {
  //save order in table
  await saveNewOrder(order);
  // place order in stream
  await placeOrderInStream(order);
};

module.exports.getOrder = async (order) => {
  // get order
  return await getOrder(order);
};

module.exports.fullfillOrder = async (order) => {
  // update order in table
  await updateOrder(order);

  // place order in stream
  await placeOrderInStream(order);
};

const saveNewOrder = async (order) => {
  const params = {
    TableName: TABLE_NAME,
    Item: order,
  };

  await dynamo.put(params).promise();
};

const getOrder = async (order) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { orderId: order.orderId },
  };

  const found = await dynamo.get(params).promise();
  return found.Item;
};

const updateOrder = async (order) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { orderId: order.orderId },
    UpdateExpression:
      "set fullfillmentId =:s, fullfillmentDate=:t, eventType=:e",
    ExpressionAttributeValues: {
      ":s": order.fullfillmentId,
      ":t": order.fullfillmentDate,
      ":e": EVENT_TYPES.ORDER_FULLFILLED,
    },
    ReturnValues: "UPDATED_NEW",
  };

  return await dynamo.update(params).promise();
};

const placeOrderInStream = async (order) => {
  console.log("placeOrderInStream", order);
  const params = {
    Data: JSON.stringify(order),
    PartitionKey: order.orderId,
    StreamName: STREAM_NAME,
  };

  return await kinesis.putRecord(params).promise();
};
