-- 1. Insert Kategori
INSERT INTO categories (id, name, slug) VALUES
('cat-1', 'Mie & Makanan Instan', 'mie-makanan-instan'),
('cat-2', 'Biskuit & Roti', 'biskuit-roti'),
('cat-3', 'Camilan & Snack', 'camilan-snack'),
('cat-4', 'Air Mineral & Isotonik', 'air-mineral-isotonik'),
('cat-5', 'Minuman Kemasan & Susu', 'minuman-kemasan-susu'),
('cat-6', 'Bumbu & Kebutuhan Dapur', 'bumbu-kebutuhan-dapur'),
('cat-7', 'Sabun & Perawatan Tubuh', 'sabun-perawatan-tubuh'),
('cat-8', 'Kebutuhan Kebersihan Rumah', 'kebutuhan-kebersihan-rumah'),
('cat-9', 'Kebutuhan Ibu & Bayi', 'kebutuhan-ibu-bayi'),
('cat-10', 'Perlengkapan Rumah Tangga', 'perlengkapan-rumah-tangga')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Produk
INSERT INTO products (id, barcode, sku, name, category_id, cost_price, sell_price, stock, min_stock_alert, unit) VALUES
-- Mie & Makanan Instan
('prod-101', '8991000000101', 'INDOMIE-GORENG-SP', 'Indomie Goreng Spesial 85g', 'cat-1', 2800, 3500, 200, 30, 'pcs'),
('prod-102', '8991000000102', 'INDOMIE-AYAM-BWG', 'Indomie Kuah Rasa Ayam Bawang 75g', 'cat-1', 2700, 3400, 150, 24, 'pcs'),
('prod-103', '8991000000103', 'INDOMIE-SOTO-MIE', 'Indomie Kuah Rasa Soto Mie 70g', 'cat-1', 2700, 3400, 150, 24, 'pcs'),
('prod-104', '8991000000104', 'SEDAAP-GORENG-90G', 'Mie Sedaap Goreng 90g', 'cat-1', 2800, 3500, 120, 20, 'pcs'),
('prod-105', '8991000000105', 'POP-MIE-AYAM-75G', 'Pop Mie Rasa Ayam 75g', 'cat-1', 4500, 5500, 60, 12, 'pcs'),
('prod-106', '8991000000106', 'SAMYANG-CARBONARA', 'Samyang Buldak Carbonara 130g', 'cat-1', 18000, 22500, 30, 5, 'pcs'),

-- Biskuit & Roti
('prod-107', '8991000000107', 'OREO-VANILLA-133G', 'Oreo Vanilla 133g', 'cat-2', 7500, 9500, 50, 10, 'pcs'),
('prod-108', '8991000000108', 'ROMA-KELAPA-300G', 'Roma Kelapa 300g', 'cat-2', 9000, 11500, 40, 8, 'pcs'),
('prod-109', '8991000000109', 'KHONG-GUAN-300G', 'Khong Guan Red Assorted Biscuit 300g', 'cat-2', 42000, 49000, 15, 3, 'kaleng'),
('prod-110', '8991000000110', 'TANGO-COKELAT-130G', 'Tango Wafer Cokelat 130g', 'cat-2', 6500, 8000, 45, 10, 'pcs'),
('prod-111', '8991000000111', 'GOOD-TIME-CHOC-72G', 'Good Time Double Choc 72g', 'cat-2', 6000, 7500, 40, 8, 'pcs'),

-- Camilan & Snack
('prod-112', '8991000000112', 'CHITATO-SAPI-68G', 'Chitato Sapi Panggang 68g', 'cat-3', 9000, 11500, 50, 10, 'pcs'),
('prod-113', '8991000000113', 'CHITATO-LITE-68G', 'Chitato Lite Rumput Laut 68g', 'cat-3', 9000, 11500, 40, 10, 'pcs'),
('prod-114', '8991000000114', 'SILVERQUEEN-58G', 'Silverqueen Milk Chocolate 58g', 'cat-3', 12500, 16000, 35, 5, 'pcs'),
('prod-115', '8991000000115', 'KUSUKA-BALADO-180G', 'Kusuka Keripik Singkong Balado 180g', 'cat-3', 11000, 14000, 30, 5, 'pcs'),
('prod-116', '8991000000116', 'BENG-BENG-PACK', 'Beng-Beng Wafer Caramel 20g Pack', 'cat-3', 32000, 40000, 20, 4, 'box'),

-- Air Mineral & Isotonik
('prod-117', '8991000000117', 'LE-MINERALE-600ML', 'Le Minerale 600ml', 'cat-4', 2200, 3500, 120, 24, 'botol'),
('prod-118', '8991000000118', 'AQUA-600ML', 'Aqua Air Mineral 600ml', 'cat-4', 2500, 3800, 120, 24, 'botol'),
('prod-119', '8991000000119', 'AQUA-1500ML', 'Aqua Air Mineral 1500ml', 'cat-4', 5000, 7000, 60, 12, 'botol'),
('prod-120', '8991000000120', 'POCARI-SWEAT-500ML', 'Pocari Sweat 500ml', 'cat-4', 6800, 8500, 48, 10, 'botol'),
('prod-121', '8991000000121', 'MIZONE-APPLE-500ML', 'Mizone Apple Guava 500ml', 'cat-4', 3800, 5000, 36, 8, 'botol'),

-- Minuman Kemasan & Susu
('prod-122', '8991000000122', 'TEH-BOTOL-450ML', 'Teh Botol Sosro 450ml', 'cat-5', 4000, 5500, 80, 15, 'botol'),
('prod-123', '8991000000123', 'ULTRA-COKELAT-250ML', 'Ultra Milk Cokelat 250ml', 'cat-5', 5500, 7000, 60, 12, 'pcs'),
('prod-124', '8991000000124', 'ULTRA-FULLCREAM-1L', 'Ultra Milk Full Cream 1000ml', 'cat-5', 16500, 20000, 24, 6, 'pcs'),
('prod-125', '8991000000125', 'NESCAFE-CAN-220ML', 'Nescafé Original Can 220ml', 'cat-5', 6500, 8500, 48, 10, 'kaleng'),
('prod-126', '8991000000126', 'CIMORY-BLUEBERRY', 'Cimory Yogurt Drink Blueberry 240ml', 'cat-5', 7500, 9500, 30, 6, 'botol'),
('prod-127', '8991000000127', 'COCA-COLA-390ML', 'Coca-Cola 390ml', 'cat-5', 4200, 5500, 60, 12, 'botol'),

-- Bumbu & Kebutuhan Dapur
('prod-128', '8991000000128', 'BIMOLI-1L', 'Minyak Goreng Bimoli 1L', 'cat-6', 16500, 19500, 30, 6, 'pouch'),
('prod-129', '8991000000129', 'SANIA-2L', 'Minyak Goreng Sania 2L', 'cat-6', 32000, 37000, 20, 4, 'pouch'),
('prod-130', '8991000000130', 'GULAKU-PREMIUM-1KG', 'Gula Pasir Gulaku Premium 1kg', 'cat-6', 14500, 17500, 40, 8, 'pack'),
('prod-131', '8991000000131', 'GARAM-KAPAL-250G', 'Garam Dapur Cap Kapal 250g', 'cat-6', 2000, 3000, 50, 10, 'pack'),
('prod-132', '8991000000132', 'ROYCO-AYAM-230G', 'Royco Rasa Ayam 230g', 'cat-6', 8000, 10000, 35, 5, 'pack'),
('prod-133', '8991000000133', 'ABC-KECAP-520ML', 'ABC Kecap Manis Refill 520ml', 'cat-6', 16000, 19500, 25, 5, 'pouch'),
('prod-134', '8991000000134', 'SASA-SERBAGUNA-200G', 'Sasa Tepung Bumbu Serbaguna 200g', 'cat-6', 5000, 6500, 40, 8, 'pack'),

-- Sabun & Perawatan Tubuh
('prod-135', '8991000000135', 'LIFEBUOY-RED-110G', 'Lifebuoy Sabun Mandi Red 110g', 'cat-7', 3800, 5000, 50, 10, 'pcs'),
('prod-136', '8991000000136', 'BIORE-BODYWASH-450', 'Biore Body Wash Pouch 450ml', 'cat-7', 21000, 26000, 20, 4, 'pouch'),
('prod-137', '8991000000137', 'PANTENE-160ML', 'Pantene Shampoo Anti Dandruff 160ml', 'cat-7', 22000, 27500, 20, 4, 'botol'),
('prod-138', '8991000000138', 'PEPSODENT-190G', 'Pepsodent Complete 124 190g', 'cat-7', 10500, 13500, 30, 6, 'pcs'),
('prod-139', '8991000000139', 'FORMULA-SIKAT-GIGI', 'Formula Sikat Gigi Double Action', 'cat-7', 4500, 6000, 40, 8, 'pcs'),
('prod-140', '8991000000140', 'REXONA-ROLLON-45ML', 'Rexona Roll On Women Passion 45ml', 'cat-7', 17000, 21500, 15, 3, 'botol'),

-- Kebutuhan Kebersihan Rumah
('prod-141', '8991000000141', 'RINSO-ANTI-NODA-770', 'Rinso Anti Noda Deterjen Powder 770g', 'cat-8', 19500, 24000, 25, 5, 'pack'),
('prod-142', '8991000000142', 'MAMA-LEMON-680ML', 'Mama Lemon Pencuci Piring Pouch 680ml', 'cat-8', 9000, 11500, 30, 6, 'pouch'),
('prod-143', '8991000000143', 'SO-KLIN-LANTAI-780', 'So Klin Pembersih Lantai Citrus 780ml', 'cat-8', 10000, 13000, 25, 5, 'pouch'),
('prod-144', '8991000000144', 'BAYGON-600ML', 'Baygon Aerosol Tea Blossom 600ml', 'cat-8', 34000, 41000, 15, 3, 'kaleng'),

-- Kebutuhan Ibu & Bayi
('prod-145', '8991000000145', 'MAMYPOKO-M34', 'MamyPoko Pants Standard M34', 'cat-9', 52000, 62000, 15, 3, 'pack'),
('prod-146', '8991000000146', 'MY-BABY-TELON-90ML', 'My Baby Minyak Telon Plus 90ml', 'cat-9', 19000, 23500, 20, 4, 'botol'),
('prod-147', '8991000000147', 'CUSSONS-WIPES-50S', 'Cussons Baby Wipes Sensitive 50s', 'cat-9', 13000, 16500, 25, 5, 'pack'),

-- Perlengkapan Rumah Tangga
('prod-148', '8991000000148', 'PASEO-TISSUE-250S', 'Tissue Paseo Soft Pack 250s', 'cat-10', 11000, 14000, 40, 8, 'pack'),
('prod-149', '8991000000149', 'ABC-ALKALINE-AA', 'Baterai ABC Alkaline AA Pack/2', 'cat-10', 11500, 14500, 30, 6, 'pack'),
('prod-150', '8991000000150', 'TOKAI-GAS-LIGHTER', 'Korek Api Gas Tokai', 'cat-10', 2500, 4000, 100, 20, 'pcs')
ON CONFLICT (id) DO NOTHING;
