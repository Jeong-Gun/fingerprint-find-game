import './style.css'

const differences = [
  { id: 1, x: 34, y: 38, label: '끊어진 융선' },
  { id: 2, x: 62, y: 48, label: '짧은 가지선' },
  { id: 3, x: 48, y: 68, label: '작은 점 특징' },
]

let foundIds = new Set()
let score = 0

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="game-shell">
    <section class="hero">
      <p class="eyebrow">Fingerprint Spot the Difference</p>
      <h1>지문 틀린그림 찾기</h1>
      <p class="subtitle">
        두 지문 이미지를 비교해서 서로 다른 특징점을 찾아보는 관찰력 게임입니다.
      </p>
      <button id="startButton" class="primary-button">게임 시작</button>
    </section>

    <section class="game-panel" id="gamePanel" hidden>
      <div class="status-bar">
        <span>남은 차이: <strong id="remainingCount">3</strong></span>
        <span>점수: <strong id="score">0</strong></span>
      </div>

      <div class="fingerprint-board">
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

      <p class="message" id="message">비교 지문에서 다른 부분을 눌러보세요.</p>
    </section>
  </main>
`

const startButton = document.querySelector('#startButton')
const gamePanel = document.querySelector('#gamePanel')
const remainingCount = document.querySelector('#remainingCount')
const scoreElement = document.querySelector('#score')
const message = document.querySelector('#message')
const spots = document.querySelectorAll('.difference-spot')

startButton.addEventListener('click', () => {
  gamePanel.hidden = false
  startButton.textContent = '게임 진행 중'
  message.textContent = '비교 지문에서 다른 부분을 눌러보세요.'
})

spots.forEach((spot) => {
  spot.addEventListener('click', () => {
    const id = Number(spot.dataset.id)

    if (foundIds.has(id)) {
      return
    }

    foundIds.add(id)
    score += 100
    spot.classList.add('found')

    const remaining = differences.length - foundIds.size
    remainingCount.textContent = remaining
    scoreElement.textContent = score

    const foundItem = differences.find((item) => item.id === id)
    message.textContent = `${foundItem.label} 발견!`

    if (remaining === 0) {
      message.textContent = `완료! 모든 차이점을 찾았습니다. 최종 점수: ${score}`
      startButton.textContent = '성공'
    }
  })
})