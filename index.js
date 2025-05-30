import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

import lineWebhookRoutes from "./routes/lineWebhook.js";
import testEndpoints from "./routes/testEndpoints.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Mount routes
app.use("/webhook", lineWebhookRoutes);
app.use("/test", testEndpoints);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
