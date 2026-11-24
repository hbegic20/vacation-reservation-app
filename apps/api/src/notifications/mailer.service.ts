import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Transporter, createTransport } from "nodemailer";

export interface Email {
  to: string[];
  subject: string;
  text: string;
}

type MailSettings =
  | {
      provider: "smtp";
      from: string;
      host: string;
      port: number;
      user?: string;
      password?: string;
    }
  | { provider: "resend"; from: string; apiKey: string };

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private smtpTransport: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.settings() !== null;
  }

  async send(email: Email): Promise<void> {
    const settings = this.settings();
    if (!settings || email.to.length === 0) {
      return;
    }

    try {
      if (settings.provider === "smtp") {
        await this.sendWithSmtp(settings, email);
      } else {
        await this.sendWithResend(settings, email);
      }
    } catch (error) {
      this.logger.warn(
        `Email "${email.subject}" could not be sent: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private settings(): MailSettings | null {
    const provider = this.config.get<string>("EMAIL_PROVIDER", "");
    const from = this.config.get<string>("EMAIL_FROM", "");
    if (!from) {
      return null;
    }

    if (provider === "smtp") {
      const host = this.config.get<string>("SMTP_HOST", "");
      const port = Number(this.config.get<string>("SMTP_PORT", "587"));
      if (!host || !Number.isInteger(port)) {
        return null;
      }
      return {
        provider,
        from,
        host,
        port,
        user: this.config.get<string>("SMTP_USER") || undefined,
        password: this.config.get<string>("SMTP_PASSWORD") || undefined,
      };
    }

    if (provider === "resend") {
      const apiKey = this.config.get<string>("RESEND_API_KEY", "");
      return apiKey ? { provider, from, apiKey } : null;
    }

    return null;
  }

  private async sendWithSmtp(
    settings: Extract<MailSettings, { provider: "smtp" }>,
    email: Email,
  ) {
    this.smtpTransport ??= createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      auth: settings.user
        ? { user: settings.user, pass: settings.password }
        : undefined,
    });

    await this.smtpTransport.sendMail({
      from: settings.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
    });
  }

  private async sendWithResend(
    settings: Extract<MailSettings, { provider: "resend" }>,
    email: Email,
  ) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: settings.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend responded with ${response.status}`);
    }
  }
}
