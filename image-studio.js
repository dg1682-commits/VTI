/**
 * 궁디 이미지 스튜디오 (GOONGDI Image Studio)
 * Canva & MangoBoard Style Direct On-Canvas Typing Engine
 * Pure Vanilla JS - Zero Build Step
 */

(function () {
  'use strict';

  // 캔버스 및 뷰포트 엘리먼트
  const canvas = document.getElementById('canvaCanvas');
  const ctx = canvas.getContext('2d');
  const canvasCenterStage = document.getElementById('canvasCenterStage');
  const canvasPaperShadowWrap = document.getElementById('canvasPaperShadowWrap');
  const interactiveOverlay = document.getElementById('interactiveOverlay');

  // 상단 글로벌 헤더
  const docTitleInput = document.getElementById('docTitleInput');
  const cloudSaveBadge = document.getElementById('cloudSaveBadge');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const loadProjectInput = document.getElementById('loadProjectInput');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const canvasPresetSelect = document.getElementById('canvasPresetSelect');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const zoomValLabel = document.getElementById('zoomValLabel');
  const exportMainBtn = document.getElementById('exportMainBtn');
  const exportMenuPopover = document.getElementById('exportMenuPopover');

  // 상단 컨텍스추얼 서식 툴바
  const contextToolbar = document.getElementById('contextToolbar');
  const ctxCanvasBgGroup = document.getElementById('ctxCanvasBgGroup');
  const ctxCanvasBgPicker = document.getElementById('ctxCanvasBgPicker');
  const ctxCanvasBgPreview = document.getElementById('ctxCanvasBgPreview');

  const ctxTextGroup = document.getElementById('ctxTextGroup');
  const ctxFontSelect = document.getElementById('ctxFontSelect');
  const ctxFontSizeInput = document.getElementById('ctxFontSizeInput');
  const ctxFontSizeMinus = document.getElementById('ctxFontSizeMinus');
  const ctxFontSizePlus = document.getElementById('ctxFontSizePlus');
  const ctxTextColorPicker = document.getElementById('ctxTextColorPicker');
  const ctxTextColorBar = document.getElementById('ctxTextColorBar');
  const ctxBoldBtn = document.getElementById('ctxBoldBtn');
  const ctxItalicBtn = document.getElementById('ctxItalicBtn');
  const ctxUnderlineBtn = document.getElementById('ctxUnderlineBtn');
  const ctxAlignBtn = document.getElementById('ctxAlignBtn');
  const alignIcon = document.getElementById('alignIcon');

  // 자간/행간
  const btnSpacingToggle = document.getElementById('btnSpacingToggle');
  const spacingPopover = document.getElementById('spacingPopover');
  const ctxLetterSpacingSlider = document.getElementById('ctxLetterSpacingSlider');
  const letterSpacingVal = document.getElementById('letterSpacingVal');
  const ctxLineHeightSlider = document.getElementById('ctxLineHeightSlider');
  const lineHeightVal = document.getElementById('lineHeightVal');

  // 글자 효과 (아웃라인 / 그림자 / 배경박스)
  const btnEffectsTrigger = document.getElementById('btnEffectsTrigger');
  const effectsPopover = document.getElementById('effectsPopover');
  const chkOutline = document.getElementById('chkOutline');
  const outlineColorPicker = document.getElementById('outlineColorPicker');
  const outlineColorPreview = document.getElementById('outlineColorPreview');
  const outlineWidthSlider = document.getElementById('outlineWidthSlider');
  const outlineWidthVal = document.getElementById('outlineWidthVal');

  const chkShadow = document.getElementById('chkShadow');
  const shadowColorPicker = document.getElementById('shadowColorPicker');
  const shadowColorPreview = document.getElementById('shadowColorPreview');
  const shadowBlurSlider = document.getElementById('shadowBlurSlider');
  const shadowBlurVal = document.getElementById('shadowBlurVal');
  const shadowOffsetSlider = document.getElementById('shadowOffsetSlider');
  const shadowOffsetVal = document.getElementById('shadowOffsetVal');

  const chkBgBox = document.getElementById('chkBgBox');
  const bgBoxColorPicker = document.getElementById('bgBoxColorPicker');
  const bgBoxColorPreview = document.getElementById('bgBoxColorPreview');
  const bgBoxRadiusSlider = document.getElementById('bgBoxRadiusSlider');
  const bgBoxRadiusVal = document.getElementById('bgBoxRadiusVal');

  // 도형 전용 컨트롤
  const ctxShapeGroup = document.getElementById('ctxShapeGroup');
  const ctxFillColorPicker = document.getElementById('ctxFillColorPicker');
  const ctxFillColorPreview = document.getElementById('ctxFillColorPreview');
  const ctxRadiusInput = document.getElementById('ctxRadiusInput');

  // 공통 컨트롤
  const ctxOpacitySlider = document.getElementById('ctxOpacitySlider');
  const ctxOpacityVal = document.getElementById('ctxOpacityVal');
  const ctxDuplicateBtn = document.getElementById('ctxDuplicateBtn');
  const ctxDeleteBtn = document.getElementById('ctxDeleteBtn');

  // 좌측 독 & 드로어
  const dockNavItems = document.querySelectorAll('.dock-nav-item');
  const sideDrawerPanel = document.getElementById('sideDrawerPanel');
  const drawerHeadingTitle = document.getElementById('drawerHeadingTitle');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerPageViews = document.querySelectorAll('.drawer-page-view');

  const btnAddHeading = document.getElementById('btnAddHeading');
  const btnAddSubheading = document.getElementById('btnAddSubheading');
  const btnAddBodyText = document.getElementById('btnAddBodyText');
  const btnAddRect = document.getElementById('btnAddRect');
  const btnAddCircle = document.getElementById('btnAddCircle');
  const btnAddPill = document.getElementById('btnAddPill');
  const btnAddStar = document.getElementById('btnAddStar');
  const sideUploadInput = document.getElementById('sideUploadInput');
  const sidebarDropzone = document.getElementById('sidebarDropzone');
  const uploadedGalleryGrid = document.getElementById('uploadedGalleryGrid');

  // 우측 레이어 패널
  const layerCountBadge = document.getElementById('layerCountBadge');
  const layersScrollList = document.getElementById('layersScrollList');
  const alignLeftBtn = document.getElementById('alignLeftBtn');
  const alignCenterHBtn = document.getElementById('alignCenterHBtn');
  const alignRightBtn = document.getElementById('alignRightBtn');
  const alignTopBtn = document.getElementById('alignTopBtn');
  const alignCenterVBtn = document.getElementById('alignCenterVBtn');
  const alignBottomBtn = document.getElementById('alignBottomBtn');
  const btnBringForward = document.getElementById('btnBringForward');
  const btnSendBackward = document.getElementById('btnSendBackward');

  // 하단 상태바 & 토스트
  const footerDimText = document.getElementById('footerDimText');
  const studioToast = document.getElementById('studioToast');

  // ==========================================================================
  // 스튜디오 상태 모델 (State)
  // ==========================================================================
  const state = {
    docTitle: '새 썸네일 디자인',
    canvasWidth: 1280,
    canvasHeight: 720,
    bgType: 'color', // 'color' | 'gradient'
    bgColor: '#ffffff',
    bgGradient: { from: '#fbcfe8', to: '#fed7aa', angle: 135 },
    zoom: 1.0,
    selectedId: null,
    editingTextId: null, // 캔버스 인라인 타이핑 중인 텍스트 레이어 ID
    layers: [],
    history: [],
    historyIndex: -1,

    dragState: {
      isDragging: false,
      mode: null, // 'move' | 'resize' | 'rotate'
      handle: null,
      startX: 0,
      startY: 0,
      initialLayer: null
    },

    snapGuides: { x: null, y: null }
  };

  function showToast(msg) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.add('show');
    setTimeout(() => studioToast.classList.remove('show'), 2200);
  }

  // ==========================================================================
  // 실행 취소 / 다시 실행 (Undo / Redo)
  // ==========================================================================
  function pushHistory() {
    const snapshot = JSON.stringify({
      docTitle: state.docTitle,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      bgType: state.bgType,
      bgColor: state.bgColor,
      bgGradient: state.bgGradient,
      layers: state.layers.map(l => {
        const copy = { ...l };
        delete copy._imgEl;
        return copy;
      })
    });

    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(snapshot);
    if (state.history.length > 40) state.history.shift();
    state.historyIndex = state.history.length - 1;

    updateUndoRedoUI();
  }

  function updateUndoRedoUI() {
    if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = state.historyIndex >= state.history.length - 1;
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreSnapshot(state.history[state.historyIndex]);
      showToast('실행 취소');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreSnapshot(state.history[state.historyIndex]);
      showToast('다시 실행');
    }
  }

  function restoreSnapshot(jsonStr) {
    commitInlineTextEditor(); // 타이핑 중이던 것 정리
    const data = JSON.parse(jsonStr);
    state.docTitle = data.docTitle || '새 썸네일 디자인';
    if (docTitleInput) docTitleInput.value = state.docTitle;
    state.canvasWidth = data.canvasWidth;
    state.canvasHeight = data.canvasHeight;
    state.bgType = data.bgType || 'color';
    state.bgColor = data.bgColor || '#ffffff';
    state.bgGradient = data.bgGradient || { from: '#fbcfe8', to: '#fed7aa', angle: 135 };

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    updateDimUI();

    state.layers = (data.layers || []).map(l => {
      if (l.type === 'image' && l.dataUrl) {
        const img = new Image();
        img.src = l.dataUrl;
        return { ...l, _imgEl: img };
      }
      return { ...l };
    });

    renderCanvas();
    renderLayerList();
    syncContextToolbar();
    updateUndoRedoUI();
  }

  function updateDimUI() {
    if (footerDimText) footerDimText.textContent = `${state.canvasWidth} × ${state.canvasHeight} px`;
  }

  function setZoom(newZoom) {
    state.zoom = Math.max(0.15, Math.min(3.5, newZoom));
    canvasPaperShadowWrap.style.transform = `scale(${state.zoom})`;
    if (zoomValLabel) zoomValLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function fitToScreen() {
    const pad = 100;
    const availW = canvasCenterStage.clientWidth - pad;
    const availH = canvasCenterStage.clientHeight - pad;
    const scale = Math.min(availW / state.canvasWidth, availH / state.canvasHeight);
    setZoom(Math.min(1.0, scale));
  }

  // ==========================================================================
  // 캔버스 렌더링 파이프라인
  // ==========================================================================
  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 배경 채우기
    if (state.bgType === 'gradient' && state.bgGradient) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, state.bgGradient.from);
      grad.addColorStop(1, state.bgGradient.to);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = state.bgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 레이어 렌더링
    state.layers.forEach(layer => {
      if (!layer.visible) return;
      // 인라인 텍스트 편집 중인 레이어는 캔버스에서 숨김 (오버레이 textarea로 표시)
      if (layer.id === state.editingTextId) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      // 입체 그림자
      if (layer.hasShadow) {
        ctx.shadowColor = layer.shadowColor || 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = layer.shadowBlur || 8;
        ctx.shadowOffsetX = layer.shadowOffset || 6;
        ctx.shadowOffsetY = layer.shadowOffset || 6;
      }

      if (layer.type === 'rect') {
        ctx.fillStyle = layer.fillColor || '#7c3aed';
        if (layer.borderRadius > 0) {
          drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        }
      } else if (layer.type === 'circle') {
        ctx.fillStyle = layer.fillColor || '#ef4444';
        ctx.beginPath();
        ctx.ellipse(cx, cy, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (layer.type === 'pill') {
        ctx.fillStyle = layer.fillColor || '#3b82f6';
        drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.height / 2);
        ctx.fill();
      } else if (layer.type === 'star') {
        ctx.fillStyle = layer.fillColor || '#f59e0b';
        drawStar(ctx, cx, cy, 5, layer.width / 2, layer.width / 4);
        ctx.fill();
      } else if (layer.type === 'image' && layer._imgEl && layer._imgEl.complete) {
        ctx.drawImage(layer._imgEl, layer.x, layer.y, layer.width, layer.height);
      } else if (layer.type === 'text') {
        renderTextLayer(ctx, layer);
      } else if (layer.type === 'sticker') {
        ctx.font = `${layer.fontSize || 80}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.text, cx, cy);
      }

      ctx.restore();
    });

    // 3. 스마트 가이드라인 그리기
    if (state.snapGuides.x !== null) {
      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(state.snapGuides.x, 0);
      ctx.lineTo(state.snapGuides.x, canvas.height);
      ctx.stroke();
      ctx.restore();
    }
    if (state.snapGuides.y !== null) {
      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, state.snapGuides.y);
      ctx.lineTo(canvas.width, state.snapGuides.y);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 선택된 레이어 바운딩 박스
    const selected = getSelectedLayer();
    if (selected && selected.id !== state.editingTextId) {
      drawCanvaBoundingBox(selected);
    }
  }

  // 텍스트 레이어 전용 정밀 렌더러 (줄바꿈, 아웃라인, 배경박스 지원)
  function renderTextLayer(c, layer) {
    const fontStyle = layer.isItalic ? 'italic' : 'normal';
    const fontWeight = layer.isBold ? '900' : '400';
    c.font = `${fontStyle} ${fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
    c.textAlign = layer.textAlign || 'left';
    c.textBaseline = 'top';

    const lines = String(layer.text).split('\n');
    const lineHeightPx = layer.fontSize * (layer.lineHeight || 1.2);

    // 배경 라벨 박스 그리기
    if (layer.hasBgBox) {
      c.save();
      c.shadowColor = 'transparent'; // 박스엔 그림자 해제
      c.fillStyle = layer.bgBoxColor || '#fef08a';
      const padX = 14;
      const padY = 8;
      const boxW = layer.width + padX * 2;
      const boxH = lines.length * lineHeightPx + padY * 2;
      drawRoundedRect(c, layer.x - padX, layer.y - padY, boxW, boxH, layer.bgBoxRadius || 6);
      c.fill();
      c.restore();
    }

    let drawX = layer.x;
    if (layer.textAlign === 'center') drawX = layer.x + layer.width / 2;
    else if (layer.textAlign === 'right') drawX = layer.x + layer.width;

    lines.forEach((line, idx) => {
      const lineY = layer.y + idx * lineHeightPx;

      // 외곽선 (아웃라인)
      if (layer.hasOutline && layer.outlineWidth > 0) {
        c.lineWidth = layer.outlineWidth * 2;
        c.strokeStyle = layer.outlineColor || '#000000';
        c.lineJoin = 'round';
        c.miterLimit = 2;
        c.strokeText(line, drawX, lineY);
      }

      // 본문 글자
      c.fillStyle = layer.textColor || '#0f172a';
      c.fillText(line, drawX, lineY);

      // 밑줄 (Underline)
      if (layer.isUnderline) {
        const textW = c.measureText(line).width;
        let startX = drawX;
        if (layer.textAlign === 'center') startX = drawX - textW / 2;
        else if (layer.textAlign === 'right') startX = drawX - textW;

        c.beginPath();
        c.strokeStyle = layer.textColor || '#0f172a';
        c.lineWidth = Math.max(2, layer.fontSize / 16);
        c.moveTo(startX, lineY + layer.fontSize + 4);
        c.lineTo(startX + textW, lineY + layer.fontSize + 4);
        c.stroke();
      }
    });
  }

  function drawRoundedRect(c, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + w - radius, y);
    c.quadraticCurveTo(x + w, y, x + w, y + radius);
    c.lineTo(x + w, y + h - radius);
    c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    c.lineTo(x + radius, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
  }

  function drawStar(c, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    c.beginPath();
    c.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      c.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      c.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    c.lineTo(cx, cy - outerRadius);
    c.closePath();
  }

  // ==========================================================================
  // Canva 스타일 얇은 보라색 바운딩 박스 & 원형 핸들
  // ==========================================================================
  function drawCanvaBoundingBox(layer) {
    ctx.save();
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // 보라색 테두리
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

    // 상단 회전 핸들
    const rotY = layer.y - 24;
    ctx.beginPath();
    ctx.moveTo(cx, layer.y);
    ctx.lineTo(cx, rotY);
    ctx.strokeStyle = '#7c3aed';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, rotY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4개 모서리 흰색 원형 핸들
    const handles = getHandles(layer);
    handles.forEach(h => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }

  function getHandles(layer) {
    const lx = layer.x;
    const ly = layer.y;
    const lw = layer.width;
    const lh = layer.height;
    return [
      { id: 'tl', x: lx, y: ly },
      { id: 'tr', x: lx + lw, y: ly },
      { id: 'br', x: lx + lw, y: ly + lh },
      { id: 'bl', x: lx, y: ly + lh }
    ];
  }

  // ==========================================================================
  // ✨ 핵심 혁신: 캔버스 위에서 바로 치는 인라인 텍스트 에디터 (Canva/망고보드 방식!)
  // ==========================================================================
  function startInlineTextEditor(layer) {
    commitInlineTextEditor(); // 기존 에디터가 있으면 저장
    state.editingTextId = layer.id;

    const textarea = document.createElement('textarea');
    textarea.className = 'canvas-inline-text-editor';
    textarea.value = layer.text;

    // 위치 및 스타일을 레이어와 100% 동일하게 일치시킴
    textarea.style.left = `${layer.x}px`;
    textarea.style.top = `${layer.y}px`;
    textarea.style.width = `${Math.max(120, layer.width + 10)}px`;
    textarea.style.height = `${Math.max(40, layer.height + 10)}px`;
    textarea.style.fontFamily = layer.fontFamily;
    textarea.style.fontSize = `${layer.fontSize}px`;
    textarea.style.fontWeight = layer.isBold ? '900' : '400';
    textarea.style.fontStyle = layer.isItalic ? 'italic' : 'normal';
    textarea.style.color = layer.textColor || '#0f172a';
    textarea.style.textAlign = layer.textAlign || 'left';
    textarea.style.transform = `rotate(${layer.rotation || 0}deg)`;

    interactiveOverlay.appendChild(textarea);
    textarea.focus();
    textarea.select();

    // 실시간 타이핑에 따라 너비/높이 자동 확장
    function autoResize() {
      layer.text = textarea.value;
      const lines = textarea.value.split('\n');
      ctx.font = `${layer.isBold ? '900' : '400'} ${layer.fontSize}px ${layer.fontFamily}`;
      let maxW = 100;
      lines.forEach(l => {
        const w = ctx.measureText(l).width;
        if (w > maxW) maxW = w;
      });
      layer.width = Math.round(maxW + 20);
      layer.height = Math.round(lines.length * (layer.fontSize * (layer.lineHeight || 1.2)) + 10);
      textarea.style.width = `${layer.width}px`;
      textarea.style.height = `${layer.height}px`;
    }

    textarea.addEventListener('input', autoResize);

    // 바깥 클릭 시 커밋
    function onBlurHandler() {
      commitInlineTextEditor();
    }
    textarea.addEventListener('blur', onBlurHandler);

    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation(); // 글로벌 단축키 방지
      if (e.key === 'Escape') {
        commitInlineTextEditor();
      }
    });

    renderCanvas();
  }

  function commitInlineTextEditor() {
    if (!state.editingTextId) return;
    const textarea = interactiveOverlay.querySelector('.canvas-inline-text-editor');
    if (textarea) {
      const layer = state.layers.find(l => l.id === state.editingTextId);
      if (layer) {
        layer.text = textarea.value;
        layer.name = layer.text.slice(0, 14) || '텍스트 레이어';
      }
      textarea.remove();
    }
    state.editingTextId = null;
    renderCanvas();
    renderLayerList();
    pushHistory();
  }

  // ==========================================================================
  // 마우스 좌표 및 조작 (선택 / 드래그 / 리사이즈 / 회전)
  // ==========================================================================
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function getSelectedLayer() {
    return state.layers.find(l => l.id === state.selectedId);
  }

  function selectLayer(id) {
    if (state.editingTextId && state.editingTextId !== id) {
      commitInlineTextEditor();
    }
    state.selectedId = id;
    renderCanvas();
    renderLayerList();
    syncContextToolbar();
  }

  canvas.addEventListener('mousedown', (e) => {
    commitInlineTextEditor(); // 클릭 시 타이핑 커밋
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();

    // 1. 회전 핸들 검사
    if (selected) {
      const cx = selected.x + selected.width / 2;
      const rotY = selected.y - 24;
      if (Math.hypot(coords.x - cx, coords.y - rotY) <= 12) {
        state.dragState = {
          isDragging: true,
          mode: 'rotate',
          startX: coords.x,
          startY: coords.y,
          initialLayer: { ...selected }
        };
        return;
      }

      // 2. 4개 모서리 리사이즈 핸들 검사
      const handles = getHandles(selected);
      for (const h of handles) {
        if (Math.hypot(coords.x - h.x, coords.y - h.y) <= 12) {
          state.dragState = {
            isDragging: true,
            mode: 'resize',
            handle: h.id,
            startX: coords.x,
            startY: coords.y,
            initialLayer: { ...selected }
          };
          return;
        }
      }
    }

    // 3. 레이어 바디 클릭 (맨 위 레이어부터 탐색)
    let hitLayer = null;
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const l = state.layers[i];
      if (!l.visible || l.locked) continue;
      if (
        coords.x >= l.x && coords.x <= l.x + l.width &&
        coords.y >= l.y && coords.y <= l.y + l.height
      ) {
        hitLayer = l;
        break;
      }
    }

    if (hitLayer) {
      selectLayer(hitLayer.id);
      state.dragState = {
        isDragging: true,
        mode: 'move',
        startX: coords.x,
        startY: coords.y,
        initialLayer: { ...hitLayer }
      };
    } else {
      selectLayer(null);
    }
  });

  // 더블클릭 -> 인라인 텍스트 타이핑 시작! (Canva 방식)
  canvas.addEventListener('dblclick', (e) => {
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      startInlineTextEditor(selected);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.dragState.isDragging) return;
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();
    if (!selected) return;

    const dx = coords.x - state.dragState.startX;
    const dy = coords.y - state.dragState.startY;
    const init = state.dragState.initialLayer;

    // A. 이동 (스마트 자석 스냅 가이드)
    if (state.dragState.mode === 'move') {
      let tx = init.x + dx;
      let ty = init.y + dy;

      state.snapGuides.x = null;
      state.snapGuides.y = null;

      const cx = tx + selected.width / 2;
      const cy = ty + selected.height / 2;
      const ccX = state.canvasWidth / 2;
      const ccY = state.canvasHeight / 2;

      if (Math.abs(cx - ccX) <= 8) {
        tx = ccX - selected.width / 2;
        state.snapGuides.x = ccX;
      }
      if (Math.abs(cy - ccY) <= 8) {
        ty = ccY - selected.height / 2;
        state.snapGuides.y = ccY;
      }

      selected.x = Math.round(tx);
      selected.y = Math.round(ty);
    }

    // B. 리사이즈
    else if (state.dragState.mode === 'resize') {
      const h = state.dragState.handle;
      if (h === 'br') {
        selected.width = Math.max(20, Math.round(init.width + dx));
        selected.height = Math.max(20, Math.round(init.height + dy));
      } else if (h === 'bl') {
        selected.x = Math.round(init.x + dx);
        selected.width = Math.max(20, Math.round(init.width - dx));
        selected.height = Math.max(20, Math.round(init.height + dy));
      } else if (h === 'tr') {
        selected.y = Math.round(init.y + dy);
        selected.width = Math.max(20, Math.round(init.width + dx));
        selected.height = Math.max(20, Math.round(init.height - dy));
      } else if (h === 'tl') {
        selected.x = Math.round(init.x + dx);
        selected.y = Math.round(init.y + dy);
        selected.width = Math.max(20, Math.round(init.width - dx));
        selected.height = Math.max(20, Math.round(init.height - dy));
      }
    }

    // C. 회전
    else if (state.dragState.mode === 'rotate') {
      const cx = init.x + init.width / 2;
      const cy = init.y + init.height / 2;
      const angleRad = Math.atan2(coords.y - cy, coords.x - cx);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
      if (angleDeg < -180) angleDeg += 360;
      if (angleDeg > 180) angleDeg -= 360;
      selected.rotation = angleDeg;
    }

    renderCanvas();
  });

  window.addEventListener('mouseup', () => {
    if (state.dragState.isDragging) {
      state.dragState.isDragging = false;
      state.dragState.mode = null;
      state.snapGuides.x = null;
      state.snapGuides.y = null;
      renderCanvas();
      pushHistory();
    }
  });

  // ==========================================================================
  // 상단 컨텍스추얼 서식 바 바인딩 (폰트, 크기, 색상, B/I/U, 효과 등)
  // ==========================================================================
  function syncContextToolbar() {
    const selected = getSelectedLayer();
    if (!selected) {
      ctxCanvasBgGroup.style.display = 'flex';
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'none';
      ctxCanvasBgPicker.value = state.bgColor;
      ctxCanvasBgPreview.style.backgroundColor = state.bgColor;
      ctxOpacitySlider.disabled = true;
      ctxDuplicateBtn.disabled = true;
      ctxDeleteBtn.disabled = true;
      return;
    }

    ctxCanvasBgGroup.style.display = 'none';
    ctxOpacitySlider.disabled = false;
    ctxDuplicateBtn.disabled = false;
    ctxDeleteBtn.disabled = false;
    ctxOpacitySlider.value = Math.round(selected.opacity * 100);
    ctxOpacityVal.textContent = `${Math.round(selected.opacity * 100)}%`;

    if (selected.type === 'text') {
      ctxTextGroup.style.display = 'flex';
      ctxShapeGroup.style.display = 'none';

      ctxFontSelect.value = selected.fontFamily;
      ctxFontSizeInput.value = selected.fontSize;
      ctxTextColorPicker.value = selected.textColor || '#0f172a';
      ctxTextColorBar.style.backgroundColor = selected.textColor || '#0f172a';

      ctxBoldBtn.classList.toggle('active', !!selected.isBold);
      ctxItalicBtn.classList.toggle('active', !!selected.isItalic);
      ctxUnderlineBtn.classList.toggle('active', !!selected.isUnderline);

      // 효과 팝오버 값 동기화
      chkOutline.checked = !!selected.hasOutline;
      outlineColorPicker.value = selected.outlineColor || '#000000';
      outlineColorPreview.style.backgroundColor = selected.outlineColor || '#000000';
      outlineWidthSlider.value = selected.outlineWidth || 0;
      outlineWidthVal.textContent = `${selected.outlineWidth || 0}px`;

      chkShadow.checked = !!selected.hasShadow;
      shadowColorPicker.value = selected.shadowColor || '#000000';
      shadowColorPreview.style.backgroundColor = selected.shadowColor || '#000000';
      shadowBlurSlider.value = selected.shadowBlur || 8;
      shadowBlurVal.textContent = String(selected.shadowBlur || 8);
      shadowOffsetSlider.value = selected.shadowOffset || 6;
      shadowOffsetVal.textContent = String(selected.shadowOffset || 6);

      chkBgBox.checked = !!selected.hasBgBox;
      bgBoxColorPicker.value = selected.bgBoxColor || '#fef08a';
      bgBoxColorPreview.style.backgroundColor = selected.bgBoxColor || '#fef08a';
      bgBoxRadiusSlider.value = selected.bgBoxRadius || 8;
      bgBoxRadiusVal.textContent = `${selected.bgBoxRadius || 8}px`;

    } else if (['rect', 'circle', 'pill', 'star'].includes(selected.type)) {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'flex';
      ctxFillColorPicker.value = selected.fillColor || '#7c3aed';
      ctxFillColorPreview.style.backgroundColor = selected.fillColor || '#7c3aed';
      ctxRadiusInput.value = selected.borderRadius || 0;
    } else {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'none';
    }
  }

  // 폰트 변경
  ctxFontSelect.addEventListener('change', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.fontFamily = ctxFontSelect.value;
      renderCanvas();
      pushHistory();
    }
  });

  // 크기 조절
  ctxFontSizeInput.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.fontSize = parseInt(ctxFontSizeInput.value, 10) || 40;
      renderCanvas();
    }
  });
  ctxFontSizeMinus.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.fontSize = Math.max(10, s.fontSize - 4);
      ctxFontSizeInput.value = s.fontSize;
      renderCanvas();
      pushHistory();
    }
  });
  ctxFontSizePlus.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.fontSize = Math.min(300, s.fontSize + 4);
      ctxFontSizeInput.value = s.fontSize;
      renderCanvas();
      pushHistory();
    }
  });

  // 글자색 변경
  ctxTextColorPicker.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.textColor = ctxTextColorPicker.value;
      ctxTextColorBar.style.backgroundColor = s.textColor;
      renderCanvas();
    }
  });
  ctxTextColorPicker.addEventListener('change', pushHistory);

  // B / I / U 토글
  ctxBoldBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.isBold = !s.isBold;
      ctxBoldBtn.classList.toggle('active', s.isBold);
      renderCanvas();
      pushHistory();
    }
  });
  ctxItalicBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.isItalic = !s.isItalic;
      ctxItalicBtn.classList.toggle('active', s.isItalic);
      renderCanvas();
      pushHistory();
    }
  });
  ctxUnderlineBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.isUnderline = !s.isUnderline;
      ctxUnderlineBtn.classList.toggle('active', s.isUnderline);
      renderCanvas();
      pushHistory();
    }
  });

  // 정렬 순환
  ctxAlignBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      const next = s.textAlign === 'left' ? 'center' : s.textAlign === 'center' ? 'right' : 'left';
      s.textAlign = next;
      alignIcon.textContent = next === 'left' ? '⇤' : next === 'center' ? '≡' : '⇥';
      renderCanvas();
      pushHistory();
    }
  });

  // 자간 / 행간 팝오버 토글
  btnSpacingToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    spacingPopover.classList.toggle('open');
    effectsPopover.classList.remove('open');
  });

  ctxLetterSpacingSlider.addEventListener('input', () => {
    letterSpacingVal.textContent = ctxLetterSpacingSlider.value;
  });

  ctxLineHeightSlider.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.lineHeight = parseFloat(ctxLineHeightSlider.value);
      lineHeightVal.textContent = s.lineHeight;
      renderCanvas();
    }
  });

  // 효과 팝오버 토글
  btnEffectsTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    effectsPopover.classList.toggle('open');
    spacingPopover.classList.remove('open');
  });

  window.addEventListener('click', () => {
    spacingPopover.classList.remove('open');
    effectsPopover.classList.remove('open');
  });
  effectsPopover.addEventListener('click', (e) => e.stopPropagation());
  spacingPopover.addEventListener('click', (e) => e.stopPropagation());

  // 외곽선 (아웃라인) 조절
  chkOutline.addEventListener('change', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.hasOutline = chkOutline.checked;
      renderCanvas();
      pushHistory();
    }
  });
  outlineColorPicker.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.outlineColor = outlineColorPicker.value;
      outlineColorPreview.style.backgroundColor = s.outlineColor;
      renderCanvas();
    }
  });
  outlineWidthSlider.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.outlineWidth = parseInt(outlineWidthSlider.value, 10);
      outlineWidthVal.textContent = `${s.outlineWidth}px`;
      renderCanvas();
    }
  });

  // 그림자 조절
  chkShadow.addEventListener('change', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.hasShadow = chkShadow.checked;
      renderCanvas();
      pushHistory();
    }
  });
  shadowColorPicker.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.shadowColor = shadowColorPicker.value;
      shadowColorPreview.style.backgroundColor = s.shadowColor;
      renderCanvas();
    }
  });
  shadowBlurSlider.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.shadowBlur = parseInt(shadowBlurSlider.value, 10);
      shadowBlurVal.textContent = String(s.shadowBlur);
      renderCanvas();
    }
  });
  shadowOffsetSlider.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.shadowOffset = parseInt(shadowOffsetSlider.value, 10);
      shadowOffsetVal.textContent = String(s.shadowOffset);
      renderCanvas();
    }
  });

  // 배경 라벨 박스 조절
  chkBgBox.addEventListener('change', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.hasBgBox = chkBgBox.checked;
      renderCanvas();
      pushHistory();
    }
  });
  bgBoxColorPicker.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.bgBoxColor = bgBoxColorPicker.value;
      bgBoxColorPreview.style.backgroundColor = s.bgBoxColor;
      renderCanvas();
    }
  });
  bgBoxRadiusSlider.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s && s.type === 'text') {
      s.bgBoxRadius = parseInt(bgBoxRadiusSlider.value, 10);
      bgBoxRadiusVal.textContent = `${s.bgBoxRadius}px`;
      renderCanvas();
    }
  });

  // 도형 채우기 & 둥글기
  ctxFillColorPicker.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s) {
      s.fillColor = ctxFillColorPicker.value;
      ctxFillColorPreview.style.backgroundColor = s.fillColor;
      renderCanvas();
    }
  });
  ctxRadiusInput.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s) {
      s.borderRadius = parseInt(ctxRadiusInput.value, 10) || 0;
      renderCanvas();
    }
  });

  // 캔버스 배경색 선택
  ctxCanvasBgPicker.addEventListener('input', () => {
    state.bgType = 'color';
    state.bgColor = ctxCanvasBgPicker.value;
    ctxCanvasBgPreview.style.backgroundColor = state.bgColor;
    renderCanvas();
  });
  ctxCanvasBgPicker.addEventListener('change', pushHistory);

  // 투명도
  ctxOpacitySlider.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s) {
      s.opacity = parseInt(ctxOpacitySlider.value, 10) / 100;
      ctxOpacityVal.textContent = `${ctxOpacitySlider.value}%`;
      renderCanvas();
    }
  });

  ctxDuplicateBtn.addEventListener('click', duplicateSelectedLayer);
  ctxDeleteBtn.addEventListener('click', deleteSelectedLayer);

  function duplicateSelectedLayer() {
    const s = getSelectedLayer();
    if (!s) return;
    const newL = {
      ...s,
      id: 'layer_' + Date.now(),
      name: `${s.name} 복사`,
      x: s.x + 24,
      y: s.y + 24
    };
    if (s.type === 'image' && s._imgEl) newL._imgEl = s._imgEl;
    state.layers.push(newL);
    selectLayer(newL.id);
    pushHistory();
    showToast('복제되었습니다 (Ctrl+D)');
  }

  function deleteSelectedLayer() {
    if (!state.selectedId) return;
    state.layers = state.layers.filter(l => l.id !== state.selectedId);
    selectLayer(null);
    pushHistory();
    showToast('삭제되었습니다');
  }

  // ==========================================================================
  // 정렬 & 레이어 순서 (우측 패널)
  // ==========================================================================
  alignLeftBtn.addEventListener('click', () => { const s = getSelectedLayer(); if (s) { s.x = 0; renderCanvas(); pushHistory(); } });
  alignCenterHBtn.addEventListener('click', () => { const s = getSelectedLayer(); if (s) { s.x = Math.round((state.canvasWidth - s.width) / 2); renderCanvas(); pushHistory(); } });
  alignRightBtn.addEventListener('click', () => { const s = getSelectedLayer(); if (s) { s.x = state.canvasWidth - s.width; renderCanvas(); pushHistory(); } });
  alignTopBtn.addEventListener('click', () => { const s = getSelectedLayer(); if (s) { s.y = 0; renderCanvas(); pushHistory(); } });
  alignCenterVBtn.addEventListener('click', () => { const s = getSelectedLayer(); if (s) { s.y = Math.round((state.canvasHeight - s.height) / 2); renderCanvas(); pushHistory(); } });
  alignBottomBtn.addEventListener('click', () => { const s = getSelectedLayer(); if (s) { s.y = state.canvasHeight - s.height; renderCanvas(); pushHistory(); } });

  btnBringForward.addEventListener('click', () => {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx !== -1 && idx < state.layers.length - 1) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx + 1];
      state.layers[idx + 1] = temp;
      renderCanvas();
      renderLayerList();
      pushHistory();
    }
  });
  btnSendBackward.addEventListener('click', () => {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx > 0) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx - 1];
      state.layers[idx - 1] = temp;
      renderCanvas();
      renderLayerList();
      pushHistory();
    }
  });

  function renderLayerList() {
    layersScrollList.innerHTML = '';
    layerCountBadge.textContent = `${state.layers.length}개`;

    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      const card = document.createElement('div');
      card.className = `layer-card-item ${layer.id === state.selectedId ? 'active' : ''}`;

      const iconMap = { text: '🔤', image: '🖼️', rect: '⬛', circle: '⚪', pill: '💊', star: '⭐', sticker: '✨' };
      card.innerHTML = `
        <span class="layer-item-icon">${iconMap[layer.type] || '📄'}</span>
        <span class="layer-item-name">${layer.name}</span>
        <div class="layer-item-actions">
          <button type="button" class="btn-mini-layer btn-vis" title="보이기/숨기기">${layer.visible ? '👁️' : '🙈'}</button>
          <button type="button" class="btn-mini-layer btn-del" title="삭제">✕</button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-mini-layer')) return;
        selectLayer(layer.id);
      });
      card.querySelector('.btn-vis').addEventListener('click', (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        renderCanvas();
        renderLayerList();
        pushHistory();
      });
      card.querySelector('.btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        state.layers = state.layers.filter(l => l.id !== layer.id);
        if (state.selectedId === layer.id) selectLayer(null);
        renderCanvas();
        renderLayerList();
        pushHistory();
      });

      layersScrollList.appendChild(card);
    }
  }

  // ==========================================================================
  // 좌측 드로어: 텍스트 / 요소 / 템플릿 추가
  // ==========================================================================
  dockNavItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      dockNavItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sideDrawerPanel.classList.remove('collapsed');
      drawerPageViews.forEach(v => v.classList.remove('active'));

      const targetView = document.getElementById(`drawer${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
      if (targetView) targetView.classList.add('active');

      const titleMap = {
        templates: '디자인 템플릿',
        text: '텍스트 스타일',
        elements: '도형 및 요소',
        uploads: '내 업로드 사진',
        background: '배경 설정'
      };
      drawerHeadingTitle.textContent = titleMap[tab] || '드로어';
    });
  });

  btnCloseDrawer.addEventListener('click', () => {
    sideDrawerPanel.classList.toggle('collapsed');
  });

  btnAddHeading.addEventListener('click', () => {
    addNewTextLayer('제목을 입력하세요', 72, "'Pretendard', sans-serif", '#0f172a', true);
  });
  btnAddSubheading.addEventListener('click', () => {
    addNewTextLayer('소제목 텍스트를 입력하세요', 44, "'Pretendard', sans-serif", '#334155', false);
  });
  btnAddBodyText.addEventListener('click', () => {
    addNewTextLayer('여기에 본문 설명을 입력합니다.', 28, "'Noto Sans KR', sans-serif", '#64748b', false);
  });

  function addNewTextLayer(text, fontSize, font, color, bold) {
    const newL = {
      id: 'layer_' + Date.now(),
      type: 'text',
      name: text.slice(0, 14),
      text: text,
      fontFamily: font,
      fontSize: fontSize,
      textColor: color,
      isBold: bold,
      isItalic: false,
      isUnderline: false,
      textAlign: 'left',
      hasOutline: false,
      outlineColor: '#000000',
      outlineWidth: 6,
      hasShadow: false,
      shadowColor: '#000000',
      shadowBlur: 8,
      shadowOffset: 6,
      hasBgBox: false,
      bgBoxColor: '#fef08a',
      bgBoxRadius: 8,
      lineHeight: 1.2,
      x: 120,
      y: 200,
      width: Math.min(800, text.length * fontSize * 0.75 + 40),
      height: fontSize + 30,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    state.layers.push(newL);
    selectLayer(newL.id);
    pushHistory();
    showToast('텍스트가 추가되었습니다. (더블클릭하여 바로 타이핑)');
  }

  // 디자인 텍스트 팩
  document.querySelectorAll('.pack-card').forEach(card => {
    card.addEventListener('click', () => {
      const pack = card.getAttribute('data-pack');
      if (pack === 'yellow-bold') {
        addNewTextLayer('유튜브 레전드 사건', 78, "'Black Han Sans', sans-serif", '#facc15', true);
        const l = getSelectedLayer();
        l.hasOutline = true; l.outlineColor = '#000000'; l.outlineWidth = 8;
        l.hasShadow = true; l.shadowColor = '#000000';
      } else if (pack === 'clean-black') {
        addNewTextLayer('SPECIAL REPORT', 52, "'Pretendard', sans-serif", '#0f172a', true);
      } else if (pack === 'highlight-box') {
        addNewTextLayer('핵심 요약 포인트', 42, "'Pretendard', sans-serif", '#0f172a', true);
        const l = getSelectedLayer();
        l.hasBgBox = true; l.bgBoxColor = '#fef08a';
      } else if (pack === 'handwrite') {
        addNewTextLayer('행복했던 그날의 기억들', 58, "'Nanum Pen Script', cursive", '#4338ca', false);
      }
      renderCanvas();
      syncContextToolbar();
    });
  });

  btnAddRect.addEventListener('click', () => addShape('rect', 360, 240, '#7c3aed', '사각형'));
  btnAddCircle.addEventListener('click', () => addShape('circle', 240, 240, '#ef4444', '원형'));
  btnAddPill.addEventListener('click', () => addShape('pill', 300, 70, '#3b82f6', '알약 라벨'));
  btnAddStar.addEventListener('click', () => addShape('star', 220, 220, '#f59e0b', '별 배지'));

  function addShape(type, w, h, color, name) {
    const newL = {
      id: 'layer_' + Date.now(),
      type: type,
      name: name,
      fillColor: color,
      borderRadius: type === 'pill' ? h / 2 : 0,
      x: Math.round((state.canvasWidth - w) / 2),
      y: Math.round((state.canvasHeight - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    state.layers.push(newL);
    selectLayer(newL.id);
    pushHistory();
    showToast(`${name}이(가) 추가되었습니다.`);
  }

  // 스티커
  document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.getAttribute('data-sticker');
      const newL = {
        id: 'layer_' + Date.now(),
        type: 'sticker',
        name: `스티커 (${emoji})`,
        text: emoji,
        fontSize: 120,
        x: Math.round((state.canvasWidth - 140) / 2),
        y: Math.round((state.canvasHeight - 140) / 2),
        width: 140,
        height: 140,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false
      };
      state.layers.push(newL);
      selectLayer(newL.id);
      pushHistory();
      showToast('스티커가 추가되었습니다.');
    });
  });

  // 사진 업로드
  function handleUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const thumb = document.createElement('div');
        thumb.className = 'upload-thumb-card';
        thumb.innerHTML = `<img src="${dataUrl}" alt="업로드" />`;
        thumb.addEventListener('click', () => insertImage(dataUrl, img, file.name));
        uploadedGalleryGrid.prepend(thumb);
        insertImage(dataUrl, img, file.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function insertImage(dataUrl, img, name) {
    const aspect = img.width / img.height;
    const maxW = Math.min(640, img.width);
    const maxH = Math.round(maxW / aspect);
    const newL = {
      id: 'layer_' + Date.now(),
      type: 'image',
      name: name ? name.slice(0, 14) : '사진 레이어',
      dataUrl: dataUrl,
      _imgEl: img,
      x: Math.round((state.canvasWidth - maxW) / 2),
      y: Math.round((state.canvasHeight - maxH) / 2),
      width: maxW,
      height: maxH,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    state.layers.push(newL);
    selectLayer(newL.id);
    pushHistory();
    showToast('사진이 캔버스에 추가되었습니다.');
  }

  sideUploadInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(handleUpload);
    sideUploadInput.value = '';
  });
  sidebarDropzone.addEventListener('dragover', (e) => e.preventDefault());
  sidebarDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(handleUpload);
  });
  canvasCenterStage.addEventListener('dragover', (e) => e.preventDefault());
  canvasCenterStage.addEventListener('drop', (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(handleUpload);
  });

  // 배경 컬러 & 그라데이션
  document.querySelectorAll('.bg-color-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgType = 'color';
      state.bgColor = btn.getAttribute('data-color');
      ctxCanvasBgPicker.value = state.bgColor;
      ctxCanvasBgPreview.style.backgroundColor = state.bgColor;
      renderCanvas();
      pushHistory();
    });
  });

  document.querySelectorAll('.bg-grad-card').forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgType = 'gradient';
      const grad = btn.getAttribute('data-grad');
      const map = {
        'sunset-peach': { from: '#fbcfe8', to: '#fed7aa' },
        'soft-lavender': { from: '#e0e7ff', to: '#ede9fe' },
        'ocean-breeze': { from: '#cffafe', to: '#bae6fd' },
        'dark-indigo': { from: '#0f172a', to: '#312e81' }
      };
      state.bgGradient = { ...(map[grad] || map['sunset-peach']), angle: 135 };
      renderCanvas();
      pushHistory();
      showToast('그라데이션 배경 적용');
    });
  });

  // 템플릿 로드
  document.querySelectorAll('.canva-template-card').forEach(card => {
    card.addEventListener('click', () => {
      const tpl = card.getAttribute('data-tpl');
      loadTemplate(tpl);
    });
  });

  function loadTemplate(tpl) {
    if (state.layers.length > 0 && !confirm('현재 캔버스의 모든 요소가 템플릿으로 교체됩니다. 계속하시겠습니까?')) {
      return;
    }
    commitInlineTextEditor();

    if (tpl === 'gaming-highlight') {
      state.canvasWidth = 1280; state.canvasHeight = 720;
      state.bgType = 'gradient';
      state.bgGradient = { from: '#1e1b4b', to: '#312e81', angle: 135 };
      state.layers = [
        {
          id: 'l_pill_1', type: 'pill', name: '랭킹 뱃지', fillColor: '#ef4444',
          x: 100, y: 110, width: 220, height: 48, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_pill_t', type: 'text', name: '뱃지 글자', text: '🔥 실시간 랭킹 1위',
          fontFamily: "'Pretendard', sans-serif", fontSize: 24, textColor: '#ffffff', isBold: true,
          x: 125, y: 122, width: 180, height: 30, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_main_t', type: 'text', name: '메인 제목', text: '충격적인 진실 공개!',
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 94, textColor: '#facc15', isBold: true,
          hasOutline: true, outlineColor: '#000000', outlineWidth: 8,
          hasShadow: true, shadowColor: '#000000', shadowBlur: 10, shadowOffset: 8,
          x: 100, y: 190, width: 900, height: 120, rotation: -2, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_sub_t', type: 'text', name: '서브 설명', text: '프로들이 절대 알려주지 않는 웹 디자인의 모든 것',
          fontFamily: "'Pretendard', sans-serif", fontSize: 40, textColor: '#ffffff', isBold: true,
          hasShadow: true, shadowColor: '#000000', shadowBlur: 6, shadowOffset: 4,
          x: 105, y: 340, width: 850, height: 60, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_star_1', type: 'star', name: '골드 스타', fillColor: '#fbbf24',
          x: 980, y: 350, width: 180, height: 180, rotation: 12, opacity: 1, visible: true, locked: false
        }
      ];
    } else if (tpl === 'clean-magazine') {
      state.canvasWidth = 1080; state.canvasHeight = 1080;
      state.bgType = 'color'; state.bgColor = '#f8fafc';
      state.layers = [
        {
          id: 'l_card_box', type: 'rect', name: '화이트 카드 박스', fillColor: '#ffffff', borderRadius: 20,
          x: 60, y: 60, width: 960, height: 960, rotation: 0, opacity: 1, visible: true, locked: false,
          hasShadow: true, shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 20, shadowOffset: 8
        },
        {
          id: 'l_tag_t', type: 'text', name: '리포트 태그', text: 'SPECIAL REPORT · 2026',
          fontFamily: "'Pretendard', sans-serif", fontSize: 26, textColor: '#2563eb', isBold: true,
          x: 120, y: 140, width: 400, height: 35, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_head_t', type: 'text', name: '대제목', text: '새로운 세대의 아웃풋,\n궁디 크리에이티브 스튜디오',
          fontFamily: "'Pretendard', sans-serif", fontSize: 62, textColor: '#0f172a', isBold: true,
          lineHeight: 1.25,
          x: 120, y: 220, width: 840, height: 170, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_body_t', type: 'text', name: '본문 설명', text: '누구나 전문가처럼 캔바와 망고보드 스타일로\n고해상도 썸네일과 배너를 웹에서 즉시 제작합니다.',
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: 32, textColor: '#64748b', isBold: false,
          lineHeight: 1.4,
          x: 120, y: 440, width: 800, height: 100, rotation: 0, opacity: 1, visible: true, locked: false
        }
      ];
    } else if (tpl === 'sale-event') {
      state.canvasWidth = 1200; state.canvasHeight = 630;
      state.bgType = 'gradient';
      state.bgGradient = { from: '#fef08a', to: '#fed7aa', angle: 135 };
      state.layers = [
        {
          id: 'l_sale_tag', type: 'pill', name: '한정 세일 태그', fillColor: '#dc2626',
          x: 80, y: 80, width: 200, height: 46, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_sale_tt', type: 'text', name: '태그 글자', text: '선착순 특가 혜택',
          fontFamily: "'Pretendard', sans-serif", fontSize: 22, textColor: '#ffffff', isBold: true,
          x: 105, y: 92, width: 160, height: 30, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_sale_title', type: 'text', name: '세일 타이틀', text: '최대 80% 파격 세일!',
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 88, textColor: '#7c2d12', isBold: true,
          hasOutline: true, outlineColor: '#ffffff', outlineWidth: 8,
          x: 80, y: 160, width: 900, height: 110, rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_sale_sub', type: 'text', name: '기간 설명', text: '단 3일간만 진행되는 궁디 스튜디오 오픈 프로모션',
          fontFamily: "'Pretendard', sans-serif", fontSize: 34, textColor: '#9a3412', isBold: true,
          x: 85, y: 300, width: 800, height: 50, rotation: 0, opacity: 1, visible: true, locked: false
        }
      ];
    }

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    canvasPresetSelect.value = `${state.canvasWidth}x${state.canvasHeight}`;
    updateDimUI();
    fitToScreen();
    selectLayer(state.layers[state.layers.length - 1]?.id || null);
    pushHistory();
    showToast('템플릿이 로드되었습니다!');
  }

  // ==========================================================================
  // 단축키 시스템
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'ㅋ') && !e.shiftKey) {
      e.preventDefault(); undo();
    } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'ㅛ') || (e.shiftKey && (e.key === 'z' || e.key === 'ㅋ')))) {
      e.preventDefault(); redo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'ㅇ')) {
      e.preventDefault(); duplicateSelectedLayer();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedLayer();
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      const s = getSelectedLayer();
      if (!s) return;
      e.preventDefault();
      const dist = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') s.x -= dist;
      if (e.key === 'ArrowRight') s.x += dist;
      if (e.key === 'ArrowUp') s.y -= dist;
      if (e.key === 'ArrowDown') s.y += dist;
      renderCanvas();
    }
  });

  // Ctrl + 휠 줌
  canvasCenterStage.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(state.zoom + delta);
    }
  }, { passive: false });

  // 캔버스 크기 프리셋
  canvasPresetSelect.addEventListener('change', () => {
    const val = canvasPresetSelect.value;
    if (val === 'custom') {
      const input = prompt('가로x세로 (예: 1920x1080):', `${state.canvasWidth}x${state.canvasHeight}`);
      if (input && input.includes('x')) {
        const [w, h] = input.split('x').map(Number);
        if (w > 100 && h > 100) { state.canvasWidth = w; state.canvasHeight = h; }
      }
    } else {
      const [w, h] = val.split('x').map(Number);
      state.canvasWidth = w; state.canvasHeight = h;
    }
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    updateDimUI();
    fitToScreen();
    renderCanvas();
    pushHistory();
  });

  zoomInBtn.addEventListener('click', () => setZoom(state.zoom + 0.15));
  zoomOutBtn.addEventListener('click', () => setZoom(state.zoom - 0.15));
  zoomFitBtn.addEventListener('click', fitToScreen);

  // 💾 프로젝트 저장 (.gdp-img)
  saveProjectBtn.addEventListener('click', () => {
    commitInlineTextEditor();
    const projectData = {
      version: '3.0',
      type: 'goongdi-canva-project',
      savedAt: new Date().toISOString(),
      docTitle: state.docTitle,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      bgType: state.bgType,
      bgColor: state.bgColor,
      bgGradient: state.bgGradient,
      layers: state.layers.map(l => {
        const copy = { ...l };
        delete copy._imgEl;
        return copy;
      })
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.docTitle.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}_${Date.now()}.gdp-img`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('프로젝트 파일(.gdp-img)이 다운로드되었습니다!');
  });

  // 📁 프로젝트 열기
  loadProjectInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.layers) throw new Error('올바른 궁디 프로젝트 파일이 아닙니다.');
        restoreSnapshot(JSON.stringify(data));
        fitToScreen();
        showToast('프로젝트를 불러왔습니다!');
      } catch (err) {
        alert('프로젝트 파일 로드 실패: ' + err.message);
      }
    };
    reader.readAsText(file);
    loadProjectInput.value = '';
  });

  docTitleInput.addEventListener('input', () => {
    state.docTitle = docTitleInput.value.trim() || '새 썸네일 디자인';
  });

  // ==========================================================================
  // 고해상도 내보내기 (1X, 2X, PNG/JPG/WebP)
  // ==========================================================================
  exportMainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenuPopover.classList.toggle('open');
  });

  window.addEventListener('click', () => {
    exportMenuPopover.classList.remove('open');
  });

  document.querySelectorAll('.export-popover-item').forEach(btn => {
    btn.addEventListener('click', () => {
      commitInlineTextEditor();
      selectLayer(null);

      const format = btn.getAttribute('data-format');
      const scale = parseInt(btn.getAttribute('data-scale'), 10) || 1;

      showToast(`${scale}X 고해상도 이미지 렌더링 중...`);

      setTimeout(() => {
        let exportCanvas = canvas;
        if (scale > 1) {
          exportCanvas = document.createElement('canvas');
          exportCanvas.width = canvas.width * scale;
          exportCanvas.height = canvas.height * scale;
          const eCtx = exportCanvas.getContext('2d');
          eCtx.scale(scale, scale);

          if (state.bgType === 'gradient' && state.bgGradient) {
            const grad = eCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, state.bgGradient.from);
            grad.addColorStop(1, state.bgGradient.to);
            eCtx.fillStyle = grad;
          } else {
            eCtx.fillStyle = state.bgColor;
          }
          eCtx.fillRect(0, 0, canvas.width, canvas.height);

          state.layers.forEach(layer => {
            if (!layer.visible) return;
            eCtx.save();
            eCtx.globalAlpha = layer.opacity;
            const cx = layer.x + layer.width / 2;
            const cy = layer.y + layer.height / 2;
            eCtx.translate(cx, cy);
            eCtx.rotate((layer.rotation * Math.PI) / 180);
            eCtx.translate(-cx, -cy);

            if (layer.hasShadow) {
              eCtx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.45)';
              eCtx.shadowBlur = layer.shadowBlur || 8;
              eCtx.shadowOffsetX = layer.shadowOffset || 6;
              eCtx.shadowOffsetY = layer.shadowOffset || 6;
            }

            if (layer.type === 'rect') {
              eCtx.fillStyle = layer.fillColor || '#7c3aed';
              if (layer.borderRadius > 0) drawRoundedRect(eCtx, layer.x, layer.y, layer.width, layer.height, layer.borderRadius);
              else eCtx.fillRect(layer.x, layer.y, layer.width, layer.height);
              eCtx.fill();
            } else if (layer.type === 'circle') {
              eCtx.fillStyle = layer.fillColor || '#ef4444';
              eCtx.beginPath();
              eCtx.ellipse(cx, cy, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
              eCtx.fill();
            } else if (layer.type === 'pill') {
              eCtx.fillStyle = layer.fillColor || '#3b82f6';
              drawRoundedRect(eCtx, layer.x, layer.y, layer.width, layer.height, layer.height / 2);
              eCtx.fill();
            } else if (layer.type === 'star') {
              eCtx.fillStyle = layer.fillColor || '#f59e0b';
              drawStar(eCtx, cx, cy, 5, layer.width / 2, layer.width / 4);
              eCtx.fill();
            } else if (layer.type === 'text') {
              renderTextLayer(eCtx, layer);
            } else if (layer.type === 'image' && layer._imgEl) {
              eCtx.drawImage(layer._imgEl, layer.x, layer.y, layer.width, layer.height);
            }
            eCtx.restore();
          });
        }

        const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const ext = format === 'jpeg' ? 'jpg' : format;
        const dataUrl = exportCanvas.toDataURL(mime, 0.95);

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${state.docTitle.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}_${scale}x.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`${scale}X ${ext.toUpperCase()} 다운로드 완료!`);
      }, 50);
    });
  });

  // ==========================================================================
  // 초기화: 화사한 매거진 카드뉴스 데모 로드
  // ==========================================================================
  function init() {
    loadTemplate('clean-magazine');
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
  }

  init();
})();
