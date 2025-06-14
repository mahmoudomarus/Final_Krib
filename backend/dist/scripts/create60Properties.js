"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function create60Properties() {
    try {
        console.log('🏠 Creating 60+ realistic UAE properties...');
        console.log('👥 Getting or creating host users...');
        let host1 = await prisma.user.findFirst({
            where: { isHost: true }
        });
        let host2 = await prisma.user.findFirst({
            where: {
                isHost: true,
                id: { not: host1?.id || 'none' }
            }
        });
        if (!host1) {
            host1 = await prisma.user.create({
                data: {
                    email: `ahmed.hassan.${Date.now()}@dubairealty.ae`,
                    password: '$2b$10$hashedpassword1',
                    firstName: 'Ahmed',
                    lastName: 'Hassan',
                    phone: `+971501${Math.floor(Math.random() * 900000 + 100000)}`,
                    isHost: true,
                    isVerified: true,
                    verificationLevel: 'VERIFIED',
                    nationality: 'UAE',
                    emirate: 'Dubai',
                    city: 'Dubai',
                    verifiedAt: new Date(),
                }
            });
        }
        if (!host2) {
            host2 = await prisma.user.create({
                data: {
                    email: `fatima.alyahya.${Date.now()}@abudhabiproperties.ae`,
                    password: '$2b$10$hashedpassword2',
                    firstName: 'Fatima',
                    lastName: 'Al Yahya',
                    phone: `+971509${Math.floor(Math.random() * 900000 + 100000)}`,
                    isHost: true,
                    isVerified: true,
                    verificationLevel: 'VERIFIED',
                    nationality: 'UAE',
                    emirate: 'Abu Dhabi',
                    city: 'Abu Dhabi',
                    verifiedAt: new Date(),
                }
            });
        }
        console.log('✅ Host users created');
        const propertyTypes = ['APARTMENT', 'VILLA', 'TOWNHOUSE', 'STUDIO', 'PENTHOUSE'];
        const categories = ['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM'];
        const locations = [
            { emirate: 'Dubai', city: 'Dubai', areas: ['Downtown Dubai', 'Dubai Marina', 'JBR', 'Business Bay', 'Palm Jumeirah', 'DIFC', 'Jumeirah', 'Al Barsha', 'Dubai Hills', 'Arabian Ranches'] },
            { emirate: 'Abu Dhabi', city: 'Abu Dhabi', areas: ['Corniche', 'Al Reem Island', 'Saadiyat Island', 'Yas Island', 'Al Raha Beach', 'Marina', 'Khalifa City', 'Al Reef', 'Masdar City', 'Tourist Club Area'] },
            { emirate: 'Sharjah', city: 'Sharjah', areas: ['Al Majaz', 'Al Qasba', 'Al Khan', 'Muwailih', 'Al Taawun', 'Corniche'] },
            { emirate: 'Ajman', city: 'Ajman', areas: ['Ajman Marina', 'Corniche', 'Al Jurf', 'Al Nuaimiya'] },
            { emirate: 'Ras Al Khaimah', city: 'Ras Al Khaimah', areas: ['Al Hamra', 'Corniche', 'Mina Al Arab', 'Al Marjan Island'] },
            { emirate: 'Fujairah', city: 'Fujairah', areas: ['Corniche', 'Al Gurfa', 'Dibba'] }
        ];
        const amenitiesList = [
            'wifi,kitchen,ac,parking,elevator',
            'wifi,kitchen,ac,parking,pool,gym',
            'wifi,kitchen,ac,parking,pool,gym,balcony,cityView',
            'wifi,kitchen,ac,parking,pool,gym,balcony,seaView,beachAccess',
            'wifi,kitchen,ac,parking,pool,gym,garden,barbecue,playground',
            'wifi,kitchen,ac,parking,butler,concierge,privateBeach,jacuzzi',
            'wifi,kitchen,ac,parking,businessCenter,meetingRoom,laundry',
            'wifi,kitchen,ac,parking,spa,tennis,golf,marinaView'
        ];
        const realImages = [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811,https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde,https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267,https://images.unsplash.com/photo-1586023492125-27b2c045efd7,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'
        ];
        const properties = [];
        for (let i = 1; i <= 65; i++) {
            const location = locations[Math.floor(Math.random() * locations.length)];
            const area = location.areas[Math.floor(Math.random() * location.areas.length)];
            const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const hostId = i % 2 === 0 ? host1.id : host2.id;
            let basePrice = 400;
            if (location.emirate === 'Dubai')
                basePrice = Math.floor(Math.random() * 2000) + 600;
            else if (location.emirate === 'Abu Dhabi')
                basePrice = Math.floor(Math.random() * 1500) + 500;
            else
                basePrice = Math.floor(Math.random() * 800) + 300;
            if (propertyType === 'VILLA')
                basePrice *= 2.5;
            else if (propertyType === 'PENTHOUSE')
                basePrice *= 2;
            else if (propertyType === 'STUDIO')
                basePrice *= 0.6;
            const bedrooms = propertyType === 'STUDIO' ? 0 : Math.floor(Math.random() * 4) + 1;
            const bathrooms = propertyType === 'STUDIO' ? 1 : Math.floor(Math.random() * 3) + 1;
            const guests = propertyType === 'STUDIO' ? 2 : (bedrooms * 2) + Math.floor(Math.random() * 2);
            properties.push({
                id: `property-${i.toString().padStart(3, '0')}`,
                title: `${propertyType === 'STUDIO' ? 'Modern Studio' : `${bedrooms}-Bedroom ${propertyType}`} in ${area}`,
                description: `Beautiful ${propertyType.toLowerCase()} located in ${area}, ${location.city}. Features modern amenities and excellent location with easy access to major attractions and business districts. Perfect for ${category === 'ENTIRE_PLACE' ? 'families or groups' : 'travelers'} looking for comfort and convenience in the heart of ${location.emirate}.`,
                type: propertyType,
                category: category,
                address: `${area}, ${location.city}`,
                city: location.city,
                emirate: location.emirate,
                country: 'UAE',
                latitude: 25.0 + (Math.random() * 0.4),
                longitude: 55.0 + (Math.random() * 0.4),
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                guests: guests,
                area: propertyType === 'STUDIO' ? Math.floor(Math.random() * 30) + 35 :
                    propertyType === 'VILLA' ? Math.floor(Math.random() * 200) + 200 :
                        Math.floor(Math.random() * 100) + 60,
                basePrice: basePrice,
                cleaningFee: Math.floor(basePrice * 0.08),
                securityDeposit: Math.floor(basePrice * 0.4),
                currency: 'AED',
                amenities: amenitiesList[Math.floor(Math.random() * amenitiesList.length)],
                images: realImages[Math.floor(Math.random() * realImages.length)],
                isActive: true,
                isInstantBook: Math.random() > 0.5,
                verificationStatus: 'VERIFIED',
                hostId: hostId,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
            });
        }
        console.log('🧹 Clearing existing properties...');
        await prisma.property.deleteMany({});
        console.log('📝 Creating properties...');
        for (let i = 0; i < properties.length; i++) {
            try {
                await prisma.property.create({
                    data: properties[i]
                });
                if ((i + 1) % 10 === 0) {
                    console.log(`✅ Created ${i + 1}/${properties.length} properties`);
                }
            }
            catch (error) {
                console.log(`⚠️ Skipping property ${i + 1} (already exists)`);
            }
        }
        console.log('🎉 Success! Created 65 realistic UAE properties');
        console.log(`👨‍💼 Host 1 (Ahmed): ${properties.filter(p => p.hostId === host1.id).length} properties`);
        console.log(`👩‍💼 Host 2 (Fatima): ${properties.filter(p => p.hostId === host2.id).length} properties`);
        const byEmirate = {};
        properties.forEach(p => {
            byEmirate[p.emirate] = (byEmirate[p.emirate] || 0) + 1;
        });
        console.log('📍 Properties by Emirate:', byEmirate);
    }
    catch (error) {
        console.error('❌ Error creating properties:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
create60Properties();
//# sourceMappingURL=create60Properties.js.map