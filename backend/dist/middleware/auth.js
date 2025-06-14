"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireVerified = exports.requireAgent = exports.requireHost = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../lib/supabase");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
            });
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'JWT secret not configured',
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, is_active, is_suspended, is_host, is_agent, is_verified')
            .eq('id', decoded.id)
            .single();
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }
        if (!user.is_active || user.is_suspended) {
            return res.status(401).json({
                success: false,
                error: 'Account is suspended or inactive',
            });
        }
        req.user = {
            id: user.id,
            email: user.email,
            isHost: user.is_host,
            isAgent: user.is_agent,
            isVerified: user.is_verified,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireHost = (req, res, next) => {
    if (!req.user?.isHost) {
        return res.status(403).json({
            success: false,
            error: 'Host access required',
        });
    }
    next();
};
exports.requireHost = requireHost;
const requireAgent = (req, res, next) => {
    if (!req.user?.isAgent) {
        return res.status(403).json({
            success: false,
            error: 'Agent access required',
        });
    }
    next();
};
exports.requireAgent = requireAgent;
const requireVerified = (req, res, next) => {
    if (!req.user?.isVerified) {
        return res.status(403).json({
            success: false,
            error: 'Email verification required',
        });
    }
    next();
};
exports.requireVerified = requireVerified;
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Authentication required.' });
            return;
        }
        const isAdmin = req.user?.email?.includes('admin') && req.user?.isAgent;
        if (!isAdmin) {
            res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map