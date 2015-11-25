# cube
A mobile-friendly web-based Rubik's Cube with a built-in solver using [three.js](http://threejs.org/) and [jQuery](https://jquery.com/).

![Cube image](cube2.png?raw=true "Cube image")

See it running at [http://andrewmacheret.com/projects/cube](http://andrewmacheret.com/projects/cube).

Prereqs:
* A web server (like [Apache](https://httpd.apache.org/)).

Installation steps:
* `git clone <clone url>`

Test it:
* Open `index.html` in a browser.
 * For testing purposes, if you don't have a web server, running `python -m SimpleHTTPServer` in the project directory and navigating to [http://localhost:8000](http://localhost:8000) should do the trick.
* You should see a Rubik's Cube, and you should be able to rotate 6 faces and rotate the entire cube with the mouse (or with touch on mobile).
* To troubleshoot, look for javascript errors in the browser console.
