import logging
from dotenv import load_dotenv
from sqlmodel import Session, select

load_dotenv()

logging.basicConfig(level=logging.INFO)

from database import engine
from models.user import User
from services.notifier import check_and_send_alert

# Criar sessão para teste
with Session(engine) as session:
    # Buscar um usuário existente
    user = session.exec(select(User)).first()

    if user:
        print(f"✓ Usuário encontrado: {user.name} ({user.email})")

        # Teste 1: Menos bovinos
        print("\nTeste 1: Menos bovinos que o esperado")
        check_and_send_alert(
            flight_id="teste-menos",
            detected_count=70,
            expected_count=100,
            confidence_avg=0.7,
            operator_id=user.id,
            session=session,
            pasture_name="Pastagem Sul",
        )
        print("Alerta enviado!")

        # Teste 2: Mais bovinos
        print("\nTeste 2: Mais bovinos que o esperado")
        check_and_send_alert(
            flight_id="teste-mais",
            detected_count=120,
            expected_count=100,
            confidence_avg=0.7,
            operator_id=user.id,
            session=session,
            pasture_name="Pastagem Norte",
        )
        print("Alerta enviado!")

        # Teste 3: Contagem correta (não deve enviar alerta)
        print("\nTeste 3: Contagem correta (não deve enviar alerta)")
        check_and_send_alert(
            flight_id="teste-correto",
            detected_count=100,
            expected_count=100,
            confidence_avg=0.7,
            operator_id=user.id,
            session=session,
            pasture_name="Pastagem Central",
        )
        print("Nenhum alerta enviado (como esperado)")
    else:
        print("✗ Nenhum usuário encontrado no banco de dados")
