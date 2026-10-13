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
  const btnOpenShortcuts = document.getElementById('btnOpenShortcuts');
  const canvasPresetSelect = document.getElementById('canvasPresetSelect');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const zoomLevelSelect = document.getElementById('zoomLevelSelect');
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

  // 도형 전용 컨트롤 (테두리 및 스타일 고도화, 굴곡, 화살표, 별 조절)
  const ctxShapeGroup = document.getElementById('ctxShapeGroup');
  const ctxFillColorPicker = document.getElementById('ctxFillColorPicker');
  const ctxFillColorPreview = document.getElementById('ctxFillColorPreview');
  const ctxStrokeColorPicker = document.getElementById('ctxStrokeColorPicker');
  const ctxStrokeColorPreview = document.getElementById('ctxStrokeColorPreview');
  const ctxStrokeWidthInput = document.getElementById('ctxStrokeWidthInput');
  const ctxStrokeWidthMinus = document.getElementById('ctxStrokeWidthMinus');
  const ctxStrokeWidthPlus = document.getElementById('ctxStrokeWidthPlus');
  const ctxStrokeStyleSelect = document.getElementById('ctxStrokeStyleSelect');
  const ctxRadiusSlider = document.getElementById('ctxRadiusSlider');
  const ctxRadiusVal = document.getElementById('ctxRadiusVal');
  const ctxArrowControls = document.getElementById('ctxArrowControls');
  const ctxArrowHeadSlider = document.getElementById('ctxArrowHeadSlider');
  const ctxArrowStemSlider = document.getElementById('ctxArrowStemSlider');
  const ctxStarControls = document.getElementById('ctxStarControls');
  const ctxStarPointsSelect = document.getElementById('ctxStarPointsSelect');
  const ctxStarRatioSlider = document.getElementById('ctxStarRatioSlider');

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

  // 텍스트 서브탭 (추가/편집 vs 텍스트 효과)
  const tabTextAdd = document.getElementById('tabTextAdd');
  const tabTextEffects = document.getElementById('tabTextEffects');
  const subviewTextAdd = document.getElementById('subviewTextAdd');
  const subviewTextEffects = document.getElementById('subviewTextEffects');

  const btnAddHeading = document.getElementById('btnAddHeading');
  const btnAddSubheading = document.getElementById('btnAddSubheading');
  const btnAddBodyText = document.getElementById('btnAddBodyText');

  // 배경 컨트롤 (투명 배경 & 커스텀 그라데이션)
  const btnSetTransparentBg = document.getElementById('btnSetTransparentBg');
  const gradFromPicker = document.getElementById('gradFromPicker');
  const gradFromPreview = document.getElementById('gradFromPreview');
  const gradToPicker = document.getElementById('gradToPicker');
  const gradToPreview = document.getElementById('gradToPreview');
  const gradAngleSlider = document.getElementById('gradAngleSlider');
  const gradAngleVal = document.getElementById('gradAngleVal');
  const gradLivePreviewBar = document.getElementById('gradLivePreviewBar');
  const btnApplyCustomGrad = document.getElementById('btnApplyCustomGrad');

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

  // 모달 엘리먼트 3종
  const customCanvasModal = document.getElementById('customCanvasModal');
  const btnCloseCustomSizeModal = document.getElementById('btnCloseCustomSizeModal');
  const btnCancelCustomSize = document.getElementById('btnCancelCustomSize');
  const btnApplyCustomSize = document.getElementById('btnApplyCustomSize');
  const customWidthInput = document.getElementById('customWidthInput');
  const customHeightInput = document.getElementById('customHeightInput');

  const confirmModal = document.getElementById('confirmModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalMsg = document.getElementById('confirmModalMsg');
  const btnCloseConfirmModal = document.getElementById('btnCloseConfirmModal');
  const btnCancelConfirm = document.getElementById('btnCancelConfirm');
  const btnOkConfirm = document.getElementById('btnOkConfirm');

  const shortcutGuideModal = document.getElementById('shortcutGuideModal');
  const btnCloseShortcutsModal = document.getElementById('btnCloseShortcutsModal');
  const btnDismissShortcuts = document.getElementById('btnDismissShortcuts');

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
    panX: 0,
    panY: 0,
    isSpaceDown: false,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    selectedId: null,
    editingTextId: null, // 캔버스 인라인 타이핑 중인 텍스트 레이어 ID
    layers: [],
    clipboard: null, // 레이어 복사 버퍼
    history: [],
    historyIndex: -1,

    dragState: {
      isDragging: false,
      mode: null, // 'move' | 'resize' | 'rotate'
      handle: null, // 'tl','tr','br','bl','tc','bc','ml','mr','rot'
      startX: 0,
      startY: 0,
      initialLayer: null
    },

    snapGuides: { xList: [], yList: [] }
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

  function updateTransform() {
    canvasPaperShadowWrap.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  }

  function setZoom(newZoom) {
    state.zoom = Math.max(0.15, Math.min(3.5, newZoom));
    updateTransform();
    if (zoomValLabel) zoomValLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    if (zoomLevelSelect) {
      // 가장 가까운 옵션 선택 또는 1
      const rounded = (Math.round(state.zoom * 100) / 100).toString();
      const matchOpt = Array.from(zoomLevelSelect.options).find(o => Math.abs(parseFloat(o.value) - state.zoom) < 0.1);
      if (matchOpt) zoomLevelSelect.value = matchOpt.value;
    }
  }

  function fitToScreen() {
    state.panX = 0;
    state.panY = 0;
    const pad = 120;
    const availW = canvasCenterStage.clientWidth - pad;
    const availH = canvasCenterStage.clientHeight - pad;
    const scale = Math.min(availW / state.canvasWidth, availH / state.canvasHeight);
    setZoom(Math.max(0.2, Math.min(1.0, scale)));
  }

  // ==========================================================================
  // 모달 제어 시스템 (브라우저 prompt / confirm 100% 대체)
  // ==========================================================================
  function openCustomCanvasModal() {
    if (customWidthInput) customWidthInput.value = state.canvasWidth;
    if (customHeightInput) customHeightInput.value = state.canvasHeight;
    if (customCanvasModal) customCanvasModal.classList.add('open');
  }

  function closeCustomCanvasModal() {
    if (customCanvasModal) customCanvasModal.classList.remove('open');
  }

  let confirmResolve = null;
  function showConfirmModal(title, msg) {
    return new Promise((resolve) => {
      confirmResolve = resolve;
      if (confirmModalTitle) confirmModalTitle.textContent = title;
      if (confirmModalMsg) confirmModalMsg.textContent = msg;
      if (confirmModal) confirmModal.classList.add('open');
    });
  }

  function closeConfirmModal(result) {
    if (confirmModal) confirmModal.classList.remove('open');
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  }

  function openShortcutsModal() {
    if (shortcutGuideModal) shortcutGuideModal.classList.add('open');
  }

  function closeShortcutsModal() {
    if (shortcutGuideModal) shortcutGuideModal.classList.remove('open');
  }

  // ==========================================================================
  // 캔버스 렌더링 파이프라인
  // ==========================================================================
  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 배경 채우기 (투명 / 그라데이션 / 단색)
    if (state.bgType === 'transparent') {
      if (canvasPaperShadowWrap) canvasPaperShadowWrap.classList.add('is-transparent-bg');
      // 투명 배경일 때는 채우기 생략 (알파 채널 보존)
    } else if (state.bgType === 'gradient' && state.bgGradient) {
      if (canvasPaperShadowWrap) canvasPaperShadowWrap.classList.remove('is-transparent-bg');
      const angle = state.bgGradient.angle !== undefined ? state.bgGradient.angle : 135;
      const angleRad = ((angle - 90) * Math.PI) / 180;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.hypot(canvas.width, canvas.height) / 2;
      const x0 = cx - Math.cos(angleRad) * r;
      const y0 = cy - Math.sin(angleRad) * r;
      const x1 = cx + Math.cos(angleRad) * r;
      const y1 = cy + Math.sin(angleRad) * r;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, state.bgGradient.from || '#fbcfe8');
      grad.addColorStop(1, state.bgGradient.to || '#fed7aa');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      if (canvasPaperShadowWrap) canvasPaperShadowWrap.classList.remove('is-transparent-bg');
      ctx.fillStyle = state.bgColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. 레이어 렌더링
    state.layers.forEach(layer => {
      if (!layer.visible) return;
      if (layer.id === state.editingTextId) return; // 타이핑 중인 텍스트는 인라인 textarea로 표시

      ctx.save();
      ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;

      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      // 그림자
      if (layer.hasShadow) {
        ctx.shadowColor = layer.shadowColor || 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = layer.shadowBlur || 8;
        ctx.shadowOffsetX = layer.shadowOffset || 6;
        ctx.shadowOffsetY = layer.shadowOffset || 6;
      }

      const shapeTypes = [
        'rect', 'roundRect', 'circle', 'ellipse', 'pill',
        'triangle', 'rightTriangle', 'diamond', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon',
        'star', 'star4', 'star6', 'star8', 'heart', 'cross', 'lightning', 'shield', 'clover', 'crescent',
        'arrow', 'arrowLeft', 'arrowUp', 'arrowDown', 'arrowBoth', 'chevron',
        'bubble', 'bubbleRect', 'bubbleCloud', 'ribbon', 'gearBadge', 'ticket'
      ];

      if (shapeTypes.includes(layer.type)) {
        renderShapeLayer(ctx, layer);
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

    // 3. 다중 스마트 자석 스냅 가이드라인 그리기 (핑크 점선 & 교차점 마커)
    if (state.snapGuides.xList && state.snapGuides.xList.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      state.snapGuides.xList.forEach(sx => {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, canvas.height);
        ctx.stroke();

        // 상단/하단 자석 포인트 표시
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(sx - 3, 0, 6, 6);
        ctx.fillRect(sx - 3, canvas.height - 6, 6, 6);
      });
      ctx.restore();
    }

    if (state.snapGuides.yList && state.snapGuides.yList.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      state.snapGuides.yList.forEach(sy => {
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(canvas.width, sy);
        ctx.stroke();

        // 좌측/우측 자석 포인트 표시
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, sy - 3, 6, 6);
        ctx.fillRect(canvas.width - 6, sy - 3, 6, 6);
      });
      ctx.restore();
    }

    // 4. 선택된 레이어 바운딩 박스 & 플로팅 퀵 액션 바
    const selected = getSelectedLayer();
    if (selected && selected.id !== state.editingTextId) {
      drawCanvaBoundingBox(selected);
      renderFloatingQuickBar(selected);
    } else {
      removeFloatingQuickBar();
    }
  }

  // 35+종 풍부한 벡터 도형 정밀 렌더러 (채우기, 테두리 두께/스타일/색상, 굴곡, 화살표 머리/줄기, 별 파라미터 완벽 지원)
  function renderShapeLayer(c, layer) {
    const lx = layer.x;
    const ly = layer.y;
    const lw = layer.width;
    const lh = layer.height;
    const cx = lx + lw / 2;
    const cy = ly + lh / 2;
    const radius = layer.borderRadius || 0;

    c.beginPath();

    // 1) 기본 기하학
    if (layer.type === 'rect') {
      if (radius > 0) drawRoundedRect(c, lx, ly, lw, lh, radius);
      else c.rect(lx, ly, lw, lh);
    } else if (layer.type === 'roundRect') {
      drawRoundedRect(c, lx, ly, lw, lh, radius > 0 ? radius : 20);
    } else if (layer.type === 'circle' || layer.type === 'ellipse') {
      c.ellipse(cx, cy, lw / 2, lh / 2, 0, 0, Math.PI * 2);
    } else if (layer.type === 'pill') {
      drawRoundedRect(c, lx, ly, lw, lh, Math.min(lw, lh) / 2);
    }

    // 2) 다각형
    else if (layer.type === 'triangle') {
      c.moveTo(cx, ly);
      c.lineTo(lx + lw, ly + lh);
      c.lineTo(lx, ly + lh);
      c.closePath();
    } else if (layer.type === 'rightTriangle') {
      c.moveTo(lx, ly);
      c.lineTo(lx + lw, ly + lh);
      c.lineTo(lx, ly + lh);
      c.closePath();
    } else if (layer.type === 'diamond') {
      c.moveTo(cx, ly);
      c.lineTo(lx + lw, cy);
      c.lineTo(cx, ly + lh);
      c.lineTo(lx, cy);
      c.closePath();
    } else if (layer.type === 'parallelogram') {
      const shift = lw * 0.22;
      c.moveTo(lx + shift, ly);
      c.lineTo(lx + lw, ly);
      c.lineTo(lx + lw - shift, ly + lh);
      c.lineTo(lx, ly + lh);
      c.closePath();
    } else if (layer.type === 'trapezoid') {
      const inset = lw * 0.2;
      c.moveTo(lx + inset, ly);
      c.lineTo(lx + lw - inset, ly);
      c.lineTo(lx + lw, ly + lh);
      c.lineTo(lx, ly + lh);
      c.closePath();
    } else if (layer.type === 'pentagon') {
      drawRegularPolygon(c, cx, cy, 5, Math.min(lw, lh) / 2, -Math.PI / 2);
    } else if (layer.type === 'hexagon') {
      drawRegularPolygon(c, cx, cy, 6, Math.min(lw, lh) / 2, -Math.PI / 2);
    } else if (layer.type === 'octagon') {
      drawRegularPolygon(c, cx, cy, 8, Math.min(lw, lh) / 2, Math.PI / 8);
    }

    // 3) 별 & 기호
    else if (layer.type === 'star') {
      const pts = layer.starPoints || 5;
      const innerRatio = layer.starInnerRatio !== undefined ? layer.starInnerRatio : 0.45;
      drawStar(c, cx, cy, pts, Math.min(lw, lh) / 2, (Math.min(lw, lh) / 2) * innerRatio);
    } else if (layer.type === 'star4') {
      drawStar(c, cx, cy, 4, Math.min(lw, lh) / 2, (Math.min(lw, lh) / 2) * 0.3);
    } else if (layer.type === 'star6') {
      drawStar(c, cx, cy, 6, Math.min(lw, lh) / 2, (Math.min(lw, lh) / 2) * 0.55);
    } else if (layer.type === 'star8') {
      drawStar(c, cx, cy, 8, Math.min(lw, lh) / 2, (Math.min(lw, lh) / 2) * 0.5);
    } else if (layer.type === 'heart') {
      const topCurveHeight = lh * 0.3;
      c.moveTo(cx, ly + topCurveHeight);
      c.bezierCurveTo(cx, ly, lx, ly, lx, ly + topCurveHeight);
      c.bezierCurveTo(lx, ly + (lh + topCurveHeight) / 2, cx, ly + (lh + topCurveHeight) / 1.4, cx, ly + lh);
      c.bezierCurveTo(cx, ly + (lh + topCurveHeight) / 1.4, lx + lw, ly + (lh + topCurveHeight) / 2, lx + lw, ly + topCurveHeight);
      c.bezierCurveTo(lx + lw, ly, cx, ly, cx, ly + topCurveHeight);
      c.closePath();
    } else if (layer.type === 'cross') {
      const t = Math.min(lw, lh) * 0.3;
      c.moveTo(cx - t / 2, ly);
      c.lineTo(cx + t / 2, ly);
      c.lineTo(cx + t / 2, cy - t / 2);
      c.lineTo(lx + lw, cy - t / 2);
      c.lineTo(lx + lw, cy + t / 2);
      c.lineTo(cx + t / 2, cy + t / 2);
      c.lineTo(cx + t / 2, ly + lh);
      c.lineTo(cx - t / 2, ly + lh);
      c.lineTo(cx - t / 2, cy + t / 2);
      c.lineTo(lx, cy + t / 2);
      c.lineTo(lx, cy - t / 2);
      c.lineTo(cx - t / 2, cy - t / 2);
      c.closePath();
    } else if (layer.type === 'lightning') {
      c.moveTo(lx + lw * 0.55, ly);
      c.lineTo(lx + lw * 0.1, cy + lh * 0.05);
      c.lineTo(lx + lw * 0.5, cy + lh * 0.05);
      c.lineTo(lx + lw * 0.45, ly + lh);
      c.lineTo(lx + lw * 0.9, cy - lh * 0.05);
      c.lineTo(lx + lw * 0.52, cy - lh * 0.05);
      c.closePath();
    } else if (layer.type === 'shield') {
      c.moveTo(lx, ly);
      c.lineTo(lx + lw, ly);
      c.lineTo(lx + lw, cy);
      c.quadraticCurveTo(lx + lw, ly + lh, cx, ly + lh);
      c.quadraticCurveTo(lx, ly + lh, lx, cy);
      c.closePath();
    } else if (layer.type === 'clover') {
      const cr = Math.min(lw, lh) * 0.25;
      c.arc(cx - cr * 0.7, cy - cr * 0.7, cr, 0, Math.PI * 2);
      c.arc(cx + cr * 0.7, cy - cr * 0.7, cr, 0, Math.PI * 2);
      c.arc(cx - cr * 0.7, cy + cr * 0.7, cr, 0, Math.PI * 2);
      c.arc(cx + cr * 0.7, cy + cr * 0.7, cr, 0, Math.PI * 2);
    } else if (layer.type === 'crescent') {
      c.arc(cx, cy, Math.min(lw, lh) / 2, 0.4 * Math.PI, 1.6 * Math.PI, false);
      c.arc(cx + lw * 0.25, cy, Math.min(lw, lh) * 0.45, 1.5 * Math.PI, 0.5 * Math.PI, true);
      c.closePath();
    }

    // 4) 화살표 & 포인터 (머리 크기 및 줄기 두께 비율 조절 지원!)
    else if (layer.type === 'arrow') {
      const headRatio = layer.arrowHeadRatio !== undefined ? layer.arrowHeadRatio : 0.35;
      const stemRatio = layer.arrowStemRatio !== undefined ? layer.arrowStemRatio : 0.35;
      const headW = lw * headRatio;
      const stemH = lh * stemRatio;
      c.moveTo(lx, cy - stemH / 2);
      c.lineTo(lx + lw - headW, cy - stemH / 2);
      c.lineTo(lx + lw - headW, ly);
      c.lineTo(lx + lw, cy);
      c.lineTo(lx + lw - headW, ly + lh);
      c.lineTo(lx + lw - headW, cy + stemH / 2);
      c.lineTo(lx, cy + stemH / 2);
      c.closePath();
    } else if (layer.type === 'arrowLeft') {
      const headRatio = layer.arrowHeadRatio !== undefined ? layer.arrowHeadRatio : 0.35;
      const stemRatio = layer.arrowStemRatio !== undefined ? layer.arrowStemRatio : 0.35;
      const headW = lw * headRatio;
      const stemH = lh * stemRatio;
      c.moveTo(lx + lw, cy - stemH / 2);
      c.lineTo(lx + headW, cy - stemH / 2);
      c.lineTo(lx + headW, ly);
      c.lineTo(lx, cy);
      c.lineTo(lx + headW, ly + lh);
      c.lineTo(lx + headW, cy + stemH / 2);
      c.lineTo(lx + lw, cy + stemH / 2);
      c.closePath();
    } else if (layer.type === 'arrowUp') {
      const headRatio = layer.arrowHeadRatio !== undefined ? layer.arrowHeadRatio : 0.35;
      const stemRatio = layer.arrowStemRatio !== undefined ? layer.arrowStemRatio : 0.35;
      const headH = lh * headRatio;
      const stemW = lw * stemRatio;
      c.moveTo(cx - stemW / 2, ly + lh);
      c.lineTo(cx - stemW / 2, ly + headH);
      c.lineTo(lx, ly + headH);
      c.lineTo(cx, ly);
      c.lineTo(lx + lw, ly + headH);
      c.lineTo(cx + stemW / 2, ly + headH);
      c.lineTo(cx + stemW / 2, ly + lh);
      c.closePath();
    } else if (layer.type === 'arrowDown') {
      const headRatio = layer.arrowHeadRatio !== undefined ? layer.arrowHeadRatio : 0.35;
      const stemRatio = layer.arrowStemRatio !== undefined ? layer.arrowStemRatio : 0.35;
      const headH = lh * headRatio;
      const stemW = lw * stemRatio;
      c.moveTo(cx - stemW / 2, ly);
      c.lineTo(cx - stemW / 2, ly + lh - headH);
      c.lineTo(lx, ly + lh - headH);
      c.lineTo(cx, ly + lh);
      c.lineTo(lx + lw, ly + lh - headH);
      c.lineTo(cx + stemW / 2, ly + lh - headH);
      c.lineTo(cx + stemW / 2, ly);
      c.closePath();
    } else if (layer.type === 'arrowBoth') {
      const headW = lw * 0.28;
      const stemH = lh * 0.35;
      c.moveTo(lx + headW, cy - stemH / 2);
      c.lineTo(lx + lw - headW, cy - stemH / 2);
      c.lineTo(lx + lw - headW, ly);
      c.lineTo(lx + lw, cy);
      c.lineTo(lx + lw - headW, ly + lh);
      c.lineTo(lx + lw - headW, cy + stemH / 2);
      c.lineTo(lx + headW, cy + stemH / 2);
      c.lineTo(lx + headW, ly + lh);
      c.lineTo(lx, cy);
      c.lineTo(lx + headW, ly);
      c.closePath();
    } else if (layer.type === 'chevron') {
      const t = lw * 0.3;
      c.moveTo(lx, ly);
      c.lineTo(lx + lw - t, cy);
      c.lineTo(lx, ly + lh);
      c.lineTo(lx + t, ly + lh);
      c.lineTo(lx + lw, cy);
      c.lineTo(lx + t, ly);
      c.closePath();
    }

    // 5) 말풍선 & 배지
    else if (layer.type === 'bubble') {
      const tailW = lw * 0.18;
      const tailH = lh * 0.22;
      const bodyH = lh - tailH;
      drawRoundedRect(c, lx, ly, lw, bodyH, radius > 0 ? radius : 14);
      c.moveTo(lx + lw * 0.25, ly + bodyH);
      c.lineTo(lx + lw * 0.25, ly + lh);
      c.lineTo(lx + lw * 0.25 + tailW, ly + bodyH);
      c.closePath();
    } else if (layer.type === 'bubbleRect') {
      const tailW = lw * 0.18;
      const tailH = lh * 0.22;
      const bodyH = lh - tailH;
      if (radius > 0) drawRoundedRect(c, lx, ly, lw, bodyH, radius);
      else c.rect(lx, ly, lw, bodyH);
      c.moveTo(lx + lw * 0.2, ly + bodyH);
      c.lineTo(lx + lw * 0.1, ly + lh);
      c.lineTo(lx + lw * 0.38, ly + bodyH);
      c.closePath();
    } else if (layer.type === 'bubbleCloud') {
      const cr = Math.min(lw, lh) * 0.25;
      c.arc(cx - cr, cy, cr * 0.8, 0, Math.PI * 2);
      c.arc(cx, cy - cr * 0.6, cr, 0, Math.PI * 2);
      c.arc(cx + cr, cy, cr * 0.8, 0, Math.PI * 2);
      c.arc(cx, cy + cr * 0.5, cr * 0.9, 0, Math.PI * 2);
    } else if (layer.type === 'ribbon') {
      const cut = lw * 0.15;
      c.moveTo(lx, ly);
      c.lineTo(lx + lw, ly);
      c.lineTo(lx + lw - cut, cy);
      c.lineTo(lx + lw, ly + lh);
      c.lineTo(lx, ly + lh);
      c.lineTo(lx + cut, cy);
      c.closePath();
    } else if (layer.type === 'gearBadge') {
      drawStar(c, cx, cy, 12, Math.min(lw, lh) / 2, (Math.min(lw, lh) / 2) * 0.82);
    } else if (layer.type === 'ticket') {
      const rH = lh * 0.2;
      c.moveTo(lx + 8, ly);
      c.lineTo(lx + lw - 8, ly);
      c.arc(lx + lw, cy, rH, 1.5 * Math.PI, 0.5 * Math.PI, true);
      c.lineTo(lx + lw - 8, ly + lh);
      c.lineTo(lx + 8, ly + lh);
      c.arc(lx, cy, rH, 0.5 * Math.PI, 1.5 * Math.PI, true);
      c.closePath();
    }

    // 채우기
    c.fillStyle = layer.fillColor || '#7c3aed';
    c.fill();

    // 테두리 선 (Stroke)
    if (layer.strokeWidth && layer.strokeWidth > 0) {
      c.lineWidth = layer.strokeWidth;
      c.strokeStyle = layer.strokeColor || '#000000';
      if (layer.strokeStyle === 'dashed') {
        c.setLineDash([6, 6]);
      } else {
        c.setLineDash([]);
      }
      c.stroke();
      c.setLineDash([]);
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

  function drawRegularPolygon(c, cx, cy, sides, radius, startAngle) {
    const angle = (Math.PI * 2) / sides;
    c.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = startAngle + i * angle;
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
  }

  // ==========================================================================
  // Canva & Adobe Express 스타일 바운딩 박스 & 8방향 리사이즈 핸들
  // ==========================================================================
  function drawCanvaBoundingBox(layer) {
    ctx.save();
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // 슬림한 보라색 프레임 (외곽선)
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

    // 상단 회전 핸들 스템 (연결선)
    const rotY = layer.y - 28;
    ctx.beginPath();
    ctx.moveTo(cx, layer.y);
    ctx.lineTo(cx, rotY);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 상단 둥근 회전 아이콘 핸들
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, rotY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 회전 핸들 내부 회전 심볼
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, rotY, 4, 0.4 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    // 8개 리사이즈 핸들 (모서리 4개 + 변 4개)
    const handles = getHandles(layer);
    handles.forEach(h => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;

      if (['tl', 'tr', 'br', 'bl'].includes(h.id)) {
        // 모서리 핸들: 둥근 사각형 핸들 (10x10px)
        const size = 10;
        ctx.beginPath();
        drawRoundedRect(ctx, h.x - size / 2, h.y - size / 2, size, size, 2.5);
        ctx.fill();
        ctx.stroke();
      } else if (h.id === 'tc' || h.id === 'bc') {
        // 상/하 변 핸들: 가로 바 (14x6px)
        const bw = 14, bh = 6;
        ctx.beginPath();
        drawRoundedRect(ctx, h.x - bw / 2, h.y - bh / 2, bw, bh, 2.5);
        ctx.fill();
        ctx.stroke();
      } else if (h.id === 'ml' || h.id === 'mr') {
        // 좌/우 변 핸들: 세로 바 (6x14px)
        const bw = 6, bh = 14;
        ctx.beginPath();
        drawRoundedRect(ctx, h.x - bw / 2, h.y - bh / 2, bw, bh, 2.5);
        ctx.fill();
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // 8방향 리사이즈 핸들 좌표 계산
  function getHandles(layer) {
    const lx = layer.x;
    const ly = layer.y;
    const lw = layer.width;
    const lh = layer.height;
    return [
      // 4개 모서리
      { id: 'tl', x: lx, y: ly, cursor: 'nwse-resize' },
      { id: 'tr', x: lx + lw, y: ly, cursor: 'nesw-resize' },
      { id: 'br', x: lx + lw, y: ly + lh, cursor: 'nwse-resize' },
      { id: 'bl', x: lx, y: ly + lh, cursor: 'nesw-resize' },
      // 4개 변 중앙
      { id: 'tc', x: lx + lw / 2, y: ly, cursor: 'ns-resize' },
      { id: 'bc', x: lx + lw / 2, y: ly + lh, cursor: 'ns-resize' },
      { id: 'ml', x: lx, y: ly + lh / 2, cursor: 'ew-resize' },
      { id: 'mr', x: lx + lw, y: ly + lh / 2, cursor: 'ew-resize' }
    ];
  }

  // ==========================================================================
  // 어도비 익스프레스 스타일 플로팅 퀵 액션 툴바
  // ==========================================================================
  function renderFloatingQuickBar(layer) {
    let bar = interactiveOverlay.querySelector('.floating-quick-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'floating-quick-bar';
      interactiveOverlay.appendChild(bar);
    }

    const barX = layer.x + layer.width / 2;
    const barY = Math.max(20, layer.y - 36);
    bar.style.left = `${barX}px`;
    bar.style.top = `${barY}px`;

    if (layer.type === 'text') {
      bar.innerHTML = `
        <button type="button" class="quick-bar-btn btn-accent" data-act="edit">✏️ 인라인 편집</button>
        <button type="button" class="quick-bar-btn" data-act="bold"><strong>B</strong></button>
        <button type="button" class="quick-bar-btn" data-act="italic"><em>I</em></button>
        <button type="button" class="quick-bar-btn" data-act="underline"><u>U</u></button>
        <div class="quick-bar-sep"></div>
        <button type="button" class="quick-bar-btn" data-act="duplicate" title="복제 (Ctrl+D)">📄 복제</button>
        <button type="button" class="quick-bar-btn" data-act="delete" style="color:#ef4444;" title="삭제 (Delete)">🗑️</button>
      `;
    } else {
      bar.innerHTML = `
        <button type="button" class="quick-bar-btn" data-act="duplicate" title="복제 (Ctrl+D)">📄 복제</button>
        <button type="button" class="quick-bar-btn" data-act="bringFront" title="맨 앞으로">⬆️ 맨앞</button>
        <button type="button" class="quick-bar-btn" data-act="sendBack" title="맨 뒤로">⬇️ 맨뒤</button>
        <div class="quick-bar-sep"></div>
        <button type="button" class="quick-bar-btn" data-act="delete" style="color:#ef4444;" title="삭제 (Delete)">🗑️</button>
      `;
    }

    bar.onmousedown = (e) => e.stopPropagation();
    bar.onclick = (e) => {
      e.stopPropagation();
      const btn = e.target.closest('.quick-bar-btn');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      if (act === 'edit') startInlineTextEditor(layer);
      else if (act === 'bold') { layer.isBold = !layer.isBold; syncContextToolbar(); renderCanvas(); pushHistory(); }
      else if (act === 'italic') { layer.isItalic = !layer.isItalic; syncContextToolbar(); renderCanvas(); pushHistory(); }
      else if (act === 'underline') { layer.isUnderline = !layer.isUnderline; syncContextToolbar(); renderCanvas(); pushHistory(); }
      else if (act === 'duplicate') duplicateSelectedLayer();
      else if (act === 'delete') deleteSelectedLayer();
      else if (act === 'bringFront') bringToFront();
      else if (act === 'sendBack') sendToBack();
    };
  }

  function removeFloatingQuickBar() {
    const bar = interactiveOverlay.querySelector('.floating-quick-bar');
    if (bar) bar.remove();
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

  // 마우스 호버 시 커서 모양 실시간 갱신 (화살표 리사이즈 커서 완벽 반영!)
  canvas.addEventListener('mousemove', (e) => {
    if (state.dragState.isDragging || state.isPanning) return;

    if (state.isSpaceDown) {
      canvas.style.cursor = 'grab';
      return;
    }

    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();

    if (selected) {
      // 1. 회전 핸들 검사
      const cx = selected.x + selected.width / 2;
      const rotY = selected.y - 28;
      if (Math.hypot(coords.x - cx, coords.y - rotY) <= 12) {
        canvas.style.cursor = 'crosshair';
        return;
      }

      // 2. 8개 리사이즈 핸들 검사
      const handles = getHandles(selected);
      for (const h of handles) {
        if (Math.hypot(coords.x - h.x, coords.y - h.y) <= 10) {
          canvas.style.cursor = h.cursor;
          return;
        }
      }

      // 3. 선택된 레이어 바디 위
      if (
        coords.x >= selected.x && coords.x <= selected.x + selected.width &&
        coords.y >= selected.y && coords.y <= selected.y + selected.height
      ) {
        canvas.style.cursor = 'move';
        return;
      }
    }

    // 4. 다른 레이어 위 호버
    let hoverLayer = null;
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const l = state.layers[i];
      if (!l.visible || l.locked) continue;
      if (
        coords.x >= l.x && coords.x <= l.x + l.width &&
        coords.y >= l.y && coords.y <= l.y + l.height
      ) {
        hoverLayer = l;
        break;
      }
    }

    if (hoverLayer) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  });

  // 캔버스 마우스 다운
  canvas.addEventListener('mousedown', (e) => {
    commitInlineTextEditor();

    // 스페이스바 누른 상태거나 마우스 휠 클릭(버튼 1)인 경우 -> 캔버스 패닝 시작
    if (state.isSpaceDown || e.button === 1) {
      state.isPanning = true;
      state.panStartX = e.clientX - state.panX;
      state.panStartY = e.clientY - state.panY;
      document.body.classList.add('is-panning');
      return;
    }

    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();

    // 1. 회전 핸들 검사
    if (selected) {
      const cx = selected.x + selected.width / 2;
      const rotY = selected.y - 28;
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

      // 2. 8개 리사이즈 핸들 검사
      const handles = getHandles(selected);
      for (const h of handles) {
        if (Math.hypot(coords.x - h.x, coords.y - h.y) <= 10) {
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

    // 3. 레이어 바디 클릭 (상단 레이어부터)
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
      // 🌟 Alt + 드래그 즉시 복제 (포토샵 스타일!)
      if (e.altKey) {
        const clone = JSON.parse(JSON.stringify(hitLayer));
        clone.id = 'layer_' + Date.now();
        clone.name = `${hitLayer.name} 복사`;
        if (hitLayer.type === 'image' && hitLayer._imgEl) clone._imgEl = hitLayer._imgEl;
        state.layers.push(clone);
        selectLayer(clone.id);
        state.dragState = {
          isDragging: true,
          mode: 'move',
          startX: coords.x,
          startY: coords.y,
          initialLayer: { ...clone }
        };
        pushHistory();
        showToast('Alt+드래그: 오브제가 복제되었습니다.');
        return;
      }

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

  // 더블클릭 -> 인라인 텍스트 타이핑 시작
  canvas.addEventListener('dblclick', (e) => {
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      startInlineTextEditor(selected);
    }
  });

  // 전역 마우스 무브 (드래그 조작 & 초정밀 스마트 외곽선 자석 스냅 & 패닝)
  window.addEventListener('mousemove', (e) => {
    // A. 캔버스 화면 패닝(Pan)
    if (state.isPanning) {
      state.panX = e.clientX - state.panStartX;
      state.panY = e.clientY - state.panStartY;
      updateTransform();
      return;
    }

    if (!state.dragState.isDragging) return;
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();
    if (!selected) return;

    const dx = coords.x - state.dragState.startX;
    const dy = coords.y - state.dragState.startY;
    const init = state.dragState.initialLayer;

    // B. 레이어 이동 + 초정밀 외곽라인/중심선 다중 자석 스냅 (Smart Magnetic Snap)
    if (state.dragState.mode === 'move') {
      let tx = init.x + dx;
      let ty = init.y + dy;

      state.snapGuides.xList = [];
      state.snapGuides.yList = [];

      const w = selected.width;
      const h = selected.height;
      const snapThreshold = 8; // 8px 이내 시 자석 흡착

      // 1) X축 스냅 후보 기준선들 (캔버스 모서리/중앙 + 다른 모든 레이어의 좌/우/중앙)
      const targetXs = [0, state.canvasWidth / 2, state.canvasWidth];
      state.layers.forEach(other => {
        if (other.id === selected.id || !other.visible) return;
        targetXs.push(other.x, other.x + other.width / 2, other.x + other.width);
      });

      // 현재 움직이는 요소의 좌(tx), 중(tx + w/2), 우(tx + w)
      const movingXs = [
        { type: 'left', val: tx, offset: 0 },
        { type: 'center', val: tx + w / 2, offset: w / 2 },
        { type: 'right', val: tx + w, offset: w }
      ];

      for (const m of movingXs) {
        for (const t of targetXs) {
          if (Math.abs(m.val - t) <= snapThreshold) {
            tx = t - m.offset;
            state.snapGuides.xList.push(t);
            break;
          }
        }
        if (state.snapGuides.xList.length > 0) break;
      }

      // 2) Y축 스냅 후보 기준선들 (캔버스 모서리/중앙 + 다른 모든 레이어의 상/하/중앙)
      const targetYs = [0, state.canvasHeight / 2, state.canvasHeight];
      state.layers.forEach(other => {
        if (other.id === selected.id || !other.visible) return;
        targetYs.push(other.y, other.y + other.height / 2, other.y + other.height);
      });

      // 현재 움직이는 요소의 상(ty), 중(ty + h/2), 하(ty + h)
      const movingYs = [
        { type: 'top', val: ty, offset: 0 },
        { type: 'center', val: ty + h / 2, offset: h / 2 },
        { type: 'bottom', val: ty + h, offset: h }
      ];

      for (const m of movingYs) {
        for (const t of targetYs) {
          if (Math.abs(m.val - t) <= snapThreshold) {
            ty = t - m.offset;
            state.snapGuides.yList.push(t);
            break;
          }
        }
        if (state.snapGuides.yList.length > 0) break;
      }

      selected.x = Math.round(tx);
      selected.y = Math.round(ty);
    }

    // C. 8방향 리사이즈 정밀 연산 (텍스트 레이어 모서리 드래그 시 폰트 크기 비례 확대/축소!)
    else if (state.dragState.mode === 'resize') {
      const h = state.dragState.handle;
      const minSize = 15;

      if (h === 'br') {
        selected.width = Math.max(minSize, Math.round(init.width + dx));
        selected.height = Math.max(minSize, Math.round(init.height + dy));
      } else if (h === 'bl') {
        selected.x = Math.round(init.x + dx);
        selected.width = Math.max(minSize, Math.round(init.width - dx));
        selected.height = Math.max(minSize, Math.round(init.height + dy));
      } else if (h === 'tr') {
        selected.y = Math.round(init.y + dy);
        selected.width = Math.max(minSize, Math.round(init.width + dx));
        selected.height = Math.max(minSize, Math.round(init.height - dy));
      } else if (h === 'tl') {
        selected.x = Math.round(init.x + dx);
        selected.y = Math.round(init.y + dy);
        selected.width = Math.max(minSize, Math.round(init.width - dx));
        selected.height = Math.max(minSize, Math.round(init.height - dy));
      } else if (h === 'tc') {
        selected.y = Math.round(init.y + dy);
        selected.height = Math.max(minSize, Math.round(init.height - dy));
      } else if (h === 'bc') {
        selected.height = Math.max(minSize, Math.round(init.height + dy));
      } else if (h === 'ml') {
        selected.x = Math.round(init.x + dx);
        selected.width = Math.max(minSize, Math.round(init.width - dx));
      } else if (h === 'mr') {
        selected.width = Math.max(minSize, Math.round(init.width + dx));
      }

      // 🌟 1. 텍스트 박스 모서리 리사이즈 시 글자 크기(fontSize) 비례 연동!
      if (selected.type === 'text' && ['tl', 'tr', 'br', 'bl'].includes(h)) {
        const scale = selected.width / Math.max(10, init.width);
        selected.fontSize = Math.max(10, Math.min(350, Math.round(init.fontSize * scale)));
        if (ctxFontSizeInput) ctxFontSizeInput.value = selected.fontSize;

        // 글자 크기에 맞춰 줄 높이/박스 높이 자동 보정
        const lines = String(selected.text).split('\n');
        selected.height = Math.round(lines.length * (selected.fontSize * (selected.lineHeight || 1.2)) + 14);
      }
    }

    // D. 회전 연산
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

  // 전역 마우스 업
  window.addEventListener('mouseup', () => {
    if (state.isPanning) {
      state.isPanning = false;
      document.body.classList.remove('is-panning');
    }

    if (state.dragState.isDragging) {
      state.dragState.isDragging = false;
      state.dragState.mode = null;
      state.snapGuides.xList = [];
      state.snapGuides.yList = [];
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

    } else if ([
      'rect', 'roundRect', 'circle', 'ellipse', 'pill',
      'triangle', 'rightTriangle', 'diamond', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon',
      'star', 'star4', 'star6', 'star8', 'heart', 'cross', 'lightning', 'shield', 'clover', 'crescent',
      'arrow', 'arrowLeft', 'arrowUp', 'arrowDown', 'arrowBoth', 'chevron',
      'bubble', 'bubbleRect', 'bubbleCloud', 'ribbon', 'gearBadge', 'ticket'
    ].includes(selected.type)) {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'flex';
      ctxFillColorPicker.value = selected.fillColor || '#7c3aed';
      ctxFillColorPreview.style.backgroundColor = selected.fillColor || '#7c3aed';

      if (ctxStrokeColorPicker) {
        ctxStrokeColorPicker.value = selected.strokeColor || '#000000';
        ctxStrokeColorPreview.style.backgroundColor = selected.strokeColor || '#000000';
      }
      if (ctxStrokeWidthInput) ctxStrokeWidthInput.value = selected.strokeWidth || 0;
      if (ctxStrokeStyleSelect) ctxStrokeStyleSelect.value = selected.strokeStyle || 'solid';

      // 굴곡(곡률) 슬라이더 동기화
      if (ctxRadiusSlider) {
        ctxRadiusSlider.value = selected.borderRadius || 0;
        if (ctxRadiusVal) ctxRadiusVal.textContent = String(selected.borderRadius || 0);
      }

      // 화살표 전용 컨트롤 동기화
      if (ctxArrowControls) {
        const isArrow = ['arrow', 'arrowLeft', 'arrowUp', 'arrowDown', 'arrowBoth'].includes(selected.type);
        ctxArrowControls.style.display = isArrow ? 'flex' : 'none';
        if (isArrow) {
          if (ctxArrowHeadSlider) ctxArrowHeadSlider.value = Math.round((selected.arrowHeadRatio !== undefined ? selected.arrowHeadRatio : 0.35) * 100);
          if (ctxArrowStemSlider) ctxArrowStemSlider.value = Math.round((selected.arrowStemRatio !== undefined ? selected.arrowStemRatio : 0.35) * 100);
        }
      }

      // 별 전용 컨트롤 동기화
      if (ctxStarControls) {
        const isStar = ['star', 'star4', 'star6', 'star8'].includes(selected.type);
        ctxStarControls.style.display = isStar ? 'flex' : 'none';
        if (isStar) {
          if (ctxStarPointsSelect) ctxStarPointsSelect.value = String(selected.starPoints || 5);
          if (ctxStarRatioSlider) ctxStarRatioSlider.value = Math.round((selected.starInnerRatio !== undefined ? selected.starInnerRatio : 0.45) * 100);
        }
      }
    } else {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'none';
    }
  }

  // 도형 서식 바인딩 (채우기, 테두리 색상/두께/스타일, 곡률, 화살표, 별 조절)
  ctxFillColorPicker.addEventListener('input', () => {
    const s = getSelectedLayer();
    if (s) {
      s.fillColor = ctxFillColorPicker.value;
      ctxFillColorPreview.style.backgroundColor = s.fillColor;
      renderCanvas();
    }
  });
  ctxFillColorPicker.addEventListener('change', pushHistory);

  if (ctxStrokeColorPicker) {
    ctxStrokeColorPicker.addEventListener('input', () => {
      const s = getSelectedLayer();
      if (s) {
        s.strokeColor = ctxStrokeColorPicker.value;
        ctxStrokeColorPreview.style.backgroundColor = s.strokeColor;
        renderCanvas();
      }
    });
    ctxStrokeColorPicker.addEventListener('change', pushHistory);
  }

  if (ctxStrokeWidthInput) {
    ctxStrokeWidthInput.addEventListener('input', () => {
      const s = getSelectedLayer();
      if (s) {
        s.strokeWidth = Math.max(0, parseInt(ctxStrokeWidthInput.value, 10) || 0);
        renderCanvas();
      }
    });
    ctxStrokeWidthInput.addEventListener('change', pushHistory);
  }

  if (ctxStrokeWidthMinus) {
    ctxStrokeWidthMinus.addEventListener('click', () => {
      const s = getSelectedLayer();
      if (s) {
        s.strokeWidth = Math.max(0, (s.strokeWidth || 0) - 1);
        ctxStrokeWidthInput.value = s.strokeWidth;
        renderCanvas();
        pushHistory();
      }
    });
  }

  if (ctxStrokeWidthPlus) {
    ctxStrokeWidthPlus.addEventListener('click', () => {
      const s = getSelectedLayer();
      if (s) {
        s.strokeWidth = Math.min(40, (s.strokeWidth || 0) + 1);
        ctxStrokeWidthInput.value = s.strokeWidth;
        renderCanvas();
        pushHistory();
      }
    });
  }

  if (ctxStrokeStyleSelect) {
    ctxStrokeStyleSelect.addEventListener('change', () => {
      const s = getSelectedLayer();
      if (s) {
        s.strokeStyle = ctxStrokeStyleSelect.value;
        renderCanvas();
        pushHistory();
      }
    });
  }

  // 🌟 7. 모서리 굴곡(Radius) 조절 연동
  if (ctxRadiusSlider) {
    ctxRadiusSlider.addEventListener('input', () => {
      const s = getSelectedLayer();
      if (s) {
        s.borderRadius = Math.max(0, parseInt(ctxRadiusSlider.value, 10) || 0);
        if (ctxRadiusVal) ctxRadiusVal.textContent = String(s.borderRadius);
        renderCanvas();
      }
    });
    ctxRadiusSlider.addEventListener('change', pushHistory);
  }

  // 🌟 화살표 머리/줄기 두께 조절 연동
  if (ctxArrowHeadSlider) {
    ctxArrowHeadSlider.addEventListener('input', () => {
      const s = getSelectedLayer();
      if (s) {
        s.arrowHeadRatio = parseInt(ctxArrowHeadSlider.value, 10) / 100;
        renderCanvas();
      }
    });
    ctxArrowHeadSlider.addEventListener('change', pushHistory);
  }

  if (ctxArrowStemSlider) {
    ctxArrowStemSlider.addEventListener('input', () => {
      const s = getSelectedLayer();
      if (s) {
        s.arrowStemRatio = parseInt(ctxArrowStemSlider.value, 10) / 100;
        renderCanvas();
      }
    });
    ctxArrowStemSlider.addEventListener('change', pushHistory);
  }

  // 🌟 별 꼭지점 수 및 내부 비율 조절 연동
  if (ctxStarPointsSelect) {
    ctxStarPointsSelect.addEventListener('change', () => {
      const s = getSelectedLayer();
      if (s) {
        s.starPoints = parseInt(ctxStarPointsSelect.value, 10) || 5;
        renderCanvas();
        pushHistory();
      }
    });
  }

  if (ctxStarRatioSlider) {
    ctxStarRatioSlider.addEventListener('input', () => {
      const s = getSelectedLayer();
      if (s) {
        s.starInnerRatio = parseInt(ctxStarRatioSlider.value, 10) / 100;
        renderCanvas();
      }
    });
    ctxStarRatioSlider.addEventListener('change', pushHistory);
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

  let draggedLayerId = null;

  function renderLayerList() {
    layersScrollList.innerHTML = '';
    layerCountBadge.textContent = `${state.layers.length}개`;

    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      const card = document.createElement('div');
      card.className = `layer-card-item ${layer.id === state.selectedId ? 'active' : ''}`;
      card.setAttribute('draggable', 'true');
      card.setAttribute('data-layer-id', layer.id);

      const iconMap = {
        text: '🔤', image: '🖼️', sticker: '✨',
        rect: '⬛', roundRect: '▢', circle: '⚪', ellipse: '⬭', pill: '💊',
        triangle: '▲', rightTriangle: '⊿', diamond: '◆', parallelogram: '▱', trapezoid: '⏢',
        pentagon: '⬟', hexagon: '⬡', octagon: '🛑',
        star: '⭐', star4: '✦', star6: '✡', star8: '✴', heart: '❤️', cross: '➕', lightning: '⚡', shield: '🛡️', clover: '🍀', crescent: '🌙',
        arrow: '➔', arrowLeft: '⬅', arrowUp: '⬆', arrowDown: '⬇', arrowBoth: '⬌', chevron: '❯',
        bubble: '💬', bubbleRect: '🗨️', bubbleCloud: '💭', ribbon: '🎗️', gearBadge: '⚙️', ticket: '🎟️'
      };

      card.innerHTML = `
        <span class="layer-drag-handle" title="드래그하여 순서 변경">⋮⋮</span>
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

      // 🌟 2. 레이어 드래그 앤 드롭 순서 변경 (HTML5 DnD)
      card.addEventListener('dragstart', (e) => {
        draggedLayerId = layer.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', layer.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.layer-card-item').forEach(c => c.classList.remove('drop-above', 'drop-below'));
        draggedLayerId = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = card.getBoundingClientRect();
        const isTop = (e.clientY - rect.top) < (rect.height / 2);
        card.classList.toggle('drop-above', isTop);
        card.classList.toggle('drop-below', !isTop);
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drop-above', 'drop-below');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drop-above', 'drop-below');
        const sourceId = draggedLayerId || e.dataTransfer.getData('text/plain');
        const targetId = layer.id;
        if (!sourceId || sourceId === targetId) return;

        const fromIdx = state.layers.findIndex(l => l.id === sourceId);
        if (fromIdx === -1) return;
        const [movedLayer] = state.layers.splice(fromIdx, 1);

        let toIdx = state.layers.findIndex(l => l.id === targetId);
        if (toIdx === -1) return;

        const rect = card.getBoundingClientRect();
        const isTop = (e.clientY - rect.top) < (rect.height / 2);
        // layersScrollList는 역순(배열의 끝이 최상단 카드)으로 렌더링되므로:
        // 카드의 위쪽(top)에 떨어지면 배열에서는 targetId보다 뒤쪽(더 높은 인덱스)에 들어가야 함
        if (isTop) {
          state.layers.splice(toIdx + 1, 0, movedLayer);
        } else {
          state.layers.splice(toIdx, 0, movedLayer);
        }

        renderCanvas();
        renderLayerList();
        pushHistory();
        showToast('레이어 순서가 변경되었습니다.');
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

  // 35+종 벡터 도형 설정 맵
  const SHAPE_CONFIGS = {
    // 1) 기본 기하학
    rect: { w: 360, h: 240, color: '#7c3aed', name: '직사각형', radius: 0 },
    roundRect: { w: 360, h: 240, color: '#6366f1', name: '둥근 사각', radius: 20 },
    circle: { w: 240, h: 240, color: '#ef4444', name: '원형', radius: 0 },
    ellipse: { w: 320, h: 200, color: '#ec4899', name: '타원', radius: 0 },
    pill: { w: 300, h: 70, color: '#3b82f6', name: '알약 배지', radius: 35 },

    // 2) 다각형
    triangle: { w: 260, h: 240, color: '#10b981', name: '정삼각형' },
    rightTriangle: { w: 260, h: 240, color: '#059669', name: '직각삼각형' },
    diamond: { w: 240, h: 240, color: '#06b6d4', name: '마름모' },
    parallelogram: { w: 320, h: 200, color: '#0284c7', name: '평행사변형' },
    trapezoid: { w: 320, h: 200, color: '#2563eb', name: '사다리꼴' },
    pentagon: { w: 240, h: 240, color: '#8b5cf6', name: '오각형' },
    hexagon: { w: 250, h: 240, color: '#a855f7', name: '육각형' },
    octagon: { w: 240, h: 240, color: '#d946ef', name: '팔각형' },

    // 3) 별 & 기호
    star: { w: 220, h: 220, color: '#f59e0b', name: '5각 별', starPoints: 5, starInnerRatio: 0.45 },
    star4: { w: 220, h: 220, color: '#fbbf24', name: '4각 별', starPoints: 4, starInnerRatio: 0.3 },
    star6: { w: 220, h: 220, color: '#f59e0b', name: '6각 별', starPoints: 6, starInnerRatio: 0.55 },
    star8: { w: 220, h: 220, color: '#d97706', name: '8각 별', starPoints: 8, starInnerRatio: 0.5 },
    heart: { w: 240, h: 220, color: '#ec4899', name: '하트' },
    cross: { w: 220, h: 220, color: '#ef4444', name: '십자가' },
    lightning: { w: 180, h: 260, color: '#eab308', name: '번개' },
    shield: { w: 220, h: 260, color: '#4f46e5', name: '방패' },
    clover: { w: 240, h: 240, color: '#22c55e', name: '클로버' },
    crescent: { w: 200, h: 220, color: '#eab308', name: '초승달' },

    // 4) 화살표 & 포인터
    arrow: { w: 320, h: 160, color: '#3b82f6', name: '우측 화살표', arrowHeadRatio: 0.35, arrowStemRatio: 0.35 },
    arrowLeft: { w: 320, h: 160, color: '#3b82f6', name: '좌측 화살표', arrowHeadRatio: 0.35, arrowStemRatio: 0.35 },
    arrowUp: { w: 160, h: 320, color: '#2563eb', name: '상향 화살표', arrowHeadRatio: 0.35, arrowStemRatio: 0.35 },
    arrowDown: { w: 160, h: 320, color: '#2563eb', name: '하향 화살표', arrowHeadRatio: 0.35, arrowStemRatio: 0.35 },
    arrowBoth: { w: 340, h: 160, color: '#1d4ed8', name: '양방향 화살표' },
    chevron: { w: 220, h: 220, color: '#3b82f6', name: '셰브론' },

    // 5) 말풍선 & 배지
    bubble: { w: 300, h: 200, color: '#8b5cf6', name: '둥근 말풍선', radius: 14 },
    bubbleRect: { w: 300, h: 200, color: '#7c3aed', name: '사각 말풍선', radius: 8 },
    bubbleCloud: { w: 320, h: 220, color: '#6366f1', name: '생각 구름' },
    ribbon: { w: 260, h: 280, color: '#f43f5e', name: '리본 배지' },
    gearBadge: { w: 240, h: 240, color: '#f59e0b', name: '톱니 배지' },
    ticket: { w: 320, h: 160, color: '#06b6d4', name: '티켓 쿠폰' }
  };

  // 35+종 모든 도형 버튼 일괄 바인딩
  document.querySelectorAll('.shape-pick-btn[data-shape-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-shape-type');
      addShape(type);
    });
  });

  function addShape(type) {
    const cfg = SHAPE_CONFIGS[type] || { w: 240, h: 240, color: '#7c3aed', name: '도형' };
    const newL = {
      id: 'layer_' + Date.now(),
      type: type,
      name: cfg.name,
      fillColor: cfg.color,
      strokeColor: '#000000',
      strokeWidth: 0,
      strokeStyle: 'solid',
      borderRadius: cfg.radius !== undefined ? cfg.radius : 0,
      arrowHeadRatio: cfg.arrowHeadRatio !== undefined ? cfg.arrowHeadRatio : 0.35,
      arrowStemRatio: cfg.arrowStemRatio !== undefined ? cfg.arrowStemRatio : 0.35,
      starPoints: cfg.starPoints !== undefined ? cfg.starPoints : 5,
      starInnerRatio: cfg.starInnerRatio !== undefined ? cfg.starInnerRatio : 0.45,
      x: Math.round((state.canvasWidth - cfg.w) / 2),
      y: Math.round((state.canvasHeight - cfg.h) / 2),
      width: cfg.w,
      height: cfg.h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      hasShadow: false,
      shadowColor: '#000000',
      shadowBlur: 8,
      shadowOffset: 6
    };
    state.layers.push(newL);
    selectLayer(newL.id);
    pushHistory();
    showToast(`${cfg.name}이(가) 추가되었습니다.`);
  }

  // 🌟 6. 텍스트 패널: [추가/편집] vs [✨ 텍스트 효과] 서브 탭 전환
  if (tabTextAdd && tabTextEffects) {
    tabTextAdd.addEventListener('click', () => {
      tabTextAdd.classList.add('active');
      tabTextEffects.classList.remove('active');
      if (subviewTextAdd) subviewTextAdd.style.display = 'block';
      if (subviewTextEffects) subviewTextEffects.style.display = 'none';
    });
    tabTextEffects.addEventListener('click', () => {
      tabTextEffects.classList.add('active');
      tabTextAdd.classList.remove('active');
      if (subviewTextAdd) subviewTextAdd.style.display = 'none';
      if (subviewTextEffects) subviewTextEffects.style.display = 'block';
    });
  }

  // 🌟 6. Adobe Express 스타일 텍스트 그림자 효과 프리셋 9종 바인딩
  document.querySelectorAll('.effect-preset-card[data-shadow-preset]').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.effect-preset-card[data-shadow-preset]').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const preset = card.getAttribute('data-shadow-preset');
      let s = getSelectedLayer();
      if (!s || s.type !== 'text') {
        addNewTextLayer('디자인 텍스트', 64, "'Black Han Sans', sans-serif", '#0f172a', true);
        s = getSelectedLayer();
      }

      if (preset === 'none') {
        s.hasShadow = false;
      } else if (preset === 'classic') {
        s.hasShadow = true; s.shadowColor = 'rgba(0,0,0,0.45)'; s.shadowBlur = 0; s.shadowOffset = 4;
      } else if (preset === 'smooth') {
        s.hasShadow = true; s.shadowColor = 'rgba(0,0,0,0.4)'; s.shadowBlur = 12; s.shadowOffset = 6;
      } else if (preset === 'lift') {
        s.hasShadow = true; s.shadowColor = 'rgba(0,0,0,0.5)'; s.shadowBlur = 20; s.shadowOffset = 12;
      } else if (preset === 'glow') {
        s.hasShadow = true; s.shadowColor = '#7c3aed'; s.shadowBlur = 16; s.shadowOffset = 0;
      } else if (preset === 'halo') {
        s.hasShadow = true; s.shadowColor = '#f59e0b'; s.shadowBlur = 18; s.shadowOffset = 0;
      } else if (preset === 'strong') {
        s.hasShadow = true; s.shadowColor = '#000000'; s.shadowBlur = 0; s.shadowOffset = 6;
      } else if (preset === 'haze') {
        s.hasShadow = true; s.shadowColor = 'rgba(15, 23, 42, 0.7)'; s.shadowBlur = 25; s.shadowOffset = 0;
      } else if (preset === 'neon') {
        s.hasShadow = true; s.shadowColor = '#ec4899'; s.shadowBlur = 20; s.shadowOffset = 0;
      }

      syncContextToolbar();
      renderCanvas();
      pushHistory();
      showToast('그림자 프리셋이 적용되었습니다.');
    });
  });

  // 🌟 6. Adobe Express 스타일 모양 & 배경 라벨 프리셋 6종 바인딩
  document.querySelectorAll('.effect-preset-card[data-shape-preset]').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.effect-preset-card[data-shape-preset]').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const preset = card.getAttribute('data-shape-preset');
      let s = getSelectedLayer();
      if (!s || s.type !== 'text') {
        addNewTextLayer('디자인 텍스트', 64, "'Black Han Sans', sans-serif", '#0f172a', true);
        s = getSelectedLayer();
      }

      if (preset === 'none') {
        s.hasBgBox = false; s.hasOutline = false;
      } else if (preset === 'highlight') {
        s.hasBgBox = true; s.bgBoxColor = '#fef08a'; s.bgBoxRadius = 4;
      } else if (preset === 'darkblock') {
        s.hasBgBox = true; s.bgBoxColor = '#0f172a'; s.bgBoxRadius = 6; s.textColor = '#ffffff';
      } else if (preset === 'purplepill') {
        s.hasBgBox = true; s.bgBoxColor = '#7c3aed'; s.bgBoxRadius = 30; s.textColor = '#ffffff';
      } else if (preset === 'outline-thick') {
        s.hasOutline = true; s.outlineColor = '#000000'; s.outlineWidth = 8;
      } else if (preset === 'outline-neon') {
        s.hasOutline = true; s.outlineColor = '#06b6d4'; s.outlineWidth = 6;
      }

      syncContextToolbar();
      renderCanvas();
      pushHistory();
      showToast('모양 및 외곽선 프리셋이 적용되었습니다.');
    });
  });

  // 🌟 3. 투명 배경 토글 (PNG 저장 시 투명화)
  if (btnSetTransparentBg) {
    btnSetTransparentBg.addEventListener('click', () => {
      if (state.bgType === 'transparent') {
        state.bgType = 'color';
        state.bgColor = '#ffffff';
        btnSetTransparentBg.classList.remove('active');
        if (canvasPaperShadowWrap) canvasPaperShadowWrap.classList.remove('is-transparent-bg');
        showToast('배경이 흰색으로 복원되었습니다.');
      } else {
        state.bgType = 'transparent';
        btnSetTransparentBg.classList.add('active');
        if (canvasPaperShadowWrap) canvasPaperShadowWrap.classList.add('is-transparent-bg');
        showToast('🏁 투명 배경 활성화 (PNG 저장 시 투명화)');
      }
      renderCanvas();
      pushHistory();
    });
  }

  // 🌟 3. 직접 그라데이션 만들기 (각도 & 색상 2개)
  function updateCustomGradLivePreview() {
    if (!gradFromPicker || !gradToPicker || !gradAngleSlider) return;
    const from = gradFromPicker.value;
    const to = gradToPicker.value;
    const angle = gradAngleSlider.value;
    if (gradFromPreview) gradFromPreview.style.backgroundColor = from;
    if (gradToPreview) gradToPreview.style.backgroundColor = to;
    if (gradAngleVal) gradAngleVal.textContent = `${angle}°`;
    if (gradLivePreviewBar) gradLivePreviewBar.style.background = `linear-gradient(${angle}deg, ${from}, ${to})`;
  }

  if (gradFromPicker) gradFromPicker.addEventListener('input', updateCustomGradLivePreview);
  if (gradToPicker) gradToPicker.addEventListener('input', updateCustomGradLivePreview);
  if (gradAngleSlider) gradAngleSlider.addEventListener('input', updateCustomGradLivePreview);

  if (btnApplyCustomGrad) {
    btnApplyCustomGrad.addEventListener('click', () => {
      state.bgType = 'gradient';
      state.bgGradient = {
        from: gradFromPicker.value,
        to: gradToPicker.value,
        angle: parseInt(gradAngleSlider.value, 10)
      };
      if (btnSetTransparentBg) btnSetTransparentBg.classList.remove('active');
      if (canvasPaperShadowWrap) canvasPaperShadowWrap.classList.remove('is-transparent-bg');
      renderCanvas();
      pushHistory();
      showToast('직접 만든 그라데이션 배경이 적용되었습니다!');
    });
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

  async function loadTemplate(tpl) {
    if (state.layers.length > 0) {
      const ok = await showConfirmModal('디자인 템플릿 로드', '현재 작업 중인 모든 요소가 선택한 템플릿으로 교체됩니다. 계속하시겠습니까?');
      if (!ok) return;
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
  // 단축키 시스템 (Adobe Express & Photoshop 단축키 완벽 대응)
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // 텍스트/입력창 포커스 중일 때
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      if (e.key === 'Escape') {
        closeCustomCanvasModal();
        closeConfirmModal(false);
        closeShortcutsModal();
      }
      return;
    }

    // 🌟 5. 스페이스바 브라우저 창 스크롤(PageDown) 완벽 차단 및 손바닥 팬 모드 준비
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (!state.isSpaceDown) {
        state.isSpaceDown = true;
        document.body.classList.add('space-pressed');
        canvas.style.cursor = 'grab';
      }
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    // 1. 실행 취소 / 다시 실행
    if (isCtrl && (e.key === 'z' || e.key === 'ㅋ') && !e.shiftKey) {
      e.preventDefault(); undo();
    } else if (isCtrl && ((e.key === 'y' || e.key === 'ㅛ') || (e.shiftKey && (e.key === 'z' || e.key === 'ㅋ')))) {
      e.preventDefault(); redo();
    }

    // 2. 복사 / 붙여넣기 (Clipboard)
    else if (isCtrl && (e.key === 'c' || e.key === 'ㅊ')) {
      const s = getSelectedLayer();
      if (s) {
        state.clipboard = { ...s };
        delete state.clipboard._imgEl;
        showToast('레이어가 복사되었습니다 (Ctrl+C)');
      }
    } else if (isCtrl && (e.key === 'v' || e.key === 'ㅍ')) {
      if (state.clipboard) {
        e.preventDefault();
        const newL = {
          ...state.clipboard,
          id: 'layer_' + Date.now(),
          name: `${state.clipboard.name} 복사`,
          x: state.clipboard.x + 24,
          y: state.clipboard.y + 24
        };
        if (newL.type === 'image' && newL.dataUrl) {
          const img = new Image();
          img.src = newL.dataUrl;
          newL._imgEl = img;
        }
        state.layers.push(newL);
        selectLayer(newL.id);
        pushHistory();
        showToast('레이어를 붙여넣었습니다 (Ctrl+V)');
      }
    }

    // 3. 복제 (Ctrl + D)
    else if (isCtrl && (e.key === 'd' || e.key === 'ㅇ')) {
      e.preventDefault(); duplicateSelectedLayer();
    }

    // 4. 삭제 (Delete / Backspace)
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedLayer();
    }

    // 5. 레이어 순서 ([ / ], Ctrl+[ / Ctrl+])
    else if (e.key === '[' && !isCtrl) {
      btnSendBackward.click();
    } else if (e.key === ']' && !isCtrl) {
      btnBringForward.click();
    } else if (e.key === '[' && isCtrl) {
      e.preventDefault(); sendToBack();
    } else if (e.key === ']' && isCtrl) {
      e.preventDefault(); bringToFront();
    }

    // 6. 방향키 미세 이동 (ArrowKeys)
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
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

    // 7. 줌 단축키 (Ctrl+0 화면맞춤, Ctrl+1 원본크기)
    else if (isCtrl && e.key === '0') {
      e.preventDefault(); fitToScreen();
    } else if (isCtrl && e.key === '1') {
      e.preventDefault(); setZoom(1.0);
    }

    // 8. 모달 및 단축키 안내 (? 또는 Esc)
    else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault(); openShortcutsModal();
    } else if (e.key === 'Escape') {
      commitInlineTextEditor();
      selectLayer(null);
      closeCustomCanvasModal();
      closeConfirmModal(false);
      closeShortcutsModal();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      state.isSpaceDown = false;
      document.body.classList.remove('space-pressed');
      if (!state.isPanning) {
        canvas.style.cursor = 'default';
      }
    }
  });

  // Ctrl + 휠 줌 & 일반 휠 패닝
  canvasCenterStage.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setZoom(state.zoom + delta);
    }
  }, { passive: false });

  // 캔버스 크기 프리셋 드롭다운 (prompt 전면 제거 & 모달 호출)
  canvasPresetSelect.addEventListener('change', () => {
    const val = canvasPresetSelect.value;
    if (val === 'custom') {
      openCustomCanvasModal();
    } else {
      const [w, h] = val.split('x').map(Number);
      state.canvasWidth = w;
      state.canvasHeight = h;
      canvas.width = state.canvasWidth;
      canvas.height = state.canvasHeight;
      updateDimUI();
      fitToScreen();
      renderCanvas();
      pushHistory();
    }
  });

  // 줌 드롭다운 및 스텝 버튼
  if (zoomLevelSelect) {
    zoomLevelSelect.addEventListener('change', () => {
      setZoom(parseFloat(zoomLevelSelect.value));
    });
  }
  zoomInBtn.addEventListener('click', () => setZoom(state.zoom + 0.15));
  zoomOutBtn.addEventListener('click', () => setZoom(state.zoom - 0.15));
  zoomFitBtn.addEventListener('click', fitToScreen);

  // ==========================================================================
  // 커스텀 모달 이벤트 바인딩 (prompt / confirm 100% 대체)
  // ==========================================================================
  // 1. 캔버스 사용자 지정 크기 모달
  if (btnCloseCustomSizeModal) btnCloseCustomSizeModal.addEventListener('click', closeCustomCanvasModal);
  if (btnCancelCustomSize) btnCancelCustomSize.addEventListener('click', closeCustomCanvasModal);
  if (btnApplyCustomSize) {
    btnApplyCustomSize.addEventListener('click', () => {
      const w = parseInt(customWidthInput.value, 10);
      const h = parseInt(customHeightInput.value, 10);
      if (w >= 100 && h >= 100 && w <= 8000 && h <= 8000) {
        state.canvasWidth = w;
        state.canvasHeight = h;
        canvas.width = state.canvasWidth;
        canvas.height = state.canvasHeight;
        canvasPresetSelect.value = 'custom';
        updateDimUI();
        fitToScreen();
        renderCanvas();
        pushHistory();
        closeCustomCanvasModal();
        showToast(`캔버스 크기가 ${w} × ${h} px 로 변경되었습니다.`);
      } else {
        showToast('100px ~ 8000px 사이의 유효한 크기를 입력하세요.');
      }
    });
  }

  document.querySelectorAll('.btn-quick-dim').forEach(btn => {
    btn.addEventListener('click', () => {
      if (customWidthInput) customWidthInput.value = btn.getAttribute('data-w');
      if (customHeightInput) customHeightInput.value = btn.getAttribute('data-h');
    });
  });

  // 2. 컨펌 모달
  if (btnCloseConfirmModal) btnCloseConfirmModal.addEventListener('click', () => closeConfirmModal(false));
  if (btnCancelConfirm) btnCancelConfirm.addEventListener('click', () => closeConfirmModal(false));
  if (btnOkConfirm) btnOkConfirm.addEventListener('click', () => closeConfirmModal(true));

  // 3. 단축키 안내 모달
  if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', openShortcutsModal);
  if (btnCloseShortcutsModal) btnCloseShortcutsModal.addEventListener('click', closeShortcutsModal);
  if (btnDismissShortcuts) btnDismissShortcuts.addEventListener('click', closeShortcutsModal);

  // 레이어 맨 앞으로 / 맨 뒤로 헬퍼
  function bringToFront() {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx !== -1 && idx < state.layers.length - 1) {
      const item = state.layers.splice(idx, 1)[0];
      state.layers.push(item);
      renderCanvas();
      renderLayerList();
      pushHistory();
      showToast('레이어를 맨 앞으로 가져왔습니다');
    }
  }

  function sendToBack() {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx > 0) {
      const item = state.layers.splice(idx, 1)[0];
      state.layers.unshift(item);
      renderCanvas();
      renderLayerList();
      pushHistory();
      showToast('레이어를 맨 뒤로 보냈습니다');
    }
  }

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
        showToast('프로젝트 파일 로드 실패: ' + err.message);
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
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width * scale;
        exportCanvas.height = canvas.height * scale;
        const eCtx = exportCanvas.getContext('2d');
        eCtx.scale(scale, scale);

        // 🌟 3. 배경 처리 (투명 PNG 선택 시 완전 투명 알파 채널 유지)
        if (state.bgType === 'transparent' && format === 'png') {
          eCtx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (state.bgType === 'gradient' && state.bgGradient) {
          const angle = state.bgGradient.angle !== undefined ? state.bgGradient.angle : 135;
          const angleRad = ((angle - 90) * Math.PI) / 180;
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const r = Math.hypot(canvas.width, canvas.height) / 2;
          const x0 = cx - Math.cos(angleRad) * r;
          const y0 = cy - Math.sin(angleRad) * r;
          const x1 = cx + Math.cos(angleRad) * r;
          const y1 = cy + Math.sin(angleRad) * r;
          const grad = eCtx.createLinearGradient(x0, y0, x1, y1);
          grad.addColorStop(0, state.bgGradient.from || '#fbcfe8');
          grad.addColorStop(1, state.bgGradient.to || '#fed7aa');
          eCtx.fillStyle = grad;
          eCtx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          eCtx.fillStyle = state.bgColor || '#ffffff';
          eCtx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 35+종 모든 레이어 정밀 렌더링
        state.layers.forEach(layer => {
          if (!layer.visible) return;
          eCtx.save();
          eCtx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;
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

          const shapeTypes = [
            'rect', 'roundRect', 'circle', 'ellipse', 'pill',
            'triangle', 'rightTriangle', 'diamond', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon',
            'star', 'star4', 'star6', 'star8', 'heart', 'cross', 'lightning', 'shield', 'clover', 'crescent',
            'arrow', 'arrowLeft', 'arrowUp', 'arrowDown', 'arrowBoth', 'chevron',
            'bubble', 'bubbleRect', 'bubbleCloud', 'ribbon', 'gearBadge', 'ticket'
          ];

          if (shapeTypes.includes(layer.type)) {
            renderShapeLayer(eCtx, layer);
          } else if (layer.type === 'image' && layer._imgEl && layer._imgEl.complete) {
            eCtx.drawImage(layer._imgEl, layer.x, layer.y, layer.width, layer.height);
          } else if (layer.type === 'text') {
            renderTextLayer(eCtx, layer);
          } else if (layer.type === 'sticker') {
            eCtx.font = `${layer.fontSize || 80}px sans-serif`;
            eCtx.textAlign = 'center';
            eCtx.textBaseline = 'middle';
            eCtx.fillText(layer.text, cx, cy);
          }
          eCtx.restore();
        });

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
