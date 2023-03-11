const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    prompt: { type: String },
    response: { type: String },
    prompt_tokens: { type: Number },
    completion_tokens: { type: Number },
    total_tokens: { type: Number },
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    chat_id: { type: Number },
	   username: { type: String },
	  difference: {type: Number},
  },
  {
    timestamps: true,
  }
);
module.exports = model("Message", schema);

