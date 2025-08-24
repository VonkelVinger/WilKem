// Simple heuristic scoring for MVP; replace later with Cloud Function
window.NES_SCORE = (() => {
  function cap(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function evaluate(p, sc){
    const notes = [];
    // Angle (20)
    const needs = (sc.required_confirms||[]);
    const angleOk = needs.every(key => (p.story+p.angle).toLowerCase().includes((sc.facts?.[key]||'').toLowerCase()));
    let angle = angleOk ? 18 : 10; if (p.angle.length>0 && p.angle.length<120) angle += 2;
    // Accuracy (25)
    let accuracy = 25;
    if ((sc.traps?.rumour_word && (p.story+p.headline).toLowerCase().includes(sc.traps.rumour_word))) {
      accuracy -= 8; notes.push(`Avoid unverified term: “${sc.traps.rumour_word}”.`);
    }
    if (/(many dead|dozens killed|terror attack)/i.test(p.headline)) { accuracy -= 8; }
    // Sourcing (15) – simple: check for attributions / links pattern
    let sourcing = 0;
    if (/\baccording to\b|\bsaid\b|\btold\b/i.test(p.story)) sourcing += 6;
    if (/\bpolice\b|\bems\b|\bofficial\b/i.test(p.story)) sourcing += 5;
    if (/\bwit(ness|) |shop(worker|)/i.test(p.story)) sourcing += 2;
    if (/\bhttp(s)?:\/\//i.test(p.story)) sourcing += 2;
    sourcing = cap(sourcing, 0, 15);
    // Ethics (20)
    let ethics = 20;
    if (sc.assets?.some(a=>a.id===p.chosenAsset && a.trap)) { ethics -= 8; notes.push('Selected image has licensing/date risk.'); }
    if (/minor|under-18|schoolboy|schoolgirl/i.test(p.story) && !/consent|guardian|permission/i.test(p.story)) {
      ethics -= 6; notes.push('Potential minor identification without consent/context.');
    }
    // Writing (10) – headline length, plain style cues
    let writing = 10;
    if (p.headline.length === 0 || p.headline.length > 75) { writing -= 3; notes.push('Headline missing or >75 chars.'); }
    if (!/^[A-Z]/.test(p.story.trim())) { writing -= 1; }
    // Deadline (10)
    let deadline = 10; if ((sc.time_limit_minutes||60) > 0 && p.kind==='timeout') { deadline = 2; notes.push('Submitted on timeout.'); }
    const total = cap(angle,0,20)+cap(accuracy,0,25)+cap(sourcing,0,15)+cap(ethics,0,20)+cap(writing,0,10)+cap(deadline,0,10);
    return { total, angle:cap(angle,0,20), accuracy:cap(accuracy,0,25), sourcing, ethics:cap(ethics,0,20), writing:cap(writing,0,10), deadline:cap(deadline,0,10), notes };
  }
  return { evaluate };
})();
