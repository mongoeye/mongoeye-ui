/* global _context */
/* eslint no-console:"off" */
/* eslint no-param-reassign: "off" */
_context.invoke('Nittro', function (DOM, FlashesService, PageService, BuilderExtension) {
  var TweaksExtension = _context.extend(BuilderExtension, function (containerBuilder, config) {
    TweaksExtension.Super.call(this, containerBuilder, config);
  }, {
    setup: function setup() {
      var _this = this;

      var builder = this._getContainerBuilder();

      // Set flashes default target
      builder.getServiceDefinition('flashes').addSetup(function (flashes) {
        flashes.add = function (content, type, target, rich) {
          return FlashesService.prototype.add.apply(_this, [content, type, target || 'flashes', rich]);
        };
      });

      // Handle ajax errors
      builder.getServiceDefinition('page').addSetup(function (page) {
        var currentTransaction = null;

        function afterTransaction() {
          currentTransaction = null;
        }

        page.on('transaction-created', function (evt) {
          currentTransaction = evt.data.transaction;
          currentTransaction.then(afterTransaction, afterTransaction);
        });

        page.on('before-transaction', function (evt) {
          if (evt.data.context.element && ['A', 'FORM'].indexOf(evt.data.context.element.tagName) !== -1) {
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
          var promise = PageService.prototype.open.apply(this, arguments);
          promise.catch(function (e) {
            var msg = 'Cannot dispatch ' + method.toUpperCase() + ' request: ' + url + ' ';
            if (e) {
              console.warn(e, msg);
            } else {
              console.warn(msg);
            }
          });
          return promise;
        };

        page.sendForm = function () {
          var promise = PageService.prototype.sendForm.apply(this, arguments);
          promise.catch(function () {});
          return promise;
        };
      });
    }
  });

  _context.register(TweaksExtension, 'TweaksExtension');
}, {
  DOM: 'Utils.DOM',
  FlashesService: 'Nittro.Flashes.Service',
  PageService: 'Nittro.Page.Service',
  BuilderExtension: 'Nittro.DI.BuilderExtension'
});

/* global _context */
/* global nprogress */
_context.invoke('Nittro', function (BuilderExtension) {
  var AjaxProgressExtension = _context.extend(BuilderExtension, function (containerBuilder, config) {
    AjaxProgressExtension.Super.call(this, containerBuilder, config);
  }, {
    setup: function setup() {
      function showSpinner() {
        nprogress.start();
        nprogress.set(0.8);
      }

      function hideSpinner() {
        nprogress.done();
      }

      var builder = this._getContainerBuilder();
      builder.getServiceDefinition('page').addSetup(function (page) {
        page.on('transaction-created', function (evt) {
          if (!evt.data.context.event || !evt.data.context.event.data || !evt.data.context.event.data.disableSpinner) {
            showSpinner();
            evt.data.transaction.then(hideSpinner, hideSpinner);
          }
        });
      });
    }
  });

  _context.register(AjaxProgressExtension, 'AjaxProgressExtension');
}, {
  BuilderExtension: 'Nittro.DI.BuilderExtension'
});

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var Analysis = function () {
  function Analysis(ajax, d3, c3, DOM, Hammer, EventEmitter, router) {
    var _this = this;

    classCallCheck(this, Analysis);

    // Event emitter
    Object.assign(this, EventEmitter);

    this._ = {
      ajax: ajax,
      d3: d3,
      c3: c3,
      DOM: DOM,
      Hammer: Hammer,
      data: {},
      tree: {},
      elements: {
        fields: null,
        fieldName: null,
        charts: null
      },
      charts: {
        types: null
      },
      histograms: [],
      mongoDbTypes: {
        double: "#8fd5d8",
        int: "#99c7d8",
        long: "#5e9ecc",
        decimal: "#588dbf",
        minKey: "#526fb3",
        maxKey: "#aa52b3",
        timestamp: "#b3529c",
        date: "#b35269",
        symbol: "#9eb352",
        string: "#79b350",
        regex: "#52b352",
        javascript: "#52b381",
        javascriptWithScope: "#52b392",
        objectId: "#999182",
        dbPointer: "#b3946b",
        object: "#47aab3",
        array: "#47b3b3",
        binData: "#c2577d",
        'null': "#cccccc",
        undefined: "#999999",
        bool: "#459599"
      }
    };

    router.getDOMRoute('#scheme-analysis').on('match', function (evt) {
      return _this.analyze(evt.data[0]);
    });
  }

  createClass(Analysis, [{
    key: "analyze",
    value: function analyze(el) {
      var _this2 = this;

      var url = this._.DOM.getData(el, 'url');
      this._.ajax.get(url).then(function (status) {
        return _this2.generate(status, el);
      });
    }
  }, {
    key: "generate",
    value: function generate(response, el) {
      // Parse response
      this.parseResponse(response);

      // Charts
      el.innerHTML = "";
      this.createCharts(el);

      // Fields table
      this.createFieldsTable(el);
    }
  }, {
    key: "parseResponse",
    value: function parseResponse(response) {
      var _this3 = this;

      var payload = response.getPayload();
      this._.data = {};
      this._.tree = {
        count: payload['analyzedDocs'],
        children: {}
      };

      payload.fields.forEach(function (field) {
        _this3._.data[field.name] = field;

        var parent = _this3._.tree;
        var parts = field.name.split('.');

        // Create tree structure
        parts.forEach(function (name, i) {
          var last = i == parts.length - 1;

          if (last) {
            parent.children[name] = {
              name: name,
              fullName: field.name,
              count: field.count,
              percent: name == '[]' ? '-' : (field.count / parent.count * 100).toFixed(1) + '%',
              children: {}
            };
          } else {
            parent = parent.children[name];
          }
        });
      });
    }
  }, {
    key: "createCharts",
    value: function createCharts(el) {
      var _this4 = this;

      this._.elements.charts = this._.DOM.create("div", { "class": "charts" });
      setTimeout(function () {
        return _this4._.DOM.addClass(_this4._.elements.charts, 'show');
      }); // fade-in
      this._.DOM.append(el, this._.elements.charts);

      // Field name
      this._.elements.fieldName = this._.DOM.create("div", { "class": "field-name" });
      this._.DOM.append(this._.elements.charts, this._.elements.fieldName);

      // Types pie chart
      this._.charts.types = this.createChart("Types", {
        data: {
          columns: [],
          colors: this._.mongoDbTypes,
          type: 'pie'
        },
        legend: { position: 'right' },
        tooltip: { format: { value: function value(_value, ratio, id, index) {
              return _value + ' = ' + _this4._.d3.format(".1%")(ratio);
            } } },
        pie: { label: { format: function format(value, ratio, id, index) {
              return _this4._.d3.format(".1%")(ratio);
            } } },
        size: { height: 200 }
      });

      this.on('fieldSelect', function (evt) {
        var field = evt.data.field;
        var types = this._.data[field.fullName].types;

        this._.charts.types.chart.load({
          columns: types.map(function (t) {
            return [t.type, t.count];
          }),
          unload: true
        });

        this._.charts.types.chart.resize();
      });

      // Clear old histograms
      this.on('fieldSelect', function () {
        return _this4.clearAllHistograms();
      });

      // Value histograms
      this.on('fieldSelect', function (evt) {
        var _this5 = this;

        var field = evt.data.field;
        var types = this._.data[field.fullName].types;

        types.forEach(function (t) {
          if (t.weekdayHistogram) {
            _this5.createWeekdayHistogram(t);
          }

          if (t.hourHistogram) {
            _this5.createHourHistogram(t);
          }

          if (t.valueHistogram) {
            _this5.createValueHistogram(t);
          }

          if (t.lengthHistogram) {
            _this5.createLengthHistogram(t);
          }
        });
      });

      // Resize charts
      requestAnimationFrame(function () {
        Object.keys(_this4._.charts).forEach(function (key) {
          return _this4._.charts[key].chart.resize();
        });
      });
    }
  }, {
    key: "createChart",
    value: function createChart(name, config) {
      var containerEl = this._.DOM.create("div", { "class": "chart" });
      var titleEl = this._.DOM.create("div", { "class": "chart-title" });
      var chartEl = this._.DOM.create("div", { "class": "chart-c3" });

      titleEl.innerHTML = name;

      this._.DOM.append(containerEl, titleEl);
      this._.DOM.append(containerEl, chartEl);
      this._.DOM.append(this._.elements.charts, containerEl);

      config['bindto'] = chartEl;
      return {
        chart: this._.c3.generate(config),
        element: containerEl
      };
    }
  }, {
    key: "createValueHistogram",
    value: function createValueHistogram(type) {
      var data = type.valueHistogram;

      var histogram = this.createChart('Value histogram - ' + type.type, {
        data: {
          x: 'x',
          columns: [['x'].concat(data.intervals.map(function (v, i) {
            return i * data.step + data.start;
          })), ['count'].concat(data.intervals)],
          type: 'bar'
        },
        bar: { width: { ratio: 0.8 } },
        axis: {
          x: {
            type: 'categories',
            tick: {
              centered: true,
              outer: false,
              culling: {
                max: 15
              },
              fit: false
            }
          }
        },
        legend: {
          show: false
        },
        // zoom: {
        //   rescale: true,
        //   enabled: true
        // },
        size: { height: 250 }
      });

      this._.histograms.push(histogram);
    }
  }, {
    key: "createLengthHistogram",
    value: function createLengthHistogram(type) {
      var data = type.lengthHistogram;

      var histogram = this.createChart('Length histogram - ' + type.type, {
        data: {
          x: 'x',
          columns: [['x'].concat(data.intervals.map(function (v, i) {
            return i * data.step + data.start;
          })), ['count'].concat(data.intervals)],
          type: 'bar'
        },
        bar: { width: { ratio: 0.8 } },
        axis: {
          x: {
            type: 'categories',
            tick: {
              centered: true,
              outer: false,
              culling: {
                max: 15
              },
              fit: false
            }
          }
        },
        legend: {
          show: false
        },
        // zoom: {
        //   rescale: true,
        //   enabled: true
        // },
        size: { height: 250 }
      });

      this._.histograms.push(histogram);
    }
  }, {
    key: "createWeekdayHistogram",
    value: function createWeekdayHistogram(type) {
      var data = type.weekdayHistogram;

      var histogram = this.createChart('Day of week histogram - ' + type.type, {
        data: {
          x: 'x',
          columns: [['x', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ['count'].concat(data)],
          type: 'bar'
        },
        bar: { width: { ratio: 0.8 } },
        axis: {
          x: {
            type: 'categories',
            tick: {
              centered: true,
              outer: false,
              culling: {
                max: 15
              },
              fit: false
            }
          }
        },
        legend: {
          show: false
        },
        // zoom: {
        //   rescale: true,
        //   enabled: true
        // },
        size: { height: 250 }
      });

      this._.histograms.push(histogram);
    }
  }, {
    key: "createHourHistogram",
    value: function createHourHistogram(type) {
      var data = type.hourHistogram;

      var histogram = this.createChart('Hour histogram - ' + type.type, {
        data: {
          x: 'x',
          columns: [['x', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], ['count'].concat(data)],
          type: 'bar'
        },
        bar: { width: { ratio: 0.8 } },
        axis: {
          x: {
            type: 'categories',
            tick: {
              centered: true,
              outer: false,
              culling: {
                max: 15
              },
              fit: false
            }
          }
        },
        legend: {
          show: false
        },
        // zoom: {
        //   rescale: true,
        //   enabled: true
        // },
        size: { height: 250 }
      });

      this._.histograms.push(histogram);
    }
  }, {
    key: "clearAllHistograms",
    value: function clearAllHistograms() {
      this._.histograms.forEach(function (vh) {
        vh.chart.destroy();
        vh.element.parentNode.removeChild(vh.element);
      });
      this._.histograms = [];
    }
  }, {
    key: "createFieldsTable",
    value: function createFieldsTable(el) {
      var _this7 = this;

      var that = this;
      this._.elements.fields = this._.DOM.create("div", { "class": "fields" });
      this._.DOM.append(el, this._.elements.fields);

      // Table
      var fields = this._.d3.select(this._.elements.fields);
      setTimeout(function () {
        return fields.classed('show', true);
      }, 0); // fade-in

      // Title
      var title = fields.append('div').attr('class', 'title');
      title.append('div').attr('class', 'name').text('Name');
      var titleData = title.append('div').attr('class', 'data');
      titleData.append('div').attr('class', 'count').text('Occur');
      titleData.append('div').attr('class', 'percent').text('Occur %');

      // Nested field table
      function makeNestedListItems(parentLists) {
        var item = parentLists.append('li').attr('class', function (d) {
          return Object.keys(d.children).length > 0 ? 'field-li has-children closed' : 'field-li closed';
        });

        var field = item.append('div').attr('class', 'field').each(function (d) {
          var _this6 = this;

          // Default focus _id field
          if (d.fullName == "_id") {
            that.focusField(this, d);
          }

          // Focus field on tap
          that._.Hammer(this).on("tap", function () {
            that.focusField(_this6, d);
          });
        });

        field.append('div').attr('class', 'name').html(function (d) {
          return d.name == '[]' ? "<span class='array-item'>array item</span>" : d.name;
        });

        var data = field.append('div').attr('class', 'data');

        data.append('div').attr('class', 'count').text(function (d) {
          return d.count;
        });

        data.append('div').attr('class', 'percent').text(function (d) {
          return d.percent;
        });

        var children = item.append('ul').selectAll('li').data(function (d) {
          return Object.keys(d.children).map(function (key) {
            return d.children[key];
          }).sort(function (a, b) {
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase();
          });
        }).enter();
        if (!children.empty()) {
          makeNestedListItems(children);
        }
      }

      var rootList = fields.selectAll('ul').data(Object.keys(this._.tree.children).map(function (key) {
        return _this7._.tree.children[key];
      }).sort(function (a, b) {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase();
      })).enter().append('ul');
      makeNestedListItems(rootList);
    }
  }, {
    key: "focusField",
    value: function focusField(fieldEl, data) {
      var _this8 = this;

      var liEl = this._.DOM.closest(fieldEl, 'li');
      this.selectField(liEl, data);

      if (this._.DOM.hasClass(liEl, 'opened')) {
        this._.DOM.removeClass(liEl, 'opened');
        this._.DOM.addClass(liEl, 'closed');
      } else {
        this._.elements.fields.querySelectorAll('li').forEach(function (li) {
          _this8._.DOM.removeClass(li, 'opened');
          _this8._.DOM.addClass(li, 'closed');
        });

        var node = liEl;
        while (node) {
          if (!this._.DOM.hasClass(node, 'field-li')) {
            break;
          }
          this._.DOM.removeClass(node, 'closed');
          this._.DOM.addClass(node, 'opened');
          node = this._.DOM.closest(node.parentNode, 'li');
        }
      }
    }
  }, {
    key: "selectField",
    value: function selectField(li, field) {
      // Select active element
      this._.DOM.removeClass(this._.elements.fields.querySelectorAll('li.selected'), 'selected');
      this._.DOM.addClass(li, 'selected');

      // Change name
      this._.elements.fieldName.innerHTML = field.fullName;

      this.trigger('fieldSelect', { field: field });
    }
  }]);
  return Analysis;
}();

/* global _context */
/* global nprogress */
/* global d3 */
/* global c3 */
/* global Hammer */
/* global Globalize */
_context.invoke(function (Nittro) {
  // Get base path
  var basePath = document.body.getAttribute('data-basepath');

  // App configuration
  var configuration = {};

  _context.lookup('Nittro.Page.Service').defaults.autoResetForms = false;

  // Setup builder
  var builder = new Nittro.DI.ContainerBuilder({
    params: {
      configuration: configuration,
      page: {
        transitions: {
          defaultSelector: '.transition-auto'
        },
        i18n: {
          connectionError: Globalize.formatMessage('errors/ajax/connection'),
          unknownError: Globalize.formatMessage('errors/ajax/unknown')
        }
      },
      forms: {
        autoResetForms: false
      }
    },
    extensions: {
      forms: 'Nittro.Forms.Bridges.FormsDI.FormsExtension()',
      ajax: 'Nittro.Ajax.Bridges.AjaxDI.AjaxExtension()',
      page: 'Nittro.Page.Bridges.PageDI.PageExtension()',
      routing: 'Nittro.Routing.Bridges.RoutingDI.RoutingExtension()',
      flashes: 'Nittro.Flashes.Bridges.FlashesDI.FlashesExtension()',
      tweaks: 'Nittro.TweaksExtension',
      spinner: 'Nittro.AjaxProgressExtension'
    },
    services: {
      window: function (_window) {
        function window() {
          return _window.apply(this, arguments);
        }

        window.toString = function () {
          return _window.toString();
        };

        return window;
      }(function () {
        return window;
      }),
      nprogress: function (_nprogress) {
        function nprogress() {
          return _nprogress.apply(this, arguments);
        }

        nprogress.toString = function () {
          return _nprogress.toString();
        };

        return nprogress;
      }(function () {
        return nprogress;
      }),
      DOM: function DOM() {
        return _context.lookup('Utils.DOM');
      },
      EventEmitter: function EventEmitter() {
        return _context.lookup('Nittro.EventEmitter');
      },
      Event: function Event() {
        return _context.lookup('Nittro.Event');
      },
      d3: function (_d) {
        function d3() {
          return _d.apply(this, arguments);
        }

        d3.toString = function () {
          return _d.toString();
        };

        return d3;
      }(function () {
        return d3;
      }),
      c3: function (_c) {
        function c3() {
          return _c.apply(this, arguments);
        }

        c3.toString = function () {
          return _c.toString();
        };

        return c3;
      }(function () {
        return c3;
      }),
      Hammer: function (_Hammer) {
        function Hammer() {
          return _Hammer.apply(this, arguments);
        }

        Hammer.toString = function () {
          return _Hammer.toString();
        };

        return Hammer;
      }(function () {
        return Hammer;
      }),
      analysis: { factory: 'App.Analysis', run: true }
    }
  });

  _context.register(Analysis, 'App.Analysis');

  // Create container
  this.di = builder.createContainer();
  this.di.runServices();
});

//# sourceMappingURL=maps/main.js.map
