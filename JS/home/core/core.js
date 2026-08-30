class SerieAApp {
  constructor() {
    this.seasonsGrid = document.getElementById("seasonsGrid");
    this.themeToggle = document.getElementById("theme-toggle");
    this.seasonsData = null;
  }

  init() {
    console.log("Inizializzazione pagina Generale Stagioni");
    this.initTheme();
    this.renderDateline();
    this.loadSeasons();
    this.initOnlineStatusHandling();
    this.initWhatsAppButton();
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

  // --- Theme Management ---
  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    this.themeToggle.addEventListener("click", () => {
      let currentTheme = document.documentElement.classList.contains("light")
        ? "light"
        : "dark";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector(".theme-icon");
    icon && (icon.textContent = theme === "light" ? "🌙" : "🌞");
  }
}
