// Condivisione elenco stagioni via WhatsApp
Object.assign(SerieAApp.prototype, {
  initWhatsAppButton() {
    const whatsappBtn = document.getElementById("whatsapp-share-seasons-btn");
    if (whatsappBtn) {
      whatsappBtn.addEventListener("click", () =>
        this.shareSeasonsOnWhatsApp(),
      );
    }
  },

  shareSeasonsOnWhatsApp() {
    if (!this.seasonsData || this.seasonsData.length === 0) {
      alert("Carica prima i dati delle stagioni!");
      return;
    }

    let message = "*SERIE A - ARCHIVIO STAGIONI*\n";
    message += `Riepilogo completo\n`;
    message += `${"=".repeat(40)}\n\n`;

    this.seasonsData.forEach((season) => {
      const statusText = season.champion ? "COMPLETATA" : "IN CORSO";
      const championText = season.champion
        ? `\n   Campione: ${season.champion}`
        : "";

      message += `*${season.year}* - ${statusText}${championText}\n\n`;
    });

    message += `${"=".repeat(40)}\n`;
    message += `Serie A Archive - ${this.seasonsData.length} stagioni disponibili`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
  }
});
