import './style.css'

const stages = [
  {
    id: 1,
    title: '지문 감정 1단계',
    originalImage: '/original-fingerprint01.png',
    compareImage: '/compare-fingerprint01.png',
    duration: 20,
    successLabel: '1단계 종료',
    differences: [
      { id: 1, x: 71, y: 23, label: '우측 상단 끊어진 융선', points: 50 },
      { id: 2, x: 75, y: 53, label: '우측 중간 변형 융선', points: 50 },
    ],
  },
  {
    id: 2,
    title: '지문 감정 2단계',
    originalImage: '/original-fingerprint02.png',
    compareImage: '/compare-fingerprint02.png',
    duration: 60,
    successLabel: '전체 게임 종료',
    differences: [
      { id: 1, x: 54, y: 10, label: '상단 중앙 끊어진 융선', points: 20 },
      { id: 2, x: 31, y: 24, label: '좌측 상단 교차 융선', points: 20 },
      { id: 3, x: 70, y: 52, label: '우측 중간 끊어진 융선', points: 20 },
      { id: 4, x: 31, y: 64, label: '좌측 하단 끊어진 융선', points: 20 },
      { id: 5, x: 50, y: 87, label: '하단 중앙 끊어진 융선', points: 20 },
    ],
  },
]

let currentStageIndex = 0
let stageScores = Array(stages.length).fill(0)
let foundIds = new Set()
let score = 0
let timeLeft = stages[0].duration
let wrongCount = 0
let timerId = null
let isGameActive = false
let isStageComplete = false
let audioContext = null

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="game-shell">
    <section class="start-screen" id="startScreen">
      <div class="start-background">
        <img
          src="/background02.png"
          alt=""
          class="start-background-image"
          aria-hidden="true"
        >
        <div class="background-overlay" aria-hidden="true"></div>
      </div>

      <section class="start-content">
        <div class="title-group">
          <h1 class="main-title">지문 특징점 비교</h1>
          <p class="english-title">Fingerprint Minutiae Comparison</p>
          <p class="professional-label">
            지문감정에서는 특징점의 위치, 형태, 특징점 사이의 융선 수, 융선 흐름을 비교해 동일 지문 여부를 판단합니다.
          </p>
        </div>

        <section class="intro-card" aria-labelledby="introTitle">
          <div class="intro-icon" aria-hidden="true">⌕</div>
          <h2 class="intro-title" id="introTitle">지문 신원확인</h2>
          <p class="intro-description">
            원본 지문과 비교 지문을 대조하여 서로 다른 특징점을 찾아내는 체험입니다.<br>
            실제 지문 신원확인과 동일한 원리이며,<br>
            제한 시간 안에 서로 다른 특징점을 찾아내야 합니다.
          </p>
        </section>

        <div class="start-button-area">
          <button type="button" class="start-button" id="startButton">
            <span class="start-button-text">비교 시작</span>
          </button>
        </div>
      </section>

      <footer class="police-tape" aria-hidden="true">
        <div class="police-tape-track">
          ${Array.from({ length: 6 }).map(() => `
            <span class="police-tape-item">
              <img src="/chamsuri-black.png" alt="" class="police-tape-mark">
              <span>출입금지 POLICE 수사중</span>
            </span>
          `).join('')}
        </div>
      </footer>
    </section>

    <section class="game-panel" id="gamePanel" hidden>
      <div class="status-bar" aria-label="게임 진행 상태">
        <div class="status-item">
          <span>남아 있는 다른 특징점</span>
          <strong id="remainingCount">${stages[0].differences.length}</strong>
        </div>
        <div class="status-item">
          <span>점수</span>
          <strong id="score">0</strong>
        </div>
        <div class="status-item muted">
          <span>타이머</span>
          <strong id="timerCount">${stages[0].duration}초</strong>
        </div>
      </div>

      <div class="workspace-grid">
        <aside class="mission-card">
          <p class="panel-label" id="stageTitle">지문 감정 1단계</p>
          <h2>비교 지문에서 변형 지점을 표시하세요.</h2>
          <ul>
            <li>원본 지문과 비교 지문을 차례로 대조합니다.</li>
            <li>비교 지문에서 다른 부분을 클릭합니다.</li>
            <li>이미 발견한 지점은 붉은 표식으로 고정됩니다.</li>
          </ul>
        </aside>

        <div class="fingerprint-board" aria-label="지문 비교 영역">
          <div class="print-card original-print">
            <img src="${stages[0].originalImage}" alt="원본 지문" class="fingerprint-image" id="originalImage">
            <span class="print-label">원본 지문</span>
          </div>

          <div class="print-card compare-print" id="comparePrint">
            <img src="${stages[0].compareImage}" alt="비교 지문" class="fingerprint-image" id="compareImage">
            <span class="print-label">비교 지문</span>
            <div class="difference-spots-layer" id="spotsLayer"></div>
          </div>
        </div>
      </div>

      <div class="result-panel" id="resultPanel" aria-live="polite">
        <p class="message" id="message">비교 지문에서 다른 부분을 눌러보세요.</p>
        <div class="result-actions">
          <span class="stage-complete-badge" id="stageCompleteBadge" hidden>1단계 종료</span>
          <button id="resetButton" class="ghost-button" type="button">다시 시작</button>
          <button id="nextButton" class="ghost-button" type="button">다음 게임</button>
        </div>
      </div>

      <footer class="police-tape game-police-tape" aria-hidden="true">
        <div class="police-tape-track">
          ${Array.from({ length: 6 }).map(() => `
            <span class="police-tape-item">
              <img src="/chamsuri-black.png" alt="" class="police-tape-mark">
              <span>출입금지 POLICE 수사중</span>
            </span>
          `).join('')}
        </div>
      </footer>
    </section>

    <section class="final-screen" id="finalScreen" hidden>
      <div class="final-card" aria-live="polite">
        <p class="final-kicker">전체 게임 종료</p>
        <h2>최종 평가</h2>
        <p class="final-result-status" id="finalResultStatus">성공</p>
        <p class="final-failure-reason" id="finalFailureReason" hidden>실패 사유: -</p>
        <div class="final-score-grid">
          <div class="final-score-item">
            <span>1단계 점수</span>
            <strong id="finalStageOneScore">0점</strong>
          </div>
          <div class="final-score-item">
            <span>2단계 점수</span>
            <strong id="finalStageTwoScore">0점</strong>
          </div>
          <div class="final-score-item total">
            <span>전체 점수</span>
            <strong id="finalTotalScore">0점</strong>
          </div>
        </div>
        <p class="final-evaluation" id="finalEvaluation">평가: -</p>
        <div class="final-actions">
          <button id="finalHomeButton" class="ghost-button" type="button">처음으로</button>
          <button id="finalRestartButton" class="ghost-button" type="button">다시 시작</button>
        </div>
      </div>

      <footer class="police-tape game-police-tape" aria-hidden="true">
        <div class="police-tape-track">
          ${Array.from({ length: 6 }).map(() => `
            <span class="police-tape-item">
              <img src="/chamsuri-black.png" alt="" class="police-tape-mark">
              <span>출입금지 POLICE 수사중</span>
            </span>
          `).join('')}
        </div>
      </footer>
    </section>
  </main>
`

const startButton = document.querySelector('#startButton')
const startScreen = document.querySelector('#startScreen')
const gamePanel = document.querySelector('#gamePanel')
const remainingCount = document.querySelector('#remainingCount')
const scoreElement = document.querySelector('#score')
const timerCount = document.querySelector('#timerCount')
const message = document.querySelector('#message')
const stageCompleteBadge = document.querySelector('#stageCompleteBadge')
const resetButton = document.querySelector('#resetButton')
const nextButton = document.querySelector('#nextButton')
const comparePrint = document.querySelector('#comparePrint')
const spotsLayer = document.querySelector('#spotsLayer')
const stageTitle = document.querySelector('#stageTitle')
const originalImage = document.querySelector('#originalImage')
const compareImage = document.querySelector('#compareImage')
const finalScreen = document.querySelector('#finalScreen')
const finalStageOneScore = document.querySelector('#finalStageOneScore')
const finalStageTwoScore = document.querySelector('#finalStageTwoScore')
const finalTotalScore = document.querySelector('#finalTotalScore')
const finalEvaluation = document.querySelector('#finalEvaluation')
const finalResultStatus = document.querySelector('#finalResultStatus')
const finalFailureReason = document.querySelector('#finalFailureReason')
const finalHomeButton = document.querySelector('#finalHomeButton')
const finalRestartButton = document.querySelector('#finalRestartButton')

startButton.addEventListener('click', () => {
  startScreen.hidden = true
  gamePanel.hidden = false
  beginGame(0)
})

comparePrint.addEventListener('click', (event) => {
  if (!isGameActive) {
    setMessage('다시 시작을 눌러 주세요.', 'warning')
    return
  }

  const rect = comparePrint.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  showMissMarker(x, y)
  wrongCount += 1

  if (wrongCount >= 5) {
    failGame('실패. 다시 시작해 주세요.', '오답 5회')
    return
  }

  playWarningSound()
  setMessage('다시 선택해 주세요.', 'warning')
})

function getCurrentStage() {
  return stages[currentStageIndex]
}

function renderDifferenceSpots() {
  const stage = getCurrentStage()
  spotsLayer.innerHTML = stage.differences.map((item) => `
    <button
      class="difference-spot"
      style="left: ${item.x}%; top: ${item.y}%;"
      data-id="${item.id}"
      aria-label="${item.label}"
    ></button>
  `).join('')

  spotsLayer.querySelectorAll('.difference-spot').forEach((spot) => {
    spot.addEventListener('click', handleDifferenceClick)
  })
}

function handleDifferenceClick(event) {
  event.stopPropagation()

  if (!isGameActive) {
    setMessage('다시 시작을 눌러 주세요.', 'warning')
    return
  }

  const stage = getCurrentStage()
  const spot = event.currentTarget
  const id = Number(spot.dataset.id)

  if (foundIds.has(id)) {
    return
  }

  const foundItem = stage.differences.find((item) => item.id === id)

  foundIds.add(id)
  score += foundItem.points
  spot.classList.add('found')
  playCorrectSound()

  const remaining = stage.differences.length - foundIds.size
  remainingCount.textContent = remaining
  scoreElement.textContent = score
  setMessage(`${foundItem.label} 발견! +${foundItem.points}점`)

  if (remaining === 0) {
    completeStage()
  }
}

function setMessage(text, variant = 'default') {
  message.textContent = text
  message.classList.toggle('message-warning', variant === 'warning')
}

function showMissMarker(x, y) {
  const marker = document.createElement('span')
  marker.className = 'miss-marker'
  marker.style.left = `${x}%`
  marker.style.top = `${y}%`
  comparePrint.append(marker)

  window.setTimeout(() => {
    marker.remove()
  }, 900)
}

function beginGame(stageIndex = currentStageIndex) {
  currentStageIndex = stageIndex

  if (stageIndex === 0) {
    stageScores = Array(stages.length).fill(0)
  }

  const stage = getCurrentStage()

  foundIds = new Set()
  score = 0
  timeLeft = stage.duration
  wrongCount = 0
  isGameActive = true
  isStageComplete = false
  stageScores[stageIndex] = 0

  finalScreen.hidden = true
  gamePanel.hidden = false
  nextButton.hidden = false
  stageTitle.textContent = stage.title
  originalImage.src = stage.originalImage
  compareImage.src = stage.compareImage
  scoreElement.textContent = score
  remainingCount.textContent = stage.differences.length
  timerCount.textContent = `${timeLeft}초`
  setMessage('비교 지문에서 다른 부분을 눌러보세요.')
  stageCompleteBadge.textContent = stage.successLabel
  stageCompleteBadge.classList.remove('is-failure')
  stageCompleteBadge.hidden = true
  comparePrint.querySelectorAll('.miss-marker').forEach((marker) => marker.remove())
  renderDifferenceSpots()
  startTimer()
}

function startTimer() {
  stopTimer()
  playTickSound()

  timerId = window.setInterval(() => {
    timeLeft -= 1
    timerCount.textContent = `${timeLeft}초`

    if (timeLeft <= 0) {
      failGame('시간 초과. 다시 시작해 주세요.', '시간 초과')
      return
    }

    playTickSound()
  }, 1000)
}

function completeStage() {
  const stage = getCurrentStage()

  isGameActive = false
  isStageComplete = true
  stageScores[currentStageIndex] = score
  stopTimer()
  stageCompleteBadge.classList.remove('is-failure')
  stageCompleteBadge.hidden = false

  if (currentStageIndex === stages.length - 1) {
    stageCompleteBadge.textContent = '전체 게임 종료'
    nextButton.hidden = true
    showFinalScreen()
    return
  }

  stageCompleteBadge.textContent = stage.successLabel
  setMessage(`지문 감정 완료! 모든 특징점을 찾았습니다. 최종 점수: ${score}점`)
}

function getFinalResult(forceRetry = false) {
  const averageScore = Math.round(
    stageScores.reduce((total, stageScore) => total + stageScore, 0) / stages.length,
  )
  const evaluation = forceRetry ? '재도전 필요' : getEvaluation(averageScore)

  return { averageScore, evaluation }
}

function showFinalScreen({ failed = false, reason = '' } = {}) {
  const { averageScore, evaluation } = getFinalResult(failed)

  finalResultStatus.textContent = failed ? '실패' : '성공'
  finalResultStatus.classList.toggle('is-failure', failed)
  finalFailureReason.textContent = failed ? `실패 사유: ${reason}` : '실패 사유: -'
  finalFailureReason.hidden = !failed
  finalStageOneScore.textContent = `${stageScores[0]}점`
  finalStageTwoScore.textContent = `${stageScores[1]}점`
  finalTotalScore.textContent = `${averageScore}점`
  finalEvaluation.textContent = `평가: ${evaluation}`
  gamePanel.hidden = true
  finalScreen.hidden = false
}

function getEvaluation(averageScore) {
  if (averageScore >= 90) {
    return '우수'
  }

  if (averageScore >= 70) {
    return '양호'
  }

  if (averageScore >= 50) {
    return '보통'
  }

  return '재도전 필요'
}

function failGame(text, reason = '실패') {
  isGameActive = false
  isStageComplete = false
  stopTimer()

  if (currentStageIndex === stages.length - 1) {
    stageScores[currentStageIndex] = score
    playFailureSound()
    showFinalScreen({ failed: true, reason })
    return
  }

  stageCompleteBadge.textContent = '실패'
  stageCompleteBadge.classList.add('is-failure')
  stageCompleteBadge.hidden = false
  setMessage(text, 'warning')
  playFailureSound()
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    audioContext = new AudioContextConstructor()
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

function playTone(frequency, duration, delay = 0, type = 'sine') {
  const context = getAudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const startAt = context.currentTime + delay

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.02)
}

function playCorrectSound() {
  playTone(740, 0.16)
  playTone(980, 0.18, 0.15)
}

function playWarningSound() {
  playTone(180, 0.2, 0, 'square')
  playTone(120, 0.22, 0.18, 'square')
}

function playFailureSound() {
  playTone(260, 0.18, 0, 'sawtooth')
  playTone(180, 0.22, 0.18, 'sawtooth')
  playTone(110, 0.3, 0.4, 'sawtooth')
}

function playTickSound() {
  playTone(920, 0.035, 0, 'square')
}

resetButton.addEventListener('click', () => {
  beginGame(currentStageIndex)
})

nextButton.addEventListener('click', () => {
  if (isGameActive || !isStageComplete) {
    setMessage('현재 단계를 먼저 완료해 주세요.', 'warning')
    return
  }

  if (currentStageIndex < stages.length - 1) {
    beginGame(currentStageIndex + 1)
    return
  }

  setMessage('전체 게임이 종료되었습니다.', 'warning')
})

finalHomeButton.addEventListener('click', () => {
  stopTimer()
  finalScreen.hidden = true
  gamePanel.hidden = true
  startScreen.hidden = false
  currentStageIndex = 0
  stageScores = Array(stages.length).fill(0)
})

finalRestartButton.addEventListener('click', () => {
  finalScreen.hidden = true
  startScreen.hidden = true
  beginGame(0)
})
