const mongoose = require("mongoose")

const logSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    activity: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
    },

    factor: {
      type: Number,
      required: true,
    },

    kgCO2: {
      type: Number,
      required: true,
    },

    note: {
      type: String,
      default: "",
    },

    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Log", logSchema)