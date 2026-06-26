function notFoundHandler(request, response, next) {
  response.status(404).json({
    message: "Recurso não encontrado.",
  });
}

function errorHandler(error, request, response, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;

  response.status(statusCode).json({
    message: error.message || "Erro interno do servidor.",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
