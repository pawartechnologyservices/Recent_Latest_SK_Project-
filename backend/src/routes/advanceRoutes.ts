// backend/src/routes/advanceRoutes.ts
import express from 'express';
import advanceController from '../controllers/advanceController';

const router = express.Router();

// Advance CRUD routes
router.get('/advances', advanceController.getAllAdvances);
router.get('/advances/summary', advanceController.getAdvancesSummary);
router.get('/advances/:id', advanceController.getAdvanceById);
router.post('/advances', advanceController.createAdvance);
router.put('/advances/:id', advanceController.updateAdvance);
router.patch('/advances/:id/repayment', advanceController.updateAdvanceRepayment);
router.delete('/advances/:id', advanceController.deleteAdvance);

// Employee specific advances
router.get('/employees/:employeeId/advances', advanceController.getEmployeeAdvances);

export default router;
