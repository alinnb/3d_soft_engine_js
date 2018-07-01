var Base;
(function (Base) {
    var Vertex = (function () {
        function Vertex(x, y, z) {
            this.point = new BABYLON.Vector3(x, y, z);//在mesh中的坐标
            this.normalVectorList = []//在mesh中每个三角形上的法线矢量
            this.normal = new BABYLON.Vector3.Zero();//在mesh中的平均法线矢量
            this.projectPoint;//投影在摄像机上的平面坐标
            this.normalInWorld;//在世界坐标系上的法线矢量
            this.pointInWorld;//点在世界坐标系上的坐标
            this.pointInWorldToLightVector;//到光源的矢量
            this.id = -1;
        }

        Vertex.prototype.addNormal = function (normal) {
            for (var index = 0; index < this.normalVectorList.length; index++) {
                var n = this.normalVectorList[index];
                if (n.x == normal.x && n.y == normal.y && n.z == normal.z) {
                    return;
                }
            }
            this.normalVectorList.push(normal);
        }

        Vertex.prototype.averageNormal = function () {
            for (var index = 0; index < this.normalVectorList.length; index++) {
                var n = this.normalVectorList[index];
                this.normal.x += n.x
                this.normal.y += n.y
                this.normal.z += n.z
            }
            this.normal.x /= this.normalVectorList.length;
            this.normal.y /= this.normalVectorList.length;
            this.normal.z /= this.normalVectorList.length;
        }

        Vertex.prototype.updateLight = function(light) {
            this.pointInWorldToLightVector = this.pointInWorld.subtract(light.Position); 
        }

        Vertex.normalVector = function (point1, point2, point3) {
            var v12 = new BABYLON.Vector3(point2.x - point1.x, point2.y - point1.y, point2.z - point1.z);
            var v23 = new BABYLON.Vector3(point3.x - point2.x, point3.y - point2.y, point3.z - point2.z);
            return new BABYLON.Vector3.Cross(v12, v23);
        }

        Vertex.prototype.toString = function () {
            return `Vertex(${this.point.x},${this.point.y},${this.point.z})
                normal(${this.normal.x},${this.normal.y},${this.normal.z})
                normalInWorld(${this.normalInWorld.x},${this.normalInWorld.y},${this.normalInWorld.z})`
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

    var Shader = (function () {
        function Shader(v1, v2, v3, light, color) {
            this.v1 = v1;
            this.v2 = v2;
            this.v3 = v3;
            this.light = light;
            this.color = color;
            //三点组成的面的法线
            this.face_normal = Base.Vertex.normalVector(v1.pointInWorld, v2.pointInWorld, v3.pointInWorld);
            //计算v1坐标到光源的矢量
            this.v1.updateLight(light);
            this.v2.updateLight(light);
            this.v3.updateLight(light);
        }
        Shader.prototype.isClockwise = function () {
            var v12 = this.v1.projectPoint.subtract(this.v2.projectPoint);
            var v13 = this.v1.projectPoint.subtract(this.v3.projectPoint);

            return v12.x * v13.y - v12.y * v13.x >= 0;
        }
        Shader.prototype.computeNDotL = function (normal, lightVector) {
            normal.normalize();
            lightVector.normalize();

            var dot = BABYLON.Vector3.Dot(normal, lightVector);

            return Math.max(0, dot);
        };
        Shader.prototype.interpolate = function(start,end,x) {
            return start + (end - start) * x;
        }
        Shader.prototype.interpolateNormal = function(va,vb,p) {
            var v = new Base.Vertex(0,0,0);
            var x = this.interpolate(va.normalInWorld.x, vb.normalInWorld.x, p);
            var y = this.interpolate(va.normalInWorld.y, vb.normalInWorld.y, p);
            var z = this.interpolate(va.normalInWorld.z, vb.normalInWorld.z, p);
            var lx = this.interpolate(va.pointInWorldToLightVector.x, vb.pointInWorldToLightVector.x, p);
            var ly = this.interpolate(va.pointInWorldToLightVector.y, vb.pointInWorldToLightVector.y, p);
            var lz = this.interpolate(va.pointInWorldToLightVector.z, vb.pointInWorldToLightVector.z, p);
            v.normalInWorld = new BABYLON.Vector3(x,y,z);
            v.pointInWorldToLightVector = new BABYLON.Vector3(lx,ly,lz);
            return v;
        }
        Shader.prototype.getColor = function (va,vb,vc,vd,ix,iy, bDrawBorder) {
            //背部用紫色或者不绘制
            if (this.isClockwise()) {
                // return new BABYLON.Color4(1, 0, 1, 1);
                return null;
            }

            //红色描边
            if (this.light.drawBorder && bDrawBorder) {
                return new BABYLON.Color4(1, 0, 0, 1);
            }

            switch (this.light.type) {
                case 0:
                    return this.color;

                //1 - 平行光，平面着色
                case 1:
                    var ndotl = this.computeNDotL(this.face_normal, this.light.directionalLightVector());
                    return new BABYLON.Color4(
                        this.color.r * ndotl,
                        this.color.g * ndotl,
                        this.color.b * ndotl, 1);

                //2 - 平行光，高氏着色
                case 2:
                    //normal in vertex
                    var nsx = this.interpolateNormal(va, vb, iy);
                    var nex = this.interpolateNormal(vc, vd, iy);
                    var n = this.interpolateNormal(nsx, nex, ix);
                    var ndotl = this.computeNDotL(n.normalInWorld, this.light.directionalLightVector());
                    return new BABYLON.Color4(
                        this.color.r * ndotl,
                        this.color.g * ndotl,
                        this.color.b * ndotl, 1);
                        
                //3 - 点光源，高氏着色
                case 3:
                    //normal in vertex
                    var nsx = this.interpolateNormal(va, vb, iy);
                    var nex = this.interpolateNormal(vc, vd, iy);
                    var n = this.interpolateNormal(nsx, nex, ix);
                    var ndotl = this.computeNDotL(n.normalInWorld, n.pointInWorldToLightVector);
                    return new BABYLON.Color4(
                        this.color.r * ndotl,
                        this.color.g * ndotl,
                        this.color.b * ndotl, 1);
            }

            return this.color;
        }

        return Shader;
    })();

    Base.Shader = Shader;

})(Base || (Base = {}))

var SoftEngine;
(function (SoftEngine) {
    // camera
    var Light = (function () {
        function Light() {
            this.Position = BABYLON.Vector3.Zero();
            this.target = BABYLON.Vector3.Zero();
            this.drawBorder = false;
            this.type = 1; //平行光,"directional_ight"
        }
        Light.prototype.directionalLightVector = function() {
            return this.target.subtract(this.Position);
        }
        return Light;
    })();
    SoftEngine.Light = Light;

    // camera
    var Camera = (function () {
        function Camera(position, target) {
            this.Position = position;
            this.Target = target;
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

        Mesh.prototype.update = function () {
            for (var index = 0; index < this.Faces.length; index++) {
                var f = this.Faces[index];
                var vertexA = this.Vertices[f.A];
                var vertexB = this.Vertices[f.B];
                var vertexC = this.Vertices[f.C];
                var normal = Base.Vertex.normalVector(vertexA.point, vertexB.point, vertexC.point);
                normal.normalize();
                vertexA.addNormal(normal);
                vertexB.addNormal(normal);
                vertexC.addNormal(normal);
            }
            for (var index = 0; index < this.Vertices.length; index++) {
                this.Vertices[index].averageNormal();
            }
        }
        Mesh.LoadJSONFileAsync = function (fileName, callback) {
            var jsonObject = {
            };
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", fileName, true);
            var that = this;
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    jsonObject = JSON.parse(xmlhttp.responseText);
                    callback(Mesh.CreateMeshesFromJSON(jsonObject));
                }
            };
            xmlhttp.send(null);
        };
        Mesh.CreateMeshesFromJSON = function (jsonObject) {
            var meshes = [];
            for (var meshIndex = 0; meshIndex < jsonObject.meshes.length; meshIndex++) {
                var verticesArray = jsonObject.meshes[meshIndex].vertices;
                var indicesArray = jsonObject.meshes[meshIndex].indices;
                var uvCount = jsonObject.meshes[meshIndex].uvCount;
                var verticesStep = 1;
                switch (uvCount) {
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
                for (var index = 0; index < verticesCount; index++) {
                    var x = verticesArray[index * verticesStep];
                    var y = verticesArray[index * verticesStep + 1];
                    var z = verticesArray[index * verticesStep + 2];
                    mesh.Vertices[index] = new Base.Vertex(x, y, z);
                }
                for (var index = 0; index < facesCount; index++) {
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

        return Mesh;
    })();
    SoftEngine.Mesh = Mesh;

    // device
    var Device = (function () {
        function Device(canvas, camera) {
            this.camera = camera
            this.workingCanvas = canvas;
            this.workingWidth = canvas.width;
            this.workingHeight = canvas.height;
            this.workingContext = this.workingCanvas.getContext("2d");
            this.zbuffer = new Array(this.workingWidth * this.workingHeight);
        };
        Device.prototype.clear = function () {
            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
            for (var i = 0; i < this.workingWidth * this.workingHeight; i++) {
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

            if (this.zbuffer[indexZ] < z) {
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
            if (!color) {
                return;
            }
            if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
                this.putPixel(point.x, point.y, point.z, color);
            }
        };
        Device.prototype.drawLine = function (p1, p2, color) {
            var line = new Base.Line(p1, p2);
            var gen = line.processScanBresenham();
            do {
                var p = gen.next();
                if (p.done) {
                    break;
                }
                p.z =
                    this.drawPoint(p.value, color);
            }
            while (!p.done)
        }
        //已知P1， P2点，P3Y坐标，差值P3X P3Z
        Device.prototype.interpolateP3byP1P2 = function (v1, v2, y) {
            var p1 = v1.projectPoint;
            var p2 = v2.projectPoint;
            var p1w = v1.pointInWorld;
            var p2w = v2.pointInWorld;
            var n1 = v1.normalInWorld;
            var n2 = v2.normalInWorld;
            var l1 = v1.pointInWorldToLightVector;
            var l2 = v2.pointInWorldToLightVector;

            var x = this.interpolate(p1.x, p2.x, p1.y, p2.y, y);
            var z = this.interpolate(p1.z, p2.z, p1.y, p2.y, y);
            var nx = this.interpolate(n1.x, n2.x, p1.y, p2.y, y);
            var ny = this.interpolate(n1.y, n2.y, p1.y, p2.y, y);
            var nz = this.interpolate(n1.z, n2.z, p1.y, p2.y, y);
            var wx = this.interpolate(p1w.x, p2w.x, p1.y, p2.y, y);
            var wy = this.interpolate(p1w.y, p2w.y, p1.y, p2.y, y);
            var wz = this.interpolate(p1w.z, p2w.z, p1.y, p2.y, y);
            var lx = this.interpolate(l1.x, l2.x, p1.y, p2.y, y);
            var ly = this.interpolate(l1.y, l2.y, p1.y, p2.y, y);
            var lz = this.interpolate(l1.z, l2.z, p1.y, p2.y, y);

            var vertex = new Base.Vertex(0, 0, 0);
            vertex.normalInWorld = new BABYLON.Vector3(nx, ny, nz);
            vertex.projectPoint = new BABYLON.Vector3(x, y, z);
            vertex.pointInWorld = new BABYLON.Vector3(wx, wy, wz);
            vertex.pointInWorldToLightVector = new BABYLON.Vector3(lx, ly, lz);

            return vertex;
        }
        Device.prototype.interpolate = function (a_start, a_end, b_start, b_end, b) {
            var delta_a = a_end - a_start;
            var delta_b = b_end - b_start;
            return (b - b_start) * delta_a / delta_b + a_start;
        }
        Device.prototype.processScanTriangle = function (v1, v2, v3, v4, shader, border) {
            var p1 = v1.projectPoint;
            var p2 = v2.projectPoint;
            var p3 = v3.projectPoint;
            var p4 = v4.projectPoint;

            var sy = Math.round(p1.y)
            var ey = Math.round(p2.y)
            
            for (var y = sy; y <= ey; y += 1) {
                var sx = Math.round(this.interpolate(p1.x, p2.x, p1.y, p2.y, y));
                var sz = this.interpolate(p1.z, p2.z, p1.y, p2.y, y);

                var ex = Math.round(this.interpolate(p3.x, p4.x, p3.y, p4.y, y));
                var ez = this.interpolate(p3.z, p4.z, p3.y, p4.y, y);

                var iy = (ey == sy) ? 0 : ((y - sy) / (ey - sy));

                if (sx < ex) {
                    for (var x = sx; x <= ex; x++) {
                        var ix = (ex == sx) ? 0 : ((x - sx) / (ex - sx));
                        var z = this.interpolate(sz, ez, sx, ex, x);
                        var bDraw = (x == sx || x == ex || (y == sy && border != 2) || (y == ey && border != 1))
                        var color = shader.getColor(v1,v2,v3,v4,ix,iy,bDraw);
                        this.drawPoint(new BABYLON.Vector3(x, y, z), color);
                    }
                }
                else {
                    for (var x = sx; x >= ex; x--) {
                        var ix = (ex == sx) ? 0 : ((x - sx) / (ex - sx));
                        var z = this.interpolate(sz, ez, sx, ex, x);
                        var bDraw = (x == sx || x == ex || (y == sy && border != 2) || (y == ey && border != 1))
                        var color = shader.getColor(v1,v2,v3,v4,ix,iy,bDraw);
                        this.drawPoint(new BABYLON.Vector3(x, y, z), color);
                    }
                }
            }
        }
        Device.prototype.drawTriangle = function (v1, v2, v3, shader) {
            //对点进行排序，便于画三角
            var vertexList = [v1, v2, v3]
            vertexList.sort(function (i1, i2) {
                if (i1.projectPoint.y == i2.projectPoint.y) {
                    return i1.projectPoint.x < i2.projectPoint.x ? -1 : 1;
                }
                return i1.projectPoint.y < i2.projectPoint.y ? -1 : 1;
            })
            var p1 = vertexList[0].projectPoint;
            var p2 = vertexList[1].projectPoint;
            var p3 = vertexList[2].projectPoint;

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
                this.processScanTriangle(vertexList[0], vertexList[2], vertexList[1], vertexList[2], shader, 0);
            }
            else if (p3.y == p2.y) {
                this.processScanTriangle(vertexList[0], vertexList[2], vertexList[0], vertexList[1], shader, 0);
            }
            else {
                var dP1P2 = (p2.x - p1.x) / (p2.y - p1.y)
                var dP1P3 = (p3.x - p1.x) / (p3.y - p1.y)
                // type = dP1P2 > dP1P3 ? 4 : 3;
                var v = this.interpolateP3byP1P2(vertexList[0], vertexList[2], p2.y)
                var p = v.projectPoint;
                if (dP1P2 > dP1P3) { //type 4
                    this.processScanTriangle(vertexList[0], v, vertexList[0], vertexList[1], shader, 1);
                    this.processScanTriangle(v, vertexList[2], vertexList[1], vertexList[2], shader, 2);
                }
                else { //type3
                    this.processScanTriangle(vertexList[0], vertexList[1], vertexList[0], v, shader, 1);
                    this.processScanTriangle(vertexList[1], vertexList[2], v, vertexList[2], shader, 2);
                }
            }
        }
        Device.prototype.render = function (light, meshes) {
            var viewMatrix = BABYLON.Matrix.LookAtLH(this.camera.Position, this.camera.Target, BABYLON.Vector3.Up());
            var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);
            for (var index = 0; index < meshes.length; index++) {
                var cMesh = meshes[index];
                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z).multiply(BABYLON.Matrix.Translation(cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));
                var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                for (var index = 0; index < cMesh.Faces.length; index++) {
                    var currentFace = cMesh.Faces[index];
                    var v1 = cMesh.Vertices[currentFace.A];
                    var v2 = cMesh.Vertices[currentFace.B];
                    var v3 = cMesh.Vertices[currentFace.C];
                    this.project(v1, transformMatrix, worldMatrix);
                    this.project(v2, transformMatrix, worldMatrix);
                    this.project(v3, transformMatrix, worldMatrix);
                    var shader = new Base.Shader(v1, v2, v3, light, new BABYLON.Color4(1, 1, 1, 1));
                    this.drawTriangle(v1, v2, v3, shader);

                    // if(this.camera.Position.x == 0 && this.camera.Position.y == 0) {
                    //     console.log(vertexA.toString());
                    //     console.log(vertexB.toString());
                    //     console.log(vertexA.toString());
                    // }
                }
            }
        };
        return Device;
    })();
    SoftEngine.Device = Device;
})(SoftEngine || (SoftEngine = {}));
