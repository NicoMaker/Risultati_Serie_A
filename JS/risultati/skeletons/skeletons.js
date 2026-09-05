// Metodi di rendering degli skeleton (placeholder di caricamento)
Object.assign(SeasonPageApp.prototype, {
  _renderSkeletons() {
    this._renderCalendarSkeleton(3, 6);
    this._renderLeaderboardSkeleton(12);
  },

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
  },

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
  },
});
