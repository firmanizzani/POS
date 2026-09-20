import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', async () => {
    try {
      const list = await db.select().from(users);
      return {
        success: true,
        data: list.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          pinCode: u.pinCode || '',
          role: u.role as 'admin' | 'cashier',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '2026-09-01'
        }))
      };
    } catch (e: any) {
      console.error('DB users error:', e.message);
      return { success: false, message: 'Gagal mengambil data user: ' + e.message, data: [] };
    }
  })
  .post('/', async ({ body }: { body: any }) => {
    let maxUserNum = 0;
    const dbUsers = await db.select({ id: users.id }).from(users).catch(() => []);
    const numUserIds = dbUsers.map(u => parseInt(u.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numUserIds.length > 0) maxUserNum = Math.max(...numUserIds);
    const nextUserNum = maxUserNum + 1;

    const id = `user-${nextUserNum}`;
    const newUser = {
      id,
      name: body.name,
      email: body.email,
      pinCode: body.pinCode,
      role: body.role,
      createdAt: new Date()
    };

    try {
      await db.insert(users).values(newUser);
      return {
        success: true,
        message: 'Akun berhasil dibuat',
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          pinCode: newUser.pinCode,
          role: newUser.role,
          createdAt: newUser.createdAt.toISOString().slice(0, 10)
        }
      };
    } catch (e: any) {
      console.error('DB insert user error:', e.message);
      return { success: false, message: 'Gagal membuat akun: ' + e.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      pinCode: t.String(),
      role: t.String()
    })
  })
  .put('/:id', async ({ params, body }: { params: { id: string }, body: any }) => {
    try {
      await db.update(users)
        .set({
          name: body.name,
          email: body.email,
          pinCode: body.pinCode,
          role: body.role
        })
        .where(eq(users.id, params.id));

      return { success: true, message: 'Akun berhasil diperbarui' };
    } catch (e: any) {
      console.error('DB update user error:', e.message);
      return { success: false, message: 'Gagal memperbarui akun: ' + e.message };
    }
  })
  .delete('/:id', async ({ params }: { params: { id: string } }) => {
    try {
      await db.delete(users).where(eq(users.id, params.id));
      return { success: true, message: 'Akun berhasil dihapus' };
    } catch (e: any) {
      console.error('DB delete user error:', e.message);
      return { success: false, message: 'Gagal menghapus akun: ' + e.message };
    }
  });
