import { decodePolyline, decodeSeries, encodePolyline, encodeSeries } from './polyline';

describe('polyline', () => {
  it('matches the reference Google example', () => {
    // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
    const coordinates: [number, number][] = [
      [-120.2, 38.5],
      [-120.95, 40.7],
      [-126.453, 43.252],
    ];
    expect(encodePolyline(coordinates)).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual(coordinates);
  });

  it('round-trips series at the requested precision, negative deltas included', () => {
    const values = [0, 12.3, 9.8, 1500.4, -3.2, 1500.4];
    expect(decodeSeries(encodeSeries(values, 10), 10)).toEqual(values);
  });
});
