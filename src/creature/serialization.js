import { intFromBase64, intToBase64, isBase64 } from './../base64';
import { default as DNA } from './../dna/index';

class InvalidCreature extends Error {
}

const decodeHealth = encoded => intFromBase64(encoded);

const encodeHealth = health =>
    intToBase64(Math.floor(health), 2);

const decodeVelocity = encoded => {
    const value = intFromBase64(encoded);
    return {
        angle: value % 512,
        speed: value >>> 9
    };
};

const encodeVelocity = ({ angle, speed }) =>
    intToBase64((Math.floor(speed) << 9) + Math.floor(angle), 2);

const decodeLocation = encoded => intFromBase64(encoded);

const encodeLocation = location => intToBase64(Math.floor(location), 4);

const decodeID = encoded => encoded;

const encodeID = id => id;

const decodeHeader = encoded => {
    const version = encoded[0];
    if (version !== '1') {
        throw new InvalidCreature('Unexpected version');
    }

    return {
        version
    };
};

const encodeHeader = header => header.version;

const decodeSlices = (encoded, slicing) => {
    let currentIndex = 0;

    const decoded = slicing.reduce(
        (aggregate, { property, length, decoder }) => {
            if (!length) {
                length = encoded.length - currentIndex;
            }

            if ((currentIndex === encoded.length) ||
                (currentIndex + length > encoded.length)) {
                throw new InvalidCreature(`Creature missing ${property}`);
            }

            const encodedProperty = encoded.substr(currentIndex, length);
            aggregate[property] = decoder(encodedProperty);
            currentIndex += length;

            return aggregate;
        },
        {});

    return decoded;
};

const encodeSlices = (decoded, slicing) =>
    slicing.reduce(
        (aggregate, { property, encoder }) =>
            aggregate + encoder(decoded[property]),
        '');

const slicing = [
    {
        property: 'header',
        length: 1,
        decoder: decodeHeader,
        encoder: encodeHeader
    },
    {
        property: 'id',
        length: 5,
        decoder: decodeID,
        encoder: encodeID
    },
    {
        property: 'x',
        length: 4,
        decoder: decodeLocation,
        encoder: encodeLocation
    },
    {
        property: 'y',
        length: 4,
        decoder: decodeLocation,
        encoder: encodeLocation
    },
    {
        property: 'velocity',
        length: 2,
        decoder: decodeVelocity,
        encoder: encodeVelocity
    },
    {
        property: 'health',
        length: 2,
        decoder: decodeHealth,
        encoder: encodeHealth
    },
    {
        property: 'dna',
        decoder: encodedDNA => new DNA(encodedDNA),
        encoder: dna => dna.toString()
    }
];

export const deserializeCreature = encoded => {
    if (!isBase64(encoded)) {
        throw new InvalidCreature('Encoded creature is not a base64 string');
    }

    return decodeSlices(encoded, slicing);
};

export const serializeCreature = data => encodeSlices(data, slicing);
