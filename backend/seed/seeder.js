require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const slugify = require('slugify');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const categories = [
  { name: 'Electronics', description: 'Phones, laptops, gadgets and more', icon: 'bi-laptop' },
  { name: 'Fashion', description: 'Clothing, footwear and accessories', icon: 'bi-bag-heart' },
  { name: 'Home & Kitchen', description: 'Everything for your home', icon: 'bi-house-heart' },
  { name: 'Beauty & Personal Care', description: 'Skincare, makeup and grooming', icon: 'bi-stars' },
  { name: 'Sports & Outdoors', description: 'Fitness and outdoor gear', icon: 'bi-bicycle' },
  { name: 'Books', description: 'Fiction, non-fiction and academic books', icon: 'bi-book' }
];

const productImage =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop';

const productTemplates = [
  {
    cat: 'Electronics',
    items: [
      {
        name: 'Aura X1 Wireless Noise-Cancelling Headphones',
        price: 8999,
        discountPrice: 6999,
        brand: 'Aura',
        desc: 'Immersive sound with industry-leading active noise cancellation, 40-hour battery life, and plush memory-foam ear cushions for all-day comfort.',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&h=700&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=700&h=700&fit=crop'
        ]
      },
      {
        name: 'Nimbus Pro 15" Ultrabook Laptop',
        price: 74999,
        discountPrice: 68999,
        brand: 'Nimbus',
        desc: 'Featherlight aluminum chassis, 12th Gen processor, 16GB RAM, 512GB SSD and a stunning 2.8K OLED display built for creators and professionals.',
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&h=700&fit=crop',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&h=700&fit=crop'
        ]
      },
      {
        name: 'Pulse Watch SE Smartwatch',
        price: 12999,
        discountPrice: 9499,
        brand: 'Pulse',
        desc: 'Track heart rate, sleep, SpO2 and 100+ workouts. Always-on AMOLED display with 10-day battery life and full smartphone notifications.',
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&h=700&fit=crop',
          'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=700&h=700&fit=crop'
        ]
      },
      {
        name: 'Orbit 65W GaN Fast Charger',
        price: 2499,
        discountPrice: 1799,
        brand: 'Orbit',
        desc: 'Compact 3-port GaN charger delivering 65W of fast-charging power for laptops, tablets and phones simultaneously.',
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700&h=700&fit=crop']
      }
    ]
  },
  {
    cat: 'Fashion',
    items: [
      {
        name: 'Classic Fit Oxford Cotton Shirt',
        price: 1799,
        discountPrice: 1299,
        brand: 'Heritage & Co.',
        desc: 'A timeless wardrobe essential woven from premium long-staple cotton, tailored for a comfortable classic fit that pairs with anything.',
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&h=700&fit=crop',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&h=700&fit=crop'
        ]
      },
      {
        name: 'Urban Trail Running Sneakers',
        price: 4999,
        discountPrice: 3499,
        brand: 'Urban Trail',
        desc: 'Responsive cushioning and a breathable knit upper built for daily runs and everyday wear alike.',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&h=700&fit=crop',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700&h=700&fit=crop'
        ]
      },
      {
        name: 'Everyday Leather Tote Bag',
        price: 3299,
        discountPrice: 0,
        brand: 'Maple Studio',
        desc: 'Full-grain leather tote with spacious interior compartments — perfect for the office, travel or everyday errands.',
        images: ['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=700&h=700&fit=crop']
      }
    ]
  },
  {
    cat: 'Home & Kitchen',
    items: [
      {
        name: 'Brewly Precision Pour-Over Coffee Maker',
        price: 2199,
        discountPrice: 1699,
        brand: 'Brewly',
        desc: 'Borosilicate glass carafe with a precision spout for a smooth, even extraction — barista-quality coffee at home.',
        images: [
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&h=700&fit=crop',
          'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700&h=700&fit=crop'
        ]
      },
      {
        name: 'Hearth 6-Piece Non-Stick Cookware Set',
        price: 5999,
        discountPrice: 4499,
        brand: 'Hearth',
        desc: 'Durable, PFOA-free non-stick cookware with heat-resistant handles — everything you need for a modern kitchen.',
        images: ['https://images.unsplash.com/photo-1584990347449-a7d7c4c8318b?w=700&h=700&fit=crop']
      },
      {
        name: 'Lumen Smart LED Desk Lamp',
        price: 1899,
        discountPrice: 1399,
        brand: 'Lumen',
        desc: 'Adjustable color temperature and brightness with USB charging port, perfect for reading, working or studying.',
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&h=700&fit=crop']
      }
    ]
  },
  {
    cat: 'Beauty & Personal Care',
    items: [
      {
        name: 'Glow Vitamin C Brightening Serum',
        price: 1299,
        discountPrice: 899,
        brand: 'Glow Lab',
        desc: '15% stabilized Vitamin C serum that brightens, evens skin tone and boosts collagen for radiant, healthy-looking skin.',
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&h=700&fit=crop']
      },
      {
        name: 'Silk Touch Hair Styling Dryer',
        price: 3499,
        discountPrice: 2799,
        brand: 'Silk Touch',
        desc: 'Ionic technology reduces frizz and drying time while protecting hair from heat damage.',
        images: ['https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=700&h=700&fit=crop']
      }
    ]
  },
  {
    cat: 'Sports & Outdoors',
    items: [
      {
        name: 'FlexFit Pro Yoga Mat',
        price: 1499,
        discountPrice: 999,
        brand: 'FlexFit',
        desc: 'Extra-thick, non-slip eco-friendly TPE mat with alignment lines for perfect posture in every pose.',
        images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=700&h=700&fit=crop']
      },
      {
        name: 'TrailBlaze 40L Hiking Backpack',
        price: 4299,
        discountPrice: 3299,
        brand: 'TrailBlaze',
        desc: 'Weatherproof 40L backpack with adjustable suspension system, hydration bladder compatibility and multiple compartments.',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&h=700&fit=crop']
      }
    ]
  },
  {
    cat: 'Books',
    items: [
      {
        name: 'The Art of Clean Code (Paperback)',
        price: 899,
        discountPrice: 649,
        brand: 'TechPress',
        desc: 'A practical guide to writing maintainable, elegant and efficient code — a must-read for every software engineer.',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&h=700&fit=crop']
      },
      {
        name: 'Atomic Habits for Developers',
        price: 799,
        discountPrice: 0,
        brand: 'MindWorks',
        desc: 'Build better habits, ship better software, and grow your career one small improvement at a time.',
        images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=700&h=700&fit=crop']
      }
    ]
  }
];

const sampleReviews = [
  { rating: 5, comment: 'Absolutely love this product! Exceeded my expectations.' },
  { rating: 4, comment: 'Great quality and fast delivery. Would buy again.' },
  { rating: 5, comment: 'Best purchase I have made this year. Highly recommend.' },
  { rating: 3, comment: 'Good product but shipping took a bit longer than expected.' }
];

const importData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing data...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();

    console.log('👤 Creating admin & demo users...');
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@codealpha.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin'
    });

    const demoUser = await User.create({
      name: 'Demo Customer',
      email: 'demo@codealpha.com',
      password: 'Demo@12345',
      role: 'user'
    });

    console.log('📁 Creating categories...');
    const categoriesWithSlugs = categories.map((cat) => ({
      ...cat,
      slug: slugify(cat.name, { lower: true, strict: true })
    }));
    const createdCategories = await Category.insertMany(categoriesWithSlugs);
    const categoryMap = {};
    createdCategories.forEach((c) => (categoryMap[c.name] = c._id));

    console.log('📦 Creating products...');
    const productsToInsert = [];

    productTemplates.forEach((group) => {
      group.items.forEach((item, idx) => {
        productsToInsert.push({
          name: item.name,
          slug: slugify(item.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 7),
          description: item.desc,
          shortDescription: item.desc.substring(0, 90) + '...',
          brand: item.brand,
          category: categoryMap[group.cat],
          images: item.images && item.images.length ? item.images : [productImage],
          price: item.price,
          discountPrice: item.discountPrice || 0,
          stock: Math.floor(Math.random() * 40) + 10,
          sku: `SKU-${group.cat.substring(0, 3).toUpperCase()}-${idx + 1}${Date.now().toString().slice(-4)}`,
          specifications: [
            { key: 'Brand', value: item.brand },
            { key: 'Warranty', value: '1 Year Manufacturer Warranty' }
          ],
          tags: [group.cat.toLowerCase(), item.brand.toLowerCase()],
          isFeatured: Math.random() > 0.55,
          reviews: [
            {
              user: demoUser._id,
              name: demoUser.name,
              ...sampleReviews[Math.floor(Math.random() * sampleReviews.length)]
            }
          ]
        });
      });
    });

    const createdProducts = await Product.insertMany(productsToInsert);

    // Recalculate ratings for products with reviews
    for (const product of createdProducts) {
      const doc = await Product.findById(product._id);
      doc.recalculateRating();
      await doc.save();
    }

    console.log('🎟️  Creating coupons...');
    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 500,
        maxDiscount: 500,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usageLimit: 1000
      },
      {
        code: 'FLAT200',
        discountType: 'flat',
        discountValue: 200,
        minPurchase: 1500,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 500
      },
      {
        code: 'MEGA25',
        discountType: 'percentage',
        discountValue: 25,
        minPurchase: 3000,
        maxDiscount: 1500,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 200
      }
    ]);

    console.log('\n✅ Data imported successfully!\n');
    console.log('=========================================');
    console.log(`Admin login:   ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
    console.log(`Demo customer: demo@codealpha.com / Demo@12345`);
    console.log(`Categories:    ${createdCategories.length}`);
    console.log(`Products:      ${createdProducts.length}`);
    console.log(`Coupons:       WELCOME10, FLAT200, MEGA25`);
    console.log('=========================================\n');

    process.exit();
  } catch (error) {
    console.error(`❌ Error importing data: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();
    console.log('🗑️  All data destroyed successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
