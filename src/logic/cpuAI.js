export function drawCpuCardSmart(cpuCardsSoFar, usedCpuCards, fullDeck, simulateScore) {
    if (!Array.isArray(cpuCardsSoFar) || !Array.isArray(usedCpuCards) || !Array.isArray(fullDeck)) {
        console.error("drawCpuCardSmart: 引数が不正です")
        return '1'
      }
    const available = fullDeck.filter(c => !usedCpuCards.includes(c))
    const numericAvailable = available.filter(c => !isNaN(c)).map(Number)
    const magicAvailable = available.filter(c => isNaN(c))
    const safeNumericCards = numericAvailable.filter(n => simulateScore([...cpuCardsSoFar, String(n)]) <= 21)
  
    if (cpuCardsSoFar.length === 0) {
      const safeSmall = safeNumericCards.filter(n => n <= 6)
      const pick = safeSmall.length ? safeSmall : safeNumericCards.length ? safeNumericCards : [1]
      return String(randomChoice(pick))
    }
  
    if (cpuCardsSoFar.length === 1) {
      if (magicAvailable.includes('x2')) {
        const tryScore = simulateScore([...cpuCardsSoFar, 'x2'])
        if (tryScore <= 21) return 'x2'
      }
      if (magicAvailable.includes('x3')) {
        const tryScore = simulateScore([...cpuCardsSoFar, 'x3'])
        if (tryScore <= 21) return 'x3'
      }
      if (safeNumericCards.length) {
        const goodNums = safeNumericCards.filter(n => simulateScore([...cpuCardsSoFar, String(n)]) >= 10)
        return String(randomChoice(goodNums.length ? goodNums : safeNumericCards))
      }
      if (magicAvailable.includes('打ち消し')) return '打ち消し'
      if (magicAvailable.includes('交換')) return '交換'
      return String(randomChoice(numericAvailable.length ? numericAvailable : [1]))
    }
  
    if (cpuCardsSoFar.length === 2) {
      const candidates = [...numericAvailable.map(n => String(n)), ...magicAvailable]
      for (const c of candidates.sort(() => Math.random() - 0.5)) {
        const tryScore = simulateScore([...cpuCardsSoFar, c])
        if (tryScore <= 21) return c
      }
      if (magicAvailable.includes('交換')) return '交換'
      if (magicAvailable.includes('打ち消し')) return '打ち消し'
      return '1'
    }
  
    return String(randomChoice(numericAvailable.length ? numericAvailable : [1]))
  }
  
  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }