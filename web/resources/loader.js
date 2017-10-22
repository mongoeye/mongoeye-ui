var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var nprogress = createCommonjsModule(function (module, exports) {
/* NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress
 * @license MIT */

(function(root, factory) {

  if (typeof undefined === 'function' && undefined.amd) {
    undefined(factory);
  } else {
    module.exports = factory();
  }

})(commonjsGlobal, function() {
  var NProgress = {};

  NProgress.version = '0.2.0';

  var Settings = NProgress.settings = {
    minimum: 0.08,
    easing: 'ease',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 800,
    showSpinner: true,
    barSelector: '[role="bar"]',
    spinnerSelector: '[role="spinner"]',
    parent: 'body',
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
  };

  /**
   * Updates configuration.
   *
   *     NProgress.configure({
   *       minimum: 0.1
   *     });
   */
  NProgress.configure = function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };

  /**
   * Last number.
   */

  NProgress.status = null;

  /**
   * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
   *
   *     NProgress.set(0.4);
   *     NProgress.set(1.0);
   */

  NProgress.set = function(n) {
    var started = NProgress.isStarted();

    n = clamp(n, Settings.minimum, 1);
    NProgress.status = (n === 1 ? null : n);

    var progress = NProgress.render(!started),
        bar      = progress.querySelector(Settings.barSelector),
        speed    = Settings.speed,
        ease     = Settings.easing;

    progress.offsetWidth; /* Repaint */

    queue(function(next) {
      // Set positionUsing if it hasn't already been set
      if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

      // Add transition
      css(bar, barPositionCSS(n, speed, ease));

      if (n === 1) {
        // Fade out
        css(progress, { 
          transition: 'none', 
          opacity: 1 
        });
        progress.offsetWidth; /* Repaint */

        setTimeout(function() {
          css(progress, { 
            transition: 'all ' + speed + 'ms linear', 
            opacity: 0 
          });
          setTimeout(function() {
            NProgress.remove();
            next();
          }, speed);
        }, speed);
      } else {
        setTimeout(next, speed);
      }
    });

    return this;
  };

  NProgress.isStarted = function() {
    return typeof NProgress.status === 'number';
  };

  /**
   * Shows the progress bar.
   * This is the same as setting the status to 0%, except that it doesn't go backwards.
   *
   *     NProgress.start();
   *
   */
  NProgress.start = function() {
    if (!NProgress.status) NProgress.set(0);

    var work = function() {
      setTimeout(function() {
        if (!NProgress.status) return;
        NProgress.trickle();
        work();
      }, Settings.trickleSpeed);
    };

    if (Settings.trickle) work();

    return this;
  };

  /**
   * Hides the progress bar.
   * This is the *sort of* the same as setting the status to 100%, with the
   * difference being `done()` makes some placebo effect of some realistic motion.
   *
   *     NProgress.done();
   *
   * If `true` is passed, it will show the progress bar even if its hidden.
   *
   *     NProgress.done(true);
   */

  NProgress.done = function(force) {
    if (!force && !NProgress.status) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
  };

  /**
   * Increments by a random amount.
   */

  NProgress.inc = function(amount) {
    var n = NProgress.status;

    if (!n) {
      return NProgress.start();
    } else {
      if (typeof amount !== 'number') {
        amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
      }

      n = clamp(n + amount, 0, 0.994);
      return NProgress.set(n);
    }
  };

  NProgress.trickle = function() {
    return NProgress.inc(Math.random() * Settings.trickleRate);
  };

  /**
   * Waits for all supplied jQuery promises and
   * increases the progress as the promises resolve.
   *
   * @param $promise jQUery Promise
   */
  (function() {
    var initial = 0, current = 0;

    NProgress.promise = function($promise) {
      if (!$promise || $promise.state() === "resolved") {
        return this;
      }

      if (current === 0) {
        NProgress.start();
      }

      initial++;
      current++;

      $promise.always(function() {
        current--;
        if (current === 0) {
            initial = 0;
            NProgress.done();
        } else {
            NProgress.set((initial - current) / initial);
        }
      });

      return this;
    };

  })();

  /**
   * (Internal) renders the progress bar markup based on the `template`
   * setting.
   */

  NProgress.render = function(fromStart) {
    if (NProgress.isRendered()) return document.getElementById('nprogress');

    addClass(document.documentElement, 'nprogress-busy');
    
    var progress = document.createElement('div');
    progress.id = 'nprogress';
    progress.innerHTML = Settings.template;

    var bar      = progress.querySelector(Settings.barSelector),
        perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
        parent   = document.querySelector(Settings.parent),
        spinner;
    
    css(bar, {
      transition: 'all 0 linear',
      transform: 'translate3d(' + perc + '%,0,0)'
    });

    if (!Settings.showSpinner) {
      spinner = progress.querySelector(Settings.spinnerSelector);
      spinner && removeElement(spinner);
    }

    if (parent != document.body) {
      addClass(parent, 'nprogress-custom-parent');
    }

    parent.appendChild(progress);
    return progress;
  };

  /**
   * Removes the element. Opposite of render().
   */

  NProgress.remove = function() {
    removeClass(document.documentElement, 'nprogress-busy');
    removeClass(document.querySelector(Settings.parent), 'nprogress-custom-parent');
    var progress = document.getElementById('nprogress');
    progress && removeElement(progress);
  };

  /**
   * Checks if the progress bar is rendered.
   */

  NProgress.isRendered = function() {
    return !!document.getElementById('nprogress');
  };

  /**
   * Determine which positioning CSS rule to use.
   */

  NProgress.getPositioningCSS = function() {
    // Sniff on document.body.style
    var bodyStyle = document.body.style;

    // Sniff prefixes
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                       ('MozTransform' in bodyStyle) ? 'Moz' :
                       ('msTransform' in bodyStyle) ? 'ms' :
                       ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // Browsers without 3D support, e.g. IE9
      return 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      return 'margin';
    }
  };

  /**
   * Helpers
   */

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /**
   * (Internal) converts a percentage (`0..1`) to a bar translateX
   * percentage (`-100%..0%`).
   */

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }


  /**
   * (Internal) returns the correct CSS for changing the bar's
   * position given an n percentage, and speed and ease from Settings
   */

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n)+'%' };
    }

    barCSS.transition = 'all '+speed+'ms '+ease;

    return barCSS;
  }

  /**
   * (Internal) Queues a function to be executed.
   */

  var queue = (function() {
    var pending = [];
    
    function next() {
      var fn = pending.shift();
      if (fn) {
        fn(next);
      }
    }

    return function(fn) {
      pending.push(fn);
      if (pending.length == 1) next();
    };
  })();

  /**
   * (Internal) Applies css properties to an element, similar to the jQuery 
   * css method.
   *
   * While this helper does assist with vendor prefixed property names, it 
   * does not perform any manipulation of values prior to setting styles.
   */

  var css = (function() {
    var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
        cssProps    = {};

    function camelCase(string) {
      return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
        return letter.toUpperCase();
      });
    }

    function getVendorProp(name) {
      var style = document.body.style;
      if (name in style) return name;

      var i = cssPrefixes.length,
          capName = name.charAt(0).toUpperCase() + name.slice(1),
          vendorName;
      while (i--) {
        vendorName = cssPrefixes[i] + capName;
        if (vendorName in style) return vendorName;
      }

      return name;
    }

    function getStyleProp(name) {
      name = camelCase(name);
      return cssProps[name] || (cssProps[name] = getVendorProp(name));
    }

    function applyCss(element, prop, value) {
      prop = getStyleProp(prop);
      element.style[prop] = value;
    }

    return function(element, properties) {
      var args = arguments,
          prop, 
          value;

      if (args.length == 2) {
        for (prop in properties) {
          value = properties[prop];
          if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
        }
      } else {
        applyCss(element, args[1], args[2]);
      }
    }
  })();

  /**
   * (Internal) Determines if an element or space separated list of class names contains a class name.
   */

  function hasClass(element, name) {
    var list = typeof element == 'string' ? element : classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  }

  /**
   * (Internal) Adds a class to an element.
   */

  function addClass(element, name) {
    var oldList = classList(element),
        newList = oldList + name;

    if (hasClass(oldList, name)) return; 

    // Trim the opening space.
    element.className = newList.substring(1);
  }

  /**
   * (Internal) Removes a class from an element.
   */

  function removeClass(element, name) {
    var oldList = classList(element),
        newList;

    if (!hasClass(element, name)) return;

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ');

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1);
  }

  /**
   * (Internal) Gets a space separated list of the class names on the element. 
   * The list is wrapped with a single space on each end to facilitate finding 
   * matches within the list.
   */

  function classList(element) {
    return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
  }

  /**
   * (Internal) Removes an element from the DOM.
   */

  function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
  }

  return NProgress;
});
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/* eslint-disable */
// Modified version of head.load.js, removed errorTimeout
(function (win, undefined) {
	"use strict";

	//#region variables

	var doc = win.document,
	    domWaiters = [],
	    handlers = {},
	    // user functions waiting for events
	assets = {},
	    // loadable items in various states
	isAsync = "async" in doc.createElement("script") || "MozAppearance" in doc.documentElement.style || win.opera,
	    isDomReady,


	/*** public API ***/
	headVar = win.head_conf && win.head_conf.head || "head",
	    api = win[headVar] = win[headVar] || function () {
		api.ready.apply(null, arguments);
	},


	// states
	PRELOADING = 1,
	    PRELOADED = 2,
	    LOADING = 3,
	    LOADED = 4;
	//#endregion

	//#region PRIVATE functions

	//#region Helper functions
	function noop() {
		// does nothing
	}

	function each(arr, callback) {
		if (!arr) {
			return;
		}

		// arguments special type
		if ((typeof arr === "undefined" ? "undefined" : _typeof(arr)) === "object") {
			arr = [].slice.call(arr);
		}

		// do the job
		for (var i = 0, l = arr.length; i < l; i++) {
			callback.call(arr, arr[i], i);
		}
	}

	/* A must read: http://bonsaiden.github.com/JavaScript-Garden
  ************************************************************/
	function is(type, obj) {
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
		return obj !== undefined && obj !== null && clas === type;
	}

	function isFunction(item) {
		return is("Function", item);
	}

	function isArray(item) {
		return is("Array", item);
	}

	function toLabel(url) {
		///<summary>Converts a url to a file label</summary>
		var items = url.split("/"),
		    name = items[items.length - 1],
		    i = name.indexOf("?");

		return i !== -1 ? name.substring(0, i) : name;
	}

	// INFO: this look like a "im triggering callbacks all over the place, but only wanna run it one time function" ..should try to make everything work without it if possible
	// INFO: Even better. Look into promises/defered's like jQuery is doing
	function one(callback) {
		///<summary>Execute a callback only once</summary>
		callback = callback || noop;

		if (callback._done) {
			return;
		}

		callback();
		callback._done = 1;
	}
	//#endregion

	function conditional(test, success, failure, callback) {
		///<summary>
		/// INFO: use cases:
		///    head.test(condition, null       , "file.NOk" , callback);
		///    head.test(condition, "fileOk.js", null       , callback);
		///    head.test(condition, "fileOk.js", "file.NOk" , callback);
		///    head.test(condition, "fileOk.js", ["file.NOk", "file.NOk"], callback);
		///    head.test({
		///               test    : condition,
		///               success : [{ label1: "file1Ok.js"  }, { label2: "file2Ok.js" }],
		///               failure : [{ label1: "file1NOk.js" }, { label2: "file2NOk.js" }],
		///               callback: callback
		///    );
		///    head.test({
		///               test    : condition,
		///               success : ["file1Ok.js" , "file2Ok.js"],
		///               failure : ["file1NOk.js", "file2NOk.js"],
		///               callback: callback
		///    );
		///</summary>
		var obj = (typeof test === "undefined" ? "undefined" : _typeof(test)) === "object" ? test : {
			test: test,
			success: !!success ? isArray(success) ? success : [success] : false,
			failure: !!failure ? isArray(failure) ? failure : [failure] : false,
			callback: callback || noop
		};

		// Test Passed ?
		var passed = !!obj.test;

		// Do we have a success case
		if (passed && !!obj.success) {
			obj.success.push(obj.callback);
			api.load.apply(null, obj.success);
		}
		// Do we have a fail case
		else if (!passed && !!obj.failure) {
				obj.failure.push(obj.callback);
				api.load.apply(null, obj.failure);
			} else {
				callback();
			}

		return api;
	}

	function getAsset(item) {
		///<summary>
		/// Assets are in the form of
		/// {
		///     name : label,
		///     url  : url,
		///     state: state
		/// }
		///</summary>
		var asset = {};

		if ((typeof item === "undefined" ? "undefined" : _typeof(item)) === "object") {
			for (var label in item) {
				if (!!item[label]) {
					asset = {
						name: label,
						url: item[label]
					};
				}
			}
		} else {
			asset = {
				name: toLabel(item),
				url: item
			};
		}

		// is the item already existant
		var existing = assets[asset.name];
		if (existing && existing.url === asset.url) {
			return existing;
		}

		assets[asset.name] = asset;
		return asset;
	}

	function allLoaded(items) {
		items = items || assets;

		for (var name in items) {
			if (items.hasOwnProperty(name) && items[name].state !== LOADED) {
				return false;
			}
		}

		return true;
	}

	function onPreload(asset) {
		asset.state = PRELOADED;

		each(asset.onpreload, function (afterPreload) {
			afterPreload.call();
		});
	}

	function preLoad(asset, callback) {
		if (asset.state === undefined) {

			asset.state = PRELOADING;
			asset.onpreload = [];

			loadAsset({ url: asset.url, type: "cache" }, function () {
				onPreload(asset);
			});
		}
	}

	function apiLoadHack() {
		/// <summary>preload with text/cache hack
		///
		/// head.load("http://domain.com/file.js","http://domain.com/file.js", callBack)
		/// head.load(["http://domain.com/file.js","http://domain.com/file.js"], callBack)
		/// head.load({ label1: "http://domain.com/file.js" }, { label2: "http://domain.com/file.js" }, callBack)
		/// head.load([{ label1: "http://domain.com/file.js" }, { label2: "http://domain.com/file.js" }], callBack)
		/// </summary>
		var args = arguments,
		    callback = args[args.length - 1],
		    rest = [].slice.call(args, 1),
		    next = rest[0];

		if (!isFunction(callback)) {
			callback = null;
		}

		// if array, repush as args
		if (isArray(args[0])) {
			args[0].push(callback);
			api.load.apply(null, args[0]);

			return api;
		}

		// multiple arguments
		if (!!next) {
			/* Preload with text/cache hack (not good!)
    * http://blog.getify.com/on-script-loaders/
    * http://www.nczonline.net/blog/2010/12/21/thoughts-on-script-loaders/
    * If caching is not configured correctly on the server, then items could load twice !
    *************************************************************************************/
			each(rest, function (item) {
				// item is not a callback or empty string
				if (!isFunction(item) && !!item) {
					preLoad(getAsset(item));
				}
			});

			// execute
			load(getAsset(args[0]), isFunction(next) ? next : function () {
				api.load.apply(null, rest);
			});
		} else {
			// single item
			load(getAsset(args[0]));
		}

		return api;
	}

	function apiLoadAsync() {
		///<summary>
		/// simply load and let browser take care of ordering
		///
		/// head.load("http://domain.com/file.js","http://domain.com/file.js", callBack)
		/// head.load(["http://domain.com/file.js","http://domain.com/file.js"], callBack)
		/// head.load({ label1: "http://domain.com/file.js" }, { label2: "http://domain.com/file.js" }, callBack)
		/// head.load([{ label1: "http://domain.com/file.js" }, { label2: "http://domain.com/file.js" }], callBack)
		///</summary>
		var args = arguments,
		    callback = args[args.length - 1],
		    items = {};

		if (!isFunction(callback)) {
			callback = null;
		}

		// if array, repush as args
		if (isArray(args[0])) {
			args[0].push(callback);
			api.load.apply(null, args[0]);

			return api;
		}

		// JRH 262#issuecomment-26288601
		// First populate the items array.
		// When allLoaded is called, all items will be populated.
		// Issue when lazy loaded, the callback can execute early.
		each(args, function (item, i) {
			if (item !== callback) {
				item = getAsset(item);
				items[item.name] = item;
			}
		});

		each(args, function (item, i) {
			if (item !== callback) {
				item = getAsset(item);

				load(item, function () {
					if (allLoaded(items)) {
						one(callback);
					}
				});
			}
		});

		return api;
	}

	function load(asset, callback) {
		///<summary>Used with normal loading logic</summary>
		callback = callback || noop;

		if (asset.state === LOADED) {
			callback();
			return;
		}

		// INFO: why would we trigger a ready event when its not really loaded yet ?
		if (asset.state === LOADING) {
			api.ready(asset.name, callback);
			return;
		}

		if (asset.state === PRELOADING) {
			asset.onpreload.push(function () {
				load(asset, callback);
			});
			return;
		}

		asset.state = LOADING;

		loadAsset(asset, function () {
			asset.state = LOADED;

			callback();

			// handlers for this asset
			each(handlers[asset.name], function (fn) {
				one(fn);
			});

			// dom is ready & no assets are queued for loading
			// INFO: shouldn't we be doing the same test above ?
			if (isDomReady && allLoaded()) {
				each(handlers.ALL, function (fn) {
					one(fn);
				});
			}
		});
	}

	function getExtension(url) {
		url = url || "";

		var items = url.split("?")[0].split(".");
		return items[items.length - 1].toLowerCase();
	}

	/* Parts inspired from: https://github.com/cujojs/curl
  ******************************************************/
	function loadAsset(asset, callback) {
		callback = callback || noop;

		function error(event) {
			event = event || win.event;

			// release event listeners
			ele.onload = ele.onreadystatechange = ele.onerror = null;

			// do callback
			callback();

			// need some more detailed error handling here
		}

		function process(event) {
			event = event || win.event;

			// IE 7/8 (2 events on 1st load)
			// 1) event.type = readystatechange, s.readyState = loading
			// 2) event.type = readystatechange, s.readyState = loaded

			// IE 7/8 (1 event on reload)
			// 1) event.type = readystatechange, s.readyState = complete

			// event.type === 'readystatechange' && /loaded|complete/.test(s.readyState)

			// IE 9 (3 events on 1st load)
			// 1) event.type = readystatechange, s.readyState = loading
			// 2) event.type = readystatechange, s.readyState = loaded
			// 3) event.type = load            , s.readyState = loaded

			// IE 9 (2 events on reload)
			// 1) event.type = readystatechange, s.readyState = complete
			// 2) event.type = load            , s.readyState = complete

			// event.type === 'load'             && /loaded|complete/.test(s.readyState)
			// event.type === 'readystatechange' && /loaded|complete/.test(s.readyState)

			// IE 10 (3 events on 1st load)
			// 1) event.type = readystatechange, s.readyState = loading
			// 2) event.type = load            , s.readyState = complete
			// 3) event.type = readystatechange, s.readyState = loaded

			// IE 10 (3 events on reload)
			// 1) event.type = readystatechange, s.readyState = loaded
			// 2) event.type = load            , s.readyState = complete
			// 3) event.type = readystatechange, s.readyState = complete

			// event.type === 'load'             && /loaded|complete/.test(s.readyState)
			// event.type === 'readystatechange' && /complete/.test(s.readyState)

			// Other Browsers (1 event on 1st load)
			// 1) event.type = load, s.readyState = undefined

			// Other Browsers (1 event on reload)
			// 1) event.type = load, s.readyState = undefined

			// event.type == 'load' && s.readyState = undefined

			// !doc.documentMode is for IE6/7, IE8+ have documentMode
			if (event.type === "load" || /loaded|complete/.test(ele.readyState) && (!doc.documentMode || doc.documentMode < 9)) {
				// remove timeouts
				win.clearTimeout(asset.errorTimeout);
				win.clearTimeout(asset.cssTimeout);

				// release event listeners
				ele.onload = ele.onreadystatechange = ele.onerror = null;

				// do callback
				callback();
			}
		}

		function isCssLoaded() {
			// should we test again ? 20 retries = 5secs ..after that, the callback will be triggered by the error handler at 7secs
			if (asset.state !== LOADED && asset.cssRetries <= 20) {

				// loop through stylesheets
				for (var i = 0, l = doc.styleSheets.length; i < l; i++) {
					// do we have a match ?
					// we need to tests agains ele.href and not asset.url, because a local file will be assigned the full http path on a link element
					if (doc.styleSheets[i].href === ele.href) {
						process({ "type": "load" });
						return;
					}
				}

				// increment & try again
				asset.cssRetries++;
				asset.cssTimeout = win.setTimeout(isCssLoaded, 250);
			}
		}

		var ele;
		var ext = getExtension(asset.url);

		if (ext === "css") {
			ele = doc.createElement("link");
			ele.type = "text/" + (asset.type || "css");
			ele.rel = "stylesheet";
			ele.href = asset.url;

			/* onload supported for CSS on unsupported browsers
    * Safari windows 5.1.7, FF < 10
    */

			// Set counter to zero
			asset.cssRetries = 0;
			asset.cssTimeout = win.setTimeout(isCssLoaded, 500);
		} else {
			ele = doc.createElement("script");
			ele.type = "text/" + (asset.type || "javascript");
			ele.src = asset.url;
		}

		ele.onload = ele.onreadystatechange = process;
		ele.onerror = error;

		/* Good read, but doesn't give much hope !
   * http://blog.getify.com/on-script-loaders/
   * http://www.nczonline.net/blog/2010/12/21/thoughts-on-script-loaders/
   * https://hacks.mozilla.org/2009/06/defer/
   */

		// ASYNC: load in parallel and execute as soon as possible
		ele.async = false;
		// DEFER: load in parallel but maintain execution order
		ele.defer = false;

		// timout for asset loading
		asset.errorTimeout = undefined;

		// use insertBefore to keep IE from throwing Operation Aborted (thx Bryan Forbes!)
		var head = doc.head || doc.getElementsByTagName("head")[0];

		// but insert at end of head, because otherwise if it is a stylesheet, it will not override values
		head.insertBefore(ele, head.lastChild);
	}

	/* Parts inspired from: https://github.com/jrburke/requirejs
  ************************************************************/
	function init() {
		var items = doc.getElementsByTagName("script");

		// look for a script with a data-head-init attribute
		for (var i = 0, l = items.length; i < l; i++) {
			var dataMain = items[i].getAttribute("data-headjs-load");
			if (!!dataMain) {
				api.load(dataMain);
				return;
			}
		}
	}

	function ready(key, callback) {
		///<summary>
		/// INFO: use cases:
		///    head.ready(callBack);
		///    head.ready(document , callBack);
		///    head.ready("file.js", callBack);
		///    head.ready("label"  , callBack);
		///    head.ready(["label1", "label2"], callback);
		///</summary>

		// DOM ready check: head.ready(document, function() { });
		if (key === doc) {
			if (isDomReady) {
				one(callback);
			} else {
				domWaiters.push(callback);
			}

			return api;
		}

		// shift arguments
		if (isFunction(key)) {
			callback = key;
			key = "ALL"; // holds all callbacks that where added without labels: ready(callBack)
		}

		// queue all items from key and return. The callback will be executed if all items from key are already loaded.
		if (isArray(key)) {
			var items = {};

			each(key, function (item) {
				items[item] = assets[item];

				api.ready(item, function () {
					if (allLoaded(items)) {
						one(callback);
					}
				});
			});

			return api;
		}

		// make sure arguments are sane
		if (typeof key !== "string" || !isFunction(callback)) {
			return api;
		}

		// this can also be called when we trigger events based on filenames & labels
		var asset = assets[key];

		// item already loaded --> execute and return
		if (asset && asset.state === LOADED || key === "ALL" && allLoaded() && isDomReady) {
			one(callback);
			return api;
		}

		var arr = handlers[key];
		if (!arr) {
			arr = handlers[key] = [callback];
		} else {
			arr.push(callback);
		}

		return api;
	}

	/* Mix of stuff from jQuery & IEContentLoaded
  * http://dev.w3.org/html5/spec/the-end.html#the-end
  ***************************************************/
	function domReady() {
		// Make sure body exists, at least, in case IE gets a little overzealous (jQuery ticket #5443).
		if (!doc.body) {
			// let's not get nasty by setting a timeout too small.. (loop mania guaranteed if assets are queued)
			win.clearTimeout(api.readyTimeout);
			api.readyTimeout = win.setTimeout(domReady, 50);
			return;
		}

		if (!isDomReady) {
			isDomReady = true;

			init();
			each(domWaiters, function (fn) {
				one(fn);
			});
		}
	}

	function domContentLoaded() {
		// W3C
		if (doc.addEventListener) {
			doc.removeEventListener("DOMContentLoaded", domContentLoaded, false);
			domReady();
		}

		// IE
		else if (doc.readyState === "complete") {
				// we're here because readyState === "complete" in oldIE
				// which is good enough for us to call the dom ready!
				doc.detachEvent("onreadystatechange", domContentLoaded);
				domReady();
			}
	}

	// Catch cases where ready() is called after the browser event has already occurred.
	// we once tried to use readyState "interactive" here, but it caused issues like the one
	// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
	if (doc.readyState === "complete") {
		domReady();
	}

	// W3C
	else if (doc.addEventListener) {
			doc.addEventListener("DOMContentLoaded", domContentLoaded, false);

			// A fallback to window.onload, that will always work
			win.addEventListener("load", domReady, false);
		}

		// IE
		else {
				// Ensure firing before onload, maybe late but safe also for iframes
				doc.attachEvent("onreadystatechange", domContentLoaded);

				// A fallback to window.onload, that will always work
				win.attachEvent("onload", domReady);

				// If IE and not a frame
				// continually check to see if the document is ready
				var top = false;

				try {
					top = !win.frameElement && doc.documentElement;
				} catch (e) {}

				if (top && top.doScroll) {
					(function doScrollCheck() {
						if (!isDomReady) {
							try {
								// Use the trick by Diego Perini
								// http://javascript.nwbox.com/IEContentLoaded/
								top.doScroll("left");
							} catch (error) {
								// let's not get nasty by setting a timeout too small.. (loop mania guaranteed if assets are queued)
								win.clearTimeout(api.readyTimeout);
								api.readyTimeout = win.setTimeout(doScrollCheck, 50);
								return;
							}

							// and execute any waiting functions
							domReady();
						}
					})();
				}
			}
	//#endregion

	//#region Public Exports
	// INFO: determine which method to use for loading
	api.load = api.js = isAsync ? apiLoadAsync : apiLoadHack;
	api.test = conditional;
	api.ready = ready;
	//#endregion

	//#region INIT
	// perform this when DOM is ready
	api.ready(doc, function () {
		if (allLoaded()) {
			each(handlers.ALL, function (callback) {
				one(callback);
			});
		}

		if (api.feature) {
			api.feature("domloaded", true);
		}
	});
	//#endregion
})(window);

/* global head */
head.load(document.body.getAttribute('data-loader').split(';').map(function (script) {
  var url = script.trim();
  var label = void 0;

  var parts = url.match(/^(.+):(.[^/$].*)$/);
  if (parts) {
    label = parts[1];
    url = parts[2];
  } else {
    // If no label found, then is label set to filename without args after ?
    label = url.match(/([^?/]+)(\?.+)?$/)[1];
  }

  var out = {};
  out[label] = url;
  return out;
}));

/* global head */
/* global loader */
/* global Globalize */
// Export libs global
window.nprogress = nprogress;

// Config progress bar
nprogress.configure({ easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)', speed: 600 });

// Wait for localization
// head.ready(['locale'], () => {
//   loader.showMsg(Globalize.formatMessage('loader/loading/scripts'));
// });

//# sourceMappingURL=maps/loader.js.map
