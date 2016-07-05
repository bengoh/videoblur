/* global window, document, drawImage, stackBlur */

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

// strategies on the opacity of the top layer
const betweenZeroAndOne = number => Math.max(0, Math.min(1, number));
const logTheNumber = number => { console.log(number); return number; }
const videoTimeStrategy = (video, lastCapture) => (video.currentTime - lastCapture.videoTime) / INTERVAL_CAPTURE_SECONDS;
const realTimeStrategy = (video, lastCapture) => (Date.now() - lastCapture.realTime) / (INTERVAL_CAPTURE_SECONDS * 1000);

const fadescreen = (video, lower, upper) => {
  const lastCapture = {
    videoTime: undefined,
    upperCap: undefined,
    lowerCap: undefined,
    realTime: undefined // KIV
  };

  const offscreen = document.createElement('canvas');

  let width, height;

  function captureFrame() {
    const targetWidth = upper.width;
    const targetHeight = upper.height;
    drawImage(video, offscreen, targetWidth, targetHeight);
    return offscreen.getContext('2d').getImageData(0, 0, width, height);
  }

  function drawLower(imageData) {
    lower.getContext('2d').putImageData(imageData, 0, 0);
    stackBlur(lower, BLUR_RADIUS, false);
  }

  function drawUpper(imageData) {
    upper.getContext('2d').putImageData(imageData, 0, 0);
    stackBlur(upper, BLUR_RADIUS, false);
  }

  video.addEventListener('play', () => {
    width = video.videoWidth;
    height = video.videoHeight;
    offscreen.width = width;
    offscreen.height = height;
    lastCapture.videoTime = video.currentTime;
    lastCapture.realTime = Date.now();
    lastCapture.lowerCap = captureFrame();
    drawLower(lastCapture.lowerCap);
  });

  video.addEventListener('timeupdate', ({ target: { currentTime } }) => {
    if (currentTime - lastCapture.videoTime > INTERVAL_CAPTURE_SECONDS) {
      // 5 seconds have passed, make a new capture
      lastCapture.lowerCap = lastCapture.upperCap || lastCapture.lowerCap;
      lastCapture.upperCap = captureFrame();
      lastCapture.videoTime = currentTime;
      lastCapture.realTime = Date.now();
    }
  });

  // update the layers every 100ms
  setInterval(function() {
    // draw and shade all layers as appropriate
    lastCapture.lowerCap && drawLower(lastCapture.lowerCap);
    lastCapture.upperCap && drawUpper(lastCapture.upperCap);
    upper.style.opacity = betweenZeroAndOne(videoTimeStrategy(video, lastCapture));
  }, INTERVAL_UPDATE);

}

fadescreen(
  document.getElementById('video'),
  document.getElementById('lower'),
  document.getElementById('upper')
);