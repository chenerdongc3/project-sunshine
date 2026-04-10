import { calcDimensionScores, scoresToLevels, determineResult } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'
import './style.css'

async function loadJSON(path) {
  const res = await fetch(path)
  return res.json()
}

function validateData(questions, dimensions, types, config) {
  if (!Array.isArray(questions?.main)) {
    throw new Error('questions.json 结构不正确')
  }

  if (!Array.isArray(dimensions?.order) || !dimensions?.definitions) {
    throw new Error('dimensions.json 缺少 order 或 definitions')
  }

  if (!Array.isArray(types?.standard)) {
    throw new Error('types.json 缺少 standard')
  }

  const dimOrder = dimensions.order
  const dimDefs = dimensions.definitions
  const dimSet = new Set(dimOrder)
  const defKeys = Object.keys(dimDefs)

  if (defKeys.length !== dimOrder.length) {
    throw new Error('dimensions.json 中 order 与 definitions 数量不一致')
  }

  for (const dim of dimOrder) {
    if (!dimDefs[dim]) {
      throw new Error(`dimensions.json 缺少维度定义: ${dim}`)
    }
  }

  for (const q of questions.main) {
    if (!dimSet.has(q.dim)) {
      throw new Error(`questions.json 存在未定义维度: ${q.dim}`)
    }
  }

  for (const type of types.standard) {
    const pattern = type.pattern?.replace(/-/g, '') || ''
    if (pattern.length !== dimOrder.length) {
      throw new Error(`types.json 中 ${type.code} 的 pattern 长度应为 ${dimOrder.length}`)
    }
  }

}

function showInitError(message) {
  const intro = document.getElementById('page-intro')
  const startBtn = document.getElementById('btn-start')
  const note = intro?.querySelector('.intro-note')

  if (startBtn) startBtn.disabled = true
  if (note) {
    note.textContent = `数据加载失败：${message}`
  }
}

async function init() {
  try {
    const [questions, dimensions, types, config] = await Promise.all([
      loadJSON(new URL('../data/questions.json', import.meta.url).href),
      loadJSON(new URL('../data/dimensions.json', import.meta.url).href),
      loadJSON(new URL('../data/types.json', import.meta.url).href),
      loadJSON(new URL('../data/config.json', import.meta.url).href),
    ])

    validateData(questions, dimensions, types, config)

    const pages = {
      intro: document.getElementById('page-intro'),
      quiz: document.getElementById('page-quiz'),
      result: document.getElementById('page-result'),
    }

    function showPage(name) {
      Object.values(pages).forEach((p) => p.classList.remove('active'))
      pages[name].classList.add('active')
      window.scrollTo(0, 0)
    }

    function onQuizComplete(answers) {
      const scores = calcDimensionScores(answers, questions.main)
      const levels = scoresToLevels(scores, config.scoring.levelThresholds)
      const result = determineResult(levels, dimensions.order, types.standard, {
        maxDistance: config.scoring.maxDistance,
      })
      renderResult(result, levels, dimensions.order, dimensions.definitions, config)
      showPage('result')
    }

    const quiz = createQuiz(questions, onQuizComplete)

    document.getElementById('btn-start').addEventListener('click', () => {
      quiz.start()
      showPage('quiz')
    })

    document.getElementById('btn-restart').addEventListener('click', () => {
      quiz.start()
      showPage('quiz')
    })
  } catch (error) {
    console.error(error)
    showInitError(error instanceof Error ? error.message : '未知错误')
  }
}

init()
