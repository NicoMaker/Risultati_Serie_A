class SerieAApp {
  constructor() {
    this.seasonsGrid = document.getElementById("seasonsGrid");
    this.themeToggle = document.getElementById("theme-toggle");
    this.seasonsData = null;
  }

  init() {
    console.log("Inizializzazione pagina Generale Stagioni");
    this.initTheme();
    this.renderDateline();
    this.loadSeasons();
    this.initOnlineStatusHandling();
    this.initWhatsAppButton();
  }

  // --- Dateline in stile testata giornale ---
  renderDateline() {
    const el = document.getElementById("dateline");
    if (!el) return;
    const formatted = new Date().toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    el.textContent = formatted;
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

  // --- Data Loading and Rendering ---
  createSeasonCard(season, isCurrent) {
    const statusBadge = isCurrent
      ? '<div class="current-badge">In corso</div>'
      : season.champion
        ? `<div class="champion-badge">${season.champion}</div>`
        : "";

    // Se la stagione ha un campione, mostra lo stemma della squadra
    // vincitrice al posto del logo generico Serie A.
    const hasChampionCrest = Boolean(season.champion && season.championLogo);
    const crestSrc = hasChampionCrest ? season.championLogo : season.logo;
    const crestAlt = hasChampionCrest
      ? `Scudetto ${season.champion}`
      : `Stagione ${season.year}`;
    const crestClass = hasChampionCrest
      ? "crest-wrap crest-wrap--champion"
      : "crest-wrap";

    return `
      <a href="${season.url}" class="season-card">
        <div class="season-card-main">
          <div class="${crestClass}">
            <img src="${crestSrc}" alt="${crestAlt}" class="season-logo">
          </div>
          <div class="season-card-body">
            <span class="season-tag">Stagione</span>
            <h3 class="season-title">${season.title}</h3>
            ${statusBadge}
            <span class="season-cta">Vai alla stagione <span class="season-cta-arrow" aria-hidden="true">→</span></span>
          </div>
        </div>
        <div class="ticket-perforation" aria-hidden="true"></div>
        <div class="ticket-stub">
          <span class="ticket-stub-year">${season.year}</span>
        </div>
      </a>
    `;
  }

  async loadSeasons() {
    try {
      const response = await fetch("data/seasons-data.json");
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
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

      this.seasonsData = sortedSeasons;

      const seasonsHtml = sortedSeasons
        .map((season, index) => {
          if (!("champion" in season)) {
            season.champion = null;
          }
          const isCurrent = index === 0 && !season.champion;
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

  // --- WhatsApp Share ---
  initWhatsAppButton() {
    const whatsappBtn = document.getElementById("whatsapp-share-seasons-btn");
    if (whatsappBtn) {
      whatsappBtn.addEventListener("click", () =>
        this.shareSeasonsOnWhatsApp(),
      );
    }
  }

  shareSeasonsOnWhatsApp() {
    if (!this.seasonsData || this.seasonsData.length === 0) {
      alert("Carica prima i dati delle stagioni!");
      return;
    }

    let message = "*SERIE A - ARCHIVIO STAGIONI*\n";
    message += `Riepilogo completo\n`;
    message += `${"=".repeat(40)}\n\n`;

    this.seasonsData.forEach((season) => {
      const statusText = season.champion ? "COMPLETATA" : "IN CORSO";
      const championText = season.champion
        ? `\n   Campione: ${season.champion}`
        : "";

      message += `*${season.year}* - ${statusText}${championText}\n\n`;
    });

    message += `${"=".repeat(40)}\n`;
    message += `Serie A Archive - ${this.seasonsData.length} stagioni disponibili`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
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
