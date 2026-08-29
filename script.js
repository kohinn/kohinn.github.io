/* =========================
   ハンバーガーメニュー（関数化）
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
   DOM読み込み時に実行
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

  /* 作品詳細ページ */
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const workDetail = document.getElementById("workDetail");

  if (id && workDetail) {
    fetch("works.json")
      .then(res => res.json())
      .then(data => {
        const work = data.find(w => w.id === id);
        if (!work) return;

        // 画像か動画か判定
        const media = work.video
          ? `<video src="${work.video}" autoplay loop muted playsinline class="work-image"></video>`
          : `<img src="${work.image}" alt="${work.title}" class="work-image">`;

        workDetail.innerHTML = `
          <h1>${work.title}</h1>
          ${media}
          <div class="work-meta">
            ${work.description ? `<h3>制作概要</h3><p>${work.description}</p>` : ""}
            ${work.tools ? `<h3>使用ツール</h3><p>${work.tools}</p>` : ""}
            ${work.duration ? `<h3>制作期間</h3><p>${work.duration}</p>` : ""}
            ${work.release ? `<h3>リリース</h3><p>${work.release}</p>` : ""}
          </div>
          <div class="work-nav">
            <a href="illustration_jp.html" class="arrow-link">← 作品一覧へ戻る</a>
          </div>
        `;

        initBurgerMenu(); // 再初期化
      });
  }

  /* 作品一覧ページ */
  const gallery = document.getElementById("gallery");
  if (gallery) {
    fetch("works.json")
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

}); // ← これが正しい閉じカッコ位置
