function rgb2Hsb(rgb) {
  var red = rgb.r;
  var green = rgb.g;
  var blue = rgb.b
  r = red / 255.0;
  g = green / 255.0;
  b = blue / 255.0;
  max = Math.max(Math.max(r, g), b);
  min = Math.min(Math.min(r, g), b);
  delta = max - min;
  var h;

  if (delta != 0)
  {
    var tmpHue;
    if (r == max)
      tmpHue = (g - b) / delta;
    else if (g == max)
      tmpHue = 2 + (b - r) / delta;
    else
      tmpHue = 4 + (r - g) / delta;

    tmpHue *= 60;
    if (tmpHue < 0)
      tmpHue += 360;
    h = tmpHue;
  }
  else
    h = 0;

  hue = Math.round(h);
  sat = max == 0 ? 0 : (max - min) / max;
  bri = max;
  return {h:hue,s:sat, b:bri};
}


function hsb2Rgb(hsb) {
  var hue = hsb.h;
  var sat = hsb.s;
  var bri = hsb.b;
  var red, green, blue;
  var r, g, b;

  if (hue < 0 || hue > 360 || sat < 0 || sat > 1 || bri < 0 || bri > 1) 
    return [0,0,0];

  if (sat == 0)
    r = g = b = bri;
  else 
  {
    if (hue == 360)
        hue = 0;
    hue /= 60;
    i = Math.floor(hue);
    f = hue - i;
    p = bri * (1 - sat);
    q = bri * (1 - sat * f);
    t = bri * (1 - sat * (1 - f));
    switch (i) 
    {
      case 0: r = bri; g = t;   b = p;   break;
      case 1: r = q;   g = bri; b = p;   break;
      case 2: r = p;   g = bri; b = t;   break;
      case 3: r = p;   g = q;   b = bri; break;
      case 4: r = t;   g = p;   b = bri; break;
      case 5:
      default: r = bri; g = p; b = q; break;
    }
  }
  red = Math.floor(r * 255 + 0.5);
  green = Math.floor(g * 255 + 0.5);
  blue = Math.floor(b * 255 + 0.5);
  return  {r:red, g:green, b:blue};
}



function hsb2Hsl( hsb ) {
  hsl = {"h": hsb.h, "s": 0, "l": 0}
  hsl.l = (2 - hsb.s) * hsb.b / 2;
  hsl.s = hsl.l&&hsl.l<1 ? hsb.s*hsb.b/(hsl.l<0.5 ? hsl.l*2 : 2-hsl.l*2) : hsl.s;
  return hsl;

}
function hsl2Hsb( hsl ) {

  hsb = {"h": hsl.h, "s": 0, "b": 0}

  var t = hsl.s * (hsl.l<0.5 ? hsl.l : 1-hsl.l);
  hsb.b = hsl.l+t;
  hsb.s = hsl.l>0 ? 2*t/hsb.b : hsb.s ;
  return hsb;
}

function hsl2Rgb( hsl ) {
  hsb = hsl2Hsb(hsl);
  return hsb2Rgb(hsb);
}
function rgb2Hsl( rgb ) {
  hsb = rgb2Hsb(rgb);
  return hsb2Hsl(hsb);
}


function colorToStr( color ) {
	var result = "";
	var r = Math.round(color.r).toString(16);
	if( r.length == 1) {
		r = "0" + r;
	}
	var g = Math.round(color.g).toString(16);
	if( g.length == 1) {
		g = "0" + g;
	}
	var b = Math.round(color.b).toString(16);
	if( b.length == 1) {
		b = "0" + b;
	}
	result += r + g + b;
  return result;				
}

function strToColor( val ) {

  var color = {};
  if(val.match(/^[0-9a-f]{6}$/i) != null) {
		if( isNaN( color.r = parseInt(val.substr(0, 2), 16) ) ) {
			color.r = 255;
		}
		if( isNaN( color.g = parseInt(val.substr(2, 2), 16) ) ) {
      color.g = 255;
		}
		if( isNaN( color.b = parseInt(val.substr(4, 2), 16) ) ) {
			color.b = 255;
		}
	}
  return color;
}
/*test:
rgb = {r:220,g:30,b:60};



rgb2hsb = rgb2Hsb(rgb);
hsb2rgb = hsb2Rgb(rgb2hsb);

hsb2hsl = hsb2Hsl(rgb2hsb);
hsl2hsb = hsl2Hsb(hsb2hsl);

rgb2hsl = rgb2Hsl(rgb);
hsl2rgb = hsl2Rgb(rgb2hsl);


console.log("rgb = " + JSON.stringify(rgb) + " rgb2hsb = " + JSON.stringify(rgb2hsb) + " hsb2rgb = " +
 JSON.stringify(hsb2rgb) );



console.log("hsb2hsl = " + JSON.stringify(hsb2hsl) + " hsl2hsb = " +
 JSON.stringify(hsl2hsb) );

console.log("rgb2hsl = " + JSON.stringify(rgb2hsl) + " hsl2rgb = " +
 JSON.stringify(hsl2rgb) );
*/
