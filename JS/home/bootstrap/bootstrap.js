// Gestione stato connessione + avvio applicazione
Object.assign(SerieAApp.prototype, {
  initOnlineStatusHandling() {
    window.addEventListener("online", () => {
      console.log("Connessione ripristinata");
      this.loadSeasons();
    });

    window.addEventListener("offline", () => {
      console.log("Connessione persa");
    });
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const app = new SerieAApp();
  app.init();
});

document.getElementById("footer").innerHTML = `
  <footer>
      <div class="copyright">
          © ${new Date().getFullYear()} Generale Stagioni. Tutti i diritti riservati.
      </div>
  </footer>`;
