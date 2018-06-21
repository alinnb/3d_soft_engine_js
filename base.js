define(function() {
    'use strict';

    console.log("loading bbbb")
    
    var Base;
    // Vector3
    (function(base) {
        var Vector3 = function() {
            function Vector3(x, y, z) {
                this.x = x
                this.y = y
                this.z = z
            }

            Vector3.Zero = function() {
                return (new Vector3(0,0,0));
            }

            return Vector3;
        }();

        Base.Vector3 = Vector3;

    })(Base || (Base = {}));

    //Transform
    (function(base) {
        var Transform = function() {
            function Transform(positon_v3, rotation_v3, scale_v3) {
                this.positon = positon_v3
                this.rotation_v3 = rotation_v3
                this.scale_v3 = scale_v3
            }

            return Transform;
        }();

        Base.Transform = Transform;

    })(Base || (Base = {}));

    // Matrix
    (function(base) {
        var Matrix4x4 = function() {
            function Matrix4x4() {
                this.m = new Array(16)
            }
            
            Matrix4x4.Zero = function() {
                var mat = new Matrix4x4();
                for (i = 0; i < mat.len; i++) {
                    mat.m[i] = 0;
                }
                return mat;
            }

            Matrix4x4.prototype.toArray = function () {
                return this.m;
            };
            
            Matrix4x4.prototype.multi = function(mat) {
                var result = new Matrix4x4();
                for (i = 0; i < 16; i++) {
                    result.m[i] = self.m[i] + mat.m[i];
                }
                return result;
            }

            return Matrix4x4;
        }();


        Base.Matrix4x4 = Matrix4x4;

    })(Base || (Base = {}));

    return Base
});