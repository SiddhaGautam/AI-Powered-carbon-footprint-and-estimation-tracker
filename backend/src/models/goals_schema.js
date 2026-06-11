const mongoose = require("mongoose")

const goalSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },

    dailyGoal: {
      type: Number,
      default: 12,
    },

    weeklyGoal: {
      type: Number,
      default: 80,
    },

    monthlyGoal: {
      type: Number,
      default: 320,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model(
  "Goal",
  goalSchema
)