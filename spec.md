# Casting Yard Pro

## Current State
Batching Plant uses column layout. Silos are a separate column LEFT of RMC-Garage. Connectors go horizontally from silo right-edge to RMC-Garage left-edge.

## Requested Changes (Diff)

### Add
Fan-pattern: RMC-Garage is center, connectors radiate outward (left) like a fan at angles, silos at the connector tips.

### Modify
- RMC-Garage becomes the anchor center of the silo+connector sub-group.
- Connectors originate from RMC-Garage left-edge, radiate at fan angles (-30, 0, +30 degrees).
- Silos placed at the tip/end of each connector.
- Silo column (Col 2) removed from columns array.

### Remove
- Old silo column (stacked vertically left of RMC-Garage).
- Old horizontal connector logic.

## Implementation Plan
1. Remove Silos from columns array in buildCluster.
2. After placing all columns, find RMC-Garage position.
3. Compute 3 fan connectors radiating LEFT from RMC-Garage center at -30, 0, +30 degrees.
4. Place each silo circle at the tip of its connector using trig.
5. Apply same fan layout in fallback path.
