import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

from services.notifier import check_and_send_alert

print("\nCaso 1: contagem abaixo de 90% → deve enviar alerta")
check_and_send_alert(
    flight_id="voo-teste-001",
    detected_count=80,
    expected_count=100,
    confidence_avg=0.7,
)

print("\nCaso 2: confidence_avg baixo → deve enviar alerta")
check_and_send_alert(
    flight_id="voo-teste-002",
    detected_count=95,
    expected_count=100,
    confidence_avg=0.3,
)

print("\nCaso 3: tudo OK → não deve enviar")
check_and_send_alert(
    flight_id="voo-teste-003",
    detected_count=95,
    expected_count=100,
    confidence_avg=0.8,
)

print("\nPronto. Abra http://localhost:8025 para ver os e-mails.")
