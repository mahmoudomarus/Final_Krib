export declare class AuthService {
    static register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        isHost?: boolean;
    }): Promise<{
        authData: {
            user: import("@supabase/auth-js").User;
        } | {
            user: null;
        };
        userProfile: any;
        message: string;
    }>;
    static login(email: string, password: string): Promise<{
        profile: any;
        token: string;
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
        weakPassword?: import("@supabase/auth-js").WeakPassword;
    } | {
        profile: any;
        token: string;
        user: null;
        session: null;
        weakPassword?: null;
    }>;
    static getProfile(userId: string): Promise<any>;
    static updateProfile(userId: string, updates: any): Promise<any>;
    static verifyEmail(token: string): Promise<{
        user: import("@supabase/auth-js").User | null;
        session: import("@supabase/auth-js").Session | null;
    } | {
        user: null;
        session: null;
    }>;
    static requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    static resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    static logout(accessToken: string): Promise<{
        message: string;
    }>;
    static createAdmin(adminData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        authData: {
            user: import("@supabase/auth-js").User;
        } | {
            user: null;
        };
        userProfile: any;
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map