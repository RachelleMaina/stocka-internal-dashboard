const DB_NAME = "stocka_indexed_db";
const SALE_STORE_NAME = "sales";
const BILL_STORE_NAME = "bills";
const CACHE_NAME = "stocka-app-cache-v14";

const urlParams = new URLSearchParams(self.location.search);
const baseURL = urlParams.get("baseUrl") || "http://localhost:5001";


// Core assets to cache
async function cacheCoreAssets() {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll([
    "/manifest.json",
    "/favicon.ico",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/offline.html",
  ]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheCoreAssets());
  self.skipWaiting();
});

async function clearOldCaches() {
  const cacheNames = await caches.keys();
  return await Promise.all(
    cacheNames
      .filter((name) => name !== CACHE_NAME)
      .map((name) => caches.delete(name))
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await clearOldCaches();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "NEW_VERSION_AVAILABLE" });
      }
    })()
  );
  self.clients.claim();
});

// Open  IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME); 

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SALE_STORE_NAME) || !db.objectStoreNames.contains(BILL_STORE_NAME)) {
        db.close();
        reject(new Error(`Object store "${SALE_STORE_NAME}" or "${BILL_STORE_NAME}" does not exist.`));
        return;
      }
      resolve(db);
    };

  request.onupgradeneeded = () => {
      // If onupgradeneeded fires, it means either the DB didn’t exist
      // or a higher version was requested. We reject to avoid auto-creating anything.
      request.transaction?.db.close();
      reject(new Error("Database upgrade was triggered — expected existing DB only."));
    };
  });
}

// Helper function to delete a record from a specified store
function deleteFromStore(storeName, tempId) {

  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(tempId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Sales-related functions
function getAllUnsyncedSales() {
  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(SALE_STORE_NAME, "readonly");
    const store = tx.objectStore(SALE_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () =>
      resolve(request.result.filter((sale) => sale.sync_status !== "synced"));
    request.onerror = () => reject(request.error);
  });
}

function updateSale(sale) {
  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(SALE_STORE_NAME, "readwrite");
    const store = tx.objectStore(SALE_STORE_NAME);
    const request = store.put(sale);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getSale(tempId) {
  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(SALE_STORE_NAME, "readonly");
    const store = tx.objectStore(SALE_STORE_NAME);
    const request = store.get(tempId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function syncSale(tempId) {
  const sale = await getSale(tempId);
  if (!sale || sale.sync_status === "synced") return;

  try {
    const res = await fetch(
      `${baseURL}/api/store-locations/${sale.store_location_id}/sale`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sale),
      }
    );

    const result = await res.json();

    if (result?.status !="201") {
      await updateSale({ ...sale, sync_status: "failed", error: result.error });
    } else {
      // Delete the sale from IndexedDB after successful sync
      const dl = await deleteFromStore(SALE_STORE_NAME, tempId);
      console.log(dl, "here deleted")
    }
  } catch (err) {
 
    await updateSale({
      ...sale,
      sync_status: "failed",
      error: err.message || "Network error",
    });
  }
}

async function syncAllPendingSales() {
  const sales = await getAllUnsyncedSales();
  for (const sale of sales) {
    await syncSale(sale.temp_id);
  }
}

// Bills-related functions
function getAllUnsyncedBills() {
  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(BILL_STORE_NAME, "readonly");
    const store = tx.objectStore(BILL_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () =>
      resolve(request.result.filter((bill) => bill.sync_status !== "synced"));
    request.onerror = () => reject(request.error);
  });
}

function updateBill(bill) {
  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(BILL_STORE_NAME, "readwrite");
    const store = tx.objectStore(BILL_STORE_NAME);
    const request = store.put(bill);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getBill(id) {
  return new Promise(async (resolve, reject) => {
    const db = await openIndexedDB();
    const tx = db.transaction(BILL_STORE_NAME, "readonly");
    const store = tx.objectStore(BILL_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function syncBill(id) {
  const bill = await getBill(id);
  if (!bill || bill.sync_status === "synced") return;

  try {
  const res = await fetch(
      `${baseURL}/api/store-locations/${bill.store_location_id}/bill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bill),
      }
    );

    const result = await res.json();
    if (result?.status != "201") {

      await updateBill({ ...bill, sync_status: "failed", error: result.error });
    } else {
      // Delete the bill from IndexedDB after successful sync
      await deleteFromStore(BILL_STORE_NAME, id);
    }
  } catch (err) {
    console.log(err);
    await updateBill({
      ...bill,
      sync_status: "failed",
      error: err.message || "Network error",
    });
  }
}

async function syncAllPendingBills() {
  const bills = await getAllUnsyncedBills();
  for (const bill of bills) {
    await syncBill(bill.id);
  }
}

async function networkFirstStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === baseURL) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  if (request.mode === "navigate") {
    if (url.pathname.startsWith("/pos")) {
      event.respondWith(
        caches.match(request).then(async (cached) => {
          if (cached) {
            console.log("[SW] ✅ POS page found in cache:", request.url);
            return cached;
          }

          try {
            const response = await fetch(request);
            const cloned = response.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, cloned);
            return response;
          } catch (err) {
            console.warn(
              "[SW] ❌ Network failed for POS page. Serving offline.html:",
              request.url,
              err
            );
            return caches.match("/offline.html");
          }
        })
      );
    } else {
      event.respondWith(
        fetch(request).catch((err) => {
          console.warn(
            "[SW] ❌ Backoffice offline — showing offline.html:",
            request.url,
            err
          );
          return caches.match("/offline.html");
        })
      );
    }
    return;
  }

  if (request.method === "GET" && request.referrer.includes("/pos")) {
    console.log("[SW] → POS static asset — caching on demand:", request.url);
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          console.log("[SW] ✅ Static asset found in cache:", request.url);
          return cached;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, cloned);
                console.log("[SW] ✅ Fetched and cached asset:", request.url);
              });
            } else {
              console.warn(
                "[SW] ❌ Failed to fetch static asset:",
                request.url,
                response.status
              );
            }
            return response;
          })
          .catch((err) => {
            console.warn(
              "[SW] ❌ Static asset fetch failed:",
              request.url,
              err
            );
            return new Response("", { status: 404 });
          });
      })
    );
    return;
  }

  console.log("[SW] → Misc request — fetching without caching:", request.url);
  event.respondWith(fetch(request));
});

self.addEventListener("sync", (event) => {
  console.log("[SW] Sync event:", event.tag);

  const channel = new BroadcastChannel("sync_channel");

  if (event.tag === "SYNC_SALES") {
    channel.postMessage({ status: "started", type: "sales" });
    event.waitUntil(
      syncAllPendingSales()
        .then(() => {
          channel.postMessage({ status: "completed", type: "sales" });
        })
        .catch((err) => {
          console.error("Sales Background Sync failed:", err);
          channel.postMessage({ status: "failed", type: "sales" });
        })
        .finally(() => {
          channel.close();
        })
    );
  } else if (event.tag === "SYNC_BILLS") {
    channel.postMessage({ status: "started", type: "bills" });
    event.waitUntil(
      syncAllPendingBills()
        .then(() => {
          channel.postMessage({ status: "completed", type: "bills" });
        })
        .catch((err) => {
          console.error("Bills Background Sync failed:", err);
          channel.postMessage({ status: "failed", type: "bills" });
        })
        .finally(() => {
          channel.close();
        })
    );
  }
});

self.addEventListener("message", (event) => {
  const { data } = event;
  console.log("[SW] Message received:", data);

  const channel = new BroadcastChannel("sync_channel");

  if (data?.type === "TRIGGER_SYNC_SALES") {
    channel.postMessage({ status: "started", type: "sales" });
    event.waitUntil(
      syncAllPendingSales()
        .then(() => {
          channel.postMessage({ status: "completed", type: "sales" });
        })
        .catch((err) => {
          console.error("Manual Sales Sync failed:", err);
          channel.postMessage({ status: "failed", type: "sales" });
        })
        .finally(() => {
          channel.close();
        })
    );
  } else if (data?.type === "TRIGGER_SYNC_BILLS") {
    channel.postMessage({ status: "started", type: "bills" });
    event.waitUntil(
      syncAllPendingBills()
        .then(() => {
          channel.postMessage({ status: "completed", type: "bills" });
        })
        .catch((err) => {
          console.error("Manual Bills Sync failed:", err);
          channel.postMessage({ status: "failed", type: "bills" });
        })
        .finally(() => {
          channel.close();
        })
    );
  } else if (data?.type === "USER_CONFIRMED_UPDATE") {
    self.skipWaiting();
  }
});
