#include <math.h>

/*
 * CoordinateVerse C calculation engine.
 * Convention:
 *   theta = azimuth angle in the XY plane from +X, range [0, 360)
 *   phi   = polar angle measured down from +Z, range [0, 180]
 * Angles returned by these functions are in degrees.
 */

#define PI 3.14159265358979323846

double get_r(double x, double y) {
    return sqrt(x * x + y * y);
}

double get_theta_deg(double x, double y) {
    double theta = atan2(y, x) * 180.0 / PI;
    if (theta < 0.0) {
        theta += 360.0;
    }
    return theta;
}

double get_rho(double x, double y, double z) {
    return sqrt(x * x + y * y + z * z);
}

double get_phi_deg(double x, double y, double z) {
    double rho = get_rho(x, y, z);

    /* At the origin, the direction angle is undefined; return 0 for display. */
    if (rho == 0.0) {
        return 0.0;
    }

    double ratio = z / rho;

    /* Protect acos from tiny floating-point errors outside [-1, 1]. */
    if (ratio > 1.0) ratio = 1.0;
    if (ratio < -1.0) ratio = -1.0;

    return acos(ratio) * 180.0 / PI;
}

/* Optional helper functions for converting cylindrical/spherical to Cartesian. */
double cylindrical_x(double r, double theta_deg) {
    double theta = theta_deg * PI / 180.0;
    return r * cos(theta);
}

double cylindrical_y(double r, double theta_deg) {
    double theta = theta_deg * PI / 180.0;
    return r * sin(theta);
}

double spherical_x(double rho, double theta_deg, double phi_deg) {
    double theta = theta_deg * PI / 180.0;
    double phi = phi_deg * PI / 180.0;
    return rho * sin(phi) * cos(theta);
}

double spherical_y(double rho, double theta_deg, double phi_deg) {
    double theta = theta_deg * PI / 180.0;
    double phi = phi_deg * PI / 180.0;
    return rho * sin(phi) * sin(theta);
}

double spherical_z(double rho, double phi_deg) {
    double phi = phi_deg * PI / 180.0;
    return rho * cos(phi);
}
