const authService = require("./auth.service");

async function login(request, response, next) {
  try {
    const result = await authService.login(request.body);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

async function logout(request, response, next) {
  try {
    const token = (request.headers.authorization || "").replace("Bearer ", "").trim();
    await authService.logout(token);

    response.json({
      message: "Logout realizado com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

async function me(request, response) {
  response.json({
    user: request.user,
  });
}

module.exports = {
  login,
  logout,
  me,
};
