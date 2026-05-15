import './compass.css'

export const createCompass = () => {
    const compass = document.createElement('div');
    compass.id = 'compass';
    document.body.appendChild(compass);

    const compassMarkersContainer = document.createElement('div');
    compassMarkersContainer.classList.add('compass-markers-container');
    compass.appendChild(compassMarkersContainer);

    const directions = [
        { label: 'N', angle: 0, value: '0' },
        { label: 'NE', angle: 45, value: '45' },
        { label: 'E', angle: 90, value: '90' },
        { label: 'SE', angle: 135, value: '135' },
        { label: 'S', angle: 180, value: '180' },
        { label: 'SW', angle: 225, value: '225' },
        { label: 'W', angle: 270, value: '270' },
        { label: 'NW', angle: 315, value: '315' }
    ];

    directions.forEach(direction => {
        const markerContainer = document.createElement('div');
        markerContainer.classList.add('compass-marker-container');
        markerContainer.dataset.angle = direction.angle;

        const marker = document.createElement('div');
        marker.classList.add('compass-marker');
        marker.textContent = direction.label;

        const valueLabel = document.createElement('div');
        valueLabel.classList.add('compass-value');
        valueLabel.textContent = direction.value;

        markerContainer.appendChild(marker);
        markerContainer.appendChild(valueLabel);
        compassMarkersContainer.appendChild(markerContainer);
    });

    for (let angle = 15; angle < 360; angle += 15) {
        if (angle % 45 !== 0) {
            const minorMarker = document.createElement('div');
            minorMarker.classList.add('compass-minor-marker');
            minorMarker.dataset.angle = angle;
            compassMarkersContainer.appendChild(minorMarker);

            const valueLabel = document.createElement('div');
            valueLabel.classList.add('compass-value', 'compass-minor-value');
            valueLabel.textContent = angle.toString();
            valueLabel.dataset.angle = angle;
            compassMarkersContainer.appendChild(valueLabel);
        }
    }

    const centerIndicator = document.createElement('div');
    centerIndicator.classList.add('compass-center-indicator');
    compass.appendChild(centerIndicator);

    // Cache des markers une fois pour toutes (évite querySelectorAll par frame).
    // On stocke aussi l'angle parsé, l'élément, et son dernier état appliqué
    // pour ne réécrire le DOM que quand quelque chose change vraiment.
    const markerCache = Array.from(
        compassMarkersContainer.querySelectorAll('[data-angle]')
    ).map(el => {
        el.style.left = '50%';
        return { el, angle: parseInt(el.dataset.angle, 10), visible: true, lastOpacity: -1 };
    });

    let lastCenterDeg = -1;

    const updateCompass = (playerRotationY) => {
        let degrees = ((playerRotationY * 180 / Math.PI) + 90) % 360;
        if (degrees < 0) degrees += 360;

        for (let i = 0; i < markerCache.length; i++) {
            const m = markerCache[i];
            let diff = (m.angle - degrees + 360) % 360;
            if (diff > 180) diff -= 360;

            const absDiff = diff < 0 ? -diff : diff;
            const visible = absDiff <= 50;

            if (visible !== m.visible) {
                m.el.style.display = visible ? 'block' : 'none';
                m.visible = visible;
            }
            if (!visible) continue;

            // translateX(diff*5) — un seul write par frame quand visible
            m.el.style.transform = `translateX(${(diff * 5) | 0}px)`;

            // L'opacité ne change perceptiblement qu'au-delà du seuil → écriture conditionnelle
            const opacity = +(1 - absDiff / 50 * 0.6).toFixed(2);
            if (opacity !== m.lastOpacity) {
                m.el.style.opacity = opacity;
                m.lastOpacity = opacity;
            }
        }

        const currentDegrees = Math.round(degrees);
        if (currentDegrees !== lastCenterDeg) {
            centerIndicator.setAttribute('data-degrees', currentDegrees);
            lastCenterDeg = currentDegrees;
        }
    };

    return {
        element: compass,
        update: updateCompass
    };
};

export const setupCompass = () => {
    return createCompass();
};
