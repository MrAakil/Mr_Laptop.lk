import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
import logging
from app.config import settings
from app.schemas import ContactInquiry

logger = logging.getLogger(__name__)

def send_contact_email(inquiry: ContactInquiry) -> bool:
    """
    Sends contact form inquiry via Resend API (HTTP POST) or SMTP fallback.
    """
    logger.info(f"RESEND_API_KEY Loaded: {bool(settings.RESEND_API_KEY)}")
    logger.info(f"RESEND_API_KEY Length: {len(settings.RESEND_API_KEY or '')}")
    logger.info(f"SMTP_USER Loaded: {bool(settings.SMTP_USER)}")
    logger.info(f"SMTP_PASSWORD Loaded: {bool(settings.SMTP_PASSWORD)}")

    subject = "New Contact Inquiry - Mr_Laptop.lk"
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5ea; border-radius: 12px;">
        <h2 style="color: #0066ff; border-bottom: 1px solid #e5e5ea; padding-bottom: 12px; margin-bottom: 20px; text-transform: uppercase; font-size: 18px; tracking-tight: 0.05em;">
          New Contact Inquiry
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #767677;">Customer Name:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #111;">{inquiry.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #767677;">Email Address:</td>
            <td style="padding: 8px 0;"><a href="mailto:{inquiry.email}" style="color: #0066ff; text-decoration: none; font-weight: bold;">{inquiry.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #767677;">Phone Number:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #111;">{inquiry.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #767677;">Inquiry Category:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #111; text-transform: uppercase; font-size: 11px;">{inquiry.service}</td>
          </tr>
        </table>
        <div style="background: #f4f4f7; padding: 18px; border-radius: 8px; font-size: 13px; border: 1px solid #e5e5ea;">
          <strong style="display: block; margin-bottom: 8px; color: #767677; font-size: 11px; text-transform: uppercase;">Message Content:</strong>
          <p style="margin: 0; white-space: pre-wrap; color: #111;">{inquiry.message}</p>
        </div>
        <p style="font-size: 10px; color: #767677; margin-top: 32px; border-top: 1px solid #e5e5ea; padding-top: 12px; text-align: center;">
          This email was generated automatically by the contact form on Mr_Laptop.lk.
        </p>
      </body>
    </html>
    """

    plain_content = f"""
    New Contact Inquiry - Mr_Laptop.lk
    ----------------------------------
    Name: {inquiry.name}
    Email: {inquiry.email}
    Phone: {inquiry.phone}
    Category: {inquiry.service}

    Message:
    {inquiry.message}
    """

    # 1. Try sending via Resend API (HTTP client)
    if settings.RESEND_API_KEY:
        try:
            logger.info("Attempting email dispatch via Resend API...")
            resend_url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            # Resend free tier sends to the owner address (SMTP_FROM)
            payload = {
                "from": "Mr_Laptop.lk Inquiry <onboarding@resend.dev>",
                "to": [settings.SMTP_FROM],
                "reply_to": inquiry.email,
                "subject": subject,
                "html": html_content,
                "text": plain_content
            }
            response = httpx.post(resend_url, json=payload, headers=headers, timeout=10.0)
            if response.status_code in (200, 201):
                logger.info("Email sent successfully via Resend API.")
                return True
            else:
                err_msg = f"Resend API error response (Status {response.status_code}): {response.text}"
                logger.error(err_msg)
                if not (settings.SMTP_USER and settings.SMTP_PASSWORD):
                    raise ValueError(err_msg)
        except Exception as e:
            logger.exception("Resend API request exception.")
            if not (settings.SMTP_USER and settings.SMTP_PASSWORD):
                if isinstance(e, ValueError):
                    raise
                raise ValueError(f"Resend API dispatch failed: {e}") from e

    # 2. Try SMTP Fallback if credentials configured
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            logger.info("Attempting email dispatch via SMTP...")
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = settings.SMTP_FROM
            msg["Reply-To"] = inquiry.email

            part1 = MIMEText(plain_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [settings.SMTP_FROM], msg.as_string())
            
            logger.info("Email sent successfully via SMTP.")
            return True
        except Exception as e:
            logger.exception("SMTP transmission failed.")
            raise RuntimeError("Email delivery failed on both Resend and SMTP drivers.") from e

    raise ValueError("No email credentials configured. Please check RESEND_API_KEY or SMTP settings.")
