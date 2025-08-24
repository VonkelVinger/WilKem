window.NES = (() => {
  const S = { state: {}, config: { timeScale: 1 } };

  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const el = (t, cls) => { const e = document.createElement(t); if (cls) e.className = cls; return e; };
  const fmtMMSS = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Persistence (local only for MVP)
  const saveLocal = () => {
    const d = {
      angle: $('#angle').value, notes: $('#notes').value, caption: $('#caption').value,
      credit: $('#credit').value, headline: $('#headline').value, standfirst: $('#standfirst').value,
      story: $('#story').value, chosenAsset: S.state.chosenAsset
    };
    localStorage.setItem('nes_draft', JSON.stringify(d));
  };
  const loadLocal = () => {
    try {
      const d = JSON.parse(localStorage.getItem('nes_draft') || '{}');
      for (const [k,v] of Object.entries(d)) {
        if (k === 'chosenAsset') S.state.chosenAsset = v; else {
          const elmt = document.getElementById(k); if (elmt && typeof v === 'string') elmt.value = v;
        }
      }
    } catch {}
  };

  // Scenario loader
  async function loadScenario(url) {
    const raw = await fetch(url).then(r=>r.text());
    const data = jsyaml.load(raw);
    S.state.scenario = data;
    $('#scenarioTitle').textContent = data.title;
    return data;
  }

  // Timer
  function startTimer(limitMin) {
    const total = Math.max(1, parseInt(limitMin,10)) * 60;
    S.state.timeLeft = total;
    $('#timeLeft').textContent = fmtMMSS(S.state.timeLeft);
    S.state.ticker = setInterval(() => {
      S.state.timeLeft -= 1;
      $('#timeLeft').textContent = fmtMMSS(Math.max(0, S.state.timeLeft));
      if (S.state.timeLeft <= 0) { clearInterval(S.state.ticker); NES.submit(); }
    }, 1000 / S.config.timeScale);
  }

  // Feed scheduler
  function scheduleFeed(feed) {
    const box = $('#feed');
    box.innerHTML = '';
    S.state.feedIdx = 0; S.state.feed = feed;
    const start = performance.now();
    function tick() {
      const elapsed = ((performance.now() - start)/1000) * S.config.timeScale;
      while (S.state.feedIdx < feed.length && feed[S.state.feedIdx].at_sec <= elapsed) {
        const item = feed[S.state.feedIdx++]; renderFeedItem(item);
      }
      if (S.state.feedIdx < feed.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderFeedItem(item) {
    const row = el('div','feed-item');
    const t = el('span','feed-time'); t.textContent = `[${fmtMMSS(item.at_sec)}]`;
    const b = el('span'); b.textContent = ` ${item.text}`;
    row.append(t,b); $('#feed').append(row); $('#feed').scrollTop = $('#feed').scrollHeight;
  }

  // Assets
  function renderAssets(assets) {
    const wrap = $('#assets'); wrap.innerHTML = '';
    assets.forEach(a => {
      const card = el('button','asset'); card.type='button'; card.dataset.id=a.id;
      const img = el('img'); img.src = a.url; img.alt = a.desc || a.id;
      const meta = el('div','meta'); meta.innerHTML = `<div>${a.desc || ''}</div>
        <div><span class="badge ${a.trap ? 'warn':'ok'}">${a.trap ? 'check licence/date' : 'licence OK'}</span></div>`;
      card.append(img, meta); card.onclick = () => selectAsset(a.id, card);
      wrap.append(card);
      if (S.state.chosenAsset === a.id) card.classList.add('selected');
    });
  }
  function selectAsset(id, card) {
    S.state.chosenAsset = id; document.querySelectorAll('.asset').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected'); saveLocal();
  }

  // Public boot
  async function boot({ scenario, timeScale=1 }) {
    S.config.timeScale = timeScale;
    loadLocal();
    const data = await loadScenario(scenario);
    const feed = (data.feed_timeline || []).map(f => ({ at_sec: f.at_sec ?? 0, text: f.text }));
    scheduleFeed(feed);
    renderAssets(data.assets || []);
    startTimer(data.time_limit_minutes || 60);
    // Wire inputs
    ['angle','notes','caption','credit','headline','standfirst','story'].forEach(id=>{
      const n = document.getElementById(id); if (n) n.addEventListener('input', saveLocal);
    });
    // Word count
    const wc = document.getElementById('wordCount');
    document.getElementById('story').addEventListener('input', (e)=>{
      const words = (e.target.value.trim().match(/\b\w+\b/g)||[]).length; wc.textContent = `${words} words`;
    });
  }

  return { boot, _S:S, selectAsset, saveLocal };
})();
