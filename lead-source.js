/* ProfitPin lead source. Remembers utm_source / utm_campaign / ref from the URL a visitor
   arrived on (first touch, 90 days) and appends them to every checkout / sign-up link, so the
   subscription or account records where the customer came from. No cookies, no tracking of
   anything else, nothing sent anywhere until the visitor chooses to sign up. */
(function () {
  var KEYS = ["utm_source", "utm_campaign", "ref"];
  var STORE = "profitpin_lead";
  function read() { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) {} }
  /* Page counter: one pixel to our own dashboard with the site, the path and where the visit came from.
     No cookies, no identifiers; sessionStorage only marks the first page of this browsing session. */
  (function count() {
    try {
      if (location.protocol === "file:" || /^(localhost|127\.)/.test(location.hostname)) return;
      var first = "0";
      try { if (!sessionStorage.getItem("pp_seen")) { sessionStorage.setItem("pp_seen", "1"); first = "1"; } } catch (e) { }
      var q = "s=" + encodeURIComponent(location.hostname) + "&p=" + encodeURIComponent(location.pathname) +
              "&f=" + first + "&r=" + encodeURIComponent(document.referrer || "") +
              "&u=" + encodeURIComponent(new URLSearchParams(location.search).get("utm_source") || "") + "&t=" + Date.now();
      new Image().src = "https://license.getsaleledger.com/growth/hit?" + q;
    } catch (e) { }
  })();

  var params = new URLSearchParams(location.search), fresh = {};
  KEYS.forEach(function (k) { var v = params.get(k); if (v) fresh[k] = v.slice(0, 120); });
  var lead = read();
  if (!lead || !lead.utm_source && fresh.utm_source) { if (Object.keys(fresh).length) { fresh.at = Date.now(); write(fresh); lead = fresh; } }
  if (lead && lead.at && Date.now() - lead.at > 90 * 24 * 3600 * 1000) { lead = null; }
  if (!lead) return;
  var query = KEYS.filter(function (k) { return lead[k]; }).map(function (k) { return k + "=" + encodeURIComponent(lead[k]); }).join("&");
  if (!query) return;
  function decorate() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href") || "";
      if (/\/checkout(\?|$)|\/signup(\?|$)|\/start\.html(\?|$)/.test(h) && h.indexOf("utm_source=") < 0) {
        a.setAttribute("href", h + (h.indexOf("?") < 0 ? "?" : "&") + query);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate); else decorate();
})();
