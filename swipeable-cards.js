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
        cardboard: '',
        noSwipingClass: '',
        addSwipingClass: '',
        threshold: 1,
		swipeRight: function (element, resolve, reject) { reject() },
		swipeRightPromise: function() { return new Promise(function (resolve, reject) { settings.swipeRight(swipeableCards.element, resolve,reject)})},
		swipeLeft: function (element, resolve, reject) { reject() },
		swipeLeftPromise: function() { return new Promise(function (resolve, reject) { settings.swipeLeft(swipeableCards.element, resolve,reject)})},
		swipeTop: function () { return false },
		swipeBottom: function () { return false },
        renderItem(item) {
            return `
                <li>
                    <div class="item-content">
                      <div class="item-inner">
                        <div class="item-title">${item}</div>
                      </div>
                    </div>
                </li>
            `.trim();
        },
	};

	/**
	 * Extend settings with params
	 */
	
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
	 * Check wether the element is within Viewport
	 * @private
	 * @param {DOMNode} element
	 */
    
	var isInViewport = function (el) {
        var rect = el.getBoundingClientRect();

        return rect.bottom > 0 &&
            rect.right > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */ &&
            rect.top < (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */;
	};
    
	/**
	 * Add specific CSS class to element
	 * @private
	 * @param {DOMNode} element
     * @param {String} selector
	 */

    var addClass = function (element, classname) {
        var cn = element.className;
        //test for existance
        if( cn.indexOf( classname ) != -1 ) {
            return;
        }
        //add a space if the element already has class
        if( cn != '' ) {
            classname = ' '+classname;
        }
        element.className = cn+classname;
    }
    
    var removeClass = function (element, classname) {
        const classes = classname.split(' ');
        if(classes.length > 0) {
            for (var i = 0; i < classes.length; i++) {
                if (element.classList.contains(classes[i])) {
                    element.classList.remove(classes[i]);
                }
            }
        }
    }
	
	/**
	 * Add Multiple Event Listners
	 * @private
	 * @param {DOMNode} element
     * @param {String} selector
     * @param {function} function
	 */
    
	function addListenerMulti(el, s, fn, opt = {passive:true}) {
		s.split(' ').forEach(e => el.addEventListener(e, fn, opt));
	}
	
	/**
	 * Remove Multiple Event Listners
	 * @private
	 * @param {DOMNode} element
     * @param {String} selector
     * @param {function} function
	 */
    
	function removeListenerMulti(el, s, fn) {
		s.split(' ').forEach(e => el.removeEventListener(e, fn));
	}
	
	/**
	 * Search through DOM for Parent with selector
	 * @private
	 * @param {DOMNode} element
     * @param {String} selector
	 */
    
	function findParent (el, sel) {
		while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el,sel)));
		return el;
	}
    
    function selectorMatches(el, selector) {
        var p = Element.prototype;
        var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
            return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
        };
        return f.call(el, selector);
    }

	/**
	 * Handle Events
	 * @private
     * @param {object} event
	 */
    
    var onGrab = function (event) {
        //console.log("grab")
        if(event.target.matches('.swipeable'))
            swipeableCards.element = event.target;
        else 
            swipeableCards.element = findParent(event.target,'.swipeable');
        if(swipeableCards.element) {
            //swipeableCards.element = event.target;
            if (settings.noSwipingClass.split(' ').some(className => swipeableCards.element.classList.contains(className))) {
                return
            }
            if(swipeableCards.element.matches(settings.noSwipingClass))
                return
            
            if(swipeableCards.animating) return;
            if(event.which && event.which != 1) return;
            //console.log("onGrab:" + event.type)
            
            swipeableCards.touchStartX = event.pageX || event.touches[0].pageX;
            swipeableCards.touchStartY = event.pageY || event.touches[0].pageY;
            
            addListenerMulti(swipeableCards.element,"mousemove touchmove", onMove, {passive:false});
            addListenerMulti(swipeableCards.element,"mouseup touchend touchcancel click", onRelease, {passive:false});
        }
    }
    
	/**
	 * Move Element
	 * @private
     * @param {object} event
	 */
    
    var onMove = function (event) {
        if(event.target.matches('.swipeable'))
            swipeableCards.element = event.target;
        else 
            swipeableCards.element = findParent(event.target,'.swipeable');
        
        
        var x = event.pageX || event.touches[0].pageX;
        var y = event.pageY || event.touches[0].pageY;
        swipeableCards.pullDeltaX = (x - swipeableCards.touchStartX);
        swipeableCards.pullDeltaY = (y - swipeableCards.touchStartY);
        if (!swipeableCards.pullDeltaX && !swipeableCards.pullDeltaY) return; 
        if(Math.abs(swipeableCards.pullDeltaX) <= settings.threshold) return;
        addClass(swipeableCards.element, settings.addSwipingClass);
        
        swipeableCards.animating = true;
        
        var multiplier = Math.abs(Math.min(Math.max(Math.abs(swipeableCards.pullDeltaX) / (swipeableCards.element.offsetWidth / 1.5), 0), 1));
        if(swipeableCards.pullDeltaX >= 0) {
            swipeableCards.deg = 10*multiplier;
            if(swipeableCards.element.querySelector('.swipeable-action.right'))
                swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = Math.abs(swipeableCards.pullDeltaX)/100;
            
            if(swipeableCards.element.querySelector('.swipeable-action.left'))
                swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = 0;
        } else {
            swipeableCards.deg = -10*multiplier;
            
            if(swipeableCards.element.querySelector('.swipeable-action.left'))
                swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = Math.abs(swipeableCards.pullDeltaX)/100;
            
            if(swipeableCards.element.querySelector('.swipeable-action.right'))
                swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = 0;
        }
        
        swipeableCards.element.style.transform = "translate3d("+ swipeableCards.pullDeltaX +"px, "+ swipeableCards.pullDeltaY +"px , 1000px) rotate("+swipeableCards.deg+"deg)";
        swipeableCards.element.style.transitionTimingFunction = "ease";
        swipeableCards.element.style.transitionDuration = "0s";
    }
    
    /**
	 * Release Element
	 * @private
     * @param {object} event
	 */
    
    var onRelease = function (event) {
        //console.log("onRelease:" + event.type)
        if(event.type == 'click') {
            if(swipeableCards.animating) {
                event.stopPropagation();
                return
            }
        }
        if(event.target.matches('.swipeable'))
            swipeableCards.element = event.target;
        else 
            swipeableCards.element = findParent(event.target,'.swipeable');
        
        if(event.target && swipeableCards.element) {
            removeListenerMulti(event.target,"mousemove touchmove", onMove);
            removeListenerMulti(event.target,"mouseend touchend touchcancel", onRelease);
            
            if (!swipeableCards.animating) return;
            if (!swipeableCards.pullDeltaX && !swipeableCards.pullDeltaY) return;
            if((Math.abs(swipeableCards.pullDeltaX) < settings.threshold || Math.abs(swipeableCards.pullDeltaY) < settings.threshold) && !swipeableCards.animating) {
                removeListenerMulti(event.target,"mousemove touchmove", onMove);
                return
            }
            
            if(event.type == "click") return;
            swipeableCards.animating = false;
            
            event.preventDefault();
            if (swipeableCards.pullDeltaX >= 100) {
                swipeableCards.direction = "swipeRight"
                swipeableCards.interval = setInterval(animate, 1);
            } else if (swipeableCards.pullDeltaX <= -100) {
                swipeableCards.direction = "swipeLeft"
                console.log(swipeableCards)
                swipeableCards.interval = setInterval(animate, 1);
            } else if (swipeableCards.pullDeltaY >= 150) {
                swipeableCards.element.style.transform = "";
                swipeableCards.element.style.transitionDuration = "";
                var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
            } else if (swipeableCards.pullDeltaY <= -150) {
                swipeableCards.element.style.transform = "";
                swipeableCards.element.style.transitionDuration = "";
                var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
            } else {
                swipeableCards.element.style.transform = "";
                swipeableCards.element.style.transitionDuration = "";
                var actionElement = swipeableCards.element.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
                //setTimeout(removeClass(swipeableCards.element, settings.addSwipingClass), 3000)
                async function f(el,t) {
                    let promise = new Promise((resolve, reject) => {
                        setTimeout(() => resolve(removeClass(el, settings.addSwipingClass)), t)
                    });
                    let result = await promise; // wait until the promise resolves (*)
                    //removeClass(swipeableCards.element, settings.addSwipingClass)
                }
                f(swipeableCards.element,500);
                swipeableCards.element = null;
            }
            
            //swipeableCards.pullDeltaX = null;
            //swipeableCards.pullDeltaY = null;
        }
    }
	
	/**
	 * Animate Element
	 * @private
	 */
    
	var animate = function () {
		if(!isInViewport(swipeableCards.element)){
			clearInterval(swipeableCards.interval);
			swipeableCards.animating = false;
            
            swipeableCards.pullDeltaX = 0;
            swipeableCards.pullDeltaY = 0;
            
            var removedElementParent = swipeableCards.element.parentNode;
            var removedElement = swipeableCards.element.parentNode.removeChild(swipeableCards.element);
            
			settings[swipeableCards.direction+'Promise']().then(function() {
                //TODO: Call costum Function
                
			}).catch(function() {
                swipeableCards.element = removedElementParent.prepend(removedElement);
                removedElement.style.transform = "";
                removedElement.style.transition = ""; 

                var actionElement = removedElement.querySelectorAll('.swipeable-action')
                for (var i = 0; i < actionElement.length; ++i) {
                    actionElement[i].style.opacity = 0;
                }
                async function f(el,t) {
                    let promise = new Promise((resolve, reject) => {
                        setTimeout(() => resolve(removeClass(el, settings.addSwipingClass)), t)
                    });
                    let result = await promise; // wait until the promise resolves (*)
                    //removeClass(swipeableCards.element, settings.addSwipingClass)
                }
                f(removedElement,500);
                swipeableCards.element = null;
			});
		} else {
			swipeableCards.animating = true;
			swipeableCards.pullDeltaX = swipeableCards.pullDeltaX * 1.15
			swipeableCards.pullDeltaY = swipeableCards.pullDeltaY * 1.15
			var multiplier = Math.abs(Math.min(Math.max(Math.abs(swipeableCards.pullDeltaX) / (swipeableCards.element.offsetWidth / 1.5), 0), 1));
            if(swipeableCards.pullDeltaX >= 0) {
                swipeableCards.deg = 10*multiplier;
                if(swipeableCards.element.querySelector('.swipeable-action.left')) {
                    swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = 1;
                    swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = 0;
                }
            } else {
                swipeableCards.deg = -10*multiplier;
                if(swipeableCards.element.querySelector('.swipeable-action.left')) {
                    swipeableCards.element.querySelector('.swipeable-action.left').style.opacity = 1;
                    swipeableCards.element.querySelector('.swipeable-action.right').style.opacity = 0;
                }
            }
            swipeableCards.element.style.transform = "translate3d("+ swipeableCards.pullDeltaX +"px, "+ swipeableCards.pullDeltaY +"px , 0) rotate("+swipeableCards.deg+"deg)";
            swipeableCards.element.style.transitionDuration = "0s";
        }
	}

	/**
	 * Destroy the current initialization.
	 * @public
	 */
    
	swipeableCards.destroy = function () {

		if ( !settings ) return;
        
		var links = document.querySelectorAll( '[data-swipeable]' );
		for ( var i = 0, len = links.length; i < len; i++  ) {
			links[i].classList.remove( links[i].getAttribute( 'data-swipeable' ) );
		}
        
		//var el = document.querySelectorAll('[data-swipeable]')
		//for (var el of el) {
		//	removeListenerMulti(document,'mousedown touchstart mouseup touchend', eventHandler);
		//}
        removeListenerMulti(document,'mousedown mouseup touchstart touchend touchcancel', onGrab);
		//window.removeEventListener('resize', eventHandler, false);

		settings = null;
	};

	/**
	 * Method to initiate Right Swipe
	 * @public
	 * @param {DOMNode} element
	 */
    
	swipeableCards.swipeRight = function(element) {
        swipeableCards.element = element;
        swipeableCards.direction = "swipeRight"
        swipeableCards.pullDeltaX = 0.5;
        swipeableCards.pullDeltaY = 0;
        swipeableCards.interval = setInterval(animate, 1);
    };

	/**
	 * Method to initiate Left Swipe
	 * @public
	 * @param {DOMNode} element
	 */
    
	swipeableCards.swipeLeft = function(element) {
        swipeableCards.element = element;
        swipeableCards.direction = "swipeLeft"
        swipeableCards.pullDeltaX = -0.5;
        swipeableCards.pullDeltaY = 0;
        swipeableCards.interval = setInterval(animate, 1);
    };
    
	/**
	 * Method to initiate Left Swipe
	 * @public
	 * @param {DOMNode} element
	 */
    
	swipeableCards.update = function() {
        console.log(swipeableCards)
    };
    
	/**
	 * Initialize Plugin
	 * @public
	 * @param {Object} options User settings
	 */
    
	swipeableCards.init = function ( options ) {
        
		if ( !supports ) return;

		swipeableCards.destroy();
		settings = extend( defaults, options || {} );
        addListenerMulti(document,'mousedown touchstart', onGrab, {passive:true});
		//window.addEventListener('resize', eventHandler, false);
        return swipeableCards;
	};

	return swipeableCards;

});