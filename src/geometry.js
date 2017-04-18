import { mod } from './utilities';

export const squareDistance = (a, b) =>
    (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);

const squareLength = ({ x, y }) => x * x + y * y;

const angle = ({ x, y }) => mod(Math.atan2(y, x), 2 * Math.PI);

export class Sector {
    constructor(radius, fromAngle, toAngle) {
        this.radius = radius;
        this.fromAngle = mod(fromAngle, 2 * Math.PI);
        this.toAngle = mod(toAngle, 2 * Math.PI);

        if (this.fromAngle > this.toAngle) {
            this.centerAngle = mod(
                (this.fromAngle + 2 * Math.PI + this.toAngle) / 2,
                2 * Math.PI);
        } else {
            this.centerAngle = (this.fromAngle + this.toAngle) / 2;
        }

        this.radiusSquared = radius * radius;
    }

    contains(pt) {
        // Alternative implementation:
        // http://stackoverflow.com/questions/13652518/efficiently-find-points-inside-a-circle-sector
        if (squareLength(pt) > this.radiusSquared) {
            return false;
        }

        const ptAngle = angle(pt);
        if (this.fromAngle > this.toAngle) {
            return (ptAngle >= this.fromAngle) || (ptAngle < this.toAngle);
        }

        return (ptAngle >= this.fromAngle) && (ptAngle < this.toAngle);
    }

    isClockwiseToCenter(pt) {
        const ptAngle = angle(pt);
        if (ptAngle > this.centerAngle) {
            return ptAngle - this.centerAngle >= Math.PI;
        }

        return this.centerAngle - ptAngle < Math.PI;
    }
}
