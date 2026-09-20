import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { cashierShifts, users, transactions, transactionItems, products, members, promos, heldCarts } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const cashierRoutes = new Elysia({ prefix: '/cashier' })
  // Get all shift audit records directly from DB
  .get('/shifts', async () => {
    try {
      const shiftsFromDb = await db.select({
        id: cashierShifts.id,
        userId: cashierShifts.userId,
        cashierName: users.name,
        clockIn: cashierShifts.clockIn,
        clockOut: cashierShifts.clockOut,
        startingCash: cashierShifts.startingCash,
        expectedCash: cashierShifts.expectedCash,
        actualCash: cashierShifts.actualCash,
        notes: cashierShifts.notes,
        status: cashierShifts.status
      })
      .from(cashierShifts)
      .leftJoin(users, eq(cashierShifts.userId, users.id))
      .orderBy(desc(cashierShifts.clockIn));

      const allTrxs = await db.select({
        id: transactions.id,
        shiftId: transactions.shiftId,
        cashierId: transactions.cashierId,
        grandTotal: transactions.grandTotal,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt
      }).from(transactions).catch(() => []);

      const resultList = shiftsFromDb.map(s => {
        let startingCash = s.startingCash !== null && s.startingCash !== undefined ? Number(s.startingCash) : 0;
        let expectedCash = s.expectedCash !== null && s.expectedCash !== undefined ? Number(s.expectedCash) : 0;
        let actualCash = s.actualCash !== null && s.actualCash !== undefined ? Number(s.actualCash) : null;

        // Auto-correct small scale values if present
        if (startingCash > 0 && startingCash < 1000) startingCash *= 1000;
        if (expectedCash > 0 && expectedCash < 1000) expectedCash *= 1000;
        if (actualCash !== null && actualCash > 0 && actualCash < 1000) actualCash *= 1000;

        const shiftClockIn = s.clockIn ? new Date(s.clockIn).getTime() : 0;
        const shiftClockOut = s.clockOut ? new Date(s.clockOut).getTime() : Infinity;

        const matchingCashTrxs = allTrxs.filter(t => {
          const method = (t.paymentMethod || '').toUpperCase();
          if (method !== 'CASH') return false;
          if (t.shiftId && t.shiftId === s.id) return true;
          const trxTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
          return t.cashierId === s.userId && trxTime >= shiftClockIn && trxTime <= shiftClockOut;
        });

        const salesCash = matchingCashTrxs.reduce((sum, t) => sum + Number(t.grandTotal || 0), 0);
        const isClosed = s.status === 'closed' || !!s.clockOut;
        const computedExpectedCash = expectedCash > 0 ? expectedCash : (startingCash + salesCash);

        let difference: number | null = null;
        if (actualCash !== null) {
          difference = actualCash - computedExpectedCash;
        } else if (isClosed) {
          difference = 0;
        }

        return {
          id: s.id,
          userId: s.userId,
          cashierName: s.cashierName || 'Kasir',
          clockIn: s.clockIn ? new Date(s.clockIn).toISOString() : new Date().toISOString(),
          clockOut: s.clockOut ? new Date(s.clockOut).toISOString() : null,
          startingCash,
          salesCash,
          withdrawalsTotal: 0,
          expectedCash: computedExpectedCash,
          actualCash,
          difference,
          notes: s.notes || '',
          status: isClosed ? 'closed' : 'open'
        };
      });

      return { success: true, data: resultList };
    } catch (e: any) {
      console.error('DB get shifts error:', e.message);
      return { success: false, message: 'Gagal mengambil data shift: ' + e.message, data: [] };
    }
  })

  // Get or Sync Active Shift for logged-in user with carry-over drawer cash
  .get('/shift/active', async ({ query }: { query: { userId?: string } }) => {
    const userId = query.userId || 'user-kasir-1';

    try {
      const dbUsers = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).catch(() => []);
      const cashierName = dbUsers[0]?.name || 'Kasir';

      const dbShifts = await db.select().from(cashierShifts).orderBy(desc(cashierShifts.clockIn));
      const openDbShift = dbShifts.find(s => s.userId === userId && s.status === 'open');

      let activeShift: any = null;

      if (openDbShift) {
        const startingCash = Number(openDbShift.startingCash || 0);
        let computedSalesCash = 0;

        const shiftTrxs = await db.select({
          grandTotal: transactions.grandTotal,
          paymentMethod: transactions.paymentMethod,
          shiftId: transactions.shiftId
        }).from(transactions).catch(() => []);

        for (const t of shiftTrxs) {
          if ((t.paymentMethod || '').toUpperCase() === 'CASH' && t.shiftId === openDbShift.id) {
            computedSalesCash += Number(t.grandTotal || 0);
          }
        }

        activeShift = {
          id: openDbShift.id,
          userId: openDbShift.userId,
          cashierName,
          clockIn: openDbShift.clockIn ? new Date(openDbShift.clockIn).toISOString() : new Date().toISOString(),
          clockOut: null,
          startingCash,
          salesCash: computedSalesCash,
          withdrawalsTotal: 0,
          withdrawalsHistory: [],
          expectedCash: startingCash + computedSalesCash,
          actualCash: null,
          difference: null,
          notes: openDbShift.notes || `Shift ${cashierName} Berjalan`,
          status: 'open'
        };
      } else {
        // No active shift currently open
        activeShift = null;
      }

      return { success: true, data: activeShift };
    } catch (e: any) {
      console.error('DB /shift/active error:', e.message);
      return { success: false, message: 'Gagal mengambil shift aktif: ' + e.message };
    }
  })

  // Shift Management: Clock-In (Kas Awal)
  .post('/shift/clock-in', async ({ body }: { body: any }) => {
    try {
      const dbUsers = await db.select({ name: users.name }).from(users).where(eq(users.id, body.cashierId)).catch(() => []);
      const cashierName = dbUsers[0]?.name || 'Kasir';

      let startingCash = Number(body.startingCash || 0);
      if (startingCash <= 0) {
        const dbShifts = await db.select().from(cashierShifts).orderBy(desc(cashierShifts.clockOut)).catch(() => []);
        const lastClosed = dbShifts.find(s => s.status === 'closed') || dbShifts[0];
        if (lastClosed) {
          startingCash = lastClosed.actualCash !== null && lastClosed.actualCash !== undefined
            ? Number(lastClosed.actualCash)
            : Number(lastClosed.expectedCash || 0);
        }
      }

      let maxShiftNum = 1000;
      const dbShifts = await db.select({ id: cashierShifts.id }).from(cashierShifts).catch(() => []);
      const numShiftIds = dbShifts.map(s => parseInt(s.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
      if (numShiftIds.length > 0) maxShiftNum = Math.max(...numShiftIds);
      const nextShiftNum = maxShiftNum + 1;

      const shiftId = `shift-${nextShiftNum}`;
      const now = new Date();

      const newShift = {
        id: shiftId,
        userId: body.cashierId,
        cashierName,
        clockIn: now.toISOString(),
        clockOut: null,
        startingCash,
        salesCash: 0,
        withdrawalsTotal: 0,
        expectedCash: startingCash,
        actualCash: null,
        difference: null,
        notes: body.notes || 'Shift Aktif',
        status: 'open'
      };

      await db.insert(cashierShifts).values({
        id: shiftId,
        userId: body.cashierId,
        clockIn: now,
        startingCash: startingCash.toString(),
        expectedCash: startingCash.toString(),
        notes: newShift.notes,
        status: 'open'
      });

      return { success: true, message: 'Clock-In Kasir Berhasil', data: newShift };
    } catch (e: any) {
      console.error('DB clock-in error:', e.message);
      return { success: false, message: 'Gagal clock-in: ' + e.message };
    }
  }, {
    body: t.Object({
      cashierId: t.String(),
      startingCash: t.Optional(t.Number()),
      notes: t.Optional(t.String())
    })
  })

  // Shift Management: Update Kas Awal (Modal) Shift Aktif
  .post('/shift/starting-cash', async ({ body }: { body: { shiftId?: string; startingCash: number } }) => {
    const newStartingCash = Number(body.startingCash || 0);

    try {
      if (body.shiftId) {
        await db.update(cashierShifts)
          .set({ startingCash: newStartingCash.toString() })
          .where(eq(cashierShifts.id, body.shiftId));
      }
      return { success: true, message: 'Kas Awal berhasil diperbarui', data: { startingCash: newStartingCash } };
    } catch (e: any) {
      console.error('Failed to update DB starting cash:', e.message);
      return { success: false, message: 'Gagal memperbarui kas awal: ' + e.message };
    }
  }, {
    body: t.Object({
      shiftId: t.Optional(t.String()),
      startingCash: t.Number()
    })
  })

  // Shift Management: Clock-Out (Rekap Laci)
  .post('/shift/clock-out', async ({ body }: { body: any }) => {
    try {
      const clockOutTime = new Date();
      const startingCash = Number(body.startingCash || 0);
      const totalSalesCash = Number(body.totalSalesCash || 0);
      const totalWithdrawals = Number(body.totalWithdrawals || 0);
      const expectedCash = startingCash + totalSalesCash - totalWithdrawals;
      const actualCash = Number(body.actualCash);
      const difference = actualCash - expectedCash;

      const currentShiftId = body.shiftId;

      await db.update(cashierShifts).set({
        clockOut: clockOutTime,
        startingCash: startingCash.toString(),
        expectedCash: expectedCash.toString(),
        actualCash: actualCash.toString(),
        notes: body.notes || '',
        status: 'closed'
      }).where(eq(cashierShifts.id, currentShiftId));

      return {
        success: true,
        message: 'Clock-Out Kasir Berhasil. Shift Selesai.',
        data: {
          shiftId: currentShiftId,
          clockOut: clockOutTime.toISOString(),
          startingCash,
          totalSalesCash,
          totalWithdrawals,
          expectedCash,
          actualCash,
          difference,
          status: 'closed'
        }
      };
    } catch (e: any) {
      console.error('DB clock-out error:', e.message);
      return { success: false, message: 'Gagal clock-out shift: ' + e.message };
    }
  }, {
    body: t.Object({
      shiftId: t.String(),
      startingCash: t.Optional(t.Number()),
      totalSalesCash: t.Optional(t.Number()),
      totalWithdrawals: t.Optional(t.Number()),
      actualCash: t.Number(),
      notes: t.Optional(t.String())
    })
  })

  // Checkout Transaction — Direct Real-time DB Insert + Stock Deduction
  .post('/checkout', async ({ body }: { body: any }) => {
    try {
      let maxTrxNum = 0;
      const dbTrxs = await db.select({ id: transactions.id }).from(transactions).catch(() => []);
      const numTrxIds = dbTrxs.map(t => parseInt(t.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
      if (numTrxIds.length > 0) maxTrxNum = Math.max(...numTrxIds);
      const nextTrxNum = maxTrxNum + 1;

      const invoiceNumber = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${nextTrxNum.toString().padStart(3, '0')}`;
      const now = new Date();
      const trxId = `trx-${nextTrxNum}`;

      let promoId = body.promoId || null;
      let promoCode = body.promoCode || null;
      if (promoCode && !promoId) {
        const dbPromos = await db.select().from(promos).catch(() => []);
        const promo = dbPromos.find(p => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive);
        if (promo) promoId = promo.id;
      }

      let dbShiftId = null;
      if (body.shiftId) {
        const checkShift = await db.select({ id: cashierShifts.id }).from(cashierShifts).where(eq(cashierShifts.id, body.shiftId));
        if (checkShift.length > 0) dbShiftId = body.shiftId;
      }

      let dbMemberId = null;
      if (body.memberId) {
        const checkMember = await db.select({ id: members.id }).from(members).where(eq(members.id, body.memberId));
        if (checkMember.length > 0) dbMemberId = body.memberId;
      }

      let dbCashierId = 'user-kasir-1';
      if (body.cashierId) {
        const checkUser = await db.select({ id: users.id }).from(users).where(eq(users.id, body.cashierId));
        if (checkUser.length > 0) dbCashierId = body.cashierId;
      }

      // 1. Insert Transaction to DB
      await db.insert(transactions).values({
        id: trxId,
        invoiceNumber,
        cashierId: dbCashierId,
        shiftId: dbShiftId,
        memberId: dbMemberId,
        promoId,
        subtotal: body.subtotal.toString(),
        discountTotal: (body.discountTotal || 0).toString(),
        grandTotal: body.grandTotal.toString(),
        paidAmount: body.paidAmount.toString(),
        changeAmount: (body.paidAmount - body.grandTotal).toString(),
        paymentMethod: (body.paymentMethod || 'cash').toLowerCase(),
        earnedPoints: body.earnedPoints || 0,
        createdAt: now
      });

      // 2. Insert Transaction Items & Update Stock in DB
      for (const [idx, item] of (body.items || []).entries()) {
        let dbProdId = item.id;
        const checkProd = await db.select({ id: products.id, stock: products.stock }).from(products).where(eq(products.id, item.id));
        if (checkProd.length === 0) {
          const firstProd = await db.select({ id: products.id, stock: products.stock }).from(products).limit(1);
          if (firstProd.length > 0) dbProdId = firstProd[0].id;
        } else {
          // Deduct stock in DB
          const newStock = Math.max(0, checkProd[0].stock - item.quantity);
          await db.update(products).set({ stock: newStock }).where(eq(products.id, item.id));
        }

        await db.insert(transactionItems).values({
          id: `ti-${nextTrxNum}-${idx + 1}`,
          transactionId: trxId,
          productId: dbProdId,
          productName: item.name,
          costPrice: (item.costPrice || 0).toString(),
          sellPrice: item.sellPrice.toString(),
          quantity: item.quantity,
          subtotal: (item.subtotal || item.sellPrice * item.quantity).toString()
        });
      }

      // 3. Update member points in DB if applicable
      if (body.memberId) {
        const dbMbr = await db.select().from(members).where(eq(members.id, body.memberId)).catch(() => []);
        if (dbMbr.length > 0) {
          const m = dbMbr[0];
          const earned = body.earnedPoints || 0;
          const redeemed = body.redeemedPoints || 0;
          const newPoints = Math.max(0, (m.points || 0) + earned - redeemed);
          let newTier = 'bronze';
          if (newPoints >= 25000) newTier = 'gold';
          else if (newPoints >= 10000) newTier = 'silver';

          await db.update(members).set({ points: newPoints, tier: newTier }).where(eq(members.id, body.memberId));
        }
      }

      return {
        success: true,
        message: 'Transaksi berhasil disimpan ke database',
        data: {
          invoiceNumber,
          grandTotal: body.grandTotal,
          paidAmount: body.paidAmount,
          changeAmount: body.paidAmount - body.grandTotal,
          paymentMethod: body.paymentMethod,
          promoCode,
          memberId: body.memberId,
          earnedPoints: body.earnedPoints || 0,
          timestamp: now.toISOString()
        }
      };
    } catch (e: any) {
      console.error('DB checkout transaction error:', e.message);
      return { success: false, message: 'Gagal memproses transaksi: ' + e.message };
    }
  });
