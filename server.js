var express = require('express');

const app = express();

app.use(express.static('public'));

const listener = app.listen(process.env.PORT || 8000, () => {
	console.log(`Your app is listening on port ${listener.address().port}`);
});