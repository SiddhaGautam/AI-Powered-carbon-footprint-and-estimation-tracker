require("dotenv").config()

const OpenAI = require("openai")
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const nodemailer = require("nodemailer")
const cron = require("node-cron")

const { getUser, setUser } = require("./src/controllers/auth.js")

const User = require("./src/models/db_schema")
const Log = require("./src/models/logs_schema.js")
const Goal = require("./src/models/goals_schema")
const Notification = require(
  "./src/models/notification_schema"
)

const app = express()

/*Nodemailer */
const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS,
  },
})

async function sendWeeklyReports() {

  try {

    const users = await User.find()

    for (const user of users) {

      const logs = await Log.find({
        userEmail: user.email,
      })

      if (logs.length === 0) continue

      const total = logs.reduce(
        (sum, log) =>
          sum + Number(log.kgCO2 || 0),
        0
      )

      const avg =
        total / logs.length

      let sustainability = "Good"

      if (avg > 10) {
        sustainability = "Needs Improvement"
      }

      if (avg < 5) {
        sustainability = "Excellent"
      }

      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: user.email,

        subject:
          "🌱 Weekly Sustainability Report",

        html: `

          <div style="
            font-family: Arial;
            padding: 20px;
          ">

            <h2 style="color:#2e7d32;">
              Weekly Sustainability Report
            </h2>

            <p>
              Total emission this week:
              <b>${total.toFixed(2)} kg CO₂</b>
            </p>

            <p>
              Average activity emission:
              <b>${avg.toFixed(2)} kg CO₂</b>
            </p>

            <p>
              Sustainability rating:
              <b>${sustainability}</b>
            </p>

            <p>
              Keep tracking your activities
              to improve your environmental impact.
            </p>

            <hr />

            <p style="color:gray;">
              Carbon/Index AI Sustainability Coach
            </p>

          </div>
        `,
      })

      console.log(
        "Weekly report sent to:",
        user.email
      )
    }

  } catch (err) {

    console.log(
      "Weekly report error:",
      err.message
    )
  }
}
cron.schedule("0 9 * * 1", () => {

  console.log(
    "Running weekly sustainability reports..."
  )

  sendWeeklyReports()
})

/* ─────────────────────────────────────────────
   NVIDIA NIM AI CLIENT
───────────────────────────────────────────── */

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
})

/* ─────────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────────── */

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
)

/* ─────────────────────────────────────────────
   DATABASE CONNECTION
───────────────────────────────────────────── */

mongoose
  .connect("mongodb://127.0.0.1:27017/gautam_db")
  .then(() => {
    console.log("MongoDB connected successfully")
  })
  .catch((err) => {
    console.error(
      "Database connection failed:",
      err.message
    )
  })

/* ─────────────────────────────────────────────
   HOME ROUTE
───────────────────────────────────────────── */

app.get("/", (req, res) => {
  res.send("Carbon/Index API running")
})

/* ─────────────────────────────────────────────
   SIGNUP
───────────────────────────────────────────── */

app.post("/signup", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
    } = req.body

    const existing = await User.findOne({
      email,
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      })
    }

    const newUser = await User.create({
      first_name,
      last_name,
      email,
      password,
    })

    const token = setUser(newUser)

    res.cookie("user", token, {
      httpOnly: true,
    })

    res.status(201).json({
      success: true,
      message: "User created successfully",

      user: {
        email: newUser.email,
        name: newUser.first_name,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    })
  } catch (err) {
    console.error("Signup error:", err.message)

    res.status(500).json({
      success: false,
      message: "Signup failed",
      error: err.message,
    })
  }
})

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({
      email,
    })

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message:
          "No account found with this email",
      })
    }

    if (
      existingUser.password !== password
    ) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      })
    }

    const token = setUser(existingUser)

    res.cookie("user", token, {
      httpOnly: true,
    })

    res.status(200).json({
      success: true,
      message: "Logged in successfully",

      user: {
        email: existingUser.email,
        name: existingUser.first_name,
        first_name:
          existingUser.first_name,
        last_name:
          existingUser.last_name,
      },
    })
  } catch (err) {
    console.error("Login error:", err.message)

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    })
  }
})

/* ─────────────────────────────────────────────
   SAVE LOG
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   SAVE LOG + SMART ALERTS + EMAILS
───────────────────────────────────────────── */

app.post("/api/logs", async (req, res) => {

  try {

    const {
      userEmail,
      category,
      activity,
      amount,
      unit,
      factor,
      kgCO2,
      note,
      date,
    } = req.body

    /* ─────────────────────────────
       SAVE LOG
    ───────────────────────────── */

    const newLog = await Log.create({

      userEmail,
      category,
      activity,
      amount,
      unit,
      factor,
      kgCO2,
      note,
      date,
    })

    /* ─────────────────────────────
       FETCH USER GOALS
    ───────────────────────────── */

    let goal = await Goal.findOne({
      userEmail,
    })

    if (!goal) {

      goal = {
        dailyGoal: 12,
        weeklyGoal: 80,
        monthlyGoal: 320,
      }
    }

    /* ─────────────────────────────
       FETCH USER LOGS
    ───────────────────────────── */

    const userLogs = await Log.find({
      userEmail,
    })

    /* ─────────────────────────────
       DATE HELPERS
    ───────────────────────────── */

    const today = new Date()

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )

    const weekAgo = new Date(todayStart)
    weekAgo.setDate(todayStart.getDate() - 6)

    const monthAgo = new Date(todayStart)
    monthAgo.setDate(todayStart.getDate() - 29)

    /* ─────────────────────────────
       TOTALS
    ───────────────────────────── */

    const todayEmission = userLogs
      .filter(
        (log) =>
          new Date(log.date) >= todayStart
      )
      .reduce(
        (sum, log) =>
          sum + Number(log.kgCO2 || 0),
        0
      )

    const weeklyEmission = userLogs
      .filter(
        (log) =>
          new Date(log.date) >= weekAgo
      )
      .reduce(
        (sum, log) =>
          sum + Number(log.kgCO2 || 0),
        0
      )

    const monthlyEmission = userLogs
      .filter(
        (log) =>
          new Date(log.date) >= monthAgo
      )
      .reduce(
        (sum, log) =>
          sum + Number(log.kgCO2 || 0),
        0
      )

    /* ─────────────────────────────
       HIGH EMISSION ALERT
    ───────────────────────────── */

    if (Number(kgCO2) > 15) {

      await Notification.create({

        userEmail,

        title: "High Emission Activity",

        message:
          `${activity} generated ${kgCO2} kg CO₂.`,

        type: "warning",
      })

      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: userEmail,

        subject:
          "⚠ High Carbon Emission Alert",

        html: `

          <div style="
            font-family: Arial;
            padding: 20px;
          ">

            <h2 style="color:#c0392b;">
              High Emission Activity Detected
            </h2>

            <p>
              Your activity
              <b>${activity}</b>
              generated
              <b>${kgCO2} kg CO₂</b>.
            </p>

            <p>
              Category:
              <b>${category}</b>
            </p>

            <p>
              Consider lower-emission alternatives
              to reduce your footprint.
            </p>

            <hr />

            <p style="color:gray;">
              Carbon/Index AI Sustainability Coach
            </p>

          </div>
        `,
      })
    }

    /* ─────────────────────────────
       DAILY GOAL EXCEEDED
    ───────────────────────────── */

    if (
      todayEmission > goal.dailyGoal
    ) {

      await Notification.create({

        userEmail,

        title: "Daily Goal Exceeded",

        message:
          `You exceeded your daily goal (${goal.dailyGoal} kg). Current: ${todayEmission.toFixed(2)} kg.`,

        type: "danger",
      })

      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: userEmail,

        subject:
          "🚨 Daily Carbon Goal Exceeded",

        html: `

          <div style="
            font-family: Arial;
            padding: 20px;
          ">

            <h2 style="color:#e74c3c;">
              Daily Goal Exceeded
            </h2>

            <p>
              Your total emission today is
              <b>${todayEmission.toFixed(2)} kg CO₂</b>.
            </p>

            <p>
              Your configured daily goal is
              <b>${goal.dailyGoal} kg CO₂</b>.
            </p>

            <p>
              Try reducing transportation and
              energy-heavy activities tomorrow.
            </p>

            <hr />

            <p style="color:gray;">
              Carbon/Index Sustainability System
            </p>

          </div>
        `,
      })
    }

    /* ─────────────────────────────
       WEEKLY GOAL EXCEEDED
    ───────────────────────────── */

    if (
      weeklyEmission > goal.weeklyGoal
    ) {

      await Notification.create({

        userEmail,

        title: "Weekly Goal Exceeded",

        message:
          `You exceeded your weekly goal (${goal.weeklyGoal} kg). Current: ${weeklyEmission.toFixed(2)} kg.`,

        type: "danger",
      })

      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: userEmail,

        subject:
          "🚨 Weekly Carbon Goal Exceeded",

        html: `

          <div style="
            font-family: Arial;
            padding: 20px;
          ">

            <h2 style="color:#d35400;">
              Weekly Goal Exceeded
            </h2>

            <p>
              Your weekly emission reached
              <b>${weeklyEmission.toFixed(2)} kg CO₂</b>.
            </p>

            <p>
              Weekly target:
              <b>${goal.weeklyGoal} kg CO₂</b>.
            </p>

            <p>
              Consider reducing high-emission
              transport and food activities.
            </p>

            <hr />

            <p style="color:gray;">
              Carbon/Index Sustainability System
            </p>

          </div>
        `,
      })
    }

    /* ─────────────────────────────
       MONTHLY GOAL EXCEEDED
    ───────────────────────────── */

    if (
      monthlyEmission > goal.monthlyGoal
    ) {

      await Notification.create({

        userEmail,

        title: "Monthly Goal Exceeded",

        message:
          `You exceeded your monthly goal (${goal.monthlyGoal} kg). Current: ${monthlyEmission.toFixed(2)} kg.`,

        type: "danger",
      })

      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: userEmail,

        subject:
          "🚨 Monthly Carbon Goal Exceeded",

        html: `

          <div style="
            font-family: Arial;
            padding: 20px;
          ">

            <h2 style="color:#8e44ad;">
              Monthly Goal Exceeded
            </h2>

            <p>
              Your monthly emission reached
              <b>${monthlyEmission.toFixed(2)} kg CO₂</b>.
            </p>

            <p>
              Monthly target:
              <b>${goal.monthlyGoal} kg CO₂</b>.
            </p>

            <p>
              Long-term emission trends are increasing.
              Consider improving sustainability habits.
            </p>

            <hr />

            <p style="color:gray;">
              Carbon/Index Sustainability System
            </p>

          </div>
        `,
      })
    }

    /* ─────────────────────────────
       SUCCESS RESPONSE
    ───────────────────────────── */

    res.status(201).json({

      success: true,

      message: "Log saved successfully",

      log: newLog,

      totals: {

        todayEmission,
        weeklyEmission,
        monthlyEmission,
      },
    })

  } catch (err) {

    console.error(
      "Save log error:",
      err.message
    )

    res.status(500).json({

      success: false,

      message: "Failed to save log",

      error: err.message,
    })
  }
})

/* ─────────────────────────────────────────────
   GET USER LOGS
───────────────────────────────────────────── */

app.get(
  "/api/logs/:email",
  async (req, res) => {
    try {
      console.log(
        "Fetching logs for:",
        req.params.email
      )

      const logs = await Log.find({
        userEmail: req.params.email,
      }).sort({ createdAt: -1 })

      console.log(
        "Logs found:",
        logs.length
      )

      res.status(200).json({
        success: true,
        logs,
      })
    } catch (err) {
      console.error(
        "Fetch logs error:",
        err.message
      )

      res.status(500).json({
        success: false,
        message: "Failed to fetch logs",
        error: err.message,
      })
    }
  }
)

/*NOTIFICATION ROUTES*/

app.post("/api/notifications", async (req, res) => {

  try {

    const {
      userEmail,
      title,
      message,
      type,
    } = req.body

    const notification =
      await Notification.create({
        userEmail,
        title,
        message,
        type,
      })

    res.status(201).json({
      success: true,
      notification,
    })

  } catch (err) {

    console.log(err)

    res.status(500).json({
      success: false,
    })
  }
})

app.get("/api/notifications/:email", async (req, res) => {

  try {

    const notifications =
      await Notification.find({
        userEmail: req.params.email,
      }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      notifications,
    })

  } catch (err) {

    console.log(err)

    res.status(500).json({
      success: false,
    })
  }
})

app.put("/api/notifications/read/:id", async (req, res) => {

  try {

    await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
      }
    )

    res.status(200).json({
      success: true,
    })

  } catch (err) {

    console.log(err)

    res.status(500).json({
      success: false,
    })
  }
})
/* ─────────────────────────────────────────────
   GET USER GOALS
───────────────────────────────────────────── */

app.get(
  "/api/goals/:email",
  async (req, res) => {
    try {
      let goal = await Goal.findOne({
        userEmail: req.params.email,
      })

      if (!goal) {
        goal = {
          dailyGoal: 12,
          weeklyGoal: 80,
          monthlyGoal: 320,
        }
      }

      res.status(200).json({
        success: true,
        goal,
      })
    } catch (err) {
      console.log(err)

      res.status(500).json({
        success: false,
        message: "Failed to fetch goals",
      })
    }
  }
)

/* ─────────────────────────────────────────────
   SAVE / UPDATE GOALS
───────────────────────────────────────────── */

app.post("/api/goals", async (req, res) => {
  try {
    const {
      userEmail,
      dailyGoal,
      weeklyGoal,
      monthlyGoal,
    } = req.body

    let goal = await Goal.findOne({
      userEmail,
    })

    if (goal) {
      goal.dailyGoal = dailyGoal
      goal.weeklyGoal = weeklyGoal
      goal.monthlyGoal = monthlyGoal

      await goal.save()
    } else {
      goal = await Goal.create({
        userEmail,
        dailyGoal,
        weeklyGoal,
        monthlyGoal,
      })
    }

    res.status(200).json({
      success: true,
      goal,
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: "Failed to save goals",
    })
  }
})

/* ─────────────────────────────────────────────
   AI INSIGHTS API
───────────────────────────────────────────── */

app.post(
  "/api/ai-insights",
  async (req, res) => {
    try {
      const { logs, period } = req.body

      if (
        !logs ||
        logs.length === 0
      ) {
        return res.status(200).json({
          success: true,
          summary:
            "No activity logs available yet.",
          score: 100,
          trend: "stable",
          tips: [],
          alerts: [],
          topCategory: "NONE",
          totalEmission: 0,
          avgEmission: 0,
        })
      }

      const totalEmission =
        logs.reduce(
          (sum, log) =>
            sum +
            Number(log.kgCO2 || 0),
          0
        )

      const avgEmission =
        totalEmission / logs.length

      const categoryTotals = {}

      logs.forEach((log) => {
        const category =
          log.category || "OTHER"

        if (
          !categoryTotals[category]
        ) {
          categoryTotals[category] = 0
        }

        categoryTotals[category] +=
          Number(log.kgCO2 || 0)
      })

      const sortedCategories =
        Object.entries(
          categoryTotals
        ).sort((a, b) => b[1] - a[1])

      const topCategory =
        sortedCategories.length > 0
          ? sortedCategories[0][0]
          : "NONE"

      const highestLog =
        logs.reduce((prev, current) => {
          return Number(
            prev.kgCO2 || 0
          ) >
            Number(
              current.kgCO2 || 0
            )
            ? prev
            : current
        })

      let score = 100

      score -= totalEmission * 1.5

      if (avgEmission > 10) {
        score -= 15
      }

      if (
        topCategory === "TRANSPORT"
      ) {
        score -= 10
      }

      if (
        topCategory === "FOOD & DIET"
      ) {
        score -= 5
      }

      score = Math.max(
        0,
        Math.min(100, Math.round(score))
      )

      let trend = "stable"

      if (avgEmission < 4) {
        trend = "improving"
      }

      if (avgEmission > 10) {
        trend = "worsening"
      }

      const tips = []

      if (
        topCategory === "TRANSPORT"
      ) {
        tips.push({
          id: "01",
          text:
            "Reduce short-distance car trips by using walking or cycling.",
        })

        tips.push({
          id: "02",
          text:
            "Use public transport twice a week to lower fuel emissions.",
        })
      }

      if (
        topCategory === "FOOD & DIET"
      ) {
        tips.push({
          id: "03",
          text:
            "Reduce meat-heavy meals to improve your food carbon footprint.",
        })

        tips.push({
          id: "04",
          text:
            "Choose locally sourced food whenever possible.",
        })
      }

      if (avgEmission > 8) {
        tips.push({
          id: "05",
          text:
            "Your average emission is high. Monitor repeated high-emission activities.",
        })
      }

      if (tips.length === 0) {
        tips.push({
          id: "06",
          text:
            "Great job maintaining a balanced carbon footprint.",
        })
      }

      const alerts = []

      if (totalEmission >= 70) {
        alerts.push({
          level: "HIGH",
          text:
            "You are approaching your weekly emission threshold.",
        })
      }

      if (avgEmission >= 13) {
        alerts.push({
          level: "WARNING",
          text:
            "Your daily average exceeds global sustainable limits.",
        })
      }

      const summary =
        `You emitted ${totalEmission.toFixed(
          2
        )} kg CO₂ during ${period}. ` +
        `Your largest contributor is ${topCategory}. ` +
        `Your average emission is ${avgEmission.toFixed(
          2
        )} kg CO₂ per activity. ` +
        `Highest emission activity was "${highestLog.activity}".`

      res.status(200).json({
        success: true,
        summary,
        score,
        trend,
        tips,
        alerts,
        topCategory,
        totalEmission,
        avgEmission,
        highestActivity:
          highestLog.activity,
      })
    } catch (err) {
      console.error(
        "AI insights error:",
        err.message
      )

      res.status(500).json({
        success: false,
        message:
          "Failed to generate AI insights",
        error: err.message,
      })
    }
  }
)

/* ─────────────────────────────────────────────
   ANALYTICS AI INSIGHTS
───────────────────────────────────────────── */

app.post(
  "/api/analytics/insights",
  async (req, res) => {
    try {
      const {
        logs,
        totalEmission,
        avgDaily,
        topCategory,
        streak,
      } = req.body

      const prompt = `
You are an AI sustainability coach.

Analyze this user's carbon footprint data and generate:

1. A short sustainability summary
2. 5 personalized actionable tips
3. 1 motivational message

USER DATA:

Total emission: ${totalEmission} kg CO2
Average daily emission: ${avgDaily} kg CO2
Top emission category: ${topCategory}
Tracking streak: ${streak} days

Recent activities:
${logs
  .map(
    (log) =>
      `- ${log.activity} (${log.category}) : ${log.kgCO2} kg CO2`
  )
  .join("\n")}

Return response ONLY in JSON format:

{
  "summary": "...",
  "tips": [
    { "id": "01", "text": "..." }
  ],
  "motivation": "..."
}
`

      const completion =
        await client.chat.completions.create(
          {
            model:
              "mistralai/mixtral-8x7b-instruct-v0.1",

            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],

            temperature: 0.7,
            max_tokens: 700,
          }
        )

      const text =
        completion.choices[0].message
          .content

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()

      const insights =
        JSON.parse(cleaned)

      res.json({
        success: true,
        insights,
      })
    } catch (err) {
      console.log(err)

      res.status(500).json({
        success: false,
        error: err.message,
      })
    }
  }
)

/* ─────────────────────────────────────────────
   ANALYTICS SUMMARY API
───────────────────────────────────────────── */

app.get(
  "/api/analytics/:email",
  async (req, res) => {
    try {
      const logs = await Log.find({
        userEmail: req.params.email,
      })

      const dailyMap = {}

      logs.forEach((log) => {
        const day = new Date(log.date)
          .toISOString()
          .slice(0, 10)

        if (!dailyMap[day]) {
          dailyMap[day] = 0
        }

        dailyMap[day] += Number(
          log.kgCO2 || 0
        )
      })

      const dailyData =
        Object.entries(dailyMap).map(
          ([date, co2_kg]) => ({
            date,
            co2_kg: Number(
              co2_kg.toFixed(2)
            ),
          })
        )

      const categoryMap = {}

      logs.forEach((log) => {
        const category =
          log.category || "OTHER"

        if (!categoryMap[category]) {
          categoryMap[category] = 0
        }

        categoryMap[category] +=
          Number(log.kgCO2 || 0)
      })

      const colors = [
        "#557a52",
        "#c0392b",
        "#2980b9",
        "#8e44ad",
        "#d35400",
        "#16a085",
      ]

      const categoryData =
        Object.entries(
          categoryMap
        ).map(
          ([name, value], index) => ({
            name,
            value: Number(
              value.toFixed(2)
            ),
            color:
              colors[
                index % colors.length
              ],
          })
        )

      const weeklyMap = {}

      logs.forEach((log) => {
        const d = new Date(log.date)

        const firstDay = new Date(d)

        firstDay.setDate(
          d.getDate() - d.getDay()
        )

        const weekKey = firstDay
          .toISOString()
          .slice(0, 10)

        if (!weeklyMap[weekKey]) {
          weeklyMap[weekKey] = 0
        }

        weeklyMap[weekKey] += Number(
          log.kgCO2 || 0
        )
      })

      const weeklyData =
        Object.entries(weeklyMap).map(
          ([week, co2_kg]) => ({
            week,
            co2_kg: Number(
              co2_kg.toFixed(2)
            ),
          })
        )

      res.status(200).json({
        success: true,
        dailyData,
        weeklyData,
        categoryData,
        totalLogs: logs.length,
      })
    } catch (err) {
      console.error(
        "Analytics error:",
        err.message
      )

      res.status(500).json({
        success: false,
        message:
          "Failed to load analytics",
        error: err.message,
      })
    }
  }
)

/* ─────────────────────────────────────────────
   DELETE LOG
───────────────────────────────────────────── */

app.delete("/api/logs/:id", async (req, res) => {
  try {
    await Log.findByIdAndDelete(
      req.params.id
    )

    res.status(200).json({
      success: true,
      message:
        "Log deleted successfully",
    })
  } catch (err) {
    console.error(
      "Delete log error:",
      err.message
    )

    res.status(500).json({
      success: false,
      message: "Failed to delete log",
      error: err.message,
    })
  }
})

/* ─────────────────────────────────────────────
   UPDATE LOG
───────────────────────────────────────────── */

app.put("/api/logs/:id", async (req, res) => {
  try {
    const updatedLog =
      await Log.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )

    res.status(200).json({
      success: true,
      message:
        "Log updated successfully",
      log: updatedLog,
    })
  } catch (err) {
    console.error(
      "Update log error:",
      err.message
    )

    res.status(500).json({
      success: false,
      message: "Failed to update log",
      error: err.message,
    })
  }
})

/* ─────────────────────────────────────────────
   SERVER
───────────────────────────────────────────── */

app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  )
})