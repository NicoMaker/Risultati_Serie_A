Class SeasonPageApp {
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
  }

  async init() {
    console.log("Inizializzazione pagina Stagione");
    this.initTheme();
    this.initViewSwitcher();
    await this.loadDataAndRender();
    this.initFloatingButton();
  }

  // --- Gestione Tema ---
  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    if (this.themeToggle) {
        this.themeToggle.addEventListener("click", () => {
            const isLight = document.documentElement.classList.contains("light");
            const newTheme = isLight ? "dark" : "light";
            this.applyTheme(newTheme);
            localStorage.setItem("theme", newTheme);
        });
    }
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    this._updateThemeIcon(theme);
  }

  _updateThemeIcon(theme) {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector(".theme-icon");
    icon && (icon.textContent = theme === "light" ? "🌙" : "🌞");
    this.themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "Attiva tema scuro" : "Attiva tema chiaro"
    );
  }

  // --- Gestione Vista (Calendario/Classifica) ---
  initViewSwitcher() {
    if (this.showCalendarBtn) {
      this.showCalendarBtn.addEventListener("click", () =>
        this.switchView("calendar")
      );
    }
    if (this.showSidebarBtn) {
      this.showSidebarBtn.addEventListener("click", () =>
        this.switchView("sidebar")
      );
    }

    const savedView = localStorage.getItem("currentView") || "calendar";
    this.switchView(savedView);
  }

  switchView(view) {
    if (!this.calendarSection || !this.sidebarSection || !this.showCalendarBtn || !this.showSidebarBtn) return;
    
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
      if (this.calendarContainer) {
          this.calendarContainer.innerHTML = `<div class="error-message">Errore nel caricamento dei dati della stagione.</div>`;
      }
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
    if (!this.calendarContainer) return;
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
    if (!this.leaderboardBody) return;
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
    if (!this.calendarContainer || !this.data || !this.data.calendar) return;

    this.calendarContainer.innerHTML = "";
    this.data.calendar.forEach((day) => {
      const daySection = this._createDaySection(day, this.data.teamLogos);
      this.calendarContainer.appendChild(daySection);
    });
  }

  _createDaySection(day, teamLogos) {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    const matchesHTML = day.partite
      .map((partita) => this._createMatchCard(partita, teamLogos))
      .join("");

    dayCard.innerHTML = `
      <div class="day-header">
        <h2>Giornata ${String(day.giornata).padStart(2, "0")}</h2>
        <div class="toggle-btn"></div>
      </div>
      <div class="matches-grid">${matchesHTML}</div>
    `;

    dayCard.querySelector(".day-header").addEventListener("click", () => {
      dayCard.classList.toggle("open");
    });

    return dayCard;
  }

  _createMatchCard(match, teamLogos) {
    return `
      <div class="match-card">
        <div class="teams">
          <div class="team">
            <img src="${teamLogos[match.home] || ''}" alt="${
      match.home
    }" class="team-logo">
            <span class="team-name">${match.home}</span>
          </div>
          <span class="vs">VS</span>
          <div class="team">
            <img src="${teamLogos[match.away] || ''}" alt="${
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
    if (!this.leaderboardBody || !this.data) return;

    const { calendar, teams, teamLogos } = this.data;
    const teamsStats = {};

    // 1. Inizializzazione Statistiche
    teams.forEach((team) => {
      teamsStats[team] = {
        squadra: team,
        punti: 0,
        giocate: 0, // Partite Giocate
        vinte: 0,
        pareggiate: 0,
        perse: 0,
        golFatti: 0,
        golSubiti: 0,
        differenzaReti: 0,
      };
    });

    // 2. Calcolo Statistiche Totali
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

    // 3. Ordinamento e Rendering
    const finalSortedTeams = this._sortTeams(
      Object.values(teamsStats),
      allMatches
    );

    this.leaderboardBody.innerHTML = "";
    finalSortedTeams.forEach((team, index) => {
      const tr = this._createLeaderboardRow(team, index + 1, teamLogos);
      this.leaderboardBody.appendChild(tr);
    });
  }

  // --- ⚙️ Ordinamento aggiornato con regola Partite Giocate ---
  _sortTeams(teams, allMatches) {
    return teams.sort((a, b) => {
      // 1. Punti (decrescente)
      if (b.punti !== a.punti) return b.punti - a.punti;

      // 👇 2. NUOVA REGOLA: Partite Giocate (crescente - meno partite è meglio)
      if (a.giocate !== b.giocate) return a.giocate - b.giocate;

      // 3. Differenza Reti (decrescente - standard)
      if (b.differenzaReti !== a.differenzaReti)
        return b.differenzaReti - a.differenzaReti;

      // 4. Gol Fatti (decrescente - standard)
      if (b.golFatti !== a.golFatti) return b.golFatti - a.golFatti;

      // 5. Scontro Diretto (Head-to-Head) - Applicato solo se i criteri sopra non hanno risolto il pareggio
      const tiedTeams = teams.filter((t) => t.punti === a.punti && t.giocate === a.giocate);
      
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
        
        // Se lo scontro diretto ha risolto il pareggio (gli indici sono diversi)
        if (indexA !== indexB) return indexA - indexB;
      }
      
      // 6. Fallback: Ordine Alfabetico
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

    // Ordinamento Head-to-Head
    return [...teamsWithSamePoints].sort((a, b) => {
      const statsA = h2hStats[a.squadra];
      const statsB = h2hStats[b.squadra];

      // 1. Punti Head-to-Head
      if (statsB.punti !== statsA.punti) return statsB.punti - statsA.punti;

      // 2. Differenza Reti Head-to-Head
      const drA = statsA.golFatti - statsA.golSubiti;
      const drB = statsB.golFatti - statsB.golSubiti;
      if (drB !== drA) return drB - drA;

      // 3. Gol Fatti Head-to-Head
      if (statsB.golFatti !== statsA.golFatti)
        return statsB.golFatti - statsA.golFatti;

      // 4. Fallback (Mantiene l'ordine originale in H2H se tutto è uguale)
      return 0;
    });
  }

  _createLeaderboardRow(team, position, teamLogos) {
    const tr = document.createElement("tr");
    let rowStyle = "";

    // Applica stili in base alla posizione (zona Champions, Europa League, etc.)
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
          <img src="${teamLogos[team.squadra] || ''}" alt="${
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
    if (!this.legendList || !this.config || !this.config.positions) return;

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

  // --- Pulsante Fluttuante ---
  initFloatingButton() {
    const backBtn = document.querySelector(".back-to-home-btn");
    if (!backBtn) return;
    setTimeout(() => {
      backBtn.classList.add("visible");
    }, 500); // Appare dopo 500ms
  }
}

// Inizializzazione dell'applicazione
document.addEventListener("DOMContentLoaded", () => {
  const app = new SeasonPageApp();
  app.init();
});
