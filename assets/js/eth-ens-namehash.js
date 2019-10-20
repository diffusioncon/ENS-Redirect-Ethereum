// a custom browserified version of eth-ens-namehash 2.0.8 which is compatible with amd, commonjs etc
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ethEnsNamehash = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)

},{"base64-js":1,"buffer":4,"ieee754":8}],5:[function(require,module,exports){
(function (Buffer){
var sha3 = require('js-sha3').keccak_256
var uts46 = require('idna-uts46-hx')

function namehash (inputName) {
  // Reject empty names:
  var node = ''
  for (var i = 0; i < 32; i++) {
    node += '00'
  }

  name = normalize(inputName)

  if (name) {
    var labels = name.split('.')

    for(var i = labels.length - 1; i >= 0; i--) {
      var labelSha = sha3(labels[i])
      node = sha3(new Buffer(node + labelSha, 'hex'))
    }
  }

  return '0x' + node
}

function normalize(name) {
  return name ? uts46.toUnicode(name, {useStd3ASCII: true, transitional: false}) : name
}

exports.hash = namehash
exports.normalize = normalize

}).call(this,require("buffer").Buffer)

},{"buffer":4,"idna-uts46-hx":7,"js-sha3":9}],6:[function(require,module,exports){
/* This file is generated from the Unicode IDNA table, using
   the build-unicode-tables.py script. Please edit that
   script instead of this file. */

/* istanbul ignore next */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function () { return factory(); });
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.uts46_map = factory();
  }
}(this, function () {
var blocks = [
  new Uint32Array([2157250,2157314,2157378,2157442,2157506,2157570,2157634,0,2157698,2157762,2157826,2157890,2157954,0,2158018,0]),
  new Uint32Array([2179041,6291456,2179073,6291456,2179105,6291456,2179137,6291456,2179169,6291456,2179201,6291456,2179233,6291456,2179265,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,14680064,14680064,14680064,14680064,14680064]),
  new Uint32Array([0,2113729,2197345,2197377,2113825,2197409,2197441,2113921,2197473,2114017,2197505,2197537,2197569,2197601,2197633,2197665]),
  new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672,23068672,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,23068672,23068672,23068672,0,0,0,0,23068672]),
  new Uint32Array([14680064,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,14680064,14680064]),
  new Uint32Array([2196001,2196033,2196065,2196097,2196129,2196161,2196193,2196225,2196257,2196289,2196321,2196353,2196385,2196417,2196449,2196481]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,6291456,0,0,0,0,0]),
  new Uint32Array([2097281,2105921,2097729,2106081,0,2097601,2162337,2106017,2133281,2097505,2105889,2097185,2097697,2135777,2097633,2097441]),
  new Uint32Array([2177025,6291456,2177057,6291456,2177089,6291456,2177121,6291456,2177153,6291456,2177185,6291456,2177217,6291456,2177249,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,0,6291456,6291456,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456]),
  new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456]),
  new Uint32Array([2134435,2134531,2134627,2134723,2134723,2134819,2134819,2134915,2134915,2135011,2105987,2135107,2135203,2135299,2131587,2135395]),
  new Uint32Array([0,0,0,0,0,0,0,6291456,2168673,2169249,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2147906,2147970,2148034,2148098,2148162,2148226,2148290,2148354,2147906,2147970,2148034,2148098,2148162,2148226,2148290,2148354]),
  new Uint32Array([2125219,2125315,2152834,2152898,2125411,2152962,2153026,2125506,2125507,2125603,2153090,2153154,2153218,2153282,2153346,2105348]),
  new Uint32Array([2203393,6291456,2203425,6291456,2203457,6291456,2203489,6291456,6291456,6291456,6291456,2203521,6291456,2181281,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,23068672,6291456,2145538,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,6291456]),
  new Uint32Array([2139426,2160834,2160898,2160962,2134242,2161026,2161090,2161154,2161218,2161282,2161346,2161410,2138658,2161474,2161538,2134722]),
  new Uint32Array([2119939,2124930,2125026,2106658,2125218,2128962,2129058,2129154,2129250,2129346,2129442,2108866,2108770,2150466,2150530,2150594]),
  new Uint32Array([2201601,6291456,2201633,6291456,2201665,6291456,2201697,6291456,2201729,6291456,2201761,6291456,2201793,6291456,2201825,6291456]),
  new Uint32Array([2193537,2193569,2193601,2193633,2193665,2193697,2193729,2193761,2193793,2193825,2193857,2193889,2193921,2193953,2193985,2194017]),
  new Uint32Array([6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2190561,6291456,2190593,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2190625,6291456,2190657,6291456,23068672]),
  new Uint32Array([2215905,2215937,2215969,2216001,2216033,2216065,2216097,2216129,2216161,2216193,2216225,2216257,2105441,2216289,2216321,2216353]),
  new Uint32Array([23068672,18884130,23068672,23068672,23068672,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672]),
  new Uint32Array([23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2191233,2191265,2191297,2191329,2191361,2191393,2191425,2117377,2191457,2191489,2191521,2191553,2191585,2191617,2191649,2117953]),
  new Uint32Array([2132227,2132323,2132419,2132419,2132515,2132515,2132611,2132707,2132707,2132803,2132899,2132899,2132995,2132995,2133091,2133187]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,6291456,0,0]),
  new Uint32Array([2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,10609889,10610785,10609921,10610817,2222241]),
  new Uint32Array([6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0]),
  new Uint32Array([2219969,2157121,2157441,2157505,2157889,2157953,2220001,2158465,2158529,10575617,2156994,2157058,2129923,2130019,2157122,2157186]),
  new Uint32Array([6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),
  new Uint32Array([2185249,6291456,2185281,6291456,2185313,6291456,2185345,6291456,2185377,6291456,2185409,6291456,2185441,6291456,2185473,6291456]),
  new Uint32Array([0,0,0,0,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,0,0,23068672,23068672,23068672,6291456,0]),
  new Uint32Array([2183361,6291456,2183393,6291456,2183425,6291456,2183457,6291456,2183489,6291456,2183521,6291456,2183553,6291456,2183585,6291456]),
  new Uint32Array([2192161,2192193,2192225,2192257,2192289,2192321,2192353,2192385,2192417,2192449,2192481,2192513,2192545,2192577,2192609,2192641]),
  new Uint32Array([2212001,2212033,2212065,2212097,2212129,2212161,2212193,2212225,2212257,2212289,2212321,2212353,2212385,2212417,2212449,2207265]),
  new Uint32Array([2249825,2249857,2249889,2249921,2249954,2250018,2250082,2250145,2250177,2250209,2250241,2250274,2250337,2250370,2250433,2250465]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2147905,2147969,2148033,2148097,2148161,2148225,2148289,2148353]),
  new Uint32Array([10485857,6291456,2197217,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,23068672,23068672]),
  new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),
  new Uint32Array([2180353,2180385,2144033,2180417,2180449,2180481,2180513,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,10610209,10610465,10610241,10610753,10609857]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0,0]),
  new Uint32Array([2223842,2223906,2223970,2224034,2224098,2224162,2224226,2224290,2224354,2224418,2224482,2224546,2224610,2224674,2224738,2224802]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456]),
  new Uint32Array([23068672,23068672,23068672,18923650,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,18923714,23068672,23068672]),
  new Uint32Array([2126179,2125538,2126275,2126371,2126467,2125634,2126563,2105603,2105604,2125346,2126659,2126755,2126851,2098179,2098181,2098182]),
  new Uint32Array([2227426,2227490,2227554,2227618,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2192353,2240642,2240642,2240705,2240737,2240737,2240769,2240802,2240866,2240929,2240961,2240993,2241025,2241057,2241089,2241121]),
  new Uint32Array([6291456,2170881,2170913,2170945,6291456,2170977,6291456,2171009,2171041,6291456,6291456,6291456,2171073,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2132226,2132514,2163586,2132610,2160386,2133090,2133186,2160450,2160514,2160578,2133570,2106178,2160642,2133858,2160706,2160770]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,10532162,10532226,10532290,10532354,10532418,10532482,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672]),
  new Uint32Array([2098209,2108353,2108193,2108481,2170241,2111713,2105473,2105569,2105601,2112289,2112481,2098305,2108321,0,0,0]),
  new Uint32Array([2209121,2209153,2209185,2209217,2209249,2209281,2209313,2209345,2209377,2209409,2209441,2209473,2207265,2209505,2209537,2209569]),
  new Uint32Array([2189025,6291456,2189057,6291456,2189089,6291456,2189121,6291456,2189153,6291456,2189185,6291456,2189217,6291456,2189249,6291456]),
  new Uint32Array([2173825,2153473,2173857,2173889,2173921,2173953,2173985,2173761,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2233057]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2165764,2140004]),
  new Uint32Array([2215105,6291456,2215137,6291456,6291456,2215169,2215201,6291456,6291456,6291456,2215233,2215265,2215297,2215329,2215361,2215393]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,6291456,6291456,6291456,23068672,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([10505091,10505187,10505283,10505379,10505475,10505571,10505667,10505763,10505859,10505955,10506051,10506147,10506243,10506339,10506435,10506531]),
  new Uint32Array([2229730,2229794,2229858,2229922,2229986,2230050,2230114,2230178,2230242,2230306,2230370,2230434,2230498,2230562,2230626,2230690]),
  new Uint32Array([2105505,2098241,2108353,2108417,2105825,0,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177]),
  new Uint32Array([6291456,6291456,6291456,6291456,10502115,10502178,10502211,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456]),
  new Uint32Array([2190305,6291456,2190337,6291456,2190369,6291456,2190401,6291456,2190433,6291456,2190465,6291456,2190497,6291456,2190529,6291456]),
  new Uint32Array([2173793,2173985,2174017,6291456,2173761,2173697,6291456,2174689,6291456,2174017,2174721,6291456,6291456,2174753,2174785,2174817]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2099521,2099105,2120705,2098369,2120801,2103361,2097985,2098433,2121377,2121473,2099169,2099873,2098401,2099393,2152609,2100033]),
  new Uint32Array([2132898,2163842,2163906,2133282,2132034,2131938,2137410,2132802,2132706,2164866,2133282,2160578,2165186,2165186,6291456,6291456]),
  new Uint32Array([10500003,10500099,10500195,10500291,10500387,10500483,10500579,10500675,10500771,10500867,10500963,10501059,10501155,10501251,10501347,10501443]),
  new Uint32Array([2163458,2130978,2131074,2131266,2131362,2163522,2160130,2132066,2131010,2131106,2106018,2131618,2131298,2132034,2131938,2137410]),
  new Uint32Array([2212961,2116993,2212993,2213025,2213057,2213089,2213121,2213153,2213185,2213217,2213249,2209633,2213281,2213313,2213345,2213377]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),
  new Uint32Array([2113729,2113825,2113921,2114017,2114113,2114209,2114305,2114401,2114497,2114593,2114689,2114785,2114881,2114977,2115073,2115169]),
  new Uint32Array([2238177,2238209,2238241,2238273,2238305,2238337,2238337,2217537,2238369,2238401,2238433,2238465,2215649,2238497,2238529,2238561]),
  new Uint32Array([2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905]),
  new Uint32Array([6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,0]),
  new Uint32Array([6291456,0,6291456,2145026,0,6291456,2145090,0,6291456,6291456,0,0,23068672,0,23068672,23068672]),
  new Uint32Array([2099233,2122017,2200673,2098113,2121537,2103201,2200705,2104033,2121857,2121953,2122401,2099649,2099969,2123009,2100129,2100289]),
  new Uint32Array([6291456,23068672,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0]),
  new Uint32Array([2187681,2187713,2187745,2187777,2187809,2187841,2187873,2187905,2187937,2187969,2188001,2188033,2188065,2188097,2188129,2188161]),
  new Uint32Array([0,10554498,10554562,10554626,10554690,10554754,10554818,10554882,10554946,10555010,10555074,6291456,6291456,0,0,0]),
  new Uint32Array([2235170,2235234,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0]),
  new Uint32Array([2181153,6291456,2188897,6291456,6291456,2188929,6291456,6291456,6291456,6291456,6291456,6291456,2111905,2100865,2188961,2188993]),
  new Uint32Array([2100833,2100897,0,0,2101569,2101697,2101825,2101953,2102081,2102209,10575617,2187041,10502177,10489601,10489697,2112289]),
  new Uint32Array([6291456,2172833,6291456,2172865,2172897,2172929,2172961,6291456,2172993,6291456,2173025,6291456,2173057,6291456,2173089,6291456]),
  new Uint32Array([6291456,0,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,0,0,23068672,6291456,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,2190721]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,23068672,6291456,6291456]),
  new Uint32Array([2184993,6291456,2185025,6291456,2185057,6291456,2185089,6291456,2185121,6291456,2185153,6291456,2185185,6291456,2185217,6291456]),
  new Uint32Array([2115265,2115361,2115457,2115553,2115649,2115745,2115841,2115937,2116033,2116129,2116225,2116321,2150658,2150722,2200225,6291456]),
  new Uint32Array([2168321,6291456,2168353,6291456,2168385,6291456,2168417,6291456,2168449,6291456,2168481,6291456,2168513,6291456,2168545,6291456]),
  new Uint32Array([23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,0,6291456,0,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,2186625,0,0,6291456,6291456,2186657,2186689,2186721,2173505,0,10496067,10496163,10496259]),
  new Uint32Array([2178785,6291456,2178817,6291456,2178849,6291456,2178881,6291456,2178913,6291456,2178945,6291456,2178977,6291456,2179009,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0]),
  new Uint32Array([2097152,0,0,0,2097152,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,0,2197857,2197889,2197921,2197953,2197985,2198017,0,0,2198049,2198081,2198113,2198145,2198177,2198209]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2098209,2167297,2111137,6291456]),
  new Uint32Array([2171393,6291456,2171425,6291456,2171457,6291456,2171489,6291456,2171521,6291456,2171553,6291456,2171585,6291456,2171617,6291456]),
  new Uint32Array([2206753,2206785,2195457,2206817,2206849,2206881,2206913,2197153,2197153,2206945,2117857,2206977,2207009,2207041,2207073,2207105]),
  new Uint32Array([0,0,0,0,0,0,0,23068672,0,0,0,0,2144834,2144898,0,2144962]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672]),
  new Uint32Array([2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,0,2105505,2098241]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,2202049,6291456,2202081,6291456,2202113,6291456,2202145,6291456,2202177,6291456,2202209,6291456,2202241,6291456]),
  new Uint32Array([10501155,10501251,10501347,10501443,10501539,10501635,10501731,10501827,10501923,10502019,2141731,2105505,2098177,2155586,2166530,0]),
  new Uint32Array([2102081,2102209,2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,2100833,2100737,2098337,2101441]),
  new Uint32Array([2146882,2146946,2147010,2147074,2147138,2147202,2147266,2147330,2146882,2146946,2147010,2147074,2147138,2147202,2147266,2147330]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),
  new Uint32Array([10502307,10502403,10502499,10502595,10502691,10502787,10502883,10502979,10503075,10503171,10503267,10503363,10503459,10503555,10503651,10503747]),
  new Uint32Array([2179937,2179969,2180001,2180033,2156545,2180065,2156577,2180097,2180129,2180161,2180193,2180225,2180257,2180289,2156737,2180321]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,0,0,0,6291456,0,0,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0]),
  new Uint32Array([2227682,2227746,2227810,2227874,2227938,2228002,2228066,2228130,2228194,2228258,2228322,2228386,2228450,2228514,2228578,2228642]),
  new Uint32Array([2105601,2169121,2108193,2170049,2181025,2181057,2112481,2108321,2108289,2181089,2170497,2100865,2181121,2173601,2173633,2173665]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2180641,6291456,6291456,6291456]),
  new Uint32Array([0,6291456,6291456,6291456,0,6291456,0,6291456,0,0,6291456,6291456,0,6291456,6291456,6291456]),
  new Uint32Array([2178273,6291456,2178305,6291456,2178337,6291456,2178369,6291456,2178401,6291456,2178433,6291456,2178465,6291456,2178497,6291456]),
  new Uint32Array([6291456,6291456,23068672,23068672,23068672,6291456,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,14680064,14680064,14680064,14680064,14680064,14680064]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456]),
  new Uint32Array([2237377,2237409,2236225,2237441,2237473,2217441,2215521,2215553,2217473,2237505,2237537,2209697,2237569,2215585,2237601,2237633]),
  new Uint32Array([2221985,2165601,2165601,2165665,2165665,2222017,2222017,2165729,2165729,2158913,2158913,2158913,2158913,2097281,2097281,2105921]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2149634,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2176897,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,2176929,6291456,2176961,6291456,2176993,6291456]),
  new Uint32Array([2172641,6291456,2172673,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2172705,2172737,6291456,2172769,2172801,6291456]),
  new Uint32Array([2099173,2104196,2121667,2099395,2121763,2152258,2152322,2098946,2152386,2121859,2121955,2099333,2122051,2104324,2099493,2122147]),
  new Uint32Array([6291456,6291456,6291456,2145794,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,2145858,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,0,0,6291456,0]),
  new Uint32Array([0,2105921,2097729,0,2097377,0,0,2106017,0,2097505,2105889,2097185,2097697,2135777,2097633,2097441]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2239074,2239138,2239201,2239233,2239265,2239297,2239329,2239361,0,2239393,2239425,2239425,2239458,2239521,2239553,2209569]),
  new Uint32Array([14680064,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,6291456,23068672]),
  new Uint32Array([2108321,2108289,2113153,2098209,2180897,2180929,2180961,2111137,2098241,2108353,2170241,2170273,2180993,2105825,6291456,2105473]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2146114,6291456,6291456,6291456,0,0,0]),
  new Uint32Array([2105921,2105921,2105921,2222049,2222049,2130977,2130977,2130977,2130977,2160065,2160065,2160065,2160065,2097729,2097729,2097729]),
  new Uint32Array([2218145,2214785,2207937,2218177,2218209,2192993,2210113,2212769,2218241,2218273,2216129,2218305,2216161,2218337,2218369,2218401]),
  new Uint32Array([0,0,0,2156546,2156610,2156674,2156738,2156802,0,0,0,0,0,2156866,23068672,2156930]),
  new Uint32Array([23068672,23068672,23068672,0,0,0,0,23068672,23068672,0,0,23068672,23068672,23068672,0,0]),
  new Uint32Array([2213409,2213441,2213473,2213505,2213537,2213569,2213601,2213633,2213665,2195681,2213697,2213729,2213761,2213793,2213825,2213857]),
  new Uint32Array([2100033,2099233,2122017,2200673,2098113,2121537,2103201,2200705,2104033,2121857,2121953,2122401,2099649,2099969,2123009,2100129]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2201857,6291456,2201889,6291456,2201921,6291456,2201953,6291456,2201985,6291456,2202017,6291456,2176193,2176257,23068672,23068672]),
  new Uint32Array([6291456,6291456,23068672,23068672,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2188193,2188225,2188257,2188289,2188321,2188353,2188385,2188417,2188449,2188481,2188513,2188545,2188577,2188609,2188641,0]),
  new Uint32Array([10554529,2221089,0,10502113,10562017,10537921,10538049,2221121,2221153,0,0,0,0,0,0,0]),
  new Uint32Array([2213889,2213921,2213953,2213985,2214017,2214049,2214081,2194177,2214113,2214145,2214177,2214209,2214241,2214273,2214305,2214337]),
  new Uint32Array([2166978,2167042,2099169,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2180545,6291456,6291456,6291456]),
  new Uint32Array([10518915,10519011,10519107,10519203,2162242,2162306,2159554,2162370,2159362,2159618,2105922,2162434,2159746,2162498,2159810,2159874]),
  new Uint32Array([2161730,2161794,2135586,2161858,2161922,2137186,2131810,2160290,2135170,2161986,2137954,2162050,2162114,2162178,10518723,10518819]),
  new Uint32Array([10506627,10506723,10506819,10506915,10507011,10507107,10507203,10507299,10507395,10507491,10507587,10507683,10507779,10507875,10507971,10508067]),
  new Uint32Array([6291456,23068672,23068672,23068672,0,23068672,23068672,0,0,0,0,0,23068672,23068672,23068672,23068672]),
  new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0]),
  new Uint32Array([2175873,2175905,2175937,2175969,2176001,2176033,2176065,2176097,2176129,2176161,2176193,2176225,2176257,2176289,2176321,2176353]),
  new Uint32Array([2140006,2140198,2140390,2140582,2140774,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,23068672,23068672,23068672]),
  new Uint32Array([2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241]),
  new Uint32Array([0,23068672,0,0,0,0,0,0,0,2145154,2145218,2145282,6291456,0,2145346,0]),
  new Uint32Array([0,0,0,0,10531458,10495395,2148545,2143201,2173473,2148865,2173505,0,2173537,0,2173569,2149121]),
  new Uint32Array([10537282,10495683,2148738,2148802,2148866,0,6291456,2148930,2186593,2173473,2148737,2148865,2148802,10495779,10495875,10495971]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2215425,2215457,2215489,2215521,2215553,2215585,2215617,2215649,2215681,2215713,2215745,2215777,2192033,2215809,2215841,2215873]),
  new Uint32Array([2242049,2242081,2242113,2242145,2242177,2242209,2242241,2242273,2215937,2242305,2242338,2242401,2242433,2242465,2242497,2216001]),
  new Uint32Array([10554529,2221089,0,0,10562017,10502113,10538049,10537921,2221185,10489601,10489697,10609889,10609921,2141729,2141793,10610273]),
  new Uint32Array([2141923,2142019,2142115,2142211,2142307,2142403,2142499,2142595,2142691,0,0,0,0,0,0,0]),
  new Uint32Array([0,2221185,2221217,10609857,10609857,10489601,10489697,10609889,10609921,2141729,2141793,2221345,2221377,2221409,2221441,2187105]),
  new Uint32Array([6291456,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,18923970,23068672,23068672,23068672,0,6291456,6291456]),
  new Uint32Array([2183105,6291456,2183137,6291456,2183169,6291456,2183201,6291456,2183233,6291456,2183265,6291456,2183297,6291456,2183329,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),
  new Uint32Array([23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456]),
  new Uint32Array([2134434,2134818,2097666,2097186,2097474,2097698,2105986,2131586,2132450,2131874,2131778,2135970,2135778,2161602,2136162,2161666]),
  new Uint32Array([2236865,2236897,2236930,2236993,2237025,2235681,2237058,2237121,2237153,2237185,2237217,2217281,2237250,2191233,2237313,2237345]),
  new Uint32Array([2190049,6291456,2190081,6291456,2190113,6291456,2190145,6291456,2190177,6291456,2190209,6291456,2190241,6291456,2190273,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2101922,2102050,2102178,2102306,10498755,10498851,10498947,10499043,10499139,10499235,10499331,10499427,10499523,10489604,10489732,10489860]),
  new Uint32Array([2166914,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),
  new Uint32Array([2181601,2170561,2181633,2181665,2170753,2181697,2172897,2170881,2181729,2170913,2172929,2113441,2181761,2181793,2171009,2173761]),
  new Uint32Array([0,2105921,2097729,2106081,0,2097601,2162337,2106017,2133281,2097505,0,2097185,2097697,2135777,2097633,2097441]),
  new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,0,0,0,0]),
  new Uint32Array([2248001,2248033,2248066,2248130,2248193,2248226,2248289,2248322,2248385,2248417,2216673,2248450,2248514,2248577,2248610,2248673]),
  new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,0,0,0]),
  new Uint32Array([2169729,6291456,2169761,6291456,2169793,6291456,2169825,6291456,2169857,2169889,6291456,2169921,6291456,2143329,6291456,2098305]),
  new Uint32Array([2162178,2163202,2163266,2135170,2136226,2161986,2137954,2159426,2159490,2163330,2159554,2163394,2159682,2139522,2136450,2159746]),
  new Uint32Array([2173953,2173985,0,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2174209,2174241,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,4271169,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2174273]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,6291456,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,2190785,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2189793,6291456,2189825,6291456,2189857,6291456,2189889,6291456,2189921,6291456,2189953,6291456,2189985,6291456,2190017,6291456]),
  new Uint32Array([2105601,2112289,2108193,2112481,2112577,0,2098305,2108321,2108289,2100865,2113153,2108481,2113345,0,2098209,2111137]),
  new Uint32Array([2172129,6291456,2172161,6291456,2172193,6291456,2172225,6291456,2172257,6291456,2172289,6291456,2172321,6291456,2172353,6291456]),
  new Uint32Array([2214753,6291456,2214785,6291456,6291456,2214817,2214849,2214881,2214913,2214945,2214977,2215009,2215041,2215073,2194401,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([0,0,0,0,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([10610305,10610337,10575617,2221761,10610401,10610433,10502177,0,10610465,10610497,10610529,10610561,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,23068672,0,0,0,0,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2187105,2187137,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2199393,2199425,2199457,2199489,2199521,2199553,2199585,2199617,2199649,2199681,2199713,2199745,2199777,2199809,2199841,0]),
  new Uint32Array([2217249,2217281,2217313,2217345,2217377,2217409,2217441,2217473,2215617,2217505,2217537,2217569,2214753,2217601,2217633,2217665]),
  new Uint32Array([2170273,2170305,6291456,2170337,2170369,6291456,2170401,2170433,2170465,6291456,6291456,6291456,2170497,2170529,6291456,2170561]),
  new Uint32Array([2188673,6291456,2188705,2188737,2188769,6291456,6291456,2188801,6291456,2188833,6291456,2188865,6291456,2180929,2181505,2180897]),
  new Uint32Array([10489988,10490116,10490244,10490372,10490500,10490628,10490756,10490884,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2147393,2147457,2147521,2147585,2147649,2147713,2147777,2147841]),
  new Uint32Array([23068672,23068672,0,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),
  new Uint32Array([2241153,2241185,2241217,2215809,2241250,2241313,2241345,2241377,2217921,2241377,2241409,2215873,2241441,2241473,2241505,2241537]),
  new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2220417,2220417,2220449,2220449,2220481,2220481,2220513,2220513,2220545,2220545,2220577,2220577,2220609,2220609,2220641,2220641]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,2144002,0,6291456,6291456,0,0,6291456,6291456,6291456]),
  new Uint32Array([2167105,2167137,2167169,2167201,2167233,2167265,2167297,2167329,2167361,2167393,2167425,2167457,2167489,2167521,2167553,2167585]),
  new Uint32Array([10575521,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193]),
  new Uint32Array([2234146,2234210,2234274,2234338,2234402,2234466,2234530,2234594,2234658,2234722,2234786,2234850,2234914,2234978,2235042,2235106]),
  new Uint32Array([0,0,0,0,0,0,0,2180577,0,0,0,0,0,2180609,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,0,0,6291456,6291456]),
  new Uint32Array([2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481]),
  new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2242529,2242561,2242593,2242625,2242657,2242689,2242721,2242753,2207937,2218177,2242785,2242817,2242849,2242882,2242945,2242977]),
  new Uint32Array([2118049,2105345,2118241,2105441,2118433,2118529,2118625,2118721,2118817,2200257,2200289,2191809,2200321,2200353,2200385,2200417]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0]),
  new Uint32Array([2185505,6291456,2185537,6291456,2185569,6291456,2185601,6291456,2185633,6291456,2185665,6291456,2185697,6291456,2185729,6291456]),
  new Uint32Array([2231970,2232034,2232098,2232162,2232226,2232290,2232354,2232418,2232482,2232546,2232610,2232674,2232738,2232802,2232866,2232930]),
  new Uint32Array([2218625,2246402,2246466,2246530,2246594,2246657,2246689,2246689,2218657,2219681,2246721,2246753,2246785,2246818,2246881,2208481]),
  new Uint32Array([2197025,2197057,2197089,2197121,2197153,2197185,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2219137,2216961,2219169,2219201,2219233,2219265,2219297,2217025,2215041,2219329,2217057,2219361,2217089,2219393,2197153,2219426]),
  new Uint32Array([23068672,23068672,23068672,0,0,0,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,0,0]),
  new Uint32Array([2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713]),
  new Uint32Array([2243522,2243585,2243617,2243649,2243681,2210113,2243713,2243746,2243810,2243874,2243937,2243970,2244033,2244065,2244097,2244129]),
  new Uint32Array([2178017,6291456,2178049,6291456,2178081,6291456,2178113,6291456,2178145,6291456,2178177,6291456,2178209,6291456,2178241,6291456]),
  new Uint32Array([10553858,2165314,10518722,6291456,10518818,0,10518914,2130690,10519010,2130786,10519106,2130882,10519202,2165378,10554050,2165506]),
  new Uint32Array([0,0,2135491,2135587,2135683,2135779,2135875,2135971,2135971,2136067,2136163,2136259,2136355,2136355,2136451,2136547]),
  new Uint32Array([23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2220033,2220033,2220065,2220065,2220065,2220065,2220097,2220097,2220097,2220097,2220129,2220129,2220129,2220129,2220161,2220161]),
  new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2100897,2100898,2100899,2150018,2100865,2100866,2100867,2100868,2150082,2108481,2109858,2109859,2105569,2105505,2098241,2105601]),
  new Uint32Array([2097217,2097505,2097505,2097505,2097505,2165570,2165570,2165634,2165634,2165698,2165698,2097858,2097858,0,0,2097152]),
  new Uint32Array([23068672,6291456,23068672,23068672,23068672,6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,23068672,23068672]),
  new Uint32Array([23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),
  new Uint32Array([10503843,10503939,10504035,10504131,10504227,10504323,10504419,10504515,10504611,10504707,10504803,10504899,10504995,10491140,10491268,0]),
  new Uint32Array([2173697,2173729,2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889,2173921,2173953,2173985,2173761,2174017,2174049]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2134145,2097153,2134241,2105953,2132705,2130977,2160065,2131297,2162049,2133089,2160577,2133857,2235297,2220769,2235329,2235361]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2222401,2222433,2222465,10531394,2222497,2222529,2222561,0,2222593,2222625,2222657,2222689,2222721,2222753,2222785,0]),
  new Uint32Array([2184481,6291456,2184513,6291456,2184545,6291456,2184577,6291456,2184609,6291456,2184641,6291456,2184673,6291456,2184705,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2105570,2156034,2126947,2156098,2153666,2127043,2127139,2156162,0,2127235,2156226,2156290,2156354,2156418,2127331,2127427]),
  new Uint32Array([2215905,2207041,2153185,2241569,2241601,2241633,2241665,2241697,2241730,2241793,2241825,2241857,2241889,2241921,2241954,2242017]),
  new Uint32Array([2203777,6291456,2203809,6291456,2203841,6291456,2203873,6291456,2203905,6291456,2173121,2180993,2181249,2203937,2181313,0]),
  new Uint32Array([2168577,6291456,2168609,6291456,2168641,6291456,2168673,6291456,2168705,6291456,2168737,6291456,2168769,6291456,2168801,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,23068672,23068672,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,0,23068672,23068672,23068672,0,0]),
  new Uint32Array([2210113,2195521,2210145,2210177,2210209,2210241,2210273,2210305,2210337,2210369,2210401,2210433,2210465,2210497,2210529,2210561]),
  new Uint32Array([6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),
  new Uint32Array([2228706,2228770,2228834,2228898,2228962,2229026,2229090,2229154,2229218,2229282,2229346,2229410,2229474,2229538,2229602,2229666]),
  new Uint32Array([23068672,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,18874368,18874368,18874368,0,0]),
  new Uint32Array([2133089,2133281,2133281,2133281,2133281,2160577,2160577,2160577,2160577,2097441,2097441,2097441,2097441,2133857,2133857,2133857]),
  new Uint32Array([6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2173825,2153473,2173857,2173889,2173921,2173953,2173985,2174017,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2233089]),
  new Uint32Array([2178529,6291456,2178561,6291456,2178593,6291456,2178625,6291456,2178657,6291456,2178689,6291456,2178721,6291456,2178753,6291456]),
  new Uint32Array([2221025,2221025,2221057,2221057,2159329,2159329,2159329,2159329,2097217,2097217,2158914,2158914,2158978,2158978,2159042,2159042]),
  new Uint32Array([2208161,2208193,2208225,2208257,2194433,2208289,2208321,2208353,2208385,2208417,2208449,2208481,2208513,2208545,2208577,2208609]),
  new Uint32Array([2169217,6291456,2169249,6291456,2169281,6291456,2169313,6291456,2169345,6291456,2169377,6291456,2169409,6291456,2169441,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456]),
  new Uint32Array([2133187,2133283,2133283,2133379,2133475,2133571,2133667,2133667,2133763,2133859,2133955,2134051,2134147,2134147,2134243,2134339]),
  new Uint32Array([2197697,2114113,2114209,2197729,2197761,2114305,2197793,2114401,2114497,2197825,2114593,2114689,2114785,2114881,2114977,0]),
  new Uint32Array([2193089,2193121,2193153,2193185,2117665,2117569,2193217,2193249,2193281,2193313,2193345,2193377,2193409,2193441,2193473,2193505]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2184225,6291456,2184257,6291456,2184289,6291456,2184321,6291456,2184353,6291456,2184385,6291456,2184417,6291456,2184449,6291456]),
  new Uint32Array([2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2100833,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2098657,2098049,2200737,2123489,2123681,2200769,2098625,2100321,2098145,2100449,2098017,2098753,2200801,2200833,2200865,0]),
  new Uint32Array([23068672,23068672,23068672,0,0,0,0,0,0,0,0,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),
  new Uint32Array([2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,0,2098241,2108353,2108417,2105825,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2181153,2105505,2181185,2167617,2180993]),
  new Uint32Array([2160002,2160066,2160130,2160194,2160258,2132066,2131010,2131106,2106018,2131618,2160322,2131298,2132034,2131938,2137410,2132226]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,6291456]),
  new Uint32Array([2183617,6291456,2183649,6291456,2183681,6291456,2183713,6291456,2183745,6291456,2183777,6291456,2183809,6291456,2183841,6291456]),
  new Uint32Array([0,6291456,6291456,0,6291456,0,0,6291456,6291456,0,6291456,0,0,6291456,0,0]),
  new Uint32Array([2250977,2251009,2251041,2251073,2195009,2251106,2251169,2251201,2251233,2251265,2251297,2251330,2251394,2251457,2251489,2251521]),
  new Uint32Array([2205729,2205761,2205793,2205825,2205857,2205889,2205921,2205953,2205985,2206017,2206049,2206081,2206113,2206145,2206177,2206209]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2143170,2168993,6291456,2169025,6291456,2169057,6291456,2169089,6291456,2143234,2169121,6291456,2169153,6291456,2169185,6291456]),
  new Uint32Array([23068672,23068672,2190689,6291456,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2248706,2248769,2248801,2248833,2248865,2248897,2248929,2248962,2249026,2249090,2249154,2240705,2249217,2249249,2249281,2249313]),
  new Uint32Array([10485857,6291456,6291456,6291456,6291456,6291456,6291456,6291456,10495394,6291456,2098209,6291456,6291456,2097152,6291456,10531394]),
  new Uint32Array([0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,0]),
  new Uint32Array([14680064,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2173985,2173953,2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889]),
  new Uint32Array([6291456,2186977,6291456,6291456,6291456,6291456,6291456,10537858,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2209601,2209633,2209665,2209697,2209729,2209761,2209793,2209825,2209857,2209889,2209921,2209953,2209985,2210017,2210049,2210081]),
  new Uint32Array([10501539,10501635,10501731,10501827,10501923,10502019,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905]),
  new Uint32Array([2173697,2173729,2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889,2173921,2173953,2173985,2174017,2174017,2174049]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,0,0]),
  new Uint32Array([6291456,6291456,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2194561,2194593,2194625,2119777,2119873,2194657,2194689,2194721,2194753,2194785,2194817,2194849,2194881,2194913,2194945,2194977]),
  new Uint32Array([2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569]),
  new Uint32Array([2222818,2222882,2222946,2223010,2223074,2223138,2223202,2223266,2223330,2223394,2223458,2223522,2223586,2223650,2223714,2223778]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672]),
  new Uint32Array([0,2179553,2179585,2179617,2179649,2144001,2179681,2179713,2179745,2179777,2179809,2156705,2179841,2156833,2179873,2179905]),
  new Uint32Array([6291456,23068672,6291456,2145602,23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,6291456,0,0]),
  new Uint32Array([2196513,2196545,2196577,2196609,2196641,2196673,2196705,2196737,2196769,2196801,2196833,2196865,2196897,2196929,2196961,2196993]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2177281,6291456,2177313,6291456,2177345,6291456,2177377,6291456,2177409,6291456,2177441,6291456,2177473,6291456,2177505,6291456]),
  new Uint32Array([2187137,2221473,2221505,2221537,2221569,6291456,6291456,10610209,10610241,10537986,10537986,10537986,10537986,10609857,10609857,10609857]),
  new Uint32Array([2243009,2243041,2216033,2243074,2243137,2243169,2243201,2219617,2243233,2243265,2243297,2243329,2243362,2243425,2243457,2243489]),
  new Uint32Array([10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,2097152,4194304,4194304,0,0]),
  new Uint32Array([2143042,6291456,2143106,2143106,2168833,6291456,2168865,6291456,6291456,2168897,6291456,2168929,6291456,2168961,6291456,2143170]),
  new Uint32Array([6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2204193,2204225,2204257,2204289,2204321,2204353,2204385,2204417,2204449,2204481,2204513,2204545,2204577,2204609,2204641,2204673]),
  new Uint32Array([2202753,6291456,2202785,6291456,2202817,6291456,2202849,6291456,2202881,6291456,2202913,6291456,2202945,6291456,2202977,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321]),
  new Uint32Array([2147394,2147458,2147522,2147586,2147650,2147714,2147778,2147842,2147394,2147458,2147522,2147586,2147650,2147714,2147778,2147842]),
  new Uint32Array([2253313,2253346,2253409,2253441,2253473,2253505,2253537,2253569,2253601,2253634,2219393,2253697,2253729,2253761,2253793,2253825]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([2162562,2162626,2131362,2162690,2159938,2160002,2162754,2162818,2160130,2162882,2160194,2160258,2160834,2160898,2161026,2161090]),
  new Uint32Array([2175361,2175393,2175425,2175457,2175489,2175521,2175553,2175585,2175617,2175649,2175681,2175713,2175745,2175777,2175809,2175841]),
  new Uint32Array([2253858,2253921,2253954,2254018,2254082,2196737,2254145,2196865,2254177,2254209,2254241,2254273,2197025,2254306,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2202113,2204129,2188705,2204161]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,6291456,6291456,6291456,6291456,0,0]),
  new Uint32Array([2173985,2174017,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2233089,2173697,2173761,2173793,2174113,2173985,2173953]),
  new Uint32Array([2101569,2101697,2101825,2101953,2102081,2102209,2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209]),
  new Uint32Array([2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,0,2108417,0,2111713,2100897,2111905]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0]),
  new Uint32Array([2175425,2175489,2175809,2175905,2175937,2175937,2176193,2176417,2180865,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,2143298,2143298,2143298,2143362,2143362,2143362,2143426,2143426,2143426,2171105,6291456,2171137]),
  new Uint32Array([2120162,2120258,2151618,2151682,2151746,2151810,2151874,2151938,2152002,2120035,2120131,2120227,2152066,2120323,2152130,2120419]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2195361,2142433,2236065,2236097,2236129,2236161,2118241,2117473,2236193,2236225,2236257,2236289,0,0,0,0]),
  new Uint32Array([2189281,6291456,2189313,6291456,2189345,6291456,2189377,6291456,2189409,6291456,2189441,6291456,2189473,6291456,2189505,6291456]),
  new Uint32Array([6291456,6291456,2145922,6291456,6291456,6291456,6291456,2145986,6291456,6291456,6291456,6291456,2146050,6291456,6291456,6291456]),
  new Uint32Array([2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,10502113,10562017,10610401,10502177,10610433,10538049]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,2186401,0,2186433,0,2186465,0,2186497]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,23068672,23068672,23068672]),
  new Uint32Array([0,0,2198241,2198273,2198305,2198337,2198369,2198401,0,0,2198433,2198465,2198497,0,0,0]),
  new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,6291456,0,23068672,23068672,23068672,23068672,23068672,23068672,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,0,0,23068672,6291456,23068672,23068672]),
  new Uint32Array([0,2105921,2097729,0,2097377,0,0,2106017,2133281,2097505,2105889,0,2097697,2135777,2097633,2097441]),
  new Uint32Array([2197889,2197921,2197953,2197985,2198017,2198049,2198081,2198113,2198145,2198177,2198209,2198241,2198273,2198305,2198337,2198369]),
  new Uint32Array([2132514,2132610,2160386,2133090,2133186,2160450,2160514,2133282,2160578,2133570,2106178,2160642,2133858,2160706,2160770,2134146]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,23068672,23068672,6291456,23068672,23068672,6291456,23068672,0,0,0,0,0,0,0,0]),
  new Uint32Array([2184737,6291456,2184769,6291456,2184801,6291456,2184833,6291456,2184865,6291456,2184897,6291456,2184929,6291456,2184961,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,6291456,6291456,6291456,6291456,0,6291456]),
  new Uint32Array([6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,6291456,23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672,0,0]),
  new Uint32Array([6291456,6291456,6291456,2186753,6291456,6291456,6291456,6291456,2186785,2186817,2186849,2173569,2186881,10496355,10495395,10575521]),
  new Uint32Array([0,0,2097729,0,0,0,0,2106017,0,2097505,0,2097185,0,2135777,2097633,2097441]),
  new Uint32Array([2189537,6291456,2189569,6291456,2189601,6291456,2189633,6291456,2189665,6291456,2189697,6291456,2189729,6291456,2189761,6291456]),
  new Uint32Array([2202497,6291456,2202529,6291456,2202561,6291456,2202593,6291456,2202625,6291456,2202657,6291456,2202689,6291456,2202721,6291456]),
  new Uint32Array([2245217,2218369,2245249,2245282,2245345,2245377,2245410,2245474,2245537,2245569,2245601,2245633,2245665,2245665,2245697,2245729]),
  new Uint32Array([6291456,0,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,0,0,0,0,0,0,23068672,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,6291456,23068672,6291456,23068672,6291456,6291456,6291456,6291456,23068672,23068672]),
  new Uint32Array([0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2097281,2105921,2097729,2106081,2097377,2097601,2162337,2106017,2133281,2097505,0,2097185,2097697,2135777,2097633,2097441]),
  new Uint32Array([2176641,6291456,2176673,6291456,2176705,6291456,2176737,6291456,2176769,6291456,2176801,6291456,2176833,6291456,2176865,6291456]),
  new Uint32Array([2174145,2174177,2149057,2233089,2173697,2173761,2173793,2174113,2173985,2173953,2174369,2174369,0,0,2100833,2100737]),
  new Uint32Array([2116513,2190817,2190849,2190881,2190913,2190945,2116609,2190977,2191009,2191041,2191073,2117185,2191105,2191137,2191169,2191201]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,6291456,6291456,6291456]),
  new Uint32Array([0,0,0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456]),
  new Uint32Array([2167617,2167649,2167681,2167713,2167745,2167777,2167809,6291456,2167841,2167873,2167905,2167937,2167969,2168001,2168033,4240130]),
  new Uint32Array([2165122,2163970,2164034,2164098,2164162,2164226,2164290,2164354,2164418,2164482,2164546,2133122,2134562,2132162,2132834,2136866]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,2186209,2186241,2186273,2186305,2186337,2186369,0,0]),
  new Uint32Array([2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,14680064,14680064,14680064,14680064,14680064]),
  new Uint32Array([0,0,23068672,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456]),
  new Uint32Array([0,10537921,10610689,10610273,10610497,10610529,10610305,10610721,10489601,10489697,10610337,10575617,10554529,2221761,2197217,10496577]),
  new Uint32Array([2105473,2105569,2105601,2112289,0,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441]),
  new Uint32Array([2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481]),
  new Uint32Array([2125346,2153410,2153474,2127394,2153538,2153602,2153666,2153730,2105507,2105476,2153794,2153858,2153922,2153986,2154050,2105794]),
  new Uint32Array([2200449,2119681,2200481,2153313,2199873,2199905,2199937,2200513,2200545,2200577,2200609,2119105,2119201,2119297,2119393,2119489]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2175777,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2222273,2197217,2221473,2221505,2221089,2222305,2200865,2099681,2104481,2222337,2099905,2120737,2222369,2103713,2100225,2098785]),
  new Uint32Array([2201377,6291456,2201409,6291456,2201441,6291456,2201473,6291456,2201505,6291456,2201537,6291456,2201569,6291456,6291456,23068672]),
  new Uint32Array([2174081,2174113,2174145,2174177,2149057,2233057,2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761,2143969,2173793]),
  new Uint32Array([2200897,6291456,2200929,6291456,2200961,6291456,2200993,6291456,2201025,6291456,2180865,6291456,2201057,6291456,2201089,6291456]),
  new Uint32Array([0,0,0,0,0,23068672,23068672,0,6291456,6291456,6291456,0,0,0,0,0]),
  new Uint32Array([2161154,2161410,2138658,2161474,2161538,2097666,2097186,2097474,2162946,2132450,2163010,2163074,2136162,2163138,2161666,2161730]),
  new Uint32Array([2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889,2173921,2173953]),
  new Uint32Array([0,0,0,0,0,0,23068672,23068672,0,0,0,0,2145410,2145474,0,6291456]),
  new Uint32Array([2244161,2216065,2212769,2244193,2244225,2244257,2244290,2244353,2244385,2244417,2244449,2218273,2244481,2244514,2244577,2244609]),
  new Uint32Array([2125730,2125699,2125795,2125891,2125987,2154114,2154178,2154242,2154306,2154370,2154434,2154498,2126082,2126178,2126274,2126083]),
  new Uint32Array([2237665,2237697,2237697,2237697,2237730,2237793,2237825,2237857,2237890,2237953,2237985,2238017,2238049,2238081,2238113,2238145]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2150146,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,0,0,23068672,23068672,23068672,0,0]),
  new Uint32Array([2214369,2238593,2238625,2238657,2238689,2238721,2238753,2238785,2238817,2238850,2238913,2238945,2238977,2235457,2239009,2239041]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),
  new Uint32Array([2252066,2252130,2252193,2252225,2252257,2252290,2252353,2252385,2252417,2252449,2252481,2252513,2252545,2252578,2252641,2252673]),
  new Uint32Array([2197697,2114113,2114209,2197729,2197761,2114305,2197793,2114401,2114497,2197825,2114593,2114689,2114785,2114881,2114977,2197857]),
  new Uint32Array([2224866,2224930,2224994,2225058,2225122,2225186,2225250,2225314,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2219490,2219554,2219617,2219649,2219681,2219714,2219778,2219842,2219905,2219937,0,0,0,0,0,0]),
  new Uint32Array([6291456,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456]),
  new Uint32Array([2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289]),
  new Uint32Array([2174081,2174113,2174145,2174177,2149057,2233089,2173697,2173761,2173793,2174113,2173985,2173953,2148481,2173601,2173633,2173665]),
  new Uint32Array([2220161,2220161,2220193,2220193,2220193,2220193,2220225,2220225,2220225,2220225,2220257,2220257,2220257,2220257,2220289,2220289]),
  new Uint32Array([2192673,2192705,2192737,2192769,2192801,2192833,2192865,2118049,2192897,2117473,2117761,2192929,2192961,2192993,2193025,2193057]),
  new Uint32Array([2179297,6291456,2179329,6291456,2179361,6291456,2179393,6291456,2179425,6291456,2179457,6291456,2179489,6291456,2179521,6291456]),
  new Uint32Array([6291456,6291456,6291456,23068672,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2235745,2235777,2193633,2235809,2235841,2235873,2235905,2235937,2235969,2116513,2116705,2236001,2200513,2199905,2200545,2236033]),
  new Uint32Array([2113153,2108481,2113345,2113441,2232993,2233025,0,0,2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761]),
  new Uint32Array([2170593,6291456,2170625,6291456,2170657,6291456,2170689,2170721,6291456,2170753,6291456,6291456,2170785,6291456,2170817,2170849]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2166786,2166850,0,0,0,0]),
  new Uint32Array([23068672,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),
  new Uint32Array([2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,10575617,2187041,10502177,10489601,10489697,0]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2134562,2132162,2132834,2136866,2136482,2164610,2164674,2164738,2164802,2132802,2132706,2164866,2132898,2164930,2164994,2165058]),
  new Uint32Array([6291456,6291456,2098337,2101441,10531458,2153473,6291456,6291456,10531522,2100737,2108193,6291456,2106499,2106595,2106691,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2233122,2233186,2233250,2233314,2233378,2233442,2233506,2233570,2233634,2233698,2233762,2233826,2233890,2233954,2234018,2234082]),
  new Uint32Array([23068672,6291456,23068672,23068672,23068672,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2205217,2205249,2205281,2205313,2205345,2205377,2205409,2205441,2205473,2205505,2205537,2205569,2205601,2205633,2205665,2205697]),
  new Uint32Array([6291456,0,6291456,0,0,0,6291456,6291456,6291456,6291456,0,0,23068672,6291456,23068672,23068672]),
  new Uint32Array([2173601,2173761,2174081,2173569,2174241,2174113,2173953,6291456,2174305,6291456,2174337,6291456,2174369,6291456,2174401,6291456]),
  new Uint32Array([6291456,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),
  new Uint32Array([2152450,2152514,2099653,2104452,2099813,2122243,2099973,2152578,2122339,2122435,2122531,2122627,2122723,2104580,2122819,2152642]),
  new Uint32Array([2236385,2236417,2236449,2236482,2236545,2215425,2236577,2236609,2236641,2236673,2215457,2236705,2236737,2236770,2215489,2236833]),
  new Uint32Array([2163394,2159746,2163458,2131362,2163522,2160130,2163778,2132226,2163842,2132898,2163906,2161410,2138658,2097666,2136162,2163650]),
  new Uint32Array([2218721,2246913,2246946,2216385,2247010,2247074,2215009,2247137,2247169,2216481,2247201,2247233,2247266,2247330,2247330,0]),
  new Uint32Array([2129730,2129762,2129858,2129731,2129827,2156482,2156482,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,0,0,0,0,6291456,0,0]),
  new Uint32Array([2203969,2204001,2181377,2204033,2204065,6291456,2204097,6291456,0,0,0,0,0,0,0,0]),
  new Uint32Array([2169473,6291456,2169505,6291456,2169537,6291456,2169569,6291456,2169601,6291456,2169633,6291456,2169665,6291456,2169697,6291456]),
  new Uint32Array([2141542,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2220801,2220801,2220801,2220801,2220833,2220833,2220865,2220865,2220865,2220865,2220897,2220897,2220897,2220897,2139873,2139873]),
  new Uint32Array([0,0,0,0,0,23068672,23068672,0,0,0,0,0,0,0,6291456,0]),
  new Uint32Array([2214849,2218433,2218465,2218497,2218529,2218561,2214881,2218593,2218625,2218657,2218689,2218721,2218753,2216545,2218785,2218817]),
  new Uint32Array([23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0,6291456]),
  new Uint32Array([2136482,2164610,2164674,2164738,2164802,2132802,2132706,2164866,2132898,2164930,2164994,2165058,2165122,2132802,2132706,2164866]),
  new Uint32Array([2207649,2207681,2207713,2207745,2207777,2207809,2207841,2207873,2207905,2207937,2207969,2208001,2208033,2208065,2208097,2208129]),
  new Uint32Array([2123683,2105092,2152706,2123779,2105220,2152770,2100453,2098755,2123906,2124002,2124098,2124194,2124290,2124386,2124482,2124578]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,6291456,0,0,0,0,0,0,0,10485857]),
  new Uint32Array([6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([10508163,10508259,10508355,10508451,2200129,2200161,2192737,2200193,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2203553,6291456,2203585,6291456,6291456,6291456,2203617,6291456,2203649,6291456,2203681,6291456,2203713,6291456,2203745,6291456]),
  new Uint32Array([18884449,18884065,23068672,18884417,18884034,18921185,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,18874368]),
  new Uint32Array([2247393,2247426,2247489,2247521,2247553,2247586,2247649,2247681,2247713,2247745,2247777,2247810,2247873,2247905,2247937,2247969]),
  new Uint32Array([6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672]),
  new Uint32Array([2134145,2097153,2134241,0,2132705,2130977,2160065,2131297,0,2133089,2160577,2133857,2235297,0,2235329,0]),
  new Uint32Array([2182593,6291456,2182625,6291456,2182657,6291456,2182689,6291456,2182721,6291456,2182753,6291456,2182785,6291456,2182817,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2102402,2102403,6291456,2110050]),
  new Uint32Array([2149890,2108323,2149954,6291456,2113441,6291456,2149057,6291456,2113441,6291456,2105473,2167265,2111137,2105505,6291456,2108353]),
  new Uint32Array([2219105,2219137,2195233,2251554,2251617,2251649,2251681,2251713,2251746,2251810,2251873,2251905,2251937,2251970,2252033,2219169]),
  new Uint32Array([2203009,6291456,2203041,6291456,2203073,6291456,2203105,6291456,2203137,6291456,2203169,6291456,2203201,6291456,2203233,6291456]),
  new Uint32Array([2128195,2128291,2128387,2128483,2128579,2128675,2128771,2128867,2128963,2129059,2129155,2129251,2129347,2129443,2129539,2129635]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2140964,2141156,2140966,2141158,2141350]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2225378,2225442,2225506,2225570,2225634,2225698,2225762,2225826,2225890,2225954,2226018,2226082,2226146,2226210,2226274,2226338]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417]),
  new Uint32Array([2108353,2108417,0,2105601,2108193,2157121,2157313,2157377,2157441,2100897,6291456,2108419,2173953,2173633,2173633,2173953]),
  new Uint32Array([2111713,2173121,2111905,2098177,2173153,2173185,2173217,2113153,2113345,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,2190753]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,2197249,6291456,2117377,2197281,2197313,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,0,0,0,0,0,0,23068672,0,0,0,0,0,6291456,6291456,6291456]),
  new Uint32Array([2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953]),
  new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0]),
  new Uint32Array([0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,23068672,23068672,23068672]),
  new Uint32Array([2173281,6291456,2173313,6291456,2173345,6291456,2173377,6291456,0,0,10532546,6291456,6291456,6291456,10562017,2173441]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0]),
  new Uint32Array([23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2159426,2159490,2159554,2159362,2159618,2159682,2139522,2136450,2159746,2159810,2159874,2130978,2131074,2131266,2131362,2159938]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2203233,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2203265,6291456,2203297,6291456,2203329,2203361,6291456]),
  new Uint32Array([6291456,6291456,2148418,2148482,2148546,0,6291456,2148610,2186529,2186561,2148417,2148545,2148482,10495778,2143969,10495778]),
  new Uint32Array([2134146,2139426,2160962,2134242,2161218,2161282,2161346,2161410,2138658,2134722,2134434,2134818,2097666,2097346,2097698,2105986]),
  new Uint32Array([2198881,2198913,2198945,2198977,2199009,2199041,2199073,2199105,2199137,2199169,2199201,2199233,2199265,2199297,2199329,2199361]),
  new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456]),
  new Uint32Array([10610561,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193]),
  new Uint32Array([2183873,6291456,2183905,6291456,2183937,6291456,2183969,6291456,2184001,6291456,2184033,6291456,2184065,6291456,2184097,6291456]),
  new Uint32Array([2244642,2244706,2244769,2244801,2218305,2244833,2244865,2244897,2244929,2244961,2244993,2245026,2245089,2245122,2245185,0]),
  new Uint32Array([6291456,6291456,2116513,2116609,2116705,2116801,2199873,2199905,2199937,2199969,2190913,2200001,2200033,2200065,2200097,2191009]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,2180673,2180705,2180737,2180769,2180801,2180833,0,0]),
  new Uint32Array([2098081,2099521,2099105,2120705,2098369,2120801,2103361,2097985,2098433,2121377,2121473,2099169,2099873,2098401,2099393,2152609]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2150402]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,2145666,2145730,6291456,6291456]),
  new Uint32Array([2173921,2173953,2173985,2173761,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2233057,2148481,2173601,2173633,2173665]),
  new Uint32Array([2187073,6291456,6291456,6291456,6291456,2098241,2098241,2108353,2100897,2111905,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2102404,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,2100612,6291456,6291456,6291456,6291456,6291456,6291456,6291456,10485857]),
  new Uint32Array([2149057,2233057,2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889]),
  new Uint32Array([2217697,2217729,2217761,2217793,2217825,2217857,2217889,2217921,2217953,2215873,2217985,2215905,2218017,2218049,2218081,2218113]),
  new Uint32Array([2211233,2218849,2216673,2218881,2218913,2218945,2218977,2219009,2216833,2219041,2215137,2219073,2216865,2209505,2219105,2216897]),
  new Uint32Array([2240097,2240129,2240161,2240193,2240225,2240257,2240289,2240321,2240353,2240386,2240449,2240481,2240513,2240545,2207905,2240578]),
  new Uint32Array([6291456,6291456,2202273,6291456,2202305,6291456,2202337,6291456,2202369,6291456,2202401,6291456,2202433,6291456,2202465,6291456]),
  new Uint32Array([0,23068672,23068672,18923394,23068672,18923458,18923522,18884099,18923586,18884195,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2201121,6291456,2201153,6291456,2201185,6291456,2201217,6291456,2201249,6291456,2201281,6291456,2201313,6291456,2201345,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456]),
  new Uint32Array([2211041,2211073,2211105,2211137,2211169,2211201,2211233,2211265,2211297,2211329,2211361,2211393,2211425,2211457,2211489,2211521]),
  new Uint32Array([2181825,6291456,2181857,6291456,2181889,6291456,2181921,6291456,2181953,6291456,2181985,6291456,2182017,6291456,2182049,6291456]),
  new Uint32Array([2162337,2097633,2097633,2097633,2097633,2132705,2132705,2132705,2132705,2097153,2097153,2097153,2097153,2133089,2133089,2133089]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,2148545,6291456,2173473,6291456,2148865,6291456,2173505,6291456,2173537,6291456,2173569,6291456,2149121,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,0,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0]),
  new Uint32Array([2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889,2173921,2173953,2173985,2174017,2174017,2174049,2174081,2174113]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2207137,2207169,2207201,2207233,2207265,2207297,2207329,2207361,2207393,2207425,2207457,2207489,2207521,2207553,2207585,2207617]),
  new Uint32Array([6291456,6291456,23068672,23068672,23068672,6291456,6291456,0,23068672,23068672,0,0,0,0,0,0]),
  new Uint32Array([2198401,2198433,2198465,2198497,0,2198529,2198561,2198593,2198625,2198657,2198689,2198721,2198753,2198785,2198817,2198849]),
  new Uint32Array([2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177]),
  new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0,0]),
  new Uint32Array([2216385,2118721,2216417,2216449,2216481,2216513,2216545,2211233,2216577,2216609,2216641,2216673,2216705,2216737,2216737,2216769]),
  new Uint32Array([2216801,2216833,2216865,2216897,2216929,2216961,2216993,2215169,2217025,2217057,2217089,2217121,2217154,2217217,0,0]),
  new Uint32Array([2210593,2191809,2210625,2210657,2210689,2210721,2210753,2210785,2210817,2210849,2191297,2210881,2210913,2210945,2210977,2211009]),
  new Uint32Array([0,0,2105825,0,0,2111905,2105473,0,0,2112289,2108193,2112481,2112577,0,2098305,2108321]),
  new Uint32Array([0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,2097153,2134241,0,2132705,0,0,2131297,0,2133089,0,2133857,0,2220769,0,2235361]),
  new Uint32Array([14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,6291456,6291456,14680064]),
  new Uint32Array([23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),
  new Uint32Array([2171873,6291456,2171905,6291456,2171937,6291456,2171969,6291456,2172001,6291456,2172033,6291456,2172065,6291456,2172097,6291456]),
  new Uint32Array([2220929,2220929,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2133857,2134145,2134145,2134145,2134145,2134241,2134241,2134241,2134241,2105889,2105889,2105889,2105889,2097185,2097185,2097185]),
  new Uint32Array([2173697,2173761,2173793,2174113,2173985,2173953,2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761,2143969,2173793]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,10499619,10499715,10499811,10499907]),
  new Uint32Array([0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,0,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,23068672,23068672]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,2144322,2144386,2144450,2144514,2144578,2144642,2144706,2144770]),
  new Uint32Array([23068672,23068672,23068672,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456]),
  new Uint32Array([2113153,2108481,2113345,2113441,2098209,2111137,0,2098241,2108353,2108417,2105825,0,0,2111905,2105473,2105569]),
  new Uint32Array([2236321,2236353,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2152194,2121283,2103684,2103812,2097986,2098533,2097990,2098693,2098595,2098853,2099013,2103940,2121379,2121475,2121571,2104068]),
  new Uint32Array([2206241,2206273,2206305,2206337,2206369,2206401,2206433,2206465,2206497,2206529,2206561,2206593,2206625,2206657,2206689,2206721]),
  new Uint32Array([6291456,6291456,6291456,6291456,16777216,16777216,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,23068672,23068672,10538818,10538882,6291456,6291456,2150338]),
  new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2214369,2214401,2214433,2214465,2214497,2214529,2214561,2214593,2194977,2214625,2195073,2214657,2214689,2214721,6291456,6291456]),
  new Uint32Array([2097152,2097152,2097152,2097152,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2182081,6291456,2182113,6291456,2182145,6291456,2182177,6291456,2182209,6291456,2182241,6291456,2182273,6291456,2182305,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2146881,2146945,2147009,2147073,2147137,2147201,2147265,2147329]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,23068672,23068672]),
  new Uint32Array([0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2122915,2123011,2123107,2104708,2123203,2123299,2123395,2100133,2104836,2100290,2100293,2104962,2104964,2098052,2123491,2123587]),
  new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456]),
  new Uint32Array([6291456,2171169,6291456,2171201,6291456,2171233,6291456,2171265,6291456,2171297,6291456,2171329,6291456,6291456,2171361,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,0,2148994,2149058,2149122,0,6291456,2149186,2186945,2173537,2148993,2149121,2149058,10531458,10496066,0]),
  new Uint32Array([2195009,2195041,2195073,2195105,2195137,2195169,2195201,2195233,2195265,2195297,2195329,2195361,2195393,2195425,2195457,2195489]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,0,0,6291456,6291456]),
  new Uint32Array([2182849,6291456,2182881,6291456,2182913,6291456,2182945,6291456,2182977,6291456,2183009,6291456,2183041,6291456,2183073,6291456]),
  new Uint32Array([2211553,2210081,2211585,2211617,2211649,2211681,2211713,2211745,2211777,2211809,2209569,2211841,2211873,2211905,2211937,2211969]),
  new Uint32Array([2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2166594,2127298,2166658,2142978,2141827,2166722]),
  new Uint32Array([2173985,2173761,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2233057,2148481,2173601,2173633,2173665,2173697,2173729]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,2185761,2185793,2185825,2185857,2185889,2185921,0,0]),
  new Uint32Array([6291456,2148481,2173601,2173633,2173665,2173697,2173729,2148801,2173761,2143969,2173793,2173825,2153473,2173857,2173889,2173921]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,6291456]),
  new Uint32Array([0,0,0,2220961,2220961,2220961,2220961,2144193,2144193,2159201,2159201,2159265,2159265,2144194,2220993,2220993]),
  new Uint32Array([2192641,2235393,2235425,2152257,2116609,2235457,2235489,2200065,2235521,2235553,2235585,2212449,2235617,2235649,2235681,2235713]),
  new Uint32Array([2194049,2194081,2194113,2194145,2194177,2194209,2194241,2194273,2194305,2194337,2194369,2194401,2194433,2194465,2194497,2194529]),
  new Uint32Array([2196673,2208641,2208673,2208705,2208737,2208769,2208801,2208833,2208865,2208897,2208929,2208961,2208993,2209025,2209057,2209089]),
  new Uint32Array([2191681,2191713,2191745,2191777,2153281,2191809,2191841,2191873,2191905,2191937,2191969,2192001,2192033,2192065,2192097,2192129]),
  new Uint32Array([2230946,2231010,2231074,2231138,2231202,2231266,2231330,2231394,2231458,2231522,2231586,2231650,2231714,2231778,2231842,2231906]),
  new Uint32Array([14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2185953,2185985,2186017,2186049,2186081,2186113,2186145,2186177]),
  new Uint32Array([2139811,2139907,2097284,2105860,2105988,2106116,2106244,2097444,2097604,2097155,10485778,10486344,2106372,6291456,0,0]),
  new Uint32Array([2110051,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2172385,6291456,2172417,6291456,2172449,6291456,2172481,6291456,2172513,6291456,2172545,6291456,2172577,6291456,2172609,6291456]),
  new Uint32Array([0,0,23068672,23068672,6291456,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2249345,2249377,2249409,2249441,2249473,2249505,2249537,2249570,2210209,2249633,2249665,2249697,2249729,2249761,2249793,2216769]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456]),
  new Uint32Array([2187169,2187201,2187233,2187265,2187297,2187329,2187361,2187393,2187425,2187457,2187489,2187521,2187553,2187585,2187617,2187649]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([0,0,0,6291456,6291456,0,0,0,6291456,6291456,6291456,0,0,0,6291456,6291456]),
  new Uint32Array([2182337,6291456,2182369,6291456,2182401,6291456,2182433,6291456,2182465,6291456,2182497,6291456,2182529,6291456,2182561,6291456]),
  new Uint32Array([2138179,2138275,2138371,2138467,2134243,2134435,2138563,2138659,2138755,2138851,2138947,2139043,2138947,2138755,2139139,2139235]),
  new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),
  new Uint32Array([0,0,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2250498,2250562,2250625,2250657,2208321,2250689,2250721,2250753,2250785,2250817,2250849,2218945,2250881,2250913,2250945,0]),
  new Uint32Array([2170369,2105569,2098305,2108481,2173249,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456]),
  new Uint32Array([2100897,2111905,2105473,2105569,2105601,0,2108193,0,0,0,2098305,2108321,2108289,2100865,2113153,2108481]),
  new Uint32Array([2100897,2100897,2105569,2105569,6291456,2112289,2149826,6291456,6291456,2112481,2112577,2098177,2098177,2098177,6291456,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,6291456,6291456,6291456]),
  new Uint32Array([6291456,2169953,2169985,6291456,2170017,6291456,2170049,2170081,6291456,2170113,2170145,2170177,6291456,6291456,2170209,2170241]),
  new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2220641,2220641,2220673,2220673,2220673,2220673,2220705,2220705,2220705,2220705,2220737,2220737,2220737,2220737,2220769,2220769]),
  new Uint32Array([2127650,2127746,2127842,2127938,2128034,2128130,2128226,2128322,2128418,2127523,2127619,2127715,2127811,2127907,2128003,2128099]),
  new Uint32Array([2143969,2173793,2173825,2153473,2173857,2173889,2173921,2173953,2173985,2173761,2174017,2174049,2174081,2174113,2174145,2174177]),
  new Uint32Array([0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([2204705,2204737,2204769,2204801,2204833,2204865,2204897,2204929,2204961,2204993,2205025,2205057,2205089,2205121,2205153,2205185]),
  new Uint32Array([2176385,6291456,2176417,6291456,2176449,6291456,2176481,6291456,2176513,6291456,2176545,6291456,2176577,6291456,2176609,6291456]),
  new Uint32Array([2195521,2195553,2195585,2195617,2195649,2195681,2117857,2195713,2195745,2195777,2195809,2195841,2195873,2195905,2195937,2195969]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456]),
  new Uint32Array([2173921,2173953,2173985,2174017,2174017,2174049,2174081,2174113,2174145,2174177,2149057,2233089,2173697,2173761,2173793,2174113]),
  new Uint32Array([2131586,2132450,2135970,2135778,2161602,2136162,2163650,2161794,2135586,2163714,2137186,2131810,2160290,2135170,2097506,2159554]),
  new Uint32Array([2134145,2097153,2134241,2105953,2132705,2130977,2160065,2131297,2162049,2133089,2160577,2133857,0,0,0,0]),
  new Uint32Array([2116513,2116609,2116705,2116801,2116897,2116993,2117089,2117185,2117281,2117377,2117473,2117569,2117665,2117761,2117857,2117953]),
  new Uint32Array([2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,2100802,2101154,2101282,2101410,2101538,2101666,2101794]),
  new Uint32Array([2100289,2098657,2098049,2200737,2123489,2123681,2200769,2098625,2100321,2098145,2100449,2098017,2098753,2098977,2150241,2150305]),
  new Uint32Array([6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,2109955,6291456,6291456,0,0,0,0]),
  new Uint32Array([18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,6291456,0,0]),
  new Uint32Array([2130979,2131075,2131075,2131171,2131267,2131363,2131459,2131555,2131651,2131651,2131747,2131843,2131939,2132035,2132131,2132227]),
  new Uint32Array([0,2177793,6291456,2177825,6291456,2177857,6291456,2177889,6291456,2177921,6291456,2177953,6291456,2177985,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),
  new Uint32Array([6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2113345,0,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289]),
  new Uint32Array([2136643,2136739,2136835,2136931,2137027,2137123,2137219,2137315,2137411,2137507,2137603,2137699,2137795,2137891,2137987,2138083]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),
  new Uint32Array([2174433,6291456,2174465,6291456,2174497,6291456,2174529,6291456,2174561,6291456,2174593,6291456,2174625,6291456,2174657,6291456]),
  new Uint32Array([0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441]),
  new Uint32Array([10496547,10496643,2105505,2149698,6291456,10496739,10496835,2170273,6291456,2149762,2105825,2111713,2111713,2111713,2111713,2168673]),
  new Uint32Array([6291456,2143490,2143490,2143490,2171649,6291456,2171681,2171713,2171745,6291456,2171777,6291456,2171809,6291456,2171841,6291456]),
  new Uint32Array([2159106,2159106,2159170,2159170,2159234,2159234,2159298,2159298,2159298,2159362,2159362,2159362,2106401,2106401,2106401,2106401]),
  new Uint32Array([2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137]),
  new Uint32Array([2108417,2181217,2181249,2181281,2170433,2170401,2181313,2181345,2181377,2181409,2181441,2181473,2181505,2181537,2170529,2181569]),
  new Uint32Array([2218433,2245761,2245793,2245825,2245857,2245890,2245953,2245986,2209665,2246050,2246113,2246146,2246210,2246274,2246337,2246369]),
  new Uint32Array([2230754,2230818,2230882,0,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2184129,6291456,2184161,6291456,2184193,6291456,6291456,6291456,6291456,6291456,2146818,2183361,6291456,6291456,2142978,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2135170,2097506,2130691,2130787,2130883,2163970,2164034,2164098,2164162,2164226,2164290,2164354,2164418,2164482,2164546,2133122]),
  new Uint32Array([2108515,2108611,2100740,2108707,2108803,2108899,2108995,2109091,2109187,2109283,2109379,2109475,2109571,2109667,2109763,2100738]),
  new Uint32Array([2102788,2102916,2103044,2120515,2103172,2120611,2120707,2098373,2103300,2120803,2120899,2120995,2103428,2103556,2121091,2121187]),
  new Uint32Array([2158082,2158146,0,2158210,2158274,0,2158338,2158402,2158466,2129922,2158530,2158594,2158658,2158722,2158786,2158850]),
  new Uint32Array([10499619,10499715,10499811,10499907,10500003,10500099,10500195,10500291,10500387,10500483,10500579,10500675,10500771,10500867,10500963,10501059]),
  new Uint32Array([2239585,2239618,2239681,2239713,0,2191969,2239745,2239777,2192033,2239809,2239841,2239874,2239937,2239970,2240033,2240065]),
  new Uint32Array([2252705,2252738,2252801,2252833,2252865,2252897,2252930,2252994,2253057,2253089,2253121,2253154,2253217,2253250,2219361,2219361]),
  new Uint32Array([2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,10538050,10538114,10538178,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([2226402,2226466,2226530,2226594,2226658,2226722,2226786,2226850,2226914,2226978,2227042,2227106,2227170,2227234,2227298,2227362]),
  new Uint32Array([23068672,6291456,6291456,6291456,6291456,2144066,2144130,2144194,2144258,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,6291456,23068672,23068672]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),
  new Uint32Array([2124674,2124770,2123875,2123971,2124067,2124163,2124259,2124355,2124451,2124547,2124643,2124739,2124835,2124931,2125027,2125123]),
  new Uint32Array([2168065,6291456,2168097,6291456,2168129,6291456,2168161,6291456,2168193,6291456,2168225,6291456,2168257,6291456,2168289,6291456]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0]),
  new Uint32Array([23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,2100610,2100611,6291456,2107842,2107843,6291456,6291456,6291456,6291456,10537922,6291456,10537986,6291456]),
  new Uint32Array([2174849,2174881,2174913,2174945,2174977,2175009,2175041,2175073,2175105,2175137,2175169,2175201,2175233,2175265,2175297,2175329]),
  new Uint32Array([2154562,2154626,2154690,2154754,2141858,2154818,2154882,2127298,2154946,2127298,2155010,2155074,2155138,2155202,2155266,2155202]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0]),
  new Uint32Array([2200641,2150786,2150850,2150914,2150978,2151042,2106562,2151106,2150562,2151170,2151234,2151298,2151362,2151426,2151490,2151554]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,6291456,6291456]),
  new Uint32Array([2220289,2220289,2220321,2220321,2220321,2220321,2220353,2220353,2220353,2220353,2220385,2220385,2220385,2220385,2220417,2220417]),
  new Uint32Array([2155330,2155394,0,2155458,2155522,2155586,2105732,0,2155650,2155714,2155778,2125314,2155842,2155906,2126274,2155970]),
  new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,23068672,23068672,6291456,23068672,23068672,23068672,23068672,6291456,6291456]),
  new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0]),
  new Uint32Array([2097729,2106017,2106017,2106017,2106017,2131297,2131297,2131297,2131297,2106081,2106081,2162049,2162049,2105953,2105953,2162337]),
  new Uint32Array([2097185,2097697,2097697,2097697,2097697,2135777,2135777,2135777,2135777,2097377,2097377,2097377,2097377,2097601,2097601,2097217]),
  new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23068672]),
  new Uint32Array([2139331,2139427,2139523,2139043,2133571,2132611,2139619,2139715,0,0,0,0,0,0,0,0]),
  new Uint32Array([2174113,2174145,2100897,2098177,2108289,2100865,2173601,2173633,2173985,2174113,2174145,6291456,6291456,6291456,6291456,6291456]),
  new Uint32Array([6291456,6291456,23068672,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456]),
  new Uint32Array([23068672,23068672,18923778,23068672,23068672,23068672,23068672,18923842,23068672,23068672,23068672,23068672,18923906,23068672,23068672,23068672]),
  new Uint32Array([2134145,2097153,2134241,0,2132705,2130977,2160065,2131297,0,2133089,0,2133857,0,0,0,0]),
  new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2177537,6291456,2177569,6291456,2177601,6291456,2177633,6291456,2177665,6291456,2177697,6291456,2177729,6291456,2177761,6291456]),
  new Uint32Array([2212481,2212513,2212545,2212577,2197121,2212609,2212641,2212673,2212705,2212737,2212769,2212801,2212833,2212865,2212897,2212929]),
  new Uint32Array([6291456,6291456,23068672,23068672,23068672,6291456,6291456,0,0,0,0,0,0,0,0,0]),
  new Uint32Array([2098241,2108353,2170209,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,6291456,2108193,2172417,2112481,2098177]),
  new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),
];
var blockIdxes = new Uint16Array([616,616,565,147,161,411,330,2,131,131,328,454,241,408,86,86,696,113,285,350,325,301,473,214,639,232,447,64,369,598,124,672,567,223,621,154,107,86,86,86,86,86,86,505,86,68,634,86,218,218,218,218,486,218,218,513,188,608,216,86,217,463,668,85,700,360,184,86,86,86,647,402,153,10,346,718,662,260,145,298,117,1,443,342,138,54,563,86,240,572,218,70,387,86,118,460,641,602,86,86,306,218,86,692,86,86,86,86,86,162,707,86,458,26,86,218,638,86,86,86,86,86,65,449,86,86,306,183,86,58,391,667,86,157,131,131,131,131,86,433,131,406,31,218,247,86,86,693,218,581,351,86,438,295,69,462,45,126,173,650,14,295,69,97,168,187,641,78,523,390,69,108,287,664,173,219,83,295,69,108,431,426,173,694,412,115,628,52,257,398,641,118,501,121,69,579,151,423,173,620,464,121,69,382,151,476,173,27,53,121,86,594,578,226,173,86,632,130,86,96,228,268,641,622,563,86,86,21,148,650,131,131,321,43,144,343,381,531,131,131,178,20,86,399,156,375,164,541,30,60,715,198,92,118,131,131,86,86,306,407,86,280,457,196,488,358,131,131,244,86,86,143,86,86,86,86,86,667,563,86,86,86,86,86,86,86,86,86,86,86,86,86,336,363,86,86,336,86,86,380,678,67,86,86,86,678,86,86,86,512,86,307,86,708,86,86,86,86,86,528,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,563,307,86,86,86,86,86,104,450,337,86,720,86,32,450,397,86,86,86,587,218,558,708,708,293,708,86,86,86,86,86,694,205,86,8,86,86,86,86,549,86,667,697,697,679,86,458,460,86,86,650,86,708,543,86,86,86,245,86,86,86,140,218,127,708,708,458,197,131,131,131,131,500,86,86,483,251,86,306,510,515,86,722,86,86,86,65,201,86,86,483,580,470,86,86,86,368,131,131,131,694,114,110,555,86,86,123,721,163,142,713,418,86,317,675,209,218,218,218,371,545,592,629,490,603,199,46,320,525,680,310,279,388,111,42,252,593,607,235,617,410,377,50,548,135,356,17,520,189,116,392,600,349,332,482,699,690,535,119,106,451,71,152,667,131,218,218,265,671,637,492,504,533,683,269,269,658,86,86,86,86,86,86,86,86,86,491,619,86,86,6,86,86,86,86,86,86,86,86,86,86,86,229,86,86,86,86,86,86,86,86,86,86,86,86,667,86,86,171,131,118,131,656,206,234,571,89,334,670,246,311,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,534,86,86,86,86,86,86,82,86,86,86,86,86,430,86,86,86,86,86,86,86,86,86,599,86,324,86,470,69,640,264,131,626,101,174,86,86,667,233,105,73,374,394,221,204,84,28,326,86,86,471,86,86,86,109,573,86,171,200,200,200,200,218,218,86,86,86,86,460,131,131,131,86,506,86,86,86,86,86,220,404,34,614,47,442,305,25,612,338,601,648,7,344,255,131,131,51,86,312,507,563,86,86,86,86,588,86,86,86,86,86,530,511,86,458,3,435,384,556,522,230,527,86,118,86,86,717,86,137,273,79,181,484,23,93,112,655,249,417,703,370,87,98,313,684,585,155,465,596,481,695,18,416,428,61,701,706,282,643,495,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,549,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,549,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,307,86,86,86,171,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,650,131,422,542,420,263,24,172,86,86,86,86,86,566,86,86,132,540,395,353,494,519,19,485,284,472,131,131,131,16,714,86,211,708,86,86,86,694,698,86,86,483,704,708,218,272,86,86,120,86,159,478,86,307,247,86,86,663,597,459,627,667,86,86,277,455,39,302,86,250,86,86,86,271,99,452,306,281,329,400,200,86,86,362,549,352,646,461,323,586,86,86,4,708,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,717,86,518,86,86,650,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,125,554,480,300,613,72,333,288,561,544,604,48,719,91,169,176,590,224,76,191,29,559,560,231,537,166,477,538,256,437,131,131,469,167,40,0,685,266,441,705,239,642,475,568,640,610,299,673,517,318,385,22,202,180,179,359,424,215,90,66,521,653,467,682,453,409,479,88,131,661,35,303,15,262,666,630,712,131,131,618,659,175,218,195,347,193,227,261,150,165,709,546,294,569,710,270,413,376,524,55,242,38,419,529,170,657,3,304,122,379,278,131,651,86,67,576,458,458,131,131,86,86,86,86,86,86,86,118,309,86,86,547,86,86,86,86,667,650,664,131,131,86,86,56,131,131,131,131,131,131,131,131,86,307,86,86,86,664,238,650,86,86,717,86,118,86,86,315,86,59,86,86,574,549,131,131,340,57,436,86,86,86,86,86,86,458,708,499,691,62,86,650,86,86,694,86,86,86,319,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,171,86,549,694,131,131,131,131,131,131,131,131,131,77,86,86,139,86,502,86,86,86,667,595,131,131,131,86,12,86,13,86,609,131,131,131,131,86,86,86,625,86,669,86,86,182,129,86,5,694,104,86,86,86,86,131,131,86,86,386,171,86,86,86,345,86,324,86,589,86,213,36,131,131,131,131,131,86,86,86,86,104,131,131,131,141,290,80,677,86,86,86,267,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,667,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,515,86,86,33,136,669,86,711,515,86,86,550,640,86,104,708,515,86,159,372,717,86,86,444,515,86,86,663,37,86,563,460,86,390,624,702,131,131,131,131,389,59,708,86,86,341,208,708,635,295,69,108,431,508,100,190,131,131,131,131,131,131,131,131,86,86,86,649,516,660,131,131,86,86,86,218,631,708,131,131,131,131,131,131,131,131,131,131,86,86,341,575,238,514,131,131,86,86,86,218,291,708,307,131,86,86,306,367,708,131,131,131,86,378,697,86,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,615,253,86,86,86,292,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,104,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,69,86,341,553,549,86,307,86,86,645,275,455,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,708,131,131,131,131,131,131,86,86,86,86,86,86,667,460,86,86,86,86,86,86,86,86,86,86,86,86,717,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,667,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,171,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,104,86,667,459,131,131,131,131,131,131,86,458,225,86,86,86,516,549,11,390,405,86,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,460,44,218,197,711,515,131,131,131,131,664,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,307,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,308,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,640,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,118,307,104,286,591,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,549,86,86,681,86,86,75,185,314,582,86,358,496,474,86,104,131,86,86,86,86,146,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,171,86,640,131,131,131,131,131,131,131,131,246,503,689,339,674,81,258,415,439,128,562,366,414,246,503,689,583,222,557,316,636,665,186,355,95,670,246,503,689,339,674,557,258,415,439,186,355,95,670,246,503,689,446,644,536,652,331,532,335,440,274,421,297,570,74,425,364,425,606,552,403,509,134,365,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,218,218,218,498,218,218,577,627,551,497,572,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,553,354,236,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,296,455,131,131,456,243,103,86,41,459,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,9,276,158,716,393,564,383,489,401,654,210,654,131,131,131,640,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,650,86,86,86,86,86,86,717,667,563,563,563,86,549,102,686,133,246,605,86,448,86,86,207,307,131,131,131,641,86,177,611,445,373,194,584,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,308,307,171,86,86,86,86,86,86,86,717,86,86,86,86,86,460,131,131,650,86,86,86,694,708,86,86,694,86,458,131,131,131,131,131,131,667,694,289,650,667,131,131,86,640,131,131,664,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,171,131,131,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,460,86,86,86,86,86,86,86,86,86,86,86,86,86,458,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,640,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,466,203,149,429,94,432,160,687,539,63,237,283,192,248,348,259,427,526,396,676,254,468,487,212,327,623,49,633,322,493,434,688,357,361,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131,131]);
var mappingStr = "صلى الله عليه وسلمجل جلالهキロメートルrad∕s2エスクードキログラムキロワットグラムトンクルゼイロサンチームパーセントピアストルファラッドブッシェルヘクタールマンションミリバールレントゲン′′′′1⁄10viii(10)(11)(12)(13)(14)(15)(16)(17)(18)(19)(20)∫∫∫∫(오전)(오후)アパートアルファアンペアイニングエーカーカラットカロリーキュリーギルダークローネサイクルシリングバーレルフィートポイントマイクロミクロンメガトンリットルルーブル株式会社kcalm∕s2c∕kgاكبرمحمدصلعمرسولریال1⁄41⁄23⁄4 ̈́ྲཱྀླཱྀ ̈͂ ̓̀ ̓́ ̓͂ ̔̀ ̔́ ̔͂ ̈̀‵‵‵a/ca/sc/oc/utelfax1⁄71⁄91⁄32⁄31⁄52⁄53⁄54⁄51⁄65⁄61⁄83⁄85⁄87⁄8xii0⁄3∮∮∮(1)(2)(3)(4)(5)(6)(7)(8)(9)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(l)(m)(n)(o)(p)(q)(r)(s)(t)(u)(v)(w)(x)(y)(z)::====(ᄀ)(ᄂ)(ᄃ)(ᄅ)(ᄆ)(ᄇ)(ᄉ)(ᄋ)(ᄌ)(ᄎ)(ᄏ)(ᄐ)(ᄑ)(ᄒ)(가)(나)(다)(라)(마)(바)(사)(아)(자)(차)(카)(타)(파)(하)(주)(一)(二)(三)(四)(五)(六)(七)(八)(九)(十)(月)(火)(水)(木)(金)(土)(日)(株)(有)(社)(名)(特)(財)(祝)(労)(代)(呼)(学)(監)(企)(資)(協)(祭)(休)(自)(至)pte10月11月12月ergltdアールインチウォンオンスオームカイリガロンガンマギニーケースコルナコーポセンチダースノットハイツパーツピクルフランペニヒヘルツペンスページベータボルトポンドホールホーンマイルマッハマルクヤードヤールユアンルピー10点11点12点13点14点15点16点17点18点19点20点21点22点23点24点hpabardm2dm3khzmhzghzthzmm2cm2km2mm3cm3km3kpampagpalogmilmolppmv∕ma∕m10日11日12日13日14日15日16日17日18日19日20日21日22日23日24日25日26日27日28日29日30日31日galffifflשּׁשּׂ ٌّ ٍّ َّ ُّ ِّ ّٰـَّـُّـِّتجمتحجتحمتخمتمجتمحتمخجمححميحمىسحجسجحسجىسمحسمجسممصححصممشحمشجيشمخشممضحىضخمطمحطممطميعجمعممعمىغممغميغمىفخمقمحقمملحملحيلحىلججلخملمحمحجمحيمجحمجممخممجخهمجهممنحمنحىنجمنجىنمينمىيممبخيتجيتجىتخيتخىتميتمىجميجحىجمىسخىصحيشحيضحيلجيلمييحييجييميمميقمينحيعميكمينجحمخيلجمكممجحيحجيمجيفميبحيسخينجيصلےقلے𝅘𝅥𝅮𝅘𝅥𝅯𝅘𝅥𝅰𝅘𝅥𝅱𝅘𝅥𝅲𝆹𝅥𝅮𝆺𝅥𝅮𝆹𝅥𝅯𝆺𝅥𝅯〔s〕ppv〔本〕〔三〕〔二〕〔安〕〔点〕〔打〕〔盗〕〔勝〕〔敗〕 ̄ ́ ̧ssi̇ijl·ʼndžljnjdz ̆ ̇ ̊ ̨ ̃ ̋ ιեւاٴوٴۇٴيٴक़ख़ग़ज़ड़ढ़फ़य़ড়ঢ়য়ਲ਼ਸ਼ਖ਼ਗ਼ਜ਼ਫ਼ଡ଼ଢ଼ําໍາຫນຫມགྷཌྷདྷབྷཛྷཀྵཱཱིུྲྀླྀྒྷྜྷྡྷྦྷྫྷྐྵaʾἀιἁιἂιἃιἄιἅιἆιἇιἠιἡιἢιἣιἤιἥιἦιἧιὠιὡιὢιὣιὤιὥιὦιὧιὰιαιάιᾶι ͂ὴιηιήιῆιὼιωιώιῶι ̳!! ̅???!!?rs°c°fnosmtmivix⫝̸ ゙ ゚よりコト333435참고주의363738394042444546474849503月4月5月6月7月8月9月hgevギガデシドルナノピコビルペソホンリラレムdaauovpciu平成昭和大正明治naμakakbmbgbpfnfμfμgmgμlmldlklfmnmμmpsnsμsmsnvμvkvpwnwμwmwkwkωmωbqcccddbgyhainkkktlnlxphprsrsvwbstմնմեմիվնմխיִײַשׁשׂאַאָאּבּגּדּהּוּזּטּיּךּכּלּמּנּסּףּפּצּקּרּתּוֹבֿכֿפֿאלئائەئوئۇئۆئۈئېئىئجئحئمئيبجبمبىبيتىتيثجثمثىثيخحضجضمطحظمغجفجفحفىفيقحقىقيكاكجكحكخكلكىكينخنىنيهجهىهييىذٰرٰىٰئرئزئنبزبنترتزتنثرثزثنمانرنزننيريزئخئهبهتهصخنههٰثهسهشهطىطيعىعيغىغيسىسيشىشيصىصيضىضيشخشرسرصرضراً ًـًـّ ْـْلآلألإ𝅗𝅥0,1,2,3,4,5,6,7,8,9,wzhvsdwcmcmddjほかココàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįĵķĺļľłńņňŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷÿźżɓƃƅɔƈɖɗƌǝəɛƒɠɣɩɨƙɯɲɵơƣƥʀƨʃƭʈưʊʋƴƶʒƹƽǎǐǒǔǖǘǚǜǟǡǣǥǧǩǫǭǯǵƕƿǹǻǽǿȁȃȅȇȉȋȍȏȑȓȕȗșțȝȟƞȣȥȧȩȫȭȯȱȳⱥȼƚⱦɂƀʉʌɇɉɋɍɏɦɹɻʁʕͱͳʹͷ;ϳέίόύβγδεζθκλνξοπρστυφχψϊϋϗϙϛϝϟϡϣϥϧϩϫϭϯϸϻͻͼͽѐёђѓєѕіїјљњћќѝўџабвгдежзийклмнопрстуфхцчшщъыьэюяѡѣѥѧѩѫѭѯѱѳѵѷѹѻѽѿҁҋҍҏґғҕҗҙқҝҟҡңҥҧҩҫҭүұҳҵҷҹһҽҿӂӄӆӈӊӌӎӑӓӕӗәӛӝӟӡӣӥӧөӫӭӯӱӳӵӷӹӻӽӿԁԃԅԇԉԋԍԏԑԓԕԗԙԛԝԟԡԣԥԧԩԫԭԯաբգդզէըթժլծկհձղճյշոչպջռստրցփքօֆ་ⴧⴭნᏰᏱᏲᏳᏴᏵꙋɐɑᴂɜᴖᴗᴝᴥɒɕɟɡɥɪᵻʝɭᶅʟɱɰɳɴɸʂƫᴜʐʑḁḃḅḇḉḋḍḏḑḓḕḗḙḛḝḟḡḣḥḧḩḫḭḯḱḳḵḷḹḻḽḿṁṃṅṇṉṋṍṏṑṓṕṗṙṛṝṟṡṣṥṧṩṫṭṯṱṳṵṷṹṻṽṿẁẃẅẇẉẋẍẏẑẓẕạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹỻỽỿἐἑἒἓἔἕἰἱἲἳἴἵἶἷὀὁὂὃὄὅὑὓὕὗᾰᾱὲΐῐῑὶΰῠῡὺῥ`ὸ‐+−∑〈〉ⰰⰱⰲⰳⰴⰵⰶⰷⰸⰹⰺⰻⰼⰽⰾⰿⱀⱁⱂⱃⱄⱅⱆⱇⱈⱉⱊⱋⱌⱍⱎⱏⱐⱑⱒⱓⱔⱕⱖⱗⱘⱙⱚⱛⱜⱝⱞⱡɫᵽɽⱨⱪⱬⱳⱶȿɀⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱⲳⲵⲷⲹⲻⲽⲿⳁⳃⳅⳇⳉⳋⳍⳏⳑⳓⳕⳗⳙⳛⳝⳟⳡⳣⳬⳮⳳⵡ母龟丨丶丿乙亅亠人儿入冂冖冫几凵刀力勹匕匚匸卜卩厂厶又口囗士夂夊夕女子宀寸小尢尸屮山巛工己巾干幺广廴廾弋弓彐彡彳心戈戶手支攴文斗斤方无曰欠止歹殳毋比毛氏气爪父爻爿片牙牛犬玄玉瓜瓦甘生用田疋疒癶白皮皿目矛矢石示禸禾穴立竹米糸缶网羊羽老而耒耳聿肉臣臼舌舛舟艮色艸虍虫血行衣襾見角言谷豆豕豸貝赤走足身車辛辰辵邑酉釆里長門阜隶隹雨靑非面革韋韭音頁風飛食首香馬骨高髟鬥鬯鬲鬼魚鳥鹵鹿麥麻黃黍黑黹黽鼎鼓鼠鼻齊齒龍龜龠.〒卄卅ᄁᆪᆬᆭᄄᆰᆱᆲᆳᆴᆵᄚᄈᄡᄊ짜ᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵᄔᄕᇇᇈᇌᇎᇓᇗᇙᄜᇝᇟᄝᄞᄠᄢᄣᄧᄩᄫᄬᄭᄮᄯᄲᄶᅀᅇᅌᇱᇲᅗᅘᅙᆄᆅᆈᆑᆒᆔᆞᆡ上中下甲丙丁天地問幼箏우秘男適優印注項写左右医宗夜テヌモヨヰヱヲꙁꙃꙅꙇꙉꙍꙏꙑꙓꙕꙗꙙꙛꙝꙟꙡꙣꙥꙧꙩꙫꙭꚁꚃꚅꚇꚉꚋꚍꚏꚑꚓꚕꚗꚙꚛꜣꜥꜧꜩꜫꜭꜯꜳꜵꜷꜹꜻꜽꜿꝁꝃꝅꝇꝉꝋꝍꝏꝑꝓꝕꝗꝙꝛꝝꝟꝡꝣꝥꝧꝩꝫꝭꝯꝺꝼᵹꝿꞁꞃꞅꞇꞌꞑꞓꞗꞙꞛꞝꞟꞡꞣꞥꞧꞩɬʞʇꭓꞵꞷꬷꭒᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹᎺᎻᎼᎽᎾᎿᏀᏁᏂᏃᏄᏅᏆᏇᏈᏉᏊᏋᏌᏍᏎᏏᏐᏑᏒᏓᏔᏕᏖᏗᏘᏙᏚᏛᏜᏝᏞᏟᏠᏡᏢᏣᏤᏥᏦᏧᏨᏩᏪᏫᏬᏭᏮᏯ豈更賈滑串句契喇奈懶癩羅蘿螺裸邏樂洛烙珞落酪駱亂卵欄爛蘭鸞嵐濫藍襤拉臘蠟廊朗浪狼郎來冷勞擄櫓爐盧蘆虜路露魯鷺碌祿綠菉錄論壟弄籠聾牢磊賂雷壘屢樓淚漏累縷陋勒肋凜凌稜綾菱陵讀拏諾丹寧怒率異北磻便復不泌數索參塞省葉說殺沈拾若掠略亮兩凉梁糧良諒量勵呂廬旅濾礪閭驪麗黎曆歷轢年憐戀撚漣煉璉秊練聯輦蓮連鍊列劣咽烈裂廉念捻殮簾獵令囹嶺怜玲瑩羚聆鈴零靈領例禮醴隸惡了僚寮尿料燎療蓼遼暈阮劉杻柳流溜琉留硫紐類戮陸倫崙淪輪律慄栗隆利吏履易李梨泥理痢罹裏裡離匿溺吝燐璘藺隣鱗麟林淋臨笠粒狀炙識什茶刺切度拓糖宅洞暴輻降廓兀嗀塚晴凞猪益礼神祥福靖精蘒諸逸都飯飼館鶴郞隷侮僧免勉勤卑喝嘆器塀墨層悔慨憎懲敏既暑梅海渚漢煮爫琢碑祉祈祐祖禍禎穀突節縉繁署者臭艹著褐視謁謹賓贈辶難響頻恵𤋮舘並况全侀充冀勇勺啕喙嗢墳奄奔婢嬨廒廙彩徭惘慎愈慠戴揄搜摒敖望杖滛滋瀞瞧爵犯瑱甆画瘝瘟盛直睊着磌窱类絛缾荒華蝹襁覆調請諭變輸遲醙鉶陼韛頋鬒𢡊𢡄𣏕㮝䀘䀹𥉉𥳐𧻓齃龎עםٱٻپڀٺٿٹڤڦڄڃچڇڍڌڎڈژڑکگڳڱںڻۀہھۓڭۋۅۉ、〖〗—–_{}【】《》「」『』[]#&*-<>\\$%@ءؤة\"'^|~⦅⦆・ゥャ¢£¬¦¥₩│←↑→↓■○𐐨𐐩𐐪𐐫𐐬𐐭𐐮𐐯𐐰𐐱𐐲𐐳𐐴𐐵𐐶𐐷𐐸𐐹𐐺𐐻𐐼𐐽𐐾𐐿𐑀𐑁𐑂𐑃𐑄𐑅𐑆𐑇𐑈𐑉𐑊𐑋𐑌𐑍𐑎𐑏𐓘𐓙𐓚𐓛𐓜𐓝𐓞𐓟𐓠𐓡𐓢𐓣𐓤𐓥𐓦𐓧𐓨𐓩𐓪𐓫𐓬𐓭𐓮𐓯𐓰𐓱𐓲𐓳𐓴𐓵𐓶𐓷𐓸𐓹𐓺𐓻𐳀𐳁𐳂𐳃𐳄𐳅𐳆𐳇𐳈𐳉𐳊𐳋𐳌𐳍𐳎𐳏𐳐𐳑𐳒𐳓𐳔𐳕𐳖𐳗𐳘𐳙𐳚𐳛𐳜𐳝𐳞𐳟𐳠𐳡𐳢𐳣𐳤𐳥𐳦𐳧𐳨𐳩𐳪𐳫𐳬𐳭𐳮𐳯𐳰𐳱𐳲𑣀𑣁𑣂𑣃𑣄𑣅𑣆𑣇𑣈𑣉𑣊𑣋𑣌𑣍𑣎𑣏𑣐𑣑𑣒𑣓𑣔𑣕𑣖𑣗𑣘𑣙𑣚𑣛𑣜𑣝𑣞𑣟ıȷ∇∂𞤢𞤣𞤤𞤥𞤦𞤧𞤨𞤩𞤪𞤫𞤬𞤭𞤮𞤯𞤰𞤱𞤲𞤳𞤴𞤵𞤶𞤷𞤸𞤹𞤺𞤻𞤼𞤽𞤾𞤿𞥀𞥁𞥂𞥃ٮڡٯ字双多解交映無前後再新初終販声吹演投捕遊指禁空合満申割営配得可丽丸乁𠄢你侻倂偺備像㒞𠘺兔兤具𠔜㒹內𠕋冗冤仌冬𩇟刃㓟刻剆剷㔕包匆卉博即卽卿𠨬灰及叟𠭣叫叱吆咞吸呈周咢哶唐啓啣善喫喳嗂圖圗噑噴壮城埴堍型堲報墬𡓤売壷夆夢奢𡚨𡛪姬娛娧姘婦㛮嬈嬾𡧈寃寘寳𡬘寿将㞁屠峀岍𡷤嵃𡷦嵮嵫嵼巡巢㠯巽帨帽幩㡢𢆃㡼庰庳庶𪎒𢌱舁弢㣇𣊸𦇚形彫㣣徚忍志忹悁㤺㤜𢛔惇慈慌慺憲憤憯懞戛扝抱拔捐𢬌挽拼捨掃揤𢯱搢揅掩㨮摩摾撝摷㩬敬𣀊旣書晉㬙㬈㫤冒冕最暜肭䏙朡杞杓𣏃㭉柺枅桒𣑭梎栟椔楂榣槪檨𣚣櫛㰘次𣢧歔㱎歲殟殻𣪍𡴋𣫺汎𣲼沿泍汧洖派浩浸涅𣴞洴港湮㴳滇𣻑淹潮𣽞𣾎濆瀹瀛㶖灊災灷炭𠔥煅𤉣熜爨牐𤘈犀犕𤜵𤠔獺王㺬玥㺸瑇瑜璅瓊㼛甤𤰶甾𤲒𢆟瘐𤾡𤾸𥁄㿼䀈𥃳𥃲𥄙𥄳眞真瞋䁆䂖𥐝硎䃣𥘦𥚚𥛅秫䄯穊穏𥥼𥪧䈂𥮫篆築䈧𥲀糒䊠糨糣紀𥾆絣䌁緇縂繅䌴𦈨𦉇䍙𦋙罺𦌾羕翺𦓚𦔣聠𦖨聰𣍟䏕育脃䐋脾媵𦞧𦞵𣎓𣎜舄辞䑫芑芋芝劳花芳芽苦𦬼茝荣莭茣莽菧荓菊菌菜𦰶𦵫𦳕䔫蓱蓳蔖𧏊蕤𦼬䕝䕡𦾱𧃒䕫虐虧虩蚩蚈蜎蛢蜨蝫螆蟡蠁䗹衠𧙧裗裞䘵裺㒻𧢮𧥦䚾䛇誠𧲨貫賁贛起𧼯𠠄跋趼跰𠣞軔𨗒𨗭邔郱鄑𨜮鄛鈸鋗鋘鉼鏹鐕𨯺開䦕閷𨵷䧦雃嶲霣𩅅𩈚䩮䩶韠𩐊䪲𩒖頩𩖶飢䬳餩馧駂駾䯎𩬰鱀鳽䳎䳭鵧𪃎䳸𪄅𪈎𪊑䵖黾鼅鼏鼖𪘀";

function mapChar(codePoint) {
  if (codePoint >= 0x30000) {
    // High planes are special cased.
    if (codePoint >= 0xE0100 && codePoint <= 0xE01EF)
      return 18874368;
    return 0;
  }
  return blocks[blockIdxes[codePoint >> 4]][codePoint & 15];
}

return {
  mapStr: mappingStr,
  mapChar: mapChar
};
}));

},{}],7:[function(require,module,exports){
(function(root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define(['punycode', './idna-map'], function(punycode, idna_map) {
      return factory(punycode, idna_map);
    });
  }
  else if (typeof exports === 'object') {
    module.exports = factory(require('punycode'), require('./idna-map'));
  }
  else {
    root.uts46 = factory(root.punycode, root.idna_map);
  }
}(this, function(punycode, idna_map) {

  function mapLabel(label, useStd3ASCII, transitional) {
    var mapped = [];
    var chars = punycode.ucs2.decode(label);
    for (var i = 0; i < chars.length; i++) {
      var cp = chars[i];
      var ch = punycode.ucs2.encode([chars[i]]);
      var composite = idna_map.mapChar(cp);
      var flags = (composite >> 23);
      var kind = (composite >> 21) & 3;
      var index = (composite >> 5) & 0xffff;
      var length = composite & 0x1f;
      var value = idna_map.mapStr.substr(index, length);
      if (kind === 0 || (useStd3ASCII && (flags & 1))) {
        throw new Error("Illegal char " + ch);
      }
      else if (kind === 1) {
        mapped.push(value);
      }
      else if (kind === 2) {
        mapped.push(transitional ? value : ch);
      }
      /* istanbul ignore next */
      else if (kind === 3) {
        mapped.push(ch);
      }
    }

    var newLabel = mapped.join("").normalize("NFC");
    return newLabel;
  }

  function process(domain, transitional, useStd3ASCII) {
    /* istanbul ignore if */
    if (useStd3ASCII === undefined)
      useStd3ASCII = false;
    var mappedIDNA = mapLabel(domain, useStd3ASCII, transitional);

    // Step 3. Break
    var labels = mappedIDNA.split(".");

    // Step 4. Convert/Validate
    labels = labels.map(function(label) {
      if (label.startsWith("xn--")) {
        label = punycode.decode(label.substring(4));
        validateLabel(label, useStd3ASCII, false);
      }
      else {
        validateLabel(label, useStd3ASCII, transitional);
      }
      return label;
    });

    return labels.join(".");
  }

  function validateLabel(label, useStd3ASCII, transitional) {
    // 2. The label must not contain a U+002D HYPHEN-MINUS character in both the
    // third position and fourth positions.
    if (label[2] === '-' && label[3] === '-')
      throw new Error("Failed to validate " + label);

    // 3. The label must neither begin nor end with a U+002D HYPHEN-MINUS
    // character.
    if (label.startsWith('-') || label.endsWith('-'))
      throw new Error("Failed to validate " + label);

    // 4. The label must not contain a U+002E ( . ) FULL STOP.
    // this should nerver happen as label is chunked internally by this character
    /* istanbul ignore if */
    if (label.includes('.'))
      throw new Error("Failed to validate " + label);

    if (mapLabel(label, useStd3ASCII, transitional) !== label)
      throw new Error("Failed to validate " + label);

    // 5. The label must not begin with a combining mark, that is:
    // General_Category=Mark.
    var ch = label.codePointAt(0);
    if (idna_map.mapChar(ch) & (0x2 << 23))
      throw new Error("Label contains illegal character: " + ch);
  }

  function toAscii(domain, options) {
    if (options === undefined)
      options = {};
    var transitional = 'transitional' in options ? options.transitional : true;
    var useStd3ASCII = 'useStd3ASCII' in options ? options.useStd3ASCII : false;
    var verifyDnsLength = 'verifyDnsLength' in options ? options.verifyDnsLength : false;
    var labels = process(domain, transitional, useStd3ASCII).split('.');
    var asciiLabels = labels.map(punycode.toASCII);
    var asciiString = asciiLabels.join('.');
    var i;
    if (verifyDnsLength) {
      if (asciiString.length < 1 || asciiString.length > 253) {
        throw new Error("DNS name has wrong length: " + asciiString);
      }
      for (i = 0; i < asciiLabels.length; i++) {//for .. of replacement
        var label = asciiLabels[i];
        if (label.length < 1 || label.length > 63)
          throw new Error("DNS label has wrong length: " + label);
      }
    }
    return asciiString;
  }

  function toUnicode(domain, options) {
    if (options === undefined)
      options = {};
    var useStd3ASCII = 'useStd3ASCII' in options ? options.useStd3ASCII : false;
    return process(domain, false, useStd3ASCII);
  }

  return {
    toUnicode: toUnicode,
    toAscii: toAscii,
  };
}));

},{"./idna-map":6,"punycode":3}],8:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],9:[function(require,module,exports){
(function (process,global){
/**
 * [js-sha3]{@link https://github.com/emn178/js-sha3}
 *
 * @version 0.5.7
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2015-2016
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var root = typeof window === 'object' ? window : {};
  var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = global;
  }
  var COMMON_JS = !root.JS_SHA3_NO_COMMON_JS && typeof module === 'object' && module.exports;
  var HEX_CHARS = '0123456789abcdef'.split('');
  var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
  var KECCAK_PADDING = [1, 256, 65536, 16777216];
  var PADDING = [6, 1536, 393216, 100663296];
  var SHIFT = [0, 8, 16, 24];
  var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
            0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
            2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
            2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
            2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
  var BITS = [224, 256, 384, 512];
  var SHAKE_BITS = [128, 256];
  var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array'];

  var createOutputMethod = function (bits, padding, outputType) {
    return function (message) {
      return new Keccak(bits, padding, bits).update(message)[outputType]();
    };
  };

  var createShakeOutputMethod = function (bits, padding, outputType) {
    return function (message, outputBits) {
      return new Keccak(bits, padding, outputBits).update(message)[outputType]();
    };
  };

  var createMethod = function (bits, padding) {
    var method = createOutputMethod(bits, padding, 'hex');
    method.create = function () {
      return new Keccak(bits, padding, bits);
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(bits, padding, type);
    }
    return method;
  };

  var createShakeMethod = function (bits, padding) {
    var method = createShakeOutputMethod(bits, padding, 'hex');
    method.create = function (outputBits) {
      return new Keccak(bits, padding, outputBits);
    };
    method.update = function (message, outputBits) {
      return method.create(outputBits).update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createShakeOutputMethod(bits, padding, type);
    }
    return method;
  };

  var algorithms = [
    {name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod},
    {name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod},
    {name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod}
  ];

  var methods = {}, methodNames = [];

  for (var i = 0; i < algorithms.length; ++i) {
    var algorithm = algorithms[i];
    var bits  = algorithm.bits;
    for (var j = 0; j < bits.length; ++j) {
      var methodName = algorithm.name +'_' + bits[j];
      methodNames.push(methodName);
      methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
    }
  }

  function Keccak(bits, padding, outputBits) {
    this.blocks = [];
    this.s = [];
    this.padding = padding;
    this.outputBits = outputBits;
    this.reset = true;
    this.block = 0;
    this.start = 0;
    this.blockCount = (1600 - (bits << 1)) >> 5;
    this.byteCount = this.blockCount << 2;
    this.outputBlocks = outputBits >> 5;
    this.extraBytes = (outputBits & 31) >> 3;

    for (var i = 0; i < 50; ++i) {
      this.s[i] = 0;
    }
  }

  Keccak.prototype.update = function (message) {
    var notString = typeof message !== 'string';
    if (notString && message.constructor === ArrayBuffer) {
      message = new Uint8Array(message);
    }
    var length = message.length, blocks = this.blocks, byteCount = this.byteCount,
      blockCount = this.blockCount, index = 0, s = this.s, i, code;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }
      if (notString) {
        for (i = this.start; index < length && i < byteCount; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < byteCount; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }
      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        f(s);
        this.reset = true;
      } else {
        this.start = i;
      }
    }
    return this;
  };

  Keccak.prototype.finalize = function () {
    var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
    blocks[i >> 2] |= this.padding[i & 3];
    if (this.lastByteIndex === this.byteCount) {
      blocks[0] = blocks[blockCount];
      for (i = 1; i < blockCount + 1; ++i) {
        blocks[i] = 0;
      }
    }
    blocks[blockCount - 1] |= 0x80000000;
    for (i = 0; i < blockCount; ++i) {
      s[i] ^= blocks[i];
    }
    f(s);
  };

  Keccak.prototype.toString = Keccak.prototype.hex = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var hex = '', block;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        block = s[i];
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
               HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
               HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
               HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
      }
      if (j % blockCount === 0) {
        f(s);
        i = 0;
      }
    }
    if (extraBytes) {
      block = s[i];
      if (extraBytes > 0) {
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
      }
      if (extraBytes > 1) {
        hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
      }
      if (extraBytes > 2) {
        hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
      }
    }
    return hex;
  };

  Keccak.prototype.arrayBuffer = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var bytes = this.outputBits >> 3;
    var buffer;
    if (extraBytes) {
      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
    } else {
      buffer = new ArrayBuffer(bytes);
    }
    var array = new Uint32Array(buffer);
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        array[j] = s[i];
      }
      if (j % blockCount === 0) {
        f(s);
      }
    }
    if (extraBytes) {
      array[i] = s[i];
      buffer = buffer.slice(0, bytes);
    }
    return buffer;
  };

  Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;

  Keccak.prototype.digest = Keccak.prototype.array = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var array = [], offset, block;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        offset = j << 2;
        block = s[i];
        array[offset] = block & 0xFF;
        array[offset + 1] = (block >> 8) & 0xFF;
        array[offset + 2] = (block >> 16) & 0xFF;
        array[offset + 3] = (block >> 24) & 0xFF;
      }
      if (j % blockCount === 0) {
        f(s);
      }
    }
    if (extraBytes) {
      offset = j << 2;
      block = s[i];
      if (extraBytes > 0) {
        array[offset] = block & 0xFF;
      }
      if (extraBytes > 1) {
        array[offset + 1] = (block >> 8) & 0xFF;
      }
      if (extraBytes > 2) {
        array[offset + 2] = (block >> 16) & 0xFF;
      }
    }
    return array;
  };

  var f = function (s) {
    var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9,
        b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17,
        b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33,
        b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
    for (n = 0; n < 48; n += 2) {
      c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
      c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
      c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
      c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
      c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
      c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
      c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
      c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
      c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
      c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

      h = c8 ^ ((c2 << 1) | (c3 >>> 31));
      l = c9 ^ ((c3 << 1) | (c2 >>> 31));
      s[0] ^= h;
      s[1] ^= l;
      s[10] ^= h;
      s[11] ^= l;
      s[20] ^= h;
      s[21] ^= l;
      s[30] ^= h;
      s[31] ^= l;
      s[40] ^= h;
      s[41] ^= l;
      h = c0 ^ ((c4 << 1) | (c5 >>> 31));
      l = c1 ^ ((c5 << 1) | (c4 >>> 31));
      s[2] ^= h;
      s[3] ^= l;
      s[12] ^= h;
      s[13] ^= l;
      s[22] ^= h;
      s[23] ^= l;
      s[32] ^= h;
      s[33] ^= l;
      s[42] ^= h;
      s[43] ^= l;
      h = c2 ^ ((c6 << 1) | (c7 >>> 31));
      l = c3 ^ ((c7 << 1) | (c6 >>> 31));
      s[4] ^= h;
      s[5] ^= l;
      s[14] ^= h;
      s[15] ^= l;
      s[24] ^= h;
      s[25] ^= l;
      s[34] ^= h;
      s[35] ^= l;
      s[44] ^= h;
      s[45] ^= l;
      h = c4 ^ ((c8 << 1) | (c9 >>> 31));
      l = c5 ^ ((c9 << 1) | (c8 >>> 31));
      s[6] ^= h;
      s[7] ^= l;
      s[16] ^= h;
      s[17] ^= l;
      s[26] ^= h;
      s[27] ^= l;
      s[36] ^= h;
      s[37] ^= l;
      s[46] ^= h;
      s[47] ^= l;
      h = c6 ^ ((c0 << 1) | (c1 >>> 31));
      l = c7 ^ ((c1 << 1) | (c0 >>> 31));
      s[8] ^= h;
      s[9] ^= l;
      s[18] ^= h;
      s[19] ^= l;
      s[28] ^= h;
      s[29] ^= l;
      s[38] ^= h;
      s[39] ^= l;
      s[48] ^= h;
      s[49] ^= l;

      b0 = s[0];
      b1 = s[1];
      b32 = (s[11] << 4) | (s[10] >>> 28);
      b33 = (s[10] << 4) | (s[11] >>> 28);
      b14 = (s[20] << 3) | (s[21] >>> 29);
      b15 = (s[21] << 3) | (s[20] >>> 29);
      b46 = (s[31] << 9) | (s[30] >>> 23);
      b47 = (s[30] << 9) | (s[31] >>> 23);
      b28 = (s[40] << 18) | (s[41] >>> 14);
      b29 = (s[41] << 18) | (s[40] >>> 14);
      b20 = (s[2] << 1) | (s[3] >>> 31);
      b21 = (s[3] << 1) | (s[2] >>> 31);
      b2 = (s[13] << 12) | (s[12] >>> 20);
      b3 = (s[12] << 12) | (s[13] >>> 20);
      b34 = (s[22] << 10) | (s[23] >>> 22);
      b35 = (s[23] << 10) | (s[22] >>> 22);
      b16 = (s[33] << 13) | (s[32] >>> 19);
      b17 = (s[32] << 13) | (s[33] >>> 19);
      b48 = (s[42] << 2) | (s[43] >>> 30);
      b49 = (s[43] << 2) | (s[42] >>> 30);
      b40 = (s[5] << 30) | (s[4] >>> 2);
      b41 = (s[4] << 30) | (s[5] >>> 2);
      b22 = (s[14] << 6) | (s[15] >>> 26);
      b23 = (s[15] << 6) | (s[14] >>> 26);
      b4 = (s[25] << 11) | (s[24] >>> 21);
      b5 = (s[24] << 11) | (s[25] >>> 21);
      b36 = (s[34] << 15) | (s[35] >>> 17);
      b37 = (s[35] << 15) | (s[34] >>> 17);
      b18 = (s[45] << 29) | (s[44] >>> 3);
      b19 = (s[44] << 29) | (s[45] >>> 3);
      b10 = (s[6] << 28) | (s[7] >>> 4);
      b11 = (s[7] << 28) | (s[6] >>> 4);
      b42 = (s[17] << 23) | (s[16] >>> 9);
      b43 = (s[16] << 23) | (s[17] >>> 9);
      b24 = (s[26] << 25) | (s[27] >>> 7);
      b25 = (s[27] << 25) | (s[26] >>> 7);
      b6 = (s[36] << 21) | (s[37] >>> 11);
      b7 = (s[37] << 21) | (s[36] >>> 11);
      b38 = (s[47] << 24) | (s[46] >>> 8);
      b39 = (s[46] << 24) | (s[47] >>> 8);
      b30 = (s[8] << 27) | (s[9] >>> 5);
      b31 = (s[9] << 27) | (s[8] >>> 5);
      b12 = (s[18] << 20) | (s[19] >>> 12);
      b13 = (s[19] << 20) | (s[18] >>> 12);
      b44 = (s[29] << 7) | (s[28] >>> 25);
      b45 = (s[28] << 7) | (s[29] >>> 25);
      b26 = (s[38] << 8) | (s[39] >>> 24);
      b27 = (s[39] << 8) | (s[38] >>> 24);
      b8 = (s[48] << 14) | (s[49] >>> 18);
      b9 = (s[49] << 14) | (s[48] >>> 18);

      s[0] = b0 ^ (~b2 & b4);
      s[1] = b1 ^ (~b3 & b5);
      s[10] = b10 ^ (~b12 & b14);
      s[11] = b11 ^ (~b13 & b15);
      s[20] = b20 ^ (~b22 & b24);
      s[21] = b21 ^ (~b23 & b25);
      s[30] = b30 ^ (~b32 & b34);
      s[31] = b31 ^ (~b33 & b35);
      s[40] = b40 ^ (~b42 & b44);
      s[41] = b41 ^ (~b43 & b45);
      s[2] = b2 ^ (~b4 & b6);
      s[3] = b3 ^ (~b5 & b7);
      s[12] = b12 ^ (~b14 & b16);
      s[13] = b13 ^ (~b15 & b17);
      s[22] = b22 ^ (~b24 & b26);
      s[23] = b23 ^ (~b25 & b27);
      s[32] = b32 ^ (~b34 & b36);
      s[33] = b33 ^ (~b35 & b37);
      s[42] = b42 ^ (~b44 & b46);
      s[43] = b43 ^ (~b45 & b47);
      s[4] = b4 ^ (~b6 & b8);
      s[5] = b5 ^ (~b7 & b9);
      s[14] = b14 ^ (~b16 & b18);
      s[15] = b15 ^ (~b17 & b19);
      s[24] = b24 ^ (~b26 & b28);
      s[25] = b25 ^ (~b27 & b29);
      s[34] = b34 ^ (~b36 & b38);
      s[35] = b35 ^ (~b37 & b39);
      s[44] = b44 ^ (~b46 & b48);
      s[45] = b45 ^ (~b47 & b49);
      s[6] = b6 ^ (~b8 & b0);
      s[7] = b7 ^ (~b9 & b1);
      s[16] = b16 ^ (~b18 & b10);
      s[17] = b17 ^ (~b19 & b11);
      s[26] = b26 ^ (~b28 & b20);
      s[27] = b27 ^ (~b29 & b21);
      s[36] = b36 ^ (~b38 & b30);
      s[37] = b37 ^ (~b39 & b31);
      s[46] = b46 ^ (~b48 & b40);
      s[47] = b47 ^ (~b49 & b41);
      s[8] = b8 ^ (~b0 & b2);
      s[9] = b9 ^ (~b1 & b3);
      s[18] = b18 ^ (~b10 & b12);
      s[19] = b19 ^ (~b11 & b13);
      s[28] = b28 ^ (~b20 & b22);
      s[29] = b29 ^ (~b21 & b23);
      s[38] = b38 ^ (~b30 & b32);
      s[39] = b39 ^ (~b31 & b33);
      s[48] = b48 ^ (~b40 & b42);
      s[49] = b49 ^ (~b41 & b43);

      s[0] ^= RC[n];
      s[1] ^= RC[n + 1];
    }
  };

  if (COMMON_JS) {
    module.exports = methods;
  } else {
    for (var i = 0; i < methodNames.length; ++i) {
      root[methodNames[i]] = methods[methodNames[i]];
    }
  }
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":2}]},{},[5])(5)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wdW55Y29kZS9wdW55Y29kZS5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbm9kZV9tb2R1bGVzL2V0aC1lbnMtbmFtZWhhc2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWRuYS11dHM0Ni1oeC9pZG5hLW1hcC5qcyIsIm5vZGVfbW9kdWxlcy9pZG5hLXV0czQ2LWh4L3V0czQ2LmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanMtc2hhMy9zcmMvc2hhMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNyaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2d0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcnZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKFxuICAgICAgdWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKVxuICAgICkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKiEgaHR0cHM6Ly9tdGhzLmJlL3B1bnljb2RlIHYxLjQuMSBieSBAbWF0aGlhcyAqL1xuOyhmdW5jdGlvbihyb290KSB7XG5cblx0LyoqIERldGVjdCBmcmVlIHZhcmlhYmxlcyAqL1xuXHR2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmXG5cdFx0IWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblx0dmFyIGZyZWVNb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJlxuXHRcdCFtb2R1bGUubm9kZVR5cGUgJiYgbW9kdWxlO1xuXHR2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsO1xuXHRpZiAoXG5cdFx0ZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHxcblx0XHRmcmVlR2xvYmFsLndpbmRvdyA9PT0gZnJlZUdsb2JhbCB8fFxuXHRcdGZyZWVHbG9iYWwuc2VsZiA9PT0gZnJlZUdsb2JhbFxuXHQpIHtcblx0XHRyb290ID0gZnJlZUdsb2JhbDtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgYHB1bnljb2RlYCBvYmplY3QuXG5cdCAqIEBuYW1lIHB1bnljb2RlXG5cdCAqIEB0eXBlIE9iamVjdFxuXHQgKi9cblx0dmFyIHB1bnljb2RlLFxuXG5cdC8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cblx0bWF4SW50ID0gMjE0NzQ4MzY0NywgLy8gYWthLiAweDdGRkZGRkZGIG9yIDJeMzEtMVxuXG5cdC8qKiBCb290c3RyaW5nIHBhcmFtZXRlcnMgKi9cblx0YmFzZSA9IDM2LFxuXHR0TWluID0gMSxcblx0dE1heCA9IDI2LFxuXHRza2V3ID0gMzgsXG5cdGRhbXAgPSA3MDAsXG5cdGluaXRpYWxCaWFzID0gNzIsXG5cdGluaXRpYWxOID0gMTI4LCAvLyAweDgwXG5cdGRlbGltaXRlciA9ICctJywgLy8gJ1xceDJEJ1xuXG5cdC8qKiBSZWd1bGFyIGV4cHJlc3Npb25zICovXG5cdHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vLFxuXHRyZWdleE5vbkFTQ0lJID0gL1teXFx4MjAtXFx4N0VdLywgLy8gdW5wcmludGFibGUgQVNDSUkgY2hhcnMgKyBub24tQVNDSUkgY2hhcnNcblx0cmVnZXhTZXBhcmF0b3JzID0gL1tcXHgyRVxcdTMwMDJcXHVGRjBFXFx1RkY2MV0vZywgLy8gUkZDIDM0OTAgc2VwYXJhdG9yc1xuXG5cdC8qKiBFcnJvciBtZXNzYWdlcyAqL1xuXHRlcnJvcnMgPSB7XG5cdFx0J292ZXJmbG93JzogJ092ZXJmbG93OiBpbnB1dCBuZWVkcyB3aWRlciBpbnRlZ2VycyB0byBwcm9jZXNzJyxcblx0XHQnbm90LWJhc2ljJzogJ0lsbGVnYWwgaW5wdXQgPj0gMHg4MCAobm90IGEgYmFzaWMgY29kZSBwb2ludCknLFxuXHRcdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG5cdH0sXG5cblx0LyoqIENvbnZlbmllbmNlIHNob3J0Y3V0cyAqL1xuXHRiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW4sXG5cdGZsb29yID0gTWF0aC5mbG9vcixcblx0c3RyaW5nRnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcblxuXHQvKiogVGVtcG9yYXJ5IHZhcmlhYmxlICovXG5cdGtleTtcblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGVycm9yIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBlcnJvciB0eXBlLlxuXHQgKiBAcmV0dXJucyB7RXJyb3J9IFRocm93cyBhIGBSYW5nZUVycm9yYCB3aXRoIHRoZSBhcHBsaWNhYmxlIGVycm9yIG1lc3NhZ2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvcih0eXBlKSB7XG5cdFx0dGhyb3cgbmV3IFJhbmdlRXJyb3IoZXJyb3JzW3R5cGVdKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgYEFycmF5I21hcGAgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5IGFycmF5XG5cdCAqIGl0ZW0uXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcChhcnJheSwgZm4pIHtcblx0XHR2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXHRcdHZhciByZXN1bHQgPSBbXTtcblx0XHR3aGlsZSAobGVuZ3RoLS0pIHtcblx0XHRcdHJlc3VsdFtsZW5ndGhdID0gZm4oYXJyYXlbbGVuZ3RoXSk7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHQvKipcblx0ICogQSBzaW1wbGUgYEFycmF5I21hcGAtbGlrZSB3cmFwcGVyIHRvIHdvcmsgd2l0aCBkb21haW4gbmFtZSBzdHJpbmdzIG9yIGVtYWlsXG5cdCAqIGFkZHJlc3Nlcy5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGRvbWFpbiBUaGUgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcy5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5XG5cdCAqIGNoYXJhY3Rlci5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBzdHJpbmcgb2YgY2hhcmFjdGVycyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2tcblx0ICogZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXBEb21haW4oc3RyaW5nLCBmbikge1xuXHRcdHZhciBwYXJ0cyA9IHN0cmluZy5zcGxpdCgnQCcpO1xuXHRcdHZhciByZXN1bHQgPSAnJztcblx0XHRpZiAocGFydHMubGVuZ3RoID4gMSkge1xuXHRcdFx0Ly8gSW4gZW1haWwgYWRkcmVzc2VzLCBvbmx5IHRoZSBkb21haW4gbmFtZSBzaG91bGQgYmUgcHVueWNvZGVkLiBMZWF2ZVxuXHRcdFx0Ly8gdGhlIGxvY2FsIHBhcnQgKGkuZS4gZXZlcnl0aGluZyB1cCB0byBgQGApIGludGFjdC5cblx0XHRcdHJlc3VsdCA9IHBhcnRzWzBdICsgJ0AnO1xuXHRcdFx0c3RyaW5nID0gcGFydHNbMV07XG5cdFx0fVxuXHRcdC8vIEF2b2lkIGBzcGxpdChyZWdleClgIGZvciBJRTggY29tcGF0aWJpbGl0eS4gU2VlICMxNy5cblx0XHRzdHJpbmcgPSBzdHJpbmcucmVwbGFjZShyZWdleFNlcGFyYXRvcnMsICdcXHgyRScpO1xuXHRcdHZhciBsYWJlbHMgPSBzdHJpbmcuc3BsaXQoJy4nKTtcblx0XHR2YXIgZW5jb2RlZCA9IG1hcChsYWJlbHMsIGZuKS5qb2luKCcuJyk7XG5cdFx0cmV0dXJuIHJlc3VsdCArIGVuY29kZWQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIHRoZSBudW1lcmljIGNvZGUgcG9pbnRzIG9mIGVhY2ggVW5pY29kZVxuXHQgKiBjaGFyYWN0ZXIgaW4gdGhlIHN0cmluZy4gV2hpbGUgSmF2YVNjcmlwdCB1c2VzIFVDUy0yIGludGVybmFsbHksXG5cdCAqIHRoaXMgZnVuY3Rpb24gd2lsbCBjb252ZXJ0IGEgcGFpciBvZiBzdXJyb2dhdGUgaGFsdmVzIChlYWNoIG9mIHdoaWNoXG5cdCAqIFVDUy0yIGV4cG9zZXMgYXMgc2VwYXJhdGUgY2hhcmFjdGVycykgaW50byBhIHNpbmdsZSBjb2RlIHBvaW50LFxuXHQgKiBtYXRjaGluZyBVVEYtMTYuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZW5jb2RlYFxuXHQgKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZGVjb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIFVuaWNvZGUgaW5wdXQgc3RyaW5nIChVQ1MtMikuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gVGhlIG5ldyBhcnJheSBvZiBjb2RlIHBvaW50cy5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJkZWNvZGUoc3RyaW5nKSB7XG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBjb3VudGVyID0gMCxcblx0XHQgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcblx0XHQgICAgdmFsdWUsXG5cdFx0ICAgIGV4dHJhO1xuXHRcdHdoaWxlIChjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHR2YWx1ZSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHRcdC8vIGhpZ2ggc3Vycm9nYXRlLCBhbmQgdGhlcmUgaXMgYSBuZXh0IGNoYXJhY3RlclxuXHRcdFx0XHRleHRyYSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRcdGlmICgoZXh0cmEgJiAweEZDMDApID09IDB4REMwMCkgeyAvLyBsb3cgc3Vycm9nYXRlXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2goKCh2YWx1ZSAmIDB4M0ZGKSA8PCAxMCkgKyAoZXh0cmEgJiAweDNGRikgKyAweDEwMDAwKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB1bm1hdGNoZWQgc3Vycm9nYXRlOyBvbmx5IGFwcGVuZCB0aGlzIGNvZGUgdW5pdCwgaW4gY2FzZSB0aGUgbmV4dFxuXHRcdFx0XHRcdC8vIGNvZGUgdW5pdCBpcyB0aGUgaGlnaCBzdXJyb2dhdGUgb2YgYSBzdXJyb2dhdGUgcGFpclxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0XHRjb3VudGVyLS07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgc3RyaW5nIGJhc2VkIG9uIGFuIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZGVjb2RlYFxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBlbmNvZGVcblx0ICogQHBhcmFtIHtBcnJheX0gY29kZVBvaW50cyBUaGUgYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIG5ldyBVbmljb2RlIHN0cmluZyAoVUNTLTIpLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmVuY29kZShhcnJheSkge1xuXHRcdHJldHVybiBtYXAoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHR2YXIgb3V0cHV0ID0gJyc7XG5cdFx0XHRpZiAodmFsdWUgPiAweEZGRkYpIHtcblx0XHRcdFx0dmFsdWUgLT0gMHgxMDAwMDtcblx0XHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMCk7XG5cdFx0XHRcdHZhbHVlID0gMHhEQzAwIHwgdmFsdWUgJiAweDNGRjtcblx0XHRcdH1cblx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUpO1xuXHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHR9KS5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGJhc2ljIGNvZGUgcG9pbnQgaW50byBhIGRpZ2l0L2ludGVnZXIuXG5cdCAqIEBzZWUgYGRpZ2l0VG9CYXNpYygpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gY29kZVBvaW50IFRoZSBiYXNpYyBudW1lcmljIGNvZGUgcG9pbnQgdmFsdWUuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludCAoZm9yIHVzZSBpblxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGluIHRoZSByYW5nZSBgMGAgdG8gYGJhc2UgLSAxYCwgb3IgYGJhc2VgIGlmXG5cdCAqIHRoZSBjb2RlIHBvaW50IGRvZXMgbm90IHJlcHJlc2VudCBhIHZhbHVlLlxuXHQgKi9cblx0ZnVuY3Rpb24gYmFzaWNUb0RpZ2l0KGNvZGVQb2ludCkge1xuXHRcdGlmIChjb2RlUG9pbnQgLSA0OCA8IDEwKSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gMjI7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA2NSA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gNjU7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA5NyA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gOTc7XG5cdFx0fVxuXHRcdHJldHVybiBiYXNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgZGlnaXQvaW50ZWdlciBpbnRvIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHNlZSBgYmFzaWNUb0RpZ2l0KClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBkaWdpdCBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBiYXNpYyBjb2RlIHBvaW50IHdob3NlIHZhbHVlICh3aGVuIHVzZWQgZm9yXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaXMgYGRpZ2l0YCwgd2hpY2ggbmVlZHMgdG8gYmUgaW4gdGhlIHJhbmdlXG5cdCAqIGAwYCB0byBgYmFzZSAtIDFgLiBJZiBgZmxhZ2AgaXMgbm9uLXplcm8sIHRoZSB1cHBlcmNhc2UgZm9ybSBpc1xuXHQgKiB1c2VkOyBlbHNlLCB0aGUgbG93ZXJjYXNlIGZvcm0gaXMgdXNlZC4gVGhlIGJlaGF2aW9yIGlzIHVuZGVmaW5lZFxuXHQgKiBpZiBgZmxhZ2AgaXMgbm9uLXplcm8gYW5kIGBkaWdpdGAgaGFzIG5vIHVwcGVyY2FzZSBmb3JtLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlnaXRUb0Jhc2ljKGRpZ2l0LCBmbGFnKSB7XG5cdFx0Ly8gIDAuLjI1IG1hcCB0byBBU0NJSSBhLi56IG9yIEEuLlpcblx0XHQvLyAyNi4uMzUgbWFwIHRvIEFTQ0lJIDAuLjlcblx0XHRyZXR1cm4gZGlnaXQgKyAyMiArIDc1ICogKGRpZ2l0IDwgMjYpIC0gKChmbGFnICE9IDApIDw8IDUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEJpYXMgYWRhcHRhdGlvbiBmdW5jdGlvbiBhcyBwZXIgc2VjdGlvbiAzLjQgb2YgUkZDIDM0OTIuXG5cdCAqIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDkyI3NlY3Rpb24tMy40XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGFwdChkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0XHR2YXIgayA9IDA7XG5cdFx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0XHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdFx0Zm9yICgvKiBubyBpbml0aWFsaXphdGlvbiAqLzsgZGVsdGEgPiBiYXNlTWludXNUTWluICogdE1heCA+PiAxOyBrICs9IGJhc2UpIHtcblx0XHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZsb29yKGsgKyAoYmFzZU1pbnVzVE1pbiArIDEpICogZGVsdGEgLyAoZGVsdGEgKyBza2V3KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVjb2RlKGlucHV0KSB7XG5cdFx0Ly8gRG9uJ3QgdXNlIFVDUy0yXG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aCxcblx0XHQgICAgb3V0LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgbiA9IGluaXRpYWxOLFxuXHRcdCAgICBiaWFzID0gaW5pdGlhbEJpYXMsXG5cdFx0ICAgIGJhc2ljLFxuXHRcdCAgICBqLFxuXHRcdCAgICBpbmRleCxcblx0XHQgICAgb2xkaSxcblx0XHQgICAgdyxcblx0XHQgICAgayxcblx0XHQgICAgZGlnaXQsXG5cdFx0ICAgIHQsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBiYXNlTWludXNUO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50czogbGV0IGBiYXNpY2AgYmUgdGhlIG51bWJlciBvZiBpbnB1dCBjb2RlXG5cdFx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0XHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRcdGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0XHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0XHRiYXNpYyA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGJhc2ljOyArK2opIHtcblx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0XHRlcnJvcignbm90LWJhc2ljJyk7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdFx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRcdGZvciAoaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHRcdC8vIERlY29kZSBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyIGludG8gYGRlbHRhYCxcblx0XHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdFx0Ly8gdmFsdWUgYXQgdGhlIGVuZCB0byBvYnRhaW4gYGRlbHRhYC5cblx0XHRcdGZvciAob2xkaSA9IGksIHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0ID49IGJhc2UgfHwgZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0XHR9XG5cblx0XHRcdG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHRcdC8vIGBpYCB3YXMgc3VwcG9zZWQgdG8gd3JhcCBhcm91bmQgZnJvbSBgb3V0YCB0byBgMGAsXG5cdFx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRcdGkgJT0gb3V0O1xuXG5cdFx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0XG5cdFx0XHRvdXRwdXQuc3BsaWNlKGkrKywgMCwgbik7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdWNzMmVuY29kZShvdXRwdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyAoZS5nLiBhIGRvbWFpbiBuYW1lIGxhYmVsKSB0byBhXG5cdCAqIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuY29kZShpbnB1dCkge1xuXHRcdHZhciBuLFxuXHRcdCAgICBkZWx0YSxcblx0XHQgICAgaGFuZGxlZENQQ291bnQsXG5cdFx0ICAgIGJhc2ljTGVuZ3RoLFxuXHRcdCAgICBiaWFzLFxuXHRcdCAgICBqLFxuXHRcdCAgICBtLFxuXHRcdCAgICBxLFxuXHRcdCAgICBrLFxuXHRcdCAgICB0LFxuXHRcdCAgICBjdXJyZW50VmFsdWUsXG5cdFx0ICAgIG91dHB1dCA9IFtdLFxuXHRcdCAgICAvKiogYGlucHV0TGVuZ3RoYCB3aWxsIGhvbGQgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyBpbiBgaW5wdXRgLiAqL1xuXHRcdCAgICBpbnB1dExlbmd0aCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50UGx1c09uZSxcblx0XHQgICAgYmFzZU1pbnVzVCxcblx0XHQgICAgcU1pbnVzVDtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIFVuaWNvZGVcblx0XHRpbnB1dCA9IHVjczJkZWNvZGUoaW5wdXQpO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIGxlbmd0aFxuXHRcdGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGVcblx0XHRuID0gaW5pdGlhbE47XG5cdFx0ZGVsdGEgPSAwO1xuXHRcdGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHNcblx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aCA9IG91dHB1dC5sZW5ndGg7XG5cblx0XHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0XHQvLyBgYmFzaWNMZW5ndGhgIGlzIHRoZSBudW1iZXIgb2YgYmFzaWMgY29kZSBwb2ludHMuXG5cblx0XHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyAtIGlmIGl0IGlzIG5vdCBlbXB0eSAtIHdpdGggYSBkZWxpbWl0ZXJcblx0XHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHRcdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHRcdC8vIEFsbCBub24tYmFzaWMgY29kZSBwb2ludHMgPCBuIGhhdmUgYmVlbiBoYW5kbGVkIGFscmVhZHkuIEZpbmQgdGhlIG5leHRcblx0XHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0XHRmb3IgKG0gPSBtYXhJbnQsIGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0XHRtID0gY3VycmVudFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluY3JlYXNlIGBkZWx0YWAgZW5vdWdoIHRvIGFkdmFuY2UgdGhlIGRlY29kZXIncyA8bixpPiBzdGF0ZSB0byA8bSwwPixcblx0XHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93XG5cdFx0XHRoYW5kbGVkQ1BDb3VudFBsdXNPbmUgPSBoYW5kbGVkQ1BDb3VudCArIDE7XG5cdFx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRcdG4gPSBtO1xuXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID09IG4pIHtcblx0XHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlclxuXHRcdFx0XHRcdGZvciAocSA9IGRlbHRhLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXHRcdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goXG5cdFx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRxID0gZmxvb3IocU1pbnVzVCAvIGJhc2VNaW51c1QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0XHRiaWFzID0gYWRhcHQoZGVsdGEsIGhhbmRsZWRDUENvdW50UGx1c09uZSwgaGFuZGxlZENQQ291bnQgPT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0XHQrK2hhbmRsZWRDUENvdW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCsrZGVsdGE7XG5cdFx0XHQrK247XG5cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dC5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzXG5cdCAqIHRvIFVuaWNvZGUuIE9ubHkgdGhlIFB1bnljb2RlZCBwYXJ0cyBvZiB0aGUgaW5wdXQgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS5cblx0ICogaXQgZG9lc24ndCBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgb24gYSBzdHJpbmcgdGhhdCBoYXMgYWxyZWFkeSBiZWVuXG5cdCAqIGNvbnZlcnRlZCB0byBVbmljb2RlLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZWQgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcyB0b1xuXHQgKiBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoaW5wdXQpIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleFB1bnljb2RlLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzIHRvXG5cdCAqIFB1bnljb2RlLiBPbmx5IHRoZSBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLFxuXHQgKiBpLmUuIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW5cblx0ICogQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG8gY29udmVydCwgYXMgYVxuXHQgKiBVbmljb2RlIHN0cmluZy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFB1bnljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBkb21haW4gbmFtZSBvclxuXHQgKiBlbWFpbCBhZGRyZXNzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShpbnB1dCkge1xuXHRcdHJldHVybiBtYXBEb21haW4oaW5wdXQsIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4Tm9uQVNDSUkudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5cdHB1bnljb2RlID0ge1xuXHRcdC8qKlxuXHRcdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBTdHJpbmdcblx0XHQgKi9cblx0XHQndmVyc2lvbic6ICcxLjQuMScsXG5cdFx0LyoqXG5cdFx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0XHQgKiByZXByZXNlbnRhdGlvbiAoVUNTLTIpIHRvIFVuaWNvZGUgY29kZSBwb2ludHMsIGFuZCBiYWNrLlxuXHRcdCAqIEBzZWUgPGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIE9iamVjdFxuXHRcdCAqL1xuXHRcdCd1Y3MyJzoge1xuXHRcdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0XHQnZW5jb2RlJzogdWNzMmVuY29kZVxuXHRcdH0sXG5cdFx0J2RlY29kZSc6IGRlY29kZSxcblx0XHQnZW5jb2RlJzogZW5jb2RlLFxuXHRcdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0XHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG5cdH07XG5cblx0LyoqIEV4cG9zZSBgcHVueWNvZGVgICovXG5cdC8vIFNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJuc1xuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XG5cdGlmIChcblx0XHR0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiZcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxuXHRcdGRlZmluZS5hbWRcblx0KSB7XG5cdFx0ZGVmaW5lKCdwdW55Y29kZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHB1bnljb2RlO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmIGZyZWVNb2R1bGUpIHtcblx0XHRpZiAobW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMpIHtcblx0XHRcdC8vIGluIE5vZGUuanMsIGlvLmpzLCBvciBSaW5nb0pTIHYwLjguMCtcblx0XHRcdGZyZWVNb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuXHRcdFx0Zm9yIChrZXkgaW4gcHVueWNvZGUpIHtcblx0XHRcdFx0cHVueWNvZGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAoZnJlZUV4cG9ydHNba2V5XSA9IHB1bnljb2RlW2tleV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHQvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXG5cdFx0cm9vdC5wdW55Y29kZSA9IHB1bnljb2RlO1xuXHR9XG5cbn0odGhpcykpO1xuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGN1c3RvbUluc3BlY3RTeW1ib2wgPVxuICAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLmZvciA9PT0gJ2Z1bmN0aW9uJylcbiAgICA/IFN5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJylcbiAgICA6IG51bGxcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgdmFyIHByb3RvID0geyBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihwcm90bywgVWludDhBcnJheS5wcm90b3R5cGUpXG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGFyciwgcHJvdG8pXG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIE9iamVjdC5zZXRQcm90b3R5cGVPZihidWYsIEJ1ZmZlci5wcm90b3R5cGUpXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbk9iamVjdC5zZXRQcm90b3R5cGVPZihCdWZmZXIucHJvdG90eXBlLCBVaW50OEFycmF5LnByb3RvdHlwZSlcbk9iamVjdC5zZXRQcm90b3R5cGVPZihCdWZmZXIsIFVpbnQ4QXJyYXkpXG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGJ1ZiwgQnVmZmVyLnByb3RvdHlwZSlcblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5pZiAoY3VzdG9tSW5zcGVjdFN5bWJvbCkge1xuICBCdWZmZXIucHJvdG90eXBlW2N1c3RvbUluc3BlY3RTeW1ib2xdID0gQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgW3ZhbF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSBoZXhTbGljZUxvb2t1cFRhYmxlW2J1ZltpXV1cbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKG5ld0J1ZiwgQnVmZmVyLnByb3RvdHlwZSlcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdib29sZWFuJykge1xuICAgIHZhbCA9IE51bWJlcih2YWwpXG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG5cbi8vIENyZWF0ZSBsb29rdXAgdGFibGUgZm9yIGB0b1N0cmluZygnaGV4JylgXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8yMTlcbnZhciBoZXhTbGljZUxvb2t1cFRhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFscGhhYmV0ID0gJzAxMjM0NTY3ODlhYmNkZWYnXG4gIHZhciB0YWJsZSA9IG5ldyBBcnJheSgyNTYpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7ICsraSkge1xuICAgIHZhciBpMTYgPSBpICogMTZcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDE2OyArK2opIHtcbiAgICAgIHRhYmxlW2kxNiArIGpdID0gYWxwaGFiZXRbaV0gKyBhbHBoYWJldFtqXVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFibGVcbn0pKClcbiIsInZhciBzaGEzID0gcmVxdWlyZSgnanMtc2hhMycpLmtlY2Nha18yNTZcbnZhciB1dHM0NiA9IHJlcXVpcmUoJ2lkbmEtdXRzNDYtaHgnKVxuXG5mdW5jdGlvbiBuYW1laGFzaCAoaW5wdXROYW1lKSB7XG4gIC8vIFJlamVjdCBlbXB0eSBuYW1lczpcbiAgdmFyIG5vZGUgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICBub2RlICs9ICcwMCdcbiAgfVxuXG4gIG5hbWUgPSBub3JtYWxpemUoaW5wdXROYW1lKVxuXG4gIGlmIChuYW1lKSB7XG4gICAgdmFyIGxhYmVscyA9IG5hbWUuc3BsaXQoJy4nKVxuXG4gICAgZm9yKHZhciBpID0gbGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgbGFiZWxTaGEgPSBzaGEzKGxhYmVsc1tpXSlcbiAgICAgIG5vZGUgPSBzaGEzKG5ldyBCdWZmZXIobm9kZSArIGxhYmVsU2hhLCAnaGV4JykpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuICcweCcgKyBub2RlXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lKSB7XG4gIHJldHVybiBuYW1lID8gdXRzNDYudG9Vbmljb2RlKG5hbWUsIHt1c2VTdGQzQVNDSUk6IHRydWUsIHRyYW5zaXRpb25hbDogZmFsc2V9KSA6IG5hbWVcbn1cblxuZXhwb3J0cy5oYXNoID0gbmFtZWhhc2hcbmV4cG9ydHMubm9ybWFsaXplID0gbm9ybWFsaXplXG4iLCIvKiBUaGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGZyb20gdGhlIFVuaWNvZGUgSUROQSB0YWJsZSwgdXNpbmdcbiAgIHRoZSBidWlsZC11bmljb2RlLXRhYmxlcy5weSBzY3JpcHQuIFBsZWFzZSBlZGl0IHRoYXRcbiAgIHNjcmlwdCBpbnN0ZWFkIG9mIHRoaXMgZmlsZS4gKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWN0b3J5KCk7IH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIHJvb3QudXRzNDZfbWFwID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcbnZhciBibG9ja3MgPSBbXG4gIG5ldyBVaW50MzJBcnJheShbMjE1NzI1MCwyMTU3MzE0LDIxNTczNzgsMjE1NzQ0MiwyMTU3NTA2LDIxNTc1NzAsMjE1NzYzNCwwLDIxNTc2OTgsMjE1Nzc2MiwyMTU3ODI2LDIxNTc4OTAsMjE1Nzk1NCwwLDIxNTgwMTgsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzkwNDEsNjI5MTQ1NiwyMTc5MDczLDYyOTE0NTYsMjE3OTEwNSw2MjkxNDU2LDIxNzkxMzcsNjI5MTQ1NiwyMTc5MTY5LDYyOTE0NTYsMjE3OTIwMSw2MjkxNDU2LDIxNzkyMzMsNjI5MTQ1NiwyMTc5MjY1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjRdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDIxMTM3MjksMjE5NzM0NSwyMTk3Mzc3LDIxMTM4MjUsMjE5NzQwOSwyMTk3NDQxLDIxMTM5MjEsMjE5NzQ3MywyMTE0MDE3LDIxOTc1MDUsMjE5NzUzNywyMTk3NTY5LDIxOTc2MDEsMjE5NzYzMywyMTk3NjY1XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzE0NjgwMDY0LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMTQ2ODAwNjQsMTQ2ODAwNjRdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTk2MDAxLDIxOTYwMzMsMjE5NjA2NSwyMTk2MDk3LDIxOTYxMjksMjE5NjE2MSwyMTk2MTkzLDIxOTYyMjUsMjE5NjI1NywyMTk2Mjg5LDIxOTYzMjEsMjE5NjM1MywyMTk2Mzg1LDIxOTY0MTcsMjE5NjQ0OSwyMTk2NDgxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1NiwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMDk3MjgxLDIxMDU5MjEsMjA5NzcyOSwyMTA2MDgxLDAsMjA5NzYwMSwyMTYyMzM3LDIxMDYwMTcsMjEzMzI4MSwyMDk3NTA1LDIxMDU4ODksMjA5NzE4NSwyMDk3Njk3LDIxMzU3NzcsMjA5NzYzMywyMDk3NDQxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3NzAyNSw2MjkxNDU2LDIxNzcwNTcsNjI5MTQ1NiwyMTc3MDg5LDYyOTE0NTYsMjE3NzEyMSw2MjkxNDU2LDIxNzcxNTMsNjI5MTQ1NiwyMTc3MTg1LDYyOTE0NTYsMjE3NzIxNyw2MjkxNDU2LDIxNzcyNDksNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTM0NDM1LDIxMzQ1MzEsMjEzNDYyNywyMTM0NzIzLDIxMzQ3MjMsMjEzNDgxOSwyMTM0ODE5LDIxMzQ5MTUsMjEzNDkxNSwyMTM1MDExLDIxMDU5ODcsMjEzNTEwNywyMTM1MjAzLDIxMzUyOTksMjEzMTU4NywyMTM1Mzk1XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCwwLDAsMCw2MjkxNDU2LDIxNjg2NzMsMjE2OTI0OSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNDc5MDYsMjE0Nzk3MCwyMTQ4MDM0LDIxNDgwOTgsMjE0ODE2MiwyMTQ4MjI2LDIxNDgyOTAsMjE0ODM1NCwyMTQ3OTA2LDIxNDc5NzAsMjE0ODAzNCwyMTQ4MDk4LDIxNDgxNjIsMjE0ODIyNiwyMTQ4MjkwLDIxNDgzNTRdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTI1MjE5LDIxMjUzMTUsMjE1MjgzNCwyMTUyODk4LDIxMjU0MTEsMjE1Mjk2MiwyMTUzMDI2LDIxMjU1MDYsMjEyNTUwNywyMTI1NjAzLDIxNTMwOTAsMjE1MzE1NCwyMTUzMjE4LDIxNTMyODIsMjE1MzM0NiwyMTA1MzQ4XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwMzM5Myw2MjkxNDU2LDIyMDM0MjUsNjI5MTQ1NiwyMjAzNDU3LDYyOTE0NTYsMjIwMzQ4OSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIyMDM1MjEsNjI5MTQ1NiwyMTgxMjgxLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1NiwyMTQ1NTM4LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzk0MjYsMjE2MDgzNCwyMTYwODk4LDIxNjA5NjIsMjEzNDI0MiwyMTYxMDI2LDIxNjEwOTAsMjE2MTE1NCwyMTYxMjE4LDIxNjEyODIsMjE2MTM0NiwyMTYxNDEwLDIxMzg2NTgsMjE2MTQ3NCwyMTYxNTM4LDIxMzQ3MjJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTE5OTM5LDIxMjQ5MzAsMjEyNTAyNiwyMTA2NjU4LDIxMjUyMTgsMjEyODk2MiwyMTI5MDU4LDIxMjkxNTQsMjEyOTI1MCwyMTI5MzQ2LDIxMjk0NDIsMjEwODg2NiwyMTA4NzcwLDIxNTA0NjYsMjE1MDUzMCwyMTUwNTk0XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwMTYwMSw2MjkxNDU2LDIyMDE2MzMsNjI5MTQ1NiwyMjAxNjY1LDYyOTE0NTYsMjIwMTY5Nyw2MjkxNDU2LDIyMDE3MjksNjI5MTQ1NiwyMjAxNzYxLDYyOTE0NTYsMjIwMTc5Myw2MjkxNDU2LDIyMDE4MjUsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTM1MzcsMjE5MzU2OSwyMTkzNjAxLDIxOTM2MzMsMjE5MzY2NSwyMTkzNjk3LDIxOTM3MjksMjE5Mzc2MSwyMTkzNzkzLDIxOTM4MjUsMjE5Mzg1NywyMTkzODg5LDIxOTM5MjEsMjE5Mzk1MywyMTkzOTg1LDIxOTQwMTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkwNTYxLDYyOTE0NTYsMjE5MDU5Myw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE5MDYyNSw2MjkxNDU2LDIxOTA2NTcsNjI5MTQ1NiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTU5MDUsMjIxNTkzNywyMjE1OTY5LDIyMTYwMDEsMjIxNjAzMywyMjE2MDY1LDIyMTYwOTcsMjIxNjEyOSwyMjE2MTYxLDIyMTYxOTMsMjIxNjIyNSwyMjE2MjU3LDIxMDU0NDEsMjIxNjI4OSwyMjE2MzIxLDIyMTYzNTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwxODg4NDEzMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkxMjMzLDIxOTEyNjUsMjE5MTI5NywyMTkxMzI5LDIxOTEzNjEsMjE5MTM5MywyMTkxNDI1LDIxMTczNzcsMjE5MTQ1NywyMTkxNDg5LDIxOTE1MjEsMjE5MTU1MywyMTkxNTg1LDIxOTE2MTcsMjE5MTY0OSwyMTE3OTUzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMjIyNywyMTMyMzIzLDIxMzI0MTksMjEzMjQxOSwyMTMyNTE1LDIxMzI1MTUsMjEzMjYxMSwyMTMyNzA3LDIxMzI3MDcsMjEzMjgwMywyMTMyODk5LDIxMzI4OTksMjEzMjk5NSwyMTMyOTk1LDIxMzMwOTEsMjEzMzE4N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTI0ODEsMjExMjU3NywyMDk4MTc3LDIwOTgzMDUsMjEwODMyMSwyMTA4Mjg5LDIxMDA4NjUsMjExMzE1MywyMTA4NDgxLDIxMTMzNDUsMjExMzQ0MSwxMDYwOTg4OSwxMDYxMDc4NSwxMDYwOTkyMSwxMDYxMDgxNywyMjIyMjQxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTk5NjksMjE1NzEyMSwyMTU3NDQxLDIxNTc1MDUsMjE1Nzg4OSwyMTU3OTUzLDIyMjAwMDEsMjE1ODQ2NSwyMTU4NTI5LDEwNTc1NjE3LDIxNTY5OTQsMjE1NzA1OCwyMTI5OTIzLDIxMzAwMTksMjE1NzEyMiwyMTU3MTg2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg1MjQ5LDYyOTE0NTYsMjE4NTI4MSw2MjkxNDU2LDIxODUzMTMsNjI5MTQ1NiwyMTg1MzQ1LDYyOTE0NTYsMjE4NTM3Nyw2MjkxNDU2LDIxODU0MDksNjI5MTQ1NiwyMTg1NDQxLDYyOTE0NTYsMjE4NTQ3Myw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODMzNjEsNjI5MTQ1NiwyMTgzMzkzLDYyOTE0NTYsMjE4MzQyNSw2MjkxNDU2LDIxODM0NTcsNjI5MTQ1NiwyMTgzNDg5LDYyOTE0NTYsMjE4MzUyMSw2MjkxNDU2LDIxODM1NTMsNjI5MTQ1NiwyMTgzNTg1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkyMTYxLDIxOTIxOTMsMjE5MjIyNSwyMTkyMjU3LDIxOTIyODksMjE5MjMyMSwyMTkyMzUzLDIxOTIzODUsMjE5MjQxNywyMTkyNDQ5LDIxOTI0ODEsMjE5MjUxMywyMTkyNTQ1LDIxOTI1NzcsMjE5MjYwOSwyMTkyNjQxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMjAwMSwyMjEyMDMzLDIyMTIwNjUsMjIxMjA5NywyMjEyMTI5LDIyMTIxNjEsMjIxMjE5MywyMjEyMjI1LDIyMTIyNTcsMjIxMjI4OSwyMjEyMzIxLDIyMTIzNTMsMjIxMjM4NSwyMjEyNDE3LDIyMTI0NDksMjIwNzI2NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDk4MjUsMjI0OTg1NywyMjQ5ODg5LDIyNDk5MjEsMjI0OTk1NCwyMjUwMDE4LDIyNTAwODIsMjI1MDE0NSwyMjUwMTc3LDIyNTAyMDksMjI1MDI0MSwyMjUwMjc0LDIyNTAzMzcsMjI1MDM3MCwyMjUwNDMzLDIyNTA0NjVdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE0NzkwNSwyMTQ3OTY5LDIxNDgwMzMsMjE0ODA5NywyMTQ4MTYxLDIxNDgyMjUsMjE0ODI4OSwyMTQ4MzUzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA0ODU4NTcsNjI5MTQ1NiwyMTk3MjE3LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4MDM1MywyMTgwMzg1LDIxNDQwMzMsMjE4MDQxNywyMTgwNDQ5LDIxODA0ODEsMjE4MDUxMywwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTI0ODEsMjExMjU3NywyMDk4MTc3LDIwOTgzMDUsMjEwODMyMSwyMTA4Mjg5LDIxMDA4NjUsMjExMzE1MywyMTA4NDgxLDIxMTMzNDUsMjExMzQ0MSwxMDYxMDIwOSwxMDYxMDQ2NSwxMDYxMDI0MSwxMDYxMDc1MywxMDYwOTg1N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIyMzg0MiwyMjIzOTA2LDIyMjM5NzAsMjIyNDAzNCwyMjI0MDk4LDIyMjQxNjIsMjIyNDIyNiwyMjI0MjkwLDIyMjQzNTQsMjIyNDQxOCwyMjI0NDgyLDIyMjQ1NDYsMjIyNDYxMCwyMjI0Njc0LDIyMjQ3MzgsMjIyNDgwMl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMTg5MjM2NTAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwxODkyMzcxNCwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMjYxNzksMjEyNTUzOCwyMTI2Mjc1LDIxMjYzNzEsMjEyNjQ2NywyMTI1NjM0LDIxMjY1NjMsMjEwNTYwMywyMTA1NjA0LDIxMjUzNDYsMjEyNjY1OSwyMTI2NzU1LDIxMjY4NTEsMjA5ODE3OSwyMDk4MTgxLDIwOTgxODJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjI3NDI2LDIyMjc0OTAsMjIyNzU1NCwyMjI3NjE4LDAsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE5MjM1MywyMjQwNjQyLDIyNDA2NDIsMjI0MDcwNSwyMjQwNzM3LDIyNDA3MzcsMjI0MDc2OSwyMjQwODAyLDIyNDA4NjYsMjI0MDkyOSwyMjQwOTYxLDIyNDA5OTMsMjI0MTAyNSwyMjQxMDU3LDIyNDEwODksMjI0MTEyMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjE3MDg4MSwyMTcwOTEzLDIxNzA5NDUsNjI5MTQ1NiwyMTcwOTc3LDYyOTE0NTYsMjE3MTAwOSwyMTcxMDQxLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNzEwNzMsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzIyMjYsMjEzMjUxNCwyMTYzNTg2LDIxMzI2MTAsMjE2MDM4NiwyMTMzMDkwLDIxMzMxODYsMjE2MDQ1MCwyMTYwNTE0LDIxNjA1NzgsMjEzMzU3MCwyMTA2MTc4LDIxNjA2NDIsMjEzMzg1OCwyMTYwNzA2LDIxNjA3NzBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDEwNTMyMTYyLDEwNTMyMjI2LDEwNTMyMjkwLDEwNTMyMzU0LDEwNTMyNDE4LDEwNTMyNDgyLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjA5ODIwOSwyMTA4MzUzLDIxMDgxOTMsMjEwODQ4MSwyMTcwMjQxLDIxMTE3MTMsMjEwNTQ3MywyMTA1NTY5LDIxMDU2MDEsMjExMjI4OSwyMTEyNDgxLDIwOTgzMDUsMjEwODMyMSwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDkxMjEsMjIwOTE1MywyMjA5MTg1LDIyMDkyMTcsMjIwOTI0OSwyMjA5MjgxLDIyMDkzMTMsMjIwOTM0NSwyMjA5Mzc3LDIyMDk0MDksMjIwOTQ0MSwyMjA5NDczLDIyMDcyNjUsMjIwOTUwNSwyMjA5NTM3LDIyMDk1NjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg5MDI1LDYyOTE0NTYsMjE4OTA1Nyw2MjkxNDU2LDIxODkwODksNjI5MTQ1NiwyMTg5MTIxLDYyOTE0NTYsMjE4OTE1Myw2MjkxNDU2LDIxODkxODUsNjI5MTQ1NiwyMTg5MjE3LDYyOTE0NTYsMjE4OTI0OSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3MzgyNSwyMTUzNDczLDIxNzM4NTcsMjE3Mzg4OSwyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTczNzYxLDIxNzQwMTcsMjE3NDA0OSwyMTc0MDgxLDIxNzQxMTMsMjE3NDE0NSwyMTc0MTc3LDIxNDkwNTcsMjIzMzA1N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTY1NzY0LDIxNDAwMDRdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE1MTA1LDYyOTE0NTYsMjIxNTEzNyw2MjkxNDU2LDYyOTE0NTYsMjIxNTE2OSwyMjE1MjAxLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIyMTUyMzMsMjIxNTI2NSwyMjE1Mjk3LDIyMTUzMjksMjIxNTM2MSwyMjE1MzkzXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDUwNTA5MSwxMDUwNTE4NywxMDUwNTI4MywxMDUwNTM3OSwxMDUwNTQ3NSwxMDUwNTU3MSwxMDUwNTY2NywxMDUwNTc2MywxMDUwNTg1OSwxMDUwNTk1NSwxMDUwNjA1MSwxMDUwNjE0NywxMDUwNjI0MywxMDUwNjMzOSwxMDUwNjQzNSwxMDUwNjUzMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjk3MzAsMjIyOTc5NCwyMjI5ODU4LDIyMjk5MjIsMjIyOTk4NiwyMjMwMDUwLDIyMzAxMTQsMjIzMDE3OCwyMjMwMjQyLDIyMzAzMDYsMjIzMDM3MCwyMjMwNDM0LDIyMzA0OTgsMjIzMDU2MiwyMjMwNjI2LDIyMzA2OTBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTA1NTA1LDIwOTgyNDEsMjEwODM1MywyMTA4NDE3LDIxMDU4MjUsMCwyMTAwODk3LDIxMTE5MDUsMjEwNTQ3MywyMTA1NTY5LDIxMDU2MDEsMjExMjI4OSwyMTA4MTkzLDIxMTI0ODEsMjExMjU3NywyMDk4MTc3XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwxMDUwMjExNSwxMDUwMjE3OCwxMDUwMjIxMSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkwMzA1LDYyOTE0NTYsMjE5MDMzNyw2MjkxNDU2LDIxOTAzNjksNjI5MTQ1NiwyMTkwNDAxLDYyOTE0NTYsMjE5MDQzMyw2MjkxNDU2LDIxOTA0NjUsNjI5MTQ1NiwyMTkwNDk3LDYyOTE0NTYsMjE5MDUyOSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3Mzc5MywyMTczOTg1LDIxNzQwMTcsNjI5MTQ1NiwyMTczNzYxLDIxNzM2OTcsNjI5MTQ1NiwyMTc0Njg5LDYyOTE0NTYsMjE3NDAxNywyMTc0NzIxLDYyOTE0NTYsNjI5MTQ1NiwyMTc0NzUzLDIxNzQ3ODUsMjE3NDgxN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMDk5NTIxLDIwOTkxMDUsMjEyMDcwNSwyMDk4MzY5LDIxMjA4MDEsMjEwMzM2MSwyMDk3OTg1LDIwOTg0MzMsMjEyMTM3NywyMTIxNDczLDIwOTkxNjksMjA5OTg3MywyMDk4NDAxLDIwOTkzOTMsMjE1MjYwOSwyMTAwMDMzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMjg5OCwyMTYzODQyLDIxNjM5MDYsMjEzMzI4MiwyMTMyMDM0LDIxMzE5MzgsMjEzNzQxMCwyMTMyODAyLDIxMzI3MDYsMjE2NDg2NiwyMTMzMjgyLDIxNjA1NzgsMjE2NTE4NiwyMTY1MTg2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzEwNTAwMDAzLDEwNTAwMDk5LDEwNTAwMTk1LDEwNTAwMjkxLDEwNTAwMzg3LDEwNTAwNDgzLDEwNTAwNTc5LDEwNTAwNjc1LDEwNTAwNzcxLDEwNTAwODY3LDEwNTAwOTYzLDEwNTAxMDU5LDEwNTAxMTU1LDEwNTAxMjUxLDEwNTAxMzQ3LDEwNTAxNDQzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE2MzQ1OCwyMTMwOTc4LDIxMzEwNzQsMjEzMTI2NiwyMTMxMzYyLDIxNjM1MjIsMjE2MDEzMCwyMTMyMDY2LDIxMzEwMTAsMjEzMTEwNiwyMTA2MDE4LDIxMzE2MTgsMjEzMTI5OCwyMTMyMDM0LDIxMzE5MzgsMjEzNzQxMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTI5NjEsMjExNjk5MywyMjEyOTkzLDIyMTMwMjUsMjIxMzA1NywyMjEzMDg5LDIyMTMxMjEsMjIxMzE1MywyMjEzMTg1LDIyMTMyMTcsMjIxMzI0OSwyMjA5NjMzLDIyMTMyODEsMjIxMzMxMywyMjEzMzQ1LDIyMTMzNzddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTM3MjksMjExMzgyNSwyMTEzOTIxLDIxMTQwMTcsMjExNDExMywyMTE0MjA5LDIxMTQzMDUsMjExNDQwMSwyMTE0NDk3LDIxMTQ1OTMsMjExNDY4OSwyMTE0Nzg1LDIxMTQ4ODEsMjExNDk3NywyMTE1MDczLDIxMTUxNjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjM4MTc3LDIyMzgyMDksMjIzODI0MSwyMjM4MjczLDIyMzgzMDUsMjIzODMzNywyMjM4MzM3LDIyMTc1MzcsMjIzODM2OSwyMjM4NDAxLDIyMzg0MzMsMjIzODQ2NSwyMjE1NjQ5LDIyMzg0OTcsMjIzODUyOSwyMjM4NTYxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MSwyMTA4MzUzLDIxMDg0MTcsMjEwNTgyNSwyMTExNzEzLDIxMDA4OTcsMjExMTkwNV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1NiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsNjI5MTQ1NiwyMTQ1MDI2LDAsNjI5MTQ1NiwyMTQ1MDkwLDAsNjI5MTQ1Niw2MjkxNDU2LDAsMCwyMzA2ODY3MiwwLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjA5OTIzMywyMTIyMDE3LDIyMDA2NzMsMjA5ODExMywyMTIxNTM3LDIxMDMyMDEsMjIwMDcwNSwyMTA0MDMzLDIxMjE4NTcsMjEyMTk1MywyMTIyNDAxLDIwOTk2NDksMjA5OTk2OSwyMTIzMDA5LDIxMDAxMjksMjEwMDI4OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODc2ODEsMjE4NzcxMywyMTg3NzQ1LDIxODc3NzcsMjE4NzgwOSwyMTg3ODQxLDIxODc4NzMsMjE4NzkwNSwyMTg3OTM3LDIxODc5NjksMjE4ODAwMSwyMTg4MDMzLDIxODgwNjUsMjE4ODA5NywyMTg4MTI5LDIxODgxNjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDEwNTU0NDk4LDEwNTU0NTYyLDEwNTU0NjI2LDEwNTU0NjkwLDEwNTU0NzU0LDEwNTU0ODE4LDEwNTU0ODgyLDEwNTU0OTQ2LDEwNTU1MDEwLDEwNTU1MDc0LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMzUxNzAsMjIzNTIzNCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4MTE1Myw2MjkxNDU2LDIxODg4OTcsNjI5MTQ1Niw2MjkxNDU2LDIxODg5MjksNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjExMTkwNSwyMTAwODY1LDIxODg5NjEsMjE4ODk5M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDA4MzMsMjEwMDg5NywwLDAsMjEwMTU2OSwyMTAxNjk3LDIxMDE4MjUsMjEwMTk1MywyMTAyMDgxLDIxMDIyMDksMTA1NzU2MTcsMjE4NzA0MSwxMDUwMjE3NywxMDQ4OTYwMSwxMDQ4OTY5NywyMTEyMjg5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwyMTcyODMzLDYyOTE0NTYsMjE3Mjg2NSwyMTcyODk3LDIxNzI5MjksMjE3Mjk2MSw2MjkxNDU2LDIxNzI5OTMsNjI5MTQ1NiwyMTczMDI1LDYyOTE0NTYsMjE3MzA1Nyw2MjkxNDU2LDIxNzMwODksNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDIzMDY4NjcyLDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwyMTkwNzIxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg0OTkzLDYyOTE0NTYsMjE4NTAyNSw2MjkxNDU2LDIxODUwNTcsNjI5MTQ1NiwyMTg1MDg5LDYyOTE0NTYsMjE4NTEyMSw2MjkxNDU2LDIxODUxNTMsNjI5MTQ1NiwyMTg1MTg1LDYyOTE0NTYsMjE4NTIxNyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjExNTI2NSwyMTE1MzYxLDIxMTU0NTcsMjExNTU1MywyMTE1NjQ5LDIxMTU3NDUsMjExNTg0MSwyMTE1OTM3LDIxMTYwMzMsMjExNjEyOSwyMTE2MjI1LDIxMTYzMjEsMjE1MDY1OCwyMTUwNzIyLDIyMDAyMjUsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNjgzMjEsNjI5MTQ1NiwyMTY4MzUzLDYyOTE0NTYsMjE2ODM4NSw2MjkxNDU2LDIxNjg0MTcsNjI5MTQ1NiwyMTY4NDQ5LDYyOTE0NTYsMjE2ODQ4MSw2MjkxNDU2LDIxNjg1MTMsNjI5MTQ1NiwyMTY4NTQ1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxODY2MjUsMCwwLDYyOTE0NTYsNjI5MTQ1NiwyMTg2NjU3LDIxODY2ODksMjE4NjcyMSwyMTczNTA1LDAsMTA0OTYwNjcsMTA0OTYxNjMsMTA0OTYyNTldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTc4Nzg1LDYyOTE0NTYsMjE3ODgxNyw2MjkxNDU2LDIxNzg4NDksNjI5MTQ1NiwyMTc4ODgxLDYyOTE0NTYsMjE3ODkxMyw2MjkxNDU2LDIxNzg5NDUsNjI5MTQ1NiwyMTc4OTc3LDYyOTE0NTYsMjE3OTAwOSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTcxNTIsMCwwLDAsMjA5NzE1MiwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDIxOTc4NTcsMjE5Nzg4OSwyMTk3OTIxLDIxOTc5NTMsMjE5Nzk4NSwyMTk4MDE3LDAsMCwyMTk4MDQ5LDIxOTgwODEsMjE5ODExMywyMTk4MTQ1LDIxOTgxNzcsMjE5ODIwOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIwOTgyMDksMjE2NzI5NywyMTExMTM3LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTcxMzkzLDYyOTE0NTYsMjE3MTQyNSw2MjkxNDU2LDIxNzE0NTcsNjI5MTQ1NiwyMTcxNDg5LDYyOTE0NTYsMjE3MTUyMSw2MjkxNDU2LDIxNzE1NTMsNjI5MTQ1NiwyMTcxNTg1LDYyOTE0NTYsMjE3MTYxNyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwNjc1MywyMjA2Nzg1LDIxOTU0NTcsMjIwNjgxNywyMjA2ODQ5LDIyMDY4ODEsMjIwNjkxMywyMTk3MTUzLDIxOTcxNTMsMjIwNjk0NSwyMTE3ODU3LDIyMDY5NzcsMjIwNzAwOSwyMjA3MDQxLDIyMDcwNzMsMjIwNzEwNV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMCwwLDAsMjMwNjg2NzIsMCwwLDAsMCwyMTQ0ODM0LDIxNDQ4OTgsMCwyMTQ0OTYyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODE5MywyMTEyNDgxLDIxMTI1NzcsMjA5ODE3NywyMDk4MzA1LDIxMDgzMjEsMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwwLDIxMDU1MDUsMjA5ODI0MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwyMjAyMDQ5LDYyOTE0NTYsMjIwMjA4MSw2MjkxNDU2LDIyMDIxMTMsNjI5MTQ1NiwyMjAyMTQ1LDYyOTE0NTYsMjIwMjE3Nyw2MjkxNDU2LDIyMDIyMDksNjI5MTQ1NiwyMjAyMjQxLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDUwMTE1NSwxMDUwMTI1MSwxMDUwMTM0NywxMDUwMTQ0MywxMDUwMTUzOSwxMDUwMTYzNSwxMDUwMTczMSwxMDUwMTgyNywxMDUwMTkyMywxMDUwMjAxOSwyMTQxNzMxLDIxMDU1MDUsMjA5ODE3NywyMTU1NTg2LDIxNjY1MzAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDIwODEsMjEwMjIwOSwyMTAwODMzLDIxMDA3MzcsMjA5ODMzNywyMTAxNDQxLDIxMDE1NjksMjEwMTY5NywyMTAxODI1LDIxMDE5NTMsMjEwMjA4MSwyMTAyMjA5LDIxMDA4MzMsMjEwMDczNywyMDk4MzM3LDIxMDE0NDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTQ2ODgyLDIxNDY5NDYsMjE0NzAxMCwyMTQ3MDc0LDIxNDcxMzgsMjE0NzIwMiwyMTQ3MjY2LDIxNDczMzAsMjE0Njg4MiwyMTQ2OTQ2LDIxNDcwMTAsMjE0NzA3NCwyMTQ3MTM4LDIxNDcyMDIsMjE0NzI2NiwyMTQ3MzMwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDUwMjMwNywxMDUwMjQwMywxMDUwMjQ5OSwxMDUwMjU5NSwxMDUwMjY5MSwxMDUwMjc4NywxMDUwMjg4MywxMDUwMjk3OSwxMDUwMzA3NSwxMDUwMzE3MSwxMDUwMzI2NywxMDUwMzM2MywxMDUwMzQ1OSwxMDUwMzU1NSwxMDUwMzY1MSwxMDUwMzc0N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzk5MzcsMjE3OTk2OSwyMTgwMDAxLDIxODAwMzMsMjE1NjU0NSwyMTgwMDY1LDIxNTY1NzcsMjE4MDA5NywyMTgwMTI5LDIxODAxNjEsMjE4MDE5MywyMTgwMjI1LDIxODAyNTcsMjE4MDI4OSwyMTU2NzM3LDIxODAzMjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDAsMCw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjI3NjgyLDIyMjc3NDYsMjIyNzgxMCwyMjI3ODc0LDIyMjc5MzgsMjIyODAwMiwyMjI4MDY2LDIyMjgxMzAsMjIyODE5NCwyMjI4MjU4LDIyMjgzMjIsMjIyODM4NiwyMjI4NDUwLDIyMjg1MTQsMjIyODU3OCwyMjI4NjQyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwNTYwMSwyMTY5MTIxLDIxMDgxOTMsMjE3MDA0OSwyMTgxMDI1LDIxODEwNTcsMjExMjQ4MSwyMTA4MzIxLDIxMDgyODksMjE4MTA4OSwyMTcwNDk3LDIxMDA4NjUsMjE4MTEyMSwyMTczNjAxLDIxNzM2MzMsMjE3MzY2NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxODA2NDEsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1NiwwLDYyOTE0NTYsMCwwLDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3ODI3Myw2MjkxNDU2LDIxNzgzMDUsNjI5MTQ1NiwyMTc4MzM3LDYyOTE0NTYsMjE3ODM2OSw2MjkxNDU2LDIxNzg0MDEsNjI5MTQ1NiwyMTc4NDMzLDYyOTE0NTYsMjE3ODQ2NSw2MjkxNDU2LDIxNzg0OTcsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIzNzM3NywyMjM3NDA5LDIyMzYyMjUsMjIzNzQ0MSwyMjM3NDczLDIyMTc0NDEsMjIxNTUyMSwyMjE1NTUzLDIyMTc0NzMsMjIzNzUwNSwyMjM3NTM3LDIyMDk2OTcsMjIzNzU2OSwyMjE1NTg1LDIyMzc2MDEsMjIzNzYzM10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjE5ODUsMjE2NTYwMSwyMTY1NjAxLDIxNjU2NjUsMjE2NTY2NSwyMjIyMDE3LDIyMjIwMTcsMjE2NTcyOSwyMTY1NzI5LDIxNTg5MTMsMjE1ODkxMywyMTU4OTEzLDIxNTg5MTMsMjA5NzI4MSwyMDk3MjgxLDIxMDU5MjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNDk2MzQsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzY4OTcsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIxNzY5MjksNjI5MTQ1NiwyMTc2OTYxLDYyOTE0NTYsMjE3Njk5Myw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3MjY0MSw2MjkxNDU2LDIxNzI2NzMsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTcyNzA1LDIxNzI3MzcsNjI5MTQ1NiwyMTcyNzY5LDIxNzI4MDEsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTkxNzMsMjEwNDE5NiwyMTIxNjY3LDIwOTkzOTUsMjEyMTc2MywyMTUyMjU4LDIxNTIzMjIsMjA5ODk0NiwyMTUyMzg2LDIxMjE4NTksMjEyMTk1NSwyMDk5MzMzLDIxMjIwNTEsMjEwNDMyNCwyMDk5NDkzLDIxMjIxNDddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTQ1Nzk0LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNDU4NTgsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDYyOTE0NTYsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjEwNTkyMSwyMDk3NzI5LDAsMjA5NzM3NywwLDAsMjEwNjAxNywwLDIwOTc1MDUsMjEwNTg4OSwyMDk3MTg1LDIwOTc2OTcsMjEzNTc3NywyMDk3NjMzLDIwOTc0NDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIzOTA3NCwyMjM5MTM4LDIyMzkyMDEsMjIzOTIzMywyMjM5MjY1LDIyMzkyOTcsMjIzOTMyOSwyMjM5MzYxLDAsMjIzOTM5MywyMjM5NDI1LDIyMzk0MjUsMjIzOTQ1OCwyMjM5NTIxLDIyMzk1NTMsMjIwOTU2OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzE0NjgwMDY0LDIwOTgyMDksMjExMTEzNywyMTA1NTA1LDIwOTgyNDEsMjEwODM1MywyMTA4NDE3LDIxMDU4MjUsMjExMTcxMywyMTAwODk3LDIxMTE5MDUsMjEwNTQ3MywyMTA1NTY5LDIxMDU2MDEsMjExMjI4OSwyMTA4MTkzXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODMyMSwyMTA4Mjg5LDIxMTMxNTMsMjA5ODIwOSwyMTgwODk3LDIxODA5MjksMjE4MDk2MSwyMTExMTM3LDIwOTgyNDEsMjEwODM1MywyMTcwMjQxLDIxNzAyNzMsMjE4MDk5MywyMTA1ODI1LDYyOTE0NTYsMjEwNTQ3M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNDYxMTQsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTA1OTIxLDIxMDU5MjEsMjEwNTkyMSwyMjIyMDQ5LDIyMjIwNDksMjEzMDk3NywyMTMwOTc3LDIxMzA5NzcsMjEzMDk3NywyMTYwMDY1LDIxNjAwNjUsMjE2MDA2NSwyMTYwMDY1LDIwOTc3MjksMjA5NzcyOSwyMDk3NzI5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxODE0NSwyMjE0Nzg1LDIyMDc5MzcsMjIxODE3NywyMjE4MjA5LDIxOTI5OTMsMjIxMDExMywyMjEyNzY5LDIyMTgyNDEsMjIxODI3MywyMjE2MTI5LDIyMTgzMDUsMjIxNjE2MSwyMjE4MzM3LDIyMTgzNjksMjIxODQwMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDIxNTY1NDYsMjE1NjYxMCwyMTU2Njc0LDIxNTY3MzgsMjE1NjgwMiwwLDAsMCwwLDAsMjE1Njg2NiwyMzA2ODY3MiwyMTU2OTMwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMzQwOSwyMjEzNDQxLDIyMTM0NzMsMjIxMzUwNSwyMjEzNTM3LDIyMTM1NjksMjIxMzYwMSwyMjEzNjMzLDIyMTM2NjUsMjE5NTY4MSwyMjEzNjk3LDIyMTM3MjksMjIxMzc2MSwyMjEzNzkzLDIyMTM4MjUsMjIxMzg1N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDAwMzMsMjA5OTIzMywyMTIyMDE3LDIyMDA2NzMsMjA5ODExMywyMTIxNTM3LDIxMDMyMDEsMjIwMDcwNSwyMTA0MDMzLDIxMjE4NTcsMjEyMTk1MywyMTIyNDAxLDIwOTk2NDksMjA5OTk2OSwyMTIzMDA5LDIxMDAxMjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwMTg1Nyw2MjkxNDU2LDIyMDE4ODksNjI5MTQ1NiwyMjAxOTIxLDYyOTE0NTYsMjIwMTk1Myw2MjkxNDU2LDIyMDE5ODUsNjI5MTQ1NiwyMjAyMDE3LDYyOTE0NTYsMjE3NjE5MywyMTc2MjU3LDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4ODE5MywyMTg4MjI1LDIxODgyNTcsMjE4ODI4OSwyMTg4MzIxLDIxODgzNTMsMjE4ODM4NSwyMTg4NDE3LDIxODg0NDksMjE4ODQ4MSwyMTg4NTEzLDIxODg1NDUsMjE4ODU3NywyMTg4NjA5LDIxODg2NDEsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzEwNTU0NTI5LDIyMjEwODksMCwxMDUwMjExMywxMDU2MjAxNywxMDUzNzkyMSwxMDUzODA0OSwyMjIxMTIxLDIyMjExNTMsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTM4ODksMjIxMzkyMSwyMjEzOTUzLDIyMTM5ODUsMjIxNDAxNywyMjE0MDQ5LDIyMTQwODEsMjE5NDE3NywyMjE0MTEzLDIyMTQxNDUsMjIxNDE3NywyMjE0MjA5LDIyMTQyNDEsMjIxNDI3MywyMjE0MzA1LDIyMTQzMzddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTY2OTc4LDIxNjcwNDIsMjA5OTE2OSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE4MDU0NSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzEwNTE4OTE1LDEwNTE5MDExLDEwNTE5MTA3LDEwNTE5MjAzLDIxNjIyNDIsMjE2MjMwNiwyMTU5NTU0LDIxNjIzNzAsMjE1OTM2MiwyMTU5NjE4LDIxMDU5MjIsMjE2MjQzNCwyMTU5NzQ2LDIxNjI0OTgsMjE1OTgxMCwyMTU5ODc0XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE2MTczMCwyMTYxNzk0LDIxMzU1ODYsMjE2MTg1OCwyMTYxOTIyLDIxMzcxODYsMjEzMTgxMCwyMTYwMjkwLDIxMzUxNzAsMjE2MTk4NiwyMTM3OTU0LDIxNjIwNTAsMjE2MjExNCwyMTYyMTc4LDEwNTE4NzIzLDEwNTE4ODE5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA1MDY2MjcsMTA1MDY3MjMsMTA1MDY4MTksMTA1MDY5MTUsMTA1MDcwMTEsMTA1MDcxMDcsMTA1MDcyMDMsMTA1MDcyOTksMTA1MDczOTUsMTA1MDc0OTEsMTA1MDc1ODcsMTA1MDc2ODMsMTA1MDc3NzksMTA1MDc4NzUsMTA1MDc5NzEsMTA1MDgwNjddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTc1ODczLDIxNzU5MDUsMjE3NTkzNywyMTc1OTY5LDIxNzYwMDEsMjE3NjAzMywyMTc2MDY1LDIxNzYwOTcsMjE3NjEyOSwyMTc2MTYxLDIxNzYxOTMsMjE3NjIyNSwyMTc2MjU3LDIxNzYyODksMjE3NjMyMSwyMTc2MzUzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE0MDAwNiwyMTQwMTk4LDIxNDAzOTAsMjE0MDU4MiwyMTQwNzc0LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODE5MywyMTEyNDgxLDIxMTI1NzcsMjA5ODE3NywyMDk4MzA1LDIxMDgzMjEsMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCwyMTQ1MTU0LDIxNDUyMTgsMjE0NTI4Miw2MjkxNDU2LDAsMjE0NTM0NiwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCwxMDUzMTQ1OCwxMDQ5NTM5NSwyMTQ4NTQ1LDIxNDMyMDEsMjE3MzQ3MywyMTQ4ODY1LDIxNzM1MDUsMCwyMTczNTM3LDAsMjE3MzU2OSwyMTQ5MTIxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA1MzcyODIsMTA0OTU2ODMsMjE0ODczOCwyMTQ4ODAyLDIxNDg4NjYsMCw2MjkxNDU2LDIxNDg5MzAsMjE4NjU5MywyMTczNDczLDIxNDg3MzcsMjE0ODg2NSwyMTQ4ODAyLDEwNDk1Nzc5LDEwNDk1ODc1LDEwNDk1OTcxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxNTQyNSwyMjE1NDU3LDIyMTU0ODksMjIxNTUyMSwyMjE1NTUzLDIyMTU1ODUsMjIxNTYxNywyMjE1NjQ5LDIyMTU2ODEsMjIxNTcxMywyMjE1NzQ1LDIyMTU3NzcsMjE5MjAzMywyMjE1ODA5LDIyMTU4NDEsMjIxNTg3M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDIwNDksMjI0MjA4MSwyMjQyMTEzLDIyNDIxNDUsMjI0MjE3NywyMjQyMjA5LDIyNDIyNDEsMjI0MjI3MywyMjE1OTM3LDIyNDIzMDUsMjI0MjMzOCwyMjQyNDAxLDIyNDI0MzMsMjI0MjQ2NSwyMjQyNDk3LDIyMTYwMDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDU1NDUyOSwyMjIxMDg5LDAsMCwxMDU2MjAxNywxMDUwMjExMywxMDUzODA0OSwxMDUzNzkyMSwyMjIxMTg1LDEwNDg5NjAxLDEwNDg5Njk3LDEwNjA5ODg5LDEwNjA5OTIxLDIxNDE3MjksMjE0MTc5MywxMDYxMDI3M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNDE5MjMsMjE0MjAxOSwyMTQyMTE1LDIxNDIyMTEsMjE0MjMwNywyMTQyNDAzLDIxNDI0OTksMjE0MjU5NSwyMTQyNjkxLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDIyMjExODUsMjIyMTIxNywxMDYwOTg1NywxMDYwOTg1NywxMDQ4OTYwMSwxMDQ4OTY5NywxMDYwOTg4OSwxMDYwOTkyMSwyMTQxNzI5LDIxNDE3OTMsMjIyMTM0NSwyMjIxMzc3LDIyMjE0MDksMjIyMTQ0MSwyMTg3MTA1XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMTg5MjM5NzAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgzMTA1LDYyOTE0NTYsMjE4MzEzNyw2MjkxNDU2LDIxODMxNjksNjI5MTQ1NiwyMTgzMjAxLDYyOTE0NTYsMjE4MzIzMyw2MjkxNDU2LDIxODMyNjUsNjI5MTQ1NiwyMTgzMjk3LDYyOTE0NTYsMjE4MzMyOSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzNDQzNCwyMTM0ODE4LDIwOTc2NjYsMjA5NzE4NiwyMDk3NDc0LDIwOTc2OTgsMjEwNTk4NiwyMTMxNTg2LDIxMzI0NTAsMjEzMTg3NCwyMTMxNzc4LDIxMzU5NzAsMjEzNTc3OCwyMTYxNjAyLDIxMzYxNjIsMjE2MTY2Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMzY4NjUsMjIzNjg5NywyMjM2OTMwLDIyMzY5OTMsMjIzNzAyNSwyMjM1NjgxLDIyMzcwNTgsMjIzNzEyMSwyMjM3MTUzLDIyMzcxODUsMjIzNzIxNywyMjE3MjgxLDIyMzcyNTAsMjE5MTIzMywyMjM3MzEzLDIyMzczNDVdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkwMDQ5LDYyOTE0NTYsMjE5MDA4MSw2MjkxNDU2LDIxOTAxMTMsNjI5MTQ1NiwyMTkwMTQ1LDYyOTE0NTYsMjE5MDE3Nyw2MjkxNDU2LDIxOTAyMDksNjI5MTQ1NiwyMTkwMjQxLDYyOTE0NTYsMjE5MDI3Myw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwMTkyMiwyMTAyMDUwLDIxMDIxNzgsMjEwMjMwNiwxMDQ5ODc1NSwxMDQ5ODg1MSwxMDQ5ODk0NywxMDQ5OTA0MywxMDQ5OTEzOSwxMDQ5OTIzNSwxMDQ5OTMzMSwxMDQ5OTQyNywxMDQ5OTUyMywxMDQ4OTYwNCwxMDQ4OTczMiwxMDQ4OTg2MF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNjY5MTQsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgxNjAxLDIxNzA1NjEsMjE4MTYzMywyMTgxNjY1LDIxNzA3NTMsMjE4MTY5NywyMTcyODk3LDIxNzA4ODEsMjE4MTcyOSwyMTcwOTEzLDIxNzI5MjksMjExMzQ0MSwyMTgxNzYxLDIxODE3OTMsMjE3MTAwOSwyMTczNzYxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwyMTA1OTIxLDIwOTc3MjksMjEwNjA4MSwwLDIwOTc2MDEsMjE2MjMzNywyMTA2MDE3LDIxMzMyODEsMjA5NzUwNSwwLDIwOTcxODUsMjA5NzY5NywyMTM1Nzc3LDIwOTc2MzMsMjA5NzQ0MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDgwMDEsMjI0ODAzMywyMjQ4MDY2LDIyNDgxMzAsMjI0ODE5MywyMjQ4MjI2LDIyNDgyODksMjI0ODMyMiwyMjQ4Mzg1LDIyNDg0MTcsMjIxNjY3MywyMjQ4NDUwLDIyNDg1MTQsMjI0ODU3NywyMjQ4NjEwLDIyNDg2NzNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE2OTcyOSw2MjkxNDU2LDIxNjk3NjEsNjI5MTQ1NiwyMTY5NzkzLDYyOTE0NTYsMjE2OTgyNSw2MjkxNDU2LDIxNjk4NTcsMjE2OTg4OSw2MjkxNDU2LDIxNjk5MjEsNjI5MTQ1NiwyMTQzMzI5LDYyOTE0NTYsMjA5ODMwNV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNjIxNzgsMjE2MzIwMiwyMTYzMjY2LDIxMzUxNzAsMjEzNjIyNiwyMTYxOTg2LDIxMzc5NTQsMjE1OTQyNiwyMTU5NDkwLDIxNjMzMzAsMjE1OTU1NCwyMTYzMzk0LDIxNTk2ODIsMjEzOTUyMiwyMTM2NDUwLDIxNTk3NDZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTczOTUzLDIxNzM5ODUsMCwyMTc0MDE3LDIxNzQwNDksMjE3NDA4MSwyMTc0MTEzLDIxNzQxNDUsMjE3NDE3NywyMTQ5MDU3LDIxNzQyMDksMjE3NDI0MSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDQyNzExNjksNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE3NDI3M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsNjI5MTQ1NiwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxOTA3ODUsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg5NzkzLDYyOTE0NTYsMjE4OTgyNSw2MjkxNDU2LDIxODk4NTcsNjI5MTQ1NiwyMTg5ODg5LDYyOTE0NTYsMjE4OTkyMSw2MjkxNDU2LDIxODk5NTMsNjI5MTQ1NiwyMTg5OTg1LDYyOTE0NTYsMjE5MDAxNyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwNTYwMSwyMTEyMjg5LDIxMDgxOTMsMjExMjQ4MSwyMTEyNTc3LDAsMjA5ODMwNSwyMTA4MzIxLDIxMDgyODksMjEwMDg2NSwyMTEzMTUzLDIxMDg0ODEsMjExMzM0NSwwLDIwOTgyMDksMjExMTEzN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzIxMjksNjI5MTQ1NiwyMTcyMTYxLDYyOTE0NTYsMjE3MjE5Myw2MjkxNDU2LDIxNzIyMjUsNjI5MTQ1NiwyMTcyMjU3LDYyOTE0NTYsMjE3MjI4OSw2MjkxNDU2LDIxNzIzMjEsNjI5MTQ1NiwyMTcyMzUzLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE0NzUzLDYyOTE0NTYsMjIxNDc4NSw2MjkxNDU2LDYyOTE0NTYsMjIxNDgxNywyMjE0ODQ5LDIyMTQ4ODEsMjIxNDkxMywyMjE0OTQ1LDIyMTQ5NzcsMjIxNTAwOSwyMjE1MDQxLDIyMTUwNzMsMjE5NDQwMSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDYxMDMwNSwxMDYxMDMzNywxMDU3NTYxNywyMjIxNzYxLDEwNjEwNDAxLDEwNjEwNDMzLDEwNTAyMTc3LDAsMTA2MTA0NjUsMTA2MTA0OTcsMTA2MTA1MjksMTA2MTA1NjEsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMjMwNjg2NzIsMCwwLDAsMCwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxODcxMDUsMjE4NzEzNyw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTk5MzkzLDIxOTk0MjUsMjE5OTQ1NywyMTk5NDg5LDIxOTk1MjEsMjE5OTU1MywyMTk5NTg1LDIxOTk2MTcsMjE5OTY0OSwyMTk5NjgxLDIxOTk3MTMsMjE5OTc0NSwyMTk5Nzc3LDIxOTk4MDksMjE5OTg0MSwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxNzI0OSwyMjE3MjgxLDIyMTczMTMsMjIxNzM0NSwyMjE3Mzc3LDIyMTc0MDksMjIxNzQ0MSwyMjE3NDczLDIyMTU2MTcsMjIxNzUwNSwyMjE3NTM3LDIyMTc1NjksMjIxNDc1MywyMjE3NjAxLDIyMTc2MzMsMjIxNzY2NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzAyNzMsMjE3MDMwNSw2MjkxNDU2LDIxNzAzMzcsMjE3MDM2OSw2MjkxNDU2LDIxNzA0MDEsMjE3MDQzMywyMTcwNDY1LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNzA0OTcsMjE3MDUyOSw2MjkxNDU2LDIxNzA1NjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg4NjczLDYyOTE0NTYsMjE4ODcwNSwyMTg4NzM3LDIxODg3NjksNjI5MTQ1Niw2MjkxNDU2LDIxODg4MDEsNjI5MTQ1NiwyMTg4ODMzLDYyOTE0NTYsMjE4ODg2NSw2MjkxNDU2LDIxODA5MjksMjE4MTUwNSwyMTgwODk3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA0ODk5ODgsMTA0OTAxMTYsMTA0OTAyNDQsMTA0OTAzNzIsMTA0OTA1MDAsMTA0OTA2MjgsMTA0OTA3NTYsMTA0OTA4ODQsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNDczOTMsMjE0NzQ1NywyMTQ3NTIxLDIxNDc1ODUsMjE0NzY0OSwyMTQ3NzEzLDIxNDc3NzcsMjE0Nzg0MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjQxMTUzLDIyNDExODUsMjI0MTIxNywyMjE1ODA5LDIyNDEyNTAsMjI0MTMxMywyMjQxMzQ1LDIyNDEzNzcsMjIxNzkyMSwyMjQxMzc3LDIyNDE0MDksMjIxNTg3MywyMjQxNDQxLDIyNDE0NzMsMjI0MTUwNSwyMjQxNTM3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjIwNDE3LDIyMjA0MTcsMjIyMDQ0OSwyMjIwNDQ5LDIyMjA0ODEsMjIyMDQ4MSwyMjIwNTEzLDIyMjA1MTMsMjIyMDU0NSwyMjIwNTQ1LDIyMjA1NzcsMjIyMDU3NywyMjIwNjA5LDIyMjA2MDksMjIyMDY0MSwyMjIwNjQxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTQ0MDAyLDAsNjI5MTQ1Niw2MjkxNDU2LDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNjcxMDUsMjE2NzEzNywyMTY3MTY5LDIxNjcyMDEsMjE2NzIzMywyMTY3MjY1LDIxNjcyOTcsMjE2NzMyOSwyMTY3MzYxLDIxNjczOTMsMjE2NzQyNSwyMTY3NDU3LDIxNjc0ODksMjE2NzUyMSwyMTY3NTUzLDIxNjc1ODVdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDU3NTUyMSwyMDk4MjA5LDIxMTExMzcsMjEwNTUwNSwyMDk4MjQxLDIxMDgzNTMsMjEwODQxNywyMTA1ODI1LDIxMTE3MTMsMjEwMDg5NywyMTExOTA1LDIxMDU0NzMsMjEwNTU2OSwyMTA1NjAxLDIxMTIyODksMjEwODE5M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMzQxNDYsMjIzNDIxMCwyMjM0Mjc0LDIyMzQzMzgsMjIzNDQwMiwyMjM0NDY2LDIyMzQ1MzAsMjIzNDU5NCwyMjM0NjU4LDIyMzQ3MjIsMjIzNDc4NiwyMjM0ODUwLDIyMzQ5MTQsMjIzNDk3OCwyMjM1MDQyLDIyMzUxMDZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDAsMCwwLDAsMCwwLDIxODA1NzcsMCwwLDAsMCwwLDIxODA2MDksMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MSwyMTA4MzUzLDIxMDg0MTcsMjEwNTgyNSwyMTExNzEzLDIxMDA4OTcsMjExMTkwNSwyMTA1NDczLDIxMDU1NjksMjEwNTYwMSwyMTEyMjg5LDIxMDgxOTMsMjExMjQ4MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjI0MjUyOSwyMjQyNTYxLDIyNDI1OTMsMjI0MjYyNSwyMjQyNjU3LDIyNDI2ODksMjI0MjcyMSwyMjQyNzUzLDIyMDc5MzcsMjIxODE3NywyMjQyNzg1LDIyNDI4MTcsMjI0Mjg0OSwyMjQyODgyLDIyNDI5NDUsMjI0Mjk3N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTgwNDksMjEwNTM0NSwyMTE4MjQxLDIxMDU0NDEsMjExODQzMywyMTE4NTI5LDIxMTg2MjUsMjExODcyMSwyMTE4ODE3LDIyMDAyNTcsMjIwMDI4OSwyMTkxODA5LDIyMDAzMjEsMjIwMDM1MywyMjAwMzg1LDIyMDA0MTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4NTUwNSw2MjkxNDU2LDIxODU1MzcsNjI5MTQ1NiwyMTg1NTY5LDYyOTE0NTYsMjE4NTYwMSw2MjkxNDU2LDIxODU2MzMsNjI5MTQ1NiwyMTg1NjY1LDYyOTE0NTYsMjE4NTY5Nyw2MjkxNDU2LDIxODU3MjksNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMzE5NzAsMjIzMjAzNCwyMjMyMDk4LDIyMzIxNjIsMjIzMjIyNiwyMjMyMjkwLDIyMzIzNTQsMjIzMjQxOCwyMjMyNDgyLDIyMzI1NDYsMjIzMjYxMCwyMjMyNjc0LDIyMzI3MzgsMjIzMjgwMiwyMjMyODY2LDIyMzI5MzBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE4NjI1LDIyNDY0MDIsMjI0NjQ2NiwyMjQ2NTMwLDIyNDY1OTQsMjI0NjY1NywyMjQ2Njg5LDIyNDY2ODksMjIxODY1NywyMjE5NjgxLDIyNDY3MjEsMjI0Njc1MywyMjQ2Nzg1LDIyNDY4MTgsMjI0Njg4MSwyMjA4NDgxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE5NzAyNSwyMTk3MDU3LDIxOTcwODksMjE5NzEyMSwyMTk3MTUzLDIxOTcxODUsMCwwLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTkxMzcsMjIxNjk2MSwyMjE5MTY5LDIyMTkyMDEsMjIxOTIzMywyMjE5MjY1LDIyMTkyOTcsMjIxNzAyNSwyMjE1MDQxLDIyMTkzMjksMjIxNzA1NywyMjE5MzYxLDIyMTcwODksMjIxOTM5MywyMTk3MTUzLDIyMTk0MjZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTgzMDUsMjEwODMyMSwyMTA4Mjg5LDIxMDA4NjUsMjExMzE1MywyMTA4NDgxLDIxMTMzNDUsMjExMzQ0MSwyMDk4MjA5LDIxMTExMzcsMjEwNTUwNSwyMDk4MjQxLDIxMDgzNTMsMjEwODQxNywyMTA1ODI1LDIxMTE3MTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjQzNTIyLDIyNDM1ODUsMjI0MzYxNywyMjQzNjQ5LDIyNDM2ODEsMjIxMDExMywyMjQzNzEzLDIyNDM3NDYsMjI0MzgxMCwyMjQzODc0LDIyNDM5MzcsMjI0Mzk3MCwyMjQ0MDMzLDIyNDQwNjUsMjI0NDA5NywyMjQ0MTI5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3ODAxNyw2MjkxNDU2LDIxNzgwNDksNjI5MTQ1NiwyMTc4MDgxLDYyOTE0NTYsMjE3ODExMyw2MjkxNDU2LDIxNzgxNDUsNjI5MTQ1NiwyMTc4MTc3LDYyOTE0NTYsMjE3ODIwOSw2MjkxNDU2LDIxNzgyNDEsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzEwNTUzODU4LDIxNjUzMTQsMTA1MTg3MjIsNjI5MTQ1NiwxMDUxODgxOCwwLDEwNTE4OTE0LDIxMzA2OTAsMTA1MTkwMTAsMjEzMDc4NiwxMDUxOTEwNiwyMTMwODgyLDEwNTE5MjAyLDIxNjUzNzgsMTA1NTQwNTAsMjE2NTUwNl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwyMTM1NDkxLDIxMzU1ODcsMjEzNTY4MywyMTM1Nzc5LDIxMzU4NzUsMjEzNTk3MSwyMTM1OTcxLDIxMzYwNjcsMjEzNjE2MywyMTM2MjU5LDIxMzYzNTUsMjEzNjM1NSwyMTM2NDUxLDIxMzY1NDddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjAwMzMsMjIyMDAzMywyMjIwMDY1LDIyMjAwNjUsMjIyMDA2NSwyMjIwMDY1LDIyMjAwOTcsMjIyMDA5NywyMjIwMDk3LDIyMjAwOTcsMjIyMDEyOSwyMjIwMTI5LDIyMjAxMjksMjIyMDEyOSwyMjIwMTYxLDIyMjAxNjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwyMzA2ODY3MiwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwMDg5NywyMTAwODk4LDIxMDA4OTksMjE1MDAxOCwyMTAwODY1LDIxMDA4NjYsMjEwMDg2NywyMTAwODY4LDIxNTAwODIsMjEwODQ4MSwyMTA5ODU4LDIxMDk4NTksMjEwNTU2OSwyMTA1NTA1LDIwOTgyNDEsMjEwNTYwMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTcyMTcsMjA5NzUwNSwyMDk3NTA1LDIwOTc1MDUsMjA5NzUwNSwyMTY1NTcwLDIxNjU1NzAsMjE2NTYzNCwyMTY1NjM0LDIxNjU2OTgsMjE2NTY5OCwyMDk3ODU4LDIwOTc4NTgsMCwwLDIwOTcxNTJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDUwMzg0MywxMDUwMzkzOSwxMDUwNDAzNSwxMDUwNDEzMSwxMDUwNDIyNywxMDUwNDMyMywxMDUwNDQxOSwxMDUwNDUxNSwxMDUwNDYxMSwxMDUwNDcwNywxMDUwNDgwMywxMDUwNDg5OSwxMDUwNDk5NSwxMDQ5MTE0MCwxMDQ5MTI2OCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3MzY5NywyMTczNzI5LDIxNDg4MDEsMjE3Mzc2MSwyMTQzOTY5LDIxNzM3OTMsMjE3MzgyNSwyMTUzNDczLDIxNzM4NTcsMjE3Mzg4OSwyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTczNzYxLDIxNzQwMTcsMjE3NDA0OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTM0MTQ1LDIwOTcxNTMsMjEzNDI0MSwyMTA1OTUzLDIxMzI3MDUsMjEzMDk3NywyMTYwMDY1LDIxMzEyOTcsMjE2MjA0OSwyMTMzMDg5LDIxNjA1NzcsMjEzMzg1NywyMjM1Mjk3LDIyMjA3NjksMjIzNTMyOSwyMjM1MzYxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjIyNDAxLDIyMjI0MzMsMjIyMjQ2NSwxMDUzMTM5NCwyMjIyNDk3LDIyMjI1MjksMjIyMjU2MSwwLDIyMjI1OTMsMjIyMjYyNSwyMjIyNjU3LDIyMjI2ODksMjIyMjcyMSwyMjIyNzUzLDIyMjI3ODUsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODQ0ODEsNjI5MTQ1NiwyMTg0NTEzLDYyOTE0NTYsMjE4NDU0NSw2MjkxNDU2LDIxODQ1NzcsNjI5MTQ1NiwyMTg0NjA5LDYyOTE0NTYsMjE4NDY0MSw2MjkxNDU2LDIxODQ2NzMsNjI5MTQ1NiwyMTg0NzA1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwNTU3MCwyMTU2MDM0LDIxMjY5NDcsMjE1NjA5OCwyMTUzNjY2LDIxMjcwNDMsMjEyNzEzOSwyMTU2MTYyLDAsMjEyNzIzNSwyMTU2MjI2LDIxNTYyOTAsMjE1NjM1NCwyMTU2NDE4LDIxMjczMzEsMjEyNzQyN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTU5MDUsMjIwNzA0MSwyMTUzMTg1LDIyNDE1NjksMjI0MTYwMSwyMjQxNjMzLDIyNDE2NjUsMjI0MTY5NywyMjQxNzMwLDIyNDE3OTMsMjI0MTgyNSwyMjQxODU3LDIyNDE4ODksMjI0MTkyMSwyMjQxOTU0LDIyNDIwMTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjAzNzc3LDYyOTE0NTYsMjIwMzgwOSw2MjkxNDU2LDIyMDM4NDEsNjI5MTQ1NiwyMjAzODczLDYyOTE0NTYsMjIwMzkwNSw2MjkxNDU2LDIxNzMxMjEsMjE4MDk5MywyMTgxMjQ5LDIyMDM5MzcsMjE4MTMxMywwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE2ODU3Nyw2MjkxNDU2LDIxNjg2MDksNjI5MTQ1NiwyMTY4NjQxLDYyOTE0NTYsMjE2ODY3Myw2MjkxNDU2LDIxNjg3MDUsNjI5MTQ1NiwyMTY4NzM3LDYyOTE0NTYsMjE2ODc2OSw2MjkxNDU2LDIxNjg4MDEsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjEwMTEzLDIxOTU1MjEsMjIxMDE0NSwyMjEwMTc3LDIyMTAyMDksMjIxMDI0MSwyMjEwMjczLDIyMTAzMDUsMjIxMDMzNywyMjEwMzY5LDIyMTA0MDEsMjIxMDQzMywyMjEwNDY1LDIyMTA0OTcsMjIxMDUyOSwyMjEwNTYxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjg3MDYsMjIyODc3MCwyMjI4ODM0LDIyMjg4OTgsMjIyODk2MiwyMjI5MDI2LDIyMjkwOTAsMjIyOTE1NCwyMjI5MjE4LDIyMjkyODIsMjIyOTM0NiwyMjI5NDEwLDIyMjk0NzQsMjIyOTUzOCwyMjI5NjAyLDIyMjk2NjZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMzA4OSwyMTMzMjgxLDIxMzMyODEsMjEzMzI4MSwyMTMzMjgxLDIxNjA1NzcsMjE2MDU3NywyMTYwNTc3LDIxNjA1NzcsMjA5NzQ0MSwyMDk3NDQxLDIwOTc0NDEsMjA5NzQ0MSwyMTMzODU3LDIxMzM4NTcsMjEzMzg1N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3MzgyNSwyMTUzNDczLDIxNzM4NTcsMjE3Mzg4OSwyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTc0MDE3LDIxNzQwMTcsMjE3NDA0OSwyMTc0MDgxLDIxNzQxMTMsMjE3NDE0NSwyMTc0MTc3LDIxNDkwNTcsMjIzMzA4OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzg1MjksNjI5MTQ1NiwyMTc4NTYxLDYyOTE0NTYsMjE3ODU5Myw2MjkxNDU2LDIxNzg2MjUsNjI5MTQ1NiwyMTc4NjU3LDYyOTE0NTYsMjE3ODY4OSw2MjkxNDU2LDIxNzg3MjEsNjI5MTQ1NiwyMTc4NzUzLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjIxMDI1LDIyMjEwMjUsMjIyMTA1NywyMjIxMDU3LDIxNTkzMjksMjE1OTMyOSwyMTU5MzI5LDIxNTkzMjksMjA5NzIxNywyMDk3MjE3LDIxNTg5MTQsMjE1ODkxNCwyMTU4OTc4LDIxNTg5NzgsMjE1OTA0MiwyMTU5MDQyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwODE2MSwyMjA4MTkzLDIyMDgyMjUsMjIwODI1NywyMTk0NDMzLDIyMDgyODksMjIwODMyMSwyMjA4MzUzLDIyMDgzODUsMjIwODQxNywyMjA4NDQ5LDIyMDg0ODEsMjIwODUxMywyMjA4NTQ1LDIyMDg1NzcsMjIwODYwOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNjkyMTcsNjI5MTQ1NiwyMTY5MjQ5LDYyOTE0NTYsMjE2OTI4MSw2MjkxNDU2LDIxNjkzMTMsNjI5MTQ1NiwyMTY5MzQ1LDYyOTE0NTYsMjE2OTM3Nyw2MjkxNDU2LDIxNjk0MDksNjI5MTQ1NiwyMTY5NDQxLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMzE4NywyMTMzMjgzLDIxMzMyODMsMjEzMzM3OSwyMTMzNDc1LDIxMzM1NzEsMjEzMzY2NywyMTMzNjY3LDIxMzM3NjMsMjEzMzg1OSwyMTMzOTU1LDIxMzQwNTEsMjEzNDE0NywyMTM0MTQ3LDIxMzQyNDMsMjEzNDMzOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTc2OTcsMjExNDExMywyMTE0MjA5LDIxOTc3MjksMjE5Nzc2MSwyMTE0MzA1LDIxOTc3OTMsMjExNDQwMSwyMTE0NDk3LDIxOTc4MjUsMjExNDU5MywyMTE0Njg5LDIxMTQ3ODUsMjExNDg4MSwyMTE0OTc3LDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkzMDg5LDIxOTMxMjEsMjE5MzE1MywyMTkzMTg1LDIxMTc2NjUsMjExNzU2OSwyMTkzMjE3LDIxOTMyNDksMjE5MzI4MSwyMTkzMzEzLDIxOTMzNDUsMjE5MzM3NywyMTkzNDA5LDIxOTM0NDEsMjE5MzQ3MywyMTkzNTA1XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4NDIyNSw2MjkxNDU2LDIxODQyNTcsNjI5MTQ1NiwyMTg0Mjg5LDYyOTE0NTYsMjE4NDMyMSw2MjkxNDU2LDIxODQzNTMsNjI5MTQ1NiwyMTg0Mzg1LDYyOTE0NTYsMjE4NDQxNyw2MjkxNDU2LDIxODQ0NDksNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTI1NzcsMjA5ODE3NywyMDk4MzA1LDIxMDgzMjEsMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjEwMDgzMyw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjA5ODY1NywyMDk4MDQ5LDIyMDA3MzcsMjEyMzQ4OSwyMTIzNjgxLDIyMDA3NjksMjA5ODYyNSwyMTAwMzIxLDIwOTgxNDUsMjEwMDQ0OSwyMDk4MDE3LDIwOTg3NTMsMjIwMDgwMSwyMjAwODMzLDIyMDA4NjUsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMCwwLDAsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTgzMDUsMjEwODMyMSwyMTA4Mjg5LDIxMDA4NjUsMjExMzE1MywyMTA4NDgxLDIxMTMzNDUsMjExMzQ0MSwyMDk4MjA5LDIxMTExMzcsMCwyMDk4MjQxLDIxMDgzNTMsMjEwODQxNywyMTA1ODI1LDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE4MTE1MywyMTA1NTA1LDIxODExODUsMjE2NzYxNywyMTgwOTkzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE2MDAwMiwyMTYwMDY2LDIxNjAxMzAsMjE2MDE5NCwyMTYwMjU4LDIxMzIwNjYsMjEzMTAxMCwyMTMxMTA2LDIxMDYwMTgsMjEzMTYxOCwyMTYwMzIyLDIxMzEyOTgsMjEzMjAzNCwyMTMxOTM4LDIxMzc0MTAsMjEzMjIyNl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgzNjE3LDYyOTE0NTYsMjE4MzY0OSw2MjkxNDU2LDIxODM2ODEsNjI5MTQ1NiwyMTgzNzEzLDYyOTE0NTYsMjE4Mzc0NSw2MjkxNDU2LDIxODM3NzcsNjI5MTQ1NiwyMTgzODA5LDYyOTE0NTYsMjE4Mzg0MSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDAsMCw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDAsMCw2MjkxNDU2LDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNTA5NzcsMjI1MTAwOSwyMjUxMDQxLDIyNTEwNzMsMjE5NTAwOSwyMjUxMTA2LDIyNTExNjksMjI1MTIwMSwyMjUxMjMzLDIyNTEyNjUsMjI1MTI5NywyMjUxMzMwLDIyNTEzOTQsMjI1MTQ1NywyMjUxNDg5LDIyNTE1MjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjA1NzI5LDIyMDU3NjEsMjIwNTc5MywyMjA1ODI1LDIyMDU4NTcsMjIwNTg4OSwyMjA1OTIxLDIyMDU5NTMsMjIwNTk4NSwyMjA2MDE3LDIyMDYwNDksMjIwNjA4MSwyMjA2MTEzLDIyMDYxNDUsMjIwNjE3NywyMjA2MjA5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNDMxNzAsMjE2ODk5Myw2MjkxNDU2LDIxNjkwMjUsNjI5MTQ1NiwyMTY5MDU3LDYyOTE0NTYsMjE2OTA4OSw2MjkxNDU2LDIxNDMyMzQsMjE2OTEyMSw2MjkxNDU2LDIxNjkxNTMsNjI5MTQ1NiwyMTY5MTg1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMTkwNjg5LDYyOTE0NTYsMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjQ4NzA2LDIyNDg3NjksMjI0ODgwMSwyMjQ4ODMzLDIyNDg4NjUsMjI0ODg5NywyMjQ4OTI5LDIyNDg5NjIsMjI0OTAyNiwyMjQ5MDkwLDIyNDkxNTQsMjI0MDcwNSwyMjQ5MjE3LDIyNDkyNDksMjI0OTI4MSwyMjQ5MzEzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA0ODU4NTcsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwxMDQ5NTM5NCw2MjkxNDU2LDIwOTgyMDksNjI5MTQ1Niw2MjkxNDU2LDIwOTcxNTIsNjI5MTQ1NiwxMDUzMTM5NF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxNDY4MDA2NCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzM5ODUsMjE3Mzk1MywyMTQ4NDgxLDIxNzM2MDEsMjE3MzYzMywyMTczNjY1LDIxNzM2OTcsMjE3MzcyOSwyMTQ4ODAxLDIxNzM3NjEsMjE0Mzk2OSwyMTczNzkzLDIxNzM4MjUsMjE1MzQ3MywyMTczODU3LDIxNzM4ODldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDIxODY5NzcsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDEwNTM3ODU4LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDk2MDEsMjIwOTYzMywyMjA5NjY1LDIyMDk2OTcsMjIwOTcyOSwyMjA5NzYxLDIyMDk3OTMsMjIwOTgyNSwyMjA5ODU3LDIyMDk4ODksMjIwOTkyMSwyMjA5OTUzLDIyMDk5ODUsMjIxMDAxNywyMjEwMDQ5LDIyMTAwODFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDUwMTUzOSwxMDUwMTYzNSwxMDUwMTczMSwxMDUwMTgyNywxMDUwMTkyMywxMDUwMjAxOSwyMDk4MjA5LDIxMTExMzcsMjEwNTUwNSwyMDk4MjQxLDIxMDgzNTMsMjEwODQxNywyMTA1ODI1LDIxMTE3MTMsMjEwMDg5NywyMTExOTA1XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3MzY5NywyMTczNzI5LDIxNDg4MDEsMjE3Mzc2MSwyMTQzOTY5LDIxNzM3OTMsMjE3MzgyNSwyMTUzNDczLDIxNzM4NTcsMjE3Mzg4OSwyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTc0MDE3LDIxNzQwMTcsMjE3NDA0OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE5NDU2MSwyMTk0NTkzLDIxOTQ2MjUsMjExOTc3NywyMTE5ODczLDIxOTQ2NTcsMjE5NDY4OSwyMTk0NzIxLDIxOTQ3NTMsMjE5NDc4NSwyMTk0ODE3LDIxOTQ4NDksMjE5NDg4MSwyMTk0OTEzLDIxOTQ5NDUsMjE5NDk3N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MSwyMTA4MzUzLDIxMDg0MTcsMjEwNTgyNSwyMTExNzEzLDIxMDA4OTcsMjExMTkwNSwyMTA1NDczLDIxMDU1NjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjIyODE4LDIyMjI4ODIsMjIyMjk0NiwyMjIzMDEwLDIyMjMwNzQsMjIyMzEzOCwyMjIzMjAyLDIyMjMyNjYsMjIyMzMzMCwyMjIzMzk0LDIyMjM0NTgsMjIyMzUyMiwyMjIzNTg2LDIyMjM2NTAsMjIyMzcxNCwyMjIzNzc4XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDIxNzk1NTMsMjE3OTU4NSwyMTc5NjE3LDIxNzk2NDksMjE0NDAwMSwyMTc5NjgxLDIxNzk3MTMsMjE3OTc0NSwyMTc5Nzc3LDIxNzk4MDksMjE1NjcwNSwyMTc5ODQxLDIxNTY4MzMsMjE3OTg3MywyMTc5OTA1XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwyMzA2ODY3Miw2MjkxNDU2LDIxNDU2MDIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTY1MTMsMjE5NjU0NSwyMTk2NTc3LDIxOTY2MDksMjE5NjY0MSwyMTk2NjczLDIxOTY3MDUsMjE5NjczNywyMTk2NzY5LDIxOTY4MDEsMjE5NjgzMywyMTk2ODY1LDIxOTY4OTcsMjE5NjkyOSwyMTk2OTYxLDIxOTY5OTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3NzI4MSw2MjkxNDU2LDIxNzczMTMsNjI5MTQ1NiwyMTc3MzQ1LDYyOTE0NTYsMjE3NzM3Nyw2MjkxNDU2LDIxNzc0MDksNjI5MTQ1NiwyMTc3NDQxLDYyOTE0NTYsMjE3NzQ3Myw2MjkxNDU2LDIxNzc1MDUsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODcxMzcsMjIyMTQ3MywyMjIxNTA1LDIyMjE1MzcsMjIyMTU2OSw2MjkxNDU2LDYyOTE0NTYsMTA2MTAyMDksMTA2MTAyNDEsMTA1Mzc5ODYsMTA1Mzc5ODYsMTA1Mzc5ODYsMTA1Mzc5ODYsMTA2MDk4NTcsMTA2MDk4NTcsMTA2MDk4NTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjQzMDA5LDIyNDMwNDEsMjIxNjAzMywyMjQzMDc0LDIyNDMxMzcsMjI0MzE2OSwyMjQzMjAxLDIyMTk2MTcsMjI0MzIzMywyMjQzMjY1LDIyNDMyOTcsMjI0MzMyOSwyMjQzMzYyLDIyNDM0MjUsMjI0MzQ1NywyMjQzNDg5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMTA0ODU4NTcsMjA5NzE1Miw0MTk0MzA0LDQxOTQzMDQsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE0MzA0Miw2MjkxNDU2LDIxNDMxMDYsMjE0MzEwNiwyMTY4ODMzLDYyOTE0NTYsMjE2ODg2NSw2MjkxNDU2LDYyOTE0NTYsMjE2ODg5Nyw2MjkxNDU2LDIxNjg5MjksNjI5MTQ1NiwyMTY4OTYxLDYyOTE0NTYsMjE0MzE3MF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDQxOTMsMjIwNDIyNSwyMjA0MjU3LDIyMDQyODksMjIwNDMyMSwyMjA0MzUzLDIyMDQzODUsMjIwNDQxNywyMjA0NDQ5LDIyMDQ0ODEsMjIwNDUxMywyMjA0NTQ1LDIyMDQ1NzcsMjIwNDYwOSwyMjA0NjQxLDIyMDQ2NzNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjAyNzUzLDYyOTE0NTYsMjIwMjc4NSw2MjkxNDU2LDIyMDI4MTcsNjI5MTQ1NiwyMjAyODQ5LDYyOTE0NTYsMjIwMjg4MSw2MjkxNDU2LDIyMDI5MTMsNjI5MTQ1NiwyMjAyOTQ1LDYyOTE0NTYsMjIwMjk3Nyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODM1MywyMTA4NDE3LDIxMDU4MjUsMjExMTcxMywyMTAwODk3LDIxMTE5MDUsMjEwNTQ3MywyMTA1NTY5LDIxMDU2MDEsMjExMjI4OSwyMTA4MTkzLDIxMTI0ODEsMjExMjU3NywyMDk4MTc3LDIwOTgzMDUsMjEwODMyMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNDczOTQsMjE0NzQ1OCwyMTQ3NTIyLDIxNDc1ODYsMjE0NzY1MCwyMTQ3NzE0LDIxNDc3NzgsMjE0Nzg0MiwyMTQ3Mzk0LDIxNDc0NTgsMjE0NzUyMiwyMTQ3NTg2LDIxNDc2NTAsMjE0NzcxNCwyMTQ3Nzc4LDIxNDc4NDJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjUzMzEzLDIyNTMzNDYsMjI1MzQwOSwyMjUzNDQxLDIyNTM0NzMsMjI1MzUwNSwyMjUzNTM3LDIyNTM1NjksMjI1MzYwMSwyMjUzNjM0LDIyMTkzOTMsMjI1MzY5NywyMjUzNzI5LDIyNTM3NjEsMjI1Mzc5MywyMjUzODI1XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTYyNTYyLDIxNjI2MjYsMjEzMTM2MiwyMTYyNjkwLDIxNTk5MzgsMjE2MDAwMiwyMTYyNzU0LDIxNjI4MTgsMjE2MDEzMCwyMTYyODgyLDIxNjAxOTQsMjE2MDI1OCwyMTYwODM0LDIxNjA4OTgsMjE2MTAyNiwyMTYxMDkwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3NTM2MSwyMTc1MzkzLDIxNzU0MjUsMjE3NTQ1NywyMTc1NDg5LDIxNzU1MjEsMjE3NTU1MywyMTc1NTg1LDIxNzU2MTcsMjE3NTY0OSwyMTc1NjgxLDIxNzU3MTMsMjE3NTc0NSwyMTc1Nzc3LDIxNzU4MDksMjE3NTg0MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNTM4NTgsMjI1MzkyMSwyMjUzOTU0LDIyNTQwMTgsMjI1NDA4MiwyMTk2NzM3LDIyNTQxNDUsMjE5Njg2NSwyMjU0MTc3LDIyNTQyMDksMjI1NDI0MSwyMjU0MjczLDIxOTcwMjUsMjI1NDMwNiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMjAyMTEzLDIyMDQxMjksMjE4ODcwNSwyMjA0MTYxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzM5ODUsMjE3NDAxNywyMTc0MDE3LDIxNzQwNDksMjE3NDA4MSwyMTc0MTEzLDIxNzQxNDUsMjE3NDE3NywyMTQ5MDU3LDIyMzMwODksMjE3MzY5NywyMTczNzYxLDIxNzM3OTMsMjE3NDExMywyMTczOTg1LDIxNzM5NTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTAxNTY5LDIxMDE2OTcsMjEwMTgyNSwyMTAxOTUzLDIxMDIwODEsMjEwMjIwOSwyMTAwODMzLDIxMDA3MzcsMjA5ODMzNywyMTAxNDQxLDIxMDE1NjksMjEwMTY5NywyMTAxODI1LDIxMDE5NTMsMjEwMjA4MSwyMTAyMjA5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MSwwLDIxMDg0MTcsMCwyMTExNzEzLDIxMDA4OTcsMjExMTkwNV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzU0MjUsMjE3NTQ4OSwyMTc1ODA5LDIxNzU5MDUsMjE3NTkzNywyMTc1OTM3LDIxNzYxOTMsMjE3NjQxNywyMTgwODY1LDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNDMyOTgsMjE0MzI5OCwyMTQzMjk4LDIxNDMzNjIsMjE0MzM2MiwyMTQzMzYyLDIxNDM0MjYsMjE0MzQyNiwyMTQzNDI2LDIxNzExMDUsNjI5MTQ1NiwyMTcxMTM3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEyMDE2MiwyMTIwMjU4LDIxNTE2MTgsMjE1MTY4MiwyMTUxNzQ2LDIxNTE4MTAsMjE1MTg3NCwyMTUxOTM4LDIxNTIwMDIsMjEyMDAzNSwyMTIwMTMxLDIxMjAyMjcsMjE1MjA2NiwyMTIwMzIzLDIxNTIxMzAsMjEyMDQxOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTUzNjEsMjE0MjQzMywyMjM2MDY1LDIyMzYwOTcsMjIzNjEyOSwyMjM2MTYxLDIxMTgyNDEsMjExNzQ3MywyMjM2MTkzLDIyMzYyMjUsMjIzNjI1NywyMjM2Mjg5LDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg5MjgxLDYyOTE0NTYsMjE4OTMxMyw2MjkxNDU2LDIxODkzNDUsNjI5MTQ1NiwyMTg5Mzc3LDYyOTE0NTYsMjE4OTQwOSw2MjkxNDU2LDIxODk0NDEsNjI5MTQ1NiwyMTg5NDczLDYyOTE0NTYsMjE4OTUwNSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDIxNDU5MjIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTQ1OTg2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE0NjA1MCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDA4MzMsMjEwMDczNywyMDk4MzM3LDIxMDE0NDEsMjEwMTU2OSwyMTAxNjk3LDIxMDE4MjUsMjEwMTk1MywyMTAyMDgxLDIxMDIyMDksMTA1MDIxMTMsMTA1NjIwMTcsMTA2MTA0MDEsMTA1MDIxNzcsMTA2MTA0MzMsMTA1MzgwNDldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwyMTg2NDAxLDAsMjE4NjQzMywwLDIxODY0NjUsMCwyMTg2NDk3XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwyMTk4MjQxLDIxOTgyNzMsMjE5ODMwNSwyMTk4MzM3LDIxOTgzNjksMjE5ODQwMSwwLDAsMjE5ODQzMywyMTk4NDY1LDIxOTg0OTcsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1NiwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDIzMDY4NjcyLDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDIxMDU5MjEsMjA5NzcyOSwwLDIwOTczNzcsMCwwLDIxMDYwMTcsMjEzMzI4MSwyMDk3NTA1LDIxMDU4ODksMCwyMDk3Njk3LDIxMzU3NzcsMjA5NzYzMywyMDk3NDQxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE5Nzg4OSwyMTk3OTIxLDIxOTc5NTMsMjE5Nzk4NSwyMTk4MDE3LDIxOTgwNDksMjE5ODA4MSwyMTk4MTEzLDIxOTgxNDUsMjE5ODE3NywyMTk4MjA5LDIxOTgyNDEsMjE5ODI3MywyMTk4MzA1LDIxOTgzMzcsMjE5ODM2OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzI1MTQsMjEzMjYxMCwyMTYwMzg2LDIxMzMwOTAsMjEzMzE4NiwyMTYwNDUwLDIxNjA1MTQsMjEzMzI4MiwyMTYwNTc4LDIxMzM1NzAsMjEwNjE3OCwyMTYwNjQyLDIxMzM4NTgsMjE2MDcwNiwyMTYwNzcwLDIxMzQxNDZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1NiwyMzA2ODY3MiwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg0NzM3LDYyOTE0NTYsMjE4NDc2OSw2MjkxNDU2LDIxODQ4MDEsNjI5MTQ1NiwyMTg0ODMzLDYyOTE0NTYsMjE4NDg2NSw2MjkxNDU2LDIxODQ4OTcsNjI5MTQ1NiwyMTg0OTI5LDYyOTE0NTYsMjE4NDk2MSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE4Njc1Myw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxODY3ODUsMjE4NjgxNywyMTg2ODQ5LDIxNzM1NjksMjE4Njg4MSwxMDQ5NjM1NSwxMDQ5NTM5NSwxMDU3NTUyMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwyMDk3NzI5LDAsMCwwLDAsMjEwNjAxNywwLDIwOTc1MDUsMCwyMDk3MTg1LDAsMjEzNTc3NywyMDk3NjMzLDIwOTc0NDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTg5NTM3LDYyOTE0NTYsMjE4OTU2OSw2MjkxNDU2LDIxODk2MDEsNjI5MTQ1NiwyMTg5NjMzLDYyOTE0NTYsMjE4OTY2NSw2MjkxNDU2LDIxODk2OTcsNjI5MTQ1NiwyMTg5NzI5LDYyOTE0NTYsMjE4OTc2MSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwMjQ5Nyw2MjkxNDU2LDIyMDI1MjksNjI5MTQ1NiwyMjAyNTYxLDYyOTE0NTYsMjIwMjU5Myw2MjkxNDU2LDIyMDI2MjUsNjI5MTQ1NiwyMjAyNjU3LDYyOTE0NTYsMjIwMjY4OSw2MjkxNDU2LDIyMDI3MjEsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDUyMTcsMjIxODM2OSwyMjQ1MjQ5LDIyNDUyODIsMjI0NTM0NSwyMjQ1Mzc3LDIyNDU0MTAsMjI0NTQ3NCwyMjQ1NTM3LDIyNDU1NjksMjI0NTYwMSwyMjQ1NjMzLDIyNDU2NjUsMjI0NTY2NSwyMjQ1Njk3LDIyNDU3MjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsMCwwLDAsMCwwLDIzMDY4NjcyLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMDk3MjgxLDIxMDU5MjEsMjA5NzcyOSwyMTA2MDgxLDIwOTczNzcsMjA5NzYwMSwyMTYyMzM3LDIxMDYwMTcsMjEzMzI4MSwyMDk3NTA1LDAsMjA5NzE4NSwyMDk3Njk3LDIxMzU3NzcsMjA5NzYzMywyMDk3NDQxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3NjY0MSw2MjkxNDU2LDIxNzY2NzMsNjI5MTQ1NiwyMTc2NzA1LDYyOTE0NTYsMjE3NjczNyw2MjkxNDU2LDIxNzY3NjksNjI5MTQ1NiwyMTc2ODAxLDYyOTE0NTYsMjE3NjgzMyw2MjkxNDU2LDIxNzY4NjUsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzQxNDUsMjE3NDE3NywyMTQ5MDU3LDIyMzMwODksMjE3MzY5NywyMTczNzYxLDIxNzM3OTMsMjE3NDExMywyMTczOTg1LDIxNzM5NTMsMjE3NDM2OSwyMTc0MzY5LDAsMCwyMTAwODMzLDIxMDA3MzddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTE2NTEzLDIxOTA4MTcsMjE5MDg0OSwyMTkwODgxLDIxOTA5MTMsMjE5MDk0NSwyMTE2NjA5LDIxOTA5NzcsMjE5MTAwOSwyMTkxMDQxLDIxOTEwNzMsMjExNzE4NSwyMTkxMTA1LDIxOTExMzcsMjE5MTE2OSwyMTkxMjAxXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE2NzYxNywyMTY3NjQ5LDIxNjc2ODEsMjE2NzcxMywyMTY3NzQ1LDIxNjc3NzcsMjE2NzgwOSw2MjkxNDU2LDIxNjc4NDEsMjE2Nzg3MywyMTY3OTA1LDIxNjc5MzcsMjE2Nzk2OSwyMTY4MDAxLDIxNjgwMzMsNDI0MDEzMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNjUxMjIsMjE2Mzk3MCwyMTY0MDM0LDIxNjQwOTgsMjE2NDE2MiwyMTY0MjI2LDIxNjQyOTAsMjE2NDM1NCwyMTY0NDE4LDIxNjQ0ODIsMjE2NDU0NiwyMTMzMTIyLDIxMzQ1NjIsMjEzMjE2MiwyMTMyODM0LDIxMzY4NjZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMjE4NjIwOSwyMTg2MjQxLDIxODYyNzMsMjE4NjMwNSwyMTg2MzM3LDIxODYzNjksMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjExMjQ4MSwyMTEyNTc3LDIwOTgxNzcsMjA5ODMwNSwyMTA4MzIxLDIxMDgyODksMjEwMDg2NSwyMTEzMTUzLDIxMDg0ODEsMjExMzM0NSwyMTEzNDQxLDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDIzMDY4NjcyLDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDEwNTM3OTIxLDEwNjEwNjg5LDEwNjEwMjczLDEwNjEwNDk3LDEwNjEwNTI5LDEwNjEwMzA1LDEwNjEwNzIxLDEwNDg5NjAxLDEwNDg5Njk3LDEwNjEwMzM3LDEwNTc1NjE3LDEwNTU0NTI5LDIyMjE3NjEsMjE5NzIxNywxMDQ5NjU3N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDU0NzMsMjEwNTU2OSwyMTA1NjAxLDIxMTIyODksMCwyMTEyNDgxLDIxMTI1NzcsMjA5ODE3NywyMDk4MzA1LDIxMDgzMjEsMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTAwODk3LDIxMTE5MDUsMjEwNTQ3MywyMTA1NTY5LDIxMDU2MDEsMjExMjI4OSwyMTA4MTkzLDIxMTI0ODEsMjExMjU3NywyMDk4MTc3LDIwOTgzMDUsMjEwODMyMSwyMTA4Mjg5LDIxMDA4NjUsMjExMzE1MywyMTA4NDgxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEyNTM0NiwyMTUzNDEwLDIxNTM0NzQsMjEyNzM5NCwyMTUzNTM4LDIxNTM2MDIsMjE1MzY2NiwyMTUzNzMwLDIxMDU1MDcsMjEwNTQ3NiwyMTUzNzk0LDIxNTM4NTgsMjE1MzkyMiwyMTUzOTg2LDIxNTQwNTAsMjEwNTc5NF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDA0NDksMjExOTY4MSwyMjAwNDgxLDIxNTMzMTMsMjE5OTg3MywyMTk5OTA1LDIxOTk5MzcsMjIwMDUxMywyMjAwNTQ1LDIyMDA1NzcsMjIwMDYwOSwyMTE5MTA1LDIxMTkyMDEsMjExOTI5NywyMTE5MzkzLDIxMTk0ODldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE3NTc3Nyw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIyMjI3MywyMTk3MjE3LDIyMjE0NzMsMjIyMTUwNSwyMjIxMDg5LDIyMjIzMDUsMjIwMDg2NSwyMDk5NjgxLDIxMDQ0ODEsMjIyMjMzNywyMDk5OTA1LDIxMjA3MzcsMjIyMjM2OSwyMTAzNzEzLDIxMDAyMjUsMjA5ODc4NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDEzNzcsNjI5MTQ1NiwyMjAxNDA5LDYyOTE0NTYsMjIwMTQ0MSw2MjkxNDU2LDIyMDE0NzMsNjI5MTQ1NiwyMjAxNTA1LDYyOTE0NTYsMjIwMTUzNyw2MjkxNDU2LDIyMDE1NjksNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3NDA4MSwyMTc0MTEzLDIxNzQxNDUsMjE3NDE3NywyMTQ5MDU3LDIyMzMwNTcsMjE0ODQ4MSwyMTczNjAxLDIxNzM2MzMsMjE3MzY2NSwyMTczNjk3LDIxNzM3MjksMjE0ODgwMSwyMTczNzYxLDIxNDM5NjksMjE3Mzc5M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDA4OTcsNjI5MTQ1NiwyMjAwOTI5LDYyOTE0NTYsMjIwMDk2MSw2MjkxNDU2LDIyMDA5OTMsNjI5MTQ1NiwyMjAxMDI1LDYyOTE0NTYsMjE4MDg2NSw2MjkxNDU2LDIyMDEwNTcsNjI5MTQ1NiwyMjAxMDg5LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDAsMCwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTYxMTU0LDIxNjE0MTAsMjEzODY1OCwyMTYxNDc0LDIxNjE1MzgsMjA5NzY2NiwyMDk3MTg2LDIwOTc0NzQsMjE2Mjk0NiwyMTMyNDUwLDIxNjMwMTAsMjE2MzA3NCwyMTM2MTYyLDIxNjMxMzgsMjE2MTY2NiwyMTYxNzMwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE0ODQ4MSwyMTczNjAxLDIxNzM2MzMsMjE3MzY2NSwyMTczNjk3LDIxNzM3MjksMjE0ODgwMSwyMTczNzYxLDIxNDM5NjksMjE3Mzc5MywyMTczODI1LDIxNTM0NzMsMjE3Mzg1NywyMTczODg5LDIxNzM5MjEsMjE3Mzk1M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDAsMCwwLDAsMjE0NTQxMCwyMTQ1NDc0LDAsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDQxNjEsMjIxNjA2NSwyMjEyNzY5LDIyNDQxOTMsMjI0NDIyNSwyMjQ0MjU3LDIyNDQyOTAsMjI0NDM1MywyMjQ0Mzg1LDIyNDQ0MTcsMjI0NDQ0OSwyMjE4MjczLDIyNDQ0ODEsMjI0NDUxNCwyMjQ0NTc3LDIyNDQ2MDldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTI1NzMwLDIxMjU2OTksMjEyNTc5NSwyMTI1ODkxLDIxMjU5ODcsMjE1NDExNCwyMTU0MTc4LDIxNTQyNDIsMjE1NDMwNiwyMTU0MzcwLDIxNTQ0MzQsMjE1NDQ5OCwyMTI2MDgyLDIxMjYxNzgsMjEyNjI3NCwyMTI2MDgzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIzNzY2NSwyMjM3Njk3LDIyMzc2OTcsMjIzNzY5NywyMjM3NzMwLDIyMzc3OTMsMjIzNzgyNSwyMjM3ODU3LDIyMzc4OTAsMjIzNzk1MywyMjM3OTg1LDIyMzgwMTcsMjIzODA0OSwyMjM4MDgxLDIyMzgxMTMsMjIzODE0NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNTAxNDYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTQzNjksMjIzODU5MywyMjM4NjI1LDIyMzg2NTcsMjIzODY4OSwyMjM4NzIxLDIyMzg3NTMsMjIzODc4NSwyMjM4ODE3LDIyMzg4NTAsMjIzODkxMywyMjM4OTQ1LDIyMzg5NzcsMjIzNTQ1NywyMjM5MDA5LDIyMzkwNDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjI1MjA2NiwyMjUyMTMwLDIyNTIxOTMsMjI1MjIyNSwyMjUyMjU3LDIyNTIyOTAsMjI1MjM1MywyMjUyMzg1LDIyNTI0MTcsMjI1MjQ0OSwyMjUyNDgxLDIyNTI1MTMsMjI1MjU0NSwyMjUyNTc4LDIyNTI2NDEsMjI1MjY3M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTc2OTcsMjExNDExMywyMTE0MjA5LDIxOTc3MjksMjE5Nzc2MSwyMTE0MzA1LDIxOTc3OTMsMjExNDQwMSwyMTE0NDk3LDIxOTc4MjUsMjExNDU5MywyMTE0Njg5LDIxMTQ3ODUsMjExNDg4MSwyMTE0OTc3LDIxOTc4NTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjI0ODY2LDIyMjQ5MzAsMjIyNDk5NCwyMjI1MDU4LDIyMjUxMjIsMjIyNTE4NiwyMjI1MjUwLDIyMjUzMTQsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxOTQ5MCwyMjE5NTU0LDIyMTk2MTcsMjIxOTY0OSwyMjE5NjgxLDIyMTk3MTQsMjIxOTc3OCwyMjE5ODQyLDIyMTk5MDUsMjIxOTkzNywwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MSwyMTA4MzUzLDIxMDg0MTcsMjEwNTgyNSwyMTExNzEzLDIxMDA4OTcsMjExMTkwNSwyMTA1NDczLDIxMDU1NjksMjEwNTYwMSwyMTEyMjg5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3NDA4MSwyMTc0MTEzLDIxNzQxNDUsMjE3NDE3NywyMTQ5MDU3LDIyMzMwODksMjE3MzY5NywyMTczNzYxLDIxNzM3OTMsMjE3NDExMywyMTczOTg1LDIxNzM5NTMsMjE0ODQ4MSwyMTczNjAxLDIxNzM2MzMsMjE3MzY2NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjAxNjEsMjIyMDE2MSwyMjIwMTkzLDIyMjAxOTMsMjIyMDE5MywyMjIwMTkzLDIyMjAyMjUsMjIyMDIyNSwyMjIwMjI1LDIyMjAyMjUsMjIyMDI1NywyMjIwMjU3LDIyMjAyNTcsMjIyMDI1NywyMjIwMjg5LDIyMjAyODldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTkyNjczLDIxOTI3MDUsMjE5MjczNywyMTkyNzY5LDIxOTI4MDEsMjE5MjgzMywyMTkyODY1LDIxMTgwNDksMjE5Mjg5NywyMTE3NDczLDIxMTc3NjEsMjE5MjkyOSwyMTkyOTYxLDIxOTI5OTMsMjE5MzAyNSwyMTkzMDU3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE3OTI5Nyw2MjkxNDU2LDIxNzkzMjksNjI5MTQ1NiwyMTc5MzYxLDYyOTE0NTYsMjE3OTM5Myw2MjkxNDU2LDIxNzk0MjUsNjI5MTQ1NiwyMTc5NDU3LDYyOTE0NTYsMjE3OTQ4OSw2MjkxNDU2LDIxNzk1MjEsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIzNTc0NSwyMjM1Nzc3LDIxOTM2MzMsMjIzNTgwOSwyMjM1ODQxLDIyMzU4NzMsMjIzNTkwNSwyMjM1OTM3LDIyMzU5NjksMjExNjUxMywyMTE2NzA1LDIyMzYwMDEsMjIwMDUxMywyMTk5OTA1LDIyMDA1NDUsMjIzNjAzM10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjIzMjk5MywyMjMzMDI1LDAsMCwyMTQ4NDgxLDIxNzM2MDEsMjE3MzYzMywyMTczNjY1LDIxNzM2OTcsMjE3MzcyOSwyMTQ4ODAxLDIxNzM3NjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTcwNTkzLDYyOTE0NTYsMjE3MDYyNSw2MjkxNDU2LDIxNzA2NTcsNjI5MTQ1NiwyMTcwNjg5LDIxNzA3MjEsNjI5MTQ1NiwyMTcwNzUzLDYyOTE0NTYsNjI5MTQ1NiwyMTcwNzg1LDYyOTE0NTYsMjE3MDgxNywyMTcwODQ5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTY2Nzg2LDIxNjY4NTAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDA4MzMsMjEwMDczNywyMDk4MzM3LDIxMDE0NDEsMjEwMTU2OSwyMTAxNjk3LDIxMDE4MjUsMjEwMTk1MywyMTAyMDgxLDIxMDIyMDksMTA1NzU2MTcsMjE4NzA0MSwxMDUwMjE3NywxMDQ4OTYwMSwxMDQ4OTY5NywwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzQ1NjIsMjEzMjE2MiwyMTMyODM0LDIxMzY4NjYsMjEzNjQ4MiwyMTY0NjEwLDIxNjQ2NzQsMjE2NDczOCwyMTY0ODAyLDIxMzI4MDIsMjEzMjcwNiwyMTY0ODY2LDIxMzI4OTgsMjE2NDkzMCwyMTY0OTk0LDIxNjUwNThdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjA5ODMzNywyMTAxNDQxLDEwNTMxNDU4LDIxNTM0NzMsNjI5MTQ1Niw2MjkxNDU2LDEwNTMxNTIyLDIxMDA3MzcsMjEwODE5Myw2MjkxNDU2LDIxMDY0OTksMjEwNjU5NSwyMTA2NjkxLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMzMxMjIsMjIzMzE4NiwyMjMzMjUwLDIyMzMzMTQsMjIzMzM3OCwyMjMzNDQyLDIyMzM1MDYsMjIzMzU3MCwyMjMzNjM0LDIyMzM2OTgsMjIzMzc2MiwyMjMzODI2LDIyMzM4OTAsMjIzMzk1NCwyMjM0MDE4LDIyMzQwODJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjA1MjE3LDIyMDUyNDksMjIwNTI4MSwyMjA1MzEzLDIyMDUzNDUsMjIwNTM3NywyMjA1NDA5LDIyMDU0NDEsMjIwNTQ3MywyMjA1NTA1LDIyMDU1MzcsMjIwNTU2OSwyMjA1NjAxLDIyMDU2MzMsMjIwNTY2NSwyMjA1Njk3XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwwLDYyOTE0NTYsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMjMwNjg2NzIsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzM2MDEsMjE3Mzc2MSwyMTc0MDgxLDIxNzM1NjksMjE3NDI0MSwyMTc0MTEzLDIxNzM5NTMsNjI5MTQ1NiwyMTc0MzA1LDYyOTE0NTYsMjE3NDMzNyw2MjkxNDU2LDIxNzQzNjksNjI5MTQ1NiwyMTc0NDAxLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE1MjQ1MCwyMTUyNTE0LDIwOTk2NTMsMjEwNDQ1MiwyMDk5ODEzLDIxMjIyNDMsMjA5OTk3MywyMTUyNTc4LDIxMjIzMzksMjEyMjQzNSwyMTIyNTMxLDIxMjI2MjcsMjEyMjcyMywyMTA0NTgwLDIxMjI4MTksMjE1MjY0Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMzYzODUsMjIzNjQxNywyMjM2NDQ5LDIyMzY0ODIsMjIzNjU0NSwyMjE1NDI1LDIyMzY1NzcsMjIzNjYwOSwyMjM2NjQxLDIyMzY2NzMsMjIxNTQ1NywyMjM2NzA1LDIyMzY3MzcsMjIzNjc3MCwyMjE1NDg5LDIyMzY4MzNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTYzMzk0LDIxNTk3NDYsMjE2MzQ1OCwyMTMxMzYyLDIxNjM1MjIsMjE2MDEzMCwyMTYzNzc4LDIxMzIyMjYsMjE2Mzg0MiwyMTMyODk4LDIxNjM5MDYsMjE2MTQxMCwyMTM4NjU4LDIwOTc2NjYsMjEzNjE2MiwyMTYzNjUwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxODcyMSwyMjQ2OTEzLDIyNDY5NDYsMjIxNjM4NSwyMjQ3MDEwLDIyNDcwNzQsMjIxNTAwOSwyMjQ3MTM3LDIyNDcxNjksMjIxNjQ4MSwyMjQ3MjAxLDIyNDcyMzMsMjI0NzI2NiwyMjQ3MzMwLDIyNDczMzAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMjk3MzAsMjEyOTc2MiwyMTI5ODU4LDIxMjk3MzEsMjEyOTgyNywyMTU2NDgyLDIxNTY0ODIsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDAsMCwwLDAsMCw2MjkxNDU2LDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDM5NjksMjIwNDAwMSwyMTgxMzc3LDIyMDQwMzMsMjIwNDA2NSw2MjkxNDU2LDIyMDQwOTcsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTY5NDczLDYyOTE0NTYsMjE2OTUwNSw2MjkxNDU2LDIxNjk1MzcsNjI5MTQ1NiwyMTY5NTY5LDYyOTE0NTYsMjE2OTYwMSw2MjkxNDU2LDIxNjk2MzMsNjI5MTQ1NiwyMTY5NjY1LDYyOTE0NTYsMjE2OTY5Nyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE0MTU0Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjA4MDEsMjIyMDgwMSwyMjIwODAxLDIyMjA4MDEsMjIyMDgzMywyMjIwODMzLDIyMjA4NjUsMjIyMDg2NSwyMjIwODY1LDIyMjA4NjUsMjIyMDg5NywyMjIwODk3LDIyMjA4OTcsMjIyMDg5NywyMTM5ODczLDIxMzk4NzNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDAsMCwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCw2MjkxNDU2LDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE0ODQ5LDIyMTg0MzMsMjIxODQ2NSwyMjE4NDk3LDIyMTg1MjksMjIxODU2MSwyMjE0ODgxLDIyMTg1OTMsMjIxODYyNSwyMjE4NjU3LDIyMTg2ODksMjIxODcyMSwyMjE4NzUzLDIyMTY1NDUsMjIxODc4NSwyMjE4ODE3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTM2NDgyLDIxNjQ2MTAsMjE2NDY3NCwyMTY0NzM4LDIxNjQ4MDIsMjEzMjgwMiwyMTMyNzA2LDIxNjQ4NjYsMjEzMjg5OCwyMTY0OTMwLDIxNjQ5OTQsMjE2NTA1OCwyMTY1MTIyLDIxMzI4MDIsMjEzMjcwNiwyMTY0ODY2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwNzY0OSwyMjA3NjgxLDIyMDc3MTMsMjIwNzc0NSwyMjA3Nzc3LDIyMDc4MDksMjIwNzg0MSwyMjA3ODczLDIyMDc5MDUsMjIwNzkzNywyMjA3OTY5LDIyMDgwMDEsMjIwODAzMywyMjA4MDY1LDIyMDgwOTcsMjIwODEyOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMjM2ODMsMjEwNTA5MiwyMTUyNzA2LDIxMjM3NzksMjEwNTIyMCwyMTUyNzcwLDIxMDA0NTMsMjA5ODc1NSwyMTIzOTA2LDIxMjQwMDIsMjEyNDA5OCwyMTI0MTk0LDIxMjQyOTAsMjEyNDM4NiwyMTI0NDgyLDIxMjQ1NzhdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwxMDQ4NTg1N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDUwODE2MywxMDUwODI1OSwxMDUwODM1NSwxMDUwODQ1MSwyMjAwMTI5LDIyMDAxNjEsMjE5MjczNywyMjAwMTkzLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDM1NTMsNjI5MTQ1NiwyMjAzNTg1LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIyMDM2MTcsNjI5MTQ1NiwyMjAzNjQ5LDYyOTE0NTYsMjIwMzY4MSw2MjkxNDU2LDIyMDM3MTMsNjI5MTQ1NiwyMjAzNzQ1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxODg4NDQ0OSwxODg4NDA2NSwyMzA2ODY3MiwxODg4NDQxNywxODg4NDAzNCwxODkyMTE4NSwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwxODg3NDM2OF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDczOTMsMjI0NzQyNiwyMjQ3NDg5LDIyNDc1MjEsMjI0NzU1MywyMjQ3NTg2LDIyNDc2NDksMjI0NzY4MSwyMjQ3NzEzLDIyNDc3NDUsMjI0Nzc3NywyMjQ3ODEwLDIyNDc4NzMsMjI0NzkwNSwyMjQ3OTM3LDIyNDc5NjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1NiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzQxNDUsMjA5NzE1MywyMTM0MjQxLDAsMjEzMjcwNSwyMTMwOTc3LDIxNjAwNjUsMjEzMTI5NywwLDIxMzMwODksMjE2MDU3NywyMTMzODU3LDIyMzUyOTcsMCwyMjM1MzI5LDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgyNTkzLDYyOTE0NTYsMjE4MjYyNSw2MjkxNDU2LDIxODI2NTcsNjI5MTQ1NiwyMTgyNjg5LDYyOTE0NTYsMjE4MjcyMSw2MjkxNDU2LDIxODI3NTMsNjI5MTQ1NiwyMTgyNzg1LDYyOTE0NTYsMjE4MjgxNyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjEwMjQwMiwyMTAyNDAzLDYyOTE0NTYsMjExMDA1MF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNDk4OTAsMjEwODMyMywyMTQ5OTU0LDYyOTE0NTYsMjExMzQ0MSw2MjkxNDU2LDIxNDkwNTcsNjI5MTQ1NiwyMTEzNDQxLDYyOTE0NTYsMjEwNTQ3MywyMTY3MjY1LDIxMTExMzcsMjEwNTUwNSw2MjkxNDU2LDIxMDgzNTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE5MTA1LDIyMTkxMzcsMjE5NTIzMywyMjUxNTU0LDIyNTE2MTcsMjI1MTY0OSwyMjUxNjgxLDIyNTE3MTMsMjI1MTc0NiwyMjUxODEwLDIyNTE4NzMsMjI1MTkwNSwyMjUxOTM3LDIyNTE5NzAsMjI1MjAzMywyMjE5MTY5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwMzAwOSw2MjkxNDU2LDIyMDMwNDEsNjI5MTQ1NiwyMjAzMDczLDYyOTE0NTYsMjIwMzEwNSw2MjkxNDU2LDIyMDMxMzcsNjI5MTQ1NiwyMjAzMTY5LDYyOTE0NTYsMjIwMzIwMSw2MjkxNDU2LDIyMDMyMzMsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMjgxOTUsMjEyODI5MSwyMTI4Mzg3LDIxMjg0ODMsMjEyODU3OSwyMTI4Njc1LDIxMjg3NzEsMjEyODg2NywyMTI4OTYzLDIxMjkwNTksMjEyOTE1NSwyMTI5MjUxLDIxMjkzNDcsMjEyOTQ0MywyMTI5NTM5LDIxMjk2MzVdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE0MDk2NCwyMTQxMTU2LDIxNDA5NjYsMjE0MTE1OCwyMTQxMzUwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMjUzNzgsMjIyNTQ0MiwyMjI1NTA2LDIyMjU1NzAsMjIyNTYzNCwyMjI1Njk4LDIyMjU3NjIsMjIyNTgyNiwyMjI1ODkwLDIyMjU5NTQsMjIyNjAxOCwyMjI2MDgyLDIyMjYxNDYsMjIyNjIxMCwyMjI2Mjc0LDIyMjYzMzhdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTEyNTc3LDIwOTgxNzcsMjA5ODMwNSwyMTA4MzIxLDIxMDgyODksMjEwMDg2NSwyMTEzMTUzLDIxMDg0ODEsMjExMzM0NSwyMTEzNDQxLDIwOTgyMDksMjExMTEzNywyMTA1NTA1LDIwOTgyNDEsMjEwODM1MywyMTA4NDE3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODM1MywyMTA4NDE3LDAsMjEwNTYwMSwyMTA4MTkzLDIxNTcxMjEsMjE1NzMxMywyMTU3Mzc3LDIxNTc0NDEsMjEwMDg5Nyw2MjkxNDU2LDIxMDg0MTksMjE3Mzk1MywyMTczNjMzLDIxNzM2MzMsMjE3Mzk1M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTE3MTMsMjE3MzEyMSwyMTExOTA1LDIwOTgxNzcsMjE3MzE1MywyMTczMTg1LDIxNzMyMTcsMjExMzE1MywyMTEzMzQ1LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTkwNzUzXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE5NzI0OSw2MjkxNDU2LDIxMTczNzcsMjE5NzI4MSwyMTk3MzEzLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMCwwLDAsMCwwLDAsMjMwNjg2NzIsMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjA5ODMzNywyMTAxNDQxLDIxMDE1NjksMjEwMTY5NywyMTAxODI1LDIxMDE5NTMsMjEwMjA4MSwyMTAyMjA5LDIxMDA4MzMsMjEwMDczNywyMDk4MzM3LDIxMDE0NDEsMjEwMTU2OSwyMTAxNjk3LDIxMDE4MjUsMjEwMTk1M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTczMjgxLDYyOTE0NTYsMjE3MzMxMyw2MjkxNDU2LDIxNzMzNDUsNjI5MTQ1NiwyMTczMzc3LDYyOTE0NTYsMCwwLDEwNTMyNTQ2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDEwNTYyMDE3LDIxNzM0NDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTU5NDI2LDIxNTk0OTAsMjE1OTU1NCwyMTU5MzYyLDIxNTk2MTgsMjE1OTY4MiwyMTM5NTIyLDIxMzY0NTAsMjE1OTc0NiwyMTU5ODEwLDIxNTk4NzQsMjEzMDk3OCwyMTMxMDc0LDIxMzEyNjYsMjEzMTM2MiwyMTU5OTM4XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDMyMzMsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIyMDMyNjUsNjI5MTQ1NiwyMjAzMjk3LDYyOTE0NTYsMjIwMzMyOSwyMjAzMzYxLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjE0ODQxOCwyMTQ4NDgyLDIxNDg1NDYsMCw2MjkxNDU2LDIxNDg2MTAsMjE4NjUyOSwyMTg2NTYxLDIxNDg0MTcsMjE0ODU0NSwyMTQ4NDgyLDEwNDk1Nzc4LDIxNDM5NjksMTA0OTU3NzhdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTM0MTQ2LDIxMzk0MjYsMjE2MDk2MiwyMTM0MjQyLDIxNjEyMTgsMjE2MTI4MiwyMTYxMzQ2LDIxNjE0MTAsMjEzODY1OCwyMTM0NzIyLDIxMzQ0MzQsMjEzNDgxOCwyMDk3NjY2LDIwOTczNDYsMjA5NzY5OCwyMTA1OTg2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE5ODg4MSwyMTk4OTEzLDIxOTg5NDUsMjE5ODk3NywyMTk5MDA5LDIxOTkwNDEsMjE5OTA3MywyMTk5MTA1LDIxOTkxMzcsMjE5OTE2OSwyMTk5MjAxLDIxOTkyMzMsMjE5OTI2NSwyMTk5Mjk3LDIxOTkzMjksMjE5OTM2MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDYxMDU2MSwyMDk4MjA5LDIxMTExMzcsMjEwNTUwNSwyMDk4MjQxLDIxMDgzNTMsMjEwODQxNywyMTA1ODI1LDIxMTE3MTMsMjEwMDg5NywyMTExOTA1LDIxMDU0NzMsMjEwNTU2OSwyMTA1NjAxLDIxMTIyODksMjEwODE5M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODM4NzMsNjI5MTQ1NiwyMTgzOTA1LDYyOTE0NTYsMjE4MzkzNyw2MjkxNDU2LDIxODM5NjksNjI5MTQ1NiwyMTg0MDAxLDYyOTE0NTYsMjE4NDAzMyw2MjkxNDU2LDIxODQwNjUsNjI5MTQ1NiwyMTg0MDk3LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjQ0NjQyLDIyNDQ3MDYsMjI0NDc2OSwyMjQ0ODAxLDIyMTgzMDUsMjI0NDgzMywyMjQ0ODY1LDIyNDQ4OTcsMjI0NDkyOSwyMjQ0OTYxLDIyNDQ5OTMsMjI0NTAyNiwyMjQ1MDg5LDIyNDUxMjIsMjI0NTE4NSwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDIxMTY1MTMsMjExNjYwOSwyMTE2NzA1LDIxMTY4MDEsMjE5OTg3MywyMTk5OTA1LDIxOTk5MzcsMjE5OTk2OSwyMTkwOTEzLDIyMDAwMDEsMjIwMDAzMywyMjAwMDY1LDIyMDAwOTcsMjE5MTAwOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwyMTgwNjczLDIxODA3MDUsMjE4MDczNywyMTgwNzY5LDIxODA4MDEsMjE4MDgzMywwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMDk4MDgxLDIwOTk1MjEsMjA5OTEwNSwyMTIwNzA1LDIwOTgzNjksMjEyMDgwMSwyMTAzMzYxLDIwOTc5ODUsMjA5ODQzMywyMTIxMzc3LDIxMjE0NzMsMjA5OTE2OSwyMDk5ODczLDIwOTg0MDEsMjA5OTM5MywyMTUyNjA5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE1MDQwMl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDIxNDU2NjYsMjE0NTczMCw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTczNzYxLDIxNzQwMTcsMjE3NDA0OSwyMTc0MDgxLDIxNzQxMTMsMjE3NDE0NSwyMTc0MTc3LDIxNDkwNTcsMjIzMzA1NywyMTQ4NDgxLDIxNzM2MDEsMjE3MzYzMywyMTczNjY1XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4NzA3Myw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIwOTgyNDEsMjA5ODI0MSwyMTA4MzUzLDIxMDA4OTcsMjExMTkwNSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxMDI0MDQsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxMDA2MTIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwxMDQ4NTg1N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNDkwNTcsMjIzMzA1NywyMTQ4NDgxLDIxNzM2MDEsMjE3MzYzMywyMTczNjY1LDIxNzM2OTcsMjE3MzcyOSwyMTQ4ODAxLDIxNzM3NjEsMjE0Mzk2OSwyMTczNzkzLDIxNzM4MjUsMjE1MzQ3MywyMTczODU3LDIxNzM4ODldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE3Njk3LDIyMTc3MjksMjIxNzc2MSwyMjE3NzkzLDIyMTc4MjUsMjIxNzg1NywyMjE3ODg5LDIyMTc5MjEsMjIxNzk1MywyMjE1ODczLDIyMTc5ODUsMjIxNTkwNSwyMjE4MDE3LDIyMTgwNDksMjIxODA4MSwyMjE4MTEzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMTIzMywyMjE4ODQ5LDIyMTY2NzMsMjIxODg4MSwyMjE4OTEzLDIyMTg5NDUsMjIxODk3NywyMjE5MDA5LDIyMTY4MzMsMjIxOTA0MSwyMjE1MTM3LDIyMTkwNzMsMjIxNjg2NSwyMjA5NTA1LDIyMTkxMDUsMjIxNjg5N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyNDAwOTcsMjI0MDEyOSwyMjQwMTYxLDIyNDAxOTMsMjI0MDIyNSwyMjQwMjU3LDIyNDAyODksMjI0MDMyMSwyMjQwMzUzLDIyNDAzODYsMjI0MDQ0OSwyMjQwNDgxLDIyNDA1MTMsMjI0MDU0NSwyMjA3OTA1LDIyNDA1NzhdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjIwMjI3Myw2MjkxNDU2LDIyMDIzMDUsNjI5MTQ1NiwyMjAyMzM3LDYyOTE0NTYsMjIwMjM2OSw2MjkxNDU2LDIyMDI0MDEsNjI5MTQ1NiwyMjAyNDMzLDYyOTE0NTYsMjIwMjQ2NSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwyMzA2ODY3MiwyMzA2ODY3MiwxODkyMzM5NCwyMzA2ODY3MiwxODkyMzQ1OCwxODkyMzUyMiwxODg4NDA5OSwxODkyMzU4NiwxODg4NDE5NSwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDExMjEsNjI5MTQ1NiwyMjAxMTUzLDYyOTE0NTYsMjIwMTE4NSw2MjkxNDU2LDIyMDEyMTcsNjI5MTQ1NiwyMjAxMjQ5LDYyOTE0NTYsMjIwMTI4MSw2MjkxNDU2LDIyMDEzMTMsNjI5MTQ1NiwyMjAxMzQ1LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMTA0MSwyMjExMDczLDIyMTExMDUsMjIxMTEzNywyMjExMTY5LDIyMTEyMDEsMjIxMTIzMywyMjExMjY1LDIyMTEyOTcsMjIxMTMyOSwyMjExMzYxLDIyMTEzOTMsMjIxMTQyNSwyMjExNDU3LDIyMTE0ODksMjIxMTUyMV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODE4MjUsNjI5MTQ1NiwyMTgxODU3LDYyOTE0NTYsMjE4MTg4OSw2MjkxNDU2LDIxODE5MjEsNjI5MTQ1NiwyMTgxOTUzLDYyOTE0NTYsMjE4MTk4NSw2MjkxNDU2LDIxODIwMTcsNjI5MTQ1NiwyMTgyMDQ5LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTYyMzM3LDIwOTc2MzMsMjA5NzYzMywyMDk3NjMzLDIwOTc2MzMsMjEzMjcwNSwyMTMyNzA1LDIxMzI3MDUsMjEzMjcwNSwyMDk3MTUzLDIwOTcxNTMsMjA5NzE1MywyMDk3MTUzLDIxMzMwODksMjEzMzA4OSwyMTMzMDg5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjE0ODU0NSw2MjkxNDU2LDIxNzM0NzMsNjI5MTQ1NiwyMTQ4ODY1LDYyOTE0NTYsMjE3MzUwNSw2MjkxNDU2LDIxNzM1MzcsNjI5MTQ1NiwyMTczNTY5LDYyOTE0NTYsMjE0OTEyMSwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTQ4ODAxLDIxNzM3NjEsMjE0Mzk2OSwyMTczNzkzLDIxNzM4MjUsMjE1MzQ3MywyMTczODU3LDIxNzM4ODksMjE3MzkyMSwyMTczOTUzLDIxNzM5ODUsMjE3NDAxNywyMTc0MDE3LDIxNzQwNDksMjE3NDA4MSwyMTc0MTEzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDcxMzcsMjIwNzE2OSwyMjA3MjAxLDIyMDcyMzMsMjIwNzI2NSwyMjA3Mjk3LDIyMDczMjksMjIwNzM2MSwyMjA3MzkzLDIyMDc0MjUsMjIwNzQ1NywyMjA3NDg5LDIyMDc1MjEsMjIwNzU1MywyMjA3NTg1LDIyMDc2MTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDAsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTk4NDAxLDIxOTg0MzMsMjE5ODQ2NSwyMTk4NDk3LDAsMjE5ODUyOSwyMTk4NTYxLDIxOTg1OTMsMjE5ODYyNSwyMTk4NjU3LDIxOTg2ODksMjE5ODcyMSwyMTk4NzUzLDIxOTg3ODUsMjE5ODgxNywyMTk4ODQ5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwNTUwNSwyMDk4MjQxLDIxMDgzNTMsMjEwODQxNywyMTA1ODI1LDIxMTE3MTMsMjEwMDg5NywyMTExOTA1LDIxMDU0NzMsMjEwNTU2OSwyMTA1NjAxLDIxMTIyODksMjEwODE5MywyMTEyNDgxLDIxMTI1NzcsMjA5ODE3N10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMTYzODUsMjExODcyMSwyMjE2NDE3LDIyMTY0NDksMjIxNjQ4MSwyMjE2NTEzLDIyMTY1NDUsMjIxMTIzMywyMjE2NTc3LDIyMTY2MDksMjIxNjY0MSwyMjE2NjczLDIyMTY3MDUsMjIxNjczNywyMjE2NzM3LDIyMTY3NjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE2ODAxLDIyMTY4MzMsMjIxNjg2NSwyMjE2ODk3LDIyMTY5MjksMjIxNjk2MSwyMjE2OTkzLDIyMTUxNjksMjIxNzAyNSwyMjE3MDU3LDIyMTcwODksMjIxNzEyMSwyMjE3MTU0LDIyMTcyMTcsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMDU5MywyMTkxODA5LDIyMTA2MjUsMjIxMDY1NywyMjEwNjg5LDIyMTA3MjEsMjIxMDc1MywyMjEwNzg1LDIyMTA4MTcsMjIxMDg0OSwyMTkxMjk3LDIyMTA4ODEsMjIxMDkxMywyMjEwOTQ1LDIyMTA5NzcsMjIxMTAwOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwyMTA1ODI1LDAsMCwyMTExOTA1LDIxMDU0NzMsMCwwLDIxMTIyODksMjEwODE5MywyMTEyNDgxLDIxMTI1NzcsMCwyMDk4MzA1LDIxMDgzMjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwyMDk3MTUzLDIxMzQyNDEsMCwyMTMyNzA1LDAsMCwyMTMxMjk3LDAsMjEzMzA4OSwwLDIxMzM4NTcsMCwyMjIwNzY5LDAsMjIzNTM2MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDE0NjgwMDY0LDYyOTE0NTYsNjI5MTQ1NiwxNDY4MDA2NF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzE4NzMsNjI5MTQ1NiwyMTcxOTA1LDYyOTE0NTYsMjE3MTkzNyw2MjkxNDU2LDIxNzE5NjksNjI5MTQ1NiwyMTcyMDAxLDYyOTE0NTYsMjE3MjAzMyw2MjkxNDU2LDIxNzIwNjUsNjI5MTQ1NiwyMTcyMDk3LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjIwOTI5LDIyMjA5MjksNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMzg1NywyMTM0MTQ1LDIxMzQxNDUsMjEzNDE0NSwyMTM0MTQ1LDIxMzQyNDEsMjEzNDI0MSwyMTM0MjQxLDIxMzQyNDEsMjEwNTg4OSwyMTA1ODg5LDIxMDU4ODksMjEwNTg4OSwyMDk3MTg1LDIwOTcxODUsMjA5NzE4NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzM2OTcsMjE3Mzc2MSwyMTczNzkzLDIxNzQxMTMsMjE3Mzk4NSwyMTczOTUzLDIxNDg0ODEsMjE3MzYwMSwyMTczNjMzLDIxNzM2NjUsMjE3MzY5NywyMTczNzI5LDIxNDg4MDEsMjE3Mzc2MSwyMTQzOTY5LDIxNzM3OTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxMDQ5OTYxOSwxMDQ5OTcxNSwxMDQ5OTgxMSwxMDQ5OTkwN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsMCw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDAsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMTQ0MzIyLDIxNDQzODYsMjE0NDQ1MCwyMTQ0NTE0LDIxNDQ1NzgsMjE0NDY0MiwyMTQ0NzA2LDIxNDQ3NzBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjA5ODIwOSwyMTExMTM3LDAsMjA5ODI0MSwyMTA4MzUzLDIxMDg0MTcsMjEwNTgyNSwwLDAsMjExMTkwNSwyMTA1NDczLDIxMDU1NjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjM2MzIxLDIyMzYzNTMsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE1MjE5NCwyMTIxMjgzLDIxMDM2ODQsMjEwMzgxMiwyMDk3OTg2LDIwOTg1MzMsMjA5Nzk5MCwyMDk4NjkzLDIwOTg1OTUsMjA5ODg1MywyMDk5MDEzLDIxMDM5NDAsMjEyMTM3OSwyMTIxNDc1LDIxMjE1NzEsMjEwNDA2OF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDYyNDEsMjIwNjI3MywyMjA2MzA1LDIyMDYzMzcsMjIwNjM2OSwyMjA2NDAxLDIyMDY0MzMsMjIwNjQ2NSwyMjA2NDk3LDIyMDY1MjksMjIwNjU2MSwyMjA2NTkzLDIyMDY2MjUsMjIwNjY1NywyMjA2Njg5LDIyMDY3MjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDE2Nzc3MjE2LDE2Nzc3MjE2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMjMwNjg2NzIsMjMwNjg2NzIsMTA1Mzg4MTgsMTA1Mzg4ODIsNjI5MTQ1Niw2MjkxNDU2LDIxNTAzMzhdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxNDM2OSwyMjE0NDAxLDIyMTQ0MzMsMjIxNDQ2NSwyMjE0NDk3LDIyMTQ1MjksMjIxNDU2MSwyMjE0NTkzLDIxOTQ5NzcsMjIxNDYyNSwyMTk1MDczLDIyMTQ2NTcsMjIxNDY4OSwyMjE0NzIxLDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTcxNTIsMjA5NzE1MiwyMDk3MTUyLDIwOTcxNTIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgyMDgxLDYyOTE0NTYsMjE4MjExMyw2MjkxNDU2LDIxODIxNDUsNjI5MTQ1NiwyMTgyMTc3LDYyOTE0NTYsMjE4MjIwOSw2MjkxNDU2LDIxODIyNDEsNjI5MTQ1NiwyMTgyMjczLDYyOTE0NTYsMjE4MjMwNSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxNDY4ODEsMjE0Njk0NSwyMTQ3MDA5LDIxNDcwNzMsMjE0NzEzNywyMTQ3MjAxLDIxNDcyNjUsMjE0NzMyOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTIyOTE1LDIxMjMwMTEsMjEyMzEwNywyMTA0NzA4LDIxMjMyMDMsMjEyMzI5OSwyMTIzMzk1LDIxMDAxMzMsMjEwNDgzNiwyMTAwMjkwLDIxMDAyOTMsMjEwNDk2MiwyMTA0OTY0LDIwOTgwNTIsMjEyMzQ5MSwyMTIzNTg3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDIxNzExNjksNjI5MTQ1NiwyMTcxMjAxLDYyOTE0NTYsMjE3MTIzMyw2MjkxNDU2LDIxNzEyNjUsNjI5MTQ1NiwyMTcxMjk3LDYyOTE0NTYsMjE3MTMyOSw2MjkxNDU2LDYyOTE0NTYsMjE3MTM2MSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwyMTQ4OTk0LDIxNDkwNTgsMjE0OTEyMiwwLDYyOTE0NTYsMjE0OTE4NiwyMTg2OTQ1LDIxNzM1MzcsMjE0ODk5MywyMTQ5MTIxLDIxNDkwNTgsMTA1MzE0NTgsMTA0OTYwNjYsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTUwMDksMjE5NTA0MSwyMTk1MDczLDIxOTUxMDUsMjE5NTEzNywyMTk1MTY5LDIxOTUyMDEsMjE5NTIzMywyMTk1MjY1LDIxOTUyOTcsMjE5NTMyOSwyMTk1MzYxLDIxOTUzOTMsMjE5NTQyNSwyMTk1NDU3LDIxOTU0ODldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDAsMCw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgyODQ5LDYyOTE0NTYsMjE4Mjg4MSw2MjkxNDU2LDIxODI5MTMsNjI5MTQ1NiwyMTgyOTQ1LDYyOTE0NTYsMjE4Mjk3Nyw2MjkxNDU2LDIxODMwMDksNjI5MTQ1NiwyMTgzMDQxLDYyOTE0NTYsMjE4MzA3Myw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMTU1MywyMjEwMDgxLDIyMTE1ODUsMjIxMTYxNywyMjExNjQ5LDIyMTE2ODEsMjIxMTcxMywyMjExNzQ1LDIyMTE3NzcsMjIxMTgwOSwyMjA5NTY5LDIyMTE4NDEsMjIxMTg3MywyMjExOTA1LDIyMTE5MzcsMjIxMTk2OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMTI1NzcsMjA5ODE3NywyMDk4MzA1LDIxMDgzMjEsMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDEsMjE2NjU5NCwyMTI3Mjk4LDIxNjY2NTgsMjE0Mjk3OCwyMTQxODI3LDIxNjY3MjJdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTczOTg1LDIxNzM3NjEsMjE3NDAxNywyMTc0MDQ5LDIxNzQwODEsMjE3NDExMywyMTc0MTQ1LDIxNzQxNzcsMjE0OTA1NywyMjMzMDU3LDIxNDg0ODEsMjE3MzYwMSwyMTczNjMzLDIxNzM2NjUsMjE3MzY5NywyMTczNzI5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDIxODU3NjEsMjE4NTc5MywyMTg1ODI1LDIxODU4NTcsMjE4NTg4OSwyMTg1OTIxLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjE0ODQ4MSwyMTczNjAxLDIxNzM2MzMsMjE3MzY2NSwyMTczNjk3LDIxNzM3MjksMjE0ODgwMSwyMTczNzYxLDIxNDM5NjksMjE3Mzc5MywyMTczODI1LDIxNTM0NzMsMjE3Mzg1NywyMTczODg5LDIxNzM5MjFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDAsMjIyMDk2MSwyMjIwOTYxLDIyMjA5NjEsMjIyMDk2MSwyMTQ0MTkzLDIxNDQxOTMsMjE1OTIwMSwyMTU5MjAxLDIxNTkyNjUsMjE1OTI2NSwyMTQ0MTk0LDIyMjA5OTMsMjIyMDk5M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTI2NDEsMjIzNTM5MywyMjM1NDI1LDIxNTIyNTcsMjExNjYwOSwyMjM1NDU3LDIyMzU0ODksMjIwMDA2NSwyMjM1NTIxLDIyMzU1NTMsMjIzNTU4NSwyMjEyNDQ5LDIyMzU2MTcsMjIzNTY0OSwyMjM1NjgxLDIyMzU3MTNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTk0MDQ5LDIxOTQwODEsMjE5NDExMywyMTk0MTQ1LDIxOTQxNzcsMjE5NDIwOSwyMTk0MjQxLDIxOTQyNzMsMjE5NDMwNSwyMTk0MzM3LDIxOTQzNjksMjE5NDQwMSwyMTk0NDMzLDIxOTQ0NjUsMjE5NDQ5NywyMTk0NTI5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE5NjY3MywyMjA4NjQxLDIyMDg2NzMsMjIwODcwNSwyMjA4NzM3LDIyMDg3NjksMjIwODgwMSwyMjA4ODMzLDIyMDg4NjUsMjIwODg5NywyMjA4OTI5LDIyMDg5NjEsMjIwODk5MywyMjA5MDI1LDIyMDkwNTcsMjIwOTA4OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxOTE2ODEsMjE5MTcxMywyMTkxNzQ1LDIxOTE3NzcsMjE1MzI4MSwyMTkxODA5LDIxOTE4NDEsMjE5MTg3MywyMTkxOTA1LDIxOTE5MzcsMjE5MTk2OSwyMTkyMDAxLDIxOTIwMzMsMjE5MjA2NSwyMTkyMDk3LDIxOTIxMjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjMwOTQ2LDIyMzEwMTAsMjIzMTA3NCwyMjMxMTM4LDIyMzEyMDIsMjIzMTI2NiwyMjMxMzMwLDIyMzEzOTQsMjIzMTQ1OCwyMjMxNTIyLDIyMzE1ODYsMjIzMTY1MCwyMjMxNzE0LDIyMzE3NzgsMjIzMTg0MiwyMjMxOTA2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjQsMTQ2ODAwNjRdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE4NTk1MywyMTg1OTg1LDIxODYwMTcsMjE4NjA0OSwyMTg2MDgxLDIxODYxMTMsMjE4NjE0NSwyMTg2MTc3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzOTgxMSwyMTM5OTA3LDIwOTcyODQsMjEwNTg2MCwyMTA1OTg4LDIxMDYxMTYsMjEwNjI0NCwyMDk3NDQ0LDIwOTc2MDQsMjA5NzE1NSwxMDQ4NTc3OCwxMDQ4NjM0NCwyMTA2MzcyLDYyOTE0NTYsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjExMDA1MSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDAsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTcyMzg1LDYyOTE0NTYsMjE3MjQxNyw2MjkxNDU2LDIxNzI0NDksNjI5MTQ1NiwyMTcyNDgxLDYyOTE0NTYsMjE3MjUxMyw2MjkxNDU2LDIxNzI1NDUsNjI5MTQ1NiwyMTcyNTc3LDYyOTE0NTYsMjE3MjYwOSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjI0OTM0NSwyMjQ5Mzc3LDIyNDk0MDksMjI0OTQ0MSwyMjQ5NDczLDIyNDk1MDUsMjI0OTUzNywyMjQ5NTcwLDIyMTAyMDksMjI0OTYzMywyMjQ5NjY1LDIyNDk2OTcsMjI0OTcyOSwyMjQ5NzYxLDIyNDk3OTMsMjIxNjc2OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxODcxNjksMjE4NzIwMSwyMTg3MjMzLDIxODcyNjUsMjE4NzI5NywyMTg3MzI5LDIxODczNjEsMjE4NzM5MywyMTg3NDI1LDIxODc0NTcsMjE4NzQ4OSwyMTg3NTIxLDIxODc1NTMsMjE4NzU4NSwyMTg3NjE3LDIxODc2NDldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMCwwLDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTgyMzM3LDYyOTE0NTYsMjE4MjM2OSw2MjkxNDU2LDIxODI0MDEsNjI5MTQ1NiwyMTgyNDMzLDYyOTE0NTYsMjE4MjQ2NSw2MjkxNDU2LDIxODI0OTcsNjI5MTQ1NiwyMTgyNTI5LDYyOTE0NTYsMjE4MjU2MSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzODE3OSwyMTM4Mjc1LDIxMzgzNzEsMjEzODQ2NywyMTM0MjQzLDIxMzQ0MzUsMjEzODU2MywyMTM4NjU5LDIxMzg3NTUsMjEzODg1MSwyMTM4OTQ3LDIxMzkwNDMsMjEzODk0NywyMTM4NzU1LDIxMzkxMzksMjEzOTIzNV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjI1MDQ5OCwyMjUwNTYyLDIyNTA2MjUsMjI1MDY1NywyMjA4MzIxLDIyNTA2ODksMjI1MDcyMSwyMjUwNzUzLDIyNTA3ODUsMjI1MDgxNywyMjUwODQ5LDIyMTg5NDUsMjI1MDg4MSwyMjUwOTEzLDIyNTA5NDUsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzAzNjksMjEwNTU2OSwyMDk4MzA1LDIxMDg0ODEsMjE3MzI0OSw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDAsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDA4OTcsMjExMTkwNSwyMTA1NDczLDIxMDU1NjksMjEwNTYwMSwwLDIxMDgxOTMsMCwwLDAsMjA5ODMwNSwyMTA4MzIxLDIxMDgyODksMjEwMDg2NSwyMTEzMTUzLDIxMDg0ODFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTAwODk3LDIxMDA4OTcsMjEwNTU2OSwyMTA1NTY5LDYyOTE0NTYsMjExMjI4OSwyMTQ5ODI2LDYyOTE0NTYsNjI5MTQ1NiwyMTEyNDgxLDIxMTI1NzcsMjA5ODE3NywyMDk4MTc3LDIwOTgxNzcsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwyMTY5OTUzLDIxNjk5ODUsNjI5MTQ1NiwyMTcwMDE3LDYyOTE0NTYsMjE3MDA0OSwyMTcwMDgxLDYyOTE0NTYsMjE3MDExMywyMTcwMTQ1LDIxNzAxNzcsNjI5MTQ1Niw2MjkxNDU2LDIxNzAyMDksMjE3MDI0MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDAsMCwwLDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIyMDY0MSwyMjIwNjQxLDIyMjA2NzMsMjIyMDY3MywyMjIwNjczLDIyMjA2NzMsMjIyMDcwNSwyMjIwNzA1LDIyMjA3MDUsMjIyMDcwNSwyMjIwNzM3LDIyMjA3MzcsMjIyMDczNywyMjIwNzM3LDIyMjA3NjksMjIyMDc2OV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMjc2NTAsMjEyNzc0NiwyMTI3ODQyLDIxMjc5MzgsMjEyODAzNCwyMTI4MTMwLDIxMjgyMjYsMjEyODMyMiwyMTI4NDE4LDIxMjc1MjMsMjEyNzYxOSwyMTI3NzE1LDIxMjc4MTEsMjEyNzkwNywyMTI4MDAzLDIxMjgwOTldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTQzOTY5LDIxNzM3OTMsMjE3MzgyNSwyMTUzNDczLDIxNzM4NTcsMjE3Mzg4OSwyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTczNzYxLDIxNzQwMTcsMjE3NDA0OSwyMTc0MDgxLDIxNzQxMTMsMjE3NDE0NSwyMTc0MTc3XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIwNDcwNSwyMjA0NzM3LDIyMDQ3NjksMjIwNDgwMSwyMjA0ODMzLDIyMDQ4NjUsMjIwNDg5NywyMjA0OTI5LDIyMDQ5NjEsMjIwNDk5MywyMjA1MDI1LDIyMDUwNTcsMjIwNTA4OSwyMjA1MTIxLDIyMDUxNTMsMjIwNTE4NV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzYzODUsNjI5MTQ1NiwyMTc2NDE3LDYyOTE0NTYsMjE3NjQ0OSw2MjkxNDU2LDIxNzY0ODEsNjI5MTQ1NiwyMTc2NTEzLDYyOTE0NTYsMjE3NjU0NSw2MjkxNDU2LDIxNzY1NzcsNjI5MTQ1NiwyMTc2NjA5LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTk1NTIxLDIxOTU1NTMsMjE5NTU4NSwyMTk1NjE3LDIxOTU2NDksMjE5NTY4MSwyMTE3ODU3LDIxOTU3MTMsMjE5NTc0NSwyMTk1Nzc3LDIxOTU4MDksMjE5NTg0MSwyMTk1ODczLDIxOTU5MDUsMjE5NTkzNywyMTk1OTY5XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTczOTIxLDIxNzM5NTMsMjE3Mzk4NSwyMTc0MDE3LDIxNzQwMTcsMjE3NDA0OSwyMTc0MDgxLDIxNzQxMTMsMjE3NDE0NSwyMTc0MTc3LDIxNDkwNTcsMjIzMzA4OSwyMTczNjk3LDIxNzM3NjEsMjE3Mzc5MywyMTc0MTEzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMTU4NiwyMTMyNDUwLDIxMzU5NzAsMjEzNTc3OCwyMTYxNjAyLDIxMzYxNjIsMjE2MzY1MCwyMTYxNzk0LDIxMzU1ODYsMjE2MzcxNCwyMTM3MTg2LDIxMzE4MTAsMjE2MDI5MCwyMTM1MTcwLDIwOTc1MDYsMjE1OTU1NF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzQxNDUsMjA5NzE1MywyMTM0MjQxLDIxMDU5NTMsMjEzMjcwNSwyMTMwOTc3LDIxNjAwNjUsMjEzMTI5NywyMTYyMDQ5LDIxMzMwODksMjE2MDU3NywyMTMzODU3LDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTE2NTEzLDIxMTY2MDksMjExNjcwNSwyMTE2ODAxLDIxMTY4OTcsMjExNjk5MywyMTE3MDg5LDIxMTcxODUsMjExNzI4MSwyMTE3Mzc3LDIxMTc0NzMsMjExNzU2OSwyMTE3NjY1LDIxMTc3NjEsMjExNzg1NywyMTE3OTUzXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwMDczNywyMDk4MzM3LDIxMDE0NDEsMjEwMTU2OSwyMTAxNjk3LDIxMDE4MjUsMjEwMTk1MywyMTAyMDgxLDIxMDIyMDksMjEwMDgwMiwyMTAxMTU0LDIxMDEyODIsMjEwMTQxMCwyMTAxNTM4LDIxMDE2NjYsMjEwMTc5NF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDAyODksMjA5ODY1NywyMDk4MDQ5LDIyMDA3MzcsMjEyMzQ4OSwyMTIzNjgxLDIyMDA3NjksMjA5ODYyNSwyMTAwMzIxLDIwOTgxNDUsMjEwMDQ0OSwyMDk4MDE3LDIwOTg3NTMsMjA5ODk3NywyMTUwMjQxLDIxNTAzMDVdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTA5OTU1LDYyOTE0NTYsNjI5MTQ1NiwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjgsMTg4NzQzNjhdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsNjI5MTQ1NiwwLDYyOTE0NTYsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzMDk3OSwyMTMxMDc1LDIxMzEwNzUsMjEzMTE3MSwyMTMxMjY3LDIxMzEzNjMsMjEzMTQ1OSwyMTMxNTU1LDIxMzE2NTEsMjEzMTY1MSwyMTMxNzQ3LDIxMzE4NDMsMjEzMTkzOSwyMTMyMDM1LDIxMzIxMzEsMjEzMjIyN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzAsMjE3Nzc5Myw2MjkxNDU2LDIxNzc4MjUsNjI5MTQ1NiwyMTc3ODU3LDYyOTE0NTYsMjE3Nzg4OSw2MjkxNDU2LDIxNzc5MjEsNjI5MTQ1NiwyMTc3OTUzLDYyOTE0NTYsMjE3Nzk4NSw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTEzMzQ1LDAsMjA5ODIwOSwyMTExMTM3LDIxMDU1MDUsMjA5ODI0MSwyMTA4MzUzLDIxMDg0MTcsMjEwNTgyNSwyMTExNzEzLDIxMDA4OTcsMjExMTkwNSwyMTA1NDczLDIxMDU1NjksMjEwNTYwMSwyMTEyMjg5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzNjY0MywyMTM2NzM5LDIxMzY4MzUsMjEzNjkzMSwyMTM3MDI3LDIxMzcxMjMsMjEzNzIxOSwyMTM3MzE1LDIxMzc0MTEsMjEzNzUwNywyMTM3NjAzLDIxMzc2OTksMjEzNzc5NSwyMTM3ODkxLDIxMzc5ODcsMjEzODA4M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTc0NDMzLDYyOTE0NTYsMjE3NDQ2NSw2MjkxNDU2LDIxNzQ0OTcsNjI5MTQ1NiwyMTc0NTI5LDYyOTE0NTYsMjE3NDU2MSw2MjkxNDU2LDIxNzQ1OTMsNjI5MTQ1NiwyMTc0NjI1LDYyOTE0NTYsMjE3NDY1Nyw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDU0NzMsMjEwNTU2OSwyMTA1NjAxLDIxMTIyODksMjEwODE5MywyMTEyNDgxLDIxMTI1NzcsMjA5ODE3NywyMDk4MzA1LDIxMDgzMjEsMjEwODI4OSwyMTAwODY1LDIxMTMxNTMsMjEwODQ4MSwyMTEzMzQ1LDIxMTM0NDFdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsxMDQ5NjU0NywxMDQ5NjY0MywyMTA1NTA1LDIxNDk2OTgsNjI5MTQ1NiwxMDQ5NjczOSwxMDQ5NjgzNSwyMTcwMjczLDYyOTE0NTYsMjE0OTc2MiwyMTA1ODI1LDIxMTE3MTMsMjExMTcxMywyMTExNzEzLDIxMTE3MTMsMjE2ODY3M10pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMjE0MzQ5MCwyMTQzNDkwLDIxNDM0OTAsMjE3MTY0OSw2MjkxNDU2LDIxNzE2ODEsMjE3MTcxMywyMTcxNzQ1LDYyOTE0NTYsMjE3MTc3Nyw2MjkxNDU2LDIxNzE4MDksNjI5MTQ1NiwyMTcxODQxLDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTU5MTA2LDIxNTkxMDYsMjE1OTE3MCwyMTU5MTcwLDIxNTkyMzQsMjE1OTIzNCwyMTU5Mjk4LDIxNTkyOTgsMjE1OTI5OCwyMTU5MzYyLDIxNTkzNjIsMjE1OTM2MiwyMTA2NDAxLDIxMDY0MDEsMjEwNjQwMSwyMTA2NDAxXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwNTYwMSwyMTEyMjg5LDIxMDgxOTMsMjExMjQ4MSwyMTEyNTc3LDIwOTgxNzcsMjA5ODMwNSwyMTA4MzIxLDIxMDgyODksMjEwMDg2NSwyMTEzMTUzLDIxMDg0ODEsMjExMzM0NSwyMTEzNDQxLDIwOTgyMDksMjExMTEzN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDg0MTcsMjE4MTIxNywyMTgxMjQ5LDIxODEyODEsMjE3MDQzMywyMTcwNDAxLDIxODEzMTMsMjE4MTM0NSwyMTgxMzc3LDIxODE0MDksMjE4MTQ0MSwyMTgxNDczLDIxODE1MDUsMjE4MTUzNywyMTcwNTI5LDIxODE1NjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjE4NDMzLDIyNDU3NjEsMjI0NTc5MywyMjQ1ODI1LDIyNDU4NTcsMjI0NTg5MCwyMjQ1OTUzLDIyNDU5ODYsMjIwOTY2NSwyMjQ2MDUwLDIyNDYxMTMsMjI0NjE0NiwyMjQ2MjEwLDIyNDYyNzQsMjI0NjMzNywyMjQ2MzY5XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIzMDc1NCwyMjMwODE4LDIyMzA4ODIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDAsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjE4NDEyOSw2MjkxNDU2LDIxODQxNjEsNjI5MTQ1NiwyMTg0MTkzLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMTQ2ODE4LDIxODMzNjEsNjI5MTQ1Niw2MjkxNDU2LDIxNDI5NzgsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTM1MTcwLDIwOTc1MDYsMjEzMDY5MSwyMTMwNzg3LDIxMzA4ODMsMjE2Mzk3MCwyMTY0MDM0LDIxNjQwOTgsMjE2NDE2MiwyMTY0MjI2LDIxNjQyOTAsMjE2NDM1NCwyMTY0NDE4LDIxNjQ0ODIsMjE2NDU0NiwyMTMzMTIyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEwODUxNSwyMTA4NjExLDIxMDA3NDAsMjEwODcwNywyMTA4ODAzLDIxMDg4OTksMjEwODk5NSwyMTA5MDkxLDIxMDkxODcsMjEwOTI4MywyMTA5Mzc5LDIxMDk0NzUsMjEwOTU3MSwyMTA5NjY3LDIxMDk3NjMsMjEwMDczOF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDI3ODgsMjEwMjkxNiwyMTAzMDQ0LDIxMjA1MTUsMjEwMzE3MiwyMTIwNjExLDIxMjA3MDcsMjA5ODM3MywyMTAzMzAwLDIxMjA4MDMsMjEyMDg5OSwyMTIwOTk1LDIxMDM0MjgsMjEwMzU1NiwyMTIxMDkxLDIxMjExODddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTU4MDgyLDIxNTgxNDYsMCwyMTU4MjEwLDIxNTgyNzQsMCwyMTU4MzM4LDIxNTg0MDIsMjE1ODQ2NiwyMTI5OTIyLDIxNTg1MzAsMjE1ODU5NCwyMTU4NjU4LDIxNTg3MjIsMjE1ODc4NiwyMTU4ODUwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMTA0OTk2MTksMTA0OTk3MTUsMTA0OTk4MTEsMTA0OTk5MDcsMTA1MDAwMDMsMTA1MDAwOTksMTA1MDAxOTUsMTA1MDAyOTEsMTA1MDAzODcsMTA1MDA0ODMsMTA1MDA1NzksMTA1MDA2NzUsMTA1MDA3NzEsMTA1MDA4NjcsMTA1MDA5NjMsMTA1MDEwNTldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMjM5NTg1LDIyMzk2MTgsMjIzOTY4MSwyMjM5NzEzLDAsMjE5MTk2OSwyMjM5NzQ1LDIyMzk3NzcsMjE5MjAzMywyMjM5ODA5LDIyMzk4NDEsMjIzOTg3NCwyMjM5OTM3LDIyMzk5NzAsMjI0MDAzMywyMjQwMDY1XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjI1MjcwNSwyMjUyNzM4LDIyNTI4MDEsMjI1MjgzMywyMjUyODY1LDIyNTI4OTcsMjI1MjkzMCwyMjUyOTk0LDIyNTMwNTcsMjI1MzA4OSwyMjUzMTIxLDIyNTMxNTQsMjI1MzIxNywyMjUzMjUwLDIyMTkzNjEsMjIxOTM2MV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMDU4MjUsMjExMTcxMywyMTAwODk3LDIxMTE5MDUsMjEwNTQ3MywyMTA1NTY5LDIxMDU2MDEsMjExMjI4OSwyMTA4MTkzLDIxMTI0ODEsMjExMjU3NywyMDk4MTc3LDIwOTgzMDUsMjEwODMyMSwyMTA4Mjg5LDIxMDA4NjVdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDEwNTM4MDUwLDEwNTM4MTE0LDEwNTM4MTc4LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIyNjQwMiwyMjI2NDY2LDIyMjY1MzAsMjIyNjU5NCwyMjI2NjU4LDIyMjY3MjIsMjIyNjc4NiwyMjI2ODUwLDIyMjY5MTQsMjIyNjk3OCwyMjI3MDQyLDIyMjcxMDYsMjIyNzE3MCwyMjI3MjM0LDIyMjcyOTgsMjIyNzM2Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjE0NDA2NiwyMTQ0MTMwLDIxNDQxOTQsMjE0NDI1OCw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMjQ2NzQsMjEyNDc3MCwyMTIzODc1LDIxMjM5NzEsMjEyNDA2NywyMTI0MTYzLDIxMjQyNTksMjEyNDM1NSwyMTI0NDUxLDIxMjQ1NDcsMjEyNDY0MywyMTI0NzM5LDIxMjQ4MzUsMjEyNDkzMSwyMTI1MDI3LDIxMjUxMjNdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTY4MDY1LDYyOTE0NTYsMjE2ODA5Nyw2MjkxNDU2LDIxNjgxMjksNjI5MTQ1NiwyMTY4MTYxLDYyOTE0NTYsMjE2ODE5Myw2MjkxNDU2LDIxNjgyMjUsNjI5MTQ1NiwyMTY4MjU3LDYyOTE0NTYsMjE2ODI4OSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIxMDA2MTAsMjEwMDYxMSw2MjkxNDU2LDIxMDc4NDIsMjEwNzg0Myw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDEwNTM3OTIyLDYyOTE0NTYsMTA1Mzc5ODYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNzQ4NDksMjE3NDg4MSwyMTc0OTEzLDIxNzQ5NDUsMjE3NDk3NywyMTc1MDA5LDIxNzUwNDEsMjE3NTA3MywyMTc1MTA1LDIxNzUxMzcsMjE3NTE2OSwyMTc1MjAxLDIxNzUyMzMsMjE3NTI2NSwyMTc1Mjk3LDIxNzUzMjldKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTU0NTYyLDIxNTQ2MjYsMjE1NDY5MCwyMTU0NzU0LDIxNDE4NTgsMjE1NDgxOCwyMTU0ODgyLDIxMjcyOTgsMjE1NDk0NiwyMTI3Mjk4LDIxNTUwMTAsMjE1NTA3NCwyMTU1MTM4LDIxNTUyMDIsMjE1NTI2NiwyMTU1MjAyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIyMDA2NDEsMjE1MDc4NiwyMTUwODUwLDIxNTA5MTQsMjE1MDk3OCwyMTUxMDQyLDIxMDY1NjIsMjE1MTEwNiwyMTUwNTYyLDIxNTExNzAsMjE1MTIzNCwyMTUxMjk4LDIxNTEzNjIsMjE1MTQyNiwyMTUxNDkwLDIxNTE1NTRdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwwLDAsMCwwLDAsMCwwLDAsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIyMDI4OSwyMjIwMjg5LDIyMjAzMjEsMjIyMDMyMSwyMjIwMzIxLDIyMjAzMjEsMjIyMDM1MywyMjIwMzUzLDIyMjAzNTMsMjIyMDM1MywyMjIwMzg1LDIyMjAzODUsMjIyMDM4NSwyMjIwMzg1LDIyMjA0MTcsMjIyMDQxN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxNTUzMzAsMjE1NTM5NCwwLDIxNTU0NTgsMjE1NTUyMiwyMTU1NTg2LDIxMDU3MzIsMCwyMTU1NjUwLDIxNTU3MTQsMjE1NTc3OCwyMTI1MzE0LDIxNTU4NDIsMjE1NTkwNiwyMTI2Mjc0LDIxNTU5NzBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsMjMwNjg2NzIsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTZdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFs2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDAsMCwwLDAsMCwwXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjA5NzcyOSwyMTA2MDE3LDIxMDYwMTcsMjEwNjAxNywyMTA2MDE3LDIxMzEyOTcsMjEzMTI5NywyMTMxMjk3LDIxMzEyOTcsMjEwNjA4MSwyMTA2MDgxLDIxNjIwNDksMjE2MjA0OSwyMTA1OTUzLDIxMDU5NTMsMjE2MjMzN10pLFxuICBuZXcgVWludDMyQXJyYXkoWzIwOTcxODUsMjA5NzY5NywyMDk3Njk3LDIwOTc2OTcsMjA5NzY5NywyMTM1Nzc3LDIxMzU3NzcsMjEzNTc3NywyMTM1Nzc3LDIwOTczNzcsMjA5NzM3NywyMDk3Mzc3LDIwOTczNzcsMjA5NzYwMSwyMDk3NjAxLDIwOTcyMTddKSxcbiAgbmV3IFVpbnQzMkFycmF5KFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyMzA2ODY3Ml0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIxMzkzMzEsMjEzOTQyNywyMTM5NTIzLDIxMzkwNDMsMjEzMzU3MSwyMTMyNjExLDIxMzk2MTksMjEzOTcxNSwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTc0MTEzLDIxNzQxNDUsMjEwMDg5NywyMDk4MTc3LDIxMDgyODksMjEwMDg2NSwyMTczNjAxLDIxNzM2MzMsMjE3Mzk4NSwyMTc0MTEzLDIxNzQxNDUsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDIzMDY4NjcyLDYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMjMwNjg2NzIsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsNjI5MTQ1Nl0pLFxuICBuZXcgVWludDMyQXJyYXkoWzIzMDY4NjcyLDIzMDY4NjcyLDE4OTIzNzc4LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDE4OTIzODQyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyLDE4OTIzOTA2LDIzMDY4NjcyLDIzMDY4NjcyLDIzMDY4NjcyXSksXG4gIG5ldyBVaW50MzJBcnJheShbMjEzNDE0NSwyMDk3MTUzLDIxMzQyNDEsMCwyMTMyNzA1LDIxMzA5NzcsMjE2MDA2NSwyMTMxMjk3LDAsMjEzMzA4OSwwLDIxMzM4NTcsMCwwLDAsMF0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1Niw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMTc3NTM3LDYyOTE0NTYsMjE3NzU2OSw2MjkxNDU2LDIxNzc2MDEsNjI5MTQ1NiwyMTc3NjMzLDYyOTE0NTYsMjE3NzY2NSw2MjkxNDU2LDIxNzc2OTcsNjI5MTQ1NiwyMTc3NzI5LDYyOTE0NTYsMjE3Nzc2MSw2MjkxNDU2XSksXG4gIG5ldyBVaW50MzJBcnJheShbMjIxMjQ4MSwyMjEyNTEzLDIyMTI1NDUsMjIxMjU3NywyMTk3MTIxLDIyMTI2MDksMjIxMjY0MSwyMjEyNjczLDIyMTI3MDUsMjIxMjczNywyMjEyNzY5LDIyMTI4MDEsMjIxMjgzMywyMjEyODY1LDIyMTI4OTcsMjIxMjkyOV0pLFxuICBuZXcgVWludDMyQXJyYXkoWzYyOTE0NTYsNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTYsMCwwLDAsMCwwLDAsMCwwLDBdKSxcbiAgbmV3IFVpbnQzMkFycmF5KFsyMDk4MjQxLDIxMDgzNTMsMjE3MDIwOSwyMTA1ODI1LDIxMTE3MTMsMjEwMDg5NywyMTExOTA1LDIxMDU0NzMsMjEwNTU2OSwyMTA1NjAxLDIxMTIyODksNjI5MTQ1NiwyMTA4MTkzLDIxNzI0MTcsMjExMjQ4MSwyMDk4MTc3XSksXG4gIG5ldyBVaW50MzJBcnJheShbNjI5MTQ1NiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3MiwyMzA2ODY3Miw2MjkxNDU2LDYyOTE0NTZdKSxcbl07XG52YXIgYmxvY2tJZHhlcyA9IG5ldyBVaW50MTZBcnJheShbNjE2LDYxNiw1NjUsMTQ3LDE2MSw0MTEsMzMwLDIsMTMxLDEzMSwzMjgsNDU0LDI0MSw0MDgsODYsODYsNjk2LDExMywyODUsMzUwLDMyNSwzMDEsNDczLDIxNCw2MzksMjMyLDQ0Nyw2NCwzNjksNTk4LDEyNCw2NzIsNTY3LDIyMyw2MjEsMTU0LDEwNyw4Niw4Niw4Niw4Niw4Niw4Niw1MDUsODYsNjgsNjM0LDg2LDIxOCwyMTgsMjE4LDIxOCw0ODYsMjE4LDIxOCw1MTMsMTg4LDYwOCwyMTYsODYsMjE3LDQ2Myw2NjgsODUsNzAwLDM2MCwxODQsODYsODYsODYsNjQ3LDQwMiwxNTMsMTAsMzQ2LDcxOCw2NjIsMjYwLDE0NSwyOTgsMTE3LDEsNDQzLDM0MiwxMzgsNTQsNTYzLDg2LDI0MCw1NzIsMjE4LDcwLDM4Nyw4NiwxMTgsNDYwLDY0MSw2MDIsODYsODYsMzA2LDIxOCw4Niw2OTIsODYsODYsODYsODYsODYsMTYyLDcwNyw4Niw0NTgsMjYsODYsMjE4LDYzOCw4Niw4Niw4Niw4Niw4Niw2NSw0NDksODYsODYsMzA2LDE4Myw4Niw1OCwzOTEsNjY3LDg2LDE1NywxMzEsMTMxLDEzMSwxMzEsODYsNDMzLDEzMSw0MDYsMzEsMjE4LDI0Nyw4Niw4Niw2OTMsMjE4LDU4MSwzNTEsODYsNDM4LDI5NSw2OSw0NjIsNDUsMTI2LDE3Myw2NTAsMTQsMjk1LDY5LDk3LDE2OCwxODcsNjQxLDc4LDUyMywzOTAsNjksMTA4LDI4Nyw2NjQsMTczLDIxOSw4MywyOTUsNjksMTA4LDQzMSw0MjYsMTczLDY5NCw0MTIsMTE1LDYyOCw1MiwyNTcsMzk4LDY0MSwxMTgsNTAxLDEyMSw2OSw1NzksMTUxLDQyMywxNzMsNjIwLDQ2NCwxMjEsNjksMzgyLDE1MSw0NzYsMTczLDI3LDUzLDEyMSw4Niw1OTQsNTc4LDIyNiwxNzMsODYsNjMyLDEzMCw4Niw5NiwyMjgsMjY4LDY0MSw2MjIsNTYzLDg2LDg2LDIxLDE0OCw2NTAsMTMxLDEzMSwzMjEsNDMsMTQ0LDM0MywzODEsNTMxLDEzMSwxMzEsMTc4LDIwLDg2LDM5OSwxNTYsMzc1LDE2NCw1NDEsMzAsNjAsNzE1LDE5OCw5MiwxMTgsMTMxLDEzMSw4Niw4NiwzMDYsNDA3LDg2LDI4MCw0NTcsMTk2LDQ4OCwzNTgsMTMxLDEzMSwyNDQsODYsODYsMTQzLDg2LDg2LDg2LDg2LDg2LDY2Nyw1NjMsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsMzM2LDM2Myw4Niw4NiwzMzYsODYsODYsMzgwLDY3OCw2Nyw4Niw4Niw4Niw2NzgsODYsODYsODYsNTEyLDg2LDMwNyw4Niw3MDgsODYsODYsODYsODYsODYsNTI4LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDU2MywzMDcsODYsODYsODYsODYsODYsMTA0LDQ1MCwzMzcsODYsNzIwLDg2LDMyLDQ1MCwzOTcsODYsODYsODYsNTg3LDIxOCw1NTgsNzA4LDcwOCwyOTMsNzA4LDg2LDg2LDg2LDg2LDg2LDY5NCwyMDUsODYsOCw4Niw4Niw4Niw4Niw1NDksODYsNjY3LDY5Nyw2OTcsNjc5LDg2LDQ1OCw0NjAsODYsODYsNjUwLDg2LDcwOCw1NDMsODYsODYsODYsMjQ1LDg2LDg2LDg2LDE0MCwyMTgsMTI3LDcwOCw3MDgsNDU4LDE5NywxMzEsMTMxLDEzMSwxMzEsNTAwLDg2LDg2LDQ4MywyNTEsODYsMzA2LDUxMCw1MTUsODYsNzIyLDg2LDg2LDg2LDY1LDIwMSw4Niw4Niw0ODMsNTgwLDQ3MCw4Niw4Niw4NiwzNjgsMTMxLDEzMSwxMzEsNjk0LDExNCwxMTAsNTU1LDg2LDg2LDEyMyw3MjEsMTYzLDE0Miw3MTMsNDE4LDg2LDMxNyw2NzUsMjA5LDIxOCwyMTgsMjE4LDM3MSw1NDUsNTkyLDYyOSw0OTAsNjAzLDE5OSw0NiwzMjAsNTI1LDY4MCwzMTAsMjc5LDM4OCwxMTEsNDIsMjUyLDU5Myw2MDcsMjM1LDYxNyw0MTAsMzc3LDUwLDU0OCwxMzUsMzU2LDE3LDUyMCwxODksMTE2LDM5Miw2MDAsMzQ5LDMzMiw0ODIsNjk5LDY5MCw1MzUsMTE5LDEwNiw0NTEsNzEsMTUyLDY2NywxMzEsMjE4LDIxOCwyNjUsNjcxLDYzNyw0OTIsNTA0LDUzMyw2ODMsMjY5LDI2OSw2NTgsODYsODYsODYsODYsODYsODYsODYsODYsODYsNDkxLDYxOSw4Niw4Niw2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDIyOSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw2NjcsODYsODYsMTcxLDEzMSwxMTgsMTMxLDY1NiwyMDYsMjM0LDU3MSw4OSwzMzQsNjcwLDI0NiwzMTEsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsNTM0LDg2LDg2LDg2LDg2LDg2LDg2LDgyLDg2LDg2LDg2LDg2LDg2LDQzMCw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw1OTksODYsMzI0LDg2LDQ3MCw2OSw2NDAsMjY0LDEzMSw2MjYsMTAxLDE3NCw4Niw4Niw2NjcsMjMzLDEwNSw3MywzNzQsMzk0LDIyMSwyMDQsODQsMjgsMzI2LDg2LDg2LDQ3MSw4Niw4Niw4NiwxMDksNTczLDg2LDE3MSwyMDAsMjAwLDIwMCwyMDAsMjE4LDIxOCw4Niw4Niw4Niw4Niw0NjAsMTMxLDEzMSwxMzEsODYsNTA2LDg2LDg2LDg2LDg2LDg2LDIyMCw0MDQsMzQsNjE0LDQ3LDQ0MiwzMDUsMjUsNjEyLDMzOCw2MDEsNjQ4LDcsMzQ0LDI1NSwxMzEsMTMxLDUxLDg2LDMxMiw1MDcsNTYzLDg2LDg2LDg2LDg2LDU4OCw4Niw4Niw4Niw4Niw4Niw1MzAsNTExLDg2LDQ1OCwzLDQzNSwzODQsNTU2LDUyMiwyMzAsNTI3LDg2LDExOCw4Niw4Niw3MTcsODYsMTM3LDI3Myw3OSwxODEsNDg0LDIzLDkzLDExMiw2NTUsMjQ5LDQxNyw3MDMsMzcwLDg3LDk4LDMxMyw2ODQsNTg1LDE1NSw0NjUsNTk2LDQ4MSw2OTUsMTgsNDE2LDQyOCw2MSw3MDEsNzA2LDI4Miw2NDMsNDk1LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDU0OSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw1NDksMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4NiwzMDcsODYsODYsODYsMTcxLDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDY1MCwxMzEsNDIyLDU0Miw0MjAsMjYzLDI0LDE3Miw4Niw4Niw4Niw4Niw4Niw1NjYsODYsODYsMTMyLDU0MCwzOTUsMzUzLDQ5NCw1MTksMTksNDg1LDI4NCw0NzIsMTMxLDEzMSwxMzEsMTYsNzE0LDg2LDIxMSw3MDgsODYsODYsODYsNjk0LDY5OCw4Niw4Niw0ODMsNzA0LDcwOCwyMTgsMjcyLDg2LDg2LDEyMCw4NiwxNTksNDc4LDg2LDMwNywyNDcsODYsODYsNjYzLDU5Nyw0NTksNjI3LDY2Nyw4Niw4NiwyNzcsNDU1LDM5LDMwMiw4NiwyNTAsODYsODYsODYsMjcxLDk5LDQ1MiwzMDYsMjgxLDMyOSw0MDAsMjAwLDg2LDg2LDM2Miw1NDksMzUyLDY0Niw0NjEsMzIzLDU4Niw4Niw4Niw0LDcwOCw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw3MTcsODYsNTE4LDg2LDg2LDY1MCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMjUsNTU0LDQ4MCwzMDAsNjEzLDcyLDMzMywyODgsNTYxLDU0NCw2MDQsNDgsNzE5LDkxLDE2OSwxNzYsNTkwLDIyNCw3NiwxOTEsMjksNTU5LDU2MCwyMzEsNTM3LDE2Niw0NzcsNTM4LDI1Niw0MzcsMTMxLDEzMSw0NjksMTY3LDQwLDAsNjg1LDI2Niw0NDEsNzA1LDIzOSw2NDIsNDc1LDU2OCw2NDAsNjEwLDI5OSw2NzMsNTE3LDMxOCwzODUsMjIsMjAyLDE4MCwxNzksMzU5LDQyNCwyMTUsOTAsNjYsNTIxLDY1Myw0NjcsNjgyLDQ1Myw0MDksNDc5LDg4LDEzMSw2NjEsMzUsMzAzLDE1LDI2Miw2NjYsNjMwLDcxMiwxMzEsMTMxLDYxOCw2NTksMTc1LDIxOCwxOTUsMzQ3LDE5MywyMjcsMjYxLDE1MCwxNjUsNzA5LDU0NiwyOTQsNTY5LDcxMCwyNzAsNDEzLDM3Niw1MjQsNTUsMjQyLDM4LDQxOSw1MjksMTcwLDY1NywzLDMwNCwxMjIsMzc5LDI3OCwxMzEsNjUxLDg2LDY3LDU3Niw0NTgsNDU4LDEzMSwxMzEsODYsODYsODYsODYsODYsODYsODYsMTE4LDMwOSw4Niw4Niw1NDcsODYsODYsODYsODYsNjY3LDY1MCw2NjQsMTMxLDEzMSw4Niw4Niw1NiwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDg2LDMwNyw4Niw4Niw4Niw2NjQsMjM4LDY1MCw4Niw4Niw3MTcsODYsMTE4LDg2LDg2LDMxNSw4Niw1OSw4Niw4Niw1NzQsNTQ5LDEzMSwxMzEsMzQwLDU3LDQzNiw4Niw4Niw4Niw4Niw4Niw4Niw0NTgsNzA4LDQ5OSw2OTEsNjIsODYsNjUwLDg2LDg2LDY5NCw4Niw4Niw4NiwzMTksMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsMTcxLDg2LDU0OSw2OTQsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsNzcsODYsODYsMTM5LDg2LDUwMiw4Niw4Niw4Niw2NjcsNTk1LDEzMSwxMzEsMTMxLDg2LDEyLDg2LDEzLDg2LDYwOSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsNjI1LDg2LDY2OSw4Niw4NiwxODIsMTI5LDg2LDUsNjk0LDEwNCw4Niw4Niw4Niw4NiwxMzEsMTMxLDg2LDg2LDM4NiwxNzEsODYsODYsODYsMzQ1LDg2LDMyNCw4Niw1ODksODYsMjEzLDM2LDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsMTA0LDEzMSwxMzEsMTMxLDE0MSwyOTAsODAsNjc3LDg2LDg2LDg2LDI2NywxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsNjY3LDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDUxNSw4Niw4NiwzMywxMzYsNjY5LDg2LDcxMSw1MTUsODYsODYsNTUwLDY0MCw4NiwxMDQsNzA4LDUxNSw4NiwxNTksMzcyLDcxNyw4Niw4Niw0NDQsNTE1LDg2LDg2LDY2MywzNyw4Niw1NjMsNDYwLDg2LDM5MCw2MjQsNzAyLDEzMSwxMzEsMTMxLDEzMSwzODksNTksNzA4LDg2LDg2LDM0MSwyMDgsNzA4LDYzNSwyOTUsNjksMTA4LDQzMSw1MDgsMTAwLDE5MCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDg2LDg2LDg2LDY0OSw1MTYsNjYwLDEzMSwxMzEsODYsODYsODYsMjE4LDYzMSw3MDgsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDg2LDg2LDM0MSw1NzUsMjM4LDUxNCwxMzEsMTMxLDg2LDg2LDg2LDIxOCwyOTEsNzA4LDMwNywxMzEsODYsODYsMzA2LDM2Nyw3MDgsMTMxLDEzMSwxMzEsODYsMzc4LDY5Nyw4NiwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsNjE1LDI1Myw4Niw4Niw4NiwyOTIsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDg2LDg2LDg2LDEwNCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsNjksODYsMzQxLDU1Myw1NDksODYsMzA3LDg2LDg2LDY0NSwyNzUsNDU1LDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw3MDgsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsODYsNjY3LDQ2MCw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw3MTcsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsNjY3LDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4NiwxNzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4NiwxMDQsODYsNjY3LDQ1OSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSw4Niw0NTgsMjI1LDg2LDg2LDg2LDUxNiw1NDksMTEsMzkwLDQwNSw4NiwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsNDYwLDQ0LDIxOCwxOTcsNzExLDUxNSwxMzEsMTMxLDEzMSwxMzEsNjY0LDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4NiwzMDcsMTMxLDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDMwOCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsNjQwLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsODYsMTE4LDMwNywxMDQsMjg2LDU5MSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw1NDksODYsODYsNjgxLDg2LDg2LDc1LDE4NSwzMTQsNTgyLDg2LDM1OCw0OTYsNDc0LDg2LDEwNCwxMzEsODYsODYsODYsODYsMTQ2LDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsMTcxLDg2LDY0MCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDI0Niw1MDMsNjg5LDMzOSw2NzQsODEsMjU4LDQxNSw0MzksMTI4LDU2MiwzNjYsNDE0LDI0Niw1MDMsNjg5LDU4MywyMjIsNTU3LDMxNiw2MzYsNjY1LDE4NiwzNTUsOTUsNjcwLDI0Niw1MDMsNjg5LDMzOSw2NzQsNTU3LDI1OCw0MTUsNDM5LDE4NiwzNTUsOTUsNjcwLDI0Niw1MDMsNjg5LDQ0Niw2NDQsNTM2LDY1MiwzMzEsNTMyLDMzNSw0NDAsMjc0LDQyMSwyOTcsNTcwLDc0LDQyNSwzNjQsNDI1LDYwNiw1NTIsNDAzLDUwOSwxMzQsMzY1LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDIxOCwyMTgsMjE4LDQ5OCwyMTgsMjE4LDU3Nyw2MjcsNTUxLDQ5Nyw1NzIsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDU1MywzNTQsMjM2LDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsMjk2LDQ1NSwxMzEsMTMxLDQ1NiwyNDMsMTAzLDg2LDQxLDQ1OSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDksMjc2LDE1OCw3MTYsMzkzLDU2NCwzODMsNDg5LDQwMSw2NTQsMjEwLDY1NCwxMzEsMTMxLDEzMSw2NDAsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDg2LDg2LDY1MCw4Niw4Niw4Niw4Niw4Niw4Niw3MTcsNjY3LDU2Myw1NjMsNTYzLDg2LDU0OSwxMDIsNjg2LDEzMywyNDYsNjA1LDg2LDQ0OCw4Niw4NiwyMDcsMzA3LDEzMSwxMzEsMTMxLDY0MSw4NiwxNzcsNjExLDQ0NSwzNzMsMTk0LDU4NCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsMzA4LDMwNywxNzEsODYsODYsODYsODYsODYsODYsODYsNzE3LDg2LDg2LDg2LDg2LDg2LDQ2MCwxMzEsMTMxLDY1MCw4Niw4Niw4Niw2OTQsNzA4LDg2LDg2LDY5NCw4Niw0NTgsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsNjY3LDY5NCwyODksNjUwLDY2NywxMzEsMTMxLDg2LDY0MCwxMzEsMTMxLDY2NCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4NiwxNzEsMTMxLDEzMSw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw4Niw0NjAsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsODYsNDU4LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDg2LDY0MCwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsNDY2LDIwMywxNDksNDI5LDk0LDQzMiwxNjAsNjg3LDUzOSw2MywyMzcsMjgzLDE5MiwyNDgsMzQ4LDI1OSw0MjcsNTI2LDM5Niw2NzYsMjU0LDQ2OCw0ODcsMjEyLDMyNyw2MjMsNDksNjMzLDMyMiw0OTMsNDM0LDY4OCwzNTcsMzYxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMSwxMzEsMTMxLDEzMV0pO1xudmFyIG1hcHBpbmdTdHIgPSBcIti12YTZiSDYp9mE2YTZhyDYudmE2YrZhyDZiNiz2YTZhdis2YQg2KzZhNin2YTZh+OCreODreODoeODvOODiOODq3JhZOKIlXMy44Ko44K544Kv44O844OJ44Kt44Ot44Kw44Op44Og44Kt44Ot44Ov44OD44OI44Kw44Op44Og44OI44Oz44Kv44Or44K844Kk44Ot44K144Oz44OB44O844Og44OR44O844K744Oz44OI44OU44Ki44K544OI44Or44OV44Kh44Op44OD44OJ44OW44OD44K344Kn44Or44OY44Kv44K/44O844Or44Oe44Oz44K344On44Oz44Of44Oq44OQ44O844Or44Os44Oz44OI44Ky44Oz4oCy4oCy4oCy4oCyMeKBhDEwdmlpaSgxMCkoMTEpKDEyKSgxMykoMTQpKDE1KSgxNikoMTcpKDE4KSgxOSkoMjAp4oir4oir4oir4oirKOyYpOyghCko7Jik7ZuEKeOCouODkeODvOODiOOCouODq+ODleOCoeOCouODs+ODmuOCouOCpOODi+ODs+OCsOOCqOODvOOCq+ODvOOCq+ODqeODg+ODiOOCq+ODreODquODvOOCreODpeODquODvOOCruODq+ODgOODvOOCr+ODreODvOODjeOCteOCpOOCr+ODq+OCt+ODquODs+OCsOODkOODvOODrOODq+ODleOCo+ODvOODiOODneOCpOODs+ODiOODnuOCpOOCr+ODreODn+OCr+ODreODs+ODoeOCrOODiOODs+ODquODg+ODiOODq+ODq+ODvOODluODq+agquW8j+S8muekvmtjYWxt4oiVczJj4oiVa2fYp9mD2KjYsdmF2K3Zhdiv2LXZhNi52YXYsdiz2YjZhNix24zYp9mEMeKBhDQx4oGEMjPigYQ0IMyIzIHgvrLgvbHgvoDgvrPgvbHgvoAgzIjNgiDMk8yAIMyTzIEgzJPNgiDMlMyAIMyUzIEgzJTNgiDMiMyA4oC14oC14oC1YS9jYS9zYy9vYy91dGVsZmF4MeKBhDcx4oGEOTHigYQzMuKBhDMx4oGENTLigYQ1M+KBhDU04oGENTHigYQ2NeKBhDYx4oGEODPigYQ4NeKBhDg34oGEOHhpaTDigYQz4oiu4oiu4oiuKDEpKDIpKDMpKDQpKDUpKDYpKDcpKDgpKDkpKGEpKGIpKGMpKGQpKGUpKGYpKGcpKGgpKGkpKGopKGspKGwpKG0pKG4pKG8pKHApKHEpKHIpKHMpKHQpKHUpKHYpKHcpKHgpKHkpKHopOjo9PT09KOGEgCko4YSCKSjhhIMpKOGEhSko4YSGKSjhhIcpKOGEiSko4YSLKSjhhIwpKOGEjiko4YSPKSjhhJApKOGEkSko4YSSKSjqsIApKOuCmCko64ukKSjrnbwpKOuniCko67CUKSjsgqwpKOyVhCko7J6QKSjssKgpKOy5tCko7YOAKSjtjIwpKO2VmCko7KO8KSjkuIApKOS6jCko5LiJKSjlm5spKOS6lCko5YWtKSjkuIMpKOWFqyko5LmdKSjljYEpKOaciCko54GrKSjmsLQpKOacqCko6YeRKSjlnJ8pKOaXpSko5qCqKSjmnIkpKOekviko5ZCNKSjnibkpKOiyoSko56WdKSjlirQpKOS7oyko5ZG8KSjlraYpKOeboyko5LyBKSjos4cpKOWNlCko56WtKSjkvJEpKOiHqiko6IezKXB0ZTEw5pyIMTHmnIgxMuaciGVyZ2x0ZOOCouODvOODq+OCpOODs+ODgeOCpuOCqeODs+OCquODs+OCueOCquODvOODoOOCq+OCpOODquOCrOODreODs+OCrOODs+ODnuOCruODi+ODvOOCseODvOOCueOCs+ODq+ODiuOCs+ODvOODneOCu+ODs+ODgeODgOODvOOCueODjuODg+ODiOODj+OCpOODhOODkeODvOODhOODlOOCr+ODq+ODleODqeODs+ODmuODi+ODkuODmOODq+ODhOODmuODs+OCueODmuODvOOCuOODmeODvOOCv+ODnOODq+ODiOODneODs+ODieODm+ODvOODq+ODm+ODvOODs+ODnuOCpOODq+ODnuODg+ODj+ODnuODq+OCr+ODpOODvOODieODpOODvOODq+ODpuOCouODs+ODq+ODlOODvDEw54K5MTHngrkxMueCuTEz54K5MTTngrkxNeeCuTE254K5MTfngrkxOOeCuTE554K5MjDngrkyMeeCuTIy54K5MjPngrkyNOeCuWhwYWJhcmRtMmRtM2toem1oemdoenRoem1tMmNtMmttMm1tM2NtM2ttM2twYW1wYWdwYWxvZ21pbG1vbHBwbXbiiJVtYeKIlW0xMOaXpTEx5pelMTLml6UxM+aXpTE05pelMTXml6UxNuaXpTE35pelMTjml6UxOeaXpTIw5pelMjHml6UyMuaXpTIz5pelMjTml6UyNeaXpTI25pelMjfml6UyOOaXpTI55pelMzDml6UzMeaXpWdhbGZmaWZmbNep1rzXgdep1rzXgiDZjNmRINmN2ZEg2Y7ZkSDZj9mRINmQ2ZEg2ZHZsNmA2Y7ZkdmA2Y/ZkdmA2ZDZkdiq2KzZhdiq2K3YrNiq2K3Zhdiq2K7Zhdiq2YXYrNiq2YXYrdiq2YXYrtis2YXYrdit2YXZitit2YXZidiz2K3YrNiz2KzYrdiz2KzZidiz2YXYrdiz2YXYrNiz2YXZhdi12K3Yrdi12YXZhdi02K3Zhdi02KzZiti02YXYrti02YXZhdi22K3Zidi22K7Zhdi32YXYrdi32YXZhdi32YXZiti52KzZhdi52YXZhdi52YXZidi62YXZhdi62YXZiti62YXZidmB2K7ZhdmC2YXYrdmC2YXZhdmE2K3ZhdmE2K3ZitmE2K3ZidmE2KzYrNmE2K7ZhdmE2YXYrdmF2K3YrNmF2K3ZitmF2KzYrdmF2KzZhdmF2K7ZhdmF2KzYrtmH2YXYrNmH2YXZhdmG2K3ZhdmG2K3ZidmG2KzZhdmG2KzZidmG2YXZitmG2YXZidmK2YXZhdio2K7Zitiq2KzZitiq2KzZidiq2K7Zitiq2K7Zidiq2YXZitiq2YXZidis2YXZitis2K3Zidis2YXZidiz2K7Zidi12K3Ziti02K3Ziti22K3ZitmE2KzZitmE2YXZitmK2K3ZitmK2KzZitmK2YXZitmF2YXZitmC2YXZitmG2K3Ziti52YXZitmD2YXZitmG2KzYrdmF2K7ZitmE2KzZhdmD2YXZhdis2K3Zitit2KzZitmF2KzZitmB2YXZitio2K3Zitiz2K7ZitmG2KzZiti12YTbktmC2YTbkvCdhZjwnYWl8J2FrvCdhZjwnYWl8J2Fr/CdhZjwnYWl8J2FsPCdhZjwnYWl8J2FsfCdhZjwnYWl8J2FsvCdhrnwnYWl8J2FrvCdhrrwnYWl8J2FrvCdhrnwnYWl8J2Fr/CdhrrwnYWl8J2Fr+OAlHPjgJVwcHbjgJTmnKzjgJXjgJTkuInjgJXjgJTkuozjgJXjgJTlronjgJXjgJTngrnjgJXjgJTmiZPjgJXjgJTnm5fjgJXjgJTli53jgJXjgJTmlZfjgJUgzIQgzIEgzKdzc2nMh2lqbMK3yrxuZMW+bGpuamR6IMyGIMyHIMyKIMyoIMyDIMyLIM651aXWgtin2bTZiNm024fZtNmK2bTgpJXgpLzgpJbgpLzgpJfgpLzgpJzgpLzgpKHgpLzgpKLgpLzgpKvgpLzgpK/gpLzgpqHgprzgpqLgprzgpq/gprzgqLLgqLzgqLjgqLzgqJbgqLzgqJfgqLzgqJzgqLzgqKvgqLzgrKHgrLzgrKLgrLzguY3guLLgu43gurLguqvgupnguqvguqHgvYLgvrfgvYzgvrfgvZHgvrfgvZbgvrfgvZvgvrfgvYDgvrXgvbHgvbLgvbHgvbTgvrLgvoDgvrPgvoDgvpLgvrfgvpzgvrfgvqHgvrfgvqbgvrfgvqvgvrfgvpDgvrVhyr7hvIDOueG8gc654byCzrnhvIPOueG8hM654byFzrnhvIbOueG8h8654bygzrnhvKHOueG8os654byjzrnhvKTOueG8pc654bymzrnhvKfOueG9oM654b2hzrnhvaLOueG9o8654b2kzrnhvaXOueG9ps654b2nzrnhvbDOuc6xzrnOrM654b62zrkgzYLhvbTOuc63zrnOrs654b+GzrnhvbzOuc+JzrnPjs654b+2zrkgzLMhISDMhT8/PyEhP3JzwrBjwrBmbm9zbXRtaXZpeOKrncy4IOOCmSDjgprjgojjgorjgrPjg4gzMzM0MzXssLjqs6Dso7zsnZgzNjM3MzgzOTQwNDI0NDQ1NDY0NzQ4NDk1MDPmnIg05pyINeaciDbmnIg35pyIOOaciDnmnIhoZ2V244Ku44Ks44OH44K344OJ44Or44OK44OO44OU44Kz44OT44Or44Oa44K944Ob44Oz44Oq44Op44Os44OgZGFhdW92cGNpdeW5s+aIkOaYreWSjOWkp+ato+aYjuayu25hzrxha2FrYm1iZ2JwZm5mzrxmzrxnbWfOvGxtbGRsa2xmbW5tzrxtcHNuc868c21zbnbOvHZrdnB3bnfOvHdtd2t3a8+Jbc+JYnFjY2NkZGJneWhhaW5ra2t0bG5seHBocHJzcnN2d2JzdNW01bbVtNWl1bTVq9W+1bbVtNWt15nWtNey1rfXqdeB16nXgteQ1rfXkNa415DWvNeR1rzXkta815PWvNeU1rzXlda815bWvNeY1rzXmda815rWvNeb1rzXnNa8157WvNeg1rzXoda816PWvNek1rzXpta816fWvNeo1rzXqta815XWudeR1r/Xm9a/16TWv9eQ15zYptin2Kbbldim2YjYptuH2Kbbhtim24jYptuQ2KbZidim2KzYptit2KbZhdim2YrYqNis2KjZhdio2YnYqNmK2KrZidiq2YrYq9is2KvZhdir2YnYq9mK2K7Yrdi22KzYttmF2LfYrdi42YXYutis2YHYrNmB2K3ZgdmJ2YHZitmC2K3ZgtmJ2YLZitmD2KfZg9is2YPYrdmD2K7Zg9mE2YPZidmD2YrZhtiu2YbZidmG2YrZh9is2YfZidmH2YrZitmJ2LDZsNix2bDZidmw2KbYsdim2LLYptmG2KjYstio2YbYqtix2KrYstiq2YbYq9ix2KvYstir2YbZhdin2YbYsdmG2LLZhtmG2YrYsdmK2LLYptiu2KbZh9io2YfYqtmH2LXYrtmG2YfZh9mw2KvZh9iz2YfYtNmH2LfZidi32YrYudmJ2LnZiti62YnYutmK2LPZidiz2YrYtNmJ2LTZiti12YnYtdmK2LbZidi22YrYtNiu2LTYsdiz2LHYtdix2LbYsdin2Ysg2YvZgNmL2YDZkSDZktmA2ZLZhNii2YTYo9mE2KXwnYWX8J2FpTAsMSwyLDMsNCw1LDYsNyw4LDksd3podnNkd2NtY21kZGrjgbvjgYvjgrPjgrPDoMOhw6LDo8Okw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7jDucO6w7vDvMO9w77EgcSDxIXEh8SJxIvEjcSPxJHEk8SVxJfEmcSbxJ3En8ShxKPEpcSnxKnEq8StxK/EtcS3xLrEvMS+xYLFhMWGxYjFi8WNxY/FkcWTxZXFl8WZxZvFncWfxaHFo8WlxafFqcWrxa3Fr8WxxbPFtcW3w7/FusW8yZPGg8aFyZTGiMmWyZfGjMedyZnJm8aSyaDJo8mpyajGmcmvybLJtcahxqPGpcqAxqjKg8atyojGsMqKyovGtMa2ypLGuca9x47HkMeSx5THlseYx5rHnMefx6HHo8elx6fHqcerx63Hr8e1xpXGv8e5x7vHvce/yIHIg8iFyIfIiciLyI3Ij8iRyJPIlciXyJnIm8idyJ/GnsijyKXIp8ipyKvIrcivyLHIs+Kxpci8xprisabJgsaAyonKjMmHyYnJi8mNyY/Jpsm5ybvKgcqVzbHNs8q5zbc7z7POrc6vz4zPjc6yzrPOtM61zrbOuM66zrvOvc6+zr/PgM+Bz4PPhM+Fz4bPh8+Iz4rPi8+Xz5nPm8+dz5/Poc+jz6XPp8+pz6vPrc+vz7jPu827zbzNvdGQ0ZHRktGT0ZTRldGW0ZfRmNGZ0ZrRm9Gc0Z3RntGf0LDQsdCy0LPQtNC10LbQt9C40LnQutC70LzQvdC+0L/RgNGB0YLRg9GE0YXRhtGH0YjRidGK0YvRjNGN0Y7Rj9Gh0aPRpdGn0anRq9Gt0a/RsdGz0bXRt9G50bvRvdG/0oHSi9KN0o/SkdKT0pXSl9KZ0pvSndKf0qHSo9Kl0qfSqdKr0q3Sr9Kx0rPStdK30rnSu9K90r/TgtOE04bTiNOK04zTjtOR05PTldOX05nTm9Od05/TodOj06XTp9Op06vTrdOv07HTs9O107fTudO7073Tv9SB1IPUhdSH1InUi9SN1I/UkdST1JXUl9SZ1JvUndSf1KHUo9Sl1KfUqdSr1K3Ur9Wh1aLVo9Wk1abVp9Wo1anVqtWs1a7Vr9Ww1bHVstWz1bXVt9W41bnVutW71bzVvdW/1oDWgdaD1oTWhdaG4LyL4rSn4rSt4YOc4Y+w4Y+x4Y+y4Y+z4Y+04Y+16pmLyZDJkeG0gsmc4bSW4bSX4bSd4bSlyZLJlcmfyaHJpcmq4bW7yp3JreG2hcqfybHJsMmzybTJuMqCxqvhtJzKkMqR4biB4biD4biF4biH4biJ4biL4biN4biP4biR4biT4biV4biX4biZ4bib4bid4bif4bih4bij4bil4bin4bip4bir4bit4biv4bix4biz4bi14bi34bi54bi74bi94bi/4bmB4bmD4bmF4bmH4bmJ4bmL4bmN4bmP4bmR4bmT4bmV4bmX4bmZ4bmb4bmd4bmf4bmh4bmj4bml4bmn4bmp4bmr4bmt4bmv4bmx4bmz4bm14bm34bm54bm74bm94bm/4bqB4bqD4bqF4bqH4bqJ4bqL4bqN4bqP4bqR4bqT4bqV4bqh4bqj4bql4bqn4bqp4bqr4bqt4bqv4bqx4bqz4bq14bq34bq54bq74bq94bq/4buB4buD4buF4buH4buJ4buL4buN4buP4buR4buT4buV4buX4buZ4bub4bud4buf4buh4buj4bul4bun4bup4bur4but4buv4bux4buz4bu14bu34bu54bu74bu94bu/4byQ4byR4byS4byT4byU4byV4byw4byx4byy4byz4by04by14by24by34b2A4b2B4b2C4b2D4b2E4b2F4b2R4b2T4b2V4b2X4b6w4b6x4b2yzpDhv5Dhv5HhvbbOsOG/oOG/oeG9uuG/pWDhvbjigJAr4oiS4oiR44CI44CJ4rCw4rCx4rCy4rCz4rC04rC14rC24rC34rC44rC54rC64rC74rC84rC94rC+4rC/4rGA4rGB4rGC4rGD4rGE4rGF4rGG4rGH4rGI4rGJ4rGK4rGL4rGM4rGN4rGO4rGP4rGQ4rGR4rGS4rGT4rGU4rGV4rGW4rGX4rGY4rGZ4rGa4rGb4rGc4rGd4rGe4rGhyavhtb3JveKxqOKxquKxrOKxs+Kxtsi/yYDisoHisoPisoXisofisonisoviso3iso/ispHispPispXispfispnispvisp3isp/isqHisqPisqXisqfisqnisqvisq3isq/isrHisrPisrXisrfisrnisrvisr3isr/is4His4Pis4Xis4fis4nis4vis43is4/is5His5Pis5Xis5fis5nis5vis53is5/is6His6Pis6zis67is7PitaHmr43pvp/kuKjkuLbkuL/kuZnkuoXkuqDkurrlhL/lhaXlhoLlhpblhqvlh6Dlh7XliIDlipvli7nljJXljJrljLjljZzljanljoLljrblj4jlj6Plm5flo6vlpILlpIrlpJXlpbPlrZDlroDlr7jlsI/lsKLlsLjlsa7lsbHlt5vlt6Xlt7Hlt77lubLlubrlub/lu7Tlu77lvIvlvJPlvZDlvaHlvbPlv4PmiIjmiLbmiYvmlK/mlLTmlofmlpfmlqTmlrnml6Dmm7DmrKDmraLmrbnmrrPmr4vmr5Tmr5vmsI/msJTniKrniLbniLvniL/niYfniZnniZvniqznjoTnjonnk5znk6bnlJjnlJ/nlKjnlLDnlovnlpLnmbbnmb3nmq7nmr/nm67nn5vnn6Lnn7PnpLrnprjnpr7nqbTnq4vnq7nnsbPns7jnvLbnvZHnvornvr3ogIHogIzogJLogLPogb/ogonoh6Poh7zoiIzoiJvoiJ/oia7oibLoibjomY3omavooYDooYzooaPopb7opovop5LoqIDosLfosYbosZXosbjosp3otaTotbDotrPouqvou4rovpvovrDovrXpgpHphYnph4bph4zplbfploDpmJzpmrbpmrnpm6jpnZHpnZ7pnaLpnanpn4vpn63pn7PpoIHpoqjpo5vpo5/pppbpppnppqzpqqjpq5jpq5/prKXprK/prLLprLzprZrps6XpubXpub/puqXpurvpu4Ppu43pu5Hpu7npu73pvI7pvJPpvKDpvLvpvYrpvZLpvo3pvpzpvqAu44CS5Y2E5Y2F4YSB4Yaq4Yas4Yat4YSE4Yaw4Yax4Yay4Yaz4Ya04Ya14YSa4YSI4YSh4YSK4YSN4YWh4YWi4YWj4YWk4YWl4YWm4YWn4YWo4YWp4YWq4YWr4YWs4YWt4YWu4YWv4YWw4YWx4YWy4YWz4YW04YW14YSU4YSV4YeH4YeI4YeM4YeO4YeT4YeX4YeZ4YSc4Yed4Yef4YSd4YSe4YSg4YSi4YSj4YSn4YSp4YSr4YSs4YSt4YSu4YSv4YSy4YS24YWA4YWH4YWM4Yex4Yey4YWX4YWY4YWZ4YaE4YaF4YaI4YaR4YaS4YaU4Yae4Yah5LiK5Lit5LiL55Sy5LiZ5LiB5aSp5Zyw5ZWP5bm8566P7Jqw56eY55S36YGp5YSq5Y2w5rOo6aCF5YaZ5bem5Y+z5Yy75a6X5aSc44OG44OM44Oi44Oo44Ow44Ox44Oy6pmB6pmD6pmF6pmH6pmJ6pmN6pmP6pmR6pmT6pmV6pmX6pmZ6pmb6pmd6pmf6pmh6pmj6pml6pmn6pmp6pmr6pmt6pqB6pqD6pqF6pqH6pqJ6pqL6pqN6pqP6pqR6pqT6pqV6pqX6pqZ6pqb6pyj6pyl6pyn6pyp6pyr6pyt6pyv6pyz6py16py36py56py76py96py/6p2B6p2D6p2F6p2H6p2J6p2L6p2N6p2P6p2R6p2T6p2V6p2X6p2Z6p2b6p2d6p2f6p2h6p2j6p2l6p2n6p2p6p2r6p2t6p2v6p266p284bW56p2/6p6B6p6D6p6F6p6H6p6M6p6R6p6T6p6X6p6Z6p6b6p6d6p6f6p6h6p6j6p6l6p6n6p6pyazKnsqH6q2T6p616p636qy36q2S4Y6g4Y6h4Y6i4Y6j4Y6k4Y6l4Y6m4Y6n4Y6o4Y6p4Y6q4Y6r4Y6s4Y6t4Y6u4Y6v4Y6w4Y6x4Y6y4Y6z4Y604Y614Y624Y634Y644Y654Y664Y674Y684Y694Y6+4Y6/4Y+A4Y+B4Y+C4Y+D4Y+E4Y+F4Y+G4Y+H4Y+I4Y+J4Y+K4Y+L4Y+M4Y+N4Y+O4Y+P4Y+Q4Y+R4Y+S4Y+T4Y+U4Y+V4Y+W4Y+X4Y+Y4Y+Z4Y+a4Y+b4Y+c4Y+d4Y+e4Y+f4Y+g4Y+h4Y+i4Y+j4Y+k4Y+l4Y+m4Y+n4Y+o4Y+p4Y+q4Y+r4Y+s4Y+t4Y+u4Y+v6LGI5pu06LOI5ruR5Liy5Y+l5aWR5ZaH5aWI5oe255mp576F6Ji/6J666KO46YKP5qiC5rSb54OZ54+e6JC96YWq6aex5LqC5Y215qyE54ib6Jit6bie5bWQ5r+r6JeN6KWk5ouJ6IeY6KCf5buK5pyX5rWq54u86YOO5L6G5Ya35Yue5pOE5quT54iQ55un6JiG6Jmc6Lev6Zyy6a2v6be656KM56W/57ag6I+J6YyE6KuW5aOf5byE57Gg6IG+54mi56OK6LOC6Zu35aOY5bGi5qiT5rea5ryP57Sv57i36ZmL5YuS6IKL5Yec5YeM56ic57a+6I+x6Zm16K6A5ouP6Ku+5Li55a+n5oCS546H55Ww5YyX56O75L6/5b6p5LiN5rOM5pW457Si5Y+D5aGe55yB6JGJ6Kqq5q665rKI5ou+6Iul5o6g55Wl5Lqu5YWp5YeJ5qKB57On6Imv6KuS6YeP5Yu15ZGC5bus5peF5r++56Sq6Zat6amq6bqX6buO5puG5q236L2i5bm05oaQ5oiA5pKa5ryj54WJ55KJ56eK57e06IGv6Lym6JOu6YCj6Y2K5YiX5Yqj5ZK954OI6KOC5buJ5b+15o275q6u57C+54215Luk5Zu55ba65oCc546y55Gp576a6IGG6Yi06Zu26Z2I6aCY5L6L56au6Ya06Zq45oOh5LqG5YOa5a+u5bC/5paZ54eO55mC6JO86YG85pqI6Ziu5YqJ5p275p+z5rWB5rqc55CJ55WZ56Gr57SQ6aGe5oiu6Zm45YCr5bSZ5req6Lyq5b6L5oWE5qCX6ZqG5Yip5ZCP5bGl5piT5p2O5qKo5rOl55CG55ei57256KOP6KOh6Zui5Yy/5rq65ZCd54eQ55KY6Je66Zqj6bGX6bqf5p6X5reL6Ieo56yg57KS54uA54KZ6K2Y5LuA6Iy25Yi65YiH5bqm5ouT57OW5a6F5rSe5pq06Ly76ZmN5buT5YWA5ZeA5aGa5pm05Yee54yq55uK56S856We56Wl56aP6Z2W57K+6JiS6Ku46YC46YO96aOv6aO86aSo6ba06YOe6Zq35L6u5YOn5YWN5YuJ5Yuk5Y2R5Zad5ZiG5Zmo5aGA5aKo5bGk5oKU5oWo5oaO5oey5pWP5pei5pqR5qKF5rW35ria5ryi54Wu54ir55Ci56KR56WJ56WI56WQ56WW56aN56aO56mA56qB56+A57iJ57mB572y6ICF6Iet6Im56JGX6KSQ6KaW6KyB6Ky56LOT6LSI6L626Zuj6Z+/6aC75oG18KSLruiImOS4puWGteWFqOS+gOWFheWGgOWLh+WLuuWVleWWmeWXouWis+WlhOWllOWpouWsqOW7kuW7meW9qeW+reaDmOaFjuaEiOaFoOaItOaPhOaQnOaRkuaVluacm+adlua7m+a7i+eAnueep+eIteeKr+eRseeUhueUu+eYneeYn+ebm+ebtOediuedgOejjOeqseexu+e1m+e8vuiNkuiPr+idueilgeimhuiqv+iri+irreiuiui8uOmBsumGmemJtumZvOmfm+mgi+mskvCioYrwoqGE8KOPleOuneSAmOSAufCliYnwpbOQ8Ke7k+m9g+m+jtei153Zsdm72b7agNm62b/Zudqk2qbahNqD2obah9qN2ozajtqI2pjakdqp2q/as9qx2rrau9uA24HavtuT2q3bi9uF24njgIHjgJbjgJfigJTigJNfe33jgJDjgJHjgIrjgIvjgIzjgI3jgI7jgI9bXSMmKi08PlxcXFwkJUDYodik2KlcXFwiJ158fuKmheKmhuODu+OCpeODo8KiwqPCrMKmwqXigqnilILihpDihpHihpLihpPilqDil4vwkJCo8JCQqfCQkKrwkJCr8JCQrPCQkK3wkJCu8JCQr/CQkLDwkJCx8JCQsvCQkLPwkJC08JCQtfCQkLbwkJC38JCQuPCQkLnwkJC68JCQu/CQkLzwkJC98JCQvvCQkL/wkJGA8JCRgfCQkYLwkJGD8JCRhPCQkYXwkJGG8JCRh/CQkYjwkJGJ8JCRivCQkYvwkJGM8JCRjfCQkY7wkJGP8JCTmPCQk5nwkJOa8JCTm/CQk5zwkJOd8JCTnvCQk5/wkJOg8JCTofCQk6LwkJOj8JCTpPCQk6XwkJOm8JCTp/CQk6jwkJOp8JCTqvCQk6vwkJOs8JCTrfCQk67wkJOv8JCTsPCQk7HwkJOy8JCTs/CQk7TwkJO18JCTtvCQk7fwkJO48JCTufCQk7rwkJO78JCzgPCQs4HwkLOC8JCzg/CQs4TwkLOF8JCzhvCQs4fwkLOI8JCzifCQs4rwkLOL8JCzjPCQs43wkLOO8JCzj/CQs5DwkLOR8JCzkvCQs5PwkLOU8JCzlfCQs5bwkLOX8JCzmPCQs5nwkLOa8JCzm/CQs5zwkLOd8JCznvCQs5/wkLOg8JCzofCQs6LwkLOj8JCzpPCQs6XwkLOm8JCzp/CQs6jwkLOp8JCzqvCQs6vwkLOs8JCzrfCQs67wkLOv8JCzsPCQs7HwkLOy8JGjgPCRo4HwkaOC8JGjg/CRo4TwkaOF8JGjhvCRo4fwkaOI8JGjifCRo4rwkaOL8JGjjPCRo43wkaOO8JGjj/CRo5DwkaOR8JGjkvCRo5PwkaOU8JGjlfCRo5bwkaOX8JGjmPCRo5nwkaOa8JGjm/CRo5zwkaOd8JGjnvCRo5/Esci34oiH4oiC8J6kovCepKPwnqSk8J6kpfCepKbwnqSn8J6kqPCepKnwnqSq8J6kq/CepKzwnqSt8J6krvCepK/wnqSw8J6ksfCepLLwnqSz8J6ktPCepLXwnqS28J6kt/CepLjwnqS58J6kuvCepLvwnqS88J6kvfCepL7wnqS/8J6lgPCepYHwnqWC8J6lg9mu2qHZr+Wtl+WPjOWkmuino+S6pOaYoOeEoeWJjeW+jOWGjeaWsOWInee1guiyqeWjsOWQuea8lOaKleaNlemBiuaMh+emgeepuuWQiOa6gOeUs+WJsuWWtumFjeW+l+WPr+S4veS4uOS5gfCghKLkvaDkvrvlgILlgbrlgpnlg4/jkp7woJi65YWU5YWk5YW38KCUnOOSueWFp/CglYvlhpflhqTku4zlhqzwqYef5YiD45Of5Yi75YmG5Ym345SV5YyF5YyG5Y2J5Y2a5Y2z5Y295Y2/8KCorOeBsOWPiuWPn/CgraPlj6vlj7HlkIblkp7lkLjlkYjlkajlkqLlk7bllJDllZPllaPlloTllqvllrPll4LlnJblnJflmZHlmbTlo67ln47ln7TloI3lnovloLLloLHloqzwoZOk5aOy5aO35aSG5aSi5aWi8KGaqPChm6rlp6zlqJvlqKflp5jlqabjm67lrIjlrL7woaeI5a+D5a+Y5a+z8KGsmOWvv+WwhuOegeWxoOWzgOWyjfCht6TltYPwobem5bWu5bWr5bW85beh5bei46Cv5be95bio5bi95bmp46Gi8KKGg+OhvOW6sOW6s+W6tvCqjpLwooyx6IiB5byi46OH8KOKuPCmh5rlvaLlvavjo6Plvprlv43lv5flv7nmgoHjpLrjpJzwopuU5oOH5oWI5oWM5oW65oay5oak5oav5oee5oib5omd5oqx5ouU5o2Q8KKsjOaMveaLvOaNqOaOg+aPpPCir7HmkKLmj4XmjqnjqK7mkanmkb7mkp3mkbfjqazmlazwo4CK5pej5pu45pmJ46yZ46yI46uk5YaS5YaV5pyA5pqc6IKt5I+Z5pyh5p2e5p2T8KOPg+OtieafuuaeheahkvCjka3moo7moJ/mpJTmpYLmpqPmp6rmqqjwo5qj5qub47CY5qyh8KOip+atlOOxjuatsuaun+auu/Cjqo3wobSL8KOruuaxjvCjsrzmsr/ms43msafmtJbmtL7mtanmtbjmtoXwo7Se5rS05riv5rmu47Sz5ruH8KO7kea3uea9rvCjvZ7wo76O5r+G54C554Cb47aW54GK54G954G354Kt8KCUpeeFhfCkiaPnhpzniKjniZDwpJiI54qA54qV8KSctfCkoJTnjbrnjovjuqznjqXjurjnkYfnkZznkoXnk4rjvJvnlKTwpLC255S+8KSykvCihp/nmJDwpL6h8KS+uPClgYTjv7zkgIjwpYOz8KWDsvClhJnwpYSz55ye55yf556L5IGG5IKW8KWQneehjuSDo/ClmKbwpZqa8KWbheenq+SEr+epiuepj/Clpbzwpaqn5IiC8KWuq+evhuevieSIp/ClsoDns5LkiqDns6jns6PntIDwpb6G57Wj5IyB57eH57iC57mF5Iy08KaIqPCmiYfkjZnwpouZ57268KaMvue+lee/uvCmk5rwppSj6IGg8KaWqOiBsPCjjZ/kj5XogrLohIPkkIvohL7lqrXwpp6n8KaetfCjjpPwo46c6IiE6L6e5JGr6IqR6IqL6Iqd5Yqz6Iqx6Iqz6Iq96Ium8KasvOiMneiNo+iOreiMo+iOveiPp+iNk+iPiuiPjOiPnPCmsLbwprWr8KazleSUq+iTseiTs+iUlvCnj4rolaTwprys5JWd5JWh8Ka+sfCng5LklavomZDomafomanomqnomojonI7om6LonKjonavonobon6HooIHkl7nooaDwp5mn6KOX6KOe5Ji16KO645K78KeirvCnpabkmr7km4foqqDwp7Ko6LKr6LOB6LSb6LW38Ke8r/CgoITot4votrzot7DwoKOe6LuU8KiXkvCol63pgpTpg7HphJHwqJyu6YSb6Yi46YuX6YuY6Ym86Y+56ZCV8KivuumWi+SmlemWt/Cotbfkp6bpm4PltrLpnKPwqYWF8KmImuSpruSptumfoPCpkIrkqrLwqZKW6aCp8KmWtumjouSss+mkqemmp+mngumnvuSvjvCprLDpsYDps73ks47ks63ptafwqoOO5LO48KqEhfCqiI7wqoqR5LWW6bu+6byF6byP6byW8KqYgFwiO1xuXG5mdW5jdGlvbiBtYXBDaGFyKGNvZGVQb2ludCkge1xuICBpZiAoY29kZVBvaW50ID49IDB4MzAwMDApIHtcbiAgICAvLyBIaWdoIHBsYW5lcyBhcmUgc3BlY2lhbCBjYXNlZC5cbiAgICBpZiAoY29kZVBvaW50ID49IDB4RTAxMDAgJiYgY29kZVBvaW50IDw9IDB4RTAxRUYpXG4gICAgICByZXR1cm4gMTg4NzQzNjg7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgcmV0dXJuIGJsb2Nrc1tibG9ja0lkeGVzW2NvZGVQb2ludCA+PiA0XV1bY29kZVBvaW50ICYgMTVdO1xufVxuXG5yZXR1cm4ge1xuICBtYXBTdHI6IG1hcHBpbmdTdHIsXG4gIG1hcENoYXI6IG1hcENoYXJcbn07XG59KSk7XG4iLCIoZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFsncHVueWNvZGUnLCAnLi9pZG5hLW1hcCddLCBmdW5jdGlvbihwdW55Y29kZSwgaWRuYV9tYXApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHB1bnljb2RlLCBpZG5hX21hcCk7XG4gICAgfSk7XG4gIH1cbiAgZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3B1bnljb2RlJyksIHJlcXVpcmUoJy4vaWRuYS1tYXAnKSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgcm9vdC51dHM0NiA9IGZhY3Rvcnkocm9vdC5wdW55Y29kZSwgcm9vdC5pZG5hX21hcCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24ocHVueWNvZGUsIGlkbmFfbWFwKSB7XG5cbiAgZnVuY3Rpb24gbWFwTGFiZWwobGFiZWwsIHVzZVN0ZDNBU0NJSSwgdHJhbnNpdGlvbmFsKSB7XG4gICAgdmFyIG1hcHBlZCA9IFtdO1xuICAgIHZhciBjaGFycyA9IHB1bnljb2RlLnVjczIuZGVjb2RlKGxhYmVsKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY3AgPSBjaGFyc1tpXTtcbiAgICAgIHZhciBjaCA9IHB1bnljb2RlLnVjczIuZW5jb2RlKFtjaGFyc1tpXV0pO1xuICAgICAgdmFyIGNvbXBvc2l0ZSA9IGlkbmFfbWFwLm1hcENoYXIoY3ApO1xuICAgICAgdmFyIGZsYWdzID0gKGNvbXBvc2l0ZSA+PiAyMyk7XG4gICAgICB2YXIga2luZCA9IChjb21wb3NpdGUgPj4gMjEpICYgMztcbiAgICAgIHZhciBpbmRleCA9IChjb21wb3NpdGUgPj4gNSkgJiAweGZmZmY7XG4gICAgICB2YXIgbGVuZ3RoID0gY29tcG9zaXRlICYgMHgxZjtcbiAgICAgIHZhciB2YWx1ZSA9IGlkbmFfbWFwLm1hcFN0ci5zdWJzdHIoaW5kZXgsIGxlbmd0aCk7XG4gICAgICBpZiAoa2luZCA9PT0gMCB8fCAodXNlU3RkM0FTQ0lJICYmIChmbGFncyAmIDEpKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGNoYXIgXCIgKyBjaCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChraW5kID09PSAxKSB7XG4gICAgICAgIG1hcHBlZC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtpbmQgPT09IDIpIHtcbiAgICAgICAgbWFwcGVkLnB1c2godHJhbnNpdGlvbmFsID8gdmFsdWUgOiBjaCk7XG4gICAgICB9XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgZWxzZSBpZiAoa2luZCA9PT0gMykge1xuICAgICAgICBtYXBwZWQucHVzaChjaCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG5ld0xhYmVsID0gbWFwcGVkLmpvaW4oXCJcIikubm9ybWFsaXplKFwiTkZDXCIpO1xuICAgIHJldHVybiBuZXdMYWJlbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb2Nlc3MoZG9tYWluLCB0cmFuc2l0aW9uYWwsIHVzZVN0ZDNBU0NJSSkge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICh1c2VTdGQzQVNDSUkgPT09IHVuZGVmaW5lZClcbiAgICAgIHVzZVN0ZDNBU0NJSSA9IGZhbHNlO1xuICAgIHZhciBtYXBwZWRJRE5BID0gbWFwTGFiZWwoZG9tYWluLCB1c2VTdGQzQVNDSUksIHRyYW5zaXRpb25hbCk7XG5cbiAgICAvLyBTdGVwIDMuIEJyZWFrXG4gICAgdmFyIGxhYmVscyA9IG1hcHBlZElETkEuc3BsaXQoXCIuXCIpO1xuXG4gICAgLy8gU3RlcCA0LiBDb252ZXJ0L1ZhbGlkYXRlXG4gICAgbGFiZWxzID0gbGFiZWxzLm1hcChmdW5jdGlvbihsYWJlbCkge1xuICAgICAgaWYgKGxhYmVsLnN0YXJ0c1dpdGgoXCJ4bi0tXCIpKSB7XG4gICAgICAgIGxhYmVsID0gcHVueWNvZGUuZGVjb2RlKGxhYmVsLnN1YnN0cmluZyg0KSk7XG4gICAgICAgIHZhbGlkYXRlTGFiZWwobGFiZWwsIHVzZVN0ZDNBU0NJSSwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhbGlkYXRlTGFiZWwobGFiZWwsIHVzZVN0ZDNBU0NJSSwgdHJhbnNpdGlvbmFsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbHMuam9pbihcIi5cIik7XG4gIH1cblxuICBmdW5jdGlvbiB2YWxpZGF0ZUxhYmVsKGxhYmVsLCB1c2VTdGQzQVNDSUksIHRyYW5zaXRpb25hbCkge1xuICAgIC8vIDIuIFRoZSBsYWJlbCBtdXN0IG5vdCBjb250YWluIGEgVSswMDJEIEhZUEhFTi1NSU5VUyBjaGFyYWN0ZXIgaW4gYm90aCB0aGVcbiAgICAvLyB0aGlyZCBwb3NpdGlvbiBhbmQgZm91cnRoIHBvc2l0aW9ucy5cbiAgICBpZiAobGFiZWxbMl0gPT09ICctJyAmJiBsYWJlbFszXSA9PT0gJy0nKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHZhbGlkYXRlIFwiICsgbGFiZWwpO1xuXG4gICAgLy8gMy4gVGhlIGxhYmVsIG11c3QgbmVpdGhlciBiZWdpbiBub3IgZW5kIHdpdGggYSBVKzAwMkQgSFlQSEVOLU1JTlVTXG4gICAgLy8gY2hhcmFjdGVyLlxuICAgIGlmIChsYWJlbC5zdGFydHNXaXRoKCctJykgfHwgbGFiZWwuZW5kc1dpdGgoJy0nKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byB2YWxpZGF0ZSBcIiArIGxhYmVsKTtcblxuICAgIC8vIDQuIFRoZSBsYWJlbCBtdXN0IG5vdCBjb250YWluIGEgVSswMDJFICggLiApIEZVTEwgU1RPUC5cbiAgICAvLyB0aGlzIHNob3VsZCBuZXJ2ZXIgaGFwcGVuIGFzIGxhYmVsIGlzIGNodW5rZWQgaW50ZXJuYWxseSBieSB0aGlzIGNoYXJhY3RlclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChsYWJlbC5pbmNsdWRlcygnLicpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHZhbGlkYXRlIFwiICsgbGFiZWwpO1xuXG4gICAgaWYgKG1hcExhYmVsKGxhYmVsLCB1c2VTdGQzQVNDSUksIHRyYW5zaXRpb25hbCkgIT09IGxhYmVsKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHZhbGlkYXRlIFwiICsgbGFiZWwpO1xuXG4gICAgLy8gNS4gVGhlIGxhYmVsIG11c3Qgbm90IGJlZ2luIHdpdGggYSBjb21iaW5pbmcgbWFyaywgdGhhdCBpczpcbiAgICAvLyBHZW5lcmFsX0NhdGVnb3J5PU1hcmsuXG4gICAgdmFyIGNoID0gbGFiZWwuY29kZVBvaW50QXQoMCk7XG4gICAgaWYgKGlkbmFfbWFwLm1hcENoYXIoY2gpICYgKDB4MiA8PCAyMykpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMYWJlbCBjb250YWlucyBpbGxlZ2FsIGNoYXJhY3RlcjogXCIgKyBjaCk7XG4gIH1cblxuICBmdW5jdGlvbiB0b0FzY2lpKGRvbWFpbiwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQpXG4gICAgICBvcHRpb25zID0ge307XG4gICAgdmFyIHRyYW5zaXRpb25hbCA9ICd0cmFuc2l0aW9uYWwnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYW5zaXRpb25hbCA6IHRydWU7XG4gICAgdmFyIHVzZVN0ZDNBU0NJSSA9ICd1c2VTdGQzQVNDSUknIGluIG9wdGlvbnMgPyBvcHRpb25zLnVzZVN0ZDNBU0NJSSA6IGZhbHNlO1xuICAgIHZhciB2ZXJpZnlEbnNMZW5ndGggPSAndmVyaWZ5RG5zTGVuZ3RoJyBpbiBvcHRpb25zID8gb3B0aW9ucy52ZXJpZnlEbnNMZW5ndGggOiBmYWxzZTtcbiAgICB2YXIgbGFiZWxzID0gcHJvY2Vzcyhkb21haW4sIHRyYW5zaXRpb25hbCwgdXNlU3RkM0FTQ0lJKS5zcGxpdCgnLicpO1xuICAgIHZhciBhc2NpaUxhYmVscyA9IGxhYmVscy5tYXAocHVueWNvZGUudG9BU0NJSSk7XG4gICAgdmFyIGFzY2lpU3RyaW5nID0gYXNjaWlMYWJlbHMuam9pbignLicpO1xuICAgIHZhciBpO1xuICAgIGlmICh2ZXJpZnlEbnNMZW5ndGgpIHtcbiAgICAgIGlmIChhc2NpaVN0cmluZy5sZW5ndGggPCAxIHx8IGFzY2lpU3RyaW5nLmxlbmd0aCA+IDI1Mykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJETlMgbmFtZSBoYXMgd3JvbmcgbGVuZ3RoOiBcIiArIGFzY2lpU3RyaW5nKTtcbiAgICAgIH1cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhc2NpaUxhYmVscy5sZW5ndGg7IGkrKykgey8vZm9yIC4uIG9mIHJlcGxhY2VtZW50XG4gICAgICAgIHZhciBsYWJlbCA9IGFzY2lpTGFiZWxzW2ldO1xuICAgICAgICBpZiAobGFiZWwubGVuZ3RoIDwgMSB8fCBsYWJlbC5sZW5ndGggPiA2MylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJETlMgbGFiZWwgaGFzIHdyb25nIGxlbmd0aDogXCIgKyBsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhc2NpaVN0cmluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvVW5pY29kZShkb21haW4sIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKVxuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIHZhciB1c2VTdGQzQVNDSUkgPSAndXNlU3RkM0FTQ0lJJyBpbiBvcHRpb25zID8gb3B0aW9ucy51c2VTdGQzQVNDSUkgOiBmYWxzZTtcbiAgICByZXR1cm4gcHJvY2Vzcyhkb21haW4sIGZhbHNlLCB1c2VTdGQzQVNDSUkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0b1VuaWNvZGU6IHRvVW5pY29kZSxcbiAgICB0b0FzY2lpOiB0b0FzY2lpLFxuICB9O1xufSkpO1xuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiLyoqXHJcbiAqIFtqcy1zaGEzXXtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZW1uMTc4L2pzLXNoYTN9XHJcbiAqXHJcbiAqIEB2ZXJzaW9uIDAuNS43XHJcbiAqIEBhdXRob3IgQ2hlbiwgWWktQ3l1YW4gW2VtbjE3OEBnbWFpbC5jb21dXHJcbiAqIEBjb3B5cmlnaHQgQ2hlbiwgWWktQ3l1YW4gMjAxNS0yMDE2XHJcbiAqIEBsaWNlbnNlIE1JVFxyXG4gKi9cclxuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSAqL1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IHt9O1xyXG4gIHZhciBOT0RFX0pTID0gIXJvb3QuSlNfU0hBM19OT19OT0RFX0pTICYmIHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJiBwcm9jZXNzLnZlcnNpb25zICYmIHByb2Nlc3MudmVyc2lvbnMubm9kZTtcclxuICBpZiAoTk9ERV9KUykge1xyXG4gICAgcm9vdCA9IGdsb2JhbDtcclxuICB9XHJcbiAgdmFyIENPTU1PTl9KUyA9ICFyb290LkpTX1NIQTNfTk9fQ09NTU9OX0pTICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzO1xyXG4gIHZhciBIRVhfQ0hBUlMgPSAnMDEyMzQ1Njc4OWFiY2RlZicuc3BsaXQoJycpO1xyXG4gIHZhciBTSEFLRV9QQURESU5HID0gWzMxLCA3OTM2LCAyMDMxNjE2LCA1MjAwOTM2OTZdO1xyXG4gIHZhciBLRUNDQUtfUEFERElORyA9IFsxLCAyNTYsIDY1NTM2LCAxNjc3NzIxNl07XHJcbiAgdmFyIFBBRERJTkcgPSBbNiwgMTUzNiwgMzkzMjE2LCAxMDA2NjMyOTZdO1xyXG4gIHZhciBTSElGVCA9IFswLCA4LCAxNiwgMjRdO1xyXG4gIHZhciBSQyA9IFsxLCAwLCAzMjg5OCwgMCwgMzI5MDYsIDIxNDc0ODM2NDgsIDIxNDc1MTY0MTYsIDIxNDc0ODM2NDgsIDMyOTA3LCAwLCAyMTQ3NDgzNjQ5LFxyXG4gICAgICAgICAgICAwLCAyMTQ3NTE2NTQ1LCAyMTQ3NDgzNjQ4LCAzMjc3NywgMjE0NzQ4MzY0OCwgMTM4LCAwLCAxMzYsIDAsIDIxNDc1MTY0MjUsIDAsXHJcbiAgICAgICAgICAgIDIxNDc0ODM2NTgsIDAsIDIxNDc1MTY1NTUsIDAsIDEzOSwgMjE0NzQ4MzY0OCwgMzI5MDUsIDIxNDc0ODM2NDgsIDMyNzcxLFxyXG4gICAgICAgICAgICAyMTQ3NDgzNjQ4LCAzMjc3MCwgMjE0NzQ4MzY0OCwgMTI4LCAyMTQ3NDgzNjQ4LCAzMjc3OCwgMCwgMjE0NzQ4MzY1OCwgMjE0NzQ4MzY0OCxcclxuICAgICAgICAgICAgMjE0NzUxNjU0NSwgMjE0NzQ4MzY0OCwgMzI4OTYsIDIxNDc0ODM2NDgsIDIxNDc0ODM2NDksIDAsIDIxNDc1MTY0MjQsIDIxNDc0ODM2NDhdO1xyXG4gIHZhciBCSVRTID0gWzIyNCwgMjU2LCAzODQsIDUxMl07XHJcbiAgdmFyIFNIQUtFX0JJVFMgPSBbMTI4LCAyNTZdO1xyXG4gIHZhciBPVVRQVVRfVFlQRVMgPSBbJ2hleCcsICdidWZmZXInLCAnYXJyYXlCdWZmZXInLCAnYXJyYXknXTtcclxuXHJcbiAgdmFyIGNyZWF0ZU91dHB1dE1ldGhvZCA9IGZ1bmN0aW9uIChiaXRzLCBwYWRkaW5nLCBvdXRwdXRUeXBlKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgcmV0dXJuIG5ldyBLZWNjYWsoYml0cywgcGFkZGluZywgYml0cykudXBkYXRlKG1lc3NhZ2UpW291dHB1dFR5cGVdKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHZhciBjcmVhdGVTaGFrZU91dHB1dE1ldGhvZCA9IGZ1bmN0aW9uIChiaXRzLCBwYWRkaW5nLCBvdXRwdXRUeXBlKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKG1lc3NhZ2UsIG91dHB1dEJpdHMpIHtcclxuICAgICAgcmV0dXJuIG5ldyBLZWNjYWsoYml0cywgcGFkZGluZywgb3V0cHV0Qml0cykudXBkYXRlKG1lc3NhZ2UpW291dHB1dFR5cGVdKCk7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbiAoYml0cywgcGFkZGluZykge1xyXG4gICAgdmFyIG1ldGhvZCA9IGNyZWF0ZU91dHB1dE1ldGhvZChiaXRzLCBwYWRkaW5nLCAnaGV4Jyk7XHJcbiAgICBtZXRob2QuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbmV3IEtlY2NhayhiaXRzLCBwYWRkaW5nLCBiaXRzKTtcclxuICAgIH07XHJcbiAgICBtZXRob2QudXBkYXRlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgcmV0dXJuIG1ldGhvZC5jcmVhdGUoKS51cGRhdGUobWVzc2FnZSk7XHJcbiAgICB9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBPVVRQVVRfVFlQRVMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgdmFyIHR5cGUgPSBPVVRQVVRfVFlQRVNbaV07XHJcbiAgICAgIG1ldGhvZFt0eXBlXSA9IGNyZWF0ZU91dHB1dE1ldGhvZChiaXRzLCBwYWRkaW5nLCB0eXBlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtZXRob2Q7XHJcbiAgfTtcclxuXHJcbiAgdmFyIGNyZWF0ZVNoYWtlTWV0aG9kID0gZnVuY3Rpb24gKGJpdHMsIHBhZGRpbmcpIHtcclxuICAgIHZhciBtZXRob2QgPSBjcmVhdGVTaGFrZU91dHB1dE1ldGhvZChiaXRzLCBwYWRkaW5nLCAnaGV4Jyk7XHJcbiAgICBtZXRob2QuY3JlYXRlID0gZnVuY3Rpb24gKG91dHB1dEJpdHMpIHtcclxuICAgICAgcmV0dXJuIG5ldyBLZWNjYWsoYml0cywgcGFkZGluZywgb3V0cHV0Qml0cyk7XHJcbiAgICB9O1xyXG4gICAgbWV0aG9kLnVwZGF0ZSA9IGZ1bmN0aW9uIChtZXNzYWdlLCBvdXRwdXRCaXRzKSB7XHJcbiAgICAgIHJldHVybiBtZXRob2QuY3JlYXRlKG91dHB1dEJpdHMpLnVwZGF0ZShtZXNzYWdlKTtcclxuICAgIH07XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IE9VVFBVVF9UWVBFUy5sZW5ndGg7ICsraSkge1xyXG4gICAgICB2YXIgdHlwZSA9IE9VVFBVVF9UWVBFU1tpXTtcclxuICAgICAgbWV0aG9kW3R5cGVdID0gY3JlYXRlU2hha2VPdXRwdXRNZXRob2QoYml0cywgcGFkZGluZywgdHlwZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWV0aG9kO1xyXG4gIH07XHJcblxyXG4gIHZhciBhbGdvcml0aG1zID0gW1xyXG4gICAge25hbWU6ICdrZWNjYWsnLCBwYWRkaW5nOiBLRUNDQUtfUEFERElORywgYml0czogQklUUywgY3JlYXRlTWV0aG9kOiBjcmVhdGVNZXRob2R9LFxyXG4gICAge25hbWU6ICdzaGEzJywgcGFkZGluZzogUEFERElORywgYml0czogQklUUywgY3JlYXRlTWV0aG9kOiBjcmVhdGVNZXRob2R9LFxyXG4gICAge25hbWU6ICdzaGFrZScsIHBhZGRpbmc6IFNIQUtFX1BBRERJTkcsIGJpdHM6IFNIQUtFX0JJVFMsIGNyZWF0ZU1ldGhvZDogY3JlYXRlU2hha2VNZXRob2R9XHJcbiAgXTtcclxuXHJcbiAgdmFyIG1ldGhvZHMgPSB7fSwgbWV0aG9kTmFtZXMgPSBbXTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGdvcml0aG1zLmxlbmd0aDsgKytpKSB7XHJcbiAgICB2YXIgYWxnb3JpdGhtID0gYWxnb3JpdGhtc1tpXTtcclxuICAgIHZhciBiaXRzICA9IGFsZ29yaXRobS5iaXRzO1xyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBiaXRzLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgIHZhciBtZXRob2ROYW1lID0gYWxnb3JpdGhtLm5hbWUgKydfJyArIGJpdHNbal07XHJcbiAgICAgIG1ldGhvZE5hbWVzLnB1c2gobWV0aG9kTmFtZSk7XHJcbiAgICAgIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBhbGdvcml0aG0uY3JlYXRlTWV0aG9kKGJpdHNbal0sIGFsZ29yaXRobS5wYWRkaW5nKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIEtlY2NhayhiaXRzLCBwYWRkaW5nLCBvdXRwdXRCaXRzKSB7XHJcbiAgICB0aGlzLmJsb2NrcyA9IFtdO1xyXG4gICAgdGhpcy5zID0gW107XHJcbiAgICB0aGlzLnBhZGRpbmcgPSBwYWRkaW5nO1xyXG4gICAgdGhpcy5vdXRwdXRCaXRzID0gb3V0cHV0Qml0cztcclxuICAgIHRoaXMucmVzZXQgPSB0cnVlO1xyXG4gICAgdGhpcy5ibG9jayA9IDA7XHJcbiAgICB0aGlzLnN0YXJ0ID0gMDtcclxuICAgIHRoaXMuYmxvY2tDb3VudCA9ICgxNjAwIC0gKGJpdHMgPDwgMSkpID4+IDU7XHJcbiAgICB0aGlzLmJ5dGVDb3VudCA9IHRoaXMuYmxvY2tDb3VudCA8PCAyO1xyXG4gICAgdGhpcy5vdXRwdXRCbG9ja3MgPSBvdXRwdXRCaXRzID4+IDU7XHJcbiAgICB0aGlzLmV4dHJhQnl0ZXMgPSAob3V0cHV0Qml0cyAmIDMxKSA+PiAzO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTA7ICsraSkge1xyXG4gICAgICB0aGlzLnNbaV0gPSAwO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgS2VjY2FrLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG4gICAgdmFyIG5vdFN0cmluZyA9IHR5cGVvZiBtZXNzYWdlICE9PSAnc3RyaW5nJztcclxuICAgIGlmIChub3RTdHJpbmcgJiYgbWVzc2FnZS5jb25zdHJ1Y3RvciA9PT0gQXJyYXlCdWZmZXIpIHtcclxuICAgICAgbWVzc2FnZSA9IG5ldyBVaW50OEFycmF5KG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgdmFyIGxlbmd0aCA9IG1lc3NhZ2UubGVuZ3RoLCBibG9ja3MgPSB0aGlzLmJsb2NrcywgYnl0ZUNvdW50ID0gdGhpcy5ieXRlQ291bnQsXHJcbiAgICAgIGJsb2NrQ291bnQgPSB0aGlzLmJsb2NrQ291bnQsIGluZGV4ID0gMCwgcyA9IHRoaXMucywgaSwgY29kZTtcclxuXHJcbiAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcclxuICAgICAgaWYgKHRoaXMucmVzZXQpIHtcclxuICAgICAgICB0aGlzLnJlc2V0ID0gZmFsc2U7XHJcbiAgICAgICAgYmxvY2tzWzBdID0gdGhpcy5ibG9jaztcclxuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgYmxvY2tDb3VudCArIDE7ICsraSkge1xyXG4gICAgICAgICAgYmxvY2tzW2ldID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG5vdFN0cmluZykge1xyXG4gICAgICAgIGZvciAoaSA9IHRoaXMuc3RhcnQ7IGluZGV4IDwgbGVuZ3RoICYmIGkgPCBieXRlQ291bnQ7ICsraW5kZXgpIHtcclxuICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9IG1lc3NhZ2VbaW5kZXhdIDw8IFNISUZUW2krKyAmIDNdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKGkgPSB0aGlzLnN0YXJ0OyBpbmRleCA8IGxlbmd0aCAmJiBpIDwgYnl0ZUNvdW50OyArK2luZGV4KSB7XHJcbiAgICAgICAgICBjb2RlID0gbWVzc2FnZS5jaGFyQ29kZUF0KGluZGV4KTtcclxuICAgICAgICAgIGlmIChjb2RlIDwgMHg4MCkge1xyXG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSBjb2RlIDw8IFNISUZUW2krKyAmIDNdO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHg4MDApIHtcclxuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4YzAgfCAoY29kZSA+PiA2KSkgPDwgU0hJRlRbaSsrICYgM107XHJcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKGNvZGUgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweGQ4MDAgfHwgY29kZSA+PSAweGUwMDApIHtcclxuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ZTAgfCAoY29kZSA+PiAxMikpIDw8IFNISUZUW2krKyAmIDNdO1xyXG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8ICgoY29kZSA+PiA2KSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcclxuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoY29kZSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvZGUgPSAweDEwMDAwICsgKCgoY29kZSAmIDB4M2ZmKSA8PCAxMCkgfCAobWVzc2FnZS5jaGFyQ29kZUF0KCsraW5kZXgpICYgMHgzZmYpKTtcclxuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ZjAgfCAoY29kZSA+PiAxOCkpIDw8IFNISUZUW2krKyAmIDNdO1xyXG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8ICgoY29kZSA+PiAxMikgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XHJcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKChjb2RlID4+IDYpICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xyXG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8IChjb2RlICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLmxhc3RCeXRlSW5kZXggPSBpO1xyXG4gICAgICBpZiAoaSA+PSBieXRlQ291bnQpIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ID0gaSAtIGJ5dGVDb3VudDtcclxuICAgICAgICB0aGlzLmJsb2NrID0gYmxvY2tzW2Jsb2NrQ291bnRdO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBibG9ja0NvdW50OyArK2kpIHtcclxuICAgICAgICAgIHNbaV0gXj0gYmxvY2tzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmKHMpO1xyXG4gICAgICAgIHRoaXMucmVzZXQgPSB0cnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnQgPSBpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBLZWNjYWsucHJvdG90eXBlLmZpbmFsaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzLCBpID0gdGhpcy5sYXN0Qnl0ZUluZGV4LCBibG9ja0NvdW50ID0gdGhpcy5ibG9ja0NvdW50LCBzID0gdGhpcy5zO1xyXG4gICAgYmxvY2tzW2kgPj4gMl0gfD0gdGhpcy5wYWRkaW5nW2kgJiAzXTtcclxuICAgIGlmICh0aGlzLmxhc3RCeXRlSW5kZXggPT09IHRoaXMuYnl0ZUNvdW50KSB7XHJcbiAgICAgIGJsb2Nrc1swXSA9IGJsb2Nrc1tibG9ja0NvdW50XTtcclxuICAgICAgZm9yIChpID0gMTsgaSA8IGJsb2NrQ291bnQgKyAxOyArK2kpIHtcclxuICAgICAgICBibG9ja3NbaV0gPSAwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBibG9ja3NbYmxvY2tDb3VudCAtIDFdIHw9IDB4ODAwMDAwMDA7XHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgYmxvY2tDb3VudDsgKytpKSB7XHJcbiAgICAgIHNbaV0gXj0gYmxvY2tzW2ldO1xyXG4gICAgfVxyXG4gICAgZihzKTtcclxuICB9O1xyXG5cclxuICBLZWNjYWsucHJvdG90eXBlLnRvU3RyaW5nID0gS2VjY2FrLnByb3RvdHlwZS5oZXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmZpbmFsaXplKCk7XHJcblxyXG4gICAgdmFyIGJsb2NrQ291bnQgPSB0aGlzLmJsb2NrQ291bnQsIHMgPSB0aGlzLnMsIG91dHB1dEJsb2NrcyA9IHRoaXMub3V0cHV0QmxvY2tzLFxyXG4gICAgICAgIGV4dHJhQnl0ZXMgPSB0aGlzLmV4dHJhQnl0ZXMsIGkgPSAwLCBqID0gMDtcclxuICAgIHZhciBoZXggPSAnJywgYmxvY2s7XHJcbiAgICB3aGlsZSAoaiA8IG91dHB1dEJsb2Nrcykge1xyXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgYmxvY2tDb3VudCAmJiBqIDwgb3V0cHV0QmxvY2tzOyArK2ksICsraikge1xyXG4gICAgICAgIGJsb2NrID0gc1tpXTtcclxuICAgICAgICBoZXggKz0gSEVYX0NIQVJTWyhibG9jayA+PiA0KSAmIDB4MEZdICsgSEVYX0NIQVJTW2Jsb2NrICYgMHgwRl0gK1xyXG4gICAgICAgICAgICAgICBIRVhfQ0hBUlNbKGJsb2NrID4+IDEyKSAmIDB4MEZdICsgSEVYX0NIQVJTWyhibG9jayA+PiA4KSAmIDB4MEZdICtcclxuICAgICAgICAgICAgICAgSEVYX0NIQVJTWyhibG9jayA+PiAyMCkgJiAweDBGXSArIEhFWF9DSEFSU1soYmxvY2sgPj4gMTYpICYgMHgwRl0gK1xyXG4gICAgICAgICAgICAgICBIRVhfQ0hBUlNbKGJsb2NrID4+IDI4KSAmIDB4MEZdICsgSEVYX0NIQVJTWyhibG9jayA+PiAyNCkgJiAweDBGXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaiAlIGJsb2NrQ291bnQgPT09IDApIHtcclxuICAgICAgICBmKHMpO1xyXG4gICAgICAgIGkgPSAwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZXh0cmFCeXRlcykge1xyXG4gICAgICBibG9jayA9IHNbaV07XHJcbiAgICAgIGlmIChleHRyYUJ5dGVzID4gMCkge1xyXG4gICAgICAgIGhleCArPSBIRVhfQ0hBUlNbKGJsb2NrID4+IDQpICYgMHgwRl0gKyBIRVhfQ0hBUlNbYmxvY2sgJiAweDBGXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXh0cmFCeXRlcyA+IDEpIHtcclxuICAgICAgICBoZXggKz0gSEVYX0NIQVJTWyhibG9jayA+PiAxMikgJiAweDBGXSArIEhFWF9DSEFSU1soYmxvY2sgPj4gOCkgJiAweDBGXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXh0cmFCeXRlcyA+IDIpIHtcclxuICAgICAgICBoZXggKz0gSEVYX0NIQVJTWyhibG9jayA+PiAyMCkgJiAweDBGXSArIEhFWF9DSEFSU1soYmxvY2sgPj4gMTYpICYgMHgwRl07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBoZXg7XHJcbiAgfTtcclxuXHJcbiAgS2VjY2FrLnByb3RvdHlwZS5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuZmluYWxpemUoKTtcclxuXHJcbiAgICB2YXIgYmxvY2tDb3VudCA9IHRoaXMuYmxvY2tDb3VudCwgcyA9IHRoaXMucywgb3V0cHV0QmxvY2tzID0gdGhpcy5vdXRwdXRCbG9ja3MsXHJcbiAgICAgICAgZXh0cmFCeXRlcyA9IHRoaXMuZXh0cmFCeXRlcywgaSA9IDAsIGogPSAwO1xyXG4gICAgdmFyIGJ5dGVzID0gdGhpcy5vdXRwdXRCaXRzID4+IDM7XHJcbiAgICB2YXIgYnVmZmVyO1xyXG4gICAgaWYgKGV4dHJhQnl0ZXMpIHtcclxuICAgICAgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKChvdXRwdXRCbG9ja3MgKyAxKSA8PCAyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihieXRlcyk7XHJcbiAgICB9XHJcbiAgICB2YXIgYXJyYXkgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcclxuICAgIHdoaWxlIChqIDwgb3V0cHV0QmxvY2tzKSB7XHJcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBibG9ja0NvdW50ICYmIGogPCBvdXRwdXRCbG9ja3M7ICsraSwgKytqKSB7XHJcbiAgICAgICAgYXJyYXlbal0gPSBzW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChqICUgYmxvY2tDb3VudCA9PT0gMCkge1xyXG4gICAgICAgIGYocyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChleHRyYUJ5dGVzKSB7XHJcbiAgICAgIGFycmF5W2ldID0gc1tpXTtcclxuICAgICAgYnVmZmVyID0gYnVmZmVyLnNsaWNlKDAsIGJ5dGVzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBidWZmZXI7XHJcbiAgfTtcclxuXHJcbiAgS2VjY2FrLnByb3RvdHlwZS5idWZmZXIgPSBLZWNjYWsucHJvdG90eXBlLmFycmF5QnVmZmVyO1xyXG5cclxuICBLZWNjYWsucHJvdG90eXBlLmRpZ2VzdCA9IEtlY2Nhay5wcm90b3R5cGUuYXJyYXkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmZpbmFsaXplKCk7XHJcblxyXG4gICAgdmFyIGJsb2NrQ291bnQgPSB0aGlzLmJsb2NrQ291bnQsIHMgPSB0aGlzLnMsIG91dHB1dEJsb2NrcyA9IHRoaXMub3V0cHV0QmxvY2tzLFxyXG4gICAgICAgIGV4dHJhQnl0ZXMgPSB0aGlzLmV4dHJhQnl0ZXMsIGkgPSAwLCBqID0gMDtcclxuICAgIHZhciBhcnJheSA9IFtdLCBvZmZzZXQsIGJsb2NrO1xyXG4gICAgd2hpbGUgKGogPCBvdXRwdXRCbG9ja3MpIHtcclxuICAgICAgZm9yIChpID0gMDsgaSA8IGJsb2NrQ291bnQgJiYgaiA8IG91dHB1dEJsb2NrczsgKytpLCArK2opIHtcclxuICAgICAgICBvZmZzZXQgPSBqIDw8IDI7XHJcbiAgICAgICAgYmxvY2sgPSBzW2ldO1xyXG4gICAgICAgIGFycmF5W29mZnNldF0gPSBibG9jayAmIDB4RkY7XHJcbiAgICAgICAgYXJyYXlbb2Zmc2V0ICsgMV0gPSAoYmxvY2sgPj4gOCkgJiAweEZGO1xyXG4gICAgICAgIGFycmF5W29mZnNldCArIDJdID0gKGJsb2NrID4+IDE2KSAmIDB4RkY7XHJcbiAgICAgICAgYXJyYXlbb2Zmc2V0ICsgM10gPSAoYmxvY2sgPj4gMjQpICYgMHhGRjtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaiAlIGJsb2NrQ291bnQgPT09IDApIHtcclxuICAgICAgICBmKHMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZXh0cmFCeXRlcykge1xyXG4gICAgICBvZmZzZXQgPSBqIDw8IDI7XHJcbiAgICAgIGJsb2NrID0gc1tpXTtcclxuICAgICAgaWYgKGV4dHJhQnl0ZXMgPiAwKSB7XHJcbiAgICAgICAgYXJyYXlbb2Zmc2V0XSA9IGJsb2NrICYgMHhGRjtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXh0cmFCeXRlcyA+IDEpIHtcclxuICAgICAgICBhcnJheVtvZmZzZXQgKyAxXSA9IChibG9jayA+PiA4KSAmIDB4RkY7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGV4dHJhQnl0ZXMgPiAyKSB7XHJcbiAgICAgICAgYXJyYXlbb2Zmc2V0ICsgMl0gPSAoYmxvY2sgPj4gMTYpICYgMHhGRjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycmF5O1xyXG4gIH07XHJcblxyXG4gIHZhciBmID0gZnVuY3Rpb24gKHMpIHtcclxuICAgIHZhciBoLCBsLCBuLCBjMCwgYzEsIGMyLCBjMywgYzQsIGM1LCBjNiwgYzcsIGM4LCBjOSxcclxuICAgICAgICBiMCwgYjEsIGIyLCBiMywgYjQsIGI1LCBiNiwgYjcsIGI4LCBiOSwgYjEwLCBiMTEsIGIxMiwgYjEzLCBiMTQsIGIxNSwgYjE2LCBiMTcsXHJcbiAgICAgICAgYjE4LCBiMTksIGIyMCwgYjIxLCBiMjIsIGIyMywgYjI0LCBiMjUsIGIyNiwgYjI3LCBiMjgsIGIyOSwgYjMwLCBiMzEsIGIzMiwgYjMzLFxyXG4gICAgICAgIGIzNCwgYjM1LCBiMzYsIGIzNywgYjM4LCBiMzksIGI0MCwgYjQxLCBiNDIsIGI0MywgYjQ0LCBiNDUsIGI0NiwgYjQ3LCBiNDgsIGI0OTtcclxuICAgIGZvciAobiA9IDA7IG4gPCA0ODsgbiArPSAyKSB7XHJcbiAgICAgIGMwID0gc1swXSBeIHNbMTBdIF4gc1syMF0gXiBzWzMwXSBeIHNbNDBdO1xyXG4gICAgICBjMSA9IHNbMV0gXiBzWzExXSBeIHNbMjFdIF4gc1szMV0gXiBzWzQxXTtcclxuICAgICAgYzIgPSBzWzJdIF4gc1sxMl0gXiBzWzIyXSBeIHNbMzJdIF4gc1s0Ml07XHJcbiAgICAgIGMzID0gc1szXSBeIHNbMTNdIF4gc1syM10gXiBzWzMzXSBeIHNbNDNdO1xyXG4gICAgICBjNCA9IHNbNF0gXiBzWzE0XSBeIHNbMjRdIF4gc1szNF0gXiBzWzQ0XTtcclxuICAgICAgYzUgPSBzWzVdIF4gc1sxNV0gXiBzWzI1XSBeIHNbMzVdIF4gc1s0NV07XHJcbiAgICAgIGM2ID0gc1s2XSBeIHNbMTZdIF4gc1syNl0gXiBzWzM2XSBeIHNbNDZdO1xyXG4gICAgICBjNyA9IHNbN10gXiBzWzE3XSBeIHNbMjddIF4gc1szN10gXiBzWzQ3XTtcclxuICAgICAgYzggPSBzWzhdIF4gc1sxOF0gXiBzWzI4XSBeIHNbMzhdIF4gc1s0OF07XHJcbiAgICAgIGM5ID0gc1s5XSBeIHNbMTldIF4gc1syOV0gXiBzWzM5XSBeIHNbNDldO1xyXG5cclxuICAgICAgaCA9IGM4IF4gKChjMiA8PCAxKSB8IChjMyA+Pj4gMzEpKTtcclxuICAgICAgbCA9IGM5IF4gKChjMyA8PCAxKSB8IChjMiA+Pj4gMzEpKTtcclxuICAgICAgc1swXSBePSBoO1xyXG4gICAgICBzWzFdIF49IGw7XHJcbiAgICAgIHNbMTBdIF49IGg7XHJcbiAgICAgIHNbMTFdIF49IGw7XHJcbiAgICAgIHNbMjBdIF49IGg7XHJcbiAgICAgIHNbMjFdIF49IGw7XHJcbiAgICAgIHNbMzBdIF49IGg7XHJcbiAgICAgIHNbMzFdIF49IGw7XHJcbiAgICAgIHNbNDBdIF49IGg7XHJcbiAgICAgIHNbNDFdIF49IGw7XHJcbiAgICAgIGggPSBjMCBeICgoYzQgPDwgMSkgfCAoYzUgPj4+IDMxKSk7XHJcbiAgICAgIGwgPSBjMSBeICgoYzUgPDwgMSkgfCAoYzQgPj4+IDMxKSk7XHJcbiAgICAgIHNbMl0gXj0gaDtcclxuICAgICAgc1szXSBePSBsO1xyXG4gICAgICBzWzEyXSBePSBoO1xyXG4gICAgICBzWzEzXSBePSBsO1xyXG4gICAgICBzWzIyXSBePSBoO1xyXG4gICAgICBzWzIzXSBePSBsO1xyXG4gICAgICBzWzMyXSBePSBoO1xyXG4gICAgICBzWzMzXSBePSBsO1xyXG4gICAgICBzWzQyXSBePSBoO1xyXG4gICAgICBzWzQzXSBePSBsO1xyXG4gICAgICBoID0gYzIgXiAoKGM2IDw8IDEpIHwgKGM3ID4+PiAzMSkpO1xyXG4gICAgICBsID0gYzMgXiAoKGM3IDw8IDEpIHwgKGM2ID4+PiAzMSkpO1xyXG4gICAgICBzWzRdIF49IGg7XHJcbiAgICAgIHNbNV0gXj0gbDtcclxuICAgICAgc1sxNF0gXj0gaDtcclxuICAgICAgc1sxNV0gXj0gbDtcclxuICAgICAgc1syNF0gXj0gaDtcclxuICAgICAgc1syNV0gXj0gbDtcclxuICAgICAgc1szNF0gXj0gaDtcclxuICAgICAgc1szNV0gXj0gbDtcclxuICAgICAgc1s0NF0gXj0gaDtcclxuICAgICAgc1s0NV0gXj0gbDtcclxuICAgICAgaCA9IGM0IF4gKChjOCA8PCAxKSB8IChjOSA+Pj4gMzEpKTtcclxuICAgICAgbCA9IGM1IF4gKChjOSA8PCAxKSB8IChjOCA+Pj4gMzEpKTtcclxuICAgICAgc1s2XSBePSBoO1xyXG4gICAgICBzWzddIF49IGw7XHJcbiAgICAgIHNbMTZdIF49IGg7XHJcbiAgICAgIHNbMTddIF49IGw7XHJcbiAgICAgIHNbMjZdIF49IGg7XHJcbiAgICAgIHNbMjddIF49IGw7XHJcbiAgICAgIHNbMzZdIF49IGg7XHJcbiAgICAgIHNbMzddIF49IGw7XHJcbiAgICAgIHNbNDZdIF49IGg7XHJcbiAgICAgIHNbNDddIF49IGw7XHJcbiAgICAgIGggPSBjNiBeICgoYzAgPDwgMSkgfCAoYzEgPj4+IDMxKSk7XHJcbiAgICAgIGwgPSBjNyBeICgoYzEgPDwgMSkgfCAoYzAgPj4+IDMxKSk7XHJcbiAgICAgIHNbOF0gXj0gaDtcclxuICAgICAgc1s5XSBePSBsO1xyXG4gICAgICBzWzE4XSBePSBoO1xyXG4gICAgICBzWzE5XSBePSBsO1xyXG4gICAgICBzWzI4XSBePSBoO1xyXG4gICAgICBzWzI5XSBePSBsO1xyXG4gICAgICBzWzM4XSBePSBoO1xyXG4gICAgICBzWzM5XSBePSBsO1xyXG4gICAgICBzWzQ4XSBePSBoO1xyXG4gICAgICBzWzQ5XSBePSBsO1xyXG5cclxuICAgICAgYjAgPSBzWzBdO1xyXG4gICAgICBiMSA9IHNbMV07XHJcbiAgICAgIGIzMiA9IChzWzExXSA8PCA0KSB8IChzWzEwXSA+Pj4gMjgpO1xyXG4gICAgICBiMzMgPSAoc1sxMF0gPDwgNCkgfCAoc1sxMV0gPj4+IDI4KTtcclxuICAgICAgYjE0ID0gKHNbMjBdIDw8IDMpIHwgKHNbMjFdID4+PiAyOSk7XHJcbiAgICAgIGIxNSA9IChzWzIxXSA8PCAzKSB8IChzWzIwXSA+Pj4gMjkpO1xyXG4gICAgICBiNDYgPSAoc1szMV0gPDwgOSkgfCAoc1szMF0gPj4+IDIzKTtcclxuICAgICAgYjQ3ID0gKHNbMzBdIDw8IDkpIHwgKHNbMzFdID4+PiAyMyk7XHJcbiAgICAgIGIyOCA9IChzWzQwXSA8PCAxOCkgfCAoc1s0MV0gPj4+IDE0KTtcclxuICAgICAgYjI5ID0gKHNbNDFdIDw8IDE4KSB8IChzWzQwXSA+Pj4gMTQpO1xyXG4gICAgICBiMjAgPSAoc1syXSA8PCAxKSB8IChzWzNdID4+PiAzMSk7XHJcbiAgICAgIGIyMSA9IChzWzNdIDw8IDEpIHwgKHNbMl0gPj4+IDMxKTtcclxuICAgICAgYjIgPSAoc1sxM10gPDwgMTIpIHwgKHNbMTJdID4+PiAyMCk7XHJcbiAgICAgIGIzID0gKHNbMTJdIDw8IDEyKSB8IChzWzEzXSA+Pj4gMjApO1xyXG4gICAgICBiMzQgPSAoc1syMl0gPDwgMTApIHwgKHNbMjNdID4+PiAyMik7XHJcbiAgICAgIGIzNSA9IChzWzIzXSA8PCAxMCkgfCAoc1syMl0gPj4+IDIyKTtcclxuICAgICAgYjE2ID0gKHNbMzNdIDw8IDEzKSB8IChzWzMyXSA+Pj4gMTkpO1xyXG4gICAgICBiMTcgPSAoc1szMl0gPDwgMTMpIHwgKHNbMzNdID4+PiAxOSk7XHJcbiAgICAgIGI0OCA9IChzWzQyXSA8PCAyKSB8IChzWzQzXSA+Pj4gMzApO1xyXG4gICAgICBiNDkgPSAoc1s0M10gPDwgMikgfCAoc1s0Ml0gPj4+IDMwKTtcclxuICAgICAgYjQwID0gKHNbNV0gPDwgMzApIHwgKHNbNF0gPj4+IDIpO1xyXG4gICAgICBiNDEgPSAoc1s0XSA8PCAzMCkgfCAoc1s1XSA+Pj4gMik7XHJcbiAgICAgIGIyMiA9IChzWzE0XSA8PCA2KSB8IChzWzE1XSA+Pj4gMjYpO1xyXG4gICAgICBiMjMgPSAoc1sxNV0gPDwgNikgfCAoc1sxNF0gPj4+IDI2KTtcclxuICAgICAgYjQgPSAoc1syNV0gPDwgMTEpIHwgKHNbMjRdID4+PiAyMSk7XHJcbiAgICAgIGI1ID0gKHNbMjRdIDw8IDExKSB8IChzWzI1XSA+Pj4gMjEpO1xyXG4gICAgICBiMzYgPSAoc1szNF0gPDwgMTUpIHwgKHNbMzVdID4+PiAxNyk7XHJcbiAgICAgIGIzNyA9IChzWzM1XSA8PCAxNSkgfCAoc1szNF0gPj4+IDE3KTtcclxuICAgICAgYjE4ID0gKHNbNDVdIDw8IDI5KSB8IChzWzQ0XSA+Pj4gMyk7XHJcbiAgICAgIGIxOSA9IChzWzQ0XSA8PCAyOSkgfCAoc1s0NV0gPj4+IDMpO1xyXG4gICAgICBiMTAgPSAoc1s2XSA8PCAyOCkgfCAoc1s3XSA+Pj4gNCk7XHJcbiAgICAgIGIxMSA9IChzWzddIDw8IDI4KSB8IChzWzZdID4+PiA0KTtcclxuICAgICAgYjQyID0gKHNbMTddIDw8IDIzKSB8IChzWzE2XSA+Pj4gOSk7XHJcbiAgICAgIGI0MyA9IChzWzE2XSA8PCAyMykgfCAoc1sxN10gPj4+IDkpO1xyXG4gICAgICBiMjQgPSAoc1syNl0gPDwgMjUpIHwgKHNbMjddID4+PiA3KTtcclxuICAgICAgYjI1ID0gKHNbMjddIDw8IDI1KSB8IChzWzI2XSA+Pj4gNyk7XHJcbiAgICAgIGI2ID0gKHNbMzZdIDw8IDIxKSB8IChzWzM3XSA+Pj4gMTEpO1xyXG4gICAgICBiNyA9IChzWzM3XSA8PCAyMSkgfCAoc1szNl0gPj4+IDExKTtcclxuICAgICAgYjM4ID0gKHNbNDddIDw8IDI0KSB8IChzWzQ2XSA+Pj4gOCk7XHJcbiAgICAgIGIzOSA9IChzWzQ2XSA8PCAyNCkgfCAoc1s0N10gPj4+IDgpO1xyXG4gICAgICBiMzAgPSAoc1s4XSA8PCAyNykgfCAoc1s5XSA+Pj4gNSk7XHJcbiAgICAgIGIzMSA9IChzWzldIDw8IDI3KSB8IChzWzhdID4+PiA1KTtcclxuICAgICAgYjEyID0gKHNbMThdIDw8IDIwKSB8IChzWzE5XSA+Pj4gMTIpO1xyXG4gICAgICBiMTMgPSAoc1sxOV0gPDwgMjApIHwgKHNbMThdID4+PiAxMik7XHJcbiAgICAgIGI0NCA9IChzWzI5XSA8PCA3KSB8IChzWzI4XSA+Pj4gMjUpO1xyXG4gICAgICBiNDUgPSAoc1syOF0gPDwgNykgfCAoc1syOV0gPj4+IDI1KTtcclxuICAgICAgYjI2ID0gKHNbMzhdIDw8IDgpIHwgKHNbMzldID4+PiAyNCk7XHJcbiAgICAgIGIyNyA9IChzWzM5XSA8PCA4KSB8IChzWzM4XSA+Pj4gMjQpO1xyXG4gICAgICBiOCA9IChzWzQ4XSA8PCAxNCkgfCAoc1s0OV0gPj4+IDE4KTtcclxuICAgICAgYjkgPSAoc1s0OV0gPDwgMTQpIHwgKHNbNDhdID4+PiAxOCk7XHJcblxyXG4gICAgICBzWzBdID0gYjAgXiAofmIyICYgYjQpO1xyXG4gICAgICBzWzFdID0gYjEgXiAofmIzICYgYjUpO1xyXG4gICAgICBzWzEwXSA9IGIxMCBeICh+YjEyICYgYjE0KTtcclxuICAgICAgc1sxMV0gPSBiMTEgXiAofmIxMyAmIGIxNSk7XHJcbiAgICAgIHNbMjBdID0gYjIwIF4gKH5iMjIgJiBiMjQpO1xyXG4gICAgICBzWzIxXSA9IGIyMSBeICh+YjIzICYgYjI1KTtcclxuICAgICAgc1szMF0gPSBiMzAgXiAofmIzMiAmIGIzNCk7XHJcbiAgICAgIHNbMzFdID0gYjMxIF4gKH5iMzMgJiBiMzUpO1xyXG4gICAgICBzWzQwXSA9IGI0MCBeICh+YjQyICYgYjQ0KTtcclxuICAgICAgc1s0MV0gPSBiNDEgXiAofmI0MyAmIGI0NSk7XHJcbiAgICAgIHNbMl0gPSBiMiBeICh+YjQgJiBiNik7XHJcbiAgICAgIHNbM10gPSBiMyBeICh+YjUgJiBiNyk7XHJcbiAgICAgIHNbMTJdID0gYjEyIF4gKH5iMTQgJiBiMTYpO1xyXG4gICAgICBzWzEzXSA9IGIxMyBeICh+YjE1ICYgYjE3KTtcclxuICAgICAgc1syMl0gPSBiMjIgXiAofmIyNCAmIGIyNik7XHJcbiAgICAgIHNbMjNdID0gYjIzIF4gKH5iMjUgJiBiMjcpO1xyXG4gICAgICBzWzMyXSA9IGIzMiBeICh+YjM0ICYgYjM2KTtcclxuICAgICAgc1szM10gPSBiMzMgXiAofmIzNSAmIGIzNyk7XHJcbiAgICAgIHNbNDJdID0gYjQyIF4gKH5iNDQgJiBiNDYpO1xyXG4gICAgICBzWzQzXSA9IGI0MyBeICh+YjQ1ICYgYjQ3KTtcclxuICAgICAgc1s0XSA9IGI0IF4gKH5iNiAmIGI4KTtcclxuICAgICAgc1s1XSA9IGI1IF4gKH5iNyAmIGI5KTtcclxuICAgICAgc1sxNF0gPSBiMTQgXiAofmIxNiAmIGIxOCk7XHJcbiAgICAgIHNbMTVdID0gYjE1IF4gKH5iMTcgJiBiMTkpO1xyXG4gICAgICBzWzI0XSA9IGIyNCBeICh+YjI2ICYgYjI4KTtcclxuICAgICAgc1syNV0gPSBiMjUgXiAofmIyNyAmIGIyOSk7XHJcbiAgICAgIHNbMzRdID0gYjM0IF4gKH5iMzYgJiBiMzgpO1xyXG4gICAgICBzWzM1XSA9IGIzNSBeICh+YjM3ICYgYjM5KTtcclxuICAgICAgc1s0NF0gPSBiNDQgXiAofmI0NiAmIGI0OCk7XHJcbiAgICAgIHNbNDVdID0gYjQ1IF4gKH5iNDcgJiBiNDkpO1xyXG4gICAgICBzWzZdID0gYjYgXiAofmI4ICYgYjApO1xyXG4gICAgICBzWzddID0gYjcgXiAofmI5ICYgYjEpO1xyXG4gICAgICBzWzE2XSA9IGIxNiBeICh+YjE4ICYgYjEwKTtcclxuICAgICAgc1sxN10gPSBiMTcgXiAofmIxOSAmIGIxMSk7XHJcbiAgICAgIHNbMjZdID0gYjI2IF4gKH5iMjggJiBiMjApO1xyXG4gICAgICBzWzI3XSA9IGIyNyBeICh+YjI5ICYgYjIxKTtcclxuICAgICAgc1szNl0gPSBiMzYgXiAofmIzOCAmIGIzMCk7XHJcbiAgICAgIHNbMzddID0gYjM3IF4gKH5iMzkgJiBiMzEpO1xyXG4gICAgICBzWzQ2XSA9IGI0NiBeICh+YjQ4ICYgYjQwKTtcclxuICAgICAgc1s0N10gPSBiNDcgXiAofmI0OSAmIGI0MSk7XHJcbiAgICAgIHNbOF0gPSBiOCBeICh+YjAgJiBiMik7XHJcbiAgICAgIHNbOV0gPSBiOSBeICh+YjEgJiBiMyk7XHJcbiAgICAgIHNbMThdID0gYjE4IF4gKH5iMTAgJiBiMTIpO1xyXG4gICAgICBzWzE5XSA9IGIxOSBeICh+YjExICYgYjEzKTtcclxuICAgICAgc1syOF0gPSBiMjggXiAofmIyMCAmIGIyMik7XHJcbiAgICAgIHNbMjldID0gYjI5IF4gKH5iMjEgJiBiMjMpO1xyXG4gICAgICBzWzM4XSA9IGIzOCBeICh+YjMwICYgYjMyKTtcclxuICAgICAgc1szOV0gPSBiMzkgXiAofmIzMSAmIGIzMyk7XHJcbiAgICAgIHNbNDhdID0gYjQ4IF4gKH5iNDAgJiBiNDIpO1xyXG4gICAgICBzWzQ5XSA9IGI0OSBeICh+YjQxICYgYjQzKTtcclxuXHJcbiAgICAgIHNbMF0gXj0gUkNbbl07XHJcbiAgICAgIHNbMV0gXj0gUkNbbiArIDFdO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGlmIChDT01NT05fSlMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbWV0aG9kcztcclxuICB9IGVsc2Uge1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXRob2ROYW1lcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICByb290W21ldGhvZE5hbWVzW2ldXSA9IG1ldGhvZHNbbWV0aG9kTmFtZXNbaV1dO1xyXG4gICAgfVxyXG4gIH1cclxufSkoKTtcclxuIl19
