import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

// Configuración de Capacitor: empaqueta la app Vue + Ionic (carpeta dist) como app Android.
const config: CapacitorConfig = {
  appId: 'co.edu.unicolombo.bellastyle',
  appName: 'BellaStyle',
  webDir: 'dist',
  plugins: {
    // Peticiones HTTP nativas desde el celular: llegan a la API de Render sin bloqueo de CORS
    CapacitorHttp: { enabled: true },
    Keyboard: { resize: KeyboardResize.Body, resizeOnFullScreen: true },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#07060b',
      showSpinner: false,
    },
  },
};

export default config;
