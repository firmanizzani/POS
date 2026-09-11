import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', async () => {
    try {
      const list = await db.select().from(users);
      if (list.length > 0) {
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
      }
    } catch (e: any) {
      console.warn('DB users error, using memoryStore:', e.message);
    }

    const data = memoryStore.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      pinCode: u.pinCode || '',
      role: u.role as 'admin' | 'cashier',
      createdAt: '2026-09-01'
    }));

    return { success: true, data };
  })
  .post('/', async ({ body }: { body: any }) => {
    const id = `user-${Date.now()}`;
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
    } catch (e: any) {
      console.warn('DB insert user error:', e.message);
    }

    memoryStore.users.push(newUser);

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
    } catch (e: any) {
      console.warn('DB update user error:', e.message);
    }

    const idx = memoryStore.users.findIndex(u => u.id === params.id);
    if (idx !== -1) {
      memoryStore.users[idx] = {
        ...memoryStore.users[idx],
        name: body.name ?? memoryStore.users[idx].name,
        email: body.email ?? memoryStore.users[idx].email,
        pinCode: body.pinCode ?? memoryStore.users[idx].pinCode,
        role: body.role ?? memoryStore.users[idx].role
      };
    }

    return { success: true, message: 'Akun berhasil diperbarui' };
  })
  .delete('/:id', async ({ params }: { params: { id: string } }) => {
    try {
      await db.delete(users).where(eq(users.id, params.id));
    } catch (e: any) {
      console.warn('DB delete user error:', e.message);
    }

    memoryStore.users = memoryStore.users.filter(u => u.id !== params.id);

    return { success: true, message: 'Akun berhasil dihapus' };
  });
