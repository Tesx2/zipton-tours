exports.handler = async (event) => {
  console.log("M-Pesa callback:", event.body);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ResultCode: 0,
      ResultDesc: "Accepted"
    })
  };
};
