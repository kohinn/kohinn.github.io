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

  /* Work Detail Page */
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const workDetail = document.getElementById("workDetail");

  if (id && workDetail) {
    fetch("works_en.json")
      .then(res => res.json())
      .then(data => {
        const work = data.find(w => w.id === id);
        if (!work) return;

        // Detect image or video
        const media = work.video
          ? `<video src="${work.video}" autoplay loop muted playsinline class="work-image"></video>`
          : `<img src="${work.image}" alt="${work.title}" class="work-image">`;

        workDetail.innerHTML = `
          <h1>${work.title}</h1>
          ${media}
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

        initBurgerMenu(); // Reinitialize
      });
  }

  /* Work Gallery Page */
  const gallery = document.getElementById("gallery");
  if (gallery) {
    fetch("works_en.json")
      .then(res => res.json())
      .then(data => {
        gallery.innerHTML = data.map(work => {
  const wideClass = work.wide ? " gallery-item-wide" : "";
  // 動画対応
  if (work.video) {
    return `
      <figure class="gallery-item${wideClass}">
        <a href="work_detail.html?id=${work.id}">
          <video src="${work.video}" autoplay loop muted playsinline></video>
        </a>
      </figure>
    `;
  }
  // 画像
  return `
    <figure class="gallery-item${wideClass}">
      <a href="work_detail.html?id=${work.id}">
        <img src="${work.image}" loading="lazy" decoding="async" alt="${work.title}">
      </a>
    </figure>
  `;
}).join("");
      });
  }

}); // Correct closing bracket

