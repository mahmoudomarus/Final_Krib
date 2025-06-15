import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';

const router = Router();

// Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.CLIENT_URL || 'http://localhost:3001'}/auth/google/callback`
);

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  nationality: z.string().default('AE'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms'),
  isHost: z.boolean().default(false),
  isAgent: z.boolean().default(false),
  role: z.enum(['guest', 'host', 'agent']).default('guest'),
  companyName: z.string().optional(),
  emiratesId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Generate JWT token
const generateToken = (userId: string, email: string, isHost: boolean = false, isAgent: boolean = false) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ 
    id: userId, 
    email, 
    isHost, 
    isAgent 
  }, process.env.JWT_SECRET, { expiresIn: '30d' });
};


// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists in custom users table
    const { data: existingUser } = await supabaseAdmin
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true // Auto-confirm for development
    });

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create authentication account',
      });
    }

    // Validate company name for agents
    if (validatedData.role === 'agent' && !validatedData.companyName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required for real estate agents',
      });
    }

    // Create user profile in custom users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
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
        password: 'supabase_auth' // Placeholder since column exists
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      // Handle specific database constraint errors
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

    // Generate JWT token
    const token = generateToken(userProfile.id, userProfile.email, userProfile.isHost, userProfile.isAgent);

    // Send verification email using Supabase
    try {
      const { error: emailError } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email: validatedData.email
      });
      
      if (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Don't fail registration if email fails
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if email is verified (temporarily disabled for development)
    // if (!authData.user.email_confirmed_at) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Please verify your email before logging in.',
    //   });
    // }

    // Get user profile from custom table
    const { data: userProfile, error: profileError } = await supabaseAdmin
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

    // Check if user is active
    if (!userProfile.is_active || userProfile.is_suspended) {
      return res.status(401).json({
        success: false,
        error: 'Account is suspended or inactive. Please contact support.',
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userProfile.id);

    // Generate JWT token
    const token = generateToken(userProfile.id, userProfile.email, userProfile.is_host, userProfile.is_agent);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userProfile,
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    const { data: userProfile, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
    });
  }
});

// GET /api/auth/profile - Get user profile
router.get('/profile', authMiddleware, async (req: any, res: Response) => {
  try {
    const { data: userProfile, error } = await supabaseAdmin
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

    // Remove sensitive fields
    const { password, ...profileData } = userProfile;

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authMiddleware, async (req: any, res: Response) => {
  try {
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'nationality', 'avatar', 
      'date_of_birth', 'gender', 'occupation', 'address', 'city', 
      'emirate', 'country', 'visa_status',
      // Agent/Company fields
      'company_name', 'company_registration_number', 'business_license',
      'company_address', 'company_phone', 'company_website', 
      'agent_license_number', 'years_experience', 'specializations', 'company_logo',
      // Host fields
      'host_description', 'host_response_rate', 'host_response_time', 'host_languages',
      // Guest fields
      'guest_preferences', 'emergency_contact_name', 'emergency_contact_phone', 
      'emergency_contact_relationship'
    ];
    const updates: any = {};
    
    // Filter only allowed fields
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

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedProfile, error } = await supabaseAdmin
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

    // Remove sensitive fields
    const { password, ...profileData } = updatedProfile;

    res.json({
      success: true,
      data: profileData,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// POST /api/auth/upload-document - Upload identity documents
router.post('/upload-document', authMiddleware, async (req: any, res: Response) => {
  try {
    const { type, fileData, filename, mimetype } = req.body;
    
    if (!type || !['emirates_id', 'passport', 'utility_bill', 'salary_certificate', 'trade_license'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type. Must be emirates_id, passport, utility_bill, salary_certificate, or trade_license',
      });
    }

    if (!fileData || !filename || !mimetype) {
      return res.status(400).json({
        success: false,
        error: 'File data, filename, and mimetype are required',
      });
    }

    // Convert base64 to buffer
    let fileBuffer: Buffer;
    try {
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file data format',
      });
    }

    // Use the file upload service
    const { fileUploadService } = await import('../services/FileUploadService');
    
    const uploadResult = await fileUploadService.uploadDocument({
      userId: req.user.id,
      documentType: type,
      file: fileBuffer,
      filename,
      mimetype
    });

    if (!uploadResult.success) {
      return res.status(400).json({
        success: false,
        error: uploadResult.error || 'Failed to upload document',
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully. Verification is pending.',
      data: {
        document_type: type,
        document_url: uploadResult.url,
        status: 'pending_verification'
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: any, res: Response) => {
  try {
    // Optionally sign out from Supabase (invalidates the session)
    await supabaseAdmin.auth.signOut();
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
      });
    }

    // Verify email with Supabase
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });

    if (error || !data.user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
    }

    // Update user verification status in custom table
    await supabaseAdmin
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
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed',
    });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If an account with that email exists and is unverified, a verification email has been sent.',
      });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Resend verification email using Supabase
    try {
      const { error: emailError } = await supabaseAdmin.auth.resend({
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
    } catch (emailError) {
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
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification email',
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);

    // Send password reset email via Supabase
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });

    // Don't reveal if email exists or not for security
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);

    // Verify the reset token and update password
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: validatedData.token,
      type: 'recovery'
    });

    if (error || !data.user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    // Update password via Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      data.user.id,
      { password: validatedData.password }
    );

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update password',
      });
    }

    // Update passwordChangedAt in custom table
    await supabaseAdmin
      .from('users')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// POST /api/auth/refresh-token
router.post('/refresh-token', authMiddleware, async (req: any, res: Response) => {
  try {
    // Get fresh user data
    const { data: userProfile, error } = await supabaseAdmin
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

    // Generate new token with fresh data
    const newToken = generateToken(userProfile.id, userProfile.email, userProfile.is_host, userProfile.is_agent);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
    });
  }
});

// POST /api/auth/google - Google OAuth login/register
router.post('/google', async (req: Request, res: Response) => {
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
    
    // Verify Google token
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
    
    // Check if user already exists
    let { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let userProfile;

    if (existingUser) {
      console.log('👤 Existing user found, logging in:', existingUser.id);
      
      // User exists - log them in
      userProfile = existingUser;
      
      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingUser.id);
    } else {
      console.log('🆕 Creating new user for:', email);
      
      // Create new user
      
      // First create in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm Google users
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

      // Create user profile in custom users table
      const userInsertData = {
        id: authData.user.id,
        email: email,
        first_name: given_name || 'User',
        last_name: family_name || '',
        avatar: picture,
        is_host: role === 'host',
        is_agent: role === 'agent',
        is_verified: true, // Google users are considered verified
        is_active: true,
        password: 'google_oauth', // Placeholder since column exists
        nationality: 'AE', // Default for UAE platform
        country: 'UAE'
      };
      
      console.log('📝 Inserting user profile:', userInsertData);

      const { data: newUserProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert(userInsertData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return res.status(500).json({
          success: false,
          error: 'Registration failed. Please try again.',
        });
      }

      console.log('✅ User profile created:', newUserProfile.id);
      userProfile = newUserProfile;
    }

    // Generate JWT token
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
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed. Please try again.',
    });
  }
});

export default router; 