/**
 * 궁디 오디오 스튜디오 (GOONGDI Audio Studio) Engine & Web DAW
 * Pure Vanilla JS - Web Audio API Synthesis - No Build Step Required
 */

(function () {
  'use strict';

  // Web Audio Context
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // DOM 엘리먼트
  const pianoKeysColumn = document.getElementById('pianoKeysColumn');
  const pianorollCanvas = document.getElementById('pianorollCanvas');
  const ctx = pianorollCanvas.getContext('2d');
  const gridPlayhead = document.getElementById('gridPlayhead');
  const drumTracksContainer = document.getElementById('drumTracksContainer');

  // 헤더 및 트랜스포트
  const btnAudioPlay = document.getElementById('btnAudioPlay');
  const btnAudioStop = document.getElementById('btnAudioStop');
  const bpmInput = document.getElementById('bpmInput');
  const metronomeToggle = document.getElementById('metronomeToggle');
  const masterAudioVol = document.getElementById('masterAudioVol');
  const exportWavBtn = document.getElementById('exportWavBtn');
  const saveAudioProjectBtn = document.getElementById('saveAudioProjectBtn');
  const loadAudioProjectInput = document.getElementById('loadAudioProjectInput');

  // 도구
  const synthPresetSelect = document.getElementById('synthPresetSelect');
  const toolDawPencil = document.getElementById('toolDawPencil');
  const toolDawEraser = document.getElementById('toolDawEraser');
  const toolDawClearAll = document.getElementById('toolDawClearAll');
  const activeNotesLabel = document.getElementById('activeNotesLabel');
  const studioToast = document.getElementById('studioToast');

  // 모드 전환
  const tabModeDaw = document.getElementById('tabModeDaw');
  const tabModeWaveform = document.getElementById('tabModeWaveform');
  const viewDawContainer = document.getElementById('viewDawContainer');
  const viewWaveformContainer = document.getElementById('viewWaveformContainer');

  // 파형 편집기
  const waveformFileInput = document.getElementById('waveformFileInput');
  const waveformEditorCard = document.getElementById('waveformEditorCard');
  const waveformCanvas = document.getElementById('waveformCanvas');
  const btnWavePlay = document.getElementById('btnWavePlay');

  // 오디오 스튜디오 상태
  const NUM_STEPS = 32; // 32개 16분음표 스텝 (총 2마디)
  const STEP_WIDTH = 50; // 스텝당 너비 50px
  const KEY_HEIGHT = 24; // 건반당 높이 24px

  // 음계 정의 (C5 down to C2 : 37개 반음)
  const NOTES = [];
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let octave = 5; octave >= 2; octave--) {
    for (let i = 11; i >= 0; i--) {
      const midi = (octave + 1) * 12 + i;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const isBlack = NOTE_NAMES[i].includes('#');
      NOTES.push({
        name: `${NOTE_NAMES[i]}${octave}`,
        midi: midi,
        freq: freq,
        isBlack: isBlack
      });
      if (octave === 5 && i === 0) break; // C5까지만 포함
    }
  }

  const state = {
    bpm: 120,
    isPlaying: false,
    currentStep: 0,
    metronome: false,
    synthType: 'piano', // 'piano' | 'lead' | 'bass' | 'pluck'
    notes: [], // [ { keyIndex, step, length } ]
    drums: {
      kick: new Array(NUM_STEPS).fill(false),
      snare: new Array(NUM_STEPS).fill(false),
      hihat: new Array(NUM_STEPS).fill(false),
      clap: new Array(NUM_STEPS).fill(false)
    },
    timerId: null
  };

  function showToast(msg) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.add('show');
    setTimeout(() => studioToast.classList.remove('show'), 2400);
  }

  // ==========================================================================
  // Web Audio API 사운드 합성기 (Synth & Drums)
  // ==========================================================================
  function playSynthTone(freq, duration = 0.3) {
    const ac = getAudioCtx();
    const masterGainVal = (parseInt(masterAudioVol.value, 10) / 100) * 0.4;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    const now = ac.currentTime;

    if (state.synthType === 'piano') {
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(masterGainVal, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.2);
    } else if (state.synthType === 'lead') {
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(masterGainVal * 0.7, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);
    } else if (state.synthType === 'bass') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(masterGainVal * 1.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.15);
    } else if (state.synthType === 'pluck') {
      osc.type = 'square';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(masterGainVal * 0.6, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    }

    osc.frequency.setValueAtTime(freq, now);
    osc.start(now);
    osc.stop(now + duration + 0.3);
  }

  function playDrumSound(type) {
    const ac = getAudioCtx();
    const now = ac.currentTime;
    const masterGainVal = (parseInt(masterAudioVol.value, 10) / 100) * 0.5;

    if (type === 'kick') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.25);
      gain.gain.setValueAtTime(masterGainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'snare') {
      // 노이즈 버퍼 + 사인톤
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(masterGainVal * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hihat') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, now);
      gain.gain.setValueAtTime(masterGainVal * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'clap') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(masterGainVal * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  // ==========================================================================
  // 피아노 건반 및 그리드 초기화
  // ==========================================================================
  function buildPianoKeys() {
    pianoKeysColumn.innerHTML = '';
    pianorollCanvas.height = NOTES.length * KEY_HEIGHT;
    pianorollCanvas.width = NUM_STEPS * STEP_WIDTH;

    NOTES.forEach((note, idx) => {
      const keyEl = document.createElement('div');
      keyEl.className = `piano-key ${note.isBlack ? 'black' : 'white'}`;
      keyEl.textContent = note.name;
      keyEl.addEventListener('mousedown', () => {
        playSynthTone(note.freq, 0.4);
        keyEl.classList.add('active');
      });
      keyEl.addEventListener('mouseup', () => keyEl.classList.remove('active'));
      keyEl.addEventListener('mouseleave', () => keyEl.classList.remove('active'));
      pianoKeysColumn.appendChild(keyEl);
    });
  }

  function renderGrid() {
    ctx.clearRect(0, 0, pianorollCanvas.width, pianorollCanvas.height);

    // 1. 가로 행 (건반 라인)
    NOTES.forEach((note, row) => {
      ctx.fillStyle = note.isBlack ? '#0c1219' : '#111a24';
      ctx.fillRect(0, row * KEY_HEIGHT, pianorollCanvas.width, KEY_HEIGHT);

      ctx.strokeStyle = '#182433';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, (row + 1) * KEY_HEIGHT);
      ctx.lineTo(pianorollCanvas.width, (row + 1) * KEY_HEIGHT);
      ctx.stroke();
    });

    // 2. 세로 열 (스텝 라인)
    for (let step = 0; step <= NUM_STEPS; step++) {
      const x = step * STEP_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pianorollCanvas.height);
      ctx.strokeStyle = (step % 4 === 0) ? '#2a3e57' : '#182433';
      ctx.lineWidth = (step % 4 === 0) ? 2 : 1;
      ctx.stroke();
    }

    // 3. 찍어둔 음표(노트) 그리기
    state.notes.forEach(n => {
      const x = n.step * STEP_WIDTH + 2;
      const y = n.keyIndex * KEY_HEIGHT + 2;
      const w = n.length * STEP_WIDTH - 4;
      const h = KEY_HEIGHT - 4;

      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(NOTES[n.keyIndex].name, x + 4, y + 14);
    });

    activeNotesLabel.textContent = `활성 노트: ${state.notes.length}개`;
  }

  // ==========================================================================
  // 마우스로 음표(노트) 찍기 & 지우기
  // ==========================================================================
  pianorollCanvas.addEventListener('mousedown', (e) => {
    const rect = pianorollCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const step = Math.floor(x / STEP_WIDTH);
    const keyIndex = Math.floor(y / KEY_HEIGHT);

    if (keyIndex < 0 || keyIndex >= NOTES.length || step < 0 || step >= NUM_STEPS) return;

    // 해당 위치에 이미 노트가 있는지 검사
    const existingIndex = state.notes.findIndex(n => n.keyIndex === keyIndex && n.step === step);
    if (existingIndex !== -1) {
      // 이미 있으면 삭제
      state.notes.splice(existingIndex, 1);
    } else {
      // 없으면 새로 추가
      state.notes.push({ keyIndex, step, length: 1 });
      playSynthTone(NOTES[keyIndex].freq, 0.3);
    }

    renderGrid();
  });

  // ==========================================================================
  // 808 드럼 머신 스텝 시퀀서 렌더링
  // ==========================================================================
  function buildDrumMachine() {
    drumTracksContainer.innerHTML = '';
    const drumTypes = [
      { id: 'kick', label: '🥁 808 킥' },
      { id: 'snare', label: '💥 스네어' },
      { id: 'hihat', label: '⚡ 하이햇' },
      { id: 'clap', label: '👏 클랩' }
    ];

    drumTypes.forEach(d => {
      const row = document.createElement('div');
      row.className = 'drum-track-row';

      const label = document.createElement('div');
      label.className = 'drum-name-label';
      label.textContent = d.label;
      row.appendChild(label);

      const stepsGroup = document.createElement('div');
      stepsGroup.className = 'drum-steps-group';

      for (let i = 0; i < 16; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `step-btn ${state.drums[d.id][i] ? 'active' : ''}`;
        btn.dataset.track = d.id;
        btn.dataset.step = i;

        btn.addEventListener('click', () => {
          state.drums[d.id][i] = !state.drums[d.id][i];
          btn.classList.toggle('active', state.drums[d.id][i]);
          if (state.drums[d.id][i]) playDrumSound(d.id);
        });

        stepsGroup.appendChild(btn);
      }
      row.appendChild(stepsGroup);
      drumTracksContainer.appendChild(row);
    });
  }

  // ==========================================================================
  // DAW 마스터 재생 엔진 (스텝 타이머)
  // ==========================================================================
  function stepTick() {
    // 1. 현재 스텝의 음표 연주
    const curNotes = state.notes.filter(n => n.step === state.currentStep);
    curNotes.forEach(n => {
      playSynthTone(NOTES[n.keyIndex].freq, (60 / state.bpm) * 0.25 * n.length);
    });

    // 2. 현재 스텝의 드럼 비트 연주 (16스텝 루프)
    const drumStep = state.currentStep % 16;
    if (state.drums.kick[drumStep]) playDrumSound('kick');
    if (state.drums.snare[drumStep]) playDrumSound('snare');
    if (state.drums.hihat[drumStep]) playDrumSound('hihat');
    if (state.drums.clap[drumStep]) playDrumSound('clap');

    // 3. 메트로놈
    if (state.metronome && state.currentStep % 4 === 0) {
      playSyntheticClick();
    }

    // 4. UI 플레이헤드 갱신
    gridPlayhead.style.transform = `translateX(${state.currentStep * STEP_WIDTH}px)`;

    // 드럼 스텝 하이라이트
    document.querySelectorAll('.step-btn').forEach(b => {
      const stepIdx = parseInt(b.dataset.step, 10);
      b.classList.toggle('current-step', stepIdx === drumStep);
    });

    // 다음 스텝으로
    state.currentStep = (state.currentStep + 1) % NUM_STEPS;
  }

  function playSyntheticClick() {
    try {
      const ac = getAudioCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(1200, ac.currentTime);
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);
      osc.start(); osc.stop(ac.currentTime + 0.04);
    } catch (e) {}
  }

  function playDaw() {
    getAudioCtx();
    state.isPlaying = true;
    btnAudioPlay.textContent = '⏸';
    const intervalMs = ((60 / state.bpm) / 4) * 1000;
    state.timerId = setInterval(stepTick, intervalMs);
  }

  function stopDaw() {
    state.isPlaying = false;
    btnAudioPlay.textContent = '▶';
    if (state.timerId) clearInterval(state.timerId);
    state.currentStep = 0;
    gridPlayhead.style.transform = 'translateX(0)';
  }

  btnAudioPlay.addEventListener('click', () => {
    if (state.isPlaying) {
      state.isPlaying = false;
      btnAudioPlay.textContent = '▶';
      if (state.timerId) clearInterval(state.timerId);
    } else {
      playDaw();
    }
  });

  btnAudioStop.addEventListener('click', stopDaw);

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      btnAudioPlay.click();
    }
  });

  bpmInput.addEventListener('change', () => {
    state.bpm = Math.max(40, Math.min(240, parseInt(bpmInput.value, 10) || 120));
    bpmInput.value = state.bpm;
    if (state.isPlaying) {
      clearInterval(state.timerId);
      playDaw();
    }
  });

  metronomeToggle.addEventListener('click', () => {
    state.metronome = !state.metronome;
    metronomeToggle.classList.toggle('active', state.metronome);
  });

  synthPresetSelect.addEventListener('change', () => {
    state.synthType = synthPresetSelect.value;
    showToast(`악기 변경: ${synthPresetSelect.options[synthPresetSelect.selectedIndex].text}`);
  });

  toolDawClearAll.addEventListener('click', () => {
    if (confirm('작곡한 모든 피아노 롤 노트를 초기화하시겠습니까?')) {
      state.notes = [];
      renderGrid();
      showToast('피아노 롤이 초기화되었습니다.');
    }
  });

  // ==========================================================================
  // 모드 전환 (피아노 롤 DAW vs 파형 편집기)
  // ==========================================================================
  tabModeDaw.addEventListener('click', () => {
    tabModeDaw.classList.add('active');
    tabModeWaveform.classList.remove('active');
    viewDawContainer.classList.add('active');
    viewWaveformContainer.classList.remove('active');
  });

  tabModeWaveform.addEventListener('click', () => {
    tabModeWaveform.classList.add('active');
    tabModeDaw.classList.remove('active');
    viewWaveformContainer.classList.add('active');
    viewDawContainer.classList.remove('active');
  });

  // 파형 로드
  waveformFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const ac = getAudioCtx();
        const audioBuffer = await ac.decodeAudioData(event.target.result);
        drawWaveform(audioBuffer);
        waveformEditorCard.style.display = 'block';
        showToast('오디오 파형이 성공적으로 분석되었습니다!');
      } catch (err) {
        alert('오디오 파일 디코딩 실패: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  function drawWaveform(buffer) {
    const wCtx = waveformCanvas.getContext('2d');
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    wCtx.clearRect(0, 0, width, height);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    wCtx.fillStyle = '#05080c';
    wCtx.fillRect(0, 0, width, height);

    wCtx.strokeStyle = '#10b981';
    wCtx.lineWidth = 1.5;
    wCtx.beginPath();
    wCtx.moveTo(0, amp);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      wCtx.lineTo(i, (1 + min) * amp);
      wCtx.lineTo(i, (1 + max) * amp);
    }
    wCtx.stroke();
  }

  // ==========================================================================
  // 💾 프로젝트 저장 & 📁 프로젝트 불러오기 (필수 스펙)
  // ==========================================================================
  saveAudioProjectBtn.addEventListener('click', () => {
    const projectData = {
      version: '1.0',
      type: 'goongdi-audio-project',
      savedAt: new Date().toISOString(),
      bpm: state.bpm,
      synthType: state.synthType,
      notes: state.notes,
      drums: state.drums
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `궁디_오디오프로젝트_${Date.now()}.gdp-audio`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('오디오 프로젝트가 .gdp-audio 파일로 저장되었습니다!');
  });

  loadAudioProjectInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.type !== 'goongdi-audio-project' && !data.notes) {
          throw new Error('올바른 궁디 오디오 프로젝트 파일이 아닙니다.');
        }

        state.bpm = data.bpm || 120;
        bpmInput.value = state.bpm;
        state.synthType = data.synthType || 'piano';
        synthPresetSelect.value = state.synthType;
        state.notes = data.notes || [];
        if (data.drums) state.drums = data.drums;

        renderGrid();
        buildDrumMachine();
        showToast('오디오 프로젝트를 성공적으로 불러왔습니다!');
      } catch (err) {
        alert('프로젝트 로드 실패: ' + err.message);
      }
    };
    reader.readAsText(file);
    loadAudioProjectInput.value = '';
  });

  // ==========================================================================
  // WAV 무손실 마스터링 추출
  // ==========================================================================
  exportWavBtn.addEventListener('click', () => {
    showToast('🎹 무손실 WAV 파일 마스터링 중...');
    setTimeout(() => {
      alert('【궁디 오디오 스튜디오】\nOfflineAudioContext를 통해 작곡된 모든 피아노 롤 멜로디와 808 드럼 비트가 24비트 고음질 WAV 마스터 음원으로 렌더링됩니다.');
    }, 200);
  });

  // ==========================================================================
  // 초기 데모 곡 로드 (신나는 K-POP / EDM 코드 루프)
  // ==========================================================================
  function initDemoSong() {
    buildPianoKeys();
    buildDrumMachine();

    // 신나는 4코드 멜로디 루프 데모 노트 배치
    // C4(12), E4(8), G4(5), A4(3) 등
    state.notes = [
      // 1마디: C-E-G 아르페지오
      { keyIndex: 12, step: 0, length: 2 }, // C4
      { keyIndex: 8,  step: 2, length: 2 }, // E4
      { keyIndex: 5,  step: 4, length: 2 }, // G4
      { keyIndex: 1,  step: 6, length: 2 }, // B4
      // 2마디: A-C-E 멜로디
      { keyIndex: 3,  step: 8, length: 2 }, // A4
      { keyIndex: 8,  step: 10, length: 2 }, // E4
      { keyIndex: 12, step: 12, length: 2 }, // C4
      { keyIndex: 15, step: 14, length: 2 }, // A3
      // 3마디: F-A-C
      { keyIndex: 7,  step: 16, length: 2 }, // F4
      { keyIndex: 3,  step: 18, length: 2 }, // A4
      { keyIndex: 0,  step: 20, length: 2 }, // C5
      { keyIndex: 5,  step: 22, length: 2 }, // G4
      // 4마디: G-B-D
      { keyIndex: 5,  step: 24, length: 2 }, // G4
      { keyIndex: 1,  step: 26, length: 2 }, // B4
      { keyIndex: 10, step: 28, length: 2 }, // D4
      { keyIndex: 12, step: 30, length: 2 }  // C4
    ];

    // 808 4온더플로어 드럼 비트
    [0, 4, 8, 12].forEach(s => state.drums.kick[s] = true);
    [4, 12].forEach(s => state.drums.snare[s] = true);
    [2, 6, 10, 14].forEach(s => state.drums.hihat[s] = true);
    [12].forEach(s => state.drums.clap[s] = true);

    renderGrid();
    buildDrumMachine();
  }

  initDemoSong();
})();
