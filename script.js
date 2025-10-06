// Theme Toggle
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

// Create Season Card
function createSeasonCard(season, isCurrent) {
  const currentBadge = isCurrent
    ? '<div class="current-badge">In corso</div>'
    : "";
  const championBadge = season.champion
    ? `<div class="champion-badge">${season.champion}</div>`
    : "";

  return `
                <a href="${season.url}" class="season-card">
                    ${currentBadge}
                    <div class="season-card-header">
                        <img src="${season.logo}" alt="Stagione ${season.year}">
                        <div class="season-year">${season.year}</div>
                    </div>
                    <div class="season-card-content">
                        <h3>${season.title}</h3>
                        ${championBadge}
                    </div>
                </a>
            `;
}

// Load Seasons
async function loadSeasons() {
  const seasonsGrid = document.getElementById("seasonsGrid");

  try {
    const response = await fetch("seasons-data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    seasonsGrid.innerHTML = "";

    const sortedSeasons = data.seasons.sort((a, b) => {
      const yearA = parseInt(a.year.split("-")[0]);
      const yearB = parseInt(b.year.split("-")[0]);
      return yearB - yearA;
    });

    if (sortedSeasons.length === 0) {
      seasonsGrid.innerHTML =
        '<div class="error-message">Nessuna stagione trovata.</div>';
      return;
    }

    sortedSeasons.forEach((season, index) => {
      if (!("champion" in season)) {
        season.champion = null;
      }
      const isCurrent = index === 0 && season.champion === null;
      seasonsGrid.innerHTML += createSeasonCard(season, isCurrent);
    });

    console.log(`Caricate ${sortedSeasons.length} stagioni con successo`);
  } catch (error) {
    console.error("Errore nel caricamento delle stagioni:", error);
    let errorMessage = "Errore nel caricamento delle stagioni.";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMessage =
        "Impossibile caricare il file seasons-data.json. Verifica che il file esista.";
    } else if (error.name === "SyntaxError") {
      errorMessage = "Il file JSON contiene errori di sintassi.";
    } else if (error.message.includes("404")) {
      errorMessage = "File seasons-data.json non trovato.";
    }

    seasonsGrid.innerHTML = `<div class="error-message">${errorMessage}</div>`;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  console.log("Inizializzazione pagina Generale Stagioni");
  initThemeToggle();
  loadSeasons();
});

// Online/offline status
window.addEventListener("online", function () {
  console.log("Connessione ripristinata");
  loadSeasons();
});

window.addEventListener("offline", function () {
  console.log("Connessione persa");
});
