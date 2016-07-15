// this file assumes that stackBlurCanvasRGB is available in the global namespace

function transferImageData(imageData, targetCanvas) {
  // first, create a virtual canvas with the same dimensions as the imageData
  // and paint it.
  const offscreen = document.createElement('canvas');
  const context = offscreen.getContext('2d');
  
  const naturalWidth = offscreen.width = imageData.width;
  const naturalHeight = offscreen.height = imageData.height;
  
  // we obtain the current "canvas" dimensions of the target canvas
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  
  // we draw the imageData onto the canvas directly first
  context.putImageData(imageData, 0, 0);
  
  // we then compute the new dimensions we want to achieve
  const squeezeFactor = naturalWidth / width;
  const flattenFactor = naturalHeight / height;
  const moreSqueezedThanFlattened = squeezeFactor > flattenFactor;
  const ratio = moreSqueezedThanFlattened ? flattenFactor : squeezeFactor;
  const finalWidth = naturalWidth / ratio;
  const finalHeight = naturalHeight / ratio;

  const left = Math.floor((finalWidth - width) / -2);
  const top = Math.floor((finalHeight - height) / -2);
  const intWidth = Math.ceil(finalWidth);
  const intHeight = Math.ceil(finalHeight);

  // we then draw onto the target canvas itself by using the offscreen canvas
  // as an image source
  const targetContext = targetCanvas.getContext('2d');
  targetContext.clearRect(0, 0, width, height);
  targetContext.drawImage(offscreen, left, top, intWidth, intHeight);
}

// unlike the normal stackBlur, this blurs in a much smaller canvas (300x150),
// which is significantly more performant than doing it on a larger canvas.
function microBlur(imageData, targetCanvas, blurRadius) {
  // like cheatBlur, but don't even hve an intermediate canvas
  const targetContext = targetCanvas.getContext('2d');
  targetCanvas.width = 300;
  targetCanvas.height = 150;

  transferImageData(imageData, targetCanvas);
  stackBlurCanvasRGB(targetCanvas, 0, 0, targetCanvas.width, targetCanvas.height, blurRadius);
}