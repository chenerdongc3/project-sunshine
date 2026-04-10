/**
 * 评分引擎 — 纯函数，无 DOM 依赖
 */

/**
 * 按维度求和：每维度 2 题，分值相加 (范围 2-6)
 * @param {Object} answers  { q1: 2, q3: 1, ... }
 * @param {Array}  questions 题目定义数组
 * @returns {Object} { B1: 5, B2: 3, ... }
 */
export function calcDimensionScores(answers, questions) {
  const scores = {}
  for (const q of questions) {
    if (answers[q.id] == null) continue
    scores[q.dim] = (scores[q.dim] || 0) + answers[q.id]
  }
  return scores
}

/**
 * 原始分 → L/M/H 等级
 * @param {Object} scores      { B1: 5, ... }
 * @param {Object} thresholds  { L: [2,3], M: [4,4], H: [5,6] }
 * @returns {Object} { B1: 'H', B2: 'L', ... }
 */
export function scoresToLevels(scores, thresholds) {
  const levels = {}
  for (const [dim, score] of Object.entries(scores)) {
    if (score <= thresholds.L[1]) levels[dim] = 'L'
    else if (score >= thresholds.H[0]) levels[dim] = 'H'
    else levels[dim] = 'M'
  }
  return levels
}

/**
 * 等级 → 数值 (L=1, M=2, H=3)
 */
const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * 解析人格类型的 pattern 字符串
 * "HHH-HMH-MHH-HHH-HMH" → ['H','H','H','M','H','M','M','H','H','H','H','H','H','M','H']
 */
export function parsePattern(pattern) {
  return pattern.replace(/-/g, '').split('')
}

/**
 * 计算用户向量与类型 pattern 的曼哈顿距离
 * @param {Object} userLevels  { B1: 'H', B2: 'L', ... }
 * @param {Array}  dimOrder    ['B1','B2','B3','R1',...]
 * @param {string} pattern     "HHH-HMH-MHH-HHH-HMH"
 * @param {number} maxDistance 最大距离
 * @returns {{ distance: number, exact: number, similarity: number }}
 */
export function matchType(userLevels, dimOrder, pattern, maxDistance) {
  const typeLevels = parsePattern(pattern)
  let distance = 0
  let exact = 0

  for (let i = 0; i < dimOrder.length; i++) {
    const userVal = LEVEL_NUM[userLevels[dimOrder[i]]] || 2
    const typeVal = LEVEL_NUM[typeLevels[i]] || 2
    const diff = Math.abs(userVal - typeVal)
    distance += diff
    if (diff === 0) exact++
  }

  const similarity = Math.max(0, Math.round((1 - distance / maxDistance) * 100))
  return { distance, exact, similarity }
}

/**
 * 匹配所有标准类型并排序
 * @param {Object}  userLevels    { B1: 'H', ... }
 * @param {Array}   dimOrder      维度顺序
 * @param {Array}   standardTypes 标准类型数组
 * @param {Object}  options       { maxDistance?: number }
 * @returns {{ primary: Object, secondary: Object|null, rankings: Array, mode: string }}
 */
export function determineResult(userLevels, dimOrder, standardTypes, options = {}) {
  const maxDistance = options.maxDistance || dimOrder.length * 2
  const rankings = standardTypes.map((type) => ({
    ...type,
    ...matchType(userLevels, dimOrder, type.pattern, maxDistance),
  }))

  // 排序：距离升序 → 精准命中降序 → 相似度降序
  rankings.sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity)

  const best = rankings[0]

  return {
    primary: best,
    secondary: rankings[1] || null,
    rankings,
    mode: 'normal',
  }
}
