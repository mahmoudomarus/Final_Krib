import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash password for all users
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  // Create test users
  const testGuest = await prisma.user.upsert({
    where: { email: 'guest@test.com' },
    update: {},
    create: {
      email: 'guest@test.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Ahmed',
      phone: '+971501234567',
      isHost: false,
      isVerified: true,
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE',
    },
  });

  const testHost = await prisma.user.upsert({
    where: { email: 'host@test.com' },
    update: {},
    create: {
      email: 'host@test.com',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Al Mansoori',
      phone: '+971507654321',
      isHost: true,
      isVerified: true,
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE',
      bankName: 'Emirates NBD',
      iban: 'AE070331234567890123456',
    },
  });

  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Fatima',
      lastName: 'Al Zahra',
      phone: '+971509876543',
      isHost: false,
      isAgent: true, // Using isAgent flag for admin functionality
      isVerified: true,
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE',
    },
  });

  const testSuperAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@test.com' },
    update: {},
    create: {
      email: 'superadmin@test.com',
      password: hashedPassword,
      firstName: 'Mohammad',
      lastName: 'Al Rashid',
      phone: '+971506543210',
      isHost: false,
      isAgent: true, // Using isAgent flag for super admin functionality
      isVerified: true,
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE',
    },
  });

  // Create test property
  const testProperty = await prisma.property.upsert({
    where: { id: 'test-property-1' },
    update: {},
    create: {
      id: 'test-property-1',
      title: 'Luxurious Marina View Apartment',
      description: 'Beautiful apartment with stunning marina views in the heart of Dubai Marina.',
      type: 'APARTMENT',
      category: 'ENTIRE_PLACE',
      address: '123 Marina Walk, Dubai Marina',
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE',
      latitude: 25.0772,
      longitude: 55.1395,
      bedrooms: 2,
      bathrooms: 2,
      guests: 4,
      area: 120.5,
      basePrice: 500.0,
      cleaningFee: 100.0,
      securityDeposit: 500.0,
      amenities: 'WiFi,Air Conditioning,Kitchen,Parking,Pool,Gym',
      images: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      isActive: true,
      verificationStatus: 'VERIFIED',
      hostId: testHost.id,
    },
  });

  // Create test booking
  const testBooking = await prisma.booking.upsert({
    where: { id: 'test-booking-1' },
    update: {},
    create: {
      id: 'test-booking-1',
      checkIn: new Date('2024-12-25'),
      checkOut: new Date('2024-12-30'),
      guests: 4,
      baseAmount: 2500.0,
      cleaningFee: 100.0,
      securityDeposit: 500.0,
      serviceFee: 150.0,
      taxes: 250.0,
      totalAmount: 3500.0,
      status: 'CONFIRMED',
      paymentStatus: 'PARTIALLY_PAID',
      paidAmount: 2500.0,
      guestId: testGuest.id,
      propertyId: testProperty.id,
    },
  });

  // Create test payments
  const payment1 = await prisma.payment.upsert({
    where: { id: 'test-payment-1' },
    update: {},
    create: {
      id: 'test-payment-1',
      amount: 2500.0,
      currency: 'AED',
      status: 'COMPLETED',
      type: 'BOOKING_PAYMENT',
      method: 'STRIPE',
      description: 'Booking Payment - 5 nights stay',
      stripePaymentId: 'pi_test_1234567890',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      userId: testGuest.id,
      propertyId: testProperty.id,
      bookingId: testBooking.id,
    },
  });

  const payment2 = await prisma.payment.upsert({
    where: { id: 'test-payment-2' },
    update: {},
    create: {
      id: 'test-payment-2',
      amount: 500.0,
      currency: 'AED',
      status: 'PENDING',
      type: 'SECURITY_DEPOSIT',
      method: 'STRIPE',
      description: 'Security Deposit',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
      userId: testGuest.id,
      propertyId: testProperty.id,
      bookingId: testBooking.id,
    },
  });

  const payment3 = await prisma.payment.upsert({
    where: { id: 'test-payment-3' },
    update: {},
    create: {
      id: 'test-payment-3',
      amount: 150.0,
      currency: 'AED',
      status: 'PENDING',
      type: 'CLEANING_FEE',
      method: 'CHECK',
      description: 'Cleaning Fee',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      adminNotes: 'Payment can be made by check. Please allow 5-7 business days for processing.',
      userId: testGuest.id,
      propertyId: testProperty.id,
      bookingId: testBooking.id,
    },
  });

  // Create test notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: testGuest.id,
        title: 'Payment Successful',
        message: 'Your payment of 2500 AED has been processed successfully.',
        type: 'PAYMENT',
        data: JSON.stringify({ paymentId: payment1.id, amount: 2500 }),
        actionUrl: `/payments/${payment1.id}`,
        actionText: 'View Receipt',
        isRead: false,
      },
      {
        userId: testGuest.id,
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed. We look forward to hosting you!',
        type: 'BOOKING',
        data: JSON.stringify({ bookingId: testBooking.id }),
        actionUrl: `/bookings/${testBooking.id}`,
        actionText: 'View Booking',
        isRead: true,
        readAt: new Date(),
      },
      {
        userId: testGuest.id,
        title: 'Payment Reminder',
        message: 'You have a pending payment of 500 AED due in 2 days.',
        type: 'PAYMENT',
        data: JSON.stringify({ paymentId: payment2.id, amount: 500 }),
        actionUrl: `/payments/${payment2.id}`,
        actionText: 'Pay Now',
        isRead: false,
      },
    ],
  });

  // Create test conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: 'BOOKING',
      hostId: testHost.id,
      propertyId: testProperty.id,
      bookingId: testBooking.id,
      unreadCount: JSON.stringify({ [testGuest.id]: 1, [testHost.id]: 0 }),
      participants: {
        connect: [{ id: testGuest.id }, { id: testHost.id }],
      },
    },
  });

  // Create test messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Hi! I have a question about the check-in process.',
        senderId: testGuest.id,
        conversationId: conversation.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        content: 'Hello! Check-in is at 3 PM. I will send you the access code closer to your arrival date.',
        senderId: testHost.id,
        conversationId: conversation.id,
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      },
      {
        content: 'Perfect, thank you!',
        senderId: testGuest.id,
        conversationId: conversation.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
    ],
  });

  // Create test review
  await prisma.review.create({
    data: {
      overallRating: 4.8,
      cleanlinessRating: 5.0,
      accuracyRating: 4.5,
      checkInRating: 5.0,
      communicationRating: 4.8,
      locationRating: 4.9,
      valueRating: 4.6,
      title: 'Amazing stay with beautiful views!',
      comment: 'The apartment was exactly as described with stunning marina views. Ahmed was very responsive and helpful throughout our stay. Highly recommended!',
      photos: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400,https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      isPublic: true,
      isVerified: true,
      guestId: testGuest.id,
      hostId: testHost.id,
      propertyId: testProperty.id,
      bookingId: testBooking.id,
    },
  });

  // Create analytics events
  await prisma.analyticsEvent.createMany({
    data: [
      {
        eventType: 'PAGE_VIEW',
        eventData: JSON.stringify({ page: '/properties', propertyId: testProperty.id }),
        userId: testGuest.id,
        city: 'Dubai',
        country: 'UAE',
      },
      {
        eventType: 'BOOKING_ATTEMPT',
        eventData: JSON.stringify({ propertyId: testProperty.id, amount: 3500 }),
        userId: testGuest.id,
        city: 'Dubai',
        country: 'UAE',
      },
      {
        eventType: 'PAYMENT',
        eventData: JSON.stringify({ paymentId: payment1.id, amount: 2500, method: 'STRIPE' }),
        userId: testGuest.id,
        city: 'Dubai',
        country: 'UAE',
      },
    ],
  });

  console.log('Database seeded successfully!');
  console.log('Test Users Created:');
  console.log('- Guest:', testGuest.email, '(password: password123)');
  console.log('- Host:', testHost.email, '(password: password123)');
  console.log('- Admin:', testAdmin.email, '(password: password123)');
  console.log('- Super Admin:', testSuperAdmin.email, '(password: password123)');
  console.log('Test property:', testProperty.title);
  console.log('Test booking:', testBooking.id);
  console.log('Test payments:', [payment1.id, payment2.id, payment3.id]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 