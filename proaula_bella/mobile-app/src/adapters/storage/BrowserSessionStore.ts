import type { SessionStore } from '../../domain/ports/out/SessionStore';
import type { BellaSession, ItemCarritoBella } from '../../domain/model/BellaModels';

// Adaptador de almacenamiento: guarda la sesión (con el token) y el carrito en el celular
export const SESSION_KEY = 'bellaSesionMovil';
export const CART_KEY = 'bellaCarritoMovil';

export class BrowserSessionStore implements SessionStore {
  constructor(private readonly storage: Storage) {}

  get(): BellaSession | null {
    try {
      const raw = this.storage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as BellaSession;
      if (!s || typeof s.token !== 'string' || !s.token || !s.rol) {
        this.clear();
        return null;
      }
      return s;
    } catch {
      this.clear();
      return null;
    }
  }

  save(session: BellaSession): void {
    this.storage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  clear(): void {
    this.storage.removeItem(SESSION_KEY);
  }

  getCart(): ItemCarritoBella[] {
    try {
      const raw = this.storage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveCart(items: ItemCarritoBella[]): void {
    this.storage.setItem(CART_KEY, JSON.stringify(items));
  }
}
