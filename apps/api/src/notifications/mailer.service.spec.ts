import { ConfigService } from "@nestjs/config";
import { createTransport } from "nodemailer";
import { MailerService } from "./mailer.service";

jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));

const createTransportMock = createTransport as jest.Mock;

function createMailer(settings: Record<string, string>) {
  const config = {
    get: (key: string, fallback?: string) => settings[key] ?? fallback,
  };
  return new MailerService(config as unknown as ConfigService);
}

const email = {
  to: ["john.employee@company.com"],
  subject: "Vacation approved",
  text: "Your time off was approved.",
};

describe("MailerService", () => {
  let sendMail: jest.Mock;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue({ messageId: "1" });
    createTransportMock.mockReturnValue({ sendMail });
    fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
  });

  it("is disabled without a provider or sender", async () => {
    const mailer = createMailer({ SMTP_HOST: "localhost" });

    expect(mailer.isEnabled()).toBe(false);
    await mailer.send(email);
    expect(createTransportMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends through SMTP when configured", async () => {
    const mailer = createMailer({
      EMAIL_PROVIDER: "smtp",
      EMAIL_FROM: "Vacation Hub <hub@company.local>",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
    });

    await mailer.send(email);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "localhost",
      port: 1025,
      secure: false,
      auth: undefined,
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: "Vacation Hub <hub@company.local>",
      to: ["john.employee@company.com"],
      subject: "Vacation approved",
      text: "Your time off was approved.",
    });
  });

  it("uses credentials and TLS for authenticated SMTP on port 465", async () => {
    const mailer = createMailer({
      EMAIL_PROVIDER: "smtp",
      EMAIL_FROM: "hub@company.com",
      SMTP_HOST: "smtp.company.com",
      SMTP_PORT: "465",
      SMTP_USER: "hub",
      SMTP_PASSWORD: "secret",
    });

    await mailer.send(email);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: true,
        auth: { user: "hub", pass: "secret" },
      }),
    );
  });

  it("reuses one SMTP connection pool for several emails", async () => {
    const mailer = createMailer({
      EMAIL_PROVIDER: "smtp",
      EMAIL_FROM: "hub@company.com",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
    });

    await mailer.send(email);
    await mailer.send(email);

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it("sends through Resend when configured", async () => {
    const mailer = createMailer({
      EMAIL_PROVIDER: "resend",
      EMAIL_FROM: "hub@company.com",
      RESEND_API_KEY: "re_test",
    });

    await mailer.send(email);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toEqual({
      from: "hub@company.com",
      ...email,
    });
  });

  it("does not throw when the mail server is unreachable", async () => {
    sendMail.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const mailer = createMailer({
      EMAIL_PROVIDER: "smtp",
      EMAIL_FROM: "hub@company.com",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
    });

    await expect(mailer.send(email)).resolves.toBeUndefined();
  });

  it("skips sending when there are no recipients", async () => {
    const mailer = createMailer({
      EMAIL_PROVIDER: "resend",
      EMAIL_FROM: "hub@company.com",
      RESEND_API_KEY: "re_test",
    });

    await mailer.send({ ...email, to: [] });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
