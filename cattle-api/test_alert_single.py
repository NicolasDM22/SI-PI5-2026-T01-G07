import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

from services.notifier import check_and_send_alert

print("Enviando um único alerta de teste...")
check_and_send_alert(
    flight_id="voo-teste-real",
    detected_count=80,
    expected_count=100,
    confidence_avg=0.7,
)

print("E-mail enviado. Verifique a caixa de entrada/spam.")
