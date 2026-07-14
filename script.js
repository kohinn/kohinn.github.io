/* =========================
   ハンバーガーメニュー
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burgerBtn");
  const menu = document.getElementById("navMenu");

  if (burger && menu) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("active");
      menu.classList.toggle("active");
    });
  }
});

/* =========================
   Scroll Fade（フェードイン）
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const fadeItems = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.2 });

  fadeItems.forEach(item => observer.observe(item));
});

/* =========================
   作品詳細ページ（JSON読み込み）
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // id がないページ（一覧ページなど）は何もしない
  if (!id) return;

  // JSON読み込み
  fetch("works.json")
    .then(res => res.json())
    .then(data => {
      const work = data.find(w => w.id === id);
      if (!work) return;

      // HTMLに反映
      document.getElementById("workDetail").innerHTML = `
        <h1>${work.title}</h1>
        <img src="${work.image}" alt="${work.title}" class="work-image">

        <div class="work-meta">
          <h3>概要</h3>
          <p>${work.description}</p>

          <h3>使用媒体</h3>
          <p>${work.media}</p>

          <h3>タグ</h3>
          <p>${work.tags.join(", ")}</p>

          <h3>カラー</h3>
          <div class="color-palette">
            ${work.colors.map(c => `<span style="background:${c};"></span>`).join("")}
          </div>

          <h3>リリース</h3>
          <p>${work.release}</p>
        </div>

        <div class="work-nav">
          <a href="illustration_jp.html" class="arrow-link">← 作品一覧へ戻る</a>
        </div>
      `;
    });
});
/* =========================
   作品一覧ページ（自動生成）
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("gallery");

  // 一覧ページでない場合はスキップ
  if (!gallery) return;

  fetch("works.json")
    .then(res => res.json())
    .then(data => {
      gallery.innerHTML = data.map(work => `
        <figure class="gallery-item">
          <a href="work_detail.html?id=${work.id}">
            <img src="${work.image}" loading="lazy" alt="${work.title}">
          </a>
          <figcaption>${work.title}</figcaption>
        </figure>
      `).join("");
    });
});
