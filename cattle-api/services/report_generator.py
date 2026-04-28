def generate_report(flight_id: str, results: list[dict]) -> str | None:
    """Gera PDF com os resultados do voo e retorna o caminho do arquivo.

    Args:
        flight_id: ID do voo
        results: lista de dicts por frame, cada um com 'frame_path', 'count' e 'detections'

    Returns:
        Caminho do PDF gerado, ou None se falhar
    """
    ...
