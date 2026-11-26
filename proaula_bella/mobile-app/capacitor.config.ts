import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'co.edu.unicolombo.bellastyle',
  appName: 'BellaStyle',
  webDir: 'dist',
  plugins: {
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
