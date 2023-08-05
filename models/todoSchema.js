const mongoose = require("mongoose");
const { schema } = require("./userSchema");

const Schema = mongoose.Schema;

const todoSchema = new Schema({
  tittle: {
    type: String,
    require: true,
  },
  author: {
    type: String,
    require: true,
  },
  prize: {
    type: String,
    require: true,
  },
  category: {
    type: String,
    require: true,
  },
  username: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("todo", todoSchema);
