/* global c3 */

c3.generate({
  bindto: '#scheme',
  data: {
    columns: [
      ['data1', 30, 200, 100, 400, 150, 250],
      ['data2', 50, 20, 10, 40, 15, 25]
    ]
  }
});

let histogram = {
  "start": 0,
  "end": 45250,
  "range": 45250,
  "step": 50,
  "numOfSteps": 905,
  "intervals": [
    42,
    37,
    38,
    25,
    26,
    30,
    27,
    36,
    29,
    19,
    22,
    29,
    21,
    14,
    24,
    20,
    32,
    30,
    22,
    28,
    25,
    29,
    30,
    24,
    21,
    24,
    21,
    17,
    23,
    32,
    23,
    26,
    41,
    14,
    37,
    23,
    41,
    18,
    10,
    32,
    24,
    13,
    20,
    9,
    9,
    13,
    12,
    22,
    21,
    18,
    24,
    15,
    19,
    11,
    14,
    8,
    10,
    9,
    3,
    5,
    13,
    15,
    17,
    7,
    10,
    11,
    9,
    6,
    6,
    12,
    10,
    14,
    6,
    14,
    6,
    9,
    17,
    8,
    7,
    8,
    14,
    14,
    8,
    4,
    5,
    8,
    15,
    11,
    13,
    10,
    7,
    5,
    14,
    9,
    2,
    9,
    19,
    15,
    18,
    20,
    10,
    10,
    9,
    11,
    17,
    9,
    11,
    8,
    8,
    9,
    5,
    3,
    10,
    6,
    12,
    12,
    3,
    11,
    21,
    12,
    23,
    11,
    25,
    14,
    28,
    9,
    18,
    15,
    17,
    8,
    8,
    14,
    7,
    9,
    11,
    13,
    13,
    8,
    14,
    4,
    17,
    26,
    22,
    15,
    6,
    7,
    18,
    15,
    18,
    6,
    8,
    20,
    18,
    11,
    15,
    13,
    15,
    5,
    6,
    10,
    21,
    16,
    9,
    3,
    9,
    9,
    20,
    6,
    28,
    13,
    10,
    18,
    7,
    12,
    16,
    11,
    14,
    14,
    8,
    5,
    11,
    10,
    12,
    11,
    10,
    11,
    4,
    9,
    12,
    10,
    10,
    13,
    10,
    6,
    10,
    10,
    14,
    15,
    13,
    25,
    15,
    13,
    15,
    12,
    9,
    21,
    4,
    34,
    14,
    12,
    12,
    13,
    13,
    9,
    9,
    5,
    5,
    5,
    11,
    4,
    6,
    10,
    13,
    11,
    10,
    10,
    16,
    2,
    8,
    15,
    10,
    9,
    15,
    8,
    10,
    5,
    14,
    9,
    10,
    5,
    10,
    15,
    18,
    9,
    16,
    19,
    15,
    9,
    15,
    16,
    7,
    8,
    8,
    13,
    9,
    3,
    5,
    6,
    9,
    10,
    3,
    7,
    11,
    16,
    8,
    7,
    12,
    5,
    4,
    9,
    3,
    14,
    5,
    2,
    7,
    13,
    3,
    6,
    6,
    11,
    8,
    16,
    6,
    7,
    6,
    5,
    7,
    9,
    13,
    17,
    6,
    7,
    7,
    6,
    13,
    14,
    5,
    13,
    5,
    10,
    9,
    14,
    1,
    6,
    17,
    7,
    12,
    6,
    20,
    1,
    2,
    5,
    8,
    7,
    3,
    10,
    4,
    3,
    8,
    15,
    13,
    7,
    7,
    9,
    7,
    1,
    5,
    7,
    7,
    12,
    16,
    4,
    10,
    6,
    3,
    17,
    7,
    2,
    14,
    2,
    14,
    9,
    4,
    4,
    6,
    8,
    3,
    10,
    4,
    10,
    9,
    6,
    2,
    3,
    1,
    6,
    6,
    4,
    6,
    1,
    8,
    12,
    4,
    5,
    2,
    2,
    6,
    9,
    5,
    7,
    6,
    17,
    4,
    6,
    1,
    9,
    4,
    2,
    4,
    5,
    5,
    5,
    3,
    4,
    3,
    8,
    1,
    12,
    12,
    3,
    2,
    6,
    3,
    5,
    8,
    11,
    8,
    5,
    5,
    8,
    3,
    2,
    5,
    9,
    1,
    6,
    1,
    7,
    16,
    15,
    6,
    3,
    3,
    1,
    5,
    10,
    2,
    8,
    8,
    4,
    2,
    9,
    3,
    5,
    11,
    17,
    5,
    8,
    6,
    6,
    9,
    6,
    6,
    3,
    5,
    5,
    3,
    3,
    4,
    1,
    4,
    3,
    6,
    4,
    4,
    5,
    9,
    6,
    6,
    1,
    6,
    12,
    7,
    2,
    3,
    3,
    3,
    1,
    4,
    4,
    1,
    7,
    10,
    4,
    4,
    3,
    2,
    6,
    2,
    8,
    7,
    3,
    7,
    3,
    6,
    3,
    7,
    17,
    5,
    2,
    3,
    3,
    2,
    3,
    2,
    4,
    2,
    3,
    1,
    6,
    3,
    16,
    4,
    7,
    11,
    1,
    3,
    4,
    10,
    1,
    3,
    7,
    1,
    2,
    1,
    11,
    13,
    3,
    2,
    2,
    5,
    4,
    1,
    6,
    1,
    2,
    1,
    1,
    3,
    7,
    4,
    1,
    10,
    2,
    3,
    2,
    7,
    9,
    3,
    7,
    1,
    5,
    4,
    8,
    1,
    4,
    1,
    8,
    5,
    6,
    10,
    2,
    9,
    1,
    1,
    2,
    1,
    8,
    2,
    1,
    10,
    1,
    8,
    2,
    1,
    2,
    3,
    3,
    2,
    2,
    10,
    1,
    1,
    6,
    2,
    5,
    6,
    2,
    3,
    6,
    2,
    1,
    5,
    3,
    5,
    1,
    4,
    3,
    10,
    7,
    13,
    4,
    1,
    2,
    4,
    3,
    4,
    5,
    7,
    3,
    7,
    9,
    4,
    2,
    1,
    3,
    1,
    2,
    3,
    2,
    8,
    5,
    3,
    1,
    1,
    5,
    3,
    11,
    1,
    35,
    2,
    8,
    8,
    1,
    4,
    1,
    1,
    1,
    9,
    2,
    7,
    1,
    3,
    1,
    1,
    3,
    3,
    2,
    1,
    4,
    11,
    5,
    4,
    4,
    3,
    2,
    2,
    1,
    1,
    13,
    3,
    2,
    3,
    2,
    3,
    3,
    13,
    5,
    2,
    8,
    13,
    4,
    2,
    7,
    3,
    2,
    2,
    1,
    2,
    2,
    2,
    18,
    2,
    4,
    5,
    1,
    5,
    7,
    10,
    2,
    7,
    1,
    5,
    1,
    7,
    5,
    3,
    5,
    13,
    4,
    10,
    3,
    3,
    6,
    6,
    1,
    6,
    10,
    12,
    1,
    1,
    4,
    2,
    2,
    1,
    1,
    2,
    3,
    1,
    2,
    1,
    2,
    12,
    3,
    8,
    5,
    2,
    1,
    1,
    6,
    3,
    5,
    2,
    13,
    3,
    6,
    10,
    17,
    5,
    2,
    3,
    1,
    5,
    3,
    8,
    11,
    1,
    6,
    5,
    6,
    10,
    1,
    3,
    3,
    10,
    2,
    2,
    1,
    6,
    3,
    4,
    2,
    7,
    5,
    9,
    1,
    2,
    6,
    1,
    2,
    1,
    1,
    2,
    5,
    5,
    11,
    7,
    10,
    1,
    3,
    2,
    3,
    5,
    2,
    5,
    3,
    3,
    1,
    2,
    2,
    2,
    1,
    1,
    1,
    1,
    8,
    1,
    3,
    1,
    5,
    1,
    1,
    1,
    1,
    16,
    1,
    2,
    2,
    3,
    4,
    2,
    5,
    4,
    2,
    3,
    2,
    1,
    8,
    3,
    3,
    4,
    13,
    6,
    14,
    1,
    1,
    2,
    4,
    6,
    1,
    2,
    5,
    3,
    2,
    2,
    2,
    8,
    7,
    3,
    5,
    4,
    6,
    7,
    4,
    2,
    3,
    14,
    2,
    5,
    3,
    8,
    6,
    13,
    6,
    9,
    14,
    5,
    1,
    5,
    1,
    4,
    4,
    1,
    4,
    1
  ]
};

c3.generate({
  bindto: '#histogram',
  data: {
    x: 'x',
    columns: [
      ['x'].concat(histogram.intervals.map(function(v, i) { return (i*histogram.step) + histogram.start; })),
      ['count'].concat(histogram.intervals),
    ],
    type: 'bar',
  },
  bar: {
    width: {
      ratio: 0.9 // this makes bar width 50% of length between ticks
    }
  },
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
  zoom: {
    rescale: true,
    enabled: true
  },
});