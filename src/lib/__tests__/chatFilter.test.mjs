import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterContactDetails } from '../retentionUtils.ts';

test('Chat Filter: blocks phone numbers', () => {
  const cases = [
    'My number is 9876543210 call me',
    'Reach me at +91 98765 43210',
    'Call 98765-43210 anytime',
    'Phone: 987 654 3210'
  ];

  for (const text of cases) {
    const res = filterContactDetails(text);
    assert.equal(res.blocked, true, `Expected "${text}" to be blocked`);
  }
});

test('Chat Filter: blocks email addresses', () => {
  const cases = [
    'Email me at test@example.com',
    'Send invoice to rahul.sharma@domain.co.in'
  ];

  for (const text of cases) {
    const res = filterContactDetails(text);
    assert.equal(res.blocked, true, `Expected "${text}" to be blocked`);
  }
});

test('Chat Filter: blocks external URLs', () => {
  const cases = [
    'Check out https://mysite.com/pay',
    'Visit http://external-link.org',
    'Go to www.freelancehub.in'
  ];

  for (const text of cases) {
    const res = filterContactDetails(text);
    assert.equal(res.blocked, true, `Expected "${text}" to be blocked`);
  }
});

test('Chat Filter: blocks off-platform bypass phrases', () => {
  const cases = [
    'Please call me directly',
    'Message me on whatsapp',
    'You can pay directly to my account',
    'Let us pay outside the platform to avoid fees',
    'Offline payment is preferred',
    'Make a direct payment via UPI'
  ];

  for (const text of cases) {
    const res = filterContactDetails(text);
    assert.equal(res.blocked, true, `Expected "${text}" to be blocked`);
  }
});

test('Chat Filter: permits normal society service conversations', () => {
  const allowed = [
    'Hello, I am at Tower B gate right now.',
    'Could you deliver the laundry at 5 PM instead?',
    'Please keep the clean shirts on the door hanger.',
    'Thank you so much for the swift service!'
  ];

  for (const text of allowed) {
    const res = filterContactDetails(text);
    assert.equal(res.blocked, false, `Expected "${text}" to be allowed`);
  }
});
