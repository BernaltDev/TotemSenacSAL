const { readDatabase } = require("../database/storage");

async function authMiddleware(request, response, next) {
  try {
    const header = request.headers.authorization || "";
    const token = header.replace("Bearer ", "").trim();

    if (!token) {
      return response.status(401).json({
        message: "Token de autenticação não informado.",
      });
    }

    const database = await readDatabase();
    const session = database.sessions.find((item) => item.token === token);

    if (!session) {
      return response.status(401).json({
        message: "Sessão inválida ou expirada.",
      });
    }

    const user = database.users.find((item) => item.id === session.userId && item.isActive);

    if (!user) {
      return response.status(401).json({
        message: "Usuário não encontrado ou inativo.",
      });
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authMiddleware,
};
