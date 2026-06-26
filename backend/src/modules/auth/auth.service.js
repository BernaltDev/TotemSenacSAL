const crypto = require("crypto");
const { readDatabase, updateDatabase } = require("../../database/storage");

async function login({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    const error = new Error("Informe e-mail e senha.");
    error.statusCode = 400;
    throw error;
  }

  const database = await readDatabase();
  const user = database.users.find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.isActive
  );

  if (!user || user.password !== password) {
    const error = new Error("E-mail ou senha inválidos.");
    error.statusCode = 401;
    throw error;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  };

  await updateDatabase((currentDatabase) => {
    currentDatabase.sessions = currentDatabase.sessions.filter(
      (item) => item.userId !== user.id
    );
    currentDatabase.sessions.push(session);
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function logout(token) {
  await updateDatabase((database) => {
    database.sessions = database.sessions.filter((item) => item.token !== token);
  });
}

module.exports = {
  login,
  logout,
};
