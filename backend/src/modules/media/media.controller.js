const mediaService = require("./media.service");

async function list(request, response, next) {
  try {
    const media = await mediaService.listMedia();
    response.json({
      media,
    });
  } catch (error) {
    next(error);
  }
}

async function create(request, response, next) {
  try {
    const item = await mediaService.createMedia({
      file: request.file,
      payload: request.body,
    });

    response.status(201).json({
      item,
    });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const item = await mediaService.updateMedia(request.params.id, request.body);
    response.json({
      item,
    });
  } catch (error) {
    next(error);
  }
}

async function remove(request, response, next) {
  try {
    await mediaService.deleteMedia(request.params.id);

    response.json({
      message: "Mídia removida com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
