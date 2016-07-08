class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			opacity: 0,
			lower: 0,
			upperLoading: true,
			lowerLoading: false,
			upper: 1
		};
	}

	keepFadingIn() {
		const { state, props } = this;
		if (!state.upperLoading) {
			if (state.opacity < 1) {
				this.setState({
					opacity: state.opacity + .01
				});
			} else {
				this.setState({
					lower: (state.lower + 1) % (props.carousel.length),
					upper: (state.upper + 1) % (props.carousel.length),
					upperLoading: true,
					lowerLoading: true,
					opacity: 0
				});
			}
		}
		setTimeout(this.keepFadingIn.bind(this), 50);
	}

	upperOnLoad() {
		this.setState({
			upperLoading: false
		});
	}

	lowerOnLoad() {
		this.setState({
			lowerLoading: false
		});
	}

	componentDidMount() {
		this.keepFadingIn();
	}

	render() {
		const { state, props, lowerOnLoad, upperOnLoad } = this;
		const upperStyle = {
			zIndex: 3,
			opacity: state.opacity
		};

		const middleStyle = {
			zIndex: 2,
			opacity: state.lowerLoading ? 1 : 0
		};

		const middleImage = state.lowerLoading ? props.carousel[state.lower] : props.carousel[state.upper];

		const lowerStyle = {
			zIndex: 1,
			opacity: 1
		};

		//return <ReactBlur className="fullscreen" img={props.carousel[state.upper]} blurRadius={0} style={upperStyle} />;
		return <div className="fullscreen" style={ { backgroundColor: 'black' } }>
			<ReactBlur className="fullscreen" img={props.carousel[state.upper]} onLoadFunction={upperOnLoad.bind(this)} blurRadius={0} style={upperStyle} />,
			<ReactBlur className="fullscreen" img={middleImage} blurRadius={0} style={middleStyle} />,
			<ReactBlur className="fullscreen" img={props.carousel[state.lower]} onLoadFunction={lowerOnLoad.bind(this)} blurRadius={0} style={lowerStyle} />
		</div>;
	}

}