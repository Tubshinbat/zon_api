const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  updateFooterMenu,
  createFooterMenu,
  getFooterMenus,
  changePosition,
  getFooterMenu,
  deletetFooterMenu,
} = require("../controller/FooterMenu");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createFooterMenu)
  .get(getFooterMenus);

router
  .route("/change")
  .post(protect, authorize("admin", "operator"), changePosition);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getFooterMenu)
  .delete(protect, authorize("admin"), deletetFooterMenu)
  .put(protect, authorize("admin", "operator"), updateFooterMenu);

module.exports = router;
