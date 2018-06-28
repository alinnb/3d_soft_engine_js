window.requestAnimationFrame = (function () {
   return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function (callback) {
             window.setTimeout(callback, 1000 / 60);
         };
     })();

var canvas;
var fps;
var device;
var meshes = [];
var camera;
var light;
var previousDate;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.getElementById("frontBuffer");
    fps = document.getElementById("fps");

    camera = new SoftEngine.Camera();
    camera.Position = new BABYLON.Vector3(0, 0, 10);
    camera.Target = new BABYLON.Vector3(0, 0, 0);

    device = new SoftEngine.Device(canvas);

    light = new SoftEngine.Light();
    light.Position = new BABYLON.Vector3(0, 100, 0);

    previousDate = new Date();
    
    // device.LoadJSONFileAsync("monkey.babylon", loadJSONCompleted);
    loadCube();
    // loadTrangle();

    document.onkeydown = rotationZ;
}

function loadTrangle() {
    var mesh = new SoftEngine.Mesh("Trangle", 3, 1);
    mesh.Vertices[0] = new Base.Vertex(-1, 1, 1);
    mesh.Vertices[1] = new Base.Vertex(1, -1, 1);
    mesh.Vertices[2] = new Base.Vertex(-1, -1, -1);

    mesh.Faces[0] = { A : 0, B : 1, C : 2 };

    mesh.update();
    meshes.push(mesh);

    requestAnimationFrame(drawingLoop);
}

function loadCube() {
    var mesh = new SoftEngine.Mesh("Cube", 8, 12);
    mesh.Vertices[0] = new Base.Vertex(-1, 1, 1);
    mesh.Vertices[1] = new Base.Vertex(1, 1, 1);
    mesh.Vertices[2] = new Base.Vertex(-1, -1, 1);
    mesh.Vertices[3] = new Base.Vertex(1, -1, 1);
    mesh.Vertices[4] = new Base.Vertex(-1, 1, -1);
    mesh.Vertices[5] = new Base.Vertex(1, 1, -1);
    mesh.Vertices[6] = new Base.Vertex(1, -1, -1);
    mesh.Vertices[7] = new Base.Vertex(-1, -1, -1);

    mesh.Faces[0] = { A : 0, B : 1, C : 2 };
    mesh.Faces[1] = { A : 1, B : 2, C : 3 };
    mesh.Faces[2] = { A : 1, B : 3, C : 6 };
    mesh.Faces[3] = { A : 1, B : 5, C : 6 };
    mesh.Faces[4] = { A : 0, B : 1, C : 4 };
    mesh.Faces[5] = { A : 1, B : 4, C : 5 };
    mesh.Faces[6] = { A : 2, B : 3, C : 7 };
    mesh.Faces[7] = { A : 3, B : 6, C : 7 };
    mesh.Faces[8] = { A : 0, B : 2, C : 7 };
    mesh.Faces[9] = { A : 0, B : 4, C : 7 };
    mesh.Faces[10] = { A : 4, B : 5, C : 6 };
    mesh.Faces[11] = { A : 4, B : 6, C : 7 };

    mesh.update();
    meshes.push(mesh);

    requestAnimationFrame(drawingLoop);
}

function loadJSONCompleted(meshesLoaded) {
    meshes = meshesLoaded;
    // Calling the HTML5 rendering loop
    requestAnimationFrame(drawingLoop);
}

// Rendering loop handler
function drawingLoop() {
    var now = new Date();
    var currentFps = 1000.0 / (now.getMilliseconds() - previousDate.getMilliseconds());
    previousDate = now;
    fps.innerHTML = Math.floor(currentFps) + 'fps'

    device.clear();

    auto_rotation();

    // Doing the various matrix operations
    device.render(camera, light, meshes);
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling the HTML5 rendering loop recursively
    requestAnimationFrame(drawingLoop);
}

function auto_rotation() {
    for (var i = 0; i < meshes.length; i++) {
        // rotating slightly the mesh during each frame rendered
        meshes[i].Rotation.x += 0.01;
        meshes[i].Rotation.y += 0.01;
    }
}

function rotationZ() {
    for (var i = 0; i < meshes.length; i++) {
        // rotating slightly the mesh during each frame rendered
        meshes[i].Rotation.z += 0.01;
    }
}
