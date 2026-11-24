process.env.JWT_SECRET = "test-jwt-secret";
process.env.SLACK_WEBHOOK_URL = "";
process.env.EMAIL_PROVIDER = "";
process.env.RESEND_API_KEY = "";
process.env.EMAIL_FROM = "";

global.fetch = () =>
  Promise.reject(new Error("Network access is disabled in tests"));
