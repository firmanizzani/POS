import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { promos } from '../db/schema.js';

export const promoRoutes = new Elysia({ prefix: '/promos' })
  .get('/', async () => {
    try {
      const list = await db.select().from(promos);
      return {
        success: true,
        data: list.map(p => ({
          id: p.id,
          code: p.code,
          title: p.title,
          type: p.discountType.toUpperCase(),
          value: p.discountType === 'percentage' ? `${p.discountValue}%` : `Rp ${Number(p.discountValue).toLocaleString('id-ID')}`,
          minPurchase: Number(p.minPurchase || 0),
          status: p.isActive ? 'ACTIVE' : 'INACTIVE'
        }))
      };
    } catch (e: any) {
      console.error('DB promos error:', e.message);
      return { success: false, message: 'Gagal mengambil data promo: ' + e.message, data: [] };
    }
  })
  .post('/', async ({ body }: { body: any }) => {
    let maxPrmNum = 0;
    const dbPromos = await db.select({ id: promos.id }).from(promos).catch(() => []);
    const numPromoIds = dbPromos.map(p => parseInt(p.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numPromoIds.length > 0) maxPrmNum = Math.max(...numPromoIds);
    const nextPrmNum = maxPrmNum + 1;

    const id = `prm-${nextPrmNum}`;
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
      return {
        success: true,
        message: 'Promo berhasil dibuat',
        data: {
          id: newPromo.id,
          code: newPromo.code,
          title: newPromo.title,
          type: newPromo.discountType.toUpperCase(),
          value: body.value,
          minPurchase: Number(newPromo.minPurchase),
          status: 'ACTIVE'
        }
      };
    } catch (e: any) {
      console.error('DB insert promo error:', e.message);
      return { success: false, message: 'Gagal membuat promo: ' + e.message };
    }
  }, {
    body: t.Object({
      code: t.String(),
      title: t.String(),
      value: t.String(),
      minPurchase: t.Number()
    })
  });
