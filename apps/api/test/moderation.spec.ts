import 'reflect-metadata';
import assert from 'node:assert';
import { ModerationStatus } from '@prisma/client';
import { decideAction, parseVerdict } from '../src/moderation/moderation.service';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  âœ“ ${name}`);
}

console.log('parseVerdict');

test('parses a clean JSON object', () => {
  const v = parseVerdict(
    '{"isEducational": true, "confidence": 0.9, "category": "biology", "reason": "Explains osmosis"}',
  );
  assert.strictEqual(v.isEducational, true);
  assert.strictEqual(v.confidence, 0.9);
  assert.strictEqual(v.category, 'biology');
});

test('strips markdown code fences and surrounding prose', () => {
  const v = parseVerdict(
    'Here is the verdict:\n```json\n{"isEducational": false, "confidence": 0.8, "category": "spam", "reason": "Advertisement"}\n```\nDone.',
  );
  assert.strictEqual(v.isEducational, false);
  assert.strictEqual(v.confidence, 0.8);
  assert.strictEqual(v.category, 'spam');
});

test('clamps out-of-range confidence to [0,1]', () => {
  assert.strictEqual(parseVerdict('{"isEducational":true,"confidence":5}').confidence, 1);
  assert.strictEqual(parseVerdict('{"isEducational":true,"confidence":-2}').confidence, 0);
});

test('falls back safely on garbage input', () => {
  const v = parseVerdict('not json at all');
  assert.strictEqual(v.isEducational, false);
  assert.strictEqual(v.confidence, 0);
  assert.strictEqual(v.category, 'unparseable');
});

test('falls back safely on empty input', () => {
  const v = parseVerdict('');
  assert.strictEqual(v.isEducational, false);
});

console.log('decideAction');

test('educational + high confidence => APPROVED', () => {
  assert.strictEqual(
    decideAction({ isEducational: true, confidence: 0.9, category: 'x', reason: 'y' }),
    ModerationStatus.APPROVED,
  );
});

test('non-educational + high confidence => REMOVED', () => {
  assert.strictEqual(
    decideAction({ isEducational: false, confidence: 0.85, category: 'x', reason: 'y' }),
    ModerationStatus.REMOVED,
  );
});

test('non-educational but low confidence => FLAGGED (human review)', () => {
  assert.strictEqual(
    decideAction({ isEducational: false, confidence: 0.6, category: 'x', reason: 'y' }),
    ModerationStatus.FLAGGED,
  );
});

test('educational but low confidence => FLAGGED', () => {
  assert.strictEqual(
    decideAction({ isEducational: true, confidence: 0.3, category: 'x', reason: 'y' }),
    ModerationStatus.FLAGGED,
  );
});

console.log(`\nAll ${passed} moderation tests passed âœ“`);
