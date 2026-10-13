/**
 * VTI Media Studio - Main Application Logic
 * Pure Vanilla JS (Zero Build Step / Works Locally & on GitHub Pages)
 */

(function () {
  'use strict';

  /* ==========================================================================
     유틸리티 함수
     ========================================================================== */
  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function formatDuration(seconds) {
    if (!seconds || !isFinite(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getBaseName(filename) {
    const idx = filename.lastIndexOf('.');
    return idx > 0 ? filename.slice(0, idx) : filename;
  }

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  function triggerDownload(blobOrUrl, filename) {
    const a = document.createElement('a');
    let url = blobOrUrl;
    let isObjectUrl = false;
    if (blobOrUrl instanceof Blob) {
      url = URL.createObjectURL(blobOrUrl);
      isObjectUrl = true;
    }
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (isObjectUrl) {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 불러올 수 없습니다.'));
      };
      img.src = url;
    });
  }

  /* ==========================================================================
     1. 다크모드 토글 (기본: 화이트 라이트 테마) & 상단 탭 네비게이션
     ========================================================================== */
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? '다크' : '라이트';
    }
    try {
      localStorage.setItem('vti_theme', theme);
    } catch (e) {
      // localStorage 차단 환경 무시
    }
  }

  // 초기 테마 로드 (기본값: 'light')
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('vti_theme') || 'light';
  } catch (e) {
    savedTheme = 'light';
  }
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? '다크 모드가 켜졌습니다.' : '화이트(라이트) 모드가 켜졌습니다.');
    });
  }

  // 상단 4개 탭 전환
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  let activeTabId = 'img-compress';

  function switchTab(targetTab) {
    activeTabId = targetTab;
    navTabs.forEach((btn) => {
      const isMatch = btn.getAttribute('data-tab') === targetTab;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `tab-${targetTab}`);
    });
  }

  navTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  const brandLogo = document.getElementById('brandLogo');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => switchTab('img-compress'));
  }

  /* ==========================================================================
     2. 탭 1: 이미지 압축 (Image Compressor)
     ========================================================================== */
  const compressState = {
    items: [] // { id, file, origWidth, origHeight, newWidth, newHeight, compressedBlob, outputExt, thumbUrl }
  };

  const compressQualityInput = document.getElementById('compressQuality');
  const compressQualityVal = document.getElementById('compressQualityVal');
  const compressFormatSelect = document.getElementById('compressFormat');
  const compressScaleSelect = document.getElementById('compressScale');
  const compressDropzone = document.getElementById('compressDropzone');
  const compressFileInput = document.getElementById('compressFileInput');
  const compressFileList = document.getElementById('compressFileList');
  const compressSummaryBar = document.getElementById('compressSummaryBar');
  const recompressAllBtn = document.getElementById('recompressAllBtn');
  const downloadAllCompressedBtn = document.getElementById('downloadAllCompressedBtn');
  const clearCompressedBtn = document.getElementById('clearCompressedBtn');
  const presetChips = document.querySelectorAll('.preset-chips .chip-btn');

  // 품질 슬라이더 이벤트
  if (compressQualityInput) {
    compressQualityInput.addEventListener('input', () => {
      compressQualityVal.textContent = `${compressQualityInput.value}%`;
      presetChips.forEach((chip) => {
        chip.classList.toggle('active', chip.getAttribute('data-q') === compressQualityInput.value);
      });
    });
  }

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-q');
      compressQualityInput.value = q;
      compressQualityVal.textContent = `${q}%`;
      presetChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (compressState.items.length > 0) {
        recompressAllItems();
      }
    });
  });

  function calculateTargetDimensions(origW, origH, scaleMode) {
    let w = origW;
    let h = origH;
    if (scaleMode === '0.75') {
      w = Math.max(1, Math.round(origW * 0.75));
      h = Math.max(1, Math.round(origH * 0.75));
    } else if (scaleMode === '0.5') {
      w = Math.max(1, Math.round(origW * 0.5));
      h = Math.max(1, Math.round(origH * 0.5));
    } else if (scaleMode.startsWith('max-')) {
      const maxW = parseInt(scaleMode.replace('max-', ''), 10);
      if (origW > maxW) {
        const ratio = maxW / origW;
        w = maxW;
        h = Math.max(1, Math.round(origH * ratio));
      }
    }
    return { width: w, height: h };
  }

  // PNG 색상 양자화(Bit-depth 최적화)를 통해 투명도를 유지하면서 PNG 용량을 줄이는 함수
  function quantizeCanvasForPng(ctx, width, height, qualityPercent) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    // quality 10~98 -> 양자화 스텝 계산 (낮을수록 더 적은 색상 단계를 사용해 압축률 극대화)
    const levels = Math.max(4, Math.round((qualityPercent / 100) * 48));
    const step = 255 / (levels - 1);

    let hasAlpha = false;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(Math.round(data[i] / step) * step);
      data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
      data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
      if (data[i + 3] < 250) {
        hasAlpha = true;
        data[i + 3] = Math.round(Math.round(data[i + 3] / 16) * 16);
      } else {
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return hasAlpha;
  }

  function canvasToBlobPromise(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
  }

  async function compressSingleImage(item) {
    const qualityNum = parseInt(compressQualityInput.value, 10);
    const quality = Math.min(0.98, Math.max(0.1, qualityNum / 100));
    const formatOption = compressFormatSelect.value;
    const scaleOption = compressScaleSelect.value;

    const img = await loadImageFromFile(item.file);
    item.origWidth = img.naturalWidth || img.width;
    item.origHeight = img.naturalHeight || img.height;

    const { width, height } = calculateTargetDimensions(item.origWidth, item.origHeight, scaleOption);
    item.newWidth = width;
    item.newHeight = height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    let targetMime = item.file.type || 'image/jpeg';
    let ext = 'jpg';

    if (formatOption === 'image/webp') {
      targetMime = 'image/webp';
      ext = 'webp';
    } else if (formatOption === 'image/jpeg') {
      targetMime = 'image/jpeg';
      ext = 'jpg';
    } else if (formatOption === 'keep') {
      if (targetMime === 'image/png') ext = 'png';
      else if (targetMime === 'image/webp') ext = 'webp';
      else {
        targetMime = 'image/jpeg';
        ext = 'jpg';
      }
    } else {
      // 'smart' 모드: 원본이 PNG일 때 양자화 PNG와 WebP를 비교하여 최적 압축 수행
      if (targetMime === 'image/png') {
        const hasAlpha = quantizeCanvasForPng(ctx, width, height, qualityNum);
        const pngBlob = await canvasToBlobPromise(canvas, 'image/png');
        const webpBlob = await canvasToBlobPromise(canvas, 'image/webp', quality);

        // PNG 양자화 결과가 원본보다 충분히 작으면 PNG 유지, 아니면 고효율 WebP/JPG 선택
        if (pngBlob && pngBlob.size < item.file.size * 0.85) {
          item.compressedBlob = pngBlob;
          item.outputExt = 'png';
          return;
        } else if (webpBlob && webpBlob.size < item.file.size) {
          item.compressedBlob = webpBlob;
          item.outputExt = 'webp';
          return;
        } else if (!hasAlpha) {
          const jpgBlob = await canvasToBlobPromise(canvas, 'image/jpeg', quality);
          if (jpgBlob && jpgBlob.size < item.file.size) {
            item.compressedBlob = jpgBlob;
            item.outputExt = 'jpg';
            return;
          }
        }
        item.compressedBlob = pngBlob && pngBlob.size < item.file.size ? pngBlob : item.file;
        item.outputExt = 'png';
        return;
      } else if (targetMime === 'image/webp') {
        ext = 'webp';
      } else {
        targetMime = 'image/jpeg';
        ext = 'jpg';
      }
    }

    // JPG 변환 시 투명 배경을 흰색으로 채움
    if (targetMime === 'image/jpeg') {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = width;
      bgCanvas.height = height;
      const bgCtx = bgCanvas.getContext('2d');
      bgCtx.fillStyle = '#ffffff';
      bgCtx.fillRect(0, 0, width, height);
      bgCtx.drawImage(canvas, 0, 0);
      const blob = await canvasToBlobPromise(bgCanvas, 'image/jpeg', quality);
      item.compressedBlob = blob;
      item.outputExt = 'jpg';
      return;
    }

    if (targetMime === 'image/png') {
      quantizeCanvasForPng(ctx, width, height, qualityNum);
      const pngBlob = await canvasToBlobPromise(canvas, 'image/png');
      item.compressedBlob = pngBlob;
      item.outputExt = 'png';
      return;
    }

    const blob = await canvasToBlobPromise(canvas, targetMime, quality);
    item.compressedBlob = blob;
    item.outputExt = ext;
  }

  function renderCompressList() {
    compressFileList.innerHTML = '';
    const hasItems = compressState.items.length > 0;
    compressSummaryBar.classList.toggle('hidden', !hasItems);
    recompressAllBtn.disabled = !hasItems;
    downloadAllCompressedBtn.disabled = !hasItems;
    clearCompressedBtn.disabled = !hasItems;

    if (!hasItems) return;

    let origSum = 0;
    let newSum = 0;

    compressState.items.forEach((item) => {
      const origSize = item.file.size;
      const newSize = item.compressedBlob ? item.compressedBlob.size : origSize;
      origSum += origSize;
      newSum += newSize;

      const diffRatio = origSize > 0 ? ((origSize - newSize) / origSize) * 100 : 0;
      const ratioText = diffRatio >= 0 ? `-${diffRatio.toFixed(1)}% 절감` : `+${Math.abs(diffRatio).toFixed(1)}%`;

      const row = document.createElement('div');
      row.className = 'file-item';
      row.innerHTML = `
        <div class="file-item-left">
          <img class="file-thumb" src="${item.thumbUrl}" alt="미리보기" />
          <div class="file-meta">
            <div class="file-name">${item.file.name}</div>
            <div class="file-details">
              <span>${item.origWidth}×${item.origHeight}</span>
              <span class="arrow-sep">→</span>
              <span>${item.newWidth}×${item.newHeight} (${item.outputExt.toUpperCase()})</span>
              <span>|</span>
              <span>${formatBytes(origSize)}</span>
              <span class="arrow-sep">→</span>
              <span class="size-new">${formatBytes(newSize)}</span>
              <span class="saving-pill">${ratioText}</span>
            </div>
          </div>
        </div>
        <div class="file-item-actions">
          <button type="button" class="btn btn-primary btn-sm dl-single-btn">다운로드</button>
          <button type="button" class="btn btn-outline btn-sm rm-single-btn">삭제</button>
        </div>
      `;

      row.querySelector('.dl-single-btn').addEventListener('click', () => {
        if (!item.compressedBlob) return;
        const outName = `${getBaseName(item.file.name)}_compressed.${item.outputExt}`;
        triggerDownload(item.compressedBlob, outName);
      });

      row.querySelector('.rm-single-btn').addEventListener('click', () => {
        URL.revokeObjectURL(item.thumbUrl);
        compressState.items = compressState.items.filter((x) => x.id !== item.id);
        renderCompressList();
      });

      compressFileList.appendChild(row);
    });

    document.getElementById('compressTotalCount').textContent = `${compressState.items.length}개`;
    document.getElementById('compressOrigTotal').textContent = formatBytes(origSum);
    document.getElementById('compressNewTotal').textContent = formatBytes(newSum);
    const totalSavedPct = origSum > 0 ? Math.max(0, ((origSum - newSum) / origSum) * 100) : 0;
    document.getElementById('compressSavedBadge').textContent = `${totalSavedPct.toFixed(1)}% 절감 (${formatBytes(Math.max(0, origSum - newSum))})`;
  }

  async function addFilesToCompressor(fileList) {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    for (const file of validFiles) {
      const item = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        origWidth: 0,
        origHeight: 0,
        newWidth: 0,
        newHeight: 0,
        compressedBlob: null,
        outputExt: 'jpg',
        thumbUrl: URL.createObjectURL(file)
      };
      try {
        await compressSingleImage(item);
        compressState.items.push(item);
      } catch (err) {
        URL.revokeObjectURL(item.thumbUrl);
        showToast(`${file.name} 처리 중 오류가 발생했습니다.`);
      }
    }
    renderCompressList();
    showToast(`${validFiles.length}개의 이미지 압축이 완료되었습니다.`);
  }

  async function recompressAllItems() {
    if (compressState.items.length === 0) return;
    recompressAllBtn.disabled = true;
    recompressAllBtn.textContent = '압축 중...';
    for (const item of compressState.items) {
      await compressSingleImage(item);
    }
    recompressAllBtn.disabled = false;
    recompressAllBtn.textContent = '설정값으로 다시 압축하기';
    renderCompressList();
    showToast('새로운 설정으로 다시 압축되었습니다.');
  }

  if (compressDropzone) {
    compressDropzone.addEventListener('click', () => compressFileInput.click());
    compressDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      compressDropzone.classList.add('dragover');
    });
    compressDropzone.addEventListener('dragleave', () => compressDropzone.classList.remove('dragover'));
    compressDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      compressDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) addFilesToCompressor(e.dataTransfer.files);
    });
  }

  if (compressFileInput) {
    compressFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) addFilesToCompressor(e.target.files);
      compressFileInput.value = '';
    });
  }

  if (recompressAllBtn) recompressAllBtn.addEventListener('click', recompressAllItems);
  if (compressFormatSelect) compressFormatSelect.addEventListener('change', recompressAllItems);
  if (compressScaleSelect) compressScaleSelect.addEventListener('change', recompressAllItems);

  if (downloadAllCompressedBtn) {
    downloadAllCompressedBtn.addEventListener('click', () => {
      compressState.items.forEach((item, idx) => {
        setTimeout(() => {
          const outName = `${getBaseName(item.file.name)}_compressed.${item.outputExt}`;
          triggerDownload(item.compressedBlob, outName);
        }, idx * 180);
      });
      showToast('전체 이미지 다운로드를 시작합니다.');
    });
  }

  if (clearCompressedBtn) {
    clearCompressedBtn.addEventListener('click', () => {
      compressState.items.forEach((item) => URL.revokeObjectURL(item.thumbUrl));
      compressState.items = [];
      renderCompressList();
      showToast('목록을 비웠습니다.');
    });
  }

  // 클립보드 붙여넣기 (Ctrl+V) 지원
  window.addEventListener('paste', (e) => {
    if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) return;
    if (activeTabId === 'img-compress') {
      addFilesToCompressor(e.clipboardData.files);
    } else if (activeTabId === 'img-convert') {
      addFilesToConverter(e.clipboardData.files);
    }
  });

  /* ==========================================================================
     3. 탭 2: 이미지 포맷 변환 (Image Converter - PNG, JPG, WebP, BMP, ICO, PDF)
     ========================================================================== */
  const convertState = {
    targetMime: 'image/png',
    targetExt: 'png',
    items: [] // { id, file, width, height, convertedBlob, outExt, thumbUrl }
  };

  const formatPills = document.querySelectorAll('#convertFormatGrid .format-pill');
  const convertBgColor = document.getElementById('convertBgColor');
  const convertBgColorHex = document.getElementById('convertBgColorHex');
  const icoSizeGroup = document.getElementById('icoSizeGroup');
  const icoSizeSelect = document.getElementById('icoSizeSelect');
  const convertDropzone = document.getElementById('convertDropzone');
  const convertFileInput = document.getElementById('convertFileInput');
  const convertFileList = document.getElementById('convertFileList');
  const convertAllBtn = document.getElementById('convertAllBtn');
  const downloadAllConvertedBtn = document.getElementById('downloadAllConvertedBtn');
  const clearConvertedBtn = document.getElementById('clearConvertedBtn');

  formatPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      formatPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      convertState.targetMime = pill.getAttribute('data-fmt');
      convertState.targetExt = pill.getAttribute('data-ext');
      if (icoSizeGroup) {
        icoSizeGroup.style.display = convertState.targetExt === 'ico' ? 'block' : 'none';
      }
      if (convertState.items.length > 0) {
        convertAllItems();
      }
    });
  });

  if (convertBgColor) {
    convertBgColor.addEventListener('input', () => {
      convertBgColorHex.textContent = convertBgColor.value.toUpperCase();
      if (convertState.items.length > 0) convertAllItems();
    });
  }

  if (icoSizeSelect) {
    icoSizeSelect.addEventListener('change', () => {
      if (convertState.items.length > 0) convertAllItems();
    });
  }

  // 순수 JS 24-bit BMP 바이너리 인코더
  function encodeCanvasToBmpBlob(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, w, h).data;

    const rowSize = Math.floor((24 * w + 31) / 32) * 4;
    const pixelArraySize = rowSize * h;
    const fileSize = 54 + pixelArraySize;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // BITMAPFILEHEADER (14 bytes)
    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4D); // 'M'
    view.setUint32(2, fileSize, true);
    view.setUint32(6, 0, true);
    view.setUint32(10, 54, true);

    // BITMAPINFOHEADER (40 bytes)
    view.setUint32(14, 40, true);
    view.setInt32(18, w, true);
    view.setInt32(22, -h, true); // top-down
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true);
    view.setInt32(42, 2835, true);
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    let offset = 54;
    const padding = rowSize - w * 3;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        view.setUint8(offset++, imgData[idx + 2]); // B
        view.setUint8(offset++, imgData[idx + 1]); // G
        view.setUint8(offset++, imgData[idx]);     // R
      }
      offset += padding;
    }
    return new Blob([buffer], { type: 'image/bmp' });
  }

  // 순수 JS 윈도우 ICO 바이너리 인코더 (PNG 내장 표준 규격)
  async function encodeCanvasToIcoBlob(sourceCanvas, size) {
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = size;
    icoCanvas.height = size;
    const ctx = icoCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, size, size);

    const pngBlob = await canvasToBlobPromise(icoCanvas, 'image/png');
    const pngBuf = await pngBlob.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuf);

    const totalSize = 22 + pngBytes.length;
    const icoBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(icoBuffer);

    // ICONDIR (6 bytes)
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true); // 1 = ICO
    view.setUint16(4, 1, true); // 1 image

    // ICONDIRENTRY (16 bytes)
    view.setUint8(6, size >= 256 ? 0 : size);
    view.setUint8(7, size >= 256 ? 0 : size);
    view.setUint8(8, 0);
    view.setUint8(9, 0);
    view.setUint16(10, 1, true);
    view.setUint16(12, 32, true);
    view.setUint32(14, pngBytes.length, true);
    view.setUint32(18, 22, true);

    const outBytes = new Uint8Array(icoBuffer);
    outBytes.set(pngBytes, 22);
    return new Blob([icoBuffer], { type: 'image/x-icon' });
  }

  // 순수 JS PDF 변환기 (JPG 스트림을 내장한 표준 PDF 문서 생성)
  async function encodeCanvasToPdfBlob(canvas) {
    const jpgBlob = await canvasToBlobPromise(canvas, 'image/jpeg', 0.92);
    const jpgBuf = await jpgBlob.arrayBuffer();
    const jpgBytes = new Uint8Array(jpgBuf);

    const w = canvas.width;
    const h = canvas.height;

    const encoder = new TextEncoder();
    const chunks = [];
    const offsets = [];
    let byteLength = 0;

    function pushStr(str) {
      const b = encoder.encode(str);
      chunks.push(b);
      byteLength += b.length;
    }

    function pushBytes(b) {
      chunks.push(b);
      byteLength += b.length;
    }

    pushStr('%PDF-1.4\n');

    offsets.push(byteLength);
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    offsets.push(byteLength);
    pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    offsets.push(byteLength);
    pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${w} ${h}] /Contents 5 0 R >>\nendobj\n`);

    offsets.push(byteLength);
    pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`);
    pushBytes(jpgBytes);
    pushStr('\nendstream\nendobj\n');

    const contentStream = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    offsets.push(byteLength);
    pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

    const xrefOffset = byteLength;
    pushStr(`xref\n0 6\n0000000000 65535 f \n`);
    offsets.forEach((off) => {
      pushStr(`${String(off).padStart(10, '0')} 00000 n \n`);
    });
    pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return new Blob(chunks, { type: 'application/pdf' });
  }

  async function convertSingleImage(item) {
    const img = await loadImageFromFile(item.file);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    item.width = w;
    item.height = h;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const needsSolidBg =
      convertState.targetMime === 'image/jpeg' ||
      convertState.targetMime === 'image/bmp' ||
      convertState.targetMime === 'application/pdf';

    if (needsSolidBg) {
      ctx.fillStyle = convertBgColor ? convertBgColor.value : '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(img, 0, 0, w, h);
    item.outExt = convertState.targetExt;

    if (convertState.targetMime === 'image/bmp') {
      item.convertedBlob = encodeCanvasToBmpBlob(canvas);
    } else if (convertState.targetMime === 'image/x-icon') {
      const icoSize = parseInt(icoSizeSelect ? icoSizeSelect.value : '256', 10);
      item.convertedBlob = await encodeCanvasToIcoBlob(canvas, icoSize);
    } else if (convertState.targetMime === 'application/pdf') {
      item.convertedBlob = await encodeCanvasToPdfBlob(canvas);
    } else {
      item.convertedBlob = await canvasToBlobPromise(canvas, convertState.targetMime, 0.92);
    }
  }

  function renderConvertList() {
    convertFileList.innerHTML = '';
    const hasItems = convertState.items.length > 0;
    convertAllBtn.disabled = !hasItems;
    downloadAllConvertedBtn.disabled = !hasItems;
    clearConvertedBtn.disabled = !hasItems;

    if (!hasItems) return;

    convertState.items.forEach((item) => {
      const newSize = item.convertedBlob ? item.convertedBlob.size : 0;
      const row = document.createElement('div');
      row.className = 'file-item';
      row.innerHTML = `
        <div class="file-item-left">
          <img class="file-thumb" src="${item.thumbUrl}" alt="미리보기" />
          <div class="file-meta">
            <div class="file-name">${item.file.name}</div>
            <div class="file-details">
              <span>${item.width}×${item.height} px</span>
              <span>|</span>
              <span>원본: ${formatBytes(item.file.size)}</span>
              <span class="arrow-sep">→</span>
              <span class="size-new">${item.outExt.toUpperCase()} (${formatBytes(newSize)})</span>
            </div>
          </div>
        </div>
        <div class="file-item-actions">
          <button type="button" class="btn btn-primary btn-sm dl-conv-btn">${item.outExt.toUpperCase()} 다운로드</button>
          <button type="button" class="btn btn-outline btn-sm rm-conv-btn">삭제</button>
        </div>
      `;

      row.querySelector('.dl-conv-btn').addEventListener('click', () => {
        if (!item.convertedBlob) return;
        const outName = `${getBaseName(item.file.name)}.${item.outExt}`;
        triggerDownload(item.convertedBlob, outName);
      });

      row.querySelector('.rm-conv-btn').addEventListener('click', () => {
        URL.revokeObjectURL(item.thumbUrl);
        convertState.items = convertState.items.filter((x) => x.id !== item.id);
        renderConvertList();
      });

      convertFileList.appendChild(row);
    });
  }

  async function addFilesToConverter(fileList) {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/') || /\.(svg|ico|bmp|webp|avif)$/i.test(f.name));
    if (validFiles.length === 0) {
      showToast('변환 가능한 이미지 파일을 선택해 주세요.');
      return;
    }

    for (const file of validFiles) {
      const item = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        width: 0,
        height: 0,
        convertedBlob: null,
        outExt: convertState.targetExt,
        thumbUrl: URL.createObjectURL(file)
      };
      try {
        await convertSingleImage(item);
        convertState.items.push(item);
      } catch (err) {
        URL.revokeObjectURL(item.thumbUrl);
        showToast(`${file.name} 변환 중 오류가 발생했습니다.`);
      }
    }
    renderConvertList();
    showToast(`${validFiles.length}개의 파일이 ${convertState.targetExt.toUpperCase()} 포맷으로 변환되었습니다.`);
  }

  async function convertAllItems() {
    if (convertState.items.length === 0) return;
    for (const item of convertState.items) {
      await convertSingleImage(item);
    }
    renderConvertList();
    showToast(`전체 파일이 ${convertState.targetExt.toUpperCase()} 포맷으로 변환되었습니다.`);
  }

  if (convertDropzone) {
    convertDropzone.addEventListener('click', () => convertFileInput.click());
    convertDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      convertDropzone.classList.add('dragover');
    });
    convertDropzone.addEventListener('dragleave', () => convertDropzone.classList.remove('dragover'));
    convertDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      convertDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) addFilesToConverter(e.dataTransfer.files);
    });
  }

  if (convertFileInput) {
    convertFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) addFilesToConverter(e.target.files);
      convertFileInput.value = '';
    });
  }

  if (convertAllBtn) convertAllBtn.addEventListener('click', convertAllItems);

  if (downloadAllConvertedBtn) {
    downloadAllConvertedBtn.addEventListener('click', () => {
      convertState.items.forEach((item, idx) => {
        setTimeout(() => {
          const outName = `${getBaseName(item.file.name)}.${item.outExt}`;
          triggerDownload(item.convertedBlob, outName);
        }, idx * 180);
      });
      showToast('변환된 파일 전체 다운로드를 시작합니다.');
    });
  }

  if (clearConvertedBtn) {
    clearConvertedBtn.addEventListener('click', () => {
      convertState.items.forEach((item) => URL.revokeObjectURL(item.thumbUrl));
      convertState.items = [];
      renderConvertList();
      showToast('목록을 비웠습니다.');
    });
  }

  /* ==========================================================================
     4. 탭 3: 동영상 압축 (Video Compressor)
     ========================================================================== */
  const videoState = {
    file: null,
    fileUrl: null,
    origWidth: 0,
    origHeight: 0,
    duration: 0,
    isCompressing: false,
    recorder: null,
    animFrameId: null
  };

  const videoDropzone = document.getElementById('videoDropzone');
  const videoFileInput = document.getElementById('videoFileInput');
  const videoWorkCard = document.getElementById('videoWorkCard');
  const videoFileName = document.getElementById('videoFileName');
  const videoMetaInfo = document.getElementById('videoMetaInfo');
  const changeVideoBtn = document.getElementById('changeVideoBtn');
  const origVideoPlayer = document.getElementById('origVideoPlayer');
  const compressedVideoBox = document.getElementById('compressedVideoBox');
  const compressedVideoPlayer = document.getElementById('compressedVideoPlayer');
  const downloadCompressedVideoBtn = document.getElementById('downloadCompressedVideoBtn');
  const videoResultStatText = document.getElementById('videoResultStatText');
  const videoResolution = document.getElementById('videoResolution');
  const videoBitratePreset = document.getElementById('videoBitratePreset');
  const videoFps = document.getElementById('videoFps');
  const videoMuteAudio = document.getElementById('videoMuteAudio');
  const videoEstimatedSize = document.getElementById('videoEstimatedSize');
  const startVideoCompressBtn = document.getElementById('startVideoCompressBtn');
  const cancelVideoCompressBtn = document.getElementById('cancelVideoCompressBtn');
  const videoProgressPanel = document.getElementById('videoProgressPanel');
  const videoProgressBar = document.getElementById('videoProgressBar');
  const videoProgressPercent = document.getElementById('videoProgressPercent');
  const videoProgressStatus = document.getElementById('videoProgressStatus');

  function updateVideoEstimate() {
    if (!videoState.file || !videoState.duration) {
      videoEstimatedSize.textContent = '영상을 선택하세요';
      return;
    }
    const vBitrate = parseInt(videoBitratePreset.value, 10);
    const aBitrate = videoMuteAudio.checked ? 0 : 128000;
    const totalBitsPerSec = vBitrate + aBitrate;
    const estBytes = (totalBitsPerSec / 8) * videoState.duration;
    const savingPct = Math.max(0, ((videoState.file.size - estBytes) / videoState.file.size) * 100);
    videoEstimatedSize.textContent = `약 ${formatBytes(estBytes)} (${savingPct > 0 ? `약 ${savingPct.toFixed(0)}% 절감 예상` : '원본과 유사'})`;
  }

  [videoResolution, videoBitratePreset, videoFps, videoMuteAudio].forEach((el) => {
    if (el) el.addEventListener('change', updateVideoEstimate);
  });

  function loadVideoFile(file) {
    if (!file || !file.type.startsWith('video/')) {
      showToast('올바른 동영상 파일을 선택해 주세요.');
      return;
    }
    if (videoState.fileUrl) URL.revokeObjectURL(videoState.fileUrl);
    videoState.file = file;
    videoState.fileUrl = URL.createObjectURL(file);

    origVideoPlayer.src = videoState.fileUrl;
    compressedVideoBox.classList.add('hidden');
    videoProgressPanel.classList.add('hidden');
    videoDropzone.classList.add('hidden');
    videoWorkCard.classList.remove('hidden');
    startVideoCompressBtn.disabled = false;

    origVideoPlayer.onloadedmetadata = () => {
      videoState.origWidth = origVideoPlayer.videoWidth || 1280;
      videoState.origHeight = origVideoPlayer.videoHeight || 720;
      videoState.duration = origVideoPlayer.duration || 0;

      videoFileName.textContent = file.name;
      videoMetaInfo.textContent = `원본 용량: ${formatBytes(file.size)} · 해상도: ${videoState.origWidth}×${videoState.origHeight} · 길이: ${formatDuration(videoState.duration)}`;
      updateVideoEstimate();
    };
  }

  if (videoDropzone) {
    videoDropzone.addEventListener('click', () => videoFileInput.click());
    videoDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      videoDropzone.classList.add('dragover');
    });
    videoDropzone.addEventListener('dragleave', () => videoDropzone.classList.remove('dragover'));
    videoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      videoDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) loadVideoFile(e.dataTransfer.files[0]);
    });
  }

  if (videoFileInput) {
    videoFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) loadVideoFile(e.target.files[0]);
      videoFileInput.value = '';
    });
  }

  if (changeVideoBtn) {
    changeVideoBtn.addEventListener('click', () => {
      if (videoState.isCompressing) return;
      videoFileInput.click();
    });
  }

  function getSupportedVideoMime() {
    const candidates = [
      { mime: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
      { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
      { mime: 'video/mp4', ext: 'mp4' },
      { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
      { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
      { mime: 'video/webm', ext: 'webm' }
    ];
    for (const c of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(c.mime)) {
        return c;
      }
    }
    return { mime: '', ext: 'webm' };
  }

  function getTargetVideoSize(origW, origH, resMode) {
    if (resMode === 'keep') return { width: origW, height: origH };
    const targetH = parseInt(resMode, 10);
    const shortSide = Math.min(origW, origH);
    if (shortSide <= targetH) return { width: origW, height: origH };
    const scale = targetH / shortSide;
    // 인코더 호환성을 위해 짝수 픽셀로 맞춤
    const w = Math.max(2, Math.round((origW * scale) / 2) * 2);
    const h = Math.max(2, Math.round((origH * scale) / 2) * 2);
    return { width: w, height: h };
  }

  async function startVideoCompression() {
    if (!videoState.file || videoState.isCompressing) return;

    videoState.isCompressing = true;
    startVideoCompressBtn.disabled = true;
    cancelVideoCompressBtn.classList.remove('hidden');
    compressedVideoBox.classList.add('hidden');
    videoProgressPanel.classList.remove('hidden');
    videoProgressBar.style.width = '0%';
    videoProgressPercent.textContent = '0%';
    videoProgressStatus.textContent = '동영상 인코딩 준비 중...';

    const { width, height } = getTargetVideoSize(
      videoState.origWidth,
      videoState.origHeight,
      videoResolution.value
    );
    const fps = parseInt(videoFps.value, 10) || 30;
    const vBitrate = parseInt(videoBitratePreset.value, 10) || 1500000;
    const muteAudio = videoMuteAudio.checked;

    const procVideo = document.createElement('video');
    procVideo.src = videoState.fileUrl;
    procVideo.muted = muteAudio;
    procVideo.playsInline = true;
    procVideo.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      procVideo.onloadeddata = resolve;
      procVideo.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const canvasStream = canvas.captureStream(fps);
    let audioCtx = null;

    if (!muteAudio) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(procVideo);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
      } catch (e) {
        // 오디오 트랙이 없거나 추출 불가 시 비디오만 인코딩
      }
    }

    const supported = getSupportedVideoMime();
    const recorderOptions = {
      videoBitsPerSecond: vBitrate
    };
    if (supported.mime) {
      recorderOptions.mimeType = supported.mime;
    }

    const chunks = [];
    const recorder = new MediaRecorder(canvasStream, recorderOptions);
    videoState.recorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (videoState.animFrameId) cancelAnimationFrame(videoState.animFrameId);
      if (audioCtx) audioCtx.close().catch(() => {});
      procVideo.pause();
      procVideo.src = '';

      if (!videoState.isCompressing) {
        // 사용자가 취소한 경우
        videoProgressPanel.classList.add('hidden');
        startVideoCompressBtn.disabled = false;
        cancelVideoCompressBtn.classList.add('hidden');
        return;
      }

      videoState.isCompressing = false;
      startVideoCompressBtn.disabled = false;
      cancelVideoCompressBtn.classList.add('hidden');

      const outBlob = new Blob(chunks, { type: supported.mime || 'video/webm' });
      const outUrl = URL.createObjectURL(outBlob);
      compressedVideoPlayer.src = outUrl;
      compressedVideoBox.classList.remove('hidden');

      const origSize = videoState.file.size;
      const newSize = outBlob.size;
      const savedRatio = origSize > 0 ? ((origSize - newSize) / origSize) * 100 : 0;

      videoProgressBar.style.width = '100%';
      videoProgressPercent.textContent = '100%';
      videoProgressStatus.textContent = '동영상 압축이 완료되었습니다!';

      videoResultStatText.textContent = `${formatBytes(origSize)} → ${formatBytes(newSize)} (${savedRatio >= 0 ? `-${savedRatio.toFixed(1)}% 절감` : '완료'}) · ${width}×${height}`;
      downloadCompressedVideoBtn.href = outUrl;
      downloadCompressedVideoBtn.download = `${getBaseName(videoState.file.name)}_compressed.${supported.ext}`;
      showToast('동영상 압축이 완료되었습니다!');
    };

    function drawFrame() {
      if (!procVideo.paused && !procVideo.ended) {
        ctx.drawImage(procVideo, 0, 0, width, height);
        if (videoState.duration > 0) {
          const pct = Math.min(99, Math.round((procVideo.currentTime / videoState.duration) * 100));
          videoProgressBar.style.width = `${pct}%`;
          videoProgressPercent.textContent = `${pct}%`;
          videoProgressStatus.textContent = `실시간 하드웨어 압축 인코딩 중... (${formatDuration(procVideo.currentTime)} / ${formatDuration(videoState.duration)})`;
        }
        videoState.animFrameId = requestAnimationFrame(drawFrame);
      }
    }

    procVideo.onended = () => {
      if (recorder.state === 'recording') recorder.stop();
    };

    recorder.start(250);
    await procVideo.play();
    drawFrame();
  }

  if (startVideoCompressBtn) {
    startVideoCompressBtn.addEventListener('click', () => {
      startVideoCompression().catch((err) => {
        videoState.isCompressing = false;
        startVideoCompressBtn.disabled = false;
        cancelVideoCompressBtn.classList.add('hidden');
        showToast('동영상 압축을 시작할 수 없습니다: ' + err.message);
      });
    });
  }

  if (cancelVideoCompressBtn) {
    cancelVideoCompressBtn.addEventListener('click', () => {
      if (!videoState.isCompressing) return;
      videoState.isCompressing = false;
      if (videoState.recorder && videoState.recorder.state === 'recording') {
        videoState.recorder.stop();
      }
      showToast('동영상 압축을 중지했습니다.');
    });
  }

  /* ==========================================================================
     5. 탭 4: 유튜브 다운로드 (YouTube Downloader - 내장 위젯 & 썸네일 직접 저장)
     ========================================================================== */
  const ytForm = document.getElementById('ytForm');
  const ytUrlInput = document.getElementById('ytUrlInput');
  const ytPasteBtn = document.getElementById('ytPasteBtn');
  const ytResultContainer = document.getElementById('ytResultContainer');
  const ytThumbImg = document.getElementById('ytThumbImg');
  const ytIdBadge = document.getElementById('ytIdBadge');
  const ytVideoTitle = document.getElementById('ytVideoTitle');
  const ytVideoAuthor = document.getElementById('ytVideoAuthor');
  const ytEmbedFrame1 = document.getElementById('ytEmbedFrame1');
  const ytEmbedFrame2 = document.getElementById('ytEmbedFrame2');
  const gwSsyoutube = document.getElementById('gwSsyoutube');
  const gwY2mate = document.getElementById('gwY2mate');
  const gwCobalt = document.getElementById('gwCobalt');
  const gwSnapsave = document.getElementById('gwSnapsave');
  const ytEngineTabs = document.querySelectorAll('#ytEngineTabs .engine-tab');
  const thumbDlBtns = document.querySelectorAll('.thumb-dl-btn');

  let currentYtVideoId = '';
  let currentYtFullUrl = '';

  function extractYouTubeId(inputUrl) {
    if (!inputUrl) return null;
    const trimmed = inputUrl.trim();
    // 이미 11자리 ID만 입력한 경우
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const reg of patterns) {
      const match = trimmed.match(reg);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  async function fetchYouTubeMeta(videoUrl, videoId) {
    ytVideoTitle.textContent = '유튜브 영상 정보를 불러오는 중...';
    ytVideoAuthor.textContent = '';
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
      if (!res.ok) throw new Error('메타데이터 응답 오류');
      const data = await res.json();
      ytVideoTitle.textContent = data.title || `YouTube Video (${videoId})`;
      ytVideoAuthor.textContent = data.author_name ? `채널: ${data.author_name}` : '';
    } catch (e) {
      ytVideoTitle.textContent = `유튜브 영상 (ID: ${videoId})`;
      ytVideoAuthor.textContent = '우측 추출기에서 화질을 선택해 바로 다운로드하세요.';
    }
  }

  function loadYouTubeVideo(rawUrl) {
    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      showToast('올바른 유튜브 주소(URL)를 입력해 주세요.');
      return;
    }

    currentYtVideoId = videoId;
    currentYtFullUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 썸네일 및 기본 정보 세팅
    ytThumbImg.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    ytThumbImg.onload = () => {
      // maxresdefault 존재 여부 확인 후 교체
      const hdImg = new Image();
      hdImg.onload = () => {
        if (hdImg.naturalWidth > 120) {
          ytThumbImg.src = hdImg.src;
        }
      };
      hdImg.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    };
    ytIdBadge.textContent = `ID: ${videoId}`;
    fetchYouTubeMeta(currentYtFullUrl, videoId);

    // 내장 클라우드 추출기 1 (화질별 MP4 / MP3 올인원 카드 위젯)
    ytEmbedFrame1.src = `https://loader.to/api/card2/?url=${encodeURIComponent(currentYtFullUrl)}`;

    // 내장 클라우드 추출기 2 (버튼형 고속 추출 위젯)
    ytEmbedFrame2.src = `https://loader.to/api/button/?url=${encodeURIComponent(currentYtFullUrl)}&f=mp4`;

    // 외부 다이렉트 게이트웨이 주소 세팅
    if (gwSsyoutube) gwSsyoutube.href = `https://www.ssyoutube.com/watch?v=${videoId}`;
    if (gwY2mate) gwY2mate.href = `https://www.youtubepp.com/watch?v=${videoId}`;

    ytResultContainer.classList.remove('hidden');
    showToast('유튜브 영상을 성공적으로 불러왔습니다!');
  }

  if (ytForm) {
    ytForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadYouTubeVideo(ytUrlInput.value);
    });
  }

  if (ytPasteBtn) {
    ytPasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          ytUrlInput.value = text;
          loadYouTubeVideo(text);
        } else {
          showToast('클립보드가 비어 있습니다.');
        }
      } catch (e) {
        ytUrlInput.focus();
        showToast('입력창에 Ctrl+V를 눌러 붙여넣어 주세요.');
      }
    });
  }

  // 추출 서버 탭 전환
  ytEngineTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      ytEngineTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const engine = tab.getAttribute('data-engine');
      document.getElementById('engineViewLoader').classList.toggle('active', engine === 'loader');
      document.getElementById('engineViewWidget2').classList.toggle('active', engine === 'widget2');
      document.getElementById('engineViewDirect').classList.toggle('active', engine === 'direct');
    });
  });

  // 광고 새 창(팝업) 자동 차단 스위치 제어
  const blockPopupToggle = document.getElementById('blockPopupToggle');
  if (blockPopupToggle) {
    blockPopupToggle.addEventListener('change', () => {
      const val = blockPopupToggle.checked
        ? 'allow-scripts allow-same-origin allow-downloads allow-forms'
        : 'allow-scripts allow-same-origin allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox';
      if (ytEmbedFrame1) ytEmbedFrame1.setAttribute('sandbox', val);
      if (ytEmbedFrame2) ytEmbedFrame2.setAttribute('sandbox', val);
      // 설정 반영을 위해 현재 로드된 iframe 새로고침
      if (currentYtFullUrl) {
        if (ytEmbedFrame1 && ytEmbedFrame1.src !== 'about:blank') ytEmbedFrame1.src = ytEmbedFrame1.src;
        if (ytEmbedFrame2 && ytEmbedFrame2.src !== 'about:blank') ytEmbedFrame2.src = ytEmbedFrame2.src;
      }
      showToast(
        blockPopupToggle.checked
          ? '광고 새 창(팝업) 자동 차단이 켜졌습니다.'
          : '새 창 열기가 허용되었습니다.'
      );
    });
  }

  // 진행 취소 / 추출기 강제 초기화 버튼 제어
  const resetYtExtractorBtn = document.getElementById('resetYtExtractorBtn');
  const resetYtExtractorBtn2 = document.getElementById('resetYtExtractorBtn2');

  function resetYtExtractors() {
    if (!currentYtFullUrl) return;
    if (ytEmbedFrame1) {
      ytEmbedFrame1.src = 'about:blank';
      setTimeout(() => {
        ytEmbedFrame1.src = `https://loader.to/api/card2/?url=${encodeURIComponent(currentYtFullUrl)}&t=${Date.now()}`;
      }, 80);
    }
    if (ytEmbedFrame2) {
      ytEmbedFrame2.src = 'about:blank';
      setTimeout(() => {
        ytEmbedFrame2.src = `https://loader.to/api/button/?url=${encodeURIComponent(currentYtFullUrl)}&f=mp4&t=${Date.now()}`;
      }, 80);
    }
    showToast('진행 중인 추출 작업을 취소하고 추출기를 초기화했습니다.');
  }

  if (resetYtExtractorBtn) resetYtExtractorBtn.addEventListener('click', resetYtExtractors);
  if (resetYtExtractorBtn2) resetYtExtractorBtn2.addEventListener('click', resetYtExtractors);

  // Cobalt / SnapSave 클릭 시 자동으로 클립보드에 유튜브 주소 복사
  [gwCobalt, gwSnapsave].forEach((link) => {
    if (!link) return;
    link.addEventListener('click', () => {
      if (currentYtFullUrl && navigator.clipboard) {
        navigator.clipboard.writeText(currentYtFullUrl).catch(() => {});
        showToast('유튜브 주소가 자동 복사되었습니다! 열리는 사이트에 붙여넣기(Ctrl+V) 하세요.');
      }
    });
  });

  // 고화질 썸네일 직접 파일 다운로드 (새 창 열기가 아닌 즉시 .jpg 저장)
  thumbDlBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!currentYtVideoId) return;
      const res = btn.getAttribute('data-res') || 'maxresdefault';
      const thumbUrl = `https://i.ytimg.com/vi/${currentYtVideoId}/${res}.jpg`;
      try {
        const response = await fetch(thumbUrl);
        if (!response.ok) throw new Error('해상도 없음');
        const blob = await response.blob();
        triggerDownload(blob, `youtube_${currentYtVideoId}_${res}.jpg`);
        showToast('썸네일 이미지 다운로드가 완료되었습니다.');
      } catch (e) {
        // maxresdefault가 없는 영상이거나 CORS 제한 시 폴백
        const fallbackUrl = `https://i.ytimg.com/vi/${currentYtVideoId}/hqdefault.jpg`;
        try {
          const response2 = await fetch(fallbackUrl);
          const blob2 = await response2.blob();
          triggerDownload(blob2, `youtube_${currentYtVideoId}_hq.jpg`);
          showToast('고화질(HQ) 썸네일로 다운로드되었습니다.');
        } catch (err) {
          window.open(thumbUrl, '_blank');
        }
      }
    });
  });

  /* ==========================================================================
     6. 탭 3: 이미지 편집 (Image Editor: 자르기/회전/규격맞춤 & 배경 제거)
     ========================================================================== */
  let activeEditSubtool = 'crop';
  const subtoolBtns = document.querySelectorAll('#editSubtoolSwitcher .subtool-btn');
  const subtoolCropView = document.getElementById('subtool-crop');
  const subtoolBgView = document.getElementById('subtool-bgremove');

  subtoolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      subtoolBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeEditSubtool = btn.getAttribute('data-subtool');
      if (subtoolCropView) subtoolCropView.classList.toggle('active', activeEditSubtool === 'crop');
      if (subtoolBgView) subtoolBgView.classList.toggle('active', activeEditSubtool === 'bgremove');
    });
  });

  /* --------------------------------------------------------------------------
     [6-1] 서브툴 1: 이미지 자르기 · 회전 · 원하는 픽셀 사이즈 맞춤
     -------------------------------------------------------------------------- */
  const cropState = {
    file: null,
    img: null,
    baseRot: 0,       // 0, 90, 180, 270
    fineAngle: 0,     // -45 ~ +45
    flipH: 1,         // 1 or -1
    flipV: 1,         // 1 or -1
    ratioMode: 'full', // 'full', 'free', '1:1', '4:3', '16:9', '3:4', 'custom'
    customRatio: null,
    masterCanvas: document.createElement('canvas'),
    displayScale: 1,
    // 자르기 영역 (masterCanvas 원본 픽셀 기준 좌표)
    rect: { x: 0, y: 0, w: 100, h: 100 }
  };

  const cropDropzone = document.getElementById('cropDropzone');
  const cropFileInput = document.getElementById('cropFileInput');
  const cropStageCard = document.getElementById('cropStageCard');
  const cropPreviewCanvas = document.getElementById('cropPreviewCanvas');
  const cropBox = document.getElementById('cropBox');
  const cropSizeFloating = document.getElementById('cropSizeFloating');
  const cropOrigInfo = document.getElementById('cropOrigInfo');
  const cropBoxInfo = document.getElementById('cropBoxInfo');
  const cropFinalInfo = document.getElementById('cropFinalInfo');
  const cropRatioBtns = document.querySelectorAll('#cropRatioGrid .chip-btn');
  const cropKeepAspectInput = document.getElementById('cropKeepAspectInput');
  const cropTargetW = document.getElementById('cropTargetW');
  const cropTargetH = document.getElementById('cropTargetH');
  const applyFullResizeBtn = document.getElementById('applyFullResizeBtn');
  const applyCropPixelBtn = document.getElementById('applyCropPixelBtn');
  const cropForceExactSize = document.getElementById('cropForceExactSize');
  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');
  const flipHBtn = document.getElementById('flipHBtn');
  const flipVBtn = document.getElementById('flipVBtn');
  const cropFineAngle = document.getElementById('cropFineAngle');
  const cropFineAngleVal = document.getElementById('cropFineAngleVal');
  const cropOutputFormat = document.getElementById('cropOutputFormat');
  const downloadCroppedBtn = document.getElementById('downloadCroppedBtn');
  const resetCropBtn = document.getElementById('resetCropBtn');
  const changeCropImgBtn = document.getElementById('changeCropImgBtn');

  function getActiveAspectRatio() {
    if (cropState.ratioMode === 'free' || cropState.ratioMode === 'full') return null;
    if (cropState.ratioMode === 'custom' && cropState.customRatio) return cropState.customRatio;
    const parts = cropState.ratioMode.split(':');
    if (parts.length === 2) {
      const rw = parseFloat(parts[0]);
      const rh = parseFloat(parts[1]);
      if (rw > 0 && rh > 0) return rw / rh;
    }
    return null;
  }

  function rebuildCropMasterCanvas() {
    if (!cropState.img) return;
    const srcW = cropState.img.naturalWidth || cropState.img.width;
    const srcH = cropState.img.naturalHeight || cropState.img.height;
    const isSwapped = cropState.baseRot === 90 || cropState.baseRot === 270;
    const mw = isSwapped ? srcH : srcW;
    const mh = isSwapped ? srcW : srcH;

    const mc = cropState.masterCanvas;
    mc.width = mw;
    mc.height = mh;
    const ctx = mc.getContext('2d');
    ctx.clearRect(0, 0, mw, mh);
    ctx.save();
    ctx.translate(mw / 2, mh / 2);
    const totalRad = ((cropState.baseRot + cropState.fineAngle) * Math.PI) / 180;
    ctx.rotate(totalRad);
    ctx.scale(cropState.flipH, cropState.flipV);
    ctx.drawImage(cropState.img, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();

    // 화면 표시용 프리뷰 캔버스 스케일링 (최대 740 x 520 안에 맞춤)
    const maxDispW = 740;
    const maxDispH = 520;
    const scale = Math.min(1, maxDispW / mw, maxDispH / mh);
    cropState.displayScale = scale;

    const dispW = Math.max(1, Math.round(mw * scale));
    const dispH = Math.max(1, Math.round(mh * scale));
    cropPreviewCanvas.width = dispW;
    cropPreviewCanvas.height = dispH;
    const pCtx = cropPreviewCanvas.getContext('2d');
    pCtx.imageSmoothingEnabled = true;
    pCtx.imageSmoothingQuality = 'high';
    pCtx.clearRect(0, 0, dispW, dispH);
    pCtx.drawImage(mc, 0, 0, dispW, dispH);
  }

  function constrainCropRectToRatio(centerKeep) {
    const mw = cropState.masterCanvas.width;
    const mh = cropState.masterCanvas.height;
    if (!mw || !mh) return;

    if (cropState.ratioMode === 'full') {
      cropState.rect = { x: 0, y: 0, w: mw, h: mh };
      return;
    }

    const ratio = getActiveAspectRatio();
    if (!ratio) {
      cropState.rect.w = Math.min(mw, Math.max(16, cropState.rect.w));
      cropState.rect.h = Math.min(mh, Math.max(16, cropState.rect.h));
      cropState.rect.x = Math.min(mw - cropState.rect.w, Math.max(0, cropState.rect.x));
      cropState.rect.y = Math.min(mh - cropState.rect.h, Math.max(0, cropState.rect.y));
      return;
    }

    // 사진 안에서 해당 비율로 잡을 수 있는 가장 큰 영역(꽉 찬 비율 틀) 계산
    const cx = centerKeep ? cropState.rect.x + cropState.rect.w / 2 : mw / 2;
    const cy = centerKeep ? cropState.rect.y + cropState.rect.h / 2 : mh / 2;
    let w = centerKeep ? cropState.rect.w : mw;
    let h = w / ratio;

    if (h > mh) {
      h = mh;
      w = h * ratio;
    }
    if (w > mw) {
      w = mw;
      h = w / ratio;
    }

    w = Math.max(16, Math.round(w));
    h = Math.max(16, Math.round(h));
    let x = Math.round(cx - w / 2);
    let y = Math.round(cy - h / 2);
    x = Math.min(mw - w, Math.max(0, x));
    y = Math.min(mh - h, Math.max(0, y));

    cropState.rect = { x, y, w, h };
  }

  function updateCropBoxUI() {
    const s = cropState.displayScale;
    const r = cropState.rect;
    cropBox.style.left = `${Math.round(r.x * s)}px`;
    cropBox.style.top = `${Math.round(r.y * s)}px`;
    cropBox.style.width = `${Math.max(12, Math.round(r.w * s))}px`;
    cropBox.style.height = `${Math.max(12, Math.round(r.h * s))}px`;

    const selW = Math.max(1, Math.round(r.w));
    const selH = Math.max(1, Math.round(r.h));

    const tw = parseInt(cropTargetW.value, 10);
    const th = parseInt(cropTargetH.value, 10);
    const useExact = cropForceExactSize.checked && tw > 0 && th > 0;
    const finalW = useExact ? tw : selW;
    const finalH = useExact ? th : selH;

    cropSizeFloating.textContent = `${finalW} × ${finalH} px`;
    cropOrigInfo.textContent = `원본: ${cropState.masterCanvas.width} × ${cropState.masterCanvas.height} px`;
    cropBoxInfo.textContent = `선택 영역: ${selW} × ${selH} px`;
    cropFinalInfo.textContent = `최종 저장 크기: ${finalW} × ${finalH} px`;
  }

  async function loadCropImage(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('올바른 이미지 파일을 선택해 주세요.');
      return;
    }
    try {
      const img = await loadImageFromFile(file);
      cropState.file = file;
      cropState.img = img;
      cropState.baseRot = 0;
      cropState.fineAngle = 0;
      cropState.flipH = 1;
      cropState.flipV = 1;
      cropState.ratioMode = 'full';
      cropRatioBtns.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-ratio') === 'full');
      });
      cropFineAngle.value = '0';
      cropFineAngleVal.textContent = '0°';

      rebuildCropMasterCanvas();
      const mw = cropState.masterCanvas.width;
      const mh = cropState.masterCanvas.height;
      // 초기 영역: 이미지 전체 선택 (잘림 없음) + 입력칸에 원본 해상도 자동 표시
      cropState.rect = { x: 0, y: 0, w: mw, h: mh };
      cropTargetW.value = String(mw);
      cropTargetH.value = String(mh);
      updateCropBoxUI();

      cropDropzone.classList.add('hidden');
      cropStageCard.classList.remove('hidden');
      downloadCroppedBtn.disabled = false;
      resetCropBtn.disabled = false;
      changeCropImgBtn.disabled = false;
      showToast(`이미지를 불러왔습니다 (${mw}×${mh} px). 원하는 픽셀 숫자를 입력해 리사이즈하거나 틀을 조절하세요!`);
    } catch (err) {
      showToast('이미지를 불러오지 못했습니다.');
    }
  }

  if (cropDropzone) {
    cropDropzone.addEventListener('click', () => cropFileInput.click());
    cropDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      cropDropzone.classList.add('dragover');
    });
    cropDropzone.addEventListener('dragleave', () => cropDropzone.classList.remove('dragover'));
    cropDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      cropDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) loadCropImage(e.dataTransfer.files[0]);
    });
  }

  if (cropFileInput) {
    cropFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) loadCropImage(e.target.files[0]);
      cropFileInput.value = '';
    });
  }

  if (changeCropImgBtn) {
    changeCropImgBtn.addEventListener('click', () => cropFileInput.click());
  }

  // 비율 버튼 클릭
  cropRatioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      cropRatioBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      cropState.ratioMode = btn.getAttribute('data-ratio');
      cropState.customRatio = null;
      if (cropState.img) {
        constrainCropRectToRatio(false);
        cropTargetW.value = String(Math.round(cropState.rect.w));
        cropTargetH.value = String(Math.round(cropState.rect.h));
        updateCropBoxUI();
      }
    });
  });

  // 가로(W) 또는 세로(H) 입력 시 비율 자동 맞춤 계산
  if (cropTargetW) {
    cropTargetW.addEventListener('input', () => {
      const tw = parseInt(cropTargetW.value, 10);
      if (cropKeepAspectInput && cropKeepAspectInput.checked && tw > 0 && cropState.rect.w > 0) {
        const ratio = cropState.rect.h / cropState.rect.w;
        cropTargetH.value = String(Math.max(1, Math.round(tw * ratio)));
      }
      updateCropBoxUI();
    });
  }

  if (cropTargetH) {
    cropTargetH.addEventListener('input', () => {
      const th = parseInt(cropTargetH.value, 10);
      if (cropKeepAspectInput && cropKeepAspectInput.checked && th > 0 && cropState.rect.h > 0) {
        const ratio = cropState.rect.w / cropState.rect.h;
        cropTargetW.value = String(Math.max(1, Math.round(th * ratio)));
      }
      updateCropBoxUI();
    });
  }

  // [전체 리사이즈 적용] 버튼: 자르지 않고 이미지 전체를 선택한 뒤 입력한 W x H 해상도로 리사이즈
  if (applyFullResizeBtn) {
    applyFullResizeBtn.addEventListener('click', () => {
      const tw = parseInt(cropTargetW.value, 10);
      const th = parseInt(cropTargetH.value, 10);
      if (!tw || !th || tw <= 0 || th <= 0) {
        showToast('리사이즈할 가로(W)와 세로(H) 픽셀 숫자를 입력해 주세요.');
        return;
      }
      cropRatioBtns.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-ratio') === 'full');
      });
      cropState.ratioMode = 'full';
      cropState.customRatio = null;
      cropForceExactSize.checked = true;

      if (cropState.img) {
        const mw = cropState.masterCanvas.width;
        const mh = cropState.masterCanvas.height;
        cropState.rect = { x: 0, y: 0, w: mw, h: mh };
        updateCropBoxUI();
        showToast(`전체 사진(${mw}×${mh})을 자르지 않고 ${tw} × ${th} px 크기로 리사이즈합니다!`);
      }
    });
  }

  // [자르기 틀 비율 적용] 버튼: 사진에 꽉 차는 가로:세로 비율 틀을 잡고 저장 시 W x H로 리사이즈
  function applyCustomPixelFrame() {
    const tw = parseInt(cropTargetW.value, 10);
    const th = parseInt(cropTargetH.value, 10);
    if (!tw || !th || tw <= 0 || th <= 0) {
      showToast('가로(W)와 세로(H) 픽셀 숫자를 모두 입력해 주세요.');
      return;
    }
    cropRatioBtns.forEach((b) => b.classList.remove('active'));
    cropState.ratioMode = 'custom';
    cropState.customRatio = tw / th;
    cropForceExactSize.checked = true;

    if (cropState.img) {
      constrainCropRectToRatio(false);
      updateCropBoxUI();
      showToast(`자르기 틀이 ${tw} : ${th} 비율로 맞춰졌으며, 저장 시 ${tw} × ${th} px로 저장됩니다!`);
    }
  }

  if (applyCropPixelBtn) applyCropPixelBtn.addEventListener('click', applyCustomPixelFrame);
  if (cropForceExactSize) cropForceExactSize.addEventListener('change', updateCropBoxUI);
  if (cropTargetW) cropTargetW.addEventListener('input', updateCropBoxUI);
  if (cropTargetH) cropTargetH.addEventListener('input', updateCropBoxUI);

  // 회전 및 반전 이벤트
  if (rotateLeftBtn) {
    rotateLeftBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.baseRot = (cropState.baseRot + 270) % 360;
      rebuildCropMasterCanvas();
      constrainCropRectToRatio(false);
      updateCropBoxUI();
    });
  }

  if (rotateRightBtn) {
    rotateRightBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.baseRot = (cropState.baseRot + 90) % 360;
      rebuildCropMasterCanvas();
      constrainCropRectToRatio(false);
      updateCropBoxUI();
    });
  }

  if (flipHBtn) {
    flipHBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.flipH *= -1;
      rebuildCropMasterCanvas();
      updateCropBoxUI();
    });
  }

  if (flipVBtn) {
    flipVBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.flipV *= -1;
      rebuildCropMasterCanvas();
      updateCropBoxUI();
    });
  }

  if (cropFineAngle) {
    cropFineAngle.addEventListener('input', () => {
      cropState.fineAngle = parseInt(cropFineAngle.value, 10) || 0;
      cropFineAngleVal.textContent = `${cropState.fineAngle}°`;
      if (cropState.img) {
        rebuildCropMasterCanvas();
        updateCropBoxUI();
      }
    });
  }

  if (resetCropBtn) {
    resetCropBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.baseRot = 0;
      cropState.fineAngle = 0;
      cropState.flipH = 1;
      cropState.flipV = 1;
      cropState.ratioMode = 'full';
      cropRatioBtns.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-ratio') === 'full');
      });
      cropFineAngle.value = '0';
      cropFineAngleVal.textContent = '0°';
      rebuildCropMasterCanvas();
      const mw = cropState.masterCanvas.width;
      const mh = cropState.masterCanvas.height;
      cropState.rect = { x: 0, y: 0, w: mw, h: mh };
      cropTargetW.value = String(mw);
      cropTargetH.value = String(mh);
      updateCropBoxUI();
      showToast('영역, 크기, 회전이 모두 원본으로 초기화되었습니다.');
    });
  }

  // 크롭 박스 마우스/터치 드래그 이동 및 모서리 크기 조절
  let dragAction = null; // { mode: 'move' | 'nw' | 'n' ..., startX, startY, startRect }

  if (cropBox) {
    cropBox.addEventListener('pointerdown', (e) => {
      if (!cropState.img) return;
      e.preventDefault();
      e.stopPropagation();
      const handle = e.target.getAttribute('data-handle');
      dragAction = {
        mode: handle || 'move',
        startX: e.clientX,
        startY: e.clientY,
        startRect: { ...cropState.rect }
      };
      cropBox.setPointerCapture(e.pointerId);
    });

    cropBox.addEventListener('pointermove', (e) => {
      if (!dragAction || !cropState.img) return;
      const scale = cropState.displayScale || 1;
      const dx = (e.clientX - dragAction.startX) / scale;
      const dy = (e.clientY - dragAction.startY) / scale;
      const mw = cropState.masterCanvas.width;
      const mh = cropState.masterCanvas.height;
      const sr = dragAction.startRect;
      const minSize = 20;

      if (dragAction.mode === 'move') {
        cropState.rect.x = Math.min(mw - sr.w, Math.max(0, Math.round(sr.x + dx)));
        cropState.rect.y = Math.min(mh - sr.h, Math.max(0, Math.round(sr.y + dy)));
        updateCropBoxUI();
        return;
      }

      let x = sr.x;
      let y = sr.y;
      let w = sr.w;
      let h = sr.h;
      const mode = dragAction.mode;

      if (mode.includes('e')) w = Math.min(mw - x, Math.max(minSize, sr.w + dx));
      if (mode.includes('s')) h = Math.min(mh - y, Math.max(minSize, sr.h + dy));
      if (mode.includes('w')) {
        const newX = Math.min(sr.x + sr.w - minSize, Math.max(0, sr.x + dx));
        w = sr.w + (sr.x - newX);
        x = newX;
      }
      if (mode.includes('n')) {
        const newY = Math.min(sr.y + sr.h - minSize, Math.max(0, sr.y + dy));
        h = sr.h + (sr.y - newY);
        y = newY;
      }

      const ratio = getActiveAspectRatio();
      if (ratio) {
        if (mode === 'n' || mode === 's') {
          w = h * ratio;
          if (x + w > mw) {
            w = mw - x;
            h = w / ratio;
          }
        } else {
          h = w / ratio;
          if (y + h > mh) {
            h = mh - y;
            w = h * ratio;
          }
        }
      }

      cropState.rect = {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.max(minSize, Math.round(w)),
        h: Math.max(minSize, Math.round(h))
      };
      if (cropState.ratioMode !== 'custom') {
        cropTargetW.value = String(cropState.rect.w);
        cropTargetH.value = String(cropState.rect.h);
      }
      updateCropBoxUI();
    });

    const endCropDrag = () => {
      dragAction = null;
    };
    cropBox.addEventListener('pointerup', endCropDrag);
    cropBox.addEventListener('pointercancel', endCropDrag);
  }

  // 잘라낸 이미지 다운로드
  if (downloadCroppedBtn) {
    downloadCroppedBtn.addEventListener('click', async () => {
      if (!cropState.img) return;
      const r = cropState.rect;
      const tw = parseInt(cropTargetW.value, 10);
      const th = parseInt(cropTargetH.value, 10);
      const useExact = cropForceExactSize.checked && tw > 0 && th > 0;

      const outW = useExact ? tw : Math.max(1, Math.round(r.w));
      const outH = useExact ? th : Math.max(1, Math.round(r.h));

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outW;
      outCanvas.height = outH;
      const ctx = outCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const mime = cropOutputFormat.value || 'image/png';
      const selectedOpt = cropOutputFormat.options[cropOutputFormat.selectedIndex];
      const ext = selectedOpt ? selectedOpt.getAttribute('data-ext') : 'png';

      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }

      ctx.drawImage(
        cropState.masterCanvas,
        r.x,
        r.y,
        r.w,
        r.h,
        0,
        0,
        outW,
        outH
      );

      const blob = await canvasToBlobPromise(outCanvas, mime, 0.94);
      const outName = `${getBaseName(cropState.file.name)}_cropped_${outW}x${outH}.${ext}`;
      triggerDownload(blob, outName);
      showToast(`이미지가 ${outW} × ${outH} px 크기로 저장되었습니다!`);
    });
  }

  /* --------------------------------------------------------------------------
     [6-2] 서브툴 2: 이미지 배경 제거 (AI 자동 누끼 & 스마트 색상/클릭/브러시)
     -------------------------------------------------------------------------- */
  const bgState = {
    file: null,
    width: 0,
    height: 0,
    origData: null, // Uint8ClampedArray 원본 픽셀 복사본
    workData: null, // ImageData 현재 작업본
    activePointerTool: 'wand' // 'wand' | 'erase' | 'restore'
  };

  const bgRemoveDropzone = document.getElementById('bgRemoveDropzone');
  const bgRemoveFileInput = document.getElementById('bgRemoveFileInput');
  const bgStageCard = document.getElementById('bgStageCard');
  const bgEditorCanvas = document.getElementById('bgEditorCanvas');
  const bgImgInfoText = document.getElementById('bgImgInfoText');
  const bgModeGuideText = document.getElementById('bgModeGuideText');
  const runAiBgRemoveBtn = document.getElementById('runAiBgRemoveBtn');
  const aiBgProgressPanel = document.getElementById('aiBgProgressPanel');
  const aiBgProgressText = document.getElementById('aiBgProgressText');
  const aiBgProgressPct = document.getElementById('aiBgProgressPct');
  const bgRemoveModeSelect = document.getElementById('bgRemoveModeSelect');
  const bgTargetColor = document.getElementById('bgTargetColor');
  const bgTargetColorText = document.getElementById('bgTargetColorText');
  const autoCornerBgBtn = document.getElementById('autoCornerBgBtn');
  const bgTolerance = document.getElementById('bgTolerance');
  const bgToleranceVal = document.getElementById('bgToleranceVal');
  const bgFeather = document.getElementById('bgFeather');
  const bgFeatherVal = document.getElementById('bgFeatherVal');
  const runColorBgRemoveBtn = document.getElementById('runColorBgRemoveBtn');
  const bgPointerToolBtns = document.querySelectorAll('#bgPointerToolGrid .chip-btn');
  const bgBrushSizeWrap = document.getElementById('bgBrushSizeWrap');
  const bgBrushSize = document.getElementById('bgBrushSize');
  const bgBrushSizeVal = document.getElementById('bgBrushSizeVal');
  const bgPreviewFill = document.getElementById('bgPreviewFill');
  const downloadBgRemovedBtn = document.getElementById('downloadBgRemovedBtn');
  const restoreOrigBgBtn = document.getElementById('restoreOrigBgBtn');
  const changeBgImgBtn = document.getElementById('changeBgImgBtn');

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  function renderBgEditorCanvas() {
    if (!bgState.workData) return;
    const w = bgState.width;
    const h = bgState.height;
    bgEditorCanvas.width = w;
    bgEditorCanvas.height = h;
    const ctx = bgEditorCanvas.getContext('2d');

    const fillMode = bgPreviewFill ? bgPreviewFill.value : 'transparent';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCanvas.getContext('2d').putImageData(bgState.workData, 0, 0);

    ctx.clearRect(0, 0, w, h);
    if (fillMode !== 'transparent') {
      ctx.fillStyle = fillMode;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(tempCanvas, 0, 0);
  }

  function sampleCornerColorAndSet() {
    if (!bgState.origData) return;
    const r = bgState.origData[0];
    const g = bgState.origData[1];
    const b = bgState.origData[2];
    const hex = rgbToHex(r, g, b);
    bgTargetColor.value = hex.toLowerCase();
    bgTargetColorText.textContent = `지울 배경색 (${hex})`;
  }

  async function loadBgRemoveImage(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('올바른 이미지 파일을 선택해 주세요.');
      return;
    }
    try {
      const img = await loadImageFromFile(file);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      bgState.file = file;
      bgState.width = w;
      bgState.height = h;

      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      bgState.origData = new Uint8ClampedArray(imgData.data);
      bgState.workData = imgData;

      sampleCornerColorAndSet();
      renderBgEditorCanvas();

      bgImgInfoText.textContent = `해상도: ${w} × ${h} px`;
      bgRemoveDropzone.classList.add('hidden');
      bgStageCard.classList.remove('hidden');
      runAiBgRemoveBtn.disabled = false;
      autoCornerBgBtn.disabled = false;
      runColorBgRemoveBtn.disabled = false;
      downloadBgRemovedBtn.disabled = false;
      restoreOrigBgBtn.disabled = false;
      changeBgImgBtn.disabled = false;
      showToast('이미지를 불러왔습니다. AI 자동 제거 또는 배경을 클릭해 투명화하세요!');
    } catch (e) {
      showToast('이미지를 불러올 수 없습니다.');
    }
  }

  if (bgRemoveDropzone) {
    bgRemoveDropzone.addEventListener('click', () => bgRemoveFileInput.click());
    bgRemoveDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      bgRemoveDropzone.classList.add('dragover');
    });
    bgRemoveDropzone.addEventListener('dragleave', () => bgRemoveDropzone.classList.remove('dragover'));
    bgRemoveDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      bgRemoveDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) loadBgRemoveImage(e.dataTransfer.files[0]);
    });
  }

  if (bgRemoveFileInput) {
    bgRemoveFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) loadBgRemoveImage(e.target.files[0]);
      bgRemoveFileInput.value = '';
    });
  }

  if (changeBgImgBtn) {
    changeBgImgBtn.addEventListener('click', () => bgRemoveFileInput.click());
  }

  // 스마트 색상 배경 제거 알고리즘 (Flood-Fill 외곽 연결 제거 & Global 전체 색상 제거 + 소프트 페더링)
  function removeColorFromBg(targetRgb, tolerance, feather, mode, seedPoints) {
    if (!bgState.workData) return;
    const w = bgState.width;
    const h = bgState.height;
    const data = bgState.workData.data;
    const maxDist = tolerance * 1.732; // RGB 유클리드 거리 스케일 보정
    const softRange = Math.max(1, feather * 12);

    function colorDistAt(pixelIdx) {
      const dr = data[pixelIdx] - targetRgb.r;
      const dg = data[pixelIdx + 1] - targetRgb.g;
      const db = data[pixelIdx + 2] - targetRgb.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    if (mode === 'global') {
      for (let i = 0; i < data.length; i += 4) {
        const dist = colorDistAt(i);
        if (dist <= maxDist) {
          data[i + 3] = 0;
        } else if (feather > 0 && dist <= maxDist + softRange) {
          const factor = (dist - maxDist) / softRange;
          data[i + 3] = Math.min(data[i + 3], Math.round(255 * factor));
        }
      }
      renderBgEditorCanvas();
      return;
    }

    // 'flood' 모드: 시작점(모서리 테두리 또는 사용자가 클릭한 좌표)에서 연결된 배경만 제거
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    function pushSeed(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const pos = y * w + x;
      if (visited[pos]) return;
      visited[pos] = 1;
      queue[tail++] = pos;
    }

    if (seedPoints && seedPoints.length > 0) {
      seedPoints.forEach((pt) => pushSeed(pt.x, pt.y));
    } else {
      // 이미지 네 변의 외곽 픽셀들을 시드로 추가
      for (let x = 0; x < w; x++) {
        pushSeed(x, 0);
        pushSeed(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        pushSeed(0, y);
        pushSeed(w - 1, y);
      }
    }

    while (head < tail) {
      const pos = queue[head++];
      const pIdx = pos * 4;
      const dist = colorDistAt(pIdx);

      if (dist <= maxDist) {
        data[pIdx + 3] = 0;
        const x = pos % w;
        const y = (pos - x) / w;
        if (x > 0) pushSeed(x - 1, y);
        if (x < w - 1) pushSeed(x + 1, y);
        if (y > 0) pushSeed(x, y - 1);
        if (y < h - 1) pushSeed(x, y + 1);
      } else if (feather > 0 && dist <= maxDist + softRange) {
        const factor = (dist - maxDist) / softRange;
        data[pIdx + 3] = Math.min(data[pIdx + 3], Math.round(255 * factor));
      }
    }

    renderBgEditorCanvas();
  }

  if (bgTargetColor) {
    bgTargetColor.addEventListener('input', () => {
      bgTargetColorText.textContent = `지울 배경색 (${bgTargetColor.value.toUpperCase()})`;
    });
  }

  if (autoCornerBgBtn) {
    autoCornerBgBtn.addEventListener('click', () => {
      sampleCornerColorAndSet();
      showToast('이미지 모서리 배경색을 추출했습니다.');
    });
  }

  if (bgTolerance) {
    bgTolerance.addEventListener('input', () => {
      bgToleranceVal.textContent = bgTolerance.value;
    });
  }

  if (bgFeather) {
    bgFeather.addEventListener('input', () => {
      bgFeatherVal.textContent = `${bgFeather.value}px`;
    });
  }

  if (runColorBgRemoveBtn) {
    runColorBgRemoveBtn.addEventListener('click', () => {
      if (!bgState.workData) return;
      const rgb = hexToRgb(bgTargetColor.value);
      const tol = parseInt(bgTolerance.value, 10) || 35;
      const fea = parseInt(bgFeather.value, 10) || 2;
      const mode = bgRemoveModeSelect.value;
      removeColorFromBg(rgb, tol, fea, mode, null);
      showToast('선택한 배경색이 투명하게 제거되었습니다!');
    });
  }

  // AI 자동 배경 제거 (브라우저 내장 WebAssembly AI 모델 + 오프라인 스마트 외곽 분리 폴백)
  if (runAiBgRemoveBtn) {
    runAiBgRemoveBtn.addEventListener('click', async () => {
      if (!bgState.file || !bgState.workData) return;
      runAiBgRemoveBtn.disabled = true;
      aiBgProgressPanel.classList.remove('hidden');
      aiBgProgressText.textContent = 'AI 배경 제거 엔진을 불러와 피사체를 분석하는 중입니다...';
      aiBgProgressPct.textContent = '분석 중';

      try {
        // 오픈소스 @imgly/background-removal 브라우저 AI 엔진 동적 로드 시도
        const module = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
        const removeBackground = module.removeBackground || module.default;
        const resultBlob = await removeBackground(bgState.file, {
          progress: (key, current, total) => {
            if (total > 0) {
              const pct = Math.min(99, Math.round((current / total) * 100));
              aiBgProgressPct.textContent = `${pct}%`;
            }
          }
        });

        const resultImg = await loadImageFromFile(resultBlob);
        const tempC = document.createElement('canvas');
        tempC.width = bgState.width;
        tempC.height = bgState.height;
        const tCtx = tempC.getContext('2d');
        tCtx.drawImage(resultImg, 0, 0, bgState.width, bgState.height);
        bgState.workData = tCtx.getImageData(0, 0, bgState.width, bgState.height);
        renderBgEditorCanvas();
        aiBgProgressPanel.classList.add('hidden');
        runAiBgRemoveBtn.disabled = false;
        showToast('AI 배경 제거가 완료되었습니다!');
      } catch (err) {
        // 사내 방화벽 등으로 외부 AI 모델 다운로드가 차단된 경우 내장 멀티코너 스마트 분리 엔진 자동 실행
        aiBgProgressText.textContent = '내장 스마트 외곽 배경 분리 알고리즘으로 처리 중...';
        const w = bgState.width;
        const h = bgState.height;
        const corners = [
          { x: 0, y: 0 },
          { x: w - 1, y: 0 },
          { x: 0, y: h - 1 },
          { x: w - 1, y: h - 1 }
        ];
        const tol = parseInt(bgTolerance.value, 10) || 38;
        const fea = parseInt(bgFeather.value, 10) || 2;
        corners.forEach((pt) => {
          const idx = (pt.y * w + pt.x) * 4;
          const rgb = {
            r: bgState.origData[idx],
            g: bgState.origData[idx + 1],
            b: bgState.origData[idx + 2]
          };
          removeColorFromBg(rgb, tol, fea, 'flood', [pt]);
        });
        aiBgProgressPanel.classList.add('hidden');
        runAiBgRemoveBtn.disabled = false;
        showToast('스마트 외곽 배경 분리가 완료되었습니다! 남은 배경은 마우스로 클릭해 지우세요.');
      }
    });
  }

  // 마우스 클릭(마술봉) 및 지우개/복원 브러시 도구 전환
  bgPointerToolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      bgPointerToolBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      bgState.activePointerTool = btn.getAttribute('data-btool');
      bgBrushSizeWrap.classList.toggle('hidden', bgState.activePointerTool === 'wand');
      if (bgState.activePointerTool === 'wand') {
        bgModeGuideText.textContent = '💡 이미지 위의 지우고 싶은 배경 부분을 마우스로 클릭하면 즉시 투명해집니다!';
      } else if (bgState.activePointerTool === 'erase') {
        bgModeGuideText.textContent = '🧽 이미지 위를 마우스로 문지르면 해당 부분이 지우개처럼 투명하게 지워집니다.';
      } else {
        bgModeGuideText.textContent = '🖌️ 이미지 위를 마우스로 문지르면 지워졌던 원본 이미지가 다시 복원됩니다.';
      }
    });
  });

  if (bgBrushSize) {
    bgBrushSize.addEventListener('input', () => {
      bgBrushSizeVal.textContent = `${bgBrushSize.value}px`;
    });
  }

  if (bgPreviewFill) {
    bgPreviewFill.addEventListener('change', renderBgEditorCanvas);
  }

  // 캔버스 위에서 마우스 클릭(마술봉) 또는 드래그(지우개/복원 브러시) 동작
  let isBgDrawing = false;

  function getCanvasPixelCoords(e) {
    const rect = bgEditorCanvas.getBoundingClientRect();
    const scaleX = bgState.width / rect.width;
    const scaleY = bgState.height / rect.height;
    return {
      x: Math.max(0, Math.min(bgState.width - 1, Math.floor((e.clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(bgState.height - 1, Math.floor((e.clientY - rect.top) * scaleY)))
    };
  }

  function applyBrushAt(cx, cy) {
    if (!bgState.workData || !bgState.origData) return;
    const radius = parseInt(bgBrushSize.value, 10) || 25;
    const w = bgState.width;
    const h = bgState.height;
    const work = bgState.workData.data;
    const orig = bgState.origData;
    const isErase = bgState.activePointerTool === 'erase';
    const rSq = radius * radius;

    const minX = Math.max(0, cx - radius);
    const maxX = Math.min(w - 1, cx + radius);
    const minY = Math.max(0, cy - radius);
    const maxY = Math.min(h - 1, cy + radius);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rSq) {
          const idx = (y * w + x) * 4;
          if (isErase) {
            work[idx + 3] = 0;
          } else {
            work[idx] = orig[idx];
            work[idx + 1] = orig[idx + 1];
            work[idx + 2] = orig[idx + 2];
            work[idx + 3] = orig[idx + 3];
          }
        }
      }
    }
    renderBgEditorCanvas();
  }

  if (bgEditorCanvas) {
    bgEditorCanvas.addEventListener('pointerdown', (e) => {
      if (!bgState.workData) return;
      const pt = getCanvasPixelCoords(e);

      if (bgState.activePointerTool === 'wand') {
        const idx = (pt.y * bgState.width + pt.x) * 4;
        const clickedRgb = {
          r: bgState.workData.data[idx],
          g: bgState.workData.data[idx + 1],
          b: bgState.workData.data[idx + 2]
        };
        const hex = rgbToHex(clickedRgb.r, clickedRgb.g, clickedRgb.b);
        bgTargetColor.value = hex.toLowerCase();
        bgTargetColorText.textContent = `지울 배경색 (${hex})`;

        const tol = parseInt(bgTolerance.value, 10) || 35;
        const fea = parseInt(bgFeather.value, 10) || 2;
        const mode = bgRemoveModeSelect.value;
        removeColorFromBg(clickedRgb, tol, fea, mode, [pt]);
        return;
      }

      isBgDrawing = true;
      bgEditorCanvas.setPointerCapture(e.pointerId);
      applyBrushAt(pt.x, pt.y);
    });

    bgEditorCanvas.addEventListener('pointermove', (e) => {
      if (!isBgDrawing || !bgState.workData) return;
      const pt = getCanvasPixelCoords(e);
      applyBrushAt(pt.x, pt.y);
    });

    const stopBgDrawing = () => {
      isBgDrawing = false;
    };
    bgEditorCanvas.addEventListener('pointerup', stopBgDrawing);
    bgEditorCanvas.addEventListener('pointercancel', stopBgDrawing);
  }

  if (restoreOrigBgBtn) {
    restoreOrigBgBtn.addEventListener('click', () => {
      if (!bgState.origData || !bgState.workData) return;
      bgState.workData.data.set(bgState.origData);
      renderBgEditorCanvas();
      showToast('원본 이미지 상태로 복원되었습니다.');
    });
  }

  if (downloadBgRemovedBtn) {
    downloadBgRemovedBtn.addEventListener('click', async () => {
      if (!bgState.workData) return;
      renderBgEditorCanvas();
      const blob = await canvasToBlobPromise(bgEditorCanvas, 'image/png');
      const outName = `${getBaseName(bgState.file.name)}_nobg.png`;
      triggerDownload(blob, outName);
      showToast('배경 제거된 PNG 파일이 다운로드되었습니다!');
    });
  }

  // 이미지 편집 탭에서도 Ctrl+V 클립보드 붙여넣기 지원
  window.addEventListener('paste', (e) => {
    if (activeTabId !== 'img-edit') return;
    if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) return;
    const file = e.clipboardData.files[0];
    if (activeEditSubtool === 'crop') {
      loadCropImage(file);
    } else {
      loadBgRemoveImage(file);
    }
  });
})();

