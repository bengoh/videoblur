/* global React, ReactDOM, stackBlurImage */

const PureRenderMixin = React.addons.PureRenderMixin;

// ref http://stackoverflow.com/q/470832
function getAbsolutePath(path) {
  const a = document.createElement('a');
  a.href = path;
  return a.href;
}

function eitherImgOrImgData(props, propName) {
  const validImgProp = props.img && props.img.constructor.name === 'String';
  const validImgDataProp = props.imgData && props.imgData.constructor.name === 'ImageData';

  if (!validImgProp && !validImgDataProp) {
    return new Error('Provide either an img (string) or imgData (ImageData type) property.');
  } else if (validImgProp && validImgDataProp) {
    return new Error('Provide only one of img or imgData, not both.')
  }
}

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

function cheatBlur(imageData, targetCanvas, blurRadius) {
  // the cheat blur
  // 1. renders the imageData into a fixed 300x150 space (using transferImageData)
  // 2. blurs ONLY in the 300x150 space
  // 3. renders THAT blur data into the target canvas full size
  const cheatCanvas = document.createElement('canvas');
  const cheatContext = cheatCanvas.getContext('2d');
  cheatCanvas.width = 300;
  cheatCanvas.height = 150;

  transferImageData(imageData, cheatCanvas);
  stackBlurCanvasRGB(cheatCanvas, 0, 0, cheatCanvas.width, cheatCanvas.height, blurRadius);
  const blurredImageData = cheatCanvas.getContext('2d').getImageData(0, 0, cheatCanvas.width, cheatCanvas.height);
  transferImageData(blurredImageData, targetCanvas);
}

function blasphemousBlur(imageData, targetCanvas, blurRadius) {
  // like cheatBlur, but don't even hve an intermediate canvas
  const targetContext = targetCanvas.getContext('2d');
  targetCanvas.width = 300;
  targetCanvas.height = 150;

  transferImageData(imageData, targetCanvas);
  stackBlurCanvasRGB(targetCanvas, 0, 0, targetCanvas.width, targetCanvas.height, blurRadius);
}

class ReactBlur extends React.Component {
  static propTypes = {
    img           : eitherImgOrImgData,
    imgData       : eitherImgOrImgData,
    blurRadius    : React.PropTypes.number,
    resizeInterval: React.PropTypes.number,
    className     : React.PropTypes.string,
    children      : React.PropTypes.any,
    onLoadFunction: React.PropTypes.func
  };

  static defaultProps = {
    blurRadius    : 0,
    resizeInterval: 128,
    onLoadFunction: () => {}
  };

  constructor(props) {
    super(props);

    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  componentDidMount() {
    //window.addEventListener('resize', this.resize.bind(this));

    // initialize state
    this.syncProps(this.props);
    this.syncDimensions();
  }

  componentWillUnmount() {
    this._unmounted = true;
    //window.removeEventListener('resize', this.resize.bind(this));
  }

  componentWillReceiveProps(nextProps) {
    this.syncProps(nextProps);
  }

  componentWillUpdate(nextProps, nextState) {
    // detect canvas related changes in state and inform componentWillUpdate to perform
    // canvas rerendering if needed
    const fields = ['imgSrc', 'imgData', 'blurRadius', 'width', 'height'];
    const isStateInitialization = !this.state;

    this.hasDirty = isStateInitialization || fields.some(field => this.state[field] !== nextState[field]);
    this.imageChanged = isStateInitialization || ['imgSrc', 'imgData'].some(imgField => this.state[imgField] !== nextState[imgField]);

    // log the nature of the change
    if (isStateInitialization) {
      console.log(`${this.props.layerName} updated because the state is initializing`);
    } else if (this.state.imgData !== nextState.imgData) {
      console.log(`${this.props.layerName} updated because the image data for it changed`);
    }
  }

  componentDidUpdate() {
    if (this.hasDirty) {
      this.hasDirty = false;

      const isImgData = this.state.imgData;
      const loadImagePromise = isImgData ? Promise.resolve() : this.loadImage(this.state.imgSrc);
      const imageChanged = this.imageChanged;

      loadImagePromise.then((event) => {
        const canvas = ReactDOM.findDOMNode(this.refs.canvas);
        canvas.height = this.state.height;
        canvas.width = this.state.width;

        if (isImgData) {
          console.log(`Doing expensive render on ${this.props.layerName}`);
          //transferImageData(this.state.imgData, canvas);
          //stackBlurCanvasRGB(canvas, 0, 0, 100, 100, this.state.blurRadius);
          blasphemousBlur(this.state.imgData, canvas, this.state.blurRadius);
        } else {
          stackBlurImage(this.img, canvas, this.state.blurRadius, this.state.width, this.state.height);  
        }

        if (imageChanged) {
          this.props.onLoadFunction(event);
        }
        
      });
    }
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.img && this.img.src === src) {
        return resolve(); // no event, no change in image
      } else if (!this.img) {
        this.img           = new Image();
      }

      this.img.crossOrigin = 'Anonymous';
      this.img.src         = src;
      this.img.onload      = (event) => {
        resolve(event);
      };
      this.img.onerror     = (event) => {
        this.img.src = '';
        resolve(event);
      };
    });
  }

  resize() {
    const now        = new Date().getTime();
    const threshold = this.props.resizeInterval;

    if (this.last && now < this.last + threshold) {
      clearTimeout(this.deferTimer);
      this.deferTimer = setTimeout(() => {
        this.last = now;
        this.syncDimensions();
      }, threshold);
    } else {
      this.last = now;
      this.syncDimensions();
    }
  }

  syncDimensions() {
    if (this._unmounted) {
      return;
    }

    const container = ReactDOM.findDOMNode(this);
    this.setState({
      height: container.offsetHeight,
      width: container.offsetWidth
    });
  }

  syncProps(props) {
    this.setState({
      blurRadius: props.blurRadius,
      imgSrc: props.imgData ? null : getAbsolutePath(props.img),
      imgData: props.imgData
    });
  }

  render() {
    var { className, children, canvasStyle, ...other } = this.props;
    var classes = 'react-blur';

    if (className) {
      classes += ' ' + className;
    }

    return (
      <div {...other} className={classes}>
        <canvas className='react-blur-canvas' style={canvasStyle} ref='canvas' />
        {children}
      </div>
    );
  }
};