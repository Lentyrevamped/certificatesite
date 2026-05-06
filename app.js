// Certify — landing-page logic
import { supabase, isConfigured } from "./supabase.js";

/* -------------------------------------------------------------------------- */
/*  Lucide icon refresh                                                       */
/* -------------------------------------------------------------------------- */
const renderIcons = () => window.lucide && window.lucide.createIcons();

/* -------------------------------------------------------------------------- */
/*  Toast                                                                     */
/* -------------------------------------------------------------------------- */
function toast(message, kind = "default") {
  const wrap = document.getElementById("toastWrap");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = message;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 220);
  }, 2800);
}

/* -------------------------------------------------------------------------- */
/*  Mobile nav toggle                                                         */
/* -------------------------------------------------------------------------- */
function initNav() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("primaryNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => nav.classList.remove("open"))
  );
}

/* -------------------------------------------------------------------------- */
/*  Announcements slider                                                      */
/* -------------------------------------------------------------------------- */
function initSlider() {
  const track = document.getElementById("sliderTrack");
  const dots = document.getElementById("sliderDots");
  const prev = document.getElementById("slidePrev");
  const next = document.getElementById("slideNext");
  if (!track || !dots || !prev || !next) return;

  const slides = Array.from(track.children);
  let perView = 3;
  let index = 0;
  let timer = null;

  const measure = () => {
    const w = window.innerWidth;
    perView = w <= 640 ? 1 : w <= 960 ? 2 : 3;
  };

  const maxIndex = () => Math.max(0, slides.length - perView);

  const renderDots = () => {
    dots.innerHTML = "";
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      if (i === index) b.classList.add("active");
      b.addEventListener("click", () => go(i, true));
      dots.appendChild(b);
    }
  };

  const apply = () => {
    const slideW = slides[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.style.transform = `translateX(${-(slideW + gap) * index}px)`;
    Array.from(dots.children).forEach((d, i) =>
      d.classList.toggle("active", i === index)
    );
  };

  const go = (i, manual = false) => {
    const max = maxIndex();
    index = ((i % (max + 1)) + (max + 1)) % (max + 1);
    apply();
    if (manual) restart();
  };

  const start = () => {
    stop();
    timer = setInterval(() => go(index + 1), 6000);
  };
  const stop = () => timer && clearInterval(timer);
  const restart = () => start();

  const onResize = () => {
    measure();
    if (index > maxIndex()) index = maxIndex();
    renderDots();
    apply();
  };

  measure();
  renderDots();
  apply();

  prev.addEventListener("click", () => go(index - 1, true));
  next.addEventListener("click", () => go(index + 1, true));
  track.parentElement.addEventListener("mouseenter", stop);
  track.parentElement.addEventListener("mouseleave", start);
  window.addEventListener("resize", onResize);

  start();
}

/* -------------------------------------------------------------------------- */
/*  Scroll-triggered fade-up                                                  */
/* -------------------------------------------------------------------------- */
function initScrollFades() {
  const targets = document.querySelectorAll(".fade-up");
  if (!targets.length || !("IntersectionObserver" in window)) {
    targets.forEach(t => t.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach(t => io.observe(t));
}

/* -------------------------------------------------------------------------- */
/*  Site logo                                                                 */
/* -------------------------------------------------------------------------- */
async function fetchLogo() {
  if (!isConfigured) return null;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "logo_url")
    .maybeSingle();
  return data?.value || null;
}

function applyLogo(url) {
  if (!url) return;
  document.querySelectorAll(".brand-mark-dyn").forEach(el => {
    el.classList.add("has-logo");
    el.innerHTML = `<img src="${url}" alt="Certify logo" />`;
  });
  // Update browser tab favicon
  const favicon = document.querySelector("link[rel='icon']");
  if (favicon) favicon.href = url;
}

/* -------------------------------------------------------------------------- */
/*  Hero image slider                                                         */
/* -------------------------------------------------------------------------- */
async function fetchBannerImages() {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from("banner_images")
    .select("id, cloudinary_url, caption")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) { console.error("Failed to load banner images:", error); return []; }
  return data || [];
}

function initHeroSlider(images) {
  const container = document.getElementById("heroMedia");
  if (!container || !images.length) return;

  container.innerHTML = "";

  images.forEach((img, i) => {
    const slide = document.createElement("div");
    slide.className = "hero-media-slide" + (i === 0 ? " active" : "");
    slide.innerHTML = `<img src="${img.cloudinary_url}" alt="${img.caption || ""}" />` +
      (img.caption ? `<div class="hero-media-caption">${img.caption}</div>` : "");
    container.appendChild(slide);
  });

  if (images.length < 2) return;

  // Dots
  const dotsEl = document.createElement("div");
  dotsEl.className = "hero-media-nav";
  images.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "hero-media-dot" + (i === 0 ? " active" : "");
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dotsEl.appendChild(b);
  });
  container.appendChild(dotsEl);

  // Arrows
  const arrowsEl = document.createElement("div");
  arrowsEl.className = "hero-media-arrows";
  arrowsEl.innerHTML = `
    <button class="hero-media-arrow" aria-label="Previous">
      <i data-lucide="chevron-left" class="icon" style="width:16px;height:16px"></i>
    </button>
    <button class="hero-media-arrow" aria-label="Next">
      <i data-lucide="chevron-right" class="icon" style="width:16px;height:16px"></i>
    </button>`;
  container.appendChild(arrowsEl);
  renderIcons();

  const slides = container.querySelectorAll(".hero-media-slide");
  const dots = container.querySelectorAll(".hero-media-dot");
  const [prevBtn, nextBtn] = container.querySelectorAll(".hero-media-arrow");
  let cur = 0;
  let timer;

  const goTo = i => {
    slides[cur].classList.remove("active");
    dots[cur].classList.remove("active");
    cur = ((i % slides.length) + slides.length) % slides.length;
    slides[cur].classList.add("active");
    dots[cur].classList.add("active");
  };
  const start = () => { stop(); timer = setInterval(() => goTo(cur + 1), 5000); };
  const stop = () => clearInterval(timer);

  prevBtn.addEventListener("click", () => { goTo(cur - 1); start(); });
  nextBtn.addEventListener("click", () => { goTo(cur + 1); start(); });
  dots.forEach((d, i) => d.addEventListener("click", () => { goTo(i); start(); }));
  container.addEventListener("mouseenter", stop);
  container.addEventListener("mouseleave", start);

  start();
}

/* -------------------------------------------------------------------------- */
/*  Organizations                                                             */
/* -------------------------------------------------------------------------- */
const monogram = (name) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

// Shown when Supabase isn't configured so the full UI flow can be walked.
const DEMO_ORGS = [
  { id: "demo-1", name: "Northbridge Institute", description: "Preview mode", logo_url: null },
  { id: "demo-2", name: "Pacific Standards Group", description: "Preview mode", logo_url: null },
  { id: "demo-3", name: "Meridian Certification Body", description: "Preview mode", logo_url: null },
];

async function fetchOrganizations() {
  if (!isConfigured) return DEMO_ORGS;
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url")
    .order("name", { ascending: true });
  if (error) {
    console.error("Failed to load organizations:", error);
    return DEMO_ORGS;
  }
  return data || [];
}

function renderOrgsStrip(orgs) {
  const grid = document.getElementById("orgsGrid");
  if (!grid) return;
  if (!orgs.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      The verified directory will appear here once organizations are added.
    </div>`;
    return;
  }
  grid.innerHTML = orgs
    .map(o => {
      const visual = o.logo_url
        ? `<img src="${o.logo_url}" alt="${o.name}" />`
        : `<div class="org-mark">${monogram(o.name)}</div>`;
      return `<div class="org-card">
        ${visual}
        <span class="org-name">${o.name}</span>
      </div>`;
    })
    .join("");
}

/* -------------------------------------------------------------------------- */
/*  Verification flow                                                         */
/* -------------------------------------------------------------------------- */
const verifyState = {
  orgId: null,
  orgName: null,
  certNumber: "",
  applicantName: "",
  orgs: [],
};

function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    const focusable = m.querySelector("input, button:not([disabled])");
    focusable && focusable.focus();
  }, 50);
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove("open");
  document.body.style.overflow = "";
}

function setStep(n) {
  const modal = document.getElementById("verifyModal");
  if (!modal) return;
  modal.querySelectorAll(".verify-step").forEach(s => {
    s.hidden = s.dataset.step !== String(n);
  });
  const stepper = document.getElementById("verifyStepper");
  if (n === "result") {
    stepper.querySelectorAll(".step-pill").forEach(p => {
      p.classList.remove("active");
      p.classList.add("done");
    });
    return;
  }
  stepper.querySelectorAll(".step-pill").forEach(p => {
    const s = Number(p.dataset.step);
    p.classList.toggle("active", s === n);
    p.classList.toggle("done", s < n);
  });
}

function renderOrgPicker() {
  const picker = document.getElementById("orgPicker");
  if (!picker) return;
  if (!verifyState.orgs.length) {
    picker.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      No organizations are available right now.
    </div>`;
    return;
  }
  picker.innerHTML = verifyState.orgs
    .map(o => {
      const visual = o.logo_url
        ? `<img src="${o.logo_url}" alt="${o.name}" />`
        : `<div class="org-mark">${monogram(o.name)}</div>`;
      const sel = verifyState.orgId === o.id ? "selected" : "";
      return `<button class="org-pick ${sel}" data-org="${o.id}" data-name="${o.name.replace(/"/g, "&quot;")}">
        ${visual}
        <span>${o.name}</span>
      </button>`;
    })
    .join("");

  picker.querySelectorAll(".org-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      verifyState.orgId = btn.dataset.org;
      verifyState.orgName = btn.dataset.name;
      picker.querySelectorAll(".org-pick").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("toStep2").disabled = false;
    });
  });
}

function resetVerify() {
  verifyState.orgId = null;
  verifyState.orgName = null;
  verifyState.certNumber = "";
  verifyState.applicantName = "";
  document.getElementById("certNumber").value = "";
  document.getElementById("applicantName").value = "";
  document.getElementById("toStep2").disabled = true;
  document.getElementById("toStep3").disabled = true;
  document.getElementById("runVerify").disabled = true;
  renderOrgPicker();
  setStep(1);
}

async function runVerification() {
  const orgId = verifyState.orgId;
  const certNum = verifyState.certNumber.trim();
  const name = verifyState.applicantName.trim();
  const resultBox = document.getElementById("resultContent");
  setStep("result");
  resultBox.innerHTML = `<div class="result-banner" style="background:var(--slate-100);color:var(--slate-700)">
    <i data-lucide="loader-circle" class="icon"></i> Looking up record…
  </div>`;
  renderIcons();

  if (!isConfigured) {
    resultBox.innerHTML = `
      <div class="result-banner fail"><i data-lucide="triangle-alert" class="icon"></i> Service unavailable</div>
      <p>Verification is temporarily unavailable. Please try again shortly.</p>`;
    renderIcons();
    return;
  }

  const { data, error } = await supabase
    .from("certificates")
    .select("certificate_number, applicant_name, cloudinary_url, created_at")
    .eq("organization_id", orgId)
    .ilike("certificate_number", certNum)   // case-insensitive cert number
    .limit(50);

  if (error) {
    resultBox.innerHTML = `
      <div class="result-banner fail"><i data-lucide="triangle-alert" class="icon"></i> Lookup failed</div>
      <p>We couldn't reach the verification service. Please try again in a moment.</p>`;
    renderIcons();
    return;
  }

  // Normalize: lowercase + collapse whitespace — handles mixed-case names
  const norm = s => (s || "").toLowerCase().trim().replace(/\s+/g, " ");
  const match = (data || []).find(r => norm(r.applicant_name) === norm(name));

  if (!match) {
    resultBox.innerHTML = `
      <div class="result-banner fail"><i data-lucide="x-circle" class="icon"></i> Certificate not found</div>
      <p>The details you entered did not match any record on file. Please verify the certificate number and the holder's full name, then try again.</p>`;
    renderIcons();
    return;
  }

  const issued = new Date(match.created_at).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric"
  });

  resultBox.innerHTML = `
    <div class="result-banner success">
      <i data-lucide="badge-check" class="icon"></i> Verified Authentic
    </div>
    <div class="result-image">
      <img src="${match.cloudinary_url}" alt="Certificate for ${match.applicant_name}" />
    </div>
    <div class="result-meta">
      <div>
        <div class="label">Holder</div>
        <div class="value">${match.applicant_name}</div>
      </div>
      <div>
        <div class="label">Issued by</div>
        <div class="value">${verifyState.orgName || ""}</div>
      </div>
      <div>
        <div class="label">Certificate №</div>
        <div class="value">${match.certificate_number}</div>
      </div>
      <div>
        <div class="label">On record since</div>
        <div class="value">${issued}</div>
      </div>
    </div>`;
  renderIcons();
}

function initVerifyModal() {
  document.querySelectorAll("[data-open-verify]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      resetVerify();
      openModal("verifyModal");
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      closeModal("verifyModal");
      closeModal("pinModal");
    });
  });
  document.querySelectorAll(".modal-backdrop").forEach(bd => {
    bd.addEventListener("click", e => {
      if (e.target === bd) {
        bd.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.open").forEach(m => {
        m.classList.remove("open");
      });
      document.body.style.overflow = "";
    }
  });

  document.getElementById("toStep2").addEventListener("click", () => setStep(2));
  document.getElementById("toStep3").addEventListener("click", () => {
    verifyState.certNumber = document.getElementById("certNumber").value;
    setStep(3);
  });
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => setStep(Number(btn.dataset.back)));
  });
  document.getElementById("runVerify").addEventListener("click", () => {
    verifyState.applicantName = document.getElementById("applicantName").value;
    runVerification();
  });
  document.getElementById("verifyAnother").addEventListener("click", resetVerify);

  const certInput = document.getElementById("certNumber");
  certInput.addEventListener("input", () => {
    document.getElementById("toStep3").disabled = !certInput.value.trim();
  });
  certInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && certInput.value.trim()) {
      e.preventDefault();
      document.getElementById("toStep3").click();
    }
  });

  const nameInput = document.getElementById("applicantName");
  nameInput.addEventListener("input", () => {
    document.getElementById("runVerify").disabled = !nameInput.value.trim();
  });
  nameInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && nameInput.value.trim()) {
      e.preventDefault();
      document.getElementById("runVerify").click();
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin entry                                                               */
/* -------------------------------------------------------------------------- */
function initAdminEntry() {
  const open = e => {
    if (e) e.preventDefault();
    const input = document.getElementById("pinInput");
    const err = document.getElementById("pinError");
    input.value = "";
    err.textContent = "";
    openModal("pinModal");
  };
  document.getElementById("adminLink")?.addEventListener("click", open);

  // Triple-click on the brand mark also opens the PIN modal.
  let clicks = 0;
  let resetT = null;
  document.getElementById("brand")?.addEventListener("click", e => {
    e.preventDefault();
    clicks++;
    clearTimeout(resetT);
    resetT = setTimeout(() => (clicks = 0), 600);
    if (clicks >= 3) {
      clicks = 0;
      open();
    }
  });

  const submit = () => {
    const input = document.getElementById("pinInput");
    const err = document.getElementById("pinError");
    if (input.value === "1911") {
      sessionStorage.setItem("certify_admin", "1");
      closeModal("pinModal");
      window.location.href = "admin.html";
    } else {
      err.textContent = "Incorrect PIN. Please try again.";
      input.value = "";
      input.focus();
    }
  };
  document.getElementById("pinSubmit").addEventListener("click", submit);
  document.getElementById("pinInput").addEventListener("keydown", e => {
    if (e.key === "Enter") submit();
  });
}

/* -------------------------------------------------------------------------- */
/*  Config / environment banner                                               */
/* -------------------------------------------------------------------------- */
function maybeShowConfigBanner() {
  // Block ES modules on file:// — show a clear how-to-fix message.
  if (location.protocol === "file:") {
    const banner = document.createElement("div");
    banner.className = "config-banner";
    banner.innerHTML =
      "⚠️ Open this site through a local server, not a <code>file://</code> URL. " +
      "Run <code>npx serve .</code> in this folder, then visit <code>http://localhost:3000</code>.";
    document.body.prepend(banner);
    return;
  }
  if (!isConfigured) {
    const banner = document.createElement("div");
    banner.className = "config-banner";
    banner.innerHTML =
      "Supabase is not configured — running in preview mode. " +
      "Add your credentials in <code>supabase.js</code> to enable live verification.";
    document.body.prepend(banner);
  }
}

/* -------------------------------------------------------------------------- */
/*  Boot                                                                      */
/* -------------------------------------------------------------------------- */
async function boot() {
  initNav();
  initSlider();
  initScrollFades();
  initVerifyModal();
  initAdminEntry();
  maybeShowConfigBanner();
  renderIcons();

  const [orgs, bannerImages, logoUrl] = await Promise.all([
    fetchOrganizations(),
    fetchBannerImages(),
    fetchLogo(),
  ]);

  verifyState.orgs = orgs;
  renderOrgsStrip(orgs);
  renderOrgPicker();
  initHeroSlider(bannerImages);
  applyLogo(logoUrl);
  renderIcons();
}

document.addEventListener("DOMContentLoaded", boot);
