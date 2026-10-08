import { decodeXmlEntities, GpxParseError, parseGpx } from './parse-gpx';

const gpx = (body: string) => `<?xml version="1.0"?><gpx version="1.1">${body}</gpx>`;

describe('parseGpx', () => {
  it('reads track points with their elevation, whatever the attribute order', () => {
    const { points } = parseGpx(
      gpx(`<trk><trkseg>
        <trkpt lat="43.1" lon="1.2"><ele>150.5</ele><time>2026</time></trkpt>
        <trkpt lon='1.3' lat='43.2'><ele>160</ele></trkpt>
      </trkseg></trk>`),
    );
    expect(points).toEqual([
      { lat: 43.1, lon: 1.2, ele: 150.5 },
      { lat: 43.2, lon: 1.3, ele: 160 },
    ]);
  });

  it('accepts self-closing points and treats an empty <ele> as missing, not 0 m', () => {
    const { points } = parseGpx(
      gpx(
        `<trk><trkseg><trkpt lat="43" lon="1"/><trkpt lat="43.1" lon="1.1"><ele> </ele></trkpt></trkseg></trk>`,
      ),
    );
    expect(points.map(p => p.ele)).toEqual([null, null]);
  });

  it('falls back to route points when there is no track', () => {
    const { points } = parseGpx(
      gpx(`<rte><rtept lat="43" lon="1"/><rtept lat="43.1" lon="1.1"/></rte>`),
    );
    expect(points).toHaveLength(2);
  });

  it('skips points with invalid coordinates', () => {
    const { points } = parseGpx(
      gpx(`<trk><trkseg><trkpt lat="abc" lon="1"/><trkpt lat="95" lon="1"/>
        <trkpt lat="43" lon="1"/><trkpt lat="43.1" lon="1.1"/></trkseg></trk>`),
    );
    expect(points).toHaveLength(2);
  });

  it('takes the track name, never a waypoint name, with decoded entities and CDATA', () => {
    const xml = gpx(`<wpt lat="1" lon="1"><name>Ravito</name></wpt>
      <trk><name><![CDATA[Boucle d&#039;Aspet &amp; Menté]]></name><trkseg>
      <trkpt lat="43" lon="1"><name>pt</name></trkpt><trkpt lat="43.1" lon="1.1"/></trkseg></trk>`);
    expect(parseGpx(xml).name).toBe("Boucle d'Aspet & Menté");
  });

  it('falls back to the metadata name', () => {
    const xml = gpx(`<metadata><name>BRM 200</name></metadata>
      <trk><trkseg><trkpt lat="43" lon="1"/><trkpt lat="43.1" lon="1.1"/></trkseg></trk>`);
    expect(parseGpx(xml).name).toBe('BRM 200');
  });

  it('rejects a file without at least two points', () => {
    expect(() => parseGpx(gpx('<trk><trkseg><trkpt lat="43" lon="1"/></trkseg></trk>'))).toThrow(
      GpxParseError,
    );
    expect(() => parseGpx('pas du xml')).toThrow(GpxParseError);
  });

  it('parses large files in linear time', () => {
    const count = 100_000;
    const body = Array.from(
      { length: count },
      (_, i) =>
        `<trkpt lat="${43 + i * 1e-5}" lon="1"><ele>${100 + (i % 50)}</ele><time>2026-01-01T00:00:00Z</time></trkpt>`,
    ).join('\n');
    const start = performance.now();
    const { points } = parseGpx(gpx(`<trk><trkseg>${body}</trkseg></trk>`));
    expect(points).toHaveLength(count);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

describe('decodeXmlEntities', () => {
  it('decodes named, decimal and hexadecimal entities and keeps unknown ones', () => {
    expect(decodeXmlEntities('a &amp; b &#039;c&#x27; &eacute;')).toBe("a & b 'c' &eacute;");
  });
});
