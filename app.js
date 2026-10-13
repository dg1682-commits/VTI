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

  let lastToastMsg = '';
  let lastToastTime = 0;

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container || !message) return;

    const now = Date.now();
    if (message === lastToastMsg && now - lastToastTime < 2200) {
      return;
    }
    lastToastMsg = message;
    lastToastTime = now;

    // 기존에 떠 있는 토스트가 많으면 정리하여 화면에 1개만 깔끔하게 표시
    while (container.children.length >= 1) {
      container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2600);
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

  function setupDropzone(dropzoneEl, inputEl, onFilesSelected) {
    if (!dropzoneEl || !inputEl) return;
    dropzoneEl.addEventListener('click', (e) => {
      if (e.target === inputEl) return;
      inputEl.click();
    });
    dropzoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('dragover');
    });
    dropzoneEl.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('dragover');
    });
    dropzoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    });
    inputEl.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
      }
      inputEl.value = '';
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

  // 상단 3대 대분류(이미지 / 동영상 / 유튜브) 및 마우스 오버 하위 메뉴 전환
  const tabPanels = document.querySelectorAll('.tab-panel');
  const navDropdownItems = document.querySelectorAll('.nav-dropdown-item');
  const navTriggerImage = document.getElementById('navTriggerImage');
  const navTriggerVideo = document.getElementById('navTriggerVideo');
  const navTriggerYt = document.getElementById('navTriggerYt');
  const navImageCurrentLabel = document.getElementById('navImageCurrentLabel');
  const navVideoCurrentLabel = document.getElementById('navVideoCurrentLabel');

  let activeTabId = 'img-compress';
  let lastImageTarget = 'img-compress';
  let lastVideoTarget = 'video-compress';

  function switchTab(navTarget) {
    activeTabId = navTarget;

    const isImageGroup = navTarget.startsWith('img-');
    const isVideoGroup = navTarget.startsWith('video-');
    const isYt = navTarget === 'yt-download';

    if (isImageGroup) {
      lastImageTarget = navTarget;
      const labelMap = {
        'img-compress': '압축',
        'img-convert': '변환',
        'img-crop': '자르기/리사이즈',
        'img-bgremove': '배경제거'
      };
      if (navImageCurrentLabel && labelMap[navTarget]) {
        navImageCurrentLabel.textContent = labelMap[navTarget];
      }
    } else if (isVideoGroup) {
      lastVideoTarget = navTarget;
      const labelMap = {
        'video-compress': '압축',
        'video-gif': '컷편집/GIF',
        'video-convert': '확장자 변환'
      };
      if (navVideoCurrentLabel && labelMap[navTarget]) {
        navVideoCurrentLabel.textContent = labelMap[navTarget];
      }
    }

    if (navTriggerImage) navTriggerImage.classList.toggle('active', isImageGroup);
    if (navTriggerVideo) navTriggerVideo.classList.toggle('active', isVideoGroup);
    if (navTriggerYt) navTriggerYt.classList.toggle('active', isYt);

    navDropdownItems.forEach((item) => {
      item.classList.toggle('active', item.getAttribute('data-nav-target') === navTarget);
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `tab-${navTarget}`);
    });
  }

  navDropdownItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = item.getAttribute('data-nav-target');
      if (target) switchTab(target);
      // 클릭 직후 드롭다운이 깔끔하게 닫히도록 포커스 해제
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    });
  });

  if (navTriggerImage) {
    navTriggerImage.addEventListener('click', () => switchTab(lastImageTarget));
  }
  if (navTriggerVideo) {
    navTriggerVideo.addEventListener('click', () => switchTab(lastVideoTarget));
  }
  if (navTriggerYt) {
    navTriggerYt.addEventListener('click', () => switchTab('yt-download'));
  }

  const brandLogo = document.getElementById('brandLogo');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => switchTab('img-compress'));
  }

  // 스튜디오 공사 중 모달 이벤트
  const devNoticeModal = document.getElementById('devNoticeModal');
  const closeDevModalBtn = document.getElementById('closeDevModalBtn');
  const closeDevModalBtn2 = document.getElementById('closeDevModalBtn2');
  const devModalTitle = document.getElementById('devModalTitle');
  const devModalSubtitle = document.getElementById('devModalSubtitle');
  const studioUnderDevLinks = document.querySelectorAll('.studio-under-dev');

  function openDevModal(type) {
    if (!devNoticeModal) return;
    if (type === 'video') {
      devModalTitle.textContent = '🎬 영상 스튜디오 엔진 고도화 중';
      devModalSubtitle.textContent = '웹 캡컷급 멀티트랙 NLE 엔진을 위해 현재 공사 중입니다!';
    } else if (type === 'audio') {
      devModalTitle.textContent = '🎹 오디오 스튜디오 엔진 고도화 중';
      devModalSubtitle.textContent = '웹 FL스튜디오급 신스 & DAW 엔진을 위해 현재 공사 중입니다!';
    }
    devNoticeModal.style.display = 'flex';
  }

  function closeDevModal() {
    if (devNoticeModal) devNoticeModal.style.display = 'none';
  }

  studioUnderDevLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const type = link.getAttribute('data-dev-target');
      openDevModal(type);
    });
  });

  if (closeDevModalBtn) closeDevModalBtn.addEventListener('click', closeDevModal);
  if (closeDevModalBtn2) closeDevModalBtn2.addEventListener('click', closeDevModal);
  if (devNoticeModal) {
    devNoticeModal.addEventListener('click', (e) => {
      if (e.target === devNoticeModal) closeDevModal();
    });
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
  const presetChips = document.querySelectorAll('#tab-img-compress .preset-chips .chip-btn');

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

  // 움직이는 GIF(움짤) 애니메이션 유지 압축기 (ImageDecoder + 팔레트 스냅 양자화 + 프레임 다이어트 + LZW 인코딩)
  async function compressAnimatedGifFile(file, targetW, targetH, qualityNum, scaleOption) {
    const outW = Math.max(16, Math.min(1920, targetW));
    const outH = Math.max(16, Math.min(1920, targetH));

    // 단일 패스 GIF 인코딩 헬퍼
    const encodeGifPass = async (frames, snapStep, ditherScale, frameStride) => {
      const workCanvas = document.createElement('canvas');
      workCanvas.width = outW;
      workCanvas.height = outH;
      const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
      workCtx.imageSmoothingEnabled = true;
      workCtx.imageSmoothingQuality = 'high';

      const chunks = [];
      chunks.push(
        new Uint8Array([
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
          outW & 0xff, (outW >> 8) & 0xff,
          outH & 0xff, (outH >> 8) & 0xff,
          0xf7, 0x00, 0x00,
        ])
      );
      chunks.push(GIF_GLOBAL_PALETTE);
      chunks.push(
        new Uint8Array([
          0x21, 0xff, 0x0b,
          0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
          0x03, 0x01, 0x00, 0x00, 0x00,
        ])
      );

      const indicesBuf = new Uint8Array(outW * outH);
      const trieBuffer = new Int32Array(4096 * 256);

      for (let i = 0; i < frames.length; i += frameStride) {
        let combinedDurationUs = 0;
        for (let k = i; k < Math.min(frames.length, i + frameStride); k++) {
          combinedDurationUs += frames[k].durationUs || 80000;
        }
        const delayCs = Math.max(2, Math.round(combinedDurationUs / 10000));

        workCtx.clearRect(0, 0, outW, outH);
        workCtx.drawImage(frames[i].bitmap, 0, 0, outW, outH);
        const imgData = workCtx.getImageData(0, 0, outW, outH);
        const rgba = imgData.data;

        // 품질(qualityNum)에 맞춰 인접 픽셀 색상을 정리해 LZW 압축률을 극대화
        let p = 0;
        for (let y = 0; y < outH; y++) {
          const bayerRow = BAYER_4X4[y & 3];
          for (let x = 0; x < outW; x++) {
            const i4 = p << 2;
            const dither = Math.round(bayerRow[x & 3] * ditherScale);
            let r = Math.max(0, Math.min(255, rgba[i4] + dither));
            let g = Math.max(0, Math.min(255, rgba[i4 + 1] + dither));
            let b = Math.max(0, Math.min(255, rgba[i4 + 2] + dither));

            if (snapStep > 1) {
              r = Math.min(255, Math.round(r / snapStep) * snapStep);
              g = Math.min(255, Math.round(g / snapStep) * snapStep);
              b = Math.min(255, Math.round(b / snapStep) * snapStep);
            }

            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            const rq = Math.round(r / 51);
            const gq = Math.round(g / 51);
            const bq = Math.round(b / 51);
            const cubeIdx = rq * 36 + gq * 6 + bq;

            if (maxDiff <= 10) {
              const lum = (r + g + b) / 3;
              const gStep = Math.max(0, Math.min(39, Math.floor((lum / 256) * 40)));
              indicesBuf[p] = 216 + gStep;
            } else {
              indicesBuf[p] = cubeIdx;
            }
            p++;
          }
        }

        const compressedBlock = lzwEncodeGifFrame(indicesBuf, trieBuffer);
        const frameHeader = new Uint8Array([
          0x21, 0xf9, 0x04, 0x04,
          delayCs & 0xff, (delayCs >> 8) & 0xff,
          0x00, 0x00,
          0x2c,
          0x00, 0x00, 0x00, 0x00,
          outW & 0xff, (outW >> 8) & 0xff,
          outH & 0xff, (outH >> 8) & 0xff,
          0x00,
        ]);
        chunks.push(frameHeader);
        chunks.push(compressedBlock);
      }

      chunks.push(new Uint8Array([0x3b]));
      return new Blob(chunks, { type: 'image/gif' });
    };

    const decodedFrames = [];
    try {
      if (typeof window.ImageDecoder === 'function') {
        const buf = await file.arrayBuffer();
        const decoder = new window.ImageDecoder({ data: buf, type: 'image/gif' });
        await decoder.tracks.ready;
        const track = decoder.tracks.selectedTrack;
        const totalFrames = Math.min(240, (track && track.frameCount) || 1);

        // 합성용 캔버스 (투명/부분 갱신 프레임 처리)
        const compCanvas = document.createElement('canvas');
        compCanvas.width = outW;
        compCanvas.height = outH;
        const compCtx = compCanvas.getContext('2d');

        for (let f = 0; f < totalFrames; f++) {
          const res = await decoder.decode({ frameIndex: f });
          const vf = res.image;
          const durationUs = vf.duration || 80000;
          compCtx.drawImage(vf, 0, 0, outW, outH);
          vf.close();

          const frameCopy = document.createElement('canvas');
          frameCopy.width = outW;
          frameCopy.height = outH;
          frameCopy.getContext('2d').drawImage(compCanvas, 0, 0);
          decodedFrames.push({ bitmap: frameCopy, durationUs });
        }
        decoder.close();
      }
    } catch (_) {
      // ImageDecoder 미지원 또는 디코딩 예외 시 단일 이미지 폴백
    }

    if (decodedFrames.length === 0) {
      const img = await loadImageFromFile(file);
      decodedFrames.push({ bitmap: img, durationUs: 100000 });
    }

    // 품질 설정에 따른 1차 파라미터
    const snap1 = qualityNum >= 85 ? 6 : qualityNum >= 65 ? 18 : qualityNum >= 45 ? 30 : 42;
    const dither1 = qualityNum >= 85 ? 0.65 : qualityNum >= 65 ? 0.2 : 0.0;
    const stride1 =
      decodedFrames.length >= 14 && qualityNum <= 45
        ? 3
        : decodedFrames.length >= 12 && qualityNum <= 68
        ? 2
        : 1;

    let resultBlob = await encodeGifPass(decodedFrames, snap1, dither1, stride1);

    // 만약 1차 압축 결과가 원본보다 크거나 비슷하면 자동으로 2차 다이어트(프레임/색상 추가 최적화) 수행
    if (resultBlob.size >= file.size * 0.96 && decodedFrames.length > 2) {
      const stride2 = Math.min(3, Math.max(2, stride1 + 1));
      const smallerBlob = await encodeGifPass(decodedFrames, Math.max(snap1, 32), 0.0, stride2);
      if (smallerBlob.size < resultBlob.size) {
        resultBlob = smallerBlob;
      }
    }

    // 해상도를 유지('1')했는데도 원본 GIF가 이미 극한 압축본이어서 용량이 줄지 않은 경우 원본 보존
    if (scaleOption === '1' && resultBlob.size >= file.size && file.type === 'image/gif') {
      return file;
    }
    return resultBlob;
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

    const isGifInput = item.file.type === 'image/gif' || /\.gif$/i.test(item.file.name);

    // 원본이 GIF이고 (스마트/원본유지/GIF유지) 옵션이거나, 출력 포맷을 명시적으로 GIF로 지정한 경우 -> 애니메이션 유지 GIF 압축
    if (
      formatOption === 'image/gif' ||
      (isGifInput && (formatOption === 'smart' || formatOption === 'keep'))
    ) {
      const gifBlob = await compressAnimatedGifFile(item.file, width, height, qualityNum, scaleOption);
      item.compressedBlob = gifBlob;
      item.outputExt = 'gif';
      return;
    }

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
  const subtoolBtns = document.querySelectorAll('#editSubtoolSwitcher .subtool-btn');

  subtoolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-subtool');
      switchTab(sub === 'bgremove' ? 'img-bgremove' : 'img-crop');
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
    userTypedSize: false, // 사용자가 직접 저장할 픽셀 크기를 입력했는지 여부
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
    const mw = cropState.masterCanvas.width || 1;
    const mh = cropState.masterCanvas.height || 1;
    const r = cropState.rect;

    // 퍼센트(%) 기반 배치로 어떤 해상도/창 크기에서도 이미지 전체(100%)에 빈틈없이 꽉 차도록 설정
    const leftPct = Math.max(0, Math.min(100, (r.x / mw) * 100));
    const topPct = Math.max(0, Math.min(100, (r.y / mh) * 100));
    const widthPct = Math.max(1, Math.min(100 - leftPct, (r.w / mw) * 100));
    const heightPct = Math.max(1, Math.min(100 - topPct, (r.h / mh) * 100));

    cropBox.style.left = `${leftPct}%`;
    cropBox.style.top = `${topPct}%`;
    cropBox.style.width = `${widthPct}%`;
    cropBox.style.height = `${heightPct}%`;

    const selW = Math.max(1, Math.round(r.w));
    const selH = Math.max(1, Math.round(r.h));

    const tw = parseInt(cropTargetW.value, 10);
    const th = parseInt(cropTargetH.value, 10);
    const useExact = cropForceExactSize && cropForceExactSize.checked;
    const finalW = useExact && tw > 0 ? tw : selW;
    const finalH = useExact && th > 0 ? th : selH;

    cropSizeFloating.textContent = `${finalW} × ${finalH} px`;
    cropOrigInfo.textContent = `원본: ${mw} × ${mh} px`;
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
      cropState.customRatio = null;
      cropState.userTypedSize = false;
      cropRatioBtns.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-ratio') === 'full');
      });
      cropFineAngle.value = '0';
      cropFineAngleVal.textContent = '0°';

      cropDropzone.classList.add('hidden');
      cropStageCard.classList.remove('hidden');

      rebuildCropMasterCanvas();
      const mw = cropState.masterCanvas.width;
      const mh = cropState.masterCanvas.height;
      // 초기 영역: 이미지 전체 100% 꽉 차게 선택 + 입력칸에 원본 해상도 자동 표시
      cropState.rect = { x: 0, y: 0, w: mw, h: mh };
      cropTargetW.value = String(mw);
      cropTargetH.value = String(mh);
      updateCropBoxUI();

      downloadCroppedBtn.disabled = false;
      resetCropBtn.disabled = false;
      changeCropImgBtn.disabled = false;
      showToast(`이미지를 불러왔습니다 (${mw}×${mh} px). 원하는 픽셀 크기를 입력하거나 틀을 조절하세요!`);
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

  // 비율 버튼 클릭 (전체(안 자름) 클릭 시 전체 이미지 100% 꽉 차게 선택)
  cropRatioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      cropRatioBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      cropState.ratioMode = btn.getAttribute('data-ratio');
      cropState.customRatio = null;
      cropState.userTypedSize = false;
      if (cropState.img) {
        constrainCropRectToRatio(false);
        cropTargetW.value = String(Math.round(cropState.rect.w));
        cropTargetH.value = String(Math.round(cropState.rect.h));
        updateCropBoxUI();
      }
    });
  });

  // 가로(W) 또는 세로(H) 입력 시 자르기 틀 비율 및 최종 저장 크기 즉시 반영
  function handlePixelInputChange(changedAxis) {
    const mw = cropState.masterCanvas.width || 1;
    const mh = cropState.masterCanvas.height || 1;
    let tw = parseInt(cropTargetW.value, 10);
    let th = parseInt(cropTargetH.value, 10);

    cropState.userTypedSize = true;
    if (cropForceExactSize && !cropForceExactSize.checked) {
      cropForceExactSize.checked = true;
    }

    if (cropKeepAspectInput && cropKeepAspectInput.checked) {
      const baseW = cropState.rect.w || mw;
      const baseH = cropState.rect.h || mh;
      if (changedAxis === 'w' && tw > 0 && baseW > 0) {
        th = Math.max(1, Math.round(tw * (baseH / baseW)));
        cropTargetH.value = String(th);
      } else if (changedAxis === 'h' && th > 0 && baseH > 0) {
        tw = Math.max(1, Math.round(th * (baseW / baseH)));
        cropTargetW.value = String(tw);
      }
    }

    if (cropState.img && tw > 0 && th > 0) {
      // 입력한 가로:세로 비율에 맞춰 자르기 틀(Crop Box) 비율도 자동으로 맞춤
      cropState.customRatio = tw / th;
      cropState.ratioMode = 'custom';
      const isFullImageRatio = Math.abs(tw / th - mw / mh) < 0.005;
      cropRatioBtns.forEach((b) => {
        b.classList.toggle('active', isFullImageRatio && b.getAttribute('data-ratio') === 'full');
      });
      constrainCropRectToRatio(false);
    }

    updateCropBoxUI();
  }

  if (cropTargetW) {
    cropTargetW.addEventListener('input', () => handlePixelInputChange('w'));
  }

  if (cropTargetH) {
    cropTargetH.addEventListener('input', () => handlePixelInputChange('h'));
  }

  if (cropForceExactSize) {
    cropForceExactSize.addEventListener('change', () => {
      if (cropForceExactSize.checked && cropState.img) {
        const tw = parseInt(cropTargetW.value, 10);
        const th = parseInt(cropTargetH.value, 10);
        if (tw > 0 && th > 0) {
          cropState.userTypedSize = true;
          cropState.customRatio = tw / th;
          cropState.ratioMode = 'custom';
          constrainCropRectToRatio(false);
        }
      }
      updateCropBoxUI();
    });
  }

  // 회전 및 반전 이벤트
  if (rotateLeftBtn) {
    rotateLeftBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.baseRot = (cropState.baseRot + 270) % 360;
      rebuildCropMasterCanvas();
      constrainCropRectToRatio(false);
      if (!cropState.userTypedSize) {
        cropTargetW.value = String(Math.round(cropState.rect.w));
        cropTargetH.value = String(Math.round(cropState.rect.h));
      }
      updateCropBoxUI();
    });
  }

  if (rotateRightBtn) {
    rotateRightBtn.addEventListener('click', () => {
      if (!cropState.img) return;
      cropState.baseRot = (cropState.baseRot + 90) % 360;
      rebuildCropMasterCanvas();
      constrainCropRectToRatio(false);
      if (!cropState.userTypedSize) {
        cropTargetW.value = String(Math.round(cropState.rect.w));
        cropTargetH.value = String(Math.round(cropState.rect.h));
      }
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
      cropState.customRatio = null;
      cropState.userTypedSize = false;
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
      const mw = cropState.masterCanvas.width || 1;
      const mh = cropState.masterCanvas.height || 1;
      const canvasRect = cropPreviewCanvas.getBoundingClientRect();
      const scaleX = (canvasRect.width || cropPreviewCanvas.width) / mw;
      const scaleY = (canvasRect.height || cropPreviewCanvas.height) / mh;

      const dx = (e.clientX - dragAction.startX) / scaleX;
      const dy = (e.clientY - dragAction.startY) / scaleY;
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

      // 사용자가 직접 입력한 고정 픽셀 크기가 없을 때만 선택 영역 크기를 입력칸에 동기화
      if (!cropState.userTypedSize || !(cropForceExactSize && cropForceExactSize.checked)) {
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
      const useExact = cropForceExactSize && cropForceExactSize.checked;

      const outW = useExact && tw > 0 ? tw : Math.max(1, Math.round(r.w));
      const outH = useExact && th > 0 ? th : Math.max(1, Math.round(r.h));

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
    activePointerTool: 'wand', // 'wand' | 'erase' | 'restore' | 'pan'
    zoom: 1, // 0.5 ~ 8.0 (50% ~ 800%)
    panX: 0,
    panY: 0,
    undoStack: [], // 이전 작업 스냅샷 (Uint8ClampedArray 최대 20단계)
    redoStack: [] // 다시 실행 스냅샷
  };

  const MAX_BG_HISTORY = 20;

  const bgRemoveDropzone = document.getElementById('bgRemoveDropzone');
  const bgRemoveFileInput = document.getElementById('bgRemoveFileInput');
  const bgStageCard = document.getElementById('bgStageCard');
  const bgCanvasViewport = document.getElementById('bgCanvasViewport');
  const bgEditorCanvas = document.getElementById('bgEditorCanvas');
  const bgBrushCursor = document.getElementById('bgBrushCursor');
  const bgZoomOutBtn = document.getElementById('bgZoomOutBtn');
  const bgZoomInBtn = document.getElementById('bgZoomInBtn');
  const bgZoomResetBtn = document.getElementById('bgZoomResetBtn');
  const bgZoomValText = document.getElementById('bgZoomValText');
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
  const undoBgBtn = document.getElementById('undoBgBtn');
  const redoBgBtn = document.getElementById('redoBgBtn');
  const undoBgTopBtn = document.getElementById('undoBgTopBtn');
  const redoBgTopBtn = document.getElementById('redoBgTopBtn');
  const restoreOrigBgBtn = document.getElementById('restoreOrigBgBtn');
  const changeBgImgBtn = document.getElementById('changeBgImgBtn');

  function applyBgZoomTransform() {
    if (!bgEditorCanvas) return;
    bgEditorCanvas.style.transform = `translate3d(${bgState.panX}px, ${bgState.panY}px, 0) scale(${bgState.zoom})`;
    bgEditorCanvas.classList.toggle('zoomed-pixelated', bgState.zoom >= 2);
    if (bgZoomValText) {
      bgZoomValText.textContent = `${Math.round(bgState.zoom * 100)}%`;
    }
  }

  function resetBgZoom() {
    bgState.zoom = 1;
    bgState.panX = 0;
    bgState.panY = 0;
    applyBgZoomTransform();
  }

  function zoomBgAtPoint(targetZoom, clientX, clientY) {
    if (!bgCanvasViewport || !bgState.workData) return;
    let nextZoom = Math.max(0.5, Math.min(8, targetZoom));
    if (Math.abs(nextZoom - 1) < 0.04) nextZoom = 1;

    const vpRect = bgCanvasViewport.getBoundingClientRect();
    const vpCenterX = vpRect.left + vpRect.width / 2;
    const vpCenterY = vpRect.top + vpRect.height / 2;

    const anchorX = typeof clientX === 'number' ? clientX : vpCenterX;
    const anchorY = typeof clientY === 'number' ? clientY : vpCenterY;

    const relX = anchorX - vpCenterX;
    const relY = anchorY - vpCenterY;
    const ratio = nextZoom / (bgState.zoom || 1);

    if (nextZoom <= 1) {
      bgState.panX = 0;
      bgState.panY = 0;
    } else {
      const rawPanX = relX - (relX - bgState.panX) * ratio;
      const rawPanY = relY - (relY - bgState.panY) * ratio;
      const maxPanX = vpRect.width * nextZoom * 0.65;
      const maxPanY = vpRect.height * nextZoom * 0.65;
      bgState.panX = Math.max(-maxPanX, Math.min(maxPanX, rawPanX));
      bgState.panY = Math.max(-maxPanY, Math.min(maxPanY, rawPanY));
    }

    bgState.zoom = nextZoom;
    applyBgZoomTransform();
  }

  function updateBgHistoryBtns() {
    const canUndo = Boolean(bgState.workData && bgState.undoStack.length > 0);
    const canRedo = Boolean(bgState.workData && bgState.redoStack.length > 0);
    if (undoBgBtn) {
      undoBgBtn.disabled = !canUndo;
      undoBgBtn.textContent = canUndo
        ? `↩️ 실행 취소 (${bgState.undoStack.length})`
        : '↩️ 실행 취소 (Ctrl+Z)';
    }
    if (redoBgBtn) {
      redoBgBtn.disabled = !canRedo;
      redoBgBtn.textContent = canRedo
        ? `↪️ 다시 실행 (${bgState.redoStack.length})`
        : '↪️ 다시 실행 (Ctrl+Y)';
    }
    if (undoBgTopBtn) undoBgTopBtn.disabled = !canUndo;
    if (redoBgTopBtn) redoBgTopBtn.disabled = !canRedo;
  }

  function pushBgHistory() {
    if (!bgState.workData) return;
    bgState.undoStack.push(new Uint8ClampedArray(bgState.workData.data));
    if (bgState.undoStack.length > MAX_BG_HISTORY) {
      bgState.undoStack.shift();
    }
    bgState.redoStack = [];
    updateBgHistoryBtns();
  }

  function undoBgAction() {
    if (!bgState.workData || bgState.undoStack.length === 0) return;
    bgState.redoStack.push(new Uint8ClampedArray(bgState.workData.data));
    const prevSnapshot = bgState.undoStack.pop();
    bgState.workData = new ImageData(new Uint8ClampedArray(prevSnapshot), bgState.width, bgState.height);
    renderBgEditorCanvas();
    updateBgHistoryBtns();
    showToast('↩️ 이전 작업 상태로 되돌렸습니다. (Ctrl+Z)');
  }

  function redoBgAction() {
    if (!bgState.workData || bgState.redoStack.length === 0) return;
    bgState.undoStack.push(new Uint8ClampedArray(bgState.workData.data));
    const nextSnapshot = bgState.redoStack.pop();
    bgState.workData = new ImageData(new Uint8ClampedArray(nextSnapshot), bgState.width, bgState.height);
    renderBgEditorCanvas();
    updateBgHistoryBtns();
    showToast('↪️ 작업을 다시 실행했습니다. (Ctrl+Y)');
  }

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
      bgState.undoStack = [];
      bgState.redoStack = [];
      updateBgHistoryBtns();

      sampleCornerColorAndSet();
      renderBgEditorCanvas();
      resetBgZoom();

      bgImgInfoText.textContent = `해상도: ${w} × ${h} px`;
      bgRemoveDropzone.classList.add('hidden');
      bgStageCard.classList.remove('hidden');
      runAiBgRemoveBtn.disabled = false;
      autoCornerBgBtn.disabled = false;
      runColorBgRemoveBtn.disabled = false;
      downloadBgRemovedBtn.disabled = false;
      restoreOrigBgBtn.disabled = false;
      changeBgImgBtn.disabled = false;
      showToast('이미지를 불러왔습니다. 프레임 안에서 마우스 휠로 줌인/아웃하며 정밀하게 누끼를 따보세요!');
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
      pushBgHistory();
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
        pushBgHistory();
        bgState.workData = tCtx.getImageData(0, 0, bgState.width, bgState.height);
        renderBgEditorCanvas();
        aiBgProgressPanel.classList.add('hidden');
        runAiBgRemoveBtn.disabled = false;
        showToast('AI 배경 제거가 완료되었습니다!');
      } catch (err) {
        // 사내 방화벽 등으로 외부 AI 모델 다운로드가 차단된 경우 내장 멀티코너 스마트 분리 엔진 자동 실행
        aiBgProgressText.textContent = '내장 스마트 외곽 배경 분리 알고리즘으로 처리 중...';
        pushBgHistory();
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

  // 마우스 클릭(마술봉), 지우개/복원 브러시, 화면 이동 도구 전환
  bgPointerToolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      bgPointerToolBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      bgState.activePointerTool = btn.getAttribute('data-btool');
      const isBrush = bgState.activePointerTool === 'erase' || bgState.activePointerTool === 'restore';
      bgBrushSizeWrap.classList.toggle('hidden', !isBrush);
      if (bgCanvasViewport) {
        bgCanvasViewport.classList.toggle('pan-mode', bgState.activePointerTool === 'pan');
      }
      if (!isBrush && bgBrushCursor) {
        bgBrushCursor.classList.add('hidden');
      }
      if (bgState.activePointerTool === 'wand') {
        bgModeGuideText.textContent = '💡 마우스 휠로 줌인/아웃 후 지우고 싶은 배경 픽셀을 클릭하면 즉시 투명해집니다! (Ctrl+Z 취소)';
      } else if (bgState.activePointerTool === 'erase') {
        bgModeGuideText.textContent = '🧽 마우스 휠로 확대한 뒤 세밀한 경계를 문질러 지우개처럼 투명하게 다듬으세요. (우클릭 드래그: 이동)';
      } else if (bgState.activePointerTool === 'restore') {
        bgModeGuideText.textContent = '🖌️ 마우스 휠로 확대한 뒤 지워졌던 원본 부분을 문질러 정밀하게 복원하세요. (우클릭 드래그: 이동)';
      } else {
        bgModeGuideText.textContent = '✋ 이미지를 마우스로 잡고 원하는 위치로 이동하세요. (마우스 휠: 줌인/줌아웃)';
      }
    });
  });

  function updateBgBrushCursor(clientX, clientY) {
    if (!bgBrushCursor || !bgEditorCanvas || !bgState.workData) return;
    const isBrush = bgState.activePointerTool === 'erase' || bgState.activePointerTool === 'restore';
    if (!isBrush || isBgPanning || isBgSpaceDown) {
      bgBrushCursor.classList.add('hidden');
      return;
    }
    const rect = bgEditorCanvas.getBoundingClientRect();
    if (!rect.width || !bgState.width) return;
    const radiusPx = parseInt(bgBrushSize ? bgBrushSize.value : '20', 10) || 20;
    const screenScale = rect.width / bgState.width;
    const diameterOnScreen = Math.max(4, radiusPx * 2 * screenScale);

    bgBrushCursor.style.width = `${diameterOnScreen}px`;
    bgBrushCursor.style.height = `${diameterOnScreen}px`;
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      bgBrushCursor.style.left = `${clientX}px`;
      bgBrushCursor.style.top = `${clientY}px`;
      bgBrushCursor.classList.remove('hidden');
    }
  }

  if (bgBrushSize) {
    bgBrushSize.addEventListener('input', () => {
      bgBrushSizeVal.textContent = `${bgBrushSize.value}px`;
      updateBgBrushCursor();
    });
  }

  if (bgPreviewFill) {
    bgPreviewFill.addEventListener('change', renderBgEditorCanvas);
  }

  // 이미지 프레임(#bgCanvasViewport) 내부에서만 마우스 휠로 줌인 / 줌아웃 작동 (페이지 스크롤 차단)
  if (bgCanvasViewport) {
    bgCanvasViewport.addEventListener(
      'wheel',
      (e) => {
        if (!bgState.workData) return;
        e.preventDefault();
        e.stopPropagation();
        const zoomFactor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
        zoomBgAtPoint(bgState.zoom * zoomFactor, e.clientX, e.clientY);
        updateBgBrushCursor(e.clientX, e.clientY);
      },
      { passive: false }
    );

    // 우클릭 드래그 이동을 위해 프레임 내부 우클릭 메뉴 방지
    bgCanvasViewport.addEventListener('contextmenu', (e) => {
      if (bgState.workData) e.preventDefault();
    });

    bgCanvasViewport.addEventListener('pointerleave', () => {
      if (bgBrushCursor) bgBrushCursor.classList.add('hidden');
    });
  }

  if (bgZoomInBtn) {
    bgZoomInBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomBgAtPoint(bgState.zoom * 1.25);
    });
  }

  if (bgZoomOutBtn) {
    bgZoomOutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomBgAtPoint(bgState.zoom / 1.25);
    });
  }

  if (bgZoomResetBtn) {
    bgZoomResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetBgZoom();
    });
  }

  // 스페이스바 누른 채 드래그 시에도 화면 이동(Pan) 지원
  let isBgSpaceDown = false;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && bgState.workData && activeTabId === 'img-bgremove') {
      const tag = (e.target && e.target.tagName ? e.target.tagName : '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && tag !== 'button') {
        isBgSpaceDown = true;
        if (bgCanvasViewport) bgCanvasViewport.classList.add('pan-mode');
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      isBgSpaceDown = false;
      if (bgCanvasViewport && bgState.activePointerTool !== 'pan') {
        bgCanvasViewport.classList.remove('pan-mode');
      }
    }
  });

  // 캔버스 위에서 마우스 클릭(마술봉), 드래그(지우개/복원 브러시), 또는 화면 이동(Pan) 동작
  let isBgDrawing = false;
  let lastBrushPt = null;
  let isBgPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;

  function getCanvasPixelCoords(e) {
    const rect = bgEditorCanvas.getBoundingClientRect();
    const scaleX = bgState.width / rect.width;
    const scaleY = bgState.height / rect.height;
    return {
      x: Math.max(0, Math.min(bgState.width - 1, Math.floor((e.clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(bgState.height - 1, Math.floor((e.clientY - rect.top) * scaleY)))
    };
  }

  function stampBrushCircle(cx, cy, radius, w, h, work, orig, isErase) {
    const r = Math.max(0, radius - 0.5);
    const rSq = r * r;
    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(w - 1, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(h - 1, Math.ceil(cy + r));

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
  }

  function applyBrushStroke(fromX, fromY, toX, toY) {
    if (!bgState.workData || !bgState.origData) return;
    const radius = Math.max(1, parseInt(bgBrushSize.value, 10) || 20);
    const w = bgState.width;
    const h = bgState.height;
    const work = bgState.workData.data;
    const orig = bgState.origData;
    const isErase = bgState.activePointerTool === 'erase';

    const dist = Math.hypot(toX - fromX, toY - fromY);
    const step = Math.max(1, radius * 0.35);
    const steps = Math.max(1, Math.ceil(dist / step));

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const cx = Math.round(fromX + (toX - fromX) * t);
      const cy = Math.round(fromY + (toY - fromY) * t);
      stampBrushCircle(cx, cy, radius, w, h, work, orig, isErase);
    }
    renderBgEditorCanvas();
  }

  if (bgCanvasViewport) {
    bgCanvasViewport.addEventListener('pointerdown', (e) => {
      if (!bgState.workData) return;
      if (e.target && e.target.closest && e.target.closest('#bgZoomHud')) return;

      // 우클릭(2), 휠클릭(1), 스페이스바+좌클릭, '✋ 화면 이동' 도구, 또는 이미지 바깥 여백 드래그 시 화면 이동(Pan)
      const shouldPan =
        e.button === 1 ||
        e.button === 2 ||
        isBgSpaceDown ||
        bgState.activePointerTool === 'pan' ||
        e.target !== bgEditorCanvas;

      if (shouldPan) {
        e.preventDefault();
        isBgPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panOriginX = bgState.panX;
        panOriginY = bgState.panY;
        bgCanvasViewport.classList.add('is-panning');
        if (bgBrushCursor) bgBrushCursor.classList.add('hidden');
        try {
          bgCanvasViewport.setPointerCapture(e.pointerId);
        } catch (err) {}
        return;
      }

      if (e.button !== 0) return;
      const pt = getCanvasPixelCoords(e);

      if (bgState.activePointerTool === 'wand') {
        const idx = (pt.y * bgState.width + pt.x) * 4;
        // 이미 투명해진 영역(alpha === 0)을 중복 클릭한 경우 불필요한 스냅샷이 쌓이지 않도록 방지
        if (bgState.workData.data[idx + 3] === 0) {
          showToast('이미 투명한 영역입니다. 지우려는 색상을 클릭하거나 Ctrl+Z로 되돌리세요.');
          return;
        }
        pushBgHistory();
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

      pushBgHistory();
      isBgDrawing = true;
      lastBrushPt = pt;
      try {
        bgCanvasViewport.setPointerCapture(e.pointerId);
      } catch (err) {}
      applyBrushStroke(pt.x, pt.y, pt.x, pt.y);
      updateBgBrushCursor(e.clientX, e.clientY);
    });

    bgCanvasViewport.addEventListener('pointermove', (e) => {
      if (!bgState.workData) return;
      if (isBgPanning) {
        const vpRect = bgCanvasViewport.getBoundingClientRect();
        const maxPanX = vpRect.width * Math.max(1, bgState.zoom) * 0.65;
        const maxPanY = vpRect.height * Math.max(1, bgState.zoom) * 0.65;
        const nextPanX = panOriginX + (e.clientX - panStartX);
        const nextPanY = panOriginY + (e.clientY - panStartY);
        bgState.panX = Math.max(-maxPanX, Math.min(maxPanX, nextPanX));
        bgState.panY = Math.max(-maxPanY, Math.min(maxPanY, nextPanY));
        applyBgZoomTransform();
        return;
      }

      if (e.target && e.target.closest && e.target.closest('#bgZoomHud')) {
        if (bgBrushCursor) bgBrushCursor.classList.add('hidden');
        return;
      }

      updateBgBrushCursor(e.clientX, e.clientY);

      if (!isBgDrawing) return;
      const pt = getCanvasPixelCoords(e);
      const fromPt = lastBrushPt || pt;
      applyBrushStroke(fromPt.x, fromPt.y, pt.x, pt.y);
      lastBrushPt = pt;
    });

    const stopBgPointerAction = () => {
      isBgDrawing = false;
      lastBrushPt = null;
      if (isBgPanning) {
        isBgPanning = false;
        bgCanvasViewport.classList.remove('is-panning');
      }
    };
    bgCanvasViewport.addEventListener('pointerup', stopBgPointerAction);
    bgCanvasViewport.addEventListener('pointercancel', stopBgPointerAction);
  }

  if (undoBgBtn) {
    undoBgBtn.addEventListener('click', undoBgAction);
  }
  if (undoBgTopBtn) {
    undoBgTopBtn.addEventListener('click', undoBgAction);
  }

  if (redoBgBtn) {
    redoBgBtn.addEventListener('click', redoBgAction);
  }
  if (redoBgTopBtn) {
    redoBgTopBtn.addEventListener('click', redoBgAction);
  }

  if (restoreOrigBgBtn) {
    restoreOrigBgBtn.addEventListener('click', () => {
      if (!bgState.origData || !bgState.workData) return;
      pushBgHistory();
      bgState.workData = new ImageData(new Uint8ClampedArray(bgState.origData), bgState.width, bgState.height);
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

  // 배경 제거(누끼) 탭에서 Ctrl+Z (실행 취소) / Ctrl+Y 또는 Ctrl+Shift+Z (다시 실행) 단축키 지원
  // (한/영 키 한글 상태 'ㅋ'/'ㅛ' 및 슬라이더 조작 후 포커스 상태에서도 항상 작동하도록 처리)
  window.addEventListener(
    'keydown',
    (e) => {
      const bgTabEl = document.getElementById('tab-img-bgremove');
      const isBgActive =
        activeTabId === 'img-bgremove' ||
        Boolean(bgTabEl && bgTabEl.classList.contains('active'));
      if (!isBgActive || !bgState.workData) return;

      // 텍스트/숫자 타이핑 입력칸에 포커스가 있을 때만 제외 (슬라이더 range, color, select 등은 단축키 허용)
      const target = e.target;
      if (target && target.tagName) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'textarea') return;
        if (tag === 'input') {
          const type = (target.type || '').toLowerCase();
          if (type === 'text' || type === 'number' || type === 'url' || type === 'search' || type === 'password') {
            return;
          }
        }
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (!isCtrlOrMeta) return;

      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      const isZ = code === 'KeyZ' || key === 'z' || key === 'ㅋ';
      const isY = code === 'KeyY' || key === 'y' || key === 'ㅛ';

      if (isZ && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        undoBgAction();
      } else if (isY || (isZ && e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        redoBgAction();
      }
    },
    true
  );

  // 이미지 자르기/리사이즈 및 배경 제거(누끼) 탭에서도 Ctrl+V 클립보드 붙여넣기 지원
  window.addEventListener('paste', (e) => {
    if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) return;
    const file = e.clipboardData.files[0];
    if (activeTabId === 'img-crop') {
      loadCropImage(file);
    } else if (activeTabId === 'img-bgremove') {
      loadBgRemoveImage(file);
    }
  });

  /* ==========================================================================
     [7] 탭 3-2: 동영상 → GIF 움짤 변환 (비주얼 필름스트립 NLE 컷편집 · 비율 크롭 · 사이즈 동시 조절)
     ========================================================================== */
  const gifVideoDropzone = document.getElementById('gifVideoDropzone');
  const gifVideoFileInput = document.getElementById('gifVideoFileInput');
  const gifStageCard = document.getElementById('gifStageCard');

  const gifOrigInfo = document.getElementById('gifOrigInfo');
  const gifBoxInfo = document.getElementById('gifBoxInfo');
  const gifFinalInfo = document.getElementById('gifFinalInfo');
  const gifSizeFloating = document.getElementById('gifSizeFloating');

  const gifCanvasWrap = document.getElementById('gifCanvasWrap');
  const gifPreviewCanvas = document.getElementById('gifPreviewCanvas');
  const gifSourceVideo = document.getElementById('gifSourceVideo');
  const gifCropBox = document.getElementById('gifCropBox');

  const gifDurationBadge = document.getElementById('gifDurationBadge');
  const gifCutList = document.getElementById('gifCutList');
  const addGifCutBtn = document.getElementById('addGifCutBtn');
  const gifActiveCutLabel = document.getElementById('gifActiveCutLabel');
  const gifSidebarUndoBtn = document.getElementById('gifSidebarUndoBtn');
  const gifSidebarRedoBtn = document.getElementById('gifSidebarRedoBtn');
  const gifStartTimeInput = document.getElementById('gifStartTimeInput');
  const gifEndTimeInput = document.getElementById('gifEndTimeInput');
  const setGifStartNowBtn = document.getElementById('setGifStartNowBtn');
  const setGifEndNowBtn = document.getElementById('setGifEndNowBtn');
  const previewGifLoopBtn = document.getElementById('previewGifLoopBtn');

  const gifPlayPauseBtn = document.getElementById('gifPlayPauseBtn');
  const gifStepBackBtn = document.getElementById('gifStepBackBtn');
  const gifStepFwdBtn = document.getElementById('gifStepFwdBtn');
  const gifCurrentTimeText = document.getElementById('gifCurrentTimeText');
  const gifRangeSummaryText = document.getElementById('gifRangeSummaryText');

  const gifSplitBtn = document.getElementById('gifSplitBtn');
  const gifDeleteCutBtn = document.getElementById('gifDeleteCutBtn');
  const gifKeepOnlyCutBtn = document.getElementById('gifKeepOnlyCutBtn');
  const gifUndoBtn = document.getElementById('gifUndoBtn');
  const gifRedoBtn = document.getElementById('gifRedoBtn');
  const gifResetCutsBtn = document.getElementById('gifResetCutsBtn');

  const gifNleTimeline = document.getElementById('gifNleTimeline');
  const gifTimeRuler = document.getElementById('gifTimeRuler');
  const gifNleTrack = document.getElementById('gifNleTrack');
  const gifFilmstripCanvas = document.getElementById('gifFilmstripCanvas');
  const gifNleClipsLayer = document.getElementById('gifNleClipsLayer');
  const gifNlePlayhead = document.getElementById('gifNlePlayhead');
  const gifStitchedSequenceBar = document.getElementById('gifStitchedSequenceBar');

  const gifKeepAspectInput = document.getElementById('gifKeepAspectInput');
  const gifTargetW = document.getElementById('gifTargetW');
  const gifTargetH = document.getElementById('gifTargetH');
  const gifQuickSizeChips = document.getElementById('gifQuickSizeChips');
  const gifForceExactSize = document.getElementById('gifForceExactSize');
  const gifRatioGrid = document.getElementById('gifRatioGrid');

  const gifFpsSelect = document.getElementById('gifFpsSelect');
  const gifSpeedSelect = document.getElementById('gifSpeedSelect');
  const gifIncludeAudioInput = document.getElementById('gifIncludeAudioInput');

  const startMp4CutExportBtn = document.getElementById('startMp4CutExportBtn');
  const startGifConvertBtn = document.getElementById('startGifConvertBtn');
  const quickMp4ExportBtn = document.getElementById('quickMp4ExportBtn');
  const quickGifExportBtn = document.getElementById('quickGifExportBtn');
  const cancelGifConvertBtn = document.getElementById('cancelGifConvertBtn');
  const changeGifVideoBtn = document.getElementById('changeGifVideoBtn');

  const gifProgressPanel = document.getElementById('gifProgressPanel');
  const gifProgressStatus = document.getElementById('gifProgressStatus');
  const gifProgressPercent = document.getElementById('gifProgressPercent');
  const gifProgressBar = document.getElementById('gifProgressBar');

  const gifResultBox = document.getElementById('gifResultBox');
  const gifResultBadgeTag = document.getElementById('gifResultBadgeTag');
  const gifResultStatText = document.getElementById('gifResultStatText');
  const gifResultPreviewImg = document.getElementById('gifResultPreviewImg');
  const gifResultPreviewVideo = document.getElementById('gifResultPreviewVideo');
  const downloadGifResultBtn = document.getElementById('downloadGifResultBtn');

  const GIF_MAX_DURATION = 15.0; // 최종 GIF 변환 시 권장 최대 합산 시간 (15초, MP4 저장은 시간 제한 없음)

  let gifState = {
    file: null,
    videoUrl: null,
    resultBlobUrl: null,
    origW: 0,
    origH: 0,
    duration: 0,
    dispW: 0,
    dispH: 0,
    scale: 1,
    box: { x: 0, y: 0, w: 0, h: 0 },
    ratio: 'full',
    userTypedSize: false,
    quickWidth: 480,
    cuts: [{ start: 0, end: 5 }],
    activeCutIdx: 0,
    previewCutIdx: 0,
    undoStack: [],
    redoStack: [],
    startTime: 0,
    endTime: 5,
    isLoopPreview: false,
    isEncoding: false,
    cancelRequested: false,
    abortMp4Fn: null,
    rafId: null,
    filmstripJobId: 0,
  };

  function cloneCuts(cuts) {
    return cuts.map((c) => ({ start: Number(c.start.toFixed(2)), end: Number(c.end.toFixed(2)) }));
  }

  function normalizeCutsList() {
    const dur = gifState.duration || 10;
    if (!gifState.cuts || gifState.cuts.length === 0) {
      gifState.cuts = [{ start: 0, end: Number(dur.toFixed(2)) }];
      gifState.activeCutIdx = 0;
      return;
    }
    gifState.cuts.sort((a, b) => a.start - b.start);
    for (let i = 0; i < gifState.cuts.length; i++) {
      const c = gifState.cuts[i];
      c.start = Math.max(0, Math.min(dur - 0.1, Number(c.start.toFixed(2))));
      c.end = Math.max(c.start + 0.15, Math.min(dur, Number(c.end.toFixed(2))));
      if (i > 0 && c.start < gifState.cuts[i - 1].end) {
        c.start = gifState.cuts[i - 1].end;
        if (c.end < c.start + 0.15) {
          c.end = Math.min(dur, c.start + 0.15);
        }
      }
    }
    gifState.cuts = gifState.cuts.filter((c) => c.end - c.start >= 0.12);
    if (gifState.cuts.length === 0) {
      gifState.cuts = [{ start: 0, end: Number(dur.toFixed(2)) }];
    }
    if (gifState.activeCutIdx < 0 || gifState.activeCutIdx >= gifState.cuts.length) {
      gifState.activeCutIdx = Math.max(0, gifState.cuts.length - 1);
    }
  }

  function updateGifUndoRedoBtns() {
    const canUndo = gifState.undoStack.length > 0 && !gifState.isEncoding;
    const canRedo = gifState.redoStack.length > 0 && !gifState.isEncoding;
    if (gifUndoBtn) gifUndoBtn.disabled = !canUndo;
    if (gifRedoBtn) gifRedoBtn.disabled = !canRedo;
    if (gifSidebarUndoBtn) gifSidebarUndoBtn.disabled = !canUndo;
    if (gifSidebarRedoBtn) gifSidebarRedoBtn.disabled = !canRedo;
  }

  function pushGifCutHistory() {
    gifState.undoStack.push({
      cuts: cloneCuts(gifState.cuts),
      activeCutIdx: gifState.activeCutIdx,
    });
    if (gifState.undoStack.length > 40) {
      gifState.undoStack.shift();
    }
    gifState.redoStack = [];
    updateGifUndoRedoBtns();
  }

  function undoGifCutAction() {
    if (gifState.undoStack.length === 0 || gifState.isEncoding) return;
    gifState.redoStack.push({
      cuts: cloneCuts(gifState.cuts),
      activeCutIdx: gifState.activeCutIdx,
    });
    const prev = gifState.undoStack.pop();
    gifState.cuts = cloneCuts(prev.cuts);
    gifState.activeCutIdx = Math.min(prev.activeCutIdx, gifState.cuts.length - 1);
    syncGifTimelineUI();
    updateGifUndoRedoBtns();
    showToast('↩️ 컷편집 실행 취소 (Ctrl+Z)');
  }

  function redoGifCutAction() {
    if (gifState.redoStack.length === 0 || gifState.isEncoding) return;
    gifState.undoStack.push({
      cuts: cloneCuts(gifState.cuts),
      activeCutIdx: gifState.activeCutIdx,
    });
    const next = gifState.redoStack.pop();
    gifState.cuts = cloneCuts(next.cuts);
    gifState.activeCutIdx = Math.min(next.activeCutIdx, gifState.cuts.length - 1);
    syncGifTimelineUI();
    updateGifUndoRedoBtns();
    showToast('↪️ 컷편집 다시 실행 (Ctrl+Y)');
  }

  function getTotalGifCutsDuration(excludeIdx = -1) {
    return gifState.cuts.reduce((acc, c, idx) => {
      if (idx === excludeIdx) return acc;
      return acc + Math.max(0, c.end - c.start);
    }, 0);
  }

  function formatSecDetail(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '00:00.0';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${String(m).padStart(2, '0')}:${s.padStart(4, '0')}`;
  }

  function drawGifVideoFrame() {
    if (!gifPreviewCanvas || !gifSourceVideo || !gifState.dispW || !gifState.dispH) return;
    const ctx = gifPreviewCanvas.getContext('2d');
    ctx.clearRect(0, 0, gifState.dispW, gifState.dispH);
    try {
      ctx.drawImage(gifSourceVideo, 0, 0, gifState.dispW, gifState.dispH);
    } catch (_) {}
  }

  function updateGifPlayheadUI() {
    if (!gifSourceVideo || !gifState.duration) return;
    const cur = gifSourceVideo.currentTime || 0;
    const dur = gifState.duration || 1;
    const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
    if (gifNlePlayhead) {
      gifNlePlayhead.style.left = `${pct}%`;
    }
    if (gifCurrentTimeText) {
      gifCurrentTimeText.textContent = `${formatSecDetail(cur)} / ${formatSecDetail(dur)}`;
    }
  }

  function startGifPreviewLoop() {
    if (gifState.rafId) cancelAnimationFrame(gifState.rafId);
    const tick = () => {
      if (!gifSourceVideo || gifSourceVideo.paused || gifSourceVideo.ended || gifState.isEncoding) {
        if (gifPlayPauseBtn && !gifState.isEncoding) {
          gifPlayPauseBtn.textContent = '▶️ 재생';
        }
        gifState.rafId = null;
        return;
      }

      if (gifState.isLoopPreview && gifState.cuts.length > 0) {
        const curCut = gifState.cuts[gifState.previewCutIdx] || gifState.cuts[0];
        if (gifSourceVideo.currentTime >= curCut.end) {
          gifState.previewCutIdx = (gifState.previewCutIdx + 1) % gifState.cuts.length;
          const nextCut = gifState.cuts[gifState.previewCutIdx];
          gifState.activeCutIdx = gifState.previewCutIdx;
          syncGifTimelineUI();
          gifSourceVideo.currentTime = nextCut.start;
        }
      }

      drawGifVideoFrame();
      updateGifPlayheadUI();
      gifState.rafId = requestAnimationFrame(tick);
    };
    gifState.rafId = requestAnimationFrame(tick);
  }

  // 비주얼 시간 눈금자(Ruler) 렌더링
  function renderGifTimeRuler() {
    if (!gifTimeRuler || !gifState.duration) return;
    gifTimeRuler.innerHTML = '';
    const dur = gifState.duration;
    const stepCandidates = [0.5, 1, 2, 5, 10, 15, 30, 60];
    let step = stepCandidates.find((s) => dur / s <= 12) || Math.ceil(dur / 10);

    for (let t = 0; t <= dur; t += step) {
      const pct = (t / dur) * 100;
      if (pct > 98) break;
      const tick = document.createElement('div');
      tick.className = 'nle-ruler-tick';
      tick.style.left = `${pct}%`;
      tick.textContent = t < 60 ? `${Number(t.toFixed(1))}s` : formatDuration(t);
      gifTimeRuler.appendChild(tick);
    }
  }

  // 백그라운드 필름스트립(장면 썸네일) 캔버스 생성
  async function generateGifFilmstripAsync(videoUrl, duration) {
    if (!gifFilmstripCanvas || !videoUrl || !duration) return;
    const jobId = ++gifState.filmstripJobId;

    const trackRect = gifNleTrack ? gifNleTrack.getBoundingClientRect() : null;
    const canvasW = Math.max(480, Math.round((trackRect && trackRect.width) || 680));
    const canvasH = 68;
    gifFilmstripCanvas.width = canvasW;
    gifFilmstripCanvas.height = canvasH;
    const ctx = gifFilmstripCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const thumbCount = 10;
    const cellW = canvasW / thumbCount;

    const tempVideo = document.createElement('video');
    tempVideo.src = videoUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.preload = 'auto';

    await new Promise((resolve) => {
      tempVideo.onloadeddata = resolve;
      tempVideo.onerror = resolve;
      setTimeout(resolve, 1500);
    });

    for (let i = 0; i < thumbCount; i++) {
      if (jobId !== gifState.filmstripJobId) break;
      const t = Math.min(duration - 0.05, Math.max(0, ((i + 0.5) / thumbCount) * duration));
      await seekVideoToTime(tempVideo, t);
      if (jobId !== gifState.filmstripJobId) break;
      try {
        ctx.drawImage(tempVideo, i * cellW, 0, cellW, canvasH);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(i * cellW, 0, cellW, canvasH);
      } catch (_) {}
    }
    tempVideo.removeAttribute('src');
    tempVideo.load();
  }

  // 비주얼 타임라인 클립 블록 & 삭제된 구간 & 좌측 리스트 & 하단 이어붙인 시퀀스 렌더링
  function syncGifTimelineUI() {
    normalizeCutsList();
    const dur = gifState.duration || 10;
    const activeCut = gifState.cuts[gifState.activeCutIdx] || gifState.cuts[0];
    gifState.startTime = activeCut.start;
    gifState.endTime = activeCut.end;

    const activeSpan = Math.max(0.1, activeCut.end - activeCut.start);
    const totalSpan = getTotalGifCutsDuration(-1);
    const isOverLimit = totalSpan > GIF_MAX_DURATION + 0.05;

    if (gifActiveCutLabel) {
      gifActiveCutLabel.textContent = `🎬 선택된 컷: 컷 ${gifState.activeCutIdx + 1} (${activeSpan.toFixed(1)}초)`;
    }
    if (gifStartTimeInput && document.activeElement !== gifStartTimeInput) {
      gifStartTimeInput.value = activeCut.start.toFixed(1);
    }
    if (gifEndTimeInput && document.activeElement !== gifEndTimeInput) {
      gifEndTimeInput.value = activeCut.end.toFixed(1);
    }

    if (gifDurationBadge) {
      gifDurationBadge.textContent = `🎬 총 ${gifState.cuts.length}컷 · ${totalSpan.toFixed(1)}초`;
    }
    if (gifRangeSummaryText) {
      gifRangeSummaryText.classList.toggle('over-limit', isOverLimit);
      gifRangeSummaryText.textContent = isOverLimit
        ? `🎬 합계: ${totalSpan.toFixed(1)}초 (${gifState.cuts.length}컷 · MP4 가능 / GIF는 ≤15s)`
        : `✅ 합계: ${totalSpan.toFixed(1)}초 (${gifState.cuts.length}컷 · MP4/GIF 가능)`;
    }

    // 1) 좌측 사이드바 컷 목록 렌더링
    if (gifCutList) {
      gifCutList.innerHTML = '';
      gifState.cuts.forEach((cut, idx) => {
        const span = Math.max(0.1, cut.end - cut.start).toFixed(1);
        const item = document.createElement('div');
        item.className = `gif-cut-item${idx === gifState.activeCutIdx ? ' active' : ''}`;
        item.innerHTML = `
          <div class="gif-cut-item-left">
            <span class="gif-cut-badge">컷 ${idx + 1}</span>
            <span>${cut.start.toFixed(1)}s ~ ${cut.end.toFixed(1)}s (${span}초)</span>
          </div>
          ${
            gifState.cuts.length > 1
              ? `<button type="button" class="gif-cut-del-btn" data-del-idx="${idx}" title="이 컷 삭제">🗑️ 삭제</button>`
              : `<span style="font-size:0.72rem; color:var(--text-muted);">선택됨</span>`
          }
        `;
        item.addEventListener('click', (e) => {
          const delBtn = e.target.closest('.gif-cut-del-btn');
          if (delBtn) {
            e.stopPropagation();
            deleteGifCutByIndex(idx);
            return;
          }
          selectGifCut(idx, true);
        });
        gifCutList.appendChild(item);
      });
    }

    // 2) 메인 비주얼 NLE 타임라인 레이어 (살아있는 클립 블록 + 삭제된 빈 구간) 렌더링
    if (gifNleClipsLayer && dur > 0) {
      gifNleClipsLayer.innerHTML = '';

      // 삭제된 빈 구간(Gaps) 계산 및 [+ 살리기] 버튼 표시
      const gaps = [];
      let cursor = 0;
      gifState.cuts.forEach((cut) => {
        if (cut.start - cursor >= 0.25) {
          gaps.push({ start: cursor, end: cut.start });
        }
        cursor = cut.end;
      });
      if (dur - cursor >= 0.25) {
        gaps.push({ start: cursor, end: dur });
      }

      gaps.forEach((g) => {
        const gapEl = document.createElement('div');
        gapEl.className = 'nle-deleted-gap';
        const leftPct = (g.start / dur) * 100;
        const widthPct = ((g.end - g.start) / dur) * 100;
        gapEl.style.left = `${leftPct}%`;
        gapEl.style.width = `${widthPct}%`;
        gapEl.title = `삭제된 구간 (${g.start.toFixed(1)}s ~ ${g.end.toFixed(1)}s · 자동 건너뜀)`;

        if (widthPct >= 6) {
          const restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.className = 'nle-restore-gap-btn';
          restoreBtn.textContent = '+ 구간 복원';
          restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pushGifCutHistory();
            gifState.cuts.push({ start: g.start, end: g.end });
            normalizeCutsList();
            const foundIdx = gifState.cuts.findIndex((c) => Math.abs(c.start - g.start) < 0.15);
            if (foundIdx >= 0) gifState.activeCutIdx = foundIdx;
            syncGifTimelineUI();
            showToast('삭제했던 구간을 다시 살렸습니다.');
          });
          gapEl.appendChild(restoreBtn);
        }
        gifNleClipsLayer.appendChild(gapEl);
      });

      // 살아있는 클립 블록(.nle-clip-block) 렌더링
      gifState.cuts.forEach((cut, idx) => {
        const block = document.createElement('div');
        block.className = `nle-clip-block${idx === gifState.activeCutIdx ? ' selected' : ''}`;
        const leftPct = (cut.start / dur) * 100;
        const widthPct = Math.max(1.2, ((cut.end - cut.start) / dur) * 100);
        block.style.left = `${leftPct}%`;
        block.style.width = `${widthPct}%`;
        block.dataset.clipIdx = String(idx);

        const span = Math.max(0.1, cut.end - cut.start).toFixed(1);
        block.innerHTML = `
          <div class="nle-trim-handle left" data-trim="left" data-idx="${idx}" title="마우스로 잡고 드래그하여 시작점 조절"></div>
          <div class="nle-clip-label">컷 ${idx + 1} (${span}s)</div>
          <div class="nle-trim-handle right" data-trim="right" data-idx="${idx}" title="마우스로 잡고 드래그하여 종료점 조절"></div>
        `;
        gifNleClipsLayer.appendChild(block);
      });
    }

    // 3) 하단 이어붙인 시퀀스 바 렌더링
    if (gifStitchedSequenceBar) {
      gifStitchedSequenceBar.innerHTML = `<strong style="color:var(--text-secondary); margin-right:3px;">🧲 이어붙인 구성:</strong>`;
      gifState.cuts.forEach((cut, idx) => {
        if (idx > 0) {
          const join = document.createElement('span');
          join.className = 'stitched-join-icon';
          join.textContent = '➕';
          gifStitchedSequenceBar.appendChild(join);
        }
        const chip = document.createElement('span');
        chip.className = `stitched-chip${idx === gifState.activeCutIdx ? ' active' : ''}`;
        chip.textContent = `컷 ${idx + 1} (${(cut.end - cut.start).toFixed(1)}초)`;
        chip.title = `클릭 시 컷 ${idx + 1} (${cut.start.toFixed(1)}s ~ ${cut.end.toFixed(1)}s) 선택`;
        chip.addEventListener('click', () => selectGifCut(idx, true));
        gifStitchedSequenceBar.appendChild(chip);
      });
    }

    updateGifUndoRedoBtns();
  }

  function selectGifCut(idx, seekToStart = false) {
    if (idx < 0 || idx >= gifState.cuts.length) return;
    gifState.activeCutIdx = idx;
    const cut = gifState.cuts[idx];
    gifState.startTime = cut.start;
    gifState.endTime = cut.end;
    syncGifTimelineUI();
    if (seekToStart && gifSourceVideo && !gifState.isEncoding) {
      gifSourceVideo.pause();
      gifSourceVideo.currentTime = cut.start;
    }
  }

  // ✂️ 빨간 재생선(Playhead) 위치에서 클립 분할(자르기)
  function splitGifClipAtPlayhead() {
    if (!gifSourceVideo || !gifState.duration || gifState.isEncoding) return;
    const cur = Number((gifSourceVideo.currentTime || 0).toFixed(2));

    const targetIdx = gifState.cuts.findIndex((c) => cur > c.start + 0.18 && cur < c.end - 0.18);
    if (targetIdx === -1) {
      showToast('재생선(▼)을 자르고 싶은 클립의 중간 위치에 놓은 뒤 [✂️ 여기서 자르기]를 눌러주세요.');
      return;
    }

    pushGifCutHistory();
    const orig = gifState.cuts[targetIdx];
    const leftClip = { start: orig.start, end: cur };
    const rightClip = { start: cur, end: orig.end };
    gifState.cuts.splice(targetIdx, 1, leftClip, rightClip);
    gifState.activeCutIdx = targetIdx + 1;
    syncGifTimelineUI();
    showToast(`✂️ ${cur.toFixed(1)}초 위치에서 클립이 분할되었습니다! 필요 없는 컷을 선택해 삭제(Del)하세요.`);
  }

  // 🗑️ 특정 컷 삭제
  function deleteGifCutByIndex(idx) {
    if (gifState.isEncoding) return;
    if (gifState.cuts.length <= 1) {
      showToast('최소 1개의 컷은 남아있어야 합니다. 먼저 [✂️ 여기서 자르기]로 구간을 나눈 뒤 불필요한 컷을 삭제하세요!');
      return;
    }
    pushGifCutHistory();
    gifState.cuts.splice(idx, 1);
    if (gifState.activeCutIdx >= gifState.cuts.length) {
      gifState.activeCutIdx = gifState.cuts.length - 1;
    }
    syncGifTimelineUI();
    showToast(`🗑️ 컷 ${idx + 1} 구간이 삭제되고 남은 구간이 이어붙여졌습니다. (Ctrl+Z로 복구 가능)`);
  }

  // 🎯 현재 선택된 컷만 남기고 나머지 모두 삭제
  function keepOnlyActiveGifClip() {
    if (gifState.isEncoding) return;
    if (gifState.cuts.length <= 1) {
      showToast('현재 컷이 1개뿐입니다. 먼저 [✂️ 여기서 자르기]로 남길 구간을 분할해보세요!');
      return;
    }
    pushGifCutHistory();
    const keep = { ...gifState.cuts[gifState.activeCutIdx] };
    gifState.cuts = [keep];
    gifState.activeCutIdx = 0;
    syncGifTimelineUI();
    showToast(`🎯 선택한 구간(${keep.start.toFixed(1)}s~${keep.end.toFixed(1)}s)만 남기고 나머지를 모두 정리했습니다!`);
  }

  function applyGifQuickSizeFromCropBox(baseSize) {
    if (!gifState.origW || !gifState.box.w || !gifState.box.h) return;
    const realW = Math.max(16, Math.round(gifState.box.w / gifState.scale));
    const realH = Math.max(16, Math.round(gifState.box.h / gifState.scale));
    if (baseSize === 'orig' || gifState.quickWidth === 'orig') {
      if (gifTargetW) gifTargetW.value = realW;
      if (gifTargetH) gifTargetH.value = realH;
      return;
    }
    const targetBase = Number(baseSize || gifState.quickWidth) || 480;
    const aspect = gifState.box.w / gifState.box.h;
    let outW, outH;
    if (aspect >= 1) {
      outW = targetBase;
      outH = Math.max(16, Math.round(targetBase / aspect));
    } else {
      outH = targetBase;
      outW = Math.max(16, Math.round(targetBase * aspect));
    }
    if (gifTargetW) gifTargetW.value = outW;
    if (gifTargetH) gifTargetH.value = outH;
  }

  function updateGifCropBoxDOM(skipInputSync = false) {
    const b = gifState.box;
    if (!gifCropBox) return;
    gifCropBox.style.left = `${b.x}px`;
    gifCropBox.style.top = `${b.y}px`;
    gifCropBox.style.width = `${b.w}px`;
    gifCropBox.style.height = `${b.h}px`;

    const realW = Math.max(1, Math.round(b.w / gifState.scale));
    const realH = Math.max(1, Math.round(b.h / gifState.scale));

    if (!skipInputSync && !gifState.userTypedSize) {
      applyGifQuickSizeFromCropBox(gifState.quickWidth);
    }

    const customW = parseInt(gifTargetW && gifTargetW.value, 10);
    const customH = parseInt(gifTargetH && gifTargetH.value, 10);
    const hasCustomW = Number.isFinite(customW) && customW > 0;
    const hasCustomH = Number.isFinite(customH) && customH > 0;

    let finalW = realW;
    let finalH = realH;
    if (gifForceExactSize && gifForceExactSize.checked && (hasCustomW || hasCustomH)) {
      if (hasCustomW && hasCustomH) {
        finalW = customW;
        finalH = customH;
      } else if (hasCustomW) {
        finalW = customW;
        finalH = Math.max(1, Math.round((realH / realW) * customW));
      } else if (hasCustomH) {
        finalH = customH;
        finalW = Math.max(1, Math.round((realW / realH) * customH));
      }
    }

    if (gifSizeFloating) {
      gifSizeFloating.textContent =
        finalW !== realW || finalH !== realH
          ? `${realW}×${realH} → ${finalW}×${finalH} px`
          : `${realW} × ${realH} px`;
    }
    if (gifOrigInfo) gifOrigInfo.textContent = `원본: ${gifState.origW} × ${gifState.origH} px`;
    if (gifBoxInfo) gifBoxInfo.textContent = `크롭 영역: ${realW} × ${realH} px`;
    if (gifFinalInfo) gifFinalInfo.textContent = `출력 크기: ${finalW} × ${finalH} px`;
  }

  function applyGifRatioToCropBox(ratioStr) {
    if (!gifState.dispW || !gifState.dispH) return;
    gifState.ratio = ratioStr;

    if (gifRatioGrid) {
      gifRatioGrid.querySelectorAll('.chip-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.ratio === ratioStr);
      });
    }

    if (ratioStr === 'full') {
      gifState.box = { x: 0, y: 0, w: gifState.dispW, h: gifState.dispH };
      updateGifCropBoxDOM();
      return;
    }

    if (ratioStr === 'free') {
      updateGifCropBoxDOM();
      return;
    }

    const parts = ratioStr.split(':').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      const targetRatio = parts[0] / parts[1];
      const maxW = gifState.dispW;
      const maxH = gifState.dispH;
      let newW = maxW;
      let newH = newW / targetRatio;
      if (newH > maxH) {
        newH = maxH;
        newW = newH * targetRatio;
      }
      gifState.box = {
        x: Math.round((maxW - newW) / 2),
        y: Math.round((maxH - newH) / 2),
        w: Math.round(newW),
        h: Math.round(newH),
      };
      gifState.userTypedSize = false;
      updateGifCropBoxDOM();
    }
  }

  function loadGifSourceVideo(file) {
    if (!file || (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name))) {
      showToast('변환할 동영상 파일을 선택해주세요.');
      return;
    }

    if (gifState.rafId) {
      cancelAnimationFrame(gifState.rafId);
      gifState.rafId = null;
    }
    if (gifState.videoUrl) {
      URL.revokeObjectURL(gifState.videoUrl);
    }

    gifState.file = file;
    gifState.videoUrl = URL.createObjectURL(file);
    gifState.isEncoding = false;
    gifState.cancelRequested = false;
    gifState.userTypedSize = false;
    gifState.undoStack = [];
    gifState.redoStack = [];

    gifSourceVideo.src = gifState.videoUrl;
    gifSourceVideo.muted = true;
    gifSourceVideo.load();

    gifSourceVideo.onloadedmetadata = () => {
      const vw = gifSourceVideo.videoWidth || 640;
      const vh = gifSourceVideo.videoHeight || 360;
      const dur = Number.isFinite(gifSourceVideo.duration) && gifSourceVideo.duration > 0 ? gifSourceVideo.duration : 10;

      gifState.origW = vw;
      gifState.origH = vh;
      gifState.duration = dur;

      const maxW = 660;
      const maxH = 400;
      const scale = Math.min(1, maxW / vw, maxH / vh);
      gifState.scale = scale;
      gifState.dispW = Math.max(1, Math.round(vw * scale));
      gifState.dispH = Math.max(1, Math.round(vh * scale));

      gifPreviewCanvas.width = gifState.dispW;
      gifPreviewCanvas.height = gifState.dispH;
      gifCanvasWrap.style.width = `${gifState.dispW}px`;
      gifCanvasWrap.style.height = `${gifState.dispH}px`;

      if (gifStartTimeInput) gifStartTimeInput.max = dur.toFixed(1);
      if (gifEndTimeInput) gifEndTimeInput.max = dur.toFixed(1);

      // 영상 편집기처럼 처음엔 전체 영상 클립 1개가 통째로 올라가 있도록 초기화
      gifState.cuts = [{ start: 0, end: Number(dur.toFixed(2)) }];
      gifState.activeCutIdx = 0;
      gifState.previewCutIdx = 0;
      gifState.startTime = 0;
      gifState.endTime = Number(dur.toFixed(2));

      gifVideoDropzone.classList.add('hidden');
      gifStageCard.classList.remove('hidden');
      gifResultBox.classList.add('hidden');
      gifProgressPanel.classList.add('hidden');

      renderGifTimeRuler();
      syncGifTimelineUI();
      generateGifFilmstripAsync(gifState.videoUrl, dur);

      gifState.ratio = 'full';
      applyGifRatioToCropBox('full');

      if (startMp4CutExportBtn) startMp4CutExportBtn.disabled = false;
      startGifConvertBtn.disabled = false;
      if (quickMp4ExportBtn) quickMp4ExportBtn.disabled = false;
      if (quickGifExportBtn) quickGifExportBtn.disabled = false;
      changeGifVideoBtn.disabled = false;
      setGifStartNowBtn.disabled = false;
      setGifEndNowBtn.disabled = false;
      previewGifLoopBtn.disabled = false;
      if (addGifCutBtn) addGifCutBtn.disabled = false;

      gifSourceVideo.currentTime = 0;
    };

    gifSourceVideo.onseeked = () => {
      if (!gifState.isEncoding) {
        drawGifVideoFrame();
        updateGifPlayheadUI();
      }
    };
  }

  if (gifVideoDropzone && gifVideoFileInput) {
    setupDropzone(gifVideoDropzone, gifVideoFileInput, (files) => {
      if (files && files[0]) loadGifSourceVideo(files[0]);
    });
  }

  if (changeGifVideoBtn) {
    changeGifVideoBtn.addEventListener('click', () => gifVideoFileInput && gifVideoFileInput.click());
  }

  // 비주얼 타임라인(눈금자, 트랙, 재생선, 클립 좌우 모서리 핸들) 마우스 드래그/클릭 인터랙션
  let nlePointerSession = null;

  function clientXToVideoTime(clientX) {
    if (!gifNleTimeline || !gifState.duration) return 0;
    const rect = gifNleTimeline.getBoundingClientRect();
    if (!rect.width) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Number((ratio * gifState.duration).toFixed(2));
  }

  if (gifNleTimeline) {
    gifNleTimeline.addEventListener('pointerdown', (e) => {
      if (!gifState.duration || gifState.isEncoding) return;
      if (e.target.closest('.nle-restore-gap-btn')) return;

      e.preventDefault();
      gifSourceVideo.pause();
      gifState.isLoopPreview = false;
      if (gifPlayPauseBtn) gifPlayPauseBtn.textContent = '▶️ 재생';

      const trimHandle = e.target.closest('.nle-trim-handle');
      const clipBlock = e.target.closest('.nle-clip-block');
      gifNleTimeline.setPointerCapture(e.pointerId);

      if (trimHandle) {
        const idx = parseInt(trimHandle.dataset.idx, 10);
        const side = trimHandle.dataset.trim; // 'left' | 'right'
        if (idx >= 0 && idx < gifState.cuts.length) {
          pushGifCutHistory();
          gifState.activeCutIdx = idx;
          nlePointerSession = {
            pointerId: e.pointerId,
            mode: side === 'left' ? 'trim-left' : 'trim-right',
            clipIdx: idx,
          };
          syncGifTimelineUI();
          return;
        }
      }

      if (clipBlock && !e.target.closest('.nle-playhead-head')) {
        const idx = parseInt(clipBlock.dataset.clipIdx, 10);
        if (idx >= 0 && idx < gifState.cuts.length) {
          gifState.activeCutIdx = idx;
          syncGifTimelineUI();
        }
      }

      // 기본 동작: 재생선(Playhead) 즉시 이동 및 드래그 스크러빙
      const newTime = clientXToVideoTime(e.clientX);
      const underIdx = gifState.cuts.findIndex((c) => newTime >= c.start && newTime <= c.end);
      if (underIdx >= 0 && underIdx !== gifState.activeCutIdx) {
        gifState.activeCutIdx = underIdx;
        syncGifTimelineUI();
      }
      gifSourceVideo.currentTime = newTime;
      updateGifPlayheadUI();

      nlePointerSession = {
        pointerId: e.pointerId,
        mode: 'scrub',
      };
    });

    gifNleTimeline.addEventListener('pointermove', (e) => {
      if (!nlePointerSession || e.pointerId !== nlePointerSession.pointerId) return;
      const t = clientXToVideoTime(e.clientX);
      const dur = gifState.duration || 10;

      if (nlePointerSession.mode === 'scrub') {
        gifSourceVideo.currentTime = t;
        updateGifPlayheadUI();
        return;
      }

      const idx = nlePointerSession.clipIdx;
      const cut = gifState.cuts[idx];
      if (!cut) return;

      const minBound = idx > 0 ? gifState.cuts[idx - 1].end : 0;
      const maxBound = idx < gifState.cuts.length - 1 ? gifState.cuts[idx + 1].start : dur;

      if (nlePointerSession.mode === 'trim-left') {
        cut.start = Math.max(minBound, Math.min(cut.end - 0.2, t));
        gifSourceVideo.currentTime = cut.start;
      } else if (nlePointerSession.mode === 'trim-right') {
        cut.end = Math.min(maxBound, Math.max(cut.start + 0.2, t));
        gifSourceVideo.currentTime = cut.end;
      }

      syncGifTimelineUI();
      updateGifPlayheadUI();
    });

    const endNlePointer = (e) => {
      if (nlePointerSession && e.pointerId === nlePointerSession.pointerId) {
        nlePointerSession = null;
      }
    };
    gifNleTimeline.addEventListener('pointerup', endNlePointer);
    gifNleTimeline.addEventListener('pointercancel', endNlePointer);
  }

  // 컷편집 툴바 버튼 바인딩
  if (gifSplitBtn) {
    gifSplitBtn.addEventListener('click', splitGifClipAtPlayhead);
  }
  if (gifDeleteCutBtn) {
    gifDeleteCutBtn.addEventListener('click', () => deleteGifCutByIndex(gifState.activeCutIdx));
  }
  if (gifKeepOnlyCutBtn) {
    gifKeepOnlyCutBtn.addEventListener('click', keepOnlyActiveGifClip);
  }
  if (gifUndoBtn) {
    gifUndoBtn.addEventListener('click', undoGifCutAction);
  }
  if (gifRedoBtn) {
    gifRedoBtn.addEventListener('click', redoGifCutAction);
  }
  if (gifSidebarUndoBtn) {
    gifSidebarUndoBtn.addEventListener('click', undoGifCutAction);
  }
  if (gifSidebarRedoBtn) {
    gifSidebarRedoBtn.addEventListener('click', redoGifCutAction);
  }
  if (gifResetCutsBtn) {
    gifResetCutsBtn.addEventListener('click', () => {
      if (!gifState.duration || gifState.isEncoding) return;
      pushGifCutHistory();
      gifState.cuts = [{ start: 0, end: Number(gifState.duration.toFixed(2)) }];
      gifState.activeCutIdx = 0;
      syncGifTimelineUI();
      showToast('🔄 모든 컷편집이 전체 영상 상태로 초기화되었습니다.');
    });
  }

  if (gifStepBackBtn) {
    gifStepBackBtn.addEventListener('click', () => {
      if (!gifSourceVideo || gifState.isEncoding) return;
      gifSourceVideo.pause();
      gifSourceVideo.currentTime = Math.max(0, (gifSourceVideo.currentTime || 0) - 0.1);
    });
  }
  if (gifStepFwdBtn) {
    gifStepFwdBtn.addEventListener('click', () => {
      if (!gifSourceVideo || gifState.isEncoding) return;
      gifSourceVideo.pause();
      gifSourceVideo.currentTime = Math.min(gifState.duration || 10, (gifSourceVideo.currentTime || 0) + 0.1);
    });
  }

  // 빈 구간에 새 컷 추가 버튼
  if (addGifCutBtn) {
    addGifCutBtn.addEventListener('click', () => {
      if (!gifState.duration || gifState.isEncoding) return;
      const dur = gifState.duration;

      // 비어 있는 삭제된 구간(Gap) 중 가장 큰 구간 찾기
      const gaps = [];
      let cursor = 0;
      gifState.cuts.forEach((cut) => {
        if (cut.start - cursor >= 0.3) gaps.push({ start: cursor, end: cut.start });
        cursor = cut.end;
      });
      if (dur - cursor >= 0.3) gaps.push({ start: cursor, end: dur });

      if (gaps.length === 0) {
        showToast('현재 타임라인에 빈 구간이 없습니다. 먼저 [✂️ 여기서 자르기]로 클립을 분할하거나 모서리를 줄여보세요!');
        return;
      }

      pushGifCutHistory();
      const targetGap = gaps[0];
      const newEnd = Math.min(targetGap.end, targetGap.start + 3.0);
      gifState.cuts.push({ start: targetGap.start, end: newEnd });
      normalizeCutsList();
      const idx = gifState.cuts.findIndex((c) => Math.abs(c.start - targetGap.start) < 0.15);
      if (idx >= 0) gifState.activeCutIdx = idx;
      syncGifTimelineUI();
      if (gifSourceVideo) {
        gifSourceVideo.pause();
        gifSourceVideo.currentTime = targetGap.start;
      }
      showToast('➕ 빈 구간에 새 컷이 추가되었습니다.');
    });
  }

  // 좌측 숫자 입력칸 & 시작/종료점 지정 버튼 연동
  if (gifStartTimeInput) {
    gifStartTimeInput.addEventListener('change', () => {
      const cut = gifState.cuts[gifState.activeCutIdx];
      if (!cut) return;
      pushGifCutHistory();
      const minBound = gifState.activeCutIdx > 0 ? gifState.cuts[gifState.activeCutIdx - 1].end : 0;
      cut.start = Math.max(minBound, Math.min(cut.end - 0.2, parseFloat(gifStartTimeInput.value) || 0));
      syncGifTimelineUI();
      if (gifSourceVideo && !gifState.isEncoding) {
        gifSourceVideo.currentTime = cut.start;
      }
    });
  }

  if (gifEndTimeInput) {
    gifEndTimeInput.addEventListener('change', () => {
      const cut = gifState.cuts[gifState.activeCutIdx];
      if (!cut) return;
      pushGifCutHistory();
      const dur = gifState.duration || 10;
      const maxBound =
        gifState.activeCutIdx < gifState.cuts.length - 1 ? gifState.cuts[gifState.activeCutIdx + 1].start : dur;
      cut.end = Math.min(maxBound, Math.max(cut.start + 0.2, parseFloat(gifEndTimeInput.value) || 1));
      syncGifTimelineUI();
      if (gifSourceVideo && !gifState.isEncoding) {
        gifSourceVideo.currentTime = cut.end;
      }
    });
  }

  if (setGifStartNowBtn) {
    setGifStartNowBtn.addEventListener('click', () => {
      if (!gifSourceVideo || !gifState.cuts[gifState.activeCutIdx]) return;
      const cut = gifState.cuts[gifState.activeCutIdx];
      const cur = gifSourceVideo.currentTime || 0;
      const minBound = gifState.activeCutIdx > 0 ? gifState.cuts[gifState.activeCutIdx - 1].end : 0;
      if (cur >= cut.end - 0.15 || cur < minBound) {
        showToast('선택된 컷의 종료 시간보다 앞선 위치에서 시작점을 지정해주세요.');
        return;
      }
      pushGifCutHistory();
      cut.start = Number(cur.toFixed(2));
      syncGifTimelineUI();
    });
  }

  if (setGifEndNowBtn) {
    setGifEndNowBtn.addEventListener('click', () => {
      if (!gifSourceVideo || !gifState.cuts[gifState.activeCutIdx]) return;
      const cut = gifState.cuts[gifState.activeCutIdx];
      const cur = gifSourceVideo.currentTime || 0;
      const dur = gifState.duration || 10;
      const maxBound =
        gifState.activeCutIdx < gifState.cuts.length - 1 ? gifState.cuts[gifState.activeCutIdx + 1].start : dur;
      if (cur <= cut.start + 0.15 || cur > maxBound) {
        showToast('선택된 컷의 시작 시간보다 뒤쪽 위치에서 종료점을 지정해주세요.');
        return;
      }
      pushGifCutHistory();
      cut.end = Number(cur.toFixed(2));
      syncGifTimelineUI();
    });
  }

  if (gifPlayPauseBtn) {
    gifPlayPauseBtn.addEventListener('click', () => {
      if (!gifSourceVideo || gifState.isEncoding) return;
      gifState.isLoopPreview = false;
      if (gifSourceVideo.paused) {
        if (gifSourceVideo.currentTime >= (gifState.duration || 10) - 0.1) {
          gifSourceVideo.currentTime = 0;
        }
        gifSourceVideo.play().then(() => {
          gifPlayPauseBtn.textContent = '⏸️ 일시정지';
          startGifPreviewLoop();
        }).catch(() => {});
      } else {
        gifSourceVideo.pause();
        gifPlayPauseBtn.textContent = '▶️ 재생';
      }
    });
  }

  if (previewGifLoopBtn) {
    previewGifLoopBtn.addEventListener('click', () => {
      if (!gifSourceVideo || gifState.isEncoding || gifState.cuts.length === 0) return;
      if (!gifSourceVideo.paused && gifState.isLoopPreview) {
        gifSourceVideo.pause();
        gifState.isLoopPreview = false;
        if (gifPlayPauseBtn) gifPlayPauseBtn.textContent = '▶️ 재생';
        return;
      }
      gifState.isLoopPreview = true;
      gifState.previewCutIdx = 0;
      gifState.activeCutIdx = 0;
      syncGifTimelineUI();
      gifSourceVideo.currentTime = gifState.cuts[0].start;
      gifSourceVideo.play().then(() => {
        if (gifPlayPauseBtn) {
          gifPlayPauseBtn.textContent = `⏸️ 편집본 연속 재생 중`;
        }
        startGifPreviewLoop();
      }).catch(() => {});
    });
  }

  // 동영상 -> GIF 탭 전용 키보드 단축키 지원 (Ctrl+Z, Ctrl+Y, S: 자르기, Delete: 선택 컷 삭제, Space: 재생/일시정지)
  window.addEventListener(
    'keydown',
    (e) => {
      const gifTabEl = document.getElementById('tab-video-gif');
      const isGifActive =
        activeTabId === 'video-gif' || Boolean(gifTabEl && gifTabEl.classList.contains('active'));
      if (!isGifActive || !gifState.file || gifState.isEncoding) return;

      const target = e.target;
      if (target && target.tagName) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'textarea' || tag === 'select') return;
        if (tag === 'input') {
          const type = (target.type || '').toLowerCase();
          if (type === 'text' || type === 'number' || type === 'url' || type === 'search') return;
        }
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      if (isCtrlOrMeta) {
        const isZ = code === 'KeyZ' || key === 'z' || key === 'ㅋ';
        const isY = code === 'KeyY' || key === 'y' || key === 'ㅛ';
        if (isZ && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          undoGifCutAction();
        } else if (isY || (isZ && e.shiftKey)) {
          e.preventDefault();
          e.stopPropagation();
          redoGifCutAction();
        }
        return;
      }

      if (code === 'KeyS' || key === 's' || key === 'ㄴ') {
        e.preventDefault();
        splitGifClipAtPlayhead();
      } else if (key === 'delete' || key === 'backspace') {
        e.preventDefault();
        deleteGifCutByIndex(gifState.activeCutIdx);
      } else if (code === 'Space' || key === ' ') {
        e.preventDefault();
        if (gifPlayPauseBtn) gifPlayPauseBtn.click();
      }
    },
    true
  );

  // 비율 프리셋 클릭
  if (gifRatioGrid) {
    gifRatioGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (!btn) return;
      applyGifRatioToCropBox(btn.dataset.ratio);
    });
  }

  // 빠른 사이즈 칩 클릭 (320px, 480px, 640px, 원본크기)
  if (gifQuickSizeChips) {
    gifQuickSizeChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (!btn) return;
      gifQuickSizeChips.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const rawVal = btn.dataset.gifw;
      gifState.quickWidth = rawVal === 'orig' ? 'orig' : parseInt(rawVal, 10) || 480;
      gifState.userTypedSize = false;
      if (gifForceExactSize) gifForceExactSize.checked = true;
      updateGifCropBoxDOM();
    });
  }

  // 가로/세로 픽셀 직접 입력 시 연동
  function syncGifCropBoxToTypedSize() {
    if (!gifState.dispW || !gifState.dispH) return;
    const tw = parseInt(gifTargetW.value, 10);
    const th = parseInt(gifTargetH.value, 10);
    gifState.userTypedSize = Boolean((Number.isFinite(tw) && tw > 0) || (Number.isFinite(th) && th > 0));
    if (gifState.userTypedSize && gifForceExactSize) {
      gifForceExactSize.checked = true;
    }

    if (Number.isFinite(tw) && tw > 0 && Number.isFinite(th) && th > 0 && !gifKeepAspectInput.checked) {
      const targetRatio = tw / th;
      const maxW = gifState.dispW;
      const maxH = gifState.dispH;
      let newW = maxW;
      let newH = newW / targetRatio;
      if (newH > maxH) {
        newH = maxH;
        newW = newH * targetRatio;
      }
      gifState.box = {
        x: Math.round((maxW - newW) / 2),
        y: Math.round((maxH - newH) / 2),
        w: Math.round(newW),
        h: Math.round(newH),
      };
    }
    updateGifCropBoxDOM(true);
  }

  if (gifTargetW) {
    gifTargetW.addEventListener('input', () => {
      const w = parseInt(gifTargetW.value, 10);
      if (gifKeepAspectInput && gifKeepAspectInput.checked && gifState.box.w > 0 && Number.isFinite(w) && w > 0) {
        gifTargetH.value = Math.max(16, Math.round((w * gifState.box.h) / gifState.box.w));
      }
      syncGifCropBoxToTypedSize();
    });
  }

  if (gifTargetH) {
    gifTargetH.addEventListener('input', () => {
      const h = parseInt(gifTargetH.value, 10);
      if (gifKeepAspectInput && gifKeepAspectInput.checked && gifState.box.h > 0 && Number.isFinite(h) && h > 0) {
        gifTargetW.value = Math.max(16, Math.round((h * gifState.box.w) / gifState.box.h));
      }
      syncGifCropBoxToTypedSize();
    });
  }

  if (gifForceExactSize) {
    gifForceExactSize.addEventListener('change', () => updateGifCropBoxDOM(true));
  }

  // GIF 크롭 박스 마우스 드래그 & 리사이즈 핸들러
  let gifDragInfo = null;
  if (gifCropBox) {
    gifCropBox.addEventListener('pointerdown', (e) => {
      if (!gifState.dispW || gifState.isEncoding) return;
      e.preventDefault();
      e.stopPropagation();
      const handleEl = e.target.closest('.crop-handle');
      const mode = handleEl ? handleEl.dataset.handle : 'move';
      gifCropBox.setPointerCapture(e.pointerId);
      gifDragInfo = {
        pointerId: e.pointerId,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        startBox: { ...gifState.box },
      };
    });

    gifCropBox.addEventListener('pointermove', (e) => {
      if (!gifDragInfo || e.pointerId !== gifDragInfo.pointerId) return;
      const dx = e.clientX - gifDragInfo.startX;
      const dy = e.clientY - gifDragInfo.startY;
      const sb = gifDragInfo.startBox;
      const maxW = gifState.dispW;
      const maxH = gifState.dispH;
      const minSize = 24;

      if (gifDragInfo.mode === 'move') {
        const nx = Math.max(0, Math.min(maxW - sb.w, sb.x + dx));
        const ny = Math.max(0, Math.min(maxH - sb.h, sb.y + dy));
        gifState.box.x = Math.round(nx);
        gifState.box.y = Math.round(ny);
        updateGifCropBoxDOM(true);
        return;
      }

      if (gifState.ratio === 'full') {
        gifState.ratio = 'free';
        if (gifRatioGrid) {
          gifRatioGrid.querySelectorAll('.chip-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.ratio === 'free');
          });
        }
      }

      let { x, y, w, h } = sb;
      const m = gifDragInfo.mode;

      if (m.includes('e')) w = Math.max(minSize, Math.min(maxW - x, sb.w + dx));
      if (m.includes('s')) h = Math.max(minSize, Math.min(maxH - y, sb.h + dy));
      if (m.includes('w')) {
        const maxLeftDx = sb.w - minSize;
        const clampedDx = Math.max(-sb.x, Math.min(maxLeftDx, dx));
        x = sb.x + clampedDx;
        w = sb.w - clampedDx;
      }
      if (m.includes('n')) {
        const maxTopDy = sb.h - minSize;
        const clampedDy = Math.max(-sb.y, Math.min(maxTopDy, dy));
        y = sb.y + clampedDy;
        h = sb.h - clampedDy;
      }

      if (gifState.ratio !== 'free' && gifState.ratio !== 'full') {
        const parts = gifState.ratio.split(':').map(Number);
        if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
          const r = parts[0] / parts[1];
          if (m === 'n' || m === 's') {
            w = h * r;
          } else {
            h = w / r;
          }
          if (x + w > maxW) {
            w = maxW - x;
            h = w / r;
          }
          if (y + h > maxH) {
            h = maxH - y;
            w = h * r;
          }
        }
      }

      gifState.box = {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.max(minSize, Math.round(w)),
        h: Math.max(minSize, Math.round(h)),
      };
      updateGifCropBoxDOM();
    });

    const endGifDrag = (e) => {
      if (gifDragInfo && e.pointerId === gifDragInfo.pointerId) {
        gifDragInfo = null;
      }
    };
    gifCropBox.addEventListener('pointerup', endGifDrag);
    gifCropBox.addEventListener('pointercancel', endGifDrag);
  }

  /* --------------------------------------------------------------------------
     순수 JS GIF89a 애니메이션 인코더 (256컬러 팔레트 + Bayer 디더링 + 고속 LZW)
     -------------------------------------------------------------------------- */
  function createGifPalette256() {
    const pal = new Uint8Array(256 * 3);
    let idx = 0;
    // 0..215: 6x6x6 표준 웹 세이프 큐브
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          pal[idx * 3] = r * 51;
          pal[idx * 3 + 1] = g * 51;
          pal[idx * 3 + 2] = b * 51;
          idx++;
        }
      }
    }
    // 216..255: 40단계 정밀 그레이스케일 보강
    for (let i = 0; i < 40; i++) {
      const v = Math.round(((i + 0.5) / 40) * 255);
      pal[idx * 3] = v;
      pal[idx * 3 + 1] = v;
      pal[idx * 3 + 2] = v;
      idx++;
    }
    return pal;
  }

  const GIF_GLOBAL_PALETTE = createGifPalette256();
  const BAYER_4X4 = [
    [-7, 1, -5, 3],
    [5, -3, 7, -1],
    [-4, 4, -6, 2],
    [8, 0, 6, -2],
  ];

  function quantizeRgbaToGifIndices(rgba, width, height, outIndices) {
    let p = 0;
    for (let y = 0; y < height; y++) {
      const bayerRow = BAYER_4X4[y & 3];
      for (let x = 0; x < width; x++) {
        const i4 = p << 2;
        const dither = bayerRow[x & 3];
        const r = Math.max(0, Math.min(255, rgba[i4] + dither));
        const g = Math.max(0, Math.min(255, rgba[i4 + 1] + dither));
        const b = Math.max(0, Math.min(255, rgba[i4 + 2] + dither));

        // 그레이스케일에 매우 가까운 픽셀은 40단계 정밀 그레이 팔레트와 비교
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        const rq = Math.round(r / 51);
        const gq = Math.round(g / 51);
        const bq = Math.round(b / 51);
        const cubeIdx = rq * 36 + gq * 6 + bq;

        if (maxDiff <= 10) {
          const cr = rq * 51;
          const cg = gq * 51;
          const cb = bq * 51;
          const cubeErr = (r - cr) * (r - cr) + (g - cg) * (g - cg) + (b - cb) * (b - cb);

          const lum = (r + g + b) / 3;
          const gStep = Math.max(0, Math.min(39, Math.floor((lum / 256) * 40)));
          const gv = GIF_GLOBAL_PALETTE[(216 + gStep) * 3];
          const grayErr = (r - gv) * (r - gv) + (g - gv) * (g - gv) + (b - gv) * (b - gv);

          outIndices[p] = grayErr < cubeErr ? 216 + gStep : cubeIdx;
        } else {
          outIndices[p] = cubeIdx;
        }
        p++;
      }
    }
  }

  function lzwEncodeGifFrame(indices, trieBuffer) {
    const outBytes = [];
    const minCodeSize = 8;
    outBytes.push(minCodeSize);

    const clearCode = 256;
    const eoiCode = 257;

    let codeSize = 9;
    let maxCode = 512;
    let nextCode = 258;

    trieBuffer.fill(-1);

    let curBits = 0;
    let curVal = 0;
    const subBlock = new Uint8Array(255);
    let subLen = 0;

    const flushSubBlock = () => {
      if (subLen > 0) {
        outBytes.push(subLen);
        for (let i = 0; i < subLen; i++) {
          outBytes.push(subBlock[i]);
        }
        subLen = 0;
      }
    };

    const writeCode = (code) => {
      curVal |= code << curBits;
      curBits += codeSize;
      while (curBits >= 8) {
        subBlock[subLen++] = curVal & 0xff;
        if (subLen === 255) flushSubBlock();
        curVal >>= 8;
        curBits -= 8;
      }
    };

    writeCode(clearCode);

    if (indices.length > 0) {
      let prefix = indices[0];
      for (let i = 1; i < indices.length; i++) {
        const k = indices[i];
        const key = (prefix << 8) | k;
        const next = trieBuffer[key];
        if (next !== -1) {
          prefix = next;
        } else {
          writeCode(prefix);
          trieBuffer[key] = nextCode;
          if (nextCode === 4095) {
            writeCode(clearCode);
            codeSize = 9;
            maxCode = 512;
            nextCode = 258;
            trieBuffer.fill(-1);
          } else {
            if (nextCode === maxCode) {
              codeSize++;
              maxCode = 1 << codeSize;
            }
            nextCode++;
          }
          prefix = k;
        }
      }
      writeCode(prefix);
    }

    writeCode(eoiCode);
    if (curBits > 0) {
      subBlock[subLen++] = curVal & 0xff;
      if (subLen === 255) flushSubBlock();
    }
    flushSubBlock();
    outBytes.push(0x00); // Block terminator
    return new Uint8Array(outBytes);
  }

  function seekVideoToTime(videoEl, timeSec) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        videoEl.removeEventListener('seeked', finish);
        resolve();
      };
      videoEl.addEventListener('seeked', finish);
      const timer = setTimeout(finish, 1200);
      try {
        videoEl.currentTime = timeSec;
      } catch (_) {
        clearTimeout(timer);
        finish();
      }
    });
  }

  function getGifCropAndOutputGeometry(ensureEven = false) {
    const b = gifState.box;
    const sx = Math.max(0, Math.round(b.x / gifState.scale));
    const sy = Math.max(0, Math.round(b.y / gifState.scale));
    const sw = Math.max(1, Math.min(gifState.origW - sx, Math.round(b.w / gifState.scale)));
    const sh = Math.max(1, Math.min(gifState.origH - sy, Math.round(b.h / gifState.scale)));

    let outW = sw;
    let outH = sh;
    const customW = parseInt(gifTargetW && gifTargetW.value, 10);
    const customH = parseInt(gifTargetH && gifTargetH.value, 10);
    const hasCustomW = Number.isFinite(customW) && customW > 0;
    const hasCustomH = Number.isFinite(customH) && customH > 0;

    if (gifForceExactSize && gifForceExactSize.checked && (hasCustomW || hasCustomH)) {
      if (hasCustomW && hasCustomH) {
        outW = customW;
        outH = customH;
      } else if (hasCustomW) {
        outW = customW;
        outH = Math.max(1, Math.round((sh / sw) * customW));
      } else if (hasCustomH) {
        outH = customH;
        outW = Math.max(1, Math.round((sw / sh) * customH));
      }
    }

    outW = Math.max(16, Math.min(1920, outW));
    outH = Math.max(16, Math.min(1920, outH));
    if (ensureEven) {
      outW = Math.max(16, outW - (outW % 2));
      outH = Math.max(16, outH - (outH % 2));
    }
    return { sx, sy, sw, sh, outW, outH };
  }

  function setGifExportEncodingState(encoding) {
    gifState.isEncoding = encoding;
    if (startMp4CutExportBtn) startMp4CutExportBtn.disabled = encoding;
    if (startGifConvertBtn) startGifConvertBtn.disabled = encoding;
    if (quickMp4ExportBtn) quickMp4ExportBtn.disabled = encoding;
    if (quickGifExportBtn) quickGifExportBtn.disabled = encoding;
    if (cancelGifConvertBtn) cancelGifConvertBtn.classList.toggle('hidden', !encoding);
    if (gifProgressPanel) gifProgressPanel.classList.toggle('hidden', !encoding);
    updateGifUndoRedoBtns();
  }

  if (cancelGifConvertBtn) {
    cancelGifConvertBtn.addEventListener('click', () => {
      gifState.cancelRequested = true;
      if (gifState.abortMp4Fn) gifState.abortMp4Fn();
    });
  }

  // 🎬 다중 컷편집 + 화면 크롭/사이즈 적용 MP4 동영상 내보내기 (시간 제한 없음, 오디오 포함 지원)
  async function exportCutEditedVideoAsMp4() {
    if (!gifState.file || !gifSourceVideo || gifState.isEncoding) return;

    gifSourceVideo.pause();
    if (gifState.rafId) {
      cancelAnimationFrame(gifState.rafId);
      gifState.rafId = null;
    }

    const { sx, sy, sw, sh, outW, outH } = getGifCropAndOutputGeometry(true);
    const speed = parseFloat(gifSpeedSelect && gifSpeedSelect.value) || 1.0;
    const includeAudio = Boolean(gifIncludeAudioInput && gifIncludeAudioInput.checked);
    const activeCuts =
      gifState.cuts && gifState.cuts.length > 0
        ? cloneCuts(gifState.cuts)
        : [{ start: gifState.startTime, end: gifState.endTime }];

    const totalCutDuration = activeCuts.reduce((acc, c) => acc + Math.max(0.1, c.end - c.start), 0);

    setGifExportEncodingState(true);
    gifState.cancelRequested = false;
    gifResultBox.classList.add('hidden');
    if (gifResultPreviewVideo) {
      gifResultPreviewVideo.pause();
      gifResultPreviewVideo.removeAttribute('src');
    }

    const workCanvas = document.createElement('canvas');
    workCanvas.width = outW;
    workCanvas.height = outH;
    const workCtx = workCanvas.getContext('2d');
    workCtx.imageSmoothingEnabled = true;
    workCtx.imageSmoothingQuality = 'high';

    const tempVideo = document.createElement('video');
    tempVideo.src = gifState.videoUrl;
    tempVideo.playsInline = true;
    tempVideo.preload = 'auto';
    tempVideo.muted = !includeAudio;

    let audioCtx = null;
    let recorder = null;
    let drawTimer = null;

    try {
      await new Promise((resolve, reject) => {
        tempVideo.onloadedmetadata = resolve;
        tempVideo.onerror = () => reject(new Error('영상 디코딩 실패'));
        setTimeout(resolve, 1500);
      });

      const stream = workCanvas.captureStream(30);
      if (includeAudio) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioContextClass();
          const sourceNode = audioCtx.createMediaElementSource(tempVideo);
          const destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destNode);
          destNode.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        } catch (_) {
          // 오디오 트랙이 없는 영상이거나 브라우저 제약 시 무음 영상으로 계속 진행
        }
      }

      const mimeCandidates = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9,opus',
        'video/webm',
      ];
      const chosenMime =
        mimeCandidates.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';

      const targetBitrate = Math.max(2500000, Math.min(8000000, outW * outH * 6));
      const recOptions = { videoBitsPerSecond: targetBitrate };
      if (chosenMime) recOptions.mimeType = chosenMime;

      recorder = new MediaRecorder(stream, recOptions);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const stopPromise = new Promise((resolve) => {
        recorder.onstop = () => resolve();
      });

      gifState.abortMp4Fn = () => {
        try {
          if (drawTimer) clearInterval(drawTimer);
          tempVideo.pause();
          if (recorder && recorder.state !== 'inactive') recorder.stop();
        } catch (_) {}
      };

      let elapsedBeforeCut = 0;

      for (let cIdx = 0; cIdx < activeCuts.length; cIdx++) {
        if (gifState.cancelRequested) throw new Error('USER_CANCELLED');
        const cut = activeCuts[cIdx];
        const cutSpan = Math.max(0.15, cut.end - cut.start);

        await seekVideoToTime(tempVideo, cut.start);
        workCtx.clearRect(0, 0, outW, outH);
        workCtx.drawImage(tempVideo, sx, sy, sw, sh, 0, 0, outW, outH);

        // 메인 미리보기 화면 및 재생선도 함께 동기화
        gifSourceVideo.currentTime = cut.start;
        drawGifVideoFrame();
        updateGifPlayheadUI();

        if (recorder.state === 'inactive') {
          recorder.start(100);
        } else if (recorder.state === 'paused') {
          recorder.resume();
        }

        tempVideo.playbackRate = speed;

        await new Promise((resolveCut, rejectCut) => {
          const finishCut = () => {
            if (drawTimer) {
              clearInterval(drawTimer);
              drawTimer = null;
            }
            tempVideo.pause();
            if (recorder && recorder.state === 'recording') {
              try {
                recorder.pause();
              } catch (_) {}
            }
            resolveCut();
          };

          drawTimer = setInterval(() => {
            if (gifState.cancelRequested) {
              if (drawTimer) clearInterval(drawTimer);
              tempVideo.pause();
              rejectCut(new Error('USER_CANCELLED'));
              return;
            }

            const curT = tempVideo.currentTime || cut.start;
            workCtx.drawImage(tempVideo, sx, sy, sw, sh, 0, 0, outW, outH);

            // 타임라인 재생선 및 진행률 실시간 표시
            const curElapsed = elapsedBeforeCut + Math.max(0, Math.min(cutSpan, curT - cut.start));
            const pct = Math.min(99, Math.max(1, Math.round((curElapsed / totalCutDuration) * 100)));
            if (gifProgressStatus) {
              gifProgressStatus.textContent = `🎬 MP4 동영상 컷 인코딩 중... [컷 ${cIdx + 1}/${activeCuts.length}] (${curElapsed.toFixed(1)}s / ${totalCutDuration.toFixed(1)}s · ${outW}×${outH}px)`;
            }
            if (gifProgressPercent) gifProgressPercent.textContent = `${pct}%`;
            if (gifProgressBar) gifProgressBar.style.width = `${pct}%`;

            if ( gifNlePlayhead && gifState.duration > 0) {
              gifNlePlayhead.style.left = `${Math.min(100, (curT / gifState.duration) * 100)}%`;
            }

            if (curT >= cut.end - 0.02 || tempVideo.ended) {
              finishCut();
            }
          }, 16);

          tempVideo.play().catch((err) => {
            if (drawTimer) clearInterval(drawTimer);
            rejectCut(err);
          });
        });

        elapsedBeforeCut += cutSpan;
      }

      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      await stopPromise;

      if (gifState.cancelRequested) throw new Error('USER_CANCELLED');

      const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
      if (gifState.resultBlobUrl) URL.revokeObjectURL(gifState.resultBlobUrl);
      gifState.resultBlobUrl = URL.createObjectURL(mp4Blob);

      if (gifResultBadgeTag) {
        gifResultBadgeTag.textContent = '🎬 MP4 컷편집 영상 생성 완료';
      }
      if (gifResultPreviewImg) {
        gifResultPreviewImg.classList.add('hidden');
        gifResultPreviewImg.removeAttribute('src');
      }
      if (gifResultPreviewVideo) {
        gifResultPreviewVideo.classList.remove('hidden');
        gifResultPreviewVideo.src = gifState.resultBlobUrl;
      }
      if (gifResultStatText) {
        gifResultStatText.textContent = `${outW} × ${outH} px · 총 ${activeCuts.length}컷 (${totalCutDuration.toFixed(1)}초) · 용량: ${formatBytes(mp4Blob.size)}`;
      }
      if (downloadGifResultBtn) {
        const baseName = getBaseName(gifState.file.name);
        downloadGifResultBtn.href = gifState.resultBlobUrl;
        downloadGifResultBtn.download = `${baseName}_cut_${outW}x${outH}.mp4`;
        downloadGifResultBtn.textContent = `💾 편집된 MP4 동영상 다운로드 (.mp4)`;
      }

      gifResultBox.classList.remove('hidden');
      showToast(`🎬 MP4 컷편집 동영상 생성 완료! (${outW}×${outH}px, ${formatBytes(mp4Blob.size)})`);
    } catch (err) {
      if (err && err.message === 'USER_CANCELLED') {
        showToast('MP4 동영상 생성이 취소되었습니다.');
      } else {
        console.error(err);
        showToast('MP4 동영상 인코딩 중 오류가 발생했습니다.');
      }
    } finally {
      if (drawTimer) clearInterval(drawTimer);
      tempVideo.pause();
      tempVideo.removeAttribute('src');
      tempVideo.load();
      if (audioCtx) {
        try {
          await audioCtx.close();
        } catch (_) {}
      }
      gifState.abortMp4Fn = null;
      setGifExportEncodingState(false);
    }
  }

  if (startMp4CutExportBtn) {
    startMp4CutExportBtn.addEventListener('click', exportCutEditedVideoAsMp4);
  }
  if (quickMp4ExportBtn) {
    quickMp4ExportBtn.addEventListener('click', exportCutEditedVideoAsMp4);
  }
  if (quickGifExportBtn) {
    quickGifExportBtn.addEventListener('click', () => {
      if (startGifConvertBtn) startGifConvertBtn.click();
    });
  }

  if (startGifConvertBtn) {
    startGifConvertBtn.addEventListener('click', async () => {
      if (!gifState.file || !gifSourceVideo || gifState.isEncoding) return;

      const totalCutDur = getTotalGifCutsDuration(-1);
      if (totalCutDur > GIF_MAX_DURATION + 0.1) {
        showToast(
          `현재 남은 컷 합계가 ${totalCutDur.toFixed(1)}초입니다. GIF 움짤은 15초 이하로 줄이거나, 길이 제한 없는 [🎬 MP4 영상 저장]을 이용해주세요!`,
          'error'
        );
        return;
      }

      gifSourceVideo.pause();
      if (gifState.rafId) {
        cancelAnimationFrame(gifState.rafId);
        gifState.rafId = null;
      }

      const { sx, sy, sw, sh, outW, outH } = getGifCropAndOutputGeometry(false);

      const fps = parseInt(gifFpsSelect && gifFpsSelect.value, 10) || 12;
      const speed = parseFloat(gifSpeedSelect && gifSpeedSelect.value) || 1.0;
      const stepSec = speed / fps;
      const delayCs = Math.max(2, Math.round(100 / fps)); // 1/100초 단위

      // 다중 컷(구간) 전체에서 추출할 프레임 타임스탬프 목록 생성
      const frameList = [];
      const activeCuts =
        gifState.cuts && gifState.cuts.length > 0
          ? gifState.cuts
          : [{ start: gifState.startTime, end: gifState.endTime }];

      for (let cIdx = 0; cIdx < activeCuts.length; cIdx++) {
        const cut = activeCuts[cIdx];
        const cutSpan = Math.max(0.2, cut.end - cut.start);
        const cutFrames = Math.max(1, Math.ceil(cutSpan / stepSec));
        for (let i = 0; i < cutFrames; i++) {
          if (frameList.length >= 300) break;
          const t = Math.min(cut.end, cut.start + i * stepSec);
          frameList.push({ time: t, cutNum: cIdx + 1 });
        }
      }
      if (frameList.length < 2) {
        frameList.push({ time: activeCuts[0].end, cutNum: 1 });
      }
      const totalFrames = frameList.length;

      setGifExportEncodingState(true);
      gifState.cancelRequested = false;
      gifResultBox.classList.add('hidden');
      if (gifResultPreviewVideo) {
        gifResultPreviewVideo.pause();
        gifResultPreviewVideo.removeAttribute('src');
      }

      const workCanvas = document.createElement('canvas');
      workCanvas.width = outW;
      workCanvas.height = outH;
      const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
      workCtx.imageSmoothingEnabled = true;
      workCtx.imageSmoothingQuality = 'high';

      const chunks = [];
      // 1) GIF89a Header + Logical Screen Descriptor (13 bytes)
      const header = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
        outW & 0xff, (outW >> 8) & 0xff,
        outH & 0xff, (outH >> 8) & 0xff,
        0xf7, // Global Color Table (256 colors)
        0x00,
        0x00,
      ]);
      chunks.push(header);
      // 2) Global Color Table (768 bytes)
      chunks.push(GIF_GLOBAL_PALETTE);
      // 3) Netscape 2.0 Infinite Loop Extension (19 bytes)
      chunks.push(
        new Uint8Array([
          0x21, 0xff, 0x0b,
          0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
          0x03, 0x01, 0x00, 0x00, 0x00,
        ])
      );

      const indicesBuf = new Uint8Array(outW * outH);
      const trieBuffer = new Int32Array(4096 * 256);

      try {
        for (let f = 0; f < totalFrames; f++) {
          if (gifState.cancelRequested) {
            throw new Error('USER_CANCELLED');
          }

          const frameInfo = frameList[f];
          const t = frameInfo.time;
          const pct = Math.round(((f + 1) / totalFrames) * 100);
          if (gifProgressStatus) {
            const cutLabel = activeCuts.length > 1 ? `[컷 ${frameInfo.cutNum}/${activeCuts.length}] ` : '';
            gifProgressStatus.textContent = `${cutLabel}GIF 프레임 추출 및 인코딩 중... (${f + 1} / ${totalFrames} 프레임 · ${outW}×${outH}px)`;
          }
          if (gifProgressPercent) gifProgressPercent.textContent = `${pct}%`;
          if (gifProgressBar) gifProgressBar.style.width = `${pct}%`;

          await seekVideoToTime(gifSourceVideo, t);
          drawGifVideoFrame();
          updateGifPlayheadUI();

          workCtx.clearRect(0, 0, outW, outH);
          workCtx.drawImage(gifSourceVideo, sx, sy, sw, sh, 0, 0, outW, outH);
          const imgData = workCtx.getImageData(0, 0, outW, outH);

          quantizeRgbaToGifIndices(imgData.data, outW, outH, indicesBuf);
          const compressedBlock = lzwEncodeGifFrame(indicesBuf, trieBuffer);

          // Graphic Control Extension (8 bytes) + Image Descriptor (10 bytes)
          const frameHeader = new Uint8Array([
            0x21, 0xf9, 0x04, 0x04,
            delayCs & 0xff, (delayCs >> 8) & 0xff,
            0x00, 0x00,
            0x2c,
            0x00, 0x00, 0x00, 0x00,
            outW & 0xff, (outW >> 8) & 0xff,
            outH & 0xff, (outH >> 8) & 0xff,
            0x00,
          ]);
          chunks.push(frameHeader);
          chunks.push(compressedBlock);

          // UI 스레드 양보
          await new Promise((r) => setTimeout(r, 0));
        }

        // GIF Trailer (0x3B)
        chunks.push(new Uint8Array([0x3b]));

        const gifBlob = new Blob(chunks, { type: 'image/gif' });
        if (gifState.resultBlobUrl) URL.revokeObjectURL(gifState.resultBlobUrl);
        gifState.resultBlobUrl = URL.createObjectURL(gifBlob);

        if (gifResultBadgeTag) {
          gifResultBadgeTag.textContent = '🎉 GIF 움짤 생성 완료';
        }
        if (gifResultPreviewVideo) {
          gifResultPreviewVideo.classList.add('hidden');
          gifResultPreviewVideo.removeAttribute('src');
        }
        if (gifResultPreviewImg) {
          gifResultPreviewImg.classList.remove('hidden');
          gifResultPreviewImg.src = gifState.resultBlobUrl;
        }
        if (gifResultStatText) {
          gifResultStatText.textContent = `${outW} × ${outH} px · 총 ${activeCuts.length}컷 (${totalFrames}프레임, ${fps} FPS) · 용량: ${formatBytes(gifBlob.size)}`;
        }
        if (downloadGifResultBtn) {
          const baseName = getBaseName(gifState.file.name);
          downloadGifResultBtn.href = gifState.resultBlobUrl;
          downloadGifResultBtn.download = `${baseName}_${outW}x${outH}.gif`;
          downloadGifResultBtn.textContent = `💾 생성된 GIF 움짤 다운로드 (.gif)`;
        }

        gifResultBox.classList.remove('hidden');
        showToast(`GIF 변환 완료! (${outW}×${outH}px, ${formatBytes(gifBlob.size)})`);
      } catch (err) {
        if (err && err.message === 'USER_CANCELLED') {
          showToast('GIF 변환이 취소되었습니다.');
        } else {
          console.error(err);
          showToast('GIF 변환 중 오류가 발생했습니다.');
        }
      } finally {
        setGifExportEncodingState(false);
      }
    });
  }

  /* ==========================================================================
     [8] 탭 3-3: 동영상 확장자 변환 · 오디오 추출 (MP4 ↔ MOV ↔ WebM · WAV)
     ========================================================================== */
  const videoConvertDropzone = document.getElementById('videoConvertDropzone');
  const videoConvertFileInput = document.getElementById('videoConvertFileInput');
  const videoConvertWorkCard = document.getElementById('videoConvertWorkCard');

  const videoConvertFormatGrid = document.getElementById('videoConvertFormatGrid');
  const videoConvertMethodGroup = document.getElementById('videoConvertMethodGroup');
  const videoConvertMethodSelect = document.getElementById('videoConvertMethodSelect');
  const videoConvertEncodeOpts = document.getElementById('videoConvertEncodeOpts');
  const vconvResolution = document.getElementById('vconvResolution');
  const vconvBitrate = document.getElementById('vconvBitrate');

  const startVideoConvertBtn = document.getElementById('startVideoConvertBtn');
  const cancelVideoConvertBtn = document.getElementById('cancelVideoConvertBtn');
  const changeVideoConvertBtn = document.getElementById('changeVideoConvertBtn');

  const vconvFileName = document.getElementById('vconvFileName');
  const vconvMetaInfo = document.getElementById('vconvMetaInfo');
  const vconvTargetBadge = document.getElementById('vconvTargetBadge');

  const vconvProgressPanel = document.getElementById('vconvProgressPanel');
  const vconvProgressStatus = document.getElementById('vconvProgressStatus');
  const vconvProgressPercent = document.getElementById('vconvProgressPercent');
  const vconvProgressBar = document.getElementById('vconvProgressBar');

  const vconvOrigPlayer = document.getElementById('vconvOrigPlayer');
  const vconvResultBox = document.getElementById('vconvResultBox');
  const vconvResultTag = document.getElementById('vconvResultTag');
  const vconvResultVideoPlayer = document.getElementById('vconvResultVideoPlayer');
  const vconvResultAudioPlayer = document.getElementById('vconvResultAudioPlayer');
  const vconvResultStatText = document.getElementById('vconvResultStatText');
  const downloadVconvResultBtn = document.getElementById('downloadVconvResultBtn');

  let vconvState = {
    file: null,
    origUrl: null,
    resultUrl: null,
    targetFmt: 'mp4',
    origW: 0,
    origH: 0,
    duration: 0,
    isConverting: false,
    abortFn: null,
  };

  function updateVconvOptionVisibility() {
    const fmt = vconvState.targetFmt;
    if (vconvTargetBadge) {
      vconvTargetBadge.textContent = `목표 포맷: ${fmt.toUpperCase()}`;
    }
    const isAudioOnly = fmt === 'wav' || fmt === 'm4a';
    if (isAudioOnly) {
      if (videoConvertMethodGroup) videoConvertMethodGroup.classList.add('hidden');
      if (videoConvertEncodeOpts) videoConvertEncodeOpts.classList.add('hidden');
    } else {
      if (videoConvertMethodGroup) videoConvertMethodGroup.classList.remove('hidden');
      const method = videoConvertMethodSelect ? videoConvertMethodSelect.value : 'auto';
      if (videoConvertEncodeOpts) {
        videoConvertEncodeOpts.classList.toggle('hidden', method === 'remux');
      }
    }
  }

  if (videoConvertFormatGrid) {
    videoConvertFormatGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.format-card, .format-pill');
      if (!card) return;
      videoConvertFormatGrid
        .querySelectorAll('.format-card, .format-pill')
        .forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      vconvState.targetFmt = card.dataset.vfmt || 'mp4';
      updateVconvOptionVisibility();
    });
  }

  if (videoConvertMethodSelect) {
    videoConvertMethodSelect.addEventListener('change', updateVconvOptionVisibility);
  }

  function loadVideoConvertFile(file) {
    if (!file || (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name))) {
      showToast('변환할 동영상 파일을 선택해주세요.');
      return;
    }

    if (vconvState.origUrl) URL.revokeObjectURL(vconvState.origUrl);
    vconvState.file = file;
    vconvState.origUrl = URL.createObjectURL(file);

    // 입력 확장자와 목표 확장자가 같으면 자동으로 다른 대표 확장자로 스마트 추천
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'mov' && vconvState.targetFmt === 'mov') {
      vconvState.targetFmt = 'mp4';
    } else if (ext === 'mp4' && vconvState.targetFmt === 'mp4') {
      vconvState.targetFmt = 'mov';
    } else if (ext === vconvState.targetFmt) {
      vconvState.targetFmt = 'mp4';
    }
    if (videoConvertFormatGrid) {
      videoConvertFormatGrid.querySelectorAll('.format-card, .format-pill').forEach((c) => {
        c.classList.toggle('active', c.dataset.vfmt === vconvState.targetFmt);
      });
    }
    updateVconvOptionVisibility();

    if (vconvFileName) vconvFileName.textContent = file.name;
    if (vconvMetaInfo) vconvMetaInfo.textContent = `원본 용량: ${formatBytes(file.size)} · 분석 중...`;

    vconvOrigPlayer.src = vconvState.origUrl;
    vconvOrigPlayer.onloadedmetadata = () => {
      vconvState.origW = vconvOrigPlayer.videoWidth || 1280;
      vconvState.origH = vconvOrigPlayer.videoHeight || 720;
      vconvState.duration = vconvOrigPlayer.duration || 0;
      if (vconvMetaInfo) {
        vconvMetaInfo.textContent = `원본 용량: ${formatBytes(file.size)} · 해상도: ${vconvState.origW}×${vconvState.origH} · 길이: ${formatDuration(vconvState.duration)}`;
      }
    };

    videoConvertDropzone.classList.add('hidden');
    videoConvertWorkCard.classList.remove('hidden');
    vconvResultBox.classList.add('hidden');
    vconvProgressPanel.classList.add('hidden');
    startVideoConvertBtn.disabled = false;
    changeVideoConvertBtn.disabled = false;
  }

  if (videoConvertDropzone && videoConvertFileInput) {
    setupDropzone(videoConvertDropzone, videoConvertFileInput, (files) => {
      if (files && files[0]) loadVideoConvertFile(files[0]);
    });
  }

  if (changeVideoConvertBtn) {
    changeVideoConvertBtn.addEventListener('click', () => videoConvertFileInput && videoConvertFileInput.click());
  }

  // ISOBMFF (MP4 <-> MOV <-> M4V) 컨테이너 ftyp 헤더 In-Place 무손실 리먹싱 (stco/co64 오프셋 100% 보존)
  async function tryLosslessIsoBmffRemux(file, targetFmt) {
    if (targetFmt !== 'mp4' && targetFmt !== 'mov' && targetFmt !== 'm4v') return null;
    const buf = await file.arrayBuffer();
    if (buf.byteLength < 16) return null;

    const view = new DataView(buf);
    const boxSize = view.getUint32(0, false);
    const boxType = String.fromCharCode(
      view.getUint8(4),
      view.getUint8(5),
      view.getUint8(6),
      view.getUint8(7)
    );

    if (boxType !== 'ftyp' || boxSize < 16 || boxSize > 512 || boxSize > buf.byteLength) {
      return null;
    }

    const outBytes = new Uint8Array(buf.slice(0));
    const writeFourCC = (offset, str) => {
      for (let i = 0; i < 4; i++) {
        outBytes[offset + i] = str.charCodeAt(i);
      }
    };

    if (targetFmt === 'mov') {
      // Apple QuickTime 컨테이너 브랜드 ('qt  ')
      writeFourCC(8, 'qt  ');
      outBytes[12] = 0x00;
      outBytes[13] = 0x00;
      outBytes[14] = 0x02;
      outBytes[15] = 0x00;
      for (let pos = 16; pos + 4 <= boxSize; pos += 4) {
        writeFourCC(pos, 'qt  ');
      }
      return new Blob([outBytes], { type: 'video/quicktime' });
    } else if (targetFmt === 'm4v') {
      // Apple iTunes Video 컨테이너 브랜드 ('M4V ')
      writeFourCC(8, 'M4V ');
      outBytes[12] = 0x00;
      outBytes[13] = 0x00;
      outBytes[14] = 0x00;
      outBytes[15] = 0x01;
      const m4vBrands = ['M4V ', 'M4A ', 'mp42', 'isom'];
      let bIdx = 0;
      for (let pos = 16; pos + 4 <= boxSize; pos += 4) {
        writeFourCC(pos, m4vBrands[bIdx % m4vBrands.length]);
        bIdx++;
      }
      return new Blob([outBytes], { type: 'video/x-m4v' });
    } else {
      // 표준 MP4 컨테이너 브랜드 ('mp42', 'isom', 'iso2', 'avc1')
      writeFourCC(8, 'mp42');
      outBytes[12] = 0x00;
      outBytes[13] = 0x00;
      outBytes[14] = 0x00;
      outBytes[15] = 0x00;
      const mp4Brands = ['mp42', 'isom', 'iso2', 'avc1'];
      let bIdx = 0;
      for (let pos = 16; pos + 4 <= boxSize; pos += 4) {
        writeFourCC(pos, mp4Brands[bIdx % mp4Brands.length]);
        bIdx++;
      }
      return new Blob([outBytes], { type: 'video/mp4' });
    }
  }

  // 동영상 -> WAV 16-bit PCM 무손실 오디오 추출기
  async function extractWavFromVideoFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const numChannels = Math.min(2, audioBuffer.numberOfChannels || 1);
      const sampleRate = audioBuffer.sampleRate;
      const numSamples = audioBuffer.length;
      const bytesPerSample = 2;
      const blockAlign = numChannels * bytesPerSample;
      const dataByteLength = numSamples * blockAlign;
      const wavBuffer = new ArrayBuffer(44 + dataByteLength);
      const view = new DataView(wavBuffer);

      const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + dataByteLength, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true); // PCM chunk size
      view.setUint16(20, 1, true); // PCM format = 1
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, 16, true); // 16-bit
      writeStr(36, 'data');
      view.setUint32(40, dataByteLength, true);

      const channels = [];
      for (let c = 0; c < numChannels; c++) {
        channels.push(audioBuffer.getChannelData(c));
      }

      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        for (let c = 0; c < numChannels; c++) {
          const s = Math.max(-1, Math.min(1, channels[c][i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          offset += 2;
        }
      }

      return new Blob([wavBuffer], { type: 'audio/wav' });
    } finally {
      try {
        await audioCtx.close();
      } catch (_) {}
    }
  }

  // 동영상 -> M4A (AAC 고음질 압축 오디오) 추출기
  async function extractM4aFromVideoFile(file) {
    // 1) 원본이 ISOBMFF(MP4/MOV/M4V)이고 브라우저가 audio/mp4 MediaRecorder를 지원하지 않는 경우에도
    //    먼저 AudioContext + MediaRecorder로 순수 오디오 스트림 인코딩 시도, 실패 시 고속 WAV 폴백
    return new Promise((resolve, reject) => {
      const tempVideo = document.createElement('video');
      const tempUrl = URL.createObjectURL(file);
      tempVideo.src = tempUrl;
      tempVideo.playsInline = true;
      tempVideo.crossOrigin = 'anonymous';

      let recorder = null;
      let audioCtx = null;
      let timer = null;
      let cancelled = false;

      vconvState.abortFn = () => {
        cancelled = true;
        try {
          if (timer) clearInterval(timer);
          tempVideo.pause();
          if (recorder && recorder.state !== 'inactive') recorder.stop();
        } catch (_) {}
        reject(new Error('USER_CANCELLED'));
      };

      tempVideo.onloadedmetadata = async () => {
        try {
          const dur = tempVideo.duration || 1;
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioContextClass();
          const sourceNode = audioCtx.createMediaElementSource(tempVideo);
          const destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destNode);

          const audioMimes = [
            'audio/mp4;codecs=mp4a.40.2',
            'audio/mp4',
            'audio/aac',
            'audio/webm;codecs=opus',
            'audio/webm',
          ];
          const chosenMime =
            audioMimes.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';

          const recOpts = { audioBitsPerSecond: 192000 };
          if (chosenMime) recOpts.mimeType = chosenMime;

          recorder = new MediaRecorder(destNode.stream, recOpts);
          const chunks = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = async () => {
            if (timer) clearInterval(timer);
            URL.revokeObjectURL(tempUrl);
            if (audioCtx) {
              try {
                await audioCtx.close();
              } catch (_) {}
            }
            if (cancelled) return;
            resolve(new Blob(chunks, { type: 'audio/mp4' }));
          };

          tempVideo.onended = () => {
            if (recorder && recorder.state !== 'inactive') recorder.stop();
          };

          timer = setInterval(() => {
            if (cancelled || tempVideo.paused || tempVideo.ended) return;
            const pct = Math.min(99, Math.round((tempVideo.currentTime / dur) * 100));
            if (vconvProgressPercent) vconvProgressPercent.textContent = `${pct}%`;
            if (vconvProgressBar) vconvProgressBar.style.width = `${pct}%`;
          }, 120);

          recorder.start(200);
          await tempVideo.play();
        } catch (err) {
          URL.revokeObjectURL(tempUrl);
          try {
            const wavFallback = await extractWavFromVideoFile(file);
            resolve(wavFallback);
          } catch (e2) {
            reject(e2);
          }
        }
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error('오디오 트랙을 디코딩할 수 없습니다.'));
      };
    });
  }

  // 호환성 재인코딩 변환 (MediaRecorder 기반: MP4, MOV, M4V, MKV, WebM, AVI 지원)
  function reencodeVideoToFormat(file, targetFmt, maxHeightSetting, bitrate) {
    return new Promise((resolve, reject) => {
      const tempVideo = document.createElement('video');
      const tempUrl = URL.createObjectURL(file);
      tempVideo.src = tempUrl;
      tempVideo.playsInline = true;
      tempVideo.crossOrigin = 'anonymous';

      let recorder = null;
      let audioCtx = null;
      let animId = null;
      let cancelled = false;

      vconvState.abortFn = () => {
        cancelled = true;
        try {
          tempVideo.pause();
          if (recorder && recorder.state !== 'inactive') recorder.stop();
        } catch (_) {}
        reject(new Error('USER_CANCELLED'));
      };

      tempVideo.onloadedmetadata = async () => {
        try {
          const vw = tempVideo.videoWidth || 1280;
          const vh = tempVideo.videoHeight || 720;
          const dur = tempVideo.duration || 1;

          let outW = vw;
          let outH = vh;
          if (maxHeightSetting !== 'keep') {
            const maxH = parseInt(maxHeightSetting, 10) || 720;
            if (vh > maxH) {
              outH = maxH;
              outW = Math.round((vw / vh) * maxH);
            }
          }
          outW = Math.max(2, outW - (outW % 2));
          outH = Math.max(2, outH - (outH % 2));

          const canvas = document.createElement('canvas');
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext('2d');

          const canvasStream = canvas.captureStream(30);
          try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            const sourceNode = audioCtx.createMediaElementSource(tempVideo);
            const destNode = audioCtx.createMediaStreamDestination();
            sourceNode.connect(destNode);
            destNode.stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
          } catch (_) {}

          let mimeCandidates = [];
          if (targetFmt === 'webm') {
            mimeCandidates = [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm',
            ];
          } else if (targetFmt === 'mkv') {
            mimeCandidates = [
              'video/x-matroska;codecs=avc1,opus',
              'video/x-matroska',
              'video/webm;codecs=h264,opus',
              'video/webm;codecs=vp9,opus',
              'video/webm',
            ];
          } else {
            mimeCandidates = [
              'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
              'video/mp4;codecs=avc1',
              'video/mp4',
              'video/webm;codecs=H264',
              'video/webm',
            ];
          }
          const chosenMime =
            mimeCandidates.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';

          const recOptions = { videoBitsPerSecond: bitrate };
          if (chosenMime) recOptions.mimeType = chosenMime;

          recorder = new MediaRecorder(canvasStream, recOptions);
          const chunks = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = async () => {
            if (animId) cancelAnimationFrame(animId);
            URL.revokeObjectURL(tempUrl);
            if (audioCtx) {
              try {
                await audioCtx.close();
              } catch (_) {}
            }
            if (cancelled) return;

            const mimeMap = {
              mp4: 'video/mp4',
              mov: 'video/quicktime',
              m4v: 'video/x-m4v',
              mkv: 'video/x-matroska',
              webm: 'video/webm',
              avi: 'video/x-msvideo',
            };
            let rawBlob = new Blob(chunks, {
              type: mimeMap[targetFmt] || 'video/mp4',
            });

            if (targetFmt === 'mov' || targetFmt === 'm4v') {
              const remuxed = await tryLosslessIsoBmffRemux(rawBlob, targetFmt);
              if (remuxed) rawBlob = remuxed;
            }
            resolve(rawBlob);
          };

          const renderLoop = () => {
            if (cancelled || tempVideo.paused || tempVideo.ended) return;
            ctx.drawImage(tempVideo, 0, 0, outW, outH);
            const pct = Math.min(99, Math.round((tempVideo.currentTime / dur) * 100));
            if (vconvProgressPercent) vconvProgressPercent.textContent = `${pct}%`;
            if (vconvProgressBar) vconvProgressBar.style.width = `${pct}%`;
            animId = requestAnimationFrame(renderLoop);
          };

          tempVideo.onended = () => {
            if (recorder && recorder.state !== 'inactive') recorder.stop();
          };

          recorder.start(250);
          await tempVideo.play();
          renderLoop();
        } catch (err) {
          URL.revokeObjectURL(tempUrl);
          reject(err);
        }
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error('영상 파일을 디코딩할 수 없습니다.'));
      };
    });
  }

  if (cancelVideoConvertBtn) {
    cancelVideoConvertBtn.addEventListener('click', () => {
      if (vconvState.abortFn) vconvState.abortFn();
    });
  }

  if (startVideoConvertBtn) {
    startVideoConvertBtn.addEventListener('click', async () => {
      if (!vconvState.file || vconvState.isConverting) return;

      const file = vconvState.file;
      const targetFmt = vconvState.targetFmt;
      const method = videoConvertMethodSelect ? videoConvertMethodSelect.value : 'auto';
      const resSetting = vconvResolution ? vconvResolution.value : 'keep';
      const bitrate = parseInt(vconvBitrate ? vconvBitrate.value : '4000000', 10) || 4000000;

      vconvState.isConverting = true;
      startVideoConvertBtn.disabled = true;
      cancelVideoConvertBtn.classList.remove('hidden');
      vconvProgressPanel.classList.remove('hidden');
      vconvResultBox.classList.add('hidden');

      if (vconvProgressPercent) vconvProgressPercent.textContent = '10%';
      if (vconvProgressBar) vconvProgressBar.style.width = '10%';

      try {
        let outBlob = null;
        let usedModeLabel = '';

        if (targetFmt === 'wav') {
          if (vconvProgressStatus) vconvProgressStatus.textContent = '동영상에서 고음질 WAV 오디오 트랙 추출 중...';
          if (vconvProgressPercent) vconvProgressPercent.textContent = '50%';
          if (vconvProgressBar) vconvProgressBar.style.width = '50%';
          outBlob = await extractWavFromVideoFile(file);
          usedModeLabel = '무손실 WAV 오디오 추출 완료';
        } else if (targetFmt === 'm4a') {
          if (vconvProgressStatus) vconvProgressStatus.textContent = '동영상에서 고음질 M4A 오디오 트랙 추출 중...';
          outBlob = await extractM4aFromVideoFile(file);
          usedModeLabel = '고음질 M4A 오디오 추출 완료';
        } else if (
          (method === 'auto' || method === 'remux') &&
          (targetFmt === 'mp4' || targetFmt === 'mov' || targetFmt === 'm4v')
        ) {
          if (vconvProgressStatus) {
            vconvProgressStatus.textContent = `${targetFmt.toUpperCase()} 컨테이너 무손실 고속 변환 중...`;
          }
          outBlob = await tryLosslessIsoBmffRemux(file, targetFmt);
          if (outBlob) {
            usedModeLabel = `${targetFmt.toUpperCase()} 초고속 무손실 컨테이너 변환 완료`;
          } else if (method === 'remux') {
            showToast('원본 컨테이너가 달라 호환성 재인코딩으로 자동 전환하여 변환합니다.');
          }
        }

        if (!outBlob) {
          if (vconvProgressStatus) {
            vconvProgressStatus.textContent = `${targetFmt.toUpperCase()} 포맷으로 인코딩 변환 중... (영상 재생 시간만큼 소요)`;
          }
          outBlob = await reencodeVideoToFormat(file, targetFmt, resSetting, bitrate);
          usedModeLabel = `${targetFmt.toUpperCase()} 인코딩 변환 완료`;
        }

        if (vconvProgressPercent) vconvProgressPercent.textContent = '100%';
        if (vconvProgressBar) vconvProgressBar.style.width = '100%';

        if (vconvState.resultUrl) URL.revokeObjectURL(vconvState.resultUrl);
        vconvState.resultUrl = URL.createObjectURL(outBlob);

        if (vconvResultTag) vconvResultTag.textContent = usedModeLabel;
        if (targetFmt === 'wav' || targetFmt === 'm4a') {
          vconvResultVideoPlayer.classList.add('hidden');
          vconvResultVideoPlayer.removeAttribute('src');
          vconvResultAudioPlayer.classList.remove('hidden');
          vconvResultAudioPlayer.src = vconvState.resultUrl;
        } else {
          vconvResultAudioPlayer.classList.add('hidden');
          vconvResultAudioPlayer.removeAttribute('src');
          vconvResultVideoPlayer.classList.remove('hidden');
          vconvResultVideoPlayer.src = vconvState.resultUrl;
        }

        if (vconvResultStatText) {
          vconvResultStatText.textContent = `변환 포맷: .${targetFmt} · 파일 크기: ${formatBytes(outBlob.size)}`;
        }
        if (downloadVconvResultBtn) {
          const baseName = getBaseName(file.name);
          downloadVconvResultBtn.href = vconvState.resultUrl;
          downloadVconvResultBtn.download = `${baseName}_converted.${targetFmt}`;
          downloadVconvResultBtn.textContent = `💾 변환된 .${targetFmt.toUpperCase()} 파일 다운로드`;
        }

        vconvResultBox.classList.remove('hidden');
        showToast(`${usedModeLabel}! (${formatBytes(outBlob.size)})`);
      } catch (err) {
        if (err && err.message === 'USER_CANCELLED') {
          showToast('동영상 변환이 취소되었습니다.');
        } else {
          console.error(err);
          showToast('변환 처리 중 오류가 발생했습니다. (오디오 트랙 유무 또는 코덱을 확인해주세요)');
        }
      } finally {
        vconvState.isConverting = false;
        vconvState.abortFn = null;
        startVideoConvertBtn.disabled = false;
        cancelVideoConvertBtn.classList.add('hidden');
        vconvProgressPanel.classList.add('hidden');
      }
    });
  }
})();


