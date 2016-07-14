/* global React, ReactDOM, stackBlurImage */

const PureRenderMixin = React.addons.PureRenderMixin;

class ReactBlur extends React.Component {
  static propTypes = {
    img           : React.PropTypes.string.isRequired,
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
    this.initializeImage(this.props);

    window.addEventListener('resize', this.resize.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this));
  }

  componentWillReceiveProps(nextProps) {
    // we use this lifecycle method to determine if important props changed,
    // and if they did, then after componentDidUpdate(), we trigger the stackblur
    if (props.img !== nextProps.img || props.blurRadius !== nextProps.blurRadius) {
      this.setState({ dirtyImage: true });
    }
  }

  // when the render is finished
  componentDidUpdate() {
    if (!this.img) { // if there is no current image
      this.initializeImage(); // attempt to assign the image on the component
    } else if (!this.doesCurrentMatchProps()) {
      this.setImage();
    } else {
      // the conditions above will handle cases where the image changes
      // at this point, blurring should only be done if
      // 1. the canvas width / height changes
      // 2. the blur radius changes
      console.log('doing costly blur');
      stackBlurImage(this.img, this.canvas, this.getCurrentBlur(), this.width, this.height);
    }
  }

  doesCurrentMatchProps() {
    const newSrc = this.props.img;

    // Handle relative paths
    if (this.img) {
      const newImg = new Image();
      newImg.src   = newSrc;

      // if absolute SRC is the same
      return newImg.src === this.img.src;
    }

    return false;
  }

  getCurrentBlur() {
    return this.props.blurRadius;
  }

  initializeImage() {

    if (this.doesCurrentMatchProps()) {
      stackBlurImage(this.img, this.canvas, this.props.blurRadius, this.width, this.height);
      return;
    }

    this.img             = new Image();
    this.img.crossOrigin = 'Anonymous';
    this.img.onload      = (event) => {
      stackBlurImage(this.img, this.canvas, this.getCurrentBlur(), this.width, this.height);
      this.props.onLoadFunction(event);
    };
    this.img.onerror     = (event) => {
      this.img.src = '';
      this.props.onLoadFunction(event);
    };
    this.setImage();
  }

  setImage() {
      this.img.src = this.props.img;
      this.setDimensions();    
  }

  resize() {
    const now        = new Date().getTime();
    let deferTimer;
    const threshhold = this.props.resizeInterval;

    if (this.last && now < this.last + threshhold) {
      clearTimeout(deferTimer);
      deferTimer = setTimeout(() => {
        this.last = now;
        this.doResize();
      }, threshhold);
    } else {
      this.last = now;
      this.doResize();
    }
  }

  setDimensions() {
    const container = ReactDOM.findDOMNode(this);

    this.height = container.offsetHeight;
    this.width = container.offsetWidth;

    this.canvas        = ReactDOM.findDOMNode(this.refs.canvas);
    this.canvas.height = this.height;
    this.canvas.width  = this.width;

    stackBlurImage(this.img, this.canvas, this.getCurrentBlur(), this.width, this.height);
  }

  doResize() {
    this.setDimensions();
  }

  render() {
    var { className, children, ...other } = this.props;
    var classes = 'react-blur';

    if (className) {
      classes += ' ' + className;
    }

    return (
      <div {...other} className={classes} onClick={this.clickTest}>
        <canvas className='react-blur-canvas' ref='canvas' />
        {children}
      </div>
    );
  }
};