// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    form[key] = value;
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", 8);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("json");
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = (headers, map = {}) => {
  for (const key of Object.keys(map)) {
    headers.set(key, map[key]);
  }
  return headers;
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status = 200;
  #executionCtx;
  #headers;
  #preparedHeaders;
  #res;
  #isFresh = true;
  #layout;
  #renderer;
  #notFoundHandler;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    this.#isFresh = false;
    return this.#res ||= new Response("404 Not Found", { status: 404 });
  }
  set res(_res) {
    this.#isFresh = false;
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    if (value === void 0) {
      if (this.#headers) {
        this.#headers.delete(name);
      } else if (this.#preparedHeaders) {
        delete this.#preparedHeaders[name.toLocaleLowerCase()];
      }
      if (this.finalized) {
        this.res.headers.delete(name);
      }
      return;
    }
    if (options?.append) {
      if (!this.#headers) {
        this.#isFresh = false;
        this.#headers = new Headers(this.#preparedHeaders);
        this.#preparedHeaders = {};
      }
      this.#headers.append(name, value);
    } else {
      if (this.#headers) {
        this.#headers.set(name, value);
      } else {
        this.#preparedHeaders ??= {};
        this.#preparedHeaders[name.toLowerCase()] = value;
      }
    }
    if (this.finalized) {
      if (options?.append) {
        this.res.headers.append(name, value);
      } else {
        this.res.headers.set(name, value);
      }
    }
  };
  status = (status) => {
    this.#isFresh = false;
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    if (this.#isFresh && !headers && !arg && this.#status === 200) {
      return new Response(data, {
        headers: this.#preparedHeaders
      });
    }
    if (arg && typeof arg !== "number") {
      const header = new Headers(arg.headers);
      if (this.#headers) {
        this.#headers.forEach((v, k) => {
          if (k === "set-cookie") {
            header.append(k, v);
          } else {
            header.set(k, v);
          }
        });
      }
      const headers2 = setHeaders(header, this.#preparedHeaders);
      return new Response(data, {
        headers: headers2,
        status: arg.status ?? this.#status
      });
    }
    const status = typeof arg === "number" ? arg : this.#status;
    this.#preparedHeaders ??= {};
    this.#headers ??= new Headers();
    setHeaders(this.#headers, this.#preparedHeaders);
    if (this.#res) {
      this.#res.headers.forEach((v, k) => {
        if (k === "set-cookie") {
          this.#headers?.append(k, v);
        } else {
          this.#headers?.set(k, v);
        }
      });
      setHeaders(this.#headers, this.#preparedHeaders);
    }
    headers ??= {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        this.#headers.set(k, v);
      } else {
        this.#headers.delete(k);
        for (const v2 of v) {
          this.#headers.append(k, v2);
        }
      }
    }
    return new Response(data, {
      status,
      headers: this.#headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => {
    return typeof arg === "number" ? this.#newResponse(data, arg, headers) : this.#newResponse(data, arg);
  };
  text = (text, arg, headers) => {
    if (!this.#preparedHeaders) {
      if (this.#isFresh && !headers && !arg) {
        return new Response(text);
      }
      this.#preparedHeaders = {};
    }
    this.#preparedHeaders["content-type"] = TEXT_PLAIN;
    if (typeof arg === "number") {
      return this.#newResponse(text, arg, headers);
    }
    return this.#newResponse(text, arg);
  };
  json = (object, arg, headers) => {
    const body = JSON.stringify(object);
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "application/json";
    return typeof arg === "number" ? this.#newResponse(body, arg, headers) : this.#newResponse(body, arg);
  };
  html = (html, arg, headers) => {
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "text/html; charset=UTF-8";
    if (typeof html === "object") {
      return resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then((html2) => {
        return typeof arg === "number" ? this.#newResponse(html2, arg, headers) : this.#newResponse(html2, arg);
      });
    }
    return typeof arg === "number" ? this.#newResponse(html, arg, headers) : this.#newResponse(html, arg);
  };
  redirect = (location, status) => {
    this.#headers ??= new Headers();
    this.#headers.set("Location", String(location));
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    return err.getResponse();
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (Object.keys(curNode.#children).includes(key)) {
        curNode = curNode.#children[key];
        const pattern2 = getPattern(p, nextP);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    const m = /* @__PURE__ */ Object.create(null);
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      score: this.#order
    };
    m[method] = handlerSet;
    curNode.#methods.push(m);
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? "NO_COLOR" in process?.env : false;
  return !isNoColor;
}

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
};
var colorStatus = (status) => {
  const colorEnabled = getColorEnabled();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    log(fn, "-->", method, path, c.res.status, time(start));
  };
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/middleware/powered-by/index.js
var poweredBy = (options) => {
  return async function poweredBy2(c, next) {
    await next();
    c.res.headers.set("X-Powered-By", options?.serverName ?? "Hono");
  };
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      if (opts.allowMethods?.length) {
        set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  };
};

// node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/index.mjs
var util;
(function(util2) {
  util2.assertEqual = (val) => val;
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var overrideErrorMap = errorMap;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));
var _ZodEnum_cache;
var _ZodNativeEnum_cache;
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    var _a, _b;
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    var _a;
    const ctx = {
      common: {
        issues: [],
        async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    var _a, _b;
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
        async: true
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if (!decoded.typ || !decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch (_a) {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    var _a, _b;
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
      offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
      local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options === null || options === void 0 ? void 0 : options.position,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  var _a;
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null, min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch (_a) {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  var _a;
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    return this._cached = { shape, keys };
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          var _a, _b, _c, _d;
          const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    util.objectKeys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  constructor() {
    super(...arguments);
    _ZodEnum_cache.set(this, void 0);
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
      __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
_ZodEnum_cache = /* @__PURE__ */ new WeakMap();
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  constructor() {
    super(...arguments);
    _ZodNativeEnum_cache.set(this, void 0);
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
      __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
_ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return base;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return base;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      var _a, _b;
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          var _a2, _b2;
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = (_b2 = (_a2 = params.fatal) !== null && _a2 !== void 0 ? _a2 : fatal) !== null && _b2 !== void 0 ? _b2 : true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
var z = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: errorMap,
  setErrorMap,
  getErrorMap,
  makeIssue,
  EMPTY_PATH,
  addIssueToContext,
  ParseStatus,
  INVALID,
  DIRTY,
  OK,
  isAborted,
  isDirty,
  isValid,
  isAsync,
  get util() {
    return util;
  },
  get objectUtil() {
    return objectUtil;
  },
  ZodParsedType,
  getParsedType,
  ZodType,
  datetimeRegex,
  ZodString,
  ZodNumber,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodSymbol,
  ZodUndefined,
  ZodNull,
  ZodAny,
  ZodUnknown,
  ZodNever,
  ZodVoid,
  ZodArray,
  ZodObject,
  ZodUnion,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodTuple,
  ZodRecord,
  ZodMap,
  ZodSet,
  ZodFunction,
  ZodLazy,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
  ZodPromise,
  ZodEffects,
  ZodTransformer: ZodEffects,
  ZodOptional,
  ZodNullable,
  ZodDefault,
  ZodCatch,
  ZodNaN,
  BRAND,
  ZodBranded,
  ZodPipeline,
  ZodReadonly,
  custom,
  Schema: ZodType,
  ZodSchema: ZodType,
  late,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  coerce,
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  date: dateType,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  "enum": enumType,
  "function": functionType,
  "instanceof": instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  "null": nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  oboolean,
  onumber,
  optional: optionalType,
  ostring,
  pipeline: pipelineType,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  symbol: symbolType,
  transformer: effectsType,
  tuple: tupleType,
  "undefined": undefinedType,
  union: unionType,
  unknown: unknownType,
  "void": voidType,
  NEVER,
  ZodIssueCode,
  quotelessJson,
  ZodError
});

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  res;
  status;
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/.pnpm/@qdrant+js-client-rest@1.14.0_typescript@5.8.3/node_modules/@qdrant/js-client-rest/dist/browser/index.js
var none = {
  isNone: function() {
    return true;
  },
  orElse: function(fallback) {
    return fallback;
  },
  orCall: function(getFallback) {
    return getFallback();
  },
  orNull: function() {
    return null;
  },
  orThrow: function(message) {
    if (message === void 0) {
      message = "Unexpected null value";
    }
    throw new TypeError(message);
  },
  map: function() {
    return none;
  },
  get: function() {
    return none;
  }
};
var Some = (
  /** @class */
  function() {
    function Some2(value) {
      this.value = value;
    }
    Some2.prototype.isNone = function() {
      return false;
    };
    Some2.prototype.orElse = function() {
      return this.value;
    };
    Some2.prototype.orCall = function() {
      return this.value;
    };
    Some2.prototype.orNull = function() {
      return this.value;
    };
    Some2.prototype.orThrow = function() {
      return this.value;
    };
    Some2.prototype.map = function(f) {
      return maybe(f(this.value));
    };
    Some2.prototype.get = function(key) {
      return this.map(function(obj) {
        return obj[key];
      });
    };
    return Some2;
  }()
);
function isMaybe(value) {
  return value === none || value instanceof Some;
}
function maybe(value) {
  if (isMaybe(value)) {
    return value;
  }
  if (value == null) {
    return none;
  }
  return some(value);
}
function some(value) {
  if (value == null) {
    throw new TypeError("some() does not accept null or undefined");
  }
  return new Some(value);
}
var ApiError = class extends Error {
  constructor(response) {
    super(response.statusText);
    Object.setPrototypeOf(this, new.target.prototype);
    this.headers = response.headers;
    this.url = response.url;
    this.status = response.status;
    this.statusText = response.statusText;
    this.data = response.data;
  }
};
var bigintReviver;
var bigintReplacer;
if ("rawJSON" in JSON) {
  bigintReviver = function(_key, val, context) {
    if (Number.isInteger(val) && !Number.isSafeInteger(val)) {
      try {
        return BigInt(context.source);
      } catch {
        return val;
      }
    }
    return val;
  };
  bigintReplacer = function(_key, val) {
    if (typeof val === "bigint") {
      return JSON.rawJSON(String(val));
    }
    return val;
  };
}
var sendBody = (method) => method === "post" || method === "put" || method === "patch" || method === "delete";
function queryString(params) {
  const qs = [];
  const encode = (key, value) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value != null) {
      if (Array.isArray(value)) {
        value.forEach((value2) => qs.push(encode(key, value2)));
      } else {
        qs.push(encode(key, value));
      }
    }
  });
  if (qs.length > 0) {
    return `?${qs.join("&")}`;
  }
  return "";
}
function getPath2(path, payload) {
  return path.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = encodeURIComponent(payload[key]);
    delete payload[key];
    return value;
  });
}
function getQuery(method, payload, query) {
  let queryObj = {};
  if (sendBody(method)) {
    query.forEach((key) => {
      queryObj[key] = payload[key];
      delete payload[key];
    });
  } else {
    queryObj = { ...payload };
  }
  return queryString(queryObj);
}
function getHeaders(body, init) {
  const headers = new Headers(init);
  if (body !== void 0 && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.append("Accept", "application/json");
  }
  return headers;
}
function getBody(method, payload) {
  if (!sendBody(method)) {
    return;
  }
  const body = payload instanceof FormData ? payload : JSON.stringify(payload, bigintReplacer);
  return method === "delete" && body === "{}" ? void 0 : body;
}
function mergeRequestInit(first, second) {
  const headers = new Headers(first?.headers);
  const other = new Headers(second?.headers);
  for (const key of other.keys()) {
    const value = other.get(key);
    if (value != null) {
      headers.set(key, value);
    }
  }
  return { ...first, ...second, headers };
}
function getFetchParams(request) {
  const payload = Object.assign(Array.isArray(request.payload) ? [] : {}, request.payload);
  const path = getPath2(request.path, payload);
  const query = getQuery(request.method, payload, request.queryParams);
  const body = getBody(request.method, payload);
  const headers = sendBody(request.method) ? getHeaders(body, request.init?.headers) : new Headers(request.init?.headers);
  const url = request.baseUrl + path + query;
  const init = {
    ...request.init,
    method: request.method.toUpperCase(),
    headers,
    body
  };
  return { url, init };
}
async function getResponseData(response) {
  if (response.status === 204) {
    return;
  }
  const contentType = response.headers.get("content-type");
  const responseText = await response.text();
  if (contentType && contentType.includes("application/json")) {
    return JSON.parse(responseText, bigintReviver);
  }
  try {
    return JSON.parse(responseText, bigintReviver);
  } catch (e) {
    return responseText;
  }
}
async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const data = await getResponseData(response);
  const result = {
    headers: response.headers,
    url: response.url,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data
  };
  if (result.ok) {
    return result;
  }
  throw new ApiError(result);
}
function wrapMiddlewares(middlewares, fetch2) {
  const handler = async (index, url, init) => {
    if (middlewares == null || index === middlewares.length) {
      return fetch2(url, init);
    }
    const current = middlewares[index];
    return await current(url, init, (nextUrl, nextInit) => handler(index + 1, nextUrl, nextInit));
  };
  return (url, init) => handler(0, url, init);
}
async function fetchUrl(request) {
  const { url, init } = getFetchParams(request);
  const response = await request.fetch(url, init);
  return response;
}
function createFetch(fetch2) {
  const fun = async (payload, init) => {
    try {
      return await fetch2(payload, init);
    } catch (err) {
      if (err instanceof ApiError) {
        throw new fun.Error(err);
      }
      throw err;
    }
  };
  fun.Error = class extends ApiError {
    constructor(error) {
      super(error);
      Object.setPrototypeOf(this, new.target.prototype);
    }
    getActualType() {
      return {
        status: this.status,
        data: this.data
      };
    }
  };
  return fun;
}
function fetcher() {
  let baseUrl = "";
  let defaultInit = {};
  const middlewares = [];
  const fetch2 = wrapMiddlewares(middlewares, fetchJson);
  return {
    configure: (config) => {
      baseUrl = config.baseUrl || "";
      defaultInit = config.init || {};
      middlewares.splice(0);
      middlewares.push(...config.use || []);
    },
    use: (mw) => middlewares.push(mw),
    path: (path) => ({
      method: (method) => ({
        create: (queryParams) => createFetch((payload, init) => fetchUrl({
          baseUrl: baseUrl || "",
          path,
          method,
          queryParams: Object.keys(queryParams || {}),
          payload,
          init: mergeRequestInit(defaultInit, init),
          fetch: fetch2
        }))
      })
    })
  };
}
var Fetcher = {
  for: () => fetcher()
};
function createClusterApi(client) {
  return {
    /**
     * Get information about the current state and composition of the cluster
     */
    clusterStatus: client.path("/cluster").method("get").create(),
    /**
     * Get cluster information for a collection
     */
    collectionClusterInfo: client.path("/collections/{collection_name}/cluster").method("get").create(),
    recoverCurrentPeer: client.path("/cluster/recover").method("post").create(),
    /**
     * Tries to remove peer from the cluster. Will return an error if peer has shards on it.
     */
    removePeer: client.path("/cluster/peer/{peer_id}").method("delete").create({ force: true }),
    updateCollectionCluster: client.path("/collections/{collection_name}/cluster").method("post").create({ timeout: true })
  };
}
function createCollectionsApi(client) {
  return {
    /**
     * Get cluster information for a collection
     */
    collectionClusterInfo: client.path("/collections/{collection_name}/cluster").method("get").create(),
    /**
     * Create new collection with given parameters
     */
    createCollection: client.path("/collections/{collection_name}").method("put").create({ timeout: true }),
    /**
     * Create index for field in collection
     */
    createFieldIndex: client.path("/collections/{collection_name}/index").method("put").create({ ordering: true, wait: true }),
    /**
     * Create new snapshot for a collection
     */
    createSnapshot: client.path("/collections/{collection_name}/snapshots").method("post").create({ wait: true }),
    /**
     * Drop collection and all associated data
     */
    deleteCollection: client.path("/collections/{collection_name}").method("delete").create({ timeout: true }),
    /**
     * Delete field index for collection
     */
    deleteFieldIndex: client.path("/collections/{collection_name}/index/{field_name}").method("delete").create({ ordering: true, wait: true }),
    /**
     * Delete snapshot for a collection
     */
    deleteSnapshots: client.path("/collections/{collection_name}/snapshots/{snapshot_name}").method("delete").create({ wait: true }),
    /**
     * Get detailed information about specified existing collection
     */
    getCollection: client.path("/collections/{collection_name}").method("get").create(),
    /**
     * Get list of all aliases for a collection
     */
    getCollectionAliases: client.path("/collections/{collection_name}/aliases").method("get").create(),
    /**
     * Get list name of all existing collections
     */
    getCollections: client.path("/collections").method("get").create(),
    /**
     * Get list of all existing collections aliases
     */
    getCollectionsAliases: client.path("/aliases").method("get").create(),
    /**
     * Check the existence of a collection
     */
    collectionExists: client.path("/collections/{collection_name}/exists").method("get").create(),
    /**
     * Download specified snapshot from a collection as a file
     * @todo Fetcher needs to handle Blob for file downloads
     */
    getSnapshot: client.path("/collections/{collection_name}/snapshots/{snapshot_name}").method("get").create(),
    /**
     * Get list of snapshots for a collection
     */
    listSnapshots: client.path("/collections/{collection_name}/snapshots").method("get").create(),
    updateAliases: client.path("/collections/aliases").method("post").create({ timeout: true }),
    /**
     * Update parameters of the existing collection
     */
    updateCollection: client.path("/collections/{collection_name}").method("patch").create({ timeout: true }),
    updateCollectionCluster: client.path("/collections/{collection_name}/cluster").method("post").create({ timeout: true })
  };
}
function createPointsApi(client) {
  return {
    /**
     * Remove all payload for specified points
     */
    clearPayload: client.path("/collections/{collection_name}/points/payload/clear").method("post").create({ ordering: true, wait: true }),
    /**
     * Count points which matches given filtering condition
     */
    countPoints: client.path("/collections/{collection_name}/points/count").method("post").create({ timeout: true }),
    /**
     * Delete specified key payload for points
     */
    deletePayload: client.path("/collections/{collection_name}/points/payload/delete").method("post").create({ wait: true, ordering: true }),
    /**
     * Delete points
     */
    deletePoints: client.path("/collections/{collection_name}/points/delete").method("post").create({ wait: true, ordering: true }),
    /**
     * Update vectors
     */
    updateVectors: client.path("/collections/{collection_name}/points/vectors").method("put").create({ wait: true, ordering: true }),
    /**
     * Delete vectors
     */
    deleteVectors: client.path("/collections/{collection_name}/points/vectors/delete").method("post").create({ wait: true, ordering: true }),
    /**
     * Retrieve full information of single point by id
     */
    getPoint: client.path("/collections/{collection_name}/points/{id}").method("get").create(),
    /**
     * Retrieve multiple points by specified IDs
     */
    getPoints: client.path("/collections/{collection_name}/points").method("post").create({ consistency: true, timeout: true }),
    /**
     * Replace full payload of points with new one
     */
    overwritePayload: client.path("/collections/{collection_name}/points/payload").method("put").create({ wait: true, ordering: true }),
    /**
     * Look for the points which are closer to stored positive examples and at the same time further to negative examples.
     */
    recommendBatchPoints: client.path("/collections/{collection_name}/points/recommend/batch").method("post").create({ consistency: true, timeout: true }),
    /**
     * Look for the points which are closer to stored positive examples and at the same time further to negative examples.
     */
    recommendPoints: client.path("/collections/{collection_name}/points/recommend").method("post").create({ consistency: true, timeout: true }),
    /**
     * Search point groups
     */
    searchPointGroups: client.path("/collections/{collection_name}/points/search/groups").method("post").create({ consistency: true, timeout: true }),
    /**
     * Scroll request - paginate over all points which matches given filtering condition
     */
    scrollPoints: client.path("/collections/{collection_name}/points/scroll").method("post").create({ consistency: true, timeout: true }),
    /**
     * Retrieve by batch the closest points based on vector similarity and given filtering conditions
     */
    searchBatchPoints: client.path("/collections/{collection_name}/points/search/batch").method("post").create({ consistency: true, timeout: true }),
    /**
     * Retrieve closest points based on vector similarity and given filtering conditions
     */
    searchPoints: client.path("/collections/{collection_name}/points/search").method("post").create({ consistency: true, timeout: true }),
    /**
     * Set payload values for points
     */
    setPayload: client.path("/collections/{collection_name}/points/payload").method("post").create({ wait: true, ordering: true }),
    /**
     * Perform insert + updates on points. If point with given ID already exists - it will be overwritten.
     */
    upsertPoints: client.path("/collections/{collection_name}/points").method("put").create({ wait: true, ordering: true }),
    /**
     * Recommend point groups
     */
    recommendPointGroups: client.path("/collections/{collection_name}/points/recommend/groups").method("post").create({ consistency: true, timeout: true }),
    /**
     * Apply a series of update operations for points, vectors and payloads
     */
    batchUpdate: client.path("/collections/{collection_name}/points/batch").method("post").create({ wait: true, ordering: true }),
    /**
     * Discover points
     */
    discoverPoints: client.path("/collections/{collection_name}/points/discover").method("post").create({ consistency: true, timeout: true }),
    /**
     * Discover batch points
     */
    discoverBatchPoints: client.path("/collections/{collection_name}/points/discover/batch").method("post").create({ consistency: true, timeout: true }),
    /**
     * Query points
     */
    queryPoints: client.path("/collections/{collection_name}/points/query").method("post").create({ consistency: true, timeout: true }),
    /**
     * Query points in batch
     */
    queryBatchPoints: client.path("/collections/{collection_name}/points/query/batch").method("post").create({ consistency: true, timeout: true }),
    /**
     * Query points, grouped by a given payload field
     */
    queryPointsGroups: client.path("/collections/{collection_name}/points/query/groups").method("post").create({ consistency: true, timeout: true }),
    /**
     * Facet a payload key with a given filter.
     */
    facet: client.path("/collections/{collection_name}/facet").method("post").create({ consistency: true, timeout: true }),
    /**
     * Search points matrix distance pairs
     */
    searchMatrixPairs: client.path("/collections/{collection_name}/points/search/matrix/pairs").method("post").create({ consistency: true, timeout: true }),
    /**
     * Search points matrix distance offsets
     */
    searchMatrixOffsets: client.path("/collections/{collection_name}/points/search/matrix/offsets").method("post").create({ consistency: true, timeout: true })
  };
}
function createServiceApi(client) {
  return {
    /**
     * Get lock options. If write is locked, all write operations and collection creation are forbidden
     */
    getLocks: client.path("/locks").method("get").create(),
    /**
     * Collect metrics data including app info, collections info, cluster info and statistics
     */
    metrics: client.path("/metrics").method("get").create(),
    /**
     * Set lock options. If write is locked, all write operations and collection creation are forbidden. Returns previous lock options
     */
    postLocks: client.path("/locks").method("post").create(),
    /**
     * Collect telemetry data including app info, system info, collections info, cluster info, configs and statistics
     */
    telemetry: client.path("/telemetry").method("get").create(),
    /**
     * An endpoint for health checking used in Kubernetes.
     */
    healthz: client.path("/healthz").method("get").create(),
    /**
     * An endpoint for health checking used in Kubernetes.
     */
    livez: client.path("/livez").method("get").create(),
    /**
     * An endpoint for health checking used in Kubernetes.
     */
    readyz: client.path("/readyz").method("get").create(),
    /**
     * Returns information about the running Qdrant instance.
     */
    root: client.path("/").method("get").create(),
    /**
     * Get issues
     */
    getIssues: client.path("/issues").method("get").create(),
    /**
     * Clear issues
     */
    clearIssues: client.path("/issues").method("delete").create()
  };
}
function createSnapshotsApi(client) {
  return {
    /**
     * Create new snapshot of the whole storage
     */
    createFullSnapshot: client.path("/snapshots").method("post").create({ wait: true }),
    /**
     * Create new snapshot for a collection
     */
    createSnapshot: client.path("/collections/{collection_name}/snapshots").method("post").create({ wait: true }),
    /**
     * Delete snapshot of the whole storage
     */
    deleteFullSnapshot: client.path("/snapshots/{snapshot_name}").method("delete").create({ wait: true }),
    /**
     * Delete snapshot for a collection
     */
    deleteSnapshot: client.path("/collections/{collection_name}/snapshots/{snapshot_name}").method("delete").create({ wait: true }),
    /**
     * Download specified snapshot of the whole storage as a file
     * @todo Fetcher needs to handle Blob for file downloads
     */
    getFullSnapshot: client.path("/snapshots/{snapshot_name}").method("get").create(),
    /**
     * Download specified snapshot from a collection as a file
     * @todo Fetcher needs to handle Blob for file downloads
     */
    getSnapshot: client.path("/collections/{collection_name}/snapshots/{snapshot_name}").method("get").create(),
    /**
     * Get list of snapshots of the whole storage
     */
    listFullSnapshots: client.path("/snapshots").method("get").create(),
    /**
     * Get list of snapshots for a collection
     */
    listSnapshots: client.path("/collections/{collection_name}/snapshots").method("get").create(),
    /**
     * Recover local collection data from an uploaded snapshot. This will overwrite any data, stored on this node, for the collection. If collection does not exist - it will be created.
     */
    recoverFromUploadedSnapshot: client.path("/collections/{collection_name}/snapshots/upload").method("post").create({ wait: true, priority: true, checksum: true }),
    /**
     * Recover local collection data from a snapshot. This will overwrite any data, stored on this node, for the collection. If collection does not exist - it will be created
     */
    recoverFromSnapshot: client.path("/collections/{collection_name}/snapshots/recover").method("put").create({ wait: true }),
    /**
     * Recover shard of a local collection from an uploaded snapshot. This will overwrite any data, stored on this node, for the collection shard
     */
    recoverShardFromUploadedSnapshot: client.path("/collections/{collection_name}/shards/{shard_id}/snapshots/upload").method("post").create({ wait: true, priority: true, checksum: true }),
    /**
     * Recover shard of a local collection data from a snapshot. This will overwrite any data, stored in this shard, for the collection
     */
    recoverShardFromSnapshot: client.path("/collections/{collection_name}/shards/{shard_id}/snapshots/recover").method("put").create({ wait: true }),
    /**
     * Get list of snapshots for a shard of a collection
     */
    listShardSnapshots: client.path("/collections/{collection_name}/shards/{shard_id}/snapshots").method("get").create(),
    /**
     * Create new snapshot of a shard for a collection
     */
    createShardSnapshot: client.path("/collections/{collection_name}/shards/{shard_id}/snapshots").method("post").create({ wait: true }),
    /**
     * Download specified snapshot of a shard from a collection as a file
     */
    getShardSnapshot: client.path("/collections/{collection_name}/shards/{shard_id}/snapshots/{snapshot_name}").method("get").create(),
    /**
     * Delete snapshot of a shard for a collection
     */
    deleteShardSnapshot: client.path("/collections/{collection_name}/shards/{shard_id}/snapshots/{snapshot_name}").method("delete").create({ wait: true })
  };
}
function createShardsApi(client) {
  return {
    /**
     * Create shard key
     */
    createShardKey: client.path("/collections/{collection_name}/shards").method("put").create({ timeout: true }),
    /**
     * Delete shard key
     */
    deleteShardKey: client.path("/collections/{collection_name}/shards/delete").method("post").create({ timeout: true })
  };
}
var MAX_CONTENT = 200;
var CustomError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var QdrantClientUnexpectedResponseError = class _QdrantClientUnexpectedResponseError extends CustomError {
  static forResponse(response) {
    const statusCodeStr = `${response.status}`;
    const reasonPhraseStr = !response.statusText ? "(Unrecognized Status Code)" : `(${response.statusText})`;
    const statusStr = `${statusCodeStr} ${reasonPhraseStr}`.trim();
    const dataStr = response.data ? JSON.stringify(response.data, null, 2) : null;
    let shortContent = "";
    if (dataStr) {
      shortContent = dataStr.length <= MAX_CONTENT ? dataStr : dataStr.slice(0, -4) + " ...";
    }
    const rawContentStr = `Raw response content:
${shortContent}`;
    return new _QdrantClientUnexpectedResponseError(`Unexpected Response: ${statusStr}
${rawContentStr}`);
  }
};
var QdrantClientConfigError = class extends CustomError {
};
var QdrantClientTimeoutError = class extends CustomError {
};
var QdrantClientResourceExhaustedError = class extends CustomError {
  constructor(message, retryAfter) {
    super(message);
    const retryAfterNumber = Number(retryAfter);
    if (isNaN(retryAfterNumber)) {
      throw new CustomError(`Invalid retryAfter value: ${retryAfter}`);
    }
    this.retry_after = retryAfterNumber;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
function createApis(baseUrl, args) {
  const client = createClient(baseUrl, args);
  return {
    cluster: createClusterApi(client),
    collections: createCollectionsApi(client),
    points: createPointsApi(client),
    service: createServiceApi(client),
    snapshots: createSnapshotsApi(client),
    shards: createShardsApi(client)
  };
}
function createClient(baseUrl, { headers, timeout, connections }) {
  const use = [];
  if (Number.isFinite(timeout)) {
    use.push(async (url, init, next) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        return await next(url, Object.assign(init, { signal: controller.signal }));
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new QdrantClientTimeoutError(e.message);
        }
        throw e;
      } finally {
        clearTimeout(id);
      }
    });
  }
  use.push(async (url, init, next) => {
    let response;
    try {
      response = await next(url, init);
      if (response.status === 200 || response.status === 201) {
        return response;
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const retryAfterHeader = error.headers.get("retry-after")?.[0];
        if (retryAfterHeader) {
          throw new QdrantClientResourceExhaustedError(error.message, retryAfterHeader);
        }
      }
      throw error;
    }
    throw QdrantClientUnexpectedResponseError.forResponse(response);
  });
  const client = Fetcher.for();
  client.configure({
    baseUrl,
    init: {
      headers,
      dispatcher: void 0
    },
    use
  });
  return client;
}
var PACKAGE_VERSION = "1.14.0";
var ClientVersion = {
  /**
   * Parses a version string into a structured Version object.
   * @param version - The version string to parse (e.g., "1.2.3").
   * @returns A Version object.
   * @throws If the version format is invalid.
   */
  parseVersion(version) {
    if (!version) {
      throw new Error("Version is null");
    }
    let major = void 0;
    let minor = void 0;
    [major, minor] = version.split(".", 2);
    major = parseInt(major, 10);
    minor = parseInt(minor, 10);
    if (isNaN(major) || isNaN(minor)) {
      throw new Error(`Unable to parse version, expected format: x.y[.z], found: ${version}`);
    }
    return {
      major,
      minor
    };
  },
  /**
   * Checks if the client version is compatible with the server version.
   * @param clientVersion - The client version string.
   * @param serverVersion - The server version string.
   * @returns True if compatible, otherwise false.
   */
  isCompatible(clientVersion, serverVersion) {
    if (!clientVersion || !serverVersion) {
      console.debug(`Unable to compare versions with null values. Client: ${clientVersion}, Server: ${serverVersion}`);
      return false;
    }
    if (clientVersion === serverVersion)
      return true;
    try {
      const client = ClientVersion.parseVersion(clientVersion);
      const server = ClientVersion.parseVersion(serverVersion);
      return client.major === server.major && Math.abs(client.minor - server.minor) <= 1;
    } catch (error) {
      console.debug(`Unable to compare versions: ${error}`);
      return false;
    }
  }
};
var QdrantClient = class {
  constructor({ url, host, apiKey, https, prefix, port = 6333, timeout = 3e5, checkCompatibility = true, ...args } = {}) {
    this._https = https ?? typeof apiKey === "string";
    this._scheme = this._https ? "https" : "http";
    this._prefix = prefix ?? "";
    if (this._prefix.length > 0 && !this._prefix.startsWith("/")) {
      this._prefix = `/${this._prefix}`;
    }
    if (url && host) {
      throw new QdrantClientConfigError(`Only one of \`url\`, \`host\` params can be set. Url is ${url}, host is ${host}`);
    }
    if (host && (host.startsWith("http://") || host.startsWith("https://") || /:\d+$/.test(host))) {
      throw new QdrantClientConfigError("The `host` param is not expected to contain neither protocol (http:// or https://) nor port (:6333).\nTry to use the `url` parameter instead.");
    } else if (url) {
      if (!(url.startsWith("http://") || url.startsWith("https://"))) {
        throw new QdrantClientConfigError("The `url` param expected to contain a valid URL starting with a protocol (http:// or https://).");
      }
      const parsedUrl = new URL(url);
      this._host = parsedUrl.hostname;
      this._port = parsedUrl.port ? Number(parsedUrl.port) : port;
      this._scheme = parsedUrl.protocol.replace(":", "");
      if (this._prefix.length > 0 && parsedUrl.pathname !== "/") {
        throw new QdrantClientConfigError(`Prefix can be set either in \`url\` or in \`prefix\`.
url is ${url}, prefix is ${parsedUrl.pathname}`);
      }
    } else {
      this._port = port;
      this._host = host ?? "127.0.0.1";
    }
    const headers = new Headers([["user-agent", "qdrant-js/" + String(PACKAGE_VERSION)]]);
    const metadata = args.headers ?? {};
    Object.keys(metadata).forEach((field) => {
      if (metadata[field]) {
        headers.set(field, String(metadata[field]));
      }
    });
    if (typeof apiKey === "string") {
      if (this._scheme === "http") {
        console.warn("Api key is used with unsecure connection.");
      }
      headers.set("api-key", apiKey);
    }
    const address = this._port ? `${this._host}:${this._port}` : this._host;
    this._restUri = `${this._scheme}://${address}${this._prefix}`;
    const connections = args.maxConnections;
    const restArgs = { headers, timeout, connections };
    this._openApiClient = createApis(this._restUri, restArgs);
    if (checkCompatibility) {
      this._openApiClient.service.root({}).then((response) => {
        const serverVersion = response.data.version;
        if (!ClientVersion.isCompatible(PACKAGE_VERSION, serverVersion)) {
          console.warn(`Client version ${PACKAGE_VERSION} is incompatible with server version ${serverVersion}. Major versions should match and minor version difference must not exceed 1. Set checkCompatibility=false to skip version check.`);
        }
      }).catch(() => {
        console.warn(`Failed to obtain server version. Unable to check client-server compatibility. Set checkCompatibility=false to skip version check.`);
      });
    }
  }
  /**
   * API getter
   *
   * @returns An instance of an API, generated from OpenAPI schema.
   */
  api(name) {
    return this._openApiClient[name];
  }
  /**
   * Search for points in multiple collections
   *
   * @param collectionName Name of the collection
   * @param {object} args -
   *     - searches: List of search requests
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   * @returns List of search responses
   */
  async searchBatch(collection_name, { searches, consistency, timeout }) {
    const response = await this._openApiClient.points.searchBatchPoints({
      collection_name,
      consistency,
      timeout,
      searches
    });
    return maybe(response.data.result).orThrow("Search batch returned empty");
  }
  /**
   * Search for closest vectors in collection taking into account filtering conditions
   *
   * @param collection_name Collection to search in
   * @param {object} args -
   *      - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *      - vector:
   *          Search for vectors closest to this.
   *          Can be either a vector itself, or a named vector, or a tuple of vector name and vector itself
   *      - filter:
   *          - Exclude vectors which doesn't fit given conditions.
   *          - If `None` - search among all vectors
   *      - params: Additional search params
   *      - limit: How many results return
   *      - offset:
   *          Offset of the first result to return.
   *          May be used to paginate results.
   *          Note: large offset values may cause performance issues.
   *      - with_payload:
   *          - Specify which stored payload should be attached to the result.
   *          - If `True` - attach all payload
   *          - If `False` - do not attach any payload
   *          - If List of string - include only specified fields
   *          - If `PayloadSelector` - use explicit rules
   *      - with_vector:
   *          - If `True` - Attach stored vector to the search result.
   *          - If `False` - Do not attach vector.
   *          - If List of string - include only specified fields
   *          - Default: `False`
   *      - score_threshold:
   *          Define a minimal score threshold for the result.
   *          If defined, less similar results will not be returned.
   *          Score of the returned result might be higher or smaller than the threshold depending
   *          on the Distance function used.
   *          E.g. for cosine similarity only higher scores will be returned.
   *      - consistency:
   *          Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *          Values:
   *              - int - number of replicas to query, values should present in all queried replicas
   *              - 'majority' - query all replicas, but return values present in the majority of replicas
   *              - 'quorum' - query the majority of replicas, return values present in all of them
   *              - 'all' - query all replicas, and return values present in all replicas
   *      - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   * @example
   *     // Search with filter
   *     client.search(
   *         "test_collection",
   *         {
   *             vector: [1.0, 0.1, 0.2, 0.7],
   *             filter: {
   *                 must: [
   *                     {
   *                         key: 'color',
   *                         range: {
   *                             color: 'red'
   *                         }
   *                     }
   *                 ]
   *             )
   *         }
   *     )
   * @returns List of found close points with similarity scores.
   */
  async search(collection_name, { shard_key, vector, limit = 10, offset = 0, filter, params, with_payload = true, with_vector = false, score_threshold, consistency, timeout }) {
    const response = await this._openApiClient.points.searchPoints({
      collection_name,
      consistency,
      timeout,
      shard_key,
      vector,
      limit,
      offset,
      filter,
      params,
      with_payload,
      with_vector,
      score_threshold
    });
    return maybe(response.data.result).orThrow("Search returned empty");
  }
  /**
   * Perform multiple recommend requests in batch mode
   * @param collection_name Name of the collection
   * @param {object} args
   *     - searches: List of recommend requests
   *     - consistency:
   *         Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             - number - number of replicas to query, values should present in all queried replicas
   *             - 'majority' - query all replicas, but return values present in the majority of replicas
   *             - 'quorum' - query the majority of replicas, return values present in all of them
   *             - 'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   * @returns List of recommend responses
   */
  async recommendBatch(collection_name, { searches, consistency, timeout }) {
    const response = await this._openApiClient.points.recommendBatchPoints({
      collection_name,
      searches,
      consistency,
      timeout
    });
    return maybe(response.data.result).orElse([]);
  }
  /**
   * @alias recommendBatch
   */
  async recommend_batch(collection_name, { searches, consistency, timeout }) {
    const response = await this._openApiClient.points.recommendBatchPoints({
      collection_name,
      searches,
      consistency,
      timeout
    });
    return maybe(response.data.result).orElse([]);
  }
  /**
   * Recommendation request. Provides positive and negative examples of the vectors,
   * which can be ids of points that are already stored in the collection, raw vectors, or even ids and vectors combined.
   * Service should look for the points which are closer to positive examples and at the same time further to negative examples.
   * The concrete way of how to compare negative and positive distances is up to the `strategy` chosen.
   * @param collection_name Collection to search in
   * @param {object} args
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - positive:
   *         List of stored point IDs, which should be used as reference for similarity search.
   *         If there is only one ID provided - this request is equivalent to the regular search with vector of that point.
   *         If there are more than one IDs, Qdrant will attempt to search for similar to all of them.
   *         Recommendation for multiple vectors is experimental. Its behaviour may change in the future.
   *     - negative:
   *         List of stored point IDs, which should be dissimilar to the search result.
   *         Negative examples is an experimental functionality. Its behaviour may change in the future.
   *     - strategy:
   *         How to use positive and negative examples to find the results.
   *     - query_filter:
   *         - Exclude vectors which doesn't fit given conditions.
   *         - If `None` - search among all vectors
   *     - search_params: Additional search params
   *     - limit: How many results return
   *         - Default: `10`
   *     - offset:
   *         Offset of the first result to return.
   *         May be used to paginate results.
   *         Note: large offset values may cause performance issues.
   *         - Default: `0`
   *     - with_payload:
   *         - Specify which stored payload should be attached to the result.
   *         - If `True` - attach all payload
   *         - If `False` - do not attach any payload
   *         - If List of string - include only specified fields
   *         - If `PayloadSelector` - use explicit rules
   *         - Default: `true`
   *     - with_vector:
   *         - If `True` - Attach stored vector to the search result.
   *         - If `False` - Do not attach vector.
   *         - If List of string - include only specified fields
   *         - Default: `false`
   *     - score_threshold:
   *         Define a minimal score threshold for the result.
   *         If defined, less similar results will not be returned.
   *         Score of the returned result might be higher or smaller than the threshold depending
   *         on the Distance function used.
   *         E.g. for cosine similarity only higher scores will be returned.
   *     - using:
   *         Name of the vectors to use for recommendations.
   *         If `None` - use default vectors.
   *     - lookupFrom:
   *         Defines a location (collection and vector field name), used to lookup vectors for recommendations.
   *         If `None` - use current collection will be used.
   *     - consistency:
   *         Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *         - int - number of replicas to query, values should present in all queried replicas
   *         - 'majority' - query all replicas, but return values present in the majority of replicas
   *         - 'quorum' - query the majority of replicas, return values present in all of them
   *         - 'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   * @returns List of recommended points with similarity scores.
   */
  async recommend(collection_name, { shard_key, positive, negative, strategy, filter, params, limit = 10, offset = 0, with_payload = true, with_vector = false, score_threshold, using, lookup_from, consistency, timeout }) {
    const response = await this._openApiClient.points.recommendPoints({
      collection_name,
      limit,
      shard_key,
      positive,
      negative,
      strategy,
      filter,
      params,
      offset,
      with_payload,
      with_vector,
      score_threshold,
      using,
      lookup_from,
      consistency,
      timeout
    });
    return maybe(response.data.result).orThrow("Recommend points API returned empty");
  }
  /**
   * Scroll over all (matching) points in the collection.
   * @param collection_name Name of the collection
   * @param {object} args
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - filter: If provided - only returns points matching filtering conditions
   *     - limit: How many points to return
   *     - offset: If provided - skip points with ids less than given `offset`
   *     - with_payload:
   *         - Specify which stored payload should be attached to the result.
   *         - If `True` - attach all payload
   *         - If `False` - do not attach any payload
   *         - If List of string - include only specified fields
   *         - If `PayloadSelector` - use explicit rules
   *         - Default: `true`
   *     - with_vector:
   *         - If `True` - Attach stored vector to the search result.
   *         - If `False` - Do not attach vector.
   *         - If List of string - include only specified fields
   *         - Default: `false`
   *     - consistency:
   *         Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *         - int - number of replicas to query, values should present in all queried replicas
   *         - 'majority' - query all replicas, but return values present in the majority of replicas
   *         - 'quorum' - query the majority of replicas, return values present in all of them
   *         - 'all' - query all replicas, and return values present in all replicas
   *     - order_by:
   *         Order the records by a payload field.
   * @returns
   *     A pair of (List of points) and (optional offset for the next scroll request).
   *     If next page offset is `None` - there is no more points in the collection to scroll.
   */
  async scroll(collection_name, { shard_key, filter, consistency, timeout, limit = 10, offset, with_payload = true, with_vector = false, order_by } = {}) {
    const response = await this._openApiClient.points.scrollPoints({
      collection_name,
      shard_key,
      limit,
      offset,
      filter,
      with_payload,
      with_vector,
      order_by,
      consistency,
      timeout
    });
    return maybe(response.data.result).orThrow("Scroll points API returned empty");
  }
  /**
   * Count points in the collection.
   * Count points in the collection matching the given filter.
   * @param collection_name
   * @param {object} args
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - filter: filtering conditions
   *     - exact:
   *         If `True` - provide the exact count of points matching the filter.
   *         If `False` - provide the approximate count of points matching the filter. Works faster.
   *         Default: `true`
   * @returns Amount of points in the collection matching the filter.
   */
  async count(collection_name, { shard_key, filter, exact = true, timeout } = {}) {
    const response = await this._openApiClient.points.countPoints({
      collection_name,
      shard_key,
      filter,
      exact,
      timeout
    });
    return maybe(response.data.result).orThrow("Count points returned empty");
  }
  /**
   * Get cluster information for a collection.
   * @param collection_name
   * @returns Operation result
   */
  async collectionClusterInfo(collection_name) {
    const response = await this._openApiClient.collections.collectionClusterInfo({ collection_name });
    return maybe(response.data.result).orThrow("Collection cluster info returned empty");
  }
  /**
   * Update vectors
   * @param collection_name
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *         - Default: `true`
   *     - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - points: Points with named vectors
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   * @returns Operation result
   */
  async updateVectors(collection_name, { wait = true, ordering, points, shard_key }) {
    const response = await this._openApiClient.points.updateVectors({
      collection_name,
      wait,
      ordering,
      points,
      shard_key
    });
    return maybe(response.data.result).orThrow("Update vectors returned empty");
  }
  /**
   * Delete vectors
   * @param collection_name
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *         - Default: `true`
   *     - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - points: Deletes values from each point in this list
   *     - filter: Deletes values from points that satisfy this filter condition
   *     - vector: Vector names
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   * @returns Operation result
   */
  async deleteVectors(collection_name, { wait = true, ordering, points, filter, vector, shard_key }) {
    const response = await this._openApiClient.points.deleteVectors({
      collection_name,
      wait,
      ordering,
      points,
      filter,
      vector,
      shard_key
    });
    return maybe(response.data.result).orThrow("Delete vectors returned empty");
  }
  /**
   * Search point groups
   * @param collection_name
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - vector: query search vector
   *     - filter: Look only for points which satisfies this conditions
   *     - params: Additional search params
   *     - with_payload: Select which payload to return with the response
   *     - with_vector: Whether to return the point vector with the result?
   *     - score_threshold: Define a minimal score threshold for the result. If defined, less similar results will not be returned. Score of the returned result might be higher or smaller than the threshold depending on the Distance function used. E.g. for cosine similarity only higher scores will be returned.
   *     - group_by: Payload field to group by, must be a string or number field. If the field contains more than 1 value, all values will be used for grouping. One point can be in multiple groups.
   *     - group_size: Maximum amount of points to return per group
   *     - limit: Maximum amount of groups to return
   * @returns Operation result
   */
  async searchPointGroups(collection_name, { consistency, timeout, shard_key, vector, filter, params, with_payload = null, with_vector = null, score_threshold, group_by, group_size, limit }) {
    const response = await this._openApiClient.points.searchPointGroups({
      collection_name,
      consistency,
      timeout,
      shard_key,
      vector,
      filter,
      params,
      with_payload,
      with_vector,
      score_threshold,
      group_by,
      group_size,
      limit
    });
    return maybe(response.data.result).orThrow("Search point groups returned empty");
  }
  /**
   * Recommend point groups
   * @param collection_name
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - positive: Look for vectors closest to those
   *     - negative: Try to avoid vectors like this
   *     - strategy: How to use positive and negative examples to find the results
   *     - filter: Look only for points which satisfies this conditions
   *     - params: Additional search params
   *     - with_payload: Select which payload to return with the response
   *     - with_vector: Whether to return the point vector with the result?
   *     - score_threshold: Define a minimal score threshold for the result. If defined, less similar results will not be returned. Score of the returned result might be higher or smaller than the threshold depending on the Distance function used. E.g. for cosine similarity only higher scores will be returned.
   *     - using: Define which vector to use for recommendation, if not specified - try to use default vector
   *     - lookup_from: The location used to lookup vectors. If not specified - use current collection. Note: the other collection should have the same vector size as the current collection
   *     - group_by: Payload field to group by, must be a string or number field. If the field contains more than 1 value, all values will be used for grouping. One point can be in multiple groups.
   *     - group_size: Maximum amount of points to return per group
   *     - limit: Maximum amount of groups to return
   * @returns Operation result
   */
  async recommendPointGroups(collection_name, { consistency, timeout, shard_key, positive, strategy, negative = [], filter, params, with_payload = null, with_vector = null, score_threshold, using = null, lookup_from = null, group_by, group_size, limit }) {
    const response = await this._openApiClient.points.recommendPointGroups({
      collection_name,
      consistency,
      timeout,
      shard_key,
      positive,
      negative,
      strategy,
      filter,
      params,
      with_payload,
      with_vector,
      score_threshold,
      using,
      lookup_from,
      group_by,
      group_size,
      limit
    });
    return maybe(response.data.result).orThrow("Recommend point groups API returned empty");
  }
  /**
   * Update or insert a new point into the collection.
   * @param collection_name
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *         - Default: `true`
   *     - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - points: Batch or list of points to insert
   * @returns Operation result
   */
  async upsert(collection_name, { wait = true, ordering, ...points_or_batch }) {
    const response = await this._openApiClient.points.upsertPoints({
      collection_name,
      wait,
      ordering,
      ...points_or_batch
    });
    return maybe(response.data.result).orThrow("Upsert returned empty");
  }
  /**
   * Retrieve stored points by IDs
   * @param collection_name
   * @param {object} args
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - ids: list of IDs to lookup
   *     - with_payload:
   *         - Specify which stored payload should be attached to the result.
   *         - If `True` - attach all payload
   *         - If `False` - do not attach any payload
   *         - If List of string - include only specified fields
   *         - If `PayloadSelector` - use explicit rules
   *         - Default: `true`
   *     - with_vector:
   *         - If `True` - Attach stored vector to the search result.
   *         - If `False` - Do not attach vector.
   *         - If List of string - Attach only specified vectors.
   *         - Default: `false`
   *     - consistency:
   *         Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *             Values:
   *                 - number - number of replicas to query, values should present in all queried replicas
   *                 - 'majority' - query all replicas, but return values present in the majority of replicas
   *                 - 'quorum' - query the majority of replicas, return values present in all of them
   *                 - 'all' - query all replicas, and return values present in all replicas
   * @returns List of points
   */
  async retrieve(collection_name, { shard_key, ids, with_payload = true, with_vector, consistency, timeout }) {
    const response = await this._openApiClient.points.getPoints({
      collection_name,
      shard_key,
      ids,
      with_payload,
      with_vector,
      consistency,
      timeout
    });
    return maybe(response.data.result).orThrow("Retrieve API returned empty");
  }
  /**
   * Deletes selected points from collection
   * @param collection_name Name of the collection
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *      - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - points_selector: List of affected points, filter or points selector.
   *         Example:
   *             - `points: [
   *                   1, 2, 3, "cd3b53f0-11a7-449f-bc50-d06310e7ed90"
   *               ]`
   *             - `filter: {
   *                    must: [
   *                        {
   *                            key: 'rand_number',
   *                            range: {
   *                                gte: 0.7
   *                            }
   *                        }
   *                    ]
   *                }`
   * @returns Operation result
   */
  async delete(collection_name, { wait, ordering, ...points_selector }) {
    const response = await this._openApiClient.points.deletePoints({
      collection_name,
      wait,
      ordering,
      ...points_selector
    });
    return maybe(response.data.result).orThrow("Delete points returned empty");
  }
  /**
   * Sets payload values for specified points.
   * @param collection_name Name of the collection
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *      - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - payload: Key-value pairs of payload to assign
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - key: Assigns payload to each point that satisfy this path of property
   *     - points|filter: List of affected points, filter or points selector.
   *         Example:
   *             - `points: [
   *                   1, 2, 3, "cd3b53f0-11a7-449f-bc50-d06310e7ed90"
   *               ]`
   *             - `filter: {
   *                    must: [
   *                        {
   *                            key: 'rand_number',
   *                            range: {
   *                                gte: 0.7
   *                            }
   *                        }
   *                    ]
   *                }`
   * @returns Operation result
   */
  async setPayload(collection_name, { payload, points, filter, shard_key, key, ordering, wait = true }) {
    const response = await this._openApiClient.points.setPayload({
      collection_name,
      payload,
      points,
      filter,
      shard_key,
      key,
      wait,
      ordering
    });
    return maybe(response.data.result).orThrow("Set payload returned empty");
  }
  /**
   * Overwrites payload of the specified points
   * After this operation is applied, only the specified payload will be present in the point.
   * The existing payload, even if the key is not specified in the payload, will be deleted.
   * @param collection_name Name of the collection
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *      - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - payload: Key-value pairs of payload to assign
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - key: Assigns payload to each point that satisfy this path of property
   *     - points|filter: List of affected points, filter or points selector.
   *         Example:
   *             - `points: [
   *                   1, 2, 3, "cd3b53f0-11a7-449f-bc50-d06310e7ed90"
   *               ]`
   *             - `filter: {
   *                    must: [
   *                        {
   *                            key: 'rand_number',
   *                            range: {
   *                                gte: 0.7
   *                            }
   *                        }
   *                    ]
   *                }`
   * @returns Operation result
   */
  async overwritePayload(collection_name, { ordering, payload, points, filter, shard_key, key, wait = true }) {
    const response = await this._openApiClient.points.overwritePayload({
      collection_name,
      payload,
      points,
      filter,
      shard_key,
      key,
      wait,
      ordering
    });
    return maybe(response.data.result).orThrow("Overwrite payload returned empty");
  }
  /**
   * Remove values from point's payload
   * @param collection_name Name of the collection
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *      - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - keys: List of payload keys to remove.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - points|filter: List of affected points, filter or points selector.
   *         Example:
   *             - `points: [
   *                   1, 2, 3, "cd3b53f0-11a7-449f-bc50-d06310e7ed90"
   *               ]`
   *             - `filter: {
   *                    must: [
   *                        {
   *                            key: 'rand_number',
   *                            range: {
   *                                gte: 0.7
   *                            }
   *                        }
   *                    ]
   *                }`
   * @returns Operation result
   */
  async deletePayload(collection_name, { ordering, keys, points, filter, shard_key, wait = true }) {
    const response = await this._openApiClient.points.deletePayload({
      collection_name,
      keys,
      points,
      filter,
      shard_key,
      wait,
      ordering
    });
    return maybe(response.data.result).orThrow("Delete payload returned empty");
  }
  /**
   * Delete all payload for selected points
   * @param collection_name Name of the collection
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *      - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *     - points_selector: List of affected points, filter or points selector.
   *         Example:
   *             - `points: [
   *                   1, 2, 3, "cd3b53f0-11a7-449f-bc50-d06310e7ed90"
   *               ]`
   *             - `filter: {
   *                    must: [
   *                        {
   *                            key: 'rand_number',
   *                            range: {
   *                                gte: 0.7
   *                            }
   *                        }
   *                    ]
   *                }`
   * @returns Operation result
   */
  async clearPayload(collection_name, { ordering, wait = true, ...points_selector }) {
    const response = await this._openApiClient.points.clearPayload({
      collection_name,
      wait,
      ordering,
      ...points_selector
    });
    return maybe(response.data.result).orThrow("Clear payload returned empty");
  }
  /**
   * Operation for performing changes of collection aliases.
   * Alias changes are atomic, meaning that no collection modifications can happen between alias operations.
   * @param {object} args
   *     - actions: List of operations to perform
   *     - timeout: Wait for operation commit timeout in seconds. If timeout is reached, request will return with service error.
   * @returns Operation result
   */
  async updateCollectionAliases({ actions, timeout }) {
    const response = await this._openApiClient.collections.updateAliases({ actions, timeout });
    return maybe(response.data.result).orThrow("Update aliases returned empty");
  }
  /**
   * Get collection aliases
   * @param collection_name Name of the collection
   * @returns Collection aliases
   */
  async getCollectionAliases(collection_name) {
    const response = await this._openApiClient.collections.getCollectionAliases({ collection_name });
    return maybe(response.data.result).orThrow("Get collection aliases returned empty");
  }
  /**
   * Get all aliases
   * @returns All aliases of all collections
   */
  async getAliases() {
    const response = await this._openApiClient.collections.getCollectionsAliases({});
    return maybe(response.data.result).orThrow("Get aliases returned empty");
  }
  /**
   * Get list name of all existing collections
   * @returns List of the collections
   */
  async getCollections() {
    const response = await this._openApiClient.collections.getCollections({});
    return maybe(response.data.result).orThrow("Get collections returned empty");
  }
  /**
   * Get detailed information about specified existing collection
   *
   * @param collection_name Name of the collection
   * @returns Detailed information about the collection
   */
  async getCollection(collection_name) {
    const response = await this._openApiClient.collections.getCollection({ collection_name });
    return maybe(response.data.result).orThrow("Get collection returned empty");
  }
  /**
   * Update parameters of the collection
   *
   * @param collection_name Name of the collection
   * @param {object} args
   *     - optimizer_config: Override for optimizer configuration
   *     - collection_params: Override for collection parameters
   *     - timeout: Wait for operation commit timeout in seconds. If timeout is reached, request will return with service error.
   * @returns Operation result
   */
  async updateCollection(collection_name, args) {
    const response = await this._openApiClient.collections.updateCollection({
      collection_name,
      ...args
    });
    return maybe(response.data.result).orThrow("Update collection returned empty");
  }
  /**
   * Removes collection and all it's data
   * @param collection_name Name of the collection to delete
   * @param {object} args
   *     - timeout:
   *         Wait for operation commit timeout in seconds.
   *         If timeout is reached, request will return with service error.
   * @returns Operation result
   */
  async deleteCollection(collection_name, args) {
    const response = await this._openApiClient.collections.deleteCollection({ collection_name, ...args });
    return maybe(response.data.result).orThrow("Delete collection returned empty");
  }
  /**
   * Create empty collection with given parameters
   * @returns Operation result
   * @param collectionName Name of the collection to recreate
   * @param {object} args
   *     - vectors_config:
   *         Configuration of the vector storage. Vector params contains size and distance for the vector storage.
   *         If dict is passed, service will create a vector storage for each key in the dict.
   *         If single VectorParams is passed, service will create a single anonymous vector storage.
   *     - shard_number: Number of shards in collection. Default is 1, minimum is 1.
   *     - sharding_method: Sharding method Default is Auto - points are distributed across all available shards Custom - points are distributed across shards according to shard key
   *     - replication_factor:
   *         Replication factor for collection. Default is 1, minimum is 1.
   *         Defines how many copies of each shard will be created.
   *         Have effect only in distributed mode.
   *     - write_consistency_factor:
   *         Write consistency factor for collection. Default is 1, minimum is 1.
   *         Defines how many replicas should apply the operation for us to consider it successful.
   *         Increasing this number will make the collection more resilient to inconsistencies, but will
   *         also make it fail if not enough replicas are available.
   *         Does not have any performance impact.
   *         Have effect only in distributed mode.
   *     - on_disk_payload:
   *         If true - point`s payload will not be stored in memory.
   *         It will be read from the disk every time it is requested.
   *         This setting saves RAM by (slightly) increasing the response time.
   *         Note: those payload values that are involved in filtering and are indexed - remain in RAM.
   *     - hnsw_config: Params for HNSW index
   *     - optimizers_config: Params for optimizer
   *     - wal_config: Params for Write-Ahead-Log
   *     - quantization_config: Params for quantization, if None - quantization will be disabled
   *     - init_from: Use data stored in another collection to initialize this collection
   *     - sparse_vectors: Sparse vector data config
   *     - strict_mode_config: Strict mode configuration
   *     - timeout:
   *         Wait for operation commit timeout in seconds.
   *         If timeout is reached, request will return with service error.
   */
  async createCollection(collection_name, { timeout, vectors, hnsw_config, init_from, on_disk_payload, optimizers_config, quantization_config, replication_factor, shard_number, sharding_method, wal_config, write_consistency_factor, sparse_vectors, strict_mode_config }) {
    const response = await this._openApiClient.collections.createCollection({
      collection_name,
      timeout,
      vectors,
      hnsw_config,
      init_from,
      on_disk_payload,
      optimizers_config,
      quantization_config,
      replication_factor,
      shard_number,
      sharding_method,
      wal_config,
      write_consistency_factor,
      sparse_vectors,
      strict_mode_config
    });
    return maybe(response.data.result).orThrow("Create collection returned empty");
  }
  /**
   * Delete and create empty collection with given parameters
   * @returns Operation result
   * @param collectionName Name of the collection to recreate
   * @param {object} args
   *     - vectorsConfig:
   *         Configuration of the vector storage. Vector params contains size and distance for the vector storage.
   *         If dict is passed, service will create a vector storage for each key in the dict.
   *         If single VectorParams is passed, service will create a single anonymous vector storage.
   *     - shardNumber: Number of shards in collection. Default is 1, minimum is 1.
   *     - sharding_method: Sharding method Default is Auto - points are distributed across all available shards Custom - points are distributed across shards according to shard key
   *     - replicationFactor:
   *         Replication factor for collection. Default is 1, minimum is 1.
   *         Defines how many copies of each shard will be created.
   *         Have effect only in distributed mode.
   *     - writeConsistencyFactor:
   *         Write consistency factor for collection. Default is 1, minimum is 1.
   *         Defines how many replicas should apply the operation for us to consider it successful.
   *         Increasing this number will make the collection more resilient to inconsistencies, but will
   *         also make it fail if not enough replicas are available.
   *         Does not have any performance impact.
   *         Have effect only in distributed mode.
   *     - onDiskPayload:
   *         If true - point`s payload will not be stored in memory.
   *         It will be read from the disk every time it is requested.
   *         This setting saves RAM by (slightly) increasing the response time.
   *         Note: those payload values that are involved in filtering and are indexed - remain in RAM.
   *     - hnswConfig: Params for HNSW index
   *     - optimizersConfig: Params for optimizer
   *     - walConfig: Params for Write-Ahead-Log
   *     - quantizationConfig: Params for quantization, if None - quantization will be disabled
   *     - initFrom: Use data stored in another collection to initialize this collection
   *     - sparse_vectors: Sparse vector data config
   *     - strict_mode_config: Strict mode configuration
   *     - timeout:
   *         Wait for operation commit timeout in seconds.
   *         If timeout is reached, request will return with service error.
   */
  async recreateCollection(collection_name, { timeout, vectors, hnsw_config, init_from, on_disk_payload, optimizers_config, quantization_config, replication_factor, shard_number, sharding_method, wal_config, write_consistency_factor, sparse_vectors, strict_mode_config }) {
    maybe(await this._openApiClient.collections.deleteCollection({
      collection_name,
      timeout
    })).get("ok").orThrow("Delete collection returned failed");
    const response = await this._openApiClient.collections.createCollection({
      collection_name,
      timeout,
      vectors,
      hnsw_config,
      init_from,
      on_disk_payload,
      optimizers_config,
      quantization_config,
      replication_factor,
      shard_number,
      sharding_method,
      wal_config,
      write_consistency_factor,
      sparse_vectors,
      strict_mode_config
    });
    return maybe(response).orThrow("Create collection returned empty");
  }
  /**
   * Creates index for a given payload field.
   * Indexed fields allow to perform filtered search operations faster.
   * @param collectionName Name of the collection
   * @param {object} args
   *     - fieldName: Name of the payload field.
   *     - fieldSchema: Type of data to index.
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *     - ordering:
   *         Define strategy for ordering of the points. Possible values:
   *         - 'weak'   - write operations may be reordered, works faster, default
   *         - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *         - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   * @returns Operation Result
   */
  async createPayloadIndex(collection_name, { wait, ordering, field_name, field_schema }) {
    const response = await this._openApiClient.collections.createFieldIndex({
      collection_name,
      field_name,
      field_schema,
      wait,
      ordering
    });
    return maybe(response.data.result).orThrow("Create field index returned empty");
  }
  /**
   * Removes index for a given payload field.
   * @param collection_name Name of the collection
   * @param field_name Name of the payload field
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *     - ordering:
   *         Define strategy for ordering of the points. Possible values:
   *         - 'weak'   - write operations may be reordered, works faster, default
   *         - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *         - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   * @returns Operation Result
   */
  async deletePayloadIndex(collection_name, field_name, { wait = true, ordering } = {}) {
    const response = await this._openApiClient.collections.deleteFieldIndex({
      collection_name,
      field_name,
      wait,
      ordering
    });
    return maybe(response.data.result).orThrow("Delete field index returned empty");
  }
  /**
   * List all snapshots for a given collection
   * @param collection_name Name of the collection
   * @returns List of snapshots
   */
  async listSnapshots(collection_name) {
    const response = await this._openApiClient.snapshots.listSnapshots({ collection_name });
    return maybe(response.data.result).orThrow("List snapshots API returned empty");
  }
  /**
   * Create snapshot for a given collection
   * @param collection_name Name of the collection
   * @returns Snapshot description
   */
  async createSnapshot(collection_name, args) {
    const response = await this._openApiClient.snapshots.createSnapshot({ collection_name, ...args });
    return maybe(response.data.result).orNull();
  }
  /**
   * Delete snapshot for a given collection
   * @param collection_name Name of the collection
   * @param snapshot_name Snapshot id
   * @returns True if snapshot was deleted
   */
  async deleteSnapshot(collection_name, snapshot_name, args) {
    const response = await this._openApiClient.snapshots.deleteSnapshot({ collection_name, snapshot_name, ...args });
    return maybe(response.data.result).orThrow("Delete snapshot API returned empty");
  }
  /**
   * List all snapshots for a whole storage
   * @returns List of snapshots
   */
  async listFullSnapshots() {
    const response = await this._openApiClient.snapshots.listFullSnapshots({});
    return maybe(response.data.result).orThrow("List full snapshots API returned empty");
  }
  /**
   * Create snapshot for a whole storage
   * @returns Snapshot description
   */
  async createFullSnapshot(args) {
    const response = await this._openApiClient.snapshots.createFullSnapshot(args ?? {});
    return maybe(response.data.result).orThrow("Create full snapshot API returned empty");
  }
  /**
   * Delete snapshot for a whole storage
   * @param snapshot_name Snapshot name
   * @returns True if the snapshot was deleted
   */
  async deleteFullSnapshot(snapshot_name, args) {
    const response = await this._openApiClient.snapshots.deleteFullSnapshot({ snapshot_name, ...args });
    return maybe(response.data.result).orThrow("Delete full snapshot API returned empty");
  }
  /**
   * Recover collection from snapshot
   * @param collection_name Name of the collection
   * @param {object} args
   *     - location:
   *         URL of the snapshot.
   *         Example:
   *             - URL `http://localhost:8080/collections/my_collection/snapshots/my_snapshot`
   *             - Local path `file:///qdrant/snapshots/test_collection-2022-08-04-10-49-10.snapshot`
   *     - priority:
   *         Defines source of truth for snapshot recovery
   *             - `snapshot` means - prefer snapshot data over the current state
   *             - `replica` means - prefer existing data over the snapshot
   *         Default: `replica`
   *     - checksum:
   *         SHA256 checksum to verify snapshot integrity before recovery
   * @returns True if the snapshot was recovered
   */
  async recoverSnapshot(collection_name, { location, priority, checksum, api_key }) {
    const response = await this._openApiClient.snapshots.recoverFromSnapshot({
      collection_name,
      location,
      priority,
      checksum,
      api_key
    });
    return maybe(response.data.result).orThrow("Recover from snapshot API returned empty");
  }
  /**
   * Lock storage for writing
   */
  async lockStorage(reason) {
    const response = await this._openApiClient.service.postLocks({ write: true, error_message: reason });
    return maybe(response.data.result).orThrow("Lock storage returned empty");
  }
  /**
   * Unlock storage for writing.
   */
  async unlockStorage() {
    const response = await this._openApiClient.service.postLocks({ write: false });
    return maybe(response.data.result).orThrow("Post locks returned empty");
  }
  /**
   * Get current locks state.
   */
  async getLocks() {
    const response = await this._openApiClient.service.getLocks({});
    return maybe(response.data.result).orThrow("Get locks returned empty");
  }
  /**
   * Batch update points
   * Apply a series of update operations for points, vectors and payloads.
   * @param collection_name Name of the collection
   * @param {object} args
   *     - wait: Await for the results to be processed.
   *         - If `true`, result will be returned only when all changes are applied
   *         - If `false`, result will be returned immediately after the confirmation of receiving.
   *      - ordering: Define strategy for ordering of the points. Possible values:
   *          - 'weak'   - write operations may be reordered, works faster, default
   *          - 'medium' - write operations go through dynamically selected leader,
   *                      may be inconsistent for a short period of time in case of leader change
   *          - 'strong' - Write operations go through the permanent leader,
   *                      consistent, but may be unavailable if leader is down
   *      - operations: List of operations to perform
   * @returns Operation result
   */
  async batchUpdate(collection_name, { wait = true, ordering, ...operations }) {
    const response = await this._openApiClient.points.batchUpdate({
      collection_name,
      wait,
      ordering,
      ...operations
    });
    return maybe(response.data.result).orThrow("Batch update returned empty");
  }
  /**
   * Recover from a snapshot
   * @param collection_name Name of the collection
   * @param shard_id Shard ID
   * @returns Operation result
   */
  async recoverShardFromSnapshot(collection_name, shard_id, { wait = true, ...shard_snapshot_recover }) {
    const response = await this._openApiClient.snapshots.recoverShardFromSnapshot({
      collection_name,
      shard_id,
      wait,
      ...shard_snapshot_recover
    });
    return maybe(response.data.result).orThrow("Recover shard from snapshot returned empty");
  }
  /**
   * Get list of snapshots for a shard of a collection
   * @param collection_name Name of the collection
   * @param shard_id Shard ID
   * @returns Operation result
   */
  async listShardSnapshots(collection_name, shard_id) {
    const response = await this._openApiClient.snapshots.listShardSnapshots({
      collection_name,
      shard_id
    });
    return maybe(response.data.result).orThrow("List shard snapshots returned empty");
  }
  /**
   * Create new snapshot of a shard for a collection
   * @param collection_name Name of the collection
   * @param shard_id Shard ID
   * @returns Operation result
   */
  async createShardSnapshot(collection_name, shard_id, { wait = true }) {
    const response = await this._openApiClient.snapshots.createShardSnapshot({
      collection_name,
      shard_id,
      wait
    });
    return maybe(response.data.result).orThrow("Create shard snapshot returned empty");
  }
  /**
   * Delete snapshot of a shard for a collection
   * @param collection_name Name of the collection
   * @param shard_id Shard ID
   * @param snapshot_name Snapshot name
   * @returns Operation result
   */
  async deleteShardSnapshot(collection_name, shard_id, snapshot_name, { wait = true }) {
    const response = await this._openApiClient.snapshots.deleteShardSnapshot({
      collection_name,
      shard_id,
      snapshot_name,
      wait
    });
    return maybe(response.data.result).orThrow("Create shard snapshot returned empty");
  }
  /**
   * Create shard key
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - shards_number: How many shards to create for this key If not specified, will use the default value from config
   *     - replication_factor: How many replicas to create for each shard If not specified, will use the default value from config
   *     - placement: Placement of shards for this key List of peer ids, that can be used to place shards for this key If not specified, will be randomly placed among all peers
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   * @returns Operation result
   */
  async createShardKey(collection_name, { shard_key, shards_number, replication_factor, placement, timeout }) {
    const response = await this._openApiClient.shards.createShardKey({
      collection_name,
      shard_key,
      shards_number,
      replication_factor,
      placement,
      timeout
    });
    return maybe(response.data.result).orThrow("Create shard key returned empty");
  }
  /**
   * Delete shard key
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   * @returns Operation result
   */
  async deleteShardKey(collection_name, { shard_key, timeout }) {
    const response = await this._openApiClient.shards.deleteShardKey({
      collection_name,
      shard_key,
      timeout
    });
    return maybe(response.data.result).orThrow("Create shard key returned empty");
  }
  /**
   * Discover points
   * @description Use context and a target to find the most similar points to the target, constrained by the context.
   * When using only the context (without a target), a special search - called context search - is performed where pairs of points are used to generate a loss that guides the search towards the zone where most positive examples overlap. This means that the score minimizes the scenario of finding a point closer to a negative than to a positive part of a pair.
   * Since the score of a context relates to loss, the maximum score a point can get is 0.0, and it becomes normal that many points can have a score of 0.0.
   * When using target (with or without context), the score behaves a little different: The  integer part of the score represents the rank with respect to the context, while the decimal part of the score relates to the distance to the target. The context part of the score for  each pair is calculated +1 if the point is closer to a positive than to a negative part of a pair,  and -1 otherwise.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards
   *     - target: Look for vectors closest to this. When using the target (with or without context), the integer part of the score represents the rank with respect to the context, while the decimal part of the score relates to the distance to the target.
   *     - context: Pairs of { positive, negative } examples to constrain the search. When using only the context (without a target), a special search - called context search - is performed where pairs of points are used to generate a loss that guides the search towards the zone where most positive examples overlap. This means that the score minimizes the scenario of finding a point closer to a negative than to a positive part of a pair. Since the score of a context relates to loss, the maximum score a point can get is 0.0, and it becomes normal that many points can have a score of 0.0. For discovery search (when including a target), the context part of the score for each pair is calculated +1 if the point is closer to a positive than to a negative part of a pair, and -1 otherwise.
   *     - filter: Look only for points which satisfies this conditions
   *     - params: Additional search params
   *     - limit: Max number of result to return
   *     - offset: Offset of the first result to return. May be used to paginate results. Note: large offset values may cause performance issues.
   *     - with_payload: Select which payload to return with the response
   *     - with_vector: Whether to return the point vector with the result?
   *     - using: Define which vector to use for recommendation, if not specified - try to use default vector
   *     - lookup_from The location used to lookup vectors. If not specified - use current collection. Note: the other collection should have the same vector size as the current collection
   * @returns Operation result
   */
  async discoverPoints(collection_name, { consistency, timeout, shard_key, target, context, params, limit, offset, with_payload, with_vector, using, lookup_from }) {
    const response = await this._openApiClient.points.discoverPoints({
      collection_name,
      consistency,
      timeout,
      shard_key,
      target,
      context,
      params,
      limit,
      offset,
      with_payload,
      with_vector,
      using,
      lookup_from
    });
    return maybe(response.data.result).orThrow("Discover points returned empty");
  }
  /**
   * Discover batch points
   * @description Look for points based on target and/or positive and negative example pairs, in batch.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - searches: List of searches
   * @returns Operation result
   */
  async discoverBatchPoints(collection_name, { consistency, timeout, searches }) {
    const response = await this._openApiClient.points.discoverBatchPoints({
      collection_name,
      consistency,
      timeout,
      searches
    });
    return maybe(response.data.result).orThrow("Discover batch points returned empty");
  }
  /**
   * Returns information about the running Qdrant instance
   * @description Returns information about the running Qdrant instance like version and commit id
   * @returns Operation result
   */
  async versionInfo() {
    const response = await this._openApiClient.service.root({});
    return maybe(response.data).orThrow("Version Info returned empty");
  }
  /**
   * Check the existence of a collection
   * @param collection_name Name of the collection
   * @description Returns "true" if the given collection name exists, and "false" otherwise
   * @returns Operation result
   */
  async collectionExists(collection_name) {
    const response = await this._openApiClient.collections.collectionExists({ collection_name });
    return maybe(response.data.result).orThrow("Collection exists returned empty");
  }
  /**
   * Query points
   * @description Universally query points. This endpoint covers all capabilities of search, recommend, discover, filters. But also enables hybrid and multi-stage queries.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards.
   *     - prefetch: Sub-requests to perform first. If present, the query will be performed on the results of the prefetch(es).
   *     - query: Query to perform. If missing without prefetches, returns points ordered by their IDs.
   *     - using: Define which vector name to use for querying. If missing, the default vector is used.
   *     - filter: Filter conditions - return only those points that satisfy the specified conditions.
   *     - params: Search params for when there is no prefetch
   *     - score_threshold: Return points with scores better than this threshold.
   *     - limit: Max number of points to return. Default is 10.
   *     - offset: Offset of the result. Skip this many points. Default is 0
   *     - with_vector: Options for specifying which vectors to include into the response. Default is false.
   *     - with_payload: Options for specifying which payload to include or not. Default is false.
   *     - lookup_from: The location to use for IDs lookup, if not specified - use the current collection and the 'using' vector Note: the other collection vectors should have the same vector size as the 'using' vector in the current collection.
   * @returns Operation result
   */
  async query(collection_name, { consistency, timeout, shard_key, prefetch, query, using, filter, params, score_threshold, limit, offset, with_vector, with_payload, lookup_from }) {
    const response = await this._openApiClient.points.queryPoints({
      collection_name,
      consistency,
      timeout,
      shard_key,
      prefetch,
      query,
      using,
      filter,
      params,
      score_threshold,
      limit,
      offset,
      with_vector,
      with_payload,
      lookup_from
    });
    return maybe(response.data.result).orThrow("Query points returned empty");
  }
  /**
   * Query points in batch
   * @description Universally query points in batch. This endpoint covers all capabilities of search, recommend, discover, filters. But also enables hybrid and multi-stage queries.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - searches: List of queries
   * @returns Operation result
   */
  async queryBatch(collection_name, { consistency, timeout, searches }) {
    const response = await this._openApiClient.points.queryBatchPoints({
      collection_name,
      consistency,
      timeout,
      searches
    });
    return maybe(response.data.result).orThrow("Query points returned empty");
  }
  /**
   * Query points, grouped by a given payload field
   * @description Universally query points, grouped by a given payload field
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards.
   *     - prefetch: Sub-requests to perform first. If present, the query will be performed on the results of the prefetch(es).
   *     - query: Query to perform. If missing without prefetches, returns points ordered by their IDs.
   *     - using: Define which vector name to use for querying. If missing, the default vector is used.
   *     - filter: Filter conditions - return only those points that satisfy the specified conditions.
   *     - params: Search params for when there is no prefetch
   *     - score_threshold: Return points with scores better than this threshold.
   *     - with_vector: Options for specifying which vectors to include into the response. Default is false.
   *     - with_payload: Options for specifying which payload to include or not. Default is false.
   *     - group_by: Payload field to group by, must be a string or number field. If the field contains more than 1 value, all values will be used for grouping. One point can be in multiple groups.
   *     - group_size: Maximum amount of points to return per group. Default is 3.
   *     - limit: Maximum amount of groups to return. Default is 10.
   *     - with_lookup: Look for points in another collection using the group ids.
   * @returns Operation result
   */
  async queryGroups(collection_name, { consistency, timeout, shard_key, prefetch, query, using, filter, params, score_threshold, with_vector, with_payload, group_by, group_size, limit, with_lookup }) {
    const response = await this._openApiClient.points.queryPointsGroups({
      collection_name,
      consistency,
      timeout,
      shard_key,
      prefetch,
      query,
      using,
      filter,
      params,
      score_threshold,
      with_vector,
      with_payload,
      group_by,
      group_size,
      limit,
      with_lookup
    });
    return maybe(response.data.result).orThrow("Query groups returned empty");
  }
  /**
   * Facet a payload key with a given filter.
   * @description Count points that satisfy the given filter for each unique value of a payload key.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards.
   *     - key: Payload key to use for faceting.
   *     - limit: Max number of hits to return. Default is 10.
   *     - filter: Filter conditions - only consider points that satisfy these conditions.
   *     - exact: Whether to do a more expensive exact count for each of the values in the facet. Default is false.
   * @returns Operation result
   */
  async facet(collection_name, { consistency, timeout, shard_key, key, limit, filter, exact }) {
    const response = await this._openApiClient.points.facet({
      collection_name,
      consistency,
      timeout,
      shard_key,
      key,
      limit,
      filter,
      exact
    });
    return maybe(response.data.result).orThrow("Facet returned empty");
  }
  /**
   * Search points matrix distance pairs.
   * @description Compute distance matrix for sampled points with a pair based output format.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards.
   *     - filter: Look only for points which satisfies this conditions.
   *     - sample: How many points to select and search within. Default is 10.
   *     - limit: How many neighbours per sample to find. Default is 3.
   *     - using: Define which vector name to use for querying. If missing, the default vector is used.
   * @returns Operation result
   */
  async searchMatrixPairs(collection_name, { consistency, timeout, shard_key, filter, sample, limit, using }) {
    const response = await this._openApiClient.points.searchMatrixPairs({
      collection_name,
      consistency,
      timeout,
      shard_key,
      filter,
      sample,
      limit,
      using
    });
    return maybe(response.data.result).orThrow("Search points matrix pairs returned empty");
  }
  /**
   * Search points matrix distance offsets.
   * @description Compute distance matrix for sampled points with an offset based output format.
   * @param collection_name Name of the collection
   * @param {object} args -
   *     - consistency: Read consistency of the search. Defines how many replicas should be queried before returning the result.
   *         Values:
   *             number - number of replicas to query, values should present in all queried replicas
   *             'majority' - query all replicas, but return values present in the majority of replicas
   *             'quorum' - query the majority of replicas, return values present in all of them
   *             'all' - query all replicas, and return values present in all replicas
   *     - timeout: If set, overrides global timeout setting for this request. Unit is seconds.
   *     - shard_key: Specify in which shards to look for the points, if not specified - look in all shards.
   *     - filter: Look only for points which satisfies this conditions.
   *     - sample: How many points to select and search within. Default is 10.
   *     - limit: How many neighbours per sample to find. Default is 3.
   *     - using: Define which vector name to use for querying. If missing, the default vector is used.
   * @returns Operation result
   */
  async searchMatrixOffsets(collection_name, { consistency, timeout, shard_key, filter, sample, limit, using }) {
    const response = await this._openApiClient.points.searchMatrixOffsets({
      collection_name,
      consistency,
      timeout,
      shard_key,
      filter,
      sample,
      limit,
      using
    });
    return maybe(response.data.result).orThrow("Search points matrix offsets returned empty");
  }
};

// src/qdrant.ts
function createQdrantClient(env) {
  return new QdrantClient({
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    checkCompatibility: false
  });
}

// src/types.ts
var AssetTypeEnum = {
  IMAGE: 1,
  VIDEO: 2,
  AUDIO: 3,
  JSON: 4,
  UNKNOWN: 99
};

// src/image.ts
var createImageAssetSchame = z.object({
  key: z.string(),
  caption: z.string(),
  tags: z.array(z.string()).default([])
});
async function generateImageCaption(c) {
  const { key } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  if (!file) {
    return c.json({ message: "File not found" }, 404);
  }
  const blob = await file.arrayBuffer();
  const { description } = await c.env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
    image: [...new Uint8Array(blob)],
    prompt: "Generate a caption for this image",
    max_tokens: 512
  });
  return c.json({ caption: description.trim() });
}
async function createImageAsset(c) {
  const { key, caption, tags } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  if (!file || !file.customMetadata?.id) {
    return c.json({ message: "File not found" }, 404);
  }
  const output = await c.env.AI.run("@cf/baai/bge-m3", {
    text: [caption]
  });
  const qdrant = createQdrantClient(c.env);
  if (output.data?.length) {
    await qdrant.upsert("myth_assets", {
      points: [
        {
          // The ID of the image is used as the key in the vector store
          id: file.customMetadata.id,
          // The caption is stored as metadata in the vector store
          payload: {
            url: `/${key}?w=${file.customMetadata.width}&h=${file.customMetadata.height}&thumbhash=${file.customMetadata.thumbhash}`,
            caption,
            tags,
            type: AssetTypeEnum.IMAGE
          },
          // The generated embedding is stored in the vector store
          vector: output.data[0]
        }
      ]
    });
  }
  try {
    await c.env.R2_ASSETS.put(key, await file.arrayBuffer(), {
      httpMetadata: file.httpMetadata,
      customMetadata: file.customMetadata
    });
  } catch (e) {
    await qdrant.delete("myth_assets", {
      points: [file.customMetadata.id]
    });
    throw new HTTPException(500, {
      message: "An error occurred when uploading the image"
    });
  }
  return c.json({});
}

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
};

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
};

// src/utils.ts
function Validator(schema, target = "json") {
  return async function(c, next) {
    let data;
    if (target === "json") {
      data = await c.req.json();
    } else if (target === "form") {
      const formData = await c.req.formData();
      data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
    } else if (target === "query") {
      data = c.req.query();
    } else if (target === "param") {
      data = c.req.param();
    } else if (target === "header") {
      data = c.req.header();
    } else if (target === "cookie") {
      data = getCookie(c);
    } else {
      throw new Error("Invalid target");
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return c.json(
        {
          message: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
        },
        400
      );
    }
    c.req.addValidatedData(target, parsed.data);
    await next();
  };
}

// node_modules/.pnpm/hono@4.7.9/node_modules/hono/dist/utils/mime.js
var getExtension = (mimeType) => {
  for (const ext in baseMimes) {
    if (baseMimes[ext] === mimeType) {
      return ext;
    }
  }
};
var _baseMimes = {
  aac: "audio/aac",
  avi: "video/x-msvideo",
  avif: "image/avif",
  av1: "video/av1",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  css: "text/css",
  csv: "text/csv",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  ics: "text/calendar",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  jsonld: "application/ld+json",
  map: "application/json",
  mid: "audio/x-midi",
  midi: "audio/x-midi",
  mjs: "text/javascript",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain",
  wasm: "application/wasm",
  webm: "video/webm",
  weba: "audio/webm",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xml: "application/xml",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary"
};
var baseMimes = _baseMimes;

// src/constants.ts
var ONE_MB = 1024 * 1024;

// src/file.ts
var fileKeySchema = z.object({ key: z.string() });
var fileIdSchema = z.object({ id: z.string() });
function validImage(file) {
  if (file.size > 10 * ONE_MB) {
    return "Size shouldn't be more `than` 10 MB";
  }
  return null;
}
function validVideo(file) {
  if (file.size > 256 * ONE_MB) {
    return "Size shouldn't be more `than` 256 MB";
  }
  return null;
}
function validAudio(file) {
  if (file.size > 32 * ONE_MB) {
    return "Size shouldn't be more `than` 256 MB";
  }
  return null;
}
async function uploadFileToR2(c) {
  const formData = await c.req.formData();
  const file = formData.get("file");
  if (!file) {
    return c.json(
      {
        message: "File is required"
      },
      400
    );
  }
  let type;
  let message = null;
  const customMetadata = {};
  if (file.type.startsWith("image/")) {
    type = AssetTypeEnum.IMAGE;
    message = validImage(file);
    customMetadata.width = formData.get("width");
    customMetadata.height = formData.get("height");
    customMetadata.thumbhash = formData.get("thumbhash");
  } else if (file.type.startsWith("video/")) {
    type = AssetTypeEnum.VIDEO;
    message = validVideo(file);
    customMetadata.width = formData.get("width");
    customMetadata.height = formData.get("height");
    customMetadata.duration = formData.get("duration");
  } else if (file.type.startsWith("audio/")) {
    type = AssetTypeEnum.AUDIO;
    message = validAudio(file);
    customMetadata.duration = formData.get("duration");
    customMetadata.waveform = formData.get("waveform");
  } else {
    type = AssetTypeEnum.UNKNOWN;
    message = "Not supported file type";
  }
  if (message) {
    return c.json({ message }, 400);
  }
  const blob = await file.arrayBuffer();
  const uuid = crypto.randomUUID();
  const key = `${file.type.split("/")[0]}/${uuid}.${getExtension(file.type)}`;
  customMetadata.id = uuid;
  if (customMetadata.waveform) {
    const blob2 = new TextEncoder().encode(customMetadata.waveform).buffer;
    const key2 = `audio/${uuid}.waveform.json`;
    delete customMetadata.waveform;
    await c.env.R2_ASSETS_TMP.put(key2, blob2, {
      httpMetadata: {
        contentType: "application/json"
      },
      customMetadata
    });
  }
  await c.env.R2_ASSETS_TMP.put(key, blob, {
    httpMetadata: {
      contentType: file.type
    },
    customMetadata
  });
  return c.json({
    id: uuid,
    key,
    type,
    metadata: customMetadata
  });
}

// src/asset.ts
var getAssetsSchame = z.object({
  page: z.number({ coerce: true }).min(1).default(1),
  type: z.number({ coerce: true }),
  prompt: z.string().optional(),
  keyword: z.string().optional()
});
async function getAssets(c) {
  const { page, type, prompt, keyword } = c.req.valid("query");
  let vector;
  if (prompt) {
    try {
      const output = await c.env.AI.run("@cf/baai/bge-m3", {
        text: [prompt]
      });
      if (output.data?.length) {
        vector = output.data[0];
      }
    } catch (error) {
      console.error(error);
    }
  }
  const conditions = [
    {
      key: "type",
      match: { value: type }
    }
  ];
  if (keyword) {
    conditions.push({
      key: "caption",
      match: {
        text: keyword
      }
    });
  }
  const qdrant = createQdrantClient(c.env);
  const { points } = await qdrant.query("myth_assets", {
    with_payload: true,
    limit: 20,
    offset: (page - 1) * 20,
    query: vector,
    filter: {
      must: conditions
    }
  });
  return c.json(points);
}

// src/video.ts
var createVideoAssetSchema = z.object({
  key: z.string(),
  caption: z.string(),
  tags: z.array(z.string()).default([]),
  posterKey: z.string()
});
async function createVideoAsset(c) {
  const { key, caption, tags, posterKey } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  const posterFile = await c.env.R2_ASSETS_TMP.get(posterKey);
  if (!file || !file.customMetadata?.id) {
    return c.json({ message: "File not found" }, 404);
  }
  if (!posterFile || !posterFile.customMetadata?.id) {
    return c.json({ message: "Poster not found" }, 404);
  }
  const output = await c.env.AI.run("@cf/baai/bge-m3", {
    text: [caption]
  });
  const qdrant = createQdrantClient(c.env);
  if (output.data?.length) {
    await qdrant.upsert("myth_assets", {
      points: [
        {
          // The ID of the video is used as the key in the vector store
          id: file.customMetadata.id,
          // The caption is stored as metadata in the vector store
          payload: {
            url: `/${key}?w=${file.customMetadata.width}&h=${file.customMetadata.height}&duration=${file.customMetadata.duration}`,
            caption,
            tags,
            type: AssetTypeEnum.VIDEO,
            poster: `/${posterKey}?w=${posterFile.customMetadata.width}&h=${posterFile.customMetadata.height}&thumbhash=${posterFile.customMetadata.thumbhash}`
          },
          // The generated embedding is stored in the vector store
          vector: output.data[0]
        }
      ]
    });
  }
  try {
    await c.env.R2_ASSETS.put(key, await file.arrayBuffer(), {
      httpMetadata: file.httpMetadata,
      customMetadata: file.customMetadata
    });
    await c.env.R2_ASSETS.put(posterKey, await posterFile.arrayBuffer(), {
      httpMetadata: posterFile.httpMetadata,
      customMetadata: posterFile.customMetadata
    });
  } catch (e) {
    await qdrant.delete("myth_assets", {
      points: [file.customMetadata.id]
    });
    throw new HTTPException(500, {
      message: "An error occurred when uploading the video"
    });
  }
  return c.json({});
}

// src/audio.ts
var createAudioAssetSchema = z.object({
  key: z.string(),
  caption: z.string(),
  tags: z.array(z.string()).default([])
});
async function createAudioAsset(c) {
  const { key, caption, tags } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  if (!file || !file.customMetadata?.id) {
    return c.json({ message: "File not found" }, 404);
  }
  const waveformKey = `audio/${file.customMetadata.id}.waveform.json`;
  const waveformFile = await c.env.R2_ASSETS_TMP.get(waveformKey);
  if (!waveformFile) {
    return c.json({ message: "Waveform not found" }, 404);
  }
  const output = await c.env.AI.run("@cf/baai/bge-m3", {
    text: [caption]
  });
  const qdrant = createQdrantClient(c.env);
  if (output.data?.length) {
    await qdrant.upsert("myth_assets", {
      points: [
        {
          // The ID of the audio is used as the key in the vector store
          id: file.customMetadata.id,
          // The caption is stored as metadata in the vector store
          payload: {
            url: `/${key}?duration=${file.customMetadata.duration}`,
            caption,
            tags,
            type: AssetTypeEnum.AUDIO,
            waveformUrl: `/${waveformKey}`
          },
          // The generated embedding is stored in the vector store
          vector: output.data[0]
        }
      ]
    });
  }
  try {
    await c.env.R2_ASSETS.put(key, await file.arrayBuffer(), {
      httpMetadata: file.httpMetadata,
      customMetadata: file.customMetadata
    });
    await c.env.R2_ASSETS.put(waveformKey, await waveformFile.arrayBuffer(), {
      httpMetadata: {
        contentType: "application/json"
      }
    });
  } catch (e) {
    await qdrant.delete("myth_assets", {
      points: [file.customMetadata.id]
    });
    throw new HTTPException(500, {
      message: "An error occurred when uploading the audio"
    });
  }
  return c.json({});
}

// src/index.ts
var app = new Hono2();
app.use("*", logger());
app.use("*", poweredBy());
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    maxAge: 3600 * 24,
    credentials: true
  })
);
var v1App = new Hono2();
v1App.get("/", (c) => c.text("Hello Hono!"));
v1App.post("/files", uploadFileToR2);
v1App.post("/image/captions", Validator(fileKeySchema), generateImageCaption);
v1App.post("/images", Validator(createImageAssetSchame), createImageAsset);
v1App.post("/videos", Validator(createVideoAssetSchema), createVideoAsset);
v1App.post("/audios", Validator(createAudioAssetSchema), createAudioAsset);
v1App.get("/assets", Validator(getAssetsSchame, "query"), getAssets);
app.route("/v1", v1App);
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ message: err.message || "Internal Server Error" }, 500);
});
app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
