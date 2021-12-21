module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{png,ico,html,json,txt,webmanifest,js}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};