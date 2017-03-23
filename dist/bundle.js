/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 79);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * node.js - base abstract node for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var EventEmitter = __webpack_require__(63).EventEmitter;

/**
 * Node
 */

function Node(options) {
  var self = this;
  var Screen = __webpack_require__(15);

  if (!(this instanceof Node)) {
    return new Node(options);
  }

  EventEmitter.call(this);

  options = options || {};
  this.options = options;

  this.screen = this.screen || options.screen;

  if (!this.screen) {
    if (this.type === 'screen') {
      this.screen = this;
    } else if (Screen.total === 1) {
      this.screen = Screen.global;
    } else if (options.parent) {
      this.screen = options.parent;
      while (this.screen && this.screen.type !== 'screen') {
        this.screen = this.screen.parent;
      }
    } else if (Screen.total) {
      // This _should_ work in most cases as long as the element is appended
      // synchronously after the screen's creation. Throw error if not.
      this.screen = Screen.instances[Screen.instances.length - 1];
      process.nextTick(function () {
        if (!self.parent) {
          throw new Error('Element (' + self.type + ')' + ' was not appended synchronously after the' + ' screen\'s creation. Please set a `parent`' + ' or `screen` option in the element\'s constructor' + ' if you are going to use multiple screens and' + ' append the element later.');
        }
      });
    } else {
      throw new Error('No active screen.');
    }
  }

  this.parent = options.parent || null;
  this.children = [];
  this.$ = this._ = this.data = {};
  this.uid = Node.uid++;
  this.index = this.index != null ? this.index : -1;

  if (this.type !== 'screen') {
    this.detached = true;
  }

  if (this.parent) {
    this.parent.append(this);
  }

  (options.children || []).forEach(this.append.bind(this));
}

Node.uid = 0;

Node.prototype.__proto__ = EventEmitter.prototype;

Node.prototype.type = 'node';

Node.prototype.insert = function (element, i) {
  var self = this;

  if (element.screen && element.screen !== this.screen) {
    throw new Error('Cannot switch a node\'s screen.');
  }

  element.detach();
  element.parent = this;
  element.screen = this.screen;

  if (i === 0) {
    this.children.unshift(element);
  } else if (i === this.children.length) {
    this.children.push(element);
  } else {
    this.children.splice(i, 0, element);
  }

  element.emit('reparent', this);
  this.emit('adopt', element);

  (function emit(el) {
    var n = el.detached !== self.detached;
    el.detached = self.detached;
    if (n) el.emit('attach');
    el.children.forEach(emit);
  })(element);

  if (!this.screen.focused) {
    this.screen.focused = element;
  }
};

Node.prototype.prepend = function (element) {
  this.insert(element, 0);
};

Node.prototype.append = function (element) {
  this.insert(element, this.children.length);
};

Node.prototype.insertBefore = function (element, other) {
  var i = this.children.indexOf(other);
  if (~i) this.insert(element, i);
};

Node.prototype.insertAfter = function (element, other) {
  var i = this.children.indexOf(other);
  if (~i) this.insert(element, i + 1);
};

Node.prototype.remove = function (element) {
  if (element.parent !== this) return;

  var i = this.children.indexOf(element);
  if (!~i) return;

  element.clearPos();

  element.parent = null;

  this.children.splice(i, 1);

  i = this.screen.clickable.indexOf(element);
  if (~i) this.screen.clickable.splice(i, 1);
  i = this.screen.keyable.indexOf(element);
  if (~i) this.screen.keyable.splice(i, 1);

  element.emit('reparent', null);
  this.emit('remove', element);

  (function emit(el) {
    var n = el.detached !== true;
    el.detached = true;
    if (n) el.emit('detach');
    el.children.forEach(emit);
  })(element);

  if (this.screen.focused === element) {
    this.screen.rewindFocus();
  }
};

Node.prototype.detach = function () {
  if (this.parent) this.parent.remove(this);
};

Node.prototype.free = function () {
  return;
};

Node.prototype.destroy = function () {
  this.detach();
  this.forDescendants(function (el) {
    el.free();
    el.destroyed = true;
    el.emit('destroy');
  }, this);
};

Node.prototype.forDescendants = function (iter, s) {
  if (s) iter(this);
  this.children.forEach(function emit(el) {
    iter(el);
    el.children.forEach(emit);
  });
};

Node.prototype.forAncestors = function (iter, s) {
  var el = this;
  if (s) iter(this);
  while (el = el.parent) {
    iter(el);
  }
};

Node.prototype.collectDescendants = function (s) {
  var out = [];
  this.forDescendants(function (el) {
    out.push(el);
  }, s);
  return out;
};

Node.prototype.collectAncestors = function (s) {
  var out = [];
  this.forAncestors(function (el) {
    out.push(el);
  }, s);
  return out;
};

Node.prototype.emitDescendants = function () {
  var args = Array.prototype.slice(arguments),
      iter;

  if (typeof args[args.length - 1] === 'function') {
    iter = args.pop();
  }

  return this.forDescendants(function (el) {
    if (iter) iter(el);
    el.emit.apply(el, args);
  }, true);
};

Node.prototype.emitAncestors = function () {
  var args = Array.prototype.slice(arguments),
      iter;

  if (typeof args[args.length - 1] === 'function') {
    iter = args.pop();
  }

  return this.forAncestors(function (el) {
    if (iter) iter(el);
    el.emit.apply(el, args);
  }, true);
};

Node.prototype.hasDescendant = function (target) {
  return function find(el) {
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i] === target) {
        return true;
      }
      if (find(el.children[i]) === true) {
        return true;
      }
    }
    return false;
  }(this);
};

Node.prototype.hasAncestor = function (target) {
  var el = this;
  while (el = el.parent) {
    if (el === target) return true;
  }
  return false;
};

Node.prototype.get = function (name, value) {
  if (this.data.hasOwnProperty(name)) {
    return this.data[name];
  }
  return value;
};

Node.prototype.set = function (name, value) {
  return this.data[name] = value;
};

/**
 * Expose
 */

module.exports = Node;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * box.js - box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Element = __webpack_require__(4);

/**
 * Box
 */

function Box(options) {
  if (!(this instanceof Node)) {
    return new Box(options);
  }
  options = options || {};
  Element.call(this, options);
}

Box.prototype.__proto__ = Element.prototype;

Box.prototype.type = 'box';

/**
 * Expose
 */

module.exports = Box;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyFunction = __webpack_require__(29);

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  (function () {
    var printWarning = function printWarning(format) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    warning = function warning(condition, format) {
      if (format === undefined) {
        throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
      }

      if (format.indexOf('Failed Composite propType: ') === 0) {
        return; // Ignore CompositeComponent proptype check.
      }

      if (!condition) {
        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }

        printWarning.apply(undefined, [format].concat(args));
      }
    };
  })();
}

module.exports = warning;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * helpers.js - helpers for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var fs = __webpack_require__(10);

var unicode = __webpack_require__(12);

/**
 * Helpers
 */

var helpers = exports;

helpers.merge = function (a, b) {
  Object.keys(b).forEach(function (key) {
    a[key] = b[key];
  });
  return a;
};

helpers.asort = function (obj) {
  return obj.sort(function (a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if (a[0] === '.' && b[0] === '.') {
      a = a[1];
      b = b[1];
    } else {
      a = a[0];
      b = b[0];
    }

    return a > b ? 1 : a < b ? -1 : 0;
  });
};

helpers.hsort = function (obj) {
  return obj.sort(function (a, b) {
    return b.index - a.index;
  });
};

helpers.findFile = function (start, target) {
  return function read(dir) {
    var files, file, stat, out;

    if (dir === '/dev' || dir === '/sys' || dir === '/proc' || dir === '/net') {
      return null;
    }

    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      files = [];
    }

    for (var i = 0; i < files.length; i++) {
      file = files[i];

      if (file === target) {
        return (dir === '/' ? '' : dir) + '/' + file;
      }

      try {
        stat = fs.lstatSync((dir === '/' ? '' : dir) + '/' + file);
      } catch (e) {
        stat = null;
      }

      if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
        out = read((dir === '/' ? '' : dir) + '/' + file);
        if (out) return out;
      }
    }

    return null;
  }(start);
};

// Escape text for tag-enabled elements.
helpers.escape = function (text) {
  return text.replace(/[{}]/g, function (ch) {
    return ch === '{' ? '{open}' : '{close}';
  });
};

helpers.parseTags = function (text, screen) {
  return helpers.Element.prototype._parseTags.call({ parseTags: true, screen: screen || helpers.Screen.global }, text);
};

helpers.generateTags = function (style, text) {
  var open = '',
      close = '';

  Object.keys(style || {}).forEach(function (key) {
    var val = style[key];
    if (typeof val === 'string') {
      val = val.replace(/^light(?!-)/, 'light-');
      val = val.replace(/^bright(?!-)/, 'bright-');
      open = '{' + val + '-' + key + '}' + open;
      close += '{/' + val + '-' + key + '}';
    } else {
      if (val === true) {
        open = '{' + key + '}' + open;
        close += '{/' + key + '}';
      }
    }
  });

  if (text != null) {
    return open + text + close;
  }

  return {
    open: open,
    close: close
  };
};

helpers.attrToBinary = function (style, element) {
  return helpers.Element.prototype.sattr.call(element || {}, style);
};

helpers.stripTags = function (text) {
  if (!text) return '';
  return text.replace(/{(\/?)([\w\-,;!#]*)}/g, '').replace(/\x1b\[[\d;]*m/g, '');
};

helpers.cleanTags = function (text) {
  return helpers.stripTags(text).trim();
};

helpers.dropUnicode = function (text) {
  if (!text) return '';
  return text.replace(unicode.chars.all, '??').replace(unicode.chars.combining, '').replace(unicode.chars.surrogate, '?');
};

helpers.__defineGetter__('Screen', function () {
  if (!helpers._screen) {
    helpers._screen = __webpack_require__(15);
  }
  return helpers._screen;
});

helpers.__defineGetter__('Element', function () {
  if (!helpers._element) {
    helpers._element = __webpack_require__(4);
  }
  return helpers._element;
});

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * element.js - base element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var assert = __webpack_require__(59);

var colors = __webpack_require__(11),
    unicode = __webpack_require__(12);

var nextTick = global.setImmediate || process.nextTick.bind(process);

var helpers = __webpack_require__(3);

var Node = __webpack_require__(0);

/**
 * Element
 */

function Element(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Element(options);
  }

  options = options || {};

  // Workaround to get a `scrollable` option.
  if (options.scrollable && !this._ignore && this.type !== 'scrollable-box') {
    var ScrollableBox = __webpack_require__(16);
    Object.getOwnPropertyNames(ScrollableBox.prototype).forEach(function (key) {
      if (key === 'type') return;
      Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(ScrollableBox.prototype, key));
    }, this);
    this._ignore = true;
    ScrollableBox.call(this, options);
    delete this._ignore;
    return this;
  }

  Node.call(this, options);

  this.name = options.name;

  options.position = options.position || {
    left: options.left,
    right: options.right,
    top: options.top,
    bottom: options.bottom,
    width: options.width,
    height: options.height
  };

  if (options.position.width === 'shrink' || options.position.height === 'shrink') {
    if (options.position.width === 'shrink') {
      delete options.position.width;
    }
    if (options.position.height === 'shrink') {
      delete options.position.height;
    }
    options.shrink = true;
  }

  this.position = options.position;

  this.noOverflow = options.noOverflow;
  this.dockBorders = options.dockBorders;
  this.shadow = options.shadow;

  this.style = options.style;

  if (!this.style) {
    this.style = {};
    this.style.fg = options.fg;
    this.style.bg = options.bg;
    this.style.bold = options.bold;
    this.style.underline = options.underline;
    this.style.blink = options.blink;
    this.style.inverse = options.inverse;
    this.style.invisible = options.invisible;
    this.style.transparent = options.transparent;
  }

  this.hidden = options.hidden || false;
  this.fixed = options.fixed || false;
  this.align = options.align || 'left';
  this.valign = options.valign || 'top';
  this.wrap = options.wrap !== false;
  this.shrink = options.shrink;
  this.fixed = options.fixed;
  this.ch = options.ch || ' ';

  if (typeof options.padding === 'number' || !options.padding) {
    options.padding = {
      left: options.padding,
      top: options.padding,
      right: options.padding,
      bottom: options.padding
    };
  }

  this.padding = {
    left: options.padding.left || 0,
    top: options.padding.top || 0,
    right: options.padding.right || 0,
    bottom: options.padding.bottom || 0
  };

  this.border = options.border;
  if (this.border) {
    if (typeof this.border === 'string') {
      this.border = { type: this.border };
    }
    this.border.type = this.border.type || 'bg';
    if (this.border.type === 'ascii') this.border.type = 'line';
    this.border.ch = this.border.ch || ' ';
    this.style.border = this.style.border || this.border.style;
    if (!this.style.border) {
      this.style.border = {};
      this.style.border.fg = this.border.fg;
      this.style.border.bg = this.border.bg;
    }
    //this.border.style = this.style.border;
    if (this.border.left == null) this.border.left = true;
    if (this.border.top == null) this.border.top = true;
    if (this.border.right == null) this.border.right = true;
    if (this.border.bottom == null) this.border.bottom = true;
  }

  // if (options.mouse || options.clickable) {
  if (options.clickable) {
    this.screen._listenMouse(this);
  }

  if (options.input || options.keyable) {
    this.screen._listenKeys(this);
  }

  this.parseTags = options.parseTags || options.tags;

  this.setContent(options.content || '', true);

  if (options.label) {
    this.setLabel(options.label);
  }

  if (options.hoverText) {
    this.setHover(options.hoverText);
  }

  // TODO: Possibly move this to Node for onScreenEvent('mouse', ...).
  this.on('newListener', function fn(type) {
    // type = type.split(' ').slice(1).join(' ');
    if (type === 'mouse' || type === 'click' || type === 'mouseover' || type === 'mouseout' || type === 'mousedown' || type === 'mouseup' || type === 'mousewheel' || type === 'wheeldown' || type === 'wheelup' || type === 'mousemove') {
      self.screen._listenMouse(self);
    } else if (type === 'keypress' || type.indexOf('key ') === 0) {
      self.screen._listenKeys(self);
    }
  });

  this.on('resize', function () {
    self.parseContent();
  });

  this.on('attach', function () {
    self.parseContent();
  });

  this.on('detach', function () {
    delete self.lpos;
  });

  if (options.hoverBg != null) {
    options.hoverEffects = options.hoverEffects || {};
    options.hoverEffects.bg = options.hoverBg;
  }

  if (this.style.hover) {
    options.hoverEffects = this.style.hover;
  }

  if (this.style.focus) {
    options.focusEffects = this.style.focus;
  }

  if (options.effects) {
    if (options.effects.hover) options.hoverEffects = options.effects.hover;
    if (options.effects.focus) options.focusEffects = options.effects.focus;
  }

  [['hoverEffects', 'mouseover', 'mouseout', '_htemp'], ['focusEffects', 'focus', 'blur', '_ftemp']].forEach(function (props) {
    var pname = props[0],
        over = props[1],
        out = props[2],
        temp = props[3];
    self.screen.setEffects(self, self, over, out, self.options[pname], temp);
  });

  if (this.options.draggable) {
    this.draggable = true;
  }

  if (options.focused) {
    this.focus();
  }
}

Element.prototype.__proto__ = Node.prototype;

Element.prototype.type = 'element';

Element.prototype.__defineGetter__('focused', function () {
  return this.screen.focused === this;
});

Element.prototype.sattr = function (style, fg, bg) {
  var bold = style.bold,
      underline = style.underline,
      blink = style.blink,
      inverse = style.inverse,
      invisible = style.invisible;

  // if (arguments.length === 1) {
  if (fg == null && bg == null) {
    fg = style.fg;
    bg = style.bg;
  }

  // This used to be a loop, but I decided
  // to unroll it for performance's sake.
  if (typeof bold === 'function') bold = bold(this);
  if (typeof underline === 'function') underline = underline(this);
  if (typeof blink === 'function') blink = blink(this);
  if (typeof inverse === 'function') inverse = inverse(this);
  if (typeof invisible === 'function') invisible = invisible(this);

  if (typeof fg === 'function') fg = fg(this);
  if (typeof bg === 'function') bg = bg(this);

  // return (this.uid << 24)
  //   | ((this.dockBorders ? 32 : 0) << 18)
  return (invisible ? 16 : 0) << 18 | (inverse ? 8 : 0) << 18 | (blink ? 4 : 0) << 18 | (underline ? 2 : 0) << 18 | (bold ? 1 : 0) << 18 | colors.convert(fg) << 9 | colors.convert(bg);
};

Element.prototype.onScreenEvent = function (type, handler) {
  var listeners = this._slisteners = this._slisteners || [];
  listeners.push({ type: type, handler: handler });
  this.screen.on(type, handler);
};

Element.prototype.onceScreenEvent = function (type, handler) {
  var listeners = this._slisteners = this._slisteners || [];
  var entry = { type: type, handler: handler };
  listeners.push(entry);
  this.screen.once(type, function () {
    var i = listeners.indexOf(entry);
    if (~i) listeners.splice(i, 1);
    return handler.apply(this, arguments);
  });
};

Element.prototype.removeScreenEvent = function (type, handler) {
  var listeners = this._slisteners = this._slisteners || [];
  for (var i = 0; i < listeners.length; i++) {
    var listener = listeners[i];
    if (listener.type === type && listener.handler === handler) {
      listeners.splice(i, 1);
      if (this._slisteners.length === 0) {
        delete this._slisteners;
      }
      break;
    }
  }
  this.screen.removeListener(type, handler);
};

Element.prototype.free = function () {
  var listeners = this._slisteners = this._slisteners || [];
  for (var i = 0; i < listeners.length; i++) {
    var listener = listeners[i];
    this.screen.removeListener(listener.type, listener.handler);
  }
  delete this._slisteners;
};

Element.prototype.hide = function () {
  if (this.hidden) return;
  this.clearPos();
  this.hidden = true;
  this.emit('hide');
  if (this.screen.focused === this) {
    this.screen.rewindFocus();
  }
};

Element.prototype.show = function () {
  if (!this.hidden) return;
  this.hidden = false;
  this.emit('show');
};

Element.prototype.toggle = function () {
  return this.hidden ? this.show() : this.hide();
};

Element.prototype.focus = function () {
  return this.screen.focused = this;
};

Element.prototype.setContent = function (content, noClear, noTags) {
  if (!noClear) this.clearPos();
  this.content = content || '';
  this.parseContent(noTags);
  this.emit('set content');
};

Element.prototype.getContent = function () {
  if (!this._clines) return '';
  return this._clines.fake.join('\n');
};

Element.prototype.setText = function (content, noClear) {
  content = content || '';
  content = content.replace(/\x1b\[[\d;]*m/g, '');
  return this.setContent(content, noClear, true);
};

Element.prototype.getText = function () {
  return this.getContent().replace(/\x1b\[[\d;]*m/g, '');
};

Element.prototype.parseContent = function (noTags) {
  if (this.detached) return false;

  var width = this.width - this.iwidth;
  if (this._clines == null || this._clines.width !== width || this._clines.content !== this.content) {
    var content = this.content;

    content = content.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1a\x1c-\x1f\x7f]/g, '').replace(/\x1b(?!\[[\d;]*m)/g, '').replace(/\r\n|\r/g, '\n').replace(/\t/g, this.screen.tabc);

    if (this.screen.fullUnicode) {
      // double-width chars will eat the next char after render. create a
      // blank character after it so it doesn't eat the real next char.
      content = content.replace(unicode.chars.all, '$1\x03');
      // iTerm2 cannot render combining characters properly.
      if (this.screen.program.isiTerm2) {
        content = content.replace(unicode.chars.combining, '');
      }
    } else {
      // no double-width: replace them with question-marks.
      content = content.replace(unicode.chars.all, '??');
      // delete combining characters since they're 0-width anyway.
      // NOTE: We could drop this, the non-surrogates would get changed to ? by
      // the unicode filter, and surrogates changed to ? by the surrogate
      // regex. however, the user might expect them to be 0-width.
      // NOTE: Might be better for performance to drop!
      content = content.replace(unicode.chars.combining, '');
      // no surrogate pairs: replace them with question-marks.
      content = content.replace(unicode.chars.surrogate, '?');
      // XXX Deduplicate code here:
      // content = helpers.dropUnicode(content);
    }

    if (!noTags) {
      content = this._parseTags(content);
    }

    this._clines = this._wrapContent(content, width);
    this._clines.width = width;
    this._clines.content = this.content;
    this._clines.attr = this._parseAttr(this._clines);
    this._clines.ci = [];
    this._clines.reduce(function (total, line) {
      this._clines.ci.push(total);
      return total + line.length + 1;
    }.bind(this), 0);

    this._pcontent = this._clines.join('\n');
    this.emit('parsed content');

    return true;
  }

  // Need to calculate this every time because the default fg/bg may change.
  this._clines.attr = this._parseAttr(this._clines) || this._clines.attr;

  return false;
};

// Convert `{red-fg}foo{/red-fg}` to `\x1b[31mfoo\x1b[39m`.
Element.prototype._parseTags = function (text) {
  if (!this.parseTags) return text;
  if (!/{\/?[\w\-,;!#]*}/.test(text)) return text;

  var program = this.screen.program,
      out = '',
      state,
      bg = [],
      fg = [],
      flag = [],
      cap,
      slash,
      param,
      attr,
      esc;

  for (;;) {
    if (!esc && (cap = /^{escape}/.exec(text))) {
      text = text.substring(cap[0].length);
      esc = true;
      continue;
    }

    if (esc && (cap = /^([\s\S]+?){\/escape}/.exec(text))) {
      text = text.substring(cap[0].length);
      out += cap[1];
      esc = false;
      continue;
    }

    if (esc) {
      // throw new Error('Unterminated escape tag.');
      out += text;
      break;
    }

    if (cap = /^{(\/?)([\w\-,;!#]*)}/.exec(text)) {
      text = text.substring(cap[0].length);
      slash = cap[1] === '/';
      param = cap[2].replace(/-/g, ' ');

      if (param === 'open') {
        out += '{';
        continue;
      } else if (param === 'close') {
        out += '}';
        continue;
      }

      if (param.slice(-3) === ' bg') state = bg;else if (param.slice(-3) === ' fg') state = fg;else state = flag;

      if (slash) {
        if (!param) {
          out += program._attr('normal');
          bg.length = 0;
          fg.length = 0;
          flag.length = 0;
        } else {
          attr = program._attr(param, false);
          if (attr == null) {
            out += cap[0];
          } else {
            // if (param !== state[state.length - 1]) {
            //   throw new Error('Misnested tags.');
            // }
            state.pop();
            if (state.length) {
              out += program._attr(state[state.length - 1]);
            } else {
              out += attr;
            }
          }
        }
      } else {
        if (!param) {
          out += cap[0];
        } else {
          attr = program._attr(param);
          if (attr == null) {
            out += cap[0];
          } else {
            state.push(param);
            out += attr;
          }
        }
      }

      continue;
    }

    if (cap = /^[\s\S]+?(?={\/?[\w\-,;!#]*})/.exec(text)) {
      text = text.substring(cap[0].length);
      out += cap[0];
      continue;
    }

    out += text;
    break;
  }

  return out;
};

Element.prototype._parseAttr = function (lines) {
  var dattr = this.sattr(this.style),
      attr = dattr,
      attrs = [],
      line,
      i,
      j,
      c;

  if (lines[0].attr === attr) {
    return;
  }

  for (j = 0; j < lines.length; j++) {
    line = lines[j];
    attrs[j] = attr;
    for (i = 0; i < line.length; i++) {
      if (line[i] === '\x1b') {
        if (c = /^\x1b\[[\d;]*m/.exec(line.substring(i))) {
          attr = this.screen.attrCode(c[0], attr, dattr);
          i += c[0].length - 1;
        }
      }
    }
  }

  return attrs;
};

Element.prototype._align = function (line, width, align) {
  if (!align) return line;
  //if (!align && !~line.indexOf('{|}')) return line;

  var cline = line.replace(/\x1b\[[\d;]*m/g, ''),
      len = cline.length,
      s = width - len;

  if (this.shrink) {
    s = 0;
  }

  if (len === 0) return line;
  if (s < 0) return line;

  if (align === 'center') {
    s = Array((s / 2 | 0) + 1).join(' ');
    return s + line + s;
  } else if (align === 'right') {
    s = Array(s + 1).join(' ');
    return s + line;
  } else if (this.parseTags && ~line.indexOf('{|}')) {
    var parts = line.split('{|}');
    var cparts = cline.split('{|}');
    s = Math.max(width - cparts[0].length - cparts[1].length, 0);
    s = Array(s + 1).join(' ');
    return parts[0] + s + parts[1];
  }

  return line;
};

Element.prototype._wrapContent = function (content, width) {
  var tags = this.parseTags,
      state = this.align,
      wrap = this.wrap,
      margin = 0,
      rtof = [],
      ftor = [],
      out = [],
      no = 0,
      line,
      align,
      cap,
      total,
      i,
      part,
      j,
      lines,
      rest;

  lines = content.split('\n');

  if (!content) {
    out.push(content);
    out.rtof = [0];
    out.ftor = [[0]];
    out.fake = lines;
    out.real = out;
    out.mwidth = 0;
    return out;
  }

  if (this.scrollbar) margin++;
  if (this.type === 'textarea') margin++;
  if (width > margin) width -= margin;

  main: for (; no < lines.length; no++) {
    line = lines[no];
    align = state;

    ftor.push([]);

    // Handle alignment tags.
    if (tags) {
      if (cap = /^{(left|center|right)}/.exec(line)) {
        line = line.substring(cap[0].length);
        align = state = cap[1] !== 'left' ? cap[1] : null;
      }
      if (cap = /{\/(left|center|right)}$/.exec(line)) {
        line = line.slice(0, -cap[0].length);
        //state = null;
        state = this.align;
      }
    }

    // If the string is apparently too long, wrap it.
    while (line.length > width) {
      // Measure the real width of the string.
      for (i = 0, total = 0; i < line.length; i++) {
        while (line[i] === '\x1b') {
          while (line[i] && line[i++] !== 'm') {}
        }
        if (!line[i]) break;
        if (++total === width) {
          // If we're not wrapping the text, we have to finish up the rest of
          // the control sequences before cutting off the line.
          i++;
          if (!wrap) {
            rest = line.substring(i).match(/\x1b\[[^m]*m/g);
            rest = rest ? rest.join('') : '';
            out.push(this._align(line.substring(0, i) + rest, width, align));
            ftor[no].push(out.length - 1);
            rtof.push(no);
            continue main;
          }
          if (!this.screen.fullUnicode) {
            // Try to find a space to break on.
            if (i !== line.length) {
              j = i;
              while (j > i - 10 && j > 0 && line[--j] !== ' ') {}
              if (line[j] === ' ') i = j + 1;
            }
          } else {
            // Try to find a character to break on.
            if (i !== line.length) {
              // <XXX>
              // Compensate for surrogate length
              // counts on wrapping (experimental):
              // NOTE: Could optimize this by putting
              // it in the parent for loop.
              if (unicode.isSurrogate(line, i)) i--;
              for (var s = 0, n = 0; n < i; n++) {
                if (unicode.isSurrogate(line, n)) s++, n++;
              }
              i += s;
              // </XXX>
              j = i;
              // Break _past_ space.
              // Break _past_ double-width chars.
              // Break _past_ surrogate pairs.
              // Break _past_ combining chars.
              while (j > i - 10 && j > 0) {
                j--;
                if (line[j] === ' ' || line[j] === '\x03' || unicode.isSurrogate(line, j - 1) && line[j + 1] !== '\x03' || unicode.isCombining(line, j)) {
                  break;
                }
              }
              if (line[j] === ' ' || line[j] === '\x03' || unicode.isSurrogate(line, j - 1) && line[j + 1] !== '\x03' || unicode.isCombining(line, j)) {
                i = j + 1;
              }
            }
          }
          break;
        }
      }

      part = line.substring(0, i);
      line = line.substring(i);

      out.push(this._align(part, width, align));
      ftor[no].push(out.length - 1);
      rtof.push(no);

      // Make sure we didn't wrap the line to the very end, otherwise
      // we get a pointless empty line after a newline.
      if (line === '') continue main;

      // If only an escape code got cut off, at it to `part`.
      if (/^(?:\x1b[\[\d;]*m)+$/.test(line)) {
        out[out.length - 1] += line;
        continue main;
      }
    }

    out.push(this._align(line, width, align));
    ftor[no].push(out.length - 1);
    rtof.push(no);
  }

  out.rtof = rtof;
  out.ftor = ftor;
  out.fake = lines;
  out.real = out;

  out.mwidth = out.reduce(function (current, line) {
    line = line.replace(/\x1b\[[\d;]*m/g, '');
    return line.length > current ? line.length : current;
  }, 0);

  return out;
};

Element.prototype.__defineGetter__('visible', function () {
  var el = this;
  do {
    if (el.detached) return false;
    if (el.hidden) return false;
    // if (!el.lpos) return false;
    // if (el.position.width === 0 || el.position.height === 0) return false;
  } while (el = el.parent);
  return true;
});

Element.prototype.__defineGetter__('_detached', function () {
  var el = this;
  do {
    if (el.type === 'screen') return false;
    if (!el.parent) return true;
  } while (el = el.parent);
  return false;
});

Element.prototype.enableMouse = function () {
  this.screen._listenMouse(this);
};

Element.prototype.enableKeys = function () {
  this.screen._listenKeys(this);
};

Element.prototype.enableInput = function () {
  this.screen._listenMouse(this);
  this.screen._listenKeys(this);
};

Element.prototype.__defineGetter__('draggable', function () {
  return this._draggable === true;
});

Element.prototype.__defineSetter__('draggable', function (draggable) {
  return draggable ? this.enableDrag(draggable) : this.disableDrag();
});

Element.prototype.enableDrag = function (verify) {
  var self = this;

  if (this._draggable) return true;

  if (typeof verify !== 'function') {
    verify = function verify() {
      return true;
    };
  }

  this.enableMouse();

  this.on('mousedown', this._dragMD = function (data) {
    if (self.screen._dragging) return;
    if (!verify(data)) return;
    self.screen._dragging = self;
    self._drag = {
      x: data.x - self.aleft,
      y: data.y - self.atop
    };
    self.setFront();
  });

  this.onScreenEvent('mouse', this._dragM = function (data) {
    if (self.screen._dragging !== self) return;

    if (data.action !== 'mousedown' && data.action !== 'mousemove') {
      delete self.screen._dragging;
      delete self._drag;
      return;
    }

    // This can happen in edge cases where the user is
    // already dragging and element when it is detached.
    if (!self.parent) return;

    var ox = self._drag.x,
        oy = self._drag.y,
        px = self.parent.aleft,
        py = self.parent.atop,
        x = data.x - px - ox,
        y = data.y - py - oy;

    if (self.position.right != null) {
      if (self.position.left != null) {
        self.width = '100%-' + (self.parent.width - self.width);
      }
      self.position.right = null;
    }

    if (self.position.bottom != null) {
      if (self.position.top != null) {
        self.height = '100%-' + (self.parent.height - self.height);
      }
      self.position.bottom = null;
    }

    self.rleft = x;
    self.rtop = y;

    self.screen.render();
  });

  return this._draggable = true;
};

Element.prototype.disableDrag = function () {
  if (!this._draggable) return false;
  delete this.screen._dragging;
  delete this._drag;
  this.removeListener('mousedown', this._dragMD);
  this.removeScreenEvent('mouse', this._dragM);
  return this._draggable = false;
};

Element.prototype.key = function () {
  return this.screen.program.key.apply(this, arguments);
};

Element.prototype.onceKey = function () {
  return this.screen.program.onceKey.apply(this, arguments);
};

Element.prototype.unkey = Element.prototype.removeKey = function () {
  return this.screen.program.unkey.apply(this, arguments);
};

Element.prototype.setIndex = function (index) {
  if (!this.parent) return;

  if (index < 0) {
    index = this.parent.children.length + index;
  }

  index = Math.max(index, 0);
  index = Math.min(index, this.parent.children.length - 1);

  var i = this.parent.children.indexOf(this);
  if (!~i) return;

  var item = this.parent.children.splice(i, 1)[0];
  this.parent.children.splice(index, 0, item);
};

Element.prototype.setFront = function () {
  return this.setIndex(-1);
};

Element.prototype.setBack = function () {
  return this.setIndex(0);
};

Element.prototype.clearPos = function (get, override) {
  if (this.detached) return;
  var lpos = this._getCoords(get);
  if (!lpos) return;
  this.screen.clearRegion(lpos.xi, lpos.xl, lpos.yi, lpos.yl, override);
};

Element.prototype.setLabel = function (options) {
  var self = this;
  var Box = __webpack_require__(1);

  if (typeof options === 'string') {
    options = { text: options };
  }

  if (this._label) {
    this._label.setContent(options.text);
    if (options.side !== 'right') {
      this._label.rleft = 2 + (this.border ? -1 : 0);
      this._label.position.right = undefined;
      if (!this.screen.autoPadding) {
        this._label.rleft = 2;
      }
    } else {
      this._label.rright = 2 + (this.border ? -1 : 0);
      this._label.position.left = undefined;
      if (!this.screen.autoPadding) {
        this._label.rright = 2;
      }
    }
    return;
  }

  this._label = new Box({
    screen: this.screen,
    parent: this,
    content: options.text,
    top: -this.itop,
    tags: this.parseTags,
    shrink: true,
    style: this.style.label
  });

  if (options.side !== 'right') {
    this._label.rleft = 2 - this.ileft;
  } else {
    this._label.rright = 2 - this.iright;
  }

  this._label._isLabel = true;

  if (!this.screen.autoPadding) {
    if (options.side !== 'right') {
      this._label.rleft = 2;
    } else {
      this._label.rright = 2;
    }
    this._label.rtop = 0;
  }

  var reposition = function reposition() {
    self._label.rtop = (self.childBase || 0) - self.itop;
    if (!self.screen.autoPadding) {
      self._label.rtop = self.childBase || 0;
    }
    self.screen.render();
  };

  this.on('scroll', this._labelScroll = function () {
    reposition();
  });

  this.on('resize', this._labelResize = function () {
    nextTick(function () {
      reposition();
    });
  });
};

Element.prototype.removeLabel = function () {
  if (!this._label) return;
  this.removeListener('scroll', this._labelScroll);
  this.removeListener('resize', this._labelResize);
  this._label.detach();
  delete this._labelScroll;
  delete this._labelResize;
  delete this._label;
};

Element.prototype.setHover = function (options) {
  if (typeof options === 'string') {
    options = { text: options };
  }

  this._hoverOptions = options;
  this.enableMouse();
  this.screen._initHover();
};

Element.prototype.removeHover = function () {
  delete this._hoverOptions;
  if (!this.screen._hoverText || this.screen._hoverText.detached) return;
  this.screen._hoverText.detach();
  this.screen.render();
};

/**
 * Positioning
 */

// The below methods are a bit confusing: basically
// whenever Box.render is called `lpos` gets set on
// the element, an object containing the rendered
// coordinates. Since these don't update if the
// element is moved somehow, they're unreliable in
// that situation. However, if we can guarantee that
// lpos is good and up to date, it can be more
// accurate than the calculated positions below.
// In this case, if the element is being rendered,
// it's guaranteed that the parent will have been
// rendered first, in which case we can use the
// parant's lpos instead of recalculating it's
// position (since that might be wrong because
// it doesn't handle content shrinkage).

Element.prototype._getPos = function () {
  var pos = this.lpos;

  assert.ok(pos);

  if (pos.aleft != null) return pos;

  pos.aleft = pos.xi;
  pos.atop = pos.yi;
  pos.aright = this.screen.cols - pos.xl;
  pos.abottom = this.screen.rows - pos.yl;
  pos.width = pos.xl - pos.xi;
  pos.height = pos.yl - pos.yi;

  return pos;
};

/**
 * Position Getters
 */

Element.prototype._getWidth = function (get) {
  var parent = get ? this.parent._getPos() : this.parent,
      width = this.position.width,
      left,
      expr;

  if (typeof width === 'string') {
    if (width === 'half') width = '50%';
    expr = width.split(/(?=\+|-)/);
    width = expr[0];
    width = +width.slice(0, -1) / 100;
    width = parent.width * width | 0;
    width += +(expr[1] || 0);
    return width;
  }

  // This is for if the element is being streched or shrunken.
  // Although the width for shrunken elements is calculated
  // in the render function, it may be calculated based on
  // the content width, and the content width is initially
  // decided by the width the element, so it needs to be
  // calculated here.
  if (width == null) {
    left = this.position.left || 0;
    if (typeof left === 'string') {
      if (left === 'center') left = '50%';
      expr = left.split(/(?=\+|-)/);
      left = expr[0];
      left = +left.slice(0, -1) / 100;
      left = parent.width * left | 0;
      left += +(expr[1] || 0);
    }
    width = parent.width - (this.position.right || 0) - left;
    if (this.screen.autoPadding) {
      if ((this.position.left != null || this.position.right == null) && this.position.left !== 'center') {
        width -= this.parent.ileft;
      }
      width -= this.parent.iright;
    }
  }

  return width;
};

Element.prototype.__defineGetter__('width', function () {
  return this._getWidth(false);
});

Element.prototype._getHeight = function (get) {
  var parent = get ? this.parent._getPos() : this.parent,
      height = this.position.height,
      top,
      expr;

  if (typeof height === 'string') {
    if (height === 'half') height = '50%';
    expr = height.split(/(?=\+|-)/);
    height = expr[0];
    height = +height.slice(0, -1) / 100;
    height = parent.height * height | 0;
    height += +(expr[1] || 0);
    return height;
  }

  // This is for if the element is being streched or shrunken.
  // Although the width for shrunken elements is calculated
  // in the render function, it may be calculated based on
  // the content width, and the content width is initially
  // decided by the width the element, so it needs to be
  // calculated here.
  if (height == null) {
    top = this.position.top || 0;
    if (typeof top === 'string') {
      if (top === 'center') top = '50%';
      expr = top.split(/(?=\+|-)/);
      top = expr[0];
      top = +top.slice(0, -1) / 100;
      top = parent.height * top | 0;
      top += +(expr[1] || 0);
    }
    height = parent.height - (this.position.bottom || 0) - top;
    if (this.screen.autoPadding) {
      if ((this.position.top != null || this.position.bottom == null) && this.position.top !== 'center') {
        height -= this.parent.itop;
      }
      height -= this.parent.ibottom;
    }
  }

  return height;
};

Element.prototype.__defineGetter__('height', function () {
  return this._getHeight(false);
});

Element.prototype._getLeft = function (get) {
  var parent = get ? this.parent._getPos() : this.parent,
      left = this.position.left || 0,
      expr;

  if (typeof left === 'string') {
    if (left === 'center') left = '50%';
    expr = left.split(/(?=\+|-)/);
    left = expr[0];
    left = +left.slice(0, -1) / 100;
    left = parent.width * left | 0;
    left += +(expr[1] || 0);
    if (this.position.left === 'center') {
      left -= this._getWidth(get) / 2 | 0;
    }
  }

  if (this.position.left == null && this.position.right != null) {
    return this.screen.cols - this._getWidth(get) - this._getRight(get);
  }

  if (this.screen.autoPadding) {
    if ((this.position.left != null || this.position.right == null) && this.position.left !== 'center') {
      left += this.parent.ileft;
    }
  }

  return (parent.aleft || 0) + left;
};

Element.prototype.__defineGetter__('aleft', function () {
  return this._getLeft(false);
});

Element.prototype._getRight = function (get) {
  var parent = get ? this.parent._getPos() : this.parent,
      right;

  if (this.position.right == null && this.position.left != null) {
    right = this.screen.cols - (this._getLeft(get) + this._getWidth(get));
    if (this.screen.autoPadding) {
      right += this.parent.iright;
    }
    return right;
  }

  right = (parent.aright || 0) + (this.position.right || 0);

  if (this.screen.autoPadding) {
    right += this.parent.iright;
  }

  return right;
};

Element.prototype.__defineGetter__('aright', function () {
  return this._getRight(false);
});

Element.prototype._getTop = function (get) {
  var parent = get ? this.parent._getPos() : this.parent,
      top = this.position.top || 0,
      expr;

  if (typeof top === 'string') {
    if (top === 'center') top = '50%';
    expr = top.split(/(?=\+|-)/);
    top = expr[0];
    top = +top.slice(0, -1) / 100;
    top = parent.height * top | 0;
    top += +(expr[1] || 0);
    if (this.position.top === 'center') {
      top -= this._getHeight(get) / 2 | 0;
    }
  }

  if (this.position.top == null && this.position.bottom != null) {
    return this.screen.rows - this._getHeight(get) - this._getBottom(get);
  }

  if (this.screen.autoPadding) {
    if ((this.position.top != null || this.position.bottom == null) && this.position.top !== 'center') {
      top += this.parent.itop;
    }
  }

  return (parent.atop || 0) + top;
};

Element.prototype.__defineGetter__('atop', function () {
  return this._getTop(false);
});

Element.prototype._getBottom = function (get) {
  var parent = get ? this.parent._getPos() : this.parent,
      bottom;

  if (this.position.bottom == null && this.position.top != null) {
    bottom = this.screen.rows - (this._getTop(get) + this._getHeight(get));
    if (this.screen.autoPadding) {
      bottom += this.parent.ibottom;
    }
    return bottom;
  }

  bottom = (parent.abottom || 0) + (this.position.bottom || 0);

  if (this.screen.autoPadding) {
    bottom += this.parent.ibottom;
  }

  return bottom;
};

Element.prototype.__defineGetter__('abottom', function () {
  return this._getBottom(false);
});

Element.prototype.__defineGetter__('rleft', function () {
  return this.aleft - this.parent.aleft;
});

Element.prototype.__defineGetter__('rright', function () {
  return this.aright - this.parent.aright;
});

Element.prototype.__defineGetter__('rtop', function () {
  return this.atop - this.parent.atop;
});

Element.prototype.__defineGetter__('rbottom', function () {
  return this.abottom - this.parent.abottom;
});

/**
 * Position Setters
 */

// NOTE:
// For aright, abottom, right, and bottom:
// If position.bottom is null, we could simply set top instead.
// But it wouldn't replicate bottom behavior appropriately if
// the parent was resized, etc.
Element.prototype.__defineSetter__('width', function (val) {
  if (this.position.width === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('resize');
  this.clearPos();
  return this.position.width = val;
});

Element.prototype.__defineSetter__('height', function (val) {
  if (this.position.height === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('resize');
  this.clearPos();
  return this.position.height = val;
});

Element.prototype.__defineSetter__('aleft', function (val) {
  var expr;
  if (typeof val === 'string') {
    if (val === 'center') {
      val = this.screen.width / 2 | 0;
      val -= this.width / 2 | 0;
    } else {
      expr = val.split(/(?=\+|-)/);
      val = expr[0];
      val = +val.slice(0, -1) / 100;
      val = this.screen.width * val | 0;
      val += +(expr[1] || 0);
    }
  }
  val -= this.parent.aleft;
  if (this.position.left === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.left = val;
});

Element.prototype.__defineSetter__('aright', function (val) {
  val -= this.parent.aright;
  if (this.position.right === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.right = val;
});

Element.prototype.__defineSetter__('atop', function (val) {
  var expr;
  if (typeof val === 'string') {
    if (val === 'center') {
      val = this.screen.height / 2 | 0;
      val -= this.height / 2 | 0;
    } else {
      expr = val.split(/(?=\+|-)/);
      val = expr[0];
      val = +val.slice(0, -1) / 100;
      val = this.screen.height * val | 0;
      val += +(expr[1] || 0);
    }
  }
  val -= this.parent.atop;
  if (this.position.top === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.top = val;
});

Element.prototype.__defineSetter__('abottom', function (val) {
  val -= this.parent.abottom;
  if (this.position.bottom === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.bottom = val;
});

Element.prototype.__defineSetter__('rleft', function (val) {
  if (this.position.left === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('move');
  this.clearPos();
  return this.position.left = val;
});

Element.prototype.__defineSetter__('rright', function (val) {
  if (this.position.right === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.right = val;
});

Element.prototype.__defineSetter__('rtop', function (val) {
  if (this.position.top === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('move');
  this.clearPos();
  return this.position.top = val;
});

Element.prototype.__defineSetter__('rbottom', function (val) {
  if (this.position.bottom === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.bottom = val;
});

Element.prototype.__defineGetter__('ileft', function () {
  return (this.border ? 1 : 0) + this.padding.left;
  // return (this.border && this.border.left ? 1 : 0) + this.padding.left;
});

Element.prototype.__defineGetter__('itop', function () {
  return (this.border ? 1 : 0) + this.padding.top;
  // return (this.border && this.border.top ? 1 : 0) + this.padding.top;
});

Element.prototype.__defineGetter__('iright', function () {
  return (this.border ? 1 : 0) + this.padding.right;
  // return (this.border && this.border.right ? 1 : 0) + this.padding.right;
});

Element.prototype.__defineGetter__('ibottom', function () {
  return (this.border ? 1 : 0) + this.padding.bottom;
  // return (this.border && this.border.bottom ? 1 : 0) + this.padding.bottom;
});

Element.prototype.__defineGetter__('iwidth', function () {
  // return (this.border
  //   ? ((this.border.left ? 1 : 0) + (this.border.right ? 1 : 0)) : 0)
  //   + this.padding.left + this.padding.right;
  return (this.border ? 2 : 0) + this.padding.left + this.padding.right;
});

Element.prototype.__defineGetter__('iheight', function () {
  // return (this.border
  //   ? ((this.border.top ? 1 : 0) + (this.border.bottom ? 1 : 0)) : 0)
  //   + this.padding.top + this.padding.bottom;
  return (this.border ? 2 : 0) + this.padding.top + this.padding.bottom;
});

Element.prototype.__defineGetter__('tpadding', function () {
  return this.padding.left + this.padding.top + this.padding.right + this.padding.bottom;
});

/**
 * Relative coordinates as default properties
 */

Element.prototype.__defineGetter__('left', function () {
  return this.rleft;
});

Element.prototype.__defineGetter__('right', function () {
  return this.rright;
});

Element.prototype.__defineGetter__('top', function () {
  return this.rtop;
});

Element.prototype.__defineGetter__('bottom', function () {
  return this.rbottom;
});

Element.prototype.__defineSetter__('left', function (val) {
  return this.rleft = val;
});

Element.prototype.__defineSetter__('right', function (val) {
  return this.rright = val;
});

Element.prototype.__defineSetter__('top', function (val) {
  return this.rtop = val;
});

Element.prototype.__defineSetter__('bottom', function (val) {
  return this.rbottom = val;
});

/**
 * Rendering - here be dragons
 */

Element.prototype._getShrinkBox = function (xi, xl, yi, yl, get) {
  if (!this.children.length) {
    return { xi: xi, xl: xi + 1, yi: yi, yl: yi + 1 };
  }

  var i,
      el,
      ret,
      mxi = xi,
      mxl = xi + 1,
      myi = yi,
      myl = yi + 1;

  // This is a chicken and egg problem. We need to determine how the children
  // will render in order to determine how this element renders, but it in
  // order to figure out how the children will render, they need to know
  // exactly how their parent renders, so, we can give them what we have so
  // far.
  var _lpos;
  if (get) {
    _lpos = this.lpos;
    this.lpos = { xi: xi, xl: xl, yi: yi, yl: yl };
    //this.shrink = false;
  }

  for (i = 0; i < this.children.length; i++) {
    el = this.children[i];

    ret = el._getCoords(get);

    // Or just (seemed to work, but probably not good):
    // ret = el.lpos || this.lpos;

    if (!ret) continue;

    // Since the parent element is shrunk, and the child elements think it's
    // going to take up as much space as possible, an element anchored to the
    // right or bottom will inadvertantly make the parent's shrunken size as
    // large as possible. So, we can just use the height and/or width the of
    // element.
    // if (get) {
    if (el.position.left == null && el.position.right != null) {
      ret.xl = xi + (ret.xl - ret.xi);
      ret.xi = xi;
      if (this.screen.autoPadding) {
        // Maybe just do this no matter what.
        ret.xl += this.ileft;
        ret.xi += this.ileft;
      }
    }
    if (el.position.top == null && el.position.bottom != null) {
      ret.yl = yi + (ret.yl - ret.yi);
      ret.yi = yi;
      if (this.screen.autoPadding) {
        // Maybe just do this no matter what.
        ret.yl += this.itop;
        ret.yi += this.itop;
      }
    }

    if (ret.xi < mxi) mxi = ret.xi;
    if (ret.xl > mxl) mxl = ret.xl;
    if (ret.yi < myi) myi = ret.yi;
    if (ret.yl > myl) myl = ret.yl;
  }

  if (get) {
    this.lpos = _lpos;
    //this.shrink = true;
  }

  if (this.position.width == null && (this.position.left == null || this.position.right == null)) {
    if (this.position.left == null && this.position.right != null) {
      xi = xl - (mxl - mxi);
      if (!this.screen.autoPadding) {
        xi -= this.padding.left + this.padding.right;
      } else {
        xi -= this.ileft;
      }
    } else {
      xl = mxl;
      if (!this.screen.autoPadding) {
        xl += this.padding.left + this.padding.right;
        // XXX Temporary workaround until we decide to make autoPadding default.
        // See widget-listtable.js for an example of why this is necessary.
        // XXX Maybe just to this for all this being that this would affect
        // width shrunken normal shrunken lists as well.
        // if (this._isList) {
        if (this.type === 'list-table') {
          xl -= this.padding.left + this.padding.right;
          xl += this.iright;
        }
      } else {
        //xl += this.padding.right;
        xl += this.iright;
      }
    }
  }

  if (this.position.height == null && (this.position.top == null || this.position.bottom == null) && (!this.scrollable || this._isList)) {
    // NOTE: Lists get special treatment if they are shrunken - assume they
    // want all list items showing. This is one case we can calculate the
    // height based on items/boxes.
    if (this._isList) {
      myi = 0 - this.itop;
      myl = this.items.length + this.ibottom;
    }
    if (this.position.top == null && this.position.bottom != null) {
      yi = yl - (myl - myi);
      if (!this.screen.autoPadding) {
        yi -= this.padding.top + this.padding.bottom;
      } else {
        yi -= this.itop;
      }
    } else {
      yl = myl;
      if (!this.screen.autoPadding) {
        yl += this.padding.top + this.padding.bottom;
      } else {
        yl += this.ibottom;
      }
    }
  }

  return { xi: xi, xl: xl, yi: yi, yl: yl };
};

Element.prototype._getShrinkContent = function (xi, xl, yi, yl) {
  var h = this._clines.length,
      w = this._clines.mwidth || 1;

  if (this.position.width == null && (this.position.left == null || this.position.right == null)) {
    if (this.position.left == null && this.position.right != null) {
      xi = xl - w - this.iwidth;
    } else {
      xl = xi + w + this.iwidth;
    }
  }

  if (this.position.height == null && (this.position.top == null || this.position.bottom == null) && (!this.scrollable || this._isList)) {
    if (this.position.top == null && this.position.bottom != null) {
      yi = yl - h - this.iheight;
    } else {
      yl = yi + h + this.iheight;
    }
  }

  return { xi: xi, xl: xl, yi: yi, yl: yl };
};

Element.prototype._getShrink = function (xi, xl, yi, yl, get) {
  var shrinkBox = this._getShrinkBox(xi, xl, yi, yl, get),
      shrinkContent = this._getShrinkContent(xi, xl, yi, yl, get),
      xll = xl,
      yll = yl;

  // Figure out which one is bigger and use it.
  if (shrinkBox.xl - shrinkBox.xi > shrinkContent.xl - shrinkContent.xi) {
    xi = shrinkBox.xi;
    xl = shrinkBox.xl;
  } else {
    xi = shrinkContent.xi;
    xl = shrinkContent.xl;
  }

  if (shrinkBox.yl - shrinkBox.yi > shrinkContent.yl - shrinkContent.yi) {
    yi = shrinkBox.yi;
    yl = shrinkBox.yl;
  } else {
    yi = shrinkContent.yi;
    yl = shrinkContent.yl;
  }

  // Recenter shrunken elements.
  if (xl < xll && this.position.left === 'center') {
    xll = (xll - xl) / 2 | 0;
    xi += xll;
    xl += xll;
  }

  if (yl < yll && this.position.top === 'center') {
    yll = (yll - yl) / 2 | 0;
    yi += yll;
    yl += yll;
  }

  return { xi: xi, xl: xl, yi: yi, yl: yl };
};

Element.prototype._getCoords = function (get, noscroll) {
  if (this.hidden) return;

  // if (this.parent._rendering) {
  //   get = true;
  // }

  var xi = this._getLeft(get),
      xl = xi + this._getWidth(get),
      yi = this._getTop(get),
      yl = yi + this._getHeight(get),
      base = this.childBase || 0,
      el = this,
      fixed = this.fixed,
      coords,
      v,
      noleft,
      noright,
      notop,
      nobot,
      ppos,
      b;

  // Attempt to shrink the element base on the
  // size of the content and child elements.
  if (this.shrink) {
    coords = this._getShrink(xi, xl, yi, yl, get);
    xi = coords.xi, xl = coords.xl;
    yi = coords.yi, yl = coords.yl;
  }

  // Find a scrollable ancestor if we have one.
  while (el = el.parent) {
    if (el.scrollable) {
      if (fixed) {
        fixed = false;
        continue;
      }
      break;
    }
  }

  // Check to make sure we're visible and
  // inside of the visible scroll area.
  // NOTE: Lists have a property where only
  // the list items are obfuscated.

  // Old way of doing things, this would not render right if a shrunken element
  // with lots of boxes in it was within a scrollable element.
  // See: $ node test/widget-shrink-fail.js
  // var thisparent = this.parent;

  var thisparent = el;
  if (el && !noscroll) {
    ppos = thisparent.lpos;

    // The shrink option can cause a stack overflow
    // by calling _getCoords on the child again.
    // if (!get && !thisparent.shrink) {
    //   ppos = thisparent._getCoords();
    // }

    if (!ppos) return;

    // TODO: Figure out how to fix base (and cbase to only
    // take into account the *parent's* padding.

    yi -= ppos.base;
    yl -= ppos.base;

    b = thisparent.border ? 1 : 0;

    // XXX
    // Fixes non-`fixed` labels to work with scrolling (they're ON the border):
    // if (this.position.left < 0
    //     || this.position.right < 0
    //     || this.position.top < 0
    //     || this.position.bottom < 0) {
    if (this._isLabel) {
      b = 0;
    }

    if (yi < ppos.yi + b) {
      if (yl - 1 < ppos.yi + b) {
        // Is above.
        return;
      } else {
        // Is partially covered above.
        notop = true;
        v = ppos.yi - yi;
        if (this.border) v--;
        if (thisparent.border) v++;
        base += v;
        yi += v;
      }
    } else if (yl > ppos.yl - b) {
      if (yi > ppos.yl - 1 - b) {
        // Is below.
        return;
      } else {
        // Is partially covered below.
        nobot = true;
        v = yl - ppos.yl;
        if (this.border) v--;
        if (thisparent.border) v++;
        yl -= v;
      }
    }

    // Shouldn't be necessary.
    // assert.ok(yi < yl);
    if (yi >= yl) return;

    // Could allow overlapping stuff in scrolling elements
    // if we cleared the pending buffer before every draw.
    if (xi < el.lpos.xi) {
      xi = el.lpos.xi;
      noleft = true;
      if (this.border) xi--;
      if (thisparent.border) xi++;
    }
    if (xl > el.lpos.xl) {
      xl = el.lpos.xl;
      noright = true;
      if (this.border) xl++;
      if (thisparent.border) xl--;
    }
    //if (xi > xl) return;
    if (xi >= xl) return;
  }

  if (this.noOverflow && this.parent.lpos) {
    if (xi < this.parent.lpos.xi + this.parent.ileft) {
      xi = this.parent.lpos.xi + this.parent.ileft;
    }
    if (xl > this.parent.lpos.xl - this.parent.iright) {
      xl = this.parent.lpos.xl - this.parent.iright;
    }
    if (yi < this.parent.lpos.yi + this.parent.itop) {
      yi = this.parent.lpos.yi + this.parent.itop;
    }
    if (yl > this.parent.lpos.yl - this.parent.ibottom) {
      yl = this.parent.lpos.yl - this.parent.ibottom;
    }
  }

  // if (this.parent.lpos) {
  //   this.parent.lpos._scrollBottom = Math.max(
  //     this.parent.lpos._scrollBottom, yl);
  // }

  return {
    xi: xi,
    xl: xl,
    yi: yi,
    yl: yl,
    base: base,
    noleft: noleft,
    noright: noright,
    notop: notop,
    nobot: nobot,
    renders: this.screen.renders
  };
};

Element.prototype.render = function () {
  this._emit('prerender');

  this.parseContent();

  var coords = this._getCoords(true);
  if (!coords) {
    delete this.lpos;
    return;
  }

  if (coords.xl - coords.xi <= 0) {
    coords.xl = Math.max(coords.xl, coords.xi);
    return;
  }

  if (coords.yl - coords.yi <= 0) {
    coords.yl = Math.max(coords.yl, coords.yi);
    return;
  }

  var lines = this.screen.lines,
      xi = coords.xi,
      xl = coords.xl,
      yi = coords.yi,
      yl = coords.yl,
      x,
      y,
      cell,
      attr,
      ch,
      content = this._pcontent,
      ci = this._clines.ci[coords.base],
      battr,
      dattr,
      c,
      visible,
      i,
      bch = this.ch;

  // Clip content if it's off the edge of the screen
  // if (xi + this.ileft < 0 || yi + this.itop < 0) {
  //   var clines = this._clines.slice();
  //   if (xi + this.ileft < 0) {
  //     for (var i = 0; i < clines.length; i++) {
  //       var t = 0;
  //       var csi = '';
  //       var csis = '';
  //       for (var j = 0; j < clines[i].length; j++) {
  //         while (clines[i][j] === '\x1b') {
  //           csi = '\x1b';
  //           while (clines[i][j++] !== 'm') csi += clines[i][j];
  //           csis += csi;
  //         }
  //         if (++t === -(xi + this.ileft) + 1) break;
  //       }
  //       clines[i] = csis + clines[i].substring(j);
  //     }
  //   }
  //   if (yi + this.itop < 0) {
  //     clines = clines.slice(-(yi + this.itop));
  //   }
  //   content = clines.join('\n');
  // }

  if (coords.base >= this._clines.ci.length) {
    ci = this._pcontent.length;
  }

  this.lpos = coords;

  if (this.border && this.border.type === 'line') {
    this.screen._borderStops[coords.yi] = true;
    this.screen._borderStops[coords.yl - 1] = true;
    // if (!this.screen._borderStops[coords.yi]) {
    //   this.screen._borderStops[coords.yi] = { xi: coords.xi, xl: coords.xl };
    // } else {
    //   if (this.screen._borderStops[coords.yi].xi > coords.xi) {
    //     this.screen._borderStops[coords.yi].xi = coords.xi;
    //   }
    //   if (this.screen._borderStops[coords.yi].xl < coords.xl) {
    //     this.screen._borderStops[coords.yi].xl = coords.xl;
    //   }
    // }
    // this.screen._borderStops[coords.yl - 1] = this.screen._borderStops[coords.yi];
  }

  dattr = this.sattr(this.style);
  attr = dattr;

  // If we're in a scrollable text box, check to
  // see which attributes this line starts with.
  if (ci > 0) {
    attr = this._clines.attr[Math.min(coords.base, this._clines.length - 1)];
  }

  if (this.border) xi++, xl--, yi++, yl--;

  // If we have padding/valign, that means the
  // content-drawing loop will skip a few cells/lines.
  // To deal with this, we can just fill the whole thing
  // ahead of time. This could be optimized.
  if (this.tpadding || this.valign && this.valign !== 'top') {
    if (this.style.transparent) {
      for (y = Math.max(yi, 0); y < yl; y++) {
        if (!lines[y]) break;
        for (x = Math.max(xi, 0); x < xl; x++) {
          if (!lines[y][x]) break;
          lines[y][x][0] = colors.blend(attr, lines[y][x][0]);
          // lines[y][x][1] = bch;
          lines[y].dirty = true;
        }
      }
    } else {
      this.screen.fillRegion(dattr, bch, xi, xl, yi, yl);
    }
  }

  if (this.tpadding) {
    xi += this.padding.left, xl -= this.padding.right;
    yi += this.padding.top, yl -= this.padding.bottom;
  }

  // Determine where to place the text if it's vertically aligned.
  if (this.valign === 'middle' || this.valign === 'bottom') {
    visible = yl - yi;
    if (this._clines.length < visible) {
      if (this.valign === 'middle') {
        visible = visible / 2 | 0;
        visible -= this._clines.length / 2 | 0;
      } else if (this.valign === 'bottom') {
        visible -= this._clines.length;
      }
      ci -= visible * (xl - xi);
    }
  }

  // Draw the content and background.
  for (y = yi; y < yl; y++) {
    if (!lines[y]) {
      if (y >= this.screen.height || yl < this.ibottom) {
        break;
      } else {
        continue;
      }
    }
    for (x = xi; x < xl; x++) {
      cell = lines[y][x];
      if (!cell) {
        if (x >= this.screen.width || xl < this.iright) {
          break;
        } else {
          continue;
        }
      }

      ch = content[ci++] || bch;

      // if (!content[ci] && !coords._contentEnd) {
      //   coords._contentEnd = { x: x - xi, y: y - yi };
      // }

      // Handle escape codes.
      while (ch === '\x1b') {
        if (c = /^\x1b\[[\d;]*m/.exec(content.substring(ci - 1))) {
          ci += c[0].length - 1;
          attr = this.screen.attrCode(c[0], attr, dattr);
          // Ignore foreground changes for selected items.
          if (this.parent._isList && this.parent.interactive && this.parent.items[this.parent.selected] === this && this.parent.options.invertSelected !== false) {
            attr = attr & ~(0x1ff << 9) | dattr & 0x1ff << 9;
          }
          ch = content[ci] || bch;
          ci++;
        } else {
          break;
        }
      }

      // Handle newlines.
      if (ch === '\t') ch = bch;
      if (ch === '\n') {
        // If we're on the first cell and we find a newline and the last cell
        // of the last line was not a newline, let's just treat this like the
        // newline was already "counted".
        if (x === xi && y !== yi && content[ci - 2] !== '\n') {
          x--;
          continue;
        }
        // We could use fillRegion here, name the
        // outer loop, and continue to it instead.
        ch = bch;
        for (; x < xl; x++) {
          cell = lines[y][x];
          if (!cell) break;
          if (this.style.transparent) {
            lines[y][x][0] = colors.blend(attr, lines[y][x][0]);
            if (content[ci]) lines[y][x][1] = ch;
            lines[y].dirty = true;
          } else {
            if (attr !== cell[0] || ch !== cell[1]) {
              lines[y][x][0] = attr;
              lines[y][x][1] = ch;
              lines[y].dirty = true;
            }
          }
        }
        continue;
      }

      if (this.screen.fullUnicode && content[ci - 1]) {
        var point = unicode.codePointAt(content, ci - 1);
        // Handle combining chars:
        // Make sure they get in the same cell and are counted as 0.
        if (unicode.combining[point]) {
          if (point > 0x00ffff) {
            ch = content[ci - 1] + content[ci];
            ci++;
          }
          if (x - 1 >= xi) {
            lines[y][x - 1][1] += ch;
          } else if (y - 1 >= yi) {
            lines[y - 1][xl - 1][1] += ch;
          }
          x--;
          continue;
        }
        // Handle surrogate pairs:
        // Make sure we put surrogate pair chars in one cell.
        if (point > 0x00ffff) {
          ch = content[ci - 1] + content[ci];
          ci++;
        }
      }

      if (this._noFill) continue;

      if (this.style.transparent) {
        lines[y][x][0] = colors.blend(attr, lines[y][x][0]);
        if (content[ci]) lines[y][x][1] = ch;
        lines[y].dirty = true;
      } else {
        if (attr !== cell[0] || ch !== cell[1]) {
          lines[y][x][0] = attr;
          lines[y][x][1] = ch;
          lines[y].dirty = true;
        }
      }
    }
  }

  // Draw the scrollbar.
  // Could possibly draw this after all child elements.
  if (this.scrollbar) {
    // XXX
    // i = this.getScrollHeight();
    i = Math.max(this._clines.length, this._scrollBottom());
  }
  if (coords.notop || coords.nobot) i = -Infinity;
  if (this.scrollbar && yl - yi < i) {
    x = xl - 1;
    if (this.scrollbar.ignoreBorder && this.border) x++;
    if (this.alwaysScroll) {
      y = this.childBase / (i - (yl - yi));
    } else {
      y = (this.childBase + this.childOffset) / (i - 1);
    }
    y = yi + ((yl - yi) * y | 0);
    if (y >= yl) y = yl - 1;
    cell = lines[y] && lines[y][x];
    if (cell) {
      if (this.track) {
        ch = this.track.ch || ' ';
        attr = this.sattr(this.style.track, this.style.track.fg || this.style.fg, this.style.track.bg || this.style.bg);
        this.screen.fillRegion(attr, ch, x, x + 1, yi, yl);
      }
      ch = this.scrollbar.ch || ' ';
      attr = this.sattr(this.style.scrollbar, this.style.scrollbar.fg || this.style.fg, this.style.scrollbar.bg || this.style.bg);
      if (attr !== cell[0] || ch !== cell[1]) {
        lines[y][x][0] = attr;
        lines[y][x][1] = ch;
        lines[y].dirty = true;
      }
    }
  }

  if (this.border) xi--, xl++, yi--, yl++;

  if (this.tpadding) {
    xi -= this.padding.left, xl += this.padding.right;
    yi -= this.padding.top, yl += this.padding.bottom;
  }

  // Draw the border.
  if (this.border) {
    battr = this.sattr(this.style.border);
    y = yi;
    if (coords.notop) y = -1;
    for (x = xi; x < xl; x++) {
      if (!lines[y]) break;
      if (coords.noleft && x === xi) continue;
      if (coords.noright && x === xl - 1) continue;
      cell = lines[y][x];
      if (!cell) continue;
      if (this.border.type === 'line') {
        if (x === xi) {
          ch = '\u250C'; // '┌'
          if (!this.border.left) {
            if (this.border.top) {
              ch = '\u2500'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.top) {
              ch = '\u2502'; // '│'
            }
          }
        } else if (x === xl - 1) {
          ch = '\u2510'; // '┐'
          if (!this.border.right) {
            if (this.border.top) {
              ch = '\u2500'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.top) {
              ch = '\u2502'; // '│'
            }
          }
        } else {
          ch = '\u2500'; // '─'
        }
      } else if (this.border.type === 'bg') {
        ch = this.border.ch;
      }
      if (!this.border.top && x !== xi && x !== xl - 1) {
        ch = ' ';
        if (dattr !== cell[0] || ch !== cell[1]) {
          lines[y][x][0] = dattr;
          lines[y][x][1] = ch;
          lines[y].dirty = true;
          continue;
        }
      }
      if (battr !== cell[0] || ch !== cell[1]) {
        lines[y][x][0] = battr;
        lines[y][x][1] = ch;
        lines[y].dirty = true;
      }
    }
    y = yi + 1;
    for (; y < yl - 1; y++) {
      if (!lines[y]) continue;
      cell = lines[y][xi];
      if (cell) {
        if (this.border.left) {
          if (this.border.type === 'line') {
            ch = '\u2502'; // '│'
          } else if (this.border.type === 'bg') {
            ch = this.border.ch;
          }
          if (!coords.noleft) if (battr !== cell[0] || ch !== cell[1]) {
            lines[y][xi][0] = battr;
            lines[y][xi][1] = ch;
            lines[y].dirty = true;
          }
        } else {
          ch = ' ';
          if (dattr !== cell[0] || ch !== cell[1]) {
            lines[y][xi][0] = dattr;
            lines[y][xi][1] = ch;
            lines[y].dirty = true;
          }
        }
      }
      cell = lines[y][xl - 1];
      if (cell) {
        if (this.border.right) {
          if (this.border.type === 'line') {
            ch = '\u2502'; // '│'
          } else if (this.border.type === 'bg') {
            ch = this.border.ch;
          }
          if (!coords.noright) if (battr !== cell[0] || ch !== cell[1]) {
            lines[y][xl - 1][0] = battr;
            lines[y][xl - 1][1] = ch;
            lines[y].dirty = true;
          }
        } else {
          ch = ' ';
          if (dattr !== cell[0] || ch !== cell[1]) {
            lines[y][xl - 1][0] = dattr;
            lines[y][xl - 1][1] = ch;
            lines[y].dirty = true;
          }
        }
      }
    }
    y = yl - 1;
    if (coords.nobot) y = -1;
    for (x = xi; x < xl; x++) {
      if (!lines[y]) break;
      if (coords.noleft && x === xi) continue;
      if (coords.noright && x === xl - 1) continue;
      cell = lines[y][x];
      if (!cell) continue;
      if (this.border.type === 'line') {
        if (x === xi) {
          ch = '\u2514'; // '└'
          if (!this.border.left) {
            if (this.border.bottom) {
              ch = '\u2500'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.bottom) {
              ch = '\u2502'; // '│'
            }
          }
        } else if (x === xl - 1) {
          ch = '\u2518'; // '┘'
          if (!this.border.right) {
            if (this.border.bottom) {
              ch = '\u2500'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.bottom) {
              ch = '\u2502'; // '│'
            }
          }
        } else {
          ch = '\u2500'; // '─'
        }
      } else if (this.border.type === 'bg') {
        ch = this.border.ch;
      }
      if (!this.border.bottom && x !== xi && x !== xl - 1) {
        ch = ' ';
        if (dattr !== cell[0] || ch !== cell[1]) {
          lines[y][x][0] = dattr;
          lines[y][x][1] = ch;
          lines[y].dirty = true;
        }
        continue;
      }
      if (battr !== cell[0] || ch !== cell[1]) {
        lines[y][x][0] = battr;
        lines[y][x][1] = ch;
        lines[y].dirty = true;
      }
    }
  }

  if (this.shadow) {
    // right
    y = Math.max(yi + 1, 0);
    for (; y < yl + 1; y++) {
      if (!lines[y]) break;
      x = xl;
      for (; x < xl + 2; x++) {
        if (!lines[y][x]) break;
        // lines[y][x][0] = colors.blend(this.dattr, lines[y][x][0]);
        lines[y][x][0] = colors.blend(lines[y][x][0]);
        lines[y].dirty = true;
      }
    }
    // bottom
    y = yl;
    for (; y < yl + 1; y++) {
      if (!lines[y]) break;
      for (x = Math.max(xi + 1, 0); x < xl; x++) {
        if (!lines[y][x]) break;
        // lines[y][x][0] = colors.blend(this.dattr, lines[y][x][0]);
        lines[y][x][0] = colors.blend(lines[y][x][0]);
        lines[y].dirty = true;
      }
    }
  }

  this.children.forEach(function (el) {
    if (el.screen._ci !== -1) {
      el.index = el.screen._ci++;
    }
    // if (el.screen._rendering) {
    //   el._rendering = true;
    // }
    el.render();
    // if (el.screen._rendering) {
    //   el._rendering = false;
    // }
  });

  this._emit('render', [coords]);

  return coords;
};

Element.prototype._render = Element.prototype.render;

/**
 * Content Methods
 */

Element.prototype.insertLine = function (i, line) {
  if (typeof line === 'string') line = line.split('\n');

  if (i !== i || i == null) {
    i = this._clines.ftor.length;
  }

  i = Math.max(i, 0);

  while (this._clines.fake.length < i) {
    this._clines.fake.push('');
    this._clines.ftor.push([this._clines.push('') - 1]);
    this._clines.rtof(this._clines.fake.length - 1);
  }

  // NOTE: Could possibly compare the first and last ftor line numbers to see
  // if they're the same, or if they fit in the visible region entirely.
  var start = this._clines.length,
      diff,
      real;

  if (i >= this._clines.ftor.length) {
    real = this._clines.ftor[this._clines.ftor.length - 1];
    real = real[real.length - 1] + 1;
  } else {
    real = this._clines.ftor[i][0];
  }

  for (var j = 0; j < line.length; j++) {
    this._clines.fake.splice(i + j, 0, line[j]);
  }

  this.setContent(this._clines.fake.join('\n'), true);

  diff = this._clines.length - start;

  if (diff > 0) {
    var pos = this._getCoords();
    if (!pos) return;

    var height = pos.yl - pos.yi - this.iheight,
        base = this.childBase || 0,
        visible = real >= base && real - base < height;

    if (pos && visible && this.screen.cleanSides(this)) {
      this.screen.insertLine(diff, pos.yi + this.itop + real - base, pos.yi, pos.yl - this.ibottom - 1);
    }
  }
};

Element.prototype.deleteLine = function (i, n) {
  n = n || 1;

  if (i !== i || i == null) {
    i = this._clines.ftor.length - 1;
  }

  i = Math.max(i, 0);
  i = Math.min(i, this._clines.ftor.length - 1);

  // NOTE: Could possibly compare the first and last ftor line numbers to see
  // if they're the same, or if they fit in the visible region entirely.
  var start = this._clines.length,
      diff,
      real = this._clines.ftor[i][0];

  while (n--) {
    this._clines.fake.splice(i, 1);
  }

  this.setContent(this._clines.fake.join('\n'), true);

  diff = start - this._clines.length;

  // XXX clearPos() without diff statement?
  var height = 0;

  if (diff > 0) {
    var pos = this._getCoords();
    if (!pos) return;

    height = pos.yl - pos.yi - this.iheight;

    var base = this.childBase || 0,
        visible = real >= base && real - base < height;

    if (pos && visible && this.screen.cleanSides(this)) {
      this.screen.deleteLine(diff, pos.yi + this.itop + real - base, pos.yi, pos.yl - this.ibottom - 1);
    }
  }

  if (this._clines.length < height) {
    this.clearPos();
  }
};

Element.prototype.insertTop = function (line) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.insertLine(fake, line);
};

Element.prototype.insertBottom = function (line) {
  var h = (this.childBase || 0) + this.height - this.iheight,
      i = Math.min(h, this._clines.length),
      fake = this._clines.rtof[i - 1] + 1;

  return this.insertLine(fake, line);
};

Element.prototype.deleteTop = function (n) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.deleteLine(fake, n);
};

Element.prototype.deleteBottom = function (n) {
  var h = (this.childBase || 0) + this.height - 1 - this.iheight,
      i = Math.min(h, this._clines.length - 1),
      fake = this._clines.rtof[i];

  n = n || 1;

  return this.deleteLine(fake - (n - 1), n);
};

Element.prototype.setLine = function (i, line) {
  i = Math.max(i, 0);
  while (this._clines.fake.length < i) {
    this._clines.fake.push('');
  }
  this._clines.fake[i] = line;
  return this.setContent(this._clines.fake.join('\n'), true);
};

Element.prototype.setBaseLine = function (i, line) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.setLine(fake + i, line);
};

Element.prototype.getLine = function (i) {
  i = Math.max(i, 0);
  i = Math.min(i, this._clines.fake.length - 1);
  return this._clines.fake[i];
};

Element.prototype.getBaseLine = function (i) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.getLine(fake + i);
};

Element.prototype.clearLine = function (i) {
  i = Math.min(i, this._clines.fake.length - 1);
  return this.setLine(i, '');
};

Element.prototype.clearBaseLine = function (i) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.clearLine(fake + i);
};

Element.prototype.unshiftLine = function (line) {
  return this.insertLine(0, line);
};

Element.prototype.shiftLine = function (n) {
  return this.deleteLine(0, n);
};

Element.prototype.pushLine = function (line) {
  if (!this.content) return this.setLine(0, line);
  return this.insertLine(this._clines.fake.length, line);
};

Element.prototype.popLine = function (n) {
  return this.deleteLine(this._clines.fake.length - 1, n);
};

Element.prototype.getLines = function () {
  return this._clines.fake.slice();
};

Element.prototype.getScreenLines = function () {
  return this._clines.slice();
};

Element.prototype.strWidth = function (text) {
  text = this.parseTags ? helpers.stripTags(text) : text;
  return this.screen.fullUnicode ? unicode.strWidth(text) : helpers.dropUnicode(text).length;
};

Element.prototype.screenshot = function (xi, xl, yi, yl) {
  xi = this.lpos.xi + this.ileft + (xi || 0);
  if (xl != null) {
    xl = this.lpos.xi + this.ileft + (xl || 0);
  } else {
    xl = this.lpos.xl - this.iright;
  }
  yi = this.lpos.yi + this.itop + (yi || 0);
  if (yl != null) {
    yl = this.lpos.yi + this.itop + (yl || 0);
  } else {
    yl = this.lpos.yl - this.ibottom;
  }
  return this.screen.screenshot(xi, xl, yi, yl);
};

/**
 * Expose
 */

module.exports = Element;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (process.env.NODE_ENV !== 'production') {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _assign = __webpack_require__(17);

var ReactCurrentOwner = __webpack_require__(18);

var warning = __webpack_require__(2);
var canDefineProperty = __webpack_require__(35);
var hasOwnProperty = Object.prototype.hasOwnProperty;

var REACT_ELEMENT_TYPE = __webpack_require__(56);

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

var specialPropKeyWarningShown, specialPropRefWarningShown;

function hasValidRef(config) {
  if (process.env.NODE_ENV !== 'production') {
    if (hasOwnProperty.call(config, 'ref')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.ref !== undefined;
}

function hasValidKey(config) {
  if (process.env.NODE_ENV !== 'production') {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function warnAboutAccessingKey() {
    if (!specialPropKeyWarningShown) {
      specialPropKeyWarningShown = true;
      process.env.NODE_ENV !== 'production' ? warning(false, '%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName) : void 0;
    }
  };
  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function warnAboutAccessingRef() {
    if (!specialPropRefWarningShown) {
      specialPropRefWarningShown = true;
      process.env.NODE_ENV !== 'production' ? warning(false, '%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName) : void 0;
    }
  };
  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, no instanceof check
 * will work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @param {*} owner
 * @param {*} props
 * @internal
 */
var ReactElement = function ReactElement(type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allow us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner
  };

  if (process.env.NODE_ENV !== 'production') {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    if (canDefineProperty) {
      Object.defineProperty(element._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false
      });
      // self and source are DEV only properties.
      Object.defineProperty(element, '_self', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self
      });
      // Two elements created in two different places should be considered
      // equal for testing purposes and therefore we hide it from enumeration.
      Object.defineProperty(element, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
    } else {
      element._store.validated = false;
      element._self = self;
      element._source = source;
    }
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};

/**
 * Create and return a new ReactElement of the given type.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.createelement
 */
ReactElement.createElement = function (type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (process.env.NODE_ENV !== 'production') {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    if (key || ref) {
      if (typeof props.$$typeof === 'undefined' || props.$$typeof !== REACT_ELEMENT_TYPE) {
        var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;
        if (key) {
          defineKeyPropWarningGetter(props, displayName);
        }
        if (ref) {
          defineRefPropWarningGetter(props, displayName);
        }
      }
    }
  }
  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
};

/**
 * Return a function that produces ReactElements of a given type.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.createfactory
 */
ReactElement.createFactory = function (type) {
  var factory = ReactElement.createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook TODO: Warn if this is accessed
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceKey = function (oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);

  return newElement;
};

/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.cloneelement
 */
ReactElement.cloneElement = function (element, config, children) {
  var propName;

  // Original props are copied
  var props = _assign({}, element.props);

  // Reserved names are extracted
  var key = element.key;
  var ref = element.ref;
  // Self is preserved since the owner is preserved.
  var self = element._self;
  // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.
  var source = element._source;

  // Owner will be preserved, unless ref is overridden
  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    // Remaining properties override existing props
    var defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
};

/**
 * Verifies the object is a ReactElement.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
ReactElement.isValidElement = function (object) {
  return (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};

module.exports = ReactElement;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */


/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */

function reactProdInvariant(code) {
  var argCount = arguments.length - 1;

  var message = 'Minified React error #' + code + '; visit ' + 'http://facebook.github.io/react/docs/error-decoder.html?invariant=' + code;

  for (var argIdx = 0; argIdx < argCount; argIdx++) {
    message += '&args[]=' + encodeURIComponent(arguments[argIdx + 1]);
  }

  message += ' for the full message or use the non-minified dev environment' + ' for full errors and additional helpful warnings.';

  var error = new Error(message);
  error.name = 'Invariant Violation';
  error.framesToPop = 1; // we don't care about reactProdInvariant's own frame

  throw error;
}

module.exports = reactProdInvariant;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * input.js - abstract input element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Input
 */

function Input(options) {
  if (!(this instanceof Node)) {
    return new Input(options);
  }
  options = options || {};
  Box.call(this, options);
}

Input.prototype.__proto__ = Box.prototype;

Input.prototype.type = 'input';

/**
 * Expose
 */

module.exports = Input;

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * colors.js - color-related functions for blessed.
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

exports.match = function (r1, g1, b1) {
  if (typeof r1 === 'string') {
    var hex = r1;
    if (hex[0] !== '#') {
      return -1;
    }
    hex = exports.hexToRGB(hex);
    r1 = hex[0], g1 = hex[1], b1 = hex[2];
  } else if (Array.isArray(r1)) {
    b1 = r1[2], g1 = r1[1], r1 = r1[0];
  }

  var hash = r1 << 16 | g1 << 8 | b1;

  if (exports._cache[hash] != null) {
    return exports._cache[hash];
  }

  var ldiff = Infinity,
      li = -1,
      i = 0,
      c,
      r2,
      g2,
      b2,
      diff;

  for (; i < exports.vcolors.length; i++) {
    c = exports.vcolors[i];
    r2 = c[0];
    g2 = c[1];
    b2 = c[2];

    diff = colorDistance(r1, g1, b1, r2, g2, b2);

    if (diff === 0) {
      li = i;
      break;
    }

    if (diff < ldiff) {
      ldiff = diff;
      li = i;
    }
  }

  return exports._cache[hash] = li;
};

exports.RGBToHex = function (r, g, b) {
  if (Array.isArray(r)) {
    b = r[2], g = r[1], r = r[0];
  }

  function hex(n) {
    n = n.toString(16);
    if (n.length < 2) n = '0' + n;
    return n;
  }

  return '#' + hex(r) + hex(g) + hex(b);
};

exports.hexToRGB = function (hex) {
  if (hex.length === 4) {
    hex = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  var col = parseInt(hex.substring(1), 16),
      r = col >> 16 & 0xff,
      g = col >> 8 & 0xff,
      b = col & 0xff;

  return [r, g, b];
};

// As it happens, comparing how similar two colors are is really hard. Here is
// one of the simplest solutions, which doesn't require conversion to another
// color space, posted on stackoverflow[1]. Maybe someone better at math can
// propose a superior solution.
// [1] http://stackoverflow.com/questions/1633828

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.pow(30 * (r1 - r2), 2) + Math.pow(59 * (g1 - g2), 2) + Math.pow(11 * (b1 - b2), 2);
}

// This might work well enough for a terminal's colors: treat RGB as XYZ in a
// 3-dimensional space and go midway between the two points.
exports.mixColors = function (c1, c2, alpha) {
  // if (c1 === 0x1ff) return c1;
  // if (c2 === 0x1ff) return c1;
  if (c1 === 0x1ff) c1 = 0;
  if (c2 === 0x1ff) c2 = 0;
  if (alpha == null) alpha = 0.5;

  c1 = exports.vcolors[c1];
  var r1 = c1[0];
  var g1 = c1[1];
  var b1 = c1[2];

  c2 = exports.vcolors[c2];
  var r2 = c2[0];
  var g2 = c2[1];
  var b2 = c2[2];

  r1 += (r2 - r1) * alpha | 0;
  g1 += (g2 - g1) * alpha | 0;
  b1 += (b2 - b1) * alpha | 0;

  return exports.match([r1, g1, b1]);
};

exports.blend = function blend(attr, attr2, alpha) {
  var name, i, c, nc;

  var bg = attr & 0x1ff;
  if (attr2 != null) {
    var bg2 = attr2 & 0x1ff;
    if (bg === 0x1ff) bg = 0;
    if (bg2 === 0x1ff) bg2 = 0;
    bg = exports.mixColors(bg, bg2, alpha);
  } else {
    if (blend._cache[bg] != null) {
      bg = blend._cache[bg];
      // } else if (bg < 8) {
      //   bg += 8;
    } else if (bg >= 8 && bg <= 15) {
      bg -= 8;
    } else {
      name = exports.ncolors[bg];
      if (name) {
        for (i = 0; i < exports.ncolors.length; i++) {
          if (name === exports.ncolors[i] && i !== bg) {
            c = exports.vcolors[bg];
            nc = exports.vcolors[i];
            if (nc[0] + nc[1] + nc[2] < c[0] + c[1] + c[2]) {
              blend._cache[bg] = i;
              bg = i;
              break;
            }
          }
        }
      }
    }
  }

  attr &= ~0x1ff;
  attr |= bg;

  var fg = attr >> 9 & 0x1ff;
  if (attr2 != null) {
    var fg2 = attr2 >> 9 & 0x1ff;
    // 0, 7, 188, 231, 251
    if (fg === 0x1ff) {
      // XXX workaround
      fg = 248;
    } else {
      if (fg === 0x1ff) fg = 7;
      if (fg2 === 0x1ff) fg2 = 7;
      fg = exports.mixColors(fg, fg2, alpha);
    }
  } else {
    if (blend._cache[fg] != null) {
      fg = blend._cache[fg];
      // } else if (fg < 8) {
      //   fg += 8;
    } else if (fg >= 8 && fg <= 15) {
      fg -= 8;
    } else {
      name = exports.ncolors[fg];
      if (name) {
        for (i = 0; i < exports.ncolors.length; i++) {
          if (name === exports.ncolors[i] && i !== fg) {
            c = exports.vcolors[fg];
            nc = exports.vcolors[i];
            if (nc[0] + nc[1] + nc[2] < c[0] + c[1] + c[2]) {
              blend._cache[fg] = i;
              fg = i;
              break;
            }
          }
        }
      }
    }
  }

  attr &= ~(0x1ff << 9);
  attr |= fg << 9;

  return attr;
};

exports.blend._cache = {};

exports._cache = {};

exports.reduce = function (color, total) {
  if (color >= 16 && total <= 16) {
    color = exports.ccolors[color];
  } else if (color >= 8 && total <= 8) {
    color -= 8;
  } else if (color >= 2 && total <= 2) {
    color %= 2;
  }
  return color;
};

// XTerm Colors
// These were actually tough to track down. The xterm source only uses color
// keywords. The X11 source needed to be examined to find the actual values.
// They then had to be mapped to rgb values and then converted to hex values.
exports.xterm = ['#000000', // black
'#cd0000', // red3
'#00cd00', // green3
'#cdcd00', // yellow3
'#0000ee', // blue2
'#cd00cd', // magenta3
'#00cdcd', // cyan3
'#e5e5e5', // gray90
'#7f7f7f', // gray50
'#ff0000', // red
'#00ff00', // green
'#ffff00', // yellow
'#5c5cff', // rgb:5c/5c/ff
'#ff00ff', // magenta
'#00ffff', // cyan
'#ffffff' // white
];

// Seed all 256 colors. Assume xterm defaults.
// Ported from the xterm color generation script.
exports.colors = function () {
  var cols = exports.colors = [],
      _cols = exports.vcolors = [],
      r,
      g,
      b,
      i,
      l;

  function hex(n) {
    n = n.toString(16);
    if (n.length < 2) n = '0' + n;
    return n;
  }

  function push(i, r, g, b) {
    cols[i] = '#' + hex(r) + hex(g) + hex(b);
    _cols[i] = [r, g, b];
  }

  // 0 - 15
  exports.xterm.forEach(function (c, i) {
    c = parseInt(c.substring(1), 16);
    push(i, c >> 16 & 0xff, c >> 8 & 0xff, c & 0xff);
  });

  // 16 - 231
  for (r = 0; r < 6; r++) {
    for (g = 0; g < 6; g++) {
      for (b = 0; b < 6; b++) {
        i = 16 + r * 36 + g * 6 + b;
        push(i, r ? r * 40 + 55 : 0, g ? g * 40 + 55 : 0, b ? b * 40 + 55 : 0);
      }
    }
  }

  // 232 - 255 are grey.
  for (g = 0; g < 24; g++) {
    l = g * 10 + 8;
    i = 232 + g;
    push(i, l, l, l);
  }

  return cols;
}();

// Map higher colors to the first 8 colors.
// This allows translation of high colors to low colors on 8-color terminals.
exports.ccolors = function () {
  var _cols = exports.vcolors.slice(),
      cols = exports.colors.slice(),
      out;

  exports.vcolors = exports.vcolors.slice(0, 8);
  exports.colors = exports.colors.slice(0, 8);

  out = cols.map(exports.match);

  exports.colors = cols;
  exports.vcolors = _cols;
  exports.ccolors = out;

  return out;
}();

var colorNames = exports.colorNames = {
  // special
  default: -1,
  normal: -1,
  bg: -1,
  fg: -1,
  // normal
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  // light
  lightblack: 8,
  lightred: 9,
  lightgreen: 10,
  lightyellow: 11,
  lightblue: 12,
  lightmagenta: 13,
  lightcyan: 14,
  lightwhite: 15,
  // bright
  brightblack: 8,
  brightred: 9,
  brightgreen: 10,
  brightyellow: 11,
  brightblue: 12,
  brightmagenta: 13,
  brightcyan: 14,
  brightwhite: 15,
  // alternate spellings
  grey: 8,
  gray: 8,
  lightgrey: 7,
  lightgray: 7,
  brightgrey: 7,
  brightgray: 7
};

exports.convert = function (color) {
  if (typeof color === 'number') {
    ;
  } else if (typeof color === 'string') {
    color = color.replace(/[\- ]/g, '');
    if (colorNames[color] != null) {
      color = colorNames[color];
    } else {
      color = exports.match(color);
    }
  } else if (Array.isArray(color)) {
    color = exports.match(color);
  } else {
    color = -1;
  }
  return color !== -1 ? color : 0x1ff;
};

// Map higher colors to the first 8 colors.
// This allows translation of high colors to low colors on 8-color terminals.
// Why the hell did I do this by hand?
exports.ccolors = {
  blue: [4, 12, [17, 21], [24, 27], [31, 33], [38, 39], 45, [54, 57], [60, 63], [67, 69], [74, 75], 81, [91, 93], [97, 99], [103, 105], [110, 111], 117, [128, 129], [134, 135], [140, 141], [146, 147], 153, 165, 171, 177, 183, 189],

  green: [2, 10, 22, [28, 29], [34, 36], [40, 43], [46, 50], [64, 65], [70, 72], [76, 79], [82, 86], [106, 108], [112, 115], [118, 122], [148, 151], [154, 158], [190, 194]],

  cyan: [6, 14, 23, 30, 37, 44, 51, 66, 73, 80, 87, 109, 116, 123, 152, 159, 195],

  red: [1, 9, 52, [88, 89], [94, 95], [124, 126], [130, 132], [136, 138], [160, 163], [166, 169], [172, 175], [178, 181], [196, 200], [202, 206], [208, 212], [214, 218], [220, 224]],

  magenta: [5, 13, 53, 90, 96, 127, 133, 139, 164, 170, 176, 182, 201, 207, 213, 219, 225],

  yellow: [3, 11, 58, [100, 101], [142, 144], [184, 187], [226, 230]],

  black: [0, 8, 16, 59, 102, [232, 243]],

  white: [7, 15, 145, 188, 231, [244, 255]]
};

exports.ncolors = [];

Object.keys(exports.ccolors).forEach(function (name) {
  exports.ccolors[name].forEach(function (offset) {
    if (typeof offset === 'number') {
      exports.ncolors[offset] = name;
      exports.ccolors[offset] = exports.colorNames[name];
      return;
    }
    for (var i = offset[0], l = offset[1]; i <= l; i++) {
      exports.ncolors[i] = name;
      exports.ccolors[i] = exports.colorNames[name];
    }
  });
  delete exports.ccolors[name];
});

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * unicode.js - east asian width and surrogate pairs
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 * Borrowed from vangie/east-asian-width, komagata/eastasianwidth,
 * and mathiasbynens/String.prototype.codePointAt. Licenses below.
 */

// east-asian-width
//
// Copyright (c) 2015 Vangie Du
// https://github.com/vangie/east-asian-width
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

// eastasianwidth
//
// Copyright (c) 2013, Masaki Komagata
// https://github.com/komagata/eastasianwidth
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// String.prototype.codePointAt
//
// Copyright Mathias Bynens <https://mathiasbynens.be/>
// https://github.com/mathiasbynens/String.prototype.codePointAt
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// String.fromCodePoint
//
// Copyright Mathias Bynens <https://mathiasbynens.be/>
// https://github.com/mathiasbynens/String.fromCodePoint
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var stringFromCharCode = String.fromCharCode;
var floor = Math.floor;

/**
 * Wide, Surrogates, and Combining
 */

exports.charWidth = function (str, i) {
  var point = typeof str !== 'number' ? exports.codePointAt(str, i || 0) : str;

  // nul
  if (point === 0) return 0;

  // tab
  if (point === 0x09) {
    if (!exports.blessed) {
      exports.blessed = __webpack_require__(38);
    }
    return exports.blessed.screen.global ? exports.blessed.screen.global.tabc.length : 8;
  }

  // 8-bit control characters (2-width according to unicode??)
  if (point < 32 || point >= 0x7f && point < 0xa0) {
    return 0;
  }

  // search table of non-spacing characters
  // is ucs combining or C0/C1 control character
  if (exports.combining[point]) {
    return 0;
  }

  // check for double-wide
  // if (point >= 0x1100
  //     && (point <= 0x115f // Hangul Jamo init. consonants
  //     || point === 0x2329 || point === 0x232a
  //     || (point >= 0x2e80 && point <= 0xa4cf
  //     && point !== 0x303f) // CJK ... Yi
  //     || (point >= 0xac00 && point <= 0xd7a3) // Hangul Syllables
  //     || (point >= 0xf900 && point <= 0xfaff) // CJK Compatibility Ideographs
  //     || (point >= 0xfe10 && point <= 0xfe19) // Vertical forms
  //     || (point >= 0xfe30 && point <= 0xfe6f) // CJK Compatibility Forms
  //     || (point >= 0xff00 && point <= 0xff60) // Fullwidth Forms
  //     || (point >= 0xffe0 && point <= 0xffe6)
  //     || (point >= 0x20000 && point <= 0x2fffd)
  //     || (point >= 0x30000 && point <= 0x3fffd))) {
  //   return 2;
  // }

  // check for double-wide
  if (0x3000 === point || 0xFF01 <= point && point <= 0xFF60 || 0xFFE0 <= point && point <= 0xFFE6) {
    return 2;
  }

  if (0x1100 <= point && point <= 0x115F || 0x11A3 <= point && point <= 0x11A7 || 0x11FA <= point && point <= 0x11FF || 0x2329 <= point && point <= 0x232A || 0x2E80 <= point && point <= 0x2E99 || 0x2E9B <= point && point <= 0x2EF3 || 0x2F00 <= point && point <= 0x2FD5 || 0x2FF0 <= point && point <= 0x2FFB || 0x3001 <= point && point <= 0x303E || 0x3041 <= point && point <= 0x3096 || 0x3099 <= point && point <= 0x30FF || 0x3105 <= point && point <= 0x312D || 0x3131 <= point && point <= 0x318E || 0x3190 <= point && point <= 0x31BA || 0x31C0 <= point && point <= 0x31E3 || 0x31F0 <= point && point <= 0x321E || 0x3220 <= point && point <= 0x3247 || 0x3250 <= point && point <= 0x32FE || 0x3300 <= point && point <= 0x4DBF || 0x4E00 <= point && point <= 0xA48C || 0xA490 <= point && point <= 0xA4C6 || 0xA960 <= point && point <= 0xA97C || 0xAC00 <= point && point <= 0xD7A3 || 0xD7B0 <= point && point <= 0xD7C6 || 0xD7CB <= point && point <= 0xD7FB || 0xF900 <= point && point <= 0xFAFF || 0xFE10 <= point && point <= 0xFE19 || 0xFE30 <= point && point <= 0xFE52 || 0xFE54 <= point && point <= 0xFE66 || 0xFE68 <= point && point <= 0xFE6B || 0x1B000 <= point && point <= 0x1B001 || 0x1F200 <= point && point <= 0x1F202 || 0x1F210 <= point && point <= 0x1F23A || 0x1F240 <= point && point <= 0x1F248 || 0x1F250 <= point && point <= 0x1F251 || 0x20000 <= point && point <= 0x2F73F || 0x2B740 <= point && point <= 0x2FFFD || 0x30000 <= point && point <= 0x3FFFD) {
    return 2;
  }

  // CJK Ambiguous
  // http://www.unicode.org/reports/tr11/
  // http://www.unicode.org/reports/tr11/#Ambiguous
  if (process.env.NCURSES_CJK_WIDTH) {
    if (0x00A1 === point || 0x00A4 === point || 0x00A7 <= point && point <= 0x00A8 || 0x00AA === point || 0x00AD <= point && point <= 0x00AE || 0x00B0 <= point && point <= 0x00B4 || 0x00B6 <= point && point <= 0x00BA || 0x00BC <= point && point <= 0x00BF || 0x00C6 === point || 0x00D0 === point || 0x00D7 <= point && point <= 0x00D8 || 0x00DE <= point && point <= 0x00E1 || 0x00E6 === point || 0x00E8 <= point && point <= 0x00EA || 0x00EC <= point && point <= 0x00ED || 0x00F0 === point || 0x00F2 <= point && point <= 0x00F3 || 0x00F7 <= point && point <= 0x00FA || 0x00FC === point || 0x00FE === point || 0x0101 === point || 0x0111 === point || 0x0113 === point || 0x011B === point || 0x0126 <= point && point <= 0x0127 || 0x012B === point || 0x0131 <= point && point <= 0x0133 || 0x0138 === point || 0x013F <= point && point <= 0x0142 || 0x0144 === point || 0x0148 <= point && point <= 0x014B || 0x014D === point || 0x0152 <= point && point <= 0x0153 || 0x0166 <= point && point <= 0x0167 || 0x016B === point || 0x01CE === point || 0x01D0 === point || 0x01D2 === point || 0x01D4 === point || 0x01D6 === point || 0x01D8 === point || 0x01DA === point || 0x01DC === point || 0x0251 === point || 0x0261 === point || 0x02C4 === point || 0x02C7 === point || 0x02C9 <= point && point <= 0x02CB || 0x02CD === point || 0x02D0 === point || 0x02D8 <= point && point <= 0x02DB || 0x02DD === point || 0x02DF === point || 0x0300 <= point && point <= 0x036F || 0x0391 <= point && point <= 0x03A1 || 0x03A3 <= point && point <= 0x03A9 || 0x03B1 <= point && point <= 0x03C1 || 0x03C3 <= point && point <= 0x03C9 || 0x0401 === point || 0x0410 <= point && point <= 0x044F || 0x0451 === point || 0x2010 === point || 0x2013 <= point && point <= 0x2016 || 0x2018 <= point && point <= 0x2019 || 0x201C <= point && point <= 0x201D || 0x2020 <= point && point <= 0x2022 || 0x2024 <= point && point <= 0x2027 || 0x2030 === point || 0x2032 <= point && point <= 0x2033 || 0x2035 === point || 0x203B === point || 0x203E === point || 0x2074 === point || 0x207F === point || 0x2081 <= point && point <= 0x2084 || 0x20AC === point || 0x2103 === point || 0x2105 === point || 0x2109 === point || 0x2113 === point || 0x2116 === point || 0x2121 <= point && point <= 0x2122 || 0x2126 === point || 0x212B === point || 0x2153 <= point && point <= 0x2154 || 0x215B <= point && point <= 0x215E || 0x2160 <= point && point <= 0x216B || 0x2170 <= point && point <= 0x2179 || 0x2189 === point || 0x2190 <= point && point <= 0x2199 || 0x21B8 <= point && point <= 0x21B9 || 0x21D2 === point || 0x21D4 === point || 0x21E7 === point || 0x2200 === point || 0x2202 <= point && point <= 0x2203 || 0x2207 <= point && point <= 0x2208 || 0x220B === point || 0x220F === point || 0x2211 === point || 0x2215 === point || 0x221A === point || 0x221D <= point && point <= 0x2220 || 0x2223 === point || 0x2225 === point || 0x2227 <= point && point <= 0x222C || 0x222E === point || 0x2234 <= point && point <= 0x2237 || 0x223C <= point && point <= 0x223D || 0x2248 === point || 0x224C === point || 0x2252 === point || 0x2260 <= point && point <= 0x2261 || 0x2264 <= point && point <= 0x2267 || 0x226A <= point && point <= 0x226B || 0x226E <= point && point <= 0x226F || 0x2282 <= point && point <= 0x2283 || 0x2286 <= point && point <= 0x2287 || 0x2295 === point || 0x2299 === point || 0x22A5 === point || 0x22BF === point || 0x2312 === point || 0x2460 <= point && point <= 0x24E9 || 0x24EB <= point && point <= 0x254B || 0x2550 <= point && point <= 0x2573 || 0x2580 <= point && point <= 0x258F || 0x2592 <= point && point <= 0x2595 || 0x25A0 <= point && point <= 0x25A1 || 0x25A3 <= point && point <= 0x25A9 || 0x25B2 <= point && point <= 0x25B3 || 0x25B6 <= point && point <= 0x25B7 || 0x25BC <= point && point <= 0x25BD || 0x25C0 <= point && point <= 0x25C1 || 0x25C6 <= point && point <= 0x25C8 || 0x25CB === point || 0x25CE <= point && point <= 0x25D1 || 0x25E2 <= point && point <= 0x25E5 || 0x25EF === point || 0x2605 <= point && point <= 0x2606 || 0x2609 === point || 0x260E <= point && point <= 0x260F || 0x2614 <= point && point <= 0x2615 || 0x261C === point || 0x261E === point || 0x2640 === point || 0x2642 === point || 0x2660 <= point && point <= 0x2661 || 0x2663 <= point && point <= 0x2665 || 0x2667 <= point && point <= 0x266A || 0x266C <= point && point <= 0x266D || 0x266F === point || 0x269E <= point && point <= 0x269F || 0x26BE <= point && point <= 0x26BF || 0x26C4 <= point && point <= 0x26CD || 0x26CF <= point && point <= 0x26E1 || 0x26E3 === point || 0x26E8 <= point && point <= 0x26FF || 0x273D === point || 0x2757 === point || 0x2776 <= point && point <= 0x277F || 0x2B55 <= point && point <= 0x2B59 || 0x3248 <= point && point <= 0x324F || 0xE000 <= point && point <= 0xF8FF || 0xFE00 <= point && point <= 0xFE0F || 0xFFFD === point || 0x1F100 <= point && point <= 0x1F10A || 0x1F110 <= point && point <= 0x1F12D || 0x1F130 <= point && point <= 0x1F169 || 0x1F170 <= point && point <= 0x1F19A || 0xE0100 <= point && point <= 0xE01EF || 0xF0000 <= point && point <= 0xFFFFD || 0x100000 <= point && point <= 0x10FFFD) {
      return +process.env.NCURSES_CJK_WIDTH || 1;
    }
  }

  return 1;
};

exports.strWidth = function (str) {
  var width = 0;
  for (var i = 0; i < str.length; i++) {
    width += exports.charWidth(str, i);
    if (exports.isSurrogate(str, i)) i++;
  }
  return width;
};

exports.isSurrogate = function (str, i) {
  var point = typeof str !== 'number' ? exports.codePointAt(str, i || 0) : str;
  return point > 0x00ffff;
};

exports.combiningTable = [[0x0300, 0x036F], [0x0483, 0x0486], [0x0488, 0x0489], [0x0591, 0x05BD], [0x05BF, 0x05BF], [0x05C1, 0x05C2], [0x05C4, 0x05C5], [0x05C7, 0x05C7], [0x0600, 0x0603], [0x0610, 0x0615], [0x064B, 0x065E], [0x0670, 0x0670], [0x06D6, 0x06E4], [0x06E7, 0x06E8], [0x06EA, 0x06ED], [0x070F, 0x070F], [0x0711, 0x0711], [0x0730, 0x074A], [0x07A6, 0x07B0], [0x07EB, 0x07F3], [0x0901, 0x0902], [0x093C, 0x093C], [0x0941, 0x0948], [0x094D, 0x094D], [0x0951, 0x0954], [0x0962, 0x0963], [0x0981, 0x0981], [0x09BC, 0x09BC], [0x09C1, 0x09C4], [0x09CD, 0x09CD], [0x09E2, 0x09E3], [0x0A01, 0x0A02], [0x0A3C, 0x0A3C], [0x0A41, 0x0A42], [0x0A47, 0x0A48], [0x0A4B, 0x0A4D], [0x0A70, 0x0A71], [0x0A81, 0x0A82], [0x0ABC, 0x0ABC], [0x0AC1, 0x0AC5], [0x0AC7, 0x0AC8], [0x0ACD, 0x0ACD], [0x0AE2, 0x0AE3], [0x0B01, 0x0B01], [0x0B3C, 0x0B3C], [0x0B3F, 0x0B3F], [0x0B41, 0x0B43], [0x0B4D, 0x0B4D], [0x0B56, 0x0B56], [0x0B82, 0x0B82], [0x0BC0, 0x0BC0], [0x0BCD, 0x0BCD], [0x0C3E, 0x0C40], [0x0C46, 0x0C48], [0x0C4A, 0x0C4D], [0x0C55, 0x0C56], [0x0CBC, 0x0CBC], [0x0CBF, 0x0CBF], [0x0CC6, 0x0CC6], [0x0CCC, 0x0CCD], [0x0CE2, 0x0CE3], [0x0D41, 0x0D43], [0x0D4D, 0x0D4D], [0x0DCA, 0x0DCA], [0x0DD2, 0x0DD4], [0x0DD6, 0x0DD6], [0x0E31, 0x0E31], [0x0E34, 0x0E3A], [0x0E47, 0x0E4E], [0x0EB1, 0x0EB1], [0x0EB4, 0x0EB9], [0x0EBB, 0x0EBC], [0x0EC8, 0x0ECD], [0x0F18, 0x0F19], [0x0F35, 0x0F35], [0x0F37, 0x0F37], [0x0F39, 0x0F39], [0x0F71, 0x0F7E], [0x0F80, 0x0F84], [0x0F86, 0x0F87], [0x0F90, 0x0F97], [0x0F99, 0x0FBC], [0x0FC6, 0x0FC6], [0x102D, 0x1030], [0x1032, 0x1032], [0x1036, 0x1037], [0x1039, 0x1039], [0x1058, 0x1059], [0x1160, 0x11FF], [0x135F, 0x135F], [0x1712, 0x1714], [0x1732, 0x1734], [0x1752, 0x1753], [0x1772, 0x1773], [0x17B4, 0x17B5], [0x17B7, 0x17BD], [0x17C6, 0x17C6], [0x17C9, 0x17D3], [0x17DD, 0x17DD], [0x180B, 0x180D], [0x18A9, 0x18A9], [0x1920, 0x1922], [0x1927, 0x1928], [0x1932, 0x1932], [0x1939, 0x193B], [0x1A17, 0x1A18], [0x1B00, 0x1B03], [0x1B34, 0x1B34], [0x1B36, 0x1B3A], [0x1B3C, 0x1B3C], [0x1B42, 0x1B42], [0x1B6B, 0x1B73], [0x1DC0, 0x1DCA], [0x1DFE, 0x1DFF], [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2063], [0x206A, 0x206F], [0x20D0, 0x20EF], [0x302A, 0x302F], [0x3099, 0x309A], [0xA806, 0xA806], [0xA80B, 0xA80B], [0xA825, 0xA826], [0xFB1E, 0xFB1E], [0xFE00, 0xFE0F], [0xFE20, 0xFE23], [0xFEFF, 0xFEFF], [0xFFF9, 0xFFFB], [0x10A01, 0x10A03], [0x10A05, 0x10A06], [0x10A0C, 0x10A0F], [0x10A38, 0x10A3A], [0x10A3F, 0x10A3F], [0x1D167, 0x1D169], [0x1D173, 0x1D182], [0x1D185, 0x1D18B], [0x1D1AA, 0x1D1AD], [0x1D242, 0x1D244], [0xE0001, 0xE0001], [0xE0020, 0xE007F], [0xE0100, 0xE01EF]];

exports.combining = exports.combiningTable.reduce(function (out, row) {
  for (var i = row[0]; i <= row[1]; i++) {
    out[i] = true;
  }
  return out;
}, {});

exports.isCombining = function (str, i) {
  var point = typeof str !== 'number' ? exports.codePointAt(str, i || 0) : str;
  return exports.combining[point] === true;
};

/**
 * Code Point Helpers
 */

exports.codePointAt = function (str, position) {
  if (str == null) {
    throw TypeError();
  }
  var string = String(str);
  if (string.codePointAt) {
    return string.codePointAt(position);
  }
  var size = string.length;
  // `ToInteger`
  var index = position ? Number(position) : 0;
  if (index !== index) {
    // better `isNaN`
    index = 0;
  }
  // Account for out-of-bounds indices:
  if (index < 0 || index >= size) {
    return undefined;
  }
  // Get the first code unit
  var first = string.charCodeAt(index);
  var second;
  if ( // check if it’s the start of a surrogate pair
  first >= 0xD800 && first <= 0xDBFF && // high surrogate
  size > index + 1 // there is a next code unit
  ) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        // low surrogate
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
  return first;
};

// exports.codePointAt = function(str, position) {
//   position = +position || 0;
//   var x = str.charCodeAt(position);
//   var y = str.length > 1 ? str.charCodeAt(position + 1) : 0;
//   var point = x;
//   if ((0xD800 <= x && x <= 0xDBFF) && (0xDC00 <= y && y <= 0xDFFF)) {
//     x &= 0x3FF;
//     y &= 0x3FF;
//     point = (x << 10) | y;
//     point += 0x10000;
//   }
//   return point;
// };

exports.fromCodePoint = function () {
  if (String.fromCodePoint) {
    return String.fromCodePoint.apply(String, arguments);
  }
  var MAX_SIZE = 0x4000;
  var codeUnits = [];
  var highSurrogate;
  var lowSurrogate;
  var index = -1;
  var length = arguments.length;
  if (!length) {
    return '';
  }
  var result = '';
  while (++index < length) {
    var codePoint = Number(arguments[index]);
    if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
    codePoint < 0 || // not a valid Unicode code point
    codePoint > 0x10FFFF || // not a valid Unicode code point
    floor(codePoint) !== codePoint // not an integer
    ) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
    if (codePoint <= 0xFFFF) {
      // BMP code point
      codeUnits.push(codePoint);
    } else {
      // Astral code point; split in surrogate halves
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      codePoint -= 0x10000;
      highSurrogate = (codePoint >> 10) + 0xD800;
      lowSurrogate = codePoint % 0x400 + 0xDC00;
      codeUnits.push(highSurrogate, lowSurrogate);
    }
    if (index + 1 === length || codeUnits.length > MAX_SIZE) {
      result += stringFromCharCode.apply(null, codeUnits);
      codeUnits.length = 0;
    }
  }
  return result;
};

/**
 * Regexes
 */

exports.chars = {};

// Double width characters that are _not_ surrogate pairs.
// NOTE: 0x20000 - 0x2fffd and 0x30000 - 0x3fffd are not necessary for this
// regex anyway. This regex is used to put a blank char after wide chars to
// be eaten, however, if this is a surrogate pair, parseContent already adds
// the extra one char because its length equals 2 instead of 1.
exports.chars.wide = new RegExp('([' + '\\u1100-\\u115f' // Hangul Jamo init. consonants
+ '\\u2329\\u232a' + '\\u2e80-\\u303e\\u3040-\\ua4cf' // CJK ... Yi
+ '\\uac00-\\ud7a3' // Hangul Syllables
+ '\\uf900-\\ufaff' // CJK Compatibility Ideographs
+ '\\ufe10-\\ufe19' // Vertical forms
+ '\\ufe30-\\ufe6f' // CJK Compatibility Forms
+ '\\uff00-\\uff60' // Fullwidth Forms
+ '\\uffe0-\\uffe6' + '])', 'g');

// All surrogate pair wide chars.
exports.chars.swide = new RegExp('('
// 0x20000 - 0x2fffd:
+ '[\\ud840-\\ud87f][\\udc00-\\udffd]' + '|'
// 0x30000 - 0x3fffd:
+ '[\\ud880-\\ud8bf][\\udc00-\\udffd]' + ')', 'g');

// All wide chars including surrogate pairs.
exports.chars.all = new RegExp('(' + exports.chars.swide.source.slice(1, -1) + '|' + exports.chars.wide.source.slice(1, -1) + ')', 'g');

// Regex to detect a surrogate pair.
exports.chars.surrogate = /[\ud800-\udbff][\udc00-\udfff]/g;

// Regex to find combining characters.
exports.chars.combining = exports.combiningTable.reduce(function (out, row) {
  var low, high, range;
  if (row[0] > 0x00ffff) {
    low = exports.fromCodePoint(row[0]);
    low = [hexify(low.charCodeAt(0)), hexify(low.charCodeAt(1))];
    high = exports.fromCodePoint(row[1]);
    high = [hexify(high.charCodeAt(0)), hexify(high.charCodeAt(1))];
    range = '[\\u' + low[0] + '-' + '\\u' + high[0] + ']' + '[\\u' + low[1] + '-' + '\\u' + high[1] + ']';
    if (!~out.indexOf('|')) out += ']';
    out += '|' + range;
  } else {
    low = hexify(row[0]);
    high = hexify(row[1]);
    low = '\\u' + low;
    high = '\\u' + high;
    out += low + '-' + high;
  }
  return out;
}, '[');

exports.chars.combining = new RegExp(exports.chars.combining, 'g');

function hexify(n) {
  n = n.toString(16);
  while (n.length < 4) {
    n = '0' + n;
  }return n;
}

/*
exports.chars.combining = new RegExp(
  '['
  + '\\u0300-\\u036f'
  + '\\u0483-\\u0486'
  + '\\u0488-\\u0489'
  + '\\u0591-\\u05bd'
  + '\\u05bf-\\u05bf'
  + '\\u05c1-\\u05c2'
  + '\\u05c4-\\u05c5'
  + '\\u05c7-\\u05c7'
  + '\\u0600-\\u0603'
  + '\\u0610-\\u0615'
  + '\\u064b-\\u065e'
  + '\\u0670-\\u0670'
  + '\\u06d6-\\u06e4'
  + '\\u06e7-\\u06e8'
  + '\\u06ea-\\u06ed'
  + '\\u070f-\\u070f'
  + '\\u0711-\\u0711'
  + '\\u0730-\\u074a'
  + '\\u07a6-\\u07b0'
  + '\\u07eb-\\u07f3'
  + '\\u0901-\\u0902'
  + '\\u093c-\\u093c'
  + '\\u0941-\\u0948'
  + '\\u094d-\\u094d'
  + '\\u0951-\\u0954'
  + '\\u0962-\\u0963'
  + '\\u0981-\\u0981'
  + '\\u09bc-\\u09bc'
  + '\\u09c1-\\u09c4'
  + '\\u09cd-\\u09cd'
  + '\\u09e2-\\u09e3'
  + '\\u0a01-\\u0a02'
  + '\\u0a3c-\\u0a3c'
  + '\\u0a41-\\u0a42'
  + '\\u0a47-\\u0a48'
  + '\\u0a4b-\\u0a4d'
  + '\\u0a70-\\u0a71'
  + '\\u0a81-\\u0a82'
  + '\\u0abc-\\u0abc'
  + '\\u0ac1-\\u0ac5'
  + '\\u0ac7-\\u0ac8'
  + '\\u0acd-\\u0acd'
  + '\\u0ae2-\\u0ae3'
  + '\\u0b01-\\u0b01'
  + '\\u0b3c-\\u0b3c'
  + '\\u0b3f-\\u0b3f'
  + '\\u0b41-\\u0b43'
  + '\\u0b4d-\\u0b4d'
  + '\\u0b56-\\u0b56'
  + '\\u0b82-\\u0b82'
  + '\\u0bc0-\\u0bc0'
  + '\\u0bcd-\\u0bcd'
  + '\\u0c3e-\\u0c40'
  + '\\u0c46-\\u0c48'
  + '\\u0c4a-\\u0c4d'
  + '\\u0c55-\\u0c56'
  + '\\u0cbc-\\u0cbc'
  + '\\u0cbf-\\u0cbf'
  + '\\u0cc6-\\u0cc6'
  + '\\u0ccc-\\u0ccd'
  + '\\u0ce2-\\u0ce3'
  + '\\u0d41-\\u0d43'
  + '\\u0d4d-\\u0d4d'
  + '\\u0dca-\\u0dca'
  + '\\u0dd2-\\u0dd4'
  + '\\u0dd6-\\u0dd6'
  + '\\u0e31-\\u0e31'
  + '\\u0e34-\\u0e3a'
  + '\\u0e47-\\u0e4e'
  + '\\u0eb1-\\u0eb1'
  + '\\u0eb4-\\u0eb9'
  + '\\u0ebb-\\u0ebc'
  + '\\u0ec8-\\u0ecd'
  + '\\u0f18-\\u0f19'
  + '\\u0f35-\\u0f35'
  + '\\u0f37-\\u0f37'
  + '\\u0f39-\\u0f39'
  + '\\u0f71-\\u0f7e'
  + '\\u0f80-\\u0f84'
  + '\\u0f86-\\u0f87'
  + '\\u0f90-\\u0f97'
  + '\\u0f99-\\u0fbc'
  + '\\u0fc6-\\u0fc6'
  + '\\u102d-\\u1030'
  + '\\u1032-\\u1032'
  + '\\u1036-\\u1037'
  + '\\u1039-\\u1039'
  + '\\u1058-\\u1059'
  + '\\u1160-\\u11ff'
  + '\\u135f-\\u135f'
  + '\\u1712-\\u1714'
  + '\\u1732-\\u1734'
  + '\\u1752-\\u1753'
  + '\\u1772-\\u1773'
  + '\\u17b4-\\u17b5'
  + '\\u17b7-\\u17bd'
  + '\\u17c6-\\u17c6'
  + '\\u17c9-\\u17d3'
  + '\\u17dd-\\u17dd'
  + '\\u180b-\\u180d'
  + '\\u18a9-\\u18a9'
  + '\\u1920-\\u1922'
  + '\\u1927-\\u1928'
  + '\\u1932-\\u1932'
  + '\\u1939-\\u193b'
  + '\\u1a17-\\u1a18'
  + '\\u1b00-\\u1b03'
  + '\\u1b34-\\u1b34'
  + '\\u1b36-\\u1b3a'
  + '\\u1b3c-\\u1b3c'
  + '\\u1b42-\\u1b42'
  + '\\u1b6b-\\u1b73'
  + '\\u1dc0-\\u1dca'
  + '\\u1dfe-\\u1dff'
  + '\\u200b-\\u200f'
  + '\\u202a-\\u202e'
  + '\\u2060-\\u2063'
  + '\\u206a-\\u206f'
  + '\\u20d0-\\u20ef'
  + '\\u302a-\\u302f'
  + '\\u3099-\\u309a'
  + '\\ua806-\\ua806'
  + '\\ua80b-\\ua80b'
  + '\\ua825-\\ua826'
  + '\\ufb1e-\\ufb1e'
  + '\\ufe00-\\ufe0f'
  + '\\ufe20-\\ufe23'
  + '\\ufeff-\\ufeff'
  + '\\ufff9-\\ufffb'
  + ']'
  + '|[\\ud802-\\ud802][\\ude01-\\ude03]'
  + '|[\\ud802-\\ud802][\\ude05-\\ude06]'
  + '|[\\ud802-\\ud802][\\ude0c-\\ude0f]'
  + '|[\\ud802-\\ud802][\\ude38-\\ude3a]'
  + '|[\\ud802-\\ud802][\\ude3f-\\ude3f]'
  + '|[\\ud834-\\ud834][\\udd67-\\udd69]'
  + '|[\\ud834-\\ud834][\\udd73-\\udd82]'
  + '|[\\ud834-\\ud834][\\udd85-\\udd8b]'
  + '|[\\ud834-\\ud834][\\uddaa-\\uddad]'
  + '|[\\ud834-\\ud834][\\ude42-\\ude44]'
  + '|[\\udb40-\\udb40][\\udc01-\\udc01]'
  + '|[\\udb40-\\udb40][\\udc20-\\udc7f]'
  + '|[\\udb40-\\udb40][\\udd00-\\uddef]'
, 'g');
*/

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * button.js - button element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Input = __webpack_require__(9);

/**
 * Button
 */

function Button(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Button(options);
  }

  options = options || {};

  if (options.autoFocus == null) {
    options.autoFocus = false;
  }

  Input.call(this, options);

  this.on('keypress', function (ch, key) {
    if (key.name === 'enter' || key.name === 'space') {
      return self.press();
    }
  });

  if (this.options.mouse) {
    this.on('click', function () {
      return self.press();
    });
  }
}

Button.prototype.__proto__ = Input.prototype;

Button.prototype.type = 'button';

Button.prototype.press = function () {
  this.focus();
  this.value = true;
  var result = this.emit('press');
  delete this.value;
  return result;
};

/**
 * Expose
 */

module.exports = Button;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * list.js - list element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var helpers = __webpack_require__(3);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * List
 */

function List(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new List(options);
  }

  options = options || {};

  options.ignoreKeys = true;
  // Possibly put this here: this.items = [];
  options.scrollable = true;
  Box.call(this, options);

  this.value = '';
  this.items = [];
  this.ritems = [];
  this.selected = 0;
  this._isList = true;

  if (!this.style.selected) {
    this.style.selected = {};
    this.style.selected.bg = options.selectedBg;
    this.style.selected.fg = options.selectedFg;
    this.style.selected.bold = options.selectedBold;
    this.style.selected.underline = options.selectedUnderline;
    this.style.selected.blink = options.selectedBlink;
    this.style.selected.inverse = options.selectedInverse;
    this.style.selected.invisible = options.selectedInvisible;
  }

  if (!this.style.item) {
    this.style.item = {};
    this.style.item.bg = options.itemBg;
    this.style.item.fg = options.itemFg;
    this.style.item.bold = options.itemBold;
    this.style.item.underline = options.itemUnderline;
    this.style.item.blink = options.itemBlink;
    this.style.item.inverse = options.itemInverse;
    this.style.item.invisible = options.itemInvisible;
  }

  // Legacy: for apps written before the addition of item attributes.
  ['bg', 'fg', 'bold', 'underline', 'blink', 'inverse', 'invisible'].forEach(function (name) {
    if (self.style[name] != null && self.style.item[name] == null) {
      self.style.item[name] = self.style[name];
    }
  });

  if (this.options.itemHoverBg) {
    this.options.itemHoverEffects = { bg: this.options.itemHoverBg };
  }

  if (this.options.itemHoverEffects) {
    this.style.item.hover = this.options.itemHoverEffects;
  }

  if (this.options.itemFocusEffects) {
    this.style.item.focus = this.options.itemFocusEffects;
  }

  this.interactive = options.interactive !== false;

  this.mouse = options.mouse || false;

  if (options.items) {
    this.ritems = options.items;
    options.items.forEach(this.add.bind(this));
  }

  this.select(0);

  if (options.mouse) {
    this.screen._listenMouse(this);
    this.on('element wheeldown', function () {
      self.select(self.selected + 2);
      self.screen.render();
    });
    this.on('element wheelup', function () {
      self.select(self.selected - 2);
      self.screen.render();
    });
  }

  if (options.keys) {
    this.on('keypress', function (ch, key) {
      if (key.name === 'up' || options.vi && key.name === 'k') {
        self.up();
        self.screen.render();
        return;
      }
      if (key.name === 'down' || options.vi && key.name === 'j') {
        self.down();
        self.screen.render();
        return;
      }
      if (key.name === 'enter' || options.vi && key.name === 'l' && !key.shift) {
        self.enterSelected();
        return;
      }
      if (key.name === 'escape' || options.vi && key.name === 'q') {
        self.cancelSelected();
        return;
      }
      if (options.vi && key.name === 'u' && key.ctrl) {
        self.move(-((self.height - self.iheight) / 2) | 0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'd' && key.ctrl) {
        self.move((self.height - self.iheight) / 2 | 0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'b' && key.ctrl) {
        self.move(-(self.height - self.iheight));
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'f' && key.ctrl) {
        self.move(self.height - self.iheight);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'h' && key.shift) {
        self.move(self.childBase - self.selected);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'm' && key.shift) {
        // TODO: Maybe use Math.min(this.items.length,
        // ... for calculating visible items elsewhere.
        var visible = Math.min(self.height - self.iheight, self.items.length) / 2 | 0;
        self.move(self.childBase + visible - self.selected);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'l' && key.shift) {
        // XXX This goes one too far on lists with an odd number of items.
        self.down(self.childBase + Math.min(self.height - self.iheight, self.items.length) - self.selected);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && !key.shift) {
        self.select(0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && key.shift) {
        self.select(self.items.length - 1);
        self.screen.render();
        return;
      }

      if (options.vi && (key.ch === '/' || key.ch === '?')) {
        if (typeof self.options.search !== 'function') {
          return;
        }
        return self.options.search(function (err, value) {
          if (typeof err === 'string' || typeof err === 'function' || typeof err === 'number' || err && err.test) {
            value = err;
            err = null;
          }
          if (err || !value) return self.screen.render();
          self.select(self.fuzzyFind(value, key.ch === '?'));
          self.screen.render();
        });
      }
    });
  }

  this.on('resize', function () {
    var visible = self.height - self.iheight;
    // if (self.selected < visible - 1) {
    if (visible >= self.selected + 1) {
      self.childBase = 0;
      self.childOffset = self.selected;
    } else {
      // Is this supposed to be: self.childBase = visible - self.selected + 1; ?
      self.childBase = self.selected - visible + 1;
      self.childOffset = visible - 1;
    }
  });

  this.on('adopt', function (el) {
    if (!~self.items.indexOf(el)) {
      el.fixed = true;
    }
  });

  // Ensure children are removed from the
  // item list if they are items.
  this.on('remove', function (el) {
    self.removeItem(el);
  });
}

List.prototype.__proto__ = Box.prototype;

List.prototype.type = 'list';

List.prototype.createItem = function (content) {
  var self = this;

  // Note: Could potentially use Button here.
  var options = {
    screen: this.screen,
    content: content,
    align: this.align || 'left',
    top: 0,
    left: 0,
    right: this.scrollbar ? 1 : 0,
    tags: this.parseTags,
    height: 1,
    hoverEffects: this.mouse ? this.style.item.hover : null,
    focusEffects: this.mouse ? this.style.item.focus : null,
    autoFocus: false
  };

  if (!this.screen.autoPadding) {
    options.top = 1;
    options.left = this.ileft;
    options.right = this.iright + (this.scrollbar ? 1 : 0);
  }

  // if (this.shrink) {
  // XXX NOTE: Maybe just do this on all shrinkage once autoPadding is default?
  if (this.shrink && this.options.normalShrink) {
    delete options.right;
    options.width = 'shrink';
  }

  ['bg', 'fg', 'bold', 'underline', 'blink', 'inverse', 'invisible'].forEach(function (name) {
    options[name] = function () {
      var attr = self.items[self.selected] === item && self.interactive ? self.style.selected[name] : self.style.item[name];
      if (typeof attr === 'function') attr = attr(item);
      return attr;
    };
  });

  if (this.style.transparent) {
    options.transparent = true;
  }

  var item = new Box(options);

  if (this.mouse) {
    item.on('click', function () {
      self.focus();
      if (self.items[self.selected] === item) {
        self.emit('action', item, self.selected);
        self.emit('select', item, self.selected);
        return;
      }
      self.select(item);
      self.screen.render();
    });
  }

  this.emit('create item');

  return item;
};

List.prototype.add = List.prototype.addItem = List.prototype.appendItem = function (content) {
  content = typeof content === 'string' ? content : content.getContent();

  var item = this.createItem(content);
  item.position.top = this.items.length;
  if (!this.screen.autoPadding) {
    item.position.top = this.itop + this.items.length;
  }

  this.ritems.push(content);
  this.items.push(item);
  this.append(item);

  if (this.items.length === 1) {
    this.select(0);
  }

  this.emit('add item');

  return item;
};

List.prototype.removeItem = function (child) {
  var i = this.getItemIndex(child);
  if (~i && this.items[i]) {
    child = this.items.splice(i, 1)[0];
    this.ritems.splice(i, 1);
    this.remove(child);
    for (var j = i; j < this.items.length; j++) {
      this.items[j].position.top--;
    }
    if (i === this.selected) {
      this.select(i - 1);
    }
  }
  this.emit('remove item');
  return child;
};

List.prototype.insertItem = function (child, content) {
  content = typeof content === 'string' ? content : content.getContent();
  var i = this.getItemIndex(child);
  if (!~i) return;
  if (i >= this.items.length) return this.appendItem(content);
  var item = this.createItem(content);
  for (var j = i; j < this.items.length; j++) {
    this.items[j].position.top++;
  }
  item.position.top = i + (!this.screen.autoPadding ? 1 : 0);
  this.ritems.splice(i, 0, content);
  this.items.splice(i, 0, item);
  this.append(item);
  if (i === this.selected) {
    this.select(i + 1);
  }
  this.emit('insert item');
};

List.prototype.getItem = function (child) {
  return this.items[this.getItemIndex(child)];
};

List.prototype.setItem = function (child, content) {
  content = typeof content === 'string' ? content : content.getContent();
  var i = this.getItemIndex(child);
  if (!~i) return;
  this.items[i].setContent(content);
  this.ritems[i] = content;
};

List.prototype.clearItems = function () {
  return this.setItems([]);
};

List.prototype.setItems = function (items) {
  var original = this.items.slice(),
      selected = this.selected,
      sel = this.ritems[this.selected],
      i = 0;

  items = items.slice();

  this.select(0);

  for (; i < items.length; i++) {
    if (this.items[i]) {
      this.items[i].setContent(items[i]);
    } else {
      this.add(items[i]);
    }
  }

  for (; i < original.length; i++) {
    this.remove(original[i]);
  }

  this.ritems = items;

  // Try to find our old item if it still exists.
  sel = items.indexOf(sel);
  if (~sel) {
    this.select(sel);
  } else if (items.length === original.length) {
    this.select(selected);
  } else {
    this.select(Math.min(selected, items.length - 1));
  }

  this.emit('set items');
};

List.prototype.pushItem = function (content) {
  this.appendItem(content);
  return this.items.length;
};

List.prototype.popItem = function () {
  return this.removeItem(this.items.length - 1);
};

List.prototype.unshiftItem = function (content) {
  this.insertItem(0, content);
  return this.items.length;
};

List.prototype.shiftItem = function () {
  return this.removeItem(0);
};

List.prototype.spliceItem = function (child, n) {
  var self = this;
  var i = this.getItemIndex(child);
  if (!~i) return;
  var items = Array.prototype.slice.call(arguments, 2);
  var removed = [];
  while (n--) {
    removed.push(this.removeItem(i));
  }
  items.forEach(function (item) {
    self.insertItem(i++, item);
  });
  return removed;
};

List.prototype.find = List.prototype.fuzzyFind = function (search, back) {
  var start = this.selected + (back ? -1 : 1),
      i;

  if (typeof search === 'number') search += '';

  if (search && search[0] === '/' && search[search.length - 1] === '/') {
    try {
      search = new RegExp(search.slice(1, -1));
    } catch (e) {
      ;
    }
  }

  var test = typeof search === 'string' ? function (item) {
    return !!~item.indexOf(search);
  } : search.test ? search.test.bind(search) : search;

  if (typeof test !== 'function') {
    if (this.screen.options.debug) {
      throw new Error('fuzzyFind(): `test` is not a function.');
    }
    return this.selected;
  }

  if (!back) {
    for (i = start; i < this.ritems.length; i++) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
    for (i = 0; i < start; i++) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
  } else {
    for (i = start; i >= 0; i--) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
    for (i = this.ritems.length - 1; i > start; i--) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
  }

  return this.selected;
};

List.prototype.getItemIndex = function (child) {
  if (typeof child === 'number') {
    return child;
  } else if (typeof child === 'string') {
    var i = this.ritems.indexOf(child);
    if (~i) return i;
    for (i = 0; i < this.ritems.length; i++) {
      if (helpers.cleanTags(this.ritems[i]) === child) {
        return i;
      }
    }
    return -1;
  } else {
    return this.items.indexOf(child);
  }
};

List.prototype.select = function (index) {
  if (!this.interactive) {
    return;
  }

  if (!this.items.length) {
    this.selected = 0;
    this.value = '';
    this.scrollTo(0);
    return;
  }

  if ((typeof index === 'undefined' ? 'undefined' : _typeof(index)) === 'object') {
    index = this.items.indexOf(index);
  }

  if (index < 0) {
    index = 0;
  } else if (index >= this.items.length) {
    index = this.items.length - 1;
  }

  if (this.selected === index && this._listInitialized) return;
  this._listInitialized = true;

  this.selected = index;
  this.value = helpers.cleanTags(this.ritems[this.selected]);
  if (!this.parent) return;
  this.scrollTo(this.selected);

  // XXX Move `action` and `select` events here.
  this.emit('select item', this.items[this.selected], this.selected);
};

List.prototype.move = function (offset) {
  this.select(this.selected + offset);
};

List.prototype.up = function (offset) {
  this.move(-(offset || 1));
};

List.prototype.down = function (offset) {
  this.move(offset || 1);
};

List.prototype.pick = function (label, callback) {
  if (!callback) {
    callback = label;
    label = null;
  }

  if (!this.interactive) {
    return callback();
  }

  var self = this;
  var focused = this.screen.focused;
  if (focused && focused._done) focused._done('stop');
  this.screen.saveFocus();

  // XXX Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.focus();
  this.show();
  this.select(0);
  if (label) this.setLabel(label);
  this.screen.render();
  this.once('action', function (el, selected) {
    if (label) self.removeLabel();
    self.screen.restoreFocus();
    self.hide();
    self.screen.render();
    if (!el) return callback();
    return callback(null, helpers.cleanTags(self.ritems[selected]));
  });
};

List.prototype.enterSelected = function (i) {
  if (i != null) this.select(i);
  this.emit('action', this.items[this.selected], this.selected);
  this.emit('select', this.items[this.selected], this.selected);
};

List.prototype.cancelSelected = function (i) {
  if (i != null) this.select(i);
  this.emit('action');
  this.emit('cancel');
};

/**
 * Expose
 */

module.exports = List;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * screen.js - screen node for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var path = __webpack_require__(37),
    fs = __webpack_require__(10),
    cp = __webpack_require__(8);

var colors = __webpack_require__(11),
    program = __webpack_require__(39),
    unicode = __webpack_require__(12);

var nextTick = global.setImmediate || process.nextTick.bind(process);

var helpers = __webpack_require__(3);

var Node = __webpack_require__(0);
var Log = __webpack_require__(21);
var Element = __webpack_require__(4);
var Box = __webpack_require__(1);

/**
 * Screen
 */

function Screen(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Screen(options);
  }

  Screen.bind(this);

  options = options || {};
  if (options.rsety && options.listen) {
    options = { program: options };
  }

  this.program = options.program;

  if (!this.program) {
    this.program = program({
      input: options.input,
      output: options.output,
      log: options.log,
      debug: options.debug,
      dump: options.dump,
      terminal: options.terminal || options.term,
      resizeTimeout: options.resizeTimeout,
      forceUnicode: options.forceUnicode,
      tput: true,
      buffer: true,
      zero: true
    });
  } else {
    this.program.setupTput();
    this.program.useBuffer = true;
    this.program.zero = true;
    this.program.options.resizeTimeout = options.resizeTimeout;
    if (options.forceUnicode != null) {
      this.program.tput.features.unicode = options.forceUnicode;
      this.program.tput.unicode = options.forceUnicode;
    }
  }

  this.tput = this.program.tput;

  Node.call(this, options);

  this.autoPadding = options.autoPadding !== false;
  this.tabc = Array((options.tabSize || 4) + 1).join(' ');
  this.dockBorders = options.dockBorders;

  this.ignoreLocked = options.ignoreLocked || [];

  this._unicode = this.tput.unicode || this.tput.numbers.U8 === 1;
  this.fullUnicode = this.options.fullUnicode && this._unicode;

  this.dattr = 0 << 18 | 0x1ff << 9 | 0x1ff;

  this.renders = 0;
  this.position = {
    left: this.left = this.aleft = this.rleft = 0,
    right: this.right = this.aright = this.rright = 0,
    top: this.top = this.atop = this.rtop = 0,
    bottom: this.bottom = this.abottom = this.rbottom = 0,
    get height() {
      return self.height;
    },
    get width() {
      return self.width;
    }
  };

  this.ileft = 0;
  this.itop = 0;
  this.iright = 0;
  this.ibottom = 0;
  this.iheight = 0;
  this.iwidth = 0;

  this.padding = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };

  this.hover = null;
  this.history = [];
  this.clickable = [];
  this.keyable = [];
  this.grabKeys = false;
  this.lockKeys = false;
  this.focused;
  this._buf = '';

  this._ci = -1;

  if (options.title) {
    this.title = options.title;
  }

  options.cursor = options.cursor || {
    artificial: options.artificialCursor,
    shape: options.cursorShape,
    blink: options.cursorBlink,
    color: options.cursorColor
  };

  this.cursor = {
    artificial: options.cursor.artificial || false,
    shape: options.cursor.shape || 'block',
    blink: options.cursor.blink || false,
    color: options.cursor.color || null,
    _set: false,
    _state: 1,
    _hidden: true
  };

  this.program.on('resize', function () {
    self.alloc();
    self.render();
    (function emit(el) {
      el.emit('resize');
      el.children.forEach(emit);
    })(self);
  });

  this.program.on('focus', function () {
    self.emit('focus');
  });

  this.program.on('blur', function () {
    self.emit('blur');
  });

  this.program.on('warning', function (text) {
    self.emit('warning', text);
  });

  this.on('newListener', function fn(type) {
    if (type === 'keypress' || type.indexOf('key ') === 0 || type === 'mouse') {
      if (type === 'keypress' || type.indexOf('key ') === 0) self._listenKeys();
      if (type === 'mouse') self._listenMouse();
    }
    if (type === 'mouse' || type === 'click' || type === 'mouseover' || type === 'mouseout' || type === 'mousedown' || type === 'mouseup' || type === 'mousewheel' || type === 'wheeldown' || type === 'wheelup' || type === 'mousemove') {
      self._listenMouse();
    }
  });

  this.setMaxListeners(Infinity);

  this.enter();

  this.postEnter();
}

Screen.global = null;

Screen.total = 0;

Screen.instances = [];

Screen.bind = function (screen) {
  if (!Screen.global) {
    Screen.global = screen;
  }

  if (!~Screen.instances.indexOf(screen)) {
    Screen.instances.push(screen);
    screen.index = Screen.total;
    Screen.total++;
  }

  if (Screen._bound) return;
  Screen._bound = true;

  process.on('uncaughtException', Screen._exceptionHandler = function (err) {
    if (process.listeners('uncaughtException').length > 1) {
      return;
    }
    Screen.instances.slice().forEach(function (screen) {
      screen.destroy();
    });
    err = err || new Error('Uncaught Exception.');
    console.error(err.stack ? err.stack + '' : err + '');
    nextTick(function () {
      process.exit(1);
    });
  });

  ['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(function (signal) {
    var name = '_' + signal.toLowerCase() + 'Handler';
    process.on(signal, Screen[name] = function () {
      if (process.listeners(signal).length > 1) {
        return;
      }
      nextTick(function () {
        process.exit(0);
      });
    });
  });

  process.on('exit', Screen._exitHandler = function () {
    Screen.instances.slice().forEach(function (screen) {
      screen.destroy();
    });
  });
};

Screen.prototype.__proto__ = Node.prototype;

Screen.prototype.type = 'screen';

Screen.prototype.__defineGetter__('title', function () {
  return this.program.title;
});

Screen.prototype.__defineSetter__('title', function (title) {
  return this.program.title = title;
});

Screen.prototype.__defineGetter__('terminal', function () {
  return this.program.terminal;
});

Screen.prototype.__defineSetter__('terminal', function (terminal) {
  this.setTerminal(terminal);
  return this.program.terminal;
});

Screen.prototype.setTerminal = function (terminal) {
  var entered = !!this.program.isAlt;
  if (entered) {
    this._buf = '';
    this.program._buf = '';
    this.leave();
  }
  this.program.setTerminal(terminal);
  this.tput = this.program.tput;
  if (entered) {
    this.enter();
  }
};

Screen.prototype.enter = function () {
  if (this.program.isAlt) return;
  if (!this.cursor._set) {
    if (this.options.cursor.shape) {
      this.cursorShape(this.cursor.shape, this.cursor.blink);
    }
    if (this.options.cursor.color) {
      this.cursorColor(this.cursor.color);
    }
  }
  if (process.platform === 'win32') {
    try {
      cp.execSync('cls', { stdio: 'ignore', timeout: 1000 });
    } catch (e) {
      ;
    }
  }
  this.program.alternateBuffer();
  this.program.put.keypad_xmit();
  this.program.csr(0, this.height - 1);
  this.program.hideCursor();
  this.program.cup(0, 0);
  // We need this for tmux now:
  if (this.tput.strings.ena_acs) {
    this.program._write(this.tput.enacs());
  }
  this.alloc();
};

Screen.prototype.leave = function () {
  if (!this.program.isAlt) return;
  this.program.put.keypad_local();
  if (this.program.scrollTop !== 0 || this.program.scrollBottom !== this.rows - 1) {
    this.program.csr(0, this.height - 1);
  }
  // XXX For some reason if alloc/clear() is before this
  // line, it doesn't work on linux console.
  this.program.showCursor();
  this.alloc();
  if (this._listenedMouse) {
    this.program.disableMouse();
  }
  this.program.normalBuffer();
  if (this.cursor._set) this.cursorReset();
  this.program.flush();
  if (process.platform === 'win32') {
    try {
      cp.execSync('cls', { stdio: 'ignore', timeout: 1000 });
    } catch (e) {
      ;
    }
  }
};

Screen.prototype.postEnter = function () {
  var self = this;
  if (this.options.debug) {
    this.debugLog = new Log({
      screen: this,
      parent: this,
      hidden: true,
      draggable: true,
      left: 'center',
      top: 'center',
      width: '30%',
      height: '30%',
      border: 'line',
      label: ' {bold}Debug Log{/bold} ',
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          inverse: true
        }
      }
    });

    this.debugLog.toggle = function () {
      if (self.debugLog.hidden) {
        self.saveFocus();
        self.debugLog.show();
        self.debugLog.setFront();
        self.debugLog.focus();
      } else {
        self.debugLog.hide();
        self.restoreFocus();
      }
      self.render();
    };

    this.debugLog.key(['q', 'escape'], self.debugLog.toggle);
    this.key('f12', self.debugLog.toggle);
  }

  if (this.options.warnings) {
    this.on('warning', function (text) {
      var warning = new Box({
        screen: self,
        parent: self,
        left: 'center',
        top: 'center',
        width: 'shrink',
        padding: 1,
        height: 'shrink',
        align: 'center',
        valign: 'middle',
        border: 'line',
        label: ' {red-fg}{bold}WARNING{/} ',
        content: '{bold}' + text + '{/bold}',
        tags: true
      });
      self.render();
      var timeout = setTimeout(function () {
        warning.destroy();
        self.render();
      }, 1500);
      if (timeout.unref) {
        timeout.unref();
      }
    });
  }
};

Screen.prototype._destroy = Screen.prototype.destroy;
Screen.prototype.destroy = function () {
  this.leave();

  var index = Screen.instances.indexOf(this);
  if (~index) {
    Screen.instances.splice(index, 1);
    Screen.total--;

    Screen.global = Screen.instances[0];

    if (Screen.total === 0) {
      Screen.global = null;

      process.removeListener('uncaughtException', Screen._exceptionHandler);
      process.removeListener('SIGTERM', Screen._sigtermHandler);
      process.removeListener('SIGINT', Screen._sigintHandler);
      process.removeListener('SIGQUIT', Screen._sigquitHandler);
      process.removeListener('exit', Screen._exitHandler);
      delete Screen._exceptionHandler;
      delete Screen._sigtermHandler;
      delete Screen._sigintHandler;
      delete Screen._sigquitHandler;
      delete Screen._exitHandler;

      delete Screen._bound;
    }

    this.destroyed = true;
    this.emit('destroy');
    this._destroy();
  }

  this.program.destroy();
};

Screen.prototype.log = function () {
  return this.program.log.apply(this.program, arguments);
};

Screen.prototype.debug = function () {
  if (this.debugLog) {
    this.debugLog.log.apply(this.debugLog, arguments);
  }
  return this.program.debug.apply(this.program, arguments);
};

Screen.prototype._listenMouse = function (el) {
  var self = this;

  if (el && !~this.clickable.indexOf(el)) {
    el.clickable = true;
    this.clickable.push(el);
  }

  if (this._listenedMouse) return;
  this._listenedMouse = true;

  this.program.enableMouse();
  if (this.options.sendFocus) {
    this.program.setMouse({ sendFocus: true }, true);
  }

  this.on('render', function () {
    self._needsClickableSort = true;
  });

  this.program.on('mouse', function (data) {
    if (self.lockKeys) return;

    if (self._needsClickableSort) {
      self.clickable = helpers.hsort(self.clickable);
      self._needsClickableSort = false;
    }

    var i = 0,
        el,
        set,
        pos;

    for (; i < self.clickable.length; i++) {
      el = self.clickable[i];

      if (el.detached || !el.visible) {
        continue;
      }

      // if (self.grabMouse && self.focused !== el
      //     && !el.hasAncestor(self.focused)) continue;

      pos = el.lpos;
      if (!pos) continue;

      if (data.x >= pos.xi && data.x < pos.xl && data.y >= pos.yi && data.y < pos.yl) {
        el.emit('mouse', data);
        if (data.action === 'mousedown') {
          self.mouseDown = el;
        } else if (data.action === 'mouseup') {
          (self.mouseDown || el).emit('click', data);
          self.mouseDown = null;
        } else if (data.action === 'mousemove') {
          if (self.hover && el.index > self.hover.index) {
            set = false;
          }
          if (self.hover !== el && !set) {
            if (self.hover) {
              self.hover.emit('mouseout', data);
            }
            el.emit('mouseover', data);
            self.hover = el;
          }
          set = true;
        }
        el.emit(data.action, data);
        break;
      }
    }

    // Just mouseover?
    if ((data.action === 'mousemove' || data.action === 'mousedown' || data.action === 'mouseup') && self.hover && !set) {
      self.hover.emit('mouseout', data);
      self.hover = null;
    }

    self.emit('mouse', data);
    self.emit(data.action, data);
  });

  // Autofocus highest element.
  // this.on('element click', function(el, data) {
  //   var target;
  //   do {
  //     if (el.clickable === true && el.options.autoFocus !== false) {
  //       target = el;
  //     }
  //   } while (el = el.parent);
  //   if (target) target.focus();
  // });

  // Autofocus elements with the appropriate option.
  this.on('element click', function (el) {
    if (el.clickable === true && el.options.autoFocus !== false) {
      el.focus();
    }
  });
};

Screen.prototype.enableMouse = function (el) {
  this._listenMouse(el);
};

Screen.prototype._listenKeys = function (el) {
  var self = this;

  if (el && !~this.keyable.indexOf(el)) {
    el.keyable = true;
    this.keyable.push(el);
  }

  if (this._listenedKeys) return;
  this._listenedKeys = true;

  // NOTE: The event emissions used to be reversed:
  // element + screen
  // They are now:
  // screen + element
  // After the first keypress emitted, the handler
  // checks to make sure grabKeys, lockKeys, and focused
  // weren't changed, and handles those situations appropriately.
  this.program.on('keypress', function (ch, key) {
    if (self.lockKeys && !~self.ignoreLocked.indexOf(key.full)) {
      return;
    }

    var focused = self.focused,
        grabKeys = self.grabKeys;

    if (!grabKeys || ~self.ignoreLocked.indexOf(key.full)) {
      self.emit('keypress', ch, key);
      self.emit('key ' + key.full, ch, key);
    }

    // If something changed from the screen key handler, stop.
    if (self.grabKeys !== grabKeys || self.lockKeys) {
      return;
    }

    if (focused && focused.keyable) {
      focused.emit('keypress', ch, key);
      focused.emit('key ' + key.full, ch, key);
    }
  });
};

Screen.prototype.enableKeys = function (el) {
  this._listenKeys(el);
};

Screen.prototype.enableInput = function (el) {
  this._listenMouse(el);
  this._listenKeys(el);
};

Screen.prototype._initHover = function () {
  var self = this;

  if (this._hoverText) {
    return;
  }

  this._hoverText = new Box({
    screen: this,
    left: 0,
    top: 0,
    tags: false,
    height: 'shrink',
    width: 'shrink',
    border: 'line',
    style: {
      border: {
        fg: 'default'
      },
      bg: 'default',
      fg: 'default'
    }
  });

  this.on('mousemove', function (data) {
    if (self._hoverText.detached) return;
    self._hoverText.rleft = data.x + 1;
    self._hoverText.rtop = data.y;
    self.render();
  });

  this.on('element mouseover', function (el, data) {
    if (!el._hoverOptions) return;
    self._hoverText.parseTags = el.parseTags;
    self._hoverText.setContent(el._hoverOptions.text);
    self.append(self._hoverText);
    self._hoverText.rleft = data.x + 1;
    self._hoverText.rtop = data.y;
    self.render();
  });

  this.on('element mouseout', function () {
    if (self._hoverText.detached) return;
    self._hoverText.detach();
    self.render();
  });

  // XXX This can cause problems if the
  // terminal does not support allMotion.
  // Workaround: check to see if content is set.
  this.on('element mouseup', function (el) {
    if (!self._hoverText.getContent()) return;
    if (!el._hoverOptions) return;
    self.append(self._hoverText);
    self.render();
  });
};

Screen.prototype.__defineGetter__('cols', function () {
  return this.program.cols;
});

Screen.prototype.__defineGetter__('rows', function () {
  return this.program.rows;
});

Screen.prototype.__defineGetter__('width', function () {
  return this.program.cols;
});

Screen.prototype.__defineGetter__('height', function () {
  return this.program.rows;
});

Screen.prototype.alloc = function (dirty) {
  var x, y;

  this.lines = [];
  for (y = 0; y < this.rows; y++) {
    this.lines[y] = [];
    for (x = 0; x < this.cols; x++) {
      this.lines[y][x] = [this.dattr, ' '];
    }
    this.lines[y].dirty = !!dirty;
  }

  this.olines = [];
  for (y = 0; y < this.rows; y++) {
    this.olines[y] = [];
    for (x = 0; x < this.cols; x++) {
      this.olines[y][x] = [this.dattr, ' '];
    }
  }

  this.program.clear();
};

Screen.prototype.realloc = function () {
  return this.alloc(true);
};

Screen.prototype.render = function () {
  var self = this;

  if (this.destroyed) return;

  this.emit('prerender');

  this._borderStops = {};

  // TODO: Possibly get rid of .dirty altogether.
  // TODO: Could possibly drop .dirty and just clear the `lines` buffer every
  // time before a screen.render. This way clearRegion doesn't have to be
  // called in arbitrary places for the sake of clearing a spot where an
  // element used to be (e.g. when an element moves or is hidden). There could
  // be some overhead though.
  // this.screen.clearRegion(0, this.cols, 0, this.rows);
  this._ci = 0;
  this.children.forEach(function (el) {
    el.index = self._ci++;
    //el._rendering = true;
    el.render();
    //el._rendering = false;
  });
  this._ci = -1;

  if (this.screen.dockBorders) {
    this._dockBorders();
  }

  this.draw(0, this.lines.length - 1);

  // XXX Workaround to deal with cursor pos before the screen has rendered and
  // lpos is not reliable (stale).
  if (this.focused && this.focused._updateCursor) {
    this.focused._updateCursor(true);
  }

  this.renders++;

  this.emit('render');
};

Screen.prototype.blankLine = function (ch, dirty) {
  var out = [];
  for (var x = 0; x < this.cols; x++) {
    out[x] = [this.dattr, ch || ' '];
  }
  out.dirty = dirty;
  return out;
};

Screen.prototype.insertLine = function (n, y, top, bottom) {
  // if (y === top) return this.insertLineNC(n, y, top, bottom);

  if (!this.tput.strings.change_scroll_region || !this.tput.strings.delete_line || !this.tput.strings.insert_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(y, 0);
  this._buf += this.tput.il(n);
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(y, 0, this.blankLine());
    this.lines.splice(j, 1);
    this.olines.splice(y, 0, this.blankLine());
    this.olines.splice(j, 1);
  }
};

Screen.prototype.deleteLine = function (n, y, top, bottom) {
  // if (y === top) return this.deleteLineNC(n, y, top, bottom);

  if (!this.tput.strings.change_scroll_region || !this.tput.strings.delete_line || !this.tput.strings.insert_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(y, 0);
  this._buf += this.tput.dl(n);
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(j, 0, this.blankLine());
    this.lines.splice(y, 1);
    this.olines.splice(j, 0, this.blankLine());
    this.olines.splice(y, 1);
  }
};

// This is how ncurses does it.
// Scroll down (up cursor-wise).
// This will only work for top line deletion as opposed to arbitrary lines.
Screen.prototype.insertLineNC = function (n, y, top, bottom) {
  if (!this.tput.strings.change_scroll_region || !this.tput.strings.delete_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(top, 0);
  this._buf += this.tput.dl(n);
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(j, 0, this.blankLine());
    this.lines.splice(y, 1);
    this.olines.splice(j, 0, this.blankLine());
    this.olines.splice(y, 1);
  }
};

// This is how ncurses does it.
// Scroll up (down cursor-wise).
// This will only work for bottom line deletion as opposed to arbitrary lines.
Screen.prototype.deleteLineNC = function (n, y, top, bottom) {
  if (!this.tput.strings.change_scroll_region || !this.tput.strings.delete_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(bottom, 0);
  this._buf += Array(n + 1).join('\n');
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(j, 0, this.blankLine());
    this.lines.splice(y, 1);
    this.olines.splice(j, 0, this.blankLine());
    this.olines.splice(y, 1);
  }
};

Screen.prototype.insertBottom = function (top, bottom) {
  return this.deleteLine(1, top, top, bottom);
};

Screen.prototype.insertTop = function (top, bottom) {
  return this.insertLine(1, top, top, bottom);
};

Screen.prototype.deleteBottom = function (top, bottom) {
  return this.clearRegion(0, this.width, bottom, bottom);
};

Screen.prototype.deleteTop = function (top, bottom) {
  // Same as: return this.insertBottom(top, bottom);
  return this.deleteLine(1, top, top, bottom);
};

// Parse the sides of an element to determine
// whether an element has uniform cells on
// both sides. If it does, we can use CSR to
// optimize scrolling on a scrollable element.
// Not exactly sure how worthwile this is.
// This will cause a performance/cpu-usage hit,
// but will it be less or greater than the
// performance hit of slow-rendering scrollable
// boxes with clean sides?
Screen.prototype.cleanSides = function (el) {
  var pos = el.lpos;

  if (!pos) {
    return false;
  }

  if (pos._cleanSides != null) {
    return pos._cleanSides;
  }

  if (pos.xi <= 0 && pos.xl >= this.width) {
    return pos._cleanSides = true;
  }

  if (this.options.fastCSR) {
    // Maybe just do this instead of parsing.
    if (pos.yi < 0) return pos._cleanSides = false;
    if (pos.yl > this.height) return pos._cleanSides = false;
    if (this.width - (pos.xl - pos.xi) < 40) {
      return pos._cleanSides = true;
    }
    return pos._cleanSides = false;
  }

  if (!this.options.smartCSR) {
    return false;
  }

  // The scrollbar can't update properly, and there's also a
  // chance that the scrollbar may get moved around senselessly.
  // NOTE: In pratice, this doesn't seem to be the case.
  // if (this.scrollbar) {
  //   return pos._cleanSides = false;
  // }

  // Doesn't matter if we're only a height of 1.
  // if ((pos.yl - el.ibottom) - (pos.yi + el.itop) <= 1) {
  //   return pos._cleanSides = false;
  // }

  var yi = pos.yi + el.itop,
      yl = pos.yl - el.ibottom,
      first,
      ch,
      x,
      y;

  if (pos.yi < 0) return pos._cleanSides = false;
  if (pos.yl > this.height) return pos._cleanSides = false;
  if (pos.xi - 1 < 0) return pos._cleanSides = true;
  if (pos.xl > this.width) return pos._cleanSides = true;

  for (x = pos.xi - 1; x >= 0; x--) {
    if (!this.olines[yi]) break;
    first = this.olines[yi][x];
    for (y = yi; y < yl; y++) {
      if (!this.olines[y] || !this.olines[y][x]) break;
      ch = this.olines[y][x];
      if (ch[0] !== first[0] || ch[1] !== first[1]) {
        return pos._cleanSides = false;
      }
    }
  }

  for (x = pos.xl; x < this.width; x++) {
    if (!this.olines[yi]) break;
    first = this.olines[yi][x];
    for (y = yi; y < yl; y++) {
      if (!this.olines[y] || !this.olines[y][x]) break;
      ch = this.olines[y][x];
      if (ch[0] !== first[0] || ch[1] !== first[1]) {
        return pos._cleanSides = false;
      }
    }
  }

  return pos._cleanSides = true;
};

Screen.prototype._dockBorders = function () {
  var lines = this.lines,
      stops = this._borderStops,
      i,
      y,
      x,
      ch;

  // var keys, stop;
  //
  // keys = Object.keys(this._borderStops)
  //   .map(function(k) { return +k; })
  //   .sort(function(a, b) { return a - b; });
  //
  // for (i = 0; i < keys.length; i++) {
  //   y = keys[i];
  //   if (!lines[y]) continue;
  //   stop = this._borderStops[y];
  //   for (x = stop.xi; x < stop.xl; x++) {

  stops = Object.keys(stops).map(function (k) {
    return +k;
  }).sort(function (a, b) {
    return a - b;
  });

  for (i = 0; i < stops.length; i++) {
    y = stops[i];
    if (!lines[y]) continue;
    for (x = 0; x < this.width; x++) {
      ch = lines[y][x][1];
      if (angles[ch]) {
        lines[y][x][1] = this._getAngle(lines, x, y);
        lines[y].dirty = true;
      }
    }
  }
};

Screen.prototype._getAngle = function (lines, x, y) {
  var angle = 0,
      attr = lines[y][x][0],
      ch = lines[y][x][1];

  if (lines[y][x - 1] && langles[lines[y][x - 1][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y][x - 1][0] !== attr) return ch;
    }
    angle |= 1 << 3;
  }

  if (lines[y - 1] && uangles[lines[y - 1][x][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y - 1][x][0] !== attr) return ch;
    }
    angle |= 1 << 2;
  }

  if (lines[y][x + 1] && rangles[lines[y][x + 1][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y][x + 1][0] !== attr) return ch;
    }
    angle |= 1 << 1;
  }

  if (lines[y + 1] && dangles[lines[y + 1][x][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y + 1][x][0] !== attr) return ch;
    }
    angle |= 1 << 0;
  }

  // Experimental: fixes this situation:
  // +----------+
  //            | <-- empty space here, should be a T angle
  // +-------+  |
  // |       |  |
  // +-------+  |
  // |          |
  // +----------+
  // if (uangles[lines[y][x][1]]) {
  //   if (lines[y + 1] && cdangles[lines[y + 1][x][1]]) {
  //     if (!this.options.ignoreDockContrast) {
  //       if (lines[y + 1][x][0] !== attr) return ch;
  //     }
  //     angle |= 1 << 0;
  //   }
  // }

  return angleTable[angle] || ch;
};

Screen.prototype.draw = function (start, end) {
  // this.emit('predraw');

  var x, y, line, out, ch, data, attr, fg, bg, flags;

  var main = '',
      pre,
      post;

  var clr, neq, xx;

  var lx = -1,
      ly = -1,
      o;

  var acs;

  if (this._buf) {
    main += this._buf;
    this._buf = '';
  }

  for (y = start; y <= end; y++) {
    line = this.lines[y];
    o = this.olines[y];

    if (!line.dirty && !(this.cursor.artificial && y === this.program.y)) {
      continue;
    }
    line.dirty = false;

    out = '';
    attr = this.dattr;

    for (x = 0; x < line.length; x++) {
      data = line[x][0];
      ch = line[x][1];

      // Render the artificial cursor.
      if (this.cursor.artificial && !this.cursor._hidden && this.cursor._state && x === this.program.x && y === this.program.y) {
        var cattr = this._cursorAttr(this.cursor, data);
        if (cattr.ch) ch = cattr.ch;
        data = cattr.attr;
      }

      // Take advantage of xterm's back_color_erase feature by using a
      // lookahead. Stop spitting out so many damn spaces. NOTE: Is checking
      // the bg for non BCE terminals worth the overhead?
      if (this.options.useBCE && ch === ' ' && (this.tput.bools.back_color_erase || (data & 0x1ff) === (this.dattr & 0x1ff)) && (data >> 18 & 8) === (this.dattr >> 18 & 8)) {
        clr = true;
        neq = false;

        for (xx = x; xx < line.length; xx++) {
          if (line[xx][0] !== data || line[xx][1] !== ' ') {
            clr = false;
            break;
          }
          if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
            neq = true;
          }
        }

        if (clr && neq) {
          lx = -1, ly = -1;
          if (data !== attr) {
            out += this.codeAttr(data);
            attr = data;
          }
          out += this.tput.cup(y, x);
          out += this.tput.el();
          for (xx = x; xx < line.length; xx++) {
            o[xx][0] = data;
            o[xx][1] = ' ';
          }
          break;
        }

        // If there's more than 10 spaces, use EL regardless
        // and start over drawing the rest of line. Might
        // not be worth it. Try to use ECH if the terminal
        // supports it. Maybe only try to use ECH here.
        // //if (this.tput.strings.erase_chars)
        // if (!clr && neq && (xx - x) > 10) {
        //   lx = -1, ly = -1;
        //   if (data !== attr) {
        //     out += this.codeAttr(data);
        //     attr = data;
        //   }
        //   out += this.tput.cup(y, x);
        //   if (this.tput.strings.erase_chars) {
        //     // Use erase_chars to avoid erasing the whole line.
        //     out += this.tput.ech(xx - x);
        //   } else {
        //     out += this.tput.el();
        //   }
        //   if (this.tput.strings.parm_right_cursor) {
        //     out += this.tput.cuf(xx - x);
        //   } else {
        //     out += this.tput.cup(y, xx);
        //   }
        //   this.fillRegion(data, ' ',
        //     x, this.tput.strings.erase_chars ? xx : line.length,
        //     y, y + 1);
        //   x = xx - 1;
        //   continue;
        // }

        // Skip to the next line if the
        // rest of the line is already drawn.
        // if (!neq) {
        //   for (; xx < line.length; xx++) {
        //     if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
        //       neq = true;
        //       break;
        //     }
        //   }
        //   if (!neq) {
        //     attr = data;
        //     break;
        //   }
        // }
      }

      // Optimize by comparing the real output
      // buffer to the pending output buffer.
      if (data === o[x][0] && ch === o[x][1]) {
        if (lx === -1) {
          lx = x;
          ly = y;
        }
        continue;
      } else if (lx !== -1) {
        if (this.tput.strings.parm_right_cursor) {
          out += y === ly ? this.tput.cuf(x - lx) : this.tput.cup(y, x);
        } else {
          out += this.tput.cup(y, x);
        }
        lx = -1, ly = -1;
      }
      o[x][0] = data;
      o[x][1] = ch;

      if (data !== attr) {
        if (attr !== this.dattr) {
          out += '\x1b[m';
        }
        if (data !== this.dattr) {
          out += '\x1b[';

          bg = data & 0x1ff;
          fg = data >> 9 & 0x1ff;
          flags = data >> 18;

          // bold
          if (flags & 1) {
            out += '1;';
          }

          // underline
          if (flags & 2) {
            out += '4;';
          }

          // blink
          if (flags & 4) {
            out += '5;';
          }

          // inverse
          if (flags & 8) {
            out += '7;';
          }

          // invisible
          if (flags & 16) {
            out += '8;';
          }

          if (bg !== 0x1ff) {
            bg = this._reduceColor(bg);
            if (bg < 16) {
              if (bg < 8) {
                bg += 40;
              } else if (bg < 16) {
                bg -= 8;
                bg += 100;
              }
              out += bg + ';';
            } else {
              out += '48;5;' + bg + ';';
            }
          }

          if (fg !== 0x1ff) {
            fg = this._reduceColor(fg);
            if (fg < 16) {
              if (fg < 8) {
                fg += 30;
              } else if (fg < 16) {
                fg -= 8;
                fg += 90;
              }
              out += fg + ';';
            } else {
              out += '38;5;' + fg + ';';
            }
          }

          if (out[out.length - 1] === ';') out = out.slice(0, -1);

          out += 'm';
        }
      }

      // If we find a double-width char, eat the next character which should be
      // a space due to parseContent's behavior.
      if (this.fullUnicode) {
        // If this is a surrogate pair double-width char, we can ignore it
        // because parseContent already counted it as length=2.
        if (unicode.charWidth(line[x][1]) === 2) {
          // NOTE: At cols=44, the bug that is avoided
          // by the angles check occurs in widget-unicode:
          // Might also need: `line[x + 1][0] !== line[x][0]`
          // for borderless boxes?
          if (x === line.length - 1 || angles[line[x + 1][1]]) {
            // If we're at the end, we don't have enough space for a
            // double-width. Overwrite it with a space and ignore.
            ch = ' ';
            o[x][1] = '\0';
          } else {
            // ALWAYS refresh double-width chars because this special cursor
            // behavior is needed. There may be a more efficient way of doing
            // this. See above.
            o[x][1] = '\0';
            // Eat the next character by moving forward and marking as a
            // space (which it is).
            o[++x][1] = '\0';
          }
        }
      }

      // Attempt to use ACS for supported characters.
      // This is not ideal, but it's how ncurses works.
      // There are a lot of terminals that support ACS
      // *and UTF8, but do not declare U8. So ACS ends
      // up being used (slower than utf8). Terminals
      // that do not support ACS and do not explicitly
      // support UTF8 get their unicode characters
      // replaced with really ugly ascii characters.
      // It is possible there is a terminal out there
      // somewhere that does not support ACS, but
      // supports UTF8, but I imagine it's unlikely.
      // Maybe remove !this.tput.unicode check, however,
      // this seems to be the way ncurses does it.
      if (this.tput.strings.enter_alt_charset_mode && !this.tput.brokenACS && (this.tput.acscr[ch] || acs)) {
        // Fun fact: even if this.tput.brokenACS wasn't checked here,
        // the linux console would still work fine because the acs
        // table would fail the check of: this.tput.acscr[ch]
        if (this.tput.acscr[ch]) {
          if (acs) {
            ch = this.tput.acscr[ch];
          } else {
            ch = this.tput.smacs() + this.tput.acscr[ch];
            acs = true;
          }
        } else if (acs) {
          ch = this.tput.rmacs() + ch;
          acs = false;
        }
      } else {
        // U8 is not consistently correct. Some terminfo's
        // terminals that do not declare it may actually
        // support utf8 (e.g. urxvt), but if the terminal
        // does not declare support for ACS (and U8), chances
        // are it does not support UTF8. This is probably
        // the "safest" way to do this. Should fix things
        // like sun-color.
        // NOTE: It could be the case that the $LANG
        // is all that matters in some cases:
        // if (!this.tput.unicode && ch > '~') {
        if (!this.tput.unicode && this.tput.numbers.U8 !== 1 && ch > '~') {
          ch = this.tput.utoa[ch] || '?';
        }
      }

      out += ch;
      attr = data;
    }

    if (attr !== this.dattr) {
      out += '\x1b[m';
    }

    if (out) {
      main += this.tput.cup(y, 0) + out;
    }
  }

  if (acs) {
    main += this.tput.rmacs();
    acs = false;
  }

  if (main) {
    pre = '';
    post = '';

    pre += this.tput.sc();
    post += this.tput.rc();

    if (!this.program.cursorHidden) {
      pre += this.tput.civis();
      post += this.tput.cnorm();
    }

    // this.program.flush();
    // this.program._owrite(pre + main + post);
    this.program._write(pre + main + post);
  }

  // this.emit('draw');
};

Screen.prototype._reduceColor = function (color) {
  return colors.reduce(color, this.tput.colors);
};

// Convert an SGR string to our own attribute format.
Screen.prototype.attrCode = function (code, cur, def) {
  var flags = cur >> 18 & 0x1ff,
      fg = cur >> 9 & 0x1ff,
      bg = cur & 0x1ff,
      c,
      i;

  code = code.slice(2, -1).split(';');
  if (!code[0]) code[0] = '0';

  for (i = 0; i < code.length; i++) {
    c = +code[i] || 0;
    switch (c) {
      case 0:
        // normal
        bg = def & 0x1ff;
        fg = def >> 9 & 0x1ff;
        flags = def >> 18 & 0x1ff;
        break;
      case 1:
        // bold
        flags |= 1;
        break;
      case 22:
        flags = def >> 18 & 0x1ff;
        break;
      case 4:
        // underline
        flags |= 2;
        break;
      case 24:
        flags = def >> 18 & 0x1ff;
        break;
      case 5:
        // blink
        flags |= 4;
        break;
      case 25:
        flags = def >> 18 & 0x1ff;
        break;
      case 7:
        // inverse
        flags |= 8;
        break;
      case 27:
        flags = def >> 18 & 0x1ff;
        break;
      case 8:
        // invisible
        flags |= 16;
        break;
      case 28:
        flags = def >> 18 & 0x1ff;
        break;
      case 39:
        // default fg
        fg = def >> 9 & 0x1ff;
        break;
      case 49:
        // default bg
        bg = def & 0x1ff;
        break;
      case 100:
        // default fg/bg
        fg = def >> 9 & 0x1ff;
        bg = def & 0x1ff;
        break;
      default:
        // color
        if (c === 48 && +code[i + 1] === 5) {
          i += 2;
          bg = +code[i];
          break;
        } else if (c === 48 && +code[i + 1] === 2) {
          i += 2;
          bg = colors.match(+code[i], +code[i + 1], +code[i + 2]);
          if (bg === -1) bg = def & 0x1ff;
          i += 2;
          break;
        } else if (c === 38 && +code[i + 1] === 5) {
          i += 2;
          fg = +code[i];
          break;
        } else if (c === 38 && +code[i + 1] === 2) {
          i += 2;
          fg = colors.match(+code[i], +code[i + 1], +code[i + 2]);
          if (fg === -1) fg = def >> 9 & 0x1ff;
          i += 2;
          break;
        }
        if (c >= 40 && c <= 47) {
          bg = c - 40;
        } else if (c >= 100 && c <= 107) {
          bg = c - 100;
          bg += 8;
        } else if (c === 49) {
          bg = def & 0x1ff;
        } else if (c >= 30 && c <= 37) {
          fg = c - 30;
        } else if (c >= 90 && c <= 97) {
          fg = c - 90;
          fg += 8;
        } else if (c === 39) {
          fg = def >> 9 & 0x1ff;
        } else if (c === 100) {
          fg = def >> 9 & 0x1ff;
          bg = def & 0x1ff;
        }
        break;
    }
  }

  return flags << 18 | fg << 9 | bg;
};

// Convert our own attribute format to an SGR string.
Screen.prototype.codeAttr = function (code) {
  var flags = code >> 18 & 0x1ff,
      fg = code >> 9 & 0x1ff,
      bg = code & 0x1ff,
      out = '';

  // bold
  if (flags & 1) {
    out += '1;';
  }

  // underline
  if (flags & 2) {
    out += '4;';
  }

  // blink
  if (flags & 4) {
    out += '5;';
  }

  // inverse
  if (flags & 8) {
    out += '7;';
  }

  // invisible
  if (flags & 16) {
    out += '8;';
  }

  if (bg !== 0x1ff) {
    bg = this._reduceColor(bg);
    if (bg < 16) {
      if (bg < 8) {
        bg += 40;
      } else if (bg < 16) {
        bg -= 8;
        bg += 100;
      }
      out += bg + ';';
    } else {
      out += '48;5;' + bg + ';';
    }
  }

  if (fg !== 0x1ff) {
    fg = this._reduceColor(fg);
    if (fg < 16) {
      if (fg < 8) {
        fg += 30;
      } else if (fg < 16) {
        fg -= 8;
        fg += 90;
      }
      out += fg + ';';
    } else {
      out += '38;5;' + fg + ';';
    }
  }

  if (out[out.length - 1] === ';') out = out.slice(0, -1);

  return '\x1b[' + out + 'm';
};

Screen.prototype.focusOffset = function (offset) {
  var shown = this.keyable.filter(function (el) {
    return !el.detached && el.visible;
  }).length;

  if (!shown || !offset) {
    return;
  }

  var i = this.keyable.indexOf(this.focused);
  if (!~i) return;

  if (offset > 0) {
    while (offset--) {
      if (++i > this.keyable.length - 1) i = 0;
      if (this.keyable[i].detached || !this.keyable[i].visible) offset++;
    }
  } else {
    offset = -offset;
    while (offset--) {
      if (--i < 0) i = this.keyable.length - 1;
      if (this.keyable[i].detached || !this.keyable[i].visible) offset++;
    }
  }

  return this.keyable[i].focus();
};

Screen.prototype.focusPrev = Screen.prototype.focusPrevious = function () {
  return this.focusOffset(-1);
};

Screen.prototype.focusNext = function () {
  return this.focusOffset(1);
};

Screen.prototype.focusPush = function (el) {
  if (!el) return;
  var old = this.history[this.history.length - 1];
  if (this.history.length === 10) {
    this.history.shift();
  }
  this.history.push(el);
  this._focus(el, old);
};

Screen.prototype.focusPop = function () {
  var old = this.history.pop();
  if (this.history.length) {
    this._focus(this.history[this.history.length - 1], old);
  }
  return old;
};

Screen.prototype.saveFocus = function () {
  return this._savedFocus = this.focused;
};

Screen.prototype.restoreFocus = function () {
  if (!this._savedFocus) return;
  this._savedFocus.focus();
  delete this._savedFocus;
  return this.focused;
};

Screen.prototype.rewindFocus = function () {
  var old = this.history.pop(),
      el;

  while (this.history.length) {
    el = this.history.pop();
    if (!el.detached && el.visible) {
      this.history.push(el);
      this._focus(el, old);
      return el;
    }
  }

  if (old) {
    old.emit('blur');
  }
};

Screen.prototype._focus = function (self, old) {
  // Find a scrollable ancestor if we have one.
  var el = self;
  while (el = el.parent) {
    if (el.scrollable) break;
  }

  // If we're in a scrollable element,
  // automatically scroll to the focused element.
  if (el && !el.detached) {
    // NOTE: This is different from the other "visible" values - it needs the
    // visible height of the scrolling element itself, not the element within
    // it.
    var visible = self.screen.height - el.atop - el.itop - el.abottom - el.ibottom;
    if (self.rtop < el.childBase) {
      el.scrollTo(self.rtop);
      self.screen.render();
    } else if (self.rtop + self.height - self.ibottom > el.childBase + visible) {
      // Explanation for el.itop here: takes into account scrollable elements
      // with borders otherwise the element gets covered by the bottom border:
      el.scrollTo(self.rtop - (el.height - self.height) + el.itop, true);
      self.screen.render();
    }
  }

  if (old) {
    old.emit('blur', self);
  }

  self.emit('focus', old);
};

Screen.prototype.__defineGetter__('focused', function () {
  return this.history[this.history.length - 1];
});

Screen.prototype.__defineSetter__('focused', function (el) {
  return this.focusPush(el);
});

Screen.prototype.clearRegion = function (xi, xl, yi, yl, override) {
  return this.fillRegion(this.dattr, ' ', xi, xl, yi, yl, override);
};

Screen.prototype.fillRegion = function (attr, ch, xi, xl, yi, yl, override) {
  var lines = this.lines,
      cell,
      xx;

  if (xi < 0) xi = 0;
  if (yi < 0) yi = 0;

  for (; yi < yl; yi++) {
    if (!lines[yi]) break;
    for (xx = xi; xx < xl; xx++) {
      cell = lines[yi][xx];
      if (!cell) break;
      if (override || attr !== cell[0] || ch !== cell[1]) {
        lines[yi][xx][0] = attr;
        lines[yi][xx][1] = ch;
        lines[yi].dirty = true;
      }
    }
  }
};

Screen.prototype.key = function () {
  return this.program.key.apply(this, arguments);
};

Screen.prototype.onceKey = function () {
  return this.program.onceKey.apply(this, arguments);
};

Screen.prototype.unkey = Screen.prototype.removeKey = function () {
  return this.program.unkey.apply(this, arguments);
};

Screen.prototype.spawn = function (file, args, options) {
  if (!Array.isArray(args)) {
    options = args;
    args = [];
  }

  var screen = this,
      program = screen.program,
      spawn = __webpack_require__(8).spawn,
      mouse = program.mouseEnabled,
      ps;

  options = options || {};

  options.stdio = options.stdio || 'inherit';

  program.lsaveCursor('spawn');
  // program.csr(0, program.rows - 1);
  program.normalBuffer();
  program.showCursor();
  if (mouse) program.disableMouse();

  var write = program.output.write;
  program.output.write = function () {};
  program.input.pause();
  if (program.input.setRawMode) {
    program.input.setRawMode(false);
  }

  var resume = function resume() {
    if (resume.done) return;
    resume.done = true;

    if (program.input.setRawMode) {
      program.input.setRawMode(true);
    }
    program.input.resume();
    program.output.write = write;

    program.alternateBuffer();
    // program.csr(0, program.rows - 1);
    if (mouse) {
      program.enableMouse();
      if (screen.options.sendFocus) {
        screen.program.setMouse({ sendFocus: true }, true);
      }
    }

    screen.alloc();
    screen.render();

    screen.program.lrestoreCursor('spawn', true);
  };

  ps = spawn(file, args, options);

  ps.on('error', resume);

  ps.on('exit', resume);

  return ps;
};

Screen.prototype.exec = function (file, args, options, callback) {
  var ps = this.spawn(file, args, options);

  ps.on('error', function (err) {
    if (!callback) return;
    return callback(err, false);
  });

  ps.on('exit', function (code) {
    if (!callback) return;
    return callback(null, code === 0);
  });

  return ps;
};

Screen.prototype.readEditor = function (options, callback) {
  if (typeof options === 'string') {
    options = { editor: options };
  }

  if (!callback) {
    callback = options;
    options = null;
  }

  if (!callback) {
    callback = function callback() {};
  }

  options = options || {};

  var self = this,
      editor = options.editor || process.env.EDITOR || 'vi',
      name = options.name || process.title || 'blessed',
      rnd = Math.random().toString(36).split('.').pop(),
      file = '/tmp/' + name + '.' + rnd,
      args = [file],
      opt;

  opt = {
    stdio: 'inherit',
    env: process.env,
    cwd: process.env.HOME
  };

  function writeFile(callback) {
    if (!options.value) return callback();
    return fs.writeFile(file, options.value, callback);
  }

  return writeFile(function (err) {
    if (err) return callback(err);
    return self.exec(editor, args, opt, function (err, success) {
      if (err) return callback(err);
      return fs.readFile(file, 'utf8', function (err, data) {
        return fs.unlink(file, function () {
          if (!success) return callback(new Error('Unsuccessful.'));
          if (err) return callback(err);
          return callback(null, data);
        });
      });
    });
  });
};

Screen.prototype.displayImage = function (file, callback) {
  if (!file) {
    if (!callback) return;
    return callback(new Error('No image.'));
  }

  file = path.resolve(process.cwd(), file);

  if (!~file.indexOf('://')) {
    file = 'file://' + file;
  }

  var args = ['w3m', '-T', 'text/html'];

  var input = '<title>press q to exit</title>' + '<img align="center" src="' + file + '">';

  var opt = {
    stdio: ['pipe', 1, 2],
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(args[0], args.slice(1), opt);

  ps.on('error', function (err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function (code) {
    if (!callback) return;
    if (code !== 0) return callback(new Error('Exit Code: ' + code));
    return callback(null, code === 0);
  });

  ps.stdin.write(input + '\n');
  ps.stdin.end();
};

Screen.prototype.setEffects = function (el, fel, over, out, effects, temp) {
  if (!effects) return;

  var tmp = {};
  if (temp) el[temp] = tmp;

  if (typeof el !== 'function') {
    var _el = el;
    el = function el() {
      return _el;
    };
  }

  fel.on(over, function () {
    var element = el();
    Object.keys(effects).forEach(function (key) {
      var val = effects[key];
      if (val !== null && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        tmp[key] = tmp[key] || {};
        // element.style[key] = element.style[key] || {};
        Object.keys(val).forEach(function (k) {
          var v = val[k];
          tmp[key][k] = element.style[key][k];
          element.style[key][k] = v;
        });
        return;
      }
      tmp[key] = element.style[key];
      element.style[key] = val;
    });
    element.screen.render();
  });

  fel.on(out, function () {
    var element = el();
    Object.keys(effects).forEach(function (key) {
      var val = effects[key];
      if (val !== null && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        tmp[key] = tmp[key] || {};
        // element.style[key] = element.style[key] || {};
        Object.keys(val).forEach(function (k) {
          if (tmp[key].hasOwnProperty(k)) {
            element.style[key][k] = tmp[key][k];
          }
        });
        return;
      }
      if (tmp.hasOwnProperty(key)) {
        element.style[key] = tmp[key];
      }
    });
    element.screen.render();
  });
};

Screen.prototype.sigtstp = function (callback) {
  var self = this;
  this.program.sigtstp(function () {
    self.alloc();
    self.render();
    self.program.lrestoreCursor('pause', true);
    if (callback) callback();
  });
};

Screen.prototype.copyToClipboard = function (text) {
  return this.program.copyToClipboard(text);
};

Screen.prototype.cursorShape = function (shape, blink) {
  var self = this;

  this.cursor.shape = shape || 'block';
  this.cursor.blink = blink || false;
  this.cursor._set = true;

  if (this.cursor.artificial) {
    if (!this.program.hideCursor_old) {
      var hideCursor = this.program.hideCursor;
      this.program.hideCursor_old = this.program.hideCursor;
      this.program.hideCursor = function () {
        hideCursor.call(self.program);
        self.cursor._hidden = true;
        if (self.renders) self.render();
      };
    }
    if (!this.program.showCursor_old) {
      var showCursor = this.program.showCursor;
      this.program.showCursor_old = this.program.showCursor;
      this.program.showCursor = function () {
        self.cursor._hidden = false;
        if (self.program._exiting) showCursor.call(self.program);
        if (self.renders) self.render();
      };
    }
    if (!this._cursorBlink) {
      this._cursorBlink = setInterval(function () {
        if (!self.cursor.blink) return;
        self.cursor._state ^= 1;
        if (self.renders) self.render();
      }, 500);
      if (this._cursorBlink.unref) {
        this._cursorBlink.unref();
      }
    }
    return true;
  }

  return this.program.cursorShape(this.cursor.shape, this.cursor.blink);
};

Screen.prototype.cursorColor = function (color) {
  this.cursor.color = color != null ? colors.convert(color) : null;
  this.cursor._set = true;

  if (this.cursor.artificial) {
    return true;
  }

  return this.program.cursorColor(colors.ncolors[this.cursor.color]);
};

Screen.prototype.cursorReset = Screen.prototype.resetCursor = function () {
  this.cursor.shape = 'block';
  this.cursor.blink = false;
  this.cursor.color = null;
  this.cursor._set = false;

  if (this.cursor.artificial) {
    this.cursor.artificial = false;
    if (this.program.hideCursor_old) {
      this.program.hideCursor = this.program.hideCursor_old;
      delete this.program.hideCursor_old;
    }
    if (this.program.showCursor_old) {
      this.program.showCursor = this.program.showCursor_old;
      delete this.program.showCursor_old;
    }
    if (this._cursorBlink) {
      clearInterval(this._cursorBlink);
      delete this._cursorBlink;
    }
    return true;
  }

  return this.program.cursorReset();
};

Screen.prototype._cursorAttr = function (cursor, dattr) {
  var attr = dattr || this.dattr,
      cattr,
      ch;

  if (cursor.shape === 'line') {
    attr &= ~(0x1ff << 9);
    attr |= 7 << 9;
    ch = '\u2502';
  } else if (cursor.shape === 'underline') {
    attr &= ~(0x1ff << 9);
    attr |= 7 << 9;
    attr |= 2 << 18;
  } else if (cursor.shape === 'block') {
    attr &= ~(0x1ff << 9);
    attr |= 7 << 9;
    attr |= 8 << 18;
  } else if (_typeof(cursor.shape) === 'object' && cursor.shape) {
    cattr = Element.prototype.sattr.call(cursor, cursor.shape);

    if (cursor.shape.bold || cursor.shape.underline || cursor.shape.blink || cursor.shape.inverse || cursor.shape.invisible) {
      attr &= ~(0x1ff << 18);
      attr |= (cattr >> 18 & 0x1ff) << 18;
    }

    if (cursor.shape.fg) {
      attr &= ~(0x1ff << 9);
      attr |= (cattr >> 9 & 0x1ff) << 9;
    }

    if (cursor.shape.bg) {
      attr &= ~(0x1ff << 0);
      attr |= cattr & 0x1ff;
    }

    if (cursor.shape.ch) {
      ch = cursor.shape.ch;
    }
  }

  if (cursor.color != null) {
    attr &= ~(0x1ff << 9);
    attr |= cursor.color << 9;
  }

  return {
    ch: ch,
    attr: attr
  };
};

Screen.prototype.screenshot = function (xi, xl, yi, yl, term) {
  if (xi == null) xi = 0;
  if (xl == null) xl = this.cols;
  if (yi == null) yi = 0;
  if (yl == null) yl = this.rows;

  if (xi < 0) xi = 0;
  if (yi < 0) yi = 0;

  var x, y, line, out, ch, data, attr;

  var sdattr = this.dattr;

  if (term) {
    this.dattr = term.defAttr;
  }

  var main = '';

  for (y = yi; y < yl; y++) {
    line = term ? term.lines[y] : this.lines[y];

    if (!line) break;

    out = '';
    attr = this.dattr;

    for (x = xi; x < xl; x++) {
      if (!line[x]) break;

      data = line[x][0];
      ch = line[x][1];

      if (data !== attr) {
        if (attr !== this.dattr) {
          out += '\x1b[m';
        }
        if (data !== this.dattr) {
          var _data = data;
          if (term) {
            if ((_data >> 9 & 0x1ff) === 257) _data |= 0x1ff << 9;
            if ((_data & 0x1ff) === 256) _data |= 0x1ff;
          }
          out += this.codeAttr(_data);
        }
      }

      if (this.fullUnicode) {
        if (unicode.charWidth(line[x][1]) === 2) {
          if (x === xl - 1) {
            ch = ' ';
          } else {
            x++;
          }
        }
      }

      out += ch;
      attr = data;
    }

    if (attr !== this.dattr) {
      out += '\x1b[m';
    }

    if (out) {
      main += (y > 0 ? '\n' : '') + out;
    }
  }

  main = main.replace(/(?:\s*\x1b\[40m\s*\x1b\[m\s*)*$/, '') + '\n';

  if (term) {
    this.dattr = sdattr;
  }

  return main;
};

/**
 * Positioning
 */

Screen.prototype._getPos = function () {
  return this;
};

/**
 * Angle Table
 */

var angles = {
  '\u2518': true, // '┘'
  '\u2510': true, // '┐'
  '\u250C': true, // '┌'
  '\u2514': true, // '└'
  '\u253C': true, // '┼'
  '\u251C': true, // '├'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u252C': true, // '┬'
  '\u2502': true, // '│'
  '\u2500': true // '─'
};

var langles = {
  '\u250C': true, // '┌'
  '\u2514': true, // '└'
  '\u253C': true, // '┼'
  '\u251C': true, // '├'
  '\u2534': true, // '┴'
  '\u252C': true, // '┬'
  '\u2500': true // '─'
};

var uangles = {
  '\u2510': true, // '┐'
  '\u250C': true, // '┌'
  '\u253C': true, // '┼'
  '\u251C': true, // '├'
  '\u2524': true, // '┤'
  '\u252C': true, // '┬'
  '\u2502': true // '│'
};

var rangles = {
  '\u2518': true, // '┘'
  '\u2510': true, // '┐'
  '\u253C': true, // '┼'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u252C': true, // '┬'
  '\u2500': true // '─'
};

var dangles = {
  '\u2518': true, // '┘'
  '\u2514': true, // '└'
  '\u253C': true, // '┼'
  '\u251C': true, // '├'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u2502': true // '│'
};

// var cdangles = {
//   '\u250c': true  // '┌'
// };

// Every ACS angle character can be
// represented by 4 bits ordered like this:
// [langle][uangle][rangle][dangle]
var angleTable = {
  '0000': '', // ?
  '0001': '\u2502', // '│' // ?
  '0010': '\u2500', // '─' // ??
  '0011': '\u250C', // '┌'
  '0100': '\u2502', // '│' // ?
  '0101': '\u2502', // '│'
  '0110': '\u2514', // '└'
  '0111': '\u251C', // '├'
  '1000': '\u2500', // '─' // ??
  '1001': '\u2510', // '┐'
  '1010': '\u2500', // '─' // ??
  '1011': '\u252C', // '┬'
  '1100': '\u2518', // '┘'
  '1101': '\u2524', // '┤'
  '1110': '\u2534', // '┴'
  '1111': '\u253C' // '┼'
};

Object.keys(angleTable).forEach(function (key) {
  angleTable[parseInt(key, 2)] = angleTable[key];
  delete angleTable[key];
});

/**
 * Expose
 */

module.exports = Screen;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * scrollablebox.js - scrollable box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * ScrollableBox
 */

function ScrollableBox(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new ScrollableBox(options);
  }

  options = options || {};

  Box.call(this, options);

  if (options.scrollable === false) {
    return this;
  }

  this.scrollable = true;
  this.childOffset = 0;
  this.childBase = 0;
  this.baseLimit = options.baseLimit || Infinity;
  this.alwaysScroll = options.alwaysScroll;

  this.scrollbar = options.scrollbar;
  if (this.scrollbar) {
    this.scrollbar.ch = this.scrollbar.ch || ' ';
    this.style.scrollbar = this.style.scrollbar || this.scrollbar.style;
    if (!this.style.scrollbar) {
      this.style.scrollbar = {};
      this.style.scrollbar.fg = this.scrollbar.fg;
      this.style.scrollbar.bg = this.scrollbar.bg;
      this.style.scrollbar.bold = this.scrollbar.bold;
      this.style.scrollbar.underline = this.scrollbar.underline;
      this.style.scrollbar.inverse = this.scrollbar.inverse;
      this.style.scrollbar.invisible = this.scrollbar.invisible;
    }
    //this.scrollbar.style = this.style.scrollbar;
    if (this.track || this.scrollbar.track) {
      this.track = this.scrollbar.track || this.track;
      this.style.track = this.style.scrollbar.track || this.style.track;
      this.track.ch = this.track.ch || ' ';
      this.style.track = this.style.track || this.track.style;
      if (!this.style.track) {
        this.style.track = {};
        this.style.track.fg = this.track.fg;
        this.style.track.bg = this.track.bg;
        this.style.track.bold = this.track.bold;
        this.style.track.underline = this.track.underline;
        this.style.track.inverse = this.track.inverse;
        this.style.track.invisible = this.track.invisible;
      }
      this.track.style = this.style.track;
    }
    // Allow controlling of the scrollbar via the mouse:
    if (options.mouse) {
      this.on('mousedown', function (data) {
        if (self._scrollingBar) {
          // Do not allow dragging on the scrollbar:
          delete self.screen._dragging;
          delete self._drag;
          return;
        }
        var x = data.x - self.aleft;
        var y = data.y - self.atop;
        if (x === self.width - self.iright - 1) {
          // Do not allow dragging on the scrollbar:
          delete self.screen._dragging;
          delete self._drag;
          var perc = (y - self.itop) / (self.height - self.iheight);
          self.setScrollPerc(perc * 100 | 0);
          self.screen.render();
          var smd, _smu;
          self._scrollingBar = true;
          self.onScreenEvent('mousedown', smd = function smd(data) {
            var y = data.y - self.atop;
            var perc = y / self.height;
            self.setScrollPerc(perc * 100 | 0);
            self.screen.render();
          });
          // If mouseup occurs out of the window, no mouseup event fires, and
          // scrollbar will drag again on mousedown until another mouseup
          // occurs.
          self.onScreenEvent('mouseup', _smu = function smu() {
            self._scrollingBar = false;
            self.removeScreenEvent('mousedown', smd);
            self.removeScreenEvent('mouseup', _smu);
          });
        }
      });
    }
  }

  if (options.mouse) {
    this.on('wheeldown', function () {
      self.scroll(self.height / 2 | 0 || 1);
      self.screen.render();
    });
    this.on('wheelup', function () {
      self.scroll(-(self.height / 2 | 0) || -1);
      self.screen.render();
    });
  }

  if (options.keys && !options.ignoreKeys) {
    this.on('keypress', function (ch, key) {
      if (key.name === 'up' || options.vi && key.name === 'k') {
        self.scroll(-1);
        self.screen.render();
        return;
      }
      if (key.name === 'down' || options.vi && key.name === 'j') {
        self.scroll(1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'u' && key.ctrl) {
        self.scroll(-(self.height / 2 | 0) || -1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'd' && key.ctrl) {
        self.scroll(self.height / 2 | 0 || 1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'b' && key.ctrl) {
        self.scroll(-self.height || -1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'f' && key.ctrl) {
        self.scroll(self.height || 1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && !key.shift) {
        self.scrollTo(0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && key.shift) {
        self.scrollTo(self.getScrollHeight());
        self.screen.render();
        return;
      }
    });
  }

  this.on('parsed content', function () {
    self._recalculateIndex();
  });

  self._recalculateIndex();
}

ScrollableBox.prototype.__proto__ = Box.prototype;

ScrollableBox.prototype.type = 'scrollable-box';

// XXX Potentially use this in place of scrollable checks elsewhere.
ScrollableBox.prototype.__defineGetter__('reallyScrollable', function () {
  if (this.shrink) return this.scrollable;
  return this.getScrollHeight() > this.height;
});

ScrollableBox.prototype._scrollBottom = function () {
  if (!this.scrollable) return 0;

  // We could just calculate the children, but we can
  // optimize for lists by just returning the items.length.
  if (this._isList) {
    return this.items ? this.items.length : 0;
  }

  if (this.lpos && this.lpos._scrollBottom) {
    return this.lpos._scrollBottom;
  }

  var bottom = this.children.reduce(function (current, el) {
    // el.height alone does not calculate the shrunken height, we need to use
    // getCoords. A shrunken box inside a scrollable element will not grow any
    // larger than the scrollable element's context regardless of how much
    // content is in the shrunken box, unless we do this (call getCoords
    // without the scrollable calculation):
    // See: $ node test/widget-shrink-fail-2.js
    if (!el.detached) {
      var lpos = el._getCoords(false, true);
      if (lpos) {
        return Math.max(current, el.rtop + (lpos.yl - lpos.yi));
      }
    }
    return Math.max(current, el.rtop + el.height);
  }, 0);

  // XXX Use this? Makes .getScrollHeight() useless!
  // if (bottom < this._clines.length) bottom = this._clines.length;

  if (this.lpos) this.lpos._scrollBottom = bottom;

  return bottom;
};

ScrollableBox.prototype.setScroll = ScrollableBox.prototype.scrollTo = function (offset, always) {
  // XXX
  // At first, this appeared to account for the first new calculation of childBase:
  this.scroll(0);
  return this.scroll(offset - (this.childBase + this.childOffset), always);
};

ScrollableBox.prototype.getScroll = function () {
  return this.childBase + this.childOffset;
};

ScrollableBox.prototype.scroll = function (offset, always) {
  if (!this.scrollable) return;

  if (this.detached) return;

  // Handle scrolling.
  var visible = this.height - this.iheight,
      base = this.childBase,
      d,
      p,
      t,
      b,
      max,
      emax;

  if (this.alwaysScroll || always) {
    // Semi-workaround
    this.childOffset = offset > 0 ? visible - 1 + offset : offset;
  } else {
    this.childOffset += offset;
  }

  if (this.childOffset > visible - 1) {
    d = this.childOffset - (visible - 1);
    this.childOffset -= d;
    this.childBase += d;
  } else if (this.childOffset < 0) {
    d = this.childOffset;
    this.childOffset += -d;
    this.childBase += d;
  }

  if (this.childBase < 0) {
    this.childBase = 0;
  } else if (this.childBase > this.baseLimit) {
    this.childBase = this.baseLimit;
  }

  // Find max "bottom" value for
  // content and descendant elements.
  // Scroll the content if necessary.
  if (this.childBase === base) {
    return this.emit('scroll');
  }

  // When scrolling text, we want to be able to handle SGR codes as well as line
  // feeds. This allows us to take preformatted text output from other programs
  // and put it in a scrollable text box.
  this.parseContent();

  // XXX
  // max = this.getScrollHeight() - (this.height - this.iheight);

  max = this._clines.length - (this.height - this.iheight);
  if (max < 0) max = 0;
  emax = this._scrollBottom() - (this.height - this.iheight);
  if (emax < 0) emax = 0;

  this.childBase = Math.min(this.childBase, Math.max(emax, max));

  if (this.childBase < 0) {
    this.childBase = 0;
  } else if (this.childBase > this.baseLimit) {
    this.childBase = this.baseLimit;
  }

  // Optimize scrolling with CSR + IL/DL.
  p = this.lpos;
  // Only really need _getCoords() if we want
  // to allow nestable scrolling elements...
  // or if we **really** want shrinkable
  // scrolling elements.
  // p = this._getCoords();
  if (p && this.childBase !== base && this.screen.cleanSides(this)) {
    t = p.yi + this.itop;
    b = p.yl - this.ibottom - 1;
    d = this.childBase - base;

    if (d > 0 && d < visible) {
      // scrolled down
      this.screen.deleteLine(d, t, t, b);
    } else if (d < 0 && -d < visible) {
      // scrolled up
      d = -d;
      this.screen.insertLine(d, t, t, b);
    }
  }

  return this.emit('scroll');
};

ScrollableBox.prototype._recalculateIndex = function () {
  var max, emax;

  if (this.detached || !this.scrollable) {
    return 0;
  }

  // XXX
  // max = this.getScrollHeight() - (this.height - this.iheight);

  max = this._clines.length - (this.height - this.iheight);
  if (max < 0) max = 0;
  emax = this._scrollBottom() - (this.height - this.iheight);
  if (emax < 0) emax = 0;

  this.childBase = Math.min(this.childBase, Math.max(emax, max));

  if (this.childBase < 0) {
    this.childBase = 0;
  } else if (this.childBase > this.baseLimit) {
    this.childBase = this.baseLimit;
  }
};

ScrollableBox.prototype.resetScroll = function () {
  if (!this.scrollable) return;
  this.childOffset = 0;
  this.childBase = 0;
  return this.emit('scroll');
};

ScrollableBox.prototype.getScrollHeight = function () {
  return Math.max(this._clines.length, this._scrollBottom());
};

ScrollableBox.prototype.getScrollPerc = function (s) {
  var pos = this.lpos || this._getCoords();
  if (!pos) return s ? -1 : 0;

  var height = pos.yl - pos.yi - this.iheight,
      i = this.getScrollHeight(),
      p;

  if (height < i) {
    if (this.alwaysScroll) {
      p = this.childBase / (i - height);
    } else {
      p = (this.childBase + this.childOffset) / (i - 1);
    }
    return p * 100;
  }

  return s ? -1 : 0;
};

ScrollableBox.prototype.setScrollPerc = function (i) {
  // XXX
  // var m = this.getScrollHeight();
  var m = Math.max(this._clines.length, this._scrollBottom());
  return this.scrollTo(i / 100 * m | 0);
};

/**
 * Expose
 */

module.exports = ScrollableBox;

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */

var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */

var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * ansiimage.js - render PNGS/GIFS as ANSI
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var cp = __webpack_require__(8);

var colors = __webpack_require__(11);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

var tng = __webpack_require__(66);

/**
 * ANSIImage
 */

function ANSIImage(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new ANSIImage(options);
  }

  options = options || {};
  options.shrink = true;

  Box.call(this, options);

  this.scale = this.options.scale || 1.0;
  this.options.animate = this.options.animate !== false;
  this._noFill = true;

  if (this.options.file) {
    this.setImage(this.options.file);
  }

  this.screen.on('prerender', function () {
    var lpos = self.lpos;
    if (!lpos) return;
    // prevent image from blending with itself if there are alpha channels
    self.screen.clearRegion(lpos.xi, lpos.xl, lpos.yi, lpos.yl);
  });

  this.on('destroy', function () {
    self.stop();
  });
}

ANSIImage.prototype.__proto__ = Box.prototype;

ANSIImage.prototype.type = 'ansiimage';

ANSIImage.curl = function (url) {
  try {
    return cp.execFileSync('curl', ['-s', '-A', '', url], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    ;
  }
  try {
    return cp.execFileSync('wget', ['-U', '', '-O', '-', url], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    ;
  }
  throw new Error('curl or wget failed.');
};

ANSIImage.prototype.setImage = function (file) {
  this.file = typeof file === 'string' ? file : null;

  if (/^https?:/.test(file)) {
    file = ANSIImage.curl(file);
  }

  var width = this.position.width;
  var height = this.position.height;

  if (width != null) {
    width = this.width;
  }

  if (height != null) {
    height = this.height;
  }

  try {
    this.setContent('');

    this.img = tng(file, {
      colors: colors,
      width: width,
      height: height,
      scale: this.scale,
      ascii: this.options.ascii,
      speed: this.options.speed,
      filename: this.file
    });

    if (width == null || height == null) {
      this.width = this.img.cellmap[0].length;
      this.height = this.img.cellmap.length;
    }

    if (this.img.frames && this.options.animate) {
      this.play();
    } else {
      this.cellmap = this.img.cellmap;
    }
  } catch (e) {
    this.setContent('Image Error: ' + e.message);
    this.img = null;
    this.cellmap = null;
  }
};

ANSIImage.prototype.play = function () {
  var self = this;
  if (!this.img) return;
  return this.img.play(function (bmp, cellmap) {
    self.cellmap = cellmap;
    self.screen.render();
  });
};

ANSIImage.prototype.pause = function () {
  if (!this.img) return;
  return this.img.pause();
};

ANSIImage.prototype.stop = function () {
  if (!this.img) return;
  return this.img.stop();
};

ANSIImage.prototype.clearImage = function () {
  this.stop();
  this.setContent('');
  this.img = null;
  this.cellmap = null;
};

ANSIImage.prototype.render = function () {
  var coords = this._render();
  if (!coords) return;

  if (this.img && this.cellmap) {
    this.img.renderElement(this.cellmap, this);
  }

  return coords;
};

/**
 * Expose
 */

module.exports = ANSIImage;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * checkbox.js - checkbox element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Input = __webpack_require__(9);

/**
 * Checkbox
 */

function Checkbox(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Checkbox(options);
  }

  options = options || {};

  Input.call(this, options);

  this.text = options.content || options.text || '';
  this.checked = this.value = options.checked || false;

  this.on('keypress', function (ch, key) {
    if (key.name === 'enter' || key.name === 'space') {
      self.toggle();
      self.screen.render();
    }
  });

  if (options.mouse) {
    this.on('click', function () {
      self.toggle();
      self.screen.render();
    });
  }

  this.on('focus', function () {
    var lpos = self.lpos;
    if (!lpos) return;
    self.screen.program.lsaveCursor('checkbox');
    self.screen.program.cup(lpos.yi, lpos.xi + 1);
    self.screen.program.showCursor();
  });

  this.on('blur', function () {
    self.screen.program.lrestoreCursor('checkbox', true);
  });
}

Checkbox.prototype.__proto__ = Input.prototype;

Checkbox.prototype.type = 'checkbox';

Checkbox.prototype.render = function () {
  this.clearPos(true);
  this.setContent('[' + (this.checked ? 'x' : ' ') + '] ' + this.text, true);
  return this._render();
};

Checkbox.prototype.check = function () {
  if (this.checked) return;
  this.checked = this.value = true;
  this.emit('check');
};

Checkbox.prototype.uncheck = function () {
  if (!this.checked) return;
  this.checked = this.value = false;
  this.emit('uncheck');
};

Checkbox.prototype.toggle = function () {
  return this.checked ? this.uncheck() : this.check();
};

/**
 * Expose
 */

module.exports = Checkbox;

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * log.js - log element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var util = __webpack_require__(60);

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = __webpack_require__(0);
var ScrollableText = __webpack_require__(23);

/**
 * Log
 */

function Log(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Log(options);
  }

  options = options || {};

  ScrollableText.call(this, options);

  this.scrollback = options.scrollback != null ? options.scrollback : Infinity;
  this.scrollOnInput = options.scrollOnInput;

  this.on('set content', function () {
    if (!self._userScrolled || self.scrollOnInput) {
      nextTick(function () {
        self.setScrollPerc(100);
        self._userScrolled = false;
        self.screen.render();
      });
    }
  });
}

Log.prototype.__proto__ = ScrollableText.prototype;

Log.prototype.type = 'log';

Log.prototype.log = Log.prototype.add = function () {
  var args = Array.prototype.slice.call(arguments);
  if (_typeof(args[0]) === 'object') {
    args[0] = util.inspect(args[0], true, 20, true);
  }
  var text = util.format.apply(util, args);
  this.emit('log', text);
  var ret = this.pushLine(text);
  if (this._clines.fake.length > this.scrollback) {
    this.shiftLine(0, this.scrollback / 3 | 0);
  }
  return ret;
};

Log.prototype._scroll = Log.prototype.scroll;
Log.prototype.scroll = function (offset, always) {
  if (offset === 0) return this._scroll(offset, always);
  this._userScrolled = true;
  var ret = this._scroll(offset, always);
  if (this.getScrollPerc() === 100) {
    this._userScrolled = false;
  }
  return ret;
};

/**
 * Expose
 */

module.exports = Log;

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * overlayimage.js - w3m image element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var fs = __webpack_require__(10),
    cp = __webpack_require__(8);

var helpers = __webpack_require__(3);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * OverlayImage
 * Good example of w3mimgdisplay commands:
 * https://github.com/hut/ranger/blob/master/ranger/ext/img_display.py
 */

function OverlayImage(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new OverlayImage(options);
  }

  options = options || {};

  Box.call(this, options);

  if (options.w3m) {
    OverlayImage.w3mdisplay = options.w3m;
  }

  if (OverlayImage.hasW3MDisplay == null) {
    if (fs.existsSync(OverlayImage.w3mdisplay)) {
      OverlayImage.hasW3MDisplay = true;
    } else if (options.search !== false) {
      var file = helpers.findFile('/usr', 'w3mimgdisplay') || helpers.findFile('/lib', 'w3mimgdisplay') || helpers.findFile('/bin', 'w3mimgdisplay');
      if (file) {
        OverlayImage.hasW3MDisplay = true;
        OverlayImage.w3mdisplay = file;
      } else {
        OverlayImage.hasW3MDisplay = false;
      }
    }
  }

  this.on('hide', function () {
    self._lastFile = self.file;
    self.clearImage();
  });

  this.on('show', function () {
    if (!self._lastFile) return;
    self.setImage(self._lastFile);
  });

  this.on('detach', function () {
    self._lastFile = self.file;
    self.clearImage();
  });

  this.on('attach', function () {
    if (!self._lastFile) return;
    self.setImage(self._lastFile);
  });

  this.onScreenEvent('resize', function () {
    self._needsRatio = true;
  });

  // Get images to overlap properly. Maybe not worth it:
  // this.onScreenEvent('render', function() {
  //   self.screen.program.flush();
  //   if (!self._noImage) return;
  //   function display(el, next) {
  //     if (el.type === 'w3mimage' && el.file) {
  //       el.setImage(el.file, next);
  //     } else {
  //       next();
  //     }
  //   }
  //   function done(el) {
  //     el.children.forEach(recurse);
  //   }
  //   function recurse(el) {
  //     display(el, function() {
  //       var pending = el.children.length;
  //       el.children.forEach(function(el) {
  //         display(el, function() {
  //           if (!--pending) done(el);
  //         });
  //       });
  //     });
  //   }
  //   recurse(self.screen);
  // });

  this.onScreenEvent('render', function () {
    self.screen.program.flush();
    if (!self._noImage) {
      self.setImage(self.file);
    }
  });

  if (this.options.file || this.options.img) {
    this.setImage(this.options.file || this.options.img);
  }
}

OverlayImage.prototype.__proto__ = Box.prototype;

OverlayImage.prototype.type = 'overlayimage';

OverlayImage.w3mdisplay = '/usr/lib/w3m/w3mimgdisplay';

OverlayImage.prototype.spawn = function (file, args, opt, callback) {
  var spawn = __webpack_require__(8).spawn,
      ps;

  opt = opt || {};
  ps = spawn(file, args, opt);

  ps.on('error', function (err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function (code) {
    if (!callback) return;
    if (code !== 0) return callback(new Error('Exit Code: ' + code));
    return callback(null, code === 0);
  });

  return ps;
};

OverlayImage.prototype.setImage = function (img, callback) {
  var self = this;

  if (this._settingImage) {
    this._queue = this._queue || [];
    this._queue.push([img, callback]);
    return;
  }
  this._settingImage = true;

  var reset = function reset() {
    self._settingImage = false;
    self._queue = self._queue || [];
    var item = self._queue.shift();
    if (item) {
      self.setImage(item[0], item[1]);
    }
  };

  if (OverlayImage.hasW3MDisplay === false) {
    reset();
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!img) {
    reset();
    if (!callback) return;
    return callback(new Error('No image.'));
  }

  this.file = img;

  return this.getPixelRatio(function (err, ratio) {
    if (err) {
      reset();
      if (!callback) return;
      return callback(err);
    }

    return self.renderImage(img, ratio, function (err, success) {
      if (err) {
        reset();
        if (!callback) return;
        return callback(err);
      }

      if (self.shrink || self.options.autofit) {
        delete self.shrink;
        delete self.options.shrink;
        self.options.autofit = true;
        return self.imageSize(function (err, size) {
          if (err) {
            reset();
            if (!callback) return;
            return callback(err);
          }

          if (self._lastSize && ratio.tw === self._lastSize.tw && ratio.th === self._lastSize.th && size.width === self._lastSize.width && size.height === self._lastSize.height && self.aleft === self._lastSize.aleft && self.atop === self._lastSize.atop) {
            reset();
            if (!callback) return;
            return callback(null, success);
          }

          self._lastSize = {
            tw: ratio.tw,
            th: ratio.th,
            width: size.width,
            height: size.height,
            aleft: self.aleft,
            atop: self.atop
          };

          self.position.width = size.width / ratio.tw | 0;
          self.position.height = size.height / ratio.th | 0;

          self._noImage = true;
          self.screen.render();
          self._noImage = false;

          reset();
          return self.renderImage(img, ratio, callback);
        });
      }

      reset();
      if (!callback) return;
      return callback(null, success);
    });
  });
};

OverlayImage.prototype.renderImage = function (img, ratio, callback) {
  var self = this;

  if (cp.execSync) {
    callback = callback || function (err, result) {
      return result;
    };
    try {
      return callback(null, this.renderImageSync(img, ratio));
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!ratio) {
    if (!callback) return;
    return callback(new Error('No ratio.'));
  }

  // clearImage unsets these:
  var _file = self.file;
  var _lastSize = self._lastSize;
  return self.clearImage(function (err) {
    if (err) return callback(err);

    self.file = _file;
    self._lastSize = _lastSize;

    var opt = {
      stdio: 'pipe',
      env: process.env,
      cwd: process.env.HOME
    };

    var ps = self.spawn(OverlayImage.w3mdisplay, [], opt, function (err, success) {
      if (!callback) return;
      return err ? callback(err) : callback(null, success);
    });

    var width = self.width * ratio.tw | 0,
        height = self.height * ratio.th | 0,
        aleft = self.aleft * ratio.tw | 0,
        atop = self.atop * ratio.th | 0;

    var input = '0;1;' + aleft + ';' + atop + ';' + width + ';' + height + ';;;;;' + img + '\n4;\n3;\n';

    self._props = {
      aleft: aleft,
      atop: atop,
      width: width,
      height: height
    };

    ps.stdin.write(input);
    ps.stdin.end();
  });
};

OverlayImage.prototype.clearImage = function (callback) {
  if (cp.execSync) {
    callback = callback || function (err, result) {
      return result;
    };
    try {
      return callback(null, this.clearImageSync());
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!this._props) {
    if (!callback) return;
    return callback(null);
  }

  var opt = {
    stdio: 'pipe',
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(OverlayImage.w3mdisplay, [], opt, function (err, success) {
    if (!callback) return;
    return err ? callback(err) : callback(null, success);
  });

  var width = this._props.width + 2,
      height = this._props.height + 2,
      aleft = this._props.aleft,
      atop = this._props.atop;

  if (this._drag) {
    aleft -= 10;
    atop -= 10;
    width += 10;
    height += 10;
  }

  var input = '6;' + aleft + ';' + atop + ';' + width + ';' + height + '\n4;\n3;\n';

  delete this.file;
  delete this._props;
  delete this._lastSize;

  ps.stdin.write(input);
  ps.stdin.end();
};

OverlayImage.prototype.imageSize = function (callback) {
  var img = this.file;

  if (cp.execSync) {
    callback = callback || function (err, result) {
      return result;
    };
    try {
      return callback(null, this.imageSizeSync());
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!img) {
    if (!callback) return;
    return callback(new Error('No image.'));
  }

  var opt = {
    stdio: 'pipe',
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(OverlayImage.w3mdisplay, [], opt);

  var buf = '';

  ps.stdout.setEncoding('utf8');

  ps.stdout.on('data', function (data) {
    buf += data;
  });

  ps.on('error', function (err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function () {
    if (!callback) return;
    var size = buf.trim().split(/\s+/);
    return callback(null, {
      raw: buf.trim(),
      width: +size[0],
      height: +size[1]
    });
  });

  var input = '5;' + img + '\n';

  ps.stdin.write(input);
  ps.stdin.end();
};

OverlayImage.prototype.termSize = function (callback) {
  var self = this;

  if (cp.execSync) {
    callback = callback || function (err, result) {
      return result;
    };
    try {
      return callback(null, this.termSizeSync());
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  var opt = {
    stdio: 'pipe',
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(OverlayImage.w3mdisplay, ['-test'], opt);

  var buf = '';

  ps.stdout.setEncoding('utf8');

  ps.stdout.on('data', function (data) {
    buf += data;
  });

  ps.on('error', function (err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function () {
    if (!callback) return;

    if (!buf.trim()) {
      // Bug: w3mimgdisplay will sometimes
      // output nothing. Try again:
      return self.termSize(callback);
    }

    var size = buf.trim().split(/\s+/);

    return callback(null, {
      raw: buf.trim(),
      width: +size[0],
      height: +size[1]
    });
  });

  ps.stdin.end();
};

OverlayImage.prototype.getPixelRatio = function (callback) {
  var self = this;

  if (cp.execSync) {
    callback = callback || function (err, result) {
      return result;
    };
    try {
      return callback(null, this.getPixelRatioSync());
    } catch (e) {
      return callback(e);
    }
  }

  // XXX We could cache this, but sometimes it's better
  // to recalculate to be pixel perfect.
  if (this._ratio && !this._needsRatio) {
    return callback(null, this._ratio);
  }

  return this.termSize(function (err, dimensions) {
    if (err) return callback(err);

    self._ratio = {
      tw: dimensions.width / self.screen.width,
      th: dimensions.height / self.screen.height
    };

    self._needsRatio = false;

    return callback(null, self._ratio);
  });
};

OverlayImage.prototype.renderImageSync = function (img, ratio) {
  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  if (!ratio) {
    throw new Error('No ratio.');
  }

  // clearImage unsets these:
  var _file = this.file;
  var _lastSize = this._lastSize;

  this.clearImageSync();

  this.file = _file;
  this._lastSize = _lastSize;

  var width = this.width * ratio.tw | 0,
      height = this.height * ratio.th | 0,
      aleft = this.aleft * ratio.tw | 0,
      atop = this.atop * ratio.th | 0;

  var input = '0;1;' + aleft + ';' + atop + ';' + width + ';' + height + ';;;;;' + img + '\n4;\n3;\n';

  this._props = {
    aleft: aleft,
    atop: atop,
    width: width,
    height: height
  };

  try {
    cp.execFileSync(OverlayImage.w3mdisplay, [], {
      env: process.env,
      encoding: 'utf8',
      input: input,
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  return true;
};

OverlayImage.prototype.clearImageSync = function () {
  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  if (!this._props) {
    return false;
  }

  var width = this._props.width + 2,
      height = this._props.height + 2,
      aleft = this._props.aleft,
      atop = this._props.atop;

  if (this._drag) {
    aleft -= 10;
    atop -= 10;
    width += 10;
    height += 10;
  }

  var input = '6;' + aleft + ';' + atop + ';' + width + ';' + height + '\n4;\n3;\n';

  delete this.file;
  delete this._props;
  delete this._lastSize;

  try {
    cp.execFileSync(OverlayImage.w3mdisplay, [], {
      env: process.env,
      encoding: 'utf8',
      input: input,
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  return true;
};

OverlayImage.prototype.imageSizeSync = function () {
  var img = this.file;

  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  if (!img) {
    throw new Error('No image.');
  }

  var buf = '';
  var input = '5;' + img + '\n';

  try {
    buf = cp.execFileSync(OverlayImage.w3mdisplay, [], {
      env: process.env,
      encoding: 'utf8',
      input: input,
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  var size = buf.trim().split(/\s+/);

  return {
    raw: buf.trim(),
    width: +size[0],
    height: +size[1]
  };
};

OverlayImage.prototype.termSizeSync = function (_, recurse) {
  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  var buf = '';

  try {
    buf = cp.execFileSync(OverlayImage.w3mdisplay, ['-test'], {
      env: process.env,
      encoding: 'utf8',
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  if (!buf.trim()) {
    // Bug: w3mimgdisplay will sometimes
    // output nothing. Try again:
    recurse = recurse || 0;
    if (++recurse === 5) {
      throw new Error('Term size not determined.');
    }
    return this.termSizeSync(_, recurse);
  }

  var size = buf.trim().split(/\s+/);

  return {
    raw: buf.trim(),
    width: +size[0],
    height: +size[1]
  };
};

OverlayImage.prototype.getPixelRatioSync = function () {
  // XXX We could cache this, but sometimes it's better
  // to recalculate to be pixel perfect.
  if (this._ratio && !this._needsRatio) {
    return this._ratio;
  }
  this._needsRatio = false;

  var dimensions = this.termSizeSync();

  this._ratio = {
    tw: dimensions.width / this.screen.width,
    th: dimensions.height / this.screen.height
  };

  return this._ratio;
};

OverlayImage.prototype.displayImage = function (callback) {
  return this.screen.displayImage(this.file, callback);
};

/**
 * Expose
 */

module.exports = OverlayImage;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * scrollabletext.js - scrollable text element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var ScrollableBox = __webpack_require__(16);

/**
 * ScrollableText
 */

function ScrollableText(options) {
  if (!(this instanceof Node)) {
    return new ScrollableText(options);
  }
  options = options || {};
  options.alwaysScroll = true;
  ScrollableBox.call(this, options);
}

ScrollableText.prototype.__proto__ = ScrollableBox.prototype;

ScrollableText.prototype.type = 'scrollable-text';

/**
 * Expose
 */

module.exports = ScrollableText;

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * table.js - table element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Table
 */

function Table(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Table(options);
  }

  options = options || {};
  options.shrink = true;
  options.style = options.style || {};
  options.style.border = options.style.border || {};
  options.style.header = options.style.header || {};
  options.style.cell = options.style.cell || {};
  options.align = options.align || 'center';

  // Regular tables do not get custom height (this would
  // require extra padding). Maybe add in the future.
  delete options.height;

  Box.call(this, options);

  this.pad = options.pad != null ? options.pad : 2;

  this.setData(options.rows || options.data);

  this.on('attach', function () {
    self.setContent('');
    self.setData(self.rows);
  });

  this.on('resize', function () {
    self.setContent('');
    self.setData(self.rows);
    self.screen.render();
  });
}

Table.prototype.__proto__ = Box.prototype;

Table.prototype.type = 'table';

Table.prototype._calculateMaxes = function () {
  var self = this;
  var maxes = [];

  if (this.detached) return;

  this.rows = this.rows || [];

  this.rows.forEach(function (row) {
    row.forEach(function (cell, i) {
      var clen = self.strWidth(cell);
      if (!maxes[i] || maxes[i] < clen) {
        maxes[i] = clen;
      }
    });
  });

  var total = maxes.reduce(function (total, max) {
    return total + max;
  }, 0);
  total += maxes.length + 1;

  // XXX There might be an issue with resizing where on the first resize event
  // width appears to be less than total if it's a percentage or left/right
  // combination.
  if (this.width < total) {
    delete this.position.width;
  }

  if (this.position.width != null) {
    var missing = this.width - total;
    var w = missing / maxes.length | 0;
    var wr = missing % maxes.length;
    maxes = maxes.map(function (max, i) {
      if (i === maxes.length - 1) {
        return max + w + wr;
      }
      return max + w;
    });
  } else {
    maxes = maxes.map(function (max) {
      return max + self.pad;
    });
  }

  return this._maxes = maxes;
};

Table.prototype.setRows = Table.prototype.setData = function (rows) {
  var self = this,
      text = '',
      align = this.align;

  this.rows = rows || [];

  this._calculateMaxes();

  if (!this._maxes) return;

  this.rows.forEach(function (row, i) {
    var isFooter = i === self.rows.length - 1;
    row.forEach(function (cell, i) {
      var width = self._maxes[i];
      var clen = self.strWidth(cell);

      if (i !== 0) {
        text += ' ';
      }

      while (clen < width) {
        if (align === 'center') {
          cell = ' ' + cell + ' ';
          clen += 2;
        } else if (align === 'left') {
          cell = cell + ' ';
          clen += 1;
        } else if (align === 'right') {
          cell = ' ' + cell;
          clen += 1;
        }
      }

      if (clen > width) {
        if (align === 'center') {
          cell = cell.substring(1);
          clen--;
        } else if (align === 'left') {
          cell = cell.slice(0, -1);
          clen--;
        } else if (align === 'right') {
          cell = cell.substring(1);
          clen--;
        }
      }

      text += cell;
    });
    if (!isFooter) {
      text += '\n\n';
    }
  });

  delete this.align;
  this.setContent(text);
  this.align = align;
};

Table.prototype.render = function () {
  var self = this;

  var coords = this._render();
  if (!coords) return;

  this._calculateMaxes();

  if (!this._maxes) return coords;

  var lines = this.screen.lines,
      xi = coords.xi,
      yi = coords.yi,
      rx,
      ry,
      i;

  var dattr = this.sattr(this.style),
      hattr = this.sattr(this.style.header),
      cattr = this.sattr(this.style.cell),
      battr = this.sattr(this.style.border);

  var width = coords.xl - coords.xi - this.iright,
      height = coords.yl - coords.yi - this.ibottom;

  // Apply attributes to header cells and cells.
  for (var y = this.itop; y < height; y++) {
    if (!lines[yi + y]) break;
    for (var x = this.ileft; x < width; x++) {
      if (!lines[yi + y][xi + x]) break;
      // Check to see if it's not the default attr. Allows for tags:
      if (lines[yi + y][xi + x][0] !== dattr) continue;
      if (y === this.itop) {
        lines[yi + y][xi + x][0] = hattr;
      } else {
        lines[yi + y][xi + x][0] = cattr;
      }
      lines[yi + y].dirty = true;
    }
  }

  if (!this.border || this.options.noCellBorders) return coords;

  // Draw border with correct angles.
  ry = 0;
  for (i = 0; i < self.rows.length + 1; i++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.forEach(function (max, i) {
      rx += max;
      if (i === 0) {
        if (!lines[yi + ry][xi + 0]) return;
        // left side
        if (ry === 0) {
          // top
          lines[yi + ry][xi + 0][0] = battr;
          // lines[yi + ry][xi + 0][1] = '\u250c'; // '┌'
        } else if (ry / 2 === self.rows.length) {
          // bottom
          lines[yi + ry][xi + 0][0] = battr;
          // lines[yi + ry][xi + 0][1] = '\u2514'; // '└'
        } else {
          // middle
          lines[yi + ry][xi + 0][0] = battr;
          lines[yi + ry][xi + 0][1] = '\u251C'; // '├'
          // XXX If we alter iwidth and ileft for no borders - nothing should be written here
          if (!self.border.left) {
            lines[yi + ry][xi + 0][1] = '\u2500'; // '─'
          }
        }
        lines[yi + ry].dirty = true;
      } else if (i === self._maxes.length - 1) {
        if (!lines[yi + ry][xi + rx + 1]) return;
        // right side
        if (ry === 0) {
          // top
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          // lines[yi + ry][xi + rx][1] = '\u2510'; // '┐'
        } else if (ry / 2 === self.rows.length) {
          // bottom
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          // lines[yi + ry][xi + rx][1] = '\u2518'; // '┘'
        } else {
          // middle
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          lines[yi + ry][xi + rx][1] = '\u2524'; // '┤'
          // XXX If we alter iwidth and iright for no borders - nothing should be written here
          if (!self.border.right) {
            lines[yi + ry][xi + rx][1] = '\u2500'; // '─'
          }
        }
        lines[yi + ry].dirty = true;
        return;
      }
      if (!lines[yi + ry][xi + rx + 1]) return;
      // center
      if (ry === 0) {
        // top
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u252C'; // '┬'
        // XXX If we alter iheight and itop for no borders - nothing should be written here
        if (!self.border.top) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
      } else if (ry / 2 === self.rows.length) {
        // bottom
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u2534'; // '┴'
        // XXX If we alter iheight and ibottom for no borders - nothing should be written here
        if (!self.border.bottom) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
      } else {
        // middle
        if (self.options.fillCellBorders) {
          var lbg = (ry <= 2 ? hattr : cattr) & 0x1ff;
          rx++;
          lines[yi + ry][xi + rx][0] = battr & ~0x1ff | lbg;
        } else {
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
        }
        lines[yi + ry][xi + rx][1] = '\u253C'; // '┼'
        // rx++;
      }
      lines[yi + ry].dirty = true;
    });
    ry += 2;
  }

  // Draw internal borders.
  for (ry = 1; ry < self.rows.length * 2; ry++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.slice(0, -1).forEach(function (max) {
      rx += max;
      if (!lines[yi + ry][xi + rx + 1]) return;
      if (ry % 2 !== 0) {
        if (self.options.fillCellBorders) {
          var lbg = (ry <= 2 ? hattr : cattr) & 0x1ff;
          rx++;
          lines[yi + ry][xi + rx][0] = battr & ~0x1ff | lbg;
        } else {
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
        }
        lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        lines[yi + ry].dirty = true;
      } else {
        rx++;
      }
    });
    rx = 1;
    self._maxes.forEach(function (max) {
      while (max--) {
        if (ry % 2 === 0) {
          if (!lines[yi + ry]) break;
          if (!lines[yi + ry][xi + rx + 1]) break;
          if (self.options.fillCellBorders) {
            var lbg = (ry <= 2 ? hattr : cattr) & 0x1ff;
            lines[yi + ry][xi + rx][0] = battr & ~0x1ff | lbg;
          } else {
            lines[yi + ry][xi + rx][0] = battr;
          }
          lines[yi + ry][xi + rx][1] = '\u2500'; // '─'
          lines[yi + ry].dirty = true;
        }
        rx++;
      }
      rx++;
    });
  }

  return coords;
};

/**
 * Expose
 */

module.exports = Table;

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * terminal.js - term.js terminal element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Terminal
 */

function Terminal(options) {
  if (!(this instanceof Node)) {
    return new Terminal(options);
  }

  options = options || {};
  options.scrollable = false;

  Box.call(this, options);

  // XXX Workaround for all motion
  if (this.screen.program.tmux && this.screen.program.tmuxVersion >= 2) {
    this.screen.program.enableMouse();
  }

  this.handler = options.handler;
  this.shell = options.shell || process.env.SHELL || 'sh';
  this.args = options.args || [];

  this.cursor = this.options.cursor;
  this.cursorBlink = this.options.cursorBlink;
  this.screenKeys = this.options.screenKeys;

  this.style = this.style || {};
  this.style.bg = this.style.bg || 'default';
  this.style.fg = this.style.fg || 'default';

  this.termName = options.terminal || options.term || process.env.TERM || 'xterm';

  this.bootstrap();
}

Terminal.prototype.__proto__ = Box.prototype;

Terminal.prototype.type = 'terminal';

Terminal.prototype.bootstrap = function () {
  var self = this;

  var element = {
    // window
    get document() {
      return element;
    },
    navigator: { userAgent: 'node.js' },

    // document
    get defaultView() {
      return element;
    },
    get documentElement() {
      return element;
    },
    createElement: function createElement() {
      return element;
    },

    // element
    get ownerDocument() {
      return element;
    },
    addEventListener: function addEventListener() {},
    removeEventListener: function removeEventListener() {},
    getElementsByTagName: function getElementsByTagName() {
      return [element];
    },
    getElementById: function getElementById() {
      return element;
    },
    parentNode: null,
    offsetParent: null,
    appendChild: function appendChild() {},
    removeChild: function removeChild() {},
    setAttribute: function setAttribute() {},
    getAttribute: function getAttribute() {},
    style: {},
    focus: function focus() {},
    blur: function blur() {},
    console: console
  };

  element.parentNode = element;
  element.offsetParent = element;

  this.term = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"term.js\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))({
    termName: this.termName,
    cols: this.width - this.iwidth,
    rows: this.height - this.iheight,
    context: element,
    document: element,
    body: element,
    parent: element,
    cursorBlink: this.cursorBlink,
    screenKeys: this.screenKeys
  });

  this.term.refresh = function () {
    self.screen.render();
  };

  this.term.keyDown = function () {};
  this.term.keyPress = function () {};

  this.term.open(element);

  // Emits key sequences in html-land.
  // Technically not necessary here.
  // In reality if we wanted to be neat, we would overwrite the keyDown and
  // keyPress methods with our own node.js-keys->terminal-keys methods, but
  // since all the keys are already coming in as escape sequences, we can just
  // send the input directly to the handler/socket (see below).
  // this.term.on('data', function(data) {
  //   self.handler(data);
  // });

  // Incoming keys and mouse inputs.
  // NOTE: Cannot pass mouse events - coordinates will be off!
  this.screen.program.input.on('data', this._onData = function (data) {
    if (self.screen.focused === self && !self._isMouse(data)) {
      self.handler(data);
    }
  });

  this.onScreenEvent('mouse', function (data) {
    if (self.screen.focused !== self) return;

    if (data.x < self.aleft + self.ileft) return;
    if (data.y < self.atop + self.itop) return;
    if (data.x > self.aleft - self.ileft + self.width) return;
    if (data.y > self.atop - self.itop + self.height) return;

    if (self.term.x10Mouse || self.term.vt200Mouse || self.term.normalMouse || self.term.mouseEvents || self.term.utfMouse || self.term.sgrMouse || self.term.urxvtMouse) {
      ;
    } else {
      return;
    }

    var b = data.raw[0],
        x = data.x - self.aleft,
        y = data.y - self.atop,
        s;

    if (self.term.urxvtMouse) {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[' + b + ';' + (x + 32) + ';' + (y + 32) + 'M';
    } else if (self.term.sgrMouse) {
      if (!self.screen.program.sgrMouse) {
        b -= 32;
      }
      s = '\x1b[<' + b + ';' + x + ';' + y + (data.action === 'mousedown' ? 'M' : 'm');
    } else {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[M' + String.fromCharCode(b) + String.fromCharCode(x + 32) + String.fromCharCode(y + 32);
    }

    self.handler(s);
  });

  this.on('focus', function () {
    self.term.focus();
  });

  this.on('blur', function () {
    self.term.blur();
  });

  this.term.on('title', function (title) {
    self.title = title;
    self.emit('title', title);
  });

  this.term.on('passthrough', function (data) {
    self.screen.program.flush();
    self.screen.program._owrite(data);
  });

  this.on('resize', function () {
    nextTick(function () {
      self.term.resize(self.width - self.iwidth, self.height - self.iheight);
    });
  });

  this.once('render', function () {
    self.term.resize(self.width - self.iwidth, self.height - self.iheight);
  });

  this.on('destroy', function () {
    self.kill();
    self.screen.program.input.removeListener('data', self._onData);
  });

  if (this.handler) {
    return;
  }

  this.pty = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"pty.js\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())).fork(this.shell, this.args, {
    name: this.termName,
    cols: this.width - this.iwidth,
    rows: this.height - this.iheight,
    cwd: process.env.HOME,
    env: this.options.env || process.env
  });

  this.on('resize', function () {
    nextTick(function () {
      try {
        self.pty.resize(self.width - self.iwidth, self.height - self.iheight);
      } catch (e) {
        ;
      }
    });
  });

  this.handler = function (data) {
    self.pty.write(data);
    self.screen.render();
  };

  this.pty.on('data', function (data) {
    self.write(data);
    self.screen.render();
  });

  this.pty.on('exit', function (code) {
    self.emit('exit', code || null);
  });

  this.onScreenEvent('keypress', function () {
    self.screen.render();
  });

  this.screen._listenKeys(this);
};

Terminal.prototype.write = function (data) {
  return this.term.write(data);
};

Terminal.prototype.render = function () {
  var ret = this._render();
  if (!ret) return;

  this.dattr = this.sattr(this.style);

  var xi = ret.xi + this.ileft,
      xl = ret.xl - this.iright,
      yi = ret.yi + this.itop,
      yl = ret.yl - this.ibottom,
      cursor;

  var scrollback = this.term.lines.length - (yl - yi);

  for (var y = Math.max(yi, 0); y < yl; y++) {
    var line = this.screen.lines[y];
    if (!line || !this.term.lines[scrollback + y - yi]) break;

    if (y === yi + this.term.y && this.term.cursorState && this.screen.focused === this && (this.term.ydisp === this.term.ybase || this.term.selectMode) && !this.term.cursorHidden) {
      cursor = xi + this.term.x;
    } else {
      cursor = -1;
    }

    for (var x = Math.max(xi, 0); x < xl; x++) {
      if (!line[x] || !this.term.lines[scrollback + y - yi][x - xi]) break;

      line[x][0] = this.term.lines[scrollback + y - yi][x - xi][0];

      if (x === cursor) {
        if (this.cursor === 'line') {
          line[x][0] = this.dattr;
          line[x][1] = '\u2502';
          continue;
        } else if (this.cursor === 'underline') {
          line[x][0] = this.dattr | 2 << 18;
        } else if (this.cursor === 'block' || !this.cursor) {
          line[x][0] = this.dattr | 8 << 18;
        }
      }

      line[x][1] = this.term.lines[scrollback + y - yi][x - xi][1];

      // default foreground = 257
      if ((line[x][0] >> 9 & 0x1ff) === 257) {
        line[x][0] &= ~(0x1ff << 9);
        line[x][0] |= (this.dattr >> 9 & 0x1ff) << 9;
      }

      // default background = 256
      if ((line[x][0] & 0x1ff) === 256) {
        line[x][0] &= ~0x1ff;
        line[x][0] |= this.dattr & 0x1ff;
      }
    }

    line.dirty = true;
  }

  return ret;
};

Terminal.prototype._isMouse = function (buf) {
  var s = buf;
  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString('utf-8');
    } else {
      s = s.toString('utf-8');
    }
  }
  return buf[0] === 0x1b && buf[1] === 0x5b && buf[2] === 0x4d || /^\x1b\[M([\x00\u0020-\uffff]{3})/.test(s) || /^\x1b\[(\d+;\d+;\d+)M/.test(s) || /^\x1b\[<(\d+;\d+;\d+)([mM])/.test(s) || /^\x1b\[<(\d+;\d+;\d+;\d+)&w/.test(s) || /^\x1b\[24([0135])~\[(\d+),(\d+)\]\r/.test(s) || /^\x1b\[(O|I)/.test(s);
};

Terminal.prototype.setScroll = Terminal.prototype.scrollTo = function (offset) {
  this.term.ydisp = offset;
  return this.emit('scroll');
};

Terminal.prototype.getScroll = function () {
  return this.term.ydisp;
};

Terminal.prototype.scroll = function (offset) {
  this.term.scrollDisp(offset);
  return this.emit('scroll');
};

Terminal.prototype.resetScroll = function () {
  this.term.ydisp = 0;
  this.term.ybase = 0;
  return this.emit('scroll');
};

Terminal.prototype.getScrollHeight = function () {
  return this.term.rows - 1;
};

Terminal.prototype.getScrollPerc = function () {
  return this.term.ydisp / this.term.ybase * 100;
};

Terminal.prototype.setScrollPerc = function (i) {
  return this.setScroll(i / 100 * this.term.ybase | 0);
};

Terminal.prototype.screenshot = function (xi, xl, yi, yl) {
  xi = 0 + (xi || 0);
  if (xl != null) {
    xl = 0 + (xl || 0);
  } else {
    xl = this.term.lines[0].length;
  }
  yi = 0 + (yi || 0);
  if (yl != null) {
    yl = 0 + (yl || 0);
  } else {
    yl = this.term.lines.length;
  }
  return this.screen.screenshot(xi, xl, yi, yl, this.term);
};

Terminal.prototype.kill = function () {
  if (this.pty) {
    this.pty.destroy();
    this.pty.kill();
  }
  this.term.refresh = function () {};
  this.term.write('\x1b[H\x1b[J');
  if (this.term._blink) {
    clearInterval(this.term._blink);
  }
  this.term.destroy();
};

/**
 * Expose
 */

module.exports = Terminal;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * text.js - text element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Element = __webpack_require__(4);

/**
 * Text
 */

function Text(options) {
  if (!(this instanceof Node)) {
    return new Text(options);
  }
  options = options || {};
  options.shrink = true;
  Element.call(this, options);
}

Text.prototype.__proto__ = Element.prototype;

Text.prototype.type = 'text';

/**
 * Expose
 */

module.exports = Text;

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * textarea.js - textarea element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var unicode = __webpack_require__(12);

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = __webpack_require__(0);
var Input = __webpack_require__(9);

/**
 * Textarea
 */

function Textarea(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Textarea(options);
  }

  options = options || {};

  options.scrollable = options.scrollable !== false;

  Input.call(this, options);

  this.screen._listenKeys(this);

  this.value = options.value || '';

  this.__updateCursor = this._updateCursor.bind(this);
  this.on('resize', this.__updateCursor);
  this.on('move', this.__updateCursor);

  if (options.inputOnFocus) {
    this.on('focus', this.readInput.bind(this, null));
  }

  if (!options.inputOnFocus && options.keys) {
    this.on('keypress', function (ch, key) {
      if (self._reading) return;
      if (key.name === 'enter' || options.vi && key.name === 'i') {
        return self.readInput();
      }
      if (key.name === 'e') {
        return self.readEditor();
      }
    });
  }

  if (options.mouse) {
    this.on('click', function (data) {
      if (self._reading) return;
      if (data.button !== 'right') return;
      self.readEditor();
    });
  }
}

Textarea.prototype.__proto__ = Input.prototype;

Textarea.prototype.type = 'textarea';

Textarea.prototype._updateCursor = function (get) {
  if (this.screen.focused !== this) {
    return;
  }

  var lpos = get ? this.lpos : this._getCoords();
  if (!lpos) return;

  var last = this._clines[this._clines.length - 1],
      program = this.screen.program,
      line,
      cx,
      cy;

  // Stop a situation where the textarea begins scrolling
  // and the last cline appears to always be empty from the
  // _typeScroll `+ '\n'` thing.
  // Maybe not necessary anymore?
  if (last === '' && this.value[this.value.length - 1] !== '\n') {
    last = this._clines[this._clines.length - 2] || '';
  }

  line = Math.min(this._clines.length - 1 - (this.childBase || 0), lpos.yl - lpos.yi - this.iheight - 1);

  // When calling clearValue() on a full textarea with a border, the first
  // argument in the above Math.min call ends up being -2. Make sure we stay
  // positive.
  line = Math.max(0, line);

  cy = lpos.yi + this.itop + line;
  cx = lpos.xi + this.ileft + this.strWidth(last);

  // XXX Not sure, but this may still sometimes
  // cause problems when leaving editor.
  if (cy === program.y && cx === program.x) {
    return;
  }

  if (cy === program.y) {
    if (cx > program.x) {
      program.cuf(cx - program.x);
    } else if (cx < program.x) {
      program.cub(program.x - cx);
    }
  } else if (cx === program.x) {
    if (cy > program.y) {
      program.cud(cy - program.y);
    } else if (cy < program.y) {
      program.cuu(program.y - cy);
    }
  } else {
    program.cup(cy, cx);
  }
};

Textarea.prototype.input = Textarea.prototype.setInput = Textarea.prototype.readInput = function (callback) {
  var self = this,
      focused = this.screen.focused === this;

  if (this._reading) return;
  this._reading = true;

  this._callback = callback;

  if (!focused) {
    this.screen.saveFocus();
    this.focus();
  }

  this.screen.grabKeys = true;

  this._updateCursor();
  this.screen.program.showCursor();
  //this.screen.program.sgr('normal');

  this._done = function fn(err, value) {
    if (!self._reading) return;

    if (fn.done) return;
    fn.done = true;

    self._reading = false;

    delete self._callback;
    delete self._done;

    self.removeListener('keypress', self.__listener);
    delete self.__listener;

    self.removeListener('blur', self.__done);
    delete self.__done;

    self.screen.program.hideCursor();
    self.screen.grabKeys = false;

    if (!focused) {
      self.screen.restoreFocus();
    }

    if (self.options.inputOnFocus) {
      self.screen.rewindFocus();
    }

    // Ugly
    if (err === 'stop') return;

    if (err) {
      self.emit('error', err);
    } else if (value != null) {
      self.emit('submit', value);
    } else {
      self.emit('cancel', value);
    }
    self.emit('action', value);

    if (!callback) return;

    return err ? callback(err) : callback(null, value);
  };

  // Put this in a nextTick so the current
  // key event doesn't trigger any keys input.
  nextTick(function () {
    self.__listener = self._listener.bind(self);
    self.on('keypress', self.__listener);
  });

  this.__done = this._done.bind(this, null, null);
  this.on('blur', this.__done);
};

Textarea.prototype._listener = function (ch, key) {
  var done = this._done,
      value = this.value;

  if (key.name === 'return') return;
  if (key.name === 'enter') {
    ch = '\n';
  }

  // TODO: Handle directional keys.
  if (key.name === 'left' || key.name === 'right' || key.name === 'up' || key.name === 'down') {
    ;
  }

  if (this.options.keys && key.ctrl && key.name === 'e') {
    return this.readEditor();
  }

  // TODO: Optimize typing by writing directly
  // to the screen and screen buffer here.
  if (key.name === 'escape') {
    done(null, null);
  } else if (key.name === 'backspace') {
    if (this.value.length) {
      if (this.screen.fullUnicode) {
        if (unicode.isSurrogate(this.value, this.value.length - 2)) {
          // || unicode.isCombining(this.value, this.value.length - 1)) {
          this.value = this.value.slice(0, -2);
        } else {
          this.value = this.value.slice(0, -1);
        }
      } else {
        this.value = this.value.slice(0, -1);
      }
    }
  } else if (ch) {
    if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
      this.value += ch;
    }
  }

  if (this.value !== value) {
    this.screen.render();
  }
};

Textarea.prototype._typeScroll = function () {
  // XXX Workaround
  var height = this.height - this.iheight;
  if (this._clines.length - this.childBase > height) {
    this.scroll(this._clines.length);
  }
};

Textarea.prototype.getValue = function () {
  return this.value;
};

Textarea.prototype.setValue = function (value) {
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    this.value = value;
    this._value = value;
    this.setContent(this.value);
    this._typeScroll();
    this._updateCursor();
  }
};

Textarea.prototype.clearInput = Textarea.prototype.clearValue = function () {
  return this.setValue('');
};

Textarea.prototype.submit = function () {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Textarea.prototype.cancel = function () {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Textarea.prototype.render = function () {
  this.setValue();
  return this._render();
};

Textarea.prototype.editor = Textarea.prototype.setEditor = Textarea.prototype.readEditor = function (callback) {
  var self = this;

  if (this._reading) {
    var _cb = this._callback,
        cb = callback;

    this._done('stop');

    callback = function callback(err, value) {
      if (_cb) _cb(err, value);
      if (cb) cb(err, value);
    };
  }

  if (!callback) {
    callback = function callback() {};
  }

  return this.screen.readEditor({ value: this.value }, function (err, value) {
    if (err) {
      if (err.message === 'Unsuccessful.') {
        self.screen.render();
        return self.readInput(callback);
      }
      self.screen.render();
      self.readInput(callback);
      return callback(err);
    }
    self.setValue(value);
    self.screen.render();
    return self.readInput(callback);
  });
};

/**
 * Expose
 */

module.exports = Textarea;

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * textbox.js - textbox element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Textarea = __webpack_require__(27);

/**
 * Textbox
 */

function Textbox(options) {
  if (!(this instanceof Node)) {
    return new Textbox(options);
  }

  options = options || {};

  options.scrollable = false;

  Textarea.call(this, options);

  this.secret = options.secret;
  this.censor = options.censor;
}

Textbox.prototype.__proto__ = Textarea.prototype;

Textbox.prototype.type = 'textbox';

Textbox.prototype.__olistener = Textbox.prototype._listener;
Textbox.prototype._listener = function (ch, key) {
  if (key.name === 'enter') {
    this._done(null, this.value);
    return;
  }
  return this.__olistener(ch, key);
};

Textbox.prototype.setValue = function (value) {
  var visible, val;
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    value = value.replace(/\n/g, '');
    this.value = value;
    this._value = value;
    if (this.secret) {
      this.setContent('');
    } else if (this.censor) {
      this.setContent(Array(this.value.length + 1).join('*'));
    } else {
      visible = -(this.width - this.iwidth - 1);
      val = this.value.replace(/\t/g, this.screen.tabc);
      this.setContent(val.slice(visible));
    }
    this._updateCursor();
  }
};

Textbox.prototype.submit = function () {
  if (!this.__listener) return;
  return this.__listener('\r', { name: 'enter' });
};

/**
 * Expose
 */

module.exports = Textbox;

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyObject = {};

if (process.env.NODE_ENV !== 'production') {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _prodInvariant = __webpack_require__(7);

var ReactNoopUpdateQueue = __webpack_require__(33);

var canDefineProperty = __webpack_require__(35);
var emptyObject = __webpack_require__(30);
var invariant = __webpack_require__(5);
var warning = __webpack_require__(2);

/**
 * Base class helpers for the updating state of a component.
 */
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

ReactComponent.prototype.isReactComponent = {};

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
ReactComponent.prototype.setState = function (partialState, callback) {
  !((typeof partialState === 'undefined' ? 'undefined' : _typeof(partialState)) === 'object' || typeof partialState === 'function' || partialState == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'setState(...): takes an object of state variables to update or a function which returns an object of state variables.') : _prodInvariant('85') : void 0;
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'setState');
  }
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
ReactComponent.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'forceUpdate');
  }
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (process.env.NODE_ENV !== 'production') {
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };
  var defineDeprecationWarning = function defineDeprecationWarning(methodName, info) {
    if (canDefineProperty) {
      Object.defineProperty(ReactComponent.prototype, methodName, {
        get: function get() {
          process.env.NODE_ENV !== 'production' ? warning(false, '%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]) : void 0;
          return undefined;
        }
      });
    }
  };
  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

module.exports = ReactComponent;

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _prodInvariant = __webpack_require__(7);

var ReactCurrentOwner = __webpack_require__(18);

var invariant = __webpack_require__(5);
var warning = __webpack_require__(2);

function isNative(fn) {
  // Based on isNative() from Lodash
  var funcToString = Function.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var reIsNative = RegExp('^' + funcToString
  // Take an example native function source for comparison
  .call(hasOwnProperty)
  // Strip regex characters so we can use it for regex
  .replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  // Remove hasOwnProperty from the template to make it generic
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
  try {
    var source = funcToString.call(fn);
    return reIsNative.test(source);
  } catch (err) {
    return false;
  }
}

var canUseCollections =
// Array.from
typeof Array.from === 'function' &&
// Map
typeof Map === 'function' && isNative(Map) &&
// Map.prototype.keys
Map.prototype != null && typeof Map.prototype.keys === 'function' && isNative(Map.prototype.keys) &&
// Set
typeof Set === 'function' && isNative(Set) &&
// Set.prototype.keys
Set.prototype != null && typeof Set.prototype.keys === 'function' && isNative(Set.prototype.keys);

var setItem;
var getItem;
var removeItem;
var getItemIDs;
var addRoot;
var removeRoot;
var getRootIDs;

if (canUseCollections) {
  var itemMap = new Map();
  var rootIDSet = new Set();

  setItem = function setItem(id, item) {
    itemMap.set(id, item);
  };
  getItem = function getItem(id) {
    return itemMap.get(id);
  };
  removeItem = function removeItem(id) {
    itemMap['delete'](id);
  };
  getItemIDs = function getItemIDs() {
    return Array.from(itemMap.keys());
  };

  addRoot = function addRoot(id) {
    rootIDSet.add(id);
  };
  removeRoot = function removeRoot(id) {
    rootIDSet['delete'](id);
  };
  getRootIDs = function getRootIDs() {
    return Array.from(rootIDSet.keys());
  };
} else {
  var itemByKey = {};
  var rootByKey = {};

  // Use non-numeric keys to prevent V8 performance issues:
  // https://github.com/facebook/react/pull/7232
  var getKeyFromID = function getKeyFromID(id) {
    return '.' + id;
  };
  var getIDFromKey = function getIDFromKey(key) {
    return parseInt(key.substr(1), 10);
  };

  setItem = function setItem(id, item) {
    var key = getKeyFromID(id);
    itemByKey[key] = item;
  };
  getItem = function getItem(id) {
    var key = getKeyFromID(id);
    return itemByKey[key];
  };
  removeItem = function removeItem(id) {
    var key = getKeyFromID(id);
    delete itemByKey[key];
  };
  getItemIDs = function getItemIDs() {
    return Object.keys(itemByKey).map(getIDFromKey);
  };

  addRoot = function addRoot(id) {
    var key = getKeyFromID(id);
    rootByKey[key] = true;
  };
  removeRoot = function removeRoot(id) {
    var key = getKeyFromID(id);
    delete rootByKey[key];
  };
  getRootIDs = function getRootIDs() {
    return Object.keys(rootByKey).map(getIDFromKey);
  };
}

var unmountedIDs = [];

function purgeDeep(id) {
  var item = getItem(id);
  if (item) {
    var childIDs = item.childIDs;

    removeItem(id);
    childIDs.forEach(purgeDeep);
  }
}

function describeComponentFrame(name, source, ownerName) {
  return '\n    in ' + (name || 'Unknown') + (source ? ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' + source.lineNumber + ')' : ownerName ? ' (created by ' + ownerName + ')' : '');
}

function _getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function describeID(id) {
  var name = ReactComponentTreeHook.getDisplayName(id);
  var element = ReactComponentTreeHook.getElement(id);
  var ownerID = ReactComponentTreeHook.getOwnerID(id);
  var ownerName;
  if (ownerID) {
    ownerName = ReactComponentTreeHook.getDisplayName(ownerID);
  }
  process.env.NODE_ENV !== 'production' ? warning(element, 'ReactComponentTreeHook: Missing React element for debugID %s when ' + 'building stack', id) : void 0;
  return describeComponentFrame(name, element && element._source, ownerName);
}

var ReactComponentTreeHook = {
  onSetChildren: function onSetChildren(id, nextChildIDs) {
    var item = getItem(id);
    !item ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Item must have been set') : _prodInvariant('144') : void 0;
    item.childIDs = nextChildIDs;

    for (var i = 0; i < nextChildIDs.length; i++) {
      var nextChildID = nextChildIDs[i];
      var nextChild = getItem(nextChildID);
      !nextChild ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected hook events to fire for the child before its parent includes it in onSetChildren().') : _prodInvariant('140') : void 0;
      !(nextChild.childIDs != null || _typeof(nextChild.element) !== 'object' || nextChild.element == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onSetChildren() to fire for a container child before its parent includes it in onSetChildren().') : _prodInvariant('141') : void 0;
      !nextChild.isMounted ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onMountComponent() to fire for the child before its parent includes it in onSetChildren().') : _prodInvariant('71') : void 0;
      if (nextChild.parentID == null) {
        nextChild.parentID = id;
        // TODO: This shouldn't be necessary but mounting a new root during in
        // componentWillMount currently causes not-yet-mounted components to
        // be purged from our tree data so their parent id is missing.
      }
      !(nextChild.parentID === id) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onBeforeMountComponent() parent and onSetChildren() to be consistent (%s has parents %s and %s).', nextChildID, nextChild.parentID, id) : _prodInvariant('142', nextChildID, nextChild.parentID, id) : void 0;
    }
  },
  onBeforeMountComponent: function onBeforeMountComponent(id, element, parentID) {
    var item = {
      element: element,
      parentID: parentID,
      text: null,
      childIDs: [],
      isMounted: false,
      updateCount: 0
    };
    setItem(id, item);
  },
  onBeforeUpdateComponent: function onBeforeUpdateComponent(id, element) {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.element = element;
  },
  onMountComponent: function onMountComponent(id) {
    var item = getItem(id);
    !item ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Item must have been set') : _prodInvariant('144') : void 0;
    item.isMounted = true;
    var isRoot = item.parentID === 0;
    if (isRoot) {
      addRoot(id);
    }
  },
  onUpdateComponent: function onUpdateComponent(id) {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.updateCount++;
  },
  onUnmountComponent: function onUnmountComponent(id) {
    var item = getItem(id);
    if (item) {
      // We need to check if it exists.
      // `item` might not exist if it is inside an error boundary, and a sibling
      // error boundary child threw while mounting. Then this instance never
      // got a chance to mount, but it still gets an unmounting event during
      // the error boundary cleanup.
      item.isMounted = false;
      var isRoot = item.parentID === 0;
      if (isRoot) {
        removeRoot(id);
      }
    }
    unmountedIDs.push(id);
  },
  purgeUnmountedComponents: function purgeUnmountedComponents() {
    if (ReactComponentTreeHook._preventPurging) {
      // Should only be used for testing.
      return;
    }

    for (var i = 0; i < unmountedIDs.length; i++) {
      var id = unmountedIDs[i];
      purgeDeep(id);
    }
    unmountedIDs.length = 0;
  },
  isMounted: function isMounted(id) {
    var item = getItem(id);
    return item ? item.isMounted : false;
  },
  getCurrentStackAddendum: function getCurrentStackAddendum(topElement) {
    var info = '';
    if (topElement) {
      var name = _getDisplayName(topElement);
      var owner = topElement._owner;
      info += describeComponentFrame(name, topElement._source, owner && owner.getName());
    }

    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    info += ReactComponentTreeHook.getStackAddendumByID(id);
    return info;
  },
  getStackAddendumByID: function getStackAddendumByID(id) {
    var info = '';
    while (id) {
      info += describeID(id);
      id = ReactComponentTreeHook.getParentID(id);
    }
    return info;
  },
  getChildIDs: function getChildIDs(id) {
    var item = getItem(id);
    return item ? item.childIDs : [];
  },
  getDisplayName: function getDisplayName(id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element) {
      return null;
    }
    return _getDisplayName(element);
  },
  getElement: function getElement(id) {
    var item = getItem(id);
    return item ? item.element : null;
  },
  getOwnerID: function getOwnerID(id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element || !element._owner) {
      return null;
    }
    return element._owner._debugID;
  },
  getParentID: function getParentID(id) {
    var item = getItem(id);
    return item ? item.parentID : null;
  },
  getSource: function getSource(id) {
    var item = getItem(id);
    var element = item ? item.element : null;
    var source = element != null ? element._source : null;
    return source;
  },
  getText: function getText(id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (typeof element === 'string') {
      return element;
    } else if (typeof element === 'number') {
      return '' + element;
    } else {
      return null;
    }
  },
  getUpdateCount: function getUpdateCount(id) {
    var item = getItem(id);
    return item ? item.updateCount : 0;
  },

  getRootIDs: getRootIDs,
  getRegisteredIDs: getItemIDs
};

module.exports = ReactComponentTreeHook;

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var warning = __webpack_require__(2);

function warnNoop(publicInstance, callerName) {
  if (process.env.NODE_ENV !== 'production') {
    var constructor = publicInstance.constructor;
    process.env.NODE_ENV !== 'production' ? warning(false, '%s(...): Can only update a mounted or mounting component. ' + 'This usually means you called %s() on an unmounted component. ' + 'This is a no-op. Please check the code for the %s component.', callerName, callerName, constructor && (constructor.displayName || constructor.name) || 'ReactClass') : void 0;
  }
}

/**
 * This is the abstract API for an update queue.
 */
var ReactNoopUpdateQueue = {

  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function isMounted(publicInstance) {
    return false;
  },

  /**
   * Enqueue a callback that will be executed after all the pending updates
   * have processed.
   *
   * @param {ReactClass} publicInstance The instance to use as `this` context.
   * @param {?function} callback Called after state is updated.
   * @internal
   */
  enqueueCallback: function enqueueCallback(publicInstance, callback) {},

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @internal
   */
  enqueueForceUpdate: function enqueueForceUpdate(publicInstance) {
    warnNoop(publicInstance, 'forceUpdate');
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @internal
   */
  enqueueReplaceState: function enqueueReplaceState(publicInstance, completeState) {
    warnNoop(publicInstance, 'replaceState');
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function enqueueSetState(publicInstance, partialState) {
    warnNoop(publicInstance, 'setState');
  }
};

module.exports = ReactNoopUpdateQueue;

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactPropTypeLocationNames = {};

if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var canDefineProperty = false;
if (process.env.NODE_ENV !== 'production') {
  try {
    // $FlowFixMe https://github.com/facebook/flow/issues/285
    Object.defineProperty({}, 'x', { get: function get() {} });
    canDefineProperty = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

module.exports = canDefineProperty;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/* global Symbol */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
 * Returns the iterator method function contained on the iterable object.
 *
 * Be sure to invoke the function with the iterable as context:
 *
 *     var iteratorFn = getIteratorFn(myIterable);
 *     if (iteratorFn) {
 *       var iterator = iteratorFn.call(myIterable);
 *       ...
 *     }
 *
 * @param {?object} maybeIterable
 * @return {?function}
 */
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

module.exports = getIteratorFn;

/***/ }),
/* 37 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * blessed - a high-level terminal interface library for node.js
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Blessed
 */

function blessed() {
  return blessed.program.apply(null, arguments);
}

blessed.program = blessed.Program = __webpack_require__(39);
blessed.tput = blessed.Tput = __webpack_require__(64);
blessed.widget = __webpack_require__(65);
blessed.colors = __webpack_require__(11);
blessed.unicode = __webpack_require__(12);
blessed.helpers = __webpack_require__(3);

blessed.helpers.sprintf = blessed.tput.sprintf;
blessed.helpers.tryRead = blessed.tput.tryRead;
blessed.helpers.merge(blessed, blessed.helpers);

blessed.helpers.merge(blessed, blessed.widget);

/**
 * Expose
 */

module.exports = blessed;

/***/ }),
/* 39 */
/***/ (function(module, exports) {

throw new Error("Module build failed: SyntaxError: Octal literal in strict mode (198:14)\n\n\u001b[0m \u001b[90m 196 | \u001b[39m      \u001b[36mswitch\u001b[39m (ch) {\n \u001b[90m 197 | \u001b[39m        \u001b[36mcase\u001b[39m \u001b[32m'\\0'\u001b[39m\u001b[33m:\u001b[39m\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 198 | \u001b[39m        \u001b[36mcase\u001b[39m \u001b[32m'\\200'\u001b[39m\u001b[33m:\u001b[39m\n \u001b[90m     | \u001b[39m              \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 199 | \u001b[39m          ch \u001b[33m=\u001b[39m \u001b[32m'@'\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m 200 | \u001b[39m          \u001b[36mbreak\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m 201 | \u001b[39m        \u001b[36mcase\u001b[39m \u001b[32m'\\x1b'\u001b[39m\u001b[33m:\u001b[39m\u001b[0m\n");

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {

/**
 * bigtext.js - bigtext element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var fs = __webpack_require__(10);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * BigText
 */

function BigText(options) {
  if (!(this instanceof Node)) {
    return new BigText(options);
  }
  options = options || {};
  options.font = options.font || __dirname + '/../../usr/fonts/ter-u14n.json';
  options.fontBold = options.font || __dirname + '/../../usr/fonts/ter-u14b.json';
  this.fch = options.fch;
  this.ratio = {};
  this.font = this.loadFont(options.font);
  this.fontBold = this.loadFont(options.font);
  Box.call(this, options);
  if (this.style.bold) {
    this.font = this.fontBold;
  }
}

BigText.prototype.__proto__ = Box.prototype;

BigText.prototype.type = 'bigtext';

BigText.prototype.loadFont = function (filename) {
  var self = this,
      data,
      font;

  data = JSON.parse(fs.readFileSync(filename, 'utf8'));

  this.ratio.width = data.width;
  this.ratio.height = data.height;

  function convertLetter(ch, lines) {
    var line, i;

    while (lines.length > self.ratio.height) {
      lines.shift();
      lines.pop();
    }

    lines = lines.map(function (line) {
      var chs = line.split('');
      chs = chs.map(function (ch) {
        return ch === ' ' ? 0 : 1;
      });
      while (chs.length < self.ratio.width) {
        chs.push(0);
      }
      return chs;
    });

    while (lines.length < self.ratio.height) {
      line = [];
      for (i = 0; i < self.ratio.width; i++) {
        line.push(0);
      }
      lines.push(line);
    }

    return lines;
  }

  font = Object.keys(data.glyphs).reduce(function (out, ch) {
    var lines = data.glyphs[ch].map;
    out[ch] = convertLetter(ch, lines);
    return out;
  }, {});

  delete font[' '];

  return font;
};

BigText.prototype.setContent = function (content) {
  this.content = '';
  this.text = content || '';
};

BigText.prototype.render = function () {
  if (this.position.width == null || this._shrinkWidth) {
    // if (this.width - this.iwidth < this.ratio.width * this.text.length + 1) {
    this.position.width = this.ratio.width * this.text.length + 1;
    this._shrinkWidth = true;
    // }
  }
  if (this.position.height == null || this._shrinkHeight) {
    // if (this.height - this.iheight < this.ratio.height + 0) {
    this.position.height = this.ratio.height + 0;
    this._shrinkHeight = true;
    // }
  }

  var coords = this._render();
  if (!coords) return;

  var lines = this.screen.lines,
      left = coords.xi + this.ileft,
      top = coords.yi + this.itop,
      right = coords.xl - this.iright,
      bottom = coords.yl - this.ibottom;

  var dattr = this.sattr(this.style),
      bg = dattr & 0x1ff,
      fg = dattr >> 9 & 0x1ff,
      flags = dattr >> 18 & 0x1ff,
      attr = flags << 18 | bg << 9 | fg;

  for (var x = left, i = 0; x < right; x += this.ratio.width, i++) {
    var ch = this.text[i];
    if (!ch) break;
    var map = this.font[ch];
    if (!map) continue;
    for (var y = top; y < Math.min(bottom, top + this.ratio.height); y++) {
      if (!lines[y]) continue;
      var mline = map[y - top];
      if (!mline) continue;
      for (var mx = 0; mx < this.ratio.width; mx++) {
        var mcell = mline[mx];
        if (mcell == null) break;
        if (this.fch && this.fch !== ' ') {
          lines[y][x + mx][0] = dattr;
          lines[y][x + mx][1] = mcell === 1 ? this.fch : this.ch;
        } else {
          lines[y][x + mx][0] = mcell === 1 ? attr : dattr;
          lines[y][x + mx][1] = mcell === 1 ? ' ' : this.ch;
        }
      }
      lines[y].dirty = true;
    }
  }

  return coords;
};

/**
 * Expose
 */

module.exports = BigText;
/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * filemanager.js - file manager element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var path = __webpack_require__(37),
    fs = __webpack_require__(10);

var helpers = __webpack_require__(3);

var Node = __webpack_require__(0);
var List = __webpack_require__(14);

/**
 * FileManager
 */

function FileManager(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new FileManager(options);
  }

  options = options || {};
  options.parseTags = true;
  // options.label = ' {blue-fg}%path{/blue-fg} ';

  List.call(this, options);

  this.cwd = options.cwd || process.cwd();
  this.file = this.cwd;
  this.value = this.cwd;

  if (options.label && ~options.label.indexOf('%path')) {
    this._label.setContent(options.label.replace('%path', this.cwd));
  }

  this.on('select', function (item) {
    var value = item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, ''),
        file = path.resolve(self.cwd, value);

    return fs.stat(file, function (err, stat) {
      if (err) {
        return self.emit('error', err, file);
      }
      self.file = file;
      self.value = file;
      if (stat.isDirectory()) {
        self.emit('cd', file, self.cwd);
        self.cwd = file;
        if (options.label && ~options.label.indexOf('%path')) {
          self._label.setContent(options.label.replace('%path', file));
        }
        self.refresh();
      } else {
        self.emit('file', file);
      }
    });
  });
}

FileManager.prototype.__proto__ = List.prototype;

FileManager.prototype.type = 'file-manager';

FileManager.prototype.refresh = function (cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }

  var self = this;

  if (cwd) this.cwd = cwd;else cwd = this.cwd;

  return fs.readdir(cwd, function (err, list) {
    if (err && err.code === 'ENOENT') {
      self.cwd = cwd !== process.env.HOME ? process.env.HOME : '/';
      return self.refresh(callback);
    }

    if (err) {
      if (callback) return callback(err);
      return self.emit('error', err, cwd);
    }

    var dirs = [],
        files = [];

    list.unshift('..');

    list.forEach(function (name) {
      var f = path.resolve(cwd, name),
          stat;

      try {
        stat = fs.lstatSync(f);
      } catch (e) {
        ;
      }

      if (stat && stat.isDirectory() || name === '..') {
        dirs.push({
          name: name,
          text: '{light-blue-fg}' + name + '{/light-blue-fg}/',
          dir: true
        });
      } else if (stat && stat.isSymbolicLink()) {
        files.push({
          name: name,
          text: '{light-cyan-fg}' + name + '{/light-cyan-fg}@',
          dir: false
        });
      } else {
        files.push({
          name: name,
          text: name,
          dir: false
        });
      }
    });

    dirs = helpers.asort(dirs);
    files = helpers.asort(files);

    list = dirs.concat(files).map(function (data) {
      return data.text;
    });

    self.setItems(list);
    self.select(0);
    self.screen.render();

    self.emit('refresh');

    if (callback) callback();
  });
};

FileManager.prototype.pick = function (cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }

  var self = this,
      focused = this.screen.focused === this,
      hidden = this.hidden,
      onfile,
      oncancel;

  function resume() {
    self.removeListener('file', onfile);
    self.removeListener('cancel', oncancel);
    if (hidden) {
      self.hide();
    }
    if (!focused) {
      self.screen.restoreFocus();
    }
    self.screen.render();
  }

  this.on('file', onfile = function onfile(file) {
    resume();
    return callback(null, file);
  });

  this.on('cancel', oncancel = function oncancel() {
    resume();
    return callback();
  });

  this.refresh(cwd, function (err) {
    if (err) return callback(err);

    if (hidden) {
      self.show();
    }

    if (!focused) {
      self.screen.saveFocus();
      self.focus();
    }

    self.screen.render();
  });
};

FileManager.prototype.reset = function (cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }
  this.cwd = cwd || this.options.cwd;
  this.refresh(callback);
};

/**
 * Expose
 */

module.exports = FileManager;

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * form.js - form element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Form
 */

function Form(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Form(options);
  }

  options = options || {};

  options.ignoreKeys = true;
  Box.call(this, options);

  if (options.keys) {
    this.screen._listenKeys(this);
    this.on('element keypress', function (el, ch, key) {
      if (key.name === 'tab' && !key.shift || el.type === 'textbox' && options.autoNext && key.name === 'enter' || key.name === 'down' || options.vi && key.name === 'j') {
        if (el.type === 'textbox' || el.type === 'textarea') {
          if (key.name === 'j') return;
          if (key.name === 'tab') {
            // Workaround, since we can't stop the tab from being added.
            el.emit('keypress', null, { name: 'backspace' });
          }
          el.emit('keypress', '\x1b', { name: 'escape' });
        }
        self.focusNext();
        return;
      }

      if (key.name === 'tab' && key.shift || key.name === 'up' || options.vi && key.name === 'k') {
        if (el.type === 'textbox' || el.type === 'textarea') {
          if (key.name === 'k') return;
          el.emit('keypress', '\x1b', { name: 'escape' });
        }
        self.focusPrevious();
        return;
      }

      if (key.name === 'escape') {
        self.focus();
        return;
      }
    });
  }
}

Form.prototype.__proto__ = Box.prototype;

Form.prototype.type = 'form';

Form.prototype._refresh = function () {
  // XXX Possibly remove this if statement and refresh on every focus.
  // Also potentially only include *visible* focusable elements.
  // This would remove the need to check for _selected.visible in previous()
  // and next().
  if (!this._children) {
    var out = [];

    this.children.forEach(function fn(el) {
      if (el.keyable) out.push(el);
      el.children.forEach(fn);
    });

    this._children = out;
  }
};

Form.prototype._visible = function () {
  return !!this._children.filter(function (el) {
    return el.visible;
  }).length;
};

Form.prototype.next = function () {
  this._refresh();

  if (!this._visible()) return;

  if (!this._selected) {
    this._selected = this._children[0];
    if (!this._selected.visible) return this.next();
    if (this.screen.focused !== this._selected) return this._selected;
  }

  var i = this._children.indexOf(this._selected);
  if (!~i || !this._children[i + 1]) {
    this._selected = this._children[0];
    if (!this._selected.visible) return this.next();
    return this._selected;
  }

  this._selected = this._children[i + 1];
  if (!this._selected.visible) return this.next();
  return this._selected;
};

Form.prototype.previous = function () {
  this._refresh();

  if (!this._visible()) return;

  if (!this._selected) {
    this._selected = this._children[this._children.length - 1];
    if (!this._selected.visible) return this.previous();
    if (this.screen.focused !== this._selected) return this._selected;
  }

  var i = this._children.indexOf(this._selected);
  if (!~i || !this._children[i - 1]) {
    this._selected = this._children[this._children.length - 1];
    if (!this._selected.visible) return this.previous();
    return this._selected;
  }

  this._selected = this._children[i - 1];
  if (!this._selected.visible) return this.previous();
  return this._selected;
};

Form.prototype.focusNext = function () {
  var next = this.next();
  if (next) next.focus();
};

Form.prototype.focusPrevious = function () {
  var previous = this.previous();
  if (previous) previous.focus();
};

Form.prototype.resetSelected = function () {
  this._selected = null;
};

Form.prototype.focusFirst = function () {
  this.resetSelected();
  this.focusNext();
};

Form.prototype.focusLast = function () {
  this.resetSelected();
  this.focusPrevious();
};

Form.prototype.submit = function () {
  var out = {};

  this.children.forEach(function fn(el) {
    if (el.value != null) {
      var name = el.name || el.type;
      if (Array.isArray(out[name])) {
        out[name].push(el.value);
      } else if (out[name]) {
        out[name] = [out[name], el.value];
      } else {
        out[name] = el.value;
      }
    }
    el.children.forEach(fn);
  });

  this.emit('submit', out);

  return this.submission = out;
};

Form.prototype.cancel = function () {
  this.emit('cancel');
};

Form.prototype.reset = function () {
  this.children.forEach(function fn(el) {
    switch (el.type) {
      case 'screen':
        break;
      case 'box':
        break;
      case 'text':
        break;
      case 'line':
        break;
      case 'scrollable-box':
        break;
      case 'list':
        el.select(0);
        return;
      case 'form':
        break;
      case 'input':
        break;
      case 'textbox':
        el.clearInput();
        return;
      case 'textarea':
        el.clearInput();
        return;
      case 'button':
        delete el.value;
        break;
      case 'progress-bar':
        el.setProgress(0);
        break;
      case 'file-manager':
        el.refresh(el.options.cwd);
        return;
      case 'checkbox':
        el.uncheck();
        return;
      case 'radio-set':
        break;
      case 'radio-button':
        el.uncheck();
        return;
      case 'prompt':
        break;
      case 'question':
        break;
      case 'message':
        break;
      case 'info':
        break;
      case 'loading':
        break;
      case 'list-bar':
        //el.select(0);
        break;
      case 'dir-manager':
        el.refresh(el.options.cwd);
        return;
      case 'terminal':
        el.write('');
        return;
      case 'image':
        //el.clearImage();
        return;
    }
    el.children.forEach(fn);
  });

  this.emit('reset');
};

/**
 * Expose
 */

module.exports = Form;

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * image.js - image element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Image
 */

function Image(options) {
  if (!(this instanceof Node)) {
    return new Image(options);
  }

  options = options || {};
  options.type = options.itype || options.type || 'ansi';

  Box.call(this, options);

  if (options.type === 'ansi' && this.type !== 'ansiimage') {
    var ANSIImage = __webpack_require__(19);
    Object.getOwnPropertyNames(ANSIImage.prototype).forEach(function (key) {
      if (key === 'type') return;
      Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(ANSIImage.prototype, key));
    }, this);
    ANSIImage.call(this, options);
    return this;
  }

  if (options.type === 'overlay' && this.type !== 'overlayimage') {
    var OverlayImage = __webpack_require__(22);
    Object.getOwnPropertyNames(OverlayImage.prototype).forEach(function (key) {
      if (key === 'type') return;
      Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(OverlayImage.prototype, key));
    }, this);
    OverlayImage.call(this, options);
    return this;
  }

  throw new Error('`type` must either be `ansi` or `overlay`.');
}

Image.prototype.__proto__ = Box.prototype;

Image.prototype.type = 'image';

/**
 * Expose
 */

module.exports = Image;

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * layout.js - layout element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Element = __webpack_require__(4);

/**
 * Layout
 */

function Layout(options) {
  if (!(this instanceof Node)) {
    return new Layout(options);
  }

  options = options || {};

  if (options.width == null && options.left == null && options.right == null || options.height == null && options.top == null && options.bottom == null) {
    throw new Error('`Layout` must have a width and height!');
  }

  options.layout = options.layout || 'inline';

  Element.call(this, options);

  if (options.renderer) {
    this.renderer = options.renderer;
  }
}

Layout.prototype.__proto__ = Element.prototype;

Layout.prototype.type = 'layout';

Layout.prototype.isRendered = function (el) {
  if (!el.lpos) return false;
  return el.lpos.xl - el.lpos.xi > 0 && el.lpos.yl - el.lpos.yi > 0;
};

Layout.prototype.getLast = function (i) {
  while (this.children[--i]) {
    var el = this.children[i];
    if (this.isRendered(el)) return el;
  }
};

Layout.prototype.getLastCoords = function (i) {
  var last = this.getLast(i);
  if (last) return last.lpos;
};

Layout.prototype._renderCoords = function () {
  var coords = this._getCoords(true);
  var children = this.children;
  this.children = [];
  this._render();
  this.children = children;
  return coords;
};

Layout.prototype.renderer = function (coords) {
  var self = this;

  // The coordinates of the layout element
  var width = coords.xl - coords.xi,
      height = coords.yl - coords.yi,
      xi = coords.xi,
      yi = coords.yi;

  // The current row offset in cells (which row are we on?)
  var rowOffset = 0;

  // The index of the first child in the row
  var rowIndex = 0;
  var lastRowIndex = 0;

  // Figure out the highest width child
  if (this.options.layout === 'grid') {
    var highWidth = this.children.reduce(function (out, el) {
      out = Math.max(out, el.width);
      return out;
    }, 0);
  }

  return function iterator(el, i) {
    // Make our children shrinkable. If they don't have a height, for
    // example, calculate it for them.
    el.shrink = true;

    // Find the previous rendered child's coordinates
    var last = self.getLast(i);

    // If there is no previously rendered element, we are on the first child.
    if (!last) {
      el.position.left = 0;
      el.position.top = 0;
    } else {
      // Otherwise, figure out where to place this child. We'll start by
      // setting it's `left`/`x` coordinate to right after the previous
      // rendered element. This child will end up directly to the right of it.
      el.position.left = last.lpos.xl - xi;

      // Make sure the position matches the highest width element
      if (self.options.layout === 'grid') {
        // Compensate with width:
        // el.position.width = el.width + (highWidth - el.width);
        // Compensate with position:
        el.position.left += highWidth - (last.lpos.xl - last.lpos.xi);
      }

      // If our child does not overlap the right side of the Layout, set it's
      // `top`/`y` to the current `rowOffset` (the coordinate for the current
      // row).
      if (el.position.left + el.width <= width) {
        el.position.top = rowOffset;
      } else {
        // Otherwise we need to start a new row and calculate a new
        // `rowOffset` and `rowIndex` (the index of the child on the current
        // row).
        rowOffset += self.children.slice(rowIndex, i).reduce(function (out, el) {
          if (!self.isRendered(el)) return out;
          out = Math.max(out, el.lpos.yl - el.lpos.yi);
          return out;
        }, 0);
        lastRowIndex = rowIndex;
        rowIndex = i;
        el.position.left = 0;
        el.position.top = rowOffset;
      }
    }

    // Make sure the elements on lower rows graviatate up as much as possible
    if (self.options.layout === 'inline') {
      var above = null;
      var abovea = Infinity;
      for (var j = lastRowIndex; j < rowIndex; j++) {
        var l = self.children[j];
        if (!self.isRendered(l)) continue;
        var abs = Math.abs(el.position.left - (l.lpos.xi - xi));
        // if (abs < abovea && (l.lpos.xl - l.lpos.xi) <= el.width) {
        if (abs < abovea) {
          above = l;
          abovea = abs;
        }
      }
      if (above) {
        el.position.top = above.lpos.yl - yi;
      }
    }

    // If our child overflows the Layout, do not render it!
    // Disable this feature for now.
    if (el.position.top + el.height > height) {
      // Returning false tells blessed to ignore this child.
      // return false;
    }
  };
};

Layout.prototype.render = function () {
  this._emit('prerender');

  var coords = this._renderCoords();
  if (!coords) {
    delete this.lpos;
    return;
  }

  if (coords.xl - coords.xi <= 0) {
    coords.xl = Math.max(coords.xl, coords.xi);
    return;
  }

  if (coords.yl - coords.yi <= 0) {
    coords.yl = Math.max(coords.yl, coords.yi);
    return;
  }

  this.lpos = coords;

  if (this.border) coords.xi++, coords.xl--, coords.yi++, coords.yl--;
  if (this.tpadding) {
    coords.xi += this.padding.left, coords.xl -= this.padding.right;
    coords.yi += this.padding.top, coords.yl -= this.padding.bottom;
  }

  var iterator = this.renderer(coords);

  if (this.border) coords.xi--, coords.xl++, coords.yi--, coords.yl++;
  if (this.tpadding) {
    coords.xi -= this.padding.left, coords.xl += this.padding.right;
    coords.yi -= this.padding.top, coords.yl += this.padding.bottom;
  }

  this.children.forEach(function (el, i) {
    if (el.screen._ci !== -1) {
      el.index = el.screen._ci++;
    }
    var rendered = iterator(el, i);
    if (rendered === false) {
      delete el.lpos;
      return;
    }
    // if (el.screen._rendering) {
    //   el._rendering = true;
    // }
    el.render();
    // if (el.screen._rendering) {
    //   el._rendering = false;
    // }
  });

  this._emit('render', [coords]);

  return coords;
};

/**
 * Expose
 */

module.exports = Layout;

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * line.js - line element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Line
 */

function Line(options) {
  if (!(this instanceof Node)) {
    return new Line(options);
  }

  options = options || {};

  var orientation = options.orientation || 'vertical';
  delete options.orientation;

  if (orientation === 'vertical') {
    options.width = 1;
  } else {
    options.height = 1;
  }

  Box.call(this, options);

  this.ch = !options.type || options.type === 'line' ? orientation === 'horizontal' ? '─' : '│' : options.ch || ' ';

  this.border = {
    type: 'bg',
    __proto__: this
  };

  this.style.border = this.style;
}

Line.prototype.__proto__ = Box.prototype;

Line.prototype.type = 'line';

/**
 * Expose
 */

module.exports = Line;

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * listbar.js - listbar element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var helpers = __webpack_require__(3);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Listbar / HorizontalList
 */

function Listbar(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Listbar(options);
  }

  options = options || {};

  this.items = [];
  this.ritems = [];
  this.commands = [];

  this.leftBase = 0;
  this.leftOffset = 0;

  this.mouse = options.mouse || false;

  Box.call(this, options);

  if (!this.style.selected) {
    this.style.selected = {};
  }

  if (!this.style.item) {
    this.style.item = {};
  }

  if (options.commands || options.items) {
    this.setItems(options.commands || options.items);
  }

  if (options.keys) {
    this.on('keypress', function (ch, key) {
      if (key.name === 'left' || options.vi && key.name === 'h' || key.shift && key.name === 'tab') {
        self.moveLeft();
        self.screen.render();
        // Stop propagation if we're in a form.
        if (key.name === 'tab') return false;
        return;
      }
      if (key.name === 'right' || options.vi && key.name === 'l' || key.name === 'tab') {
        self.moveRight();
        self.screen.render();
        // Stop propagation if we're in a form.
        if (key.name === 'tab') return false;
        return;
      }
      if (key.name === 'enter' || options.vi && key.name === 'k' && !key.shift) {
        self.emit('action', self.items[self.selected], self.selected);
        self.emit('select', self.items[self.selected], self.selected);
        var item = self.items[self.selected];
        if (item._.cmd.callback) {
          item._.cmd.callback();
        }
        self.screen.render();
        return;
      }
      if (key.name === 'escape' || options.vi && key.name === 'q') {
        self.emit('action');
        self.emit('cancel');
        return;
      }
    });
  }

  if (options.autoCommandKeys) {
    this.onScreenEvent('keypress', function (ch) {
      if (/^[0-9]$/.test(ch)) {
        var i = +ch - 1;
        if (!~i) i = 9;
        return self.selectTab(i);
      }
    });
  }

  this.on('focus', function () {
    self.select(self.selected);
  });
}

Listbar.prototype.__proto__ = Box.prototype;

Listbar.prototype.type = 'listbar';

Listbar.prototype.__defineGetter__('selected', function () {
  return this.leftBase + this.leftOffset;
});

Listbar.prototype.setItems = function (commands) {
  var self = this;

  if (!Array.isArray(commands)) {
    commands = Object.keys(commands).reduce(function (obj, key, i) {
      var cmd = commands[key],
          cb;

      if (typeof cmd === 'function') {
        cb = cmd;
        cmd = { callback: cb };
      }

      if (cmd.text == null) cmd.text = key;
      if (cmd.prefix == null) cmd.prefix = ++i + '';

      if (cmd.text == null && cmd.callback) {
        cmd.text = cmd.callback.name;
      }

      obj.push(cmd);

      return obj;
    }, []);
  }

  this.items.forEach(function (el) {
    el.detach();
  });

  this.items = [];
  this.ritems = [];
  this.commands = [];

  commands.forEach(function (cmd) {
    self.add(cmd);
  });

  this.emit('set items');
};

Listbar.prototype.add = Listbar.prototype.addItem = Listbar.prototype.appendItem = function (item, callback) {
  var self = this,
      prev = this.items[this.items.length - 1],
      drawn,
      cmd,
      title,
      len;

  if (!this.parent) {
    drawn = 0;
  } else {
    drawn = prev ? prev.aleft + prev.width : 0;
    if (!this.screen.autoPadding) {
      drawn += this.ileft;
    }
  }

  if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
    cmd = item;
    if (cmd.prefix == null) cmd.prefix = this.items.length + 1 + '';
  }

  if (typeof item === 'string') {
    cmd = {
      prefix: this.items.length + 1 + '',
      text: item,
      callback: callback
    };
  }

  if (typeof item === 'function') {
    cmd = {
      prefix: this.items.length + 1 + '',
      text: item.name,
      callback: item
    };
  }

  if (cmd.keys && cmd.keys[0]) {
    cmd.prefix = cmd.keys[0];
  }

  var t = helpers.generateTags(this.style.prefix || { fg: 'lightblack' });

  title = (cmd.prefix != null ? t.open + cmd.prefix + t.close + ':' : '') + cmd.text;

  len = ((cmd.prefix != null ? cmd.prefix + ':' : '') + cmd.text).length;

  var options = {
    screen: this.screen,
    top: 0,
    left: drawn + 1,
    height: 1,
    content: title,
    width: len + 2,
    align: 'center',
    autoFocus: false,
    tags: true,
    mouse: true,
    style: helpers.merge({}, this.style.item),
    noOverflow: true
  };

  if (!this.screen.autoPadding) {
    options.top += this.itop;
    options.left += this.ileft;
  }

  ['bg', 'fg', 'bold', 'underline', 'blink', 'inverse', 'invisible'].forEach(function (name) {
    options.style[name] = function () {
      var attr = self.items[self.selected] === el ? self.style.selected[name] : self.style.item[name];
      if (typeof attr === 'function') attr = attr(el);
      return attr;
    };
  });

  var el = new Box(options);

  this._[cmd.text] = el;
  cmd.element = el;
  el._.cmd = cmd;

  this.ritems.push(cmd.text);
  this.items.push(el);
  this.commands.push(cmd);
  this.append(el);

  if (cmd.callback) {
    if (cmd.keys) {
      this.screen.key(cmd.keys, function () {
        self.emit('action', el, self.selected);
        self.emit('select', el, self.selected);
        if (el._.cmd.callback) {
          el._.cmd.callback();
        }
        self.select(el);
        self.screen.render();
      });
    }
  }

  if (this.items.length === 1) {
    this.select(0);
  }

  // XXX May be affected by new element.options.mouse option.
  if (this.mouse) {
    el.on('click', function () {
      self.emit('action', el, self.selected);
      self.emit('select', el, self.selected);
      if (el._.cmd.callback) {
        el._.cmd.callback();
      }
      self.select(el);
      self.screen.render();
    });
  }

  this.emit('add item');
};

Listbar.prototype.render = function () {
  var self = this,
      drawn = 0;

  if (!this.screen.autoPadding) {
    drawn += this.ileft;
  }

  this.items.forEach(function (el, i) {
    if (i < self.leftBase) {
      el.hide();
    } else {
      el.rleft = drawn + 1;
      drawn += el.width + 2;
      el.show();
    }
  });

  return this._render();
};

Listbar.prototype.select = function (offset) {
  if (typeof offset !== 'number') {
    offset = this.items.indexOf(offset);
  }

  if (offset < 0) {
    offset = 0;
  } else if (offset >= this.items.length) {
    offset = this.items.length - 1;
  }

  if (!this.parent) {
    this.emit('select item', this.items[offset], offset);
    return;
  }

  var lpos = this._getCoords();
  if (!lpos) return;

  var self = this,
      width = lpos.xl - lpos.xi - this.iwidth,
      drawn = 0,
      visible = 0,
      el;

  el = this.items[offset];
  if (!el) return;

  this.items.forEach(function (el, i) {
    if (i < self.leftBase) return;

    var lpos = el._getCoords();
    if (!lpos) return;

    if (lpos.xl - lpos.xi <= 0) return;

    drawn += lpos.xl - lpos.xi + 2;

    if (drawn <= width) visible++;
  });

  var diff = offset - (this.leftBase + this.leftOffset);
  if (offset > this.leftBase + this.leftOffset) {
    if (offset > this.leftBase + visible - 1) {
      this.leftOffset = 0;
      this.leftBase = offset;
    } else {
      this.leftOffset += diff;
    }
  } else if (offset < this.leftBase + this.leftOffset) {
    diff = -diff;
    if (offset < this.leftBase) {
      this.leftOffset = 0;
      this.leftBase = offset;
    } else {
      this.leftOffset -= diff;
    }
  }

  // XXX Move `action` and `select` events here.
  this.emit('select item', el, offset);
};

Listbar.prototype.removeItem = function (child) {
  var i = typeof child !== 'number' ? this.items.indexOf(child) : child;

  if (~i && this.items[i]) {
    child = this.items.splice(i, 1)[0];
    this.ritems.splice(i, 1);
    this.commands.splice(i, 1);
    this.remove(child);
    if (i === this.selected) {
      this.select(i - 1);
    }
  }

  this.emit('remove item');
};

Listbar.prototype.move = function (offset) {
  this.select(this.selected + offset);
};

Listbar.prototype.moveLeft = function (offset) {
  this.move(-(offset || 1));
};

Listbar.prototype.moveRight = function (offset) {
  this.move(offset || 1);
};

Listbar.prototype.selectTab = function (index) {
  var item = this.items[index];
  if (item) {
    if (item._.cmd.callback) {
      item._.cmd.callback();
    }
    this.select(index);
    this.screen.render();
  }
  this.emit('select tab', item, index);
};

/**
 * Expose
 */

module.exports = Listbar;

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * listtable.js - list table element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);
var List = __webpack_require__(14);
var Table = __webpack_require__(24);

/**
 * ListTable
 */

function ListTable(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new ListTable(options);
  }

  options = options || {};
  options.shrink = true;
  options.normalShrink = true;
  options.style = options.style || {};
  options.style.border = options.style.border || {};
  options.style.header = options.style.header || {};
  options.style.cell = options.style.cell || {};
  this.__align = options.align || 'center';
  delete options.align;

  options.style.selected = options.style.cell.selected;
  options.style.item = options.style.cell;

  List.call(this, options);

  this._header = new Box({
    parent: this,
    left: this.screen.autoPadding ? 0 : this.ileft,
    top: 0,
    width: 'shrink',
    height: 1,
    style: options.style.header,
    tags: options.parseTags || options.tags
  });

  this.on('scroll', function () {
    self._header.setFront();
    self._header.rtop = self.childBase;
    if (!self.screen.autoPadding) {
      self._header.rtop = self.childBase + (self.border ? 1 : 0);
    }
  });

  this.pad = options.pad != null ? options.pad : 2;

  this.setData(options.rows || options.data);

  this.on('attach', function () {
    self.setData(self.rows);
  });

  this.on('resize', function () {
    var selected = self.selected;
    self.setData(self.rows);
    self.select(selected);
    self.screen.render();
  });
}

ListTable.prototype.__proto__ = List.prototype;

ListTable.prototype.type = 'list-table';

ListTable.prototype._calculateMaxes = Table.prototype._calculateMaxes;

ListTable.prototype.setRows = ListTable.prototype.setData = function (rows) {
  var self = this,
      align = this.__align;

  if (this.visible && this.lpos) {
    this.clearPos();
  }

  this.clearItems();

  this.rows = rows || [];

  this._calculateMaxes();

  if (!this._maxes) return;

  this.addItem('');

  this.rows.forEach(function (row, i) {
    var isHeader = i === 0;
    var text = '';
    row.forEach(function (cell, i) {
      var width = self._maxes[i];
      var clen = self.strWidth(cell);

      if (i !== 0) {
        text += ' ';
      }

      while (clen < width) {
        if (align === 'center') {
          cell = ' ' + cell + ' ';
          clen += 2;
        } else if (align === 'left') {
          cell = cell + ' ';
          clen += 1;
        } else if (align === 'right') {
          cell = ' ' + cell;
          clen += 1;
        }
      }

      if (clen > width) {
        if (align === 'center') {
          cell = cell.substring(1);
          clen--;
        } else if (align === 'left') {
          cell = cell.slice(0, -1);
          clen--;
        } else if (align === 'right') {
          cell = cell.substring(1);
          clen--;
        }
      }

      text += cell;
    });
    if (isHeader) {
      self._header.setContent(text);
    } else {
      self.addItem(text);
    }
  });

  this._header.setFront();

  this.select(0);
};

ListTable.prototype._select = ListTable.prototype.select;
ListTable.prototype.select = function (i) {
  if (i === 0) {
    i = 1;
  }
  if (i <= this.childBase) {
    this.setScroll(this.childBase - 1);
  }
  return this._select(i);
};

ListTable.prototype.render = function () {
  var self = this;

  var coords = this._render();
  if (!coords) return;

  this._calculateMaxes();

  if (!this._maxes) return coords;

  var lines = this.screen.lines,
      xi = coords.xi,
      yi = coords.yi,
      rx,
      ry,
      i;

  var battr = this.sattr(this.style.border);

  var height = coords.yl - coords.yi - this.ibottom;

  if (!this.border || this.options.noCellBorders) return coords;

  // Draw border with correct angles.
  ry = 0;
  for (i = 0; i < height + 1; i++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.slice(0, -1).forEach(function (max) {
      rx += max;
      if (!lines[yi + ry][xi + rx + 1]) return;
      // center
      if (ry === 0) {
        // top
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u252C'; // '┬'
        // XXX If we alter iheight and itop for no borders - nothing should be written here
        if (!self.border.top) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
        lines[yi + ry].dirty = true;
      } else if (ry === height) {
        // bottom
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u2534'; // '┴'
        // XXX If we alter iheight and ibottom for no borders - nothing should be written here
        if (!self.border.bottom) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
        lines[yi + ry].dirty = true;
      } else {
        // middle
        rx++;
      }
    });
    ry += 1;
  }

  // Draw internal borders.
  for (ry = 1; ry < height; ry++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.slice(0, -1).forEach(function (max) {
      rx += max;
      if (!lines[yi + ry][xi + rx + 1]) return;
      if (self.options.fillCellBorders !== false) {
        var lbg = lines[yi + ry][xi + rx][0] & 0x1ff;
        rx++;
        lines[yi + ry][xi + rx][0] = battr & ~0x1ff | lbg;
      } else {
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
      }
      lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
      lines[yi + ry].dirty = true;
    });
  }

  return coords;
};

/**
 * Expose
 */

module.exports = ListTable;

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * loading.js - loading element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);
var Text = __webpack_require__(26);

/**
 * Loading
 */

function Loading(options) {
  if (!(this instanceof Node)) {
    return new Loading(options);
  }

  options = options || {};

  Box.call(this, options);

  this._.icon = new Text({
    parent: this,
    align: 'center',
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    content: '|'
  });
}

Loading.prototype.__proto__ = Box.prototype;

Loading.prototype.type = 'loading';

Loading.prototype.load = function (text) {
  var self = this;

  // XXX Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(text);

  if (this._.timer) {
    this.stop();
  }

  this.screen.lockKeys = true;

  this._.timer = setInterval(function () {
    if (self._.icon.content === '|') {
      self._.icon.setContent('/');
    } else if (self._.icon.content === '/') {
      self._.icon.setContent('-');
    } else if (self._.icon.content === '-') {
      self._.icon.setContent('\\');
    } else if (self._.icon.content === '\\') {
      self._.icon.setContent('|');
    }
    self.screen.render();
  }, 200);
};

Loading.prototype.stop = function () {
  this.screen.lockKeys = false;
  this.hide();
  if (this._.timer) {
    clearInterval(this._.timer);
    delete this._.timer;
  }
  this.screen.render();
};

/**
 * Expose
 */

module.exports = Loading;

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * message.js - message element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * Message / Error
 */

function Message(options) {
  if (!(this instanceof Node)) {
    return new Message(options);
  }

  options = options || {};
  options.tags = true;

  Box.call(this, options);
}

Message.prototype.__proto__ = Box.prototype;

Message.prototype.type = 'message';

Message.prototype.log = Message.prototype.display = function (text, time, callback) {
  var self = this;

  if (typeof time === 'function') {
    callback = time;
    time = null;
  }

  if (time == null) time = 3;

  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  if (this.scrollable) {
    this.screen.saveFocus();
    this.focus();
    this.scrollTo(0);
  }

  this.show();
  this.setContent(text);
  this.screen.render();

  if (time === Infinity || time === -1 || time === 0) {
    var end = function end() {
      if (end.done) return;
      end.done = true;
      if (self.scrollable) {
        try {
          self.screen.restoreFocus();
        } catch (e) {
          ;
        }
      }
      self.hide();
      self.screen.render();
      if (callback) callback();
    };

    setTimeout(function () {
      self.onScreenEvent('keypress', function fn(ch, key) {
        if (key.name === 'mouse') return;
        if (self.scrollable) {
          if (key.name === 'up' || self.options.vi && key.name === 'k' || key.name === 'down' || self.options.vi && key.name === 'j' || self.options.vi && key.name === 'u' && key.ctrl || self.options.vi && key.name === 'd' && key.ctrl || self.options.vi && key.name === 'b' && key.ctrl || self.options.vi && key.name === 'f' && key.ctrl || self.options.vi && key.name === 'g' && !key.shift || self.options.vi && key.name === 'g' && key.shift) {
            return;
          }
        }
        if (self.options.ignoreKeys && ~self.options.ignoreKeys.indexOf(key.name)) {
          return;
        }
        self.removeScreenEvent('keypress', fn);
        end();
      });
      // XXX May be affected by new element.options.mouse option.
      if (!self.options.mouse) return;
      self.onScreenEvent('mouse', function fn(data) {
        if (data.action === 'mousemove') return;
        self.removeScreenEvent('mouse', fn);
        end();
      });
    }, 10);

    return;
  }

  setTimeout(function () {
    self.hide();
    self.screen.render();
    if (callback) callback();
  }, time * 1000);
};

Message.prototype.error = function (text, time, callback) {
  return this.display('{red-fg}Error: ' + text + '{/red-fg}', time, callback);
};

/**
 * Expose
 */

module.exports = Message;

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * progressbar.js - progress bar element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Input = __webpack_require__(9);

/**
 * ProgressBar
 */

function ProgressBar(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new ProgressBar(options);
  }

  options = options || {};

  Input.call(this, options);

  this.filled = options.filled || 0;
  if (typeof this.filled === 'string') {
    this.filled = +this.filled.slice(0, -1);
  }
  this.value = this.filled;

  this.pch = options.pch || ' ';

  // XXX Workaround that predates the usage of `el.ch`.
  if (options.ch) {
    this.pch = options.ch;
    this.ch = ' ';
  }
  if (options.bch) {
    this.ch = options.bch;
  }

  if (!this.style.bar) {
    this.style.bar = {};
    this.style.bar.fg = options.barFg;
    this.style.bar.bg = options.barBg;
  }

  this.orientation = options.orientation || 'horizontal';

  if (options.keys) {
    this.on('keypress', function (ch, key) {
      var back, forward;
      if (self.orientation === 'horizontal') {
        back = ['left', 'h'];
        forward = ['right', 'l'];
      } else if (self.orientation === 'vertical') {
        back = ['down', 'j'];
        forward = ['up', 'k'];
      }
      if (key.name === back[0] || options.vi && key.name === back[1]) {
        self.progress(-5);
        self.screen.render();
        return;
      }
      if (key.name === forward[0] || options.vi && key.name === forward[1]) {
        self.progress(5);
        self.screen.render();
        return;
      }
    });
  }

  if (options.mouse) {
    this.on('click', function (data) {
      var x, y, m, p;
      if (!self.lpos) return;
      if (self.orientation === 'horizontal') {
        x = data.x - self.lpos.xi;
        m = self.lpos.xl - self.lpos.xi - self.iwidth;
        p = x / m * 100 | 0;
      } else if (self.orientation === 'vertical') {
        y = data.y - self.lpos.yi;
        m = self.lpos.yl - self.lpos.yi - self.iheight;
        p = y / m * 100 | 0;
      }
      self.setProgress(p);
    });
  }
}

ProgressBar.prototype.__proto__ = Input.prototype;

ProgressBar.prototype.type = 'progress-bar';

ProgressBar.prototype.render = function () {
  var ret = this._render();
  if (!ret) return;

  var xi = ret.xi,
      xl = ret.xl,
      yi = ret.yi,
      yl = ret.yl,
      dattr;

  if (this.border) xi++, yi++, xl--, yl--;

  if (this.orientation === 'horizontal') {
    xl = xi + (xl - xi) * (this.filled / 100) | 0;
  } else if (this.orientation === 'vertical') {
    yi = yi + (yl - yi - ((yl - yi) * (this.filled / 100) | 0));
  }

  dattr = this.sattr(this.style.bar);

  this.screen.fillRegion(dattr, this.pch, xi, xl, yi, yl);

  if (this.content) {
    var line = this.screen.lines[yi];
    for (var i = 0; i < this.content.length; i++) {
      line[xi + i][1] = this.content[i];
    }
    line.dirty = true;
  }

  return ret;
};

ProgressBar.prototype.progress = function (filled) {
  this.filled += filled;
  if (this.filled < 0) this.filled = 0;else if (this.filled > 100) this.filled = 100;
  if (this.filled === 100) {
    this.emit('complete');
  }
  this.value = this.filled;
};

ProgressBar.prototype.setProgress = function (filled) {
  this.filled = 0;
  this.progress(filled);
};

ProgressBar.prototype.reset = function () {
  this.emit('reset');
  this.filled = 0;
  this.value = this.filled;
};

/**
 * Expose
 */

module.exports = ProgressBar;

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * prompt.js - prompt element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);
var Button = __webpack_require__(13);
var Textbox = __webpack_require__(28);

/**
 * Prompt
 */

function Prompt(options) {
  if (!(this instanceof Node)) {
    return new Prompt(options);
  }

  options = options || {};

  options.hidden = true;

  Box.call(this, options);

  this._.input = new Textbox({
    parent: this,
    top: 3,
    height: 1,
    left: 2,
    right: 2,
    bg: 'black'
  });

  this._.okay = new Button({
    parent: this,
    top: 5,
    height: 1,
    left: 2,
    width: 6,
    content: 'Okay',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  this._.cancel = new Button({
    parent: this,
    top: 5,
    height: 1,
    shrink: true,
    left: 10,
    width: 8,
    content: 'Cancel',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });
}

Prompt.prototype.__proto__ = Box.prototype;

Prompt.prototype.type = 'prompt';

Prompt.prototype.input = Prompt.prototype.setInput = Prompt.prototype.readInput = function (text, value, callback) {
  var self = this;
  var okay, cancel;

  if (!callback) {
    callback = value;
    value = '';
  }

  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(' ' + text);

  this._.input.value = value;

  this.screen.saveFocus();

  this._.okay.on('press', okay = function okay() {
    self._.input.submit();
  });

  this._.cancel.on('press', cancel = function cancel() {
    self._.input.cancel();
  });

  this._.input.readInput(function (err, data) {
    self.hide();
    self.screen.restoreFocus();
    self._.okay.removeListener('press', okay);
    self._.cancel.removeListener('press', cancel);
    return callback(err, data);
  });

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Prompt;

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * question.js - question element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);
var Button = __webpack_require__(13);

/**
 * Question
 */

function Question(options) {
  if (!(this instanceof Node)) {
    return new Question(options);
  }

  options = options || {};
  options.hidden = true;

  Box.call(this, options);

  this._.okay = new Button({
    screen: this.screen,
    parent: this,
    top: 2,
    height: 1,
    left: 2,
    width: 6,
    content: 'Okay',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  this._.cancel = new Button({
    screen: this.screen,
    parent: this,
    top: 2,
    height: 1,
    shrink: true,
    left: 10,
    width: 8,
    content: 'Cancel',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });
}

Question.prototype.__proto__ = Box.prototype;

Question.prototype.type = 'question';

Question.prototype.ask = function (text, callback) {
  var self = this;
  var press, okay, cancel;

  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(' ' + text);

  this.onScreenEvent('keypress', press = function press(ch, key) {
    if (key.name === 'mouse') return;
    if (key.name !== 'enter' && key.name !== 'escape' && key.name !== 'q' && key.name !== 'y' && key.name !== 'n') {
      return;
    }
    done(null, key.name === 'enter' || key.name === 'y');
  });

  this._.okay.on('press', okay = function okay() {
    done(null, true);
  });

  this._.cancel.on('press', cancel = function cancel() {
    done(null, false);
  });

  this.screen.saveFocus();
  this.focus();

  function done(err, data) {
    self.hide();
    self.screen.restoreFocus();
    self.removeScreenEvent('keypress', press);
    self._.okay.removeListener('press', okay);
    self._.cancel.removeListener('press', cancel);
    return callback(err, data);
  }

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Question;

/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * radiobutton.js - radio button element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Checkbox = __webpack_require__(20);

/**
 * RadioButton
 */

function RadioButton(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new RadioButton(options);
  }

  options = options || {};

  Checkbox.call(this, options);

  this.on('check', function () {
    var el = self;
    while (el = el.parent) {
      if (el.type === 'radio-set' || el.type === 'form') break;
    }
    el = el || self.parent;
    el.forDescendants(function (el) {
      if (el.type !== 'radio-button' || el === self) {
        return;
      }
      el.uncheck();
    });
  });
}

RadioButton.prototype.__proto__ = Checkbox.prototype;

RadioButton.prototype.type = 'radio-button';

RadioButton.prototype.render = function () {
  this.clearPos(true);
  this.setContent('(' + (this.checked ? '*' : ' ') + ') ' + this.text, true);
  return this._render();
};

RadioButton.prototype.toggle = RadioButton.prototype.check;

/**
 * Expose
 */

module.exports = RadioButton;

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * radioset.js - radio set element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);

/**
 * RadioSet
 */

function RadioSet(options) {
  if (!(this instanceof Node)) {
    return new RadioSet(options);
  }
  options = options || {};
  // Possibly inherit parent's style.
  // options.style = this.parent.style;
  Box.call(this, options);
}

RadioSet.prototype.__proto__ = Box.prototype;

RadioSet.prototype.type = 'radio-set';

/**
 * Expose
 */

module.exports = RadioSet;

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * video.js - video element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var cp = __webpack_require__(8);

var Node = __webpack_require__(0);
var Box = __webpack_require__(1);
var Terminal = __webpack_require__(25);

/**
 * Video
 */

function Video(options) {
  var self = this,
      shell,
      args;

  if (!(this instanceof Node)) {
    return new Video(options);
  }

  options = options || {};

  Box.call(this, options);

  if (this.exists('mplayer')) {
    shell = 'mplayer';
    args = ['-vo', 'caca', '-quiet', options.file];
  } else if (this.exists('mpv')) {
    shell = 'mpv';
    args = ['--vo', 'caca', '--really-quiet', options.file];
  } else {
    this.parseTags = true;
    this.setContent('{red-fg}{bold}Error:{/bold}' + ' mplayer or mpv not installed.{/red-fg}');
    return this;
  }

  var opts = {
    parent: this,
    left: 0,
    top: 0,
    width: this.width - this.iwidth,
    height: this.height - this.iheight,
    shell: shell,
    args: args.slice()
  };

  this.now = Date.now() / 1000 | 0;
  this.start = opts.start || 0;
  if (this.start) {
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', this.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', this.start + '');
    }
  }

  var DISPLAY = process.env.DISPLAY;
  delete process.env.DISPLAY;
  this.tty = new Terminal(opts);
  process.env.DISPLAY = DISPLAY;

  this.on('click', function () {
    self.tty.pty.write('p');
  });

  // mplayer/mpv cannot resize itself in the terminal, so we have
  // to restart it at the correct start time.
  this.on('resize', function () {
    self.tty.destroy();

    var opts = {
      parent: self,
      left: 0,
      top: 0,
      width: self.width - self.iwidth,
      height: self.height - self.iheight,
      shell: shell,
      args: args.slice()
    };

    var watched = (Date.now() / 1000 | 0) - self.now;
    self.now = Date.now() / 1000 | 0;
    self.start += watched;
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', self.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', self.start + '');
    }

    var DISPLAY = process.env.DISPLAY;
    delete process.env.DISPLAY;
    self.tty = new Terminal(opts);
    process.env.DISPLAY = DISPLAY;
    self.screen.render();
  });
}

Video.prototype.__proto__ = Box.prototype;

Video.prototype.type = 'video';

Video.prototype.exists = function (program) {
  try {
    return !!+cp.execSync('type ' + program + ' > /dev/null 2> /dev/null' + ' && echo 1', { encoding: 'utf8' }).trim();
  } catch (e) {
    return false;
  }
};

/**
 * Expose
 */

module.exports = Video;

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.

var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.element') || 0xeac7;

module.exports = REACT_ELEMENT_TYPE;

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var ReactCurrentOwner = __webpack_require__(18);
var ReactComponentTreeHook = __webpack_require__(32);
var ReactElement = __webpack_require__(6);

var checkReactTypeSpec = __webpack_require__(76);

var canDefineProperty = __webpack_require__(35);
var getIteratorFn = __webpack_require__(36);
var warning = __webpack_require__(2);

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = ReactCurrentOwner.current.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;
    if (parentName) {
      info = ' Check the top-level render call using <' + parentName + '>.';
    }
  }
  return info;
}

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  var memoizer = ownerHasKeyUseWarning.uniqueKey || (ownerHasKeyUseWarning.uniqueKey = {});

  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (memoizer[currentComponentErrorInfo]) {
    return;
  }
  memoizer[currentComponentErrorInfo] = true;

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwner = '';
  if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
    // Give the component that originally created this child.
    childOwner = ' It was passed a child from ' + element._owner.getName() + '.';
  }

  process.env.NODE_ENV !== 'production' ? warning(false, 'Each child in an array or iterator should have a unique "key" prop.' + '%s%s See https://fb.me/react-warning-keys for more information.%s', currentComponentErrorInfo, childOwner, ReactComponentTreeHook.getCurrentStackAddendum(element)) : void 0;
}

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node, parentType) {
  if ((typeof node === 'undefined' ? 'undefined' : _typeof(node)) !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (ReactElement.isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (ReactElement.isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);
    // Entry iterators provide implicit keys.
    if (iteratorFn) {
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;
        while (!(step = iterator.next()).done) {
          if (ReactElement.isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}

/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
function validatePropTypes(element) {
  var componentClass = element.type;
  if (typeof componentClass !== 'function') {
    return;
  }
  var name = componentClass.displayName || componentClass.name;
  if (componentClass.propTypes) {
    checkReactTypeSpec(componentClass.propTypes, element.props, 'prop', name, element, null);
  }
  if (typeof componentClass.getDefaultProps === 'function') {
    process.env.NODE_ENV !== 'production' ? warning(componentClass.getDefaultProps.isReactClassApproved, 'getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.') : void 0;
  }
}

var ReactElementValidator = {

  createElement: function createElement(type, props, children) {
    var validType = typeof type === 'string' || typeof type === 'function';
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    if (!validType) {
      if (typeof type !== 'function' && typeof type !== 'string') {
        var info = '';
        if (type === undefined || (typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'object' && type !== null && Object.keys(type).length === 0) {
          info += ' You likely forgot to export your component from the file ' + 'it\'s defined in.';
        }
        info += getDeclarationErrorAddendum();
        process.env.NODE_ENV !== 'production' ? warning(false, 'React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', type == null ? type : typeof type === 'undefined' ? 'undefined' : _typeof(type), info) : void 0;
      }
    }

    var element = ReactElement.createElement.apply(this, arguments);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)
    if (validType) {
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    }

    validatePropTypes(element);

    return element;
  },

  createFactory: function createFactory(type) {
    var validatedFactory = ReactElementValidator.createElement.bind(null, type);
    // Legacy hook TODO: Warn if this is accessed
    validatedFactory.type = type;

    if (process.env.NODE_ENV !== 'production') {
      if (canDefineProperty) {
        Object.defineProperty(validatedFactory, 'type', {
          enumerable: false,
          get: function get() {
            process.env.NODE_ENV !== 'production' ? warning(false, 'Factory.type is deprecated. Access the class directly ' + 'before passing it to createFactory.') : void 0;
            Object.defineProperty(this, 'type', {
              value: type
            });
            return type;
          }
        });
      }
    }

    return validatedFactory;
  },

  cloneElement: function cloneElement(element, props, children) {
    var newElement = ReactElement.cloneElement.apply(this, arguments);
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    return newElement;
  }

};

module.exports = ReactElementValidator;

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;

/***/ }),
/* 59 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 60 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 61 */
/***/ (function(module, exports) {

throw new Error("Module build failed: ReferenceError: [BABEL] /home/worms/Documents/blessed-might-be-good-with-react/node_modules/react-blessed/dist/render.js: Unknown option: /home/worms/Documents/blessed-might-be-good-with-react/node_modules/react/react.js.Children. Check out http://babeljs.io/docs/usage/options/ for more information about options.\n\nA common cause of this error is the presence of a configuration options object without the corresponding preset name. Example:\n\nInvalid:\n  `{ presets: [{option: value}] }`\nValid:\n  `{ presets: [['presetName', {option: value}]] }`\n\nFor more detailed information on preset configuration, please see http://babeljs.io/docs/plugins/#pluginpresets-options. (While processing preset: \"/home/worms/Documents/blessed-might-be-good-with-react/node_modules/react/react.js\")\n    at Logger.error (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/logger.js:41:11)\n    at OptionManager.mergeOptions (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:226:20)\n    at /home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:265:14\n    at /home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:323:22\n    at Array.map (native)\n    at OptionManager.resolvePresets (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:275:20)\n    at OptionManager.mergePresets (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:264:10)\n    at OptionManager.mergeOptions (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:249:14)\n    at OptionManager.init (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/options/option-manager.js:368:12)\n    at File.initOptions (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/index.js:212:65)\n    at new File (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/file/index.js:135:24)\n    at Pipeline.transform (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-core/lib/transformation/pipeline.js:46:16)\n    at transpile (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-loader/lib/index.js:46:20)\n    at Object.module.exports (/home/worms/Documents/blessed-might-be-good-with-react/node_modules/babel-loader/lib/index.js:163:20)");

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(69);

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * events.js - event emitter for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

var slice = Array.prototype.slice;

/**
 * EventEmitter
 */

function EventEmitter() {
  if (!this._events) this._events = {};
}

EventEmitter.prototype.setMaxListeners = function (n) {
  this._maxListeners = n;
};

EventEmitter.prototype.addListener = function (type, listener) {
  if (!this._events[type]) {
    this._events[type] = listener;
  } else if (typeof this._events[type] === 'function') {
    this._events[type] = [this._events[type], listener];
  } else {
    this._events[type].push(listener);
  }
  this._emit('newListener', [type, listener]);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function (type, listener) {
  var handler = this._events[type];
  if (!handler) return;

  if (typeof handler === 'function' || handler.length === 1) {
    delete this._events[type];
    this._emit('removeListener', [type, listener]);
    return;
  }

  for (var i = 0; i < handler.length; i++) {
    if (handler[i] === listener || handler[i].listener === listener) {
      handler.splice(i, 1);
      this._emit('removeListener', [type, listener]);
      return;
    }
  }
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function (type) {
  if (type) {
    delete this._events[type];
  } else {
    this._events = {};
  }
};

EventEmitter.prototype.once = function (type, listener) {
  function on() {
    this.removeListener(type, on);
    return listener.apply(this, arguments);
  }
  on.listener = listener;
  return this.on(type, on);
};

EventEmitter.prototype.listeners = function (type) {
  return typeof this._events[type] === 'function' ? [this._events[type]] : this._events[type] || [];
};

EventEmitter.prototype._emit = function (type, args) {
  var handler = this._events[type],
      ret;

  // if (type !== 'event') {
  //   this._emit('event', [type.replace(/^element /, '')].concat(args));
  // }

  if (!handler) {
    if (type === 'error') {
      throw new args[0]();
    }
    return;
  }

  if (typeof handler === 'function') {
    return handler.apply(this, args);
  }

  for (var i = 0; i < handler.length; i++) {
    if (handler[i].apply(this, args) === false) {
      ret = false;
    }
  }

  return ret !== false;
};

EventEmitter.prototype.emit = function (type) {
  var args = slice.call(arguments, 1),
      params = slice.call(arguments),
      el = this;

  this._emit('event', params);

  if (this.type === 'screen') {
    return this._emit(type, args);
  }

  if (this._emit(type, args) === false) {
    return false;
  }

  type = 'element ' + type;
  args.unshift(this);
  // `element` prefix
  // params = [type].concat(args);
  // no `element` prefix
  // params.splice(1, 0, this);

  do {
    // el._emit('event', params);
    if (!el._events[type]) continue;
    if (el._emit(type, args) === false) {
      return false;
    }
  } while (el = el.parent);

  return true;
};

// For hooking into the main EventEmitter if we want to.
// Might be better to do things this way being that it
// will always be compatible with node, not to mention
// it gives us domain support as well.
// Node.prototype._emit = Node.prototype.emit;
// Node.prototype.emit = function(type) {
//   var args, el;
//
//   if (this.type === 'screen') {
//     return this._emit.apply(this, arguments);
//   }
//
//   this._emit.apply(this, arguments);
//   if (this._bubbleStopped) return false;
//
//   args = slice.call(arguments, 1);
//   el = this;
//
//   args.unshift('element ' + type, this);
//   this._bubbleStopped = false;
//   //args.push(stopBubble);
//
//   do {
//     if (!el._events || !el._events[type]) continue;
//     el._emit.apply(el, args);
//     if (this._bubbleStopped) return false;
//   } while (el = el.parent);
//
//   return true;
// };
//
// Node.prototype._addListener = Node.prototype.addListener;
// Node.prototype.on =
// Node.prototype.addListener = function(type, listener) {
//   function on() {
//     if (listener.apply(this, arguments) === false) {
//       this._bubbleStopped = true;
//     }
//   }
//   on.listener = listener;
//   return this._addListener(type, on);
// };

/**
 * Expose
 */

exports = EventEmitter;
exports.EventEmitter = EventEmitter;

module.exports = exports;

/***/ }),
/* 64 */
/***/ (function(module, exports) {

throw new Error("Module build failed: SyntaxError: Invalid number (369:24)\n\n\u001b[0m \u001b[90m 367 | \u001b[39m  \u001b[36mfor\u001b[39m (\u001b[33m;\u001b[39m i \u001b[33m<\u001b[39m l\u001b[33m;\u001b[39m i \u001b[33m+=\u001b[39m \u001b[35m2\u001b[39m) {\n \u001b[90m 368 | \u001b[39m    v \u001b[33m=\u001b[39m \u001b[33mTput\u001b[39m\u001b[33m.\u001b[39mnumbers[o\u001b[33m++\u001b[39m]\u001b[33m;\u001b[39m\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 369 | \u001b[39m    \u001b[36mif\u001b[39m (data[i \u001b[33m+\u001b[39m \u001b[35m1\u001b[39m] \u001b[33m===\u001b[39m \u001b[35m0377\u001b[39m \u001b[33m&&\u001b[39m data[i] \u001b[33m===\u001b[39m \u001b[35m0377\u001b[39m) {\n \u001b[90m     | \u001b[39m                        \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 370 | \u001b[39m      info\u001b[33m.\u001b[39mnumbers[v] \u001b[33m=\u001b[39m \u001b[33m-\u001b[39m\u001b[35m1\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m 371 | \u001b[39m    } \u001b[36melse\u001b[39m {\n \u001b[90m 372 | \u001b[39m      info\u001b[33m.\u001b[39mnumbers[v] \u001b[33m=\u001b[39m (data[i \u001b[33m+\u001b[39m \u001b[35m1\u001b[39m] \u001b[33m<<\u001b[39m \u001b[35m8\u001b[39m) \u001b[33m|\u001b[39m data[i]\u001b[33m;\u001b[39m\u001b[0m\n");

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * widget.js - high-level interface for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

var widget = exports;

widget.classes = ['Node', 'Screen', 'Element', 'Box', 'Text', 'Line', 'ScrollableBox', 'ScrollableText', 'BigText', 'List', 'Form', 'Input', 'Textarea', 'Textbox', 'Button', 'ProgressBar', 'FileManager', 'Checkbox', 'RadioSet', 'RadioButton', 'Prompt', 'Question', 'Message', 'Loading', 'Listbar', 'Log', 'Table', 'ListTable', 'Terminal', 'Image', 'ANSIImage', 'OverlayImage', 'Video', 'Layout'];

widget.classes.forEach(function (name) {
  var file = name.toLowerCase();
  widget[name] = widget[file] = __webpack_require__(80)("./" + file);
});

widget.aliases = {
  'ListBar': 'Listbar',
  'PNG': 'ANSIImage'
};

Object.keys(widget.aliases).forEach(function (key) {
  var name = widget.aliases[key];
  widget[key] = widget[name];
  widget[key.toLowerCase()] = widget[name];
});

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * tng.js - png reader
 * Copyright (c) 2015, Christopher Jeffrey (MIT License).
 * https://github.com/chjj/tng
 */

var fs = __webpack_require__(10),
    util = __webpack_require__(60),
    path = __webpack_require__(37),
    zlib = __webpack_require__(81),
    assert = __webpack_require__(59),
    cp = __webpack_require__(8),
    exec = cp.execFileSync;

/**
 * PNG
 */

function PNG(file, options) {
  var buf, chunks, idat, pixels;

  if (!(this instanceof PNG)) {
    return new PNG(file, options);
  }

  if (!file) throw new Error('no file');

  this.options = options || {};
  this.colors = options.colors || __webpack_require__(11);
  this.optimization = this.options.optimization || 'mem';
  this.speed = this.options.speed || 1;

  if (Buffer.isBuffer(file)) {
    this.file = this.options.filename || null;
    buf = file;
  } else {
    this.options.filename = file;
    this.file = path.resolve(process.cwd(), file);
    buf = fs.readFileSync(this.file);
  }

  this.format = buf.readUInt32BE(0) === 0x89504e47 ? 'png' : buf.slice(0, 3).toString('ascii') === 'GIF' ? 'gif' : buf.readUInt16BE(0) === 0xffd8 ? 'jpg' : path.extname(this.file).slice(1).toLowerCase() || 'png';

  if (this.format !== 'png') {
    try {
      return this.toPNG(buf);
    } catch (e) {
      throw e;
    }
  }

  chunks = this.parseRaw(buf);
  idat = this.parseChunks(chunks);
  pixels = this.parseLines(idat);

  this.bmp = this.createBitmap(pixels);
  this.cellmap = this.createCellmap(this.bmp);
  this.frames = this.compileFrames(this.frames);
}

PNG.prototype.parseRaw = function (buf) {
  var chunks = [],
      index = 0,
      i = 0,
      buf,
      len,
      type,
      name,
      data,
      crc,
      check,
      critical,
      public_,
      conforming,
      copysafe,
      pos;

  this._debug(this.file);

  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error('bad header');
  }

  i += 8;

  while (i < buf.length) {
    try {
      len = buf.readUInt32BE(i);
      i += 4;
      pos = i;
      type = buf.slice(i, i + 4);
      name = type.toString('ascii');
      i += 4;
      data = buf.slice(i, i + len);
      i += len;
      check = this.crc32(buf.slice(pos, i));
      crc = buf.readInt32BE(i);
      i += 4;
      critical = !!(~type[0] & 32);
      public_ = !!(~type[1] & 32);
      conforming = !!(~type[2] & 32);
      copysafe = !!(~type[3] & 32);
      if (crc !== check) {
        throw new Error(name + ': bad crc');
      }
    } catch (e) {
      if (this.options.debug) throw e;
      break;
    }
    chunks.push({
      index: index++,
      id: name.toLowerCase(),
      len: len,
      pos: pos,
      end: i,
      type: type,
      name: name,
      data: data,
      crc: crc,
      check: check,
      raw: buf.slice(pos, i),
      flags: {
        critical: critical,
        public_: public_,
        conforming: conforming,
        copysafe: copysafe
      }
    });
  }

  return chunks;
};

PNG.prototype.parseChunks = function (chunks) {
  var i, chunk, name, data, p, idat, info;

  for (i = 0; i < chunks.length; i++) {
    chunk = chunks[i];
    name = chunk.id;
    data = chunk.data;
    info = {};
    switch (name) {
      case 'ihdr':
        {
          this.width = info.width = data.readUInt32BE(0);
          this.height = info.height = data.readUInt32BE(4);
          this.bitDepth = info.bitDepth = data.readUInt8(8);
          this.colorType = info.colorType = data.readUInt8(9);
          this.compression = info.compression = data.readUInt8(10);
          this.filter = info.filter = data.readUInt8(11);
          this.interlace = info.interlace = data.readUInt8(12);
          switch (this.bitDepth) {
            case 1:case 2:case 4:case 8:case 16:case 24:case 32:
              break;
            default:
              throw new Error('bad bit depth: ' + this.bitDepth);
          }
          switch (this.colorType) {
            case 0:case 2:case 3:case 4:case 6:
              break;
            default:
              throw new Error('bad color: ' + this.colorType);
          }
          switch (this.compression) {
            case 0:
              break;
            default:
              throw new Error('bad compression: ' + this.compression);
          }
          switch (this.filter) {
            case 0:case 1:case 2:case 3:case 4:
              break;
            default:
              throw new Error('bad filter: ' + this.filter);
          }
          switch (this.interlace) {
            case 0:case 1:
              break;
            default:
              throw new Error('bad interlace: ' + this.interlace);
          }
          break;
        }
      case 'plte':
        {
          this.palette = info.palette = [];
          for (p = 0; p < data.length; p += 3) {
            this.palette.push({
              r: data[p + 0],
              g: data[p + 1],
              b: data[p + 2],
              a: 255
            });
          }
          break;
        }
      case 'idat':
        {
          this.size = this.size || 0;
          this.size += data.length;
          this.idat = this.idat || [];
          this.idat.push(data);
          info.size = data.length;
          break;
        }
      case 'iend':
        {
          this.end = true;
          break;
        }
      case 'trns':
        {
          this.alpha = info.alpha = Array.prototype.slice.call(data);
          if (this.palette) {
            for (p = 0; p < data.length; p++) {
              if (!this.palette[p]) break;
              this.palette[p].a = data[p];
            }
          }
          break;
        }
      // https://wiki.mozilla.org/APNG_Specification
      case 'actl':
        {
          this.actl = info = {};
          this.frames = [];
          this.actl.numFrames = data.readUInt32BE(0);
          this.actl.numPlays = data.readUInt32BE(4);
          break;
        }
      case 'fctl':
        {
          // IDAT is the first frame depending on the order:
          // IDAT is a frame: acTL->fcTL->IDAT->[fcTL]->fdAT
          // IDAT is not a frame: acTL->IDAT->[fcTL]->fdAT
          if (!this.idat) {
            this.idat = [];
            this.frames.push({
              idat: true,
              fctl: info,
              fdat: this.idat
            });
          } else {
            this.frames.push({
              fctl: info,
              fdat: []
            });
          }
          info.sequenceNumber = data.readUInt32BE(0);
          info.width = data.readUInt32BE(4);
          info.height = data.readUInt32BE(8);
          info.xOffset = data.readUInt32BE(12);
          info.yOffset = data.readUInt32BE(16);
          info.delayNum = data.readUInt16BE(20);
          info.delayDen = data.readUInt16BE(22);
          info.disposeOp = data.readUInt8(24);
          info.blendOp = data.readUInt8(25);
          break;
        }
      case 'fdat':
        {
          info.sequenceNumber = data.readUInt32BE(0);
          info.data = data.slice(4);
          this.frames[this.frames.length - 1].fdat.push(info.data);
          break;
        }
    }
    chunk.info = info;
  }

  this._debug(chunks);

  if (this.frames) {
    this.frames = this.frames.map(function (frame, i) {
      frame.fdat = this.decompress(frame.fdat);
      if (!frame.fdat.length) throw new Error('no data');
      return frame;
    }, this);
  }

  idat = this.decompress(this.idat);
  if (!idat.length) throw new Error('no data');

  return idat;
};

PNG.prototype.parseLines = function (data) {
  var pixels = [],
      x,
      p,
      prior,
      line,
      filter,
      samples,
      pendingSamples,
      ch,
      shiftStart,
      i,
      toShift,
      sample;

  this.sampleDepth = this.colorType === 0 ? 1 : this.colorType === 2 ? 3 : this.colorType === 3 ? 1 : this.colorType === 4 ? 2 : this.colorType === 6 ? 4 : 1;
  this.bitsPerPixel = this.bitDepth * this.sampleDepth;
  this.bytesPerPixel = Math.ceil(this.bitsPerPixel / 8);
  this.wastedBits = this.width * this.bitsPerPixel / 8 - (this.width * this.bitsPerPixel / 8 | 0);
  this.byteWidth = Math.ceil(this.width * (this.bitsPerPixel / 8));

  this.shiftStart = this.bitDepth + (8 / this.bitDepth - this.bitDepth) - 1 | 0;
  this.shiftMult = this.bitDepth >= 8 ? 0 : this.bitDepth;
  this.mask = this.bitDepth === 32 ? 0xffffffff : (1 << this.bitDepth) - 1;

  if (this.interlace === 1) {
    samples = this.sampleInterlacedLines(data);
    for (i = 0; i < samples.length; i += this.sampleDepth) {
      pixels.push(samples.slice(i, i + this.sampleDepth));
    }
    return pixels;
  }

  for (p = 0; p < data.length; p += this.byteWidth) {
    prior = line || [];
    filter = data[p++];
    line = data.slice(p, p + this.byteWidth);
    line = this.unfilterLine(filter, line, prior);
    samples = this.sampleLine(line);
    for (i = 0; i < samples.length; i += this.sampleDepth) {
      pixels.push(samples.slice(i, i + this.sampleDepth));
    }
  }

  return pixels;
};

PNG.prototype.unfilterLine = function (filter, line, prior) {
  for (var x = 0; x < line.length; x++) {
    if (filter === 0) {
      break;
    } else if (filter === 1) {
      line[x] = this.filters.sub(x, line, prior, this.bytesPerPixel);
    } else if (filter === 2) {
      line[x] = this.filters.up(x, line, prior, this.bytesPerPixel);
    } else if (filter === 3) {
      line[x] = this.filters.average(x, line, prior, this.bytesPerPixel);
    } else if (filter === 4) {
      line[x] = this.filters.paeth(x, line, prior, this.bytesPerPixel);
    }
  }
  return line;
};

PNG.prototype.sampleLine = function (line, width) {
  var samples = [],
      x = 0,
      pendingSamples,
      ch,
      i,
      sample,
      shiftStart,
      toShift;

  while (x < line.length) {
    pendingSamples = this.sampleDepth;
    while (pendingSamples--) {
      ch = line[x];
      if (this.bitDepth === 16) {
        ch = ch << 8 | line[++x];
      } else if (this.bitDepth === 24) {
        ch = ch << 16 | line[++x] << 8 | line[++x];
      } else if (this.bitDepth === 32) {
        ch = ch << 24 | line[++x] << 16 | line[++x] << 8 | line[++x];
      } else if (this.bitDepth > 32) {
        throw new Error('bitDepth ' + this.bitDepth + ' unsupported.');
      }
      shiftStart = this.shiftStart;
      toShift = shiftStart - (x === line.length - 1 ? this.wastedBits : 0);
      for (i = 0; i <= toShift; i++) {
        sample = ch >> this.shiftMult * shiftStart & this.mask;
        if (this.colorType !== 3) {
          if (this.bitDepth < 8) {
            // <= 8 would work too, doesn't matter
            // sample = sample * (0xff / this.mask) | 0; // would work too
            sample *= 0xff / this.mask;
            sample |= 0;
          } else if (this.bitDepth > 8) {
            sample = sample / this.mask * 255 | 0;
          }
        }
        samples.push(sample);
        shiftStart--;
      }
      x++;
    }
  }

  // Needed for deinterlacing?
  if (width != null) {
    samples = samples.slice(0, width * this.sampleDepth);
  }

  return samples;
};

// http://www.w3.org/TR/PNG-Filters.html
PNG.prototype.filters = {
  sub: function Sub(x, line, prior, bpp) {
    if (x < bpp) return line[x];
    return (line[x] + line[x - bpp]) % 256;
  },
  up: function Up(x, line, prior, bpp) {
    return (line[x] + (prior[x] || 0)) % 256;
  },
  average: function Average(x, line, prior, bpp) {
    if (x < bpp) return Math.floor((prior[x] || 0) / 2);
    // if (x < bpp) return (prior[x] || 0) >> 1;
    return (line[x] + Math.floor((line[x - bpp] + prior[x]) / 2)
    // + ((line[x - bpp] + prior[x]) >> 1)
    ) % 256;
  },
  paeth: function Paeth(x, line, prior, bpp) {
    if (x < bpp) return prior[x] || 0;
    return (line[x] + this._predictor(line[x - bpp], prior[x] || 0, prior[x - bpp] || 0)) % 256;
  },
  _predictor: function PaethPredictor(a, b, c) {
    // a = left, b = above, c = upper left
    var p = a + b - c,
        pa = Math.abs(p - a),
        pb = Math.abs(p - b),
        pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }
};

/**
 * Adam7 deinterlacing ported to javascript from PyPNG:
 * pypng - Pure Python library for PNG image encoding/decoding
 * Copyright (c) 2009-2015, David Jones (MIT License).
 * https://github.com/drj11/pypng
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

PNG.prototype.sampleInterlacedLines = function (raw) {
  var psize, vpr, samples, source_offset, i, pass, xstart, ystart, xstep, ystep, recon, ppr, row_size, y, filter_type, scanline, flat, offset, k, end_offset, skip, j, k, f;

  var adam7 = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];

  // Fractional bytes per pixel
  psize = this.bitDepth / 8 * this.sampleDepth;

  // Values per row (of the target image)
  vpr = this.width * this.sampleDepth;

  // Make a result array, and make it big enough. Interleaving
  // writes to the output array randomly (well, not quite), so the
  // entire output array must be in memory.
  samples = new Buffer(vpr * this.height);
  samples.fill(0);

  source_offset = 0;

  for (i = 0; i < adam7.length; i++) {
    pass = adam7[i];
    xstart = pass[0];
    ystart = pass[1];
    xstep = pass[2];
    ystep = pass[3];
    if (xstart >= this.width) continue;
    // The previous (reconstructed) scanline. Empty array at the
    // beginning of a pass to indicate that there is no previous
    // line.
    recon = [];
    // Pixels per row (reduced pass image)
    ppr = Math.ceil((this.width - xstart) / xstep);
    // Row size in bytes for this pass.
    row_size = Math.ceil(psize * ppr);
    for (y = ystart; y < this.height; y += ystep) {
      filter_type = raw[source_offset];
      source_offset += 1;
      scanline = raw.slice(source_offset, source_offset + row_size);
      source_offset += row_size;
      recon = this.unfilterLine(filter_type, scanline, recon);
      // Convert so that there is one element per pixel value
      flat = this.sampleLine(recon, ppr);
      if (xstep === 1) {
        assert.equal(xstart, 0);
        offset = y * vpr;
        for (k = offset, f = 0; k < offset + vpr; k++, f++) {
          samples[k] = flat[f];
        }
      } else {
        offset = y * vpr + xstart * this.sampleDepth;
        end_offset = (y + 1) * vpr;
        skip = this.sampleDepth * xstep;
        for (j = 0; j < this.sampleDepth; j++) {
          for (k = offset + j, f = j; k < end_offset; k += skip, f += this.sampleDepth) {
            samples[k] = flat[f];
          }
        }
      }
    }
  }

  return samples;
};

PNG.prototype.createBitmap = function (pixels) {
  var bmp = [],
      i;

  if (this.colorType === 0) {
    pixels = pixels.map(function (sample) {
      return { r: sample[0], g: sample[0], b: sample[0], a: 255 };
    });
  } else if (this.colorType === 2) {
    pixels = pixels.map(function (sample) {
      return { r: sample[0], g: sample[1], b: sample[2], a: 255 };
    });
  } else if (this.colorType === 3) {
    pixels = pixels.map(function (sample) {
      if (!this.palette[sample[0]]) throw new Error('bad palette index');
      return this.palette[sample[0]];
    }, this);
  } else if (this.colorType === 4) {
    pixels = pixels.map(function (sample) {
      return { r: sample[0], g: sample[0], b: sample[0], a: sample[1] };
    });
  } else if (this.colorType === 6) {
    pixels = pixels.map(function (sample) {
      return { r: sample[0], g: sample[1], b: sample[2], a: sample[3] };
    });
  }

  for (i = 0; i < pixels.length; i += this.width) {
    bmp.push(pixels.slice(i, i + this.width));
  }

  return bmp;
};

PNG.prototype.createCellmap = function (bmp, options) {
  var bmp = bmp || this.bmp,
      options = options || this.options,
      cellmap = [],
      scale = options.scale || 0.20,
      height = bmp.length,
      width = bmp[0].length,
      cmwidth = options.width,
      cmheight = options.height,
      line,
      x,
      y,
      xx,
      yy,
      scale,
      xs,
      ys;

  if (cmwidth) {
    scale = cmwidth / width;
  } else if (cmheight) {
    scale = cmheight / height;
  }

  if (!cmheight) {
    cmheight = Math.round(height * scale);
  }

  if (!cmwidth) {
    cmwidth = Math.round(width * scale);
  }

  ys = height / cmheight;
  xs = width / cmwidth;

  for (y = 0; y < bmp.length; y += ys) {
    line = [];
    yy = Math.round(y);
    if (!bmp[yy]) break;
    for (x = 0; x < bmp[yy].length; x += xs) {
      xx = Math.round(x);
      if (!bmp[yy][xx]) break;
      line.push(bmp[yy][xx]);
    }
    cellmap.push(line);
  }

  return cellmap;
};

PNG.prototype.renderANSI = function (bmp) {
  var self = this,
      out = '';

  bmp.forEach(function (line, y) {
    line.forEach(function (pixel, x) {
      var outch = self.getOutch(x, y, line, pixel);
      out += self.pixelToSGR(pixel, outch);
    });
    out += '\n';
  });

  return out;
};

PNG.prototype.renderContent = function (bmp, el) {
  var self = this,
      out = '';

  bmp.forEach(function (line, y) {
    line.forEach(function (pixel, x) {
      var outch = self.getOutch(x, y, line, pixel);
      out += self.pixelToTags(pixel, outch);
    });
    out += '\n';
  });

  el.setContent(out);

  return out;
};

PNG.prototype.renderScreen = function (bmp, screen, xi, xl, yi, yl) {
  var self = this,
      lines = screen.lines,
      cellLines,
      y,
      yy,
      x,
      xx,
      alpha,
      attr,
      ch;

  cellLines = bmp.reduce(function (cellLines, line, y) {
    var cellLine = [];
    line.forEach(function (pixel, x) {
      var outch = self.getOutch(x, y, line, pixel),
          cell = self.pixelToCell(pixel, outch);
      cellLine.push(cell);
    });
    cellLines.push(cellLine);
    return cellLines;
  }, []);

  for (y = yi; y < yl; y++) {
    yy = y - yi;
    for (x = xi; x < xl; x++) {
      xx = x - xi;
      if (lines[y] && lines[y][x] && cellLines[yy] && cellLines[yy][xx]) {
        alpha = cellLines[yy][xx].pop();
        // completely transparent
        if (alpha === 0.0) {
          continue;
        }
        // translucency / blending
        if (alpha < 1.0) {
          attr = cellLines[yy][xx][0];
          ch = cellLines[yy][xx][1];
          lines[y][x][0] = this.colors.blend(lines[y][x][0], attr, alpha);
          if (ch !== ' ') lines[y][x][1] = ch;
          lines[y].dirty = true;
          continue;
        }
        // completely opaque
        lines[y][x] = cellLines[yy][xx];
        lines[y].dirty = true;
      }
    }
  }
};

PNG.prototype.renderElement = function (bmp, el) {
  var xi = el.aleft + el.ileft,
      xl = el.aleft + el.width - el.iright,
      yi = el.atop + el.itop,
      yl = el.atop + el.height - el.ibottom;

  return this.renderScreen(bmp, el.screen, xi, xl, yi, yl);
};

PNG.prototype.pixelToSGR = function (pixel, ch) {
  var bga = 1.0,
      fga = 0.5,
      a = pixel.a / 255,
      bg,
      fg;

  bg = this.colors.match(pixel.r * a * bga | 0, pixel.g * a * bga | 0, pixel.b * a * bga | 0);

  if (ch && this.options.ascii) {
    fg = this.colors.match(pixel.r * a * fga | 0, pixel.g * a * fga | 0, pixel.b * a * fga | 0);
    if (a === 0) {
      return '\x1b[38;5;' + fg + 'm' + ch + '\x1b[m';
    }
    return '\x1b[38;5;' + fg + 'm\x1b[48;5;' + bg + 'm' + ch + '\x1b[m';
  }

  if (a === 0) return ' ';

  return '\x1b[48;5;' + bg + 'm \x1b[m';
};

PNG.prototype.pixelToTags = function (pixel, ch) {
  var bga = 1.0,
      fga = 0.5,
      a = pixel.a / 255,
      bg,
      fg;

  bg = this.colors.RGBtoHex(pixel.r * a * bga | 0, pixel.g * a * bga | 0, pixel.b * a * bga | 0);

  if (ch && this.options.ascii) {
    fg = this.colors.RGBtoHex(pixel.r * a * fga | 0, pixel.g * a * fga | 0, pixel.b * a * fga | 0);
    if (a === 0) {
      return '{' + fg + '-fg}' + ch + '{/}';
    }
    return '{' + fg + '-fg}{' + bg + '-bg}' + ch + '{/}';
  }

  if (a === 0) return ' ';

  return '{' + bg + '-bg} {/' + bg + '-bg}';
};

PNG.prototype.pixelToCell = function (pixel, ch) {
  var bga = 1.0,
      fga = 0.5,
      a = pixel.a / 255,
      bg,
      fg;

  bg = this.colors.match(pixel.r * bga | 0, pixel.g * bga | 0, pixel.b * bga | 0);

  if (ch && this.options.ascii) {
    fg = this.colors.match(pixel.r * fga | 0, pixel.g * fga | 0, pixel.b * fga | 0);
  } else {
    fg = 0x1ff;
    ch = null;
  }

  // if (a === 0) bg = 0x1ff;

  return [0 << 18 | fg << 9 | bg << 0, ch || ' ', a];
};

// Taken from libcaca:
PNG.prototype.getOutch = function () {
  var dchars = '????8@8@#8@8##8#MKXWwz$&%x><\\/xo;+=|^-:i\'.`,  `.        ';

  var luminance = function luminance(pixel) {
    var a = pixel.a / 255,
        r = pixel.r * a,
        g = pixel.g * a,
        b = pixel.b * a,
        l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return l / 255;
  };

  return function (x, y, line, pixel) {
    var lumi = luminance(pixel),
        outch = dchars[lumi * (dchars.length - 1) | 0];

    return outch;
  };
}();

PNG.prototype.compileFrames = function (frames) {
  return this.optimization === 'mem' ? this.compileFrames_lomem(frames) : this.compileFrames_locpu(frames);
};

PNG.prototype.compileFrames_lomem = function (frames) {
  if (!this.actl) return;
  return frames.map(function (frame, i) {
    this.width = frame.fctl.width;
    this.height = frame.fctl.height;

    var pixels = frame._pixels || this.parseLines(frame.fdat),
        bmp = frame._bmp || this.createBitmap(pixels),
        fc = frame.fctl;

    return {
      actl: this.actl,
      fctl: frame.fctl,
      delay: fc.delayNum / (fc.delayDen || 100) * 1000 | 0,
      bmp: bmp
    };
  }, this);
};

PNG.prototype.compileFrames_locpu = function (frames) {
  if (!this.actl) return;

  this._curBmp = null;
  this._lastBmp = null;

  return frames.map(function (frame, i) {
    this.width = frame.fctl.width;
    this.height = frame.fctl.height;

    var pixels = frame._pixels || this.parseLines(frame.fdat),
        bmp = frame._bmp || this.createBitmap(pixels),
        renderBmp = this.renderFrame(bmp, frame, i),
        cellmap = this.createCellmap(renderBmp),
        fc = frame.fctl;

    return {
      actl: this.actl,
      fctl: frame.fctl,
      delay: fc.delayNum / (fc.delayDen || 100) * 1000 | 0,
      bmp: renderBmp,
      cellmap: cellmap
    };
  }, this);
};

PNG.prototype.renderFrame = function (bmp, frame, i) {
  var first = this.frames[0],
      last = this.frames[i - 1],
      fc = frame.fctl,
      xo = fc.xOffset,
      yo = fc.yOffset,
      lxo,
      lyo,
      x,
      y,
      line,
      p;

  if (!this._curBmp) {
    this._curBmp = [];
    for (y = 0; y < first.fctl.height; y++) {
      line = [];
      for (x = 0; x < first.fctl.width; x++) {
        p = bmp[y][x];
        line.push({ r: p.r, g: p.g, b: p.b, a: p.a });
      }
      this._curBmp.push(line);
    }
  }

  if (last && last.fctl.disposeOp !== 0) {
    lxo = last.fctl.xOffset;
    lyo = last.fctl.yOffset;
    for (y = 0; y < last.fctl.height; y++) {
      for (x = 0; x < last.fctl.width; x++) {
        if (last.fctl.disposeOp === 0) {
          // none / keep
        } else if (last.fctl.disposeOp === 1) {
          // background / clear
          this._curBmp[lyo + y][lxo + x] = { r: 0, g: 0, b: 0, a: 0 };
        } else if (last.fctl.disposeOp === 2) {
          // previous / restore
          p = this._lastBmp[y][x];
          this._curBmp[lyo + y][lxo + x] = { r: p.r, g: p.g, b: p.b, a: p.a };
        }
      }
    }
  }

  if (frame.fctl.disposeOp === 2) {
    this._lastBmp = [];
    for (y = 0; y < frame.fctl.height; y++) {
      line = [];
      for (x = 0; x < frame.fctl.width; x++) {
        p = this._curBmp[yo + y][xo + x];
        line.push({ r: p.r, g: p.g, b: p.b, a: p.a });
      }
      this._lastBmp.push(line);
    }
  } else {
    this._lastBmp = null;
  }

  for (y = 0; y < frame.fctl.height; y++) {
    for (x = 0; x < frame.fctl.width; x++) {
      p = bmp[y][x];
      if (fc.blendOp === 0) {
        // source
        this._curBmp[yo + y][xo + x] = { r: p.r, g: p.g, b: p.b, a: p.a };
      } else if (fc.blendOp === 1) {
        // over
        if (p.a !== 0) {
          this._curBmp[yo + y][xo + x] = { r: p.r, g: p.g, b: p.b, a: p.a };
        }
      }
    }
  }

  return this._curBmp;
};

PNG.prototype._animate = function (callback) {
  if (!this.frames) {
    return callback(this.bmp, this.cellmap);
  }

  var self = this,
      numPlays = this.actl.numPlays || Infinity,
      running = 0,
      i = -1;

  this._curBmp = null;
  this._lastBmp = null;

  var next_lomem = function next_lomem() {
    if (!running) return;

    var frame = self.frames[++i];
    if (!frame) {
      if (! --numPlays) return callback();
      i = -1;
      // XXX may be able to optimize by only setting the self._curBmp once???
      self._curBmp = null;
      self._lastBmp = null;
      return setImmediate(next);
    }

    var bmp = frame.bmp,
        renderBmp = self.renderFrame(bmp, frame, i),
        cellmap = self.createCellmap(renderBmp);

    callback(renderBmp, cellmap);
    return setTimeout(next, frame.delay / self.speed | 0);
  };

  var next_locpu = function next_locpu() {
    if (!running) return;
    var frame = self.frames[++i];
    if (!frame) {
      if (! --numPlays) return callback();
      i = -1;
      return setImmediate(next);
    }
    callback(frame.bmp, frame.cellmap);
    return setTimeout(next, frame.delay / self.speed | 0);
  };

  var next = this.optimization === 'mem' ? next_lomem : next_locpu;

  this._control = function (state) {
    if (state === -1) {
      i = -1;
      self._curBmp = null;
      self._lastBmp = null;
      running = 0;
      callback(self.frames[0].bmp, self.frames[0].cellmap || self.createCellmap(self.frames[0].bmp));
      return;
    }
    if (state === running) return;
    running = state;
    return next();
  };

  this._control(1);
};

PNG.prototype.play = function (callback) {
  if (!this._control || callback) {
    this.stop();
    return this._animate(callback);
  }
  this._control(1);
};

PNG.prototype.pause = function () {
  if (!this._control) return;
  this._control(0);
};

PNG.prototype.stop = function () {
  if (!this._control) return;
  this._control(-1);
};

PNG.prototype.toPNG = function (input) {
  var options = this.options,
      file = this.file,
      format = this.format,
      buf,
      img,
      gif,
      i,
      control,
      disposeOp;

  if (format !== 'gif') {
    buf = exec('convert', [format + ':-', 'png:-'], { stdio: ['pipe', 'pipe', 'ignore'], input: input });
    img = PNG(buf, options);
    img.file = file;
    return img;
  }

  gif = GIF(input, options);

  this.width = gif.width;
  this.height = gif.height;
  this.frames = [];

  for (i = 0; i < gif.images.length; i++) {
    img = gif.images[i];
    // Convert from gif disposal to png disposal. See:
    // http://www.w3.org/Graphics/GIF/spec-gif89a.txt
    control = img.control || gif;
    disposeOp = Math.max(0, (control.disposeMethod || 0) - 1);
    if (disposeOp > 2) disposeOp = 0;
    this.frames.push({
      fctl: {
        sequenceNumber: i,
        width: img.width,
        height: img.height,
        xOffset: img.left,
        yOffset: img.top,
        delayNum: control.delay,
        delayDen: 100,
        disposeOp: disposeOp,
        blendOp: 1
      },
      fdat: [],
      _pixels: [],
      _bmp: img.bmp
    });
  }

  this.bmp = this.frames[0]._bmp;
  this.cellmap = this.createCellmap(this.bmp);

  if (this.frames.length > 1) {
    this.actl = { numFrames: gif.images.length, numPlays: gif.numPlays || 0 };
    this.frames = this.compileFrames(this.frames);
  } else {
    this.frames = undefined;
  }

  return this;
};

// Convert a gif to an apng using imagemagick. Unfortunately imagemagick
// doesn't support apngs, so we coalesce the gif frames into one image and then
// slice them into frames.
PNG.prototype.gifMagick = function (input) {
  var options = this.options,
      file = this.file,
      format = this.format,
      buf,
      fmt,
      img,
      frames,
      frame,
      width,
      height,
      iwidth,
      twidth,
      i,
      lines,
      line,
      x,
      y;

  buf = exec('convert', [format + ':-', '-coalesce', '+append', 'png:-'], { stdio: ['pipe', 'pipe', 'ignore'], input: input });

  fmt = '{"W":%W,"H":%H,"w":%w,"h":%h,"d":%T,"x":"%X","y":"%Y"},';
  frames = exec('identify', ['-format', fmt, format + ':-'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], input: input });
  frames = JSON.parse('[' + frames.trim().slice(0, -1) + ']');

  img = PNG(buf, options);
  img.file = file;
  Object.keys(img).forEach(function (key) {
    this[key] = img[key];
  }, this);

  width = frames[0].W;
  height = frames[0].H;
  iwidth = 0;
  twidth = 0;

  this.width = width;
  this.height = height;

  this.frames = [];

  for (i = 0; i < frames.length; i++) {
    frame = frames[i];
    frame.x = +frame.x;
    frame.y = +frame.y;

    iwidth = twidth;
    twidth += width;

    lines = [];
    for (y = frame.y; y < height; y++) {
      line = [];
      for (x = iwidth + frame.x; x < twidth; x++) {
        line.push(img.bmp[y][x]);
      }
      lines.push(line);
    }

    this.frames.push({
      fctl: {
        sequenceNumber: i,
        width: frame.w,
        height: frame.h,
        xOffset: frame.x,
        yOffset: frame.y,
        delayNum: frame.d,
        delayDen: 100,
        disposeOp: 0,
        blendOp: 0
      },
      fdat: [],
      _pixels: [],
      _bmp: lines
    });
  }

  this.bmp = this.frames[0]._bmp;
  this.cellmap = this.createCellmap(this.bmp);

  if (this.frames.length > 1) {
    this.actl = { numFrames: frames.length, numPlays: 0 };
    this.frames = this.compileFrames(this.frames);
  } else {
    this.frames = undefined;
  }

  return this;
};

PNG.prototype.decompress = function (buffers) {
  return zlib.inflateSync(new Buffer(buffers.reduce(function (out, data) {
    return out.concat(Array.prototype.slice.call(data));
  }, [])));
};

/**
 * node-crc
 * https://github.com/alexgorbatchev/node-crc
 * https://github.com/alexgorbatchev/node-crc/blob/master/LICENSE
 *
 * The MIT License (MIT)
 *
 * Copyright 2014 Alex Gorbatchev
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

PNG.prototype.crc32 = function () {
  var crcTable = [0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f, 0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9, 0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d];

  return function crc32(buf) {
    //var crc = previous === 0 ? 0 : ~~previous ^ -1;
    var crc = -1;
    for (var i = 0, len = buf.length; i < len; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ crc >>> 8;
    }
    return crc ^ -1;
  };
}();

PNG.prototype._debug = function () {
  if (!this.options.log) return;
  return this.options.log.apply(null, arguments);
};

/**
 * GIF
 */

function GIF(file, options) {
  var self = this;

  if (!(this instanceof GIF)) {
    return new GIF(file, options);
  }

  var info = {},
      p = 0,
      buf,
      i,
      total,
      sig,
      desc,
      img,
      ext,
      label,
      size;

  if (!file) throw new Error('no file');

  options = options || {};

  this.options = options;

  // XXX If the gif is not optimized enough
  // it may OOM the process with too many frames.
  // TODO: Implement in PNG reader.
  this.pixelLimit = this.options.pixelLimit || 7622550;
  this.totalPixels = 0;

  if (Buffer.isBuffer(file)) {
    buf = file;
    file = null;
  } else {
    file = path.resolve(process.cwd(), file);
    buf = fs.readFileSync(file);
  }

  sig = buf.slice(0, 6).toString('ascii');
  if (sig !== 'GIF87a' && sig !== 'GIF89a') {
    throw new Error('bad header: ' + sig);
  }

  this.width = buf.readUInt16LE(6);
  this.height = buf.readUInt16LE(8);

  this.flags = buf.readUInt8(10);
  this.gct = !!(this.flags & 0x80);
  this.gctsize = (this.flags & 0x07) + 1;

  this.bgIndex = buf.readUInt8(11);
  this.aspect = buf.readUInt8(12);
  p += 13;

  if (this.gct) {
    this.colors = [];
    total = 1 << this.gctsize;
    for (i = 0; i < total; i++, p += 3) {
      this.colors.push([buf[p], buf[p + 1], buf[p + 2], 255]);
    }
  }

  this.images = [];
  this.extensions = [];

  try {
    while (p < buf.length) {
      desc = buf.readUInt8(p);
      p += 1;
      if (desc === 0x2c) {
        img = {};

        img.left = buf.readUInt16LE(p);
        p += 2;
        img.top = buf.readUInt16LE(p);
        p += 2;

        img.width = buf.readUInt16LE(p);
        p += 2;
        img.height = buf.readUInt16LE(p);
        p += 2;

        img.flags = buf.readUInt8(p);
        p += 1;

        img.lct = !!(img.flags & 0x80);
        img.ilace = !!(img.flags & 0x40);
        img.lctsize = (img.flags & 0x07) + 1;

        if (img.lct) {
          img.lcolors = [];
          total = 1 << img.lctsize;
          for (i = 0; i < total; i++, p += 3) {
            img.lcolors.push([buf[p], buf[p + 1], buf[p + 2], 255]);
          }
        }

        img.codeSize = buf.readUInt8(p);
        p += 1;

        img.size = buf.readUInt8(p);
        p += 1;

        img.lzw = [buf.slice(p, p + img.size)];
        p += img.size;

        while (buf[p] !== 0x00) {
          // Some gifs screw up their size.
          // XXX Same for all subblocks?
          if (buf[p] === 0x3b && p === buf.length - 1) {
            p--;
            break;
          }
          size = buf.readUInt8(p);
          p += 1;
          img.lzw.push(buf.slice(p, p + size));
          p += size;
        }

        assert.equal(buf.readUInt8(p), 0x00);
        p += 1;

        if (ext && ext.label === 0xf9) {
          img.control = ext;
        }

        this.totalPixels += img.width * img.height;

        this.images.push(img);

        if (this.totalPixels >= this.pixelLimit) {
          break;
        }
      } else if (desc === 0x21) {
        // Extensions:
        // http://www.w3.org/Graphics/GIF/spec-gif89a.txt
        ext = {};
        label = buf.readUInt8(p);
        p += 1;
        ext.label = label;
        if (label === 0xf9) {
          size = buf.readUInt8(p);
          assert.equal(size, 0x04);
          p += 1;
          ext.fields = buf.readUInt8(p);
          ext.disposeMethod = ext.fields >> 2 & 0x07;
          ext.useTransparent = !!(ext.fields & 0x01);
          p += 1;
          ext.delay = buf.readUInt16LE(p);
          p += 2;
          ext.transparentColor = buf.readUInt8(p);
          p += 1;
          while (buf[p] !== 0x00) {
            size = buf.readUInt8(p);
            p += 1;
            p += size;
          }
          assert.equal(buf.readUInt8(p), 0x00);
          p += 1;
          this.delay = ext.delay;
          this.transparentColor = ext.transparentColor;
          this.disposeMethod = ext.disposeMethod;
          this.useTransparent = ext.useTransparent;
        } else if (label === 0xff) {
          // https://wiki.whatwg.org/wiki/GIF#Specifications
          size = buf.readUInt8(p);
          p += 1;
          ext.id = buf.slice(p, p + 8).toString('ascii');
          p += 8;
          ext.auth = buf.slice(p, p + 3).toString('ascii');
          p += 3;
          ext.data = [];
          while (buf[p] !== 0x00) {
            size = buf.readUInt8(p);
            p += 1;
            ext.data.push(buf.slice(p, p + size));
            p += size;
          }
          ext.data = new Buffer(ext.data.reduce(function (out, data) {
            return out.concat(Array.prototype.slice.call(data));
          }, []));
          // AnimExts looping extension (identical to netscape)
          if (ext.id === 'ANIMEXTS' && ext.auth === '1.0') {
            ext.id = 'NETSCAPE';
            ext.auth = '2.0';
            ext.animexts = true;
          }
          // Netscape extensions
          if (ext.id === 'NETSCAPE' && ext.auth === '2.0') {
            if (ext.data.readUInt8(0) === 0x01) {
              // Netscape looping extension
              // http://graphcomp.com/info/specs/ani_gif.html
              ext.numPlays = ext.data.readUInt16LE(1);
              this.numPlays = ext.numPlays;
            } else if (ext.data.readUInt8(0) === 0x02) {
              // Netscape buffering extension
              this.minBuffer = ext.data;
            }
          }
          // Adobe XMP extension
          if (ext.id === 'XMP Data' && ext.auth === 'XMP') {
            ext.xmp = ext.data.toString('utf8');
            this.xmp = ext.xmp;
          }
          // ICC extension
          if (ext.id === 'ICCRGBG1' && ext.auth === '012') {
            // NOTE: Says size is 4 bytes, not 1? Maybe just buffer size?
            this.icc = ext.data;
          }
          // fractint extension
          if (ext.id === 'fractint' && /^00[1-7]$/.test(ext.auth)) {
            // NOTE: Says size is 4 bytes, not 1? Maybe just buffer size?
            // Size: '!\377\013' == [0x00, 0x15, 0xff, 0x0b]
            this.fractint = ext.data;
          }
          assert.equal(buf.readUInt8(p), 0x00);
          p += 1;
        } else {
          ext.data = [];
          while (buf[p] !== 0x00) {
            size = buf.readUInt8(p);
            p += 1;
            ext.data.push(buf.slice(p, p + size));
            p += size;
          }
          assert.equal(buf.readUInt8(p), 0x00);
          p += 1;
        }
        this.extensions.push(ext);
      } else if (desc === 0x3b) {
        break;
      } else if (p === buf.length - 1) {
        // } else if (desc === 0x00 && p === buf.length - 1) {
        break;
      } else {
        throw new Error('unknown block');
      }
    }
  } catch (e) {
    if (options.debug) {
      throw e;
    }
  }

  this.images = this.images.map(function (img, imageIndex) {
    var control = img.control || this;

    img.lzw = new Buffer(img.lzw.reduce(function (out, data) {
      return out.concat(Array.prototype.slice.call(data));
    }, []));

    try {
      img.data = this.decompress(img.lzw, img.codeSize);
    } catch (e) {
      if (options.debug) throw e;
      return;
    }

    var interlacing = [[0, 8], [4, 8], [2, 4], [1, 2], [0, 0]];

    var table = img.lcolors || this.colors,
        row = 0,
        col = 0,
        ilp = 0,
        p = 0,
        b,
        idx,
        i,
        y,
        x,
        line,
        pixel;

    img.samples = [];
    // Rewritten version of:
    // https://github.com/lbv/ka-cs-programs/blob/master/lib/gif-reader.js
    for (;;) {
      b = img.data[p++];
      if (b == null) break;
      idx = (row * img.width + col) * 4;
      if (!table[b]) {
        if (options.debug) throw new Error('bad samples');
        table[b] = [0, 0, 0, 0];
      }
      img.samples[idx] = table[b][0];
      img.samples[idx + 1] = table[b][1];
      img.samples[idx + 2] = table[b][2];
      img.samples[idx + 3] = table[b][3];
      if (control.useTransparent && b === control.transparentColor) {
        img.samples[idx + 3] = 0;
      }
      if (++col >= img.width) {
        col = 0;
        if (img.ilace) {
          row += interlacing[ilp][1];
          if (row >= img.height) {
            row = interlacing[++ilp][0];
          }
        } else {
          row++;
        }
      }
    }

    img.pixels = [];
    for (i = 0; i < img.samples.length; i += 4) {
      img.pixels.push(img.samples.slice(i, i + 4));
    }

    img.bmp = [];
    for (y = 0, p = 0; y < img.height; y++) {
      line = [];
      for (x = 0; x < img.width; x++) {
        pixel = img.pixels[p++];
        if (!pixel) {
          if (options.debug) throw new Error('no pixel');
          line.push({ r: 0, g: 0, b: 0, a: 0 });
          continue;
        }
        line.push({ r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] });
      }
      img.bmp.push(line);
    }

    return img;
  }, this).filter(Boolean);

  if (!this.images.length) {
    throw new Error('no image data or bad decompress');
  }
}

// Rewritten version of:
// https://github.com/lbv/ka-cs-programs/blob/master/lib/gif-reader.js
GIF.prototype.decompress = function (input, codeSize) {
  var bitDepth = codeSize + 1,
      CC = 1 << codeSize,
      EOI = CC + 1,
      stack = [],
      table = [],
      ntable = 0,
      oldCode = null,
      buffer = 0,
      nbuffer = 0,
      p = 0,
      buf = [],
      bits,
      read,
      ans,
      n,
      code,
      i,
      K,
      b,
      maxElem;

  for (;;) {
    if (stack.length === 0) {
      bits = bitDepth;
      read = 0;
      ans = 0;
      while (read < bits) {
        if (nbuffer === 0) {
          if (p >= input.length) return buf;
          buffer = input[p++];
          nbuffer = 8;
        }
        n = Math.min(bits - read, nbuffer);
        ans |= (buffer & (1 << n) - 1) << read;
        read += n;
        nbuffer -= n;
        buffer >>= n;
      }
      code = ans;

      if (code === EOI) {
        break;
      }

      if (code === CC) {
        table = [];
        for (i = 0; i < CC; ++i) {
          table[i] = [i, -1, i];
        }
        bitDepth = codeSize + 1;
        maxElem = 1 << bitDepth;
        ntable = CC + 2;
        oldCode = null;
        continue;
      }

      if (oldCode === null) {
        oldCode = code;
        buf.push(table[code][0]);
        continue;
      }

      if (code < ntable) {
        for (i = code; i >= 0; i = table[i][1]) {
          stack.push(table[i][0]);
        }
        table[ntable++] = [table[code][2], oldCode, table[oldCode][2]];
      } else {
        K = table[oldCode][2];
        table[ntable++] = [K, oldCode, K];
        for (i = code; i >= 0; i = table[i][1]) {
          stack.push(table[i][0]);
        }
      }

      oldCode = code;
      if (ntable === maxElem) {
        maxElem = 1 << ++bitDepth;
        if (bitDepth > 12) bitDepth = 12;
      }
    }
    b = stack.pop();
    if (b == null) break;
    buf.push(b);
  }

  return buf;
};

/**
 * Expose
 */

exports = PNG;
exports.png = PNG;
exports.gif = GIF;

module.exports = exports;

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = ('' + key).replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });

  return '$' + escapedString;
}

/**
 * Unescape and unwrap key for human-readable display
 *
 * @param {string} key to unescape.
 * @return {string} the unescaped key.
 */
function unescape(key) {
  var unescapeRegex = /(=0|=2)/g;
  var unescaperLookup = {
    '=0': '=',
    '=2': ':'
  };
  var keySubstring = key[0] === '.' && key[1] === '$' ? key.substring(2) : key.substring(1);

  return ('' + keySubstring).replace(unescapeRegex, function (match) {
    return unescaperLookup[match];
  });
}

var KeyEscapeUtils = {
  escape: escape,
  unescape: unescape
};

module.exports = KeyEscapeUtils;

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(7);

var invariant = __webpack_require__(5);

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function oneArgumentPooler(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function twoArgumentPooler(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function threeArgumentPooler(a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fourArgumentPooler = function fourArgumentPooler(a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

var standardReleaser = function standardReleaser(instance) {
  var Klass = this;
  !(instance instanceof Klass) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Trying to release an instance into a pool of a different type.') : _prodInvariant('25') : void 0;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function addPoolingTo(CopyConstructor, pooler) {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler
};

module.exports = PooledClass;

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(17);

var ReactChildren = __webpack_require__(70);
var ReactComponent = __webpack_require__(31);
var ReactPureComponent = __webpack_require__(74);
var ReactClass = __webpack_require__(71);
var ReactDOMFactories = __webpack_require__(72);
var ReactElement = __webpack_require__(6);
var ReactPropTypes = __webpack_require__(73);
var ReactVersion = __webpack_require__(75);

var onlyChild = __webpack_require__(77);
var warning = __webpack_require__(2);

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (process.env.NODE_ENV !== 'production') {
  var ReactElementValidator = __webpack_require__(57);
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var __spread = _assign;

if (process.env.NODE_ENV !== 'production') {
  var warned = false;
  __spread = function __spread() {
    process.env.NODE_ENV !== 'production' ? warning(warned, 'React.__spread is deprecated and should not be used. Use ' + 'Object.assign directly or another helper function with similar ' + 'semantics. You may be seeing this warning due to your compiler. ' + 'See https://fb.me/react-spread-deprecation for more details.') : void 0;
    warned = true;
    return _assign.apply(null, arguments);
  };
}

var React = {

  // Modern

  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild
  },

  Component: ReactComponent,
  PureComponent: ReactPureComponent,

  createElement: createElement,
  cloneElement: cloneElement,
  isValidElement: ReactElement.isValidElement,

  // Classic

  PropTypes: ReactPropTypes,
  createClass: ReactClass.createClass,
  createFactory: createFactory,
  createMixin: function createMixin(mixin) {
    // Currently a noop. Will be used to validate and trace mixins.
    return mixin;
  },

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  DOM: ReactDOMFactories,

  version: ReactVersion,

  // Deprecated hook for JSX spread, don't use this for anything.
  __spread: __spread
};

module.exports = React;

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var PooledClass = __webpack_require__(68);
var ReactElement = __webpack_require__(6);

var emptyFunction = __webpack_require__(29);
var traverseAllChildren = __webpack_require__(78);

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var fourArgumentPooler = PooledClass.fourArgumentPooler;

var userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.func = forEachFunction;
  this.context = forEachContext;
  this.count = 0;
}
ForEachBookKeeping.prototype.destructor = function () {
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(bookKeeping, child, name) {
  var func = bookKeeping.func,
      context = bookKeeping.context;

  func.call(context, child, bookKeeping.count++);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.foreach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }
  var traverseContext = ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, keyPrefix, mapFunction, mapContext) {
  this.result = mapResult;
  this.keyPrefix = keyPrefix;
  this.func = mapFunction;
  this.context = mapContext;
  this.count = 0;
}
MapBookKeeping.prototype.destructor = function () {
  this.result = null;
  this.keyPrefix = null;
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(MapBookKeeping, fourArgumentPooler);

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var result = bookKeeping.result,
      keyPrefix = bookKeeping.keyPrefix,
      func = bookKeeping.func,
      context = bookKeeping.context;

  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, emptyFunction.thatReturnsArgument);
  } else if (mappedChild != null) {
    if (ReactElement.isValidElement(mappedChild)) {
      mappedChild = ReactElement.cloneAndReplaceKey(mappedChild,
      // Keep both the (mapped) and old keys if they differ, just as
      // traverseAllChildren used to do for objects as children
      keyPrefix + (mappedChild.key && (!child || child.key !== mappedChild.key) ? escapeUserProvidedKey(mappedChild.key) + '/' : '') + childKey);
    }
    result.push(mappedChild);
  }
}

function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  var escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  var traverseContext = MapBookKeeping.getPooled(array, escapedPrefix, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.map
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, func, context);
  return result;
}

function forEachSingleChildDummy(traverseContext, child, name) {
  return null;
}

/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.count
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */
function countChildren(children, context) {
  return traverseAllChildren(children, forEachSingleChildDummy, null);
}

/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.toarray
 */
function toArray(children) {
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, emptyFunction.thatReturnsArgument);
  return result;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren,
  mapIntoWithKeyPrefixInternal: mapIntoWithKeyPrefixInternal,
  count: countChildren,
  toArray: toArray
};

module.exports = ReactChildren;

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _prodInvariant = __webpack_require__(7),
    _assign = __webpack_require__(17);

var ReactComponent = __webpack_require__(31);
var ReactElement = __webpack_require__(6);
var ReactPropTypeLocationNames = __webpack_require__(34);
var ReactNoopUpdateQueue = __webpack_require__(33);

var emptyObject = __webpack_require__(30);
var invariant = __webpack_require__(5);
var warning = __webpack_require__(2);

var MIXINS_KEY = 'mixins';

// Helper function to allow the creation of anonymous functions which do not
// have .name set to the name of the variable being assigned to.
function identity(fn) {
  return fn;
}

/**
 * Policies that describe methods in `ReactClassInterface`.
 */

var injectedMixins = [];

/**
 * Composite components are higher-level components that compose other composite
 * or host components.
 *
 * To create a new type of `ReactClass`, pass a specification of
 * your new class to `React.createClass`. The only requirement of your class
 * specification is that you implement a `render` method.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return <div>Hello World</div>;
 *     }
 *   });
 *
 * The class specification supports a specific protocol of methods that have
 * special meaning (e.g. `render`). See `ReactClassInterface` for
 * more the comprehensive protocol. Any other properties and methods in the
 * class specification will be available on the prototype.
 *
 * @interface ReactClassInterface
 * @internal
 */
var ReactClassInterface = {

  /**
   * An array of Mixin objects to include when defining your component.
   *
   * @type {array}
   * @optional
   */
  mixins: 'DEFINE_MANY',

  /**
   * An object containing properties and methods that should be defined on
   * the component's constructor instead of its prototype (static methods).
   *
   * @type {object}
   * @optional
   */
  statics: 'DEFINE_MANY',

  /**
   * Definition of prop types for this component.
   *
   * @type {object}
   * @optional
   */
  propTypes: 'DEFINE_MANY',

  /**
   * Definition of context types for this component.
   *
   * @type {object}
   * @optional
   */
  contextTypes: 'DEFINE_MANY',

  /**
   * Definition of context types this component sets for its children.
   *
   * @type {object}
   * @optional
   */
  childContextTypes: 'DEFINE_MANY',

  // ==== Definition methods ====

  /**
   * Invoked when the component is mounted. Values in the mapping will be set on
   * `this.props` if that prop is not specified (i.e. using an `in` check).
   *
   * This method is invoked before `getInitialState` and therefore cannot rely
   * on `this.state` or use `this.setState`.
   *
   * @return {object}
   * @optional
   */
  getDefaultProps: 'DEFINE_MANY_MERGED',

  /**
   * Invoked once before the component is mounted. The return value will be used
   * as the initial value of `this.state`.
   *
   *   getInitialState: function() {
   *     return {
   *       isOn: false,
   *       fooBaz: new BazFoo()
   *     }
   *   }
   *
   * @return {object}
   * @optional
   */
  getInitialState: 'DEFINE_MANY_MERGED',

  /**
   * @return {object}
   * @optional
   */
  getChildContext: 'DEFINE_MANY_MERGED',

  /**
   * Uses props from `this.props` and state from `this.state` to render the
   * structure of the component.
   *
   * No guarantees are made about when or how often this method is invoked, so
   * it must not have side effects.
   *
   *   render: function() {
   *     var name = this.props.name;
   *     return <div>Hello, {name}!</div>;
   *   }
   *
   * @return {ReactComponent}
   * @nosideeffects
   * @required
   */
  render: 'DEFINE_ONCE',

  // ==== Delegate methods ====

  /**
   * Invoked when the component is initially created and about to be mounted.
   * This may have side effects, but any external subscriptions or data created
   * by this method must be cleaned up in `componentWillUnmount`.
   *
   * @optional
   */
  componentWillMount: 'DEFINE_MANY',

  /**
   * Invoked when the component has been mounted and has a DOM representation.
   * However, there is no guarantee that the DOM node is in the document.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been mounted (initialized and rendered) for the first time.
   *
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidMount: 'DEFINE_MANY',

  /**
   * Invoked before the component receives new props.
   *
   * Use this as an opportunity to react to a prop transition by updating the
   * state using `this.setState`. Current props are accessed via `this.props`.
   *
   *   componentWillReceiveProps: function(nextProps, nextContext) {
   *     this.setState({
   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
   *     });
   *   }
   *
   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
   * transition may cause a state change, but the opposite is not true. If you
   * need it, you are probably looking for `componentWillUpdate`.
   *
   * @param {object} nextProps
   * @optional
   */
  componentWillReceiveProps: 'DEFINE_MANY',

  /**
   * Invoked while deciding if the component should be updated as a result of
   * receiving new props, state and/or context.
   *
   * Use this as an opportunity to `return false` when you're certain that the
   * transition to the new props/state/context will not require a component
   * update.
   *
   *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
   *     return !equal(nextProps, this.props) ||
   *       !equal(nextState, this.state) ||
   *       !equal(nextContext, this.context);
   *   }
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @return {boolean} True if the component should update.
   * @optional
   */
  shouldComponentUpdate: 'DEFINE_ONCE',

  /**
   * Invoked when the component is about to update due to a transition from
   * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
   * and `nextContext`.
   *
   * Use this as an opportunity to perform preparation before an update occurs.
   *
   * NOTE: You **cannot** use `this.setState()` in this method.
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @param {ReactReconcileTransaction} transaction
   * @optional
   */
  componentWillUpdate: 'DEFINE_MANY',

  /**
   * Invoked when the component's DOM representation has been updated.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been updated.
   *
   * @param {object} prevProps
   * @param {?object} prevState
   * @param {?object} prevContext
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidUpdate: 'DEFINE_MANY',

  /**
   * Invoked when the component is about to be removed from its parent and have
   * its DOM representation destroyed.
   *
   * Use this as an opportunity to deallocate any external resources.
   *
   * NOTE: There is no `componentDidUnmount` since your component will have been
   * destroyed by that point.
   *
   * @optional
   */
  componentWillUnmount: 'DEFINE_MANY',

  // ==== Advanced methods ====

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: 'OVERRIDE_BASE'

};

/**
 * Mapping from class specification keys to special processing functions.
 *
 * Although these are declared like instance properties in the specification
 * when defining classes using `React.createClass`, they are actually static
 * and are accessible on the constructor instead of the prototype. Despite
 * being static, they must be defined outside of the "statics" key under
 * which all other static methods are defined.
 */
var RESERVED_SPEC_KEYS = {
  displayName: function displayName(Constructor, _displayName) {
    Constructor.displayName = _displayName;
  },
  mixins: function mixins(Constructor, _mixins) {
    if (_mixins) {
      for (var i = 0; i < _mixins.length; i++) {
        mixSpecIntoComponent(Constructor, _mixins[i]);
      }
    }
  },
  childContextTypes: function childContextTypes(Constructor, _childContextTypes) {
    if (process.env.NODE_ENV !== 'production') {
      validateTypeDef(Constructor, _childContextTypes, 'childContext');
    }
    Constructor.childContextTypes = _assign({}, Constructor.childContextTypes, _childContextTypes);
  },
  contextTypes: function contextTypes(Constructor, _contextTypes) {
    if (process.env.NODE_ENV !== 'production') {
      validateTypeDef(Constructor, _contextTypes, 'context');
    }
    Constructor.contextTypes = _assign({}, Constructor.contextTypes, _contextTypes);
  },
  /**
   * Special case getDefaultProps which should move into statics but requires
   * automatic merging.
   */
  getDefaultProps: function getDefaultProps(Constructor, _getDefaultProps) {
    if (Constructor.getDefaultProps) {
      Constructor.getDefaultProps = createMergedResultFunction(Constructor.getDefaultProps, _getDefaultProps);
    } else {
      Constructor.getDefaultProps = _getDefaultProps;
    }
  },
  propTypes: function propTypes(Constructor, _propTypes) {
    if (process.env.NODE_ENV !== 'production') {
      validateTypeDef(Constructor, _propTypes, 'prop');
    }
    Constructor.propTypes = _assign({}, Constructor.propTypes, _propTypes);
  },
  statics: function statics(Constructor, _statics) {
    mixStaticSpecIntoComponent(Constructor, _statics);
  },
  autobind: function autobind() {} };

function validateTypeDef(Constructor, typeDef, location) {
  for (var propName in typeDef) {
    if (typeDef.hasOwnProperty(propName)) {
      // use a warning instead of an invariant so components
      // don't show up in prod but only in __DEV__
      process.env.NODE_ENV !== 'production' ? warning(typeof typeDef[propName] === 'function', '%s: %s type `%s` is invalid; it must be a function, usually from ' + 'React.PropTypes.', Constructor.displayName || 'ReactClass', ReactPropTypeLocationNames[location], propName) : void 0;
    }
  }
}

function validateMethodOverride(isAlreadyDefined, name) {
  var specPolicy = ReactClassInterface.hasOwnProperty(name) ? ReactClassInterface[name] : null;

  // Disallow overriding of base class methods unless explicitly allowed.
  if (ReactClassMixin.hasOwnProperty(name)) {
    !(specPolicy === 'OVERRIDE_BASE') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClassInterface: You are attempting to override `%s` from your class specification. Ensure that your method names do not overlap with React methods.', name) : _prodInvariant('73', name) : void 0;
  }

  // Disallow defining methods more than once unless explicitly allowed.
  if (isAlreadyDefined) {
    !(specPolicy === 'DEFINE_MANY' || specPolicy === 'DEFINE_MANY_MERGED') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClassInterface: You are attempting to define `%s` on your component more than once. This conflict may be due to a mixin.', name) : _prodInvariant('74', name) : void 0;
  }
}

/**
 * Mixin helper which handles policy validation and reserved
 * specification keys when building React classes.
 */
function mixSpecIntoComponent(Constructor, spec) {
  if (!spec) {
    if (process.env.NODE_ENV !== 'production') {
      var typeofSpec = typeof spec === 'undefined' ? 'undefined' : _typeof(spec);
      var isMixinValid = typeofSpec === 'object' && spec !== null;

      process.env.NODE_ENV !== 'production' ? warning(isMixinValid, '%s: You\'re attempting to include a mixin that is either null ' + 'or not an object. Check the mixins included by the component, ' + 'as well as any mixins they include themselves. ' + 'Expected object but got %s.', Constructor.displayName || 'ReactClass', spec === null ? null : typeofSpec) : void 0;
    }

    return;
  }

  !(typeof spec !== 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClass: You\'re attempting to use a component class or function as a mixin. Instead, just use a regular object.') : _prodInvariant('75') : void 0;
  !!ReactElement.isValidElement(spec) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClass: You\'re attempting to use a component as a mixin. Instead, just use a regular object.') : _prodInvariant('76') : void 0;

  var proto = Constructor.prototype;
  var autoBindPairs = proto.__reactAutoBindPairs;

  // By handling mixins before any other properties, we ensure the same
  // chaining order is applied to methods with DEFINE_MANY policy, whether
  // mixins are listed before or after these methods in the spec.
  if (spec.hasOwnProperty(MIXINS_KEY)) {
    RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
  }

  for (var name in spec) {
    if (!spec.hasOwnProperty(name)) {
      continue;
    }

    if (name === MIXINS_KEY) {
      // We have already handled mixins in a special case above.
      continue;
    }

    var property = spec[name];
    var isAlreadyDefined = proto.hasOwnProperty(name);
    validateMethodOverride(isAlreadyDefined, name);

    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
      RESERVED_SPEC_KEYS[name](Constructor, property);
    } else {
      // Setup methods on prototype:
      // The following member methods should not be automatically bound:
      // 1. Expected ReactClass methods (in the "interface").
      // 2. Overridden methods (that were mixed in).
      var isReactClassMethod = ReactClassInterface.hasOwnProperty(name);
      var isFunction = typeof property === 'function';
      var shouldAutoBind = isFunction && !isReactClassMethod && !isAlreadyDefined && spec.autobind !== false;

      if (shouldAutoBind) {
        autoBindPairs.push(name, property);
        proto[name] = property;
      } else {
        if (isAlreadyDefined) {
          var specPolicy = ReactClassInterface[name];

          // These cases should already be caught by validateMethodOverride.
          !(isReactClassMethod && (specPolicy === 'DEFINE_MANY_MERGED' || specPolicy === 'DEFINE_MANY')) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClass: Unexpected spec policy %s for key %s when mixing in component specs.', specPolicy, name) : _prodInvariant('77', specPolicy, name) : void 0;

          // For methods which are defined more than once, call the existing
          // methods before calling the new property, merging if appropriate.
          if (specPolicy === 'DEFINE_MANY_MERGED') {
            proto[name] = createMergedResultFunction(proto[name], property);
          } else if (specPolicy === 'DEFINE_MANY') {
            proto[name] = createChainedFunction(proto[name], property);
          }
        } else {
          proto[name] = property;
          if (process.env.NODE_ENV !== 'production') {
            // Add verbose displayName to the function, which helps when looking
            // at profiling tools.
            if (typeof property === 'function' && spec.displayName) {
              proto[name].displayName = spec.displayName + '_' + name;
            }
          }
        }
      }
    }
  }
}

function mixStaticSpecIntoComponent(Constructor, statics) {
  if (!statics) {
    return;
  }
  for (var name in statics) {
    var property = statics[name];
    if (!statics.hasOwnProperty(name)) {
      continue;
    }

    var isReserved = name in RESERVED_SPEC_KEYS;
    !!isReserved ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClass: You are attempting to define a reserved property, `%s`, that shouldn\'t be on the "statics" key. Define it as an instance property instead; it will still be accessible on the constructor.', name) : _prodInvariant('78', name) : void 0;

    var isInherited = name in Constructor;
    !!isInherited ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactClass: You are attempting to define `%s` on your component more than once. This conflict may be due to a mixin.', name) : _prodInvariant('79', name) : void 0;
    Constructor[name] = property;
  }
}

/**
 * Merge two objects, but throw if both contain the same key.
 *
 * @param {object} one The first object, which is mutated.
 * @param {object} two The second object
 * @return {object} one after it has been mutated to contain everything in two.
 */
function mergeIntoWithNoDuplicateKeys(one, two) {
  !(one && two && (typeof one === 'undefined' ? 'undefined' : _typeof(one)) === 'object' && (typeof two === 'undefined' ? 'undefined' : _typeof(two)) === 'object') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.') : _prodInvariant('80') : void 0;

  for (var key in two) {
    if (two.hasOwnProperty(key)) {
      !(one[key] === undefined) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'mergeIntoWithNoDuplicateKeys(): Tried to merge two objects with the same key: `%s`. This conflict may be due to a mixin; in particular, this may be caused by two getInitialState() or getDefaultProps() methods returning objects with clashing keys.', key) : _prodInvariant('81', key) : void 0;
      one[key] = two[key];
    }
  }
  return one;
}

/**
 * Creates a function that invokes two functions and merges their return values.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createMergedResultFunction(one, two) {
  return function mergedResult() {
    var a = one.apply(this, arguments);
    var b = two.apply(this, arguments);
    if (a == null) {
      return b;
    } else if (b == null) {
      return a;
    }
    var c = {};
    mergeIntoWithNoDuplicateKeys(c, a);
    mergeIntoWithNoDuplicateKeys(c, b);
    return c;
  };
}

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction(one, two) {
  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

/**
 * Binds a method to the component.
 *
 * @param {object} component Component whose method is going to be bound.
 * @param {function} method Method to be bound.
 * @return {function} The bound method.
 */
function bindAutoBindMethod(component, method) {
  var boundMethod = method.bind(component);
  if (process.env.NODE_ENV !== 'production') {
    boundMethod.__reactBoundContext = component;
    boundMethod.__reactBoundMethod = method;
    boundMethod.__reactBoundArguments = null;
    var componentName = component.constructor.displayName;
    var _bind = boundMethod.bind;
    boundMethod.bind = function (newThis) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      // User is trying to bind() an autobound method; we effectively will
      // ignore the value of "this" that the user is trying to use, so
      // let's warn.
      if (newThis !== component && newThis !== null) {
        process.env.NODE_ENV !== 'production' ? warning(false, 'bind(): React component methods may only be bound to the ' + 'component instance. See %s', componentName) : void 0;
      } else if (!args.length) {
        process.env.NODE_ENV !== 'production' ? warning(false, 'bind(): You are binding a component method to the component. ' + 'React does this for you automatically in a high-performance ' + 'way, so you can safely remove this call. See %s', componentName) : void 0;
        return boundMethod;
      }
      var reboundMethod = _bind.apply(boundMethod, arguments);
      reboundMethod.__reactBoundContext = component;
      reboundMethod.__reactBoundMethod = method;
      reboundMethod.__reactBoundArguments = args;
      return reboundMethod;
    };
  }
  return boundMethod;
}

/**
 * Binds all auto-bound methods in a component.
 *
 * @param {object} component Component whose method is going to be bound.
 */
function bindAutoBindMethods(component) {
  var pairs = component.__reactAutoBindPairs;
  for (var i = 0; i < pairs.length; i += 2) {
    var autoBindKey = pairs[i];
    var method = pairs[i + 1];
    component[autoBindKey] = bindAutoBindMethod(component, method);
  }
}

/**
 * Add more to the ReactClass base class. These are all legacy features and
 * therefore not already part of the modern ReactComponent.
 */
var ReactClassMixin = {

  /**
   * TODO: This will be deprecated because state should always keep a consistent
   * type signature and the only use case for this, is to avoid that.
   */
  replaceState: function replaceState(newState, callback) {
    this.updater.enqueueReplaceState(this, newState);
    if (callback) {
      this.updater.enqueueCallback(this, callback, 'replaceState');
    }
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function isMounted() {
    return this.updater.isMounted(this);
  }
};

var ReactClassComponent = function ReactClassComponent() {};
_assign(ReactClassComponent.prototype, ReactComponent.prototype, ReactClassMixin);

/**
 * Module for creating composite components.
 *
 * @class ReactClass
 */
var ReactClass = {

  /**
   * Creates a composite component class given a class specification.
   * See https://facebook.github.io/react/docs/top-level-api.html#react.createclass
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  createClass: function createClass(spec) {
    // To keep our warnings more understandable, we'll use a little hack here to
    // ensure that Constructor.name !== 'Constructor'. This makes sure we don't
    // unnecessarily identify a class without displayName as 'Constructor'.
    var Constructor = identity(function (props, context, updater) {
      // This constructor gets overridden by mocks. The argument is used
      // by mocks to assert on what gets mounted.

      if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_ENV !== 'production' ? warning(this instanceof Constructor, 'Something is calling a React component directly. Use a factory or ' + 'JSX instead. See: https://fb.me/react-legacyfactory') : void 0;
      }

      // Wire up auto-binding
      if (this.__reactAutoBindPairs.length) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;

      this.state = null;

      // ReactClasses doesn't have constructors. Instead, they use the
      // getInitialState and componentWillMount methods for initialization.

      var initialState = this.getInitialState ? this.getInitialState() : null;
      if (process.env.NODE_ENV !== 'production') {
        // We allow auto-mocks to proceed as if they're returning null.
        if (initialState === undefined && this.getInitialState._isMockFunction) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      !((typeof initialState === 'undefined' ? 'undefined' : _typeof(initialState)) === 'object' && !Array.isArray(initialState)) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.getInitialState(): must return an object or null', Constructor.displayName || 'ReactCompositeComponent') : _prodInvariant('82', Constructor.displayName || 'ReactCompositeComponent') : void 0;

      this.state = initialState;
    });
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;
    Constructor.prototype.__reactAutoBindPairs = [];

    injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));

    mixSpecIntoComponent(Constructor, spec);

    // Initialize the defaultProps property after all mixins have been merged.
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    if (process.env.NODE_ENV !== 'production') {
      // This is a tag to indicate that the use of these method names is ok,
      // since it's used with createClass. If it's not, then it's likely a
      // mistake so we'll warn you to use the static property, property
      // initializer or constructor respectively.
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps.isReactClassApproved = {};
      }
      if (Constructor.prototype.getInitialState) {
        Constructor.prototype.getInitialState.isReactClassApproved = {};
      }
    }

    !Constructor.prototype.render ? process.env.NODE_ENV !== 'production' ? invariant(false, 'createClass(...): Class specification must implement a `render` method.') : _prodInvariant('83') : void 0;

    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(!Constructor.prototype.componentShouldUpdate, '%s has a method called ' + 'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' + 'The name is phrased as a question because the function is ' + 'expected to return a value.', spec.displayName || 'A component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(!Constructor.prototype.componentWillRecieveProps, '%s has a method called ' + 'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?', spec.displayName || 'A component') : void 0;
    }

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    return Constructor;
  },

  injection: {
    injectMixin: function injectMixin(mixin) {
      injectedMixins.push(mixin);
    }
  }

};

module.exports = ReactClass;

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactElement = __webpack_require__(6);

/**
 * Create a factory that creates HTML tag elements.
 *
 * @private
 */
var createDOMFactory = ReactElement.createFactory;
if (process.env.NODE_ENV !== 'production') {
  var ReactElementValidator = __webpack_require__(57);
  createDOMFactory = ReactElementValidator.createFactory;
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOMFactories = {
  a: createDOMFactory('a'),
  abbr: createDOMFactory('abbr'),
  address: createDOMFactory('address'),
  area: createDOMFactory('area'),
  article: createDOMFactory('article'),
  aside: createDOMFactory('aside'),
  audio: createDOMFactory('audio'),
  b: createDOMFactory('b'),
  base: createDOMFactory('base'),
  bdi: createDOMFactory('bdi'),
  bdo: createDOMFactory('bdo'),
  big: createDOMFactory('big'),
  blockquote: createDOMFactory('blockquote'),
  body: createDOMFactory('body'),
  br: createDOMFactory('br'),
  button: createDOMFactory('button'),
  canvas: createDOMFactory('canvas'),
  caption: createDOMFactory('caption'),
  cite: createDOMFactory('cite'),
  code: createDOMFactory('code'),
  col: createDOMFactory('col'),
  colgroup: createDOMFactory('colgroup'),
  data: createDOMFactory('data'),
  datalist: createDOMFactory('datalist'),
  dd: createDOMFactory('dd'),
  del: createDOMFactory('del'),
  details: createDOMFactory('details'),
  dfn: createDOMFactory('dfn'),
  dialog: createDOMFactory('dialog'),
  div: createDOMFactory('div'),
  dl: createDOMFactory('dl'),
  dt: createDOMFactory('dt'),
  em: createDOMFactory('em'),
  embed: createDOMFactory('embed'),
  fieldset: createDOMFactory('fieldset'),
  figcaption: createDOMFactory('figcaption'),
  figure: createDOMFactory('figure'),
  footer: createDOMFactory('footer'),
  form: createDOMFactory('form'),
  h1: createDOMFactory('h1'),
  h2: createDOMFactory('h2'),
  h3: createDOMFactory('h3'),
  h4: createDOMFactory('h4'),
  h5: createDOMFactory('h5'),
  h6: createDOMFactory('h6'),
  head: createDOMFactory('head'),
  header: createDOMFactory('header'),
  hgroup: createDOMFactory('hgroup'),
  hr: createDOMFactory('hr'),
  html: createDOMFactory('html'),
  i: createDOMFactory('i'),
  iframe: createDOMFactory('iframe'),
  img: createDOMFactory('img'),
  input: createDOMFactory('input'),
  ins: createDOMFactory('ins'),
  kbd: createDOMFactory('kbd'),
  keygen: createDOMFactory('keygen'),
  label: createDOMFactory('label'),
  legend: createDOMFactory('legend'),
  li: createDOMFactory('li'),
  link: createDOMFactory('link'),
  main: createDOMFactory('main'),
  map: createDOMFactory('map'),
  mark: createDOMFactory('mark'),
  menu: createDOMFactory('menu'),
  menuitem: createDOMFactory('menuitem'),
  meta: createDOMFactory('meta'),
  meter: createDOMFactory('meter'),
  nav: createDOMFactory('nav'),
  noscript: createDOMFactory('noscript'),
  object: createDOMFactory('object'),
  ol: createDOMFactory('ol'),
  optgroup: createDOMFactory('optgroup'),
  option: createDOMFactory('option'),
  output: createDOMFactory('output'),
  p: createDOMFactory('p'),
  param: createDOMFactory('param'),
  picture: createDOMFactory('picture'),
  pre: createDOMFactory('pre'),
  progress: createDOMFactory('progress'),
  q: createDOMFactory('q'),
  rp: createDOMFactory('rp'),
  rt: createDOMFactory('rt'),
  ruby: createDOMFactory('ruby'),
  s: createDOMFactory('s'),
  samp: createDOMFactory('samp'),
  script: createDOMFactory('script'),
  section: createDOMFactory('section'),
  select: createDOMFactory('select'),
  small: createDOMFactory('small'),
  source: createDOMFactory('source'),
  span: createDOMFactory('span'),
  strong: createDOMFactory('strong'),
  style: createDOMFactory('style'),
  sub: createDOMFactory('sub'),
  summary: createDOMFactory('summary'),
  sup: createDOMFactory('sup'),
  table: createDOMFactory('table'),
  tbody: createDOMFactory('tbody'),
  td: createDOMFactory('td'),
  textarea: createDOMFactory('textarea'),
  tfoot: createDOMFactory('tfoot'),
  th: createDOMFactory('th'),
  thead: createDOMFactory('thead'),
  time: createDOMFactory('time'),
  title: createDOMFactory('title'),
  tr: createDOMFactory('tr'),
  track: createDOMFactory('track'),
  u: createDOMFactory('u'),
  ul: createDOMFactory('ul'),
  'var': createDOMFactory('var'),
  video: createDOMFactory('video'),
  wbr: createDOMFactory('wbr'),

  // SVG
  circle: createDOMFactory('circle'),
  clipPath: createDOMFactory('clipPath'),
  defs: createDOMFactory('defs'),
  ellipse: createDOMFactory('ellipse'),
  g: createDOMFactory('g'),
  image: createDOMFactory('image'),
  line: createDOMFactory('line'),
  linearGradient: createDOMFactory('linearGradient'),
  mask: createDOMFactory('mask'),
  path: createDOMFactory('path'),
  pattern: createDOMFactory('pattern'),
  polygon: createDOMFactory('polygon'),
  polyline: createDOMFactory('polyline'),
  radialGradient: createDOMFactory('radialGradient'),
  rect: createDOMFactory('rect'),
  stop: createDOMFactory('stop'),
  svg: createDOMFactory('svg'),
  text: createDOMFactory('text'),
  tspan: createDOMFactory('tspan')
};

module.exports = ReactDOMFactories;

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var ReactElement = __webpack_require__(6);
var ReactPropTypeLocationNames = __webpack_require__(34);
var ReactPropTypesSecret = __webpack_require__(58);

var emptyFunction = __webpack_require__(29);
var getIteratorFn = __webpack_require__(36);
var warning = __webpack_require__(2);

/**
 * Collection of methods that allow declaration and validation of props that are
 * supplied to React components. Example usage:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyArticle = React.createClass({
 *     propTypes: {
 *       // An optional string prop named "description".
 *       description: Props.string,
 *
 *       // A required enum prop named "category".
 *       category: Props.oneOf(['News','Photos']).isRequired,
 *
 *       // A prop named "dialog" that requires an instance of Dialog.
 *       dialog: Props.instanceOf(Dialog).isRequired
 *     },
 *     render: function() { ... }
 *   });
 *
 * A more formal specification of how these methods are used:
 *
 *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
 *   decl := ReactPropTypes.{type}(.isRequired)?
 *
 * Each and every declaration produces a function with the same signature. This
 * allows the creation of custom validation functions. For example:
 *
 *  var MyLink = React.createClass({
 *    propTypes: {
 *      // An optional string or URI prop named "href".
 *      href: function(props, propName, componentName) {
 *        var propValue = props[propName];
 *        if (propValue != null && typeof propValue !== 'string' &&
 *            !(propValue instanceof URI)) {
 *          return new Error(
 *            'Expected a string or an URI for ' + propName + ' in ' +
 *            componentName
 *          );
 *        }
 *      }
 *    },
 *    render: function() {...}
 *  });
 *
 * @internal
 */

var ANONYMOUS = '<<anonymous>>';

var ReactPropTypes = {
  array: createPrimitiveTypeChecker('array'),
  bool: createPrimitiveTypeChecker('boolean'),
  func: createPrimitiveTypeChecker('function'),
  number: createPrimitiveTypeChecker('number'),
  object: createPrimitiveTypeChecker('object'),
  string: createPrimitiveTypeChecker('string'),
  symbol: createPrimitiveTypeChecker('symbol'),

  any: createAnyTypeChecker(),
  arrayOf: createArrayOfTypeChecker,
  element: createElementTypeChecker(),
  instanceOf: createInstanceTypeChecker,
  node: createNodeChecker(),
  objectOf: createObjectOfTypeChecker,
  oneOf: createEnumTypeChecker,
  oneOfType: createUnionTypeChecker,
  shape: createShapeTypeChecker
};

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
/*eslint-disable no-self-compare*/
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}
/*eslint-enable no-self-compare*/

/**
 * We use an Error-like object for backward compatibility as people may call
 * PropTypes directly and inspect their output. However we don't use real
 * Errors anymore. We don't inspect their stack anyway, and creating them
 * is prohibitively expensive if they are created too often, such as what
 * happens in oneOfType() for any type before the one that matched.
 */
function PropTypeError(message) {
  this.message = message;
  this.stack = '';
}
// Make `instanceof Error` still work for returned errors.
PropTypeError.prototype = Error.prototype;

function createChainableTypeChecker(validate) {
  if (process.env.NODE_ENV !== 'production') {
    var manualPropTypeCallCache = {};
  }
  function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
    componentName = componentName || ANONYMOUS;
    propFullName = propFullName || propName;
    if (process.env.NODE_ENV !== 'production') {
      if (secret !== ReactPropTypesSecret && typeof console !== 'undefined') {
        var cacheKey = componentName + ':' + propName;
        if (!manualPropTypeCallCache[cacheKey]) {
          process.env.NODE_ENV !== 'production' ? warning(false, 'You are manually calling a React.PropTypes validation ' + 'function for the `%s` prop on `%s`. This is deprecated ' + 'and will not work in production with the next major version. ' + 'You may be seeing this warning due to a third-party PropTypes ' + 'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.', propFullName, componentName) : void 0;
          manualPropTypeCallCache[cacheKey] = true;
        }
      }
    }
    if (props[propName] == null) {
      var locationName = ReactPropTypeLocationNames[location];
      if (isRequired) {
        if (props[propName] === null) {
          return new PropTypeError('The ' + locationName + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
        }
        return new PropTypeError('The ' + locationName + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
      }
      return null;
    } else {
      return validate(props, propName, componentName, location, propFullName);
    }
  }

  var chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}

function createPrimitiveTypeChecker(expectedType) {
  function validate(props, propName, componentName, location, propFullName, secret) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== expectedType) {
      var locationName = ReactPropTypeLocationNames[location];
      // `propValue` being instance of, say, date/regexp, pass the 'object'
      // check, but we can offer a more precise error message here rather than
      // 'of type `object`'.
      var preciseType = getPreciseType(propValue);

      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createAnyTypeChecker() {
  return createChainableTypeChecker(emptyFunction.thatReturns(null));
}

function createArrayOfTypeChecker(typeChecker) {
  function validate(props, propName, componentName, location, propFullName) {
    if (typeof typeChecker !== 'function') {
      return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
    }
    var propValue = props[propName];
    if (!Array.isArray(propValue)) {
      var locationName = ReactPropTypeLocationNames[location];
      var propType = getPropType(propValue);
      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
    }
    for (var i = 0; i < propValue.length; i++) {
      var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
      if (error instanceof Error) {
        return error;
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createElementTypeChecker() {
  function validate(props, propName, componentName, location, propFullName) {
    var propValue = props[propName];
    if (!ReactElement.isValidElement(propValue)) {
      var locationName = ReactPropTypeLocationNames[location];
      var propType = getPropType(propValue);
      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createInstanceTypeChecker(expectedClass) {
  function validate(props, propName, componentName, location, propFullName) {
    if (!(props[propName] instanceof expectedClass)) {
      var locationName = ReactPropTypeLocationNames[location];
      var expectedClassName = expectedClass.name || ANONYMOUS;
      var actualClassName = getClassName(props[propName]);
      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createEnumTypeChecker(expectedValues) {
  if (!Array.isArray(expectedValues)) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOf, expected an instance of array.') : void 0;
    return emptyFunction.thatReturnsNull;
  }

  function validate(props, propName, componentName, location, propFullName) {
    var propValue = props[propName];
    for (var i = 0; i < expectedValues.length; i++) {
      if (is(propValue, expectedValues[i])) {
        return null;
      }
    }

    var locationName = ReactPropTypeLocationNames[location];
    var valuesString = JSON.stringify(expectedValues);
    return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
  }
  return createChainableTypeChecker(validate);
}

function createObjectOfTypeChecker(typeChecker) {
  function validate(props, propName, componentName, location, propFullName) {
    if (typeof typeChecker !== 'function') {
      return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
    }
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== 'object') {
      var locationName = ReactPropTypeLocationNames[location];
      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
    }
    for (var key in propValue) {
      if (propValue.hasOwnProperty(key)) {
        var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createUnionTypeChecker(arrayOfTypeCheckers) {
  if (!Array.isArray(arrayOfTypeCheckers)) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
    return emptyFunction.thatReturnsNull;
  }

  function validate(props, propName, componentName, location, propFullName) {
    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret) == null) {
        return null;
      }
    }

    var locationName = ReactPropTypeLocationNames[location];
    return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
  }
  return createChainableTypeChecker(validate);
}

function createNodeChecker() {
  function validate(props, propName, componentName, location, propFullName) {
    if (!isNode(props[propName])) {
      var locationName = ReactPropTypeLocationNames[location];
      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createShapeTypeChecker(shapeTypes) {
  function validate(props, propName, componentName, location, propFullName) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== 'object') {
      var locationName = ReactPropTypeLocationNames[location];
      return new PropTypeError('Invalid ' + locationName + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
    }
    for (var key in shapeTypes) {
      var checker = shapeTypes[key];
      if (!checker) {
        continue;
      }
      var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
      if (error) {
        return error;
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function isNode(propValue) {
  switch (typeof propValue === 'undefined' ? 'undefined' : _typeof(propValue)) {
    case 'number':
    case 'string':
    case 'undefined':
      return true;
    case 'boolean':
      return !propValue;
    case 'object':
      if (Array.isArray(propValue)) {
        return propValue.every(isNode);
      }
      if (propValue === null || ReactElement.isValidElement(propValue)) {
        return true;
      }

      var iteratorFn = getIteratorFn(propValue);
      if (iteratorFn) {
        var iterator = iteratorFn.call(propValue);
        var step;
        if (iteratorFn !== propValue.entries) {
          while (!(step = iterator.next()).done) {
            if (!isNode(step.value)) {
              return false;
            }
          }
        } else {
          // Iterator will provide entry [k,v] tuples rather than values.
          while (!(step = iterator.next()).done) {
            var entry = step.value;
            if (entry) {
              if (!isNode(entry[1])) {
                return false;
              }
            }
          }
        }
      } else {
        return false;
      }

      return true;
    default:
      return false;
  }
}

function isSymbol(propType, propValue) {
  // Native Symbol.
  if (propType === 'symbol') {
    return true;
  }

  // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
  if (propValue['@@toStringTag'] === 'Symbol') {
    return true;
  }

  // Fallback for non-spec compliant Symbols which are polyfilled.
  if (typeof Symbol === 'function' && propValue instanceof Symbol) {
    return true;
  }

  return false;
}

// Equivalent of `typeof` but with special handling for array and regexp.
function getPropType(propValue) {
  var propType = typeof propValue === 'undefined' ? 'undefined' : _typeof(propValue);
  if (Array.isArray(propValue)) {
    return 'array';
  }
  if (propValue instanceof RegExp) {
    // Old webkits (at least until Android 4.0) return 'function' rather than
    // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
    // passes PropTypes.object.
    return 'object';
  }
  if (isSymbol(propType, propValue)) {
    return 'symbol';
  }
  return propType;
}

// This handles more types than `getPropType`. Only used for error messages.
// See `createPrimitiveTypeChecker`.
function getPreciseType(propValue) {
  var propType = getPropType(propValue);
  if (propType === 'object') {
    if (propValue instanceof Date) {
      return 'date';
    } else if (propValue instanceof RegExp) {
      return 'regexp';
    }
  }
  return propType;
}

// Returns class name of the object, if any.
function getClassName(propValue) {
  if (!propValue.constructor || !propValue.constructor.name) {
    return ANONYMOUS;
  }
  return propValue.constructor.name;
}

module.exports = ReactPropTypes;

/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(17);

var ReactComponent = __webpack_require__(31);
var ReactNoopUpdateQueue = __webpack_require__(33);

var emptyObject = __webpack_require__(30);

/**
 * Base class helpers for the updating state of a component.
 */
function ReactPureComponent(props, context, updater) {
  // Duplicated from ReactComponent.
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

function ComponentDummy() {}
ComponentDummy.prototype = ReactComponent.prototype;
ReactPureComponent.prototype = new ComponentDummy();
ReactPureComponent.prototype.constructor = ReactPureComponent;
// Avoid an extra prototype jump for these methods.
_assign(ReactPureComponent.prototype, ReactComponent.prototype);
ReactPureComponent.prototype.isPureReactComponent = true;

module.exports = ReactPureComponent;

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



module.exports = '15.4.2';

/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _prodInvariant = __webpack_require__(7);

var ReactPropTypeLocationNames = __webpack_require__(34);
var ReactPropTypesSecret = __webpack_require__(58);

var invariant = __webpack_require__(5);
var warning = __webpack_require__(2);

var ReactComponentTreeHook;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = __webpack_require__(32);
}

var loggedTypeFailures = {};

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?object} element The React element that is being type-checked
 * @param {?number} debugID The React component instance that is being type-checked
 * @private
 */
function checkReactTypeSpec(typeSpecs, values, location, componentName, element, debugID) {
  for (var typeSpecName in typeSpecs) {
    if (typeSpecs.hasOwnProperty(typeSpecName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        // This is intentionally an invariant that gets caught. It's the same
        // behavior as without this statement except with a better message.
        !(typeof typeSpecs[typeSpecName] === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s: %s type `%s` is invalid; it must be a function, usually from React.PropTypes.', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : _prodInvariant('84', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : void 0;
        error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
      } catch (ex) {
        error = ex;
      }
      process.env.NODE_ENV !== 'production' ? warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName, typeof error === 'undefined' ? 'undefined' : _typeof(error)) : void 0;
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var componentStackInfo = '';

        if (process.env.NODE_ENV !== 'production') {
          if (!ReactComponentTreeHook) {
            ReactComponentTreeHook = __webpack_require__(32);
          }
          if (debugID !== null) {
            componentStackInfo = ReactComponentTreeHook.getStackAddendumByID(debugID);
          } else if (element !== null) {
            componentStackInfo = ReactComponentTreeHook.getCurrentStackAddendum(element);
          }
        }

        process.env.NODE_ENV !== 'production' ? warning(false, 'Failed %s type: %s%s', location, error.message, componentStackInfo) : void 0;
      }
    }
  }
}

module.exports = checkReactTypeSpec;

/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */


var _prodInvariant = __webpack_require__(7);

var ReactElement = __webpack_require__(6);

var invariant = __webpack_require__(5);

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.only
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */
function onlyChild(children) {
  !ReactElement.isValidElement(children) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'React.Children.only expected to receive a single React element child.') : _prodInvariant('143') : void 0;
  return children;
}

module.exports = onlyChild;

/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _prodInvariant = __webpack_require__(7);

var ReactCurrentOwner = __webpack_require__(18);
var REACT_ELEMENT_TYPE = __webpack_require__(56);

var getIteratorFn = __webpack_require__(36);
var invariant = __webpack_require__(5);
var KeyEscapeUtils = __webpack_require__(67);
var warning = __webpack_require__(2);

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

/**
 * This is inlined from ReactElement since this file is shared between
 * isomorphic and renderers. We could extract this to a
 *
 */

/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

var didWarnAboutMaps = false;

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (component && (typeof component === 'undefined' ? 'undefined' : _typeof(component)) === 'object' && component.key != null) {
    // Explicit key
    return KeyEscapeUtils.escape(component.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  var type = typeof children === 'undefined' ? 'undefined' : _typeof(children);

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  if (children === null || type === 'string' || type === 'number' ||
  // The following is inlined from ReactElement. This means we can optimize
  // some checks. React Fiber also inlines this logic for similar purposes.
  type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE) {
    callback(traverseContext, children,
    // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows.
    nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
    }
  } else {
    var iteratorFn = getIteratorFn(children);
    if (iteratorFn) {
      var iterator = iteratorFn.call(children);
      var step;
      if (iteratorFn !== children.entries) {
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = nextNamePrefix + getComponentKey(child, ii++);
          subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          var mapsAsChildrenAddendum = '';
          if (ReactCurrentOwner.current) {
            var mapsAsChildrenOwnerName = ReactCurrentOwner.current.getName();
            if (mapsAsChildrenOwnerName) {
              mapsAsChildrenAddendum = ' Check the render method of `' + mapsAsChildrenOwnerName + '`.';
            }
          }
          process.env.NODE_ENV !== 'production' ? warning(didWarnAboutMaps, 'Using Maps as children is not yet fully supported. It is an ' + 'experimental feature that might be removed. Convert it to a ' + 'sequence / iterable of keyed ReactElements instead.%s', mapsAsChildrenAddendum) : void 0;
          didWarnAboutMaps = true;
        }
        // Iterator will provide entry [k,v] tuples rather than values.
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (entry) {
            child = entry[1];
            nextName = nextNamePrefix + KeyEscapeUtils.escape(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0);
            subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
          }
        }
      }
    } else if (type === 'object') {
      var addendum = '';
      if (process.env.NODE_ENV !== 'production') {
        addendum = ' If you meant to render a collection of children, use an array ' + 'instead or wrap the object using createFragment(object) from the ' + 'React add-ons.';
        if (children._isReactElement) {
          addendum = ' It looks like you\'re using an element created by a different ' + 'version of React. Make sure to use only one copy of React.';
        }
        if (ReactCurrentOwner.current) {
          var name = ReactCurrentOwner.current.getName();
          if (name) {
            addendum += ' Check the render method of `' + name + '`.';
          }
        }
      }
      var childrenString = String(children);
       true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Objects are not valid as a React child (found: %s).%s', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : _prodInvariant('31', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : void 0;
    }
  }

  return subtreeCount;
}

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

module.exports = traverseAllChildren;

/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(62);

var _react2 = _interopRequireDefault(_react);

var _blessed = __webpack_require__(38);

var _blessed2 = _interopRequireDefault(_blessed);

var _reactBlessed = __webpack_require__(61);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Rendering a simple centered box
var App = function (_Component) {
  _inherits(App, _Component);

  function App() {
    _classCallCheck(this, App);

    return _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).apply(this, arguments));
  }

  _createClass(App, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'box',
        { top: 'center',
          left: 'center',
          width: '50%',
          height: '50%',
          border: { type: 'line' },
          style: { border: { fg: 'blue' } } },
        'Hello World!'
      );
    }
  }]);

  return App;
}(_react.Component);

// Creating our screen


var screen = _blessed2.default.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'react-blessed hello world'
});

// Adding a way to quit the program
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
  return process.exit(0);
});

// Rendering the React app using our screen
var component = (0, _reactBlessed.render)(_react2.default.createElement(App, null), screen);

/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./ansiimage": 19,
	"./ansiimage.js": 19,
	"./bigtext": 40,
	"./bigtext.js": 40,
	"./box": 1,
	"./box.js": 1,
	"./button": 13,
	"./button.js": 13,
	"./checkbox": 20,
	"./checkbox.js": 20,
	"./element": 4,
	"./element.js": 4,
	"./filemanager": 41,
	"./filemanager.js": 41,
	"./form": 42,
	"./form.js": 42,
	"./image": 43,
	"./image.js": 43,
	"./input": 9,
	"./input.js": 9,
	"./layout": 44,
	"./layout.js": 44,
	"./line": 45,
	"./line.js": 45,
	"./list": 14,
	"./list.js": 14,
	"./listbar": 46,
	"./listbar.js": 46,
	"./listtable": 47,
	"./listtable.js": 47,
	"./loading": 48,
	"./loading.js": 48,
	"./log": 21,
	"./log.js": 21,
	"./message": 49,
	"./message.js": 49,
	"./node": 0,
	"./node.js": 0,
	"./overlayimage": 22,
	"./overlayimage.js": 22,
	"./progressbar": 50,
	"./progressbar.js": 50,
	"./prompt": 51,
	"./prompt.js": 51,
	"./question": 52,
	"./question.js": 52,
	"./radiobutton": 53,
	"./radiobutton.js": 53,
	"./radioset": 54,
	"./radioset.js": 54,
	"./screen": 15,
	"./screen.js": 15,
	"./scrollablebox": 16,
	"./scrollablebox.js": 16,
	"./scrollabletext": 23,
	"./scrollabletext.js": 23,
	"./table": 24,
	"./table.js": 24,
	"./terminal": 25,
	"./terminal.js": 25,
	"./text": 26,
	"./text.js": 26,
	"./textarea": 27,
	"./textarea.js": 27,
	"./textbox": 28,
	"./textbox.js": 28,
	"./video": 55,
	"./video.js": 55
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number or string
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 80;

/***/ }),
/* 81 */
/***/ (function(module, exports) {

module.exports = require("zlib");

/***/ })
/******/ ]);