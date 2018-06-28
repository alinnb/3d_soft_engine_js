var Base;
(function (Base) {
    var Vertex = (function() {
        function Vertex(x, y, z) {
            this.point = new BABYLON.Vector3(x, y, z);//在mesh中的坐标
            this.normalVectorList = []//在mesh中每个三角形上的法线矢量
            this.normal = new BABYLON.Vector3.Zero();//在mesh中的平均法线矢量
            this.projectPoint;//投影在摄像机上的平面坐标
            this.normalInWorld;//在世界坐标系上的法线矢量
            this.pointInWorld;//点在世界坐标系上的坐标
        }

        Vertex.prototype.averageNormal = function() {
            for(var index = 0; index < this.normalVectorList.length; index++) {
                var n = this.normalVectorList[index];
                this.normal.x += n.x
                this.normal.y += n.y
                this.normal.z += n.z
            }
            this.normal.x /= this.normalVectorList.length;
            this.normal.y /= this.normalVectorList.length;
            this.normal.z /= this.normalVectorList.length;
        }

        Vertex.normalVector = function(point1, point2, point3) {
            var v12 = new BABYLON.Vector3(point2.x - point1.x, point2.y - point1.y, point2.z - point1.z);
            var v23 = new BABYLON.Vector3(point3.x - point2.x, point3.y - point2.y, point3.z - point2.z);
            return new BABYLON.Vector3.Cross(v12, v23);
        }

        return Vertex;
    })();
    Base.Vertex = Vertex;

    // Lines
    var Line = (function () {
        function Line(p1, p2) {
            this.p1 = p1;
            this.p2 = p2;
        }

        //已知P1， P2点，P3XY,插值P3Z
        Line.prototype.interpolateZbyXY = function (p1, p2, p3x, p3y) {
            if (p1.x == p2.x && p1.y == p2.y) {
                return (p1.z + p2.z) >> 1;
            }
            delta_x = p2.x - p1.x;
            delta_y = p2.y - p1.y;
            delta_z = p2.z - p1.z;
            //已知p3.Y
            if (Math.abs(delta_x) < Math.abs(delta_y)) {
                return (p3y - p1.y) * delta_z / delta_y + p1.z;
            }
            else {
                return (p3x - p1.x) * delta_z / delta_x + p1.z;
            }
        }

        Line.prototype.processScanBresenham = function* () {
            var x0 = this.p1.x >> 0;
            var y0 = this.p1.y >> 0;
            var x1 = this.p2.x >> 0;
            var y1 = this.p2.y >> 0;
            var dx = Math.abs(x1 - x0);
            var dy = Math.abs(y1 - y0);
            var sx = (x0 < x1) ? 1 : -1;
            var sy = (y0 < y1) ? 1 : -1;
            var err = dx - dy;
            while (true) {
                yield new BABYLON.Vector3(x0, y0, this.interpolateZbyXY(this.p1, this.p2, x0, y0));
                if ((x0 == x1) && (y0 == y1)) {
                    return;
                }
                var e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
        };

        return Line;
    })();
    Base.Line = Line;
    
    var ArrayUtils = (function() {
        function ArrayUtils(array) {
            this.array = array;
        }

        ArrayUtils.prototype.next = function(i) {
            i++;
            if(i = this.array.length) {
                return this.array[0];
            }
            else {
                return this.array[i]
            }
        }

        return ArrayUtils;
    })();

    Base.ArrayUtils = ArrayUtils;

})(Base || (Base = {}))

var SoftEngine;
(function (SoftEngine) {
    // camera
    var Light = (function () {
        function Light() {
            this.Position = BABYLON.Vector3.Zero();
        }
        return Light;
    })();
    SoftEngine.Light = Light;    

    // camera
    var Camera = (function () {
        function Camera() {
            this.Position = BABYLON.Vector3.Zero();
            this.Target = BABYLON.Vector3.Zero();
        }
        return Camera;
    })();
    SoftEngine.Camera = Camera;

    // mesh
    var Mesh = (function () {
        function Mesh(name, verticesCount, facesCount) {
            this.name = name;
            this.Vertices = new Array(verticesCount);
            this.Faces = new Array(facesCount);
            this.Rotation = new BABYLON.Vector3(0, 0, 0);
            this.Position = new BABYLON.Vector3(0, 0, 0);
        }
        
        Mesh.prototype.update = function() {
            for(var index = 0; index < this.Faces.length; index++) {
                var f = this.Faces[index];
                var vertexA = this.Vertices[f.A];
                var vertexB = this.Vertices[f.B];
                var vertexC = this.Vertices[f.C];
                var normal = Base.Vertex.normalVector(vertexA.point, vertexB.point, vertexC.point);
                normal.normalize();
                vertexA.normalVectorList.push(normal);
                vertexB.normalVectorList.push(normal);
                vertexC.normalVectorList.push(normal);
            }
            for(var index = 0; index < this.Vertices.length; index++) {
                this.Vertices[index].averageNormal();
            }
        }

        return Mesh;
    })();
    SoftEngine.Mesh = Mesh;

    // device
    var Device = (function () {
        function Device(canvas) {
            this.workingCanvas = canvas;
            this.workingWidth = canvas.width;
            this.workingHeight = canvas.height;
            this.workingContext = this.workingCanvas.getContext("2d");
            this.zbuffer = new Array(this.workingWidth * this.workingHeight);
        };
        Device.prototype.clear = function () {
            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
            for(var i = 0; i < this.workingWidth * this.workingHeight; i ++) {
                this.zbuffer[i] = 10000000;
            }
        };
        Device.prototype.present = function () {
            this.workingContext.putImageData(this.backbuffer, 0, 0);
        };
        Device.prototype.putPixel = function (x, y, z, color) {
            this.backbufferdata = this.backbuffer.data;
            var indexZ = ((x >> 0) + (y >> 0) * this.workingWidth);
            var index = indexZ * 4;

            if(this.zbuffer[indexZ] < z) {
                return;
            }

            this.zbuffer[indexZ] = z;

            this.backbufferdata[index] = color.r * 255;
            this.backbufferdata[index + 1] = color.g * 255;
            this.backbufferdata[index + 2] = color.b * 255;
            this.backbufferdata[index + 3] = color.a * 255;
        };
        Device.prototype.project = function (vertex, transMat, worldMat) {
            var point = BABYLON.Vector3.TransformCoordinates(vertex.point, transMat);
            var x = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
            var y = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
            vertex.projectPoint = new BABYLON.Vector3(x, y, point.z);
            vertex.pointInWorld = BABYLON.Vector3.TransformCoordinates(vertex.point, worldMat);
            vertex.normalInWorld = BABYLON.Vector3.TransformCoordinates(vertex.normal, worldMat);
        };
        Device.prototype.drawPoint = function (point, color) {
            if(point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
                this.putPixel(point.x, point.y, point.z, color);
            }
        };
        Device.prototype.drawLine = function(p1, p2, color) {
            var line = new Base.Line(p1, p2);
            var gen = line.processScanBresenham();
            do {
                var p = gen.next();
                if (p.done) {
                    break;
                }
                this.drawPoint(p.value, color);
            }
            while(!p.done)
        }
        //已知P1， P2点，P3Y坐标，差值P3X P3Z
        Device.prototype.interpolateP3byP1P2 = function (p1, p2, p3y) {
            delta_x = p2.x - p1.x;
            delta_y = p2.y - p1.y;
            delta_z = p2.z - p1.z;
            //已知p3.Y
            var p3x = (p3y - p1.y) * delta_x / delta_y + p1.x;
            var p3z = (p3y - p1.y) * delta_z / delta_y + p1.z;
            return new BABYLON.Vector3(p3x, p3y, p3z)
        }
        Device.prototype.processScanLine = function* (p1, p2, p3, type) {
            var testYGap = 1
            switch (type) {
                case 1://平顶三角形
                    for (var y = p1.y; y < p3.y; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(p1, p3, y)
                        var pe = this.interpolateP3byP1P2(p2, p3, y)
                        yield { point1: ps, point2: pe };
                    }
                    break;
                case 2://平底三角形
                    for (var y = p1.y; y < p3.y; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(p1, p3, y)
                        var pe = this.interpolateP3byP1P2(p1, p2, y)
                        yield { point1: ps, point2: pe };
                    }
                    break;
                case 3://2+1 p2 left
                    var py = p2.y
                    ////平底三角形
                    for (var y = p1.y; y < py; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(p1, p3, y)
                        var pe = this.interpolateP3byP1P2(p1, p2, y)
                        yield { point1: ps, point2: pe };
                    }
                    //平顶三角形
                    for (var y = py; y < p3.y; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(p2, p3, y)
                        var pe = this.interpolateP3byP1P2(p1, p3, y)
                        yield { point1: ps, point2: pe };
                    }
                    break;
                case 4://2+1 p2 right
                    var py = p2.y
                    //平底三角形
                    for (var y = p1.y; y < py; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(p1, p3, y)
                        var pe = this.interpolateP3byP1P2(p1, p2, y)
                        yield { point1: ps, point2: pe };
                    }
                    //平顶三角形
                    for (var y = py; y < p3.y; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(p1, p3, y)
                        var pe = this.interpolateP3byP1P2(p2, p3, y)
                        yield { point1: ps, point2: pe };
                    }
                    break;
            }
            return;
        }
        Device.prototype.drawTriangle = function(v1, v2, v3, light, color) {
            //draw face
            var face_color = color;

            //对点进行排序，便于画三角
            vertexList = [v1, v2, v3]
            vertexList.sort(function (i1, i2) {
                if (i1.projectPoint.y == i2.projectPoint.y) {
                    return i1.projectPoint.x < i2.projectPoint.x ? -1 : 1;
                }
                return i1.projectPoint.y < i2.projectPoint.y ? -1 : 1;
            })
            p1 = vertexList[0].projectPoint
            p2 = vertexList[1].projectPoint
            p3 = vertexList[2].projectPoint
            //一共4种三角
            // TYPE1                 TYPE2：           TYPE3          TYPE4
            // P1 .......... P2       P1 .            P1  .            P1 .
            //     .      .             . .             . .               . .
            //      .    .             .   .        P2.   .               .   .P2
            //       . .              .     .           . .               . .
            //        .              .........            .               .
            //        P3           P3         P2          P3             P3
            // if true, p2 on right of p1p3, else p2 on left
            var type = 0;
            if (p1.y == p2.y) {
                type = 1;
            }
            else if (p3.y == p2.y) {
                type = 2;
            }
            else {
                dP1P2 = (p2.x - p1.x) / (p2.y - p1.y)
                dP1P3 = (p3.x - p1.x) / (p3.y - p1.y)
                type = dP1P2 > dP1P3 ? 4 : 3;
            }
            //遍历
            var gen = this.processScanLine(vertexList[0].projectPoint, vertexList[1].projectPoint, vertexList[2].projectPoint, type);
            do {
                var p = gen.next();
                if (p.done) {
                    break;
                }
                this.drawLine(p.value.point1, p.value.point2, face_color)
            } while(!p.done)
            //draw lines
            var color = new BABYLON.Color4(1, 0, 0, 1);
            this.drawLine(p1, p2, color);
            this.drawLine(p2, p3, color);
            this.drawLine(p3, p1, color);
        }
        Device.prototype.render = function (camera, light, meshes) {
            var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
            var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);
            for(var index = 0; index < meshes.length; index++) {
                var cMesh = meshes[index];
                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z).multiply(BABYLON.Matrix.Translation(cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));
                var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                for(var index = 0; index < cMesh.Faces.length; index++) {
                    var currentFace = cMesh.Faces[index];
                    var vertexA = cMesh.Vertices[currentFace.A];
                    var vertexB = cMesh.Vertices[currentFace.B];
                    var vertexC = cMesh.Vertices[currentFace.C];
                    this.project(vertexA, transformMatrix, worldMatrix);
                    this.project(vertexB, transformMatrix, worldMatrix);
                    this.project(vertexC, transformMatrix, worldMatrix);
                    this.drawTriangle(vertexA, vertexB, vertexC, light, new BABYLON.Color4(1, 1, 0, 1))
                }
            }
        };
        Device.prototype.LoadJSONFileAsync = function (fileName, callback) {
            var jsonObject = {
            };
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", fileName, true);
            var that = this;
            xmlhttp.onreadystatechange = function () {
                if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    jsonObject = JSON.parse(xmlhttp.responseText);
                    callback(that.CreateMeshesFromJSON(jsonObject));
                }
            };
            xmlhttp.send(null);
        };
        Device.prototype.CreateMeshesFromJSON = function (jsonObject) {
            var meshes = [];
            for(var meshIndex = 0; meshIndex < jsonObject.meshes.length; meshIndex++) {
                var verticesArray = jsonObject.meshes[meshIndex].vertices;
                var indicesArray = jsonObject.meshes[meshIndex].indices;
                var uvCount = jsonObject.meshes[meshIndex].uvCount;
                var verticesStep = 1;
                switch(uvCount) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                }
                var verticesCount = verticesArray.length / verticesStep;
                var facesCount = indicesArray.length / 3;
                var mesh = new SoftEngine.Mesh(jsonObject.meshes[meshIndex].name, verticesCount, facesCount);
                for(var index = 0; index < verticesCount; index++) {
                    var x = verticesArray[index * verticesStep];
                    var y = verticesArray[index * verticesStep + 1];
                    var z = verticesArray[index * verticesStep + 2];
                    mesh.Vertices[index] = new Base.Vertex(x, y, z);
                }
                for(var index = 0; index < facesCount; index++) {
                    var a = indicesArray[index * 3];
                    var b = indicesArray[index * 3 + 1];
                    var c = indicesArray[index * 3 + 2];
                    mesh.Faces[index] = {
                        A: a,
                        B: b,
                        C: c
                    };
                }
                var position = jsonObject.meshes[meshIndex].position;
                mesh.Position = new BABYLON.Vector3(position[0], position[1], position[2]);
                meshes.push(mesh);
            }
            return meshes;
        };
        return Device;
    })();
    SoftEngine.Device = Device;    
})(SoftEngine || (SoftEngine = {}));
