import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
import logging
from datetime import datetime
from app.config import settings
from app.schemas import ContactInquiry
from app.models import Order

logger = logging.getLogger(__name__)

def send_email_helper(to_address: str, subject: str, html_content: str, plain_content: str, reply_to: str = None) -> bool:
    """
    Generalized email dispatcher with Resend API support and SMTP relay fallback.
    Automatically handles sandbox restrictions by rerouting testing emails to the sandbox owner.
    """
    logger.info(f"RESEND_API_KEY Loaded: {bool(settings.RESEND_API_KEY)}")
    logger.info(f"RESEND_API_KEY Length: {len(settings.RESEND_API_KEY or '')}")
    logger.info(f"SMTP_USER Loaded: {bool(settings.SMTP_USER)}")
    logger.info(f"SMTP_PASSWORD Loaded: {bool(settings.SMTP_PASSWORD)}")

    # 1. Try sending via Resend API (HTTP client)
    if settings.RESEND_API_KEY:
        try:
            logger.info(f"Attempting email dispatch to {to_address} via Resend API...")
            resend_url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": "Mr_Laptop.lk <onboarding@resend.dev>",
                "to": [to_address],
                "subject": subject,
                "html": html_content,
                "text": plain_content
            }
            if reply_to:
                payload["reply_to"] = reply_to

            response = httpx.post(resend_url, json=payload, headers=headers, timeout=10.0)
            if response.status_code in (200, 201):
                logger.info("Email sent successfully via Resend API.")
                return True
            else:
                err_msg = f"Resend API error response (Status {response.status_code}): {response.text}"
                logger.error(err_msg)
                
                # Check for sandbox restriction 403, and reroute to sandbox owner if applicable
                if response.status_code == 403 and "validation_error" in response.text and to_address != settings.SMTP_FROM:
                    logger.warning(f"Sandbox restriction detected. Re-routing email to sandbox owner: {settings.SMTP_FROM}")
                    payload["to"] = [settings.SMTP_FROM]
                    response2 = httpx.post(resend_url, json=payload, headers=headers, timeout=10.0)
                    if response2.status_code in (200, 201):
                        logger.info("Email rerouted and sent successfully to sandbox owner.")
                        return True
                    else:
                        err_msg = f"Resend API error after rerouting (Status {response2.status_code}): {response2.text}"
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
            logger.info(f"Attempting email dispatch to {to_address} via SMTP...")
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_address
            if reply_to:
                msg["Reply-To"] = reply_to

            part1 = MIMEText(plain_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [to_address], msg.as_string())
            
            logger.info("Email sent successfully via SMTP.")
            return True
        except Exception as e:
            logger.exception("SMTP transmission failed.")
            raise RuntimeError("Email delivery failed on SMTP relay.") from e

    raise ValueError("No email credentials configured. Please check RESEND_API_KEY or SMTP settings.")

def send_contact_email(inquiry: ContactInquiry) -> bool:
    """
    Sends contact form inquiry to the business address.
    """
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
    
    return send_email_helper(
        to_address=settings.SMTP_FROM,
        subject=subject,
        html_content=html_content,
        plain_content=plain_content,
        reply_to=inquiry.email
    )

def _make_order_html_template(order: Order, title: str, intro_text: str) -> str:
    items_html = ""
    for item in order.items:
        items_html += f"""
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 10px 0; font-size: 13px; color: #111;">
                <div style="font-weight: bold;">{item.product_name}</div>
            </td>
            <td style="padding: 10px 0; text-align: center; font-size: 13px; color: #555;">{item.quantity}</td>
            <td style="padding: 10px 0; text-align: right; font-size: 13px; color: #111; font-weight: bold;">LKR {item.unit_price:,.2f}</td>
        </tr>
        """
        
    return f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5ea; border-radius: 12px;">
        <div style="text-align: center; border-bottom: 2px solid #0066ff; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #0066ff; margin: 0; font-size: 24px; text-transform: uppercase;">Mr_Laptop.lk</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Premium Laptops & Tech Platform</p>
        </div>
        
        <h2 style="color: #333; font-size: 18px; margin-top: 0;">{title}</h2>
        <p style="font-size: 14px; color: #444;">{intro_text}</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eeeeee; margin-bottom: 20px; font-size: 13px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 3px 0; color: #666; font-weight: bold; width: 130px;">Order Number:</td>
                    <td style="padding: 3px 0; font-weight: bold; color: #111;">{order.order_number}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 0; color: #666; font-weight: bold;">Date Placed:</td>
                    <td style="padding: 3px 0; color: #111;">{order.created_at.strftime('%Y-%m-%d %H:%M')}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 0; color: #666; font-weight: bold;">Order Status:</td>
                    <td style="padding: 3px 0; font-weight: bold; color: #0066ff;">{order.order_status}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 0; color: #666; font-weight: bold;">Payment Method:</td>
                    <td style="padding: 3px 0; color: #111;">{order.payment_method} ({order.payment_status})</td>
                </tr>
            </table>
        </div>

        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px; color: #333;">ITEMS ORDERED</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="border-bottom: 2px solid #eeeeee; text-align: left;">
                    <th style="padding-bottom: 8px; font-size: 12px; color: #666;">Product</th>
                    <th style="padding-bottom: 8px; font-size: 12px; color: #666; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; font-size: 12px; color: #666; text-align: right;">Unit Price</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <div style="width: 100%; margin-bottom: 20px;">
            <table style="width: 100%; font-size: 13px; text-align: right;">
                <tr>
                    <td style="width: 70%; padding: 3px 0; color: #666;">Subtotal:</td>
                    <td style="width: 30%; padding: 3px 0; font-weight: bold;">LKR {order.subtotal:,.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 0; color: #666;">Discount:</td>
                    <td style="padding: 3px 0; font-weight: bold; color: #d93838;">-LKR {order.discount:,.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 0; color: #666;">Shipping Fee:</td>
                    <td style="padding: 3px 0; font-weight: bold;">LKR {order.shipping_fee:,.2f}</td>
                </tr>
                <tr style="font-size: 16px; border-top: 1px solid #ddd;">
                    <td style="padding: 10px 0 0 0; color: #111; font-weight: bold;">Total Amount:</td>
                    <td style="padding: 10px 0 0 0; font-weight: bold; color: #0066ff;">LKR {order.total_amount:,.2f}</td>
                </tr>
            </table>
        </div>

        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px; color: #333;">SHIPPING INFORMATION</h3>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eeeeee; font-size: 13px; line-height: 1.5;">
            <strong>{order.customer_name}</strong><br/>
            {order.shipping_address}<br/>
            {order.city}, {order.district}, {order.postal_code}<br/>
            Phone: {order.customer_phone}
        </div>

        <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; font-size: 11px; color: #888;">
            <p>If you have any questions, please contact us at +94 78 978 8848 or reply to this email.</p>
            <p>&copy; {datetime.now().year} Mr_Laptop.lk. All rights reserved.</p>
        </div>
      </body>
    </html>
    """

def send_order_created_email(order: Order) -> bool:
    """
    Fires order creation email updates to customer (receipt) and administrator (alert).
    """
    # 1. Customer Confirmation Email
    cust_subject = f"Order Placed Successfully! #{order.order_number}"
    cust_intro = "Thank you for shopping at Mr_Laptop.lk! We have received your order and are currently verifying details."
    cust_html = _make_order_html_template(order, "Order Confirmation", cust_intro)
    
    cust_plain = f"Order Confirmation\nOrder Number: {order.order_number}\nTotal Amount: LKR {order.total_amount:,.2f}"
    
    send_email_helper(
        to_address=order.customer_email,
        subject=cust_subject,
        html_content=cust_html,
        plain_content=cust_plain
    )
    
    # 2. Admin Alert Email
    admin_subject = f"🚨 NEW ORDER PLACED! #{order.order_number}"
    admin_intro = f"A new order has been received on Mr_Laptop.lk from customer: {order.customer_name}."
    admin_html = _make_order_html_template(order, "New Order Received", admin_intro)
    
    admin_plain = f"New Order Received\nOrder Number: {order.order_number}\nCustomer: {order.customer_name}\nPhone: {order.customer_phone}"
    
    send_email_helper(
        to_address=settings.SMTP_FROM,
        subject=admin_subject,
        html_content=admin_html,
        plain_content=admin_plain
    )
    return True

def send_order_status_email(order: Order) -> bool:
    """
    Dispatches order update notifications to the client dynamically on admin operations.
    """
    status = order.order_status
    subject = f"Your Order status has been updated: {status} #{order.order_number}"
    
    if status == "Confirmed":
        intro = "Great news! Your order has been confirmed by our sales operations team and is scheduled for inventory prep."
    elif status == "Processing":
        intro = "Your order is now being packed and prepared for delivery in our service warehouse."
    elif status == "Shipped":
        tracking_info = f" with tracking number: {order.tracking_number}" if order.tracking_number else ""
        intro = f"Your order has been hand-off to the local courier dispatch {tracking_info}. Get ready to receive your items!"
    elif status == "Delivered":
        intro = "Your order has been marked as DELIVERED. Thank you for choosing Mr_Laptop.lk! Enjoy your laptop."
    elif status == "Cancelled":
        intro = "Your order has been cancelled. If this is unexpected, please call support immediately."
    else:
        intro = f"Your order status is now: {status}."

    html_body = _make_order_html_template(order, f"Order status: {status}", intro)
    plain_body = f"Order status: {status}\nOrder Number: {order.order_number}"

    return send_email_helper(
        to_address=order.customer_email,
        subject=subject,
        html_content=html_body,
        plain_content=plain_body
    )
