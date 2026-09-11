import { Elysia, t } from 'elysia';
import { memoryStore } from '../db/store.js';

export const cashierRoutes = new Elysia({ prefix: '/cashier' })
  // Get all shift audit records
  .get('/shifts', () => {
    return {
      success: true,
      data: memoryStore.shifts
    };
  })

  // Shift Management: Clock-In (Kas Awal)
  .post('/shift/clock-in', ({ body }: { body: any }) => {
    const cashier = memoryStore.users.find(u => u.id === body.cashierId) || { name: 'Ahmad Kasir' };
    const newShift = {
      id: `shift-${Date.now()}`,
      userId: body.cashierId,
      cashierName: cashier.name,
      clockIn: new Date().toISOString(),
      clockOut: null,
      startingCash: Number(body.startingCash),
      salesCash: 0,
      expectedCash: Number(body.startingCash),
      actualCash: null,
      difference: null,
      notes: body.notes || 'Shift Aktif',
      status: 'open'
    };

    memoryStore.shifts.unshift(newShift);

    return {
      success: true,
      message: 'Clock-In Kasir Berhasil',
      data: newShift
    };
  }, {
    body: t.Object({
      cashierId: t.String(),
      startingCash: t.Number(),
      notes: t.Optional(t.String())
    })
  })

  // Shift Management: Clock-Out (Rekap Laci)
  .post('/shift/clock-out', ({ body }: { body: any }) => {
    const shift = memoryStore.shifts.find(s => s.id === body.shiftId) || memoryStore.shifts[0];
    const clockOutTime = new Date().toISOString();
    const startingCash = Number(body.startingCash ?? shift?.startingCash ?? 200000);
    const totalSalesCash = Number(body.totalSalesCash ?? shift?.salesCash ?? 0);
    const expectedCash = startingCash + totalSalesCash;
    const actualCash = Number(body.actualCash);
    const difference = actualCash - expectedCash;

    if (shift) {
      shift.clockOut = clockOutTime;
      shift.startingCash = startingCash;
      shift.salesCash = totalSalesCash;
      shift.expectedCash = expectedCash;
      shift.actualCash = actualCash;
      shift.difference = difference;
      shift.status = 'closed';
      if (body.notes) shift.notes = body.notes;
    }

    return {
      success: true,
      message: 'Clock-Out Kasir Berhasil',
      data: {
        shiftId: body.shiftId,
        clockOut: clockOutTime,
        startingCash,
        totalSalesCash,
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

  // Checkout Transaction — Simpan ke memoryStore + update shift omset + update member points
  .post('/checkout', ({ body }: { body: any }) => {
    const invoiceNumber = `INV-${Date.now()}`;
    const now = new Date();

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
      id: `trx-${Date.now()}`,
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
        id: `ti-${Date.now()}-${idx}`,
        transactionId: `trx-${Date.now()}`,
        productId: item.id,
        productName: item.name,
        costPrice: '0',
        sellPrice: item.sellPrice.toString(),
        quantity: item.quantity,
        subtotal: item.subtotal.toString()
      }))
    };

    // Simpan ke memoryStore
    memoryStore.transactions.unshift(newTrx);

    // Update omset tunai di shift aktif
    if (body.paymentMethod === 'CASH') {
      const shift = body.shiftId
        ? memoryStore.shifts.find(s => s.id === body.shiftId)
        : memoryStore.shifts.find(s => s.status === 'open');
      if (shift) {
        shift.salesCash = (shift.salesCash || 0) + body.grandTotal;
        shift.expectedCash = (shift.startingCash || 0) + shift.salesCash;
      }
    }

    // Update poin member jika ada
    if (body.memberId && body.earnedPoints > 0) {
      const member = memoryStore.members.find(m => m.id === body.memberId);
      if (member) {
        member.points = (member.points || 0) + body.earnedPoints;
        // Naik tier otomatis
        if (member.points >= 500) member.tier = 'GOLD';
        else if (member.points >= 200) member.tier = 'SILVER';
      }
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
