const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const rateLimit = require("express-rate-limit");
const useragent = require("express-useragent");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
require("dotenv").config();
const path = require('path');
const redis = require('redis');
const redisCache = require('express-redis-cache');
const Url = require("./public/models/shorturl");
const Analytics = require("./public/models/analytics");
const User = require("./public/models/user");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

const redisClient = redis.createClient();
const cache = redisCache({
  client: redisClient,
  expire: 60 * 60,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));app.set('views', path.join(__dirname, './public/views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

app.use(
  session({
    secret: "U29tZVJhbmRvbUJhc2U2NENvZGU",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: "166960059433-gg8th3d1didk2qvgk10ifg4r1oe87sf2.apps.googleusercontent.com ",
      clientSecret: "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",
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            imageUrl: profile.photos[0].value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false,
});
app.use(limiter);

app.get("/", cache.route(), async (req, res) => {
  try {
    const urlLists = req.isAuthenticated() ? await Url.find({ userId: req.user._id }) : [];
    res.render("index", { shorturls: urlLists, user: req.user });
  } catch (error) {
    console.error("error fetching URLs:", error);
    res.status(500).send("server error");
  }
});

app.get("/profile", (req, res) => {
  if (!req.user) return res.redirect("/auth/google");
  res.render("profile", { user: req.user });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/profile")
);

app.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("cant log out");
    res.redirect("/");
  });
});

app.get("/:shortUrl", cache.route(), async (req, res) => {
  try {
    const url = await Url.findOne({ short: req.params.shortUrl });
    if (!url) return res.status(404).send("URL not found");

    const analyticsData = {
      shortUrl: req.params.shortUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      os: req.get("User-Agent").includes("Windows") ? "Windows" : req.get("User-Agent").includes("Mac") ? "MacOS" : "Other",
      device: req.get("User-Agent").includes("Mobile") ? "Mobile" : "Desktop",
      location: {}
    };

    await Analytics.create(analyticsData);

    url.clicks += 1;
    await url.save();
    res.redirect(url.full);
  } catch (err) {
    console.error("redirect err:", err);
    res.status(500).send("server err");
  }
});

app.get("/api/analytics/:shortUrl", cache.route(), async (req, res) => {
  try {
    const analytics = await Analytics.find({ shortUrl: req.params.shortUrl });

    const osTypes = [...new Set(analytics.map(a => a.os))].filter(Boolean);
    const deviceTypes = [...new Set(analytics.map(a => a.device))].filter(Boolean);

    res.json({
      totalClicks: analytics.length,
      uniqueUsers: new Set(analytics.map(a => a.ip)).size,
      osType: osTypes.length ? osTypes : ["No Data"],
      deviceType: deviceTypes.length ? deviceTypes : ["No Data"],
      analytics
    });
  } catch (err) {
    console.error("cant fetch analytics:", err);
    res.status(500).json({ error: "cant load analytics" });
  }
});

app.post("/api/shorten", async (req, res) => {
  const { longUrl, customAlias, topic } = req.body;
  if (!longUrl) return res.status(400).json({ error: "longUrl is required" });

  let shortUrl = customAlias && customAlias.trim() ? customAlias : shortid.generate();

  if (customAlias) {
    const existingAlias = await Url.findOne({ short: customAlias });
    if (existingAlias) return res.status(400).json({ error: "Alias is already taken" });
  }

  const newUrl = await Url.create({ full: longUrl, short: shortUrl, topic, userId: req.user._id });
  res.json({ shortUrl: newUrl.short, createdAt: newUrl.createdAt });
});

app.delete("/api/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "invalid ID" });
  }

  try {
    const deletedUrl = await Url.findByIdAndDelete(id);
    if (!deletedUrl) return res.status(404).json({ error: "URL not found" });

    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    console.error("Error deleting URL:", error);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, async () => {
  try {
    await mongoose.connect("mongodb+srv://madhavnair700:devatheking7@echorelay.jaedn.mongodb.net/", { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("connected to Mongodb");
  } catch (error) {
    console.error("mongodb connection error:", error);
    process.exit(1);
  }
  console.log(`server is runnin on http://localhost:${PORT}`);
});
