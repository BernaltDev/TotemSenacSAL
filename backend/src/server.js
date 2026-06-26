const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`Totem Escolar rodando em ${env.publicBaseUrl}`);
});
