class Spectrum {
    static FileExtension = "spectrum";

    constructor(arg1, arg2, arg3) {
        // Default constructor
        if (arg1 === undefined) {
            this.startWavelength = 380;
            this.wavelengthStep = 1;
            this.values = new Array(401).fill(0);
        }
        // Copy constructor
        else if (arg1 instanceof Spectrum) {
            this.startWavelength = arg1.startWavelength;
            this.wavelengthStep = arg1.wavelengthStep;
            this.values = [...arg1.values];
        }
        // Constructor with array of values
        else if (Array.isArray(arg1)) {
            this.startWavelength = arg2 !== undefined ? arg2 : 380;
            this.wavelengthStep = arg3 !== undefined ? arg3 : 1;
            this.values = [...arg1];
        }
        // Constructor with startWavelength, count, wavelengthStep
        else if (typeof arg1 === 'number') {
            this.startWavelength = arg1;
            this.wavelengthStep = arg3 !== undefined ? arg3 : 1;
            this.values = new Array(arg2 !== undefined ? arg2 : 401).fill(0);
        }
    }

    get wavelengthEnd() {
        return this.startWavelength + this.wavelengthStep * (this.values.length - 1);
    }

    get width() {
        return this.wavelengthStep * (this.values.length - 1);
    }

    sample(wavelength, defaultValue = 0) {
        const index = Math.floor((wavelength - this.startWavelength) / this.wavelengthStep);
        const nextIndex = index + 1;
        const t = (wavelength - (this.startWavelength + index * this.wavelengthStep)) / this.wavelengthStep;

        let value, nextValue;
        if (index < 0 || index >= this.values.length) {
            value = defaultValue;
        } else {
            value = this.values[index];
        }
        if (nextIndex < 0 || nextIndex >= this.values.length) {
            nextValue = defaultValue;
        } else {
            nextValue = this.values[nextIndex];
        }
        return value * (1 - t) + nextValue * t;
    }

    resample(newStartWavelength, newWavelengthStep, newCount, defaultValue = 0) {
        const resampled = new Spectrum();
        resampled.startWavelength = newStartWavelength;
        resampled.wavelengthStep = newWavelengthStep;
        resampled.values = new Array(newCount);
        for (let i = 0; i < newCount; i++) {
            const wavelength = newStartWavelength + i * newWavelengthStep;
            resampled.values[i] = this.sample(wavelength, defaultValue);
        }
        return resampled;
    }

    resampleToDomainOf(other, defaultValue = 0) {
        return this.resample(other.startWavelength, other.wavelengthStep, other.values.length, defaultValue);
    }

    static sameDomain(a, b) {
        return a.startWavelength === b.startWavelength && 
               a.wavelengthStep === b.wavelengthStep && 
               a.values.length === b.values.length;
    }

    static assertSameDomain(a, b) {
        if (!Spectrum.sameDomain(a, b)) {
            throw new Error('Spectrums must have the same domain');
        }
    }

    static simpleAddition(a, b) {
        Spectrum.assertSameDomain(a, b);
        const result = new Spectrum(a);
        for (let i = 0; i < a.values.length; i++) {
            result.values[i] += b.values[i];
        }
        return result;
    }

    add(other) {
        if (Spectrum.sameDomain(this, other)) {
            return Spectrum.simpleAddition(this, other);
        } else {
            const otherResampled = other.resample(this.startWavelength, this.wavelengthStep, this.values.length);
            return Spectrum.simpleAddition(this, otherResampled);
        }
    }

    static simpleMultiplication(a, b) {
        Spectrum.assertSameDomain(a, b);
        const result = new Spectrum(a);
        for (let i = 0; i < a.values.length; i++) {
            result.values[i] *= b.values[i];
        }
        return result;
    }

    multiply(other) {
        if (other instanceof Spectrum) {
            if (Spectrum.sameDomain(this, other)) {
                return Spectrum.simpleMultiplication(this, other);
            } else {
                const otherResampled = other.resample(this.startWavelength, this.wavelengthStep, this.values.length);
                return Spectrum.simpleMultiplication(this, otherResampled);
            }
        } else {
            // Scalar multiplication
            const result = new Spectrum(this);
            for (let i = 0; i < this.values.length; i++) {
                result.values[i] *= other;
            }
            return result;
        }
    }

    divide(scalar) {
        const result = new Spectrum(this);
        for (let i = 0; i < this.values.length; i++) {
            result.values[i] /= scalar;
        }
        return result;
    }

    normalized() {
        const max = this.maxValue();
        if (max === 0) {
            return new Spectrum(this);
        } else {
            return this.divide(max);
        }
    }

    maxValue() {
        return Math.max(...this.values);
    }

    blur(){
        const result = new Spectrum(this);
        for (let i = 1; i < this.values.length - 1; i++) {
            result.values[i] = (this.values[i - 1] + this.values[i] + this.values[i + 1]) / 3;
        }
        return result;
    }

    equals(other) {
        if (!(other instanceof Spectrum)) {
            return false;
        }
        if (!Spectrum.sameDomain(this, other)) {
            return false;
        }
        for (let i = 0; i < this.values.length; i++) {
            if (this.values[i] !== other.values[i]) {
                return false;
            }
        }
        return true;
    }

    hashCode() {
        let hash = 17;
        hash = hash * 31 + this.startWavelength;
        hash = hash * 31 + this.wavelengthStep;
        for (const value of this.values) {
            hash = hash * 31 + value;
        }
        return hash | 0; // Convert to 32-bit integer
    }

    toJSON() {
        return {
            startWavelength: this.startWavelength,
            wavelengthStep: this.wavelengthStep,
            values: this.values
        };
    }

    static fromJSON(json) {
        const spectrum = new Spectrum();
        spectrum.startWavelength = json.startWavelength || json.StartWavelength || 380;
        spectrum.wavelengthStep = json.wavelengthStep || json.WavelengthStep || 1;
        spectrum.values = json.values || json.Values || [];
        return spectrum;
    }

    static wavelengthToVisualizationColor(wavelength) {
        const gradient = [
            { wavelength: 380, color: { r: 1.0, g: 0.0, b: 1.0, a: 0.0 } }, // Violet invisible
            { wavelength: 440, color: { r: 0.29, g: 0.0, b: 1.0, a: 1.0 } }, // Blue
            { wavelength: 490, color: { r: 0.0, g: 1.0, b: 1.0, a: 1.0 } }, // Cyan
            { wavelength: 510, color: { r: 0.0, g: 1.0, b: 0.0, a: 1.0 } }, // Green
            { wavelength: 570, color: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 } }, // Yellow
            { wavelength: 590, color: { r: 1.0, g: 0.65, b: 0.0, a: 1.0 } }, // Orange
            { wavelength: 620, color: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 } }, // Red
            { wavelength: 750, color: { r: 1.0, g: 0.0, b: 0.0, a: 0.0 } }  // Deep Red invisible
        ];

        if (wavelength < gradient[0].wavelength || wavelength > gradient[gradient.length - 1].wavelength) {
            return { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
        }

        for (let i = 1; i < gradient.length; i++) {
            if (wavelength <= gradient[i].wavelength) {
                const left = gradient[i - 1];
                const right = gradient[i];
                const t = (wavelength - left.wavelength) / (right.wavelength - left.wavelength);
                
                const color = {
                    r: left.color.r * (1 - t) + right.color.r * t,
                    g: left.color.g * (1 - t) + right.color.g * t,
                    b: left.color.b * (1 - t) + right.color.b * t,
                    a: left.color.a * (1 - t) + right.color.a * t
                };
                
                color.r *= color.a;
                color.g *= color.a;
                color.b *= color.a;
                color.a = 1.0;
                
                return color;
            }
        }
        return { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
    }

    getVisualizationColors() {
        const colors = new Array(this.values.length);
        for (let i = 0; i < this.values.length; i++) {
            const wavelength = this.startWavelength + i * this.wavelengthStep;
            colors[i] = Spectrum.wavelengthToVisualizationColor(wavelength);
        }
        return colors;
    }

    spectrumSimilarityIndex(reference) {
        /*
https://oscars.org/sites/oscars/files/ssi_overview_2020-09-16.pdf

1) Specify test and reference source SPDs (at intervals not exceeding 5 nm).
2) Interpolate spectra to 1-nm increments from 375 nm to 675 nm (padding with zeroes if the test
luminaire is not specified fully across that range).
3) Integrate spectra in 10-nm intervals from 380 to 670 nm.
4) Normalize to unity total power of test and reference sources by dividing each 10-nm sample by
sum of all 10-nm samples for each source.
5) Calculate relative difference vector = (normalized test source vector – normalized reference
source vector) / (normalized reference source vector + 1/30).
6) Calculate weighted relative difference vector = relative difference vector * spectral weighting
vector
{4/15, 22/45, 32/45, 8/9, 44/45, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11/15, 3/15}.
7) Add zero to each end of weighted relative difference vector to have 32 values.
8) Convolve with {0.22, 0.56, 0.22} to create 30-element smoothed weighted relative difference
vector.
9) Calculate vector magnitude = square root of sum of squares of elements of smoothed weighted
relative difference vector.
10) SSI value = round (100 – 32 * vector magnitude). 
        */
        const startWavelength = 375;
        const endWavelength = 675;
        
        const a = this.resample(startWavelength, 1, endWavelength - startWavelength);
        const b = reference.resample(startWavelength, 1, endWavelength - startWavelength);
        const weights = [12.0 / 45.0, 22.0 / 45.0, 32.0 / 45.0, 40.0 / 45.0, 44.0 / 45.0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11.0 / 15.0, 3.0 / 15.0];
        const aBins = new Array(weights.length).fill(0);
        const bBins = new Array(weights.length).fill(0);
        let aSum = 0;
        let bSum = 0;
        
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < 10; j++) {
                aBins[i] += a.values[i * 10 + j];
                bBins[i] += b.values[i * 10 + j];
            }
            aSum += aBins[i];
            bSum += bBins[i];
        }
        
        for (let i = 0; i < weights.length; i++) {
            aBins[i] /= aSum;
            bBins[i] /= bSum;
        }
        
        const difference = new Array(weights.length);
        let bMean = 0;
        for (let i = 0; i < weights.length; i++) {
            difference[i] = aBins[i] - bBins[i];
            bMean += bBins[i];
        }
        bMean /= weights.length;

        const relativeDifference = new Array(weights.length);
        for (let i = 0; i < weights.length; i++) {
            relativeDifference[i] = difference[i] / (bBins[i] + bMean);
        }
        
        const weightedRelativeDifference = new Array(weights.length);
        for (let i = 0; i < weights.length; i++) {
            weightedRelativeDifference[i] = relativeDifference[i] * weights[i];
        }

        const convolveKernel = [0.22, 0.56, 0.22];
        const smoothed = new Array(weights.length).fill(0);
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < convolveKernel.length; j++) {
                const index = i + j - 1;
                if (index >= 0 && index < weights.length) {
                    smoothed[i] += weightedRelativeDifference[index] * convolveKernel[j];
                }
            }
        }

        let sumOfSquares = 0;
        for (let i = 0; i < weights.length; i++) {
            sumOfSquares += smoothed[i] * smoothed[i];
        }
        const vectorMagnitude = Math.sqrt(sumOfSquares);
        const ssi = 100 - 32 * vectorMagnitude;

        return ssi;
    }
}
