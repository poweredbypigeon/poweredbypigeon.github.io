/* =========================
   0) Tiny utils
========================= */
const $  = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];
const escapeHtml = (s) => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

/* =========================
   1) Theme + footer
========================= */
(function themeInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved === 'light') root.classList.add('light');
  $('#themeToggle')?.addEventListener('click', ()=>{
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
})();
$('#y').textContent = new Date().getFullYear();

/* =========================
   2) Data/state
========================= */
const DATA_URL = '/data/projects.json?v=1';
let allProjects = [];
// We will restore the original Projects section markup when coming back from a detail page.
const projectsSection = $('#projects');
const ORIGINAL_PROJECTS_HTML = projectsSection?.innerHTML ?? '';

/* These refs are (re)bound whenever we restore the Projects section */
let grid, tpl, tagFilter, statusEl;

function bindProjectRefs() {
  grid     = $('#projectsGrid');
  tpl      = $('#cardTpl');
  tagFilter= $('#tagFilter');
  statusEl = $('#status');
}

/* =========================
   3) Data loading
========================= */
async function loadProjects(){
  try{
    if (!statusEl) bindProjectRefs();
    if (statusEl) statusEl.textContent = 'Loading projects…';

    const res  = await fetch(DATA_URL, {cache:'no-store'});
    const data = await res.json();

    allProjects = data.map(p => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      tags: p.tags || [],
      summary: p.summary || '',
      hero: p.hero || '/img/placeholder.webp',
      links: p.links || {},
      content: p.content || [],
      contentHtml: p.contentHtml || null,
    })).sort((a,b)=> new Date(b.date) - new Date(a.date));

    populateTags(allProjects);
    render(allProjects);
    if (statusEl) statusEl.textContent = `${allProjects.length} project${allProjects.length===1?'':'s'} loaded`;
  }catch(err){
    console.error(err);
    if (statusEl) statusEl.textContent = 'Failed to load projects.';
  }
}

async function ensureProjects(){
  if (allProjects.length) return;
  await loadProjects();
}

/* =========================
   4) Rendering: list + detail
========================= */
function populateTags(items){
  if (!tagFilter) return;
  const tags = new Set(items.flatMap(p => p.tags));
  tagFilter.length = 1; // keep "All tags"
  [...tags].sort().forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

function render(items){
  if (!grid || !tpl) bindProjectRefs();
  if (!grid || !tpl) return;

  grid.innerHTML = '';
  items.forEach(p=>{
    const node   = tpl.content.cloneNode(true);
    const card   = node.firstElementChild;
    const link   = node.querySelector('.card-media');
    const img    = node.querySelector('img');
    const titleH = node.querySelector('.card-title');
    const dateEl = node.querySelector('.card-date');
    const desc   = node.querySelector('.card-desc');
    const tagsBox= node.querySelector('.card-tags');

    const path = `/${p.slug}/`;
    link.href = path;
    link.addEventListener('click', (e)=>{ e.preventDefault(); navTo(path); });
    link.setAttribute('aria-label', p.title);
    img.src = p.hero; img.alt = p.title;

    // title becomes a link too
    const titleLink = document.createElement('a');
    titleLink.href = path;
    titleLink.textContent = p.title;
    titleLink.className = 'card-title-link';
    titleLink.addEventListener('click', (e)=>{ e.preventDefault(); navTo(path); });
    titleH.textContent = '';
    titleH.appendChild(titleLink);

    if (p.date){
      dateEl.dateTime = p.date;
      dateEl.textContent = new Date(p.date).toLocaleDateString();
    }
    desc.textContent = p.summary;

    p.tags.forEach(t=>{
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tagsBox.appendChild(span);
    });

    grid.appendChild(card);
  });
}

function sanitize(html){
  const allowedTags = new Set(['p','b','strong','i','em','u','s','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','code','pre','img','a','br','hr']);
  const allowedAttrs = { 'a':['href','title','target','rel'], 'img':['src','alt','title','width','height','loading','decoding'] };
  const t = document.createElement('template');
  t.innerHTML = html;
  (function walk(node){
    [...node.children].forEach(el=>{
      const tag = el.tagName.toLowerCase();
      if (!allowedTags.has(tag)){ el.replaceWith(...el.childNodes); return; }
      [...el.attributes].forEach(attr=>{
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        else if (allowedAttrs[tag]?.includes(name)) {
          if (tag==='a' && name==='target' && attr.value==='_blank'){
            if (!el.hasAttribute('rel')) el.setAttribute('rel','noopener');
          }
        } else {
          el.removeAttribute(attr.name);
        }
      });
      walk(el);
    });
  })(t.content);
  return t.innerHTML;
}

function renderProjectBody(p){
  const body = document.getElementById('projectBody');
  if (!body) return;
  if (p.contentHtml?.length){
    body.innerHTML = p.contentHtml.map(sanitize).join('');
  } else if (p.content?.length){
    body.innerHTML = p.content.map(par => `<p>${escapeHtml(par)}</p>`).join('');
  } else {
    body.textContent = 'No additional details.';
  }
}

/* =========================
   5) Menu (JS version)
========================= */
const hamburger  = $('#hamburger');
const mobileMenu = $('#mobileMenu');

function setMenu(open){
  document.body.classList.toggle('menu-open', open);
  if (hamburger) hamburger.setAttribute('aria-expanded', String(open));
  if (mobileMenu) mobileMenu.style.display = open ? 'flex' : 'none';
}
hamburger?.addEventListener('click', () => {
  setMenu(!document.body.classList.contains('menu-open'));
});
mobileMenu?.addEventListener('click', (e) => {
  if (e.target === mobileMenu || e.target.classList.contains('menu-link')) {
    setMenu(false);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

/* =========================
   6) Router
   - pretty URLs via History API
   - back/forward with popstate
========================= */

function getUrlTag() {
  return new URLSearchParams(location.search).get('tag') || '';
}
function setUrlTag(tag) {
  const url = new URL(location.href);
  if (tag) url.searchParams.set('tag', tag);
  else url.searchParams.delete('tag');
  history.replaceState({}, '', url);  // keep back-button behavior clean
}



function route(){
  let path = location.pathname.replace(/\/+$/,'/') || '/';

  if (path === '/' || path === '/index.html' || path === '/projects/'){
    showProjects();   // always show projects for both
  } else {
    const m = path.match(/^\/([a-z0-9-]+)\/$/i);
    if (m) showProjectDetail(m[1]);
    else   showNotFound();
  }
}
window.addEventListener('popstate', route);

function navTo(path){
  history.pushState({}, '', path);
  route();
}

/* Intercept only internal links for SPA navigation */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href]');
  if (!a) return;

  const url = new URL(a.href, location.origin);
  const sameOrigin = url.origin === location.origin;
  const internal = sameOrigin && (
    url.pathname === '/' ||
    url.pathname === '/projects/' ||
    /^\/[a-z0-9-]+\/$/i.test(url.pathname)
  );

  if (!internal || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

  e.preventDefault();
  setMenu(false);
  navTo(url.pathname);
});

/* =========================
   7) Route handlers
========================= */
function restoreProjectsSection(){
  // Put the original markup back and re-bind refs/events
  projectsSection.innerHTML = ORIGINAL_PROJECTS_HTML;
  bindProjectRefs();

  // rewire filter change
  tagFilter?.addEventListener('change', ()=>{
    const t = tagFilter.value;
    setUrlTag(t); 
    render(!t ? allProjects : allProjects.filter(p => p.tags.includes(t)));
  });
}

async function showHome(){
  await showProjects();              // ensure list is visible
  document.getElementById('home').style.display = 'block';
  document.getElementById('home')?.scrollIntoView({behavior:'smooth'});
}

async function showProjects(){
  restoreProjectsSection();
  await ensureProjects();
  populateTags(allProjects);
  render(allProjects);
  const currentTag = getUrlTag();
  if (tagFilter && currentTag) {
    tagFilter.value = currentTag;
    render(allProjects.filter(p => p.tags.includes(currentTag)));
}
document.title = `Avery Chan — Portfolio`;
  document.getElementById('home').style.display = 'block';
  document.getElementById('projects')?.scrollIntoView({behavior:'smooth'});
}

async function showProjectDetail(slug){
  await ensureProjects();
  const project = allProjects.find(p => p.slug === slug);
  const container = projectsSection;

  if (!project){
    container.innerHTML = `<div class="section"><h2>Not found</h2><p>No project named <code>${escapeHtml(slug)}</code>.</p></div>`;
    return;
  }
  document.title = `${project.title} — Portfolio`;

  container.innerHTML = `
    <div class="section">
      <a class="btn btn-ghost" href="/">← Back to Projects</a>

      <h2 style="margin-top:1rem">${escapeHtml(project.title)}</h2>
      <p class="section-sub"><time datetime="${project.date}">${new Date(project.date).toLocaleDateString()}</time></p>
      ${project.hero ? `<img class="hero" src="${project.hero}" alt="${escapeHtml(project.title)}" style="width:100%; border-radius:14px; margin:.6rem 0 1rem">` : ''}
      <div id="projectBody"></div>
      <p style="margin-top:1rem">
        ${project.links?.demo ? `<a class="btn" target="_blank" rel="noopener" href="${project.links.demo}">Live Demo</a>` : ''}
        ${project.links?.repo ? `<a class="btn btn-ghost" target="_blank" rel="noopener" href="${project.links.repo}">Repository</a>` : ''}
      </p>
    </div>
  `;
  renderProjectBody(project);
  document.getElementById('home').style.display = 'none';
  container.scrollIntoView({behavior:'smooth'});
}

function showNotFound(){
  projectsSection.innerHTML = `<div class="section"><h2>Not found</h2><p>The page you requested does not exist.</p></div>`;
}

/* =========================
   8) Boot
========================= */
document.addEventListener('DOMContentLoaded', async ()=>{
  bindProjectRefs();
  await ensureProjects(); // so the grid can render immediately on / or /projects/
  route();
});
