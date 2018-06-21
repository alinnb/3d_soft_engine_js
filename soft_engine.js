
define(['base'], function(Base) {
	'use strict';
	var SoftEngine;
	// Camera
	(function(se) {
		var Camera = function() {
			function Camera() {
				this.positon = Base.Vector3.Zero()
			}
			return Camera;
		} ();
		se.Camera = Camera
	
	})(SoftEngine || (SoftEngine = {}));
	
	// Device
	(function(se) {
		var Device = function() {
			function Device(canvas) {
				
			}
			return Device;
		} ();
		se.Device = Device
	
	})(SoftEngine || (SoftEngine = {}));
	
	function init() {
		var mainCanvas = document.querySelector('#main_canvas')
		var log = console.log.bind(console)
	
		var device = new SoftEngine.Device(mainCanvas);
		
		var camera = new SoftEngine.Camera();
		
		var v3 = new Base.Vector3(0, 0, 10)
		log(v3.x, v3.y, v3.z)
	}

	init()
		
})
