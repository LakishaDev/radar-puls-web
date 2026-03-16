self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Radar Puls",
    body: "Stigla je nova prijava u tvojoj zoni.",
    url: "/sr-latn/mapa",
    urgent: false,
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = {...payload, ...data};
    }
  } catch {
    // Keep default payload when push payload is not valid JSON.
  }

  const options = payload.urgent
    ? {
      body: payload.body || "Stigla je nova prijava u tvojoj zoni.",
      icon: "/images/icon-192.png",
      badge: "/images/icon-96.png",
      vibrate: [200, 100, 200, 100, 300],
      tag: payload.tag || "radar-puls-urgent",
      renotify: true,
      requireInteraction: true,
      data: {url: payload.url || "/sr-latn/mapa"},
      actions: [
        {action: "open", title: "Otvori mapu"},
        {action: "dismiss", title: "Zatvori"},
      ],
    }
    : {
      body: payload.body || "Nova prijava na mapi.",
      icon: "/images/icon-192.png",
      tag: payload.tag || "radar-puls-gentle",
      silent: true,
      renotify: false,
      requireInteraction: false,
      data: {url: payload.url || "/sr-latn/mapa"},
    };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Radar Puls", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/sr-latn/mapa";
  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    clients.matchAll({type: "window", includeUncontrolled: true}).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/mapa") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
