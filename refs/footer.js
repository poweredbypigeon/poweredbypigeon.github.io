class Footer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <hr>
    <footer>
        <p>FIND ME ON THESE SITES: </p>
        <div id="icon-container">
            <a id="icon-linkedin"><img src="/imgs/LinkedinIcon.png" class="icon footer-icon"></a>
            <a id="icon-dmoj"><img src="/imgs/DmojIcon.png" class="icon footer-icon"></a>
            <a id="icon-github"><img src="/imgs/GithubIcon.png" class="icon footer-icon"></a>
        </div>
    </footer>
    `;
  }
}

customElements.define('footer-component', Footer);