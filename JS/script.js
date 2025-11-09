/**
 * Funzione di confronto (comparator) per ordinare le squadre in classifica.
 * Implementa la regola di spareggio richiesta:
 * 1. Ordine Primario: Punti (decrescente).
 * 2. Ordine Secondario (Spareggio): Partite Giocate (crescente - meno partite è meglio).
 *
 * Questa funzione può essere utilizzata per ordinare array di squadre (es. teamArray.sort(ordinaClassificaSquadre)).
 *
 * @param {Object} squadraA - Oggetto squadra con proprietà 'punti' e 'partiteGiocate'.
 * @param {Object} squadraB - Oggetto squadra con proprietà 'punti' e 'partiteGiocate'.
 * @returns {number} Risultato del confronto per l'ordinamento.
 */
function ordinaClassificaSquadre(squadraA, squadraB) {
  // 1. Ordine Primario: Punti (dal più alto al più basso)
  if (squadraA.punti !== squadraB.punti) {
    return squadraB.punti - squadraA.punti; // Ordine decrescente
  }

  // 2. Regola di Spareggio: Se i punti sono uguali, meno partite giocate è meglio
  if (squadraA.partiteGiocate !== squadraB.partiteGiocate) {
    return squadraA.partiteGiocate - squadraB.partiteGiocate; // Ordine crescente (meno partite prima)
  }

  // 3. Spareggio Finale
  return 0;
}

// =========================================================================
// CLASSE PRINCIPALE PER LA GESTIONE DELLA PAGINA GENERALE DELLE STAGIONI
// =========================================================================

Class SerieAApp {
  constructor() {
    this.seasonsGrid = document.getElementById("seasonsGrid");
    this.themeToggle = document.getElementById("theme-toggle");
  }

  init() {
    console.log("Inizializzazione pagina Generale Stagioni");
    this.initTheme();
    this.loadSeasons();
    this.initOnlineStatusHandling();
  }

  // --- Theme Management ---
  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    if (this.themeToggle) {
        this.themeToggle.addEventListener("click", () => {
            let currentTheme = document.documentElement.classList.contains("light")
                ? "light"
                : "dark";
            const newTheme = currentTheme === "light" ? "dark" : "light";
            this.applyTheme(newTheme);
            localStorage.setItem("theme", newTheme);
        });
    }
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector(".theme-icon");
    icon && (icon.textContent = theme === "light" ? "🌙" : "🌞");
    this.themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "Attiva tema scuro" : "Attiva tema chiaro"
    );
  }

  // --- Data Loading and Rendering ---
  createSeasonCard(season, isCurrent) {
    const currentBadge = isCurrent
      ? '<div class="current-badge">In corso</div>'
      : "";
    // Controlla se 'champion' è definito e non nullo o stringa vuota
    const championBadge = season.champion && season.champion.trim() !== ''
      ? `<div class="champion-badge">${season.champion}</div>`
      : "";

    // NOTA: Ho aggiunto il tag di chiusura </a> che mancava nell'HTML originale
    return `
      <a href="${season.url}" class="season-card" style="--bg-image: url('${season.logo}')">
        <div class="card-shine"></div>
        ${currentBadge}
        <div class="season-card-header">
            <img src="${season.logo}" alt="Stagione ${season.year}" class="season-logo">
            <div class="season-year">${season.year}</div>
        </div>
        <div class="season-card-content">
            <h3 class="season-title">${season.title}</h3>
            ${championBadge}
        </div>
        <div class="card-border"></div>
      </a>
    `;
  }

  async loadSeasons() {
    if (!this.seasonsGrid) {
        console.error("Elemento seasonsGrid non trovato.");
        return;
    }

    try {
      this.seasonsGrid.innerHTML = '<div class="loading-message">Caricamento stagioni...</div>';
      
      const response = await fetch("JS/seasons-data.json");
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Ordinamento delle stagioni: dal più recente al meno recente
      const sortedSeasons = data.seasons.sort((a, b) => {
        const yearA = parseInt(a.year.split("-")[0], 10);
        const yearB = parseInt(b.year.split("-")[0], 10);
        return yearB - yearA;
      });

      if (sortedSeasons.length === 0) {
        this.seasonsGrid.innerHTML =
          '<div class="error-message">Nessuna stagione trovata.</div>';
        return;
      }

      const seasonsHtml = sortedSeasons
        .map((season, index) => {
          // Assicura che la proprietà champion esista e che sia gestita correttamente
          const championValue = season.champion || null; 
          
          // La stagione è in corso se è la più recente (indice 0) E non ha ancora un campione
          const isCurrent = index === 0 && (championValue === null || championValue.trim() === '');
          
          return this.createSeasonCard({ ...season, champion: championValue }, isCurrent);
        })
        .join("");

      this.seasonsGrid.innerHTML = seasonsHtml;
      console.log(`Caricate ${sortedSeasons.length} stagioni con successo`);
    } catch (error) {
      console.error("Errore nel caricamento delle stagioni:", error);
      let errorMessage = "Si è verificato un errore imprevisto durante il caricamento delle stagioni.";
      
      if (error.message.includes("HTTP")) {
          errorMessage = `Impossibile caricare i dati. Errore del server: ${error.message.split(' - ')[0]}.`;
      } else if (error instanceof TypeError) {
        errorMessage =
          "Impossibile caricare i dati. Verifica la connessione o che il file `seasons-data.json` esista.";
      } else if (error instanceof SyntaxError) {
        errorMessage =
          "Il file dei dati (`seasons-data.json`) sembra essere corrotto.";
      }
      this.seasonsGrid.innerHTML = `<div class="error-message">🚨 ${errorMessage}</div>`;
    }
  }

  // --- Event Handling ---
  initOnlineStatusHandling() {
    window.addEventListener("online", () => {
      console.log("Connessione ripristinata");
      this.loadSeasons();
    });

    window.addEventListener("offline", () => {
      console.log("Connessione persa");
    });
  }
}

// =========================================================================
// INIZIALIZZAZIONE
// =========================================================================

// Initialize l'app al caricamento completo del DOM
document.addEventListener("DOMContentLoaded", () => {
  const app = new SerieAApp();
  app.init();
});

// Popolamento dinamico del footer
const footerElement = document.getElementById("footer");
if (footerElement) {
    footerElement.innerHTML = `
      <footer>
          <div class="copyright">
              © ${new Date().getFullYear()} Generale Stagioni. Tutti i diritti riservati.
          </div>
      </footer>`;
} else {
    console.warn("Elemento 'footer' non trovato. Impossibile popolare il footer.");
}
