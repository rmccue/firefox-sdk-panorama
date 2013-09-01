// var windows = require("sdk/windows");
var window_utils = require("sdk/window/utils");
var events = require("sdk/event/core");
var sysevents = require("sdk/system/events");
var unload = require("sdk/system/unload");

var Panorama = exports;

var _cache = {
	group: null,
	groupProps: {
		title: null
	}
};
var _watchedWindows = [];

Panorama.Group = function (item) {
	this.item = item;

	this.toJSON = function () {
		return this.title;
	};
};

Panorama.Group.prototype = {
	get id() {
		return this.item.id;
	},
	get title() {
		return this.item.getTitle();
	}
};

// Panorama is lazy-initialized, so we need to force it to load ASAP
var _forceInitialize = function (cb) {
	var window = window_utils.getMostRecentBrowserWindow();
	var view = window.TabView;

	if (view._window)
		return cb.call();

	view._initFrame(function() {
		var window = window_utils.getMostRecentBrowserWindow();
		var view = window.TabView;
		cb.call();
	});
};

var _getCurrentGroup = function () {
	var window = window_utils.getMostRecentBrowserWindow();

	if ( ! window || ! window.TabView || ! window.TabView._window ) {
		return null;
	}
	else {
		return window.TabView._window.GroupItems.getActiveGroupItem();
	}
};

Panorama.getCurrentGroup = function () {
	return _cache.group;
};

// Event-o-matic
exports.on = events.on.bind(null, exports);
exports.once = events.once.bind(null, exports);
exports.removeListener = function removeListener(type, listener) {
	events.off(exports, type, listener);
};

var _emitChange = function () {
	events.emit(exports, 'change');
};

var _maybeEmitChange = function () {
	var _currentGroup = _getCurrentGroup();
	if ( ! _currentGroup ) {
		return;
	}

	var currentGroup = new Panorama.Group( _currentGroup );

	if ( ! _cache.group || _cache.groupProps.title !== currentGroup.title ) {
		_cache.group = currentGroup;
		_cache.groupProps.title = currentGroup.title;

		_emitChange();
	}
};

var _watchWindow = function (win) {
	if (win.subject)
		win = win.subject;

	// Don't watch twice
	if (win in _watchedWindows)
		return;

	// There's no event for changing a group (really guys?), so watch for tab
	// changes instead.
	win.addEventListener('TabSelect', _maybeEmitChange);

	// Fire when we close the switcher
	win.addEventListener('tabviewhidden', _maybeEmitChange);

	_watchedWindows.push(win);
};

var _unwatchWindow = function (win) {
	if (win.subject)
		win = win.subject;

	win.removeEventListener('TabSelect', _maybeEmitChange);
	win.removeEventListener('tabviewhidden', _maybeEmitChange);
};

var _watchBrowser = function () {
	// Watch for open/closing windows
	sysevents.on('domwindowopened', _watchWindow);
	sysevents.on('domwindowclosed', _unwatchWindow);
};

var _unwatchBrowser = function () {
	sysevents.off('domwindowopened', _watchWindow);
	sysevents.off('domwindowclosed', _unwatchWindow);
};


var _startup = function () {
	// Force initialization
	_forceInitialize(function () {
		// Start watching
		_watchWindow(window_utils.getMostRecentBrowserWindow());
		_maybeEmitChange();

		events.emit(exports, 'init');
	});

	// Set up listeners
	_watchBrowser();

	unload.ensure(Panorama);
};

Panorama.unload = function () {
	for (var i = _watchedWindows.length - 1; i >= 0; i--) {
		_unwatchWindow(_watchedWindows[i]);
	};

	_unwatchBrowser();
};

_startup();