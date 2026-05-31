import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from sqlmodel import Session, select

from models.user import User

logger = logging.getLogger(__name__)


def check_and_send_alert(
    flight_id: str,
    detected_count: Optional[int],
    expected_count: Optional[int],
    confidence_avg: float,
    operator_id: Optional[str] = None,
    session: Optional[Session] = None,
    pasture_name: Optional[str] = None,
) -> None:
    if expected_count is None or expected_count <= 0 or detected_count is None:
        return

    if detected_count == expected_count:
        return

    _send_alert(
        flight_id=flight_id,
        detected_count=detected_count,
        expected_count=expected_count,
        operator_id=operator_id,
        session=session,
        pasture_name=pasture_name,
    )


def _send_alert(
    flight_id: str,
    detected_count: int,
    expected_count: int,
    operator_id: Optional[str] = None,
    session: Optional[Session] = None,
    pasture_name: Optional[str] = None,
) -> None:
    recipient = None

    if operator_id and session:
        try:
            user = session.exec(select(User).where(User.id == operator_id)).first()
            if user:
                recipient = user.email
        except Exception as exc:
            logger.warning("Falha ao buscar email do usuário %s: %s", operator_id, exc)

    if not recipient:
        recipient = os.getenv("ALERT_EMAIL")

    if not recipient:
        logger.warning("Nenhum destinatário para alerta do voo %s.", flight_id)
        return

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    diff = detected_count - expected_count
    direction = "abaixo" if diff < 0 else "acima"
    abs_diff = abs(diff)

    subject = f"[Alerta] Contagem de gado {direction} do esperado"
    body = (
        f"Alerta de monitoramento de rebanho\n\n"
        f"Contagem detectada: {detected_count}\n"
        f"Contagem esperada: {expected_count}\n"
        f"Diferença: {abs_diff} animal{'ais' if abs_diff > 1 else ''} {direction}\n"
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
