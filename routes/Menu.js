const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  updateMenu,
  createMenu,
  getMenus,
  changePosition,
  getMenu,
  deletetMenu,
} = require("../controller/Menu");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createMenu)
  .get(getMenus);

router
  .route("/change")
  .post(protect, authorize("admin", "operator"), changePosition);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getMenu)
  .delete(protect, authorize("admin"), deletetMenu)
  .put(protect, authorize("admin", "operator"), updateMenu);

module.exports = router;
