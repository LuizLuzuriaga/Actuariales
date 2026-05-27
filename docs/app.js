// ============================================
// Application Logic
// ============================================

let currentTest = null;
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = [];

const TEST_NAMES = {
    drive2: 'DRIVE 2',
    drive1: 'DRIVE 1',
    random: 'RANDOM TEST',
    odd: 'ODD TEST',
    drive: 'DRIVE',
    oddDrive: 'ODD DRIVE TEST',
    all: 'ALL TEST'
};

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/\d{1,2}\s*$/, '')  // Remove trailing page numbers
        .replace(/Examen de Derecho Bancario.*$/i, '')
        .trim();
}

function getTestQuestions(testId) {
    let questions;
    switch(testId) {
        case 'drive2':
            questions = DRIVE2_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 2'}));
            break;
        case 'drive1':
            questions = DRIVE1_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 1'}));
            break;
        case 'random':
            questions = RANDOM_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'RANDOM TEST'}));
            break;
        case 'odd':
            questions = ODD_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'ODD TEST'}));
            break;
        case 'drive':
            questions = shuffleArray([
                ...DRIVE2_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 2'})),
                ...DRIVE1_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 1'}))
            ]);
            break;
        case 'oddDrive':
            questions = shuffleArray([
                ...DRIVE2_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 2'})),
                ...DRIVE1_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 1'})),
                ...ODD_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'ODD TEST'}))
            ]);
            break;
        case 'all':
            questions = shuffleArray([
                ...DRIVE2_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 2'})),
                ...DRIVE1_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'DRIVE 1'})),
                ...RANDOM_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'RANDOM TEST'})),
                ...ODD_QUESTIONS.map((q, i) => ({...q, originalIndex: i, source: 'ODD TEST'}))
            ]);
            break;
    }
    return questions;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

function startTest(testId) {
    currentTest = testId;
    currentQuestions = getTestQuestions(testId);
    currentIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(null);

    document.getElementById('testTitle').textContent = TEST_NAMES[testId];
    document.getElementById('totalQ').textContent = currentQuestions.length;

    buildDots();
    renderQuestion();
    showScreen('testScreen');
}

function buildDots() {
    const container = document.getElementById('questionDots');
    container.innerHTML = '';
    // Limit dots for large tests
    const maxDots = Math.min(currentQuestions.length, 60);
    for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'q-dot';
        dot.title = `Pregunta ${i + 1}`;
        dot.onclick = () => goToQuestion(i);
        container.appendChild(dot);
    }
    updateDots();
}

function updateDots() {
    const dots = document.querySelectorAll('.q-dot');
    const maxDots = Math.min(currentQuestions.length, 60);
    for (let i = 0; i < maxDots; i++) {
        dots[i].className = 'q-dot';
        if (i === currentIndex) dots[i].classList.add('current');
        else if (currentQuestions[i].notVisible) dots[i].classList.add('skipped-dot');
        else if (userAnswers[i] !== null) dots[i].classList.add('answered');
    }
}

function renderQuestion() {
    const q = currentQuestions[currentIndex];
    const isNotVisible = q.notVisible === true;
    const hasOptions = q.o && q.o.length > 0 && !isNotVisible;

    document.getElementById('currentQ').textContent = currentIndex + 1;

    // Progress
    const pct = ((currentIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progressFill').style.width = pct + '%';

    // Question number badge
    const sourceLabel = q.source ? ` · ${q.source}` : '';
    document.getElementById('questionNumber').textContent = `Pregunta ${currentIndex + 1} de ${currentQuestions.length}${sourceLabel}`;

    // Question text
    document.getElementById('questionText').textContent = cleanText(q.q);

    // Warning for not-visible questions
    const warningEl = document.getElementById('questionWarning');
    warningEl.style.display = isNotVisible ? 'block' : 'none';

    // Options
    const optList = document.getElementById('optionsList');
    optList.innerHTML = '';

    if (hasOptions) {
        q.o.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            if (userAnswers[currentIndex] === idx) btn.classList.add('selected');

            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            btn.innerHTML = `
                <span class="option-letter">${letter}</span>
                <span class="option-text">${cleanText(opt)}</span>
            `;
            btn.onclick = () => selectOption(idx);
            optList.appendChild(btn);
        });
    } else if (isNotVisible) {
        const info = document.createElement('div');
        info.style.cssText = 'text-align:center; color: var(--text-muted); padding: 20px; font-style: italic;';
        info.textContent = 'Esta pregunta no tiene opciones disponibles. Pasa a la siguiente.';
        optList.appendChild(info);
    }

    // Navigation buttons
    document.getElementById('btnPrev').disabled = currentIndex === 0;
    
    const isLast = currentIndex === currentQuestions.length - 1;
    document.getElementById('btnNext').style.display = isLast ? 'none' : '';
    document.getElementById('btnFinish').style.display = isLast ? '' : 'none';

    updateDots();
}

function selectOption(idx) {
    userAnswers[currentIndex] = idx;
    renderQuestion();
}

function nextQuestion() {
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
        document.querySelector('.question-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
        document.querySelector('.question-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function goToQuestion(idx) {
    currentIndex = idx;
    renderQuestion();
}

function finishTest() {
    calculateResults();
    showScreen('resultsScreen');
}

function calculateResults() {
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    let skipped = 0; // not visible questions
    let answerable = 0;

    currentQuestions.forEach((q, i) => {
        if (q.notVisible) {
            skipped++;
            return;
        }
        answerable++;
        if (userAnswers[i] === null) {
            blank++;
        } else {
            const selectedLetter = String.fromCharCode(97 + userAnswers[i]); // a, b, c, d
            if (q.ans && q.ans !== '' && selectedLetter === q.ans) {
                correct++;
            } else {
                wrong++;
            }
        }
    });

    // Scoring: each correct = pointsPerCorrect, each wrong = -pointsPerCorrect/3
    const pointsPerCorrect = answerable > 0 ? 10 / answerable : 0;
    const penalty = pointsPerCorrect / 3;

    let rawScore = (correct * pointsPerCorrect) - (wrong * penalty);
    rawScore = Math.max(0, rawScore);
    rawScore = Math.min(10, rawScore);

    document.getElementById('resultsTestName').textContent = TEST_NAMES[currentTest];
    document.getElementById('statCorrect').textContent = correct;
    document.getElementById('statWrong').textContent = wrong;
    document.getElementById('statBlank').textContent = blank;
    document.getElementById('statSkipped').textContent = skipped;

    // Score display
    const scoreValue = rawScore.toFixed(2);
    document.getElementById('scoreValue').textContent = scoreValue;

    // Animate circle
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = circumference - (rawScore / 10) * circumference;
    const fg = document.getElementById('scoreFg');
    
    // Set color based on score
    let color = '#f87171'; // red
    if (rawScore >= 5) color = '#fbbf24'; // yellow
    if (rawScore >= 7) color = '#34d399'; // green
    fg.style.stroke = color;
    
    setTimeout(() => {
        fg.style.strokeDashoffset = offset;
    }, 100);

    // Scoring info
    const info = document.getElementById('scoringInfo');
    info.innerHTML = `
        <strong>Sistema de puntuación:</strong><br>
        Total preguntas evaluables: ${answerable} | No visibles: ${skipped}<br>
        Valor por acierto: ${pointsPerCorrect.toFixed(4)} puntos<br>
        Penalización por fallo: -${penalty.toFixed(4)} puntos (1/3 del acierto)<br>
        Preguntas en blanco: 0 puntos
    `;

    // Hide review initially
    document.getElementById('reviewSection').style.display = 'none';
}

function reviewTest() {
    const section = document.getElementById('reviewSection');
    const list = document.getElementById('reviewList');

    if (section.style.display === 'block') {
        section.style.display = 'none';
        return;
    }

    list.innerHTML = '';

    currentQuestions.forEach((q, i) => {
        const isNotVisible = q.notVisible === true;
        const item = document.createElement('div');
        const correctIdx = q.ans ? q.ans.charCodeAt(0) - 97 : -1; // a=0, b=1, c=2, d=3
        const userIdx = userAnswers[i];
        const isCorrect = userIdx !== null && userIdx === correctIdx;
        const isWrong = userIdx !== null && userIdx !== correctIdx;
        
        let statusClass = 'review-blank';
        if (isNotVisible) statusClass = 'review-skipped';
        else if (isCorrect) statusClass = 'review-correct';
        else if (isWrong) statusClass = 'review-wrong';
        
        item.className = `review-item ${statusClass}`;

        const sourceLabel = q.source ? ` <small style="color:var(--text-muted);">[${q.source}]</small>` : '';

        let optionsHtml = '';
        if (q.o && q.o.length > 0 && !isNotVisible) {
            optionsHtml = '<div class="review-options">';
            q.o.forEach((opt, idx) => {
                let cls = '';
                if (idx === correctIdx) cls = 'is-correct';  // Always show correct answer in green
                if (idx === userIdx && isWrong) cls += ' is-user-wrong'; // User's wrong answer in red
                if (idx === userIdx && isCorrect) cls = 'is-user-correct'; // User's correct answer
                optionsHtml += `<div class="review-opt ${cls}">${cleanText(opt)}</div>`;
            });
            optionsHtml += '</div>';
        }

        let warningHtml = '';
        if (isNotVisible) {
            warningHtml = '<div class="review-warning">⚠️ Pregunta no visible en el documento original</div>';
        }

        let resultBadge = '';
        if (!isNotVisible) {
            if (isCorrect) resultBadge = '<span style="color:var(--success);font-weight:700;">✅ Correcta</span>';
            else if (isWrong) resultBadge = '<span style="color:var(--danger);font-weight:700;">❌ Incorrecta</span>';
            else resultBadge = '<span style="color:var(--text-muted);font-weight:500;">⬜ Sin responder</span>';
        }

        item.innerHTML = `
            <div class="review-q-number">Pregunta ${i + 1}${sourceLabel} ${resultBadge}</div>
            <div class="review-q-text">${cleanText(q.q)}</div>
            ${warningHtml}
            ${optionsHtml}
        `;

        list.appendChild(item);
    });

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
}

function retryTest() {
    // Reset score circle
    document.getElementById('scoreFg').style.strokeDashoffset = 2 * Math.PI * 54;
    startTest(currentTest);
}

function goToMenu() {
    // Reset score circle
    document.getElementById('scoreFg').style.strokeDashoffset = 2 * Math.PI * 54;
    showScreen('menuScreen');
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('testScreen').classList.contains('active')) return;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextQuestion();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevQuestion();
    } else if (['1','2','3','4','a','b','c','d'].includes(e.key.toLowerCase())) {
        const q = currentQuestions[currentIndex];
        if (q.notVisible) return;
        let idx;
        if (['a','1'].includes(e.key.toLowerCase())) idx = 0;
        else if (['b','2'].includes(e.key.toLowerCase())) idx = 1;
        else if (['c','3'].includes(e.key.toLowerCase())) idx = 2;
        else if (['d','4'].includes(e.key.toLowerCase())) idx = 3;
        if (idx !== undefined && q.o && idx < q.o.length) selectOption(idx);
    }
});
