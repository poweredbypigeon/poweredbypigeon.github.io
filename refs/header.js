class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() { // woah this works!
    this.innerHTML = `
      <nav>
         
        <a href="/" class="homesection">HOME</a>
        <a href="/academics/" class="homesection">ACADEMICS</a>
        <a href="/projects/" class="homesection">PROJECTS</a>
        <div class="dropdown homesection">
            <a href="/blog/">BLOG</a>
            <div class="dropdown-content">
                <a href="/blog/">SCHOOL</a>
                <a href="/blog/">STEM</a>
                <a href="/blog/">BUSINESS</a>
                <a href="/blog/">MISCELLANEOUS</a> <!-- sort of a workaround -->
                <a href="/blog/reviews/">REVIEWS</a>
            </div>
        </div>
        <div class="dropdown homesection">
            <a href="/contests/">CONTESTS</a> <!-- contest results -->
            <div class="dropdown-content">
                <a href="/math-team/">MATH TEAM</a>
                <a href="/contest-solutions/">CONTEST SOLUTIONS</a>
                <a href="/contest-advice/">CONTEST ADVICE</a>
            </div>
        </div>
    </nav>
    `;
  }
}

customElements.define('header-component', Header);
// <img src="/imgs/AVCLogo-modified.png" class="logo">

            