/* global _context */
/* global nprogress */
/* global d3 */
/* global c3 */
/* global Hammer */
/* global Globalize */
import './TweaksExtension.es6';
import './AjaxProgressExtension.es6';
import Analysis from '../app/analysis';

_context.invoke(function (Nittro) {
  // Get base path
  const basePath = document.body.getAttribute('data-basepath');

  // App configuration
  const configuration = {};

  _context.lookup('Nittro.Page.Service').defaults.autoResetForms = false;

  // Setup builder
  const builder = new Nittro.DI.ContainerBuilder({
    params: {
      configuration,
      page: {
        transitions: {
          defaultSelector: '.transition-auto'
        },
        i18n: {
          connectionError: Globalize.formatMessage('errors/ajax/connection'),
          unknownError: Globalize.formatMessage('errors/ajax/unknown'),
        },
      },
      forms: {
        autoResetForms: false,
      },
    },
    extensions: {
      forms: 'Nittro.Forms.Bridges.FormsDI.FormsExtension()',
      ajax: 'Nittro.Ajax.Bridges.AjaxDI.AjaxExtension()',
      page: 'Nittro.Page.Bridges.PageDI.PageExtension()',
      routing: 'Nittro.Routing.Bridges.RoutingDI.RoutingExtension()',
      flashes: 'Nittro.Flashes.Bridges.FlashesDI.FlashesExtension()',
      tweaks: 'Nittro.TweaksExtension',
      spinner: 'Nittro.AjaxProgressExtension',
    },
    services: {
      window: () => window,
      nprogress: () => nprogress,
      DOM: () => _context.lookup('Utils.DOM'),
      EventEmitter: () => _context.lookup('Nittro.EventEmitter'),
      Event: () => _context.lookup('Nittro.Event'),
      d3: () => d3,
      c3: () => c3,
      Hammer: () => Hammer,
      analysis: { factory: 'App.Analysis', run: true },
    },
  });

  _context.register(Analysis, 'App.Analysis');

  // Create container
  this.di = builder.createContainer();
  this.di.runServices();
});
