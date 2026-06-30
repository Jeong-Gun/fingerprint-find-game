import './style.css'

const differences = [
  { id: 1, x: 34, y: 38, label: '끊어진 융선', points: 100 },
  { id: 2, x: 62, y: 48, label: '짧은 가지선', points: 100 },
  { id: 3, x: 48, y: 68, label: '작은 점 특징', points: 100 },
]

let foundIds = new Set()
let score = 0

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
          <span>남은 차이</span>
          <strong id="remainingCount">${differences.length}</strong>
        </div>
        <div class="status-item">
          <span>점수</span>
          <strong id="score">0</strong>
        </div>
        <div class="status-item muted">
          <span>타이머</span>
          <strong>준비중</strong>
        </div>
      </div>

      <div class="workspace-grid">
        <aside class="mission-card">
          <p class="panel-label">감식 지시</p>
          <h2>비교 지문에서 변형 지점을 표시하세요.</h2>
          <ul>
            <li>원본 지문과 비교 지문을 차례로 대조합니다.</li>
            <li>비교 지문에서 다른 부분을 클릭합니다.</li>
            <li>이미 발견한 지점은 붉은 표식으로 고정됩니다.</li>
          </ul>
        </aside>

        <div class="fingerprint-board" aria-label="지문 비교 영역">
          <div class="print-card original-print">
            <span>원본 지문</span>
          </div>

          <div class="print-card compare-print" id="comparePrint">
            <span>비교 지문</span>
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
        <button id="resetButton" class="ghost-button" type="button">다시 시작</button>
      </div>
    </section>
  </main>
`

const startButton = document.querySelector('#startButton')
const startScreen = document.querySelector('#startScreen')
const gamePanel = document.querySelector('#gamePanel')
const remainingCount = document.querySelector('#remainingCount')
const scoreElement = document.querySelector('#score')
const message = document.querySelector('#message')
const resetButton = document.querySelector('#resetButton')
const spots = document.querySelectorAll('.difference-spot')

startButton.addEventListener('click', () => {
  startScreen.hidden = true
  gamePanel.hidden = false
  message.textContent = '비교 지문에서 다른 부분을 눌러보세요.'
})

spots.forEach((spot) => {
  spot.addEventListener('click', () => {
    const id = Number(spot.dataset.id)

    if (foundIds.has(id)) {
      return
    }

    const foundItem = differences.find((item) => item.id === id)

    foundIds.add(id)
    score += foundItem.points
    spot.classList.add('found')

    const remaining = differences.length - foundIds.size
    remainingCount.textContent = remaining
    scoreElement.textContent = score
    message.textContent = `${foundItem.label} 발견! +${foundItem.points}점`

    if (remaining === 0) {
      message.textContent = `감식 완료! 모든 차이점을 찾았습니다. 최종 점수: ${score}점`
    }
  })
})

resetButton.addEventListener('click', () => {
  foundIds = new Set()
  score = 0
  scoreElement.textContent = score
  remainingCount.textContent = differences.length
  message.textContent = '비교 지문에서 다른 부분을 눌러보세요.'
  spots.forEach((spot) => spot.classList.remove('found'))
})
