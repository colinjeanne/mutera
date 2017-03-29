import { mod } from './../utilities';

export const rangeMax = 512;

const radiansToAngle = rangeMax / (2 * Math.PI);
const angleToRadians = (2 * Math.PI) / rangeMax;

export const fromRadians = radians =>
    mod(radians, 2 * Math.PI) * radiansToAngle;

export const toRadians = angle => mod(angle, rangeMax) * angleToRadians;
