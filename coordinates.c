/*
 * Coordinate Universe — coordinate conversion library (C11).
 *
 * Angle convention:
 *   - All angles are in degrees.
 *   - Polar/Cylindrical theta is measured from +X toward +Y.
 *   - Spherical theta is azimuth around +Z; phi is measured down from +Z.
 *   - Polar coordinates require an explicit 2D plane when embedded in 3D.
 *
 * Compile:
 * cc -std=c11 -Wall -Wextra -pedantic -c coordinates.c -o coordinates.o
 */

#include <math.h>
#include <stddef.h>

/* Coordinate system definitions. */

typedef enum {
    CU_CARTESIAN = 0,
    CU_POLAR = 1,
    CU_CYLINDRICAL = 2,
    CU_SPHERICAL = 3
} CUCoordinateSystem;

typedef enum {
    CU_PLANE_XY = 0,
    CU_PLANE_XZ = 1,
    CU_PLANE_YZ = 2
} CUPlane;

/* Basic coordinate structures. */

typedef struct {
    double x;
    double y;
    double z;
} CUPoint3;

typedef struct {
    double first;
    double second;
    double third;
} CUCoordinates;

/* Constants. */

#define CU_PI 3.14159265358979323846264338327950288
#define CU_EPSILON 1e-12

/* Convert degrees into radians. */

static double radians(double degrees) {
    return degrees * CU_PI / 180.0;
}

/* Convert radians into degrees. */

static double degrees(double radians_value) {
    return radians_value * 180.0 / CU_PI;
}

/* Keep angles within 0 to 360 degrees. */

static double normalize_angle(double angle) {
    double result = fmod(angle, 360.0);

    if (result < 0.0) {
        result += 360.0;
    }

    return result;
}

/* Check whether a 3D point contains valid finite numbers. */

static int finite_point(CUPoint3 point) {
    return isfinite(point.x) &&
           isfinite(point.y) &&
           isfinite(point.z);
}

/*
 * Convert a supported coordinate system into Cartesian coordinates.
 *
 * Returns:
 *   1 = success
 *   0 = invalid system or output
 */

int cu_to_cartesian(
    CUCoordinateSystem system,
    CUCoordinates value,
    CUPlane plane,
    CUPoint3 *out_point
) {
    double angle;
    double radius;
    double rho;
    double theta;
    double phi;

    if (out_point == NULL) {
        return 0;
    }

    switch (system) {

        case CU_CARTESIAN:

            out_point->x = value.first;
            out_point->y = value.second;
            out_point->z = value.third;

            break;

        case CU_POLAR:

            angle = radians(value.second);
            radius = value.first;

            if (plane == CU_PLANE_XZ) {

                out_point->x = radius * cos(angle);
                out_point->y = 0.0;
                out_point->z = radius * sin(angle);

            } else if (plane == CU_PLANE_YZ) {

                out_point->x = 0.0;
                out_point->y = radius * cos(angle);
                out_point->z = radius * sin(angle);

            } else {

                out_point->x = radius * cos(angle);
                out_point->y = radius * sin(angle);
                out_point->z = 0.0;

            }

            break;

        case CU_CYLINDRICAL:

            angle = radians(value.second);

            out_point->x = value.first * cos(angle);
            out_point->y = value.first * sin(angle);
            out_point->z = value.third;

            break;

        case CU_SPHERICAL:

            rho = value.first;
            theta = value.second;
            phi = normalize_angle(value.third);

            if (phi > 180.0) {
                phi = 360.0 - phi;
                theta += 180.0;
            }

            if (rho < 0.0) {
                rho = -rho;
                theta += 180.0;
                phi = 180.0 - phi;
            }

            theta = radians(normalize_angle(theta));
            phi = radians(phi);

            out_point->x =
                rho * sin(phi) * cos(theta);

            out_point->y =
                rho * sin(phi) * sin(theta);

            out_point->z =
                rho * cos(phi);

            break;

        default:
            return 0;
    }

    return finite_point(*out_point);
}

/*
 * Convert Cartesian coordinates into another system.
 *
 * Returns:
 *   1 = success
 *   0 = invalid input or output
 */

int cu_from_cartesian(
    CUCoordinateSystem system,
    CUPoint3 point,
    CUPlane plane,
    CUCoordinates *out_value
) {
    double a;
    double b;
    double radius;
    double rho;

    if (out_value == NULL || !finite_point(point)) {
        return 0;
    }

    switch (system) {

        case CU_CARTESIAN:

            out_value->first = point.x;
            out_value->second = point.y;
            out_value->third = point.z;

            break;

        case CU_POLAR:

            if (plane == CU_PLANE_XZ) {

                a = point.x;
                b = point.z;

            } else if (plane == CU_PLANE_YZ) {

                a = point.y;
                b = point.z;

            } else {

                a = point.x;
                b = point.y;

            }

            out_value->first = hypot(a, b);

            out_value->second =
                normalize_angle(
                    degrees(atan2(b, a))
                );

            out_value->third = 0.0;

            break;

        case CU_CYLINDRICAL:

            radius = hypot(point.x, point.y);

            out_value->first = radius;

            out_value->second =
                radius <= CU_EPSILON
                    ? 0.0
                    : normalize_angle(
                        degrees(atan2(point.y, point.x))
                    );

            out_value->third = point.z;

            break;

        case CU_SPHERICAL:

            rho = hypot(
                hypot(point.x, point.y),
                point.z
            );

            out_value->first = rho;

            out_value->second =
                (point.x == 0.0 && point.y == 0.0)
                    ? 0.0
                    : normalize_angle(
                        degrees(atan2(point.y, point.x))
                    );

            if (rho <= CU_EPSILON) {

                out_value->third = 0.0;

            } else {

                double ratio = point.z / rho;

                if (ratio > 1.0) {
                    ratio = 1.0;
                }

                if (ratio < -1.0) {
                    ratio = -1.0;
                }

                out_value->third =
                    degrees(acos(ratio));
            }

            break;

        default:
            return 0;
    }

    return isfinite(out_value->first) &&
           isfinite(out_value->second) &&
           isfinite(out_value->third);
}

/*
 * Convert directly between any two supported coordinate systems.
 *
 * Internally:
 *   Source coordinates -> Cartesian -> Target coordinates
 */

int cu_convert(
    CUCoordinateSystem source,
    CUCoordinateSystem target,
    CUCoordinates input,
    CUPlane plane,
    CUCoordinates *output
) {
    CUPoint3 cartesian;

    if (output == NULL) {
        return 0;
    }

    if (!cu_to_cartesian(
        source,
        input,
        plane,
        &cartesian
    )) {
        return 0;
    }

    return cu_from_cartesian(
        target,
        cartesian,
        plane,
        output
    );
}
