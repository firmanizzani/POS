import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { members } from '../db/schema.js';
import { memoryStore } from '../db/store.js';

export const memberRoutes = new Elysia({ prefix: '/members' })
  .get('/', async () => {
    try {
      const list = await db.select().from(members);
      if (list.length > 0) {
        return {
          success: true,
          data: list.map(m => ({
            code: m.memberCode,
            name: m.name,
            phone: m.phone,
            points: m.points,
            tier: m.tier.toUpperCase()
          }))
        };
      }
    } catch (e: any) {
      console.warn('DB members error, fallback to memoryStore:', e.message);
    }

    const data = memoryStore.members.map(m => ({
      code: m.memberCode,
      name: m.name,
      phone: m.phone,
      points: m.points,
      tier: m.tier.toUpperCase()
    }));

    return { success: true, data };
  })
  .post('/', async ({ body }: { body: any }) => {
    const id = `mbr-${Date.now()}`;
    const memberCode = `MBR-00${memoryStore.members.length + 1}`;
    
    const newMember = {
      id,
      memberCode,
      name: body.name,
      phone: body.phone,
      points: 0,
      tier: 'BRONZE',
      createdAt: new Date()
    };

    try {
      await db.insert(members).values(newMember);
    } catch (e: any) {
      console.warn('DB insert member error:', e.message);
    }

    memoryStore.members.unshift(newMember);

    return {
      success: true,
      message: 'Member berhasil didaftarkan',
      data: {
        code: newMember.memberCode,
        name: newMember.name,
        phone: newMember.phone,
        points: newMember.points,
        tier: newMember.tier
      }
    };
  }, {
    body: t.Object({
      name: t.String(),
      phone: t.String()
    })
  });
