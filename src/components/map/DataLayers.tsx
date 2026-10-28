'use client';

import { Layer, Source } from 'react-map-gl/mapbox';
import type { FilterSpecification } from 'mapbox-gl';
import type { DataLayer } from '@/types';
import { colorExpression } from '@/lib/geojson';

const POLYGON = ['Polygon', 'MultiPolygon'];
const LINE = ['LineString', 'MultiLineString'];
const POINT = ['Point', 'MultiPoint'];

const holds = (layer: DataLayer, kinds: string[]) =>
  layer.geometryKinds.some((kind) => kinds.includes(kind));

// On GeoJSON sources geometry-type reports Multi* as its own value, so a
// filter on 'Polygon' alone skipped every MultiPolygon: the layer showed up in
// the panel and the legend and drew nothing on the map.
const isKind = (kinds: string[]): FilterSpecification => ['in', ['geometry-type'], ['literal', kinds]];

/**
 * Paints one Mapbox source per data layer. A single GeoJSON file can mix
 * geometry types, so each kind gets the paint layer it needs and a filter that
 * keeps it from swallowing the others.
 */
export default function DataLayers({ layers }: { layers: DataLayer[] }) {
  return (
    <>
      {layers.map((layer) => {
        const color = colorExpression(layer.style) as string;
        // Passed explicitly: Source only hands its id to direct children, and
        // the polygon pair sits inside a fragment, so Mapbox rejected those
        // two layers for having no source and polygons never drew.
        const source = `data-${layer.id}`;

        return (
          <Source key={layer.id} id={source} type="geojson" data={layer.collection}>
            {holds(layer, POLYGON) && (
              <>
                <Layer
                  id={`data-${layer.id}-fill`}
                  source={source}
                  type="fill"
                  filter={isKind(POLYGON)}
                  paint={{ 'fill-color': color, 'fill-opacity': layer.style.opacity }}
                />
                <Layer
                  id={`data-${layer.id}-outline`}
                  source={source}
                  type="line"
                  filter={isKind(POLYGON)}
                  paint={{
                    'line-color': color,
                    'line-width': 1,
                    'line-opacity': Math.min(1, layer.style.opacity + 0.3),
                  }}
                />
              </>
            )}

            {holds(layer, LINE) && (
              <Layer
                id={`data-${layer.id}-line`}
                source={source}
                type="line"
                filter={isKind(LINE)}
                paint={{
                  'line-color': color,
                  'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 4],
                  'line-opacity': layer.style.opacity,
                }}
              />
            )}

            {holds(layer, POINT) && (
              <Layer
                id={`data-${layer.id}-point`}
                source={source}
                type="circle"
                filter={isKind(POINT)}
                paint={{
                  'circle-color': color,
                  'circle-opacity': layer.style.opacity,
                  // Points stay legible from country level down to a street.
                  'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 10, 5, 16, 10],
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#ffffff',
                }}
              />
            )}
          </Source>
        );
      })}
    </>
  );
}
