// Funzione per caricare i dati dal file JSON
async function loadData() {
  try {
    const response = await fetch("JSON/data.json");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
    return null;
  }
}

// Funzione per caricare la configurazione dal file JSON
async function loadConfig() {
  try {
    const response = await fetch("JSON/config.json");
    const config = await response.json();
    return config;
  } catch (error) {
    console.error("Errore nel caricamento della configurazione:", error);
    return null;
  }
}

// Funzione per creare la card di una singola partita
function createMatchCard(match, teamLogos) {
  const matchCard = document.createElement("div");
  matchCard.className = "match-card";

  matchCard.innerHTML = `
                <div class="teams">
                    <div class="team">
                        <img src="${teamLogos[match.home]}" alt="${
    match.home
  }" class="team-logo">
                    </div>
                    <span class="vs">VS</span>
                    <div class="team">
                        <img src="${teamLogos[match.away]}" alt="${
    match.away
  }" class="team-logo">
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

// Funzione per creare la sezione di una giornata
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

    if (statsB.punti !== statsA.punti) {
      return statsB.punti - statsA.punti;
    }

    const drA = statsA.golFatti - statsA.golSubiti;
    const drB = statsB.golFatti - statsB.golSubiti;
    if (drB !== drA) {
      return drB - drA;
    }

    if (statsB.golFatti !== statsA.golFatti) {
      return statsB.golFatti - statsA.golFatti;
    }

    if (b.differenzaReti !== a.differenzaReti) {
      return b.differenzaReti - a.differenzaReti;
    }

    return b.golFatti - a.golFatti;
  });
}

// Funzione per calcolare e aggiornare la classifica
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

  if (teamsStats["Bologna"]) {
    teamsStats["Bologna"].punti = teamsStats["Bologna"].punti - 2;
  }

  for (const team in teamsStats) {
    teamsStats[team].differenzaReti =
      teamsStats[team].golFatti - teamsStats[team].golSubiti;
  }

  const pointsGroups = {};
  Object.values(teamsStats).forEach((team) => {
    if (!pointsGroups[team.punti]) {
      pointsGroups[team.punti] = [];
    }
    pointsGroups[team.punti].push(team);
  });

  let finalSortedTeams = [];
  Object.keys(pointsGroups)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach((points) => {
      const teamsWithSamePoints = pointsGroups[points];

      if (teamsWithSamePoints.length > 1) {
        const sortedByH2H = calculateHeadToHead(
          teamsWithSamePoints,
          allMatches
        );
        finalSortedTeams.push(...sortedByH2H);
      } else {
        finalSortedTeams.push(...teamsWithSamePoints);
      }
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
                    <td><strong>${team.punti}</strong></td>
                    <td>${team.giocate}</td>
                    <td>${team.vinte}</td>
                    <td>${team.pareggiate}</td>
                    <td>${team.perse}</td>
                    <td>${team.golFatti}</td>
                    <td>${team.golSubiti}</td>
                    <td>${team.differenzaReti > 0 ? "+" : ""}${
      team.differenzaReti
    }</td>
                `;

    leaderboardBody.appendChild(tr);
  });
}

// Funzione per creare la legenda della classifica
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

// Funzione principale che inizializza l'applicazione
async function initializeApp() {
  const [data, config] = await Promise.all([loadData(), loadConfig()]);
  if (!data || !config) return;

  const { teams, teamLogos, calendar } = data;

  const container = document.getElementById("calendar");
  container.innerHTML = "";

  calendar.forEach((day) => {
    container.appendChild(createDaySection(day, teamLogos));
  });

  updateLeaderboard(calendar, teams, config, teamLogos);
  createLegend(config);
}

initializeApp();
