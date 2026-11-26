import type { InjectionKey } from 'vue';
import { inject } from 'vue';
import type { BellaApplicationService } from '../../application/services/BellaApplicationService';

export const USE_CASES: InjectionKey<BellaApplicationService> = Symbol('bella-use-cases');

export function useApplication(): BellaApplicationService {
  const app = inject(USE_CASES);
  if (!app) throw new Error('Falta configurar los casos de uso de BellaStyle Mobile.');
  return app;
}

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : 'Ocurrió un error inesperado.';

export const pesos = (valor: number | string): string =>
  '$' + Number(valor || 0).toLocaleString('es-CO');

// "2026-11-26" -> "jue 26 nov"
export const fechaCorta = (fecha: string): string => {
  const d = new Date(`${fecha}T12:00:00`);
  return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Fecha de hoy en Colombia (YYYY-MM-DD), para no ofrecer días pasados
export const hoyColombia = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
