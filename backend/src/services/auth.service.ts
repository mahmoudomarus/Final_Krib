import { supabaseAdmin, supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  // Register with real email verification
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isHost?: boolean;
  }) {
    try {
      // 1. Create user in Supabase Auth (will send verification email)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: false // Require email verification
      });

      if (authError) throw authError;

      // 2. Create user profile in custom users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id, // Use Supabase Auth UUID
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          isHost: userData.isHost || false,
          isVerified: false, // Will be true after email verification
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Send verification email
      const { error: emailError } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email: userData.email
      });

      return { 
        authData, 
        userProfile, 
        message: 'Registration successful! Please check your email to verify your account.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login with Supabase Auth
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        throw new Error('Please verify your email before logging in.');
      }

      // Get user profile
      const profile = await this.getProfile(data.user.id);
      
      // Generate JWT token for backend use
      const token = jwt.sign(
        { 
          userId: data.user.id, 
          email: data.user.email,
          isHost: profile.isHost,
          isAgent: profile.isAgent 
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );
      
      return { ...data, profile, token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get user profile from custom table
  static async getProfile(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Verify email
  static async verifyEmail(token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) throw error;

      // Update user verification status
      if (data.user) {
        await this.updateProfile(data.user.id, { isVerified: true });
      }

      return data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CLIENT_URL}/reset-password`
      });

      if (error) throw error;

      return { message: 'Password reset email sent successfully!' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) throw error;

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      return { message: 'Password updated successfully!' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Logout
  static async logout(accessToken: string) {
    try {
      // Note: For backend logout, we mainly need to invalidate the JWT on frontend
      // Supabase handles session management automatically
      return { message: 'Logged out successfully!' };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Create admin user (internal use)
  static async createAdmin(adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      const result = await this.register({
        ...adminData,
        isHost: true
      });

      // Update admin flags
      await this.updateProfile(result.userProfile.id, {
        isAgent: true,
        isVerified: true
      });

      return result;
    } catch (error) {
      console.error('Create admin error:', error);
      throw error;
    }
  }
} 