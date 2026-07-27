// Load multiple spectrum files and return them as an object
// urls: array of URLs to .spectrum files
// callback: function that receives an object with spectrum data
//           keys are filenames without extension, values are Spectrum instances
function loadSpectrums(urls, callback) {
    if (!urls || urls.length === 0) {
        callback({});
        return;
    }

    const results = {};
    let loadedCount = 0;
    let hasError = false;

    urls.forEach(url => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (hasError) return;

                // Extract filename without extension from URL
                const filename = url.split('/').pop().replace('.spectrum', '');
                
                // Create Spectrum instance from JSON data
                const spectrum = Spectrum.fromJSON(data);
                results[filename] = spectrum;

                loadedCount++;
                
                // Fire callback when all files are loaded
                if (loadedCount === urls.length) {
                    callback(results);
                }
            })
            .catch(error => {
                if (!hasError) {
                    hasError = true;
                    console.error(`Error loading spectrum from ${url}:`, error);
                    callback(null, error);
                }
            });
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadSpectrums };
}
