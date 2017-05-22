export default class Analysis {
  constructor(ajax, d3, c3, DOM, Hammer, EventEmitter, router) {
    // Event emitter
    Object.assign(this, EventEmitter);

    this._ = {
      ajax,
      d3,
      c3,
      DOM,
      Hammer,
      data: {},
      tree: {},
      elements: {
        fields: null,
        fieldName: null,
        charts: null,
      },
      charts: {
        types: null,
      },
      histograms: [],
      mongoDbTypes: {
        double:	  	"#8fd5d8",
        int:		    "#99c7d8",
        long:	      "#5e9ecc",
        decimal:		"#588dbf",
        minKey:		  "#526fb3",
        maxKey:		  "#aa52b3",
        timestamp:  "#b3529c",
        date:	  	  "#b35269",
        symbol:		  "#9eb352",
        string:		  "#79b350",
        regex:		  "#52b352",
        javascript:	"#52b381",
        javascriptWithScope:  "#52b392",
        objectId:	  "#999182",
        dbPointer:  "#b3946b",
        object:		  "#47aab3",
        array:		  "#47b3b3",
        binData:	  "#c2577d",
        'null':	    "#cccccc",
        undefined:  "#999999",
        bool:		    "#459599",
      },
    };

    router.getDOMRoute('#scheme-analysis')
      .on('match', evt => this.analyze(evt.data[0]));
  }

  analyze(el) {
    let url = this._.DOM.getData(el, 'url');
    this._.ajax.get(url).then((status) => this.generate(status, el))
  }

  generate(response, el) {
    // Parse response
    this.parseResponse(response);

    // Charts
    el.innerHTML = "";
    this.createCharts(el);

    // Fields table
    this.createFieldsTable(el);
  }

  parseResponse(response) {
    let payload = response.getPayload();
    this._.data = {};
    this._.tree = {
      count: payload['processedDocs'],
      children: {},
    };

    payload.fields.forEach(field => {
      this._.data[field.name] = field;

      let parent = this._.tree;
      let parts = field.name.split('.');

      // Create tree structure
      parts.forEach((name, i) => {
        let last = i == (parts.length - 1);

        if (last) {
          parent.children[name] = {
            name: name,
            fullName: field.name,
            count: field.count,
            percent: name == '[]' ? '-' : (((field.count / parent.count) * 100).toFixed(1) + '%'),
            children: {},
          };
        } else {
          parent = parent.children[name];
        }
      });
    });
  }

  createCharts(el) {
    this._.elements.charts = this._.DOM.create("div", { "class": "charts" });
    setTimeout(() => this._.DOM.addClass( this._.elements.charts, 'show')); // fade-in
    this._.DOM.append(el, this._.elements.charts);

    // Field name
    this._.elements.fieldName = this._.DOM.create("div", { "class": "field-name" });
    this._.DOM.append(this._.elements.charts, this._.elements.fieldName);

    // Types pie chart
    this._.charts.types = this.createChart("Types", {
      data: {
        columns: [],
        colors: this._.mongoDbTypes,
        type : 'pie',
      },
      legend: { position: 'right' },
      tooltip: { format: { value: (value, ratio, id, index) => { return value + ' = ' + this._.d3.format(".1%")(ratio); } } },
      pie: { label: { format: (value, ratio, id, index) => { return this._.d3.format(".1%")(ratio); } } },
      size: { height: 200 },
    });

    this.on('fieldSelect', function(evt) {
      let field = evt.data.field;
      let types = this._.data[field.fullName].types;

      this._.charts.types.chart.load({
        columns: types.map(t => [t.type, t.count]),
        unload: true,
      });

      this._.charts.types.chart.resize();
    });

    // Clear old histograms
    this.on('fieldSelect', () => this.clearAllHistograms());

    // Value histograms
    this.on('fieldSelect', function(evt) {
      let field = evt.data.field;
      let types = this._.data[field.fullName].types;

      types.forEach(t => {
        if (t.weekdayHistogram) {
          this.createWeekdayHistogram(t);
        }

        if (t.hourHistogram) {
          this.createHourHistogram(t);
        }

        if (t.valueHistogram) {
          this.createValueHistogram(t);
        }

        if (t.lengthHistogram) {
          this.createLengthHistogram(t);
        }
      })
    });

    // Resize charts
    requestAnimationFrame(() => {
      Object.keys(this._.charts).forEach((key) => this._.charts[key].chart.resize());
    });
  }

  createChart(name, config) {
    let containerEl = this._.DOM.create("div", { "class": "chart" });
    let titleEl = this._.DOM.create("div", { "class": "chart-title" });
    let chartEl = this._.DOM.create("div", { "class": "chart-c3" });

    titleEl.innerHTML = name;

    this._.DOM.append(containerEl, titleEl);
    this._.DOM.append(containerEl, chartEl);
    this._.DOM.append(this._.elements.charts, containerEl);

    config['bindto'] = chartEl;
    return {
      chart: this._.c3.generate(config),
      element: containerEl,
    };
  }

  createValueHistogram(type) {
    let data = type.valueHistogram;

    let histogram = this.createChart('Value histogram - ' + type.type, {
      data: {
        x: 'x',
        columns: [
          ['x'].concat(data.intervals.map(function(v, i) { return (i*data.step) + data.start; })),
          ['count'].concat(data.intervals),
        ],
        type: 'bar',
      },
      bar: { width: { ratio: 0.8 } },
      axis: {
        x: {
          type: 'categories',
          tick: {
            centered: true,
            outer: false,
            culling: {
              max: 15,
            },
            fit: false,
          },
        },
      },
      legend: {
        show: false,
      },
      // zoom: {
      //   rescale: true,
      //   enabled: true
      // },
      size: { height: 250 },
    });

    this._.histograms.push(histogram);
  }

  createLengthHistogram(type) {
    let data = type.lengthHistogram;

    let histogram = this.createChart('Length histogram - ' + type.type, {
      data: {
        x: 'x',
        columns: [
          ['x'].concat(data.intervals.map(function(v, i) { return (i*data.step) + data.start; })),
          ['count'].concat(data.intervals),
        ],
        type: 'bar',
      },
      bar: { width: { ratio: 0.8 } },
      axis: {
        x: {
          type: 'categories',
          tick: {
            centered: true,
            outer: false,
            culling: {
              max: 15,
            },
            fit: false,
          },
        },
      },
      legend: {
        show: false,
      },
      // zoom: {
      //   rescale: true,
      //   enabled: true
      // },
      size: { height: 250 },
    });

    this._.histograms.push(histogram);
  }

  createWeekdayHistogram(type) {
    let data = type.weekdayHistogram;

    let histogram = this.createChart('Day of week histogram - ' + type.type, {
      data: {
        x: 'x',
        columns: [
          ['x', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          ['count'].concat(data),
        ],
        type: 'bar',
      },
      bar: { width: { ratio: 0.8 } },
      axis: {
        x: {
          type: 'categories',
          tick: {
            centered: true,
            outer: false,
            culling: {
              max: 15,
            },
            fit: false,
          },
        },
      },
      legend: {
        show: false,
      },
      // zoom: {
      //   rescale: true,
      //   enabled: true
      // },
      size: { height: 250 },
    });

    this._.histograms.push(histogram);
  }

  createHourHistogram(type) {
    let data = type.hourHistogram;

    let histogram = this.createChart('Hour histogram - ' + type.type, {
      data: {
        x: 'x',
        columns: [
          ['x', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
          ['count'].concat(data),
        ],
        type: 'bar',
      },
      bar: { width: { ratio: 0.8 } },
      axis: {
        x: {
          type: 'categories',
          tick: {
            centered: true,
            outer: false,
            culling: {
              max: 15,
            },
            fit: false,
          },
        },
      },
      legend: {
        show: false,
      },
      // zoom: {
      //   rescale: true,
      //   enabled: true
      // },
      size: { height: 250 },
    });

    this._.histograms.push(histogram);
  }

  clearAllHistograms() {
    this._.histograms.forEach((vh) => {
      vh.chart.destroy();
      vh.element.parentNode.removeChild(vh.element);
    });
    this._.histograms = [];
  }

  createFieldsTable(el) {
    let that = this;
    this._.elements.fields = this._.DOM.create("div", { "class": "fields" });
    this._.DOM.append(el, this._.elements.fields);

    // Table
    let fields = this._.d3.select(this._.elements.fields);
    setTimeout(() => fields.classed('show', true), 0); // fade-in

    // Title
    let title = fields.append('div').attr('class', 'title');
    title.append('div').attr('class', 'name').text('Name');
    let titleData = title.append('div').attr('class', 'data');
    titleData.append('div').attr('class', 'count').text('Occur');
    titleData.append('div').attr('class', 'percent').text('Occur %');

    // Nested field table
    function makeNestedListItems (parentLists) {
      let item = parentLists
        .append('li')
        .attr('class', d => Object.keys(d.children).length > 0 ? 'field-li has-children closed' : 'field-li closed' );

      let field = item.append('div')
        .attr('class', 'field')
        .each(function(d) {
          // Default focus _id field
          if (d.fullName == "_id") {
            that.focusField(this, d);
          }

          // Focus field on tap
          that._.Hammer(this).on("tap", () => {
            that.focusField(this, d);
          });
        });

      field.append('div')
        .attr('class', 'name')
        .html(function (d) { return d.name == '[]' ? "<span class='array-item'>array item</span>" : d.name; });

      let data = field.append('div')
        .attr('class', 'data');

      data.append('div')
        .attr('class', 'count')
        .text(function (d) { return d.count; });

      data.append('div')
        .attr('class', 'percent')
        .text(function (d) { return d.percent; });

      let children = item.append('ul').selectAll('li')
        .data(d =>
          Object.keys(d.children)
            .map( key => d.children[key])
            .sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase()))
        .enter();
      if (!children.empty()) {
        makeNestedListItems(children);
      }
    }

    let rootList = fields
      .selectAll('ul')
      .data(
        Object.keys(this._.tree.children)
          .map(key => this._.tree.children[key])
          .sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase()))
      .enter()
      .append('ul');
    makeNestedListItems(rootList);
  }

  focusField(fieldEl, data) {
    let liEl = this._.DOM.closest(fieldEl, 'li');
    this.selectField(liEl, data);

    if (this._.DOM.hasClass(liEl, 'opened')) {
      this._.DOM.removeClass(liEl, 'opened');
      this._.DOM.addClass(liEl, 'closed');
    }
    else {
      this._.elements.fields.querySelectorAll('li').forEach(li => {
        this._.DOM.removeClass(li, 'opened');
        this._.DOM.addClass(li, 'closed');
      });

      let node = liEl;
      while(node) {
        if (!this._.DOM.hasClass(node, 'field-li')) {
          break;
        }
        this._.DOM.removeClass(node, 'closed');
        this._.DOM.addClass(node, 'opened');
        node = this._.DOM.closest(node.parentNode, 'li');
      }
    }
  }

  selectField(li, field) {
    // Select active element
    this._.DOM.removeClass(this._.elements.fields.querySelectorAll('li.selected'), 'selected');
    this._.DOM.addClass(li, 'selected');

    // Change name
    this._.elements.fieldName.innerHTML = field.fullName;

    this.trigger('fieldSelect', { field })
  }
}

