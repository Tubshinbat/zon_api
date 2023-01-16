const mongoose = require("mongoose");
const { transliterate, slugify } = require("transliteration");

const MenuSchema = new mongoose.Schema({
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

  isPage: {
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

  page: {
    type: mongoose.Schema.ObjectId,
    ref: "Page",
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

MenuSchema.pre("save", function (next) {
  if (!this.slug) this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model("Menu", MenuSchema);
