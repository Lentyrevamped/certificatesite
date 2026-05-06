// Certify — admin console
import { supabase, isConfigured } from "./supabase.js";

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
/*  PIN gate                                                                  */
/* -------------------------------------------------------------------------- */
function gateOk() {
  return sessionStorage.getItem("certify_admin") === "1";
}

function initGate() {
  const gate = document.getElementById("gateModal");
  const input = document.getElementById("gatePin");
  const err = document.getElementById("gateError");
  const submit = document.getElementById("gateSubmit");

  const tryUnlock = () => {
    if (input.value === "1911") {
      sessionStorage.setItem("certify_admin", "1");
      gate.classList.remove("open");
      document.body.style.overflow = "";
      bootAdmin();
    } else {
      err.textContent = "Incorrect PIN.";
      input.value = "";
      input.focus();
    }
  };

  if (!gateOk()) {
    gate.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => input.focus(), 50);
  } else {
    bootAdmin();
  }

  submit.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") tryUnlock();
  });

  document.getElementById("signOut").addEventListener("click", () => {
    sessionStorage.removeItem("certify_admin");
    window.location.href = "index.html";
  });
}

/* -------------------------------------------------------------------------- */
/*  Tabs                                                                      */
/* -------------------------------------------------------------------------- */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach(b =>
    b.addEventListener("click", () => {
      buttons.forEach(x => x.classList.remove("active"));
      panels.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      document.querySelector(`.tab-panel[data-panel="${b.dataset.tab}"]`).classList.add("active");
    })
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const fmtDate = iso =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

const isUrl = (v) => {
  try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
};

function ensureConfigured() {
  if (isConfigured) return true;
  toast("Connect Supabase in supabase.js to use the admin console.", "error");
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Organizations                                                             */
/* -------------------------------------------------------------------------- */
const state = { orgs: [], selectedOrg: "", certs: [] };

async function loadOrganizations() {
  if (!isConfigured) {
    renderOrgsTable([]);
    return;
  }
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    toast("Failed to load organizations.", "error");
    console.error(error);
    return;
  }
  state.orgs = data || [];
  renderOrgsTable(state.orgs);
  populateOrgSelects(state.orgs);
}

function renderOrgsTable(orgs) {
  const tbody = document.querySelector("#orgsTable tbody");
  const count = document.getElementById("orgCount");
  count.textContent =
    orgs.length === 1 ? "1 organization on the network" : `${orgs.length} organizations on the network`;
  if (!orgs.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No organizations yet. Add your first above.</td></tr>`;
    return;
  }
  tbody.innerHTML = orgs
    .map(o => `
      <tr>
        <td data-label="Name"><strong>${escapeHtml(o.name)}</strong></td>
        <td data-label="Description">${escapeHtml(o.description || "—")}</td>
        <td data-label="Logo">${
          o.logo_url
            ? `<a href="${escapeHtml(o.logo_url)}" target="_blank" rel="noopener"><img class="thumb" src="${escapeHtml(o.logo_url)}" alt="" /></a>`
            : '<span style="color:var(--slate-400)">—</span>'
        }</td>
        <td data-label="Created">${fmtDate(o.created_at)}</td>
        <td data-label="">
          <button class="btn btn-danger btn-sm" data-del-org="${o.id}">
            <i data-lucide="trash-2" class="icon" style="width:14px;height:14px"></i> Delete
          </button>
        </td>
      </tr>`)
    .join("");
  renderIcons();

  tbody.querySelectorAll("[data-del-org]").forEach(btn => {
    btn.addEventListener("click", () => deleteOrganization(btn.dataset.delOrg));
  });
}

function populateOrgSelects(orgs) {
  const certOrg = document.getElementById("certOrg");
  const filterOrg = document.getElementById("filterOrg");
  const opts = orgs.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join("");
  certOrg.innerHTML = `<option value="">Select organization…</option>${opts}`;
  filterOrg.innerHTML = `<option value="">All organizations</option>${opts}`;
}

async function addOrganization(e) {
  e.preventDefault();
  if (!ensureConfigured()) return;
  const name = document.getElementById("orgName").value.trim();
  const description = document.getElementById("orgDesc").value.trim() || null;
  const logo_url = document.getElementById("orgLogo").value.trim() || null;
  if (!name) return toast("Name is required.", "error");
  if (logo_url && !isUrl(logo_url)) return toast("Logo URL must start with https://", "error");

  const { error } = await supabase.from("organizations").insert({ name, description, logo_url });
  if (error) {
    toast("Could not add organization.", "error");
    console.error(error);
    return;
  }
  toast("Organization added.", "success");
  e.target.reset();
  await loadOrganizations();
}

async function deleteOrganization(id) {
  if (!ensureConfigured()) return;
  const org = state.orgs.find(o => o.id === id);
  if (!confirm(`Delete "${org?.name || "this organization"}"? All certificates under it will also be removed.`)) return;
  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) {
    toast("Could not delete organization.", "error");
    console.error(error);
    return;
  }
  toast("Organization removed.", "success");
  await loadOrganizations();
  await loadCertificates(state.selectedOrg);
}

/* -------------------------------------------------------------------------- */
/*  Certificates                                                              */
/* -------------------------------------------------------------------------- */
async function loadCertificates(orgId = "") {
  if (!isConfigured) {
    renderCertsTable([]);
    return;
  }
  let q = supabase
    .from("certificates")
    .select("id, organization_id, certificate_number, applicant_name, cloudinary_url, created_at")
    .order("created_at", { ascending: false });
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) {
    toast("Failed to load certificates.", "error");
    console.error(error);
    return;
  }
  state.certs = data || [];
  renderCertsTable(state.certs);
}

function renderCertsTable(certs) {
  const tbody = document.querySelector("#certsTable tbody");
  const count = document.getElementById("certCount");
  count.textContent =
    certs.length === 1 ? "1 certificate on file" : `${certs.length} certificates on file`;
  if (!certs.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No certificates match the current filter.</td></tr>`;
    return;
  }
  tbody.innerHTML = certs
    .map(c => `
      <tr>
        <td data-label="Certificate №"><span style="font-family:ui-monospace,Menlo,monospace">${escapeHtml(c.certificate_number)}</span></td>
        <td data-label="Holder">${escapeHtml(c.applicant_name)}</td>
        <td data-label="Image">
          <a href="${escapeHtml(c.cloudinary_url)}" target="_blank" rel="noopener" title="Open original">
            <img class="thumb" src="${escapeHtml(c.cloudinary_url)}" alt="" />
          </a>
        </td>
        <td data-label="Created">${fmtDate(c.created_at)}</td>
        <td data-label="">
          <button class="btn btn-danger btn-sm" data-del-cert="${c.id}">
            <i data-lucide="trash-2" class="icon" style="width:14px;height:14px"></i> Delete
          </button>
        </td>
      </tr>`)
    .join("");
  renderIcons();

  tbody.querySelectorAll("[data-del-cert]").forEach(btn => {
    btn.addEventListener("click", () => deleteCertificate(btn.dataset.delCert));
  });
}

async function addCertificate(e) {
  e.preventDefault();
  if (!ensureConfigured()) return;
  const organization_id = document.getElementById("certOrg").value;
  const certificate_number = document.getElementById("certNum").value.trim();
  const applicant_name = document.getElementById("certName").value.trim();
  const cloudinary_url = document.getElementById("certUrl").value.trim();

  if (!organization_id) return toast("Choose an organization.", "error");
  if (!certificate_number) return toast("Certificate number is required.", "error");
  if (!applicant_name) return toast("Holder name is required.", "error");
  if (!isUrl(cloudinary_url)) return toast("Image URL must be a valid https URL.", "error");

  const { error } = await supabase.from("certificates").insert({
    organization_id, certificate_number, applicant_name, cloudinary_url,
  });
  if (error) {
    toast("Could not add certificate.", "error");
    console.error(error);
    return;
  }
  toast("Certificate added.", "success");
  e.target.reset();
  await loadCertificates(state.selectedOrg);
}

async function deleteCertificate(id) {
  if (!ensureConfigured()) return;
  if (!confirm("Delete this certificate record? This cannot be undone.")) return;
  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) {
    toast("Could not delete certificate.", "error");
    console.error(error);
    return;
  }
  toast("Certificate removed.", "success");
  await loadCertificates(state.selectedOrg);
}

/* -------------------------------------------------------------------------- */
/*  Logo                                                                      */
/* -------------------------------------------------------------------------- */
async function loadLogo() {
  if (!isConfigured) return;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "logo_url")
    .maybeSingle();
  const url = data?.value || "";
  document.getElementById("logoUrl").value = url;
  renderLogoPreview(url);
  applyLogo(url);
}

function applyLogo(url) {
  if (!url) return;
  document.querySelectorAll(".brand-mark-dyn").forEach(el => {
    el.classList.add("has-logo");
    el.innerHTML = `<img src="${url}" alt="Certify logo" />`;
  });
  const favicon = document.querySelector("link[rel='icon']");
  if (favicon) favicon.href = url;
}

function renderLogoPreview(url) {
  const el = document.getElementById("logoPreview");
  if (!el) return;
  if (url) {
    el.innerHTML = `<img src="${escapeHtml(url)}" alt="Logo preview"
      style="max-height:56px;max-width:240px;object-fit:contain;
             border:1px solid var(--slate-200);border-radius:6px;padding:6px;background:var(--slate-50)" />`;
  } else {
    el.innerHTML = `<span style="font-size:0.85rem;color:var(--slate-400)">No logo set — default mark in use.</span>`;
  }
}

async function saveLogo() {
  if (!ensureConfigured()) return;
  const url = document.getElementById("logoUrl").value.trim();
  if (url && !isUrl(url)) return toast("Logo URL must be a valid https:// address.", "error");
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "logo_url", value: url || null, updated_at: new Date().toISOString() });
  if (error) { toast("Could not save logo.", "error"); console.error(error); return; }
  toast(url ? "Logo updated." : "Logo cleared.", "success");
  renderLogoPreview(url);
  applyLogo(url);
}

/* -------------------------------------------------------------------------- */
/*  Banner images                                                              */
/* -------------------------------------------------------------------------- */
async function loadBannerImages() {
  if (!isConfigured) { renderBannerTable([]); return; }
  const { data, error } = await supabase
    .from("banner_images")
    .select("id, cloudinary_url, caption, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) { toast("Failed to load banner images.", "error"); console.error(error); return; }
  renderBannerTable(data || []);
}

function renderBannerTable(images) {
  const tbody = document.querySelector("#bannerTable tbody");
  const count = document.getElementById("bannerCount");
  count.textContent = images.length === 1 ? "1 image" : `${images.length} images`;
  if (!images.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No banner images yet. Add your first above.</td></tr>`;
    return;
  }
  tbody.innerHTML = images.map(img => `
    <tr>
      <td data-label="Preview">
        <a href="${escapeHtml(img.cloudinary_url)}" target="_blank" rel="noopener">
          <img class="thumb" src="${escapeHtml(img.cloudinary_url)}" alt="" />
        </a>
      </td>
      <td data-label="Caption">${escapeHtml(img.caption || "—")}</td>
      <td data-label="Order">${img.sort_order}</td>
      <td data-label="Added">${fmtDate(img.created_at)}</td>
      <td data-label="">
        <button class="btn btn-danger btn-sm" data-del-banner="${img.id}">
          <i data-lucide="trash-2" class="icon" style="width:14px;height:14px"></i> Delete
        </button>
      </td>
    </tr>`).join("");
  renderIcons();
  tbody.querySelectorAll("[data-del-banner]").forEach(btn =>
    btn.addEventListener("click", () => deleteBannerImage(btn.dataset.delBanner))
  );
}

async function addBannerImage(e) {
  e.preventDefault();
  if (!ensureConfigured()) return;
  const cloudinary_url = document.getElementById("bannerUrl").value.trim();
  const caption = document.getElementById("bannerCaption").value.trim() || null;
  const sort_order = parseInt(document.getElementById("bannerOrder").value, 10) || 0;
  if (!isUrl(cloudinary_url)) return toast("Image URL must be a valid https:// address.", "error");
  const { error } = await supabase.from("banner_images").insert({ cloudinary_url, caption, sort_order });
  if (error) { toast(`Could not add image: ${error.message}`, "error"); console.error(error); return; }
  toast("Banner image added.", "success");
  e.target.reset();
  document.getElementById("bannerOrder").value = "0";
  await loadBannerImages();
}

async function deleteBannerImage(id) {
  if (!ensureConfigured()) return;
  if (!confirm("Delete this banner image?")) return;
  const { error } = await supabase.from("banner_images").delete().eq("id", id);
  if (error) { toast("Could not delete image.", "error"); console.error(error); return; }
  toast("Image removed.", "success");
  await loadBannerImages();
}

/* -------------------------------------------------------------------------- */
/*  Boot                                                                      */
/* -------------------------------------------------------------------------- */
async function bootAdmin() {
  initTabs();
  document.getElementById("orgForm").addEventListener("submit", addOrganization);
  document.getElementById("certForm").addEventListener("submit", addCertificate);
  document.getElementById("bannerForm").addEventListener("submit", addBannerImage);
  document.getElementById("filterOrg").addEventListener("change", e => {
    state.selectedOrg = e.target.value;
    loadCertificates(state.selectedOrg);
  });
  document.getElementById("saveLogo").addEventListener("click", saveLogo);
  document.getElementById("clearLogo").addEventListener("click", () => {
    document.getElementById("logoUrl").value = "";
    saveLogo();
  });
  document.getElementById("logoUrl").addEventListener("input", e =>
    renderLogoPreview(e.target.value.trim())
  );

  if (!isConfigured) {
    const banner = document.createElement("div");
    banner.className = "config-banner";
    banner.innerHTML =
      "Supabase is not configured. Add your project URL and anon key in <code>supabase.js</code> to enable the admin console.";
    document.body.prepend(banner);
  }

  await Promise.all([
    loadOrganizations(),
    loadCertificates(),
    loadBannerImages(),
    loadLogo(),
  ]);
  renderIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  initGate();
  renderIcons();
});
