import express from 'express';
import { normalizeGiftCode } from '../gifts.js';
import { normalizeCode, CODE_PATTERN } from '../pricing/discounts.js';
import { canFamilyReadLearner, isUuid } from './progress.js';
import { notifyUser } from '../notifications/inbox.js';

/**
 * NX-06: redeem a gift code. The paid gift package moves to the receiver (purchaser and learner; the giver stays in
 * metadata.gift.bought_by and on the payment row), its credit history
 * follows, and the person who gave it gets a short note. One redemption per code (the update only matches an
 * unredeemed gift, so two people racing for the same code cannot both win).
 */
type Middleware = (req: any, res: any, next: any) => any;

export function registerGiftRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  app.post('/api/student/gifts/redeem', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const code = normalizeGiftCode(req.body?.code);
    const client = deps.getClient();
    // Families (and the owner, 2026-11-02) type checkout discount codes here too: say where that code works instead.
    const discountText = normalizeCode(req.body?.code);
    if (client && CODE_PATTERN.test(discountText)) {
      const { data: discount } = await client.from('discount_codes').select('id').eq('code', discountText).maybeSingle();
      if (discount) return res.status(409).json({ error: 'This is a discount code: type it on the payment step when you book.', code: 'DISCOUNT_CODE' });
    }
    if (!code) return res.status(400).json({ error: 'Check the code: it looks like WZ-ABCD-EFGH.' });
    const accountId = req.studentUser?.auth_id;
    if (!isUuid(accountId)) return res.status(403).json({ error: 'Please sign in with your own account to redeem a gift.' });
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const chosen = typeof req.body?.learnerStudentId === 'string' ? req.body.learnerStudentId : '';
      const learnerId = chosen || (learners.length === 1 ? learners[0].id : '');
      if (!learnerId) return res.status(400).json({ error: 'Choose who the gift is for.', code: 'LEARNER_REQUIRED' });
      if (!canFamilyReadLearner(learners, learnerId)) return res.status(403).json({ error: 'Choose a learner on your account.' });

      const { data: ent, error: findErr } = await client.from('package_entitlements')
        .select('id, status, metadata, purchased_quantity').eq('metadata->gift->>code', code).maybeSingle();
      if (findErr) throw new Error(findErr.message);
      if (!ent) return res.status(404).json({ error: 'We could not find this gift code.' });
      if (ent.metadata.gift.redeemed_at) return res.status(409).json({ error: 'This gift was already redeemed.' });
      if (ent.status !== 'active') return res.status(409).json({ error: 'This gift is not paid for yet. Ask the person who gave it to finish the payment.' });

      const redeemedAt = new Date().toISOString();
      const { data: moved, error } = await client.from('package_entitlements')
        .update({
          // The package becomes the receiver's in every purchaser-keyed place (balance, ledger, low-balance notices,
          // renewals); the giver stays in metadata.gift.bought_by, and the payment row keeps the giver's record.
          purchaser_account_id: accountId,
          learner_student_id: learnerId,
          metadata: { ...ent.metadata, gift: { ...ent.metadata.gift, redeemed_at: redeemedAt, redeemed_by: accountId } },
          updated_at: redeemedAt,
        })
        .eq('id', ent.id).eq('status', 'active').is('metadata->gift->>redeemed_at', null)
        .select('id, purchased_quantity, remaining_credits').maybeSingle();
      if (error) throw new Error(error.message);
      if (!moved) return res.status(409).json({ error: 'This gift was already redeemed.' });

      const { error: ledgerErr } = await client.from('package_credit_ledger').update({ learner_student_id: learnerId })
        .eq('package_entitlement_id', ent.id).is('learner_student_id', null);
      if (ledgerErr) console.error('[POST gifts/redeem ledger]', ent.id, ledgerErr.message);
      if (isUuid(ent.metadata.gift.bought_by) && ent.metadata.gift.bought_by !== accountId) {
        await notifyUser(client, { userId: ent.metadata.gift.bought_by }, {
          kind: 'gift_redeemed',
          title: { en: 'Your gift was received', ar: 'هديتك وصلت' },
          body: { en: 'The lessons you gave were redeemed. Jazakum Allah khayran.', ar: 'الحصص اللي أهديتها اتفعّلت عند صاحبها. جزاكم الله خيرًا.' },
          link: '/student/wallet',
        });
      }
      return res.json({ success: true, entitlementId: moved.id, lessons: moved.remaining_credits, learnerId });
    } catch (err: any) {
      console.error('[POST gifts/redeem]', err?.message || err);
      return res.status(500).json({ error: 'Could not redeem the gift. Please try again.' });
    }
  });
}
