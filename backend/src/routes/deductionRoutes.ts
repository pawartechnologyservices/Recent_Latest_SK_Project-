// backend/src/routes/deductionRoutes.ts
import express from 'express';
import deductionController from '../controllers/deductionController';
import advanceRoutes from './advanceRoutes';

const router = express.Router();

// Health check
router.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Deduction CRUD routes
router.get('/deductions', deductionController.getAllDeductions);
router.get('/deductions/stats', deductionController.getDeductionStats);
router.get('/deductions/:id', deductionController.getDeductionById);
router.post('/deductions', deductionController.createDeduction);
router.put('/deductions/:id', deductionController.updateDeduction);
router.delete('/deductions/:id', deductionController.deleteDeduction);

// Employee related routes
router.get('/employees/active', deductionController.getActiveEmployees);
router.get('/employees/:employeeId/deductions', deductionController.getDeductionsByEmployee);

// Monthly reports
router.get('/deductions/month/:year/:month', deductionController.getDeductionsByMonth);

// Mount advance routes
router.use(advanceRoutes);

export default router;
