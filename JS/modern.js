// Serie A · Modern layer: progress di scroll, torna-su, reveal, indice righe
(() => {
  const bar = Object.assign(document.createElement("div"), {
    className: "sa-progress",
  });
  const top = Object.assign(document.createElement("button"), {
    className: "sa-top",
    type: "button",
    ariaLabel: "Torna su",
    textContent: "↑",
  });
  document.body.append(bar, top);
  top.onclick = () => scrollTo({ top: 0, behavior: "smooth" });
  const onScroll = () => {
    const h = document.documentElement,
      max = h.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    top.classList.toggle("show", scrollY > 500);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const io = new IntersectionObserver(
    (es) =>
      es.forEach(
        (e) =>
          e.isIntersecting &&
          (e.target.classList.add("in"), io.unobserve(e.target)),
      ),
    { threshold: 0.08 },
  );
  const watch = () => {
    document
      .querySelectorAll(
        ".season-card-wrap,.day-card,.leaderboard-card,.legend-card,.table-wrapper,.controls-section",
      )
      .forEach(
        (el) =>
          !el.dataset.sa &&
          ((el.dataset.sa = 1), el.classList.add("sa-reveal"), io.observe(el)),
      );
    document
      .querySelectorAll("tbody tr")
      .forEach((tr, i) => tr.style.setProperty("--i", Math.min(i, 30)));
  };
  new MutationObserver(watch).observe(document.body, {
    childList: true,
    subtree: true,
  });
  watch();
})();
