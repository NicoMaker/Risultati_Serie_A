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
    this.leaderboardDataHome = [];
    this.leaderboardDataAway = [];

    // Stato filtri classifica
    this.activeFilter = "globale"; // globale | casa | trasferta
    this.searchQuery = "";
    const savedMin = localStorage.getItem("minRound");
    const savedMax = localStorage.getItem("maxRound");
    this.minRound = savedMin ? parseInt(savedMin) : null; // null = dalla prima
    this.maxRound = savedMax ? parseInt(savedMax) : null; // null = all'ultima

    // Stato ordinamento classifica — default: punti decrescente
    this.sortColumn = localStorage.getItem("sortColumn") || "punti";
    this.sortDirection = localStorage.getItem("sortDirection") || "desc";
  }

  async init() {
    console.log("Inizializzazione pagina Stagione");
    this.initTheme();
    this.initViewSwitcher();
    await this.loadDataAndRender();
    this.initFloatingButton();
    this.initWhatsAppButtons();
    this.initLeaderboardFilters();
    this.initLeaderboardSearch();
    this.initLeaderboardSort();
    this.initLeaderboardRoundFilter();
  }

  // --- Helper: percorso logo normalizzato ---
  _getLogoPath(rawPath) {
    if (!rawPath) return "";
    if (rawPath.startsWith("http") || rawPath.startsWith("data:"))
      return rawPath;
    // Rimuove eventuali ../../ già presenti, poi li riaggunge sempre
    const cleaned = rawPath.replace(/^(\.\.\/)+/, "");
    return `../../${cleaned}`;
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
      this.switchView("calendar"),
    );
    this.showSidebarBtn.addEventListener("click", () =>
      this.switchView("sidebar"),
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
            </div>`,
            )
            .join("")}
        </div>
      </div>`,
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
              `<td><div class="skeleton skeleton-line" style="width:40px;"></div></td>`,
          )
          .join("")}
      </tr>`,
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
            <img src="${this._getLogoPath(teamLogos[match.home])}" alt="${match.home}" class="team-logo">
            <span class="team-name">${match.home}</span>
          </div>
          <span class="vs">VS</span>
          <div class="team">
            <img src="${this._getLogoPath(teamLogos[match.away])}" alt="${match.away}" class="team-logo">
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
    this._computeAndApplyLeaderboard();
    this._initRoundRangeSlider();
  }

  // Calcola le statistiche fino alla giornata maxRound (null = tutte)
  _computeAndApplyLeaderboard() {
    const { calendar, teams, teamLogos } = this.data;

    const makeStats = () =>
      Object.fromEntries(
        teams.map((team) => [
          team,
          {
            squadra: team,
            punti: 0,
            giocate: 0,
            vinte: 0,
            pareggiate: 0,
            perse: 0,
            golFatti: 0,
            golSubiti: 0,
            differenzaReti: 0,
          },
        ]),
      );

    const teamsStats = makeStats();
    const homeStats = makeStats();
    const awayStats = makeStats();

    // Filtra per range di giornate
    const filteredCalendar = calendar.filter((day) => {
      const g = day.giornata;
      const aboveMin = this.minRound === null || g >= this.minRound;
      const belowMax = this.maxRound === null || g <= this.maxRound;
      return aboveMin && belowMax;
    });

    const allMatches = filteredCalendar.flatMap((day) =>
      day.partite.filter(
        (match) => teams.includes(match.home) && teams.includes(match.away),
      ),
    );

    allMatches.forEach((match) => {
      if (match.homeScore !== null && match.awayScore !== null) {
        const updateStats = (stats, homeName, awayName, hGoal, aGoal) => {
          const h = stats[homeName];
          const a = stats[awayName];
          h.giocate++;
          a.giocate++;
          h.golFatti += hGoal;
          h.golSubiti += aGoal;
          a.golFatti += aGoal;
          a.golSubiti += hGoal;
          if (hGoal > aGoal) {
            h.punti += 3;
            h.vinte++;
            a.perse++;
          } else if (hGoal < aGoal) {
            a.punti += 3;
            a.vinte++;
            h.perse++;
          } else {
            h.punti++;
            a.punti++;
            h.pareggiate++;
            a.pareggiate++;
          }
        };

        updateStats(
          teamsStats,
          match.home,
          match.away,
          match.homeScore,
          match.awayScore,
        );

        const hHome = homeStats[match.home];
        hHome.giocate++;
        hHome.golFatti += match.homeScore;
        hHome.golSubiti += match.awayScore;
        if (match.homeScore > match.awayScore) {
          hHome.punti += 3;
          hHome.vinte++;
        } else if (match.homeScore < match.awayScore) {
          hHome.perse++;
        } else {
          hHome.punti++;
          hHome.pareggiate++;
        }

        const aAway = awayStats[match.away];
        aAway.giocate++;
        aAway.golFatti += match.awayScore;
        aAway.golSubiti += match.homeScore;
        if (match.awayScore > match.homeScore) {
          aAway.punti += 3;
          aAway.vinte++;
        } else if (match.awayScore < match.homeScore) {
          aAway.perse++;
        } else {
          aAway.punti++;
          aAway.pareggiate++;
        }
      }
    });

    [teamsStats, homeStats, awayStats].forEach((s) =>
      Object.values(s).forEach((t) => {
        t.differenzaReti = t.golFatti - t.golSubiti;
      }),
    );

    this.leaderboardData = this._sortTeams(
      Object.values(teamsStats),
      allMatches,
    );
    this.leaderboardDataHome = this._sortTeams(
      Object.values(homeStats),
      allMatches,
    );
    this.leaderboardDataAway = this._sortTeams(
      Object.values(awayStats),
      allMatches,
    );

    this._applyLeaderboardView();
  }

  // Inizializza e aggiorna il range slider giornate
  _initRoundRangeSlider() {
    const rounds = [...new Set(this.data.calendar.map((d) => d.giornata))].sort(
      (a, b) => a - b,
    );
    if (rounds.length === 0) return;

    const minPossible = rounds[0];
    const maxPossible = rounds[rounds.length - 1];

    const sliderMin = document.getElementById("round-range-min");
    const sliderMax = document.getElementById("round-range-max");
    if (!sliderMin || !sliderMax) return;

    sliderMin.min = minPossible;
    sliderMin.max = maxPossible;
    sliderMax.min = minPossible;
    sliderMax.max = maxPossible;

    // Ripristina da stato o usa valori di default
    sliderMin.value = this.minRound !== null ? this.minRound : minPossible;
    sliderMax.value = this.maxRound !== null ? this.maxRound : maxPossible;

    this._updateRangeUI(minPossible, maxPossible);

    const onInput = () => {
      let vMin = parseInt(sliderMin.value);
      let vMax = parseInt(sliderMax.value);
      if (vMin > vMax) {
        if (document.activeElement === sliderMin) {
          vMin = vMax;
          sliderMin.value = vMin;
        } else {
          vMax = vMin;
          sliderMax.value = vMax;
        }
      }
      this.minRound = vMin === minPossible ? null : vMin;
      this.maxRound = vMax === maxPossible ? null : vMax;
      // Salva in localStorage
      if (this.minRound !== null)
        localStorage.setItem("minRound", this.minRound);
      else localStorage.removeItem("minRound");
      if (this.maxRound !== null)
        localStorage.setItem("maxRound", this.maxRound);
      else localStorage.removeItem("maxRound");
      this._updateRangeUI(minPossible, maxPossible);
      if (this.data) this._computeAndApplyLeaderboard();
    };

    sliderMin.addEventListener("input", onInput);
    sliderMax.addEventListener("input", onInput);
  }

  _updateRangeUI(minPossible, maxPossible) {
    const sliderMin = document.getElementById("round-range-min");
    const sliderMax = document.getElementById("round-range-max");
    const fill = document.getElementById("round-range-fill");
    const labelEl = document.getElementById("round-range-label");
    const minVal = document.getElementById("round-min-val");
    const maxVal = document.getElementById("round-max-val");
    if (!sliderMin || !sliderMax) return;

    const vMin = parseInt(sliderMin.value);
    const vMax = parseInt(sliderMax.value);
    const range = maxPossible - minPossible || 1;
    const leftPct = ((vMin - minPossible) / range) * 100;
    const rightPct = ((vMax - minPossible) / range) * 100;

    if (fill) {
      fill.style.left = leftPct + "%";
      fill.style.width = rightPct - leftPct + "%";
    }
    if (minVal) minVal.textContent = `G${vMin}`;
    if (maxVal) maxVal.textContent = `G${vMax}`;
    if (labelEl) {
      const isAll = vMin === minPossible && vMax === maxPossible;
      labelEl.textContent = isAll ? "Tutte" : `G${vMin} → G${vMax}`;
      labelEl.classList.toggle("active", !isAll);
    }
  }

  initLeaderboardRoundFilter() {
    const resetBtn = document.getElementById("round-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.minRound = null;
        this.maxRound = null;
        localStorage.removeItem("minRound");
        localStorage.removeItem("maxRound");
        // Ripristina slider ai valori min/max
        const rounds = [
          ...new Set(this.data.calendar.map((d) => d.giornata)),
        ].sort((a, b) => a - b);
        const sliderMin = document.getElementById("round-range-min");
        const sliderMax = document.getElementById("round-range-max");
        if (sliderMin) sliderMin.value = rounds[0];
        if (sliderMax) sliderMax.value = rounds[rounds.length - 1];
        this._updateRangeUI(rounds[0], rounds[rounds.length - 1]);
        if (this.data) this._computeAndApplyLeaderboard();
      });
    }
  }

  _getActiveLeaderboardData() {
    if (this.activeFilter === "casa") return this.leaderboardDataHome;
    if (this.activeFilter === "trasferta") return this.leaderboardDataAway;
    return this.leaderboardData;
  }

  _applyLeaderboardView() {
    const { teamLogos } = this.data;
    let data = [...this._getActiveLeaderboardData()];

    const titleEl = document.getElementById("leaderboard-title");
    if (titleEl) {
      const labels = {
        globale: "CLASSIFICA",
        casa: "CLASSIFICA CASA",
        trasferta: "CLASSIFICA TRASFERTA",
      };
      titleEl.textContent = labels[this.activeFilter] || "CLASSIFICA";
    }

    // Applica filtro ricerca
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter((t) => t.squadra.toLowerCase().includes(q));
    }

    // Applica ordinamento personalizzato per colonna (sempre attivo)
    const col = this.sortColumn || "punti";
    const dir = this.sortDirection === "asc" ? 1 : -1;
    data.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];
      if (col === "squadra") return dir * valA.localeCompare(valB);
      return dir * (valA - valB);
    });

    this.leaderboardBody.innerHTML = "";
    data.forEach((team, index) => {
      const pos = index + 1;
      const tr = this._createLeaderboardRow(team, pos, teamLogos);
      this.leaderboardBody.appendChild(tr);
    });

    this._updateSortUI();
  }

  initLeaderboardFilters() {
    // Ripristina filtro salvato
    const savedFilter = localStorage.getItem("leaderboardFilter") || "globale";
    this.activeFilter = savedFilter;
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === savedFilter);
    });

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeFilter = btn.dataset.filter;
        localStorage.setItem("leaderboardFilter", this.activeFilter);
        if (this.data) this._applyLeaderboardView();
      });
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
          allMatches,
        );
        const indexA = sortedByHeadToHead.findIndex(
          (t) => t.squadra === a.squadra,
        );
        const indexB = sortedByHeadToHead.findIndex(
          (t) => t.squadra === b.squadra,
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
        teamNames.includes(match.home) && teamNames.includes(match.away),
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
          <img src="${this._getLogoPath(teamLogos[team.squadra])}" alt="${team.squadra}" class="team-logo-small">
          <span>${team.squadra}</span>
        </div>
      </td>
      <td><strong style="color: var(--accent-green);">${team.punti}</strong></td>
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
  }

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
  }

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

  initLeaderboardSearch() {
    const searchContainer = document.getElementById(
      "leaderboard-search-container",
    );
    if (!searchContainer) return;

    searchContainer.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim();
      if (this.data) this._applyLeaderboardView();
    });

    searchContainer.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchContainer.value = "";
        this.searchQuery = "";
        if (this.data) this._applyLeaderboardView();
      }
    });
  }

  initLeaderboardSort() {
    document.querySelectorAll(".sort-criteria-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        this._applySortCriteria(btn.dataset.criteria),
      );
    });
    document
      .querySelector(".leaderboard-table thead")
      ?.addEventListener("click", (e) => {
        const th = e.target.closest("th[data-sort]");
        if (!th) return;
        this._applySortCriteria(th.dataset.sort);
      });
  }

  _defaultDirection(criteria) {
    if (criteria === "golSubiti" || criteria === "perse") return "asc";
    if (criteria === "squadra") return "asc";
    return "desc";
  }

  _applySortCriteria(criteria) {
    if (this.sortColumn === criteria) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = criteria;
      this.sortDirection = this._defaultDirection(criteria);
    }
    localStorage.setItem("sortColumn", this.sortColumn);
    localStorage.setItem("sortDirection", this.sortDirection);
    if (this.data) this._applyLeaderboardView();
  }

  _getSortLabel(criteria) {
    const map = {
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
    return map[criteria] || criteria;
  }

  _updateSortUI() {
    const active = this.sortColumn || "punti";
    document.querySelectorAll(".sort-criteria-btn").forEach((btn) => {
      const isActive = btn.dataset.criteria === active;
      btn.classList.toggle("active", isActive);
      const arrow = btn.querySelector(".sort-arrow");
      if (arrow) {
        if (isActive) {
          arrow.textContent = this.sortDirection === "asc" ? " ↑" : " ↓";
          arrow.style.display = "";
        } else {
          arrow.style.display = "none";
        }
      }
    });
    const infoLabel = document.getElementById("sort-info-label");
    if (infoLabel) {
      const dir = this.sortDirection === "asc" ? " ↑" : " ↓";
      infoLabel.textContent = this._getSortLabel(active) + dir;
    }
    this._updateSortIndicators();
  }

  _updateSortIndicators() {
    document
      .querySelectorAll(".leaderboard-table th[data-sort]")
      .forEach((th) => {
        th.classList.remove("sort-asc", "sort-desc", "sort-active");
        if (th.dataset.sort === this.sortColumn) {
          th.classList.add("sort-active", `sort-${this.sortDirection}`);
        }
      });
  }

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
