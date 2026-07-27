function generateWeightSpectrum(startWavelength = 380, wavelengthCount = 401, wavelengthStep = 1) {
    const sensitivityStartWavelength = 420;
    const sensitivityEndWavelength = 670;
    const sensitivityEdgeWidth = 20;
    
    // Generate sensitivity spectrum
    function curve(x, halfWidth) {
        // 2 parabola segments to make a smooth curve from 0 to 1
        if (x <= -halfWidth) return 0;
        if (x >= halfWidth) return 1;
        if (x < 0) {
            const t = (x + halfWidth) / halfWidth;
            return 0.5 * t * t;
        } else {
            const t = x / halfWidth;
            return 1 - 0.5 * (1 - t) * (1 - t);
        }
    }

    const sensitivity = new Spectrum(startWavelength, wavelengthCount, wavelengthStep);
    for (let i = 0; i < sensitivity.values.length; i++) {
        const wavelength = sensitivity.startWavelength + i * sensitivity.wavelengthStep;
        const a = curve(wavelength - sensitivityStartWavelength, 0.5 * sensitivityEdgeWidth);
        const b = curve(sensitivityEndWavelength - wavelength, 0.5 * sensitivityEdgeWidth);
        sensitivity.values[i] = a * b;
    }
    return sensitivity;
}

function fitChannelsToSpectrum(target, weightSpectrum, ...sourceSpectrums) {
    const numParameters = sourceSpectrums.length;
    const numSamples = target.values.length;
    const gradient = new Array(numParameters).fill(0);
    const hessian = new Array(numParameters).fill(0).map(() => new Array(numParameters).fill(0));
    
    for (let i = 0; i < numSamples; i++) {
        const t = target.values[i];
        const w = weightSpectrum.values[i];
        
        // Get all source spectrum values at this wavelength
        const sourceValues = sourceSpectrums.map(spectrum => spectrum.values[i]);
        
        // Build hessian matrix (sourceSpectrums.length x sourceSpectrums.length)
        for (let j = 0; j < numParameters; j++) {
            for (let k = 0; k < numParameters; k++) {
                hessian[j][k] += sourceValues[j] * sourceValues[k] * w;
            }
        }
        
        // Build gradient vector
        for (let j = 0; j < numParameters; j++) {
            gradient[j] += sourceValues[j] * t * w;
        }
    }
    
    // Use ML.js for Cholesky decomposition
    const cholesky = new ML.CholeskyDecomposition(hessian);
    const x = cholesky.solve(new ML.Matrix([gradient]).transpose()).to1DArray();
    
    return x;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateWeightSpectrum, fitChannelsToSpectrum };
}