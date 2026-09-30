/* First-touch campaign/search attribution, retained for 90 days. No visitor ID.
 * The existing first-party page counter receives only a referrer origin (no search
 * terms or referrer query string). Attribution follows approved signup links. */
(function () {
  var KEYS = ['utm_source', 'utm_campaign', 'ref'], STORE = 'profitpin_lead';
  var MAX_AGE = 90 * 24 * 3600 * 1000;
  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(STORE) || 'null');
      return value && typeof value.at === 'number' && value.at <= Date.now() && Date.now() - value.at < MAX_AGE ? value : null;
    } catch (_) { return null; }
  }
  var referrer = null;
  try { if (document.referrer) referrer = new URL(document.referrer); } catch (_) {}
  var params = new URLSearchParams(location.search), fresh = {};
  KEYS.forEach(function (key) { var value = params.get(key); if (value) fresh[key] = value.slice(0, 120); });
  if (!Object.keys(fresh).length && referrer) {
    var host = referrer.hostname.toLowerCase(), source = null;
    if (/^(www\.)?google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)) source = 'google';
    else if (/^(www\.)?bing\.com$/.test(host)) source = 'bing';
    else if (/^(www\.)?duckduckgo\.com$/.test(host)) source = 'duckduckgo';
    else if (host === 'search.yahoo.com') source = 'yahoo';
    else if (host === 'search.brave.com') source = 'brave';
    if (source) fresh = { utm_source: source, utm_campaign: 'organic-search', ref: location.pathname.slice(0, 120) };
  }
  var lead = read();
  if (!lead && Object.keys(fresh).length) {
    fresh.at = Date.now(); lead = fresh;
    try { localStorage.setItem(STORE, JSON.stringify(lead)); } catch (_) {}
  }
  try {
    if (location.protocol !== 'file:' && !/^(localhost|127\.)/.test(location.hostname)) {
      var first = '0';
      try { if (!sessionStorage.getItem('pp_seen')) { sessionStorage.setItem('pp_seen', '1'); first = '1'; } } catch (_) {}
      var q = new URLSearchParams({s: location.hostname, p: location.pathname, f: first,
        r: referrer ? referrer.origin : '', u: lead && lead.utm_source || '', t: String(Date.now())});
      new Image().src = 'https://license.getsaleledger.com/growth/hit?' + q;
    }
  } catch (_) {}
  if (!lead) return;
  var site = location.hostname.replace(/^(www\.|app\.|license\.)/, '');
  function decorateLink(a) {
    if (!a || !a.getAttribute) return;
    try {
      var url = new URL(a.getAttribute('href'), location.href);
      if (!/^https?:$/.test(url.protocol) || ![site, 'www.' + site, 'app.' + site, 'license.' + site].includes(url.hostname)) return;
      if (!/^\/(checkout|signup|start)(\.html)?\/?$/.test(url.pathname)) return;
      if (url.searchParams.has('utm_source') || url.searchParams.has('utm_campaign') || url.searchParams.has('ref')) return;
      KEYS.forEach(function (key) { if (typeof lead[key] === 'string') url.searchParams.set(key, lead[key].slice(0, 120)); });
      a.setAttribute('href', url.href);
    } catch (_) {}
  }
  function decorate() { document.querySelectorAll('a[href]').forEach(decorateLink); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate); else decorate();
  document.addEventListener('click', function (event) { decorateLink(event.target.closest && event.target.closest('a[href]')); }, true);
})();
