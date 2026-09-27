// ===== boot.js: Startup: settings, the first scene, the start button. Runs last.
// =====================================================================
// Start
// =====================================================================
if (document.fonts && document.fonts.load) document.fonts.load('24px Caveat').catch(() => {});   // Pip's handwriting for the book
const startEl = document.getElementById('start');
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => setTimeout(resize, 60)));
// on phones, any tap while not full screen takes it back (browsers only grant it inside a tap)
if (TOUCH) document.addEventListener('pointerdown', () => { if (state.started && !inFullscreen() && !state.menu) goFullscreen(); }, { passive: true });
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => setTimeout(resize, 30));
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
startEl.addEventListener('pointerdown', begin);
window.addEventListener('resize', () => { if (!OVERVIEW) resize(); });

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

if (!OVERVIEW) requestAnimationFrame(loop);
</script>
</body>
</html>
