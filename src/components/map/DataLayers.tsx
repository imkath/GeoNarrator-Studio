'use client';

import { Layer, Source } from 'react-map-gl/mapbox';
import type { DataLayer } from '@/types';
import { colorExpression } from '@/lib/geojson';

const POLYGON = new Set(['Polygon', 'MultiPolygon']);
const LINE = new Set(['LineString', 'MultiLineString']);
const POINT = new Set(['Point', 'MultiPoint']);

const holds = (layer: DataLayer, kinds: Set<string>) =>
  layer.geometryKinds.some((kind) => kinds.has(kind));

/**
 * Paints one Mapbox source per data layer. A single GeoJSON file can mix
 * geometry types, so each kind gets the paint layer it needs and a filter that
 * keeps it from swallowing the others.
 */
export default function DataLayers({ layers }: { layers: DataLayer[] }) {
  return (
    <>
      {layers.map((layer) => {
        const color = colorExpression(layer.style);

        return (
          <Source key={layer.id} id={`data-${layer.id}`} type="geojson" data={layer.collection}>
            {holds(layer, POLYGON) && (
              <>
                <Layer
                  id={`data-${layer.id}-fill`}
                  type="fill"
                  filter={['==', ['geometry-type'], 'Polygon']}
                  paint={{
                    'fill-color': color as string,
                    'fill-opacity': layer.style.opacity,
                  }}
                />
                <Layer
                  id={`data-${layer.id}-outline`}
                  type="line"
                  filter={['==', ['geometry-type'], 'Polygon']}
                  paint={{
                    'line-color': color as string,
                    'line-width': 1,
                    'line-opacity': Math.min(1, layer.style.opacity + 0.3),
                  }}
                />
              </>
            )}

            {holds(layer, LINE) && (
              <Layer
                id={`data-${layer.id}-line`}
                type="line"
                filter={['==', ['geometry-type'], 'LineString']}
                paint={{
                  'line-color': color as string,
                  'line-width': 2,
                  'line-opacity': layer.style.opacity,
                }}
              />
            )}

            {holds(layer, POINT) && (
              <Layer
                id={`data-${layer.id}-point`}
                type="circle"
                filter={['==', ['geometry-type'], 'Point']}
                paint={{
                  'circle-color': color as string,
                  'circle-opacity': layer.style.opacity,
                  // Points stay legible from country level down to a street.
                  'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3, 12, 7, 18, 12],
                  'circle-stroke-width': 1,
                  'circle-stroke-color': 'rgba(255,255,255,0.5)',
                }}
              />
            )}
          </Source>
        );
      })}
    </>
  );
}
