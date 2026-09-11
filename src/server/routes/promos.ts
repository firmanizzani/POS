import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { promos } from '../db/schema.js';
import { memoryStore } from '../db/store.js';

export const promoRoutes = new Elysia({ prefix: '/promos' })
  .get('/', async () => {
    try {
      const list = await db.select().from(promos);
      if (list.length > 0) {
        return {
          success: true,
          data: list.map(p => ({
            code: p.code,
            title: p.title,
            type: p.discountType.toUpperCase(),
            value: p.discountType === 'percentage' ? `${p.discountValue}%` : `Rp ${Number(p.discountValue).toLocaleString('id-ID')}`,
            minPurchase: Number(p.minPurchase || 0),
            status: p.isActive ? 'ACTIVE' : 'INACTIVE'
          }))
        };
      }
    } catch (e: any) {
      console.warn('DB promos error, fallback to memoryStore:', e.message);
    }

    const data = memoryStore.promos.map(p => ({
      code: p.code,
      title: p.title,
      type: p.discountType.toUpperCase(),
      value: p.discountType === 'percentage' ? `${p.discountValue}%` : (p.discountValue.toString().includes('Rp') ? p.discountValue : `Rp ${Number(p.discountValue).toLocaleString('id-ID')}`),
      minPurchase: Number(p.minPurchase || 0),
      status: p.isActive ? 'ACTIVE' : 'INACTIVE'
    }));

    return { success: true, data };
  })
  .post('/', async ({ body }: { body: any }) => {
    const id = `prm-${Date.now()}`;
    const isPercent = body.value.includes('%');
    const numericVal = body.value.replace(/[^0-9]/g, '');

    const newPromo = {
      id,
      code: body.code.toUpperCase(),
      title: body.title,
      discountType: isPercent ? 'percentage' : 'fixed',
      discountValue: numericVal || '0',
      minPurchase: body.minPurchase.toString(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    };

    try {
      await db.insert(promos).values(newPromo);
    } catch (e: any) {
      console.warn('DB insert promo error:', e.message);
    }

    memoryStore.promos.unshift(newPromo);

    return {
      success: true,
      message: 'Promo berhasil dibuat',
      data: {
        code: newPromo.code,
        title: newPromo.title,
        type: newPromo.discountType.toUpperCase(),
        value: body.value,
        minPurchase: Number(newPromo.minPurchase),
        status: 'ACTIVE'
      }
    };
  }, {
    body: t.Object({
      code: t.String(),
      title: t.String(),
      value: t.String(),
      minPurchase: t.Number()
    })
  });
