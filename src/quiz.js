import { shuffle } from './utils.js'

/**
 * 答题控制器
 */
export function createQuiz(questions, onComplete) {
  let queue = shuffle(questions.main)
  let current = 0
  let answers = {}

  const els = {
    fill: document.getElementById('progress-fill'),
    text: document.getElementById('progress-text'),
    qText: document.getElementById('question-text'),
    options: document.getElementById('options'),
  }

  function totalCount() {
    return queue.length
  }

  function updateProgress() {
    const pct = (current / totalCount()) * 100
    els.fill.style.width = pct + '%'
    els.text.textContent = `${current} / ${totalCount()}`
  }

  function renderQuestion() {
    const q = queue[current]
    els.qText.textContent = q.text

    els.options.innerHTML = ''
    q.options.forEach((opt) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn-option'
      btn.textContent = opt.label
      btn.addEventListener('click', () => selectOption(q, opt))
      els.options.appendChild(btn)
    })

    updateProgress()
  }

  function selectOption(question, option) {
    answers[question.id] = option.value

    current++
    if (current >= totalCount()) {
      onComplete(answers)
    } else {
      renderQuestion()
    }
  }

  function start() {
    current = 0
    answers = {}
    queue = shuffle(questions.main)
    renderQuestion()
  }

  return { start, renderQuestion }
}
