// Source: http://stackoverflow.com/questions/2303690/resizing-an-image-in-an-html5-canvas#3223466
function lanczosCreate(lobes){
  return function(x){
    if (x > lobes) 
      return 0;
    x *= Math.PI;
    if (Math.abs(x) < 1e-16) 
      return 1
    var xx = x / lobes;
    return Math.sin(x) * Math.sin(xx) / x / xx;
  }
}

//elem: canvas element, img: image element, sx: scaled width, lobes: kernel radius
function thumbnailer(elem, img, sx, lobes){ 
    this.canvas = elem;
    elem.width = img.width;
    elem.height = img.height;
    elem.style.display = "none";
    this.ctx = elem.getContext("2d");
    this.ctx.drawImage(img, 0, 0);
    this.img = img;
    this.src = this.ctx.getImageData(0, 0, img.width, img.height);
    this.dest = {
        width: sx,
        height: Math.round(img.height * sx / img.width),
    };
    this.dest.data = new Array(this.dest.width * this.dest.height * 3);
    this.lanczos = lanczosCreate(lobes);
    this.ratio = img.width / sx;
    this.rcp_ratio = 2 / this.ratio;
    this.range2 = Math.ceil(this.ratio * lobes / 2);
    this.cacheLanc = {};
    this.center = {};
    this.icenter = {};
    this.process1(0);
}

thumbnailer.prototype.process1 = function(u){
    this.center.x = (u + 0.5) * this.ratio;
    this.icenter.x = Math.floor(this.center.x);
    for (var v = 0; v < this.dest.height; v++) {
        this.center.y = (v + 0.5) * this.ratio;
        this.icenter.y = Math.floor(this.center.y);
        var a, r, g, b;
        a = r = g = b = 0;
        for (var i = this.icenter.x - this.range2; i <= this.icenter.x + this.range2; i++) {
            if (i < 0 || i >= this.src.width) 
                continue;
            var f_x = Math.floor(1000 * Math.abs(i - this.center.x));
            if (!this.cacheLanc[f_x]) 
                this.cacheLanc[f_x] = {};
            for (var j = this.icenter.y - this.range2; j <= this.icenter.y + this.range2; j++) {
                if (j < 0 || j >= this.src.height) 
                    continue;
                var f_y = Math.floor(1000 * Math.abs(j - this.center.y));
                if (this.cacheLanc[f_x][f_y] == undefined) 
                    this.cacheLanc[f_x][f_y] = this.lanczos(Math.sqrt(Math.pow(f_x * this.rcp_ratio, 2) + Math.pow(f_y * this.rcp_ratio, 2)) / 1000);
                weight = this.cacheLanc[f_x][f_y];
                if (weight > 0) {
                    var idx = (j * this.src.width + i) * 4;
                    a += weight;
                    r += weight * this.src.data[idx];
                    g += weight * this.src.data[idx + 1];
                    b += weight * this.src.data[idx + 2];
                }
            }
        }
        var idx = (v * this.dest.width + u) * 3;
        this.dest.data[idx] = r / a;
        this.dest.data[idx + 1] = g / a;
        this.dest.data[idx + 2] = b / a;
    }

    if (++u < this.dest.width) 
        this.process1(u);
    else 
        this.process2()
};
thumbnailer.prototype.process2 = function(){
    this.canvas.width = this.dest.width;
    this.canvas.height = this.dest.height;
    this.ctx.drawImage(this.img, 0, 0);
    this.src = this.ctx.getImageData(0, 0, this.dest.width, this.dest.height);
    var idx, idx2;
    for (var i = 0; i < this.dest.width; i++) {
        for (var j = 0; j < this.dest.height; j++) {
            idx = (j * this.dest.width + i) * 3;
            idx2 = (j * this.dest.width + i) * 4;
            this.src.data[idx2] = this.dest.data[idx];
            this.src.data[idx2 + 1] = this.dest.data[idx + 1];
            this.src.data[idx2 + 2] = this.dest.data[idx + 2];
        }
    }
    this.ctx.putImageData(this.src, 0, 0);
    this.canvas.style.display = "block";
}

