export function setupControls({ visualizer, calculate }) {
  const ids = ["x", "y", "z"];
  const inputs = Object.fromEntries(ids.map(id => [id, document.getElementById(`${id}-input`)]));
  const sliders = Object.fromEntries(ids.map(id => [id, document.getElementById(`${id}-slider`)]));
  const outputs = Object.fromEntries(ids.map(id => [id, document.getElementById(`${id}-output`)]));

  function readNumber(input) {
    const value = Number(input.value);
    return Number.isFinite(value) ? Math.max(-5, Math.min(5, value)) : 0;
  }

  function update(source) {
    const point = {
      x: readNumber(inputs.x),
      y: readNumber(inputs.y),
      z: readNumber(inputs.z)
    };

    ids.forEach(id => {
      inputs[id].value = point[id];
      sliders[id].value = point[id];
      outputs[id].textContent = point[id].toFixed(1);
    });

    const result = calculate(point.x, point.y, point.z);
    document.getElementById("polar-r").textContent = result.r.toFixed(2);
    document.getElementById("polar-theta").textContent = `${result.theta.toFixed(2)}°`;
    document.getElementById("cyl-r").textContent = result.r.toFixed(2);
    document.getElementById("cyl-theta").textContent = `${result.theta.toFixed(2)}°`;
    document.getElementById("cyl-z").textContent = point.z.toFixed(2);
    document.getElementById("sph-rho").textContent = result.rho.toFixed(2);
    document.getElementById("sph-theta").textContent = `${result.theta.toFixed(2)}°`;
    document.getElementById("sph-phi").textContent = `${result.phi.toFixed(2)}°`;

    visualizer.setPoint(point.x, point.y, point.z);
  }

  ids.forEach(id => {
    inputs[id].addEventListener("input", () => update("input"));
    sliders[id].addEventListener("input", () => {
      inputs[id].value = sliders[id].value;
      update("slider");
    });
  });

  document.getElementById("reset-view").addEventListener("click", () => visualizer.resetView());
  document.getElementById("grid-toggle").addEventListener("change", event => visualizer.showGrid(event.target.checked));
  document.getElementById("projection-toggle").addEventListener("change", event => visualizer.showProjections(event.target.checked));

  update("initial");
}
