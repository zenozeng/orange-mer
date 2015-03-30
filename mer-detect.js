/**
 * Binarization
 * 此方法利用图像的 HSL 分量实现选择区域，S > 50% 标记为目标区域
 *
 * @param {Canvas} canvas - The canvas to detect orange
 * @param {Bool} putImageData - Whether to put image data on canvas
 * @returns {ImageData} Binarized ImageData (S > 50% ? alpha=1 : alpha=0.8)
 */
var binarization = function(canvas, putImageData) {
    // get pixels
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = data.data;

    // mark all pixels S > 50%
    for (var i = 0; i < pixels.length; i += 4) {
        var r = pixels[i];
        var g = pixels[i+1];
        var b = pixels[i+2];
        var s = (window.colorConvert.rgb2hsl(r, g, b))[1];
        if (s > 50) {
            pixels[i+3] = 255;
        } else {
            pixels[i+3] = 255 * 0.8;
        }
    }

    if (putImageData) {
        ctx.putImageData(data, 0, 0);
    }
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
    canvas.width = 332;
    canvas.height = 302;
    document.body.appendChild(canvas);
    image.onload = function() {
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        binarization(canvas, true);
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
displayImageWithMER(targets.shift());


