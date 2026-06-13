"use client";

interface QueuedSubmission {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("xcreatives-sync", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("formSubmissions")) {
        db.createObjectStore("formSubmissions", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

export async function queueFormSubmission(submission: Omit<QueuedSubmission, "timestamp">) {
  const db = await openSyncDB();
  const tx = db.transaction("formSubmissions", "readwrite");
  const store = tx.objectStore("formSubmissions");
  await new Promise<void>((resolve, reject) => {
    const req = store.add({ ...submission, timestamp: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Request background sync
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register("form-submissions");
  }
}

export async function getQueuedSubmissions(): Promise<QueuedSubmission[]> {
  const db = await openSyncDB();
  const tx = db.transaction("formSubmissions", "readonly");
  const store = tx.objectStore("formSubmissions");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearQueuedSubmission(id: number) {
  const db = await openSyncDB();
  const tx = db.transaction("formSubmissions", "readwrite");
  const store = tx.objectStore("formSubmissions");
  await new Promise<void>((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

export function subscribeToNetworkChanges(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
