const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const paginate = require("../utils/paginate");
const fs = require("fs");
const moment = require("moment");
const { fileUpload, imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");

// OldUSer Check
exports.oldUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  let data = false;

  if (!email || !password)
    throw new MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  if (user.oldUserLogin === false) {
    data = true;
  } else {
    data = false;
  }

  res.status(200).json({
    success: true,
    data: data,
  });
});

// Register
exports.register = asyncHandler(async (req, res, next) => {
  req.body.email = req.body.email.toLowerCase();
  const user = await User.create(req.body);
  const jwt = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token: jwt,
    data: user,
  });
});

exports.getFullData = asyncHandler(async (req, res) => {
  let status = req.query.status || null;
  const position = req.query.position;
  const role = req.query.role;
  const lastname = req.query.lastname;
  const firstname = req.query.firstname;
  const username = req.query.username;
  const email = req.query.email;
  const phone = parseInt(req.query.phone) || null;
  const gender = req.query.gender;
  const age = req.query.age;
  const createUser = req.query.createUser;
  const updateUser = req.query.updaetUser;
  const select = req.query.select;

  const page = 1;
  const limit = 25;
  let sort = req.query.sort || { createAt: -1 };

  ["select", "sort", "page", "limit", "status", "name", "role"].forEach(
    (el) => delete req.query[el]
  );

  const query = User.find();
  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(email)) {
    query.find({ email: { $regex: ".*" + email + ".*", $options: "i" } });
  }

  if (valueRequired(lastname)) {
    query.find({ lastname: { $regex: ".*" + lastname + ".*", $options: "i" } });
  }

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(firstname)) {
    query.find({
      firstname: { $regex: ".*" + firstname + ".*", $options: "i" },
    });
  }

  if (valueRequired(username)) {
    query.find({ username: { $regex: ".*" + username + ".*", $options: "i" } });
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }

  if (valueRequired(phone)) {
    query.where("phone").equals(phone);
  }

  if (valueRequired(gender)) {
    if (gender.split(",").length > 1) {
      query.where("gender").in(gender.split(","));
    } else query.where("gender").equals(gender);
  }

  if (valueRequired(age)) {
    query.where("age").equals(age);
  }

  if (valueRequired(role)) {
    if (role.split(",").length > 1) {
      query.where("role").in(role.split(","));
    } else query.where("role").equals(role);
  }
  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  query.select(select);
  query.sort(sort);
  query.populate("createUser");
  query.populate("updateUser");

  const users = await query.exec();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  // Оролтыгоо шалгана
  if (!email || !password)
    throw new MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);

  // Тухайн хэрэглэгчийг хайна
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  // if (user.oldUserLogin === false)
  //   throw new MyError(
  //     "Вэбсайт шинжлэгдсэнтэй холбоотой та нууц үгээ мартсан дээр дарж шинэчлэн үү",
  //     401
  //   );

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 402);
  }

  if (user.role === "user") {
    throw new MyError("Уучлаарай нэвтрэх боломжгүй.");
  }

  if (user.status === false) {
    throw new MyError("Уучлаарай таны эрхийг хаасан байна.");
  }

  const token = user.getJsonWebToken();
  req.token = token;
  const cookieOption = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };

  res.status(200).cookie("oyuntoken", token, cookieOption).json({
    success: true,
    token,
    user,
  });
});

exports.loginUser = asyncHandler(async (req, res, next) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  // Оролтыгоо шалгана
  if (!email || !password)
    throw new MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);

  // Тухайн хэрэглэгчийг хайна
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  // if (user.oldUserLogin === false)
  //   throw new MyError(
  //     "Вэбсайт шинчлэгдсэнтэй холбоотой та нууц үгээ мартсан дээр дарж шинэчлэн үү",
  //     401
  //   );

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 402);
  }

  if (user.status === false) {
    throw new MyError("Уучлаарай таны эрхийг хаасан байна.");
  }

  const token = user.getJsonWebToken();
  req.token = token;
  const cookieOption = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };

  res.status(200).cookie("oyuntoken", token, cookieOption).json({
    success: true,
    token,
    user,
  });
});

exports.getUseInfo = asyncHandler(async (req, res, next) => {
  const token = req.cookies.oyuntoken;
  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  if (req.userId !== tokenObject.id) {
    throw new MyError(
      ` ${tokenObject.id} Уучлаарай хандах боломжгүй байна.. ${token}`,
      400
    );
  }

  const user = await User.findById(req.userId);

  if (user.status === false)
    throw new MyError("Уучлаарай таны эрхийг хаасан байна..", 400);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getUserPasswordChange = asyncHandler(async (req, res, next) => {
  const token = req.cookies.oyuntoken;
  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  if (req.userId !== tokenObject.id) {
    throw new MyError("Уучлаарай хандах боломжгүй байна..", 401);
  }

  const password = req.body.password;
  const confPassword = req.body.confPassword;

  if (password !== confPassword)
    throw new MyError(
      "Уучлаарай давтан оруулсан нууц үг тохирохгүй байна..",
      401
    );

  if (!password) throw new MyError(`Нууц үгээ оруулна уу ${error}`, 401);

  const user = await User.findById(req.userId);
  user.password = req.body.password;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getUseUpdate = asyncHandler(async (req, res, next) => {
  const token = req.cookies.oyuntoken;
  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  if (req.userId !== tokenObject.id) {
    throw new MyError("Уучлаарай хандах боломжгүй байна..", 400);
  }
  if (req.body.email) req.body.email = req.body.email.toLowerCase();
  req.body.age = parseInt(req.body.age) || 0;
  req.body.phone = parseInt(req.body.phone) || null;

  delete req.body.status;
  delete req.body.wallet;
  delete req.body.role;
  delete req.body.password;
  delete req.body.confirmPassword;

  // if (valueRequired(req.body.gender) === false) req.body.gender = "other";

  const user = await User.findByIdAndUpdate(req.userId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " Хэрэглэгч олдсонгүй.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.tokenCheckAlways = asyncHandler(async (req, res, next) => {
  const token = req.cookies.oyuntoken;

  if (!token) {
    throw new MyError("Уучлаарай хандах боломжгүй байна..", 400);
  }

  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  req.userId = tokenObject.id;
  req.userRole = tokenObject.role;

  res.status(200).json({
    success: true,
    role: tokenObject.role,
    userId: tokenObject.id,
    avatar: tokenObject.avatar,
    name: tokenObject.name,
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  const cookieOption = {
    expires: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };
  res.status(200).cookie("oyuntoken", null, cookieOption).json({
    success: true,
    data: "logout...",
  });
});

exports.emailCheck = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ status: true })
    .where("email")
    .equals(email);

  if (!user) {
    throw new MyError("Уучлаарай И-мэйлээ шалгаад дахин оролдоно уу");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.phoneCheck = asyncHandler(async (req, res) => {
  const phoneNumber = parseInt(req.body.phoneNumber) || 0;
  const user = await User.findOne({ status: true })
    .where("phone")
    .equals(phoneNumber);

  if (!user) {
    throw new MyError("Уучлаарай утасны дугаараа шалгаад дахин оролдоно уу");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const newPassword = req.body.password;
  const userId = req.body.id;
  if (!newPassword) {
    throw new MyError("Нууц үгээ дамжуулна уу.", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new MyError(req.body.email + "Хандах боломжгүй.", 400);
  }

  user.password = req.body.password;
  user.resetPassword = undefined;
  user.resetPasswordExpire = undefined;
  user.createAt = Date.now();
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

const useSearch = async (userFirstname) => {
  const userData = await User.find({
    firstname: { $regex: ".*" + userFirstname + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.getUsers = asyncHandler(async (req, res, next) => {
  let status = req.query.status || null;
  const position = req.query.position;
  const role = req.query.role;
  const lastname = req.query.lastname;
  const firstname = req.query.firstname;
  const username = req.query.username;
  const email = req.query.email;
  const phone = parseInt(req.query.phone) || null;
  const gender = req.query.gender;
  const age = req.query.age;
  const createUser = req.query.createUser;
  const updateUser = req.query.updaetUser;
  const select = req.query.select;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };

  ["select", "sort", "page", "limit", "status", "name", "role"].forEach(
    (el) => delete req.query[el]
  );

  const query = User.find();
  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(email)) {
    query.find({ email: { $regex: ".*" + email + ".*", $options: "i" } });
  }

  if (valueRequired(lastname)) {
    query.find({ lastname: { $regex: ".*" + lastname + ".*", $options: "i" } });
  }

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(firstname)) {
    query.find({
      firstname: { $regex: ".*" + firstname + ".*", $options: "i" },
    });
  }

  if (valueRequired(username)) {
    query.find({ username: { $regex: ".*" + username + ".*", $options: "i" } });
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }

  if (valueRequired(phone)) {
    query.where("phone").equals(phone);
  }

  if (valueRequired(gender)) {
    if (gender.split(",").length > 1) {
      query.where("gender").in(gender.split(","));
    } else query.where("gender").equals(gender);
  }

  if (valueRequired(age)) {
    query.where("age").equals(age);
  }

  if (valueRequired(role)) {
    if (role.split(",").length > 1) {
      query.where("role").in(role.split(","));
    } else query.where("role").equals(role);
  }

  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  query.select(select);
  query.sort(sort);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, User, result);
  query.skip(pagination.start - 1);
  query.limit(limit);

  const users = await query.exec();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
    pagination,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new MyError("Тухайн хэрэглэгч олдсонгүй.", 404);
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getCount = asyncHandler(async (req, res, next) => {
  const userCount = await User.count();
  res.status(200).json({
    success: true,
    data: userCount,
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  req.body.status = req.body.status || false;
  req.body.role = req.body.role || "user";
  req.body.email = req.body.email.toLowerCase();
  req.body.createUser = req.userId;
  req.body.age = parseInt(req.body.age) || 0;
  req.body.phone = parseInt(req.body.phone) || null;
  req.body.wallet = parseInt(req.body.wallet) || 0;
  const date = moment(Date.now())
    .utcOffset("+0800")
    .format("YYYY-MM-DD HH:mm:ss");

  req.body.createAt = date;

  const file = req.files;

  // if (req.body.role === "admin" && req.userRole !== "admin") {
  //   throw new MyError("Уучлаарай админ эрх өгөх эрхгүй байна", 400);
  // }
  console.log(req.body);
  if (file) {
    const avatar = await fileUpload(file.image, "avatar").catch((error) => {
      throw new MyError(`Зураг хуулах явцад алдаа гарлаа: ${error}`, 408);
    });
    req.body.image = avatar.fileName;
  }

  const user = await User.create(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  req.body.status = req.body.status || false;
  req.body.role = req.body.role;
  req.body.email = req.body.email && req.body.email.toLowerCase();
  req.body.updateUser = req.userId;
  req.body.age = parseInt(req.body.age) || 0;
  req.body.phone = parseInt(req.body.phone) || null;
  req.body.wallet = parseInt(req.body.wallet) || 0;
  if (valueRequired(req.body.gender) === false) req.body.gender = "other";

  delete req.body.password;
  delete req.body.confirmPassword;

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй Хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateCuser = asyncHandler(async (req, res, next) => {
  req.body.status = req.body.status || false;
  req.body.role = req.body.role || "user";
  req.body.email = req.body.email.toLowerCase();
  req.body.updateUser = req.userId;

  if (req.params.id !== req.userId) {
    throw new MyError("Уучлаарай хандах боломжгүй", 300);
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй Хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  user.image && imageDelete(user.image);

  user.remove();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.multDeleteUsers = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findUsers = await User.find({ _id: { $in: ids } });
  // throw new MyError("Зүгээр алдаа гаргамаар байна. ", 404);
  if (findUsers.length <= 0) {
    throw new MyError("Таны сонгосон хэрэглэгчид олдсонгүй", 404);
  }

  findUsers.map(async (el) => {
    el.image && (await imageDelete(el.image));
  });

  const user = await User.deleteMany({ _id: { $in: ids } });
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
    throw new MyError(" Имэйл хаягаа дамжуулна уу.", 400);
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new MyError(req.body.email + " Имэйл хаягаа дахин шалгана уу.", 400);
  }

  const resetToken = user.generatePasswordChangeToken();

  // await user.save();
  await user.save({ validateBeforeSave: false });

  const message = `Сайн байна уу? Энэ таны баталгаажуулах код <br> <br> ${resetToken}<br> <br> өдрийг сайхан өнгөрүүлээрэй!`;

  // Имэйл илгээнэ
  const info = await sendEmail({
    email: user.email,
    subject: "Нууц үг сэргээх хүсэлт",
    message,
  });

  res.status(200).json({
    success: true,
    resetToken,
    console: message,
    message: "Таны имэйл хаягруу нууц үг солих линк илгээлээ",
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.otp || !req.body.password) {
    throw new MyError(
      "Баталгаажуулах код болон шинэж нууц үгээ оруулна уу.",
      400
    );
  }

  const user = await User.findOne({
    resetPasswordToken: req.body.otp,
    resetPasswordExpire: { $gt: Date.now() },
  });

  console.log(user + " =======> " + user.resetPasswordExpire);

  if (!user) {
    throw new MyError(
      req.body.email + "Баталгаажуулах код хүчингүй байна дахин авна уу.",
      400
    );
  }

  user.password = req.body.password;
  user.email = req.body.email.toLowerCase();
  user.oldUserLogin = true;
  user.resetPassword = undefined;
  user.resetPasswordExpire = undefined;

  user.save();

  const token = user.getJsonWebToken();
  res.status(200).json({
    success: true,
    token,
    user,
  });
});

exports.adminControlResetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.password) {
    throw new MyError("нууц үгээ дамжуулна уу.", 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.body.email + "Токен хүчингүй байна.", 400);
  }

  user.password = req.body.password;
  user.resetPassword = undefined;
  user.resetPasswordExpire = undefined;
  user.updateAt = Date.now();
  user.updateUser = req.userId;
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// FILE UPLOAD

const deleteImage = (filePaths) => {
  if (filePaths) {
    const filePath = filePaths;
    try {
      // console.log(filePath);
      fs.unlinkSync(process.env.FILE_AVATAR_UPLOAD_PATH + "/" + filePath);
      fs.unlinkSync(
        process.env.FILE_AVATAR_UPLOAD_PATH + "/150x150/" + filePath
      );
      fs.unlinkSync(
        process.env.FILE_AVATAR_UPLOAD_PATH + "/350x350/" + filePath
      );
      fs.unlinkSync(process.env.FILE_AVATAR_UPLOAD_PATH + "/450/" + filePath);
    } catch (error) {
      console.log(error);
    }
  }
};
