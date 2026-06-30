import './style.css'

const differences = [
  { id: 1, x: 71, y: 23, label: '우측 상단 끊어진 융선', points: 50 },
  { id: 2, x: 75, y: 53, label: '우측 중간 변형 융선', points: 50 },
]

const GAME_DURATION = 20

let foundIds = new Set()
let score = 0
let timeLeft = GAME_DURATION
let wrongCount = 0
let timerId = null
let isGameActive = false
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
          <strong id="remainingCount">${differences.length}</strong>
        </div>
        <div class="status-item">
          <span>점수</span>
          <strong id="score">0</strong>
        </div>
        <div class="status-item muted">
          <span>타이머</span>
          <strong id="timerCount">${GAME_DURATION}초</strong>
        </div>
      </div>

      <div class="workspace-grid">
        <aside class="mission-card">
          <p class="panel-label">지문 감정 1단계</p>
          <h2>비교 지문에서 변형 지점을 표시하세요.</h2>
          <ul>
            <li>원본 지문과 비교 지문을 차례로 대조합니다.</li>
            <li>비교 지문에서 다른 부분을 클릭합니다.</li>
            <li>이미 발견한 지점은 붉은 표식으로 고정됩니다.</li>
          </ul>
        </aside>

        <div class="fingerprint-board" aria-label="지문 비교 영역">
          <div class="print-card original-print">
            <img src="/original-fingerprint01.png" alt="원본 지문" class="fingerprint-image">
            <span class="print-label">원본 지문</span>
          </div>

          <div class="print-card compare-print" id="comparePrint">
            <img src="/compare-fingerprint01.png" alt="비교 지문" class="fingerprint-image">
            <span class="print-label">비교 지문</span>
            ${differences.map((item) => `
              <button
                class="difference-spot"
                style="left: ${item.x}%; top: ${item.y}%;"
                data-id="${item.id}"
                aria-label="${item.label}"
              ></button>
            `).join('')}
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
const spots = document.querySelectorAll('.difference-spot')
const comparePrint = document.querySelector('#comparePrint')

startButton.addEventListener('click', () => {
  startScreen.hidden = true
  gamePanel.hidden = false
  beginGame()
})

spots.forEach((spot) => {
  spot.addEventListener('click', (event) => {
    event.stopPropagation()

    if (!isGameActive) {
      setMessage('다시 시작을 눌러 주세요.', 'warning')
      return
    }

    const id = Number(spot.dataset.id)

    if (foundIds.has(id)) {
      return
    }

    const foundItem = differences.find((item) => item.id === id)

    foundIds.add(id)
    score += foundItem.points
    spot.classList.add('found')
    playCorrectSound()

    const remaining = differences.length - foundIds.size
    remainingCount.textContent = remaining
    scoreElement.textContent = score
    setMessage(`${foundItem.label} 발견! +${foundItem.points}점`)

    if (remaining === 0) {
      completeGame()
      setMessage(`지문 감정 완료! 모든 특징점을 찾았습니다. 최종 점수: ${score}점`)
    }
  })
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
    failGame('실패. 다시 시작해 주세요.')
    return
  }

  playWarningSound()
  setMessage('다시 선택해 주세요.', 'warning')
})

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

function beginGame() {
  foundIds = new Set()
  score = 0
  timeLeft = GAME_DURATION
  wrongCount = 0
  isGameActive = true
  scoreElement.textContent = score
  remainingCount.textContent = differences.length
  timerCount.textContent = `${timeLeft}초`
  setMessage('비교 지문에서 다른 부분을 눌러보세요.')
  stageCompleteBadge.textContent = '1단계 종료'
  stageCompleteBadge.classList.remove('is-failure')
  stageCompleteBadge.hidden = true
  spots.forEach((spot) => spot.classList.remove('found'))
  comparePrint.querySelectorAll('.miss-marker').forEach((marker) => marker.remove())
  startTimer()
}

function startTimer() {
  stopTimer()
  playTickSound()

  timerId = window.setInterval(() => {
    timeLeft -= 1
    timerCount.textContent = `${timeLeft}초`

    if (timeLeft <= 0) {
      failGame('시간 초과. 다시 시작해 주세요.')
      return
    }

    playTickSound()
  }, 1000)
}

function completeGame() {
  isGameActive = false
  stopTimer()
  stageCompleteBadge.textContent = '1단계 종료'
  stageCompleteBadge.classList.remove('is-failure')
  stageCompleteBadge.hidden = false
}

function failGame(text) {
  isGameActive = false
  stopTimer()
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
  beginGame()
})

nextButton.addEventListener('click', () => {
  setMessage('다음 게임은 준비 중입니다.', 'warning')
})
