!function(e, r) {
    if ("object" == typeof exports && "object" == typeof module) module.exports = r();
    else if ("function" == typeof define && define.amd) define([], r);
    else {
        var t = r();
        for (var n in t)("object" == typeof exports ? exports: e)[n] = t[n]
    }
} ("undefined" != typeof self ? self: this,
function() {
    return function(e) {
        function r(n) {
            if (t[n]) return t[n].exports;
            var o = t[n] = {
                i: n,
                l: !1,
                exports: {}
            };
            return e[n].call(o.exports, o, o.exports, r),
            o.l = !0,
            o.exports
        }
        var t = {};
        return r.m = e,
        r.c = t,
        r.d = function(e, t, n) {
            r.o(e, t) || Object.defineProperty(e, t, {
                configurable: !1,
                enumerable: !0,
                get: n
            })
        },
        r.n = function(e) {
            var t = e && e.__esModule ?
            function() {
                return e.
            default
            }:
            function() {
                return e
            };
            return r.d(t, "a", t),
            t
        },
        r.o = function(e, r) {
            return Object.prototype.hasOwnProperty.call(e, r)
        },
        r.p = "",
        r(r.s = 0)
    } ([function(e, r, t) {
        "use strict";
        function n(e) {
            return (0, i.
        default)({
                type:
                "FeatureCollection",
                features: e
            },
            "z")
        }
        Object.defineProperty(r, "__esModule", {
            value: !0
        }),
        r.tin = n;
        var o = t(1),
        i = function(e) {
            return e && e.__esModule ? e: {
            default:
                e
            }
        } (o)
    },
    function(e, r, t) {
        "use strict";
        function n(e, r) {
            var t = !1;
            return s.featureCollection(a(e.features.map(function(e) {
                var n = {
                    x: e.geometry.coordinates[0],
                    y: e.geometry.coordinates[1]
                };
                return r ? n.z = e.properties[r] : 3 === e.geometry.coordinates.length && (t = !0, n.z = e.geometry.coordinates[2]),
                n
            })).map(function(e) {
                var r = [e.a.x, e.a.y],
                n = [e.b.x, e.b.y],
                o = [e.c.x, e.c.y],
                i = {};
                return t ? (r.push(e.a.z), n.push(e.b.z), o.push(e.c.z)) : i = {
                    a: e.a.z,
                    b: e.b.z,
                    c: e.c.z
                },
                s.polygon([[r, n, o, r]], i)
            }))
        }
        function o(e, r) {
            return r.x - e.x
        }
        function i(e) {
            var r, t, n, o, i, a = e.length;
            e: for (; a;) for (t = e[--a], r = e[--a], n = a; n;) if (i = e[--n], o = e[--n], r === o && t === i || r === i && t === o) {
                e.splice(a, 2),
                e.splice(n, 2),
                a -= 2;
                continue e
            }
        }
        function a(e) {
            if (e.length < 3) return [];
            e.sort(o);
            for (var r, t, n, a, s, c, l = e.length - 1,
            d = e[l].x, f = e[0].x, h = e[l].y, m = h; l--;) e[l].y < h && (h = e[l].y),
            e[l].y > m && (m = e[l].y);
            var y, g = f - d,
            p = m - h,
            b = g > p ? g: p,
            v = .5 * (f + d),
            w = .5 * (m + h),
            x = [new u({
                __sentinel: !0,
                x: v - 20 * b,
                y: w - b
            },
            {
                __sentinel: !0,
                x: v,
                y: w + 20 * b
            },
            {
                __sentinel: !0,
                x: v + 20 * b,
                y: w - b
            })],
            E = [],
            R = [];
            for (l = e.length; l--;) {
                for (R.length = 0, y = x.length; y--;) g = e[l].x - x[y].x,
                g > 0 && g * g > x[y].r ? (E.push(x[y]), x.splice(y, 1)) : (p = e[l].y - x[y].y, g * g + p * p > x[y].r || (R.push(x[y].a, x[y].b, x[y].b, x[y].c, x[y].c, x[y].a), x.splice(y, 1)));
                for (i(R), y = R.length; y;) t = R[--y],
                r = R[--y],
                n = e[l],
                a = t.x - r.x,
                s = t.y - r.y,
                c = 2 * (a * (n.y - t.y) - s * (n.x - t.x)),
                Math.abs(c) > 1e-12 && x.push(new u(r, t, n))
            }
            for (Array.prototype.push.apply(E, x), l = E.length; l--;)(E[l].a.__sentinel || E[l].b.__sentinel || E[l].c.__sentinel) && E.splice(l, 1);
            return E
        }
        Object.defineProperty(r, "__esModule", {
            value: !0
        });
        var s = t(2);
        r.
    default = n;
        var u = function() {
            function e(e, r, t) {
                this.a = e,
                this.b = r,
                this.c = t;
                var n, o, i = r.x - e.x,
                a = r.y - e.y,
                s = t.x - e.x,
                u = t.y - e.y,
                c = i * (e.x + r.x) + a * (e.y + r.y),
                l = s * (e.x + t.x) + u * (e.y + t.y),
                d = 2 * (i * (t.y - r.y) - a * (t.x - r.x));
                this.x = (u * c - a * l) / d,
                this.y = (i * l - s * c) / d,
                n = this.x - e.x,
                o = this.y - e.y,
                this.r = n * n + o * o
            }
            return e
        } ()
    },
    function(e, r, t) {
        "use strict";
        function n(e, r, t) {
            void 0 === t && (t = {});
            var n = {
                type: "Feature"
            };
            return (0 === t.id || t.id) && (n.id = t.id),
            t.bbox && (n.bbox = t.bbox),
            n.properties = r || {},
            n.geometry = e,
            n
        }
        function o(e, r, t) {
            switch (void 0 === t && (t = {}), e) {
            case "Point":
                return i(r).geometry;
            case "LineString":
                return c(r).geometry;
            case "Polygon":
                return s(r).geometry;
            case "MultiPoint":
                return h(r).geometry;
            case "MultiLineString":
                return f(r).geometry;
            case "MultiPolygon":
                return m(r).geometry;
            default:
                throw new Error(e + " is invalid")
            }
        }
        function i(e, r, t) {
            return void 0 === t && (t = {}),
            n({
                type: "Point",
                coordinates: e
            },
            r, t)
        }
        function a(e, r, t) {
            return void 0 === t && (t = {}),
            d(e.map(function(e) {
                return i(e, r)
            }), t)
        }
        function s(e, r, t) {
            void 0 === t && (t = {});
            for (var o = 0,
            i = e; o < i.length; o++) {
                var a = i[o];
                if (a.length < 4) throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
                for (var s = 0; s < a[a.length - 1].length; s++) if (a[a.length - 1][s] !== a[0][s]) throw new Error("First and last Position are not equivalent.")
            }
            return n({
                type: "Polygon",
                coordinates: e
            },
            r, t)
        }
        function u(e, r, t) {
            return void 0 === t && (t = {}),
            d(e.map(function(e) {
                return s(e, r)
            }), t)
        }
        function c(e, r, t) {
            if (void 0 === t && (t = {}), e.length < 2) throw new Error("coordinates must be an array of two or more positions");
            return n({
                type: "LineString",
                coordinates: e
            },
            r, t)
        }
        function l(e, r, t) {
            return void 0 === t && (t = {}),
            d(e.map(function(e) {
                return c(e, r)
            }), t)
        }
        function d(e, r) {
            void 0 === r && (r = {});
            var t = {
                type: "FeatureCollection"
            };
            return r.id && (t.id = r.id),
            r.bbox && (t.bbox = r.bbox),
            t.features = e,
            t
        }
        function f(e, r, t) {
            return void 0 === t && (t = {}),
            n({
                type: "MultiLineString",
                coordinates: e
            },
            r, t)
        }
        function h(e, r, t) {
            return void 0 === t && (t = {}),
            n({
                type: "MultiPoint",
                coordinates: e
            },
            r, t)
        }
        function m(e, r, t) {
            return void 0 === t && (t = {}),
            n({
                type: "MultiPolygon",
                coordinates: e
            },
            r, t)
        }
        function y(e, r, t) {
            return void 0 === t && (t = {}),
            n({
                type: "GeometryCollection",
                geometries: e
            },
            r, t)
        }
        function g(e, r) {
            if (void 0 === r && (r = 0), r && !(r >= 0)) throw new Error("precision must be a positive number");
            var t = Math.pow(10, r || 0);
            return Math.round(e * t) / t
        }
        function p(e, t) {
            void 0 === t && (t = "kilometers");
            var n = r.factors[t];
            if (!n) throw new Error(t + " units is invalid");
            return e * n
        }
        function b(e, t) {
            void 0 === t && (t = "kilometers");
            var n = r.factors[t];
            if (!n) throw new Error(t + " units is invalid");
            return e / n
        }
        function v(e, r) {
            return x(b(e, r))
        }
        function w(e) {
            var r = e % 360;
            return r < 0 && (r += 360),
            r
        }
        function x(e) {
            return e % (2 * Math.PI) * 180 / Math.PI
        }
        function E(e) {
            return e % 360 * Math.PI / 180
        }
        function R(e, r, t) {
            if (void 0 === r && (r = "kilometers"), void 0 === t && (t = "kilometers"), !(e >= 0)) throw new Error("length must be a positive number");
            return p(b(e, r), t)
        }
        function _(e, t, n) {
            if (void 0 === t && (t = "meters"), void 0 === n && (n = "kilometers"), !(e >= 0)) throw new Error("area must be a positive number");
            var o = r.areaFactors[t];
            if (!o) throw new Error("invalid original units");
            var i = r.areaFactors[n];
            if (!i) throw new Error("invalid final units");
            return e / o * i
        }
        function P(e) {
            return ! isNaN(e) && null !== e && !Array.isArray(e) && !/^\s*$/.test(e)
        }
        function M(e) {
            return !! e && e.constructor === Object
        }
        function T(e) {
            if (!e) throw new Error("bbox is required");
            if (!Array.isArray(e)) throw new Error("bbox must be an Array");
            if (4 !== e.length && 6 !== e.length) throw new Error("bbox must be an Array of 4 or 6 numbers");
            e.forEach(function(e) {
                if (!P(e)) throw new Error("bbox must only contain numbers")
            })
        }
        function k(e) {
            if (!e) throw new Error("id is required");
            if ( - 1 === ["string", "number"].indexOf(typeof e)) throw new Error("id must be a number or a string")
        }
        function z() {
            throw new Error("method has been renamed to radiansToDegrees")
        }
        function A() {
            throw new Error("method has been renamed to degreesToRadians")
        }
        function j() {
            throw new Error("method has been renamed to lengthToDegrees")
        }
        function L() {
            throw new Error("method has been renamed to lengthToRadians")
        }
        function O() {
            throw new Error("method has been renamed to radiansToLength")
        }
        function F() {
            throw new Error("method has been renamed to bearingToAzimuth")
        }
        function D() {
            throw new Error("method has been renamed to convertLength")
        }
        Object.defineProperty(r, "__esModule", {
            value: !0
        }),
        r.earthRadius = 6371008.8,
        r.factors = {
            centimeters: 100 * r.earthRadius,
            centimetres: 100 * r.earthRadius,
            degrees: r.earthRadius / 111325,
            feet: 3.28084 * r.earthRadius,
            inches: 39.37 * r.earthRadius,
            kilometers: r.earthRadius / 1e3,
            kilometres: r.earthRadius / 1e3,
            meters: r.earthRadius,
            metres: r.earthRadius,
            miles: r.earthRadius / 1609.344,
            millimeters: 1e3 * r.earthRadius,
            millimetres: 1e3 * r.earthRadius,
            nauticalmiles: r.earthRadius / 1852,
            radians: 1,
            yards: r.earthRadius / 1.0936
        },
        r.unitsFactors = {
            centimeters: 100,
            centimetres: 100,
            degrees: 1 / 111325,
            feet: 3.28084,
            inches: 39.37,
            kilometers: .001,
            kilometres: .001,
            meters: 1,
            metres: 1,
            miles: 1 / 1609.344,
            millimeters: 1e3,
            millimetres: 1e3,
            nauticalmiles: 1 / 1852,
            radians: 1 / r.earthRadius,
            yards: 1 / 1.0936
        },
        r.areaFactors = {
            acres: 247105e-9,
            centimeters: 1e4,
            centimetres: 1e4,
            feet: 10.763910417,
            inches: 1550.003100006,
            kilometers: 1e-6,
            kilometres: 1e-6,
            meters: 1,
            metres: 1,
            miles: 3.86e-7,
            millimeters: 1e6,
            millimetres: 1e6,
            yards: 1.195990046
        },
        r.feature = n,
        r.geometry = o,
        r.point = i,
        r.points = a,
        r.polygon = s,
        r.polygons = u,
        r.lineString = c,
        r.lineStrings = l,
        r.featureCollection = d,
        r.multiLineString = f,
        r.multiPoint = h,
        r.multiPolygon = m,
        r.geometryCollection = y,
        r.round = g,
        r.radiansToLength = p,
        r.lengthToRadians = b,
        r.lengthToDegrees = v,
        r.bearingToAzimuth = w,
        r.radiansToDegrees = x,
        r.degreesToRadians = E,
        r.convertLength = R,
        r.convertArea = _,
        r.isNumber = P,
        r.isObject = M,
        r.validateBBox = T,
        r.validateId = k,
        r.radians2degrees = z,
        r.degrees2radians = A,
        r.distanceToDegrees = j,
        r.distanceToRadians = L,
        r.radiansToDistance = O,
        r.bearingToAngle = F,
        r.convertDistance = D
    }])
});