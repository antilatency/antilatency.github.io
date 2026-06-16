function setupSlideHandler(element, callback) {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;

    // --- helpers ---
    function getPos(e) {
    const rect = element.getBoundingClientRect();
    const point = e.touches && e.touches.length > 0 ? e.touches[0] : e;

    return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
    };
}

    function start(e) {
        const pos = getPos(e);
        isDragging = true;
        lastX = pos.x;
        lastY = pos.y;
        startX = pos.x;
        startY = pos.y;
        e.preventDefault();
    }

    function move(e) {
        if (!isDragging) return;

        const pos = getPos(e);
        const deltaX = pos.x - lastX;
        const deltaY = pos.y - lastY;
        lastX = pos.x;
        lastY = pos.y;

        let value = {
            deltaX: deltaX,
            deltaY: deltaY,
            startX: startX,
            startY: startY,
            currentX: pos.x,
            currentY: pos.y
        }

        callback(value);
        e.preventDefault();
    }

    function end(e) {
        isDragging = false;
    }

    // --- mouse ---
    element.addEventListener('mousedown', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);

    // --- touch ---
    element.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);

    // optional: cancel on touchcancel
    document.addEventListener('touchcancel', end);
}