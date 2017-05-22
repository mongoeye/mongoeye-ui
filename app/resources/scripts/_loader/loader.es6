/* global head */
import '../_vendor/head.load.modified';

head.load(
  document.body
    .getAttribute('data-loader')
    .split(';')
    .map((script) => {
      let url = script.trim();
      let label;

      const parts = url.match(/^(.+):(.[^/$].*)$/);
      if (parts) {
        label = parts[1];
        url = parts[2];
      } else {
        // If no label found, then is label set to filename without args after ?
        label = url.match(/([^?/]+)(\?.+)?$/)[1];
      }

      const out = {};
      out[label] = url;
      return out;
    }),
);
