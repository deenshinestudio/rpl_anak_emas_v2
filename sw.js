const CACHE_NAME = 'rpl-anak-emas-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/courses.js',
    './js/supabase.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting()) // activate new SW immediately
    );
});

self.addEventListener('activate', (e) => {
    // Clean up old caches
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then((response) => {
                return response || fetch(e.request);
            })
    );
});

// =============================================
// WEB PUSH: Receive push from server
// =============================================
self.addEventListener('push', (e) => {
    let data = {
        title: '⏰ RPL Anak Emas',
        body: 'Kamu punya pengingat tugas baru!'
    };

    // Server sends JSON payload: { title, body, icon }
    if (e.data) {
        try {
            data = { ...data, ...e.data.json() };
        } catch (_) {
            data.body = e.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        tag: data.tag || 'rpl-push-notif',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
            url: self.registration.scope // open app on click
        }
    };

    e.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// =============================================
// WEB PUSH: User clicked notification
// =============================================
self.addEventListener('notificationclick', (e) => {
    e.notification.close();

    const targetUrl = (e.notification.data && e.notification.data.url)
        ? e.notification.data.url
        : self.registration.scope;

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // If app is already open, focus it
            for (const client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

