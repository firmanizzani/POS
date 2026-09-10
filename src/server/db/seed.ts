import { db } from './index.js';
import { categories, products } from './schema.js';

export async function seedDatabase() {
  console.log('🔄 Cleaning & Seeding Exact Minimarket Database...');

  // Delete existing products and categories first to ensure exact sync
  await db.delete(products);
  await db.delete(categories);

  // 1. Seed Categories
  const categoryData = [
    { id: 'cat-1', name: 'Mie & Makanan Instan', slug: 'mie-makanan-instan' },
    { id: 'cat-2', name: 'Biskuit & Roti', slug: 'biskuit-roti' },
    { id: 'cat-3', name: 'Camilan & Snack', slug: 'camilan-snack' },
    { id: 'cat-4', name: 'Air Mineral & Isotonik', slug: 'air-mineral-isotonik' },
    { id: 'cat-5', name: 'Minuman Kemasan & Susu', slug: 'minuman-kemasan-susu' },
    { id: 'cat-6', name: 'Bumbu & Kebutuhan Dapur', slug: 'bumbu-kebutuhan-dapur' },
    { id: 'cat-7', name: 'Sabun & Perawatan Tubuh', slug: 'sabun-perawatan-tubuh' },
    { id: 'cat-8', name: 'Kebutuhan Kebersihan Rumah', slug: 'kebutuhan-kebersihan-rumah' },
    { id: 'cat-9', name: 'Kebutuhan Ibu & Bayi', slug: 'kebutuhan-ibu-bayi' },
    { id: 'cat-10', name: 'Perlengkapan Rumah Tangga', slug: 'perlengkapan-rumah-tangga' }
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  console.log('✅ 10 Categories seeded.');

  // 2. Seed Products (Exact 49 items from user SQL request)
  const productData = [
    // Mie & Makanan Instan (cat-1)
    { name: 'Indomie Goreng Spesial 85g', categoryId: 'cat-1', costPrice: '2800', sellPrice: '3500', stock: 200, minStockAlert: 30 },
    { name: 'Indomie Kuah Rasa Ayam Bawang 75g', categoryId: 'cat-1', costPrice: '2700', sellPrice: '3400', stock: 150, minStockAlert: 24 },
    { name: 'Indomie Kuah Rasa Soto Mie 70g', categoryId: 'cat-1', costPrice: '2700', sellPrice: '3400', stock: 150, minStockAlert: 24 },
    { name: 'Mie Sedaap Goreng 90g', categoryId: 'cat-1', costPrice: '2800', sellPrice: '3500', stock: 120, minStockAlert: 20 },
    { name: 'Pop Mie Rasa Ayam 75g', categoryId: 'cat-1', costPrice: '4500', sellPrice: '5500', stock: 60, minStockAlert: 12 },
    { name: 'Samyang Buldak Carbonara 130g', categoryId: 'cat-1', costPrice: '18000', sellPrice: '22500', stock: 30, minStockAlert: 5 },

    // Biskuit & Roti (cat-2)
    { name: 'Oreo Vanilla 133g', categoryId: 'cat-2', costPrice: '7500', sellPrice: '9500', stock: 50, minStockAlert: 10 },
    { name: 'Roma Kelapa 300g', categoryId: 'cat-2', costPrice: '9000', sellPrice: '11500', stock: 40, minStockAlert: 8 },
    { name: 'Khong Guan Red Assorted Biscuit 300g', categoryId: 'cat-2', costPrice: '42000', sellPrice: '49000', stock: 15, minStockAlert: 3 },
    { name: 'Tango Wafer Cokelat 130g', categoryId: 'cat-2', costPrice: '6500', sellPrice: '8000', stock: 45, minStockAlert: 10 },
    { name: 'Good Time Double Choc 72g', categoryId: 'cat-2', costPrice: '6000', sellPrice: '7500', stock: 40, minStockAlert: 8 },

    // Camilan & Snack (cat-3)
    { name: 'Chitato Sapi Panggang 68g', categoryId: 'cat-3', costPrice: '9000', sellPrice: '11500', stock: 50, minStockAlert: 10 },
    { name: 'Chitato Lite Rumput Laut 68g', categoryId: 'cat-3', costPrice: '9000', sellPrice: '11500', stock: 40, minStockAlert: 10 },
    { name: 'Silverqueen Milk Chocolate 58g', categoryId: 'cat-3', costPrice: '12500', sellPrice: '16000', stock: 35, minStockAlert: 5 },
    { name: 'Kusuka Keripik Singkong Balado 180g', categoryId: 'cat-3', costPrice: '11000', sellPrice: '14000', stock: 30, minStockAlert: 5 },
    { name: 'Beng-Beng Wafer Caramel 20g Pack', categoryId: 'cat-3', costPrice: '32000', sellPrice: '40000', stock: 20, minStockAlert: 4 },

    // Air Mineral & Isotonik (cat-4)
    { name: 'Le Minerale 600ml', categoryId: 'cat-4', costPrice: '2200', sellPrice: '3500', stock: 120, minStockAlert: 24 },
    { name: 'Aqua Air Mineral 600ml', categoryId: 'cat-4', costPrice: '2500', sellPrice: '3800', stock: 120, minStockAlert: 24 },
    { name: 'Aqua Air Mineral 1500ml', categoryId: 'cat-4', costPrice: '5000', sellPrice: '7000', stock: 60, minStockAlert: 12 },
    { name: 'Pocari Sweat 500ml', categoryId: 'cat-4', costPrice: '6800', sellPrice: '8500', stock: 48, minStockAlert: 10 },
    { name: 'Mizone Apple Guava 500ml', categoryId: 'cat-4', costPrice: '3800', sellPrice: '5000', stock: 36, minStockAlert: 8 },

    // Minuman Kemasan & Susu (cat-5)
    { name: 'Teh Botol Sosro 450ml', categoryId: 'cat-5', costPrice: '4000', sellPrice: '5500', stock: 80, minStockAlert: 15 },
    { name: 'Ultra Milk Cokelat 250ml', categoryId: 'cat-5', costPrice: '5500', sellPrice: '7000', stock: 60, minStockAlert: 12 },
    { name: 'Ultra Milk Full Cream 1000ml', categoryId: 'cat-5', costPrice: '16500', sellPrice: '20000', stock: 24, minStockAlert: 6 },
    { name: 'Nescafé Original Can 220ml', categoryId: 'cat-5', costPrice: '6500', sellPrice: '8500', stock: 48, minStockAlert: 10 },
    { name: 'Cimory Yogurt Drink Blueberry 240ml', categoryId: 'cat-5', costPrice: '7500', sellPrice: '9500', stock: 30, minStockAlert: 6 },
    { name: 'Coca-Cola 390ml', categoryId: 'cat-5', costPrice: '4200', sellPrice: '5500', stock: 60, minStockAlert: 12 },

    // Bumbu & Kebutuhan Dapur (cat-6)
    { name: 'Minyak Goreng Bimoli 1L', categoryId: 'cat-6', costPrice: '16500', sellPrice: '19500', stock: 30, minStockAlert: 6 },
    { name: 'Minyak Goreng Sania 2L', categoryId: 'cat-6', costPrice: '32000', sellPrice: '37000', stock: 20, minStockAlert: 4 },
    { name: 'Gula Pasir Gulaku Premium 1kg', categoryId: 'cat-6', costPrice: '14500', sellPrice: '17500', stock: 40, minStockAlert: 8 },
    { name: 'Garam Dapur Cap Kapal 250g', categoryId: 'cat-6', costPrice: '2000', sellPrice: '3000', stock: 50, minStockAlert: 10 },
    { name: 'Royco Rasa Ayam 230g', categoryId: 'cat-6', costPrice: '8000', sellPrice: '10000', stock: 35, minStockAlert: 5 },
    { name: 'ABC Kecap Manis Refill 520ml', categoryId: 'cat-6', costPrice: '16000', sellPrice: '19500', stock: 25, minStockAlert: 5 },
    { name: 'Sasa Tepung Bumbu Serbaguna 200g', categoryId: 'cat-6', costPrice: '5000', sellPrice: '6500', stock: 40, minStockAlert: 8 },

    // Sabun & Perawatan Tubuh (cat-7)
    { name: 'Lifebuoy Sabun Mandi Red 110g', categoryId: 'cat-7', costPrice: '3800', sellPrice: '5000', stock: 50, minStockAlert: 10 },
    { name: 'Biore Body Wash Pouch 450ml', categoryId: 'cat-7', costPrice: '21000', sellPrice: '26000', stock: 20, minStockAlert: 4 },
    { name: 'Pantene Shampoo Anti Dandruff 160ml', categoryId: 'cat-7', costPrice: '22000', sellPrice: '27500', stock: 20, minStockAlert: 4 },
    { name: 'Pepsodent Complete 124 190g', categoryId: 'cat-7', costPrice: '10500', sellPrice: '13500', stock: 30, minStockAlert: 6 },
    { name: 'Formula Sikat Gigi Double Action', categoryId: 'cat-7', costPrice: '4500', sellPrice: '6000', stock: 40, minStockAlert: 8 },
    { name: 'Rexona Roll On Women Passion 45ml', categoryId: 'cat-7', costPrice: '17000', sellPrice: '21500', stock: 15, minStockAlert: 3 },

    // Kebutuhan Kebersihan Rumah (cat-8)
    { name: 'Rinso Anti Noda Deterjen Powder 770g', categoryId: 'cat-8', costPrice: '19500', sellPrice: '24000', stock: 25, minStockAlert: 5 },
    { name: 'Mama Lemon Pencuci Piring Pouch 680ml', categoryId: 'cat-8', costPrice: '9000', sellPrice: '11500', stock: 30, minStockAlert: 6 },
    { name: 'So Klin Pembersih Lantai Citrus 780ml', categoryId: 'cat-8', costPrice: '10000', sellPrice: '13000', stock: 25, minStockAlert: 5 },
    { name: 'Baygon Aerosol Tea Blossom 600ml', categoryId: 'cat-8', costPrice: '34000', sellPrice: '41000', stock: 15, minStockAlert: 3 },

    // Kebutuhan Ibu & Bayi (cat-9)
    { name: 'MamyPoko Pants Standard M34', categoryId: 'cat-9', costPrice: '52000', sellPrice: '62000', stock: 15, minStockAlert: 3 },
    { name: 'My Baby Minyak Telon Plus 90ml', categoryId: 'cat-9', costPrice: '19000', sellPrice: '23500', stock: 20, minStockAlert: 4 },
    { name: 'Cussons Baby Wipes Sensitive 50s', categoryId: 'cat-9', costPrice: '13000', sellPrice: '16500', stock: 25, minStockAlert: 5 },

    // Perlengkapan Rumah Tangga (cat-10)
    { name: 'Tissue Paseo Soft Pack 250s', categoryId: 'cat-10', costPrice: '11000', sellPrice: '14000', stock: 40, minStockAlert: 8 },
    { name: 'Baterai ABC Alkaline AA Pack/2', categoryId: 'cat-10', costPrice: '11500', sellPrice: '14500', stock: 30, minStockAlert: 6 },
    { name: 'Korek Api Gas Tokai', categoryId: 'cat-10', costPrice: '2500', sellPrice: '4000', stock: 100, minStockAlert: 20 }
  ];

  let index = 100;
  for (const item of productData) {
    index++;
    const barcode = `899${1000000000 + index}`;
    const sku = item.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 20);
    await db.insert(products).values({
      id: `prod-${index}`,
      barcode,
      sku,
      unit: 'pcs',
      ...item
    });
  }

  console.log(`✅ Exactly ${productData.length} Products seeded successfully into Neon DB.`);
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase().catch(console.error);
}
