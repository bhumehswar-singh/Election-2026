// script.js — loads after config.js


  // ===== MODAL CONTROLS =====
  function openModal() {
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(resetForm, 300);
  }
  function closeModalOutside(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  }
  function resetForm() {
    document.getElementById('modalForm').style.display = 'block';
    document.getElementById('modalSuccess').style.display = 'none';
    document.getElementById('modalErrorView').style.display = 'none';
    document.getElementById('inputName').value = '';
    document.getElementById('inputVillage').value = '';
    document.getElementById('inputSuggestion').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('formError').textContent = '';
    setSubmitState(false);
  }
  function retryForm() {
    document.getElementById('modalErrorView').style.display = 'none';
    document.getElementById('modalForm').style.display = 'block';
    setSubmitState(false);
  }
  function setSubmitState(loading) {
    const btn  = document.getElementById('submitBtn');
    const text = document.getElementById('submitText');
    const spin = document.getElementById('submitSpinner');
    btn.disabled = loading;
    text.style.display  = loading ? 'none' : 'inline';
    spin.style.display  = loading ? 'inline-flex' : 'none';
  }

  // Char counter
  document.addEventListener('DOMContentLoaded', () => {
    const ta = document.getElementById('inputSuggestion');
    if (ta) ta.addEventListener('input', () => {
      document.getElementById('charCount').textContent = ta.value.length;
    });
  });


  // ===== METADATA — all silent, no permission prompts =====
  async function collectMeta() {
    const nav = navigator;
    const scr = screen;
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

    const ua     = nav.userAgent;
    const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const tablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    const device = tablet ? 'Tablet' : mobile ? 'Mobile' : 'Desktop';

    // Network speed & connection type (no permission)
    const conn    = nav.connection || nav.mozConnection || nav.webkitConnection;
    const network = conn
      ? ((conn.effectiveType || '') + (conn.downlink ? ' ' + conn.downlink + 'Mbps' : '')).trim()
      : 'N/A';

    // IP-based location — city, region, country, PIN, ISP, coordinates (no permission, silent)
    let geoStr = 'N/A';
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 5000);
      const geoRes = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
      clearTimeout(tid);
      const geo = await geoRes.json();
      if (geo && geo.ip) {
        geoStr = [
          'IP:'      + geo.ip,
          'City:'    + (geo.city        || 'N/A'),
          'Region:'  + (geo.region      || 'N/A'),
          'Country:' + (geo.country_name|| 'N/A'),
          'PIN:'     + (geo.postal      || 'N/A'),
          'ISP:'     + (geo.org         || 'N/A'),
          'Lat:'     + (geo.latitude    || 'N/A'),
          'Lon:'     + (geo.longitude   || 'N/A'),
        ].join(' | ');
      }
    } catch (_) {}

    const parts = [
      'Time(IST): '    + now,
      'GeoLocation: '  + geoStr,
      'Device: '       + device,
      'UserAgent: '    + ua,
      'Language: '     + nav.language,
      'Platform: '     + nav.platform,
      'Screen: '       + scr.width + 'x' + scr.height,
      'Viewport: '     + window.innerWidth + 'x' + window.innerHeight,
      'DPR: '          + window.devicePixelRatio,
      'Network: '      + network,
      'ColorDepth: '   + scr.colorDepth + '-bit',
      'Timezone: '     + Intl.DateTimeFormat().resolvedOptions().timeZone,
      'TouchPoints: '  + (nav.maxTouchPoints || 0),
      'Online: '       + nav.onLine,
      'Cookies: '      + nav.cookieEnabled,
      'Referrer: '     + (document.referrer || 'direct'),
      'PageURL: '      + window.location.href,
    ];
    return parts.join(' || ');
  }

  // ===== SUBMIT TO GOOGLE SHEETS via Apps Script =====
  async function submitSuggestion() {
    const name       = document.getElementById('inputName').value.trim() || 'अज्ञात';
    const village    = document.getElementById('inputVillage').value.trim() || 'अज्ञात';
    const suggestion = document.getElementById('inputSuggestion').value.trim();
    const errorEl    = document.getElementById('formError');

    if (!suggestion) {
      errorEl.textContent = '⚠️ कृपया अपना सुझाव लिखें।';
      document.getElementById('inputSuggestion').focus();
      return;
    }
    errorEl.textContent = '';
    setSubmitState(true);

    const metadata = await collectMeta();
    const payload  = { name, village, suggestion, metadata };

    try {
      // text/plain avoids CORS preflight with Apps Script
      const res  = await fetch(SCRIPT_URL, {
        method  : 'POST',
        headers : { 'Content-Type': 'text/plain;charset=utf-8' },
        body    : JSON.stringify(payload),
        redirect: 'follow',
      });
      const json = await res.json();

      if (json.status === 'ok') {
        document.getElementById('modalForm').style.display    = 'none';
        document.getElementById('modalSuccess').style.display = 'block';
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Submit failed:', err.message);
      document.getElementById('modalForm').style.display      = 'none';
      document.getElementById('modalErrorView').style.display = 'block';
    }
  }

  // ===== NAVBAR =====
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('visible', window.scrollY > 100);
  });

  // ===== SMOOTH SCROLL =====
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ===== SCROLL ANIMATIONS =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.promise-card, .special-item, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Escape key closes modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ===== VIDEO — click to play with full audio =====
  function playVideoNow() {
    const overlay    = document.getElementById('reelOverlay');
    const iframeWrap = document.getElementById('reelIframeWrap');
    const iframe     = document.getElementById('reelIframe');
    if (!iframe) return;
    iframe.src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0&controls=1`;
    overlay.style.display    = 'none';
    iframeWrap.style.display = 'block';
  }
