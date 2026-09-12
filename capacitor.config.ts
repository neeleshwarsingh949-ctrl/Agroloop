import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agroloop.app',
  appName: 'AgroLoop',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  }
};

export default config;