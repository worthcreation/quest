
// =====================================================================
// Drawing
// =====================================================================
// ---------- shared pieces ----------
function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.38);
  ctx.bezierCurveTo(x - s * 0.62, y - s * 0.02, x - s * 0.38, y - s * 0.55, x, y - s * 0.18);
  ctx.bezierCurveTo(x + s * 0.38, y - s * 0.55, x + s * 0.62, y - s * 0.02, x, y + s * 0.38);
  ctx.closePath();
}
function drawScalp(x, top, w) {                  // stalker scalp: fur cap, ears, spine tufts
  const fur = '#4a2218';
  for (const s of [-1, 1]) {
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.moveTo(x + s * w * 0.18, top - w * 0.12); ctx.lineTo(x + s * w * 0.52, top - w * 0.55); ctx.lineTo(x + s * w * 0.56, top + w * 0.02); ctx.fill();
    ctx.fillStyle = '#b8736a';
    ctx.beginPath(); ctx.moveTo(x + s * w * 0.3, top - w * 0.1); ctx.lineTo(x + s * w * 0.48, top - w * 0.4); ctx.lineTo(x + s * w * 0.49, top - w * 0.02); ctx.fill();
  }
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(x, top + w * 0.06, w * 0.56, w * 0.3, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - w * 0.56, top + w * 0.04, w * 1.12, w * 0.1);
  ctx.fillStyle = '#2a0f0b';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.14 - w * 0.06, top - w * 0.18); ctx.lineTo(x + i * w * 0.14, top - w * 0.36); ctx.lineTo(x + i * w * 0.14 + w * 0.06, top - w * 0.18); ctx.fill(); }
  ctx.strokeStyle = '#6b3526'; ctx.lineWidth = Math.max(1, w * 0.03);
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.18, top + w * 0.1); ctx.lineTo(x + i * w * 0.18 + w * 0.04, top - w * 0.04); ctx.stroke(); }
}
function drawItemIcon(type, x, y, s) {
  if (RAW[type] || type === 'mat') { ctx.save(); ctx.translate(x, y); const done = drawRawIcon(type, s); ctx.restore(); if (done) return; }
  ctx.save(); ctx.translate(x, y);
  switch (type) {
    case 'scalp': drawScalp(0, s * 0.2, s * 1.05); break;
    case 'wing':
      ctx.fillStyle = '#4b3558';
      ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.15); ctx.lineTo(0, -s * 0.45); ctx.lineTo(s * 0.55, s * 0.15);
      ctx.quadraticCurveTo(s * 0.35, 0, s * 0.2, s * 0.32); ctx.quadraticCurveTo(0, s * 0.1, -s * 0.2, s * 0.32); ctx.quadraticCurveTo(-s * 0.35, 0, -s * 0.55, s * 0.15); ctx.fill();
      ctx.strokeStyle = '#2a1c33'; ctx.lineWidth = Math.max(1, s * 0.05);
      for (const a of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.lineTo(a * s, s * 0.2); ctx.stroke(); }
      break;
    case 'horn':
      ctx.strokeStyle = '#e6dcc0'; ctx.lineCap = 'round';
      ctx.lineWidth = s * 0.24; ctx.beginPath(); ctx.arc(-s * 0.05, s * 0.2, s * 0.38, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
      ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.arc(-s * 0.05, s * 0.2, s * 0.38, Math.PI * 1.6, Math.PI * 1.95); ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    case 'step':                                  // a stalker's hind claw on a cord
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.3, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();
      ctx.fillStyle = '#4a1414'; ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.05); ctx.quadraticCurveTo(s * 0.3, s * 0.1, s * 0.05, s * 0.5); ctx.lineTo(s * 0.02, s * 0.1); ctx.fill();
      ctx.fillStyle = '#e6dcc0'; ctx.beginPath(); ctx.moveTo(-s * 0.05, s * 0.2); ctx.quadraticCurveTo(s * 0.2, s * 0.3, s * 0.05, s * 0.5); ctx.fill();
      break;
    case 'silk':
      ctx.strokeStyle = '#e8e4f0'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(0, 0, s * (0.15 + i * 0.07), s * (0.3 - i * 0.03), i * 0.5, 0, 6.28); ctx.stroke(); }
      break;
    case 'squash':
      ctx.fillStyle = '#e0a030'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.4, s * 0.3, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#b8781a'; ctx.lineWidth = 1.5; for (const o of [-0.15, 0.15]) { ctx.beginPath(); ctx.ellipse(o * s, s * 0.08, s * 0.1, s * 0.28, 0, 0, 6.28); ctx.stroke(); }
      ctx.fillStyle = '#4a6a2a'; ctx.fillRect(-s * 0.04, -s * 0.34, s * 0.08, s * 0.16);
      break;
    case 'berries':
      ctx.fillStyle = '#6a2a7a'; for (const [bx, by] of [[-0.12, 0.05], [0.12, 0.05], [0, -0.1], [0, 0.18]]) { ctx.beginPath(); ctx.arc(bx * s, by * s, s * 0.14, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.ellipse(s * 0.15, -s * 0.28, s * 0.14, s * 0.07, -0.5, 0, 6.28); ctx.fill();
      break;
    case 'pepper':
      ctx.fillStyle = '#c8321e'; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.2); ctx.quadraticCurveTo(s * 0.4, -s * 0.1, s * 0.1, s * 0.5); ctx.quadraticCurveTo(-s * 0.1, s * 0.1, -s * 0.15, -s * 0.2); ctx.fill();
      ctx.fillStyle = '#4a8a3a'; ctx.fillRect(-s * 0.2, -s * 0.32, s * 0.12, s * 0.15);
      break;
    case 'lumin': case 'glow': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
      g.addColorStop(0, '#f2ffb0'); g.addColorStop(0.5, '#9ee85a'); g.addColorStop(1, 'rgba(120,220,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#c9f27a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.26, s * 0.32, 0, 0, 6.28); ctx.fill();
      break;
    }
    case 'haunch':
      ctx.fillStyle = '#f1ead8'; ctx.fillRect(s * 0.1, -s * 0.06, s * 0.42, s * 0.12);
      ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.08, s * 0.08, 0, 6.28); ctx.arc(s * 0.52, s * 0.08, s * 0.08, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9a5a2a'; ctx.beginPath(); ctx.ellipse(-s * 0.12, 0, s * 0.36, s * 0.26, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#b8743a'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.07, s * 0.15, s * 0.08, 0, 0, 6.28); ctx.fill();
      break;
    case 'turnip':
      ctx.fillStyle = '#5aa04a';
      for (const a of [-0.5, 0, 0.5]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-s * 0.05, -s * 0.6, s * 0.1, s * 0.35); ctx.restore(); }
      ctx.fillStyle = '#efe6f2'; ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.3, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9b4f9e'; ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.3, Math.PI, 0); ctx.fill();
      break;
    case 'slime':
      ctx.fillStyle = '#7fae3a';
      ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.28, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.12, s * 0.2, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#c3e37a'; ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.16, s * 0.07, 0, 6.28); ctx.fill();
      break;
    case 'heart': heartPath(0, 0, s * 0.9); ctx.fillStyle = '#e03a3a'; ctx.fill(); break;
    case 'carrot':
      ctx.fillStyle = '#e8792a'; ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.2); ctx.lineTo(s * 0.12, -s * 0.2); ctx.lineTo(0, s * 0.5); ctx.fill();
      ctx.strokeStyle = '#b8541a'; ctx.lineWidth = 1; for (const y of [0, 0.15]) { ctx.beginPath(); ctx.moveTo(-s * 0.08, y * s); ctx.lineTo(s * 0.04, y * s); ctx.stroke(); }
      ctx.fillStyle = '#5aa04a'; for (const a of [-0.4, 0, 0.4]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-s * 0.04, -s * 0.5, s * 0.08, s * 0.32); ctx.restore(); }
      break;
    case 'acorn':
      ctx.fillStyle = '#a0662a'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.22, s * 0.28, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#6b4520'; ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.26, s * 0.14, 0, 0, 6.28); ctx.fill();
      ctx.fillRect(-s * 0.03, -s * 0.34, s * 0.06, s * 0.12);
      break;
    case 'thornseed': case 'emberseed': case 'ironseed': case 'starseed': {
      const c = SEEDS[type].color;
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.18, s * 0.26, 0.5, 0, 6.28); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
      if (type === 'starseed' || type === 'emberseed') { ctx.fillStyle = `rgba(255,255,230,${0.4 + 0.3 * Math.sin(state.time * 5)})`; ctx.beginPath(); ctx.arc(-s * 0.05, -s * 0.08, s * 0.06, 0, 6.28); ctx.fill(); }
      break;
    }
    case 'thorn':
      ctx.fillStyle = '#7a3a8a'; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.2); ctx.lineTo(s * 0.35, -s * 0.35); ctx.lineTo(0, s * 0.3); ctx.fill();
      ctx.fillStyle = '#c98ad8'; ctx.beginPath(); ctx.moveTo(-s * 0.1, s * 0.15); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 0.05, s * 0.1); ctx.fill();
      break;
    case 'ember': { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.45); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, '#ff8a2a'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.18, s * 0.2, s * 0.1, a, 0, 6.28); ctx.fill(); } break; }
    case 'ironwood': ctx.fillStyle = '#6a6e74'; ctx.fillRect(-s * 0.4, -s * 0.12, s * 0.8, s * 0.24); ctx.strokeStyle = '#8a9098'; ctx.lineWidth = 1; for (const o of [-0.05, 0.05]) { ctx.beginPath(); ctx.moveTo(-s * 0.38, o * s); ctx.lineTo(s * 0.38, o * s); ctx.stroke(); } ctx.fillStyle = '#4a4e54'; ctx.beginPath(); ctx.ellipse(s * 0.4, 0, s * 0.06, s * 0.12, 0, 0, 6.28); ctx.fill(); break;
    case 'starpetal': ctx.fillStyle = '#fff6c8'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 - Math.PI / 2, r = i % 2 ? s * 0.15 : s * 0.4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); break;
    case 'fish':
      ctx.fillStyle = '#8ab8c8'; ctx.beginPath(); ctx.ellipse(-s * 0.05, 0, s * 0.35, s * 0.17, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.25, 0); ctx.lineTo(s * 0.48, -s * 0.18); ctx.lineTo(s * 0.48, s * 0.18); ctx.fill();
      ctx.fillStyle = '#e8f4f8'; ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.05, s * 0.2, s * 0.06, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#1a2a30'; ctx.beginPath(); ctx.arc(-s * 0.28, -s * 0.03, s * 0.035, 0, 6.28); ctx.fill();
      break;
    case 'driftwood':
      ctx.fillStyle = '#9a8468'; ctx.save(); ctx.rotate(-0.3); ctx.fillRect(-s * 0.42, -s * 0.09, s * 0.84, s * 0.18);
      ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.35, 0); ctx.lineTo(s * 0.35, 0); ctx.stroke(); ctx.restore();
      break;
    case 'rod':
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.4); ctx.lineTo(s * 0.4, -s * 0.4); ctx.stroke();
      ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.4); ctx.quadraticCurveTo(s * 0.5, 0, s * 0.3, s * 0.3); ctx.stroke();
      break;
    case 'ear':
      ctx.fillStyle = '#4a2218'; ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.3); ctx.lineTo(0, -s * 0.4); ctx.lineTo(s * 0.25, s * 0.3); ctx.fill();
      ctx.fillStyle = '#b8736a'; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.25); ctx.lineTo(0, -s * 0.2); ctx.lineTo(s * 0.12, s * 0.25); ctx.fill();
      break;
    case 'hide':
      ctx.fillStyle = '#5a2a1e'; ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.2); ctx.quadraticCurveTo(0, -s * 0.35, s * 0.35, -s * 0.15); ctx.lineTo(s * 0.3, s * 0.25); ctx.quadraticCurveTo(0, s * 0.35, -s * 0.3, s * 0.2); ctx.fill();
      ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.15, -s * 0.15); ctx.lineTo(i * s * 0.15 + s * 0.05, s * 0.15); ctx.stroke(); }
      break;
    case 'spores': case 'spores7':
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + state.time, r = s * (0.12 + (i % 3) * 0.1); ctx.fillStyle = `rgba(232,216,255,${0.6 + 0.3 * Math.sin(state.time * 4 + i)})`; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, s * 0.08, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = '#9a6ad8'; ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, 6.28); ctx.fill();
      break;
    case 'sword':
      ctx.save(); ctx.rotate(-0.8);
      ctx.fillStyle = bladeColor(); ctx.fillRect(-s * 0.05, -s * 0.5, s * 0.1, s * 0.62);
      ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.5); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.05, -s * 0.5); ctx.fill();
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-s * 0.2, s * 0.1, s * 0.4, s * 0.07); ctx.fillRect(-s * 0.04, s * 0.17, s * 0.08, s * 0.25);
      ctx.restore(); break;
    case 'letter':
      ctx.fillStyle = '#f2e6c8'; ctx.fillRect(-s * 0.32, -s * 0.24, s * 0.64, s * 0.48);
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.24); ctx.lineTo(0, s * 0.05); ctx.lineTo(s * 0.32, -s * 0.24); ctx.stroke();
      ctx.fillStyle = '#3a2616'; ctx.fillRect(-s * 0.1, s * 0.12, s * 0.35, s * 0.07);
      break;
    case 'page':
      ctx.fillStyle = '#f2e6c8'; ctx.save(); ctx.rotate(0.2); ctx.fillRect(-s * 0.28, -s * 0.34, s * 0.56, s * 0.68);
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2 + i * s * 0.13); ctx.lineTo(s * 0.18, -s * 0.2 + i * s * 0.13); ctx.stroke(); }
      ctx.restore(); break;
    case 'journal':
      ctx.fillStyle = '#7a3a2a'; ctx.fillRect(-s * 0.35, -s * 0.4, s * 0.7, s * 0.8);
      ctx.fillStyle = '#f2e6c8'; ctx.fillRect(s * 0.3, -s * 0.36, s * 0.07, s * 0.72);
      ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, 6.28); ctx.fill();
      break;
    case 'recipe_temper': case 'recipe_star':
      ctx.fillStyle = '#e8dcb8'; ctx.fillRect(-s * 0.3, -s * 0.35, s * 0.6, s * 0.7);
      ctx.fillStyle = '#b8a47a'; ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.35, s * 0.08, 0, 6.28); ctx.arc(s * 0.3, s * 0.35, s * 0.08, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2 + i * s * 0.13); ctx.lineTo(s * 0.2, -s * 0.2 + i * s * 0.13); ctx.stroke(); }
      break;
    case 'woodsword': ctx.save(); ctx.rotate(-0.7); ctx.fillStyle = '#b08a5a'; ctx.fillRect(-s * 0.06, -s * 0.45, s * 0.12, s * 0.62); ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.45); ctx.lineTo(0, -s * 0.55); ctx.lineTo(s * 0.06, -s * 0.45); ctx.fill();
      ctx.fillStyle = '#7a5a34'; ctx.fillRect(-s * 0.2, s * 0.14, s * 0.4, s * 0.07); ctx.fillRect(-s * 0.05, s * 0.2, s * 0.1, s * 0.22); ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.07, s * 0.1); ctx.lineTo(s * 0.07, s * 0.02); ctx.stroke(); ctx.restore(); break;
    case 'thornwrap': ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.2, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a3a8a'; for (let k = 0; k < 5; k++) { const an = k / 5 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(an) * s * 0.2, Math.sin(an) * s * 0.14); ctx.lineTo(Math.cos(an) * s * 0.42, Math.sin(an) * s * 0.3); ctx.lineTo(Math.cos(an + 0.3) * s * 0.22, Math.sin(an + 0.3) * s * 0.15); ctx.fill(); } break;
    case 'emberoil': { ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.3, s * 0.18, 0, 0, 6.28); ctx.fill(); const g = ctx.createRadialGradient(0, s * 0.06, 0, 0, s * 0.06, s * 0.26); g.addColorStop(0, '#fff0a0'); g.addColorStop(1, 'rgba(255,110,40,.9)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, s * 0.06, s * 0.24, s * 0.12, 0, 0, 6.28); ctx.fill(); break; }
    case 'mash': case 'salad': ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.22, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = type === 'mash' ? '#e8c07a' : '#9fcf6a'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.36, s * 0.12, 0, 0, 6.28); ctx.fill();
      if (type === 'salad') { ctx.fillStyle = '#c0304a'; for (const [dx, dy] of [[-0.15, 0.02], [0.05, 0.06], [0.18, 0]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.05, 0, 6.28); ctx.fill(); } } else { ctx.fillStyle = '#e8792a'; ctx.fillRect(-s * 0.1, s * 0.03, s * 0.08, s * 0.05); } break;
    case 'trailmix': for (const [dx, dy, c] of [[-0.15, 0.05, '#a0662a'], [0.1, -0.05, '#6a2a5a'], [0.2, 0.12, '#a0662a'], [-0.02, 0.18, '#c0304a'], [-0.2, -0.12, '#6a2a5a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.1, 0, 6.28); ctx.fill(); } break;
    case 'wear_feather': ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.13, s * 0.4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7ab8e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, s * 0.45); ctx.lineTo(0, -s * 0.38); ctx.stroke(); ctx.restore(); break;
    case 'wear_stonecharm': ctx.strokeStyle = '#d8ccb0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.28, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.24, s * 0.18, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-s * 0.07, s * 0.06, s * 0.08, s * 0.05, 0, 0, 6.28); ctx.fill(); break;
    case 'wear_mitts': ctx.fillStyle = '#6aa04a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * s * 0.2, 0, s * 0.17, s * 0.24, sx * 0.2, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(sx * s * 0.34, -s * 0.08, s * 0.06, s * 0.1, sx * 0.6, 0, 6.28); ctx.fill(); } ctx.fillStyle = '#efe6d2'; ctx.fillRect(-s * 0.38, s * 0.18, s * 0.76, s * 0.08); break;
    case 'wear_embercharm': { ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, 6.28); ctx.fill(); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.2); g.addColorStop(0, '#fff0a0'); g.addColorStop(1, 'rgba(255,120,40,0.9)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.17, 0, 6.28); ctx.fill(); break; }
    // vegetable seeds, a small pinch of each, drawn the way the real ones look
    case 'turnipseed':                                 // tiny round beads, dark red-brown to near black, a glint on each
      for (const [ox, oy, r] of [[-0.16, 0.1, 0.11], [0.08, -0.14, 0.12], [0.18, 0.14, 0.1], [-0.04, 0.16, 0.09]]) {
        ctx.fillStyle = '#3a2016'; ctx.beginPath(); ctx.arc(ox * s, oy * s, r * s, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#7a3a26'; ctx.beginPath(); ctx.arc(ox * s, oy * s, r * s * 0.7, 0, 6.28); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,220,.7)'; ctx.beginPath(); ctx.arc((ox - r * 0.35) * s, (oy - r * 0.4) * s, r * s * 0.28, 0, 6.28); ctx.fill();
      }
      break;
    case 'carrotseed':                                 // small tan ovals, flat, ridged along their length
      for (const [ox, oy, a] of [[-0.15, 0.08, 0.6], [0.12, -0.12, -0.4], [0.16, 0.16, 1.1]]) {
        ctx.save(); ctx.translate(ox * s, oy * s); ctx.rotate(a);
        ctx.fillStyle = '#a8905e'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.1, s * 0.16, 0, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#6e5a34'; ctx.lineWidth = 1; for (const k of [-0.05, 0, 0.05]) { ctx.beginPath(); ctx.moveTo(k * s, -s * 0.13); ctx.lineTo(k * s, s * 0.13); ctx.stroke(); }
        ctx.restore();
      }
      break;
    case 'pepperseed':                                 // flat pale yellow discs, a slight notch where they hung
      for (const [ox, oy] of [[-0.14, 0.1], [0.1, -0.12], [0.16, 0.16]]) {
        ctx.fillStyle = '#e8d68a'; ctx.beginPath(); ctx.arc(ox * s, oy * s, s * 0.13, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#b8a45a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#c8b46a'; ctx.beginPath(); ctx.arc((ox + 0.09) * s, (oy - 0.06) * s, s * 0.03, 0, 6.28); ctx.fill();
      }
      break;
    case 'squashseed':                                 // cream teardrops with a paler rim, one broad and one on its side
      for (const [ox, oy, a] of [[-0.1, 0.06, -0.3], [0.14, 0.02, 0.9]]) {
        ctx.save(); ctx.translate(ox * s, oy * s); ctx.rotate(a);
        ctx.fillStyle = '#e8dcb0'; ctx.beginPath(); ctx.moveTo(0, -s * 0.24); ctx.quadraticCurveTo(s * 0.18, -s * 0.05, s * 0.13, s * 0.14); ctx.quadraticCurveTo(0, s * 0.28, -s * 0.13, s * 0.14); ctx.quadraticCurveTo(-s * 0.18, -s * 0.05, 0, -s * 0.24); ctx.fill();
        ctx.strokeStyle = '#f8f2dc'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
      break;
    case 'bean':
      ctx.fillStyle = '#8b3a2a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.2, 0.3, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#d98a6a'; ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.06, s * 0.08, s * 0.04, 0.3, 0, 6.28); ctx.fill();
      break;
    case 'wisp': { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5); g.addColorStop(0, '#f4ffe0'); g.addColorStop(0.4, '#b8f28a'); g.addColorStop(1, 'rgba(140,220,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 6.28); ctx.fill(); break; }
    case 'fire': { const g = ctx.createRadialGradient(0, s * 0.1, 0, 0, s * 0.1, s * 0.5); g.addColorStop(0, '#fff1a0'); g.addColorStop(0.5, '#ff9a3a'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.quadraticCurveTo(s * 0.45, 0, 0, s * 0.45); ctx.quadraticCurveTo(-s * 0.45, 0, 0, -s * 0.5); ctx.fill(); break; }
    case 'bigrock': drawRock(0, 0, s * 0.7); break;
    case 'maxheart': heartPath(0, 0, s); ctx.fillStyle = '#e03a3a'; ctx.fill(); ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = Math.max(2, s * 0.1); ctx.stroke(); break;
    case 'warden': heartPath(0, 0, s * 1.1); ctx.fillStyle = '#4a9ad8'; ctx.fill(); ctx.strokeStyle = '#c9e8ff'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.stroke(); break;
  }
  ctx.restore();
}
function drawItems() {
  for (const it of state.items) {
    if (it.type === 'bigrock') { drawRock(it.x, it.y, UNIT * 0.62); continue; }
    // things lie on the ground: a tight contact shadow, a little lean of their own, no floating
    const hsh = Math.abs(Math.sin(it.x * 12.9898 + it.y * 78.233)) % 1, lean = (hsh - 0.5) * 0.6;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(it.x + 1, it.y + UNIT * 0.2, UNIT * 0.28, UNIT * 0.07, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.translate(it.x, it.y + UNIT * 0.08); ctx.rotate(lean); drawItemIcon(it.type, 0, 0, UNIT * 0.72); ctx.restore();
    drawGlints(it, hsh);
  }
}
// Sparkles on things lying about: sparse and light. Usually one glint at a time, and never twice in the same spot
// in a row. Nine in ten are tiny and faint; now and then a bigger one (never bigger than a small star). They come a
// little more often as you get close, and a touch warmer within reach of F; that's the only cue, no button drawn.
const GLINTS = new WeakMap();
function drawGlints(it, hsh) {
  const h = state.hero, d = Math.hypot(h.x - it.x, h.y - it.y) / UNIT, reach = d < PICK_R && h.z <= 0 && !state.carry;
  const near = Math.max(0, Math.min(1, 1 - (d - PICK_R) / 5));
  const G = GLINTS.get(it) || { t: state.time, gl: [], lx: 0, ly: 0 }; GLINTS.set(it, G);
  const now = state.time, dt = Math.min(0.1, Math.max(0, now - G.t)); G.t = now;
  const gl = G.gl, rate = 0.12 + near * 0.5 + (reach ? 0.9 : 0), cap = reach ? 2 : 1;
  if (gl.length < cap && Math.random() < rate * dt) {
    let dx = 0, dy = 0;
    for (let tries = 0; tries < 6; tries++) {                            // somewhere new each time
      dx = (Math.random() - 0.5) * UNIT * 0.6; dy = -UNIT * (0.02 + Math.random() * 0.32);
      if (Math.hypot(dx - G.lx, dy - G.ly) > UNIT * 0.22) break;
    }
    G.lx = dx; G.ly = dy;
    const big = Math.random() < 0.1;
    gl.push({ t0: now, dur: big ? 0.3 + Math.random() * 0.35 : 0.15 + Math.random() * 0.25, dx, dy,
      r: big ? UNIT * (0.12 + Math.random() * 0.12) : UNIT * (0.035 + Math.random() * 0.035), a: big ? 0.45 + Math.random() * 0.3 : 0.18 + Math.random() * 0.17,
      kind: big && Math.random() < 0.4 ? 'star8' : 'star4', warm: reach });
  }
  for (let i = gl.length - 1; i >= 0; i--) {
    const g = gl[i], p = (now - g.t0) / g.dur;
    if (p >= 1 || p < 0) { gl.splice(i, 1); continue; }
    const k = Math.sin(p * Math.PI), x = it.x + g.dx, y = it.y + g.dy, r = g.r * k, a = g.a * k;
    ctx.fillStyle = g.warm ? `rgba(255,238,170,${a})` : `rgba(255,252,235,${a})`;
    const star = (rr, rot) => { ctx.beginPath(); for (let j = 0; j < 8; j++) { const an = rot + j * Math.PI / 4, q = j % 2 ? rr * 0.24 : rr; ctx.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); } ctx.closePath(); ctx.fill(); };
    star(r, 0);
    if (g.kind === 'star8') star(r * 0.55, Math.PI / 4);
  }
}
// ---------- enemies ----------
function drawEnemy(e) {
  const alpha = e.mode === 'dead' ? Math.max(0, e.t / 0.9) : 1;
  const scale = e.mode === 'dead' ? 0.5 + 0.5 * alpha : 1;
  const white = e.flash > 0;
  ctx.save(); ctx.globalAlpha = alpha;
  const C = (c) => white ? '#fff' : c;
  switch (e.type) {
    case 'stalker': {
      const bs = UNIT * 1.4 * scale * (e.mode === 'windup' ? 1.12 : 1);
      ctx.fillStyle = C('#4a1414'); ctx.fillRect(e.x - bs / 2, e.y - bs / 2, bs, bs);
      for (const s of [-1, 1]) {                  // ears, the same ones the scalp keeps
        ctx.fillStyle = C('#4a1414'); ctx.beginPath(); ctx.moveTo(e.x + s * bs * 0.2, e.y - bs / 2); ctx.lineTo(e.x + s * bs * 0.48, e.y - bs * 0.95); ctx.lineTo(e.x + s * bs * 0.5, e.y - bs / 2); ctx.fill();
        ctx.fillStyle = C('#b8736a'); ctx.beginPath(); ctx.moveTo(e.x + s * bs * 0.28, e.y - bs / 2); ctx.lineTo(e.x + s * bs * 0.45, e.y - bs * 0.82); ctx.lineTo(e.x + s * bs * 0.46, e.y - bs / 2); ctx.fill();
      }
      ctx.fillStyle = C('#2a0b0b');
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(e.x + i * bs * 0.14 - bs * 0.06, e.y - bs / 2); ctx.lineTo(e.x + i * bs * 0.14, e.y - bs * 0.72); ctx.lineTo(e.x + i * bs * 0.14 + bs * 0.06, e.y - bs / 2); ctx.fill(); }
      break;
    }
    case 'charger': {
      const bw = UNIT * 1.6 * scale, bh = UNIT * 1.25 * scale;
      ctx.fillStyle = C('#3b2a18'); ctx.fillRect(e.x - bw / 2, e.y - bh / 2, bw, bh);
      ctx.fillStyle = C('#e6dcc0');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * bw * 0.3, e.y - bh / 2); ctx.lineTo(e.x + s * bw * 0.62, e.y - bh / 2 - bh * 0.45); ctx.lineTo(e.x + s * bw * 0.45, e.y - bh / 2); ctx.fill(); }
      if (e.mode === 'aim' && Math.random() < 0.3) spark(e.x - e.lx * bw * 0.6, e.y + bh * 0.4, '#5a4a3a', 1, 1.2);
      break;
    }
    case 'glowworm': {
      if (e.mode === 'glowup') { const k = 1 - e.t / 0.8, g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, UNIT * (0.6 + k * 1.4)); g.addColorStop(0, `rgba(245,255,200,${0.4 + k * 0.5})`); g.addColorStop(1, 'rgba(245,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, UNIT * (0.6 + k * 1.4), 0, 6.28); ctx.fill(); }
      for (let i = 3; i >= 0; i--) {
        const ox = Math.cos(e.seg + i * 0.8) * UNIT * 0.1 - i * UNIT * 0.22 * Math.sign(e.vx || 1), oy = Math.sin(e.seg * 1.3 + i) * UNIT * 0.08;
        ctx.fillStyle = C(i === 0 ? '#d8f58a' : '#9ec65a'); ctx.beginPath(); ctx.arc(e.x + ox, e.y + oy, e.r * (1 - i * 0.15), 0, 6.28); ctx.fill();
      }
      break;
    }
    case 'thief': case 'gremlin': {
      const hop = Math.abs(Math.sin(state.time * 18 + e.x)) * UNIT * (e.mode === 'dart' ? 0.2 : 0.08), y = e.y - hop, r = e.r * scale;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.8, r, r * 0.3, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#3c4a2a'); ctx.beginPath(); ctx.ellipse(e.x, y, r * 0.85, r, 0, 0, 6.28); ctx.fill();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * r * 0.5, y - r * 0.5); ctx.lineTo(e.x + s * r * 1.5, y - r * 1.0); ctx.lineTo(e.x + s * r * 0.7, y - r * 0.1); ctx.fill(); }
      ctx.fillStyle = '#ff4a2a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * r * 0.3, y - r * 0.25, UNIT * 0.07, 0, 6.28); ctx.fill(); }
      ctx.strokeStyle = '#e9e2d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, y + r * 0.1, r * 0.35, 0.2, Math.PI - 0.2); ctx.stroke();
      if (e.type === 'thief') {                      // the stolen journal clutched overhead
        ctx.fillStyle = '#7a3a2a'; ctx.fillRect(e.x - r * 0.45, y - r * 1.55, r * 0.9, r * 0.65);
        ctx.fillStyle = '#f2e6c8'; ctx.fillRect(e.x - r * 0.38, y - r * 1.5, r * 0.76, r * 0.08);
      }
      break;
    }
    case 'rabbit': {
      const hop = e.mode === 'idle' ? Math.abs(Math.sin(state.time * 8)) * UNIT * 0.15 : Math.abs(Math.sin(state.time * 16)) * UNIT * 0.25;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.8, e.r, e.r * 0.3, 0, 0, 6.28); ctx.fill();
      const y = e.y - hop;
      ctx.fillStyle = C('#a88a60'); ctx.beginPath(); ctx.ellipse(e.x, y, e.r, e.r * 0.8, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#8a6e48');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(e.x + s * e.r * 0.3, y - e.r * 1.1, e.r * 0.18, e.r * 0.55, s * 0.2, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = C('#f2eee4'); ctx.beginPath(); ctx.arc(e.x - Math.sign(e.vx || 1) * e.r * 0.9, y, e.r * 0.25, 0, 6.28); ctx.fill();
      ctx.fillStyle = e.mode === 'dart' ? '#ff5a3a' : '#1a1410';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * e.r * 0.3, y - e.r * 0.2, UNIT * 0.06, 0, 6.28); ctx.fill(); }
      break;
    }
    case 'diver': {
      const hgt = e.hgt || 0, y = e.y - hgt * UNIT * 6;
      if (e.mode !== 'ceiling') {
        const k = 1 - hgt;
        ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(e.x, e.y + UNIT * 0.2, e.r * (0.4 + k * 0.8), e.r * (0.2 + k * 0.35), 0, 0, 6.28); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 0.4, e.r * 0.2, 0, 0, 6.28); ctx.fill();
        break;
      }
      const r = e.r * scale;
      ctx.strokeStyle = C('#2a1c33'); ctx.lineWidth = Math.max(1.5, UNIT * 0.06);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const a = (i - 1.5) * 0.45, wig = Math.sin(state.time * 12 + i) * 0.1;
        ctx.beginPath(); ctx.moveTo(e.x, y); ctx.lineTo(e.x + s * r * 1.2 * Math.cos(a + wig), y + r * 0.9 * Math.sin(a + wig) - r * 0.3); ctx.lineTo(e.x + s * r * 1.5, y + r * (0.3 + i * 0.2)); ctx.stroke();
      }
      ctx.fillStyle = C('#4b3558'); ctx.beginPath(); ctx.ellipse(e.x, y, r * 0.7, r * 0.6, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#362640'); ctx.beginPath(); ctx.ellipse(e.x, y + r * 0.5, r * 0.5, r * 0.4, 0, 0, 6.28); ctx.fill();
      break;
    }
    case 'lurker': {
      const p = e.pool; if (!p) break;
      if (e.mode === 'submerged' || e.mode === 'ripple') {
        const k = e.mode === 'ripple' ? 1 - e.t / 0.8 : 0.2;
        ctx.strokeStyle = `rgba(170,200,190,${0.2 + k * 0.5})`; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { const rr_ = UNIT * (0.3 + i * 0.3) * (0.6 + k); ctx.beginPath(); ctx.ellipse(e.x, e.y, rr_, rr_ * 0.6, 0, 0, 6.28); ctx.stroke(); }
        if (Math.random() < 0.05 + k * 0.3) state.fx.push({ x: e.x + (Math.random() - 0.5) * UNIT, y: e.y, vx: 0, vy: -UNIT * 0.5, t: 0, life: 0.4, color: 'rgba(200,230,220,.6)' });
        break;
      }
      const rise = e.mode === 'bite' ? 1 - Math.max(0, e.t) / 0.3 : e.mode === 'sink' ? Math.max(0, e.t) / 0.4 : 1;
      const r = e.r * scale * (0.4 + 0.6 * rise), y = e.y - UNIT * 0.3 * rise;
      ctx.fillStyle = C('#2f4a3e'); ctx.beginPath(); ctx.ellipse(e.x, y, r, r * 1.1, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#4d6d52');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * r * 0.8, y); ctx.lineTo(e.x + s * r * 1.5, y - r * 0.3); ctx.lineTo(e.x + s * r * 0.9, y + r * 0.4); ctx.fill(); }
      ctx.fillStyle = C('#d8e0c8');
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(e.x + i * r * 0.22 - r * 0.08, y + r * 0.3); ctx.lineTo(e.x + i * r * 0.22, y + r * 0.6); ctx.lineTo(e.x + i * r * 0.22 + r * 0.08, y + r * 0.3); ctx.fill(); }
      ctx.fillStyle = '#e9ff6a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * r * 0.35, y - r * 0.3, UNIT * 0.08, 0, 6.28); ctx.fill(); }
      break;
    }
    case 'warden': {
      if (e.mode === 'dormant') { ctx.globalAlpha = 0.85; }
      const rear = e.mode === 'rear' ? 1 + 0.15 * (1 - e.t / 0.7) : 1;
      const bw = UNIT * 2.8 * scale * rear, bh = UNIT * 2.2 * scale * rear;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + bh * 0.45, bw * 0.55, bh * 0.2, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#3a4c4a'); ctx.beginPath(); ctx.ellipse(e.x, e.y, bw / 2, bh / 2, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#4f6b3e');
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(e.x + (i - 2) * bw * 0.18, e.y - bh * 0.32 + Math.abs(i - 2) * bh * 0.06, bw * 0.12, bh * 0.1, 0, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = C('#e9e2d0');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * bw * 0.18, e.y + bh * 0.15); ctx.quadraticCurveTo(e.x + s * bw * 0.36, e.y + bh * 0.3, e.x + s * bw * 0.3, e.y - bh * 0.05); ctx.lineTo(e.x + s * bw * 0.22, e.y + bh * 0.08); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}
function drawDiverThreads() {
  for (const e of state.enemies) if (e.type === 'diver' && e.mode !== 'ceiling' && e.mode !== 'dead') {
    const y = e.y - (e.hgt || 0) * UNIT * 6;
    ctx.strokeStyle = 'rgba(210,210,230,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(e.x, y); ctx.lineTo(e.x, -10); ctx.stroke();
  }
}
function drawEnemyEyes(e) {
  if (e.mode === 'dead') return;
  const h = state.hero, look = Math.atan2(h.y - e.y, h.x - e.x);
  const ox = Math.cos(look) * UNIT * 0.1, oy = Math.sin(look) * UNIT * 0.08;
  const glow = (col, pts, r) => { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = UNIT * 0.6; for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); } ctx.shadowBlur = 0; };
  if (e.type === 'stalker' || e.type === 'charger') {
    const eyeY = e.y - UNIT * 0.2, d = UNIT * 0.28;
    if (e.mode === 'sleep') { ctx.fillStyle = 'rgba(255,60,40,.35)'; for (const s of [-1, 1]) ctx.fillRect(e.x + s * d - UNIT * 0.1, eyeY, UNIT * 0.2, UNIT * 0.04); }
    else {
      const warn = e.mode === 'windup' || e.mode === 'aim';
      glow(warn ? '#ffd23a' : e.type === 'charger' ? '#ff8a2a' : '#ff3b2a', [[e.x - d + ox, eyeY + oy], [e.x + d + ox, eyeY + oy]], UNIT * (warn ? 0.13 : 0.09));
    }
  }
  if (e.type === 'diver') {
    const y = e.y - (e.hgt || 0) * UNIT * 6;
    if (e.mode === 'ceiling') {                   // tiny glints up in the dark
      if (Math.sin(state.time * 2 + e.idx) > 0.6) glow('rgba(200,150,255,.6)', [[e.x - 4, e.y - UNIT * 0.2], [e.x + 4, e.y - UNIT * 0.2]], 1.5);
    } else glow('#c89bff', [[e.x - UNIT * 0.15, y - UNIT * 0.1], [e.x + UNIT * 0.15, y - UNIT * 0.1], [e.x - UNIT * 0.06, y - UNIT * 0.2], [e.x + UNIT * 0.06, y - UNIT * 0.2]], UNIT * 0.05);
  }
  if (e.type === 'warden' && e.mode !== 'dormant') {
    const warn = e.mode === 'aim' || e.mode === 'rear';
    glow(warn ? '#e8f8ff' : '#6fc3f5', [[e.x - UNIT * 0.45 + ox, e.y - UNIT * 0.3 + oy], [e.x + UNIT * 0.45 + ox, e.y - UNIT * 0.3 + oy]], UNIT * (warn ? 0.16 : 0.12));
  }
  if (e.mode === 'stunned') {
    ctx.fillStyle = '#ffe36a';
    for (let i = 0; i < 3; i++) { const a = state.time * 6 + i * 2.1; ctx.fillRect(e.x + Math.cos(a) * UNIT * 0.5 - 2, e.y - e.r - UNIT * 0.4 + Math.sin(a) * UNIT * 0.15 - 2, 4, 4); }
  }
}
function drawEyesDaylight() { for (const e of state.enemies) if (e.mode === 'stunned') drawEnemyEyes(e); }

// ---------- bird ----------
function drawBird() {
  const b = state.bird;
  if (b.mode === 'away' || b.mode === 'home') return;
  const s = UNIT * 0.35 * (1 + b.z / (UNIT * 4));
  const y = b.y - b.z;
  if (b.z > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.max(0.05, 0.2 - b.z / (UNIT * 40))})`; ctx.beginPath(); ctx.ellipse(b.x, b.y + UNIT, s * 0.6, s * 0.25, 0, 0, 6.28); ctx.fill(); }
  ctx.fillStyle = '#8a4a2a';
  if (b.mode === 'perch' || (b.mode === 'glide' && b.t < 0.05)) {
    const bob = Math.sin(state.time * 5) * 1.5;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + bob, s * 0.55, s * 0.45, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#d86a3a'; ctx.beginPath(); ctx.ellipse(b.x + s * 0.1, b.y + bob + s * 0.1, s * 0.3, s * 0.25, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(b.x - s * 0.8, b.y + bob - s * 0.1, s * 0.35, s * 0.15);
    ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.moveTo(b.x + s * 0.5, b.y + bob - s * 0.1); ctx.lineTo(b.x + s * 0.8, b.y + bob); ctx.lineTo(b.x + s * 0.5, b.y + bob + s * 0.05); ctx.fill();
  } else {
    const flap = Math.sin(state.time * 30) * s * 0.8;
    ctx.beginPath(); ctx.ellipse(b.x, y, s * 0.4, s * 0.3, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x - s * 1.2, y - flap); ctx.lineTo(b.x - s * 0.3, y + s * 0.1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + s * 1.2, y - flap); ctx.lineTo(b.x + s * 0.3, y + s * 0.1); ctx.fill();
  }
}

// ---------- particles, drips ----------
function drawFx() {
  for (const p of state.fx) {
    const a = Math.max(0, 1 - p.t / p.life);
    if (p.color === 'shock') {
      ctx.strokeStyle = `rgba(230,215,180,${0.8 * a})`; ctx.lineWidth = UNIT * 0.25 * a + 1;
      const r = p.size * (0.3 + 0.7 * (1 - a));
      ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.55, 0, 0, 6.28); ctx.stroke();
    } else if (p.color === 'beam') {                       // light rising from a relic
      const g = ctx.createLinearGradient(p.x, p.y - UNIT * 8, p.x, p.y);
      g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(1, `rgba(255,240,180,${0.5 * a})`);
      ctx.fillStyle = g; ctx.fillRect(p.x - UNIT * 0.6, p.y - UNIT * 8, UNIT * 1.2, UNIT * 8);
    } else if (p.color === 'rain') {
      ctx.strokeStyle = `rgba(190,210,240,${0.45 * a})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02); ctx.stroke();
    } else if (p.color === 'smoke') {
      ctx.fillStyle = `rgba(80,80,80,${0.25 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + p.t), 0, 6.28); ctx.fill();
    } else if (p.color === 'streak') {
      ctx.strokeStyle = `rgba(240,245,230,${0.18 * a})`; ctx.lineWidth = 1.2;
      const m = Math.hypot(p.vx, p.vy) || 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / m * p.size * 2, p.y - p.vy / m * p.size * 2); ctx.stroke();
    } else if (p.color === 'leaf') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin + p.t * 6); ctx.globalAlpha = a;
      ctx.fillStyle = '#9aa84a'; ctx.fillRect(-UNIT * 0.12, -UNIT * 0.05, UNIT * 0.24, UNIT * 0.1); ctx.restore();
    } else if (p.color === 'note') {
      ctx.globalAlpha = a; ctx.fillStyle = '#fdf6e3'; ctx.font = `${Math.round(UNIT * 0.5)}px serif`; ctx.fillText('\u266A', p.x, p.y);
    } else if (p.life > 0) {
      ctx.globalAlpha = a; ctx.fillStyle = p.color;
      const s = p.size || Math.max(2, UNIT * 0.08);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
  }
  ctx.globalAlpha = 1;
}
function drawDrips() {
  const h = state.hero, reach = UNIT * 6;
  const lit = (x, y) => 0.3 + 0.7 * Math.max(0, 1 - Math.hypot(x - h.x, y - h.y) / reach);
  ctx.lineCap = 'round';
  for (const d of state.drops) {
    const len = Math.min(UNIT * 0.9, d.vy * 0.03);
    ctx.strokeStyle = `rgba(170,205,230,${0.8 * lit(d.x, d.y)})`; ctx.lineWidth = Math.max(1, UNIT * 0.05);
    ctx.beginPath(); ctx.moveTo(d.x, d.y - len); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  for (const s of state.splashes) {
    const k = s.t / 0.7, a = (1 - k) * lit(s.x, s.y);
    ctx.strokeStyle = `rgba(170,205,230,${0.7 * a})`; ctx.lineWidth = Math.max(1, UNIT * 0.04);
    ctx.beginPath(); ctx.ellipse(s.x, s.y, UNIT * 0.7 * k + 1, UNIT * 0.25 * k + 0.5, 0, 0, 6.28); ctx.stroke();
    ctx.fillStyle = `rgba(190,220,240,${0.9 * a})`;
    const r = Math.max(1, UNIT * 0.05);
    for (const b of s.bits) if (b.y <= s.y + 1) ctx.fillRect(b.x - r / 2, b.y - r / 2, r, r);
  }
  ctx.lineCap = 'butt';
}

// ---------- screen space: HUD, floating text, titles ----------
function wrap(text, maxW) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
// ---------- floating text: laid out so no two boxes, the HUD, the title or the touch buttons overlap ----------
const TEXT = { min: 14, max: 19, pad: 8, gap: 6, readChars: 110, maxShown: 4 };
// areas of the screen text must stay out of
function reservedRects() {
  const r = [];
  if (state.hudRect) r.push(state.hudRect);
  if (state.title) r.push({ x: W * 0.1, y: H * 0.22 - UNIT * 1.6, w: W * 0.8, h: UNIT * (state.title.style === 'quest' || state.title.style === 'herald' ? 5.5 : 3.8) });
  if (state.arenaBanner) r.push(state.arenaBanner);
  if (state.questHudRect) r.push(state.questHudRect);
  if (state.actionHint && state.hintRect) r.push(state.hintRect);   // floating text keeps clear of the action label
  if (state.started && state.hero) {                  // never cover the hero
    const h = state.hero, [hx, hy] = toScreen(h.x, h.y - h.z), u = UNIT * state.cam.ez;
    r.push({ x: hx - u * 0.7, y: hy - u * 1.1, w: u * 1.4, h: u * 1.5 });
  }
  if (TOUCH && !state.menu) { r.push({ x: 0, y: H - 230, w: 230, h: 230 }); r.push({ x: W - 250, y: H - 230, w: 250, h: 230 }); }
  return r;
}
const overlaps = (a, b, g = 0) => a.x < b.x + b.w + g && b.x < a.x + a.w + g && a.y < b.y + b.h + g && b.y < a.y + a.h + g;
function layoutTexts() {
  const h = state.hero, placed = [], res = reservedRects(), boxes = [];
  const size = Math.round(Math.max(TEXT.min, Math.min(TEXT.max, UNIT * 0.52)));
  // long reads (letters, pages, signs) go in one panel at the bottom; only the newest shows
  const reads = state.texts.filter(t => t.text.length > TEXT.readChars);
  const read = reads[reads.length - 1];
  if (read) {
    ctx.font = `${size}px Georgia, serif`;
    const w = Math.min(W - 24, 720), lines = wrap(read.text, w - TEXT.pad * 3), lh = size * 1.4, bh = lines.length * lh + TEXT.pad * 2;
    const y = Math.max(20, H - bh - (TOUCH ? 240 : 24));
    const b = { t: read, x: (W - w) / 2, y, w, h: bh, lines, size, lh, panel: true };
    boxes.push(b); placed.push(b);
  }
  // the rest: the hero's own words first, then newest to oldest; anything that can't find clear room waits
  const speaking = speakingNow();
  const floats = state.texts.filter(t => t.text.length <= TEXT.readChars && !(speaking && t.hint)).slice(-TEXT.maxShown)
    .sort((a, b) => (b.follow ? 1 : 0) - (a.follow ? 1 : 0) || a.t - b.t);
  for (const t of floats) {
    const fs = Math.round(size * t.size);
    ctx.font = `bold ${fs}px "Courier New", monospace`;
    const lines = t.badge ? [t.badge] : wrap(t.text, Math.min(W * 0.7, UNIT * 10 * t.size, 460));
    const lh = fs * 1.3, bh = lines.length * lh + TEXT.pad * 1.4, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + TEXT.pad * 2.4;
    const wx = t.follow ? h.x : t.x, wy = t.follow ? h.y - h.z - UNIT * 1.1 : t.y;
    const [ax, ay] = toScreen(wx, wy);
    if (t.pos && t.pos.w === bw) {                    // already placed: it stays exactly there
      const b = { t, x: t.pos.x, y: t.pos.y, drawY: t.pos.y, w: bw, h: bh, lines, size: fs, lh };
      boxes.push(b); placed.push(b); continue;
    }
    const x = Math.max(8, Math.min(W - bw - 8, ax - bw / 2));
    const pref = ay - bh;                             // above the thing it talks about
    let best = null, bestCost = Infinity;
    for (let k = 0; k < 24; k++) {                    // try the preferred spot, then step up and down around it
      const off = k === 0 ? 0 : (k % 2 ? -1 : 1) * Math.ceil(k / 2) * (bh * 0.5 + TEXT.gap);
      const y = pref + off;
      if (y < 6 || y + bh > H - 6) continue;
      const cand = { x, y, w: bw, h: bh };
      const hit = placed.some(p => overlaps(cand, p, TEXT.gap)) || res.some(p => overlaps(cand, p, 2));
      const cost = Math.abs(off) + (hit ? 1e6 : 0);
      if (cost < bestCost) { bestCost = cost; best = cand; }
      if (!hit) break;
    }
    if (!best || bestCost >= 1e6) { t.ly = null; continue; }      // no clear room right now: better unseen than unreadable
    const y = best.y;
    t.pos = { x: best.x, y, w: bw };                  // fixed from now on
    const b = { t, x: best.x, y, drawY: y, w: bw, h: bh, lines, size: fs, lh };
    boxes.push(b); placed.push(b);
  }
  state.textBoxes = boxes;                           // kept for the legibility tests
  return boxes;
}
function drawTexts() {
  for (const b of layoutTexts()) {
    const t = b.t, a = Math.min(1, t.t / 0.15) * Math.min(1, (t.life - t.t) / 0.5);
    ctx.globalAlpha = a;
    const y = b.panel ? b.y : b.drawY;
    ctx.fillStyle = b.panel ? 'rgba(20,16,12,.9)' : 'rgba(10,8,14,.82)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(b.x, y, b.w, b.h, t.badge ? b.h / 2 : 8) : ctx.rect(b.x, y, b.w, b.h); ctx.fill();
    if (b.panel || t.badge) { ctx.strokeStyle = t.badge ? '#ffe38a' : 'rgba(255,227,138,.5)'; ctx.lineWidth = t.badge ? 2 : 1.5; ctx.stroke(); }
    if (t.badge) { ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${b.size}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(t.badge, b.x + b.w / 2, y + TEXT.pad * 0.7); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; continue; }
    ctx.fillStyle = t.color; ctx.textBaseline = 'top';
    if (b.panel) { ctx.font = `${b.size}px Georgia, serif`; ctx.textAlign = 'left'; b.lines.forEach((l, i) => ctx.fillText(l, b.x + TEXT.pad * 1.5, y + TEXT.pad + i * b.lh)); }
    else { ctx.font = `bold ${b.size}px "Courier New", monospace`; ctx.textAlign = 'center'; b.lines.forEach((l, i) => ctx.fillText(l, b.x + b.w / 2, y + TEXT.pad * 0.7 + i * b.lh)); }
    if (t.hold) drawReadOn(b.x + b.w, y + b.h, b.size);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  ctx.globalAlpha = 1;
}
// the small "read on" mark at the corner of anything that waits for you: the action key, or "tap" on a phone
function drawReadOn(x, y, size) {
  const k = 0.55 + 0.45 * Math.abs(Math.sin(state.time * 3)), lab = TOUCH ? 'tap' : K.act.toUpperCase().slice(0, 5), fs = Math.round(Math.max(10, size * 0.62));
  ctx.save(); ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(lab).width + fs * 0.9, h = fs * 1.35, bx = x - w * 0.5 - 4, by = y;
  ctx.globalAlpha *= k; ctx.fillStyle = '#ffe38a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx - w / 2, by - h / 2, w, h, h / 2) : ctx.rect(bx - w / 2, by - h / 2, w, h); ctx.fill();
  ctx.fillStyle = '#2a1e10'; ctx.fillText(lab, bx, by + 1);
  ctx.restore();
}
// ---------- quest banners, themed by region ----------
// Every place so far (meadow, glade, riverbank, forest, marsh, swamp, camp, the hollows) is the first region, the Vale:
// a green cloth ribbon with notched tails, gold trim and leaf sprigs. A new region adds its own theme here.
const REGION_THEME = {
  vale: { cloth: '#2f5a2a', cloth2: '#447e3a', edge: '#1d3a1a', trim: '#e8c86a', leaf: '#8cc05a', text: ['#fff8d8', '#f2d27a', '#c8942e'], ink: '#1f2a12', sub: '#e8f4d8' },
  other: { cloth: '#3a3f55', cloth2: '#545b78', edge: '#22263a', trim: '#c8d0e8', leaf: '#a0a8c8', text: ['#ffffff', '#d8def0', '#9aa4c8'], ink: '#10131f', sub: '#e8ecf8' },
};
const regionOf = sc => (sc && sc.region) || 'vale';
function heraldImage(T) {
  const th = REGION_THEME[regionOf(sceneDef())] || REGION_THEME.other, dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = Math.min(W / 13, UNIT * 1.25), c = document.createElement('canvas'), g = c.getContext('2d');
  const font = `bold ${Math.round(size)}px Georgia, "Times New Roman", serif`; g.font = font;
  const tw = Math.max(g.measureText(T.text).width, size * 4), bw = tw + size * 3.2, bh = size * 1.9, tail = size * 0.9, pad = size * 0.6;
  c.width = Math.ceil((bw + tail * 2 + pad * 2) * dpr); c.height = Math.ceil((bh + size * 1.4 + pad) * dpr); c.dpr = dpr;
  g.scale(dpr, dpr); g.font = font;                                      // resizing the canvas reset the font
  const cx = c.width / dpr / 2, top = size * 1.1, y0 = top, y1 = top + bh, x0 = cx - bw / 2, x1 = cx + bw / 2;
  // tails, tucked behind, with a notch
  g.fillStyle = th.edge;
  for (const s of [-1, 1]) { const xe = s < 0 ? x0 : x1, xo = xe + s * tail * 1.6; g.beginPath(); g.moveTo(xe, y0 + bh * 0.22); g.lineTo(xo, y0 + bh * 0.22); g.lineTo(xo - s * tail * 0.55, y0 + bh * 0.6); g.lineTo(xo, y1 + bh * 0.02); g.lineTo(xe, y1 + bh * 0.02); g.closePath(); g.fill(); }
  // the cloth, a gentle wave, lighter across the middle
  const grad = g.createLinearGradient(0, y0, 0, y1); grad.addColorStop(0, th.cloth2); grad.addColorStop(0.5, th.cloth); grad.addColorStop(1, th.edge);
  g.fillStyle = grad; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, y0 - size * 0.25, x1, y0); g.lineTo(x1, y1); g.quadraticCurveTo(cx, y1 - size * 0.25, x0, y1); g.closePath(); g.fill();
  g.strokeStyle = th.trim; g.lineWidth = Math.max(1.5, size * 0.05);
  g.beginPath(); g.moveTo(x0 + size * 0.2, y0 + size * 0.14); g.quadraticCurveTo(cx, y0 - size * 0.1, x1 - size * 0.2, y0 + size * 0.14); g.stroke();
  g.beginPath(); g.moveTo(x0 + size * 0.2, y1 - size * 0.14); g.quadraticCurveTo(cx, y1 - size * 0.38, x1 - size * 0.2, y1 - size * 0.14); g.stroke();
  // leaf sprigs at each end
  for (const s of [-1, 1]) { const lx = cx + s * (bw / 2 - size * 0.55), ly = (y0 + y1) / 2 - size * 0.05;
    g.strokeStyle = th.leaf; g.lineWidth = Math.max(1, size * 0.04); g.beginPath(); g.moveTo(lx - s * size * 0.25, ly + size * 0.2); g.quadraticCurveTo(lx, ly, lx + s * size * 0.2, ly - size * 0.25); g.stroke();
    g.fillStyle = th.leaf; for (const [dx, dy, r] of [[-0.1, 0.1, 0.5], [0.08, -0.08, -0.4], [0.16, -0.2, 0.3]]) { g.save(); g.translate(lx + s * dx * size, ly + dy * size); g.rotate(s * r); g.beginPath(); g.ellipse(0, 0, size * 0.13, size * 0.06, 0, 0, 6.28); g.fill(); g.restore(); } }
  // the words: an ink shadow, then a gold gradient (no blur, so moving it is cheap)
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ty = (y0 + y1) / 2 - size * 0.1;
  g.fillStyle = th.ink; g.globalAlpha = 0.55; g.fillText(T.text, cx + size * 0.04, ty + size * 0.06); g.globalAlpha = 1;
  const tg = g.createLinearGradient(0, ty - size / 2, 0, ty + size / 2); tg.addColorStop(0, th.text[0]); tg.addColorStop(0.55, th.text[1]); tg.addColorStop(1, th.text[2]);
  g.fillStyle = tg; g.fillText(T.text, cx, ty);
  g.font = `italic ${Math.round(size * 0.42)}px Georgia, serif`; g.fillStyle = th.sub; g.globalAlpha = 0.9; g.fillText(T.sub, cx, top - size * 0.45);
  return c;
}
function drawTitle() {
  const T = state.title;
  if (!T) return;
  const k = T.t, fadeOut = Math.min(1, (T.life - k) / 0.6);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (T.style === 'herald') {                        // quest banners: drawn once to their own canvas, then only moved and faded (smooth)
    const img = T.img || (T.img = heraldImage(T));
    const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };   // smootherstep
    const fin = smooth(k / 0.9), unfurl = smooth(k / 0.75), fout = smooth((T.life - k) / 1.1), a = Math.min(fin, fout);
    const drift = (1 - fin) * UNIT * 0.5 - (1 - fout) * UNIT * 0.35;
    const dw = img.width / img.dpr, dh = img.height / img.dpr, x = W / 2 - dw / 2, y = H * 0.27 - dh / 2 + drift;
    const vis = Math.max(1, img.width * unfurl), sx = (img.width - vis) / 2;           // the ribbon unrolls from the middle out
    ctx.globalAlpha = a;
    ctx.drawImage(img, sx, 0, vis, img.height, x + sx / img.dpr, y, vis / img.dpr, dh);
    } else if (T.style === 'quest') {
    const pop = k < 0.35 ? 2.2 - 1.2 * (k / 0.35) : 1 + 0.04 * Math.sin(k * 6) * Math.max(0, 1 - k);
    const size = Math.min(W / 4.2, UNIT * 3.4) * pop;
    ctx.globalAlpha = Math.min(1, k / 0.1) * fadeOut;
    if (k < 0.3) { ctx.fillStyle = `rgba(255,255,240,${0.6 * (1 - k / 0.3)})`; ctx.fillRect(0, 0, W, H); }
    ctx.font = `900 ${Math.round(size)}px Georgia, "Times New Roman", serif`;
    ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = size * 0.25;
    ctx.lineWidth = Math.max(3, size * 0.06); ctx.strokeStyle = '#3a2410';
    const y = H * 0.36;
    ctx.strokeText(T.text, W / 2, y);
    const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    g.addColorStop(0, '#fff6c8'); g.addColorStop(0.55, '#f2c94c'); g.addColorStop(1, '#b8792a');
    ctx.fillStyle = g; ctx.fillText(T.text, W / 2, y);
    ctx.shadowBlur = 0;
    if (k > 0.5) {
      ctx.globalAlpha = Math.min(1, (k - 0.5) / 0.4) * fadeOut;
      ctx.font = `italic ${Math.round(Math.max(14, size * 0.16))}px Georgia, serif`;
      ctx.fillStyle = '#fdf6e3'; ctx.fillText(T.sub, W / 2, y + size * 0.62);
    }
  } else {
    const size = Math.min(W / 12, UNIT * (T.style === 'end' ? 1.6 : 1.1));
    ctx.globalAlpha = Math.min(1, k / 0.4) * fadeOut;
    ctx.font = `bold ${Math.round(size)}px Georgia, serif`;
    const relic = T.style === 'relic';
    if (relic) { ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = size * 0.4; }
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(T.text, W / 2 + 2, H * 0.22 + 2);
    ctx.fillStyle = relic ? '#ffe38a' : '#fdf6e3'; ctx.fillText(T.text, W / 2, H * 0.22);
    ctx.shadowBlur = 0;
    if (T.sub) { ctx.fillStyle = '#fdf6e3'; ctx.font = `${Math.round(size * 0.45)}px "Courier New", monospace`; wrap(T.sub, Math.min(W * 0.85, 560)).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.22 + size * (1.1 + i * 0.6))); }
    if (T.hold) drawReadOn(W / 2 + size * 1.2, H * 0.22 + size * (T.sub ? 2.1 : 1.1), size * 0.9);
  }
  ctx.restore();
}

// =====================================================================
// Start
// =====================================================================
const startEl = document.getElementById('start');
// ---------------- full screen on phones ----------------
const standalone = () => window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const inFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || standalone();
function goFullscreen() {
  if (inFullscreen()) return;
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) {
    try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => fullscreenTip()); } catch (e) { fullscreenTip(); }
  } else fullscreenTip();                            // iPhone Safari has no full-screen API for pages
}
function exitFullscreen() { const ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) ex.call(document); }
function fullscreenTip() {
  if (fullscreenTip.shown) return;                  // once per session is enough
  fullscreenTip.shown = true;
  const tip = document.getElementById('fsTip');
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  tip.textContent = ios ? 'For full screen on iPhone: tap Share, then "Add to Home Screen", and launch Quest from the new icon.' : 'Full screen is not available in this browser. Try "Add to Home Screen" from the browser menu.';
  tip.classList.remove('hidden');
  setTimeout(() => tip.classList.add('hidden'), 6000);
}
const canFullscreen = () => !standalone() && !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || /iPhone|iPad|iPod/.test(navigator.userAgent));
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => setTimeout(resize, 60)));
// on phones, any tap while not full screen takes it back (browsers only grant it inside a tap)
if (TOUCH) document.addEventListener('pointerdown', () => { if (state.started && !inFullscreen() && !state.menu) goFullscreen(); }, { passive: true });
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => setTimeout(resize, 30));
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
function begin() {
  if (state.started) return;
  if (TOUCH) goFullscreen();                         // the first tap on a phone also takes the screen
  state.started = true;
  startEl.remove();
  state.texts = []; state.title = null;
  if (ARENA) startArena(); else if (PUZZLE) startPuzzleHub(); else startIntro();
  startMusic();
}
startEl.addEventListener('pointerdown', begin);
window.addEventListener('resize', () => { if (!OVERVIEW) resize(); });

function resizeCanvasOnly() {
  canvas.width = W * DPR; canvas.height = H * DPR;
  lightCv.width = Math.ceil(W / 2); lightCv.height = Math.ceil(H / 2);
}
function resize() {
  if (OVERVIEW) return;                              // the map page keeps its own size
  const oW = W, oH = H;
  DPR = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  resizeCanvasOnly();
  computeUnit();
  const sx = W / oW, sy = H / oH;
  for (const a of [state.hero, ...state.enemies, ...state.items, ...state.hazards, ...state.rings, state.bird].filter(Boolean)) { a.x *= sx; a.y *= sy; }
  if (sceneDef() && sceneDef().river && sceneDef().river.stones) layoutStones(sceneDef());
  refreshSceneGeometry();
}

const PARAMS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
var OVERVIEW = PARAMS.has('overview');
resizeCanvasOnly();
loadSettings();
if (OVERVIEW) startOverview(PARAMS.get('overview'));
else {
  const chosen = PARAMS.get('seed');
  resetRun(chosen && /^\d+$/.test(chosen) ? Number(chosen) >>> 0 : (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  enterScene(ARENA ? 'arena' : PUZZLE ? 'puzzlehub' : 'camp');
  state.cam.x = W / 2; state.cam.y = H / 2;
}

let last = performance.now();
function loop(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state.slowmo > 0) { state.slowmo -= dt; dt *= 0.3; }
  // a bad frame should never stop the game: log it once and keep going
  try { update(dt); draw(); } catch (e) { if (!loop.warned) { loop.warned = true; console.error('Frame error (game continues):', e); } }
  requestAnimationFrame(loop);
}
if (!OVERVIEW) requestAnimationFrame(loop);
</script>
</body>
</html>
