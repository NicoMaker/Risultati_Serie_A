// Pulsante flottante
Object.assign(SeasonPageApp.prototype, {
  initFloatingButton() {
    const backBtn = document.querySelector(".back-to-home-btn");
    if (!backBtn) return;
    setTimeout(() => {
      backBtn.classList.add("visible");
    }, 500);
  }
});

// Inizializzazione dell'applicazione
document.addEventListener("DOMContentLoaded", () => {
  const app = new SeasonPageApp();
  app.init();
});
