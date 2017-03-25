const radiansToAngle = 256 / Math.PI;
const angleToRadians = Math.PI / 256;

export const rangeMax = 512;

const mod = (a, n) => a - Math.floor(a / n) * n;

export const fromRadians = radians =>
    mod(radians, 2 * Math.PI) * radiansToAngle;

export const toRadians = angle => mod(angle, rangeMax) * angleToRadians;
