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
 * getOrangeEdge
 * 此方法利用图像的 HSL 分量实现选择区域
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
    var edge = [];

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
    for(var y in _edge) {
        y = parseInt(y);
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
        x = parseInt(x);
        edge.push({x: x, y: _edge[x].min});
        edge.push({x: x, y: _edge[x].max});
    }

    // mark edges
    edge.map(function(p) {
        return (parseInt(p.y) * canvas.width + parseInt(p.x) - 1) * 4;
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
 * Calculate MER in given edgePoints
 * Note: Inside this function (0, 0) was located in the center of image
 *       but the return value take left top as (0, 0)
 *
 * Note: 此算法来自《实验二 水果品质检测与分级方法》
 *
 * @param {Array} edgePoints - Points of edge
 * @returns {Object} {center, corners, width, height, area, theta}
 */
var calcMER = function(edgePoints) {

    // 计算中心点
    var center = {x: 0, y: 0};
    edgePoints.forEach(function(p) {
        center.x += p.x;
        center.y += p.y;
    });
    center.x /= edgePoints.length;
    center.y /= edgePoints.length;

    // 移动到新坐标系：以中心点为 (0, 0)
    // 保持向右、向下为正
    var points = edgePoints.map(function(p) {
        return {
            x: p.x - center.x,
            y: p.y - center.y
        };
    });

    // 旋转坐标系 30 次以获得 30 个矩形
    var rects = Array.apply(null, Array(30)).map(function(_, i, arr) {
        // 此处 theta 为顺时针旋转的度数
        // 这里的坐标系方向是按照计算机习惯的右、下为正
        var theta = (Math.PI / 2) * (i / arr.length);
        var _points = points.map(function(p) {
            return {
                x: p.x * Math.cos(theta) - p.y * Math.sin(theta),
                y: p.x * Math.sin(theta) + p.y * Math.cos(theta)
            };
        });

        // 计算边界
        var left = 0,
            right = 0,
            top = 0,
            bottom = 0;

        _points.forEach(function(p) {
            if (p.x < left) {
                left = p.x;
            }
            if (p.x > right) {
                right = p.x;
            }
            if (p.y < top) {
                top = p.y;
            }
            if (p.y > bottom) {
                bottom = p.y;
            }
        });

        // 设定边角
        var corners = [
            {x: left, y: top},
            {x: right, y: top},
            {x: right, y: bottom},
            {x: left, y: bottom}
        ];

        // 将边角还原到原始角度的坐标系
        // 下转换关系可以通过将 x', y' 乘以 cos, sin 的四个表达式简单组合得到
        corners = corners.map(function(p) {
            return {
                x: p.y * Math.sin(theta) + p.x * Math.cos(theta),
                y: p.y * Math.cos(theta) - p.x * Math.sin(theta)
            };
        });

        // 将边角还原到以 left top 为 (0, 0) 的原始坐标系
        corners = corners.map(function(p) {
            return {
                x: p.x + center.x,
                y: p.y + center.y
            };
        });

        var width = Math.max(right - left, bottom - top);
        var height = Math.min(right - left, bottom - top);

        var area = (right - left) * (bottom - top);

        return {
            theta: theta,
            corners: corners,
            width: width,
            height: height,
            area: area
        };
    });

    var minArea = Infinity;
    var rect = null;
    rects.forEach(function(_rect) {
        if (_rect.area < minArea) {
            minArea = _rect.area;
            rect = _rect;
        }
    });

    rect.center = center;

    return rect;
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

        var edgePoints = getOrangeEdge(canvas, true);
        var rect = calcMER(edgePoints);

        // draw center
        var center = rect.center;
        ctx.fillStyle = "white";
        ctx.fillRect(center.x - 2, center.y - 2, 4, 4);

        // draw MER
        var corners = rect.corners;
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.lineTo(corners[0].x, corners[0].y);
        ctx.closePath();
        ctx.stroke();

        // highlight corners
        corners.forEach(function(p, i) {
            ctx.fillStyle = ["red", "green", "yellow", "blue"][i];
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });

        // display info
        var div = document.createElement('pre');
        delete rect.corners;
        delete rect.center;
        rect.theta = rect.theta / Math.PI * 180 + "°";
        div.innerHTML = JSON.stringify(rect, null, 4);
        document.body.insertBefore(div, canvas);
    };
};

var targets = [];
for(var i = 1; i <= 10; i++) {
    var filename = (i > 9 ? i : "0" + i) + ".jpg";
    targets.push(["images", filename].join('/'));
    targets.push(["images", "green", filename].join('/'));
}

while(targets.length > 0) {
    displayImageWithMER(targets.shift());
}
