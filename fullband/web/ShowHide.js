function showElementsById(...ids) {
    return ids.map(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.visibility = 'visible';
        }
        return element;
    });
}

function hideElementsById(...ids) {
    return ids.map(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.visibility = 'hidden';
        }
        return element;
    });
}