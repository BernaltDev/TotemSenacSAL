const contentService = require("./content.service");

async function list(request, response, next) {
  try {
    const items = await contentService.listContent(request.params.type);
    response.json({
      items,
    });
  } catch (error) {
    next(error);
  }
}

async function create(request, response, next) {
  try {
    const item = await contentService.createContent(request.params.type, request.body);
    response.status(201).json({
      item,
    });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const item = await contentService.updateContent(
      request.params.type,
      request.params.id,
      request.body
    );

    response.json({
      item,
    });
  } catch (error) {
    next(error);
  }
}

async function remove(request, response, next) {
  try {
    await contentService.deleteContent(request.params.type, request.params.id);
    response.json({
      message: "Conteúdo removido com sucesso.",
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
