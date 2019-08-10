# swipeableCards
A simple Javascript Plugin for Tinder-like Swipeing


## HOW IT WORKS

1. Add  data-swipeable="true" to the element you would like to swipe around.

2. Initiate the plugin:

				swipeableCards.init({
					swipeLeft: function(resolve,reject) {
						console.log("left");
						reject();
					},
					swipeRight: function (resolve,reject) {
						console.log("right");
						reject();
					}
				})
        
swipeLeft & swipeRight functions can be used with an Ajax Request.

Have fun! 

This is my first plugin like that, i hope you like it an contribute to it! its really basic!
