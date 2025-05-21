<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-white p-4">
    <!-- 勝敗カウント -->
    <div class="text-sm text-gray-300 mb-2">
      あなたの勝ち：{{ winCount.player }} ／ CPUの勝ち：{{ winCount.cpu }}
    </div>

    <!-- スコア・結果表示 -->
    <div v-if="lastScores.player !== null" class="text-sm text-gray-300 mb-2">
      あなたのスコア：{{ lastScores.player }} ／ CPUのスコア：{{ lastScores.cpu }}
    </div>
    <div v-if="roundResult" class="text-xl font-bold mb-2">
      {{ roundResult }}
    </div>

    <!-- 場 -->
    <div class="flex justify-center items-center gap-10 my-4">
      <div class="text-center">
        <h2 class="mb-1">あなたの場</h2>
        <div v-for="(card, index) in currentPlayerCards" :key="index" class="px-4 py-2 bg-blue-600 rounded">
          {{ card }}
        </div>
      </div>
      <div class="text-center">
        <h2 class="mb-1">CPUの場</h2>
        <div v-for="(card, index) in currentCpuCards" :key="index" class="px-4 py-2 bg-red-600 rounded">
          {{ card }}
        </div>
      </div>
    </div>

    <!-- 手札 -->
    <div class="mt-auto">
      <h2 class="text-lg font-semibold mb-2">あなたの手札（クリックで選択）</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="card in availablePlayerCards"
          :key="card"
          @click="toggleCardSelection(card)"
          :class="[
            'px-4 py-2 rounded text-sm font-semibold transition duration-200',
            selectedPlayerCards.includes(card)
              ? 'bg-yellow-400 text-black scale-110 ring-4 ring-yellow-300'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          ]"
        >
          {{ card }}
        </button>
      </div>
    </div>

    <!-- 操作ボタン -->
    <div class="mt-4 flex gap-4">
      <button
        @click="startNewRound"
        class="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        :disabled="selectedPlayerCards.length !== 3 || roundCount >= 5"
      >
        ラウンド開始
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
const selectedPlayerCards = ref([])
const currentPlayerCards = ref([])
const currentCpuCards = ref([])

const roundResult = ref('')
const lastScores = ref({ player: null, cpu: null })
const roundCount = ref(0)
const winCount = ref({ player: 0, cpu: 0 })

const availablePlayerCards = computed(() =>
  fullDeck.filter(card => !usedPlayerCards.value.includes(card))
)

function toggleCardSelection(card) {
  if (selectedPlayerCards.value.includes(card)) {
    selectedPlayerCards.value = selectedPlayerCards.value.filter(c => c !== card)
  } else if (selectedPlayerCards.value.length < 3) {
    selectedPlayerCards.value.push(card)
  }
}

function drawCpuHand() {
  const available = fullDeck.filter(c => !usedCpuCards.value.includes(c))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  const hand = shuffled.slice(0, 3)
  usedCpuCards.value.push(...hand)
  return hand
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
    // 交換同士→打ち消し扱い
  } else if (playerHasSwap) {
    [playerScore, cpuScore] = [cpuScore, playerScore]
  } else if (cpuHasSwap) {
    [playerScore, cpuScore] = [cpuScore, playerScore]
  }

  return { playerScore, cpuScore }
}

function startNewRound() {
  if (selectedPlayerCards.value.length !== 3) return

  const playerHand = [...selectedPlayerCards.value]
  const cpuHand = drawCpuHand()

  currentPlayerCards.value = [...playerHand]
  currentCpuCards.value = [...cpuHand]

  usedPlayerCards.value.push(...playerHand)
  selectedPlayerCards.value = []

  const { playerScore, cpuScore } = calculateFinalScores(playerHand, cpuHand)
  lastScores.value = { player: playerScore, cpu: cpuScore }

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

  roundCount.value++
  if (roundCount.value >= 5) {
    roundResult.value += '（5回勝負終了）'
  }
}

function resetGame() {
  usedPlayerCards.value = []
  usedCpuCards.value = []
  selectedPlayerCards.value = []
  currentPlayerCards.value = []
  currentCpuCards.value = []
  lastScores.value = { player: null, cpu: null }
  roundCount.value = 0
  roundResult.value = ''
  winCount.value = { player: 0, cpu: 0 }
}
</script>