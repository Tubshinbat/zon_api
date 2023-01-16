const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createWebInfo,
  updateWebInfo,
  getWebInfo,
} = require("../controller/WebInfo");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createWebInfo)
  .get(getWebInfo);

router.route("/").put(protect, authorize("admin", "operator"), updateWebInfo);

module.exports = router;
