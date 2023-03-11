const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    start_message: { type: String },
    prompt_gpt_setting: { type: String },
    telegram_token: { type: String },
    gpt_token: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Bot", schema);

