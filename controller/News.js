const News = require("../models/News");
const NewsCategories = require("../models/NewsCategories");
const User = require("../models/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { multImages, fileUpload, imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");

exports.createNews = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  (req.body.status =
    (valueRequired(req.body.status) && req.body.status) || true),
    (req.body.star = (valueRequired(req.body.star) && req.body.star) || false),
    console.log(req.body);
  const news = await News.create(req.body);

  res.status(200).json({
    success: true,
    data: news,
  });
});

const newsCategorySearch = async (key) => {
  const ids = await NewsCategories.find({
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

exports.getNews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const star = req.query.star;
  const name = req.query.name;
  const type = req.query.type;
  const categories = req.query.categories;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = News.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(star)) {
    if (status.split(",").length > 1) {
      query.where("star").in(star.split(","));
    } else query.where("star").equals(star);
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
    const catIds = await newsCategorySearch(categories);
    console.log(catIds);
    if (catIds.length > 0) {
      query.where("categories").in(catIds);
    }
  }
  if (valueRequired(status)) query.where("status").equals(status);

  query.populate("categories");
  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, News, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const news = await query.exec();

  res.status(200).json({
    success: true,
    count: news.length,
    data: news,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const star = req.query.star;
  const name = req.query.name;
  const type = req.query.type;
  const categories = req.query.categories;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  let sort = req.query.sort || { createAt: -1 };
  const query = News.find();

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

  if (valueRequired(star)) {
    if (status.split(",").length > 1) {
      query.where("star").in(star.split(","));
    } else query.where("star").equals(star);
  }

  if (valueRequired(type)) {
    query.find({ type: { $regex: ".*" + type + ".*", $options: "i" } });
  }

  if (valueRequired(categories)) {
    const catIds = await newsCategorySearch(categories);
    console.log(catIds);
    if (catIds.length > 0) {
      query.where("categories").in(catIds);
    }
  }

  query.populate({ path: "categories", select: "name -_id" });
  query.select(select);
  query.populate({ path: "createUser", select: "firstname -_id" });
  query.populate({ path: "updateUser", select: "firstname -_id" });

  const news = await query.exec();

  res.status(200).json({
    success: true,
    count: news.length,
    data: news,
  });
});

exports.multDeleteNews = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findNews = await News.find({ _id: { $in: ids } });

  if (findNews.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findNews.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  const news = await News.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getSingleNews = asyncHandler(async (req, res, next) => {
  const news = await News.findByIdAndUpdate(req.params.id).populate(
    "categories"
  );

  news.views = news.views + 1;
  news.save();

  if (!news) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: news,
  });
});

exports.updateNews = asyncHandler(async (req, res, next) => {
  let news = await News.findById(req.params.id);

  if (!news) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  if (valueRequired(req.body.pictures) === false) {
    req.body.pictures = [];
  }

  if (valueRequired(req.body.audios) === false) {
    req.body.audios = [];
  }

  if (valueRequired(req.body.videos) === false) {
    req.body.videos = [];
  }

  if (valueRequired(req.body.categories) === false) {
    req.body.categories = [];
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  news = await News.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: news,
  });
});

exports.getCountNews = asyncHandler(async (req, res, next) => {
  const news = await News.count();
  res.status(200).json({
    success: true,
    data: news,
  });
});

exports.getAllNews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const name = req.query.name;
  const select = req.query.select;

  let sort = req.query.sort || { createAt: -1 };
  let category = req.query.category;
  let status = req.query.status || null;

  if (typeof sort === "string") {
    sort = JSON.parse("{" + req.query.sort + "}");
  }

  if (category === "*") {
    category = null;
  }
  if (valueRequired(status)) {
    status = null;
  }

  ["select", "sort", "page", "limit", "category", "status", "name"].forEach(
    (el) => delete req.query[el]
  );

  const query = News.find({});
  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });
  query.populate("categories");
  query.populate("createUser");
  query.populate("updateUser");
  query.select(select);
  query.sort(sort);

  if (category !== null) {
    query.where("categories").in(category);
  }
  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, null, result);
  query.skip(pagination.start - 1);
  query.limit(limit);

  const news = await query.exec();

  res.status(200).json({
    success: true,
    count: news.length,
    data: news,
    pagination,
  });
});

exports.getSlugNews = asyncHandler(async (req, res, next) => {
  const news = await News.findOne({ slug: req.params.slug }).populate(
    "createUser"
  );

  if (!news) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  news.views = news.views + 1;
  news.update();

  res.status(200).json({
    success: true,
    data: news,
  });
});
