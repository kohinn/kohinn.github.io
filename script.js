/* =========================================================
   日本語ページ・英語ページ共通のスクリプト
   <html lang="en"> のページは英語、それ以外は日本語で動きます。
========================================================= */
const LANG = document.documentElement.lang === "en" ? "en" : "ja";

const I18N = {
  ja: {
    data: "works.json",
    list: "illustration_jp.html",
    detail: "work_detail.html",
    contact: "contact_jp.html",
    loading: "読み込み中...",
    empty: "準備中です。",
    notFound: "作品が見つかりませんでした。",
    back: "← 作品一覧",
    backLong: "← 作品一覧へ戻る",
    tools: "使用ツール",
    duration: "制作期間",
    release: "リリース",
    request: "このようなイラストを依頼する",
    fullSize: "原寸で見る ↗",
    prev: "← 前の作品",
    next: "次の作品 →",
    pagerLabel: "前後の作品"
  },
  en: {
    data: "works_en.json",
    list: "illustration.html",
    detail: "work_detail_en.html",
    contact: "contact.html",
    loading: "Loading...",
    empty: "Coming soon.",
    notFound: "Work not found.",
    back: "← All works",
    backLong: "← Back to all works",
    tools: "Tools",
    duration: "Time spent",
    release: "Released",
    request: "Commission a piece like this",
    fullSize: "View full size ↗",
    prev: "← Previous",
    next: "Next →",
    pagerLabel: "Previous and next work"
  }
};
const T = I18N[LANG];

/* =========================
   ハンバーガーメニュー
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
   作品の並べ替え
   works.json の "date"（例: "2026-11"）が新しい順。同じ月は、ファイルに書いた順。
   date が無い作品は、release（「2026年11月」「November 2026」）から読み取ります。
========================= */
const MONTHS = ["january", "february", "march", "april", "may", "june", "july",
                "august", "september", "october", "november", "december"];

function releaseKey(work) {
  if (work.date) return work.date;
  const release = work.release || "";
  const ja = release.match(/(\d{4})年\s*(\d{1,2})月/);
  if (ja) return `${ja[1]}-${ja[2].padStart(2, "0")}`;
  const en = release.match(/([A-Za-z]+)\s+(\d{4})/);
  if (en) {
    const m = MONTHS.indexOf(en[1].toLowerCase());
    if (m >= 0) return `${en[2]}-${String(m + 1).padStart(2, "0")}`;
  }
  return "0000-00";
}

function sortWorks(data) {
  return data
    .map((work, i) => [work, i])
    .sort((a, b) => releaseKey(b[0]).localeCompare(releaseKey(a[0])) || a[1] - b[1])
    .map(([work]) => work);
}

/* HTMLの属性に入れる文字列を安全にする */
function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/* タイトルから <br> などのタグを取り除く */
function plainTitle(html) {
  return String(html).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").trim();
}

/* 画像の大きさの指定（読み込み前に場所を確保して、画面が動くのを防ぐ） */
function sizeAttrs(work) {
  return work.w && work.h ? ` width="${work.w}" height="${work.h}"` : "";
}

function detailLink(work) {
  return `${T.detail}?id=${encodeURIComponent(work.id)}`;
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
  if (fadeItems.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.2 });
    fadeItems.forEach(item => observer.observe(item));
  }

  /* 作品詳細ページ */
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const workDetail = document.getElementById("workDetail");

  if (workDetail) {
    const notFound = () => {
      workDetail.innerHTML = `
        <p class="work-empty">${T.notFound}</p>
        <p class="work-empty"><a href="${T.list}" class="arrow-link">${T.backLong}</a></p>
      `;
    };

    if (!id) {
      notFound();
    } else {
      fetch(T.data)
        .then(res => res.json())
        .then(data => {
          const sorted = sortWorks(data);
          const index = sorted.findIndex(w => w.id === id);
          if (index === -1) { notFound(); return; }

          const work = sorted[index];
          const title = plainTitle(work.title);
          document.title = `${title} | Kohinn`;

          // 言語切り替え（JP / EN）が、同じ作品の別言語ページに飛ぶようにする
          const query = `?id=${encodeURIComponent(work.id)}`;
          document.querySelectorAll(".lang a").forEach(a => {
            const label = a.textContent.trim();
            if (label === "JP") a.href = `${I18N.ja.detail}${query}`;
            if (label === "EN") a.href = `${I18N.en.detail}${query}`;
          });

          // 詳細では「large」（幅1600px前後）を表示。元の大きな画像は「原寸で見る」から
          const media = work.video
            ? `<video src="${escapeAttr(work.video)}" autoplay loop muted playsinline class="work-image"></video>`
            : `<img src="${escapeAttr(work.large || work.image)}"${sizeAttrs(work)} alt="${escapeAttr(title)}" class="work-image" fetchpriority="high" decoding="async">`;

          const fullSize = work.image
            ? `<a href="${escapeAttr(work.image)}" target="_blank" rel="noopener" class="btn btn-ghost">${T.fullSize}</a>`
            : "";

          const seriesLabel = work.series === "original" ? "Original" : "Fan Art";

          const specs = [
            [T.tools, work.tools],
            [T.duration, work.duration],
            [T.release, work.release]
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => `<div class="work-row"><dt>${label}</dt><dd>${value}</dd></div>`)
            .join("");

          // 前後の作品（一覧と同じ並び順）
          const prev = sorted[index - 1];
          const next = sorted[index + 1];
          const pager = (prev || next) ? `
            <nav class="work-pager" aria-label="${T.pagerLabel}">
              ${prev ? `<a href="${detailLink(prev)}" class="pager-link">${T.prev}</a>` : "<span></span>"}
              ${next ? `<a href="${detailLink(next)}" class="pager-link">${T.next}</a>` : "<span></span>"}
            </nav>` : "";

          workDetail.innerHTML = `
            <a href="${T.list}" class="back-link">${T.back}</a>

            <div class="work-layout${work.wide ? " is-wide" : ""}">
              <div class="work-media">${media}</div>

              <aside class="work-info">
                <p class="work-tag">${seriesLabel}</p>
                <h1 class="work-title">${work.title}</h1>
                ${work.description ? `<p class="work-desc">${work.description}</p>` : ""}
                ${specs ? `<dl class="work-spec">${specs}</dl>` : ""}
                <a href="${T.contact}" class="btn btn-primary">${T.request}</a>
                ${fullSize}
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
    gallery.innerHTML = `<p style='text-align:center;'>${T.loading}</p>`;

    fetch(T.data)
      .then(res => res.json())
      .then(data => {

        const sortedData = sortWorks(data);

        function renderGallery(items) {
          if (items.length === 0) {
            gallery.innerHTML = `<p style='text-align:center;'>${T.empty}</p>`;
            return;
          }
          gallery.innerHTML = items.map((work, i) => {
            const wideClass = work.wide ? " gallery-item-wide" : "";
            const href = detailLink(work);
            if (work.video) {
              return `
                <figure class="gallery-item${wideClass}">
                  <a href="${href}">
                    <video src="${escapeAttr(work.video)}" autoplay loop muted playsinline></video>
                  </a>
                </figure>
              `;
            }
            // 最初の3枚はすぐ読み込み、それ以降は見える直前に読み込む
            const loading = i < 3 ? "eager" : "lazy";
            return `
              <figure class="gallery-item${wideClass}">
                <a href="${href}">
                  <img src="${escapeAttr(work.thumb || work.image)}"${sizeAttrs(work)} loading="${loading}" decoding="async" alt="${escapeAttr(plainTitle(work.title))}">
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

      })
      .catch(() => {
        gallery.innerHTML = `<p style='text-align:center;'>${T.empty}</p>`;
      });
  }

});
