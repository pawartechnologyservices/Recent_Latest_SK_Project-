// backend/src/routes/deductionRoutes.ts
import express from 'express';
import deductionController from '../controllers/deductionController';
import advanceRoutes from './advanceRoutes';

const router = express.Router();

// Health check
router.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Deduction CRUD routes - Remove the '/deductions' prefix from each route
router.get('/', deductionController.getAllDeductions);
router.get('/stats', deductionController.getDeductionStats);
router.get('/:id', deductionController.getDeductionById);
router.post('/', deductionController.createDeduction);
router.put('/:id', deductionController.updateDeduction);
router.delete('/:id', deductionController.deleteDeduction);

// Employee related routes
router.get('/employees/active', deductionController.getActiveEmployees);
router.get('/employees/:employeeId/deductions', deductionController.getDeductionsByEmployee);

// Monthly reports
router.get('/month/:year/:month', deductionController.getDeductionsByMonth);

// Mount advance routes
router.use('/advances', advanceRoutes);

export default router;