/* Coordinate Universe — 3D canvas visualiser.
 * This file owns camera state, drawing, pointer/keyboard rotation and zoom.
 */
(function () {
  'use strict';

  function create(getState) {
    let camera = {
      yaw: -0.68,
      pitch: 0.48,
      zoom: 1
    };

    function drawModel(canvas, system, point, plane) {
      const rect = canvas.getBoundingClientRect();

      if (rect.width < 2 || rect.height < 2) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext('2d');

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const light = document.body.classList.contains('light');
      const contrast = document.body.classList.contains('high-contrast');

      const muted = contrast
        ? '#fff'
        : (
            light
              ? 'rgba(45,67,110,.58)'
              : 'rgba(183,204,255,.48)'
          );

      const cyan = contrast ? '#00ffff' : '#69e5ff';
      const purple = contrast ? '#ffea00' : '#ad98ff';
      const pink = contrast ? '#ff6688' : '#ff8fca';

      const magnitude = Math.max(
        Math.hypot(point.x, point.y, point.z),
        .5
      );

      const unit = Math.max(
        1e-10,
        Math.min(110, 108 / magnitude)
      ) * camera.zoom;

      const origin = {
        x: w * .5,
        y: h * .55
      };

      const yaw = camera.yaw;
      const pitch = camera.pitch;

      function project(p) {
        const xx =
          p.x * Math.cos(yaw) -
          p.y * Math.sin(yaw);

        const yy =
          p.x * Math.sin(yaw) +
          p.y * Math.cos(yaw);

        return {
          x: origin.x + xx * unit,

          y: origin.y -
            (
              yy * Math.sin(pitch) +
              p.z * Math.cos(pitch)
            ) * unit
        };
      }

      function line(
        a,
        b,
        color = muted,
        width = 1,
        dash = []
      ) {
        const A = project(a);
        const B = project(b);

        ctx.beginPath();
        ctx.setLineDash(dash);

        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);

        ctx.stroke();
        ctx.setLineDash([]);
      }

      function poly(
        points,
        color,
        width = 1,
        dash = []
      ) {
        ctx.beginPath();
        ctx.setLineDash(dash);

        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        points.forEach(function (p, i) {
          const q = project(p);

          if (i) {
            ctx.lineTo(q.x, q.y);
          } else {
            ctx.moveTo(q.x, q.y);
          }
        });

        ctx.stroke();
        ctx.setLineDash([]);
      }

      function dot(p, color, r = 4) {
        const q = project(p);

        ctx.beginPath();

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);

        ctx.fill();

        ctx.shadowBlur = 0;
      }

      const extent = 1.7;

      // Reference grid.
      function gridPoint(u, v) {
        if (system === 'polar' && plane === 'xz') {
          return { x: u, y: 0, z: v };
        }

        if (system === 'polar' && plane === 'yz') {
          return { x: 0, y: u, z: v };
        }

        return { x: u, y: v, z: 0 };
      }

      for (let i = -2; i <= 2; i++) {
        line(
          gridPoint(i * .65, -extent),
          gridPoint(i * .65, extent),
          muted,
          .65
        );

        line(
          gridPoint(-extent, i * .65),
          gridPoint(extent, i * .65),
          muted,
          .65
        );
      }

      // Coordinate axes and labels.
      const axes = [
        ['x', { x: extent, y: 0, z: 0 }, pink],
        ['y', { x: 0, y: extent, z: 0 }, purple],
        ['z', { x: 0, y: 0, z: extent }, cyan]
      ];

      for (const [label, end, color] of axes) {
        line(
          {
            x: -end.x,
            y: -end.y,
            z: -end.z
          },
          end,
          color,
          1.7
        );

        const q = project(end);

        ctx.fillStyle = color;
        ctx.font = 'bold 12px system-ui';

        ctx.fillText(
          label.toUpperCase(),
          q.x + 5,
          q.y - 5
        );
      }

      // Actual Cartesian position.
      const actual = {
        x: point.x,
        y: point.y,
        z: point.z
      };

      let displayed = { ...actual };

      // Polar is displayed as a 2D projection.
      if (system === 'polar') {
        if (plane === 'xz') {
          displayed = {
            x: actual.x,
            y: 0,
            z: actual.z
          };
        } else if (plane === 'yz') {
          displayed = {
            x: 0,
            y: actual.y,
            z: actual.z
          };
        } else {
          displayed = {
            x: actual.x,
            y: actual.y,
            z: 0
          };
        }
      }

      // Cartesian model.
      if (system === 'cartesian') {
        const o = {
          x: 0,
          y: 0,
          z: 0
        };

        const px = {
          x: actual.x,
          y: 0,
          z: 0
        };

        const pxy = {
          x: actual.x,
          y: actual.y,
          z: 0
        };

        line(o, px, pink, 1.5, [5, 4]);
        line(px, pxy, purple, 1.5, [5, 4]);
        line(pxy, actual, cyan, 1.5, [5, 4]);

        line(
          {
            x: actual.x,
            y: actual.y,
            z: 0
          },
          actual,
          cyan,
          2
        );

      // Polar model.
      } else if (system === 'polar') {
        const rr = Math.hypot(
          displayed.x,
          displayed.y,
          displayed.z
        );

        const radius = Math.max(.35, rr);

        for (let j = 0; j < 2; j++) {
          const pts = [];

          for (let i = 0; i <= 72; i++) {
            const a = i * Math.PI * 2 / 72;

            let q;

            if (plane === 'xz') {
              q = {
                x: radius * Math.cos(a),
                y: 0,
                z: radius * Math.sin(a)
              };

            } else if (plane === 'yz') {
              q = {
                x: 0,
                y: radius * Math.cos(a),
                z: radius * Math.sin(a)
              };

            } else {
              q = {
                x: radius * Math.cos(a),
                y: radius * Math.sin(a),
                z: 0
              };
            }

            pts.push(q);
          }

          poly(pts, purple, 1.1);
        }

        line(
          { x: 0, y: 0, z: 0 },
          displayed,
          cyan,
          2
        );

      // Cylindrical model.
      } else if (system === 'cylindrical') {
        const radius = Math.max(
          .25,
          Math.hypot(actual.x, actual.y)
        );

        const z0 = actual.z;

        const bottom = [];
        const top = [];

        for (let i = 0; i <= 64; i++) {
          const a = i * Math.PI * 2 / 64;

          bottom.push({
            x: radius * Math.cos(a),
            y: radius * Math.sin(a),
            z: Math.min(0, z0)
          });

          top.push({
            x: radius * Math.cos(a),
            y: radius * Math.sin(a),
            z: Math.max(0, z0)
          });
        }

        poly(bottom, purple, 1.1);
        poly(top, purple, 1.1);

        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;

          line(
            {
              x: radius * Math.cos(a),
              y: radius * Math.sin(a),
              z: Math.min(0, z0)
            },
            {
              x: radius * Math.cos(a),
              y: radius * Math.sin(a),
              z: Math.max(0, z0)
            },
            purple,
            .8,
            [3, 3]
          );
        }

        line(
          { x: 0, y: 0, z: 0 },
          actual,
          cyan,
          2
        );

      // Spherical model.
      } else if (system === 'spherical') {
        const radius = Math.max(
          .3,
          Math.hypot(actual.x, actual.y, actual.z)
        );

        // Latitude circles.
        for (let lat = -60; lat <= 60; lat += 30) {
          const pts = [];

          const f = lat * Math.PI / 180;

          for (let i = 0; i <= 72; i++) {
            const a = i * Math.PI * 2 / 72;

            pts.push({
              x: radius * Math.cos(f) * Math.cos(a),
              y: radius * Math.cos(f) * Math.sin(a),
              z: radius * Math.sin(f)
            });
          }

          poly(pts, purple, .8);
        }

        // Longitude circles.
        for (let mer = 0; mer < 6; mer++) {
          const a = mer * Math.PI / 6;

          const pts = [];

          for (let i = 0; i <= 60; i++) {
            const f =
              -Math.PI / 2 +
              i * Math.PI / 60;

            pts.push({
              x: radius * Math.cos(f) * Math.cos(a),
              y: radius * Math.cos(f) * Math.sin(a),
              z: radius * Math.sin(f)
            });
          }

          poly(pts, purple, .8);
        }

        line(
          { x: 0, y: 0, z: 0 },
          actual,
          cyan,
          2
        );
      }

      // Guide line and point marker.
      line(
        {
          x: displayed.x,
          y: displayed.y,
          z: 0
        },
        displayed,
        'rgba(121,231,255,.7)',
        1.2,
        [4, 4]
      );

      dot(displayed, '#fff', 4.8);
      dot(displayed, cyan, 2.5);

      const q = project(displayed);

      ctx.fillStyle = light ? '#15213c' : '#edf3ff';
      ctx.font = '11px system-ui';

      ctx.fillText('P', q.x + 9, q.y - 8);

      const oq = project({
        x: 0,
        y: 0,
        z: 0
      });

      ctx.beginPath();
      ctx.fillStyle = muted;

      ctx.arc(
        oq.x,
        oq.y,
        2.5,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // Origin label.
      ctx.fillStyle = muted;
      ctx.font = '10px system-ui';

      ctx.fillText(
        'ORIGIN',
        oq.x + 7,
        oq.y + 14
      );
    }

    // Draw both coordinate models.
    function drawAll() {
      const state = getState();

      drawModel(
        document.getElementById('sourceCanvas'),
        state.sourceSystem,
        state.sourcePoint,
        state.plane
      );

      drawModel(
        document.getElementById('targetCanvas'),
        state.targetSystem,
        state.targetPoint,
        state.plane
      );
    }

    // Restore default camera position.
    function resetCamera() {
      camera = {
        yaw: -0.68,
        pitch: 0.48,
        zoom: 1
      };

      drawAll();
    }

    // Mouse and touch interaction.
    function setupDrag(canvas) {
      let drag = null;

      canvas.addEventListener('pointerdown', function (event) {
        drag = {
          x: event.clientX,
          y: event.clientY
        };

        canvas.setPointerCapture(event.pointerId);
      });

      canvas.addEventListener('pointermove', function (event) {
        if (!drag) return;

        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;

        drag = {
          x: event.clientX,
          y: event.clientY
        };

        camera.yaw += dx * 0.008;

        camera.pitch = Math.max(
          -1.35,
          Math.min(
            1.35,
            camera.pitch + dy * 0.008
          )
        );

        drawAll();
      });

      canvas.addEventListener('pointerup', function () {
        drag = null;
      });

      canvas.addEventListener('pointercancel', function () {
        drag = null;
      });

      // Mouse wheel zoom.
      canvas.addEventListener('wheel', function (event) {
        event.preventDefault();

        camera.zoom = Math.max(
          0.45,
          Math.min(
            2.8,
            camera.zoom * (
              event.deltaY < 0 ? 1.08 : 0.92
            )
          )
        );

        drawAll();

      }, { passive: false });

      // Keyboard camera movement.
      canvas.addEventListener('keydown', function (event) {
        let used = true;

        if (event.key === 'ArrowLeft') {
          camera.yaw -= 0.12;

        } else if (event.key === 'ArrowRight') {
          camera.yaw += 0.12;

        } else if (event.key === 'ArrowUp') {
          camera.pitch = Math.min(
            1.35,
            camera.pitch + 0.12
          );

        } else if (event.key === 'ArrowDown') {
          camera.pitch = Math.max(
            -1.35,
            camera.pitch - 0.12
          );

        } else {
          used = false;
        }

        if (used) {
          event.preventDefault();
          drawAll();
        }
      });
    }

    // Connect interactions to both models.
    function bindInteractions() {
      setupDrag(
        document.getElementById('sourceCanvas')
      );

      setupDrag(
        document.getElementById('targetCanvas')
      );

      window.addEventListener('resize', drawAll);
    }

    return {
      drawAll: drawAll,

      resetCamera: resetCamera,

      zoomIn: function () {
        camera.zoom = Math.min(
          2.8,
          camera.zoom * 1.18
        );

        drawAll();
      },

      zoomOut: function () {
        camera.zoom = Math.max(
          0.45,
          camera.zoom / 1.18
        );

        drawAll();
      },

      bindInteractions: bindInteractions
    };
  }

  window.CoordinateVisualizer = {
    create: create
  };

})();
