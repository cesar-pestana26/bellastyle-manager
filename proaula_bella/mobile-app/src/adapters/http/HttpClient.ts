import type { SessionStore } from '../../domain/ports/out/SessionStore';
import { ApiError, UnauthorizedError } from '../../domain/exceptions/errors';

// Adaptador HTTP: única puerta de salida hacia la API REST de BellaStyle.
// - Agrega el token JWT en la cabecera Authorization: Bearer <token>.
// - Si el servidor responde 401 (token vencido o inválido) cierra la sesión.
// - Espera hasta 60 s: el plan gratis de Render puede tardar en "despertar".
// En el celular, Capacitor (CapacitorHttp) hace la petición de forma nativa, por eso no hay problema de CORS.
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly sessions: SessionStore,
    private readonly onUnauthorized: () => void
  ) {}

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async request<T>(path: string, method = 'GET', body?: unknown, authenticated = true): Promise<T> {
    const token = authenticated ? this.sessions.get()?.token : undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor de BellaStyle. Revisa tu internet e inténtalo de nuevo.', 0);
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.json().catch(() => null);

    if (response.status === 401 && token) {
      this.sessions.clear();
      this.onUnauthorized();
      throw new UnauthorizedError(payload?.message || 'Tu sesión venció. Inicia sesión nuevamente.');
    }
    if (!response.ok || (payload && payload.success === false)) {
      throw new ApiError(payload?.message || 'El servidor no pudo completar la solicitud.', response.status);
    }
    return payload as T;
  }
}
