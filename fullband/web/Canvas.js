function initializeCanvas(canvas, startWavelength, endWavelength, padding=20) {
    
    if (!canvas) {
        console.error(`Canvas with id "${canvasId}" not found.`);
        return null;
    }
    const ctx = canvas.getContext('2d');

    //setup coordinate system to match wavelength range
    //cord x startWavelength at left, endWavelength at right
    //cord y from 0 at bottom to 1 at top
    ctx["getScaledX"] = function(x) {
        return (x - startWavelength) * (canvas.width - 2 * padding) / (endWavelength - startWavelength) + padding;
    }
    ctx["getScaledY"] = function(y) {
        return canvas.height - padding - y * (canvas.height - 2 * padding);
    }
    ctx["moveToScaled"] = function(x, y) {
        this.moveTo(this.getScaledX(x), this.getScaledY(y));
    }
    ctx["lineToScaled"] = function(x, y) {
        this.lineTo(this.getScaledX(x),this.getScaledY(y));
    }

    ctx["clear"] = function(backgroundColor='white') {
        this.fillStyle = backgroundColor;
        this.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx["createColorGradient"] = function() {
        const a = this.getScaledX(startWavelength);
        const b = this.getScaledX(endWavelength);
        const gradient = this.createLinearGradient(a, 0, b, 0);
        const gradientColors = [
            { wavelength: 380, color: { r: 1.0, g: 0.0, b: 1.0, a: 0.0 } }, // Violet invisible
            { wavelength: 440, color: { r: 0.29, g: 0.0, b: 1.0, a: 1.0 } }, // Blue
            { wavelength: 490, color: { r: 0.0, g: 1.0, b: 1.0, a: 1.0 } }, // Cyan
            { wavelength: 510, color: { r: 0.0, g: 1.0, b: 0.0, a: 1.0 } }, // Green
            { wavelength: 570, color: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 } }, // Yellow
            { wavelength: 590, color: { r: 1.0, g: 0.65, b: 0.0, a: 1.0 } }, // Orange
            { wavelength: 620, color: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 } }, // Red
            { wavelength: 750, color: { r: 1.0, g: 0.0, b: 0.0, a: 0.0 } }  // Deep Red invisible
        ];
        for (let i = 0; i < gradientColors.length; i++) {
            const gc = gradientColors[i];
            const t = (gc.wavelength - startWavelength) / (endWavelength - startWavelength);
            const r = Math.round(gc.color.r * 255);
            const g = Math.round(gc.color.g * 255);
            const b = Math.round(gc.color.b * 255);
            gradient.addColorStop(t, `rgba(${r}, ${g}, ${b}, ${gc.color.a})`);
        }
        return gradient;
    }

    ctx["drawSpectrum"] = function(spectrum, style='blue', lineWidth=2, fill = false) {
        if (!spectrum || spectrum.values.length === 0) {
            console.warn('Spectrum is empty or undefined.');
            return;
        }        
        
        this.lineWidth = lineWidth;
        this.beginPath();
        
        const firstWavelength = spectrum.startWavelength;
        this.moveToScaled(firstWavelength, spectrum.values[0]);
        
        for (let i = 1; i < spectrum.values.length; i++) {
            const wavelength = spectrum.startWavelength + i * spectrum.wavelengthStep;
            this.lineToScaled(wavelength, spectrum.values[i]);
        }
        if (fill) {
            this.lineToScaled(spectrum.startWavelength + (spectrum.values.length - 1) * spectrum.wavelengthStep, 0);
            this.lineToScaled(spectrum.startWavelength, 0);
            this.closePath();
            this.fillStyle = style;
            this.fill();
        } else {
            this.strokeStyle = style;
            this.stroke();
        }
    }

    ctx["drawWavelengthMarkers"] = function(){
        const color = 'rgba(255, 255, 255, 0.3)';
        this.strokeStyle = color;
        this.lineWidth = 1;
        this.font = '12px Arial';
        this.fillStyle = color;
        this.textAlign = 'center';
        const step = 50;
        for(let wl = startWavelength; wl <= endWavelength; wl += step) {
            const x = this.getScaledX(wl);
            this.beginPath();
            this.moveTo(x, canvas.height - padding);
            this.lineTo(x, 0);
            this.stroke();
            this.fillText(wl, x, canvas.height - 5);
        }
    } 




    return ctx;    
}

