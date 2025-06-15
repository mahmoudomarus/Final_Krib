import { Router } from 'express';
const router: Router = Router();
router.get('/profile', (req, res) => res.json({ message: 'Users routes coming soon' }));
export default router; 