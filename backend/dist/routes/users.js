"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/profile', (req, res) => res.json({ message: 'Users routes coming soon' }));
exports.default = router;
//# sourceMappingURL=users.js.map