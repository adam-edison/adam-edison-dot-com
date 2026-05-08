import { describe, it, expect, beforeEach } from 'vitest';
import { EmailService } from '@/features/contact/EmailService';
import { Configuration } from '@/shared/config/Configuration';

describe('EmailService', () => {
  describe('fromEnv', () => {
    beforeEach(() => {
      Configuration.reset();
    });

    it('builds an EmailService whose configuration mirrors Configuration values', () => {
      Configuration.forTesting({
        RESEND_API_KEY: 'rk_test',
        FROM_EMAIL: 'sender@example.test',
        TO_EMAIL: 'inbox@example.test',
        EMAIL_SENDER_NAME: 'Sender Name',
        EMAIL_RECIPIENT_NAME: 'Recipient Name',
        SEND_EMAIL_ENABLED: 'true'
      });

      const service = EmailService.fromEnv();

      expect(service.getConfiguration()).toEqual({
        apiKey: 'rk_test',
        fromEmail: 'sender@example.test',
        toEmail: 'inbox@example.test',
        senderName: 'Sender Name',
        recipientName: 'Recipient Name',
        sendEmailEnabled: true
      });
    });

    it('exposes sendEmailEnabled as false when SEND_EMAIL_ENABLED is missing', () => {
      Configuration.forTesting({ SEND_EMAIL_ENABLED: undefined });

      const service = EmailService.fromEnv();

      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });

    it('exposes sendEmailEnabled as false when SEND_EMAIL_ENABLED is "false"', () => {
      Configuration.forTesting({ SEND_EMAIL_ENABLED: 'false' });

      const service = EmailService.fromEnv();

      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });

    it('exposes sendEmailEnabled as true only when SEND_EMAIL_ENABLED equals "true"', () => {
      Configuration.forTesting({ SEND_EMAIL_ENABLED: 'true' });

      const service = EmailService.fromEnv();

      expect(service.getConfiguration().sendEmailEnabled).toBe(true);
    });

    it('aborts with an error naming the invalid field when Configuration is invalid', () => {
      expect(() => Configuration.forTesting({ FROM_EMAIL: 'not-an-email' })).toThrow(/FROM_EMAIL/);
    });
  });
});
