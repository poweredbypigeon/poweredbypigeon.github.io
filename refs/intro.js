class Intro extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() { // woah this works!
    this.innerHTML = `
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link type="text/css" rel="stylesheet" href="/refs/style-s.css">
        <link type="text/css" rel="stylesheet" href="/refs/style-m.css" media="screen and (min-width: 40em)"> 
        <link type="text/css" rel="stylesheet" href="/refs/style.css" media="screen and (min-width: 60em)">
        <link rel="shortcut icon" type="image/x-icon" href="/imgs/grey-pigeon-icon-vector.webp" />
       
    `;
  }
}

customElements.define('intro-component', Intro);
