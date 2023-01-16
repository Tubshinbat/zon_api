const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createNews,
  getNews,
  multDeleteNews,
  getSingleNews,
  updateNews,
  getCountNews,
  getAllNews,
  getFullData,
  getSlugNews,
} = require("../controller/News");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createNews)
  .get(getNews);

  router.route('/excel').get(getFullData);

router.route("/c").get(getAllNews);
router.route("/s/:slug").get(getSlugNews);

router
  .route("/count")
  .get(protect, authorize("admin", "operator"), getCountNews);
router.route("/delete").delete(protect, authorize("admin"), multDeleteNews);
router
  .route("/:id")
  .get(getSingleNews)
  .put(protect, authorize("admin", "operator"), updateNews);

module.exports = router;
