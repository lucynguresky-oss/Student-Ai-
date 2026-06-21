import 'reflect-metadata';
import assert from 'node:assert';
import { parseAnthropicDelta, parseOpenAiDelta } from '../src/ai-tutor/llm.service';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('parseAnthropicDelta');

test('extracts text from a content_block_delta', () => {
  const line =
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Photo"}}';
  assert.strictEqual(parseAnthropicDelta(line), 'Photo');
});

test('ignores non-text events (message_start, ping)', () => {
  assert.strictEqual(
    parseAnthropicDelta('data: {"type":"message_start","message":{}}'),
    '',
  );
  assert.strictEqual(parseAnthropicDelta('event: ping'), '');
});

test('ignores [DONE] and non-data lines', () => {
  assert.strictEqual(parseAnthropicDelta('data: [DONE]'), '');
  assert.strictEqual(parseAnthropicDelta(''), '');
});

console.log('parseOpenAiDelta');

test('extracts content from a choices delta', () => {
  const line =
    'data: {"choices":[{"delta":{"content":"synth"},"index":0}]}';
  assert.strictEqual(parseOpenAiDelta(line), 'synth');
});

test('handles role-only first chunk (no content)', () => {
  assert.strictEqual(
    parseOpenAiDelta('data: {"choices":[{"delta":{"role":"assistant"}}]}'),
    '',
  );
});

test('ignores [DONE] and malformed lines', () => {
  assert.strictEqual(parseOpenAiDelta('data: [DONE]'), '');
  assert.strictEqual(parseOpenAiDelta('data: not-json'), '');
});

console.log(`\nAll ${passed} LLM parser tests passed ✓`);
