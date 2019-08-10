(function (root, factory) {
	root.swipeableCards = factory(root);
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	//
	// Variables
	//

	var swipeableCards = {}; // Object for public APIs
	var supports = !!document.querySelector && !!root.addEventListener; // Feature test
	var settings; // Placeholder variables

	// Default settings
	var defaults = {
		resizeLog: 'The window was resized!',
		isHeld: false,
		swipeRight: function () { return false },
		swipeRightPromise: function() { return new Promise(function (resolve, reject) { settings.swipeRight(resolve,reject)})},
		swipeLeft: function (resolve, reject) { reject() },
		swipeLeftPromise: function() { return new Promise(function (resolve, reject) { settings.swipeLeft(resolve,reject)})},
		swipeTop: function () { return false },
		swipeBottom: function () { return false }
	};


	//
	// Methods
	//
	
	var extend = function () {

		// Create a new object
		var extended = {};

		// Merge the object into the extended object
		var merge = function (obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					// Push each value from `obj` into `extended`
					extended[prop] = obj[prop];
				}
			}
		};

		// Loop through each object and conduct a merge
		for (var i = 0; i < arguments.length; i++) {
			merge(arguments[i]);
		}

		return extended;

	};

	/**
	 * Add a class to a link when it's clicked
	 * @private
	 * @param {Event} event The click event
	 */
	var addClass = function ( event ) {

		// Get the thing that was clicked
		var toggle = event.target;

		// Check if the thing that was clicked has the [data-click-me] attribute
		if ( toggle && toggle.hasAttribute( 'data-swipeable' ) ) {
			console.log("swipe")
			// Prevent default click event
			if ( toggle.tagName.toLowerCase() === 'a') {
				event.preventDefault();
			}

			// Set the [data-click-me] value as a class on the link
			toggle.classList.add( toggle.getAttribute( 'data-swipeable' ) );

		}

	};

	/**
	 * Handle events
	 * @private
	 */
	var eventHandler = function (event) {
		//event.preventDefault()
		//addListenerMulti(event.target,"mousemove touchmove mouseup touchend", elementMove(event, el));
		if ( event.type === 'touchstart' || event.type === 'mousedown' ) {
			swipeableCards.element = this;
			swipeableCards.isHeld = true;
            swipeableCards.touchStartX = event.pageX || event.touches[0].pageX;
            swipeableCards.touchStartY = event.pageY || event.touches[0].pageY;
			addListenerMulti(event.target,"mousemove touchmove", elementMove);
		}
		if ( event.type === 'touchend' || event.type === 'mouseup' ) {
            //swipeableCards.touchEndX = event.changedTouches[0].screenX;
           // swipeableCards.touchEndY = event.changedTouches[0].screenY;
			//callback
			swipeableCards.isHeld = false;
			swipeableCards.animating = false;
			
			if (swipeableCards.pullDeltaX >= 100) {
				swipeableCards.interval = setInterval(animate, 10);
				swipeableCards.direction = "swipeRight"
			} else if (swipeableCards.pullDeltaX <= -100) {
				swipeableCards.interval = setInterval(animate, 10);
				swipeableCards.direction = "swipeLeft"
			} else if (swipeableCards.pullDeltaY >= 150) {
				if(settings.swipeTop()) {
					//TODO throw out
				} else {
					swipeableCards.pullDeltaX = 0;
					swipeableCards.pullDeltaY = 0;
					swipeableCards.element.style.transform = "initial";
				}
			} else if (swipeableCards.pullDeltaY <= -150) {
				if(settings.swipeTop()) {
					//TODO throw out
				} else {
					swipeableCards.pullDeltaX = 0;
					swipeableCards.pullDeltaY = 0;
					swipeableCards.element.style.transform = "initial";
				}
			} else { 
				swipeableCards.pullDeltaX = 0;
				swipeableCards.pullDeltaY = 0;
				swipeableCards.element.style.transform = "initial";
				swipeableCards.element = null;
			}
			removeListenerMulti(event.target,"mousemove touchmove", elementMove);
		}
		/* On resize
		if ( event.type === 'resize' ) {
			console.log( settings.resizeLog );
		}*/
		//event.stopImmediatePropagation();
	};
	
	var elementMove = function (event) {
		//event.preventDefault()
		if(swipeableCards.isHeld) {
			event.preventDefault();
			event.stopImmediatePropagation();
			if(event.type === "mousemove" || event.type === "touchmove") {
				var x = event.pageX || event.touches[0].pageX;
				var y = event.pageY || event.touches[0].pageY;
				swipeableCards.pullDeltaX = (x - swipeableCards.touchStartX);
				swipeableCards.pullDeltaY = (y - swipeableCards.touchStartY);
				if (!swipeableCards.pullDeltaX) return;
				
				swipeableCards.animating = true;
				var multiplier = Math.abs(Math.min(Math.max(Math.abs(swipeableCards.pullDeltaX) / (swipeableCards.element.offsetWidth / 1.5), 0), 1));
				if(swipeableCards.pullDeltaX >= 0)
				  swipeableCards.deg = 10*multiplier;
				else
				  swipeableCards.deg = -10*multiplier;
			  
				swipeableCards.element.style.transform = "translate3d("+ swipeableCards.pullDeltaX +"px, "+ swipeableCards.pullDeltaY +"px , 0) rotate("+swipeableCards.deg+"deg)";
			}
		} else {
			//removeListenerMulti(event.target,"mousemove touchmove mouseup touchend", elementMove);
		}
		//event.stopImmediatePropagation();
	}
	
	function addListenerMulti(el, s, fn) {
		s.split(' ').forEach(e => el.addEventListener(e, fn, false));
	}
	
	function removeListenerMulti(el, s, fn) {
		s.split(' ').forEach(e => el.removeEventListener(e, fn, false));
	}
	
	var animate = function () {
		//console.log(isInViewport(element));
		if(!isInViewport(swipeableCards.element)){
			clearInterval(swipeableCards.interval);
			swipeableCards.animating = false;
			//console.log(swipeableCards.direction);
			settings[swipeableCards.direction+'Promise']().then(function() {
				console.log("handle");
			}).catch(function() {
				console.log("return");
				swipeableCards.pullDeltaX = 0;
				swipeableCards.pullDeltaY = 0;
				swipeableCards.element.style.transform = "initial";
			});
		} else {
			swipeableCards.animating = true;
			swipeableCards.pullDeltaX = swipeableCards.pullDeltaX * 1.15
			swipeableCards.pullDeltaY = swipeableCards.pullDeltaY * 1.15
			var multiplier = Math.abs(Math.min(Math.max(Math.abs(swipeableCards.pullDeltaX) / (swipeableCards.element.offsetWidth / 1.5), 0), 1));
			if(swipeableCards.pullDeltaX >= 0)
			  swipeableCards.deg = 10*multiplier;
			else
			  swipeableCards.deg = -10*multiplier;
			swipeableCards.element.style.transform = "translate3d("+ swipeableCards.pullDeltaX +"px, "+ swipeableCards.pullDeltaY +"px , 0) rotate("+swipeableCards.deg+"deg)";
		}
	}
	
	var isInViewport = function (elem) {
		var bounding = elem.getBoundingClientRect();
		//console.log(bounding);
		return (
			Math.abs(swipeableCards.pullDeltaY) <= (window.innerHeight || document.documentElement.clientHeight) &&
			Math.abs(swipeableCards.pullDeltaX) <= (window.innerWidth || document.documentElement.clientWidth)
		);
	};

	/**
	 * Destroy the current initialization.
	 * @public
	 */
	swipeableCards.destroy = function () {

		// If plugin isn't already initialized, stop
		if ( !settings ) return;

		// Remove all added classes
		var links = document.querySelectorAll( '[data-swipeable]' );
		for ( var i = 0, len = links.length; i < len; i++  ) {
			links[i].classList.remove( links[i].getAttribute( 'data-swipeable' ) );
		}

		// Remove event listeners
		var el = document.querySelectorAll('[data-swipeable]')
		for (var el of el) {
			removeListenerMulti(el,'mousedown touchstart mouseup touchend', eventHandler);
		}
		//window.removeEventListener('resize', eventHandler, false);

		// Reset variables
		settings = null;

	};

	/**
	 * Initialize Plugin
	 * @public
	 * @param {Object} options User settings
	 */
	swipeableCards.init = function ( options ) {

		// feature test
		if ( !supports ) return;

		// Destroy any existing initializations
		swipeableCards.destroy();

		// Merge user options with defaults
		settings = extend( defaults, options || {} );

		// Listen for click events
		var el = document.querySelectorAll('[data-swipeable]')
		for (var el of el) {
			// mousemove touchmove mouseup touchend
			addListenerMulti(el,'mousedown touchstart mouseup touchend', eventHandler);
		}
		//window.addEventListener('resize', eventHandler, false);

	};


	//
	// Public APIs
	//

	return swipeableCards;

});