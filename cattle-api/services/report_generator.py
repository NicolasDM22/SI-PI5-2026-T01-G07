import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fpdf import FPDF
from sqlmodel import Session

from database import engine
from models.flight import Flight

logger = logging.getLogger(__name__)

_REPORTS_DIR = Path("outputs") / "reports"


def generate_report(flight_id: str, results: list[dict]) -> Optional[str]:
    """Gera PDF com os resultados do voo e retorna o caminho do arquivo.

    Args:
        flight_id: ID do voo
        results: lista de dicts por frame, cada um com 'frame_path', 'count', 'detections'
                 e opcionalmente 'annotated_image_path' no primeiro elemento

    Returns:
        Caminho do PDF gerado, ou None se falhar
    """
    with Session(engine) as session:
        flight = session.get(Flight, flight_id)
        if not flight:
            logger.error(f"Voo não encontrado para relatório: {flight_id}")
            return None

        try:
            _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
            pdf_path = _REPORTS_DIR / f"{flight_id}.pdf"

            annotated_image_path = next(
                (r["annotated_image_path"] for r in results if r.get("annotated_image_path")),
                None,
            )

            _build_pdf(flight, annotated_image_path, str(pdf_path))

            flight.report_path = str(pdf_path)
            session.add(flight)
            session.commit()

            logger.info(f"Relatório gerado: {pdf_path}")
            return str(pdf_path)

        except Exception as e:
            logger.error(f"Erro ao gerar relatório do voo {flight_id}: {e}")
            return None


def _build_pdf(flight: Flight, annotated_image_path: Optional[str], output_path: str) -> None:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    _draw_header(pdf, flight)
    _draw_info_table(pdf, flight)
    _draw_annotated_image(pdf, annotated_image_path)
    _draw_anomalies(pdf, flight)
    _draw_footer(pdf)

    pdf.output(output_path)


def _draw_header(pdf: FPDF, flight: Flight) -> None:
    pdf.set_fill_color(34, 85, 34)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 14, "Cattle Monitor - Relatorio de Monitoramento", new_x="LMARGIN", new_y="NEXT", align="C", fill=True)

    pdf.set_text_color(34, 85, 34)
    pdf.set_font("Helvetica", "B", 13)
    project_name = flight.name or f"Voo {flight.id[:8]}"
    pdf.ln(3)
    pdf.cell(0, 8, project_name, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)

    pdf.set_draw_color(34, 85, 34)
    pdf.set_line_width(0.5)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(5)


def _draw_info_table(pdf: FPDF, flight: Flight) -> None:
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Dados do Monitoramento", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    detected = flight.detected_count if flight.detected_count is not None else 0
    expected = flight.expected_count if flight.expected_count is not None else 0
    diff = detected - expected
    diff_str = f"{diff:+d}" if flight.expected_count is not None else "N/A"

    start_ts_str = flight.start_ts.strftime("%d/%m/%Y %H:%M") if flight.start_ts else "N/A"

    rows = [
        ("Localizacao (pasto)", flight.pasture_name or "N/A"),
        ("Horario do monitoramento", start_ts_str),
        ("Animais detectados", str(detected) if flight.detected_count is not None else "N/A"),
        ("Animais esperados", str(expected) if flight.expected_count is not None else "N/A"),
        ("Diferenca (detectado - esperado)", diff_str),
    ]

    label_w = 90
    value_w = 90
    row_h = 9

    for label, value in rows:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(240, 248, 240)
        pdf.cell(label_w, row_h, label, border=1, fill=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_fill_color(255, 255, 255)
        pdf.cell(value_w, row_h, value, border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)


def _draw_annotated_image(pdf: FPDF, annotated_image_path: Optional[str]) -> None:
    pdf.set_text_color(34, 85, 34)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Imagem Anotada (Frame com maior contagem)", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(2)

    if annotated_image_path and Path(annotated_image_path).exists():
        img_w = 160
        x = (pdf.w - img_w) / 2
        pdf.image(annotated_image_path, x=x, w=img_w)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(128, 128, 128)
        pdf.cell(0, 8, "Imagem anotada não disponível.", new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)


def _draw_anomalies(pdf: FPDF, flight: Flight) -> None:
    pdf.set_draw_color(34, 85, 34)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(4)

    pdf.set_text_color(34, 85, 34)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Anomalias", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(2)

    anomalies = _detect_anomalies(flight)

    if anomalies:
        pdf.set_font("Helvetica", "", 10)
        for anomaly in anomalies:
            pdf.set_text_color(180, 0, 0)
            pdf.multi_cell(0, 7, f"  * {anomaly}", new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(0, 128, 0)
        pdf.cell(0, 7, "Nenhuma anomalia detectada neste monitoramento.", new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)


def _draw_footer(pdf: FPDF) -> None:
    pdf.set_draw_color(180, 180, 180)
    pdf.set_line_width(0.3)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(3)

    generated_at = datetime.utcnow().strftime("%d/%m/%Y %H:%M UTC")
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, f"Relatorio gerado em {generated_at} - Cattle Monitor", align="C", new_x="LMARGIN", new_y="NEXT")


def _detect_anomalies(flight: Flight) -> list[str]:
    anomalies = []
    if flight.expected_count is not None and flight.detected_count is not None:
        diff = flight.detected_count - flight.expected_count
        if diff < 0:
            anomalies.append(
                f"Contagem abaixo do esperado: {abs(diff)} animal(is) não localizado(s) "
                f"(detectado: {flight.detected_count}, esperado: {flight.expected_count})."
            )
        elif diff > 0:
            anomalies.append(
                f"Contagem acima do esperado: {diff} animal(is) a mais detectado(s) "
                f"(detectado: {flight.detected_count}, esperado: {flight.expected_count})."
            )
    return anomalies
