// Condivisione risultati via WhatsApp
Object.assign(SeasonPageApp.prototype, {
  initWhatsAppButtons() {
    // Pulsante classifica
    const standingsBtn = document.getElementById("whatsapp-standings-btn");
    if (standingsBtn) {
      standingsBtn.addEventListener("click", () =>
        this.shareStandingsOnWhatsApp(),
      );
    }

    // Pulsanti giornate (delegazione eventi)
    this.calendarContainer.addEventListener("click", (e) => {
      if (e.target.closest(".whatsapp-day-btn")) {
        const btn = e.target.closest(".whatsapp-day-btn");
        const giornata = parseInt(btn.dataset.giornata);
        this.shareDayOnWhatsApp(giornata);
      }
    });
  },

  shareDayOnWhatsApp(giornataNum) {
    const dayData = this.data.calendar.find((d) => d.giornata === giornataNum);
    if (!dayData) {
      alert("Dati giornata non trovati!");
      return;
    }

    const seasonTitle = document.querySelector(
      "header h1 .title-text",
    ).textContent;
    const seasonSubtitle = document
      .querySelector("header p")
      .textContent.split("•")[0]
      .trim();

    let message = `*${seasonTitle}*\n`;
    message += `${seasonSubtitle}\n`;
    message += `${"=".repeat(40)}\n\n`;
    message += `*GIORNATA ${dayData.giornata}*\n`;
    message += `${"=".repeat(40)}\n\n`;

    dayData.partite.forEach((match) => {
      const homeScore = match.homeScore !== null ? match.homeScore : "?";
      const awayScore = match.awayScore !== null ? match.awayScore : "?";

      message += `${match.home} vs ${match.away}\n`;
      message += `   Risultato: ${homeScore} - ${awayScore}\n\n`;
    });

    message += `${"=".repeat(40)}\n`;
    message += `Serie A Archive`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
  },

  shareStandingsOnWhatsApp() {
    if (!this.data) {
      alert("Carica prima i dati della classifica!");
      return;
    }

    // Dati nell'ordine attualmente visualizzato
    let data = [...this._getActiveLeaderboardData()];

    if (this.sortColumn) {
      const col = this.sortColumn;
      const dir = this.sortDirection === "asc" ? 1 : -1;
      data.sort((a, b) => {
        if (col === "squadra") return dir * a.squadra.localeCompare(b.squadra);
        return dir * (a[col] - b[col]);
      });
    }

    if (data.length === 0) {
      alert("Nessun dato disponibile!");
      return;
    }

    const seasonTitle = document.querySelector(
      "header h1 .title-text",
    ).textContent;
    const seasonSubtitle = document
      .querySelector("header p")
      .textContent.split("•")[0]
      .trim();

    // Filtro vista
    const filterLabels = {
      globale: "CLASSIFICA COMPLETA",
      casa: "CLASSIFICA CASA",
      trasferta: "CLASSIFICA TRASFERTA",
    };
    let titleLabel = filterLabels[this.activeFilter] || "CLASSIFICA";

    // Filtro giornata — range
    const rounds = [...new Set(this.data.calendar.map((d) => d.giornata))].sort(
      (a, b) => a - b,
    );
    const firstRound = rounds[0];
    const lastRound = rounds[rounds.length - 1];
    const effectiveMin = this.minRound !== null ? this.minRound : firstRound;
    const effectiveMax = this.maxRound !== null ? this.maxRound : lastRound;
    const isAllRounds =
      effectiveMin === firstRound && effectiveMax === lastRound;
    const roundNote = isAllRounds
      ? "Tutte le giornate"
      : `Giornata ${String(effectiveMin).padStart(2, "0")} → Giornata ${String(effectiveMax).padStart(2, "0")}`;

    // Criterio ordinamento
    const criteriaLabels = {
      punti: "Punti",
      giocate: "Giornate",
      vinte: "Vittorie",
      pareggiate: "Pareggi",
      perse: "Sconfitte",
      golFatti: "Gol Fatti",
      golSubiti: "Gol Subiti",
      differenzaReti: "Diff. Reti",
      squadra: "Nome",
    };
    const col = this.sortColumn || "punti";
    const name = criteriaLabels[col] || col;
    const dir = this.sortDirection === "asc" ? "crescente ↑" : "decrescente ↓";
    const sortNote = `Ordinata per: ${name} (${dir})`;

    let message = `*${seasonTitle}*\n`;
    message += `${seasonSubtitle}\n`;
    message += `${"=".repeat(40)}\n\n`;
    message += `*${titleLabel}*\n`;
    message += `${roundNote}\n`;
    message += `${sortNote}\n`;
    message += `${"=".repeat(40)}\n\n`;

    data.forEach((team, index) => {
      const pos = index + 1;
      const dr =
        team.differenzaReti > 0
          ? `+${team.differenzaReti}`
          : `${team.differenzaReti}`;
      message += `${pos}. ${team.squadra}\n`;
      message += `   Pt: ${team.punti} | G: ${team.giocate} | V: ${team.vinte} | N: ${team.pareggiate} | P: ${team.perse}\n`;
      message += `   GF: ${team.golFatti} | GS: ${team.golSubiti} | DR: ${dr}\n\n`;
    });

    message += `${"=".repeat(40)}\n`;
    message += `Serie A Archive`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  }
});
