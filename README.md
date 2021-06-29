# @api-client/graph

A set of libraries helping working with graphs.

[![Published on NPM](https://img.shields.io/npm/v/@api-client/graph.svg)](https://www.npmjs.com/package/@api-client/graph)

[![Tests and publishing](https://github.com/api-client/graph/actions/workflows/deployment.yml/badge.svg)](https://github.com/api-client/graph/actions/workflows/deployment.yml)

## Acknowledgment

This library is based on the [dagrejs/graphlib](https://github.com/dagrejs/graphlib) library.

## Usage

### Installation

```sh
npm install --save @api-client/graph
```

### Creating a graph

```javascript
import { Graph } from '@api-client/graph';

const g = new Graph();
g.setGraph("graph label");
g.setNode("a", 123);
g.setPath(["a", "b", "c"]);
g.setEdge("a", "c", 456);
```

## Development

```sh
git clone https://github.com/@api-client/graph
cd graph
npm install
```

### Running the tests

```sh
npm test
```

## License

<!-- API Components © 2021 by Pawel Psztyc is licensed under CC BY 4.0. -->

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><span property="dct:title">API Components</span> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://github.com/jarrodek">Pawel Psztyc</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY 4.0<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"></a></p>
