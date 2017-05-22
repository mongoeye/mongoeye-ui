/* global _context */
/* eslint no-console:"off" */
/* eslint no-param-reassign: "off" */
_context.invoke('Nittro', (DOM, FlashesService, PageService, BuilderExtension) => {
  const TweaksExtension = _context.extend(
    BuilderExtension,
    function (containerBuilder, config) {
      TweaksExtension.Super.call(this, containerBuilder, config);
    },
    {
      setup() {
        const builder = this._getContainerBuilder();

        // Set flashes default target
        builder.getServiceDefinition('flashes')
          .addSetup((flashes) => {
            flashes.add = (content, type, target, rich) => FlashesService.prototype.add.apply(this, [content, type, target || 'flashes', rich]);
          });

        // Handle ajax errors
        builder.getServiceDefinition('page')
          .addSetup((page) => {
            let currentTransaction = null;

            function afterTransaction() {
              currentTransaction = null;
            }

            page.on('transaction-created', (evt) => {
              currentTransaction = evt.data.transaction;
              currentTransaction.then(afterTransaction, afterTransaction);
            });

            page.on('before-transaction', (evt) => {
              if (evt.data.context.element &&
                ['A', 'FORM'].indexOf(evt.data.context.element.tagName) !== -1) {
                if (currentTransaction) {
                  // Prevent default browser action (open link or send form)
                  evt.data.context.event.preventDefault();
                  // Remove element focus
                  evt.data.context.element.blur();
                  throw Error('Another request is still running.');
                }
              }
            });

            // Suppresses error 'Uncaught (in promise)' on request error
            page.open = function (url, method, data, context) {
              const promise = PageService.prototype.open.apply(this, arguments);
              promise.catch((e) => {
                const msg = `Cannot dispatch ${method.toUpperCase()} request: ${url} `;
                if (e) {
                  console.warn(e, msg);
                } else {
                  console.warn(msg);
                }
              });
              return promise;
            };

            page.sendForm = function () {
              const promise = PageService.prototype.sendForm.apply(this, arguments);
              promise.catch(() => {});
              return promise;
            };
          });
      },
    },
  );

  _context.register(TweaksExtension, 'TweaksExtension');
}, {
  DOM: 'Utils.DOM',
  FlashesService: 'Nittro.Flashes.Service',
  PageService: 'Nittro.Page.Service',
  BuilderExtension: 'Nittro.DI.BuilderExtension',
});
