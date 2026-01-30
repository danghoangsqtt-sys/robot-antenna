
import { AntennaType, GeometryPrimitive } from '../types';

export const createDefaultGeometry = (type: AntennaType): GeometryPrimitive[] => {
    switch (type) {
        case AntennaType.DIPOLE:
            return [{
                shape: 'cylinder',
                count: 1,
                dimensions: { length_lambda: 0.5, radius_lambda: 0.005 },
                orientation: 'vertical'
            }];
        case AntennaType.YAGI:
            return [{
                shape: 'cylinder',
                count: 5,
                dimensions: { 
                    length_lambda: 0.45, 
                    radius_lambda: 0.005,
                    spacing_lambda: 0.2
                },
                orientation: 'parallel'
            }];
        case AntennaType.HORN:
            return [{
                shape: 'cone',
                count: 1,
                dimensions: { length_lambda: 1.0, radius_lambda: 0.4 },
                orientation: 'horizontal'
            }];
        case AntennaType.PARABOLIC:
            return [{
                shape: 'paraboloid',
                count: 1,
                dimensions: { diameter_lambda: 2.0 },
                orientation: 'horizontal'
            }];
        case AntennaType.MICROSTRIP:
            return [{
                shape: 'box',
                count: 1,
                dimensions: { width_lambda: 0.5, height_lambda: 0.01, length_lambda: 0.5 },
                orientation: 'horizontal'
            }];
        default:
            return [];
    }
};
