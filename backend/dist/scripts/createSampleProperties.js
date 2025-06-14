"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createSampleProperties() {
    try {
        console.log('Creating sample properties...');
        console.log('Cleaning up existing sample properties...');
        await prisma.property.deleteMany({
            where: {
                id: {
                    in: [
                        'burj-khalifa-view-apt',
                        'marina-villa-luxury',
                        'business-bay-studio',
                        'jbr-beachfront-apt',
                        'palm-jumeirah-villa',
                        'deira-heritage-apt',
                        'dubai-hills-family-villa',
                        'sports-city-apartment',
                        'silicon-oasis-townhouse'
                    ]
                }
            }
        });
        const sampleProperties = [
            {
                id: 'burj-khalifa-view-apt',
                title: 'Burj Khalifa View Luxury Apartment',
                description: 'Experience Dubai from this stunning 3-bedroom apartment with breathtaking views of the Burj Khalifa. Located in the heart of Downtown Dubai, this modern space features premium amenities and world-class service.',
                type: 'APARTMENT',
                category: 'ENTIRE_PLACE',
                address: 'Downtown Dubai, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.1972,
                longitude: 55.2744,
                bedrooms: 3,
                bathrooms: 2,
                guests: 6,
                area: 120.5,
                basePrice: 1200,
                cleaningFee: 100,
                securityDeposit: 500,
                currency: 'AED',
                amenities: 'wifi,kitchen,pool,gym,parking,balcony,cityView',
                images: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
                isActive: true,
                isInstantBook: true,
                verificationStatus: 'VERIFIED',
                hostId: 'test-host-001'
            },
            {
                id: 'marina-villa-luxury',
                title: 'Modern Villa with Private Pool',
                description: 'Luxurious 4-bedroom villa in Dubai Marina featuring a private pool, modern design, and stunning marina views. Perfect for families or groups seeking comfort and style.',
                type: 'VILLA',
                category: 'ENTIRE_PLACE',
                address: 'Dubai Marina, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.0657,
                longitude: 55.1413,
                bedrooms: 4,
                bathrooms: 3,
                guests: 8,
                area: 250.0,
                basePrice: 2500,
                cleaningFee: 200,
                securityDeposit: 1000,
                currency: 'AED',
                amenities: 'wifi,kitchen,pool,gym,parking,garden,marinaView',
                images: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800,https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800,https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                isActive: true,
                isInstantBook: true,
                verificationStatus: 'VERIFIED',
                hostId: 'test-host-001'
            },
            {
                id: 'business-bay-studio',
                title: 'Modern Studio with City Views',
                description: 'Stylish studio apartment in Business Bay with floor-to-ceiling windows offering panoramic city views. Ideal for business travelers or couples.',
                type: 'STUDIO',
                category: 'ENTIRE_PLACE',
                address: 'Business Bay, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.1881,
                longitude: 55.2648,
                bedrooms: 0,
                bathrooms: 1,
                guests: 2,
                area: 45.0,
                basePrice: 650,
                cleaningFee: 75,
                securityDeposit: 300,
                currency: 'AED',
                amenities: 'wifi,kitchen,gym,parking,cityView,businessCenter',
                images: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800,https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
                isActive: true,
                isInstantBook: false,
                verificationStatus: 'VERIFIED',
                hostId: 'test-host-001'
            },
            {
                id: 'jbr-beachfront-apt',
                title: 'Beachfront Apartment with Sea View',
                description: 'Wake up to the sound of waves in this beautiful 2-bedroom beachfront apartment at JBR. Direct beach access and stunning Arabian Gulf views.',
                type: 'APARTMENT',
                category: 'ENTIRE_PLACE',
                address: 'JBR, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.0789,
                longitude: 55.1338,
                bedrooms: 2,
                bathrooms: 2,
                guests: 4,
                area: 95.0,
                basePrice: 850,
                cleaningFee: 80,
                securityDeposit: 400,
                currency: 'AED',
                amenities: 'wifi,kitchen,pool,beachAccess,parking,balcony,seaView',
                images: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800,https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
                isActive: true,
                isInstantBook: true,
                verificationStatus: 'VERIFIED',
                hostId: 'test-host-001'
            },
            {
                id: 'palm-jumeirah-villa',
                title: 'Luxury Villa on Palm Jumeirah',
                description: 'Exclusive 5-bedroom villa on the prestigious Palm Jumeirah with private beach, pool, and unparalleled luxury amenities.',
                type: 'VILLA',
                category: 'ENTIRE_PLACE',
                address: 'Palm Jumeirah, Dubai',
                city: 'Dubai',
                emirate: 'Dubai',
                country: 'UAE',
                latitude: 25.1124,
                longitude: 55.1418,
                bedrooms: 5,
                bathrooms: 4,
                guests: 10,
                area: 400.0,
                basePrice: 4500,
                cleaningFee: 300,
                securityDeposit: 2000,
                currency: 'AED',
                amenities: 'wifi,kitchen,pool,privateBeach,parking,garden,butler,seaView',
                images: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800,https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800,https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
                isActive: true,
                isInstantBook: false,
                verificationStatus: 'VERIFIED',
                hostId: 'test-host-001'
            }
        ];
        for (const propertyData of sampleProperties) {
            await prisma.property.create({
                data: propertyData
            });
        }
        console.log('✅ Sample properties created successfully!');
        console.log(`📊 Total properties created: ${sampleProperties.length}`);
        const totalProperties = await prisma.property.count();
        console.log(`🏠 Total properties in database: ${totalProperties}`);
    }
    catch (error) {
        console.error('❌ Error creating sample properties:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createSampleProperties();
//# sourceMappingURL=createSampleProperties.js.map