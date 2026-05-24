const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await MenuItem.deleteMany({});

        // Create Super Admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'admin@tableflow.com',
            password: 'admin123',
            role: 'superadmin',
            phone: '9999999999'
        });
        console.log('Super Admin created: admin@tableflow.com / admin123');

        // Create Restaurant Owners
        const owner1 = await User.create({
            name: 'Rajesh Kumar',
            email: 'rajesh@spicegarden.com',
            password: 'owner123',
            role: 'owner',
            phone: '9876543210'
        });

        const owner2 = await User.create({
            name: 'Marco Rossi',
            email: 'marco@bellavista.com',
            password: 'owner123',
            role: 'owner',
            phone: '9876543211'
        });

        // Create Customer
        const customer = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'customer123',
            role: 'customer',
            phone: '9876543212'
        });
        console.log('Customer created: john@example.com / customer123');

        

        // Create Restaurants
        const restaurant1 = await Restaurant.create({
            name: 'Spice Garden',
            description: 'Authentic Indian cuisine with a modern twist. Experience the rich flavors of India in an elegant setting with live music and rooftop dining.',
            cuisine: ['Indian', 'North Indian', 'Mughlai'],
            address: { street: '42 MG Road', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' },
            phone: '022-12345678',
            email: 'info@spicegarden.com',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            rating: 4.5,
            totalReviews: 128,
            openingHours: { open: '11:00', close: '23:00' },
            tables: [
                { tableNumber: 1, capacity: 2, isAvailable: true },
                { tableNumber: 2, capacity: 2, isAvailable: true },
                { tableNumber: 3, capacity: 4, isAvailable: true },
                { tableNumber: 4, capacity: 4, isAvailable: true },
                { tableNumber: 5, capacity: 6, isAvailable: true },
                { tableNumber: 6, capacity: 8, isAvailable: true },
                { tableNumber: 7, capacity: 4, isAvailable: true },
                { tableNumber: 8, capacity: 2, isAvailable: true }
            ],
            ownerId: owner1._id,
            isApproved: true,
            isActive: true,
            priceRange: '$$$'
        });

        const restaurant2 = await Restaurant.create({
            name: 'Bella Vista',
            description: 'Fine Italian dining with handmade pasta, wood-fired pizzas, and an extensive wine collection. A romantic atmosphere perfect for special occasions.',
            cuisine: ['Italian', 'Mediterranean', 'European'],
            address: { street: '15 Park Street', city: 'Bangalore', state: 'Karnataka', zipCode: '560001' },
            phone: '080-87654321',
            email: 'info@bellavista.com',
            image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
            rating: 4.7,
            totalReviews: 95,
            openingHours: { open: '12:00', close: '23:30' },
            tables: [
                { tableNumber: 1, capacity: 2, isAvailable: true },
                { tableNumber: 2, capacity: 2, isAvailable: true },
                { tableNumber: 3, capacity: 4, isAvailable: true },
                { tableNumber: 4, capacity: 4, isAvailable: true },
                { tableNumber: 5, capacity: 6, isAvailable: true },
                { tableNumber: 6, capacity: 8, isAvailable: true }
            ],
            ownerId: owner2._id,
            isApproved: true,
            isActive: true,
            priceRange: '$$$$'
        });

        // Update owners with restaurantId
        await User.findByIdAndUpdate(owner1._id, { restaurantId: restaurant1._id });
        await User.findByIdAndUpdate(owner2._id, { restaurantId: restaurant2._id });

        console.log('Owners created:');
        console.log('  rajesh@spicegarden.com / owner123');
        console.log('  marco@bellavista.com / owner123');

        // Seed Menu Items for Spice Garden
        const spiceGardenMenu = [
            { name: 'Butter Chicken', description: 'Tender chicken in creamy tomato-butter sauce with aromatic spices', price: 450, category: 'Main Course', restaurantId: restaurant1._id, isVeg: false, spiceLevel: 'medium', preparationTime: 25 },
            { name: 'Paneer Tikka Masala', description: 'Grilled cottage cheese cubes in rich onion-tomato gravy', price: 380, category: 'Main Course', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'medium', preparationTime: 20 },
            { name: 'Biryani Hyderabadi', description: 'Fragrant basmati rice layered with spiced meat and saffron', price: 520, category: 'Main Course', restaurantId: restaurant1._id, isVeg: false, spiceLevel: 'hot', preparationTime: 35 },
            { name: 'Dal Makhani', description: 'Black lentils slow-cooked overnight with butter and cream', price: 320, category: 'Main Course', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'mild', preparationTime: 15 },
            { name: 'Samosa (2 pcs)', description: 'Crispy golden pastry filled with spiced potatoes and peas', price: 150, category: 'Starters', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'medium', preparationTime: 10 },
            { name: 'Chicken Tikka', description: 'Marinated chicken pieces grilled in tandoor oven', price: 350, category: 'Starters', restaurantId: restaurant1._id, isVeg: false, spiceLevel: 'hot', preparationTime: 20 },
            { name: 'Tandoori Roti', description: 'Whole wheat bread baked in clay oven', price: 60, category: 'Breads', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'mild', preparationTime: 5 },
            { name: 'Garlic Naan', description: 'Soft leavened bread topped with garlic and butter', price: 90, category: 'Breads', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'mild', preparationTime: 5 },
            { name: 'Gulab Jamun', description: 'Soft milk-solid dumplings soaked in rose-flavored sugar syrup', price: 180, category: 'Desserts', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'mild', preparationTime: 10 },
            { name: 'Mango Lassi', description: 'Creamy yogurt drink blended with fresh mango pulp', price: 150, category: 'Beverages', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'mild', preparationTime: 5 },
            { name: 'Masala Chai', description: 'Traditional Indian spiced tea with milk', price: 80, category: 'Beverages', restaurantId: restaurant1._id, isVeg: true, spiceLevel: 'mild', preparationTime: 5 },
        ];

        // Seed Menu Items for Bella Vista
        const bellaVistaMenu = [
            { name: 'Margherita Pizza', description: 'Classic pizza with San Marzano tomatoes, fresh mozzarella, and basil', price: 550, category: 'Pizza', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 20 },
            { name: 'Spaghetti Carbonara', description: 'Traditional Roman pasta with egg, pecorino, guanciale, and black pepper', price: 480, category: 'Pasta', restaurantId: restaurant2._id, isVeg: false, spiceLevel: 'mild', preparationTime: 18 },
            { name: 'Fettuccine Alfredo', description: 'Silky pasta tossed in Parmesan cream sauce', price: 450, category: 'Pasta', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 15 },
            { name: 'Risotto ai Funghi', description: 'Creamy Arborio rice with wild mushrooms and truffle oil', price: 520, category: 'Main Course', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 25 },
            { name: 'Osso Buco', description: 'Braised veal shanks with gremolata and saffron risotto', price: 850, category: 'Main Course', restaurantId: restaurant2._id, isVeg: false, spiceLevel: 'mild', preparationTime: 40 },
            { name: 'Bruschetta', description: 'Toasted bread topped with fresh tomatoes, garlic, and basil', price: 280, category: 'Starters', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 10 },
            { name: 'Caprese Salad', description: 'Fresh buffalo mozzarella with tomatoes and basil drizzle', price: 350, category: 'Starters', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 10 },
            { name: 'Tiramisu', description: 'Classic Italian dessert with layers of espresso-soaked ladyfingers', price: 380, category: 'Desserts', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 10 },
            { name: 'Panna Cotta', description: 'Silky vanilla custard with berry compote', price: 320, category: 'Desserts', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 10 },
            { name: 'Espresso', description: 'Strong Italian espresso from freshly roasted beans', price: 150, category: 'Beverages', restaurantId: restaurant2._id, isVeg: true, spiceLevel: 'mild', preparationTime: 3 },
        ];

        await MenuItem.insertMany([...spiceGardenMenu, ...bellaVistaMenu]);

        // Create Waiters
        const waiter1 = await User.create({
            name: 'Vikram Singh',
            email: 'vikram@spicegarden.com',
            password: 'waiter123',
            role: 'waiter',
            phone: '9876543213',
            restaurantId: restaurant1._id
        });

        const waiter2 = await User.create({
            name: 'Amit Sharma',
            email: 'amit@spicegarden.com',
            password: 'waiter123',
            role: 'waiter',
            phone: '9876543214',
            restaurantId: restaurant1._id
        });

        const waiter3 = await User.create({
            name: 'Luigi Bianchi',
            email: 'luigi@bellavista.com',
            password: 'waiter123',
            role: 'waiter',
            phone: '9876543215',
            restaurantId: restaurant2._id
        });
        console.log('Waiters created: waiter123');

        console.log('Menu items seeded successfully');

        console.log('\n✅ Seed data created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Super Admin:  admin@tableflow.com / admin123');
        console.log('Owner 1:      rajesh@spicegarden.com / owner123');
        console.log('Owner 2:      marco@bellavista.com / owner123');
        console.log('Customer:     john@example.com / customer123');
        console.log('Waiter 1:     vikram@spicegarden.com / waiter123');
        console.log('Waiter 2:     amit@spicegarden.com / waiter123');
        console.log('Waiter 3:     luigi@bellavista.com / waiter123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
