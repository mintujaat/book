<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>📖 Reader — Real Book (Final)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <style>
    :root{
      --bg:#e9eef6;
      --book-bg:#f6f6f5;
      --page-bg:#fffdf8;
      --page-width:420px;
      --page-height:620px;
      --gutter:36px;
      --spine-width:40px;
      --hardcover:#3b5b9a;
    }
    html,body{height:100%;margin:0;background:var(--bg);font-family:"Segoe UI", Roboto, sans-serif; -webkit-font-smoothing:antialiased;}
    .wrap{max-width:1280px;margin:18px auto;padding:12px; height:100%;}
    header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
    header h1{font-size:1.25rem;margin:0;color:#07204a;}
    header p{margin:0;color:#556072;}

    /* Hardcover container */
    .stage-wrap { display:flex; justify-content:center; align-items:flex-start; gap:20px; min-height: calc(100vh - 180px); padding-top:4px; }
    .hardcover {
      background: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(255,255,255,0.02));
      border-radius: 10px;
      padding: 22px;
      box-shadow: 0 20px 60px rgba(2,6,23,0.18);
      display:flex;
      align-items:center;
      justify-content:center;
      position: relative;
      margin-bottom: 8px;
    }
    .spine {
      position:absolute; left:0; top:0; width:var(--spine-width); height:100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.06), rgba(255,255,255,0.02));
      border-top-left-radius:10px; border-bottom-left-radius:10px;
      box-shadow: inset -6px 0 12px rgba(0,0,0,0.06);
      display:flex; align-items:center; justify-content:center;
      transform: translateX(-22px);
    }
    .spine .label { writing-mode: vertical-rl; transform: rotate(180deg); color:#fff; font-weight:700; font-size:0.9rem; text-shadow:0 1px 0 rgba(0,0,0,0.2); }

    .book-stage { display:flex; gap:var(--gutter); align-items:center; justify-content:center; }

    .page-frame { width:var(--page-width); height:var(--page-height); perspective:2200px; position:relative; background:transparent; }

    .page {
      width:100%; height:100%; background:var(--page-bg); border-radius:8px;
      padding:30px 34px; box-sizing:border-box; box-shadow:0 8px 20px rgba(12,20,40,0.08);
      display:flex; flex-direction:column; gap:12px; overflow:hidden; position:relative;
    }

    .page .meta{ font-size:0.85rem; color:#6b7280; }
    .page .content{ flex:1; font-size:1rem; line-height:1.6; color:#111827; overflow:hidden; }

    /* decorative black line across bottom of every page */
    .page .footer-line {
      height:3px;
      background:#000;
      width:100%;
      margin-top:12px;
      border-radius:2px;
      flex-shrink:0;
    }

    /* slight page-edge shading */
    .page::after{
      content:'';
      position:absolute;
      right:-20px;
      top:0;
      width:20px;
      height:100%;
      background: linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.06));
      border-radius:0 6px 6px 0;
      pointer-events:none;
    }
    .left .page::after{ right:-20px; background: linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.06)); }
    .right .page::after{ left:-20px; right:auto; background: linear-gradient(to left, rgba(0,0,0,0.02), rgba(0,0,0,0.06)); }

    .controls { text-align:center; display:flex; justify-content:center; gap:12px; margin-top:6px; position:fixed; left:50%; transform:translateX(-50%); bottom:18px; z-index:999; }
    .ctrl-btn { border:none; background:var(--hardcover); color:white; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:700; box-shadow:0 8px 20px rgba(8,40,100,0.16); }
    .ctrl-btn:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; }

    /* responsive */
    @media (max-width:900px){ :root{ --page-width:360px; --page-height:560px; --gutter:18px; } .spine{ display:none; transform:none; } }
    @media (max-width:768px){ :root{ --page-width:86vw; --page-height:calc(80vh - 120px); --gutter:12px; } .book-stage{ align-items:center; } .left, .right{ min-width:0; } }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1 id="title">Loading book…</h1>
        <p id="author"></p>
      </div>
      <div>
        <small id="position" style="color:#556072"></small>
      </div>
    </header>

    <div class="stage-wrap">
      <div class="hardcover">
        <div class="spine"><div class="label" id="spineLabel">BOOK</div></div>
        <div class="book-stage" id="bookStage">
          <div id="leftFrame" class="page-frame" aria-hidden="true"></div>
          <div id="rightFrame" class="page-frame" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="controls">
    <button id="prev" class="ctrl-btn">⬅ Prev</button>
    <button id="next" class="ctrl-btn">Next ➡</button>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
    import { getFirestore, doc, getDoc, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

    // FIREBASE CONFIG (same as your project)
    const firebaseConfig = {
      apiKey: "AIzaSyCtyTzP8p26_QZQ2tk3KGsg5pZXU-nEY9Q",
      authDomain: "books-e1b53.firebaseapp.com",
      projectId: "books-e1b53",
      storageBucket: "books-e1b53.firebasestorage.app",
      messagingSenderId: "206852333319",
      appId: "1:206852333319:web:7c37f760db3cdba21c2fa2",
      measurementId: "G-J1KG00X7D2"
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // DOM refs
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id');
    const titleEl = document.getElementById('title');
    const authorEl = document.getElementById('author');
    const spineLabel = document.getElementById('spineLabel');
    const leftFrame = document.getElementById('leftFrame');
    const rightFrame = document.getElementById('rightFrame');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const positionEl = document.getElementById('position');

    if (!bookId) { alert('Book ID missing (use ?id=... )'); throw new Error('missing id'); }

    // state
    let allText = '';
    let pages = [];          // each string = 200-word page
    let currentIndex = 0;    // index in pages
    let busy = false;

    // --- load book (subcollection preferred, fallback to doc.pages array) ---
    async function loadBook() {
      const bRef = doc(db, 'books', bookId);
      const snap = await getDoc(bRef);
      if (!snap.exists()) { alert('Book not found'); return; }
      const data = snap.data();
      titleEl.textContent = data.title || 'Untitled';
      authorEl.textContent = data.author ? 'By ' + data.author : '';
      spineLabel.textContent = (data.title || 'BOOK').slice(0, 18);

      // try subcollection
      try {
        const pagesCol = collection(db, `books/${bookId}/pages`);
        const q = query(pagesCol, orderBy('pageNumber'));
        const snapPages = await getDocs(q);
        if (!snapPages.empty) {
          const arr = snapPages.docs.map(d => (d.data().content || '').trim()).filter(Boolean);
          allText = arr.join('\n\n');
        }
      } catch (e) {
        console.warn('subcollection read failed', e);
      }

      // fallback
      if (!allText) {
        if (Array.isArray(data.pages)) {
          allText = data.pages.map(p => p.content || '').filter(Boolean).join('\n\n');
        }
      }

      if (!allText) allText = '';
    }

    // --- split into 200-word pages ---
    function splitTo200Words(limit = 200) {
      const words = allText.split(/\s+/).filter(Boolean);
      pages = [];
      for (let i = 0; i < words.length; i += limit) {
        pages.push(words.slice(i, i + limit).join(' '));
      }
      if (pages.length === 0) pages = [''];
    }

    // escape HTML
    function esc(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

    // build page HTML (includes black footer line)
    function buildPageHtml(text, pageNumber) {
      return `
        <div class="page">
          <div class="meta">Page ${pageNumber}</div>
          <div class="content">${esc(text).replace(/\n/g,'<br/>')}</div>
          <div class="footer-line"></div>
        </div>`;
    }

    // render spread (1-up mobile, 2-up desktop)
    function render() {
      const mobile = window.innerWidth <= 768;
      leftFrame.innerHTML = ''; rightFrame.innerHTML = '';

      if (pages.length === 0) {
        rightFrame.innerHTML = buildPageHtml('', 1);
        updateUI();
        return;
      }

      if (mobile) {
        leftFrame.style.display = 'none';
        rightFrame.style.display = 'block';
        rightFrame.innerHTML = buildPageHtml(pages[currentIndex] || '', currentIndex + 1);
      } else {
        leftFrame.style.display = 'block';
        rightFrame.style.display = 'block';
        // ensure left is even index for nice spreads
        if (currentIndex % 2 === 1) currentIndex = Math.max(0, currentIndex - 1);
        const left = pages[currentIndex] || '';
        const right = pages[currentIndex + 1] || '';
        leftFrame.innerHTML = buildPageHtml(left, currentIndex + 1);
        rightFrame.innerHTML = buildPageHtml(right, currentIndex + 2);
      }
      updateUI();
    }

    function updateUI(){
      const total = pages.length;
      positionEl.textContent = `Page ${Math.min(currentIndex + 1, total)} / ${total}`;
      const perView = window.innerWidth <= 768 ? 1 : 2;
      prevBtn.disabled = currentIndex <= 0 || busy;
      nextBtn.disabled = currentIndex + perView >= total || busy;
    }

    // navigation: instant, no animation
    function goNext() {
      if (busy) return;
      const per = window.innerWidth <= 768 ? 1 : 2;
      if (currentIndex + per >= pages.length) return;
      currentIndex = Math.min(pages.length - per, currentIndex + per);
      render();
    }
    function goPrev() {
      if (busy) return;
      const per = window.innerWidth <= 768 ? 1 : 2;
      if (currentIndex <= 0) return;
      currentIndex = Math.max(0, currentIndex - per);
      render();
    }

    // events
    nextBtn.addEventListener('click', goNext);
    prevBtn.addEventListener('click', goPrev);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev();
    });

    // swipe support on mobile area
    let sx = 0, sy = 0;
    const stage = document.getElementById('bookStage');
    stage.addEventListener('touchstart', (ev) => { sx = ev.touches[0].clientX; sy = ev.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', (ev) => {
      const dx = ev.changedTouches[0].clientX - sx;
      const dy = ev.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dy) < 80) {
        if (dx < 0) goNext(); else goPrev();
      }
    }, { passive: true });

    // resize: re-split (still 200 words per page, index clamp, maintain spread alignment)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // re-split not strictly necessary (200-word pages independent of size),
        // but keep clamp and ensure even index on desktop.
        if (window.innerWidth > 768 && currentIndex % 2 === 1) currentIndex = Math.max(0, currentIndex - 1);
        render();
      }, 160);
    });

    // initialize
    (async function init(){
      await loadBook();
      splitTo200Words(200);
      // align spread for desktop
      if (window.innerWidth > 768 && currentIndex % 2 === 1) currentIndex = Math.max(0, currentIndex - 1);
      render();
    })();
  </script>
</body>
</html>
