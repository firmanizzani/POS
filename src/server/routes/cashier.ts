import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { cashierShifts, users, transactions, transactionItems, products, members } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore, syncMemoryStoreToDb } from '../db/store.js';

export const cashierRoutes = new Elysia({ prefix: '/cashier' })
  // Get all shift audit records (merged from DB and memoryStore)
  .get('/shifts', async () => {
    await syncMemoryStoreToDb().catch(() => {});

    const userMap = new Map(memoryStore.users.map(u => [u.id, u.name]));

    // Fetch all transactions from DB & memoryStore to calculate cash sales per shift
    let dbTrxs: any[] = [];
    try {
      dbTrxs = await db.select({
        id: transactions.id,
        shiftId: transactions.shiftId,
        cashierId: transactions.cashierId,
        grandTotal: transactions.grandTotal,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt
      }).from(transactions);
    } catch (e: any) {
      console.warn('DB transactions fetch error for shift audit:', e.message);
    }

    const allTrxs = [...memoryStore.transactions];
    for (const dt of dbTrxs) {
      if (!allTrxs.some(t => t.id === dt.id)) {
        allTrxs.push(dt);
      }
    }

    let shiftsFromDb: any[] = [];
    try {
      shiftsFromDb = await db.select({
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
    } catch (e: any) {
      console.warn('DB cashierShifts error, fallback to memoryStore:', e.message);
    }

    // Map DB shifts and memoryStore shifts into unified list
    const shiftMap = new Map<string, any>();

    // Process memoryStore shifts first
    for (const ms of memoryStore.shifts) {
      shiftMap.set(ms.id, { ...ms });
    }

    // Overlay DB shifts
    for (const s of shiftsFromDb) {
      const existing = shiftMap.get(s.id) || {};
      shiftMap.set(s.id, {
        ...existing,
        id: s.id,
        userId: s.userId,
        cashierName: s.cashierName || userMap.get(s.userId) || existing.cashierName || 'Kasir',
        clockIn: s.clockIn ? new Date(s.clockIn).toISOString() : (existing.clockIn || new Date().toISOString()),
        clockOut: s.clockOut ? new Date(s.clockOut).toISOString() : existing.clockOut || null,
        startingCash: s.startingCash !== null && s.startingCash !== undefined ? Number(s.startingCash) : (existing.startingCash ?? 200000),
        expectedCash: s.expectedCash !== null && s.expectedCash !== undefined ? Number(s.expectedCash) : existing.expectedCash,
        actualCash: s.actualCash !== null && s.actualCash !== undefined ? Number(s.actualCash) : existing.actualCash,
        notes: s.notes || existing.notes || '',
        status: s.status || existing.status || 'open'
      });
    }

    const resultList: any[] = [];
    for (const [id, rawShift] of shiftMap.entries()) {
      const start = Number(rawShift.startingCash || 200000);
      const withdrawals = Number(rawShift.withdrawalsTotal || 0);

      // Compute total cash transactions for this shift
      const shiftClockIn = rawShift.clockIn ? new Date(rawShift.clockIn).getTime() : 0;
      const shiftClockOut = rawShift.clockOut ? new Date(rawShift.clockOut).getTime() : Infinity;

      const matchingCashTrxs = allTrxs.filter(t => {
        const method = (t.paymentMethod || '').toUpperCase();
        if (method !== 'CASH') return false;
        if (t.shiftId && t.shiftId === id) return true;
        const trxTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
        if (t.cashierId === rawShift.userId && trxTime >= shiftClockIn && trxTime <= shiftClockOut) {
          return true;
        }
        return false;
      });

      const computedCashSales = matchingCashTrxs.reduce((sum, t) => sum + Number(t.grandTotal || 0), 0);
      const salesCash = computedCashSales;

      const expectedCash = start + salesCash - withdrawals;

      const isClosed = rawShift.status === 'closed' || !!rawShift.clockOut;
      const status = isClosed ? 'closed' : 'open';

      const clockOut = rawShift.clockOut
        ? new Date(rawShift.clockOut).toISOString()
        : (isClosed ? new Date().toISOString() : null);

      let actualCash: number | null = null;
      if (rawShift.actualCash !== null && rawShift.actualCash !== undefined) {
        actualCash = Number(rawShift.actualCash);
      } else if (isClosed) {
        actualCash = rawShift.expectedCash !== null && rawShift.expectedCash !== undefined ? Number(rawShift.expectedCash) : expectedCash;
      }

      let difference: number | null = null;
      if (actualCash !== null) {
        difference = actualCash - expectedCash;
      } else if (isClosed) {
        difference = 0;
      }

      resultList.push({
        id,
        userId: rawShift.userId,
        cashierName: rawShift.cashierName || userMap.get(rawShift.userId) || 'Kasir',
        clockIn: rawShift.clockIn ? new Date(rawShift.clockIn).toISOString() : new Date().toISOString(),
        clockOut,
        startingCash: start,
        salesCash,
        withdrawalsTotal: withdrawals,
        expectedCash,
        actualCash,
        difference,
        notes: rawShift.notes || '',
        status
      });
    }

    // Sort newest shift first
    resultList.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

    return {
      success: true,
      data: resultList
    };
  })

  // Get or Sync Active Shift for logged-in user with carry-over drawer cash
  .get('/shift/active', async ({ query }: { query: { userId?: string } }) => {
    const userId = query.userId || 'user-kasir-1';
    const cashier = memoryStore.users.find(u => u.id === userId) || { id: userId, name: 'Kasir' };

    let activeShift: any = memoryStore.shifts.find((s: any) => s.userId === userId && s.status === 'open');

    if (!activeShift) {
      // Carry over ending cash balance from latest shift or default to 200,000
      const closedShifts = memoryStore.shifts.filter((s: any) => s.status === 'closed');
      const latestShift: any = closedShifts[0] || memoryStore.shifts[0];
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
      const closedShifts = memoryStore.shifts.filter((s: any) => s.status === 'closed');
      const latestShift: any = closedShifts[0] || memoryStore.shifts[0];
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
    const withdrawId = `wd-${Date.now()}`;
    const withdrawItem = {
      id: withdrawId,
      amount: withdrawAmt,
      notes: body.notes || 'Diambil Owner',
      timestamp: new Date().toISOString()
    };

    if (!Array.isArray(shift.withdrawalsHistory)) {
      shift.withdrawalsHistory = [];
    }
    shift.withdrawalsHistory.push(withdrawItem);

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
        expectedCash: shift.expectedCash,
        withdrawalsHistory: shift.withdrawalsHistory
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

  // Shift Management: Cancel / Undo Pengambilan Uang Fisik Owner
  .post('/shift/withdraw/cancel', async ({ body }: { body: { shiftId: string; withdrawalId: string } }) => {
    const shift: any = memoryStore.shifts.find(s => s.id === body.shiftId) || memoryStore.shifts.find(s => s.status === 'open');
    if (!shift) {
      return { success: false, message: 'Shift aktif tidak ditemukan' };
    }

    if (!Array.isArray(shift.withdrawalsHistory)) {
      return { success: false, message: 'Riwayat pengambilan tidak ditemukan' };
    }

    const index = shift.withdrawalsHistory.findIndex((w: any) => w.id === body.withdrawalId);
    if (index === -1) {
      return { success: false, message: 'Data pengambilan owner tidak ditemukan' };
    }

    const targetWd = shift.withdrawalsHistory[index];
    const canceledAmt = targetWd.amount;

    // Remove item and recalculate
    shift.withdrawalsHistory.splice(index, 1);
    shift.withdrawalsTotal = Math.max(0, (shift.withdrawalsTotal || 0) - canceledAmt);
    shift.expectedCash = (shift.startingCash || 0) + (shift.salesCash || 0) - shift.withdrawalsTotal;
    const cancelNote = `[Batal Pengambilan Owner Rp ${canceledAmt.toLocaleString('id-ID')}]`;
    shift.notes = shift.notes ? `${shift.notes}; ${cancelNote}` : cancelNote;

    await syncMemoryStoreToDb().catch(() => {});

    return {
      success: true,
      message: `Pengambilan uang Rp ${canceledAmt.toLocaleString('id-ID')} berhasil dibatalkan!`,
      data: {
        shiftId: shift.id,
        totalWithdrawals: shift.withdrawalsTotal,
        expectedCash: shift.expectedCash,
        withdrawalsHistory: shift.withdrawalsHistory
      }
    };
  }, {
    body: t.Object({
      shiftId: t.String(),
      withdrawalId: t.String()
    })
  })

  // Shift Management: Clock-Out (Rekap Laci)
  .post('/shift/clock-out', async ({ body }: { body: any }) => {
    const shift: any = memoryStore.shifts.find(s => s.id === body.shiftId) || memoryStore.shifts.find(s => s.status === 'open') || memoryStore.shifts[0];
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

    const currentShiftId = shift?.id || body.shiftId;
    const currentUserId = shift?.userId || 'user-kasir-1';

    try {
      await db.insert(cashierShifts).values({
        id: currentShiftId,
        userId: currentUserId,
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

    // Automagically create NEW OPEN SHIFT (+1 shift counter) with carry over starting cash
    let maxShiftNum = 1000;
    const dbShifts = await db.select({ id: cashierShifts.id }).from(cashierShifts).catch(() => []);
    const allShiftIds = [...dbShifts.map(s => s.id), ...memoryStore.shifts.map((s: any) => s.id)];
    const numShiftIds = allShiftIds.map((id: string) => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter((n: number) => !isNaN(n));
    if (numShiftIds.length > 0) maxShiftNum = Math.max(...numShiftIds);
    const nextShiftNum = maxShiftNum + 1;

    const nextShiftId = `shift-${nextShiftNum}`;
    const newStartingCash = actualCash; // Carry-over exact ending physical drawer balance

    const newShift = {
      id: nextShiftId,
      userId: currentUserId,
      cashierName: shift?.cashierName || 'Kasir',
      clockIn: new Date().toISOString(),
      clockOut: null,
      startingCash: newStartingCash,
      salesCash: 0,
      withdrawalsTotal: 0,
      expectedCash: newStartingCash,
      actualCash: null,
      difference: null,
      notes: `Shift Baru Berjalan (${shift?.cashierName || 'Kasir'})`,
      status: 'open'
    };

    memoryStore.shifts.unshift(newShift);

    try {
      await db.insert(cashierShifts).values({
        id: nextShiftId,
        userId: currentUserId,
        clockIn: new Date(),
        clockOut: null,
        startingCash: newStartingCash.toString(),
        expectedCash: newStartingCash.toString(),
        actualCash: null,
        notes: newShift.notes,
        status: 'open'
      }).onConflictDoNothing();
    } catch (e: any) {
      console.warn('DB insert new shift error:', e.message);
    }

    await syncMemoryStoreToDb().catch(() => {});

    return {
      success: true,
      message: 'Clock-Out Kasir Berhasil & Shift Baru Dibuka',
      data: {
        shiftId: currentShiftId,
        clockOut: clockOutTime.toISOString(),
        startingCash,
        totalSalesCash,
        totalWithdrawals,
        expectedCash,
        actualCash,
        difference,
        status: 'closed',
        newShift
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
    if ((body.paymentMethod || '').toUpperCase() === 'CASH') {
      const shift = body.shiftId
        ? memoryStore.shifts.find(s => s.id === body.shiftId)
        : memoryStore.shifts.find(s => s.status === 'open');
      if (shift) {
        shift.salesCash = (shift.salesCash || 0) + body.grandTotal;
        shift.expectedCash = (shift.startingCash || 0) + shift.salesCash - (shift.withdrawalsTotal || 0);

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
