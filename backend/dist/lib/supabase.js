"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.supabaseAdmin = void 0;
exports.testSupabaseConnection = testSupabaseConnection;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
}
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
async function testSupabaseConnection() {
    try {
        const { data, error } = await exports.supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);
        if (error) {
            console.error('❌ Supabase connection failed:', error);
            return false;
        }
        console.log('✅ Supabase connection successful');
        console.log(`📊 Found ${data?.length || 0} users in database`);
        return true;
    }
    catch (error) {
        console.error('❌ Supabase connection error:', error);
        return false;
    }
}
exports.default = exports.supabaseAdmin;
//# sourceMappingURL=supabase.js.map