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
    this.renderDateline();
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

  // --- Dateline in stile testata giornale ---
  renderDateline() {
    const el = document.getElementById("dateline");
    if (!el) return;
    const formatted = new Date().toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    el.textContent = formatted;
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
}
