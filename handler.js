"use strict";

const orderManager = require("./orderManager");
const { EVENT_TYPES } = require("./enums");
const { getRecords } = require("./kinesisHelper");

const createResponse = (statusCode, message) => {
  const response = {
    statusCode,
    body: JSON.stringify(message),
  };
  return response;
};

module.exports.createOrder = async (event) => {
  const body = JSON.parse(event.body);

  const order = orderManager.createOrder(body);
  try {
    await orderManager.placeNewOrder(order);
    return createResponse(200, order);
  } catch (error) {
    return createResponse(400, error);
  }
};

module.exports.fullfillOrder = async (event) => {
  const body = JSON.parse(event.body);

  const order = await orderManager.getOrder(body);
  if (!order) return createResponse(404, undefined);
  try {
    const orderFullfilled = {
      ...order,
      fullfillmentId: body.fullfillmentId,
      fullfillmentDate: body.fullfillmentDate,
      eventType: EVENT_TYPES.ORDER_FULLFILLED,
    };
    await orderManager.fullfillOrder(orderFullfilled);
    return createResponse(200, orderFullfilled);
  } catch (error) {
    return createResponse(400, error);
  }
};

module.exports.notifyProducer = async (event) => {
  const records = getRecords(event);
  console.log("records", records);
  const ordersPlaced = records.filter(
    (r) => r.eventType === EVENT_TYPES.ORDER_PLACED
  );
  console.log("ordersPlaced", ordersPlaced);
  return createResponse(200, ordersPlaced);
};
