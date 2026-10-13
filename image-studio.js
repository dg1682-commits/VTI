/**
 * 궁디 이미지 스튜디오 (GOONGDI Image Studio) Engine
 * Pure Vanilla JS - No Build Step Required
 */

(function () {
  'use strict';

  // 캔버스 및 DOM 엘리먼트
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d');
  const canvasViewport = document.getElementById('canvasViewport');
  const paperWrapper = document.getElementById('paperWrapper');

  // 상단 바 컨트롤
  const presetSelect = document.getElementById('canvasPresetSelect');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const zoomValLabel = document.getElementById('zoomVal');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const loadProjectInput = document.getElementById('loadProjectInput');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');

  // 좌측 툴바
  const toolSelect = document.getElementById('toolSelect');
  const toolAddText = document.getElementById('toolAddText');
  const addImageInput = document.getElementById('addImageInput');
  const toolAddRect = document.getElementById('toolAddRect');
  const toolAddCircle = document.getElementById('toolAddCircle');
  const toolAddSticker = document.getElementById('toolAddSticker');
  const toolBgColor = document.getElementById('toolBgColor');

  // 우측 패널
  const tabPropsBtn = document.getElementById('tabPropsBtn');
  const tabLayersBtn = document.getElementById('tabLayersBtn');
  const panelProperties = document.getElementById('panelProperties');
  const panelLayers = document.getElementById('panelLayers');
  const layerCountBadge = document.getElementById('layerCountBadge');
  const noSelectionNotice = document.getElementById('noSelectionNotice');
  const inspectorControls = document.getElementById('inspectorControls');
  const textPropsGroup = document.getElementById('textPropsGroup');

  // 속성 입력 필드
  const propTextContent = document.getElementById('propTextContent');
  const propFontFamily = document.getElementById('propFontFamily');
  const propFontSize = document.getElementById('propFontSize');
  const propTextColor = document.getElementById('propTextColor');
  const propStrokeWidth = document.getElementById('propStrokeWidth');
  const propStrokeColor = document.getElementById('propStrokeColor');
  const propShadowToggle = document.getElementById('propShadowToggle');
  const propWidth = document.getElementById('propWidth');
  const propHeight = document.getElementById('propHeight');
  const propOpacity = document.getElementById('propOpacity');
  const propOpacityVal = document.getElementById('propOpacityVal');
  const propRotation = document.getElementById('propRotation');
  const propRotationVal = document.getElementById('propRotationVal');
  const alignCenterHBtn = document.getElementById('alignCenterHBtn');
  const alignCenterVBtn = document.getElementById('alignCenterVBtn');
  const duplicateLayerBtn = document.getElementById('duplicateLayerBtn');
  const deleteLayerBtn = document.getElementById('deleteLayerBtn');

  // 레이어 관리
  const moveLayerUpBtn = document.getElementById('moveLayerUpBtn');
  const moveLayerDownBtn = document.getElementById('moveLayerDownBtn');
  const layerItemsContainer = document.getElementById('layerItemsContainer');

  // 하단 상태바
  const canvasDimLabel = document.getElementById('canvasDimLabel');
  const statusInfo = document.getElementById('statusInfo');
  const studioToast = document.getElementById('studioToast');

  // 스튜디오 상태
  const state = {
    canvasWidth: 1280,
    canvasHeight: 720,
    bgColor: '#1e293b',
    zoom: 1,
    layers: [],
    selectedId: null,
    history: [],
    historyIndex: -1,
    isDragging: false,
    dragAction: null, // 'move' | 'resize'
    resizeHandle: null,
    dragStartX: 0,
    dragStartY: 0,
    initialLayerState: null
  };

  // 토스트 알림 함수
  function showToast(msg) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.add('show');
    setTimeout(() => {
      studioToast.classList.remove('show');
    }, 2400);
  }

  // 히스토리(실행 취소/다시 실행) 저장
  function pushHistory() {
    // 현재 레이어 스냅샷 복제
    const snapshot = JSON.stringify({
      layers: state.layers.map(l => ({ ...l })),
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      bgColor: state.bgColor
    });

    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(snapshot);
    if (state.history.length > 30) state.history.shift();
    state.historyIndex = state.history.length - 1;
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = state.historyIndex >= state.history.length - 1;
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreSnapshot(state.history[state.historyIndex]);
      showToast('실행 취소되었습니다.');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreSnapshot(state.history[state.historyIndex]);
      showToast('다시 실행되었습니다.');
    }
  }

  function restoreSnapshot(jsonStr) {
    const data = JSON.parse(jsonStr);
    state.canvasWidth = data.canvasWidth;
    state.canvasHeight = data.canvasHeight;
    state.bgColor = data.bgColor;
    canvas.width = data.canvasWidth;
    canvas.height = data.canvasHeight;
    updateCanvasDimLabel();

    // 레이어 복원 (이미지 객체 재생성)
    state.layers = data.layers.map(l => {
      if (l.type === 'image' && l.dataUrl) {
        const img = new Image();
        img.src = l.dataUrl;
        return { ...l, _imgEl: img };
      }
      return { ...l };
    });

    renderCanvas();
    renderLayersList();
    syncInspector();
    updateHistoryButtons();
  }

  // 캔버스 크기 레이블 갱신
  function updateCanvasDimLabel() {
    if (canvasDimLabel) {
      canvasDimLabel.textContent = `${state.canvasWidth} × ${state.canvasHeight} px`;
    }
  }

  // 줌 적용
  function setZoom(newZoom) {
    state.zoom = Math.max(0.2, Math.min(3.0, newZoom));
    paperWrapper.style.transform = `scale(${state.zoom})`;
    zoomValLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function fitToScreen() {
    const vW = canvasViewport.clientWidth - 80;
    const vH = canvasViewport.clientHeight - 80;
    const scale = Math.min(vW / state.canvasWidth, vH / state.canvasHeight);
    setZoom(scale);
  }

  // 레이어 선택
  function selectLayer(id) {
    state.selectedId = id;
    renderCanvas();
    renderLayersList();
    syncInspector();
  }

  function getSelectedLayer() {
    return state.layers.find(l => l.id === state.selectedId);
  }

  // ==========================================================================
  // 캔버스 렌더링 루프
  // ==========================================================================
  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경색 채우기
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 레이어 그리기 (배열 순서: 0이 맨 아래, 마지막이 맨 위)
    state.layers.forEach(layer => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      // 위치 및 회전 변환
      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      if (layer.type === 'rect') {
        ctx.fillStyle = layer.fillColor || '#3b82f6';
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
      } else if (layer.type === 'circle') {
        ctx.fillStyle = layer.fillColor || '#ef4444';
        ctx.beginPath();
        ctx.ellipse(cx, cy, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (layer.type === 'text') {
        ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        if (layer.hasShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
        }

        if (layer.strokeWidth > 0) {
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeStyle = layer.strokeColor;
          ctx.strokeText(layer.text, layer.x, layer.y);
        }

        ctx.fillStyle = layer.textColor;
        ctx.fillText(layer.text, layer.x, layer.y);
      } else if (layer.type === 'image' && layer._imgEl && layer._imgEl.complete) {
        ctx.drawImage(layer._imgEl, layer.x, layer.y, layer.width, layer.height);
      } else if (layer.type === 'sticker') {
        ctx.font = `${layer.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.text, cx, cy);
      }

      ctx.restore();
    });

    // 선택된 레이어 테두리 및 크기 조절 핸들 그리기
    const selected = getSelectedLayer();
    if (selected) {
      drawSelectionBox(selected);
    }
  }

  function drawSelectionBox(layer) {
    ctx.save();
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // 테두리
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
    ctx.setLineDash([]);

    // 4개 모서리 핸들
    const handles = getHandles(layer);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;

    handles.forEach(h => {
      ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
      ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
    });

    ctx.restore();
  }

  function getHandles(layer) {
    return [
      { id: 'tl', x: layer.x, y: layer.y },
      { id: 'tr', x: layer.x + layer.width, y: layer.y },
      { id: 'br', x: layer.x + layer.width, y: layer.y + layer.height },
      { id: 'bl', x: layer.x, y: layer.y + layer.height }
    ];
  }

  // ==========================================================================
  // 마우스 상호작용 (선택, 이동, 크기 조절)
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

  canvas.addEventListener('mousedown', (e) => {
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();

    // 1. 선택된 레이어의 핸들을 클릭했는지 확인
    if (selected) {
      const handles = getHandles(selected);
      for (const h of handles) {
        if (Math.hypot(coords.x - h.x, coords.y - h.y) <= 12) {
          state.isDragging = true;
          state.dragAction = 'resize';
          state.resizeHandle = h.id;
          state.dragStartX = coords.x;
          state.dragStartY = coords.y;
          state.initialLayerState = { ...selected };
          return;
        }
      }
    }

    // 2. 다른 레이어를 클릭했는지 확인 (맨 위 레이어부터 역순 탐색)
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
      state.isDragging = true;
      state.dragAction = 'move';
      state.dragStartX = coords.x;
      state.dragStartY = coords.y;
      state.initialLayerState = { ...hitLayer };
    } else {
      selectLayer(null);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    const coords = getCanvasCoords(e);
    const selected = getSelectedLayer();
    if (!selected) return;

    const dx = coords.x - state.dragStartX;
    const dy = coords.y - state.dragStartY;

    if (state.dragAction === 'move') {
      selected.x = Math.round(state.initialLayerState.x + dx);
      selected.y = Math.round(state.initialLayerState.y + dy);
    } else if (state.dragAction === 'resize') {
      const init = state.initialLayerState;
      if (state.resizeHandle === 'br') {
        selected.width = Math.max(20, Math.round(init.width + dx));
        selected.height = Math.max(20, Math.round(init.height + dy));
      } else if (state.resizeHandle === 'bl') {
        selected.x = Math.round(init.x + dx);
        selected.width = Math.max(20, Math.round(init.width - dx));
        selected.height = Math.max(20, Math.round(init.height + dy));
      } else if (state.resizeHandle === 'tr') {
        selected.y = Math.round(init.y + dy);
        selected.width = Math.max(20, Math.round(init.width + dx));
        selected.height = Math.max(20, Math.round(init.height - dy));
      } else if (state.resizeHandle === 'tl') {
        selected.x = Math.round(init.x + dx);
        selected.y = Math.round(init.y + dy);
        selected.width = Math.max(20, Math.round(init.width - dx));
        selected.height = Math.max(20, Math.round(init.height - dy));
      }
    }

    renderCanvas();
    syncInspector();
  });

  window.addEventListener('mouseup', () => {
    if (state.isDragging) {
      state.isDragging = false;
      state.dragAction = null;
      pushHistory();
    }
  });

  // ==========================================================================
  // 레이어 조작 및 속성 연동
  // ==========================================================================
  function syncInspector() {
    const selected = getSelectedLayer();
    if (!selected) {
      noSelectionNotice.style.display = 'block';
      inspectorControls.style.display = 'none';
      return;
    }

    noSelectionNotice.style.display = 'none';
    inspectorControls.style.display = 'block';

    // 텍스트 속성
    if (selected.type === 'text') {
      textPropsGroup.style.display = 'block';
      propTextContent.value = selected.text;
      propFontFamily.value = selected.fontFamily;
      propFontSize.value = selected.fontSize;
      propTextColor.value = selected.textColor;
      propStrokeWidth.value = selected.strokeWidth;
      propStrokeColor.value = selected.strokeColor;
      propShadowToggle.checked = selected.hasShadow;
    } else {
      textPropsGroup.style.display = 'none';
    }

    // 공통 속성
    propWidth.value = selected.width;
    propHeight.value = selected.height;
    propOpacity.value = Math.round(selected.opacity * 100);
    propOpacityVal.textContent = `${Math.round(selected.opacity * 100)}%`;
    propRotation.value = selected.rotation;
    propRotationVal.textContent = `${selected.rotation}°`;
  }

  // 속성 인풋 이벤트 바인딩
  propTextContent.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.text = propTextContent.value;
      renderCanvas();
      renderLayersList();
    }
  });

  propFontFamily.addEventListener('change', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.fontFamily = propFontFamily.value;
      renderCanvas();
    }
  });

  propFontSize.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.fontSize = parseInt(propFontSize.value, 10) || 40;
      renderCanvas();
    }
  });

  propTextColor.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.textColor = propTextColor.value;
      renderCanvas();
    }
  });

  propStrokeWidth.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.strokeWidth = parseInt(propStrokeWidth.value, 10) || 0;
      renderCanvas();
    }
  });

  propStrokeColor.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.strokeColor = propStrokeColor.value;
      renderCanvas();
    }
  });

  propShadowToggle.addEventListener('change', () => {
    const selected = getSelectedLayer();
    if (selected && selected.type === 'text') {
      selected.hasShadow = propShadowToggle.checked;
      renderCanvas();
    }
  });

  propOpacity.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.opacity = parseInt(propOpacity.value, 10) / 100;
      propOpacityVal.textContent = `${propOpacity.value}%`;
      renderCanvas();
    }
  });

  propRotation.addEventListener('input', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.rotation = parseInt(propRotation.value, 10) || 0;
      propRotationVal.textContent = `${selected.rotation}°`;
      renderCanvas();
    }
  });

  alignCenterHBtn.addEventListener('click', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.x = Math.round((state.canvasWidth - selected.width) / 2);
      renderCanvas();
      syncInspector();
      pushHistory();
    }
  });

  alignCenterVBtn.addEventListener('click', () => {
    const selected = getSelectedLayer();
    if (selected) {
      selected.y = Math.round((state.canvasHeight - selected.height) / 2);
      renderCanvas();
      syncInspector();
      pushHistory();
    }
  });

  duplicateLayerBtn.addEventListener('click', () => {
    const selected = getSelectedLayer();
    if (!selected) return;
    const newLayer = {
      ...selected,
      id: 'layer_' + Date.now(),
      name: `${selected.name} 복사본`,
      x: selected.x + 20,
      y: selected.y + 20
    };
    if (selected.type === 'image' && selected._imgEl) {
      newLayer._imgEl = selected._imgEl;
    }
    state.layers.push(newLayer);
    selectLayer(newLayer.id);
    pushHistory();
    showToast('레이어가 복제되었습니다.');
  });

  deleteLayerBtn.addEventListener('click', () => {
    deleteSelectedLayer();
  });

  function deleteSelectedLayer() {
    if (!state.selectedId) return;
    state.layers = state.layers.filter(l => l.id !== state.selectedId);
    selectLayer(null);
    pushHistory();
    showToast('레이어가 삭제되었습니다.');
  }

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedLayer();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'ㅋ')) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'ㅛ')) {
      e.preventDefault();
      redo();
    }
  });

  // ==========================================================================
  // 도구 버튼: 텍스트 / 이미지 / 도형 / 스티커 추가
  // ==========================================================================
  toolAddText.addEventListener('click', () => {
    const newTextLayer = {
      id: 'layer_' + Date.now(),
      type: 'text',
      name: '텍스트 레이어',
      text: '궁디 스튜디오 텍스트',
      fontFamily: "'Black Han Sans', sans-serif",
      fontSize: 68,
      textColor: '#ffffff',
      strokeWidth: 6,
      strokeColor: '#000000',
      hasShadow: true,
      x: 100,
      y: 200,
      width: 480,
      height: 90,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    state.layers.push(newTextLayer);
    selectLayer(newTextLayer.id);
    pushHistory();
    showToast('텍스트가 추가되었습니다.');
  });

  toolAddRect.addEventListener('click', () => {
    const newRectLayer = {
      id: 'layer_' + Date.now(),
      type: 'rect',
      name: '사각형 박스',
      fillColor: '#3b82f6',
      x: 150,
      y: 150,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 0.9,
      visible: true,
      locked: false
    };
    state.layers.push(newRectLayer);
    selectLayer(newRectLayer.id);
    pushHistory();
    showToast('사각형이 추가되었습니다.');
  });

  toolAddCircle.addEventListener('click', () => {
    const newCircleLayer = {
      id: 'layer_' + Date.now(),
      type: 'circle',
      name: '원형 배지',
      fillColor: '#ef4444',
      x: 200,
      y: 200,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 0.9,
      visible: true,
      locked: false
    };
    state.layers.push(newCircleLayer);
    selectLayer(newCircleLayer.id);
    pushHistory();
    showToast('원형이 추가되었습니다.');
  });

  toolAddSticker.addEventListener('click', () => {
    const emojis = ['🔥', '👑', '⭐', '💥', '🚀', '🎬', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const newSticker = {
      id: 'layer_' + Date.now(),
      type: 'sticker',
      name: `스티커 (${randomEmoji})`,
      text: randomEmoji,
      fontSize: 120,
      x: 300,
      y: 200,
      width: 140,
      height: 140,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };
    state.layers.push(newSticker);
    selectLayer(newSticker.id);
    pushHistory();
    showToast('스티커가 추가되었습니다.');
  });

  addImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const targetWidth = Math.min(600, img.width);
        const targetHeight = Math.round(targetWidth / aspect);

        const newImageLayer = {
          id: 'layer_' + Date.now(),
          type: 'image',
          name: file.name.slice(0, 15),
          dataUrl: dataUrl,
          _imgEl: img,
          x: Math.round((state.canvasWidth - targetWidth) / 2),
          y: Math.round((state.canvasHeight - targetHeight) / 2),
          width: targetWidth,
          height: targetHeight,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false
        };
        state.layers.push(newImageLayer);
        selectLayer(newImageLayer.id);
        pushHistory();
        showToast('이미지가 추가되었습니다.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    addImageInput.value = '';
  });

  toolBgColor.addEventListener('click', () => {
    const colors = ['#0f172a', '#1e293b', '#000000', '#ffffff', '#e11d48', '#2563eb', '#10b981'];
    const nextColor = colors[(colors.indexOf(state.bgColor) + 1) % colors.length] || colors[0];
    state.bgColor = nextColor;
    renderCanvas();
    pushHistory();
    showToast(`배경색 변경: ${nextColor}`);
  });

  // ==========================================================================
  // 우측 사이드바: 레이어 목록 렌더링
  // ==========================================================================
  function renderLayersList() {
    layerItemsContainer.innerHTML = '';
    layerCountBadge.textContent = state.layers.length;

    // 맨 위 레이어가 리스트의 가장 위에 오도록 역순 반복
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      const item = document.createElement('div');
      item.className = `layer-item ${layer.id === state.selectedId ? 'active' : ''}`;

      const iconMap = { text: '🔤', image: '🖼️', rect: '⬛', circle: '⚪', sticker: '⭐' };
      item.innerHTML = `
        <span class="layer-icon">${iconMap[layer.type] || '📄'}</span>
        <span class="layer-name" title="${layer.name}">${layer.name}</span>
        <div class="layer-item-actions">
          <button type="button" class="layer-mini-btn btn-vis" title="보이기/숨기기">
            ${layer.visible ? '👁️' : '🙈'}
          </button>
          <button type="button" class="layer-mini-btn btn-del" title="삭제">✕</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.layer-mini-btn')) return;
        selectLayer(layer.id);
      });

      const visBtn = item.querySelector('.btn-vis');
      visBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        renderCanvas();
        renderLayersList();
        pushHistory();
      });

      const delBtn = item.querySelector('.btn-del');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.layers = state.layers.filter(l => l.id !== layer.id);
        if (state.selectedId === layer.id) selectLayer(null);
        renderCanvas();
        renderLayersList();
        pushHistory();
      });

      layerItemsContainer.appendChild(item);
    }
  }

  moveLayerUpBtn.addEventListener('click', () => {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx !== -1 && idx < state.layers.length - 1) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx + 1];
      state.layers[idx + 1] = temp;
      renderCanvas();
      renderLayersList();
      pushHistory();
    }
  });

  moveLayerDownBtn.addEventListener('click', () => {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx > 0) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx - 1];
      state.layers[idx - 1] = temp;
      renderCanvas();
      renderLayersList();
      pushHistory();
    }
  });

  // 패널 탭 전환 (속성 vs 레이어)
  tabPropsBtn.addEventListener('click', () => {
    tabPropsBtn.classList.add('active');
    tabLayersBtn.classList.remove('active');
    panelProperties.classList.add('active');
    panelLayers.classList.remove('active');
  });

  tabLayersBtn.addEventListener('click', () => {
    tabLayersBtn.classList.add('active');
    tabPropsBtn.classList.remove('active');
    panelLayers.classList.add('active');
    panelProperties.classList.remove('active');
  });

  // ==========================================================================
  // 프리셋 및 줌 버튼
  // ==========================================================================
  presetSelect.addEventListener('change', () => {
    const val = presetSelect.value;
    if (val === 'custom') return;
    const [w, h] = val.split('x').map(Number);
    state.canvasWidth = w;
    state.canvasHeight = h;
    canvas.width = w;
    canvas.height = h;
    updateCanvasDimLabel();
    fitToScreen();
    renderCanvas();
    pushHistory();
    showToast(`캔버스 규격: ${w} × ${h}`);
  });

  zoomInBtn.addEventListener('click', () => setZoom(state.zoom + 0.15));
  zoomOutBtn.addEventListener('click', () => setZoom(state.zoom - 0.15));
  zoomFitBtn.addEventListener('click', () => fitToScreen());

  // ==========================================================================
  // 💾 프로젝트 저장 & 📁 프로젝트 불러오기 (필수 스펙)
  // ==========================================================================
  saveProjectBtn.addEventListener('click', () => {
    // 순수 JSON 구조체 생성
    const projectData = {
      version: '1.0',
      type: 'goongdi-image-project',
      savedAt: new Date().toISOString(),
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      bgColor: state.bgColor,
      layers: state.layers.map(l => {
        const copy = { ...l };
        delete copy._imgEl; // DOM 객체 제거 후 순수 데이터만 직렬화
        return copy;
      })
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `궁디_이미지프로젝트_${Date.now()}.gdp-image`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('프로젝트가 .gdp-image 파일로 저장되었습니다!');
  });

  loadProjectInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.type !== 'goongdi-image-project' && !data.layers) {
          throw new Error('올바른 궁디 이미지 프로젝트 파일이 아닙니다.');
        }

        restoreSnapshot(JSON.stringify(data));
        fitToScreen();
        showToast('프로젝트를 성공적으로 불러왔습니다!');
      } catch (err) {
        alert('프로젝트 파일을 불러오는 데 실패했습니다: ' + err.message);
      }
    };
    reader.readAsText(file);
    loadProjectInput.value = '';
  });

  // ==========================================================================
  // 이미지 내보내기 (PNG / JPG / WebP)
  // ==========================================================================
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });

  window.addEventListener('click', () => {
    if (exportMenu) exportMenu.classList.remove('open');
  });

  document.querySelectorAll('.export-menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format');
      selectLayer(null); // 테두리 감추기

      // 비동기 살짝 대기 후 내보내기
      setTimeout(() => {
        const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const ext = format === 'jpeg' ? 'jpg' : format;
        const dataUrl = canvas.toDataURL(mime, 0.95);

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `궁디스튜디오_아웃풋_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`${ext.toUpperCase()} 이미지로 저장되었습니다!`);
      }, 50);
    });
  });

  // ==========================================================================
  // 초기 데모 데이터 로드
  // ==========================================================================
  function initDemoProject() {
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;
    updateCanvasDimLabel();

    // 초기 데모 레이어: 멋진 유튜브 썸네일 스타일
    state.layers = [
      {
        id: 'layer_bg_accent',
        type: 'rect',
        name: '배경 그라데이션 박스',
        fillColor: '#1e3a8a',
        x: 60,
        y: 60,
        width: 1160,
        height: 600,
        rotation: 0,
        opacity: 0.8,
        visible: true,
        locked: false
      },
      {
        id: 'layer_title',
        type: 'text',
        name: '메인 헤드라인',
        text: '궁디 스튜디오 대공개!',
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 84,
        textColor: '#fbbf24',
        strokeWidth: 8,
        strokeColor: '#000000',
        hasShadow: true,
        x: 120,
        y: 180,
        width: 800,
        height: 110,
        rotation: -2,
        opacity: 1,
        visible: true,
        locked: false
      },
      {
        id: 'layer_subtitle',
        type: 'text',
        name: '서브 카피',
        text: '프로를 위한 올인원 웹 크리에이티브',
        fontFamily: "'Pretendard', sans-serif",
        fontSize: 44,
        textColor: '#ffffff',
        strokeWidth: 4,
        strokeColor: '#111827',
        hasShadow: true,
        x: 130,
        y: 320,
        width: 700,
        height: 60,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false
      },
      {
        id: 'layer_badge',
        type: 'sticker',
        name: '불꽃 스티커',
        text: '🔥',
        fontSize: 160,
        x: 950,
        y: 340,
        width: 180,
        height: 180,
        rotation: 12,
        opacity: 1,
        visible: true,
        locked: false
      }
    ];

    selectLayer('layer_title');
    pushHistory();
    fitToScreen();
  }

  // 실행
  initDemoProject();
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
})();
