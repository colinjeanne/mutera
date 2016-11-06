export const base64Values =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

export const isBase64 = encoded =>
    encoded.split('').every(c => base64Values.indexOf(c) !== -1);

export const intFromBase64 = encoded =>
    encoded.split('').reverse().reduce(
        (sum, c, index) => sum + base64Values.indexOf(c) * (1 << (index * 6)),
        0);

const ensureMinimumLength = (base64, length) => {
    let final = base64;
    const padding = length - base64.length;
    for (let i = 0; i < padding; ++i) {
        final = '0' + final;
    }

    return final;
};

export const intToBase64 = (value, minimumLength = 0) => {
    let encoded = '';
    do {
        const index = value % 64;
        encoded = base64Values[index] + encoded;
        value >>>= 6;
    } while (value !== 0);

    return ensureMinimumLength(encoded, minimumLength);
};
