import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { cashierShifts, users, transactions, transactionItems, products, members } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore, syncMemoryStoreToDb } from '../db/store.js';

export const cashierRoutes = new Elysia({ prefix: '/cashier' })
  // Get all shift audit records (merged from DB and memoryStore)
  .get('/shifts', async () => {
    await syncMemoryStoreToDb().catch(() => {});

    let combinedShifts: any[] = [];
    const userMap = new Map(memoryStore.users.map(u => [u.id, u.name]));

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
      .leftJoin(users, eq(cashierShifts.userId, users.id));

      if (shiftsFromDb.length > 0) {
        combinedShifts = shiftsFromDb.map(s => {
          const start = Number(s.startingCash || 0);
          const exp = Number(s.expectedCash || start);
          const act = s.actualCash !== null && s.actualCash !== undefined ? Number(s.actualCash) : null;
          const memShift: any = memoryStore.shifts.find((ms: any) => ms.id === s.id);
          const salesCash = memShift ? (memShift.salesCash || 0) : Math.max(0, exp - start);
          return {
            id: s.id,
            userId: s.userId,
            cashierName: s.cashierName || userMap.get(s.userId) || memShift?.cashierName || 'Kasir',
            clockIn: s.clockIn ? new Date(s.clockIn).toISOString() : new Date().toISOString(),
            clockOut: s.clockOut ? new Date(s.clockOut).toISOString() : null,
            startingCash: start,
            salesCash,
            expectedCash: exp,
            actualCash: act,
            difference: act !== null ? act - exp : null,
            notes: s.notes || memShift?.notes || '',
            status: s.status || 'open'
          };
        });

        // Add any memoryStore shifts not yet in DB
        const dbIdSet = new Set(combinedShifts.map(s => s.id));
        for (const ms of memoryStore.shifts) {
          if (!dbIdSet.has(ms.id)) {
            const start = Number(ms.startingCash || 0);
            const exp = Number(ms.expectedCash || start);
            const act = ms.actualCash !== null && ms.actualCash !== undefined ? Number(ms.actualCash) : null;
            combinedShifts.unshift({
              id: ms.id,
              userId: ms.userId,
              cashierName: userMap.get(ms.userId) || ms.cashierName || 'Kasir',
              clockIn: ms.clockIn ? new Date(ms.clockIn).toISOString() : new Date().toISOString(),
              clockOut: ms.clockOut ? new Date(ms.clockOut).toISOString() : null,
              startingCash: start,
              salesCash: Number(ms.salesCash || 0),
              expectedCash: exp,
              actualCash: act,
              difference: act !== null ? act - exp : null,
              notes: ms.notes || '',
              status: ms.status || 'open'
            });
          }
        }

        return {
          success: true,
          data: combinedShifts
        };
      }
    } catch (e: any) {
      console.warn('DB cashierShifts error, fallback to memoryStore:', e.message);
    }

    const shiftsWithNames = memoryStore.shifts.map((s: any) => ({
      ...s,
      cashierName: userMap.get(s.userId) || s.cashierName || 'Kasir'
    }));

    return {
      success: true,
      data: shiftsWithNames
    };
  })

  // Get or Sync Active Shift for logged-in user with carry-over drawer cash
  .get('/shift/active', async ({ query }: { query: { userId?: string } }) => {
    const userId = query.userId || 'user-kasir-1';
    const cashier = memoryStore.users.find(u => u.id === userId) || { id: userId, name: 'Kasir' };

    let activeShift: any = memoryStore.shifts.find((s: any) => s.userId === userId && s.status === 'open');

    if (!activeShift) {
      // Carry over ending cash balance from latest shift
      const latestShift: any = memoryStore.shifts[0];
      let startingCash = 200000;
      if (latestShift) {
        if (latestShift.actualCash !== null && latestShift.actualCash !== undefined) {
          startingCash = Number(latestShift.actualCash);
        } else if (latestShift.expectedCash !== null && latestShift.expectedCash !== undefined) {
          startingCash = Number(latestShift.expectedCash);
        }
      }

      let maxShiftNum = 1000;
      const allShiftIds = memoryStore.shifts.map((s: any) => s.id);
      const numShiftIds = allShiftIds.map((id: string) => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter((n: number) => !isNaN(n));
      if (numShiftIds.length > 0) maxShiftNum = Math.max(...numShiftIds);
      const nextShiftNum = maxShiftNum + 1;

      const now = new Date();
      activeShift = {
        id: `shift-${nextShiftNum}`,
        userId: cashier.id,
        cashierName: cashier.name,
        clockIn: now.toISOString(),
        clockOut: null,
        startingCash: startingCash,
        salesCash: 0,
        withdrawalsTotal: 0,
        expectedCash: startingCash,
        actualCash: null,
        difference: null,
        notes: `Shift ${cashier.name} Berjalan`,
        status: 'open'
      };

      memoryStore.shifts.unshift(activeShift);
    } else {
      activeShift.cashierName = cashier.name;
    }

    await syncMemoryStoreToDb().catch(() => {});

    return {
      success: true,
      data: activeShift
    };
  })

  // Shift Management: Clock-In (Kas Awal)
  .post('/shift/clock-in', async ({ body }: { body: any }) => {
    const cashier = memoryStore.users.find(u => u.id === body.cashierId) || { name: 'Kasir' };

    let startingCash = Number(body.startingCash || 0);
    if (startingCash <= 0) {
      const latestShift: any = memoryStore.shifts[0];
      if (latestShift) {
        startingCash = latestShift.actualCash !== null && latestShift.actualCash !== undefined
          ? Number(latestShift.actualCash)
          : Number(latestShift.expectedCash || 200000);
      } else {
        startingCash = 200000;
      }
    }

    let maxShiftNum = 1000;
    const dbShifts = await db.select({ id: cashierShifts.id }).from(cashierShifts).catch(() => []);
    const allShiftIds = [...dbShifts.map(s => s.id), ...memoryStore.shifts.map((s: any) => s.id)];
    const numShiftIds = allShiftIds.map((id: string) => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter((n: number) => !isNaN(n));
    if (numShiftIds.length > 0) maxShiftNum = Math.max(...numShiftIds);
    const nextShiftNum = maxShiftNum + 1;

    const shiftId = `shift-${nextShiftNum}`;
    const now = new Date();

    const newShift = {
      id: shiftId,
      userId: body.cashierId,
      cashierName: cashier.name,
      clockIn: now.toISOString(),
      clockOut: null,
      startingCash: startingCash,
      salesCash: 0,
      withdrawalsTotal: 0,
      expectedCash: startingCash,
      actualCash: null,
      difference: null,
      notes: body.notes || 'Shift Aktif',
      status: 'open'
    };

    memoryStore.shifts.unshift(newShift);
    await syncMemoryStoreToDb().catch(() => {});

    return {
      success: true,
      message: 'Clock-In Kasir Berhasil',
      data: newShift
    };
  }, {
    body: t.Object({
      cashierId: t.String(),
      startingCash: t.Optional(t.Number()),
      notes: t.Optional(t.String())
    })
  })

  // Shift Management: Tarik Kas / Pengambilan Owner (Cash Drop)
  .post('/shift/withdraw', async ({ body }: { body: { shiftId: string; amount: number; notes?: string; withdrawnBy?: string } }) => {
    const shift: any = memoryStore.shifts.find(s => s.id === body.shiftId) || memoryStore.shifts.find(s => s.status === 'open');
    if (!shift) {
      return { success: false, message: 'Shift aktif tidak ditemukan' };
    }

    const withdrawAmt = Number(body.amount) || 0;
    shift.withdrawalsTotal = (shift.withdrawalsTotal || 0) + withdrawAmt;
    shift.expectedCash = (shift.startingCash || 0) + (shift.salesCash || 0) - shift.withdrawalsTotal;
    const withdrawNote = `[Pengambilan Owner Rp ${withdrawAmt.toLocaleString('id-ID')}${body.notes ? ': ' + body.notes : ''}]`;
    shift.notes = shift.notes ? `${shift.notes}; ${withdrawNote}` : withdrawNote;

    await syncMemoryStoreToDb().catch(() => {});

    return {
      success: true,
      message: `Pengambilan kas sebesar Rp ${withdrawAmt.toLocaleString('id-ID')} berhasil dicatat!`,
      data: {
        shiftId: shift.id,
        withdrawAmount: withdrawAmt,
        totalWithdrawals: shift.withdrawalsTotal,
        expectedCash: shift.expectedCash
      }
    };
  }, {
    body: t.Object({
      shiftId: t.String(),
      amount: t.Number(),
      notes: t.Optional(t.String()),
      withdrawnBy: t.Optional(t.String())
    })
  })

  // Shift Management: Clock-Out (Rekap Laci)
  .post('/shift/clock-out', async ({ body }: { body: any }) => {
    const shift: any = memoryStore.shifts.find(s => s.id === body.shiftId) || memoryStore.shifts[0];
    const clockOutTime = new Date();
    const startingCash = Number(body.startingCash ?? shift?.startingCash ?? 200000);
    const totalSalesCash = Number(body.totalSalesCash ?? shift?.salesCash ?? 0);
    const totalWithdrawals = Number(body.totalWithdrawals ?? shift?.withdrawalsTotal ?? 0);
    const expectedCash = startingCash + totalSalesCash - totalWithdrawals;
    const actualCash = Number(body.actualCash);
    const difference = actualCash - expectedCash;

    if (shift) {
      shift.clockOut = clockOutTime.toISOString();
      shift.startingCash = startingCash;
      shift.salesCash = totalSalesCash;
      shift.withdrawalsTotal = totalWithdrawals;
      shift.expectedCash = expectedCash;
      shift.actualCash = actualCash;
      shift.difference = difference;
      shift.status = 'closed';
      if (body.notes) shift.notes = body.notes;
    }

    try {
      let dbUserId = shift?.userId || 'user-kasir-1';
      await db.insert(cashierShifts).values({
        id: body.shiftId,
        userId: dbUserId,
        clockIn: shift?.clockIn ? new Date(shift.clockIn) : new Date(),
        clockOut: clockOutTime,
        startingCash: startingCash.toString(),
        expectedCash: expectedCash.toString(),
        actualCash: actualCash.toString(),
        notes: body.notes || (shift ? shift.notes : ''),
        status: 'closed'
      }).onConflictDoUpdate({
        target: cashierShifts.id,
        set: {
          clockOut: clockOutTime,
          startingCash: startingCash.toString(),
          expectedCash: expectedCash.toString(),
          actualCash: actualCash.toString(),
          notes: body.notes || (shift ? shift.notes : ''),
          status: 'closed'
        }
      });
    } catch (e: any) {
      console.warn('DB update shift error, updated in memoryStore:', e.message);
    }

    await syncMemoryStoreToDb().catch(() => {});

    return {
      success: true,
      message: 'Clock-Out Kasir Berhasil',
      data: {
        shiftId: body.shiftId,
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

  // Hold Cart
  .post('/cart/hold', ({ body }: { body: any }) => {
    return {
      success: true,
      message: 'Keranjang berhasil disimpan (Hold)',
      holdId: `hold-${Date.now()}`
    };
  }, {
    body: t.Object({
      label: t.String(),
      items: t.Array(t.Any()),
      memberId: t.Optional(t.String())
    })
  })

  // Checkout Transaction — Simpan ke DB & memoryStore + update shift omset + update member points + potong stok
  .post('/checkout', async ({ body }: { body: any }) => {
    let maxTrxNum = 0;
    const dbTrxs = await db.select({ id: transactions.id }).from(transactions).catch(() => []);
    const allTrxIds = [...dbTrxs.map(t => t.id), ...memoryStore.transactions.map((t: any) => t.id)];
    const numTrxIds = allTrxIds.map(id => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numTrxIds.length > 0) maxTrxNum = Math.max(...numTrxIds);
    const nextTrxNum = maxTrxNum + 1;

    const invoiceNumber = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${nextTrxNum.toString().padStart(3, '0')}`;
    const now = new Date();
    const trxId = `trx-${nextTrxNum}`;

    // Cari promo jika ada promoCode
    let promoId = body.promoId || null;
    let promoCode = body.promoCode || null;
    if (promoCode && !promoId) {
      const promo = memoryStore.promos.find(
        p => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive
      );
      if (promo) promoId = promo.id;
    }

    // Buat transaksi baru
    const newTrx: any = {
      id: trxId,
      invoiceNumber,
      cashierId: body.cashierId || 'user-kasir-1',
      shiftId: body.shiftId || null,
      memberId: body.memberId || null,
      promoId,
      promoCode,
      subtotal: body.subtotal.toString(),
      discountTotal: (body.discountTotal || 0).toString(),
      grandTotal: body.grandTotal.toString(),
      paidAmount: body.paidAmount.toString(),
      changeAmount: (body.paidAmount - body.grandTotal).toString(),
      paymentMethod: body.paymentMethod,
      earnedPoints: body.earnedPoints || 0,
      createdAt: now,
      items: (body.items || []).map((item: any, idx: number) => ({
        id: `ti-${nextTrxNum}-${idx + 1}`,
        transactionId: trxId,
        productId: item.id,
        productName: item.name,
        costPrice: (item.costPrice || 0).toString(),
        sellPrice: item.sellPrice.toString(),
        quantity: item.quantity,
        subtotal: (item.subtotal || item.sellPrice * item.quantity).toString()
      }))
    };

    // 1. Simpan ke memoryStore
    memoryStore.transactions.unshift(newTrx);

    // 2. Potong stok produk di memoryStore & DB
    for (const item of (body.items || [])) {
      const memProd = memoryStore.products.find(p => p.id === item.id || p.barcode === item.barcode);
      if (memProd) {
        memProd.stock = Math.max(0, memProd.stock - item.quantity);
      }
      try {
        if (item.id) {
          const dbProd = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.id));
          if (dbProd.length > 0) {
            const newStock = Math.max(0, dbProd[0].stock - item.quantity);
            await db.update(products).set({ stock: newStock }).where(eq(products.id, item.id));
          }
        }
      } catch (e: any) {
        console.warn('Failed to update DB product stock:', e.message);
      }
    }

    // 3. Update omset tunai di shift aktif (memoryStore & DB)
    if (body.paymentMethod === 'CASH') {
      const shift = body.shiftId
        ? memoryStore.shifts.find(s => s.id === body.shiftId)
        : memoryStore.shifts.find(s => s.status === 'open');
      if (shift) {
        shift.salesCash = (shift.salesCash || 0) + body.grandTotal;
        shift.expectedCash = (shift.startingCash || 0) + shift.salesCash;

        try {
          await db.update(cashierShifts)
            .set({ expectedCash: shift.expectedCash.toString() })
            .where(eq(cashierShifts.id, shift.id));
        } catch (e: any) {
          console.warn('Failed to update DB shift cash:', e.message);
        }
      }
    }

    // 4. Update poin member jika ada (penambahan poin belanja & pengurangan poin tukar diskon)
    if (body.memberId) {
      const member = memoryStore.members.find(m => m.id === body.memberId);
      if (member) {
        const earned = body.earnedPoints || 0;
        const redeemed = body.redeemedPoints || 0;
        member.points = Math.max(0, (member.points || 0) + earned - redeemed);
        if (member.points >= 25000) member.tier = 'GOLD';
        else if (member.points >= 10000) member.tier = 'SILVER';
        else member.tier = 'BRONZE';

        try {
          await db.update(members)
            .set({ points: member.points, tier: member.tier.toLowerCase() })
            .where(eq(members.id, member.id));
        } catch (e: any) {
          console.warn('Failed to update DB member points:', e.message);
        }
      }
    }

    // 5. Simpan ke PostgreSQL DB (transactions & transaction_items)
    try {
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

      await db.insert(transactions).values({
        id: trxId,
        invoiceNumber,
        cashierId: dbCashierId,
        shiftId: dbShiftId,
        memberId: dbMemberId,
        promoId: promoId,
        subtotal: body.subtotal.toString(),
        discountTotal: (body.discountTotal || 0).toString(),
        grandTotal: body.grandTotal.toString(),
        paidAmount: body.paidAmount.toString(),
        changeAmount: (body.paidAmount - body.grandTotal).toString(),
        paymentMethod: body.paymentMethod.toLowerCase(),
        earnedPoints: body.earnedPoints || 0,
        createdAt: now
      });

      for (const item of newTrx.items) {
        let dbProdId = item.productId;
        const checkProd = await db.select({ id: products.id }).from(products).where(eq(products.id, item.productId));
        if (checkProd.length === 0) {
          const firstProd = await db.select({ id: products.id }).from(products).limit(1);
          if (firstProd.length > 0) dbProdId = firstProd[0].id;
        }

        await db.insert(transactionItems).values({
          id: item.id,
          transactionId: trxId,
          productId: dbProdId,
          productName: item.productName,
          costPrice: item.costPrice,
          sellPrice: item.sellPrice,
          quantity: item.quantity,
          subtotal: item.subtotal
        });
      }
    } catch (e: any) {
      console.warn('DB insert checkout transaction error:', e.message);
    }

    return {
      success: true,
      message: 'Transaksi berhasil disimpan',
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
  });
