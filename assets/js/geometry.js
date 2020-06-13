import { createShader, createProgram } from "/assets/js/gfx.js";

let vertexShaderResource = fetch("/assets/sl/geometry.vert");
let fragmentShaderResource = fetch("/assets/sl/geometry.frag");

let objects = [];

export class Geometry {
    constructor(gl) {
        this.gl = gl;
        this.objects = [];
    }

    async drawGeometry() {
        var gl = this.gl;
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, await vertexShaderResource.then(response => response.text()));
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, await fragmentShaderResource.then(response => response.text()));
        var program = createProgram(gl, vertexShader, fragmentShader);
    
        var matrixAttributeLocation = gl.getUniformLocation(program, "u_matrix");
    
        requestAnimationFrame(drawScene);
    
        function drawScene(now) {
            now /= 1000;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
            gl.clearColor(0, 0, 0, 255);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
    
            gl.useProgram(program);
            var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    
            /*var transform = angleAxis(0, [0, 0, 1]);
            transform = mulMatrix(perspectiveProjection(1000, 0.01, Math.PI / 2, 1), expandMatrix(transform, 1, 1));
            transform = toFlatMatrix(transform);*/
            var cameraTransform = identity(4);
            cameraTransform = mulMatrix(translation([0, 0, Math.sin(now) - 3]), cameraTransform);
            cameraTransform = mulMatrix(angleAxis(0, [0, 1, 0]), cameraTransform);
            cameraTransform = mulMatrix(perspectiveProjection(20, 0.01, Math.PI / 4, 1), cameraTransform);
    
            gl.uniformMatrix4fv(matrixAttributeLocation, false, toFlatMatrix(cameraTransform));
            drawCircle(gl, 1, mulMatrix(angleAxis(0, [0, 1, 0]), translation([0, 0, 10])), positionAttributeLocation);
    
            requestAnimationFrame(drawScene);
        }
    }

    addObject(a) {
        this.objects.push(a);
        return a;
    }
      
    createPoint(a) {
        return this.addObject({
            type: "pointObject",
            tuple: a
        });
    }
    
    createLineSegment(a, b) {
        return this.addObject({
            type: "lineSegmentObject",
            a: a,
            b: b
        });
    }
    
    createCircleRadius(radius) {
        return this.addObject({
            type: "circleRadiusObject",
            radius: radius
        });
    }
    
    createAxisRadiusCircle(axis, radius) {
        return this.addObject({
            type: "axisRadiusCircleObject",
            axis: axis,
            radius: radius
        });
    }
    
    createPointOnCircle(circle, normalAxis, referenceAxis, angle) {
        return this.addObject({
            type: "pointOnCircleObject",
            circle: circle,
            normalAxis: normalAxis,
            referenceAxis: referenceAxis,
            angle: angle
        });
    }
    
    createAxisPointCircle(axis, point) {
        return this.addObject({
            type: "axisPointCircleObject",
            axis: axis,
            point: point
        });
    }
}

export function drawCircle(gl, radius, transform, location) {
    var points = [];

    for (var i = 0; i < 64; i++) {
        var a = columnVector(
            Math.cos(i / 64 * 2 * Math.PI) * radius,
            -Math.sin(i / 64 * 2 * Math.PI) * radius,
            0,
            1);

        a = column(mulMatrix(transform, a)).slice(0, 3);

        points.push(...a);
        //points.push(...b);
    }

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(location);

    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, points.length / 3);
    gl.deleteBuffer(positionBuffer);
    gl.deleteVertexArray(vao);

}

function vectorFrom(object) {
  switch (object.type) {
    case "pointObject": {
      return object.tuple;
    }

    case "pointOnCircleObject": {
      var circle = circleFrom(object.circle);
      var angle = object.angle;
      var normalAxisUnit = normalize(vectorFrom(object.normalAxis));
      var referenceAxisUnit = normalize(vectorFrom(object.referenceAxis));
      var pointVector = mulMatrix(
        angleAxis(angle, normalAxisUnit),
        toColumnVector(mulVector(referenceAxisUnit, circle.radius)));
      return column(pointVector);
    }

    case "lineSegmentObject": {
      return subVector(vectorFrom(object.b), vectorFrom(object.a));
    }
  }
}

function normalOf(object) {
  switch(object.type) {
    case "axisRadiusCircleObject":
      return normalize(vectorFrom(object.axis));
    
    case "axisPointCircleObject":
      var onPlane = normalize(vectorFrom(object.point));
      return normalize(crossProduct(onPlane, vectorFrom(object.axis)))
  }
}

function circleFrom(object) {
  switch(object.type) {
    case "axisRadiusCircleObject": {
      var target = normalOf(object);
      return {
        radius: object.radius,
        transform: lookAt(zAxis3, target)
      }
    }
    
    case "axisPointCircleObject": {
      var pointVector = vectorFrom(object.point);
      var radius = length(pointVector);
      var target = normalOf(object);
      var transform = lookAt(zAxis3, target);
      
      // After transforming our circle to lie on the plane normal to the target
      // center axis, we need to reorient on this plane so that the arc distances
      // from points on the circle are now relative to the through-point.
      
      // Get our x basis after applying lookAt. It is on the correct plane, but it
      // will always be parallel with the xz plane at this point.
      // var transformedRight = column(mulMatrix(transform, columnVector(radius, 0, 0)));
      
      // To fix that, we just need to apply a rotation about an angle on the plane
      // so that from the perspective of the reference coordinate system, our local
      // x axis is the same as the through-point.
      
      // The cross product of two vectors will give us the signed angle between them.
      // The magnitude of the cross product is the unsigned angle, and we can
      // determine the sign by the direction, whether it points out of the plane
      // or into it.
      
      // var ortho = crossProduct(normalize(transformedRight), normalize(pointVector));
      // var angleFromXToThroughPoint = aMath.sin(length(ortho));
      
      // Math.Since ortho is already normal to the plane, this can (mathematically)
      // only give us two values. The angle is zero if they have the same direction,
      // or pi if they have opposite direction.
      /*var angleFromCrossToPlaneNormal = aMath.sin(length(crossProduct(ortho, target)));
      
      if(angleFromCrossToPlaneNormal > PI / 2) {
        angleFromXToThroughPoint = 2 * PI -angleFromXToThroughPoint;
        console.log(angleFromCrossToPlaneNormal);
      }*/
      
      //console.log(angleFromXToThroughPoint);
      //console.log(angleFromCrossToPlaneNormal);
            
      return {
        radius: radius,
        transform: transform
      };
    }
  }
}

let xAxis3 = [1, 0, 0];
let yAxis3 = [0, 1, 0];
let zAxis3 = [0, 0, 1];

function iterExpr() {
  if (arguments.length > 0) {
    return {
      value: arguments[0],
      done: false
    };
  }

  return {
    done: true
  };
}

function makeIter(a) {
  a[Symbol.iterator] = () => a;
  return a;
}

function iterRange() {
  var start, count;

  if (arguments.length < 2) {
    start = 0;
    count = arguments[0];
  } else {
    start = arguments[0];
    count = arguments[1];
  }

  var index = start;
  var limit = start + count;

  return makeIter({
    next: () => {
      if (index < limit) {
        return iterExpr(index++);
      }

      return iterExpr();
    }
  });
}

function* iterMap(it, fun) {
  for (var e of it) {
    yield fun(e);
  }
}

function iterFold(it, acc, fun) {
  for (var e of it) {
    acc = fun(acc, e);
  }

  return acc;
}

function iterLazy(it, def, fun) {
  for (var e of it) {
    var res = fun(e);

    if (res.length > 0) {
      return res[0];
    }
  }

  return def;
}

function* iterStructure(it) {
  for(var e of it) {
    if(e != null && typeof e[Symbol.iterator] === 'function') {
      var inner = iterStructure(e)
      for(var f of inner) {
        yield f;
      }
    } else {
      yield e;
    }
  }
}

function vectorEqual(a, b) {
  var pairs = iterMap(iterRange(a.length), i => [a[i], b[i]]);
  return iterLazy(pairs, true, e => e[0] == e[1] ? [] : [false]);
}

function length(a) {
  return sqrt(iterFold(a, 0, (acc, val) => acc + val * val));
}

function mulVector(a, x) {
  return a.map(val => val * x);
}

function addVector(a, b) {
  return Array.from(iterMap(iterRange(a.length), i => a[i] + b[i]));
}

function subVector(a, b) {
  return Array.from(iterMap(iterRange(a.length), i => a[i] - b[i]));
}

function normalize(a) {
  return mulVector(a, 1 / length(a));
}

function crossProduct(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function row(a, i = 0) {
  return a[i].slice();
}

function column(a, j = 0) {
  var result = [];

  for (var i = 0; i < a.length; i++) {
    result[i] = a[i][j];
  }

  return result;
}

function columnVector() {
  return transpose([arguments]);
}

function toColumnVector(a) {
  return transpose([a]);
}

function toFlatMatrix(a) {
  return Array.from(iterStructure(a));
}

function expandMatrix(a, m, n = 0) {
  var rowCount = a.length;
  var columnCount = a[0].length;
  return a.map((rowVector, i) =>
    rowVector
      .concat(Array.from(iterMap(iterRange(columnCount, n), j =>
        i == j ? 1 : 0))))
    .concat(Array.from(iterMap(iterRange(rowCount, m), i =>
      Array.from(iterMap(iterRange(columnCount + n), j =>
        i == j ? 1 : 0)))));
}

function transpose(a) {
  var m = a.length;
  var n = a[0].length;
  return Array.from(iterMap(iterRange(n), i => column(a, i)));
}

export function identity(d) {
  var result = [];

  for (var i = 0; i < d; i++) {
    result[i] = [];
    for (var j = 0; j < d; j++) {
      result[i][j] = i == j ? 1 : 0;
    }
  }

  return result;
}

function translation(a) {
    return [
        [1, 0, 0, a[0]],
        [0, 1, 0, a[1]],
        [0, 0, 1, a[2]],
        [0, 0, 0, 1],
    ];
}

function angleAxis(angle, axis) {
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var t = 1 - c;

  return [
    [t * x * x + c, t * x * y - z * s, t * x * z + y * s, 0],
    [t * x * y + z * s, t * y * y + c, t * y * z - x * s, 0],
    [t * x * z - y * s, t * y * z + x * s, t * z * z + c, 0],
    [0, 0, 0, 1]
  ];
}

function perspectiveProjection(far, near, fov, aspectRatio) {
    var s = 1 / Math.tan(fov);
    /*return [
        [s, 0, 0, 0,],
        [0, s * aspectRatio, 0, 0],
        [0, 0, far / (far - near), -1],
        [0, 0, -far * near / (far - near), 0]
    ];*/
    var f = Math.tan(fov);
    var rangeInv = 1.0 / (near - far);

    return [
        [f / aspectRatio, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (near + far) * rangeInv, -1],
        [0, 0, near * far * rangeInv * 2, 0],
    ];

    /*return [
        [s, 0, 0, 0],
        [0, s, 0, 0],
        [0, 0, -far / (far - near), -far * near / (far - near)],
        [0, 0, -1, 0],
    ];*/
}

function lookAt(eye, direction) {
  if (vectorEqual(direction, eye)) {
    direction[0] = 1E-20;
  }

  var axis = crossProduct(eye, direction);
  var angle = aMath.cos(dotProduct(eye, direction));
  return angleAxis(angle, normalize(axis));
}

function dotProduct(a, b) {
  var sum = 0;

  for (var i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
}

function mulMatrix(a, b) {
  var m = a.length;
  var n = b[0].length;
  var result = [];

  for (var i = 0; i < m; i++) {
    result[i] = [];
    for (var j = 0; j < n; j++) {
      result[i][j] = dotProduct(row(a, i), column(b, j));
    }
  }

  return result;
}