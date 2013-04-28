
//set up touch events
//var hammer = Hammer(document.body, {prevent_default: true, drag_max_touches: 10});
//canvas.on("touchstart", pjs.touch);
//canvas.on("touchend", pjs.release);
//canvas.on("touchmove", pjs.drag);

$help = document.getElementById('help');
$help.on("touchend", pjs.toggleViewMode);


window.onerror = function(msg, url, linenumber) {
    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;
}


//define colors for color picker
var colorArr = [
        {r: 82, g:46, b:26},
        {r: 109, g:78, b:40},
        {r: 211, g:174, b:136},
        {r: 236, g:204, b:165},
        {r: 250, g:227, b:198},

        {r: 250, g:94, b:121},
        {r: 251, g:147, b:147},
        {r: 251, g:196, b:172},
        {r: 255, g:225, b:184},
        {r: 255, g:215, b:139},


        {r: 207, g:240, b:158},
        {r: 168, g:219, b:168},
        {r: 121, g:189, b:154},
        {r: 59, g:134, b:134},
        {r: 11, g:72, b:107},

        {r: 236, g:208, b:120},
        {r: 217, g:91, b:67},
        {r: 192, g:41, b:66},
        {r: 84, g:36, b:55},
        {r: 83, g:119, b:122},

        {r: 202,g: 237,b: 105},
        {r: 242,g: 247,b: 229},
        {r: 133,g: 224,b: 242},
        {r: 54,g: 150,b: 169},
        {r: 45,g: 100,b: 111},

        {r: 245,g: 38,b: 87},
        {r: 255,g: 54,b: 87},
        {r: 245,g: 233,b: 201},
        {r: 220,g: 208,b: 175},
        {r: 48,g: 9,b: 15},
        {r: 72,g: 150,b: 192},

        {r: 72,g: 192,b: 110},
        {r: 227,g: 236,b: 75},
        {r: 238,g: 90,b: 146},
        {r: 211,g: 80,b: 197},
        {r: 239,g: 206,b: 28},
        {r: 239,g: 68,b: 28},
        {r: 228,g: 205,b: 144},
        {r: 206,g: 104,b: 64},
        {r: 180,g: 180,b: 180},

        {r: 248,g: 177,b: 149},
        {r: 246,g: 114,b: 128},
        {r: 192,g: 108,b: 132},
        {r: 108,g: 91,b: 123},
        {r: 53,g: 92,b: 125},

        {r: 94,g: 140,b: 106},
        {r: 136,g: 166,b: 94},
        {r: 136,g: 166,b: 94},
        {r: 191,g: 179,b: 90},
        {r: 242,g: 196,b: 90},

        {r: 22,g: 147,b: 165},
        {r: 2,g: 170,b: 176},
        {r: 0,g: 205,b: 172},
        {r: 127,g: 255,b: 36},
        {r: 195,g: 255,b: 104}/*,

        {r: 204,g: 12,b: 57},
        {r: 230,g: 120,b: 30},
        {r: 200,g: 207,b: 2},
        {r: 248,g: 252,b: 193},
        {r: 22,g: 147,b: 167},*/
    ];

