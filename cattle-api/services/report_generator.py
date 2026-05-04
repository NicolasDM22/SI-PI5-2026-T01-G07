import logging
import os
from datetime import datetime
from pathlib import Path

from fpdf import FPDF

logger = logging.getLogger(__name__)

REPORTS_DIR = Path("outputs") / "reports"


def generate_report(flight_id: str, results: list[dict]) -> str | None:
    """Gera PDF com os resultados do voo e retorna o caminho do arquivo.

    Args:
        flight_id: ID do voo
        results: lista de dicts por frame, cada um com 'frame_path', 'count' e 'detections'

    Returns:
        Caminho do PDF gerado, ou None se falhar
    """
    try:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        report_path = REPORTS_DIR / f"{flight_id}.pdf"

        total_frames = len(results)
        max_count = max((r.get("count", 0) for r in results), default=0)
        avg_conf = (
            sum(r.get("confidence_avg", 0.0) for r in results) / total_frames
            if total_frames > 0 else 0.0
        )

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Cabeçalho
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "Relatório de Detecção de Gado", ln=True, align="C")
        pdf.ln(4)

        pdf.set_font("Helvetica", size=10)
        pdf.cell(0, 6, f"Voo: {flight_id}", ln=True)
        pdf.cell(0, 6, f"Gerado em: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", ln=True)
        pdf.ln(6)

        # Resumo
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Resumo", ln=True)
        pdf.set_font("Helvetica", size=10)

        pdf.set_fill_color(240, 240, 240)
        _summary_row(pdf, "Total de frames analisados", str(total_frames))
        _summary_row(pdf, "Máximo de animais detectados", str(max_count), fill=True)
        _summary_row(pdf, "Confiança média geral", f"{avg_conf:.1%}")
        pdf.ln(6)

        # Tabela de frames
        if results:
            pdf.set_font("Helvetica", "B", 12)
            pdf.cell(0, 8, "Detalhes por Frame", ln=True)
            pdf.set_font("Helvetica", "B", 9)

            col_w = [14, 60, 30, 30]
            headers = ["#", "Frame", "Qtd. Animais", "Confiança"]
            for w, h in zip(col_w, headers):
                pdf.cell(w, 7, h, border=1, align="C")
            pdf.ln()

            pdf.set_font("Helvetica", size=9)
            for i, row in enumerate(results):
                frame_name = Path(row.get("frame_path", "")).name or "-"
                count = str(row.get("count", 0))
                conf = f"{row.get('confidence_avg', 0.0):.1%}" if row.get("count", 0) > 0 else "-"
                fill = i % 2 == 0
                if fill:
                    pdf.set_fill_color(248, 248, 248)
                else:
                    pdf.set_fill_color(255, 255, 255)
                pdf.cell(col_w[0], 6, str(i + 1), border=1, align="C", fill=True)
                pdf.cell(col_w[1], 6, frame_name[:35], border=1, fill=True)
                pdf.cell(col_w[2], 6, count, border=1, align="C", fill=True)
                pdf.cell(col_w[3], 6, conf, border=1, align="C", fill=True)
                pdf.ln()

        pdf.output(str(report_path))
        logger.info(f"Relatório gerado: {report_path}")
        return str(report_path)

    except Exception as e:
        logger.error(f"Erro ao gerar relatório do voo {flight_id}: {e}")
        return None


def _summary_row(pdf: FPDF, label: str, value: str, fill: bool = False) -> None:
    if fill:
        pdf.set_fill_color(240, 240, 240)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.cell(100, 6, label, border=1, fill=True)
    pdf.cell(40, 6, value, border=1, align="C", fill=True)
    pdf.ln()
