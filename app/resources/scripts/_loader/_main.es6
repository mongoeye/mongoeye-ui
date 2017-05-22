/* global head */
/* global loader */
/* global Globalize */
import nprogress from 'nprogress';
import './compatibility.es6';
import './loader.es6';

// Export libs global
window.nprogress = nprogress;

// Config progress bar
nprogress.configure({ easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)', speed: 600 });

// Wait for localization
// head.ready(['locale'], () => {
//   loader.showMsg(Globalize.formatMessage('loader/loading/scripts'));
// });
