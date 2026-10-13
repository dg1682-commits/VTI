/**
 * 궁디 이미지 스튜디오 PRO (GOONGDI Image Studio) Engine
 * High-Performance Vanilla JS Canvas Engine (Canva & Photoshop Hybrid)
 */

(function () {
  'use strict';

  // DOM 캔버스 및 뷰포트
  const canvas = document.getElementById('studioCanvas');
  const ctx = canvas.getContext('2d');
  const canvasStageWrapper = document.getElementById('canvasStageWrapper');
  const canvasPaperFrame = document.getElementById('canvasPaperFrame');
  const interactiveOverlay = document.getElementById('interactiveOverlay');

  // 상단 바
  const projectTitleInput = document.getElementById('projectTitleInput');
  const saveStatusIndicator = document.getElementById('saveStatusIndicator');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const loadProjectInput = document.getElementById('loadProjectInput');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const btnSnapToggle = document.getElementById('btnSnapToggle');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const zoomValLabel = document.getElementById('zoomValLabel');
  const canvasPresetSelect = document.getElementById('canvasPresetSelect');
  const exportMainBtn = document.getElementById('exportMainBtn');
  const exportMenuPopover = document.getElementById('exportMenuPopover');

  // 좌측 독 및 드로어
  const dockTabBtns = document.querySelectorAll('.dock-tab-btn');
  const sideDrawerPanel = document.getElementById('sideDrawerPanel');
  const drawerTitle = document.getElementById('drawerTitle');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerContents = document.querySelectorAll('.drawer-content');

  // 좌측 드로어 기능 버튼들
  const btnAddRect = document.getElementById('btnAddRect');
  const btnAddCircle = document.getElementById('btnAddCircle');
  const btnAddPill = document.getElementById('btnAddPill');
  const btnAddStar = document.getElementById('btnAddStar');
  const btnAddHeading = document.getElementById('btnAddHeading');
  const btnAddSubheading = document.getElementById('btnAddSubheading');
  const btnAddBodyText = document.getElementById('btnAddBodyText');
  const sideUploadInput = document.getElementById('sideUploadInput');
  const sidebarDropzone = document.getElementById('sidebarDropzone');
  const uploadedGalleryGrid = document.getElementById('uploadedGalleryGrid');

  // 상단 컨텍스추얼 툴바
  const contextToolbar = document.getElementById('contextToolbar');
  const ctxTextGroup = document.getElementById('ctxTextGroup');
  const ctxShapeGroup = document.getElementById('ctxShapeGroup');
  const ctxFontSelect = document.getElementById('ctxFontSelect');
  const ctxFontSizeInput = document.getElementById('ctxFontSizeInput');
  const ctxFontSizeMinus = document.getElementById('ctxFontSizeMinus');
  const ctxFontSizePlus = document.getElementById('ctxFontSizePlus');
  const ctxTextColorPicker = document.getElementById('ctxTextColorPicker');
  const ctxTextColorPreview = document.getElementById('ctxTextColorPreview');
  const ctxStrokeWidthInput = document.getElementById('ctxStrokeWidthInput');
  const ctxStrokeColorPicker = document.getElementById('ctxStrokeColorPicker');
  const ctxShadowBtn = document.getElementById('ctxShadowBtn');
  const ctxFillColorPicker = document.getElementById('ctxFillColorPicker');
  const ctxFillColorPreview = document.getElementById('ctxFillColorPreview');
  const ctxRadiusInput = document.getElementById('ctxRadiusInput');
  const ctxOpacitySlider = document.getElementById('ctxOpacitySlider');
  const ctxOpacityVal = document.getElementById('ctxOpacityVal');
  const ctxDuplicateBtn = document.getElementById('ctxDuplicateBtn');
  const ctxDeleteBtn = document.getElementById('ctxDeleteBtn');

  // 우측 도크 (레이어 & 정렬)
  const layerCountTag = document.getElementById('layerCountTag');
  const layersScrollList = document.getElementById('layersScrollList');
  const alignLeftBtn = document.getElementById('alignLeftBtn');
  const alignCenterHBtn = document.getElementById('alignCenterHBtn');
  const alignRightBtn = document.getElementById('alignRightBtn');
  const alignTopBtn = document.getElementById('alignTopBtn');
  const alignCenterVBtn = document.getElementById('alignCenterVBtn');
  const alignBottomBtn = document.getElementById('alignBottomBtn');
  const btnLayerBringForward = document.getElementById('btnLayerBringForward');
  const btnLayerSendBackward = document.getElementById('btnLayerSendBackward');

  // 하단 상태바 & 토스트
  const statusBarResolution = document.getElementById('statusBarResolution');
  const statusBarZoomText = document.getElementById('statusBarZoomText');
  const studioToast = document.getElementById('studioToast');

  // ==========================================================================
  // 스튜디오 메인 상태 (State Machine)
  // ==========================================================================
  const state = {
    title: '무제 썸네일 디자인',
    canvasWidth: 1280,
    canvasHeight: 720,
    bgType: 'gradient', // 'color' | 'gradient'
    bgColor: '#0f172a',
    bgGradient: { from: '#0f172a', to: '#1e3a8a', angle: 135 },
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    spacePressed: false,
    snapEnabled: true,

    layers: [],
    selectedId: null,
    copiedLayer: null,

    // 변형(Transform) 드래그 상태
    dragState: {
      isDragging: false,
      mode: null, // 'move' | 'resize' | 'rotate'
      handle: null, // 'tl'|'tr'|'br'|'bl'|'tc'|'bc'|'ml'|'mr'|'rot'
      startX: 0,
      startY: 0,
      initialLayer: null
    },

    // 스마트 스냅 가이드라인 좌표
    snapGuides: { x: null, y: null },

    history: [],
    historyIndex: -1
  };

  function showToast(msg) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.add('show');
    setTimeout(() => studioToast.classList.remove('show'), 2200);
  }

  // ==========================================================================
  // 히스토리 (Undo / Redo) 관리
  // ==========================================================================
  function pushHistory() {
    const snapshot = JSON.stringify({
      title: state.title,
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
    if (saveStatusIndicator) {
      saveStatusIndicator.textContent = '저장됨';
      saveStatusIndicator.style.color = '#10b981';
    }
  }

  function updateUndoRedoUI() {
    if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = state.historyIndex >= state.history.length - 1;
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreSnapshot(state.history[state.historyIndex]);
      showToast('실행 취소 (Undo)');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreSnapshot(state.history[state.historyIndex]);
      showToast('다시 실행 (Redo)');
    }
  }

  function restoreSnapshot(jsonStr) {
    const data = JSON.parse(jsonStr);
    state.title = data.title || '무제 디자인';
    if (projectTitleInput) projectTitleInput.value = state.title;
    state.canvasWidth = data.canvasWidth;
    state.canvasHeight = data.canvasHeight;
    state.bgType = data.bgType || 'color';
    state.bgColor = data.bgColor || '#0f172a';
    state.bgGradient = data.bgGradient || { from: '#0f172a', to: '#1e3a8a', angle: 135 };

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    updateStatusBar();

    // 이미지 객체 재생성
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

  // ==========================================================================
  // 줌 및 화면 맞춤
  // ==========================================================================
  function setZoom(newZoom) {
    state.zoom = Math.max(0.15, Math.min(3.5, newZoom));
    canvasPaperFrame.style.transform = `scale(${state.zoom})`;
    const pct = `${Math.round(state.zoom * 100)}%`;
    if (zoomValLabel) zoomValLabel.textContent = pct;
    if (statusBarZoomText) statusBarZoomText.textContent = `줌 배율: ${pct}`;
  }

  function fitToScreen() {
    const padding = 120;
    const availW = canvasStageWrapper.clientWidth - padding;
    const availH = canvasStageWrapper.clientHeight - padding;
    const scale = Math.min(availW / state.canvasWidth, availH / state.canvasHeight);
    setZoom(Math.min(1.0, scale));
  }

  function updateStatusBar() {
    if (statusBarResolution) {
      statusBarResolution.textContent = `${state.canvasWidth} × ${state.canvasHeight} px`;
    }
  }

  // ==========================================================================
  // 캔버스 렌더링 파이프라인
  // ==========================================================================
  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 배경 그리기
    if (state.bgType === 'gradient' && state.bgGradient) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, state.bgGradient.from);
      grad.addColorStop(1, state.bgGradient.to);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = state.bgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 레이어 렌더링 (0번이 맨 뒤, 마지막이 맨 앞)
    state.layers.forEach(layer => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      // 그림자 공통
      if (layer.hasShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = layer.shadowBlur || 12;
        ctx.shadowOffsetX = layer.shadowOffsetX || 4;
        ctx.shadowOffsetY = layer.shadowOffsetY || 6;
      }

      // 타입별 렌더링
      if (layer.type === 'rect') {
        ctx.fillStyle = layer.fillColor || '#3b82f6';
        if (layer.borderRadius && layer.borderRadius > 0) {
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
        ctx.fillStyle = layer.fillColor || '#8b5cf6';
        const r = Math.min(layer.width, layer.height) / 2;
        drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, r);
        ctx.fill();
      } else if (layer.type === 'star') {
        ctx.fillStyle = layer.fillColor || '#f59e0b';
        drawStar(ctx, cx, cy, 5, layer.width / 2, layer.width / 4);
        ctx.fill();
      } else if (layer.type === 'text') {
        ctx.font = `${layer.fontWeight || '900'} ${layer.fontSize}px ${layer.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 외곽선 (스트로크)
        if (layer.strokeWidth > 0) {
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeStyle = layer.strokeColor || '#000000';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(layer.text, layer.x, layer.y);
        }

        ctx.fillStyle = layer.textColor || '#ffffff';
        ctx.fillText(layer.text, layer.x, layer.y);
      } else if (layer.type === 'image' && layer._imgEl && layer._imgEl.complete) {
        ctx.drawImage(layer._imgEl, layer.x, layer.y, layer.width, layer.height);
      } else if (layer.type === 'sticker') {
        ctx.font = `${layer.fontSize || 80}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.text, cx, cy);
      }

      ctx.restore();
    });

    // 3. 스마트 가이드라인 그리기 (정렬 스냅 시)
    if (state.snapEnabled) {
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
    }

    // 4. 선택된 레이어 바운딩 박스 & 핸들 그리기
    const selected = getSelectedLayer();
    if (selected) {
      drawTransformBoundingBox(selected);
    }
  }

  function drawRoundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawStar(c, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    c.beginPath();
    c.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      c.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      c.lineTo(x, y);
      rot += step;
    }
    c.lineTo(cx, cy - outerRadius);
    c.closePath();
  }

  // ==========================================================================
  // Figma / Canva 스타일 트랜스폼 바운딩 박스
  // ==========================================================================
  function drawTransformBoundingBox(layer) {
    ctx.save();
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // 테두리
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

    // 상단 회전 핸들 연결선 및 원
    const rotY = layer.y - 24;
    ctx.strokeStyle = '#6366f1';
    ctx.beginPath();
    ctx.moveTo(cx, layer.y);
    ctx.lineTo(cx, rotY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, rotY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 8개 리사이즈 핸들 (모서리 4개 + 변 중앙 4개)
    const handles = getHandles(layer);
    handles.forEach(h => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.fillRect(h.x - 4.5, h.y - 4.5, 9, 9);
      ctx.strokeRect(h.x - 4.5, h.y - 4.5, 9, 9);
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
      { id: 'bl', x: lx, y: ly + lh },
      { id: 'tc', x: lx + lw / 2, y: ly },
      { id: 'bc', x: lx + lw / 2, y: ly + lh },
      { id: 'ml', x: lx, y: ly + lh / 2 },
      { id: 'mr', x: lx + lw, y: ly + lh / 2 }
    ];
  }

  // ==========================================================================
  // 마우스 상호작용 (선택, 이동, 리사이즈, 회전, 스냅)
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
    state.selectedId = id;
    renderCanvas();
    renderLayerList();
    syncContextToolbar();
  }

  canvas.addEventListener('mousedown', (e) => {
    // 스페이스바 누른 상태면 캔버스 팬 모드
    if (state.spacePressed || e.button === 1) {
      state.isPanning = true;
      state.panStartX = e.clientX;
      state.panStartY = e.clientY;
      canvasStageWrapper.style.cursor = 'grabbing';
      return;
    }

    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();

    // 1. 선택된 레이어의 회전 핸들 검사
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

      // 2. 선택된 레이어의 리사이즈 핸들 검사
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

    // 3. 레이어 바디 클릭 검사 (맨 위 레이어부터 탐색)
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

  window.addEventListener('mousemove', (e) => {
    // 캔버스 팬 이동
    if (state.isPanning) {
      const dx = e.clientX - state.panStartX;
      const dy = e.clientY - state.panStartY;
      state.panStartX = e.clientX;
      state.panStartY = e.clientY;
      canvasStageWrapper.scrollLeft -= dx;
      canvasStageWrapper.scrollTop -= dy;
      return;
    }

    if (!state.dragState.isDragging) return;
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();
    if (!selected) return;

    const dx = coords.x - state.dragState.startX;
    const dy = coords.y - state.dragState.startY;
    const init = state.dragState.initialLayer;

    // A. 레이어 이동 (스마트 가이드 스냅 적용)
    if (state.dragState.mode === 'move') {
      let targetX = init.x + dx;
      let targetY = init.y + dy;

      state.snapGuides.x = null;
      state.snapGuides.y = null;

      if (state.snapEnabled) {
        const centerX = targetX + selected.width / 2;
        const centerY = targetY + selected.height / 2;
        const canvasCenterX = state.canvasWidth / 2;
        const canvasCenterY = state.canvasHeight / 2;

        // 가로 중앙 스냅
        if (Math.abs(centerX - canvasCenterX) <= 8) {
          targetX = canvasCenterX - selected.width / 2;
          state.snapGuides.x = canvasCenterX;
        }
        // 세로 중앙 스냅
        if (Math.abs(centerY - canvasCenterY) <= 8) {
          targetY = canvasCenterY - selected.height / 2;
          state.snapGuides.y = canvasCenterY;
        }
      }

      selected.x = Math.round(targetX);
      selected.y = Math.round(targetY);
    }

    // B. 리사이징 (8개 핸들)
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
      } else if (h === 'mr') {
        selected.width = Math.max(20, Math.round(init.width + dx));
      } else if (h === 'ml') {
        selected.x = Math.round(init.x + dx);
        selected.width = Math.max(20, Math.round(init.width - dx));
      } else if (h === 'bc') {
        selected.height = Math.max(20, Math.round(init.height + dy));
      } else if (h === 'tc') {
        selected.y = Math.round(init.y + dy);
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
    if (state.isPanning) {
      state.isPanning = false;
      canvasStageWrapper.style.cursor = 'default';
    }
    if (state.dragState.isDragging) {
      state.dragState.isDragging = false;
      state.dragState.mode = null;
      state.snapGuides.x = null;
      state.snapGuides.y = null;
      renderCanvas();
      pushHistory();
    }
  });

  // 인라인 텍스트 편집 (더블클릭 시 캔버스 위 즉시 편집)
  canvas.addEventListener('dblclick', (e) => {
    const selected = getSelectedLayer();
    if (!selected || selected.type !== 'text') return;

    const newText = prompt('텍스트 수정:', selected.text);
    if (newText !== null && newText.trim() !== '') {
      selected.text = newText;
      // 대략적인 텍스트 너비 재측정
      ctx.font = `${selected.fontWeight || '900'} ${selected.fontSize}px ${selected.fontFamily}`;
      const metrics = ctx.measureText(selected.text);
      selected.width = Math.max(selected.width, Math.round(metrics.width + 20));
      renderCanvas();
      renderLayerList();
      pushHistory();
      showToast('텍스트가 수정되었습니다.');
    }
  });

  // ==========================================================================
  // 상단 컨텍스추얼 툴바 동기화
  // ==========================================================================
  function syncContextToolbar() {
    const selected = getSelectedLayer();
    if (!selected) {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'none';
      ctxOpacitySlider.disabled = true;
      ctxDuplicateBtn.disabled = true;
      ctxDeleteBtn.disabled = true;
      return;
    }

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
      ctxTextColorPicker.value = selected.textColor;
      ctxTextColorPreview.style.backgroundColor = selected.textColor;
      ctxStrokeWidthInput.value = selected.strokeWidth;
      ctxStrokeColorPicker.value = selected.strokeColor;
      ctxShadowBtn.classList.toggle('active', selected.hasShadow);
    } else if (['rect', 'circle', 'pill', 'star'].includes(selected.type)) {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'flex';
      ctxFillColorPicker.value = selected.fillColor;
      ctxFillColorPreview.style.backgroundColor = selected.fillColor;
      ctxRadiusInput.value = selected.borderRadius || 0;
    } else {
      ctxTextGroup.style.display = 'none';
      ctxShapeGroup.style.display = 'none';
    }
  }

  // 컨텍스추얼 바 이벤트 바인딩
  ctxFontSelect.addEventListener('change', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.fontFamily = ctxFontSelect.value;
      renderCanvas();
      pushHistory();
    }
  });

  ctxFontSizeInput.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.fontSize = parseInt(ctxFontSizeInput.value, 10) || 40;
      renderCanvas();
    }
  });

  ctxFontSizeMinus.addEventListener('click', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.fontSize = Math.max(12, selected.fontSize - 4);
      ctxFontSizeInput.value = selected.fontSize;
      renderCanvas();
      pushHistory();
    }
  });

  ctxFontSizePlus.addEventListener('click', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.fontSize = Math.min(300, selected.fontSize + 4);
      ctxFontSizeInput.value = selected.fontSize;
      renderCanvas();
      pushHistory();
    }
  });

  ctxTextColorPicker.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.textColor = ctxTextColorPicker.value;
      ctxTextColorPreview.style.backgroundColor = selected.textColor;
      renderCanvas();
    }
  });

  ctxStrokeWidthInput.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.strokeWidth = parseInt(ctxStrokeWidthInput.value, 10) || 0;
      renderCanvas();
    }
  });

  ctxStrokeColorPicker.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.strokeColor = ctxStrokeColorPicker.value;
      renderCanvas();
    }
  });

  ctxShadowBtn.addEventListener('click', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.hasShadow = !selected.hasShadow;
      ctxShadowBtn.classList.toggle('active', selected.hasShadow);
      renderCanvas();
      pushHistory();
    }
  });

  ctxFillColorPicker.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.fillColor = ctxFillColorPicker.value;
      ctxFillColorPreview.style.backgroundColor = selected.fillColor;
      renderCanvas();
    }
  });

  ctxRadiusInput.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.borderRadius = parseInt(ctxRadiusInput.value, 10) || 0;
      renderCanvas();
    }
  });

  ctxOpacitySlider.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.opacity = parseInt(ctxOpacitySlider.value, 10) / 100;
      ctxOpacityVal.textContent = `${ctxOpacitySlider.value}%`;
      renderCanvas();
    }
  });

  ctxDuplicateBtn.addEventListener('click', () => duplicateSelectedLayer());
  ctxDeleteBtn.addEventListener('click', () => deleteSelectedLayer());

  function duplicateSelectedLayer() {
    const selected = getSelectedLayer();
    if (!selected) return;
    const newLayer = {
      ...selected,
      id: 'layer_' + Date.now(),
      name: `${selected.name} 복제`,
      x: selected.x + 24,
      y: selected.y + 24
    };
    if (selected.type === 'image' && selected._imgEl) {
      newLayer._imgEl = selected._imgEl;
    }
    state.layers.push(newLayer);
    selectLayer(newLayer.id);
    pushHistory();
    showToast('레이어가 복제되었습니다 (Ctrl+D)');
  }

  function deleteSelectedLayer() {
    if (!state.selectedId) return;
    state.layers = state.layers.filter(l => l.id !== state.selectedId);
    selectLayer(null);
    pushHistory();
    showToast('레이어가 삭제되었습니다 (Del)');
  }

  // ==========================================================================
  // 정렬 도구 (캔버스 기준)
  // ==========================================================================
  alignLeftBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s) { s.x = 0; renderCanvas(); pushHistory(); }
  });
  alignCenterHBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s) { s.x = Math.round((state.canvasWidth - s.width) / 2); renderCanvas(); pushHistory(); }
  });
  alignRightBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s) { s.x = state.canvasWidth - s.width; renderCanvas(); pushHistory(); }
  });
  alignTopBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s) { s.y = 0; renderCanvas(); pushHistory(); }
  });
  alignCenterVBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s) { s.y = Math.round((state.canvasHeight - s.height) / 2); renderCanvas(); pushHistory(); }
  });
  alignBottomBtn.addEventListener('click', () => {
    const s = getSelectedLayer();
    if (s) { s.y = state.canvasHeight - s.height; renderCanvas(); pushHistory(); }
  });

  // 레이어 순서 (앞으로 / 뒤로)
  btnLayerBringForward.addEventListener('click', () => {
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

  btnLayerSendBackward.addEventListener('click', () => {
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

  // ==========================================================================
  // 우측 도크: 레이어 리스트 렌더링
  // ==========================================================================
  function renderLayerList() {
    layersScrollList.innerHTML = '';
    layerCountTag.textContent = `${state.layers.length}개 레이어`;

    // 위에서부터 (맨 위 레이어가 스택 상단)
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      const row = document.createElement('div');
      row.className = `layer-row-card ${layer.id === state.selectedId ? 'active' : ''}`;

      const iconMap = { text: '🔤', image: '🖼️', rect: '⬛', circle: '⚪', pill: '💊', star: '⭐', sticker: '✨' };
      row.innerHTML = `
        <span class="layer-type-icon">${iconMap[layer.type] || '📄'}</span>
        <span class="layer-name-text" title="${layer.name}">${layer.name}</span>
        <div class="layer-actions-sub">
          <button type="button" class="btn-layer-icon btn-vis" title="보이기/숨기기">
            ${layer.visible ? '👁️' : '🙈'}
          </button>
          <button type="button" class="btn-layer-icon btn-del" title="삭제">✕</button>
        </div>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-layer-icon')) return;
        selectLayer(layer.id);
      });

      row.querySelector('.btn-vis').addEventListener('click', (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        renderCanvas();
        renderLayerList();
        pushHistory();
      });

      row.querySelector('.btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        state.layers = state.layers.filter(l => l.id !== layer.id);
        if (state.selectedId === layer.id) selectLayer(null);
        renderCanvas();
        renderLayerList();
        pushHistory();
      });

      layersScrollList.appendChild(row);
    }
  }

  // ==========================================================================
  // 좌측 독(Dock) 및 드로어(Drawer) 탭 전환
  // ==========================================================================
  dockTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      dockTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sideDrawerPanel.classList.remove('collapsed');
      drawerContents.forEach(c => c.classList.remove('active'));

      const targetContent = document.getElementById(`drawer${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
      if (targetContent) targetContent.classList.add('active');

      const titleMap = {
        templates: '템플릿',
        elements: '요소 및 도형',
        text: '텍스트',
        uploads: '내 업로드',
        background: '배경 설정'
      };
      drawerTitle.textContent = titleMap[tab] || '드로어';
    });
  });

  btnCloseDrawer.addEventListener('click', () => {
    sideDrawerPanel.classList.toggle('collapsed');
  });

  // ==========================================================================
  // 요소 추가: 도형 & 텍스트 & 스티커
  // ==========================================================================
  btnAddHeading.addEventListener('click', () => {
    addTextLayer('제목 텍스트 입력', 78, "'Black Han Sans', sans-serif", '#ffffff', 6, '#000000');
  });

  btnAddSubheading.addEventListener('click', () => {
    addTextLayer('소제목 설명을 입력하세요', 44, "'Pretendard', sans-serif", '#f8fafc', 3, '#0f172a');
  });

  btnAddBodyText.addEventListener('click', () => {
    addTextLayer('여기에 본문 상세 내용을 작성합니다.', 28, "'Noto Sans KR', sans-serif", '#cbd5e1', 0, '#000000');
  });

  function addTextLayer(text, fontSize, font, color, strokeW, strokeC) {
    const newL = {
      id: 'layer_' + Date.now(),
      type: 'text',
      name: text.slice(0, 12),
      text: text,
      fontFamily: font,
      fontSize: fontSize,
      textColor: color,
      strokeWidth: strokeW,
      strokeColor: strokeC,
      hasShadow: true,
      x: 100,
      y: 200,
      width: Math.min(800, text.length * fontSize * 0.7 + 40),
      height: fontSize + 30,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    state.layers.push(newL);
    selectLayer(newL.id);
    pushHistory();
    showToast('텍스트 레이어가 추가되었습니다.');
  }

  // 타이포그래피 프리셋
  document.querySelectorAll('.typo-preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-typo');
      if (type === 'bold-yellow') {
        addTextLayer('유튜브 레전드 사건 대공개', 74, "'Black Han Sans', sans-serif", '#facc15', 8, '#000000');
      } else if (type === 'neon-cyber') {
        addTextLayer('CYBERPUNK 2026', 64, "'Pretendard', sans-serif", '#38bdf8', 4, '#0284c7');
      } else if (type === 'impact-red') {
        addTextLayer('충격 주의! 절대 클릭 금지', 70, "'Do Hyeon', sans-serif", '#ef4444', 6, '#ffffff');
      } else if (type === 'clean-badge') {
        addTextLayer('SPECIAL INTERVIEW', 36, "'Pretendard', sans-serif", '#ffffff', 0, '#000000');
      }
    });
  });

  btnAddRect.addEventListener('click', () => {
    addShapeLayer('rect', 360, 240, '#3b82f6', '사각형');
  });

  btnAddCircle.addEventListener('click', () => {
    addShapeLayer('circle', 240, 240, '#ef4444', '원형');
  });

  btnAddPill.addEventListener('click', () => {
    addShapeLayer('pill', 320, 80, '#8b5cf6', '알약 라벨');
  });

  btnAddStar.addEventListener('click', () => {
    addShapeLayer('star', 220, 220, '#f59e0b', '별 배지');
  });

  function addShapeLayer(type, w, h, color, name) {
    const newL = {
      id: 'layer_' + Date.now(),
      type: type,
      name: name,
      fillColor: color,
      borderRadius: type === 'pill' ? h / 2 : 0,
      hasShadow: false,
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

  // 스티커 추가
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

  // ==========================================================================
  // 업로드 기능 (파일 드래그 & 사이드바 갤러리)
  // ==========================================================================
  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        // 갤러리 썸네일 추가
        const thumb = document.createElement('div');
        thumb.className = 'gallery-thumb-item';
        thumb.innerHTML = `<img src="${dataUrl}" alt="업로드 이미지" />`;
        thumb.addEventListener('click', () => insertImageToCanvas(dataUrl, img, file.name));
        uploadedGalleryGrid.prepend(thumb);

        // 캔버스에 즉시 삽입
        insertImageToCanvas(dataUrl, img, file.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function insertImageToCanvas(dataUrl, img, name) {
    const aspect = img.width / img.height;
    const maxW = Math.min(640, img.width);
    const maxH = Math.round(maxW / aspect);

    const newL = {
      id: 'layer_' + Date.now(),
      type: 'image',
      name: name ? name.slice(0, 14) : '이미지 레이어',
      dataUrl: dataUrl,
      _imgEl: img,
      hasShadow: false,
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
    showToast('이미지가 캔버스에 추가되었습니다.');
  }

  sideUploadInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(handleImageUpload);
    sideUploadInput.value = '';
  });

  sidebarDropzone.addEventListener('dragover', (e) => { e.preventDefault(); });
  sidebarDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(handleImageUpload);
  });

  // 캔버스 자체로의 드래그 앤 드롭 지원
  canvasStageWrapper.addEventListener('dragover', (e) => { e.preventDefault(); });
  canvasStageWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(handleImageUpload);
  });

  // ==========================================================================
  // 배경 설정 (단색 & 그라데이션)
  // ==========================================================================
  document.querySelectorAll('.color-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgType = 'color';
      state.bgColor = btn.getAttribute('data-color');
      renderCanvas();
      pushHistory();
    });
  });

  document.querySelectorAll('.gradient-card').forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgType = 'gradient';
      const grad = btn.getAttribute('data-grad');
      const map = {
        midnight: { from: '#0f172a', to: '#1e3a8a' },
        cyber: { from: '#18181b', to: '#701a75' },
        sunset: { from: '#18181b', to: '#831843' },
        emerald: { from: '#064e3b', to: '#0f766e' }
      };
      state.bgGradient = { ...(map[grad] || map.midnight), angle: 135 };
      renderCanvas();
      pushHistory();
      showToast('배경 그라데이션이 적용되었습니다.');
    });
  });

  // ==========================================================================
  // 템플릿 원클릭 로드 (프로 수준 템플릿)
  // ==========================================================================
  document.querySelectorAll('.tpl-card').forEach(card => {
    card.addEventListener('click', () => {
      const tpl = card.getAttribute('data-tpl');
      loadTemplatePreset(tpl);
    });
  });

  function loadTemplatePreset(type) {
    if (state.layers.length > 0 && !confirm('현재 작업 중인 레이어가 템플릿으로 교체됩니다. 계속하시겠습니까?')) {
      return;
    }

    if (type === 'gaming-thumb') {
      state.canvasWidth = 1280;
      state.canvasHeight = 720;
      state.bgType = 'gradient';
      state.bgGradient = { from: '#0b0f19', to: '#1e1b4b', angle: 135 };
      state.layers = [
        {
          id: 'l_bg_card',
          type: 'rect',
          name: '메인 배경 카드',
          fillColor: '#1e1b4b',
          borderRadius: 24,
          x: 40, y: 40, width: 1200, height: 640,
          rotation: 0, opacity: 0.9, visible: true, locked: false
        },
        {
          id: 'l_pill',
          type: 'pill',
          name: 'TOP 배지',
          fillColor: '#ef4444',
          borderRadius: 25,
          x: 100, y: 110, width: 220, height: 50,
          rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_pill_text',
          type: 'text',
          name: '배지 텍스트',
          text: '🔥 실시간 랭킹 1위',
          fontFamily: "'Pretendard', sans-serif",
          fontSize: 24, textColor: '#ffffff', strokeWidth: 0,
          x: 125, y: 122, width: 180, height: 35,
          rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_title',
          type: 'text',
          name: '어그로 타이틀',
          text: '충격적인 진실 공개!',
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 92, textColor: '#facc15', strokeWidth: 10, strokeColor: '#000000',
          hasShadow: true, x: 100, y: 200, width: 900, height: 120,
          rotation: -2, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_sub',
          type: 'text',
          name: '서브 설명',
          text: '프로들이 절대 알려주지 않는 웹 디자인 비밀',
          fontFamily: "'Pretendard', sans-serif",
          fontSize: 42, textColor: '#ffffff', strokeWidth: 4, strokeColor: '#0f172a',
          hasShadow: true, x: 105, y: 350, width: 850, height: 60,
          rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_star',
          type: 'star',
          name: '골드 스타 배지',
          fillColor: '#fbbf24',
          x: 980, y: 360, width: 180, height: 180,
          rotation: 15, opacity: 1, visible: true, locked: false
        }
      ];
    } else if (type === 'clean-business') {
      state.canvasWidth = 1080;
      state.canvasHeight = 1080;
      state.bgType = 'color';
      state.bgColor = '#0f172a';
      state.layers = [
        {
          id: 'l_accent_bar',
          type: 'rect',
          name: '인디고 포인트 바',
          fillColor: '#6366f1',
          x: 80, y: 80, width: 920, height: 8,
          rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_b_tag',
          type: 'text',
          name: '카테고리 태그',
          text: 'REPORT · 2026 TREND',
          fontFamily: "'Pretendard', sans-serif",
          fontSize: 26, textColor: '#818cf8', strokeWidth: 0,
          x: 80, y: 140, width: 400, height: 40,
          rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_b_title',
          type: 'text',
          name: '헤드라인',
          text: '새로운 세대의 아웃풋,\n궁디 크리에이티브 스튜디오',
          fontFamily: "'Pretendard', sans-serif",
          fontSize: 58, textColor: '#ffffff', strokeWidth: 0,
          x: 80, y: 220, width: 880, height: 160,
          rotation: 0, opacity: 1, visible: true, locked: false
        },
        {
          id: 'l_b_sub',
          type: 'text',
          name: '상세 설명',
          text: '설치 없이 웹 브라우저에서 누리는\n전문가용 캔버스 그래픽 제작 솔루션',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: 32, textColor: '#94a3b8', strokeWidth: 0,
          x: 80, y: 440, width: 800, height: 90,
          rotation: 0, opacity: 1, visible: true, locked: false
        }
      ];
    }

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    canvasPresetSelect.value = `${state.canvasWidth}x${state.canvasHeight}`;
    updateStatusBar();
    fitToScreen();
    selectLayer(state.layers[state.layers.length - 1]?.id || null);
    pushHistory();
    showToast('템플릿이 로드되었습니다!');
  }

  // ==========================================================================
  // 단축키 시스템 (Figma / Canva 표준)
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // 인풋 포커스 시 단축키 비활성화
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // 스페이스바 (팬 모드 활성화)
    if (e.code === 'Space') {
      state.spacePressed = true;
      canvasStageWrapper.style.cursor = 'grab';
    }

    // Ctrl + Z (실행 취소)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'ㅋ') && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl + Y 또는 Ctrl + Shift + Z (다시 실행)
    else if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'ㅛ') || (e.shiftKey && (e.key === 'z' || e.key === 'ㅋ')))) {
      e.preventDefault();
      redo();
    }
    // Ctrl + D (레이어 복제)
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'ㅇ')) {
      e.preventDefault();
      duplicateSelectedLayer();
    }
    // Delete 또는 Backspace (레이어 삭제)
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedLayer();
    }
    // 방향키 이동 (1px 미세이동 / Shift 10px 고속이동)
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
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      state.spacePressed = false;
      if (!state.isPanning) canvasStageWrapper.style.cursor = 'default';
    }
  });

  // Ctrl + 마우스 휠 줌
  canvasStageWrapper.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(state.zoom + zoomDelta);
    }
  }, { passive: false });

  // ==========================================================================
  // 프리셋 선택 및 프로젝트 파일 관리 (.gdp-img)
  // ==========================================================================
  canvasPresetSelect.addEventListener('change', () => {
    const val = canvasPresetSelect.value;
    if (val === 'custom') {
      const input = prompt('캔버스 가로 x 세로 크기를 입력하세요 (예: 1920x1080):', `${state.canvasWidth}x${state.canvasHeight}`);
      if (input && input.includes('x')) {
        const [w, h] = input.split('x').map(Number);
        if (w > 100 && h > 100) {
          state.canvasWidth = w;
          state.canvasHeight = h;
        }
      }
    } else {
      const [w, h] = val.split('x').map(Number);
      state.canvasWidth = w;
      state.canvasHeight = h;
    }
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    updateStatusBar();
    fitToScreen();
    renderCanvas();
    pushHistory();
    showToast(`캔버스 크기: ${state.canvasWidth} × ${state.canvasHeight}`);
  });

  btnSnapToggle.addEventListener('click', () => {
    state.snapEnabled = !state.snapEnabled;
    btnSnapToggle.classList.toggle('active', state.snapEnabled);
    showToast(state.snapEnabled ? '스마트 스냅 가이드 켜짐' : '스냅 가이드 꺼짐');
  });

  zoomInBtn.addEventListener('click', () => setZoom(state.zoom + 0.15));
  zoomOutBtn.addEventListener('click', () => setZoom(state.zoom - 0.15));
  zoomFitBtn.addEventListener('click', fitToScreen);

  // 💾 프로젝트 저장
  saveProjectBtn.addEventListener('click', () => {
    const projectData = {
      version: '2.0',
      type: 'goongdi-image-project-pro',
      savedAt: new Date().toISOString(),
      title: state.title,
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
    a.download = `${state.title.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}_${Date.now()}.gdp-img`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('프로젝트가 .gdp-img 파일로 다운로드되었습니다!');
  });

  // 📁 프로젝트 불러오기
  loadProjectInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.layers) throw new Error('올바른 궁디 프로젝트 파일이 아닙니다.');
        restoreSnapshot(JSON.stringify(data));
        fitToScreen();
        showToast('프로젝트를 성공적으로 불러왔습니다!');
      } catch (err) {
        alert('프로젝트 파일 로드 실패: ' + err.message);
      }
    };
    reader.readAsText(file);
    loadProjectInput.value = '';
  });

  projectTitleInput.addEventListener('input', () => {
    state.title = projectTitleInput.value.trim() || '무제 디자인';
  });

  // ==========================================================================
  // 고해상도 내보내기 (1X, 2X 레티나, PNG/JPG/WebP)
  // ==========================================================================
  exportMainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenuPopover.classList.toggle('open');
  });

  window.addEventListener('click', () => {
    if (exportMenuPopover) exportMenuPopover.classList.remove('open');
  });

  document.querySelectorAll('.export-option-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format');
      const scale = parseInt(btn.getAttribute('data-scale'), 10) || 1;

      // 선택 테두리 끄기
      selectLayer(null);

      showToast(`${scale}X 고해상도 이미지 렌더링 중...`);

      setTimeout(() => {
        let exportCanvas = canvas;
        if (scale > 1) {
          // 2X 레티나 렌더링 캔버스 생성
          exportCanvas = document.createElement('canvas');
          exportCanvas.width = canvas.width * scale;
          exportCanvas.height = canvas.height * scale;
          const eCtx = exportCanvas.getContext('2d');
          eCtx.scale(scale, scale);

          // 배경 그리기
          if (state.bgType === 'gradient' && state.bgGradient) {
            const grad = eCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, state.bgGradient.from);
            grad.addColorStop(1, state.bgGradient.to);
            eCtx.fillStyle = grad;
          } else {
            eCtx.fillStyle = state.bgColor;
          }
          eCtx.fillRect(0, 0, canvas.width, canvas.height);

          // 모든 레이어 동일하게 2배 스케일 렌더
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
              eCtx.shadowColor = 'rgba(0, 0, 0, 0.7)';
              eCtx.shadowBlur = layer.shadowBlur || 12;
              eCtx.shadowOffsetX = layer.shadowOffsetX || 4;
              eCtx.shadowOffsetY = layer.shadowOffsetY || 6;
            }

            if (layer.type === 'rect') {
              eCtx.fillStyle = layer.fillColor || '#3b82f6';
              eCtx.fillRect(layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'circle') {
              eCtx.fillStyle = layer.fillColor || '#ef4444';
              eCtx.beginPath();
              eCtx.ellipse(cx, cy, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
              eCtx.fill();
            } else if (layer.type === 'text') {
              eCtx.font = `${layer.fontWeight || '900'} ${layer.fontSize}px ${layer.fontFamily}`;
              eCtx.textAlign = 'left';
              eCtx.textBaseline = 'top';
              if (layer.strokeWidth > 0) {
                eCtx.lineWidth = layer.strokeWidth;
                eCtx.strokeStyle = layer.strokeColor || '#000000';
                eCtx.lineJoin = 'round';
                eCtx.strokeText(layer.text, layer.x, layer.y);
              }
              eCtx.fillStyle = layer.textColor || '#ffffff';
              eCtx.fillText(layer.text, layer.x, layer.y);
            } else if (layer.type === 'image' && layer._imgEl) {
              eCtx.drawImage(layer._imgEl, layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'star') {
              eCtx.fillStyle = layer.fillColor || '#f59e0b';
              drawStar(eCtx, cx, cy, 5, layer.width / 2, layer.width / 4);
              eCtx.fill();
            } else if (layer.type === 'pill') {
              eCtx.fillStyle = layer.fillColor || '#8b5cf6';
              const r = Math.min(layer.width, layer.height) / 2;
              drawRoundedRect(eCtx, layer.x, layer.y, layer.width, layer.height, r);
              eCtx.fill();
            }
            eCtx.restore();
          });
        }

        const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const ext = format === 'jpeg' ? 'jpg' : format;
        const dataUrl = exportCanvas.toDataURL(mime, 0.94);

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${state.title.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}_${scale}x.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`${scale}X ${ext.toUpperCase()} 저장 완료!`);
      }, 60);
    });
  });

  // ==========================================================================
  // 초기화 (데모 템플릿 로드)
  // ==========================================================================
  function init() {
    loadTemplatePreset('gaming-thumb');
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
  }

  init();
})();
