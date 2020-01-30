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
        swiping: false,
        noSwipingClass: '',
        threshold: 1,
		swipeRight: function (element, resolve, reject) { reject() },
		swipeRightPromise: function() { return new Promise(function (resolve, reject) { settings.swipeRight(swipeableCards.element, resolve,reject)})},
		swipeLeft: function (element, resolve, reject) { reject() },
		swipeLeftPromise: function() { return new Promise(function (resolve, reject) { settings.swipeLeft(swipeableCards.element, resolve,reject)})},
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
			/*
			if ( toggle.tagName.toLowerCase() === 'a') {
				event.preventDefault();
			}*/

			// Set the [data-click-me] value as a class on the link
			toggle.classList.add( toggle.getAttribute( 'data-swipeable' ) );

		}

	};

	/**
	 * Handle events
	 * @private
	 */
    
    var eventHandler = function (event) {
        swipeableCards.element = findParent(event.target,'.swipeable');
        if(event.target && swipeableCards.element) {
            
            var ignore = false;
            if(settings.noSwipingClass) {
                settings.noSwipingClass.split(' ').forEach(function(value, index) {
                    if(swipeableCards.element.classList.contains(value)) {
                        ignore = true;
                    }
                })
            }
            if(ignore) return
            
            if ( event.type === 'touchstart' || event.type === 'mousedown' ) {
                
                if(swipeableCards.animating) return;
                
                swipeableCards.touchStartX = event.pageX || event.touches[0].pageX;
                swipeableCards.touchStartY = event.pageY || event.touches[0].pageY;

                addListenerMulti(event.target,"mousemove touchmove", elementMove);
                
            }
            if ( event.type === 'touchend' || event.type === 'mouseup' ) {
                swipeableCards.animating = false;
                removeListenerMulti(event.target,"mousemove touchmove", elementMove);
                if (!swipeableCards.pullDeltaX && !swipeableCards.pullDeltaY) return;
                elementRelease();
            }
        }
    }
    
    var elementMove = function (event) {
        var x = event.pageX || event.touches[0].pageX;
        var y = event.pageY || event.touches[0].pageY;
        swipeableCards.pullDeltaX = (x - swipeableCards.touchStartX);
        swipeableCards.pullDeltaY = (y - swipeableCards.touchStartY);
        
        if (!swipeableCards.pullDeltaX && !swipeableCards.pullDeltaY) return;
        if((Math.abs(swipeableCards.pullDeltaX) < settings.threshold || Math.abs(swipeableCards.pullDeltaY) < settings.threshold) && !swipeableCards.animating) {
            return
        }
        
        swipeableCards.animating = true;
        
        var multiplier = Math.abs(Math.min(Math.max(Math.abs(swipeableCards.pullDeltaX) / (swipeableCards.element.offsetWidth / 1.5), 0), 1));
        if(swipeableCards.pullDeltaX >= 0) {
            swipeableCards.deg = 10*multiplier;
            swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = Math.abs(swipeableCards.pullDeltaX)/100;
            swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = 0;
        } else {
            swipeableCards.deg = -10*multiplier;
            swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = Math.abs(swipeableCards.pullDeltaX)/100;
            swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = 0;
        }
        
        swipeableCards.element.style.transform = "translate3d("+ swipeableCards.pullDeltaX +"px, "+ swipeableCards.pullDeltaY +"px , 1px) rotate("+swipeableCards.deg+"deg)";
        swipeableCards.element.style.transitionDuration = "0";
    }
    
    var elementRelease = function (event) {

        if (swipeableCards.pullDeltaX >= 100) {
            swipeableCards.interval = setInterval(animate, 1);
            swipeableCards.direction = "swipeRight"
        } else if (swipeableCards.pullDeltaX <= -100) {
            swipeableCards.interval = setInterval(animate, 1);
            swipeableCards.direction = "swipeLeft"
        } else if (swipeableCards.pullDeltaY >= 150) {
            if(settings.swipeTop()) {
                //TODO throw out
            } else {
                swipeableCards.pullDeltaX = 0;
                swipeableCards.pullDeltaY = 0;
                swipeableCards.element.style.transform = "";
                swipeableCards.element.style.transitionDuration = "";
                var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
            }
        } else if (swipeableCards.pullDeltaY <= -150) {
            if(settings.swipeTop()) {
                //TODO throw out
            } else {
                swipeableCards.pullDeltaX = 0;
                swipeableCards.pullDeltaY = 0;
                swipeableCards.element.style.transform = "";
                swipeableCards.element.style.transitionDuration = "";
                var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
            }
        } else { 
            swipeableCards.pullDeltaX = 0;
            swipeableCards.pullDeltaY = 0;
            //swipeableCards.element.style.transform = "translate3d(0px, 0px , 0) rotate(0deg)";
            //swipeableCards.element.style.transition = "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            swipeableCards.element.style.transform = "";
            swipeableCards.element.style.transitionDuration = "";
            var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
            for (var i = 0; i < actionElement.length; ++i) {
                actionElement[i].style.opacity = 0;
            }
            swipeableCards.element = null;
        }
    }
	
	function addListenerMulti(el, s, fn) {
		s.split(' ').forEach(e => el.addEventListener(e, fn, true));
	}
	
	function removeListenerMulti(el, s, fn) {
		s.split(' ').forEach(e => el.removeEventListener(e, fn, true));
	}
	
	function findParent (el, sel) {
		while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el,sel)));
		return el;
	}
	
	var animate = function () {
		//console.log(isInViewport(element));
		if(!isInViewport(swipeableCards.element)){
			clearInterval(swipeableCards.interval);
			swipeableCards.animating = false;
			//console.log(swipeableCards.direction);
            swipeableCards.pullDeltaX = 0;
            swipeableCards.pullDeltaY = 0;
			settings[swipeableCards.direction+'Promise']().then(function() {
				swipeableCards.element.parentNode.removeChild(swipeableCards.element);
			}).catch(function() {
                swipeableCards.element.style.transform = "";
                swipeableCards.element.style.transition = ""; 

                var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
			});
		} else {
			swipeableCards.animating = true;
			swipeableCards.pullDeltaX = swipeableCards.pullDeltaX * 1.15
			swipeableCards.pullDeltaY = swipeableCards.pullDeltaY * 1.15
			var multiplier = Math.abs(Math.min(Math.max(Math.abs(swipeableCards.pullDeltaX) / (swipeableCards.element.offsetWidth / 1.5), 0), 1));
            if(swipeableCards.pullDeltaX >= 0) {
                swipeableCards.deg = 10*multiplier;
                swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = Math.abs(swipeableCards.pullDeltaX)/100;
                swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = 0;
            } else {
                swipeableCards.deg = -10*multiplier;
                swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = Math.abs(swipeableCards.pullDeltaX)/100;
                swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = 0;
            }
            swipeableCards.element.style.transform = "translate3d("+ swipeableCards.pullDeltaX +"px, "+ swipeableCards.pullDeltaY +"px , 0) rotate("+swipeableCards.deg+"deg)";
            swipeableCards.element.style.transitionDuration = "0";
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
	 * SwipeRight
	 * @public
	 * @param {Object} options User settings
	 */
	swipeableCards.swipeRight = function(element) {
        swipeableCards.element = element;
        swipeableCards.direction = "swipeRight"
        swipeableCards.pullDeltaX = 10;
        swipeableCards.interval = setInterval(animate, 1);
    };
    
	swipeableCards.swipeLeft = function(element) {
        swipeableCards.element = element;
        swipeableCards.direction = "swipeLeft"
        swipeableCards.pullDeltaX = -10;
        swipeableCards.interval = setInterval(animate, 1);
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
		//var el = document.querySelectorAll('[data-swipeable]')
		//for (var el of el) {
			// mousemove touchmove mouseup touchend
			addListenerMulti(document,'mousedown touchstart mouseup touchend', eventHandler);
		//}
		//window.addEventListener('resize', eventHandler, false);
        return swipeableCards;
	};


	//
	// Public APIs
	//

	return swipeableCards;

});