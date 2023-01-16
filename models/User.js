const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  position: {
    type: String,
    trim: true,
  },

  role: {
    type: String,
    required: [true, "Хэрэглэгчийн эрхийг сонгоно уу"],
    enum: ["user", "operator", "admin"],
    default: "user",
  },

  lastname: {
    type: String,
    default: null,
  },

  firstname: {
    type: String,
    default: null,
  },

  email: {
    type: String,
    required: [true, "Хэрэглэгчинй имэйл хаягийг оруулж өгнө үү"],
    unique: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      "Имэйл хаягаа буруу оруулсан байна",
    ],
  },

  phone: {
    type: Number,
    unique: true,
    required: [true, "Утасны дугаараа оруулна уу"],
  },

  image: {
    type: String,
    default: null,
  },

  gender: {
    type: String,
    enum: ["male", "female"],
    required: [true, "Хүйсээ сонгоно уу"],
  },

  age: {
    type: Number,
    default: null,
  },

  entryDate: {
    type: Date,
    default: Date.now,
  },

  password: {
    type: String,
    minlength: [8, "Нууц үг 8 - аас дээш тэмэгдээс бүтэх ёстой."],
    required: [true, "Нууц үгээ оруулна уу"],
    select: false,
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,

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

UserSchema.pre("save", async function (next) {
  // Өөрчлөгдсөн эсэхийг шалгана
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getJsonWebToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      role: this.role,
      name: this.firstname,
      phone: this.phone,
      email: this.email,
      avatar: this.image,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRESIN,
    }
  );
  return token;
};

UserSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generatePasswordChangeToken = function () {
  // const resetToken = crypto.randomBytes(20).toString("hex");
  const resetToken = 100000 + Math.floor(Math.random() * 900000);
  // this.resetPasswordToken = crypto
  //   .createHash("sha256")
  //   .update(resetToken)
  //   .digest("hex");
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
