import { Elysia, t } from 'elysia';

export const productRoutes = new Elysia({ prefix: '/products' })
  .get('/', ({ query }) => {
    // Return sample/mock product data or query DB
    return {
      success: true,
      data: [
        {
          id: 'prod-1',
          barcode: '899100110011',
          sku: 'IND-MIE-GORENG',
          name: 'Indomie Goreng Original 85g',
          categoryId: 'cat-1',
          categoryName: 'Makanan',
          costPrice: 2800,
          sellPrice: 3200,
          stock: 120,
          unit: 'pcs',
          imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300',
          isActive: true
        },
        {
          id: 'prod-2',
          barcode: '899200220022',
          sku: 'AQUA-600ML',
          name: 'Air Mineral Aqua 600ml',
          categoryId: 'cat-2',
          categoryName: 'Minuman',
          costPrice: 2500,
          sellPrice: 3500,
          stock: 85,
          unit: 'botol',
          imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300',
          isActive: true
        },
        {
          id: 'prod-3',
          barcode: '899300330033',
          sku: 'MILO-3IN1',
          name: 'Milo Powder 3in1 20g',
          categoryId: 'cat-2',
          categoryName: 'Minuman',
          costPrice: 2200,
          sellPrice: 3000,
          stock: 45,
          unit: 'sachet',
          imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300',
          isActive: true
        },
        {
          id: 'prod-4',
          barcode: '899400440044',
          sku: 'CHITATO-68G',
          name: 'Chitato Sapi Panggang 68g',
          categoryId: 'cat-3',
          categoryName: 'Snack',
          costPrice: 8500,
          sellPrice: 11000,
          stock: 30,
          unit: 'pcs',
          imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
          isActive: true
        }
      ]
    };
  })
  .post('/', ({ body }: { body: any }) => {
    return { success: true, message: 'Produk berhasil ditambahkan', data: body };
  }, {
    body: t.Object({
      barcode: t.String(),
      sku: t.String(),
      name: t.String(),
      categoryId: t.String(),
      costPrice: t.Number(),
      sellPrice: t.Number(),
      stock: t.Number(),
      unit: t.String(),
      imageUrl: t.Optional(t.String())
    })
  });
