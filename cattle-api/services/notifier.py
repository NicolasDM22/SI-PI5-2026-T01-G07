import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)

_COUNT_THRESHOLD = 0.9
_CONFIDENCE_THRESHOLD = 0.5


def check_and_send_alert(
    flight_id: str,
    detected_count: Optional[int],
    expected_count: Optional[int],
    confidence_avg: float,
) -> None:
    reasons = []

    if expected_count is not None and expected_count > 0 and detected_count is not None:
        if detected_count < _COUNT_THRESHOLD * expected_count:
            reasons.append(
                f"contagem detectada ({detected_count}) está abaixo de 90% da esperada ({expected_count})"
            )

    if (detected_count or 0) > 0 and confidence_avg < _CONFIDENCE_THRESHOLD:
        reasons.append(f"confiança média ({confidence_avg:.2f}) está abaixo de 0.5")

    if reasons:
        _send_alert(
            flight_id=flight_id,
            detected_count=detected_count or 0,
            expected_count=expected_count or 0,
            reason="; ".join(reasons),
        )


def _send_alert(flight_id: str, detected_count: int, expected_count: int, reason: str) -> None:
    recipient = os.getenv("ALERT_EMAIL")
    if not recipient:
        logger.warning("ALERT_EMAIL não configurado; alerta ignorado para voo %s.", flight_id)
        return

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    subject = f"[Alerta] Voo {flight_id} — contagem abaixo do esperado"
    body = (
        f"Alerta de monitoramento de rebanho\n\n"
        f"Voo ID: {flight_id}\n"
        f"Contagem detectada: {detected_count}\n"
        f"Contagem esperada: {expected_count}\n"
        f"Motivo: {reason}\n"
    )

    msg = MIMEMultipart()
    msg["From"] = smtp_from
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    use_tls = os.getenv("SMTP_TLS", "true").lower() != "false"

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if use_tls:
                server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, recipient, msg.as_string())
        logger.info("Alerta enviado para %s (voo %s).", recipient, flight_id)
    except Exception as exc:
        logger.error("Falha ao enviar alerta para voo %s: %s", flight_id, exc)
