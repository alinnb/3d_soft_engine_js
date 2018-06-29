window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

var fps;
var devices = [];
var meshes = [];
var camera;
var light;
var previousDate;
var windows_debug = true;
var mesh_type = 3;//0-monkey,1-cube,2-triangle,3-face
var auto_move = false;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    fps = document.getElementById("fps");

    var distance = 8;
    var main_canvas = document.getElementById("main");
    var main_camera = new SoftEngine.Camera(new BABYLON.Vector3(0, distance, -distance), new BABYLON.Vector3(0, 0, 0));
    var main_device = new SoftEngine.Device(main_canvas, main_camera);
    devices.push(main_device);

    if (windows_debug) {
        //xy axis
        var xy_canvas = document.getElementById("axis-xy");
        var xy_camera = new SoftEngine.Camera(new BABYLON.Vector3(0, 0, -distance), new BABYLON.Vector3(0, 0, 0));
        var xy_device = new SoftEngine.Device(xy_canvas, xy_camera);
        devices.push(xy_device);
        //yz axis
        var yz_canvas = document.getElementById("axis-yz");
        var yz_camera = new SoftEngine.Camera(new BABYLON.Vector3(-distance, 0, 0), new BABYLON.Vector3(0, 0, 0));
        var yz_device = new SoftEngine.Device(yz_canvas, yz_camera);
        devices.push(yz_device);
        //xz axis
        var xz_canvas = document.getElementById("axis-xz");
        var xz_camera = new SoftEngine.Camera(new BABYLON.Vector3(0, -distance, 1), new BABYLON.Vector3(0, 0, 0));
        var xz_device = new SoftEngine.Device(xz_canvas, xz_camera);
        devices.push(xz_device);
    }

    light = new SoftEngine.Light();
    light.Position = new BABYLON.Vector3(0, 2, -2);

    previousDate = new Date();

    switch (mesh_type) {
        case 0:
            SoftEngine.Mesh.LoadJSONFileAsync("monkey.babylon", loadJSONCompleted);
            break;
        case 1:
            loadCube();
            break;
        case 2:
            loadTrangle();
            break;
        case 3:
            loadFace();
            break;
    }

    document.onkeydown = function (event) {
        var e = event || window.event || arguments.callee.caller.arguments[0];

        var rx = 0;
        var ry = 0;
        var rz = 0;
        if (e.keyCode == 81) {//Q
            rz = 0.01
        }
        else if (e.keyCode == 69) {//E
            rz = -0.01
        }
        else if (e.keyCode == 65) {//A
            ry = 0.01;
        }
        else if (e.keyCode == 68) {//D
            ry = -0.01;
        }
        else if (e.keyCode == 87) {//W
            rx = 0.01;
        }
        else if (e.keyCode == 83) {//S
            rx = -0.01;
        }

        for (var i = 0; i < meshes.length; i++) {
            // rotating slightly the mesh during each frame rendered
            meshes[i].Rotation.x += rx;
            meshes[i].Rotation.y += ry;
            meshes[i].Rotation.z += rz;
        }
    };
}

function loadJSONCompleted(meshesLoaded) {
    meshes = meshesLoaded;
    for (var i in meshes) {
        meshes[i].update();
    }
    // Calling the HTML5 rendering loop
    requestAnimationFrame(drawingLoop);
}

// Rendering loop handler
function drawingLoop() {
    var now = new Date();
    var currentFps = 1000.0 / (now.getMilliseconds() - previousDate.getMilliseconds());
    previousDate = now;
    fps.innerHTML = Math.floor(currentFps) + 'fps'

    for (var i in devices) {
        devices[i].clear();
        devices[i].render(light, meshes);
        devices[i].present();
    }

    if (auto_move) {
        auto_rotation();
    }

    requestAnimationFrame(drawingLoop);
}

function auto_rotation() {
    for (var i = 0; i < meshes.length; i++) {
        meshes[i].Rotation.x += 0.01;
        meshes[i].Rotation.y += 0.01;
    }
}

function loadTrangle() {
    var mesh = new SoftEngine.Mesh("Trangle", 3, 1);

    //type1
    // mesh.Vertices[0] = new Base.Vertex(-1, 1, 1);
    // mesh.Vertices[1] = new Base.Vertex(1, -1, 1);
    // mesh.Vertices[2] = new Base.Vertex(-1, -1, -1);
    //type2
    mesh.Vertices[0] = new Base.Vertex(-1, 1, 0);
    mesh.Vertices[1] = new Base.Vertex(1, 1, 0);
    mesh.Vertices[2] = new Base.Vertex(-1, -1, 0);
    //type3
    // mesh.Vertices[0] = new Base.Vertex(-1, 1, -1);
    // mesh.Vertices[1] = new Base.Vertex(1, 1, -1);
    // mesh.Vertices[2] = new Base.Vertex(-1, -1, -1);

    mesh.Faces[0] = { A: 0, B: 2, C: 1 };//逆时针

    mesh.update();
    meshes.push(mesh);

    requestAnimationFrame(drawingLoop);
}

function loadFace() {
    var mesh = new SoftEngine.Mesh("Trangle", 4, 2);

    //type1
    // mesh.Vertices[0] = new Base.Vertex(-1, 1, 1);
    // mesh.Vertices[1] = new Base.Vertex(1, -1, 1);
    // mesh.Vertices[2] = new Base.Vertex(-1, -1, -1);
    //type2
    // mesh.Vertices[0] = new Base.Vertex(-1, 1, 1);
    // mesh.Vertices[1] = new Base.Vertex(1, 1, 1);
    // mesh.Vertices[2] = new Base.Vertex(-1, -1, 1);
    //type3
    mesh.Vertices[0] = new Base.Vertex(-1, 1, 1);
    mesh.Vertices[1] = new Base.Vertex(1, 1, 1);
    mesh.Vertices[2] = new Base.Vertex(1, -1, -1);
    mesh.Vertices[3] = new Base.Vertex(-1, -1, -1);
    mesh.Vertices[0].id = 0;
    mesh.Vertices[1].id = 1;
    mesh.Vertices[2].id = 2;
    mesh.Vertices[3].id = 3;

    mesh.Faces[0] = { A: 0, B: 2, C: 1 };//逆时针
    mesh.Faces[1] = { A: 0, B: 3, C: 2 };//逆时针

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
    mesh.Vertices[0].id = 0;
    mesh.Vertices[1].id = 1;
    mesh.Vertices[2].id = 2;
    mesh.Vertices[3].id = 3;
    mesh.Vertices[4].id = 4;
    mesh.Vertices[5].id = 5;
    mesh.Vertices[6].id = 6;
    mesh.Vertices[7].id = 7;

    mesh.Faces[0] = { A: 0, B: 1, C: 2 };//逆时针
    mesh.Faces[1] = { A: 1, B: 3, C: 2 };//逆时针
    mesh.Faces[2] = { A: 1, B: 6, C: 3 };//逆时针
    mesh.Faces[3] = { A: 1, B: 5, C: 6 };//逆时针
    mesh.Faces[4] = { A: 0, B: 4, C: 1 };//逆时针
    mesh.Faces[5] = { A: 1, B: 4, C: 5 };//逆时针
    mesh.Faces[6] = { A: 2, B: 3, C: 7 };//逆时针
    mesh.Faces[7] = { A: 3, B: 6, C: 7 };//逆时针
    mesh.Faces[8] = { A: 0, B: 2, C: 7 };//逆时针
    mesh.Faces[9] = { A: 0, B: 7, C: 4 };//逆时针
    mesh.Faces[10] = { A: 4, B: 6, C: 5 };//逆时针
    mesh.Faces[11] = { A: 4, B: 7, C: 6 };//逆时针

    mesh.update();
    meshes.push(mesh);

    requestAnimationFrame(drawingLoop);
}