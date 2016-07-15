function isImageData(image) {
	return image && image.constructor.name === 'ImageData';
}

function isDifferentImageData(iData1, iData2) {
	return iData1.data !== iData2.data; // more precise, performant way to compare?
}

function makeImageProp(image) {
	return {
		[isImageData(image) ? 'imgData' : 'img']: image
	};
}

class Fader extends React.Component {

	static get defaultProps() {
	  // fade over 5 seconds every 50 milliseconds
	  return {
	       fadeDuration: 5000,
	       fadeResolution: 100,
	       maxLayers: 3
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
			// console.log(`Incrementing animate layer ${animateLayer.image} opacity ${animateLayer.opacity} + ${opacityIncrement} over ${props.fadeResolution}`);
			animateLayer.opacity += opacityIncrement;
			this.currentFading = setTimeout(this.doFading.bind(this), props.fadeResolution); // continue fading in
		} else {
			// console.log(`Stopping animate layer ${animateLayer.image} because opacity ${animateLayer.opacity}`);
			animateLayer.opacity = 1;
		}
		this.setState({ animateLayer });
	}

	layerLoadCheckpoint(key) {
		return function handler() {
			const { state, props } = this;
			let { loadedLayers, staticLayers } = state;

			loadedLayers[key] = true;
			// console.log(`marking ${key} as loaded`);

			// have all lower layers loaded?
			if (Object.keys(loadedLayers).every(layerKey => loadedLayers[layerKey])) {
				// console.log(`all static layers loaded, creating new animate layer ${key} ${state.nextImage}`);

				loadedLayers = {};

				// prevent creation of too many layers
				if (staticLayers.length > props.maxLayers) {
					staticLayers = staticLayers.slice(0, props.maxLayers);
				}

				const key = Date.now();

				// clear layer loaded tracking, trim static layers if needed, initiate new animateLayer
				this.setState({
					staticLayers,
					loadedLayers,
					animateLayer: {
						image: this.nextImage,
						opacity: 0,
						key: Date.now()
					}
				});

				// delete this.nextImage;
			}
		}.bind(this);
	}

	// once, before initial render
	componentWillMount() {
		const { props } = this;
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
		const { image: nextImage } = nextProps;
		const bothImageData = isImageData(state.animateLayer.image) && isImageData(nextImage);
		const imageDataChanged = bothImageData && isDifferentImageData(nextImage, state.animateLayer.image);
		const otherChange = !bothImageData && (nextImage !== state.animateLayer.image);

		if (imageDataChanged || otherChange) {
			const { staticLayers, loadedLayers } = state;
			const key = Date.now();

			//console.log(`Migrating current animate layer to static layer ${key}`);
			
			// suspend any ongoing animation and shuffle the animate layer into the static layers.
			// When all static layers are loaded, then restart the animation process.
			clearTimeout(this.currentFading);
			staticLayers.unshift({ ...state.animateLayer, key});
			loadedLayers[key] = false;
			this.nextImage = nextImage;
			this.setState({ staticLayers, loadedLayers });
		}
	}

	// the important thing is that React cannot be allowed manage the images / image transitions.
	// this must be manually handled as part of canvas drawing / CSS via state.
	render() {
		const { state, props } = this;
		
		const animateLayerStyle = {
			zIndex: props.maxLayers + 1,
			opacity: state.animateLayer.opacity || 0
		};
		
		return <div className={ props.containerClassName }>
			<ReactBlur layerName={`animate`} className={props.className} {...makeImageProp(state.animateLayer.image)} onLoadFunction={this.doFading.bind(this)} blurRadius={props.blurRadius} canvasStyle={animateLayerStyle} />
			{
				state.staticLayers.map((layer, idx) => {
					const staticLayerStyle = {
						zIndex: props.maxLayers - idx, // top to bottom
						opacity: layer.opacity
					};

					return <ReactBlur layerName={`staticLayer${idx}`} key={layer.key} className={props.className} {...makeImageProp(layer.image)} onLoadFunction={this.layerLoadCheckpoint(layer.key)} blurRadius={props.blurRadius} canvasStyle={staticLayerStyle} />;
				})
			}
		</div>;
	}
}