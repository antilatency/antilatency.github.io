function createBlackbodySpectrum(temperatureKelvin, startWavelength = 380, count = 401, wavelengthStep = 1) {
    if (temperatureKelvin <= 0)
        return new Spectrum(startWavelength, count, wavelengthStep);
    if (temperatureKelvin > 1e+07)
        temperatureKelvin = 1e+07;
    
    const spectrum = new Spectrum(startWavelength, count, wavelengthStep);
    
    for (let i = 0; i < count; i++) {
        const wavelengthMeters = (startWavelength + i * wavelengthStep) * 1e-9;
        // Planck's law
        const c1 = 3.741771e-16; // 2hc^2
        const c2 = 1.4387769e-2; // hc/k
        const exponent = c2 / (wavelengthMeters * temperatureKelvin);
        const intensity = (c1 / Math.pow(wavelengthMeters, 5)) / (Math.exp(exponent) - 1.0);
        spectrum.values[i] = intensity;
    }
    
    return spectrum;
}


function colorTemperatureToRGB(kelvin) {
    let temp = kelvin / 100;

    let r, g, b;

    // --- Red ---
    if (temp <= 66) {
        r = 255;
    } else {
        r = temp - 60;
        r = 329.698727446 * Math.pow(r, -0.1332047592);
        r = Math.min(255, Math.max(0, r));
    }

    // --- Green ---
    if (temp <= 66) {
        g = 99.4708025861 * Math.log(temp) - 161.1195681661;
        g = Math.min(255, Math.max(0, g));
    } else {
        g = temp - 60;
        g = 288.1221695283 * Math.pow(g, -0.0755148492);
        g = Math.min(255, Math.max(0, g));
    }

    // --- Blue ---
    if (temp >= 66) {
        b = 255;
    } else if (temp <= 19) {
        b = 0;
    } else {
        b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
        b = Math.min(255, Math.max(0, b));
    }

    return {
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b)
    };
}