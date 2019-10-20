#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

const fs = require('fs');
const React = require('react');

const ETH_ENS_NAMEHASH_JS = fs.readFileSync('assets/js/eth-ens-namehash.min.js', 'utf8');
const CLIENT_JS = fs.readFileSync('js/client.js', 'utf8');

class Head extends React.PureComponent {
  render() {
    const {
      version,
      title,
    } = this.props;

    return (
      <React.Fragment>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{title || 'ENS Redirect ' + version}</title>

        <link rel="icon" href="data:;base64,iVBORw0KGgo="/>

      </React.Fragment>
    );
  }
}

class Loader extends React.PureComponent {
  render() {
    const {
      version,

      title,
    } = this.props;

    return (
      <html lang="en">
        <head>
          <Head
            version={version}
            title={title}
          />
          <style dangerouslySetInnerHTML={{__html: `

#d-spinner-overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;

  /* center */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  /* background */
  background-color: #0084cc;
  background-image: radial-gradient(at 0% bottom, rgba(72, 131, 160, 0.7) 0%, rgba(72, 131, 160, 0) 60%), radial-gradient(at 90% bottom, #3f728c 0%, rgba(63, 114, 140, 0) 40%), radial-gradient(at 50% top, rgba(84, 149, 182, 0.6) 0%, rgba(84, 149, 182, 0) 75%), radial-gradient(at right top, #4a85a2 0%, rgba(74, 133, 162, 0) 57%);
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

#d-spinner-overlay svg {
  overflow: visible; /* for dots */
}

.d-dot {
  fill: #1ba3d9;
}

.d-spinner {
  -webkit-animation-duration: 2.4s;
          animation-duration: 2.4s;
  -webkit-animation-timing-function: cubic-bezier(0, 1, 0.3, 1);
          animation-timing-function: cubic-bezier(0, 1, 0.3, 1);
  -webkit-animation-direction: normal;
          animation-direction: normal;
  -webkit-animation-iteration-count: infinite;
          animation-iteration-count: infinite;
  -webkit-transform-origin: left bottom;
          transform-origin: left bottom;
}
.d-spinner.d-spinner1 {
  -webkit-animation-name: dSpinnerOne;
          animation-name: dSpinnerOne;
  fill: #759caf;
}
.d-spinner.d-spinner2 {
  -webkit-animation-name: dSpinnerTwo;
          animation-name: dSpinnerTwo;
  fill: #a3becb;
}
.d-spinner.d-spinner3 {
  -webkit-animation-name: dSpinnerThree;
          animation-name: dSpinnerThree;
  fill: #d0dde4;
}
.d-spinner.d-spinner4 {
  -webkit-animation-name: dSpinnerFour;
          animation-name: dSpinnerFour;
  fill: #FEFEFE;
}
@-webkit-keyframes dSpinnerOne {
  0% {
    opacity: 0;
    fill: #b6cad4;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  7% {
    opacity: 1;
    fill: #b6cad4;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  57% {
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
    fill: #759caf;
  }
  74% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  83% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@keyframes dSpinnerOne {
  0% {
    opacity: 0;
    fill: #b6cad4;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  7% {
    opacity: 1;
    fill: #b6cad4;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  57% {
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
    fill: #759caf;
  }
  74% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  83% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@-webkit-keyframes dSpinnerTwo {
  0% {
    opacity: 0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  3% {
    opacity: 0;
    fill: #e4ecf0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  10% {
    opacity: 1;
    fill: #e4ecf0;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  60% {
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
    fill: #a3becb;
  }
  71% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  79% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@keyframes dSpinnerTwo {
  0% {
    opacity: 0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  3% {
    opacity: 0;
    fill: #e4ecf0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  10% {
    opacity: 1;
    fill: #e4ecf0;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  60% {
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
    fill: #a3becb;
  }
  71% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  79% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@-webkit-keyframes dSpinnerThree {
  0% {
    opacity: 0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  6% {
    opacity: 0;
    fill: white;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  13% {
    opacity: 1;
    fill: white;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  63% {
    fill: #d0dde4;
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
  }
  68% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  76% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@keyframes dSpinnerThree {
  0% {
    opacity: 0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  6% {
    opacity: 0;
    fill: white;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  13% {
    opacity: 1;
    fill: white;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  63% {
    fill: #d0dde4;
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
  }
  68% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  76% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@-webkit-keyframes dSpinnerFour {
  0% {
    opacity: 0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  9% {
    opacity: 0;
    fill: white;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  16% {
    opacity: 1;
    fill: white;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  64% {
    fill: #FEFEFE;
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
  }
  65% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  73% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
@keyframes dSpinnerFour {
  0% {
    opacity: 0;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  9% {
    opacity: 0;
    fill: white;
    -webkit-transform: rotateZ(-65deg) scale(0.6);
            transform: rotateZ(-65deg) scale(0.6);
  }
  16% {
    opacity: 1;
    fill: white;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
  }
  64% {
    fill: #FEFEFE;
    -webkit-animation-timing-function: cubic-bezier(0, 0, 0, 1);
            animation-timing-function: cubic-bezier(0, 0, 0, 1);
  }
  65% {
    opacity: 1;
    -webkit-transform: rotateZ(0) scale(1);
            transform: rotateZ(0) scale(1);
    -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 0);
            animation-timing-function: cubic-bezier(0, 0, 1, 0);
  }
  73% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateZ(45deg) scale(0.61);
            transform: rotateZ(45deg) scale(0.61);
  }
}
`}} />
        </head>
        <body>
          <div id="d-spinner-overlay">
            <svg width="30%" style={{maxHeight: '30%', maxWidth: '240px'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6.73 8.39">
              <text
                fill='#444444'
                textAnchor='middle'
                fontStyle='normal'
                fontFamily='sans-serif'
                fontSize="0.88194448px"
                fontVariant='normal'
                fontWeight='normal'
                x="3.2826202"
                y="11.1"
                id="d-text">
                  Loading...
              </text>

              <g id="d-dot" className="d-dot" style={{display: 'none'}}>
                <path id="d-dot0" d="M1.832 9.456a.2.2 0 0 1 .18-.198.2.2 0 0 1 .215.161.2.2 0 0 1-.141.229.2.2 0 0 1-.24-.12"/>
                <path id="d-dot1" d="M3.066 9.456a.2.2 0 0 1 .181-.198.2.2 0 0 1 .215.161.2.2 0 0 1-.142.229.2.2 0 0 1-.24-.12"/>
                <path id="d-dot2" d="M4.3 9.456a.2.2 0 0 1 .182-.198.2.2 0 0 1 .214.161.2.2 0 0 1-.141.229.2.2 0 0 1-.24-.12"/>
              </g>

              <g className="d-spinner d-spinner1">
                <path d="M3.308.147V5.75l.056.057 2.6-1.537-2.6-4.315z"/>
                <path d="M3.364 3.087V-.046L.764 4.27l2.6 1.537z"/>
              </g>

              <g className="d-spinner d-spinner2">
                <path d="M5.965 4.269l-2.6-1.182v2.719z"/>
                <path d="M3.364 5.806v-2.72L.764 4.27z"/>
              </g>

              <g className="d-spinner d-spinner3">
                <path d="M3.332 6.337v1.995l.032.094 2.602-3.664-2.602 1.536z"/>
                <path d="M3.364 6.298l-2.6-1.536 2.6 3.664z"/>
              </g>
            </svg>
          </div>
          <script dangerouslySetInnerHTML={{__html: `
      <!--
(function(){
  if (window.console) {
    window.console.log('loader version: ${version}');
  }
  var version = '${version}'; // set variable - used in clients.js for error reporting

  // TODO do not pollute window namespace
  ${ETH_ENS_NAMEHASH_JS}

  ${CLIENT_JS}
})();
      -->
`}} />
        </body>
      </html>
    );
  }
}

exports.Loader = Loader;
