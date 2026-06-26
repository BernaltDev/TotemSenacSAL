const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const schedulesRoutes = require("./modules/schedules/schedules.routes");
const contentRoutes = require("./modules/content/content.routes");
const mediaRoutes = require("./modules/media/media.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const keyPickupRoutes = require("./modules/keyPickup/keyPickup.routes");
const totemRoutes = require("./modules/totem/totem.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

const frontendPath = path.resolve(__dirname, "../../frontend/public");
const uploadsPath = path.resolve(__dirname, "../uploads");

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(uploadsPath));
app.use(express.static(frontendPath));

app.use("/api/auth", authRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/key-pickup", keyPickupRoutes);
app.use("/api/totem", totemRoutes);

app.get("/", (request, response) => {
  response.sendFile(path.join(frontendPath, "index.html"));
});

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
