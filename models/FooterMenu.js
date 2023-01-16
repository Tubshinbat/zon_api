const mongoose = require("mongoose");
const { transliterate, slugify } = require("transliteration");

const FooterMenuSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  isDirect: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  isModel: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  name: {
    type: String,
  },

  direct: {
    type: String,
  },

  picture: {
    type: String,
  },

  slug: {
    type: String,
  },

  parentId: {
    type: String,
  },

  model: {
    type: String,
    enum: [
      "news",
      "announce",
      "platforms",
      "services",
      "costs",
      "partners",
      "faq",
      "gallerys",
      "contacts",
    ],
  },

  position: {
    type: Number,
  },

  createAt: {
    type: Date,
    default: Date.now,
  },

  updateAt: {
    type: Date,
    default: Date.now,
  },
  createUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  updateUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

FooterMenuSchema.pre("save", function (next) {
  this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model("FooterMenu", FooterMenuSchema);
