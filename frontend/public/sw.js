// Navoday Push Notification Service Worker
// This file must be in the public/ folder so it's served at the root /sw.js

const CACHE_NAME = 'navoday-v1';
const APP_URL = self.location.origin;

// ===================== PUSH EVENT =====================
// Triggered when backend sends a push notification via web-push
self.addEventListener('push', (event) => {
  let data = {
    title: 'Navoday',
    body: 'નવી notification આવી છે!',
    icon: '/logo.png',
    badge: '/logo.png',
    url: '/',
    tag: 'navoday-notification'
  };

  try {
    if (event.data) {
      data = { ...data, ...JSON.parse(event.data.text()) };
    }
  } catch (e) {
    console.error('SW: Error parsing push data', e);
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'navoday-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'ખોલો / Open'
      },
      {
        action: 'dismiss',
        title: 'બંધ કરો'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// ===================== NOTIFICATION CLICK EVENT =====================
// Triggered when user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Get the URL from notification data
  const targetUrl = event.notification.data?.url || '/';
  const fullUrl = APP_URL + targetUrl;

  event.waitUntil(
    // Try to focus an already open window/tab
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for an already open Navoday tab
      for (const client of clientList) {
        if (client.url.includes(APP_URL) && 'focus' in client) {
          // Navigate it to the target URL
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      // No open tab found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// ===================== INSTALL & ACTIVATE =====================
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
