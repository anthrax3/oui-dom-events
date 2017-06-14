'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// IE10+ Support
// inspired by zepto event https://github.com/madrobby/zepto/blob/master/src/event.js

var handlers = {};

var specialEvents = {};
specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

// every element and callback function will have an unique dtId
var _dtId = 1;

/**
 * Get dtId of Element or callback function
 * @param  {Object|Function} obj Element or callback function
 * @return {Number} unique dtId
 */
function getDtId(obj) {
  return obj._dtId || (obj._dtId = _dtId++);
}

/**
 * Get event object of event string, the first `.` is used to split event and namespace
 *
 * @param  {String} event Event type string with namespace or not
 * @return {Object} An Object with `e` and `ns` key
 */
function parse(event) {
  var dotIndex = event.indexOf('.');
  if (dotIndex > 0) {
    return {
      e: event.substring(0, event.indexOf('.')),
      ns: event.substring(dotIndex + 1, event.length)
    };
  }

  return { e: event };
}

/**
 * Find matched event handlers
 * @param  {Element} el the element to find
 * @param  {String} selector Used by event delegation, null if not
 * @param  {String} event Event string may with namespace
 * @param  {Function} callback the callback to find, optional
 * @return {Array} Array of handlers bind to el
 */
function findHandlers(el, selector, event, callback) {
  event = parse(event);
  return (handlers[getDtId(el)] || []).filter(function (handler) {
    return handler && (!event.e || handler.e === event.e) && (!event.ns || handler.ns === event.ns) && (!callback || handler.callback === callback) && (!selector || handler.selector === selector);
  });
}

function removeEvent(el, selector, event, callback) {
  var eventName = parse(event).e;

  if (!el._dtId) return false;
  var elHandlers = handlers[getDtId(el)];
  var matchedHandlers = findHandlers(el, selector, event, callback);
  matchedHandlers.forEach(function (handler) {
    if (el.removeEventListener) {
      el.removeEventListener(eventName, handler.delegator || handler.callback);
    } else if (el.detachEvent) {
      el.detachEvent('on' + eventName, handler.delegator || handler.callback);
    }
    elHandlers.splice(elHandlers.indexOf(handler), 1);
  });
}

// delegator 只用于 delegate 时有用。
function bindEvent(el, selector, event, callback, delegator) {
  var eventName = parse(event).e;
  var ns = parse(event).ns;

  if (el.addEventListener) {
    el.addEventListener(eventName, delegator || callback, false);
  } else if (el.attachEvent) {
    el.attachEvent('on' + eventName, delegator || callback);
  }

  // push events to handlers
  var id = getDtId(el);
  var elHandlers = handlers[id] || (handlers[id] = []);
  elHandlers.push({
    delegator: delegator,
    callback: callback,
    e: eventName,
    ns: ns,
    selector: selector
  });
}

var Events = {
  /**
   * Register a callback
   *
   * @param  {Element} el the element to bind event to
   * @param  {String} eventType event type, can with namesapce
   * @param  {Function} callback callback to invoke
   * @return {Null} return null
   */
  on: function on(el, eventType, callback) {
    bindEvent(el, null, eventType, callback);
  },


  /**
   * Unregister a callback
   *
   * @param  {Element} el the element to bind event to
   * @param  {String} eventType event type, can with namesapce
   * @param  {Function} callback optional, callback to invoke
   * @return {Null} return null
   */
  off: function off(el, eventType, callback) {
    // find callbacks
    removeEvent(el, null, eventType, callback);
  },


  /**
   * Register a callback that will execute exactly once
   *
   * @param  {Element} el the element to bind event to
   * @param  {String} eventType event type, can with namesapce
   * @param  {Function} callback callback to invoke
   * @return {Null} return null
   */
  once: function once(el, eventType, callback) {
    var recursiveFunction = function recursiveFunction(e) {
      Events.off(e.currentTarget, e.type, recursiveFunction);
      return callback(e);
    };

    this.on(el, eventType, recursiveFunction);
  },


  // Delegate a callback to selector under el
  delegate: function delegate(el, selector, eventType, callback) {
    // bind event to el. and check if selector match
    var delegator = function delegator(e) {
      var els = el.querySelectorAll(selector);
      var matched = false;
      for (var i = 0; i < els.length; i++) {
        var _el = els[i];
        if (_el === e.target || _el.contains(e.target)) {
          matched = _el;
          break;
        }
      }
      if (matched) {
        callback.apply(matched, [].slice.call(arguments));
      }
    };

    bindEvent(el, selector, eventType, callback, delegator);
  },


  // Undelegate a callback to selector under el
  undelegate: function undelegate(el, selector, eventType, callback) {
    removeEvent(el, selector, eventType, callback);
  },


  // Dispatch an event with props to el
  trigger: function trigger(el, eventType, props) {
    var event = document.createEvent(specialEvents[eventType] || 'Events');
    var bubbles = true;
    if (props) {
      for (var name in props) {
        if ({}.hasOwnProperty.call(props, name)) {
          name === 'bubbles' ? bubbles = !!props[name] : event[name] = props[name];
        }
      }
    }
    event.initEvent(eventType, bubbles, true);
    el.dispatchEvent(event);
  }
};

exports.default = Events;