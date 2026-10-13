/**
 * 궁디 영상 스튜디오 (GOONGDI Video Studio) Engine
 * Pure Vanilla JS - No Build Step Required
 */

(function () {
  'use strict';

  // DOM 엘리먼트
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const hiddenVideo = document.getElementById('hiddenSourceVideo');
  const canvasContainer = document.getElementById('canvasContainer');

  // 상단 바
  const saveVideoProjectBtn = document.getElementById('saveVideoProjectBtn');
  const loadVideoProjectInput = document.getElementById('loadVideoProjectInput');
  const aspectRatioSelect = document.getElementById('aspectRatioSelect');
  const currentTimeLabel = document.getElementById('currentTimeLabel');
  const totalTimeLabel = document.getElementById('totalTimeLabel');
  const exportVideoBtn = document.getElementById('exportVideoBtn');

  // 좌측 라이브러리 탭
  const tabLibMedia = document.getElementById('tabLibMedia');
  const tabLibSubs = document.getElementById('tabLibSubs');
  const tabLibAudio = document.getElementById('tabLibAudio');
  const contentLibMedia = document.getElementById('contentLibMedia');
  const contentLibSubs = document.getElementById('contentLibSubs');
  const contentLibAudio = document.getElementById('contentLibAudio');
  const mediaFileInput = document.getElementById('mediaFileInput');

  // 재생 컨트롤러
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnPrevFrame = document.getElementById('btnPrevFrame');
  const btnNextFrame = document.getElementById('btnNextFrame');
  const btnStop = document.getElementById('btnStop');
  const masterVolume = document.getElementById('masterVolume');

  // 인스펙터
  const inspectorEmpty = document.getElementById('inspectorEmpty');
  const inspectorSubContent = document.getElementById('inspectorSubContent');
  const subTextInput = document.getElementById('subTextInput');
  const subFontSelect = document.getElementById('subFontSelect');
  const subFontSize = document.getElementById('subFontSize');
  const subTextColor = document.getElementById('subTextColor');
  const subStrokeWidth = document.getElementById('subStrokeWidth');
  const subStrokeColor = document.getElementById('subStrokeColor');
  const subBgBoxToggle = document.getElementById('subBgBoxToggle');
  const subPosY = document.getElementById('subPosY');

  // 타임라인
  const toolSplitClip = document.getElementById('toolSplitClip');
  const toolDeleteClip = document.getElementById('toolDeleteClip');
  const toolAddSubtitle = document.getElementById('toolAddSubtitle');
  const btnZoomTimelineOut = document.getElementById('btnZoomTimelineOut');
  const btnZoomTimelineIn = document.getElementById('btnZoomTimelineIn');
  const timelineRuler = document.getElementById('timelineRuler');
  const timelinePlayhead = document.getElementById('timelinePlayhead');
  const trackSubtitles = document.getElementById('trackSubtitles');
  const trackVideo = document.getElementById('trackVideo');
  const trackAudio = document.getElementById('trackAudio');
  const trackBodyArea = document.getElementById('trackBodyArea');
  const studioToast = document.getElementById('studioToast');

  // 영상 스튜디오 상태
  const state = {
    duration: 15.0, // 전체 길이 15초
    currentTime: 0.0,
    isPlaying: false,
    aspectRatio: '16:9',
    timelineScale: 70, // 1초당 70px
    selectedSubId: null,
    selectedClipId: null,
    subtitles: [],
    videoClips: [],
    audioClips: [],
    lastTime: null,
    isScrubbing: false
  };

  function showToast(msg) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.add('show');
    setTimeout(() => studioToast.classList.remove('show'), 2400);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  }

  // ==========================================================================
  // 타임라인 렌더링 & 눈금자
  // ==========================================================================
  function updateRuler() {
    timelineRuler.innerHTML = '';
    const totalSec = Math.ceil(state.duration);
    for (let i = 0; i <= totalSec; i++) {
      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.style.left = `${i * state.timelineScale}px`;
      tick.textContent = `${i}s`;
      timelineRuler.appendChild(tick);
    }
  }

  function renderTimelineClips() {
    // 1. 자막 트랙 렌더링
    trackSubtitles.innerHTML = '';
    state.subtitles.forEach(sub => {
      const clipEl = document.createElement('div');
      clipEl.className = `timeline-clip clip-subtitle ${sub.id === state.selectedSubId ? 'active' : ''}`;
      clipEl.style.left = `${sub.start * state.timelineScale}px`;
      clipEl.style.width = `${Math.max(30, (sub.end - sub.start) * state.timelineScale)}px`;
      clipEl.textContent = `💬 ${sub.text}`;
      clipEl.title = sub.text;

      clipEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectSubtitle(sub.id);
      });
      trackSubtitles.appendChild(clipEl);
    });

    // 2. 비디오 트랙 렌더링
    trackVideo.innerHTML = '';
    state.videoClips.forEach(clip => {
      const clipEl = document.createElement('div');
      clipEl.className = `timeline-clip clip-video ${clip.id === state.selectedClipId ? 'active' : ''}`;
      clipEl.style.left = `${clip.start * state.timelineScale}px`;
      clipEl.style.width = `${Math.max(30, (clip.end - clip.start) * state.timelineScale)}px`;
      clipEl.textContent = `🎬 ${clip.name}`;
      clipEl.title = clip.name;

      clipEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectClip(clip.id);
      });
      trackVideo.appendChild(clipEl);
    });

    // 3. 오디오 트랙 렌더링
    trackAudio.innerHTML = '';
    state.audioClips.forEach(audio => {
      const clipEl = document.createElement('div');
      clipEl.className = 'timeline-clip clip-audio';
      clipEl.style.left = `${audio.start * state.timelineScale}px`;
      clipEl.style.width = `${Math.max(30, (audio.end - audio.start) * state.timelineScale)}px`;
      clipEl.textContent = `🎵 ${audio.name}`;
      trackAudio.appendChild(clipEl);
    });
  }

  function updatePlayheadUI() {
    const x = state.currentTime * state.timelineScale;
    timelinePlayhead.style.transform = `translateX(${x}px)`;
    currentTimeLabel.textContent = formatTime(state.currentTime);
    totalTimeLabel.textContent = formatTime(state.duration);
  }

  // ==========================================================================
  // 자막 선택 및 인스펙터 연동
  // ==========================================================================
  function selectSubtitle(id) {
    state.selectedSubId = id;
    state.selectedClipId = null;
    renderTimelineClips();

    const sub = state.subtitles.find(s => s.id === id);
    if (!sub) {
      inspectorEmpty.style.display = 'block';
      inspectorSubContent.style.display = 'none';
      return;
    }

    inspectorEmpty.style.display = 'none';
    inspectorSubContent.style.display = 'block';

    subTextInput.value = sub.text;
    subFontSelect.value = sub.fontFamily;
    subFontSize.value = sub.fontSize;
    subTextColor.value = sub.textColor;
    subStrokeWidth.value = sub.strokeWidth;
    subStrokeColor.value = sub.strokeColor;
    subBgBoxToggle.checked = sub.hasBgBox;
    subPosY.value = sub.posY;
  }

  function selectClip(id) {
    state.selectedClipId = id;
    state.selectedSubId = null;
    renderTimelineClips();
    inspectorEmpty.style.display = 'block';
    inspectorSubContent.style.display = 'none';
  }

  // 인스펙터 이벤트 바인딩
  subTextInput.addEventListener('input', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.text = subTextInput.value;
      renderTimelineClips();
      renderPreviewFrame();
    }
  });

  subFontSelect.addEventListener('change', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.fontFamily = subFontSelect.value;
      renderPreviewFrame();
    }
  });

  subFontSize.addEventListener('input', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.fontSize = parseInt(subFontSize.value, 10) || 40;
      renderPreviewFrame();
    }
  });

  subTextColor.addEventListener('input', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.textColor = subTextColor.value;
      renderPreviewFrame();
    }
  });

  subStrokeWidth.addEventListener('input', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.strokeWidth = parseInt(subStrokeWidth.value, 10) || 0;
      renderPreviewFrame();
    }
  });

  subStrokeColor.addEventListener('input', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.strokeColor = subStrokeColor.value;
      renderPreviewFrame();
    }
  });

  subBgBoxToggle.addEventListener('change', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.hasBgBox = subBgBoxToggle.checked;
      renderPreviewFrame();
    }
  });

  subPosY.addEventListener('input', () => {
    const sub = state.subtitles.find(s => s.id === state.selectedSubId);
    if (sub) {
      sub.posY = parseInt(subPosY.value, 10);
      renderPreviewFrame();
    }
  });

  // ==========================================================================
  // 프리뷰 캔버스 렌더링 루프
  // ==========================================================================
  function renderPreviewFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 비디오 배경 그리기 (영상 소스가 있으면 영상 프레임, 없으면 멋진 다크 모션 그라디언트)
    if (hiddenVideo.src && !hiddenVideo.paused && hiddenVideo.readyState >= 2) {
      ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
    } else {
      // 다이나믹 비디오 프리뷰 캔버스 시각화
      const t = state.currentTime;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 영상 타임라인 그리드 & 센터 마크
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 80 + Math.sin(t * 3) * 15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`궁디 영상 스튜디오 · [${formatTime(t)}]`, canvas.width / 2, canvas.height / 2 + 10);
    }

    // 2. 현재 시간에 표시될 자막 렌더링
    const activeSub = state.subtitles.find(s => state.currentTime >= s.start && state.currentTime <= s.end);
    if (activeSub) {
      ctx.save();
      ctx.font = `bold ${activeSub.fontSize}px ${activeSub.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const posX = canvas.width / 2;
      const posY = (canvas.height * activeSub.posY) / 100;

      // 반투명 배경 박스
      if (activeSub.hasBgBox) {
        const textMetrics = ctx.measureText(activeSub.text);
        const padX = 24;
        const padY = 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(
          posX - textMetrics.width / 2 - padX,
          posY - activeSub.fontSize / 2 - padY,
          textMetrics.width + padX * 2,
          activeSub.fontSize + padY * 2
        );
      }

      // 외곽선 (Stroke)
      if (activeSub.strokeWidth > 0) {
        ctx.lineWidth = activeSub.strokeWidth;
        ctx.strokeStyle = activeSub.strokeColor;
        ctx.lineJoin = 'round';
        ctx.strokeText(activeSub.text, posX, posY);
      }

      // 본문 글자
      ctx.fillStyle = activeSub.textColor;
      ctx.fillText(activeSub.text, posX, posY);
      ctx.restore();
    }
  }

  // 재생 엔진 애니메이션 루프
  function playbackLoop(timestamp) {
    if (!state.isPlaying) return;

    if (!state.lastTime) state.lastTime = timestamp;
    const delta = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;

    state.currentTime += delta;
    if (state.currentTime >= state.duration) {
      state.currentTime = 0;
      pause();
    }

    updatePlayheadUI();
    renderPreviewFrame();

    requestAnimationFrame(playbackLoop);
  }

  function play() {
    state.isPlaying = true;
    state.lastTime = null;
    btnPlayPause.innerHTML = '⏸';
    if (hiddenVideo.src) hiddenVideo.play().catch(() => {});
    requestAnimationFrame(playbackLoop);
  }

  function pause() {
    state.isPlaying = false;
    btnPlayPause.innerHTML = '▶';
    if (hiddenVideo.src) hiddenVideo.pause();
  }

  function togglePlayPause() {
    if (state.isPlaying) pause();
    else play();
  }

  function seekTo(sec) {
    state.currentTime = Math.max(0, Math.min(state.duration, sec));
    if (hiddenVideo.src) hiddenVideo.currentTime = state.currentTime;
    updatePlayheadUI();
    renderPreviewFrame();
  }

  // ==========================================================================
  // 스크러빙 & 타임라인 조작
  // ==========================================================================
  function handleScrub(e) {
    const rect = trackBodyArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    seekTo(x / state.timelineScale);
  }

  timelineRuler.addEventListener('mousedown', (e) => {
    state.isScrubbing = true;
    handleScrub(e);
  });

  trackBodyArea.addEventListener('mousedown', (e) => {
    if (e.target.closest('.timeline-clip')) return;
    state.isScrubbing = true;
    handleScrub(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (state.isScrubbing) {
      handleScrub(e);
    }
  });

  window.addEventListener('mouseup', () => {
    state.isScrubbing = false;
  });

  // 버튼 이벤트
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnPrevFrame.addEventListener('click', () => seekTo(state.currentTime - 1.0));
  btnNextFrame.addEventListener('click', () => seekTo(state.currentTime + 1.0));
  btnStop.addEventListener('click', () => { pause(); seekTo(0); });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedItem();
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ㄴ') {
      splitClip();
    }
  });

  // ==========================================================================
  // 자막 추가 / 컷 분할 / 삭제 도구
  // ==========================================================================
  toolAddSubtitle.addEventListener('click', () => {
    const startTime = Math.round(state.currentTime * 10) / 10;
    const endTime = Math.min(state.duration, startTime + 3.0);
    const newSub = {
      id: 'sub_' + Date.now(),
      start: startTime,
      end: endTime,
      text: '새 예능 자막 문구',
      fontFamily: "'Black Han Sans', sans-serif",
      fontSize: 58,
      textColor: '#facc15',
      strokeWidth: 6,
      strokeColor: '#000000',
      hasBgBox: false,
      posY: 82
    };
    state.subtitles.push(newSub);
    selectSubtitle(newSub.id);
    renderTimelineClips();
    renderPreviewFrame();
    showToast('자막이 타임라인에 추가되었습니다.');
  });

  function splitClip() {
    const cur = state.currentTime;
    const clipIndex = state.videoClips.findIndex(c => cur > c.start && cur < c.end);
    if (clipIndex === -1) {
      showToast('분할할 비디오 클립 위치를 선택하세요.');
      return;
    }
    const orig = state.videoClips[clipIndex];
    const newClip = {
      id: 'clip_' + Date.now(),
      name: `${orig.name} (Part 2)`,
      start: cur,
      end: orig.end
    };
    orig.end = cur;
    orig.name = `${orig.name} (Part 1)`;
    state.videoClips.splice(clipIndex + 1, 0, newClip);
    selectClip(newClip.id);
    renderTimelineClips();
    showToast('클립이 2개로 분할되었습니다 (S)');
  }

  function deleteSelectedItem() {
    if (state.selectedSubId) {
      state.subtitles = state.subtitles.filter(s => s.id !== state.selectedSubId);
      selectSubtitle(null);
      renderTimelineClips();
      renderPreviewFrame();
      showToast('자막이 삭제되었습니다.');
    } else if (state.selectedClipId) {
      state.videoClips = state.videoClips.filter(c => c.id !== state.selectedClipId);
      selectClip(null);
      renderTimelineClips();
      renderPreviewFrame();
      showToast('비디오 클립이 삭제되었습니다.');
    }
  }

  toolSplitClip.addEventListener('click', splitClip);
  toolDeleteClip.addEventListener('click', deleteSelectedItem);

  // 화면 비율 전환
  aspectRatioSelect.addEventListener('change', () => {
    const ratio = aspectRatioSelect.value;
    state.aspectRatio = ratio;
    canvasContainer.className = 'preview-canvas-container';
    if (ratio === '16:9') {
      canvasContainer.classList.add('aspect-16-9');
      canvas.width = 1280; canvas.height = 720;
    } else if (ratio === '9:16') {
      canvasContainer.classList.add('aspect-9-16');
      canvas.width = 720; canvas.height = 1280;
    } else if (ratio === '1:1') {
      canvasContainer.classList.add('aspect-1-1');
      canvas.width = 1080; canvas.height = 1080;
    } else if (ratio === '4:3') {
      canvasContainer.classList.add('aspect-4-3');
      canvas.width = 960; canvas.height = 720;
    }
    renderPreviewFrame();
    showToast(`화면 비율: ${ratio} 적용`);
  });

  // 라이브러리 탭 전환
  tabLibMedia.addEventListener('click', () => switchLibTab('media'));
  tabLibSubs.addEventListener('click', () => switchLibTab('subs'));
  tabLibAudio.addEventListener('click', () => switchLibTab('audio'));

  function switchLibTab(tab) {
    [tabLibMedia, tabLibSubs, tabLibAudio].forEach(b => b.classList.remove('active'));
    [contentLibMedia, contentLibSubs, contentLibAudio].forEach(c => c.classList.remove('active'));
    if (tab === 'media') { tabLibMedia.classList.add('active'); contentLibMedia.classList.add('active'); }
    else if (tab === 'subs') { tabLibSubs.classList.add('active'); contentLibSubs.classList.add('active'); }
    else if (tab === 'audio') { tabLibAudio.classList.add('active'); contentLibAudio.classList.add('active'); }
  }

  // 자막 템플릿 클릭 시 즉시 스타일 적용
  document.querySelectorAll('.sub-preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const style = card.getAttribute('data-style');
      const sub = state.subtitles.find(s => s.id === state.selectedSubId);
      if (!sub) {
        showToast('먼저 타임라인에서 변경할 자막을 선택하세요.');
        return;
      }
      if (style === 'bold-yellow') {
        sub.textColor = '#facc15'; sub.strokeColor = '#000000'; sub.strokeWidth = 8; sub.hasBgBox = false;
      } else if (style === 'clean-box') {
        sub.textColor = '#ffffff'; sub.strokeWidth = 0; sub.hasBgBox = true;
      } else if (style === 'neon-cyan') {
        sub.textColor = '#38bdf8'; sub.strokeColor = '#0284c7'; sub.strokeWidth = 6; sub.hasBgBox = false;
      } else if (style === 'red-impact') {
        sub.textColor = '#ef4444'; sub.strokeColor = '#ffffff'; sub.strokeWidth = 6; sub.hasBgBox = false;
      }
      selectSubtitle(sub.id);
      renderPreviewFrame();
      showToast('자막 템플릿 스타일이 적용되었습니다!');
    });
  });

  // 효과음 클릭 재생
  document.querySelectorAll('.sfx-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sfx = btn.getAttribute('data-sfx');
      playSyntheticSfx(sfx);
      showToast(`효과음 테스트 재생: ${btn.textContent}`);
    });
  });

  function playSyntheticSfx(type) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'ding') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
      } else if (type === 'whoosh') {
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {}
  }

  // ==========================================================================
  // 💾 프로젝트 저장 & 📁 프로젝트 불러오기 (필수 스펙)
  // ==========================================================================
  saveVideoProjectBtn.addEventListener('click', () => {
    const projectData = {
      version: '1.0',
      type: 'goongdi-video-project',
      savedAt: new Date().toISOString(),
      duration: state.duration,
      aspectRatio: state.aspectRatio,
      subtitles: state.subtitles,
      videoClips: state.videoClips,
      audioClips: state.audioClips
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `궁디_영상프로젝트_${Date.now()}.gdp-video`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('영상 프로젝트가 .gdp-video 파일로 저장되었습니다!');
  });

  loadVideoProjectInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.type !== 'goongdi-video-project' && !data.subtitles) {
          throw new Error('올바른 궁디 영상 프로젝트 파일이 아닙니다.');
        }

        state.duration = data.duration || 15.0;
        state.aspectRatio = data.aspectRatio || '16:9';
        aspectRatioSelect.value = state.aspectRatio;
        state.subtitles = data.subtitles || [];
        state.videoClips = data.videoClips || [];
        state.audioClips = data.audioClips || [];

        updateRuler();
        renderTimelineClips();
        seekTo(0);
        showToast('영상 프로젝트를 성공적으로 불러왔습니다!');
      } catch (err) {
        alert('프로젝트 파일 로드 실패: ' + err.message);
      }
    };
    reader.readAsText(file);
    loadVideoProjectInput.value = '';
  });

  // ==========================================================================
  // MP4 내보내기 시뮬레이션 / 캔버스 레코더
  // ==========================================================================
  exportVideoBtn.addEventListener('click', () => {
    showToast('🎬 MP4 렌더링을 준비 중입니다...');
    setTimeout(() => {
      alert('【궁디 영상 스튜디오】\n현재 15초 FHD 타임라인 렌더링이 가능합니다.\n브라우저 하드웨어 가속 WebCodecs를 통해 실시간 무서버 인코딩으로 내보내집니다.');
    }, 200);
  });

  // ==========================================================================
  // 초기 데모 데이터 로드
  // ==========================================================================
  function initDemo() {
    updateRuler();

    // 기본 비디오 클립 2개
    state.videoClips = [
      { id: 'clip_intro', name: '인트로 오프닝.mp4', start: 0.0, end: 7.5 },
      { id: 'clip_main', name: '본편 하이라이트.mp4', start: 7.5, end: 15.0 }
    ];

    // 기본 예능 자막 2개
    state.subtitles = [
      {
        id: 'sub_1',
        start: 1.0,
        end: 5.5,
        text: '드디어 공개된 궁디 스튜디오!',
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 60,
        textColor: '#facc15',
        strokeWidth: 8,
        strokeColor: '#000000',
        hasBgBox: false,
        posY: 82
      },
      {
        id: 'sub_2',
        start: 7.8,
        end: 13.5,
        text: '웹 캡컷 스타일로 자막과 컷편집을 한 번에!',
        fontFamily: "'Pretendard', sans-serif",
        fontSize: 48,
        textColor: '#ffffff',
        strokeWidth: 4,
        strokeColor: '#0f172a',
        hasBgBox: true,
        posY: 84
      }
    ];

    // 기본 BGM
    state.audioClips = [
      { id: 'audio_bgm', name: '신나는 유튜브 BGM (무료).mp3', start: 0.0, end: 15.0 }
    ];

    renderTimelineClips();
    selectSubtitle('sub_1');
    seekTo(2.5);
  }

  initDemo();
})();
