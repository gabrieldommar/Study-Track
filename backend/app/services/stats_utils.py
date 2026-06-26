"""Utilidades compartidas de agregación temporal.

Reutilizadas por el módulo de estudio y por el de hábitos: ambos comparten
el patrón de "sumar horas agrupadas por período".
"""
import calendar
from datetime import date

# Períodos válidos para los endpoints de estadísticas
VALID_PERIODS = ("week", "month", "total")


def period_key(d: date, period: str) -> str:
    """Devuelve la clave de agrupación de una fecha según el período.

    - week  -> "2026-W25" (semana ISO)
    - month -> "2026-06"
    - total -> "total" (todo el histórico en un solo bucket)
    """
    if period == "week":
        iso_year, iso_week, _ = d.isocalendar()
        return f"{iso_year}-W{iso_week:02d}"
    if period == "month":
        return f"{d.year}-{d.month:02d}"
    return "total"


def expected_occurrences(frequency: str, period: str, dates: list[date]) -> int:
    """Calcula cuántas veces *debería* realizarse un hábito en un bucket de período.

    Sirve para el "planeado" de los hábitos (frequency × duración objetivo).
    - week  : daily=7, weekly=1
    - month : daily=días del mes, weekly=semanas del mes (~4-5)
    - total : según el rango entre el primer y el último registro
    """
    is_daily = frequency == "daily"
    if period == "week":
        return 7 if is_daily else 1
    if period == "month":
        ref = dates[0]
        days_in_month = calendar.monthrange(ref.year, ref.month)[1]
        return days_in_month if is_daily else -(-days_in_month // 7)  # ceil división
    # period == "total": se estima por el span de fechas registradas
    span_days = (max(dates) - min(dates)).days + 1
    return span_days if is_daily else (span_days // 7 + 1)
