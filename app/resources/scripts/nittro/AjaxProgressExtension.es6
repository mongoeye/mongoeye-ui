/* global _context */
/* global nprogress */
_context.invoke('Nittro', (BuilderExtension) => {
  const AjaxProgressExtension = _context.extend(
    BuilderExtension,
    function (containerBuilder, config) {
      AjaxProgressExtension.Super.call(this, containerBuilder, config);
    },
    {
      setup() {
        function showSpinner() {
          nprogress.start();
          nprogress.set(0.8);
        }

        function hideSpinner() {
          nprogress.done();
        }

        const builder = this._getContainerBuilder();
        builder.getServiceDefinition('page').addSetup((page) => {
          page.on('transaction-created', (evt) => {
            if (
              !evt.data.context.event ||
              !evt.data.context.event.data ||
              !evt.data.context.event.data.disableSpinner) {
              showSpinner();
              evt.data.transaction.then(hideSpinner, hideSpinner);
            }
          });
        });
      },
    },
  );

  _context.register(AjaxProgressExtension, 'AjaxProgressExtension');
}, {
  BuilderExtension: 'Nittro.DI.BuilderExtension',
});
