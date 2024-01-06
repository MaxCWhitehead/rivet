"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/delayed-stream/lib/delayed_stream.js
var require_delayed_stream = __commonJS({
  "node_modules/delayed-stream/lib/delayed_stream.js"(exports2, module2) {
    var Stream = require("stream").Stream;
    var util = require("util");
    module2.exports = DelayedStream;
    function DelayedStream() {
      this.source = null;
      this.dataSize = 0;
      this.maxDataSize = 1024 * 1024;
      this.pauseStream = true;
      this._maxDataSizeExceeded = false;
      this._released = false;
      this._bufferedEvents = [];
    }
    util.inherits(DelayedStream, Stream);
    DelayedStream.create = function(source, options) {
      var delayedStream = new this();
      options = options || {};
      for (var option in options) {
        delayedStream[option] = options[option];
      }
      delayedStream.source = source;
      var realEmit = source.emit;
      source.emit = function() {
        delayedStream._handleEmit(arguments);
        return realEmit.apply(source, arguments);
      };
      source.on("error", function() {
      });
      if (delayedStream.pauseStream) {
        source.pause();
      }
      return delayedStream;
    };
    Object.defineProperty(DelayedStream.prototype, "readable", {
      configurable: true,
      enumerable: true,
      get: function() {
        return this.source.readable;
      }
    });
    DelayedStream.prototype.setEncoding = function() {
      return this.source.setEncoding.apply(this.source, arguments);
    };
    DelayedStream.prototype.resume = function() {
      if (!this._released) {
        this.release();
      }
      this.source.resume();
    };
    DelayedStream.prototype.pause = function() {
      this.source.pause();
    };
    DelayedStream.prototype.release = function() {
      this._released = true;
      this._bufferedEvents.forEach(function(args) {
        this.emit.apply(this, args);
      }.bind(this));
      this._bufferedEvents = [];
    };
    DelayedStream.prototype.pipe = function() {
      var r = Stream.prototype.pipe.apply(this, arguments);
      this.resume();
      return r;
    };
    DelayedStream.prototype._handleEmit = function(args) {
      if (this._released) {
        this.emit.apply(this, args);
        return;
      }
      if (args[0] === "data") {
        this.dataSize += args[1].length;
        this._checkIfMaxDataSizeExceeded();
      }
      this._bufferedEvents.push(args);
    };
    DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
      if (this._maxDataSizeExceeded) {
        return;
      }
      if (this.dataSize <= this.maxDataSize) {
        return;
      }
      this._maxDataSizeExceeded = true;
      var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this.emit("error", new Error(message));
    };
  }
});

// node_modules/combined-stream/lib/combined_stream.js
var require_combined_stream = __commonJS({
  "node_modules/combined-stream/lib/combined_stream.js"(exports2, module2) {
    var util = require("util");
    var Stream = require("stream").Stream;
    var DelayedStream = require_delayed_stream();
    module2.exports = CombinedStream;
    function CombinedStream() {
      this.writable = false;
      this.readable = true;
      this.dataSize = 0;
      this.maxDataSize = 2 * 1024 * 1024;
      this.pauseStreams = true;
      this._released = false;
      this._streams = [];
      this._currentStream = null;
      this._insideLoop = false;
      this._pendingNext = false;
    }
    util.inherits(CombinedStream, Stream);
    CombinedStream.create = function(options) {
      var combinedStream = new this();
      options = options || {};
      for (var option in options) {
        combinedStream[option] = options[option];
      }
      return combinedStream;
    };
    CombinedStream.isStreamLike = function(stream) {
      return typeof stream !== "function" && typeof stream !== "string" && typeof stream !== "boolean" && typeof stream !== "number" && !Buffer.isBuffer(stream);
    };
    CombinedStream.prototype.append = function(stream) {
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        if (!(stream instanceof DelayedStream)) {
          var newStream = DelayedStream.create(stream, {
            maxDataSize: Infinity,
            pauseStream: this.pauseStreams
          });
          stream.on("data", this._checkDataSize.bind(this));
          stream = newStream;
        }
        this._handleErrors(stream);
        if (this.pauseStreams) {
          stream.pause();
        }
      }
      this._streams.push(stream);
      return this;
    };
    CombinedStream.prototype.pipe = function(dest, options) {
      Stream.prototype.pipe.call(this, dest, options);
      this.resume();
      return dest;
    };
    CombinedStream.prototype._getNext = function() {
      this._currentStream = null;
      if (this._insideLoop) {
        this._pendingNext = true;
        return;
      }
      this._insideLoop = true;
      try {
        do {
          this._pendingNext = false;
          this._realGetNext();
        } while (this._pendingNext);
      } finally {
        this._insideLoop = false;
      }
    };
    CombinedStream.prototype._realGetNext = function() {
      var stream = this._streams.shift();
      if (typeof stream == "undefined") {
        this.end();
        return;
      }
      if (typeof stream !== "function") {
        this._pipeNext(stream);
        return;
      }
      var getStream = stream;
      getStream(function(stream2) {
        var isStreamLike = CombinedStream.isStreamLike(stream2);
        if (isStreamLike) {
          stream2.on("data", this._checkDataSize.bind(this));
          this._handleErrors(stream2);
        }
        this._pipeNext(stream2);
      }.bind(this));
    };
    CombinedStream.prototype._pipeNext = function(stream) {
      this._currentStream = stream;
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        stream.on("end", this._getNext.bind(this));
        stream.pipe(this, { end: false });
        return;
      }
      var value = stream;
      this.write(value);
      this._getNext();
    };
    CombinedStream.prototype._handleErrors = function(stream) {
      var self = this;
      stream.on("error", function(err) {
        self._emitError(err);
      });
    };
    CombinedStream.prototype.write = function(data) {
      this.emit("data", data);
    };
    CombinedStream.prototype.pause = function() {
      if (!this.pauseStreams) {
        return;
      }
      if (this.pauseStreams && this._currentStream && typeof this._currentStream.pause == "function")
        this._currentStream.pause();
      this.emit("pause");
    };
    CombinedStream.prototype.resume = function() {
      if (!this._released) {
        this._released = true;
        this.writable = true;
        this._getNext();
      }
      if (this.pauseStreams && this._currentStream && typeof this._currentStream.resume == "function")
        this._currentStream.resume();
      this.emit("resume");
    };
    CombinedStream.prototype.end = function() {
      this._reset();
      this.emit("end");
    };
    CombinedStream.prototype.destroy = function() {
      this._reset();
      this.emit("close");
    };
    CombinedStream.prototype._reset = function() {
      this.writable = false;
      this._streams = [];
      this._currentStream = null;
    };
    CombinedStream.prototype._checkDataSize = function() {
      this._updateDataSize();
      if (this.dataSize <= this.maxDataSize) {
        return;
      }
      var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this._emitError(new Error(message));
    };
    CombinedStream.prototype._updateDataSize = function() {
      this.dataSize = 0;
      var self = this;
      this._streams.forEach(function(stream) {
        if (!stream.dataSize) {
          return;
        }
        self.dataSize += stream.dataSize;
      });
      if (this._currentStream && this._currentStream.dataSize) {
        this.dataSize += this._currentStream.dataSize;
      }
    };
    CombinedStream.prototype._emitError = function(err) {
      this._reset();
      this.emit("error", err);
    };
  }
});

// node_modules/mime-db/db.json
var require_db = __commonJS({
  "node_modules/mime-db/db.json"(exports2, module2) {
    module2.exports = {
      "application/1d-interleaved-parityfec": {
        source: "iana"
      },
      "application/3gpdash-qoe-report+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/3gpp-ims+xml": {
        source: "iana",
        compressible: true
      },
      "application/3gpphal+json": {
        source: "iana",
        compressible: true
      },
      "application/3gpphalforms+json": {
        source: "iana",
        compressible: true
      },
      "application/a2l": {
        source: "iana"
      },
      "application/ace+cbor": {
        source: "iana"
      },
      "application/activemessage": {
        source: "iana"
      },
      "application/activity+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-directory+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcost+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcostparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointprop+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointpropparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-error+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamcontrol+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamparams+json": {
        source: "iana",
        compressible: true
      },
      "application/aml": {
        source: "iana"
      },
      "application/andrew-inset": {
        source: "iana",
        extensions: ["ez"]
      },
      "application/applefile": {
        source: "iana"
      },
      "application/applixware": {
        source: "apache",
        extensions: ["aw"]
      },
      "application/at+jwt": {
        source: "iana"
      },
      "application/atf": {
        source: "iana"
      },
      "application/atfx": {
        source: "iana"
      },
      "application/atom+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atom"]
      },
      "application/atomcat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomcat"]
      },
      "application/atomdeleted+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomdeleted"]
      },
      "application/atomicmail": {
        source: "iana"
      },
      "application/atomsvc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomsvc"]
      },
      "application/atsc-dwd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dwd"]
      },
      "application/atsc-dynamic-event-message": {
        source: "iana"
      },
      "application/atsc-held+xml": {
        source: "iana",
        compressible: true,
        extensions: ["held"]
      },
      "application/atsc-rdt+json": {
        source: "iana",
        compressible: true
      },
      "application/atsc-rsat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsat"]
      },
      "application/atxml": {
        source: "iana"
      },
      "application/auth-policy+xml": {
        source: "iana",
        compressible: true
      },
      "application/bacnet-xdd+zip": {
        source: "iana",
        compressible: false
      },
      "application/batch-smtp": {
        source: "iana"
      },
      "application/bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/beep+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/calendar+json": {
        source: "iana",
        compressible: true
      },
      "application/calendar+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xcs"]
      },
      "application/call-completion": {
        source: "iana"
      },
      "application/cals-1840": {
        source: "iana"
      },
      "application/captive+json": {
        source: "iana",
        compressible: true
      },
      "application/cbor": {
        source: "iana"
      },
      "application/cbor-seq": {
        source: "iana"
      },
      "application/cccex": {
        source: "iana"
      },
      "application/ccmp+xml": {
        source: "iana",
        compressible: true
      },
      "application/ccxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ccxml"]
      },
      "application/cdfx+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdfx"]
      },
      "application/cdmi-capability": {
        source: "iana",
        extensions: ["cdmia"]
      },
      "application/cdmi-container": {
        source: "iana",
        extensions: ["cdmic"]
      },
      "application/cdmi-domain": {
        source: "iana",
        extensions: ["cdmid"]
      },
      "application/cdmi-object": {
        source: "iana",
        extensions: ["cdmio"]
      },
      "application/cdmi-queue": {
        source: "iana",
        extensions: ["cdmiq"]
      },
      "application/cdni": {
        source: "iana"
      },
      "application/cea": {
        source: "iana"
      },
      "application/cea-2018+xml": {
        source: "iana",
        compressible: true
      },
      "application/cellml+xml": {
        source: "iana",
        compressible: true
      },
      "application/cfw": {
        source: "iana"
      },
      "application/city+json": {
        source: "iana",
        compressible: true
      },
      "application/clr": {
        source: "iana"
      },
      "application/clue+xml": {
        source: "iana",
        compressible: true
      },
      "application/clue_info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cms": {
        source: "iana"
      },
      "application/cnrp+xml": {
        source: "iana",
        compressible: true
      },
      "application/coap-group+json": {
        source: "iana",
        compressible: true
      },
      "application/coap-payload": {
        source: "iana"
      },
      "application/commonground": {
        source: "iana"
      },
      "application/conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cose": {
        source: "iana"
      },
      "application/cose-key": {
        source: "iana"
      },
      "application/cose-key-set": {
        source: "iana"
      },
      "application/cpl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cpl"]
      },
      "application/csrattrs": {
        source: "iana"
      },
      "application/csta+xml": {
        source: "iana",
        compressible: true
      },
      "application/cstadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/csvm+json": {
        source: "iana",
        compressible: true
      },
      "application/cu-seeme": {
        source: "apache",
        extensions: ["cu"]
      },
      "application/cwt": {
        source: "iana"
      },
      "application/cybercash": {
        source: "iana"
      },
      "application/dart": {
        compressible: true
      },
      "application/dash+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpd"]
      },
      "application/dash-patch+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpp"]
      },
      "application/dashdelta": {
        source: "iana"
      },
      "application/davmount+xml": {
        source: "iana",
        compressible: true,
        extensions: ["davmount"]
      },
      "application/dca-rft": {
        source: "iana"
      },
      "application/dcd": {
        source: "iana"
      },
      "application/dec-dx": {
        source: "iana"
      },
      "application/dialog-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/dicom": {
        source: "iana"
      },
      "application/dicom+json": {
        source: "iana",
        compressible: true
      },
      "application/dicom+xml": {
        source: "iana",
        compressible: true
      },
      "application/dii": {
        source: "iana"
      },
      "application/dit": {
        source: "iana"
      },
      "application/dns": {
        source: "iana"
      },
      "application/dns+json": {
        source: "iana",
        compressible: true
      },
      "application/dns-message": {
        source: "iana"
      },
      "application/docbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dbk"]
      },
      "application/dots+cbor": {
        source: "iana"
      },
      "application/dskpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/dssc+der": {
        source: "iana",
        extensions: ["dssc"]
      },
      "application/dssc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdssc"]
      },
      "application/dvcs": {
        source: "iana"
      },
      "application/ecmascript": {
        source: "iana",
        compressible: true,
        extensions: ["es", "ecma"]
      },
      "application/edi-consent": {
        source: "iana"
      },
      "application/edi-x12": {
        source: "iana",
        compressible: false
      },
      "application/edifact": {
        source: "iana",
        compressible: false
      },
      "application/efi": {
        source: "iana"
      },
      "application/elm+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/elm+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.cap+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/emergencycalldata.comment+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.control+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.deviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.ecall.msd": {
        source: "iana"
      },
      "application/emergencycalldata.providerinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.serviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.subscriberinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.veds+xml": {
        source: "iana",
        compressible: true
      },
      "application/emma+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emma"]
      },
      "application/emotionml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emotionml"]
      },
      "application/encaprtp": {
        source: "iana"
      },
      "application/epp+xml": {
        source: "iana",
        compressible: true
      },
      "application/epub+zip": {
        source: "iana",
        compressible: false,
        extensions: ["epub"]
      },
      "application/eshop": {
        source: "iana"
      },
      "application/exi": {
        source: "iana",
        extensions: ["exi"]
      },
      "application/expect-ct-report+json": {
        source: "iana",
        compressible: true
      },
      "application/express": {
        source: "iana",
        extensions: ["exp"]
      },
      "application/fastinfoset": {
        source: "iana"
      },
      "application/fastsoap": {
        source: "iana"
      },
      "application/fdt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fdt"]
      },
      "application/fhir+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fhir+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fido.trusted-apps+json": {
        compressible: true
      },
      "application/fits": {
        source: "iana"
      },
      "application/flexfec": {
        source: "iana"
      },
      "application/font-sfnt": {
        source: "iana"
      },
      "application/font-tdpfr": {
        source: "iana",
        extensions: ["pfr"]
      },
      "application/font-woff": {
        source: "iana",
        compressible: false
      },
      "application/framework-attributes+xml": {
        source: "iana",
        compressible: true
      },
      "application/geo+json": {
        source: "iana",
        compressible: true,
        extensions: ["geojson"]
      },
      "application/geo+json-seq": {
        source: "iana"
      },
      "application/geopackage+sqlite3": {
        source: "iana"
      },
      "application/geoxacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/gltf-buffer": {
        source: "iana"
      },
      "application/gml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["gml"]
      },
      "application/gpx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["gpx"]
      },
      "application/gxf": {
        source: "apache",
        extensions: ["gxf"]
      },
      "application/gzip": {
        source: "iana",
        compressible: false,
        extensions: ["gz"]
      },
      "application/h224": {
        source: "iana"
      },
      "application/held+xml": {
        source: "iana",
        compressible: true
      },
      "application/hjson": {
        extensions: ["hjson"]
      },
      "application/http": {
        source: "iana"
      },
      "application/hyperstudio": {
        source: "iana",
        extensions: ["stk"]
      },
      "application/ibe-key-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pkg-reply+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pp-data": {
        source: "iana"
      },
      "application/iges": {
        source: "iana"
      },
      "application/im-iscomposing+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/index": {
        source: "iana"
      },
      "application/index.cmd": {
        source: "iana"
      },
      "application/index.obj": {
        source: "iana"
      },
      "application/index.response": {
        source: "iana"
      },
      "application/index.vnd": {
        source: "iana"
      },
      "application/inkml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ink", "inkml"]
      },
      "application/iotp": {
        source: "iana"
      },
      "application/ipfix": {
        source: "iana",
        extensions: ["ipfix"]
      },
      "application/ipp": {
        source: "iana"
      },
      "application/isup": {
        source: "iana"
      },
      "application/its+xml": {
        source: "iana",
        compressible: true,
        extensions: ["its"]
      },
      "application/java-archive": {
        source: "apache",
        compressible: false,
        extensions: ["jar", "war", "ear"]
      },
      "application/java-serialized-object": {
        source: "apache",
        compressible: false,
        extensions: ["ser"]
      },
      "application/java-vm": {
        source: "apache",
        compressible: false,
        extensions: ["class"]
      },
      "application/javascript": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js", "mjs"]
      },
      "application/jf2feed+json": {
        source: "iana",
        compressible: true
      },
      "application/jose": {
        source: "iana"
      },
      "application/jose+json": {
        source: "iana",
        compressible: true
      },
      "application/jrd+json": {
        source: "iana",
        compressible: true
      },
      "application/jscalendar+json": {
        source: "iana",
        compressible: true
      },
      "application/json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["json", "map"]
      },
      "application/json-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/json-seq": {
        source: "iana"
      },
      "application/json5": {
        extensions: ["json5"]
      },
      "application/jsonml+json": {
        source: "apache",
        compressible: true,
        extensions: ["jsonml"]
      },
      "application/jwk+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+json": {
        source: "iana",
        compressible: true
      },
      "application/jwt": {
        source: "iana"
      },
      "application/kpml-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/kpml-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/ld+json": {
        source: "iana",
        compressible: true,
        extensions: ["jsonld"]
      },
      "application/lgr+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lgr"]
      },
      "application/link-format": {
        source: "iana"
      },
      "application/load-control+xml": {
        source: "iana",
        compressible: true
      },
      "application/lost+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lostxml"]
      },
      "application/lostsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/lpf+zip": {
        source: "iana",
        compressible: false
      },
      "application/lxf": {
        source: "iana"
      },
      "application/mac-binhex40": {
        source: "iana",
        extensions: ["hqx"]
      },
      "application/mac-compactpro": {
        source: "apache",
        extensions: ["cpt"]
      },
      "application/macwriteii": {
        source: "iana"
      },
      "application/mads+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mads"]
      },
      "application/manifest+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["webmanifest"]
      },
      "application/marc": {
        source: "iana",
        extensions: ["mrc"]
      },
      "application/marcxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mrcx"]
      },
      "application/mathematica": {
        source: "iana",
        extensions: ["ma", "nb", "mb"]
      },
      "application/mathml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mathml"]
      },
      "application/mathml-content+xml": {
        source: "iana",
        compressible: true
      },
      "application/mathml-presentation+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-associated-procedure-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-deregister+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-envelope+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-protection-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-reception-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-user-service-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbox": {
        source: "iana",
        extensions: ["mbox"]
      },
      "application/media-policy-dataset+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpf"]
      },
      "application/media_control+xml": {
        source: "iana",
        compressible: true
      },
      "application/mediaservercontrol+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mscml"]
      },
      "application/merge-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/metalink+xml": {
        source: "apache",
        compressible: true,
        extensions: ["metalink"]
      },
      "application/metalink4+xml": {
        source: "iana",
        compressible: true,
        extensions: ["meta4"]
      },
      "application/mets+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mets"]
      },
      "application/mf4": {
        source: "iana"
      },
      "application/mikey": {
        source: "iana"
      },
      "application/mipc": {
        source: "iana"
      },
      "application/missing-blocks+cbor-seq": {
        source: "iana"
      },
      "application/mmt-aei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["maei"]
      },
      "application/mmt-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musd"]
      },
      "application/mods+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mods"]
      },
      "application/moss-keys": {
        source: "iana"
      },
      "application/moss-signature": {
        source: "iana"
      },
      "application/mosskey-data": {
        source: "iana"
      },
      "application/mosskey-request": {
        source: "iana"
      },
      "application/mp21": {
        source: "iana",
        extensions: ["m21", "mp21"]
      },
      "application/mp4": {
        source: "iana",
        extensions: ["mp4s", "m4p"]
      },
      "application/mpeg4-generic": {
        source: "iana"
      },
      "application/mpeg4-iod": {
        source: "iana"
      },
      "application/mpeg4-iod-xmt": {
        source: "iana"
      },
      "application/mrb-consumer+xml": {
        source: "iana",
        compressible: true
      },
      "application/mrb-publish+xml": {
        source: "iana",
        compressible: true
      },
      "application/msc-ivr+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msc-mixer+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msword": {
        source: "iana",
        compressible: false,
        extensions: ["doc", "dot"]
      },
      "application/mud+json": {
        source: "iana",
        compressible: true
      },
      "application/multipart-core": {
        source: "iana"
      },
      "application/mxf": {
        source: "iana",
        extensions: ["mxf"]
      },
      "application/n-quads": {
        source: "iana",
        extensions: ["nq"]
      },
      "application/n-triples": {
        source: "iana",
        extensions: ["nt"]
      },
      "application/nasdata": {
        source: "iana"
      },
      "application/news-checkgroups": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-groupinfo": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-transmission": {
        source: "iana"
      },
      "application/nlsml+xml": {
        source: "iana",
        compressible: true
      },
      "application/node": {
        source: "iana",
        extensions: ["cjs"]
      },
      "application/nss": {
        source: "iana"
      },
      "application/oauth-authz-req+jwt": {
        source: "iana"
      },
      "application/oblivious-dns-message": {
        source: "iana"
      },
      "application/ocsp-request": {
        source: "iana"
      },
      "application/ocsp-response": {
        source: "iana"
      },
      "application/octet-stream": {
        source: "iana",
        compressible: false,
        extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
      },
      "application/oda": {
        source: "iana",
        extensions: ["oda"]
      },
      "application/odm+xml": {
        source: "iana",
        compressible: true
      },
      "application/odx": {
        source: "iana"
      },
      "application/oebps-package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["opf"]
      },
      "application/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogx"]
      },
      "application/omdoc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["omdoc"]
      },
      "application/onenote": {
        source: "apache",
        extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
      },
      "application/opc-nodeset+xml": {
        source: "iana",
        compressible: true
      },
      "application/oscore": {
        source: "iana"
      },
      "application/oxps": {
        source: "iana",
        extensions: ["oxps"]
      },
      "application/p21": {
        source: "iana"
      },
      "application/p21+zip": {
        source: "iana",
        compressible: false
      },
      "application/p2p-overlay+xml": {
        source: "iana",
        compressible: true,
        extensions: ["relo"]
      },
      "application/parityfec": {
        source: "iana"
      },
      "application/passport": {
        source: "iana"
      },
      "application/patch-ops-error+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xer"]
      },
      "application/pdf": {
        source: "iana",
        compressible: false,
        extensions: ["pdf"]
      },
      "application/pdx": {
        source: "iana"
      },
      "application/pem-certificate-chain": {
        source: "iana"
      },
      "application/pgp-encrypted": {
        source: "iana",
        compressible: false,
        extensions: ["pgp"]
      },
      "application/pgp-keys": {
        source: "iana",
        extensions: ["asc"]
      },
      "application/pgp-signature": {
        source: "iana",
        extensions: ["asc", "sig"]
      },
      "application/pics-rules": {
        source: "apache",
        extensions: ["prf"]
      },
      "application/pidf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pidf-diff+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pkcs10": {
        source: "iana",
        extensions: ["p10"]
      },
      "application/pkcs12": {
        source: "iana"
      },
      "application/pkcs7-mime": {
        source: "iana",
        extensions: ["p7m", "p7c"]
      },
      "application/pkcs7-signature": {
        source: "iana",
        extensions: ["p7s"]
      },
      "application/pkcs8": {
        source: "iana",
        extensions: ["p8"]
      },
      "application/pkcs8-encrypted": {
        source: "iana"
      },
      "application/pkix-attr-cert": {
        source: "iana",
        extensions: ["ac"]
      },
      "application/pkix-cert": {
        source: "iana",
        extensions: ["cer"]
      },
      "application/pkix-crl": {
        source: "iana",
        extensions: ["crl"]
      },
      "application/pkix-pkipath": {
        source: "iana",
        extensions: ["pkipath"]
      },
      "application/pkixcmp": {
        source: "iana",
        extensions: ["pki"]
      },
      "application/pls+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pls"]
      },
      "application/poc-settings+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/postscript": {
        source: "iana",
        compressible: true,
        extensions: ["ai", "eps", "ps"]
      },
      "application/ppsp-tracker+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+xml": {
        source: "iana",
        compressible: true
      },
      "application/provenance+xml": {
        source: "iana",
        compressible: true,
        extensions: ["provx"]
      },
      "application/prs.alvestrand.titrax-sheet": {
        source: "iana"
      },
      "application/prs.cww": {
        source: "iana",
        extensions: ["cww"]
      },
      "application/prs.cyn": {
        source: "iana",
        charset: "7-BIT"
      },
      "application/prs.hpub+zip": {
        source: "iana",
        compressible: false
      },
      "application/prs.nprend": {
        source: "iana"
      },
      "application/prs.plucker": {
        source: "iana"
      },
      "application/prs.rdf-xml-crypt": {
        source: "iana"
      },
      "application/prs.xsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/pskc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pskcxml"]
      },
      "application/pvd+json": {
        source: "iana",
        compressible: true
      },
      "application/qsig": {
        source: "iana"
      },
      "application/raml+yaml": {
        compressible: true,
        extensions: ["raml"]
      },
      "application/raptorfec": {
        source: "iana"
      },
      "application/rdap+json": {
        source: "iana",
        compressible: true
      },
      "application/rdf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rdf", "owl"]
      },
      "application/reginfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rif"]
      },
      "application/relax-ng-compact-syntax": {
        source: "iana",
        extensions: ["rnc"]
      },
      "application/remote-printing": {
        source: "iana"
      },
      "application/reputon+json": {
        source: "iana",
        compressible: true
      },
      "application/resource-lists+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rl"]
      },
      "application/resource-lists-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rld"]
      },
      "application/rfc+xml": {
        source: "iana",
        compressible: true
      },
      "application/riscos": {
        source: "iana"
      },
      "application/rlmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/rls-services+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rs"]
      },
      "application/route-apd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rapd"]
      },
      "application/route-s-tsid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sls"]
      },
      "application/route-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rusd"]
      },
      "application/rpki-ghostbusters": {
        source: "iana",
        extensions: ["gbr"]
      },
      "application/rpki-manifest": {
        source: "iana",
        extensions: ["mft"]
      },
      "application/rpki-publication": {
        source: "iana"
      },
      "application/rpki-roa": {
        source: "iana",
        extensions: ["roa"]
      },
      "application/rpki-updown": {
        source: "iana"
      },
      "application/rsd+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rsd"]
      },
      "application/rss+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rss"]
      },
      "application/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "application/rtploopback": {
        source: "iana"
      },
      "application/rtx": {
        source: "iana"
      },
      "application/samlassertion+xml": {
        source: "iana",
        compressible: true
      },
      "application/samlmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/sarif+json": {
        source: "iana",
        compressible: true
      },
      "application/sarif-external-properties+json": {
        source: "iana",
        compressible: true
      },
      "application/sbe": {
        source: "iana"
      },
      "application/sbml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sbml"]
      },
      "application/scaip+xml": {
        source: "iana",
        compressible: true
      },
      "application/scim+json": {
        source: "iana",
        compressible: true
      },
      "application/scvp-cv-request": {
        source: "iana",
        extensions: ["scq"]
      },
      "application/scvp-cv-response": {
        source: "iana",
        extensions: ["scs"]
      },
      "application/scvp-vp-request": {
        source: "iana",
        extensions: ["spq"]
      },
      "application/scvp-vp-response": {
        source: "iana",
        extensions: ["spp"]
      },
      "application/sdp": {
        source: "iana",
        extensions: ["sdp"]
      },
      "application/secevent+jwt": {
        source: "iana"
      },
      "application/senml+cbor": {
        source: "iana"
      },
      "application/senml+json": {
        source: "iana",
        compressible: true
      },
      "application/senml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["senmlx"]
      },
      "application/senml-etch+cbor": {
        source: "iana"
      },
      "application/senml-etch+json": {
        source: "iana",
        compressible: true
      },
      "application/senml-exi": {
        source: "iana"
      },
      "application/sensml+cbor": {
        source: "iana"
      },
      "application/sensml+json": {
        source: "iana",
        compressible: true
      },
      "application/sensml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sensmlx"]
      },
      "application/sensml-exi": {
        source: "iana"
      },
      "application/sep+xml": {
        source: "iana",
        compressible: true
      },
      "application/sep-exi": {
        source: "iana"
      },
      "application/session-info": {
        source: "iana"
      },
      "application/set-payment": {
        source: "iana"
      },
      "application/set-payment-initiation": {
        source: "iana",
        extensions: ["setpay"]
      },
      "application/set-registration": {
        source: "iana"
      },
      "application/set-registration-initiation": {
        source: "iana",
        extensions: ["setreg"]
      },
      "application/sgml": {
        source: "iana"
      },
      "application/sgml-open-catalog": {
        source: "iana"
      },
      "application/shf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["shf"]
      },
      "application/sieve": {
        source: "iana",
        extensions: ["siv", "sieve"]
      },
      "application/simple-filter+xml": {
        source: "iana",
        compressible: true
      },
      "application/simple-message-summary": {
        source: "iana"
      },
      "application/simplesymbolcontainer": {
        source: "iana"
      },
      "application/sipc": {
        source: "iana"
      },
      "application/slate": {
        source: "iana"
      },
      "application/smil": {
        source: "iana"
      },
      "application/smil+xml": {
        source: "iana",
        compressible: true,
        extensions: ["smi", "smil"]
      },
      "application/smpte336m": {
        source: "iana"
      },
      "application/soap+fastinfoset": {
        source: "iana"
      },
      "application/soap+xml": {
        source: "iana",
        compressible: true
      },
      "application/sparql-query": {
        source: "iana",
        extensions: ["rq"]
      },
      "application/sparql-results+xml": {
        source: "iana",
        compressible: true,
        extensions: ["srx"]
      },
      "application/spdx+json": {
        source: "iana",
        compressible: true
      },
      "application/spirits-event+xml": {
        source: "iana",
        compressible: true
      },
      "application/sql": {
        source: "iana"
      },
      "application/srgs": {
        source: "iana",
        extensions: ["gram"]
      },
      "application/srgs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["grxml"]
      },
      "application/sru+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sru"]
      },
      "application/ssdl+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ssdl"]
      },
      "application/ssml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ssml"]
      },
      "application/stix+json": {
        source: "iana",
        compressible: true
      },
      "application/swid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["swidtag"]
      },
      "application/tamp-apex-update": {
        source: "iana"
      },
      "application/tamp-apex-update-confirm": {
        source: "iana"
      },
      "application/tamp-community-update": {
        source: "iana"
      },
      "application/tamp-community-update-confirm": {
        source: "iana"
      },
      "application/tamp-error": {
        source: "iana"
      },
      "application/tamp-sequence-adjust": {
        source: "iana"
      },
      "application/tamp-sequence-adjust-confirm": {
        source: "iana"
      },
      "application/tamp-status-query": {
        source: "iana"
      },
      "application/tamp-status-response": {
        source: "iana"
      },
      "application/tamp-update": {
        source: "iana"
      },
      "application/tamp-update-confirm": {
        source: "iana"
      },
      "application/tar": {
        compressible: true
      },
      "application/taxii+json": {
        source: "iana",
        compressible: true
      },
      "application/td+json": {
        source: "iana",
        compressible: true
      },
      "application/tei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tei", "teicorpus"]
      },
      "application/tetra_isi": {
        source: "iana"
      },
      "application/thraud+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tfi"]
      },
      "application/timestamp-query": {
        source: "iana"
      },
      "application/timestamp-reply": {
        source: "iana"
      },
      "application/timestamped-data": {
        source: "iana",
        extensions: ["tsd"]
      },
      "application/tlsrpt+gzip": {
        source: "iana"
      },
      "application/tlsrpt+json": {
        source: "iana",
        compressible: true
      },
      "application/tnauthlist": {
        source: "iana"
      },
      "application/token-introspection+jwt": {
        source: "iana"
      },
      "application/toml": {
        compressible: true,
        extensions: ["toml"]
      },
      "application/trickle-ice-sdpfrag": {
        source: "iana"
      },
      "application/trig": {
        source: "iana",
        extensions: ["trig"]
      },
      "application/ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ttml"]
      },
      "application/tve-trigger": {
        source: "iana"
      },
      "application/tzif": {
        source: "iana"
      },
      "application/tzif-leap": {
        source: "iana"
      },
      "application/ubjson": {
        compressible: false,
        extensions: ["ubj"]
      },
      "application/ulpfec": {
        source: "iana"
      },
      "application/urc-grpsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/urc-ressheet+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsheet"]
      },
      "application/urc-targetdesc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["td"]
      },
      "application/urc-uisocketdesc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vcard+json": {
        source: "iana",
        compressible: true
      },
      "application/vcard+xml": {
        source: "iana",
        compressible: true
      },
      "application/vemmi": {
        source: "iana"
      },
      "application/vividence.scriptfile": {
        source: "apache"
      },
      "application/vnd.1000minds.decision-model+xml": {
        source: "iana",
        compressible: true,
        extensions: ["1km"]
      },
      "application/vnd.3gpp-prose+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ch+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-v2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gnas": {
        source: "iana"
      },
      "application/vnd.3gpp.access-transfer-events+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.bsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gmop+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gtpc": {
        source: "iana"
      },
      "application/vnd.3gpp.interworking-data": {
        source: "iana"
      },
      "application/vnd.3gpp.lpp": {
        source: "iana"
      },
      "application/vnd.3gpp.mc-signalling-ear": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-payload": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-signalling": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-floor-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-signed+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mid-call+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ngap": {
        source: "iana"
      },
      "application/vnd.3gpp.pfcp": {
        source: "iana"
      },
      "application/vnd.3gpp.pic-bw-large": {
        source: "iana",
        extensions: ["plb"]
      },
      "application/vnd.3gpp.pic-bw-small": {
        source: "iana",
        extensions: ["psb"]
      },
      "application/vnd.3gpp.pic-bw-var": {
        source: "iana",
        extensions: ["pvb"]
      },
      "application/vnd.3gpp.s1ap": {
        source: "iana"
      },
      "application/vnd.3gpp.sms": {
        source: "iana"
      },
      "application/vnd.3gpp.sms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-ext+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.state-and-event-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ussd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.bcmcsinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.sms": {
        source: "iana"
      },
      "application/vnd.3gpp2.tcap": {
        source: "iana",
        extensions: ["tcap"]
      },
      "application/vnd.3lightssoftware.imagescal": {
        source: "iana"
      },
      "application/vnd.3m.post-it-notes": {
        source: "iana",
        extensions: ["pwn"]
      },
      "application/vnd.accpac.simply.aso": {
        source: "iana",
        extensions: ["aso"]
      },
      "application/vnd.accpac.simply.imp": {
        source: "iana",
        extensions: ["imp"]
      },
      "application/vnd.acucobol": {
        source: "iana",
        extensions: ["acu"]
      },
      "application/vnd.acucorp": {
        source: "iana",
        extensions: ["atc", "acutc"]
      },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: "apache",
        compressible: false,
        extensions: ["air"]
      },
      "application/vnd.adobe.flash.movie": {
        source: "iana"
      },
      "application/vnd.adobe.formscentral.fcdt": {
        source: "iana",
        extensions: ["fcdt"]
      },
      "application/vnd.adobe.fxp": {
        source: "iana",
        extensions: ["fxp", "fxpl"]
      },
      "application/vnd.adobe.partial-upload": {
        source: "iana"
      },
      "application/vnd.adobe.xdp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdp"]
      },
      "application/vnd.adobe.xfdf": {
        source: "iana",
        extensions: ["xfdf"]
      },
      "application/vnd.aether.imp": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata-pagedef": {
        source: "iana"
      },
      "application/vnd.afpc.cmoca-cmresource": {
        source: "iana"
      },
      "application/vnd.afpc.foca-charset": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codedfont": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codepage": {
        source: "iana"
      },
      "application/vnd.afpc.modca": {
        source: "iana"
      },
      "application/vnd.afpc.modca-cmtable": {
        source: "iana"
      },
      "application/vnd.afpc.modca-formdef": {
        source: "iana"
      },
      "application/vnd.afpc.modca-mediummap": {
        source: "iana"
      },
      "application/vnd.afpc.modca-objectcontainer": {
        source: "iana"
      },
      "application/vnd.afpc.modca-overlay": {
        source: "iana"
      },
      "application/vnd.afpc.modca-pagesegment": {
        source: "iana"
      },
      "application/vnd.age": {
        source: "iana",
        extensions: ["age"]
      },
      "application/vnd.ah-barcode": {
        source: "iana"
      },
      "application/vnd.ahead.space": {
        source: "iana",
        extensions: ["ahead"]
      },
      "application/vnd.airzip.filesecure.azf": {
        source: "iana",
        extensions: ["azf"]
      },
      "application/vnd.airzip.filesecure.azs": {
        source: "iana",
        extensions: ["azs"]
      },
      "application/vnd.amadeus+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.amazon.ebook": {
        source: "apache",
        extensions: ["azw"]
      },
      "application/vnd.amazon.mobi8-ebook": {
        source: "iana"
      },
      "application/vnd.americandynamics.acc": {
        source: "iana",
        extensions: ["acc"]
      },
      "application/vnd.amiga.ami": {
        source: "iana",
        extensions: ["ami"]
      },
      "application/vnd.amundsen.maze+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.android.ota": {
        source: "iana"
      },
      "application/vnd.android.package-archive": {
        source: "apache",
        compressible: false,
        extensions: ["apk"]
      },
      "application/vnd.anki": {
        source: "iana"
      },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: "iana",
        extensions: ["cii"]
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: "apache",
        extensions: ["fti"]
      },
      "application/vnd.antix.game-component": {
        source: "iana",
        extensions: ["atx"]
      },
      "application/vnd.apache.arrow.file": {
        source: "iana"
      },
      "application/vnd.apache.arrow.stream": {
        source: "iana"
      },
      "application/vnd.apache.thrift.binary": {
        source: "iana"
      },
      "application/vnd.apache.thrift.compact": {
        source: "iana"
      },
      "application/vnd.apache.thrift.json": {
        source: "iana"
      },
      "application/vnd.api+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.aplextor.warrp+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apothekende.reservation+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apple.installer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpkg"]
      },
      "application/vnd.apple.keynote": {
        source: "iana",
        extensions: ["key"]
      },
      "application/vnd.apple.mpegurl": {
        source: "iana",
        extensions: ["m3u8"]
      },
      "application/vnd.apple.numbers": {
        source: "iana",
        extensions: ["numbers"]
      },
      "application/vnd.apple.pages": {
        source: "iana",
        extensions: ["pages"]
      },
      "application/vnd.apple.pkpass": {
        compressible: false,
        extensions: ["pkpass"]
      },
      "application/vnd.arastra.swi": {
        source: "iana"
      },
      "application/vnd.aristanetworks.swi": {
        source: "iana",
        extensions: ["swi"]
      },
      "application/vnd.artisan+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.artsquare": {
        source: "iana"
      },
      "application/vnd.astraea-software.iota": {
        source: "iana",
        extensions: ["iota"]
      },
      "application/vnd.audiograph": {
        source: "iana",
        extensions: ["aep"]
      },
      "application/vnd.autopackage": {
        source: "iana"
      },
      "application/vnd.avalon+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.avistar+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.balsamiq.bmml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bmml"]
      },
      "application/vnd.balsamiq.bmpr": {
        source: "iana"
      },
      "application/vnd.banana-accounting": {
        source: "iana"
      },
      "application/vnd.bbf.usp.error": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bekitzur-stech+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bint.med-content": {
        source: "iana"
      },
      "application/vnd.biopax.rdf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.blink-idb-value-wrapper": {
        source: "iana"
      },
      "application/vnd.blueice.multipass": {
        source: "iana",
        extensions: ["mpm"]
      },
      "application/vnd.bluetooth.ep.oob": {
        source: "iana"
      },
      "application/vnd.bluetooth.le.oob": {
        source: "iana"
      },
      "application/vnd.bmi": {
        source: "iana",
        extensions: ["bmi"]
      },
      "application/vnd.bpf": {
        source: "iana"
      },
      "application/vnd.bpf3": {
        source: "iana"
      },
      "application/vnd.businessobjects": {
        source: "iana",
        extensions: ["rep"]
      },
      "application/vnd.byu.uapi+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cab-jscript": {
        source: "iana"
      },
      "application/vnd.canon-cpdl": {
        source: "iana"
      },
      "application/vnd.canon-lips": {
        source: "iana"
      },
      "application/vnd.capasystems-pg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cendio.thinlinc.clientconf": {
        source: "iana"
      },
      "application/vnd.century-systems.tcp_stream": {
        source: "iana"
      },
      "application/vnd.chemdraw+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdxml"]
      },
      "application/vnd.chess-pgn": {
        source: "iana"
      },
      "application/vnd.chipnuts.karaoke-mmd": {
        source: "iana",
        extensions: ["mmd"]
      },
      "application/vnd.ciedi": {
        source: "iana"
      },
      "application/vnd.cinderella": {
        source: "iana",
        extensions: ["cdy"]
      },
      "application/vnd.cirpack.isdn-ext": {
        source: "iana"
      },
      "application/vnd.citationstyles.style+xml": {
        source: "iana",
        compressible: true,
        extensions: ["csl"]
      },
      "application/vnd.claymore": {
        source: "iana",
        extensions: ["cla"]
      },
      "application/vnd.cloanto.rp9": {
        source: "iana",
        extensions: ["rp9"]
      },
      "application/vnd.clonk.c4group": {
        source: "iana",
        extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
      },
      "application/vnd.cluetrust.cartomobile-config": {
        source: "iana",
        extensions: ["c11amc"]
      },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: "iana",
        extensions: ["c11amz"]
      },
      "application/vnd.coffeescript": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet-template": {
        source: "iana"
      },
      "application/vnd.collection+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.doc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.next+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.comicbook+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.comicbook-rar": {
        source: "iana"
      },
      "application/vnd.commerce-battelle": {
        source: "iana"
      },
      "application/vnd.commonspace": {
        source: "iana",
        extensions: ["csp"]
      },
      "application/vnd.contact.cmsg": {
        source: "iana",
        extensions: ["cdbcmsg"]
      },
      "application/vnd.coreos.ignition+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cosmocaller": {
        source: "iana",
        extensions: ["cmc"]
      },
      "application/vnd.crick.clicker": {
        source: "iana",
        extensions: ["clkx"]
      },
      "application/vnd.crick.clicker.keyboard": {
        source: "iana",
        extensions: ["clkk"]
      },
      "application/vnd.crick.clicker.palette": {
        source: "iana",
        extensions: ["clkp"]
      },
      "application/vnd.crick.clicker.template": {
        source: "iana",
        extensions: ["clkt"]
      },
      "application/vnd.crick.clicker.wordbank": {
        source: "iana",
        extensions: ["clkw"]
      },
      "application/vnd.criticaltools.wbs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wbs"]
      },
      "application/vnd.cryptii.pipe+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.crypto-shade-file": {
        source: "iana"
      },
      "application/vnd.cryptomator.encrypted": {
        source: "iana"
      },
      "application/vnd.cryptomator.vault": {
        source: "iana"
      },
      "application/vnd.ctc-posml": {
        source: "iana",
        extensions: ["pml"]
      },
      "application/vnd.ctct.ws+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cups-pdf": {
        source: "iana"
      },
      "application/vnd.cups-postscript": {
        source: "iana"
      },
      "application/vnd.cups-ppd": {
        source: "iana",
        extensions: ["ppd"]
      },
      "application/vnd.cups-raster": {
        source: "iana"
      },
      "application/vnd.cups-raw": {
        source: "iana"
      },
      "application/vnd.curl": {
        source: "iana"
      },
      "application/vnd.curl.car": {
        source: "apache",
        extensions: ["car"]
      },
      "application/vnd.curl.pcurl": {
        source: "apache",
        extensions: ["pcurl"]
      },
      "application/vnd.cyan.dean.root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cybank": {
        source: "iana"
      },
      "application/vnd.cyclonedx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cyclonedx+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.d2l.coursepackage1p0+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.d3m-dataset": {
        source: "iana"
      },
      "application/vnd.d3m-problem": {
        source: "iana"
      },
      "application/vnd.dart": {
        source: "iana",
        compressible: true,
        extensions: ["dart"]
      },
      "application/vnd.data-vision.rdz": {
        source: "iana",
        extensions: ["rdz"]
      },
      "application/vnd.datapackage+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dataresource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dbf": {
        source: "iana",
        extensions: ["dbf"]
      },
      "application/vnd.debian.binary-package": {
        source: "iana"
      },
      "application/vnd.dece.data": {
        source: "iana",
        extensions: ["uvf", "uvvf", "uvd", "uvvd"]
      },
      "application/vnd.dece.ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uvt", "uvvt"]
      },
      "application/vnd.dece.unspecified": {
        source: "iana",
        extensions: ["uvx", "uvvx"]
      },
      "application/vnd.dece.zip": {
        source: "iana",
        extensions: ["uvz", "uvvz"]
      },
      "application/vnd.denovo.fcselayout-link": {
        source: "iana",
        extensions: ["fe_launch"]
      },
      "application/vnd.desmume.movie": {
        source: "iana"
      },
      "application/vnd.dir-bi.plate-dl-nosuffix": {
        source: "iana"
      },
      "application/vnd.dm.delegation+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dna": {
        source: "iana",
        extensions: ["dna"]
      },
      "application/vnd.document+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dolby.mlp": {
        source: "apache",
        extensions: ["mlp"]
      },
      "application/vnd.dolby.mobile.1": {
        source: "iana"
      },
      "application/vnd.dolby.mobile.2": {
        source: "iana"
      },
      "application/vnd.doremir.scorecloud-binary-document": {
        source: "iana"
      },
      "application/vnd.dpgraph": {
        source: "iana",
        extensions: ["dpg"]
      },
      "application/vnd.dreamfactory": {
        source: "iana",
        extensions: ["dfac"]
      },
      "application/vnd.drive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ds-keypoint": {
        source: "apache",
        extensions: ["kpxx"]
      },
      "application/vnd.dtg.local": {
        source: "iana"
      },
      "application/vnd.dtg.local.flash": {
        source: "iana"
      },
      "application/vnd.dtg.local.html": {
        source: "iana"
      },
      "application/vnd.dvb.ait": {
        source: "iana",
        extensions: ["ait"]
      },
      "application/vnd.dvb.dvbisl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.dvbj": {
        source: "iana"
      },
      "application/vnd.dvb.esgcontainer": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcdftnotifaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess2": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgpdd": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcroaming": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-base": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-enhancement": {
        source: "iana"
      },
      "application/vnd.dvb.notif-aggregate-root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-container+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-generic+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-msglist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-init+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.pfr": {
        source: "iana"
      },
      "application/vnd.dvb.service": {
        source: "iana",
        extensions: ["svc"]
      },
      "application/vnd.dxr": {
        source: "iana"
      },
      "application/vnd.dynageo": {
        source: "iana",
        extensions: ["geo"]
      },
      "application/vnd.dzr": {
        source: "iana"
      },
      "application/vnd.easykaraoke.cdgdownload": {
        source: "iana"
      },
      "application/vnd.ecdis-update": {
        source: "iana"
      },
      "application/vnd.ecip.rlp": {
        source: "iana"
      },
      "application/vnd.eclipse.ditto+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ecowin.chart": {
        source: "iana",
        extensions: ["mag"]
      },
      "application/vnd.ecowin.filerequest": {
        source: "iana"
      },
      "application/vnd.ecowin.fileupdate": {
        source: "iana"
      },
      "application/vnd.ecowin.series": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesrequest": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesupdate": {
        source: "iana"
      },
      "application/vnd.efi.img": {
        source: "iana"
      },
      "application/vnd.efi.iso": {
        source: "iana"
      },
      "application/vnd.emclient.accessrequest+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.enliven": {
        source: "iana",
        extensions: ["nml"]
      },
      "application/vnd.enphase.envoy": {
        source: "iana"
      },
      "application/vnd.eprints.data+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.epson.esf": {
        source: "iana",
        extensions: ["esf"]
      },
      "application/vnd.epson.msf": {
        source: "iana",
        extensions: ["msf"]
      },
      "application/vnd.epson.quickanime": {
        source: "iana",
        extensions: ["qam"]
      },
      "application/vnd.epson.salt": {
        source: "iana",
        extensions: ["slt"]
      },
      "application/vnd.epson.ssf": {
        source: "iana",
        extensions: ["ssf"]
      },
      "application/vnd.ericsson.quickcall": {
        source: "iana"
      },
      "application/vnd.espass-espass+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.eszigno3+xml": {
        source: "iana",
        compressible: true,
        extensions: ["es3", "et3"]
      },
      "application/vnd.etsi.aoc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.asic-e+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.asic-s+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.cug+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvcommand+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-bc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-cod+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-npvr+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvservice+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mcid+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mheg5": {
        source: "iana"
      },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.pstn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.sci+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.simservs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.timestamp-token": {
        source: "iana"
      },
      "application/vnd.etsi.tsl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.tsl.der": {
        source: "iana"
      },
      "application/vnd.eu.kasparian.car+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.eudora.data": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.profile": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.settings": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.theme": {
        source: "iana"
      },
      "application/vnd.exstream-empower+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.exstream-package": {
        source: "iana"
      },
      "application/vnd.ezpix-album": {
        source: "iana",
        extensions: ["ez2"]
      },
      "application/vnd.ezpix-package": {
        source: "iana",
        extensions: ["ez3"]
      },
      "application/vnd.f-secure.mobile": {
        source: "iana"
      },
      "application/vnd.familysearch.gedcom+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.fastcopy-disk-image": {
        source: "iana"
      },
      "application/vnd.fdf": {
        source: "iana",
        extensions: ["fdf"]
      },
      "application/vnd.fdsn.mseed": {
        source: "iana",
        extensions: ["mseed"]
      },
      "application/vnd.fdsn.seed": {
        source: "iana",
        extensions: ["seed", "dataless"]
      },
      "application/vnd.ffsns": {
        source: "iana"
      },
      "application/vnd.ficlab.flb+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.filmit.zfc": {
        source: "iana"
      },
      "application/vnd.fints": {
        source: "iana"
      },
      "application/vnd.firemonkeys.cloudcell": {
        source: "iana"
      },
      "application/vnd.flographit": {
        source: "iana",
        extensions: ["gph"]
      },
      "application/vnd.fluxtime.clip": {
        source: "iana",
        extensions: ["ftc"]
      },
      "application/vnd.font-fontforge-sfd": {
        source: "iana"
      },
      "application/vnd.framemaker": {
        source: "iana",
        extensions: ["fm", "frame", "maker", "book"]
      },
      "application/vnd.frogans.fnc": {
        source: "iana",
        extensions: ["fnc"]
      },
      "application/vnd.frogans.ltf": {
        source: "iana",
        extensions: ["ltf"]
      },
      "application/vnd.fsc.weblaunch": {
        source: "iana",
        extensions: ["fsc"]
      },
      "application/vnd.fujifilm.fb.docuworks": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.binder": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.jfi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fujitsu.oasys": {
        source: "iana",
        extensions: ["oas"]
      },
      "application/vnd.fujitsu.oasys2": {
        source: "iana",
        extensions: ["oa2"]
      },
      "application/vnd.fujitsu.oasys3": {
        source: "iana",
        extensions: ["oa3"]
      },
      "application/vnd.fujitsu.oasysgp": {
        source: "iana",
        extensions: ["fg5"]
      },
      "application/vnd.fujitsu.oasysprs": {
        source: "iana",
        extensions: ["bh2"]
      },
      "application/vnd.fujixerox.art-ex": {
        source: "iana"
      },
      "application/vnd.fujixerox.art4": {
        source: "iana"
      },
      "application/vnd.fujixerox.ddd": {
        source: "iana",
        extensions: ["ddd"]
      },
      "application/vnd.fujixerox.docuworks": {
        source: "iana",
        extensions: ["xdw"]
      },
      "application/vnd.fujixerox.docuworks.binder": {
        source: "iana",
        extensions: ["xbd"]
      },
      "application/vnd.fujixerox.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujixerox.hbpl": {
        source: "iana"
      },
      "application/vnd.fut-misnet": {
        source: "iana"
      },
      "application/vnd.futoin+cbor": {
        source: "iana"
      },
      "application/vnd.futoin+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fuzzysheet": {
        source: "iana",
        extensions: ["fzs"]
      },
      "application/vnd.genomatix.tuxedo": {
        source: "iana",
        extensions: ["txd"]
      },
      "application/vnd.gentics.grd+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geo+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geocube+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geogebra.file": {
        source: "iana",
        extensions: ["ggb"]
      },
      "application/vnd.geogebra.slides": {
        source: "iana"
      },
      "application/vnd.geogebra.tool": {
        source: "iana",
        extensions: ["ggt"]
      },
      "application/vnd.geometry-explorer": {
        source: "iana",
        extensions: ["gex", "gre"]
      },
      "application/vnd.geonext": {
        source: "iana",
        extensions: ["gxt"]
      },
      "application/vnd.geoplan": {
        source: "iana",
        extensions: ["g2w"]
      },
      "application/vnd.geospace": {
        source: "iana",
        extensions: ["g3w"]
      },
      "application/vnd.gerber": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt-response": {
        source: "iana"
      },
      "application/vnd.gmx": {
        source: "iana",
        extensions: ["gmx"]
      },
      "application/vnd.google-apps.document": {
        compressible: false,
        extensions: ["gdoc"]
      },
      "application/vnd.google-apps.presentation": {
        compressible: false,
        extensions: ["gslides"]
      },
      "application/vnd.google-apps.spreadsheet": {
        compressible: false,
        extensions: ["gsheet"]
      },
      "application/vnd.google-earth.kml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["kml"]
      },
      "application/vnd.google-earth.kmz": {
        source: "iana",
        compressible: false,
        extensions: ["kmz"]
      },
      "application/vnd.gov.sk.e-form+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gov.sk.e-form+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.gov.sk.xmldatacontainer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.grafeq": {
        source: "iana",
        extensions: ["gqf", "gqs"]
      },
      "application/vnd.gridmp": {
        source: "iana"
      },
      "application/vnd.groove-account": {
        source: "iana",
        extensions: ["gac"]
      },
      "application/vnd.groove-help": {
        source: "iana",
        extensions: ["ghf"]
      },
      "application/vnd.groove-identity-message": {
        source: "iana",
        extensions: ["gim"]
      },
      "application/vnd.groove-injector": {
        source: "iana",
        extensions: ["grv"]
      },
      "application/vnd.groove-tool-message": {
        source: "iana",
        extensions: ["gtm"]
      },
      "application/vnd.groove-tool-template": {
        source: "iana",
        extensions: ["tpl"]
      },
      "application/vnd.groove-vcard": {
        source: "iana",
        extensions: ["vcg"]
      },
      "application/vnd.hal+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hal+xml": {
        source: "iana",
        compressible: true,
        extensions: ["hal"]
      },
      "application/vnd.handheld-entertainment+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zmm"]
      },
      "application/vnd.hbci": {
        source: "iana",
        extensions: ["hbci"]
      },
      "application/vnd.hc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hcl-bireports": {
        source: "iana"
      },
      "application/vnd.hdt": {
        source: "iana"
      },
      "application/vnd.heroku+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hhe.lesson-player": {
        source: "iana",
        extensions: ["les"]
      },
      "application/vnd.hl7cda+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hl7v2+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hp-hpgl": {
        source: "iana",
        extensions: ["hpgl"]
      },
      "application/vnd.hp-hpid": {
        source: "iana",
        extensions: ["hpid"]
      },
      "application/vnd.hp-hps": {
        source: "iana",
        extensions: ["hps"]
      },
      "application/vnd.hp-jlyt": {
        source: "iana",
        extensions: ["jlt"]
      },
      "application/vnd.hp-pcl": {
        source: "iana",
        extensions: ["pcl"]
      },
      "application/vnd.hp-pclxl": {
        source: "iana",
        extensions: ["pclxl"]
      },
      "application/vnd.httphone": {
        source: "iana"
      },
      "application/vnd.hydrostatix.sof-data": {
        source: "iana",
        extensions: ["sfd-hdstx"]
      },
      "application/vnd.hyper+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyper-item+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyperdrive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hzn-3d-crossword": {
        source: "iana"
      },
      "application/vnd.ibm.afplinedata": {
        source: "iana"
      },
      "application/vnd.ibm.electronic-media": {
        source: "iana"
      },
      "application/vnd.ibm.minipay": {
        source: "iana",
        extensions: ["mpy"]
      },
      "application/vnd.ibm.modcap": {
        source: "iana",
        extensions: ["afp", "listafp", "list3820"]
      },
      "application/vnd.ibm.rights-management": {
        source: "iana",
        extensions: ["irm"]
      },
      "application/vnd.ibm.secure-container": {
        source: "iana",
        extensions: ["sc"]
      },
      "application/vnd.iccprofile": {
        source: "iana",
        extensions: ["icc", "icm"]
      },
      "application/vnd.ieee.1905": {
        source: "iana"
      },
      "application/vnd.igloader": {
        source: "iana",
        extensions: ["igl"]
      },
      "application/vnd.imagemeter.folder+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.imagemeter.image+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.immervision-ivp": {
        source: "iana",
        extensions: ["ivp"]
      },
      "application/vnd.immervision-ivu": {
        source: "iana",
        extensions: ["ivu"]
      },
      "application/vnd.ims.imsccv1p1": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p2": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p3": {
        source: "iana"
      },
      "application/vnd.ims.lis.v2.result+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy.id+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informedcontrol.rms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informix-visionary": {
        source: "iana"
      },
      "application/vnd.infotech.project": {
        source: "iana"
      },
      "application/vnd.infotech.project+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.innopath.wamp.notification": {
        source: "iana"
      },
      "application/vnd.insors.igm": {
        source: "iana",
        extensions: ["igm"]
      },
      "application/vnd.intercon.formnet": {
        source: "iana",
        extensions: ["xpw", "xpx"]
      },
      "application/vnd.intergeo": {
        source: "iana",
        extensions: ["i2g"]
      },
      "application/vnd.intertrust.digibox": {
        source: "iana"
      },
      "application/vnd.intertrust.nncp": {
        source: "iana"
      },
      "application/vnd.intu.qbo": {
        source: "iana",
        extensions: ["qbo"]
      },
      "application/vnd.intu.qfx": {
        source: "iana",
        extensions: ["qfx"]
      },
      "application/vnd.iptc.g2.catalogitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.conceptitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.knowledgeitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.packageitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.planningitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ipunplugged.rcprofile": {
        source: "iana",
        extensions: ["rcprofile"]
      },
      "application/vnd.irepository.package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["irp"]
      },
      "application/vnd.is-xpr": {
        source: "iana",
        extensions: ["xpr"]
      },
      "application/vnd.isac.fcs": {
        source: "iana",
        extensions: ["fcs"]
      },
      "application/vnd.iso11783-10+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.jam": {
        source: "iana",
        extensions: ["jam"]
      },
      "application/vnd.japannet-directory-service": {
        source: "iana"
      },
      "application/vnd.japannet-jpnstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-payment-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-registration": {
        source: "iana"
      },
      "application/vnd.japannet-registration-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-setstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-verification": {
        source: "iana"
      },
      "application/vnd.japannet-verification-wakeup": {
        source: "iana"
      },
      "application/vnd.jcp.javame.midlet-rms": {
        source: "iana",
        extensions: ["rms"]
      },
      "application/vnd.jisp": {
        source: "iana",
        extensions: ["jisp"]
      },
      "application/vnd.joost.joda-archive": {
        source: "iana",
        extensions: ["joda"]
      },
      "application/vnd.jsk.isdn-ngn": {
        source: "iana"
      },
      "application/vnd.kahootz": {
        source: "iana",
        extensions: ["ktz", "ktr"]
      },
      "application/vnd.kde.karbon": {
        source: "iana",
        extensions: ["karbon"]
      },
      "application/vnd.kde.kchart": {
        source: "iana",
        extensions: ["chrt"]
      },
      "application/vnd.kde.kformula": {
        source: "iana",
        extensions: ["kfo"]
      },
      "application/vnd.kde.kivio": {
        source: "iana",
        extensions: ["flw"]
      },
      "application/vnd.kde.kontour": {
        source: "iana",
        extensions: ["kon"]
      },
      "application/vnd.kde.kpresenter": {
        source: "iana",
        extensions: ["kpr", "kpt"]
      },
      "application/vnd.kde.kspread": {
        source: "iana",
        extensions: ["ksp"]
      },
      "application/vnd.kde.kword": {
        source: "iana",
        extensions: ["kwd", "kwt"]
      },
      "application/vnd.kenameaapp": {
        source: "iana",
        extensions: ["htke"]
      },
      "application/vnd.kidspiration": {
        source: "iana",
        extensions: ["kia"]
      },
      "application/vnd.kinar": {
        source: "iana",
        extensions: ["kne", "knp"]
      },
      "application/vnd.koan": {
        source: "iana",
        extensions: ["skp", "skd", "skt", "skm"]
      },
      "application/vnd.kodak-descriptor": {
        source: "iana",
        extensions: ["sse"]
      },
      "application/vnd.las": {
        source: "iana"
      },
      "application/vnd.las.las+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.las.las+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lasxml"]
      },
      "application/vnd.laszip": {
        source: "iana"
      },
      "application/vnd.leap+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.liberty-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.llamagraphics.life-balance.desktop": {
        source: "iana",
        extensions: ["lbd"]
      },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lbe"]
      },
      "application/vnd.logipipe.circuit+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.loom": {
        source: "iana"
      },
      "application/vnd.lotus-1-2-3": {
        source: "iana",
        extensions: ["123"]
      },
      "application/vnd.lotus-approach": {
        source: "iana",
        extensions: ["apr"]
      },
      "application/vnd.lotus-freelance": {
        source: "iana",
        extensions: ["pre"]
      },
      "application/vnd.lotus-notes": {
        source: "iana",
        extensions: ["nsf"]
      },
      "application/vnd.lotus-organizer": {
        source: "iana",
        extensions: ["org"]
      },
      "application/vnd.lotus-screencam": {
        source: "iana",
        extensions: ["scm"]
      },
      "application/vnd.lotus-wordpro": {
        source: "iana",
        extensions: ["lwp"]
      },
      "application/vnd.macports.portpkg": {
        source: "iana",
        extensions: ["portpkg"]
      },
      "application/vnd.mapbox-vector-tile": {
        source: "iana",
        extensions: ["mvt"]
      },
      "application/vnd.marlin.drm.actiontoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.conftoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.license+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.mdcf": {
        source: "iana"
      },
      "application/vnd.mason+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.maxar.archive.3tz+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.maxmind.maxmind-db": {
        source: "iana"
      },
      "application/vnd.mcd": {
        source: "iana",
        extensions: ["mcd"]
      },
      "application/vnd.medcalcdata": {
        source: "iana",
        extensions: ["mc1"]
      },
      "application/vnd.mediastation.cdkey": {
        source: "iana",
        extensions: ["cdkey"]
      },
      "application/vnd.meridian-slingshot": {
        source: "iana"
      },
      "application/vnd.mfer": {
        source: "iana",
        extensions: ["mwf"]
      },
      "application/vnd.mfmp": {
        source: "iana",
        extensions: ["mfm"]
      },
      "application/vnd.micro+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.micrografx.flo": {
        source: "iana",
        extensions: ["flo"]
      },
      "application/vnd.micrografx.igx": {
        source: "iana",
        extensions: ["igx"]
      },
      "application/vnd.microsoft.portable-executable": {
        source: "iana"
      },
      "application/vnd.microsoft.windows.thumbnail-cache": {
        source: "iana"
      },
      "application/vnd.miele+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.mif": {
        source: "iana",
        extensions: ["mif"]
      },
      "application/vnd.minisoft-hp3000-save": {
        source: "iana"
      },
      "application/vnd.mitsubishi.misty-guard.trustweb": {
        source: "iana"
      },
      "application/vnd.mobius.daf": {
        source: "iana",
        extensions: ["daf"]
      },
      "application/vnd.mobius.dis": {
        source: "iana",
        extensions: ["dis"]
      },
      "application/vnd.mobius.mbk": {
        source: "iana",
        extensions: ["mbk"]
      },
      "application/vnd.mobius.mqy": {
        source: "iana",
        extensions: ["mqy"]
      },
      "application/vnd.mobius.msl": {
        source: "iana",
        extensions: ["msl"]
      },
      "application/vnd.mobius.plc": {
        source: "iana",
        extensions: ["plc"]
      },
      "application/vnd.mobius.txf": {
        source: "iana",
        extensions: ["txf"]
      },
      "application/vnd.mophun.application": {
        source: "iana",
        extensions: ["mpn"]
      },
      "application/vnd.mophun.certificate": {
        source: "iana",
        extensions: ["mpc"]
      },
      "application/vnd.motorola.flexsuite": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.adsi": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.fis": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.gotap": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.kmr": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.ttc": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.wem": {
        source: "iana"
      },
      "application/vnd.motorola.iprm": {
        source: "iana"
      },
      "application/vnd.mozilla.xul+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xul"]
      },
      "application/vnd.ms-3mfdocument": {
        source: "iana"
      },
      "application/vnd.ms-artgalry": {
        source: "iana",
        extensions: ["cil"]
      },
      "application/vnd.ms-asf": {
        source: "iana"
      },
      "application/vnd.ms-cab-compressed": {
        source: "iana",
        extensions: ["cab"]
      },
      "application/vnd.ms-color.iccprofile": {
        source: "apache"
      },
      "application/vnd.ms-excel": {
        source: "iana",
        compressible: false,
        extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
      },
      "application/vnd.ms-excel.addin.macroenabled.12": {
        source: "iana",
        extensions: ["xlam"]
      },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: "iana",
        extensions: ["xlsb"]
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": {
        source: "iana",
        extensions: ["xlsm"]
      },
      "application/vnd.ms-excel.template.macroenabled.12": {
        source: "iana",
        extensions: ["xltm"]
      },
      "application/vnd.ms-fontobject": {
        source: "iana",
        compressible: true,
        extensions: ["eot"]
      },
      "application/vnd.ms-htmlhelp": {
        source: "iana",
        extensions: ["chm"]
      },
      "application/vnd.ms-ims": {
        source: "iana",
        extensions: ["ims"]
      },
      "application/vnd.ms-lrm": {
        source: "iana",
        extensions: ["lrm"]
      },
      "application/vnd.ms-office.activex+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-officetheme": {
        source: "iana",
        extensions: ["thmx"]
      },
      "application/vnd.ms-opentype": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-outlook": {
        compressible: false,
        extensions: ["msg"]
      },
      "application/vnd.ms-package.obfuscated-opentype": {
        source: "apache"
      },
      "application/vnd.ms-pki.seccat": {
        source: "apache",
        extensions: ["cat"]
      },
      "application/vnd.ms-pki.stl": {
        source: "apache",
        extensions: ["stl"]
      },
      "application/vnd.ms-playready.initiator+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-powerpoint": {
        source: "iana",
        compressible: false,
        extensions: ["ppt", "pps", "pot"]
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: "iana",
        extensions: ["ppam"]
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: "iana",
        extensions: ["pptm"]
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: "iana",
        extensions: ["sldm"]
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: "iana",
        extensions: ["ppsm"]
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: "iana",
        extensions: ["potm"]
      },
      "application/vnd.ms-printdevicecapabilities+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-printing.printticket+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-printschematicket+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-project": {
        source: "iana",
        extensions: ["mpp", "mpt"]
      },
      "application/vnd.ms-tnef": {
        source: "iana"
      },
      "application/vnd.ms-windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.nwprinting.oob": {
        source: "iana"
      },
      "application/vnd.ms-windows.printerpairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.wsd.oob": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-resp": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-resp": {
        source: "iana"
      },
      "application/vnd.ms-word.document.macroenabled.12": {
        source: "iana",
        extensions: ["docm"]
      },
      "application/vnd.ms-word.template.macroenabled.12": {
        source: "iana",
        extensions: ["dotm"]
      },
      "application/vnd.ms-works": {
        source: "iana",
        extensions: ["wps", "wks", "wcm", "wdb"]
      },
      "application/vnd.ms-wpl": {
        source: "iana",
        extensions: ["wpl"]
      },
      "application/vnd.ms-xpsdocument": {
        source: "iana",
        compressible: false,
        extensions: ["xps"]
      },
      "application/vnd.msa-disk-image": {
        source: "iana"
      },
      "application/vnd.mseq": {
        source: "iana",
        extensions: ["mseq"]
      },
      "application/vnd.msign": {
        source: "iana"
      },
      "application/vnd.multiad.creator": {
        source: "iana"
      },
      "application/vnd.multiad.creator.cif": {
        source: "iana"
      },
      "application/vnd.music-niff": {
        source: "iana"
      },
      "application/vnd.musician": {
        source: "iana",
        extensions: ["mus"]
      },
      "application/vnd.muvee.style": {
        source: "iana",
        extensions: ["msty"]
      },
      "application/vnd.mynfc": {
        source: "iana",
        extensions: ["taglet"]
      },
      "application/vnd.nacamar.ybrid+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ncd.control": {
        source: "iana"
      },
      "application/vnd.ncd.reference": {
        source: "iana"
      },
      "application/vnd.nearst.inv+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nebumind.line": {
        source: "iana"
      },
      "application/vnd.nervana": {
        source: "iana"
      },
      "application/vnd.netfpx": {
        source: "iana"
      },
      "application/vnd.neurolanguage.nlu": {
        source: "iana",
        extensions: ["nlu"]
      },
      "application/vnd.nimn": {
        source: "iana"
      },
      "application/vnd.nintendo.nitro.rom": {
        source: "iana"
      },
      "application/vnd.nintendo.snes.rom": {
        source: "iana"
      },
      "application/vnd.nitf": {
        source: "iana",
        extensions: ["ntf", "nitf"]
      },
      "application/vnd.noblenet-directory": {
        source: "iana",
        extensions: ["nnd"]
      },
      "application/vnd.noblenet-sealer": {
        source: "iana",
        extensions: ["nns"]
      },
      "application/vnd.noblenet-web": {
        source: "iana",
        extensions: ["nnw"]
      },
      "application/vnd.nokia.catalogs": {
        source: "iana"
      },
      "application/vnd.nokia.conml+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.conml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.iptv.config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.isds-radio-presets": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.landmarkcollection+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ac"]
      },
      "application/vnd.nokia.n-gage.data": {
        source: "iana",
        extensions: ["ngdat"]
      },
      "application/vnd.nokia.n-gage.symbian.install": {
        source: "iana",
        extensions: ["n-gage"]
      },
      "application/vnd.nokia.ncd": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.radio-preset": {
        source: "iana",
        extensions: ["rpst"]
      },
      "application/vnd.nokia.radio-presets": {
        source: "iana",
        extensions: ["rpss"]
      },
      "application/vnd.novadigm.edm": {
        source: "iana",
        extensions: ["edm"]
      },
      "application/vnd.novadigm.edx": {
        source: "iana",
        extensions: ["edx"]
      },
      "application/vnd.novadigm.ext": {
        source: "iana",
        extensions: ["ext"]
      },
      "application/vnd.ntt-local.content-share": {
        source: "iana"
      },
      "application/vnd.ntt-local.file-transfer": {
        source: "iana"
      },
      "application/vnd.ntt-local.ogw_remote-access": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_remote": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_tcp_stream": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.chart": {
        source: "iana",
        extensions: ["odc"]
      },
      "application/vnd.oasis.opendocument.chart-template": {
        source: "iana",
        extensions: ["otc"]
      },
      "application/vnd.oasis.opendocument.database": {
        source: "iana",
        extensions: ["odb"]
      },
      "application/vnd.oasis.opendocument.formula": {
        source: "iana",
        extensions: ["odf"]
      },
      "application/vnd.oasis.opendocument.formula-template": {
        source: "iana",
        extensions: ["odft"]
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: "iana",
        compressible: false,
        extensions: ["odg"]
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: "iana",
        extensions: ["otg"]
      },
      "application/vnd.oasis.opendocument.image": {
        source: "iana",
        extensions: ["odi"]
      },
      "application/vnd.oasis.opendocument.image-template": {
        source: "iana",
        extensions: ["oti"]
      },
      "application/vnd.oasis.opendocument.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["odp"]
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: "iana",
        extensions: ["otp"]
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: "iana",
        compressible: false,
        extensions: ["ods"]
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: "iana",
        extensions: ["ots"]
      },
      "application/vnd.oasis.opendocument.text": {
        source: "iana",
        compressible: false,
        extensions: ["odt"]
      },
      "application/vnd.oasis.opendocument.text-master": {
        source: "iana",
        extensions: ["odm"]
      },
      "application/vnd.oasis.opendocument.text-template": {
        source: "iana",
        extensions: ["ott"]
      },
      "application/vnd.oasis.opendocument.text-web": {
        source: "iana",
        extensions: ["oth"]
      },
      "application/vnd.obn": {
        source: "iana"
      },
      "application/vnd.ocf+cbor": {
        source: "iana"
      },
      "application/vnd.oci.image.manifest.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oftn.l10n+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessdownload+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessstreaming+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.cspg-hexbinary": {
        source: "iana"
      },
      "application/vnd.oipf.dae.svg+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.dae.xhtml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.mippvcontrolmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.pae.gem": {
        source: "iana"
      },
      "application/vnd.oipf.spdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.spdlist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.ueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.userprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.olpc-sugar": {
        source: "iana",
        extensions: ["xo"]
      },
      "application/vnd.oma-scws-config": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-request": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-response": {
        source: "iana"
      },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.drm-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.imd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.ltkm": {
        source: "iana"
      },
      "application/vnd.oma.bcast.notification+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.provisioningtrigger": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgboot": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgdd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sgdu": {
        source: "iana"
      },
      "application/vnd.oma.bcast.simple-symbol-container": {
        source: "iana"
      },
      "application/vnd.oma.bcast.smartcard-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sprov+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.stkm": {
        source: "iana"
      },
      "application/vnd.oma.cab-address-book+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-feature-handler+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-pcc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-subs-invite+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-user-prefs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.dcd": {
        source: "iana"
      },
      "application/vnd.oma.dcdc": {
        source: "iana"
      },
      "application/vnd.oma.dd2+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dd2"]
      },
      "application/vnd.oma.drm.risd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.group-usage-list+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+cbor": {
        source: "iana"
      },
      "application/vnd.oma.lwm2m+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+tlv": {
        source: "iana"
      },
      "application/vnd.oma.pal+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.detailed-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.final-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.groups+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.invocation-descriptor+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.optimized-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.push": {
        source: "iana"
      },
      "application/vnd.oma.scidm.messages+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.xcap-directory+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.omads-email+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-file+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-folder+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omaloc-supl-init": {
        source: "iana"
      },
      "application/vnd.onepager": {
        source: "iana"
      },
      "application/vnd.onepagertamp": {
        source: "iana"
      },
      "application/vnd.onepagertamx": {
        source: "iana"
      },
      "application/vnd.onepagertat": {
        source: "iana"
      },
      "application/vnd.onepagertatp": {
        source: "iana"
      },
      "application/vnd.onepagertatx": {
        source: "iana"
      },
      "application/vnd.openblox.game+xml": {
        source: "iana",
        compressible: true,
        extensions: ["obgx"]
      },
      "application/vnd.openblox.game-binary": {
        source: "iana"
      },
      "application/vnd.openeye.oeb": {
        source: "iana"
      },
      "application/vnd.openofficeorg.extension": {
        source: "apache",
        extensions: ["oxt"]
      },
      "application/vnd.openstreetmap.data+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osm"]
      },
      "application/vnd.opentimestamps.ots": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["pptx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: "iana",
        extensions: ["sldx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: "iana",
        extensions: ["ppsx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: "iana",
        extensions: ["potx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: "iana",
        compressible: false,
        extensions: ["xlsx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: "iana",
        extensions: ["xltx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: "iana",
        compressible: false,
        extensions: ["docx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: "iana",
        extensions: ["dotx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oracle.resource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.orange.indata": {
        source: "iana"
      },
      "application/vnd.osa.netdeploy": {
        source: "iana"
      },
      "application/vnd.osgeo.mapguide.package": {
        source: "iana",
        extensions: ["mgp"]
      },
      "application/vnd.osgi.bundle": {
        source: "iana"
      },
      "application/vnd.osgi.dp": {
        source: "iana",
        extensions: ["dp"]
      },
      "application/vnd.osgi.subsystem": {
        source: "iana",
        extensions: ["esa"]
      },
      "application/vnd.otps.ct-kip+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oxli.countgraph": {
        source: "iana"
      },
      "application/vnd.pagerduty+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.palm": {
        source: "iana",
        extensions: ["pdb", "pqa", "oprc"]
      },
      "application/vnd.panoply": {
        source: "iana"
      },
      "application/vnd.paos.xml": {
        source: "iana"
      },
      "application/vnd.patentdive": {
        source: "iana"
      },
      "application/vnd.patientecommsdoc": {
        source: "iana"
      },
      "application/vnd.pawaafile": {
        source: "iana",
        extensions: ["paw"]
      },
      "application/vnd.pcos": {
        source: "iana"
      },
      "application/vnd.pg.format": {
        source: "iana",
        extensions: ["str"]
      },
      "application/vnd.pg.osasli": {
        source: "iana",
        extensions: ["ei6"]
      },
      "application/vnd.piaccess.application-licence": {
        source: "iana"
      },
      "application/vnd.picsel": {
        source: "iana",
        extensions: ["efif"]
      },
      "application/vnd.pmi.widget": {
        source: "iana",
        extensions: ["wg"]
      },
      "application/vnd.poc.group-advertisement+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.pocketlearn": {
        source: "iana",
        extensions: ["plf"]
      },
      "application/vnd.powerbuilder6": {
        source: "iana",
        extensions: ["pbd"]
      },
      "application/vnd.powerbuilder6-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder7": {
        source: "iana"
      },
      "application/vnd.powerbuilder7-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder75": {
        source: "iana"
      },
      "application/vnd.powerbuilder75-s": {
        source: "iana"
      },
      "application/vnd.preminet": {
        source: "iana"
      },
      "application/vnd.previewsystems.box": {
        source: "iana",
        extensions: ["box"]
      },
      "application/vnd.proteus.magazine": {
        source: "iana",
        extensions: ["mgz"]
      },
      "application/vnd.psfs": {
        source: "iana"
      },
      "application/vnd.publishare-delta-tree": {
        source: "iana",
        extensions: ["qps"]
      },
      "application/vnd.pvi.ptid1": {
        source: "iana",
        extensions: ["ptid"]
      },
      "application/vnd.pwg-multiplexed": {
        source: "iana"
      },
      "application/vnd.pwg-xhtml-print+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.qualcomm.brew-app-res": {
        source: "iana"
      },
      "application/vnd.quarantainenet": {
        source: "iana"
      },
      "application/vnd.quark.quarkxpress": {
        source: "iana",
        extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
      },
      "application/vnd.quobject-quoxdocument": {
        source: "iana"
      },
      "application/vnd.radisys.moml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-stream+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-base+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-group+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-speech+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-transform+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rainstor.data": {
        source: "iana"
      },
      "application/vnd.rapid": {
        source: "iana"
      },
      "application/vnd.rar": {
        source: "iana",
        extensions: ["rar"]
      },
      "application/vnd.realvnc.bed": {
        source: "iana",
        extensions: ["bed"]
      },
      "application/vnd.recordare.musicxml": {
        source: "iana",
        extensions: ["mxl"]
      },
      "application/vnd.recordare.musicxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musicxml"]
      },
      "application/vnd.renlearn.rlprint": {
        source: "iana"
      },
      "application/vnd.resilient.logic": {
        source: "iana"
      },
      "application/vnd.restful+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rig.cryptonote": {
        source: "iana",
        extensions: ["cryptonote"]
      },
      "application/vnd.rim.cod": {
        source: "apache",
        extensions: ["cod"]
      },
      "application/vnd.rn-realmedia": {
        source: "apache",
        extensions: ["rm"]
      },
      "application/vnd.rn-realmedia-vbr": {
        source: "apache",
        extensions: ["rmvb"]
      },
      "application/vnd.route66.link66+xml": {
        source: "iana",
        compressible: true,
        extensions: ["link66"]
      },
      "application/vnd.rs-274x": {
        source: "iana"
      },
      "application/vnd.ruckus.download": {
        source: "iana"
      },
      "application/vnd.s3sms": {
        source: "iana"
      },
      "application/vnd.sailingtracker.track": {
        source: "iana",
        extensions: ["st"]
      },
      "application/vnd.sar": {
        source: "iana"
      },
      "application/vnd.sbm.cid": {
        source: "iana"
      },
      "application/vnd.sbm.mid2": {
        source: "iana"
      },
      "application/vnd.scribus": {
        source: "iana"
      },
      "application/vnd.sealed.3df": {
        source: "iana"
      },
      "application/vnd.sealed.csf": {
        source: "iana"
      },
      "application/vnd.sealed.doc": {
        source: "iana"
      },
      "application/vnd.sealed.eml": {
        source: "iana"
      },
      "application/vnd.sealed.mht": {
        source: "iana"
      },
      "application/vnd.sealed.net": {
        source: "iana"
      },
      "application/vnd.sealed.ppt": {
        source: "iana"
      },
      "application/vnd.sealed.tiff": {
        source: "iana"
      },
      "application/vnd.sealed.xls": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.html": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.pdf": {
        source: "iana"
      },
      "application/vnd.seemail": {
        source: "iana",
        extensions: ["see"]
      },
      "application/vnd.seis+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sema": {
        source: "iana",
        extensions: ["sema"]
      },
      "application/vnd.semd": {
        source: "iana",
        extensions: ["semd"]
      },
      "application/vnd.semf": {
        source: "iana",
        extensions: ["semf"]
      },
      "application/vnd.shade-save-file": {
        source: "iana"
      },
      "application/vnd.shana.informed.formdata": {
        source: "iana",
        extensions: ["ifm"]
      },
      "application/vnd.shana.informed.formtemplate": {
        source: "iana",
        extensions: ["itp"]
      },
      "application/vnd.shana.informed.interchange": {
        source: "iana",
        extensions: ["iif"]
      },
      "application/vnd.shana.informed.package": {
        source: "iana",
        extensions: ["ipk"]
      },
      "application/vnd.shootproof+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shopkick+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shp": {
        source: "iana"
      },
      "application/vnd.shx": {
        source: "iana"
      },
      "application/vnd.sigrok.session": {
        source: "iana"
      },
      "application/vnd.simtech-mindmapper": {
        source: "iana",
        extensions: ["twd", "twds"]
      },
      "application/vnd.siren+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.smaf": {
        source: "iana",
        extensions: ["mmf"]
      },
      "application/vnd.smart.notebook": {
        source: "iana"
      },
      "application/vnd.smart.teacher": {
        source: "iana",
        extensions: ["teacher"]
      },
      "application/vnd.snesdev-page-table": {
        source: "iana"
      },
      "application/vnd.software602.filler.form+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fo"]
      },
      "application/vnd.software602.filler.form-xml-zip": {
        source: "iana"
      },
      "application/vnd.solent.sdkm+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sdkm", "sdkd"]
      },
      "application/vnd.spotfire.dxp": {
        source: "iana",
        extensions: ["dxp"]
      },
      "application/vnd.spotfire.sfs": {
        source: "iana",
        extensions: ["sfs"]
      },
      "application/vnd.sqlite3": {
        source: "iana"
      },
      "application/vnd.sss-cod": {
        source: "iana"
      },
      "application/vnd.sss-dtf": {
        source: "iana"
      },
      "application/vnd.sss-ntf": {
        source: "iana"
      },
      "application/vnd.stardivision.calc": {
        source: "apache",
        extensions: ["sdc"]
      },
      "application/vnd.stardivision.draw": {
        source: "apache",
        extensions: ["sda"]
      },
      "application/vnd.stardivision.impress": {
        source: "apache",
        extensions: ["sdd"]
      },
      "application/vnd.stardivision.math": {
        source: "apache",
        extensions: ["smf"]
      },
      "application/vnd.stardivision.writer": {
        source: "apache",
        extensions: ["sdw", "vor"]
      },
      "application/vnd.stardivision.writer-global": {
        source: "apache",
        extensions: ["sgl"]
      },
      "application/vnd.stepmania.package": {
        source: "iana",
        extensions: ["smzip"]
      },
      "application/vnd.stepmania.stepchart": {
        source: "iana",
        extensions: ["sm"]
      },
      "application/vnd.street-stream": {
        source: "iana"
      },
      "application/vnd.sun.wadl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wadl"]
      },
      "application/vnd.sun.xml.calc": {
        source: "apache",
        extensions: ["sxc"]
      },
      "application/vnd.sun.xml.calc.template": {
        source: "apache",
        extensions: ["stc"]
      },
      "application/vnd.sun.xml.draw": {
        source: "apache",
        extensions: ["sxd"]
      },
      "application/vnd.sun.xml.draw.template": {
        source: "apache",
        extensions: ["std"]
      },
      "application/vnd.sun.xml.impress": {
        source: "apache",
        extensions: ["sxi"]
      },
      "application/vnd.sun.xml.impress.template": {
        source: "apache",
        extensions: ["sti"]
      },
      "application/vnd.sun.xml.math": {
        source: "apache",
        extensions: ["sxm"]
      },
      "application/vnd.sun.xml.writer": {
        source: "apache",
        extensions: ["sxw"]
      },
      "application/vnd.sun.xml.writer.global": {
        source: "apache",
        extensions: ["sxg"]
      },
      "application/vnd.sun.xml.writer.template": {
        source: "apache",
        extensions: ["stw"]
      },
      "application/vnd.sus-calendar": {
        source: "iana",
        extensions: ["sus", "susp"]
      },
      "application/vnd.svd": {
        source: "iana",
        extensions: ["svd"]
      },
      "application/vnd.swiftview-ics": {
        source: "iana"
      },
      "application/vnd.sycle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.syft+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.symbian.install": {
        source: "apache",
        extensions: ["sis", "sisx"]
      },
      "application/vnd.syncml+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xsm"]
      },
      "application/vnd.syncml.dm+wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["bdm"]
      },
      "application/vnd.syncml.dm+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xdm"]
      },
      "application/vnd.syncml.dm.notification": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["ddf"]
      },
      "application/vnd.syncml.dmtnds+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmtnds+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.syncml.ds.notification": {
        source: "iana"
      },
      "application/vnd.tableschema+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tao.intent-module-archive": {
        source: "iana",
        extensions: ["tao"]
      },
      "application/vnd.tcpdump.pcap": {
        source: "iana",
        extensions: ["pcap", "cap", "dmp"]
      },
      "application/vnd.think-cell.ppttc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tmd.mediaflex.api+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tml": {
        source: "iana"
      },
      "application/vnd.tmobile-livetv": {
        source: "iana",
        extensions: ["tmo"]
      },
      "application/vnd.tri.onesource": {
        source: "iana"
      },
      "application/vnd.trid.tpt": {
        source: "iana",
        extensions: ["tpt"]
      },
      "application/vnd.triscape.mxs": {
        source: "iana",
        extensions: ["mxs"]
      },
      "application/vnd.trueapp": {
        source: "iana",
        extensions: ["tra"]
      },
      "application/vnd.truedoc": {
        source: "iana"
      },
      "application/vnd.ubisoft.webplayer": {
        source: "iana"
      },
      "application/vnd.ufdl": {
        source: "iana",
        extensions: ["ufd", "ufdl"]
      },
      "application/vnd.uiq.theme": {
        source: "iana",
        extensions: ["utz"]
      },
      "application/vnd.umajin": {
        source: "iana",
        extensions: ["umj"]
      },
      "application/vnd.unity": {
        source: "iana",
        extensions: ["unityweb"]
      },
      "application/vnd.uoml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uoml"]
      },
      "application/vnd.uplanet.alert": {
        source: "iana"
      },
      "application/vnd.uplanet.alert-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.channel": {
        source: "iana"
      },
      "application/vnd.uplanet.channel-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.list": {
        source: "iana"
      },
      "application/vnd.uplanet.list-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.signal": {
        source: "iana"
      },
      "application/vnd.uri-map": {
        source: "iana"
      },
      "application/vnd.valve.source.material": {
        source: "iana"
      },
      "application/vnd.vcx": {
        source: "iana",
        extensions: ["vcx"]
      },
      "application/vnd.vd-study": {
        source: "iana"
      },
      "application/vnd.vectorworks": {
        source: "iana"
      },
      "application/vnd.vel+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.verimatrix.vcas": {
        source: "iana"
      },
      "application/vnd.veritone.aion+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veryant.thin": {
        source: "iana"
      },
      "application/vnd.ves.encrypted": {
        source: "iana"
      },
      "application/vnd.vidsoft.vidconference": {
        source: "iana"
      },
      "application/vnd.visio": {
        source: "iana",
        extensions: ["vsd", "vst", "vss", "vsw"]
      },
      "application/vnd.visionary": {
        source: "iana",
        extensions: ["vis"]
      },
      "application/vnd.vividence.scriptfile": {
        source: "iana"
      },
      "application/vnd.vsf": {
        source: "iana",
        extensions: ["vsf"]
      },
      "application/vnd.wap.sic": {
        source: "iana"
      },
      "application/vnd.wap.slc": {
        source: "iana"
      },
      "application/vnd.wap.wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["wbxml"]
      },
      "application/vnd.wap.wmlc": {
        source: "iana",
        extensions: ["wmlc"]
      },
      "application/vnd.wap.wmlscriptc": {
        source: "iana",
        extensions: ["wmlsc"]
      },
      "application/vnd.webturbo": {
        source: "iana",
        extensions: ["wtb"]
      },
      "application/vnd.wfa.dpp": {
        source: "iana"
      },
      "application/vnd.wfa.p2p": {
        source: "iana"
      },
      "application/vnd.wfa.wsc": {
        source: "iana"
      },
      "application/vnd.windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.wmc": {
        source: "iana"
      },
      "application/vnd.wmf.bootstrap": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica.package": {
        source: "iana"
      },
      "application/vnd.wolfram.player": {
        source: "iana",
        extensions: ["nbp"]
      },
      "application/vnd.wordperfect": {
        source: "iana",
        extensions: ["wpd"]
      },
      "application/vnd.wqd": {
        source: "iana",
        extensions: ["wqd"]
      },
      "application/vnd.wrq-hp3000-labelled": {
        source: "iana"
      },
      "application/vnd.wt.stf": {
        source: "iana",
        extensions: ["stf"]
      },
      "application/vnd.wv.csp+wbxml": {
        source: "iana"
      },
      "application/vnd.wv.csp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.wv.ssp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xacml+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xara": {
        source: "iana",
        extensions: ["xar"]
      },
      "application/vnd.xfdl": {
        source: "iana",
        extensions: ["xfdl"]
      },
      "application/vnd.xfdl.webform": {
        source: "iana"
      },
      "application/vnd.xmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xmpie.cpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.dpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.plan": {
        source: "iana"
      },
      "application/vnd.xmpie.ppkg": {
        source: "iana"
      },
      "application/vnd.xmpie.xlim": {
        source: "iana"
      },
      "application/vnd.yamaha.hv-dic": {
        source: "iana",
        extensions: ["hvd"]
      },
      "application/vnd.yamaha.hv-script": {
        source: "iana",
        extensions: ["hvs"]
      },
      "application/vnd.yamaha.hv-voice": {
        source: "iana",
        extensions: ["hvp"]
      },
      "application/vnd.yamaha.openscoreformat": {
        source: "iana",
        extensions: ["osf"]
      },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osfpvg"]
      },
      "application/vnd.yamaha.remote-setup": {
        source: "iana"
      },
      "application/vnd.yamaha.smaf-audio": {
        source: "iana",
        extensions: ["saf"]
      },
      "application/vnd.yamaha.smaf-phrase": {
        source: "iana",
        extensions: ["spf"]
      },
      "application/vnd.yamaha.through-ngn": {
        source: "iana"
      },
      "application/vnd.yamaha.tunnel-udpencap": {
        source: "iana"
      },
      "application/vnd.yaoweme": {
        source: "iana"
      },
      "application/vnd.yellowriver-custom-menu": {
        source: "iana",
        extensions: ["cmp"]
      },
      "application/vnd.youtube.yt": {
        source: "iana"
      },
      "application/vnd.zul": {
        source: "iana",
        extensions: ["zir", "zirz"]
      },
      "application/vnd.zzazz.deck+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zaz"]
      },
      "application/voicexml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["vxml"]
      },
      "application/voucher-cms+json": {
        source: "iana",
        compressible: true
      },
      "application/vq-rtcpxr": {
        source: "iana"
      },
      "application/wasm": {
        source: "iana",
        compressible: true,
        extensions: ["wasm"]
      },
      "application/watcherinfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wif"]
      },
      "application/webpush-options+json": {
        source: "iana",
        compressible: true
      },
      "application/whoispp-query": {
        source: "iana"
      },
      "application/whoispp-response": {
        source: "iana"
      },
      "application/widget": {
        source: "iana",
        extensions: ["wgt"]
      },
      "application/winhlp": {
        source: "apache",
        extensions: ["hlp"]
      },
      "application/wita": {
        source: "iana"
      },
      "application/wordperfect5.1": {
        source: "iana"
      },
      "application/wsdl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wsdl"]
      },
      "application/wspolicy+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wspolicy"]
      },
      "application/x-7z-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["7z"]
      },
      "application/x-abiword": {
        source: "apache",
        extensions: ["abw"]
      },
      "application/x-ace-compressed": {
        source: "apache",
        extensions: ["ace"]
      },
      "application/x-amf": {
        source: "apache"
      },
      "application/x-apple-diskimage": {
        source: "apache",
        extensions: ["dmg"]
      },
      "application/x-arj": {
        compressible: false,
        extensions: ["arj"]
      },
      "application/x-authorware-bin": {
        source: "apache",
        extensions: ["aab", "x32", "u32", "vox"]
      },
      "application/x-authorware-map": {
        source: "apache",
        extensions: ["aam"]
      },
      "application/x-authorware-seg": {
        source: "apache",
        extensions: ["aas"]
      },
      "application/x-bcpio": {
        source: "apache",
        extensions: ["bcpio"]
      },
      "application/x-bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/x-bittorrent": {
        source: "apache",
        extensions: ["torrent"]
      },
      "application/x-blorb": {
        source: "apache",
        extensions: ["blb", "blorb"]
      },
      "application/x-bzip": {
        source: "apache",
        compressible: false,
        extensions: ["bz"]
      },
      "application/x-bzip2": {
        source: "apache",
        compressible: false,
        extensions: ["bz2", "boz"]
      },
      "application/x-cbr": {
        source: "apache",
        extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
      },
      "application/x-cdlink": {
        source: "apache",
        extensions: ["vcd"]
      },
      "application/x-cfs-compressed": {
        source: "apache",
        extensions: ["cfs"]
      },
      "application/x-chat": {
        source: "apache",
        extensions: ["chat"]
      },
      "application/x-chess-pgn": {
        source: "apache",
        extensions: ["pgn"]
      },
      "application/x-chrome-extension": {
        extensions: ["crx"]
      },
      "application/x-cocoa": {
        source: "nginx",
        extensions: ["cco"]
      },
      "application/x-compress": {
        source: "apache"
      },
      "application/x-conference": {
        source: "apache",
        extensions: ["nsc"]
      },
      "application/x-cpio": {
        source: "apache",
        extensions: ["cpio"]
      },
      "application/x-csh": {
        source: "apache",
        extensions: ["csh"]
      },
      "application/x-deb": {
        compressible: false
      },
      "application/x-debian-package": {
        source: "apache",
        extensions: ["deb", "udeb"]
      },
      "application/x-dgc-compressed": {
        source: "apache",
        extensions: ["dgc"]
      },
      "application/x-director": {
        source: "apache",
        extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
      },
      "application/x-doom": {
        source: "apache",
        extensions: ["wad"]
      },
      "application/x-dtbncx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ncx"]
      },
      "application/x-dtbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dtb"]
      },
      "application/x-dtbresource+xml": {
        source: "apache",
        compressible: true,
        extensions: ["res"]
      },
      "application/x-dvi": {
        source: "apache",
        compressible: false,
        extensions: ["dvi"]
      },
      "application/x-envoy": {
        source: "apache",
        extensions: ["evy"]
      },
      "application/x-eva": {
        source: "apache",
        extensions: ["eva"]
      },
      "application/x-font-bdf": {
        source: "apache",
        extensions: ["bdf"]
      },
      "application/x-font-dos": {
        source: "apache"
      },
      "application/x-font-framemaker": {
        source: "apache"
      },
      "application/x-font-ghostscript": {
        source: "apache",
        extensions: ["gsf"]
      },
      "application/x-font-libgrx": {
        source: "apache"
      },
      "application/x-font-linux-psf": {
        source: "apache",
        extensions: ["psf"]
      },
      "application/x-font-pcf": {
        source: "apache",
        extensions: ["pcf"]
      },
      "application/x-font-snf": {
        source: "apache",
        extensions: ["snf"]
      },
      "application/x-font-speedo": {
        source: "apache"
      },
      "application/x-font-sunos-news": {
        source: "apache"
      },
      "application/x-font-type1": {
        source: "apache",
        extensions: ["pfa", "pfb", "pfm", "afm"]
      },
      "application/x-font-vfont": {
        source: "apache"
      },
      "application/x-freearc": {
        source: "apache",
        extensions: ["arc"]
      },
      "application/x-futuresplash": {
        source: "apache",
        extensions: ["spl"]
      },
      "application/x-gca-compressed": {
        source: "apache",
        extensions: ["gca"]
      },
      "application/x-glulx": {
        source: "apache",
        extensions: ["ulx"]
      },
      "application/x-gnumeric": {
        source: "apache",
        extensions: ["gnumeric"]
      },
      "application/x-gramps-xml": {
        source: "apache",
        extensions: ["gramps"]
      },
      "application/x-gtar": {
        source: "apache",
        extensions: ["gtar"]
      },
      "application/x-gzip": {
        source: "apache"
      },
      "application/x-hdf": {
        source: "apache",
        extensions: ["hdf"]
      },
      "application/x-httpd-php": {
        compressible: true,
        extensions: ["php"]
      },
      "application/x-install-instructions": {
        source: "apache",
        extensions: ["install"]
      },
      "application/x-iso9660-image": {
        source: "apache",
        extensions: ["iso"]
      },
      "application/x-iwork-keynote-sffkey": {
        extensions: ["key"]
      },
      "application/x-iwork-numbers-sffnumbers": {
        extensions: ["numbers"]
      },
      "application/x-iwork-pages-sffpages": {
        extensions: ["pages"]
      },
      "application/x-java-archive-diff": {
        source: "nginx",
        extensions: ["jardiff"]
      },
      "application/x-java-jnlp-file": {
        source: "apache",
        compressible: false,
        extensions: ["jnlp"]
      },
      "application/x-javascript": {
        compressible: true
      },
      "application/x-keepass2": {
        extensions: ["kdbx"]
      },
      "application/x-latex": {
        source: "apache",
        compressible: false,
        extensions: ["latex"]
      },
      "application/x-lua-bytecode": {
        extensions: ["luac"]
      },
      "application/x-lzh-compressed": {
        source: "apache",
        extensions: ["lzh", "lha"]
      },
      "application/x-makeself": {
        source: "nginx",
        extensions: ["run"]
      },
      "application/x-mie": {
        source: "apache",
        extensions: ["mie"]
      },
      "application/x-mobipocket-ebook": {
        source: "apache",
        extensions: ["prc", "mobi"]
      },
      "application/x-mpegurl": {
        compressible: false
      },
      "application/x-ms-application": {
        source: "apache",
        extensions: ["application"]
      },
      "application/x-ms-shortcut": {
        source: "apache",
        extensions: ["lnk"]
      },
      "application/x-ms-wmd": {
        source: "apache",
        extensions: ["wmd"]
      },
      "application/x-ms-wmz": {
        source: "apache",
        extensions: ["wmz"]
      },
      "application/x-ms-xbap": {
        source: "apache",
        extensions: ["xbap"]
      },
      "application/x-msaccess": {
        source: "apache",
        extensions: ["mdb"]
      },
      "application/x-msbinder": {
        source: "apache",
        extensions: ["obd"]
      },
      "application/x-mscardfile": {
        source: "apache",
        extensions: ["crd"]
      },
      "application/x-msclip": {
        source: "apache",
        extensions: ["clp"]
      },
      "application/x-msdos-program": {
        extensions: ["exe"]
      },
      "application/x-msdownload": {
        source: "apache",
        extensions: ["exe", "dll", "com", "bat", "msi"]
      },
      "application/x-msmediaview": {
        source: "apache",
        extensions: ["mvb", "m13", "m14"]
      },
      "application/x-msmetafile": {
        source: "apache",
        extensions: ["wmf", "wmz", "emf", "emz"]
      },
      "application/x-msmoney": {
        source: "apache",
        extensions: ["mny"]
      },
      "application/x-mspublisher": {
        source: "apache",
        extensions: ["pub"]
      },
      "application/x-msschedule": {
        source: "apache",
        extensions: ["scd"]
      },
      "application/x-msterminal": {
        source: "apache",
        extensions: ["trm"]
      },
      "application/x-mswrite": {
        source: "apache",
        extensions: ["wri"]
      },
      "application/x-netcdf": {
        source: "apache",
        extensions: ["nc", "cdf"]
      },
      "application/x-ns-proxy-autoconfig": {
        compressible: true,
        extensions: ["pac"]
      },
      "application/x-nzb": {
        source: "apache",
        extensions: ["nzb"]
      },
      "application/x-perl": {
        source: "nginx",
        extensions: ["pl", "pm"]
      },
      "application/x-pilot": {
        source: "nginx",
        extensions: ["prc", "pdb"]
      },
      "application/x-pkcs12": {
        source: "apache",
        compressible: false,
        extensions: ["p12", "pfx"]
      },
      "application/x-pkcs7-certificates": {
        source: "apache",
        extensions: ["p7b", "spc"]
      },
      "application/x-pkcs7-certreqresp": {
        source: "apache",
        extensions: ["p7r"]
      },
      "application/x-pki-message": {
        source: "iana"
      },
      "application/x-rar-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["rar"]
      },
      "application/x-redhat-package-manager": {
        source: "nginx",
        extensions: ["rpm"]
      },
      "application/x-research-info-systems": {
        source: "apache",
        extensions: ["ris"]
      },
      "application/x-sea": {
        source: "nginx",
        extensions: ["sea"]
      },
      "application/x-sh": {
        source: "apache",
        compressible: true,
        extensions: ["sh"]
      },
      "application/x-shar": {
        source: "apache",
        extensions: ["shar"]
      },
      "application/x-shockwave-flash": {
        source: "apache",
        compressible: false,
        extensions: ["swf"]
      },
      "application/x-silverlight-app": {
        source: "apache",
        extensions: ["xap"]
      },
      "application/x-sql": {
        source: "apache",
        extensions: ["sql"]
      },
      "application/x-stuffit": {
        source: "apache",
        compressible: false,
        extensions: ["sit"]
      },
      "application/x-stuffitx": {
        source: "apache",
        extensions: ["sitx"]
      },
      "application/x-subrip": {
        source: "apache",
        extensions: ["srt"]
      },
      "application/x-sv4cpio": {
        source: "apache",
        extensions: ["sv4cpio"]
      },
      "application/x-sv4crc": {
        source: "apache",
        extensions: ["sv4crc"]
      },
      "application/x-t3vm-image": {
        source: "apache",
        extensions: ["t3"]
      },
      "application/x-tads": {
        source: "apache",
        extensions: ["gam"]
      },
      "application/x-tar": {
        source: "apache",
        compressible: true,
        extensions: ["tar"]
      },
      "application/x-tcl": {
        source: "apache",
        extensions: ["tcl", "tk"]
      },
      "application/x-tex": {
        source: "apache",
        extensions: ["tex"]
      },
      "application/x-tex-tfm": {
        source: "apache",
        extensions: ["tfm"]
      },
      "application/x-texinfo": {
        source: "apache",
        extensions: ["texinfo", "texi"]
      },
      "application/x-tgif": {
        source: "apache",
        extensions: ["obj"]
      },
      "application/x-ustar": {
        source: "apache",
        extensions: ["ustar"]
      },
      "application/x-virtualbox-hdd": {
        compressible: true,
        extensions: ["hdd"]
      },
      "application/x-virtualbox-ova": {
        compressible: true,
        extensions: ["ova"]
      },
      "application/x-virtualbox-ovf": {
        compressible: true,
        extensions: ["ovf"]
      },
      "application/x-virtualbox-vbox": {
        compressible: true,
        extensions: ["vbox"]
      },
      "application/x-virtualbox-vbox-extpack": {
        compressible: false,
        extensions: ["vbox-extpack"]
      },
      "application/x-virtualbox-vdi": {
        compressible: true,
        extensions: ["vdi"]
      },
      "application/x-virtualbox-vhd": {
        compressible: true,
        extensions: ["vhd"]
      },
      "application/x-virtualbox-vmdk": {
        compressible: true,
        extensions: ["vmdk"]
      },
      "application/x-wais-source": {
        source: "apache",
        extensions: ["src"]
      },
      "application/x-web-app-manifest+json": {
        compressible: true,
        extensions: ["webapp"]
      },
      "application/x-www-form-urlencoded": {
        source: "iana",
        compressible: true
      },
      "application/x-x509-ca-cert": {
        source: "iana",
        extensions: ["der", "crt", "pem"]
      },
      "application/x-x509-ca-ra-cert": {
        source: "iana"
      },
      "application/x-x509-next-ca-cert": {
        source: "iana"
      },
      "application/x-xfig": {
        source: "apache",
        extensions: ["fig"]
      },
      "application/x-xliff+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/x-xpinstall": {
        source: "apache",
        compressible: false,
        extensions: ["xpi"]
      },
      "application/x-xz": {
        source: "apache",
        extensions: ["xz"]
      },
      "application/x-zmachine": {
        source: "apache",
        extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
      },
      "application/x400-bp": {
        source: "iana"
      },
      "application/xacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/xaml+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xaml"]
      },
      "application/xcap-att+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xav"]
      },
      "application/xcap-caps+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xca"]
      },
      "application/xcap-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdf"]
      },
      "application/xcap-el+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xel"]
      },
      "application/xcap-error+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcap-ns+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xns"]
      },
      "application/xcon-conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcon-conference-info-diff+xml": {
        source: "iana",
        compressible: true
      },
      "application/xenc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xenc"]
      },
      "application/xhtml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtml", "xht"]
      },
      "application/xhtml-voice+xml": {
        source: "apache",
        compressible: true
      },
      "application/xliff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml", "xsl", "xsd", "rng"]
      },
      "application/xml-dtd": {
        source: "iana",
        compressible: true,
        extensions: ["dtd"]
      },
      "application/xml-external-parsed-entity": {
        source: "iana"
      },
      "application/xml-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/xmpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/xop+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xop"]
      },
      "application/xproc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xpl"]
      },
      "application/xslt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsl", "xslt"]
      },
      "application/xspf+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xspf"]
      },
      "application/xv+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mxml", "xhvml", "xvml", "xvm"]
      },
      "application/yang": {
        source: "iana",
        extensions: ["yang"]
      },
      "application/yang-data+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-data+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/yin+xml": {
        source: "iana",
        compressible: true,
        extensions: ["yin"]
      },
      "application/zip": {
        source: "iana",
        compressible: false,
        extensions: ["zip"]
      },
      "application/zlib": {
        source: "iana"
      },
      "application/zstd": {
        source: "iana"
      },
      "audio/1d-interleaved-parityfec": {
        source: "iana"
      },
      "audio/32kadpcm": {
        source: "iana"
      },
      "audio/3gpp": {
        source: "iana",
        compressible: false,
        extensions: ["3gpp"]
      },
      "audio/3gpp2": {
        source: "iana"
      },
      "audio/aac": {
        source: "iana"
      },
      "audio/ac3": {
        source: "iana"
      },
      "audio/adpcm": {
        source: "apache",
        extensions: ["adp"]
      },
      "audio/amr": {
        source: "iana",
        extensions: ["amr"]
      },
      "audio/amr-wb": {
        source: "iana"
      },
      "audio/amr-wb+": {
        source: "iana"
      },
      "audio/aptx": {
        source: "iana"
      },
      "audio/asc": {
        source: "iana"
      },
      "audio/atrac-advanced-lossless": {
        source: "iana"
      },
      "audio/atrac-x": {
        source: "iana"
      },
      "audio/atrac3": {
        source: "iana"
      },
      "audio/basic": {
        source: "iana",
        compressible: false,
        extensions: ["au", "snd"]
      },
      "audio/bv16": {
        source: "iana"
      },
      "audio/bv32": {
        source: "iana"
      },
      "audio/clearmode": {
        source: "iana"
      },
      "audio/cn": {
        source: "iana"
      },
      "audio/dat12": {
        source: "iana"
      },
      "audio/dls": {
        source: "iana"
      },
      "audio/dsr-es201108": {
        source: "iana"
      },
      "audio/dsr-es202050": {
        source: "iana"
      },
      "audio/dsr-es202211": {
        source: "iana"
      },
      "audio/dsr-es202212": {
        source: "iana"
      },
      "audio/dv": {
        source: "iana"
      },
      "audio/dvi4": {
        source: "iana"
      },
      "audio/eac3": {
        source: "iana"
      },
      "audio/encaprtp": {
        source: "iana"
      },
      "audio/evrc": {
        source: "iana"
      },
      "audio/evrc-qcp": {
        source: "iana"
      },
      "audio/evrc0": {
        source: "iana"
      },
      "audio/evrc1": {
        source: "iana"
      },
      "audio/evrcb": {
        source: "iana"
      },
      "audio/evrcb0": {
        source: "iana"
      },
      "audio/evrcb1": {
        source: "iana"
      },
      "audio/evrcnw": {
        source: "iana"
      },
      "audio/evrcnw0": {
        source: "iana"
      },
      "audio/evrcnw1": {
        source: "iana"
      },
      "audio/evrcwb": {
        source: "iana"
      },
      "audio/evrcwb0": {
        source: "iana"
      },
      "audio/evrcwb1": {
        source: "iana"
      },
      "audio/evs": {
        source: "iana"
      },
      "audio/flexfec": {
        source: "iana"
      },
      "audio/fwdred": {
        source: "iana"
      },
      "audio/g711-0": {
        source: "iana"
      },
      "audio/g719": {
        source: "iana"
      },
      "audio/g722": {
        source: "iana"
      },
      "audio/g7221": {
        source: "iana"
      },
      "audio/g723": {
        source: "iana"
      },
      "audio/g726-16": {
        source: "iana"
      },
      "audio/g726-24": {
        source: "iana"
      },
      "audio/g726-32": {
        source: "iana"
      },
      "audio/g726-40": {
        source: "iana"
      },
      "audio/g728": {
        source: "iana"
      },
      "audio/g729": {
        source: "iana"
      },
      "audio/g7291": {
        source: "iana"
      },
      "audio/g729d": {
        source: "iana"
      },
      "audio/g729e": {
        source: "iana"
      },
      "audio/gsm": {
        source: "iana"
      },
      "audio/gsm-efr": {
        source: "iana"
      },
      "audio/gsm-hr-08": {
        source: "iana"
      },
      "audio/ilbc": {
        source: "iana"
      },
      "audio/ip-mr_v2.5": {
        source: "iana"
      },
      "audio/isac": {
        source: "apache"
      },
      "audio/l16": {
        source: "iana"
      },
      "audio/l20": {
        source: "iana"
      },
      "audio/l24": {
        source: "iana",
        compressible: false
      },
      "audio/l8": {
        source: "iana"
      },
      "audio/lpc": {
        source: "iana"
      },
      "audio/melp": {
        source: "iana"
      },
      "audio/melp1200": {
        source: "iana"
      },
      "audio/melp2400": {
        source: "iana"
      },
      "audio/melp600": {
        source: "iana"
      },
      "audio/mhas": {
        source: "iana"
      },
      "audio/midi": {
        source: "apache",
        extensions: ["mid", "midi", "kar", "rmi"]
      },
      "audio/mobile-xmf": {
        source: "iana",
        extensions: ["mxmf"]
      },
      "audio/mp3": {
        compressible: false,
        extensions: ["mp3"]
      },
      "audio/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["m4a", "mp4a"]
      },
      "audio/mp4a-latm": {
        source: "iana"
      },
      "audio/mpa": {
        source: "iana"
      },
      "audio/mpa-robust": {
        source: "iana"
      },
      "audio/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
      },
      "audio/mpeg4-generic": {
        source: "iana"
      },
      "audio/musepack": {
        source: "apache"
      },
      "audio/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["oga", "ogg", "spx", "opus"]
      },
      "audio/opus": {
        source: "iana"
      },
      "audio/parityfec": {
        source: "iana"
      },
      "audio/pcma": {
        source: "iana"
      },
      "audio/pcma-wb": {
        source: "iana"
      },
      "audio/pcmu": {
        source: "iana"
      },
      "audio/pcmu-wb": {
        source: "iana"
      },
      "audio/prs.sid": {
        source: "iana"
      },
      "audio/qcelp": {
        source: "iana"
      },
      "audio/raptorfec": {
        source: "iana"
      },
      "audio/red": {
        source: "iana"
      },
      "audio/rtp-enc-aescm128": {
        source: "iana"
      },
      "audio/rtp-midi": {
        source: "iana"
      },
      "audio/rtploopback": {
        source: "iana"
      },
      "audio/rtx": {
        source: "iana"
      },
      "audio/s3m": {
        source: "apache",
        extensions: ["s3m"]
      },
      "audio/scip": {
        source: "iana"
      },
      "audio/silk": {
        source: "apache",
        extensions: ["sil"]
      },
      "audio/smv": {
        source: "iana"
      },
      "audio/smv-qcp": {
        source: "iana"
      },
      "audio/smv0": {
        source: "iana"
      },
      "audio/sofa": {
        source: "iana"
      },
      "audio/sp-midi": {
        source: "iana"
      },
      "audio/speex": {
        source: "iana"
      },
      "audio/t140c": {
        source: "iana"
      },
      "audio/t38": {
        source: "iana"
      },
      "audio/telephone-event": {
        source: "iana"
      },
      "audio/tetra_acelp": {
        source: "iana"
      },
      "audio/tetra_acelp_bb": {
        source: "iana"
      },
      "audio/tone": {
        source: "iana"
      },
      "audio/tsvcis": {
        source: "iana"
      },
      "audio/uemclip": {
        source: "iana"
      },
      "audio/ulpfec": {
        source: "iana"
      },
      "audio/usac": {
        source: "iana"
      },
      "audio/vdvi": {
        source: "iana"
      },
      "audio/vmr-wb": {
        source: "iana"
      },
      "audio/vnd.3gpp.iufp": {
        source: "iana"
      },
      "audio/vnd.4sb": {
        source: "iana"
      },
      "audio/vnd.audiokoz": {
        source: "iana"
      },
      "audio/vnd.celp": {
        source: "iana"
      },
      "audio/vnd.cisco.nse": {
        source: "iana"
      },
      "audio/vnd.cmles.radio-events": {
        source: "iana"
      },
      "audio/vnd.cns.anp1": {
        source: "iana"
      },
      "audio/vnd.cns.inf1": {
        source: "iana"
      },
      "audio/vnd.dece.audio": {
        source: "iana",
        extensions: ["uva", "uvva"]
      },
      "audio/vnd.digital-winds": {
        source: "iana",
        extensions: ["eol"]
      },
      "audio/vnd.dlna.adts": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.1": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.2": {
        source: "iana"
      },
      "audio/vnd.dolby.mlp": {
        source: "iana"
      },
      "audio/vnd.dolby.mps": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2x": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2z": {
        source: "iana"
      },
      "audio/vnd.dolby.pulse.1": {
        source: "iana"
      },
      "audio/vnd.dra": {
        source: "iana",
        extensions: ["dra"]
      },
      "audio/vnd.dts": {
        source: "iana",
        extensions: ["dts"]
      },
      "audio/vnd.dts.hd": {
        source: "iana",
        extensions: ["dtshd"]
      },
      "audio/vnd.dts.uhd": {
        source: "iana"
      },
      "audio/vnd.dvb.file": {
        source: "iana"
      },
      "audio/vnd.everad.plj": {
        source: "iana"
      },
      "audio/vnd.hns.audio": {
        source: "iana"
      },
      "audio/vnd.lucent.voice": {
        source: "iana",
        extensions: ["lvp"]
      },
      "audio/vnd.ms-playready.media.pya": {
        source: "iana",
        extensions: ["pya"]
      },
      "audio/vnd.nokia.mobile-xmf": {
        source: "iana"
      },
      "audio/vnd.nortel.vbk": {
        source: "iana"
      },
      "audio/vnd.nuera.ecelp4800": {
        source: "iana",
        extensions: ["ecelp4800"]
      },
      "audio/vnd.nuera.ecelp7470": {
        source: "iana",
        extensions: ["ecelp7470"]
      },
      "audio/vnd.nuera.ecelp9600": {
        source: "iana",
        extensions: ["ecelp9600"]
      },
      "audio/vnd.octel.sbc": {
        source: "iana"
      },
      "audio/vnd.presonus.multitrack": {
        source: "iana"
      },
      "audio/vnd.qcelp": {
        source: "iana"
      },
      "audio/vnd.rhetorex.32kadpcm": {
        source: "iana"
      },
      "audio/vnd.rip": {
        source: "iana",
        extensions: ["rip"]
      },
      "audio/vnd.rn-realaudio": {
        compressible: false
      },
      "audio/vnd.sealedmedia.softseal.mpeg": {
        source: "iana"
      },
      "audio/vnd.vmx.cvsd": {
        source: "iana"
      },
      "audio/vnd.wave": {
        compressible: false
      },
      "audio/vorbis": {
        source: "iana",
        compressible: false
      },
      "audio/vorbis-config": {
        source: "iana"
      },
      "audio/wav": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/wave": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/webm": {
        source: "apache",
        compressible: false,
        extensions: ["weba"]
      },
      "audio/x-aac": {
        source: "apache",
        compressible: false,
        extensions: ["aac"]
      },
      "audio/x-aiff": {
        source: "apache",
        extensions: ["aif", "aiff", "aifc"]
      },
      "audio/x-caf": {
        source: "apache",
        compressible: false,
        extensions: ["caf"]
      },
      "audio/x-flac": {
        source: "apache",
        extensions: ["flac"]
      },
      "audio/x-m4a": {
        source: "nginx",
        extensions: ["m4a"]
      },
      "audio/x-matroska": {
        source: "apache",
        extensions: ["mka"]
      },
      "audio/x-mpegurl": {
        source: "apache",
        extensions: ["m3u"]
      },
      "audio/x-ms-wax": {
        source: "apache",
        extensions: ["wax"]
      },
      "audio/x-ms-wma": {
        source: "apache",
        extensions: ["wma"]
      },
      "audio/x-pn-realaudio": {
        source: "apache",
        extensions: ["ram", "ra"]
      },
      "audio/x-pn-realaudio-plugin": {
        source: "apache",
        extensions: ["rmp"]
      },
      "audio/x-realaudio": {
        source: "nginx",
        extensions: ["ra"]
      },
      "audio/x-tta": {
        source: "apache"
      },
      "audio/x-wav": {
        source: "apache",
        extensions: ["wav"]
      },
      "audio/xm": {
        source: "apache",
        extensions: ["xm"]
      },
      "chemical/x-cdx": {
        source: "apache",
        extensions: ["cdx"]
      },
      "chemical/x-cif": {
        source: "apache",
        extensions: ["cif"]
      },
      "chemical/x-cmdf": {
        source: "apache",
        extensions: ["cmdf"]
      },
      "chemical/x-cml": {
        source: "apache",
        extensions: ["cml"]
      },
      "chemical/x-csml": {
        source: "apache",
        extensions: ["csml"]
      },
      "chemical/x-pdb": {
        source: "apache"
      },
      "chemical/x-xyz": {
        source: "apache",
        extensions: ["xyz"]
      },
      "font/collection": {
        source: "iana",
        extensions: ["ttc"]
      },
      "font/otf": {
        source: "iana",
        compressible: true,
        extensions: ["otf"]
      },
      "font/sfnt": {
        source: "iana"
      },
      "font/ttf": {
        source: "iana",
        compressible: true,
        extensions: ["ttf"]
      },
      "font/woff": {
        source: "iana",
        extensions: ["woff"]
      },
      "font/woff2": {
        source: "iana",
        extensions: ["woff2"]
      },
      "image/aces": {
        source: "iana",
        extensions: ["exr"]
      },
      "image/apng": {
        compressible: false,
        extensions: ["apng"]
      },
      "image/avci": {
        source: "iana",
        extensions: ["avci"]
      },
      "image/avcs": {
        source: "iana",
        extensions: ["avcs"]
      },
      "image/avif": {
        source: "iana",
        compressible: false,
        extensions: ["avif"]
      },
      "image/bmp": {
        source: "iana",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/cgm": {
        source: "iana",
        extensions: ["cgm"]
      },
      "image/dicom-rle": {
        source: "iana",
        extensions: ["drle"]
      },
      "image/emf": {
        source: "iana",
        extensions: ["emf"]
      },
      "image/fits": {
        source: "iana",
        extensions: ["fits"]
      },
      "image/g3fax": {
        source: "iana",
        extensions: ["g3"]
      },
      "image/gif": {
        source: "iana",
        compressible: false,
        extensions: ["gif"]
      },
      "image/heic": {
        source: "iana",
        extensions: ["heic"]
      },
      "image/heic-sequence": {
        source: "iana",
        extensions: ["heics"]
      },
      "image/heif": {
        source: "iana",
        extensions: ["heif"]
      },
      "image/heif-sequence": {
        source: "iana",
        extensions: ["heifs"]
      },
      "image/hej2k": {
        source: "iana",
        extensions: ["hej2"]
      },
      "image/hsj2": {
        source: "iana",
        extensions: ["hsj2"]
      },
      "image/ief": {
        source: "iana",
        extensions: ["ief"]
      },
      "image/jls": {
        source: "iana",
        extensions: ["jls"]
      },
      "image/jp2": {
        source: "iana",
        compressible: false,
        extensions: ["jp2", "jpg2"]
      },
      "image/jpeg": {
        source: "iana",
        compressible: false,
        extensions: ["jpeg", "jpg", "jpe"]
      },
      "image/jph": {
        source: "iana",
        extensions: ["jph"]
      },
      "image/jphc": {
        source: "iana",
        extensions: ["jhc"]
      },
      "image/jpm": {
        source: "iana",
        compressible: false,
        extensions: ["jpm"]
      },
      "image/jpx": {
        source: "iana",
        compressible: false,
        extensions: ["jpx", "jpf"]
      },
      "image/jxr": {
        source: "iana",
        extensions: ["jxr"]
      },
      "image/jxra": {
        source: "iana",
        extensions: ["jxra"]
      },
      "image/jxrs": {
        source: "iana",
        extensions: ["jxrs"]
      },
      "image/jxs": {
        source: "iana",
        extensions: ["jxs"]
      },
      "image/jxsc": {
        source: "iana",
        extensions: ["jxsc"]
      },
      "image/jxsi": {
        source: "iana",
        extensions: ["jxsi"]
      },
      "image/jxss": {
        source: "iana",
        extensions: ["jxss"]
      },
      "image/ktx": {
        source: "iana",
        extensions: ["ktx"]
      },
      "image/ktx2": {
        source: "iana",
        extensions: ["ktx2"]
      },
      "image/naplps": {
        source: "iana"
      },
      "image/pjpeg": {
        compressible: false
      },
      "image/png": {
        source: "iana",
        compressible: false,
        extensions: ["png"]
      },
      "image/prs.btif": {
        source: "iana",
        extensions: ["btif"]
      },
      "image/prs.pti": {
        source: "iana",
        extensions: ["pti"]
      },
      "image/pwg-raster": {
        source: "iana"
      },
      "image/sgi": {
        source: "apache",
        extensions: ["sgi"]
      },
      "image/svg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["svg", "svgz"]
      },
      "image/t38": {
        source: "iana",
        extensions: ["t38"]
      },
      "image/tiff": {
        source: "iana",
        compressible: false,
        extensions: ["tif", "tiff"]
      },
      "image/tiff-fx": {
        source: "iana",
        extensions: ["tfx"]
      },
      "image/vnd.adobe.photoshop": {
        source: "iana",
        compressible: true,
        extensions: ["psd"]
      },
      "image/vnd.airzip.accelerator.azv": {
        source: "iana",
        extensions: ["azv"]
      },
      "image/vnd.cns.inf2": {
        source: "iana"
      },
      "image/vnd.dece.graphic": {
        source: "iana",
        extensions: ["uvi", "uvvi", "uvg", "uvvg"]
      },
      "image/vnd.djvu": {
        source: "iana",
        extensions: ["djvu", "djv"]
      },
      "image/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "image/vnd.dwg": {
        source: "iana",
        extensions: ["dwg"]
      },
      "image/vnd.dxf": {
        source: "iana",
        extensions: ["dxf"]
      },
      "image/vnd.fastbidsheet": {
        source: "iana",
        extensions: ["fbs"]
      },
      "image/vnd.fpx": {
        source: "iana",
        extensions: ["fpx"]
      },
      "image/vnd.fst": {
        source: "iana",
        extensions: ["fst"]
      },
      "image/vnd.fujixerox.edmics-mmr": {
        source: "iana",
        extensions: ["mmr"]
      },
      "image/vnd.fujixerox.edmics-rlc": {
        source: "iana",
        extensions: ["rlc"]
      },
      "image/vnd.globalgraphics.pgb": {
        source: "iana"
      },
      "image/vnd.microsoft.icon": {
        source: "iana",
        compressible: true,
        extensions: ["ico"]
      },
      "image/vnd.mix": {
        source: "iana"
      },
      "image/vnd.mozilla.apng": {
        source: "iana"
      },
      "image/vnd.ms-dds": {
        compressible: true,
        extensions: ["dds"]
      },
      "image/vnd.ms-modi": {
        source: "iana",
        extensions: ["mdi"]
      },
      "image/vnd.ms-photo": {
        source: "apache",
        extensions: ["wdp"]
      },
      "image/vnd.net-fpx": {
        source: "iana",
        extensions: ["npx"]
      },
      "image/vnd.pco.b16": {
        source: "iana",
        extensions: ["b16"]
      },
      "image/vnd.radiance": {
        source: "iana"
      },
      "image/vnd.sealed.png": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.gif": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.jpg": {
        source: "iana"
      },
      "image/vnd.svf": {
        source: "iana"
      },
      "image/vnd.tencent.tap": {
        source: "iana",
        extensions: ["tap"]
      },
      "image/vnd.valve.source.texture": {
        source: "iana",
        extensions: ["vtf"]
      },
      "image/vnd.wap.wbmp": {
        source: "iana",
        extensions: ["wbmp"]
      },
      "image/vnd.xiff": {
        source: "iana",
        extensions: ["xif"]
      },
      "image/vnd.zbrush.pcx": {
        source: "iana",
        extensions: ["pcx"]
      },
      "image/webp": {
        source: "apache",
        extensions: ["webp"]
      },
      "image/wmf": {
        source: "iana",
        extensions: ["wmf"]
      },
      "image/x-3ds": {
        source: "apache",
        extensions: ["3ds"]
      },
      "image/x-cmu-raster": {
        source: "apache",
        extensions: ["ras"]
      },
      "image/x-cmx": {
        source: "apache",
        extensions: ["cmx"]
      },
      "image/x-freehand": {
        source: "apache",
        extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
      },
      "image/x-icon": {
        source: "apache",
        compressible: true,
        extensions: ["ico"]
      },
      "image/x-jng": {
        source: "nginx",
        extensions: ["jng"]
      },
      "image/x-mrsid-image": {
        source: "apache",
        extensions: ["sid"]
      },
      "image/x-ms-bmp": {
        source: "nginx",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/x-pcx": {
        source: "apache",
        extensions: ["pcx"]
      },
      "image/x-pict": {
        source: "apache",
        extensions: ["pic", "pct"]
      },
      "image/x-portable-anymap": {
        source: "apache",
        extensions: ["pnm"]
      },
      "image/x-portable-bitmap": {
        source: "apache",
        extensions: ["pbm"]
      },
      "image/x-portable-graymap": {
        source: "apache",
        extensions: ["pgm"]
      },
      "image/x-portable-pixmap": {
        source: "apache",
        extensions: ["ppm"]
      },
      "image/x-rgb": {
        source: "apache",
        extensions: ["rgb"]
      },
      "image/x-tga": {
        source: "apache",
        extensions: ["tga"]
      },
      "image/x-xbitmap": {
        source: "apache",
        extensions: ["xbm"]
      },
      "image/x-xcf": {
        compressible: false
      },
      "image/x-xpixmap": {
        source: "apache",
        extensions: ["xpm"]
      },
      "image/x-xwindowdump": {
        source: "apache",
        extensions: ["xwd"]
      },
      "message/cpim": {
        source: "iana"
      },
      "message/delivery-status": {
        source: "iana"
      },
      "message/disposition-notification": {
        source: "iana",
        extensions: [
          "disposition-notification"
        ]
      },
      "message/external-body": {
        source: "iana"
      },
      "message/feedback-report": {
        source: "iana"
      },
      "message/global": {
        source: "iana",
        extensions: ["u8msg"]
      },
      "message/global-delivery-status": {
        source: "iana",
        extensions: ["u8dsn"]
      },
      "message/global-disposition-notification": {
        source: "iana",
        extensions: ["u8mdn"]
      },
      "message/global-headers": {
        source: "iana",
        extensions: ["u8hdr"]
      },
      "message/http": {
        source: "iana",
        compressible: false
      },
      "message/imdn+xml": {
        source: "iana",
        compressible: true
      },
      "message/news": {
        source: "iana"
      },
      "message/partial": {
        source: "iana",
        compressible: false
      },
      "message/rfc822": {
        source: "iana",
        compressible: true,
        extensions: ["eml", "mime"]
      },
      "message/s-http": {
        source: "iana"
      },
      "message/sip": {
        source: "iana"
      },
      "message/sipfrag": {
        source: "iana"
      },
      "message/tracking-status": {
        source: "iana"
      },
      "message/vnd.si.simp": {
        source: "iana"
      },
      "message/vnd.wfa.wsc": {
        source: "iana",
        extensions: ["wsc"]
      },
      "model/3mf": {
        source: "iana",
        extensions: ["3mf"]
      },
      "model/e57": {
        source: "iana"
      },
      "model/gltf+json": {
        source: "iana",
        compressible: true,
        extensions: ["gltf"]
      },
      "model/gltf-binary": {
        source: "iana",
        compressible: true,
        extensions: ["glb"]
      },
      "model/iges": {
        source: "iana",
        compressible: false,
        extensions: ["igs", "iges"]
      },
      "model/mesh": {
        source: "iana",
        compressible: false,
        extensions: ["msh", "mesh", "silo"]
      },
      "model/mtl": {
        source: "iana",
        extensions: ["mtl"]
      },
      "model/obj": {
        source: "iana",
        extensions: ["obj"]
      },
      "model/step": {
        source: "iana"
      },
      "model/step+xml": {
        source: "iana",
        compressible: true,
        extensions: ["stpx"]
      },
      "model/step+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpz"]
      },
      "model/step-xml+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpxz"]
      },
      "model/stl": {
        source: "iana",
        extensions: ["stl"]
      },
      "model/vnd.collada+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dae"]
      },
      "model/vnd.dwf": {
        source: "iana",
        extensions: ["dwf"]
      },
      "model/vnd.flatland.3dml": {
        source: "iana"
      },
      "model/vnd.gdl": {
        source: "iana",
        extensions: ["gdl"]
      },
      "model/vnd.gs-gdl": {
        source: "apache"
      },
      "model/vnd.gs.gdl": {
        source: "iana"
      },
      "model/vnd.gtw": {
        source: "iana",
        extensions: ["gtw"]
      },
      "model/vnd.moml+xml": {
        source: "iana",
        compressible: true
      },
      "model/vnd.mts": {
        source: "iana",
        extensions: ["mts"]
      },
      "model/vnd.opengex": {
        source: "iana",
        extensions: ["ogex"]
      },
      "model/vnd.parasolid.transmit.binary": {
        source: "iana",
        extensions: ["x_b"]
      },
      "model/vnd.parasolid.transmit.text": {
        source: "iana",
        extensions: ["x_t"]
      },
      "model/vnd.pytha.pyox": {
        source: "iana"
      },
      "model/vnd.rosette.annotated-data-model": {
        source: "iana"
      },
      "model/vnd.sap.vds": {
        source: "iana",
        extensions: ["vds"]
      },
      "model/vnd.usdz+zip": {
        source: "iana",
        compressible: false,
        extensions: ["usdz"]
      },
      "model/vnd.valve.source.compiled-map": {
        source: "iana",
        extensions: ["bsp"]
      },
      "model/vnd.vtu": {
        source: "iana",
        extensions: ["vtu"]
      },
      "model/vrml": {
        source: "iana",
        compressible: false,
        extensions: ["wrl", "vrml"]
      },
      "model/x3d+binary": {
        source: "apache",
        compressible: false,
        extensions: ["x3db", "x3dbz"]
      },
      "model/x3d+fastinfoset": {
        source: "iana",
        extensions: ["x3db"]
      },
      "model/x3d+vrml": {
        source: "apache",
        compressible: false,
        extensions: ["x3dv", "x3dvz"]
      },
      "model/x3d+xml": {
        source: "iana",
        compressible: true,
        extensions: ["x3d", "x3dz"]
      },
      "model/x3d-vrml": {
        source: "iana",
        extensions: ["x3dv"]
      },
      "multipart/alternative": {
        source: "iana",
        compressible: false
      },
      "multipart/appledouble": {
        source: "iana"
      },
      "multipart/byteranges": {
        source: "iana"
      },
      "multipart/digest": {
        source: "iana"
      },
      "multipart/encrypted": {
        source: "iana",
        compressible: false
      },
      "multipart/form-data": {
        source: "iana",
        compressible: false
      },
      "multipart/header-set": {
        source: "iana"
      },
      "multipart/mixed": {
        source: "iana"
      },
      "multipart/multilingual": {
        source: "iana"
      },
      "multipart/parallel": {
        source: "iana"
      },
      "multipart/related": {
        source: "iana",
        compressible: false
      },
      "multipart/report": {
        source: "iana"
      },
      "multipart/signed": {
        source: "iana",
        compressible: false
      },
      "multipart/vnd.bint.med-plus": {
        source: "iana"
      },
      "multipart/voice-message": {
        source: "iana"
      },
      "multipart/x-mixed-replace": {
        source: "iana"
      },
      "text/1d-interleaved-parityfec": {
        source: "iana"
      },
      "text/cache-manifest": {
        source: "iana",
        compressible: true,
        extensions: ["appcache", "manifest"]
      },
      "text/calendar": {
        source: "iana",
        extensions: ["ics", "ifb"]
      },
      "text/calender": {
        compressible: true
      },
      "text/cmd": {
        compressible: true
      },
      "text/coffeescript": {
        extensions: ["coffee", "litcoffee"]
      },
      "text/cql": {
        source: "iana"
      },
      "text/cql-expression": {
        source: "iana"
      },
      "text/cql-identifier": {
        source: "iana"
      },
      "text/css": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["css"]
      },
      "text/csv": {
        source: "iana",
        compressible: true,
        extensions: ["csv"]
      },
      "text/csv-schema": {
        source: "iana"
      },
      "text/directory": {
        source: "iana"
      },
      "text/dns": {
        source: "iana"
      },
      "text/ecmascript": {
        source: "iana"
      },
      "text/encaprtp": {
        source: "iana"
      },
      "text/enriched": {
        source: "iana"
      },
      "text/fhirpath": {
        source: "iana"
      },
      "text/flexfec": {
        source: "iana"
      },
      "text/fwdred": {
        source: "iana"
      },
      "text/gff3": {
        source: "iana"
      },
      "text/grammar-ref-list": {
        source: "iana"
      },
      "text/html": {
        source: "iana",
        compressible: true,
        extensions: ["html", "htm", "shtml"]
      },
      "text/jade": {
        extensions: ["jade"]
      },
      "text/javascript": {
        source: "iana",
        compressible: true
      },
      "text/jcr-cnd": {
        source: "iana"
      },
      "text/jsx": {
        compressible: true,
        extensions: ["jsx"]
      },
      "text/less": {
        compressible: true,
        extensions: ["less"]
      },
      "text/markdown": {
        source: "iana",
        compressible: true,
        extensions: ["markdown", "md"]
      },
      "text/mathml": {
        source: "nginx",
        extensions: ["mml"]
      },
      "text/mdx": {
        compressible: true,
        extensions: ["mdx"]
      },
      "text/mizar": {
        source: "iana"
      },
      "text/n3": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["n3"]
      },
      "text/parameters": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/parityfec": {
        source: "iana"
      },
      "text/plain": {
        source: "iana",
        compressible: true,
        extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
      },
      "text/provenance-notation": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/prs.fallenstein.rst": {
        source: "iana"
      },
      "text/prs.lines.tag": {
        source: "iana",
        extensions: ["dsc"]
      },
      "text/prs.prop.logic": {
        source: "iana"
      },
      "text/raptorfec": {
        source: "iana"
      },
      "text/red": {
        source: "iana"
      },
      "text/rfc822-headers": {
        source: "iana"
      },
      "text/richtext": {
        source: "iana",
        compressible: true,
        extensions: ["rtx"]
      },
      "text/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "text/rtp-enc-aescm128": {
        source: "iana"
      },
      "text/rtploopback": {
        source: "iana"
      },
      "text/rtx": {
        source: "iana"
      },
      "text/sgml": {
        source: "iana",
        extensions: ["sgml", "sgm"]
      },
      "text/shaclc": {
        source: "iana"
      },
      "text/shex": {
        source: "iana",
        extensions: ["shex"]
      },
      "text/slim": {
        extensions: ["slim", "slm"]
      },
      "text/spdx": {
        source: "iana",
        extensions: ["spdx"]
      },
      "text/strings": {
        source: "iana"
      },
      "text/stylus": {
        extensions: ["stylus", "styl"]
      },
      "text/t140": {
        source: "iana"
      },
      "text/tab-separated-values": {
        source: "iana",
        compressible: true,
        extensions: ["tsv"]
      },
      "text/troff": {
        source: "iana",
        extensions: ["t", "tr", "roff", "man", "me", "ms"]
      },
      "text/turtle": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["ttl"]
      },
      "text/ulpfec": {
        source: "iana"
      },
      "text/uri-list": {
        source: "iana",
        compressible: true,
        extensions: ["uri", "uris", "urls"]
      },
      "text/vcard": {
        source: "iana",
        compressible: true,
        extensions: ["vcard"]
      },
      "text/vnd.a": {
        source: "iana"
      },
      "text/vnd.abc": {
        source: "iana"
      },
      "text/vnd.ascii-art": {
        source: "iana"
      },
      "text/vnd.curl": {
        source: "iana",
        extensions: ["curl"]
      },
      "text/vnd.curl.dcurl": {
        source: "apache",
        extensions: ["dcurl"]
      },
      "text/vnd.curl.mcurl": {
        source: "apache",
        extensions: ["mcurl"]
      },
      "text/vnd.curl.scurl": {
        source: "apache",
        extensions: ["scurl"]
      },
      "text/vnd.debian.copyright": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.dmclientscript": {
        source: "iana"
      },
      "text/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "text/vnd.esmertec.theme-descriptor": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.familysearch.gedcom": {
        source: "iana",
        extensions: ["ged"]
      },
      "text/vnd.ficlab.flt": {
        source: "iana"
      },
      "text/vnd.fly": {
        source: "iana",
        extensions: ["fly"]
      },
      "text/vnd.fmi.flexstor": {
        source: "iana",
        extensions: ["flx"]
      },
      "text/vnd.gml": {
        source: "iana"
      },
      "text/vnd.graphviz": {
        source: "iana",
        extensions: ["gv"]
      },
      "text/vnd.hans": {
        source: "iana"
      },
      "text/vnd.hgl": {
        source: "iana"
      },
      "text/vnd.in3d.3dml": {
        source: "iana",
        extensions: ["3dml"]
      },
      "text/vnd.in3d.spot": {
        source: "iana",
        extensions: ["spot"]
      },
      "text/vnd.iptc.newsml": {
        source: "iana"
      },
      "text/vnd.iptc.nitf": {
        source: "iana"
      },
      "text/vnd.latex-z": {
        source: "iana"
      },
      "text/vnd.motorola.reflex": {
        source: "iana"
      },
      "text/vnd.ms-mediapackage": {
        source: "iana"
      },
      "text/vnd.net2phone.commcenter.command": {
        source: "iana"
      },
      "text/vnd.radisys.msml-basic-layout": {
        source: "iana"
      },
      "text/vnd.senx.warpscript": {
        source: "iana"
      },
      "text/vnd.si.uricatalogue": {
        source: "iana"
      },
      "text/vnd.sosi": {
        source: "iana"
      },
      "text/vnd.sun.j2me.app-descriptor": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["jad"]
      },
      "text/vnd.trolltech.linguist": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.wap.si": {
        source: "iana"
      },
      "text/vnd.wap.sl": {
        source: "iana"
      },
      "text/vnd.wap.wml": {
        source: "iana",
        extensions: ["wml"]
      },
      "text/vnd.wap.wmlscript": {
        source: "iana",
        extensions: ["wmls"]
      },
      "text/vtt": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["vtt"]
      },
      "text/x-asm": {
        source: "apache",
        extensions: ["s", "asm"]
      },
      "text/x-c": {
        source: "apache",
        extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
      },
      "text/x-component": {
        source: "nginx",
        extensions: ["htc"]
      },
      "text/x-fortran": {
        source: "apache",
        extensions: ["f", "for", "f77", "f90"]
      },
      "text/x-gwt-rpc": {
        compressible: true
      },
      "text/x-handlebars-template": {
        extensions: ["hbs"]
      },
      "text/x-java-source": {
        source: "apache",
        extensions: ["java"]
      },
      "text/x-jquery-tmpl": {
        compressible: true
      },
      "text/x-lua": {
        extensions: ["lua"]
      },
      "text/x-markdown": {
        compressible: true,
        extensions: ["mkd"]
      },
      "text/x-nfo": {
        source: "apache",
        extensions: ["nfo"]
      },
      "text/x-opml": {
        source: "apache",
        extensions: ["opml"]
      },
      "text/x-org": {
        compressible: true,
        extensions: ["org"]
      },
      "text/x-pascal": {
        source: "apache",
        extensions: ["p", "pas"]
      },
      "text/x-processing": {
        compressible: true,
        extensions: ["pde"]
      },
      "text/x-sass": {
        extensions: ["sass"]
      },
      "text/x-scss": {
        extensions: ["scss"]
      },
      "text/x-setext": {
        source: "apache",
        extensions: ["etx"]
      },
      "text/x-sfv": {
        source: "apache",
        extensions: ["sfv"]
      },
      "text/x-suse-ymp": {
        compressible: true,
        extensions: ["ymp"]
      },
      "text/x-uuencode": {
        source: "apache",
        extensions: ["uu"]
      },
      "text/x-vcalendar": {
        source: "apache",
        extensions: ["vcs"]
      },
      "text/x-vcard": {
        source: "apache",
        extensions: ["vcf"]
      },
      "text/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml"]
      },
      "text/xml-external-parsed-entity": {
        source: "iana"
      },
      "text/yaml": {
        compressible: true,
        extensions: ["yaml", "yml"]
      },
      "video/1d-interleaved-parityfec": {
        source: "iana"
      },
      "video/3gpp": {
        source: "iana",
        extensions: ["3gp", "3gpp"]
      },
      "video/3gpp-tt": {
        source: "iana"
      },
      "video/3gpp2": {
        source: "iana",
        extensions: ["3g2"]
      },
      "video/av1": {
        source: "iana"
      },
      "video/bmpeg": {
        source: "iana"
      },
      "video/bt656": {
        source: "iana"
      },
      "video/celb": {
        source: "iana"
      },
      "video/dv": {
        source: "iana"
      },
      "video/encaprtp": {
        source: "iana"
      },
      "video/ffv1": {
        source: "iana"
      },
      "video/flexfec": {
        source: "iana"
      },
      "video/h261": {
        source: "iana",
        extensions: ["h261"]
      },
      "video/h263": {
        source: "iana",
        extensions: ["h263"]
      },
      "video/h263-1998": {
        source: "iana"
      },
      "video/h263-2000": {
        source: "iana"
      },
      "video/h264": {
        source: "iana",
        extensions: ["h264"]
      },
      "video/h264-rcdo": {
        source: "iana"
      },
      "video/h264-svc": {
        source: "iana"
      },
      "video/h265": {
        source: "iana"
      },
      "video/iso.segment": {
        source: "iana",
        extensions: ["m4s"]
      },
      "video/jpeg": {
        source: "iana",
        extensions: ["jpgv"]
      },
      "video/jpeg2000": {
        source: "iana"
      },
      "video/jpm": {
        source: "apache",
        extensions: ["jpm", "jpgm"]
      },
      "video/jxsv": {
        source: "iana"
      },
      "video/mj2": {
        source: "iana",
        extensions: ["mj2", "mjp2"]
      },
      "video/mp1s": {
        source: "iana"
      },
      "video/mp2p": {
        source: "iana"
      },
      "video/mp2t": {
        source: "iana",
        extensions: ["ts"]
      },
      "video/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["mp4", "mp4v", "mpg4"]
      },
      "video/mp4v-es": {
        source: "iana"
      },
      "video/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
      },
      "video/mpeg4-generic": {
        source: "iana"
      },
      "video/mpv": {
        source: "iana"
      },
      "video/nv": {
        source: "iana"
      },
      "video/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogv"]
      },
      "video/parityfec": {
        source: "iana"
      },
      "video/pointer": {
        source: "iana"
      },
      "video/quicktime": {
        source: "iana",
        compressible: false,
        extensions: ["qt", "mov"]
      },
      "video/raptorfec": {
        source: "iana"
      },
      "video/raw": {
        source: "iana"
      },
      "video/rtp-enc-aescm128": {
        source: "iana"
      },
      "video/rtploopback": {
        source: "iana"
      },
      "video/rtx": {
        source: "iana"
      },
      "video/scip": {
        source: "iana"
      },
      "video/smpte291": {
        source: "iana"
      },
      "video/smpte292m": {
        source: "iana"
      },
      "video/ulpfec": {
        source: "iana"
      },
      "video/vc1": {
        source: "iana"
      },
      "video/vc2": {
        source: "iana"
      },
      "video/vnd.cctv": {
        source: "iana"
      },
      "video/vnd.dece.hd": {
        source: "iana",
        extensions: ["uvh", "uvvh"]
      },
      "video/vnd.dece.mobile": {
        source: "iana",
        extensions: ["uvm", "uvvm"]
      },
      "video/vnd.dece.mp4": {
        source: "iana"
      },
      "video/vnd.dece.pd": {
        source: "iana",
        extensions: ["uvp", "uvvp"]
      },
      "video/vnd.dece.sd": {
        source: "iana",
        extensions: ["uvs", "uvvs"]
      },
      "video/vnd.dece.video": {
        source: "iana",
        extensions: ["uvv", "uvvv"]
      },
      "video/vnd.directv.mpeg": {
        source: "iana"
      },
      "video/vnd.directv.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dlna.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dvb.file": {
        source: "iana",
        extensions: ["dvb"]
      },
      "video/vnd.fvt": {
        source: "iana",
        extensions: ["fvt"]
      },
      "video/vnd.hns.video": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsavc": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsmpeg2": {
        source: "iana"
      },
      "video/vnd.motorola.video": {
        source: "iana"
      },
      "video/vnd.motorola.videop": {
        source: "iana"
      },
      "video/vnd.mpegurl": {
        source: "iana",
        extensions: ["mxu", "m4u"]
      },
      "video/vnd.ms-playready.media.pyv": {
        source: "iana",
        extensions: ["pyv"]
      },
      "video/vnd.nokia.interleaved-multimedia": {
        source: "iana"
      },
      "video/vnd.nokia.mp4vr": {
        source: "iana"
      },
      "video/vnd.nokia.videovoip": {
        source: "iana"
      },
      "video/vnd.objectvideo": {
        source: "iana"
      },
      "video/vnd.radgamettools.bink": {
        source: "iana"
      },
      "video/vnd.radgamettools.smacker": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg1": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg4": {
        source: "iana"
      },
      "video/vnd.sealed.swf": {
        source: "iana"
      },
      "video/vnd.sealedmedia.softseal.mov": {
        source: "iana"
      },
      "video/vnd.uvvu.mp4": {
        source: "iana",
        extensions: ["uvu", "uvvu"]
      },
      "video/vnd.vivo": {
        source: "iana",
        extensions: ["viv"]
      },
      "video/vnd.youtube.yt": {
        source: "iana"
      },
      "video/vp8": {
        source: "iana"
      },
      "video/vp9": {
        source: "iana"
      },
      "video/webm": {
        source: "apache",
        compressible: false,
        extensions: ["webm"]
      },
      "video/x-f4v": {
        source: "apache",
        extensions: ["f4v"]
      },
      "video/x-fli": {
        source: "apache",
        extensions: ["fli"]
      },
      "video/x-flv": {
        source: "apache",
        compressible: false,
        extensions: ["flv"]
      },
      "video/x-m4v": {
        source: "apache",
        extensions: ["m4v"]
      },
      "video/x-matroska": {
        source: "apache",
        compressible: false,
        extensions: ["mkv", "mk3d", "mks"]
      },
      "video/x-mng": {
        source: "apache",
        extensions: ["mng"]
      },
      "video/x-ms-asf": {
        source: "apache",
        extensions: ["asf", "asx"]
      },
      "video/x-ms-vob": {
        source: "apache",
        extensions: ["vob"]
      },
      "video/x-ms-wm": {
        source: "apache",
        extensions: ["wm"]
      },
      "video/x-ms-wmv": {
        source: "apache",
        compressible: false,
        extensions: ["wmv"]
      },
      "video/x-ms-wmx": {
        source: "apache",
        extensions: ["wmx"]
      },
      "video/x-ms-wvx": {
        source: "apache",
        extensions: ["wvx"]
      },
      "video/x-msvideo": {
        source: "apache",
        extensions: ["avi"]
      },
      "video/x-sgi-movie": {
        source: "apache",
        extensions: ["movie"]
      },
      "video/x-smv": {
        source: "apache",
        extensions: ["smv"]
      },
      "x-conference/x-cooltalk": {
        source: "apache",
        extensions: ["ice"]
      },
      "x-shader/x-fragment": {
        compressible: true
      },
      "x-shader/x-vertex": {
        compressible: true
      }
    };
  }
});

// node_modules/mime-db/index.js
var require_mime_db = __commonJS({
  "node_modules/mime-db/index.js"(exports2, module2) {
    module2.exports = require_db();
  }
});

// node_modules/mime-types/index.js
var require_mime_types = __commonJS({
  "node_modules/mime-types/index.js"(exports2) {
    "use strict";
    var db = require_mime_db();
    var extname = require("path").extname;
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports2.charset = charset;
    exports2.charsets = { lookup: charset };
    exports2.contentType = contentType;
    exports2.extension = extension;
    exports2.extensions = /* @__PURE__ */ Object.create(null);
    exports2.lookup = lookup;
    exports2.types = /* @__PURE__ */ Object.create(null);
    populateMaps(exports2.extensions, exports2.types);
    function charset(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var mime = match && db[match[1].toLowerCase()];
      if (mime && mime.charset) {
        return mime.charset;
      }
      if (match && TEXT_TYPE_REGEXP.test(match[1])) {
        return "UTF-8";
      }
      return false;
    }
    function contentType(str) {
      if (!str || typeof str !== "string") {
        return false;
      }
      var mime = str.indexOf("/") === -1 ? exports2.lookup(str) : str;
      if (!mime) {
        return false;
      }
      if (mime.indexOf("charset") === -1) {
        var charset2 = exports2.charset(mime);
        if (charset2)
          mime += "; charset=" + charset2.toLowerCase();
      }
      return mime;
    }
    function extension(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var exts = match && exports2.extensions[match[1].toLowerCase()];
      if (!exts || !exts.length) {
        return false;
      }
      return exts[0];
    }
    function lookup(path) {
      if (!path || typeof path !== "string") {
        return false;
      }
      var extension2 = extname("x." + path).toLowerCase().substr(1);
      if (!extension2) {
        return false;
      }
      return exports2.types[extension2] || false;
    }
    function populateMaps(extensions, types) {
      var preference = ["nginx", "apache", void 0, "iana"];
      Object.keys(db).forEach(function forEachMimeType(type) {
        var mime = db[type];
        var exts = mime.extensions;
        if (!exts || !exts.length) {
          return;
        }
        extensions[type] = exts;
        for (var i = 0; i < exts.length; i++) {
          var extension2 = exts[i];
          if (types[extension2]) {
            var from = preference.indexOf(db[types[extension2]].source);
            var to = preference.indexOf(mime.source);
            if (types[extension2] !== "application/octet-stream" && (from > to || from === to && types[extension2].substr(0, 12) === "application/")) {
              continue;
            }
          }
          types[extension2] = type;
        }
      });
    }
  }
});

// node_modules/asynckit/lib/defer.js
var require_defer = __commonJS({
  "node_modules/asynckit/lib/defer.js"(exports2, module2) {
    module2.exports = defer;
    function defer(fn) {
      var nextTick = typeof setImmediate == "function" ? setImmediate : typeof process == "object" && typeof process.nextTick == "function" ? process.nextTick : null;
      if (nextTick) {
        nextTick(fn);
      } else {
        setTimeout(fn, 0);
      }
    }
  }
});

// node_modules/asynckit/lib/async.js
var require_async = __commonJS({
  "node_modules/asynckit/lib/async.js"(exports2, module2) {
    var defer = require_defer();
    module2.exports = async;
    function async(callback) {
      var isAsync = false;
      defer(function() {
        isAsync = true;
      });
      return function async_callback(err, result) {
        if (isAsync) {
          callback(err, result);
        } else {
          defer(function nextTick_callback() {
            callback(err, result);
          });
        }
      };
    }
  }
});

// node_modules/asynckit/lib/abort.js
var require_abort = __commonJS({
  "node_modules/asynckit/lib/abort.js"(exports2, module2) {
    module2.exports = abort;
    function abort(state) {
      Object.keys(state.jobs).forEach(clean.bind(state));
      state.jobs = {};
    }
    function clean(key) {
      if (typeof this.jobs[key] == "function") {
        this.jobs[key]();
      }
    }
  }
});

// node_modules/asynckit/lib/iterate.js
var require_iterate = __commonJS({
  "node_modules/asynckit/lib/iterate.js"(exports2, module2) {
    var async = require_async();
    var abort = require_abort();
    module2.exports = iterate;
    function iterate(list2, iterator, state, callback) {
      var key = state["keyedList"] ? state["keyedList"][state.index] : state.index;
      state.jobs[key] = runJob(iterator, key, list2[key], function(error, output) {
        if (!(key in state.jobs)) {
          return;
        }
        delete state.jobs[key];
        if (error) {
          abort(state);
        } else {
          state.results[key] = output;
        }
        callback(error, state.results);
      });
    }
    function runJob(iterator, key, item, callback) {
      var aborter;
      if (iterator.length == 2) {
        aborter = iterator(item, async(callback));
      } else {
        aborter = iterator(item, key, async(callback));
      }
      return aborter;
    }
  }
});

// node_modules/asynckit/lib/state.js
var require_state = __commonJS({
  "node_modules/asynckit/lib/state.js"(exports2, module2) {
    module2.exports = state;
    function state(list2, sortMethod) {
      var isNamedList = !Array.isArray(list2), initState = {
        index: 0,
        keyedList: isNamedList || sortMethod ? Object.keys(list2) : null,
        jobs: {},
        results: isNamedList ? {} : [],
        size: isNamedList ? Object.keys(list2).length : list2.length
      };
      if (sortMethod) {
        initState.keyedList.sort(isNamedList ? sortMethod : function(a, b) {
          return sortMethod(list2[a], list2[b]);
        });
      }
      return initState;
    }
  }
});

// node_modules/asynckit/lib/terminator.js
var require_terminator = __commonJS({
  "node_modules/asynckit/lib/terminator.js"(exports2, module2) {
    var abort = require_abort();
    var async = require_async();
    module2.exports = terminator;
    function terminator(callback) {
      if (!Object.keys(this.jobs).length) {
        return;
      }
      this.index = this.size;
      abort(this);
      async(callback)(null, this.results);
    }
  }
});

// node_modules/asynckit/parallel.js
var require_parallel = __commonJS({
  "node_modules/asynckit/parallel.js"(exports2, module2) {
    var iterate = require_iterate();
    var initState = require_state();
    var terminator = require_terminator();
    module2.exports = parallel;
    function parallel(list2, iterator, callback) {
      var state = initState(list2);
      while (state.index < (state["keyedList"] || list2).length) {
        iterate(list2, iterator, state, function(error, result) {
          if (error) {
            callback(error, result);
            return;
          }
          if (Object.keys(state.jobs).length === 0) {
            callback(null, state.results);
            return;
          }
        });
        state.index++;
      }
      return terminator.bind(state, callback);
    }
  }
});

// node_modules/asynckit/serialOrdered.js
var require_serialOrdered = __commonJS({
  "node_modules/asynckit/serialOrdered.js"(exports2, module2) {
    var iterate = require_iterate();
    var initState = require_state();
    var terminator = require_terminator();
    module2.exports = serialOrdered;
    module2.exports.ascending = ascending;
    module2.exports.descending = descending;
    function serialOrdered(list2, iterator, sortMethod, callback) {
      var state = initState(list2, sortMethod);
      iterate(list2, iterator, state, function iteratorHandler(error, result) {
        if (error) {
          callback(error, result);
          return;
        }
        state.index++;
        if (state.index < (state["keyedList"] || list2).length) {
          iterate(list2, iterator, state, iteratorHandler);
          return;
        }
        callback(null, state.results);
      });
      return terminator.bind(state, callback);
    }
    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    function descending(a, b) {
      return -1 * ascending(a, b);
    }
  }
});

// node_modules/asynckit/serial.js
var require_serial = __commonJS({
  "node_modules/asynckit/serial.js"(exports2, module2) {
    var serialOrdered = require_serialOrdered();
    module2.exports = serial;
    function serial(list2, iterator, callback) {
      return serialOrdered(list2, iterator, null, callback);
    }
  }
});

// node_modules/asynckit/index.js
var require_asynckit = __commonJS({
  "node_modules/asynckit/index.js"(exports2, module2) {
    module2.exports = {
      parallel: require_parallel(),
      serial: require_serial(),
      serialOrdered: require_serialOrdered()
    };
  }
});

// node_modules/form-data/lib/populate.js
var require_populate = __commonJS({
  "node_modules/form-data/lib/populate.js"(exports2, module2) {
    module2.exports = function(dst, src) {
      Object.keys(src).forEach(function(prop) {
        dst[prop] = dst[prop] || src[prop];
      });
      return dst;
    };
  }
});

// node_modules/form-data/lib/form_data.js
var require_form_data = __commonJS({
  "node_modules/form-data/lib/form_data.js"(exports2, module2) {
    var CombinedStream = require_combined_stream();
    var util = require("util");
    var path = require("path");
    var http = require("http");
    var https = require("https");
    var parseUrl = require("url").parse;
    var fs = require("fs");
    var Stream = require("stream").Stream;
    var mime = require_mime_types();
    var asynckit = require_asynckit();
    var populate = require_populate();
    module2.exports = FormData2;
    util.inherits(FormData2, CombinedStream);
    function FormData2(options) {
      if (!(this instanceof FormData2)) {
        return new FormData2(options);
      }
      this._overheadLength = 0;
      this._valueLength = 0;
      this._valuesToMeasure = [];
      CombinedStream.call(this);
      options = options || {};
      for (var option in options) {
        this[option] = options[option];
      }
    }
    FormData2.LINE_BREAK = "\r\n";
    FormData2.DEFAULT_CONTENT_TYPE = "application/octet-stream";
    FormData2.prototype.append = function(field, value, options) {
      options = options || {};
      if (typeof options == "string") {
        options = { filename: options };
      }
      var append = CombinedStream.prototype.append.bind(this);
      if (typeof value == "number") {
        value = "" + value;
      }
      if (util.isArray(value)) {
        this._error(new Error("Arrays are not supported."));
        return;
      }
      var header = this._multiPartHeader(field, value, options);
      var footer = this._multiPartFooter();
      append(header);
      append(value);
      append(footer);
      this._trackLength(header, value, options);
    };
    FormData2.prototype._trackLength = function(header, value, options) {
      var valueLength = 0;
      if (options.knownLength != null) {
        valueLength += +options.knownLength;
      } else if (Buffer.isBuffer(value)) {
        valueLength = value.length;
      } else if (typeof value === "string") {
        valueLength = Buffer.byteLength(value);
      }
      this._valueLength += valueLength;
      this._overheadLength += Buffer.byteLength(header) + FormData2.LINE_BREAK.length;
      if (!value || !value.path && !(value.readable && value.hasOwnProperty("httpVersion")) && !(value instanceof Stream)) {
        return;
      }
      if (!options.knownLength) {
        this._valuesToMeasure.push(value);
      }
    };
    FormData2.prototype._lengthRetriever = function(value, callback) {
      if (value.hasOwnProperty("fd")) {
        if (value.end != void 0 && value.end != Infinity && value.start != void 0) {
          callback(null, value.end + 1 - (value.start ? value.start : 0));
        } else {
          fs.stat(value.path, function(err, stat) {
            var fileSize;
            if (err) {
              callback(err);
              return;
            }
            fileSize = stat.size - (value.start ? value.start : 0);
            callback(null, fileSize);
          });
        }
      } else if (value.hasOwnProperty("httpVersion")) {
        callback(null, +value.headers["content-length"]);
      } else if (value.hasOwnProperty("httpModule")) {
        value.on("response", function(response) {
          value.pause();
          callback(null, +response.headers["content-length"]);
        });
        value.resume();
      } else {
        callback("Unknown stream");
      }
    };
    FormData2.prototype._multiPartHeader = function(field, value, options) {
      if (typeof options.header == "string") {
        return options.header;
      }
      var contentDisposition = this._getContentDisposition(value, options);
      var contentType = this._getContentType(value, options);
      var contents = "";
      var headers = {
        // add custom disposition as third element or keep it two elements if not
        "Content-Disposition": ["form-data", 'name="' + field + '"'].concat(contentDisposition || []),
        // if no content type. allow it to be empty array
        "Content-Type": [].concat(contentType || [])
      };
      if (typeof options.header == "object") {
        populate(headers, options.header);
      }
      var header;
      for (var prop in headers) {
        if (!headers.hasOwnProperty(prop))
          continue;
        header = headers[prop];
        if (header == null) {
          continue;
        }
        if (!Array.isArray(header)) {
          header = [header];
        }
        if (header.length) {
          contents += prop + ": " + header.join("; ") + FormData2.LINE_BREAK;
        }
      }
      return "--" + this.getBoundary() + FormData2.LINE_BREAK + contents + FormData2.LINE_BREAK;
    };
    FormData2.prototype._getContentDisposition = function(value, options) {
      var filename, contentDisposition;
      if (typeof options.filepath === "string") {
        filename = path.normalize(options.filepath).replace(/\\/g, "/");
      } else if (options.filename || value.name || value.path) {
        filename = path.basename(options.filename || value.name || value.path);
      } else if (value.readable && value.hasOwnProperty("httpVersion")) {
        filename = path.basename(value.client._httpMessage.path || "");
      }
      if (filename) {
        contentDisposition = 'filename="' + filename + '"';
      }
      return contentDisposition;
    };
    FormData2.prototype._getContentType = function(value, options) {
      var contentType = options.contentType;
      if (!contentType && value.name) {
        contentType = mime.lookup(value.name);
      }
      if (!contentType && value.path) {
        contentType = mime.lookup(value.path);
      }
      if (!contentType && value.readable && value.hasOwnProperty("httpVersion")) {
        contentType = value.headers["content-type"];
      }
      if (!contentType && (options.filepath || options.filename)) {
        contentType = mime.lookup(options.filepath || options.filename);
      }
      if (!contentType && typeof value == "object") {
        contentType = FormData2.DEFAULT_CONTENT_TYPE;
      }
      return contentType;
    };
    FormData2.prototype._multiPartFooter = function() {
      return function(next) {
        var footer = FormData2.LINE_BREAK;
        var lastPart = this._streams.length === 0;
        if (lastPart) {
          footer += this._lastBoundary();
        }
        next(footer);
      }.bind(this);
    };
    FormData2.prototype._lastBoundary = function() {
      return "--" + this.getBoundary() + "--" + FormData2.LINE_BREAK;
    };
    FormData2.prototype.getHeaders = function(userHeaders) {
      var header;
      var formHeaders = {
        "content-type": "multipart/form-data; boundary=" + this.getBoundary()
      };
      for (header in userHeaders) {
        if (userHeaders.hasOwnProperty(header)) {
          formHeaders[header.toLowerCase()] = userHeaders[header];
        }
      }
      return formHeaders;
    };
    FormData2.prototype.setBoundary = function(boundary) {
      this._boundary = boundary;
    };
    FormData2.prototype.getBoundary = function() {
      if (!this._boundary) {
        this._generateBoundary();
      }
      return this._boundary;
    };
    FormData2.prototype.getBuffer = function() {
      var dataBuffer = new Buffer.alloc(0);
      var boundary = this.getBoundary();
      for (var i = 0, len = this._streams.length; i < len; i++) {
        if (typeof this._streams[i] !== "function") {
          if (Buffer.isBuffer(this._streams[i])) {
            dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
          } else {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(this._streams[i])]);
          }
          if (typeof this._streams[i] !== "string" || this._streams[i].substring(2, boundary.length + 2) !== boundary) {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(FormData2.LINE_BREAK)]);
          }
        }
      }
      return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
    };
    FormData2.prototype._generateBoundary = function() {
      var boundary = "--------------------------";
      for (var i = 0; i < 24; i++) {
        boundary += Math.floor(Math.random() * 10).toString(16);
      }
      this._boundary = boundary;
    };
    FormData2.prototype.getLengthSync = function() {
      var knownLength = this._overheadLength + this._valueLength;
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }
      if (!this.hasKnownLength()) {
        this._error(new Error("Cannot calculate proper length in synchronous way."));
      }
      return knownLength;
    };
    FormData2.prototype.hasKnownLength = function() {
      var hasKnownLength = true;
      if (this._valuesToMeasure.length) {
        hasKnownLength = false;
      }
      return hasKnownLength;
    };
    FormData2.prototype.getLength = function(cb) {
      var knownLength = this._overheadLength + this._valueLength;
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }
      if (!this._valuesToMeasure.length) {
        process.nextTick(cb.bind(this, null, knownLength));
        return;
      }
      asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function(err, values) {
        if (err) {
          cb(err);
          return;
        }
        values.forEach(function(length) {
          knownLength += length;
        });
        cb(null, knownLength);
      });
    };
    FormData2.prototype.submit = function(params, cb) {
      var request, options, defaults = { method: "post" };
      if (typeof params == "string") {
        params = parseUrl(params);
        options = populate({
          port: params.port,
          path: params.pathname,
          host: params.hostname,
          protocol: params.protocol
        }, defaults);
      } else {
        options = populate(params, defaults);
        if (!options.port) {
          options.port = options.protocol == "https:" ? 443 : 80;
        }
      }
      options.headers = this.getHeaders(params.headers);
      if (options.protocol == "https:") {
        request = https.request(options);
      } else {
        request = http.request(options);
      }
      this.getLength(function(err, length) {
        if (err && err !== "Unknown stream") {
          this._error(err);
          return;
        }
        if (length) {
          request.setHeader("Content-Length", length);
        }
        this.pipe(request);
        if (cb) {
          var onResponse;
          var callback = function(error, responce) {
            request.removeListener("error", callback);
            request.removeListener("response", onResponse);
            return cb.call(this, error, responce);
          };
          onResponse = callback.bind(this, null);
          request.on("error", callback);
          request.on("response", onResponse);
        }
      }.bind(this));
      return request;
    };
    FormData2.prototype._error = function(err) {
      if (!this.error) {
        this.error = err;
        this.pause();
        this.emit("error", err);
      }
    };
    FormData2.prototype.toString = function() {
      return "[object FormData]";
    };
  }
});

// node_modules/has-symbols/shams.js
var require_shams = __commonJS({
  "node_modules/has-symbols/shams.js"(exports2, module2) {
    "use strict";
    module2.exports = function hasSymbols() {
      if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
        return false;
      }
      if (typeof Symbol.iterator === "symbol") {
        return true;
      }
      var obj = {};
      var sym = Symbol("test");
      var symObj = Object(sym);
      if (typeof sym === "string") {
        return false;
      }
      if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
        return false;
      }
      if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
        return false;
      }
      var symVal = 42;
      obj[sym] = symVal;
      for (sym in obj) {
        return false;
      }
      if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
        return false;
      }
      if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
        return false;
      }
      var syms = Object.getOwnPropertySymbols(obj);
      if (syms.length !== 1 || syms[0] !== sym) {
        return false;
      }
      if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
        return false;
      }
      if (typeof Object.getOwnPropertyDescriptor === "function") {
        var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
        if (descriptor.value !== symVal || descriptor.enumerable !== true) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/has-symbols/index.js
var require_has_symbols = __commonJS({
  "node_modules/has-symbols/index.js"(exports2, module2) {
    "use strict";
    var origSymbol = typeof Symbol !== "undefined" && Symbol;
    var hasSymbolSham = require_shams();
    module2.exports = function hasNativeSymbols() {
      if (typeof origSymbol !== "function") {
        return false;
      }
      if (typeof Symbol !== "function") {
        return false;
      }
      if (typeof origSymbol("foo") !== "symbol") {
        return false;
      }
      if (typeof Symbol("bar") !== "symbol") {
        return false;
      }
      return hasSymbolSham();
    };
  }
});

// node_modules/has-proto/index.js
var require_has_proto = __commonJS({
  "node_modules/has-proto/index.js"(exports2, module2) {
    "use strict";
    var test = {
      foo: {}
    };
    var $Object = Object;
    module2.exports = function hasProto() {
      return { __proto__: test }.foo === test.foo && !({ __proto__: null } instanceof $Object);
    };
  }
});

// node_modules/function-bind/implementation.js
var require_implementation = __commonJS({
  "node_modules/function-bind/implementation.js"(exports2, module2) {
    "use strict";
    var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
    var toStr = Object.prototype.toString;
    var max = Math.max;
    var funcType = "[object Function]";
    var concatty = function concatty2(a, b) {
      var arr = [];
      for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
      }
      for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
      }
      return arr;
    };
    var slicy = function slicy2(arrLike, offset) {
      var arr = [];
      for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
      }
      return arr;
    };
    var joiny = function(arr, joiner) {
      var str = "";
      for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
          str += joiner;
        }
      }
      return str;
    };
    module2.exports = function bind(that) {
      var target = this;
      if (typeof target !== "function" || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slicy(arguments, 1);
      var bound;
      var binder = function() {
        if (this instanceof bound) {
          var result = target.apply(
            this,
            concatty(args, arguments)
          );
          if (Object(result) === result) {
            return result;
          }
          return this;
        }
        return target.apply(
          that,
          concatty(args, arguments)
        );
      };
      var boundLength = max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = "$" + i;
      }
      bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
      if (target.prototype) {
        var Empty = function Empty2() {
        };
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
      }
      return bound;
    };
  }
});

// node_modules/function-bind/index.js
var require_function_bind = __commonJS({
  "node_modules/function-bind/index.js"(exports2, module2) {
    "use strict";
    var implementation = require_implementation();
    module2.exports = Function.prototype.bind || implementation;
  }
});

// node_modules/hasown/index.js
var require_hasown = __commonJS({
  "node_modules/hasown/index.js"(exports2, module2) {
    "use strict";
    var call = Function.prototype.call;
    var $hasOwn = Object.prototype.hasOwnProperty;
    var bind = require_function_bind();
    module2.exports = bind.call(call, $hasOwn);
  }
});

// node_modules/get-intrinsic/index.js
var require_get_intrinsic = __commonJS({
  "node_modules/get-intrinsic/index.js"(exports2, module2) {
    "use strict";
    var undefined2;
    var $SyntaxError = SyntaxError;
    var $Function = Function;
    var $TypeError = TypeError;
    var getEvalledConstructor = function(expressionSyntax) {
      try {
        return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
      } catch (e) {
      }
    };
    var $gOPD = Object.getOwnPropertyDescriptor;
    if ($gOPD) {
      try {
        $gOPD({}, "");
      } catch (e) {
        $gOPD = null;
      }
    }
    var throwTypeError = function() {
      throw new $TypeError();
    };
    var ThrowTypeError = $gOPD ? function() {
      try {
        arguments.callee;
        return throwTypeError;
      } catch (calleeThrows) {
        try {
          return $gOPD(arguments, "callee").get;
        } catch (gOPDthrows) {
          return throwTypeError;
        }
      }
    }() : throwTypeError;
    var hasSymbols = require_has_symbols()();
    var hasProto = require_has_proto()();
    var getProto = Object.getPrototypeOf || (hasProto ? function(x) {
      return x.__proto__;
    } : null);
    var needsEval = {};
    var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
    var INTRINSICS = {
      "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
      "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
      "%AsyncFromSyncIteratorPrototype%": undefined2,
      "%AsyncFunction%": needsEval,
      "%AsyncGenerator%": needsEval,
      "%AsyncGeneratorFunction%": needsEval,
      "%AsyncIteratorPrototype%": needsEval,
      "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
      "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
      "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
      "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
      "%Boolean%": Boolean,
      "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
      "%Date%": Date,
      "%decodeURI%": decodeURI,
      "%decodeURIComponent%": decodeURIComponent,
      "%encodeURI%": encodeURI,
      "%encodeURIComponent%": encodeURIComponent,
      "%Error%": Error,
      "%eval%": eval,
      // eslint-disable-line no-eval
      "%EvalError%": EvalError,
      "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
      "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
      "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
      "%Function%": $Function,
      "%GeneratorFunction%": needsEval,
      "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
      "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
      "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
      "%JSON%": typeof JSON === "object" ? JSON : undefined2,
      "%Map%": typeof Map === "undefined" ? undefined2 : Map,
      "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
      "%Math%": Math,
      "%Number%": Number,
      "%Object%": Object,
      "%parseFloat%": parseFloat,
      "%parseInt%": parseInt,
      "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
      "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
      "%RangeError%": RangeError,
      "%ReferenceError%": ReferenceError,
      "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
      "%RegExp%": RegExp,
      "%Set%": typeof Set === "undefined" ? undefined2 : Set,
      "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
      "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
      "%Symbol%": hasSymbols ? Symbol : undefined2,
      "%SyntaxError%": $SyntaxError,
      "%ThrowTypeError%": ThrowTypeError,
      "%TypedArray%": TypedArray,
      "%TypeError%": $TypeError,
      "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
      "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
      "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
      "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
      "%URIError%": URIError,
      "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
      "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
      "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet
    };
    if (getProto) {
      try {
        null.error;
      } catch (e) {
        errorProto = getProto(getProto(e));
        INTRINSICS["%Error.prototype%"] = errorProto;
      }
    }
    var errorProto;
    var doEval = function doEval2(name) {
      var value;
      if (name === "%AsyncFunction%") {
        value = getEvalledConstructor("async function () {}");
      } else if (name === "%GeneratorFunction%") {
        value = getEvalledConstructor("function* () {}");
      } else if (name === "%AsyncGeneratorFunction%") {
        value = getEvalledConstructor("async function* () {}");
      } else if (name === "%AsyncGenerator%") {
        var fn = doEval2("%AsyncGeneratorFunction%");
        if (fn) {
          value = fn.prototype;
        }
      } else if (name === "%AsyncIteratorPrototype%") {
        var gen = doEval2("%AsyncGenerator%");
        if (gen && getProto) {
          value = getProto(gen.prototype);
        }
      }
      INTRINSICS[name] = value;
      return value;
    };
    var LEGACY_ALIASES = {
      "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
      "%ArrayPrototype%": ["Array", "prototype"],
      "%ArrayProto_entries%": ["Array", "prototype", "entries"],
      "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
      "%ArrayProto_keys%": ["Array", "prototype", "keys"],
      "%ArrayProto_values%": ["Array", "prototype", "values"],
      "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
      "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
      "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
      "%BooleanPrototype%": ["Boolean", "prototype"],
      "%DataViewPrototype%": ["DataView", "prototype"],
      "%DatePrototype%": ["Date", "prototype"],
      "%ErrorPrototype%": ["Error", "prototype"],
      "%EvalErrorPrototype%": ["EvalError", "prototype"],
      "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
      "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
      "%FunctionPrototype%": ["Function", "prototype"],
      "%Generator%": ["GeneratorFunction", "prototype"],
      "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
      "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
      "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
      "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
      "%JSONParse%": ["JSON", "parse"],
      "%JSONStringify%": ["JSON", "stringify"],
      "%MapPrototype%": ["Map", "prototype"],
      "%NumberPrototype%": ["Number", "prototype"],
      "%ObjectPrototype%": ["Object", "prototype"],
      "%ObjProto_toString%": ["Object", "prototype", "toString"],
      "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
      "%PromisePrototype%": ["Promise", "prototype"],
      "%PromiseProto_then%": ["Promise", "prototype", "then"],
      "%Promise_all%": ["Promise", "all"],
      "%Promise_reject%": ["Promise", "reject"],
      "%Promise_resolve%": ["Promise", "resolve"],
      "%RangeErrorPrototype%": ["RangeError", "prototype"],
      "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
      "%RegExpPrototype%": ["RegExp", "prototype"],
      "%SetPrototype%": ["Set", "prototype"],
      "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
      "%StringPrototype%": ["String", "prototype"],
      "%SymbolPrototype%": ["Symbol", "prototype"],
      "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
      "%TypedArrayPrototype%": ["TypedArray", "prototype"],
      "%TypeErrorPrototype%": ["TypeError", "prototype"],
      "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
      "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
      "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
      "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
      "%URIErrorPrototype%": ["URIError", "prototype"],
      "%WeakMapPrototype%": ["WeakMap", "prototype"],
      "%WeakSetPrototype%": ["WeakSet", "prototype"]
    };
    var bind = require_function_bind();
    var hasOwn = require_hasown();
    var $concat = bind.call(Function.call, Array.prototype.concat);
    var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
    var $replace = bind.call(Function.call, String.prototype.replace);
    var $strSlice = bind.call(Function.call, String.prototype.slice);
    var $exec = bind.call(Function.call, RegExp.prototype.exec);
    var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = function stringToPath2(string2) {
      var first = $strSlice(string2, 0, 1);
      var last = $strSlice(string2, -1);
      if (first === "%" && last !== "%") {
        throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
      } else if (last === "%" && first !== "%") {
        throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
      }
      var result = [];
      $replace(string2, rePropName, function(match, number2, quote, subString) {
        result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number2 || match;
      });
      return result;
    };
    var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
      var intrinsicName = name;
      var alias;
      if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
        alias = LEGACY_ALIASES[intrinsicName];
        intrinsicName = "%" + alias[0] + "%";
      }
      if (hasOwn(INTRINSICS, intrinsicName)) {
        var value = INTRINSICS[intrinsicName];
        if (value === needsEval) {
          value = doEval(intrinsicName);
        }
        if (typeof value === "undefined" && !allowMissing) {
          throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
        }
        return {
          alias,
          name: intrinsicName,
          value
        };
      }
      throw new $SyntaxError("intrinsic " + name + " does not exist!");
    };
    module2.exports = function GetIntrinsic(name, allowMissing) {
      if (typeof name !== "string" || name.length === 0) {
        throw new $TypeError("intrinsic name must be a non-empty string");
      }
      if (arguments.length > 1 && typeof allowMissing !== "boolean") {
        throw new $TypeError('"allowMissing" argument must be a boolean');
      }
      if ($exec(/^%?[^%]*%?$/, name) === null) {
        throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      }
      var parts = stringToPath(name);
      var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
      var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
      var intrinsicRealName = intrinsic.name;
      var value = intrinsic.value;
      var skipFurtherCaching = false;
      var alias = intrinsic.alias;
      if (alias) {
        intrinsicBaseName = alias[0];
        $spliceApply(parts, $concat([0, 1], alias));
      }
      for (var i = 1, isOwn = true; i < parts.length; i += 1) {
        var part = parts[i];
        var first = $strSlice(part, 0, 1);
        var last = $strSlice(part, -1);
        if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
          throw new $SyntaxError("property names with quotes must have matching quotes");
        }
        if (part === "constructor" || !isOwn) {
          skipFurtherCaching = true;
        }
        intrinsicBaseName += "." + part;
        intrinsicRealName = "%" + intrinsicBaseName + "%";
        if (hasOwn(INTRINSICS, intrinsicRealName)) {
          value = INTRINSICS[intrinsicRealName];
        } else if (value != null) {
          if (!(part in value)) {
            if (!allowMissing) {
              throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
            }
            return void 0;
          }
          if ($gOPD && i + 1 >= parts.length) {
            var desc = $gOPD(value, part);
            isOwn = !!desc;
            if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
              value = desc.get;
            } else {
              value = value[part];
            }
          } else {
            isOwn = hasOwn(value, part);
            value = value[part];
          }
          if (isOwn && !skipFurtherCaching) {
            INTRINSICS[intrinsicRealName] = value;
          }
        }
      }
      return value;
    };
  }
});

// node_modules/has-property-descriptors/index.js
var require_has_property_descriptors = __commonJS({
  "node_modules/has-property-descriptors/index.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var $defineProperty = GetIntrinsic("%Object.defineProperty%", true);
    var hasPropertyDescriptors = function hasPropertyDescriptors2() {
      if ($defineProperty) {
        try {
          $defineProperty({}, "a", { value: 1 });
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    };
    hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
      if (!hasPropertyDescriptors()) {
        return null;
      }
      try {
        return $defineProperty([], "length", { value: 1 }).length !== 1;
      } catch (e) {
        return true;
      }
    };
    module2.exports = hasPropertyDescriptors;
  }
});

// node_modules/gopd/index.js
var require_gopd = __commonJS({
  "node_modules/gopd/index.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var $gOPD = GetIntrinsic("%Object.getOwnPropertyDescriptor%", true);
    if ($gOPD) {
      try {
        $gOPD([], "length");
      } catch (e) {
        $gOPD = null;
      }
    }
    module2.exports = $gOPD;
  }
});

// node_modules/define-data-property/index.js
var require_define_data_property = __commonJS({
  "node_modules/define-data-property/index.js"(exports2, module2) {
    "use strict";
    var hasPropertyDescriptors = require_has_property_descriptors()();
    var GetIntrinsic = require_get_intrinsic();
    var $defineProperty = hasPropertyDescriptors && GetIntrinsic("%Object.defineProperty%", true);
    if ($defineProperty) {
      try {
        $defineProperty({}, "a", { value: 1 });
      } catch (e) {
        $defineProperty = false;
      }
    }
    var $SyntaxError = GetIntrinsic("%SyntaxError%");
    var $TypeError = GetIntrinsic("%TypeError%");
    var gopd = require_gopd();
    module2.exports = function defineDataProperty(obj, property2, value) {
      if (!obj || typeof obj !== "object" && typeof obj !== "function") {
        throw new $TypeError("`obj` must be an object or a function`");
      }
      if (typeof property2 !== "string" && typeof property2 !== "symbol") {
        throw new $TypeError("`property` must be a string or a symbol`");
      }
      if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null) {
        throw new $TypeError("`nonEnumerable`, if provided, must be a boolean or null");
      }
      if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null) {
        throw new $TypeError("`nonWritable`, if provided, must be a boolean or null");
      }
      if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null) {
        throw new $TypeError("`nonConfigurable`, if provided, must be a boolean or null");
      }
      if (arguments.length > 6 && typeof arguments[6] !== "boolean") {
        throw new $TypeError("`loose`, if provided, must be a boolean");
      }
      var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
      var nonWritable = arguments.length > 4 ? arguments[4] : null;
      var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
      var loose = arguments.length > 6 ? arguments[6] : false;
      var desc = !!gopd && gopd(obj, property2);
      if ($defineProperty) {
        $defineProperty(obj, property2, {
          configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
          enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
          value,
          writable: nonWritable === null && desc ? desc.writable : !nonWritable
        });
      } else if (loose || !nonEnumerable && !nonWritable && !nonConfigurable) {
        obj[property2] = value;
      } else {
        throw new $SyntaxError("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
      }
    };
  }
});

// node_modules/set-function-length/index.js
var require_set_function_length = __commonJS({
  "node_modules/set-function-length/index.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var define = require_define_data_property();
    var hasDescriptors = require_has_property_descriptors()();
    var gOPD = require_gopd();
    var $TypeError = GetIntrinsic("%TypeError%");
    var $floor = GetIntrinsic("%Math.floor%");
    module2.exports = function setFunctionLength(fn, length) {
      if (typeof fn !== "function") {
        throw new $TypeError("`fn` is not a function");
      }
      if (typeof length !== "number" || length < 0 || length > 4294967295 || $floor(length) !== length) {
        throw new $TypeError("`length` must be a positive 32-bit integer");
      }
      var loose = arguments.length > 2 && !!arguments[2];
      var functionLengthIsConfigurable = true;
      var functionLengthIsWritable = true;
      if ("length" in fn && gOPD) {
        var desc = gOPD(fn, "length");
        if (desc && !desc.configurable) {
          functionLengthIsConfigurable = false;
        }
        if (desc && !desc.writable) {
          functionLengthIsWritable = false;
        }
      }
      if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
        if (hasDescriptors) {
          define(fn, "length", length, true, true);
        } else {
          define(fn, "length", length);
        }
      }
      return fn;
    };
  }
});

// node_modules/call-bind/index.js
var require_call_bind = __commonJS({
  "node_modules/call-bind/index.js"(exports2, module2) {
    "use strict";
    var bind = require_function_bind();
    var GetIntrinsic = require_get_intrinsic();
    var setFunctionLength = require_set_function_length();
    var $TypeError = GetIntrinsic("%TypeError%");
    var $apply = GetIntrinsic("%Function.prototype.apply%");
    var $call = GetIntrinsic("%Function.prototype.call%");
    var $reflectApply = GetIntrinsic("%Reflect.apply%", true) || bind.call($call, $apply);
    var $defineProperty = GetIntrinsic("%Object.defineProperty%", true);
    var $max = GetIntrinsic("%Math.max%");
    if ($defineProperty) {
      try {
        $defineProperty({}, "a", { value: 1 });
      } catch (e) {
        $defineProperty = null;
      }
    }
    module2.exports = function callBind(originalFunction) {
      if (typeof originalFunction !== "function") {
        throw new $TypeError("a function is required");
      }
      var func = $reflectApply(bind, $call, arguments);
      return setFunctionLength(
        func,
        1 + $max(0, originalFunction.length - (arguments.length - 1)),
        true
      );
    };
    var applyBind = function applyBind2() {
      return $reflectApply(bind, $apply, arguments);
    };
    if ($defineProperty) {
      $defineProperty(module2.exports, "apply", { value: applyBind });
    } else {
      module2.exports.apply = applyBind;
    }
  }
});

// node_modules/call-bind/callBound.js
var require_callBound = __commonJS({
  "node_modules/call-bind/callBound.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var callBind = require_call_bind();
    var $indexOf = callBind(GetIntrinsic("String.prototype.indexOf"));
    module2.exports = function callBoundIntrinsic(name, allowMissing) {
      var intrinsic = GetIntrinsic(name, !!allowMissing);
      if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
        return callBind(intrinsic);
      }
      return intrinsic;
    };
  }
});

// node_modules/object-inspect/util.inspect.js
var require_util_inspect = __commonJS({
  "node_modules/object-inspect/util.inspect.js"(exports2, module2) {
    module2.exports = require("util").inspect;
  }
});

// node_modules/object-inspect/index.js
var require_object_inspect = __commonJS({
  "node_modules/object-inspect/index.js"(exports2, module2) {
    var hasMap = typeof Map === "function" && Map.prototype;
    var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, "size") : null;
    var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === "function" ? mapSizeDescriptor.get : null;
    var mapForEach = hasMap && Map.prototype.forEach;
    var hasSet = typeof Set === "function" && Set.prototype;
    var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, "size") : null;
    var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === "function" ? setSizeDescriptor.get : null;
    var setForEach = hasSet && Set.prototype.forEach;
    var hasWeakMap = typeof WeakMap === "function" && WeakMap.prototype;
    var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
    var hasWeakSet = typeof WeakSet === "function" && WeakSet.prototype;
    var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
    var hasWeakRef = typeof WeakRef === "function" && WeakRef.prototype;
    var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
    var booleanValueOf = Boolean.prototype.valueOf;
    var objectToString = Object.prototype.toString;
    var functionToString = Function.prototype.toString;
    var $match = String.prototype.match;
    var $slice = String.prototype.slice;
    var $replace = String.prototype.replace;
    var $toUpperCase = String.prototype.toUpperCase;
    var $toLowerCase = String.prototype.toLowerCase;
    var $test = RegExp.prototype.test;
    var $concat = Array.prototype.concat;
    var $join = Array.prototype.join;
    var $arrSlice = Array.prototype.slice;
    var $floor = Math.floor;
    var bigIntValueOf = typeof BigInt === "function" ? BigInt.prototype.valueOf : null;
    var gOPS = Object.getOwnPropertySymbols;
    var symToString = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol.prototype.toString : null;
    var hasShammedSymbols = typeof Symbol === "function" && typeof Symbol.iterator === "object";
    var toStringTag = typeof Symbol === "function" && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? "object" : "symbol") ? Symbol.toStringTag : null;
    var isEnumerable = Object.prototype.propertyIsEnumerable;
    var gPO = (typeof Reflect === "function" ? Reflect.getPrototypeOf : Object.getPrototypeOf) || ([].__proto__ === Array.prototype ? function(O) {
      return O.__proto__;
    } : null);
    function addNumericSeparator(num, str) {
      if (num === Infinity || num === -Infinity || num !== num || num && num > -1e3 && num < 1e3 || $test.call(/e/, str)) {
        return str;
      }
      var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
      if (typeof num === "number") {
        var int = num < 0 ? -$floor(-num) : $floor(num);
        if (int !== num) {
          var intStr = String(int);
          var dec = $slice.call(str, intStr.length + 1);
          return $replace.call(intStr, sepRegex, "$&_") + "." + $replace.call($replace.call(dec, /([0-9]{3})/g, "$&_"), /_$/, "");
        }
      }
      return $replace.call(str, sepRegex, "$&_");
    }
    var utilInspect = require_util_inspect();
    var inspectCustom = utilInspect.custom;
    var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;
    module2.exports = function inspect_(obj, options, depth, seen) {
      var opts = options || {};
      if (has(opts, "quoteStyle") && (opts.quoteStyle !== "single" && opts.quoteStyle !== "double")) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
      }
      if (has(opts, "maxStringLength") && (typeof opts.maxStringLength === "number" ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity : opts.maxStringLength !== null)) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
      }
      var customInspect = has(opts, "customInspect") ? opts.customInspect : true;
      if (typeof customInspect !== "boolean" && customInspect !== "symbol") {
        throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");
      }
      if (has(opts, "indent") && opts.indent !== null && opts.indent !== "	" && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
      }
      if (has(opts, "numericSeparator") && typeof opts.numericSeparator !== "boolean") {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
      }
      var numericSeparator = opts.numericSeparator;
      if (typeof obj === "undefined") {
        return "undefined";
      }
      if (obj === null) {
        return "null";
      }
      if (typeof obj === "boolean") {
        return obj ? "true" : "false";
      }
      if (typeof obj === "string") {
        return inspectString(obj, opts);
      }
      if (typeof obj === "number") {
        if (obj === 0) {
          return Infinity / obj > 0 ? "0" : "-0";
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
      }
      if (typeof obj === "bigint") {
        var bigIntStr = String(obj) + "n";
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
      }
      var maxDepth = typeof opts.depth === "undefined" ? 5 : opts.depth;
      if (typeof depth === "undefined") {
        depth = 0;
      }
      if (depth >= maxDepth && maxDepth > 0 && typeof obj === "object") {
        return isArray(obj) ? "[Array]" : "[Object]";
      }
      var indent = getIndent(opts, depth);
      if (typeof seen === "undefined") {
        seen = [];
      } else if (indexOf(seen, obj) >= 0) {
        return "[Circular]";
      }
      function inspect(value, from, noIndent) {
        if (from) {
          seen = $arrSlice.call(seen);
          seen.push(from);
        }
        if (noIndent) {
          var newOpts = {
            depth: opts.depth
          };
          if (has(opts, "quoteStyle")) {
            newOpts.quoteStyle = opts.quoteStyle;
          }
          return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
      }
      if (typeof obj === "function" && !isRegExp(obj)) {
        var name = nameOf(obj);
        var keys2 = arrObjKeys(obj, inspect);
        return "[Function" + (name ? ": " + name : " (anonymous)") + "]" + (keys2.length > 0 ? " { " + $join.call(keys2, ", ") + " }" : "");
      }
      if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, "$1") : symToString.call(obj);
        return typeof obj === "object" && !hasShammedSymbols ? markBoxed(symString) : symString;
      }
      if (isElement(obj)) {
        var s = "<" + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
          s += " " + attrs[i].name + "=" + wrapQuotes(quote(attrs[i].value), "double", opts);
        }
        s += ">";
        if (obj.childNodes && obj.childNodes.length) {
          s += "...";
        }
        s += "</" + $toLowerCase.call(String(obj.nodeName)) + ">";
        return s;
      }
      if (isArray(obj)) {
        if (obj.length === 0) {
          return "[]";
        }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
          return "[" + indentedJoin(xs, indent) + "]";
        }
        return "[ " + $join.call(xs, ", ") + " ]";
      }
      if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!("cause" in Error.prototype) && "cause" in obj && !isEnumerable.call(obj, "cause")) {
          return "{ [" + String(obj) + "] " + $join.call($concat.call("[cause]: " + inspect(obj.cause), parts), ", ") + " }";
        }
        if (parts.length === 0) {
          return "[" + String(obj) + "]";
        }
        return "{ [" + String(obj) + "] " + $join.call(parts, ", ") + " }";
      }
      if (typeof obj === "object" && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === "function" && utilInspect) {
          return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== "symbol" && typeof obj.inspect === "function") {
          return obj.inspect();
        }
      }
      if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
          mapForEach.call(obj, function(value, key) {
            mapParts.push(inspect(key, obj, true) + " => " + inspect(value, obj));
          });
        }
        return collectionOf("Map", mapSize.call(obj), mapParts, indent);
      }
      if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
          setForEach.call(obj, function(value) {
            setParts.push(inspect(value, obj));
          });
        }
        return collectionOf("Set", setSize.call(obj), setParts, indent);
      }
      if (isWeakMap(obj)) {
        return weakCollectionOf("WeakMap");
      }
      if (isWeakSet(obj)) {
        return weakCollectionOf("WeakSet");
      }
      if (isWeakRef(obj)) {
        return weakCollectionOf("WeakRef");
      }
      if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
      }
      if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
      }
      if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
      }
      if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
      }
      if (typeof window !== "undefined" && obj === window) {
        return "{ [object Window] }";
      }
      if (obj === global) {
        return "{ [object globalThis] }";
      }
      if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject2 = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? "" : "null prototype";
        var stringTag = !isPlainObject2 && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? "Object" : "";
        var constructorTag = isPlainObject2 || typeof obj.constructor !== "function" ? "" : obj.constructor.name ? obj.constructor.name + " " : "";
        var tag = constructorTag + (stringTag || protoTag ? "[" + $join.call($concat.call([], stringTag || [], protoTag || []), ": ") + "] " : "");
        if (ys.length === 0) {
          return tag + "{}";
        }
        if (indent) {
          return tag + "{" + indentedJoin(ys, indent) + "}";
        }
        return tag + "{ " + $join.call(ys, ", ") + " }";
      }
      return String(obj);
    };
    function wrapQuotes(s, defaultStyle, opts) {
      var quoteChar = (opts.quoteStyle || defaultStyle) === "double" ? '"' : "'";
      return quoteChar + s + quoteChar;
    }
    function quote(s) {
      return $replace.call(String(s), /"/g, "&quot;");
    }
    function isArray(obj) {
      return toStr(obj) === "[object Array]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isDate(obj) {
      return toStr(obj) === "[object Date]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isRegExp(obj) {
      return toStr(obj) === "[object RegExp]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isError(obj) {
      return toStr(obj) === "[object Error]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isString(obj) {
      return toStr(obj) === "[object String]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isNumber(obj) {
      return toStr(obj) === "[object Number]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isBoolean(obj) {
      return toStr(obj) === "[object Boolean]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
    }
    function isSymbol(obj) {
      if (hasShammedSymbols) {
        return obj && typeof obj === "object" && obj instanceof Symbol;
      }
      if (typeof obj === "symbol") {
        return true;
      }
      if (!obj || typeof obj !== "object" || !symToString) {
        return false;
      }
      try {
        symToString.call(obj);
        return true;
      } catch (e) {
      }
      return false;
    }
    function isBigInt(obj) {
      if (!obj || typeof obj !== "object" || !bigIntValueOf) {
        return false;
      }
      try {
        bigIntValueOf.call(obj);
        return true;
      } catch (e) {
      }
      return false;
    }
    var hasOwn = Object.prototype.hasOwnProperty || function(key) {
      return key in this;
    };
    function has(obj, key) {
      return hasOwn.call(obj, key);
    }
    function toStr(obj) {
      return objectToString.call(obj);
    }
    function nameOf(f) {
      if (f.name) {
        return f.name;
      }
      var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
      if (m) {
        return m[1];
      }
      return null;
    }
    function indexOf(xs, x) {
      if (xs.indexOf) {
        return xs.indexOf(x);
      }
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) {
          return i;
        }
      }
      return -1;
    }
    function isMap(x) {
      if (!mapSize || !x || typeof x !== "object") {
        return false;
      }
      try {
        mapSize.call(x);
        try {
          setSize.call(x);
        } catch (s) {
          return true;
        }
        return x instanceof Map;
      } catch (e) {
      }
      return false;
    }
    function isWeakMap(x) {
      if (!weakMapHas || !x || typeof x !== "object") {
        return false;
      }
      try {
        weakMapHas.call(x, weakMapHas);
        try {
          weakSetHas.call(x, weakSetHas);
        } catch (s) {
          return true;
        }
        return x instanceof WeakMap;
      } catch (e) {
      }
      return false;
    }
    function isWeakRef(x) {
      if (!weakRefDeref || !x || typeof x !== "object") {
        return false;
      }
      try {
        weakRefDeref.call(x);
        return true;
      } catch (e) {
      }
      return false;
    }
    function isSet(x) {
      if (!setSize || !x || typeof x !== "object") {
        return false;
      }
      try {
        setSize.call(x);
        try {
          mapSize.call(x);
        } catch (m) {
          return true;
        }
        return x instanceof Set;
      } catch (e) {
      }
      return false;
    }
    function isWeakSet(x) {
      if (!weakSetHas || !x || typeof x !== "object") {
        return false;
      }
      try {
        weakSetHas.call(x, weakSetHas);
        try {
          weakMapHas.call(x, weakMapHas);
        } catch (s) {
          return true;
        }
        return x instanceof WeakSet;
      } catch (e) {
      }
      return false;
    }
    function isElement(x) {
      if (!x || typeof x !== "object") {
        return false;
      }
      if (typeof HTMLElement !== "undefined" && x instanceof HTMLElement) {
        return true;
      }
      return typeof x.nodeName === "string" && typeof x.getAttribute === "function";
    }
    function inspectString(str, opts) {
      if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = "... " + remaining + " more character" + (remaining > 1 ? "s" : "");
        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
      }
      var s = $replace.call($replace.call(str, /(['\\])/g, "\\$1"), /[\x00-\x1f]/g, lowbyte);
      return wrapQuotes(s, "single", opts);
    }
    function lowbyte(c) {
      var n = c.charCodeAt(0);
      var x = {
        8: "b",
        9: "t",
        10: "n",
        12: "f",
        13: "r"
      }[n];
      if (x) {
        return "\\" + x;
      }
      return "\\x" + (n < 16 ? "0" : "") + $toUpperCase.call(n.toString(16));
    }
    function markBoxed(str) {
      return "Object(" + str + ")";
    }
    function weakCollectionOf(type) {
      return type + " { ? }";
    }
    function collectionOf(type, size, entries2, indent) {
      var joinedEntries = indent ? indentedJoin(entries2, indent) : $join.call(entries2, ", ");
      return type + " (" + size + ") {" + joinedEntries + "}";
    }
    function singleLineValues(xs) {
      for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], "\n") >= 0) {
          return false;
        }
      }
      return true;
    }
    function getIndent(opts, depth) {
      var baseIndent;
      if (opts.indent === "	") {
        baseIndent = "	";
      } else if (typeof opts.indent === "number" && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), " ");
      } else {
        return null;
      }
      return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
      };
    }
    function indentedJoin(xs, indent) {
      if (xs.length === 0) {
        return "";
      }
      var lineJoiner = "\n" + indent.prev + indent.base;
      return lineJoiner + $join.call(xs, "," + lineJoiner) + "\n" + indent.prev;
    }
    function arrObjKeys(obj, inspect) {
      var isArr = isArray(obj);
      var xs = [];
      if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
          xs[i] = has(obj, i) ? inspect(obj[i], obj) : "";
        }
      }
      var syms = typeof gOPS === "function" ? gOPS(obj) : [];
      var symMap;
      if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
          symMap["$" + syms[k]] = syms[k];
        }
      }
      for (var key in obj) {
        if (!has(obj, key)) {
          continue;
        }
        if (isArr && String(Number(key)) === key && key < obj.length) {
          continue;
        }
        if (hasShammedSymbols && symMap["$" + key] instanceof Symbol) {
          continue;
        } else if ($test.call(/[^\w$]/, key)) {
          xs.push(inspect(key, obj) + ": " + inspect(obj[key], obj));
        } else {
          xs.push(key + ": " + inspect(obj[key], obj));
        }
      }
      if (typeof gOPS === "function") {
        for (var j = 0; j < syms.length; j++) {
          if (isEnumerable.call(obj, syms[j])) {
            xs.push("[" + inspect(syms[j]) + "]: " + inspect(obj[syms[j]], obj));
          }
        }
      }
      return xs;
    }
  }
});

// node_modules/side-channel/index.js
var require_side_channel = __commonJS({
  "node_modules/side-channel/index.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var callBound = require_callBound();
    var inspect = require_object_inspect();
    var $TypeError = GetIntrinsic("%TypeError%");
    var $WeakMap = GetIntrinsic("%WeakMap%", true);
    var $Map = GetIntrinsic("%Map%", true);
    var $weakMapGet = callBound("WeakMap.prototype.get", true);
    var $weakMapSet = callBound("WeakMap.prototype.set", true);
    var $weakMapHas = callBound("WeakMap.prototype.has", true);
    var $mapGet = callBound("Map.prototype.get", true);
    var $mapSet = callBound("Map.prototype.set", true);
    var $mapHas = callBound("Map.prototype.has", true);
    var listGetNode = function(list2, key) {
      for (var prev = list2, curr; (curr = prev.next) !== null; prev = curr) {
        if (curr.key === key) {
          prev.next = curr.next;
          curr.next = list2.next;
          list2.next = curr;
          return curr;
        }
      }
    };
    var listGet = function(objects, key) {
      var node = listGetNode(objects, key);
      return node && node.value;
    };
    var listSet = function(objects, key, value) {
      var node = listGetNode(objects, key);
      if (node) {
        node.value = value;
      } else {
        objects.next = {
          // eslint-disable-line no-param-reassign
          key,
          next: objects.next,
          value
        };
      }
    };
    var listHas = function(objects, key) {
      return !!listGetNode(objects, key);
    };
    module2.exports = function getSideChannel() {
      var $wm;
      var $m;
      var $o;
      var channel = {
        assert: function(key) {
          if (!channel.has(key)) {
            throw new $TypeError("Side channel does not contain " + inspect(key));
          }
        },
        get: function(key) {
          if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
            if ($wm) {
              return $weakMapGet($wm, key);
            }
          } else if ($Map) {
            if ($m) {
              return $mapGet($m, key);
            }
          } else {
            if ($o) {
              return listGet($o, key);
            }
          }
        },
        has: function(key) {
          if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
            if ($wm) {
              return $weakMapHas($wm, key);
            }
          } else if ($Map) {
            if ($m) {
              return $mapHas($m, key);
            }
          } else {
            if ($o) {
              return listHas($o, key);
            }
          }
          return false;
        },
        set: function(key, value) {
          if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
            if (!$wm) {
              $wm = new $WeakMap();
            }
            $weakMapSet($wm, key, value);
          } else if ($Map) {
            if (!$m) {
              $m = new $Map();
            }
            $mapSet($m, key, value);
          } else {
            if (!$o) {
              $o = { key: {}, next: null };
            }
            listSet($o, key, value);
          }
        }
      };
      return channel;
    };
  }
});

// node_modules/qs/lib/formats.js
var require_formats = __commonJS({
  "node_modules/qs/lib/formats.js"(exports2, module2) {
    "use strict";
    var replace = String.prototype.replace;
    var percentTwenties = /%20/g;
    var Format = {
      RFC1738: "RFC1738",
      RFC3986: "RFC3986"
    };
    module2.exports = {
      "default": Format.RFC3986,
      formatters: {
        RFC1738: function(value) {
          return replace.call(value, percentTwenties, "+");
        },
        RFC3986: function(value) {
          return String(value);
        }
      },
      RFC1738: Format.RFC1738,
      RFC3986: Format.RFC3986
    };
  }
});

// node_modules/qs/lib/utils.js
var require_utils = __commonJS({
  "node_modules/qs/lib/utils.js"(exports2, module2) {
    "use strict";
    var formats = require_formats();
    var has = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;
    var hexTable = function() {
      var array = [];
      for (var i = 0; i < 256; ++i) {
        array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
      }
      return array;
    }();
    var compactQueue = function compactQueue2(queue) {
      while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];
        if (isArray(obj)) {
          var compacted = [];
          for (var j = 0; j < obj.length; ++j) {
            if (typeof obj[j] !== "undefined") {
              compacted.push(obj[j]);
            }
          }
          item.obj[item.prop] = compacted;
        }
      }
    };
    var arrayToObject = function arrayToObject2(source, options) {
      var obj = options && options.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
      for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== "undefined") {
          obj[i] = source[i];
        }
      }
      return obj;
    };
    var merge = function merge2(target, source, options) {
      if (!source) {
        return target;
      }
      if (typeof source !== "object") {
        if (isArray(target)) {
          target.push(source);
        } else if (target && typeof target === "object") {
          if (options && (options.plainObjects || options.allowPrototypes) || !has.call(Object.prototype, source)) {
            target[source] = true;
          }
        } else {
          return [target, source];
        }
        return target;
      }
      if (!target || typeof target !== "object") {
        return [target].concat(source);
      }
      var mergeTarget = target;
      if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
      }
      if (isArray(target) && isArray(source)) {
        source.forEach(function(item, i) {
          if (has.call(target, i)) {
            var targetItem = target[i];
            if (targetItem && typeof targetItem === "object" && item && typeof item === "object") {
              target[i] = merge2(targetItem, item, options);
            } else {
              target.push(item);
            }
          } else {
            target[i] = item;
          }
        });
        return target;
      }
      return Object.keys(source).reduce(function(acc, key) {
        var value = source[key];
        if (has.call(acc, key)) {
          acc[key] = merge2(acc[key], value, options);
        } else {
          acc[key] = value;
        }
        return acc;
      }, mergeTarget);
    };
    var assign = function assignSingleSource(target, source) {
      return Object.keys(source).reduce(function(acc, key) {
        acc[key] = source[key];
        return acc;
      }, target);
    };
    var decode = function(str, decoder, charset) {
      var strWithoutPlus = str.replace(/\+/g, " ");
      if (charset === "iso-8859-1") {
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
      }
      try {
        return decodeURIComponent(strWithoutPlus);
      } catch (e) {
        return strWithoutPlus;
      }
    };
    var encode = function encode2(str, defaultEncoder, charset, kind, format) {
      if (str.length === 0) {
        return str;
      }
      var string2 = str;
      if (typeof str === "symbol") {
        string2 = Symbol.prototype.toString.call(str);
      } else if (typeof str !== "string") {
        string2 = String(str);
      }
      if (charset === "iso-8859-1") {
        return escape(string2).replace(/%u[0-9a-f]{4}/gi, function($0) {
          return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
        });
      }
      var out = "";
      for (var i = 0; i < string2.length; ++i) {
        var c = string2.charCodeAt(i);
        if (c === 45 || c === 46 || c === 95 || c === 126 || c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || format === formats.RFC1738 && (c === 40 || c === 41)) {
          out += string2.charAt(i);
          continue;
        }
        if (c < 128) {
          out = out + hexTable[c];
          continue;
        }
        if (c < 2048) {
          out = out + (hexTable[192 | c >> 6] + hexTable[128 | c & 63]);
          continue;
        }
        if (c < 55296 || c >= 57344) {
          out = out + (hexTable[224 | c >> 12] + hexTable[128 | c >> 6 & 63] + hexTable[128 | c & 63]);
          continue;
        }
        i += 1;
        c = 65536 + ((c & 1023) << 10 | string2.charCodeAt(i) & 1023);
        out += hexTable[240 | c >> 18] + hexTable[128 | c >> 12 & 63] + hexTable[128 | c >> 6 & 63] + hexTable[128 | c & 63];
      }
      return out;
    };
    var compact = function compact2(value) {
      var queue = [{ obj: { o: value }, prop: "o" }];
      var refs = [];
      for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];
        var keys2 = Object.keys(obj);
        for (var j = 0; j < keys2.length; ++j) {
          var key = keys2[j];
          var val = obj[key];
          if (typeof val === "object" && val !== null && refs.indexOf(val) === -1) {
            queue.push({ obj, prop: key });
            refs.push(val);
          }
        }
      }
      compactQueue(queue);
      return value;
    };
    var isRegExp = function isRegExp2(obj) {
      return Object.prototype.toString.call(obj) === "[object RegExp]";
    };
    var isBuffer = function isBuffer2(obj) {
      if (!obj || typeof obj !== "object") {
        return false;
      }
      return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
    };
    var combine = function combine2(a, b) {
      return [].concat(a, b);
    };
    var maybeMap = function maybeMap2(val, fn) {
      if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
          mapped.push(fn(val[i]));
        }
        return mapped;
      }
      return fn(val);
    };
    module2.exports = {
      arrayToObject,
      assign,
      combine,
      compact,
      decode,
      encode,
      isBuffer,
      isRegExp,
      maybeMap,
      merge
    };
  }
});

// node_modules/qs/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/qs/lib/stringify.js"(exports2, module2) {
    "use strict";
    var getSideChannel = require_side_channel();
    var utils = require_utils();
    var formats = require_formats();
    var has = Object.prototype.hasOwnProperty;
    var arrayPrefixGenerators = {
      brackets: function brackets(prefix) {
        return prefix + "[]";
      },
      comma: "comma",
      indices: function indices(prefix, key) {
        return prefix + "[" + key + "]";
      },
      repeat: function repeat(prefix) {
        return prefix;
      }
    };
    var isArray = Array.isArray;
    var push = Array.prototype.push;
    var pushToArray = function(arr, valueOrArray) {
      push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
    };
    var toISO = Date.prototype.toISOString;
    var defaultFormat = formats["default"];
    var defaults = {
      addQueryPrefix: false,
      allowDots: false,
      charset: "utf-8",
      charsetSentinel: false,
      delimiter: "&",
      encode: true,
      encoder: utils.encode,
      encodeValuesOnly: false,
      format: defaultFormat,
      formatter: formats.formatters[defaultFormat],
      // deprecated
      indices: false,
      serializeDate: function serializeDate(date2) {
        return toISO.call(date2);
      },
      skipNulls: false,
      strictNullHandling: false
    };
    var isNonNullishPrimitive = function isNonNullishPrimitive2(v) {
      return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
    };
    var sentinel = {};
    var stringify = function stringify2(object2, prefix, generateArrayPrefix, commaRoundTrip, strictNullHandling, skipNulls, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
      var obj = object2;
      var tmpSc = sideChannel;
      var step = 0;
      var findFlag = false;
      while ((tmpSc = tmpSc.get(sentinel)) !== void 0 && !findFlag) {
        var pos = tmpSc.get(object2);
        step += 1;
        if (typeof pos !== "undefined") {
          if (pos === step) {
            throw new RangeError("Cyclic object value");
          } else {
            findFlag = true;
          }
        }
        if (typeof tmpSc.get(sentinel) === "undefined") {
          step = 0;
        }
      }
      if (typeof filter === "function") {
        obj = filter(prefix, obj);
      } else if (obj instanceof Date) {
        obj = serializeDate(obj);
      } else if (generateArrayPrefix === "comma" && isArray(obj)) {
        obj = utils.maybeMap(obj, function(value2) {
          if (value2 instanceof Date) {
            return serializeDate(value2);
          }
          return value2;
        });
      }
      if (obj === null) {
        if (strictNullHandling) {
          return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, "key", format) : prefix;
        }
        obj = "";
      }
      if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
          var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, "key", format);
          return [formatter(keyValue) + "=" + formatter(encoder(obj, defaults.encoder, charset, "value", format))];
        }
        return [formatter(prefix) + "=" + formatter(String(obj))];
      }
      var values = [];
      if (typeof obj === "undefined") {
        return values;
      }
      var objKeys;
      if (generateArrayPrefix === "comma" && isArray(obj)) {
        if (encodeValuesOnly && encoder) {
          obj = utils.maybeMap(obj, encoder);
        }
        objKeys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
      } else if (isArray(filter)) {
        objKeys = filter;
      } else {
        var keys2 = Object.keys(obj);
        objKeys = sort ? keys2.sort(sort) : keys2;
      }
      var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? prefix + "[]" : prefix;
      for (var j = 0; j < objKeys.length; ++j) {
        var key = objKeys[j];
        var value = typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key];
        if (skipNulls && value === null) {
          continue;
        }
        var keyPrefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix : adjustedPrefix + (allowDots ? "." + key : "[" + key + "]");
        sideChannel.set(object2, step);
        var valueSideChannel = getSideChannel();
        valueSideChannel.set(sentinel, sideChannel);
        pushToArray(values, stringify2(
          value,
          keyPrefix,
          generateArrayPrefix,
          commaRoundTrip,
          strictNullHandling,
          skipNulls,
          generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder,
          filter,
          sort,
          allowDots,
          serializeDate,
          format,
          formatter,
          encodeValuesOnly,
          charset,
          valueSideChannel
        ));
      }
      return values;
    };
    var normalizeStringifyOptions = function normalizeStringifyOptions2(opts) {
      if (!opts) {
        return defaults;
      }
      if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
        throw new TypeError("Encoder has to be a function.");
      }
      var charset = opts.charset || defaults.charset;
      if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
        throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
      }
      var format = formats["default"];
      if (typeof opts.format !== "undefined") {
        if (!has.call(formats.formatters, opts.format)) {
          throw new TypeError("Unknown format option provided.");
        }
        format = opts.format;
      }
      var formatter = formats.formatters[format];
      var filter = defaults.filter;
      if (typeof opts.filter === "function" || isArray(opts.filter)) {
        filter = opts.filter;
      }
      return {
        addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === "undefined" ? defaults.allowDots : !!opts.allowDots,
        charset,
        charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter,
        format,
        formatter,
        serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === "function" ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
      };
    };
    module2.exports = function(object2, opts) {
      var obj = object2;
      var options = normalizeStringifyOptions(opts);
      var objKeys;
      var filter;
      if (typeof options.filter === "function") {
        filter = options.filter;
        obj = filter("", obj);
      } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
      }
      var keys2 = [];
      if (typeof obj !== "object" || obj === null) {
        return "";
      }
      var arrayFormat;
      if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
      } else if (opts && "indices" in opts) {
        arrayFormat = opts.indices ? "indices" : "repeat";
      } else {
        arrayFormat = "indices";
      }
      var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
      if (opts && "commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
        throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
      }
      var commaRoundTrip = generateArrayPrefix === "comma" && opts && opts.commaRoundTrip;
      if (!objKeys) {
        objKeys = Object.keys(obj);
      }
      if (options.sort) {
        objKeys.sort(options.sort);
      }
      var sideChannel = getSideChannel();
      for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];
        if (options.skipNulls && obj[key] === null) {
          continue;
        }
        pushToArray(keys2, stringify(
          obj[key],
          key,
          generateArrayPrefix,
          commaRoundTrip,
          options.strictNullHandling,
          options.skipNulls,
          options.encode ? options.encoder : null,
          options.filter,
          options.sort,
          options.allowDots,
          options.serializeDate,
          options.format,
          options.formatter,
          options.encodeValuesOnly,
          options.charset,
          sideChannel
        ));
      }
      var joined = keys2.join(options.delimiter);
      var prefix = options.addQueryPrefix === true ? "?" : "";
      if (options.charsetSentinel) {
        if (options.charset === "iso-8859-1") {
          prefix += "utf8=%26%2310003%3B&";
        } else {
          prefix += "utf8=%E2%9C%93&";
        }
      }
      return joined.length > 0 ? prefix + joined : "";
    };
  }
});

// node_modules/qs/lib/parse.js
var require_parse = __commonJS({
  "node_modules/qs/lib/parse.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var has = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;
    var defaults = {
      allowDots: false,
      allowPrototypes: false,
      allowSparse: false,
      arrayLimit: 20,
      charset: "utf-8",
      charsetSentinel: false,
      comma: false,
      decoder: utils.decode,
      delimiter: "&",
      depth: 5,
      ignoreQueryPrefix: false,
      interpretNumericEntities: false,
      parameterLimit: 1e3,
      parseArrays: true,
      plainObjects: false,
      strictNullHandling: false
    };
    var interpretNumericEntities = function(str) {
      return str.replace(/&#(\d+);/g, function($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
      });
    };
    var parseArrayValue = function(val, options) {
      if (val && typeof val === "string" && options.comma && val.indexOf(",") > -1) {
        return val.split(",");
      }
      return val;
    };
    var isoSentinel = "utf8=%26%2310003%3B";
    var charsetSentinel = "utf8=%E2%9C%93";
    var parseValues = function parseQueryStringValues(str, options) {
      var obj = { __proto__: null };
      var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, "") : str;
      var limit = options.parameterLimit === Infinity ? void 0 : options.parameterLimit;
      var parts = cleanStr.split(options.delimiter, limit);
      var skipIndex = -1;
      var i;
      var charset = options.charset;
      if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
          if (parts[i].indexOf("utf8=") === 0) {
            if (parts[i] === charsetSentinel) {
              charset = "utf-8";
            } else if (parts[i] === isoSentinel) {
              charset = "iso-8859-1";
            }
            skipIndex = i;
            i = parts.length;
          }
        }
      }
      for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
          continue;
        }
        var part = parts[i];
        var bracketEqualsPos = part.indexOf("]=");
        var pos = bracketEqualsPos === -1 ? part.indexOf("=") : bracketEqualsPos + 1;
        var key, val;
        if (pos === -1) {
          key = options.decoder(part, defaults.decoder, charset, "key");
          val = options.strictNullHandling ? null : "";
        } else {
          key = options.decoder(part.slice(0, pos), defaults.decoder, charset, "key");
          val = utils.maybeMap(
            parseArrayValue(part.slice(pos + 1), options),
            function(encodedVal) {
              return options.decoder(encodedVal, defaults.decoder, charset, "value");
            }
          );
        }
        if (val && options.interpretNumericEntities && charset === "iso-8859-1") {
          val = interpretNumericEntities(val);
        }
        if (part.indexOf("[]=") > -1) {
          val = isArray(val) ? [val] : val;
        }
        if (has.call(obj, key)) {
          obj[key] = utils.combine(obj[key], val);
        } else {
          obj[key] = val;
        }
      }
      return obj;
    };
    var parseObject = function(chain, val, options, valuesParsed) {
      var leaf = valuesParsed ? val : parseArrayValue(val, options);
      for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];
        if (root === "[]" && options.parseArrays) {
          obj = [].concat(leaf);
        } else {
          obj = options.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
          var cleanRoot = root.charAt(0) === "[" && root.charAt(root.length - 1) === "]" ? root.slice(1, -1) : root;
          var index = parseInt(cleanRoot, 10);
          if (!options.parseArrays && cleanRoot === "") {
            obj = { 0: leaf };
          } else if (!isNaN(index) && root !== cleanRoot && String(index) === cleanRoot && index >= 0 && (options.parseArrays && index <= options.arrayLimit)) {
            obj = [];
            obj[index] = leaf;
          } else if (cleanRoot !== "__proto__") {
            obj[cleanRoot] = leaf;
          }
        }
        leaf = obj;
      }
      return leaf;
    };
    var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
      if (!givenKey) {
        return;
      }
      var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, "[$1]") : givenKey;
      var brackets = /(\[[^[\]]*])/;
      var child = /(\[[^[\]]*])/g;
      var segment = options.depth > 0 && brackets.exec(key);
      var parent = segment ? key.slice(0, segment.index) : key;
      var keys2 = [];
      if (parent) {
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
          if (!options.allowPrototypes) {
            return;
          }
        }
        keys2.push(parent);
      }
      var i = 0;
      while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
          if (!options.allowPrototypes) {
            return;
          }
        }
        keys2.push(segment[1]);
      }
      if (segment) {
        keys2.push("[" + key.slice(segment.index) + "]");
      }
      return parseObject(keys2, val, options, valuesParsed);
    };
    var normalizeParseOptions = function normalizeParseOptions2(opts) {
      if (!opts) {
        return defaults;
      }
      if (opts.decoder !== null && opts.decoder !== void 0 && typeof opts.decoder !== "function") {
        throw new TypeError("Decoder has to be a function.");
      }
      if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
        throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
      }
      var charset = typeof opts.charset === "undefined" ? defaults.charset : opts.charset;
      return {
        allowDots: typeof opts.allowDots === "undefined" ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === "boolean" ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === "boolean" ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === "number" ? opts.arrayLimit : defaults.arrayLimit,
        charset,
        charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === "boolean" ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === "function" ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === "string" || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: typeof opts.depth === "number" || opts.depth === false ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === "boolean" ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === "number" ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === "boolean" ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
      };
    };
    module2.exports = function(str, opts) {
      var options = normalizeParseOptions(opts);
      if (str === "" || str === null || typeof str === "undefined") {
        return options.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
      }
      var tempObj = typeof str === "string" ? parseValues(str, options) : str;
      var obj = options.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
      var keys2 = Object.keys(tempObj);
      for (var i = 0; i < keys2.length; ++i) {
        var key = keys2[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === "string");
        obj = utils.merge(obj, newObj, options);
      }
      if (options.allowSparse === true) {
        return obj;
      }
      return utils.compact(obj);
    };
  }
});

// node_modules/qs/lib/index.js
var require_lib = __commonJS({
  "node_modules/qs/lib/index.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var parse = require_parse();
    var formats = require_formats();
    module2.exports = {
      formats,
      parse,
      stringify
    };
  }
});

// src/core/fetcher/Fetcher.ts
var import_form_data, import_qs;
var init_Fetcher = __esm({
  "src/core/fetcher/Fetcher.ts"() {
    "use strict";
    import_form_data = __toESM(require_form_data());
    import_qs = __toESM(require_lib());
    if (typeof window === "undefined") {
      global.fetch = require("node-fetch");
    }
  }
});

// src/core/fetcher/getHeader.ts
var init_getHeader = __esm({
  "src/core/fetcher/getHeader.ts"() {
    "use strict";
  }
});

// src/core/fetcher/Supplier.ts
var init_Supplier = __esm({
  "src/core/fetcher/Supplier.ts"() {
    "use strict";
  }
});

// src/core/fetcher/index.ts
var init_fetcher = __esm({
  "src/core/fetcher/index.ts"() {
    "use strict";
    init_Fetcher();
    init_getHeader();
    init_Supplier();
  }
});

// src/core/auth/BasicAuth.ts
var init_BasicAuth = __esm({
  "src/core/auth/BasicAuth.ts"() {
    "use strict";
  }
});

// src/core/auth/BearerToken.ts
var init_BearerToken = __esm({
  "src/core/auth/BearerToken.ts"() {
    "use strict";
  }
});

// src/core/auth/index.ts
var init_auth = __esm({
  "src/core/auth/index.ts"() {
    "use strict";
    init_BasicAuth();
    init_BearerToken();
  }
});

// src/core/schemas/Schema.ts
var SchemaType;
var init_Schema = __esm({
  "src/core/schemas/Schema.ts"() {
    "use strict";
    SchemaType = {
      DATE: "date",
      ENUM: "enum",
      LIST: "list",
      STRING_LITERAL: "stringLiteral",
      BOOLEAN_LITERAL: "booleanLiteral",
      OBJECT: "object",
      ANY: "any",
      BOOLEAN: "boolean",
      NUMBER: "number",
      STRING: "string",
      UNKNOWN: "unknown",
      RECORD: "record",
      SET: "set",
      UNION: "union",
      UNDISCRIMINATED_UNION: "undiscriminatedUnion",
      OPTIONAL: "optional"
    };
  }
});

// src/core/schemas/utils/getErrorMessageForIncorrectType.ts
function getErrorMessageForIncorrectType(value, expectedType) {
  return `Expected ${expectedType}. Received ${getTypeAsString(value)}.`;
}
function getTypeAsString(value) {
  if (Array.isArray(value)) {
    return "list";
  }
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "string":
      return `"${value}"`;
    case "number":
    case "boolean":
    case "undefined":
      return `${value}`;
  }
  return typeof value;
}
var init_getErrorMessageForIncorrectType = __esm({
  "src/core/schemas/utils/getErrorMessageForIncorrectType.ts"() {
    "use strict";
  }
});

// src/core/schemas/utils/maybeSkipValidation.ts
function maybeSkipValidation(schema) {
  return {
    ...schema,
    json: transformAndMaybeSkipValidation(schema.json),
    parse: transformAndMaybeSkipValidation(schema.parse)
  };
}
function transformAndMaybeSkipValidation(transform2) {
  return async (value, opts) => {
    const transformed = await transform2(value, opts);
    const { skipValidation = false } = opts ?? {};
    if (!transformed.ok && skipValidation) {
      console.warn(
        [
          "Failed to validate.",
          ...transformed.errors.map(
            (error) => "  - " + (error.path.length > 0 ? `${error.path.join(".")}: ${error.message}` : error.message)
          )
        ].join("\n")
      );
      return {
        ok: true,
        value
      };
    } else {
      return transformed;
    }
  };
}
var init_maybeSkipValidation = __esm({
  "src/core/schemas/utils/maybeSkipValidation.ts"() {
    "use strict";
  }
});

// src/core/schemas/builders/schema-utils/stringifyValidationErrors.ts
function stringifyValidationError(error) {
  if (error.path.length === 0) {
    return error.message;
  }
  return `${error.path.join(" -> ")}: ${error.message}`;
}
var init_stringifyValidationErrors = __esm({
  "src/core/schemas/builders/schema-utils/stringifyValidationErrors.ts"() {
    "use strict";
  }
});

// src/core/schemas/builders/schema-utils/JsonError.ts
var JsonError;
var init_JsonError = __esm({
  "src/core/schemas/builders/schema-utils/JsonError.ts"() {
    "use strict";
    init_stringifyValidationErrors();
    JsonError = class _JsonError extends Error {
      constructor(errors) {
        super(errors.map(stringifyValidationError).join("; "));
        this.errors = errors;
        Object.setPrototypeOf(this, _JsonError.prototype);
      }
    };
  }
});

// src/core/schemas/builders/schema-utils/ParseError.ts
var ParseError;
var init_ParseError = __esm({
  "src/core/schemas/builders/schema-utils/ParseError.ts"() {
    "use strict";
    init_stringifyValidationErrors();
    ParseError = class _ParseError extends Error {
      constructor(errors) {
        super(errors.map(stringifyValidationError).join("; "));
        this.errors = errors;
        Object.setPrototypeOf(this, _ParseError.prototype);
      }
    };
  }
});

// src/core/schemas/builders/schema-utils/getSchemaUtils.ts
function getSchemaUtils(schema) {
  return {
    optional: () => optional(schema),
    transform: (transformer) => transform(schema, transformer),
    parseOrThrow: async (raw, opts) => {
      const parsed = await schema.parse(raw, opts);
      if (parsed.ok) {
        return parsed.value;
      }
      throw new ParseError(parsed.errors);
    },
    jsonOrThrow: async (parsed, opts) => {
      const raw = await schema.json(parsed, opts);
      if (raw.ok) {
        return raw.value;
      }
      throw new JsonError(raw.errors);
    }
  };
}
function optional(schema) {
  const baseSchema = {
    parse: (raw, opts) => {
      if (raw == null) {
        return {
          ok: true,
          value: void 0
        };
      }
      return schema.parse(raw, opts);
    },
    json: (parsed, opts) => {
      if (parsed == null) {
        return {
          ok: true,
          value: null
        };
      }
      return schema.json(parsed, opts);
    },
    getType: () => SchemaType.OPTIONAL
  };
  return {
    ...baseSchema,
    ...getSchemaUtils(baseSchema)
  };
}
function transform(schema, transformer) {
  const baseSchema = {
    parse: async (raw, opts) => {
      const parsed = await schema.parse(raw, opts);
      if (!parsed.ok) {
        return parsed;
      }
      return {
        ok: true,
        value: transformer.transform(parsed.value)
      };
    },
    json: async (transformed, opts) => {
      const parsed = await transformer.untransform(transformed);
      return schema.json(parsed, opts);
    },
    getType: () => schema.getType()
  };
  return {
    ...baseSchema,
    ...getSchemaUtils(baseSchema)
  };
}
var init_getSchemaUtils = __esm({
  "src/core/schemas/builders/schema-utils/getSchemaUtils.ts"() {
    "use strict";
    init_Schema();
    init_JsonError();
    init_ParseError();
  }
});

// src/core/schemas/builders/schema-utils/index.ts
var init_schema_utils = __esm({
  "src/core/schemas/builders/schema-utils/index.ts"() {
    "use strict";
    init_getSchemaUtils();
    init_JsonError();
    init_ParseError();
  }
});

// src/core/schemas/builders/date/date.ts
function date() {
  const baseSchema = {
    parse: (raw, { breadcrumbsPrefix = [] } = {}) => {
      if (typeof raw !== "string") {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(raw, "string")
            }
          ]
        };
      }
      if (!ISO_8601_REGEX.test(raw)) {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(raw, "ISO 8601 date string")
            }
          ]
        };
      }
      return {
        ok: true,
        value: new Date(raw)
      };
    },
    json: (date2, { breadcrumbsPrefix = [] } = {}) => {
      if (date2 instanceof Date) {
        return {
          ok: true,
          value: date2.toISOString()
        };
      } else {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(date2, "Date object")
            }
          ]
        };
      }
    },
    getType: () => SchemaType.DATE
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema)
  };
}
var ISO_8601_REGEX;
var init_date = __esm({
  "src/core/schemas/builders/date/date.ts"() {
    "use strict";
    init_Schema();
    init_getErrorMessageForIncorrectType();
    init_maybeSkipValidation();
    init_schema_utils();
    ISO_8601_REGEX = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
  }
});

// src/core/schemas/builders/date/index.ts
var init_date2 = __esm({
  "src/core/schemas/builders/date/index.ts"() {
    "use strict";
    init_date();
  }
});

// src/core/schemas/utils/createIdentitySchemaCreator.ts
function createIdentitySchemaCreator(schemaType, validate) {
  return () => {
    const baseSchema = {
      parse: validate,
      json: validate,
      getType: () => schemaType
    };
    return {
      ...maybeSkipValidation(baseSchema),
      ...getSchemaUtils(baseSchema)
    };
  };
}
var init_createIdentitySchemaCreator = __esm({
  "src/core/schemas/utils/createIdentitySchemaCreator.ts"() {
    "use strict";
    init_schema_utils();
    init_maybeSkipValidation();
  }
});

// src/core/schemas/builders/enum/enum.ts
function enum_(values) {
  const validValues = new Set(values);
  const schemaCreator = createIdentitySchemaCreator(
    SchemaType.ENUM,
    (value, { allowUnrecognizedEnumValues, breadcrumbsPrefix = [] } = {}) => {
      if (typeof value !== "string") {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(value, "string")
            }
          ]
        };
      }
      if (!validValues.has(value) && !allowUnrecognizedEnumValues) {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(value, "enum")
            }
          ]
        };
      }
      return {
        ok: true,
        value
      };
    }
  );
  return schemaCreator();
}
var init_enum = __esm({
  "src/core/schemas/builders/enum/enum.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    init_getErrorMessageForIncorrectType();
  }
});

// src/core/schemas/builders/enum/index.ts
var init_enum2 = __esm({
  "src/core/schemas/builders/enum/index.ts"() {
    "use strict";
    init_enum();
  }
});

// src/core/schemas/builders/lazy/lazy.ts
function lazy(getter) {
  const baseSchema = constructLazyBaseSchema(getter);
  return {
    ...baseSchema,
    ...getSchemaUtils(baseSchema)
  };
}
function constructLazyBaseSchema(getter) {
  return {
    parse: async (raw, opts) => (await getMemoizedSchema(getter)).parse(raw, opts),
    json: async (parsed, opts) => (await getMemoizedSchema(getter)).json(parsed, opts),
    getType: async () => (await getMemoizedSchema(getter)).getType()
  };
}
async function getMemoizedSchema(getter) {
  const castedGetter = getter;
  if (castedGetter.__zurg_memoized == null) {
    castedGetter.__zurg_memoized = await getter();
  }
  return castedGetter.__zurg_memoized;
}
var init_lazy = __esm({
  "src/core/schemas/builders/lazy/lazy.ts"() {
    "use strict";
    init_schema_utils();
  }
});

// src/core/schemas/utils/entries.ts
function entries(object2) {
  return Object.entries(object2);
}
var init_entries = __esm({
  "src/core/schemas/utils/entries.ts"() {
    "use strict";
  }
});

// src/core/schemas/utils/filterObject.ts
function filterObject(obj, keysToInclude) {
  const keysToIncludeSet = new Set(keysToInclude);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (keysToIncludeSet.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
var init_filterObject = __esm({
  "src/core/schemas/utils/filterObject.ts"() {
    "use strict";
  }
});

// src/core/schemas/utils/isPlainObject.ts
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (Object.getPrototypeOf(value) === null) {
    return true;
  }
  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(value) === proto;
}
var init_isPlainObject = __esm({
  "src/core/schemas/utils/isPlainObject.ts"() {
    "use strict";
  }
});

// src/core/schemas/utils/keys.ts
function keys(object2) {
  return Object.keys(object2);
}
var init_keys = __esm({
  "src/core/schemas/utils/keys.ts"() {
    "use strict";
  }
});

// src/core/schemas/utils/partition.ts
function partition(items, predicate) {
  const trueItems = [], falseItems = [];
  for (const item of items) {
    if (predicate(item)) {
      trueItems.push(item);
    } else {
      falseItems.push(item);
    }
  }
  return [trueItems, falseItems];
}
var init_partition = __esm({
  "src/core/schemas/utils/partition.ts"() {
    "use strict";
  }
});

// src/core/schemas/builders/object-like/getObjectLikeUtils.ts
function getObjectLikeUtils(schema) {
  return {
    withParsedProperties: (properties) => withParsedProperties(schema, properties)
  };
}
function withParsedProperties(objectLike, properties) {
  const objectSchema = {
    parse: async (raw, opts) => {
      const parsedObject = await objectLike.parse(raw, opts);
      if (!parsedObject.ok) {
        return parsedObject;
      }
      const additionalProperties = Object.entries(properties).reduce(
        (processed, [key, value]) => {
          return {
            ...processed,
            [key]: typeof value === "function" ? value(parsedObject.value) : value
          };
        },
        {}
      );
      return {
        ok: true,
        value: {
          ...parsedObject.value,
          ...additionalProperties
        }
      };
    },
    json: (parsed, opts) => {
      if (!isPlainObject(parsed)) {
        return {
          ok: false,
          errors: [
            {
              path: (opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [],
              message: getErrorMessageForIncorrectType(parsed, "object")
            }
          ]
        };
      }
      const addedPropertyKeys = new Set(Object.keys(properties));
      const parsedWithoutAddedProperties = filterObject(
        parsed,
        Object.keys(parsed).filter((key) => !addedPropertyKeys.has(key))
      );
      return objectLike.json(parsedWithoutAddedProperties, opts);
    },
    getType: () => objectLike.getType()
  };
  return {
    ...objectSchema,
    ...getSchemaUtils(objectSchema),
    ...getObjectLikeUtils(objectSchema)
  };
}
var init_getObjectLikeUtils = __esm({
  "src/core/schemas/builders/object-like/getObjectLikeUtils.ts"() {
    "use strict";
    init_filterObject();
    init_getErrorMessageForIncorrectType();
    init_isPlainObject();
    init_schema_utils();
  }
});

// src/core/schemas/builders/object-like/index.ts
var init_object_like = __esm({
  "src/core/schemas/builders/object-like/index.ts"() {
    "use strict";
    init_getObjectLikeUtils();
  }
});

// src/core/schemas/builders/object/property.ts
function property(rawKey, valueSchema) {
  return {
    rawKey,
    valueSchema,
    isProperty: true
  };
}
function isProperty(maybeProperty) {
  return maybeProperty.isProperty;
}
var init_property = __esm({
  "src/core/schemas/builders/object/property.ts"() {
    "use strict";
  }
});

// src/core/schemas/builders/object/object.ts
function object(schemas) {
  const baseSchema = {
    _getRawProperties: () => Promise.resolve(
      Object.entries(schemas).map(
        ([parsedKey, propertySchema]) => isProperty(propertySchema) ? propertySchema.rawKey : parsedKey
      )
    ),
    _getParsedProperties: () => Promise.resolve(keys(schemas)),
    parse: async (raw, opts) => {
      const rawKeyToProperty = {};
      const requiredKeys = [];
      for (const [parsedKey, schemaOrObjectProperty] of entries(schemas)) {
        const rawKey = isProperty(schemaOrObjectProperty) ? schemaOrObjectProperty.rawKey : parsedKey;
        const valueSchema = isProperty(schemaOrObjectProperty) ? schemaOrObjectProperty.valueSchema : schemaOrObjectProperty;
        const property2 = {
          rawKey,
          parsedKey,
          valueSchema
        };
        rawKeyToProperty[rawKey] = property2;
        if (await isSchemaRequired(valueSchema)) {
          requiredKeys.push(rawKey);
        }
      }
      return validateAndTransformObject({
        value: raw,
        requiredKeys,
        getProperty: (rawKey) => {
          const property2 = rawKeyToProperty[rawKey];
          if (property2 == null) {
            return void 0;
          }
          return {
            transformedKey: property2.parsedKey,
            transform: (propertyValue) => property2.valueSchema.parse(propertyValue, {
              ...opts,
              breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], rawKey]
            })
          };
        },
        unrecognizedObjectKeys: opts == null ? void 0 : opts.unrecognizedObjectKeys,
        skipValidation: opts == null ? void 0 : opts.skipValidation,
        breadcrumbsPrefix: opts == null ? void 0 : opts.breadcrumbsPrefix
      });
    },
    json: async (parsed, opts) => {
      const requiredKeys = [];
      for (const [parsedKey, schemaOrObjectProperty] of entries(schemas)) {
        const valueSchema = isProperty(schemaOrObjectProperty) ? schemaOrObjectProperty.valueSchema : schemaOrObjectProperty;
        if (await isSchemaRequired(valueSchema)) {
          requiredKeys.push(parsedKey);
        }
      }
      return validateAndTransformObject({
        value: parsed,
        requiredKeys,
        getProperty: (parsedKey) => {
          const property2 = schemas[parsedKey];
          if (property2 == null) {
            return void 0;
          }
          if (isProperty(property2)) {
            return {
              transformedKey: property2.rawKey,
              transform: (propertyValue) => property2.valueSchema.json(propertyValue, {
                ...opts,
                breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], parsedKey]
              })
            };
          } else {
            return {
              transformedKey: parsedKey,
              transform: (propertyValue) => property2.json(propertyValue, {
                ...opts,
                breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], parsedKey]
              })
            };
          }
        },
        unrecognizedObjectKeys: opts == null ? void 0 : opts.unrecognizedObjectKeys,
        skipValidation: opts == null ? void 0 : opts.skipValidation,
        breadcrumbsPrefix: opts == null ? void 0 : opts.breadcrumbsPrefix
      });
    },
    getType: () => SchemaType.OBJECT
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema),
    ...getObjectLikeUtils(baseSchema),
    ...getObjectUtils(baseSchema)
  };
}
async function validateAndTransformObject({
  value,
  requiredKeys,
  getProperty,
  unrecognizedObjectKeys = "fail",
  skipValidation = false,
  breadcrumbsPrefix = []
}) {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      errors: [
        {
          path: breadcrumbsPrefix,
          message: getErrorMessageForIncorrectType(value, "object")
        }
      ]
    };
  }
  const missingRequiredKeys = new Set(requiredKeys);
  const errors = [];
  const transformed = {};
  for (const [preTransformedKey, preTransformedItemValue] of Object.entries(value)) {
    const property2 = getProperty(preTransformedKey);
    if (property2 != null) {
      missingRequiredKeys.delete(preTransformedKey);
      const value2 = await property2.transform(preTransformedItemValue);
      if (value2.ok) {
        transformed[property2.transformedKey] = value2.value;
      } else {
        transformed[preTransformedKey] = preTransformedItemValue;
        errors.push(...value2.errors);
      }
    } else {
      switch (unrecognizedObjectKeys) {
        case "fail":
          errors.push({
            path: [...breadcrumbsPrefix, preTransformedKey],
            message: `Unexpected key "${preTransformedKey}"`
          });
          break;
        case "strip":
          break;
        case "passthrough":
          transformed[preTransformedKey] = preTransformedItemValue;
          break;
      }
    }
  }
  errors.push(
    ...requiredKeys.filter((key) => missingRequiredKeys.has(key)).map((key) => ({
      path: breadcrumbsPrefix,
      message: `Missing required key "${key}"`
    }))
  );
  if (errors.length === 0 || skipValidation) {
    return {
      ok: true,
      value: transformed
    };
  } else {
    return {
      ok: false,
      errors
    };
  }
}
function getObjectUtils(schema) {
  return {
    extend: (extension) => {
      const baseSchema = {
        _getParsedProperties: async () => [
          ...await schema._getParsedProperties(),
          ...await extension._getParsedProperties()
        ],
        _getRawProperties: async () => [
          ...await schema._getRawProperties(),
          ...await extension._getRawProperties()
        ],
        parse: async (raw, opts) => {
          return validateAndTransformExtendedObject({
            extensionKeys: await extension._getRawProperties(),
            value: raw,
            transformBase: (rawBase) => schema.parse(rawBase, opts),
            transformExtension: (rawExtension) => extension.parse(rawExtension, opts)
          });
        },
        json: async (parsed, opts) => {
          return validateAndTransformExtendedObject({
            extensionKeys: await extension._getParsedProperties(),
            value: parsed,
            transformBase: (parsedBase) => schema.json(parsedBase, opts),
            transformExtension: (parsedExtension) => extension.json(parsedExtension, opts)
          });
        },
        getType: () => SchemaType.OBJECT
      };
      return {
        ...baseSchema,
        ...getSchemaUtils(baseSchema),
        ...getObjectLikeUtils(baseSchema),
        ...getObjectUtils(baseSchema)
      };
    }
  };
}
async function validateAndTransformExtendedObject({
  extensionKeys,
  value,
  transformBase,
  transformExtension
}) {
  const extensionPropertiesSet = new Set(extensionKeys);
  const [extensionProperties, baseProperties] = partition(
    keys(value),
    (key) => extensionPropertiesSet.has(key)
  );
  const transformedBase = await transformBase(filterObject(value, baseProperties));
  const transformedExtension = await transformExtension(filterObject(value, extensionProperties));
  if (transformedBase.ok && transformedExtension.ok) {
    return {
      ok: true,
      value: {
        ...transformedBase.value,
        ...transformedExtension.value
      }
    };
  } else {
    return {
      ok: false,
      errors: [
        ...transformedBase.ok ? [] : transformedBase.errors,
        ...transformedExtension.ok ? [] : transformedExtension.errors
      ]
    };
  }
}
async function isSchemaRequired(schema) {
  return !await isSchemaOptional(schema);
}
async function isSchemaOptional(schema) {
  switch (await schema.getType()) {
    case SchemaType.ANY:
    case SchemaType.UNKNOWN:
    case SchemaType.OPTIONAL:
      return true;
    default:
      return false;
  }
}
var init_object = __esm({
  "src/core/schemas/builders/object/object.ts"() {
    "use strict";
    init_Schema();
    init_entries();
    init_filterObject();
    init_getErrorMessageForIncorrectType();
    init_isPlainObject();
    init_keys();
    init_maybeSkipValidation();
    init_partition();
    init_object_like();
    init_schema_utils();
    init_property();
  }
});

// src/core/schemas/builders/object/objectWithoutOptionalProperties.ts
function objectWithoutOptionalProperties(schemas) {
  return object(schemas);
}
var init_objectWithoutOptionalProperties = __esm({
  "src/core/schemas/builders/object/objectWithoutOptionalProperties.ts"() {
    "use strict";
    init_object();
  }
});

// src/core/schemas/builders/object/index.ts
var init_object2 = __esm({
  "src/core/schemas/builders/object/index.ts"() {
    "use strict";
    init_object();
    init_objectWithoutOptionalProperties();
    init_property();
  }
});

// src/core/schemas/builders/lazy/lazyObject.ts
function lazyObject(getter) {
  const baseSchema = {
    ...constructLazyBaseSchema(getter),
    _getRawProperties: async () => (await getMemoizedSchema(getter))._getRawProperties(),
    _getParsedProperties: async () => (await getMemoizedSchema(getter))._getParsedProperties()
  };
  return {
    ...baseSchema,
    ...getSchemaUtils(baseSchema),
    ...getObjectLikeUtils(baseSchema),
    ...getObjectUtils(baseSchema)
  };
}
var init_lazyObject = __esm({
  "src/core/schemas/builders/lazy/lazyObject.ts"() {
    "use strict";
    init_object2();
    init_object_like();
    init_schema_utils();
    init_lazy();
  }
});

// src/core/schemas/builders/lazy/index.ts
var init_lazy2 = __esm({
  "src/core/schemas/builders/lazy/index.ts"() {
    "use strict";
    init_lazy();
    init_lazyObject();
  }
});

// src/core/schemas/builders/list/list.ts
function list(schema) {
  const baseSchema = {
    parse: async (raw, opts) => validateAndTransformArray(
      raw,
      (item, index) => schema.parse(item, {
        ...opts,
        breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], `[${index}]`]
      })
    ),
    json: (parsed, opts) => validateAndTransformArray(
      parsed,
      (item, index) => schema.json(item, {
        ...opts,
        breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], `[${index}]`]
      })
    ),
    getType: () => SchemaType.LIST
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema)
  };
}
async function validateAndTransformArray(value, transformItem) {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      errors: [
        {
          message: getErrorMessageForIncorrectType(value, "list"),
          path: []
        }
      ]
    };
  }
  const maybeValidItems = await Promise.all(value.map((item, index) => transformItem(item, index)));
  return maybeValidItems.reduce(
    (acc, item) => {
      if (acc.ok && item.ok) {
        return {
          ok: true,
          value: [...acc.value, item.value]
        };
      }
      const errors = [];
      if (!acc.ok) {
        errors.push(...acc.errors);
      }
      if (!item.ok) {
        errors.push(...item.errors);
      }
      return {
        ok: false,
        errors
      };
    },
    { ok: true, value: [] }
  );
}
var init_list = __esm({
  "src/core/schemas/builders/list/list.ts"() {
    "use strict";
    init_Schema();
    init_getErrorMessageForIncorrectType();
    init_maybeSkipValidation();
    init_schema_utils();
  }
});

// src/core/schemas/builders/list/index.ts
var init_list2 = __esm({
  "src/core/schemas/builders/list/index.ts"() {
    "use strict";
    init_list();
  }
});

// src/core/schemas/builders/literals/stringLiteral.ts
function stringLiteral(literal) {
  const schemaCreator = createIdentitySchemaCreator(
    SchemaType.STRING_LITERAL,
    (value, { breadcrumbsPrefix = [] } = {}) => {
      if (value === literal) {
        return {
          ok: true,
          value: literal
        };
      } else {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(value, `"${literal}"`)
            }
          ]
        };
      }
    }
  );
  return schemaCreator();
}
var init_stringLiteral = __esm({
  "src/core/schemas/builders/literals/stringLiteral.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    init_getErrorMessageForIncorrectType();
  }
});

// src/core/schemas/builders/literals/booleanLiteral.ts
function booleanLiteral(literal) {
  const schemaCreator = createIdentitySchemaCreator(
    SchemaType.BOOLEAN_LITERAL,
    (value, { breadcrumbsPrefix = [] } = {}) => {
      if (value === literal) {
        return {
          ok: true,
          value: literal
        };
      } else {
        return {
          ok: false,
          errors: [
            {
              path: breadcrumbsPrefix,
              message: getErrorMessageForIncorrectType(value, `${literal.toString()}`)
            }
          ]
        };
      }
    }
  );
  return schemaCreator();
}
var init_booleanLiteral = __esm({
  "src/core/schemas/builders/literals/booleanLiteral.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    init_getErrorMessageForIncorrectType();
  }
});

// src/core/schemas/builders/literals/index.ts
var init_literals = __esm({
  "src/core/schemas/builders/literals/index.ts"() {
    "use strict";
    init_stringLiteral();
    init_booleanLiteral();
  }
});

// src/core/schemas/builders/primitives/any.ts
var any;
var init_any = __esm({
  "src/core/schemas/builders/primitives/any.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    any = createIdentitySchemaCreator(SchemaType.ANY, (value) => ({ ok: true, value }));
  }
});

// src/core/schemas/builders/primitives/boolean.ts
var boolean;
var init_boolean = __esm({
  "src/core/schemas/builders/primitives/boolean.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    init_getErrorMessageForIncorrectType();
    boolean = createIdentitySchemaCreator(
      SchemaType.BOOLEAN,
      (value, { breadcrumbsPrefix = [] } = {}) => {
        if (typeof value === "boolean") {
          return {
            ok: true,
            value
          };
        } else {
          return {
            ok: false,
            errors: [
              {
                path: breadcrumbsPrefix,
                message: getErrorMessageForIncorrectType(value, "boolean")
              }
            ]
          };
        }
      }
    );
  }
});

// src/core/schemas/builders/primitives/number.ts
var number;
var init_number = __esm({
  "src/core/schemas/builders/primitives/number.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    init_getErrorMessageForIncorrectType();
    number = createIdentitySchemaCreator(
      SchemaType.NUMBER,
      (value, { breadcrumbsPrefix = [] } = {}) => {
        if (typeof value === "number") {
          return {
            ok: true,
            value
          };
        } else {
          return {
            ok: false,
            errors: [
              {
                path: breadcrumbsPrefix,
                message: getErrorMessageForIncorrectType(value, "number")
              }
            ]
          };
        }
      }
    );
  }
});

// src/core/schemas/builders/primitives/string.ts
var string;
var init_string = __esm({
  "src/core/schemas/builders/primitives/string.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    init_getErrorMessageForIncorrectType();
    string = createIdentitySchemaCreator(
      SchemaType.STRING,
      (value, { breadcrumbsPrefix = [] } = {}) => {
        if (typeof value === "string") {
          return {
            ok: true,
            value
          };
        } else {
          return {
            ok: false,
            errors: [
              {
                path: breadcrumbsPrefix,
                message: getErrorMessageForIncorrectType(value, "string")
              }
            ]
          };
        }
      }
    );
  }
});

// src/core/schemas/builders/primitives/unknown.ts
var unknown;
var init_unknown = __esm({
  "src/core/schemas/builders/primitives/unknown.ts"() {
    "use strict";
    init_Schema();
    init_createIdentitySchemaCreator();
    unknown = createIdentitySchemaCreator(SchemaType.UNKNOWN, (value) => ({ ok: true, value }));
  }
});

// src/core/schemas/builders/primitives/index.ts
var init_primitives = __esm({
  "src/core/schemas/builders/primitives/index.ts"() {
    "use strict";
    init_any();
    init_boolean();
    init_number();
    init_string();
    init_unknown();
  }
});

// src/core/schemas/builders/record/record.ts
function record(keySchema, valueSchema) {
  const baseSchema = {
    parse: async (raw, opts) => {
      return validateAndTransformRecord({
        value: raw,
        isKeyNumeric: await keySchema.getType() === SchemaType.NUMBER,
        transformKey: (key) => keySchema.parse(key, {
          ...opts,
          breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], `${key} (key)`]
        }),
        transformValue: (value, key) => valueSchema.parse(value, {
          ...opts,
          breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], `${key}`]
        }),
        breadcrumbsPrefix: opts == null ? void 0 : opts.breadcrumbsPrefix
      });
    },
    json: async (parsed, opts) => {
      return validateAndTransformRecord({
        value: parsed,
        isKeyNumeric: await keySchema.getType() === SchemaType.NUMBER,
        transformKey: (key) => keySchema.json(key, {
          ...opts,
          breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], `${key} (key)`]
        }),
        transformValue: (value, key) => valueSchema.json(value, {
          ...opts,
          breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], `${key}`]
        }),
        breadcrumbsPrefix: opts == null ? void 0 : opts.breadcrumbsPrefix
      });
    },
    getType: () => SchemaType.RECORD
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema)
  };
}
async function validateAndTransformRecord({
  value,
  isKeyNumeric,
  transformKey,
  transformValue,
  breadcrumbsPrefix = []
}) {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      errors: [
        {
          path: breadcrumbsPrefix,
          message: getErrorMessageForIncorrectType(value, "object")
        }
      ]
    };
  }
  return entries(value).reduce(
    async (accPromise, [stringKey, value2]) => {
      if (value2 == null) {
        return accPromise;
      }
      const acc = await accPromise;
      let key = stringKey;
      if (isKeyNumeric) {
        const numberKey = stringKey.length > 0 ? Number(stringKey) : NaN;
        if (!isNaN(numberKey)) {
          key = numberKey;
        }
      }
      const transformedKey = await transformKey(key);
      const transformedValue = await transformValue(value2, key);
      if (acc.ok && transformedKey.ok && transformedValue.ok) {
        return {
          ok: true,
          value: {
            ...acc.value,
            [transformedKey.value]: transformedValue.value
          }
        };
      }
      const errors = [];
      if (!acc.ok) {
        errors.push(...acc.errors);
      }
      if (!transformedKey.ok) {
        errors.push(...transformedKey.errors);
      }
      if (!transformedValue.ok) {
        errors.push(...transformedValue.errors);
      }
      return {
        ok: false,
        errors
      };
    },
    Promise.resolve({ ok: true, value: {} })
  );
}
var init_record = __esm({
  "src/core/schemas/builders/record/record.ts"() {
    "use strict";
    init_Schema();
    init_entries();
    init_getErrorMessageForIncorrectType();
    init_isPlainObject();
    init_maybeSkipValidation();
    init_schema_utils();
  }
});

// src/core/schemas/builders/record/index.ts
var init_record2 = __esm({
  "src/core/schemas/builders/record/index.ts"() {
    "use strict";
    init_record();
  }
});

// src/core/schemas/builders/set/set.ts
function set(schema) {
  const listSchema = list(schema);
  const baseSchema = {
    parse: async (raw, opts) => {
      const parsedList = await listSchema.parse(raw, opts);
      if (parsedList.ok) {
        return {
          ok: true,
          value: new Set(parsedList.value)
        };
      } else {
        return parsedList;
      }
    },
    json: async (parsed, opts) => {
      if (!(parsed instanceof Set)) {
        return {
          ok: false,
          errors: [
            {
              path: (opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [],
              message: getErrorMessageForIncorrectType(parsed, "Set")
            }
          ]
        };
      }
      const jsonList = await listSchema.json([...parsed], opts);
      return jsonList;
    },
    getType: () => SchemaType.SET
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema)
  };
}
var init_set = __esm({
  "src/core/schemas/builders/set/set.ts"() {
    "use strict";
    init_Schema();
    init_getErrorMessageForIncorrectType();
    init_maybeSkipValidation();
    init_list2();
    init_schema_utils();
  }
});

// src/core/schemas/builders/set/index.ts
var init_set2 = __esm({
  "src/core/schemas/builders/set/index.ts"() {
    "use strict";
    init_set();
  }
});

// src/core/schemas/builders/undiscriminated-union/undiscriminatedUnion.ts
function undiscriminatedUnion(schemas) {
  const baseSchema = {
    parse: async (raw, opts) => {
      return validateAndTransformUndiscriminatedUnion(
        (schema, opts2) => schema.parse(raw, opts2),
        schemas,
        opts
      );
    },
    json: async (parsed, opts) => {
      return validateAndTransformUndiscriminatedUnion(
        (schema, opts2) => schema.json(parsed, opts2),
        schemas,
        opts
      );
    },
    getType: () => SchemaType.UNDISCRIMINATED_UNION
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema)
  };
}
async function validateAndTransformUndiscriminatedUnion(transform2, schemas, opts) {
  const errors = [];
  for (const [index, schema] of schemas.entries()) {
    const transformed = await transform2(schema, { ...opts, skipValidation: false });
    if (transformed.ok) {
      return transformed;
    } else {
      for (const error of transformed.errors) {
        errors.push({
          path: error.path,
          message: `[Variant ${index}] ${error.message}`
        });
      }
    }
  }
  return {
    ok: false,
    errors
  };
}
var init_undiscriminatedUnion = __esm({
  "src/core/schemas/builders/undiscriminated-union/undiscriminatedUnion.ts"() {
    "use strict";
    init_Schema();
    init_maybeSkipValidation();
    init_schema_utils();
  }
});

// src/core/schemas/builders/undiscriminated-union/index.ts
var init_undiscriminated_union = __esm({
  "src/core/schemas/builders/undiscriminated-union/index.ts"() {
    "use strict";
    init_undiscriminatedUnion();
  }
});

// src/core/schemas/builders/union/discriminant.ts
function discriminant(parsedDiscriminant, rawDiscriminant) {
  return {
    parsedDiscriminant,
    rawDiscriminant
  };
}
var init_discriminant = __esm({
  "src/core/schemas/builders/union/discriminant.ts"() {
    "use strict";
  }
});

// src/core/schemas/builders/union/union.ts
function union(discriminant2, union2) {
  const rawDiscriminant = typeof discriminant2 === "string" ? discriminant2 : discriminant2.rawDiscriminant;
  const parsedDiscriminant = typeof discriminant2 === "string" ? discriminant2 : discriminant2.parsedDiscriminant;
  const discriminantValueSchema = enum_(keys(union2));
  const baseSchema = {
    parse: async (raw, opts) => {
      return transformAndValidateUnion({
        value: raw,
        discriminant: rawDiscriminant,
        transformedDiscriminant: parsedDiscriminant,
        transformDiscriminantValue: (discriminantValue) => discriminantValueSchema.parse(discriminantValue, {
          allowUnrecognizedEnumValues: opts == null ? void 0 : opts.allowUnrecognizedUnionMembers,
          breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], rawDiscriminant]
        }),
        getAdditionalPropertiesSchema: (discriminantValue) => union2[discriminantValue],
        allowUnrecognizedUnionMembers: opts == null ? void 0 : opts.allowUnrecognizedUnionMembers,
        transformAdditionalProperties: (additionalProperties, additionalPropertiesSchema) => additionalPropertiesSchema.parse(additionalProperties, opts),
        breadcrumbsPrefix: opts == null ? void 0 : opts.breadcrumbsPrefix
      });
    },
    json: async (parsed, opts) => {
      return transformAndValidateUnion({
        value: parsed,
        discriminant: parsedDiscriminant,
        transformedDiscriminant: rawDiscriminant,
        transformDiscriminantValue: (discriminantValue) => discriminantValueSchema.json(discriminantValue, {
          allowUnrecognizedEnumValues: opts == null ? void 0 : opts.allowUnrecognizedUnionMembers,
          breadcrumbsPrefix: [...(opts == null ? void 0 : opts.breadcrumbsPrefix) ?? [], parsedDiscriminant]
        }),
        getAdditionalPropertiesSchema: (discriminantValue) => union2[discriminantValue],
        allowUnrecognizedUnionMembers: opts == null ? void 0 : opts.allowUnrecognizedUnionMembers,
        transformAdditionalProperties: (additionalProperties, additionalPropertiesSchema) => additionalPropertiesSchema.json(additionalProperties, opts),
        breadcrumbsPrefix: opts == null ? void 0 : opts.breadcrumbsPrefix
      });
    },
    getType: () => SchemaType.UNION
  };
  return {
    ...maybeSkipValidation(baseSchema),
    ...getSchemaUtils(baseSchema),
    ...getObjectLikeUtils(baseSchema)
  };
}
async function transformAndValidateUnion({
  value,
  discriminant: discriminant2,
  transformedDiscriminant,
  transformDiscriminantValue,
  getAdditionalPropertiesSchema,
  allowUnrecognizedUnionMembers = false,
  transformAdditionalProperties,
  breadcrumbsPrefix = []
}) {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      errors: [
        {
          path: breadcrumbsPrefix,
          message: getErrorMessageForIncorrectType(value, "object")
        }
      ]
    };
  }
  const { [discriminant2]: discriminantValue, ...additionalProperties } = value;
  if (discriminantValue == null) {
    return {
      ok: false,
      errors: [
        {
          path: breadcrumbsPrefix,
          message: `Missing discriminant ("${discriminant2}")`
        }
      ]
    };
  }
  const transformedDiscriminantValue = await transformDiscriminantValue(discriminantValue);
  if (!transformedDiscriminantValue.ok) {
    return {
      ok: false,
      errors: transformedDiscriminantValue.errors
    };
  }
  const additionalPropertiesSchema = getAdditionalPropertiesSchema(transformedDiscriminantValue.value);
  if (additionalPropertiesSchema == null) {
    if (allowUnrecognizedUnionMembers) {
      return {
        ok: true,
        value: {
          [transformedDiscriminant]: transformedDiscriminantValue.value,
          ...additionalProperties
        }
      };
    } else {
      return {
        ok: false,
        errors: [
          {
            path: [...breadcrumbsPrefix, discriminant2],
            message: "Unexpected discriminant value"
          }
        ]
      };
    }
  }
  const transformedAdditionalProperties = await transformAdditionalProperties(
    additionalProperties,
    additionalPropertiesSchema
  );
  if (!transformedAdditionalProperties.ok) {
    return transformedAdditionalProperties;
  }
  return {
    ok: true,
    value: {
      [transformedDiscriminant]: discriminantValue,
      ...transformedAdditionalProperties.value
    }
  };
}
var init_union = __esm({
  "src/core/schemas/builders/union/union.ts"() {
    "use strict";
    init_Schema();
    init_getErrorMessageForIncorrectType();
    init_isPlainObject();
    init_keys();
    init_maybeSkipValidation();
    init_enum2();
    init_object_like();
    init_schema_utils();
  }
});

// src/core/schemas/builders/union/index.ts
var init_union2 = __esm({
  "src/core/schemas/builders/union/index.ts"() {
    "use strict";
    init_discriminant();
    init_union();
  }
});

// src/core/schemas/builders/index.ts
var init_builders = __esm({
  "src/core/schemas/builders/index.ts"() {
    "use strict";
    init_date2();
    init_enum2();
    init_lazy2();
    init_list2();
    init_literals();
    init_object2();
    init_object_like();
    init_primitives();
    init_record2();
    init_schema_utils();
    init_set2();
    init_undiscriminated_union();
    init_union2();
  }
});

// src/core/schemas/index.ts
var schemas_exports = {};
__export(schemas_exports, {
  JsonError: () => JsonError,
  ParseError: () => ParseError,
  any: () => any,
  boolean: () => boolean,
  booleanLiteral: () => booleanLiteral,
  date: () => date,
  discriminant: () => discriminant,
  enum_: () => enum_,
  getObjectLikeUtils: () => getObjectLikeUtils,
  getObjectUtils: () => getObjectUtils,
  getSchemaUtils: () => getSchemaUtils,
  isProperty: () => isProperty,
  lazy: () => lazy,
  lazyObject: () => lazyObject,
  list: () => list,
  number: () => number,
  object: () => object,
  objectWithoutOptionalProperties: () => objectWithoutOptionalProperties,
  optional: () => optional,
  property: () => property,
  record: () => record,
  set: () => set,
  string: () => string,
  stringLiteral: () => stringLiteral,
  transform: () => transform,
  undiscriminatedUnion: () => undiscriminatedUnion,
  union: () => union,
  unknown: () => unknown,
  withParsedProperties: () => withParsedProperties
});
var init_schemas = __esm({
  "src/core/schemas/index.ts"() {
    "use strict";
    init_builders();
  }
});

// src/core/index.ts
var init_core = __esm({
  "src/core/index.ts"() {
    "use strict";
    init_fetcher();
    init_auth();
    init_schemas();
  }
});

// src/serialization/resources/admin/types/LoginRequest.ts
var LoginRequest;
var init_LoginRequest = __esm({
  "src/serialization/resources/admin/types/LoginRequest.ts"() {
    "use strict";
    init_core();
    LoginRequest = schemas_exports.object({
      name: schemas_exports.string()
    });
  }
});

// src/serialization/resources/admin/types/LoginResponse.ts
var LoginResponse;
var init_LoginResponse = __esm({
  "src/serialization/resources/admin/types/LoginResponse.ts"() {
    "use strict";
    init_core();
    LoginResponse = schemas_exports.object({
      url: schemas_exports.string()
    });
  }
});

// src/serialization/resources/admin/types/index.ts
var init_types = __esm({
  "src/serialization/resources/admin/types/index.ts"() {
    "use strict";
    init_LoginRequest();
    init_LoginResponse();
  }
});

// src/serialization/resources/admin/index.ts
var admin_exports = {};
__export(admin_exports, {
  LoginRequest: () => LoginRequest,
  LoginResponse: () => LoginResponse
});
var init_admin = __esm({
  "src/serialization/resources/admin/index.ts"() {
    "use strict";
    init_types();
  }
});

// src/serialization/resources/cloud/types/BootstrapResponse.ts
var BootstrapResponse;
var init_BootstrapResponse = __esm({
  "src/serialization/resources/cloud/types/BootstrapResponse.ts"() {
    "use strict";
    init_core();
    BootstrapResponse = schemas_exports.object({
      cluster: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.BootstrapCluster),
      domains: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.BootstrapDomains).optional(),
      origins: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.BootstrapOrigins),
      captcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.BootstrapCaptcha)
    });
  }
});

// src/serialization/resources/cloud/types/BootstrapCluster.ts
var BootstrapCluster;
var init_BootstrapCluster = __esm({
  "src/serialization/resources/cloud/types/BootstrapCluster.ts"() {
    "use strict";
    init_core();
    BootstrapCluster = schemas_exports.enum_(["enterprise", "oss"]);
  }
});

// src/serialization/resources/cloud/types/BootstrapDomains.ts
var BootstrapDomains;
var init_BootstrapDomains = __esm({
  "src/serialization/resources/cloud/types/BootstrapDomains.ts"() {
    "use strict";
    init_core();
    BootstrapDomains = schemas_exports.object({
      main: schemas_exports.string(),
      cdn: schemas_exports.string(),
      job: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/types/BootstrapOrigins.ts
var BootstrapOrigins;
var init_BootstrapOrigins = __esm({
  "src/serialization/resources/cloud/types/BootstrapOrigins.ts"() {
    "use strict";
    init_core();
    BootstrapOrigins = schemas_exports.object({
      hub: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/types/BootstrapCaptcha.ts
var BootstrapCaptcha;
var init_BootstrapCaptcha = __esm({
  "src/serialization/resources/cloud/types/BootstrapCaptcha.ts"() {
    "use strict";
    init_core();
    BootstrapCaptcha = schemas_exports.object({
      turnstile: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.BootstrapCaptchaTurnstile).optional()
    });
  }
});

// src/serialization/resources/cloud/types/BootstrapCaptchaTurnstile.ts
var BootstrapCaptchaTurnstile;
var init_BootstrapCaptchaTurnstile = __esm({
  "src/serialization/resources/cloud/types/BootstrapCaptchaTurnstile.ts"() {
    "use strict";
    init_core();
    BootstrapCaptchaTurnstile = schemas_exports.object({
      siteKey: schemas_exports.property("site_key", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/types/index.ts
var init_types2 = __esm({
  "src/serialization/resources/cloud/types/index.ts"() {
    "use strict";
    init_BootstrapResponse();
    init_BootstrapCluster();
    init_BootstrapDomains();
    init_BootstrapOrigins();
    init_BootstrapCaptcha();
    init_BootstrapCaptchaTurnstile();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/InspectResponse.ts
var InspectResponse;
var init_InspectResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/InspectResponse.ts"() {
    "use strict";
    init_core();
    InspectResponse = schemas_exports.object({
      agent: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.AuthAgent)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceRequest.ts
var CreateGameNamespaceRequest;
var init_CreateGameNamespaceRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceRequest.ts"() {
    "use strict";
    init_core();
    CreateGameNamespaceRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      versionId: schemas_exports.property("version_id", schemas_exports.string()),
      nameId: schemas_exports.property("name_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceResponse.ts
var CreateGameNamespaceResponse;
var init_CreateGameNamespaceResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceResponse.ts"() {
    "use strict";
    init_core();
    CreateGameNamespaceResponse = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceRequest.ts
var ValidateGameNamespaceRequest;
var init_ValidateGameNamespaceRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceRequest.ts"() {
    "use strict";
    init_core();
    ValidateGameNamespaceRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      nameId: schemas_exports.property("name_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceResponse.ts
var ValidateGameNamespaceResponse;
var init_ValidateGameNamespaceResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceResponse.ts"() {
    "use strict";
    init_core();
    ValidateGameNamespaceResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/GetGameNamespaceByIdResponse.ts
var GetGameNamespaceByIdResponse;
var init_GetGameNamespaceByIdResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/GetGameNamespaceByIdResponse.ts"() {
    "use strict";
    init_core();
    GetGameNamespaceByIdResponse = schemas_exports.object({
      namespace: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.NamespaceFull)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/UpdateNamespaceCdnAuthUserRequest.ts
var UpdateNamespaceCdnAuthUserRequest;
var init_UpdateNamespaceCdnAuthUserRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/UpdateNamespaceCdnAuthUserRequest.ts"() {
    "use strict";
    init_core();
    UpdateNamespaceCdnAuthUserRequest = schemas_exports.object({
      user: schemas_exports.string(),
      password: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/SetNamespaceCdnAuthTypeRequest.ts
var SetNamespaceCdnAuthTypeRequest;
var init_SetNamespaceCdnAuthTypeRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/SetNamespaceCdnAuthTypeRequest.ts"() {
    "use strict";
    init_core();
    SetNamespaceCdnAuthTypeRequest = schemas_exports.object({
      authType: schemas_exports.property(
        "auth_type",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnAuthType)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ToggleNamespaceDomainPublicAuthRequest.ts
var ToggleNamespaceDomainPublicAuthRequest;
var init_ToggleNamespaceDomainPublicAuthRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ToggleNamespaceDomainPublicAuthRequest.ts"() {
    "use strict";
    init_core();
    ToggleNamespaceDomainPublicAuthRequest = schemas_exports.object({
      enabled: schemas_exports.boolean()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/AddNamespaceDomainRequest.ts
var AddNamespaceDomainRequest;
var init_AddNamespaceDomainRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/AddNamespaceDomainRequest.ts"() {
    "use strict";
    init_core();
    AddNamespaceDomainRequest = schemas_exports.object({
      domain: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/UpdateGameNamespaceMatchmakerConfigRequest.ts
var UpdateGameNamespaceMatchmakerConfigRequest;
var init_UpdateGameNamespaceMatchmakerConfigRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/UpdateGameNamespaceMatchmakerConfigRequest.ts"() {
    "use strict";
    init_core();
    UpdateGameNamespaceMatchmakerConfigRequest = schemas_exports.object({
      lobbyCountMax: schemas_exports.property("lobby_count_max", schemas_exports.number()),
      maxPlayers: schemas_exports.property("max_players", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/GetGameNamespaceVersionHistoryResponse.ts
var GetGameNamespaceVersionHistoryResponse;
var init_GetGameNamespaceVersionHistoryResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/GetGameNamespaceVersionHistoryResponse.ts"() {
    "use strict";
    init_core();
    GetGameNamespaceVersionHistoryResponse = schemas_exports.object({
      versions: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.NamespaceVersion)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceMatchmakerConfigRequest.ts
var ValidateGameNamespaceMatchmakerConfigRequest;
var init_ValidateGameNamespaceMatchmakerConfigRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceMatchmakerConfigRequest.ts"() {
    "use strict";
    init_core();
    ValidateGameNamespaceMatchmakerConfigRequest = schemas_exports.object({
      lobbyCountMax: schemas_exports.property("lobby_count_max", schemas_exports.number()),
      maxPlayers: schemas_exports.property("max_players", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceMatchmakerConfigResponse.ts
var ValidateGameNamespaceMatchmakerConfigResponse;
var init_ValidateGameNamespaceMatchmakerConfigResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceMatchmakerConfigResponse.ts"() {
    "use strict";
    init_core();
    ValidateGameNamespaceMatchmakerConfigResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceTokenDevelopmentRequest.ts
var CreateGameNamespaceTokenDevelopmentRequest;
var init_CreateGameNamespaceTokenDevelopmentRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceTokenDevelopmentRequest.ts"() {
    "use strict";
    init_core();
    CreateGameNamespaceTokenDevelopmentRequest = schemas_exports.object({
      hostname: schemas_exports.string(),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.MatchmakerDevelopmentPort
        )
      ).optional(),
      lobbyPorts: schemas_exports.property(
        "lobby_ports",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRuntimeDockerPort
          )
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceTokenDevelopmentResponse.ts
var CreateGameNamespaceTokenDevelopmentResponse;
var init_CreateGameNamespaceTokenDevelopmentResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceTokenDevelopmentResponse.ts"() {
    "use strict";
    init_core();
    CreateGameNamespaceTokenDevelopmentResponse = schemas_exports.object({
      token: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceTokenDevelopmentRequest.ts
var ValidateGameNamespaceTokenDevelopmentRequest;
var init_ValidateGameNamespaceTokenDevelopmentRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceTokenDevelopmentRequest.ts"() {
    "use strict";
    init_core();
    ValidateGameNamespaceTokenDevelopmentRequest = schemas_exports.object({
      hostname: schemas_exports.string(),
      lobbyPorts: schemas_exports.property(
        "lobby_ports",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRuntimeDockerPort
          )
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceTokenDevelopmentResponse.ts
var ValidateGameNamespaceTokenDevelopmentResponse;
var init_ValidateGameNamespaceTokenDevelopmentResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/ValidateGameNamespaceTokenDevelopmentResponse.ts"() {
    "use strict";
    init_core();
    ValidateGameNamespaceTokenDevelopmentResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceTokenPublicResponse.ts
var CreateGameNamespaceTokenPublicResponse;
var init_CreateGameNamespaceTokenPublicResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/CreateGameNamespaceTokenPublicResponse.ts"() {
    "use strict";
    init_core();
    CreateGameNamespaceTokenPublicResponse = schemas_exports.object({
      token: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/UpdateGameNamespaceVersionRequest.ts
var UpdateGameNamespaceVersionRequest;
var init_UpdateGameNamespaceVersionRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/UpdateGameNamespaceVersionRequest.ts"() {
    "use strict";
    init_core();
    UpdateGameNamespaceVersionRequest = schemas_exports.object({
      versionId: schemas_exports.property("version_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/types/index.ts
var init_types3 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/types/index.ts"() {
    "use strict";
    init_InspectResponse();
    init_CreateGameNamespaceRequest();
    init_CreateGameNamespaceResponse();
    init_ValidateGameNamespaceRequest();
    init_ValidateGameNamespaceResponse();
    init_GetGameNamespaceByIdResponse();
    init_UpdateNamespaceCdnAuthUserRequest();
    init_SetNamespaceCdnAuthTypeRequest();
    init_ToggleNamespaceDomainPublicAuthRequest();
    init_AddNamespaceDomainRequest();
    init_UpdateGameNamespaceMatchmakerConfigRequest();
    init_GetGameNamespaceVersionHistoryResponse();
    init_ValidateGameNamespaceMatchmakerConfigRequest();
    init_ValidateGameNamespaceMatchmakerConfigResponse();
    init_CreateGameNamespaceTokenDevelopmentRequest();
    init_CreateGameNamespaceTokenDevelopmentResponse();
    init_ValidateGameNamespaceTokenDevelopmentRequest();
    init_ValidateGameNamespaceTokenDevelopmentResponse();
    init_CreateGameNamespaceTokenPublicResponse();
    init_UpdateGameNamespaceVersionRequest();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/analytics/types/GetAnalyticsMatchmakerLiveResponse.ts
var GetAnalyticsMatchmakerLiveResponse;
var init_GetAnalyticsMatchmakerLiveResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/analytics/types/GetAnalyticsMatchmakerLiveResponse.ts"() {
    "use strict";
    init_core();
    GetAnalyticsMatchmakerLiveResponse = schemas_exports.object({
      lobbies: schemas_exports.list(
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LobbySummaryAnalytics
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/analytics/types/index.ts
var init_types4 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/analytics/types/index.ts"() {
    "use strict";
    init_GetAnalyticsMatchmakerLiveResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/analytics/index.ts
var analytics_exports = {};
__export(analytics_exports, {
  GetAnalyticsMatchmakerLiveResponse: () => GetAnalyticsMatchmakerLiveResponse
});
var init_analytics = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/analytics/index.ts"() {
    "use strict";
    init_types4();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/types/ListNamespaceLobbiesResponse.ts
var ListNamespaceLobbiesResponse;
var init_ListNamespaceLobbiesResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/types/ListNamespaceLobbiesResponse.ts"() {
    "use strict";
    init_core();
    ListNamespaceLobbiesResponse = schemas_exports.object({
      lobbies: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LogsLobbySummary)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/types/GetNamespaceLobbyResponse.ts
var GetNamespaceLobbyResponse;
var init_GetNamespaceLobbyResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/types/GetNamespaceLobbyResponse.ts"() {
    "use strict";
    init_core();
    GetNamespaceLobbyResponse = schemas_exports.object({
      lobby: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LogsLobbySummary
      ),
      metrics: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.SvcMetrics).optional(),
      stdoutPresignedUrls: schemas_exports.property(
        "stdout_presigned_urls",
        schemas_exports.list(schemas_exports.string())
      ),
      stderrPresignedUrls: schemas_exports.property(
        "stderr_presigned_urls",
        schemas_exports.list(schemas_exports.string())
      ),
      perfLists: schemas_exports.property(
        "perf_lists",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.SvcPerf)
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/types/index.ts
var init_types5 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/types/index.ts"() {
    "use strict";
    init_ListNamespaceLobbiesResponse();
    init_GetNamespaceLobbyResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/index.ts
var logs_exports = {};
__export(logs_exports, {
  GetNamespaceLobbyResponse: () => GetNamespaceLobbyResponse,
  ListNamespaceLobbiesResponse: () => ListNamespaceLobbiesResponse
});
var init_logs = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/logs/index.ts"() {
    "use strict";
    init_types5();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/resources/index.ts
var init_resources = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/resources/index.ts"() {
    "use strict";
    init_analytics();
    init_types4();
    init_logs();
    init_types5();
  }
});

// src/serialization/resources/cloud/resources/games/resources/namespaces/index.ts
var namespaces_exports = {};
__export(namespaces_exports, {
  AddNamespaceDomainRequest: () => AddNamespaceDomainRequest,
  CreateGameNamespaceRequest: () => CreateGameNamespaceRequest,
  CreateGameNamespaceResponse: () => CreateGameNamespaceResponse,
  CreateGameNamespaceTokenDevelopmentRequest: () => CreateGameNamespaceTokenDevelopmentRequest,
  CreateGameNamespaceTokenDevelopmentResponse: () => CreateGameNamespaceTokenDevelopmentResponse,
  CreateGameNamespaceTokenPublicResponse: () => CreateGameNamespaceTokenPublicResponse,
  GetAnalyticsMatchmakerLiveResponse: () => GetAnalyticsMatchmakerLiveResponse,
  GetGameNamespaceByIdResponse: () => GetGameNamespaceByIdResponse,
  GetGameNamespaceVersionHistoryResponse: () => GetGameNamespaceVersionHistoryResponse,
  GetNamespaceLobbyResponse: () => GetNamespaceLobbyResponse,
  InspectResponse: () => InspectResponse,
  ListNamespaceLobbiesResponse: () => ListNamespaceLobbiesResponse,
  SetNamespaceCdnAuthTypeRequest: () => SetNamespaceCdnAuthTypeRequest,
  ToggleNamespaceDomainPublicAuthRequest: () => ToggleNamespaceDomainPublicAuthRequest,
  UpdateGameNamespaceMatchmakerConfigRequest: () => UpdateGameNamespaceMatchmakerConfigRequest,
  UpdateGameNamespaceVersionRequest: () => UpdateGameNamespaceVersionRequest,
  UpdateNamespaceCdnAuthUserRequest: () => UpdateNamespaceCdnAuthUserRequest,
  ValidateGameNamespaceMatchmakerConfigRequest: () => ValidateGameNamespaceMatchmakerConfigRequest,
  ValidateGameNamespaceMatchmakerConfigResponse: () => ValidateGameNamespaceMatchmakerConfigResponse,
  ValidateGameNamespaceRequest: () => ValidateGameNamespaceRequest,
  ValidateGameNamespaceResponse: () => ValidateGameNamespaceResponse,
  ValidateGameNamespaceTokenDevelopmentRequest: () => ValidateGameNamespaceTokenDevelopmentRequest,
  ValidateGameNamespaceTokenDevelopmentResponse: () => ValidateGameNamespaceTokenDevelopmentResponse,
  analytics: () => analytics_exports,
  logs: () => logs_exports
});
var init_namespaces = __esm({
  "src/serialization/resources/cloud/resources/games/resources/namespaces/index.ts"() {
    "use strict";
    init_types3();
    init_resources();
  }
});

// src/serialization/resources/cloud/resources/games/resources/avatars/types/ListGameCustomAvatarsResponse.ts
var ListGameCustomAvatarsResponse;
var init_ListGameCustomAvatarsResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/avatars/types/ListGameCustomAvatarsResponse.ts"() {
    "use strict";
    init_core();
    ListGameCustomAvatarsResponse = schemas_exports.object({
      customAvatars: schemas_exports.property(
        "custom_avatars",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CustomAvatarSummary)
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/avatars/types/PrepareCustomAvatarUploadRequest.ts
var PrepareCustomAvatarUploadRequest;
var init_PrepareCustomAvatarUploadRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/avatars/types/PrepareCustomAvatarUploadRequest.ts"() {
    "use strict";
    init_core();
    PrepareCustomAvatarUploadRequest = schemas_exports.object({
      path: schemas_exports.string(),
      mime: schemas_exports.string().optional(),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/avatars/types/PrepareCustomAvatarUploadResponse.ts
var PrepareCustomAvatarUploadResponse;
var init_PrepareCustomAvatarUploadResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/avatars/types/PrepareCustomAvatarUploadResponse.ts"() {
    "use strict";
    init_core();
    PrepareCustomAvatarUploadResponse = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      presignedRequest: schemas_exports.property(
        "presigned_request",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/avatars/types/index.ts
var init_types6 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/avatars/types/index.ts"() {
    "use strict";
    init_ListGameCustomAvatarsResponse();
    init_PrepareCustomAvatarUploadRequest();
    init_PrepareCustomAvatarUploadResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/avatars/index.ts
var avatars_exports = {};
__export(avatars_exports, {
  ListGameCustomAvatarsResponse: () => ListGameCustomAvatarsResponse,
  PrepareCustomAvatarUploadRequest: () => PrepareCustomAvatarUploadRequest,
  PrepareCustomAvatarUploadResponse: () => PrepareCustomAvatarUploadResponse
});
var init_avatars = __esm({
  "src/serialization/resources/cloud/resources/games/resources/avatars/index.ts"() {
    "use strict";
    init_types6();
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/types/ListGameBuildsResponse.ts
var ListGameBuildsResponse;
var init_ListGameBuildsResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/types/ListGameBuildsResponse.ts"() {
    "use strict";
    init_core();
    ListGameBuildsResponse = schemas_exports.object({
      builds: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.BuildSummary)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/types/CreateGameBuildRequest.ts
var CreateGameBuildRequest;
var init_CreateGameBuildRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/types/CreateGameBuildRequest.ts"() {
    "use strict";
    init_core();
    CreateGameBuildRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      imageTag: schemas_exports.property("image_tag", schemas_exports.string()),
      imageFile: schemas_exports.property(
        "image_file",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PrepareFile)
      ),
      multipartUpload: schemas_exports.property("multipart_upload", schemas_exports.boolean().optional()),
      kind: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.games.BuildKind).optional(),
      compression: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.games.BuildCompression).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/types/CreateGameBuildResponse.ts
var CreateGameBuildResponse;
var init_CreateGameBuildResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/types/CreateGameBuildResponse.ts"() {
    "use strict";
    init_core();
    CreateGameBuildResponse = schemas_exports.object({
      buildId: schemas_exports.property("build_id", schemas_exports.string()),
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      imagePresignedRequest: schemas_exports.property(
        "image_presigned_request",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest).optional()
      ),
      imagePresignedRequests: schemas_exports.property(
        "image_presigned_requests",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest
          )
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/types/BuildKind.ts
var BuildKind;
var init_BuildKind = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/types/BuildKind.ts"() {
    "use strict";
    init_core();
    BuildKind = schemas_exports.enum_(["docker_image", "oci_bundle"]);
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/types/BuildCompression.ts
var BuildCompression;
var init_BuildCompression = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/types/BuildCompression.ts"() {
    "use strict";
    init_core();
    BuildCompression = schemas_exports.enum_(["none", "lz4"]);
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/types/index.ts
var init_types7 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/types/index.ts"() {
    "use strict";
    init_ListGameBuildsResponse();
    init_CreateGameBuildRequest();
    init_CreateGameBuildResponse();
    init_BuildKind();
    init_BuildCompression();
  }
});

// src/serialization/resources/cloud/resources/games/resources/builds/index.ts
var builds_exports = {};
__export(builds_exports, {
  BuildCompression: () => BuildCompression,
  BuildKind: () => BuildKind,
  CreateGameBuildRequest: () => CreateGameBuildRequest,
  CreateGameBuildResponse: () => CreateGameBuildResponse,
  ListGameBuildsResponse: () => ListGameBuildsResponse
});
var init_builds = __esm({
  "src/serialization/resources/cloud/resources/games/resources/builds/index.ts"() {
    "use strict";
    init_types7();
  }
});

// src/serialization/resources/cloud/resources/games/resources/cdn/types/ListGameCdnSitesResponse.ts
var ListGameCdnSitesResponse;
var init_ListGameCdnSitesResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/cdn/types/ListGameCdnSitesResponse.ts"() {
    "use strict";
    init_core();
    ListGameCdnSitesResponse = schemas_exports.object({
      sites: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnSiteSummary)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/cdn/types/CreateGameCdnSiteRequest.ts
var CreateGameCdnSiteRequest;
var init_CreateGameCdnSiteRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/cdn/types/CreateGameCdnSiteRequest.ts"() {
    "use strict";
    init_core();
    CreateGameCdnSiteRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      files: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PrepareFile)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/cdn/types/CreateGameCdnSiteResponse.ts
var CreateGameCdnSiteResponse;
var init_CreateGameCdnSiteResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/cdn/types/CreateGameCdnSiteResponse.ts"() {
    "use strict";
    init_core();
    CreateGameCdnSiteResponse = schemas_exports.object({
      siteId: schemas_exports.property("site_id", schemas_exports.string()),
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      presignedRequests: schemas_exports.property(
        "presigned_requests",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest)
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/cdn/types/index.ts
var init_types8 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/cdn/types/index.ts"() {
    "use strict";
    init_ListGameCdnSitesResponse();
    init_CreateGameCdnSiteRequest();
    init_CreateGameCdnSiteResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/cdn/index.ts
var cdn_exports = {};
__export(cdn_exports, {
  CreateGameCdnSiteRequest: () => CreateGameCdnSiteRequest,
  CreateGameCdnSiteResponse: () => CreateGameCdnSiteResponse,
  ListGameCdnSitesResponse: () => ListGameCdnSitesResponse
});
var init_cdn = __esm({
  "src/serialization/resources/cloud/resources/games/resources/cdn/index.ts"() {
    "use strict";
    init_types8();
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/GetGamesResponse.ts
var GetGamesResponse;
var init_GetGamesResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/GetGamesResponse.ts"() {
    "use strict";
    init_core();
    GetGamesResponse = schemas_exports.object({
      games: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Summary)
      ),
      groups: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Summary)
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/CreateGameRequest.ts
var CreateGameRequest;
var init_CreateGameRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/CreateGameRequest.ts"() {
    "use strict";
    init_core();
    CreateGameRequest = schemas_exports.object({
      nameId: schemas_exports.property("name_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      developerGroupId: schemas_exports.property("developer_group_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/CreateGameResponse.ts
var CreateGameResponse;
var init_CreateGameResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/CreateGameResponse.ts"() {
    "use strict";
    init_core();
    CreateGameResponse = schemas_exports.object({
      gameId: schemas_exports.property("game_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/ValidateGameRequest.ts
var ValidateGameRequest;
var init_ValidateGameRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/ValidateGameRequest.ts"() {
    "use strict";
    init_core();
    ValidateGameRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      nameId: schemas_exports.property("name_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/ValidateGameResponse.ts
var ValidateGameResponse;
var init_ValidateGameResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/ValidateGameResponse.ts"() {
    "use strict";
    init_core();
    ValidateGameResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/GetGameByIdResponse.ts
var GetGameByIdResponse;
var init_GetGameByIdResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/GetGameByIdResponse.ts"() {
    "use strict";
    init_core();
    GetGameByIdResponse = schemas_exports.object({
      game: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.GameFull),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/GameBannerUploadPrepareRequest.ts
var GameBannerUploadPrepareRequest;
var init_GameBannerUploadPrepareRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/GameBannerUploadPrepareRequest.ts"() {
    "use strict";
    init_core();
    GameBannerUploadPrepareRequest = schemas_exports.object({
      path: schemas_exports.string(),
      mime: schemas_exports.string().optional(),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/GameBannerUploadPrepareResponse.ts
var GameBannerUploadPrepareResponse;
var init_GameBannerUploadPrepareResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/GameBannerUploadPrepareResponse.ts"() {
    "use strict";
    init_core();
    GameBannerUploadPrepareResponse = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      presignedRequest: schemas_exports.property(
        "presigned_request",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/GameLogoUploadPrepareRequest.ts
var GameLogoUploadPrepareRequest;
var init_GameLogoUploadPrepareRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/GameLogoUploadPrepareRequest.ts"() {
    "use strict";
    init_core();
    GameLogoUploadPrepareRequest = schemas_exports.object({
      path: schemas_exports.string(),
      mime: schemas_exports.string().optional(),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/GameLogoUploadPrepareResponse.ts
var GameLogoUploadPrepareResponse;
var init_GameLogoUploadPrepareResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/GameLogoUploadPrepareResponse.ts"() {
    "use strict";
    init_core();
    GameLogoUploadPrepareResponse = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      presignedRequest: schemas_exports.property(
        "presigned_request",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/types/index.ts
var init_types9 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/types/index.ts"() {
    "use strict";
    init_GetGamesResponse();
    init_CreateGameRequest();
    init_CreateGameResponse();
    init_ValidateGameRequest();
    init_ValidateGameResponse();
    init_GetGameByIdResponse();
    init_GameBannerUploadPrepareRequest();
    init_GameBannerUploadPrepareResponse();
    init_GameLogoUploadPrepareRequest();
    init_GameLogoUploadPrepareResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/games/index.ts
var games_exports = {};
__export(games_exports, {
  CreateGameRequest: () => CreateGameRequest,
  CreateGameResponse: () => CreateGameResponse,
  GameBannerUploadPrepareRequest: () => GameBannerUploadPrepareRequest,
  GameBannerUploadPrepareResponse: () => GameBannerUploadPrepareResponse,
  GameLogoUploadPrepareRequest: () => GameLogoUploadPrepareRequest,
  GameLogoUploadPrepareResponse: () => GameLogoUploadPrepareResponse,
  GetGameByIdResponse: () => GetGameByIdResponse,
  GetGamesResponse: () => GetGamesResponse,
  ValidateGameRequest: () => ValidateGameRequest,
  ValidateGameResponse: () => ValidateGameResponse
});
var init_games = __esm({
  "src/serialization/resources/cloud/resources/games/resources/games/index.ts"() {
    "use strict";
    init_types9();
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportMatchmakerLobbyHistoryRequest.ts
var ExportMatchmakerLobbyHistoryRequest;
var init_ExportMatchmakerLobbyHistoryRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportMatchmakerLobbyHistoryRequest.ts"() {
    "use strict";
    init_core();
    ExportMatchmakerLobbyHistoryRequest = schemas_exports.object({
      queryStart: schemas_exports.property("query_start", schemas_exports.number()),
      queryEnd: schemas_exports.property("query_end", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportMatchmakerLobbyHistoryResponse.ts
var ExportMatchmakerLobbyHistoryResponse;
var init_ExportMatchmakerLobbyHistoryResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportMatchmakerLobbyHistoryResponse.ts"() {
    "use strict";
    init_core();
    ExportMatchmakerLobbyHistoryResponse = schemas_exports.object({
      url: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/DeleteMatchmakerLobbyResponse.ts
var DeleteMatchmakerLobbyResponse;
var init_DeleteMatchmakerLobbyResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/DeleteMatchmakerLobbyResponse.ts"() {
    "use strict";
    init_core();
    DeleteMatchmakerLobbyResponse = schemas_exports.object({
      didRemove: schemas_exports.property("did_remove", schemas_exports.boolean())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/GetLobbyLogsResponse.ts
var GetLobbyLogsResponse;
var init_GetLobbyLogsResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/GetLobbyLogsResponse.ts"() {
    "use strict";
    init_core();
    GetLobbyLogsResponse = schemas_exports.object({
      lines: schemas_exports.list(schemas_exports.string()),
      timestamps: schemas_exports.list(schemas_exports.string()),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportLobbyLogsRequest.ts
var ExportLobbyLogsRequest;
var init_ExportLobbyLogsRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportLobbyLogsRequest.ts"() {
    "use strict";
    init_core();
    ExportLobbyLogsRequest = schemas_exports.object({
      stream: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.games.LogStream)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportLobbyLogsResponse.ts
var ExportLobbyLogsResponse;
var init_ExportLobbyLogsResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/ExportLobbyLogsResponse.ts"() {
    "use strict";
    init_core();
    ExportLobbyLogsResponse = schemas_exports.object({
      url: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/LogStream.ts
var LogStream;
var init_LogStream = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/LogStream.ts"() {
    "use strict";
    init_core();
    LogStream = schemas_exports.enum_(["std_out", "std_err"]);
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/types/index.ts
var init_types10 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/types/index.ts"() {
    "use strict";
    init_ExportMatchmakerLobbyHistoryRequest();
    init_ExportMatchmakerLobbyHistoryResponse();
    init_DeleteMatchmakerLobbyResponse();
    init_GetLobbyLogsResponse();
    init_ExportLobbyLogsRequest();
    init_ExportLobbyLogsResponse();
    init_LogStream();
  }
});

// src/serialization/resources/cloud/resources/games/resources/matchmaker/index.ts
var matchmaker_exports = {};
__export(matchmaker_exports, {
  DeleteMatchmakerLobbyResponse: () => DeleteMatchmakerLobbyResponse,
  ExportLobbyLogsRequest: () => ExportLobbyLogsRequest,
  ExportLobbyLogsResponse: () => ExportLobbyLogsResponse,
  ExportMatchmakerLobbyHistoryRequest: () => ExportMatchmakerLobbyHistoryRequest,
  ExportMatchmakerLobbyHistoryResponse: () => ExportMatchmakerLobbyHistoryResponse,
  GetLobbyLogsResponse: () => GetLobbyLogsResponse,
  LogStream: () => LogStream
});
var init_matchmaker = __esm({
  "src/serialization/resources/cloud/resources/games/resources/matchmaker/index.ts"() {
    "use strict";
    init_types10();
  }
});

// src/serialization/resources/cloud/resources/games/resources/tokens/types/CreateCloudTokenResponse.ts
var CreateCloudTokenResponse;
var init_CreateCloudTokenResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/tokens/types/CreateCloudTokenResponse.ts"() {
    "use strict";
    init_core();
    CreateCloudTokenResponse = schemas_exports.object({
      token: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/tokens/types/index.ts
var init_types11 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/tokens/types/index.ts"() {
    "use strict";
    init_CreateCloudTokenResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/tokens/index.ts
var tokens_exports = {};
__export(tokens_exports, {
  CreateCloudTokenResponse: () => CreateCloudTokenResponse
});
var init_tokens = __esm({
  "src/serialization/resources/cloud/resources/games/resources/tokens/index.ts"() {
    "use strict";
    init_types11();
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/CreateGameVersionRequest.ts
var CreateGameVersionRequest;
var init_CreateGameVersionRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/CreateGameVersionRequest.ts"() {
    "use strict";
    init_core();
    CreateGameVersionRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      config: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.Config)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/CreateGameVersionResponse.ts
var CreateGameVersionResponse;
var init_CreateGameVersionResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/CreateGameVersionResponse.ts"() {
    "use strict";
    init_core();
    CreateGameVersionResponse = schemas_exports.object({
      versionId: schemas_exports.property("version_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/ReserveVersionNameResponse.ts
var ReserveVersionNameResponse;
var init_ReserveVersionNameResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/ReserveVersionNameResponse.ts"() {
    "use strict";
    init_core();
    ReserveVersionNameResponse = schemas_exports.object({
      versionDisplayName: schemas_exports.property("version_display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/ValidateGameVersionRequest.ts
var ValidateGameVersionRequest;
var init_ValidateGameVersionRequest = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/ValidateGameVersionRequest.ts"() {
    "use strict";
    init_core();
    ValidateGameVersionRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      config: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.Config)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/ValidateGameVersionResponse.ts
var ValidateGameVersionResponse;
var init_ValidateGameVersionResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/ValidateGameVersionResponse.ts"() {
    "use strict";
    init_core();
    ValidateGameVersionResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/GetGameVersionByIdResponse.ts
var GetGameVersionByIdResponse;
var init_GetGameVersionByIdResponse = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/GetGameVersionByIdResponse.ts"() {
    "use strict";
    init_core();
    GetGameVersionByIdResponse = schemas_exports.object({
      version: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.Full)
    });
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/types/index.ts
var init_types12 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/types/index.ts"() {
    "use strict";
    init_CreateGameVersionRequest();
    init_CreateGameVersionResponse();
    init_ReserveVersionNameResponse();
    init_ValidateGameVersionRequest();
    init_ValidateGameVersionResponse();
    init_GetGameVersionByIdResponse();
  }
});

// src/serialization/resources/cloud/resources/games/resources/versions/index.ts
var versions_exports = {};
__export(versions_exports, {
  CreateGameVersionRequest: () => CreateGameVersionRequest,
  CreateGameVersionResponse: () => CreateGameVersionResponse,
  GetGameVersionByIdResponse: () => GetGameVersionByIdResponse,
  ReserveVersionNameResponse: () => ReserveVersionNameResponse,
  ValidateGameVersionRequest: () => ValidateGameVersionRequest,
  ValidateGameVersionResponse: () => ValidateGameVersionResponse
});
var init_versions = __esm({
  "src/serialization/resources/cloud/resources/games/resources/versions/index.ts"() {
    "use strict";
    init_types12();
  }
});

// src/serialization/resources/cloud/resources/games/resources/index.ts
var init_resources2 = __esm({
  "src/serialization/resources/cloud/resources/games/resources/index.ts"() {
    "use strict";
    init_namespaces();
    init_avatars();
    init_types6();
    init_builds();
    init_types7();
    init_cdn();
    init_types8();
    init_games();
    init_types9();
    init_matchmaker();
    init_types10();
    init_tokens();
    init_types11();
    init_versions();
    init_types12();
  }
});

// src/serialization/resources/cloud/resources/games/index.ts
var games_exports2 = {};
__export(games_exports2, {
  BuildCompression: () => BuildCompression,
  BuildKind: () => BuildKind,
  CreateCloudTokenResponse: () => CreateCloudTokenResponse,
  CreateGameBuildRequest: () => CreateGameBuildRequest,
  CreateGameBuildResponse: () => CreateGameBuildResponse,
  CreateGameCdnSiteRequest: () => CreateGameCdnSiteRequest,
  CreateGameCdnSiteResponse: () => CreateGameCdnSiteResponse,
  CreateGameRequest: () => CreateGameRequest,
  CreateGameResponse: () => CreateGameResponse,
  CreateGameVersionRequest: () => CreateGameVersionRequest,
  CreateGameVersionResponse: () => CreateGameVersionResponse,
  DeleteMatchmakerLobbyResponse: () => DeleteMatchmakerLobbyResponse,
  ExportLobbyLogsRequest: () => ExportLobbyLogsRequest,
  ExportLobbyLogsResponse: () => ExportLobbyLogsResponse,
  ExportMatchmakerLobbyHistoryRequest: () => ExportMatchmakerLobbyHistoryRequest,
  ExportMatchmakerLobbyHistoryResponse: () => ExportMatchmakerLobbyHistoryResponse,
  GameBannerUploadPrepareRequest: () => GameBannerUploadPrepareRequest,
  GameBannerUploadPrepareResponse: () => GameBannerUploadPrepareResponse,
  GameLogoUploadPrepareRequest: () => GameLogoUploadPrepareRequest,
  GameLogoUploadPrepareResponse: () => GameLogoUploadPrepareResponse,
  GetGameByIdResponse: () => GetGameByIdResponse,
  GetGameVersionByIdResponse: () => GetGameVersionByIdResponse,
  GetGamesResponse: () => GetGamesResponse,
  GetLobbyLogsResponse: () => GetLobbyLogsResponse,
  ListGameBuildsResponse: () => ListGameBuildsResponse,
  ListGameCdnSitesResponse: () => ListGameCdnSitesResponse,
  ListGameCustomAvatarsResponse: () => ListGameCustomAvatarsResponse,
  LogStream: () => LogStream,
  PrepareCustomAvatarUploadRequest: () => PrepareCustomAvatarUploadRequest,
  PrepareCustomAvatarUploadResponse: () => PrepareCustomAvatarUploadResponse,
  ReserveVersionNameResponse: () => ReserveVersionNameResponse,
  ValidateGameRequest: () => ValidateGameRequest,
  ValidateGameResponse: () => ValidateGameResponse,
  ValidateGameVersionRequest: () => ValidateGameVersionRequest,
  ValidateGameVersionResponse: () => ValidateGameVersionResponse,
  avatars: () => avatars_exports,
  builds: () => builds_exports,
  cdn: () => cdn_exports,
  games: () => games_exports,
  matchmaker: () => matchmaker_exports,
  namespaces: () => namespaces_exports,
  tokens: () => tokens_exports,
  versions: () => versions_exports
});
var init_games2 = __esm({
  "src/serialization/resources/cloud/resources/games/index.ts"() {
    "use strict";
    init_resources2();
  }
});

// src/serialization/resources/cloud/resources/version/types/Config.ts
var Config;
var init_Config = __esm({
  "src/serialization/resources/cloud/resources/version/types/Config.ts"() {
    "use strict";
    init_core();
    Config = schemas_exports.object({
      scripts: schemas_exports.record(schemas_exports.string(), schemas_exports.string()).optional(),
      engine: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.engine.Config).optional(),
      cdn: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.cdn.Config).optional(),
      matchmaker: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.Config).optional(),
      kv: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.kv.Config).optional(),
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.identity.Config).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/types/Full.ts
var Full;
var init_Full = __esm({
  "src/serialization/resources/cloud/resources/version/types/Full.ts"() {
    "use strict";
    init_core();
    Full = schemas_exports.object({
      versionId: schemas_exports.property("version_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      config: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.Config)
    });
  }
});

// src/serialization/resources/cloud/resources/version/types/Summary.ts
var Summary;
var init_Summary = __esm({
  "src/serialization/resources/cloud/resources/version/types/Summary.ts"() {
    "use strict";
    init_core();
    Summary = schemas_exports.object({
      versionId: schemas_exports.property("version_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      displayName: schemas_exports.property("display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/version/types/index.ts
var init_types13 = __esm({
  "src/serialization/resources/cloud/resources/version/types/index.ts"() {
    "use strict";
    init_Config();
    init_Full();
    init_Summary();
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/Config.ts
var Config2;
var init_Config2 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/Config.ts"() {
    "use strict";
    init_core();
    Config2 = schemas_exports.object({
      buildCommand: schemas_exports.property("build_command", schemas_exports.string().optional()),
      buildOutput: schemas_exports.property("build_output", schemas_exports.string().optional()),
      buildEnv: schemas_exports.property(
        "build_env",
        schemas_exports.record(schemas_exports.string(), schemas_exports.string()).optional()
      ),
      siteId: schemas_exports.property("site_id", schemas_exports.string().optional()),
      routes: schemas_exports.list(schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.cdn.Route)).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/Route.ts
var Route;
var init_Route = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/Route.ts"() {
    "use strict";
    init_core();
    Route = schemas_exports.object({
      glob: schemas_exports.string(),
      priority: schemas_exports.number(),
      middlewares: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.cdn.Middleware)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/Middleware.ts
var Middleware;
var init_Middleware = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/Middleware.ts"() {
    "use strict";
    init_core();
    Middleware = schemas_exports.object({
      kind: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.cdn.MiddlewareKind
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/MiddlewareKind.ts
var MiddlewareKind;
var init_MiddlewareKind = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/MiddlewareKind.ts"() {
    "use strict";
    init_core();
    MiddlewareKind = schemas_exports.object({
      customHeaders: schemas_exports.property(
        "custom_headers",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.cdn.CustomHeadersMiddleware).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/CustomHeadersMiddleware.ts
var CustomHeadersMiddleware;
var init_CustomHeadersMiddleware = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/CustomHeadersMiddleware.ts"() {
    "use strict";
    init_core();
    CustomHeadersMiddleware = schemas_exports.object({
      headers: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.cdn.Header)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/Header.ts
var Header;
var init_Header = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/Header.ts"() {
    "use strict";
    init_core();
    Header = schemas_exports.object({
      name: schemas_exports.string(),
      value: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/types/index.ts
var init_types14 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/types/index.ts"() {
    "use strict";
    init_Config2();
    init_Route();
    init_Middleware();
    init_MiddlewareKind();
    init_CustomHeadersMiddleware();
    init_Header();
  }
});

// src/serialization/resources/cloud/resources/version/resources/cdn/index.ts
var cdn_exports2 = {};
__export(cdn_exports2, {
  Config: () => Config2,
  CustomHeadersMiddleware: () => CustomHeadersMiddleware,
  Header: () => Header,
  Middleware: () => Middleware,
  MiddlewareKind: () => MiddlewareKind,
  Route: () => Route
});
var init_cdn2 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/cdn/index.ts"() {
    "use strict";
    init_types14();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/types/Config.ts
var Config3;
var init_Config3 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/types/Config.ts"() {
    "use strict";
    init_core();
    Config3 = schemas_exports.object({
      unity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.engine.UnityConfig).optional(),
      unreal: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.engine.UnrealConfig).optional(),
      godot: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.engine.GodotConfig).optional(),
      html5: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.engine.Html5Config).optional(),
      custom: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.engine.CustomConfig).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/types/index.ts
var init_types15 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/types/index.ts"() {
    "use strict";
    init_Config3();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/custom/types/CustomConfig.ts
var CustomConfig;
var init_CustomConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/custom/types/CustomConfig.ts"() {
    "use strict";
    init_core();
    CustomConfig = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/custom/types/index.ts
var init_types16 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/custom/types/index.ts"() {
    "use strict";
    init_CustomConfig();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/custom/index.ts
var custom_exports = {};
__export(custom_exports, {
  CustomConfig: () => CustomConfig
});
var init_custom = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/custom/index.ts"() {
    "use strict";
    init_types16();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/godot/types/GodotConfig.ts
var GodotConfig;
var init_GodotConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/godot/types/GodotConfig.ts"() {
    "use strict";
    init_core();
    GodotConfig = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/godot/types/index.ts
var init_types17 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/godot/types/index.ts"() {
    "use strict";
    init_GodotConfig();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/godot/index.ts
var godot_exports = {};
__export(godot_exports, {
  GodotConfig: () => GodotConfig
});
var init_godot = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/godot/index.ts"() {
    "use strict";
    init_types17();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/html5/types/Html5Config.ts
var Html5Config;
var init_Html5Config = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/html5/types/Html5Config.ts"() {
    "use strict";
    init_core();
    Html5Config = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/html5/types/index.ts
var init_types18 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/html5/types/index.ts"() {
    "use strict";
    init_Html5Config();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/html5/index.ts
var html5_exports = {};
__export(html5_exports, {
  Html5Config: () => Html5Config
});
var init_html5 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/html5/index.ts"() {
    "use strict";
    init_types18();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/unity/types/UnityConfig.ts
var UnityConfig;
var init_UnityConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/unity/types/UnityConfig.ts"() {
    "use strict";
    init_core();
    UnityConfig = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/unity/types/index.ts
var init_types19 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/unity/types/index.ts"() {
    "use strict";
    init_UnityConfig();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/unity/index.ts
var unity_exports = {};
__export(unity_exports, {
  UnityConfig: () => UnityConfig
});
var init_unity = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/unity/index.ts"() {
    "use strict";
    init_types19();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/unreal/types/UnrealConfig.ts
var UnrealConfig;
var init_UnrealConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/unreal/types/UnrealConfig.ts"() {
    "use strict";
    init_core();
    UnrealConfig = schemas_exports.object({
      gameModule: schemas_exports.property("game_module", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/unreal/types/index.ts
var init_types20 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/unreal/types/index.ts"() {
    "use strict";
    init_UnrealConfig();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/unreal/index.ts
var unreal_exports = {};
__export(unreal_exports, {
  UnrealConfig: () => UnrealConfig
});
var init_unreal = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/unreal/index.ts"() {
    "use strict";
    init_types20();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/resources/index.ts
var init_resources3 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/resources/index.ts"() {
    "use strict";
    init_custom();
    init_types16();
    init_godot();
    init_types17();
    init_html5();
    init_types18();
    init_unity();
    init_types19();
    init_unreal();
    init_types20();
  }
});

// src/serialization/resources/cloud/resources/version/resources/engine/index.ts
var engine_exports = {};
__export(engine_exports, {
  Config: () => Config3,
  CustomConfig: () => CustomConfig,
  GodotConfig: () => GodotConfig,
  Html5Config: () => Html5Config,
  UnityConfig: () => UnityConfig,
  UnrealConfig: () => UnrealConfig,
  custom: () => custom_exports,
  godot: () => godot_exports,
  html5: () => html5_exports,
  unity: () => unity_exports,
  unreal: () => unreal_exports
});
var init_engine = __esm({
  "src/serialization/resources/cloud/resources/version/resources/engine/index.ts"() {
    "use strict";
    init_types15();
    init_resources3();
  }
});

// src/serialization/resources/cloud/resources/version/resources/identity/types/Config.ts
var Config4;
var init_Config4 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/identity/types/Config.ts"() {
    "use strict";
    init_core();
    Config4 = schemas_exports.object({
      displayNames: schemas_exports.property(
        "display_names",
        schemas_exports.list(schemas_exports.string()).optional()
      ),
      avatars: schemas_exports.list(schemas_exports.string()).optional(),
      customDisplayNames: schemas_exports.property(
        "custom_display_names",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.identity.CustomDisplayName
          )
        ).optional()
      ),
      customAvatars: schemas_exports.property(
        "custom_avatars",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.identity.CustomAvatar
          )
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/identity/types/CustomDisplayName.ts
var CustomDisplayName;
var init_CustomDisplayName = __esm({
  "src/serialization/resources/cloud/resources/version/resources/identity/types/CustomDisplayName.ts"() {
    "use strict";
    init_core();
    CustomDisplayName = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/identity/types/CustomAvatar.ts
var CustomAvatar;
var init_CustomAvatar = __esm({
  "src/serialization/resources/cloud/resources/version/resources/identity/types/CustomAvatar.ts"() {
    "use strict";
    init_core();
    CustomAvatar = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/identity/types/index.ts
var init_types21 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/identity/types/index.ts"() {
    "use strict";
    init_Config4();
    init_CustomDisplayName();
    init_CustomAvatar();
  }
});

// src/serialization/resources/cloud/resources/version/resources/identity/index.ts
var identity_exports = {};
__export(identity_exports, {
  Config: () => Config4,
  CustomAvatar: () => CustomAvatar,
  CustomDisplayName: () => CustomDisplayName
});
var init_identity = __esm({
  "src/serialization/resources/cloud/resources/version/resources/identity/index.ts"() {
    "use strict";
    init_types21();
  }
});

// src/serialization/resources/cloud/resources/version/resources/kv/types/Config.ts
var Config5;
var init_Config5 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/kv/types/Config.ts"() {
    "use strict";
    init_core();
    Config5 = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/version/resources/kv/types/index.ts
var init_types22 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/kv/types/index.ts"() {
    "use strict";
    init_Config5();
  }
});

// src/serialization/resources/cloud/resources/version/resources/kv/index.ts
var kv_exports = {};
__export(kv_exports, {
  Config: () => Config5
});
var init_kv = __esm({
  "src/serialization/resources/cloud/resources/version/resources/kv/index.ts"() {
    "use strict";
    init_types22();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/types/Config.ts
var Config6;
var init_Config6 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/types/Config.ts"() {
    "use strict";
    init_core();
    Config6 = schemas_exports.object({
      gameModes: schemas_exports.property(
        "game_modes",
        schemas_exports.record(
          schemas_exports.string(),
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameMode
          )
        ).optional()
      ),
      captcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.Captcha).optional(),
      devHostname: schemas_exports.property("dev_hostname", schemas_exports.string().optional()),
      regions: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeRegion
        )
      ).optional(),
      maxPlayers: schemas_exports.property("max_players", schemas_exports.number().optional()),
      maxPlayersDirect: schemas_exports.property("max_players_direct", schemas_exports.number().optional()),
      maxPlayersParty: schemas_exports.property("max_players_party", schemas_exports.number().optional()),
      docker: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeRuntimeDocker).optional(),
      tier: schemas_exports.string().optional(),
      idleLobbies: schemas_exports.property(
        "idle_lobbies",
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeIdleLobbiesConfig
        ).optional()
      ),
      lobbyGroups: schemas_exports.property(
        "lobby_groups",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroup
          )
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/types/index.ts
var init_types23 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/types/index.ts"() {
    "use strict";
    init_Config6();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/PortRange.ts
var PortRange;
var init_PortRange = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/PortRange.ts"() {
    "use strict";
    init_core();
    PortRange = schemas_exports.object({
      min: schemas_exports.number(),
      max: schemas_exports.number()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/PortProtocol.ts
var PortProtocol;
var init_PortProtocol = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/PortProtocol.ts"() {
    "use strict";
    init_core();
    PortProtocol = schemas_exports.enum_(["http", "https", "tcp", "tcp_tls", "udp"]);
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/ProxyKind.ts
var ProxyKind;
var init_ProxyKind = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/ProxyKind.ts"() {
    "use strict";
    init_core();
    ProxyKind = schemas_exports.enum_(["none", "game_guard"]);
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/Captcha.ts
var Captcha;
var init_Captcha = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/Captcha.ts"() {
    "use strict";
    init_core();
    Captcha = schemas_exports.object({
      requestsBeforeReverify: schemas_exports.property("requests_before_reverify", schemas_exports.number()),
      verificationTtl: schemas_exports.property("verification_ttl", schemas_exports.number()),
      hcaptcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.CaptchaHcaptcha).optional(),
      turnstile: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.CaptchaTurnstile).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/CaptchaHcaptcha.ts
var CaptchaHcaptcha;
var init_CaptchaHcaptcha = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/CaptchaHcaptcha.ts"() {
    "use strict";
    init_core();
    CaptchaHcaptcha = schemas_exports.object({
      level: schemas_exports.lazy(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.CaptchaHcaptchaLevel
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/CaptchaHcaptchaLevel.ts
var CaptchaHcaptchaLevel;
var init_CaptchaHcaptchaLevel = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/CaptchaHcaptchaLevel.ts"() {
    "use strict";
    init_core();
    CaptchaHcaptchaLevel = schemas_exports.enum_(["easy", "moderate", "difficult", "always_on"]);
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/CaptchaTurnstile.ts
var CaptchaTurnstile;
var init_CaptchaTurnstile = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/CaptchaTurnstile.ts"() {
    "use strict";
    init_core();
    CaptchaTurnstile = schemas_exports.object({
      siteKey: schemas_exports.property("site_key", schemas_exports.string()),
      secretKey: schemas_exports.property("secret_key", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/NetworkMode.ts
var NetworkMode;
var init_NetworkMode = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/NetworkMode.ts"() {
    "use strict";
    init_core();
    NetworkMode = schemas_exports.enum_(["bridge", "host"]);
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/index.ts
var init_types24 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/types/index.ts"() {
    "use strict";
    init_PortRange();
    init_PortProtocol();
    init_ProxyKind();
    init_Captcha();
    init_CaptchaHcaptcha();
    init_CaptchaHcaptchaLevel();
    init_CaptchaTurnstile();
    init_NetworkMode();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/index.ts
var common_exports = {};
__export(common_exports, {
  Captcha: () => Captcha,
  CaptchaHcaptcha: () => CaptchaHcaptcha,
  CaptchaHcaptchaLevel: () => CaptchaHcaptchaLevel,
  CaptchaTurnstile: () => CaptchaTurnstile,
  NetworkMode: () => NetworkMode,
  PortProtocol: () => PortProtocol,
  PortRange: () => PortRange,
  ProxyKind: () => ProxyKind
});
var init_common = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/common/index.ts"() {
    "use strict";
    init_types24();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameMode.ts
var GameMode;
var init_GameMode = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameMode.ts"() {
    "use strict";
    init_core();
    GameMode = schemas_exports.object({
      regions: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeRegion
        )
      ).optional(),
      maxPlayers: schemas_exports.property("max_players", schemas_exports.number().optional()),
      maxPlayersDirect: schemas_exports.property("max_players_direct", schemas_exports.number().optional()),
      maxPlayersParty: schemas_exports.property("max_players_party", schemas_exports.number().optional()),
      docker: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeRuntimeDocker
      ).optional(),
      listable: schemas_exports.boolean().optional(),
      taggable: schemas_exports.boolean().optional(),
      allowDynamicMaxPlayers: schemas_exports.property(
        "allow_dynamic_max_players",
        schemas_exports.boolean().optional()
      ),
      actions: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeActions).optional(),
      tier: schemas_exports.string().optional(),
      idleLobbies: schemas_exports.property(
        "idle_lobbies",
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeIdleLobbiesConfig
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeRegion.ts
var GameModeRegion;
var init_GameModeRegion = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeRegion.ts"() {
    "use strict";
    init_core();
    GameModeRegion = schemas_exports.object({
      tier: schemas_exports.string().optional(),
      idleLobbies: schemas_exports.property(
        "idle_lobbies",
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeIdleLobbiesConfig
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeRuntimeDocker.ts
var GameModeRuntimeDocker;
var init_GameModeRuntimeDocker = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeRuntimeDocker.ts"() {
    "use strict";
    init_core();
    GameModeRuntimeDocker = schemas_exports.object({
      dockerfile: schemas_exports.string().optional(),
      buildArgs: schemas_exports.property(
        "build_args",
        schemas_exports.record(schemas_exports.string(), schemas_exports.string()).optional()
      ),
      image: schemas_exports.string().optional(),
      imageId: schemas_exports.property("image_id", schemas_exports.string().optional()),
      args: schemas_exports.list(schemas_exports.string()).optional(),
      env: schemas_exports.record(schemas_exports.string(), schemas_exports.string()).optional(),
      networkMode: schemas_exports.property(
        "network_mode",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.NetworkMode).optional()
      ),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeRuntimeDockerPort
        )
      ).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeRuntimeDockerPort.ts
var GameModeRuntimeDockerPort;
var init_GameModeRuntimeDockerPort = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeRuntimeDockerPort.ts"() {
    "use strict";
    init_core();
    GameModeRuntimeDockerPort = schemas_exports.object({
      port: schemas_exports.number().optional(),
      portRange: schemas_exports.property(
        "port_range",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortRange).optional()
      ),
      protocol: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortProtocol).optional(),
      proxy: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.ProxyKind).optional(),
      devPort: schemas_exports.property("dev_port", schemas_exports.number().optional()),
      devPortRange: schemas_exports.property(
        "dev_port_range",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortRange).optional()
      ),
      devProtocol: schemas_exports.property(
        "dev_protocol",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortProtocol).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeIdleLobbiesConfig.ts
var GameModeIdleLobbiesConfig;
var init_GameModeIdleLobbiesConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeIdleLobbiesConfig.ts"() {
    "use strict";
    init_core();
    GameModeIdleLobbiesConfig = schemas_exports.object({
      min: schemas_exports.number(),
      max: schemas_exports.number()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeActions.ts
var GameModeActions;
var init_GameModeActions = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeActions.ts"() {
    "use strict";
    init_core();
    GameModeActions = schemas_exports.object({
      find: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeFindConfig
      ).optional(),
      join: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeJoinConfig
      ).optional(),
      create: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeCreateConfig
      ).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeIdentityRequirement.ts
var GameModeIdentityRequirement;
var init_GameModeIdentityRequirement = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeIdentityRequirement.ts"() {
    "use strict";
    init_core();
    GameModeIdentityRequirement = schemas_exports.enum_(["none", "guest", "registered"]);
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeVerificationConfig.ts
var GameModeVerificationConfig;
var init_GameModeVerificationConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeVerificationConfig.ts"() {
    "use strict";
    init_core();
    GameModeVerificationConfig = schemas_exports.object({
      url: schemas_exports.string(),
      headers: schemas_exports.record(schemas_exports.string(), schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeFindConfig.ts
var GameModeFindConfig;
var init_GameModeFindConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeFindConfig.ts"() {
    "use strict";
    init_core();
    GameModeFindConfig = schemas_exports.object({
      enabled: schemas_exports.boolean(),
      identityRequirement: schemas_exports.property(
        "identity_requirement",
        schemas_exports.lazy(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeIdentityRequirement
        ).optional()
      ),
      verification: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeVerificationConfig
      ).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeJoinConfig.ts
var GameModeJoinConfig;
var init_GameModeJoinConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeJoinConfig.ts"() {
    "use strict";
    init_core();
    GameModeJoinConfig = schemas_exports.object({
      enabled: schemas_exports.boolean(),
      identityRequirement: schemas_exports.property(
        "identity_requirement",
        schemas_exports.lazy(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeIdentityRequirement
        ).optional()
      ),
      verification: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeVerificationConfig
      ).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeCreateConfig.ts
var GameModeCreateConfig;
var init_GameModeCreateConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/GameModeCreateConfig.ts"() {
    "use strict";
    init_core();
    GameModeCreateConfig = schemas_exports.object({
      enabled: schemas_exports.boolean(),
      identityRequirement: schemas_exports.property(
        "identity_requirement",
        schemas_exports.lazy(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeIdentityRequirement
        ).optional()
      ),
      verification: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.GameModeVerificationConfig
      ).optional(),
      enablePublic: schemas_exports.property("enable_public", schemas_exports.boolean().optional()),
      enablePrivate: schemas_exports.property("enable_private", schemas_exports.boolean().optional()),
      maxLobbiesPerIdentity: schemas_exports.property(
        "max_lobbies_per_identity",
        schemas_exports.number().optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/index.ts
var init_types25 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/types/index.ts"() {
    "use strict";
    init_GameMode();
    init_GameModeRegion();
    init_GameModeRuntimeDocker();
    init_GameModeRuntimeDockerPort();
    init_GameModeIdleLobbiesConfig();
    init_GameModeActions();
    init_GameModeIdentityRequirement();
    init_GameModeVerificationConfig();
    init_GameModeFindConfig();
    init_GameModeJoinConfig();
    init_GameModeCreateConfig();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/index.ts
var gameMode_exports = {};
__export(gameMode_exports, {
  GameMode: () => GameMode,
  GameModeActions: () => GameModeActions,
  GameModeCreateConfig: () => GameModeCreateConfig,
  GameModeFindConfig: () => GameModeFindConfig,
  GameModeIdentityRequirement: () => GameModeIdentityRequirement,
  GameModeIdleLobbiesConfig: () => GameModeIdleLobbiesConfig,
  GameModeJoinConfig: () => GameModeJoinConfig,
  GameModeRegion: () => GameModeRegion,
  GameModeRuntimeDocker: () => GameModeRuntimeDocker,
  GameModeRuntimeDockerPort: () => GameModeRuntimeDockerPort,
  GameModeVerificationConfig: () => GameModeVerificationConfig
});
var init_gameMode = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/gameMode/index.ts"() {
    "use strict";
    init_types25();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroup.ts
var LobbyGroup;
var init_LobbyGroup = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroup.ts"() {
    "use strict";
    init_core();
    LobbyGroup = schemas_exports.object({
      nameId: schemas_exports.property("name_id", schemas_exports.string()),
      regions: schemas_exports.list(
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRegion
        )
      ),
      maxPlayersNormal: schemas_exports.property("max_players_normal", schemas_exports.number()),
      maxPlayersDirect: schemas_exports.property("max_players_direct", schemas_exports.number()),
      maxPlayersParty: schemas_exports.property("max_players_party", schemas_exports.number()),
      runtime: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRuntime
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntime.ts
var LobbyGroupRuntime;
var init_LobbyGroupRuntime = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntime.ts"() {
    "use strict";
    init_core();
    LobbyGroupRuntime = schemas_exports.object({
      docker: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRuntimeDocker
      ).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRegion.ts
var LobbyGroupRegion;
var init_LobbyGroupRegion = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRegion.ts"() {
    "use strict";
    init_core();
    LobbyGroupRegion = schemas_exports.object({
      regionId: schemas_exports.property("region_id", schemas_exports.string()),
      tierNameId: schemas_exports.property("tier_name_id", schemas_exports.string()),
      idleLobbies: schemas_exports.property(
        "idle_lobbies",
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupIdleLobbiesConfig
        ).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntimeDocker.ts
var LobbyGroupRuntimeDocker;
var init_LobbyGroupRuntimeDocker = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntimeDocker.ts"() {
    "use strict";
    init_core();
    LobbyGroupRuntimeDocker = schemas_exports.object({
      buildId: schemas_exports.property("build_id", schemas_exports.string().optional()),
      args: schemas_exports.list(schemas_exports.string()),
      envVars: schemas_exports.property(
        "env_vars",
        schemas_exports.list(
          schemas_exports.lazyObject(
            async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRuntimeDockerEnvVar
          )
        )
      ),
      networkMode: schemas_exports.property(
        "network_mode",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.NetworkMode).optional()
      ),
      ports: schemas_exports.list(
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.LobbyGroupRuntimeDockerPort
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntimeDockerEnvVar.ts
var LobbyGroupRuntimeDockerEnvVar;
var init_LobbyGroupRuntimeDockerEnvVar = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntimeDockerEnvVar.ts"() {
    "use strict";
    init_core();
    LobbyGroupRuntimeDockerEnvVar = schemas_exports.object({
      key: schemas_exports.string(),
      value: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntimeDockerPort.ts
var LobbyGroupRuntimeDockerPort;
var init_LobbyGroupRuntimeDockerPort = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupRuntimeDockerPort.ts"() {
    "use strict";
    init_core();
    LobbyGroupRuntimeDockerPort = schemas_exports.object({
      label: schemas_exports.string(),
      targetPort: schemas_exports.property("target_port", schemas_exports.number().optional()),
      portRange: schemas_exports.property(
        "port_range",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortRange).optional()
      ),
      proxyProtocol: schemas_exports.property(
        "proxy_protocol",
        schemas_exports.lazy(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortProtocol
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupIdleLobbiesConfig.ts
var LobbyGroupIdleLobbiesConfig;
var init_LobbyGroupIdleLobbiesConfig = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/LobbyGroupIdleLobbiesConfig.ts"() {
    "use strict";
    init_core();
    LobbyGroupIdleLobbiesConfig = schemas_exports.object({
      minIdleLobbies: schemas_exports.property("min_idle_lobbies", schemas_exports.number()),
      maxIdleLobbies: schemas_exports.property("max_idle_lobbies", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/index.ts
var init_types26 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/types/index.ts"() {
    "use strict";
    init_LobbyGroup();
    init_LobbyGroupRuntime();
    init_LobbyGroupRegion();
    init_LobbyGroupRuntimeDocker();
    init_LobbyGroupRuntimeDockerEnvVar();
    init_LobbyGroupRuntimeDockerPort();
    init_LobbyGroupIdleLobbiesConfig();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/index.ts
var lobbyGroup_exports = {};
__export(lobbyGroup_exports, {
  LobbyGroup: () => LobbyGroup,
  LobbyGroupIdleLobbiesConfig: () => LobbyGroupIdleLobbiesConfig,
  LobbyGroupRegion: () => LobbyGroupRegion,
  LobbyGroupRuntime: () => LobbyGroupRuntime,
  LobbyGroupRuntimeDocker: () => LobbyGroupRuntimeDocker,
  LobbyGroupRuntimeDockerEnvVar: () => LobbyGroupRuntimeDockerEnvVar,
  LobbyGroupRuntimeDockerPort: () => LobbyGroupRuntimeDockerPort
});
var init_lobbyGroup = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/lobbyGroup/index.ts"() {
    "use strict";
    init_types26();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/index.ts
var init_resources4 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/resources/index.ts"() {
    "use strict";
    init_common();
    init_types24();
    init_gameMode();
    init_types25();
    init_lobbyGroup();
    init_types26();
  }
});

// src/serialization/resources/cloud/resources/version/resources/matchmaker/index.ts
var matchmaker_exports2 = {};
__export(matchmaker_exports2, {
  Captcha: () => Captcha,
  CaptchaHcaptcha: () => CaptchaHcaptcha,
  CaptchaHcaptchaLevel: () => CaptchaHcaptchaLevel,
  CaptchaTurnstile: () => CaptchaTurnstile,
  Config: () => Config6,
  GameMode: () => GameMode,
  GameModeActions: () => GameModeActions,
  GameModeCreateConfig: () => GameModeCreateConfig,
  GameModeFindConfig: () => GameModeFindConfig,
  GameModeIdentityRequirement: () => GameModeIdentityRequirement,
  GameModeIdleLobbiesConfig: () => GameModeIdleLobbiesConfig,
  GameModeJoinConfig: () => GameModeJoinConfig,
  GameModeRegion: () => GameModeRegion,
  GameModeRuntimeDocker: () => GameModeRuntimeDocker,
  GameModeRuntimeDockerPort: () => GameModeRuntimeDockerPort,
  GameModeVerificationConfig: () => GameModeVerificationConfig,
  LobbyGroup: () => LobbyGroup,
  LobbyGroupIdleLobbiesConfig: () => LobbyGroupIdleLobbiesConfig,
  LobbyGroupRegion: () => LobbyGroupRegion,
  LobbyGroupRuntime: () => LobbyGroupRuntime,
  LobbyGroupRuntimeDocker: () => LobbyGroupRuntimeDocker,
  LobbyGroupRuntimeDockerEnvVar: () => LobbyGroupRuntimeDockerEnvVar,
  LobbyGroupRuntimeDockerPort: () => LobbyGroupRuntimeDockerPort,
  NetworkMode: () => NetworkMode,
  PortProtocol: () => PortProtocol,
  PortRange: () => PortRange,
  ProxyKind: () => ProxyKind,
  common: () => common_exports,
  gameMode: () => gameMode_exports,
  lobbyGroup: () => lobbyGroup_exports
});
var init_matchmaker2 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/matchmaker/index.ts"() {
    "use strict";
    init_types23();
    init_resources4();
  }
});

// src/serialization/resources/cloud/resources/version/resources/index.ts
var init_resources5 = __esm({
  "src/serialization/resources/cloud/resources/version/resources/index.ts"() {
    "use strict";
    init_cdn2();
    init_engine();
    init_identity();
    init_kv();
    init_matchmaker2();
  }
});

// src/serialization/resources/cloud/resources/version/index.ts
var version_exports = {};
__export(version_exports, {
  Config: () => Config,
  Full: () => Full,
  Summary: () => Summary,
  cdn: () => cdn_exports2,
  engine: () => engine_exports,
  identity: () => identity_exports,
  kv: () => kv_exports,
  matchmaker: () => matchmaker_exports2
});
var init_version = __esm({
  "src/serialization/resources/cloud/resources/version/index.ts"() {
    "use strict";
    init_types13();
    init_resources5();
  }
});

// src/serialization/resources/cloud/resources/auth/types/InspectResponse.ts
var InspectResponse2;
var init_InspectResponse2 = __esm({
  "src/serialization/resources/cloud/resources/auth/types/InspectResponse.ts"() {
    "use strict";
    init_core();
    InspectResponse2 = schemas_exports.object({
      agent: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.AuthAgent)
    });
  }
});

// src/serialization/resources/cloud/resources/auth/types/index.ts
var init_types27 = __esm({
  "src/serialization/resources/cloud/resources/auth/types/index.ts"() {
    "use strict";
    init_InspectResponse2();
  }
});

// src/serialization/resources/cloud/resources/auth/index.ts
var auth_exports = {};
__export(auth_exports, {
  InspectResponse: () => InspectResponse2
});
var init_auth2 = __esm({
  "src/serialization/resources/cloud/resources/auth/index.ts"() {
    "use strict";
    init_types27();
  }
});

// src/serialization/resources/cloud/resources/common/types/SvcPerf.ts
var SvcPerf;
var init_SvcPerf = __esm({
  "src/serialization/resources/cloud/resources/common/types/SvcPerf.ts"() {
    "use strict";
    init_core();
    SvcPerf = schemas_exports.object({
      svcName: schemas_exports.property("svc_name", schemas_exports.string()),
      ts: schemas_exports.date(),
      duration: schemas_exports.number(),
      reqId: schemas_exports.property("req_id", schemas_exports.string().optional()),
      spans: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LogsPerfSpan)
      ),
      marks: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LogsPerfMark)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/LogsPerfSpan.ts
var LogsPerfSpan;
var init_LogsPerfSpan = __esm({
  "src/serialization/resources/cloud/resources/common/types/LogsPerfSpan.ts"() {
    "use strict";
    init_core();
    LogsPerfSpan = schemas_exports.object({
      label: schemas_exports.string(),
      startTs: schemas_exports.property("start_ts", schemas_exports.date()),
      finishTs: schemas_exports.property("finish_ts", schemas_exports.date().optional()),
      reqId: schemas_exports.property("req_id", schemas_exports.string().optional())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/LogsPerfMark.ts
var LogsPerfMark;
var init_LogsPerfMark = __esm({
  "src/serialization/resources/cloud/resources/common/types/LogsPerfMark.ts"() {
    "use strict";
    init_core();
    LogsPerfMark = schemas_exports.object({
      label: schemas_exports.string(),
      ts: schemas_exports.date(),
      rayId: schemas_exports.property("ray_id", schemas_exports.string().optional()),
      reqId: schemas_exports.property("req_id", schemas_exports.string().optional())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/LobbySummaryAnalytics.ts
var LobbySummaryAnalytics;
var init_LobbySummaryAnalytics = __esm({
  "src/serialization/resources/cloud/resources/common/types/LobbySummaryAnalytics.ts"() {
    "use strict";
    init_core();
    LobbySummaryAnalytics = schemas_exports.object({
      lobbyId: schemas_exports.property("lobby_id", schemas_exports.string()),
      lobbyGroupId: schemas_exports.property("lobby_group_id", schemas_exports.string()),
      lobbyGroupNameId: schemas_exports.property("lobby_group_name_id", schemas_exports.string()),
      regionId: schemas_exports.property("region_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      isReady: schemas_exports.property("is_ready", schemas_exports.boolean()),
      isIdle: schemas_exports.property("is_idle", schemas_exports.boolean()),
      isClosed: schemas_exports.property("is_closed", schemas_exports.boolean()),
      isOutdated: schemas_exports.property("is_outdated", schemas_exports.boolean()),
      maxPlayersNormal: schemas_exports.property("max_players_normal", schemas_exports.number()),
      maxPlayersDirect: schemas_exports.property("max_players_direct", schemas_exports.number()),
      maxPlayersParty: schemas_exports.property("max_players_party", schemas_exports.number()),
      totalPlayerCount: schemas_exports.property("total_player_count", schemas_exports.number()),
      registeredPlayerCount: schemas_exports.property("registered_player_count", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/LogsLobbySummary.ts
var LogsLobbySummary;
var init_LogsLobbySummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/LogsLobbySummary.ts"() {
    "use strict";
    init_core();
    LogsLobbySummary = schemas_exports.object({
      lobbyId: schemas_exports.property("lobby_id", schemas_exports.string()),
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string()),
      lobbyGroupNameId: schemas_exports.property("lobby_group_name_id", schemas_exports.string()),
      regionId: schemas_exports.property("region_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      startTs: schemas_exports.property("start_ts", schemas_exports.date().optional()),
      readyTs: schemas_exports.property("ready_ts", schemas_exports.date().optional()),
      status: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LogsLobbyStatus)
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/LogsLobbyStatus.ts
var LogsLobbyStatus;
var init_LogsLobbyStatus = __esm({
  "src/serialization/resources/cloud/resources/common/types/LogsLobbyStatus.ts"() {
    "use strict";
    init_core();
    LogsLobbyStatus = schemas_exports.object({
      running: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).EmptyObject),
      stopped: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.LogsLobbyStatusStopped).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/LogsLobbyStatusStopped.ts
var LogsLobbyStatusStopped;
var init_LogsLobbyStatusStopped = __esm({
  "src/serialization/resources/cloud/resources/common/types/LogsLobbyStatusStopped.ts"() {
    "use strict";
    init_core();
    LogsLobbyStatusStopped = schemas_exports.object({
      stopTs: schemas_exports.property("stop_ts", schemas_exports.date()),
      failed: schemas_exports.boolean(),
      exitCode: schemas_exports.property("exit_code", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/SvcMetrics.ts
var SvcMetrics;
var init_SvcMetrics = __esm({
  "src/serialization/resources/cloud/resources/common/types/SvcMetrics.ts"() {
    "use strict";
    init_core();
    SvcMetrics = schemas_exports.object({
      job: schemas_exports.string(),
      cpu: schemas_exports.list(schemas_exports.number()),
      memory: schemas_exports.list(schemas_exports.number()),
      allocatedMemory: schemas_exports.property("allocated_memory", schemas_exports.number().optional())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/AuthAgent.ts
var AuthAgent;
var init_AuthAgent = __esm({
  "src/serialization/resources/cloud/resources/common/types/AuthAgent.ts"() {
    "use strict";
    init_core();
    AuthAgent = schemas_exports.object({
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.AuthAgentIdentity).optional(),
      gameCloud: schemas_exports.property(
        "game_cloud",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.AuthAgentGameCloud).optional()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/AuthAgentIdentity.ts
var AuthAgentIdentity;
var init_AuthAgentIdentity = __esm({
  "src/serialization/resources/cloud/resources/common/types/AuthAgentIdentity.ts"() {
    "use strict";
    init_core();
    AuthAgentIdentity = schemas_exports.object({
      identityId: schemas_exports.property("identity_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/AuthAgentGameCloud.ts
var AuthAgentGameCloud;
var init_AuthAgentGameCloud = __esm({
  "src/serialization/resources/cloud/resources/common/types/AuthAgentGameCloud.ts"() {
    "use strict";
    init_core();
    AuthAgentGameCloud = schemas_exports.object({
      gameId: schemas_exports.property("game_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/CustomAvatarSummary.ts
var CustomAvatarSummary;
var init_CustomAvatarSummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/CustomAvatarSummary.ts"() {
    "use strict";
    init_core();
    CustomAvatarSummary = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      url: schemas_exports.string().optional(),
      contentLength: schemas_exports.property("content_length", schemas_exports.number()),
      complete: schemas_exports.boolean()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/BuildSummary.ts
var BuildSummary;
var init_BuildSummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/BuildSummary.ts"() {
    "use strict";
    init_core();
    BuildSummary = schemas_exports.object({
      buildId: schemas_exports.property("build_id", schemas_exports.string()),
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      contentLength: schemas_exports.property("content_length", schemas_exports.number()),
      complete: schemas_exports.boolean()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnSiteSummary.ts
var CdnSiteSummary;
var init_CdnSiteSummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnSiteSummary.ts"() {
    "use strict";
    init_core();
    CdnSiteSummary = schemas_exports.object({
      siteId: schemas_exports.property("site_id", schemas_exports.string()),
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      contentLength: schemas_exports.property("content_length", schemas_exports.number()),
      complete: schemas_exports.boolean()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GameFull.ts
var GameFull;
var init_GameFull = __esm({
  "src/serialization/resources/cloud/resources/common/types/GameFull.ts"() {
    "use strict";
    init_core();
    GameFull = schemas_exports.object({
      gameId: schemas_exports.property("game_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      nameId: schemas_exports.property("name_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      developerGroupId: schemas_exports.property("developer_group_id", schemas_exports.string()),
      totalPlayerCount: schemas_exports.property("total_player_count", schemas_exports.number()),
      logoUrl: schemas_exports.property("logo_url", schemas_exports.string().optional()),
      bannerUrl: schemas_exports.property("banner_url", schemas_exports.string().optional()),
      namespaces: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.NamespaceSummary)
      ),
      versions: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.Summary)
      ),
      availableRegions: schemas_exports.property(
        "available_regions",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.RegionSummary)
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/NamespaceSummary.ts
var NamespaceSummary;
var init_NamespaceSummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/NamespaceSummary.ts"() {
    "use strict";
    init_core();
    NamespaceSummary = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      versionId: schemas_exports.property("version_id", schemas_exports.string()),
      nameId: schemas_exports.property("name_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/RegionSummary.ts
var RegionSummary;
var init_RegionSummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/RegionSummary.ts"() {
    "use strict";
    init_core();
    RegionSummary = schemas_exports.object({
      regionId: schemas_exports.property("region_id", schemas_exports.string()),
      regionNameId: schemas_exports.property("region_name_id", schemas_exports.string()),
      provider: schemas_exports.string(),
      universalRegion: schemas_exports.property(
        "universal_region",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.UniversalRegion)
      ),
      providerDisplayName: schemas_exports.property("provider_display_name", schemas_exports.string()),
      regionDisplayName: schemas_exports.property("region_display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GroupBillingSummary.ts
var GroupBillingSummary;
var init_GroupBillingSummary = __esm({
  "src/serialization/resources/cloud/resources/common/types/GroupBillingSummary.ts"() {
    "use strict";
    init_core();
    GroupBillingSummary = schemas_exports.object({
      games: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.GameLobbyExpenses)
      ),
      balance: schemas_exports.number()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GameLobbyExpenses.ts
var GameLobbyExpenses;
var init_GameLobbyExpenses = __esm({
  "src/serialization/resources/cloud/resources/common/types/GameLobbyExpenses.ts"() {
    "use strict";
    init_core();
    GameLobbyExpenses = schemas_exports.object({
      game: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Handle),
      namespaces: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.NamespaceSummary)
      ),
      expenses: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.RegionTierExpenses)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/RegionTierExpenses.ts
var RegionTierExpenses;
var init_RegionTierExpenses = __esm({
  "src/serialization/resources/cloud/resources/common/types/RegionTierExpenses.ts"() {
    "use strict";
    init_core();
    RegionTierExpenses = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string()),
      regionId: schemas_exports.property("region_id", schemas_exports.string()),
      tierNameId: schemas_exports.property("tier_name_id", schemas_exports.string()),
      lobbyGroupNameId: schemas_exports.property("lobby_group_name_id", schemas_exports.string()),
      uptime: schemas_exports.number(),
      expenses: schemas_exports.number()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GroupBankSource.ts
var GroupBankSource;
var init_GroupBankSource = __esm({
  "src/serialization/resources/cloud/resources/common/types/GroupBankSource.ts"() {
    "use strict";
    init_core();
    GroupBankSource = schemas_exports.object({
      accountNumber: schemas_exports.property("account_number", schemas_exports.string()),
      routingNumber: schemas_exports.property("routing_number", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GroupBillingInvoice.ts
var GroupBillingInvoice;
var init_GroupBillingInvoice = __esm({
  "src/serialization/resources/cloud/resources/common/types/GroupBillingInvoice.ts"() {
    "use strict";
    init_core();
    GroupBillingInvoice = schemas_exports.object({
      csvUrl: schemas_exports.property("csv_url", schemas_exports.string()),
      pdfUrl: schemas_exports.property("pdf_url", schemas_exports.string()),
      periodStartTs: schemas_exports.property("period_start_ts", schemas_exports.date()),
      periodEndTs: schemas_exports.property("period_end_ts", schemas_exports.date())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GroupBillingPayment.ts
var GroupBillingPayment;
var init_GroupBillingPayment = __esm({
  "src/serialization/resources/cloud/resources/common/types/GroupBillingPayment.ts"() {
    "use strict";
    init_core();
    GroupBillingPayment = schemas_exports.object({
      amount: schemas_exports.number(),
      description: schemas_exports.string().optional(),
      fromInvoice: schemas_exports.property("from_invoice", schemas_exports.boolean()),
      createdTs: schemas_exports.property("created_ts", schemas_exports.date()),
      status: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.GroupBillingStatus)
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/GroupBillingStatus.ts
var GroupBillingStatus;
var init_GroupBillingStatus = __esm({
  "src/serialization/resources/cloud/resources/common/types/GroupBillingStatus.ts"() {
    "use strict";
    init_core();
    GroupBillingStatus = schemas_exports.enum_(["succeeded", "processing", "refunded"]);
  }
});

// src/serialization/resources/cloud/resources/common/types/GroupBillingTransfer.ts
var GroupBillingTransfer;
var init_GroupBillingTransfer = __esm({
  "src/serialization/resources/cloud/resources/common/types/GroupBillingTransfer.ts"() {
    "use strict";
    init_core();
    GroupBillingTransfer = schemas_exports.object({
      amount: schemas_exports.number(),
      description: schemas_exports.string().optional(),
      createdTs: schemas_exports.property("created_ts", schemas_exports.date()),
      status: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.GroupBillingStatus)
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/RegionTier.ts
var RegionTier;
var init_RegionTier = __esm({
  "src/serialization/resources/cloud/resources/common/types/RegionTier.ts"() {
    "use strict";
    init_core();
    RegionTier = schemas_exports.object({
      tierNameId: schemas_exports.property("tier_name_id", schemas_exports.string()),
      rivetCoresNumerator: schemas_exports.property("rivet_cores_numerator", schemas_exports.number()),
      rivetCoresDenominator: schemas_exports.property("rivet_cores_denominator", schemas_exports.number()),
      cpu: schemas_exports.number(),
      memory: schemas_exports.number(),
      disk: schemas_exports.number(),
      bandwidth: schemas_exports.number(),
      pricePerSecond: schemas_exports.property("price_per_second", schemas_exports.number())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/UniversalRegion.ts
var UniversalRegion;
var init_UniversalRegion = __esm({
  "src/serialization/resources/cloud/resources/common/types/UniversalRegion.ts"() {
    "use strict";
    init_core();
    UniversalRegion = schemas_exports.enum_([
      "unknown",
      "local",
      "amsterdam",
      "atlanta",
      "bangalore",
      "dallas",
      "frankfurt",
      "london",
      "mumbai",
      "newark",
      "new_york_city",
      "san_francisco",
      "singapore",
      "sydney",
      "tokyo",
      "toronto",
      "washington_dc",
      "chicago",
      "paris",
      "seattle",
      "sao_paulo",
      "stockholm",
      "chennai",
      "osaka",
      "milan",
      "miami",
      "jakarta",
      "los_angeles"
    ]);
  }
});

// src/serialization/resources/cloud/resources/common/types/NamespaceFull.ts
var NamespaceFull;
var init_NamespaceFull = __esm({
  "src/serialization/resources/cloud/resources/common/types/NamespaceFull.ts"() {
    "use strict";
    init_core();
    NamespaceFull = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string()),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      versionId: schemas_exports.property("version_id", schemas_exports.string()),
      nameId: schemas_exports.property("name_id", schemas_exports.string()),
      config: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.NamespaceConfig)
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/NamespaceConfig.ts
var NamespaceConfig;
var init_NamespaceConfig = __esm({
  "src/serialization/resources/cloud/resources/common/types/NamespaceConfig.ts"() {
    "use strict";
    init_core();
    NamespaceConfig = schemas_exports.object({
      cdn: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnNamespaceConfig),
      matchmaker: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.MatchmakerNamespaceConfig
      ),
      kv: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.KvNamespaceConfig),
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.IdentityNamespaceConfig)
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnNamespaceConfig.ts
var CdnNamespaceConfig;
var init_CdnNamespaceConfig = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnNamespaceConfig.ts"() {
    "use strict";
    init_core();
    CdnNamespaceConfig = schemas_exports.object({
      enableDomainPublicAuth: schemas_exports.property("enable_domain_public_auth", schemas_exports.boolean()),
      domains: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnNamespaceDomain)
      ),
      authType: schemas_exports.property(
        "auth_type",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnAuthType)
      ),
      authUserList: schemas_exports.property(
        "auth_user_list",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnNamespaceAuthUser)
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/MatchmakerNamespaceConfig.ts
var MatchmakerNamespaceConfig;
var init_MatchmakerNamespaceConfig = __esm({
  "src/serialization/resources/cloud/resources/common/types/MatchmakerNamespaceConfig.ts"() {
    "use strict";
    init_core();
    MatchmakerNamespaceConfig = schemas_exports.object({
      lobbyCountMax: schemas_exports.property("lobby_count_max", schemas_exports.number()),
      maxPlayersPerClient: schemas_exports.property("max_players_per_client", schemas_exports.number()),
      maxPlayersPerClientVpn: schemas_exports.property("max_players_per_client_vpn", schemas_exports.number()),
      maxPlayersPerClientProxy: schemas_exports.property("max_players_per_client_proxy", schemas_exports.number()),
      maxPlayersPerClientTor: schemas_exports.property("max_players_per_client_tor", schemas_exports.number()),
      maxPlayersPerClientHosting: schemas_exports.property(
        "max_players_per_client_hosting",
        schemas_exports.number()
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/KvNamespaceConfig.ts
var KvNamespaceConfig;
var init_KvNamespaceConfig = __esm({
  "src/serialization/resources/cloud/resources/common/types/KvNamespaceConfig.ts"() {
    "use strict";
    init_core();
    KvNamespaceConfig = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/common/types/IdentityNamespaceConfig.ts
var IdentityNamespaceConfig;
var init_IdentityNamespaceConfig = __esm({
  "src/serialization/resources/cloud/resources/common/types/IdentityNamespaceConfig.ts"() {
    "use strict";
    init_core();
    IdentityNamespaceConfig = schemas_exports.object({});
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnAuthType.ts
var CdnAuthType;
var init_CdnAuthType = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnAuthType.ts"() {
    "use strict";
    init_core();
    CdnAuthType = schemas_exports.enum_(["none", "basic"]);
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomain.ts
var CdnNamespaceDomain;
var init_CdnNamespaceDomain = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomain.ts"() {
    "use strict";
    init_core();
    CdnNamespaceDomain = schemas_exports.object({
      domain: schemas_exports.string(),
      createTs: schemas_exports.property("create_ts", schemas_exports.date()),
      verificationStatus: schemas_exports.property(
        "verification_status",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnNamespaceDomainVerificationStatus)
      ),
      verificationMethod: schemas_exports.property(
        "verification_method",
        schemas_exports.lazyObject(
          async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnNamespaceDomainVerificationMethod
        )
      ),
      verificationErrors: schemas_exports.property(
        "verification_errors",
        schemas_exports.list(schemas_exports.string())
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomainVerificationMethod.ts
var CdnNamespaceDomainVerificationMethod;
var init_CdnNamespaceDomainVerificationMethod = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomainVerificationMethod.ts"() {
    "use strict";
    init_core();
    CdnNamespaceDomainVerificationMethod = schemas_exports.object({
      invalid: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).EmptyObject).optional(),
      http: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.CdnNamespaceDomainVerificationMethodHttp).optional()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomainVerificationMethodHttp.ts
var CdnNamespaceDomainVerificationMethodHttp;
var init_CdnNamespaceDomainVerificationMethodHttp = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomainVerificationMethodHttp.ts"() {
    "use strict";
    init_core();
    CdnNamespaceDomainVerificationMethodHttp = schemas_exports.object({
      cnameRecord: schemas_exports.property("cname_record", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomainVerificationStatus.ts
var CdnNamespaceDomainVerificationStatus;
var init_CdnNamespaceDomainVerificationStatus = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnNamespaceDomainVerificationStatus.ts"() {
    "use strict";
    init_core();
    CdnNamespaceDomainVerificationStatus = schemas_exports.enum_(["active", "pending", "failed"]);
  }
});

// src/serialization/resources/cloud/resources/common/types/CdnNamespaceAuthUser.ts
var CdnNamespaceAuthUser;
var init_CdnNamespaceAuthUser = __esm({
  "src/serialization/resources/cloud/resources/common/types/CdnNamespaceAuthUser.ts"() {
    "use strict";
    init_core();
    CdnNamespaceAuthUser = schemas_exports.object({
      user: schemas_exports.string()
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/MatchmakerDevelopmentPort.ts
var MatchmakerDevelopmentPort;
var init_MatchmakerDevelopmentPort = __esm({
  "src/serialization/resources/cloud/resources/common/types/MatchmakerDevelopmentPort.ts"() {
    "use strict";
    init_core();
    MatchmakerDevelopmentPort = schemas_exports.object({
      port: schemas_exports.number().optional(),
      portRange: schemas_exports.property(
        "port_range",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortRange).optional()
      ),
      protocol: schemas_exports.lazy(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.version.matchmaker.PortProtocol
      )
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/NamespaceVersion.ts
var NamespaceVersion;
var init_NamespaceVersion = __esm({
  "src/serialization/resources/cloud/resources/common/types/NamespaceVersion.ts"() {
    "use strict";
    init_core();
    NamespaceVersion = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string()),
      versionId: schemas_exports.property("version_id", schemas_exports.string()),
      deployTs: schemas_exports.property("deploy_ts", schemas_exports.date())
    });
  }
});

// src/serialization/resources/cloud/resources/common/types/index.ts
var init_types28 = __esm({
  "src/serialization/resources/cloud/resources/common/types/index.ts"() {
    "use strict";
    init_SvcPerf();
    init_LogsPerfSpan();
    init_LogsPerfMark();
    init_LobbySummaryAnalytics();
    init_LogsLobbySummary();
    init_LogsLobbyStatus();
    init_LogsLobbyStatusStopped();
    init_SvcMetrics();
    init_AuthAgent();
    init_AuthAgentIdentity();
    init_AuthAgentGameCloud();
    init_CustomAvatarSummary();
    init_BuildSummary();
    init_CdnSiteSummary();
    init_GameFull();
    init_NamespaceSummary();
    init_RegionSummary();
    init_GroupBillingSummary();
    init_GameLobbyExpenses();
    init_RegionTierExpenses();
    init_GroupBankSource();
    init_GroupBillingInvoice();
    init_GroupBillingPayment();
    init_GroupBillingStatus();
    init_GroupBillingTransfer();
    init_RegionTier();
    init_UniversalRegion();
    init_NamespaceFull();
    init_NamespaceConfig();
    init_CdnNamespaceConfig();
    init_MatchmakerNamespaceConfig();
    init_KvNamespaceConfig();
    init_IdentityNamespaceConfig();
    init_CdnAuthType();
    init_CdnNamespaceDomain();
    init_CdnNamespaceDomainVerificationMethod();
    init_CdnNamespaceDomainVerificationMethodHttp();
    init_CdnNamespaceDomainVerificationStatus();
    init_CdnNamespaceAuthUser();
    init_MatchmakerDevelopmentPort();
    init_NamespaceVersion();
  }
});

// src/serialization/resources/cloud/resources/common/index.ts
var common_exports2 = {};
__export(common_exports2, {
  AuthAgent: () => AuthAgent,
  AuthAgentGameCloud: () => AuthAgentGameCloud,
  AuthAgentIdentity: () => AuthAgentIdentity,
  BuildSummary: () => BuildSummary,
  CdnAuthType: () => CdnAuthType,
  CdnNamespaceAuthUser: () => CdnNamespaceAuthUser,
  CdnNamespaceConfig: () => CdnNamespaceConfig,
  CdnNamespaceDomain: () => CdnNamespaceDomain,
  CdnNamespaceDomainVerificationMethod: () => CdnNamespaceDomainVerificationMethod,
  CdnNamespaceDomainVerificationMethodHttp: () => CdnNamespaceDomainVerificationMethodHttp,
  CdnNamespaceDomainVerificationStatus: () => CdnNamespaceDomainVerificationStatus,
  CdnSiteSummary: () => CdnSiteSummary,
  CustomAvatarSummary: () => CustomAvatarSummary,
  GameFull: () => GameFull,
  GameLobbyExpenses: () => GameLobbyExpenses,
  GroupBankSource: () => GroupBankSource,
  GroupBillingInvoice: () => GroupBillingInvoice,
  GroupBillingPayment: () => GroupBillingPayment,
  GroupBillingStatus: () => GroupBillingStatus,
  GroupBillingSummary: () => GroupBillingSummary,
  GroupBillingTransfer: () => GroupBillingTransfer,
  IdentityNamespaceConfig: () => IdentityNamespaceConfig,
  KvNamespaceConfig: () => KvNamespaceConfig,
  LobbySummaryAnalytics: () => LobbySummaryAnalytics,
  LogsLobbyStatus: () => LogsLobbyStatus,
  LogsLobbyStatusStopped: () => LogsLobbyStatusStopped,
  LogsLobbySummary: () => LogsLobbySummary,
  LogsPerfMark: () => LogsPerfMark,
  LogsPerfSpan: () => LogsPerfSpan,
  MatchmakerDevelopmentPort: () => MatchmakerDevelopmentPort,
  MatchmakerNamespaceConfig: () => MatchmakerNamespaceConfig,
  NamespaceConfig: () => NamespaceConfig,
  NamespaceFull: () => NamespaceFull,
  NamespaceSummary: () => NamespaceSummary,
  NamespaceVersion: () => NamespaceVersion,
  RegionSummary: () => RegionSummary,
  RegionTier: () => RegionTier,
  RegionTierExpenses: () => RegionTierExpenses,
  SvcMetrics: () => SvcMetrics,
  SvcPerf: () => SvcPerf,
  UniversalRegion: () => UniversalRegion
});
var init_common2 = __esm({
  "src/serialization/resources/cloud/resources/common/index.ts"() {
    "use strict";
    init_types28();
  }
});

// src/serialization/resources/cloud/resources/devices/resources/links/types/PrepareDeviceLinkResponse.ts
var PrepareDeviceLinkResponse;
var init_PrepareDeviceLinkResponse = __esm({
  "src/serialization/resources/cloud/resources/devices/resources/links/types/PrepareDeviceLinkResponse.ts"() {
    "use strict";
    init_core();
    PrepareDeviceLinkResponse = schemas_exports.object({
      deviceLinkId: schemas_exports.property("device_link_id", schemas_exports.string()),
      deviceLinkToken: schemas_exports.property("device_link_token", schemas_exports.string()),
      deviceLinkUrl: schemas_exports.property("device_link_url", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/devices/resources/links/types/GetDeviceLinkResponse.ts
var GetDeviceLinkResponse;
var init_GetDeviceLinkResponse = __esm({
  "src/serialization/resources/cloud/resources/devices/resources/links/types/GetDeviceLinkResponse.ts"() {
    "use strict";
    init_core();
    GetDeviceLinkResponse = schemas_exports.object({
      cloudToken: schemas_exports.property("cloud_token", schemas_exports.string().optional()),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/cloud/resources/devices/resources/links/types/CompleteDeviceLinkRequest.ts
var CompleteDeviceLinkRequest;
var init_CompleteDeviceLinkRequest = __esm({
  "src/serialization/resources/cloud/resources/devices/resources/links/types/CompleteDeviceLinkRequest.ts"() {
    "use strict";
    init_core();
    CompleteDeviceLinkRequest = schemas_exports.object({
      deviceLinkToken: schemas_exports.property(
        "device_link_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
      ),
      gameId: schemas_exports.property("game_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/devices/resources/links/types/index.ts
var init_types29 = __esm({
  "src/serialization/resources/cloud/resources/devices/resources/links/types/index.ts"() {
    "use strict";
    init_PrepareDeviceLinkResponse();
    init_GetDeviceLinkResponse();
    init_CompleteDeviceLinkRequest();
  }
});

// src/serialization/resources/cloud/resources/devices/resources/links/index.ts
var links_exports = {};
__export(links_exports, {
  CompleteDeviceLinkRequest: () => CompleteDeviceLinkRequest,
  GetDeviceLinkResponse: () => GetDeviceLinkResponse,
  PrepareDeviceLinkResponse: () => PrepareDeviceLinkResponse
});
var init_links = __esm({
  "src/serialization/resources/cloud/resources/devices/resources/links/index.ts"() {
    "use strict";
    init_types29();
  }
});

// src/serialization/resources/cloud/resources/devices/resources/index.ts
var init_resources6 = __esm({
  "src/serialization/resources/cloud/resources/devices/resources/index.ts"() {
    "use strict";
    init_links();
    init_types29();
  }
});

// src/serialization/resources/cloud/resources/devices/index.ts
var devices_exports = {};
__export(devices_exports, {
  CompleteDeviceLinkRequest: () => CompleteDeviceLinkRequest,
  GetDeviceLinkResponse: () => GetDeviceLinkResponse,
  PrepareDeviceLinkResponse: () => PrepareDeviceLinkResponse,
  links: () => links_exports
});
var init_devices = __esm({
  "src/serialization/resources/cloud/resources/devices/index.ts"() {
    "use strict";
    init_resources6();
  }
});

// src/serialization/resources/cloud/resources/groups/types/ValidateGroupRequest.ts
var ValidateGroupRequest;
var init_ValidateGroupRequest = __esm({
  "src/serialization/resources/cloud/resources/groups/types/ValidateGroupRequest.ts"() {
    "use strict";
    init_core();
    ValidateGroupRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/cloud/resources/groups/types/ValidateGroupResponse.ts
var ValidateGroupResponse;
var init_ValidateGroupResponse = __esm({
  "src/serialization/resources/cloud/resources/groups/types/ValidateGroupResponse.ts"() {
    "use strict";
    init_core();
    ValidateGroupResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/groups/types/index.ts
var init_types30 = __esm({
  "src/serialization/resources/cloud/resources/groups/types/index.ts"() {
    "use strict";
    init_ValidateGroupRequest();
    init_ValidateGroupResponse();
  }
});

// src/serialization/resources/cloud/resources/groups/index.ts
var groups_exports = {};
__export(groups_exports, {
  ValidateGroupRequest: () => ValidateGroupRequest,
  ValidateGroupResponse: () => ValidateGroupResponse
});
var init_groups = __esm({
  "src/serialization/resources/cloud/resources/groups/index.ts"() {
    "use strict";
    init_types30();
  }
});

// src/serialization/resources/cloud/resources/logs/types/GetRayPerfLogsResponse.ts
var GetRayPerfLogsResponse;
var init_GetRayPerfLogsResponse = __esm({
  "src/serialization/resources/cloud/resources/logs/types/GetRayPerfLogsResponse.ts"() {
    "use strict";
    init_core();
    GetRayPerfLogsResponse = schemas_exports.object({
      perfLists: schemas_exports.property(
        "perf_lists",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.SvcPerf)
        )
      )
    });
  }
});

// src/serialization/resources/cloud/resources/logs/types/index.ts
var init_types31 = __esm({
  "src/serialization/resources/cloud/resources/logs/types/index.ts"() {
    "use strict";
    init_GetRayPerfLogsResponse();
  }
});

// src/serialization/resources/cloud/resources/logs/index.ts
var logs_exports2 = {};
__export(logs_exports2, {
  GetRayPerfLogsResponse: () => GetRayPerfLogsResponse
});
var init_logs2 = __esm({
  "src/serialization/resources/cloud/resources/logs/index.ts"() {
    "use strict";
    init_types31();
  }
});

// src/serialization/resources/cloud/resources/tiers/types/GetRegionTiersResponse.ts
var GetRegionTiersResponse;
var init_GetRegionTiersResponse = __esm({
  "src/serialization/resources/cloud/resources/tiers/types/GetRegionTiersResponse.ts"() {
    "use strict";
    init_core();
    GetRegionTiersResponse = schemas_exports.object({
      tiers: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).cloud.RegionTier)
      )
    });
  }
});

// src/serialization/resources/cloud/resources/tiers/types/index.ts
var init_types32 = __esm({
  "src/serialization/resources/cloud/resources/tiers/types/index.ts"() {
    "use strict";
    init_GetRegionTiersResponse();
  }
});

// src/serialization/resources/cloud/resources/tiers/index.ts
var tiers_exports = {};
__export(tiers_exports, {
  GetRegionTiersResponse: () => GetRegionTiersResponse
});
var init_tiers = __esm({
  "src/serialization/resources/cloud/resources/tiers/index.ts"() {
    "use strict";
    init_types32();
  }
});

// src/serialization/resources/cloud/resources/index.ts
var init_resources7 = __esm({
  "src/serialization/resources/cloud/resources/index.ts"() {
    "use strict";
    init_games2();
    init_version();
    init_auth2();
    init_types27();
    init_common2();
    init_types28();
    init_devices();
    init_groups();
    init_types30();
    init_logs2();
    init_types31();
    init_tiers();
    init_types32();
  }
});

// src/serialization/resources/cloud/index.ts
var cloud_exports = {};
__export(cloud_exports, {
  AuthAgent: () => AuthAgent,
  AuthAgentGameCloud: () => AuthAgentGameCloud,
  AuthAgentIdentity: () => AuthAgentIdentity,
  BootstrapCaptcha: () => BootstrapCaptcha,
  BootstrapCaptchaTurnstile: () => BootstrapCaptchaTurnstile,
  BootstrapCluster: () => BootstrapCluster,
  BootstrapDomains: () => BootstrapDomains,
  BootstrapOrigins: () => BootstrapOrigins,
  BootstrapResponse: () => BootstrapResponse,
  BuildSummary: () => BuildSummary,
  CdnAuthType: () => CdnAuthType,
  CdnNamespaceAuthUser: () => CdnNamespaceAuthUser,
  CdnNamespaceConfig: () => CdnNamespaceConfig,
  CdnNamespaceDomain: () => CdnNamespaceDomain,
  CdnNamespaceDomainVerificationMethod: () => CdnNamespaceDomainVerificationMethod,
  CdnNamespaceDomainVerificationMethodHttp: () => CdnNamespaceDomainVerificationMethodHttp,
  CdnNamespaceDomainVerificationStatus: () => CdnNamespaceDomainVerificationStatus,
  CdnSiteSummary: () => CdnSiteSummary,
  CustomAvatarSummary: () => CustomAvatarSummary,
  GameFull: () => GameFull,
  GameLobbyExpenses: () => GameLobbyExpenses,
  GetRayPerfLogsResponse: () => GetRayPerfLogsResponse,
  GetRegionTiersResponse: () => GetRegionTiersResponse,
  GroupBankSource: () => GroupBankSource,
  GroupBillingInvoice: () => GroupBillingInvoice,
  GroupBillingPayment: () => GroupBillingPayment,
  GroupBillingStatus: () => GroupBillingStatus,
  GroupBillingSummary: () => GroupBillingSummary,
  GroupBillingTransfer: () => GroupBillingTransfer,
  IdentityNamespaceConfig: () => IdentityNamespaceConfig,
  InspectResponse: () => InspectResponse2,
  KvNamespaceConfig: () => KvNamespaceConfig,
  LobbySummaryAnalytics: () => LobbySummaryAnalytics,
  LogsLobbyStatus: () => LogsLobbyStatus,
  LogsLobbyStatusStopped: () => LogsLobbyStatusStopped,
  LogsLobbySummary: () => LogsLobbySummary,
  LogsPerfMark: () => LogsPerfMark,
  LogsPerfSpan: () => LogsPerfSpan,
  MatchmakerDevelopmentPort: () => MatchmakerDevelopmentPort,
  MatchmakerNamespaceConfig: () => MatchmakerNamespaceConfig,
  NamespaceConfig: () => NamespaceConfig,
  NamespaceFull: () => NamespaceFull,
  NamespaceSummary: () => NamespaceSummary,
  NamespaceVersion: () => NamespaceVersion,
  RegionSummary: () => RegionSummary,
  RegionTier: () => RegionTier,
  RegionTierExpenses: () => RegionTierExpenses,
  SvcMetrics: () => SvcMetrics,
  SvcPerf: () => SvcPerf,
  UniversalRegion: () => UniversalRegion,
  ValidateGroupRequest: () => ValidateGroupRequest,
  ValidateGroupResponse: () => ValidateGroupResponse,
  auth: () => auth_exports,
  common: () => common_exports2,
  devices: () => devices_exports,
  games: () => games_exports2,
  groups: () => groups_exports,
  logs: () => logs_exports2,
  tiers: () => tiers_exports,
  version: () => version_exports
});
var init_cloud = __esm({
  "src/serialization/resources/cloud/index.ts"() {
    "use strict";
    init_types2();
    init_resources7();
  }
});

// src/serialization/resources/group/types/ListSuggestedResponse.ts
var ListSuggestedResponse;
var init_ListSuggestedResponse = __esm({
  "src/serialization/resources/group/types/ListSuggestedResponse.ts"() {
    "use strict";
    init_core();
    ListSuggestedResponse = schemas_exports.object({
      groups: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Summary)
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/group/types/CreateRequest.ts
var CreateRequest;
var init_CreateRequest = __esm({
  "src/serialization/resources/group/types/CreateRequest.ts"() {
    "use strict";
    init_core();
    CreateRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/group/types/CreateResponse.ts
var CreateResponse;
var init_CreateResponse = __esm({
  "src/serialization/resources/group/types/CreateResponse.ts"() {
    "use strict";
    init_core();
    CreateResponse = schemas_exports.object({
      groupId: schemas_exports.property("group_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/group/types/PrepareAvatarUploadRequest.ts
var PrepareAvatarUploadRequest;
var init_PrepareAvatarUploadRequest = __esm({
  "src/serialization/resources/group/types/PrepareAvatarUploadRequest.ts"() {
    "use strict";
    init_core();
    PrepareAvatarUploadRequest = schemas_exports.object({
      path: schemas_exports.string(),
      mime: schemas_exports.string().optional(),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/group/types/PrepareAvatarUploadResponse.ts
var PrepareAvatarUploadResponse;
var init_PrepareAvatarUploadResponse = __esm({
  "src/serialization/resources/group/types/PrepareAvatarUploadResponse.ts"() {
    "use strict";
    init_core();
    PrepareAvatarUploadResponse = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      presignedRequest: schemas_exports.property(
        "presigned_request",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest)
      )
    });
  }
});

// src/serialization/resources/group/types/ValidateProfileRequest.ts
var ValidateProfileRequest;
var init_ValidateProfileRequest = __esm({
  "src/serialization/resources/group/types/ValidateProfileRequest.ts"() {
    "use strict";
    init_core();
    ValidateProfileRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string().optional()),
      bio: schemas_exports.string().optional(),
      publicity: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Publicity).optional()
    });
  }
});

// src/serialization/resources/group/types/ValidateProfileResponse.ts
var ValidateProfileResponse;
var init_ValidateProfileResponse = __esm({
  "src/serialization/resources/group/types/ValidateProfileResponse.ts"() {
    "use strict";
    init_core();
    ValidateProfileResponse = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/group/types/SearchResponse.ts
var SearchResponse;
var init_SearchResponse = __esm({
  "src/serialization/resources/group/types/SearchResponse.ts"() {
    "use strict";
    init_core();
    SearchResponse = schemas_exports.object({
      groups: schemas_exports.list(schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Handle)),
      anchor: schemas_exports.string().optional()
    });
  }
});

// src/serialization/resources/group/types/GetBansResponse.ts
var GetBansResponse;
var init_GetBansResponse = __esm({
  "src/serialization/resources/group/types/GetBansResponse.ts"() {
    "use strict";
    init_core();
    GetBansResponse = schemas_exports.object({
      bannedIdentities: schemas_exports.property(
        "banned_identities",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.BannedIdentity)
        )
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/group/types/GetJoinRequestsResponse.ts
var GetJoinRequestsResponse;
var init_GetJoinRequestsResponse = __esm({
  "src/serialization/resources/group/types/GetJoinRequestsResponse.ts"() {
    "use strict";
    init_core();
    GetJoinRequestsResponse = schemas_exports.object({
      joinRequests: schemas_exports.property(
        "join_requests",
        schemas_exports.list(schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.JoinRequest))
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/group/types/GetMembersResponse.ts
var GetMembersResponse;
var init_GetMembersResponse = __esm({
  "src/serialization/resources/group/types/GetMembersResponse.ts"() {
    "use strict";
    init_core();
    GetMembersResponse = schemas_exports.object({
      members: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Member)
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/group/types/GetProfileResponse.ts
var GetProfileResponse;
var init_GetProfileResponse = __esm({
  "src/serialization/resources/group/types/GetProfileResponse.ts"() {
    "use strict";
    init_core();
    GetProfileResponse = schemas_exports.object({
      group: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Profile),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/group/types/UpdateProfileRequest.ts
var UpdateProfileRequest;
var init_UpdateProfileRequest = __esm({
  "src/serialization/resources/group/types/UpdateProfileRequest.ts"() {
    "use strict";
    init_core();
    UpdateProfileRequest = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string().optional()),
      bio: schemas_exports.string().optional(),
      publicity: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Publicity).optional()
    });
  }
});

// src/serialization/resources/group/types/GetSummaryResponse.ts
var GetSummaryResponse;
var init_GetSummaryResponse = __esm({
  "src/serialization/resources/group/types/GetSummaryResponse.ts"() {
    "use strict";
    init_core();
    GetSummaryResponse = schemas_exports.object({
      group: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Summary)
    });
  }
});

// src/serialization/resources/group/types/TransferOwnershipRequest.ts
var TransferOwnershipRequest;
var init_TransferOwnershipRequest = __esm({
  "src/serialization/resources/group/types/TransferOwnershipRequest.ts"() {
    "use strict";
    init_core();
    TransferOwnershipRequest = schemas_exports.object({
      newOwnerIdentityId: schemas_exports.property("new_owner_identity_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/group/types/index.ts
var init_types33 = __esm({
  "src/serialization/resources/group/types/index.ts"() {
    "use strict";
    init_ListSuggestedResponse();
    init_CreateRequest();
    init_CreateResponse();
    init_PrepareAvatarUploadRequest();
    init_PrepareAvatarUploadResponse();
    init_ValidateProfileRequest();
    init_ValidateProfileResponse();
    init_SearchResponse();
    init_GetBansResponse();
    init_GetJoinRequestsResponse();
    init_GetMembersResponse();
    init_GetProfileResponse();
    init_UpdateProfileRequest();
    init_GetSummaryResponse();
    init_TransferOwnershipRequest();
  }
});

// src/serialization/resources/group/resources/common/types/Summary.ts
var Summary2;
var init_Summary2 = __esm({
  "src/serialization/resources/group/resources/common/types/Summary.ts"() {
    "use strict";
    init_core();
    Summary2 = schemas_exports.object({
      groupId: schemas_exports.property("group_id", schemas_exports.string()),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      avatarUrl: schemas_exports.property("avatar_url", schemas_exports.string().optional()),
      external: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.ExternalLinks),
      isDeveloper: schemas_exports.property("is_developer", schemas_exports.boolean()),
      bio: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Bio),
      isCurrentIdentityMember: schemas_exports.property(
        "is_current_identity_member",
        schemas_exports.boolean()
      ),
      publicity: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Publicity),
      memberCount: schemas_exports.property("member_count", schemas_exports.number()),
      ownerIdentityId: schemas_exports.property("owner_identity_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/group/resources/common/types/Publicity.ts
var Publicity;
var init_Publicity = __esm({
  "src/serialization/resources/group/resources/common/types/Publicity.ts"() {
    "use strict";
    init_core();
    Publicity = schemas_exports.enum_(["open", "closed"]);
  }
});

// src/serialization/resources/group/resources/common/types/Handle.ts
var Handle;
var init_Handle = __esm({
  "src/serialization/resources/group/resources/common/types/Handle.ts"() {
    "use strict";
    init_core();
    Handle = schemas_exports.object({
      groupId: schemas_exports.property("group_id", schemas_exports.string()),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      avatarUrl: schemas_exports.property("avatar_url", schemas_exports.string().optional()),
      external: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.ExternalLinks),
      isDeveloper: schemas_exports.property("is_developer", schemas_exports.boolean().optional())
    });
  }
});

// src/serialization/resources/group/resources/common/types/ExternalLinks.ts
var ExternalLinks;
var init_ExternalLinks = __esm({
  "src/serialization/resources/group/resources/common/types/ExternalLinks.ts"() {
    "use strict";
    init_core();
    ExternalLinks = schemas_exports.object({
      profile: schemas_exports.string()
    });
  }
});

// src/serialization/resources/group/resources/common/types/JoinRequest.ts
var JoinRequest;
var init_JoinRequest = __esm({
  "src/serialization/resources/group/resources/common/types/JoinRequest.ts"() {
    "use strict";
    init_core();
    JoinRequest = schemas_exports.object({
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle),
      ts: schemas_exports.date()
    });
  }
});

// src/serialization/resources/group/resources/common/types/Member.ts
var Member;
var init_Member = __esm({
  "src/serialization/resources/group/resources/common/types/Member.ts"() {
    "use strict";
    init_core();
    Member = schemas_exports.object({
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
    });
  }
});

// src/serialization/resources/group/resources/common/types/Profile.ts
var Profile;
var init_Profile = __esm({
  "src/serialization/resources/group/resources/common/types/Profile.ts"() {
    "use strict";
    init_core();
    Profile = schemas_exports.object({
      groupId: schemas_exports.property("group_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      avatarUrl: schemas_exports.property("avatar_url", schemas_exports.string().optional()),
      external: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.ExternalLinks),
      isDeveloper: schemas_exports.property("is_developer", schemas_exports.boolean().optional()),
      bio: schemas_exports.string(),
      isCurrentIdentityMember: schemas_exports.property(
        "is_current_identity_member",
        schemas_exports.boolean().optional()
      ),
      publicity: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Publicity),
      memberCount: schemas_exports.property("member_count", schemas_exports.number().optional()),
      members: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Member)
      ),
      joinRequests: schemas_exports.property(
        "join_requests",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.JoinRequest)
        )
      ),
      isCurrentIdentityRequestingJoin: schemas_exports.property(
        "is_current_identity_requesting_join",
        schemas_exports.boolean().optional()
      ),
      ownerIdentityId: schemas_exports.property("owner_identity_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/group/resources/common/types/BannedIdentity.ts
var BannedIdentity;
var init_BannedIdentity = __esm({
  "src/serialization/resources/group/resources/common/types/BannedIdentity.ts"() {
    "use strict";
    init_core();
    BannedIdentity = schemas_exports.object({
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle),
      banTs: schemas_exports.property("ban_ts", schemas_exports.date())
    });
  }
});

// src/serialization/resources/group/resources/common/types/index.ts
var init_types34 = __esm({
  "src/serialization/resources/group/resources/common/types/index.ts"() {
    "use strict";
    init_Summary2();
    init_Publicity();
    init_Handle();
    init_ExternalLinks();
    init_JoinRequest();
    init_Member();
    init_Profile();
    init_BannedIdentity();
  }
});

// src/serialization/resources/group/resources/common/index.ts
var common_exports3 = {};
__export(common_exports3, {
  BannedIdentity: () => BannedIdentity,
  ExternalLinks: () => ExternalLinks,
  Handle: () => Handle,
  JoinRequest: () => JoinRequest,
  Member: () => Member,
  Profile: () => Profile,
  Publicity: () => Publicity,
  Summary: () => Summary2
});
var init_common3 = __esm({
  "src/serialization/resources/group/resources/common/index.ts"() {
    "use strict";
    init_types34();
  }
});

// src/serialization/resources/group/resources/invites/types/GetInviteResponse.ts
var GetInviteResponse;
var init_GetInviteResponse = __esm({
  "src/serialization/resources/group/resources/invites/types/GetInviteResponse.ts"() {
    "use strict";
    init_core();
    GetInviteResponse = schemas_exports.object({
      group: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Handle)
    });
  }
});

// src/serialization/resources/group/resources/invites/types/ConsumeInviteResponse.ts
var ConsumeInviteResponse;
var init_ConsumeInviteResponse = __esm({
  "src/serialization/resources/group/resources/invites/types/ConsumeInviteResponse.ts"() {
    "use strict";
    init_core();
    ConsumeInviteResponse = schemas_exports.object({
      groupId: schemas_exports.property("group_id", schemas_exports.string().optional())
    });
  }
});

// src/serialization/resources/group/resources/invites/types/CreateInviteRequest.ts
var CreateInviteRequest;
var init_CreateInviteRequest = __esm({
  "src/serialization/resources/group/resources/invites/types/CreateInviteRequest.ts"() {
    "use strict";
    init_core();
    CreateInviteRequest = schemas_exports.object({
      ttl: schemas_exports.number().optional(),
      useCount: schemas_exports.property("use_count", schemas_exports.number().optional())
    });
  }
});

// src/serialization/resources/group/resources/invites/types/CreateInviteResponse.ts
var CreateInviteResponse;
var init_CreateInviteResponse = __esm({
  "src/serialization/resources/group/resources/invites/types/CreateInviteResponse.ts"() {
    "use strict";
    init_core();
    CreateInviteResponse = schemas_exports.object({
      code: schemas_exports.string()
    });
  }
});

// src/serialization/resources/group/resources/invites/types/index.ts
var init_types35 = __esm({
  "src/serialization/resources/group/resources/invites/types/index.ts"() {
    "use strict";
    init_GetInviteResponse();
    init_ConsumeInviteResponse();
    init_CreateInviteRequest();
    init_CreateInviteResponse();
  }
});

// src/serialization/resources/group/resources/invites/index.ts
var invites_exports = {};
__export(invites_exports, {
  ConsumeInviteResponse: () => ConsumeInviteResponse,
  CreateInviteRequest: () => CreateInviteRequest,
  CreateInviteResponse: () => CreateInviteResponse,
  GetInviteResponse: () => GetInviteResponse
});
var init_invites = __esm({
  "src/serialization/resources/group/resources/invites/index.ts"() {
    "use strict";
    init_types35();
  }
});

// src/serialization/resources/group/resources/joinRequests/types/ResolveJoinRequestRequest.ts
var ResolveJoinRequestRequest;
var init_ResolveJoinRequestRequest = __esm({
  "src/serialization/resources/group/resources/joinRequests/types/ResolveJoinRequestRequest.ts"() {
    "use strict";
    init_core();
    ResolveJoinRequestRequest = schemas_exports.object({
      resolution: schemas_exports.boolean().optional()
    });
  }
});

// src/serialization/resources/group/resources/joinRequests/types/index.ts
var init_types36 = __esm({
  "src/serialization/resources/group/resources/joinRequests/types/index.ts"() {
    "use strict";
    init_ResolveJoinRequestRequest();
  }
});

// src/serialization/resources/group/resources/joinRequests/index.ts
var joinRequests_exports = {};
__export(joinRequests_exports, {
  ResolveJoinRequestRequest: () => ResolveJoinRequestRequest
});
var init_joinRequests = __esm({
  "src/serialization/resources/group/resources/joinRequests/index.ts"() {
    "use strict";
    init_types36();
  }
});

// src/serialization/resources/group/resources/index.ts
var init_resources8 = __esm({
  "src/serialization/resources/group/resources/index.ts"() {
    "use strict";
    init_common3();
    init_types34();
    init_invites();
    init_types35();
    init_joinRequests();
    init_types36();
  }
});

// src/serialization/resources/group/index.ts
var group_exports = {};
__export(group_exports, {
  BannedIdentity: () => BannedIdentity,
  ConsumeInviteResponse: () => ConsumeInviteResponse,
  CreateInviteRequest: () => CreateInviteRequest,
  CreateInviteResponse: () => CreateInviteResponse,
  CreateRequest: () => CreateRequest,
  CreateResponse: () => CreateResponse,
  ExternalLinks: () => ExternalLinks,
  GetBansResponse: () => GetBansResponse,
  GetInviteResponse: () => GetInviteResponse,
  GetJoinRequestsResponse: () => GetJoinRequestsResponse,
  GetMembersResponse: () => GetMembersResponse,
  GetProfileResponse: () => GetProfileResponse,
  GetSummaryResponse: () => GetSummaryResponse,
  Handle: () => Handle,
  JoinRequest: () => JoinRequest,
  ListSuggestedResponse: () => ListSuggestedResponse,
  Member: () => Member,
  PrepareAvatarUploadRequest: () => PrepareAvatarUploadRequest,
  PrepareAvatarUploadResponse: () => PrepareAvatarUploadResponse,
  Profile: () => Profile,
  Publicity: () => Publicity,
  ResolveJoinRequestRequest: () => ResolveJoinRequestRequest,
  SearchResponse: () => SearchResponse,
  Summary: () => Summary2,
  TransferOwnershipRequest: () => TransferOwnershipRequest,
  UpdateProfileRequest: () => UpdateProfileRequest,
  ValidateProfileRequest: () => ValidateProfileRequest,
  ValidateProfileResponse: () => ValidateProfileResponse,
  common: () => common_exports3,
  invites: () => invites_exports,
  joinRequests: () => joinRequests_exports
});
var init_group = __esm({
  "src/serialization/resources/group/index.ts"() {
    "use strict";
    init_types33();
    init_resources8();
  }
});

// src/serialization/resources/identity/types/SetupResponse.ts
var SetupResponse;
var init_SetupResponse = __esm({
  "src/serialization/resources/identity/types/SetupResponse.ts"() {
    "use strict";
    init_core();
    SetupResponse = schemas_exports.object({
      identityToken: schemas_exports.property(
        "identity_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
      ),
      identityTokenExpireTs: schemas_exports.property("identity_token_expire_ts", schemas_exports.date()),
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Profile),
      gameId: schemas_exports.property("game_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/identity/types/GetProfileResponse.ts
var GetProfileResponse2;
var init_GetProfileResponse2 = __esm({
  "src/serialization/resources/identity/types/GetProfileResponse.ts"() {
    "use strict";
    init_core();
    GetProfileResponse2 = schemas_exports.object({
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Profile),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/GetHandlesResponse.ts
var GetHandlesResponse;
var init_GetHandlesResponse = __esm({
  "src/serialization/resources/identity/types/GetHandlesResponse.ts"() {
    "use strict";
    init_core();
    GetHandlesResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/GetSummariesResponse.ts
var GetSummariesResponse;
var init_GetSummariesResponse = __esm({
  "src/serialization/resources/identity/types/GetSummariesResponse.ts"() {
    "use strict";
    init_core();
    GetSummariesResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Summary)
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/ValidateProfileResponse.ts
var ValidateProfileResponse2;
var init_ValidateProfileResponse2 = __esm({
  "src/serialization/resources/identity/types/ValidateProfileResponse.ts"() {
    "use strict";
    init_core();
    ValidateProfileResponse2 = schemas_exports.object({
      errors: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ValidationError)
      )
    });
  }
});

// src/serialization/resources/identity/types/SearchResponse.ts
var SearchResponse2;
var init_SearchResponse2 = __esm({
  "src/serialization/resources/identity/types/SearchResponse.ts"() {
    "use strict";
    init_core();
    SearchResponse2 = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      anchor: schemas_exports.string().optional()
    });
  }
});

// src/serialization/resources/identity/types/PrepareAvatarUploadResponse.ts
var PrepareAvatarUploadResponse2;
var init_PrepareAvatarUploadResponse2 = __esm({
  "src/serialization/resources/identity/types/PrepareAvatarUploadResponse.ts"() {
    "use strict";
    init_core();
    PrepareAvatarUploadResponse2 = schemas_exports.object({
      uploadId: schemas_exports.property("upload_id", schemas_exports.string()),
      presignedRequest: schemas_exports.property(
        "presigned_request",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).upload.PresignedRequest)
      )
    });
  }
});

// src/serialization/resources/identity/types/ListFollowersResponse.ts
var ListFollowersResponse;
var init_ListFollowersResponse = __esm({
  "src/serialization/resources/identity/types/ListFollowersResponse.ts"() {
    "use strict";
    init_core();
    ListFollowersResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/ListFollowingResponse.ts
var ListFollowingResponse;
var init_ListFollowingResponse = __esm({
  "src/serialization/resources/identity/types/ListFollowingResponse.ts"() {
    "use strict";
    init_core();
    ListFollowingResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/ListRecentFollowersResponse.ts
var ListRecentFollowersResponse;
var init_ListRecentFollowersResponse = __esm({
  "src/serialization/resources/identity/types/ListRecentFollowersResponse.ts"() {
    "use strict";
    init_core();
    ListRecentFollowersResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/ListFriendsResponse.ts
var ListFriendsResponse;
var init_ListFriendsResponse = __esm({
  "src/serialization/resources/identity/types/ListFriendsResponse.ts"() {
    "use strict";
    init_core();
    ListFriendsResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      anchor: schemas_exports.string().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/types/ListMutualFriendsResponse.ts
var ListMutualFriendsResponse;
var init_ListMutualFriendsResponse = __esm({
  "src/serialization/resources/identity/types/ListMutualFriendsResponse.ts"() {
    "use strict";
    init_core();
    ListMutualFriendsResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      anchor: schemas_exports.string().optional()
    });
  }
});

// src/serialization/resources/identity/types/index.ts
var init_types37 = __esm({
  "src/serialization/resources/identity/types/index.ts"() {
    "use strict";
    init_SetupResponse();
    init_GetProfileResponse2();
    init_GetHandlesResponse();
    init_GetSummariesResponse();
    init_ValidateProfileResponse2();
    init_SearchResponse2();
    init_PrepareAvatarUploadResponse2();
    init_ListFollowersResponse();
    init_ListFollowingResponse();
    init_ListRecentFollowersResponse();
    init_ListFriendsResponse();
    init_ListMutualFriendsResponse();
  }
});

// src/serialization/resources/identity/resources/activities/types/ListActivitiesResponse.ts
var ListActivitiesResponse;
var init_ListActivitiesResponse = __esm({
  "src/serialization/resources/identity/resources/activities/types/ListActivitiesResponse.ts"() {
    "use strict";
    init_core();
    ListActivitiesResponse = schemas_exports.object({
      identities: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      games: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Summary)
      ),
      suggestedGroups: schemas_exports.property(
        "suggested_groups",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Summary)
        )
      ),
      suggestedPlayers: schemas_exports.property(
        "suggested_players",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
        )
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/resources/activities/types/index.ts
var init_types38 = __esm({
  "src/serialization/resources/identity/resources/activities/types/index.ts"() {
    "use strict";
    init_ListActivitiesResponse();
  }
});

// src/serialization/resources/identity/resources/activities/index.ts
var activities_exports = {};
__export(activities_exports, {
  ListActivitiesResponse: () => ListActivitiesResponse
});
var init_activities = __esm({
  "src/serialization/resources/identity/resources/activities/index.ts"() {
    "use strict";
    init_types38();
  }
});

// src/serialization/resources/identity/resources/common/types/GlobalEvent.ts
var GlobalEvent;
var init_GlobalEvent = __esm({
  "src/serialization/resources/identity/resources/common/types/GlobalEvent.ts"() {
    "use strict";
    init_core();
    GlobalEvent = schemas_exports.object({
      ts: schemas_exports.date(),
      kind: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GlobalEventKind),
      notification: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GlobalEventNotification).optional()
    });
  }
});

// src/serialization/resources/identity/resources/common/types/GlobalEventKind.ts
var GlobalEventKind;
var init_GlobalEventKind = __esm({
  "src/serialization/resources/identity/resources/common/types/GlobalEventKind.ts"() {
    "use strict";
    init_core();
    GlobalEventKind = schemas_exports.object({
      identityUpdate: schemas_exports.property(
        "identity_update",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GlobalEventIdentityUpdate).optional()
      ),
      matchmakerLobbyJoin: schemas_exports.property(
        "matchmaker_lobby_join",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GlobalEventMatchmakerLobbyJoin).optional()
      )
    });
  }
});

// src/serialization/resources/identity/resources/common/types/GlobalEventNotification.ts
var GlobalEventNotification;
var init_GlobalEventNotification = __esm({
  "src/serialization/resources/identity/resources/common/types/GlobalEventNotification.ts"() {
    "use strict";
    init_core();
    GlobalEventNotification = schemas_exports.object({
      title: schemas_exports.string(),
      description: schemas_exports.string(),
      thumbnailUrl: schemas_exports.property("thumbnail_url", schemas_exports.string()),
      url: schemas_exports.string()
    });
  }
});

// src/serialization/resources/identity/resources/common/types/GlobalEventIdentityUpdate.ts
var GlobalEventIdentityUpdate;
var init_GlobalEventIdentityUpdate = __esm({
  "src/serialization/resources/identity/resources/common/types/GlobalEventIdentityUpdate.ts"() {
    "use strict";
    init_core();
    GlobalEventIdentityUpdate = schemas_exports.object({
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Profile)
    });
  }
});

// src/serialization/resources/identity/resources/common/types/GlobalEventMatchmakerLobbyJoin.ts
var GlobalEventMatchmakerLobbyJoin;
var init_GlobalEventMatchmakerLobbyJoin = __esm({
  "src/serialization/resources/identity/resources/common/types/GlobalEventMatchmakerLobbyJoin.ts"() {
    "use strict";
    init_core();
    GlobalEventMatchmakerLobbyJoin = schemas_exports.object({
      lobby: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinLobby),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPort)
      ),
      player: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPlayer)
    });
  }
});

// src/serialization/resources/identity/resources/common/types/UpdateGameActivity.ts
var UpdateGameActivity;
var init_UpdateGameActivity = __esm({
  "src/serialization/resources/identity/resources/common/types/UpdateGameActivity.ts"() {
    "use strict";
    init_core();
    UpdateGameActivity = schemas_exports.object({
      message: schemas_exports.string().optional(),
      publicMetadata: schemas_exports.property("public_metadata", schemas_exports.unknown().optional()),
      mutualMetadata: schemas_exports.property("mutual_metadata", schemas_exports.unknown().optional())
    });
  }
});

// src/serialization/resources/identity/resources/common/types/Handle.ts
var Handle2;
var init_Handle2 = __esm({
  "src/serialization/resources/identity/resources/common/types/Handle.ts"() {
    "use strict";
    init_core();
    Handle2 = schemas_exports.object({
      identityId: schemas_exports.property("identity_id", schemas_exports.string()),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      accountNumber: schemas_exports.property(
        "account_number",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).AccountNumber)
      ),
      avatarUrl: schemas_exports.property("avatar_url", schemas_exports.string()),
      presence: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Presence).optional(),
      isRegistered: schemas_exports.property("is_registered", schemas_exports.boolean()),
      external: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.ExternalLinks)
    });
  }
});

// src/serialization/resources/identity/resources/common/types/Summary.ts
var Summary3;
var init_Summary3 = __esm({
  "src/serialization/resources/identity/resources/common/types/Summary.ts"() {
    "use strict";
    init_core();
    Summary3 = schemas_exports.object({
      identityId: schemas_exports.property("identity_id", schemas_exports.string()),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      accountNumber: schemas_exports.property(
        "account_number",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).AccountNumber)
      ),
      avatarUrl: schemas_exports.property("avatar_url", schemas_exports.string()),
      presence: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Presence).optional(),
      isRegistered: schemas_exports.property("is_registered", schemas_exports.boolean()),
      external: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.ExternalLinks),
      following: schemas_exports.boolean(),
      isFollowingMe: schemas_exports.property("is_following_me", schemas_exports.boolean()),
      isMutualFollowing: schemas_exports.property("is_mutual_following", schemas_exports.boolean())
    });
  }
});

// src/serialization/resources/identity/resources/common/types/Profile.ts
var Profile2;
var init_Profile2 = __esm({
  "src/serialization/resources/identity/resources/common/types/Profile.ts"() {
    "use strict";
    init_core();
    Profile2 = schemas_exports.object({
      identityId: schemas_exports.property("identity_id", schemas_exports.string()),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      accountNumber: schemas_exports.property(
        "account_number",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).AccountNumber)
      ),
      avatarUrl: schemas_exports.property("avatar_url", schemas_exports.string()),
      presence: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Presence).optional(),
      isRegistered: schemas_exports.property("is_registered", schemas_exports.boolean()),
      external: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.ExternalLinks),
      isAdmin: schemas_exports.property("is_admin", schemas_exports.boolean()),
      isGameLinked: schemas_exports.property("is_game_linked", schemas_exports.boolean().optional()),
      devState: schemas_exports.property(
        "dev_state",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.DevState).optional()
      ),
      followerCount: schemas_exports.property("follower_count", schemas_exports.number()),
      followingCount: schemas_exports.property("following_count", schemas_exports.number()),
      following: schemas_exports.boolean(),
      isFollowingMe: schemas_exports.property("is_following_me", schemas_exports.boolean()),
      isMutualFollowing: schemas_exports.property("is_mutual_following", schemas_exports.boolean()),
      joinTs: schemas_exports.property("join_ts", schemas_exports.date()),
      bio: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Bio),
      linkedAccounts: schemas_exports.property(
        "linked_accounts",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.LinkedAccount)
        )
      ),
      groups: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Group)
      ),
      games: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.StatSummary)
      ),
      awaitingDeletion: schemas_exports.property("awaiting_deletion", schemas_exports.boolean().optional())
    });
  }
});

// src/serialization/resources/identity/resources/common/types/ExternalLinks.ts
var ExternalLinks2;
var init_ExternalLinks2 = __esm({
  "src/serialization/resources/identity/resources/common/types/ExternalLinks.ts"() {
    "use strict";
    init_core();
    ExternalLinks2 = schemas_exports.object({
      profile: schemas_exports.string(),
      settings: schemas_exports.string().optional()
    });
  }
});

// src/serialization/resources/identity/resources/common/types/Presence.ts
var Presence;
var init_Presence = __esm({
  "src/serialization/resources/identity/resources/common/types/Presence.ts"() {
    "use strict";
    init_core();
    Presence = schemas_exports.object({
      updateTs: schemas_exports.property("update_ts", schemas_exports.date()),
      status: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Status),
      gameActivity: schemas_exports.property(
        "game_activity",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GameActivity).optional()
      )
    });
  }
});

// src/serialization/resources/identity/resources/common/types/Status.ts
var Status;
var init_Status = __esm({
  "src/serialization/resources/identity/resources/common/types/Status.ts"() {
    "use strict";
    init_core();
    Status = schemas_exports.enum_(["online", "away", "offline"]);
  }
});

// src/serialization/resources/identity/resources/common/types/GameActivity.ts
var GameActivity;
var init_GameActivity = __esm({
  "src/serialization/resources/identity/resources/common/types/GameActivity.ts"() {
    "use strict";
    init_core();
    GameActivity = schemas_exports.object({
      game: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Handle),
      message: schemas_exports.string(),
      publicMetadata: schemas_exports.property("public_metadata", schemas_exports.unknown().optional()),
      mutualMetadata: schemas_exports.property("mutual_metadata", schemas_exports.unknown().optional())
    });
  }
});

// src/serialization/resources/identity/resources/common/types/Group.ts
var Group;
var init_Group = __esm({
  "src/serialization/resources/identity/resources/common/types/Group.ts"() {
    "use strict";
    init_core();
    Group = schemas_exports.object({
      group: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Handle)
    });
  }
});

// src/serialization/resources/identity/resources/common/types/LinkedAccount.ts
var LinkedAccount;
var init_LinkedAccount = __esm({
  "src/serialization/resources/identity/resources/common/types/LinkedAccount.ts"() {
    "use strict";
    init_core();
    LinkedAccount = schemas_exports.object({
      email: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.EmailLinkedAccount).optional(),
      accessToken: schemas_exports.property(
        "access_token",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.AccessTokenLinkedAccount).optional()
      )
    });
  }
});

// src/serialization/resources/identity/resources/common/types/EmailLinkedAccount.ts
var EmailLinkedAccount;
var init_EmailLinkedAccount = __esm({
  "src/serialization/resources/identity/resources/common/types/EmailLinkedAccount.ts"() {
    "use strict";
    init_core();
    EmailLinkedAccount = schemas_exports.object({
      email: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Email)
    });
  }
});

// src/serialization/resources/identity/resources/common/types/AccessTokenLinkedAccount.ts
var AccessTokenLinkedAccount;
var init_AccessTokenLinkedAccount = __esm({
  "src/serialization/resources/identity/resources/common/types/AccessTokenLinkedAccount.ts"() {
    "use strict";
    init_core();
    AccessTokenLinkedAccount = schemas_exports.object({
      name: schemas_exports.string()
    });
  }
});

// src/serialization/resources/identity/resources/common/types/DevState.ts
var DevState;
var init_DevState = __esm({
  "src/serialization/resources/identity/resources/common/types/DevState.ts"() {
    "use strict";
    init_core();
    DevState = schemas_exports.enum_(["inactive", "pending", "accepted"]);
  }
});

// src/serialization/resources/identity/resources/common/types/GameLinkStatus.ts
var GameLinkStatus;
var init_GameLinkStatus = __esm({
  "src/serialization/resources/identity/resources/common/types/GameLinkStatus.ts"() {
    "use strict";
    init_core();
    GameLinkStatus = schemas_exports.enum_(["incomplete", "complete", "cancelled"]);
  }
});

// src/serialization/resources/identity/resources/common/types/index.ts
var init_types39 = __esm({
  "src/serialization/resources/identity/resources/common/types/index.ts"() {
    "use strict";
    init_GlobalEvent();
    init_GlobalEventKind();
    init_GlobalEventNotification();
    init_GlobalEventIdentityUpdate();
    init_GlobalEventMatchmakerLobbyJoin();
    init_UpdateGameActivity();
    init_Handle2();
    init_Summary3();
    init_Profile2();
    init_ExternalLinks2();
    init_Presence();
    init_Status();
    init_GameActivity();
    init_Group();
    init_LinkedAccount();
    init_EmailLinkedAccount();
    init_AccessTokenLinkedAccount();
    init_DevState();
    init_GameLinkStatus();
  }
});

// src/serialization/resources/identity/resources/common/index.ts
var common_exports4 = {};
__export(common_exports4, {
  AccessTokenLinkedAccount: () => AccessTokenLinkedAccount,
  DevState: () => DevState,
  EmailLinkedAccount: () => EmailLinkedAccount,
  ExternalLinks: () => ExternalLinks2,
  GameActivity: () => GameActivity,
  GameLinkStatus: () => GameLinkStatus,
  GlobalEvent: () => GlobalEvent,
  GlobalEventIdentityUpdate: () => GlobalEventIdentityUpdate,
  GlobalEventKind: () => GlobalEventKind,
  GlobalEventMatchmakerLobbyJoin: () => GlobalEventMatchmakerLobbyJoin,
  GlobalEventNotification: () => GlobalEventNotification,
  Group: () => Group,
  Handle: () => Handle2,
  LinkedAccount: () => LinkedAccount,
  Presence: () => Presence,
  Profile: () => Profile2,
  Status: () => Status,
  Summary: () => Summary3,
  UpdateGameActivity: () => UpdateGameActivity
});
var init_common4 = __esm({
  "src/serialization/resources/identity/resources/common/index.ts"() {
    "use strict";
    init_types39();
  }
});

// src/serialization/resources/identity/resources/events/types/WatchEventsResponse.ts
var WatchEventsResponse;
var init_WatchEventsResponse = __esm({
  "src/serialization/resources/identity/resources/events/types/WatchEventsResponse.ts"() {
    "use strict";
    init_core();
    WatchEventsResponse = schemas_exports.object({
      events: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GlobalEvent)
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/resources/events/types/index.ts
var init_types40 = __esm({
  "src/serialization/resources/identity/resources/events/types/index.ts"() {
    "use strict";
    init_WatchEventsResponse();
  }
});

// src/serialization/resources/identity/resources/events/index.ts
var events_exports = {};
__export(events_exports, {
  WatchEventsResponse: () => WatchEventsResponse
});
var init_events = __esm({
  "src/serialization/resources/identity/resources/events/index.ts"() {
    "use strict";
    init_types40();
  }
});

// src/serialization/resources/identity/resources/links/types/PrepareGameLinkResponse.ts
var PrepareGameLinkResponse;
var init_PrepareGameLinkResponse = __esm({
  "src/serialization/resources/identity/resources/links/types/PrepareGameLinkResponse.ts"() {
    "use strict";
    init_core();
    PrepareGameLinkResponse = schemas_exports.object({
      identityLinkToken: schemas_exports.property("identity_link_token", schemas_exports.string()),
      identityLinkUrl: schemas_exports.property("identity_link_url", schemas_exports.string()),
      expireTs: schemas_exports.property("expire_ts", schemas_exports.date())
    });
  }
});

// src/serialization/resources/identity/resources/links/types/GetGameLinkResponse.ts
var GetGameLinkResponse;
var init_GetGameLinkResponse = __esm({
  "src/serialization/resources/identity/resources/links/types/GetGameLinkResponse.ts"() {
    "use strict";
    init_core();
    GetGameLinkResponse = schemas_exports.object({
      status: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GameLinkStatus),
      game: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Handle),
      currentIdentity: schemas_exports.property(
        "current_identity",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Handle)
      ),
      newIdentity: schemas_exports.property(
        "new_identity",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.GetGameLinkNewIdentity).optional()
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/identity/resources/links/types/GetGameLinkNewIdentity.ts
var GetGameLinkNewIdentity;
var init_GetGameLinkNewIdentity = __esm({
  "src/serialization/resources/identity/resources/links/types/GetGameLinkNewIdentity.ts"() {
    "use strict";
    init_core();
    GetGameLinkNewIdentity = schemas_exports.object({
      identityToken: schemas_exports.property(
        "identity_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
      ),
      identityTokenExpireTs: schemas_exports.property("identity_token_expire_ts", schemas_exports.date()),
      identity: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Profile)
    });
  }
});

// src/serialization/resources/identity/resources/links/types/CompleteGameLinkRequest.ts
var CompleteGameLinkRequest;
var init_CompleteGameLinkRequest = __esm({
  "src/serialization/resources/identity/resources/links/types/CompleteGameLinkRequest.ts"() {
    "use strict";
    init_core();
    CompleteGameLinkRequest = schemas_exports.object({
      identityLinkToken: schemas_exports.property(
        "identity_link_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
      )
    });
  }
});

// src/serialization/resources/identity/resources/links/types/CancelGameLinkRequest.ts
var CancelGameLinkRequest;
var init_CancelGameLinkRequest = __esm({
  "src/serialization/resources/identity/resources/links/types/CancelGameLinkRequest.ts"() {
    "use strict";
    init_core();
    CancelGameLinkRequest = schemas_exports.object({
      identityLinkToken: schemas_exports.property(
        "identity_link_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
      )
    });
  }
});

// src/serialization/resources/identity/resources/links/types/index.ts
var init_types41 = __esm({
  "src/serialization/resources/identity/resources/links/types/index.ts"() {
    "use strict";
    init_PrepareGameLinkResponse();
    init_GetGameLinkResponse();
    init_GetGameLinkNewIdentity();
    init_CompleteGameLinkRequest();
    init_CancelGameLinkRequest();
  }
});

// src/serialization/resources/identity/resources/links/index.ts
var links_exports2 = {};
__export(links_exports2, {
  CancelGameLinkRequest: () => CancelGameLinkRequest,
  CompleteGameLinkRequest: () => CompleteGameLinkRequest,
  GetGameLinkNewIdentity: () => GetGameLinkNewIdentity,
  GetGameLinkResponse: () => GetGameLinkResponse,
  PrepareGameLinkResponse: () => PrepareGameLinkResponse
});
var init_links2 = __esm({
  "src/serialization/resources/identity/resources/links/index.ts"() {
    "use strict";
    init_types41();
  }
});

// src/serialization/resources/identity/resources/index.ts
var init_resources9 = __esm({
  "src/serialization/resources/identity/resources/index.ts"() {
    "use strict";
    init_activities();
    init_types38();
    init_common4();
    init_types39();
    init_events();
    init_types40();
    init_links2();
    init_types41();
  }
});

// src/serialization/resources/identity/client/requests/SetupRequest.ts
var SetupRequest;
var init_SetupRequest = __esm({
  "src/serialization/resources/identity/client/requests/SetupRequest.ts"() {
    "use strict";
    init_core();
    SetupRequest = schemas_exports.object({
      existingIdentityToken: schemas_exports.property(
        "existing_identity_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt).optional()
      )
    });
  }
});

// src/serialization/resources/identity/client/requests/UpdateProfileRequest.ts
var UpdateProfileRequest2;
var init_UpdateProfileRequest2 = __esm({
  "src/serialization/resources/identity/client/requests/UpdateProfileRequest.ts"() {
    "use strict";
    init_core();
    UpdateProfileRequest2 = schemas_exports.object({
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName).optional()
      ),
      accountNumber: schemas_exports.property(
        "account_number",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).AccountNumber).optional()
      ),
      bio: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Bio).optional()
    });
  }
});

// src/serialization/resources/identity/client/requests/ValidateProfileRequest.ts
var ValidateProfileRequest2;
var init_ValidateProfileRequest2 = __esm({
  "src/serialization/resources/identity/client/requests/ValidateProfileRequest.ts"() {
    "use strict";
    init_core();
    ValidateProfileRequest2 = schemas_exports.object({
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName).optional()
      ),
      accountNumber: schemas_exports.property(
        "account_number",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).AccountNumber).optional()
      ),
      bio: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Bio).optional()
    });
  }
});

// src/serialization/resources/identity/client/requests/SetGameActivityRequest.ts
var SetGameActivityRequest;
var init_SetGameActivityRequest = __esm({
  "src/serialization/resources/identity/client/requests/SetGameActivityRequest.ts"() {
    "use strict";
    init_core();
    SetGameActivityRequest = schemas_exports.object({
      gameActivity: schemas_exports.property(
        "game_activity",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.UpdateGameActivity)
      )
    });
  }
});

// src/serialization/resources/identity/client/requests/UpdateStatusRequest.ts
var UpdateStatusRequest;
var init_UpdateStatusRequest = __esm({
  "src/serialization/resources/identity/client/requests/UpdateStatusRequest.ts"() {
    "use strict";
    init_core();
    UpdateStatusRequest = schemas_exports.object({
      status: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).identity.Status)
    });
  }
});

// src/serialization/resources/identity/client/requests/PrepareAvatarUploadRequest.ts
var PrepareAvatarUploadRequest2;
var init_PrepareAvatarUploadRequest2 = __esm({
  "src/serialization/resources/identity/client/requests/PrepareAvatarUploadRequest.ts"() {
    "use strict";
    init_core();
    PrepareAvatarUploadRequest2 = schemas_exports.object({
      path: schemas_exports.string(),
      mime: schemas_exports.string(),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/identity/client/requests/SignupForBetaRequest.ts
var SignupForBetaRequest;
var init_SignupForBetaRequest = __esm({
  "src/serialization/resources/identity/client/requests/SignupForBetaRequest.ts"() {
    "use strict";
    init_core();
    SignupForBetaRequest = schemas_exports.object({
      name: schemas_exports.string(),
      companyName: schemas_exports.property("company_name", schemas_exports.string().optional()),
      companySize: schemas_exports.property("company_size", schemas_exports.string()),
      preferredTools: schemas_exports.property("preferred_tools", schemas_exports.string()),
      goals: schemas_exports.string()
    });
  }
});

// src/serialization/resources/identity/client/requests/ReportRequest.ts
var ReportRequest;
var init_ReportRequest = __esm({
  "src/serialization/resources/identity/client/requests/ReportRequest.ts"() {
    "use strict";
    init_core();
    ReportRequest = schemas_exports.object({
      reason: schemas_exports.string().optional()
    });
  }
});

// src/serialization/resources/identity/client/requests/index.ts
var init_requests = __esm({
  "src/serialization/resources/identity/client/requests/index.ts"() {
    "use strict";
    init_SetupRequest();
    init_UpdateProfileRequest2();
    init_ValidateProfileRequest2();
    init_SetGameActivityRequest();
    init_UpdateStatusRequest();
    init_PrepareAvatarUploadRequest2();
    init_SignupForBetaRequest();
    init_ReportRequest();
  }
});

// src/serialization/resources/identity/client/index.ts
var init_client = __esm({
  "src/serialization/resources/identity/client/index.ts"() {
    "use strict";
    init_requests();
  }
});

// src/serialization/resources/identity/index.ts
var identity_exports2 = {};
__export(identity_exports2, {
  AccessTokenLinkedAccount: () => AccessTokenLinkedAccount,
  CancelGameLinkRequest: () => CancelGameLinkRequest,
  CompleteGameLinkRequest: () => CompleteGameLinkRequest,
  DevState: () => DevState,
  EmailLinkedAccount: () => EmailLinkedAccount,
  ExternalLinks: () => ExternalLinks2,
  GameActivity: () => GameActivity,
  GameLinkStatus: () => GameLinkStatus,
  GetGameLinkNewIdentity: () => GetGameLinkNewIdentity,
  GetGameLinkResponse: () => GetGameLinkResponse,
  GetHandlesResponse: () => GetHandlesResponse,
  GetProfileResponse: () => GetProfileResponse2,
  GetSummariesResponse: () => GetSummariesResponse,
  GlobalEvent: () => GlobalEvent,
  GlobalEventIdentityUpdate: () => GlobalEventIdentityUpdate,
  GlobalEventKind: () => GlobalEventKind,
  GlobalEventMatchmakerLobbyJoin: () => GlobalEventMatchmakerLobbyJoin,
  GlobalEventNotification: () => GlobalEventNotification,
  Group: () => Group,
  Handle: () => Handle2,
  LinkedAccount: () => LinkedAccount,
  ListActivitiesResponse: () => ListActivitiesResponse,
  ListFollowersResponse: () => ListFollowersResponse,
  ListFollowingResponse: () => ListFollowingResponse,
  ListFriendsResponse: () => ListFriendsResponse,
  ListMutualFriendsResponse: () => ListMutualFriendsResponse,
  ListRecentFollowersResponse: () => ListRecentFollowersResponse,
  PrepareAvatarUploadRequest: () => PrepareAvatarUploadRequest2,
  PrepareAvatarUploadResponse: () => PrepareAvatarUploadResponse2,
  PrepareGameLinkResponse: () => PrepareGameLinkResponse,
  Presence: () => Presence,
  Profile: () => Profile2,
  ReportRequest: () => ReportRequest,
  SearchResponse: () => SearchResponse2,
  SetGameActivityRequest: () => SetGameActivityRequest,
  SetupRequest: () => SetupRequest,
  SetupResponse: () => SetupResponse,
  SignupForBetaRequest: () => SignupForBetaRequest,
  Status: () => Status,
  Summary: () => Summary3,
  UpdateGameActivity: () => UpdateGameActivity,
  UpdateProfileRequest: () => UpdateProfileRequest2,
  UpdateStatusRequest: () => UpdateStatusRequest,
  ValidateProfileRequest: () => ValidateProfileRequest2,
  ValidateProfileResponse: () => ValidateProfileResponse2,
  WatchEventsResponse: () => WatchEventsResponse,
  activities: () => activities_exports,
  common: () => common_exports4,
  events: () => events_exports,
  links: () => links_exports2
});
var init_identity2 = __esm({
  "src/serialization/resources/identity/index.ts"() {
    "use strict";
    init_types37();
    init_resources9();
    init_client();
  }
});

// src/serialization/resources/kv/types/GetResponse.ts
var GetResponse;
var init_GetResponse = __esm({
  "src/serialization/resources/kv/types/GetResponse.ts"() {
    "use strict";
    init_core();
    GetResponse = schemas_exports.object({
      value: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Value),
      deleted: schemas_exports.boolean().optional(),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/kv/types/PutRequest.ts
var PutRequest;
var init_PutRequest = __esm({
  "src/serialization/resources/kv/types/PutRequest.ts"() {
    "use strict";
    init_core();
    PutRequest = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string().optional()),
      key: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Key),
      value: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Value)
    });
  }
});

// src/serialization/resources/kv/types/ListResponse.ts
var ListResponse;
var init_ListResponse = __esm({
  "src/serialization/resources/kv/types/ListResponse.ts"() {
    "use strict";
    init_core();
    ListResponse = schemas_exports.object({
      entries: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Entry)
      )
    });
  }
});

// src/serialization/resources/kv/types/GetBatchResponse.ts
var GetBatchResponse;
var init_GetBatchResponse = __esm({
  "src/serialization/resources/kv/types/GetBatchResponse.ts"() {
    "use strict";
    init_core();
    GetBatchResponse = schemas_exports.object({
      entries: schemas_exports.list(schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Entry)),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/kv/types/PutBatchRequest.ts
var PutBatchRequest;
var init_PutBatchRequest = __esm({
  "src/serialization/resources/kv/types/PutBatchRequest.ts"() {
    "use strict";
    init_core();
    PutBatchRequest = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string().optional()),
      entries: schemas_exports.list(schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.PutEntry))
    });
  }
});

// src/serialization/resources/kv/types/index.ts
var init_types42 = __esm({
  "src/serialization/resources/kv/types/index.ts"() {
    "use strict";
    init_GetResponse();
    init_PutRequest();
    init_ListResponse();
    init_GetBatchResponse();
    init_PutBatchRequest();
  }
});

// src/serialization/resources/kv/resources/common/types/Key.ts
var Key;
var init_Key = __esm({
  "src/serialization/resources/kv/resources/common/types/Key.ts"() {
    "use strict";
    init_core();
    Key = schemas_exports.string();
  }
});

// src/serialization/resources/kv/resources/common/types/Directory.ts
var Directory;
var init_Directory = __esm({
  "src/serialization/resources/kv/resources/common/types/Directory.ts"() {
    "use strict";
    init_core();
    Directory = schemas_exports.string();
  }
});

// src/serialization/resources/kv/resources/common/types/Value.ts
var Value;
var init_Value = __esm({
  "src/serialization/resources/kv/resources/common/types/Value.ts"() {
    "use strict";
    init_core();
    Value = schemas_exports.unknown();
  }
});

// src/serialization/resources/kv/resources/common/types/Entry.ts
var Entry;
var init_Entry = __esm({
  "src/serialization/resources/kv/resources/common/types/Entry.ts"() {
    "use strict";
    init_core();
    Entry = schemas_exports.object({
      key: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Key),
      value: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Value),
      deleted: schemas_exports.boolean().optional()
    });
  }
});

// src/serialization/resources/kv/resources/common/types/PutEntry.ts
var PutEntry;
var init_PutEntry = __esm({
  "src/serialization/resources/kv/resources/common/types/PutEntry.ts"() {
    "use strict";
    init_core();
    PutEntry = schemas_exports.object({
      key: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Key),
      value: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).kv.Value)
    });
  }
});

// src/serialization/resources/kv/resources/common/types/index.ts
var init_types43 = __esm({
  "src/serialization/resources/kv/resources/common/types/index.ts"() {
    "use strict";
    init_Key();
    init_Directory();
    init_Value();
    init_Entry();
    init_PutEntry();
  }
});

// src/serialization/resources/kv/resources/common/index.ts
var common_exports5 = {};
__export(common_exports5, {
  Directory: () => Directory,
  Entry: () => Entry,
  Key: () => Key,
  PutEntry: () => PutEntry,
  Value: () => Value
});
var init_common5 = __esm({
  "src/serialization/resources/kv/resources/common/index.ts"() {
    "use strict";
    init_types43();
  }
});

// src/serialization/resources/kv/resources/index.ts
var init_resources10 = __esm({
  "src/serialization/resources/kv/resources/index.ts"() {
    "use strict";
    init_common5();
    init_types43();
  }
});

// src/serialization/resources/kv/index.ts
var kv_exports2 = {};
__export(kv_exports2, {
  Directory: () => Directory,
  Entry: () => Entry,
  GetBatchResponse: () => GetBatchResponse,
  GetResponse: () => GetResponse,
  Key: () => Key,
  ListResponse: () => ListResponse,
  PutBatchRequest: () => PutBatchRequest,
  PutEntry: () => PutEntry,
  PutRequest: () => PutRequest,
  Value: () => Value,
  common: () => common_exports5
});
var init_kv2 = __esm({
  "src/serialization/resources/kv/index.ts"() {
    "use strict";
    init_types42();
    init_resources10();
  }
});

// src/serialization/resources/module/types/CallResponse.ts
var CallResponse;
var init_CallResponse = __esm({
  "src/serialization/resources/module/types/CallResponse.ts"() {
    "use strict";
    init_core();
    CallResponse = schemas_exports.object({
      data: schemas_exports.unknown()
    });
  }
});

// src/serialization/resources/module/types/index.ts
var init_types44 = __esm({
  "src/serialization/resources/module/types/index.ts"() {
    "use strict";
    init_CallResponse();
  }
});

// src/serialization/resources/module/client/requests/FindLobbyRequest.ts
var FindLobbyRequest;
var init_FindLobbyRequest = __esm({
  "src/serialization/resources/module/client/requests/FindLobbyRequest.ts"() {
    "use strict";
    init_core();
    FindLobbyRequest = schemas_exports.object({
      namespaceId: schemas_exports.property("namespace_id", schemas_exports.string().optional()),
      data: schemas_exports.unknown()
    });
  }
});

// src/serialization/resources/module/client/requests/index.ts
var init_requests2 = __esm({
  "src/serialization/resources/module/client/requests/index.ts"() {
    "use strict";
    init_FindLobbyRequest();
  }
});

// src/serialization/resources/module/client/index.ts
var init_client2 = __esm({
  "src/serialization/resources/module/client/index.ts"() {
    "use strict";
    init_requests2();
  }
});

// src/serialization/resources/module/index.ts
var module_exports = {};
__export(module_exports, {
  CallResponse: () => CallResponse,
  FindLobbyRequest: () => FindLobbyRequest
});
var init_module = __esm({
  "src/serialization/resources/module/index.ts"() {
    "use strict";
    init_types44();
    init_client2();
  }
});

// src/serialization/resources/auth/resources/common/types/CompleteStatus.ts
var CompleteStatus;
var init_CompleteStatus = __esm({
  "src/serialization/resources/auth/resources/common/types/CompleteStatus.ts"() {
    "use strict";
    init_core();
    CompleteStatus = schemas_exports.enum_([
      "switch_identity",
      "linked_account_added",
      "already_complete",
      "expired",
      "too_many_attempts",
      "incorrect"
    ]);
  }
});

// src/serialization/resources/auth/resources/common/types/index.ts
var init_types45 = __esm({
  "src/serialization/resources/auth/resources/common/types/index.ts"() {
    "use strict";
    init_CompleteStatus();
  }
});

// src/serialization/resources/auth/resources/common/index.ts
var common_exports6 = {};
__export(common_exports6, {
  CompleteStatus: () => CompleteStatus
});
var init_common6 = __esm({
  "src/serialization/resources/auth/resources/common/index.ts"() {
    "use strict";
    init_types45();
  }
});

// src/serialization/resources/auth/resources/identity/resources/accessToken/types/CompleteAccessTokenVerificationRequest.ts
var CompleteAccessTokenVerificationRequest;
var init_CompleteAccessTokenVerificationRequest = __esm({
  "src/serialization/resources/auth/resources/identity/resources/accessToken/types/CompleteAccessTokenVerificationRequest.ts"() {
    "use strict";
    init_core();
    CompleteAccessTokenVerificationRequest = schemas_exports.object({
      accessToken: schemas_exports.property(
        "access_token",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
      )
    });
  }
});

// src/serialization/resources/auth/resources/identity/resources/accessToken/types/index.ts
var init_types46 = __esm({
  "src/serialization/resources/auth/resources/identity/resources/accessToken/types/index.ts"() {
    "use strict";
    init_CompleteAccessTokenVerificationRequest();
  }
});

// src/serialization/resources/auth/resources/identity/resources/accessToken/index.ts
var accessToken_exports = {};
__export(accessToken_exports, {
  CompleteAccessTokenVerificationRequest: () => CompleteAccessTokenVerificationRequest
});
var init_accessToken = __esm({
  "src/serialization/resources/auth/resources/identity/resources/accessToken/index.ts"() {
    "use strict";
    init_types46();
  }
});

// src/serialization/resources/auth/resources/identity/resources/email/types/StartEmailVerificationRequest.ts
var StartEmailVerificationRequest;
var init_StartEmailVerificationRequest = __esm({
  "src/serialization/resources/auth/resources/identity/resources/email/types/StartEmailVerificationRequest.ts"() {
    "use strict";
    init_core();
    StartEmailVerificationRequest = schemas_exports.object({
      email: schemas_exports.string(),
      captcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).captcha.Config).optional(),
      gameId: schemas_exports.property("game_id", schemas_exports.string().optional())
    });
  }
});

// src/serialization/resources/auth/resources/identity/resources/email/types/StartEmailVerificationResponse.ts
var StartEmailVerificationResponse;
var init_StartEmailVerificationResponse = __esm({
  "src/serialization/resources/auth/resources/identity/resources/email/types/StartEmailVerificationResponse.ts"() {
    "use strict";
    init_core();
    StartEmailVerificationResponse = schemas_exports.object({
      verificationId: schemas_exports.property("verification_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/auth/resources/identity/resources/email/types/CompleteEmailVerificationRequest.ts
var CompleteEmailVerificationRequest;
var init_CompleteEmailVerificationRequest = __esm({
  "src/serialization/resources/auth/resources/identity/resources/email/types/CompleteEmailVerificationRequest.ts"() {
    "use strict";
    init_core();
    CompleteEmailVerificationRequest = schemas_exports.object({
      verificationId: schemas_exports.property("verification_id", schemas_exports.string()),
      code: schemas_exports.string()
    });
  }
});

// src/serialization/resources/auth/resources/identity/resources/email/types/CompleteEmailVerificationResponse.ts
var CompleteEmailVerificationResponse;
var init_CompleteEmailVerificationResponse = __esm({
  "src/serialization/resources/auth/resources/identity/resources/email/types/CompleteEmailVerificationResponse.ts"() {
    "use strict";
    init_core();
    CompleteEmailVerificationResponse = schemas_exports.object({
      status: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).auth.CompleteStatus)
    });
  }
});

// src/serialization/resources/auth/resources/identity/resources/email/types/index.ts
var init_types47 = __esm({
  "src/serialization/resources/auth/resources/identity/resources/email/types/index.ts"() {
    "use strict";
    init_StartEmailVerificationRequest();
    init_StartEmailVerificationResponse();
    init_CompleteEmailVerificationRequest();
    init_CompleteEmailVerificationResponse();
  }
});

// src/serialization/resources/auth/resources/identity/resources/email/index.ts
var email_exports = {};
__export(email_exports, {
  CompleteEmailVerificationRequest: () => CompleteEmailVerificationRequest,
  CompleteEmailVerificationResponse: () => CompleteEmailVerificationResponse,
  StartEmailVerificationRequest: () => StartEmailVerificationRequest,
  StartEmailVerificationResponse: () => StartEmailVerificationResponse
});
var init_email = __esm({
  "src/serialization/resources/auth/resources/identity/resources/email/index.ts"() {
    "use strict";
    init_types47();
  }
});

// src/serialization/resources/auth/resources/identity/resources/index.ts
var init_resources11 = __esm({
  "src/serialization/resources/auth/resources/identity/resources/index.ts"() {
    "use strict";
    init_accessToken();
    init_types46();
    init_email();
    init_types47();
  }
});

// src/serialization/resources/auth/resources/identity/index.ts
var identity_exports3 = {};
__export(identity_exports3, {
  CompleteAccessTokenVerificationRequest: () => CompleteAccessTokenVerificationRequest,
  CompleteEmailVerificationRequest: () => CompleteEmailVerificationRequest,
  CompleteEmailVerificationResponse: () => CompleteEmailVerificationResponse,
  StartEmailVerificationRequest: () => StartEmailVerificationRequest,
  StartEmailVerificationResponse: () => StartEmailVerificationResponse,
  accessToken: () => accessToken_exports,
  email: () => email_exports
});
var init_identity3 = __esm({
  "src/serialization/resources/auth/resources/identity/index.ts"() {
    "use strict";
    init_resources11();
  }
});

// src/serialization/resources/auth/resources/tokens/types/RefreshIdentityTokenRequest.ts
var RefreshIdentityTokenRequest;
var init_RefreshIdentityTokenRequest = __esm({
  "src/serialization/resources/auth/resources/tokens/types/RefreshIdentityTokenRequest.ts"() {
    "use strict";
    init_core();
    RefreshIdentityTokenRequest = schemas_exports.object({
      logout: schemas_exports.boolean().optional()
    });
  }
});

// src/serialization/resources/auth/resources/tokens/types/RefreshIdentityTokenResponse.ts
var RefreshIdentityTokenResponse;
var init_RefreshIdentityTokenResponse = __esm({
  "src/serialization/resources/auth/resources/tokens/types/RefreshIdentityTokenResponse.ts"() {
    "use strict";
    init_core();
    RefreshIdentityTokenResponse = schemas_exports.object({
      token: schemas_exports.string(),
      exp: schemas_exports.string(),
      identityId: schemas_exports.property("identity_id", schemas_exports.string())
    });
  }
});

// src/serialization/resources/auth/resources/tokens/types/index.ts
var init_types48 = __esm({
  "src/serialization/resources/auth/resources/tokens/types/index.ts"() {
    "use strict";
    init_RefreshIdentityTokenRequest();
    init_RefreshIdentityTokenResponse();
  }
});

// src/serialization/resources/auth/resources/tokens/index.ts
var tokens_exports2 = {};
__export(tokens_exports2, {
  RefreshIdentityTokenRequest: () => RefreshIdentityTokenRequest,
  RefreshIdentityTokenResponse: () => RefreshIdentityTokenResponse
});
var init_tokens2 = __esm({
  "src/serialization/resources/auth/resources/tokens/index.ts"() {
    "use strict";
    init_types48();
  }
});

// src/serialization/resources/auth/resources/index.ts
var init_resources12 = __esm({
  "src/serialization/resources/auth/resources/index.ts"() {
    "use strict";
    init_common6();
    init_types45();
    init_identity3();
    init_tokens2();
    init_types48();
  }
});

// src/serialization/resources/auth/index.ts
var auth_exports2 = {};
__export(auth_exports2, {
  CompleteStatus: () => CompleteStatus,
  RefreshIdentityTokenRequest: () => RefreshIdentityTokenRequest,
  RefreshIdentityTokenResponse: () => RefreshIdentityTokenResponse,
  common: () => common_exports6,
  identity: () => identity_exports3,
  tokens: () => tokens_exports2
});
var init_auth3 = __esm({
  "src/serialization/resources/auth/index.ts"() {
    "use strict";
    init_resources12();
  }
});

// src/serialization/resources/captcha/resources/config/types/Config.ts
var Config7;
var init_Config7 = __esm({
  "src/serialization/resources/captcha/resources/config/types/Config.ts"() {
    "use strict";
    init_core();
    Config7 = schemas_exports.object({
      hcaptcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).captcha.ConfigHcaptcha).optional(),
      turnstile: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).captcha.ConfigTurnstile).optional()
    });
  }
});

// src/serialization/resources/captcha/resources/config/types/ConfigHcaptcha.ts
var ConfigHcaptcha;
var init_ConfigHcaptcha = __esm({
  "src/serialization/resources/captcha/resources/config/types/ConfigHcaptcha.ts"() {
    "use strict";
    init_core();
    ConfigHcaptcha = schemas_exports.object({
      clientResponse: schemas_exports.property("client_response", schemas_exports.string())
    });
  }
});

// src/serialization/resources/captcha/resources/config/types/ConfigTurnstile.ts
var ConfigTurnstile;
var init_ConfigTurnstile = __esm({
  "src/serialization/resources/captcha/resources/config/types/ConfigTurnstile.ts"() {
    "use strict";
    init_core();
    ConfigTurnstile = schemas_exports.object({
      clientResponse: schemas_exports.property("client_response", schemas_exports.string())
    });
  }
});

// src/serialization/resources/captcha/resources/config/types/index.ts
var init_types49 = __esm({
  "src/serialization/resources/captcha/resources/config/types/index.ts"() {
    "use strict";
    init_Config7();
    init_ConfigHcaptcha();
    init_ConfigTurnstile();
  }
});

// src/serialization/resources/captcha/resources/config/index.ts
var config_exports = {};
__export(config_exports, {
  Config: () => Config7,
  ConfigHcaptcha: () => ConfigHcaptcha,
  ConfigTurnstile: () => ConfigTurnstile
});
var init_config = __esm({
  "src/serialization/resources/captcha/resources/config/index.ts"() {
    "use strict";
    init_types49();
  }
});

// src/serialization/resources/captcha/resources/index.ts
var init_resources13 = __esm({
  "src/serialization/resources/captcha/resources/index.ts"() {
    "use strict";
    init_config();
    init_types49();
  }
});

// src/serialization/resources/captcha/index.ts
var captcha_exports = {};
__export(captcha_exports, {
  Config: () => Config7,
  ConfigHcaptcha: () => ConfigHcaptcha,
  ConfigTurnstile: () => ConfigTurnstile,
  config: () => config_exports
});
var init_captcha = __esm({
  "src/serialization/resources/captcha/index.ts"() {
    "use strict";
    init_resources13();
  }
});

// src/serialization/resources/common/types/Identifier.ts
var Identifier;
var init_Identifier = __esm({
  "src/serialization/resources/common/types/Identifier.ts"() {
    "use strict";
    init_core();
    Identifier = schemas_exports.string();
  }
});

// src/serialization/resources/common/types/Bio.ts
var Bio;
var init_Bio = __esm({
  "src/serialization/resources/common/types/Bio.ts"() {
    "use strict";
    init_core();
    Bio = schemas_exports.string();
  }
});

// src/serialization/resources/common/types/Email.ts
var Email;
var init_Email = __esm({
  "src/serialization/resources/common/types/Email.ts"() {
    "use strict";
    init_core();
    Email = schemas_exports.string();
  }
});

// src/serialization/resources/common/types/Jwt.ts
var Jwt;
var init_Jwt = __esm({
  "src/serialization/resources/common/types/Jwt.ts"() {
    "use strict";
    init_core();
    Jwt = schemas_exports.string();
  }
});

// src/serialization/resources/common/types/WatchQuery.ts
var WatchQuery;
var init_WatchQuery = __esm({
  "src/serialization/resources/common/types/WatchQuery.ts"() {
    "use strict";
    init_core();
    WatchQuery = schemas_exports.string().optional();
  }
});

// src/serialization/resources/common/types/WatchResponse.ts
var WatchResponse;
var init_WatchResponse = __esm({
  "src/serialization/resources/common/types/WatchResponse.ts"() {
    "use strict";
    init_core();
    WatchResponse = schemas_exports.object({
      index: schemas_exports.string()
    });
  }
});

// src/serialization/resources/common/types/DisplayName.ts
var DisplayName;
var init_DisplayName = __esm({
  "src/serialization/resources/common/types/DisplayName.ts"() {
    "use strict";
    init_core();
    DisplayName = schemas_exports.string();
  }
});

// src/serialization/resources/common/types/AccountNumber.ts
var AccountNumber;
var init_AccountNumber = __esm({
  "src/serialization/resources/common/types/AccountNumber.ts"() {
    "use strict";
    init_core();
    AccountNumber = schemas_exports.number();
  }
});

// src/serialization/resources/common/types/Timestamp.ts
var Timestamp;
var init_Timestamp = __esm({
  "src/serialization/resources/common/types/Timestamp.ts"() {
    "use strict";
    init_core();
    Timestamp = schemas_exports.string();
  }
});

// src/serialization/resources/common/types/GlobalEventNotification.ts
var GlobalEventNotification2;
var init_GlobalEventNotification2 = __esm({
  "src/serialization/resources/common/types/GlobalEventNotification.ts"() {
    "use strict";
    init_core();
    GlobalEventNotification2 = schemas_exports.object({
      title: schemas_exports.string(),
      description: schemas_exports.string(),
      thumbnailUrl: schemas_exports.property("thumbnail_url", schemas_exports.string()),
      url: schemas_exports.string()
    });
  }
});

// src/serialization/resources/common/types/ValidationError.ts
var ValidationError5;
var init_ValidationError = __esm({
  "src/serialization/resources/common/types/ValidationError.ts"() {
    "use strict";
    init_core();
    ValidationError5 = schemas_exports.object({
      path: schemas_exports.list(schemas_exports.string())
    });
  }
});

// src/serialization/resources/common/types/EmptyObject.ts
var EmptyObject;
var init_EmptyObject = __esm({
  "src/serialization/resources/common/types/EmptyObject.ts"() {
    "use strict";
    init_core();
    EmptyObject = schemas_exports.object({});
  }
});

// src/serialization/resources/common/types/ErrorMetadata.ts
var ErrorMetadata;
var init_ErrorMetadata = __esm({
  "src/serialization/resources/common/types/ErrorMetadata.ts"() {
    "use strict";
    init_core();
    ErrorMetadata = schemas_exports.unknown();
  }
});

// src/serialization/resources/common/types/ErrorBody.ts
var ErrorBody;
var init_ErrorBody = __esm({
  "src/serialization/resources/common/types/ErrorBody.ts"() {
    "use strict";
    init_core();
    ErrorBody = schemas_exports.object({
      code: schemas_exports.string(),
      message: schemas_exports.string(),
      documentation: schemas_exports.string().optional(),
      metadata: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).ErrorMetadata).optional()
    });
  }
});

// src/serialization/resources/common/types/index.ts
var init_types50 = __esm({
  "src/serialization/resources/common/types/index.ts"() {
    "use strict";
    init_Identifier();
    init_Bio();
    init_Email();
    init_Jwt();
    init_WatchQuery();
    init_WatchResponse();
    init_DisplayName();
    init_AccountNumber();
    init_Timestamp();
    init_GlobalEventNotification2();
    init_ValidationError();
    init_EmptyObject();
    init_ErrorMetadata();
    init_ErrorBody();
  }
});

// src/serialization/resources/common/index.ts
var common_exports7 = {};
__export(common_exports7, {
  AccountNumber: () => AccountNumber,
  Bio: () => Bio,
  DisplayName: () => DisplayName,
  Email: () => Email,
  EmptyObject: () => EmptyObject,
  ErrorBody: () => ErrorBody,
  ErrorMetadata: () => ErrorMetadata,
  GlobalEventNotification: () => GlobalEventNotification2,
  Identifier: () => Identifier,
  Jwt: () => Jwt,
  Timestamp: () => Timestamp,
  ValidationError: () => ValidationError5,
  WatchQuery: () => WatchQuery,
  WatchResponse: () => WatchResponse
});
var init_common7 = __esm({
  "src/serialization/resources/common/index.ts"() {
    "use strict";
    init_types50();
  }
});

// src/serialization/resources/game/resources/common/types/Handle.ts
var Handle3;
var init_Handle3 = __esm({
  "src/serialization/resources/game/resources/common/types/Handle.ts"() {
    "use strict";
    init_core();
    Handle3 = schemas_exports.object({
      gameId: schemas_exports.property("game_id", schemas_exports.string()),
      nameId: schemas_exports.property(
        "name_id",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier)
      ),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      logoUrl: schemas_exports.property("logo_url", schemas_exports.string().optional()),
      bannerUrl: schemas_exports.property("banner_url", schemas_exports.string().optional())
    });
  }
});

// src/serialization/resources/game/resources/common/types/Summary.ts
var Summary4;
var init_Summary4 = __esm({
  "src/serialization/resources/game/resources/common/types/Summary.ts"() {
    "use strict";
    init_core();
    Summary4 = schemas_exports.object({
      gameId: schemas_exports.property("game_id", schemas_exports.string()),
      nameId: schemas_exports.property(
        "name_id",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier)
      ),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      logoUrl: schemas_exports.property("logo_url", schemas_exports.string().optional()),
      bannerUrl: schemas_exports.property("banner_url", schemas_exports.string().optional()),
      url: schemas_exports.string(),
      developer: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Handle),
      totalPlayerCount: schemas_exports.property("total_player_count", schemas_exports.number())
    });
  }
});

// src/serialization/resources/game/resources/common/types/Profile.ts
var Profile3;
var init_Profile3 = __esm({
  "src/serialization/resources/game/resources/common/types/Profile.ts"() {
    "use strict";
    init_core();
    Profile3 = schemas_exports.object({
      gameId: schemas_exports.property("game_id", schemas_exports.string()),
      nameId: schemas_exports.property("name_id", schemas_exports.string()),
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      logoUrl: schemas_exports.property("logo_url", schemas_exports.string().optional()),
      bannerUrl: schemas_exports.property("banner_url", schemas_exports.string().optional()),
      url: schemas_exports.string(),
      developer: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Summary),
      tags: schemas_exports.list(schemas_exports.string()),
      description: schemas_exports.string(),
      platforms: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.PlatformLink)
      ),
      recommendedGroups: schemas_exports.property(
        "recommended_groups",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).group.Summary)
        )
      ),
      identityLeaderboardCategories: schemas_exports.property(
        "identity_leaderboard_categories",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.LeaderboardCategory)
        )
      ),
      groupLeaderboardCategories: schemas_exports.property(
        "group_leaderboard_categories",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.LeaderboardCategory)
        )
      )
    });
  }
});

// src/serialization/resources/game/resources/common/types/PlatformLink.ts
var PlatformLink;
var init_PlatformLink = __esm({
  "src/serialization/resources/game/resources/common/types/PlatformLink.ts"() {
    "use strict";
    init_core();
    PlatformLink = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string()),
      url: schemas_exports.string()
    });
  }
});

// src/serialization/resources/game/resources/common/types/LeaderboardCategory.ts
var LeaderboardCategory;
var init_LeaderboardCategory = __esm({
  "src/serialization/resources/game/resources/common/types/LeaderboardCategory.ts"() {
    "use strict";
    init_core();
    LeaderboardCategory = schemas_exports.object({
      displayName: schemas_exports.property("display_name", schemas_exports.string())
    });
  }
});

// src/serialization/resources/game/resources/common/types/StatSummary.ts
var StatSummary;
var init_StatSummary = __esm({
  "src/serialization/resources/game/resources/common/types/StatSummary.ts"() {
    "use strict";
    init_core();
    StatSummary = schemas_exports.object({
      game: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Handle),
      stats: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Stat)
      )
    });
  }
});

// src/serialization/resources/game/resources/common/types/Stat.ts
var Stat;
var init_Stat = __esm({
  "src/serialization/resources/game/resources/common/types/Stat.ts"() {
    "use strict";
    init_core();
    Stat = schemas_exports.object({
      config: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.StatConfig),
      overallValue: schemas_exports.property("overall_value", schemas_exports.number())
    });
  }
});

// src/serialization/resources/game/resources/common/types/StatConfig.ts
var StatConfig;
var init_StatConfig = __esm({
  "src/serialization/resources/game/resources/common/types/StatConfig.ts"() {
    "use strict";
    init_core();
    StatConfig = schemas_exports.object({
      recordId: schemas_exports.property("record_id", schemas_exports.string()),
      iconId: schemas_exports.property("icon_id", schemas_exports.string()),
      format: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.StatFormatMethod),
      aggregation: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.StatAggregationMethod),
      sorting: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.StatSortingMethod),
      priority: schemas_exports.number(),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      ),
      postfixSingular: schemas_exports.property("postfix_singular", schemas_exports.string().optional()),
      postfixPlural: schemas_exports.property("postfix_plural", schemas_exports.string().optional()),
      prefixSingular: schemas_exports.property("prefix_singular", schemas_exports.string().optional()),
      prefixPlural: schemas_exports.property("prefix_plural", schemas_exports.string().optional())
    });
  }
});

// src/serialization/resources/game/resources/common/types/StatFormatMethod.ts
var StatFormatMethod;
var init_StatFormatMethod = __esm({
  "src/serialization/resources/game/resources/common/types/StatFormatMethod.ts"() {
    "use strict";
    init_core();
    StatFormatMethod = schemas_exports.enum_([
      "integer",
      "float_1",
      "float_2",
      "float_3",
      "duration_minute",
      "duration_second",
      "duration_hundredth_second"
    ]);
  }
});

// src/serialization/resources/game/resources/common/types/StatAggregationMethod.ts
var StatAggregationMethod;
var init_StatAggregationMethod = __esm({
  "src/serialization/resources/game/resources/common/types/StatAggregationMethod.ts"() {
    "use strict";
    init_core();
    StatAggregationMethod = schemas_exports.enum_(["sum", "average", "min", "max"]);
  }
});

// src/serialization/resources/game/resources/common/types/StatSortingMethod.ts
var StatSortingMethod;
var init_StatSortingMethod = __esm({
  "src/serialization/resources/game/resources/common/types/StatSortingMethod.ts"() {
    "use strict";
    init_core();
    StatSortingMethod = schemas_exports.enum_(["desc", "asc"]);
  }
});

// src/serialization/resources/game/resources/common/types/index.ts
var init_types51 = __esm({
  "src/serialization/resources/game/resources/common/types/index.ts"() {
    "use strict";
    init_Handle3();
    init_Summary4();
    init_Profile3();
    init_PlatformLink();
    init_LeaderboardCategory();
    init_StatSummary();
    init_Stat();
    init_StatConfig();
    init_StatFormatMethod();
    init_StatAggregationMethod();
    init_StatSortingMethod();
  }
});

// src/serialization/resources/game/resources/common/index.ts
var common_exports8 = {};
__export(common_exports8, {
  Handle: () => Handle3,
  LeaderboardCategory: () => LeaderboardCategory,
  PlatformLink: () => PlatformLink,
  Profile: () => Profile3,
  Stat: () => Stat,
  StatAggregationMethod: () => StatAggregationMethod,
  StatConfig: () => StatConfig,
  StatFormatMethod: () => StatFormatMethod,
  StatSortingMethod: () => StatSortingMethod,
  StatSummary: () => StatSummary,
  Summary: () => Summary4
});
var init_common8 = __esm({
  "src/serialization/resources/game/resources/common/index.ts"() {
    "use strict";
    init_types51();
  }
});

// src/serialization/resources/game/resources/index.ts
var init_resources14 = __esm({
  "src/serialization/resources/game/resources/index.ts"() {
    "use strict";
    init_common8();
    init_types51();
  }
});

// src/serialization/resources/game/index.ts
var game_exports = {};
__export(game_exports, {
  Handle: () => Handle3,
  LeaderboardCategory: () => LeaderboardCategory,
  PlatformLink: () => PlatformLink,
  Profile: () => Profile3,
  Stat: () => Stat,
  StatAggregationMethod: () => StatAggregationMethod,
  StatConfig: () => StatConfig,
  StatFormatMethod: () => StatFormatMethod,
  StatSortingMethod: () => StatSortingMethod,
  StatSummary: () => StatSummary,
  Summary: () => Summary4,
  common: () => common_exports8
});
var init_game = __esm({
  "src/serialization/resources/game/index.ts"() {
    "use strict";
    init_resources14();
  }
});

// src/serialization/resources/geo/resources/common/types/Coord.ts
var Coord;
var init_Coord = __esm({
  "src/serialization/resources/geo/resources/common/types/Coord.ts"() {
    "use strict";
    init_core();
    Coord = schemas_exports.object({
      latitude: schemas_exports.number(),
      longitude: schemas_exports.number()
    });
  }
});

// src/serialization/resources/geo/resources/common/types/Distance.ts
var Distance;
var init_Distance = __esm({
  "src/serialization/resources/geo/resources/common/types/Distance.ts"() {
    "use strict";
    init_core();
    Distance = schemas_exports.object({
      kilometers: schemas_exports.number(),
      miles: schemas_exports.number()
    });
  }
});

// src/serialization/resources/geo/resources/common/types/index.ts
var init_types52 = __esm({
  "src/serialization/resources/geo/resources/common/types/index.ts"() {
    "use strict";
    init_Coord();
    init_Distance();
  }
});

// src/serialization/resources/geo/resources/common/index.ts
var common_exports9 = {};
__export(common_exports9, {
  Coord: () => Coord,
  Distance: () => Distance
});
var init_common9 = __esm({
  "src/serialization/resources/geo/resources/common/index.ts"() {
    "use strict";
    init_types52();
  }
});

// src/serialization/resources/geo/resources/index.ts
var init_resources15 = __esm({
  "src/serialization/resources/geo/resources/index.ts"() {
    "use strict";
    init_common9();
    init_types52();
  }
});

// src/serialization/resources/geo/index.ts
var geo_exports = {};
__export(geo_exports, {
  Coord: () => Coord,
  Distance: () => Distance,
  common: () => common_exports9
});
var init_geo = __esm({
  "src/serialization/resources/geo/index.ts"() {
    "use strict";
    init_resources15();
  }
});

// src/serialization/resources/matchmaker/resources/common/types/LobbyInfo.ts
var LobbyInfo;
var init_LobbyInfo = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/LobbyInfo.ts"() {
    "use strict";
    init_core();
    LobbyInfo = schemas_exports.object({
      regionId: schemas_exports.property("region_id", schemas_exports.string()),
      gameModeId: schemas_exports.property("game_mode_id", schemas_exports.string()),
      lobbyId: schemas_exports.property("lobby_id", schemas_exports.string()),
      maxPlayersNormal: schemas_exports.property("max_players_normal", schemas_exports.number()),
      maxPlayersDirect: schemas_exports.property("max_players_direct", schemas_exports.number()),
      maxPlayersParty: schemas_exports.property("max_players_party", schemas_exports.number()),
      totalPlayerCount: schemas_exports.property("total_player_count", schemas_exports.number()),
      state: schemas_exports.unknown().optional()
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/GameModeInfo.ts
var GameModeInfo;
var init_GameModeInfo = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/GameModeInfo.ts"() {
    "use strict";
    init_core();
    GameModeInfo = schemas_exports.object({
      gameModeId: schemas_exports.property(
        "game_mode_id",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier)
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/RegionInfo.ts
var RegionInfo;
var init_RegionInfo = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/RegionInfo.ts"() {
    "use strict";
    init_core();
    RegionInfo = schemas_exports.object({
      regionId: schemas_exports.property(
        "region_id",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier)
      ),
      providerDisplayName: schemas_exports.property("provider_display_name", schemas_exports.string()),
      regionDisplayName: schemas_exports.property("region_display_name", schemas_exports.string()),
      datacenterCoord: schemas_exports.property(
        "datacenter_coord",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).geo.Coord)
      ),
      datacenterDistanceFromClient: schemas_exports.property(
        "datacenter_distance_from_client",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).geo.Distance)
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/JoinLobby.ts
var JoinLobby;
var init_JoinLobby = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/JoinLobby.ts"() {
    "use strict";
    init_core();
    JoinLobby = schemas_exports.object({
      lobbyId: schemas_exports.property("lobby_id", schemas_exports.string()),
      region: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinRegion),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPort)
      ),
      player: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPlayer)
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/JoinRegion.ts
var JoinRegion;
var init_JoinRegion = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/JoinRegion.ts"() {
    "use strict";
    init_core();
    JoinRegion = schemas_exports.object({
      regionId: schemas_exports.property(
        "region_id",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier)
      ),
      displayName: schemas_exports.property(
        "display_name",
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).DisplayName)
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/JoinPort.ts
var JoinPort;
var init_JoinPort = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/JoinPort.ts"() {
    "use strict";
    init_core();
    JoinPort = schemas_exports.object({
      host: schemas_exports.string().optional(),
      hostname: schemas_exports.string(),
      port: schemas_exports.number().optional(),
      portRange: schemas_exports.property(
        "port_range",
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPortRange).optional()
      ),
      isTls: schemas_exports.property("is_tls", schemas_exports.boolean())
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/JoinPortRange.ts
var JoinPortRange;
var init_JoinPortRange = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/JoinPortRange.ts"() {
    "use strict";
    init_core();
    JoinPortRange = schemas_exports.object({
      min: schemas_exports.number(),
      max: schemas_exports.number()
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/JoinPlayer.ts
var JoinPlayer;
var init_JoinPlayer = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/JoinPlayer.ts"() {
    "use strict";
    init_core();
    JoinPlayer = schemas_exports.object({
      token: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Jwt)
    });
  }
});

// src/serialization/resources/matchmaker/resources/common/types/CustomLobbyPublicity.ts
var CustomLobbyPublicity;
var init_CustomLobbyPublicity = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/CustomLobbyPublicity.ts"() {
    "use strict";
    init_core();
    CustomLobbyPublicity = schemas_exports.enum_(["public", "private"]);
  }
});

// src/serialization/resources/matchmaker/resources/common/types/index.ts
var init_types53 = __esm({
  "src/serialization/resources/matchmaker/resources/common/types/index.ts"() {
    "use strict";
    init_LobbyInfo();
    init_GameModeInfo();
    init_RegionInfo();
    init_JoinLobby();
    init_JoinRegion();
    init_JoinPort();
    init_JoinPortRange();
    init_JoinPlayer();
    init_CustomLobbyPublicity();
  }
});

// src/serialization/resources/matchmaker/resources/common/index.ts
var common_exports10 = {};
__export(common_exports10, {
  CustomLobbyPublicity: () => CustomLobbyPublicity,
  GameModeInfo: () => GameModeInfo,
  JoinLobby: () => JoinLobby,
  JoinPlayer: () => JoinPlayer,
  JoinPort: () => JoinPort,
  JoinPortRange: () => JoinPortRange,
  JoinRegion: () => JoinRegion,
  LobbyInfo: () => LobbyInfo,
  RegionInfo: () => RegionInfo
});
var init_common10 = __esm({
  "src/serialization/resources/matchmaker/resources/common/index.ts"() {
    "use strict";
    init_types53();
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/types/FindLobbyResponse.ts
var FindLobbyResponse;
var init_FindLobbyResponse = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/types/FindLobbyResponse.ts"() {
    "use strict";
    init_core();
    FindLobbyResponse = schemas_exports.object({
      lobby: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinLobby),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPort)
      ),
      player: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPlayer)
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/types/JoinLobbyResponse.ts
var JoinLobbyResponse;
var init_JoinLobbyResponse = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/types/JoinLobbyResponse.ts"() {
    "use strict";
    init_core();
    JoinLobbyResponse = schemas_exports.object({
      lobby: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinLobby),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPort)
      ),
      player: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPlayer)
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/types/CreateLobbyResponse.ts
var CreateLobbyResponse;
var init_CreateLobbyResponse = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/types/CreateLobbyResponse.ts"() {
    "use strict";
    init_core();
    CreateLobbyResponse = schemas_exports.object({
      lobby: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinLobby),
      ports: schemas_exports.record(
        schemas_exports.string(),
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPort)
      ),
      player: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.JoinPlayer)
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/types/ListLobbiesResponse.ts
var ListLobbiesResponse;
var init_ListLobbiesResponse = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/types/ListLobbiesResponse.ts"() {
    "use strict";
    init_core();
    ListLobbiesResponse = schemas_exports.object({
      gameModes: schemas_exports.property(
        "game_modes",
        schemas_exports.list(
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.GameModeInfo)
        )
      ),
      regions: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.RegionInfo)
      ),
      lobbies: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.LobbyInfo)
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/types/index.ts
var init_types54 = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/types/index.ts"() {
    "use strict";
    init_FindLobbyResponse();
    init_JoinLobbyResponse();
    init_CreateLobbyResponse();
    init_ListLobbiesResponse();
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/setState.ts
var setState_exports = {};
__export(setState_exports, {
  Request: () => Request
});
var Request;
var init_setState = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/setState.ts"() {
    "use strict";
    init_core();
    Request = schemas_exports.unknown().optional();
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/getState.ts
var getState_exports = {};
__export(getState_exports, {
  Response: () => Response
});
var Response;
var init_getState = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/getState.ts"() {
    "use strict";
    init_core();
    Response = schemas_exports.unknown().optional();
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/requests/SetLobbyClosedRequest.ts
var SetLobbyClosedRequest;
var init_SetLobbyClosedRequest = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/requests/SetLobbyClosedRequest.ts"() {
    "use strict";
    init_core();
    SetLobbyClosedRequest = schemas_exports.object({
      isClosed: schemas_exports.property("is_closed", schemas_exports.boolean())
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/requests/FindLobbyRequest.ts
var FindLobbyRequest2;
var init_FindLobbyRequest2 = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/requests/FindLobbyRequest.ts"() {
    "use strict";
    init_core();
    FindLobbyRequest2 = schemas_exports.object({
      gameModes: schemas_exports.property("game_modes", schemas_exports.list(schemas_exports.string())),
      regions: schemas_exports.list(schemas_exports.string()).optional(),
      preventAutoCreateLobby: schemas_exports.property(
        "prevent_auto_create_lobby",
        schemas_exports.boolean().optional()
      ),
      tags: schemas_exports.record(schemas_exports.string(), schemas_exports.string()).optional(),
      maxPlayers: schemas_exports.property("max_players", schemas_exports.number().optional()),
      captcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).captcha.Config).optional(),
      verificationData: schemas_exports.property("verification_data", schemas_exports.unknown().optional())
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/requests/JoinLobbyRequest.ts
var JoinLobbyRequest;
var init_JoinLobbyRequest = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/requests/JoinLobbyRequest.ts"() {
    "use strict";
    init_core();
    JoinLobbyRequest = schemas_exports.object({
      lobbyId: schemas_exports.property("lobby_id", schemas_exports.string()),
      captcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).captcha.Config).optional(),
      verificationData: schemas_exports.property("verification_data", schemas_exports.unknown().optional())
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/requests/CreateLobbyRequest.ts
var CreateLobbyRequest;
var init_CreateLobbyRequest = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/requests/CreateLobbyRequest.ts"() {
    "use strict";
    init_core();
    CreateLobbyRequest = schemas_exports.object({
      gameMode: schemas_exports.property("game_mode", schemas_exports.string()),
      region: schemas_exports.string().optional(),
      publicity: schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.CustomLobbyPublicity).optional(),
      tags: schemas_exports.record(schemas_exports.string(), schemas_exports.string()).optional(),
      maxPlayers: schemas_exports.property("max_players", schemas_exports.number().optional()),
      lobbyConfig: schemas_exports.property("lobby_config", schemas_exports.unknown().optional()),
      captcha: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).captcha.Config).optional(),
      verificationData: schemas_exports.property("verification_data", schemas_exports.unknown().optional())
    });
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/requests/index.ts
var init_requests3 = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/requests/index.ts"() {
    "use strict";
    init_SetLobbyClosedRequest();
    init_FindLobbyRequest2();
    init_JoinLobbyRequest();
    init_CreateLobbyRequest();
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/client/index.ts
var init_client3 = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/client/index.ts"() {
    "use strict";
    init_setState();
    init_getState();
    init_requests3();
  }
});

// src/serialization/resources/matchmaker/resources/lobbies/index.ts
var lobbies_exports = {};
__export(lobbies_exports, {
  CreateLobbyRequest: () => CreateLobbyRequest,
  CreateLobbyResponse: () => CreateLobbyResponse,
  FindLobbyRequest: () => FindLobbyRequest2,
  FindLobbyResponse: () => FindLobbyResponse,
  JoinLobbyRequest: () => JoinLobbyRequest,
  JoinLobbyResponse: () => JoinLobbyResponse,
  ListLobbiesResponse: () => ListLobbiesResponse,
  SetLobbyClosedRequest: () => SetLobbyClosedRequest,
  getState: () => getState_exports,
  setState: () => setState_exports
});
var init_lobbies = __esm({
  "src/serialization/resources/matchmaker/resources/lobbies/index.ts"() {
    "use strict";
    init_types54();
    init_client3();
  }
});

// src/serialization/resources/matchmaker/resources/players/types/GetStatisticsResponse.ts
var GetStatisticsResponse;
var init_GetStatisticsResponse = __esm({
  "src/serialization/resources/matchmaker/resources/players/types/GetStatisticsResponse.ts"() {
    "use strict";
    init_core();
    GetStatisticsResponse = schemas_exports.object({
      playerCount: schemas_exports.property("player_count", schemas_exports.number()),
      gameModes: schemas_exports.property(
        "game_modes",
        schemas_exports.record(
          schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier),
          schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.GameModeStatistics)
        )
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/players/types/GameModeStatistics.ts
var GameModeStatistics;
var init_GameModeStatistics = __esm({
  "src/serialization/resources/matchmaker/resources/players/types/GameModeStatistics.ts"() {
    "use strict";
    init_core();
    GameModeStatistics = schemas_exports.object({
      playerCount: schemas_exports.property("player_count", schemas_exports.number()),
      regions: schemas_exports.record(
        schemas_exports.lazy(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).Identifier),
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.RegionStatistics)
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/players/types/RegionStatistics.ts
var RegionStatistics;
var init_RegionStatistics = __esm({
  "src/serialization/resources/matchmaker/resources/players/types/RegionStatistics.ts"() {
    "use strict";
    init_core();
    RegionStatistics = schemas_exports.object({
      playerCount: schemas_exports.property("player_count", schemas_exports.number())
    });
  }
});

// src/serialization/resources/matchmaker/resources/players/types/index.ts
var init_types55 = __esm({
  "src/serialization/resources/matchmaker/resources/players/types/index.ts"() {
    "use strict";
    init_GetStatisticsResponse();
    init_GameModeStatistics();
    init_RegionStatistics();
  }
});

// src/serialization/resources/matchmaker/resources/players/client/requests/PlayerConnectedRequest.ts
var PlayerConnectedRequest;
var init_PlayerConnectedRequest = __esm({
  "src/serialization/resources/matchmaker/resources/players/client/requests/PlayerConnectedRequest.ts"() {
    "use strict";
    init_core();
    PlayerConnectedRequest = schemas_exports.object({
      playerToken: schemas_exports.property("player_token", schemas_exports.string())
    });
  }
});

// src/serialization/resources/matchmaker/resources/players/client/requests/PlayerDisconnectedRequest.ts
var PlayerDisconnectedRequest;
var init_PlayerDisconnectedRequest = __esm({
  "src/serialization/resources/matchmaker/resources/players/client/requests/PlayerDisconnectedRequest.ts"() {
    "use strict";
    init_core();
    PlayerDisconnectedRequest = schemas_exports.object({
      playerToken: schemas_exports.property("player_token", schemas_exports.string())
    });
  }
});

// src/serialization/resources/matchmaker/resources/players/client/requests/index.ts
var init_requests4 = __esm({
  "src/serialization/resources/matchmaker/resources/players/client/requests/index.ts"() {
    "use strict";
    init_PlayerConnectedRequest();
    init_PlayerDisconnectedRequest();
  }
});

// src/serialization/resources/matchmaker/resources/players/client/index.ts
var init_client4 = __esm({
  "src/serialization/resources/matchmaker/resources/players/client/index.ts"() {
    "use strict";
    init_requests4();
  }
});

// src/serialization/resources/matchmaker/resources/players/index.ts
var players_exports = {};
__export(players_exports, {
  GameModeStatistics: () => GameModeStatistics,
  GetStatisticsResponse: () => GetStatisticsResponse,
  PlayerConnectedRequest: () => PlayerConnectedRequest,
  PlayerDisconnectedRequest: () => PlayerDisconnectedRequest,
  RegionStatistics: () => RegionStatistics
});
var init_players = __esm({
  "src/serialization/resources/matchmaker/resources/players/index.ts"() {
    "use strict";
    init_types55();
    init_client4();
  }
});

// src/serialization/resources/matchmaker/resources/regions/types/ListRegionsResponse.ts
var ListRegionsResponse;
var init_ListRegionsResponse = __esm({
  "src/serialization/resources/matchmaker/resources/regions/types/ListRegionsResponse.ts"() {
    "use strict";
    init_core();
    ListRegionsResponse = schemas_exports.object({
      regions: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).matchmaker.RegionInfo)
      )
    });
  }
});

// src/serialization/resources/matchmaker/resources/regions/types/index.ts
var init_types56 = __esm({
  "src/serialization/resources/matchmaker/resources/regions/types/index.ts"() {
    "use strict";
    init_ListRegionsResponse();
  }
});

// src/serialization/resources/matchmaker/resources/regions/index.ts
var regions_exports = {};
__export(regions_exports, {
  ListRegionsResponse: () => ListRegionsResponse
});
var init_regions = __esm({
  "src/serialization/resources/matchmaker/resources/regions/index.ts"() {
    "use strict";
    init_types56();
  }
});

// src/serialization/resources/matchmaker/resources/index.ts
var init_resources16 = __esm({
  "src/serialization/resources/matchmaker/resources/index.ts"() {
    "use strict";
    init_common10();
    init_types53();
    init_lobbies();
    init_types54();
    init_players();
    init_types55();
    init_regions();
    init_types56();
    init_requests3();
    init_requests4();
  }
});

// src/serialization/resources/matchmaker/index.ts
var matchmaker_exports3 = {};
__export(matchmaker_exports3, {
  CreateLobbyRequest: () => CreateLobbyRequest,
  CreateLobbyResponse: () => CreateLobbyResponse,
  CustomLobbyPublicity: () => CustomLobbyPublicity,
  FindLobbyRequest: () => FindLobbyRequest2,
  FindLobbyResponse: () => FindLobbyResponse,
  GameModeInfo: () => GameModeInfo,
  GameModeStatistics: () => GameModeStatistics,
  GetStatisticsResponse: () => GetStatisticsResponse,
  JoinLobby: () => JoinLobby,
  JoinLobbyRequest: () => JoinLobbyRequest,
  JoinLobbyResponse: () => JoinLobbyResponse,
  JoinPlayer: () => JoinPlayer,
  JoinPort: () => JoinPort,
  JoinPortRange: () => JoinPortRange,
  JoinRegion: () => JoinRegion,
  ListLobbiesResponse: () => ListLobbiesResponse,
  ListRegionsResponse: () => ListRegionsResponse,
  LobbyInfo: () => LobbyInfo,
  PlayerConnectedRequest: () => PlayerConnectedRequest,
  PlayerDisconnectedRequest: () => PlayerDisconnectedRequest,
  RegionInfo: () => RegionInfo,
  RegionStatistics: () => RegionStatistics,
  SetLobbyClosedRequest: () => SetLobbyClosedRequest,
  common: () => common_exports10,
  lobbies: () => lobbies_exports,
  players: () => players_exports,
  regions: () => regions_exports
});
var init_matchmaker3 = __esm({
  "src/serialization/resources/matchmaker/index.ts"() {
    "use strict";
    init_resources16();
  }
});

// src/serialization/resources/portal/resources/common/types/NotificationRegisterService.ts
var NotificationRegisterService;
var init_NotificationRegisterService = __esm({
  "src/serialization/resources/portal/resources/common/types/NotificationRegisterService.ts"() {
    "use strict";
    init_core();
    NotificationRegisterService = schemas_exports.object({
      firebase: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).portal.NotificationRegisterFirebaseService).optional()
    });
  }
});

// src/serialization/resources/portal/resources/common/types/NotificationRegisterFirebaseService.ts
var NotificationRegisterFirebaseService;
var init_NotificationRegisterFirebaseService = __esm({
  "src/serialization/resources/portal/resources/common/types/NotificationRegisterFirebaseService.ts"() {
    "use strict";
    init_core();
    NotificationRegisterFirebaseService = schemas_exports.object({
      accessKey: schemas_exports.property("access_key", schemas_exports.string())
    });
  }
});

// src/serialization/resources/portal/resources/common/types/NotificationUnregisterService.ts
var NotificationUnregisterService;
var init_NotificationUnregisterService = __esm({
  "src/serialization/resources/portal/resources/common/types/NotificationUnregisterService.ts"() {
    "use strict";
    init_core();
    NotificationUnregisterService = schemas_exports.enum_(["firebase"]);
  }
});

// src/serialization/resources/portal/resources/common/types/index.ts
var init_types57 = __esm({
  "src/serialization/resources/portal/resources/common/types/index.ts"() {
    "use strict";
    init_NotificationRegisterService();
    init_NotificationRegisterFirebaseService();
    init_NotificationUnregisterService();
  }
});

// src/serialization/resources/portal/resources/common/index.ts
var common_exports11 = {};
__export(common_exports11, {
  NotificationRegisterFirebaseService: () => NotificationRegisterFirebaseService,
  NotificationRegisterService: () => NotificationRegisterService,
  NotificationUnregisterService: () => NotificationUnregisterService
});
var init_common11 = __esm({
  "src/serialization/resources/portal/resources/common/index.ts"() {
    "use strict";
    init_types57();
  }
});

// src/serialization/resources/portal/resources/games/types/GetSuggestedGamesResponse.ts
var GetSuggestedGamesResponse;
var init_GetSuggestedGamesResponse = __esm({
  "src/serialization/resources/portal/resources/games/types/GetSuggestedGamesResponse.ts"() {
    "use strict";
    init_core();
    GetSuggestedGamesResponse = schemas_exports.object({
      games: schemas_exports.list(
        schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Summary)
      ),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/portal/resources/games/types/GetGameProfileResponse.ts
var GetGameProfileResponse;
var init_GetGameProfileResponse = __esm({
  "src/serialization/resources/portal/resources/games/types/GetGameProfileResponse.ts"() {
    "use strict";
    init_core();
    GetGameProfileResponse = schemas_exports.object({
      game: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).game.Profile),
      watch: schemas_exports.lazyObject(async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).WatchResponse)
    });
  }
});

// src/serialization/resources/portal/resources/games/types/index.ts
var init_types58 = __esm({
  "src/serialization/resources/portal/resources/games/types/index.ts"() {
    "use strict";
    init_GetSuggestedGamesResponse();
    init_GetGameProfileResponse();
  }
});

// src/serialization/resources/portal/resources/games/index.ts
var games_exports3 = {};
__export(games_exports3, {
  GetGameProfileResponse: () => GetGameProfileResponse,
  GetSuggestedGamesResponse: () => GetSuggestedGamesResponse
});
var init_games3 = __esm({
  "src/serialization/resources/portal/resources/games/index.ts"() {
    "use strict";
    init_types58();
  }
});

// src/serialization/resources/portal/resources/notifications/types/RegisterNotificationsRequest.ts
var RegisterNotificationsRequest;
var init_RegisterNotificationsRequest = __esm({
  "src/serialization/resources/portal/resources/notifications/types/RegisterNotificationsRequest.ts"() {
    "use strict";
    init_core();
    RegisterNotificationsRequest = schemas_exports.object({
      service: schemas_exports.lazyObject(
        async () => (await Promise.resolve().then(() => (init_serialization(), serialization_exports))).portal.NotificationRegisterService
      )
    });
  }
});

// src/serialization/resources/portal/resources/notifications/types/index.ts
var init_types59 = __esm({
  "src/serialization/resources/portal/resources/notifications/types/index.ts"() {
    "use strict";
    init_RegisterNotificationsRequest();
  }
});

// src/serialization/resources/portal/resources/notifications/index.ts
var notifications_exports = {};
__export(notifications_exports, {
  RegisterNotificationsRequest: () => RegisterNotificationsRequest
});
var init_notifications = __esm({
  "src/serialization/resources/portal/resources/notifications/index.ts"() {
    "use strict";
    init_types59();
  }
});

// src/serialization/resources/portal/resources/index.ts
var init_resources17 = __esm({
  "src/serialization/resources/portal/resources/index.ts"() {
    "use strict";
    init_common11();
    init_types57();
    init_games3();
    init_types58();
    init_notifications();
    init_types59();
  }
});

// src/serialization/resources/portal/index.ts
var portal_exports = {};
__export(portal_exports, {
  GetGameProfileResponse: () => GetGameProfileResponse,
  GetSuggestedGamesResponse: () => GetSuggestedGamesResponse,
  NotificationRegisterFirebaseService: () => NotificationRegisterFirebaseService,
  NotificationRegisterService: () => NotificationRegisterService,
  NotificationUnregisterService: () => NotificationUnregisterService,
  RegisterNotificationsRequest: () => RegisterNotificationsRequest,
  common: () => common_exports11,
  games: () => games_exports3,
  notifications: () => notifications_exports
});
var init_portal = __esm({
  "src/serialization/resources/portal/index.ts"() {
    "use strict";
    init_resources17();
  }
});

// src/serialization/resources/upload/resources/common/types/PresignedRequest.ts
var PresignedRequest;
var init_PresignedRequest = __esm({
  "src/serialization/resources/upload/resources/common/types/PresignedRequest.ts"() {
    "use strict";
    init_core();
    PresignedRequest = schemas_exports.object({
      path: schemas_exports.string(),
      url: schemas_exports.string(),
      byteOffset: schemas_exports.property("byte_offset", schemas_exports.number()),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/upload/resources/common/types/PrepareFile.ts
var PrepareFile;
var init_PrepareFile = __esm({
  "src/serialization/resources/upload/resources/common/types/PrepareFile.ts"() {
    "use strict";
    init_core();
    PrepareFile = schemas_exports.object({
      path: schemas_exports.string(),
      contentType: schemas_exports.property("content_type", schemas_exports.string().optional()),
      contentLength: schemas_exports.property("content_length", schemas_exports.number())
    });
  }
});

// src/serialization/resources/upload/resources/common/types/index.ts
var init_types60 = __esm({
  "src/serialization/resources/upload/resources/common/types/index.ts"() {
    "use strict";
    init_PresignedRequest();
    init_PrepareFile();
  }
});

// src/serialization/resources/upload/resources/common/index.ts
var common_exports12 = {};
__export(common_exports12, {
  PrepareFile: () => PrepareFile,
  PresignedRequest: () => PresignedRequest
});
var init_common12 = __esm({
  "src/serialization/resources/upload/resources/common/index.ts"() {
    "use strict";
    init_types60();
  }
});

// src/serialization/resources/upload/resources/index.ts
var init_resources18 = __esm({
  "src/serialization/resources/upload/resources/index.ts"() {
    "use strict";
    init_common12();
    init_types60();
  }
});

// src/serialization/resources/upload/index.ts
var upload_exports = {};
__export(upload_exports, {
  PrepareFile: () => PrepareFile,
  PresignedRequest: () => PresignedRequest,
  common: () => common_exports12
});
var init_upload = __esm({
  "src/serialization/resources/upload/index.ts"() {
    "use strict";
    init_resources18();
  }
});

// src/serialization/resources/index.ts
var init_resources19 = __esm({
  "src/serialization/resources/index.ts"() {
    "use strict";
    init_admin();
    init_cloud();
    init_group();
    init_identity2();
    init_kv2();
    init_module();
    init_auth3();
    init_captcha();
    init_common7();
    init_types50();
    init_game();
    init_geo();
    init_matchmaker3();
    init_portal();
    init_upload();
  }
});

// src/serialization/index.ts
var serialization_exports = {};
__export(serialization_exports, {
  AccountNumber: () => AccountNumber,
  Bio: () => Bio,
  DisplayName: () => DisplayName,
  Email: () => Email,
  EmptyObject: () => EmptyObject,
  ErrorBody: () => ErrorBody,
  ErrorMetadata: () => ErrorMetadata,
  GlobalEventNotification: () => GlobalEventNotification2,
  Identifier: () => Identifier,
  Jwt: () => Jwt,
  Timestamp: () => Timestamp,
  ValidationError: () => ValidationError5,
  WatchQuery: () => WatchQuery,
  WatchResponse: () => WatchResponse,
  admin: () => admin_exports,
  auth: () => auth_exports2,
  captcha: () => captcha_exports,
  cloud: () => cloud_exports,
  common: () => common_exports7,
  game: () => game_exports,
  geo: () => geo_exports,
  group: () => group_exports,
  identity: () => identity_exports2,
  kv: () => kv_exports2,
  matchmaker: () => matchmaker_exports3,
  module_: () => module_exports,
  portal: () => portal_exports,
  upload: () => upload_exports
});
module.exports = __toCommonJS(serialization_exports);
var init_serialization = __esm({
  "src/serialization/index.ts"() {
    init_resources19();
  }
});
init_serialization();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccountNumber,
  Bio,
  DisplayName,
  Email,
  EmptyObject,
  ErrorBody,
  ErrorMetadata,
  GlobalEventNotification,
  Identifier,
  Jwt,
  Timestamp,
  ValidationError,
  WatchQuery,
  WatchResponse,
  admin,
  auth,
  captcha,
  cloud,
  common,
  game,
  geo,
  group,
  identity,
  kv,
  matchmaker,
  module_,
  portal,
  upload
});
/*! Bundled license information:

mime-db/index.js:
  (*!
   * mime-db
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   *)

mime-types/index.js:
  (*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/