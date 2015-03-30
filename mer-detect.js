/**
 * 八邻域泛洪
 *
 * @param {Number} x - X
 * @param {Number} y - Y
 * @param {Number} w - Width
 * @param {Number} h - Height
 * @param {Function} test - Test function, test([this, top, right, bottom, left]) (each is canvasPixelIndex), should return bool
 * @param {Function} op - Will call op(x, y), if test passed
 */
var floodFill = function(x, y, w, h, test, op) {

    var queue = [{x: x, y: y}];

    var mem = {};

    while (queue.length > 0) {

        var pixel = queue.pop();
        x = pixel.x;
        y = pixel.y;

        var canvasPixelIndex = (y * w + x - 1) * 4;
        var neighbors = [
            {x: x - 1, y: y - 1},
            {x: x - 1, y: y + 1},
            {x: x + 1, y: y - 1},
            {x: x + 1, y: y + 1},
            {x: x - 1, y: y},
            {x: x + 1, y: y},
            {x: x, y: y + 1},
            {x: x, y: y - 1},
        ].filter(function(pixel) {
            var x = pixel.x;
            var y = pixel.y;
            return (x > -1) && (y > -1) && (x < w) && (y < h);
        });

        var ret = test(neighbors.map(function(pixel) {
            return (pixel.y * w + pixel.x - 1) * 4;
        }).concat(canvasPixelIndex));

        if (ret) {
            op({x: x, y: y});
            neighbors.forEach(function(pixel) {
                var key = JSON.stringify(pixel);
                if (!mem[key]) {
                    queue.push(pixel);
                    mem[key] = true;
                }
            });
        }
    }
};

/**
 * Binarization
 * 此方法利用图像的 HSL 分量实现选择区域，S > 50% 标记为目标区域
 *
 * @param {Canvas} canvas - The canvas to detect orange
 * @param {Bool} putImageData - Whether to put image data on canvas
 * @returns {Array} Array of orange area [{x, y}] (S > 50% & Lightness > 10)
 */
var getOrangeEdge = function(canvas, putImageData) {
    // get pixels
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = data.data;

    // mark all pixels S > 50%
    for (var i = 0; i < pixels.length; i += 4) {
        var r = pixels[i];
        var g = pixels[i+1];
        var b = pixels[i+2];
        var hsl = (window.colorConvert.rgb2hsl(r, g, b));
        var s = hsl[1];
        var l = hsl[2];
        if (s > 30 && l > 5) {
            pixels[i+3] = 255; // mark target area
        } else {
            pixels[i+3] = 254;
        }
    }

    // use flood fill to get orange area
    var test = function(_pixels) {
        return _pixels.every(function(i) {
            var alpha = pixels[i + 3];
            return alpha === 255;
        });
    };
    var orange = [];
    var op = function(p) {
        orange.push(p);
    };
    floodFill(parseInt(canvas.width / 2),
              parseInt(canvas.height / 2),
              canvas.width,
              canvas.height,
              test,
              op);

    // get edge points by y
    var _edge = {};
    orange.forEach(function(p) {
        var x = p.x,
            y = p.y;
        if (_edge[y]) {
            if (x < _edge[y].min) {
                _edge[y].min = x;
            }
            if (x > _edge[y].max) {
                _edge[y].max = x;
            }
        } else {
            _edge[y] = {min: x, max: x};
        }
    });
    var edge = [];
    for(var y in _edge) {
        edge.push({y: y, x: _edge[y].min});
        edge.push({y: y, x: _edge[y].max});
    }

    // get edge points by x
    _edge = {};
    orange.forEach(function(p) {
        var x = p.x,
            y = p.y;
        if (_edge[x]) {
            if (y < _edge[x].min) {
                _edge[x].min = y;
            }
            if (y > _edge[x].max) {
                _edge[x].max = y;
            }
        } else {
            _edge[x] = {min: y, max: y};
        }
    });
    for(var x in _edge) {
        edge.push({x: x, y: _edge[x].min});
        edge.push({x: x, y: _edge[x].max});
    }

    console.log(JSON.stringify(edge, null, 4));

    // mark edges
    edge.map(function(p) {
        return (p.y * canvas.width + p.x - 1) * 4;
    }).forEach(function(p) {
        pixels[p] = 255;
        pixels[p + 1] = 255;
        pixels[p + 2] = 255;
        pixels[p + 3] = 255;
    });

    if (putImageData) {
        ctx.putImageData(data, 0, 0);
    }


    return edge;
};


/**
 * Calculate MER in given canvas
 * Note: (0, 0) was located in the center of image
 *
 * @param {Canvas} canvas - The canvas to calcuate MER
 * @returns {Object} {top, right, bottom, left}
 */
var calcMER = function(canvas) {
    // Init
    var ctx = canvas.getContext('2d');

    var left = 1,
        right = -1,
        top = 1,
        bottom = -1;
};

/**
 * Display a image with MER using Canvas
 *
 * @param {String} filename - Path for image
 */
var displayImageWithMER = function(filename) {
    var image = new Image();
    image.src = filename;
    var canvas = document.createElement('canvas');
    canvas.width = 332 / 2;
    canvas.height = 302 / 2;
    document.body.appendChild(canvas);
    image.onload = function() {
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        getOrangeEdge(canvas, true);
    };
};

var targets = [];
for(var i = 1; i <= 10; i++) {
    var filename = (i > 9 ? i : "0" + i) + ".jpg";
    targets.push(["images", filename].join('/'));
    targets.push(["images", "green", filename].join('/'));
}

// while(targets.length > 0) {
//     displayImageWithMER(targets.shift());
// }

displayImageWithMER(targets.shift());
// displayImageWithMER(targets.shift());


