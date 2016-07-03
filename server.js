const express = require('express');
const expressBabel = require('express-babel').default;
const app = express();

app.use('/js', 
	expressBabel(__dirname + '/public/js', { presets: [ 'es2015', 'stage-0' ] })
);

app.use(express.static('public'));

const listener = app.listen(process.env.PORT || 8000, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});