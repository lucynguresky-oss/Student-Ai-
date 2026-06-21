import assert from 'node:assert';
import { extractMentions } from '../src/common/text.util';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('extractMentions');

test('pulls multiple mentions, deduped and lowercased', () => {
  const r = extractMentions('thanks @Amina and @brian and @amina again');
  assert.deepStrictEqual(r.sort(), ['amina', 'brian']);
});

test('ignores emails (@ must be at a word boundary) but keeps real mentions', () => {
  const r = extractMentions('mail john@example.com but tag @amina');
  assert.deepStrictEqual(r, ['amina']);
});

test('handles dots and underscores in usernames', () => {
  const r = extractMentions('shoutout @john.doe_99');
  assert.deepStrictEqual(r, ['john.doe_99']);
});

test('drops mentions shorter than 3 chars', () => {
  assert.deepStrictEqual(extractMentions('@ab hi'), []);
});

test('returns empty for no mentions', () => {
  assert.deepStrictEqual(extractMentions('no mentions here'), []);
});

console.log(`\nAll ${passed} mention tests passed ✓`);
