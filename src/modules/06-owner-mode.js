// Module 06: Owner Mode (Presentation Q&A and Claim Guardrails verification)

let ownerState = [false, false, false];

export function initOwnerMode() {
  try {
    const saved = JSON.parse(localStorage.getItem('liiOwnerProgress') || 'null');
    if (Array.isArray(saved) && saved.length === 3) {
      ownerState = saved.map(Boolean);
    }
  } catch (e) {
    // Fallback if localStorage blocked
  }

  document.querySelectorAll('.question-card').forEach((card) => {
    const idx = +card.dataset.owner;
    card.querySelectorAll('button[data-correct]').forEach((btn) => {
      btn.addEventListener('click', () => {
        card.querySelectorAll('button').forEach((b) => {
          b.classList.remove('correct', 'wrong');
          b.disabled = false;
        });

        const isCorrect = btn.dataset.correct === 'true';
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
          ownerState[idx] = true;
          card.querySelectorAll('button').forEach((b) => (b.disabled = true));
          updateOwner();
        }
      });
    });
  });

  const printBtn = document.getElementById('printSummary');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  updateOwner();
}

function updateOwner() {
  const dots = document.querySelectorAll('#ownerDots i');
  ownerState.forEach((v, i) => {
    if (dots[i]) dots[i].classList.toggle('done', v);
  });

  try {
    localStorage.setItem('liiOwnerProgress', JSON.stringify(ownerState));
  } catch (e) {}
}
