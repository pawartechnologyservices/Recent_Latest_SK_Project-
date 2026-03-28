import express from "express";
import {
  getAllBriefings,
  getBriefingById,
  createBriefing,
  updateBriefing,
  updateActionItemStatus,
  deleteBriefing,
  getBriefingStats
} from "../controllers/briefingController";

const router = express.Router();

router.get("/", getAllBriefings);
router.get("/stats", getBriefingStats);
router.get("/:id", getBriefingById);
router.post("/", createBriefing);
router.put("/:id", updateBriefing);
router.put("/:id/actions/:actionId", updateActionItemStatus);
router.delete("/:id", deleteBriefing);

export default router;