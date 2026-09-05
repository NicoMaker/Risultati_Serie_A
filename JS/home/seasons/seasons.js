// Rendering delle card stagione e caricamento dati
Object.assign(SerieAApp.prototype, {
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
  },

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
  },
});
