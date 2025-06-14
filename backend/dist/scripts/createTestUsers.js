"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function createTestUsers() {
    console.log('Creating test users...');
    const defaultPassword = await bcryptjs_1.default.hash('password123', 12);
    try {
        console.log('Cleaning up existing test users...');
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: 'guest@test.com' },
                    { email: 'host@test.com' },
                    { email: 'admin@uae-rental.com' },
                    { id: { in: ['test-guest-001', 'test-host-001', 'test-admin-001'] } }
                ]
            }
        });
        const guest = await prisma.user.create({
            data: {
                id: 'test-guest-001',
                email: 'guest@test.com',
                password: defaultPassword,
                firstName: 'Sarah',
                lastName: 'Johnson',
                phone: '+971501111111',
                nationality: 'US',
                isHost: false,
                isVerified: true,
                kycStatus: 'VERIFIED',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b750?w=150',
                address: 'Downtown Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
            },
        });
        const host = await prisma.user.create({
            data: {
                id: 'test-host-001',
                email: 'host@test.com',
                password: defaultPassword,
                firstName: 'Ahmed',
                lastName: 'Al Rashid',
                phone: '+971502222222',
                nationality: 'AE',
                isHost: true,
                isVerified: true,
                kycStatus: 'VERIFIED',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
                address: 'Business Bay',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                bankName: 'Emirates NBD',
                bankAccountNumber: '1234567890',
                iban: 'AE070331234567890123456',
            },
        });
        const admin = await prisma.user.create({
            data: {
                id: 'test-admin-001',
                email: 'admin@uae-rental.com',
                password: defaultPassword,
                firstName: 'Mohammad',
                lastName: 'Al Mansouri',
                phone: '+971503333333',
                nationality: 'AE',
                isHost: true,
                isVerified: true,
                kycStatus: 'VERIFIED',
                avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
                address: 'Al Wasl Road',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
            },
        });
        console.log('✅ Test users created successfully!');
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('👤 Guest User:');
        console.log(`   Email: guest@test.com`);
        console.log(`   Password: password123`);
        console.log(`   ID: ${guest.id}`);
        console.log(`   Phone: ${guest.phone}`);
        console.log('\n🏠 Host User:');
        console.log(`   Email: host@test.com`);
        console.log(`   Password: password123`);
        console.log(`   ID: ${host.id}`);
        console.log(`   Phone: ${host.phone}`);
        console.log('\n👑 Super Admin:');
        console.log(`   Email: admin@uae-rental.com`);
        console.log(`   Password: password123`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Phone: ${admin.phone}`);
        console.log('\n🔧 For API Testing (use as x-user-id header):');
        console.log(`   Guest: ${guest.id}`);
        console.log(`   Host: ${host.id}`);
        console.log(`   Admin: ${admin.id}`);
    }
    catch (error) {
        console.error('❌ Error creating test users:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestUsers();
//# sourceMappingURL=createTestUsers.js.map