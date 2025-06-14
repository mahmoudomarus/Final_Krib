"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function seedUsers() {
    try {
        console.log('🌱 Seeding users...');
        await prisma.user.deleteMany({});
        const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
        const users = await Promise.all([
            prisma.user.create({
                data: {
                    email: 'admin@uae-rental.com',
                    password: hashedPassword,
                    firstName: 'Super',
                    lastName: 'Admin',
                    phone: '+971501234567',
                    nationality: 'UAE',
                    isHost: true,
                    isAgent: true,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'john.admin@uae-rental.com',
                    password: hashedPassword,
                    firstName: 'John',
                    lastName: 'Admin',
                    phone: '+971501234568',
                    nationality: 'UAE',
                    isHost: false,
                    isAgent: false,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'agent1@example.com',
                    password: hashedPassword,
                    firstName: 'Sarah',
                    lastName: 'Agent',
                    phone: '+971501234569',
                    nationality: 'UAE',
                    isHost: false,
                    isAgent: true,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'mike.agent@realestate.com',
                    password: hashedPassword,
                    firstName: 'Mike',
                    lastName: 'Johnson',
                    phone: '+971501234570',
                    nationality: 'UAE',
                    isHost: false,
                    isAgent: true,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Abu Dhabi',
                    emirate: 'Abu Dhabi',
                    country: 'UAE',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'host1@example.com',
                    password: hashedPassword,
                    firstName: 'Ahmed',
                    lastName: 'Host',
                    phone: '+971501234571',
                    nationality: 'UAE',
                    isHost: true,
                    isAgent: false,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                    bankName: 'Emirates NBD',
                    bankAccountNumber: '1234567890',
                    iban: 'AE070331234567890123456',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'maria.host@gmail.com',
                    password: hashedPassword,
                    firstName: 'Maria',
                    lastName: 'Santos',
                    phone: '+971501234572',
                    nationality: 'Philippines',
                    isHost: true,
                    isAgent: false,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Sharjah',
                    emirate: 'Sharjah',
                    country: 'UAE',
                    bankName: 'ADCB',
                    bankAccountNumber: '9876543210',
                    iban: 'AE070331234567890987654',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'guest1@example.com',
                    password: hashedPassword,
                    firstName: 'Emma',
                    lastName: 'Guest',
                    phone: '+971501234573',
                    nationality: 'UK',
                    isHost: false,
                    isAgent: false,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'tourist@gmail.com',
                    password: hashedPassword,
                    firstName: 'David',
                    lastName: 'Smith',
                    phone: '+971501234574',
                    nationality: 'US',
                    isHost: false,
                    isAgent: false,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'combo.user@example.com',
                    password: hashedPassword,
                    firstName: 'Alex',
                    lastName: 'Combo',
                    phone: '+971501234575',
                    nationality: 'UAE',
                    isHost: true,
                    isAgent: true,
                    isVerified: true,
                    isActive: true,
                    verificationLevel: 'VERIFIED',
                    kycStatus: 'VERIFIED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                    bankName: 'FAB',
                    bankAccountNumber: '5555666677',
                    iban: 'AE070331234567890555566',
                }
            }),
            prisma.user.create({
                data: {
                    email: 'unverified@example.com',
                    password: hashedPassword,
                    firstName: 'Test',
                    lastName: 'Unverified',
                    phone: '+971501234576',
                    nationality: 'India',
                    isHost: false,
                    isAgent: false,
                    isVerified: false,
                    isActive: true,
                    verificationLevel: 'PENDING',
                    kycStatus: 'NOT_STARTED',
                    city: 'Dubai',
                    emirate: 'Dubai',
                    country: 'UAE',
                }
            }),
        ]);
        console.log('✅ Successfully created test users:');
        console.log('');
        console.log('🔑 Admin Users:');
        console.log('  • admin@uae-rental.com (Super Admin - has all permissions)');
        console.log('  • john.admin@uae-rental.com (Admin - admin interface access)');
        console.log('');
        console.log('🏢 Agent Users:');
        console.log('  • agent1@example.com (Real Estate Agent)');
        console.log('  • mike.agent@realestate.com (Real Estate Agent)');
        console.log('');
        console.log('🏠 Host Users:');
        console.log('  • host1@example.com (Property Host)');
        console.log('  • maria.host@gmail.com (Property Host)');
        console.log('');
        console.log('👤 Guest Users:');
        console.log('  • guest1@example.com (Regular Guest)');
        console.log('  • tourist@gmail.com (Tourist Guest)');
        console.log('');
        console.log('🔄 Combined Role:');
        console.log('  • combo.user@example.com (Agent + Host)');
        console.log('');
        console.log('⚠️  Test User:');
        console.log('  • unverified@example.com (Unverified - for testing verification flow)');
        console.log('');
        console.log('🔐 All users password: password123');
        console.log('');
        console.log('📝 Role Access:');
        console.log('  • Admins: Can access /admin/dashboard and /admin/login');
        console.log('  • Agents: Can access agent features and agent dashboard');
        console.log('  • Hosts: Can access host features and host dashboard');
        console.log('  • Guests: Can access guest features only');
        console.log('');
    }
    catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    seedUsers();
}
exports.default = seedUsers;
//# sourceMappingURL=seedUsers.js.map