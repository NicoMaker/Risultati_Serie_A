class SerieAApp {
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

    this.themeToggle.addEventListener("click", () => {
      let currentTheme = document.documentElement.classList.contains("light")
        ? "light"
        : "dark";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector(".theme-icon");
    icon && (icon.textContent = theme === "light" ? "🌙" : "🌞");
  }

  // --- Sorting Logic ---
  sortTeamsByRanking(teams) {
    return teams.sort((a, b) => {
      // 1. Ordina per punti (decrescente)
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      // 2. A parità di punti, ordina per differenza reti (decrescente)
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      if (goalDiffB !== goalDiffA) {
        return goalDiffB - goalDiffA;
      }

      // 3. A parità di punti e differenza reti, ordina per gol fatti (decrescente)
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      // 4. A parità di tutto quanto sopra, ordina per partite giocate (crescente - meno partite = posizione migliore)
      if (a.played !== b.played) {
        return a.played - b.played;
      }

      // 5. Infine ordina alfabeticamente per nome
      return a.name.localeCompare(b.name);
    });
  }

  // --- Data Loading and Rendering ---
  createSeasonCard(season, isCurrent) {
    const currentBadge = isCurrent
      ? '<div class="current-badge">In corso</div>'
      : "";
    const championBadge = season.champion
      ? `<div class="champion-badge">${season.champion}</div>`
      : "";

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
    try {
      const response = await fetch("JS/seasons-data.json");
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Ordina le squadre all'interno di ogni stagione
      data.seasons.forEach(season => {
        if (season.teams && Array.isArray(season.teams)) {
          season.teams = this.sortTeamsByRanking(season.teams);
        }
      });

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
          // Assicura che la proprietà champion esista
          if (!("champion" in season)) {
            season.champion = null;
          }
          const isCurrent = index === 0 && season.champion === null;
          return this.createSeasonCard(season, isCurrent);
        })
        .join("");

      this.seasonsGrid.innerHTML = seasonsHtml;
      console.log(`Caricate ${sortedSeasons.length} stagioni con successo`);
    } catch (error) {
      console.error("Errore nel caricamento delle stagioni:", error);
      let errorMessage =
        "Si è verificato un errore imprevisto durante il caricamento delle stagioni.";
      if (error instanceof TypeError) {
        errorMessage =
          "Impossibile caricare i dati. Verifica la connessione o che il file `seasons-data.json` esista.";
      } else if (error instanceof SyntaxError) {
        errorMessage =
          "Il file dei dati (`seasons-data.json`) sembra essere corrotto.";
      }
      this.seasonsGrid.innerHTML = `<div class="error-message">${errorMessage}</div>`;
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