const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  type: {
    type: mongoose.Schema.ObjectId,
    ref: "MemberType",
  },

  country: {
    type: String,
  },

  pictures: {
    type: [String],
  },

  firstName: {
    type: String,
    required: [true, "Нэр оруулна уу"],
  },

  lastName: {
    type: String,
    required: [true, "Овог нэрээ оруулна уу"],
  },

  customerCount: {
    type: Number,
    default: 0,
  },

  rate: {
    type: Number,
    default: 0,
  },

  belong: {
    type: String,
  },

  position: {
    type: String,
    required: [true, "Статус оруулна уу"],
  },

  shortAbout: {
    type: String,
  },

  about: {
    type: String,
  },

  contactLinks: { type: [String] },
  phoneNumber: { type: Number },
  views: { type: Number, default: 0 },

  createUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  updateUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  createAt: {
    type: Date,
    default: Date.now,
  },

  updateAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Member", MemberSchema);
