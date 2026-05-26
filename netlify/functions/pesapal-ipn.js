exports.handler = async (event) => {
  console.log("PesaPal IPN:", event.queryStringParameters || event.body);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "PesaPal IPN received"
    })
  };
};
