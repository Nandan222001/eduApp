/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

const API_CACHE_ENDPOINTS = [
  '/api/v1/auth/me',
  '/api/v1/dashboard',
];

const CACHE_STRATEGY = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 50; // Maximum number of items in dynamic cache

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== API_CACHE_NAME &&
            cacheName !== IMAGE_CACHE_NAME
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Determine caching strategy based on request type
  if (request.method !== 'GET') {
    // Handle POST, PUT, DELETE requests (background sync)
    event.respondWith(handleNonGetRequest(request));
    return;
  }
  
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First strategy
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
  } else if (isImageRequest(request)) {
    // Image requests - Cache First strategy
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE_NAME));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - Cache First strategy
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
  } else {
    // Dynamic content - Stale While Revalidate strategy
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE_NAME));
  }
});

// Caching strategies
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName, MAX_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache First Strategy Error:', error);
    return await caches.match('/offline.html');
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName, MAX_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are currently offline. This data may be outdated.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
        await trimCache(cacheName, MAX_CACHE_SIZE);
      }
      return networkResponse;
    })
    .catch(async () => {
      return cachedResponse || (await caches.match('/offline.html'));
    });
  
  return cachedResponse || fetchPromise;
}

// Handle POST, PUT, DELETE requests
async function handleNonGetRequest(request) {
  try {
    // Try to send the request
    const response = await fetch(request.clone());
    return response;
  } catch (error) {
    console.log('[Service Worker] Network unavailable, queuing request');
    
    // If offline, queue the request for background sync
    if ('sync' in self.registration) {
      const requestData = {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.clone().text(),
        timestamp: Date.now(),
      };
      
      // Store in IndexedDB for background sync
      await storeRequestForSync(requestData);
      
      // Register background sync
      await self.registration.sync.register('sync-requests');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Request queued for sync when online',
          queued: true,
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline and this action cannot be completed',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  try {
    const db = await openDatabase();
    const requests = await getAllQueuedRequests(db);
    
    console.log(`[Service Worker] Syncing ${requests.length} queued requests`);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          await removeQueuedRequest(db, requestData.id);
          console.log('[Service Worker] Successfully synced request:', requestData.url);
          
          // Notify clients of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              requestData,
            });
          });
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'notification',
    requireInteraction: false,
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions || [],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handler for communication with clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Utility functions
function isImageRequest(request) {
  return request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isStaticAsset(pathname) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(pathname);
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
}

// IndexedDB operations for queue sync
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pwa-sync-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        const objectStore = db.createObjectStore('sync-queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function storeRequestForSync(requestData) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const objectStore = transaction.objectStore('sync-queue');
    const request = objectStore.add(requestData);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllQueuedRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync-queue'], 'readonly');
    const objectStore = transaction.objectStore('sync-queue');
    const request = objectStore.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeQueuedRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const objectStore = transaction.objectStore('sync-queue');
    const request = objectStore.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
