const mongoose = require("mongoose")

const notificationSchema = mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: "info",
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model(
  "Notification",
  notificationSchema
)