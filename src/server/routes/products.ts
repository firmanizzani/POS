import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const productRoutes = new Elysia({ prefix: '/products' })
  .get('/', async () => {
    try {
      const allProducts = await db.select({
        id: products.id,
        barcode: products.barcode,
        sku: products.sku,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        costPrice: products.costPrice,
        sellPrice: products.sellPrice,
        stock: products.stock,
        unit: products.unit,
        imageUrl: products.imageUrl,
        minStockAlert: products.minStockAlert,
        isActive: products.isActive
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

      return {
        success: true,
        data: allProducts.map(p => ({
          ...p,
          costPrice: Number(p.costPrice),
          sellPrice: Number(p.sellPrice)
        }))
      };
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  })
  .post('/', async ({ body }: { body: any }) => {
    try {
      const id = `prod-${Date.now()}`;
      await db.insert(products).values({
        id,
        barcode: body.barcode,
        sku: body.sku || `SKU-${Date.now()}`,
        name: body.name,
        categoryId: body.categoryId || null,
        costPrice: body.costPrice.toString(),
        sellPrice: body.sellPrice.toString(),
        stock: body.stock || 0,
        unit: body.unit || 'pcs',
        imageUrl: body.imageUrl || null
      });

      return { success: true, message: 'Produk berhasil ditambahkan', data: { id, ...body } };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, {
    body: t.Object({
      barcode: t.String(),
      sku: t.Optional(t.String()),
      name: t.String(),
      categoryId: t.Optional(t.Nullable(t.String())),
      costPrice: t.Number(),
      sellPrice: t.Number(),
      stock: t.Optional(t.Number()),
      unit: t.Optional(t.String()),
      imageUrl: t.Optional(t.Nullable(t.String()))
    })
  })
  .put('/:id', async ({ params, body }: { params: { id: string }, body: any }) => {
    try {
      await db.update(products)
        .set({
          barcode: body.barcode,
          sku: body.sku,
          name: body.name,
          costPrice: body.costPrice ? body.costPrice.toString() : undefined,
          sellPrice: body.sellPrice ? body.sellPrice.toString() : undefined,
          stock: body.stock,
          unit: body.unit,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined
        })
        .where(eq(products.id, params.id));

      return { success: true, message: 'Produk berhasil diupdate' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  })
  .delete('/:id', async ({ params }: { params: { id: string } }) => {
    try {
      await db.delete(products).where(eq(products.id, params.id));
      return { success: true, message: 'Produk berhasil dihapus' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });
