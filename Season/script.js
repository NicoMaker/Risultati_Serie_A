class SeasonPageApp {
  constructor() {
    // Elementi UI principali
    this.calendarContainer = document.getElementById("calendar");
    this.leaderboardBody = document.getElementById("leaderboard-body");
    this.legendList = document.getElementById("legend-list");
    this.themeToggle = document.getElementById("theme-toggle");

    // Elementi per lo switch della vista
    this.showCalendarBtn = document.getElementById("show-calendar-btn");
    this.showSidebarBtn = document.getElementById("show-sidebar-btn");
    this.calendarSection = document.querySelector(".calendar-section");
    this.sidebarSection = document.querySelector(".sidebar");

    // Dati
    this.data = null;
    this.config = null;
    this.leaderboardData = [];
  }

  async init() {
    console.log("Inizializzazione pagina Stagione");
    this.initTheme();
    this.initViewSwitcher();
    await this.loadDataAndRender();
    this.initFloatingButton();
    this.initWhatsAppButtons();
  }

  // --- Gestione Tema ---
  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    this.themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.classList.contains("light");
      const newTheme = isLight ? "dark" : "light";
      this.applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    this._updateThemeIcon(theme);
  }

  _updateThemeIcon(theme) {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector(".theme-icon");
    icon && (icon.textContent = theme === "light" ? "🌙" : "🌞");
  }

  // --- Gestione Vista (Calendario/Classifica) ---
  initViewSwitcher() {
    this.showCalendarBtn.addEventListener("click", () =>
      this.switchView("calendar")
    );
    this.showSidebarBtn.addEventListener("click", () =>
      this.switchView("sidebar")
    );

    const savedView = localStorage.getItem("currentView") || "calendar";
    this.switchView(savedView);
  }

  switchView(view) {
    if (view === "calendar") {
      this.calendarSection.classList.remove("hidden");
      this.sidebarSection.classList.add("hidden");
      this.showCalendarBtn.classList.add("active");
      this.showSidebarBtn.classList.remove("active");
      localStorage.setItem("currentView", "calendar");
    } else {
      this.calendarSection.classList.add("hidden");
      this.sidebarSection.classList.remove("hidden");
      this.showSidebarBtn.classList.add("active");
      this.showCalendarBtn.classList.remove("active");
      localStorage.setItem("currentView", "sidebar");
    }
  }

  // --- Caricamento e Rendering Dati ---
  async loadDataAndRender() {
    this._renderSkeletons();

    const [data, config] = await Promise.all([
      this._loadJSON("JSON/data.json"),
      this._loadJSON("JSON/config.json"),
    ]);

    if (!data || !config) {
      this.calendarContainer.innerHTML = `<div class="error-message">Errore nel caricamento dei dati della stagione.</div>`;
      return;
    }

    this.data = data;
    this.config = config;

    this._renderAll();
  }

  async _loadJSON(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Errore HTTP! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Errore nel caricamento di ${filePath}:`, error);
      return null;
    }
  }

  _renderAll() {
    this._renderCalendar();
    this._renderLeaderboard();
    this._renderLegend();
  }

  // --- Rendering Skeletons ---
  _renderSkeletons() {
    this._renderCalendarSkeleton(3, 6);
    this._renderLeaderboardSkeleton(12);
  }

  _renderCalendarSkeleton(days = 3, matchesPerDay = 4) {
    this.calendarContainer.innerHTML = Array.from(
      { length: days },
      () => `
      <div class="day-card skeleton-card">
        <div class="skeleton skeleton-line lg" style="width: 180px; margin-bottom: 16px;"></div>
        <div class="matches-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${Array.from({ length: matchesPerDay })
            .map(
              () => `
            <div class="match-card skeleton-card">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:12px;">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-line" style="flex:1; margin:0 12px;"></div>
                <div class="skeleton skeleton-avatar"></div>
              </div>
              <div class="skeleton skeleton-line lg" style="width: 80px; margin: 0 auto;"></div>
            </div>`
            )
            .join("")}
        </div>
      </div>`
    ).join("");
  }

  _renderLeaderboardSkeleton(rows = 10) {
    this.leaderboardBody.innerHTML = Array.from(
      { length: rows },
      () => `
      <tr>
        <td><div class="skeleton skeleton-line" style="width:32px; height:32px; border-radius:50%"></div></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="skeleton" style="width:32px; height:32px; border-radius:50%"></div>
            <div class="skeleton skeleton-line" style="width:140px;"></div>
          </div>
        </td>
        ${Array.from({ length: 7 })
          .map(
            () =>
              `<td><div class="skeleton skeleton-line" style="width:40px;"></div></td>`
          )
          .join("")}
      </tr>`
    ).join("");
  }

  // --- Rendering Calendario ---
  _renderCalendar() {
    this.calendarContainer.innerHTML = "";
    this.data.calendar.forEach((day) => {
      const daySection = this._createDaySection(day, this.data.teamLogos);
      this.calendarContainer.appendChild(daySection);
    });
  }

  _createDaySection(day, teamLogos) {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";
    dayCard.dataset.giornata = day.giornata;

    const matchesHTML = day.partite
      .map((partita) => this._createMatchCard(partita, teamLogos))
      .join("");

    // Aggiungi pulsante WhatsApp per la giornata
    const whatsappBtn = `
      <button class="whatsapp-day-btn" data-giornata="${day.giornata}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Condividi Giornata
      </button>
    `;

    dayCard.innerHTML = `
      <div class="day-header">
        <h2>Giornata ${String(day.giornata).padStart(2, "0")}</h2>
        <div class="day-actions">
          ${whatsappBtn}
          <div class="toggle-btn"></div>
        </div>
      </div>
      <div class="matches-grid">${matchesHTML}</div>
    `;

    dayCard.querySelector(".day-header h2").addEventListener("click", () => {
      dayCard.classList.toggle("open");
    });

    dayCard.querySelector(".toggle-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      dayCard.classList.toggle("open");
    });

    return dayCard;
  }

  _createMatchCard(match, teamLogos) {
    return `
      <div class="match-card">
        <div class="teams">
          <div class="team">
            <img src="${teamLogos[match.home]}" alt="${
      match.home
    }" class="team-logo">
            <span class="team-name">${match.home}</span>
          </div>
          <span class="vs">VS</span>
          <div class="team">
            <img src="${teamLogos[match.away]}" alt="${
      match.away
    }" class="team-logo">
            <span class="team-name">${match.away}</span>
          </div>
        </div>
        <div class="score">
          ${match.homeScore ?? "?"} - ${match.awayScore ?? "?"}
        </div>
      </div>
    `;
  }

  // --- Rendering Classifica e Legenda ---
  _renderLeaderboard() {
    const { calendar, teams, teamLogos } = this.data;
    const teamsStats = {};

    teams.forEach((team) => {
      teamsStats[team] = {
        squadra: team,
        punti: 0,
        giocate: 0,
        vinte: 0,
        pareggiate: 0,
        perse: 0,
        golFatti: 0,
        golSubiti: 0,
        differenzaReti: 0,
      };
    });

    const allMatches = calendar.flatMap((day) =>
      day.partite.filter(
        (match) => teams.includes(match.home) && teams.includes(match.away)
      )
    );

    allMatches.forEach((match) => {
      if (match.homeScore !== null && match.awayScore !== null) {
        const teamCasa = teamsStats[match.home];
        const teamOspite = teamsStats[match.away];

        teamCasa.giocate++;
        teamOspite.giocate++;
        teamCasa.golFatti += match.homeScore;
        teamCasa.golSubiti += match.awayScore;
        teamOspite.golFatti += match.awayScore;
        teamOspite.golSubiti += match.homeScore;

        if (match.homeScore > match.awayScore) {
          teamCasa.punti += 3;
          teamCasa.vinte++;
          teamOspite.perse++;
        } else if (match.homeScore < match.awayScore) {
          teamOspite.punti += 3;
          teamOspite.vinte++;
          teamCasa.perse++;
        } else {
          teamCasa.punti += 1;
          teamOspite.punti += 1;
          teamCasa.pareggiate++;
          teamOspite.pareggiate++;
        }
      }
    });

    Object.values(teamsStats).forEach((team) => {
      team.differenzaReti = team.golFatti - team.golSubiti;
    });

    const finalSortedTeams = this._sortTeams(
      Object.values(teamsStats),
      allMatches
    );

    this.leaderboardData = finalSortedTeams;

    this.leaderboardBody.innerHTML = "";
    finalSortedTeams.forEach((team, index) => {
      const tr = this._createLeaderboardRow(team, index + 1, teamLogos);
      this.leaderboardBody.appendChild(tr);
    });
  }

  _sortTeams(teams, allMatches) {
    return teams.sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      if (a.giocate !== b.giocate) return a.giocate - b.giocate;
      if (b.differenzaReti !== a.differenzaReti)
        return b.differenzaReti - a.differenzaReti;
      if (b.golFatti !== a.golFatti) return b.golFatti - a.golFatti;
      if (a.golSubiti !== b.golSubiti) return a.golSubiti - b.golSubiti;

      const tiedTeams = teams.filter((t) => t.punti === a.punti);
      if (tiedTeams.length > 1) {
        const sortedByHeadToHead = this._calculateHeadToHead(
          tiedTeams,
          allMatches
        );
        const indexA = sortedByHeadToHead.findIndex(
          (t) => t.squadra === a.squadra
        );
        const indexB = sortedByHeadToHead.findIndex(
          (t) => t.squadra === b.squadra
        );
        if (indexA !== indexB) return indexA - indexB;
      }

      return a.squadra.localeCompare(b.squadra);
    });
  }

  _calculateHeadToHead(teamsWithSamePoints, allMatches) {
    if (teamsWithSamePoints.length <= 1) return teamsWithSamePoints;

    const teamNames = teamsWithSamePoints.map((t) => t.squadra);
    const h2hStats = {};

    teamNames.forEach((name) => {
      h2hStats[name] = { punti: 0, golFatti: 0, golSubiti: 0 };
    });

    const relevantMatches = allMatches.filter(
      (match) =>
        teamNames.includes(match.home) && teamNames.includes(match.away)
    );

    relevantMatches.forEach((match) => {
      if (match.homeScore !== null && match.awayScore !== null) {
        const statsHome = h2hStats[match.home];
        const statsAway = h2hStats[match.away];

        statsHome.golFatti += match.homeScore;
        statsHome.golSubiti += match.awayScore;
        statsAway.golFatti += match.awayScore;
        statsAway.golSubiti += match.homeScore;

        if (match.homeScore > match.awayScore) statsHome.punti += 3;
        else if (match.homeScore < match.awayScore) statsAway.punti += 3;
        else {
          statsHome.punti += 1;
          statsAway.punti += 1;
        }
      }
    });

    return [...teamsWithSamePoints].sort((a, b) => {
      const statsA = h2hStats[a.squadra];
      const statsB = h2hStats[b.squadra];

      if (statsB.punti !== statsA.punti) return statsB.punti - statsA.punti;

      const drA = statsA.golFatti - statsA.golSubiti;
      const drB = statsB.golFatti - statsB.golSubiti;
      if (drB !== drA) return drB - drA;

      if (statsB.golFatti !== statsA.golFatti)
        return statsB.golFatti - statsA.golFatti;

      if (statsA.golSubiti !== statsB.golSubiti)
        return statsA.golSubiti - statsB.golSubiti;

      return 0;
    });
  }

  _createLeaderboardRow(team, position, teamLogos) {
    const tr = document.createElement("tr");
    let rowStyle = "";

    for (const key in this.config.positions) {
      const posConfig = this.config.positions[key];
      if (posConfig.positions.includes(position)) {
        const { backgroundColor, borderColor } = posConfig;
        rowStyle = `background: linear-gradient(135deg, ${backgroundColor}20 0%, ${backgroundColor}10 100%); border-left: 4px solid ${borderColor};`;
        if (key === "scudetto") tr.classList.add("scudetto-row");
        break;
      }
    }
    tr.style.cssText = rowStyle;

    tr.innerHTML = `
      <td><div class="position">${position}</div></td>
      <td>
        <div class="team-cell">
          <img src="${teamLogos[team.squadra]}" alt="${
      team.squadra
    }" class="team-logo-small">
          <span>${team.squadra}</span>
        </div>
      </td>
      <td><strong style="color: var(--accent-green);">${
        team.punti
      }</strong></td>
      <td>${team.giocate}</td>
      <td>${team.vinte}</td>
      <td>${team.pareggiate}</td>
      <td>${team.perse}</td>
      <td>${team.golFatti}</td>
      <td>${team.golSubiti}</td>
      <td>${team.differenzaReti > 0 ? "+" : ""}${team.differenzaReti}</td>
    `;
    return tr;
  }

  _renderLegend() {
    this.legendList.innerHTML = "";
    for (const key in this.config.positions) {
      const item = this.config.positions[key];
      const div = document.createElement("div");
      div.className = "legend-item";
      div.innerHTML = `
        <div class="legend-color" style="background-color: ${item.backgroundColor}; border-color: ${item.borderColor};"></div>
        <span>${item.name}: ${item.description}</span>
      `;
      this.legendList.appendChild(div);
    }
  }

  // --- WhatsApp Share Functions ---
  initWhatsAppButtons() {
    // Pulsante classifica
    const standingsBtn = document.getElementById("whatsapp-standings-btn");
    if (standingsBtn) {
      standingsBtn.addEventListener("click", () => this.shareStandingsOnWhatsApp());
    }

    // Pulsanti giornate (delegazione eventi)
    this.calendarContainer.addEventListener("click", (e) => {
      if (e.target.closest(".whatsapp-day-btn")) {
        const btn = e.target.closest(".whatsapp-day-btn");
        const giornata = parseInt(btn.dataset.giornata);
        this.shareDayOnWhatsApp(giornata);
      }
    });
  }

  shareDayOnWhatsApp(giornataNum) {
    const dayData = this.data.calendar.find(d => d.giornata === giornataNum);
    if (!dayData) {
      alert("Dati giornata non trovati!");
      return;
    }

    const seasonTitle = document.querySelector("header h1 .title-text").textContent;
    const seasonSubtitle = document.querySelector("header p").textContent.split("•")[0].trim();

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
  }

  shareStandingsOnWhatsApp() {
    if (!this.leaderboardData || this.leaderboardData.length === 0) {
      alert("Carica prima i dati della classifica!");
      return;
    }

    const seasonTitle = document.querySelector("header h1 .title-text").textContent;
    const seasonSubtitle = document.querySelector("header p").textContent.split("•")[0].trim();

    let message = `*${seasonTitle}*\n`;
    message += `${seasonSubtitle}\n`;
    message += `${"=".repeat(40)}\n\n`;
    message += `*CLASSIFICA COMPLETA*\n`;
    message += `${"=".repeat(40)}\n\n`;

    this.leaderboardData.forEach((team, index) => {
      const position = index + 1;
      const dr = team.differenzaReti > 0 ? `+${team.differenzaReti}` : team.differenzaReti;
      
      // Trova la zona
      let zoneLabel = "";
      for (const key in this.config.positions) {
        const posConfig = this.config.positions[key];
        if (posConfig.positions.includes(position)) {
          zoneLabel = ` [${posConfig.name}]`;
          break;
        }
      }

      message += `${position}. ${team.squadra}${zoneLabel}\n`;
      message += `   Pt: ${team.punti} | G: ${team.giocate} | V: ${team.vinte} | P: ${team.pareggiate} | S: ${team.perse}\n`;
      message += `   GF: ${team.golFatti} | GS: ${team.golSubiti} | DR: ${dr}\n\n`;
    });

    message += `${"=".repeat(40)}\n`;
    message += `Serie A Archive`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
  }

  // --- Pulsante Fluttuante ---
  initFloatingButton() {
    const backBtn = document.querySelector(".back-to-home-btn");
    if (!backBtn) return;
    setTimeout(() => {
      backBtn.classList.add("visible");
    }, 500);
  }
}

// Inizializzazione dell'applicazione
document.addEventListener("DOMContentLoaded", () => {
  const app = new SeasonPageApp();
  app.init();
});