import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";
import qs from "qs";
import axios from "axios";
import crypto from "crypto";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // replace with env var in production

// Helper: generate a dummy refresh token (for demo only)
function generateRefreshToken() {
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
}
// Helper: generate random state string for LINE login
function generateState() {
  return Math.random().toString(36).substring(2, 15);
}
const redirect_uri = process.env.LINE_REDIRECT_URI;
const client_id = process.env.LINE_CHANNEL_ID_Login;
const client_secret = process.env.LINE_CHANNEL_SECRET_Login;
const frontendURL = process.env.FRONTEND_URL;
router.get("/line/auth", async (req, res) => {
  const { state, frontend_callback } = req.query;
  if (!state) {
    return res.status(400).send("Missing state");
  }

  // Save to DB with frontend callback
  await prisma.oAuthState.create({
    data: {
      state,
      frontendCallback: `${frontendURL}/auth/line-callback`,
    },
  });

  const redirectUri = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&scope=profile%20openid%20email`;
  console.log("redirectUri", redirectUri);
  res.redirect(redirectUri);
});

router.get("/verify-token", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.uid) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      uid: user.id.toString(),
      email: user.email,
      providerData: [
        {
          providerId: user.provider || "line",
          displayName: user.name,
          email: user.email,
          photoURL: user.avatar,
        },
      ],
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Signup route
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User created", uid: user.id.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { uid: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = generateRefreshToken();

    // Compose the response as you wanted
    const response = {
      uid: user.id.toString(),
      email: user.email,
      emailVerified: false,
      isAnonymous: false,
      providerData: [
        {
          providerId: "password",
          uid: user.email,
          displayName: null,
          email: user.email,
          phoneNumber: null,
          photoURL: null,
        },
      ],
      stsTokenManager: {
        refreshToken,
        accessToken,
        expirationTime: Date.now() + 3600 * 1000, // current time + 1 hour in ms
      },
      createdAt: user.createdAt.getTime().toString(),
      lastLoginAt: Date.now().toString(),
      apiKey: process.env.API_KEY || "YourAPIKeyHere",
      appName: "[DEFAULT]",
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
router.get("/line/callback", async (req, res) => {
  const { code, state } = req.query;
  console.log("Received code:", code);
  console.log("Received state:", state);

  if (!state || !code) {
    return res.status(400).send("Missing state or code");
  }

  try {
    const storedState = await prisma.oAuthState.findUnique({
      where: { state },
    });
    console.log("Session state:", storedState);
    if (!storedState) {
      return res.status(400).send("Invalid state.");
    }

    // Delete the state to prevent reuse
    await prisma.oAuthState.delete({
      where: { state },
    });

    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://api.line.me/oauth2/v2.1/token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI,
        client_id: process.env.LINE_CHANNEL_ID_Login,
        client_secret: process.env.LINE_CHANNEL_SECRET_Login,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, id_token } = tokenRes.data;
    const decoded = jwt.decode(id_token);

    // Get additional profile info
    const profileRes = await axios.get("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { userId, displayName, pictureUrl } = profileRes.data;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ providerId: userId }, { email: decoded.email || "" }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: decoded.email || `${userId}@line.user`,
          name: displayName,
          provider: "line",
          providerId: userId,
          avatar: pictureUrl,
          password: "",
        },
      });
    } else {
      // Update user info in case it changed (e.g., displayName or pictureUrl)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: displayName,
          avatar: pictureUrl,
        },
      });
    }
    // Generate JWT access token
    const accessTokenJWT = jwt.sign(
      { uid: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate a dummy refresh token (or implement proper refresh token logic)
    const refreshToken = generateRefreshToken();
    console.log("user", user);
    // Prepare full login-like response
    const response = {
      uid: user.id.toString(),
      email: user.email,

      emailVerified: false,
      isAnonymous: false,
      providerData: [
        {
          providerId: "line",
          uid: user.providerId,
          displayName: user.name,
          email: user.email,
          phoneNumber: null,
          photoURL: user.avatar,
        },
      ],
      stsTokenManager: {
        refreshToken,
        accessToken: accessTokenJWT,
        expirationTime: Date.now() + 3600 * 1000, // 1 hour from now
      },
      createdAt: user.createdAt ? user.createdAt.getTime().toString() : null,
      lastLoginAt: Date.now().toString(),
      apiKey: process.env.API_KEY || "YourAPIKeyHere",
      appName: "[DEFAULT]",
    };
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Encode the tokens as query parameters
    const redirectUrl =
      `${frontendUrl}/auth/line-callback?` +
      `accessToken=${encodeURIComponent(
        response.stsTokenManager.accessToken
      )}&` +
      `refreshToken=${encodeURIComponent(
        response.stsTokenManager.refreshToken
      )}&` +
      `uid=${encodeURIComponent(response.uid)}`;

    res.redirect(redirectUrl);

    // res.json(response);
  } catch (err) {
    if (err.response) {
      console.error("LINE Token Error Response:", err.response.data);
    }
    console.error("LINE login error:", err);
    res.status(500).json({ error: "LINE login failed" });
  }
});

export default router;
