# swipeableCards
A simple Javascript Plugin for Tinder-like Swipeing

## Screenshot

<a href="https://raw.githubusercontent.com/elzahaby/swipeableCards/master/screen.mp4"><video width="320" height="240" controls>
<source src="https://raw.githubusercontent.com/elzahaby/swipeableCards/master/screen.mp4"  type="video/mp4">
</video></a>


## HOW IT WORKS

1. Add  data-swipeable="true" to the element you would like to swipe around.

2. Initiate the plugin:

				swipeableCards.init({
					swipeLeft: function(element, resolve,reject) {
						console.log("left");
						reject();
					},
					swipeRight: function (element, resolve,reject) {
						console.log("right");
						reject();
					}
				})
        
swipeLeft & swipeRight functions can be used with an Ajax Request.
within those functions if you call:
resolve() -> The Element will be destroied from DOM
reject() -> The Element thrown back

Have fun! 

This is my first plugin like that, i hope you like it an contribute to it! its really basic!
