from __future__ import annotations
from typing import Dict, List, Optional


def generate_report(flight_id: str, results: List[Dict]) -> Optional[str]:
    """Gera PDF com os resultados do voo e retorna o caminho do arquivo.

    Args:
        flight_id: ID do voo
        results: lista de dicts por frame, cada um com 'frame_path', 'count' e 'detections'

    Returns:
        Caminho do PDF gerado, ou None se falhar
    """
    ...
