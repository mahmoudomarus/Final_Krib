"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const NotificationService_1 = require("../services/NotificationService");
const google_auth_library_1 = require("google-auth-library");
const router = (0, express_1.Router)();
const notificationService = new NotificationService_1.NotificationService();
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.CLIENT_URL || 'http://localhost:3001'}/auth/google/callback`);
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    phone: zod_1.z.string().optional(),
    nationality: zod_1.z.string().default('AE'),
    acceptTerms: zod_1.z.boolean().refine(val => val === true, 'Must accept terms'),
    isHost: zod_1.z.boolean().default(false),
    isAgent: zod_1.z.boolean().default(false),
    role: zod_1.z.enum(['guest', 'host', 'agent']).default('guest'),
    companyName: zod_1.z.string().optional(),
    emiratesId: zod_1.z.string().optional(),
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
const generateToken = (userId, email, isHost = false, isAgent = false) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    return jsonwebtoken_1.default.sign({
        id: userId,
        email,
        isHost,
        isAgent
    }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
router.post('/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { data: existingUser } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', validatedData.email)
            .single();
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }
        const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email: validatedData.email,
            password: validatedData.password,
            email_confirm: true
        });
        if (authError || !authData.user) {
            console.error('Supabase auth error:', authError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create authentication account',
            });
        }
        if (validatedData.role === 'agent' && !validatedData.companyName?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Company name is required for real estate agents',
            });
        }
        const { data: userProfile, error: profileError } = await supabase_1.supabaseAdmin
            .from('users')
            .insert({
            id: authData.user.id,
            email: validatedData.email,
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            phone: validatedData.phone,
            nationality: validatedData.nationality,
            is_host: validatedData.isHost || validatedData.role === 'host',
            is_agent: validatedData.isAgent || validatedData.role === 'agent',
            is_verified: false,
            is_active: true,
            password: 'supabase_auth'
        })
            .select()
            .single();
        if (profileError) {
            console.error('Profile creation error:', profileError);
            await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            if (profileError.code === '23505') {
                if (profileError.message.includes('users_email_key')) {
                    return res.status(400).json({
                        success: false,
                        error: 'An account with this email address already exists',
                    });
                }
                if (profileError.message.includes('users_phone_key')) {
                    return res.status(400).json({
                        success: false,
                        error: 'An account with this phone number already exists',
                    });
                }
            }
            return res.status(500).json({
                success: false,
                error: 'Registration failed. Please try again.',
            });
        }
        const token = generateToken(userProfile.id, userProfile.email, userProfile.isHost, userProfile.isAgent);
        try {
            const { error: emailError } = await supabase_1.supabaseAdmin.auth.resend({
                type: 'signup',
                email: validatedData.email
            });
            if (emailError) {
                console.error('Failed to send verification email:', emailError);
            }
        }
        catch (emailError) {
            console.error('Email service error:', emailError);
        }
        const { password, ...userWithoutPassword } = userProfile;
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
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
        const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email: validatedData.email,
            password: validatedData.password
        });
        if (authError || !authData.user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        const { data: userProfile, error: profileError } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        if (profileError || !userProfile) {
            console.error('Profile fetch error:', profileError);
            return res.status(404).json({
                success: false,
                error: 'User profile not found',
            });
        }
        if (!userProfile.is_active || userProfile.is_suspended) {
            return res.status(401).json({
                success: false,
                error: 'Account is suspended or inactive. Please contact support.',
            });
        }
        await supabase_1.supabaseAdmin
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userProfile.id);
        const token = generateToken(userProfile.id, userProfile.email, userProfile.is_host, userProfile.is_agent);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userProfile,
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
        const { data: userProfile, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, phone, nationality, is_verified, is_host, is_agent, avatar, created_at, last_login_at')
            .eq('id', req.user.id)
            .single();
        if (error || !userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.json({
            success: true,
            data: userProfile,
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
router.get('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const { data: userProfile, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error || !userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found',
            });
        }
        const { password, ...profileData } = userProfile;
        res.json({
            success: true,
            data: profileData,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user profile',
        });
    }
});
router.put('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const allowedFields = [
            'first_name', 'last_name', 'phone', 'nationality', 'avatar',
            'date_of_birth', 'gender', 'occupation', 'address', 'city',
            'emirate', 'country', 'visa_status',
            'company_name', 'company_registration_number', 'business_license',
            'company_address', 'company_phone', 'company_website',
            'agent_license_number', 'years_experience', 'specializations', 'company_logo',
            'host_description', 'host_response_rate', 'host_response_time', 'host_languages',
            'guest_preferences', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship'
        ];
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key) && req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        });
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update',
            });
        }
        updates.updated_at = new Date().toISOString();
        const { data: updatedProfile, error } = await supabase_1.supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();
        if (error) {
            console.error('Profile update error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update profile',
            });
        }
        const { password, ...profileData } = updatedProfile;
        res.json({
            success: true,
            data: profileData,
            message: 'Profile updated successfully',
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
        });
    }
});
router.post('/upload-document', auth_1.authMiddleware, async (req, res) => {
    try {
        const { type } = req.body;
        if (!type || !['emirates_id', 'passport'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid document type. Must be emirates_id or passport',
            });
        }
        const documentUrl = `https://documents.uae-rental.com/${req.user.id}/${type}_${Date.now()}.pdf`;
        const updates = {
            updated_at: new Date().toISOString(),
            kyc_status: 'pending'
        };
        if (type === 'emirates_id') {
            updates.emirates_id = documentUrl;
        }
        else if (type === 'passport') {
            updates.passport_number = documentUrl;
        }
        const { data: updatedProfile, error } = await supabase_1.supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();
        if (error) {
            console.error('Document upload error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save document information',
            });
        }
        res.json({
            success: true,
            message: 'Document uploaded successfully. Verification is pending.',
            data: {
                document_type: type,
                status: 'pending_verification'
            }
        });
    }
    catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload document',
        });
    }
});
router.post('/logout', auth_1.authMiddleware, async (req, res) => {
    try {
        await supabase_1.supabaseAdmin.auth.signOut();
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
        const { data, error } = await supabase_1.supabaseAdmin.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
        });
        if (error || !data.user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token',
            });
        }
        await supabase_1.supabaseAdmin
            .from('users')
            .update({
            is_verified: true,
            updated_at: new Date().toISOString()
        })
            .eq('id', data.user.id);
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
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
            });
        }
        const { data: user, error: userError } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, is_verified')
            .eq('email', email)
            .single();
        if (userError || !user) {
            return res.json({
                success: true,
                message: 'If an account with that email exists and is unverified, a verification email has been sent.',
            });
        }
        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified',
            });
        }
        try {
            const { error: emailError } = await supabase_1.supabaseAdmin.auth.resend({
                type: 'signup',
                email: email
            });
            if (emailError) {
                console.error('Failed to resend verification email:', emailError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send verification email',
                });
            }
        }
        catch (emailError) {
            console.error('Email service error:', emailError);
            return res.status(500).json({
                success: false,
                error: 'Failed to send verification email',
            });
        }
        res.json({
            success: true,
            message: 'Verification email sent successfully',
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend verification email',
        });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        const { error } = await supabase_1.supabaseAdmin.auth.resetPasswordForEmail(validatedData.email, {
            redirectTo: `${process.env.CLIENT_URL}/reset-password`
        });
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
        const { data, error } = await supabase_1.supabaseAdmin.auth.verifyOtp({
            token_hash: validatedData.token,
            type: 'recovery'
        });
        if (error || !data.user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token',
            });
        }
        const { error: updateError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(data.user.id, { password: validatedData.password });
        if (updateError) {
            return res.status(400).json({
                success: false,
                error: 'Failed to update password',
            });
        }
        await supabase_1.supabaseAdmin
            .from('users')
            .update({
            updated_at: new Date().toISOString()
        })
            .eq('id', data.user.id);
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
        const { data: userProfile, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, is_host, is_agent')
            .eq('id', req.user.id)
            .single();
        if (error || !userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const newToken = generateToken(userProfile.id, userProfile.email, userProfile.is_host, userProfile.is_agent);
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
router.post('/google', async (req, res) => {
    try {
        console.log('🔍 Google OAuth request received:', { body: req.body });
        const { token, role = 'guest' } = req.body;
        if (!token) {
            console.log('❌ No Google token provided');
            return res.status(400).json({
                success: false,
                error: 'Google token is required',
            });
        }
        console.log('🔑 Verifying Google token...');
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            console.log('❌ Invalid Google token payload');
            return res.status(400).json({
                success: false,
                error: 'Invalid Google token',
            });
        }
        const { email, given_name, family_name, picture, sub: googleId } = payload;
        console.log('✅ Google token verified:', { email, given_name, family_name, googleId });
        if (!email) {
            console.log('❌ No email in Google payload');
            return res.status(400).json({
                success: false,
                error: 'Email not provided by Google',
            });
        }
        console.log('🔍 Checking if user exists:', email);
        let { data: existingUser } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        let userProfile;
        if (existingUser) {
            console.log('👤 Existing user found, logging in:', existingUser.id);
            userProfile = existingUser;
            await supabase_1.supabaseAdmin
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', existingUser.id);
        }
        else {
            console.log('🆕 Creating new user for:', email);
            const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: {
                    full_name: `${given_name} ${family_name}`,
                    avatar_url: picture,
                    provider: 'google',
                    google_id: googleId
                }
            });
            if (authError || !authData.user) {
                console.error('❌ Supabase auth error:', authError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create authentication account',
                });
            }
            console.log('✅ Supabase auth user created:', authData.user.id);
            const userInsertData = {
                id: authData.user.id,
                email: email,
                first_name: given_name || 'User',
                last_name: family_name || '',
                avatar: picture,
                is_host: role === 'host',
                is_agent: role === 'agent',
                is_verified: true,
                is_active: true,
                password: 'google_oauth',
                nationality: 'AE',
                country: 'UAE'
            };
            console.log('📝 Inserting user profile:', userInsertData);
            const { data: newUserProfile, error: profileError } = await supabase_1.supabaseAdmin
                .from('users')
                .insert(userInsertData)
                .select()
                .single();
            if (profileError) {
                console.error('❌ Profile creation error:', profileError);
                await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return res.status(500).json({
                    success: false,
                    error: 'Registration failed. Please try again.',
                });
            }
            console.log('✅ User profile created:', newUserProfile.id);
            userProfile = newUserProfile;
        }
        const jwtToken = generateToken(userProfile.id, userProfile.email, userProfile.is_host, userProfile.is_agent);
        console.log('🎫 JWT token generated for user:', userProfile.id);
        const { password, ...userWithoutPassword } = userProfile;
        console.log('✅ Google OAuth success:', { userId: userProfile.id, email: userProfile.email });
        res.json({
            success: true,
            message: existingUser ? 'Login successful' : 'Registration successful',
            data: {
                user: userWithoutPassword,
                token: jwtToken,
            },
        });
    }
    catch (error) {
        console.error('❌ Google OAuth error:', error);
        res.status(500).json({
            success: false,
            error: 'Google authentication failed. Please try again.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map