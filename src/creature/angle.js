import { mod } from './../utilities';

export const rangeMax = 512;

const angleToRadians = (2 * Math.PI) / rangeMax;

export const toRadians = angle => mod(angle, rangeMax) * angleToRadians;
