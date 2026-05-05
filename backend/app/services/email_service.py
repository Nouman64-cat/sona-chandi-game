import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config.settings import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def _send(to_email: str, subject: str, html_body: str) -> None:
        if not all([settings.AWS_SES_USERNAME, settings.AWS_SES_PASSWORD, settings.AWS_SES_FROM_EMAIL]):
            logger.error("AWS SES credentials not configured — email not sent.")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.AWS_SES_FROM_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.AWS_SES_SMTP_HOST, settings.AWS_SES_SMTP_PORT) as server:
            server.starttls()
            server.login(settings.AWS_SES_USERNAME, settings.AWS_SES_PASSWORD)
            server.sendmail(settings.AWS_SES_FROM_EMAIL, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}: {subject}")

    @staticmethod
    def send_password_reset(to_email: str, full_name: str, token: str) -> None:
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
        html = f"""
        <html>
          <body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
            <div style="max-width:520px;margin:40px auto;background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:40px;">
              <h1 style="color:#FFD700;font-style:italic;letter-spacing:-1px;margin-top:0;">SONA CHANDI</h1>
              <h2 style="color:#e5e5e5;margin-top:0;">Password Reset Request</h2>
              <p>Hi <strong>{full_name}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>1 hour</strong>.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="{reset_url}"
                   style="background:#FFD700;color:#000;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;" />
              <p style="color:#555;font-size:12px;text-align:center;">Sona Chandi Game &mdash; zygotrix.com</p>
            </div>
          </body>
        </html>
        """
        EmailService._send(to_email, "Reset Your Sona Chandi Password", html)
