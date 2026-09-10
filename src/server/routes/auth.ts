import { Elysia, t } from 'elysia';

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Login Cashier / Admin with Email & PIN
  .post('/login', ({ body }: { body: any }) => {
    if (body.email === 'admin@minimarket.com' && body.pinCode === '123456') {
      return {
        success: true,
        message: 'Login Admin Berhasil',
        token: `jwt-token-${Date.now()}`,
        user: {
          id: 'user-admin-1',
          name: 'Super Admin',
          email: body.email,
          role: 'admin'
        }
      };
    }

    if (body.pinCode === '111111' || body.email === 'kasir1@minimarket.com') {
      return {
        success: true,
        message: 'Login Kasir Berhasil',
        token: `jwt-token-${Date.now()}`,
        user: {
          id: 'user-kasir-1',
          name: 'Ahmad (Kasir 1)',
          email: body.email || 'kasir1@minimarket.com',
          role: 'cashier'
        }
      };
    }

    return {
      success: false,
      message: 'Email atau PIN Kasir salah!'
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
        id: 'user-kasir-1',
        name: 'Ahmad (Kasir 1)',
        email: 'kasir1@minimarket.com',
        role: 'cashier'
      }
    };
  });
