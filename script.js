// Funzione per caricare un file JSON in modo asincrono
async function loadJSON(filePath) {
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

// UI: Theme toggle
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

function initThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
  updateThemeIcon(toggle, savedTheme);

  toggle.addEventListener("click", () => {
    const current = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    updateThemeIcon(toggle, next);
    localStorage.setItem("theme", next);
  });
}

function updateThemeIcon(button, theme) {
  if (!button) return;
  const icon = button.querySelector(".theme-icon");
  if (!icon) return;
  icon.textContent = theme === "light" ? "🌙" : "🌞";
}

// Skeleton helpers
function renderCalendarSkeleton(container, days = 3, matchesPerDay = 4) {
  container.innerHTML = "";
  for (let d = 0; d < days; d++) {
    const day = document.createElement("div");
    day.className = "day-card skeleton-card";
    day.innerHTML = `
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
    `;
    container.appendChild(day);
  }
}

function renderLeaderboardSkeleton(bodyEl, rows = 10) {
  bodyEl.innerHTML = "";
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
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
    `;
    bodyEl.appendChild(tr);
  }
}

// Funzione per creare la card HTML di una singola partita
function createMatchCard(match, teamLogos) {
  const matchCard = document.createElement("div");
  matchCard.className = "match-card";

  matchCard.innerHTML = `
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
        ${match.homeScore !== null ? match.homeScore : "?"} - ${
    match.awayScore !== null ? match.awayScore : "?"
  }
      </div>
    `;
  return matchCard;
}

// Funzione per creare la sezione HTML di una giornata
function createDaySection(day, teamLogos) {
  const dayCard = document.createElement("div");
  dayCard.className = "day-card";

  const matchesHTML = day.partite
    .map((partita) => createMatchCard(partita, teamLogos).outerHTML)
    .join("");

  dayCard.innerHTML = `
      <div class="day-header">
        <h2>Giornata ${day.giornata}</h2>
        <div class="toggle-btn"></div>
      </div>
      <div class="matches-grid">
        ${matchesHTML}
      </div>
    `;

  dayCard.querySelector(".day-header").addEventListener("click", () => {
    dayCard.classList.toggle("open");
  });

  return dayCard;
}

// Funzione per calcolare gli scontri diretti
function calculateHeadToHead(teamsWithSamePoints, allMatches) {
  if (teamsWithSamePoints.length <= 1) return teamsWithSamePoints;

  const squadreNomi = teamsWithSamePoints.map((t) => t.squadra);
  const h2hStats = {};

  teamsWithSamePoints.forEach((team) => {
    h2hStats[team.squadra] = {
      punti: 0,
      golFatti: 0,
      golSubiti: 0,
    };
  });

  const relevantMatches = allMatches.filter(
    (match) =>
      squadreNomi.includes(match.home) && squadreNomi.includes(match.away)
  );

  relevantMatches.forEach((match) => {
    if (match.homeScore !== null && match.awayScore !== null) {
      const statsHome = h2hStats[match.home];
      const statsAway = h2hStats[match.away];

      statsHome.golFatti += match.homeScore;
      statsHome.golSubiti += match.awayScore;
      statsAway.golFatti += match.awayScore;
      statsAway.golSubiti += match.homeScore;

      if (match.homeScore > match.awayScore) {
        statsHome.punti += 3;
      } else if (match.homeScore < match.awayScore) {
        statsAway.punti += 3;
      } else {
        statsHome.punti += 1;
        statsAway.punti += 1;
      }
    }
  });

  return teamsWithSamePoints.sort((a, b) => {
    const statsA = h2hStats[a.squadra];
    const statsB = h2hStats[b.squadra];

    if (statsB.punti !== statsA.punti) return statsB.punti - statsA.punti;

    const drA = statsA.golFatti - statsA.golSubiti;
    const drB = statsB.golFatti - statsB.golSubiti;
    if (drB !== drA) return drB - drA;

    if (statsB.golFatti !== statsA.golFatti)
      return statsB.golFatti - statsA.golFatti;

    return 0; // restano pari se tutto uguale
  });
}

// Funzione principale per aggiornare la classifica
function updateLeaderboard(calendarData, teams, config, teamLogos) {
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

  const allMatches = [];
  calendarData.forEach((day) => {
    day.partite.forEach((match) => {
      if (teams.includes(match.home) && teams.includes(match.away)) {
        allMatches.push(match);
      }
    });
  });

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

  for (const team in teamsStats) {
    teamsStats[team].differenzaReti =
      teamsStats[team].golFatti - teamsStats[team].golSubiti;
  }

  let finalSortedTeams = Object.values(teamsStats);

  // Ordinamento:
  // 1) punti
  // 2) differenza reti
  // 3) scontri diretti
  // 4) gol fatti totali
  finalSortedTeams.sort((a, b) => {
    if (b.punti !== a.punti) return b.punti - a.punti;
    if (b.differenzaReti !== a.differenzaReti)
      return b.differenzaReti - a.differenzaReti;

    // se anche differenza reti è uguale -> applica head-to-head
    const tiedTeams = [a, b];
    const sorted = calculateHeadToHead(tiedTeams, allMatches);
    if (sorted[0].squadra !== sorted[1].squadra) {
      return sorted[0].squadra === a.squadra ? -1 : 1;
    }

    // se anche scontri diretti sono uguali -> gol fatti totali
    if (b.golFatti !== a.golFatti) return b.golFatti - a.golFatti;

    return 0;
  });

  const leaderboardBody = document.getElementById("leaderboard-body");
  leaderboardBody.innerHTML = "";

  finalSortedTeams.forEach((team, index) => {
    const teamPos = index + 1;
    const tr = document.createElement("tr");

    let rowClass = "";
    if (config.positions.scudetto.positions.includes(teamPos)) {
      rowClass = "scudetto-row";
    }

    let rowStyle = "";
    for (const key in config.positions) {
      if (config.positions[key].positions.includes(teamPos)) {
        const bgColor = config.positions[key].backgroundColor;
        const borderColor = config.positions[key].borderColor;
        rowStyle = `background: linear-gradient(135deg, ${bgColor}20 0%, ${bgColor}10 100%); border-left: 4px solid ${borderColor};`;
        break;
      }
    }

    tr.className = rowClass;
    tr.style = rowStyle;

    tr.innerHTML = `
            <td><div class="position">${teamPos}</div></td>
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

    leaderboardBody.appendChild(tr);
  });
}

// Funzione per creare la legenda dei colori
function createLegend(config) {
  const legendList = document.getElementById("legend-list");
  legendList.innerHTML = "";

  for (const key in config.positions) {
    const item = config.positions[key];
    const div = document.createElement("div");
    div.className = "legend-item";
    div.innerHTML = `
            <div class="legend-color" style="background-color: ${item.backgroundColor}; border-color: ${item.borderColor};"></div>
            <span>${item.name}: ${item.description}</span>
          `;
    legendList.appendChild(div);
  }
}

// Funzione di inizializzazione dell'app
async function initializeApp() {
  initThemeToggle();

  const calendarContainer = document.getElementById("calendar");
  const leaderboardBody = document.getElementById("leaderboard-body");

  renderCalendarSkeleton(calendarContainer, 3, 6);
  renderLeaderboardSkeleton(leaderboardBody, 12);

  const [data, config] = await Promise.all([
    loadJSON("JSON/data.json"),
    loadJSON("JSON/config.json"),
  ]);

  if (!data || !config) return;

  const { teams, teamLogos, calendar } = data;

  calendarContainer.innerHTML = "";

  calendar.forEach((day) => {
    calendarContainer.appendChild(createDaySection(day, teamLogos));
  });

  updateLeaderboard(calendar, teams, config, teamLogos);
  createLegend(config);

  const showCalendarBtn = document.getElementById("show-calendar-btn");
  const showSidebarBtn = document.getElementById("show-sidebar-btn");
  const calendarSection = document.querySelector(".calendar-section");
  const sidebarSection = document.querySelector(".sidebar");

  function switchView(view) {
    if (view === "calendar") {
      calendarSection.classList.remove("hidden");
      sidebarSection.classList.add("hidden");
      showCalendarBtn.classList.add("active");
      showSidebarBtn.classList.remove("active");
      localStorage.setItem("currentView", "calendar");
    } else {
      calendarSection.classList.add("hidden");
      sidebarSection.classList.remove("hidden");
      showSidebarBtn.classList.add("active");
      showCalendarBtn.classList.remove("active");
      localStorage.setItem("currentView", "sidebar");
    }
  }

  showCalendarBtn.addEventListener("click", () => switchView("calendar"));
  showSidebarBtn.addEventListener("click", () => switchView("sidebar"));

  const savedView = localStorage.getItem("currentView");
  if (savedView) {
    switchView(savedView);
  } else {
    switchView("calendar");
  }
}

initializeApp();
