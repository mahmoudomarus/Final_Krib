"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const NotificationService_1 = require("../services/NotificationService");
const router = (0, express_1.Router)();
const notificationService = new NotificationService_1.NotificationService();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    phone: zod_1.z.string().optional(),
    nationality: zod_1.z.string().default('AE'),
    acceptTerms: zod_1.z.boolean().refine(val => val === true, 'Must accept terms'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
const generateVerificationToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
router.post('/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, saltRounds);
        const verificationToken = generateVerificationToken();
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                password: hashedPassword,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                phone: validatedData.phone,
                nationality: validatedData.nationality,
                verificationToken,
                isVerified: false,
                isActive: true,
                isHost: false,
                isAgent: false,
                acceptedTermsAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                nationality: true,
                isVerified: true,
                isHost: true,
                isAgent: true,
                avatar: true,
                createdAt: true,
            },
        });
        const token = generateToken(user.id);
        try {
            await notificationService.sendEmailVerification(user.email, user.firstName, verificationToken);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.',
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                phone: true,
                nationality: true,
                isVerified: true,
                isActive: true,
                isSuspended: true,
                isHost: true,
                isAgent: true,
                avatar: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        if (!user.isActive || user.isSuspended) {
            return res.status(401).json({
                success: false,
                error: 'Account is suspended or inactive. Please contact support.',
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const token = generateToken(user.id);
        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.',
        });
    }
});
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                nationality: true,
                isVerified: true,
                isHost: true,
                isAgent: true,
                avatar: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user information',
        });
    }
});
router.post('/logout', auth_1.authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
        });
    }
});
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required',
            });
        }
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token',
            });
        }
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified',
            });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verifiedAt: new Date(),
            },
        });
        res.json({
            success: true,
            message: 'Email verified successfully',
        });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Email verification failed',
        });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }
        const resetToken = generateVerificationToken();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
        try {
            await notificationService.sendPasswordReset(user.email, user.firstName, resetToken);
        }
        catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
        }
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process password reset request',
        });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const validatedData = resetPasswordSchema.parse(req.body);
        const user = await prisma.user.findFirst({
            where: {
                resetToken: validatedData.token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token',
            });
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, saltRounds);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                passwordChangedAt: new Date(),
            },
        });
        res.json({
            success: true,
            message: 'Password reset successfully',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Password reset failed',
        });
    }
});
router.post('/refresh-token', auth_1.authMiddleware, async (req, res) => {
    try {
        const newToken = generateToken(req.user.id);
        res.json({
            success: true,
            data: {
                token: newToken,
            },
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed',
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth-prisma-backup.js.map