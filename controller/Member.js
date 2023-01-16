const Member = require("../models/Members");
const MemberType = require("../models/MemberType");
const User = require("../models/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");

exports.createMember = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  const member = await Member.create(req.body);

  res.status(200).json({
    success: true,
    data: member,
  });
});

const MemberTypeSearch = async (key) => {
  const ids = await MemberType.find({
    name: { $regex: ".*" + key + ".*", $options: "i" },
  }).select("_id");
  return ids;
};

const useSearch = async (userFirstname) => {
  const userData = await User.find({
    firstname: { $regex: ".*" + userFirstname + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.getMembers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // Member FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const type = req.query.type;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Member.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(type)) {
    query.find({ type: { $regex: ".*" + type + ".*", $options: "i" } });
  }

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

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

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      if (spliteSort.length > 0) {
        let convertSort = {};
        if (spliteSort[1] === "ascend") {
          convertSort = { [spliteSort[0]]: 1 };
        } else {
          convertSort = { [spliteSort[0]]: -1 };
        }
        if (spliteSort[0] != "undefined") query.sort(convertSort);
      }

      const splite = sort.split("_");
      if (splite.length > 0) {
        let convertSort = {};
        if (splite[1] === "ascend") {
          convertSort = { [splite[0]]: 1 };
        } else {
          convertSort = { [splite[0]]: -1 };
        }
        if (splite[0] != "undefined") query.sort(convertSort);
      }
    } else {
      query.sort(sort);
    }
  }

  if (valueRequired(categories)) {
    const catIds = await MemberType(categories);

    if (catIds.length > 0) {
      query.where("type").in(catIds);
    }
  }
  if (valueRequired(status)) query.where("status").equals(status);

  query.populate("type");
  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Member, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const member = await query.exec();

  res.status(200).json({
    success: true,
    count: member.length,
    data: member,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  const select = req.query.select;

  // Member FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const type = req.query.type;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  let sort = req.query.sort || { createAt: -1 };
  const query = Member.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

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

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      if (spliteSort[0] != "undefined") query.sort(convertSort);
    }
  }

  if (valueRequired(type)) {
    query.find({ type: { $regex: ".*" + type + ".*", $options: "i" } });
  }

  query.populate({ path: "type", select: "name -_id" });
  query.select(select);
  query.populate({ path: "createUser", select: "firstname -_id" });
  query.populate({ path: "updateUser", select: "firstname -_id" });

  const member = await query.exec();

  res.status(200).json({
    success: true,
    count: member.length,
    data: member,
  });
});

exports.multDeleteMember = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findMember = await Member.find({ _id: { $in: ids } });

  if (findMember.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findMember.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  const member = await Member.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getSingleMember = asyncHandler(async (req, res, next) => {
  const member = await Member.findByIdAndUpdate(req.params.id).populate("type");

  member.views = member.views + 1;
  member.save();

  if (!Member) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: Member,
  });
});

exports.updateMember = asyncHandler(async (req, res, next) => {
  let member = await Member.findById(req.params.id);

  if (!member) {
    throw new MyError("Тухайн хэрэглэгч олдсонгүй. ", 404);
  }

  if (valueRequired(req.body.type) === false) {
    req.body.type = [];
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  member = await Member.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: member,
  });
});

exports.getCountMember = asyncHandler(async (req, res, next) => {
  const member = await Member.count();
  res.status(200).json({
    success: true,
    data: member,
  });
});
