<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-white p-4">
    <div class="text-sm text-gray-300 mb-2">ラウンド {{ displayedRound }} / 5</div>
    <div v-if="finalResult" class="text-4xl font-bold text-pink-400 text-center mt-6 animate-bounce">
      {{ finalResult }}
    </div>
    <div class="text-sm text-gray-300 mb-2">あなたの勝ち：{{ winCount.player }} ／ CPUの勝ち：{{ winCount.cpu }}</div>

  <!-- 場の表示：1枚目は「？」、2枚目から公開 -->
  <div class="text-2xl font-semibold mb-4">あなたのスコア：{{ lastScores.player }} ／ CPUのスコア：{{ lastScores.cpu }}</div>

  <div v-if="roundResult" class="text-3xl font-bold text-yellow-400 mb-4 animate-pulse">
    🏆 {{ roundResult }} 🏆
  </div>


  <!-- 場のカード -->
  <div class="flex justify-center items-center gap-10 my-4">
    <div class="text-center">
      <h2 class="mb-1">あなたの場</h2>
      <div v-for="(card, index) in displayedPlayerCards" :key="index" class="px-6 py-3 bg-blue-600 rounded text-xl">
        {{ card }}
      </div>
    </div>
    <div class="text-center">
      <h2 class="mb-1">CPUの場</h2>
      <div v-for="(card, index) in displayedCpuCards" :key="index" class="px-6 py-3 bg-red-600 rounded text-xl">
        {{ card }}
      </div>
    </div>
  </div>

    <!-- あなたの手札 -->
    <div class="mt-auto">
      <h2 class="text-lg font-semibold mb-2">あなたの手札</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="card in availablePlayerCards"
          :key="card"
          :disabled="usedPlayerCards.includes(card) || selectedThisRound.includes(card)"
          @click="selectCard(card)"
          class="px-4 py-2 rounded transition duration-200"
          :class="{
            'bg-yellow-400 text-black ring-2 ring-yellow-300': selectedThisRound.includes(card),
            'bg-blue-500 hover:bg-blue-600': !selectedThisRound.includes(card)
          }"
        >
          {{ card }}
        </button>
      </div>
    </div>

    <!-- 操作 -->
    <div class="mt-4 flex gap-4">
      <button
        v-if="showNextButton && roundCount < 5"
        @click="nextRound"
        class="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
      >
        次のラウンドへ
      </button>
      <button
        v-if="roundCount >= 5"
        @click="resetGame"
        class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
      >
        再戦
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const fullDeck = ['0','1','2','3','4','5','6','7','8','9','10','x2','x3','交換','打ち消し']
const usedPlayerCards = ref([])
const usedCpuCards = ref([])

const selectedThisRound = ref([])
const playerCards = ref([])
const cpuCards = ref([])
const displayedPlayerCards = ref([])
const displayedCpuCards = ref([])

const roundResult = ref('')
const lastScores = ref({ player: null, cpu: null })
const roundCount = ref(0)
const winCount = ref({ player: 0, cpu: 0 })

const showNextButton = ref(false) // 次ラウンド進行ボタンの表示制御
const isRoundLocked = ref(false)  // 勝敗処理中はtrue（カード選択不可）
const finalResult = ref('')       // 5回戦後の総合勝敗

const displayedRound = computed(() => {
  return Math.min(roundCount.value + 1, 5)
})

const availablePlayerCards = computed(() =>
  fullDeck.filter(card => !usedPlayerCards.value.includes(card))
)

function drawCpuCard() {
  const available = fullDeck.filter(c => !usedCpuCards.value.includes(c))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled[0]
}

function drawCpuCardSmart(cpuCardsSoFar) {
  const available = fullDeck.filter(c => !usedCpuCards.value.includes(c))

  // 手札0枚目 → 中～小の数値カードを優先（バースト防止）
  if (cpuCardsSoFar.length === 0) {
    const nums = available.filter(c => !isNaN(c)).map(c => Number(c))
    const safeNums = nums.filter(n => n <= 7)
    const card = safeNums.length ? String(safeNums[Math.floor(Math.random() * safeNums.length)]) : randomChoice(available)
    return card
  }

  // 手札1枚目 → 合計を見て調整（x2, x3 温存）
  if (cpuCardsSoFar.length === 1) {
    const score = Number(cpuCardsSoFar[0])
    if (score <= 7 && available.includes('10')) return '10'
    if (available.includes('x2') && score <= 7) return 'x2'
    return randomChoice(available)
  }

  // 手札2枚目 → 交換や打ち消しを混ぜる判断
  if (cpuCardsSoFar.length === 2) {
    if (available.includes('打ち消し') && Math.random() < 0.5) return '打ち消し'
    if (available.includes('交換') && Math.random() < 0.3) return '交換'
    return randomChoice(available)
  }

  return randomChoice(available)
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function selectCard(card) {
  if (
    isRoundLocked.value ||
    selectedThisRound.value.includes(card) ||
    usedPlayerCards.value.includes(card)
  ) return

  if (selectedThisRound.value.includes(card) || usedPlayerCards.value.includes(card)) return

  selectedThisRound.value.push(card)

  if (selectedThisRound.value.length === 1) {
    // 1枚目：伏せて出す
    playerCards.value = [card]
    const cpu = drawCpuCardSmart(cpuCards.value)
    cpuCards.value = [cpu]  // ✅ 必ずここで代入
    usedPlayerCards.value.push(card)
    usedCpuCards.value.push(cpu)  // ✅ 正しくpush
    displayedPlayerCards.value = ['？']
    displayedCpuCards.value = ['？']
  } else if (selectedThisRound.value.length === 2) {
    // 2枚目：公開で出す
    playerCards.value.push(card)
    const cpu = drawCpuCardSmart(cpuCards.value)
    cpuCards.value.push(cpu)
    usedPlayerCards.value.push(card)
    usedCpuCards.value.push(cpu)
    displayedPlayerCards.value.push(card)
    displayedCpuCards.value.push(cpu)

  } else if (selectedThisRound.value.length === 3) {
    // 3枚目：出した後、少し待ってから全公開
    playerCards.value.push(card)
    const cpu = drawCpuCardSmart(cpuCards.value)
    cpuCards.value.push(cpu)
    usedPlayerCards.value.push(card)
    usedCpuCards.value.push(cpu)
    displayedPlayerCards.value.push(card)
    displayedCpuCards.value.push(cpu)

    setTimeout(() => {
      // 全公開
      displayedPlayerCards.value[0] = playerCards.value[0]
      displayedCpuCards.value[0] = cpuCards.value[0]

      // スコア計算
      const { playerScore, cpuScore } = calculateFinalScores(playerCards.value, cpuCards.value)
      lastScores.value = { player: playerScore, cpu: cpuScore }

      // 勝敗表示
      if (playerScore > 21 && cpuScore > 21) {
        roundResult.value = '両者バースト'
      } else if (playerScore > 21) {
        roundResult.value = 'CPUの勝ち'
        winCount.value.cpu++
      } else if (cpuScore > 21) {
        roundResult.value = 'あなたの勝ち'
        winCount.value.player++
      } else if (playerScore > cpuScore) {
        roundResult.value = 'あなたの勝ち'
        winCount.value.player++
      } else if (playerScore < cpuScore) {
        roundResult.value = 'CPUの勝ち'
        winCount.value.cpu++
      } else {
        roundResult.value = '引き分け'
      }

      // ラウンド数が5未満のときのみインクリメント
      if (roundCount.value < 5) {
        roundCount.value++
      }
      
      selectedThisRound.value = []
      showNextButton.value = true

      if (roundCount.value >= 5) {
        if (winCount.value.player > winCount.value.cpu) {
          finalResult.value = '🎉 あなたの勝ち！ 🎉'
        } else if (winCount.value.player < winCount.value.cpu) {
          finalResult.value = '😈 CPUの勝ち 😈'
        } else {
          finalResult.value = '🤝 引き分け 🤝'
        }
      }

    }, 1000)  // ← 一瞬の間
  }
}

function calculateFinalScores(playerHand, cpuHand) {
  const playerHasNegate = playerHand.includes('打ち消し')
  const cpuHasNegate = cpuHand.includes('打ち消し')

  const effectivePlayerHand = cpuHasNegate
    ? playerHand.filter(card => !['x2', 'x3', '交換'].includes(card))
    : playerHand

  const effectiveCpuHand = playerHasNegate
    ? cpuHand.filter(card => !['x2', 'x3', '交換'].includes(card))
    : cpuHand

  function calculateBaseScore(hand) {
    let total = 0
    let multiplier = 1
    for (const card of hand) {
      if (!isNaN(card)) {
        total += parseInt(card)
      } else if (card === 'x2') {
        multiplier *= 2
      } else if (card === 'x3') {
        multiplier *= 3
      }
    }
    return total * multiplier
  }

  let playerScore = calculateBaseScore(effectivePlayerHand)
  let cpuScore = calculateBaseScore(effectiveCpuHand)

  const playerHasSwap = effectivePlayerHand.includes('交換')
  const cpuHasSwap = effectiveCpuHand.includes('交換')

  if (playerHasSwap && cpuHasSwap) {
    // 相殺
  } else if (playerHasSwap) {
    [playerScore, cpuScore] = [cpuScore, playerScore]
  } else if (cpuHasSwap) {
    [playerScore, cpuScore] = [cpuScore, playerScore]
  }

  return { playerScore, cpuScore }
}

function nextRound() {
  selectedThisRound.value = []
  playerCards.value = []
  cpuCards.value = []
  displayedPlayerCards.value = []
  displayedCpuCards.value = []
  lastScores.value = { player: null, cpu: null }
  roundResult.value = ''
  showNextButton.value = false
  isRoundLocked.value = false
}

function resetGame() {
  usedPlayerCards.value = []
  usedCpuCards.value = []
  selectedThisRound.value = []
  playerCards.value = []
  cpuCards.value = []
  displayedPlayerCards.value = []
  displayedCpuCards.value = []
  lastScores.value = { player: null, cpu: null }
  roundCount.value = 0
  roundResult.value = ''
  winCount.value = { player: 0, cpu: 0 }
  finalResult.value = '' // ← これが必要！
  isRoundLocked.value = false
  showNextButton.value = false
}
</script>