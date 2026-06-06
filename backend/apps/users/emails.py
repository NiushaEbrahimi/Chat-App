from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


def send_password_reset_email(user, reset_link):
    subject = 'Reset your ChatApp password'
    
    text_content = f"""
Hi {user.username},

Someone requested a password reset for your ChatApp account.
Click the link below — it expires in 1 hour.

{reset_link}

If you didn't request this, ignore this email.
Your password won't change.

— ChatApp
    """

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px;">
        <h2 style="color: #111;">Reset your password</h2>
        <p>Hi <strong>{user.username}</strong>,</p>
        <p>Someone requested a password reset for your ChatApp account.</p>
        <a href="{reset_link}" 
           style="display:inline-block; margin: 24px 0; padding: 12px 24px;
                  background:#111; color:#fff; border-radius:6px; text-decoration:none;">
            Reset Password
        </a>
        <p style="color:#666; font-size:13px;">This link expires in 1 hour.</p>
        <p style="color:#666; font-size:13px;">If you didn't request this, ignore this email.</p>
    </div>
    """

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send()