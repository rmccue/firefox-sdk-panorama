# Panorama Module for Firefox Add-on SDK (Jetpack)
This module gives an easier API for accessing the Tab Group-related APIs in
Firefox, and does not require using any low-level APIs. The add-on itself is
built using only add-on SDK modules, and does not use the "chrome" module.

## Using

	MyAddon.updateWidget = function () {
		var group = Panorama.getCurrentGroup();

		// ...
	});

	exports.main = function (options, callbacks) {
		// required for restartless install, probably a bug
		PanoramaPlus.updateWidget();

		// run once on startup
		Panorama.on('init', MyAddon.updateWidget);
		Panorama.on('change', MyAddon.updateWidget);
	};
	exports.onUnload = function (reason) {
		// clean up
		Panorama.removeListener('init', PanoramaPlus.updateWidget);
		Panorama.removeListener('change', PanoramaPlus.updateWidget);
	};