/* ReactDOM */

/*
    img           : React.PropTypes.string.isRequired,
    blurRadius    : React.PropTypes.number,
    resizeInterval: React.PropTypes.number,
    className     : React.PropTypes.string,
    children      : React.PropTypes.any,
    onLoadFunction: React.PropTypes.func
*/

const images = [
  'http://i.imgur.com/xXT22yy.jpg',
  'http://i.imgur.com/NpiCpFZ.jpg',
  'http://i.imgur.com/XjKO25E.jpg',
  'http://i.imgur.com/LYgnynJ.jpg',
];

ReactDOM.render(<App carousel={images} />, document.getElementById('reactblur'));