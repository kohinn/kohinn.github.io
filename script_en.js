/* =========================
   Hamburger Menu (Function)
========================= */
function initBurgerMenu() {
  const burger = document.getElementById("burgerBtn");
  const menu = document.getElementById("navMenu");

  if (burger && menu) {
    burger.onclick = () => {
      burger.classList.toggle("active");
      menu.classList.toggle("active");
    };
  }
}

/* =========================
   Execute on DOM Load
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initBurgerMenu();

  /* Scroll Fade */
  const fadeItems = document.querySelectorAll(".fade-in");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.2 });
  fadeItems.forEach(item => observer.observe(item));

  /* Work Detail Page (EN) */
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const workDetail = document.getElementById("workDetail");

  if (id && workDetail) {
    fetch("works_en.json") // ← EN版のJSONに変更
      .then(res => res.json())
      .then(data => {
        const work = data.find(w => w.id === id);
        if (!work) return;

        workDetail.innerHTML = `
          <h1>${work.title}</h1>
          <img src="${work.image}" alt="${work.title}" class="work-image">
          <div class="work-meta">
            ${work.description ? `<h3>Description</h3><p>${work.description}</p>` : ""}
            ${work.tools ? `<h3>Tools Used</h3><p>${work.tools}</p>` : ""}
            ${work.duration ? `<h3>Production Time</h3><p>${work.duration}</p>` : ""}
            ${work.release ? `<h3>Release</h3><p>${work.release}</p>` : ""}
          </div>
          <div class="work-nav">
            <a href="illustration.html" class="arrow-link">← Back to Gallery</a>
          </div>
        `;

        initBurgerMenu(); // Re-init after dynamic content
      });
  }

  /* Illustration Gallery (EN) */
  const gallery = document.getElementById("gallery");
  if (gallery) {
    fetch("works_en.json") // ← EN版のJSONに変更
      .then(res => res.json())
      .then(data => {
        gallery.innerHTML = data.map(work => `
          <figure class="gallery-item">
            <a href="work_detail_en.html?id=${work.id}">
              <img src="${work.image}" loading="lazy" alt="${work.title}">
            </a>
            <figcaption>${work.title}</figcaption>
          </figure>
        `).join("");
      });
  }
});
