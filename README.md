<a href="https://raw.githubusercontent.com/mongoeye/mongoeye/master/_misc/logo_name_small.png?v1" title="logo"><img src="https://raw.githubusercontent.com/mongoeye/mongoeye/master/_misc/logo_name_small.png?v1" width="300"/></a>


Console exploration tool for MongoDB written in [Go](https://golang.org).

[![GoDoc](https://godoc.org/github.com/golang/gddo?status.svg)](http://godoc.org/github.com/mongoeye/mongoeye)
[![Coverage Status](https://coveralls.io/repos/github/mongoeye/mongoeye/badge.svg?branch=master)](https://coveralls.io/github/mongoeye/mongoeye?branch=master)
[![Build Status](https://travis-ci.org/mongoeye/mongoeye.svg?branch=master)](https://travis-ci.org/mongoeye/mongoeye)
[![Go Report Card](https://goreportcard.com/badge/github.com/mongoeye/mongoeye)](https://goreportcard.com/report/github.com/mongoeye/mongoeye)

<a href="https://asciinema.org/a/1k8ohbpubzj2scogu6dmp9tvy?autoplay=1" target="_blank" title="Open in asciinema.org"><img src="https://github.com/mongoeye/mongoeye/blob/master/_misc/console.gif?raw=true" width="700"/></a>

## Overview

This tool helps you get an overview of the data stored in the MongoDB database. Allows quick schema analysis and some other calculations. The analysis can run locally or in a database using the aggregation framework (require MongoDB 3.5.6+).

### Key features

* *Fast:*&nbsp; the fastest tool for analyzing the MongoDB scheme
* *Single binary:*&nbsp; pre-built [binaries](https://github.com/mongoeye/mongoeye/releases) for Windows, Linux, and MacOS (Darwin)
* *Local analysis:*&nbsp; quick local analysis using a parallel algorithm (MongoDB 2.0+)
* *Analysis in db:*&nbsp; using the aggregation framework (MongoDB 3.5.6+)
* *Rich features:*&nbsp; histograms (value, length, weekday, hour), most frequent values, ... 
* *Various outputs:*&nbsp; table, JSON and YAML output

## Installing

Mongoeye is one executable binary file. 

Download the archive from [GitHub releases page](https://github.com/mongoeye/mongoeye/releases) and extract the binary file for your platform.

Or you can compile binary file from sources:
```
$ go get github.com/mongoeye/mongoeye
$ cd $GOPATH/src/github.com/mongoeye/mongoeye
$ make
```

## Usage

The command **`mongoeye --help`** lists all available options.

```
MongoEYE v0.0.1 - MongoDB exploration tool

Usage:
  mongoeye [host] database collection [flags]

Flags:
  connection options:
        --host                mongodb host (default "localhost:27017")
        --connection-mode     connection mode (default "SecondaryPreferred")
        --connection-timeout  connection timeout (default 5)
        --socket-timeout      socket timeout (default 300)
        --sync-timeout        sync timeout (default 300)

  authentication:
    -u, --user                username for authentication (default "admin")
    -p, --password            password for authentication
        --auth-db             auth database (default "admin")
        --auth-mech           auth mechanism

  input options:
        --db                  database for analysis
        --col                 collection for analysis
    -q, --query               documents query (json)
    -s, --scope               all, first:N, last:N, random:N (default "random:1000")
    -d, --depth               max depth in nested documents (default 2)

  output options:
        --full                all available analyzes
    -v, --value               get min, max, avg value
    -l, --length              get min, max, avg length
    -V, --value-hist          get value histogram
        --value-hist-steps    max steps of value histogram >=3 (default 100)
    -L, --length-hist         get length histogram
        --length-hist-steps   max steps of length histogram >=3 (default 100)
    -W, --weekday-hist        get weekday histogram for dates
    -H, --hour-hist           get hour histogram for dates
        --count-unique        get count of unique values
        --most-freq           get the N most frequent values
        --least-freq          get the N least frequent values
    -f, --format              output format: table, json, yaml (default "table")
    -F, --file                path to the output file

  other options:
    -t, --timezone            timezone, eg. UTC, Europe/Berlin (default "local")
        --use-aggregation     analyze with aggregation framework (mongodb 3.5.6+)
        --string-max-length   max string length (default 100)
        --array-max-length    analyze only first N array elements (default 20)
        --concurrency         number of local processes (default 0 = auto)
        --buffer              size of the buffer between local stages (default 5000)
        --batch               size of batch from database (default 500)
        --no-color            disable color output
        --version             show version
    -h, --help                show this help

Note: You can also use environment variables, eg. 'export MONGOEYE_COUNT-UNIQUE=true'
```

### Table output

Default output format is table that shows documents schema as clear table. 

It does not show histogram and other analysis. Example table output:
```
            KEY           │ COUNT  │   %    
────────────────────────────────────────────
  all documents           │ 2548   │        
  analyzed documents      │ 1000   │  39.2  
                          │        │        
  _id ➜ objectId          │ 1000   │ 100.0  
  address                 │ 1000   │ 100.0  
  │ ➜ int                 │    1   │   0.1  
  └╴➜ string              │  999   │  99.9  
  address line 2 ➜ string │ 1000   │ 100.0  
  name ➜ string           │ 1000   │ 100.0  
  outcode ➜ string        │ 1000   │ 100.0  
  postcode ➜ string       │ 1000   │ 100.0  
  rating                  │ 1000   │ 100.0  
  │ ➜ int                 │  523   │  52.3  
  │ ➜ double              │  451   │  45.1  
  └╴➜ string              │   26   │   2.6  
  type_of_food ➜ string   │ 1000   │ 100.0  
  URL ➜ string            │ 1000   │ 100.0  

OK  0.190s (local analysis)
    1000/2548 docs (39.2%)
    9 fields, depth 2
```

### JSON and YAML output

Outputs in JSON and YAML format return the results of all analyzes.

Use `--format json` or `--format yaml` flags to set these formats.

For output to a file, use the option `-F /path/to/file`.

## License

Mongoeye is under the GPL-3.0 license. See the [LICENSE](LICENSE.md) file for details.



