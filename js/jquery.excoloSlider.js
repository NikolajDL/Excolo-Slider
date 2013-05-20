/*!
 * Excolo Slider - A simple jquery slider
 *
 * Examples and documentation at: 
 * http://excolo.github.io/Excolo-Slider/
 *
 * Author: Nikolaj Dam Larsen
 * Version: 0.1.0 (19-MAY-2013)
 *
 * Released under the MIT license
 * https://github.com/Excolo/ExcoloSlider/blob/master/MIT-License.txt
 */
;(function ($, window, document, undefined) {
    var version = "0.1.2";
    var pluginName = "excoloSlider";


    /* Plugin Definition
    **************************************************************/
    var Plugin = (function () {
        function Plugin(elem, options) {
            this.elem = elem;
            this.$elem = $(elem);
            this.options = options;

            // This next line takes advantage of HTML5 data attributes
            // to support customization of the plugin on a per-element
            // basis. For example,
            // <div class='sliderA' data-plugin-options='{"navigation":"false"}'></div>
            this.metadata = this.$elem.data('plugin-options');
        }
        return Plugin;
    })();

    /* Plugin prototype
    **************************************************************/
    Plugin.prototype = {

        /* Default Configuration
        **********************************************************/
        defaults: {
            width: 800, // 580
            height: 530,    // 380
            autoSize: true,
            keyboardNav: true,
            touchNav: true,
            startSlide: 1,
            autoPlay: true,
            delay: 0,
            interval: 3000,
            repeat: true,
            playReverse: false,
            hoverPause: true,
            animationCssTransitions: true,
            animationDuration: 500,
            animationTimingFunction: "linear",
            activeSlideClass: "es-active"
//            debug: true,
        },

        /* Initialization function
        **********************************************************/
        init: function () {
            // Defined variable to avoid scope problems
            var base = this;
            // Introduce defaults that can be extended either globally or using an object literal. 
            base.config = $.extend({}, base.defaults, base.options, base.metadata);

//this._log("begin initialization");

            // Initialize plugin data
            base.data = $.data(base);
            $.data(base, "currentSlide", base.config.playReverse && base.config.startSlide == 1 ? base.$elem.children().length-1 : base.config.startSlide - 1);
            $.data(base, "nextSlide", base.data.currentSlide);
            $.data(base, "totalslides", base.$elem.children().length);
            $.data(base, "browserEnginePrefix", base._getBrowserEnginePrefix());
            $.data(base, "isPlaying", false);
            $.data(base, "isAnimating", false);
            $.data(base, "playPaused", false);
            $.data(base, "justTouched", false);
            $.data(base, "width", base.config.width);
            if (typeof TouchEvent !== "undefined") $.data(this, "touchEnabled", true);

            // Create helper html objects
			base.$elem.css({ position: "relative" });
            base.$elem.wrapInner("<div class='slide-wrapper'>", base.$elem).children();
            base.$elem.wrapInner("<div class='slide-container'>", $(".slide-wrapper", base.$elem)).children();

            // Add css styles
            $(".slide-wrapper", base.$elem).children().addClass("slide").css({
                position: "absolute",
                top: 0,
                left: 0,
                width: base.data.width,
                height: base.config.height,
                zIndex: 0,
                display: "none",
                webkitBackfaceVisibility: "hidden"
            });

            // Set the height of the wrapper to fit the max height of the slides
            var maxHeight = $(".slide-wrapper", base.$elem).children().height();
            $(".slide-wrapper", base.$elem).css({
                position: "relative",
                left: 0,
                height: maxHeight
            });
            $(".slide-container", base.$elem).css({
                width: base.data.width,
                overflow: "hidden",
                height: maxHeight
            });

            // Setup touch event handlers
            if (base.config.touchNav && base.data.touchEnabled) {
                $(".slide-wrapper", base.$elem).on("touchstart", function (e) {
                    return base._onTouchStart(e);
                });
                $(".slide-wrapper", base.$elem).on("touchmove", function (e) {
                    return base._onTouchMove(e);
                });
                $(".slide-wrapper", base.$elem).on("touchend", function (e) {
                    return base._onTouchEnd(e);
                });
            }

            // ###################### TODO: Setup mouse event handlers (reuse touch handlers) ######################

            // Setup keyboard event handler
            if (base.config.keyboardNav) {
                $(window).keydown(function (e) {
                    return base._onKeyboardNav(e);
                });
            }

            // Auto-size before preparing slides
            if (base.config.autoSize)
            {
                setTimeout(function () { base._resize(); }, 50)
                // Setup resize event handler
                $(window).resize(function () {
                    // The timeout is to let other resize events finish
                    // e.g. if using adapt.js
                    // This will make it flicker momentarily when resizing
                    // large widths
                    return setTimeout(function () { base._resize(); }, 50);
                });
            }

            // Well, the name of the function says it all
            base._prepareslides();

            // Go to the start slide
            base.gotoSlide(base.data.currentSlide);

            // Autoplay if so inclined
            if (base.config.autoPlay)
            {
                // Setup delay, if any
                setTimeout(function () {
                    base.start();
                }, base.config.delay);
            }          

//this._log("end initialization");
            return this;
        },

        /* Move to previous slide
        **********************************************************/
        previous: function () {
//this._log("move to previous slide");

            // Defined variable to avoid scope problems
            var base = this;

            // Store slide direction in plugin data
            $.data(base, "slideDirection", "previous");

            // Find next index
            var nextSlide = (base.data.nextSlide - 1) % base.data.totalslides;

            // Stop here if we've reached past the beginning and aren't on repeat 
            if (!base.config.repeat && (base.data.nextSlide - 1) < 0)
            {
                if (base.config.playReverse){
                    // Stop playing
                    $.data(base, "playPaused", true);
                    base.stop();
                }
                return;
            } else if (base.data.playPaused && (base.data.nextSlide - 1) > 0) {
                $.data(base, "playPaused", false);
                base.start();
            }

            // Update data
            $.data(base, "nextSlide", nextSlide);

            // Perform sliding to the previous slide
            return this._slide();
        },

        /* Move to next slide
        **********************************************************/
        next: function () {
//this._log("move to next slide");
            // Defined variable to avoid scope problems
            var base = this;

            // Store slide direction in plugin data
            $.data(base, "slideDirection", "next");
            
            // Find next index
            var nextSlide = (base.data.nextSlide + 1) % base.data.totalslides;

            // Stop here if we've reached past the end and aren't on repeat 
            if (!base.config.repeat && (base.data.nextSlide + 1) > (base.data.totalslides - 1)) {
                if (!base.config.playReverse) {
                    // Stop playing
                    $.data(base, "playPaused", true);
                    base.stop();
                }
                return;
            } else if (base.data.playPaused && (base.data.nextSlide + 1) < (base.data.totalslides - 1)) {
                $.data(base, "playPaused", false);
                base.start();
            }

            // Update data
            $.data(base, "nextSlide", nextSlide);

            // Perform sliding to the next slide
            return this._slide();
        },

        /* A method to start the slideshow
        **********************************************************/
        start: function () {
//this._log("start slideshow");
            // Defined variable to avoid scope problems
            var base = this;

            // Jquery objects
            var $preContainer = $(".slide-container", base.$elem);

            // If we're already playing, clear previous interval
            if (base.data.isPlaying && base.data.playTimer)
                clearInterval(base.data.playTimer);

            // Setup the play timer
            var timer = setInterval((function () {

                // Well slide already
                if (base.config.playReverse)
                    base.previous();
                else
                    base.next();
                
            }), base.config.interval)
            // Store the timer for reference
            $.data(base, "playTimer", timer);

            // Setup pause when mouse hover
            if (base.config.hoverPause) {
                $preContainer.unbind();
                $preContainer.bind("mouseenter", function () {
                    $.data(base, "playPaused", true);
                    return base.stop();
                });
                $preContainer.bind("mouseleave", function () {
                    $.data(base, "playPaused", false);
                     return base.start();
                });
            }

            // Woo we're playing
            $.data(base, "isPlaying", true);
        },

        /* A method to stop playing the slideshow
        **********************************************************/
        stop: function () {
//this._log("stop slideshow");
            // Defined variable to avoid scope problems
            var base = this;

            // Jquery objects
            var $preContainer = $(".slide-container", base.$elem);

            // Stop the interval timer
            clearInterval(base.data.playTimer);
            $.data(base, "playTimer", null);

            // If stop was called but and it wasn't due to a pause, 
            // unbind container events
            if (base.config.hoverPause && !base.data.playPaused)
                $preContainer.unbind();
            

            // We've stopped
            $.data(base, "isPlaying", false);
        },

        /* Simply jump to a given slide without transistion
        **********************************************************/
        gotoSlide: function (slideIndex) {
 //this._log("gotoSlide: Slide with index: " + slideIndex);
            // Define variable to avoid scope problems
            var base = this;

            // Data
            $.data(base, "nextSlide", (slideIndex) % base.data.totalslides);
            var nextSlideIndex = (slideIndex) % base.data.totalslides;
            $.data(base, "currentSlide", nextSlideIndex);

            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);
            var $slides = $container.children();
            var $slide = $container.children(":eq(" + nextSlideIndex + ")");

            // Get position of goal slide
            var leftPos = $slide.position().left;

            // Clear old active class
            $slides.removeClass(base.config.activeSlideClass);
            // Set new active class
            $slide.addClass(base.config.activeSlideClass);

            // Gogogo
            if (base.config.animationCssTransitions && base.data.browserEnginePrefix) {
                base._transition((-leftPos), 0);
            } else {
                $container.position().left = -leftPos;
            }

            // Align the slides to prepare for next transition
            base._alignSlides(leftPos);
        },

        /* User interacted, if we're playing, we must restart
        **********************************************************/
        _manualInterference: function () {
            // Define variable to avoid scope problems
            var base = this;

            if (base.data.isPlaying)
            {
                // Stop and start, to restart the timer from the beginning.
                base.stop();
                base.start();
            }
        },

        /* Position and align the slides to prepare for sliding
        **********************************************************/
        _prepareslides: function () {

            // Define variable to avoid scope problems
            var base = this;

            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);
            var $slides = $container.children();

            // Config
            var width = base.data.width;

            var half = Math.floor(base.data.totalslides / 2);
            var i = 0;
            $slides.each(function () {
                // Move first half the slides ahead
                $(this).css({
                    display: "block",
                    left: width * i,
                    zIndex: 10
                });
                i++;

                // Move the other half back in line
                if (base.config.repeat && i > half) 
                    i = base.data.totalslides % 2 ? -half : -(half - 1);
            });
        },

        /* Handler for keyboard events
        **********************************************************/
        _onKeyboardNav: function (e) {
            // Define variable to avoid scope problems
            var base = this;

            var key = e.which;
            switch (key) {
                case 37:
                    base.previous();
                    base._manualInterference();
                    break;
                case 39:
                    base.next();
                    base._manualInterference();
                    break;
            }
            e.preventDefault();
        },

        /* Handling the initial touch
        **********************************************************/
        _onTouchStart: function (e) {
            // Define variable to avoid scope problems
            var base = this;

            // Grab eventdata
            var eventData = e.originalEvent.touches[0];
            // Get the browser engine prefix - if any
            var prefix = base.data.browserEnginePrefix.css;

            // Setup touchrelated data
            $.data(base, "touchTime", Number(new Date()));
            $.data(base, "touchedX", eventData.pageX);
            $.data(base, "touchedY", eventData.pageY);

//this._log("_onTouchStart: touching stuff at ("+base.data.touchedX+","+base.data.touchedY+")");

            // Stop playing 
            if (base.data.isPlaying)
            {
                $.data(base, "playPaused", true);
                base.stop();
            }

            return e.stopPropagation();
        },

        /* Handling the touch movement
        **********************************************************/
        _onTouchMove: function (e) {
            // Define variable to avoid scope problems
            var base = this;

            // Grab eventdata
            var eventData = e.originalEvent.touches[0];

            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);

            // Verify whether we're scrolling or sliding
            $.data(base, "scrolling", Math.abs(eventData.pageX - base.data.touchedX) < Math.abs(eventData.pageY - base.data.touchedY));


            // If we're not scrolling, we perform the translation
            // ...also - wait for any animation to finish
            // (we cant slide while animating)
            if (!base.data.scrolling && !base.data.isAnimating)
            {
                e.preventDefault();

                // Get the position of the slide we are heading for
                var $slide = $container.children(":eq(" + base.data.nextSlide + ")");
                var leftPos = $slide.position().left;

                // Get the browser engine prefix - if any
                var prefix = base.data.browserEnginePrefix.css;

                // Get the delta movement to use for translation
                var translateX = eventData.pageX - base.data.touchedX;

                // Limit if not repeating
                var limit = base.data.width * 0.1;
                if (!base.config.repeat)
                {
                    if (base.data.currentSlide <= 0 && -translateX < -limit)
                        translateX = limit;
                    else if (base.data.currentSlide >= (base.data.totalslides - 1) && -translateX > limit)
                        translateX = -limit;
                }

                // Transformation
                base._transition(-leftPos + translateX, 0);
            }

            return e.stopPropagation();
        },

        /* Handling the end of the touch
        **********************************************************/
        _onTouchEnd: function (e) {
//this._log("_onTouchEnd: stopped touching stuff");
            // Define variable to avoid scope problems
            var base = this;

            // Grab eventdata
            var eventData = e.originalEvent.touches[0];

            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);

            // Set that we've just touched something such that when we slide next
            // the sliding duration is temporary halved.
            $.data(base, "justTouched", true);

            // Get the position of the slide we are heading for
            var $slide = $container.children(":eq(" + base.data.nextSlide + ")");
            var leftPos = $slide.position().left;

            // If we've slided at least half the width of the slide - slide to next
            // Also if we've slided 10% of the width within 1/4 of a second, 
            // we slide to the next
            var half = base.data.width * 0.5;
            var tenth = base.data.width * 0.1;
            var svipe = (Number(new Date()) - base.data.touchTime < 250);

            if (!base.config.repeat
                && ($container.position().left < -(leftPos) && base.data.currentSlide >= (base.data.totalslides - 1)
                    || $container.position().left > (-leftPos) && base.data.currentSlide <= 0)) {
                // We can't move move as repeat is turned off
                base._transition((-leftPos), 0.15);
            }
            else if ($container.position().left > (-leftPos + half)
                || ($container.position().left > (-leftPos + tenth)  && svipe)) {
                this.previous();
            } else if ($container.position().left < -(leftPos + half)
                || ($container.position().left < -(leftPos + tenth)  && svipe)) {
                this.next();
            } else {
                // Didn't slide enough to move on - bounce back into place.
                base._transition((-leftPos), 0.15);
            }

            // Align the slides to prepare for the next slide
            base._alignSlides(leftPos);

            // Restart playing playing 
            if(base.data.playPaused)
                base.start();

            return e.stopPropagation();
        },

        /* Make an "endless" line of slides
        **********************************************************/
        // ISSUE:   Too slow slide duration and too fast sliding  
        //          may result in the slides not being aligned yet.
        // SOLUTION:...might be to duplicate all slides in init
        //          if number of slides is low. 
        _alignSlides : function(goalPosition)
        {
            // Define variable to avoid scope problems
            var base = this;

            if (!base.config.repeat)
                return;

            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);
            var $slides = $container.children();

            // Retrieve goalPosition if undefined
            if (goalPosition === undefined)
            {
                var $slide = $container.children(":eq(" + base.data.nextSlide + ")");
                goalPosition = $slide.position().left;
            }

            // Remove fraction
            goalPosition = Math.round(goalPosition,0);


            // Half of the total slides
            var half = Math.ceil(base.data.totalslides / 2);

            // Config
            var width = base.data.width;

            // Get number of $slides after/before 'goalPosition' - this is our buffer.
            // If our buffer is below half the total $slides, we need to increase it.
            var bufferLength = 0;
            $slides.each(function () {
                var l = $(this).position().left;
                if (l > goalPosition - width)
                    bufferLength++;
            });
            // Calculate how much short on buffer we are
            var bufferShortage = half - bufferLength;

            // We're sliding the other direction thus moving a buffer to the other side
            if (bufferShortage < 0)
                bufferShortage = base.data.totalslides % 2 == 0 ? bufferShortage + 1 : bufferShortage;

//base._log("_alignSlide - GoalPosition: " + goalPosition + " | Total: " + base.data.totalslides + " | Half: " + half + " | Buffer: " + bufferLength + " | BufferShort: " + bufferShortage);

            // Align slides according to bufferShortage
            for (var i = 0; i < Math.abs(bufferShortage); i++) {

                // Find the element with the lowest left position
                var lowest = [].reduce.call($slides, function (sml, cur) {
                    return $(sml).offset().left < $(cur).offset().left ? sml : cur;
                });
                // Find the element with the highest left position
                var highest = [].reduce.call($slides, function (sml, cur) {
                    return $(sml).offset().left > $(cur).offset().left ? sml : cur;
                });
//base._log("_alignSlide - Low: " + $(lowest).offset().left + " | Hi: " + $(highest).offset().left);

                if(bufferShortage > 0)
                    $(lowest).css("left", Math.round($(highest).position().left + width));
                else
                    $(highest).css("left", Math.round($(lowest).position().left - width));
                    
            }

        },

        /* Perform a slide
        **********************************************************/
        _slide: function () {
            // Define variable to avoid scope problems
            var base = this;

            // Data
            var nextSlideIndex = base.data.nextSlide;
            var currentSlideIndex = base.data.currentSlide;


//base._log("_slide: From: " + currentSlideIndex + " | To: " + nextSlideIndex);

            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);
            var $slides = $container.children();
            var $slide = $container.children(":eq(" + nextSlideIndex + ")");
            var $currentSlide = $container.children(":eq(" + currentSlideIndex + ")");

            // Style variables
            var activeSlideClass = base.config.activeSlideClass;
            var width = base.data.width;

            // Get position of current slide
            var currentPos = Math.round($currentSlide.position().left);
            // Get the position of the slide we are heading for
            var leftPos = Math.round($slide.position().left);

//base._log("_slide: CurrentPos: " + currentPos + " | GoalPos: " + leftPos);

            // ---

            // Clear old active class
            $slides.removeClass(activeSlideClass);
            // Set new active class
            $slide.addClass(activeSlideClass);

            // ---

            // Align the slides in a line to prepare for the transition animation
            base._alignSlides(leftPos);

            // Animate - css transitions are much better.
            $.data(base, "isAnimating", true);
            if (base.config.animationCssTransitions && base.data.browserEnginePrefix) {
                
                base._transition((-leftPos), (base.data.justTouched ? 0.5 : 1));

                // Set nextslide on end of transition
                $container.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function () {
                    $.data(base, "currentSlide", nextSlideIndex);
                    $.data(base, "isAnimating", false);
                    $.data(base, "justTouched", false);

                    // Align the slides in a line to prepare for the transition animation
                    $container.unbind("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd");
                });
            } else {
                // We must resolve to sucky animations
                $container.stop().animate({ left: -leftPos }, base.config.animationDuration, function () {
                    $.data(base, "currentSlide", nextSlideIndex);
                    $.data(base, "isAnimating", false);
                    $.data(base, "justTouched", false);
                });
            }

        },

        /* Perform the transition
        **********************************************************/
        _transition: function (leftPos, durationModifier)
        {
            // Define variable to avoid scope problems
            var base = this;
            // Jquery objects
            var $container = $(".slide-wrapper", base.$elem);

            // Limit duration modifier
            if (durationModifier === undefined || durationModifier < 0)
                durationModifier = 1;

            // NOTE:    We add both prefixed transition and the default
            //          for browser compatibility.

            // Select the css code based on browser engine
            var prefix = base.data.browserEnginePrefix.css;
            var transform = prefix + "Transform";
            var duration = prefix + "TransitionDuration";
            var timing = prefix + "TransitionTimingFunction";
            /* ^ Hopefully this will be minimized better than having a lot of other stuff  */

            // Set style to activate the slide transition
            $container[0].style[transform] = "translateX(" + leftPos + "px)";
            $container[0].style[duration] = (base.config.animationDuration * durationModifier) + "ms";
            $container[0].style[timing] = base.config.animationTimingFunction;
        },

        /* Auto-size the slider
        **********************************************************/
        _resize: function () {
            // Define variable to avoid scope problems
            var base = this;
            
            // Stop playing
            if (base.data.isPlaying){
                $.data(base, "playPaused", true);
                base.stop();
            }

            // Getting width from parent container
            var newwidth = base.$elem.width();
            // Calculate W/H ratio
            var ratio = base.config.height / base.config.width;
            // Get height from W/H ratio
            var newheight = newwidth * ratio;

            // Update width
            $.data(base, "width", newwidth);

            // Add css styles
            $(".slide", base.$elem).css({
                width: newwidth,
                height: newheight
            });

            // Set the height of the wrapper to fit the max height of the slides
            var maxHeight = $(".slide-wrapper", base.$elem).children().height();
            $(".slide-wrapper", base.$elem).css({
                height: maxHeight
            });
            $(".slide-container", base.$elem).css({
                width: newwidth,
                height: maxHeight
            });

            // Restart playing
            if (base.data.playPaused){
                $.data(base, "playPaused", false);
                base.start();
            }

            // Realign now to make it look good.
            base._prepareslides();
            base.gotoSlide(base.data.currentSlide);
        },

        /* Find out which browser engine is used
        **********************************************************/
        _getBrowserEnginePrefix: function () {
            var transition = "Transition";
            var vendor = ["Moz", "Webkit", "Khtml", "O", "ms"];
            var i = 0;
            while (i < vendor.length) {
                if (typeof document.body.style[vendor[i] + transition] === "string") {
                    return { css: vendor[i] };
                }
                i++;
            }
            return false;
        }

        /* Debug function
        *********************************************************
        _log: function (message) {
            // Only log if in debug mode
            if (this.config.debug)
                console.log(pluginName + ": " + message);
        },*/
    }   

    Plugin.defaults = Plugin.prototype.defaults;


    /* Add the plugin to the jquery namespace.
    **************************************************************/
    $.fn.excoloSlider = function (options) {
        return this.each(function () {
            // Instantiate and initialize
            new Plugin(this, options).init();
        });
    };
})(jQuery, window, document);
