// Calcolo e rendering della classifica
Object.assign(SeasonPageApp.prototype, {
  _renderLeaderboard() {
    this._computeAndApplyLeaderboard();
    this._initRoundRangeSlider();
  },

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
  },

  // Inizializza e aggiorna il range slider giornate
  _sortTeams(teams, allMatches) {
    // Fase 1: ordine generale senza scontri diretti
    const sorted = [...teams].sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      if (b.differenzaReti !== a.differenzaReti)
        return b.differenzaReti - a.differenzaReti;
      if (b.golFatti !== a.golFatti) return b.golFatti - a.golFatti;
      if (a.golSubiti !== b.golSubiti) return a.golSubiti - b.golSubiti;
      return a.squadra.localeCompare(b.squadra);
    });

    // Fase 2: per ogni gruppo a pari punti, applica scontri diretti
    const result = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (j < sorted.length && sorted[j].punti === sorted[i].punti) j++;

      const group = sorted.slice(i, j);
      if (group.length > 1) {
        result.push(...this._resolveByHeadToHead(group, allMatches));
      } else {
        result.push(group[0]);
      }
      i = j;
    }
    return result;
  },

  /**
   * Risolve l'ordine interno di un gruppo di squadre a pari punti
   * usando esclusivamente i risultati degli scontri diretti tra loro.
   */
  _resolveByHeadToHead(group, allMatches) {
    const names = group.map((t) => t.squadra);
    const h2h = {};
    names.forEach((n) => {
      h2h[n] = { punti: 0, golFatti: 0, golSubiti: 0 };
    });

    // Considera solo le partite tra squadre del gruppo
    allMatches.forEach((m) => {
      if (
        m.homeScore !== null &&
        m.awayScore !== null &&
        names.includes(m.home) &&
        names.includes(m.away)
      ) {
        h2h[m.home].golFatti += m.homeScore;
        h2h[m.home].golSubiti += m.awayScore;
        h2h[m.away].golFatti += m.awayScore;
        h2h[m.away].golSubiti += m.homeScore;

        if (m.homeScore > m.awayScore) {
          h2h[m.home].punti += 3;
        } else if (m.homeScore < m.awayScore) {
          h2h[m.away].punti += 3;
        } else {
          h2h[m.home].punti += 1;
          h2h[m.away].punti += 1;
        }
      }
    });

    return [...group].sort((a, b) => {
      const ha = h2h[a.squadra];
      const hb = h2h[b.squadra];

      // 1. Punti negli scontri diretti
      if (hb.punti !== ha.punti) return hb.punti - ha.punti;

      // 2. Differenza reti negli scontri diretti
      const drA = ha.golFatti - ha.golSubiti;
      const drB = hb.golFatti - hb.golSubiti;
      if (drB !== drA) return drB - drA;

      // 3. Gol fatti negli scontri diretti
      if (hb.golFatti !== ha.golFatti) return hb.golFatti - ha.golFatti;

      // 4. Gol subiti negli scontri diretti
      if (ha.golSubiti !== hb.golSubiti) return ha.golSubiti - hb.golSubiti;

      // 5. Fallback alfabetico
      return a.squadra.localeCompare(b.squadra);
    });
  },

  // ─────────────────────────────────────────────────────────────────────────────

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
  },

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
});
