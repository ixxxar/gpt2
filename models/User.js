const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    username: { type: String },
    is_paid: { type: Boolean },
    chat_id: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = model("User", schema);

