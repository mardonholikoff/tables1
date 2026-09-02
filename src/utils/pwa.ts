/**
 * PWA Service Worker Registration & Install Prompt Handler
 */

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installApp: () => Promise<void>;
}

let deferredPrompt: any = null;

export function registerServiceWorker(onUpdateFound?: () => void) {
  if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Daewoo PWA Service Worker registered with scope:', reg.scope);

          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (onUpdateFound) onUpdateFound();
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Daewoo PWA Service Worker registration failed:', err);
        });
    });
  }
}

export function initPWAInstallPrompt(onStateChange: (state: { isInstallable: boolean }) => void) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    onStateChange({ isInstallable: true });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onStateChange({ isInstallable: false });
    console.log('Daewoo PWA muvaffaqiyatli o\'rnatildi!');
  });
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}
