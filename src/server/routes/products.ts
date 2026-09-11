import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

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

      if (allProducts.length > 0) {
        return {
          success: true,
          data: allProducts.map(p => ({
            ...p,
            costPrice: Number(p.costPrice),
            sellPrice: Number(p.sellPrice)
          }))
        };
      }
    } catch (error: any) {
      console.warn('DB query failed, fallback to memoryStore:', error.message);
    }

    // Fallback to memoryStore
    const categoryMap = new Map(memoryStore.categories.map(c => [c.id, c.name]));
    const data = memoryStore.products.map(p => ({
      ...p,
      categoryName: categoryMap.get(p.categoryId || '') || 'Lainnya',
      costPrice: Number(p.costPrice),
      sellPrice: Number(p.sellPrice)
    }));

    return { success: true, data };
  })
  .post('/', async ({ body }: { body: any }) => {
    const id = `prod-${Date.now()}`;
    const newProd = {
      id,
      barcode: body.barcode,
      sku: body.sku || `SKU-${Date.now()}`,
      name: body.name,
      categoryId: body.categoryId || null,
      costPrice: (body.costPrice ?? 0).toString(),
      sellPrice: (body.sellPrice ?? 0).toString(),
      stock: body.stock || 0,
      unit: body.unit || 'pcs',
      imageUrl: body.imageUrl || null,
      minStockAlert: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await db.insert(products).values(newProd);
    } catch (error: any) {
      console.warn('DB insert failed, fallback to memoryStore:', error.message);
    }

    memoryStore.products.push(newProd);

    return { success: true, message: 'Produk berhasil ditambahkan', data: newProd };
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
    const imageUrlToSave = body.imageUrl !== undefined ? (body.imageUrl || null) : undefined;
    const costPriceToSave = body.costPrice !== undefined ? body.costPrice.toString() : undefined;
    const sellPriceToSave = body.sellPrice !== undefined ? body.sellPrice.toString() : undefined;

    try {
      await db.update(products)
        .set({
          barcode: body.barcode,
          sku: body.sku,
          name: body.name,
          costPrice: costPriceToSave,
          sellPrice: sellPriceToSave,
          stock: body.stock,
          unit: body.unit,
          imageUrl: imageUrlToSave,
          updatedAt: new Date()
        })
        .where(eq(products.id, params.id));
    } catch (error: any) {
      console.warn('DB update failed, fallback to memoryStore:', error.message);
    }

    const idx = memoryStore.products.findIndex(p => p.id === params.id);
    if (idx !== -1) {
      memoryStore.products[idx] = {
        ...memoryStore.products[idx],
        barcode: body.barcode ?? memoryStore.products[idx].barcode,
        sku: body.sku ?? memoryStore.products[idx].sku,
        name: body.name ?? memoryStore.products[idx].name,
        costPrice: costPriceToSave ?? memoryStore.products[idx].costPrice,
        sellPrice: sellPriceToSave ?? memoryStore.products[idx].sellPrice,
        stock: body.stock ?? memoryStore.products[idx].stock,
        unit: body.unit ?? memoryStore.products[idx].unit,
        imageUrl: imageUrlToSave !== undefined ? imageUrlToSave : memoryStore.products[idx].imageUrl,
        updatedAt: new Date()
      };
    }

    return {
      success: true,
      message: 'Produk berhasil diupdate',
      data: {
        id: params.id,
        barcode: body.barcode,
        sku: body.sku,
        name: body.name,
        costPrice: body.costPrice,
        sellPrice: body.sellPrice,
        stock: body.stock,
        unit: body.unit,
        imageUrl: imageUrlToSave
      }
    };
  })
  .delete('/:id', async ({ params }: { params: { id: string } }) => {
    try {
      await db.delete(products).where(eq(products.id, params.id));
    } catch (error: any) {
      console.warn('DB delete failed, fallback to memoryStore:', error.message);
    }

    memoryStore.products = memoryStore.products.filter(p => p.id !== params.id);

    return { success: true, message: 'Produk berhasil dihapus' };
  });
