const MemberType = require("../models/MemberType");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");

exports.createMemberType = asyncHandler(async (req, res, next) => {
  const memberType = await MemberType.create(req.body);
  res.status(200).json({
    success: true,
    data: memberType,
  });
});

exports.getMemberTypes = asyncHandler(async (req, res, next) => {
  const types = await MemberType.find({}).sort({ createAt: -1 });
  res.status(200).json({
    success: true,
    data: types,
  });
});

exports.getMemberType = asyncHandler(async (req, res, next) => {
  const type = await MemberType.findById(req.params.id);

  if (!type) {
    throw new MyError(req.params.id + " Тус мэдээний ангилал олдсонгүй.", 404);
  }

  res.status(200).json({
    success: true,
    data: type,
  });
});

exports.deletetMemberType = asyncHandler(async (req, res, next) => {
  const memberType = await MemberType.findById(req.params.id);
  if (!memberType) {
    throw new MyError(req.params.id + " дата олдсонгүй", 404);
  }
  const parentMenus = await MemberType.find({ parentId: req.params.id });

  parentMenus.remove();

  res.status(200).json({
    success: true,
    data: memberType,
  });
});

exports.updateMemberType = asyncHandler(async (req, res, next) => {
  const memberType = await MemberType.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!memberType) {
    throw new MyError("Ангилалын нэр солигдсонгүй", 400);
  }

  res.status(200).json({
    success: true,
    data: memberType,
  });
});
