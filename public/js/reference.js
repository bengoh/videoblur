const greenscreen = (video, c1, c2) => {

  const ctx1 = c1.getContext('2d');
  const ctx2 = c2.getContext('2d');
  let width, height; // ? need to wait for the play event to set these?

  video.addEventListener('play', () => {
    width = video.videoWidth / 2;
    height = video.videoHeight / 2;
    timerCallback();
  });

  function timerCallback() {
    if (video.paused || video.ended) {
      return;
    }

    computeFrame();
    setTimeout(timerCallback, 0);
  }

  function computeFrame() {
    ctx1.drawImage(video, 0, 0, width, height);
    const frame = ctx1.getImageData(0, 0, width, height);
    const l = frame.data.length / 4;

    for (let i = 0; i < l; i++) {
      const r = frame.data[i * 4 + 0]; // red
      const g = frame.data[i * 4 + 1]; // green
      const b = frame.data[i * 4 + 2]; // blue
      if (g > 100 && r > 100 && b < 43) {
        frame.data[i * 4 + 3] = 0; // alpha (transparency)
      }
    }
    ctx2.putImageData(frame, 0, 0);
  }

  return { timerCallback, computeFrame }
};