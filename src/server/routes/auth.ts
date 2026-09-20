import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Login Cashier / Admin with Email & PIN
  .post('/login', async ({ body }: { body: { email?: string; pinCode: string } }) => {
    const emailInput = body.email?.trim().toLowerCase();
    const pinInput = body.pinCode?.trim();

    try {
      const dbUsers = await db.select().from(users);
      const matchedDbUser = dbUsers.find(u => 
        (emailInput ? u.email.toLowerCase() === emailInput : true) && u.pinCode === pinInput
      );

      if (matchedDbUser) {
        return {
          success: true,
          message: `Login ${matchedDbUser.role === 'admin' ? 'Admin' : 'Kasir'} Berhasil`,
          token: `jwt-token-${Date.now()}`,
          user: {
            id: matchedDbUser.id,
            name: matchedDbUser.name,
            email: matchedDbUser.email,
            role: matchedDbUser.role
          }
        };
      }
    } catch (e: any) {
      console.error('DB auth query error:', e.message);
    }

    return {
      success: false,
      message: 'Email atau PIN Kasir/Admin salah!'
    };
  }, {
    body: t.Object({
      email: t.Optional(t.String()),
      pinCode: t.String()
    })
  })

  // Verify Active Session
  .get('/me', () => {
    return {
      success: true,
      user: {
        id: 'user-admin-1',
        name: 'Super Admin',
        email: 'admin@minimarket.com',
        role: 'admin'
      }
    };
  });
