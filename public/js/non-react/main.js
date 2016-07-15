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
    console.log(`capture force ${video.videoWidth} x ${video.videoHeight} into ${targetWidth} x ${targetHeight}`)
    console.log(`capture size ${width} x ${height}`);
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
      lastCapture.lowerCap && drawLower(lastCapture.lowerCap);
      lastCapture.upperCap && drawUpper(lastCapture.upperCap);
      upper.style.opacity = logTheNumber(betweenZeroAndOne(videoTimeStrategy(video, lastCapture)));
    }
  }, INTERVAL_UPDATE);

}

fadescreen(
  document.getElementById('video'),
  document.getElementById('lower'),
  document.getElementById('upper')
);