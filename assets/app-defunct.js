// --- tiny utilities ---
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];
const escapeHtml = (s) => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

// --- theme toggle (persist) ---
(function themeInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if(saved === 'light') root.classList.add('light');
  $('#themeToggle')?.addEventListener('click', ()=>{
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
})();

// --- footer year ---
$('#y').textContent = new Date().getFullYear();

// --- projects loader ---
const DATA_URL = '/data/projects.json?v=1';
const grid = $('#projectsGrid');
const tpl = $('#cardTpl');
const tagFilter = $('#tagFilter');
const statusEl = $('#status');

let allProjects = [];

async function loadProjects(){
  try{
    statusEl.textContent = 'Loading projects…';
    const res = await fetch(DATA_URL, {cache:'no-store'});
    const data = await res.json();

    // Normalize + sort (newest first)
    allProjects = data.map(p => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      tags: p.tags || [],
      summary: p.summary || '',
      hero: p.hero || '/img/placeholder.webp',
      links: p.links || {},
      content: p.content || []
    })).sort((a,b)=> new Date(b.date) - new Date(a.date));

    populateTags(allProjects);
    render(allProjects);
    statusEl.textContent = `${allProjects.length} project${allProjects.length===1?'':'s'} loaded`;
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Failed to load projects.';
  }
}

function populateTags(items){
  const tags = new Set(items.flatMap(p => p.tags));
  // reset options except "All tags"
  tagFilter.length = 1;
  [...tags].sort().forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

// Minimal allowlist sanitizer
function sanitize(html){
  const allowedTags = new Set(['p','b','strong','i','em','u','s','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','code','pre','img','a','br','hr']);
  const allowedAttrs = { 'a':['href','title','target','rel'], 'img':['src','alt','title','width','height','loading','decoding'] };

  const t = document.createElement('template');
  t.innerHTML = html;
  (function walk(node){
    [...node.children].forEach(el=>{
      const tag = el.tagName.toLowerCase();
      if(!allowedTags.has(tag)){ el.replaceWith(...el.childNodes); return; }
      // strip disallowed attributes & any on* handlers
      [...el.attributes].forEach(attr=>{
        const name = attr.name.toLowerCase();
        if(name.startsWith('on')) el.removeAttribute(attr.name);
        else if(allowedAttrs[tag]?.includes(name)) {
          // small safety: for <a>, force rel noopener when target=_blank
          if(tag==='a' && name==='target' && attr.value==='_blank'){
            if(!el.hasAttribute('rel')) el.setAttribute('rel','noopener');
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
  if(p.contentHtml?.length){
    body.innerHTML = p.contentHtml.map(sanitize).join('');
  } else if (p.content?.length){
    body.innerHTML = p.content.map(par => `<p>${escapeHtml(par)}</p>`).join('');
  } else {
    body.textContent = 'No additional details.';
  }
}


function render(items){
  grid.innerHTML = '';
  items.forEach(p=>{
    const node = tpl.content.cloneNode(true);
    const card = node.firstElementChild;
    const link = node.querySelector('.card-media');
    const img = node.querySelector('img');
  const title = node.querySelector('.card-title');
    const dateEl = node.querySelector('.card-date');
    const desc = node.querySelector('.card-desc');
    const tagsBox = node.querySelector('.card-tags');

    const path = `/${p.slug}/`;
    link.href = path;
    link.addEventListener('click', (e)=>{ e.preventDefault(); navTo(path); });
    link.setAttribute('aria-label', p.title);
    img.src = p.hero; img.alt = p.title;

    

    // Make the title a link to the project path
    const titleLink = document.createElement('a');
    titleLink.href = path;
    titleLink.textContent = p.title;
    titleLink.className = 'card-title-link';
    titleLink.addEventListener('click', (e) => {
      e.preventDefault();
      navTo(path);
    });
    // Remove any existing content and append the link
    title.textContent = '';
    title.appendChild(titleLink);
    if(p.date){
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

    // Optional: click to open repo/demo if present
    /* link.addEventListener('click', (e)=>{
      if(p.links?.demo){ window.open(p.links.demo, '_blank', 'noopener'); }
      else if(p.links?.repo){ window.open(p.links.repo, '_blank', 'noopener'); }
      e.preventDefault();
    }); */

    grid.appendChild(card);
  });
}

tagFilter?.addEventListener('change', ()=>{
  const t = tagFilter.value;
  render(!t ? allProjects : allProjects.filter(p => p.tags.includes(t)));
});

document.addEventListener('DOMContentLoaded', loadProjects);
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function setMenu(open){
  document.body.classList.toggle('menu-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu.setAttribute("style", open ? "display: flex;" : "display: none;");
}

hamburger.addEventListener('click', () => {
  setMenu(!document.body.classList.contains('menu-open'));
});

// Close on overlay click (background) or link click
mobileMenu.addEventListener('click', (e) => {
  if (e.target === mobileMenu || e.target.classList.contains('menu-link')) {
    setMenu(false);
  }
});

// Close on Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

// --- Simple SPA router using history API ---
function route(){
  const path = location.pathname.replace(/\/+$/,'/') || '/';
  if(path === '/' || path === '/index.html'){
    showHome(); // scroll to #home, etc.
  } else if (path === '/projects/') {
    showProjects();
  } else {
    const slug = path.slice(1, -1); // '/asl-cnn-classifier/' -> 'asl-cnn-classifier'
    showProjectDetail(slug);
  }
}
window.addEventListener('popstate', route);

// Navigate without reloading
function navTo(path){
  history.pushState({}, '', path);
  route();
}

// Hook your topbar links to use navTo
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href]');
  if(!a) return;
  const url = new URL(a.href);
  const sameOrigin = url.origin === location.origin;
  const looksLocal = sameOrigin && (url.pathname === '/' || url.pathname.startsWith('/projects/') || /^\/[a-z0-9-]+\/$/i.test(url.pathname));
  if(looksLocal){
    e.preventDefault();
    // toggleMenu(false);
    navTo(url.pathname);
  }
});

// Renderers
function showHome(){ location.hash = '#home'; }
function showProjects(){ location.hash = '#projects'; }
async function showProjectDetail(slug){
  const project = allProjects.find(p=>p.slug === slug) || await ensureProjects().then(()=> allProjects.find(p=>p.slug===slug));
  const container = document.getElementById('projects'); // reuse section area
  if(!project){
    container.innerHTML = `<div class="section"><h2>Not found</h2><p>No project named <code>${escapeHtml(slug)}</code>.</p></div>`;
    return;
  }
  document.title = `${project.title} — Portfolio`;
  container.innerHTML = `
    <div class="section">
      <a class="btn btn-ghost" href="/projects/">← Back to Projects</a>
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
  // smooth scroll into view
  document.getElementById('projects').scrollIntoView({behavior:'smooth'});
}

// Ensure JSON loaded before routing
async function ensureProjects(){
  if(allProjects.length) return;
  await loadProjects();
}

// Initial kick
document.addEventListener('DOMContentLoaded', async ()=>{
  await ensureProjects();
  route();
});
