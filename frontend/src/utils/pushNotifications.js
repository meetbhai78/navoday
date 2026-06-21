import axios from 'axios';

// Convert VAPID public key from base64 to Uint8Array (required by browser API)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register the Service Worker
 * Returns the ServiceWorkerRegistration or null
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('SW registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
}

/**
 * Request Notification Permission
 * Returns 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe user to push notifications and save subscription to backend
 * @param {string} userToken - JWT token for API auth
 */
export async function subscribeToPushNotifications(userToken) {
  try {
    // 1. Check browser support
    if (!('PushManager' in window)) {
      console.warn('Push messaging not supported');
      return false;
    }

    // 2. Get SW registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      // Already subscribed, save to backend anyway (in case it changed)
      await saveSubscriptionToBackend(existingSubscription, userToken);
      return true;
    }

    // 4. Fetch VAPID public key from backend
    const { data } = await axios.get('/api/notifications/vapid-public-key');
    const vapidPublicKey = data.publicKey;

    if (!vapidPublicKey) {
      console.error('VAPID public key not available');
      return false;
    }

    // 5. Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // 6. Save subscription to backend
    await saveSubscriptionToBackend(subscription, userToken);
    console.log('Push subscription saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push:', error.message);
    return false;
  }
}

/**
 * Save subscription object to backend API
 */
async function saveSubscriptionToBackend(subscription, token) {
  try {
    await axios.post(
      '/api/notifications/subscribe',
      { subscription: subscription.toJSON() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (error) {
    console.error('Failed to save subscription to backend:', error.message);
  }
}

/**
 * Unsubscribe from push notifications (on logout)
 * @param {string} userToken
 */
export async function unsubscribeFromPushNotifications(userToken) {
  try {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from backend first
      await axios.post(
        '/api/notifications/unsubscribe',
        { endpoint: subscription.endpoint },
        { headers: { Authorization: `Bearer ${userToken}` } }
      ).catch(() => {}); // Ignore backend errors on logout

      // Then unsubscribe from browser
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
    }
  } catch (error) {
    console.error('Error unsubscribing:', error.message);
  }
}

/**
 * Full setup: register SW + request permission + subscribe
 * Call this after user login
 * @param {string} userToken
 */
export async function setupPushNotifications(userToken) {
  try {
    // Register Service Worker
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return false;
    }

    // Subscribe to push
    const success = await subscribeToPushNotifications(userToken);
    return success;
  } catch (error) {
    console.error('Push setup error:', error.message);
    return false;
  }
}
