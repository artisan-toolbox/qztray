//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, c = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, l = (n, r, o) => (o = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), u = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}), d = /* @__PURE__ */ o(((e, t) => {
	t.exports = {};
})), f = /* @__PURE__ */ o(((e, t) => {
	var n = (function() {
		Array.isArray || (Array.isArray = function(e) {
			return Object.prototype.toString.call(e) === "[object Array]";
		}), Number.isInteger || (Number.isInteger = function(e) {
			return typeof e == "number" && isFinite(e) && Math.floor(e) === e;
		}), Array.from || (Array.from = function(e) {
			return [].slice.call(e);
		}), String.prototype.padStart || (String.prototype.padStart = function(e, t) {
			if (e >>= 0, t = String(t === void 0 ? " " : t), this.length >= e) return String(this);
			for (var n = e - this.length, r = ""; r.length < n;) r += t;
			return r.slice(0, n) + String(this);
		});
		var t = {
			TITLE: "QZ Tray",
			VERSION: "2.2.6",
			DEBUG: !1,
			log: {
				trace: function() {
					t.DEBUG && console.log.apply(console, arguments);
				},
				info: function() {
					console.info.apply(console, arguments);
				},
				warn: function() {
					console.warn.apply(console, arguments);
				},
				allay: function() {
					t.DEBUG && console.warn.apply(console, arguments);
				},
				error: function() {
					console.error.apply(console, arguments);
				}
			},
			streams: {
				serial: "SERIAL",
				usb: "USB",
				hid: "HID",
				printer: "PRINTER",
				file: "FILE",
				socket: "SOCKET"
			},
			websocket: {
				connection: null,
				shutdown: !1,
				connectConfig: {
					host: ["localhost", "localhost.qz.io"],
					hostIndex: 0,
					usingSecure: !0,
					usingSurf: !0,
					surfDomain: "qz.surf",
					protocol: {
						secure: "wss://",
						insecure: "ws://"
					},
					port: {
						secure: [
							8181,
							8282,
							8383,
							8484
						],
						insecure: [
							8182,
							8283,
							8384,
							8485
						],
						portIndex: 0
					},
					keepAlive: 60,
					retries: 0,
					delay: 0
				},
				setup: {
					webSocketPromise: function(e) {
						var n, r, i;
						return t.tools.promise(function(a, o) {
							n = new t.tools.ws(e), t.websocket.connection = n, i = function() {
								a(n);
							}, r = function(e) {
								t.websocket.connection = null, o(e);
							}, n.addEventListener("open", i), n.addEventListener("error", r), n.addEventListener("close", r);
						}).finally(function() {
							n.removeEventListener("open", i), n.removeEventListener("error", r), n.removeEventListener("close", r);
						});
					},
					connectToAddress: function(e) {
						var n = t.tools.getLna();
						t.log.trace("Attempting connection", e);
						var r;
						return n ? (t.log.trace("Connecting with lna.js"), r = n.detectLna(e, t.websocket.setup.webSocketPromise, {
							isWebSocket: !0,
							defaultAddressSpace: "public"
						})) : (t.log.trace("Connecting without lna.js"), r = t.websocket.setup.webSocketPromise(e)), r.catch(function(e) {
							var r = e.denied ? "Connection attempt denied by Local Network Access restrictions" : "Unable to establish connection with " + t.TITLE, i = Error(r);
							throw n && e instanceof n.LnaError && (i.denied = e.denied, i.permission = e.permission), i;
						});
					},
					findConnection: function(e, n, r) {
						if (t.websocket.shutdown) {
							r(/* @__PURE__ */ Error("Connection attempt cancelled by user"));
							return;
						}
						if (e.port.secure.length) !e.port.insecure.length && !e.usingSecure && (t.log.trace("No insecure ports specified - forcing secure connection"), e.usingSecure = !0);
						else if (e.port.insecure.length) e.usingSecure &&= (t.log.error("No secure ports specified - forcing insecure connection"), !1);
						else {
							r(/* @__PURE__ */ Error("No ports have been specified to connect over"));
							return;
						}
						var i = function(i) {
							if (t.websocket.shutdown) {
								r(/* @__PURE__ */ Error("Connection attempt cancelled by user"));
								return;
							}
							if (i.denied) {
								r(i);
								return;
							}
							if (e.port.portIndex++, e.usingSecure && e.port.portIndex >= e.port.secure.length || !e.usingSecure && e.port.portIndex >= e.port.insecure.length) {
								if (e.hostIndex >= e.host.length - 1) {
									r(i);
									return;
								}
								e.hostIndex++, e.port.portIndex = 0;
							}
							t.websocket.setup.findConnection(e, n, r);
						}, a = e.usingSecure ? e.protocol.secure + e.host[e.hostIndex] + ":" + e.port.secure[e.port.portIndex] : e.protocol.insecure + e.host[e.hostIndex] + ":" + e.port.insecure[e.port.portIndex];
						t.websocket.setup.connectToAddress(a).then(function() {
							if (t.log.info("Established connection with " + t.TITLE + " on " + a), t.websocket.setup.openConnection({
								resolve: n,
								reject: r
							}), e.keepAlive > 0) {
								var i = setInterval(function() {
									if (!t.tools.isActive() || t.websocket.connection.interval !== i) {
										clearInterval(i);
										return;
									}
									t.websocket.connection.send("ping");
								}, e.keepAlive * 1e3);
								t.websocket.connection.interval = i;
							}
						}, function(e) {
							t.log.trace(e), i(e);
						});
					},
					openConnection: function(e) {
						t.websocket.connection.onclose = function(e) {
							for (var n in t.log.trace(e), t.websocket.connection = null, t.websocket.callClose(e), t.log.info("Closed connection with " + t.TITLE), t.websocket.pendingCalls) t.websocket.pendingCalls.hasOwnProperty(n) && t.websocket.pendingCalls[n].reject(/* @__PURE__ */ Error("Connection closed before response received"));
							this.promise != null && this.promise.resolve();
						}, t.websocket.connection.onerror = function(e) {
							t.websocket.callError(e);
						}, t.websocket.connection.sendData = function(e) {
							t.log.trace("Preparing object for websocket", e), e.timestamp ?? (e.timestamp = Date.now(), typeof e.timestamp != "number" && (e.timestamp = (/* @__PURE__ */ new Date()).getTime())), e.promise != null && (e.uid = t.websocket.setup.newUID(), t.websocket.pendingCalls[e.uid] = e.promise), e.position = {
								x: typeof screen < "u" ? (screen.availWidth || screen.width) / 2 + (screen.left || screen.availLeft || 0) : 0,
								y: typeof screen < "u" ? (screen.availHeight || screen.height) / 2 + (screen.top || screen.availTop || 0) : 0
							};
							try {
								if (e.call != null && e.signature == null && t.security.needsSigned(e.call)) {
									var n = {
										call: e.call,
										params: e.params,
										timestamp: e.timestamp
									}, r = t.tools.hash(t.tools.stringify(n));
									r.then || (r = t.tools.promise(function(e) {
										e(r);
									})), r.then(function(e) {
										return t.security.callSign(e);
									}).then(function(n) {
										t.log.trace("Signature for call", n), e.signature = n || "", e.signAlgorithm = t.security.signAlgorithm, t.signContent = void 0, t.websocket.connection.send(t.tools.stringify(e));
									}).catch(function(n) {
										t.log.error("Signing failed", n), e.promise != null && (e.promise.reject(/* @__PURE__ */ Error("Failed to sign request")), delete t.websocket.pendingCalls[e.uid]);
									});
								} else t.log.trace("Signature for call", e.signature), t.websocket.connection.send(t.tools.stringify(e));
							} catch (n) {
								t.log.error(n), e.promise != null && (e.promise.reject(n), delete t.websocket.pendingCalls[e.uid]);
							}
						}, t.websocket.connection.onmessage = function(e) {
							var n = JSON.parse(e.data);
							if (n.uid == null) {
								if (n.type == null) t.websocket.connection.close(4003, "Connected to incompatible " + t.TITLE + " version");
								else switch (n.type) {
									case t.streams.serial:
										n.event ||= JSON.stringify({
											portName: n.key,
											output: n.data
										}), t.serial.callSerial(JSON.parse(n.event));
										break;
									case t.streams.socket:
										t.socket.callSocket(JSON.parse(n.event));
										break;
									case t.streams.usb:
										n.event ||= JSON.stringify({
											vendorId: n.key[0],
											productId: n.key[1],
											output: n.data
										}), t.usb.callUsb(JSON.parse(n.event));
										break;
									case t.streams.hid:
										t.hid.callHid(JSON.parse(n.event));
										break;
									case t.streams.printer:
										t.printers.callPrinter(JSON.parse(n.event));
										break;
									case t.streams.file:
										t.file.callFile(JSON.parse(n.event));
										break;
									default: t.log.allay("Cannot determine stream type for callback", n);
								}
								return;
							}
							t.log.trace("Received response from websocket", n);
							var r = t.websocket.pendingCalls[n.uid];
							r == null ? t.log.allay("No promise found for returned response") : n.error == null ? r.resolve(n.result) : r.reject(Error(n.error)), delete t.websocket.pendingCalls[n.uid];
						};
						function n(n) {
							n === void 0 && (n = null), r.api.getVersion().then(function(e) {
								t.websocket.connection.version = e, t.websocket.connection.semver = e.toLowerCase().replace(/-rc\./g, "-rc").split(/[\\+\\.-]/g);
								for (var n = 0; n < t.websocket.connection.semver.length; n++) {
									try {
										if (n == 3 && t.websocket.connection.semver[n].toLowerCase().indexOf("rc") == 0) {
											t.websocket.connection.semver[n] = -t.websocket.connection.semver[n].replace(/\D/g, "");
											continue;
										}
										t.websocket.connection.semver[n] = parseInt(t.websocket.connection.semver[n]);
									} catch {}
									t.websocket.connection.semver.length < 4 && (t.websocket.connection.semver[3] = 0);
								}
								t.compatible.algorithm(!0);
							}).then(function() {
								t.websocket.connection.sendData({
									certificate: n,
									promise: e
								});
							});
						}
						t.security.callCert().then(n).catch(function(r) {
							t.log.warn("Failed to get certificate:", r), t.security.rejectOnCertFailure ? e.reject(r) : n(null);
						});
					},
					newUID: function() {
						var e = 6;
						return (Array(e + 1).join("0") + (Math.random() * 36 ** e << 0).toString(36)).slice(-e);
					}
				},
				dataPromise: function(e, n, r, i) {
					return t.tools.promise(function(a, o) {
						var s = {
							call: e,
							promise: {
								resolve: a,
								reject: o
							},
							params: n,
							signature: r,
							timestamp: i
						};
						t.websocket.connection.sendData(s);
					});
				},
				pendingCalls: {},
				errorCallbacks: [],
				callError: function(e) {
					if (Array.isArray(t.websocket.errorCallbacks)) for (var n = 0; n < t.websocket.errorCallbacks.length; n++) t.websocket.errorCallbacks[n](e);
					else t.websocket.errorCallbacks(e);
				},
				closedCallbacks: [],
				callClose: function(e) {
					if (Array.isArray(t.websocket.closedCallbacks)) for (var n = 0; n < t.websocket.closedCallbacks.length; n++) t.websocket.closedCallbacks[n](e);
					else t.websocket.closedCallbacks(e);
				}
			},
			printing: { defaultConfig: {
				bounds: null,
				colorType: "color",
				copies: 1,
				density: 0,
				duplex: !1,
				fallbackDensity: null,
				interpolation: "bicubic",
				jobName: null,
				legacy: !1,
				margins: 0,
				orientation: null,
				paperThickness: null,
				printerTray: null,
				rasterize: !1,
				rotation: 0,
				scaleContent: !0,
				size: null,
				units: "in",
				forceRaw: !1,
				encoding: null,
				spool: null
			} },
			serial: {
				serialCallbacks: [],
				callSerial: function(e) {
					if (Array.isArray(t.serial.serialCallbacks)) for (var n = 0; n < t.serial.serialCallbacks.length; n++) t.serial.serialCallbacks[n](e);
					else t.serial.serialCallbacks(e);
				}
			},
			socket: {
				socketCallbacks: [],
				callSocket: function(e) {
					if (Array.isArray(t.socket.socketCallbacks)) for (var n = 0; n < t.socket.socketCallbacks.length; n++) t.socket.socketCallbacks[n](e);
					else t.socket.socketCallbacks(e);
				}
			},
			usb: {
				usbCallbacks: [],
				callUsb: function(e) {
					if (Array.isArray(t.usb.usbCallbacks)) for (var n = 0; n < t.usb.usbCallbacks.length; n++) t.usb.usbCallbacks[n](e);
					else t.usb.usbCallbacks(e);
				}
			},
			hid: {
				hidCallbacks: [],
				callHid: function(e) {
					if (Array.isArray(t.hid.hidCallbacks)) for (var n = 0; n < t.hid.hidCallbacks.length; n++) t.hid.hidCallbacks[n](e);
					else t.hid.hidCallbacks(e);
				}
			},
			printers: {
				printerCallbacks: [],
				callPrinter: function(e) {
					if (Array.isArray(t.printers.printerCallbacks)) for (var n = 0; n < t.printers.printerCallbacks.length; n++) t.printers.printerCallbacks[n](e);
					else t.printers.printerCallbacks(e);
				}
			},
			file: {
				fileCallbacks: [],
				callFile: function(e) {
					if (Array.isArray(t.file.fileCallbacks)) for (var n = 0; n < t.file.fileCallbacks.length; n++) t.file.fileCallbacks[n](e);
					else t.file.fileCallbacks(e);
				}
			},
			security: {
				certHandler: function(e, t) {
					t();
				},
				callCert: function() {
					return typeof t.security.certHandler.then == "function" ? t.security.certHandler : t.security.certHandler.constructor.name === "AsyncFunction" ? t.security.certHandler() : t.tools.promise(t.security.certHandler);
				},
				signatureFactory: function() {
					return function(e) {
						e();
					};
				},
				callSign: function(e) {
					return t.security.signatureFactory.constructor.name === "AsyncFunction" ? t.security.signatureFactory(e) : t.tools.promise(t.security.signatureFactory(e));
				},
				signAlgorithm: "SHA1",
				rejectOnCertFailure: !1,
				needsSigned: function(e) {
					return e != null && [
						"printers.getStatus",
						"printers.stopListening",
						"usb.isClaimed",
						"usb.closeStream",
						"usb.releaseDevice",
						"hid.stopListening",
						"hid.isClaimed",
						"hid.closeStream",
						"hid.releaseDevice",
						"file.stopListening",
						"getVersion"
					].indexOf(e) === -1;
				}
			},
			tools: {
				promise: function(e) {
					if (typeof RSVP < "u") return new RSVP.Promise(e);
					if (typeof Promise < "u") return new Promise(e);
					t.log.error("Promise/A+ support is required.  See qz.api.setPromiseType(...)");
				},
				reject: function(e) {
					return t.tools.promise(function(t, n) {
						n(e);
					});
				},
				stringify: function(e) {
					var t = Array.prototype.toJSON;
					delete Array.prototype.toJSON;
					function n(e, t) {
						if (e !== "promise") return t;
					}
					var r = JSON.stringify(e, n);
					return t && (Array.prototype.toJSON = t), r;
				},
				hash: function(e) {
					return typeof Sha256 < "u" ? Sha256.hash(e) : t.SHA.hash(e);
				},
				ws: typeof WebSocket < "u" ? WebSocket : null,
				lna: void 0,
				getLna: function() {
					return t.tools.lna === void 0 && (t.tools.lna = t.tools.loadLna() || null), t.tools.lna;
				},
				loadLna: function() {
					if (typeof self < "u") {
						if (self.lna && self.lna.detectLna) return self.lna;
						if (typeof u == "function") try {
							return u("lna");
						} catch (e) {
							t.log.warn("Unable to load LNA library", e);
						}
					}
				},
				appendSurf: function(e) {
					return t.tools.isQualified(e) ? e : e + "." + t.websocket.connectConfig.surfDomain;
				},
				isQualified: function(e) {
					return e.toLowerCase() === "localhost" || e.indexOf(".") !== -1 || e.indexOf(":") !== -1;
				},
				absolute: function(t) {
					if (typeof window < "u" && typeof document.createElement == "function") {
						var n = document.createElement("a");
						return n.href = t, n.href;
					}
					return typeof e == "object" ? d().resolve(t) : t;
				},
				relative: function(e) {
					for (var n = 0; n < e.length; n++) if (e[n].constructor === Object) {
						var r = !1;
						e[n].data && e[n].data.search && e[n].data.search(/data:image\/\w+;base64,/) === 0 ? (e[n].flavor = "base64", e[n].data = e[n].data.replace(/^data:image\/\w+;base64,/, "")) : e[n].flavor ? ["FILE", "XML"].indexOf(e[n].flavor.toUpperCase()) > -1 && (r = !0) : (e[n].format && [
							"HTML",
							"IMAGE",
							"PDF",
							"FILE",
							"XML"
						].indexOf(e[n].format.toUpperCase()) > -1 || e[n].type && ([
							"PIXEL",
							"IMAGE",
							"PDF"
						].indexOf(e[n].type.toUpperCase()) > -1 && !e[n].format || ["HTML", "PDF"].indexOf(e[n].type.toUpperCase()) > -1 && (!e[n].format || e[n].format.toUpperCase() === "FILE"))) && (r = !0), r && (e[n].data = t.tools.absolute(e[n].data)), e[n].options && typeof e[n].options.overlay == "string" && (e[n].options.overlay = t.tools.absolute(e[n].options.overlay));
					}
				},
				extend: function(e) {
					typeof e != "object" && (e = {});
					for (var n = 1; n < arguments.length; n++) {
						var r = arguments[n];
						if (r) {
							for (var i in r) if (r.hasOwnProperty(i)) {
								if (e === r[i]) continue;
								if (r[i] && r[i].constructor && r[i].constructor === Object) {
									var a = Array.isArray(r[i]) ? e[i] || [] : e[i] || {};
									e[i] = t.tools.extend(a, r[i]);
								} else r[i] !== void 0 && (e[i] = r[i]);
							}
						}
					}
					return e;
				},
				versionCompare: function(e, n, r, i) {
					if (t.tools.assertActive()) {
						var a = t.websocket.connection.semver;
						if (Array.isArray(a)) {
							if (e != null && a.length > 0 && a[0] != e) return a[0] - e;
							if (n != null && a.length > 1 && a[1] != n) return a[1] - n;
							if (r != null && a.length > 2 && a[2] != r) return a[2] - r;
							if (i != null && a.length > 3 && a[3] != i) return Number.isInteger(a[3]) && Number.isInteger(i) ? a[3] - i : a[3].toString().localeCompare(i.toString());
						}
						return 0;
					}
				},
				isVersion: function(e, n, r, i) {
					return t.tools.versionCompare(e, n, r, i) == 0;
				},
				isActive: function() {
					return !t.websocket.shutdown && t.websocket.connection != null && t.websocket.connection.readyState === t.tools.ws.OPEN;
				},
				assertActive: function() {
					if (t.tools.isActive()) return !0;
					throw Error("A connection to " + t.TITLE + " has not been established yet");
				},
				uint8ArrayToHex: function(e) {
					return Array.from(e).map(function(e) {
						return e.toString(16).padStart(2, "0");
					}).join("");
				},
				uint8ArrayToBase64: function(e) {
					var t = /* @__PURE__ */ "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""), n = "", r, i = e.length;
					for (r = 2; r < i; r += 3) n += t[e[r - 2] >> 2], n += t[(e[r - 2] & 3) << 4 | e[r - 1] >> 4], n += t[(e[r - 1] & 15) << 2 | e[r] >> 6], n += t[e[r] & 63];
					return r === i + 1 && (n += t[e[r - 2] >> 2], n += t[(e[r - 2] & 3) << 4], n += "=="), r === i && (n += t[e[r - 2] >> 2], n += t[(e[r - 2] & 3) << 4 | e[r - 1] >> 4], n += t[(e[r - 1] & 15) << 2], n += "="), n;
				}
			},
			compatible: {
				data: function(e) {
					for (var n = 0; n < e.length; n++) if (e[n].constructor === Object && e[n].data instanceof Uint8Array && e[n].flavor) {
						var r = e[n].flavor.toString().toUpperCase();
						switch (r) {
							case "BASE64":
								e[n].data = t.tools.uint8ArrayToBase64(e[n].data);
								break;
							case "HEX":
								e[n].data = t.tools.uint8ArrayToHex(e[n].data);
								break;
							default: throw Error("Uint8Array conversion to '" + r + "' is not supported.");
						}
					}
					if (t.tools.versionCompare(2, 2, 4) < 0) for (var n = 0; n < e.length; n++) e[n].constructor === Object && e[n].options && typeof e[n].options.dotDensity == "string" && (e[n].options.dotDensity = e[n].options.dotDensity.toLowerCase().replace("-legacy", ""));
					if (t.tools.isVersion(2, 0)) {
						t.log.trace("Converting print data to v2.0 for " + t.websocket.connection.version);
						for (var n = 0; n < e.length; n++) e[n].constructor === Object && (e[n].type && e[n].type.toUpperCase() === "RAW" && e[n].format && e[n].format.toUpperCase() === "IMAGE" && (e[n].flavor && e[n].flavor.toUpperCase() === "BASE64" && (e[n].data = "data:image/compat;base64," + e[n].data), e[n].flavor = "IMAGE"), (e[n].type && e[n].type.toUpperCase() === "RAW" || e[n].format && e[n].format.toUpperCase() === "COMMAND") && (e[n].format = "RAW"), e[n].type = e[n].format, e[n].format = e[n].flavor, delete e[n].flavor);
					}
				},
				config: function(e, n) {
					return t.tools.isVersion(2, 0) && (n.rasterize || (e.rasterize = !0)), t.tools.versionCompare(2, 2) < 0 && e.forceRaw !== "undefined" && (e.altPrinting = e.forceRaw, delete e.forceRaw), t.tools.versionCompare(2, 1, 2, 11) < 0 && e.spool && (e.spool.size && (e.perSpool = e.spool.size, delete e.spool.size), e.spool.end && (e.endOfDoc = e.spool.end, delete e.spool.end), delete e.spool), e;
				},
				networking: function(e, n, r, i, a) {
					return t.tools.isVersion(2, 0) ? t.tools.promise(function(o, s) {
						t.websocket.dataPromise("websocket.getNetworkInfo", {
							hostname: e,
							port: n
						}, r, i).then(function(e) {
							o(a === void 0 ? e : a(e));
						}, s);
					}) : t.tools.promise(function(a, o) {
						t.websocket.dataPromise("networking.device", {
							hostname: e,
							port: n
						}, r, i).then(function(e) {
							a({
								ipAddress: e.ip,
								macAddress: e.mac
							});
						}, o);
					});
				},
				algorithm: function(e) {
					return t.tools.isActive() && t.websocket.connection.semver && t.tools.isVersion(2, 0) ? (e || t.log.warn("Connected to an older version of " + t.TITLE + ", alternate signature algorithms are not supported"), !1) : !0;
				}
			},
			SHA: {
				hash: function(e) {
					e = t.SHA._utf8Encode(e) + "";
					for (var n = [
						1116352408,
						1899447441,
						3049323471,
						3921009573,
						961987163,
						1508970993,
						2453635748,
						2870763221,
						3624381080,
						310598401,
						607225278,
						1426881987,
						1925078388,
						2162078206,
						2614888103,
						3248222580,
						3835390401,
						4022224774,
						264347078,
						604807628,
						770255983,
						1249150122,
						1555081692,
						1996064986,
						2554220882,
						2821834349,
						2952996808,
						3210313671,
						3336571891,
						3584528711,
						113926993,
						338241895,
						666307205,
						773529912,
						1294757372,
						1396182291,
						1695183700,
						1986661051,
						2177026350,
						2456956037,
						2730485921,
						2820302411,
						3259730800,
						3345764771,
						3516065817,
						3600352804,
						4094571909,
						275423344,
						430227734,
						506948616,
						659060556,
						883997877,
						958139571,
						1322822218,
						1537002063,
						1747873779,
						1955562222,
						2024104815,
						2227730452,
						2361852424,
						2428436474,
						2756734187,
						3204031479,
						3329325298
					], r = [
						1779033703,
						3144134277,
						1013904242,
						2773480762,
						1359893119,
						2600822924,
						528734635,
						1541459225
					], i = e.length / 4 + 2, a = Math.ceil(i / 16), o = Array(a), s = 0; s < a; s++) {
						o[s] = Array(16);
						for (var c = 0; c < 16; c++) o[s][c] = e.charCodeAt(s * 64 + c * 4) << 24 | e.charCodeAt(s * 64 + c * 4 + 1) << 16 | e.charCodeAt(s * 64 + c * 4 + 2) << 8 | e.charCodeAt(s * 64 + c * 4 + 3);
					}
					o[a - 1][14] = (e.length - 1) * 8 / 2 ** 32, o[a - 1][14] = Math.floor(o[a - 1][14]), o[a - 1][15] = (e.length - 1) * 8 & 4294967295;
					for (var l = Array(64), u, d, f, p, m, h, g, _, s = 0; s < a; s++) {
						for (var v = 0; v < 16; v++) l[v] = o[s][v];
						for (var v = 16; v < 64; v++) l[v] = t.SHA._dev1(l[v - 2]) + l[v - 7] + t.SHA._dev0(l[v - 15]) + l[v - 16] & 4294967295;
						u = r[0], d = r[1], f = r[2], p = r[3], m = r[4], h = r[5], g = r[6], _ = r[7];
						for (var v = 0; v < 64; v++) {
							var y = _ + t.SHA._sig1(m) + t.SHA._ch(m, h, g) + n[v] + l[v], b = t.SHA._sig0(u) + t.SHA._maj(u, d, f);
							_ = g, g = h, h = m, m = p + y & 4294967295, p = f, f = d, d = u, u = y + b & 4294967295;
						}
						r[0] = r[0] + u & 4294967295, r[1] = r[1] + d & 4294967295, r[2] = r[2] + f & 4294967295, r[3] = r[3] + p & 4294967295, r[4] = r[4] + m & 4294967295, r[5] = r[5] + h & 4294967295, r[6] = r[6] + g & 4294967295, r[7] = r[7] + _ & 4294967295;
					}
					return t.SHA._hexStr(r[0]) + t.SHA._hexStr(r[1]) + t.SHA._hexStr(r[2]) + t.SHA._hexStr(r[3]) + t.SHA._hexStr(r[4]) + t.SHA._hexStr(r[5]) + t.SHA._hexStr(r[6]) + t.SHA._hexStr(r[7]);
				},
				_rotr: function(e, t) {
					return t >>> e | t << 32 - e;
				},
				_sig0: function(e) {
					return t.SHA._rotr(2, e) ^ t.SHA._rotr(13, e) ^ t.SHA._rotr(22, e);
				},
				_sig1: function(e) {
					return t.SHA._rotr(6, e) ^ t.SHA._rotr(11, e) ^ t.SHA._rotr(25, e);
				},
				_dev0: function(e) {
					return t.SHA._rotr(7, e) ^ t.SHA._rotr(18, e) ^ e >>> 3;
				},
				_dev1: function(e) {
					return t.SHA._rotr(17, e) ^ t.SHA._rotr(19, e) ^ e >>> 10;
				},
				_ch: function(e, t, n) {
					return e & t ^ ~e & n;
				},
				_maj: function(e, t, n) {
					return e & t ^ e & n ^ t & n;
				},
				_hexStr: function(e) {
					for (var t = "", n, r = 7; r >= 0; r--) n = e >>> r * 4 & 15, t += n.toString(16);
					return t;
				},
				_unescape: function(e) {
					return e.replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, function(e) {
						if (e.length - 1) return String.fromCharCode(parseInt(e.substring(e.length - 3 ? 2 : 1), 16));
						var t = e.charCodeAt(0);
						return t < 256 ? "%" + (0 + t.toString(16)).slice(-2).toUpperCase() : "%u" + ("000" + t.toString(16)).slice(-4).toUpperCase();
					});
				},
				_utf8Encode: function(e) {
					return t.SHA._unescape(encodeURIComponent(e));
				}
			}
		};
		function n(e, n) {
			this.config = t.tools.extend({}, t.printing.defaultConfig), this._dirtyOpts = {}, this.setPrinter = function(e) {
				typeof e == "string" && (e = { name: e }), this.printer = e;
			}, this.getPrinter = function() {
				return this.printer;
			}, this.reconfigure = function(e) {
				for (var n in e) e[n] !== void 0 && (this._dirtyOpts[n] = !0);
				t.tools.extend(this.config, e);
			}, this.getOptions = function() {
				return t.compatible.config(this.config, this._dirtyOpts);
			}, this.setPrinter(e), this.reconfigure(n);
		}
		n.prototype.print = function(e, t, n) {
			r.print(this, e, t, n);
		};
		var r = {
			websocket: {
				isActive: function() {
					return t.tools.isActive();
				},
				connect: function(e) {
					return t.tools.promise(function(n, r) {
						if (t.websocket.connection) {
							let e = t.websocket.connection.readyState;
							if (e === t.tools.ws.OPEN) {
								r(/* @__PURE__ */ Error("An open connection with " + t.TITLE + " already exists"));
								return;
							}
							if (e === t.tools.ws.CONNECTING) {
								r(/* @__PURE__ */ Error("The current connection attempt has not returned yet"));
								return;
							}
							if (e === t.tools.ws.CLOSING) {
								r(/* @__PURE__ */ Error("Waiting for previous disconnect request to complete"));
								return;
							}
						}
						if (!t.tools.ws) {
							r(/* @__PURE__ */ Error("WebSocket not supported by this browser"));
							return;
						}
						if (!t.tools.ws.CLOSED || t.tools.ws.CLOSED == 2) {
							r(/* @__PURE__ */ Error("Unsupported WebSocket version detected: HyBi-00/Hixie-76"));
							return;
						}
						if (e ??= {}, (typeof location > "u" || location.protocol !== "https:") && e.usingSecure === void 0 && (t.log.trace("Disabling secure ports due to insecure page"), e.usingSecure = !1), e.host !== void 0 && !Array.isArray(e.host) && (e.host = [e.host], t.websocket.connectConfig.usingSurf)) for (var i = 0; i < e.host.length; i++) e.host[i] = t.tools.appendSurf(e.host[i]);
						t.websocket.shutdown = !1;
						var a = function(i) {
							var o = !1, s = function() {
								o || (o = !0, e && i < e.retries ? a(i + 1) : (t.websocket.connection = null, r.apply(null, arguments)));
							}, c = function() {
								var r = t.tools.extend({}, t.websocket.connectConfig, e);
								t.websocket.setup.findConnection(r, n, s);
							};
							i == 0 ? c() : setTimeout(c, e.delay * 1e3);
						};
						a(0);
					});
				},
				disconnect: function() {
					return t.tools.promise(function(e, n) {
						t.websocket.connection == null ? n(/* @__PURE__ */ Error("No open connection with " + t.TITLE)) : t.tools.isActive() || t.websocket.connection.readyState === t.tools.ws.CONNECTING ? (t.websocket.shutdown = !0, t.websocket.connection.promise = {
							resolve: e,
							reject: n
						}, t.websocket.connection.close()) : n(/* @__PURE__ */ Error("Current connection is still closing"));
					});
				},
				setErrorCallbacks: function(e) {
					t.websocket.errorCallbacks = e;
				},
				setClosedCallbacks: function(e) {
					t.websocket.closedCallbacks = e;
				},
				setUsingSurf: function(e) {
					t.websocket.connectConfig.usingSurf = e;
				},
				setSurfDomain: function(e) {
					e.indexOf(".") === 0 && (e = e.substring(1)), t.websocket.connectConfig.surfDomain = e;
				},
				getNetworkInfo: t.compatible.networking,
				getConnectionInfo: function() {
					if (t.tools.assertActive()) {
						var e = t.websocket.connection.url.split(/[:\/]+/g);
						return {
							socket: e[0],
							host: e[1],
							port: +e[2]
						};
					}
				}
			},
			printers: {
				getDefault: function(e, n) {
					return t.websocket.dataPromise("printers.getDefault", null, e, n);
				},
				find: function(e, n, r) {
					return t.websocket.dataPromise("printers.find", { query: e }, n, r);
				},
				details: function() {
					return t.websocket.dataPromise("printers.detail");
				},
				startListening: function(e, n) {
					Array.isArray(e) || (e = [e]);
					var r = { printerNames: e };
					return n && n.jobData == 1 && (r.jobData = !0), n && n.maxJobData && (r.maxJobData = n.maxJobData), n && n.flavor && (r.flavor = n.flavor), t.websocket.dataPromise("printers.startListening", r);
				},
				clearQueue: function(e) {
					return typeof e != "object" && (e = { printerName: e }), t.websocket.dataPromise("printers.clearQueue", e);
				},
				stopListening: function() {
					return t.websocket.dataPromise("printers.stopListening");
				},
				getStatus: function() {
					return t.websocket.dataPromise("printers.getStatus");
				},
				setPrinterCallbacks: function(e) {
					t.printers.printerCallbacks = e;
				}
			},
			configs: {
				setDefaults: function(e) {
					t.tools.extend(t.printing.defaultConfig, e);
				},
				create: function(e, t) {
					return new n(e, t);
				}
			},
			print: function(e, n) {
				var r = !1, i = [], a = [];
				arguments.length >= 3 && (typeof arguments[2] == "boolean" ? (r = arguments[2], arguments.length >= 5 && (i = arguments[3], a = arguments[4])) : arguments.length >= 4 && (i = arguments[2], a = arguments[3]), i && !Array.isArray(i) && (i = [i]), a && !Array.isArray(a) && (a = [a])), Array.isArray(e) || (e = [e]), Array.isArray(n[0]) || (n = [n]);
				for (var o = 0; o < n.length; o++) t.tools.relative(n[o]), t.compatible.data(n[o]);
				for (var s = function(e) {
					var n = {
						printer: e.config.getPrinter(),
						options: e.config.getOptions(),
						data: e.data
					};
					return t.websocket.dataPromise("print", n, e.signature, e.timestamp);
				}, c = [], l = 0; l < e.length || l < n.length; l++) (function(t) {
					var r = {
						config: e[Math.min(t, e.length - 1)],
						data: n[Math.min(t, n.length - 1)],
						signature: i[t],
						timestamp: a[t]
					};
					c.push(function() {
						return s(r);
					});
				})(l);
				var u = null;
				if (r) {
					var d = [];
					u = function(e) {
						d.push(e);
					}, c.push(function() {
						return t.tools.promise(function(e, t) {
							d.length ? t(d) : e();
						});
					});
				}
				var f = null;
				return c.reduce(function(e, t) {
					return f = e.catch(u).then(t), f;
				}, t.tools.promise(function(e) {
					e();
				})), f;
			},
			serial: {
				findPorts: function() {
					return t.websocket.dataPromise("serial.findPorts");
				},
				setSerialCallbacks: function(e) {
					t.serial.serialCallbacks = e;
				},
				openPort: function(e, n) {
					var r = {
						port: e,
						options: n
					};
					return t.websocket.dataPromise("serial.openPort", r);
				},
				sendData: function(e, n, r) {
					t.tools.versionCompare(2, 1, 0, 12) >= 0 && (typeof n != "object" && (n = {
						data: n,
						type: "PLAIN"
					}), n.type && n.type.toUpperCase() == "FILE" && (n.data = t.tools.absolute(n.data)));
					var i = {
						port: e,
						data: n,
						options: r
					};
					return t.websocket.dataPromise("serial.sendData", i);
				},
				closePort: function(e) {
					return t.websocket.dataPromise("serial.closePort", { port: e });
				}
			},
			socket: {
				open: function(e, n, r) {
					var i = {
						host: e,
						port: n,
						options: r
					};
					return t.websocket.dataPromise("socket.open", i);
				},
				close: function(e, n) {
					var r = {
						host: e,
						port: n
					};
					return t.websocket.dataPromise("socket.close", r);
				},
				sendData: function(e, n, r) {
					typeof r != "object" && (r = {
						data: r,
						type: "PLAIN"
					});
					var i = {
						host: e,
						port: n,
						data: r
					};
					return t.websocket.dataPromise("socket.sendData", i);
				},
				setSocketCallbacks: function(e) {
					t.socket.socketCallbacks = e;
				}
			},
			usb: {
				listDevices: function(e) {
					return t.websocket.dataPromise("usb.listDevices", { includeHubs: e });
				},
				listInterfaces: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("usb.listInterfaces", e);
				},
				listEndpoints: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						interface: arguments[2]
					}), t.websocket.dataPromise("usb.listEndpoints", e);
				},
				setUsbCallbacks: function(e) {
					t.usb.usbCallbacks = e;
				},
				claimDevice: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						interface: arguments[2]
					}), t.websocket.dataPromise("usb.claimDevice", e);
				},
				isClaimed: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("usb.isClaimed", e);
				},
				sendData: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						endpoint: arguments[2],
						data: arguments[3]
					}), t.tools.versionCompare(2, 1, 0, 12) >= 0 && (typeof e.data != "object" && (e.data = {
						data: e.data,
						type: "PLAIN"
					}), e.data.type && e.data.type.toUpperCase() == "FILE" && (e.data.data = t.tools.absolute(e.data.data))), t.websocket.dataPromise("usb.sendData", e);
				},
				readData: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						endpoint: arguments[2],
						responseSize: arguments[3]
					}), t.websocket.dataPromise("usb.readData", e);
				},
				openStream: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						endpoint: arguments[2],
						responseSize: arguments[3],
						interval: arguments[4]
					}), t.websocket.dataPromise("usb.openStream", e);
				},
				closeStream: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						endpoint: arguments[2]
					}), t.websocket.dataPromise("usb.closeStream", e);
				},
				releaseDevice: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("usb.releaseDevice", e);
				}
			},
			hid: {
				listDevices: function() {
					return t.websocket.dataPromise("hid.listDevices");
				},
				startListening: function() {
					return t.websocket.dataPromise("hid.startListening");
				},
				stopListening: function() {
					return t.websocket.dataPromise("hid.stopListening");
				},
				setHidCallbacks: function(e) {
					t.hid.hidCallbacks = e;
				},
				claimDevice: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("hid.claimDevice", e);
				},
				isClaimed: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("hid.isClaimed", e);
				},
				sendData: function(e) {
					if (typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						data: arguments[2],
						endpoint: arguments[3]
					}), t.tools.versionCompare(2, 1, 0, 12) >= 0) typeof e.data != "object" && (e.data = {
						data: e.data,
						type: "PLAIN"
					}), e.data.type && e.data.type.toUpperCase() == "FILE" && (e.data.data = t.tools.absolute(e.data.data));
					else if (typeof e.data == "object") {
						if (e.data.type.toUpperCase() !== "PLAIN" || typeof e.data.data != "string") return t.tools.reject(/* @__PURE__ */ Error("Data format is not supported with connected " + t.TITLE + " version " + t.websocket.connection.version));
						e.data = e.data.data;
					}
					return t.websocket.dataPromise("hid.sendData", e);
				},
				readData: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						responseSize: arguments[2]
					}), t.websocket.dataPromise("hid.readData", e);
				},
				sendFeatureReport: function(e) {
					return t.websocket.dataPromise("hid.sendFeatureReport", e);
				},
				getFeatureReport: function(e) {
					return t.websocket.dataPromise("hid.getFeatureReport", e);
				},
				openStream: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1],
						responseSize: arguments[2],
						interval: arguments[3]
					}), t.websocket.dataPromise("hid.openStream", e);
				},
				closeStream: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("hid.closeStream", e);
				},
				releaseDevice: function(e) {
					return typeof e != "object" && (e = {
						vendorId: arguments[0],
						productId: arguments[1]
					}), t.websocket.dataPromise("hid.releaseDevice", e);
				}
			},
			file: {
				list: function(e, n) {
					var r = t.tools.extend({ path: e }, n);
					return t.websocket.dataPromise("file.list", r);
				},
				read: function(e, n) {
					var r = t.tools.extend({ path: e }, n);
					return t.websocket.dataPromise("file.read", r);
				},
				write: function(e, n) {
					var r = t.tools.extend({ path: e }, n);
					return t.websocket.dataPromise("file.write", r);
				},
				remove: function(e, n) {
					var r = t.tools.extend({ path: e }, n);
					return t.websocket.dataPromise("file.remove", r);
				},
				startListening: function(e, n) {
					n && n.include !== void 0 && !Array.isArray(n.include) && (n.include = [n.include]), n && n.exclude !== void 0 && !Array.isArray(n.exclude) && (n.exclude = [n.exclude]);
					var r = t.tools.extend({ path: e }, n);
					return t.websocket.dataPromise("file.startListening", r);
				},
				stopListening: function(e, n) {
					var r = t.tools.extend({ path: e }, n);
					return t.websocket.dataPromise("file.stopListening", r);
				},
				setFileCallbacks: function(e) {
					t.file.fileCallbacks = e;
				}
			},
			networking: {
				device: function(e, n) {
					return t.tools.isVersion(2, 0) ? t.compatible.networking(e, n, null, null, function(e) {
						return {
							ip: e.ipAddress,
							mac: e.macAddress
						};
					}) : t.websocket.dataPromise("networking.device", {
						hostname: e,
						port: n
					});
				},
				hostname: function(e, n) {
					return t.tools.versionCompare(2, 2, 2) < 0 ? t.tools.promise(function(r, i) {
						t.websocket.dataPromise("networking.device", {
							hostname: e,
							port: n
						}).then(function(e) {
							console.log(e), r(e.hostname);
						});
					}) : t.websocket.dataPromise("networking.hostname");
				},
				devices: function(e, n) {
					return t.tools.isVersion(2, 0) ? t.compatible.networking(e, n, null, null, function(e) {
						return [{
							ip: e.ipAddress,
							mac: e.macAddress
						}];
					}) : t.websocket.dataPromise("networking.devices", {
						hostname: e,
						port: n
					});
				}
			},
			security: {
				setCertificatePromise: function(e, n) {
					t.security.certHandler = e, t.security.rejectOnCertFailure = !!(n && n.rejectOnFailure);
				},
				setSignaturePromise: function(e) {
					t.security.signatureFactory = e;
				},
				setSignatureAlgorithm: function(e) {
					t.compatible.algorithm() && ([
						"SHA1",
						"SHA256",
						"SHA512"
					].indexOf(e.toUpperCase()) < 0 ? t.log.error("Signing algorithm '" + e + "' is not supported.") : t.security.signAlgorithm = e);
				},
				getSignatureAlgorithm: function() {
					return t.security.signAlgorithm;
				}
			},
			api: {
				showDebug: function(e) {
					return t.DEBUG = e;
				},
				getTitle: function() {
					return t.TITLE;
				},
				getVersion: function(e) {
					return t.websocket.dataPromise("getVersion", e);
				},
				isVersion: t.tools.isVersion,
				isVersionGreater: function(e, n, r, i) {
					return t.tools.versionCompare(e, n, r, i) > 0;
				},
				isVersionLess: function(e, n, r, i) {
					return t.tools.versionCompare(e, n, r, i) < 0;
				},
				setPromiseType: function(e) {
					t.tools.promise = e;
				},
				setSha256Type: function(e) {
					t.tools.hash = e;
				},
				setTitle: function(e) {
					t.TITLE = e;
				},
				setWebSocketType: function(e) {
					t.tools.ws = e;
				}
			},
			version: t.VERSION
		};
		return r;
	})();
	(function() {
		typeof define == "function" && define.amd ? define(n) : typeof e == "object" ? t.exports = n : typeof window == "object" ? window.qz = n : self.qz = n;
	})();
})), p = /* @__PURE__ */ o(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.AddressError = void 0, e.AddressError = class extends Error {
		constructor(e, t) {
			super(e), this.name = "AddressError", this.parseMessage = t;
		}
	};
})), m = /* @__PURE__ */ o(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.isInSubnet = n, e.isHostInSubnet = r, e.isGloballyReachable = i, e.offsetBigInt = a, e.isCorrect = o, e.prefixLengthFromMask = s, e.assertByteArray = c, e.numberToPaddedHex = l, e.stringToPaddedHex = u, e.testBit = d;
	var t = p();
	function n(e) {
		return this.subnetMask < e.subnetMask ? !1 : r.call(this, e);
	}
	function r(e) {
		return this.binaryZeroPad().length === e.binaryZeroPad().length && this.mask(e.subnetMask) === e.mask();
	}
	function i(e) {
		let t = null;
		for (let n = 0; n < e.length; n++) {
			let i = e[n];
			i.reachable !== null && r.call(this, i.subnet) && (t === null || i.subnet.subnetMask > t.subnet.subnetMask) && (t = i);
		}
		return t === null || t.reachable;
	}
	function a(e, n, r, i) {
		if (typeof n == "number" && !Number.isSafeInteger(n) || typeof n != "number" && typeof n != "bigint") throw new t.AddressError(`${i} offset must be an integer`);
		let a = e + BigInt(n);
		if (a < BigInt(0) || a > (BigInt(1) << BigInt(r)) - BigInt(1)) throw new t.AddressError(`${i} offset leaves the address space`);
		return a;
	}
	function o(e) {
		return function() {
			return this.addressMinusSuffix === this.correctForm() ? this.subnetMask === e && !this.parsedSubnet || this.parsedSubnet === String(this.subnetMask) : !1;
		};
	}
	function s(e, n) {
		let r = e.toString(2).padStart(n, "0");
		if (r.length > n) throw new t.AddressError("Invalid subnet mask.");
		let i = r.indexOf("0");
		if (i === -1) return n;
		if (r.slice(i).includes("1")) throw new t.AddressError("Invalid subnet mask.");
		return i;
	}
	function c(e, n, r, i) {
		if (e.length !== n) throw new t.AddressError(`${r} addresses require exactly ${n} bytes`);
		for (let n = 0; n < e.length; n++) if (!Number.isInteger(e[n]) || e[n] < i || e[n] > 255) throw new t.AddressError(`All bytes must be integers between ${i} and 255`);
	}
	function l(e) {
		return e.toString(16).padStart(2, "0");
	}
	function u(e) {
		return l(parseInt(e, 10));
	}
	function d(e, t) {
		let { length: n } = e;
		if (t > n) return !1;
		let r = n - t;
		return e.substring(r, r + 1) === "1";
	}
})), h = /* @__PURE__ */ o(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SPECIAL_PURPOSE = e.RE_SUBNET_STRING = e.RE_ADDRESS = e.GROUPS = e.BITS = void 0, e.BITS = 32, e.GROUPS = 4, e.RE_ADDRESS = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/g, e.RE_SUBNET_STRING = /\/\d{1,2}$/, e.SPECIAL_PURPOSE = [
		[
			"0.0.0.0/8",
			"This network",
			!1
		],
		[
			"0.0.0.0/32",
			"This host on this network",
			!1
		],
		[
			"10.0.0.0/8",
			"Private-Use",
			!1
		],
		[
			"100.64.0.0/10",
			"Shared Address Space",
			!1
		],
		[
			"127.0.0.0/8",
			"Loopback",
			!1
		],
		[
			"169.254.0.0/16",
			"Link Local",
			!1
		],
		[
			"172.16.0.0/12",
			"Private-Use",
			!1
		],
		[
			"192.0.0.0/24",
			"IETF Protocol Assignments",
			!1
		],
		[
			"192.0.0.0/29",
			"IPv4 Service Continuity Prefix",
			!1
		],
		[
			"192.0.0.8/32",
			"IPv4 dummy address",
			!1
		],
		[
			"192.0.0.9/32",
			"Port Control Protocol Anycast",
			!0
		],
		[
			"192.0.0.10/32",
			"Traversal Using Relays around NAT Anycast",
			!0
		],
		[
			"192.0.0.170/32",
			"NAT64/DNS64 Discovery",
			!1
		],
		[
			"192.0.0.171/32",
			"NAT64/DNS64 Discovery",
			!1
		],
		[
			"192.0.2.0/24",
			"Documentation (TEST-NET-1)",
			!1
		],
		[
			"192.31.196.0/24",
			"AS112-v4",
			!0
		],
		[
			"192.52.193.0/24",
			"AMT",
			!0
		],
		[
			"192.88.99.0/24",
			"Deprecated (6to4 Relay Anycast)",
			null
		],
		[
			"192.88.99.2/32",
			"6a44-relay anycast address",
			!1
		],
		[
			"192.168.0.0/16",
			"Private-Use",
			!1
		],
		[
			"192.175.48.0/24",
			"Direct Delegation AS112 Service",
			!0
		],
		[
			"198.18.0.0/15",
			"Benchmarking",
			!1
		],
		[
			"198.51.100.0/24",
			"Documentation (TEST-NET-2)",
			!1
		],
		[
			"203.0.113.0/24",
			"Documentation (TEST-NET-3)",
			!1
		],
		[
			"240.0.0.0/4",
			"Reserved",
			!1
		],
		[
			"255.255.255.255/32",
			"Limited Broadcast",
			!1
		]
	];
})), g = /* @__PURE__ */ o(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Address4 = void 0;
	var i = r(m()), a = r(h()), o = p(), s = i.isCorrect(a.BITS), c = class e {
		constructor(e) {
			this.addressMinusSuffix = "", this.groups = a.GROUPS, this.parsedAddress = [], this.parsedSubnet = "", this.subnet = "/32", this.subnetMask = 32, this.v4 = !0, this.isCorrect = s, this.isInSubnet = i.isInSubnet, this.isHostInSubnet = i.isHostInSubnet, this.address = e;
			let t = a.RE_SUBNET_STRING.exec(e);
			if (t) {
				if (this.parsedSubnet = t[0].replace("/", ""), this.subnetMask = parseInt(this.parsedSubnet, 10), this.subnet = `/${this.subnetMask}`, this.subnetMask < 0 || this.subnetMask > a.BITS) throw new o.AddressError("Invalid subnet mask.");
				e = e.replace(a.RE_SUBNET_STRING, "");
			}
			let n = a.GROUPS * 4 - 1;
			if (e.length > n) throw new o.AddressError(`IPv4 addresses are at most ${n} characters.`);
			this.addressMinusSuffix = e, this.parsedAddress = this.parse(e);
		}
		static isValid(t) {
			try {
				return new e(t), !0;
			} catch {
				return !1;
			}
		}
		parse(e) {
			let t = e.split(".");
			if (t.some((e) => /^0\d/.test(e))) throw new o.AddressError("IPv4 addresses can't have leading zeroes.");
			if (!e.match(a.RE_ADDRESS)) throw new o.AddressError("Invalid IPv4 address.");
			return t;
		}
		correctForm() {
			return this.parsedAddress.map((e) => parseInt(e, 10)).join(".");
		}
		static fromAddressAndMask(t, n) {
			let r = i.prefixLengthFromMask(new e(n).bigInt(), a.BITS);
			return new e(`${t}/${r}`);
		}
		static fromAddressAndWildcardMask(t, n) {
			let r = new e(n).bigInt() ^ (BigInt(1) << BigInt(a.BITS)) - BigInt(1), o = i.prefixLengthFromMask(r, a.BITS);
			return new e(`${t}/${o}`);
		}
		static fromWildcard(t) {
			let n = t.split(".");
			if (n.length !== a.GROUPS) throw new o.AddressError("Wildcard pattern must have 4 octets");
			let r = -1;
			for (let e = 0; e < n.length; e++) if (n[e] === "*") r === -1 && (r = e);
			else if (r !== -1) throw new o.AddressError("Wildcard `*` must only appear in trailing octets (e.g. `192.168.0.*`)");
			let i = r === -1 ? 0 : n.length - r, s = n.map((e) => e === "*" ? "0" : e), c = a.BITS - i * 8;
			return new e(`${s.join(".")}/${c}`);
		}
		static fromHex(t) {
			let n = t.replace(/:/g, "");
			if (!/^[0-9a-fA-F]{8}$/.test(n)) throw new o.AddressError("IPv4 hex must be exactly 8 hex digits");
			let r = [];
			for (let e = 0; e < 8; e += 2) r.push(parseInt(n.slice(e, e + 2), 16));
			return new e(r.join("."));
		}
		static fromInteger(t) {
			if (!Number.isInteger(t) || t < 0 || t > 4294967295) throw new o.AddressError("IPv4 integer must be in the range 0 to 2**32 - 1");
			return e.fromHex(t.toString(16).padStart(8, "0"));
		}
		static fromArpa(t) {
			let n = a.GROUPS * 4 - 1 + 3 + 14;
			if (t.length > n) throw new o.AddressError(`in-addr.arpa names are at most ${n} characters.`);
			let r = t.replace(/(\.in-addr\.arpa)?\.?$/i, "").split(".").reverse().join(".");
			return new e(r);
		}
		toHex() {
			return this.parsedAddress.map((e) => i.stringToPaddedHex(e)).join(":");
		}
		toArray() {
			return this.parsedAddress.map((e) => parseInt(e, 10));
		}
		toGroup6() {
			let e = [], t = 0;
			for (; t < a.GROUPS; t += 2) e.push(`${i.stringToPaddedHex(this.parsedAddress[t])}${i.stringToPaddedHex(this.parsedAddress[t + 1])}`);
			return e.join(":");
		}
		bigInt() {
			return BigInt(`0x${this.parsedAddress.map((e) => i.stringToPaddedHex(e)).join("")}`);
		}
		_startAddress() {
			return BigInt(`0b${this.mask() + "0".repeat(a.BITS - this.subnetMask)}`);
		}
		startAddress() {
			return e.fromBigInt(this._startAddress());
		}
		startAddressExclusive() {
			let t = BigInt("1");
			return e.fromBigInt(this._startAddress() + t);
		}
		offset(t) {
			return e.fromBigInt(i.offsetBigInt(this.bigInt(), t, a.BITS, "IPv4")).withSubnetMask(this.subnetMask);
		}
		nextNetwork() {
			return e.fromBigInt(i.offsetBigInt(this._endAddress(), 1, a.BITS, "IPv4")).withSubnetMask(this.subnetMask);
		}
		withSubnetMask(t) {
			return new e(`${this.correctForm()}/${t}`);
		}
		_endAddress() {
			return BigInt(`0b${this.mask() + "1".repeat(a.BITS - this.subnetMask)}`);
		}
		endAddress() {
			return e.fromBigInt(this._endAddress());
		}
		endAddressExclusive() {
			let t = BigInt("1");
			return e.fromBigInt(this._endAddress() - t);
		}
		subnetMaskAddress() {
			return e.fromBigInt(BigInt(`0b${"1".repeat(this.subnetMask)}${"0".repeat(a.BITS - this.subnetMask)}`));
		}
		wildcardMask() {
			return e.fromBigInt(BigInt(`0b${"0".repeat(this.subnetMask)}${"1".repeat(a.BITS - this.subnetMask)}`));
		}
		networkForm() {
			return `${this.startAddress().correctForm()}/${this.subnetMask}`;
		}
		static fromBigInt(t) {
			if (t < BigInt(0) || t > BigInt(4294967295)) throw new o.AddressError("IPv4 BigInt must be in the range 0 to 2**32 - 1");
			return e.fromHex(t.toString(16).padStart(8, "0"));
		}
		static fromByteArray(e) {
			return i.assertByteArray(e, 4, "IPv4", 0), this.fromUnsignedByteArray(e);
		}
		static fromUnsignedByteArray(t) {
			if (t.length !== 4) throw new o.AddressError("IPv4 addresses require exactly 4 bytes");
			let n = t.join(".");
			return new e(n);
		}
		mask(e) {
			return e === void 0 && (e = this.subnetMask), this.getBitsBase2(0, e);
		}
		getBitsBase2(e, t) {
			return this.binaryZeroPad().slice(e, t);
		}
		reverseForm(e) {
			e ||= {};
			let t = this.correctForm().split(".").reverse().join(".");
			return e.omitSuffix ? t : `${t}.in-addr.arpa.`;
		}
		isMulticast() {
			return this.isHostInSubnet(l);
		}
		isPrivate() {
			return u.some((e) => this.isHostInSubnet(e));
		}
		isLoopback() {
			return this.isHostInSubnet(d);
		}
		isLinkLocal() {
			return this.isHostInSubnet(f);
		}
		isUnspecified() {
			return this.isHostInSubnet(g);
		}
		isBroadcast() {
			return this.isHostInSubnet(_);
		}
		isCGNAT() {
			return this.isHostInSubnet(v);
		}
		isDocumentation() {
			return y.some((e) => this.isHostInSubnet(e));
		}
		isBenchmarking() {
			return this.isHostInSubnet(b);
		}
		isReserved() {
			return this.isHostInSubnet(x);
		}
		isGlobal() {
			return !this.isMulticast() && i.isGloballyReachable.call(this, S);
		}
		binaryZeroPad() {
			return this._binaryZeroPad === void 0 && (this._binaryZeroPad = this.bigInt().toString(2).padStart(a.BITS, "0")), this._binaryZeroPad;
		}
		groupForV6() {
			let e = this.parsedAddress;
			return this.correctForm().replace(a.RE_ADDRESS, `<span class="hover-group group-v4 group-6">${e.slice(0, 2).join(".")}</span>.<span class="hover-group group-v4 group-7">${e.slice(2, 4).join(".")}</span>`);
		}
	};
	e.Address4 = c;
	var l = new c("224.0.0.0/4"), u = [
		new c("10.0.0.0/8"),
		new c("172.16.0.0/12"),
		new c("192.168.0.0/16")
	], d = new c("127.0.0.0/8"), f = new c("169.254.0.0/16"), g = new c("0.0.0.0/32"), _ = new c("255.255.255.255/32"), v = new c("100.64.0.0/10"), y = [
		new c("192.0.2.0/24"),
		new c("198.51.100.0/24"),
		new c("203.0.113.0/24")
	], b = new c("198.18.0.0/15"), x = new c("240.0.0.0/4"), S = a.SPECIAL_PURPOSE.map(([e, , t]) => ({
		subnet: new c(e),
		reachable: t
	}));
})), _ = /* @__PURE__ */ o(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SPECIAL_PURPOSE = e.RE_URL_WITH_PORT = e.RE_URL = e.RE_ZONE_STRING = e.RE_SUBNET_STRING = e.RE_BAD_ADDRESS = e.RE_BAD_CHARACTERS = e.TYPES = e.SCOPES = e.GROUPS = e.BITS = void 0, e.BITS = 128, e.GROUPS = 8, e.SCOPES = {
		0: "Reserved",
		1: "Interface local",
		2: "Link local",
		4: "Admin local",
		5: "Site local",
		8: "Organization local",
		14: "Global",
		15: "Reserved"
	}, e.TYPES = {
		"ff01::1/128": "Multicast (All nodes on this interface)",
		"ff01::2/128": "Multicast (All routers on this interface)",
		"ff02::1/128": "Multicast (All nodes on this link)",
		"ff02::2/128": "Multicast (All routers on this link)",
		"ff05::2/128": "Multicast (All routers in this site)",
		"ff02::5/128": "Multicast (OSPFv3 AllSPF routers)",
		"ff02::6/128": "Multicast (OSPFv3 AllDR routers)",
		"ff02::9/128": "Multicast (RIP routers)",
		"ff02::a/128": "Multicast (EIGRP routers)",
		"ff02::d/128": "Multicast (PIM routers)",
		"ff02::16/128": "Multicast (MLDv2 reports)",
		"ff01::fb/128": "Multicast (mDNSv6)",
		"ff02::fb/128": "Multicast (mDNSv6)",
		"ff05::fb/128": "Multicast (mDNSv6)",
		"ff02::1:2/128": "Multicast (All DHCP servers and relay agents on this link)",
		"ff05::1:2/128": "Multicast (All DHCP servers and relay agents in this site)",
		"ff02::1:3/128": "Multicast (All DHCP servers on this link)",
		"ff05::1:3/128": "Multicast (All DHCP servers in this site)",
		"::/128": "Unspecified",
		"::1/128": "Loopback",
		"::ffff:0:0/96": "IPv4-mapped",
		"ff00::/8": "Multicast",
		"fe80::/10": "Link-local unicast",
		"fc00::/7": "Unique local",
		"2001::/32": "Teredo",
		"2001:2::/48": "Benchmarking",
		"2002::/16": "6to4",
		"2001:db8::/32": "Documentation",
		"3fff::/20": "Documentation",
		"100::/64": "Discard-only",
		"fec0::/10": "Site-local unicast (deprecated)",
		"::/96": "IPv4-compatible (deprecated)",
		"64:ff9b::/96": "NAT64 (well-known)",
		"64:ff9b:1::/48": "NAT64 (local-use)"
	}, e.RE_BAD_CHARACTERS = /([^0-9a-f:/%])/gi, e.RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]|\/$)/gi, e.RE_SUBNET_STRING = /\/\d{1,3}(?=%|$)/, e.RE_ZONE_STRING = /%.*$/, e.RE_URL = /^(?:\[([0-9a-f:.]+)\]|([0-9a-f:.]+))(?:[/?#].*)?$/i, e.RE_URL_WITH_PORT = /^\[([0-9a-f:.]+)\]:([0-9]{1,5})(?:[/?#].*)?$/i, e.SPECIAL_PURPOSE = [
		[
			"::1/128",
			"Loopback Address",
			!1
		],
		[
			"::/128",
			"Unspecified Address",
			!1
		],
		[
			"::ffff:0:0/96",
			"IPv4-mapped Address",
			!1
		],
		[
			"64:ff9b::/96",
			"IPv4-IPv6 Translat.",
			!0
		],
		[
			"64:ff9b:1::/48",
			"IPv4-IPv6 Translat.",
			!1
		],
		[
			"100::/64",
			"Discard-Only Address Block",
			!1
		],
		[
			"100:0:0:1::/64",
			"Dummy IPv6 Prefix",
			!1
		],
		[
			"2001::/23",
			"IETF Protocol Assignments",
			!1
		],
		[
			"2001::/32",
			"TEREDO",
			!1
		],
		[
			"2001:1::1/128",
			"Port Control Protocol Anycast",
			!0
		],
		[
			"2001:1::2/128",
			"Traversal Using Relays around NAT Anycast",
			!0
		],
		[
			"2001:1::3/128",
			"DNS-SD Service Registration Protocol Anycast",
			!0
		],
		[
			"2001:2::/48",
			"Benchmarking",
			!1
		],
		[
			"2001:3::/32",
			"AMT",
			!0
		],
		[
			"2001:4:112::/48",
			"AS112-v6",
			!0
		],
		[
			"2001:10::/28",
			"Deprecated (previously ORCHID)",
			null
		],
		[
			"2001:20::/28",
			"ORCHIDv2",
			!0
		],
		[
			"2001:30::/28",
			"Drone Remote ID Protocol Entity Tags (DETs) Prefix",
			!0
		],
		[
			"2001:db8::/32",
			"Documentation",
			!1
		],
		[
			"2002::/16",
			"6to4",
			!1
		],
		[
			"2620:4f:8000::/48",
			"Direct Delegation AS112 Service",
			!0
		],
		[
			"3fff::/20",
			"Documentation",
			!1
		],
		[
			"5f00::/16",
			"Segment Routing (SRv6) SIDs",
			!1
		],
		[
			"fc00::/7",
			"Unique-Local",
			!1
		],
		[
			"fe80::/10",
			"Link-Local Unicast",
			!1
		]
	];
})), v = /* @__PURE__ */ o(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.escapeHtml = t, e.spanAllZeroes = n, e.spanAll = r, e.spanLeadingZeroes = a, e.simpleGroup = o;
	function t(e) {
		return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
	}
	function n(e) {
		return t(e).replace(/(0+)/g, "<span class=\"zero\">$1</span>");
	}
	function r(e, r = 0) {
		return e.split("").map((e, i) => `<span class="digit value-${t(e)} position-${i + r}">${n(e)}</span>`).join("");
	}
	function i(e) {
		return t(e).replace(/^(0+)/, "<span class=\"zero\">$1</span>");
	}
	function a(e) {
		return e.split(":").map((e) => i(e)).join(":");
	}
	function o(e, t = 0) {
		return e.split(":").map((e, n) => /group-v4/.test(e) ? e : `<span class="hover-group group-${n + t}">${i(e)}</span>`);
	}
})), y = /* @__PURE__ */ o(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ADDRESS_BOUNDARY = void 0, e.groupPossibilities = a, e.padGroup = o, e.simpleRegularExpression = s, e.possibleElisions = c;
	var i = r(_());
	function a(e) {
		return `(${e.join("|")})`;
	}
	function o(e) {
		return e.length < 4 ? `0{0,${4 - e.length}}${e}` : e;
	}
	e.ADDRESS_BOUNDARY = "[^A-Fa-f0-9:]";
	function s(e) {
		let t = [];
		e.forEach((e, n) => {
			parseInt(e, 16) === 0 && t.push(n);
		});
		let n = t.map((t) => e.map((e, n) => {
			if (n === t) {
				let t = n === 0 || n === i.GROUPS - 1 ? ":" : "";
				return a([o(e), t]);
			}
			return o(e);
		}).join(":"));
		return n.push(e.map(o).join(":")), a(n);
	}
	function c(e, t, n) {
		let r = t ? "" : ":", i = n ? "" : ":", o = [];
		!t && !n && o.push("::"), t && n && o.push(""), (n && !t || !n && t) && o.push(":"), o.push(`${r}(:0{1,4}){1,${e - 1}}`), o.push(`(0{1,4}:){1,${e - 1}}${i}`), o.push(`(0{1,4}:){${e - 1}}0{1,4}`);
		for (let t = 1; t < e - 1; t++) for (let n = 1; n < e - t; n++) o.push(`(0{1,4}:){${n}}:(0{1,4}:){${e - n - t - 1}}0{1,4}`);
		return a(o);
	}
})), b = /* @__PURE__ */ o(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Address6 = void 0;
	var i = r(m()), a = r(h()), o = r(_()), s = r(v()), c = g(), l = y(), u = p(), d = m(), f = i.isCorrect(o.BITS);
	function b(e) {
		if (!e) throw Error("Assertion failed.");
	}
	function x(e) {
		let t = /(\d+)(\d{3})/;
		for (; t.test(e);) e = e.replace(t, "$1,$2");
		return e;
	}
	function S(e) {
		return e = e.replace(/^(0{1,})([1-9]+)$/, "<span class=\"parse-error\">$1</span>$2"), e = e.replace(/^(0{1,})(0)$/, "<span class=\"parse-error\">$1</span>$2"), e;
	}
	function C(e, t) {
		let n = [], r = [], i = 0;
		for (; i < e.length; i++) i < t[0] ? n.push(e[i]) : i > t[1] && r.push(e[i]);
		return n.concat(["compact"]).concat(r);
	}
	function w(e) {
		return parseInt(e, 16).toString(16).padStart(4, "0");
	}
	function T(e) {
		return e & 255;
	}
	var E = class e {
		constructor(e, t) {
			this.addressMinusSuffix = "", this.parsedSubnet = "", this.subnet = "/128", this.subnetMask = 128, this.v4 = !1, this.zone = "", this.isInSubnet = i.isInSubnet, this.isHostInSubnet = i.isHostInSubnet, this.isCorrect = f, this.groups = t === void 0 ? o.GROUPS : t, this.address = e;
			let n = o.RE_SUBNET_STRING.exec(e);
			if (n) {
				if (this.parsedSubnet = n[0].replace("/", ""), this.subnetMask = parseInt(this.parsedSubnet, 10), this.subnet = `/${this.subnetMask}`, Number.isNaN(this.subnetMask) || this.subnetMask < 0 || this.subnetMask > o.BITS) throw new u.AddressError("Invalid subnet mask.");
				e = e.replace(o.RE_SUBNET_STRING, "");
			}
			if (/\//.test(e)) throw new u.AddressError("Invalid subnet mask.");
			let r = e.indexOf("%");
			r !== -1 && /^.*$/.test(e.slice(r)) && (this.zone = e.slice(r), e = e.slice(0, r));
			let a = this.groups * 5 + 5;
			if (e.length > a) throw new u.AddressError(`IPv6 addresses are at most ${a} characters.`);
			this.addressMinusSuffix = e, this.parsedAddress = this.parse(this.addressMinusSuffix);
		}
		static isValid(t) {
			try {
				return new e(t), !0;
			} catch {
				return !1;
			}
		}
		static fromBigInt(t) {
			if (t < BigInt(0) || t > (BigInt(1) << BigInt(o.BITS)) - BigInt(1)) throw new u.AddressError("IPv6 BigInt must be in the range 0 to 2**128 - 1");
			let n = t.toString(16).padStart(32, "0"), r = [];
			for (let e = 0; e < o.GROUPS; e++) r.push(n.slice(e * 4, (e + 1) * 4));
			return new e(r.join(":"));
		}
		static fromURL(t) {
			let n, r = null, i, a, s = t.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
			if (s.indexOf("[") !== -1 && s.indexOf("]:") !== -1) {
				if (a = "failed to parse address with port", i = o.RE_URL_WITH_PORT.exec(s), i === null) return {
					error: a,
					address: null,
					port: null
				};
				n = i[1], r = i[2];
			} else {
				if (a = "failed to parse address from URL", i = o.RE_URL.exec(s), i === null) return {
					error: a,
					address: null,
					port: null
				};
				n = i[1] ?? i[2];
			}
			r ? (r = parseInt(r, 10), (r < 0 || r > 65535) && (r = null)) : r = null;
			let c;
			try {
				c = new e(n);
			} catch {
				return {
					error: a,
					address: null,
					port: null
				};
			}
			return {
				address: c,
				port: r
			};
		}
		static fromAddressAndMask(t, n) {
			let r = i.prefixLengthFromMask(new e(n).bigInt(), o.BITS);
			return new e(`${t}/${r}`);
		}
		static fromAddressAndWildcardMask(t, n) {
			let r = new e(n).bigInt() ^ (BigInt(1) << BigInt(o.BITS)) - BigInt(1), a = i.prefixLengthFromMask(r, o.BITS);
			return new e(`${t}/${a}`);
		}
		static fromWildcard(t) {
			if (t.includes("%") || t.includes("/")) throw new u.AddressError("Wildcard pattern must not include a zone or CIDR suffix");
			let n = t.split("::");
			if (n.length > 2) throw new u.AddressError("Wildcard pattern cannot contain more than one '::'");
			let r;
			if (n.length === 2) {
				let e = n[0] === "" ? [] : n[0].split(":"), t = n[1] === "" ? [] : n[1].split(":"), i = o.GROUPS - e.length - t.length;
				if (i < 1) throw new u.AddressError("Wildcard pattern with '::' has too many groups");
				r = [
					...e,
					...Array(i).fill("0"),
					...t
				];
			} else r = t.split(":");
			if (r.length !== o.GROUPS) throw new u.AddressError("Wildcard pattern must have 8 groups");
			let i = -1;
			for (let e = 0; e < r.length; e++) if (r[e] === "*") i === -1 && (i = e);
			else if (i !== -1) throw new u.AddressError("Wildcard `*` must only appear in trailing groups (e.g. `2001:db8:*:*:*:*:*:*`)");
			let a = i === -1 ? 0 : r.length - i, s = r.map((e) => e === "*" ? "0" : e), c = o.BITS - a * 16;
			return new e(`${s.join(":")}/${c}`);
		}
		static fromAddress4(t) {
			let n = new c.Address4(t), r = o.BITS - (a.BITS - n.subnetMask);
			return new e(`::ffff:${n.correctForm()}/${r}`);
		}
		static fromArpa(t) {
			let n = t.replace(/(\.ip6\.arpa)?\.?$/i, "");
			if (!/^[0-9a-f](\.[0-9a-f]){0,31}$/i.test(n)) throw new u.AddressError("Invalid 'ip6.arpa' form.");
			let r = n.split(".").reverse(), i = r.length * 4, a = r.join("").padEnd(32, "0"), s = [];
			for (let e = 0; e < o.GROUPS; e++) s.push(a.slice(e * 4, (e + 1) * 4));
			return new e(`${s.join(":")}/${i}`);
		}
		microsoftTranscription() {
			return `${this.correctForm().replace(/:/g, "-")}.ipv6-literal.net`;
		}
		mask(e = this.subnetMask) {
			return this.getBitsBase2(0, e);
		}
		possibleSubnets(e = 128) {
			let t = o.BITS - this.subnetMask - Math.abs(e - o.BITS);
			return t < 0 ? "0" : x((BigInt("2") ** BigInt(t)).toString(10));
		}
		_startAddress() {
			return BigInt(`0b${this.mask() + "0".repeat(o.BITS - this.subnetMask)}`);
		}
		startAddress() {
			return e.fromBigInt(this._startAddress());
		}
		startAddressExclusive() {
			let t = BigInt("1");
			return e.fromBigInt(this._startAddress() + t);
		}
		_endAddress() {
			return BigInt(`0b${this.mask() + "1".repeat(o.BITS - this.subnetMask)}`);
		}
		endAddress() {
			return e.fromBigInt(this._endAddress());
		}
		endAddressExclusive() {
			let t = BigInt("1");
			return e.fromBigInt(this._endAddress() - t);
		}
		offset(t) {
			return e.fromBigInt(i.offsetBigInt(this.bigInt(), t, o.BITS, "IPv6")).withSubnetMask(this.subnetMask);
		}
		nextNetwork() {
			return e.fromBigInt(i.offsetBigInt(this._endAddress(), 1, o.BITS, "IPv6")).withSubnetMask(this.subnetMask);
		}
		withSubnetMask(t) {
			return new e(`${this.correctForm()}/${t}`);
		}
		subnetMaskAddress() {
			return e.fromBigInt(BigInt(`0b${"1".repeat(this.subnetMask)}${"0".repeat(o.BITS - this.subnetMask)}`));
		}
		wildcardMask() {
			return e.fromBigInt(BigInt(`0b${"0".repeat(this.subnetMask)}${"1".repeat(o.BITS - this.subnetMask)}`));
		}
		networkForm() {
			return `${this.startAddress().correctForm()}/${this.subnetMask}`;
		}
		getScope() {
			let e = this.getType();
			return e === "Multicast" || e.startsWith("Multicast ") ? o.SCOPES[parseInt(this.getBits(12, 16).toString(10), 10)] || "Unknown" : e === "Link-local unicast" || e === "Loopback" ? "Link local" : e === "Unspecified" ? "Unknown" : "Global";
		}
		getType() {
			for (let e = 0; e < D.length; e++) {
				let t = D[e];
				if (this.isHostInSubnet(t[0])) return t[1];
			}
			return "Global unicast";
		}
		getBits(e, t) {
			return BigInt(`0b${this.getBitsBase2(e, t)}`);
		}
		getBitsBase2(e, t) {
			return this.binaryZeroPad().slice(e, t);
		}
		getBitsBase16(e, t) {
			let n = t - e;
			if (n % 4 != 0) throw Error("Length of bits to retrieve must be divisible by four");
			return this.getBits(e, t).toString(16).padStart(n / 4, "0");
		}
		getBitsPastSubnet() {
			return this.getBitsBase2(this.subnetMask, o.BITS);
		}
		reverseForm(e) {
			e ||= {};
			let t = Math.floor(this.subnetMask / 4), n = this.canonicalForm().replace(/:/g, "").split("").slice(0, t).reverse().join(".");
			return t > 0 ? e.omitSuffix ? n : `${n}.ip6.arpa.` : e.omitSuffix ? "" : "ip6.arpa.";
		}
		correctForm() {
			let e, t = [], n = 0, r = [];
			for (e = 0; e < this.parsedAddress.length; e++) {
				let t = parseInt(this.parsedAddress[e], 16);
				t === 0 && n++, t !== 0 && n > 0 && (n > 1 && r.push([e - n, e - 1]), n = 0);
			}
			n > 1 && r.push([this.parsedAddress.length - n, this.parsedAddress.length - 1]);
			let i = r.map((e) => e[1] - e[0] + 1);
			if (r.length > 0) {
				let e = i.indexOf(Math.max(...i));
				t = C(this.parsedAddress, r[e]);
			} else t = this.parsedAddress;
			for (e = 0; e < t.length; e++) t[e] !== "compact" && (t[e] = parseInt(t[e], 16).toString(16));
			let a = t.join(":");
			return a = a.replace(/^compact$/, "::"), a = a.replace(/(^compact)|(compact$)/, ":"), a = a.replace(/compact/, ""), a;
		}
		binaryZeroPad() {
			return this._binaryZeroPad === void 0 && (this._binaryZeroPad = this.bigInt().toString(2).padStart(o.BITS, "0")), this._binaryZeroPad;
		}
		parse4in6(e) {
			if (e.indexOf(".") === -1) return e;
			let t = e.split(":"), n = t.slice(-1)[0], r = n.split(".");
			if (r.length === a.GROUPS && r.every((e) => /^\d{1,3}$/.test(e)) && r.some((e) => /^0\d/.test(e))) {
				let e = r.map(S).join("."), n = t.slice(0, -1).map(s.escapeHtml).join(":"), i = t.length > 1 ? ":" : "";
				throw new u.AddressError("IPv4 addresses can't have leading zeroes.", `${n}${i}${e}`);
			}
			let i = n.match(a.RE_ADDRESS);
			if (i) {
				this.parsedAddress4 = i[0];
				let n = this.subnetMask >= 96 ? `/${this.subnetMask - 96}` : "";
				this.address4 = new c.Address4(`${this.parsedAddress4}${n}`), this.v4 = !0, t[t.length - 1] = this.address4.toGroup6(), e = t.join(":");
			}
			return e;
		}
		parse(e) {
			e = this.parse4in6(e);
			let t = e.match(o.RE_BAD_CHARACTERS);
			if (t) throw new u.AddressError(`Bad character${t.length > 1 ? "s" : ""} detected in address: ${t.join("")}`, e.replace(o.RE_BAD_CHARACTERS, "<span class=\"parse-error\">$1</span>"));
			let n = e.match(o.RE_BAD_ADDRESS);
			if (n) throw new u.AddressError(`Address failed regex: ${n.join("")}`, e.replace(o.RE_BAD_ADDRESS, "<span class=\"parse-error\">$1</span>"));
			let r = [], i = e.split("::");
			if (i.length === 2) {
				let e = i[0].split(":"), t = i[1].split(":");
				e.length === 1 && e[0] === "" && (e = []), t.length === 1 && t[0] === "" && (t = []);
				let n = this.groups - (e.length + t.length);
				if (!n) throw new u.AddressError("Error parsing groups");
				this.elidedGroups = n, this.elisionBegin = e.length, this.elisionEnd = e.length + this.elidedGroups, r = r.concat(e);
				for (let e = 0; e < n; e++) r.push("0");
				r = r.concat(t);
			} else if (i.length === 1) r = e.split(":"), this.elidedGroups = 0;
			else throw new u.AddressError("Too many :: groups found");
			if (r = r.map((e) => parseInt(e, 16).toString(16)), r.length !== this.groups) throw new u.AddressError("Incorrect number of groups found");
			return r;
		}
		canonicalForm() {
			return this.parsedAddress.map(w).join(":");
		}
		decimal() {
			return this.parsedAddress.map((e) => parseInt(e, 16).toString(10).padStart(5, "0")).join(":");
		}
		bigInt() {
			return BigInt(`0x${this.parsedAddress.map(w).join("")}`);
		}
		to4() {
			let e = this.binaryZeroPad().split(""), t = BigInt(`0b${e.slice(96, 128).join("")}`).toString(16).padStart(8, "0");
			if (this.subnetMask >= 96) {
				let e = this.subnetMask - 96, n = [];
				for (let e = 0; e < 8; e += 2) n.push(parseInt(t.slice(e, e + 2), 16));
				return new c.Address4(`${n.join(".")}/${e}`);
			}
			return c.Address4.fromHex(t);
		}
		to4in6() {
			let t = this.to4(), n = new e(this.parsedAddress.slice(0, 6).join(":"), 6).correctForm(), r = "";
			return /:$/.test(n) || (r = ":"), n + r + t.correctForm();
		}
		inspectTeredo() {
			let e = this.getBitsBase16(0, 32), t = (this.getBits(80, 96) ^ BigInt("0xffff")).toString(), n = c.Address4.fromHex(this.getBitsBase16(32, 64)), r = this.getBits(96, 128), i = c.Address4.fromHex((r ^ BigInt("0xffffffff")).toString(16).padStart(8, "0")), a = this.getBitsBase2(64, 80), o = (0, d.testBit)(a, 15), s = (0, d.testBit)(a, 14), l = (0, d.testBit)(a, 8), u = (0, d.testBit)(a, 9), f = BigInt(`0b${a.slice(2, 6) + a.slice(8, 16)}`).toString(10);
			return {
				prefix: `${e.slice(0, 4)}:${e.slice(4, 8)}`,
				server4: n.address,
				client4: i.address,
				flags: a,
				coneNat: o,
				microsoft: {
					reserved: s,
					universalLocal: u,
					groupIndividual: l,
					nonce: f
				},
				udpPort: t
			};
		}
		inspect6to4() {
			let e = this.getBitsBase16(0, 16), t = c.Address4.fromHex(this.getBitsBase16(16, 48));
			return {
				prefix: e.slice(0, 4),
				gateway: t.address
			};
		}
		to6to4() {
			if (!this.is4()) return null;
			let t = [
				"2002",
				this.getBitsBase16(96, 112),
				this.getBitsBase16(112, 128),
				"",
				"/16"
			].join(":");
			return new e(t);
		}
		static fromAddress4Nat64(t, n = "64:ff9b::/96") {
			let r = new c.Address4(t), i = new e(n), a = i.subnetMask;
			if (a !== 32 && a !== 40 && a !== 48 && a !== 56 && a !== 64 && a !== 96) throw new u.AddressError("NAT64 prefix length must be 32, 40, 48, 56, 64, or 96");
			let o = i.binaryZeroPad(), s = r.binaryZeroPad(), l;
			if (a === 96) l = o.slice(0, 96) + s;
			else {
				let e = 64 - a;
				l = [
					o.slice(0, a),
					s.slice(0, e),
					"00000000",
					s.slice(e),
					"0".repeat(56 - (32 - e))
				].join("");
			}
			let d = BigInt(`0b${l}`).toString(16).padStart(32, "0"), f = [];
			for (let e = 0; e < 8; e++) f.push(d.slice(e * 4, (e + 1) * 4));
			return new e(f.join(":"));
		}
		toAddress4Nat64(t = "64:ff9b::/96") {
			let n = new e(t), r = n.subnetMask;
			if (r !== 32 && r !== 40 && r !== 48 && r !== 56 && r !== 64 && r !== 96) throw new u.AddressError("NAT64 prefix length must be 32, 40, 48, 56, 64, or 96");
			if (!this.isHostInSubnet(n)) return null;
			let i = this.binaryZeroPad(), a;
			if (r === 96) a = i.slice(96, 128);
			else {
				let e = 64 - r;
				a = i.slice(r, r + e) + i.slice(72, 72 + (32 - e));
			}
			let o = [];
			for (let e = 0; e < 4; e++) o.push(parseInt(a.slice(e * 8, (e + 1) * 8), 2).toString());
			return new c.Address4(o.join("."));
		}
		toByteArray() {
			let e = this.bigInt().toString(16).padStart(o.BITS / 4, "0"), t = [];
			for (let n = 0, r = e.length; n < r; n += 2) t.push(parseInt(e.substring(n, n + 2), 16));
			return t;
		}
		toUnsignedByteArray() {
			return this.toByteArray().map(T);
		}
		static fromByteArray(e) {
			return i.assertByteArray(e, 16, "IPv6", -128), this.fromUnsignedByteArray(e.map(T));
		}
		static fromUnsignedByteArray(t) {
			i.assertByteArray(t, 16, "IPv6", 0);
			let n = BigInt("256"), r = BigInt("0"), a = BigInt("1");
			for (let e = t.length - 1; e >= 0; e--) r += a * BigInt(t[e].toString(10)), a *= n;
			return e.fromBigInt(r);
		}
		isCanonical() {
			return this.addressMinusSuffix === this.canonicalForm();
		}
		isLinkLocal() {
			let e = this.embeddedIPv4();
			return e ? e.isLinkLocal() : this.isHostInSubnet(te);
		}
		isMulticast() {
			let e = this.embeddedIPv4();
			if (e) return e.isMulticast();
			let t = this.getType();
			return t === "Multicast" || t.startsWith("Multicast ");
		}
		is4() {
			return this.v4;
		}
		isMapped4() {
			return this.isHostInSubnet(P);
		}
		embeddedIPv4() {
			return this.isMapped4() || this.isHostInSubnet(ne) ? this.to4() : null;
		}
		isTeredo() {
			return this.isHostInSubnet(ee);
		}
		is6to4() {
			return this.isHostInSubnet(O);
		}
		isLoopback() {
			let e = this.embeddedIPv4();
			return e ? e.isLoopback() : this.getType() === "Loopback";
		}
		isULA() {
			return this.isHostInSubnet(k);
		}
		isPrivate() {
			let e = this.embeddedIPv4();
			return e ? e.isPrivate() : this.isULA() || this.isHostInSubnet(F);
		}
		isCGNAT() {
			let e = this.embeddedIPv4();
			return e ? e.isCGNAT() : !1;
		}
		isBroadcast() {
			let e = this.embeddedIPv4();
			return e ? e.isBroadcast() : !1;
		}
		isUnspecified() {
			let e = this.embeddedIPv4();
			return e ? e.isUnspecified() : this.getType() === "Unspecified";
		}
		isDocumentation() {
			return A.some((e) => this.isHostInSubnet(e));
		}
		isBenchmarking() {
			let e = this.embeddedIPv4();
			return e ? e.isBenchmarking() : this.isHostInSubnet(j);
		}
		isGlobal() {
			let e = this.embeddedIPv4();
			return e ? e.isGlobal() : this.isHostInSubnet(M) && i.isGloballyReachable.call(this, N);
		}
		href(e) {
			return e = e === void 0 ? "" : `:${e}`, `http://[${this.correctForm()}]${e}/`;
		}
		link(e) {
			e ||= {}, e.className === void 0 && (e.className = ""), e.prefix === void 0 && (e.prefix = "/#address="), e.v4 === void 0 && (e.v4 = !1);
			let t = this.correctForm;
			e.v4 && (t = this.to4in6);
			let n = t.call(this), r = s.escapeHtml(`${e.prefix}${n}`), i = s.escapeHtml(n);
			return e.className ? `<a href="${r}" class="${s.escapeHtml(e.className)}">${i}</a>` : `<a href="${r}">${i}</a>`;
		}
		group() {
			if (this.elidedGroups === 0) return s.simpleGroup(this.addressMinusSuffix).join(":");
			b(typeof this.elidedGroups == "number"), b(typeof this.elisionBegin == "number");
			let e = [], [t, n] = this.addressMinusSuffix.split("::");
			t.length ? e.push(...s.simpleGroup(t)) : e.push("");
			let r = ["hover-group"];
			for (let e = this.elisionBegin; e < this.elisionBegin + this.elidedGroups; e++) r.push(`group-${e}`);
			return e.push(`<span class="${r.join(" ")}"></span>`), n.length ? e.push(...s.simpleGroup(n, this.elisionEnd)) : e.push(""), this.is4() && (b(this.address4 instanceof c.Address4), e.pop(), e.push(this.address4.groupForV6())), e.join(":");
		}
		regularExpressionString(t = !1) {
			let n = [], r = new e(this.correctForm());
			if (r.elidedGroups === 0) n.push((0, l.simpleRegularExpression)(r.parsedAddress));
			else if (r.elidedGroups === o.GROUPS) n.push((0, l.possibleElisions)(o.GROUPS));
			else {
				let e = r.address.split("::");
				e[0].length && n.push((0, l.simpleRegularExpression)(e[0].split(":"))), b(typeof r.elidedGroups == "number"), n.push((0, l.possibleElisions)(r.elidedGroups, e[0].length !== 0, e[1].length !== 0)), e[1].length && n.push((0, l.simpleRegularExpression)(e[1].split(":"))), n = [n.join(":")];
			}
			return t || (n = [
				"(?=^|",
				l.ADDRESS_BOUNDARY,
				"|[^\\w\\:])(",
				...n,
				")(?=[^\\w\\:]|",
				l.ADDRESS_BOUNDARY,
				"|$)"
			]), n.join("");
		}
		regularExpression(e = !1) {
			return new RegExp(this.regularExpressionString(e), "i");
		}
	};
	e.Address6 = E;
	var D = Object.keys(o.TYPES).map((e) => [new E(e), o.TYPES[e]]), ee = new E("2001::/32"), O = new E("2002::/16"), k = new E("fc00::/7"), te = new E("fe80::/10"), A = [new E("2001:db8::/32"), new E("3fff::/20")], j = new E("2001:2::/48"), M = new E("2000::/3"), N = o.SPECIAL_PURPOSE.map(([e, , t]) => ({
		subnet: new E(e),
		reachable: t
	})), P = new E("::ffff:0:0/96"), ne = new E("64:ff9b::/96"), F = new E("64:ff9b:1::/48");
})), x = /* @__PURE__ */ o(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.v6 = e.AddressError = e.Address6 = e.Address4 = void 0;
	var i = g();
	Object.defineProperty(e, "Address4", {
		enumerable: !0,
		get: function() {
			return i.Address4;
		}
	});
	var a = b();
	Object.defineProperty(e, "Address6", {
		enumerable: !0,
		get: function() {
			return a.Address6;
		}
	});
	var o = p();
	Object.defineProperty(e, "AddressError", {
		enumerable: !0,
		get: function() {
			return o.AddressError;
		}
	}), e.v6 = { helpers: r(v()) };
})), S = /* @__PURE__ */ l(f(), 1), C = /* @__PURE__ */ s({
	LnaError: () => de,
	__v: () => 1,
	defaultOptions: () => fe,
	detectLna: () => ge
}), w = x();
function T(e, t) {
	let n = e.toLowerCase();
	return n.match("[[0-9a-fA-f:]+]") && (n = n.slice(1, -1)), w.Address6.isValid(n) ? D(new w.Address6(n)) : w.Address4.isValid(n) ? E(new w.Address4(n)) : n.indexOf("localhost") === -1 ? n.match(".(local|internal|home|lan|home.arpa)$") || n.match("^(internal|lan).") ? "local" : t?.defaultAddressSpace ?? void 0 : "loopback";
}
function E(e) {
	return e.isLoopback() ? "loopback" : e.isPrivate() || e.isLinkLocal() || e.isCGNAT() ? "local" : "public";
}
function D(e) {
	return e.isLoopback() ? "loopback" : e.isLinkLocal() || e.isULA() ? "local" : e.isMapped4() ? E(e.to4()) : e.is6to4() ? E(new w.Address4(e.inspect6to4().gateway)) : "public";
}
function ee(e, t) {
	if (e === "loopback" && t !== "loopback" || e === "local" && t === "public") return !0;
	if (t === "loopback" || e === "public" || e && t) return !1;
}
var O = {
	edge: "Edg",
	chrome: "Chrome",
	firefox: "Firefox",
	safari: "Safari"
};
function k(e, t, n) {
	if (te() !== e) return !1;
	let r = A(O[e]);
	if (!n) return !!r;
	if (!r) return !1;
	switch (t) {
		case "<": return r < n;
		case "<=": return r <= n;
		case "=": return r === n;
		case ">=": return r >= n;
		case ">": return r > n;
	}
}
function te() {
	if (A(O.edge)) return "edge";
	if (A(O.chrome)) return "chrome";
	if (A(O.firefox)) return "firefox";
	if (A(O.safari)) return "safari";
}
function A(e) {
	let t = window.navigator.userAgent.match(RegExp(`${e}/([\\d.]+)`));
	return t ? parseInt(t[1]) : null;
}
function j() {
	let e = {};
	return (k("edge", "<", 143) || k("chrome", "<", 142)) && (e.permissionsAreOptIn = !0), (k("chrome", "<", 147) || k("edge", "<", 147)) && (e.webSocketsUnrestricted = !0), k("firefox", "<", 154) && (e.webSocketsUnrestricted = !0), k("firefox", "<", 153) && (e.permissionsAreOptIn = !0), k("firefox", "<", 151) && (e.permissionsMayNotReflectUserInteraction = !0), e;
}
var M = "local-network-access", N = "loopback-network", P = "local-network";
async function ne(e) {
	if (!(navigator == null ? void 0 : navigator.permissions)?.query) return !1;
	try {
		return await navigator.permissions.query({ name: e }), !0;
	} catch (e) {
		if (e instanceof TypeError) return !1;
		throw e;
	}
}
var F = [
	N,
	P,
	M
];
async function I() {
	let e = Object.fromEntries(await Promise.all(F.map(async (e) => [e, await ne(e)]))), t = Object.entries(e).filter(([, e]) => e).map(([e]) => e), n = !!t.length;
	return {
		PermissionNames: t,
		LnaJointPermission: e[M],
		LnaSplitPermissions: e[N] && e[P],
		LnaPermissionsEffective: n && !j().permissionsAreOptIn
	};
}
async function re(e) {
	let t = await I();
	return t.LnaPermissionsEffective ? t.LnaSplitPermissions ? {
		loopback: N,
		local: P,
		public: null
	}[e] : M : null;
}
async function ie(e, t) {
	if (!(await I()).LnaPermissionsEffective) return null;
	let n = ee(e, t), r = e ? await re(e) : void 0;
	if (n === !1 || r === null) return null;
	if (n !== void 0) return r;
}
async function ae(e, t) {
	return (t?.isWebSocket || e.protocol === "ws:" || e.protocol === "wss:") && j().webSocketsUnrestricted ? null : await ie(t?.overrides?.targetAddressSpace ?? T(e.hostname, t), t?.overrides?.originAddressSpace ?? T(window.location.hostname, t));
}
async function oe(e, t) {
	let n = await ae(e, t);
	return n && await se(n);
}
async function se(e) {
	return (await I()).PermissionNames.includes(e) ? await navigator.permissions.query({ name: e }) : null;
}
async function ce(e) {
	return (await I()).PermissionNames.includes(e) ? (await se(e)).state : null;
}
async function le() {
	return Object.fromEntries(await Promise.all(F.map(async (e) => [e, await ce(e)])));
}
function ue(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
var de = class e extends Error {
	constructor(t) {
		var { cause: n } = t, r = ue(t, ["cause"]);
		super(r.denied ? "Local Network Access was denied" : "Local Network Access failed", { cause: n }), Object.setPrototypeOf(this, e.prototype), this.name = this.constructor.name, Object.assign(this, r);
	}
	static fromPermission(t, n) {
		return t === null ? new e({
			cause: n,
			denied: !1,
			permission: null
		}) : t === void 0 ? new e({
			cause: n,
			denied: void 0
		}) : t.state === "granted" ? new e({
			cause: n,
			denied: !1,
			permission: t
		}) : t.state === "denied" ? new e({
			cause: n,
			denied: !0,
			permission: t
		}) : new e({
			cause: n,
			denied: void 0,
			permission: t ?? void 0
		});
	}
}, fe = { defaultAddressSpace: "public" };
function pe(e) {
	return Object.assign(Object.assign({}, fe), e);
}
async function me(e, t, n) {
	if (t) {
		let e = await he(t);
		if (e) return e;
	}
	return await oe(e, n);
}
async function he(e) {
	for (let [t, n] of Object.entries(e)) if (n === "prompt") {
		let e = await se(t);
		if (!e) continue;
		let n = e?.state;
		if (n === "denied" || n === "granted") return e;
	}
}
async function ge(e, t, n) {
	let r = ve(e);
	n = pe(n);
	let i = await le();
	try {
		return await t(r);
	} catch (e) {
		throw (n?.isConnectionError ?? ((e) => !ye(e, n)))(e) ? await _e({
			error: e,
			url: r,
			permissionStatesBefore: i
		}, n) : e;
	}
}
async function _e(e, t) {
	let n = await me(e.url, e.permissionStatesBefore, pe(t));
	return de.fromPermission(n, e.error);
}
function ve(e) {
	if (e instanceof URL || typeof e == "string") return new URL(e);
	if (e instanceof Request) return new URL(e.url);
	throw TypeError(`Invalid resource parameter type ${typeof e}`);
}
function ye(e, t) {
	return t?.isWebSocket === !0 ? xe(e) : be(e) ?? xe(e);
}
function be(e) {
	return e instanceof DOMException || e instanceof TypeError && !!e.message.match(/Failed to parse URL|not a valid URL|is not supported/);
}
function xe(e) {
	return e instanceof SyntaxError;
}
//#endregion
//#region node_modules/qs-esm/lib/formats.js
var Se = String.prototype.replace, Ce = /%20/g, L = {
	RFC1738: "RFC1738",
	RFC3986: "RFC3986"
}, R = {
	RFC1738: function(e) {
		return Se.call(e, Ce, "+");
	},
	RFC3986: function(e) {
		return String(e);
	}
}, we = L.RFC1738;
L.RFC3986;
var Te = L.RFC3986, z = Object.prototype.hasOwnProperty, B = Array.isArray, V = /* @__PURE__ */ new WeakMap(), Ee = function(e, t) {
	return V.set(e, t), e;
};
function H(e) {
	return V.has(e);
}
var U = function(e) {
	return V.get(e);
}, De = function(e, t) {
	V.set(e, t);
}, W = (function() {
	let e = [];
	for (let t = 0; t < 256; ++t) e.push("%" + ((t < 16 ? "0" : "") + t.toString(16)).toUpperCase());
	return e;
})(), Oe = function(e) {
	for (; e.length > 1;) {
		let t = e.pop(), n = t.obj[t.prop];
		if (B(n)) {
			let e = [];
			for (let t = 0; t < n.length; ++t) n[t] !== void 0 && e.push(n[t]);
			t.obj[t.prop] = e;
		}
	}
}, ke = function(e, t) {
	let n = t && t.plainObjects ? Object.create(null) : {};
	for (let t = 0; t < e.length; ++t) e[t] !== void 0 && (n[t] = e[t]);
	return n;
}, Ae = function e(t, n, r) {
	if (!n) return t;
	if (typeof n != "object") {
		if (B(t)) t.push(n);
		else if (t && typeof t == "object") {
			if (H(t)) {
				var i = U(t) + 1;
				t[i] = n, De(t, i);
			} else (r && (r.plainObjects || r.allowPrototypes) || !z.call(Object.prototype, n)) && (t[n] = !0);
		} else return [t, n];
		return t;
	}
	if (!t || typeof t != "object") {
		if (H(n)) {
			for (var a = Object.keys(n), o = r && r.plainObjects ? {
				__proto__: null,
				0: t
			} : { 0: t }, s = 0; s < a.length; s++) {
				var c = parseInt(a[s], 10);
				o[c + 1] = n[a[s]];
			}
			return Ee(o, U(n) + 1);
		}
		return [t].concat(n);
	}
	let l = t;
	return B(t) && !B(n) && (l = ke(t, r)), B(t) && B(n) ? (n.forEach(function(n, i) {
		if (z.call(t, i)) {
			let a = t[i];
			a && typeof a == "object" && n && typeof n == "object" ? t[i] = e(a, n, r) : t.push(n);
		} else t[i] = n;
	}), t) : Object.keys(n).reduce(function(t, i) {
		let a = n[i];
		return t[i] = z.call(t, i) ? e(t[i], a, r) : a, t;
	}, l);
}, je = function(e, t, n) {
	let r = e.replace(/\+/g, " ");
	if (n === "iso-8859-1") return r.replace(/%[0-9a-f]{2}/gi, unescape);
	try {
		return decodeURIComponent(r);
	} catch {
		return r;
	}
}, G = 1024, Me = function(e, t, n, r, i) {
	if (e.length === 0) return e;
	let a = e;
	if (typeof e == "symbol" ? a = Symbol.prototype.toString.call(e) : typeof e != "string" && (a = String(e)), n === "iso-8859-1") return escape(a).replace(/%u[0-9a-f]{4}/gi, function(e) {
		return "%26%23" + parseInt(e.slice(2), 16) + "%3B";
	});
	let o = "";
	for (let e = 0; e < a.length; e += G) {
		let t = a.length >= G ? a.slice(e, e + G) : a, n = [];
		for (let e = 0; e < t.length; ++e) {
			let r = t.charCodeAt(e);
			if (r === 45 || r === 46 || r === 95 || r === 126 || r >= 48 && r <= 57 || r >= 65 && r <= 90 || r >= 97 && r <= 122 || i === we && (r === 40 || r === 41)) {
				n[n.length] = t.charAt(e);
				continue;
			}
			if (r < 128) {
				n[n.length] = W[r];
				continue;
			}
			if (r < 2048) {
				n[n.length] = W[192 | r >> 6] + W[128 | r & 63];
				continue;
			}
			if (r < 55296 || r >= 57344) {
				n[n.length] = W[224 | r >> 12] + W[128 | r >> 6 & 63] + W[128 | r & 63];
				continue;
			}
			e += 1, r = 65536 + ((r & 1023) << 10 | t.charCodeAt(e) & 1023), n[n.length] = W[240 | r >> 18] + W[128 | r >> 12 & 63] + W[128 | r >> 6 & 63] + W[128 | r & 63];
		}
		o += n.join("");
	}
	return o;
}, Ne = function(e) {
	let t = [{
		obj: { o: e },
		prop: "o"
	}], n = [];
	for (let e = 0; e < t.length; ++e) {
		let r = t[e], i = r.obj[r.prop], a = Object.keys(i);
		for (let e = 0; e < a.length; ++e) {
			let r = a[e], o = i[r];
			typeof o == "object" && o && n.indexOf(o) === -1 && (t.push({
				obj: i,
				prop: r
			}), n.push(o));
		}
	}
	return Oe(t), e;
}, Pe = function(e) {
	return Object.prototype.toString.call(e) === "[object RegExp]";
}, Fe = function(e) {
	return !e || typeof e != "object" ? !1 : !!(e.constructor && e.constructor.isBuffer && e.constructor.isBuffer(e));
}, Ie = function(e, t, n, r) {
	if (H(e)) {
		var i = U(e) + 1;
		return e[i] = t, De(e, i), e;
	}
	var a = [].concat(e, t);
	return a.length > n ? Ee(ke(a, { plainObjects: r }), a.length - 1) : a;
}, K = function(e, t) {
	if (B(e)) {
		let n = [];
		for (let r = 0; r < e.length; r += 1) n.push(t(e[r]));
		return n;
	}
	return t(e);
}, Le = Object.prototype.hasOwnProperty, Re = {
	brackets: function(e) {
		return e + "[]";
	},
	comma: "comma",
	indices: function(e, t) {
		return e + "[" + t + "]";
	},
	repeat: function(e) {
		return e;
	}
}, q = Array.isArray, ze = Array.prototype.push, Be = function(e, t) {
	ze.apply(e, q(t) ? t : [t]);
}, Ve = Date.prototype.toISOString, He = Te, J = {
	addQueryPrefix: !1,
	allowDots: !1,
	allowEmptyArrays: !1,
	arrayFormat: "indices",
	charset: "utf-8",
	charsetSentinel: !1,
	delimiter: "&",
	encode: !0,
	encodeDotInKeys: !1,
	encoder: Me,
	encodeValuesOnly: !1,
	format: He,
	formatter: R[He],
	indices: !1,
	serializeDate: function(e) {
		return Ve.call(e);
	},
	skipNulls: !1,
	strictNullHandling: !1
}, Ue = function(e) {
	return typeof e == "string" || typeof e == "number" || typeof e == "boolean" || typeof e == "symbol" || typeof e == "bigint";
}, Y = {}, We = function(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _) {
	let v = e, y = _, b = 0, x = !1;
	for (; (y = y.get(Y)) !== void 0 && !x;) {
		let t = y.get(e);
		if (b += 1, t !== void 0) {
			if (t === b) throw RangeError("Cyclic object value");
			x = !0;
		}
		y.get(Y) === void 0 && (b = 0);
	}
	if (typeof l == "function" ? v = l(t, v) : v instanceof Date ? v = f(v) : n === "comma" && q(v) && (v = K(v, function(e) {
		return e instanceof Date ? f(e) : e;
	})), v === null) {
		if (a) return c && !h ? c(t, J.encoder, g, "key", p) : t;
		v = "";
	}
	if (Ue(v) || Fe(v)) return c ? [m(h ? t : c(t, J.encoder, g, "key", p)) + "=" + m(c(v, J.encoder, g, "value", p))] : [m(t) + "=" + m(String(v))];
	let S = [];
	if (v === void 0) return S;
	let C;
	if (n === "comma" && q(v)) h && c && (v = K(v, c)), C = [{ value: v.length > 0 ? v.join(",") || null : void 0 }];
	else if (q(l)) C = l;
	else {
		let e = Object.keys(v);
		C = u ? e.sort(u) : e;
	}
	let w = s ? t.replace(/\./g, "%2E") : t, T = r && q(v) && v.length === 1 ? w + "[]" : w;
	if (i && q(v) && v.length === 0) return T + "[]";
	for (let t = 0; t < C.length; ++t) {
		let y = C[t], x = typeof y == "object" && y.value !== void 0 ? y.value : v[y];
		if (o && x === null) continue;
		let w = d && s ? y.replace(/\./g, "%2E") : y, E = q(v) ? typeof n == "function" ? n(T, w) : T : T + (d ? "." + w : "[" + w + "]");
		_.set(e, b);
		let D = /* @__PURE__ */ new WeakMap();
		D.set(Y, _), Be(S, We(x, E, n, r, i, a, o, s, n === "comma" && h && q(v) ? null : c, l, u, d, f, p, m, h, g, D));
	}
	return S;
}, Ge = function(e) {
	if (!e) return J;
	if (e.allowEmptyArrays !== void 0 && typeof e.allowEmptyArrays != "boolean") throw TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
	if (e.encodeDotInKeys !== void 0 && typeof e.encodeDotInKeys != "boolean") throw TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
	if (e.encoder !== null && e.encoder !== void 0 && typeof e.encoder != "function") throw TypeError("Encoder has to be a function.");
	let t = e.charset || J.charset;
	if (e.charset !== void 0 && e.charset !== "utf-8" && e.charset !== "iso-8859-1") throw TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
	let n = Te;
	if (e.format !== void 0) {
		if (!Le.call(R, e.format)) throw TypeError("Unknown format option provided.");
		n = e.format;
	}
	let r = R[n], i = J.filter;
	(typeof e.filter == "function" || q(e.filter)) && (i = e.filter);
	let a;
	if (a = e.arrayFormat in Re ? e.arrayFormat : "indices" in e ? e.indices ? "indices" : "repeat" : J.arrayFormat, "commaRoundTrip" in e && typeof e.commaRoundTrip != "boolean") throw TypeError("`commaRoundTrip` must be a boolean, or absent");
	let o = e.allowDots === void 0 ? e.encodeDotInKeys === !0 || J.allowDots : !!e.allowDots;
	return {
		addQueryPrefix: typeof e.addQueryPrefix == "boolean" ? e.addQueryPrefix : J.addQueryPrefix,
		allowDots: o,
		allowEmptyArrays: typeof e.allowEmptyArrays == "boolean" ? !!e.allowEmptyArrays : J.allowEmptyArrays,
		arrayFormat: a,
		charset: t,
		charsetSentinel: typeof e.charsetSentinel == "boolean" ? e.charsetSentinel : J.charsetSentinel,
		commaRoundTrip: e.commaRoundTrip,
		delimiter: e.delimiter === void 0 ? J.delimiter : e.delimiter,
		encode: typeof e.encode == "boolean" ? e.encode : J.encode,
		encodeDotInKeys: typeof e.encodeDotInKeys == "boolean" ? e.encodeDotInKeys : J.encodeDotInKeys,
		encoder: typeof e.encoder == "function" ? e.encoder : J.encoder,
		encodeValuesOnly: typeof e.encodeValuesOnly == "boolean" ? e.encodeValuesOnly : J.encodeValuesOnly,
		filter: i,
		format: n,
		formatter: r,
		serializeDate: typeof e.serializeDate == "function" ? e.serializeDate : J.serializeDate,
		skipNulls: typeof e.skipNulls == "boolean" ? e.skipNulls : J.skipNulls,
		sort: typeof e.sort == "function" ? e.sort : null,
		strictNullHandling: typeof e.strictNullHandling == "boolean" ? e.strictNullHandling : J.strictNullHandling
	};
};
function Ke(e, t) {
	let n = e, r = Ge(t), i, a;
	typeof r.filter == "function" ? (a = r.filter, n = a("", n)) : q(r.filter) && (a = r.filter, i = a);
	let o = [];
	if (typeof n != "object" || !n) return "";
	let s = Re[r.arrayFormat], c = s === "comma" && r.commaRoundTrip;
	i ||= Object.keys(n), r.sort && i.sort(r.sort);
	let l = /* @__PURE__ */ new WeakMap();
	for (let e = 0; e < i.length; ++e) {
		let t = i[e];
		r.skipNulls && n[t] === null || Be(o, We(n[t], t, s, c, r.allowEmptyArrays, r.strictNullHandling, r.skipNulls, r.encodeDotInKeys, r.encode ? r.encoder : null, r.filter, r.sort, r.allowDots, r.serializeDate, r.format, r.formatter, r.encodeValuesOnly, r.charset, l));
	}
	let u = o.join(r.delimiter), d = r.addQueryPrefix === !0 ? "?" : "";
	return r.charsetSentinel && (r.charset === "iso-8859-1" ? d += "utf8=%26%2310003%3B&" : d += "utf8=%E2%9C%93&"), u.length > 0 ? d + u : "";
}
//#endregion
//#region node_modules/qs-esm/lib/parse.js
var X = Object.prototype.hasOwnProperty, qe = Array.isArray, Z = {
	allowDots: !1,
	allowEmptyArrays: !1,
	allowPrototypes: !1,
	allowSparse: !1,
	arrayLimit: 20,
	charset: "utf-8",
	charsetSentinel: !1,
	comma: !1,
	decodeDotInKeys: !1,
	decoder: je,
	delimiter: "&",
	depth: 5,
	duplicates: "combine",
	ignoreQueryPrefix: !1,
	interpretNumericEntities: !1,
	parameterLimit: 1e3,
	parseArrays: !0,
	plainObjects: !1,
	strictNullHandling: !1
}, Je = function(e) {
	return e.replace(/&#(\d+);/g, function(e, t) {
		return String.fromCharCode(parseInt(t, 10));
	});
}, Ye = function(e, t) {
	return e && typeof e == "string" && t.comma && e.indexOf(",") > -1 ? e.split(",") : e;
}, Xe = "utf8=%26%2310003%3B", Ze = "utf8=%E2%9C%93", Qe = function(e, t) {
	let n = { __proto__: null }, r = t.ignoreQueryPrefix ? e.replace(/^\?/, "") : e, i = t.parameterLimit === Infinity ? void 0 : t.parameterLimit, a = r.split(t.delimiter, i), o = -1, s, c = t.charset;
	if (t.charsetSentinel) for (s = 0; s < a.length; ++s) a[s].indexOf("utf8=") === 0 && (a[s] === Ze ? c = "utf-8" : a[s] === Xe && (c = "iso-8859-1"), o = s, s = a.length);
	for (s = 0; s < a.length; ++s) {
		if (s === o) continue;
		let e = a[s], r = e.indexOf("]="), i = r === -1 ? e.indexOf("=") : r + 1, l, u;
		i === -1 ? (l = t.decoder(e, Z.decoder, c, "key"), u = t.strictNullHandling ? null : "") : (l = t.decoder(e.slice(0, i), Z.decoder, c, "key"), u = K(Ye(e.slice(i + 1), t), function(e) {
			return t.decoder(e, Z.decoder, c, "value");
		})), u && t.interpretNumericEntities && c === "iso-8859-1" && (u = Je(u)), e.indexOf("[]=") > -1 && (u = qe(u) ? [u] : u);
		let d = X.call(n, l);
		d && t.duplicates === "combine" ? n[l] = Ie(n[l], u, t.arrayLimit, t.plainObjects) : (!d || t.duplicates === "last") && (n[l] = u);
	}
	return n;
}, $e = function(e, t, n, r) {
	let i = r ? t : Ye(t, n);
	for (let t = e.length - 1; t >= 0; --t) {
		let r, a = e[t];
		if (a === "[]" && n.parseArrays) r = H(i) ? i : n.allowEmptyArrays && (i === "" || n.strictNullHandling && i === null) ? [] : Ie([], i, n.arrayLimit, n.plainObjects);
		else {
			r = n.plainObjects ? Object.create(null) : {};
			let e = a.charAt(0) === "[" && a.charAt(a.length - 1) === "]" ? a.slice(1, -1) : a, t = n.decodeDotInKeys ? e.replace(/%2E/g, ".") : e, o = parseInt(t, 10);
			!n.parseArrays && t === "" ? r = { 0: i } : !isNaN(o) && a !== t && String(o) === t && o >= 0 && n.parseArrays && o <= n.arrayLimit ? (r = [], r[o] = i) : t !== "__proto__" && (r[t] = i);
		}
		i = r;
	}
	return i;
}, et = function(e, t, n, r) {
	if (!e) return;
	let i = n.allowDots ? e.replace(/\.([^.[]+)/g, "[$1]") : e, a = /(\[[^[\]]*])/, o = /(\[[^[\]]*])/g, s = n.depth > 0 && a.exec(i), c = s ? i.slice(0, s.index) : i, l = [];
	if (c) {
		if (!n.plainObjects && X.call(Object.prototype, c) && !n.allowPrototypes) return;
		l.push(c);
	}
	let u = 0;
	for (; n.depth > 0 && (s = o.exec(i)) !== null && u < n.depth;) {
		if (u += 1, !n.plainObjects && X.call(Object.prototype, s[1].slice(1, -1)) && !n.allowPrototypes) return;
		l.push(s[1]);
	}
	return s && l.push("[" + i.slice(s.index) + "]"), $e(l, t, n, r);
}, tt = function(e) {
	if (!e) return Z;
	if (e.allowEmptyArrays !== void 0 && typeof e.allowEmptyArrays != "boolean") throw TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
	if (e.decodeDotInKeys !== void 0 && typeof e.decodeDotInKeys != "boolean") throw TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");
	if (e.decoder !== null && e.decoder !== void 0 && typeof e.decoder != "function") throw TypeError("Decoder has to be a function.");
	if (e.charset !== void 0 && e.charset !== "utf-8" && e.charset !== "iso-8859-1") throw TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
	let t = e.charset === void 0 ? Z.charset : e.charset, n = e.duplicates === void 0 ? Z.duplicates : e.duplicates;
	if (n !== "combine" && n !== "first" && n !== "last") throw TypeError("The duplicates option must be either combine, first, or last");
	return {
		allowDots: e.allowDots === void 0 ? e.decodeDotInKeys === !0 || Z.allowDots : !!e.allowDots,
		allowEmptyArrays: typeof e.allowEmptyArrays == "boolean" ? !!e.allowEmptyArrays : Z.allowEmptyArrays,
		allowPrototypes: typeof e.allowPrototypes == "boolean" ? e.allowPrototypes : Z.allowPrototypes,
		allowSparse: typeof e.allowSparse == "boolean" ? e.allowSparse : Z.allowSparse,
		arrayLimit: typeof e.arrayLimit == "number" ? e.arrayLimit : Z.arrayLimit,
		charset: t,
		charsetSentinel: typeof e.charsetSentinel == "boolean" ? e.charsetSentinel : Z.charsetSentinel,
		comma: typeof e.comma == "boolean" ? e.comma : Z.comma,
		decodeDotInKeys: typeof e.decodeDotInKeys == "boolean" ? e.decodeDotInKeys : Z.decodeDotInKeys,
		decoder: typeof e.decoder == "function" ? e.decoder : Z.decoder,
		delimiter: typeof e.delimiter == "string" || Pe(e.delimiter) ? e.delimiter : Z.delimiter,
		depth: typeof e.depth == "number" || e.depth === !1 ? +e.depth : Z.depth,
		duplicates: n,
		ignoreQueryPrefix: e.ignoreQueryPrefix === !0,
		interpretNumericEntities: typeof e.interpretNumericEntities == "boolean" ? e.interpretNumericEntities : Z.interpretNumericEntities,
		parameterLimit: typeof e.parameterLimit == "number" ? e.parameterLimit : Z.parameterLimit,
		parseArrays: e.parseArrays !== !1,
		plainObjects: typeof e.plainObjects == "boolean" ? e.plainObjects : Z.plainObjects,
		strictNullHandling: typeof e.strictNullHandling == "boolean" ? e.strictNullHandling : Z.strictNullHandling
	};
};
function nt(e, t) {
	let n = tt(t);
	if (e === "" || e == null) return n.plainObjects ? Object.create(null) : {};
	let r = typeof e == "string" ? Qe(e, n) : e, i = n.plainObjects ? Object.create(null) : {}, a = Object.keys(r);
	for (let t = 0; t < a.length; ++t) {
		let o = a[t], s = et(o, r[o], n, typeof e == "string");
		i = Ae(i, s, n);
	}
	return n.allowSparse === !0 ? i : Ne(i);
}
//#endregion
//#region node_modules/ziggy-js/dist/index.js
function Q() {
	return Q = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, Q.apply(null, arguments);
}
var rt = class {
	constructor(e, t, n) {
		this.name = e, this.definition = t, this.bindings = t.bindings ?? {}, this.wheres = t.wheres ?? {}, this.config = n;
	}
	get template() {
		let e = `${this.origin}/${this.definition.uri}`.replace(/\/+$/, "");
		return e === "" ? "/" : e;
	}
	get origin() {
		return this.config.absolute ? this.definition.domain ? `${this.config.url.match(/^\w+:\/\//)[0]}${this.definition.domain}${this.config.port ? `:${this.config.port}` : ""}` : this.config.url : "";
	}
	get parameterSegments() {
		return this.template.match(/{[^}?]+\??}/g)?.map((e) => ({
			name: e.replace(/{|\??}/g, ""),
			required: !/\?}$/.test(e)
		})) ?? [];
	}
	matchesUrl(e) {
		if (!this.definition.methods.includes("GET")) return !1;
		let t = this.template.replace(/[.*+$()[\]]/g, "\\$&").replace(/(\/?){([^}?]*)(\??)}/g, (e, t, n, r) => {
			let i = `(?<${n}>${this.wheres[n]?.replace(/(^\^)|(\$$)/g, "") || "[^/?]+"})`;
			return r ? `(${t}${i})?` : `${t}${i}`;
		}).replace(/^\w+:\/\//, ""), [n, r] = e.replace(/^\w+:\/\//, "").split("?"), i = RegExp(`^${t}/?$`).exec(n) ?? RegExp(`^${t}/?$`).exec(decodeURI(n));
		if (i) {
			for (let e in i.groups) i.groups[e] = typeof i.groups[e] == "string" ? decodeURIComponent(i.groups[e]) : i.groups[e];
			return {
				params: i.groups,
				query: nt(r)
			};
		}
		return !1;
	}
	compile(e) {
		return this.parameterSegments.length ? this.template.replace(/{([^}?]+)(\??)}/g, (t, n, r) => {
			if (!r && [null, void 0].includes(e[n])) throw Error(`Ziggy error: '${n}' parameter is required for route '${this.name}'.`);
			if (this.wheres[n] && !RegExp(`^${r ? `(${this.wheres[n]})?` : this.wheres[n]}$`).test(e[n] ?? "")) throw Error(`Ziggy error: '${n}' parameter '${e[n]}' does not match required format '${this.wheres[n]}' for route '${this.name}'.`);
			return encodeURI(e[n] ?? "").replace(/%7C/g, "|").replace(/%25/g, "%").replace(/\$/g, "%24");
		}).replace(this.config.absolute ? /(\.[^/]+?)(\/\/)/ : /(^)(\/\/)/, "$1/").replace(/\/+$/, "") : this.template;
	}
}, it = class extends String {
	constructor(e, t, n = !0, r) {
		if (super(), this.t = r ?? (typeof Ziggy < "u" ? Ziggy : globalThis == null ? void 0 : globalThis.Ziggy), !this.t && typeof document < "u" && document.getElementById("ziggy-routes-json") && (globalThis.Ziggy = JSON.parse(document.getElementById("ziggy-routes-json").textContent), this.t = globalThis.Ziggy), this.t = Q({}, this.t, { absolute: n }), e) {
			if (!this.t.routes[e]) throw Error(`Ziggy error: route '${e}' is not in the route list.`);
			this.i = new rt(e, this.t.routes[e], this.t), this.o = this.u(t);
		}
	}
	toString() {
		let e = Object.keys(this.o).filter((e) => !this.i.parameterSegments.some(({ name: t }) => t === e)).filter((e) => e !== "_query").reduce((e, t) => Q({}, e, { [t]: this.o[t] }), {});
		return this.i.compile(this.o) + Ke(Q({}, e, this.o._query), {
			addQueryPrefix: !0,
			arrayFormat: "indices",
			encodeValuesOnly: !0,
			skipNulls: !0,
			encoder: (e, t) => typeof e == "boolean" ? Number(e) : t(e)
		});
	}
	h(e) {
		e ? this.t.absolute && e.startsWith("/") && (e = this.l().host + e) : e = this.m();
		let t = {}, [n, r] = Object.entries(this.t.routes).find(([n, r]) => t = new rt(n, r, this.t).matchesUrl(e)) || [void 0, void 0];
		return Q({ name: n }, t, { route: r });
	}
	m() {
		let { host: e, pathname: t, search: n } = this.l();
		return (this.t.absolute ? e + t : t.replace(this.t.url.replace(/^\w*:\/\/[^/]+/, ""), "").replace(/^\/+/, "/")) + n;
	}
	current(e, t) {
		let { name: n, params: r, query: i, route: a } = this.h();
		if (!e) return n;
		let o = RegExp(`^${e.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`).test(n);
		if ([null, void 0].includes(t) || !o) return o;
		let s = new rt(n, a, this.t);
		t = this.u(t, s);
		let c = Q({}, r, i);
		if (Object.values(t).every((e) => !e) && !Object.values(c).some((e) => e !== void 0)) return !0;
		let l = (e, t) => Object.entries(e).every(([e, n]) => Array.isArray(n) && Array.isArray(t[e]) ? n.every((n) => t[e].includes(n) || t[e].includes(decodeURIComponent(n))) : typeof n == "object" && typeof t[e] == "object" && n !== null && t[e] !== null ? l(n, t[e]) : t[e] == n || t[e] == decodeURIComponent(n));
		return l(t, c);
	}
	l() {
		let { host: e = "", pathname: t = "", search: n = "" } = typeof window < "u" ? window.location : {};
		return {
			host: this.t.location?.host ?? e,
			pathname: this.t.location?.pathname ?? t,
			search: this.t.location?.search ?? n
		};
	}
	get params() {
		let { params: e, query: t } = this.h();
		return Q({}, e, t);
	}
	get routeParams() {
		return this.h().params;
	}
	get queryParams() {
		return this.h().query;
	}
	has(e) {
		return this.t.routes.hasOwnProperty(e);
	}
	u(e = {}, t = this.i) {
		e ??= {}, e = ["string", "number"].includes(typeof e) ? [e] : e;
		let n = t.parameterSegments.filter(({ name: e }) => !this.t.defaults[e]);
		return Array.isArray(e) ? e = e.reduce((e, t, r) => Q({}, e, n[r] ? { [n[r].name]: t } : typeof t == "object" ? t : { [t]: "" }), {}) : n.length !== 1 || e.hasOwnProperty(n[0].name) || !e.hasOwnProperty(Object.values(t.bindings)[0]) && !e.hasOwnProperty("id") || (e = { [n[0].name]: e }), Q({}, this.p(t), this.$(e, t));
	}
	p(e) {
		return e.parameterSegments.filter(({ name: e }) => this.t.defaults[e]).reduce((e, { name: t }, n) => Q({}, e, { [t]: this.t.defaults[t] }), {});
	}
	$(e, { bindings: t, parameterSegments: n }) {
		return Object.entries(e).reduce((e, [r, i]) => {
			if (!i || typeof i != "object" || Array.isArray(i) || !n.some(({ name: e }) => e === r)) return Q({}, e, { [r]: i });
			let a = i.hasOwnProperty(t[r]) ? t[r] : i.hasOwnProperty("id") ? "id" : void 0;
			if (a === void 0) throw Error(`Ziggy error: object passed as '${r}' parameter is missing route model binding key '${t[r]}'.`);
			return Q({}, e, { [r]: i[a] });
		}, {});
	}
	valueOf() {
		return this.toString();
	}
};
function at(e, t, n, r) {
	let i = new it(e, t, n, r);
	return e ? i.toString() : i;
}
//#endregion
//#region resources/js/QzTrayCertificateError.ts
var ot = class extends Error {
	code;
	status;
	constructor(e, t, n) {
		super(e), this.name = "QzTrayCertificateError", this.code = t, this.status = n;
	}
}, $ = class extends Error {
	code;
	status;
	constructor(e, t, n) {
		super(e), this.name = "QzTraySigningError", this.code = t, this.status = n;
	}
}, st = class {
	publicKey = null;
	publicKeyRequest = null;
	configure() {
		S.default.security.setSignatureAlgorithm("SHA512"), S.default.security.setCertificatePromise((e, t) => {
			this.getPublicKey().then(e, t);
		}, { rejectOnFailure: !0 }), S.default.security.setSignaturePromise((e) => (t, n) => {
			this.signPayload(e).then(t, n);
		});
	}
	async getPublicKey() {
		if (this.publicKey !== null) return this.publicKey;
		if (this.publicKeyRequest !== null) return this.publicKeyRequest;
		this.publicKeyRequest = this.fetchPublicKey();
		try {
			return this.publicKey = await this.publicKeyRequest, this.publicKey;
		} finally {
			this.publicKeyRequest = null;
		}
	}
	async fetchPublicKey() {
		let e = await fetch(at("qztray_connector.get_public_key"), {
			method: "GET",
			credentials: "same-origin",
			cache: "no-store",
			headers: { Accept: "application/json" }
		});
		if (!e.ok) {
			let { code: t, message: n } = await this.readResponseError(e, "qztray.certificate_request_failed", `Unable to retrieve the QZ Tray public certificate (HTTP ${e.status}).`);
			throw new ot(n, t, e.status);
		}
		let t = await e.text(), n = t.trim();
		if (!n.startsWith("-----BEGIN CERTIFICATE-----") || !n.endsWith("-----END CERTIFICATE-----") || n.slice(27, -25).trim() === "") throw new ot("The certificate endpoint did not return a PEM certificate. Check the route and session response.", "qztray.certificate_response_invalid", e.status);
		return t;
	}
	async signPayload(e) {
		let t = (typeof document > "u" ? void 0 : document.cookie.split(";").map((e) => e.trim()).find((e) => e.startsWith("XSRF-TOKEN=")))?.slice(11);
		if (!t) throw new $("The Laravel CSRF cookie is missing. Reload the page before signing a QZ Tray payload.", "qztray.csrf_token_missing", 0);
		let n;
		try {
			n = decodeURIComponent(t);
		} catch {
			throw new $("The Laravel CSRF cookie is invalid. Reload the page before signing a QZ Tray payload.", "qztray.csrf_token_invalid", 0);
		}
		let r = await fetch(at("qztray_connector.sign_payload"), {
			method: "POST",
			credentials: "same-origin",
			cache: "no-store",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-XSRF-TOKEN": n
			},
			body: JSON.stringify({ payload: e })
		});
		if (!r.ok) {
			let e = "qztray.signing_request_failed", t = `Unable to sign the QZ Tray payload (HTTP ${r.status}).`;
			r.status === 401 ? (e = "qztray.authentication_required", t = "Sign in to the application before signing a QZ Tray payload.") : r.status === 419 && (e = "qztray.csrf_token_mismatch", t = "The Laravel session or CSRF token has expired. Reload the page before signing a QZ Tray payload.");
			let { code: n, message: i } = await this.readResponseError(r, e, t);
			throw new $(i, n, r.status);
		}
		let i = await r.text();
		if (i === "" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(i)) throw new $("The signing endpoint did not return a Base64 signature. Check the route and session response.", "qztray.signature_response_invalid", r.status);
		return i;
	}
	async readResponseError(e, t, n) {
		if (e.headers.get("Content-Type")?.includes("application/json")) {
			let t = await e.json().catch(() => null);
			if (typeof t == "object" && t && "error" in t) {
				let e = t.error;
				if (typeof e == "object" && e && "code" in e && typeof e.code == "string" && "message" in e && typeof e.message == "string") return {
					code: e.code,
					message: e.message
				};
			}
		}
		return {
			code: t,
			message: n
		};
	}
}, ct = class {
	security = new st();
	connectionRequest = null;
	disconnectionRequest = null;
	isConnected() {
		return S.default.websocket.isActive();
	}
	async connect() {
		if (this.disconnectionRequest !== null) return await this.disconnectionRequest, this.connect();
		if (this.connectionRequest !== null) return this.connectionRequest;
		if (this.security.configure(), !this.isConnected()) {
			if (typeof self < "u") {
				let e = self;
				typeof e.lna?.detectLna != "function" && (e.lna = C);
			}
			this.connectionRequest = S.default.websocket.connect();
			try {
				await this.connectionRequest;
			} finally {
				this.connectionRequest = null;
			}
		}
	}
	async disconnect() {
		if (this.disconnectionRequest !== null) return this.disconnectionRequest;
		this.disconnectionRequest = this.closeConnection();
		try {
			await this.disconnectionRequest;
		} finally {
			this.disconnectionRequest = null;
		}
	}
	async closeConnection() {
		this.connectionRequest !== null && await this.connectionRequest.catch(() => void 0), this.isConnected() && await S.default.websocket.disconnect();
	}
};
//#endregion
//#region resources/js/detectZplEncoding.ts
function lt(e) {
	let t = e.join(""), n = {
		27: "windows-1252",
		28: "UTF-8",
		31: "windows-1250",
		33: "windows-1251",
		34: "windows-1253",
		35: "windows-1254",
		36: "windows-1255"
	}, r = /* @__PURE__ */ new Set();
	for (let e of t.matchAll(/\^(?:FD|FV|FX)[\s\S]*?(?:\^FS|$)|\^CI\s*(\d+)(?=[,\s^~]|$)|[\^~]CC/g)) {
		if (e[0] === "^CC" || e[0] === "~CC") return "UTF-8";
		if (e[1] === void 0) continue;
		let t = Number(e[1]), i = t <= 13 ? "CP850" : n[t];
		if (i === void 0) return "UTF-8";
		r.add(i);
	}
	return r.size === 1 ? [...r][0] : "UTF-8";
}
//#endregion
//#region resources/js/QzTrayPrinters.ts
var ut = class {
	connection;
	constructor(e) {
		this.connection = e;
	}
	async getPrinters() {
		await this.connection.connect();
		let e = await S.default.printers.find();
		return Array.isArray(e) ? e : [e];
	}
	async print(e) {
		let { printer: t, options: n, data: r } = this.preparePrint(e);
		await this.connection.connect();
		let i = S.default.configs.create(t, n);
		await S.default.print(i, r);
	}
	printEscpos(e, t, n) {
		return this.print({
			printer: e,
			type: "escpos",
			payload: t,
			options: n
		});
	}
	printZpl(e, t, n) {
		return this.print({
			printer: e,
			type: "zpl",
			payload: t,
			options: n
		});
	}
	printRaw(e, t, n) {
		return this.print({
			printer: e,
			type: "raw",
			payload: t,
			options: n
		});
	}
	printPdf(e, t, n) {
		return this.print({
			printer: e,
			type: "pdf",
			payload: t,
			options: n
		});
	}
	preparePrint(e) {
		if (!e || typeof e.printer != "string" || e.printer.trim() === "") throw TypeError("Provide a nonempty printer name.");
		if (![
			"escpos",
			"zpl",
			"raw",
			"pdf"
		].includes(e.type)) throw TypeError("Unsupported print type. Use escpos, zpl, raw, or pdf.");
		let t = typeof e.payload == "string" ? [e.payload] : Array.isArray(e.payload) ? [...e.payload] : [];
		if (t.every((e) => e === "")) throw TypeError("Provide a nonempty print payload as a string or an array of supported print parts.");
		let n = t.map((t) => {
			if (typeof t == "string") return t;
			if (e.type !== "escpos" || typeof t != "object" || !t || Array.isArray(t)) throw TypeError("Print payload parts must be strings or ESC/POS raw image objects.");
			let n = t;
			if (n.type !== "raw" || n.format !== "image" || !["file", "base64"].includes(n.flavor) || typeof n.data != "string" || n.data.trim() === "") throw TypeError("Provide an ESC/POS raw image with file or base64 flavor and nonempty data.");
			if (n.options !== void 0 && (typeof n.options != "object" || n.options === null || Array.isArray(n.options))) throw TypeError("ESC/POS print image options must be an object.");
			if (n.options?.language !== void 0 && n.options.language !== "ESCPOS") throw TypeError("ESC/POS print images must use language ESCPOS.");
			return {
				...n,
				options: {
					...n.options,
					language: n.options?.language ?? "ESCPOS"
				}
			};
		}), r = n.filter((e) => typeof e == "string"), i = e.options?.copies;
		if (i !== void 0 && (!Number.isInteger(i) || i < 1)) throw RangeError("Print copies must be a positive integer.");
		if (e.type === "pdf") {
			let t = e.flavor ?? "file";
			if (!["file", "base64"].includes(t)) throw TypeError("PDF printing supports file or base64 data.");
			return {
				printer: e.printer,
				options: {
					copies: 1,
					forceRaw: !1,
					scaleContent: !0,
					...e.options
				},
				data: r.map((n) => ({
					type: "pixel",
					format: "pdf",
					flavor: t,
					data: n,
					...e.dataOptions ? { options: { ...e.dataOptions } } : {}
				}))
			};
		}
		let a = e.flavor ?? "plain";
		if (![
			"plain",
			"hex",
			"base64",
			"file"
		].includes(a)) throw TypeError("Raw printing supports plain, hex, base64, or file data.");
		let o = e.options?.encoding === void 0 ? e.type === "zpl" && a === "plain" ? lt(r) : {
			escpos: "CP850",
			zpl: "UTF-8",
			raw: "ISO-8859-1"
		}[e.type] : e.options.encoding;
		return {
			printer: e.printer,
			options: {
				copies: 1,
				forceRaw: typeof navigator < "u" && navigator.platform.startsWith("Mac"),
				...e.options,
				encoding: o
			},
			data: n.map((e) => typeof e == "string" ? {
				type: "raw",
				format: "command",
				flavor: a,
				data: e
			} : e)
		};
	}
}, dt = class e {
	static #e = new e();
	connection = new ct();
	printers = new ut(this.connection);
	constructor() {}
	static getInstance() {
		return e.#e;
	}
	isConnected() {
		return this.connection.isConnected();
	}
	connect() {
		return this.connection.connect();
	}
	disconnect() {
		return this.connection.disconnect();
	}
	getPrinters() {
		return this.printers.getPrinters();
	}
	print(e) {
		return this.printers.print(e);
	}
	printEscpos(e, t, n) {
		return this.printers.printEscpos(e, t, n);
	}
	printZpl(e, t, n) {
		return this.printers.printZpl(e, t, n);
	}
	printRaw(e, t, n) {
		return this.printers.printRaw(e, t, n);
	}
	printPdf(e, t, n) {
		return this.printers.printPdf(e, t, n);
	}
}, ft = new URL("zebrash.wasm", import.meta.url).href, pt = null, mt = null;
async function ht(e, t = {}) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("Provide a nonempty ZPL string to render.");
	let n = t.wasmUrl ?? ft;
	if (typeof n != "string" || n.trim() === "") throw TypeError("Provide the ZPL renderer WASM asset URL.");
	if (mt !== null && mt !== n) throw Error("The ZPL renderer is already initialized with a different WASM asset URL.");
	let { widthMm: r = 101.6, heightMm: i = 203.2, dpmm: a = 8 } = t;
	for (let [e, t] of Object.entries({
		widthMm: r,
		heightMm: i,
		dpmm: a
	})) if (!Number.isFinite(t) || t <= 0) throw RangeError(`${e} must be a finite positive number.`);
	if (!Number.isInteger(a)) throw RangeError("dpmm must be a positive integer.");
	let { renderAll: o = !1, grayscaleOutput: s = !1, enableInvertedLabels: c = !1 } = t;
	if (typeof o != "boolean" || typeof s != "boolean" || typeof c != "boolean") throw TypeError("ZPL rendering flags must be boolean values.");
	pt === null && (mt = n, pt = import("./index.external.esm-Bcwt_wNA.js").then(({ init: e }) => e({ wasmUrl: n })));
	let l = await pt, u = {
		grayscaleOutput: s,
		enableInvertedLabels: c
	};
	if (o) {
		let t = await l.zplToBase64MultipleAsync(e, r, i, a, u);
		if (t.length === 0 || t.some((e) => e === "")) throw Error("The ZPL renderer did not produce a PNG image.");
		return t.map((e) => `data:image/png;base64,${e}`);
	}
	let d = await l.zplToBase64Async(e, r, i, a, u);
	if (d === "") throw Error("The ZPL renderer did not produce a PNG image.");
	return `data:image/png;base64,${d}`;
}
//#endregion
//#region resources/js/escposImage.ts
function gt(e) {
	if (typeof e != "object" || !e) throw TypeError("ESC/POS payload parts must be strings, bytes, or Base64 raw images.");
	let t = e;
	if (t.type !== "raw" || t.format !== "image" || t.flavor !== "base64") throw TypeError("ESC/POS previews support only raw Base64 image objects.");
	if (typeof t.data != "string" || t.data.trim() === "") throw TypeError("Provide complete PNG or JPEG Base64 image data.");
	let n = t.options ?? {};
	if (typeof n != "object" || Array.isArray(n)) throw TypeError("ESC/POS image options must be an object.");
	for (let e of Object.keys(n)) if (![
		"language",
		"dotDensity",
		"imageEncoding",
		"quantization",
		"threshold"
	].includes(e)) throw TypeError(`Unsupported ESC/POS preview image option: ${e}.`);
	if (n.language !== void 0 && n.language !== "ESCPOS") throw TypeError("ESC/POS preview images must use language ESCPOS.");
	if (n.dotDensity !== void 0 && ![
		"single",
		"double",
		"single-legacy",
		"double-legacy",
		32,
		33
	].includes(n.dotDensity)) throw TypeError("Unsupported ESC/POS preview image dot density.");
	if (n.imageEncoding !== void 0 && !["esc_asterisk", "gs_v_0"].includes(n.imageEncoding)) throw TypeError("Unsupported ESC/POS preview image encoding.");
	if (n.quantization !== void 0 && ![
		"luma",
		"alpha",
		"black"
	].includes(n.quantization)) throw TypeError("Unsupported ESC/POS preview image quantization.");
	let r = n.threshold ?? 127;
	if (!Number.isInteger(r) || r < 0 || r > 255) throw RangeError("ESC/POS image threshold must be an integer between zero and 255.");
	return {
		type: "raw",
		format: "image",
		flavor: "base64",
		data: t.data,
		options: { ...n }
	};
}
async function _t(e) {
	let t = e.data.replace(/^data:image\/(?:png|jpeg);base64,/i, "").replace(/\s/g, ""), n;
	try {
		n = atob(t);
	} catch {
		throw TypeError("Provide valid PNG or JPEG Base64 image data.");
	}
	let r = n.startsWith("PNG\r\n\n"), i = n.startsWith("ÿØÿ");
	if (!r && !i) throw TypeError("ESC/POS preview images must contain a PNG or JPEG file.");
	if (typeof Image > "u" || typeof document > "u") throw Error("Base64 ESC/POS image previews require browser image and canvas APIs.");
	let a = new Image();
	await new Promise((e, n) => {
		a.onload = () => e(), a.onerror = () => n(/* @__PURE__ */ Error("Could not decode the ESC/POS preview image.")), a.src = `data:image/${r ? "png" : "jpeg"};base64,${t}`;
	});
	let o = Math.ceil(a.naturalWidth / 8) * 8, s = a.naturalHeight;
	if (o <= 0 || o > 65535 || s <= 0 || s > 65535) throw RangeError("ESC/POS preview image dimensions must be between one and 65535 pixels.");
	let c = document.createElement("canvas");
	c.width = o, c.height = s;
	let l = c.getContext("2d");
	if (l === null) throw Error("Could not create the ESC/POS preview image canvas.");
	l.drawImage(a, 0, 0);
	let u = l.getImageData(0, 0, o, s).data, d = new Uint8Array(o * s), { threshold: f = 127, quantization: p = "luma", dotDensity: m = "single", imageEncoding: h = "esc_asterisk" } = e.options ?? {};
	for (let e = 0; e < d.length; e++) {
		let t = e * 4, [n, r, i, a] = u.subarray(t, t + 4), o = Math.floor((n * 299 + r * 587 + i * 114) / 1e3);
		d[e] = +(p === "alpha" ? a > f : p === "black" ? a === 255 && n === 0 && r === 0 && i === 0 : a >= f && o < f);
	}
	if (h === "gs_v_0") {
		let e = Math.ceil(o / 8), t = new Uint8Array(8 + e * s);
		t.set([
			29,
			118,
			48,
			0,
			e & 255,
			e >> 8,
			s & 255,
			s >> 8
		]);
		for (let n = 0; n < s; n++) for (let r = 0; r < o; r++) t[8 + n * e + (r >> 3)] |= d[n * o + r] << 7 - r % 8;
		return t;
	}
	let g = m === "double" || m === "double-legacy" || m === 33 ? 33 : 32, _ = m === "single-legacy" || m === "double-legacy", v = 5 + o * 3 + (_ ? 1 : 3), y = new Uint8Array(Math.ceil(s / 24) * v + (_ ? 6 : 0)), b = 0;
	_ && (y.set([
		27,
		51,
		24
	], b), b += 3);
	for (let e = 0; e < s; e += 24) {
		y.set([
			27,
			42,
			g,
			o & 255,
			o >> 8
		], b), b += 5;
		for (let t = 0; t < o; t++) for (let n = 0; n < 3; n++) {
			let r = 0;
			for (let i = 0; i < 8; i++) {
				let a = e + n * 8 + i;
				a < s && (r |= d[a * o + t] << 7 - i);
			}
			y[b++] = r;
		}
		y.set(_ ? [10] : [
			27,
			74,
			24
		], b), b += _ ? 1 : 3;
	}
	return _ && y.set([
		27,
		51,
		30
	], b), y;
}
//#endregion
//#region resources/js/renderEscpos.ts
var vt = {
	CP850: "cp850",
	CP437: "cp437",
	"ISO-8859-1": "iso8859-1",
	"Windows-1252": "windows1252"
};
function yt() {
	return Promise.all([import("./receipt-printer-renderer.esm-BEpqN9y1.js"), import("./codepage-encoder-DUs3fjHS.js")]);
}
var bt = null;
async function xt(e, t = {}) {
	let { widthDots: n = 384, encoding: r = "CP850", codepageMapping: i = "epson", renderAll: a = !1 } = t;
	if (!Number.isSafeInteger(n) || n <= 0 || n % 8 != 0) throw RangeError("widthDots must be a positive integer multiple of eight.");
	if (typeof a != "boolean") throw TypeError("renderAll must be a boolean value.");
	if (typeof r != "string" || !Object.hasOwn(vt, r)) throw TypeError("Provide a supported ESC/POS text encoding.");
	if (typeof i != "string" || i.trim() === "") throw TypeError("Provide a nonempty ESC/POS codepage mapping.");
	if (typeof e != "string" && !(e instanceof Uint8Array) && !Array.isArray(e)) throw TypeError("Provide ESC/POS text, bytes, or an array of text, bytes, and raw images.");
	let o = [];
	for (let t of Array.isArray(e) ? e : [e]) if (typeof t == "string") {
		let e = o.at(-1);
		typeof e == "string" ? o[o.length - 1] = e + t : o.push(t);
	} else t instanceof Uint8Array ? o.push(new Uint8Array(t)) : o.push(gt(t));
	if (o.every((e) => typeof e == "string" || e instanceof Uint8Array ? e.length === 0 : !1)) throw TypeError("Provide a nonempty ESC/POS payload to render.");
	bt ??= yt().catch((e) => {
		throw bt = null, e;
	});
	let [{ EscPosRenderer: s, stitch: c, toPng: l }, { default: u }] = await bt, d = [];
	for (let e of o) if (typeof e == "string") {
		let t = u.encode(e, vt[r]);
		for (let n = 0; n < e.length; n++) {
			let r = e.charCodeAt(n);
			r < 128 && (t[n] = r);
		}
		d.push(t);
	} else d.push(e instanceof Uint8Array ? e : await _t(e));
	let f = new Uint8Array(d.reduce((e, t) => e + t.length, 0)), p = 0;
	for (let e of d) f.set(e, p), p += e.length;
	let m = new s({
		width: n,
		codepageMapping: i,
		commands: ["cut"]
	}).render(f), h = [], g = [];
	for (let e of m) e.type === "cut" ? g.length > 0 && (h.push(g), g = []) : e.type === "image" && e.height > 0 && g.push(e);
	if (g.length > 0 && h.push(g), h.length === 0) throw Error("The ESC/POS renderer did not produce a PNG image.");
	let _ = [];
	for (let e of a ? h : h.slice(0, 1)) {
		let t = await l(c(e, { width: n })), r = "";
		for (let e of t) r += String.fromCharCode(e);
		_.push(`data:image/png;base64,${btoa(r)}`);
	}
	return a ? _ : _[0];
}
//#endregion
//#region node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url&no-inline
var St = new URL("pdf.worker.min.mjs", import.meta.url).href;
//#endregion
//#region resources/js/renderPdf.ts
function Ct() {
	return Promise.all([import("./pdf-CT97BrCZ.js"), import("./pdfAssets-J30hfZGN.js")]).then(([e, t]) => (e.GlobalWorkerOptions.workerSrc = St, {
		pdfjs: e,
		assets: t
	}));
}
var wt = null;
function Tt(e) {
	if (e.startsWith("%PDF-")) {
		for (let t = 0; t < e.length; t++) if (e.charCodeAt(t) > 255) throw TypeError("PDF binary strings must contain only byte-valued characters.");
		return Uint8Array.from(e, (e) => e.charCodeAt(0));
	}
	try {
		let t = atob(e.replace(/^data:application\/pdf;base64,/i, "").replace(/\s/g, ""));
		return Uint8Array.from(t, (e) => e.charCodeAt(0));
	} catch {
		throw TypeError("Provide valid PDF Base64 content or a PDF binary string.");
	}
}
async function Et(e, t) {
	let n, r;
	if (typeof e == "object" && e && "url" in e ? (r = e.url, n = "") : typeof e == "object" && e && "data" in e ? n = e.data : (n = e, (e instanceof URL || typeof e == "string" && !/^(%PDF-|JVBER|data:application\/pdf;base64,)/i.test(e)) && (r = e)), r !== void 0) {
		if (!(r instanceof URL) && (typeof r != "string" || r.trim() === "")) throw TypeError("Provide a nonempty PDF URL.");
		let e = new URL(String(r), typeof document < "u" ? document.baseURI : void 0);
		if (![
			"http:",
			"https:",
			"blob:"
		].includes(e.protocol)) throw TypeError("PDF URLs must use HTTP, HTTPS, or blob protocols.");
		let i = await fetch(e, {
			credentials: "same-origin",
			...t
		});
		if (!i.ok) throw Error(`Could not download the PDF: HTTP ${i.status}.`);
		n = await i.arrayBuffer();
	}
	let i = typeof n == "string" ? Tt(n) : n instanceof Uint8Array ? new Uint8Array(n) : n instanceof ArrayBuffer ? new Uint8Array(n.slice(0)) : n instanceof Blob ? new Uint8Array(await n.arrayBuffer()) : null;
	if (i === null || i.length === 0) throw TypeError("Provide nonempty PDF content as Base64, bytes, an ArrayBuffer, or a Blob.");
	return i;
}
async function Dt(e, t = {}) {
	let { renderAll: n = !1, pageNumber: r = 1, scale: i = 1.5, rotation: a, password: o } = t;
	if (typeof n != "boolean" || o !== void 0 && typeof o != "string") throw TypeError("Provide a boolean renderAll flag and a string PDF password.");
	if (!Number.isSafeInteger(r) || r < 1) throw RangeError("PDF pageNumber must be a positive integer.");
	if (!Number.isFinite(i) || i <= 0) throw RangeError("PDF scale must be a finite positive number.");
	if (a !== void 0 && ![
		0,
		90,
		180,
		270
	].includes(a)) throw RangeError("PDF rotation must be 0, 90, 180, or 270 degrees.");
	if (n && t.pageNumber !== void 0) throw TypeError("Choose pageNumber or renderAll, rather than both.");
	if (typeof document > "u") throw Error("PDF previews require browser document and canvas APIs.");
	let s = await Et(e, t.requestInit);
	wt ??= Ct().catch((e) => {
		throw wt = null, e;
	});
	let { pdfjs: c, assets: l } = await wt, u = c.getDocument({
		data: s,
		password: o,
		CMapReaderFactory: l.PdfCMapReader,
		StandardFontDataFactory: l.PdfFontReader,
		WasmFactory: l.PdfWasmReader,
		useWorkerFetch: !1,
		isEvalSupported: !1
	});
	try {
		let e = await u.promise;
		if (r > e.numPages) throw RangeError(`PDF pageNumber exceeds the document's ${e.numPages} pages.`);
		let t = n ? Array.from({ length: e.numPages }, (e, t) => t + 1) : [r], o = [];
		for (let n of t) {
			let t = await e.getPage(n), r = document.createElement("canvas");
			try {
				let e = t.getViewport({
					scale: i,
					...a === void 0 ? {} : { rotation: a }
				});
				r.width = Math.ceil(e.width), r.height = Math.ceil(e.height);
				let n = r.getContext("2d");
				if (n === null) throw Error("Could not create the PDF preview canvas.");
				await t.render({
					canvas: r,
					canvasContext: n,
					viewport: e
				}).promise;
				let s = r.toDataURL("image/png");
				if (!s.startsWith("data:image/png;base64,")) throw Error("The PDF renderer did not produce a PNG image.");
				o.push(s);
			} finally {
				t.cleanup(), r.width = 0, r.height = 0;
			}
		}
		return n ? o : o[0];
	} finally {
		await u.destroy();
	}
}
//#endregion
//#region resources/js/index.ts
var Ot = dt.getInstance();
//#endregion
export { dt as QzTray, dt as QzTrayConnector, ot as QzTrayCertificateError, $ as QzTraySigningError, Ot as default, Ot as qztray, xt as renderEscpos, Dt as renderPdf, ht as renderZpl };
