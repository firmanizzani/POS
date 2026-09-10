import { Elysia, t } from 'elysia';

export const cashierRoutes = new Elysia({ prefix: '/cashier' })
  // Shift Management: Clock-In (Kas Awal)
  .post('/shift/clock-in', ({ body }) => {
    return {
      success: true,
      data: {
        shiftId: `shift-${Date.now()}`,
        cashierId: body.cashierId,
        cashierName: 'Budi (Kasir 1)',
        startingCash: body.startingCash,
        clockIn: new Date().toISOString(),
        status: 'open'
      }
    };
  }, {
    body: t.Object({
      cashierId: t.String(),
      startingCash: t.Number()
    })
  })

  // Shift Management: Clock-Out (Rekap Laci)
  .post('/shift/clock-out', ({ body }) => {
    return {
      success: true,
      data: {
        shiftId: body.shiftId,
        clockOut: new Date().toISOString(),
        startingCash: body.startingCash,
        totalSalesCash: body.totalSalesCash,
        expectedCash: body.startingCash + body.totalSalesCash,
        actualCash: body.actualCash,
        difference: body.actualCash - (body.startingCash + body.totalSalesCash),
        status: 'closed'
      }
    };
  }, {
    body: t.Object({
      shiftId: t.String(),
      startingCash: t.Number(),
      totalSalesCash: t.Number(),
      actualCash: t.Number(),
      notes: t.Optional(t.String())
    })
  })

  // Hold Cart
  .post('/cart/hold', ({ body }) => {
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

  // Checkout Transaction
  .post('/checkout', ({ body }) => {
    const invoiceNumber = `INV-${Date.now()}`;
    return {
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: {
        invoiceNumber,
        grandTotal: body.grandTotal,
        paidAmount: body.paidAmount,
        changeAmount: body.paidAmount - body.grandTotal,
        paymentMethod: body.paymentMethod,
        timestamp: new Date().toISOString(),
        items: body.items
      }
    };
  }, {
    body: t.Object({
      shiftId: t.String(),
      cashierId: t.String(),
      items: t.Array(t.Object({
        id: t.String(),
        name: t.String(),
        sellPrice: t.Number(),
        quantity: t.Number(),
        subtotal: t.Number()
      })),
      subtotal: t.Number(),
      discountTotal: t.Number(),
      grandTotal: t.Number(),
      paidAmount: t.Number(),
      paymentMethod: t.String(),
      memberId: t.Optional(t.String())
    })
  });
