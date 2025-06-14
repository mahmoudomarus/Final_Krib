"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestProperty() {
    console.log('Creating test property...');
    try {
        await prisma.user.update({
            where: { email: 'host@example.com' },
            data: { isHost: true }
        });
        const property = await prisma.property.create({
            data: {
                title: 'Luxury Apartment in Downtown Dubai',
                description: 'Beautiful 2-bedroom apartment with stunning views of Burj Khalifa and Dubai Fountain. Modern amenities, fully furnished, perfect for business travelers and tourists.',
                type: 'APARTMENT',
                category: 'ENTIRE_PLACE',
                address: 'Downtown Dubai, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.1972,
                longitude: 55.2744,
                bedrooms: 2,
                bathrooms: 2,
                guests: 4,
                area: 120.5,
                basePrice: 450,
                cleaningFee: 50,
                securityDeposit: 500,
                images: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800,https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
                amenities: 'WiFi,Air Conditioning,Kitchen,Washing Machine,TV,Parking,Pool,Gym',
                houseRules: 'No smoking,No pets,No parties',
                isInstantBook: true,
                minStay: 2,
                maxStay: 30,
                checkInTime: '15:00',
                checkOutTime: '11:00',
                hostId: 'cmbk50h5v0001chg28v5dha8z',
                isActive: true,
                verificationStatus: 'VERIFIED'
            }
        });
        const property2 = await prisma.property.create({
            data: {
                title: 'Cozy Studio in Marina',
                description: 'Modern studio apartment in Dubai Marina with marina views. Perfect for solo travelers or couples. Walking distance to beach and metro.',
                type: 'STUDIO',
                category: 'ENTIRE_PLACE',
                address: 'Dubai Marina, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.0657,
                longitude: 55.1713,
                bedrooms: 0,
                bathrooms: 1,
                guests: 2,
                area: 45.0,
                basePrice: 280,
                cleaningFee: 30,
                securityDeposit: 300,
                images: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800,https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
                amenities: 'WiFi,Air Conditioning,Kitchen,TV,Pool,Gym,Beach Access',
                houseRules: 'No smoking,No pets',
                isInstantBook: false,
                minStay: 1,
                maxStay: 14,
                checkInTime: '14:00',
                checkOutTime: '12:00',
                hostId: 'cmbk50h5v0001chg28v5dha8z',
                isActive: true,
                verificationStatus: 'VERIFIED'
            }
        });
        console.log('✅ Test properties created successfully!');
        console.log(`Property 1: ${property.title} (ID: ${property.id})`);
        console.log(`Property 2: ${property2.title} (ID: ${property2.id})`);
    }
    catch (error) {
        console.error('❌ Error creating test properties:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestProperty();
//# sourceMappingURL=createTestProperty.js.map