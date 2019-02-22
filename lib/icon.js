function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.src = src;

        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

export function updateFavicon(src) {
    return loadImage(src).then((img) => {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0, 16, 16);

        const links = [...document.head.querySelectorAll('link[rel="icon"]')];

        links.forEach((link) => {
            // eslint-disable-next-line no-param-reassign
            link.href = canvas.toDataURL('image/x-icon');
        });
    });
}

export function generateIcon(icon, color) {
    return fetch(icon)
        .then(r => r.text())
        .then((svg) => {
            const base64 = btoa(svg.replace(/fill="#1E88E5"/g, `fill="${color}"`));
            const b64Start = 'data:image/svg+xml;base64,';
            return b64Start + base64;
        });
}
