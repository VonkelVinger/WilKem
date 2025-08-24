// UI + actions
(() => {
  const $ = (s)=>document.querySelector(s);
  function showScore(result){
    const b = $('#scoreBox'); b.classList.remove('hidden');
    const lines = [
      `<div class="font-semibold mb-2">Auto Score: ${result.total}/100</div>`,
      `<div>Angle: ${result.angle}/20 · Accuracy: ${result.accuracy}/25 · Sourcing: ${result.sourcing}/15</div>`,
      `<div>Ethics: ${result.ethics}/20 · Writing: ${result.writing}/10 · Deadline: ${result.deadline}/10</div>`,
      `<ul class="list-disc ml-5 mt-2 text-sm">${result.notes.map(n=>`<li>${n}</li>`).join('')}</ul>`
    ];
    b.innerHTML = lines.join('');
    window.scrollTo({ top: b.offsetTop - 80, behavior:'smooth' });
  }

  async function submit(kind){
    const S = window.NES._S; const sc = S.state.scenario || {};
    const payload = {
      when: new Date().toISOString(),
      angle: $('#angle').value.trim(),
      caption: $('#caption').value.trim(),
      credit: $('#credit').value.trim(),
      headline: $('#headline').value.trim(),
      standfirst: $('#standfirst').value.trim(),
      story: $('#story').value.trim(),
      chosenAsset: S.state.chosenAsset || null,
      timeLeft: S.state.timeLeft || 0,
      kind
    };
    // Score locally for MVP
    const result = window.NES_SCORE.evaluate(payload, sc);
    showScore(result);
  }

  document.getElementById('btnSubmit').addEventListener('click', ()=>submit('final'));
  document.getElementById('btnBrief').addEventListener('click', ()=>submit('brief'));
  // Expose for timer auto-submit
  window.NES.submit = ()=>submit('timeout');
})();
