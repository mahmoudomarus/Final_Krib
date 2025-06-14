"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_1 = require("../lib/supabase");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    static async register(userData) {
        try {
            const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: false
            });
            if (authError)
                throw authError;
            const { data: userProfile, error: profileError } = await supabase_1.supabaseAdmin
                .from('users')
                .insert({
                id: authData.user.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                isHost: userData.isHost || false,
                isVerified: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
                .select()
                .single();
            if (profileError)
                throw profileError;
            const { error: emailError } = await supabase_1.supabaseAdmin.auth.resend({
                type: 'signup',
                email: userData.email
            });
            return {
                authData,
                userProfile,
                message: 'Registration successful! Please check your email to verify your account.'
            };
        }
        catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    static async login(email, password) {
        try {
            const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error)
                throw error;
            if (!data.user.email_confirmed_at) {
                throw new Error('Please verify your email before logging in.');
            }
            const profile = await this.getProfile(data.user.id);
            const token = jsonwebtoken_1.default.sign({
                userId: data.user.id,
                email: data.user.email,
                isHost: profile.isHost,
                isAgent: profile.isAgent
            }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
            return { ...data, profile, token };
        }
        catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    static async getProfile(userId) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }
    static async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('users')
                .update({
                ...updates,
                updatedAt: new Date().toISOString()
            })
                .eq('id', userId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
    static async verifyEmail(token) {
        try {
            const { data, error } = await supabase_1.supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup'
            });
            if (error)
                throw error;
            if (data.user) {
                await this.updateProfile(data.user.id, { isVerified: true });
            }
            return data;
        }
        catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }
    static async requestPasswordReset(email) {
        try {
            const { error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.CLIENT_URL}/reset-password`
            });
            if (error)
                throw error;
            return { message: 'Password reset email sent successfully!' };
        }
        catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
    static async resetPassword(token, newPassword) {
        try {
            const { data, error } = await supabase_1.supabase.auth.verifyOtp({
                token_hash: token,
                type: 'recovery'
            });
            if (error)
                throw error;
            const { error: updateError } = await supabase_1.supabase.auth.updateUser({
                password: newPassword
            });
            if (updateError)
                throw updateError;
            return { message: 'Password updated successfully!' };
        }
        catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
    static async logout(accessToken) {
        try {
            return { message: 'Logged out successfully!' };
        }
        catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
    static async createAdmin(adminData) {
        try {
            const result = await this.register({
                ...adminData,
                isHost: true
            });
            await this.updateProfile(result.userProfile.id, {
                isAgent: true,
                isVerified: true
            });
            return result;
        }
        catch (error) {
            console.error('Create admin error:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map