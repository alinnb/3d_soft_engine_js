var Base;
(function (Base) {
    // Triangle
    var Triangle = (function () {
        function Triangle(p1, p2, p3) {
            this.p1 = p1;
            this.p2 = p2;
            this.p3 = p3;
        }

        Triangle.prototype.sort = function () {
            p = [this.p1, this.p2, this.p3]
            p.sort(function (p1, p2) {
                if (p1.y == p2.y) {
                    return p1.x < p2.x ? -1 : 1;
                }
                return p1.y < p2.y ? -1 : 1;
            })
            this.point_top = p[0]
            this.point_center = p[1]
            this.point_bottom = p[2]
        };

        // TYPE1                 TYPE2：           TYPE3          TYPE4
        // P1 .......... P2       P1 .            P1  .            P1 .
        //     .      .             . .             . .               . .
        //      .    .             .   .        P2.   .               .   .P2
        //       . .              .     .           . .               . .
        //        .              .........            .               .
        //        P3           P3         P2          P3             P3
        // if true, p2 on right of p1p3, else p2 on left
        Triangle.prototype.type = function () {
            if (this.point_top.y == this.point_center.y) {
                return 1;
            }
            else if (this.point_bottom.y == this.point_center.y) {
                return 2;
            }
            else {
                dP1P2 = (this.point_center.x - this.point_top.x) / (this.point_center.y - this.point_top.y)
                dP1P3 = (this.point_bottom.x - this.point_top.x) / (this.point_bottom.y - this.point_top.y)
                return dP1P2 > dP1P3 ? 4 : 3;
            }
        }

        //已知P1， P2点，P3Y坐标，差值P3X P3Z
        Triangle.prototype.interpolateP3byP1P2 = function(p1, p2, p3y) {
            delta_x = p2.x - p1.x;
            delta_y = p2.y - p1.y;
            delta_z = p2.z - p1.z;
            //已知p3.Y
            var p3x = (p3y - p1.y) * delta_x / delta_y + p1.x;
            var p3z = (p3y - p1.y) * delta_z / delta_y + p1.z;
            return new BABYLON.Vector3(p3x, p3y, p3z)
        }

        Triangle.prototype.processScanLine = function* () {
            var testYGap = 1
            switch (this.type()) {
                case 1://平顶三角形
                    for(var y = this.point_top.y; y < this.point_bottom.y; y+=testYGap) {
                        var ps = this.interpolateP3byP1P2(this.point_top, this.point_bottom, y)
                        var pe = this.interpolateP3byP1P2(this.point_center, this.point_bottom, y)
                        yield {point1:ps, point2:pe};
                    }
                    break;
                case 2://平底三角形
                    for(var y = this.point_top.y; y < this.point_bottom.y; y+=testYGap) {
                        var ps = this.interpolateP3byP1P2(this.point_top, this.point_bottom, y)
                        var pe = this.interpolateP3byP1P2(this.point_top, this.point_center, y)
                        yield {point1:ps, point2:pe};
                    }
                    break;
                case 3://2+1 p2 left
                    var py = this.point_center.y
                    ////平底三角形
                    for(var y = this.point_top.y; y < py; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(this.point_top, this.point_bottom, y)
                        var pe = this.interpolateP3byP1P2(this.point_top, this.point_center, y)
                        yield {point1:ps, point2:pe};
                    }
                    //平顶三角形
                    for(var y = py; y < this.point_bottom.y; y+=testYGap) {
                        var ps = this.interpolateP3byP1P2(this.point_center, this.point_bottom, y)
                        var pe = this.interpolateP3byP1P2(this.point_top, this.point_bottom, y)
                        yield {point1:ps, point2:pe};
                    }
                    break;
                case 4://2+1 p2 right
                    var py = this.point_center.y
                    //平底三角形
                    for(var y = this.point_top.y; y < py; y += testYGap) {
                        var ps = this.interpolateP3byP1P2(this.point_top, this.point_bottom, y)
                        var pe = this.interpolateP3byP1P2(this.point_top, this.point_center, y)
                        yield {point1:ps, point2:pe};
                    }
                    //平顶三角形
                    for(var y = py; y < this.point_bottom.y; y+=testYGap) {
                        var ps = this.interpolateP3byP1P2(this.point_top, this.point_bottom, y)
                        var pe = this.interpolateP3byP1P2(this.point_center, this.point_bottom, y)
                        yield {point1:ps, point2:pe};
                    }
                    break;
            }
            return;
        }

        Triangle.prototype.toString = function () {
            return 'top' + this.point_top.toString() + ' center' + this.point_center.toString() + ' bottom' + this.point_bottom.toString();
        }

        return Triangle;
    })();

    Base.Triangle = Triangle;

})(Base || (Base = {}))

// test
// var t = new Base.Triangle(new BABYLON.Vector2(2, 2), new BABYLON.Vector2(1, 2), new BABYLON.Vector2(1, 3))
// t.sort()
// var f = t.ProcessScanLine()
// for(var p in f.next()) {
//     console.log(p.x,p.y)
// }
// var x,y = f()
// console.log(x,y)
// // console.log(t.toString(), t.type())

// for (i = 0; i < 10 ;i++) {
//     var p1 = new BABYLON.Vector2(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10));
//     var p2 = new BABYLON.Vector2(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10));
//     var p3 = new BABYLON.Vector2(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10));
//     var t = new Base.Triangle(p1, p2, p3)
//     t.sort()
//     var f = t.ProcessScanLine()
//     do {
//         var p = f.next()
//         if (p.done) {
//             break;
//         }
//         console.log(p.value.point1.x, p.value.point1.y, p.value.point2.x, p.value.point2.y)
//     } while(!p.done)
// }
