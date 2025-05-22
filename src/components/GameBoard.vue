<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-white p-4">
    <!-- ルール説明：折りたたみ可能 -->
    <div class="mb-4">
      <button
        @click="showRules = !showRules"
        class="px-3 py-1 bg-purple-700 hover:bg-purple-800 rounded text-white font-semibold"
      >
        {{ showRules ? 'ルールを隠す' : 'ルールを表示' }}
      </button>

      <div v-if="showRules" class="mt-2 p-3 bg-purple-100 text-black rounded shadow">
        <h2 class="font-bold text-lg mb-2">📜 ゲームルール</h2>
        <ul class="list-disc list-inside text-sm space-y-1">
          <li>ブラックジャックがモチーフのゲームです。</li>
          <li>プレイヤーとCPUはそれぞれ3枚のカードを出します。</li>
          <li>カードは各プレイヤーごとに一度ずつ使えます。</li>
          <li>1枚目は伏せ札、2・3枚目は公開されます。</li>
          <li>カードの合計点が21に近い方が勝ち（越えるとバースト負け）</li>
          <li>魔法カード：<code>x2</code> や <code>x3</code> は、それ以前に出した数字カードの合計を倍増</li>
          <li>魔法カード：<code>交換</code>はスコアを入れ替える</li>
          <li>魔法カード：<code>打ち消し</code>は相手の魔法カードを無効化</li>
          <li>全5ラウンド、勝利数が多い方が勝ち！</li>
        </ul>
      </div>
    </div>
    <!-- 戦績表示：折りたたみ -->
    <div class="mt-1">
      <button
        @click="showHistory = !showHistory"
        class="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 rounded text-white font-semibold"
      >
        {{ showHistory ? '戦績を隠す' : '過去の戦績を表示' }}
      </button>

      <div v-if="showHistory" class="mt-3 space-y-2">

      <div v-if="gameHistory.length" class="mt-6 p-4 bg-gray-800 rounded shadow text-sm space-y-1">
          <div class="text-lg font-bold text-white mb-2">📈 総合戦績</div>
          <div>🎯 総ゲーム数：{{ totalGames }}</div>
          <div>🏆 ゲーム勝利数：あなた {{ totalWins.player }}勝 / CPU {{ totalWins.cpu }}勝</div>
          <div>⚖️ ゲーム勝率：{{ gameWinRate }}</div>
          <div>🔢 ラウンド勝率：{{ roundWinRate }}</div>
        </div>

        <div
          v-for="(game, index) in gameHistory"
          :key="index"
          class="bg-gray-800 px-4 py-2 rounded border border-gray-600 shadow"
        >
          <p class="text-sm font-mono text-gray-200">
            🎮 Game {{ index + 1 }}：<span class="text-green-400">あなた {{ game.player }}勝</span> -
            <span class="text-red-400">CPU {{ game.cpu }}勝</span> →
            <span class="font-bold">{{ game.result }}</span>
          </p>
          
        </div>
        <div v-if="gameHistory.length === 0" class="text-sm text-gray-400">まだ戦績はありません。</div>
      </div>
    </div>
    <!-- ラウンド数と勝敗表示 -->
    <div class="flex flex-wrap gap-4 my-4">
      <div class="bg-gray-800 px-4 py-2 rounded shadow text-center">
        <div class="text-xs text-gray-400">ラウンド</div>
        <div class="text-lg font-bold text-yellow-300">{{ displayedRound }} / 5</div>
      </div>
      <div class="bg-blue-800 px-4 py-2 rounded shadow text-center">
        <div class="text-xs text-gray-300">あなたの勝ち</div>
        <div class="text-lg font-bold text-blue-300">{{ winCount.player }}</div>
      </div>
      <div class="bg-red-800 px-4 py-2 rounded shadow text-center">
        <div class="text-xs text-gray-300">CPUの勝ち</div>
        <div class="text-lg font-bold text-red-300">{{ winCount.cpu }}</div>
      </div>
    </div>

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
            'bg-yellow-400 text-black ring-2 ring-yellow-300': tempSelectedCard === card,
            'bg-blue-500 hover:bg-blue-600': tempSelectedCard !== card
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

const showRules = ref(false)

const gameHistory = ref([]) // 過去の戦績 [{ player: 3, cpu: 2 }, ...]
const showHistory = ref(false)

const totalGames = computed(() => gameHistory.value.length)

const tempSelectedCard = ref(null) // 仮選択中のカード

const totalWins = computed(() => {
  let player = 0
  let cpu = 0
  gameHistory.value.forEach(g => {
    if (g.result === 'あなたの勝ち') player++
    else if (g.result === 'CPUの勝ち') cpu++
  })
  return { player, cpu }
})

const gameWinRate = computed(() => {
  if (totalGames.value === 0) return '0%'
  return `${Math.round((totalWins.value.player / totalGames.value) * 100)}%`
})

const totalRounds = computed(() =>
  gameHistory.value.reduce((acc, g) => acc + g.player + g.cpu, 0)
)

const roundWinRate = computed(() => {
  const total = totalRounds.value
  if (total === 0) return '0%'
  const playerWins = gameHistory.value.reduce((acc, g) => acc + g.player, 0)
  return `${Math.round((playerWins / total) * 100)}%`
})

const displayedRound = computed(() => {
  return Math.min(roundCount.value + 1, 5)
})

const availablePlayerCards = computed(() =>
  fullDeck.filter(card => !usedPlayerCards.value.includes(card))
)

function simulateScore(hand) {
  // CPU戦略で使用するため、計算方式は上と同じ
  let total = 0
  let segment = 0

  for (const card of hand) {
    if (!isNaN(card)) {
      segment += Number(card)
    } else if (card === 'x2') {
      total += segment * 2
      segment = 0
    } else if (card === 'x3') {
      total += segment * 3
      segment = 0
    }
  }

  total += segment
  return total
}

function drawCpuCardSmart(cpuCardsSoFar) {
  const available = fullDeck.filter(c => !usedCpuCards.value.includes(c))
  const numericAvailable = available.filter(c => !isNaN(c)).map(Number)
  const magicAvailable = available.filter(c => isNaN(c))
  const currentScore = simulateScore(cpuCardsSoFar)

  const remainingSlots = 3 - cpuCardsSoFar.length

  const safeNumericCards = numericAvailable.filter(n => simulateScore([...cpuCardsSoFar, String(n)]) <= 21)

  // 1枚目（様子見）：できるだけ小さめ・安全なカード
  if (cpuCardsSoFar.length === 0) {
    const safeSmall = safeNumericCards.filter(n => n <= 6)
    const pick = safeSmall.length ? safeSmall : safeNumericCards.length ? safeNumericCards : [1]
    return String(randomChoice(pick))
  }

  // 2枚目（攻防バランス）：
  if (cpuCardsSoFar.length === 1) {
    const baseScore = simulateScore(cpuCardsSoFar)

    // x2やx3を使ってもバーストしないなら積極的に出す
    if (magicAvailable.includes('x2')) {
      const tryScore = simulateScore([...cpuCardsSoFar, 'x2'])
      if (tryScore <= 21) return 'x2'
    }

    if (magicAvailable.includes('x3')) {
      const tryScore = simulateScore([...cpuCardsSoFar, 'x3'])
      if (tryScore <= 21) return 'x3'
    }

    if (safeNumericCards.length) {
      // スコア10以上に乗せられそうなカードを優先
      const goodNums = safeNumericCards.filter(n => simulateScore([...cpuCardsSoFar, String(n)]) >= 10)
      return String(randomChoice(goodNums.length ? goodNums : safeNumericCards))
    }

    // 数字が危険 → 打ち消しや交換で逃げ
    if (magicAvailable.includes('打ち消し')) return '打ち消し'
    if (magicAvailable.includes('交換')) return '交換'

    return String(randomChoice(numericAvailable.length ? numericAvailable : [1]))
  }

  // 3枚目（最終判断）：
  if (cpuCardsSoFar.length === 2) {
    const candidates = [...numericAvailable.map(n => String(n)), ...magicAvailable]

    // できるだけ高得点を狙うが、バーストは避ける
    for (const c of candidates.sort(() => Math.random() - 0.5)) {
      const tryScore = simulateScore([...cpuCardsSoFar, c])
      if (tryScore <= 21) return c
    }

    // 全滅 → 交換 or 打ち消しで逃げ道があれば選ぶ
    if (magicAvailable.includes('交換')) return '交換'
    if (magicAvailable.includes('打ち消し')) return '打ち消し'

    // 最悪1を出す
    return '1'
  }

  return String(randomChoice(numericAvailable.length ? numericAvailable : [1]))
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function selectCard(card) {
  // 選択済み・使用済みカードは無視
  if (
    isRoundLocked.value ||
    usedPlayerCards.value.includes(card)
  ) return

  // すでに仮選択されていて、再度クリックしたら決定
  if (tempSelectedCard.value === card) {
    // 決定して出す
    handleCardPlay(card)
    tempSelectedCard.value = null
    return
  }

  // まだ仮選択されていない → 一時選択
  tempSelectedCard.value = card
}

function handleCardPlay(card) {
  selectedThisRound.value.push(card)
  usedPlayerCards.value.push(card)

  if (selectedThisRound.value.length === 1) {
    // 1枚目（伏せ）：自分とCPUそれぞれ1枚ずつ
    playerCards.value = [card]
    const cpu = drawCpuCardSmart([])
    cpuCards.value = [cpu]
    usedCpuCards.value.push(cpu)
    displayedPlayerCards.value.push(card)  // 自分には表示する
    displayedCpuCards.value = ['？']

  } else if (selectedThisRound.value.length === 2) {
    // 2枚目（公開）：両者もう1枚
    playerCards.value.push(card)
    const cpu = drawCpuCardSmart(cpuCards.value)
    cpuCards.value.push(cpu)
    usedCpuCards.value.push(cpu)
    displayedPlayerCards.value.push(card)
    displayedCpuCards.value.push(cpu)

  } else if (selectedThisRound.value.length === 3) {
    // 3枚目（公開）：最後のカード
    playerCards.value.push(card)
    const cpu = drawCpuCardSmart(cpuCards.value)
    cpuCards.value.push(cpu)
    usedCpuCards.value.push(cpu)
    displayedPlayerCards.value.push(card)
    displayedCpuCards.value.push(cpu)

    isRoundLocked.value = true
    setTimeout(() => {
      displayedPlayerCards.value[0] = playerCards.value[0]
      displayedCpuCards.value[0] = cpuCards.value[0]
      const { playerScore, cpuScore } = calculateFinalScores(playerCards.value, cpuCards.value)
      lastScores.value = { player: playerScore, cpu: cpuScore }

      // 勝敗
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

      if (roundCount.value < 5) roundCount.value++
      showNextButton.value = true

      if (roundCount.value >= 5) {
        finalResult.value = winCount.value.player > winCount.value.cpu
          ? '🎉 あなたの勝ち！ 🎉'
          : winCount.value.player < winCount.value.cpu
          ? '😈 CPUの勝ち 😈'
          : '🤝 引き分け 🤝'
      }
    }, 800)
  }
}

function evaluateScore(cards) {
  let score = 0

  for (const card of cards) {
    if (!isNaN(card)) {
      score += Number(card)
    } else if (card === 'x2') {
      score *= 2
    } else if (card === 'x3') {
      score *= 3
    }
    // '交換' や '打ち消し' はここでは考慮しない（別処理）
  }

  return score
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

  let playerScore = evaluateScore(effectivePlayerHand)
  let cpuScore = evaluateScore(effectiveCpuHand)

  const playerHasSwap = effectivePlayerHand.includes('交換')
  const cpuHasSwap = effectiveCpuHand.includes('交換')

  if (playerHasSwap && cpuHasSwap) {
    // 相殺（何もしない）
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
  // 現在の戦績を履歴に保存（5ラウンド終了時のみ）
  if (roundCount.value >= 5) {
    let resultText = ''
    if (winCount.value.player > winCount.value.cpu) resultText = 'あなたの勝ち'
    else if (winCount.value.player < winCount.value.cpu) resultText = 'CPUの勝ち'
    else resultText = '引き分け'

    gameHistory.value.push({
      player: winCount.value.player,
      cpu: winCount.value.cpu,
      result: resultText
    })
  }

  // 各種リセット処理
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
  finalResult.value = ''
  isRoundLocked.value = false
  showNextButton.value = false
}
</script>
