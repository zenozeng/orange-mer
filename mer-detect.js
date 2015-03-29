var targets = [];
for(var i = 1; i <= 10; i++) {
    var filename = (i > 9 ? i : "0" + i) + ".jpg";
    targets.push(["images", filename].join('/'));
    targets.push(["images", "green", filename].join('/'));
}

var calcMER = function(canvas) {
};

var displayMER = function(filename) {
    var image = new Image();
    image.src = filename;
    var canvas = document.createElement('canvas');
    canvas.width = 332;
    canvas.height = 302;
    document.body.appendChild(canvas);
    image.onload = function() {
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
};

while(targets.length > 0) {
    displayMER(targets.shift());
}


