"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/dashboard', (req, res) => res.json({ message: 'Admin routes coming soon' }));
exports.default = router;
//# sourceMappingURL=admin.js.map