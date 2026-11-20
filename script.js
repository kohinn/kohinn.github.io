/* =========================
   ハンバーガーメニュー（関数化）
========================= */
function initBurgerMenu() {
  const burger = document.getElementById("burgerBtn");
  const menu = document.getElementById("navMenu");

  if (!burger || !menu) return;
  if (burger.dataset.ready) return;   // 二重に登録しない
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

  // Escキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // 画面を広げてPC表示になったら、開いたままにしない
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) setOpen(false);
  });
}

/* =========================
   作品の並べ替え（release の新しい順。同じ月は works.json の順）
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

/* HTMLの属性に入れる文字列を安全にする */
function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/* タイトルから <br> などのタグを取り除く */
function plainTitle(html) {
  return String(html).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").trim();
}

/* =========================
   DOM読み込み時に実行
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initBurgerMenu();

  /* メールアドレス組み立て(直接記載を避ける) */
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

  /* 作品詳細ページ */
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const workDetail = document.getElementById("workDetail");

  if (workDetail) {
    const notFound = () => {
      workDetail.innerHTML = `
        <p class="work-empty">作品が見つかりませんでした。</p>
        <p class="work-empty"><a href="illustration_jp.html" class="arrow-link">← 作品一覧へ戻る</a></p>
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
            ["使用ツール", work.tools],
            ["制作期間", work.duration],
            ["リリース", work.release]
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => `<div class="work-row"><dt>${label}</dt><dd>${value}</dd></div>`)
            .join("");

          // 前後の作品（一覧と同じ並び順）
          const prev = sorted[index - 1];
          const next = sorted[index + 1];
          const link = (w) => `work_detail.html?id=${encodeURIComponent(w.id)}`;
          const pager = (prev || next) ? `
            <nav class="work-pager" aria-label="前後の作品">
              ${prev ? `<a href="${link(prev)}" class="pager-link">← 前の作品</a>` : "<span></span>"}
              ${next ? `<a href="${link(next)}" class="pager-link">次の作品 →</a>` : "<span></span>"}
            </nav>` : "";

          workDetail.innerHTML = `
            <a href="illustration_jp.html" class="back-link">← 作品一覧</a>

            <div class="work-layout${work.wide ? " is-wide" : ""}">
              <div class="work-media">${media}</div>

              <aside class="work-info">
                <p class="work-tag">${seriesLabel}</p>
                <h1 class="work-title">${work.title}</h1>
                ${work.description ? `<p class="work-desc">${work.description}</p>` : ""}
                ${specs ? `<dl class="work-spec">${specs}</dl>` : ""}
                <a href="contact_jp.html" class="btn btn-primary">このようなイラストを依頼する</a>
              </aside>
            </div>

            ${pager}
          `;
        })
        .catch(notFound);
    }
  }

  /* 作品一覧ページ */
  const gallery = document.getElementById("gallery");
  if (gallery) {
    gallery.innerHTML = "<p style='text-align:center;'>読み込み中...</p>";

    fetch("works.json")
      .then(res => res.json())
      .then(data => {

        const sortedData = sortWorks(data);

        function renderGallery(items) {
          if (items.length === 0) {
            gallery.innerHTML = "<p style='text-align:center;'>準備中です。</p>";
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
