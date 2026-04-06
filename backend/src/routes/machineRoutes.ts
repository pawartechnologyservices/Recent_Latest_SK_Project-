import { Router } from 'express';
import { machineController } from '../controllers/machineController';

const router = Router();

// GET routes
router.get('/', machineController.getMachines.bind(machineController));
router.get('/stats', machineController.getMachineStats.bind(machineController));
router.get('/search', machineController.searchMachines.bind(machineController));
router.get('/:id', machineController.getMachineById.bind(machineController));

// POST routes
router.post('/', machineController.createMachine.bind(machineController));
router.post('/:id/maintenance', machineController.addMaintenanceRecord.bind(machineController));

// PUT routes
router.put('/:id', machineController.updateMachine.bind(machineController));

// DELETE routes
router.delete('/:id', machineController.deleteMachine.bind(machineController));

export default router;