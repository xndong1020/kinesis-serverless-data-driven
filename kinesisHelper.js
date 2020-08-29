const parsePayload = (record) => {
  const jsonStr = new Buffer(record.kinesis.data, "base64").toString("utf8");
  return JSON.parse(jsonStr);
};

const getRecords = (event) => {
  return event.Records.map(parsePayload);
};

module.exports = {
  parsePayload,
  getRecords,
};
