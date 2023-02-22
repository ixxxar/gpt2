const { Schema, model } = require("mongoose");

const schema = new Schema(
  {},
  {
    timestamps: true,
  }
);

module.exports = model("User", schema);
