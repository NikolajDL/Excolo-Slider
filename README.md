Excolo Slider
============
A simple jquery sliding plugin, supporting responsive design, keyboard and touch navigation. 

Under development. 
I'll post future features and enhancements, in the issue tracker.

Should you find bugs or want to suggest a feature, feel free to post it in an issue. :-) 


Features:
- AutoPlay Slideshow
- Mouse slide navigation
- Prev/next button navigation
- HTML5 data-attribute captions
- Pagination
- Repeat when last slide is reached
- Play the slideshow backwards
- Auto adjust size initially and on browser resize, for responsive designs
- Touch enabled (limited to a few browsers)

Most of these features can be configured and turned off, when setting up the slider. 


Installation
============
Installation can be done using NuGet Package Manager, 
either by using the console, as seen below, or by searching for the package in the Visual Studio package explorer:
```
PM> Install-Package excolo-slider
```
Then in the header of your website, you insert the references to jquery and the slider plugin:
```html
<script src="Scripts/jquery-1.9.1.min.js"></script>
<script src="Scripts/jquery.excoloSlider.min.js"></script>
<link href="Content/jquery.excoloSlider.css" rel="stylesheet">
```
The HTML code for the slides is simply a div container, with any child objects being the slides:
```html
<div id="slider">
  <img src="images/image1.jpg" />
  <img src="images/image2.jpg" />
  <img src="images/image3.jpg" />
  <img src="images/image4.jpg" 
    data-plugin-slide-caption="I am a caption <b>and I can contain HTML.</b>" />
  <img src="images/image5.jpg" />
  <img src="images/image6.jpg" />
  <img src="images/image7.jpg" />
  <div>
    <h2>This is the last slide</h2>
    <img style="width: 50%: float: right;" src="images/image8.jpg" />
  </div>
</div>
```
Notice how you can use the HTML5 data-attribute data-plugin-slide-caption to create a caption text for each slide. 
These captions allow HTML and can be fully styled using css.

Then to initialize the slider plugin with default settings you insert the script:
```html
$(function () {
    $("#slider").excoloSlider();
});
```

For installation without NuGet see [our GitHub page](http://excolo.github.io/Excolo-Slider/)


Configuration
============
Configuration can be seen on [our GitHub page](http://excolo.github.io/Excolo-Slider/)


Examples
============
Examples can be seen on [our GitHub page](http://excolo.github.io/Excolo-Slider/)


Change Log
============

2013-06-26 - **v1.0.4**

* Added non-minimized js script to NuGet package ([excolo](https://github.com/excolo))

2013-06-15 - **v1.0.3**

* Code cleaning ([excolo](https://github.com/excolo))

2013-06-15 - **v1.0.0**

* Added the last feature from the issue list - pagination ([excolo](https://github.com/excolo))
* Cleaned up the code a bit ([excolo](https://github.com/excolo))

2013-06-13 - **v0.4.0**

* Added HTML5 data-attribute captions ([excolo](https://github.com/excolo))

2013-06-13 - **v0.3.5**

* Updated jQuery.org plugin gallery manifest ([excolo](https://github.com/excolo))

2013-06-13 - **v0.3.4**

* Removed text-selection when using mouse navigation ([excolo](https://github.com/excolo))
* Created a NuGet package for easy installation on ASP.NET projects ([excolo](https://github.com/excolo))

2013-06-13 - **v0.3.3**

* Increased browser support ([excolo](https://github.com/excolo))

2013-06-10 - **v0.3.1**

* Added previous/next button navigation ([excolo](https://github.com/excolo))
* Added a stylesheet for default styling of slider ([excolo](https://github.com/excolo))

2013-06-07 - **v0.2.3**

* Added mouse navigation ([excolo](https://github.com/excolo))

2013-05-20 - **v0.1.4**

* Initial version ([excolo](https://github.com/excolo))

License
============
Free for both personal and commercial use.

Copyright (c) 2013 Nikolaj Dam Larsen. Released under the [MIT license](https://github.com/Excolo/Excolo-Slider/blob/master/MIT-LICENSE).
