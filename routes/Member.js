const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createMember,
  getMembers,
  multDeleteMember,
  getSingleMember,
  updateMember,
} = require("../controller/Member");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createMember)
  .get(getMembers);

router.route("/delete").delete(protect, authorize("admin"), multDeleteMember);
router
  .route("/:id")
  .get(getSingleMember)
  .put(protect, authorize("admin", "operator"), updateMember);

module.exports = router;
