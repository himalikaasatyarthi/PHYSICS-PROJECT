/* Coordinate Universe — accessibility and convenience controls.
 * Keeps display preferences, camera buttons, clipboard and speech features out
 * of the coordinate-conversion logic.
 */
(function () {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function bindAccessibility(drawAll) {
    byId('themeBtn').addEventListener('click', function () {
      const enabled = document.body.classList.toggle('light');
      byId('themeBtn').setAttribute('aria-pressed', String(enabled));
      byId('themeBtn').textContent = enabled ? '☾ Dark mode' : '☼ Light mode';
      drawAll();
    });

    byId('contrastBtn').addEventListener('click', function () {
      const enabled = document.body.classList.toggle('high-contrast');
      byId('contrastBtn').setAttribute('aria-pressed', String(enabled));
      drawAll();
    });

    byId('textBtn').addEventListener('click', function () {
      const enabled = document.body.classList.toggle('large-text');
      byId('textBtn').setAttribute('aria-pressed', String(enabled));
    });

    byId('easyBtn').addEventListener('click', function () {
      const enabled = document.body.classList.toggle('easy-read');
      byId('easyBtn').setAttribute('aria-pressed', String(enabled));
    });

    byId('motionBtn').addEventListener('click', function () {
      const enabled = document.body.classList.toggle('reduce-motion');
      byId('motionBtn').setAttribute('aria-pressed', String(enabled));
    });
  }

  function bindViewControls(visualizer) {
    byId('zoomInBtn').addEventListener('click', visualizer.zoomIn);
    byId('zoomOutBtn').addEventListener('click', visualizer.zoomOut);
    byId('resetViewBtn').addEventListener('click', visualizer.resetCamera);
  }

  function bindCopyAndSpeech(getTargetName, getResult, getExplanation) {
    byId('copyBtn').addEventListener('click', async function () {
      const text = getTargetName() + ': ' + getResult();

      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          throw new Error('Clipboard unavailable');
        }

        await navigator.clipboard.writeText(text);
        byId('copyBtn').textContent = '✓ Copied';
      } catch (error) {
        byId('copyBtn').textContent = 'Copy not available';
      }
    });

    byId('speakBtn').addEventListener('click', function () {
      if (
        !('speechSynthesis' in window) ||
        !('SpeechSynthesisUtterance' in window)
      ) {
        byId('speakBtn').textContent =
          'Speech is not available in this browser';
        return;
      }

      window.speechSynthesis.cancel();

      const message =
        'Converted to ' + getTargetName() +
        ' coordinates. ' + getResult() +
        '. ' + getExplanation();

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.92;

      window.speechSynthesis.speak(utterance);
    });
  }

  window.CoordinateControls = {
    bindAccessibility: bindAccessibility,
    bindViewControls: bindViewControls,
    bindCopyAndSpeech: bindCopyAndSpeech
  };
})();
