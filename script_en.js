/* =========================
   Hamburger Menu
========================= */
function initBurgerMenu() {
  const burger = document.getElementById("burgerBtn");
  const menu = document.getElementById("navMenu");

  if (!burger || !menu) return;
  if (burger.dataset.ready) return;   // Prevent duplicate registration
  burger.dataset.ready = "1";

  const setOpen = (open) => {
    burger.classList.toggle("active", open);
    menu.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  };

  burger.setAttribute("aria-controls", "navMenu");
  burger.setAttribute("aria-expanded", "false");

  burger.onclick = () => setOpen(!menu.classList.contains("active"));

  // Close with Esc key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Reset menu state when resized to desktop width
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) setOpen(false);
  });
}

/* =========================
   Sort Works (Newest release first; same month keeps works.json order)
========================= */
function parseRelease(str) {
  if (!str) return 0;
  const match = str.match(/(\d{4})年(\d{1,2})月/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 100 + parseInt(match[2], 10);
}

function sortWorks(data) {
  return [...data].sort((a, b) => parseRelease(b.release) - parseRelease(a.release));
}

/* Escape strings safely for HTML attributes */
function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/* Strip <br> and other HTML tags from title */
function plainTitle(html) {
  return String(html).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").trim();
}

/* =========================
   Run on DOMContentLoaded
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initBurgerMenu();

  /* Assemble email address (avoid plain text in HTML) */
  const mailBtn = document.getElementById("mailButton");
  if (mailBtn) {
    mailBtn.addEventListener("click", () => {
      const user = "kohinn.ver2";
      const domain = "gmail.com";
      window.location.href = `mailto:${user}@${domain}`;
    });
  }

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

  if (workDetail) {
    const notFound = () => {
      workDetail.innerHTML = `
        <p class="work-empty">Artwork not found.</p>
        <p class="work-empty"><a href="illustration.html" class="arrow-link">← Back to Gallery</a></p>
      `;
    };

    if (!id) {
      notFound();
    } else {
      fetch("works.json")
        .then(res => res.json())
        .then(data => {
          const sorted = sortWorks(data);
          const index = sorted.findIndex(w => w.id === id);
          if (index === -1) { notFound(); return; }

          const work = sorted[index];
          const title = plainTitle(work.title);
          document.title = `${title} | Kohinn`;

          const media = work.video
            ? `<video src="${escapeAttr(work.video)}" autoplay loop muted playsinline class="work-image"></video>`
            : `<img src="${escapeAttr(work.image)}" alt="${escapeAttr(title)}" class="work-image">`;

          const seriesLabel = work.series === "original" ? "Original" : "Fan Art";

          const specs = [
            ["Tools", work.tools],
            ["Duration", work.duration],
            ["Release", work.release]
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => `<div class="work-row"><dt>${label}</dt><dd>${value}</dd></div>`)
            .join("");

          // Previous / Next works (same order as gallery)
          const prev = sorted[index - 1];
          const next = sorted[index + 1];
          const link = (w) => `work_detail.html?id=${encodeURIComponent(w.id)}`;
          const pager = (prev || next) ? `
            <nav class="work-pager" aria-label="Previous and next artworks">
              ${prev ? `<a href="${link(prev)}" class="pager-link">← Previous</a>` : "<span></span>"}
              ${next ? `<a href="${link(next)}" class="pager-link">Next →</a>` : "<span></span>"}
            </nav>` : "";

          workDetail.innerHTML = `
            <a href="illustration.html" class="back-link">← Gallery</a>

            <div class="work-layout${work.wide ? " is-wide" : ""}">
              <div class="work-media">${media}</div>

              <aside class="work-info">
                <p class="work-tag">${seriesLabel}</p>
                <h1 class="work-title">${work.title}</h1>
                ${work.description ? `<p class="work-desc">${work.description}</p>` : ""}
                ${specs ? `<dl class="work-spec">${specs}</dl>` : ""}
                <a href="contact.html" class="btn btn-primary">Commission an illustration like this</a>
              </aside>
            </div>

            ${pager}
          `;
        })
        .catch(notFound);
    }
  }

  /* Illustration Gallery Page */
  const gallery = document.getElementById("gallery");
  if (gallery) {
    gallery.innerHTML = "<p style='text-align:center;'>Loading...</p>";

    fetch("works.json")
      .then(res => res.json())
      .then(data => {

        const sortedData = sortWorks(data);

        function renderGallery(items) {
          if (items.length === 0) {
            gallery.innerHTML = "<p style='text-align:center;'>Coming soon.</p>";
            return;
          }
          gallery.innerHTML = items.map(work => {
            const wideClass = work.wide ? " gallery-item-wide" : "";
            if (work.video) {
              return `
                <figure class="gallery-item${wideClass}">
                  <a href="work_detail.html?id=${work.id}">
                    <video src="${work.video}" autoplay loop muted playsinline></video>
                  </a>
                </figure>
              `;
            }
            return `
              <figure class="gallery-item${wideClass}">
                <a href="work_detail.html?id=${work.id}">
                  <img src="${work.image}" loading="lazy" decoding="async" alt="${work.title}">
                </a>
              </figure>
            `;
          }).join("");
        }

        renderGallery(sortedData);

        const tabs = document.querySelectorAll(".filter-tabs button");
        tabs.forEach(btn => {
          btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;
            const filtered = filter === "all"
              ? sortedData
              : filter === "fanart"
                ? sortedData.filter(w => w.series !== "original")
                : sortedData.filter(w => w.series === filter);

            renderGallery(filtered);

            tabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
          });
        });

      });
  }

});

  }

});
