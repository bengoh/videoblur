function isImageData(image) {
	return image.constructor.name === 'ImageData';
}

function isDifferentImageData(iData1, iData2) {
	return iData1.data !== iData2.data; // more precise, performant way to compare?
}

const MAX_LAYERS = 5;

class Fader extends React.Component {

	static get defaultProps() {
	  // fade over 5 seconds every 50 milliseconds
	  return {
	       fadeDuration: 5000,
	       fadeResolution: 50
	  };
	}

	constructor(props) {
		super(props);
	}

	doFading() {
		const { state, props } = this;
		const opacityIncrement = props.fadeResolution / props.fadeDuration;
		let animateLayer = { ...state.animateLayer };

		if (animateLayer.opacity < 1) {
			animateLayer.opacity += opacityIncrement;
			setTimeout(this.doFading.bind(this), props.fadeResolution); // continue fading in
		} else {
			animateLayer.opacity = 1;
		}
		this.setState({ animateLayer });
	}

	layerLoadCheckpoint(key) {
		return function handler() {
			const { state } = this;
			const { loadedLayers } = state;

			loadedLayers[key] = true;

			// have all lower layers loaded?
			if (Object.keys(loadedLayers).every(layerKey => loadedLayers[layerKey])) {
				// clear layer loaded tracking, initiate new animateLayer
				this.setState({
					loadedLayers: {},
					animateLayer: {
						image: state.nextImage,
						opacity: 0,
						key: Date.now()
					},
					nextImage: undefined
				});
			}
		}.bind(this);
	}

	// once, before initial render
	componentWillMount() {
		const { props, state } = this;
		// we begin with an opaque animate layer and an empty set of static layers
		this.setState({
			animateLayer: {
				image: props.image,
				opacity: 1,
				key: Date.now()
			},
			staticLayers: [],
			loadedLayers: {}
		});
	}

	// only after initial render, when a re-render is about to be attempted.
	// props may not have changed
	componentWillReceiveProps(nextProps) {
		const { props, state } = this;
		const bothImageData = isImageData(state.animateLayer.image) && isImageData(nextProps.image);
		const imageDataChanged = bothImageData && isDifferentImageData(state.animateLayer.image, nextProps.image);
		const otherChange = !bothImageData && (nextProps.image !== state.animateLayer.image);

		if (imageDataChanged || otherChange) {
			const staticLayers = state.staticLayers;
			const loadedLayers = state.loadedLayers;
			const nextImage = nextProps.image;
			const key = Date.now();

			// shuffle the animate layer down. When all static layers are loaded, then start the animation process.
			staticLayers.unshift({ ...state.animateLayer, key});
			loadedLayers[key] = false;
			this.setState({ staticLayers, loadedLayers, nextImage });
		}
	}

	// the important thing is that React cannot be allowed manage the images / image transitions.
	// this must be manually handled as part of canvas drawing / CSS.
	render() {
		const { state, props } = this;
		
		const animateLayerStyle = {
			zIndex: MAX_LAYERS + 1,
			opacity: state.animateLayer.opacity || 0
		};

		return <div className={ props.containerClassName }>
			<ReactBlur className={props.className} img={state.animateLayer.image} onLoadFunction={this.doFading.bind(this)} blurRadius={props.blurRadius} style={animateLayerStyle} />
			{
				state.staticLayers.map((layer, idx) => {
					const staticLayerStyle = {
						zIndex: MAX_LAYERS - idx, // top to bottom
						opacity: layer.opacity
					};

					return <ReactBlur key={layer.key} className={props.className} img={layer.image} onLoadFunction={this.layerLoadCheckpoint(layer.key)} blurRadius={props.blurRadius} style={staticLayerStyle} />;
				})
			}
		</div>;
	}
}