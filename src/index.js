import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

import session from "express-session";
import lineWebhookRoutes from "./routes/lineWebhook.js";
import testEndpoints from "./routes/testEndpoints.js";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/category.js";
import qnaRoutes from "./routes/qna.js";
import documentRoutes from "./routes/document.js";
import agentsRoutes from "./routes/agent.js";
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // If using HTTPS, set to true
      httpOnly: true,
      sameSite: "lax", // Important for OAuth redirects, may need "none" + secure:true on HTTPS
    },
  })
);
app.set("trust proxy", 1);
// Mount routes
app.use("/", authRoutes);
app.use("/category", categoryRoutes);
app.use("/webhook", lineWebhookRoutes);
app.use("/test", testEndpoints);
app.use("/qna", qnaRoutes);
app.use("/documents", documentRoutes);
app.use("/agents", agentsRoutes);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
