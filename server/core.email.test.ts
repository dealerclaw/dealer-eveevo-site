/**
 * Tests for server/_core/email.ts (Resend-based transport)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_APPLICATION = {
  businessName: 'Green Wheels Ltd',
  contactName: 'Jane Smith',
  email: 'jane@greenwheels.co.uk',
  phone: '07700 900123',
  address: '1 Electric Avenue, London, SW1A 1AA',
  description: 'Family-run EV dealership specialising in Tesla and Polestar.',
};

// ---------------------------------------------------------------------------
// sendEmail — unit tests
// ---------------------------------------------------------------------------

describe('sendEmail (Resend transport)', () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it('returns { success: false } when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const { sendEmail } = await import('./_core/email');
    const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/RESEND_API_KEY/i);
  });

  it('returns { success: true, messageId } on a successful Resend response', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'msg_abc123' }),
    } as Response);

    const { sendEmail } = await import('./_core/email');
    const result = await sendEmail({
      to: 'admin@eveevo.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_abc123');

    // Verify the correct Resend endpoint was called
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns { success: false } when Resend returns a non-OK response', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: async () => 'Invalid email address',
    } as Response);

    const { sendEmail } = await import('./_core/email');
    const result = await sendEmail({ to: 'bad-email', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('422');
  });

  it('returns { success: false } when fetch throws a network error', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const { sendEmail } = await import('./_core/email');
    const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });
});

// ---------------------------------------------------------------------------
// sendDealerApplicationEmail — integration-style tests
// ---------------------------------------------------------------------------

describe('sendDealerApplicationEmail', () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 're_test_key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it('sends to anthony.perry@eveevo.com with the business name in the subject', async () => {
    let capturedBody: Record<string, unknown> = {};
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      capturedBody = JSON.parse(opts.body as string);
      return { ok: true, json: async () => ({ id: 'msg_dealer_001' }) } as Response;
    });

    const { sendDealerApplicationEmail } = await import('./_core/email');
    const result = await sendDealerApplicationEmail(SAMPLE_APPLICATION);

    expect(result.success).toBe(true);
    expect(capturedBody.to).toContain('anthony.perry@eveevo.com');
    expect(capturedBody.subject).toContain('Green Wheels Ltd');
  });

  it('includes all application fields in the email HTML', async () => {
    let capturedBody: Record<string, unknown> = {};
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      capturedBody = JSON.parse(opts.body as string);
      return { ok: true, json: async () => ({ id: 'msg_dealer_002' }) } as Response;
    });

    const { sendDealerApplicationEmail } = await import('./_core/email');
    await sendDealerApplicationEmail(SAMPLE_APPLICATION);

    const html = capturedBody.html as string;
    expect(html).toContain('Green Wheels Ltd');
    expect(html).toContain('Jane Smith');
    expect(html).toContain('jane@greenwheels.co.uk');
    expect(html).toContain('07700 900123');
    expect(html).toContain('1 Electric Avenue');
  });

  it('returns { success: false } gracefully when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const { sendDealerApplicationEmail } = await import('./_core/email');
    const result = await sendDealerApplicationEmail(SAMPLE_APPLICATION);
    expect(result.success).toBe(false);
  });
});
