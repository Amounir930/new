var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true,
      });
  return to;
};
var __commonJS = (cb, mod) => () => (
  mod || cb((mod = { exports: {} }).exports, mod), mod.exports
);

// node_modules/.bun/react@18.3.1/node_modules/react/cjs/react.development.js
var require_react_development = __commonJS((exports, module) => {
  if (true) {
    (function () {
      if (
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart ===
          'function'
      ) {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
      }
      var ReactVersion = '18.3.1';
      var REACT_ELEMENT_TYPE = Symbol.for('react.element');
      var REACT_PORTAL_TYPE = Symbol.for('react.portal');
      var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
      var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
      var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
      var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
      var REACT_CONTEXT_TYPE = Symbol.for('react.context');
      var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
      var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
      var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
      var REACT_MEMO_TYPE = Symbol.for('react.memo');
      var REACT_LAZY_TYPE = Symbol.for('react.lazy');
      var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = '@@iterator';
      function getIteratorFn(maybeIterable) {
        if (maybeIterable === null || typeof maybeIterable !== 'object') {
          return null;
        }
        var maybeIterator =
          (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
          maybeIterable[FAUX_ITERATOR_SYMBOL];
        if (typeof maybeIterator === 'function') {
          return maybeIterator;
        }
        return null;
      }
      var ReactCurrentDispatcher = {
        current: null,
      };
      var ReactCurrentBatchConfig = {
        transition: null,
      };
      var ReactCurrentActQueue = {
        current: null,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
      };
      var ReactCurrentOwner = {
        current: null,
      };
      var ReactDebugCurrentFrame = {};
      var currentExtraStackFrame = null;
      function setExtraStackFrame(stack) {
        {
          currentExtraStackFrame = stack;
        }
      }
      {
        ReactDebugCurrentFrame.setExtraStackFrame = function (stack) {
          {
            currentExtraStackFrame = stack;
          }
        };
        ReactDebugCurrentFrame.getCurrentStack = null;
        ReactDebugCurrentFrame.getStackAddendum = function () {
          var stack = '';
          if (currentExtraStackFrame) {
            stack += currentExtraStackFrame;
          }
          var impl = ReactDebugCurrentFrame.getCurrentStack;
          if (impl) {
            stack += impl() || '';
          }
          return stack;
        };
      }
      var enableScopeAPI = false;
      var enableCacheElement = false;
      var enableTransitionTracing = false;
      var enableLegacyHidden = false;
      var enableDebugTracing = false;
      var ReactSharedInternals = {
        ReactCurrentDispatcher,
        ReactCurrentBatchConfig,
        ReactCurrentOwner,
      };
      {
        ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
        ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
      }
      function warn(format) {
        {
          {
            for (
              var _len = arguments.length,
                args = new Array(_len > 1 ? _len - 1 : 0),
                _key = 1;
              _key < _len;
              _key++
            ) {
              args[_key - 1] = arguments[_key];
            }
            printWarning('warn', format, args);
          }
        }
      }
      function error(format) {
        {
          {
            for (
              var _len2 = arguments.length,
                args = new Array(_len2 > 1 ? _len2 - 1 : 0),
                _key2 = 1;
              _key2 < _len2;
              _key2++
            ) {
              args[_key2 - 1] = arguments[_key2];
            }
            printWarning('error', format, args);
          }
        }
      }
      function printWarning(level, format, args) {
        {
          var ReactDebugCurrentFrame2 =
            ReactSharedInternals.ReactDebugCurrentFrame;
          var stack = ReactDebugCurrentFrame2.getStackAddendum();
          if (stack !== '') {
            format += '%s';
            args = args.concat([stack]);
          }
          var argsWithFormat = args.map(function (item) {
            return String(item);
          });
          argsWithFormat.unshift('Warning: ' + format);
          Function.prototype.apply.call(
            console[level],
            console,
            argsWithFormat
          );
        }
      }
      var didWarnStateUpdateForUnmountedComponent = {};
      function warnNoop(publicInstance, callerName) {
        {
          var _constructor = publicInstance.constructor;
          var componentName =
            (_constructor && (_constructor.displayName || _constructor.name)) ||
            'ReactClass';
          var warningKey = componentName + '.' + callerName;
          if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
            return;
          }
          error(
            "Can't call %s on a component that is not yet mounted. " +
              'This is a no-op, but it might indicate a bug in your application. ' +
              'Instead, assign to `this.state` directly or define a `state = {};` ' +
              'class property with the desired state in the %s component.',
            callerName,
            componentName
          );
          didWarnStateUpdateForUnmountedComponent[warningKey] = true;
        }
      }
      var ReactNoopUpdateQueue = {
        isMounted: function (publicInstance) {
          return false;
        },
        enqueueForceUpdate: function (publicInstance, callback, callerName) {
          warnNoop(publicInstance, 'forceUpdate');
        },
        enqueueReplaceState: function (
          publicInstance,
          completeState,
          callback,
          callerName
        ) {
          warnNoop(publicInstance, 'replaceState');
        },
        enqueueSetState: function (
          publicInstance,
          partialState,
          callback,
          callerName
        ) {
          warnNoop(publicInstance, 'setState');
        },
      };
      var assign = Object.assign;
      var emptyObject = {};
      {
        Object.freeze(emptyObject);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function (partialState, callback) {
        if (
          typeof partialState !== 'object' &&
          typeof partialState !== 'function' &&
          partialState != null
        ) {
          throw new Error(
            'setState(...): takes an object of state variables to update or a ' +
              'function which returns an object of state variables.'
          );
        }
        this.updater.enqueueSetState(this, partialState, callback, 'setState');
      };
      Component.prototype.forceUpdate = function (callback) {
        this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
      };
      {
        var deprecatedAPIs = {
          isMounted: [
            'isMounted',
            'Instead, make sure to clean up subscriptions and pending requests in ' +
              'componentWillUnmount to prevent memory leaks.',
          ],
          replaceState: [
            'replaceState',
            'Refactor your code to use setState instead (see ' +
              'https://github.com/facebook/react/issues/3236).',
          ],
        };
        var defineDeprecationWarning = function (methodName, info) {
          Object.defineProperty(Component.prototype, methodName, {
            get: function () {
              warn(
                '%s(...) is deprecated in plain JavaScript React classes. %s',
                info[0],
                info[1]
              );
              return;
            },
          });
        };
        for (var fnName in deprecatedAPIs) {
          if (deprecatedAPIs.hasOwnProperty(fnName)) {
            defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
          }
        }
      }
      function ComponentDummy() {}
      ComponentDummy.prototype = Component.prototype;
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      var pureComponentPrototype = (PureComponent.prototype =
        new ComponentDummy());
      pureComponentPrototype.constructor = PureComponent;
      assign(pureComponentPrototype, Component.prototype);
      pureComponentPrototype.isPureReactComponent = true;
      function createRef() {
        var refObject = {
          current: null,
        };
        {
          Object.seal(refObject);
        }
        return refObject;
      }
      var isArrayImpl = Array.isArray;
      function isArray(a) {
        return isArrayImpl(a);
      }
      function typeName(value) {
        {
          var hasToStringTag =
            typeof Symbol === 'function' && Symbol.toStringTag;
          var type =
            (hasToStringTag && value[Symbol.toStringTag]) ||
            value.constructor.name ||
            'Object';
          return type;
        }
      }
      function willCoercionThrow(value) {
        {
          try {
            testStringCoercion(value);
            return false;
          } catch (e) {
            return true;
          }
        }
      }
      function testStringCoercion(value) {
        return '' + value;
      }
      function checkKeyStringCoercion(value) {
        {
          if (willCoercionThrow(value)) {
            error(
              'The provided key is an unsupported type %s.' +
                ' This value must be coerced to a string before before using it here.',
              typeName(value)
            );
            return testStringCoercion(value);
          }
        }
      }
      function getWrappedName(outerType, innerType, wrapperName) {
        var displayName = outerType.displayName;
        if (displayName) {
          return displayName;
        }
        var functionName = innerType.displayName || innerType.name || '';
        return functionName !== ''
          ? wrapperName + '(' + functionName + ')'
          : wrapperName;
      }
      function getContextName(type) {
        return type.displayName || 'Context';
      }
      function getComponentNameFromType(type) {
        if (type == null) {
          return null;
        }
        {
          if (typeof type.tag === 'number') {
            error(
              'Received an unexpected object in getComponentNameFromType(). ' +
                'This is likely a bug in React. Please file an issue.'
            );
          }
        }
        if (typeof type === 'function') {
          return type.displayName || type.name || null;
        }
        if (typeof type === 'string') {
          return type;
        }
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return 'Fragment';
          case REACT_PORTAL_TYPE:
            return 'Portal';
          case REACT_PROFILER_TYPE:
            return 'Profiler';
          case REACT_STRICT_MODE_TYPE:
            return 'StrictMode';
          case REACT_SUSPENSE_TYPE:
            return 'Suspense';
          case REACT_SUSPENSE_LIST_TYPE:
            return 'SuspenseList';
        }
        if (typeof type === 'object') {
          switch (type.$$typeof) {
            case REACT_CONTEXT_TYPE:
              var context = type;
              return getContextName(context) + '.Consumer';
            case REACT_PROVIDER_TYPE:
              var provider = type;
              return getContextName(provider._context) + '.Provider';
            case REACT_FORWARD_REF_TYPE:
              return getWrappedName(type, type.render, 'ForwardRef');
            case REACT_MEMO_TYPE:
              var outerName = type.displayName || null;
              if (outerName !== null) {
                return outerName;
              }
              return getComponentNameFromType(type.type) || 'Memo';
            case REACT_LAZY_TYPE: {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return getComponentNameFromType(init(payload));
              } catch (x) {
                return null;
              }
            }
          }
        }
        return null;
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var RESERVED_PROPS = {
        key: true,
        ref: true,
        __self: true,
        __source: true,
      };
      var specialPropKeyWarningShown,
        specialPropRefWarningShown,
        didWarnAboutStringRefs;
      {
        didWarnAboutStringRefs = {};
      }
      function hasValidRef(config) {
        {
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
        {
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
        var warnAboutAccessingKey = function () {
          {
            if (!specialPropKeyWarningShown) {
              specialPropKeyWarningShown = true;
              error(
                '%s: `key` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://reactjs.org/link/special-props)',
                displayName
              );
            }
          }
        };
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, 'key', {
          get: warnAboutAccessingKey,
          configurable: true,
        });
      }
      function defineRefPropWarningGetter(props, displayName) {
        var warnAboutAccessingRef = function () {
          {
            if (!specialPropRefWarningShown) {
              specialPropRefWarningShown = true;
              error(
                '%s: `ref` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://reactjs.org/link/special-props)',
                displayName
              );
            }
          }
        };
        warnAboutAccessingRef.isReactWarning = true;
        Object.defineProperty(props, 'ref', {
          get: warnAboutAccessingRef,
          configurable: true,
        });
      }
      function warnIfStringRefCannotBeAutoConverted(config) {
        {
          if (
            typeof config.ref === 'string' &&
            ReactCurrentOwner.current &&
            config.__self &&
            ReactCurrentOwner.current.stateNode !== config.__self
          ) {
            var componentName = getComponentNameFromType(
              ReactCurrentOwner.current.type
            );
            if (!didWarnAboutStringRefs[componentName]) {
              error(
                'Component "%s" contains the string ref "%s". ' +
                  'Support for string refs will be removed in a future major release. ' +
                  'This case cannot be automatically converted to an arrow function. ' +
                  'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
                  'Learn more about using refs safely here: ' +
                  'https://reactjs.org/link/strict-mode-string-ref',
                componentName,
                config.ref
              );
              didWarnAboutStringRefs[componentName] = true;
            }
          }
        }
      }
      var ReactElement = function (type, key, ref, self, source, owner, props) {
        var element = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref,
          props,
          _owner: owner,
        };
        {
          element._store = {};
          Object.defineProperty(element._store, 'validated', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: false,
          });
          Object.defineProperty(element, '_self', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: self,
          });
          Object.defineProperty(element, '_source', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: source,
          });
          if (Object.freeze) {
            Object.freeze(element.props);
            Object.freeze(element);
          }
        }
        return element;
      };
      function createElement(type, config, children) {
        var propName;
        var props = {};
        var key = null;
        var ref = null;
        var self = null;
        var source = null;
        if (config != null) {
          if (hasValidRef(config)) {
            ref = config.ref;
            {
              warnIfStringRefCannotBeAutoConverted(config);
            }
          }
          if (hasValidKey(config)) {
            {
              checkKeyStringCoercion(config.key);
            }
            key = '' + config.key;
          }
          self = config.__self === undefined ? null : config.__self;
          source = config.__source === undefined ? null : config.__source;
          for (propName in config) {
            if (
              hasOwnProperty.call(config, propName) &&
              !RESERVED_PROPS.hasOwnProperty(propName)
            ) {
              props[propName] = config[propName];
            }
          }
        }
        var childrenLength = arguments.length - 2;
        if (childrenLength === 1) {
          props.children = children;
        } else if (childrenLength > 1) {
          var childArray = Array(childrenLength);
          for (var i = 0; i < childrenLength; i++) {
            childArray[i] = arguments[i + 2];
          }
          {
            if (Object.freeze) {
              Object.freeze(childArray);
            }
          }
          props.children = childArray;
        }
        if (type && type.defaultProps) {
          var defaultProps = type.defaultProps;
          for (propName in defaultProps) {
            if (props[propName] === undefined) {
              props[propName] = defaultProps[propName];
            }
          }
        }
        {
          if (key || ref) {
            var displayName =
              typeof type === 'function'
                ? type.displayName || type.name || 'Unknown'
                : type;
            if (key) {
              defineKeyPropWarningGetter(props, displayName);
            }
            if (ref) {
              defineRefPropWarningGetter(props, displayName);
            }
          }
        }
        return ReactElement(
          type,
          key,
          ref,
          self,
          source,
          ReactCurrentOwner.current,
          props
        );
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        var newElement = ReactElement(
          oldElement.type,
          newKey,
          oldElement.ref,
          oldElement._self,
          oldElement._source,
          oldElement._owner,
          oldElement.props
        );
        return newElement;
      }
      function cloneElement(element, config, children) {
        if (element === null || element === undefined) {
          throw new Error(
            'React.cloneElement(...): The argument must be a React element, but you passed ' +
              element +
              '.'
          );
        }
        var propName;
        var props = assign({}, element.props);
        var key = element.key;
        var ref = element.ref;
        var self = element._self;
        var source = element._source;
        var owner = element._owner;
        if (config != null) {
          if (hasValidRef(config)) {
            ref = config.ref;
            owner = ReactCurrentOwner.current;
          }
          if (hasValidKey(config)) {
            {
              checkKeyStringCoercion(config.key);
            }
            key = '' + config.key;
          }
          var defaultProps;
          if (element.type && element.type.defaultProps) {
            defaultProps = element.type.defaultProps;
          }
          for (propName in config) {
            if (
              hasOwnProperty.call(config, propName) &&
              !RESERVED_PROPS.hasOwnProperty(propName)
            ) {
              if (
                config[propName] === undefined &&
                defaultProps !== undefined
              ) {
                props[propName] = defaultProps[propName];
              } else {
                props[propName] = config[propName];
              }
            }
          }
        }
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
      }
      function isValidElement(object) {
        return (
          typeof object === 'object' &&
          object !== null &&
          object.$$typeof === REACT_ELEMENT_TYPE
        );
      }
      var SEPARATOR = '.';
      var SUBSEPARATOR = ':';
      function escape(key) {
        var escapeRegex = /[=:]/g;
        var escaperLookup = {
          '=': '=0',
          ':': '=2',
        };
        var escapedString = key.replace(escapeRegex, function (match) {
          return escaperLookup[match];
        });
        return '$' + escapedString;
      }
      var didWarnAboutMaps = false;
      var userProvidedKeyEscapeRegex = /\/+/g;
      function escapeUserProvidedKey(text) {
        return text.replace(userProvidedKeyEscapeRegex, '$&/');
      }
      function getElementKey(element, index) {
        if (
          typeof element === 'object' &&
          element !== null &&
          element.key != null
        ) {
          {
            checkKeyStringCoercion(element.key);
          }
          return escape('' + element.key);
        }
        return index.toString(36);
      }
      function mapIntoArray(
        children,
        array,
        escapedPrefix,
        nameSoFar,
        callback
      ) {
        var type = typeof children;
        if (type === 'undefined' || type === 'boolean') {
          children = null;
        }
        var invokeCallback = false;
        if (children === null) {
          invokeCallback = true;
        } else {
          switch (type) {
            case 'string':
            case 'number':
              invokeCallback = true;
              break;
            case 'object':
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
              }
          }
        }
        if (invokeCallback) {
          var _child = children;
          var mappedChild = callback(_child);
          var childKey =
            nameSoFar === '' ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
          if (isArray(mappedChild)) {
            var escapedChildKey = '';
            if (childKey != null) {
              escapedChildKey = escapeUserProvidedKey(childKey) + '/';
            }
            mapIntoArray(mappedChild, array, escapedChildKey, '', function (c) {
              return c;
            });
          } else if (mappedChild != null) {
            if (isValidElement(mappedChild)) {
              {
                if (
                  mappedChild.key &&
                  (!_child || _child.key !== mappedChild.key)
                ) {
                  checkKeyStringCoercion(mappedChild.key);
                }
              }
              mappedChild = cloneAndReplaceKey(
                mappedChild,
                escapedPrefix +
                  (mappedChild.key &&
                  (!_child || _child.key !== mappedChild.key)
                    ? escapeUserProvidedKey('' + mappedChild.key) + '/'
                    : '') +
                  childKey
              );
            }
            array.push(mappedChild);
          }
          return 1;
        }
        var child;
        var nextName;
        var subtreeCount = 0;
        var nextNamePrefix =
          nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;
        if (isArray(children)) {
          for (var i = 0; i < children.length; i++) {
            child = children[i];
            nextName = nextNamePrefix + getElementKey(child, i);
            subtreeCount += mapIntoArray(
              child,
              array,
              escapedPrefix,
              nextName,
              callback
            );
          }
        } else {
          var iteratorFn = getIteratorFn(children);
          if (typeof iteratorFn === 'function') {
            var iterableChildren = children;
            {
              if (iteratorFn === iterableChildren.entries) {
                if (!didWarnAboutMaps) {
                  warn(
                    'Using Maps as children is not supported. ' +
                      'Use an array of keyed ReactElements instead.'
                  );
                }
                didWarnAboutMaps = true;
              }
            }
            var iterator = iteratorFn.call(iterableChildren);
            var step;
            var ii = 0;
            while (!(step = iterator.next()).done) {
              child = step.value;
              nextName = nextNamePrefix + getElementKey(child, ii++);
              subtreeCount += mapIntoArray(
                child,
                array,
                escapedPrefix,
                nextName,
                callback
              );
            }
          } else if (type === 'object') {
            var childrenString = String(children);
            throw new Error(
              'Objects are not valid as a React child (found: ' +
                (childrenString === '[object Object]'
                  ? 'object with keys {' +
                    Object.keys(children).join(', ') +
                    '}'
                  : childrenString) +
                '). ' +
                'If you meant to render a collection of children, use an array ' +
                'instead.'
            );
          }
        }
        return subtreeCount;
      }
      function mapChildren(children, func, context) {
        if (children == null) {
          return children;
        }
        var result = [];
        var count = 0;
        mapIntoArray(children, result, '', '', function (child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function countChildren(children) {
        var n = 0;
        mapChildren(children, function () {
          n++;
        });
        return n;
      }
      function forEachChildren(children, forEachFunc, forEachContext) {
        mapChildren(
          children,
          function () {
            forEachFunc.apply(this, arguments);
          },
          forEachContext
        );
      }
      function toArray(children) {
        return (
          mapChildren(children, function (child) {
            return child;
          }) || []
        );
      }
      function onlyChild(children) {
        if (!isValidElement(children)) {
          throw new Error(
            'React.Children.only expected to receive a single React element child.'
          );
        }
        return children;
      }
      function createContext(defaultValue) {
        var context = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null,
          _defaultValue: null,
          _globalName: null,
        };
        context.Provider = {
          $$typeof: REACT_PROVIDER_TYPE,
          _context: context,
        };
        var hasWarnedAboutUsingNestedContextConsumers = false;
        var hasWarnedAboutUsingConsumerProvider = false;
        var hasWarnedAboutDisplayNameOnConsumer = false;
        {
          var Consumer = {
            $$typeof: REACT_CONTEXT_TYPE,
            _context: context,
          };
          Object.defineProperties(Consumer, {
            Provider: {
              get: function () {
                if (!hasWarnedAboutUsingConsumerProvider) {
                  hasWarnedAboutUsingConsumerProvider = true;
                  error(
                    'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' +
                      'a future major release. Did you mean to render <Context.Provider> instead?'
                  );
                }
                return context.Provider;
              },
              set: function (_Provider) {
                context.Provider = _Provider;
              },
            },
            _currentValue: {
              get: function () {
                return context._currentValue;
              },
              set: function (_currentValue) {
                context._currentValue = _currentValue;
              },
            },
            _currentValue2: {
              get: function () {
                return context._currentValue2;
              },
              set: function (_currentValue2) {
                context._currentValue2 = _currentValue2;
              },
            },
            _threadCount: {
              get: function () {
                return context._threadCount;
              },
              set: function (_threadCount) {
                context._threadCount = _threadCount;
              },
            },
            Consumer: {
              get: function () {
                if (!hasWarnedAboutUsingNestedContextConsumers) {
                  hasWarnedAboutUsingNestedContextConsumers = true;
                  error(
                    'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
                      'a future major release. Did you mean to render <Context.Consumer> instead?'
                  );
                }
                return context.Consumer;
              },
            },
            displayName: {
              get: function () {
                return context.displayName;
              },
              set: function (displayName) {
                if (!hasWarnedAboutDisplayNameOnConsumer) {
                  warn(
                    'Setting `displayName` on Context.Consumer has no effect. ' +
                      "You should set it directly on the context with Context.displayName = '%s'.",
                    displayName
                  );
                  hasWarnedAboutDisplayNameOnConsumer = true;
                }
              },
            },
          });
          context.Consumer = Consumer;
        }
        {
          context._currentRenderer = null;
          context._currentRenderer2 = null;
        }
        return context;
      }
      var Uninitialized = -1;
      var Pending = 0;
      var Resolved = 1;
      var Rejected = 2;
      function lazyInitializer(payload) {
        if (payload._status === Uninitialized) {
          var ctor = payload._result;
          var thenable = ctor();
          thenable.then(
            function (moduleObject2) {
              if (
                payload._status === Pending ||
                payload._status === Uninitialized
              ) {
                var resolved = payload;
                resolved._status = Resolved;
                resolved._result = moduleObject2;
              }
            },
            function (error2) {
              if (
                payload._status === Pending ||
                payload._status === Uninitialized
              ) {
                var rejected = payload;
                rejected._status = Rejected;
                rejected._result = error2;
              }
            }
          );
          if (payload._status === Uninitialized) {
            var pending = payload;
            pending._status = Pending;
            pending._result = thenable;
          }
        }
        if (payload._status === Resolved) {
          var moduleObject = payload._result;
          {
            if (moduleObject === undefined) {
              error(
                'lazy: Expected the result of a dynamic imp' +
                  'ort() call. ' +
                  `Instead received: %s

Your code should look like: 
  ` +
                  'const MyComponent = lazy(() => imp' +
                  `ort('./MyComponent'))

` +
                  'Did you accidentally put curly braces around the import?',
                moduleObject
              );
            }
          }
          {
            if (!('default' in moduleObject)) {
              error(
                'lazy: Expected the result of a dynamic imp' +
                  'ort() call. ' +
                  `Instead received: %s

Your code should look like: 
  ` +
                  'const MyComponent = lazy(() => imp' +
                  "ort('./MyComponent'))",
                moduleObject
              );
            }
          }
          return moduleObject.default;
        } else {
          throw payload._result;
        }
      }
      function lazy(ctor) {
        var payload = {
          _status: Uninitialized,
          _result: ctor,
        };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: payload,
          _init: lazyInitializer,
        };
        {
          var defaultProps;
          var propTypes;
          Object.defineProperties(lazyType, {
            defaultProps: {
              configurable: true,
              get: function () {
                return defaultProps;
              },
              set: function (newDefaultProps) {
                error(
                  'React.lazy(...): It is not supported to assign `defaultProps` to ' +
                    'a lazy component import. Either specify them where the component ' +
                    'is defined, or create a wrapping component around it.'
                );
                defaultProps = newDefaultProps;
                Object.defineProperty(lazyType, 'defaultProps', {
                  enumerable: true,
                });
              },
            },
            propTypes: {
              configurable: true,
              get: function () {
                return propTypes;
              },
              set: function (newPropTypes) {
                error(
                  'React.lazy(...): It is not supported to assign `propTypes` to ' +
                    'a lazy component import. Either specify them where the component ' +
                    'is defined, or create a wrapping component around it.'
                );
                propTypes = newPropTypes;
                Object.defineProperty(lazyType, 'propTypes', {
                  enumerable: true,
                });
              },
            },
          });
        }
        return lazyType;
      }
      function forwardRef(render) {
        {
          if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
            error(
              'forwardRef requires a render function but received a `memo` ' +
                'component. Instead of forwardRef(memo(...)), use ' +
                'memo(forwardRef(...)).'
            );
          } else if (typeof render !== 'function') {
            error(
              'forwardRef requires a render function but was given %s.',
              render === null ? 'null' : typeof render
            );
          } else {
            if (render.length !== 0 && render.length !== 2) {
              error(
                'forwardRef render functions accept exactly two parameters: props and ref. %s',
                render.length === 1
                  ? 'Did you forget to use the ref parameter?'
                  : 'Any additional parameter will be undefined.'
              );
            }
          }
          if (render != null) {
            if (render.defaultProps != null || render.propTypes != null) {
              error(
                'forwardRef render functions do not support propTypes or defaultProps. ' +
                  'Did you accidentally pass a React component?'
              );
            }
          }
        }
        var elementType = {
          $$typeof: REACT_FORWARD_REF_TYPE,
          render,
        };
        {
          var ownName;
          Object.defineProperty(elementType, 'displayName', {
            enumerable: false,
            configurable: true,
            get: function () {
              return ownName;
            },
            set: function (name) {
              ownName = name;
              if (!render.name && !render.displayName) {
                render.displayName = name;
              }
            },
          });
        }
        return elementType;
      }
      var REACT_MODULE_REFERENCE;
      {
        REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
      }
      function isValidElementType(type) {
        if (typeof type === 'string' || typeof type === 'function') {
          return true;
        }
        if (
          type === REACT_FRAGMENT_TYPE ||
          type === REACT_PROFILER_TYPE ||
          enableDebugTracing ||
          type === REACT_STRICT_MODE_TYPE ||
          type === REACT_SUSPENSE_TYPE ||
          type === REACT_SUSPENSE_LIST_TYPE ||
          enableLegacyHidden ||
          type === REACT_OFFSCREEN_TYPE ||
          enableScopeAPI ||
          enableCacheElement ||
          enableTransitionTracing
        ) {
          return true;
        }
        if (typeof type === 'object' && type !== null) {
          if (
            type.$$typeof === REACT_LAZY_TYPE ||
            type.$$typeof === REACT_MEMO_TYPE ||
            type.$$typeof === REACT_PROVIDER_TYPE ||
            type.$$typeof === REACT_CONTEXT_TYPE ||
            type.$$typeof === REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_MODULE_REFERENCE ||
            type.getModuleId !== undefined
          ) {
            return true;
          }
        }
        return false;
      }
      function memo(type, compare) {
        {
          if (!isValidElementType(type)) {
            error(
              'memo: The first argument must be a component. Instead ' +
                'received: %s',
              type === null ? 'null' : typeof type
            );
          }
        }
        var elementType = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: compare === undefined ? null : compare,
        };
        {
          var ownName;
          Object.defineProperty(elementType, 'displayName', {
            enumerable: false,
            configurable: true,
            get: function () {
              return ownName;
            },
            set: function (name) {
              ownName = name;
              if (!type.name && !type.displayName) {
                type.displayName = name;
              }
            },
          });
        }
        return elementType;
      }
      function resolveDispatcher() {
        var dispatcher = ReactCurrentDispatcher.current;
        {
          if (dispatcher === null) {
            error(
              'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
                ` one of the following reasons:
` +
                `1. You might have mismatching versions of React and the renderer (such as React DOM)
` +
                `2. You might be breaking the Rules of Hooks
` +
                `3. You might have more than one copy of React in the same app
` +
                'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.'
            );
          }
        }
        return dispatcher;
      }
      function useContext(Context) {
        var dispatcher = resolveDispatcher();
        {
          if (Context._context !== undefined) {
            var realContext = Context._context;
            if (realContext.Consumer === Context) {
              error(
                'Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' +
                  'removed in a future major release. Did you mean to call useContext(Context) instead?'
              );
            } else if (realContext.Provider === Context) {
              error(
                'Calling useContext(Context.Provider) is not supported. ' +
                  'Did you mean to call useContext(Context) instead?'
              );
            }
          }
        }
        return dispatcher.useContext(Context);
      }
      function useState(initialState) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useState(initialState);
      }
      function useReducer(reducer, initialArg, init) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useReducer(reducer, initialArg, init);
      }
      function useRef(initialValue) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useRef(initialValue);
      }
      function useEffect(create, deps) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useEffect(create, deps);
      }
      function useInsertionEffect(create, deps) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useInsertionEffect(create, deps);
      }
      function useLayoutEffect(create, deps) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useLayoutEffect(create, deps);
      }
      function useCallback(callback, deps) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useCallback(callback, deps);
      }
      function useMemo(create, deps) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useMemo(create, deps);
      }
      function useImperativeHandle(ref, create, deps) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useImperativeHandle(ref, create, deps);
      }
      function useDebugValue(value, formatterFn) {
        {
          var dispatcher = resolveDispatcher();
          return dispatcher.useDebugValue(value, formatterFn);
        }
      }
      function useTransition() {
        var dispatcher = resolveDispatcher();
        return dispatcher.useTransition();
      }
      function useDeferredValue(value) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useDeferredValue(value);
      }
      function useId() {
        var dispatcher = resolveDispatcher();
        return dispatcher.useId();
      }
      function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      }
      var disabledDepth = 0;
      var prevLog;
      var prevInfo;
      var prevWarn;
      var prevError;
      var prevGroup;
      var prevGroupCollapsed;
      var prevGroupEnd;
      function disabledLog() {}
      disabledLog.__reactDisabledLog = true;
      function disableLogs() {
        {
          if (disabledDepth === 0) {
            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;
            var props = {
              configurable: true,
              enumerable: true,
              value: disabledLog,
              writable: true,
            };
            Object.defineProperties(console, {
              info: props,
              log: props,
              warn: props,
              error: props,
              group: props,
              groupCollapsed: props,
              groupEnd: props,
            });
          }
          disabledDepth++;
        }
      }
      function reenableLogs() {
        {
          disabledDepth--;
          if (disabledDepth === 0) {
            var props = {
              configurable: true,
              enumerable: true,
              writable: true,
            };
            Object.defineProperties(console, {
              log: assign({}, props, {
                value: prevLog,
              }),
              info: assign({}, props, {
                value: prevInfo,
              }),
              warn: assign({}, props, {
                value: prevWarn,
              }),
              error: assign({}, props, {
                value: prevError,
              }),
              group: assign({}, props, {
                value: prevGroup,
              }),
              groupCollapsed: assign({}, props, {
                value: prevGroupCollapsed,
              }),
              groupEnd: assign({}, props, {
                value: prevGroupEnd,
              }),
            });
          }
          if (disabledDepth < 0) {
            error(
              'disabledDepth fell below zero. ' +
                'This is a bug in React. Please file an issue.'
            );
          }
        }
      }
      var ReactCurrentDispatcher$1 =
        ReactSharedInternals.ReactCurrentDispatcher;
      var prefix;
      function describeBuiltInComponentFrame(name, source, ownerFn) {
        {
          if (prefix === undefined) {
            try {
              throw Error();
            } catch (x) {
              var match = x.stack.trim().match(/\n( *(at )?)/);
              prefix = (match && match[1]) || '';
            }
          }
          return (
            `
` +
            prefix +
            name
          );
        }
      }
      var reentry = false;
      var componentFrameCache;
      {
        var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
        componentFrameCache = new PossiblyWeakMap();
      }
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) {
          return '';
        }
        {
          var frame = componentFrameCache.get(fn);
          if (frame !== undefined) {
            return frame;
          }
        }
        var control;
        reentry = true;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = undefined;
        var previousDispatcher;
        {
          previousDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = null;
          disableLogs();
        }
        try {
          if (construct) {
            var Fake = function () {
              throw Error();
            };
            Object.defineProperty(Fake.prototype, 'props', {
              set: function () {
                throw Error();
              },
            });
            if (typeof Reflect === 'object' && Reflect.construct) {
              try {
                Reflect.construct(Fake, []);
              } catch (x) {
                control = x;
              }
              Reflect.construct(fn, [], Fake);
            } else {
              try {
                Fake.call();
              } catch (x) {
                control = x;
              }
              fn.call(Fake.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (x) {
              control = x;
            }
            fn();
          }
        } catch (sample) {
          if (sample && control && typeof sample.stack === 'string') {
            var sampleLines = sample.stack.split(`
`);
            var controlLines = control.stack.split(`
`);
            var s = sampleLines.length - 1;
            var c = controlLines.length - 1;
            while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
              c--;
            }
            for (; s >= 1 && c >= 0; s--, c--) {
              if (sampleLines[s] !== controlLines[c]) {
                if (s !== 1 || c !== 1) {
                  do {
                    s--;
                    c--;
                    if (c < 0 || sampleLines[s] !== controlLines[c]) {
                      var _frame =
                        `
` + sampleLines[s].replace(' at new ', ' at ');
                      if (fn.displayName && _frame.includes('<anonymous>')) {
                        _frame = _frame.replace('<anonymous>', fn.displayName);
                      }
                      {
                        if (typeof fn === 'function') {
                          componentFrameCache.set(fn, _frame);
                        }
                      }
                      return _frame;
                    }
                  } while (s >= 1 && c >= 0);
                }
                break;
              }
            }
          }
        } finally {
          reentry = false;
          {
            ReactCurrentDispatcher$1.current = previousDispatcher;
            reenableLogs();
          }
          Error.prepareStackTrace = previousPrepareStackTrace;
        }
        var name = fn ? fn.displayName || fn.name : '';
        var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';
        {
          if (typeof fn === 'function') {
            componentFrameCache.set(fn, syntheticFrame);
          }
        }
        return syntheticFrame;
      }
      function describeFunctionComponentFrame(fn, source, ownerFn) {
        {
          return describeNativeComponentFrame(fn, false);
        }
      }
      function shouldConstruct(Component2) {
        var prototype = Component2.prototype;
        return !!(prototype && prototype.isReactComponent);
      }
      function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
        if (type == null) {
          return '';
        }
        if (typeof type === 'function') {
          {
            return describeNativeComponentFrame(type, shouldConstruct(type));
          }
        }
        if (typeof type === 'string') {
          return describeBuiltInComponentFrame(type);
        }
        switch (type) {
          case REACT_SUSPENSE_TYPE:
            return describeBuiltInComponentFrame('Suspense');
          case REACT_SUSPENSE_LIST_TYPE:
            return describeBuiltInComponentFrame('SuspenseList');
        }
        if (typeof type === 'object') {
          switch (type.$$typeof) {
            case REACT_FORWARD_REF_TYPE:
              return describeFunctionComponentFrame(type.render);
            case REACT_MEMO_TYPE:
              return describeUnknownElementTypeFrameInDEV(
                type.type,
                source,
                ownerFn
              );
            case REACT_LAZY_TYPE: {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return describeUnknownElementTypeFrameInDEV(
                  init(payload),
                  source,
                  ownerFn
                );
              } catch (x) {}
            }
          }
        }
        return '';
      }
      var loggedTypeFailures = {};
      var ReactDebugCurrentFrame$1 =
        ReactSharedInternals.ReactDebugCurrentFrame;
      function setCurrentlyValidatingElement(element) {
        {
          if (element) {
            var owner = element._owner;
            var stack = describeUnknownElementTypeFrameInDEV(
              element.type,
              element._source,
              owner ? owner.type : null
            );
            ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
          } else {
            ReactDebugCurrentFrame$1.setExtraStackFrame(null);
          }
        }
      }
      function checkPropTypes(
        typeSpecs,
        values,
        location,
        componentName,
        element
      ) {
        {
          var has = Function.call.bind(hasOwnProperty);
          for (var typeSpecName in typeSpecs) {
            if (has(typeSpecs, typeSpecName)) {
              var error$1 = undefined;
              try {
                if (typeof typeSpecs[typeSpecName] !== 'function') {
                  var err = Error(
                    (componentName || 'React class') +
                      ': ' +
                      location +
                      ' type `' +
                      typeSpecName +
                      '` is invalid; ' +
                      'it must be a function, usually from the `prop-types` package, but received `' +
                      typeof typeSpecs[typeSpecName] +
                      '`.' +
                      'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
                  );
                  err.name = 'Invariant Violation';
                  throw err;
                }
                error$1 = typeSpecs[typeSpecName](
                  values,
                  typeSpecName,
                  componentName,
                  location,
                  null,
                  'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED'
                );
              } catch (ex) {
                error$1 = ex;
              }
              if (error$1 && !(error$1 instanceof Error)) {
                setCurrentlyValidatingElement(element);
                error(
                  '%s: type specification of %s' +
                    ' `%s` is invalid; the type checker ' +
                    'function must return `null` or an `Error` but returned a %s. ' +
                    'You may have forgotten to pass an argument to the type checker ' +
                    'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
                    'shape all require an argument).',
                  componentName || 'React class',
                  location,
                  typeSpecName,
                  typeof error$1
                );
                setCurrentlyValidatingElement(null);
              }
              if (
                error$1 instanceof Error &&
                !(error$1.message in loggedTypeFailures)
              ) {
                loggedTypeFailures[error$1.message] = true;
                setCurrentlyValidatingElement(element);
                error('Failed %s type: %s', location, error$1.message);
                setCurrentlyValidatingElement(null);
              }
            }
          }
        }
      }
      function setCurrentlyValidatingElement$1(element) {
        {
          if (element) {
            var owner = element._owner;
            var stack = describeUnknownElementTypeFrameInDEV(
              element.type,
              element._source,
              owner ? owner.type : null
            );
            setExtraStackFrame(stack);
          } else {
            setExtraStackFrame(null);
          }
        }
      }
      var propTypesMisspellWarningShown;
      {
        propTypesMisspellWarningShown = false;
      }
      function getDeclarationErrorAddendum() {
        if (ReactCurrentOwner.current) {
          var name = getComponentNameFromType(ReactCurrentOwner.current.type);
          if (name) {
            return (
              `

Check the render method of \`` +
              name +
              '`.'
            );
          }
        }
        return '';
      }
      function getSourceInfoErrorAddendum(source) {
        if (source !== undefined) {
          var fileName = source.fileName.replace(/^.*[\\\/]/, '');
          var lineNumber = source.lineNumber;
          return (
            `

Check your code at ` +
            fileName +
            ':' +
            lineNumber +
            '.'
          );
        }
        return '';
      }
      function getSourceInfoErrorAddendumForProps(elementProps) {
        if (elementProps !== null && elementProps !== undefined) {
          return getSourceInfoErrorAddendum(elementProps.__source);
        }
        return '';
      }
      var ownerHasKeyUseWarning = {};
      function getCurrentComponentErrorInfo(parentType) {
        var info = getDeclarationErrorAddendum();
        if (!info) {
          var parentName =
            typeof parentType === 'string'
              ? parentType
              : parentType.displayName || parentType.name;
          if (parentName) {
            info =
              `

Check the top-level render call using <` +
              parentName +
              '>.';
          }
        }
        return info;
      }
      function validateExplicitKey(element, parentType) {
        if (
          !element._store ||
          element._store.validated ||
          element.key != null
        ) {
          return;
        }
        element._store.validated = true;
        var currentComponentErrorInfo =
          getCurrentComponentErrorInfo(parentType);
        if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
          return;
        }
        ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
        var childOwner = '';
        if (
          element &&
          element._owner &&
          element._owner !== ReactCurrentOwner.current
        ) {
          childOwner =
            ' It was passed a child from ' +
            getComponentNameFromType(element._owner.type) +
            '.';
        }
        {
          setCurrentlyValidatingElement$1(element);
          error(
            'Each child in a list should have a unique "key" prop.' +
              '%s%s See https://reactjs.org/link/warning-keys for more information.',
            currentComponentErrorInfo,
            childOwner
          );
          setCurrentlyValidatingElement$1(null);
        }
      }
      function validateChildKeys(node, parentType) {
        if (typeof node !== 'object') {
          return;
        }
        if (isArray(node)) {
          for (var i = 0; i < node.length; i++) {
            var child = node[i];
            if (isValidElement(child)) {
              validateExplicitKey(child, parentType);
            }
          }
        } else if (isValidElement(node)) {
          if (node._store) {
            node._store.validated = true;
          }
        } else if (node) {
          var iteratorFn = getIteratorFn(node);
          if (typeof iteratorFn === 'function') {
            if (iteratorFn !== node.entries) {
              var iterator = iteratorFn.call(node);
              var step;
              while (!(step = iterator.next()).done) {
                if (isValidElement(step.value)) {
                  validateExplicitKey(step.value, parentType);
                }
              }
            }
          }
        }
      }
      function validatePropTypes(element) {
        {
          var type = element.type;
          if (type === null || type === undefined || typeof type === 'string') {
            return;
          }
          var propTypes;
          if (typeof type === 'function') {
            propTypes = type.propTypes;
          } else if (
            typeof type === 'object' &&
            (type.$$typeof === REACT_FORWARD_REF_TYPE ||
              type.$$typeof === REACT_MEMO_TYPE)
          ) {
            propTypes = type.propTypes;
          } else {
            return;
          }
          if (propTypes) {
            var name = getComponentNameFromType(type);
            checkPropTypes(propTypes, element.props, 'prop', name, element);
          } else if (
            type.PropTypes !== undefined &&
            !propTypesMisspellWarningShown
          ) {
            propTypesMisspellWarningShown = true;
            var _name = getComponentNameFromType(type);
            error(
              'Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?',
              _name || 'Unknown'
            );
          }
          if (
            typeof type.getDefaultProps === 'function' &&
            !type.getDefaultProps.isReactClassApproved
          ) {
            error(
              'getDefaultProps is only used on classic React.createClass ' +
                'definitions. Use a static property named `defaultProps` instead.'
            );
          }
        }
      }
      function validateFragmentProps(fragment) {
        {
          var keys = Object.keys(fragment.props);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key !== 'children' && key !== 'key') {
              setCurrentlyValidatingElement$1(fragment);
              error(
                'Invalid prop `%s` supplied to `React.Fragment`. ' +
                  'React.Fragment can only have `key` and `children` props.',
                key
              );
              setCurrentlyValidatingElement$1(null);
              break;
            }
          }
          if (fragment.ref !== null) {
            setCurrentlyValidatingElement$1(fragment);
            error('Invalid attribute `ref` supplied to `React.Fragment`.');
            setCurrentlyValidatingElement$1(null);
          }
        }
      }
      function createElementWithValidation(type, props, children) {
        var validType = isValidElementType(type);
        if (!validType) {
          var info = '';
          if (
            type === undefined ||
            (typeof type === 'object' &&
              type !== null &&
              Object.keys(type).length === 0)
          ) {
            info +=
              ' You likely forgot to export your component from the file ' +
              "it's defined in, or you might have mixed up default and named imports.";
          }
          var sourceInfo = getSourceInfoErrorAddendumForProps(props);
          if (sourceInfo) {
            info += sourceInfo;
          } else {
            info += getDeclarationErrorAddendum();
          }
          var typeString;
          if (type === null) {
            typeString = 'null';
          } else if (isArray(type)) {
            typeString = 'array';
          } else if (
            type !== undefined &&
            type.$$typeof === REACT_ELEMENT_TYPE
          ) {
            typeString =
              '<' + (getComponentNameFromType(type.type) || 'Unknown') + ' />';
            info =
              ' Did you accidentally export a JSX literal instead of a component?';
          } else {
            typeString = typeof type;
          }
          {
            error(
              'React.createElement: type is invalid -- expected a string (for ' +
                'built-in components) or a class/function (for composite ' +
                'components) but got: %s.%s',
              typeString,
              info
            );
          }
        }
        var element = createElement.apply(this, arguments);
        if (element == null) {
          return element;
        }
        if (validType) {
          for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], type);
          }
        }
        if (type === REACT_FRAGMENT_TYPE) {
          validateFragmentProps(element);
        } else {
          validatePropTypes(element);
        }
        return element;
      }
      var didWarnAboutDeprecatedCreateFactory = false;
      function createFactoryWithValidation(type) {
        var validatedFactory = createElementWithValidation.bind(null, type);
        validatedFactory.type = type;
        {
          if (!didWarnAboutDeprecatedCreateFactory) {
            didWarnAboutDeprecatedCreateFactory = true;
            warn(
              'React.createFactory() is deprecated and will be removed in ' +
                'a future major release. Consider using JSX ' +
                'or use React.createElement() directly instead.'
            );
          }
          Object.defineProperty(validatedFactory, 'type', {
            enumerable: false,
            get: function () {
              warn(
                'Factory.type is deprecated. Access the class directly ' +
                  'before passing it to createFactory.'
              );
              Object.defineProperty(this, 'type', {
                value: type,
              });
              return type;
            },
          });
        }
        return validatedFactory;
      }
      function cloneElementWithValidation(element, props, children) {
        var newElement = cloneElement.apply(this, arguments);
        for (var i = 2; i < arguments.length; i++) {
          validateChildKeys(arguments[i], newElement.type);
        }
        validatePropTypes(newElement);
        return newElement;
      }
      function startTransition(scope, options) {
        var prevTransition = ReactCurrentBatchConfig.transition;
        ReactCurrentBatchConfig.transition = {};
        var currentTransition = ReactCurrentBatchConfig.transition;
        {
          ReactCurrentBatchConfig.transition._updatedFibers = new Set();
        }
        try {
          scope();
        } finally {
          ReactCurrentBatchConfig.transition = prevTransition;
          {
            if (prevTransition === null && currentTransition._updatedFibers) {
              var updatedFibersCount = currentTransition._updatedFibers.size;
              if (updatedFibersCount > 10) {
                warn(
                  'Detected a large number of updates inside startTransition. ' +
                    'If this is due to a subscription please re-write it to use React provided hooks. ' +
                    'Otherwise concurrent mode guarantees are off the table.'
                );
              }
              currentTransition._updatedFibers.clear();
            }
          }
        }
      }
      var didWarnAboutMessageChannel = false;
      var enqueueTaskImpl = null;
      function enqueueTask(task) {
        if (enqueueTaskImpl === null) {
          try {
            var requireString = ('require' + Math.random()).slice(0, 7);
            var nodeRequire = module && module[requireString];
            enqueueTaskImpl = nodeRequire.call(module, 'timers').setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function (callback) {
              {
                if (didWarnAboutMessageChannel === false) {
                  didWarnAboutMessageChannel = true;
                  if (typeof MessageChannel === 'undefined') {
                    error(
                      'This browser does not have a MessageChannel implementation, ' +
                        'so enqueuing tasks via await act(async () => ...) will fail. ' +
                        'Please file an issue at https://github.com/facebook/react/issues ' +
                        'if you encounter this warning.'
                    );
                  }
                }
              }
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(undefined);
            };
          }
        }
        return enqueueTaskImpl(task);
      }
      var actScopeDepth = 0;
      var didWarnNoAwaitAct = false;
      function act(callback) {
        {
          var prevActScopeDepth = actScopeDepth;
          actScopeDepth++;
          if (ReactCurrentActQueue.current === null) {
            ReactCurrentActQueue.current = [];
          }
          var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
          var result;
          try {
            ReactCurrentActQueue.isBatchingLegacy = true;
            result = callback();
            if (
              !prevIsBatchingLegacy &&
              ReactCurrentActQueue.didScheduleLegacyUpdate
            ) {
              var queue = ReactCurrentActQueue.current;
              if (queue !== null) {
                ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                flushActQueue(queue);
              }
            }
          } catch (error2) {
            popActScope(prevActScopeDepth);
            throw error2;
          } finally {
            ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
          }
          if (
            result !== null &&
            typeof result === 'object' &&
            typeof result.then === 'function'
          ) {
            var thenableResult = result;
            var wasAwaited = false;
            var thenable = {
              then: function (resolve, reject) {
                wasAwaited = true;
                thenableResult.then(
                  function (returnValue2) {
                    popActScope(prevActScopeDepth);
                    if (actScopeDepth === 0) {
                      recursivelyFlushAsyncActWork(
                        returnValue2,
                        resolve,
                        reject
                      );
                    } else {
                      resolve(returnValue2);
                    }
                  },
                  function (error2) {
                    popActScope(prevActScopeDepth);
                    reject(error2);
                  }
                );
              },
            };
            {
              if (!didWarnNoAwaitAct && typeof Promise !== 'undefined') {
                Promise.resolve()
                  .then(function () {})
                  .then(function () {
                    if (!wasAwaited) {
                      didWarnNoAwaitAct = true;
                      error(
                        'You called act(async () => ...) without await. ' +
                          'This could lead to unexpected testing behaviour, ' +
                          'interleaving multiple act calls and mixing their ' +
                          'scopes. ' +
                          'You should - await act(async () => ...);'
                      );
                    }
                  });
              }
            }
            return thenable;
          } else {
            var returnValue = result;
            popActScope(prevActScopeDepth);
            if (actScopeDepth === 0) {
              var _queue = ReactCurrentActQueue.current;
              if (_queue !== null) {
                flushActQueue(_queue);
                ReactCurrentActQueue.current = null;
              }
              var _thenable = {
                then: function (resolve, reject) {
                  if (ReactCurrentActQueue.current === null) {
                    ReactCurrentActQueue.current = [];
                    recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                  } else {
                    resolve(returnValue);
                  }
                },
              };
              return _thenable;
            } else {
              var _thenable2 = {
                then: function (resolve, reject) {
                  resolve(returnValue);
                },
              };
              return _thenable2;
            }
          }
        }
      }
      function popActScope(prevActScopeDepth) {
        {
          if (prevActScopeDepth !== actScopeDepth - 1) {
            error(
              'You seem to have overlapping act() calls, this is not supported. ' +
                'Be sure to await previous act() calls before making a new one. '
            );
          }
          actScopeDepth = prevActScopeDepth;
        }
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        {
          var queue = ReactCurrentActQueue.current;
          if (queue !== null) {
            try {
              flushActQueue(queue);
              enqueueTask(function () {
                if (queue.length === 0) {
                  ReactCurrentActQueue.current = null;
                  resolve(returnValue);
                } else {
                  recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                }
              });
            } catch (error2) {
              reject(error2);
            }
          } else {
            resolve(returnValue);
          }
        }
      }
      var isFlushing = false;
      function flushActQueue(queue) {
        {
          if (!isFlushing) {
            isFlushing = true;
            var i = 0;
            try {
              for (; i < queue.length; i++) {
                var callback = queue[i];
                do {
                  callback = callback(true);
                } while (callback !== null);
              }
              queue.length = 0;
            } catch (error2) {
              queue = queue.slice(i + 1);
              throw error2;
            } finally {
              isFlushing = false;
            }
          }
        }
      }
      var createElement$1 = createElementWithValidation;
      var cloneElement$1 = cloneElementWithValidation;
      var createFactory = createFactoryWithValidation;
      var Children = {
        map: mapChildren,
        forEach: forEachChildren,
        count: countChildren,
        toArray,
        only: onlyChild,
      };
      exports.Children = Children;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED =
        ReactSharedInternals;
      exports.act = act;
      exports.cloneElement = cloneElement$1;
      exports.createContext = createContext;
      exports.createElement = createElement$1;
      exports.createFactory = createFactory;
      exports.createRef = createRef;
      exports.forwardRef = forwardRef;
      exports.isValidElement = isValidElement;
      exports.lazy = lazy;
      exports.memo = memo;
      exports.startTransition = startTransition;
      exports.unstable_act = act;
      exports.useCallback = useCallback;
      exports.useContext = useContext;
      exports.useDebugValue = useDebugValue;
      exports.useDeferredValue = useDeferredValue;
      exports.useEffect = useEffect;
      exports.useId = useId;
      exports.useImperativeHandle = useImperativeHandle;
      exports.useInsertionEffect = useInsertionEffect;
      exports.useLayoutEffect = useLayoutEffect;
      exports.useMemo = useMemo;
      exports.useReducer = useReducer;
      exports.useRef = useRef;
      exports.useState = useState;
      exports.useSyncExternalStore = useSyncExternalStore;
      exports.useTransition = useTransition;
      exports.version = ReactVersion;
      if (
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop ===
          'function'
      ) {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
      }
    })();
  }
});

// node_modules/.bun/react@18.3.1/node_modules/react/index.js
var require_react = __commonJS((exports, module) => {
  if (false) {
  } else {
    module.exports = require_react_development();
  }
});

// node_modules/.bun/react@18.3.1/node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS((exports) => {
  var React2 = __toESM(require_react());
  if (true) {
    (function () {
      var REACT_ELEMENT_TYPE = Symbol.for('react.element');
      var REACT_PORTAL_TYPE = Symbol.for('react.portal');
      var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
      var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
      var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
      var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
      var REACT_CONTEXT_TYPE = Symbol.for('react.context');
      var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
      var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
      var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
      var REACT_MEMO_TYPE = Symbol.for('react.memo');
      var REACT_LAZY_TYPE = Symbol.for('react.lazy');
      var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = '@@iterator';
      function getIteratorFn(maybeIterable) {
        if (maybeIterable === null || typeof maybeIterable !== 'object') {
          return null;
        }
        var maybeIterator =
          (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
          maybeIterable[FAUX_ITERATOR_SYMBOL];
        if (typeof maybeIterator === 'function') {
          return maybeIterator;
        }
        return null;
      }
      var ReactSharedInternals =
        React2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      function error(format) {
        {
          {
            for (
              var _len2 = arguments.length,
                args = new Array(_len2 > 1 ? _len2 - 1 : 0),
                _key2 = 1;
              _key2 < _len2;
              _key2++
            ) {
              args[_key2 - 1] = arguments[_key2];
            }
            printWarning('error', format, args);
          }
        }
      }
      function printWarning(level, format, args) {
        {
          var ReactDebugCurrentFrame2 =
            ReactSharedInternals.ReactDebugCurrentFrame;
          var stack = ReactDebugCurrentFrame2.getStackAddendum();
          if (stack !== '') {
            format += '%s';
            args = args.concat([stack]);
          }
          var argsWithFormat = args.map(function (item) {
            return String(item);
          });
          argsWithFormat.unshift('Warning: ' + format);
          Function.prototype.apply.call(
            console[level],
            console,
            argsWithFormat
          );
        }
      }
      var enableScopeAPI = false;
      var enableCacheElement = false;
      var enableTransitionTracing = false;
      var enableLegacyHidden = false;
      var enableDebugTracing = false;
      var REACT_MODULE_REFERENCE;
      {
        REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
      }
      function isValidElementType(type) {
        if (typeof type === 'string' || typeof type === 'function') {
          return true;
        }
        if (
          type === REACT_FRAGMENT_TYPE ||
          type === REACT_PROFILER_TYPE ||
          enableDebugTracing ||
          type === REACT_STRICT_MODE_TYPE ||
          type === REACT_SUSPENSE_TYPE ||
          type === REACT_SUSPENSE_LIST_TYPE ||
          enableLegacyHidden ||
          type === REACT_OFFSCREEN_TYPE ||
          enableScopeAPI ||
          enableCacheElement ||
          enableTransitionTracing
        ) {
          return true;
        }
        if (typeof type === 'object' && type !== null) {
          if (
            type.$$typeof === REACT_LAZY_TYPE ||
            type.$$typeof === REACT_MEMO_TYPE ||
            type.$$typeof === REACT_PROVIDER_TYPE ||
            type.$$typeof === REACT_CONTEXT_TYPE ||
            type.$$typeof === REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_MODULE_REFERENCE ||
            type.getModuleId !== undefined
          ) {
            return true;
          }
        }
        return false;
      }
      function getWrappedName(outerType, innerType, wrapperName) {
        var displayName = outerType.displayName;
        if (displayName) {
          return displayName;
        }
        var functionName = innerType.displayName || innerType.name || '';
        return functionName !== ''
          ? wrapperName + '(' + functionName + ')'
          : wrapperName;
      }
      function getContextName(type) {
        return type.displayName || 'Context';
      }
      function getComponentNameFromType(type) {
        if (type == null) {
          return null;
        }
        {
          if (typeof type.tag === 'number') {
            error(
              'Received an unexpected object in getComponentNameFromType(). ' +
                'This is likely a bug in React. Please file an issue.'
            );
          }
        }
        if (typeof type === 'function') {
          return type.displayName || type.name || null;
        }
        if (typeof type === 'string') {
          return type;
        }
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return 'Fragment';
          case REACT_PORTAL_TYPE:
            return 'Portal';
          case REACT_PROFILER_TYPE:
            return 'Profiler';
          case REACT_STRICT_MODE_TYPE:
            return 'StrictMode';
          case REACT_SUSPENSE_TYPE:
            return 'Suspense';
          case REACT_SUSPENSE_LIST_TYPE:
            return 'SuspenseList';
        }
        if (typeof type === 'object') {
          switch (type.$$typeof) {
            case REACT_CONTEXT_TYPE:
              var context = type;
              return getContextName(context) + '.Consumer';
            case REACT_PROVIDER_TYPE:
              var provider = type;
              return getContextName(provider._context) + '.Provider';
            case REACT_FORWARD_REF_TYPE:
              return getWrappedName(type, type.render, 'ForwardRef');
            case REACT_MEMO_TYPE:
              var outerName = type.displayName || null;
              if (outerName !== null) {
                return outerName;
              }
              return getComponentNameFromType(type.type) || 'Memo';
            case REACT_LAZY_TYPE: {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return getComponentNameFromType(init(payload));
              } catch (x) {
                return null;
              }
            }
          }
        }
        return null;
      }
      var assign = Object.assign;
      var disabledDepth = 0;
      var prevLog;
      var prevInfo;
      var prevWarn;
      var prevError;
      var prevGroup;
      var prevGroupCollapsed;
      var prevGroupEnd;
      function disabledLog() {}
      disabledLog.__reactDisabledLog = true;
      function disableLogs() {
        {
          if (disabledDepth === 0) {
            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;
            var props = {
              configurable: true,
              enumerable: true,
              value: disabledLog,
              writable: true,
            };
            Object.defineProperties(console, {
              info: props,
              log: props,
              warn: props,
              error: props,
              group: props,
              groupCollapsed: props,
              groupEnd: props,
            });
          }
          disabledDepth++;
        }
      }
      function reenableLogs() {
        {
          disabledDepth--;
          if (disabledDepth === 0) {
            var props = {
              configurable: true,
              enumerable: true,
              writable: true,
            };
            Object.defineProperties(console, {
              log: assign({}, props, {
                value: prevLog,
              }),
              info: assign({}, props, {
                value: prevInfo,
              }),
              warn: assign({}, props, {
                value: prevWarn,
              }),
              error: assign({}, props, {
                value: prevError,
              }),
              group: assign({}, props, {
                value: prevGroup,
              }),
              groupCollapsed: assign({}, props, {
                value: prevGroupCollapsed,
              }),
              groupEnd: assign({}, props, {
                value: prevGroupEnd,
              }),
            });
          }
          if (disabledDepth < 0) {
            error(
              'disabledDepth fell below zero. ' +
                'This is a bug in React. Please file an issue.'
            );
          }
        }
      }
      var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
      var prefix;
      function describeBuiltInComponentFrame(name, source, ownerFn) {
        {
          if (prefix === undefined) {
            try {
              throw Error();
            } catch (x) {
              var match = x.stack.trim().match(/\n( *(at )?)/);
              prefix = (match && match[1]) || '';
            }
          }
          return (
            `
` +
            prefix +
            name
          );
        }
      }
      var reentry = false;
      var componentFrameCache;
      {
        var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
        componentFrameCache = new PossiblyWeakMap();
      }
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) {
          return '';
        }
        {
          var frame = componentFrameCache.get(fn);
          if (frame !== undefined) {
            return frame;
          }
        }
        var control;
        reentry = true;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = undefined;
        var previousDispatcher;
        {
          previousDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = null;
          disableLogs();
        }
        try {
          if (construct) {
            var Fake = function () {
              throw Error();
            };
            Object.defineProperty(Fake.prototype, 'props', {
              set: function () {
                throw Error();
              },
            });
            if (typeof Reflect === 'object' && Reflect.construct) {
              try {
                Reflect.construct(Fake, []);
              } catch (x) {
                control = x;
              }
              Reflect.construct(fn, [], Fake);
            } else {
              try {
                Fake.call();
              } catch (x) {
                control = x;
              }
              fn.call(Fake.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (x) {
              control = x;
            }
            fn();
          }
        } catch (sample) {
          if (sample && control && typeof sample.stack === 'string') {
            var sampleLines = sample.stack.split(`
`);
            var controlLines = control.stack.split(`
`);
            var s = sampleLines.length - 1;
            var c = controlLines.length - 1;
            while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
              c--;
            }
            for (; s >= 1 && c >= 0; s--, c--) {
              if (sampleLines[s] !== controlLines[c]) {
                if (s !== 1 || c !== 1) {
                  do {
                    s--;
                    c--;
                    if (c < 0 || sampleLines[s] !== controlLines[c]) {
                      var _frame =
                        `
` + sampleLines[s].replace(' at new ', ' at ');
                      if (fn.displayName && _frame.includes('<anonymous>')) {
                        _frame = _frame.replace('<anonymous>', fn.displayName);
                      }
                      {
                        if (typeof fn === 'function') {
                          componentFrameCache.set(fn, _frame);
                        }
                      }
                      return _frame;
                    }
                  } while (s >= 1 && c >= 0);
                }
                break;
              }
            }
          }
        } finally {
          reentry = false;
          {
            ReactCurrentDispatcher.current = previousDispatcher;
            reenableLogs();
          }
          Error.prepareStackTrace = previousPrepareStackTrace;
        }
        var name = fn ? fn.displayName || fn.name : '';
        var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';
        {
          if (typeof fn === 'function') {
            componentFrameCache.set(fn, syntheticFrame);
          }
        }
        return syntheticFrame;
      }
      function describeFunctionComponentFrame(fn, source, ownerFn) {
        {
          return describeNativeComponentFrame(fn, false);
        }
      }
      function shouldConstruct(Component) {
        var prototype = Component.prototype;
        return !!(prototype && prototype.isReactComponent);
      }
      function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
        if (type == null) {
          return '';
        }
        if (typeof type === 'function') {
          {
            return describeNativeComponentFrame(type, shouldConstruct(type));
          }
        }
        if (typeof type === 'string') {
          return describeBuiltInComponentFrame(type);
        }
        switch (type) {
          case REACT_SUSPENSE_TYPE:
            return describeBuiltInComponentFrame('Suspense');
          case REACT_SUSPENSE_LIST_TYPE:
            return describeBuiltInComponentFrame('SuspenseList');
        }
        if (typeof type === 'object') {
          switch (type.$$typeof) {
            case REACT_FORWARD_REF_TYPE:
              return describeFunctionComponentFrame(type.render);
            case REACT_MEMO_TYPE:
              return describeUnknownElementTypeFrameInDEV(
                type.type,
                source,
                ownerFn
              );
            case REACT_LAZY_TYPE: {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return describeUnknownElementTypeFrameInDEV(
                  init(payload),
                  source,
                  ownerFn
                );
              } catch (x) {}
            }
          }
        }
        return '';
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var loggedTypeFailures = {};
      var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
      function setCurrentlyValidatingElement(element) {
        {
          if (element) {
            var owner = element._owner;
            var stack = describeUnknownElementTypeFrameInDEV(
              element.type,
              element._source,
              owner ? owner.type : null
            );
            ReactDebugCurrentFrame.setExtraStackFrame(stack);
          } else {
            ReactDebugCurrentFrame.setExtraStackFrame(null);
          }
        }
      }
      function checkPropTypes(
        typeSpecs,
        values,
        location,
        componentName,
        element
      ) {
        {
          var has = Function.call.bind(hasOwnProperty);
          for (var typeSpecName in typeSpecs) {
            if (has(typeSpecs, typeSpecName)) {
              var error$1 = undefined;
              try {
                if (typeof typeSpecs[typeSpecName] !== 'function') {
                  var err = Error(
                    (componentName || 'React class') +
                      ': ' +
                      location +
                      ' type `' +
                      typeSpecName +
                      '` is invalid; ' +
                      'it must be a function, usually from the `prop-types` package, but received `' +
                      typeof typeSpecs[typeSpecName] +
                      '`.' +
                      'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
                  );
                  err.name = 'Invariant Violation';
                  throw err;
                }
                error$1 = typeSpecs[typeSpecName](
                  values,
                  typeSpecName,
                  componentName,
                  location,
                  null,
                  'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED'
                );
              } catch (ex) {
                error$1 = ex;
              }
              if (error$1 && !(error$1 instanceof Error)) {
                setCurrentlyValidatingElement(element);
                error(
                  '%s: type specification of %s' +
                    ' `%s` is invalid; the type checker ' +
                    'function must return `null` or an `Error` but returned a %s. ' +
                    'You may have forgotten to pass an argument to the type checker ' +
                    'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
                    'shape all require an argument).',
                  componentName || 'React class',
                  location,
                  typeSpecName,
                  typeof error$1
                );
                setCurrentlyValidatingElement(null);
              }
              if (
                error$1 instanceof Error &&
                !(error$1.message in loggedTypeFailures)
              ) {
                loggedTypeFailures[error$1.message] = true;
                setCurrentlyValidatingElement(element);
                error('Failed %s type: %s', location, error$1.message);
                setCurrentlyValidatingElement(null);
              }
            }
          }
        }
      }
      var isArrayImpl = Array.isArray;
      function isArray(a) {
        return isArrayImpl(a);
      }
      function typeName(value) {
        {
          var hasToStringTag =
            typeof Symbol === 'function' && Symbol.toStringTag;
          var type =
            (hasToStringTag && value[Symbol.toStringTag]) ||
            value.constructor.name ||
            'Object';
          return type;
        }
      }
      function willCoercionThrow(value) {
        {
          try {
            testStringCoercion(value);
            return false;
          } catch (e) {
            return true;
          }
        }
      }
      function testStringCoercion(value) {
        return '' + value;
      }
      function checkKeyStringCoercion(value) {
        {
          if (willCoercionThrow(value)) {
            error(
              'The provided key is an unsupported type %s.' +
                ' This value must be coerced to a string before before using it here.',
              typeName(value)
            );
            return testStringCoercion(value);
          }
        }
      }
      var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
      var RESERVED_PROPS = {
        key: true,
        ref: true,
        __self: true,
        __source: true,
      };
      var specialPropKeyWarningShown;
      var specialPropRefWarningShown;
      var didWarnAboutStringRefs;
      {
        didWarnAboutStringRefs = {};
      }
      function hasValidRef(config) {
        {
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
        {
          if (hasOwnProperty.call(config, 'key')) {
            var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
            if (getter && getter.isReactWarning) {
              return false;
            }
          }
        }
        return config.key !== undefined;
      }
      function warnIfStringRefCannotBeAutoConverted(config, self) {
        {
          if (
            typeof config.ref === 'string' &&
            ReactCurrentOwner.current &&
            self &&
            ReactCurrentOwner.current.stateNode !== self
          ) {
            var componentName = getComponentNameFromType(
              ReactCurrentOwner.current.type
            );
            if (!didWarnAboutStringRefs[componentName]) {
              error(
                'Component "%s" contains the string ref "%s". ' +
                  'Support for string refs will be removed in a future major release. ' +
                  'This case cannot be automatically converted to an arrow function. ' +
                  'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
                  'Learn more about using refs safely here: ' +
                  'https://reactjs.org/link/strict-mode-string-ref',
                getComponentNameFromType(ReactCurrentOwner.current.type),
                config.ref
              );
              didWarnAboutStringRefs[componentName] = true;
            }
          }
        }
      }
      function defineKeyPropWarningGetter(props, displayName) {
        {
          var warnAboutAccessingKey = function () {
            if (!specialPropKeyWarningShown) {
              specialPropKeyWarningShown = true;
              error(
                '%s: `key` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://reactjs.org/link/special-props)',
                displayName
              );
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, 'key', {
            get: warnAboutAccessingKey,
            configurable: true,
          });
        }
      }
      function defineRefPropWarningGetter(props, displayName) {
        {
          var warnAboutAccessingRef = function () {
            if (!specialPropRefWarningShown) {
              specialPropRefWarningShown = true;
              error(
                '%s: `ref` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://reactjs.org/link/special-props)',
                displayName
              );
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, 'ref', {
            get: warnAboutAccessingRef,
            configurable: true,
          });
        }
      }
      var ReactElement = function (type, key, ref, self, source, owner, props) {
        var element = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref,
          props,
          _owner: owner,
        };
        {
          element._store = {};
          Object.defineProperty(element._store, 'validated', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: false,
          });
          Object.defineProperty(element, '_self', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: self,
          });
          Object.defineProperty(element, '_source', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: source,
          });
          if (Object.freeze) {
            Object.freeze(element.props);
            Object.freeze(element);
          }
        }
        return element;
      };
      function jsxDEV(type, config, maybeKey, source, self) {
        {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          if (maybeKey !== undefined) {
            {
              checkKeyStringCoercion(maybeKey);
            }
            key = '' + maybeKey;
          }
          if (hasValidKey(config)) {
            {
              checkKeyStringCoercion(config.key);
            }
            key = '' + config.key;
          }
          if (hasValidRef(config)) {
            ref = config.ref;
            warnIfStringRefCannotBeAutoConverted(config, self);
          }
          for (propName in config) {
            if (
              hasOwnProperty.call(config, propName) &&
              !RESERVED_PROPS.hasOwnProperty(propName)
            ) {
              props[propName] = config[propName];
            }
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          if (key || ref) {
            var displayName =
              typeof type === 'function'
                ? type.displayName || type.name || 'Unknown'
                : type;
            if (key) {
              defineKeyPropWarningGetter(props, displayName);
            }
            if (ref) {
              defineRefPropWarningGetter(props, displayName);
            }
          }
          return ReactElement(
            type,
            key,
            ref,
            self,
            source,
            ReactCurrentOwner.current,
            props
          );
        }
      }
      var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
      var ReactDebugCurrentFrame$1 =
        ReactSharedInternals.ReactDebugCurrentFrame;
      function setCurrentlyValidatingElement$1(element) {
        {
          if (element) {
            var owner = element._owner;
            var stack = describeUnknownElementTypeFrameInDEV(
              element.type,
              element._source,
              owner ? owner.type : null
            );
            ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
          } else {
            ReactDebugCurrentFrame$1.setExtraStackFrame(null);
          }
        }
      }
      var propTypesMisspellWarningShown;
      {
        propTypesMisspellWarningShown = false;
      }
      function isValidElement(object) {
        {
          return (
            typeof object === 'object' &&
            object !== null &&
            object.$$typeof === REACT_ELEMENT_TYPE
          );
        }
      }
      function getDeclarationErrorAddendum() {
        {
          if (ReactCurrentOwner$1.current) {
            var name = getComponentNameFromType(
              ReactCurrentOwner$1.current.type
            );
            if (name) {
              return (
                `

Check the render method of \`` +
                name +
                '`.'
              );
            }
          }
          return '';
        }
      }
      function getSourceInfoErrorAddendum(source) {
        {
          if (source !== undefined) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, '');
            var lineNumber = source.lineNumber;
            return (
              `

Check your code at ` +
              fileName +
              ':' +
              lineNumber +
              '.'
            );
          }
          return '';
        }
      }
      var ownerHasKeyUseWarning = {};
      function getCurrentComponentErrorInfo(parentType) {
        {
          var info = getDeclarationErrorAddendum();
          if (!info) {
            var parentName =
              typeof parentType === 'string'
                ? parentType
                : parentType.displayName || parentType.name;
            if (parentName) {
              info =
                `

Check the top-level render call using <` +
                parentName +
                '>.';
            }
          }
          return info;
        }
      }
      function validateExplicitKey(element, parentType) {
        {
          if (
            !element._store ||
            element._store.validated ||
            element.key != null
          ) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo =
            getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = '';
          if (
            element &&
            element._owner &&
            element._owner !== ReactCurrentOwner$1.current
          ) {
            childOwner =
              ' It was passed a child from ' +
              getComponentNameFromType(element._owner.type) +
              '.';
          }
          setCurrentlyValidatingElement$1(element);
          error(
            'Each child in a list should have a unique "key" prop.' +
              '%s%s See https://reactjs.org/link/warning-keys for more information.',
            currentComponentErrorInfo,
            childOwner
          );
          setCurrentlyValidatingElement$1(null);
        }
      }
      function validateChildKeys(node, parentType) {
        {
          if (typeof node !== 'object') {
            return;
          }
          if (isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === 'function') {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
      }
      function validatePropTypes(element) {
        {
          var type = element.type;
          if (type === null || type === undefined || typeof type === 'string') {
            return;
          }
          var propTypes;
          if (typeof type === 'function') {
            propTypes = type.propTypes;
          } else if (
            typeof type === 'object' &&
            (type.$$typeof === REACT_FORWARD_REF_TYPE ||
              type.$$typeof === REACT_MEMO_TYPE)
          ) {
            propTypes = type.propTypes;
          } else {
            return;
          }
          if (propTypes) {
            var name = getComponentNameFromType(type);
            checkPropTypes(propTypes, element.props, 'prop', name, element);
          } else if (
            type.PropTypes !== undefined &&
            !propTypesMisspellWarningShown
          ) {
            propTypesMisspellWarningShown = true;
            var _name = getComponentNameFromType(type);
            error(
              'Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?',
              _name || 'Unknown'
            );
          }
          if (
            typeof type.getDefaultProps === 'function' &&
            !type.getDefaultProps.isReactClassApproved
          ) {
            error(
              'getDefaultProps is only used on classic React.createClass ' +
                'definitions. Use a static property named `defaultProps` instead.'
            );
          }
        }
      }
      function validateFragmentProps(fragment) {
        {
          var keys = Object.keys(fragment.props);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key !== 'children' && key !== 'key') {
              setCurrentlyValidatingElement$1(fragment);
              error(
                'Invalid prop `%s` supplied to `React.Fragment`. ' +
                  'React.Fragment can only have `key` and `children` props.',
                key
              );
              setCurrentlyValidatingElement$1(null);
              break;
            }
          }
          if (fragment.ref !== null) {
            setCurrentlyValidatingElement$1(fragment);
            error('Invalid attribute `ref` supplied to `React.Fragment`.');
            setCurrentlyValidatingElement$1(null);
          }
        }
      }
      var didWarnAboutKeySpread = {};
      function jsxWithValidation(
        type,
        props,
        key,
        isStaticChildren,
        source,
        self
      ) {
        {
          var validType = isValidElementType(type);
          if (!validType) {
            var info = '';
            if (
              type === undefined ||
              (typeof type === 'object' &&
                type !== null &&
                Object.keys(type).length === 0)
            ) {
              info +=
                ' You likely forgot to export your component from the file ' +
                "it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendum(source);
            if (sourceInfo) {
              info += sourceInfo;
            } else {
              info += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = 'null';
            } else if (isArray(type)) {
              typeString = 'array';
            } else if (
              type !== undefined &&
              type.$$typeof === REACT_ELEMENT_TYPE
            ) {
              typeString =
                '<' +
                (getComponentNameFromType(type.type) || 'Unknown') +
                ' />';
              info =
                ' Did you accidentally export a JSX literal instead of a component?';
            } else {
              typeString = typeof type;
            }
            error(
              'React.jsx: type is invalid -- expected a string (for ' +
                'built-in components) or a class/function (for composite ' +
                'components) but got: %s.%s',
              typeString,
              info
            );
          }
          var element = jsxDEV(type, props, key, source, self);
          if (element == null) {
            return element;
          }
          if (validType) {
            var children = props.children;
            if (children !== undefined) {
              if (isStaticChildren) {
                if (isArray(children)) {
                  for (var i = 0; i < children.length; i++) {
                    validateChildKeys(children[i], type);
                  }
                  if (Object.freeze) {
                    Object.freeze(children);
                  }
                } else {
                  error(
                    'React.jsx: Static children should always be an array. ' +
                      'You are likely explicitly calling React.jsxs or React.jsxDEV. ' +
                      'Use the Babel transform instead.'
                  );
                }
              } else {
                validateChildKeys(children, type);
              }
            }
          }
          {
            if (hasOwnProperty.call(props, 'key')) {
              var componentName = getComponentNameFromType(type);
              var keys = Object.keys(props).filter(function (k) {
                return k !== 'key';
              });
              var beforeExample =
                keys.length > 0
                  ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}'
                  : '{key: someKey}';
              if (!didWarnAboutKeySpread[componentName + beforeExample]) {
                var afterExample =
                  keys.length > 0
                    ? '{' + keys.join(': ..., ') + ': ...}'
                    : '{}';
                error(
                  `A props object containing a "key" prop is being spread into JSX:
` +
                    `  let props = %s;
` +
                    `  <%s {...props} />
` +
                    `React keys must be passed directly to JSX without using spread:
` +
                    `  let props = %s;
` +
                    '  <%s key={someKey} {...props} />',
                  beforeExample,
                  componentName,
                  afterExample,
                  componentName
                );
                didWarnAboutKeySpread[componentName + beforeExample] = true;
              }
            }
          }
          if (type === REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
      }
      function jsxWithValidationStatic(type, props, key) {
        {
          return jsxWithValidation(type, props, key, true);
        }
      }
      function jsxWithValidationDynamic(type, props, key) {
        {
          return jsxWithValidation(type, props, key, false);
        }
      }
      var jsx = jsxWithValidationDynamic;
      var jsxs = jsxWithValidationStatic;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = jsx;
      exports.jsxs = jsxs;
    })();
  }
});

// node_modules/.bun/react@18.3.1/node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS((exports, module) => {
  if (false) {
  } else {
    module.exports = require_react_jsx_runtime_development();
  }
});

// node_modules/.bun/react@18.3.1/node_modules/react/cjs/react-jsx-dev-runtime.development.js
var require_react_jsx_dev_runtime_development = __commonJS((exports) => {
  var React3 = __toESM(require_react());
  if (true) {
    (function () {
      var REACT_ELEMENT_TYPE = Symbol.for('react.element');
      var REACT_PORTAL_TYPE = Symbol.for('react.portal');
      var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
      var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
      var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
      var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
      var REACT_CONTEXT_TYPE = Symbol.for('react.context');
      var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
      var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
      var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
      var REACT_MEMO_TYPE = Symbol.for('react.memo');
      var REACT_LAZY_TYPE2 = Symbol.for('react.lazy');
      var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = '@@iterator';
      function getIteratorFn(maybeIterable) {
        if (maybeIterable === null || typeof maybeIterable !== 'object') {
          return null;
        }
        var maybeIterator =
          (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
          maybeIterable[FAUX_ITERATOR_SYMBOL];
        if (typeof maybeIterator === 'function') {
          return maybeIterator;
        }
        return null;
      }
      var ReactSharedInternals =
        React3.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      function error(format) {
        {
          {
            for (
              var _len2 = arguments.length,
                args = new Array(_len2 > 1 ? _len2 - 1 : 0),
                _key2 = 1;
              _key2 < _len2;
              _key2++
            ) {
              args[_key2 - 1] = arguments[_key2];
            }
            printWarning('error', format, args);
          }
        }
      }
      function printWarning(level, format, args) {
        {
          var ReactDebugCurrentFrame2 =
            ReactSharedInternals.ReactDebugCurrentFrame;
          var stack = ReactDebugCurrentFrame2.getStackAddendum();
          if (stack !== '') {
            format += '%s';
            args = args.concat([stack]);
          }
          var argsWithFormat = args.map(function (item) {
            return String(item);
          });
          argsWithFormat.unshift('Warning: ' + format);
          Function.prototype.apply.call(
            console[level],
            console,
            argsWithFormat
          );
        }
      }
      var enableScopeAPI = false;
      var enableCacheElement = false;
      var enableTransitionTracing = false;
      var enableLegacyHidden = false;
      var enableDebugTracing = false;
      var REACT_MODULE_REFERENCE;
      {
        REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
      }
      function isValidElementType(type) {
        if (typeof type === 'string' || typeof type === 'function') {
          return true;
        }
        if (
          type === REACT_FRAGMENT_TYPE ||
          type === REACT_PROFILER_TYPE ||
          enableDebugTracing ||
          type === REACT_STRICT_MODE_TYPE ||
          type === REACT_SUSPENSE_TYPE ||
          type === REACT_SUSPENSE_LIST_TYPE ||
          enableLegacyHidden ||
          type === REACT_OFFSCREEN_TYPE ||
          enableScopeAPI ||
          enableCacheElement ||
          enableTransitionTracing
        ) {
          return true;
        }
        if (typeof type === 'object' && type !== null) {
          if (
            type.$$typeof === REACT_LAZY_TYPE2 ||
            type.$$typeof === REACT_MEMO_TYPE ||
            type.$$typeof === REACT_PROVIDER_TYPE ||
            type.$$typeof === REACT_CONTEXT_TYPE ||
            type.$$typeof === REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_MODULE_REFERENCE ||
            type.getModuleId !== undefined
          ) {
            return true;
          }
        }
        return false;
      }
      function getWrappedName(outerType, innerType, wrapperName) {
        var displayName = outerType.displayName;
        if (displayName) {
          return displayName;
        }
        var functionName = innerType.displayName || innerType.name || '';
        return functionName !== ''
          ? wrapperName + '(' + functionName + ')'
          : wrapperName;
      }
      function getContextName(type) {
        return type.displayName || 'Context';
      }
      function getComponentNameFromType(type) {
        if (type == null) {
          return null;
        }
        {
          if (typeof type.tag === 'number') {
            error(
              'Received an unexpected object in getComponentNameFromType(). ' +
                'This is likely a bug in React. Please file an issue.'
            );
          }
        }
        if (typeof type === 'function') {
          return type.displayName || type.name || null;
        }
        if (typeof type === 'string') {
          return type;
        }
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return 'Fragment';
          case REACT_PORTAL_TYPE:
            return 'Portal';
          case REACT_PROFILER_TYPE:
            return 'Profiler';
          case REACT_STRICT_MODE_TYPE:
            return 'StrictMode';
          case REACT_SUSPENSE_TYPE:
            return 'Suspense';
          case REACT_SUSPENSE_LIST_TYPE:
            return 'SuspenseList';
        }
        if (typeof type === 'object') {
          switch (type.$$typeof) {
            case REACT_CONTEXT_TYPE:
              var context = type;
              return getContextName(context) + '.Consumer';
            case REACT_PROVIDER_TYPE:
              var provider = type;
              return getContextName(provider._context) + '.Provider';
            case REACT_FORWARD_REF_TYPE:
              return getWrappedName(type, type.render, 'ForwardRef');
            case REACT_MEMO_TYPE:
              var outerName = type.displayName || null;
              if (outerName !== null) {
                return outerName;
              }
              return getComponentNameFromType(type.type) || 'Memo';
            case REACT_LAZY_TYPE2: {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return getComponentNameFromType(init(payload));
              } catch (x) {
                return null;
              }
            }
          }
        }
        return null;
      }
      var assign = Object.assign;
      var disabledDepth = 0;
      var prevLog;
      var prevInfo;
      var prevWarn;
      var prevError;
      var prevGroup;
      var prevGroupCollapsed;
      var prevGroupEnd;
      function disabledLog() {}
      disabledLog.__reactDisabledLog = true;
      function disableLogs() {
        {
          if (disabledDepth === 0) {
            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;
            var props = {
              configurable: true,
              enumerable: true,
              value: disabledLog,
              writable: true,
            };
            Object.defineProperties(console, {
              info: props,
              log: props,
              warn: props,
              error: props,
              group: props,
              groupCollapsed: props,
              groupEnd: props,
            });
          }
          disabledDepth++;
        }
      }
      function reenableLogs() {
        {
          disabledDepth--;
          if (disabledDepth === 0) {
            var props = {
              configurable: true,
              enumerable: true,
              writable: true,
            };
            Object.defineProperties(console, {
              log: assign({}, props, {
                value: prevLog,
              }),
              info: assign({}, props, {
                value: prevInfo,
              }),
              warn: assign({}, props, {
                value: prevWarn,
              }),
              error: assign({}, props, {
                value: prevError,
              }),
              group: assign({}, props, {
                value: prevGroup,
              }),
              groupCollapsed: assign({}, props, {
                value: prevGroupCollapsed,
              }),
              groupEnd: assign({}, props, {
                value: prevGroupEnd,
              }),
            });
          }
          if (disabledDepth < 0) {
            error(
              'disabledDepth fell below zero. ' +
                'This is a bug in React. Please file an issue.'
            );
          }
        }
      }
      var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
      var prefix;
      function describeBuiltInComponentFrame(name, source, ownerFn) {
        {
          if (prefix === undefined) {
            try {
              throw Error();
            } catch (x) {
              var match = x.stack.trim().match(/\n( *(at )?)/);
              prefix = (match && match[1]) || '';
            }
          }
          return (
            `
` +
            prefix +
            name
          );
        }
      }
      var reentry = false;
      var componentFrameCache;
      {
        var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
        componentFrameCache = new PossiblyWeakMap();
      }
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) {
          return '';
        }
        {
          var frame = componentFrameCache.get(fn);
          if (frame !== undefined) {
            return frame;
          }
        }
        var control;
        reentry = true;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = undefined;
        var previousDispatcher;
        {
          previousDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = null;
          disableLogs();
        }
        try {
          if (construct) {
            var Fake = function () {
              throw Error();
            };
            Object.defineProperty(Fake.prototype, 'props', {
              set: function () {
                throw Error();
              },
            });
            if (typeof Reflect === 'object' && Reflect.construct) {
              try {
                Reflect.construct(Fake, []);
              } catch (x) {
                control = x;
              }
              Reflect.construct(fn, [], Fake);
            } else {
              try {
                Fake.call();
              } catch (x) {
                control = x;
              }
              fn.call(Fake.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (x) {
              control = x;
            }
            fn();
          }
        } catch (sample) {
          if (sample && control && typeof sample.stack === 'string') {
            var sampleLines = sample.stack.split(`
`);
            var controlLines = control.stack.split(`
`);
            var s = sampleLines.length - 1;
            var c = controlLines.length - 1;
            while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
              c--;
            }
            for (; s >= 1 && c >= 0; s--, c--) {
              if (sampleLines[s] !== controlLines[c]) {
                if (s !== 1 || c !== 1) {
                  do {
                    s--;
                    c--;
                    if (c < 0 || sampleLines[s] !== controlLines[c]) {
                      var _frame =
                        `
` + sampleLines[s].replace(' at new ', ' at ');
                      if (fn.displayName && _frame.includes('<anonymous>')) {
                        _frame = _frame.replace('<anonymous>', fn.displayName);
                      }
                      {
                        if (typeof fn === 'function') {
                          componentFrameCache.set(fn, _frame);
                        }
                      }
                      return _frame;
                    }
                  } while (s >= 1 && c >= 0);
                }
                break;
              }
            }
          }
        } finally {
          reentry = false;
          {
            ReactCurrentDispatcher.current = previousDispatcher;
            reenableLogs();
          }
          Error.prepareStackTrace = previousPrepareStackTrace;
        }
        var name = fn ? fn.displayName || fn.name : '';
        var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';
        {
          if (typeof fn === 'function') {
            componentFrameCache.set(fn, syntheticFrame);
          }
        }
        return syntheticFrame;
      }
      function describeFunctionComponentFrame(fn, source, ownerFn) {
        {
          return describeNativeComponentFrame(fn, false);
        }
      }
      function shouldConstruct(Component) {
        var prototype = Component.prototype;
        return !!(prototype && prototype.isReactComponent);
      }
      function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
        if (type == null) {
          return '';
        }
        if (typeof type === 'function') {
          {
            return describeNativeComponentFrame(type, shouldConstruct(type));
          }
        }
        if (typeof type === 'string') {
          return describeBuiltInComponentFrame(type);
        }
        switch (type) {
          case REACT_SUSPENSE_TYPE:
            return describeBuiltInComponentFrame('Suspense');
          case REACT_SUSPENSE_LIST_TYPE:
            return describeBuiltInComponentFrame('SuspenseList');
        }
        if (typeof type === 'object') {
          switch (type.$$typeof) {
            case REACT_FORWARD_REF_TYPE:
              return describeFunctionComponentFrame(type.render);
            case REACT_MEMO_TYPE:
              return describeUnknownElementTypeFrameInDEV(
                type.type,
                source,
                ownerFn
              );
            case REACT_LAZY_TYPE2: {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return describeUnknownElementTypeFrameInDEV(
                  init(payload),
                  source,
                  ownerFn
                );
              } catch (x) {}
            }
          }
        }
        return '';
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var loggedTypeFailures = {};
      var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
      function setCurrentlyValidatingElement(element) {
        {
          if (element) {
            var owner = element._owner;
            var stack = describeUnknownElementTypeFrameInDEV(
              element.type,
              element._source,
              owner ? owner.type : null
            );
            ReactDebugCurrentFrame.setExtraStackFrame(stack);
          } else {
            ReactDebugCurrentFrame.setExtraStackFrame(null);
          }
        }
      }
      function checkPropTypes(
        typeSpecs,
        values,
        location,
        componentName,
        element
      ) {
        {
          var has = Function.call.bind(hasOwnProperty);
          for (var typeSpecName in typeSpecs) {
            if (has(typeSpecs, typeSpecName)) {
              var error$1 = undefined;
              try {
                if (typeof typeSpecs[typeSpecName] !== 'function') {
                  var err = Error(
                    (componentName || 'React class') +
                      ': ' +
                      location +
                      ' type `' +
                      typeSpecName +
                      '` is invalid; ' +
                      'it must be a function, usually from the `prop-types` package, but received `' +
                      typeof typeSpecs[typeSpecName] +
                      '`.' +
                      'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
                  );
                  err.name = 'Invariant Violation';
                  throw err;
                }
                error$1 = typeSpecs[typeSpecName](
                  values,
                  typeSpecName,
                  componentName,
                  location,
                  null,
                  'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED'
                );
              } catch (ex) {
                error$1 = ex;
              }
              if (error$1 && !(error$1 instanceof Error)) {
                setCurrentlyValidatingElement(element);
                error(
                  '%s: type specification of %s' +
                    ' `%s` is invalid; the type checker ' +
                    'function must return `null` or an `Error` but returned a %s. ' +
                    'You may have forgotten to pass an argument to the type checker ' +
                    'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
                    'shape all require an argument).',
                  componentName || 'React class',
                  location,
                  typeSpecName,
                  typeof error$1
                );
                setCurrentlyValidatingElement(null);
              }
              if (
                error$1 instanceof Error &&
                !(error$1.message in loggedTypeFailures)
              ) {
                loggedTypeFailures[error$1.message] = true;
                setCurrentlyValidatingElement(element);
                error('Failed %s type: %s', location, error$1.message);
                setCurrentlyValidatingElement(null);
              }
            }
          }
        }
      }
      var isArrayImpl = Array.isArray;
      function isArray(a) {
        return isArrayImpl(a);
      }
      function typeName(value) {
        {
          var hasToStringTag =
            typeof Symbol === 'function' && Symbol.toStringTag;
          var type =
            (hasToStringTag && value[Symbol.toStringTag]) ||
            value.constructor.name ||
            'Object';
          return type;
        }
      }
      function willCoercionThrow(value) {
        {
          try {
            testStringCoercion(value);
            return false;
          } catch (e) {
            return true;
          }
        }
      }
      function testStringCoercion(value) {
        return '' + value;
      }
      function checkKeyStringCoercion(value) {
        {
          if (willCoercionThrow(value)) {
            error(
              'The provided key is an unsupported type %s.' +
                ' This value must be coerced to a string before before using it here.',
              typeName(value)
            );
            return testStringCoercion(value);
          }
        }
      }
      var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
      var RESERVED_PROPS = {
        key: true,
        ref: true,
        __self: true,
        __source: true,
      };
      var specialPropKeyWarningShown;
      var specialPropRefWarningShown;
      var didWarnAboutStringRefs;
      {
        didWarnAboutStringRefs = {};
      }
      function hasValidRef(config) {
        {
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
        {
          if (hasOwnProperty.call(config, 'key')) {
            var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
            if (getter && getter.isReactWarning) {
              return false;
            }
          }
        }
        return config.key !== undefined;
      }
      function warnIfStringRefCannotBeAutoConverted(config, self) {
        {
          if (
            typeof config.ref === 'string' &&
            ReactCurrentOwner.current &&
            self &&
            ReactCurrentOwner.current.stateNode !== self
          ) {
            var componentName = getComponentNameFromType(
              ReactCurrentOwner.current.type
            );
            if (!didWarnAboutStringRefs[componentName]) {
              error(
                'Component "%s" contains the string ref "%s". ' +
                  'Support for string refs will be removed in a future major release. ' +
                  'This case cannot be automatically converted to an arrow function. ' +
                  'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
                  'Learn more about using refs safely here: ' +
                  'https://reactjs.org/link/strict-mode-string-ref',
                getComponentNameFromType(ReactCurrentOwner.current.type),
                config.ref
              );
              didWarnAboutStringRefs[componentName] = true;
            }
          }
        }
      }
      function defineKeyPropWarningGetter(props, displayName) {
        {
          var warnAboutAccessingKey = function () {
            if (!specialPropKeyWarningShown) {
              specialPropKeyWarningShown = true;
              error(
                '%s: `key` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://reactjs.org/link/special-props)',
                displayName
              );
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, 'key', {
            get: warnAboutAccessingKey,
            configurable: true,
          });
        }
      }
      function defineRefPropWarningGetter(props, displayName) {
        {
          var warnAboutAccessingRef = function () {
            if (!specialPropRefWarningShown) {
              specialPropRefWarningShown = true;
              error(
                '%s: `ref` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://reactjs.org/link/special-props)',
                displayName
              );
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, 'ref', {
            get: warnAboutAccessingRef,
            configurable: true,
          });
        }
      }
      var ReactElement = function (type, key, ref, self, source, owner, props) {
        var element = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref,
          props,
          _owner: owner,
        };
        {
          element._store = {};
          Object.defineProperty(element._store, 'validated', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: false,
          });
          Object.defineProperty(element, '_self', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: self,
          });
          Object.defineProperty(element, '_source', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: source,
          });
          if (Object.freeze) {
            Object.freeze(element.props);
            Object.freeze(element);
          }
        }
        return element;
      };
      function jsxDEV(type, config, maybeKey, source, self) {
        {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          if (maybeKey !== undefined) {
            {
              checkKeyStringCoercion(maybeKey);
            }
            key = '' + maybeKey;
          }
          if (hasValidKey(config)) {
            {
              checkKeyStringCoercion(config.key);
            }
            key = '' + config.key;
          }
          if (hasValidRef(config)) {
            ref = config.ref;
            warnIfStringRefCannotBeAutoConverted(config, self);
          }
          for (propName in config) {
            if (
              hasOwnProperty.call(config, propName) &&
              !RESERVED_PROPS.hasOwnProperty(propName)
            ) {
              props[propName] = config[propName];
            }
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          if (key || ref) {
            var displayName =
              typeof type === 'function'
                ? type.displayName || type.name || 'Unknown'
                : type;
            if (key) {
              defineKeyPropWarningGetter(props, displayName);
            }
            if (ref) {
              defineRefPropWarningGetter(props, displayName);
            }
          }
          return ReactElement(
            type,
            key,
            ref,
            self,
            source,
            ReactCurrentOwner.current,
            props
          );
        }
      }
      var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
      var ReactDebugCurrentFrame$1 =
        ReactSharedInternals.ReactDebugCurrentFrame;
      function setCurrentlyValidatingElement$1(element) {
        {
          if (element) {
            var owner = element._owner;
            var stack = describeUnknownElementTypeFrameInDEV(
              element.type,
              element._source,
              owner ? owner.type : null
            );
            ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
          } else {
            ReactDebugCurrentFrame$1.setExtraStackFrame(null);
          }
        }
      }
      var propTypesMisspellWarningShown;
      {
        propTypesMisspellWarningShown = false;
      }
      function isValidElement2(object) {
        {
          return (
            typeof object === 'object' &&
            object !== null &&
            object.$$typeof === REACT_ELEMENT_TYPE
          );
        }
      }
      function getDeclarationErrorAddendum() {
        {
          if (ReactCurrentOwner$1.current) {
            var name = getComponentNameFromType(
              ReactCurrentOwner$1.current.type
            );
            if (name) {
              return (
                `

Check the render method of \`` +
                name +
                '`.'
              );
            }
          }
          return '';
        }
      }
      function getSourceInfoErrorAddendum(source) {
        {
          if (source !== undefined) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, '');
            var lineNumber = source.lineNumber;
            return (
              `

Check your code at ` +
              fileName +
              ':' +
              lineNumber +
              '.'
            );
          }
          return '';
        }
      }
      var ownerHasKeyUseWarning = {};
      function getCurrentComponentErrorInfo(parentType) {
        {
          var info = getDeclarationErrorAddendum();
          if (!info) {
            var parentName =
              typeof parentType === 'string'
                ? parentType
                : parentType.displayName || parentType.name;
            if (parentName) {
              info =
                `

Check the top-level render call using <` +
                parentName +
                '>.';
            }
          }
          return info;
        }
      }
      function validateExplicitKey(element, parentType) {
        {
          if (
            !element._store ||
            element._store.validated ||
            element.key != null
          ) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo =
            getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = '';
          if (
            element &&
            element._owner &&
            element._owner !== ReactCurrentOwner$1.current
          ) {
            childOwner =
              ' It was passed a child from ' +
              getComponentNameFromType(element._owner.type) +
              '.';
          }
          setCurrentlyValidatingElement$1(element);
          error(
            'Each child in a list should have a unique "key" prop.' +
              '%s%s See https://reactjs.org/link/warning-keys for more information.',
            currentComponentErrorInfo,
            childOwner
          );
          setCurrentlyValidatingElement$1(null);
        }
      }
      function validateChildKeys(node, parentType) {
        {
          if (typeof node !== 'object') {
            return;
          }
          if (isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement2(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement2(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === 'function') {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement2(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
      }
      function validatePropTypes(element) {
        {
          var type = element.type;
          if (type === null || type === undefined || typeof type === 'string') {
            return;
          }
          var propTypes;
          if (typeof type === 'function') {
            propTypes = type.propTypes;
          } else if (
            typeof type === 'object' &&
            (type.$$typeof === REACT_FORWARD_REF_TYPE ||
              type.$$typeof === REACT_MEMO_TYPE)
          ) {
            propTypes = type.propTypes;
          } else {
            return;
          }
          if (propTypes) {
            var name = getComponentNameFromType(type);
            checkPropTypes(propTypes, element.props, 'prop', name, element);
          } else if (
            type.PropTypes !== undefined &&
            !propTypesMisspellWarningShown
          ) {
            propTypesMisspellWarningShown = true;
            var _name = getComponentNameFromType(type);
            error(
              'Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?',
              _name || 'Unknown'
            );
          }
          if (
            typeof type.getDefaultProps === 'function' &&
            !type.getDefaultProps.isReactClassApproved
          ) {
            error(
              'getDefaultProps is only used on classic React.createClass ' +
                'definitions. Use a static property named `defaultProps` instead.'
            );
          }
        }
      }
      function validateFragmentProps(fragment) {
        {
          var keys = Object.keys(fragment.props);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key !== 'children' && key !== 'key') {
              setCurrentlyValidatingElement$1(fragment);
              error(
                'Invalid prop `%s` supplied to `React.Fragment`. ' +
                  'React.Fragment can only have `key` and `children` props.',
                key
              );
              setCurrentlyValidatingElement$1(null);
              break;
            }
          }
          if (fragment.ref !== null) {
            setCurrentlyValidatingElement$1(fragment);
            error('Invalid attribute `ref` supplied to `React.Fragment`.');
            setCurrentlyValidatingElement$1(null);
          }
        }
      }
      var didWarnAboutKeySpread = {};
      function jsxWithValidation(
        type,
        props,
        key,
        isStaticChildren,
        source,
        self
      ) {
        {
          var validType = isValidElementType(type);
          if (!validType) {
            var info = '';
            if (
              type === undefined ||
              (typeof type === 'object' &&
                type !== null &&
                Object.keys(type).length === 0)
            ) {
              info +=
                ' You likely forgot to export your component from the file ' +
                "it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendum(source);
            if (sourceInfo) {
              info += sourceInfo;
            } else {
              info += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = 'null';
            } else if (isArray(type)) {
              typeString = 'array';
            } else if (
              type !== undefined &&
              type.$$typeof === REACT_ELEMENT_TYPE
            ) {
              typeString =
                '<' +
                (getComponentNameFromType(type.type) || 'Unknown') +
                ' />';
              info =
                ' Did you accidentally export a JSX literal instead of a component?';
            } else {
              typeString = typeof type;
            }
            error(
              'React.jsx: type is invalid -- expected a string (for ' +
                'built-in components) or a class/function (for composite ' +
                'components) but got: %s.%s',
              typeString,
              info
            );
          }
          var element = jsxDEV(type, props, key, source, self);
          if (element == null) {
            return element;
          }
          if (validType) {
            var children = props.children;
            if (children !== undefined) {
              if (isStaticChildren) {
                if (isArray(children)) {
                  for (var i = 0; i < children.length; i++) {
                    validateChildKeys(children[i], type);
                  }
                  if (Object.freeze) {
                    Object.freeze(children);
                  }
                } else {
                  error(
                    'React.jsx: Static children should always be an array. ' +
                      'You are likely explicitly calling React.jsxs or React.jsxDEV. ' +
                      'Use the Babel transform instead.'
                  );
                }
              } else {
                validateChildKeys(children, type);
              }
            }
          }
          {
            if (hasOwnProperty.call(props, 'key')) {
              var componentName = getComponentNameFromType(type);
              var keys = Object.keys(props).filter(function (k) {
                return k !== 'key';
              });
              var beforeExample =
                keys.length > 0
                  ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}'
                  : '{key: someKey}';
              if (!didWarnAboutKeySpread[componentName + beforeExample]) {
                var afterExample =
                  keys.length > 0
                    ? '{' + keys.join(': ..., ') + ': ...}'
                    : '{}';
                error(
                  `A props object containing a "key" prop is being spread into JSX:
` +
                    `  let props = %s;
` +
                    `  <%s {...props} />
` +
                    `React keys must be passed directly to JSX without using spread:
` +
                    `  let props = %s;
` +
                    '  <%s key={someKey} {...props} />',
                  beforeExample,
                  componentName,
                  afterExample,
                  componentName
                );
                didWarnAboutKeySpread[componentName + beforeExample] = true;
              }
            }
          }
          if (type === REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
      }
      var jsxDEV$1 = jsxWithValidation;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsxDEV = jsxDEV$1;
    })();
  }
});

// node_modules/.bun/react@18.3.1/node_modules/react/jsx-dev-runtime.js
var require_jsx_dev_runtime = __commonJS((exports, module) => {
  if (false) {
  } else {
    module.exports = require_react_jsx_dev_runtime_development();
  }
});

// node_modules/.bun/@radix-ui+react-icons@1.3.2+f4eacebf2041cd4f/node_modules/@radix-ui/react-icons/dist/react-icons.esm.js
var import_react = __toESM(require_react(), 1);
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
var _excluded$g = ['color'];
var ArrowRightIcon = /* @__PURE__ */ import_react.forwardRef(
  function (_ref, forwardedRef) {
    var _ref$color = _ref.color,
      color = _ref$color === undefined ? 'currentColor' : _ref$color,
      props = _objectWithoutPropertiesLoose(_ref, _excluded$g);
    return import_react.createElement(
      'svg',
      Object.assign(
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        props,
        {
          ref: forwardedRef,
        }
      ),
      import_react.createElement('path', {
        d: 'M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z',
        fill: color,
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      })
    );
  }
);

// node_modules/.bun/@radix-ui+react-slot@1.2.4+32264e8fb3466d46/node_modules/@radix-ui/react-slot/dist/index.mjs
var React2 = __toESM(require_react(), 1);

// node_modules/.bun/@radix-ui+react-compose-refs@1.1.2+32264e8fb3466d46/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var React = __toESM(require_react(), 1);
function setRef(ref, value) {
  if (typeof ref === 'function') {
    return ref(value);
  } else if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup == 'function') {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == 'function') {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}

// node_modules/.bun/@radix-ui+react-slot@1.2.4+32264e8fb3466d46/node_modules/@radix-ui/react-slot/dist/index.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var REACT_LAZY_TYPE = Symbol.for('react.lazy');
var use = React2[' use '.trim().toString()];
function isPromiseLike(value) {
  return typeof value === 'object' && value !== null && 'then' in value;
}
function isLazyComponent(element) {
  return (
    element != null &&
    typeof element === 'object' &&
    '$$typeof' in element &&
    element.$$typeof === REACT_LAZY_TYPE &&
    '_payload' in element &&
    isPromiseLike(element._payload)
  );
}
function createSlot(ownerName) {
  const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
  const Slot2 = React2.forwardRef((props, forwardedRef) => {
    let { children, ...slotProps } = props;
    if (isLazyComponent(children) && typeof use === 'function') {
      children = use(children._payload);
    }
    const childrenArray = React2.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React2.Children.count(newElement) > 1)
            return React2.Children.only(null);
          return React2.isValidElement(newElement)
            ? newElement.props.children
            : null;
        } else {
          return child;
        }
      });
      return /* @__PURE__ */ import_jsx_runtime.jsx(SlotClone, {
        ...slotProps,
        ref: forwardedRef,
        children: React2.isValidElement(newElement)
          ? React2.cloneElement(newElement, undefined, newChildren)
          : null,
      });
    }
    return /* @__PURE__ */ import_jsx_runtime.jsx(SlotClone, {
      ...slotProps,
      ref: forwardedRef,
      children,
    });
  });
  Slot2.displayName = `${ownerName}.Slot`;
  return Slot2;
}
var Slot = /* @__PURE__ */ createSlot('Slot');
function createSlotClone(ownerName) {
  const SlotClone = React2.forwardRef((props, forwardedRef) => {
    let { children, ...slotProps } = props;
    if (isLazyComponent(children) && typeof use === 'function') {
      children = use(children._payload);
    }
    if (React2.isValidElement(children)) {
      const childrenRef = getElementRef(children);
      const props2 = mergeProps(slotProps, children.props);
      if (children.type !== React2.Fragment) {
        props2.ref = forwardedRef
          ? composeRefs(forwardedRef, childrenRef)
          : childrenRef;
      }
      return React2.cloneElement(children, props2);
    }
    return React2.Children.count(children) > 1
      ? React2.Children.only(null)
      : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol('radix.slottable');
function isSlottable(child) {
  return (
    React2.isValidElement(child) &&
    typeof child.type === 'function' &&
    '__radixId' in child.type &&
    child.type.__radixId === SLOTTABLE_IDENTIFIER
  );
}
function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          const result = childPropValue(...args);
          slotPropValue(...args);
          return result;
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === 'style') {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === 'className') {
      overrideProps[propName] = [slotPropValue, childPropValue]
        .filter(Boolean)
        .join(' ');
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef(element) {
  let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get;
  let mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get;
  mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}

// node_modules/.bun/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t,
    f,
    n = '';
  if (typeof e == 'string' || typeof e == 'number') n += e;
  else if (typeof e == 'object')
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++)
        e[t] && (f = r(e[t])) && (n && (n += ' '), (n += f));
    } else for (f in e) e[f] && (n && (n += ' '), (n += f));
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = '', o = arguments.length; f < o; f++)
    (e = arguments[f]) && (t = r(e)) && (n && (n += ' '), (n += t));
  return n;
}

// node_modules/.bun/class-variance-authority@0.7.1/node_modules/class-variance-authority/dist/index.mjs
var falsyToString = (value) =>
  typeof value === 'boolean' ? `${value}` : value === 0 ? '0' : value;
var cx = clsx;
var cva = (base, config) => (props) => {
  var _config_compoundVariants;
  if (
    (config === null || config === undefined ? undefined : config.variants) ==
    null
  )
    return cx(
      base,
      props === null || props === undefined ? undefined : props.class,
      props === null || props === undefined ? undefined : props.className
    );
  const { variants, defaultVariants } = config;
  const getVariantClassNames = Object.keys(variants).map((variant) => {
    const variantProp =
      props === null || props === undefined ? undefined : props[variant];
    const defaultVariantProp =
      defaultVariants === null || defaultVariants === undefined
        ? undefined
        : defaultVariants[variant];
    if (variantProp === null) return null;
    const variantKey =
      falsyToString(variantProp) || falsyToString(defaultVariantProp);
    return variants[variant][variantKey];
  });
  const propsWithoutUndefined =
    props &&
    Object.entries(props).reduce((acc, param) => {
      let [key, value] = param;
      if (value === undefined) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});
  const getCompoundVariantClassNames =
    config === null || config === undefined
      ? undefined
      : (_config_compoundVariants = config.compoundVariants) === null ||
          _config_compoundVariants === undefined
        ? undefined
        : _config_compoundVariants.reduce((acc, param) => {
            let {
              class: cvClass,
              className: cvClassName,
              ...compoundVariantOptions
            } = param;
            return Object.entries(compoundVariantOptions).every((param2) => {
              let [key, value] = param2;
              return Array.isArray(value)
                ? value.includes(
                    {
                      ...defaultVariants,
                      ...propsWithoutUndefined,
                    }[key]
                  )
                : {
                    ...defaultVariants,
                    ...propsWithoutUndefined,
                  }[key] === value;
            })
              ? [...acc, cvClass, cvClassName]
              : acc;
          }, []);
  return cx(
    base,
    getVariantClassNames,
    getCompoundVariantClassNames,
    props === null || props === undefined ? undefined : props.class,
    props === null || props === undefined ? undefined : props.className
  );
};

// packages/ui/src/core/button.tsx
var React3 = __toESM(require_react(), 1);

// node_modules/.bun/tailwind-merge@3.4.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs
var concatArrays = (array1, array2) => {
  const combinedArray = new Array(array1.length + array2.length);
  for (let i = 0; i < array1.length; i++) {
    combinedArray[i] = array1[i];
  }
  for (let i = 0; i < array2.length; i++) {
    combinedArray[array1.length + i] = array2[i];
  }
  return combinedArray;
};
var createClassValidatorObject = (classGroupId, validator) => ({
  classGroupId,
  validator,
});
var createClassPartObject = (
  nextPart = new Map(),
  validators = null,
  classGroupId
) => ({
  nextPart,
  validators,
  classGroupId,
});
var CLASS_PART_SEPARATOR = '-';
var EMPTY_CONFLICTS = [];
var ARBITRARY_PROPERTY_PREFIX = 'arbitrary..';
var createClassGroupUtils = (config) => {
  const classMap = createClassMap(config);
  const { conflictingClassGroups, conflictingClassGroupModifiers } = config;
  const getClassGroupId = (className) => {
    if (className.startsWith('[') && className.endsWith(']')) {
      return getGroupIdForArbitraryProperty(className);
    }
    const classParts = className.split(CLASS_PART_SEPARATOR);
    const startIndex = classParts[0] === '' && classParts.length > 1 ? 1 : 0;
    return getGroupRecursive(classParts, startIndex, classMap);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    if (hasPostfixModifier) {
      const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
      const baseConflicts = conflictingClassGroups[classGroupId];
      if (modifierConflicts) {
        if (baseConflicts) {
          return concatArrays(baseConflicts, modifierConflicts);
        }
        return modifierConflicts;
      }
      return baseConflicts || EMPTY_CONFLICTS;
    }
    return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds,
  };
};
var getGroupRecursive = (classParts, startIndex, classPartObject) => {
  const classPathsLength = classParts.length - startIndex;
  if (classPathsLength === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[startIndex];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  if (nextClassPartObject) {
    const result = getGroupRecursive(
      classParts,
      startIndex + 1,
      nextClassPartObject
    );
    if (result) return result;
  }
  const validators = classPartObject.validators;
  if (validators === null) {
    return;
  }
  const classRest =
    startIndex === 0
      ? classParts.join(CLASS_PART_SEPARATOR)
      : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
  const validatorsLength = validators.length;
  for (let i = 0; i < validatorsLength; i++) {
    const validatorObj = validators[i];
    if (validatorObj.validator(classRest)) {
      return validatorObj.classGroupId;
    }
  }
  return;
};
var getGroupIdForArbitraryProperty = (className) =>
  className.slice(1, -1).indexOf(':') === -1
    ? undefined
    : (() => {
        const content = className.slice(1, -1);
        const colonIndex = content.indexOf(':');
        const property = content.slice(0, colonIndex);
        return property ? ARBITRARY_PROPERTY_PREFIX + property : undefined;
      })();
var createClassMap = (config) => {
  const { theme, classGroups } = config;
  return processClassGroups(classGroups, theme);
};
var processClassGroups = (classGroups, theme) => {
  const classMap = createClassPartObject();
  for (const classGroupId in classGroups) {
    const group = classGroups[classGroupId];
    processClassesRecursively(group, classMap, classGroupId, theme);
  }
  return classMap;
};
var processClassesRecursively = (
  classGroup,
  classPartObject,
  classGroupId,
  theme
) => {
  const len = classGroup.length;
  for (let i = 0; i < len; i++) {
    const classDefinition = classGroup[i];
    processClassDefinition(
      classDefinition,
      classPartObject,
      classGroupId,
      theme
    );
  }
};
var processClassDefinition = (
  classDefinition,
  classPartObject,
  classGroupId,
  theme
) => {
  if (typeof classDefinition === 'string') {
    processStringDefinition(classDefinition, classPartObject, classGroupId);
    return;
  }
  if (typeof classDefinition === 'function') {
    processFunctionDefinition(
      classDefinition,
      classPartObject,
      classGroupId,
      theme
    );
    return;
  }
  processObjectDefinition(
    classDefinition,
    classPartObject,
    classGroupId,
    theme
  );
};
var processStringDefinition = (
  classDefinition,
  classPartObject,
  classGroupId
) => {
  const classPartObjectToEdit =
    classDefinition === ''
      ? classPartObject
      : getPart(classPartObject, classDefinition);
  classPartObjectToEdit.classGroupId = classGroupId;
};
var processFunctionDefinition = (
  classDefinition,
  classPartObject,
  classGroupId,
  theme
) => {
  if (isThemeGetter(classDefinition)) {
    processClassesRecursively(
      classDefinition(theme),
      classPartObject,
      classGroupId,
      theme
    );
    return;
  }
  if (classPartObject.validators === null) {
    classPartObject.validators = [];
  }
  classPartObject.validators.push(
    createClassValidatorObject(classGroupId, classDefinition)
  );
};
var processObjectDefinition = (
  classDefinition,
  classPartObject,
  classGroupId,
  theme
) => {
  const entries = Object.entries(classDefinition);
  const len = entries.length;
  for (let i = 0; i < len; i++) {
    const [key, value] = entries[i];
    processClassesRecursively(
      value,
      getPart(classPartObject, key),
      classGroupId,
      theme
    );
  }
};
var getPart = (classPartObject, path) => {
  let current = classPartObject;
  const parts = path.split(CLASS_PART_SEPARATOR);
  const len = parts.length;
  for (let i = 0; i < len; i++) {
    const part = parts[i];
    let next = current.nextPart.get(part);
    if (!next) {
      next = createClassPartObject();
      current.nextPart.set(part, next);
    }
    current = next;
  }
  return current;
};
var isThemeGetter = (func) =>
  'isThemeGetter' in func && func.isThemeGetter === true;
var createLruCache = (maxCacheSize) => {
  if (maxCacheSize < 1) {
    return {
      get: () => {
        return;
      },
      set: () => {},
    };
  }
  let cacheSize = 0;
  let cache = Object.create(null);
  let previousCache = Object.create(null);
  const update = (key, value) => {
    cache[key] = value;
    cacheSize++;
    if (cacheSize > maxCacheSize) {
      cacheSize = 0;
      previousCache = cache;
      cache = Object.create(null);
    }
  };
  return {
    get(key) {
      let value = cache[key];
      if (value !== undefined) {
        return value;
      }
      if ((value = previousCache[key]) !== undefined) {
        update(key, value);
        return value;
      }
    },
    set(key, value) {
      if (key in cache) {
        cache[key] = value;
      } else {
        update(key, value);
      }
    },
  };
};
var IMPORTANT_MODIFIER = '!';
var MODIFIER_SEPARATOR = ':';
var EMPTY_MODIFIERS = [];
var createResultObject = (
  modifiers,
  hasImportantModifier,
  baseClassName,
  maybePostfixModifierPosition,
  isExternal
) => ({
  modifiers,
  hasImportantModifier,
  baseClassName,
  maybePostfixModifierPosition,
  isExternal,
});
var createParseClassName = (config) => {
  const { prefix, experimentalParseClassName } = config;
  let parseClassName = (className) => {
    const modifiers = [];
    let bracketDepth = 0;
    let parenDepth = 0;
    let modifierStart = 0;
    let postfixModifierPosition;
    const len = className.length;
    for (let index = 0; index < len; index++) {
      const currentCharacter = className[index];
      if (bracketDepth === 0 && parenDepth === 0) {
        if (currentCharacter === MODIFIER_SEPARATOR) {
          modifiers.push(className.slice(modifierStart, index));
          modifierStart = index + 1;
          continue;
        }
        if (currentCharacter === '/') {
          postfixModifierPosition = index;
          continue;
        }
      }
      if (currentCharacter === '[') bracketDepth++;
      else if (currentCharacter === ']') bracketDepth--;
      else if (currentCharacter === '(') parenDepth++;
      else if (currentCharacter === ')') parenDepth--;
    }
    const baseClassNameWithImportantModifier =
      modifiers.length === 0 ? className : className.slice(modifierStart);
    let baseClassName = baseClassNameWithImportantModifier;
    let hasImportantModifier = false;
    if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER)) {
      baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
      hasImportantModifier = true;
    } else if (
      baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER)
    ) {
      baseClassName = baseClassNameWithImportantModifier.slice(1);
      hasImportantModifier = true;
    }
    const maybePostfixModifierPosition =
      postfixModifierPosition && postfixModifierPosition > modifierStart
        ? postfixModifierPosition - modifierStart
        : undefined;
    return createResultObject(
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    );
  };
  if (prefix) {
    const fullPrefix = prefix + MODIFIER_SEPARATOR;
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) =>
      className.startsWith(fullPrefix)
        ? parseClassNameOriginal(className.slice(fullPrefix.length))
        : createResultObject(
            EMPTY_MODIFIERS,
            false,
            className,
            undefined,
            true
          );
  }
  if (experimentalParseClassName) {
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) =>
      experimentalParseClassName({
        className,
        parseClassName: parseClassNameOriginal,
      });
  }
  return parseClassName;
};
var createSortModifiers = (config) => {
  const modifierWeights = new Map();
  config.orderSensitiveModifiers.forEach((mod, index) => {
    modifierWeights.set(mod, 1e6 + index);
  });
  return (modifiers) => {
    const result = [];
    let currentSegment = [];
    for (let i = 0; i < modifiers.length; i++) {
      const modifier = modifiers[i];
      const isArbitrary = modifier[0] === '[';
      const isOrderSensitive = modifierWeights.has(modifier);
      if (isArbitrary || isOrderSensitive) {
        if (currentSegment.length > 0) {
          currentSegment.sort();
          result.push(...currentSegment);
          currentSegment = [];
        }
        result.push(modifier);
      } else {
        currentSegment.push(modifier);
      }
    }
    if (currentSegment.length > 0) {
      currentSegment.sort();
      result.push(...currentSegment);
    }
    return result;
  };
};
var createConfigUtils = (config) => ({
  cache: createLruCache(config.cacheSize),
  parseClassName: createParseClassName(config),
  sortModifiers: createSortModifiers(config),
  ...createClassGroupUtils(config),
});
var SPLIT_CLASSES_REGEX = /\s+/;
var mergeClassList = (classList, configUtils) => {
  const {
    parseClassName,
    getClassGroupId,
    getConflictingClassGroupIds,
    sortModifiers,
  } = configUtils;
  const classGroupsInConflict = [];
  const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
  let result = '';
  for (let index = classNames.length - 1; index >= 0; index -= 1) {
    const originalClassName = classNames[index];
    const {
      isExternal,
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition,
    } = parseClassName(originalClassName);
    if (isExternal) {
      result = originalClassName + (result.length > 0 ? ' ' + result : result);
      continue;
    }
    let hasPostfixModifier = !!maybePostfixModifierPosition;
    let classGroupId = getClassGroupId(
      hasPostfixModifier
        ? baseClassName.substring(0, maybePostfixModifierPosition)
        : baseClassName
    );
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        result =
          originalClassName + (result.length > 0 ? ' ' + result : result);
        continue;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        result =
          originalClassName + (result.length > 0 ? ' ' + result : result);
        continue;
      }
      hasPostfixModifier = false;
    }
    const variantModifier =
      modifiers.length === 0
        ? ''
        : modifiers.length === 1
          ? modifiers[0]
          : sortModifiers(modifiers).join(':');
    const modifierId = hasImportantModifier
      ? variantModifier + IMPORTANT_MODIFIER
      : variantModifier;
    const classId = modifierId + classGroupId;
    if (classGroupsInConflict.indexOf(classId) > -1) {
      continue;
    }
    classGroupsInConflict.push(classId);
    const conflictGroups = getConflictingClassGroupIds(
      classGroupId,
      hasPostfixModifier
    );
    for (let i = 0; i < conflictGroups.length; ++i) {
      const group = conflictGroups[i];
      classGroupsInConflict.push(modifierId + group);
    }
    result = originalClassName + (result.length > 0 ? ' ' + result : result);
  }
  return result;
};
var twJoin = (...classLists) => {
  let index = 0;
  let argument;
  let resolvedValue;
  let string = '';
  while (index < classLists.length) {
    if ((argument = classLists[index++])) {
      if ((resolvedValue = toValue(argument))) {
        string && (string += ' ');
        string += resolvedValue;
      }
    }
  }
  return string;
};
var toValue = (mix) => {
  if (typeof mix === 'string') {
    return mix;
  }
  let resolvedValue;
  let string = '';
  for (let k = 0; k < mix.length; k++) {
    if (mix[k]) {
      if ((resolvedValue = toValue(mix[k]))) {
        string && (string += ' ');
        string += resolvedValue;
      }
    }
  }
  return string;
};
var createTailwindMerge = (createConfigFirst, ...createConfigRest) => {
  let configUtils;
  let cacheGet;
  let cacheSet;
  let functionToCall;
  const initTailwindMerge = (classList) => {
    const config = createConfigRest.reduce(
      (previousConfig, createConfigCurrent) =>
        createConfigCurrent(previousConfig),
      createConfigFirst()
    );
    configUtils = createConfigUtils(config);
    cacheGet = configUtils.cache.get;
    cacheSet = configUtils.cache.set;
    functionToCall = tailwindMerge;
    return tailwindMerge(classList);
  };
  const tailwindMerge = (classList) => {
    const cachedResult = cacheGet(classList);
    if (cachedResult) {
      return cachedResult;
    }
    const result = mergeClassList(classList, configUtils);
    cacheSet(classList, result);
    return result;
  };
  functionToCall = initTailwindMerge;
  return (...args) => functionToCall(twJoin(...args));
};
var fallbackThemeArr = [];
var fromTheme = (key) => {
  const themeGetter = (theme) => theme[key] || fallbackThemeArr;
  themeGetter.isThemeGetter = true;
  return themeGetter;
};
var arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
var arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
var fractionRegex = /^\d+\/\d+$/;
var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex =
  /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
var shadowRegex =
  /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex =
  /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var isFraction = (value) => fractionRegex.test(value);
var isNumber = (value) => !!value && !Number.isNaN(Number(value));
var isInteger = (value) => !!value && Number.isInteger(Number(value));
var isPercent = (value) => value.endsWith('%') && isNumber(value.slice(0, -1));
var isTshirtSize = (value) => tshirtUnitRegex.test(value);
var isAny = () => true;
var isLengthOnly = (value) =>
  lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
var isNever = () => false;
var isShadow = (value) => shadowRegex.test(value);
var isImage = (value) => imageRegex.test(value);
var isAnyNonArbitrary = (value) =>
  !isArbitraryValue(value) && !isArbitraryVariable(value);
var isArbitrarySize = (value) =>
  getIsArbitraryValue(value, isLabelSize, isNever);
var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
var isArbitraryLength = (value) =>
  getIsArbitraryValue(value, isLabelLength, isLengthOnly);
var isArbitraryNumber = (value) =>
  getIsArbitraryValue(value, isLabelNumber, isNumber);
var isArbitraryPosition = (value) =>
  getIsArbitraryValue(value, isLabelPosition, isNever);
var isArbitraryImage = (value) =>
  getIsArbitraryValue(value, isLabelImage, isImage);
var isArbitraryShadow = (value) =>
  getIsArbitraryValue(value, isLabelShadow, isShadow);
var isArbitraryVariable = (value) => arbitraryVariableRegex.test(value);
var isArbitraryVariableLength = (value) =>
  getIsArbitraryVariable(value, isLabelLength);
var isArbitraryVariableFamilyName = (value) =>
  getIsArbitraryVariable(value, isLabelFamilyName);
var isArbitraryVariablePosition = (value) =>
  getIsArbitraryVariable(value, isLabelPosition);
var isArbitraryVariableSize = (value) =>
  getIsArbitraryVariable(value, isLabelSize);
var isArbitraryVariableImage = (value) =>
  getIsArbitraryVariable(value, isLabelImage);
var isArbitraryVariableShadow = (value) =>
  getIsArbitraryVariable(value, isLabelShadow, true);
var getIsArbitraryValue = (value, testLabel, testValue) => {
  const result = arbitraryValueRegex.exec(value);
  if (result) {
    if (result[1]) {
      return testLabel(result[1]);
    }
    return testValue(result[2]);
  }
  return false;
};
var getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
  const result = arbitraryVariableRegex.exec(value);
  if (result) {
    if (result[1]) {
      return testLabel(result[1]);
    }
    return shouldMatchNoLabel;
  }
  return false;
};
var isLabelPosition = (label) => label === 'position' || label === 'percentage';
var isLabelImage = (label) => label === 'image' || label === 'url';
var isLabelSize = (label) =>
  label === 'length' || label === 'size' || label === 'bg-size';
var isLabelLength = (label) => label === 'length';
var isLabelNumber = (label) => label === 'number';
var isLabelFamilyName = (label) => label === 'family-name';
var isLabelShadow = (label) => label === 'shadow';
var getDefaultConfig = () => {
  const themeColor = fromTheme('color');
  const themeFont = fromTheme('font');
  const themeText = fromTheme('text');
  const themeFontWeight = fromTheme('font-weight');
  const themeTracking = fromTheme('tracking');
  const themeLeading = fromTheme('leading');
  const themeBreakpoint = fromTheme('breakpoint');
  const themeContainer = fromTheme('container');
  const themeSpacing = fromTheme('spacing');
  const themeRadius = fromTheme('radius');
  const themeShadow = fromTheme('shadow');
  const themeInsetShadow = fromTheme('inset-shadow');
  const themeTextShadow = fromTheme('text-shadow');
  const themeDropShadow = fromTheme('drop-shadow');
  const themeBlur = fromTheme('blur');
  const themePerspective = fromTheme('perspective');
  const themeAspect = fromTheme('aspect');
  const themeEase = fromTheme('ease');
  const themeAnimate = fromTheme('animate');
  const scaleBreak = () => [
    'auto',
    'avoid',
    'all',
    'avoid-page',
    'page',
    'left',
    'right',
    'column',
  ];
  const scalePosition = () => [
    'center',
    'top',
    'bottom',
    'left',
    'right',
    'top-left',
    'left-top',
    'top-right',
    'right-top',
    'bottom-right',
    'right-bottom',
    'bottom-left',
    'left-bottom',
  ];
  const scalePositionWithArbitrary = () => [
    ...scalePosition(),
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleOverflow = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'];
  const scaleOverscroll = () => ['auto', 'contain', 'none'];
  const scaleUnambiguousSpacing = () => [
    isArbitraryVariable,
    isArbitraryValue,
    themeSpacing,
  ];
  const scaleInset = () => [
    isFraction,
    'full',
    'auto',
    ...scaleUnambiguousSpacing(),
  ];
  const scaleGridTemplateColsRows = () => [
    isInteger,
    'none',
    'subgrid',
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleGridColRowStartAndEnd = () => [
    'auto',
    {
      span: ['full', isInteger, isArbitraryVariable, isArbitraryValue],
    },
    isInteger,
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleGridColRowStartOrEnd = () => [
    isInteger,
    'auto',
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleGridAutoColsRows = () => [
    'auto',
    'min',
    'max',
    'fr',
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleAlignPrimaryAxis = () => [
    'start',
    'end',
    'center',
    'between',
    'around',
    'evenly',
    'stretch',
    'baseline',
    'center-safe',
    'end-safe',
  ];
  const scaleAlignSecondaryAxis = () => [
    'start',
    'end',
    'center',
    'stretch',
    'center-safe',
    'end-safe',
  ];
  const scaleMargin = () => ['auto', ...scaleUnambiguousSpacing()];
  const scaleSizing = () => [
    isFraction,
    'auto',
    'full',
    'dvw',
    'dvh',
    'lvw',
    'lvh',
    'svw',
    'svh',
    'min',
    'max',
    'fit',
    ...scaleUnambiguousSpacing(),
  ];
  const scaleColor = () => [themeColor, isArbitraryVariable, isArbitraryValue];
  const scaleBgPosition = () => [
    ...scalePosition(),
    isArbitraryVariablePosition,
    isArbitraryPosition,
    {
      position: [isArbitraryVariable, isArbitraryValue],
    },
  ];
  const scaleBgRepeat = () => [
    'no-repeat',
    {
      repeat: ['', 'x', 'y', 'space', 'round'],
    },
  ];
  const scaleBgSize = () => [
    'auto',
    'cover',
    'contain',
    isArbitraryVariableSize,
    isArbitrarySize,
    {
      size: [isArbitraryVariable, isArbitraryValue],
    },
  ];
  const scaleGradientStopPosition = () => [
    isPercent,
    isArbitraryVariableLength,
    isArbitraryLength,
  ];
  const scaleRadius = () => [
    '',
    'none',
    'full',
    themeRadius,
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleBorderWidth = () => [
    '',
    isNumber,
    isArbitraryVariableLength,
    isArbitraryLength,
  ];
  const scaleLineStyle = () => ['solid', 'dashed', 'dotted', 'double'];
  const scaleBlendMode = () => [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
  ];
  const scaleMaskImagePosition = () => [
    isNumber,
    isPercent,
    isArbitraryVariablePosition,
    isArbitraryPosition,
  ];
  const scaleBlur = () => [
    '',
    'none',
    themeBlur,
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleRotate = () => [
    'none',
    isNumber,
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleScale = () => [
    'none',
    isNumber,
    isArbitraryVariable,
    isArbitraryValue,
  ];
  const scaleSkew = () => [isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleTranslate = () => [
    isFraction,
    'full',
    ...scaleUnambiguousSpacing(),
  ];
  return {
    cacheSize: 500,
    theme: {
      animate: ['spin', 'ping', 'pulse', 'bounce'],
      aspect: ['video'],
      blur: [isTshirtSize],
      breakpoint: [isTshirtSize],
      color: [isAny],
      container: [isTshirtSize],
      'drop-shadow': [isTshirtSize],
      ease: ['in', 'out', 'in-out'],
      font: [isAnyNonArbitrary],
      'font-weight': [
        'thin',
        'extralight',
        'light',
        'normal',
        'medium',
        'semibold',
        'bold',
        'extrabold',
        'black',
      ],
      'inset-shadow': [isTshirtSize],
      leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
      perspective: [
        'dramatic',
        'near',
        'normal',
        'midrange',
        'distant',
        'none',
      ],
      radius: [isTshirtSize],
      shadow: [isTshirtSize],
      spacing: ['px', isNumber],
      text: [isTshirtSize],
      'text-shadow': [isTshirtSize],
      tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'],
    },
    classGroups: {
      aspect: [
        {
          aspect: [
            'auto',
            'square',
            isFraction,
            isArbitraryValue,
            isArbitraryVariable,
            themeAspect,
          ],
        },
      ],
      container: ['container'],
      columns: [
        {
          columns: [
            isNumber,
            isArbitraryValue,
            isArbitraryVariable,
            themeContainer,
          ],
        },
      ],
      'break-after': [
        {
          'break-after': scaleBreak(),
        },
      ],
      'break-before': [
        {
          'break-before': scaleBreak(),
        },
      ],
      'break-inside': [
        {
          'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'],
        },
      ],
      'box-decoration': [
        {
          'box-decoration': ['slice', 'clone'],
        },
      ],
      box: [
        {
          box: ['border', 'content'],
        },
      ],
      display: [
        'block',
        'inline-block',
        'inline',
        'flex',
        'inline-flex',
        'table',
        'inline-table',
        'table-caption',
        'table-cell',
        'table-column',
        'table-column-group',
        'table-footer-group',
        'table-header-group',
        'table-row-group',
        'table-row',
        'flow-root',
        'grid',
        'inline-grid',
        'contents',
        'list-item',
        'hidden',
      ],
      sr: ['sr-only', 'not-sr-only'],
      float: [
        {
          float: ['right', 'left', 'none', 'start', 'end'],
        },
      ],
      clear: [
        {
          clear: ['left', 'right', 'both', 'none', 'start', 'end'],
        },
      ],
      isolation: ['isolate', 'isolation-auto'],
      'object-fit': [
        {
          object: ['contain', 'cover', 'fill', 'none', 'scale-down'],
        },
      ],
      'object-position': [
        {
          object: scalePositionWithArbitrary(),
        },
      ],
      overflow: [
        {
          overflow: scaleOverflow(),
        },
      ],
      'overflow-x': [
        {
          'overflow-x': scaleOverflow(),
        },
      ],
      'overflow-y': [
        {
          'overflow-y': scaleOverflow(),
        },
      ],
      overscroll: [
        {
          overscroll: scaleOverscroll(),
        },
      ],
      'overscroll-x': [
        {
          'overscroll-x': scaleOverscroll(),
        },
      ],
      'overscroll-y': [
        {
          'overscroll-y': scaleOverscroll(),
        },
      ],
      position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
      inset: [
        {
          inset: scaleInset(),
        },
      ],
      'inset-x': [
        {
          'inset-x': scaleInset(),
        },
      ],
      'inset-y': [
        {
          'inset-y': scaleInset(),
        },
      ],
      start: [
        {
          start: scaleInset(),
        },
      ],
      end: [
        {
          end: scaleInset(),
        },
      ],
      top: [
        {
          top: scaleInset(),
        },
      ],
      right: [
        {
          right: scaleInset(),
        },
      ],
      bottom: [
        {
          bottom: scaleInset(),
        },
      ],
      left: [
        {
          left: scaleInset(),
        },
      ],
      visibility: ['visible', 'invisible', 'collapse'],
      z: [
        {
          z: [isInteger, 'auto', isArbitraryVariable, isArbitraryValue],
        },
      ],
      basis: [
        {
          basis: [
            isFraction,
            'full',
            'auto',
            themeContainer,
            ...scaleUnambiguousSpacing(),
          ],
        },
      ],
      'flex-direction': [
        {
          flex: ['row', 'row-reverse', 'col', 'col-reverse'],
        },
      ],
      'flex-wrap': [
        {
          flex: ['nowrap', 'wrap', 'wrap-reverse'],
        },
      ],
      flex: [
        {
          flex: [
            isNumber,
            isFraction,
            'auto',
            'initial',
            'none',
            isArbitraryValue,
          ],
        },
      ],
      grow: [
        {
          grow: ['', isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      shrink: [
        {
          shrink: ['', isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      order: [
        {
          order: [
            isInteger,
            'first',
            'last',
            'none',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'grid-cols': [
        {
          'grid-cols': scaleGridTemplateColsRows(),
        },
      ],
      'col-start-end': [
        {
          col: scaleGridColRowStartAndEnd(),
        },
      ],
      'col-start': [
        {
          'col-start': scaleGridColRowStartOrEnd(),
        },
      ],
      'col-end': [
        {
          'col-end': scaleGridColRowStartOrEnd(),
        },
      ],
      'grid-rows': [
        {
          'grid-rows': scaleGridTemplateColsRows(),
        },
      ],
      'row-start-end': [
        {
          row: scaleGridColRowStartAndEnd(),
        },
      ],
      'row-start': [
        {
          'row-start': scaleGridColRowStartOrEnd(),
        },
      ],
      'row-end': [
        {
          'row-end': scaleGridColRowStartOrEnd(),
        },
      ],
      'grid-flow': [
        {
          'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'],
        },
      ],
      'auto-cols': [
        {
          'auto-cols': scaleGridAutoColsRows(),
        },
      ],
      'auto-rows': [
        {
          'auto-rows': scaleGridAutoColsRows(),
        },
      ],
      gap: [
        {
          gap: scaleUnambiguousSpacing(),
        },
      ],
      'gap-x': [
        {
          'gap-x': scaleUnambiguousSpacing(),
        },
      ],
      'gap-y': [
        {
          'gap-y': scaleUnambiguousSpacing(),
        },
      ],
      'justify-content': [
        {
          justify: [...scaleAlignPrimaryAxis(), 'normal'],
        },
      ],
      'justify-items': [
        {
          'justify-items': [...scaleAlignSecondaryAxis(), 'normal'],
        },
      ],
      'justify-self': [
        {
          'justify-self': ['auto', ...scaleAlignSecondaryAxis()],
        },
      ],
      'align-content': [
        {
          content: ['normal', ...scaleAlignPrimaryAxis()],
        },
      ],
      'align-items': [
        {
          items: [
            ...scaleAlignSecondaryAxis(),
            {
              baseline: ['', 'last'],
            },
          ],
        },
      ],
      'align-self': [
        {
          self: [
            'auto',
            ...scaleAlignSecondaryAxis(),
            {
              baseline: ['', 'last'],
            },
          ],
        },
      ],
      'place-content': [
        {
          'place-content': scaleAlignPrimaryAxis(),
        },
      ],
      'place-items': [
        {
          'place-items': [...scaleAlignSecondaryAxis(), 'baseline'],
        },
      ],
      'place-self': [
        {
          'place-self': ['auto', ...scaleAlignSecondaryAxis()],
        },
      ],
      p: [
        {
          p: scaleUnambiguousSpacing(),
        },
      ],
      px: [
        {
          px: scaleUnambiguousSpacing(),
        },
      ],
      py: [
        {
          py: scaleUnambiguousSpacing(),
        },
      ],
      ps: [
        {
          ps: scaleUnambiguousSpacing(),
        },
      ],
      pe: [
        {
          pe: scaleUnambiguousSpacing(),
        },
      ],
      pt: [
        {
          pt: scaleUnambiguousSpacing(),
        },
      ],
      pr: [
        {
          pr: scaleUnambiguousSpacing(),
        },
      ],
      pb: [
        {
          pb: scaleUnambiguousSpacing(),
        },
      ],
      pl: [
        {
          pl: scaleUnambiguousSpacing(),
        },
      ],
      m: [
        {
          m: scaleMargin(),
        },
      ],
      mx: [
        {
          mx: scaleMargin(),
        },
      ],
      my: [
        {
          my: scaleMargin(),
        },
      ],
      ms: [
        {
          ms: scaleMargin(),
        },
      ],
      me: [
        {
          me: scaleMargin(),
        },
      ],
      mt: [
        {
          mt: scaleMargin(),
        },
      ],
      mr: [
        {
          mr: scaleMargin(),
        },
      ],
      mb: [
        {
          mb: scaleMargin(),
        },
      ],
      ml: [
        {
          ml: scaleMargin(),
        },
      ],
      'space-x': [
        {
          'space-x': scaleUnambiguousSpacing(),
        },
      ],
      'space-x-reverse': ['space-x-reverse'],
      'space-y': [
        {
          'space-y': scaleUnambiguousSpacing(),
        },
      ],
      'space-y-reverse': ['space-y-reverse'],
      size: [
        {
          size: scaleSizing(),
        },
      ],
      w: [
        {
          w: [themeContainer, 'screen', ...scaleSizing()],
        },
      ],
      'min-w': [
        {
          'min-w': [themeContainer, 'screen', 'none', ...scaleSizing()],
        },
      ],
      'max-w': [
        {
          'max-w': [
            themeContainer,
            'screen',
            'none',
            'prose',
            {
              screen: [themeBreakpoint],
            },
            ...scaleSizing(),
          ],
        },
      ],
      h: [
        {
          h: ['screen', 'lh', ...scaleSizing()],
        },
      ],
      'min-h': [
        {
          'min-h': ['screen', 'lh', 'none', ...scaleSizing()],
        },
      ],
      'max-h': [
        {
          'max-h': ['screen', 'lh', ...scaleSizing()],
        },
      ],
      'font-size': [
        {
          text: [
            'base',
            themeText,
            isArbitraryVariableLength,
            isArbitraryLength,
          ],
        },
      ],
      'font-smoothing': ['antialiased', 'subpixel-antialiased'],
      'font-style': ['italic', 'not-italic'],
      'font-weight': [
        {
          font: [themeFontWeight, isArbitraryVariable, isArbitraryNumber],
        },
      ],
      'font-stretch': [
        {
          'font-stretch': [
            'ultra-condensed',
            'extra-condensed',
            'condensed',
            'semi-condensed',
            'normal',
            'semi-expanded',
            'expanded',
            'extra-expanded',
            'ultra-expanded',
            isPercent,
            isArbitraryValue,
          ],
        },
      ],
      'font-family': [
        {
          font: [isArbitraryVariableFamilyName, isArbitraryValue, themeFont],
        },
      ],
      'fvn-normal': ['normal-nums'],
      'fvn-ordinal': ['ordinal'],
      'fvn-slashed-zero': ['slashed-zero'],
      'fvn-figure': ['lining-nums', 'oldstyle-nums'],
      'fvn-spacing': ['proportional-nums', 'tabular-nums'],
      'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
      tracking: [
        {
          tracking: [themeTracking, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'line-clamp': [
        {
          'line-clamp': [
            isNumber,
            'none',
            isArbitraryVariable,
            isArbitraryNumber,
          ],
        },
      ],
      leading: [
        {
          leading: [themeLeading, ...scaleUnambiguousSpacing()],
        },
      ],
      'list-image': [
        {
          'list-image': ['none', isArbitraryVariable, isArbitraryValue],
        },
      ],
      'list-style-position': [
        {
          list: ['inside', 'outside'],
        },
      ],
      'list-style-type': [
        {
          list: [
            'disc',
            'decimal',
            'none',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'text-alignment': [
        {
          text: ['left', 'center', 'right', 'justify', 'start', 'end'],
        },
      ],
      'placeholder-color': [
        {
          placeholder: scaleColor(),
        },
      ],
      'text-color': [
        {
          text: scaleColor(),
        },
      ],
      'text-decoration': [
        'underline',
        'overline',
        'line-through',
        'no-underline',
      ],
      'text-decoration-style': [
        {
          decoration: [...scaleLineStyle(), 'wavy'],
        },
      ],
      'text-decoration-thickness': [
        {
          decoration: [
            isNumber,
            'from-font',
            'auto',
            isArbitraryVariable,
            isArbitraryLength,
          ],
        },
      ],
      'text-decoration-color': [
        {
          decoration: scaleColor(),
        },
      ],
      'underline-offset': [
        {
          'underline-offset': [
            isNumber,
            'auto',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
      'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
      'text-wrap': [
        {
          text: ['wrap', 'nowrap', 'balance', 'pretty'],
        },
      ],
      indent: [
        {
          indent: scaleUnambiguousSpacing(),
        },
      ],
      'vertical-align': [
        {
          align: [
            'baseline',
            'top',
            'middle',
            'bottom',
            'text-top',
            'text-bottom',
            'sub',
            'super',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      whitespace: [
        {
          whitespace: [
            'normal',
            'nowrap',
            'pre',
            'pre-line',
            'pre-wrap',
            'break-spaces',
          ],
        },
      ],
      break: [
        {
          break: ['normal', 'words', 'all', 'keep'],
        },
      ],
      wrap: [
        {
          wrap: ['break-word', 'anywhere', 'normal'],
        },
      ],
      hyphens: [
        {
          hyphens: ['none', 'manual', 'auto'],
        },
      ],
      content: [
        {
          content: ['none', isArbitraryVariable, isArbitraryValue],
        },
      ],
      'bg-attachment': [
        {
          bg: ['fixed', 'local', 'scroll'],
        },
      ],
      'bg-clip': [
        {
          'bg-clip': ['border', 'padding', 'content', 'text'],
        },
      ],
      'bg-origin': [
        {
          'bg-origin': ['border', 'padding', 'content'],
        },
      ],
      'bg-position': [
        {
          bg: scaleBgPosition(),
        },
      ],
      'bg-repeat': [
        {
          bg: scaleBgRepeat(),
        },
      ],
      'bg-size': [
        {
          bg: scaleBgSize(),
        },
      ],
      'bg-image': [
        {
          bg: [
            'none',
            {
              linear: [
                {
                  to: ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'],
                },
                isInteger,
                isArbitraryVariable,
                isArbitraryValue,
              ],
              radial: ['', isArbitraryVariable, isArbitraryValue],
              conic: [isInteger, isArbitraryVariable, isArbitraryValue],
            },
            isArbitraryVariableImage,
            isArbitraryImage,
          ],
        },
      ],
      'bg-color': [
        {
          bg: scaleColor(),
        },
      ],
      'gradient-from-pos': [
        {
          from: scaleGradientStopPosition(),
        },
      ],
      'gradient-via-pos': [
        {
          via: scaleGradientStopPosition(),
        },
      ],
      'gradient-to-pos': [
        {
          to: scaleGradientStopPosition(),
        },
      ],
      'gradient-from': [
        {
          from: scaleColor(),
        },
      ],
      'gradient-via': [
        {
          via: scaleColor(),
        },
      ],
      'gradient-to': [
        {
          to: scaleColor(),
        },
      ],
      rounded: [
        {
          rounded: scaleRadius(),
        },
      ],
      'rounded-s': [
        {
          'rounded-s': scaleRadius(),
        },
      ],
      'rounded-e': [
        {
          'rounded-e': scaleRadius(),
        },
      ],
      'rounded-t': [
        {
          'rounded-t': scaleRadius(),
        },
      ],
      'rounded-r': [
        {
          'rounded-r': scaleRadius(),
        },
      ],
      'rounded-b': [
        {
          'rounded-b': scaleRadius(),
        },
      ],
      'rounded-l': [
        {
          'rounded-l': scaleRadius(),
        },
      ],
      'rounded-ss': [
        {
          'rounded-ss': scaleRadius(),
        },
      ],
      'rounded-se': [
        {
          'rounded-se': scaleRadius(),
        },
      ],
      'rounded-ee': [
        {
          'rounded-ee': scaleRadius(),
        },
      ],
      'rounded-es': [
        {
          'rounded-es': scaleRadius(),
        },
      ],
      'rounded-tl': [
        {
          'rounded-tl': scaleRadius(),
        },
      ],
      'rounded-tr': [
        {
          'rounded-tr': scaleRadius(),
        },
      ],
      'rounded-br': [
        {
          'rounded-br': scaleRadius(),
        },
      ],
      'rounded-bl': [
        {
          'rounded-bl': scaleRadius(),
        },
      ],
      'border-w': [
        {
          border: scaleBorderWidth(),
        },
      ],
      'border-w-x': [
        {
          'border-x': scaleBorderWidth(),
        },
      ],
      'border-w-y': [
        {
          'border-y': scaleBorderWidth(),
        },
      ],
      'border-w-s': [
        {
          'border-s': scaleBorderWidth(),
        },
      ],
      'border-w-e': [
        {
          'border-e': scaleBorderWidth(),
        },
      ],
      'border-w-t': [
        {
          'border-t': scaleBorderWidth(),
        },
      ],
      'border-w-r': [
        {
          'border-r': scaleBorderWidth(),
        },
      ],
      'border-w-b': [
        {
          'border-b': scaleBorderWidth(),
        },
      ],
      'border-w-l': [
        {
          'border-l': scaleBorderWidth(),
        },
      ],
      'divide-x': [
        {
          'divide-x': scaleBorderWidth(),
        },
      ],
      'divide-x-reverse': ['divide-x-reverse'],
      'divide-y': [
        {
          'divide-y': scaleBorderWidth(),
        },
      ],
      'divide-y-reverse': ['divide-y-reverse'],
      'border-style': [
        {
          border: [...scaleLineStyle(), 'hidden', 'none'],
        },
      ],
      'divide-style': [
        {
          divide: [...scaleLineStyle(), 'hidden', 'none'],
        },
      ],
      'border-color': [
        {
          border: scaleColor(),
        },
      ],
      'border-color-x': [
        {
          'border-x': scaleColor(),
        },
      ],
      'border-color-y': [
        {
          'border-y': scaleColor(),
        },
      ],
      'border-color-s': [
        {
          'border-s': scaleColor(),
        },
      ],
      'border-color-e': [
        {
          'border-e': scaleColor(),
        },
      ],
      'border-color-t': [
        {
          'border-t': scaleColor(),
        },
      ],
      'border-color-r': [
        {
          'border-r': scaleColor(),
        },
      ],
      'border-color-b': [
        {
          'border-b': scaleColor(),
        },
      ],
      'border-color-l': [
        {
          'border-l': scaleColor(),
        },
      ],
      'divide-color': [
        {
          divide: scaleColor(),
        },
      ],
      'outline-style': [
        {
          outline: [...scaleLineStyle(), 'none', 'hidden'],
        },
      ],
      'outline-offset': [
        {
          'outline-offset': [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'outline-w': [
        {
          outline: ['', isNumber, isArbitraryVariableLength, isArbitraryLength],
        },
      ],
      'outline-color': [
        {
          outline: scaleColor(),
        },
      ],
      shadow: [
        {
          shadow: [
            '',
            'none',
            themeShadow,
            isArbitraryVariableShadow,
            isArbitraryShadow,
          ],
        },
      ],
      'shadow-color': [
        {
          shadow: scaleColor(),
        },
      ],
      'inset-shadow': [
        {
          'inset-shadow': [
            'none',
            themeInsetShadow,
            isArbitraryVariableShadow,
            isArbitraryShadow,
          ],
        },
      ],
      'inset-shadow-color': [
        {
          'inset-shadow': scaleColor(),
        },
      ],
      'ring-w': [
        {
          ring: scaleBorderWidth(),
        },
      ],
      'ring-w-inset': ['ring-inset'],
      'ring-color': [
        {
          ring: scaleColor(),
        },
      ],
      'ring-offset-w': [
        {
          'ring-offset': [isNumber, isArbitraryLength],
        },
      ],
      'ring-offset-color': [
        {
          'ring-offset': scaleColor(),
        },
      ],
      'inset-ring-w': [
        {
          'inset-ring': scaleBorderWidth(),
        },
      ],
      'inset-ring-color': [
        {
          'inset-ring': scaleColor(),
        },
      ],
      'text-shadow': [
        {
          'text-shadow': [
            'none',
            themeTextShadow,
            isArbitraryVariableShadow,
            isArbitraryShadow,
          ],
        },
      ],
      'text-shadow-color': [
        {
          'text-shadow': scaleColor(),
        },
      ],
      opacity: [
        {
          opacity: [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'mix-blend': [
        {
          'mix-blend': [...scaleBlendMode(), 'plus-darker', 'plus-lighter'],
        },
      ],
      'bg-blend': [
        {
          'bg-blend': scaleBlendMode(),
        },
      ],
      'mask-clip': [
        {
          'mask-clip': [
            'border',
            'padding',
            'content',
            'fill',
            'stroke',
            'view',
          ],
        },
        'mask-no-clip',
      ],
      'mask-composite': [
        {
          mask: ['add', 'subtract', 'intersect', 'exclude'],
        },
      ],
      'mask-image-linear-pos': [
        {
          'mask-linear': [isNumber],
        },
      ],
      'mask-image-linear-from-pos': [
        {
          'mask-linear-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-linear-to-pos': [
        {
          'mask-linear-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-linear-from-color': [
        {
          'mask-linear-from': scaleColor(),
        },
      ],
      'mask-image-linear-to-color': [
        {
          'mask-linear-to': scaleColor(),
        },
      ],
      'mask-image-t-from-pos': [
        {
          'mask-t-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-t-to-pos': [
        {
          'mask-t-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-t-from-color': [
        {
          'mask-t-from': scaleColor(),
        },
      ],
      'mask-image-t-to-color': [
        {
          'mask-t-to': scaleColor(),
        },
      ],
      'mask-image-r-from-pos': [
        {
          'mask-r-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-r-to-pos': [
        {
          'mask-r-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-r-from-color': [
        {
          'mask-r-from': scaleColor(),
        },
      ],
      'mask-image-r-to-color': [
        {
          'mask-r-to': scaleColor(),
        },
      ],
      'mask-image-b-from-pos': [
        {
          'mask-b-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-b-to-pos': [
        {
          'mask-b-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-b-from-color': [
        {
          'mask-b-from': scaleColor(),
        },
      ],
      'mask-image-b-to-color': [
        {
          'mask-b-to': scaleColor(),
        },
      ],
      'mask-image-l-from-pos': [
        {
          'mask-l-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-l-to-pos': [
        {
          'mask-l-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-l-from-color': [
        {
          'mask-l-from': scaleColor(),
        },
      ],
      'mask-image-l-to-color': [
        {
          'mask-l-to': scaleColor(),
        },
      ],
      'mask-image-x-from-pos': [
        {
          'mask-x-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-x-to-pos': [
        {
          'mask-x-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-x-from-color': [
        {
          'mask-x-from': scaleColor(),
        },
      ],
      'mask-image-x-to-color': [
        {
          'mask-x-to': scaleColor(),
        },
      ],
      'mask-image-y-from-pos': [
        {
          'mask-y-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-y-to-pos': [
        {
          'mask-y-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-y-from-color': [
        {
          'mask-y-from': scaleColor(),
        },
      ],
      'mask-image-y-to-color': [
        {
          'mask-y-to': scaleColor(),
        },
      ],
      'mask-image-radial': [
        {
          'mask-radial': [isArbitraryVariable, isArbitraryValue],
        },
      ],
      'mask-image-radial-from-pos': [
        {
          'mask-radial-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-radial-to-pos': [
        {
          'mask-radial-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-radial-from-color': [
        {
          'mask-radial-from': scaleColor(),
        },
      ],
      'mask-image-radial-to-color': [
        {
          'mask-radial-to': scaleColor(),
        },
      ],
      'mask-image-radial-shape': [
        {
          'mask-radial': ['circle', 'ellipse'],
        },
      ],
      'mask-image-radial-size': [
        {
          'mask-radial': [
            {
              closest: ['side', 'corner'],
              farthest: ['side', 'corner'],
            },
          ],
        },
      ],
      'mask-image-radial-pos': [
        {
          'mask-radial-at': scalePosition(),
        },
      ],
      'mask-image-conic-pos': [
        {
          'mask-conic': [isNumber],
        },
      ],
      'mask-image-conic-from-pos': [
        {
          'mask-conic-from': scaleMaskImagePosition(),
        },
      ],
      'mask-image-conic-to-pos': [
        {
          'mask-conic-to': scaleMaskImagePosition(),
        },
      ],
      'mask-image-conic-from-color': [
        {
          'mask-conic-from': scaleColor(),
        },
      ],
      'mask-image-conic-to-color': [
        {
          'mask-conic-to': scaleColor(),
        },
      ],
      'mask-mode': [
        {
          mask: ['alpha', 'luminance', 'match'],
        },
      ],
      'mask-origin': [
        {
          'mask-origin': [
            'border',
            'padding',
            'content',
            'fill',
            'stroke',
            'view',
          ],
        },
      ],
      'mask-position': [
        {
          mask: scaleBgPosition(),
        },
      ],
      'mask-repeat': [
        {
          mask: scaleBgRepeat(),
        },
      ],
      'mask-size': [
        {
          mask: scaleBgSize(),
        },
      ],
      'mask-type': [
        {
          'mask-type': ['alpha', 'luminance'],
        },
      ],
      'mask-image': [
        {
          mask: ['none', isArbitraryVariable, isArbitraryValue],
        },
      ],
      filter: [
        {
          filter: ['', 'none', isArbitraryVariable, isArbitraryValue],
        },
      ],
      blur: [
        {
          blur: scaleBlur(),
        },
      ],
      brightness: [
        {
          brightness: [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      contrast: [
        {
          contrast: [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'drop-shadow': [
        {
          'drop-shadow': [
            '',
            'none',
            themeDropShadow,
            isArbitraryVariableShadow,
            isArbitraryShadow,
          ],
        },
      ],
      'drop-shadow-color': [
        {
          'drop-shadow': scaleColor(),
        },
      ],
      grayscale: [
        {
          grayscale: ['', isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'hue-rotate': [
        {
          'hue-rotate': [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      invert: [
        {
          invert: ['', isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      saturate: [
        {
          saturate: [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      sepia: [
        {
          sepia: ['', isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'backdrop-filter': [
        {
          'backdrop-filter': [
            '',
            'none',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-blur': [
        {
          'backdrop-blur': scaleBlur(),
        },
      ],
      'backdrop-brightness': [
        {
          'backdrop-brightness': [
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-contrast': [
        {
          'backdrop-contrast': [
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-grayscale': [
        {
          'backdrop-grayscale': [
            '',
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-hue-rotate': [
        {
          'backdrop-hue-rotate': [
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-invert': [
        {
          'backdrop-invert': [
            '',
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-opacity': [
        {
          'backdrop-opacity': [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      'backdrop-saturate': [
        {
          'backdrop-saturate': [
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'backdrop-sepia': [
        {
          'backdrop-sepia': [
            '',
            isNumber,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'border-collapse': [
        {
          border: ['collapse', 'separate'],
        },
      ],
      'border-spacing': [
        {
          'border-spacing': scaleUnambiguousSpacing(),
        },
      ],
      'border-spacing-x': [
        {
          'border-spacing-x': scaleUnambiguousSpacing(),
        },
      ],
      'border-spacing-y': [
        {
          'border-spacing-y': scaleUnambiguousSpacing(),
        },
      ],
      'table-layout': [
        {
          table: ['auto', 'fixed'],
        },
      ],
      caption: [
        {
          caption: ['top', 'bottom'],
        },
      ],
      transition: [
        {
          transition: [
            '',
            'all',
            'colors',
            'opacity',
            'shadow',
            'transform',
            'none',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'transition-behavior': [
        {
          transition: ['normal', 'discrete'],
        },
      ],
      duration: [
        {
          duration: [
            isNumber,
            'initial',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      ease: [
        {
          ease: [
            'linear',
            'initial',
            themeEase,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      delay: [
        {
          delay: [isNumber, isArbitraryVariable, isArbitraryValue],
        },
      ],
      animate: [
        {
          animate: [
            'none',
            themeAnimate,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      backface: [
        {
          backface: ['hidden', 'visible'],
        },
      ],
      perspective: [
        {
          perspective: [
            themePerspective,
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'perspective-origin': [
        {
          'perspective-origin': scalePositionWithArbitrary(),
        },
      ],
      rotate: [
        {
          rotate: scaleRotate(),
        },
      ],
      'rotate-x': [
        {
          'rotate-x': scaleRotate(),
        },
      ],
      'rotate-y': [
        {
          'rotate-y': scaleRotate(),
        },
      ],
      'rotate-z': [
        {
          'rotate-z': scaleRotate(),
        },
      ],
      scale: [
        {
          scale: scaleScale(),
        },
      ],
      'scale-x': [
        {
          'scale-x': scaleScale(),
        },
      ],
      'scale-y': [
        {
          'scale-y': scaleScale(),
        },
      ],
      'scale-z': [
        {
          'scale-z': scaleScale(),
        },
      ],
      'scale-3d': ['scale-3d'],
      skew: [
        {
          skew: scaleSkew(),
        },
      ],
      'skew-x': [
        {
          'skew-x': scaleSkew(),
        },
      ],
      'skew-y': [
        {
          'skew-y': scaleSkew(),
        },
      ],
      transform: [
        {
          transform: [
            isArbitraryVariable,
            isArbitraryValue,
            '',
            'none',
            'gpu',
            'cpu',
          ],
        },
      ],
      'transform-origin': [
        {
          origin: scalePositionWithArbitrary(),
        },
      ],
      'transform-style': [
        {
          transform: ['3d', 'flat'],
        },
      ],
      translate: [
        {
          translate: scaleTranslate(),
        },
      ],
      'translate-x': [
        {
          'translate-x': scaleTranslate(),
        },
      ],
      'translate-y': [
        {
          'translate-y': scaleTranslate(),
        },
      ],
      'translate-z': [
        {
          'translate-z': scaleTranslate(),
        },
      ],
      'translate-none': ['translate-none'],
      accent: [
        {
          accent: scaleColor(),
        },
      ],
      appearance: [
        {
          appearance: ['none', 'auto'],
        },
      ],
      'caret-color': [
        {
          caret: scaleColor(),
        },
      ],
      'color-scheme': [
        {
          scheme: [
            'normal',
            'dark',
            'light',
            'light-dark',
            'only-dark',
            'only-light',
          ],
        },
      ],
      cursor: [
        {
          cursor: [
            'auto',
            'default',
            'pointer',
            'wait',
            'text',
            'move',
            'help',
            'not-allowed',
            'none',
            'context-menu',
            'progress',
            'cell',
            'crosshair',
            'vertical-text',
            'alias',
            'copy',
            'no-drop',
            'grab',
            'grabbing',
            'all-scroll',
            'col-resize',
            'row-resize',
            'n-resize',
            'e-resize',
            's-resize',
            'w-resize',
            'ne-resize',
            'nw-resize',
            'se-resize',
            'sw-resize',
            'ew-resize',
            'ns-resize',
            'nesw-resize',
            'nwse-resize',
            'zoom-in',
            'zoom-out',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      'field-sizing': [
        {
          'field-sizing': ['fixed', 'content'],
        },
      ],
      'pointer-events': [
        {
          'pointer-events': ['auto', 'none'],
        },
      ],
      resize: [
        {
          resize: ['none', '', 'y', 'x'],
        },
      ],
      'scroll-behavior': [
        {
          scroll: ['auto', 'smooth'],
        },
      ],
      'scroll-m': [
        {
          'scroll-m': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-mx': [
        {
          'scroll-mx': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-my': [
        {
          'scroll-my': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-ms': [
        {
          'scroll-ms': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-me': [
        {
          'scroll-me': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-mt': [
        {
          'scroll-mt': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-mr': [
        {
          'scroll-mr': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-mb': [
        {
          'scroll-mb': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-ml': [
        {
          'scroll-ml': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-p': [
        {
          'scroll-p': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-px': [
        {
          'scroll-px': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-py': [
        {
          'scroll-py': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-ps': [
        {
          'scroll-ps': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-pe': [
        {
          'scroll-pe': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-pt': [
        {
          'scroll-pt': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-pr': [
        {
          'scroll-pr': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-pb': [
        {
          'scroll-pb': scaleUnambiguousSpacing(),
        },
      ],
      'scroll-pl': [
        {
          'scroll-pl': scaleUnambiguousSpacing(),
        },
      ],
      'snap-align': [
        {
          snap: ['start', 'end', 'center', 'align-none'],
        },
      ],
      'snap-stop': [
        {
          snap: ['normal', 'always'],
        },
      ],
      'snap-type': [
        {
          snap: ['none', 'x', 'y', 'both'],
        },
      ],
      'snap-strictness': [
        {
          snap: ['mandatory', 'proximity'],
        },
      ],
      touch: [
        {
          touch: ['auto', 'none', 'manipulation'],
        },
      ],
      'touch-x': [
        {
          'touch-pan': ['x', 'left', 'right'],
        },
      ],
      'touch-y': [
        {
          'touch-pan': ['y', 'up', 'down'],
        },
      ],
      'touch-pz': ['touch-pinch-zoom'],
      select: [
        {
          select: ['none', 'text', 'all', 'auto'],
        },
      ],
      'will-change': [
        {
          'will-change': [
            'auto',
            'scroll',
            'contents',
            'transform',
            isArbitraryVariable,
            isArbitraryValue,
          ],
        },
      ],
      fill: [
        {
          fill: ['none', ...scaleColor()],
        },
      ],
      'stroke-w': [
        {
          stroke: [
            isNumber,
            isArbitraryVariableLength,
            isArbitraryLength,
            isArbitraryNumber,
          ],
        },
      ],
      stroke: [
        {
          stroke: ['none', ...scaleColor()],
        },
      ],
      'forced-color-adjust': [
        {
          'forced-color-adjust': ['auto', 'none'],
        },
      ],
    },
    conflictingClassGroups: {
      overflow: ['overflow-x', 'overflow-y'],
      overscroll: ['overscroll-x', 'overscroll-y'],
      inset: [
        'inset-x',
        'inset-y',
        'start',
        'end',
        'top',
        'right',
        'bottom',
        'left',
      ],
      'inset-x': ['right', 'left'],
      'inset-y': ['top', 'bottom'],
      flex: ['basis', 'grow', 'shrink'],
      gap: ['gap-x', 'gap-y'],
      p: ['px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl'],
      px: ['pr', 'pl'],
      py: ['pt', 'pb'],
      m: ['mx', 'my', 'ms', 'me', 'mt', 'mr', 'mb', 'ml'],
      mx: ['mr', 'ml'],
      my: ['mt', 'mb'],
      size: ['w', 'h'],
      'font-size': ['leading'],
      'fvn-normal': [
        'fvn-ordinal',
        'fvn-slashed-zero',
        'fvn-figure',
        'fvn-spacing',
        'fvn-fraction',
      ],
      'fvn-ordinal': ['fvn-normal'],
      'fvn-slashed-zero': ['fvn-normal'],
      'fvn-figure': ['fvn-normal'],
      'fvn-spacing': ['fvn-normal'],
      'fvn-fraction': ['fvn-normal'],
      'line-clamp': ['display', 'overflow'],
      rounded: [
        'rounded-s',
        'rounded-e',
        'rounded-t',
        'rounded-r',
        'rounded-b',
        'rounded-l',
        'rounded-ss',
        'rounded-se',
        'rounded-ee',
        'rounded-es',
        'rounded-tl',
        'rounded-tr',
        'rounded-br',
        'rounded-bl',
      ],
      'rounded-s': ['rounded-ss', 'rounded-es'],
      'rounded-e': ['rounded-se', 'rounded-ee'],
      'rounded-t': ['rounded-tl', 'rounded-tr'],
      'rounded-r': ['rounded-tr', 'rounded-br'],
      'rounded-b': ['rounded-br', 'rounded-bl'],
      'rounded-l': ['rounded-tl', 'rounded-bl'],
      'border-spacing': ['border-spacing-x', 'border-spacing-y'],
      'border-w': [
        'border-w-x',
        'border-w-y',
        'border-w-s',
        'border-w-e',
        'border-w-t',
        'border-w-r',
        'border-w-b',
        'border-w-l',
      ],
      'border-w-x': ['border-w-r', 'border-w-l'],
      'border-w-y': ['border-w-t', 'border-w-b'],
      'border-color': [
        'border-color-x',
        'border-color-y',
        'border-color-s',
        'border-color-e',
        'border-color-t',
        'border-color-r',
        'border-color-b',
        'border-color-l',
      ],
      'border-color-x': ['border-color-r', 'border-color-l'],
      'border-color-y': ['border-color-t', 'border-color-b'],
      translate: ['translate-x', 'translate-y', 'translate-none'],
      'translate-none': [
        'translate',
        'translate-x',
        'translate-y',
        'translate-z',
      ],
      'scroll-m': [
        'scroll-mx',
        'scroll-my',
        'scroll-ms',
        'scroll-me',
        'scroll-mt',
        'scroll-mr',
        'scroll-mb',
        'scroll-ml',
      ],
      'scroll-mx': ['scroll-mr', 'scroll-ml'],
      'scroll-my': ['scroll-mt', 'scroll-mb'],
      'scroll-p': [
        'scroll-px',
        'scroll-py',
        'scroll-ps',
        'scroll-pe',
        'scroll-pt',
        'scroll-pr',
        'scroll-pb',
        'scroll-pl',
      ],
      'scroll-px': ['scroll-pr', 'scroll-pl'],
      'scroll-py': ['scroll-pt', 'scroll-pb'],
      touch: ['touch-x', 'touch-y', 'touch-pz'],
      'touch-x': ['touch'],
      'touch-y': ['touch'],
      'touch-pz': ['touch'],
    },
    conflictingClassGroupModifiers: {
      'font-size': ['leading'],
    },
    orderSensitiveModifiers: [
      '*',
      '**',
      'after',
      'backdrop',
      'before',
      'details-content',
      'file',
      'first-letter',
      'first-line',
      'marker',
      'placeholder',
      'selection',
    ],
  };
};
var twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);

// packages/ui/src/core/utils.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// packages/ui/src/core/button.tsx
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
var Button = React3.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props,
      },
      undefined,
      false,
      undefined,
      this
    );
  }
);
Button.displayName = 'Button';

// packages/ui/src/premium/bento-grid.tsx
var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
('use client');
var BentoGrid = ({ children, className, ...props }) => {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
    'div',
    {
      className: cn(
        'grid w-full auto-rows-[22rem] grid-cols-3 gap-4',
        className
      ),
      ...props,
      children,
    },
    undefined,
    false,
    undefined,
    this
  );
};
var BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}) =>
  /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
    'div',
    {
      className: cn(
        'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl',
        'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
          'div',
          {
            children: background,
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
          'div',
          {
            className: 'p-4',
            children: [
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                'div',
                {
                  className:
                    'pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-10',
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                      Icon,
                      {
                        className:
                          'h-12 w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75',
                      },
                      undefined,
                      false,
                      undefined,
                      this
                    ),
                    /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                      'h3',
                      {
                        className:
                          'text-xl font-semibold text-neutral-700 dark:text-neutral-300',
                        children: name,
                      },
                      undefined,
                      false,
                      undefined,
                      this
                    ),
                    /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                      'p',
                      {
                        className: 'max-w-lg text-neutral-400',
                        children: description,
                      },
                      undefined,
                      false,
                      undefined,
                      this
                    ),
                  ],
                },
                undefined,
                true,
                undefined,
                this
              ),
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                'div',
                {
                  className: cn(
                    'pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden'
                  ),
                  children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                    Button,
                    {
                      variant: 'link',
                      asChild: true,
                      size: 'sm',
                      className: 'pointer-events-auto p-0',
                      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                        'a',
                        {
                          href,
                          children: [
                            cta,
                            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                              ArrowRightIcon,
                              {
                                className: 'ms-2 h-4 w-4 rtl:rotate-180',
                              },
                              undefined,
                              false,
                              undefined,
                              this
                            ),
                          ],
                        },
                        undefined,
                        true,
                        undefined,
                        this
                      ),
                    },
                    undefined,
                    false,
                    undefined,
                    this
                  ),
                },
                undefined,
                false,
                undefined,
                this
              ),
            ],
          },
          undefined,
          true,
          undefined,
          this
        ),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
          'div',
          {
            className: cn(
              'pointer-events-none absolute bottom-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex'
            ),
            children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
              Button,
              {
                variant: 'link',
                asChild: true,
                size: 'sm',
                className: 'pointer-events-auto p-0',
                children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                  'a',
                  {
                    href,
                    children: [
                      cta,
                      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
                        ArrowRightIcon,
                        {
                          className: 'ms-2 h-4 w-4 rtl:rotate-180',
                        },
                        undefined,
                        false,
                        undefined,
                        this
                      ),
                    ],
                  },
                  undefined,
                  true,
                  undefined,
                  this
                ),
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(
          'div',
          {
            className:
              'pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10',
          },
          undefined,
          false,
          undefined,
          this
        ),
      ],
    },
    name,
    true,
    undefined,
    this
  );
export { BentoGrid, BentoCard };
