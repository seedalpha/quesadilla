# quesadilla [![Build Status](https://travis-ci.org/seedalpha/quesadilla.svg)](https://travis-ci.org/seedalpha/quesadilla)

Automatically build, watch and serve your sass files. Highly inspired by [enchilada](https://github.com/defunctzombie/node-enchilada).

## with express/connect

```javascript
var app = express();

// serves up all your sass files
app.use(quesadilla(__dirname + '/public'));

// fallback for other static resources
app.use(express.static(__dirname + '/public'));
```

Now just visit any ```.css``` url which maps to a path under /public and the compiled file will be served.

## options

```javascript
app.use(quesadilla({
  src: __dirname + '/public', // location of your scss files
}));
```

## examples

See the [examples](examples) directory for working code you can copy and paste.

## install

Install with [npm](https://npmjs.org)

```shell
npm install quesadilla
```

## License

MIT
