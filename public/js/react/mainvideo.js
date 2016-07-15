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
const videoTimeStrategy = (video, state) => (video.currentTime - lastCapture.videoTime) / INTERVAL_CAPTURE_SECONDS;
const realTimeStrategy = (video, state) => (Date.now() - lastCapture.realTime) / (INTERVAL_CAPTURE_SECONDS * 1000);

const render = ({image, duration, resolution, blurRadius}) => ReactDOM.render(<Fader className="fullscreen" containerClassName="fullscreen" blurRadius={blurRadius} image={image} fadeDuration={duration} fadeResolution={resolution} maxLayers={5} />, document.getElementById('fader'));
const waitUntilReady = (fn, video, waitLimit = 1000, interval = 50) => () => {
  if (video.readyState !== 4 && waitLimit > 0) {
    console.log(`⏸ Delaying capture ${waitLimit}ms left`);
    setTimeout(waitUntilReady(fn, video, waitLimit - interval), interval);
  } else if (waitLimit > 0) {
    fn();
  }
}

const fadescreen = (video, fader) => {

  const state = {
    videoTime: undefined,
    realTime: undefined,
    alreadyPlaying: false,
    captureQueued: false
  };
  const offscreen = document.createElement('canvas');
  let width, height;

  function captureImageData() {
    const { videoWidth: width, videoHeight: height } = video;
    const context = offscreen.getContext('2d');
    context.width = width;
    context.height = height;

    context.clearRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  }

  function showFadingBlur() {
    console.log(`🔴 CAPTURE AND RENDER!`);
    render({
      image: captureImageData(), 
      duration: INTERVAL_CAPTURE_SECONDS * 1000,
      resolution: INTERVAL_UPDATE,
      blurRadius: BLUR_RADIUS
    });
  }

  const blurWhenReady = waitUntilReady(showFadingBlur, video);

  video.addEventListener('playing', () => {
    console.log(`🎦 Playing`);
  });

  video.addEventListener('play', () => {
    console.log(`▶️ Play`);
    width = video.videoWidth;
    height = video.videoHeight;
    offscreen.width = width;
    offscreen.height = height;
    state.videoTime = video.currentTime;
    state.realTime = Date.now();
    
    const imageData = captureImageData();
    if (!state.alreadyPlaying) {
      blurWhenReady();
      state.alreadyPlaying = true;
    }
  });

  // if the difference between the current time and last captured time exceeds
  // the interval, make a new capture. Works in both time directions.
  video.addEventListener('timeupdate', ({ target: { currentTime } }) => {
    if (Math.abs(currentTime - state.videoTime) > INTERVAL_CAPTURE_SECONDS) {
      console.log(`📸 CAPTURE ${currentTime} - ${state.videoTime} > ${INTERVAL_CAPTURE_SECONDS}`)
      blurWhenReady();
      state.videoTime = currentTime;
      state.realTime = Date.now();
    }
  });

}

fadescreen(
  document.getElementById('video'),
  document.getElementById('fader')
);