// Filtri classifica: slider giornate e filtri casa/trasferta/globale
Object.assign(SeasonPageApp.prototype, {
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
  },

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
  },

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
  },

  _getActiveLeaderboardData() {
    if (this.activeFilter === "casa") return this.leaderboardDataHome;
    if (this.activeFilter === "trasferta") return this.leaderboardDataAway;
    return this.leaderboardData;
  },

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
  },

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

  // ─────────────────────────────────────────────────────────────────────────────
  // SORTING — versione corretta con scontri diretti calcolati per gruppi
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Ordina i team applicando:
   *   1. Punti (desc)
   *   2. Differenza reti globale (desc)
   *   3. Gol fatti globali (desc)
   *   4. Gol subiti globali (asc)
   *   5. Scontri diretti (punti, poi diff reti, poi gol fatti, poi gol subiti)
   *      — calcolati per blocco, non coppia per coppia
   *   6. Nome alfabetico (asc)
   */
});
