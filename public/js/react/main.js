/* ReactDOM */

/*
    img           : React.PropTypes.string.isRequired,
    blurRadius    : React.PropTypes.number,
    resizeInterval: React.PropTypes.number,
    className     : React.PropTypes.string,
    children      : React.PropTypes.any,
    onLoadFunction: React.PropTypes.func
*/

const images = [
  'http://i.imgur.com/xXT22yy.jpg',
  'http://i.imgur.com/NpiCpFZ.jpg',
  'http://i.imgur.com/XjKO25E.jpg',
  'http://i.imgur.com/LYgnynJ.jpg',
];

// set an infinite loop of rendering
const state = {
  current: 0
};

const render = image => ReactDOM.render(<Fader className="fullscreen" containerClassName="fullscreen" blurRadius={40} image={image} />, document.getElementById('reactblur'));

function loop() {
  render(images[state.current]);
  state.current = (state.current + 1) % images.length;
  setTimeout(loop, 5000);
}

loop();
