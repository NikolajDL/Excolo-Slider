/*!
 * Excolo Slider - A simple jquery slider
 *
 * Examples and documentation at: 
 * http://excolo.github.io/Excolo-Slider/
 *
 * Author: Nikolaj Dam Larsen
 * Version: 1.0.5 (30-JUNE-2013)
 *
 * Released under the MIT license
 * https://github.com/Excolo/ExcoloSlider/blob/master/MIT-LICENSE
 */
; (function ($, window, document, undefined) {
    var Plugin;

    /* Plugin Definition
    **************************************************************/
    Plugin = (function () {
        function Plugin(elem, options) {
            this.elem = elem;
            this.$elem = $(elem);
            this.options = options;

            // This next line takes advantage of HTML5 data attributes
            // to support customization of the plugin on a per-element
            // basis. 
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
            width: 800,
            height: 530,
            autoSize: true,
            touchNav: true,
            mouseNav: true,
            prevnextNav: true,
            prevnextAutoHide: true,
            pagerNav: true,
            startSlide: 1,
            autoPlay: true,
            delay: 0,
            interval: 3000,
            repeat: true,
            playReverse: false,
            hoverPause: true,
            captionAutoHide: false,
            animationCssTransitions: true,
            animationDuration: 500,
            animationTimingFunction: "linear",
            prevButtonClass: "slide-prev",
            nextButtonClass: "slide-next",
            prevButtonImage: "Images/prev.png",
            nextButtonImage: "Images/next.png",
            activeSlideClass: "es-active",
            slideCaptionClass: "es-caption",
            pagerClass: "es-pager",
            pagerImage: "Images/pagericon.png"
        },

        /* Initialization function
        **********************************************************/
        init: function () {
            var base, maxHeight, $prev, $next, $buttons, $innerBase, caption, $wrapper, $children, $container;
            // Defined variable to avoid scope problems
            base = this;
            // Introduce defaults that can be extended either globally or using an object literal. 
            base.config = $.extend({}, base.defaults, base.options, base.metadata);

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
            $.data(base, "isMoving", false);
            $.data(base, "width", base.config.width);

            // Create helper html objects
            base.$elem.addClass("slider");
			base.$elem.css({ position: "relative" });
            base.$elem.wrapInner("<div class='slide-wrapper'>", base.$elem).children();
            base.$elem.wrapInner("<div class='slide-container'>", $(".slide-wrapper", base.$elem)).children();
            base.$elem.wrapInner("<div class='slide-dragcontainer'>", $(".slide-container", base.$elem)).children();
            $(".slide-container", base.$elem).css({ position: "relative" });

            // Setup common jq objects
            $container = $(".slide-dragcontainer", base.$elem);
            $wrapper = $(".slide-wrapper", base.$elem);
            $children = $wrapper.children();    // "Saaave the children, aaaah aah ah aaaaaah"

            // Add prev/next nagivation
            if (base.config.prevnextNav)
            {
                // Add prev/next buttons
                $wrapper.after("<div class='" + base.config.nextButtonClass + "'>");
                $wrapper.after("<div class='" + base.config.prevButtonClass + "'>");
                $next = $("." + base.config.nextButtonClass, base.$elem);
                $prev = $("." + base.config.prevButtonClass, base.$elem);
                $next.append("<img src='" + base.config.nextButtonImage + "'>");
                $prev.append("<img src='" + base.config.prevButtonImage + "'>");
                $buttons = $next.add($prev);

                // Toogle on hover
                if (base.config.prevnextAutoHide) {
                    $buttons.hide();
                    base.$elem.hover(
		                function () { $buttons.fadeIn("fast") },
		                function () { $buttons.fadeOut("fast") }
	                );
                }
                // Bind click event to buttons
                $prev.on("click", function (e) { base.previous(); });
                $next.on("click", function (e) { base.next(); });
            }

            // Add pager navigation
            if (base.config.pagerNav)
            {
                base.$elem.append("<ul class='" + base.config.pagerClass + "'>");
                // Loop through each slide
                $children.each(function () {
                    $("<li />").appendTo($("." + base.config.pagerClass, base.$elem))
                        .attr("rel", $(this).index())
                        .css({ "background-image": "url('" + base.config.pagerImage + "')" })
                        .on("click", function () {
                            $.data(base, "nextSlide", parseInt($(this).attr("rel")));
                            base._prepareslides(true);
                            base._slide(true);
                            base._manualInterference();
                        });
                });
            }

            // Add data-attribute captions
            $children.each(function () {
                $innerBase = $(this);
                caption = $innerBase.data('plugin-slide-caption');
                if (caption === undefined)
                    return;

                if (this.tagName == "IMG")
                {
                    // If the slide is an image, wrap this image in a div and append the caption div.
                    $innerBase.wrap("<div>");
                    $innerBase.after("<div class='" + base.config.slideCaptionClass + "'>");
                    $innerBase.next().append(caption);
                } else {
                    // For any other type of slide element, just append the caption div at the end. 
                    $innerBase.append("<div class='" + base.config.slideCaptionClass + "'>");
                    $innerBase.children().last().append(caption);
                }
                // Toogle on hover
                if (base.config.captionAutoHide) {
                    $("." + base.config.slideCaptionClass, base.$elem).hide();
                    base.$elem.hover(
		                function () { $("." + base.config.slideCaptionClass, base.$elem).fadeIn("fast") },
		                function () { $("." + base.config.slideCaptionClass, base.$elem).fadeOut("fast") }
	                );
                }
            });

            // Add css styles
            $wrapper.children().addClass("slide").css({
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
            maxHeight = $children.height();
            $wrapper.css({
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
            if (base.config.touchNav) {
                $container.on("touchstart", function (e) {
                    var eventData = e.originalEvent.touches[0];
                    e.preventDefault();
                    base._onMoveStart(eventData.pageX, eventData.pageY);
                    return e.stopPropagation();
                });
                $container.on("touchmove", function (e) {
                    var eventData = e.originalEvent.touches[0];
                    e.preventDefault();
                    base._onMove(eventData.pageX, eventData.pageY);
                    return e.stopPropagation();
                });
                $container.on("touchend", function (e) {
                    e.preventDefault();
                    base._onMoveEnd();
                    return e.stopPropagation();
                });
            }
            // Setup mouse event handlers
            if (base.config.mouseNav) {
                $container.css("cursor", "pointer");
                $container.on("dragstart", function (e) { return false; });
                $container.on("mousedown", function (e) {
                    base._onMoveStart(e.clientX, e.clientY);

                    $(window).attr('unselectable', 'on').on('selectstart', false).css('user-select', 'none').css('UserSelect', 'none').css('MozUserSelect', 'none');
                    return e.stopPropagation();
                });
                // The mousemove event should also work outside the slide-wrapper container
                $(window).on("mousemove", function (e) {
                    base._onMove(e.clientX, e.clientY);
                    return e.stopPropagation();
                });
                // The mouseup event should also work outside the slide-wrapper container
                $(window).on("mouseup", function (e) {
                    base._onMoveEnd();

                    $(window).removeAttr('unselectable').unbind('selectstart').css('user-select', null).css('UserSelect', null).css('MozUserSelect', null);
                    return e.stopPropagation();
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

            return this;
        },

        /* Move to previous slide
        **********************************************************/
        previous: function () {
            var base, nextSlide;
            // Defined variable to avoid scope problems
            base = this;

            // Store slide direction in plugin data
            $.data(base, "slideDirection", "previous");

            // Find next index
            nextSlide = (base.data.nextSlide - 1) % base.data.totalslides;

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
            var base, nextSlide;
            // Defined variable to avoid scope problems
            base = this;

            // Store slide direction in plugin data
            $.data(base, "slideDirection", "next");
            
            // Find next index
            nextSlide = (base.data.nextSlide + 1) % base.data.totalslides;

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
            var base, $preContainer, timer;
            // Defined variable to avoid scope problems
            base = this;

            // Jquery objects
            $preContainer = $(".slide-container", base.$elem);

            // If we're already playing, clear previous interval
            if (base.data.isPlaying && base.data.playTimer)
                clearInterval(base.data.playTimer);

            // Setup the play timer
            timer = setInterval((function () {

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
                $preContainer.hover(function () {
                    $.data(base, "playPaused", true);
                    return base.stop();
                },function () {
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
            var base, $preContainer;
            // Defined variable to avoid scope problems
            base = this;

            // Jquery objects
            $preContainer = $(".slide-container", base.$elem);

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
            var base, nextSlideIndex, $container, $slides, $slide, leftPos;
            // Define variable to avoid scope problems
            base = this;

            // Data
            $.data(base, "nextSlide", (slideIndex) % base.data.totalslides);
            nextSlideIndex = (slideIndex) % base.data.totalslides;
            $.data(base, "currentSlide", nextSlideIndex);

            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);
            $slides = $container.children();
            $slide = $container.children(":eq(" + nextSlideIndex + ")");

            // Get position of goal slide
            leftPos = $slide.position().left;

            base._setActive($slides, $slide);

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
        _prepareslides: function (onlyAhead) {
            var base, $container, $slides, width, half, i;

            // Define variable to avoid scope problems
            base = this;

            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);
            $slides = $container.children();

            // Config
            width = base.data.width;

            half = Math.floor(base.data.totalslides / 2);
            i = 0;
            $slides.each(function () {
                // Move first half the slides ahead
                $(this).css({
                    display: "block",
                    left: width * i,
                    zIndex: 10
                });
                i++;

                // Move the other half back in line
                if (!onlyAhead && base.config.repeat && i > half)
                    i = base.data.totalslides % 2 ? -half : -(half - 1);
            });
        },

        /* Handling the start of the movement
        **********************************************************/
        _onMoveStart: function (x, y) {
            // Define variable to avoid scope problems
            var base = this;

            // Setup touchrelated data
            if (!base.data.isMoving) $.data(base, "touchTime", Number(new Date()));
            $.data(base, "touchedX", x);
            $.data(base, "touchedY", y);

            // The mouse is down.
            $.data(base, "isMoving", true);

            // Stop playing 
            if (base.data.isPlaying)
            {
                $.data(base, "playPaused", true);
                base.stop();
            }
        },

        /* Handling the movement
        **********************************************************/
        _onMove: function (x, y) {
            var base, $container, $slide, leftPos, prefix, translateX, limit;
            // Define variable to avoid scope problems
            base = this;

            // Only move if, we're actuall "moving"
            if (!base.data.isMoving)
                return;

            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);

            // Verify whether we're scrolling or sliding
            $.data(base, "scrolling", Math.abs(x - base.data.touchedX) < Math.abs(y - base.data.touchedY));

            // If we're not scrolling, we perform the translation
            // ...also - wait for any animation to finish
            // (we cant slide while animating)
            if (!base.data.scrolling && !base.data.isAnimating)
            {
                // Get the position of the slide we are heading for
                $slide = $container.children(":eq(" + base.data.nextSlide + ")");
                leftPos = $slide.position().left;

                // Get the browser engine prefix - if any
                prefix = base.data.browserEnginePrefix.css;

                // Get the delta movement to use for translation
                translateX = x - base.data.touchedX;

                // Limit if not repeating
                limit = base.data.width * 0.1;
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
        },

        /* Handling the end of the movement
        **********************************************************/
        _onMoveEnd: function () {
            var base, $container, $slide, leftPos, half, tenth, svipe;
            // Define variable to avoid scope problems
            base = this;

            // Only move if, we're actually "moving"
            if (!base.data.isMoving)
                return;

            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);

            // Set that we've just touched something such that when we slide next
            // the sliding duration is temporary halved.
            $.data(base, "justTouched", true);

            // Get the position of the slide we are heading for
            $slide = $container.children(":eq(" + base.data.nextSlide + ")");
            leftPos = $slide.position().left;

            // If we've slided at least half the width of the slide - slide to next
            // Also if we've slided 10% of the width within 1/4 of a second, 
            // we slide to the next
            half = base.data.width * 0.5;
            tenth = base.data.width * 0.1;
            svipe = (Number(new Date()) - base.data.touchTime < 250);

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

            // We're no longer moving and touching
            $.data(base, "isMoving", false);
            $.data(base, "justTouched", false);

            // Restart playing playing 
            if(base.data.playPaused)
                base.start();
        },

        /* Make an "endless" line of slides
        **********************************************************/
        // ISSUE:   Too slow slide duration and too fast sliding  
        //          may result in the slides not being aligned yet.
        // SOLUTION:...might be to duplicate all slides in init
        //          if number of slides is low. 
        _alignSlides : function(goalPosition)
        {
            var base, $container, $slides, $slide, half, width, bufferLength, bufferShortage, i, lowest, highest;
            // Define variable to avoid scope problems
            base = this;

            if (!base.config.repeat)
                return;

            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);
            $slides = $container.children();

            // Retrieve goalPosition if undefined
            if (goalPosition === undefined)
            {
                $slide = $container.children(":eq(" + base.data.nextSlide + ")");
                goalPosition = $slide.position().left;
            }

            // Remove fraction
            goalPosition = Math.round(goalPosition,0);


            // Half of the total slides
            half = Math.ceil(base.data.totalslides / 2);

            // Config
            width = base.data.width;

            // Get number of $slides after/before 'goalPosition' - this is our buffer.
            // If our buffer is below half the total $slides, we need to increase it.
            bufferLength = 0;
            $slides.each(function () {
                var l = $(this).position().left;
                if (l > goalPosition - width)
                    bufferLength++;
            });
            // Calculate how much short on buffer we are
            bufferShortage = half - bufferLength;

            // We're sliding the other direction thus moving a buffer to the other side
            if (bufferShortage < 0)
                bufferShortage = base.data.totalslides % 2 == 0 ? bufferShortage + 1 : bufferShortage;

            // Align slides according to bufferShortage
            for (i = 0; i < Math.abs(bufferShortage); i++) {
                // Find the element with the lowest left position
                lowest = [].reduce.call($slides, function (sml, cur) {
                    return $(sml).offset().left < $(cur).offset().left ? sml : cur;
                });
                // Find the element with the highest left position
                highest = [].reduce.call($slides, function (sml, cur) {
                    return $(sml).offset().left > $(cur).offset().left ? sml : cur;
                });

                if(bufferShortage > 0)
                    $(lowest).css("left", Math.round($(highest).position().left + width));
                else
                    $(highest).css("left", Math.round($(lowest).position().left - width));
                    
            }

        },

        /* Perform a slide
        **********************************************************/
        _slide: function (postalign) {
            var base, nextSlideIndex, $container, $slides, $slide, leftPos;
            // Define variable to avoid scope problems
            base = this;

            // Data
            nextSlideIndex = base.data.nextSlide;

            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);
            $slides = $container.children();
            $slide = $container.children(":eq(" + nextSlideIndex + ")");

            // Get the position of the slide we are heading for
            leftPos = Math.round($slide.position().left);

            // ---

            base._setActive($slides, $slide);

            // ---

            // Pre-Align the slides in a line to prepare for the transition animation
            if (!postalign) base._alignSlides(leftPos);

            // Animate - css transitions are much better.
            $.data(base, "isAnimating", true);
            if (base.config.animationCssTransitions && base.data.browserEnginePrefix) {
                
                base._transition((-leftPos), (base.data.justTouched ? 0.5 : 1));

                // Set nextslide on end of transition
                $container.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function () {
                    $.data(base, "currentSlide", nextSlideIndex);
                    $container.unbind("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd");

                    // Post-Align the slides in a line to prepare for the transition animation
                    if (postalign) base._alignSlides(leftPos);
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
            var base, $container, prefix, transform, duration, timing;
            // Define variable to avoid scope problems
            base = this;
            // Jquery objects
            $container = $(".slide-wrapper", base.$elem);

            // Limit duration modifier
            if (durationModifier === undefined || durationModifier < 0) {
                durationModifier = 1;
            }

            // NOTE:    We add both prefixed transition and the default
            //          for browser compatibility.

            // Select the css code based on browser engine
            prefix = base.data.browserEnginePrefix.css;
            transform = prefix + "Transform";
            duration = prefix + "TransitionDuration";
            timing = prefix + "TransitionTimingFunction";

            // Set style to activate the slide transition
            $container[0].style[duration] = (base.config.animationDuration * durationModifier) + "ms";
            $container[0].style[timing] = base.config.animationTimingFunction;
            $container[0].style[transform] = "translateX(" + leftPos + "px)";

            $container.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function () {
                $.data(base, "isAnimating", false);
                $.data(base, "justTouched", false);
                
                $container.unbind("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd");
            });
        },

        /* Update active slide
        **********************************************************/
        _setActive: function ($slides, $slide) {
            var base = this, activeSlideClass, pager;

            activeSlideClass = base.config.activeSlideClass;
            // Clear old active class
            $slides.removeClass(activeSlideClass);
            // Set new active class
            $slide.addClass(activeSlideClass);

            // Set active page in pager
            if (base.config.pagerNav)
            {
                pager = $("." + base.config.pagerClass, base.$elem);
                pager.children().removeClass("act");
                pager.find("[rel=" + $slide.index() + "]").addClass("act");
            }
        },

        /* Auto-size the slider
        **********************************************************/
        _resize: function () {
            var base, newwidth, ratio, newheight, maxHeight;
            // Define variable to avoid scope problems
            base = this;
            
            // Stop playing
            if (base.data.isPlaying){
                $.data(base, "playPaused", true);
                base.stop();
            }

            // Getting width from parent container
            newwidth = base.$elem.width();
            // Calculate W/H ratio
            ratio = base.config.height / base.config.width;
            // Get height from W/H ratio
            newheight = newwidth * ratio;

            // Update width
            $.data(base, "width", newwidth);

            // Add css styles
            $(".slide", base.$elem).css({
                width: newwidth,
                height: newheight
            });

            // Set the height of the wrapper to fit the max height of the slides
            maxHeight = $(".slide-wrapper", base.$elem).children().height();
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
            var transition, vendor, i;
            transition = "Transition";
            vendor = ["Moz", "Webkit", "Khtml", "O", "ms"];
            i = 0;
            while (i < vendor.length) {
                if (typeof document.body.style[vendor[i] + transition] === "string") {
                    return { css: vendor[i] };
                }
                i++;
            }
            return false;
        }
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
