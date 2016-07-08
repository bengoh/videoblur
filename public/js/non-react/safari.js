/* global window, document, drawImage, stackBlur */
// very useful reference: https://www.w3.org/2010/05/video/mediaevents.html

// lifted from http://stackoverflow.com/a/901144
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const BLUR_RADIUS = parseFloat(getParameterByName('radius')) || 80;
const INTERVAL_CAPTURE_SECONDS = parseFloat(getParameterByName('interval')) || 5;
const INTERVAL_UPDATE = parseInt(getParameterByName('update')) || 100;

console.log({ BLUR_RADIUS, INTERVAL_CAPTURE_SECONDS, INTERVAL_UPDATE });

// strategies on the opacity of the top layer
const betweenZeroAndOne = number => Math.max(0, Math.min(1, number));
const logTheNumber = number => { console.log(number); return number; }
const videoTimeStrategy = (video, lastCapture) => (video.currentTime - lastCapture.videoTime) / INTERVAL_CAPTURE_SECONDS;
const realTimeStrategy = (video, lastCapture) => (Date.now() - lastCapture.realTime) / (INTERVAL_CAPTURE_SECONDS * 1000);

const safaritest = (video, canvas) => {
  const lastCapture = {
    videoTime: undefined,
    upperCap: undefined,
    lowerCap: undefined,
    realTime: undefined // KIV
  };

  const offscreen = document.createElement('canvas');

  let width, height;

  function captureFrame() {
    console.log('CAPTURE');
    const targetWidth = canvas.width;
    const targetHeight = canvas.height;
    drawImage(video, canvas, targetWidth, targetHeight);
    return canvas.getContext('2d').getImageData(0, 0, width, height);
  }

  function draw(imageData) {
    console.log('DRAW');
    canvas.getContext('2d').putImageData(imageData, 0, 0);
  }
/*
  video.addEventListener('play', () => {
    width = video.videoWidth;
    height = video.videoHeight;
    offscreen.width = width;
    offscreen.height = height;
    lastCapture.videoTime = video.currentTime;
    lastCapture.realTime = Date.now();
    lastCapture.lowerCap = captureFrame();
    draw(lastCapture.lowerCap);
  });

  // if the difference between the current time and last captured time exceeds
  // the interval, make a new capture. Works in both time directions.
  video.addEventListener('timeupdate', ({ target: { currentTime } }) => {
    if (Math.abs(currentTime - lastCapture.videoTime) > INTERVAL_CAPTURE_SECONDS) {
      lastCapture.lowerCap = lastCapture.upperCap || lastCapture.lowerCap;
      lastCapture.upperCap = captureFrame();
      lastCapture.videoTime = currentTime;
      lastCapture.realTime = Date.now();
    }
  });

  // update the layers every 100ms. Do not update if the video is not playing.
  // using "timeupdate" to do this is not as reliable and generally slower (~ 3times/sec)
  setInterval(function() {
    // draw and shade all layers as appropriate
    if (!video.paused) {
      draw(lastCapture.lowerCap);
    }
  }, INTERVAL_UPDATE);
*/
}

safaritest(
  document.getElementById('video'),
  document.getElementById('canvas')
);