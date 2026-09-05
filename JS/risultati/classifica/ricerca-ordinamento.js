// Ricerca squadra e ordinamento colonne classifica
Object.assign(SeasonPageApp.prototype, {
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
  },

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
  },

  _defaultDirection(criteria) {
    if (criteria === "golSubiti" || criteria === "perse") return "asc";
    if (criteria === "squadra") return "asc";
    return "desc";
  },

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
  },

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
  },

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
  },

  _updateSortIndicators() {
    document
      .querySelectorAll(".leaderboard-table th[data-sort]")
      .forEach((th) => {
        th.classList.remove("sort-asc", "sort-desc", "sort-active");
        if (th.dataset.sort === this.sortColumn) {
          th.classList.add("sort-active", `sort-${this.sortDirection}`);
        }
      });
  },
});
