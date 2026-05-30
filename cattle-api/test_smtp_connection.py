import smtplib
from dotenv import load_dotenv
import os

load_dotenv()

host = os.getenv("SMTP_HOST")
port = int(os.getenv("SMTP_PORT"))
user = os.getenv("SMTP_USER")
password = os.getenv("SMTP_PASSWORD")

print(f"Conectando a {host}:{port}")
print(f"User: {user}")

try:
    server = smtplib.SMTP(host, port, timeout=10)
    print("✓ Conectado")

    server.set_debuglevel(1)
    server.login(user, password)
    print("✓ Login OK")

    server.quit()
except Exception as e:
    print(f"✗ Erro: {e}")
    import traceback
    traceback.print_exc()
