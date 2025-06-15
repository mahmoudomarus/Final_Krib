import { Router } from 'express';
const router: Router = Router();
router.get('/dashboard', (req, res) => res.json({ message: 'Admin routes coming soon' }));
export default router; 