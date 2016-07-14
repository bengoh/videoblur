/* ReactDOM */

/*
    img           : React.PropTypes.string.isRequired,
    blurRadius    : React.PropTypes.number,
    resizeInterval: React.PropTypes.number,
    className     : React.PropTypes.string,
    children      : React.PropTypes.any,
    onLoadFunction: React.PropTypes.func
*/

let images;
// generate image data
images = Array(5).fill(5).map(color => {
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  const randomWidth = Math.floor(Math.random() * canvas.width);
  const randomHeight = Math.floor(Math.random() * canvas.height);
  ctx.fillStyle = '#' + ('000000' + Math.floor(Math.random() * 256*256*256).toString('16')).slice(-6);
  ctx.fillRect(0, 0, randomWidth, randomHeight);
  return ctx.getImageData(0, 0, randomWidth, randomHeight);
});


// images = [
//   'http://i.imgur.com/xXT22yy.jpg',
//   'http://i.imgur.com/NpiCpFZ.jpg',
//   'http://i.imgur.com/XjKO25E.jpg',
//   'http://i.imgur.com/LYgnynJ.jpg',
//   '//i.imgur.com/MWOpgtD.png',
//   '//i.imgur.com/SgkPr2t.png',
//   '//i.imgur.com/LSAvwNg.png',
//   '//i.imgur.com/Om9hD7E.png',
// ];

// window.imageDatas = images;
// console.log(images);
// set an infinite loop of rendering
const state = {
  current: 0
};

const render = (image, duration, resolution) => ReactDOM.render(<Fader className="fullscreen" containerClassName="fullscreen" blurRadius={40} image={image} fadeDuration={duration} fadeResolution={resolution} />, document.getElementById('reactblur'));

function loop() {
  console.log(`RENDER ${images[state.current]}`);
  render(images[state.current], 4500, 50);
  state.current = (state.current + 1) % images.length;
  setTimeout(loop, 5000);
}

loop();
