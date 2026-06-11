// AnalyticsPage.jsx — Carbon Tracker Premium Analytics Page

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

import "./Analytics.css"
import Navbar from "./Navbar"

axios.defaults.withCredentials = true

const COLORS = [
  "#5c8c5a",
  "#3b82f6",
  "#f97316",
  "#eab308",
  "#a855f7",
  "#d87c5a",
]

const DEFAULT_GOALS = {
  dailyGoal: 13,
  weeklyGoal: 91,
  monthlyGoal: 390,
}

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

function formatLocalDate(dateValue = new Date()) {
  if (!dateValue) return ""

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getAnalyticsDate(log) {
  return log.date || log.createdAt
}

function getLogTime(log) {
  const date = new Date(getAnalyticsDate(log))

  if (Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return "-"

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip__label">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          key={index}
          className="analytics-tooltip__row"
        >
          <span>{item.name || item.dataKey}</span>

          <strong>
            {Number(item.value || 0).toFixed(2)} kg CO₂e
          </strong>
        </div>
      ))}
    </div>
  )
}

function EmptyChartState() {
  return (
    <div className="analytics-empty-chart">
      Log activities to generate this chart.
    </div>
  )
}

export default function AnalyticsPage({
  user,
  onLogout,
  onNavChange,
}) {
  const [logs, setLogs] = useState([])
  const [goalData, setGoalData] = useState(DEFAULT_GOALS)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const [aiLoading, setAiLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  const [theme, setTheme] = useState("green")

  const dailyGoal = Number(goalData.dailyGoal || DEFAULT_GOALS.dailyGoal)

  /* ─────────────────────────────
     FETCH LOGS
  ───────────────────────────── */

  useEffect(() => {
    async function fetchLogs() {
      try {
        if (!user?.email) return

        setLoading(true)

        const response = await axios.get(
          `http://localhost:3000/api/logs/${encodeURIComponent(
            user.email
          )}`,
          {
            withCredentials: true,
          }
        )

        const fetchedLogs = response.data.logs || []

        setLogs(
          [...fetchedLogs].sort(
            (a, b) => getLogTime(b) - getLogTime(a)
          )
        )
      } catch (err) {
        console.log("Analytics fetch failed:", err)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [user?.email])

  /* ─────────────────────────────
     FETCH GOALS
  ───────────────────────────── */

  useEffect(() => {
    async function fetchGoals() {
      try {
        if (!user?.email) return

        const response = await axios.get(
          `http://localhost:3000/api/goals/${encodeURIComponent(
            user.email
          )}`,
          {
            withCredentials: true,
          }
        )

        if (response.data.success && response.data.goal) {
          setGoalData({
            dailyGoal:
              Number(response.data.goal.dailyGoal) ||
              DEFAULT_GOALS.dailyGoal,

            weeklyGoal:
              Number(response.data.goal.weeklyGoal) ||
              DEFAULT_GOALS.weeklyGoal,

            monthlyGoal:
              Number(response.data.goal.monthlyGoal) ||
              DEFAULT_GOALS.monthlyGoal,
          })
        }
      } catch (err) {
        console.log("Fetch analytics goals failed:", err)
        setGoalData(DEFAULT_GOALS)
      }
    }

    fetchGoals()
  }, [user?.email])

  /* ─────────────────────────────
     FILTERED LOGS
  ───────────────────────────── */

  const filteredLogs = useMemo(() => {
    const days = Number(period)

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - days + 1)

    const end = new Date()
    end.setHours(23, 59, 59, 999)

    return logs.filter((log) => {
      const date = new Date(getAnalyticsDate(log))

      if (Number.isNaN(date.getTime())) {
        return false
      }

      return date >= start && date <= end
    })
  }, [logs, period])

  /* ─────────────────────────────
     SUMMARY
  ───────────────────────────── */

  const totalEmission = filteredLogs.reduce(
    (sum, log) => sum + Number(log.kgCO2 || 0),
    0
  )

  const avgDaily =
    Number(period) > 0
      ? totalEmission / Number(period)
      : 0

  const highestLog = [...filteredLogs].sort(
    (a, b) => Number(b.kgCO2 || 0) - Number(a.kgCO2 || 0)
  )[0]

  const categoryTotals = {}

  filteredLogs.forEach((log) => {
    const category = log.category || "Other"

    categoryTotals[category] =
      (categoryTotals[category] || 0) + Number(log.kgCO2 || 0)
  })

  const sortedCategoryEntries = Object.entries(
    categoryTotals
  ).sort((a, b) => b[1] - a[1])

  const topCategory =
    sortedCategoryEntries[0]?.[0] || "None"

  const topCategoryEmission =
    sortedCategoryEntries[0]?.[1] || 0

  /* ─────────────────────────────
     SUSTAINABILITY SCORE
  ───────────────────────────── */

  let sustainabilityScore = 100

  sustainabilityScore -= avgDaily * 3

  if (topCategory.toLowerCase().includes("transport")) {
    sustainabilityScore -= 10
  }

  if (topCategory.toLowerCase().includes("food")) {
    sustainabilityScore -= 6
  }

  if (avgDaily > dailyGoal) {
    sustainabilityScore -= 10
  }

  if (filteredLogs.length >= 10) {
    sustainabilityScore += 4
  }

  sustainabilityScore = Math.max(
    10,
    Math.min(100, sustainabilityScore)
  )

  const scoreLabel =
    sustainabilityScore >= 85
      ? "Excellent"
      : sustainabilityScore >= 70
      ? "Good"
      : sustainabilityScore >= 50
      ? "Moderate"
      : "Needs Work"

  /* ─────────────────────────────
     DAILY DATA
  ───────────────────────────── */

  const dailyData = []

  for (let i = Number(period) - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)

    const dateStr = formatLocalDate(d)

    const total = filteredLogs
      .filter((log) => {
        return formatLocalDate(getAnalyticsDate(log)) === dateStr
      })
      .reduce(
        (sum, log) => sum + Number(log.kgCO2 || 0),
        0
      )

    dailyData.push({
      date: dateStr.slice(5),
      fullDate: dateStr,
      co2: Number(total.toFixed(2)),
      goal: dailyGoal,
    })
  }

  const bestDay = [...dailyData]
    .filter((day) => day.co2 > 0)
    .sort((a, b) => a.co2 - b.co2)[0]

  const highestDay = [...dailyData].sort(
    (a, b) => b.co2 - a.co2
  )[0]

  /* ─────────────────────────────
     WEEKLY DATA
  ───────────────────────────── */

  const weeklyData = []

  for (let i = 0; i < 12; i++) {
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    weekEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const total = logs
      .filter((log) => {
        const d = new Date(getAnalyticsDate(log))

        if (Number.isNaN(d.getTime())) {
          return false
        }

        return d >= weekStart && d <= weekEnd
      })
      .reduce(
        (sum, log) => sum + Number(log.kgCO2 || 0),
        0
      )

    weeklyData.unshift({
      week: `W${12 - i}`,
      co2: Number(total.toFixed(2)),
    })
  }

  /* ─────────────────────────────
     CATEGORY DATA
  ───────────────────────────── */

  const categoryData = sortedCategoryEntries.map(
    ([name, value], index) => ({
      name,
      value: Number(value.toFixed(2)),
      color: COLORS[index % COLORS.length],
      percentage:
        totalEmission > 0
          ? Number(((value / totalEmission) * 100).toFixed(1))
          : 0,
    })
  )

  const categoryAreaData = sortedCategoryEntries.map(
    ([name, value]) => ({
      category: name,
      emission: Number(value.toFixed(2)),
    })
  )

  const radarData = sortedCategoryEntries.map(
    ([name, value]) => ({
      category: name,
      value: Number(value.toFixed(2)),
    })
  )

  /* ─────────────────────────────
     STREAK
  ───────────────────────────── */

  const uniqueDates = [
    ...new Set(
      filteredLogs
        .map((log) => formatLocalDate(getAnalyticsDate(log)))
        .filter(Boolean)
    ),
  ]

  let streak = 0

  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)

    const ds = formatLocalDate(d)

    if (uniqueDates.includes(ds)) {
      streak++
    } else {
      break
    }
  }

  /* ─────────────────────────────
     AI INSIGHTS
  ───────────────────────────── */

  async function generateInsights() {
    try {
      if (filteredLogs.length === 0) {
        setInsights({
          summary:
            "No activity data is available yet. Start logging activities to receive AI-powered carbon insights.",
          scoreMessage:
            "Your sustainability score will become more meaningful after activity tracking begins.",
          motivation:
            "The first logged activity is the first step toward measurable sustainability.",
          tips: [
            {
              id: "01",
              text:
                "Start by logging your most common transport, food, and energy activities.",
            },
            {
              id: "02",
              text:
                "Track at least seven days of activity to reveal reliable emission patterns.",
            },
          ],
        })

        return
      }

      setAiLoading(true)

      const response = await axios.post(
        "http://localhost:3000/api/analytics/insights",
        {
          logs: filteredLogs,
          totalEmission,
          avgDaily,
          dailyGoal,
          topCategory,
          streak,
          sustainabilityScore,
        },
        {
          withCredentials: true,
        }
      )

      if (response.data.success) {
        const motivationMessages = [
          "Small sustainable habits create massive environmental impact over time.",
          "Your consistency in tracking emissions is already improving your footprint awareness.",
          "Every optimized activity helps move closer to a carbon-conscious lifestyle.",
          "Data-driven sustainability is the future. You're already ahead.",
          "Reducing emissions by even 1 kg daily creates major yearly savings.",
          "Awareness is the first step toward climate-positive living.",
          "Tracking your footprint regularly builds long-term eco-conscious habits.",
        ]

        const extraTips = [
          {
            id: "X1",
            text:
              "Try maintaining one completely vehicle-free day every week.",
          },
          {
            id: "X2",
            text:
              "Review your highest-emission category every weekend and plan one practical reduction step.",
          },
          {
            id: "X3",
            text:
              "Switching short-distance transport to walking or cycling has strong daily impact.",
          },
          {
            id: "X4",
            text:
              "Combining errands into one trip improves fuel efficiency and reduces repeated travel emissions.",
          },
          {
            id: "X5",
            text:
              "Reducing food waste is one of the easiest sustainability improvements.",
          },
          {
            id: "X6",
            text:
              "Consistent carbon tracking improves long-term sustainability decisions.",
          },
        ]

        const shuffled = [...extraTips]
          .sort(() => 0.5 - Math.random())
          .slice(0, 2)

        setInsights({
          summary:
            response.data.insights?.summary ||
            `You emitted ${totalEmission.toFixed(
              2
            )} kg CO₂e over the selected period. Your top category is ${topCategory}.`,

          scoreMessage:
            sustainabilityScore >= 80
              ? "Excellent sustainability performance."
              : sustainabilityScore >= 60
              ? "Good progress. Some optimization opportunities remain."
              : "Your emissions trend needs improvement for long-term sustainability.",

          motivation:
            motivationMessages[
              Math.floor(
                Math.random() * motivationMessages.length
              )
            ],

          tips: [
            ...(response.data.insights?.tips || []),
            ...shuffled,
          ],
        })
      }
    } catch (err) {
      console.log(err)

      setInsights({
        summary:
          `You emitted ${totalEmission.toFixed(
            2
          )} kg CO₂e in the selected period. Your highest contributing category is ${topCategory}.`,
        scoreMessage:
          sustainabilityScore >= 70
            ? "Your score is stable, but there is room to improve category balance."
            : "Your score can improve by reducing repeated high-emission activities.",
        motivation:
          "Even without AI generation, your logged data already gives useful direction.",
        tips: [
          {
            id: "01",
            text:
              "Focus first on your highest-emission activity because it creates the fastest improvement.",
          },
          {
            id: "02",
            text:
              `Keep daily emissions below your ${dailyGoal} kg goal line to protect your sustainability score.`,
          },
        ],
      })
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    if (filteredLogs.length > 0) {
      generateInsights()
    } else {
      setInsights(null)
    }
  }, [logs, period, dailyGoal])

  /* ─────────────────────────────
     THEME COLORS
  ───────────────────────────── */

  const chartColor =
    theme === "green"
      ? "#5c8c5a"
      : theme === "red"
      ? "#d87c5a"
      : "#3b82f6"

  const secondaryChartColor =
    theme === "green"
      ? "#8ab17d"
      : theme === "red"
      ? "#f2a077"
      : "#7aa7ff"

  /* ─────────────────────────────
     LOADING UI
  ───────────────────────────── */

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-bg-image"></div>
        <div className="analytics-page-overlay"></div>

        <video
          className="analytics-page-video analytics-page-video-dark"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/pollution.mp4" type="video/mp4" />
        </video>

        <Navbar
          user={user}
          currentPage="ANALYTICS"
          onLogout={onLogout}
          onNavChange={onNavChange}
        />

        <div className="analytics-loading">
          Loading analytics...
        </div>
      </div>
    )
  }

  /* ─────────────────────────────
     UI
  ───────────────────────────── */

  return (
    <div className="analytics-page">
      <div className="analytics-bg-image"></div>

      <video
        className="analytics-page-video analytics-page-video-dark"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/pollution.mp4" type="video/mp4" />
      </video>

      <div className="analytics-page-overlay"></div>

      <Navbar
        user={user}
        currentPage="ANALYTICS"
        onLogout={onLogout}
        onNavChange={onNavChange}
      />

      <main className="analytics-main">
        {/* HERO */}

        <header className="analytics-landing-hero">
          <div className="analytics-hero-content">
            <div className="analytics-hero-copy">
              <div className="analytics-hero-tag">
                <strong>ANALYTICS MODULE</strong>
                <span>{period}-day intelligence view</span>
              </div>

              <h1>
                Understand your carbon pattern with visual intelligence.
              </h1>

              <p>
                Analytics transforms your activity logs into readable trends,
                category comparisons, sustainability scores, daily goal
                tracking, and AI-powered recommendations.
              </p>

              <div className="analytics-hero-actions">
                <button
                  type="button"
                  className="analytics-primary-action"
                  onClick={() => onNavChange("LOG")}
                >
                  LOG ACTIVITY
                </button>

                <button
                  type="button"
                  className="analytics-secondary-action"
                  onClick={() => onNavChange("GOALS")}
                >
                  VIEW GOALS
                </button>
              </div>
            </div>

            <aside className="analytics-hero-panel">
              <div className="analytics-hero-panel__label">
                ANALYZED EMISSION
              </div>

              <div className="analytics-hero-panel__value">
                {totalEmission.toFixed(2)}
                <span>kg</span>
              </div>

              <div className="analytics-hero-panel__sub">
                From {filteredLogs.length} activities in the selected period
              </div>

              <div className="analytics-hero-panel__line"></div>

              <div className="analytics-hero-panel__mini">
                <div>
                  <strong>{Math.round(sustainabilityScore)}</strong>
                  <span>score</span>
                </div>

                <div>
                  <strong>{streak}</strong>
                  <span>day streak</span>
                </div>
              </div>
            </aside>
          </div>
        </header>

        {/* CONTROLS */}

        <section className="analytics-controls">
          <div>
            <p className="analytics-controls__label">
              ANALYSIS SETTINGS
            </p>

            <h2 className="analytics-controls__title">
              Filter time period and chart color.
            </h2>

            <p className="analytics-controls__copy">
              Change the time window to inspect short-term behavior or
              long-term carbon patterns. Your daily goal line is synced from
              the Goals page.
            </p>
          </div>

          <div className="analytics-controls__actions">
            <select
              className="analytics-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>

            <select
              className="analytics-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="green">Green Theme</option>
              <option value="red">Warm Theme</option>
              <option value="blue">Blue Theme</option>
            </select>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="analytics-summary-grid">
          <div className="summary-card">
            <div className="summary-card__label">
              TOTAL EMISSION
            </div>

            <div className="summary-card__value">
              {totalEmission.toFixed(2)} kg
            </div>

            <div className="summary-card__sub">
              Total CO₂e from selected logs
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__label">
              DAILY AVERAGE
            </div>

            <div className="summary-card__value">
              {avgDaily.toFixed(2)} kg
            </div>

            <div className="summary-card__sub">
              Goal target: {dailyGoal} kg/day
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__label">
              TOP CATEGORY
            </div>

            <div className="summary-card__value">
              {topCategory}
            </div>

            <div className="summary-card__sub">
              {topCategoryEmission.toFixed(2)} kg CO₂e contribution
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__label">
              SUSTAINABILITY SCORE
            </div>

            <div className="summary-card__value">
              {Math.round(sustainabilityScore)}/100
            </div>

            <div className="summary-card__sub">
              {scoreLabel} performance
            </div>
          </div>
        </section>

        {/* EXPLAINER */}

        <section className="analytics-explainer">
          <div className="analytics-explainer-visual">
            <div className="analytics-floating-card one">
              <span>TOP</span>
              <strong>{topCategory}</strong>
            </div>

            <div className="analytics-floating-card two">
              <span>HIGH</span>
              <strong>
                {highestLog
                  ? Number(highestLog.kgCO2 || 0).toFixed(1)
                  : "0.0"}{" "}
                kg
              </strong>
            </div>

            <div className="analytics-floating-card three">
              <span>GOAL</span>
              <strong>{dailyGoal} kg</strong>
            </div>
          </div>

          <div className="analytics-explainer-copy">
            <p className="analytics-section-kicker">
              WHY ANALYTICS MATTERS
            </p>

            <h2>
              Charts reveal what raw activity records cannot.
            </h2>

            <p>
              A single activity log only shows one carbon value. Analytics
              connects many logs together and turns them into patterns,
              trends, comparisons, and sustainability signals.
            </p>

            <p>
              This helps you understand whether your footprint is caused by
              one occasional high-emission activity or by repeated daily
              habits that need long-term improvement.
            </p>

            <p className="analytics-explainer-date">
              Highest activity date:{" "}
              <strong>
                {highestLog
                  ? formatDisplayDate(getAnalyticsDate(highestLog))
                  : "-"}
              </strong>
            </p>
          </div>
        </section>

        {/* CHART GRID */}

        <section className="analytics-chart-grid">
          <article className="analytics-chart-panel analytics-chart-panel--large">
            <div className="analytics-chart-copy">
              <p className="chart-card__eyebrow">
                DAILY SERIES
              </p>

              <h2 className="chart-card__title">
                Daily Emissions vs Goal
              </h2>

              <p>
                This chart compares each day’s carbon output against your
                saved daily goal line. The dotted red line is synced from the
                Goals page.
              </p>

              <p>
                If a bar crosses above the goal line, that day exceeded your
                selected carbon budget. Change your daily goal in the Goals
                page and this threshold will update automatically.
              </p>

              <div className="analytics-chart-insight">
                Highest day:{" "}
                <strong>
                  {highestDay?.co2?.toFixed(2) || "0.00"} kg CO₂e
                </strong>
              </div>
            </div>

            <div className="analytics-chart-visual">
              {dailyData.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.12}
                    />

                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />

                    <ReferenceLine
                      y={dailyGoal}
                      stroke="#d87c5a"
                      strokeDasharray="5 5"
                      label={{
                        value: `Goal ${dailyGoal} kg`,
                        position: "insideTopRight",
                      }}
                    />

                    <Bar
                      dataKey="co2"
                      name="Emission"
                      fill={chartColor}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="analytics-chart-panel">
            <div className="analytics-chart-copy">
              <p className="chart-card__eyebrow">
                DAILY TREND
              </p>

              <h2 className="chart-card__title">
                Emission Movement
              </h2>

              <p>
                This line chart focuses on daily movement instead of weekly
                totals. The same goal threshold is used to show whether your
                daily movement is staying inside your selected limit.
              </p>

              <p>
                A stable low line means your routine is controlled. Sharp
                increases show days that need review.
              </p>

              <div className="analytics-chart-insight">
                Best active day:{" "}
                <strong>
                  {bestDay
                    ? `${bestDay.co2.toFixed(2)} kg`
                    : "No active day yet"}
                </strong>
              </div>
            </div>

            <div className="analytics-chart-visual">
              {dailyData.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.12}
                    />

                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />

                    <ReferenceLine
                      y={dailyGoal}
                      stroke="#d87c5a"
                      strokeDasharray="5 5"
                    />

                    <Line
                      type="monotone"
                      dataKey="co2"
                      name="Daily trend"
                      stroke={chartColor}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="analytics-chart-panel">
            <div className="analytics-chart-copy">
              <p className="chart-card__eyebrow">
                CATEGORY BREAKDOWN
              </p>

              <h2 className="chart-card__title">
                Emission Composition
              </h2>

              <p>
                The donut chart shows how your total emissions are divided
                across categories. Carbon reduction should begin where the
                largest share is coming from.
              </p>

              <p>
                A dominant slice means one behavior is controlling most of
                your footprint and should become your first target.
              </p>

              <div className="analytics-chart-insight">
                Dominant category:{" "}
                <strong>{topCategory}</strong>
              </div>
            </div>

            <div className="analytics-chart-visual analytics-chart-visual--donut">
              {categoryData.length === 0 ? (
                <EmptyChartState />
              ) : (
                <>
                  <PieChart width={260} height={260}>
                    <Pie
                      data={categoryData}
                      innerRadius={68}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>

                  <div className="analytics-donut-legend">
                    {categoryData.map((item) => (
                      <div
                        key={item.name}
                        className="analytics-donut-legend__item"
                      >
                        <span
                          style={{
                            background: item.color,
                          }}
                        ></span>

                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {item.value.toFixed(2)} kg •{" "}
                            {item.percentage}%
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </article>

          <article className="analytics-chart-panel analytics-chart-panel--large">
            <div className="analytics-chart-copy">
              <p className="chart-card__eyebrow">
                CATEGORY ANALYSIS
              </p>

              <h2 className="chart-card__title">
                Emissions by Category
              </h2>

              <p>
                This chart ranks your categories by total carbon impact. It
                helps you compare transport, food, energy, and shopping in
                one clean view.
              </p>

              <p>
                When one category is far higher than the others, it becomes
                the fastest opportunity for improvement.
              </p>

              <div className="analytics-chart-insight">
                Largest contributor:{" "}
                <strong>
                  {topCategory} ({topCategoryEmission.toFixed(2)} kg)
                </strong>
              </div>
            </div>

            <div className="analytics-chart-visual">
              {categoryAreaData.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={categoryAreaData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.12}
                    />

                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="emission"
                      name="Category emission"
                      stroke={chartColor}
                      fill={chartColor}
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="analytics-chart-panel">
            <div className="analytics-chart-copy">
              <p className="chart-card__eyebrow">
                SUSTAINABILITY PROFILE
              </p>

              <h2 className="chart-card__title">
                Lifestyle Radar
              </h2>

              <p>
                The radar chart gives a lifestyle profile by showing which
                emission areas are expanding outward.
              </p>

              <p>
                A compact radar shape means better control, while a stretched
                shape means one or more habits need attention.
              </p>

              <div className="analytics-chart-insight">
                Profile status:{" "}
                <strong>{scoreLabel}</strong>
              </div>
            </div>

            <div className="analytics-chart-visual">
              {radarData.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis />

                    <Radar
                      dataKey="value"
                      name="Lifestyle impact"
                      stroke={chartColor}
                      fill={secondaryChartColor}
                      fillOpacity={0.35}
                    />

                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="analytics-chart-panel">
            <div className="analytics-chart-copy">
              <p className="chart-card__eyebrow">
                WEEKLY COMPARISON
              </p>

              <h2 className="chart-card__title">
                12-Week Direction
              </h2>

              <p>
                This weekly chart smooths daily fluctuations and shows
                whether your emission behavior is moving up, down, or
                staying stable.
              </p>

              <p>
                It becomes more valuable over time because it shows habit
                direction rather than isolated daily activity.
              </p>

              <div className="analytics-chart-insight">
                Current week:{" "}
                <strong>
                  {weeklyData[weeklyData.length - 1]?.co2.toFixed(2) ||
                    "0.00"} kg
                </strong>
              </div>
            </div>

            <div className="analytics-chart-visual">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.12}
                  />

                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="co2"
                    name="Weekly emission"
                    stroke={chartColor}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        {/* AI COACH */}

        <section className="ai-coach">
          <div className="ai-coach__panel">
            <div className="ai-coach__eyebrow">
              AI COACH
            </div>

            <div className="ai-coach__title">
              READ THE DATA.
              <br />
              REFINE THE DAY.
            </div>

            <p className="ai-coach__copy">
              The AI coach reads your logged activities, category weight,
              daily average, goal threshold, and consistency streak to
              generate practical sustainability guidance.
            </p>

            <div className="ai-score-card">
              <div className="ai-score-card__label">
                SUSTAINABILITY SCORE
              </div>

              <div className="ai-score-card__value">
                {Math.round(sustainabilityScore)}
                <span>/100</span>
              </div>

              <div className="ai-score-card__message">
                {insights?.scoreMessage || scoreLabel}
              </div>
            </div>

            <button
              className={`ai-coach__btn ${
                aiLoading ? "ai-coach__btn--loading" : ""
              }`}
              onClick={generateInsights}
              disabled={aiLoading}
            >
              {aiLoading
                ? "ANALYZING EMISSIONS..."
                : "GENERATE INSIGHTS"}
            </button>
          </div>

          <div className="ai-coach__insights">
            {insights ? (
              <>
                <div className="ai-coach__summary-block">
                  <div className="ai-coach__summary-label">
                    AI SUMMARY
                  </div>

                  <div className="ai-coach__summary-text">
                    {insights.summary}
                  </div>
                </div>

                <div className="ai-motivation-card">
                  <div className="ai-motivation-card__label">
                    MOTIVATION
                  </div>

                  <div className="ai-motivation-card__text">
                    {insights.motivation}
                  </div>
                </div>

                <div className="ai-coach__tips-grid">
                  {insights.tips?.map((tip, index) => (
                    <div
                      key={index}
                      className="tip-card"
                    >
                      <div className="tip-card__number">
                        TIP {index + 1}
                      </div>

                      <div className="tip-card__text">
                        {tip.text}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="ai-empty-state">
                Generate AI insights to analyze your sustainability
                behavior and receive personalized carbon reduction
                guidance.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}