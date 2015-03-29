var targets = [];
for(var i = 1; i <= 10; i++) {
    var filename = (i > 9 ? i : "0" + i) + ".jpg";
    targets.push(["images", filename].join('/'));
    targets.push(["images", "green", filename].join('/'));
}



