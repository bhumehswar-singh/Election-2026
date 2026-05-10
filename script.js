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


  // ===== SUBMIT TO GOOGLE SHEETS =====
  // Columns: A=Name, B=Village, C=Suggestion
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

    // A=Name, B=Village, C=Suggestion — matches your sheet headings exactly
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/'
              + SHEET_ID
              + '/values/'
              + encodeURIComponent(SHEET_TAB + '!A:C')
              + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key='
              + API_KEY;

    try {
      const res  = await fetch(url, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ values: [[name, village, suggestion]] })
      });
      const json = await res.json();

      if (res.ok && json.updates) {
        document.getElementById('modalForm').style.display    = 'none';
        document.getElementById('modalSuccess').style.display = 'block';
      } else {
        const msg = json.error?.message || JSON.stringify(json);
        console.error('Sheets error:', msg);
        errorEl.textContent = '⚠️ Error: ' + msg;
        setSubmitState(false);
      }
    } catch (err) {
      console.error('Submit failed:', err.message);
      errorEl.textContent = '⚠️ नेटवर्क एरर। पेज GitHub पर होस्ट है? Local file पर काम नहीं करेगा।';
      setSubmitState(false);
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

  // ===== VIDEO — AUTOPLAY WITH AUDIO via YouTube IFrame API =====
  // Strategy: start muted (browsers require this for autoplay), then
  // immediately unmute via the API once the player is ready.

  var ytPlayer;

  (function loadYTApi() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  })();

  function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('reelIframe', {
      videoId: VIDEO_ID,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        mute: 1,
        playsinline: 1,
        rel: 0,
        controls: 1
      },
      events: {
        onReady: function(e) {
          document.getElementById('reelOverlay').style.display = 'none';
          document.getElementById('reelIframeWrap').style.display = 'block';
          document.getElementById('unmuteBtn').style.display = 'block';
        }
      }
    });
  }

  function playVideoNow() {
    if (ytPlayer && ytPlayer.playVideo) {
      ytPlayer.playVideo();
      ytPlayer.unMute();
      ytPlayer.setVolume(100);
      document.getElementById('reelOverlay').style.display = 'none';
      document.getElementById('reelIframeWrap').style.display = 'block';
      document.getElementById('unmuteBtn').style.display = 'none';
    }
  }

  function unmuteVideo() {
    if (ytPlayer) {
      ytPlayer.unMute();
      ytPlayer.setVolume(100);
      document.getElementById('unmuteBtn').style.display = 'none';
    }
  }
