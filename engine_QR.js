
  // ── State ──
  let qrInstance = null;
  let currentUrl = '';
  let ecLevel = 'M';
  let debounceTimer = null;

  const urlInput    = document.getElementById('urlInput');
  const qrWrap      = document.getElementById('qrWrap');
  const qrCode      = document.getElementById('qrCode');
  const qrPlaceholder = document.getElementById('qrPlaceholder');
  const statusDot   = document.getElementById('statusDot');
  const statusText  = document.getElementById('statusText');
  const btnPrint    = document.getElementById('btnPrint');
  const btnPng      = document.getElementById('btnPng');
  const btnCopyLink = document.getElementById('btnCopyLink');
  const btnSettings = document.getElementById('btnSettings');
  const btnClear    = document.getElementById('btnClear');
  const settingsPanel = document.getElementById('settingsPanel');
  const sizeInput   = document.getElementById('sizeInput');
  const colorInput  = document.getElementById('colorInput');
  const colorHex    = document.getElementById('colorHex');

  // ── Settings toggle ──
  btnSettings.addEventListener('click', () => {
    const open = settingsPanel.classList.toggle('open');
    btnSettings.classList.toggle('active', open);
  });

  // ── Clear ──
  btnClear.addEventListener('click', () => {
    urlInput.value = '';
    clearQR();
    btnClear.classList.remove('visible');
  });

  // ── Color ──
  colorInput.addEventListener('input', () => {
    colorHex.textContent = colorInput.value.toUpperCase();
    if (currentUrl) generateQR(currentUrl);
  });

  // ── Error correction ──
  document.querySelectorAll('.ec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ec-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ecLevel = btn.dataset.ec;
      if (currentUrl) generateQR(currentUrl);
    });
  });

  // ── URL input ──
  urlInput.addEventListener('input', () => {
    const val = urlInput.value.trim();
    btnClear.classList.toggle('visible', val.length > 0);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleUrlChange(val), 500);
  });

  function handleUrlChange(val) {
    if (!val) { clearQR(); return; }
    // loose URL validation
    if (!isValidUrl(val)) {
      setStatus('waiting', 'URL inválida');
      return;
    }
    currentUrl = val;
    generateQR(val);
  }

  function isValidUrl(s) {
    try {
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }

  function generateQR(url) {
    const size = parseInt(sizeInput.value) || 256;
    const color = colorInput.value;

    qrCode.innerHTML = '';
    qrWrap.classList.add('blurred');
    qrPlaceholder.style.display = 'none';
    qrCode.style.display = 'block';
    setStatus('waiting', 'Gerando...');
    disableActions(true);

    try {
      qrInstance = new QRCode(qrCode, {
        text: url,
        width: size,
        height: size,
        colorDark: color,
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel[ecLevel]
      });

      // QRCode.js renders async via image
      setTimeout(() => {
        qrWrap.classList.remove('blurred');
        setStatus('ready', 'Pronto para impressão');
        disableActions(false);
      }, 200);
    } catch(e) {
      setStatus('waiting', 'Erro ao gerar QR');
      qrPlaceholder.style.display = 'flex';
      qrCode.style.display = 'none';
    }
  }

  function clearQR() {
    currentUrl = '';
    qrCode.innerHTML = '';
    qrCode.style.display = 'none';
    qrPlaceholder.style.display = 'flex';
    qrWrap.classList.add('blurred');
    setStatus('waiting', 'Aguardando...');
    disableActions(true);
  }

  function setStatus(type, msg) {
    statusDot.className = 'dot ' + type;
    statusText.textContent = msg;
  }

  function disableActions(state) {
    btnPrint.disabled = state;
    btnPng.disabled = state;
    btnCopyLink.disabled = state;
  }

  // ── Print ──
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // ── PNG Download ──
  btnPng.addEventListener('click', () => {
    const canvas = qrCode.querySelector('canvas');
    const img    = qrCode.querySelector('img');

    if (canvas) {
      download(canvas.toDataURL('image/png'), 'qrcode.png');
    } else if (img) {
      // Convert image to canvas for download
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      download(c.toDataURL('image/png'), 'qrcode.png');
    }
  });

  function download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
    showToast('PNG baixado!');
  }

  // ── Copy link ──
  btnCopyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(currentUrl)
      .then(() => showToast('Link copiado!'))
      .catch(() => showToast('Erro ao copiar'));
  });

  // ── Toast ──
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ── Size change regens ──
  sizeInput.addEventListener('change', () => {
    if (currentUrl) generateQR(currentUrl);
  });
