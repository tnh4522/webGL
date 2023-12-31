var canvas = document.getElementById('my_Canvas');
gl = canvas.getContext('experimental-webgl');

/*========== Defining and storing the geometry ==========*/

var vertices = new Array(72).fill(0);

var colors = [
    5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
    1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
];

var indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
];

/* Create and store data into buffers */
// Vertex buffer
var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Color buffer
var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Index buffer
var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

/*=================== SHADERS =================== */
var vertCode = 'attribute vec3 position;' +
    'uniform mat4 Pmatrix;' +
    'uniform mat4 Vmatrix;' +
    'uniform mat4 Mmatrix;' +
    'attribute vec3 color;' +
    'varying vec3 vColor;' +
    'void main(void) { ' +
    'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);' +
    'vColor = color;' +
    '}';

var fragCode = 'precision mediump float;' +
    'varying vec3 vColor;' +
    'void main(void) {' +
    'gl_FragColor = vec4(vColor, 1.);' +
    '}';

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

var shaderprogram = gl.createProgram();
gl.attachShader(shaderprogram, vertShader);
gl.attachShader(shaderprogram, fragShader);
gl.linkProgram(shaderprogram);


/*======== Associating attributes to vertex shader =====*/
var _Pmatrix = gl.getUniformLocation(shaderprogram, "Pmatrix");
var _Vmatrix = gl.getUniformLocation(shaderprogram, "Vmatrix");
var _Mmatrix = gl.getUniformLocation(shaderprogram, "Mmatrix");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var _position = gl.getAttribLocation(shaderprogram, "position");
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var _color = gl.getAttribLocation(shaderprogram, "color");
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(_color);
gl.useProgram(shaderprogram);

/*==================== MATRIX ====================== */
function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * .5) * Math.PI / 180);
    return [
        0.5 / ang, 0, 0, 0,
        0, 0.5 * a / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
}

var proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);
var mo_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

view_matrix[14] = view_matrix[14] - 6;

/*==================== Drawing =================== */

var animate = function (time) {
    var rotationMatrix = getRotationMatrix(theta, 'y');
    mo_matrix = multiplyMatrices(rotationMatrix, mo_matrix);

    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

    mo_matrix[0] = 1, mo_matrix[1] = 0, mo_matrix[2] = 0, mo_matrix[3] = 0,
        mo_matrix[4] = 0, mo_matrix[5] = 1, mo_matrix[6] = 0, mo_matrix[7] = 0,
        mo_matrix[8] = 0, mo_matrix[9] = 0, mo_matrix[10] = 1, mo_matrix[11] = 0,
        mo_matrix[12] = 0, mo_matrix[13] = 0, mo_matrix[14] = 0, mo_matrix[15] = 1;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(animate);
}
animate(0);

function updateCubeSize() {
    var edgeLength = parseFloat(document.getElementById('edgeLength').value);
    if (isNaN(edgeLength) || edgeLength <= 0) {
        alert("Vui lòng nhập một số hợp lệ cho cạnh a.");
        return;
    }

    var halfEdge = edgeLength / 2;

    vertices = [
        -halfEdge, -halfEdge, halfEdge, halfEdge, -halfEdge, halfEdge, halfEdge, halfEdge, halfEdge, -halfEdge, halfEdge, halfEdge,
        -halfEdge, -halfEdge, -halfEdge, -halfEdge, halfEdge, -halfEdge, halfEdge, halfEdge, -halfEdge, halfEdge, -halfEdge, -halfEdge,
        -halfEdge, halfEdge, -halfEdge, -halfEdge, halfEdge, halfEdge, halfEdge, halfEdge, halfEdge, halfEdge, halfEdge, -halfEdge,
        -halfEdge, -halfEdge, -halfEdge, halfEdge, -halfEdge, -halfEdge, halfEdge, -halfEdge, halfEdge, -halfEdge, -halfEdge, halfEdge,
        halfEdge, -halfEdge, -halfEdge, halfEdge, halfEdge, -halfEdge, halfEdge, halfEdge, halfEdge, halfEdge, -halfEdge, halfEdge,
        -halfEdge, -halfEdge, -halfEdge, -halfEdge, -halfEdge, halfEdge, -halfEdge, halfEdge, halfEdge, -halfEdge, halfEdge, -halfEdge
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    animate(0);
}
var theta = 0; // Biến lưu trữ góc quay

function updateRotation() {
    theta = parseFloat(document.getElementById('rotationAngle').value);
    if (isNaN(theta)) {
        alert("Vui lòng nhập một số hợp lệ cho góc theta.");
        return;
    }
    animate(0);
}

function getRotationMatrix(theta, axis) {
    var rad = theta * Math.PI / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    if (axis === 'x') {
        return [
            1, 0, 0, 0,
            0, cos, -sin, 0,
            0, sin, cos, 0,
            0, 0, 0, 1
        ];
    } else if (axis === 'y') {
        return [
            cos, 0, sin, 0,
            0, 1, 0, 0,
            -sin, 0, cos, 0,
            0, 0, 0, 1
        ];
    } else { // Quay quanh trục z hoặc trục khác
        return [
            cos, -sin, 0, 0,
            sin, cos, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
}
function multiplyMatrices(m1, m2) {
    var result = [];
    for (var i = 0; i < m1.length; i += 4) {
        for (var j = 0; j < 4; j++) {
            result[i + j] =
                m1[i] * m2[j] +
                m1[i + 1] * m2[j + 4] +
                m1[i + 2] * m2[j + 8] +
                m1[i + 3] * m2[j + 12];
        }
    }
    return result;
}

