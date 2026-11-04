/* Coordinate Universe — application logic.
 * This module validates input, performs coordinate conversion, updates the UI
 * and connects the independent controls and visualiser modules.
 */
(function () {
  'use strict';

  const MAX = 1e12;

  const SYSTEMS = {
    cartesian: {
      name: 'Cartesian',
      short: 'Cartesian (x, y, z)',
      fields: [
        ['x', 'x · left / right'],
        ['y', 'y · forward / back'],
        ['z', 'z · up / down']
      ]
    },

    polar: {
      name: 'Polar',
      short: 'Polar (r, θ)',
      fields: [
        ['r', 'r · distance from centre'],
        ['theta', 'θ · direction angle (degrees)']
      ]
    },

    cylindrical: {
      name: 'Cylindrical',
      short: 'Cylindrical (r, θ, z)',
      fields: [
        ['r', 'r · distance from Z-axis'],
        ['theta', 'θ · angle around Z (degrees)'],
        ['z', 'z · height']
      ]
    },

    spherical: {
      name: 'Spherical',
      short: 'Spherical (ρ, θ, φ)',
      fields: [
        ['rho', 'ρ · distance from origin'],
        ['theta', 'θ · angle around Z (degrees)'],
        ['phi', 'φ · down from +Z (degrees)']
      ]
    }
  };

  const $ = function (id) {
    return document.getElementById(id);
  };

  const sourceSel = $('sourceSystem');
  const targetSel = $('targetSystem');
  const fieldsBox = $('inputFields');
  const planeBox = $('planeBox');
  const planeSel = $('planeSelect');

  const names = {
    xy: 'XY plane',
    xz: 'XZ plane',
    yz: 'YZ plane'
  };

  let inputValues = {
    cartesian: {
      x: '1',
      y: '1',
      z: '1'
    },

    polar: {
      r: '1.4142135624',
      theta: '45'
    },

    cylindrical: {
      r: '1.4142135624',
      theta: '45',
      z: '1'
    },

    spherical: {
      rho: '1.7320508076',
      theta: '45',
      phi: '54.7356103172'
    }
  };

  let sourcePoint = { x: 1, y: 1, z: 1 };
  let targetPoint = { x: 1, y: 1, z: 1 };
  let targetValues = {};
  let precision = 6;

  const visualizer = window.CoordinateVisualizer.create(function () {
    return {
      sourceSystem: sourceSel.value,
      targetSystem: targetSel.value,
      sourcePoint: sourcePoint,
      targetPoint: targetPoint,
      plane: planeSel.value
    };
  });

  function normalAngle(degrees) {
    return ((degrees % 360) + 360) % 360;
  }

  function cleanZero(value) {
    return Math.abs(value) < 1e-12 ? 0 : value;
  }

  // Convert any supported system to a shared Cartesian 3D point.
  function toCartesian(system, values, plane) {

    if (system === 'cartesian') {
      return {
        x: values.x,
        y: values.y,
        z: values.z
      };
    }

    if (system === 'polar') {
      const angle = values.theta * Math.PI / 180;
      const radius = values.r;

      if (plane === 'xz') {
        return {
          x: radius * Math.cos(angle),
          y: 0,
          z: radius * Math.sin(angle)
        };
      }

      if (plane === 'yz') {
        return {
          x: 0,
          y: radius * Math.cos(angle),
          z: radius * Math.sin(angle)
        };
      }

      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: 0
      };
    }

    if (system === 'cylindrical') {
      const angle = values.theta * Math.PI / 180;

      return {
        x: values.r * Math.cos(angle),
        y: values.r * Math.sin(angle),
        z: values.z
      };
    }

    let rho = values.rho;
    let theta = values.theta;
    let phi = normalAngle(values.phi);

    if (phi > 180) {
      phi = 360 - phi;
      theta += 180;
    }

    if (rho < 0) {
      rho = -rho;
      theta += 180;
      phi = 180 - phi;
    }

    const azimuth = normalAngle(theta) * Math.PI / 180;
    const polarAngle = phi * Math.PI / 180;

    return {
      x: rho * Math.sin(polarAngle) * Math.cos(azimuth),
      y: rho * Math.sin(polarAngle) * Math.sin(azimuth),
      z: rho * Math.cos(polarAngle)
    };
  }

  // Convert a Cartesian point into the requested coordinate system.
  function fromCartesian(system, point, plane) {
    const x = point.x;
    const y = point.y;
    const z = point.z;

    if (system === 'cartesian') {
      return { x: x, y: y, z: z };
    }

    if (system === 'polar') {
      let a, b;

      if (plane === 'xz') {
        a = x;
        b = z;
      } else if (plane === 'yz') {
        a = y;
        b = z;
      } else {
        a = x;
        b = y;
      }

      return {
        r: Math.hypot(a, b),
        theta: normalAngle(
          Math.atan2(b, a) * 180 / Math.PI
        )
      };
    }

    const radius = Math.hypot(x, y);

    if (system === 'cylindrical') {
      return {
        r: radius,
        theta: radius === 0
          ? 0
          : normalAngle(Math.atan2(y, x) * 180 / Math.PI),
        z: z
      };
    }

    const rho = Math.hypot(x, y, z);

    return {
      rho: rho,

      theta: (x === 0 && y === 0)
        ? 0
        : normalAngle(Math.atan2(y, x) * 180 / Math.PI),

      phi: rho === 0
        ? 0
        : Math.acos(
            Math.max(-1, Math.min(1, z / rho))
          ) * 180 / Math.PI
    };
  }

  function format(number) {
    if (!Number.isFinite(number)) return '—';

    return cleanZero(number).toFixed(precision);
  }

  function valuesFor(system, values) {
    return SYSTEMS[system].fields.map(function (field) {
      return values[field[0]];
    });
  }

  function tupleFor(system, values) {
    return '(' +
      valuesFor(system, values).map(format).join(', ') +
      ')';
  }

  // Validate user input.
  function parseAndValidate() {
    const system = sourceSel.value;
    const values = {};

    for (const [key, label] of SYSTEMS[system].fields) {
      const input = $('field_' + key);
      const raw = input.value.trim();

      input.setAttribute('aria-invalid', 'false');

      if (
        raw === '' ||
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)
      ) {
        input.setAttribute('aria-invalid', 'true');

        return {
          error:
            'Please enter a number for ' + label +
            '. You can use a minus sign and a decimal point.'
        };
      }

      const decimalPlaces = (raw.split('.')[1] || '').length;

      if (decimalPlaces > 10) {
        input.setAttribute('aria-invalid', 'true');

        return {
          error:
            label + ' has ' + decimalPlaces +
            ' decimal places. The maximum is 10.'
        };
      }

      const number = Number(raw);

      if (!Number.isFinite(number) || Math.abs(number) > MAX) {
        input.setAttribute('aria-invalid', 'true');

        return {
          error:
            label +
            ' must be between −1,000,000,000,000 and +1,000,000,000,000.'
        };
      }

      values[key] = number;
    }

    return { values: values };
  }

  // Generate input boxes according to selected coordinate system.
  function showFields() {
    const system = sourceSel.value;

    fieldsBox.innerHTML = '';

    for (const [key, label] of SYSTEMS[system].fields) {
      const wrapper = document.createElement('div');
      wrapper.className = 'coord-field';

      const id = 'field_' + key;

      const labelElement = document.createElement('label');
      labelElement.className = 'field-label';
      labelElement.htmlFor = id;
      labelElement.textContent = label;

      const input = document.createElement('input');

      input.className = 'coordinate-input';
      input.id = id;
      input.name = key;
      input.type = 'text';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.placeholder = 'Enter a number';

      input.value = inputValues[system][key] ?? '0';

      input.setAttribute('aria-describedby', 'inputHelp');

      input.addEventListener('input', function () {
        inputValues[system][key] = input.value;
      });

      wrapper.append(labelElement, input);
      fieldsBox.append(wrapper);
    }

    const hint = document.createElement('div');

    hint.id = 'inputHelp';
    hint.className = 'field-hint coord-field full';

    hint.textContent =
      'Use a dot for decimals, for example 12.3456789012. Angles use degrees.';

    fieldsBox.append(hint);

    planeBox.hidden = !(
      system === 'polar' ||
      targetSel.value === 'polar'
    );
  }

  // Display individual converted coordinate values.
  function renderMetrics(target, values) {
    const box = $('resultMetrics');

    box.innerHTML = '';

    const labels = {
      cartesian: [
        ['x', 'x · left / right', ''],
        ['y', 'y · forward / back', ''],
        ['z', 'z · up / down', '']
      ],

      polar: [
        ['r', 'r · distance', ''],
        ['theta', 'θ · direction', '°']
      ],

      cylindrical: [
        ['r', 'r · distance from Z', ''],
        ['theta', 'θ · around Z', '°'],
        ['z', 'z · height', '']
      ],

      spherical: [
        ['rho', 'ρ · distance from origin', ''],
        ['theta', 'θ · around Z', '°'],
        ['phi', 'φ · down from +Z', '°']
      ]
    };

    for (const [key, label, unit] of labels[target]) {
      const metric = document.createElement('div');
      metric.className = 'metric';

      const small = document.createElement('small');
      small.textContent = label;

      const strong = document.createElement('strong');

      strong.textContent =
        format(values[key]) +
        (unit ? ' ' + unit : '');

      metric.append(small, strong);
      box.append(metric);
    }
  }

  // Explain the conversion in beginner-friendly language.
  function explanatoryText(source, target) {
    const sourceDescriptions = {
      cartesian:
        'three straight distances along the X, Y and Z axes',

      polar:
        'a flat-plane distance and a turning angle',

      cylindrical:
        'a distance from the Z-axis, an angle around it, and a height',

      spherical:
        'a straight-line distance from the origin and two angles'
    };

    const targetDescriptions = {
      cartesian:
        'X, Y and Z distances',

      polar:
        'a distance and a direction on the selected flat plane',

      cylindrical:
        'a radius, an angle around Z, and a height',

      spherical:
        'a radius from the origin, an azimuth angle, and a polar angle'
    };

    $('explanation').textContent =
      'You started with ' +
      sourceDescriptions[source] +
      '. The app first located the point in 3D space, then described that exact location using ' +
      targetDescriptions[target] +
      '. The point stays in the same place.';

    const formulas = {
      cartesian: 'x, y, z',

      polar:
        'r = √(a² + b²),  θ = atan2(b, a)',

      cylindrical:
        'r = √(x² + y²),  θ = atan2(y, x),  z = z',

      spherical:
        'ρ = √(x² + y² + z²),  θ = atan2(y, x),  φ = cos⁻¹(z / ρ)'
    };

    $('formulaLine').textContent =
      SYSTEMS[source].name +
      ' → ' +
      SYSTEMS[target].name +
      ': ' +
      formulas[target] +
      '.';
  }

  // Main conversion function.
  function convert() {
    $('inputError').hidden = true;

    const parsed = parseAndValidate();

    if (parsed.error) {
      $('inputError').textContent = parsed.error;
      $('inputError').hidden = false;

      $('statusText').textContent = '● Check the input';
      $('statusText').style.color = 'var(--bad)';

      return false;
    }

    const source = sourceSel.value;
    const target = targetSel.value;
    const plane = planeSel.value;

    const point = toCartesian(source, parsed.values, plane);

    const result = fromCartesian(target, point, plane);

    if (
      Object.values(point).some(function (value) {
        return !Number.isFinite(value);
      })
    ) {
      $('inputError').textContent =
        'These values are too large for a reliable calculation. Try smaller numbers.';

      $('inputError').hidden = false;

      return false;
    }

    sourcePoint = point;

    targetPoint = {
      x: point.x,
      y: point.y,
      z: point.z
    };

    targetValues = result;

    $('resultValue').textContent = tupleFor(target, result);

    $('resultName').textContent =
      SYSTEMS[target].short +
      (target === 'polar'
        ? ' · ' + names[plane] + ' projection'
        : '');

    renderMetrics(target, result);

    explanatoryText(source, target);

    $('statusText').textContent = '● Conversion complete';
    $('statusText').style.color = 'var(--good)';

    const notice = $('projectionNotice');

    if (target === 'polar') {
      const omitted =
        plane === 'xy' ? 'Z' :
        (plane === 'xz' ? 'Y' : 'X');

      notice.textContent =
        'Polar is 2D. This result uses the ' +
        names[plane] +
        ' projection, so the ' +
        omitted +
        ' component is left out. The source model keeps the full 3D point; the Polar result model shows its 2D projection.';

      notice.hidden = false;

    } else if (source === 'polar') {

      notice.textContent =
        'A Polar point starts on the ' +
        names[plane] +
        ' with its missing third coordinate set to zero. The app then converts that 3D point into ' +
        SYSTEMS[target].name +
        '.';

      notice.hidden = false;

    } else {
      notice.hidden = true;
    }

    // Update diagram headings and descriptions.
    $('sourceVizTitle').textContent =
      'Original · ' + SYSTEMS[source].name;

    $('sourceVizDesc').textContent =
      tupleFor(source, parsed.values);

    $('targetVizTitle').textContent =
      'Converted · ' + SYSTEMS[target].name;

    $('targetVizDesc').textContent =
      tupleFor(target, result);

    $('sourceCanvas').setAttribute(
      'aria-label',
      '3D model of original ' +
      SYSTEMS[source].name +
      ' point. Its Cartesian position is x ' +
      format(point.x) +
      ', y ' +
      format(point.y) +
      ', z ' +
      format(point.z) +
      '. Drag to rotate.'
    );

    const targetDescription = target === 'polar'
      ? 'Model of the Polar result projected onto the ' +
        names[plane] +
        '. One component is omitted in Polar coordinates. Drag to rotate.'
      : '3D model of converted ' +
        SYSTEMS[target].name +
        ' point. It is the same Cartesian position. Drag to rotate.';

    $('targetCanvas').setAttribute(
      'aria-label',
      targetDescription +
      ' Cartesian position: x ' +
      format(point.x) +
      ', y ' +
      format(point.y) +
      ', z ' +
      format(point.z) +
      '.'
    );

    visualizer.drawAll();

    return true;
  }

  function syncFieldsAndConvert() {
    showFields();
    convert();
  }

  // Press Enter to convert.
  fieldsBox.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      convert();
    }
  });

  // Coordinate system selection.
  sourceSel.addEventListener('change', syncFieldsAndConvert);

  targetSel.addEventListener('change', function () {
    planeBox.hidden = !(
      sourceSel.value === 'polar' ||
      targetSel.value === 'polar'
    );

    convert();
  });

  planeSel.addEventListener('change', convert);

  // Swap source and target systems.
  $('swapBtn').addEventListener('click', function () {
    if (!convert()) return;

    const oldSource = sourceSel.value;
    const oldTarget = targetSel.value;

    inputValues[oldTarget] = Object.assign({}, targetValues);

    sourceSel.value = oldTarget;
    targetSel.value = oldSource;

    syncFieldsAndConvert();
  });

  $('convertBtn').addEventListener('click', convert);

  // Reset the application.
  $('resetBtn').addEventListener('click', function () {
    sourceSel.value = 'cartesian';
    targetSel.value = 'spherical';
    planeSel.value = 'xy';

    inputValues = {
      cartesian: {
        x: '1',
        y: '1',
        z: '1'
      },

      polar: {
        r: '1.4142135624',
        theta: '45'
      },

      cylindrical: {
        r: '1.4142135624',
        theta: '45',
        z: '1'
      },

      spherical: {
        rho: '1.7320508076',
        theta: '45',
        phi: '54.7356103172'
      }
    };

    precision = 6;

    $('precision').value = '6';
    $('precisionValue').textContent = '6';

    showFields();
    convert();
  });

  // Decimal precision setting.
  $('precision').addEventListener('input', function (event) {
    precision = Number(event.target.value);

    $('precisionValue').textContent = String(precision);

    convert();
  });

  // Preset physics examples.
  const examples = {
    cartesian: {
      source: 'cartesian',
      target: 'spherical',
      values: {
        x: '3',
        y: '4',
        z: '2'
      },
      plane: 'xy'
    },

    cylindrical: {
      source: 'cylindrical',
      target: 'cartesian',
      values: {
        r: '2.5',
        theta: '60',
        z: '4'
      },
      plane: 'xy'
    },

    spherical: {
      source: 'spherical',
      target: 'cartesian',
      values: {
        rho: '6.4',
        theta: '35',
        phi: '55'
      },
      plane: 'xy'
    },

    polar: {
      source: 'polar',
      target: 'cartesian',
      values: {
        r: '5',
        theta: '135'
      },
      plane: 'xy'
    }
  };

  document.querySelectorAll('[data-example]').forEach(function (button) {
    button.addEventListener('click', function () {
      const example = examples[button.dataset.example];

      sourceSel.value = example.source;
      targetSel.value = example.target;
      planeSel.value = example.plane;

      inputValues[example.source] =
        Object.assign({}, example.values);

      showFields();
      convert();

      $('converter').scrollIntoView({
        behavior: document.body.classList.contains('reduce-motion')
          ? 'auto'
          : 'smooth',

        block: 'start'
      });
    });
  });

  // Set up independent utility modules.
  window.CoordinateControls.bindAccessibility(
    visualizer.drawAll
  );

  window.CoordinateControls.bindViewControls(
    visualizer
  );

  window.CoordinateControls.bindCopyAndSpeech(
    function () {
      return SYSTEMS[targetSel.value].short;
    },

    function () {
      return $('resultValue').textContent;
    },

    function () {
      return $('explanation').textContent;
    }
  );

  visualizer.bindInteractions();

  showFields();
  convert();

})();
