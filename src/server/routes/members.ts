import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { members, transactions } from '../db/schema.js';
import { memoryStore } from '../db/store.js';

export const memberRoutes = new Elysia({ prefix: '/members' })
  .get('/', async () => {
    let memberSpendMap = new Map<string, number>();

    try {
      const allTrx = await db.select({ memberId: transactions.memberId, grandTotal: transactions.grandTotal }).from(transactions);
      for (const t of allTrx) {
        if (t.memberId) {
          const current = memberSpendMap.get(t.memberId) || 0;
          memberSpendMap.set(t.memberId, current + Number(t.grandTotal || 0));
        }
      }

      const list = await db.select().from(members);
      if (list.length > 0) {
        return {
          success: true,
          data: list.map(m => {
            const pts = Number(m.points || 0);
            const totalSpend = memberSpendMap.get(m.id) || (pts / 0.005);
            
            let computedTier = m.tier ? m.tier.toUpperCase() : 'BRONZE';
            if (totalSpend >= 5_000_000 || pts >= 25000) computedTier = 'GOLD';
            else if (totalSpend >= 2_000_000 || pts >= 10000) computedTier = 'SILVER';
            else computedTier = 'BRONZE';

            return {
              id: m.id,
              code: m.memberCode,
              name: m.name,
              phone: m.phone,
              points: pts,
              totalSpend: Math.round(totalSpend),
              tier: computedTier
            };
          })
        };
      }
    } catch (e: any) {
      console.warn('DB members error, fallback to memoryStore:', e.message);
    }

    // Fallback to memoryStore calculation
    for (const t of memoryStore.transactions) {
      if (t.memberId) {
        const current = memberSpendMap.get(t.memberId) || 0;
        memberSpendMap.set(t.memberId, current + Number(t.grandTotal || 0));
      }
    }

    const data = memoryStore.members.map(m => {
      const pts = Number(m.points || 0);
      const totalSpend = memberSpendMap.get(m.id) || (pts / 0.005);

      let computedTier = m.tier ? m.tier.toUpperCase() : 'BRONZE';
      if (totalSpend >= 5_000_000 || pts >= 25000) computedTier = 'GOLD';
      else if (totalSpend >= 2_000_000 || pts >= 10000) computedTier = 'SILVER';
      else computedTier = 'BRONZE';

      return {
        id: m.id,
        code: m.memberCode,
        name: m.name,
        phone: m.phone,
        points: pts,
        totalSpend: Math.round(totalSpend),
        tier: computedTier
      };
    });

    return { success: true, data };
  })
  .post('/', async ({ body }: { body: any }) => {
    let maxMbrNum = 0;
    const dbMembers = await db.select({ id: members.id, memberCode: members.memberCode }).from(members).catch(() => []);
    const allMemberIds = [...dbMembers.map(m => m.id), ...memoryStore.members.map(m => m.id)];
    const numMemberIds = allMemberIds.map(id => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numMemberIds.length > 0) maxMbrNum = Math.max(...numMemberIds);
    const nextMbrNum = maxMbrNum + 1;

    const id = `mbr-${nextMbrNum}`;
    const memberCode = `MBR-${nextMbrNum.toString().padStart(3, '0')}`;
    
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
