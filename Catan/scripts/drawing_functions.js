//fonction de dessin
function RGBtoHEX(col, A = 1) {
    return `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${A})`;
}

function fillRect(ctx, x, y, w, h, color, A = 1) {
    ctx.fillStyle = RGBtoHEX(color, A);
    ctx.fillRect(x, y, w, h);
}

function fillCircle(ctx, x, y, r, color, A = 1) {
    ctx.fillStyle = RGBtoHEX(color, A);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.fill();
}

function drawText(ctx, text, s, x, y, color = [255, 255, 255], A = 1) {
    ctx.font = `${s}px courier`;
    ctx.fillStyle = RGBtoHEX(color, A);
    ctx.fillText(text, x, y);
}

function drawImage(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, A = 1) {
    ctx.globalAlpha = A;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
}