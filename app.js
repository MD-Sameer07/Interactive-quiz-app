/* Simple front-end quiz app using localStorage
   Features:
   - Register / login (localStorage)
   - Create quizzes with multiple choice questions
   - Take quizzes with instant feedback
   - Store scores per user
   - Accessible and responsive basics
*/

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sections = {
    account: document.getElementById('account-section'),
    create: document.getElementById('create-section'),
    play: document.getElementById('play-section'),
    score: document.getElementById('score-section')
  };
  const navCreate = document.getElementById('nav-create');
  const navPlay = document.getElementById('nav-play');
  const navScore = document.getElementById('nav-score');
  const navAccount = document.getElementById('nav-account');

  // AUTH
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const accountInfo = document.getElementById('account-info');
  const authForms = document.getElementById('auth-forms');
  const userNameSpan = document.getElementById('user-name');
  const userEmailSpan = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');

  // CREATE
  const quizMetaForm = document.getElementById('quiz-meta-form');
  const startAddingBtn = document.getElementById('start-adding');
  const questionBuilder = document.getElementById('question-builder');
  const qIndexSpan = document.getElementById('q-index');
  const qText = document.getElementById('q-text');
  const qOpts = Array.from(document.querySelectorAll('.q-opt'));
  const qCorrect = document.getElementById('q-correct');
  const qExpl = document.getElementById('q-expl');
  const addQuestionBtn = document.getElementById('add-question');
  const finishQuizBtn = document.getElementById('finish-quiz');
  const createdQuestionsDiv = document.getElementById('created-questions');

  // PLAY
  const quizList = document.getElementById('quiz-list');
  const quizRun = document.getElementById('quiz-run');
  const runTitle = document.getElementById('run-title');
  const questionArea = document.getElementById('question-area');
  const runControls = document.getElementById('run-controls');
  const prevQBtn = document.getElementById('prev-q');
  const nextQBtn = document.getElementById('next-q');
  const submitQuizBtn = document.getElementById('submit-quiz');
  const timerDiv = document.getElementById('timer');

  // SCORE
  const scoreList = document.getElementById('score-list');
  const clearScoresBtn = document.getElementById('clear-scores');

  // Templates
  const quizCardTemplate = document.getElementById('quiz-card-template');

  // App state
  let currentUser = null;  // {name,email}
  let currentQuizDraft = null; // {title,desc,time,q:[]}
  let createdQuizzes = loadData('quizzes') || [];
  let currentRun = null; // runtime during taking a quiz

  // init
  showSection('account');
  renderQuizzes();
  renderScores();

  // Helpers
  function saveData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function loadData(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e){ return null; }
  }

  // AUTH handlers
  registerForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pw = document.getElementById('reg-password').value;
    if(!name||!email||pw.length<6){ alert('Please fill valid details (password min 6 chars).'); return; }
    const users = loadData('users')||{};
    if(users[email]){ alert('Email already registered. Please login.'); return; }
    users[email] = {name, email, password: pw};
    saveData('users', users);
    loginUser(users[email]);
    registerForm.reset();
  };

  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-password').value;
    const users = loadData('users')||{};
    if(users[email] && users[email].password === pw){
      loginUser(users[email]);
      loginForm.reset();
    } else {
      alert('Invalid credentials.');
    }
  };

  function loginUser(user) {
    currentUser = {name: user.name, email: user.email};
    userNameSpan.textContent = currentUser.name;
    userEmailSpan.textContent = currentUser.email;
    accountInfo.classList.remove('hidden');
    authForms.classList.add('hidden');
    showSection('create');
  }

  logoutBtn.onclick = () => {
    currentUser = null;
    accountInfo.classList.add('hidden');
    authForms.classList.remove('hidden');
    showSection('account');
  };

  // Navigation
  navCreate.onclick = () => showSection('create');
  navPlay.onclick = () => showSection('play');
  navScore.onclick = () => showSection('score');
  navAccount.onclick = () => showSection('account');

  function showSection(name) {
    for(const k in sections){
      if(k===name) sections[k].classList.remove('hidden'); else sections[k].classList.add('hidden');
    }
    // accessibility: move focus to main
    document.getElementById('main').focus();
    // render specifics
    if(name==='play') renderQuizzes();
    if(name==='score') renderScores();
  }

  // QUIZ creation flow
  startAddingBtn.onclick = () => {
    const title = document.getElementById('quiz-title').value.trim();
    if(!title){ alert('Please add a title'); return; }
    currentQuizDraft = {
      id: 'qz_'+Date.now(),
      title,
      desc: document.getElementById('quiz-desc').value.trim(),
      timeMin: Number(document.getElementById('quiz-time').value) || 0,
      author: currentUser ? currentUser.email : 'guest',
      questions: []
    };
    questionBuilder.classList.remove('hidden');
    quizMetaForm.classList.add('hidden');
    qIndexSpan.textContent = currentQuizDraft.questions.length + 1;
    createdQuestionsDiv.innerHTML = '';
  };

  addQuestionBtn.onclick = () => {
    const text = qText.value.trim();
    const opts = qOpts.map(o=>o.value.trim());
    const correct = Number(qCorrect.value);
    if(!text || opts.some(o=>o==='')){ alert('Question text and all 4 options required.'); return; }
    const q = {id:'q_'+Date.now(),'text':text,'options':opts,'correct':correct,'explanation':qExpl.value.trim()};
    currentQuizDraft.questions.push(q);
    renderDraftQuestions();
    // clear builder for next
    qText.value=''; qOpts.forEach(o=>o.value=''); qExpl.value=''; qCorrect.value=0;
    qIndexSpan.textContent = currentQuizDraft.questions.length + 1;
  };

  function renderDraftQuestions(){
    createdQuestionsDiv.innerHTML = '';
    currentQuizDraft.questions.forEach((q,i)=>{
      const div = document.createElement('div');
      div.className = 'quiz-card';
      div.innerHTML = `<strong>Q${i+1}:</strong> ${escapeHtml(q.text)} <div style="font-size:0.9rem;color:#6b7280">Correct: ${['A','B','C','D'][q.correct]}</div>`;
      createdQuestionsDiv.appendChild(div);
    });
  }

  finishQuizBtn.onclick = () => {
    if(!currentQuizDraft) return;
    if(currentQuizDraft.questions.length===0){ alert('Add at least one question.'); return; }
    createdQuizzes.push(currentQuizDraft);
    saveData('quizzes', createdQuizzes);
    currentQuizDraft = null;
    questionBuilder.classList.add('hidden');
    quizMetaForm.classList.remove('hidden');
    quizMetaForm.reset();
    renderQuizzes();
    alert('Quiz saved! You can find it in Take Quiz.');
  };

  // Render quizzes to play
  function renderQuizzes(){
    quizList.innerHTML = '';
    if(!createdQuizzes || createdQuizzes.length===0){
      quizList.innerHTML = '<p class="muted">No quizzes yet. Create one!</p>';
      return;
    }
    createdQuizzes.forEach((q, idx) => {
      const node = quizCardTemplate.content.cloneNode(true);
      node.querySelector('.qc-title').textContent = q.title;
      node.querySelector('.qc-desc').textContent = q.desc || '';
      node.querySelector('.qc-meta').textContent = `${q.questions.length} question(s) • ${q.timeMin ? q.timeMin+' min' : 'No time limit'}`;
      const takeBtn = node.querySelector('.take-btn');
      const editBtn = node.querySelector('.edit-btn');
      const delBtn = node.querySelector('.delete-btn');

      takeBtn.onclick = () => startQuizRun(idx);
      editBtn.onclick = () => editQuiz(idx);
      delBtn.onclick = () => {
        if(confirm('Delete this quiz?')) {
          createdQuizzes.splice(idx,1);
          saveData('quizzes', createdQuizzes);
          renderQuizzes();
        }
      };

      quizList.appendChild(node);
    });
  }

  // Edit quiz: for simplicity, load into draft builder
  function editQuiz(idx){
    if(!currentUser || createdQuizzes[idx].author !== (currentUser && currentUser.email) ){
      if(!confirm('You are not the author. Load quiz into editor as a copy?')) return;
    }
    const q = JSON.parse(JSON.stringify(createdQuizzes[idx]));
    currentQuizDraft = q;
    // populate meta
    document.getElementById('quiz-title').value = q.title;
    document.getElementById('quiz-desc').value = q.desc;
    document.getElementById('quiz-time').value = q.timeMin || 0;
    quizMetaForm.classList.add('hidden');
    questionBuilder.classList.remove('hidden');
    renderDraftQuestions();
    qIndexSpan.textContent = currentQuizDraft.questions.length + 1;
  }

  // Quiz run logic
  function startQuizRun(idx){
    const quiz = createdQuizzes[idx];
    currentRun = {
      quizIdx: idx,
      quiz,
      answers: Array(quiz.questions.length).fill(null),
      currentQ: 0,
      startTime: Date.now(),
      timeLimitMs: quiz.timeMin ? quiz.timeMin*60*1000 : 0,
      timerHandle: null
    };
    runTitle.textContent = quiz.title;
    quizRun.classList.remove('hidden');
    quizList.classList.add('hidden');
    renderRunQuestion();
    if(currentRun.timeLimitMs){
      timerDiv.classList.remove('hidden');
      updateTimer();
      currentRun.timerHandle = setInterval(updateTimer, 1000);
    } else {
      timerDiv.classList.add('hidden');
    }
    runControls.classList.remove('hidden');
  }

  function updateTimer(){
    const elapsed = Date.now() - currentRun.startTime;
    const remaining = currentRun.timeLimitMs - elapsed;
    if(remaining <= 0){
      clearInterval(currentRun.timerHandle);
      timerDiv.textContent = 'Time up!';
      submitQuiz();
      return;
    }
    const mins = Math.floor(remaining/60000);
    const secs = Math.floor((remaining%60000)/1000).toString().padStart(2,'0');
    timerDiv.textContent = `Time left: ${mins}:${secs}`;
  }

  function renderRunQuestion(){
    const qidx = currentRun.currentQ;
    const q = currentRun.quiz.questions[qidx];
    questionArea.innerHTML = '';
    const qh = document.createElement('div');
    qh.innerHTML = `<strong>Question ${qidx+1} of ${currentRun.quiz.questions.length}</strong><p>${escapeHtml(q.text)}</p>`;
    questionArea.appendChild(qh);

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.setAttribute('role','button');
      btn.setAttribute('aria-pressed','false');
      btn.tabIndex = 0;
      btn.innerHTML = `<span style="font-weight:600;margin-right:10px">${String.fromCharCode(65+i)}.</span> ${escapeHtml(opt)}`;
      btn.onclick = () => {
        // store answer and show feedback
        currentRun.answers[qidx] = i;
        // visual feedback
        Array.from(questionArea.querySelectorAll('.option-btn')).forEach(b=>b.classList.remove('correct','wrong'));
        if(i === q.correct){
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          // highlight correct
          const correctBtn = questionArea.querySelectorAll('.option-btn')[q.correct];
          if(correctBtn) correctBtn.classList.add('correct');
        }
        // show explanation
        if(q.explanation){
          let ex = questionArea.querySelector('.explain');
          if(!ex){ ex = document.createElement('div'); ex.className='explain muted'; questionArea.appendChild(ex); }
          ex.textContent = 'Explanation: ' + q.explanation;
        }
      };
      questionArea.appendChild(btn);
    });

    // pre-select if answered
    const prevAnswer = currentRun.answers[qidx];
    if(prevAnswer !== null){
      const btns = questionArea.querySelectorAll('.option-btn');
      btns[prevAnswer].click();
    }

    // controls: prev/next disable logic
    prevQBtn.disabled = qidx === 0;
    nextQBtn.disabled = qidx === currentRun.quiz.questions.length - 1;
  }

  prevQBtn.onclick = () => { if(currentRun.currentQ>0){ currentRun.currentQ--; renderRunQuestion(); } };
  nextQBtn.onclick = () => { if(currentRun.currentQ<currentRun.quiz.questions.length-1){ currentRun.currentQ++; renderRunQuestion(); } };
  submitQuizBtn.onclick = () => {
    if(!confirm('Submit quiz?')) return;
    submitQuiz();
  };

  function submitQuiz(){
    if(currentRun.timerHandle) clearInterval(currentRun.timerHandle);
    // calculate score
    const total = currentRun.quiz.questions.length;
    let correct = 0;
    currentRun.quiz.questions.forEach((q,i) => {
      if(currentRun.answers[i] === q.correct) correct++;
    });
    const percent = Math.round((correct/total)*100);
    // store score per user
    const scores = loadData('scores') || [];
    scores.push({
      user: currentUser ? currentUser.email : 'guest',
      name: currentUser ? currentUser.name : 'Guest',
      quizTitle: currentRun.quiz.title,
      total,
      correct,
      percent,
      date: new Date().toISOString()
    });
    saveData('scores', scores);

    // show results summary
    questionArea.innerHTML = `<h3>Results</h3>
      <p>You scored <strong>${correct}/${total}</strong> (${percent}%)</p>
      <button id="view-details">View detailed feedback</button>
      <button id="finish-run">Finish</button>`;

    document.getElementById('view-details').onclick = () => showDetailedFeedback();
    document.getElementById('finish-run').onclick = () => finishRun();

    runControls.classList.add('hidden');
    renderScores();
  }

  function showDetailedFeedback(){
    const wrap = document.createElement('div');
    currentRun.quiz.questions.forEach((q,i) => {
      const div = document.createElement('div');
      div.className = 'panel';
      div.innerHTML = `<strong>Q${i+1}:</strong> ${escapeHtml(q.text)}<div> Your answer: ${formatAnswer(currentRun.answers[i])} • Correct: ${formatAnswer(q.correct)}</div>`;
      if(q.explanation) div.innerHTML += `<div class="muted">Explanation: ${escapeHtml(q.explanation)}</div>`;
      wrap.appendChild(div);
    });
    questionArea.innerHTML = '';
    questionArea.appendChild(wrap);
  }

  function finishRun(){
    quizRun.classList.add('hidden');
    quizList.classList.remove('hidden');
    questionArea.innerHTML = '';
    currentRun = null;
    renderQuizzes();
  }

  function formatAnswer(idx){
    if(idx === null || idx === undefined) return 'No answer';
    return `${String.fromCharCode(65+idx)}`;
  }

  // Scores
  function renderScores(){
    const scores = loadData('scores') || [];
    const userScores = currentUser ? scores.filter(s=>s.user===currentUser.email) : [];
    scoreList.innerHTML = '';
    if(!userScores.length){
      scoreList.innerHTML = '<p class="muted">No scores yet. Take a quiz to generate scores.</p>';
      return;
    }
    userScores.slice().reverse().forEach(s=>{
      const d = document.createElement('div');
      d.className = 'quiz-card';
      d.innerHTML = `<strong>${escapeHtml(s.quizTitle)}</strong><div class="muted">${new Date(s.date).toLocaleString()}</div>
        <div style="margin-top:10px">Score: <strong>${s.correct}/${s.total}</strong> (${s.percent}%)</div>`;
      scoreList.appendChild(d);
    });
  }

  clearScoresBtn.onclick = () => {
    if(!currentUser){ alert('Login to clear your scores.'); return; }
    let scores = loadData('scores') || [];
    scores = scores.filter(s=>s.user !== currentUser.email);
    saveData('scores', scores);
    renderScores();
  };

  // Utility
  function escapeHtml(str){
    if(!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
});
