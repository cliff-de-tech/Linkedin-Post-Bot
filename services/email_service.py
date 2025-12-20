"""
Email Service for sending contact form emails
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Handle email sending functionality"""
    
    def __init__(self):
        # Gmail SMTP settings (you can change to other providers)
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "cliffdetech@gmail.com")
        
    def send_contact_email(
        self,
        to_email: str,
        from_email: str,
        from_name: str,
        subject: str,
        message: str,
        priority: str = "medium"
    ) -> dict:
        """
        Send contact form email
        
        Args:
            to_email: Recipient email (cliffdetech@gmail.com)
            from_email: Sender's email
            from_name: Sender's name
            subject: Email subject
            message: Email message body
            priority: Priority level (low, medium, high, urgent)
            
        Returns:
            dict: Success status and message
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Reply-To'] = from_email
            
            # Create HTML and plain text versions
            text_body = f"""
Support Request from LinkedIn Post Bot

From: {from_name}
Email: {from_email}
Priority: {priority.upper()}

Subject: {subject}

Message:
{message}

---
This email was sent from the LinkedIn Post Bot contact form.
Reply directly to this email to respond to {from_name}.
            """
            
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #2563eb, #9333ea); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
        .priority {{ display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }}
        .priority-low {{ background: #dbeafe; color: #1e40af; }}
        .priority-medium {{ background: #fef3c7; color: #92400e; }}
        .priority-high {{ background: #fed7aa; color: #9a3412; }}
        .priority-urgent {{ background: #fee2e2; color: #991b1b; }}
        .field {{ margin-bottom: 20px; }}
        .label {{ font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }}
        .value {{ color: #111827; margin-top: 5px; }}
        .footer {{ background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">⚡ LinkedIn Post Bot Support Request</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Priority Level</div>
                <div class="value">
                    <span class="priority priority-{priority.lower()}">{priority.upper()}</span>
                </div>
            </div>
            
            <div class="field">
                <div class="label">From</div>
                <div class="value">{from_name}</div>
            </div>
            
            <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:{from_email}">{from_email}</a></div>
            </div>
            
            <div class="field">
                <div class="label">Subject</div>
                <div class="value">{subject}</div>
            </div>
            
            <div class="field">
                <div class="label">Message</div>
                <div class="value" style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
{message}
                </div>
            </div>
        </div>
        <div class="footer">
            This email was sent from the LinkedIn Post Bot contact form.<br>
            Reply directly to this email to respond to {from_name}.
        </div>
    </div>
</body>
</html>
            """
            
            # Attach both versions
            part1 = MIMEText(text_body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            if self.smtp_username and self.smtp_password:
                # Use SMTP if credentials are provided
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                    
                logger.info(f"Contact email sent successfully to {to_email}")
                return {
                    "success": True,
                    "message": "Email sent successfully"
                }
            else:
                # No SMTP configured - log the message
                logger.warning("SMTP not configured. Email would have been sent:")
                logger.warning(f"To: {to_email}")
                logger.warning(f"From: {from_name} <{from_email}>")
                logger.warning(f"Subject: {subject}")
                logger.warning(f"Message: {message}")
                
                return {
                    "success": False,
                    "message": "SMTP not configured. Please set up email credentials.",
                    "fallback": True
                }
                
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to send email: {str(e)}",
                "fallback": True
            }


# Singleton instance
email_service = EmailService()
