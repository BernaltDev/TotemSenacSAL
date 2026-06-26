const { registerClient } = require("../../utils/totemEvents");
const totemService = require("./totem.service");

async function getData(request, response, next) {
  try {
    const data = await totemService.getTotemData(request.query);
    response.json(data);
  } catch (error) {
    next(error);
  }
}

function stream(request, response) {
  registerClient(response);
}

module.exports = {
  getData,
  stream,
};
