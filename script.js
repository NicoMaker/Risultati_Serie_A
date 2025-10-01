// Funzione per caricare i dati dal file JSON
async function loadData() {
    try {
        const response = await fetch('JSON/data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        return null;
    }
}

// Funzione per caricare la configurazione dal file JSON
async function loadConfig() {
    try {
        const response = await fetch('JSON/config.json');
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);
        return null;
    }
}

// Funzione per creare la card di una singola partita
function createMatchCard(match, teamLogos) {
    const matchCard = document.createElement('div');
    matchCard.className = 'match-card';

    let scoreHTML = `<div class="score">${match.homeScore !== null ? match.homeScore : '?'} - ${match.awayScore !== null ? match.awayScore : '?'}</div>`;

    matchCard.innerHTML = `
        <div class="teams">
            <img src="${teamLogos[match.home]}" alt="${match.home} logo" class="team-logo">
            <span class="vs">vs</span>
            <img src="${teamLogos[match.away]}" alt="${match.away} logo" class="team-logo">
        </div>
        ${scoreHTML}
    `;
    return matchCard;
}

// Funzione per creare la sezione di una giornata
function createDaySection(day, teamLogos) {
    const daySection = document.createElement('div');
    daySection.className = 'day-section';

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.innerHTML = `
        <h2>Giornata ${day.giornata}</h2>
        <span class="toggle-icon">▼</span>
    `;

    const matchesContainer = document.createElement('div');
    matchesContainer.className = 'matches-container';

    day.partite.forEach(partita => {
        matchesContainer.appendChild(createMatchCard(partita, teamLogos));
    });

    dayHeader.addEventListener('click', () => {
        matchesContainer.classList.toggle('open');
        const icon = dayHeader.querySelector('.toggle-icon');
        icon.classList.toggle('open');
    });

    daySection.appendChild(dayHeader);
    daySection.appendChild(matchesContainer);
    
    return daySection;
}

// Funzione per calcolare gli scontri diretti
function calculateHeadToHead(teamsWithSamePoints, allMatches) {
    if (teamsWithSamePoints.length <= 1) return teamsWithSamePoints;

    const squadreNomi = teamsWithSamePoints.map(t => t.squadra);
    const h2hStats = {};
    
    teamsWithSamePoints.forEach(team => {
        h2hStats[team.squadra] = {
            punti: 0,
            golFatti: 0,
            golSubiti: 0
        };
    });

    const relevantMatches = allMatches.filter(match => 
        squadreNomi.includes(match.home) && squadreNomi.includes(match.away)
    );

    relevantMatches.forEach(match => {
        if (match.homeScore !== null && match.awayScore !== null) {
            const statsHome = h2hStats[match.home];
            const statsAway = h2hStats[match.away];

            // Aggiorna gol
            statsHome.golFatti += match.homeScore;
            statsHome.golSubiti += match.awayScore;
            statsAway.golFatti += match.awayScore;
            statsAway.golSubiti += match.homeScore;

            // Aggiorna punti
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

    teams.forEach(team => {
        teamsStats[team] = {
            squadra: team,
            punti: 0,
            giocate: 0,
            vinte: 0,
            pareggiate: 0,
            perse: 0,
            golFatti: 0,
            golSubiti: 0,
            differenzaReti: 0
        };
    });

    const allMatches = [];
    calendarData.forEach(day => {
        day.partite.forEach(match => {
            // Ignora le partite con squadre non presenti nella lista principale
            if (teams.includes(match.home) && teams.includes(match.away)) {
                 allMatches.push(match);
            }
        });
    });

    allMatches.forEach(match => {
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

    // Penalità per il Bologna
    if (teamsStats['Bologna']) {
        teamsStats['Bologna'].punti = teamsStats['Bologna'].punti - 2;
    }

    for (const team in teamsStats) {
        teamsStats[team].differenzaReti = teamsStats[team].golFatti - teamsStats[team].golSubiti;
    }

    const pointsGroups = {};
    Object.values(teamsStats).forEach(team => {
        if (!pointsGroups[team.punti]) {
            pointsGroups[team.punti] = [];
        }
        pointsGroups[team.punti].push(team);
    });

    let finalSortedTeams = [];
    Object.keys(pointsGroups)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .forEach(points => {
            const teamsWithSamePoints = pointsGroups[points];
            
            if (teamsWithSamePoints.length > 1) {
                const sortedByH2H = calculateHeadToHead(teamsWithSamePoints, allMatches);
                finalSortedTeams.push(...sortedByH2H);
            } else {
                finalSortedTeams.push(...teamsWithSamePoints);
            }
        });

    const leaderboardDiv = document.getElementById('leaderboard-table-container');
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Pos.</th>
                    <th>Squadra</th>
                    <th>Pt</th>
                    <th>G</th>
                    <th>V</th>
                    <th>N</th>
                    <th>P</th>
                    <th>GF</th>
                    <th>GS</th>
                    <th>DR</th>
                </tr>
            </thead>
            <tbody>
    `;
    finalSortedTeams.forEach((team, index) => {
        const teamPos = index + 1;
        let rowStyle = '';
        let rowClass = '';
        if (config.positions.scudetto.positions.includes(teamPos)) {
            rowClass = 'scudetto';
        }
        for (const key in config.positions) {
            if (config.positions[key].positions.includes(teamPos)) {
                rowStyle = `background-color: ${config.positions[key].backgroundColor}; border-left: 5px solid ${config.positions[key].borderColor};`;
                break;
            }
        }
        tableHTML += `
            <tr style="${rowStyle}" class="${rowClass}">
                <td>${teamPos}</td>
                <td class="squadra-cell">
                    <img src="${teamLogos[team.squadra]}" alt="${team.squadra} logo" class="team-logo-leaderboard">
                    ${team.squadra}
                </td>
                <td>${team.punti}</td>
                <td>${team.giocate}</td>
                <td>${team.vinte}</td>
                <td>${team.pareggiate}</td>
                <td>${team.perse}</td>
                <td>${team.golFatti}</td>
                <td>${team.golSubiti}</td>
                <td>${team.differenzaReti > 0 ? '+' : ''}${team.differenzaReti}</td>
            </tr>
        `;
    });
    tableHTML += '</tbody></table>';

    leaderboardDiv.innerHTML = tableHTML;
}

// Funzione per creare la legenda della classifica
function createLegend(config) {
    const legendList = document.getElementById('legend-list');
    legendList.innerHTML = '';
    for (const key in config.positions) {
        const item = config.positions[key];
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="legend-color-box" style="background-color: ${item.backgroundColor}; border-color: ${item.borderColor};"></div>
            <span>${item.name}: ${item.description}</span>
        `;
        legendList.appendChild(li);
    }
}

// Funzione principale che inizializza l'applicazione
async function initializeApp() {
    const [data, config] = await Promise.all([loadData(), loadConfig()]);
    if (!data || !config) return;

    const { teams, teamLogos, calendar } = data;
    
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';
    
    calendar.forEach(day => {
        container.appendChild(createDaySection(day, teamLogos));
    });
    
    updateLeaderboard(calendar, teams, config, teamLogos);
    createLegend(config);
}

// Avvia l'applicazione
initializeApp();