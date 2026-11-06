'use strict';
/**
 * Tests for the singleton SMTP transporter in auth.controller.js
 *
 * Uses Node's built-in test runner (node:test) — no extra dependencies.
 * nodemailer is monkey-patched via require cache so no network is touched.
 *
 * Run:  node --test backend/tests/mailer.test.js
 */

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal fake transporter. Every field that the controller touches
 * (sendMail, close) is covered.
 */
function makeFakeTransporter(sendMailImpl) {
  return {
    sendMail: sendMailImpl || (() => Promise.resolve({ messageId: 'test-id' })),
    close: () => {},
    _calls: 0,   // extra counter for the singleton-reuse test
  };
}

/**
 * Patch nodemailer.createTransport with a factory, run fn(), then restore.
 * Returns whatever fn() returns (may be a Promise).
 */
function withCreateTransport(factory, fn) {
  const orig = nodemailer.createTransport;
  nodemailer.createTransport = factory;
  try {
    return fn();
  } finally {
    nodemailer.createTransport = orig;
  }
}

// ─── Fixture: set / unset env vars ───────────────────────────────────────────

function setEmailEnv() {
  process.env.EMAIL_USER = 'test@example.com';
  process.env.EMAIL_PASS = 'secret';
}

function clearEmailEnv() {
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
}

// ─── Always reset the singleton between tests so tests are independent ────────

function freshController() {
  // Pull the currently-cached module copy, reset state, then return fresh exports.
  const ctrl = require('../controllers/auth.controller');
  ctrl._resetTransporter();
  return ctrl;
}

beforeEach(() => {
  setEmailEnv();
});

afterEach(() => {
  // Reset singleton and env after every test.
  const ctrl = require('../controllers/auth.controller');
  ctrl._resetTransporter();
  clearEmailEnv();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

test('singleton reuse — createTransport called only once across multiple getTransporter() calls', () => {
  let createCalls = 0;
  const fake = makeFakeTransporter();

  withCreateTransport(() => { createCalls++; return fake; }, () => {
    const ctrl = freshController();

    const t1 = ctrl._getTransporter();
    const t2 = ctrl._getTransporter();
    const t3 = ctrl._getTransporter();

    assert.equal(createCalls, 1, 'createTransport must be called exactly once');
    assert.equal(t1, t2, 'second call must return the same instance');
    assert.equal(t1, t3, 'third call must return the same instance');
  });
});

test('missing credentials — getTransporter() returns null, no createTransport call', () => {
  clearEmailEnv();

  let createCalls = 0;
  withCreateTransport(() => { createCalls++; return makeFakeTransporter(); }, () => {
    const ctrl = freshController();
    const t = ctrl._getTransporter();
    assert.equal(t, null, 'must return null when env vars are absent');
    assert.equal(createCalls, 0, 'must not call createTransport');
  });
});

test('concurrent init — calling getTransporter() twice on the same tick creates only one transporter', () => {
  let createCalls = 0;
  const fake = makeFakeTransporter();

  withCreateTransport(() => { createCalls++; return fake; }, () => {
    const ctrl = freshController();

    // Simulate two synchronous callers hitting the un-initialised singleton.
    const t1 = ctrl._getTransporter();
    const t2 = ctrl._getTransporter();

    // First call builds it; second call either gets the cached value or null
    // (the _creating guard), but must never call createTransport a second time.
    assert.equal(createCalls, 1, 'createTransport must not be called twice');
    // Both should ultimately reference the real transporter.
    assert.ok(t1 === fake, 'first call returns the fake transporter');
    assert.ok(t2 === fake, 'second call returns the same fake transporter (already cached)');
  });
});

test('permanent SMTP error — singleton is reset after EAUTH so next send rebuilds it', async () => {
  let createCalls = 0;
  const fakeGood = makeFakeTransporter(() => Promise.resolve({ messageId: 'ok' }));

  const authErr = Object.assign(new Error('Invalid credentials'), { code: 'EAUTH' });
  const fakeBad = makeFakeTransporter(() => Promise.reject(authErr));

  const orig = nodemailer.createTransport;
  nodemailer.createTransport = () => {
    createCalls++;
    return createCalls === 1 ? fakeBad : fakeGood;
  };

  try {
    const ctrl = freshController();

    // First send fails with EAUTH → resetTransporter() is called internally.
    await ctrl._sendWelcomeEmail('user@example.com', 'Alice', 'Welcome');

    // After reset, getTransporter() must call createTransport a second time.
    const rebuilt = ctrl._getTransporter();
    assert.equal(createCalls, 2, 'createTransport must be called again after EAUTH reset');
    assert.equal(rebuilt, fakeGood, 'rebuilt transporter must be the second (good) fake');
  } finally {
    nodemailer.createTransport = orig;
  }
});

test('transient SMTP error — singleton is NOT reset for non-permanent errors', async () => {
  let createCalls = 0;
  const transientErr = Object.assign(new Error('Connection reset'), { code: 'ECONNRESET' });
  const fake = makeFakeTransporter(() => Promise.reject(transientErr));

  withCreateTransport(() => { createCalls++; return fake; }, async () => {
    const ctrl = freshController();

    await ctrl._sendWelcomeEmail('user@example.com', 'Bob', 'Welcome');

    // Transient error — singleton must still be alive.
    const still = ctrl._getTransporter();
    assert.equal(createCalls, 1, 'createTransport must not be called again for transient errors');
    assert.equal(still, fake, 'singleton must still be the original transporter');
  });
});

test('delivery failure — sendWelcomeEmail rejects silently and does not throw', async () => {
  const sendErr = Object.assign(new Error('Mailbox full'), { code: 'EMESSAGE' });
  const fake = makeFakeTransporter(() => Promise.reject(sendErr));

  withCreateTransport(() => fake, async () => {
    const ctrl = freshController();
    // Must not throw — email failure is fire-and-forget.
    await assert.doesNotReject(
      () => ctrl._sendWelcomeEmail('user@example.com', 'Carol', 'Welcome'),
      'sendWelcomeEmail must never propagate errors to the caller',
    );
  });
});

test('pool config — createTransport is called with pool:true and maxConnections:2', () => {
  let capturedOptions;
  const fake = makeFakeTransporter();

  withCreateTransport((opts) => { capturedOptions = opts; return fake; }, () => {
    const ctrl = freshController();
    ctrl._getTransporter();

    assert.equal(capturedOptions.pool, true, 'pool must be true');
    assert.equal(capturedOptions.maxConnections, 2, 'maxConnections must be 2');
    assert.equal(capturedOptions.host, 'smtp.gmail.com', 'host must be smtp.gmail.com');
    assert.equal(capturedOptions.port, 587, 'port must be 587');
  });
});
