class SerieAApp {
  constructor() {
    this.seasonsGrid = document.getElementById("seasonsGrid");
    this.themeToggle = document.getElementById("theme-toggle");
    this.calendar = null; // Sarà popolato per calcolare gli scontri diretti
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

  // --- Head-to-Head Calculation ---
  calculateHeadToHead(team1, team2, calendar) {
    if (!calendar || !Array.isArray(calendar)) {
      return null;
    }

    let h2h = {
      team1: { points: 0, goalsFor: 0, goalsAgainst: 0 },
      team2: { points: 0, goalsFor: 0, goalsAgainst: 0 },
    };

    calendar.forEach((giornata) => {
      if (!giornata.partite) return;

      giornata.partite.forEach((match) => {
        // Salta partite non ancora giocate
        if (match.homeScore === null || match.awayScore === null) return;

        const isTeam1Home =
          match.home === team1.name && match.away === team2.name;
        const isTeam1Away =
          match.away === team1.name && match.home === team2.name;

        if (isTeam1Home) {
          h2h.team1.goalsFor += match.homeScore;
          h2h.team1.goalsAgainst += match.awayScore;
          h2h.team2.goalsFor += match.awayScore;
          h2h.team2.goalsAgainst += match.homeScore;

          if (match.homeScore > match.awayScore) {
            h2h.team1.points += 3;
          } else if (match.homeScore < match.awayScore) {
            h2h.team2.points += 3;
          } else {
            h2h.team1.points += 1;
            h2h.team2.points += 1;
          }
        } else if (isTeam1Away) {
          h2h.team1.goalsFor += match.awayScore;
          h2h.team1.goalsAgainst += match.homeScore;
          h2h.team2.goalsFor += match.homeScore;
          h2h.team2.goalsAgainst += match.awayScore;

          if (match.awayScore > match.homeScore) {
            h2h.team1.points += 3;
          } else if (match.awayScore < match.homeScore) {
            h2h.team2.points += 3;
          } else {
            h2h.team1.points += 1;
            h2h.team2.points += 1;
          }
        }
      });
    });

    return h2h;
  }

  // --- Sorting Logic (Regole ufficiali Serie A) ---
  sortTeamsByRanking(teams, calendar) {
    return teams.sort((a, b) => {
      // 1. Ordina per punti (decrescente)
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      // 2. A parità di punti: SCONTRI DIRETTI
      if (calendar) {
        const h2h = this.calculateHeadToHead(a, b, calendar);

        if (h2h) {
          // 2a. Punti negli scontri diretti
          if (h2h.team1.points !== h2h.team2.points) {
            return h2h.team2.points - h2h.team1.points;
          }

          // 2b. Differenza reti negli scontri diretti
          const h2hDiffA = h2h.team1.goalsFor - h2h.team1.goalsAgainst;
          const h2hDiffB = h2h.team2.goalsFor - h2h.team2.goalsAgainst;
          if (h2hDiffA !== h2hDiffB) {
            return h2hDiffB - h2hDiffA;
          }

          // 2c. Gol segnati negli scontri diretti
          if (h2h.team1.goalsFor !== h2h.team2.goalsFor) {
            return h2h.team2.goalsFor - h2h.team1.goalsFor;
          }
        }
      }

      // 3. Differenza reti generale (decrescente)
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      if (goalDiffB !== goalDiffA) {
        return goalDiffB - goalDiffA;
      }

      // 4. Gol fatti generale (decrescente)
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      // 5. Ordine alfabetico (in attesa di sorteggio)
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
      data.seasons.forEach((season) => {
        if (season.teams && Array.isArray(season.teams)) {
          // Passa il calendario per calcolare gli scontri diretti
          const calendar = season.calendar || null;
          season.teams = this.sortTeamsByRanking(season.teams, calendar);
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
