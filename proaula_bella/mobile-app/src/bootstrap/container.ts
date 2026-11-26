import { Capacitor } from '@capacitor/core';
import { BrowserSessionStore } from '../adapters/storage/BrowserSessionStore';
import { HttpClient } from '../adapters/http/HttpClient';
import { BellaApplicationService } from '../application/services/BellaApplicationService';

export const SERVIDOR = (import.meta.env.VITE_SERVIDOR as string | undefined) || 'https://bellastyle.onrender.com';

const origen = Capacitor.isNativePlatform() ? SERVIDOR : '';
const store = new BrowserSessionStore(localStorage);

export const useCases = new BellaApplicationService(
  new HttpClient(`${origen}/api`, store, () => window.dispatchEvent(new Event('session-expired'))),
  store,
  origen
);
