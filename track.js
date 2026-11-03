// Wspólne, anonimowe zbieranie odpowiedzi dla wszystkich materiałów na stronie Nauka.
// Użycie w materiale: <script src="../../track.js"></script>, potem
//   NaukaTrack.init("przedmiot/temat");
//   NaukaTrack.log({t:"answer", r:runda, mo:tryb, se:sekcja, it:pytanie, re:odpowiedź, ok:true/false, tr:próba, rt:ms});
// Domyślnie identyfikator żyje tylko do zamknięcia strony i nic nie jest zapisywane na urządzeniu.
// Po zgodzie (setConsent(true)) losowy identyfikator trafia do localStorage, żeby łączyć wizyty z różnych dni.
(function () {
  var ENDPOINT = window.NAUKA_ENDPOINT || ""; // adres Workera, np. https://nauka-api.<konto>.workers.dev
  var VERSION = "1";
  var K_CONSENT = "nauka-consent", K_UID = "nauka-uid";

  function rid() {
    try {
      var a = new Uint8Array(12); crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    } catch (e) { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function persistentId() { var u = get(K_UID); if (!u) { u = rid(); put(K_UID, u); } return u; }

  var sid = rid();
  var consent = get(K_CONSENT) === "1";
  var uid = consent ? persistentId() : sid;
  var material = null, queue = [], timer = null;
  var enabled = !!ENDPOINT && (/(^|\.)github\.io$/.test(location.hostname) || window.NAUKA_TRACK_FORCE === true);

  function send(beacon) {
    if (!queue.length) return;
    if (!enabled || !material) { queue = []; return; }
    while (queue.length) {
      var body = JSON.stringify({ u: uid, s: sid, p: consent, v: VERSION, m: material, e: queue.splice(0, 100) });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT + "/e", new Blob([body], { type: "text/plain" }));
      } else {
        fetch(ENDPOINT + "/e", { method: "POST", body: body, headers: { "Content-Type": "text/plain" }, keepalive: true })
          .catch(function () {});
      }
    }
  }

  window.NaukaTrack = {
    init: function (m) { material = m; },
    log: function (e) {
      if (!enabled) return;
      e.c = Date.now(); queue.push(e);
      clearTimeout(timer);
      if (queue.length >= 20) send(false); else timer = setTimeout(function () { send(false); }, 8000);
    },
    flush: function () { send(false); },
    enabled: function () { return enabled; },
    consent: function () { return consent; },
    setConsent: function (yes) {
      consent = !!yes;
      put(K_CONSENT, consent ? "1" : null);
      if (consent) { uid = persistentId(); } else { put(K_UID, null); uid = sid; }
    },
  };

  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") send(true); });
  window.addEventListener("pagehide", function () { send(true); });
})();
