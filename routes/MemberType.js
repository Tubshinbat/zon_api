const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createMemberType,
  getMemberTypes,
  getMemberType,
  deletetMemberType,
  updateMemberType,
} = require("../controller/MemberType");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createMemberType)
  .get(getMemberTypes);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getMemberType)
  .delete(protect, authorize("admin"), deletetMemberType)
  .put(protect, authorize("admin", "operator"), updateMemberType);

module.exports = router;
