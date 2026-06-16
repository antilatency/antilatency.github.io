

const minTemperature = 1500;
const maxTemperature = 20000;
var temperature = 6500;
var channelR = 0.25;
var channelG = 0.25;
var channelB = 0.25;
var spectrums = {};
var canvas = null;
var context = null;


let startWavelength = 380;
let wavelengthCount = 401;
let wavelengthStep = 1;

let weights = null;
/*
let B_RoyalBlueSpectrum = null;
let B_BlueSpectrum = null;
let B_CyanSpectrum = null;

let G_CyanSpectrum = null;
let G_PCLimeSpectrum = null;
let G_PCAmberSpectrum = null;

let R_PCAmberSpectrum = null;
let R_PCRedOrangeSpectrum = null;
let R_PhotoRedSpectrum = null;*/

let channelSpectrums = [];
let channelDisplayColors = [];

function rgbDisplayColors(rColor, gColor, bColor){
    const rDisplayColor = 'rgba(255,100,100,0.5)';
    const gDisplayColor = 'rgba(100,255,100,0.5)';
    const bDisplayColor = 'rgba(100,100,255,0.5)';
    return [rDisplayColor, gDisplayColor, bDisplayColor];
}

function createAntilatencyLeds(spectrums){
    let result = {
        B_RoyalBlueSpectrum: spectrums['RoyalBlue'].multiply(3),
        B_BlueSpectrum: spectrums['Blue'].multiply(5),
        B_CyanSpectrum: spectrums['Cyan'].multiply(6),

        G_CyanSpectrum: spectrums['Cyan'].multiply(4),
        G_PCLimeSpectrum: spectrums['PCLime'].blur().blur().multiply(22),
        G_PCAmberSpectrum: spectrums['PCAmber'].multiply(4),

        R_PCAmberSpectrum: spectrums['PCAmber'].multiply(1),
        R_PCRedOrangeSpectrum: spectrums['PCRedOrange'].multiply(10),
        R_PhotoRedSpectrum: spectrums['PhotoRed'].multiply(5)
    };
    return result;
}

function createAntilatencyChannels(leds){
    const rSpectrum = leds.R_PCAmberSpectrum.add(leds.R_PCRedOrangeSpectrum).add(leds.R_PhotoRedSpectrum);
    const gSpectrum = leds.G_CyanSpectrum.add(leds.G_PCLimeSpectrum).add(leds.G_PCAmberSpectrum);
    const bSpectrum = leds.B_RoyalBlueSpectrum.add(leds.B_BlueSpectrum).add(leds.B_CyanSpectrum);
    let result = [rSpectrum, gSpectrum, bSpectrum];
    return result;
}

function initializeDomain(spectrums){
    let firstSpectrum = Object.values(spectrums)[0];
    startWavelength = firstSpectrum.startWavelength;
    wavelengthCount = firstSpectrum.values.length;
    wavelengthStep = firstSpectrum.wavelengthStep;
}

function StartCommon(){
    canvas = document.getElementById('canvas');
    canvas.style.display = 'block';
    context = initializeCanvas(canvas, 380, 780);   
    initializeDomain(spectrums);
    weights = generateWeightSpectrum(startWavelength, wavelengthCount, wavelengthStep);
}

function UpdateCommon(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.clear("black");
    context.drawWavelengthMarkers();
}

function StartBlackBody(){
    StartCommon();
    const leds = createAntilatencyLeds(spectrums);
    channelSpectrums = createAntilatencyChannels(leds);
    channelDisplayColors = rgbDisplayColors();
}

function UpdateBlackBody(){
    UpdateCommon();

    const gradient = context.createColorGradient();

    var blackbodySpectrum = createBlackbodySpectrum(temperature);
    
    var max = blackbodySpectrum.multiply(weights).maxValue() / 0.8;
    
    blackbodySpectrum = createBlackbodySpectrum(temperature).divide(max);
    
    var channels = fitChannelsToSpectrum(blackbodySpectrum, weights, ...channelSpectrums);

    const scaledChannelSpectrums = channelSpectrums.map((spectrum, index) => spectrum.multiply(channels[index]));
    
    for (let i = 0; i < channels.length; i++) {
        context.drawSpectrum(scaledChannelSpectrums[i], channelDisplayColors[i]);
    }

    let combined = scaledChannelSpectrums.reduce((acc, spectrum) => acc.add(spectrum));

    context.globalAlpha = 0.5;
    context.drawSpectrum(combined, gradient, 1, true);
    context.globalAlpha = 1;
    context.drawSpectrum(combined, gradient, 3, false);

    context.drawSpectrum(blackbodySpectrum, 'white');

    var ssi = combined.spectrumSimilarityIndex(blackbodySpectrum);

    const isMobile = canvas.width < 768;

    let color = colorTemperatureToRGB(temperature);

    context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;

    var maxChannel = Math.max(channels[0], channels[1], channels[2]);

    let textR = `R:${(channels[0] / maxChannel).toFixed(2)}`;
    let textG = `G:${(channels[1] / maxChannel).toFixed(2)}`;
    let textB = `B:${(channels[2] / maxChannel).toFixed(2)}`;
    let textTemp = `${Math.round(temperature)}K`;

    if (isMobile) {
        context.textAlign = 'center';

        const bottomY = canvas.height - 24;
        const gap = canvas.width / 4;

        context.font = '12px Arial';
        context.fillText(textB, gap * 0.65, bottomY);
        context.fillText(textG, gap * 1.45, bottomY);
        context.fillText(textR, gap * 2.25, bottomY);

        context.font = '16px Arial';
        context.fillText(textTemp, gap * 3.25, bottomY);
    } else {
        context.textAlign = 'right';

        context.font = '24px Arial';
        context.fillText(textTemp, canvas.width - 32, canvas.height * 0.9);

        context.font = '16px Arial';

        const lineHeight = 24;
        const x = canvas.width - 32;
        const y = canvas.height * 0.88;

        context.fillText(textR, x, y - lineHeight);
        context.fillText(textG, x, y - lineHeight * 2);
        context.fillText(textB, x, y - lineHeight * 3);
    }
}


function StartRGB(){
    StartCommon();
    const leds = createAntilatencyLeds(spectrums);
    channelSpectrums = createAntilatencyChannels(leds);
    channelDisplayColors = rgbDisplayColors();
}

function UpdateRGB(){
    UpdateCommon();

    const gradient = context.createColorGradient();
    
    var channels = [channelR, channelG, channelB];

    const scaledChannelSpectrums = channelSpectrums.map((spectrum, index) => spectrum.multiply(channels[index]));
    
    for (let i = 0; i < channels.length; i++) {
        context.drawSpectrum(scaledChannelSpectrums[i], channelDisplayColors[i]);
    }

    let combined = scaledChannelSpectrums.reduce((acc, spectrum) => acc.add(spectrum));

    context.globalAlpha = 0.5;
    context.drawSpectrum(combined, gradient, 1, true);
    context.globalAlpha = 1;
    context.drawSpectrum(combined, gradient, 3, false);

    let color = colorTemperatureToRGB(temperature);

    context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;

    let textR = `R:${channelR.toFixed(2)}`;
    let textG = `G:${channelG.toFixed(2)}`;
    let textB = `B:${channelB.toFixed(2)}`;

    const isMobile = canvas.width < 768;

    if (isMobile) {
    context.textAlign = 'center';
    context.font = 'bold 16px Arial';

    const bottomY = canvas.height - 30;

    const bX = canvas.width * 0.22;
    const gX = canvas.width * 0.50;
    const rX = canvas.width * 0.78;

    context.fillText(textB, bX, bottomY);
    context.fillText(textG, gX, bottomY);
    context.fillText(textR, rX, bottomY);
} else {
    context.textAlign = 'right';
    context.font = '24px Arial';

    const x = canvas.width - 32;
    const y = canvas.height * 0.9;
    const lineHeight = 30;

    context.fillText(textR, x, y);
    context.fillText(textG, x, y - lineHeight);
    context.fillText(textB, x, y - lineHeight * 2);
}

}