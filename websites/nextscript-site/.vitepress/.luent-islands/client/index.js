//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
}, n = class {
	stacks = {};
	stackKeys = [];
	current = {
		value: {},
		prev: void 0
	};
	push(e) {
		this.current = {
			value: e,
			prev: this.current
		};
	}
	pop() {
		this.current &&= this.current.prev;
	}
};
function r() {
	let e = {}, t = i.stackKeys, n = i.current;
	if (!n) return e;
	for (let r of t) {
		let t = n.value[r];
		t && (e[r] = {
			prev: t.prev,
			value: t.value
		});
	}
	return e;
}
var i = new n();
function a() {
	let e = i.current;
	if (e) return e.value;
}
function o(e) {
	i.stackKeys.push(e);
	function t(t, n = a()) {
		n && (n[e] = {
			value: t,
			prev: n[e]
		});
	}
	function n(t = a()) {
		if (!t) return;
		let n = t[e];
		if (n) {
			let r = n.value;
			return t[e] = n.prev, r;
		}
	}
	let r = {
		push: t,
		pop: n
	};
	return i.stacks[e] = r, [function(t = a()) {
		if (t) return t[e]?.value;
	}, r];
}
function s(e, t, n) {
	let r = n ? [] : void 0;
	try {
		if (i.push(e), r && n) for (let t in n) {
			let a = i.stacks[t];
			a && (a.push(n[t], e), r.push(a));
		}
		return t();
	} finally {
		if (r) for (let t of r) t.pop(e);
		i.pop();
	}
}
function c(e) {
	let t = r();
	return () => {
		s(t, e);
	};
}
//#endregion
//#region ../../packages/luent/src/context/context-stack.ts
function l(e) {
	if (!e) throw Error("Provider is undefined");
	f.push(e);
}
function u() {
	f.pop();
}
var [d, f] = o("context");
Array.isArray;
//#endregion
//#region ../../packages/utils/uid.ts
function p(e) {
	let t = 36, n = "";
	for (; t--;) n += t.toString(36);
	return function() {
		let t = "", r = e || 11;
		for (; r--;) t += n[Math.random() * 36 | 0];
		return t;
	};
}
//#endregion
//#region ../../packages/utils/utils.ts
var m = () => {};
function h(e) {
	return e === void 0 ? [] : Array.isArray(e) ? e : [e];
}
//#endregion
//#region ../../packages/utils/SetMap.ts
var g = class extends Map {
	constructor() {
		super();
	}
	initializeSet(e) {
		let t = /* @__PURE__ */ new Set();
		return this.set(e, t), t;
	}
	addToSet(e, t) {
		let n = this.get(t);
		n ||= this.initializeSet(t), n.add(e);
	}
	deleteFromSet(e, t) {
		this.get(t)?.delete(e);
	}
};
//#endregion
//#region ../../packages/utils/strings.ts
function _(e) {
	return e.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
//#endregion
//#region ../../packages/utils/typecheck.ts
function v(e) {
	return typeof e == "function";
}
function y(e) {
	return typeof e == "object" && !!e;
}
function b(e) {
	return typeof e == "string";
}
//#endregion
//#region ../../packages/utils/debug.ts
var ee = "@%", x = {
	action(e, ...t) {
		S(ee), S(ee, "ACTION---------------------"), S(ee, `${e}`), S(ee, `${e}`);
		for (let e of t) S(ee, ...e);
	},
	log: S,
	warn: ae,
	error: re,
	trace: ne,
	throw: ie
}, te = [];
function S(...e) {
	te.push({
		type: "log",
		details: e
	});
}
function ne(...e) {
	te.push({
		type: "trace",
		details: e
	});
}
function re(...e) {
	te.push({
		type: "error",
		details: e
	});
}
function ie(...e) {
	te.push({
		type: "error",
		details: e
	});
}
function ae(...e) {
	te.push({
		type: "warn",
		details: e
	});
}
function oe(e) {
	return e instanceof Error ? e : Error(typeof e == "string" ? e : String(e));
}
//#endregion
//#region ../../packages/utils/Stack.ts
function se() {
	let e;
	function t(t) {
		return e = {
			value: t,
			prev: e
		}, t;
	}
	function n() {
		e &&= e.prev;
	}
	function r() {
		return e?.value;
	}
	return [
		t,
		n,
		r
	];
}
//#endregion
//#region ../../packages/luent/src/context/ContextKey.ts
function ce(e) {
	return v(e) && e.name.startsWith("MU_");
}
function le(e) {
	return typeof e == "string" ? e : "contextKey" in e ? e.contextKey : e.name === "context-key" ? e : e.name;
}
function ue(e = "context-key") {
	let t = function(e) {
		return {
			0: t,
			1: e
		};
	};
	return Object.defineProperty(t, "name", { value: e }), t;
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonicDef.ts
var de = /* @__PURE__ */ new Map();
function fe(e) {
	return de.get(e);
}
function pe(e, t, n) {
	he(e, t, n);
}
function me(e, t, n) {
	he(e, t, n);
}
function he(e, t, n) {
	de.get(e) && x.warn(`Ionic ops for ${e.name} already defined`), de.set(e, {
		config: t,
		def: n
	});
}
//#endregion
//#region ../../packages/quarky/src/abstract/Quark.ts
var C = Symbol("quark");
function ge(e) {
	return (y(e) || v(e)) && C in e;
}
function _e(e) {
	return e[C];
}
//#endregion
//#region ../../packages/quarky/src/reactivity/RenderCycle.ts
var ve = (e) => scheduler.postTask(e), { LAYOUT: ye, PRELUDE: w, RENDER: be, SYNC: T, TICK: E } = /* @__PURE__ */ function(e) {
	return e.SYNC = "s", e.PRELUDE = "p", e.RENDER = "r", e.LAYOUT = "l", e.TICK = "t", e;
}({}), xe = [
	T,
	w,
	be,
	ye,
	E
];
function Se() {
	let e = Object.create(null);
	for (let t of xe) e[t] = void 0;
	return e;
}
var Ce = class {
	update;
	currentPhase = T;
	phases = Se();
	getPhase(e) {
		return this.phases[e] ?? (this.phases[e] = this.createPhase(e));
	}
	createPhase(e) {
		return new Ee[e](e);
	}
	constructor(e) {
		this.update = e;
	}
	get more() {
		return this.phases[w]?.more || this.phases[be]?.more || this.phases[ye]?.more;
	}
	started = !1;
	loop = 0;
	async start() {
		for (this.started = !0; this.more;) {
			this.loop++, console.log("@@@ this.loop", this.loop), console.log("@@@ prelude---"), this.currentPhase = w;
			let e = this.phases[w];
			e && await this.runPhase(e), this.loop === 1 && (this.update.commit(), Pe(this.update)), console.log("@@@ render---"), this.currentPhase = be;
			let t = this.phases[be];
			t && await this.runPhase(t), console.log("@@@ layout---"), this.currentPhase = ye;
			let n = this.phases[ye];
			n && await this.runPhase(n);
		}
		this.update.committed || this.update.commit(), console.log("@@@ tick---"), this.currentPhase = E, this.runEffects(E), this.update.complete(), Fe();
	}
	startTime = performance.now();
	timecheck(e) {
		let t = e - this.startTime, n = this.update.timeMargin;
		n && t > n ? n !== 16.7 && console.log("Interaction-to-paint time exceeds", n, "ms:", t) : n === Infinity && console.log("passed timecheck", n, t);
	}
	async runPhase(e) {
		let t = e.effects;
		e.effects = [];
		let n = e.tasks;
		e.tasks = [];
		let r = 0;
		for (; t.length || n.length;) {
			r++;
			let i = /* @__PURE__ */ new Set();
			for (let e of t) e.runEffects(i, this.update);
			for (let e of n) {
				let t = e(this.update);
				t instanceof Promise && await t;
			}
			t = e.effects, n = e.tasks, e.effects = [], e.tasks = [];
		}
	}
	scheduleEffects(e, t) {
		this.getPhase(t).scheduleEffects(e);
	}
	scheduleTask(e, t) {
		t === E ? requestAnimationFrame(() => ve(e)) : this.getPhase(t).scheduleTask(e);
	}
	runEffects(e) {
		let t = this.phases[e];
		if (!t) return;
		let n = t.effects;
		for (t.effects = []; n.length;) {
			let e = /* @__PURE__ */ new Set();
			for (let t of n) t.runEffects(e, this.update);
			n = t.effects, t.effects = [];
		}
	}
}, we = class {
	phase;
	effects = [];
	get more() {
		return this.effects.length;
	}
	constructor(e) {
		this.phase = e;
	}
	scheduleEffects(e) {
		console.log("@@@ schedule effects", this.effects, "queued?", this.queued(e)), this.queued(e) || this.effects.push(e);
	}
	queued(e) {
		return this.effects.indexOf(e) > -1;
	}
}, Te = class extends we {
	phase;
	tasks = [];
	get more() {
		return console.log("this.effects.length", this.effects.length), this.effects.length || this.tasks.length;
	}
	constructor(e) {
		super(e), this.phase = e;
	}
	scheduleTask(e) {
		this.tasks.push((t) => {
			try {
				return Pe(t), e();
			} finally {
				Fe();
			}
		});
	}
}, Ee = {
	[T]: we,
	[w]: Te,
	[be]: Te,
	[ye]: Te,
	[E]: we
};
function De() {
	let e = Ne();
	if (!e) throw Error("Must wrap in update");
	return e.cycle;
}
function Oe() {
	return E;
}
function D(e) {
	Le()?.cycle.scheduleTask(e, be);
}
function ke(e) {
	requestAnimationFrame(() => {
		ve(e);
	});
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Update.ts
var Ae = {
	USER_ANIMATION: 0,
	USER_INTERACTION: 1,
	BACKGROUND_ANIMATION: 2,
	SERVER_RESPONSE: 3,
	INSTANT: 4,
	IDLE: 5
}, [je, Me, Ne] = se();
function Pe(e) {
	je(e);
}
function Fe() {
	Me();
}
var Ie;
function Le() {
	let e = Ne();
	if (!e) {
		if (Ie) return Ie;
		let e = Ie = new Re(Ae.INSTANT, 100, !1);
		return Pe(e), queueMicrotask(() => {
			Ie = null, Fe(), e.start();
		}), Ie;
	}
	return e;
}
var Re = class {
	type;
	timeMargin;
	idle;
	timestamp = performance.now();
	constructor(e = Ae.USER_INTERACTION, t = 100, n = !0) {
		this.type = e, this.timeMargin = t, this.idle = n;
	}
	tasks = [];
	output;
	queue(e) {
		if (this.started) try {
			Pe(this), this.output = e();
		} finally {
			Fe();
		}
		else this.tasks.push(e);
		return this;
	}
	_cycle;
	get cycle() {
		return this._cycle ??= new Ce(this);
	}
	started = !1;
	start() {
		if (this.started) return this;
		this.started = !0;
		try {
			Pe(this);
			for (let e of this.tasks) this.output = e();
		} finally {
			Fe(), this.cycle.start();
		}
		return this;
	}
	committed = !1;
	commit() {
		this.committed = !0, this.cast("commit");
	}
	cast(e) {
		let t = this.hooks[e];
		for (let e of t) e();
	}
	hooks = {
		commit: [],
		complete: []
	};
	atCommit(e) {
		this.hooks.commit.push(e);
	}
	completed = !1;
	complete() {
		this.completed = !0, this.cast("complete");
	}
	atComplete(e) {
		this.hooks.complete.push(e);
	}
	get closed() {
		return this.started;
	}
	race(e, ...t) {
		return e === null || e === this;
	}
};
function O(e) {
	ze(e);
}
function ze(e) {
	return Be().queue(e).start()?.output;
}
function Be() {
	return new Re(Ae.USER_ANIMATION, 16.7, !1);
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Atom.ts
function k(e) {
	e && e.asTrackedAtom?.triggerEffects();
}
function Ve(e) {
	return ge(e) && "asTrackedAtom" in e[C];
}
function He(e) {
	return e.asTrackedAtom ??= new We(e);
}
var Ue = class {
	phase;
	runEffect;
	effects = /* @__PURE__ */ new Set();
	constructor(e, t = (e, t) => {
		try {
			Pe(t), e.run();
		} finally {
			Fe();
		}
	}) {
		this.phase = e, this.runEffect = t;
	}
	runEffects(e, t) {
		let n = this.effects;
		for (let r of n) if (r.run) {
			if (e.has(r)) {
				this.effects.add(r);
				continue;
			}
			e.add(r), this.runEffect(r, t), r.fn && this.effects.add(r);
		}
	}
	add(e) {
		this.effects.add(e);
	}
}, We = class {
	entity;
	constructor(e) {
		this.entity = e;
	}
	phases = xe;
	effects = Se();
	getEffects(e) {
		return this.effects[e] ?? (this.effects[e] = this.createPhaseEffects(e));
	}
	createPhaseEffects(e) {
		return e === E ? new Ue(E, (e, t) => {
			requestAnimationFrame(() => {
				ve(() => {
					e.run && new Re(t.type, t.timeMargin, t.type === Ae.USER_INTERACTION ? !1 : t.idle).queue(e.run).start();
				});
			});
		}) : new Ue(e);
	}
	link(e) {
		this.getEffects(e.phase).add(e), console.log("link effect", e, e.phase, this.effects);
	}
	triggerEffects() {
		let e = this.phases, t = Le().cycle;
		for (let n = 1; n < e.length; n++) {
			let r = e[n], i = this.effects[r];
			console.log("@@@trigger effects", this.entity, r, i), i && t.scheduleEffects(i, r);
		}
		let n = this.effects[T];
		n && (t.scheduleEffects(n, T), t.runEffects(T));
	}
}, [Ge, Ke, qe] = se();
function Je(e) {
	qe()?.track(e);
}
var Ye = class {
	_particles = /* @__PURE__ */ new Set();
	particles = [];
	track(e) {
		return this._particles.has(e) ? e : (this._particles.add(e), this.particles.push(e), e);
	}
	untrackAtoms() {
		this.particles.length = 0, this._particles.clear();
	}
	forEachAtom(e) {
		let t = [this.particles];
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			for (let n of r) "forEachAtom" in n ? t.push(n.particles) : e(n);
		}
	}
};
//#endregion
//#region ../../packages/quarky/src/reactivity/State.ts
function Xe(e) {
	return e.pendingUpdate && e.pendingUpdate === Ne() ? e.pending : e.current;
}
function Ze(e) {
	let t = Le();
	if (!t) {
		console.error("nothing to lock to");
		return;
	}
	t.race(e.pendingUpdate) || console.warn("*&^ RACE updates aren't the same", t, e.pendingUpdate, e.get()), e.pendingUpdate === null && (e.pendingUpdate = t, t.atComplete(() => {
		e.pendingUpdate = null;
	})), t.committed ? (console.warn("ALREADY COMMITTED", e.pending instanceof Array ? [...e.pending] : e.pending), t.atComplete(() => {
		e.commitUpdate();
	})) : Qe(t, e);
}
function Qe(e, t) {
	e.atCommit(() => {
		t.commitUpdate();
	});
}
var $e = class {
	current;
	pending;
	constructor(e) {
		this.current = e, this.pending = e;
	}
	get() {
		return Xe(this);
	}
	lock() {
		return Ze(this);
	}
	_pendingUpdate = null;
	get pendingUpdate() {
		return this._pendingUpdate;
	}
	set pendingUpdate(e) {
		this._pendingUpdate = e;
	}
	cancelUpdate() {
		this.pending = this.current;
	}
	commitUpdate() {
		return this.current = this.pending;
	}
	set(e) {
		return this.lock(), this.pending = e, e;
	}
}, et = class {
	clone;
	current;
	pending;
	constructor(e, t = (e) => e) {
		this.clone = t, this.current = e, this.pending = t(e);
	}
	get() {
		return Xe(this);
	}
	lock() {
		return Ze(this);
	}
	pendingUpdate = null;
	cancelUpdate() {
		this.mutations.length && (this.pending = this.clone(this.current), this.mutations = []);
	}
	commitUpdate() {
		this.mutations.length && this.applyMutations();
	}
	mutations = [];
	mutate(e) {
		return this.lock(), this.mutations.push(e), e(this.pending);
	}
	mutateSync(e) {
		return this.mutations.push(e), e(this.pending);
	}
	applyMutations() {
		console.log("apply mutations", this.mutations);
		for (let e of this.mutations) e(this.current);
		this.mutations = [];
	}
}, tt = "trace", [nt, rt] = [];
function it() {
	let e = nt?.();
	return e ? "    at async " + e?.slice(3) : "";
}
//#endregion
//#region ../../packages/quarky/src/debug/Traceable.ts
var at = class {
	name;
	origin;
	constructor(e = "", t = ot()) {
		this.name = e, this.origin = t;
	}
};
function ot() {
	return "";
}
//#endregion
//#region ../../packages/flask/Flask.ts
var A = "flask", [j, st] = o(A);
function M() {
	let e = j();
	if (!e) throw Error("No flask found. Must call within the scope of a flask");
	return e;
}
var ct = class {
	flask;
	constructor(e) {
		this.flask = e, e.thisFlask = this;
	}
	atRemount(e) {
		return this.flask.onRemount(e);
	}
	atMount(e) {
		this.flask.onInitialMount(() => e(!0)), this.flask.onRemount(() => e(!1));
	}
	beforeUnmount(e) {
		this.flask.onDemount(() => e(!1)), this.flask.onDiscard(() => e(!0));
	}
	beforeDemount(e) {
		return this.flask.onDemount(e);
	}
}, lt = p(11), ut = class e {
	thisFlask;
	outer;
	type;
	creationScopeID;
	initialLoad = !0;
	constructor(e = {}) {
		let { outer: t, type: n, creationScope: r } = e;
		if (this.outer = t, this.type = n, this.creationScopeID = r ? lt() : t?.creationScopeID ?? "0", t) {
			let e = t.onRemount(() => this.emitRemount()), n = t.onDemount(() => this.emitDemount()), r = t.onDiscard(() => this.emitDiscard());
			this.onDiscard(() => {
				e.stop(), n.stop(), r.stop();
			});
		}
	}
	spawn(t) {
		return new e({
			outer: this,
			type: t.type,
			creationScope: t.creationScope
		});
	}
	tasks = new g();
	emit(e) {
		let t = this.tasks.get(e);
		if (t) for (let e of t) e();
	}
	on(e, t) {
		let n = this.tasks;
		return n.addToSet(t, e), { stop() {
			n.deleteFromSet(t, e);
		} };
	}
	emitInitialMount() {
		this.tasks.get("i") && (this.emit("i"), this.tasks.delete("i"));
	}
	onInitialMount(e) {
		return this.on("i", e);
	}
	emitDemount() {
		this.emit("dm");
	}
	onDemount(e) {
		return this.on("dm", e);
	}
	emitRemount() {
		this.emit("rm");
	}
	onRemount(e) {
		return this.on("rm", e);
	}
	onDiscard(e) {
		return this.on("d", e);
	}
	discarded = !1;
	emitDiscard() {
		this.emit("d"), this.discarded = !0, this.tasks.delete("i"), this.tasks.delete("rm"), this.tasks.delete("dm"), this.tasks.delete("d");
	}
	containCall(e) {
		try {
			return st.push(this), e();
		} finally {
			st.pop();
		}
	}
};
//#endregion
//#region ../../packages/flask/Listener.ts
function dt(e) {
	let { enroll: t, remove: n, callback: i, options: a } = e;
	if (!i) return { stop() {
		return !1;
	} };
	let o = { stop: _ }, c = !!a?.eager, l = { run: (...e) => {
		if (!l.run) return;
		let t = p(e);
		return c || _(), c = !1, t;
	} }, u = pt(a?.within), d = u === null ? void 0 : u || j(), f = r();
	function p(t) {
		s(f, () => i(...t), {
			[A]: d,
			[tt]: e.__DEV__asyncPath ?? ""
		});
	}
	let m = a?.until, h = t(l.run), g = ft(o, m, d);
	function _() {
		return xt(o, l, () => n(h ?? l.run), g);
	}
	return _.isRemover = !0, _t(m, _, o, u, d), o;
}
function ft(e, t, n) {
	return t === null || !n ? void 0 : n.onDiscard(e.stop).stop;
}
function pt(e) {
	return e instanceof ct ? e.flask : e;
}
function mt(e) {
	let { enroll: t, remove: n, callback: i, options: a } = e;
	if (!i) return { stop() {
		return !1;
	} };
	let o = { stop: _ }, c = { run: (...e) => {
		if (c.run) return p(e);
	} }, l = pt(a?.within), u = l === null ? void 0 : l || j(), d = r(), f;
	function p(t) {
		f && f.emitDiscard(), f = u?.spawn({
			type: "scene",
			creationScope: !0
		}) || new ut({
			type: "scene",
			creationScope: !0
		}), s(d, () => i(...t), {
			[A]: f,
			[tt]: e.__DEV__asyncPath ?? ""
		});
	}
	let m = a?.until, h = t(c.run), g = ft(o, m, u);
	function _() {
		return xt(o, c, () => n(h ?? c.run), g);
	}
	return _.isRemover = !0, _t(m, _, o, l, u), o;
}
function ht() {
	return !1;
}
function gt(e) {
	let { enroll: t, remove: n, callback: i, options: a } = e;
	if (!i) return {
		stop: ht,
		pause: ht,
		resume: ht
	};
	let o = !1, c = !1, l = {
		stop: b,
		pause() {
			return !d.run || o ? !1 : (o = !0, c = !1, !0);
		},
		resume() {
			return !d.run || !o ? !1 : (o = !1, c && d.run(), !0);
		}
	}, u = (e) => {
		if (o) {
			c = !0;
			return;
		}
		return c = !1, i(...e);
	}, d = { run: (...e) => {
		if (d.run) return g(e);
	} }, f = pt(a?.within), p = f === null ? void 0 : f || j(), m = r(), h;
	function g(t) {
		h && h.emitDiscard(), h = p?.spawn({
			type: "scene",
			creationScope: !0
		}) || new ut({
			type: "scene",
			creationScope: !0
		}), s(m, () => u(t), {
			[A]: h,
			[tt]: e.__DEV__asyncPath ?? ""
		});
	}
	let _ = t(d.run), v = a?.until, y = p ? bt(l, p, v) : void 0;
	function b() {
		return xt(l, d, () => n(_ ?? d.run), y);
	}
	return b.isRemover = !0, _t(v, b, l, f, p), l;
}
function _t(e, t, n, r, i) {
	vt(e, t);
}
function vt(e, t) {
	if (e === null) return !0;
	if (!e) return !1;
	if (e instanceof AbortSignal) return e.onabort = t, !0;
	if (Array.isArray(e) && (e = Ct(...e)), e) return e(t), !0;
}
var yt = { stop: ht };
function bt(e, t, n) {
	let { stop: r } = n === null ? yt : t.onDiscard(e.stop), { stop: i } = t.onDemount(e.pause), { stop: a } = t.onRemount(e.resume);
	return function() {
		r(), i(), a();
	};
}
function xt(e, t, n, r) {
	return t.run ? (n(), r?.(), t.run = null, !0) : !1;
}
//#endregion
//#region ../../packages/flask/flaskableListeners.ts
var St;
function Ct(...e) {
	if (St) return St(...e);
}
function wt(e) {
	St = e;
}
function Tt(e, t, n) {
	let { enroll: r, remove: i, pausable: a = !1 } = n, { once: o } = t;
	return (o ? dt : a ? gt : mt)({
		callback: e,
		enroll: r,
		remove: i,
		options: t,
		__DEV__asyncPath: it()
	});
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Effect.ts
var Et = class {
	run;
	phase;
	fn;
	constructor(e, t) {
		this.run = e, this.phase = t, this.fn = e;
	}
	link(e) {
		this.run = this.fn, e.link(this);
	}
	destroy() {
		this.unlink(), this.fn = null;
	}
	unlink() {
		this.run = null;
	}
};
//#endregion
//#region ../../packages/quarky/src/ion/Get.ts
function Dt(e) {
	if (!ge(e)) return !1;
	let t = _e(e);
	return "inert" in t && t.inert === !0;
}
//#endregion
//#region ../../packages/quarky/src/ion/utils.ts
function N(e) {
	return v(e) && C in e;
}
function P(e) {
	return v(e) && e.length === 0 ? e() : e;
}
function F(e) {
	return e instanceof Function && e.length === 0 !== N(e) && console.warn(e, "isGetter", !N(e), "isIon", N(e)), e instanceof Function && e.length === 0;
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Subject.ts
function Ot(e) {
	return "reactive" in e ? e.reactive : !1;
}
var kt = "--multisubject";
function At(e, t) {
	return Mt(e) ? new Nt(e, t) : jt(e, t);
}
function jt(e, t) {
	return dn(e) ? new Pt(e) : v(e) ? new It(e, t) : {
		reactive: !1,
		getState() {
			return e;
		},
		linkEffect(e) {}
	};
}
function Mt(e) {
	return y(e) && kt in e;
}
var Nt = class {
	asTraceable;
	subjects = [];
	reactive = !0;
	constructor(e, t) {
		let n = this.subjects;
		for (let r of e) {
			let e = jt(r, t);
			n.push(e);
		}
	}
	inertCount = 0;
	get = () => {
		this.get = () => {
			let e = [];
			for (let t of this.subjects) e.push(t.getState());
			return e;
		};
		let e = [];
		for (let t of this.subjects) e.push(t.getState()), t.reactive || this.inertCount++;
		return this.inertCount === this.subjects.length && (this.reactive = !1), e;
	};
	getState() {
		return this.get();
	}
	linkEffect(e) {
		let t = this.subjects;
		for (let n of t) n.reactive && n.linkEffect(e);
	}
}, Pt = class extends Ye {
	proxy;
	reactive = !0;
	asTraceable;
	constructor(e) {
		super(), this.proxy = e, this.track(_e(e)), this.trackAbsorbedIons();
	}
	getState() {
		return _e(this.proxy).state.get();
	}
	linkEffect(e) {
		this.forEachAtom((t) => {
			Lt(t, e);
		});
	}
	trackAbsorbedIons() {
		let e = this.proxy, t = _e(e).target, n = Reflect.ownKeys(t);
		for (let r of n) {
			let n = t[r];
			N(n) ? Ve(n) && this.track(_e(n)) : e[r];
		}
	}
}, Ft = class extends Ye {
	fn;
	retrack;
	warnNoAtoms;
	reactive = !0;
	asTraceable;
	constructor(e, t, n = !0) {
		super(), this.fn = e, this.retrack = t, this.warnNoAtoms = n;
	}
	call = () => (this.call = () => P(this.retrackedCall()), P(this.trackAtoms(this.fn)));
	trackedCall() {
		let e = this.call();
		return this.particles.length === 0 && (this.reactive = !1), e;
	}
	effect;
	retrackedCall() {
		if (!this.retrack || !this.reactive) return this.fn();
		let e = this.effect;
		if (!e) throw Error("Must call linkEffect before retracking");
		console.log("@&@ retrack call", this.fn), e.unlink(), this.untrackAtoms();
		let t = this.trackAtoms(this.fn);
		return this.forEachAtom((t) => {
			"key" in t && "modelQuark" in t && t.key === "completed" && console.log("@&@ link effect", t), Lt(t, e);
		}), t;
	}
	linkEffect(e) {
		this.effect = e, this.forEachAtom((t) => {
			Lt(t, e);
		});
	}
	trackAtoms(e) {
		Ge(this);
		try {
			return e();
		} finally {
			Ke();
		}
	}
}, It = class {
	retrack;
	get reactive() {
		return this.proxySubject ? this.subject.reactive || this.proxySubject.reactive : this.subject.reactive;
	}
	subject;
	proxySubject;
	asTraceable;
	get particles() {
		return this.subject.particles;
	}
	constructor(e, t = !0) {
		this.retrack = t;
		let n = ge(e) ? _e(e) : {};
		this.subject = n instanceof Ft ? n : new Ft(e, t, !1);
	}
	linkEffect(e) {
		this.reactive && this.subject.linkEffect(e), this.proxySubject?.linkEffect(e);
	}
	relinkProxy = () => {
		if (!this.retrack) {
			this.relinkProxy = m;
			return;
		}
		this.relinkProxy = () => {
			let e = this.subject.effect;
			e && this.proxySubject?.linkEffect(e);
		};
	};
	getState() {
		let e = this.subject.trackedCall();
		return e !== this.proxySubject?.getState() && dn(e) && (this.proxySubject = new Pt(e)), this.relinkProxy(), e;
	}
};
function Lt(e, t) {
	e && t.link(He(e));
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Watcher.ts
var Rt = class {
	previous;
	current;
	eager;
	constructor(e, t, n) {
		this.previous = e, this.current = t, this.eager = n;
	}
};
function zt(e, t, n = {}) {
	console.log("*** watching", e), n.retrack = n.retrack ?? !0;
	let r = At(e, n.retrack);
	if (r.asTraceable = new at(n?.devName ?? "watch" + e), !Ot(r)) return console.log("inert A"), n?.eager && Ht(() => t(new Rt(void 0, e, !0)), Bt(n)), Ut();
	let i = new $e(r.getState());
	if (!r.reactive) return n?.eager && (console.log("inert B"), Ht(() => t(new Rt(void 0, i.get(), !0)), Bt(n))), Ut();
	function a() {
		let e = r.getState();
		try {
			t(new Rt(i.get(), e, !!n.eager));
		} finally {
			n.eager = !1, i.set(e);
		}
	}
	return a.__DEV__fn = t, Vt(r, a, n);
}
function Bt(e) {
	return e?.phase ?? Oe();
}
function Vt(e, t, n) {
	let r = n.phase = Bt(n), i = n.eager ?? !1;
	return n.preserve, n?.["dev.traceTriggers"], Tt(t, n || {}, {
		enroll(n) {
			let a = new Et(n, r);
			return a.__DEV__fn = t.__DEV__fn, e.linkEffect(a), i && Ht(n, r), a;
		},
		remove(e) {
			e.destroy();
		},
		pausable: !0
	});
}
function Ht(e, t) {
	Ne() || Le();
	let n = De();
	n.scheduleTask(e, t), t === T && n.runEffects(T);
}
function Ut() {
	function e() {
		return !1;
	}
	return {
		stop: e,
		pause: e,
		resume: e
	};
}
function I(e, t, n = j(), r = !1) {
	let i = new It(() => P(e())), a = i.getState();
	if (!i.reactive && !r) return;
	let o = !1, s = !1, c = new Et(() => {
		if (s) {
			o = !0;
			return;
		}
		o = !1, u();
	}, w), l = r;
	function u() {
		let e = i.getState();
		t({
			current: e,
			previous: a,
			flask: n,
			eagerRun: l
		}), l = !1, a = e;
	}
	r && Ht(u, w), i.linkEffect(c), n?.onDiscard(() => {
		c.destroy();
	}), n?.onDemount(() => {
		s = !0;
	}), n?.onRemount(() => {
		s = !1, o && c.run?.();
	});
}
//#endregion
//#region ../../packages/quarky/src/ion/DerivationIon.ts
var Wt = class extends Ft {
	constructor(e, t, n) {
		super(e, t, n);
	}
	getState() {
		return this.trackedCall();
	}
	get inert() {
		return !this.reactive;
	}
}, Gt = Symbol("stale");
function Kt(e, t, n = !0) {
	let r = new $e(void 0), i = new $e(Gt), a = new Wt(() => e(r.get()), n, void 0), o = () => {
		let e = s();
		return a.linkEffect(new Et(() => {
			i.get() !== Gt && r.set(i.get()), i.set(Gt);
		}, T)), o = s, e;
	};
	function s() {
		return a.trackedCall();
	}
	function c() {
		return Je(a), i.get() === Gt ? i.set(o()) : i.get();
	}
	if (c["~ion"] = !0, c[C] = a, t) {
		let e = t["@set"], n = t["@get"];
		(e || n) && Object.defineProperty(c, "value", {
			set: e,
			get: n
		});
	}
	if (t) {
		let e = Object.getOwnPropertyDescriptors(t);
		delete e["@get"], delete e["@set"], delete e["@init"], Object.defineProperties(c, e);
	}
	return c;
}
//#endregion
//#region ../../packages/quarky/src/ion/AtomicIon.ts
var qt = class {
	state;
	asTrackedAtom;
	castGet;
	castSet;
	castInit;
	asTraceable;
	constructor(e, t) {
		this.state = e, this.castGet = t?.["@get"], this.castSet = t?.["@set"], this.castInit = t?.["@init"];
	}
	getState() {
		return this.state.get();
	}
};
function L(e, t) {
	let n = new qt(new $e(e), t), r = n.castGet ? Xt(Jt.bind(n), n.castGet) : function() {
		return Jt.apply(n);
	};
	if (r[C] = n, t) {
		let e = Object.getOwnPropertyDescriptors(t);
		delete e["@get"], delete e["@set"], delete e["@init"], Object.defineProperties(r, e);
	}
	return Object.defineProperty(r, "value", {
		get: r,
		set: n.castSet ? Zt(Yt.bind(n), n.castSet, () => n.state.get()) : Yt.bind(n)
	}), r;
}
function Jt() {
	return Je(this), this.state.get();
}
function Yt(e) {
	return this.state.set(e), k(this), e;
}
function Xt(e, t) {
	function n() {
		let n = e();
		return t(n), n;
	}
	return n.value = void 0, n[C] = void 0, n;
}
function Zt(e, t, n) {
	return function(r) {
		let i = n(), a = e(r);
		return t({
			value: r,
			previous: i
		}), a;
	};
}
//#endregion
//#region ../../packages/quarky/src/ionic/Pion.ts
function Qt(e, t, n = !1) {
	let r = e.castGet ? Xt(Jt.bind(e), e.castGet) : function() {
		return Jt.apply(e);
	}, i = e.castSet ? Zt(en.bind(e), e.castSet, () => e.state.get()) : en.bind(e), a = t ? $t(t, r, i) : [r, i];
	if (n) return a;
	let [o, s] = a;
	return o[C] = e, Object.defineProperty(o, "value", {
		get: o,
		set: s
	}), [o, s];
}
function $t(e, t, n) {
	let r = !0;
	function i() {
		let n = t();
		return r && y(n) ? e(n) : n;
	}
	i.value = void 0, i[C] = void 0;
	function a(e) {
		return r = !1, n(e);
	}
	return [i, a];
}
function en(e) {
	return Yt.apply(this, [e]), k(this.modelQuark), e;
}
var tn = class extends qt {
	modelQuark;
	key;
	constructor(e, t, n, r) {
		super(new $e(e), n), this.modelQuark = t, this.key = r;
	}
}, nn = class {
	modelQuark;
	op;
	key;
	asTraceable;
	asTrackedAtom;
	constructor(e, t, n) {
		this.modelQuark = e, this.op = t, this.key = n;
	}
	getState() {
		return this.modelQuark.getState()[this.op](this.key);
	}
};
function rn(e) {
	return typeof e == "symbol" ? e.description : typeof e == "object" ? JSON.stringify(e) : e.toString();
}
var an = class {
	modelQuark;
	tracked;
	constructor(e) {
		this.modelQuark = e, this.tracked = new Map([["[[in]]", /* @__PURE__ */ new Map()]]);
	}
	register(e, t, n) {
		let r = this.modelQuark.asTraceable;
		n.asTraceable = new at(r.name + " " + rn(e) + rn(t), r.origin);
		let i = this.tracked.get(e) ?? /* @__PURE__ */ new Map();
		return i instanceof Map ? (this.tracked.set(e, i), i.set(t, n), n) : (x.error(`${String(e)} is not an op`), n);
	}
	asTracked(e, t) {
		return this.getTracked(e, t) ?? this.register(e, t, new nn(this.modelQuark, e, t));
	}
	getTracked(e, t) {
		return this.getAllTracked(e)?.get(t);
	}
	getAllTracked(e) {
		let t = this.tracked.get(e);
		if (t instanceof Map) return t;
	}
};
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedArray.ts
pe(Array, {
	clone: (e) => [...e],
	"@initEach"(e, t, n, r) {
		t[r] = n(e);
	},
	"@getHookKey"(e) {
		return on(e) ? gn : e;
	}
}, {
	[Symbol.iterator]() {
		return this.trackModel(), z(this.ionic[Symbol.iterator]());
	},
	at(e) {
		return this.ionic.at(e);
	},
	concat(...e) {
		return z(this.ionic.concat(...e));
	},
	filter(e, t) {
		return z(this.ionic.filter(e, t));
	},
	map(e, t) {
		return z(this.ionic.map(e, t));
	},
	keys() {
		return this.track(hn, "ownKeys"), this.raw.keys();
	},
	slice(e, t) {
		return z(this.ionic.slice(e, t));
	},
	toSpliced(e, t, ...n) {
		return z(this.ionic.toSpliced(e, t, ...n));
	},
	toSorted(e) {
		return z(this.ionic.toSorted(e));
	},
	toReversed() {
		return z(this.ionic.toReversed());
	},
	with(e, t) {
		return z(this.ionic.with(e, t));
	}
});
function on(e) {
	if (typeof e == "symbol") return !1;
	let t = Number(e);
	if (isNaN(t)) return !1;
	if (Number.isInteger(t)) return !0;
}
//#endregion
//#region ../../packages/quarky/src/ionic/ModelQuark.ts
function R(e) {
	return !1;
}
var sn = class {
	target;
	extension;
	asTraceable;
	asTrackedAtom;
	proto;
	proxy;
	ops;
	constructor(e, t) {
		this.target = e, this.extension = t, this.proto = new Map([
			[C, {
				get: () => this,
				set: R
			}],
			["constructor", {
				get: () => e.constructor,
				set: R
			}],
			["isPrototypeOf", {
				get: this.GetBoundMethod(e.isPrototypeOf, e),
				set: R
			}]
		]), this.state = new et(e, this.getCloner()), this.ops = new an(this), this.initCollection();
	}
	getState() {
		return this.state.get();
	}
	getCloner() {
		let e = this.target;
		do {
			let t = fe(e.constructor)?.config.clone;
			if (t) return t;
			e = Object.getPrototypeOf(e);
		} while (e && e.constructor !== Object);
		return function(e) {
			return Object.assign(Object.create(Object.getPrototypeOf(e)), e);
		};
	}
	initCollection() {
		let e = this.extension;
		if (e && gn in e && e[gn]) {
			let t = e[gn], n = t["-as"];
			t instanceof Function && console.error("Failed to ionize nested items. Must pass ionizer in config object, e.g. { '-as': ionic } or use as() helper"), n && this.initEach(n), ("@get" in t || "@set" in t) && this.overrideGetHooks();
		}
	}
	overrideGetHooks() {
		let e = this.state.get();
		do {
			let t = fe(e.constructor)?.config["@getHookKey"];
			if (t) {
				this.getHooks = ((e) => {
					let n = this.extension;
					if (n) return n[e] ?? n[t(e)];
				});
				return;
			}
			e = Object.getPrototypeOf(e);
		} while (e && e.constructor !== Object);
	}
	getHooks = (e) => this.extension?.[e];
	initEach(e) {
		let t = this.state.get();
		do {
			let n = fe(t.constructor)?.config["@initEach"];
			if (n) {
				let t = this.state.get();
				if (!(Symbol.iterator in t)) return;
				let r = 0;
				for (let i of t) {
					let t = r++;
					this.state.mutateSync((r) => {
						n(i, r, e, t);
					});
				}
				this.state.commitUpdate();
				return;
			}
			t = Object.getPrototypeOf(t);
		} while (t && t.constructor !== Object);
	}
	$isExtensible;
	setIsExtensible;
	initIsExtensible() {
		if (this.$isExtensible) return;
		let e = this.target;
		[this.$isExtensible, this.setIsExtensible] = Qt(new tn(Object.isExtensible(e), this, void 0), void 0, !0);
	}
	initProperty(e) {
		if (!(e in this.state.get())) {
			let t = this.extension;
			return t && e in t ? this.initExtension(e, t[e]) : this.initNonProperty(e);
		}
		return this._initProperty(e);
	}
	initExtension(e, t) {
		return this.initExtensionMethod(e, t);
	}
	initExtensionMethod(e, t) {
		let n = {
			get: this.GetBoundMethod(t, this.proxy),
			set: R
		};
		return this.proto.set(e, n), n;
	}
	initNonProperty(e, t = !1) {
		if (!Object.isExtensible(this.target)) return {
			get: () => void 0,
			set: R
		};
		let n = cn(e) ? e.slice(1) : e, r = n === e ? typeof e == "string" ? "$" + e : void 0 : e;
		if (t || r && n in this.state.get()) return this.initPion(e, n, r, e === r ? this.state.get()[n] : void 0);
	}
	setNewProperty(e, t) {
		if (!Object.isExtensible(this.target) || v(t)) return { set: R };
		let n = this.state.mutate((n) => Reflect.set(n, e, t));
		return n ? (un(this, hn, "ownKeys"), un(this, "[[in]]", e), k(this), n && on(e) && Array.isArray(this.target) && (this.proxy.length = this.state.pending.length), this.proto.has(e) ? this.proto.get(e) : this.initNonProperty(e, !0)) : { set: R };
	}
	_initProperty(e) {
		let t = this.state.get();
		do {
			let n = Object.getOwnPropertyDescriptor(t, e);
			if (n) return this.initializeProperty(e, n, fe(t.constructor)?.def?.[e]);
			t = Object.getPrototypeOf(t);
		} while (t && t.constructor !== Object);
	}
	initializeProperty(e, t, n) {
		let r = cn(e) ? e.slice(1) : e, i = e === r && typeof e == "string" ? "$" + e : void 0;
		return "value" in t ? this.initValueProperty(e, r, i, t, n) : this.initDerivedProperty(e, r, e === r ? i : void 0, t, n);
	}
	initValueProperty(e, t, n, r, i) {
		let { value: a, writable: o } = r;
		return v(a) && e === n && a.length == 0 ? this.initAbsorbedIon(e, t, n, a, i) : v(a) ? this.initMethod(e, a, v(i) ? i : void 0) : e === t && o ? this.initPion(e, t, n, a) : this.initStaticProperty(e, a);
	}
	initPion(e, t, n, r) {
		let { proto: i, target: a } = this, o = this.getHooks(t), s = n && !(n in a), [c, l] = Qt(new tn(a[t], this, o, t), o?.["-as"], !s), u = {
			get: c,
			set: (e) => (l(e), !0)
		};
		i.set(t, u);
		let d = s ? {
			get: () => c,
			set: R
		} : void 0;
		return s && i.set(n, d), e === n ? d : u;
	}
	initStaticProperty(e, t) {
		let n = {
			get: () => t,
			set: R
		};
		return this.proto.set(e, n), n;
	}
	initDerivedProperty(e, t, n, r, i) {
		let { proto: a, extension: o, proxy: s, track: c, trackModel: l, trigger: u, triggerAll: d, triggerModel: f, state: p } = this, m = r.set, h = r.get ?? (() => void 0), g = m ? ((e) => (m(e), !0)) : R, _ = i?.get ? i.get.bind({
			config: o,
			get raw() {
				return p.get();
			},
			get ionic() {
				return { get [e]() {
					return h.apply(s);
				} };
			},
			track: c,
			trackModel: l
		}) : h.bind(s), v = i?.set ? i.set.bind({
			config: o,
			get raw() {
				return p.get();
			},
			get ionic() {
				return { set [e](e) {
					g.apply(s, [e]);
				} };
			},
			trigger: u,
			triggerModel: f,
			triggerAll: d
		}) : g.bind(s), y = this.getHooks(t) ?? {};
		y instanceof Function && console.error(`Failed to ionize nested object, ${t.toString()}. Must pass ionizer in config object, e.g. { '-as': ionic } or use as() helper`);
		let b = y["-as"], ee = y["@get"], x = y["@set"], te = ee ? Xt(_, ee) : _, S = x ? Zt(v, x, () => this.state.get()[t]) : v, [ne, re] = b ? $t(b, te, S) : [te, S], ie = {
			get: ne,
			set: re
		};
		a.set(t, ie);
		let ae = n ? {
			get: oe(ne, re),
			set: R
		} : void 0;
		n && a.set(n, ae);
		function oe(e, t) {
			let n = () => e();
			return Object.defineProperty(n, "value", {
				get: e,
				set: t
			}), () => n;
		}
		return e === n ? ae : ie;
	}
	initMethod(e, t, n) {
		let r = this.getHooks(e)?.["@call"], i = n ? this.CustomThis(e, t, n) : this.proxy, a = {
			get: r ? this.GetBoundMethodWithHook(e, n ?? t, i, r) : this.GetBoundMethod(n ?? t, i),
			set: R
		};
		return this.proto.set(e, a), a;
	}
	CustomThis(e, t, n) {
		let { state: r, proxy: i, track: a, trackModel: o, extension: s } = this;
		return {
			config: s,
			mutate: (e, t) => {
				let { trigger: n, triggerModel: r, triggerAll: i } = this, a = this.state.mutate(e);
				return t({
					output: a,
					op: {
						triggerModel: r,
						triggerAll: i,
						trigger: n
					}
				}), a;
			},
			get raw() {
				return r.get();
			},
			get ionic() {
				return { [e]: t.bind(i) };
			},
			track: a,
			trackModel: o
		};
	}
	GetBoundMethodWithHook(e, t, n, r) {
		let i = function(...e) {
			let i = t.apply(n, e);
			return r({
				input: e,
				output: i
			}), i;
		};
		return () => i;
	}
	GetBoundMethod(e, t) {
		let n = e.bind(t);
		return () => n;
	}
	initAbsorbedIon(e, t, n, r, i) {
		let { proto: a, proxy: o, target: s, extension: c, track: l, trackModel: u, trigger: d, triggerAll: f, triggerModel: p } = this, m = this.getHooks(t), h = "value" in r ? Object.getOwnPropertyDescriptor(r, "value")?.set ?? R : R, g = i?.get ? i.get.bind({
			config: c,
			get raw() {
				return v.get();
			},
			get ionic() {
				let t = Object.create(null);
				return Object.defineProperty(t, e, { get: r }), t;
			},
			track: l,
			trackModel: u
		}) : r, _ = i?.set ? i.set.bind({
			config: c,
			get raw() {
				return v.get();
			},
			get ionic() {
				let t = Object.create(null);
				return Object.defineProperty(t, e, { set: h }), t;
			},
			trigger: d,
			triggerModel: p,
			triggerAll: f
		}) : h, v = {
			get: m?.["@get"] ? Xt(r, m["@get"]) : g,
			set: m?.["@set"] ? Zt(_, m["@set"], r) : _
		};
		a.set(t, v);
		let y = {
			get: ge(r) ? () => s[n] : this.GetBoundMethod(r, o),
			set: R
		};
		return a.set(n, y), e === n ? y : v;
	}
	state;
	track = (e, t) => {
		ln(this, e, t);
	};
	trackModel = () => {
		Je(this);
	};
	trigger = (e, t) => {
		un(this, e, t);
	};
	triggerModel = () => {
		k(this);
	};
	triggerAll = (e) => {
		let t = this.ops.getAllTracked(e);
		if (t) for (let [e, n] of t) k(n);
	};
};
function cn(e) {
	return typeof e == "string" && /^\$[a-z]/.test(e);
}
function ln(e, t, n) {
	qe()?.track(e.ops.asTracked(t, n));
}
function un(e, t, n) {
	k(e.ops.getTracked(t, n));
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonicModel.ts
function dn(e) {
	return y(e) ? ge(e) && _e(e) instanceof sn : !1;
}
function fn(e, t) {
	let n = new sn(e, t), r = new Proxy(e, mn(n));
	return n.proxy = r, r;
}
var pn = "[[INTERNAL]]";
function mn(e) {
	return {
		get(t, n, r) {
			let i = e.proto;
			return i.has(n) ? i.get(n)?.get() : e.initProperty(n)?.get();
		},
		set(t, n, r, i) {
			let a = e.proto;
			if (!a.has(n) && !(n in e.state.get())) return !!e.setNewProperty(n, r)?.set(r);
			let o = a.has(n) ? a.get(n).set(r) : !!e.initProperty(n)?.set(r);
			return o && Le().atCommit(() => e.target[n] = e.state.pending[n] = r), o;
		},
		has(t, n) {
			return n === C ? !0 : (e.proto.has(n) || e.initProperty(n), ln(e, "[[in]]", n), e.proto.has(n));
		},
		getOwnPropertyDescriptor(t, n) {
			return e.proxy[n], Object.getOwnPropertyDescriptor(e.state.get(), n);
		},
		defineProperty(t, n, r) {
			return n in e.state.get() || !e.state.mutate((e) => Reflect.defineProperty(e, n, r)) ? !1 : (k(e), un(e, pn, "ownKeys"), un(e, "[[in]]", n), e.proto.get(n)?.set(r.value), !0);
		},
		deleteProperty(t, n) {
			if (!e.state.mutate((e) => Reflect.deleteProperty(e, n))) return !1;
			let r = e.proto;
			return r.has(n) && (r.get(n).set(void 0), Le().atCommit(() => {
				r.delete(n);
			})), k(e), un(e, pn, "ownKeys"), un(e, "[[in]]", n), !0;
		},
		ownKeys(t) {
			return ln(e, pn, "ownKeys"), Reflect.ownKeys(e.state.get());
		},
		getPrototypeOf(t) {
			return Reflect.getPrototypeOf(e.target);
		},
		setPrototypeOf() {
			return x.warn("[DISALLOWED] Cannot setPrototypeOf ionized model"), !1;
		},
		isExtensible(t) {
			return e.initIsExtensible(), e.$isExtensible();
		},
		preventExtensions(t) {
			return e.initIsExtensible(), e.setIsExtensible(!1);
		}
	};
}
//#endregion
//#region ../../packages/quarky/src/ionic/Ionic.ts
var hn = "[[INTERNAL]]", gn = Symbol("each"), _n = /* @__PURE__ */ new WeakMap();
function z(e, t) {
	if (dn(e) || !y(e)) return e;
	let n = _n.get(e);
	if (n) return n;
	let r = fn(e, t ?? {});
	return _n.set(e, r), r;
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedSet.ts
function vn() {
	pe(Set, {
		clone: (e) => new Set(e),
		"@initEach"(e, t, n) {
			t.delete(e), t.add(n(e));
		}
	}, {
		[Symbol.iterator]() {
			return this.trackModel(), z(this.raw[Symbol.iterator]());
		},
		forEach: B.forEach,
		keys: B.keys,
		values: B.values,
		entries: B.entries,
		difference(e) {
			return this.trackModel(), z(this.raw.difference(e));
		},
		union(e) {
			return this.trackModel(), z(this.raw.union(e));
		},
		intersection(e) {
			return this.trackModel(), z(this.raw.intersection(e));
		},
		symmetricDifference(e) {
			return this.trackModel(), z(this.raw.symmetricDifference(e));
		},
		isSubsetOf(e) {
			return this.trackModel(), this.raw.isSubsetOf(e);
		},
		isSupersetOf(e) {
			return this.trackModel(), this.raw.isSubsetOf(e);
		},
		isDisjointFrom(e) {
			return this.trackModel(), this.raw.isDisjointFrom(e);
		},
		add(e) {
			return this.raw.has(e) ? z(this.raw) : z(this.mutate((t) => t.add(e), ({ op: t }) => {
				t.trigger("has", e), t.trigger("[[get]]", "size"), t.triggerModel();
			}));
		},
		has: B.has,
		clear: B.clear,
		delete: B.delete,
		size: B.size
	});
}
var B = {
	forEach(e) {
		return this.trackModel(), this.raw.forEach(e);
	},
	keys() {
		return this.trackModel(), z(this.raw.keys());
	},
	values() {
		return this.trackModel(), z(this.raw.values());
	},
	entries() {
		return this.trackModel(), z(this.raw.entries());
	},
	has(e) {
		return this.track("has", e), this.raw.has(e);
	},
	clear() {
		this.raw.size !== 0 && this.mutate((e) => e.clear(), ({ op: e }) => {
			e.triggerModel(), e.triggerAll("has"), e.trigger("[[get]]", "size");
		});
	},
	delete(e) {
		return this.mutate((t) => t.delete(e), ({ output: t, op: n }) => {
			t && (n.triggerModel(), n.trigger("has", e), n.trigger("[[get]]", "size"));
		});
	},
	size: { get() {
		return this.track("[[get]]", "size"), this.raw.size;
	} }
};
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedMap.ts
function yn() {
	pe(Map, {
		clone: (e) => new Map(e),
		"@initEach"(e, t, n) {
			t.delete(e.key);
			let [r, i] = n(e);
			t.set(r, i);
		}
	}, {
		[Symbol.iterator]() {
			return this.trackModel(), z(this.raw[Symbol.iterator]());
		},
		forEach: B.forEach,
		keys: B.keys,
		values: B.values,
		entries: B.entries,
		set(e, t) {
			return z(this.mutate((n) => n.set(e, t), ({ op: t }) => {
				t.trigger("has", e), t.trigger("get", e), t.trigger("[[get]]", "size"), t.triggerModel();
			}));
		},
		get(e) {
			return this.track("get", e), this.raw.get(e);
		},
		has: B.has,
		clear() {
			this.raw.size !== 0 && this.mutate((e) => e.clear(), ({ op: e }) => {
				e.triggerModel(), e.triggerAll("has"), e.triggerAll("get"), e.trigger("[[get]]", "size");
			});
		},
		delete(e) {
			return this.mutate((t) => t.delete(e), ({ output: t, op: n }) => {
				t && (n.triggerModel(), n.trigger("has", e), n.trigger("get", e), n.trigger("[[get]]", "size"));
			});
		},
		size: B.size
	});
}
//#endregion
//#region ../../packages/quarky/src/ion/HybridIon.ts
function bn(e, t) {
	let { derive: n, initial: r, watch: i } = e, a = i ?? n, o = L("initial" in e ? r : n(void 0), t);
	return zt(a, ({ previous: e }) => {
		o.value = n(e);
	}, { phase: T }), o;
}
//#endregion
//#region ../../packages/quarky/src/async/Suspense.ts
var xn = Symbol("suspense quark");
function Sn(e, t) {
	e[xn].include(t);
}
function Cn(e) {
	return e[xn].quarkCount;
}
function wn(e) {
	let t = /* @__PURE__ */ new Set(), n, r, i = L(e), a = /* @__PURE__ */ new Set(), o = () => {
		for (let { $promise: e } of t) if (e()) return !0;
		return !1;
	}, s = performance.now();
	function c() {
		let e = performance.now() - s;
		console.log("Suspense: suspense took", e);
	}
	let l = L(null, {
		initial: !0,
		get oo() {
			return l();
		},
		await() {
			return l();
		},
		retry() {
			console.warn("NOT YET IMPLEMENTED");
		},
		get pendingState() {
			return i();
		},
		set pendingState(e) {
			i.value = e;
		},
		[xn]: {
			get $promise() {
				return l;
			},
			get quarkCount() {
				return t.size;
			},
			cancelIfFetching() {
				console.warn("group cancel if fetching");
				let e = !1;
				for (let { cancelIfFetching: n, $promise: r } of t) (e = n()) && a.delete(r());
				return e;
			},
			include(e) {
				if (t.has(e)) return;
				console.log("start suspense", e, t.size);
				let { $promise: i } = e;
				return i() && !l() && (console.log("Suspense: ++ new promise"), l.value = new Promise((e, t) => {
					n = e, r = t;
				}), s = performance.now()), t.add(e), j().onDiscard(() => {
					e.cancelIfFetching() && a.delete(i()), t.delete(e);
				}), zt(i, ({ current: e, previous: t, eager: i }) => {
					if (!i && e === t) {
						console.log("Suspense: same", e);
						return;
					}
					if (a.delete(t), e === null) {
						l() || console.warn("Suspense: should be impossible. $suspense is null while promise turned null", t), a.has(t) || console.warn("Suspense: previous not in pending promises", t), a.size === 0 && !o() && (n && (c(), n(), n = null, r = null), console.log("Suspense RESOLVED: Suspense to NULL :D", l.value), l.value = null, l.initial &&= !1);
						return;
					}
					a.add(e), l.initial &&= !1, l() || (s = performance.now(), console.log("Suspense: ++ new suspense promise"), l.value = new Promise((e, t) => {
						n = e, r = t;
					})), e.catch((t) => {
						if (a.delete(e), t === "cancelled") {
							console.log("Suspense: catch canceled; delete promise", a.size);
							return;
						}
						console.log("ERROR"), r &&= (r(t), n = null, null), l.value = null;
					});
				}, {
					phase: w,
					eager: !0
				}), this;
			}
		}
	});
	return l;
}
//#endregion
//#region ../../packages/quarky/src/async/AsyncIon.ts
var [Tn, En] = o("Suspense"), Dn = (e) => {
	En.push(e);
}, On = () => {
	En.pop(), Tn();
}, kn = Symbol("async quark");
function An(e) {
	return e instanceof Object && kn in e;
}
function jn(e) {
	return e instanceof Promise ? e : e instanceof Object && "asPromise" in e ? e.asPromise : e;
}
function Mn(e, t, n) {
	let r = v(e) ? e : v(t) ? t : () => {
		throw Error("fetch not provided");
	};
	return {
		fetch: r,
		initialState: e === r ? void 0 : e,
		options: e === r ? t : n
	};
}
globalThis.$$_createAsyncIon = Nn;
function Nn(e, t, n) {
	let { initialState: r, fetch: i, options: a } = Mn(e, t, n), o, s, c = L(!1), l = L(null), u = L(new Promise((e, t) => {
		o = e, s = t;
	}));
	performance.now();
	let d = a?.["-suspend"];
	d || u.value.catch((e) => {
		if (e !== "cancelled") throw e;
	});
	let f = L(r), p = d?.pendingState, m = {
		$promise: u,
		cancelIfFetching: y,
		$loaded: c,
		$error: l
	}, h = Kt(d && p !== void 0 ? () => d() ? p : f() : () => {
		let e = Tn();
		return e && Sn(e, m), f();
	}, {
		[kn]: m,
		get pending() {
			return u();
		},
		get loaded() {
			return c();
		},
		get asPromise() {
			return u();
		}
	}), g = null;
	function _() {
		return !!g;
	}
	function v() {
		console.warn("CANCEL FETCH"), b.add(g), g = null;
	}
	function y() {
		return _() ? (v(), !0) : !1;
	}
	let b = /* @__PURE__ */ new Set();
	return d && Sn(d, m), zt(i instanceof Promise ? () => i : i, ({ current: e }) => {
		let t = jn(e);
		t !== g && (y(), t instanceof Promise ? (g = t, o || (u.value = new Promise((e, t) => {
			o = e, s = t;
		}), d || u.value.catch((e) => {
			if (e !== "cancelled") throw e;
		})), t.then((e) => {
			if (b.has(t)) {
				console.warn("canceleld awaited", t), b.delete(t), s &&= (s("cancelled"), o = null, null);
				return;
			}
			g = null, o && (o(e), o = null, s = null), d?.() && p === void 0 ? d()?.then(() => {
				f.value = e;
			}) : f.value = e, u.value &&= null, c.value = !0;
		}).catch((e) => {
			if (g = null, s &&= (s(e), o = null, null), l.value = oe(e), u.value = null, c.value = !0, e !== "cancelled") throw e;
		})) : (console.log("*** no promise", o, u()), o && (o(e), o = null, s = null), l.value = null, u.value = null, f.value = e));
	}, {
		phase: w,
		eager: !0
	}), h;
}
//#endregion
//#region ../../packages/quarky/src/ion/Ion.ts
function Pn(e, t) {
	return Fn(e, t);
}
function Fn(e, t) {
	if (N(e) && !t) return e;
	if (v(e)) {
		if (t && "-writable" in t) {
			let n = t["-watch"];
			return delete t["-writable"], delete t["-watch"], bn({
				derive: e,
				watch: n
			}, t);
		}
		return Kt(e, t);
	}
	if (t && "-derive" in t) {
		let n = t["-derive"], r = t["-watch"];
		return delete t["-derive"], delete t["-watch"], bn({
			derive: n,
			initial: e,
			watch: r
		}, t);
	}
	if (t && "-fetch" in t) {
		let n = t["-fetch"];
		return t["-watch"], delete t["-fetch"], delete t["-watch"], Nn(e, n, t);
	}
	return L(e, t);
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedIterator.ts
me(Iterator, { clone: (e) => e }, { next() {
	return this.trackModel(), this.raw.next();
} });
//#endregion
//#region ../../packages/quarky/src/reactivity/IonicTask.ts
function In(e, t) {
	let n = t?.retrack === void 0 ? !0 : t.retrack, r = Bt(t), i = !0, a = new Ft(() => {
		try {
			e(i);
		} finally {
			i = !1;
		}
	}, n);
	return a.asTraceable = new at("ionic task:" + t?.devName), Tt(() => a.trackedCall(), t || {}, {
		enroll(e) {
			let t = new Et(e, r);
			return Ht(() => {
				e(), a.linkEffect(t);
			}, r), t;
		},
		remove(e) {
			e.destroy();
		}
	});
}
function Ln(e, t) {
	return In(e, {
		...t ?? {},
		phase: w
	});
}
function Rn(e, t) {
	return In(e, {
		...t ?? {},
		phase: T
	});
}
function zn(e, t) {
	return In(e, {
		...t ?? {},
		phase: be
	});
}
function Bn(e, t) {
	return In(e, {
		...t ?? {},
		phase: ye
	});
}
function Vn(e, t) {
	return In(e, {
		...t ?? {},
		phase: E
	});
}
Vn.atPrelude = Ln, Vn.atRender = zn, Vn.atLayout = Bn, Vn.sync = Rn;
//#endregion
//#region ../../packages/quarky/src/specialty/Finitron.ts
var [Hn, Un, Wn] = se();
vn(), yn();
//#endregion
//#region ../../packages/luent/src/component/x-Input.ts
function Gn(e) {
	if (!(N(e) && "value" in e)) throw Error("[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion or ionic proxy");
}
//#endregion
//#region ../../packages/luent/src/context/provide.ts
function Kn(e, t, n) {
	ce(e) && (Gn(t), n.muIons ? n.muIons.add(t) : n.muIons = new Set([t]));
}
//#endregion
//#region ../../packages/nextscript/src/component.ts
function qn(e) {
	return {
		get component() {},
		nodes: h(e ? Yn(e) : void 0)
	};
}
function Jn(e, t) {
	return {
		get component() {
			return e;
		},
		nodes: h(t ? Yn(t) : void 0)
	};
}
qn.as = function(e) {
	return function(t) {
		return Jn(e, t);
	};
};
function Yn(e) {
	let t = Array.isArray(e);
	if (t && e.length > 1) return e;
	let n = t ? e[0] : e;
	return Xn(n) ? n.component ? e : n.nodes : e;
}
function Xn(e) {
	return y(e) && "component" in e && "nodes" in e;
}
//#endregion
//#region ../../packages/nextscript/src/index.ts
function Zn(e) {
	return typeof e == "function" && e.length === 0;
}
var Qn = /* @__PURE__ */ new WeakMap(), $n = Symbol("postfix");
function er(e, t) {
	let n = Qn.get(e);
	return n ? (n[$n] = t, n) : (n = tr(e, t), Qn.set(e, n), n);
}
function tr(e, t) {
	let n = /* @__PURE__ */ new Map();
	return new Proxy(e, {
		get(e, i, a) {
			let o = Reflect.get(e, i, a);
			if (o == null) {
				if (t === "?") return o;
				if (t === "!") throw TypeError("Value must be non-null");
			}
			return Zn(o) ? o : n.get(i) ?? r(e, i, a);
		},
		set(e, n, r) {
			return n === $n ? (t = r, !0) : !1;
		}
	});
	function r(e, t, r) {
		let i = () => Reflect.get(e, t, r);
		return n.set(t, i), Object.defineProperty(i, "value", {
			get: i,
			set(n) {
				if (!Reflect.set(e, t, n, r)) throw TypeError(`Cannot set property ${String(t)} via accessor`);
			},
			enumerable: !1,
			configurable: !1
		}), i;
	}
}
var nr = er;
//#endregion
//#region ../../packages/luent/src/context/Context.ts
function rr({ Slot: e, provide: t }) {
	return e || x.warn("Extraneous <Context>"), component(ar(e, ir(t)));
}
function ir(e, t = d()) {
	if (!t) throw Error("no context found :( This should never happen");
	let [n, r] = sr(h(e));
	return {
		entries: n,
		parent: t,
		root: t?.root,
		ground: t?.ground,
		muIons: r
	};
}
function ar(e, t) {
	l(t);
	let n = e();
	return u(), Yn(n);
}
function or(e, t) {
	let n = ir(t);
	return (t) => ar(() => e(t), n);
}
function sr(e) {
	let t = { muIons: void 0 }, n = /* @__PURE__ */ new Map();
	for (let { 0: r, 1: i } of e) Kn(r, i, t), n.set(le(r), i);
	return [n, t.muIons];
}
//#endregion
//#region ../../packages/luent/src/node/NodeRef.ts
var cr = Symbol("internal");
function lr(e) {
	return e instanceof Object && cr in e;
}
function ur(e, t) {
	let n = e[cr];
	if (n.value) {
		console.warn("Node ref has already been assigned. A node ref can only be associated with a single dom node or component instance", n.value);
		return;
	}
	t && (console.log("initializing ref", t, P(t)), n.value = P(t), j()?.onDiscard(() => {
		n.value = void 0;
	}));
}
//#endregion
//#region ../../packages/luent/src/node/NodeRefs.ts
function dr(e, t, n) {
	let r = t;
	for (let t = 0; t < n.length; t++) {
		let i = P(n[t]), a = t === n.length - 1 ? void 0 : r[i] ?? (r[i] = []);
		fr(t === n.length - 1 ? e : a, r, n[t]), r = a;
	}
	j()?.onDiscard(() => {
		t.length = 0;
	});
}
function fr(e, t, n) {
	v(n) ? zt(n, ({ current: n }) => {
		n === -1 ? t.pop() : t[n] = e;
	}, {
		eager: !0,
		phase: w
	}) : t[n] = e;
}
//#endregion
//#region ../../packages/luent/src/flask/flask-hooks.ts
function pr(e) {
	M().onInitialMount(c(e));
}
function mr(e) {
	M().onRemount(c(e));
}
function hr(e) {
	M().onInitialMount(c(() => e(!0))), M().onRemount(c(() => e(!1)));
}
function gr(e) {
	let t = c(e);
	M().onInitialMount(() => {
		D(t);
	});
}
function _r(e) {
	let t = c(e);
	M().onRemount(() => {
		D(t);
	});
}
function vr(e) {
	let t = r();
	M().onInitialMount(() => {
		D(() => s(t, () => e(!0)));
	}), M().onRemount(() => {
		D(() => s(t, () => e(!1)));
	});
}
function yr(e) {
	let t = c(e);
	M().onInitialMount(() => {
		ke(t);
	});
}
function br(e) {
	let t = c(e);
	M().onRemount(() => {
		ke(t);
	});
}
function xr(e) {
	let t = r();
	M().onInitialMount(() => {
		ke(() => s(t, () => e(!0)));
	}), M().onRemount(() => {
		ke(() => s(t, () => e(!1)));
	});
}
function Sr(e) {
	M().onDiscard(c(e));
}
function Cr(e) {
	M().onDemount(c(e));
}
function wr(e) {
	M().onDiscard(c(() => e(!0))), M().onDemount(c(() => e(!1)));
}
function Tr(e) {
	let t = c(e);
	M().onDiscard(() => {
		D(t);
	});
}
function Er(e) {
	let t = c(e);
	M().onDemount(() => {
		D(t);
	});
}
function Dr(e) {
	let t = c(() => e(!0)), n = c(() => e(!1));
	M().onDiscard(() => {
		D(t);
	}), M().onDemount(() => {
		D(n);
	});
}
function Or(e) {
	let t = c(e);
	M().onDiscard(() => {
		D(t);
	});
}
function kr(e) {
	let t = c(e);
	M().onDemount(() => {
		D(t);
	});
}
function Ar(e) {
	let t = c(() => e(!0)), n = c(() => e(!1));
	M().onDiscard(() => {
		D(t);
	}), M().onDemount(() => {
		D(n);
	});
}
//#endregion
//#region ../../packages/luent/src/flask/template-hooks.ts
function jr(e, t) {
	for (let n in t) {
		let r = t[n];
		if (!v(r) && !Array.isArray(r)) continue;
		let i = h(r);
		switch (n) {
			case "pre:install":
				for (let t of i) v(t) && pr(() => t(P(e)));
				break;
			case "pre:mount":
				for (let t of i) v(t) && hr((n) => t(P(e), n));
				break;
			case "pre:remount":
				for (let t of i) v(t) && mr(() => t(P(e)));
				break;
			case "at:install":
				for (let t of i) v(t) && gr(() => t(P(e)));
				break;
			case "at:mount":
				for (let t of i) v(t) && vr((n) => t(P(e), n));
				break;
			case "at:remount":
				for (let t of i) v(t) && _r(() => t(P(e)));
				break;
			case "post:install":
				for (let t of i) v(t) && yr(() => t(P(e)));
				break;
			case "post:mount":
				for (let t of i) v(t) && xr((n) => t(P(e), n));
				break;
			case "post:remount":
				for (let t of i) v(t) && br(() => t(P(e)));
				break;
			case "pre:uninstall":
				for (let t of i) v(t) && Sr(() => t(P(e)));
				break;
			case "pre:unmount":
				for (let t of i) v(t) && wr((n) => t(P(e), n));
				break;
			case "pre:demount":
				for (let t of i) v(t) && Cr(() => t(P(e)));
				break;
			case "at:uninstall":
				for (let t of i) v(t) && Tr(() => t(P(e)));
				break;
			case "at:unmount":
				for (let t of i) v(t) && Dr((n) => t(P(e), n));
				break;
			case "at:demount":
				for (let t of i) v(t) && Er(() => t(P(e)));
				break;
			case "post:uninstall":
				for (let t of i) v(t) && Or(() => t(P(e)));
				break;
			case "post:unmount":
				for (let t of i) v(t) && Ar((n) => t(P(e), n));
				break;
			case "post:demount":
				for (let t of i) v(t) && kr(() => t(P(e)));
				break;
			default: x.error("invalid inline hook");
		}
	}
}
//#endregion
//#region ../../packages/luent/src/component/bindings.ts
var Mr = Symbol("mu"), Nr = Symbol("on"), Pr = Symbol("hooks");
function Fr(e) {
	let t = Object.create(null), n = t.xray = Object.create(null), r = Object.keys(e), i = e.Slot;
	for (let t of r) {
		if (t === "auto-bind") continue;
		let { namespace: n, key: r } = Ir(t);
		a(e, t, n, r);
	}
	e["auto-bind"] && (t["auto-bind"] = e["auto-bind"]);
	function a(e, r, a, o) {
		switch (a) {
			case "on":
				let s = t[Nr] ?? (t[Nr] = Object.create(null));
				s[o] = e[r];
				break;
			case "mu":
				let c = t.mu ??= Object.create(null), l = t[Mr] ?? (t[Mr] = Object.create(null)), u = e[r];
				u && (t[o] = l[o] = c[o] = u);
				break;
			case "at":
			case "pre":
			case "post":
				let d = t[Pr] ?? (t[Pr] = Object.create(null));
				d[r] = e[r];
				break;
			case "Slot":
				let f = e[r];
				f && (i[o] = f);
				break;
			case "xray":
				n[o] = Br(e[r]);
				break;
			case "xlmns":
			case void 0:
				t[o] = e[r];
				break;
			default:
				let p = t[a] ?? (t[a] = Object.create(null));
				p[o] = e[r];
				break;
		}
	}
	return t;
}
function Ir(e) {
	let t = e.split(":");
	if (t.length > 2) throw SyntaxError("attribute may not have more than one namespace");
	let n = t.length === 2, r = n ? t[1] : e;
	return {
		namespace: n ? t[0] : void 0,
		key: r
	};
}
function Lr(e) {
	let t = e.ref, n = e;
	for (; n;) n.ref && (t = n.ref), n = n["auto-bind"];
	return t;
}
function Rr(e) {
	let t, n = !1, r = e;
	for (; r;) {
		if (r[Pr]) {
			let e = r[Pr], i = Object.keys(e);
			t ??= Object.create(null);
			for (let r of i) e[r] && (n = !0, (t[r] ?? (t[r] = [])).push(e[r]));
		}
		r = r["auto-bind"];
	}
	return n ? t : void 0;
}
function zr(e) {
	let t = Object.create(null), n = Object.keys(e);
	for (let t of n) {
		if (t === "auto-bind") continue;
		let { namespace: n, key: r } = Ir(t);
		i(e, t, n, r);
	}
	e["auto-bind"] && r(e["auto-bind"]);
	function r(e) {
		let t = Object.keys(e);
		t.push(Mr, Pr, Nr);
		for (let n of t) if (!(n === "auto-bind" || n === "xray" || n === "Slot")) switch (n) {
			case Nr:
				let t = e[Nr];
				if (!t) break;
				let r = Object.keys(t);
				for (let e of r) i(t, e, "on", e);
				break;
			case Mr:
				let o = e[Mr];
				if (!o) break;
				let s = Object.keys(o);
				for (let e of s) i(s, e, "mu", e);
				break;
			case Pr:
				let c = e[Pr];
				if (!c) break;
				let l = Object.keys(c);
				for (let e of l) i(c, e, "hooks", e);
				break;
			default:
				a(e, n);
				break;
		}
		e["auto-bind"] && r(e["auto-bind"]);
	}
	function i(e, n, r, i) {
		switch (r) {
			case "on":
				if (!e[n]) break;
				let r = t.events ??= Object.create(null);
				(r[i] ?? (r[i] = [])).push(e[n]);
				break;
			case "mu":
				if (!e[n]) break;
				let o = t.mutables ??= Object.create(null);
				o[i] = e[n];
				break;
			case "at":
			case "pre":
			case "post":
			case "hooks":
				if (!e[n]) break;
				let s = t.hooks ??= Object.create(null);
				(s[n] ?? (s[n] = [])).push(e[n]), e[n] = void 0;
				break;
			case "Slot":
				let c = t.Slot ??= e.NamedSlot;
				c[i] = e[n];
				break;
			default:
				a(e, n);
				break;
		}
	}
	function a(e, n) {
		switch (n) {
			case "Slot":
				let r = t.slots ??= [];
				e.Slot && r.push(e.Slot);
				break;
			case "microclass":
				(t.microclasses ??= []).push(e.microclass);
				break;
			case "class":
				let i = t.classes ??= [];
				e.class instanceof Array ? t.classes = i.concat(e.class) : i.push(e.class);
				break;
			case "style":
				let a = t.styles ??= [];
				e.style instanceof Array ? t.styles = a.concat(e.style) : a.push(e.style);
				break;
			case "show-if":
				t.showIf = e["show-if"];
				break;
			default:
				let o = t.attributes ??= Object.create(null);
				o[n] = e[n];
				break;
		}
	}
	return t;
}
function Br(e) {
	return e(new Proxy({}, { get() {
		return (e) => ({
			as: void 0,
			nodes: [],
			setup: e
		});
	} })).setup;
}
//#endregion
//#region ../../packages/luent/src/utils/destructure.ts
function Vr(e) {
	return typeof e == "string" ? e.startsWith("$") : !1;
}
function Hr(e) {
	if (typeof e != "object") throw TypeError("target must be destructurable");
	return new Proxy(e, {
		get(e, t, n) {
			if (Vr(t)) {
				let n = t.slice(1);
				return n in e ? nr(e)[n] : () => void 0;
			}
			return Reflect.get(e, t, n);
		},
		set() {
			return !1;
		}
	});
}
//#endregion
//#region ../../packages/luent/src/component/Component.ts
function Ur(e, t) {
	let n = Fr(t), r = Rr(n), i = e(Hr(n));
	if (i instanceof Promise) throw Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup");
	let a = i.component;
	if (a) {
		let e = Lr(n);
		e && (y(e) && "arr" in e ? dr(a, e.arr, h(e.i)) : ur(e, a));
	}
	let o = Rr(n);
	if (r && a) {
		if (!o) throw Error("Cannot auto-bind hooks to nested element if component exposes a component node. Use x-ray to auto-bind hooks to nested elements.");
		jr(a, o);
	}
	return i;
}
//#endregion
//#region ../../packages/luent/src/node/VineNode.tsx
function Wr(e) {
	return y(e) && "remove" in e && "after" in e;
}
var Gr = class {
	parent;
	preceding;
	nodes;
	get precedingLeaf() {
		let e = this.preceding;
		return e ? "remove" in e ? e : e.tailLeaf : null;
	}
	get tail() {
		return this.nodes?.at(-1) ?? null;
	}
	get tailLeaf() {
		let e = this.tail;
		return e ? "remove" in e ? e : e.tailLeaf : this.precedingLeaf;
	}
};
function Kr(e) {
	return qr(h(e));
}
function qr(e, t = []) {
	console.log("jsxNodes", e);
	for (let n of e) if (Array.isArray(n)) qr(n, t);
	else if (Xn(n)) qr(n.nodes, t);
	else if (v(n)) {
		if (n.length !== 0) throw Error("render functions must have no parameters");
		t.push(new Yr(n));
	} else if (n == null || n === "") continue;
	else n instanceof Gr || Wr(n) ? t.push(n) : (console.log("### is text", n), t.push(Xr(n)));
	return t;
}
function Jr(e, t, n = null) {
	for (let r of e) r instanceof Gr && (r.parent = t, r.preceding = n, r.nodes && Jr(r.nodes, t, n)), n = r;
	return e;
}
var Yr = class extends Gr {
	$text;
	node;
	constructor(e) {
		super(), this.$text = e;
		let t = this.node = Xr(e());
		this.nodes = [t], I(e, ({ current: n, previous: r, flask: i }) => {
			D(() => {
				t.data = Zr(e());
			});
		});
	}
};
function Xr(e) {
	return document.createTextNode(Zr(e));
}
function Zr(e) {
	return e == null ? "" : e instanceof Object ? JSON.stringify(e) : e.toString();
}
function Qr(e, t, n) {
	t && t !== n ? t.after(e) : (console.log("PREPEND"), n?.prepend(e));
}
function $r(e, t) {
	for (let n of e) if (n instanceof Node) t.appendChild(n);
	else if (n instanceof Gr) {
		if (!n.nodes) continue;
		$r(n.nodes, t);
	} else x.error("[[INVALID INPUT]] Invalid node entity", n);
}
function ei(e) {
	ti(e, (e) => e.remove());
}
function ti(e, t) {
	let n = e.length;
	for (; n--;) {
		let r = e[n];
		if (ni(r)) t(r);
		else if ("nodes" in r) {
			let e = r.nodes;
			e && ti(e, t);
		} else x.error("[[INVALID INPUT]] Invalid node entity");
	}
}
function ni(e) {
	return e instanceof Node;
}
function ri(e, t, n) {
	return (r, ...i) => (n[A] = r, s(t, () => e(...i), n));
}
//#endregion
//#region ../../packages/luent/src/boundaries/Portal.ts
var ii;
function ai(e, t) {
	if (!v(t)) throw Error("Compiler failed to turn JSX into render function");
	let n = typeof e == "string" ? document.querySelector(e) : e;
	if (!n) throw Error("Portal destination not found. Please check value of \"to\" attribute.");
	let r = Kr(t());
	if (r[0] instanceof Gr) {
		let e = ii ??= /* @__PURE__ */ new Map(), t = e.get(n) ?? (e.set(n, document.createComment("portal")), e.get(n));
		r.unshift(t);
	}
	return Jr(r, n), M(), D(() => {
		$r(r, n);
	}), wr((e) => {
		D(() => {
			ei(r);
		});
	}), _r(() => {
		$r(r, n);
	}), new oi(r);
}
var oi = class extends Gr {
	nodes;
	constructor(e) {
		super(), this.nodes = e;
	}
}, si = !1;
function ci() {
	return si;
}
function li() {
	si = !1;
}
//#endregion
//#region ../../packages/luent/src/createRoot.ts
var ui;
function di() {
	return ui;
}
//#endregion
//#region ../../packages/luent/src/hydration/getElement.ts
var fi;
function pi() {
	let e = di(), t;
	if (fi ? ((t = fi.nextElementSibling) || (t = fi.parentElement)) && (fi = t) : (t = mi(e), fi = t), t === e) throw Error("Element is app root. This should never happen");
	if (!t) throw Error("No element... This should never happen");
	return t.parentElement === e && !t.nextElementSibling && (fi = void 0, li()), t;
}
function mi(e) {
	return e.firstChild ? mi(e) : e;
}
//#endregion
//#region ../../packages/luent/src/element/NSElement.ts
function hi(e, t) {
	return document.createElementNS(t, e);
}
function gi(e, t) {
	return _i[e] || t?.xmlns;
}
var _i = {
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML"
}, [vi, yi] = o("xmlns");
function bi(e, t) {
	try {
		return yi.push(t), e();
	} finally {
		yi.pop();
	}
}
//#endregion
//#region ../../packages/luent/src/iteratives/For.ts
var [xi, Si, Ci] = se();
function wi(e) {
	zt(Ci(), e, { phase: w });
}
//#endregion
//#region ../../packages/luent/src/transitions/transit.ts
function Ti(e, t) {
	wi(() => {
		let n = e.getBoundingClientRect();
		D(() => {
			Ei(e, n, e.getBoundingClientRect(), Qi(P(t)));
		});
	});
}
function Ei(e, t, n, r) {
	let i = t.top - n.top, a = t.left - n.left;
	(a || i) && (e.style.setProperty("transform", `translate(${a}px, ${i}px)`), requestAnimationFrame(() => {
		ve(() => {
			r.forEach((t) => e.classList.add(t)), e.style.setProperty("transform", "translate(0px, 0px)"), e.addEventListener("transitionend", () => {
				r.forEach((t) => e.classList.remove(t)), e.style.removeProperty("transform");
			}, { once: !0 });
		});
	}));
}
var Di;
function Oi() {
	return Di ??= new ki();
}
var ki = class {
	ports = /* @__PURE__ */ new Map();
	addPort(e) {
		this.ports.has(e) || (this.ports.set(e, /* @__PURE__ */ new Map()), M()?.outer?.onDiscard(() => {
			this.ports.delete(e);
		}));
	}
	sendToPort(e, t, n) {
		let r = this.ports.get(e);
		if (!r) throw Error("Port is missing, this should never happen");
		r?.set(t, n);
	}
	getFromPort(e, t) {
		return this.ports.get(e)?.get(t);
	}
	deleteFromPort(e, t) {
		this.ports.get(e)?.delete(t);
	}
};
function Ai(e, t, n) {
	let r = t.getBoundingClientRect();
	Oi().sendToPort(n, e, r), Ne()?.atComplete(() => {
		Oi().deleteFromPort(n, e);
	});
}
function ji(e, t, n, r) {
	let i = Oi().getFromPort(n, e);
	i && Ei(t, i, t.getBoundingClientRect(), r);
}
var Mi = Symbol("any port");
function Ni(e, t, n = Mi, r = "transition-position") {
	Oi().addPort(n), vr(() => {
		ji(t, e, n, Qi(P(r)));
	}), wr(() => {
		Ai(t, e, n);
	});
}
//#endregion
//#region ../../packages/luent/src/transitions/transitions.ts
var Pi = 50, Fi = /* @__PURE__ */ new Set(), [Ii, Li, Ri] = se(), zi;
function Bi() {
	return zi || (zi = "luent-animate-in", Gi("@keyframes luent-fade-in", "from { opacity: 0; } to { opacity: 1; }"), Gi("." + zi, "animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) luent-fade-in;")), zi;
}
var Vi;
function Hi() {
	return Vi || (Vi = "luent-animate-out", Gi("@keyframes luent-fade-out", "from { opacity: 1; } to { opacity: 0; }"), Gi("." + Vi, "animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) luent-fade-out; z-index: -1;")), Vi;
}
var Ui;
function Wi() {
	return Ui || (Ui = "luent-transition-position", Gi("." + Ui, "transition: transform 250ms ease-in-out;")), Ui;
}
function Gi(e, t) {
	let n = qi();
	n.insertRule(`${e} { ${t} }`, n.cssRules.length);
}
var Ki;
function qi() {
	if (Ki) return Ki;
	let e = document.styleSheets, t = e.length, n = document.createElement("style");
	document.head.appendChild(n);
	let r = e.item(t);
	if (!r) throw Error("no stylesheet at this index!");
	return Ki = r, r;
}
function Ji(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = Ri(), a = t["animate-in"] ?? n?.["animate-in"], o = a === !0 ? Bi() : a, s = t["animate-out"] ?? n?.["animate-out"], c = s === !0 ? Hi() : s, l = t["animate-load"] ?? n?.["animate-load"], u = l === !0 ? o : l, d = t["animate-item"] ?? n?.["animate-item"], f = t["transition-item"] ?? n?.["transition-item"], p = f === !0 || d === !0 ? Wi() : f, m = t["transit-key"], h = t["transit-class"] ?? m ? Wi() : void 0, g = t["transit-port"], _ = t["transition-in"] ?? n?.["transition-in"], v = t["transition-in-from"] ?? n?.["transition-in-from"], y = t["transition-out"] ?? n?.["transition-out"];
	if (t["transition-out-to"] ?? n?.["transition-out-to"], (o || _) && vr(() => {
		!l && i || Xi(e, (e) => {
			let t, n;
			return {
				cancel() {
					n();
				},
				start() {
					let n = 0;
					!i && a ? (n++, ra(e, Qi(P(o)), r)) : i && l && (n++, ra(e, Qi(P(u)), r)), _ && v && (n++, aa(e, Qi(P(v)), Qi(P(_)), r));
					function r() {
						n--, n === 0 && t();
					}
				},
				onEnd(e) {
					t = e;
				},
				onCancel(e) {
					n = e;
				}
			};
		}, r);
	}), c || y) {
		let t = M();
		wr(() => {
			Fi.add(t), Zi(e, (e) => {
				let n;
				return {
					start() {
						let r = 0;
						c && (r++, ia(e, Qi(P(c)), i)), y && (r++, oa(e, Qi(P(y)), i));
						function i() {
							r--, r === 0 && (t.emitDiscard(), Fi.delete(t), n());
						}
					},
					onEnd(e) {
						n = e;
					}
				};
			}, r);
		});
	}
	p && Ti(e, p), m && Ni(e, m, g, h);
}
function Yi(e, t) {
	e.style.setProperty("position", "absolute"), e.style.setProperty("top", t.top + "px"), e.style.setProperty("left", t.left + "px"), e.style.setProperty("width", t.width + "px"), e.style.setProperty("height", t.height + "px");
}
function Xi(e, t, n) {
	let r = t(e);
	n.add(r), r.start(), r.onEnd(() => {
		n.delete(r);
	}), r.onCancel(() => {
		n.delete(r);
	});
}
function Zi(e, t, n) {
	if (n?.size) for (let e of n) e.cancel(), n.delete(e);
	let r = e.getBoundingClientRect(), i = e.cloneNode(!0);
	e.after(i), Yi(i, r), i.style.removeProperty("visibility"), console.log("transition out clone", i.childNodes[0]), D(() => {
		let e = t(i);
		e.start(), e.onEnd(() => {
			i.remove();
		});
	});
}
function Qi(e) {
	let t = [];
	return e.split(" ").forEach((e) => {
		let n = e.trim();
		n && t.push(n);
	}), t;
}
function $i(e) {
	let t = e.trim();
	return t ? t.endsWith("ms") ? Number.parseFloat(t) || 0 : t.endsWith("s") ? (Number.parseFloat(t) || 0) * 1e3 : Number.parseFloat(t) || 0 : 0;
}
function ea(e, t) {
	let n = e.split(",").map((e) => $i(e)), r = t.split(",").map((e) => $i(e)), i = Math.max(n.length, r.length);
	if (i === 0) return 0;
	let a = 0;
	for (let e = 0; e < i; e++) {
		let t = (n[e % n.length] ?? 0) + (r[e % r.length] ?? 0);
		t > a && (a = t);
	}
	return a;
}
function ta(e, t) {
	let n = getComputedStyle(e), r = ea(n.animationDuration, n.animationDelay) + Pi, i = !1, a = () => {
		s();
	}, o = window.setTimeout(() => {
		s();
	}, r);
	function s() {
		i || (i = !0, window.clearTimeout(o), e.removeEventListener("animationend", a), t());
	}
	e.addEventListener("animationend", a, { once: !0 });
}
function na(e, t) {
	let n = getComputedStyle(e), r = ea(n.transitionDuration, n.transitionDelay) + Pi, i = !1, a = () => {
		s();
	}, o = window.setTimeout(() => {
		s();
	}, r);
	function s() {
		i || (i = !0, window.clearTimeout(o), e.removeEventListener("transitionend", a), t());
	}
	e.addEventListener("transitionend", a, { once: !0 });
}
function ra(e, t, n) {
	t.forEach((t) => e.classList.add(t)), ta(e, () => {
		t.forEach((t) => e.classList.remove(t)), n();
	});
}
function ia(e, t, n) {
	t.forEach((t) => e.classList.add(t)), ta(e, () => {
		t.forEach((t) => e.classList.remove(t)), n();
	});
}
function aa(e, t, n, r) {
	t.forEach((t) => e.classList.add(t)), requestAnimationFrame(() => {
		ve(() => {
			n.forEach((t) => e.classList.add(t)), t.forEach((t) => e.classList.remove(t)), na(e, () => {
				r();
			});
		});
	});
}
function oa(e, t, n) {
	requestAnimationFrame(() => {
		ve(() => {
			t.forEach((t) => e.classList.add(t)), na(e, () => {
				t.forEach((t) => e.classList.remove(t)), n();
			});
		});
	});
}
//#endregion
//#region ../../packages/luent/src/transitions/Transition.tsx
var sa;
function ca(e) {
	sa = e;
}
function la() {
	let e = sa;
	return sa = void 0, e;
}
ue();
//#endregion
//#region ../../packages/luent/src/node/InnerHTML.ts
function ua(e, t) {
	e = typeof e == "string" || F(e) ? {
		trusted: !1,
		html: e
	} : e;
	let { trusted: n, html: r } = e;
	F(r) ? I(r, () => {
		D(() => {
			da(r(), n, t);
		});
	}, M(), !0) : da(fa(r), n, t);
}
function da(e, t, n) {
	if (t) n.innerHTML = e;
	else if ("setHTML" in n) n.setHTML(e);
	else throw Error("html must be sanitized or marked trusted");
}
function fa(e) {
	return e == null ? "" : String(e);
}
//#endregion
//#region ../../packages/luent/src/element/attributes.ts
function pa(e, t, n = ma) {
	let r = M();
	for (let i in t) {
		if (i === "innerHTML") {
			ua(t.innerHTML, e);
			continue;
		}
		if (i === "Slot") continue;
		let a = i.startsWith("mu:") ? i.slice(3) : i, o = t[i];
		n(e, a, o, r);
	}
}
function ma(e, t, n, r) {
	if (!e) {
		console.warn("Node is missing. Cannot setAttribute.");
		return;
	}
	F(n) ? I(n, ({ current: r, previous: i }) => {
		D(() => {
			ha(e, t, P(n()));
		});
	}, r, !0) : ha(e, t, Ta(n));
}
function ha(e, t, n) {
	Ca(t) ? e[t] = n === "true" ? !0 : n === "false" ? !1 : !!n : e instanceof SVGElement || va(t) ? e.setAttribute(t, Ta(n) ?? "") : (t === "textContent" && console.log("$$$ SETTING TEXTCONTENT", n), e[ba(t)] = wa(t) ? ga(n) : Ta(n) ?? "");
}
function ga(e) {
	let t = typeof e;
	return t === "string" ? Number(e) : t === "number" ? e : void 0;
}
var _a = {
	role: !0,
	nonce: !0,
	crossorigin: !0,
	integrity: !0,
	"http-equiv": !0,
	content: !0,
	charset: !0,
	itemprop: !0,
	itemscope: !0,
	itemtype: !0,
	manifest: !0,
	part: !0
};
function va(e) {
	return e.startsWith("aria-") || e.startsWith("data-") ? !0 : e in _a;
}
var ya = {
	for: "htmlFor",
	accesskey: "accessKey",
	contenteditable: "contentEditable",
	tabindex: "tabIndex",
	spellcheck: "spellCheck",
	autocapitalize: "autoCapitalize",
	inputmode: "inputMode",
	readonly: "readOnly",
	maxlength: "maxLength",
	minlength: "minLength",
	formaction: "formAction",
	formenctype: "formEnctype",
	formmethod: "formMethod",
	formnovalidate: "formNoValidate",
	formtarget: "formTarget",
	colspan: "colSpan",
	rowspan: "rowSpan",
	usemap: "useMap",
	frameborder: "frameBorder",
	allowfullscreen: "allowFullscreen",
	scrolltop: "scrollTop",
	scrollleft: "scrollLeft"
};
function ba(e) {
	return ya[e] ?? e;
}
var xa = {
	async: !0,
	autofocus: !0,
	autoplay: !0,
	checked: !0,
	controls: !0,
	default: !0,
	defer: !0,
	disabled: !0,
	formnovalidate: !0,
	hidden: !0,
	inert: !0,
	ismap: !0,
	itemscope: !0,
	loop: !0,
	multiple: !0,
	muted: !0,
	nomodule: !0,
	novalidate: !0,
	open: !0,
	playsinline: !0,
	readonly: !0,
	required: !0,
	reversed: !0,
	selected: !0,
	truespeed: !0
}, Sa = {
	maxlength: !0,
	minlength: !0,
	tabindex: !0,
	size: !0,
	rows: !0,
	cols: !0,
	colspan: !0,
	rowspan: !0,
	width: !0,
	height: !0,
	min: !0,
	max: !0,
	low: !0,
	high: !0,
	optimum: !0
};
function Ca(e) {
	return e in xa;
}
function wa(e) {
	return e in Sa;
}
function Ta(e) {
	return console.log("value?.toString()", e), e?.toString() ?? "";
}
//#endregion
//#region ../../packages/luent/src/element/styles.ts
function Ea(e, t) {
	let n = M(), r = e.classList;
	console.log("classes", t);
	for (let e of t) F(e) ? I(e, ({ current: t, previous: i }) => {
		D(() => {
			i && Da(i, r), e() && Oa(e(), r, n);
		});
	}, n, !0) : e && Oa(e, r, n);
}
function Da(e, t) {
	if (b(e)) {
		let n = e && e.split(" ");
		if (n) for (let e of n) t.remove(e);
	} else if (y(e)) for (let n in e) e[n] && t.remove(n);
}
function Oa(e, t, n) {
	if (e) b(e) ? Aa(e, t) : y(e) && ka(e, t, n);
	else return;
}
function ka(e, t, n) {
	for (let r in e) {
		let i = e[r];
		F(i) ? I(i, ({ current: e, previous: n }) => {
			D(() => {
				i() ? t.add(r) : n && t.remove(r);
			});
		}, n, !0) : i ? t.add(r) : t.remove(r);
	}
}
function Aa(e, t) {
	let n = e.split(" ");
	for (let e of n) e && t.add(e);
}
function ja(e, t) {
	let n = e.style.display;
	I(t, ({ flask: t, current: r, previous: i, eagerRun: a }) => {
		!a && r === i || (r ? D(() => {
			n ? e.style.display = n : e.style.removeProperty("display");
		}) : (n = e.style.display, D(() => {
			e.style.display = "none";
		})));
	}, M(), !0);
}
function Ma(e, t) {
	let n = M(), r = e.style;
	for (let e of t) F(e) ? I(e, ({ current: t, previous: i }) => {
		D(() => {
			Na(r, e(), n);
		});
	}, n, !0) : Na(r, e, n);
}
function Na(e, t, n) {
	if (t instanceof Object) for (let r in t) {
		let i = t[r];
		F(i) ? I(i, () => {
			console.log("style entry", r, i), D(() => {
				Fa(e, Pa(r), i());
			});
		}, n, !0) : Fa(e, Pa(r), i);
	}
	else typeof t == "string" && (e.cssText = e.cssText + "; " + Ia(t));
}
function Pa(e) {
	return e.startsWith("$") ? e.slice(1) : e;
}
function Fa(e, t, n) {
	let r = _(t);
	if (n != null) {
		let t = typeof n == "string" ? n.split(" !importan") : void 0, i = String(t ? t[0] : n);
		t === void 0 || t.length === 1 ? e.setProperty(r, i) : e.setProperty(r, i, { priority: "important" });
	} else e.removeProperty(r);
}
function Ia(e) {
	return e.trim(), e.endsWith(";") ? e.substring(0, e.length - 1) : e;
}
//#endregion
//#region ../../packages/luent/src/events/target.ts
function La(...e) {
	let t = this.target;
	for (let n of e) if (typeof n == "string") {
		if (Ra(t, n)) return !0;
	} else if (v(n) && n(t)) return !0;
	return !1;
}
function Ra(e, t) {
	if (t.startsWith(".")) return e.classList.contains(t);
	if (t.startsWith("#")) return e.id === t;
	if (t.startsWith("style.")) {
		let [n, r] = t.slice(6).split(":");
		return e.style[n] === r;
	} else if (!t.startsWith("x-")) return e.tagName.toLowerCase() === t;
	return !1;
}
//#endregion
//#region ../../packages/luent/src/element/events.ts
function za(e, t, n) {
	for (let r in t) {
		if (r === "event") {
			let r = t.event;
			for (let t in r) Ba(e, r, t, n);
			continue;
		}
		Ba(e, t, r, n);
	}
}
function Ba(e, t, n, r) {
	let i = h(t[n]);
	for (let t of i) Tt(Va(t, n), r ? (r.preserve = !0, r) : { preserve: !0 }, {
		enroll: (t) => {
			e.addEventListener(n, t, r);
		},
		remove: (t) => {
			e.removeEventListener(n, t, r);
		}
	});
}
function Va(e, t) {
	let n = Ha(t) ?? O;
	return (t) => n(() => {
		t.from = La, e(t);
	});
}
function Ha(e) {
	return Ua[e];
}
var V = ze, Ua = {
	event: O,
	click: O,
	dblclick: O,
	mousedown: O,
	mouseup: O,
	contextmenu: O,
	mouseover: V,
	mousemove: V,
	mouseout: V,
	mouseenter: V,
	mouseleave: V,
	keydown: O,
	keyup: O,
	focus: O,
	blur: O,
	focusin: O,
	focusout: O,
	beforeinput: ze,
	input: ze,
	change: O,
	submit: O,
	reset: O,
	select: O,
	invalid: O,
	drag: V,
	dragstart: O,
	dragend: O,
	dragenter: V,
	dragover: V,
	dragleave: V,
	drop: O,
	copy: O,
	cut: O,
	paste: O,
	abort: O,
	canplay: O,
	canplaythrough: O,
	durationchange: O,
	ended: O,
	error: O,
	loadeddata: O,
	loadedmetadata: O,
	loadstart: O,
	pause: O,
	play: O,
	playing: O,
	progress: O,
	ratechange: O,
	seeked: O,
	seeking: O,
	stalled: O,
	suspend: O,
	timeupdate: O,
	volumechange: O,
	waiting: O,
	load: O,
	resize: V,
	scroll: V,
	scrollend: V,
	wheel: V,
	touchstart: O,
	touchend: O,
	touchcancel: O,
	touchmove: O,
	pointerdown: O,
	pointerup: O,
	pointermove: V,
	pointerover: V,
	pointerout: V,
	pointerenter: V,
	pointerleave: V,
	gotpointercapture: O,
	lostpointercapture: O,
	pointercancel: O,
	animationstart: ze,
	animationend: ze,
	animationiteration: ze,
	transitionend: ze
};
//#endregion
//#region ../../packages/luent/src/element/mutables.ts
function Wa(e) {
	return N(e) && "value" in e;
}
function Ga(e, t) {
	switch (e.tagName) {
		case "INPUT": Ya(e, t);
		case "SELECT": Xa(e, t);
		case "TEXTAREA": return Ja(e, t);
	}
}
function Ka(e, t) {
	if (!("mu:checked" in t)) return;
	let n = t["mu:checked"];
	console.log("checkbox input", n), delete t["mu:checked"], t.checked = n, F(n) && Za(e, n, "checked");
}
function qa(e, t) {
	if (!("mu:checked" in t)) return;
	let n = t["mu:checked"];
	console.log("radio");
	let r = t.value;
	delete t["mu:checked"], t.checked = () => n() === r, F(n) && Za(e, n);
}
function Ja(e, t) {
	if (!("mu:value" in t)) return;
	let n = t["mu:value"];
	delete t["mu:value"], t.value = n, F(n) && Za(e, n);
}
function Ya(e, t) {
	switch (t.type) {
		case "radio":
			qa(e, t);
			break;
		case "checkbox":
			Ka(e, t);
			break;
		default:
			Ja(e, t);
			break;
	}
}
function Xa(e, t) {
	if (!("mu:value" in t)) return;
	let n = t["mu:value"];
	I(n, () => {
		D(() => {
			ve(() => {
				e.value = Ta(P(n));
			});
		});
	}, M(), !0), delete t["mu:value"], F(n) && e.addEventListener("change", (e) => {
		O(() => {
			Qa(n, e);
		});
	});
}
function Za(e, t, n = "value") {
	e.addEventListener("input", (e) => {
		Qa(t, e, n);
	});
}
function Qa(e, t, n = "value") {
	if ("value" in e) e.value = t.currentTarget?.[n], console.log("@&@ e.currentTarget?.[key]", n, t.currentTarget?.[n]);
	else {
		let r = e();
		if (Wa(r)) r.value = t.currentTarget?.[n];
		else throw Error("invalid two-way binding");
	}
}
//#endregion
//#region ../../packages/luent/src/element/makeElement.ts
function $a(e, t, n) {
	console.log("@@@before compose bindings", n);
	let { showIf: r, events: i, attributes: a, styles: o, classes: s, microclasses: c, hooks: l, transitions: u, mutables: d } = zr(n);
	console.log("showIf", r);
	let f, p = (f = gi(e, a)) || vi(), m = ci() ? pi() : p ? hi(e, p) : document.createElement(e), g = Lr(n);
	if (g) if (Array.isArray(g)) dr(m, g[0], h(g[1]));
	else {
		if (!lr(g)) throw Error("INVALID INPUT: Must use NodeRef or NodeRefs as ref");
		ur(g, m);
	}
	s && Ea(m, s), o && Ma(m, o), r && ja(m, r), i && za(m, i), l && jr(m, l), d && Ga(m, d), a && pa(m, a);
	let _ = la();
	return u && Ji(m, u, _), t && bi(() => {
		let e = Kr(h(t()));
		Jr(e, m), $r(e, m);
	}, f || (e === "foreignObject" ? void 0 : p)), ca(_), m;
}
//#endregion
//#region ../../packages/luent/src/node/makeJSXNode.ts
var eo = void 0, to = void 0;
function no() {
	return eo;
}
function ro() {
	eo = void 0;
}
function io(e, t) {
	return () => {
		to = eo, eo = e;
		try {
			return t();
		} finally {
			eo = to, to = void 0;
		}
	};
}
function ao(e) {
	return e instanceof Function ? e : function() {
		return e;
	};
}
function oo(e, t) {
	let { provide: n, await: r, meanwhile: i, catch: a } = t;
	return e = n ? or(e, n) : e, e();
}
function so(e, t, n) {
	switch (e) {
		case "o-link": return ai(n["portal-to"] ?? "head", () => $a("link", void 0, n));
		case "o--body": return ai("body", t);
		case "o--head": return ai("body", t);
		case "o--portal": return ai(n.to, t);
		case "create-view":
			if (!t) throw Error("Extraneous <create-view>");
			return oo(io("create", t), n);
		case "show-view":
			if (!t) throw Error("Extraneous <show-view>");
			return oo(io("show", t), n);
		case "remount-view":
			if (!t) throw Error("Extraneous <remount-view>");
			return oo(io("remount", t), n);
		case "render-view":
			if (!t) throw Error("Extraneous <render-view>");
			return oo(t, n);
		default: return typeof e == "string" ? $a(e, t, n) : Ur(e, n);
	}
}
//#endregion
//#region ../../packages/luent/src/conditional/IfElse.ts
function co(e, t, n, r, i, a, o) {
	let s;
	return {
		pending: a,
		nodes: null,
		flask: void 0,
		statementType: e,
		render: ri((...e) => {
			try {
				return ca(o), n(...e);
			} finally {
				ca(void 0);
			}
		}, r, {
			[A]: void 0,
			[tt]: ""
		}),
		type: t,
		$condition: i,
		get cache() {
			return s;
		},
		set cache(e) {
			s = e;
		},
		view: { markDiscard() {
			console.log("@$@ marking discard"), s = void 0;
		} }
	};
}
function lo(e, t = "create", n) {
	let i = r(), a = [];
	for (let r of e) {
		if (!r) continue;
		let { $condition: e, render: o, statementType: s, type: c = t, pending: l } = r;
		a.push(co(s, c, o, i, e, l, n));
	}
	return a;
}
var uo = class extends Gr {
	kits;
	outerFlask;
	$activeIndex;
	constructor(e, t) {
		super(), this.kits = e, this.outerFlask = t, this.$activeIndex = po(fo(e));
		try {
			Ii(!0), this.activateConditional(this.kits[this.$activeIndex()], (e) => {
				e.flask.emitInitialMount();
			});
		} finally {
			Li(), I(this.$activeIndex, ({ previous: e }) => {
				if (console.log("@@@ index changed!", this.$activeIndex(), e), this.$activeIndex() === e) return;
				let t = this.kits[this.$activeIndex()], n = this.pendingDeactivatedKit ?? this.kits[e];
				console.log("switch?"), this.pendingSwitch &&= (console.log(">>> CANCEL PROMISE"), this.cancelledPendingSwitch.add(this.pendingSwitch), null), t.pending ? (console.log("await pending switch"), this.awaitPendingConditional(t.pending, t, n)) : (console.log("@@@ switch!"), this.deactivateConditional(n), this.reactivateConditional(t));
			});
		}
	}
	cancelledPendingSwitch = /* @__PURE__ */ new Set();
	_pendingSwitchID = 0;
	pendingSwitch = null;
	pendingDeactivatedKit = null;
	awaitPendingConditional(e, t, n) {
		if (t.cache) {
			let r = e();
			if (r) {
				console.log("### D promise...");
				let e = this.pendingSwitch = ++this._pendingSwitchID;
				this.pendingDeactivatedKit = n, r.then(() => {
					if (this.cancelledPendingSwitch.has(e)) {
						console.log(">>> (canceled) D"), this.cancelledPendingSwitch.delete(e);
						return;
					}
					this.pendingSwitch = null, console.log("### D promise switch", n === t), n !== t && this.deactivateConditional(n), this.reactivateConditional(t);
				});
			} else console.log("### E switch"), n !== t && this.deactivateConditional(n), this.reactivateConditional(t);
		} else {
			let r = Cn(e);
			t.flask = this.outerFlask.spawn({
				type: "view",
				creationScope: t.type === "create"
			});
			let i = t.render(t.flask, t.view);
			if (Cn(e) > r) {
				t.awaitCache = i;
				let r = e();
				if (r) {
					console.log("### B promise...", n && n.nodes ? [...n.nodes] : n.nodes);
					let e = this.pendingSwitch = ++this._pendingSwitchID;
					this.pendingDeactivatedKit = n, r.then(() => {
						if (this.cancelledPendingSwitch.has(e)) {
							console.log(">>> (canceled) B"), this.cancelledPendingSwitch.delete(e);
							return;
						}
						this.pendingSwitch = null, console.log("### B promise switch"), n !== t && this.deactivateConditional(n), this.reactivateConditional(t);
					});
				} else zt(e, ({ current: e }) => {
					if (e) {
						console.log("### A promise...", n && n.nodes ? [...n.nodes] : n.nodes);
						let r = this.pendingSwitch = ++this._pendingSwitchID;
						this.pendingDeactivatedKit = n, e.then(() => {
							if (this.cancelledPendingSwitch.has(r)) {
								console.log(">>> (canceled) A"), this.cancelledPendingSwitch.delete(r);
								return;
							}
							this.pendingSwitch = null, console.log("### A promise switch"), n !== t && this.deactivateConditional(n), this.reactivateConditional(t);
						});
					}
				}, {
					phase: w,
					once: !0
				});
			} else e.value = null, console.log("### C switch"), t.awaitCache = i, n !== t && this.deactivateConditional(n), this.reactivateConditional(t);
		}
	}
	reactivateConditional(e) {
		this.activateConditional(e, (e, t) => {
			Jr(e.nodes, this.parent, this.preceding);
			let n = new DocumentFragment();
			$r(e.nodes, n), D(() => {
				Qr(n, this.precedingLeaf, this.parent);
			}), t ? e.flask.emitInitialMount() : e.flask.emitRemount();
		});
	}
	activateConditional(e, t) {
		if (!e) return;
		let n = !e.cache, r = e.flask ??= this.outerFlask.spawn({
			type: "view",
			creationScope: e.type === "create"
		});
		e.nodes = this.nodes = e.type === "remount" ? e.cache ??= Kr(e.awaitCache ? e.awaitCache : e.render(r, e.view)) : Kr(e.awaitCache ? e.awaitCache : e.render(r, e.view)), e.awaitCache = void 0, t(e, n);
	}
	deactivateConditional(e) {
		if (!e) return;
		let t = e.nodes;
		if (this.pendingDeactivatedKit = null, t) return e.nodes = null, e.cache ? e.flask.emitDemount() : (e.flask.emitDiscard(), e.flask = void 0), D(() => {
			ei(t);
		}), e;
	}
};
function fo(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e[n], i = r.$condition;
		i && t.push(i), !(n === 0 && r.statementType !== "if" || n !== 0 && r.statementType === "if") && "statementType" in r && n !== e.length - 1 && r.statementType;
	}
	return t;
}
function po(e) {
	return Kt(() => {
		for (let t = 0; t < e.length; t++) {
			let n = e[t];
			if (n()) return t;
		}
		return e.length;
	});
}
var mo = /* @__PURE__ */ new WeakMap();
function ho(e) {
	ti(e, (e) => {
		e instanceof CharacterData ? (mo.set(e, e.data), e.data = "") : (e instanceof HTMLElement || e instanceof SVGAElement || e instanceof MathMLElement) && (mo.set(e, e.style.display), e.style.display = "none");
	});
}
function go(e) {
	ti(e, (e) => {
		if (e instanceof CharacterData) {
			let t = mo.get(e);
			if (t === void 0) throw Error("previous text info missing");
			e.data = t;
		} else if (e instanceof HTMLElement || e instanceof SVGAElement || e instanceof MathMLElement) {
			let t = mo.get(e);
			t === void 0 ? e.style.removeProperty("display") : e.style.display = t;
		} else console.warn(`Unhandled node type ${e}`);
	});
}
function _o(e) {
	M();
	let t = po(fo(e)), n = [];
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = Kr(i.render(i.$condition));
		t() === r ? go(a) : ho(a), n.push(a);
		let o = Kt(() => t() === r);
		I(o, ({ current: e, previous: t, flask: n }) => {
			e !== t && (o() ? D(() => {
				go(a);
			}) : t && D(() => {
				ho(a);
			}));
		});
	}
	return n;
}
//#endregion
//#region ../../packages/luent/src/conditional/If.ts
function vo(e, t, n) {
	let [r, i, a] = xo(t, n);
	return {
		statementType: "if",
		render: r,
		type: i,
		pending: Tn(),
		$condition: e
	};
}
function yo(e, t, n) {
	let [r, i, a] = xo(t, n);
	return {
		statementType: "elseIf",
		render: r,
		type: i,
		pending: Tn(),
		$condition: e
	};
}
function bo(e, t) {
	let [n, r, i] = xo(e, t);
	return {
		statementType: "else",
		render: n,
		type: r,
		pending: Tn(),
		$condition: void 0
	};
}
function xo(e, t) {
	return [
		ao(t || e),
		t && typeof e == "string" ? e : void 0,
		t && v(e) ? e : void 0
	];
}
function So(e, t) {
	let n = e[0].$condition;
	if (!F(n) || Dt(n)) return Co(e);
	let r = t ?? no();
	if (ro(), r === "show") return _o(e);
	let i = la();
	try {
		return e.at(-1)?.statementType !== "else" && e.push(bo(() => void 0)), new uo(lo(e, r, i), M());
	} finally {
		ca(i);
	}
}
globalThis._$$IfSeries = So;
function Co(e) {
	for (let t of e) if (P(t.$condition)) return t.render();
}
//#endregion
//#region ../../packages/luent/src/boundaries/Await.ts
function wo(...e) {
	let t = e.at(-1);
	if (!v(t) || N(t)) throw Error("INVALID Render function");
	let n = e.at(-2), r = n instanceof Object && xn in n ? n : wn(), i = a(r, e, t);
	function a(e, t, n) {
		let r, i = h(t);
		i.length === 0 && i.push(!0);
		for (let t of i) if (t === e) continue;
		else if (t === n) try {
			Dn(e), r = n(e);
		} finally {
			On();
		}
		else An(t) ? e[xn].include(t[kn]) : t instanceof Promise && e[xn].include(Nn(() => t)[kn]);
		return () => r;
	}
	return {
		$suspense: r,
		renderResolved: i
	};
}
function To(e, t) {
	let n = t ? e.timeout : void 0;
	return {
		renderPlaceholder: t || e,
		timeout: n
	};
}
function Eo(e) {
	let { $suspense: t, renderResolved: n } = e[0], r = e[1], i = e[2];
	return {
		$suspense: t,
		renderResolved: n,
		renderPlaceholder: r && "renderPlaceholder" in r ? t ? Do(r.renderPlaceholder, t) : r.renderPlaceholder : (() => void 0),
		renderError: r && "renderError" in r ? r.renderError : i?.renderError ?? (() => void 0),
		timeout: r && "timeout" in r ? r.timeout : void 0
	};
}
function Do(e, t) {
	return () => {
		try {
			return Dn(t), e(t);
		} finally {
			On();
		}
	};
}
function Oo(e) {
	let { renderError: t, renderPlaceholder: n, renderResolved: r, $suspense: i, timeout: a } = Eo(e), o = L(void 0), s = L(!1);
	function c() {
		let e = !!i();
		u = n(), s.value = e && !l();
	}
	zt(i, () => {
		s() !== !!i() && c();
	}, {
		phase: w,
		eager: !0
	});
	function l() {
		return u = n(), u === !1 || u === !0 ? (console.log("*** C1"), !0) : Array.isArray(u) ? u.length > 1 ? (console.log("*** C2"), !1) : (console.log("*** C3"), u[0] === !1) : (console.log("*** C4"), !0);
	}
	let u = n();
	return So([
		vo(s, () => u),
		yo(o, () => t(o())),
		bo("remount", r)
	]);
}
globalThis._$$AwaitSeries = Oo, p(11);
//#endregion
//#region ../../packages/luent/src/conditional/MatchCase.ts
function ko(e, t) {
	let n = no(), i = t ?? n === "show" ? "remount" : n ?? "create", a = /* @__PURE__ */ new Map(), o = r(), s = Tn();
	console.log("awaiting??", s);
	let c;
	for (let t of e) {
		let { case: e, render: n, type: r } = t;
		c && !c.render ? n && (c.render = ri(n, o, {
			[A]: void 0,
			[tt]: ""
		}), c.type = r ?? i) : c = jo(r ?? i, n, o, s), a.set(e, c), c.render && (c = void 0);
	}
	return a;
}
var Ao = Symbol("default");
function jo(e, t, n, r) {
	return {
		pending: r,
		nodes: null,
		flask: void 0,
		render: t ? ri(t, n, {
			[A]: void 0,
			[tt]: ""
		}) : void 0,
		type: e,
		cache: void 0,
		awaitCache: void 0,
		view: { markDiscard: () => {
			console.log("@$@ noop");
		} }
	};
}
var Mo = class extends Gr {
	cases;
	getKit(e, t) {
		let n = this.cases.get(e) ?? this.cases.get(Ao);
		if (n) {
			if (n.type === "create") return n;
			if (n.type === "remount") return (this.cached ??= /* @__PURE__ */ new Map()).get(t) ?? this.createCachedKit(t, n);
		}
	}
	createCachedKit(e, t) {
		let n, r = {
			...t,
			get cache() {
				return n;
			},
			set cache(e) {
				n = e;
			},
			view: { markDiscard() {
				console.log("@$@ markDiscard"), n = void 0;
			} }
		};
		return this.cached.set(e, r), (r.flask ??= this.outerFlask.spawn({
			type: "view",
			creationScope: r.type === "create"
		})).onDiscard(() => {
			this.cached?.delete(e);
		}), r;
	}
	cached;
	outerFlask = M();
	constructor(e, t, n = (e) => e ?? Ao) {
		super(), this.cases = t;
		let r = n(e()), i = this.getKit(r, e());
		if (i) try {
			Ii(!0), this.activateConditional(i, (e) => {
				e.flask.emitInitialMount(), e.type == "remount" && e.flask.onDiscard(() => {
					this.cached?.delete(r);
				});
			});
		} finally {
			Li();
		}
		I(e, ({ previous: t, flask: r }) => {
			let i = n(t), a = n(e()), o = e();
			if (console.log("prevCase", i), console.log("caseKey", a), o === t) {
				console.warn("PREVIOUS MATCH", o);
				return;
			}
			let s = this.getKit(a, o), c = this.pendingDeactivatedKit ?? this.getKit(i, t);
			this.pendingSwitch &&= (console.log(">>> CANCEL PROMISE"), this.cancelledPendingSwitch.add(this.pendingSwitch), null), s.pending ? this.awaitPendingConditional(s.pending, s, c) : (this.deactivateConditional(c), this.reactivateConditional(s), s.type == "remount" && s.flask.onDiscard(() => {
				this.cached?.delete(o);
			}));
		});
	}
	cancelledPendingSwitch = /* @__PURE__ */ new Set();
	_pendingSwitchID = 0;
	pendingSwitch = null;
	pendingDeactivatedKit = null;
	awaitPendingConditional = uo.prototype.awaitPendingConditional;
	reactivateConditional = uo.prototype.reactivateConditional;
	activateConditional = uo.prototype.activateConditional;
	deactivateConditional = uo.prototype.deactivateConditional;
};
//#endregion
//#region ../../packages/luent/src/events/listen.ts
function No(e, t, n, r) {
	return r?.eager && Va(n, t)(new Event(t)), Tt(Va(n, t), r || {}, {
		enroll(n) {
			e.addEventListener(t, n, r);
		},
		remove(n) {
			e.removeEventListener(t, n, r);
		}
	});
}
wt((e, t) => (n) => No(e, t, n));
//#endregion
//#region ../../packages/luent/src/boundaries/Try.tsx
function Po(e, t) {
	try {
		return e();
	} catch (e) {
		return t ? t.renderError(e instanceof Error ? e : Error(typeof e == "string" ? e : "")) : void 0;
	}
}
globalThis._$$TrySeries = Po;
//#endregion
//#region ../../packages/luent/src/server/renderer.ts
function Fo(e) {
	return Io(h(e));
}
function Io(e, t = []) {
	for (let n of e) if (Array.isArray(n)) Io(n, t);
	else if (Xn(n)) Io(n.nodes, t);
	else if (v(n)) {
		if (n.length !== 0) throw Error("render functions must have no parameters");
		t.push(Zr(n()));
	} else if (n == null || n === "") continue;
	else t.push(Zr(n));
	return t;
}
function Lo(e, t) {
	let n = new ut({ type: "view" });
	try {
		st.push(n), n.emitInitialMount(), console.log("RENDER TO STRING");
		let t = Fo(e()).join(" ");
		return console.log("OUTPUT????", t), t;
	} finally {
		st.pop();
	}
}
//#endregion
//#region ../../packages/luent/src/conditional/As.ts
function Ro(...e) {
	let [t] = e;
	return new Mo(t.key, ko(e, void 0), (e) => e == null ? Ao : "as");
}
//#endregion
//#region ../../packages/luent/src/index.ts
globalThis._$$AsSeries = Ro, globalThis._$$wrapWithContext = or;
//#endregion
//#region ../../packages/luent/src/jsx-runtime/index.ts
function H(e, t) {
	let n = t.children;
	if (delete t.children, t.Slot = n ??= t.Slot, typeof n != "function" && n !== void 0) {
		console.warn("Slot is not a function", n);
		return;
	}
	return e === rr ? rr({
		Slot: n,
		provide: t.provide
	}) : e === zo ? h(n?.()) : so(e, n, t);
}
function zo() {}
//#endregion
//#region src/HelloWorld.tsx
function Bo() {
	return /* @__PURE__ */ H("div", { children: () => ["Hello world"] });
}
//#endregion
//#region ../../node_modules/.pnpm/shiki@4.1.0/node_modules/shiki/dist/chunk-D1SwGrFN.mjs
var Vo = Object.defineProperty, Ho = Object.getOwnPropertyDescriptor, Uo = Object.getOwnPropertyNames, Wo = Object.prototype.hasOwnProperty, Go = (e, t) => {
	let n = {};
	for (var r in e) Vo(n, r, {
		get: e[r],
		enumerable: !0
	});
	return t || Vo(n, Symbol.toStringTag, { value: "Module" }), n;
}, Ko = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = Uo(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !Wo.call(e, s) && s !== n && Vo(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = Ho(t, s)) || r.enumerable
	});
	return e;
}, qo = (e, t, n) => (Ko(e, t, "default"), n && Ko(n, t, "default")), Jo = [
	{
		id: "abap",
		name: "ABAP",
		import: (() => import("./abap-DF4NaQCD.js"))
	},
	{
		id: "actionscript-3",
		name: "ActionScript",
		import: (() => import("./actionscript-3-DD7XPL4p.js"))
	},
	{
		id: "ada",
		name: "Ada",
		import: (() => import("./ada-d7eD92uQ.js"))
	},
	{
		id: "angular-html",
		name: "Angular HTML",
		import: (() => import("./angular-html-BvdKPyxv.js").then((e) => e.n))
	},
	{
		id: "angular-ts",
		name: "Angular TypeScript",
		import: (() => import("./angular-ts-DDhvJPX3.js"))
	},
	{
		id: "apache",
		name: "Apache Conf",
		import: (() => import("./apache-zsgjHeYU.js"))
	},
	{
		id: "apex",
		name: "Apex",
		import: (() => import("./apex-Bd8m0RvF.js"))
	},
	{
		id: "apl",
		name: "APL",
		import: (() => import("./apl-4xUAK7pp.js"))
	},
	{
		id: "applescript",
		name: "AppleScript",
		import: (() => import("./applescript-D_ETOzPj.js"))
	},
	{
		id: "ara",
		name: "Ara",
		import: (() => import("./ara-CXdsJbD3.js"))
	},
	{
		id: "asciidoc",
		name: "AsciiDoc",
		aliases: ["adoc"],
		import: (() => import("./asciidoc-0QzBkr0X.js"))
	},
	{
		id: "asm",
		name: "Assembly",
		import: (() => import("./asm-DLrPCi7c.js"))
	},
	{
		id: "astro",
		name: "Astro",
		import: (() => import("./astro-DhdHzfOa.js"))
	},
	{
		id: "awk",
		name: "AWK",
		import: (() => import("./awk-452npsTH.js"))
	},
	{
		id: "ballerina",
		name: "Ballerina",
		import: (() => import("./ballerina-8wA0eHgr.js"))
	},
	{
		id: "bat",
		name: "Batch File",
		aliases: ["batch"],
		import: (() => import("./bat-C_-1s8II.js"))
	},
	{
		id: "beancount",
		name: "Beancount",
		import: (() => import("./beancount-R_9qll1W.js"))
	},
	{
		id: "berry",
		name: "Berry",
		aliases: ["be"],
		import: (() => import("./berry-oDXeVIfk.js"))
	},
	{
		id: "bibtex",
		name: "BibTeX",
		import: (() => import("./bibtex-CAeObnSR.js"))
	},
	{
		id: "bicep",
		name: "Bicep",
		import: (() => import("./bicep-udSZHxea.js"))
	},
	{
		id: "bird2",
		name: "BIRD2 Configuration",
		aliases: ["bird"],
		import: (() => import("./bird2-DeFExk0t.js"))
	},
	{
		id: "blade",
		name: "Blade",
		import: (() => import("./blade-CVitbTGa.js"))
	},
	{
		id: "bsl",
		name: "1C (Enterprise)",
		aliases: ["1c"],
		import: (() => import("./bsl-CpRrDtXk.js"))
	},
	{
		id: "c",
		name: "C",
		import: (() => import("./c-CxRpybjQ.js").then((e) => e.n))
	},
	{
		id: "c3",
		name: "C3",
		import: (() => import("./c3-BswAwd0V.js"))
	},
	{
		id: "cadence",
		name: "Cadence",
		aliases: ["cdc"],
		import: (() => import("./cadence-C2DNIpxD.js"))
	},
	{
		id: "cairo",
		name: "Cairo",
		import: (() => import("./cairo-CVLRELk3.js"))
	},
	{
		id: "clarity",
		name: "Clarity",
		import: (() => import("./clarity-NkpJCD6R.js"))
	},
	{
		id: "clojure",
		name: "Clojure",
		aliases: ["clj"],
		import: (() => import("./clojure-g5hblQ59.js"))
	},
	{
		id: "cmake",
		name: "CMake",
		import: (() => import("./cmake-D30WusUY.js"))
	},
	{
		id: "cobol",
		name: "COBOL",
		import: (() => import("./cobol-CV1HTVrQ.js"))
	},
	{
		id: "codeowners",
		name: "CODEOWNERS",
		import: (() => import("./codeowners-a_Z0p9_y.js"))
	},
	{
		id: "codeql",
		name: "CodeQL",
		aliases: ["ql"],
		import: (() => import("./codeql-BkSUw1F6.js"))
	},
	{
		id: "coffee",
		name: "CoffeeScript",
		aliases: ["coffeescript"],
		import: (() => import("./coffee-B8zfB6x-.js"))
	},
	{
		id: "common-lisp",
		name: "Common Lisp",
		aliases: ["lisp"],
		import: (() => import("./common-lisp-D2PkvS4V.js"))
	},
	{
		id: "coq",
		name: "Coq",
		import: (() => import("./coq-CZH6C0pT.js"))
	},
	{
		id: "cpp",
		name: "C++",
		aliases: ["c++"],
		import: (() => import("./cpp-2-RxNLWH.js").then((e) => e.n))
	},
	{
		id: "crystal",
		name: "Crystal",
		import: (() => import("./crystal-CXfYSzbl.js"))
	},
	{
		id: "csharp",
		name: "C#",
		aliases: ["c#", "cs"],
		import: (() => import("./csharp-RRkgh3c4.js"))
	},
	{
		id: "css",
		name: "CSS",
		import: (() => import("./css-CeXwyyMD.js").then((e) => e.n))
	},
	{
		id: "csv",
		name: "CSV",
		import: (() => import("./csv-DFU5sVkH.js"))
	},
	{
		id: "cue",
		name: "CUE",
		import: (() => import("./cue-cdFZcSz0.js"))
	},
	{
		id: "cypher",
		name: "Cypher",
		aliases: ["cql"],
		import: (() => import("./cypher-DRjO_s97.js"))
	},
	{
		id: "d",
		name: "D",
		import: (() => import("./d-BTgKsJ9x.js"))
	},
	{
		id: "dart",
		name: "Dart",
		import: (() => import("./dart-CtlcskXT.js"))
	},
	{
		id: "dax",
		name: "DAX",
		import: (() => import("./dax-DMzovUnU.js"))
	},
	{
		id: "desktop",
		name: "Desktop",
		import: (() => import("./desktop-0YG2NeB2.js"))
	},
	{
		id: "diff",
		name: "Diff",
		import: (() => import("./diff-D0WgTNQn.js"))
	},
	{
		id: "docker",
		name: "Dockerfile",
		aliases: ["dockerfile"],
		import: (() => import("./docker-DMpUQ2UE.js"))
	},
	{
		id: "dotenv",
		name: "dotEnv",
		import: (() => import("./dotenv-BQQGfUx-.js"))
	},
	{
		id: "dream-maker",
		name: "Dream Maker",
		import: (() => import("./dream-maker-Br_aTy0D.js"))
	},
	{
		id: "edge",
		name: "Edge",
		import: (() => import("./edge-B2677VQp.js"))
	},
	{
		id: "elixir",
		name: "Elixir",
		import: (() => import("./elixir-CbZqfVMr.js"))
	},
	{
		id: "elm",
		name: "Elm",
		import: (() => import("./elm-AYSYxbta.js"))
	},
	{
		id: "emacs-lisp",
		name: "Emacs Lisp",
		aliases: ["elisp"],
		import: (() => import("./emacs-lisp-CylwubPi.js"))
	},
	{
		id: "erb",
		name: "ERB",
		import: (() => import("./erb-BeZQHJsg.js"))
	},
	{
		id: "erlang",
		name: "Erlang",
		aliases: ["erl"],
		import: (() => import("./erlang-DzWC6VdW.js"))
	},
	{
		id: "fennel",
		name: "Fennel",
		import: (() => import("./fennel-XqmdNU54.js"))
	},
	{
		id: "fish",
		name: "Fish",
		import: (() => import("./fish-DnIfDEl-.js"))
	},
	{
		id: "fluent",
		name: "Fluent",
		aliases: ["ftl"],
		import: (() => import("./fluent-Dv7iXi9Q.js"))
	},
	{
		id: "fortran-fixed-form",
		name: "Fortran (Fixed Form)",
		aliases: [
			"f",
			"for",
			"f77"
		],
		import: (() => import("./fortran-fixed-form-DJ9yi74o.js"))
	},
	{
		id: "fortran-free-form",
		name: "Fortran (Free Form)",
		aliases: [
			"f90",
			"f95",
			"f03",
			"f08",
			"f18"
		],
		import: (() => import("./fortran-free-form-B6CnEX04.js"))
	},
	{
		id: "fsharp",
		name: "F#",
		aliases: ["f#", "fs"],
		import: (() => import("./fsharp-BmWSPOvP.js"))
	},
	{
		id: "gdresource",
		name: "GDResource",
		aliases: ["tscn", "tres"],
		import: (() => import("./gdresource-v1Pqsttz.js"))
	},
	{
		id: "gdscript",
		name: "GDScript",
		aliases: ["gd"],
		import: (() => import("./gdscript-C74XTZnl.js"))
	},
	{
		id: "gdshader",
		name: "GDShader",
		import: (() => import("./gdshader-C-YpNGc4.js"))
	},
	{
		id: "genie",
		name: "Genie",
		import: (() => import("./genie-eGJU5Fha.js"))
	},
	{
		id: "gherkin",
		name: "Gherkin",
		import: (() => import("./gherkin-DPafK1RH.js"))
	},
	{
		id: "git-commit",
		name: "Git Commit Message",
		import: (() => import("./git-commit-B1eqBoGN.js"))
	},
	{
		id: "git-rebase",
		name: "Git Rebase Message",
		import: (() => import("./git-rebase-DGDouTc4.js"))
	},
	{
		id: "gleam",
		name: "Gleam",
		import: (() => import("./gleam-DDi89CaZ.js"))
	},
	{
		id: "glimmer-js",
		name: "Glimmer JS",
		aliases: ["gjs"],
		import: (() => import("./glimmer-js-D3s8k_A4.js"))
	},
	{
		id: "glimmer-ts",
		name: "Glimmer TS",
		aliases: ["gts"],
		import: (() => import("./glimmer-ts-vjaJlqh_.js"))
	},
	{
		id: "glsl",
		name: "GLSL",
		import: (() => import("./glsl-Dd19yOvN.js").then((e) => e.n))
	},
	{
		id: "gn",
		name: "GN",
		import: (() => import("./gn-CFzP8_PD.js"))
	},
	{
		id: "gnuplot",
		name: "Gnuplot",
		import: (() => import("./gnuplot-Dwu09Wsa.js"))
	},
	{
		id: "go",
		name: "Go",
		import: (() => import("./go-BEdBk4fh.js"))
	},
	{
		id: "graphql",
		name: "GraphQL",
		aliases: ["gql"],
		import: (() => import("./graphql-DRthgLZB.js").then((e) => e.n))
	},
	{
		id: "groovy",
		name: "Groovy",
		import: (() => import("./groovy-CmZ205Qh.js"))
	},
	{
		id: "hack",
		name: "Hack",
		import: (() => import("./hack-COCoGLOt.js"))
	},
	{
		id: "haml",
		name: "Ruby Haml",
		import: (() => import("./haml-CMP3Hg2U.js").then((e) => e.n))
	},
	{
		id: "handlebars",
		name: "Handlebars",
		aliases: ["hbs"],
		import: (() => import("./handlebars-C9F59ti4.js"))
	},
	{
		id: "haskell",
		name: "Haskell",
		aliases: ["hs"],
		import: (() => import("./haskell-DSSJ-2AO.js"))
	},
	{
		id: "haxe",
		name: "Haxe",
		import: (() => import("./haxe-DYIi7e35.js"))
	},
	{
		id: "hcl",
		name: "HashiCorp HCL",
		import: (() => import("./hcl-BxX70ue-.js"))
	},
	{
		id: "hjson",
		name: "Hjson",
		import: (() => import("./hjson-Znrrrv1t.js"))
	},
	{
		id: "hlsl",
		name: "HLSL",
		import: (() => import("./hlsl-D-dP8z1U.js"))
	},
	{
		id: "html",
		name: "HTML",
		import: (() => import("./html-BsatasR5.js").then((e) => e.n))
	},
	{
		id: "html-derivative",
		name: "HTML (Derivative)",
		import: (() => import("./html-derivative-D8JwTfy3.js"))
	},
	{
		id: "http",
		name: "HTTP",
		import: (() => import("./http-CKhchFrZ.js"))
	},
	{
		id: "hurl",
		name: "Hurl",
		import: (() => import("./hurl-BRmI7Vk2.js"))
	},
	{
		id: "hxml",
		name: "HXML",
		import: (() => import("./hxml-C8afOC86.js"))
	},
	{
		id: "hy",
		name: "Hy",
		import: (() => import("./hy-Cd4h6N3W.js"))
	},
	{
		id: "imba",
		name: "Imba",
		import: (() => import("./imba-DdhTsO9l.js"))
	},
	{
		id: "ini",
		name: "INI",
		aliases: ["properties"],
		import: (() => import("./ini-CmgEGOBJ.js"))
	},
	{
		id: "java",
		name: "Java",
		import: (() => import("./java-CVRdVqZr.js").then((e) => e.n))
	},
	{
		id: "javascript",
		name: "JavaScript",
		aliases: [
			"js",
			"cjs",
			"mjs"
		],
		import: (() => import("./javascript-CsNI_Rrz.js").then((e) => e.n))
	},
	{
		id: "jinja",
		name: "Jinja",
		import: (() => import("./jinja-Bs-QP0Vl.js"))
	},
	{
		id: "jison",
		name: "Jison",
		import: (() => import("./jison-BYt_guBD.js"))
	},
	{
		id: "json",
		name: "JSON",
		import: (() => import("./json-BYdRNnZM.js").then((e) => e.n))
	},
	{
		id: "json5",
		name: "JSON5",
		import: (() => import("./json5-D2Eltym1.js"))
	},
	{
		id: "jsonc",
		name: "JSON with Comments",
		import: (() => import("./jsonc-BPIJyZ7u.js"))
	},
	{
		id: "jsonl",
		name: "JSON Lines",
		import: (() => import("./jsonl-BGkjXns2.js"))
	},
	{
		id: "jsonnet",
		name: "Jsonnet",
		import: (() => import("./jsonnet-DsRfEVPr.js"))
	},
	{
		id: "jssm",
		name: "JSSM",
		aliases: ["fsl"],
		import: (() => import("./jssm-DP2pbfxn.js"))
	},
	{
		id: "jsx",
		name: "JSX",
		import: (() => import("./jsx-BQkF1144.js").then((e) => e.n))
	},
	{
		id: "julia",
		name: "Julia",
		aliases: ["jl"],
		import: (() => import("./julia-CJa5oAIf.js"))
	},
	{
		id: "just",
		name: "Just",
		import: (() => import("./just-CJvDDRSM.js"))
	},
	{
		id: "kdl",
		name: "KDL",
		import: (() => import("./kdl-BdIUXyK8.js"))
	},
	{
		id: "kotlin",
		name: "Kotlin",
		aliases: ["kt", "kts"],
		import: (() => import("./kotlin-CQsNEM2o.js"))
	},
	{
		id: "kusto",
		name: "Kusto",
		aliases: ["kql"],
		import: (() => import("./kusto-UWPUoeE5.js"))
	},
	{
		id: "latex",
		name: "LaTeX",
		import: (() => import("./latex-Boa6X9i6.js"))
	},
	{
		id: "lean",
		name: "Lean 4",
		aliases: ["lean4"],
		import: (() => import("./lean-D3P_r_z_.js"))
	},
	{
		id: "less",
		name: "Less",
		import: (() => import("./less-9LYkHheD.js"))
	},
	{
		id: "liquid",
		name: "Liquid",
		import: (() => import("./liquid-DYZbJ_nx.js"))
	},
	{
		id: "llvm",
		name: "LLVM IR",
		import: (() => import("./llvm-BZ-9x1Lq.js"))
	},
	{
		id: "log",
		name: "Log file",
		import: (() => import("./log-DvQMOE69.js"))
	},
	{
		id: "logo",
		name: "Logo",
		import: (() => import("./logo-Cl5E_QyH.js"))
	},
	{
		id: "lua",
		name: "Lua",
		import: (() => import("./lua-6IrFhJSv.js").then((e) => e.n))
	},
	{
		id: "luau",
		name: "Luau",
		import: (() => import("./luau-D70m3rtt.js"))
	},
	{
		id: "make",
		name: "Makefile",
		aliases: ["makefile"],
		import: (() => import("./make-CE9Hryyp.js"))
	},
	{
		id: "markdown",
		name: "Markdown",
		aliases: ["md"],
		import: (() => import("./markdown-nUtTZkU8.js"))
	},
	{
		id: "marko",
		name: "Marko",
		import: (() => import("./marko-CF5T1W71.js"))
	},
	{
		id: "matlab",
		name: "MATLAB",
		import: (() => import("./matlab-fM7rwTZt.js"))
	},
	{
		id: "mdc",
		name: "MDC",
		import: (() => import("./mdc-B4kiRUj7.js"))
	},
	{
		id: "mdx",
		name: "MDX",
		import: (() => import("./mdx-DswfiFg4.js"))
	},
	{
		id: "mermaid",
		name: "Mermaid",
		aliases: ["mmd"],
		import: (() => import("./mermaid-D4X-e3rK.js"))
	},
	{
		id: "mipsasm",
		name: "MIPS Assembly",
		aliases: ["mips"],
		import: (() => import("./mipsasm-DbPELTlh.js"))
	},
	{
		id: "mojo",
		name: "Mojo",
		import: (() => import("./mojo-DO3SwCZN.js"))
	},
	{
		id: "moonbit",
		name: "MoonBit",
		aliases: ["mbt", "mbti"],
		import: (() => import("./moonbit-BRyCXbVu.js"))
	},
	{
		id: "move",
		name: "Move",
		import: (() => import("./move-D1Ne4dqA.js"))
	},
	{
		id: "narrat",
		name: "Narrat Language",
		aliases: ["nar"],
		import: (() => import("./narrat-9pGDjQTI.js"))
	},
	{
		id: "nextflow",
		name: "Nextflow",
		aliases: ["nf"],
		import: (() => import("./nextflow-6E5D206J.js"))
	},
	{
		id: "nextflow-groovy",
		name: "Nextflow Groovy",
		import: (() => import("./nextflow-groovy-Dpj38dkf.js"))
	},
	{
		id: "nginx",
		name: "Nginx",
		import: (() => import("./nginx-CljEOo3i.js"))
	},
	{
		id: "nim",
		name: "Nim",
		import: (() => import("./nim-CWfGn7Aq.js"))
	},
	{
		id: "nix",
		name: "Nix",
		import: (() => import("./nix-CwcLdFnB.js"))
	},
	{
		id: "nushell",
		name: "nushell",
		aliases: ["nu"],
		import: (() => import("./nushell-DrP4m5HL.js"))
	},
	{
		id: "objective-c",
		name: "Objective-C",
		aliases: ["objc"],
		import: (() => import("./objective-c-DK-EKgyd.js"))
	},
	{
		id: "objective-cpp",
		name: "Objective-C++",
		import: (() => import("./objective-cpp-CXtEgxjw.js"))
	},
	{
		id: "ocaml",
		name: "OCaml",
		import: (() => import("./ocaml-BO-0Wjtk.js"))
	},
	{
		id: "odin",
		name: "Odin",
		import: (() => import("./odin-BDNmOx6H.js"))
	},
	{
		id: "openscad",
		name: "OpenSCAD",
		aliases: ["scad"],
		import: (() => import("./openscad-B8gTrm-E.js"))
	},
	{
		id: "pascal",
		name: "Pascal",
		import: (() => import("./pascal-CRtegPzh.js"))
	},
	{
		id: "perl",
		name: "Perl",
		import: (() => import("./perl-BzPUg_GJ.js"))
	},
	{
		id: "php",
		name: "PHP",
		import: (() => import("./php-Cc68yDzh.js"))
	},
	{
		id: "pkl",
		name: "Pkl",
		import: (() => import("./pkl-C53Sb050.js"))
	},
	{
		id: "plsql",
		name: "PL/SQL",
		import: (() => import("./plsql-Bx7tup_v.js"))
	},
	{
		id: "po",
		name: "Gettext PO",
		aliases: ["pot", "potx"],
		import: (() => import("./po-DSTB2Mz9.js"))
	},
	{
		id: "polar",
		name: "Polar",
		import: (() => import("./polar-E3hAEXm5.js"))
	},
	{
		id: "postcss",
		name: "PostCSS",
		import: (() => import("./postcss-BZib8l4b.js"))
	},
	{
		id: "powerquery",
		name: "PowerQuery",
		import: (() => import("./powerquery-CJblX2B2.js"))
	},
	{
		id: "powershell",
		name: "PowerShell",
		aliases: ["ps", "ps1"],
		import: (() => import("./powershell-C03Xi8fb.js"))
	},
	{
		id: "prisma",
		name: "Prisma",
		import: (() => import("./prisma-4kxUlEbd.js"))
	},
	{
		id: "prolog",
		name: "Prolog",
		import: (() => import("./prolog-Ce1YjgEP.js"))
	},
	{
		id: "proto",
		name: "Protocol Buffer 3",
		aliases: ["protobuf"],
		import: (() => import("./proto-DGLklcji.js"))
	},
	{
		id: "pug",
		name: "Pug",
		aliases: ["jade"],
		import: (() => import("./pug-Cc2wTWpO.js"))
	},
	{
		id: "puppet",
		name: "Puppet",
		import: (() => import("./puppet-B2qoEJs2.js"))
	},
	{
		id: "purescript",
		name: "PureScript",
		import: (() => import("./purescript-Cq_6EhvO.js"))
	},
	{
		id: "python",
		name: "Python",
		aliases: ["py"],
		import: (() => import("./python-D0AaDoWC.js"))
	},
	{
		id: "qml",
		name: "QML",
		import: (() => import("./qml-Cel_2WTN.js"))
	},
	{
		id: "qmldir",
		name: "QML Directory",
		import: (() => import("./qmldir-BSWsNKCW.js"))
	},
	{
		id: "qss",
		name: "Qt Style Sheets",
		import: (() => import("./qss-CT2jsqXX.js"))
	},
	{
		id: "r",
		name: "R",
		import: (() => import("./r-JfluWVOS.js").then((e) => e.n))
	},
	{
		id: "racket",
		name: "Racket",
		import: (() => import("./racket-B0_wXtli.js"))
	},
	{
		id: "raku",
		name: "Raku",
		aliases: ["perl6"],
		import: (() => import("./raku-DKDZy5Ck.js"))
	},
	{
		id: "razor",
		name: "ASP.NET Razor",
		import: (() => import("./razor-B-3c_ANQ.js"))
	},
	{
		id: "reg",
		name: "Windows Registry Script",
		import: (() => import("./reg-D6txjqBF.js"))
	},
	{
		id: "regexp",
		name: "RegExp",
		aliases: ["regex"],
		import: (() => import("./regexp-ClOcVrHJ.js").then((e) => e.n))
	},
	{
		id: "rel",
		name: "Rel",
		import: (() => import("./rel-CY3GbSca.js"))
	},
	{
		id: "riscv",
		name: "RISC-V",
		import: (() => import("./riscv-BKjM5F1V.js"))
	},
	{
		id: "ron",
		name: "RON",
		import: (() => import("./ron-DJgcWJZU.js"))
	},
	{
		id: "rosmsg",
		name: "ROS Interface",
		import: (() => import("./rosmsg-BTByjkSH.js"))
	},
	{
		id: "rst",
		name: "reStructuredText",
		import: (() => import("./rst-UUTtwwuq.js"))
	},
	{
		id: "ruby",
		name: "Ruby",
		aliases: ["rb"],
		import: (() => import("./ruby-BMriddJ1.js"))
	},
	{
		id: "rust",
		name: "Rust",
		aliases: ["rs"],
		import: (() => import("./rust-BrRMzTsN.js"))
	},
	{
		id: "sas",
		name: "SAS",
		import: (() => import("./sas-TfdwiPxL.js"))
	},
	{
		id: "sass",
		name: "Sass",
		import: (() => import("./sass-CL6GLiPQ.js"))
	},
	{
		id: "scala",
		name: "Scala",
		import: (() => import("./scala-BST3Nfcj.js"))
	},
	{
		id: "scheme",
		name: "Scheme",
		import: (() => import("./scheme-BksZ4zIw.js"))
	},
	{
		id: "scss",
		name: "SCSS",
		import: (() => import("./scss-CJgHxcgE.js").then((e) => e.n))
	},
	{
		id: "sdbl",
		name: "1C (Query)",
		aliases: ["1c-query"],
		import: (() => import("./sdbl-CLOIgNSF.js"))
	},
	{
		id: "shaderlab",
		name: "ShaderLab",
		aliases: ["shader"],
		import: (() => import("./shaderlab-CUYcVUq-.js"))
	},
	{
		id: "shellscript",
		name: "Shell",
		aliases: [
			"bash",
			"sh",
			"shell",
			"zsh"
		],
		import: (() => import("./shellscript-D0V1fpdT.js").then((e) => e.n))
	},
	{
		id: "shellsession",
		name: "Shell Session",
		aliases: ["console"],
		import: (() => import("./shellsession-BDsWhvCl.js"))
	},
	{
		id: "smalltalk",
		name: "Smalltalk",
		import: (() => import("./smalltalk-DpZ76Hck.js"))
	},
	{
		id: "solidity",
		name: "Solidity",
		import: (() => import("./solidity-C6WZChM7.js"))
	},
	{
		id: "soy",
		name: "Closure Templates",
		aliases: ["closure-templates"],
		import: (() => import("./soy-DLwthHvB.js"))
	},
	{
		id: "sparql",
		name: "SPARQL",
		import: (() => import("./sparql-BdBtZ2Ff.js"))
	},
	{
		id: "splunk",
		name: "Splunk Query Language",
		aliases: ["spl"],
		import: (() => import("./splunk-MGILMmew.js"))
	},
	{
		id: "sql",
		name: "SQL",
		import: (() => import("./sql-CbkeoF0Y.js").then((e) => e.n))
	},
	{
		id: "ssh-config",
		name: "SSH Config",
		import: (() => import("./ssh-config-CFmUyPR7.js"))
	},
	{
		id: "stata",
		name: "Stata",
		import: (() => import("./stata-DM_dF40L.js"))
	},
	{
		id: "stylus",
		name: "Stylus",
		aliases: ["styl"],
		import: (() => import("./stylus-Kh83dApl.js"))
	},
	{
		id: "surrealql",
		name: "SurrealQL",
		aliases: ["surql"],
		import: (() => import("./surrealql-wRu4x_oL.js"))
	},
	{
		id: "svelte",
		name: "Svelte",
		import: (() => import("./svelte-DQrnxamQ.js"))
	},
	{
		id: "swift",
		name: "Swift",
		import: (() => import("./swift-BkBDHPbH.js"))
	},
	{
		id: "system-verilog",
		name: "SystemVerilog",
		import: (() => import("./system-verilog-DZimthQt.js"))
	},
	{
		id: "systemd",
		name: "Systemd Units",
		import: (() => import("./systemd-ArfzIYBi.js"))
	},
	{
		id: "talonscript",
		name: "TalonScript",
		aliases: ["talon"],
		import: (() => import("./talonscript-SIE54PtE.js"))
	},
	{
		id: "tasl",
		name: "Tasl",
		import: (() => import("./tasl-Ck4PO08m.js"))
	},
	{
		id: "tcl",
		name: "Tcl",
		import: (() => import("./tcl-DfkVwqLO.js"))
	},
	{
		id: "templ",
		name: "Templ",
		import: (() => import("./templ-C3Ar_xFq.js"))
	},
	{
		id: "terraform",
		name: "Terraform",
		aliases: ["tf", "tfvars"],
		import: (() => import("./terraform-DccThf6s.js"))
	},
	{
		id: "tex",
		name: "TeX",
		import: (() => import("./tex-BrDkG2gy.js"))
	},
	{
		id: "toml",
		name: "TOML",
		import: (() => import("./toml-CIQJnU5u.js"))
	},
	{
		id: "ts-tags",
		name: "TypeScript with Tags",
		aliases: ["lit"],
		import: (() => import("./ts-tags-Cr9Bz9sF.js"))
	},
	{
		id: "tsv",
		name: "TSV",
		import: (() => import("./tsv-AfvsdcL-.js"))
	},
	{
		id: "tsx",
		name: "TSX",
		import: (() => import("./tsx-BkxTUxHM.js").then((e) => e.n))
	},
	{
		id: "turtle",
		name: "Turtle",
		import: (() => import("./turtle-D1NNZBgy.js"))
	},
	{
		id: "twig",
		name: "Twig",
		import: (() => import("./twig-ClJq2jpE.js"))
	},
	{
		id: "typescript",
		name: "TypeScript",
		aliases: [
			"ts",
			"cts",
			"mts"
		],
		import: (() => import("./typescript-LLWwxLnS.js").then((e) => e.n))
	},
	{
		id: "typespec",
		name: "TypeSpec",
		aliases: ["tsp"],
		import: (() => import("./typespec-JuVkJaIJ.js"))
	},
	{
		id: "typst",
		name: "Typst",
		aliases: ["typ"],
		import: (() => import("./typst-DXzoqiK9.js"))
	},
	{
		id: "v",
		name: "V",
		import: (() => import("./v-Bfg6pRQ_.js"))
	},
	{
		id: "vala",
		name: "Vala",
		import: (() => import("./vala-i5OYwFuH.js"))
	},
	{
		id: "vb",
		name: "Visual Basic",
		aliases: ["cmd"],
		import: (() => import("./vb-BMo8sl0w.js"))
	},
	{
		id: "verilog",
		name: "Verilog",
		import: (() => import("./verilog-Cq0B5e5o.js"))
	},
	{
		id: "vhdl",
		name: "VHDL",
		import: (() => import("./vhdl-UepOATuw.js"))
	},
	{
		id: "viml",
		name: "Vim Script",
		aliases: ["vim", "vimscript"],
		import: (() => import("./viml-DgaHry3T.js"))
	},
	{
		id: "vue",
		name: "Vue",
		import: (() => import("./vue-DHR8AddC.js"))
	},
	{
		id: "vue-html",
		name: "Vue HTML",
		import: (() => import("./vue-html-DPapqap-.js"))
	},
	{
		id: "vue-vine",
		name: "Vue Vine",
		import: (() => import("./vue-vine-BW42GJBK.js"))
	},
	{
		id: "vyper",
		name: "Vyper",
		aliases: ["vy"],
		import: (() => import("./vyper-BiyGiCmH.js"))
	},
	{
		id: "wasm",
		name: "WebAssembly",
		import: (() => import("./wasm-DXa1gtBd.js"))
	},
	{
		id: "wenyan",
		name: "Wenyan",
		aliases: ["文言"],
		import: (() => import("./wenyan-Ke6AN0BI.js"))
	},
	{
		id: "wgsl",
		name: "WGSL",
		import: (() => import("./wgsl-Vcm3Lg52.js"))
	},
	{
		id: "wikitext",
		name: "Wikitext",
		aliases: ["mediawiki", "wiki"],
		import: (() => import("./wikitext-C4uDiSA9.js"))
	},
	{
		id: "wit",
		name: "WebAssembly Interface Types",
		import: (() => import("./wit-hbIPZwZR.js"))
	},
	{
		id: "wolfram",
		name: "Wolfram",
		aliases: ["wl"],
		import: (() => import("./wolfram-DGFnG0I5.js"))
	},
	{
		id: "xml",
		name: "XML",
		import: (() => import("./xml-DGuX4Rbs.js").then((e) => e.n))
	},
	{
		id: "xsl",
		name: "XSL",
		import: (() => import("./xsl-CdimeeTX.js"))
	},
	{
		id: "yaml",
		name: "YAML",
		aliases: ["yml"],
		import: (() => import("./yaml-B19IEsIb.js").then((e) => e.n))
	},
	{
		id: "zenscript",
		name: "ZenScript",
		import: (() => import("./zenscript-BtXHY1aa.js"))
	},
	{
		id: "zig",
		name: "Zig",
		import: (() => import("./zig-BaU1vZRj.js"))
	}
], Yo = Object.fromEntries(Jo.map((e) => [e.id, e.import])), Xo = Object.fromEntries(Jo.flatMap((e) => e.aliases?.map((t) => [t, e.import]) || [])), Zo = {
	...Yo,
	...Xo
}, Qo = Object.fromEntries([
	{
		id: "andromeeda",
		displayName: "Andromeeda",
		type: "dark",
		import: (() => import("./andromeeda-CMn3w9Cf.js"))
	},
	{
		id: "aurora-x",
		displayName: "Aurora X",
		type: "dark",
		import: (() => import("./aurora-x-CRQlK_L5.js"))
	},
	{
		id: "ayu-dark",
		displayName: "Ayu Dark",
		type: "dark",
		import: (() => import("./ayu-dark-CvnA1Nik.js"))
	},
	{
		id: "ayu-light",
		displayName: "Ayu Light",
		type: "light",
		import: (() => import("./ayu-light-BkrWR6ro.js"))
	},
	{
		id: "ayu-mirage",
		displayName: "Ayu Mirage",
		type: "dark",
		import: (() => import("./ayu-mirage-DVqijJP6.js"))
	},
	{
		id: "catppuccin-frappe",
		displayName: "Catppuccin Frappé",
		type: "dark",
		import: (() => import("./catppuccin-frappe-CVdKiAnQ.js"))
	},
	{
		id: "catppuccin-latte",
		displayName: "Catppuccin Latte",
		type: "light",
		import: (() => import("./catppuccin-latte-C7T5mv9u.js"))
	},
	{
		id: "catppuccin-macchiato",
		displayName: "Catppuccin Macchiato",
		type: "dark",
		import: (() => import("./catppuccin-macchiato-wDDcxOfk.js"))
	},
	{
		id: "catppuccin-mocha",
		displayName: "Catppuccin Mocha",
		type: "dark",
		import: (() => import("./catppuccin-mocha-BnmSCb0_.js"))
	},
	{
		id: "dark-plus",
		displayName: "Dark Plus",
		type: "dark",
		import: (() => import("./dark-plus-CpLu3kUg.js"))
	},
	{
		id: "dracula",
		displayName: "Dracula Theme",
		type: "dark",
		import: (() => import("./dracula-MMbgPivp.js"))
	},
	{
		id: "dracula-soft",
		displayName: "Dracula Theme Soft",
		type: "dark",
		import: (() => import("./dracula-soft-Cbxy7tmw.js"))
	},
	{
		id: "everforest-dark",
		displayName: "Everforest Dark",
		type: "dark",
		import: (() => import("./everforest-dark-DRBdlZow.js"))
	},
	{
		id: "everforest-light",
		displayName: "Everforest Light",
		type: "light",
		import: (() => import("./everforest-light-DSmSFEHB.js"))
	},
	{
		id: "github-dark",
		displayName: "GitHub Dark",
		type: "dark",
		import: (() => import("./github-dark-DVPhe1fm.js"))
	},
	{
		id: "github-dark-default",
		displayName: "GitHub Dark Default",
		type: "dark",
		import: (() => import("./github-dark-default-D-il96Gy.js"))
	},
	{
		id: "github-dark-dimmed",
		displayName: "GitHub Dark Dimmed",
		type: "dark",
		import: (() => import("./github-dark-dimmed-CcrAV-cv.js"))
	},
	{
		id: "github-dark-high-contrast",
		displayName: "GitHub Dark High Contrast",
		type: "dark",
		import: (() => import("./github-dark-high-contrast-CBrSF7fZ.js"))
	},
	{
		id: "github-light",
		displayName: "GitHub Light",
		type: "light",
		import: (() => import("./github-light-Be17gnwM.js"))
	},
	{
		id: "github-light-default",
		displayName: "GitHub Light Default",
		type: "light",
		import: (() => import("./github-light-default-mPuk7KdE.js"))
	},
	{
		id: "github-light-high-contrast",
		displayName: "GitHub Light High Contrast",
		type: "light",
		import: (() => import("./github-light-high-contrast-Czy8VyPK.js"))
	},
	{
		id: "gruvbox-dark-hard",
		displayName: "Gruvbox Dark Hard",
		type: "dark",
		import: (() => import("./gruvbox-dark-hard-Chp0ZJIG.js"))
	},
	{
		id: "gruvbox-dark-medium",
		displayName: "Gruvbox Dark Medium",
		type: "dark",
		import: (() => import("./gruvbox-dark-medium-O2LwG2f5.js"))
	},
	{
		id: "gruvbox-dark-soft",
		displayName: "Gruvbox Dark Soft",
		type: "dark",
		import: (() => import("./gruvbox-dark-soft-CSWqxi9B.js"))
	},
	{
		id: "gruvbox-light-hard",
		displayName: "Gruvbox Light Hard",
		type: "light",
		import: (() => import("./gruvbox-light-hard-D0BqdlOw.js"))
	},
	{
		id: "gruvbox-light-medium",
		displayName: "Gruvbox Light Medium",
		type: "light",
		import: (() => import("./gruvbox-light-medium-DTASmIHD.js"))
	},
	{
		id: "gruvbox-light-soft",
		displayName: "Gruvbox Light Soft",
		type: "light",
		import: (() => import("./gruvbox-light-soft-DtteoJeO.js"))
	},
	{
		id: "horizon",
		displayName: "Horizon",
		type: "dark",
		import: (() => import("./horizon-BpMAjQX7.js"))
	},
	{
		id: "horizon-bright",
		displayName: "Horizon Bright",
		type: "light",
		import: (() => import("./horizon-bright-Bl5xV-JV.js"))
	},
	{
		id: "houston",
		displayName: "Houston",
		type: "dark",
		import: (() => import("./houston-DW3WHgy5.js"))
	},
	{
		id: "kanagawa-dragon",
		displayName: "Kanagawa Dragon",
		type: "dark",
		import: (() => import("./kanagawa-dragon-CvfF7YTW.js"))
	},
	{
		id: "kanagawa-lotus",
		displayName: "Kanagawa Lotus",
		type: "light",
		import: (() => import("./kanagawa-lotus-CCb8hcSX.js"))
	},
	{
		id: "kanagawa-wave",
		displayName: "Kanagawa Wave",
		type: "dark",
		import: (() => import("./kanagawa-wave-CGKMrw9-.js"))
	},
	{
		id: "laserwave",
		displayName: "LaserWave",
		type: "dark",
		import: (() => import("./laserwave-eYz-TA1V.js"))
	},
	{
		id: "light-plus",
		displayName: "Light Plus",
		type: "light",
		import: (() => import("./light-plus-B8rlUhBH.js"))
	},
	{
		id: "material-theme",
		displayName: "Material Theme",
		type: "dark",
		import: (() => import("./material-theme-CQIiqKJM.js"))
	},
	{
		id: "material-theme-darker",
		displayName: "Material Theme Darker",
		type: "dark",
		import: (() => import("./material-theme-darker-DRS4-9Fs.js"))
	},
	{
		id: "material-theme-lighter",
		displayName: "Material Theme Lighter",
		type: "light",
		import: (() => import("./material-theme-lighter-XEd5X-sq.js"))
	},
	{
		id: "material-theme-ocean",
		displayName: "Material Theme Ocean",
		type: "dark",
		import: (() => import("./material-theme-ocean-DKguEPNZ.js"))
	},
	{
		id: "material-theme-palenight",
		displayName: "Material Theme Palenight",
		type: "dark",
		import: (() => import("./material-theme-palenight-Bnwgw67B.js"))
	},
	{
		id: "min-dark",
		displayName: "Min Dark",
		type: "dark",
		import: (() => import("./min-dark-tx3-jb-I.js"))
	},
	{
		id: "min-light",
		displayName: "Min Light",
		type: "light",
		import: (() => import("./min-light-BG4hnquN.js"))
	},
	{
		id: "monokai",
		displayName: "Monokai",
		type: "dark",
		import: (() => import("./monokai-Bc9OOevp.js"))
	},
	{
		id: "night-owl",
		displayName: "Night Owl",
		type: "dark",
		import: (() => import("./night-owl-BnEImqoS.js"))
	},
	{
		id: "night-owl-light",
		displayName: "Night Owl Light",
		type: "light",
		import: (() => import("./night-owl-light-CJRHfw30.js"))
	},
	{
		id: "nord",
		displayName: "Nord",
		type: "dark",
		import: (() => import("./nord-0i1iZej6.js"))
	},
	{
		id: "one-dark-pro",
		displayName: "One Dark Pro",
		type: "dark",
		import: (() => import("./one-dark-pro-e0liy49c.js"))
	},
	{
		id: "one-light",
		displayName: "One Light",
		type: "light",
		import: (() => import("./one-light-Cuny764o.js"))
	},
	{
		id: "plastic",
		displayName: "Plastic",
		type: "dark",
		import: (() => import("./plastic-CMFDmKNp.js"))
	},
	{
		id: "poimandres",
		displayName: "Poimandres",
		type: "dark",
		import: (() => import("./poimandres-CqEgNv2K.js"))
	},
	{
		id: "red",
		displayName: "Red",
		type: "dark",
		import: (() => import("./red-SZPk9hEe.js"))
	},
	{
		id: "rose-pine",
		displayName: "Rosé Pine",
		type: "dark",
		import: (() => import("./rose-pine-DKjlNunb.js"))
	},
	{
		id: "rose-pine-dawn",
		displayName: "Rosé Pine Dawn",
		type: "light",
		import: (() => import("./rose-pine-dawn-BfebObGR.js"))
	},
	{
		id: "rose-pine-moon",
		displayName: "Rosé Pine Moon",
		type: "dark",
		import: (() => import("./rose-pine-moon-Dn64eTKG.js"))
	},
	{
		id: "slack-dark",
		displayName: "Slack Dark",
		type: "dark",
		import: (() => import("./slack-dark-BnIpDW_K.js"))
	},
	{
		id: "slack-ochin",
		displayName: "Slack Ochin",
		type: "light",
		import: (() => import("./slack-ochin-GcKAMK5A.js"))
	},
	{
		id: "snazzy-light",
		displayName: "Snazzy Light",
		type: "light",
		import: (() => import("./snazzy-light-BHPfBbyB.js"))
	},
	{
		id: "solarized-dark",
		displayName: "Solarized Dark",
		type: "dark",
		import: (() => import("./solarized-dark-Dp8i2cPr.js"))
	},
	{
		id: "solarized-light",
		displayName: "Solarized Light",
		type: "light",
		import: (() => import("./solarized-light-B_7s64gv.js"))
	},
	{
		id: "synthwave-84",
		displayName: "Synthwave '84",
		type: "dark",
		import: (() => import("./synthwave-84-CBjRfm2M.js"))
	},
	{
		id: "tokyo-night",
		displayName: "Tokyo Night",
		type: "dark",
		import: (() => import("./tokyo-night-DzYillEH.js"))
	},
	{
		id: "vesper",
		displayName: "Vesper",
		type: "dark",
		import: (() => import("./vesper-Cfgtm70u.js"))
	},
	{
		id: "vitesse-black",
		displayName: "Vitesse Black",
		type: "dark",
		import: (() => import("./vitesse-black-crQK5w5x.js"))
	},
	{
		id: "vitesse-dark",
		displayName: "Vitesse Dark",
		type: "dark",
		import: (() => import("./vitesse-dark-jmjAi4oB.js"))
	},
	{
		id: "vitesse-light",
		displayName: "Vitesse Light",
		type: "light",
		import: (() => import("./vitesse-light-BRuLroPo.js"))
	}
].map((e) => [e.id, e.import])), $o = /* @__PURE__ */ t({
	createOnigurumaEngine: () => Ts,
	getDefaultWasmLoader: () => ws,
	loadWasm: () => vs,
	setDefaultWasmLoader: () => Cs
}), es = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
function ts() {
	return 2147483648;
}
function ns() {
	return typeof performance < "u" ? performance.now() : Date.now();
}
var rs = (e, t) => e + (t - e % t) % t;
async function is(e) {
	let t, n, r = {};
	function i(e) {
		n = e, r.HEAPU8 = new Uint8Array(e), r.HEAPU32 = new Uint32Array(e);
	}
	function a(e, t, n) {
		r.HEAPU8.copyWithin(e, t, t + n);
	}
	function o(e) {
		try {
			return t.grow(e - n.byteLength + 65535 >>> 16), i(t.buffer), 1;
		} catch {}
	}
	function s(e) {
		let t = r.HEAPU8.length;
		e >>>= 0;
		let n = ts();
		if (e > n) return !1;
		for (let r = 1; r <= 4; r *= 2) {
			let i = t * (1 + .2 / r);
			if (i = Math.min(i, e + 100663296), o(Math.min(n, rs(Math.max(e, i), 65536)))) return !0;
		}
		return !1;
	}
	let c = typeof TextDecoder < "u" ? new TextDecoder("utf8") : void 0;
	function l(e, t, n = 1024) {
		let r = t + n, i = t;
		for (; e[i] && !(i >= r);) ++i;
		if (i - t > 16 && e.buffer && c) return c.decode(e.subarray(t, i));
		let a = "";
		for (; t < i;) {
			let n = e[t++];
			if (!(n & 128)) {
				a += String.fromCharCode(n);
				continue;
			}
			let r = e[t++] & 63;
			if ((n & 224) == 192) {
				a += String.fromCharCode((n & 31) << 6 | r);
				continue;
			}
			let i = e[t++] & 63;
			if (n = (n & 240) == 224 ? (n & 15) << 12 | r << 6 | i : (n & 7) << 18 | r << 12 | i << 6 | e[t++] & 63, n < 65536) a += String.fromCharCode(n);
			else {
				let e = n - 65536;
				a += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023);
			}
		}
		return a;
	}
	function u(e, t) {
		return e ? l(r.HEAPU8, e, t) : "";
	}
	let d = {
		emscripten_get_now: ns,
		emscripten_memcpy_big: a,
		emscripten_resize_heap: s,
		fd_write: () => 0
	};
	async function f() {
		let n = await e({
			env: d,
			wasi_snapshot_preview1: d
		});
		t = n.memory, i(t.buffer), Object.assign(r, n), r.UTF8ToString = u;
	}
	return await f(), r;
}
var as = Object.defineProperty, os = (e, t, n) => t in e ? as(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, U = (e, t, n) => os(e, typeof t == "symbol" ? t : t + "", n), W = null;
function ss(e) {
	throw new es(e.UTF8ToString(e.getLastOnigError()));
}
var cs = class e {
	constructor(t) {
		U(this, "utf16Length"), U(this, "utf8Length"), U(this, "utf16Value"), U(this, "utf8Value"), U(this, "utf16OffsetToUtf8"), U(this, "utf8OffsetToUtf16");
		let n = t.length, r = e._utf8ByteLength(t), i = r !== n, a = i ? new Uint32Array(n + 1) : null;
		i && (a[n] = r);
		let o = i ? new Uint32Array(r + 1) : null;
		i && (o[r] = n);
		let s = new Uint8Array(r), c = 0;
		for (let e = 0; e < n; e++) {
			let r = t.charCodeAt(e), l = r, u = !1;
			if (r >= 55296 && r <= 56319 && e + 1 < n) {
				let n = t.charCodeAt(e + 1);
				n >= 56320 && n <= 57343 && (l = (r - 55296 << 10) + 65536 | n - 56320, u = !0);
			}
			i && (a[e] = c, u && (a[e + 1] = c), l <= 127 ? o[c + 0] = e : l <= 2047 ? (o[c + 0] = e, o[c + 1] = e) : l <= 65535 ? (o[c + 0] = e, o[c + 1] = e, o[c + 2] = e) : (o[c + 0] = e, o[c + 1] = e, o[c + 2] = e, o[c + 3] = e)), l <= 127 ? s[c++] = l : l <= 2047 ? (s[c++] = 192 | (l & 1984) >>> 6, s[c++] = 128 | (l & 63) >>> 0) : l <= 65535 ? (s[c++] = 224 | (l & 61440) >>> 12, s[c++] = 128 | (l & 4032) >>> 6, s[c++] = 128 | (l & 63) >>> 0) : (s[c++] = 240 | (l & 1835008) >>> 18, s[c++] = 128 | (l & 258048) >>> 12, s[c++] = 128 | (l & 4032) >>> 6, s[c++] = 128 | (l & 63) >>> 0), u && e++;
		}
		this.utf16Length = n, this.utf8Length = r, this.utf16Value = t, this.utf8Value = s, this.utf16OffsetToUtf8 = a, this.utf8OffsetToUtf16 = o;
	}
	static _utf8ByteLength(e) {
		let t = 0;
		for (let n = 0, r = e.length; n < r; n++) {
			let i = e.charCodeAt(n), a = i, o = !1;
			if (i >= 55296 && i <= 56319 && n + 1 < r) {
				let t = e.charCodeAt(n + 1);
				t >= 56320 && t <= 57343 && (a = (i - 55296 << 10) + 65536 | t - 56320, o = !0);
			}
			a <= 127 ? t += 1 : a <= 2047 ? t += 2 : a <= 65535 ? t += 3 : t += 4, o && n++;
		}
		return t;
	}
	createString(e) {
		let t = e.omalloc(this.utf8Length);
		return e.HEAPU8.set(this.utf8Value, t), t;
	}
}, ls = class e {
	constructor(t) {
		if (U(this, "id", ++e.LAST_ID), U(this, "_onigBinding"), U(this, "content"), U(this, "utf16Length"), U(this, "utf8Length"), U(this, "utf16OffsetToUtf8"), U(this, "utf8OffsetToUtf16"), U(this, "ptr"), !W) throw new es("Must invoke loadWasm first.");
		this._onigBinding = W, this.content = t;
		let n = new cs(t);
		this.utf16Length = n.utf16Length, this.utf8Length = n.utf8Length, this.utf16OffsetToUtf8 = n.utf16OffsetToUtf8, this.utf8OffsetToUtf16 = n.utf8OffsetToUtf16, this.utf8Length < 1e4 && !e._sharedPtrInUse ? (e._sharedPtr ||= W.omalloc(1e4), e._sharedPtrInUse = !0, W.HEAPU8.set(n.utf8Value, e._sharedPtr), this.ptr = e._sharedPtr) : this.ptr = n.createString(W);
	}
	convertUtf8OffsetToUtf16(e) {
		return this.utf8OffsetToUtf16 ? e < 0 ? 0 : e > this.utf8Length ? this.utf16Length : this.utf8OffsetToUtf16[e] : e;
	}
	convertUtf16OffsetToUtf8(e) {
		return this.utf16OffsetToUtf8 ? e < 0 ? 0 : e > this.utf16Length ? this.utf8Length : this.utf16OffsetToUtf8[e] : e;
	}
	dispose() {
		this.ptr === e._sharedPtr ? e._sharedPtrInUse = !1 : this._onigBinding.ofree(this.ptr);
	}
};
U(ls, "LAST_ID", 0), U(ls, "_sharedPtr", 0), U(ls, "_sharedPtrInUse", !1);
var us = ls, ds = class {
	constructor(e) {
		if (U(this, "_onigBinding"), U(this, "_ptr"), !W) throw new es("Must invoke loadWasm first.");
		let t = [], n = [];
		for (let r = 0, i = e.length; r < i; r++) {
			let i = new cs(e[r]);
			t[r] = i.createString(W), n[r] = i.utf8Length;
		}
		let r = W.omalloc(4 * e.length);
		W.HEAPU32.set(t, r / 4);
		let i = W.omalloc(4 * e.length);
		W.HEAPU32.set(n, i / 4);
		let a = W.createOnigScanner(r, i, e.length);
		for (let n = 0, r = e.length; n < r; n++) W.ofree(t[n]);
		W.ofree(i), W.ofree(r), a === 0 && ss(W), this._onigBinding = W, this._ptr = a;
	}
	dispose() {
		this._onigBinding.freeOnigScanner(this._ptr);
	}
	findNextMatchSync(e, t, n) {
		let r = 0;
		if (typeof n == "number" && (r = n), typeof e == "string") {
			e = new us(e);
			let n = this._findNextMatchSync(e, t, !1, r);
			return e.dispose(), n;
		}
		return this._findNextMatchSync(e, t, !1, r);
	}
	_findNextMatchSync(e, t, n, r) {
		let i = this._onigBinding, a = i.findNextOnigScannerMatch(this._ptr, e.id, e.ptr, e.utf8Length, e.convertUtf16OffsetToUtf8(t), r);
		if (a === 0) return null;
		let o = i.HEAPU32, s = a / 4, c = o[s++], l = o[s++], u = [];
		for (let t = 0; t < l; t++) {
			let n = e.convertUtf8OffsetToUtf16(o[s++]), r = e.convertUtf8OffsetToUtf16(o[s++]);
			u[t] = {
				start: n,
				end: r,
				length: r - n
			};
		}
		return {
			index: c,
			captureIndices: u
		};
	}
};
function fs(e) {
	return typeof e.instantiator == "function";
}
function ps(e) {
	return typeof e.default == "function";
}
function ms(e) {
	return e.data !== void 0;
}
function hs(e) {
	return typeof Response < "u" && e instanceof Response;
}
function gs(e) {
	return typeof ArrayBuffer < "u" && (e instanceof ArrayBuffer || ArrayBuffer.isView(e)) || typeof Buffer < "u" && Buffer.isBuffer?.(e) || typeof SharedArrayBuffer < "u" && e instanceof SharedArrayBuffer || typeof Uint32Array < "u" && e instanceof Uint32Array;
}
var _s;
function vs(e) {
	if (_s) return _s;
	async function t() {
		W = await is(async (t) => {
			let n = e;
			return n = await n, typeof n == "function" && (n = await n(t)), typeof n == "function" && (n = await n(t)), fs(n) ? n = await n.instantiator(t) : ps(n) ? n = await n.default(t) : (ms(n) && (n = n.data), hs(n) ? n = typeof WebAssembly.instantiateStreaming == "function" ? await bs(n)(t) : await xs(n)(t) : gs(n) || n instanceof WebAssembly.Module ? n = await ys(n)(t) : "default" in n && n.default instanceof WebAssembly.Module && (n = await ys(n.default)(t))), "instance" in n && (n = n.instance), "exports" in n && (n = n.exports), n;
		});
	}
	return _s = t(), _s;
}
function ys(e) {
	return (t) => WebAssembly.instantiate(e, t);
}
function bs(e) {
	return (t) => WebAssembly.instantiateStreaming(e, t);
}
function xs(e) {
	return async (t) => {
		let n = await e.arrayBuffer();
		return WebAssembly.instantiate(n, t);
	};
}
var Ss;
function Cs(e) {
	Ss = e;
}
function ws() {
	return Ss;
}
async function Ts(e) {
	return e && await vs(e), {
		createScanner(e) {
			return new ds(e.map((e) => typeof e == "string" ? e : e.source));
		},
		createString(e) {
			return new us(e);
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/shiki@4.1.0/node_modules/shiki/dist/engine-oniguruma.mjs
var Es = /* @__PURE__ */ Go({});
qo(Es, $o);
//#endregion
//#region ../../node_modules/.pnpm/@shikijs+types@4.1.0/node_modules/@shikijs/types/dist/index.mjs
var G = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@shikijs+vscode-textmate@10.0.2/node_modules/@shikijs/vscode-textmate/dist/index.js
function Ds(e) {
	return Os(e);
}
function Os(e) {
	return Array.isArray(e) ? ks(e) : e instanceof RegExp ? e : typeof e == "object" ? As(e) : e;
}
function ks(e) {
	let t = [];
	for (let n = 0, r = e.length; n < r; n++) t[n] = Os(e[n]);
	return t;
}
function As(e) {
	let t = {};
	for (let n in e) t[n] = Os(e[n]);
	return t;
}
function js(e, ...t) {
	return t.forEach((t) => {
		for (let n in t) e[n] = t[n];
	}), e;
}
function Ms(e) {
	let t = ~e.lastIndexOf("/") || ~e.lastIndexOf("\\");
	return t === 0 ? e : ~t === e.length - 1 ? Ms(e.substring(0, e.length - 1)) : e.substr(~t + 1);
}
var Ns = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g, Ps = class {
	static hasCaptures(e) {
		return e === null ? !1 : (Ns.lastIndex = 0, Ns.test(e));
	}
	static replaceCaptures(e, t, n) {
		return e.replace(Ns, (e, r, i, a) => {
			let o = n[parseInt(r || i, 10)];
			if (o) {
				let e = t.substring(o.start, o.end);
				for (; e[0] === ".";) e = e.substring(1);
				switch (a) {
					case "downcase": return e.toLowerCase();
					case "upcase": return e.toUpperCase();
					default: return e;
				}
			} else return e;
		});
	}
};
function Fs(e, t) {
	return e < t ? -1 : +(e > t);
}
function Is(e, t) {
	if (e === null && t === null) return 0;
	if (!e) return -1;
	if (!t) return 1;
	let n = e.length, r = t.length;
	if (n === r) {
		for (let r = 0; r < n; r++) {
			let n = Fs(e[r], t[r]);
			if (n !== 0) return n;
		}
		return 0;
	}
	return n - r;
}
function Ls(e) {
	return !!(/^#[0-9a-f]{6}$/i.test(e) || /^#[0-9a-f]{8}$/i.test(e) || /^#[0-9a-f]{3}$/i.test(e) || /^#[0-9a-f]{4}$/i.test(e));
}
function Rs(e) {
	return e.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, "\\$&");
}
var zs = class {
	constructor(e) {
		this.fn = e;
	}
	cache = /* @__PURE__ */ new Map();
	get(e) {
		if (this.cache.has(e)) return this.cache.get(e);
		let t = this.fn(e);
		return this.cache.set(e, t), t;
	}
}, Bs = class {
	constructor(e, t, n) {
		this._colorMap = e, this._defaults = t, this._root = n;
	}
	static createFromRawTheme(e, t) {
		return this.createFromParsedTheme(Gs(e), t);
	}
	static createFromParsedTheme(e, t) {
		return qs(e, t);
	}
	_cachedMatchRoot = new zs((e) => this._root.match(e));
	getColorMap() {
		return this._colorMap.getColorMap();
	}
	getDefaults() {
		return this._defaults;
	}
	match(e) {
		if (e === null) return this._defaults;
		let t = e.scopeName, n = this._cachedMatchRoot.get(t).find((t) => Hs(e.parent, t.parentScopes));
		return n ? new Ws(n.fontStyle, n.foreground, n.background) : null;
	}
}, Vs = class e {
	constructor(e, t) {
		this.parent = e, this.scopeName = t;
	}
	static push(t, n) {
		for (let r of n) t = new e(t, r);
		return t;
	}
	static from(...t) {
		let n = null;
		for (let r = 0; r < t.length; r++) n = new e(n, t[r]);
		return n;
	}
	push(t) {
		return new e(this, t);
	}
	getSegments() {
		let e = this, t = [];
		for (; e;) t.push(e.scopeName), e = e.parent;
		return t.reverse(), t;
	}
	toString() {
		return this.getSegments().join(" ");
	}
	extends(e) {
		return this === e ? !0 : this.parent === null ? !1 : this.parent.extends(e);
	}
	getExtensionIfDefined(e) {
		let t = [], n = this;
		for (; n && n !== e;) t.push(n.scopeName), n = n.parent;
		return n === e ? t.reverse() : void 0;
	}
};
function Hs(e, t) {
	if (t.length === 0) return !0;
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = !1;
		if (r === ">") {
			if (n === t.length - 1) return !1;
			r = t[++n], i = !0;
		}
		for (; e && !Us(e.scopeName, r);) {
			if (i) return !1;
			e = e.parent;
		}
		if (!e) return !1;
		e = e.parent;
	}
	return !0;
}
function Us(e, t) {
	return t === e || e.startsWith(t) && e[t.length] === ".";
}
var Ws = class {
	constructor(e, t, n) {
		this.fontStyle = e, this.foregroundId = t, this.backgroundId = n;
	}
};
function Gs(e) {
	if (!e || !e.settings || !Array.isArray(e.settings)) return [];
	let t = e.settings, n = [], r = 0;
	for (let e = 0, i = t.length; e < i; e++) {
		let i = t[e];
		if (!i.settings) continue;
		let a;
		if (typeof i.scope == "string") {
			let e = i.scope;
			e = e.replace(/^[,]+/, ""), e = e.replace(/[,]+$/, ""), a = e.split(",");
		} else a = Array.isArray(i.scope) ? i.scope : [""];
		let o = -1;
		if (typeof i.settings.fontStyle == "string") {
			o = 0;
			let e = i.settings.fontStyle.split(" ");
			for (let t = 0, n = e.length; t < n; t++) switch (e[t]) {
				case "italic":
					o |= 1;
					break;
				case "bold":
					o |= 2;
					break;
				case "underline":
					o |= 4;
					break;
				case "strikethrough":
					o |= 8;
					break;
			}
		}
		let s = null;
		typeof i.settings.foreground == "string" && Ls(i.settings.foreground) && (s = i.settings.foreground);
		let c = null;
		typeof i.settings.background == "string" && Ls(i.settings.background) && (c = i.settings.background);
		for (let t = 0, i = a.length; t < i; t++) {
			let i = a[t].trim().split(" "), l = i[i.length - 1], u = null;
			i.length > 1 && (u = i.slice(0, i.length - 1), u.reverse()), n[r++] = new Ks(l, u, e, o, s, c);
		}
	}
	return n;
}
var Ks = class {
	constructor(e, t, n, r, i, a) {
		this.scope = e, this.parentScopes = t, this.index = n, this.fontStyle = r, this.foreground = i, this.background = a;
	}
}, K = /* @__PURE__ */ ((e) => (e[e.NotSet = -1] = "NotSet", e[e.None = 0] = "None", e[e.Italic = 1] = "Italic", e[e.Bold = 2] = "Bold", e[e.Underline = 4] = "Underline", e[e.Strikethrough = 8] = "Strikethrough", e))(K || {});
function qs(e, t) {
	e.sort((e, t) => {
		let n = Fs(e.scope, t.scope);
		return n !== 0 || (n = Is(e.parentScopes, t.parentScopes), n !== 0) ? n : e.index - t.index;
	});
	let n = 0, r = "#000000", i = "#ffffff";
	for (; e.length >= 1 && e[0].scope === "";) {
		let t = e.shift();
		t.fontStyle !== -1 && (n = t.fontStyle), t.foreground !== null && (r = t.foreground), t.background !== null && (i = t.background);
	}
	let a = new Js(t), o = new Ws(n, a.getId(r), a.getId(i)), s = new Zs(new Xs(0, null, -1, 0, 0), []);
	for (let t = 0, n = e.length; t < n; t++) {
		let n = e[t];
		s.insert(0, n.scope, n.parentScopes, n.fontStyle, a.getId(n.foreground), a.getId(n.background));
	}
	return new Bs(a, o, s);
}
var Js = class {
	_isFrozen;
	_lastColorId;
	_id2color;
	_color2id;
	constructor(e) {
		if (this._lastColorId = 0, this._id2color = [], this._color2id = /* @__PURE__ */ Object.create(null), Array.isArray(e)) {
			this._isFrozen = !0;
			for (let t = 0, n = e.length; t < n; t++) this._color2id[e[t]] = t, this._id2color[t] = e[t];
		} else this._isFrozen = !1;
	}
	getId(e) {
		if (e === null) return 0;
		e = e.toUpperCase();
		let t = this._color2id[e];
		if (t) return t;
		if (this._isFrozen) throw Error(`Missing color in color map - ${e}`);
		return t = ++this._lastColorId, this._color2id[e] = t, this._id2color[t] = e, t;
	}
	getColorMap() {
		return this._id2color.slice(0);
	}
}, Ys = Object.freeze([]), Xs = class e {
	scopeDepth;
	parentScopes;
	fontStyle;
	foreground;
	background;
	constructor(e, t, n, r, i) {
		this.scopeDepth = e, this.parentScopes = t || Ys, this.fontStyle = n, this.foreground = r, this.background = i;
	}
	clone() {
		return new e(this.scopeDepth, this.parentScopes, this.fontStyle, this.foreground, this.background);
	}
	static cloneArr(e) {
		let t = [];
		for (let n = 0, r = e.length; n < r; n++) t[n] = e[n].clone();
		return t;
	}
	acceptOverwrite(e, t, n, r) {
		this.scopeDepth > e ? console.log("how did this happen?") : this.scopeDepth = e, t !== -1 && (this.fontStyle = t), n !== 0 && (this.foreground = n), r !== 0 && (this.background = r);
	}
}, Zs = class e {
	constructor(e, t = [], n = {}) {
		this._mainRule = e, this._children = n, this._rulesWithParentScopes = t;
	}
	_rulesWithParentScopes;
	static _cmpBySpecificity(e, t) {
		if (e.scopeDepth !== t.scopeDepth) return t.scopeDepth - e.scopeDepth;
		let n = 0, r = 0;
		for (; e.parentScopes[n] === ">" && n++, t.parentScopes[r] === ">" && r++, !(n >= e.parentScopes.length || r >= t.parentScopes.length);) {
			let i = t.parentScopes[r].length - e.parentScopes[n].length;
			if (i !== 0) return i;
			n++, r++;
		}
		return t.parentScopes.length - e.parentScopes.length;
	}
	match(t) {
		if (t !== "") {
			let e = t.indexOf("."), n, r;
			if (e === -1 ? (n = t, r = "") : (n = t.substring(0, e), r = t.substring(e + 1)), this._children.hasOwnProperty(n)) return this._children[n].match(r);
		}
		let n = this._rulesWithParentScopes.concat(this._mainRule);
		return n.sort(e._cmpBySpecificity), n;
	}
	insert(t, n, r, i, a, o) {
		if (n === "") {
			this._doInsertHere(t, r, i, a, o);
			return;
		}
		let s = n.indexOf("."), c, l;
		s === -1 ? (c = n, l = "") : (c = n.substring(0, s), l = n.substring(s + 1));
		let u;
		this._children.hasOwnProperty(c) ? u = this._children[c] : (u = new e(this._mainRule.clone(), Xs.cloneArr(this._rulesWithParentScopes)), this._children[c] = u), u.insert(t + 1, l, r, i, a, o);
	}
	_doInsertHere(e, t, n, r, i) {
		if (t === null) {
			this._mainRule.acceptOverwrite(e, n, r, i);
			return;
		}
		for (let a = 0, o = this._rulesWithParentScopes.length; a < o; a++) {
			let o = this._rulesWithParentScopes[a];
			if (Is(o.parentScopes, t) === 0) {
				o.acceptOverwrite(e, n, r, i);
				return;
			}
		}
		n === -1 && (n = this._mainRule.fontStyle), r === 0 && (r = this._mainRule.foreground), i === 0 && (i = this._mainRule.background), this._rulesWithParentScopes.push(new Xs(e, t, n, r, i));
	}
}, Qs = class e {
	static toBinaryStr(e) {
		return e.toString(2).padStart(32, "0");
	}
	static print(t) {
		let n = e.getLanguageId(t), r = e.getTokenType(t), i = e.getFontStyle(t), a = e.getForeground(t), o = e.getBackground(t);
		console.log({
			languageId: n,
			tokenType: r,
			fontStyle: i,
			foreground: a,
			background: o
		});
	}
	static getLanguageId(e) {
		return (e & 255) >>> 0;
	}
	static getTokenType(e) {
		return (e & 768) >>> 8;
	}
	static containsBalancedBrackets(e) {
		return (e & 1024) != 0;
	}
	static getFontStyle(e) {
		return (e & 30720) >>> 11;
	}
	static getForeground(e) {
		return (e & 16744448) >>> 15;
	}
	static getBackground(e) {
		return (e & 4278190080) >>> 24;
	}
	static set(t, n, r, i, a, o, s) {
		let c = e.getLanguageId(t), l = e.getTokenType(t), u = +!!e.containsBalancedBrackets(t), d = e.getFontStyle(t), f = e.getForeground(t), p = e.getBackground(t);
		return n !== 0 && (c = n), r !== 8 && (l = ec(r)), i !== null && (u = +!!i), a !== -1 && (d = a), o !== 0 && (f = o), s !== 0 && (p = s), (c << 0 | l << 8 | u << 10 | d << 11 | f << 15 | p << 24) >>> 0;
	}
};
function $s(e) {
	return e;
}
function ec(e) {
	return e;
}
function tc(e, t) {
	let n = [], r = rc(e), i = r.next();
	for (; i !== null;) {
		let e = 0;
		if (i.length === 2 && i.charAt(1) === ":") {
			switch (i.charAt(0)) {
				case "R":
					e = 1;
					break;
				case "L":
					e = -1;
					break;
				default: console.log(`Unknown priority ${i} in scope selector`);
			}
			i = r.next();
		}
		let t = o();
		if (n.push({
			matcher: t,
			priority: e
		}), i !== ",") break;
		i = r.next();
	}
	return n;
	function a() {
		if (i === "-") {
			i = r.next();
			let e = a();
			return (t) => !!e && !e(t);
		}
		if (i === "(") {
			i = r.next();
			let e = s();
			return i === ")" && (i = r.next()), e;
		}
		if (nc(i)) {
			let e = [];
			do
				e.push(i), i = r.next();
			while (nc(i));
			return (n) => t(e, n);
		}
		return null;
	}
	function o() {
		let e = [], t = a();
		for (; t;) e.push(t), t = a();
		return (t) => e.every((e) => e(t));
	}
	function s() {
		let e = [], t = o();
		for (; t && (e.push(t), i === "|" || i === ",");) {
			do
				i = r.next();
			while (i === "|" || i === ",");
			t = o();
		}
		return (t) => e.some((e) => e(t));
	}
}
function nc(e) {
	return !!e && !!e.match(/[\w\.:]+/);
}
function rc(e) {
	let t = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g, n = t.exec(e);
	return { next: () => {
		if (!n) return null;
		let r = n[0];
		return n = t.exec(e), r;
	} };
}
function ic(e) {
	typeof e.dispose == "function" && e.dispose();
}
var ac = class {
	constructor(e) {
		this.scopeName = e;
	}
	toKey() {
		return this.scopeName;
	}
}, oc = class {
	constructor(e, t) {
		this.scopeName = e, this.ruleName = t;
	}
	toKey() {
		return `${this.scopeName}#${this.ruleName}`;
	}
}, sc = class {
	_references = [];
	_seenReferenceKeys = /* @__PURE__ */ new Set();
	get references() {
		return this._references;
	}
	visitedRule = /* @__PURE__ */ new Set();
	add(e) {
		let t = e.toKey();
		this._seenReferenceKeys.has(t) || (this._seenReferenceKeys.add(t), this._references.push(e));
	}
}, cc = class {
	constructor(e, t) {
		this.repo = e, this.initialScopeName = t, this.seenFullScopeRequests.add(this.initialScopeName), this.Q = [new ac(this.initialScopeName)];
	}
	seenFullScopeRequests = /* @__PURE__ */ new Set();
	seenPartialScopeRequests = /* @__PURE__ */ new Set();
	Q;
	processQueue() {
		let e = this.Q;
		this.Q = [];
		let t = new sc();
		for (let n of e) lc(n, this.initialScopeName, this.repo, t);
		for (let e of t.references) if (e instanceof ac) {
			if (this.seenFullScopeRequests.has(e.scopeName)) continue;
			this.seenFullScopeRequests.add(e.scopeName), this.Q.push(e);
		} else {
			if (this.seenFullScopeRequests.has(e.scopeName) || this.seenPartialScopeRequests.has(e.toKey())) continue;
			this.seenPartialScopeRequests.add(e.toKey()), this.Q.push(e);
		}
	}
};
function lc(e, t, n, r) {
	let i = n.lookup(e.scopeName);
	if (!i) {
		if (e.scopeName === t) throw Error(`No grammar provided for <${t}>`);
		return;
	}
	let a = n.lookup(t);
	e instanceof ac ? dc({
		baseGrammar: a,
		selfGrammar: i
	}, r) : uc(e.ruleName, {
		baseGrammar: a,
		selfGrammar: i,
		repository: i.repository
	}, r);
	let o = n.injections(e.scopeName);
	if (o) for (let e of o) r.add(new ac(e));
}
function uc(e, t, n) {
	if (t.repository && t.repository[e]) {
		let r = t.repository[e];
		fc([r], t, n);
	}
}
function dc(e, t) {
	e.selfGrammar.patterns && Array.isArray(e.selfGrammar.patterns) && fc(e.selfGrammar.patterns, {
		...e,
		repository: e.selfGrammar.repository
	}, t), e.selfGrammar.injections && fc(Object.values(e.selfGrammar.injections), {
		...e,
		repository: e.selfGrammar.repository
	}, t);
}
function fc(e, t, n) {
	for (let r of e) {
		if (n.visitedRule.has(r)) continue;
		n.visitedRule.add(r);
		let e = r.repository ? js({}, t.repository, r.repository) : t.repository;
		Array.isArray(r.patterns) && fc(r.patterns, {
			...t,
			repository: e
		}, n);
		let i = r.include;
		if (!i) continue;
		let a = vc(i);
		switch (a.kind) {
			case 0:
				dc({
					...t,
					selfGrammar: t.baseGrammar
				}, n);
				break;
			case 1:
				dc(t, n);
				break;
			case 2:
				uc(a.ruleName, {
					...t,
					repository: e
				}, n);
				break;
			case 3:
			case 4:
				let r = a.scopeName === t.selfGrammar.scopeName ? t.selfGrammar : a.scopeName === t.baseGrammar.scopeName ? t.baseGrammar : void 0;
				if (r) {
					let i = {
						baseGrammar: t.baseGrammar,
						selfGrammar: r,
						repository: e
					};
					a.kind === 4 ? uc(a.ruleName, i, n) : dc(i, n);
				} else a.kind === 4 ? n.add(new oc(a.scopeName, a.ruleName)) : n.add(new ac(a.scopeName));
				break;
		}
	}
}
var pc = class {
	kind = 0;
}, mc = class {
	kind = 1;
}, hc = class {
	constructor(e) {
		this.ruleName = e;
	}
	kind = 2;
}, gc = class {
	constructor(e) {
		this.scopeName = e;
	}
	kind = 3;
}, _c = class {
	constructor(e, t) {
		this.scopeName = e, this.ruleName = t;
	}
	kind = 4;
};
function vc(e) {
	if (e === "$base") return new pc();
	if (e === "$self") return new mc();
	let t = e.indexOf("#");
	return t === -1 ? new gc(e) : t === 0 ? new hc(e.substring(1)) : new _c(e.substring(0, t), e.substring(t + 1));
}
var yc = /\\(\d+)/, bc = /\\(\d+)/g, xc = -1, Sc = -2;
function Cc(e) {
	return e;
}
function wc(e) {
	return e;
}
var Tc = class {
	$location;
	id;
	_nameIsCapturing;
	_name;
	_contentNameIsCapturing;
	_contentName;
	constructor(e, t, n, r) {
		this.$location = e, this.id = t, this._name = n || null, this._nameIsCapturing = Ps.hasCaptures(this._name), this._contentName = r || null, this._contentNameIsCapturing = Ps.hasCaptures(this._contentName);
	}
	get debugName() {
		let e = this.$location ? `${Ms(this.$location.filename)}:${this.$location.line}` : "unknown";
		return `${this.constructor.name}#${this.id} @ ${e}`;
	}
	getName(e, t) {
		return !this._nameIsCapturing || this._name === null || e === null || t === null ? this._name : Ps.replaceCaptures(this._name, e, t);
	}
	getContentName(e, t) {
		return !this._contentNameIsCapturing || this._contentName === null ? this._contentName : Ps.replaceCaptures(this._contentName, e, t);
	}
}, Ec = class extends Tc {
	retokenizeCapturedWithRuleId;
	constructor(e, t, n, r, i) {
		super(e, t, n, r), this.retokenizeCapturedWithRuleId = i;
	}
	dispose() {}
	collectPatterns(e, t) {
		throw Error("Not supported!");
	}
	compile(e, t) {
		throw Error("Not supported!");
	}
	compileAG(e, t, n, r) {
		throw Error("Not supported!");
	}
}, Dc = class extends Tc {
	_match;
	captures;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i) {
		super(e, t, n, null), this._match = new Mc(r, this.id), this.captures = i, this._cachedCompiledPatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null);
	}
	get debugMatchRegExp() {
		return `${this._match.source}`;
	}
	collectPatterns(e, t) {
		t.push(this._match);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e) {
		return this._cachedCompiledPatterns || (this._cachedCompiledPatterns = new Nc(), this.collectPatterns(e, this._cachedCompiledPatterns)), this._cachedCompiledPatterns;
	}
}, Oc = class extends Tc {
	hasMissingPatterns;
	patterns;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i) {
		super(e, t, n, r), this.patterns = i.patterns, this.hasMissingPatterns = i.hasMissingPatterns, this._cachedCompiledPatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null);
	}
	collectPatterns(e, t) {
		for (let n of this.patterns) e.getRule(n).collectPatterns(e, t);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e) {
		return this._cachedCompiledPatterns || (this._cachedCompiledPatterns = new Nc(), this.collectPatterns(e, this._cachedCompiledPatterns)), this._cachedCompiledPatterns;
	}
}, kc = class extends Tc {
	_begin;
	beginCaptures;
	_end;
	endHasBackReferences;
	endCaptures;
	applyEndPatternLast;
	hasMissingPatterns;
	patterns;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i, a, o, s, c, l) {
		super(e, t, n, r), this._begin = new Mc(i, this.id), this.beginCaptures = a, this._end = new Mc(o || "￿", -1), this.endHasBackReferences = this._end.hasBackReferences, this.endCaptures = s, this.applyEndPatternLast = c || !1, this.patterns = l.patterns, this.hasMissingPatterns = l.hasMissingPatterns, this._cachedCompiledPatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null);
	}
	get debugBeginRegExp() {
		return `${this._begin.source}`;
	}
	get debugEndRegExp() {
		return `${this._end.source}`;
	}
	getEndWithResolvedBackReferences(e, t) {
		return this._end.resolveBackReferences(e, t);
	}
	collectPatterns(e, t) {
		t.push(this._begin);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e, t).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e, t).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e, t) {
		if (!this._cachedCompiledPatterns) {
			this._cachedCompiledPatterns = new Nc();
			for (let t of this.patterns) e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
			this.applyEndPatternLast ? this._cachedCompiledPatterns.push(this._end.hasBackReferences ? this._end.clone() : this._end) : this._cachedCompiledPatterns.unshift(this._end.hasBackReferences ? this._end.clone() : this._end);
		}
		return this._end.hasBackReferences && (this.applyEndPatternLast ? this._cachedCompiledPatterns.setSource(this._cachedCompiledPatterns.length() - 1, t) : this._cachedCompiledPatterns.setSource(0, t)), this._cachedCompiledPatterns;
	}
}, Ac = class extends Tc {
	_begin;
	beginCaptures;
	whileCaptures;
	_while;
	whileHasBackReferences;
	hasMissingPatterns;
	patterns;
	_cachedCompiledPatterns;
	_cachedCompiledWhilePatterns;
	constructor(e, t, n, r, i, a, o, s, c) {
		super(e, t, n, r), this._begin = new Mc(i, this.id), this.beginCaptures = a, this.whileCaptures = s, this._while = new Mc(o, Sc), this.whileHasBackReferences = this._while.hasBackReferences, this.patterns = c.patterns, this.hasMissingPatterns = c.hasMissingPatterns, this._cachedCompiledPatterns = null, this._cachedCompiledWhilePatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null), this._cachedCompiledWhilePatterns &&= (this._cachedCompiledWhilePatterns.dispose(), null);
	}
	get debugBeginRegExp() {
		return `${this._begin.source}`;
	}
	get debugWhileRegExp() {
		return `${this._while.source}`;
	}
	getWhileWithResolvedBackReferences(e, t) {
		return this._while.resolveBackReferences(e, t);
	}
	collectPatterns(e, t) {
		t.push(this._begin);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e) {
		if (!this._cachedCompiledPatterns) {
			this._cachedCompiledPatterns = new Nc();
			for (let t of this.patterns) e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
		}
		return this._cachedCompiledPatterns;
	}
	compileWhile(e, t) {
		return this._getCachedCompiledWhilePatterns(e, t).compile(e);
	}
	compileWhileAG(e, t, n, r) {
		return this._getCachedCompiledWhilePatterns(e, t).compileAG(e, n, r);
	}
	_getCachedCompiledWhilePatterns(e, t) {
		return this._cachedCompiledWhilePatterns || (this._cachedCompiledWhilePatterns = new Nc(), this._cachedCompiledWhilePatterns.push(this._while.hasBackReferences ? this._while.clone() : this._while)), this._while.hasBackReferences && this._cachedCompiledWhilePatterns.setSource(0, t || "￿"), this._cachedCompiledWhilePatterns;
	}
}, jc = class e {
	static createCaptureRule(e, t, n, r, i) {
		return e.registerRule((e) => new Ec(t, e, n, r, i));
	}
	static getCompiledRuleId(t, n, r) {
		return t.id || n.registerRule((i) => {
			if (t.id = i, t.match) return new Dc(t.$vscodeTextmateLocation, t.id, t.name, t.match, e._compileCaptures(t.captures, n, r));
			if (t.begin === void 0) {
				t.repository && (r = js({}, r, t.repository));
				let i = t.patterns;
				return i === void 0 && t.include && (i = [{ include: t.include }]), new Oc(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, e._compilePatterns(i, n, r));
			}
			return t.while ? new Ac(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, t.begin, e._compileCaptures(t.beginCaptures || t.captures, n, r), t.while, e._compileCaptures(t.whileCaptures || t.captures, n, r), e._compilePatterns(t.patterns, n, r)) : new kc(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, t.begin, e._compileCaptures(t.beginCaptures || t.captures, n, r), t.end, e._compileCaptures(t.endCaptures || t.captures, n, r), t.applyEndPatternLast, e._compilePatterns(t.patterns, n, r));
		}), t.id;
	}
	static _compileCaptures(t, n, r) {
		let i = [];
		if (t) {
			let a = 0;
			for (let e in t) {
				if (e === "$vscodeTextmateLocation") continue;
				let t = parseInt(e, 10);
				t > a && (a = t);
			}
			for (let e = 0; e <= a; e++) i[e] = null;
			for (let a in t) {
				if (a === "$vscodeTextmateLocation") continue;
				let o = parseInt(a, 10), s = 0;
				t[a].patterns && (s = e.getCompiledRuleId(t[a], n, r)), i[o] = e.createCaptureRule(n, t[a].$vscodeTextmateLocation, t[a].name, t[a].contentName, s);
			}
		}
		return i;
	}
	static _compilePatterns(t, n, r) {
		let i = [];
		if (t) for (let a = 0, o = t.length; a < o; a++) {
			let o = t[a], s = -1;
			if (o.include) {
				let t = vc(o.include);
				switch (t.kind) {
					case 0:
					case 1:
						s = e.getCompiledRuleId(r[o.include], n, r);
						break;
					case 2:
						let i = r[t.ruleName];
						i && (s = e.getCompiledRuleId(i, n, r));
						break;
					case 3:
					case 4:
						let a = t.scopeName, c = t.kind === 4 ? t.ruleName : null, l = n.getExternalGrammar(a, r);
						if (l) if (c) {
							let t = l.repository[c];
							t && (s = e.getCompiledRuleId(t, n, l.repository));
						} else s = e.getCompiledRuleId(l.repository.$self, n, l.repository);
						break;
				}
			} else s = e.getCompiledRuleId(o, n, r);
			if (s !== -1) {
				let e = n.getRule(s), t = !1;
				if ((e instanceof Oc || e instanceof kc || e instanceof Ac) && e.hasMissingPatterns && e.patterns.length === 0 && (t = !0), t) continue;
				i.push(s);
			}
		}
		return {
			patterns: i,
			hasMissingPatterns: (t ? t.length : 0) !== i.length
		};
	}
}, Mc = class e {
	source;
	ruleId;
	hasAnchor;
	hasBackReferences;
	_anchorCache;
	constructor(e, t) {
		if (e && typeof e == "string") {
			let t = e.length, n = 0, r = [], i = !1;
			for (let a = 0; a < t; a++) if (e.charAt(a) === "\\" && a + 1 < t) {
				let t = e.charAt(a + 1);
				t === "z" ? (r.push(e.substring(n, a)), r.push("$(?!\\n)(?<!\\n)"), n = a + 2) : (t === "A" || t === "G") && (i = !0), a++;
			}
			this.hasAnchor = i, n === 0 ? this.source = e : (r.push(e.substring(n, t)), this.source = r.join(""));
		} else this.hasAnchor = !1, this.source = e;
		this.hasAnchor ? this._anchorCache = this._buildAnchorCache() : this._anchorCache = null, this.ruleId = t, typeof this.source == "string" ? this.hasBackReferences = yc.test(this.source) : this.hasBackReferences = !1;
	}
	clone() {
		return new e(this.source, this.ruleId);
	}
	setSource(e) {
		this.source !== e && (this.source = e, this.hasAnchor && (this._anchorCache = this._buildAnchorCache()));
	}
	resolveBackReferences(e, t) {
		if (typeof this.source != "string") throw Error("This method should only be called if the source is a string");
		let n = t.map((t) => e.substring(t.start, t.end));
		return bc.lastIndex = 0, this.source.replace(bc, (e, t) => Rs(n[parseInt(t, 10)] || ""));
	}
	_buildAnchorCache() {
		if (typeof this.source != "string") throw Error("This method should only be called if the source is a string");
		let e = [], t = [], n = [], r = [], i, a, o, s;
		for (i = 0, a = this.source.length; i < a; i++) o = this.source.charAt(i), e[i] = o, t[i] = o, n[i] = o, r[i] = o, o === "\\" && i + 1 < a && (s = this.source.charAt(i + 1), s === "A" ? (e[i + 1] = "￿", t[i + 1] = "￿", n[i + 1] = "A", r[i + 1] = "A") : s === "G" ? (e[i + 1] = "￿", t[i + 1] = "G", n[i + 1] = "￿", r[i + 1] = "G") : (e[i + 1] = s, t[i + 1] = s, n[i + 1] = s, r[i + 1] = s), i++);
		return {
			A0_G0: e.join(""),
			A0_G1: t.join(""),
			A1_G0: n.join(""),
			A1_G1: r.join("")
		};
	}
	resolveAnchors(e, t) {
		return !this.hasAnchor || !this._anchorCache || typeof this.source != "string" ? this.source : e ? t ? this._anchorCache.A1_G1 : this._anchorCache.A1_G0 : t ? this._anchorCache.A0_G1 : this._anchorCache.A0_G0;
	}
}, Nc = class {
	_items;
	_hasAnchors;
	_cached;
	_anchorCache;
	constructor() {
		this._items = [], this._hasAnchors = !1, this._cached = null, this._anchorCache = {
			A0_G0: null,
			A0_G1: null,
			A1_G0: null,
			A1_G1: null
		};
	}
	dispose() {
		this._disposeCaches();
	}
	_disposeCaches() {
		this._cached &&= (this._cached.dispose(), null), this._anchorCache.A0_G0 && (this._anchorCache.A0_G0.dispose(), this._anchorCache.A0_G0 = null), this._anchorCache.A0_G1 && (this._anchorCache.A0_G1.dispose(), this._anchorCache.A0_G1 = null), this._anchorCache.A1_G0 && (this._anchorCache.A1_G0.dispose(), this._anchorCache.A1_G0 = null), this._anchorCache.A1_G1 && (this._anchorCache.A1_G1.dispose(), this._anchorCache.A1_G1 = null);
	}
	push(e) {
		this._items.push(e), this._hasAnchors = this._hasAnchors || e.hasAnchor;
	}
	unshift(e) {
		this._items.unshift(e), this._hasAnchors = this._hasAnchors || e.hasAnchor;
	}
	length() {
		return this._items.length;
	}
	setSource(e, t) {
		this._items[e].source !== t && (this._disposeCaches(), this._items[e].setSource(t));
	}
	compile(e) {
		if (!this._cached) {
			let t = this._items.map((e) => e.source);
			this._cached = new Pc(e, t, this._items.map((e) => e.ruleId));
		}
		return this._cached;
	}
	compileAG(e, t, n) {
		return this._hasAnchors ? t ? n ? (this._anchorCache.A1_G1 || (this._anchorCache.A1_G1 = this._resolveAnchors(e, t, n)), this._anchorCache.A1_G1) : (this._anchorCache.A1_G0 || (this._anchorCache.A1_G0 = this._resolveAnchors(e, t, n)), this._anchorCache.A1_G0) : n ? (this._anchorCache.A0_G1 || (this._anchorCache.A0_G1 = this._resolveAnchors(e, t, n)), this._anchorCache.A0_G1) : (this._anchorCache.A0_G0 || (this._anchorCache.A0_G0 = this._resolveAnchors(e, t, n)), this._anchorCache.A0_G0) : this.compile(e);
	}
	_resolveAnchors(e, t, n) {
		return new Pc(e, this._items.map((e) => e.resolveAnchors(t, n)), this._items.map((e) => e.ruleId));
	}
}, Pc = class {
	constructor(e, t, n) {
		this.regExps = t, this.rules = n, this.scanner = e.createOnigScanner(t);
	}
	scanner;
	dispose() {
		typeof this.scanner.dispose == "function" && this.scanner.dispose();
	}
	toString() {
		let e = [];
		for (let t = 0, n = this.rules.length; t < n; t++) e.push("   - " + this.rules[t] + ": " + this.regExps[t]);
		return e.join("\n");
	}
	findNextMatchSync(e, t, n) {
		let r = this.scanner.findNextMatchSync(e, t, n);
		return r ? {
			ruleId: this.rules[r.index],
			captureIndices: r.captureIndices
		} : null;
	}
}, Fc = class {
	constructor(e, t) {
		this.languageId = e, this.tokenType = t;
	}
}, Ic = class e {
	_defaultAttributes;
	_embeddedLanguagesMatcher;
	constructor(e, t) {
		this._defaultAttributes = new Fc(e, 8), this._embeddedLanguagesMatcher = new Lc(Object.entries(t || {}));
	}
	getDefaultAttributes() {
		return this._defaultAttributes;
	}
	getBasicScopeAttributes(t) {
		return t === null ? e._NULL_SCOPE_METADATA : this._getBasicScopeAttributes.get(t);
	}
	static _NULL_SCOPE_METADATA = new Fc(0, 0);
	_getBasicScopeAttributes = new zs((e) => new Fc(this._scopeToLanguage(e), this._toStandardTokenType(e)));
	_scopeToLanguage(e) {
		return this._embeddedLanguagesMatcher.match(e) || 0;
	}
	_toStandardTokenType(t) {
		let n = t.match(e.STANDARD_TOKEN_TYPE_REGEXP);
		if (!n) return 8;
		switch (n[1]) {
			case "comment": return 1;
			case "string": return 2;
			case "regex": return 3;
			case "meta.embedded": return 0;
		}
		throw Error("Unexpected match for standard token type!");
	}
	static STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|meta\.embedded)\b/;
}, Lc = class {
	values;
	scopesRegExp;
	constructor(e) {
		if (e.length === 0) this.values = null, this.scopesRegExp = null;
		else {
			this.values = new Map(e);
			let t = e.map(([e, t]) => Rs(e));
			t.sort(), t.reverse(), this.scopesRegExp = RegExp(`^((${t.join(")|(")}))($|\\.)`, "");
		}
	}
	match(e) {
		if (!this.scopesRegExp) return;
		let t = e.match(this.scopesRegExp);
		if (t) return this.values.get(t[1]);
	}
};
typeof process < "u" && process.env.VSCODE_TEXTMATE_DEBUG;
var Rc = !1, zc = class {
	constructor(e, t) {
		this.stack = e, this.stoppedEarly = t;
	}
};
function Bc(e, t, n, r, i, a, o, s) {
	let c = t.content.length, l = !1, u = -1;
	if (o) {
		let o = Vc(e, t, n, r, i, a);
		i = o.stack, r = o.linePos, n = o.isFirstLine, u = o.anchorPosition;
	}
	let d = Date.now();
	for (; !l;) {
		if (s !== 0 && Date.now() - d > s) return new zc(i, !0);
		f();
	}
	return new zc(i, !1);
	function f() {
		let o = Hc(e, t, n, r, i, u);
		if (!o) {
			a.produce(i, c), l = !0;
			return;
		}
		let s = o.captureIndices, d = o.matchedRuleId, f = s && s.length > 0 ? s[0].end > r : !1;
		if (d === xc) {
			let o = i.getRule(e);
			a.produce(i, s[0].start), i = i.withContentNameScopesList(i.nameScopesList), Jc(e, t, n, i, a, o.endCaptures, s), a.produce(i, s[0].end);
			let d = i;
			if (i = i.parent, u = d.getAnchorPos(), !f && d.getEnterPos() === r) {
				i = d, a.produce(i, c), l = !0;
				return;
			}
		} else {
			let o = e.getRule(d);
			a.produce(i, s[0].start);
			let p = i, m = o.getName(t.content, s), h = i.contentNameScopesList.pushAttributed(m, e);
			if (i = i.push(d, r, u, s[0].end === c, null, h, h), o instanceof kc) {
				let r = o;
				Jc(e, t, n, i, a, r.beginCaptures, s), a.produce(i, s[0].end), u = s[0].end;
				let d = r.getContentName(t.content, s), m = h.pushAttributed(d, e);
				if (i = i.withContentNameScopesList(m), r.endHasBackReferences && (i = i.withEndRule(r.getEndWithResolvedBackReferences(t.content, s))), !f && p.hasSameRuleAs(i)) {
					i = i.pop(), a.produce(i, c), l = !0;
					return;
				}
			} else if (o instanceof Ac) {
				let r = o;
				Jc(e, t, n, i, a, r.beginCaptures, s), a.produce(i, s[0].end), u = s[0].end;
				let d = r.getContentName(t.content, s), m = h.pushAttributed(d, e);
				if (i = i.withContentNameScopesList(m), r.whileHasBackReferences && (i = i.withEndRule(r.getWhileWithResolvedBackReferences(t.content, s))), !f && p.hasSameRuleAs(i)) {
					i = i.pop(), a.produce(i, c), l = !0;
					return;
				}
			} else if (Jc(e, t, n, i, a, o.captures, s), a.produce(i, s[0].end), i = i.pop(), !f) {
				i = i.safePop(), a.produce(i, c), l = !0;
				return;
			}
		}
		s[0].end > r && (r = s[0].end, n = !1);
	}
}
function Vc(e, t, n, r, i, a) {
	let o = i.beginRuleCapturedEOL ? 0 : -1, s = [];
	for (let t = i; t; t = t.pop()) {
		let n = t.getRule(e);
		n instanceof Ac && s.push({
			rule: n,
			stack: t
		});
	}
	for (let c = s.pop(); c; c = s.pop()) {
		let { ruleScanner: s, findOptions: l } = Kc(c.rule, e, c.stack.endRule, n, r === o), u = s.findNextMatchSync(t, r, l);
		if (u) {
			if (u.ruleId !== Sc) {
				i = c.stack.pop();
				break;
			}
			u.captureIndices && u.captureIndices.length && (a.produce(c.stack, u.captureIndices[0].start), Jc(e, t, n, c.stack, a, c.rule.whileCaptures, u.captureIndices), a.produce(c.stack, u.captureIndices[0].end), o = u.captureIndices[0].end, u.captureIndices[0].end > r && (r = u.captureIndices[0].end, n = !1));
		} else {
			i = c.stack.pop();
			break;
		}
	}
	return {
		stack: i,
		linePos: r,
		anchorPosition: o,
		isFirstLine: n
	};
}
function Hc(e, t, n, r, i, a) {
	let o = Uc(e, t, n, r, i, a), s = e.getInjections();
	if (s.length === 0) return o;
	let c = Wc(s, e, t, n, r, i, a);
	if (!c) return o;
	if (!o) return c;
	let l = o.captureIndices[0].start, u = c.captureIndices[0].start;
	return u < l || c.priorityMatch && u === l ? c : o;
}
function Uc(e, t, n, r, i, a) {
	let { ruleScanner: o, findOptions: s } = Gc(i.getRule(e), e, i.endRule, n, r === a), c = o.findNextMatchSync(t, r, s);
	return c ? {
		captureIndices: c.captureIndices,
		matchedRuleId: c.ruleId
	} : null;
}
function Wc(e, t, n, r, i, a, o) {
	let s = Number.MAX_VALUE, c = null, l, u = 0, d = a.contentNameScopesList.getScopeNames();
	for (let a = 0, f = e.length; a < f; a++) {
		let f = e[a];
		if (!f.matcher(d)) continue;
		let { ruleScanner: p, findOptions: m } = Gc(t.getRule(f.ruleId), t, null, r, i === o), h = p.findNextMatchSync(n, i, m);
		if (!h) continue;
		let g = h.captureIndices[0].start;
		if (!(g >= s) && (s = g, c = h.captureIndices, l = h.ruleId, u = f.priority, s === i)) break;
	}
	return c ? {
		priorityMatch: u === -1,
		captureIndices: c,
		matchedRuleId: l
	} : null;
}
function Gc(e, t, n, r, i) {
	return Rc ? {
		ruleScanner: e.compile(t, n),
		findOptions: qc(r, i)
	} : {
		ruleScanner: e.compileAG(t, n, r, i),
		findOptions: 0
	};
}
function Kc(e, t, n, r, i) {
	return Rc ? {
		ruleScanner: e.compileWhile(t, n),
		findOptions: qc(r, i)
	} : {
		ruleScanner: e.compileWhileAG(t, n, r, i),
		findOptions: 0
	};
}
function qc(e, t) {
	let n = 0;
	return e || (n |= 1), t || (n |= 4), n;
}
function Jc(e, t, n, r, i, a, o) {
	if (a.length === 0) return;
	let s = t.content, c = Math.min(a.length, o.length), l = [], u = o[0].end;
	for (let t = 0; t < c; t++) {
		let c = a[t];
		if (c === null) continue;
		let d = o[t];
		if (d.length === 0) continue;
		if (d.start > u) break;
		for (; l.length > 0 && l[l.length - 1].endPos <= d.start;) i.produceFromScopes(l[l.length - 1].scopes, l[l.length - 1].endPos), l.pop();
		if (l.length > 0 ? i.produceFromScopes(l[l.length - 1].scopes, d.start) : i.produce(r, d.start), c.retokenizeCapturedWithRuleId) {
			let t = c.getName(s, o), a = r.contentNameScopesList.pushAttributed(t, e), l = c.getContentName(s, o), u = a.pushAttributed(l, e), f = r.push(c.retokenizeCapturedWithRuleId, d.start, -1, !1, null, a, u), p = e.createOnigString(s.substring(0, d.end));
			Bc(e, p, n && d.start === 0, d.start, f, i, !1, 0), ic(p);
			continue;
		}
		let f = c.getName(s, o);
		if (f !== null) {
			let t = (l.length > 0 ? l[l.length - 1].scopes : r.contentNameScopesList).pushAttributed(f, e);
			l.push(new Yc(t, d.end));
		}
	}
	for (; l.length > 0;) i.produceFromScopes(l[l.length - 1].scopes, l[l.length - 1].endPos), l.pop();
}
var Yc = class {
	scopes;
	endPos;
	constructor(e, t) {
		this.scopes = e, this.endPos = t;
	}
};
function Xc(e, t, n, r, i, a, o, s) {
	return new el(e, t, n, r, i, a, o, s);
}
function Zc(e, t, n, r, i) {
	let a = tc(t, Qc), o = jc.getCompiledRuleId(n, r, i.repository);
	for (let n of a) e.push({
		debugSelector: t,
		matcher: n.matcher,
		ruleId: o,
		grammar: i,
		priority: n.priority
	});
}
function Qc(e, t) {
	if (t.length < e.length) return !1;
	let n = 0;
	return e.every((e) => {
		for (let r = n; r < t.length; r++) if ($c(t[r], e)) return n = r + 1, !0;
		return !1;
	});
}
function $c(e, t) {
	if (!e) return !1;
	if (e === t) return !0;
	let n = t.length;
	return e.length > n && e.substr(0, n) === t && e[n] === ".";
}
var el = class {
	constructor(e, t, n, r, i, a, o, s) {
		if (this._rootScopeName = e, this.balancedBracketSelectors = a, this._onigLib = s, this._basicScopeAttributesProvider = new Ic(n, r), this._rootId = -1, this._lastRuleId = 0, this._ruleId2desc = [null], this._includedGrammars = {}, this._grammarRepository = o, this._grammar = tl(t, null), this._injections = null, this._tokenTypeMatchers = [], i) for (let e of Object.keys(i)) {
			let t = tc(e, Qc);
			for (let n of t) this._tokenTypeMatchers.push({
				matcher: n.matcher,
				type: i[e]
			});
		}
	}
	_rootId;
	_lastRuleId;
	_ruleId2desc;
	_includedGrammars;
	_grammarRepository;
	_grammar;
	_injections;
	_basicScopeAttributesProvider;
	_tokenTypeMatchers;
	get themeProvider() {
		return this._grammarRepository;
	}
	dispose() {
		for (let e of this._ruleId2desc) e && e.dispose();
	}
	createOnigScanner(e) {
		return this._onigLib.createOnigScanner(e);
	}
	createOnigString(e) {
		return this._onigLib.createOnigString(e);
	}
	getMetadataForScope(e) {
		return this._basicScopeAttributesProvider.getBasicScopeAttributes(e);
	}
	_collectInjections() {
		let e = {
			lookup: (e) => e === this._rootScopeName ? this._grammar : this.getExternalGrammar(e),
			injections: (e) => this._grammarRepository.injections(e)
		}, t = [], n = this._rootScopeName, r = e.lookup(n);
		if (r) {
			let e = r.injections;
			if (e) for (let n in e) Zc(t, n, e[n], this, r);
			let i = this._grammarRepository.injections(n);
			i && i.forEach((e) => {
				let n = this.getExternalGrammar(e);
				if (n) {
					let e = n.injectionSelector;
					e && Zc(t, e, n, this, n);
				}
			});
		}
		return t.sort((e, t) => e.priority - t.priority), t;
	}
	getInjections() {
		return this._injections === null && (this._injections = this._collectInjections()), this._injections;
	}
	registerRule(e) {
		let t = ++this._lastRuleId, n = e(Cc(t));
		return this._ruleId2desc[t] = n, n;
	}
	getRule(e) {
		return this._ruleId2desc[wc(e)];
	}
	getExternalGrammar(e, t) {
		if (this._includedGrammars[e]) return this._includedGrammars[e];
		if (this._grammarRepository) {
			let n = this._grammarRepository.lookup(e);
			if (n) return this._includedGrammars[e] = tl(n, t && t.$base), this._includedGrammars[e];
		}
	}
	tokenizeLine(e, t, n = 0) {
		let r = this._tokenize(e, t, !1, n);
		return {
			tokens: r.lineTokens.getResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly
		};
	}
	tokenizeLine2(e, t, n = 0) {
		let r = this._tokenize(e, t, !0, n);
		return {
			tokens: r.lineTokens.getBinaryResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly
		};
	}
	_tokenize(e, t, n, r) {
		this._rootId === -1 && (this._rootId = jc.getCompiledRuleId(this._grammar.repository.$self, this, this._grammar.repository), this.getInjections());
		let i;
		if (!t || t === rl.NULL) {
			i = !0;
			let e = this._basicScopeAttributesProvider.getDefaultAttributes(), n = this.themeProvider.getDefaults(), r = Qs.set(0, e.languageId, e.tokenType, null, n.fontStyle, n.foregroundId, n.backgroundId), a = this.getRule(this._rootId).getName(null, null), o;
			o = a ? nl.createRootAndLookUpScopeName(a, r, this) : nl.createRoot("unknown", r), t = new rl(null, this._rootId, -1, -1, !1, null, o, o);
		} else i = !1, t.reset();
		e += "\n";
		let a = this.createOnigString(e), o = a.content.length, s = new al(n, e, this._tokenTypeMatchers, this.balancedBracketSelectors), c = Bc(this, a, i, 0, t, s, !0, r);
		return ic(a), {
			lineLength: o,
			lineTokens: s,
			ruleStack: c.stack,
			stoppedEarly: c.stoppedEarly
		};
	}
};
function tl(e, t) {
	return e = Ds(e), e.repository = e.repository || {}, e.repository.$self = {
		$vscodeTextmateLocation: e.$vscodeTextmateLocation,
		patterns: e.patterns,
		name: e.scopeName
	}, e.repository.$base = t || e.repository.$self, e;
}
var nl = class e {
	constructor(e, t, n) {
		this.parent = e, this.scopePath = t, this.tokenAttributes = n;
	}
	static fromExtension(t, n) {
		let r = t, i = t?.scopePath ?? null;
		for (let t of n) i = Vs.push(i, t.scopeNames), r = new e(r, i, t.encodedTokenAttributes);
		return r;
	}
	static createRoot(t, n) {
		return new e(null, new Vs(null, t), n);
	}
	static createRootAndLookUpScopeName(t, n, r) {
		let i = r.getMetadataForScope(t), a = new Vs(null, t), o = r.themeProvider.themeMatch(a);
		return new e(null, a, e.mergeAttributes(n, i, o));
	}
	get scopeName() {
		return this.scopePath.scopeName;
	}
	toString() {
		return this.getScopeNames().join(" ");
	}
	equals(t) {
		return e.equals(this, t);
	}
	static equals(e, t) {
		do {
			if (e === t || !e && !t) return !0;
			if (!e || !t || e.scopeName !== t.scopeName || e.tokenAttributes !== t.tokenAttributes) return !1;
			e = e.parent, t = t.parent;
		} while (!0);
	}
	static mergeAttributes(e, t, n) {
		let r = -1, i = 0, a = 0;
		return n !== null && (r = n.fontStyle, i = n.foregroundId, a = n.backgroundId), Qs.set(e, t.languageId, t.tokenType, null, r, i, a);
	}
	pushAttributed(t, n) {
		if (t === null) return this;
		if (t.indexOf(" ") === -1) return e._pushAttributed(this, t, n);
		let r = t.split(/ /g), i = this;
		for (let t of r) i = e._pushAttributed(i, t, n);
		return i;
	}
	static _pushAttributed(t, n, r) {
		let i = r.getMetadataForScope(n), a = t.scopePath.push(n), o = r.themeProvider.themeMatch(a);
		return new e(t, a, e.mergeAttributes(t.tokenAttributes, i, o));
	}
	getScopeNames() {
		return this.scopePath.getSegments();
	}
	getExtensionIfDefined(e) {
		let t = [], n = this;
		for (; n && n !== e;) t.push({
			encodedTokenAttributes: n.tokenAttributes,
			scopeNames: n.scopePath.getExtensionIfDefined(n.parent?.scopePath ?? null)
		}), n = n.parent;
		return n === e ? t.reverse() : void 0;
	}
}, rl = class e {
	constructor(e, t, n, r, i, a, o, s) {
		this.parent = e, this.ruleId = t, this.beginRuleCapturedEOL = i, this.endRule = a, this.nameScopesList = o, this.contentNameScopesList = s, this.depth = this.parent ? this.parent.depth + 1 : 1, this._enterPos = n, this._anchorPos = r;
	}
	_stackElementBrand = void 0;
	static NULL = new e(null, 0, 0, 0, !1, null, null, null);
	_enterPos;
	_anchorPos;
	depth;
	equals(t) {
		return t === null ? !1 : e._equals(this, t);
	}
	static _equals(e, t) {
		return e === t ? !0 : this._structuralEquals(e, t) ? nl.equals(e.contentNameScopesList, t.contentNameScopesList) : !1;
	}
	static _structuralEquals(e, t) {
		do {
			if (e === t || !e && !t) return !0;
			if (!e || !t || e.depth !== t.depth || e.ruleId !== t.ruleId || e.endRule !== t.endRule) return !1;
			e = e.parent, t = t.parent;
		} while (!0);
	}
	clone() {
		return this;
	}
	static _reset(e) {
		for (; e;) e._enterPos = -1, e._anchorPos = -1, e = e.parent;
	}
	reset() {
		e._reset(this);
	}
	pop() {
		return this.parent;
	}
	safePop() {
		return this.parent ? this.parent : this;
	}
	push(t, n, r, i, a, o, s) {
		return new e(this, t, n, r, i, a, o, s);
	}
	getEnterPos() {
		return this._enterPos;
	}
	getAnchorPos() {
		return this._anchorPos;
	}
	getRule(e) {
		return e.getRule(this.ruleId);
	}
	toString() {
		let e = [];
		return this._writeString(e, 0), "[" + e.join(",") + "]";
	}
	_writeString(e, t) {
		return this.parent && (t = this.parent._writeString(e, t)), e[t++] = `(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`, t;
	}
	withContentNameScopesList(e) {
		return this.contentNameScopesList === e ? this : this.parent.push(this.ruleId, this._enterPos, this._anchorPos, this.beginRuleCapturedEOL, this.endRule, this.nameScopesList, e);
	}
	withEndRule(t) {
		return this.endRule === t ? this : new e(this.parent, this.ruleId, this._enterPos, this._anchorPos, this.beginRuleCapturedEOL, t, this.nameScopesList, this.contentNameScopesList);
	}
	hasSameRuleAs(e) {
		let t = this;
		for (; t && t._enterPos === e._enterPos;) {
			if (t.ruleId === e.ruleId) return !0;
			t = t.parent;
		}
		return !1;
	}
	toStateStackFrame() {
		return {
			ruleId: wc(this.ruleId),
			beginRuleCapturedEOL: this.beginRuleCapturedEOL,
			endRule: this.endRule,
			nameScopesList: this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList ?? null) ?? [],
			contentNameScopesList: this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList) ?? []
		};
	}
	static pushFrame(t, n) {
		let r = nl.fromExtension(t?.nameScopesList ?? null, n.nameScopesList);
		return new e(t, Cc(n.ruleId), n.enterPos ?? -1, n.anchorPos ?? -1, n.beginRuleCapturedEOL, n.endRule, r, nl.fromExtension(r, n.contentNameScopesList));
	}
}, il = class {
	balancedBracketScopes;
	unbalancedBracketScopes;
	allowAny = !1;
	constructor(e, t) {
		this.balancedBracketScopes = e.flatMap((e) => e === "*" ? (this.allowAny = !0, []) : tc(e, Qc).map((e) => e.matcher)), this.unbalancedBracketScopes = t.flatMap((e) => tc(e, Qc).map((e) => e.matcher));
	}
	get matchesAlways() {
		return this.allowAny && this.unbalancedBracketScopes.length === 0;
	}
	get matchesNever() {
		return this.balancedBracketScopes.length === 0 && !this.allowAny;
	}
	match(e) {
		for (let t of this.unbalancedBracketScopes) if (t(e)) return !1;
		for (let t of this.balancedBracketScopes) if (t(e)) return !0;
		return this.allowAny;
	}
}, al = class {
	constructor(e, t, n, r) {
		this.balancedBracketSelectors = r, this._emitBinaryTokens = e, this._tokenTypeOverrides = n, this._lineText = null, this._tokens = [], this._binaryTokens = [], this._lastTokenEndIndex = 0;
	}
	_emitBinaryTokens;
	_lineText;
	_tokens;
	_binaryTokens;
	_lastTokenEndIndex;
	_tokenTypeOverrides;
	produce(e, t) {
		this.produceFromScopes(e.contentNameScopesList, t);
	}
	produceFromScopes(e, t) {
		if (this._lastTokenEndIndex >= t) return;
		if (this._emitBinaryTokens) {
			let n = e?.tokenAttributes ?? 0, r = !1;
			if (this.balancedBracketSelectors?.matchesAlways && (r = !0), this._tokenTypeOverrides.length > 0 || this.balancedBracketSelectors && !this.balancedBracketSelectors.matchesAlways && !this.balancedBracketSelectors.matchesNever) {
				let t = e?.getScopeNames() ?? [];
				for (let e of this._tokenTypeOverrides) e.matcher(t) && (n = Qs.set(n, 0, $s(e.type), null, -1, 0, 0));
				this.balancedBracketSelectors && (r = this.balancedBracketSelectors.match(t));
			}
			if (r && (n = Qs.set(n, 0, 8, r, -1, 0, 0)), this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === n) {
				this._lastTokenEndIndex = t;
				return;
			}
			this._binaryTokens.push(this._lastTokenEndIndex), this._binaryTokens.push(n), this._lastTokenEndIndex = t;
			return;
		}
		let n = e?.getScopeNames() ?? [];
		this._tokens.push({
			startIndex: this._lastTokenEndIndex,
			endIndex: t,
			scopes: n
		}), this._lastTokenEndIndex = t;
	}
	getResult(e, t) {
		return this._tokens.length > 0 && this._tokens[this._tokens.length - 1].startIndex === t - 1 && this._tokens.pop(), this._tokens.length === 0 && (this._lastTokenEndIndex = -1, this.produce(e, t), this._tokens[this._tokens.length - 1].startIndex = 0), this._tokens;
	}
	getBinaryResult(e, t) {
		this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 2] === t - 1 && (this._binaryTokens.pop(), this._binaryTokens.pop()), this._binaryTokens.length === 0 && (this._lastTokenEndIndex = -1, this.produce(e, t), this._binaryTokens[this._binaryTokens.length - 2] = 0);
		let n = new Uint32Array(this._binaryTokens.length);
		for (let e = 0, t = this._binaryTokens.length; e < t; e++) n[e] = this._binaryTokens[e];
		return n;
	}
}, ol = class {
	constructor(e, t) {
		this._onigLib = t, this._theme = e;
	}
	_grammars = /* @__PURE__ */ new Map();
	_rawGrammars = /* @__PURE__ */ new Map();
	_injectionGrammars = /* @__PURE__ */ new Map();
	_theme;
	dispose() {
		for (let e of this._grammars.values()) e.dispose();
	}
	setTheme(e) {
		this._theme = e;
	}
	getColorMap() {
		return this._theme.getColorMap();
	}
	addGrammar(e, t) {
		this._rawGrammars.set(e.scopeName, e), t && this._injectionGrammars.set(e.scopeName, t);
	}
	lookup(e) {
		return this._rawGrammars.get(e);
	}
	injections(e) {
		return this._injectionGrammars.get(e);
	}
	getDefaults() {
		return this._theme.getDefaults();
	}
	themeMatch(e) {
		return this._theme.match(e);
	}
	grammarForScopeName(e, t, n, r, i) {
		if (!this._grammars.has(e)) {
			let a = this._rawGrammars.get(e);
			if (!a) return null;
			this._grammars.set(e, Xc(e, a, t, n, r, i, this, this._onigLib));
		}
		return this._grammars.get(e);
	}
}, sl = class {
	_options;
	_syncRegistry;
	_ensureGrammarCache;
	constructor(e) {
		this._options = e, this._syncRegistry = new ol(Bs.createFromRawTheme(e.theme, e.colorMap), e.onigLib), this._ensureGrammarCache = /* @__PURE__ */ new Map();
	}
	dispose() {
		this._syncRegistry.dispose();
	}
	setTheme(e, t) {
		this._syncRegistry.setTheme(Bs.createFromRawTheme(e, t));
	}
	getColorMap() {
		return this._syncRegistry.getColorMap();
	}
	loadGrammarWithEmbeddedLanguages(e, t, n) {
		return this.loadGrammarWithConfiguration(e, t, { embeddedLanguages: n });
	}
	loadGrammarWithConfiguration(e, t, n) {
		return this._loadGrammar(e, t, n.embeddedLanguages, n.tokenTypes, new il(n.balancedBracketSelectors || [], n.unbalancedBracketSelectors || []));
	}
	loadGrammar(e) {
		return this._loadGrammar(e, 0, null, null, null);
	}
	_loadGrammar(e, t, n, r, i) {
		let a = new cc(this._syncRegistry, e);
		for (; a.Q.length > 0;) a.Q.map((e) => this._loadSingleGrammar(e.scopeName)), a.processQueue();
		return this._grammarForScopeName(e, t, n, r, i);
	}
	_loadSingleGrammar(e) {
		this._ensureGrammarCache.has(e) || (this._doLoadSingleGrammar(e), this._ensureGrammarCache.set(e, !0));
	}
	_doLoadSingleGrammar(e) {
		let t = this._options.loadGrammar(e);
		if (t) {
			let n = typeof this._options.getInjections == "function" ? this._options.getInjections(e) : void 0;
			this._syncRegistry.addGrammar(t, n);
		}
	}
	addGrammar(e, t = [], n = 0, r = null) {
		return this._syncRegistry.addGrammar(e, t), this._grammarForScopeName(e.scopeName, n, r);
	}
	_grammarForScopeName(e, t = 0, n = null, r = null, i = null) {
		return this._syncRegistry.grammarForScopeName(e, t, n, r, i);
	}
}, cl = rl.NULL;
//#endregion
//#region ../../node_modules/.pnpm/@shikijs+primitive@4.1.0/node_modules/@shikijs/primitive/dist/index.mjs
function ll(e, t) {
	let n = typeof e == "string" ? {} : { ...e.colorReplacements }, r = typeof e == "string" ? e : e.name;
	for (let [e, i] of Object.entries(t?.colorReplacements || {})) typeof i == "string" ? n[e] = i : e === r && Object.assign(n, i);
	return n;
}
function ul(e, t) {
	return e && (t?.[e?.toLowerCase()] || e);
}
function dl(e) {
	return Array.isArray(e) ? e : [e];
}
async function fl(e) {
	return Promise.resolve(typeof e == "function" ? e() : e).then((e) => e.default || e);
}
function pl(e) {
	return !e || [
		"plaintext",
		"txt",
		"text",
		"plain"
	].includes(e);
}
function ml(e) {
	return e === "ansi" || pl(e);
}
function hl(e) {
	return e === "none";
}
function gl(e) {
	return hl(e);
}
var _l = /(\r?\n)/g;
function vl(e, t = !1) {
	if (e.length === 0) return [["", 0]];
	let n = e.split(_l), r = 0, i = [];
	for (let e = 0; e < n.length; e += 2) {
		let a = t ? n[e] + (n[e + 1] || "") : n[e];
		i.push([a, r]), r += n[e].length, r += n[e + 1]?.length || 0;
	}
	return i;
}
var yl = {
	light: "#333333",
	dark: "#bbbbbb"
}, bl = {
	light: "#fffffe",
	dark: "#1e1e1e"
}, xl = "__shiki_resolved";
function Sl(e) {
	if (e?.[xl]) return e;
	let t = { ...e };
	t.tokenColors && !t.settings && (t.settings = t.tokenColors, delete t.tokenColors), t.type ||= "dark", t.colorReplacements = { ...t.colorReplacements }, t.settings ||= [];
	let { bg: n, fg: r } = t;
	if (!n || !r) {
		let e = t.settings ? t.settings.find((e) => !e.name && !e.scope) : void 0;
		e?.settings?.foreground && (r = e.settings.foreground), e?.settings?.background && (n = e.settings.background), !r && t?.colors?.["editor.foreground"] && (r = t.colors["editor.foreground"]), !n && t?.colors?.["editor.background"] && (n = t.colors["editor.background"]), r ||= t.type === "light" ? yl.light : yl.dark, n ||= t.type === "light" ? bl.light : bl.dark, t.fg = r, t.bg = n;
	}
	t.settings[0] && t.settings[0].settings && !t.settings[0].scope || t.settings.unshift({ settings: {
		foreground: t.fg,
		background: t.bg
	} });
	let i = 0, a = /* @__PURE__ */ new Map();
	function o(e) {
		if (a.has(e)) return a.get(e);
		i += 1;
		let n = `#${i.toString(16).padStart(8, "0").toLowerCase()}`;
		return t.colorReplacements?.[`#${n}`] ? o(e) : (a.set(e, n), n);
	}
	t.settings = t.settings.map((e) => {
		let n = e.settings?.foreground && !e.settings.foreground.startsWith("#"), r = e.settings?.background && !e.settings.background.startsWith("#");
		if (!n && !r) return e;
		let i = {
			...e,
			settings: { ...e.settings }
		};
		if (n) {
			let n = o(e.settings.foreground);
			t.colorReplacements[n] = e.settings.foreground, i.settings.foreground = n;
		}
		if (r) {
			let n = o(e.settings.background);
			t.colorReplacements[n] = e.settings.background, i.settings.background = n;
		}
		return i;
	});
	for (let e of Object.keys(t.colors || {})) if ((e === "editor.foreground" || e === "editor.background" || e.startsWith("terminal.ansi")) && !t.colors[e]?.startsWith("#")) {
		let n = o(t.colors[e]);
		t.colorReplacements[n] = t.colors[e], t.colors[e] = n;
	}
	return Object.defineProperty(t, xl, {
		enumerable: !1,
		writable: !1,
		value: !0
	}), t;
}
async function Cl(e) {
	return [...new Set((await Promise.all(e.filter((e) => !ml(e)).map(async (e) => await fl(e).then((e) => Array.isArray(e) ? e : [e])))).flat())];
}
async function wl(e) {
	return (await Promise.all(e.map(async (e) => gl(e) ? null : Sl(await fl(e))))).filter((e) => !!e);
}
function Tl(e, t) {
	if (!t) return e;
	if (t[e]) {
		let n = new Set([e]);
		for (; t[e];) {
			if (e = t[e], n.has(e)) throw new G(`Circular alias \`${[...n].join(" -> ")} -> ${e}\``);
			n.add(e);
		}
	}
	return e;
}
var El = class extends sl {
	_resolver;
	_themes;
	_langs;
	_alias;
	_resolvedThemes = /* @__PURE__ */ new Map();
	_resolvedGrammars = /* @__PURE__ */ new Map();
	_langMap = /* @__PURE__ */ new Map();
	_langGraph = /* @__PURE__ */ new Map();
	_textmateThemeCache = /* @__PURE__ */ new WeakMap();
	_loadedThemesCache = null;
	_loadedLanguagesCache = null;
	constructor(e, t, n, r = {}) {
		super(e), this._resolver = e, this._themes = t, this._langs = n, this._alias = r, this._themes.map((e) => this.loadTheme(e)), this.loadLanguages(this._langs);
	}
	getTheme(e) {
		return typeof e == "string" ? this._resolvedThemes.get(e) : this.loadTheme(e);
	}
	loadTheme(e) {
		let t = Sl(e);
		return t.name && (this._resolvedThemes.set(t.name, t), this._loadedThemesCache = null), t;
	}
	getLoadedThemes() {
		return this._loadedThemesCache ||= [...this._resolvedThemes.keys()], this._loadedThemesCache;
	}
	setTheme(e) {
		let t = this._textmateThemeCache.get(e);
		t || (t = Bs.createFromRawTheme(e), this._textmateThemeCache.set(e, t)), this._syncRegistry.setTheme(t);
	}
	getGrammar(e) {
		return e = Tl(e, this._alias), this._resolvedGrammars.get(e);
	}
	loadLanguage(e) {
		if (this.getGrammar(e.name)) return;
		let t = new Set([...this._langMap.values()].filter((t) => t.embeddedLangsLazy?.includes(e.name)));
		this._resolver.addLanguage(e);
		let n = {
			balancedBracketSelectors: e.balancedBracketSelectors || ["*"],
			unbalancedBracketSelectors: e.unbalancedBracketSelectors || []
		};
		this._syncRegistry._rawGrammars.set(e.scopeName, e);
		let r = this.loadGrammarWithConfiguration(e.scopeName, 1, n);
		if (r.name = e.name, this._resolvedGrammars.set(e.name, r), e.aliases && e.aliases.forEach((t) => {
			this._alias[t] = e.name;
		}), this._loadedLanguagesCache = null, t.size) for (let e of t) this._resolvedGrammars.delete(e.name), this._loadedLanguagesCache = null, this._syncRegistry?._injectionGrammars?.delete(e.scopeName), this._syncRegistry?._grammars?.delete(e.scopeName), this.loadLanguage(this._langMap.get(e.name));
	}
	dispose() {
		super.dispose(), this._resolvedThemes.clear(), this._resolvedGrammars.clear(), this._langMap.clear(), this._langGraph.clear(), this._loadedThemesCache = null;
	}
	loadLanguages(e) {
		for (let t of e) this.resolveEmbeddedLanguages(t);
		let t = [...this._langGraph.entries()], n = t.filter(([e, t]) => !t);
		if (n.length) {
			let e = t.filter(([e, t]) => t ? (t.embeddedLanguages || t.embeddedLangs)?.some((e) => n.map(([e]) => e).includes(e)) : !1).filter((e) => !n.includes(e));
			throw new G(`Missing languages ${n.map(([e]) => `\`${e}\``).join(", ")}, required by ${e.map(([e]) => `\`${e}\``).join(", ")}`);
		}
		for (let [e, n] of t) this._resolver.addLanguage(n);
		for (let [e, n] of t) this.loadLanguage(n);
	}
	getLoadedLanguages() {
		return this._loadedLanguagesCache ||= [...new Set([...this._resolvedGrammars.keys(), ...Object.keys(this._alias)])], this._loadedLanguagesCache;
	}
	resolveEmbeddedLanguages(e) {
		this._langMap.set(e.name, e), this._langGraph.set(e.name, e);
		let t = e.embeddedLanguages ?? e.embeddedLangs;
		if (t) for (let e of t) this._langGraph.set(e, this._langMap.get(e));
	}
}, Dl = class {
	_langs = /* @__PURE__ */ new Map();
	_scopeToLang = /* @__PURE__ */ new Map();
	_injections = /* @__PURE__ */ new Map();
	_onigLib;
	constructor(e, t) {
		this._onigLib = {
			createOnigScanner: (t) => e.createScanner(t),
			createOnigString: (t) => e.createString(t)
		}, t.forEach((e) => this.addLanguage(e));
	}
	get onigLib() {
		return this._onigLib;
	}
	getLangRegistration(e) {
		return this._langs.get(e);
	}
	loadGrammar(e) {
		return this._scopeToLang.get(e);
	}
	addLanguage(e) {
		this._langs.set(e.name, e), e.aliases && e.aliases.forEach((t) => {
			this._langs.set(t, e);
		}), this._scopeToLang.set(e.scopeName, e), e.injectTo && e.injectTo.forEach((t) => {
			this._injections.get(t) || this._injections.set(t, []), this._injections.get(t).push(e.scopeName);
		});
	}
	getInjections(e) {
		let t = e.split("."), n = [];
		for (let e = 1; e <= t.length; e++) {
			let r = t.slice(0, e).join(".");
			n = [...n, ...this._injections.get(r) || []];
		}
		return n;
	}
}, Ol = 0;
function kl(e) {
	Ol += 1, e.warnings !== !1 && Ol >= 10 && Ol % 10 == 0 && console.warn(`[Shiki] ${Ol} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`);
	let t = !1;
	if (!e.engine) throw new G("`engine` option is required for synchronous mode");
	let n = (e.langs || []).flat(1), r = (e.themes || []).flat(1).map(Sl), i = new El(new Dl(e.engine, n), r, n, e.langAlias), a;
	function o(t) {
		return Tl(t, e.langAlias);
	}
	function s(e) {
		g();
		let t = i.getGrammar(typeof e == "string" ? e : e.name);
		if (!t) throw new G(`Language \`${e}\` not found, you may need to load it first`);
		return t;
	}
	function c(e) {
		if (e === "none") return {
			bg: "",
			fg: "",
			name: "none",
			settings: [],
			type: "dark"
		};
		g();
		let t = i.getTheme(e);
		if (!t) throw new G(`Theme \`${e}\` not found, you may need to load it first`);
		return t;
	}
	function l(e) {
		g();
		let t = c(e);
		return a !== e && (i.setTheme(t), a = e), {
			theme: t,
			colorMap: i.getColorMap()
		};
	}
	function u() {
		return g(), i.getLoadedThemes();
	}
	function d() {
		return g(), i.getLoadedLanguages();
	}
	function f(...e) {
		g(), i.loadLanguages(e.flat(1));
	}
	async function p(...e) {
		return f(await Cl(e));
	}
	function m(...e) {
		g();
		for (let t of e.flat(1)) i.loadTheme(t);
	}
	async function h(...e) {
		return g(), m(await wl(e));
	}
	function g() {
		if (t) throw new G("Shiki instance has been disposed");
	}
	function _() {
		t || (t = !0, i.dispose(), --Ol);
	}
	return {
		setTheme: l,
		getTheme: c,
		getLanguage: s,
		getLoadedThemes: u,
		getLoadedLanguages: d,
		resolveLangAlias: o,
		loadLanguage: p,
		loadLanguageSync: f,
		loadTheme: h,
		loadThemeSync: m,
		dispose: _,
		[Symbol.dispose]: _
	};
}
async function Al(e) {
	e.engine || console.warn("`engine` option is required. Use `createOnigurumaEngine` or `createJavaScriptRegexEngine` to create an engine.");
	let [t, n, r] = await Promise.all([
		wl(e.themes || []),
		Cl(e.langs || []),
		e.engine
	]);
	return kl({
		...e,
		themes: t,
		langs: n,
		engine: r
	});
}
var jl = /* @__PURE__ */ new WeakMap();
function Ml(e, t) {
	jl.set(e, t);
}
function Nl(e) {
	return jl.get(e);
}
var Pl = class e {
	_stacks = {};
	lang;
	get themes() {
		return Object.keys(this._stacks);
	}
	get theme() {
		return this.themes[0];
	}
	get _stack() {
		return this._stacks[this.theme];
	}
	static initial(t, n) {
		return new e(Object.fromEntries(dl(n).map((e) => [e, cl])), t);
	}
	constructor(...e) {
		if (e.length === 2) {
			let [t, n] = e;
			this.lang = n, this._stacks = t;
		} else {
			let [t, n, r] = e;
			this.lang = n, this._stacks = { [r]: t };
		}
	}
	getInternalStack(e = this.theme) {
		return this._stacks[e];
	}
	getScopes(e = this.theme) {
		return Fl(this._stacks[e]);
	}
	toJSON() {
		return {
			lang: this.lang,
			theme: this.theme,
			themes: this.themes,
			scopes: this.getScopes()
		};
	}
};
function Fl(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	function r(e) {
		if (n.has(e)) return;
		n.add(e);
		let i = e?.nameScopesList?.scopeName;
		i && t.push(i), e.parent && r(e.parent);
	}
	return r(e), t;
}
function Il(e, t) {
	if (!(e instanceof Pl)) throw new G("Invalid grammar state");
	return e.getInternalStack(t);
}
var Ll = /,/, Rl = / /;
function zl(e, t, n = {}) {
	let { theme: r = e.getLoadedThemes()[0] } = n;
	if (pl(e.resolveLangAlias(n.lang || "text")) || hl(r)) return vl(t).map((e) => [{
		content: e[0],
		offset: e[1]
	}]);
	let { theme: i, colorMap: a } = e.setTheme(r), o = e.getLanguage(n.lang || "text");
	if (n.grammarState) {
		if (n.grammarState.lang !== o.name) throw new G(`Grammar state language "${n.grammarState.lang}" does not match highlight language "${o.name}"`);
		if (!n.grammarState.themes.includes(i.name)) throw new G(`Grammar state themes "${n.grammarState.themes}" do not contain highlight theme "${i.name}"`);
	}
	return Vl(t, o, i, a, n);
}
function Bl(...e) {
	if (e.length === 2) return Nl(e[1]);
	let [t, n, r = {}] = e, { lang: i = "text", theme: a = t.getLoadedThemes()[0] } = r;
	if (pl(i) || hl(a)) throw new G("Plain language does not have grammar state");
	if (i === "ansi") throw new G("ANSI language does not have grammar state");
	let { theme: o, colorMap: s } = t.setTheme(a), c = t.getLanguage(i);
	return new Pl(Hl(n, c, o, s, r).stateStack, c.name, o.name);
}
function Vl(e, t, n, r, i) {
	let a = Hl(e, t, n, r, i), o = new Pl(a.stateStack, t.name, n.name);
	return Ml(a.tokens, o), a.tokens;
}
function Hl(e, t, n, r, i) {
	let a = ll(n, i), { tokenizeMaxLineLength: o = 0, tokenizeTimeLimit: s = 500 } = i, c = vl(e), l = i.grammarState ? Il(i.grammarState, n.name) ?? cl : i.grammarContextCode == null ? cl : Hl(i.grammarContextCode, t, n, r, {
		...i,
		grammarState: void 0,
		grammarContextCode: void 0
	}).stateStack, u = [], d = [];
	for (let e = 0, f = c.length; e < f; e++) {
		let [f, p] = c[e];
		if (f === "") {
			u = [], d.push([]);
			continue;
		}
		if (o > 0 && f.length >= o) {
			u = [], d.push([{
				content: f,
				offset: p,
				color: "",
				fontStyle: 0
			}]);
			continue;
		}
		let m, h, g;
		i.includeExplanation && (m = t.tokenizeLine(f, l, s), h = m.tokens, g = 0);
		let _ = t.tokenizeLine2(f, l, s), v = _.tokens.length / 2;
		for (let e = 0; e < v; e++) {
			let t = _.tokens[2 * e], o = e + 1 < v ? _.tokens[2 * e + 2] : f.length;
			if (t === o) continue;
			let s = _.tokens[2 * e + 1], c = ul(r[Qs.getForeground(s)], a), l = Qs.getFontStyle(s), d = {
				content: f.substring(t, o),
				offset: p + t,
				color: c,
				fontStyle: l
			};
			if (i.includeExplanation) {
				let e = [];
				if (i.includeExplanation !== "scopeName") for (let t of n.settings) {
					let n;
					switch (typeof t.scope) {
						case "string":
							n = t.scope.split(Ll).map((e) => e.trim());
							break;
						case "object":
							n = t.scope;
							break;
						default: continue;
					}
					e.push({
						settings: t,
						selectors: n.map((e) => e.split(Rl))
					});
				}
				d.explanation = [];
				let r = 0;
				for (; t + r < o;) {
					let t = h[g], n = f.substring(t.startIndex, t.endIndex);
					r += n.length, d.explanation.push({
						content: n,
						scopes: i.includeExplanation === "scopeName" ? Ul(t.scopes) : Wl(e, t.scopes)
					}), g += 1;
				}
			}
			u.push(d);
		}
		d.push(u), u = [], l = _.ruleStack;
	}
	return {
		tokens: d,
		stateStack: l
	};
}
function Ul(e) {
	return e.map((e) => ({ scopeName: e }));
}
function Wl(e, t) {
	let n = [];
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		n[r] = {
			scopeName: i,
			themeMatches: ql(e, i, t.slice(0, r))
		};
	}
	return n;
}
function Gl(e, t) {
	return e === t || t.substring(0, e.length) === e && t[e.length] === ".";
}
function Kl(e, t, n) {
	if (!Gl(e.at(-1), t)) return !1;
	let r = e.length - 2, i = n.length - 1;
	for (; r >= 0 && i >= 0;) Gl(e[r], n[i]) && --r, --i;
	return r === -1;
}
function ql(e, t, n) {
	let r = [];
	for (let { selectors: i, settings: a } of e) for (let e of i) if (Kl(e, t, n)) {
		r.push(a);
		break;
	}
	return r;
}
function Jl(e, t, n, r = zl) {
	let i = Object.entries(n.themes).filter((e) => e[1]).map((e) => ({
		color: e[0],
		theme: e[1]
	})), a = i.map((i) => {
		let a = r(e, t, {
			...n,
			theme: i.theme
		});
		return {
			tokens: a,
			state: Nl(a),
			theme: typeof i.theme == "string" ? i.theme : i.theme.name
		};
	}), o = Yl(...a.map((e) => e.tokens)), s = o[0].map((e, t) => e.map((e, r) => {
		let a = {
			content: e.content,
			variants: {},
			offset: e.offset
		};
		return "includeExplanation" in n && n.includeExplanation && (a.explanation = e.explanation), o.forEach((e, n) => {
			let { content: o, explanation: s, offset: c, ...l } = e[t][r];
			a.variants[i[n].color] = l;
		}), a;
	})), c = a[0].state ? new Pl(Object.fromEntries(a.map((e) => [e.theme, e.state?.getInternalStack(e.theme)])), a[0].state.lang) : void 0;
	return c && Ml(s, c), s;
}
function Yl(...e) {
	let t = e.map(() => []), n = e.length;
	for (let r = 0; r < e[0].length; r++) {
		let i = e.map((e) => e[r]), a = t.map(() => []);
		t.forEach((e, t) => e.push(a[t]));
		let o = i.map(() => 0), s = i.map((e) => e[0]);
		for (; s.every((e) => e);) {
			let e = Math.min(...s.map((e) => e.content.length));
			for (let t = 0; t < n; t++) {
				let n = s[t];
				n.content.length === e ? (a[t].push(n), o[t] += 1, s[t] = i[t][o[t]]) : (a[t].push({
					...n,
					content: n.content.slice(0, e)
				}), s[t] = {
					...n,
					content: n.content.slice(e),
					offset: n.offset + e
				});
			}
		}
	}
	return t;
}
//#endregion
//#region ../../node_modules/.pnpm/html-void-elements@3.0.0/node_modules/html-void-elements/index.js
var Xl = [
	"area",
	"base",
	"basefont",
	"bgsound",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"image",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
], Zl = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
Zl.prototype.normal = {}, Zl.prototype.property = {}, Zl.prototype.space = void 0;
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/merge.js
function Ql(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new Zl(n, r, t);
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/normalize.js
function $l(e) {
	return e.toLowerCase();
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/info.js
var q = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
q.prototype.attribute = "", q.prototype.booleanish = !1, q.prototype.boolean = !1, q.prototype.commaOrSpaceSeparated = !1, q.prototype.commaSeparated = !1, q.prototype.defined = !1, q.prototype.mustUseProperty = !1, q.prototype.number = !1, q.prototype.overloadedBoolean = !1, q.prototype.property = "", q.prototype.spaceSeparated = !1, q.prototype.space = void 0;
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/types.js
var eu = /* @__PURE__ */ t({
	boolean: () => J,
	booleanish: () => Y,
	commaOrSpaceSeparated: () => Q,
	commaSeparated: () => ru,
	number: () => X,
	overloadedBoolean: () => nu,
	spaceSeparated: () => Z
}), tu = 0, J = iu(), Y = iu(), nu = iu(), X = iu(), Z = iu(), ru = iu(), Q = iu();
function iu() {
	return 2 ** ++tu;
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/defined-info.js
var au = Object.keys(eu), ou = class extends q {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), su(this, "space", r), typeof n == "number") for (; ++i < au.length;) {
			let e = au[i];
			su(this, au[i], (n & eu[e]) === eu[e]);
		}
	}
};
ou.prototype.defined = !0;
function su(e, t, n) {
	n && (e[t] = n);
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/create.js
function cu(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new ou(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[$l(r)] = r, n[$l(a.attribute)] = r;
	}
	return new Zl(t, n, e.space);
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/aria.js
var lu = cu({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: Y,
		ariaAutoComplete: null,
		ariaBusy: Y,
		ariaChecked: Y,
		ariaColCount: X,
		ariaColIndex: X,
		ariaColSpan: X,
		ariaControls: Z,
		ariaCurrent: null,
		ariaDescribedBy: Z,
		ariaDetails: null,
		ariaDisabled: Y,
		ariaDropEffect: Z,
		ariaErrorMessage: null,
		ariaExpanded: Y,
		ariaFlowTo: Z,
		ariaGrabbed: Y,
		ariaHasPopup: null,
		ariaHidden: Y,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: Z,
		ariaLevel: X,
		ariaLive: null,
		ariaModal: Y,
		ariaMultiLine: Y,
		ariaMultiSelectable: Y,
		ariaOrientation: null,
		ariaOwns: Z,
		ariaPlaceholder: null,
		ariaPosInSet: X,
		ariaPressed: Y,
		ariaReadOnly: Y,
		ariaRelevant: null,
		ariaRequired: Y,
		ariaRoleDescription: Z,
		ariaRowCount: X,
		ariaRowIndex: X,
		ariaRowSpan: X,
		ariaSelected: Y,
		ariaSetSize: X,
		ariaSort: null,
		ariaValueMax: X,
		ariaValueMin: X,
		ariaValueNow: X,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/case-sensitive-transform.js
function uu(e, t) {
	return t in e ? e[t] : t;
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/util/case-insensitive-transform.js
function du(e, t) {
	return uu(e, t.toLowerCase());
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/lib/html.js
var fu = cu({
	attributes: {
		acceptcharset: "accept-charset",
		classname: "class",
		htmlfor: "for",
		httpequiv: "http-equiv"
	},
	mustUseProperty: [
		"checked",
		"multiple",
		"muted",
		"selected"
	],
	properties: {
		abbr: null,
		accept: ru,
		acceptCharset: Z,
		accessKey: Z,
		action: null,
		allow: null,
		allowFullScreen: J,
		allowPaymentRequest: J,
		allowUserMedia: J,
		alt: null,
		as: null,
		async: J,
		autoCapitalize: null,
		autoComplete: Z,
		autoFocus: J,
		autoPlay: J,
		blocking: Z,
		capture: null,
		charSet: null,
		checked: J,
		cite: null,
		className: Z,
		cols: X,
		colSpan: null,
		content: null,
		contentEditable: Y,
		controls: J,
		controlsList: Z,
		coords: X | ru,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: J,
		defer: J,
		dir: null,
		dirName: null,
		disabled: J,
		download: nu,
		draggable: Y,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: J,
		formTarget: null,
		headers: Z,
		height: X,
		hidden: nu,
		high: X,
		href: null,
		hrefLang: null,
		htmlFor: Z,
		httpEquiv: Z,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: J,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: J,
		itemId: null,
		itemProp: Z,
		itemRef: Z,
		itemScope: J,
		itemType: Z,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: J,
		low: X,
		manifest: null,
		max: null,
		maxLength: X,
		media: null,
		method: null,
		min: null,
		minLength: X,
		multiple: J,
		muted: J,
		name: null,
		nonce: null,
		noModule: J,
		noValidate: J,
		onAbort: null,
		onAfterPrint: null,
		onAuxClick: null,
		onBeforeMatch: null,
		onBeforePrint: null,
		onBeforeToggle: null,
		onBeforeUnload: null,
		onBlur: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onContextLost: null,
		onContextMenu: null,
		onContextRestored: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFormData: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLanguageChange: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadEnd: null,
		onLoadStart: null,
		onMessage: null,
		onMessageError: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRejectionHandled: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onScrollEnd: null,
		onSecurityPolicyViolation: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onSlotChange: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnhandledRejection: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onWheel: null,
		open: J,
		optimum: X,
		pattern: null,
		ping: Z,
		placeholder: null,
		playsInline: J,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: J,
		referrerPolicy: null,
		rel: Z,
		required: J,
		reversed: J,
		rows: X,
		rowSpan: X,
		sandbox: Z,
		scope: null,
		scoped: J,
		seamless: J,
		selected: J,
		shadowRootClonable: J,
		shadowRootDelegatesFocus: J,
		shadowRootMode: null,
		shape: null,
		size: X,
		sizes: null,
		slot: null,
		span: X,
		spellCheck: Y,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: X,
		step: null,
		style: null,
		tabIndex: X,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: J,
		useMap: null,
		value: Y,
		width: X,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: Z,
		axis: null,
		background: null,
		bgColor: null,
		border: X,
		borderColor: null,
		bottomMargin: X,
		cellPadding: null,
		cellSpacing: null,
		char: null,
		charOff: null,
		classId: null,
		clear: null,
		code: null,
		codeBase: null,
		codeType: null,
		color: null,
		compact: J,
		declare: J,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: X,
		leftMargin: X,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: X,
		marginWidth: X,
		noResize: J,
		noHref: J,
		noShade: J,
		noWrap: J,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: X,
		rules: null,
		scheme: null,
		scrolling: Y,
		standby: null,
		summary: null,
		text: null,
		topMargin: X,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: X,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		disablePictureInPicture: J,
		disableRemotePlayback: J,
		prefix: null,
		property: null,
		results: X,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: du
}), pu = cu({
	attributes: {
		accentHeight: "accent-height",
		alignmentBaseline: "alignment-baseline",
		arabicForm: "arabic-form",
		baselineShift: "baseline-shift",
		capHeight: "cap-height",
		className: "class",
		clipPath: "clip-path",
		clipRule: "clip-rule",
		colorInterpolation: "color-interpolation",
		colorInterpolationFilters: "color-interpolation-filters",
		colorProfile: "color-profile",
		colorRendering: "color-rendering",
		crossOrigin: "crossorigin",
		dataType: "datatype",
		dominantBaseline: "dominant-baseline",
		enableBackground: "enable-background",
		fillOpacity: "fill-opacity",
		fillRule: "fill-rule",
		floodColor: "flood-color",
		floodOpacity: "flood-opacity",
		fontFamily: "font-family",
		fontSize: "font-size",
		fontSizeAdjust: "font-size-adjust",
		fontStretch: "font-stretch",
		fontStyle: "font-style",
		fontVariant: "font-variant",
		fontWeight: "font-weight",
		glyphName: "glyph-name",
		glyphOrientationHorizontal: "glyph-orientation-horizontal",
		glyphOrientationVertical: "glyph-orientation-vertical",
		hrefLang: "hreflang",
		horizAdvX: "horiz-adv-x",
		horizOriginX: "horiz-origin-x",
		horizOriginY: "horiz-origin-y",
		imageRendering: "image-rendering",
		letterSpacing: "letter-spacing",
		lightingColor: "lighting-color",
		markerEnd: "marker-end",
		markerMid: "marker-mid",
		markerStart: "marker-start",
		navDown: "nav-down",
		navDownLeft: "nav-down-left",
		navDownRight: "nav-down-right",
		navLeft: "nav-left",
		navNext: "nav-next",
		navPrev: "nav-prev",
		navRight: "nav-right",
		navUp: "nav-up",
		navUpLeft: "nav-up-left",
		navUpRight: "nav-up-right",
		onAbort: "onabort",
		onActivate: "onactivate",
		onAfterPrint: "onafterprint",
		onBeforePrint: "onbeforeprint",
		onBegin: "onbegin",
		onCancel: "oncancel",
		onCanPlay: "oncanplay",
		onCanPlayThrough: "oncanplaythrough",
		onChange: "onchange",
		onClick: "onclick",
		onClose: "onclose",
		onCopy: "oncopy",
		onCueChange: "oncuechange",
		onCut: "oncut",
		onDblClick: "ondblclick",
		onDrag: "ondrag",
		onDragEnd: "ondragend",
		onDragEnter: "ondragenter",
		onDragExit: "ondragexit",
		onDragLeave: "ondragleave",
		onDragOver: "ondragover",
		onDragStart: "ondragstart",
		onDrop: "ondrop",
		onDurationChange: "ondurationchange",
		onEmptied: "onemptied",
		onEnd: "onend",
		onEnded: "onended",
		onError: "onerror",
		onFocus: "onfocus",
		onFocusIn: "onfocusin",
		onFocusOut: "onfocusout",
		onHashChange: "onhashchange",
		onInput: "oninput",
		onInvalid: "oninvalid",
		onKeyDown: "onkeydown",
		onKeyPress: "onkeypress",
		onKeyUp: "onkeyup",
		onLoad: "onload",
		onLoadedData: "onloadeddata",
		onLoadedMetadata: "onloadedmetadata",
		onLoadStart: "onloadstart",
		onMessage: "onmessage",
		onMouseDown: "onmousedown",
		onMouseEnter: "onmouseenter",
		onMouseLeave: "onmouseleave",
		onMouseMove: "onmousemove",
		onMouseOut: "onmouseout",
		onMouseOver: "onmouseover",
		onMouseUp: "onmouseup",
		onMouseWheel: "onmousewheel",
		onOffline: "onoffline",
		onOnline: "ononline",
		onPageHide: "onpagehide",
		onPageShow: "onpageshow",
		onPaste: "onpaste",
		onPause: "onpause",
		onPlay: "onplay",
		onPlaying: "onplaying",
		onPopState: "onpopstate",
		onProgress: "onprogress",
		onRateChange: "onratechange",
		onRepeat: "onrepeat",
		onReset: "onreset",
		onResize: "onresize",
		onScroll: "onscroll",
		onSeeked: "onseeked",
		onSeeking: "onseeking",
		onSelect: "onselect",
		onShow: "onshow",
		onStalled: "onstalled",
		onStorage: "onstorage",
		onSubmit: "onsubmit",
		onSuspend: "onsuspend",
		onTimeUpdate: "ontimeupdate",
		onToggle: "ontoggle",
		onUnload: "onunload",
		onVolumeChange: "onvolumechange",
		onWaiting: "onwaiting",
		onZoom: "onzoom",
		overlinePosition: "overline-position",
		overlineThickness: "overline-thickness",
		paintOrder: "paint-order",
		panose1: "panose-1",
		pointerEvents: "pointer-events",
		referrerPolicy: "referrerpolicy",
		renderingIntent: "rendering-intent",
		shapeRendering: "shape-rendering",
		stopColor: "stop-color",
		stopOpacity: "stop-opacity",
		strikethroughPosition: "strikethrough-position",
		strikethroughThickness: "strikethrough-thickness",
		strokeDashArray: "stroke-dasharray",
		strokeDashOffset: "stroke-dashoffset",
		strokeLineCap: "stroke-linecap",
		strokeLineJoin: "stroke-linejoin",
		strokeMiterLimit: "stroke-miterlimit",
		strokeOpacity: "stroke-opacity",
		strokeWidth: "stroke-width",
		tabIndex: "tabindex",
		textAnchor: "text-anchor",
		textDecoration: "text-decoration",
		textRendering: "text-rendering",
		transformOrigin: "transform-origin",
		typeOf: "typeof",
		underlinePosition: "underline-position",
		underlineThickness: "underline-thickness",
		unicodeBidi: "unicode-bidi",
		unicodeRange: "unicode-range",
		unitsPerEm: "units-per-em",
		vAlphabetic: "v-alphabetic",
		vHanging: "v-hanging",
		vIdeographic: "v-ideographic",
		vMathematical: "v-mathematical",
		vectorEffect: "vector-effect",
		vertAdvY: "vert-adv-y",
		vertOriginX: "vert-origin-x",
		vertOriginY: "vert-origin-y",
		wordSpacing: "word-spacing",
		writingMode: "writing-mode",
		xHeight: "x-height",
		playbackOrder: "playbackorder",
		timelineBegin: "timelinebegin"
	},
	properties: {
		about: Q,
		accentHeight: X,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: X,
		amplitude: X,
		arabicForm: null,
		ascent: X,
		attributeName: null,
		attributeType: null,
		azimuth: X,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: X,
		by: null,
		calcMode: null,
		capHeight: X,
		className: Z,
		clip: null,
		clipPath: null,
		clipPathUnits: null,
		clipRule: null,
		color: null,
		colorInterpolation: null,
		colorInterpolationFilters: null,
		colorProfile: null,
		colorRendering: null,
		content: null,
		contentScriptType: null,
		contentStyleType: null,
		crossOrigin: null,
		cursor: null,
		cx: null,
		cy: null,
		d: null,
		dataType: null,
		defaultAction: null,
		descent: X,
		diffuseConstant: X,
		direction: null,
		display: null,
		dur: null,
		divisor: X,
		dominantBaseline: null,
		download: J,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: X,
		enableBackground: null,
		end: null,
		event: null,
		exponent: X,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: X,
		fillRule: null,
		filter: null,
		filterRes: null,
		filterUnits: null,
		floodColor: null,
		floodOpacity: null,
		focusable: null,
		focusHighlight: null,
		fontFamily: null,
		fontSize: null,
		fontSizeAdjust: null,
		fontStretch: null,
		fontStyle: null,
		fontVariant: null,
		fontWeight: null,
		format: null,
		fr: null,
		from: null,
		fx: null,
		fy: null,
		g1: ru,
		g2: ru,
		glyphName: ru,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: X,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: X,
		horizOriginX: X,
		horizOriginY: X,
		id: null,
		ideographic: X,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: X,
		k: X,
		k1: X,
		k2: X,
		k3: X,
		k4: X,
		kernelMatrix: Q,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: X,
		local: null,
		markerEnd: null,
		markerMid: null,
		markerStart: null,
		markerHeight: null,
		markerUnits: null,
		markerWidth: null,
		mask: null,
		maskContentUnits: null,
		maskUnits: null,
		mathematical: null,
		max: null,
		media: null,
		mediaCharacterEncoding: null,
		mediaContentEncodings: null,
		mediaSize: X,
		mediaTime: null,
		method: null,
		min: null,
		mode: null,
		name: null,
		navDown: null,
		navDownLeft: null,
		navDownRight: null,
		navLeft: null,
		navNext: null,
		navPrev: null,
		navRight: null,
		navUp: null,
		navUpLeft: null,
		navUpRight: null,
		numOctaves: null,
		observer: null,
		offset: null,
		onAbort: null,
		onActivate: null,
		onAfterPrint: null,
		onBeforePrint: null,
		onBegin: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnd: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFocusIn: null,
		onFocusOut: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadStart: null,
		onMessage: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onMouseWheel: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRepeat: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onShow: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onZoom: null,
		opacity: null,
		operator: null,
		order: null,
		orient: null,
		orientation: null,
		origin: null,
		overflow: null,
		overlay: null,
		overlinePosition: X,
		overlineThickness: X,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: X,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: Z,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: X,
		pointsAtY: X,
		pointsAtZ: X,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: Q,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: Q,
		rev: Q,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: Q,
		requiredFeatures: Q,
		requiredFonts: Q,
		requiredFormats: Q,
		resource: null,
		restart: null,
		result: null,
		rotate: null,
		rx: null,
		ry: null,
		scale: null,
		seed: null,
		shapeRendering: null,
		side: null,
		slope: null,
		snapshotTime: null,
		specularConstant: X,
		specularExponent: X,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: X,
		strikethroughThickness: X,
		string: null,
		stroke: null,
		strokeDashArray: Q,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: X,
		strokeOpacity: X,
		strokeWidth: null,
		style: null,
		surfaceScale: X,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: Q,
		tabIndex: X,
		tableValues: null,
		target: null,
		targetX: X,
		targetY: X,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: Q,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: X,
		underlineThickness: X,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: X,
		values: null,
		vAlphabetic: X,
		vMathematical: X,
		vectorEffect: null,
		vHanging: X,
		vIdeographic: X,
		version: null,
		vertAdvY: X,
		vertOriginX: X,
		vertOriginY: X,
		viewBox: null,
		viewTarget: null,
		visibility: null,
		width: null,
		widths: null,
		wordSpacing: null,
		writingMode: null,
		x: null,
		x1: null,
		x2: null,
		xChannelSelector: null,
		xHeight: X,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: uu
}), mu = cu({
	properties: {
		xLinkActuate: null,
		xLinkArcRole: null,
		xLinkHref: null,
		xLinkRole: null,
		xLinkShow: null,
		xLinkTitle: null,
		xLinkType: null
	},
	space: "xlink",
	transform(e, t) {
		return "xlink:" + t.slice(5).toLowerCase();
	}
}), hu = cu({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: du
}), gu = cu({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), _u = /[A-Z]/g, vu = /-[a-z]/g, yu = /^data[-\w.:]+$/i;
function bu(e, t) {
	let n = $l(t), r = t, i = q;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && yu.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(vu, Su);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!vu.test(e)) {
				let n = e.replace(_u, xu);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = ou;
	}
	return new i(r, t);
}
function xu(e) {
	return "-" + e.toLowerCase();
}
function Su(e) {
	return e.charAt(1).toUpperCase();
}
//#endregion
//#region ../../node_modules/.pnpm/property-information@7.1.0/node_modules/property-information/index.js
var Cu = Ql([
	lu,
	fu,
	mu,
	hu,
	gu
], "html"), wu = Ql([
	lu,
	pu,
	mu,
	hu,
	gu
], "svg"), Tu = {}.hasOwnProperty;
function Eu(e, t) {
	let n = t || {};
	function r(t, ...n) {
		let i = r.invalid, a = r.handlers;
		if (t && Tu.call(t, e)) {
			let n = String(t[e]);
			i = Tu.call(a, n) ? a[n] : r.unknown;
		}
		if (i) return i.call(this, t, ...n);
	}
	return r.handlers = n.handlers || {}, r.invalid = n.invalid, r.unknown = n.unknown, r;
}
//#endregion
//#region ../../node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/core.js
var Du = /["&'<>`]/g, Ou = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ku = /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g, Au = /[|\\{}()[\]^$+*?.]/g, ju = /* @__PURE__ */ new WeakMap();
function Mu(e, t) {
	if (e = e.replace(t.subset ? Nu(t.subset) : Du, r), t.subset || t.escapeOnly) return e;
	return e.replace(Ou, n).replace(ku, r);
	function n(e, n, r) {
		return t.format((e.charCodeAt(0) - 55296) * 1024 + e.charCodeAt(1) - 56320 + 65536, r.charCodeAt(n + 2), t);
	}
	function r(e, n, r) {
		return t.format(e.charCodeAt(0), r.charCodeAt(n + 1), t);
	}
}
function Nu(e) {
	let t = ju.get(e);
	return t || (t = Pu(e), ju.set(e, t)), t;
}
function Pu(e) {
	let t = [], n = -1;
	for (; ++n < e.length;) t.push(e[n].replace(Au, "\\$&"));
	return RegExp("(?:" + t.join("|") + ")", "g");
}
//#endregion
//#region ../../node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/util/to-hexadecimal.js
var Fu = /[\dA-Fa-f]/;
function Iu(e, t, n) {
	let r = "&#x" + e.toString(16).toUpperCase();
	return n && t && !Fu.test(String.fromCharCode(t)) ? r : r + ";";
}
//#endregion
//#region ../../node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/util/to-decimal.js
var Lu = /\d/;
function Ru(e, t, n) {
	let r = "&#" + String(e);
	return n && t && !Lu.test(String.fromCharCode(t)) ? r : r + ";";
}
//#endregion
//#region ../../node_modules/.pnpm/character-entities-legacy@3.0.0/node_modules/character-entities-legacy/index.js
var zu = /* @__PURE__ */ "AElig.AMP.Aacute.Acirc.Agrave.Aring.Atilde.Auml.COPY.Ccedil.ETH.Eacute.Ecirc.Egrave.Euml.GT.Iacute.Icirc.Igrave.Iuml.LT.Ntilde.Oacute.Ocirc.Ograve.Oslash.Otilde.Ouml.QUOT.REG.THORN.Uacute.Ucirc.Ugrave.Uuml.Yacute.aacute.acirc.acute.aelig.agrave.amp.aring.atilde.auml.brvbar.ccedil.cedil.cent.copy.curren.deg.divide.eacute.ecirc.egrave.eth.euml.frac12.frac14.frac34.gt.iacute.icirc.iexcl.igrave.iquest.iuml.laquo.lt.macr.micro.middot.nbsp.not.ntilde.oacute.ocirc.ograve.ordf.ordm.oslash.otilde.ouml.para.plusmn.pound.quot.raquo.reg.sect.shy.sup1.sup2.sup3.szlig.thorn.times.uacute.ucirc.ugrave.uml.uuml.yacute.yen.yuml".split("."), Bu = {
	nbsp: "\xA0",
	iexcl: "¡",
	cent: "¢",
	pound: "£",
	curren: "¤",
	yen: "¥",
	brvbar: "¦",
	sect: "§",
	uml: "¨",
	copy: "©",
	ordf: "ª",
	laquo: "«",
	not: "¬",
	shy: "­",
	reg: "®",
	macr: "¯",
	deg: "°",
	plusmn: "±",
	sup2: "²",
	sup3: "³",
	acute: "´",
	micro: "µ",
	para: "¶",
	middot: "·",
	cedil: "¸",
	sup1: "¹",
	ordm: "º",
	raquo: "»",
	frac14: "¼",
	frac12: "½",
	frac34: "¾",
	iquest: "¿",
	Agrave: "À",
	Aacute: "Á",
	Acirc: "Â",
	Atilde: "Ã",
	Auml: "Ä",
	Aring: "Å",
	AElig: "Æ",
	Ccedil: "Ç",
	Egrave: "È",
	Eacute: "É",
	Ecirc: "Ê",
	Euml: "Ë",
	Igrave: "Ì",
	Iacute: "Í",
	Icirc: "Î",
	Iuml: "Ï",
	ETH: "Ð",
	Ntilde: "Ñ",
	Ograve: "Ò",
	Oacute: "Ó",
	Ocirc: "Ô",
	Otilde: "Õ",
	Ouml: "Ö",
	times: "×",
	Oslash: "Ø",
	Ugrave: "Ù",
	Uacute: "Ú",
	Ucirc: "Û",
	Uuml: "Ü",
	Yacute: "Ý",
	THORN: "Þ",
	szlig: "ß",
	agrave: "à",
	aacute: "á",
	acirc: "â",
	atilde: "ã",
	auml: "ä",
	aring: "å",
	aelig: "æ",
	ccedil: "ç",
	egrave: "è",
	eacute: "é",
	ecirc: "ê",
	euml: "ë",
	igrave: "ì",
	iacute: "í",
	icirc: "î",
	iuml: "ï",
	eth: "ð",
	ntilde: "ñ",
	ograve: "ò",
	oacute: "ó",
	ocirc: "ô",
	otilde: "õ",
	ouml: "ö",
	divide: "÷",
	oslash: "ø",
	ugrave: "ù",
	uacute: "ú",
	ucirc: "û",
	uuml: "ü",
	yacute: "ý",
	thorn: "þ",
	yuml: "ÿ",
	fnof: "ƒ",
	Alpha: "Α",
	Beta: "Β",
	Gamma: "Γ",
	Delta: "Δ",
	Epsilon: "Ε",
	Zeta: "Ζ",
	Eta: "Η",
	Theta: "Θ",
	Iota: "Ι",
	Kappa: "Κ",
	Lambda: "Λ",
	Mu: "Μ",
	Nu: "Ν",
	Xi: "Ξ",
	Omicron: "Ο",
	Pi: "Π",
	Rho: "Ρ",
	Sigma: "Σ",
	Tau: "Τ",
	Upsilon: "Υ",
	Phi: "Φ",
	Chi: "Χ",
	Psi: "Ψ",
	Omega: "Ω",
	alpha: "α",
	beta: "β",
	gamma: "γ",
	delta: "δ",
	epsilon: "ε",
	zeta: "ζ",
	eta: "η",
	theta: "θ",
	iota: "ι",
	kappa: "κ",
	lambda: "λ",
	mu: "μ",
	nu: "ν",
	xi: "ξ",
	omicron: "ο",
	pi: "π",
	rho: "ρ",
	sigmaf: "ς",
	sigma: "σ",
	tau: "τ",
	upsilon: "υ",
	phi: "φ",
	chi: "χ",
	psi: "ψ",
	omega: "ω",
	thetasym: "ϑ",
	upsih: "ϒ",
	piv: "ϖ",
	bull: "•",
	hellip: "…",
	prime: "′",
	Prime: "″",
	oline: "‾",
	frasl: "⁄",
	weierp: "℘",
	image: "ℑ",
	real: "ℜ",
	trade: "™",
	alefsym: "ℵ",
	larr: "←",
	uarr: "↑",
	rarr: "→",
	darr: "↓",
	harr: "↔",
	crarr: "↵",
	lArr: "⇐",
	uArr: "⇑",
	rArr: "⇒",
	dArr: "⇓",
	hArr: "⇔",
	forall: "∀",
	part: "∂",
	exist: "∃",
	empty: "∅",
	nabla: "∇",
	isin: "∈",
	notin: "∉",
	ni: "∋",
	prod: "∏",
	sum: "∑",
	minus: "−",
	lowast: "∗",
	radic: "√",
	prop: "∝",
	infin: "∞",
	ang: "∠",
	and: "∧",
	or: "∨",
	cap: "∩",
	cup: "∪",
	int: "∫",
	there4: "∴",
	sim: "∼",
	cong: "≅",
	asymp: "≈",
	ne: "≠",
	equiv: "≡",
	le: "≤",
	ge: "≥",
	sub: "⊂",
	sup: "⊃",
	nsub: "⊄",
	sube: "⊆",
	supe: "⊇",
	oplus: "⊕",
	otimes: "⊗",
	perp: "⊥",
	sdot: "⋅",
	lceil: "⌈",
	rceil: "⌉",
	lfloor: "⌊",
	rfloor: "⌋",
	lang: "〈",
	rang: "〉",
	loz: "◊",
	spades: "♠",
	clubs: "♣",
	hearts: "♥",
	diams: "♦",
	quot: "\"",
	amp: "&",
	lt: "<",
	gt: ">",
	OElig: "Œ",
	oelig: "œ",
	Scaron: "Š",
	scaron: "š",
	Yuml: "Ÿ",
	circ: "ˆ",
	tilde: "˜",
	ensp: " ",
	emsp: " ",
	thinsp: " ",
	zwnj: "‌",
	zwj: "‍",
	lrm: "‎",
	rlm: "‏",
	ndash: "–",
	mdash: "—",
	lsquo: "‘",
	rsquo: "’",
	sbquo: "‚",
	ldquo: "“",
	rdquo: "”",
	bdquo: "„",
	dagger: "†",
	Dagger: "‡",
	permil: "‰",
	lsaquo: "‹",
	rsaquo: "›",
	euro: "€"
}, Vu = [
	"cent",
	"copy",
	"divide",
	"gt",
	"lt",
	"not",
	"para",
	"times"
], Hu = {}.hasOwnProperty, Uu = {}, Wu;
for (Wu in Bu) Hu.call(Bu, Wu) && (Uu[Bu[Wu]] = Wu);
var Gu = /[^\dA-Za-z]/;
function Ku(e, t, n, r) {
	let i = String.fromCharCode(e);
	if (Hu.call(Uu, i)) {
		let e = Uu[i], a = "&" + e;
		return n && zu.includes(e) && !Vu.includes(e) && (!r || t && t !== 61 && Gu.test(String.fromCharCode(t))) ? a : a + ";";
	}
	return "";
}
//#endregion
//#region ../../node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/util/format-smart.js
function qu(e, t, n) {
	let r = Iu(e, t, n.omitOptionalSemicolons), i;
	if ((n.useNamedReferences || n.useShortestReferences) && (i = Ku(e, t, n.omitOptionalSemicolons, n.attribute)), (n.useShortestReferences || !i) && n.useShortestReferences) {
		let i = Ru(e, t, n.omitOptionalSemicolons);
		i.length < r.length && (r = i);
	}
	return i && (!n.useShortestReferences || i.length < r.length) ? i : r;
}
//#endregion
//#region ../../node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/index.js
function Ju(e, t) {
	return Mu(e, Object.assign({ format: qu }, t));
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/comment.js
var Yu = /^>|^->|<!--|-->|--!>|<!-$/g, Xu = [">"], Zu = ["<", ">"];
function Qu(e, t, n, r) {
	return r.settings.bogusComments ? "<?" + Ju(e.value, Object.assign({}, r.settings.characterReferences, { subset: Xu })) + ">" : "<!--" + e.value.replace(Yu, i) + "-->";
	function i(e) {
		return Ju(e, Object.assign({}, r.settings.characterReferences, { subset: Zu }));
	}
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/doctype.js
function $u(e, t, n, r) {
	return "<!" + (r.settings.upperDoctype ? "DOCTYPE" : "doctype") + (r.settings.tightDoctype ? "" : " ") + "html>";
}
//#endregion
//#region ../../node_modules/.pnpm/ccount@2.0.1/node_modules/ccount/index.js
function ed(e, t) {
	let n = String(e);
	if (typeof t != "string") throw TypeError("Expected character");
	let r = 0, i = n.indexOf(t);
	for (; i !== -1;) r++, i = n.indexOf(t, i + t.length);
	return r;
}
//#endregion
//#region ../../node_modules/.pnpm/comma-separated-tokens@2.0.3/node_modules/comma-separated-tokens/index.js
function td(e, t) {
	let n = t || {};
	return (e[e.length - 1] === "" ? [...e, ""] : e).join((n.padRight ? " " : "") + "," + (n.padLeft === !1 ? "" : " ")).trim();
}
//#endregion
//#region ../../node_modules/.pnpm/space-separated-tokens@2.0.2/node_modules/space-separated-tokens/index.js
function nd(e) {
	return e.join(" ").trim();
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-whitespace@3.0.0/node_modules/hast-util-whitespace/lib/index.js
var rd = /[ \t\n\f\r]/g;
function id(e) {
	return typeof e == "object" ? e.type === "text" ? ad(e.value) : !1 : ad(e);
}
function ad(e) {
	return e.replace(rd, "") === "";
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/omission/util/siblings.js
var $ = cd(1), od = cd(-1), sd = [];
function cd(e) {
	return t;
	function t(t, n, r) {
		let i = t ? t.children : sd, a = (n || 0) + e, o = i[a];
		if (!r) for (; o && id(o);) a += e, o = i[a];
		return o;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/omission/omission.js
var ld = {}.hasOwnProperty;
function ud(e) {
	return t;
	function t(t, n, r) {
		return ld.call(e, t.tagName) && e[t.tagName](t, n, r);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/omission/closing.js
var dd = ud({
	body: md,
	caption: fd,
	colgroup: fd,
	dd: vd,
	dt: _d,
	head: fd,
	html: pd,
	li: gd,
	optgroup: bd,
	option: xd,
	p: hd,
	rp: yd,
	rt: yd,
	tbody: Cd,
	td: Ed,
	tfoot: wd,
	th: Ed,
	thead: Sd,
	tr: Td
});
function fd(e, t, n) {
	let r = $(n, t, !0);
	return !r || r.type !== "comment" && !(r.type === "text" && id(r.value.charAt(0)));
}
function pd(e, t, n) {
	let r = $(n, t);
	return !r || r.type !== "comment";
}
function md(e, t, n) {
	let r = $(n, t);
	return !r || r.type !== "comment";
}
function hd(e, t, n) {
	let r = $(n, t);
	return r ? r.type === "element" && (r.tagName === "address" || r.tagName === "article" || r.tagName === "aside" || r.tagName === "blockquote" || r.tagName === "details" || r.tagName === "div" || r.tagName === "dl" || r.tagName === "fieldset" || r.tagName === "figcaption" || r.tagName === "figure" || r.tagName === "footer" || r.tagName === "form" || r.tagName === "h1" || r.tagName === "h2" || r.tagName === "h3" || r.tagName === "h4" || r.tagName === "h5" || r.tagName === "h6" || r.tagName === "header" || r.tagName === "hgroup" || r.tagName === "hr" || r.tagName === "main" || r.tagName === "menu" || r.tagName === "nav" || r.tagName === "ol" || r.tagName === "p" || r.tagName === "pre" || r.tagName === "section" || r.tagName === "table" || r.tagName === "ul") : !n || !(n.type === "element" && (n.tagName === "a" || n.tagName === "audio" || n.tagName === "del" || n.tagName === "ins" || n.tagName === "map" || n.tagName === "noscript" || n.tagName === "video"));
}
function gd(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && r.tagName === "li";
}
function _d(e, t, n) {
	let r = $(n, t);
	return !!(r && r.type === "element" && (r.tagName === "dt" || r.tagName === "dd"));
}
function vd(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && (r.tagName === "dt" || r.tagName === "dd");
}
function yd(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && (r.tagName === "rp" || r.tagName === "rt");
}
function bd(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && r.tagName === "optgroup";
}
function xd(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && (r.tagName === "option" || r.tagName === "optgroup");
}
function Sd(e, t, n) {
	let r = $(n, t);
	return !!(r && r.type === "element" && (r.tagName === "tbody" || r.tagName === "tfoot"));
}
function Cd(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && (r.tagName === "tbody" || r.tagName === "tfoot");
}
function wd(e, t, n) {
	return !$(n, t);
}
function Td(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && r.tagName === "tr";
}
function Ed(e, t, n) {
	let r = $(n, t);
	return !r || r.type === "element" && (r.tagName === "td" || r.tagName === "th");
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/omission/opening.js
var Dd = ud({
	body: Ad,
	colgroup: jd,
	head: kd,
	html: Od,
	tbody: Md
});
function Od(e) {
	let t = $(e, -1);
	return !t || t.type !== "comment";
}
function kd(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.children) if (n.type === "element" && (n.tagName === "base" || n.tagName === "title")) {
		if (t.has(n.tagName)) return !1;
		t.add(n.tagName);
	}
	let n = e.children[0];
	return !n || n.type === "element";
}
function Ad(e) {
	let t = $(e, -1, !0);
	return !t || t.type !== "comment" && !(t.type === "text" && id(t.value.charAt(0))) && !(t.type === "element" && (t.tagName === "meta" || t.tagName === "link" || t.tagName === "script" || t.tagName === "style" || t.tagName === "template"));
}
function jd(e, t, n) {
	let r = od(n, t), i = $(e, -1, !0);
	return n && r && r.type === "element" && r.tagName === "colgroup" && dd(r, n.children.indexOf(r), n) ? !1 : !!(i && i.type === "element" && i.tagName === "col");
}
function Md(e, t, n) {
	let r = od(n, t), i = $(e, -1);
	return n && r && r.type === "element" && (r.tagName === "thead" || r.tagName === "tbody") && dd(r, n.children.indexOf(r), n) ? !1 : !!(i && i.type === "element" && i.tagName === "tr");
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/element.js
var Nd = {
	name: [["	\n\f\r &/=>".split(""), "	\n\f\r \"&'/=>`".split("")], ["\0	\n\f\r \"&'/<=>".split(""), "\0	\n\f\r \"&'/<=>`".split("")]],
	unquoted: [["	\n\f\r &>".split(""), "\0	\n\f\r \"&'<=>`".split("")], ["\0	\n\f\r \"&'<=>`".split(""), "\0	\n\f\r \"&'<=>`".split("")]],
	single: [["&'".split(""), "\"&'`".split("")], ["\0&'".split(""), "\0\"&'`".split("")]],
	double: [["\"&".split(""), "\"&'`".split("")], ["\0\"&".split(""), "\0\"&'`".split("")]]
};
function Pd(e, t, n, r) {
	let i = r.schema, a = i.space === "svg" ? !1 : r.settings.omitOptionalTags, o = i.space === "svg" ? r.settings.closeEmptyElements : r.settings.voids.includes(e.tagName.toLowerCase()), s = [], c;
	i.space === "html" && e.tagName === "svg" && (r.schema = wu);
	let l = Fd(r, e.properties), u = r.all(i.space === "html" && e.tagName === "template" ? e.content : e);
	return r.schema = i, u && (o = !1), (l || !a || !Dd(e, t, n)) && (s.push("<", e.tagName, l ? " " + l : ""), o && (i.space === "svg" || r.settings.closeSelfClosing) && (c = l.charAt(l.length - 1), (!r.settings.tightSelfClosing || c === "/" || c && c !== "\"" && c !== "'") && s.push(" "), s.push("/")), s.push(">")), s.push(u), !o && (!a || !dd(e, t, n)) && s.push("</" + e.tagName + ">"), s.join("");
}
function Fd(e, t) {
	let n = [], r = -1, i;
	if (t) {
		for (i in t) if (t[i] !== null && t[i] !== void 0) {
			let r = Id(e, i, t[i]);
			r && n.push(r);
		}
	}
	for (; ++r < n.length;) {
		let t = e.settings.tightAttributes ? n[r].charAt(n[r].length - 1) : void 0;
		r !== n.length - 1 && t !== "\"" && t !== "'" && (n[r] += " ");
	}
	return n.join("");
}
function Id(e, t, n) {
	let r = bu(e.schema, t), i = e.settings.allowParseErrors && e.schema.space === "html" ? 0 : 1, a = +!e.settings.allowDangerousCharacters, o = e.quote, s;
	if (r.overloadedBoolean && (n === r.attribute || n === "") ? n = !0 : (r.boolean || r.overloadedBoolean) && (typeof n != "string" || n === r.attribute || n === "") && (n = !!n), n == null || n === !1 || typeof n == "number" && Number.isNaN(n)) return "";
	let c = Ju(r.attribute, Object.assign({}, e.settings.characterReferences, { subset: Nd.name[i][a] }));
	return n === !0 || (n = Array.isArray(n) ? (r.commaSeparated ? td : nd)(n, { padLeft: !e.settings.tightCommaSeparatedLists }) : String(n), e.settings.collapseEmptyAttributes && !n) ? c : (e.settings.preferUnquoted && (s = Ju(n, Object.assign({}, e.settings.characterReferences, {
		attribute: !0,
		subset: Nd.unquoted[i][a]
	}))), s !== n && (e.settings.quoteSmart && ed(n, o) > ed(n, e.alternative) && (o = e.alternative), s = o + Ju(n, Object.assign({}, e.settings.characterReferences, {
		subset: (o === "'" ? Nd.single : Nd.double)[i][a],
		attribute: !0
	})) + o), c + (s && "=" + s));
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/text.js
var Ld = ["<", "&"];
function Rd(e, t, n, r) {
	return n && n.type === "element" && (n.tagName === "script" || n.tagName === "style") ? e.value : Ju(e.value, Object.assign({}, r.settings.characterReferences, { subset: Ld }));
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/raw.js
function zd(e, t, n, r) {
	return r.settings.allowDangerousHtml ? e.value : Rd(e, t, n, r);
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/root.js
function Bd(e, t, n, r) {
	return r.all(e);
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/handle/index.js
var Vd = Eu("type", {
	invalid: Hd,
	unknown: Ud,
	handlers: {
		comment: Qu,
		doctype: $u,
		element: Pd,
		raw: zd,
		root: Bd,
		text: Rd
	}
});
function Hd(e) {
	throw Error("Expected node, not `" + e + "`");
}
function Ud(e) {
	throw Error("Cannot compile unknown node `" + e.type + "`");
}
//#endregion
//#region ../../node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html/lib/index.js
var Wd = {}, Gd = {}, Kd = [];
function qd(e, t) {
	let n = t || Wd, r = n.quote || "\"", i = r === "\"" ? "'" : "\"";
	if (r !== "\"" && r !== "'") throw Error("Invalid quote `" + r + "`, expected `'` or `\"`");
	return {
		one: Jd,
		all: Yd,
		settings: {
			omitOptionalTags: n.omitOptionalTags || !1,
			allowParseErrors: n.allowParseErrors || !1,
			allowDangerousCharacters: n.allowDangerousCharacters || !1,
			quoteSmart: n.quoteSmart || !1,
			preferUnquoted: n.preferUnquoted || !1,
			tightAttributes: n.tightAttributes || !1,
			upperDoctype: n.upperDoctype || !1,
			tightDoctype: n.tightDoctype || !1,
			bogusComments: n.bogusComments || !1,
			tightCommaSeparatedLists: n.tightCommaSeparatedLists || !1,
			tightSelfClosing: n.tightSelfClosing || !1,
			collapseEmptyAttributes: n.collapseEmptyAttributes || !1,
			allowDangerousHtml: n.allowDangerousHtml || !1,
			voids: n.voids || Xl,
			characterReferences: n.characterReferences || Gd,
			closeSelfClosing: n.closeSelfClosing || !1,
			closeEmptyElements: n.closeEmptyElements || !1
		},
		schema: n.space === "svg" ? wu : Cu,
		quote: r,
		alternative: i
	}.one(Array.isArray(e) ? {
		type: "root",
		children: e
	} : e, void 0, void 0);
}
function Jd(e, t, n) {
	return Vd(e, t, n, this);
}
function Yd(e) {
	let t = [], n = e && e.children || Kd, r = -1;
	for (; ++r < n.length;) t[r] = this.one(n[r], r, e);
	return t.join("");
}
//#endregion
//#region ../../node_modules/.pnpm/@shikijs+core@4.1.0/node_modules/@shikijs/core/dist/index.mjs
var Xd = /\s+/g;
function Zd(e, t) {
	if (!t) return e;
	e.properties ||= {}, e.properties.class ||= [], typeof e.properties.class == "string" && (e.properties.class = e.properties.class.split(Xd)), Array.isArray(e.properties.class) || (e.properties.class = []);
	let n = Array.isArray(t) ? t : t.split(Xd);
	for (let t of n) t && !e.properties.class.includes(t) && e.properties.class.push(t);
	return e;
}
var Qd = /:?lang=["']([^"']+)["']/g, $d = /(?:```|~~~)([\w-]+)/g, ef = /\\begin\{([\w-]+)\}/g, tf = /<script\s+(?:type|lang)=["']([^"']+)["']/gi;
function nf(e) {
	let t = vl(e, !0).map(([e]) => e);
	function n(n) {
		if (n === e.length) return {
			line: t.length - 1,
			character: t.at(-1).length
		};
		let r = n, i = 0;
		for (let e of t) {
			if (r < e.length) break;
			r -= e.length, i++;
		}
		return {
			line: i,
			character: r
		};
	}
	function r(e, n) {
		let r = 0;
		for (let n = 0; n < e; n++) r += t[n].length;
		return r += n, r;
	}
	return {
		lines: t,
		indexToPos: n,
		posToIndex: r
	};
}
function rf(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let t of e.matchAll(Qd)) {
		let e = t[1].toLowerCase().trim();
		e && r.add(e);
	}
	for (let t of e.matchAll($d)) {
		let e = t[1].toLowerCase().trim();
		e && r.add(e);
	}
	for (let t of e.matchAll(ef)) {
		let e = t[1].toLowerCase().trim();
		e && r.add(e);
	}
	for (let t of e.matchAll(tf)) {
		let e = t[1].toLowerCase().trim(), n = e.includes("/") ? e.split("/").pop() : e;
		n && r.add(n);
	}
	if (!n) return [...r];
	let i = n.getBundledLanguages();
	return [...r].filter((e) => e && i[e]);
}
var af = ["color", "background-color"];
function of(e, t) {
	let n = 0, r = [];
	for (let i of t) i > n && r.push({
		...e,
		content: e.content.slice(n, i),
		offset: e.offset + n
	}), n = i;
	return n < e.content.length && r.push({
		...e,
		content: e.content.slice(n),
		offset: e.offset + n
	}), r;
}
function sf(e, t) {
	let n = [...t instanceof Set ? t : new Set(t)].sort((e, t) => e - t);
	return n.length ? e.map((e) => e.flatMap((e) => {
		let t = n.filter((t) => e.offset < t && t < e.offset + e.content.length).map((t) => t - e.offset).sort((e, t) => e - t);
		return t.length ? of(e, t) : e;
	})) : e;
}
function cf(e, t, n, r, i = "css-vars") {
	let a = {
		content: e.content,
		explanation: e.explanation,
		offset: e.offset
	}, o = t.map((t) => lf(e.variants[t])), s = new Set(o.flatMap((e) => Object.keys(e))), c = {}, l = (e, r) => {
		let i = r === "color" ? "" : r === "background-color" ? "-bg" : `-${r}`;
		return n + t[e] + (r === "color" ? "" : i);
	};
	return o.forEach((e, n) => {
		for (let a of s) {
			let s = e[a] || "inherit";
			if (n === 0 && r && af.includes(a)) if (r === "light-dark()" && o.length > 1) {
				let e = t.findIndex((e) => e === "light"), r = t.findIndex((e) => e === "dark");
				if (e === -1 || r === -1) throw new G("When using `defaultColor: \"light-dark()\"`, you must provide both `light` and `dark` themes");
				c[a] = `light-dark(${o[e][a] || "inherit"}, ${o[r][a] || "inherit"})`, i === "css-vars" && (c[l(n, a)] = s);
			} else c[a] = s;
			else i === "css-vars" && (c[l(n, a)] = s);
		}
	}), a.htmlStyle = c, a;
}
function lf(e) {
	let t = {};
	if (e.color && (t.color = e.color), e.bgColor && (t["background-color"] = e.bgColor), e.fontStyle) {
		e.fontStyle & K.Italic && (t["font-style"] = "italic"), e.fontStyle & K.Bold && (t["font-weight"] = "bold");
		let n = [];
		e.fontStyle & K.Underline && n.push("underline"), e.fontStyle & K.Strikethrough && n.push("line-through"), n.length && (t["text-decoration"] = n.join(" "));
	}
	return t;
}
function uf(e) {
	return typeof e == "string" ? e : Object.entries(e).map(([e, t]) => `${e}:${t}`).join(";");
}
function df() {
	let e = /* @__PURE__ */ new WeakMap();
	function t(t) {
		if (!e.has(t.meta)) {
			let n = nf(t.source);
			function r(e) {
				if (typeof e == "number") {
					if (e < 0 || e > t.source.length) throw new G(`Invalid decoration offset: ${e}. Code length: ${t.source.length}`);
					return {
						...n.indexToPos(e),
						offset: e
					};
				} else {
					let t = n.lines[e.line];
					if (t === void 0) throw new G(`Invalid decoration position ${JSON.stringify(e)}. Lines length: ${n.lines.length}`);
					let r = e.character;
					if (r < 0 && (r = t.length + r), r < 0 || r > t.length) throw new G(`Invalid decoration position ${JSON.stringify(e)}. Line ${e.line} length: ${t.length}`);
					return {
						...e,
						character: r,
						offset: n.posToIndex(e.line, r)
					};
				}
			}
			let i = (t.options.decorations || []).map((e) => ({
				...e,
				start: r(e.start),
				end: r(e.end)
			}));
			ff(i), e.set(t.meta, {
				decorations: i,
				converter: n,
				source: t.source
			});
		}
		return e.get(t.meta);
	}
	return {
		name: "shiki:decorations",
		tokens(e) {
			if (this.options.decorations?.length) return sf(e, t(this).decorations.flatMap((e) => [e.start.offset, e.end.offset]));
		},
		code(e) {
			if (!this.options.decorations?.length) return;
			let n = t(this), r = [...e.children].filter((e) => e.type === "element" && e.tagName === "span");
			if (r.length !== n.converter.lines.length) throw new G(`Number of lines in code element (${r.length}) does not match the number of lines in the source (${n.converter.lines.length}). Failed to apply decorations.`);
			function i(e, t, n, i) {
				let a = r[e], s = "", c = -1, l = -1;
				if (t === 0 && (c = 0), n === 0 && (l = 0), n === Infinity && (l = a.children.length), c === -1 || l === -1) for (let e = 0; e < a.children.length; e++) s += pf(a.children[e]), c === -1 && s.length === t && (c = e + 1), l === -1 && s.length === n && (l = e + 1);
				if (c === -1) throw new G(`Failed to find start index for decoration ${JSON.stringify(i.start)}`);
				if (l === -1) throw new G(`Failed to find end index for decoration ${JSON.stringify(i.end)}`);
				let u = a.children.slice(c, l);
				if (!i.alwaysWrap && u.length === a.children.length) o(a, i, "line");
				else if (!i.alwaysWrap && u.length === 1 && u[0].type === "element") o(u[0], i, "token");
				else {
					let e = {
						type: "element",
						tagName: "span",
						properties: {},
						children: u
					};
					o(e, i, "wrapper"), a.children.splice(c, u.length, e);
				}
			}
			function a(e, t) {
				r[e] = o(r[e], t, "line");
			}
			function o(e, t, n) {
				let r = t.properties || {}, i = t.transform || ((e) => e);
				return e.tagName = t.tagName || "span", e.properties = {
					...e.properties,
					...r,
					class: e.properties.class
				}, t.properties?.class && Zd(e, t.properties.class), e = i(e, n) || e, e;
			}
			let s = [], c = n.decorations.sort((e, t) => t.start.offset - e.start.offset || e.end.offset - t.end.offset);
			for (let e of c) {
				let { start: t, end: n } = e;
				if (t.line === n.line) i(t.line, t.character, n.character, e);
				else if (t.line < n.line) {
					i(t.line, t.character, Infinity, e);
					for (let r = t.line + 1; r < n.line; r++) s.unshift(() => a(r, e));
					i(n.line, 0, n.character, e);
				}
			}
			s.forEach((e) => e());
		}
	};
}
function ff(e) {
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		if (n.start.offset > n.end.offset) throw new G(`Invalid decoration range: ${JSON.stringify(n.start)} - ${JSON.stringify(n.end)}`);
		for (let r = t + 1; r < e.length; r++) {
			let t = e[r], i = n.start.offset <= t.start.offset && t.start.offset < n.end.offset, a = n.start.offset < t.end.offset && t.end.offset <= n.end.offset, o = t.start.offset <= n.start.offset && n.start.offset < t.end.offset, s = t.start.offset < n.end.offset && n.end.offset <= t.end.offset;
			if (i || a || o || s) {
				if (i && a || o && s || o && n.start.offset === n.end.offset || a && t.start.offset === t.end.offset) continue;
				throw new G(`Decorations ${JSON.stringify(n.start)} and ${JSON.stringify(t.start)} intersect.`);
			}
		}
	}
}
function pf(e) {
	return e.type === "text" ? e.value : e.type === "element" ? e.children.map(pf).join("") : "";
}
var mf = [/* @__PURE__ */ df()];
function hf(e) {
	let t = gf(e.transformers || []);
	return [
		...t.pre,
		...t.normal,
		...t.post,
		...mf
	];
}
function gf(e) {
	let t = [], n = [], r = [];
	for (let i of e) switch (i.enforce) {
		case "pre":
			t.push(i);
			break;
		case "post":
			n.push(i);
			break;
		default: r.push(i);
	}
	return {
		pre: t,
		post: n,
		normal: r
	};
}
var _f = [
	"black",
	"red",
	"green",
	"yellow",
	"blue",
	"magenta",
	"cyan",
	"white",
	"brightBlack",
	"brightRed",
	"brightGreen",
	"brightYellow",
	"brightBlue",
	"brightMagenta",
	"brightCyan",
	"brightWhite"
], vf = {
	1: "bold",
	2: "dim",
	3: "italic",
	4: "underline",
	7: "reverse",
	8: "hidden",
	9: "strikethrough"
};
function yf(e, t) {
	let n = e.indexOf("\x1B", t);
	if (n !== -1 && e[n + 1] === "[") {
		let t = e.indexOf("m", n);
		if (t !== -1) return {
			sequence: e.substring(n + 2, t).split(";"),
			startPosition: n,
			position: t + 1
		};
	}
	return { position: e.length };
}
function bf(e) {
	let t = e.shift();
	if (t === "2") {
		let t = e.splice(0, 3).map((e) => Number.parseInt(e));
		return t.length !== 3 || t.some((e) => Number.isNaN(e)) ? void 0 : {
			type: "rgb",
			rgb: t
		};
	} else if (t === "5") {
		let t = e.shift();
		if (t) return {
			type: "table",
			index: Number(t)
		};
	}
}
function xf(e) {
	let t = [];
	for (; e.length > 0;) {
		let n = e.shift();
		if (!n) continue;
		let r = Number.parseInt(n);
		if (!Number.isNaN(r)) if (r === 0) t.push({ type: "resetAll" });
		else if (r <= 9) vf[r] && t.push({
			type: "setDecoration",
			value: vf[r]
		});
		else if (r <= 29) {
			let e = vf[r - 20];
			e && (t.push({
				type: "resetDecoration",
				value: e
			}), e === "dim" && t.push({
				type: "resetDecoration",
				value: "bold"
			}));
		} else if (r <= 37) t.push({
			type: "setForegroundColor",
			value: {
				type: "named",
				name: _f[r - 30]
			}
		});
		else if (r === 38) {
			let n = bf(e);
			n && t.push({
				type: "setForegroundColor",
				value: n
			});
		} else if (r === 39) t.push({ type: "resetForegroundColor" });
		else if (r <= 47) t.push({
			type: "setBackgroundColor",
			value: {
				type: "named",
				name: _f[r - 40]
			}
		});
		else if (r === 48) {
			let n = bf(e);
			n && t.push({
				type: "setBackgroundColor",
				value: n
			});
		} else r === 49 ? t.push({ type: "resetBackgroundColor" }) : r === 53 ? t.push({
			type: "setDecoration",
			value: "overline"
		}) : r === 55 ? t.push({
			type: "resetDecoration",
			value: "overline"
		}) : r >= 90 && r <= 97 ? t.push({
			type: "setForegroundColor",
			value: {
				type: "named",
				name: _f[r - 90 + 8]
			}
		}) : r >= 100 && r <= 107 && t.push({
			type: "setBackgroundColor",
			value: {
				type: "named",
				name: _f[r - 100 + 8]
			}
		});
	}
	return t;
}
function Sf() {
	let e = null, t = null, n = /* @__PURE__ */ new Set();
	return { parse(r) {
		let i = [], a = 0;
		do {
			let o = yf(r, a), s = o.sequence ? r.substring(a, o.startPosition) : r.substring(a);
			if (s.length > 0 && i.push({
				value: s,
				foreground: e,
				background: t,
				decorations: new Set(n)
			}), o.sequence) {
				let r = xf(o.sequence);
				for (let i of r) i.type === "resetAll" ? (e = null, t = null, n.clear()) : i.type === "resetForegroundColor" ? e = null : i.type === "resetBackgroundColor" ? t = null : i.type === "resetDecoration" && n.delete(i.value);
				for (let i of r) i.type === "setForegroundColor" ? e = i.value : i.type === "setBackgroundColor" ? t = i.value : i.type === "setDecoration" && n.add(i.value);
			}
			a = o.position;
		} while (a < r.length);
		return i;
	} };
}
var Cf = {
	black: "#000000",
	red: "#bb0000",
	green: "#00bb00",
	yellow: "#bbbb00",
	blue: "#0000bb",
	magenta: "#ff00ff",
	cyan: "#00bbbb",
	white: "#eeeeee",
	brightBlack: "#555555",
	brightRed: "#ff5555",
	brightGreen: "#00ff00",
	brightYellow: "#ffff55",
	brightBlue: "#5555ff",
	brightMagenta: "#ff55ff",
	brightCyan: "#55ffff",
	brightWhite: "#ffffff"
};
function wf(e = Cf) {
	function t(t) {
		return e[t];
	}
	function n(e) {
		return `#${e.map((e) => Math.max(0, Math.min(e, 255)).toString(16).padStart(2, "0")).join("")}`;
	}
	let r;
	function i() {
		if (r) return r;
		r = [];
		for (let e = 0; e < _f.length; e++) r.push(t(_f[e]));
		let e = [
			0,
			95,
			135,
			175,
			215,
			255
		];
		for (let t = 0; t < 6; t++) for (let i = 0; i < 6; i++) for (let a = 0; a < 6; a++) r.push(n([
			e[t],
			e[i],
			e[a]
		]));
		let i = 8;
		for (let e = 0; e < 24; e++, i += 10) r.push(n([
			i,
			i,
			i
		]));
		return r;
	}
	function a(e) {
		return i()[e];
	}
	function o(e) {
		switch (e.type) {
			case "named": return t(e.name);
			case "rgb": return n(e.rgb);
			case "table": return a(e.index);
		}
	}
	return { value: o };
}
var Tf = /#([0-9a-f]{3,8})/i, Ef = /var\((--[\w-]+-ansi-[\w-]+)\)/, Df = {
	black: "#000000",
	red: "#cd3131",
	green: "#0DBC79",
	yellow: "#E5E510",
	blue: "#2472C8",
	magenta: "#BC3FBC",
	cyan: "#11A8CD",
	white: "#E5E5E5",
	brightBlack: "#666666",
	brightRed: "#F14C4C",
	brightGreen: "#23D18B",
	brightYellow: "#F5F543",
	brightBlue: "#3B8EEA",
	brightMagenta: "#D670D6",
	brightCyan: "#29B8DB",
	brightWhite: "#FFFFFF"
};
function Of(e, t, n) {
	let r = ll(e, n), i = vl(t), a = wf(Object.fromEntries(_f.map((t) => {
		let n = `terminal.ansi${t[0].toUpperCase()}${t.substring(1)}`;
		return [t, e.colors?.[n] || Df[t]];
	}))), o = Sf();
	return i.map((t) => o.parse(t[0]).map((n) => {
		let i, o;
		n.decorations.has("reverse") ? (i = n.background ? a.value(n.background) : e.bg, o = n.foreground ? a.value(n.foreground) : e.fg) : (i = n.foreground ? a.value(n.foreground) : e.fg, o = n.background ? a.value(n.background) : void 0), i = ul(i, r), o = ul(o, r), n.decorations.has("dim") && (i = kf(i));
		let s = K.None;
		return n.decorations.has("bold") && (s |= K.Bold), n.decorations.has("italic") && (s |= K.Italic), n.decorations.has("underline") && (s |= K.Underline), n.decorations.has("strikethrough") && (s |= K.Strikethrough), {
			content: n.value,
			offset: t[1],
			color: i,
			bgColor: o,
			fontStyle: s
		};
	}));
}
function kf(e) {
	let t = e.match(Tf);
	if (t) {
		let e = t[1];
		if (e.length === 8) {
			let t = Math.round(Number.parseInt(e.slice(6, 8), 16) / 2).toString(16).padStart(2, "0");
			return `#${e.slice(0, 6)}${t}`;
		} else if (e.length === 6) return `#${e}80`;
		else if (e.length === 4) {
			let t = e[0], n = e[1], r = e[2], i = e[3];
			return `#${t}${t}${n}${n}${r}${r}${Math.round(Number.parseInt(`${i}${i}`, 16) / 2).toString(16).padStart(2, "0")}`;
		} else if (e.length === 3) {
			let t = e[0], n = e[1], r = e[2];
			return `#${t}${t}${n}${n}${r}${r}80`;
		}
	}
	let n = e.match(Ef);
	return n ? `var(${n[1]}-dim)` : e;
}
function Af(e, t, n = {}) {
	let r = e.resolveLangAlias(n.lang || "text"), { theme: i = e.getLoadedThemes()[0] } = n;
	if (!pl(r) && !hl(i) && r === "ansi") {
		let { theme: r } = e.setTheme(i);
		return Of(r, t, n);
	}
	return zl(e, t, n);
}
function jf(e, t, n) {
	let r, i, a, o, s, c;
	if ("themes" in n) {
		let { defaultColor: l = "light", cssVariablePrefix: u = "--shiki-", colorsRendering: d = "css-vars" } = n, f = Object.entries(n.themes).filter((e) => e[1]).map((e) => ({
			color: e[0],
			theme: e[1]
		})).sort((e, t) => e.color === l ? -1 : +(t.color === l));
		if (f.length === 0) throw new G("`themes` option must not be empty");
		let p = Jl(e, t, n, Af);
		if (c = Nl(p), l && l !== "light-dark()" && !f.some((e) => e.color === l)) throw new G(`\`themes\` option must contain the defaultColor key \`${l}\``);
		let m = f.map((t) => e.getTheme(t.theme)), h = f.map((e) => e.color);
		a = p.map((e) => e.map((e) => cf(e, h, u, l, d))), c && Ml(a, c);
		let g = f.map((e) => ll(e.theme, n));
		i = Mf(f, m, g, u, l, "fg", d), r = Mf(f, m, g, u, l, "bg", d), o = `shiki-themes ${m.map((e) => e.name).join(" ")}`, s = l ? void 0 : [i, r].join(";");
	} else if ("theme" in n) {
		let s = ll(n.theme, n);
		a = Af(e, t, n);
		let l = e.getTheme(n.theme);
		r = ul(l.bg, s), i = ul(l.fg, s), o = l.name, c = Nl(a);
	} else throw new G("Invalid options, either `theme` or `themes` must be provided");
	return {
		tokens: a,
		fg: i,
		bg: r,
		themeName: o,
		rootStyle: s,
		grammarState: c
	};
}
function Mf(e, t, n, r, i, a, o) {
	return e.map((s, c) => {
		let l = ul(t[c][a], n[c]) || "inherit", u = `${r + s.color}${a === "bg" ? "-bg" : ""}:${l}`;
		if (c === 0 && i) {
			if (i === "light-dark()" && e.length > 1) {
				let r = e.findIndex((e) => e.color === "light"), i = e.findIndex((e) => e.color === "dark");
				if (r === -1 || i === -1) throw new G("When using `defaultColor: \"light-dark()\"`, you must provide both `light` and `dark` themes");
				return `light-dark(${ul(t[r][a], n[r]) || "inherit"}, ${ul(t[i][a], n[i]) || "inherit"});${u}`;
			}
			return l;
		}
		return o === "css-vars" ? u : null;
	}).filter((e) => !!e).join(";");
}
var Nf = /^\s+$/, Pf = /^(\s*)(.*?)(\s*)$/;
function Ff(e, t, n, r = {
	meta: {},
	options: n,
	codeToHast: (t, n) => Ff(e, t, n),
	codeToTokens: (t, n) => jf(e, t, n)
}) {
	let i = t;
	for (let e of hf(n)) i = e.preprocess?.call(r, i, n) || i;
	let { tokens: a, fg: o, bg: s, themeName: c, rootStyle: l, grammarState: u } = jf(e, i, n), { mergeWhitespaces: d = !0, mergeSameStyleTokens: f = !1 } = n;
	d === !0 ? a = Lf(a) : d === "never" && (a = Rf(a)), f && (a = zf(a));
	let p = {
		...r,
		get source() {
			return i;
		}
	};
	for (let e of hf(n)) a = e.tokens?.call(p, a) || a;
	return If(a, {
		...n,
		fg: o,
		bg: s,
		themeName: c,
		rootStyle: n.rootStyle === !1 ? !1 : n.rootStyle ?? l
	}, p, u);
}
function If(e, t, n, r = Nl(e)) {
	let i = hf(t), a = [], o = {
		type: "root",
		children: []
	}, { structure: s = "classic", tabindex: c = "0" } = t, l = { class: `shiki ${t.themeName || ""}` };
	t.rootStyle !== !1 && (t.rootStyle == null ? l.style = `background-color:${t.bg};color:${t.fg}` : l.style = t.rootStyle), c !== !1 && c != null && (l.tabindex = c.toString());
	for (let [e, n] of Object.entries(t.meta || {})) e.startsWith("_") || (l[e] = n);
	let u = {
		type: "element",
		tagName: "pre",
		properties: l,
		children: [],
		data: t.data
	}, d = {
		type: "element",
		tagName: "code",
		properties: {},
		children: a
	}, f = [], p = {
		...n,
		structure: s,
		addClassToHast: Zd,
		get source() {
			return n.source;
		},
		get tokens() {
			return e;
		},
		get options() {
			return t;
		},
		get root() {
			return o;
		},
		get pre() {
			return u;
		},
		get code() {
			return d;
		},
		get lines() {
			return f;
		}
	};
	if (e.forEach((e, t) => {
		t && (s === "inline" ? o.children.push({
			type: "element",
			tagName: "br",
			properties: {},
			children: []
		}) : s === "classic" && a.push({
			type: "text",
			value: "\n"
		}));
		let n = {
			type: "element",
			tagName: "span",
			properties: { class: "line" },
			children: []
		}, r = 0;
		for (let a of e) {
			let e = {
				type: "element",
				tagName: "span",
				properties: { ...a.htmlAttrs },
				children: [{
					type: "text",
					value: a.content
				}]
			}, c = uf(a.htmlStyle || lf(a));
			c && (e.properties.style = c);
			for (let o of i) e = o?.span?.call(p, e, t + 1, r, n, a) || e;
			s === "inline" ? o.children.push(e) : s === "classic" && n.children.push(e), r += a.content.length;
		}
		if (s === "classic") {
			for (let e of i) n = e?.line?.call(p, n, t + 1) || n;
			f.push(n), a.push(n);
		} else s === "inline" && f.push(n);
	}), s === "classic") {
		for (let e of i) d = e?.code?.call(p, d) || d;
		u.children.push(d);
		for (let e of i) u = e?.pre?.call(p, u) || u;
		o.children.push(u);
	} else if (s === "inline") {
		let e = [], t = {
			type: "element",
			tagName: "span",
			properties: { class: "line" },
			children: []
		};
		for (let n of o.children) n.type === "element" && n.tagName === "br" ? (e.push(t), t = {
			type: "element",
			tagName: "span",
			properties: { class: "line" },
			children: []
		}) : (n.type === "element" || n.type === "text") && t.children.push(n);
		e.push(t);
		let n = {
			type: "element",
			tagName: "code",
			properties: {},
			children: e
		};
		for (let e of i) n = e?.code?.call(p, n) || n;
		o.children = [];
		for (let e = 0; e < n.children.length; e++) {
			e > 0 && o.children.push({
				type: "element",
				tagName: "br",
				properties: {},
				children: []
			});
			let t = n.children[e];
			t.type === "element" && o.children.push(...t.children);
		}
	}
	let m = o;
	for (let e of i) m = e?.root?.call(p, m) || m;
	return r && Ml(m, r), m;
}
function Lf(e) {
	return e.map((e) => {
		let t = [], n = "", r;
		return e.forEach((i, a) => {
			let o = !(i.fontStyle && (i.fontStyle & K.Underline || i.fontStyle & K.Strikethrough));
			o && Nf.test(i.content) && e[a + 1] ? (r === void 0 && (r = i.offset), n += i.content) : n ? (o ? t.push({
				...i,
				offset: r,
				content: n + i.content
			}) : t.push({
				content: n,
				offset: r
			}, i), r = void 0, n = "") : t.push(i);
		}), t;
	});
}
function Rf(e) {
	return e.map((e) => e.flatMap((e) => {
		if (Nf.test(e.content)) return e;
		let t = e.content.match(Pf);
		if (!t) return e;
		let [, n, r, i] = t;
		if (!n && !i) return e;
		let a = [{
			...e,
			offset: e.offset + n.length,
			content: r
		}];
		return n && a.unshift({
			content: n,
			offset: e.offset
		}), i && a.push({
			content: i,
			offset: e.offset + n.length + r.length
		}), a;
	}));
}
function zf(e) {
	return e.map((e) => {
		let t = [];
		for (let n of e) {
			if (t.length === 0) {
				t.push({ ...n });
				continue;
			}
			let e = t.at(-1), r = uf(e.htmlStyle || lf(e)), i = uf(n.htmlStyle || lf(n)), a = e.fontStyle && (e.fontStyle & K.Underline || e.fontStyle & K.Strikethrough), o = n.fontStyle && (n.fontStyle & K.Underline || n.fontStyle & K.Strikethrough);
			!a && !o && r === i ? e.content += n.content : t.push({ ...n });
		}
		return t;
	});
}
var Bf = qd;
function Vf(e, t, n) {
	let r = {
		meta: {},
		options: n,
		codeToHast: (t, n) => Ff(e, t, n),
		codeToTokens: (t, n) => jf(e, t, n)
	}, i = Bf(Ff(e, t, n, r));
	for (let e of hf(n)) i = e.postprocess?.call(r, i, n) || i;
	return i;
}
async function Hf(e) {
	let t = await Al(e);
	return {
		getLastGrammarState: (...e) => Bl(t, ...e),
		codeToTokensBase: (e, n) => Af(t, e, n),
		codeToTokensWithThemes: (e, n) => Jl(t, e, n),
		codeToTokens: (e, n) => jf(t, e, n),
		codeToHast: (e, n) => Ff(t, e, n),
		codeToHtml: (e, n) => Vf(t, e, n),
		getBundledLanguages: () => ({}),
		getBundledThemes: () => ({}),
		...t,
		getInternalContext: () => t
	};
}
function Uf(e) {
	let t = e.langs, n = e.themes, r = e.engine;
	async function i(e) {
		function i(n) {
			if (typeof n == "string") {
				if (n = e.langAlias?.[n] || n, ml(n)) return [];
				let r = t[n];
				if (!r) throw new G(`Language \`${n}\` is not included in this bundle. You may want to load it from external source.`);
				return r;
			}
			return n;
		}
		function a(e) {
			if (gl(e)) return "none";
			if (typeof e == "string") {
				let t = n[e];
				if (!t) throw new G(`Theme \`${e}\` is not included in this bundle. You may want to load it from external source.`);
				return t;
			}
			return e;
		}
		let o = (e.themes ?? []).map((e) => a(e)), s = (e.langs ?? []).map((e) => i(e)), c = await Hf({
			engine: e.engine ?? r(),
			...e,
			themes: o,
			langs: s
		});
		return {
			...c,
			loadLanguage(...e) {
				return c.loadLanguage(...e.map(i));
			},
			loadTheme(...e) {
				return c.loadTheme(...e.map(a));
			},
			getBundledLanguages() {
				return t;
			},
			getBundledThemes() {
				return n;
			}
		};
	}
	return i;
}
function Wf(e) {
	let t;
	async function n(n = {}) {
		if (t) {
			let e = await t;
			return await Promise.all([e.loadTheme(...n.themes || []), e.loadLanguage(...n.langs || [])]), e;
		} else {
			t = e({
				...n,
				themes: [],
				langs: []
			});
			let r = await t;
			return await Promise.all([r.loadTheme(...n.themes || []), r.loadLanguage(...n.langs || [])]), r;
		}
	}
	return n;
}
function Gf(e, t) {
	let n = Wf(e);
	async function r(e, r) {
		let i = await n({
			langs: [r.lang],
			themes: "theme" in r ? [r.theme] : Object.values(r.themes)
		}), a = await t?.guessEmbeddedLanguages?.(e, r.lang, i);
		return a && await i.loadLanguage(...a), i;
	}
	return {
		getSingletonHighlighter(e) {
			return n(e);
		},
		async codeToHtml(e, t) {
			return (await r(e, t)).codeToHtml(e, t);
		},
		async codeToHast(e, t) {
			return (await r(e, t)).codeToHast(e, t);
		},
		async codeToTokens(e, t) {
			return (await r(e, t)).codeToTokens(e, t);
		},
		async codeToTokensBase(e, t) {
			return (await r(e, t)).codeToTokensBase(e, t);
		},
		async codeToTokensWithThemes(e, t) {
			return (await r(e, t)).codeToTokensWithThemes(e, t);
		},
		async getLastGrammarState(e, t) {
			return (await n({
				langs: [t.lang],
				themes: [t.theme]
			})).getLastGrammarState(e, t);
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/shiki@4.1.0/node_modules/shiki/dist/bundle-full.mjs
var Kf = /* @__PURE__ */ Uf({
	langs: Zo,
	themes: Qo,
	engine: () => (0, Es.createOnigurumaEngine)(import("./wasm-3LNtWDaB.js"))
}), { codeToHtml: qf, codeToHast: Jf, codeToTokens: Yf, codeToTokensBase: Xf, codeToTokensWithThemes: Zf, getSingletonHighlighter: Qf, getLastGrammarState: $f } = /* @__PURE__ */ Gf(Kf, { guessEmbeddedLanguages: rf }), ep = {
	scopeName: "nsx.get.injection",
	injectionSelector: "L:source.nsx -comment -string, L:source.ns -comment -string",
	patterns: [
		{
			name: "keyword.control.flow",
			match: "<::(?=\\s|>)"
		},
		{
			name: "keyword.control.flow",
			match: "<\\/::>"
		},
		{
			match: "^(\\s*)(<:>)",
			captures: { 2: { name: "keyword.control.flow" } }
		},
		{
			name: "storage.type.function.arrow",
			match: "<:>"
		},
		{
			name: "keyword.operator.at",
			match: "(?<=[A-Za-z_$][\\w$]*)@"
		},
		{
			name: "keyword.operator.at",
			match: "(?<=\\))@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			name: "keyword.operator.at",
			match: "(?<=\\})@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			name: "keyword.operator.at",
			match: "(?<=\\])@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			name: "keyword.operator.at",
			match: "(?<=[?!])@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			name: "storage.type",
			match: "\\bget(?=\\s+[A-Za-z_$][\\w$]*\\s*=)"
		},
		{
			name: "storage.type",
			match: "\\bget(?=\\s+[A-Za-z_$][\\w$]*\\s*:)"
		},
		{
			name: "storage.type",
			match: "\\bget(?=\\s+[A-Za-z_$][\\w$]*\\s*\\()"
		}
	]
}, tp = {
	name: "dusky",
	type: "dark",
	colors: {
		"editor.background": "#15161b",
		"editor.foreground": "#d8d9e0",
		"editorCursor.foreground": "#8b84ff",
		"editor.selectionBackground": "#2b2e45",
		"editorLineNumber.foreground": "#5e6273"
	},
	tokenColors: [
		{
			scope: ["comment", "punctuation.definition.comment"],
			settings: {
				foreground: "#6c7080",
				fontStyle: "italic"
			}
		},
		{
			scope: [
				"keyword",
				"storage",
				"storage.type",
				"storage.modifier"
			],
			settings: { foreground: "#9a97b8" }
		},
		{
			scope: [
				"entity.name.type",
				"support.type",
				"entity.name.class"
			],
			settings: { foreground: "#a79fff" }
		},
		{
			scope: [
				"entity.name.function",
				"support.function",
				"meta.function-call"
			],
			settings: { foreground: "#c1b8ff" }
		},
		{
			scope: [
				"variable",
				"variable.parameter",
				"support.variable"
			],
			settings: { foreground: "#d8d9e0" }
		},
		{
			scope: ["string", "string.quoted"],
			settings: { foreground: "#e6c77a" }
		},
		{
			scope: ["entity.name.tag"],
			settings: { foreground: "#e6c77a" }
		},
		{
			scope: ["entity.other.attribute-name"],
			settings: { foreground: "#c1b8ff" }
		},
		{
			scope: ["constant.numeric"],
			settings: { foreground: "#f2a65a" }
		},
		{
			scope: ["constant.language", "constant.character"],
			settings: { foreground: "#f0b86c" }
		},
		{
			scope: ["keyword.operator"],
			settings: { foreground: "#b7afff" }
		},
		{
			scope: [
				"punctuation",
				"meta.brace",
				"meta.delimiter"
			],
			settings: { foreground: "#8d91a1" }
		}
	]
}, np = {
	name: "golden-hour",
	type: "light",
	colors: {
		"editor.background": "#f9f9f9",
		"editor.foreground": "#1e1e1e",
		"editorCursor.foreground": "#6a5cff",
		"editor.selectionBackground": "#e8e8e8",
		"editorLineNumber.foreground": "#afafaf"
	},
	tokenColors: [
		{
			scope: ["comment", "punctuation.definition.comment"],
			settings: {
				foreground: "#afafaf",
				fontStyle: "italic"
			}
		},
		{
			scope: [
				"keyword",
				"storage.type",
				"storage.modifier",
				"keyword.control"
			],
			settings: { foreground: "#bb4c33" }
		},
		{
			scope: [
				"entity.name.function",
				"meta.function-call",
				"variable.function",
				"support.function"
			],
			settings: { foreground: "#ca791a" }
		},
		{
			scope: [
				"entity.name.type",
				"support.type",
				"entity.name.class"
			],
			settings: { foreground: "#a56b5c" }
		},
		{
			scope: [
				"variable",
				"variable.parameter",
				"support.variable"
			],
			settings: { foreground: "#1e1e1e" }
		},
		{
			scope: [
				"string",
				"string.quoted",
				"string.template"
			],
			settings: { foreground: "#5f55d8" }
		},
		{
			scope: ["constant.numeric"],
			settings: { foreground: "#6a5cff" }
		},
		{
			scope: [
				"constant.language",
				"constant.character",
				"support.constant"
			],
			settings: { foreground: "#7b6fe8" }
		},
		{
			scope: ["entity.name.tag", "meta.tag"],
			settings: { foreground: "#ca791a" }
		},
		{
			scope: ["entity.other.attribute-name"],
			settings: { foreground: "#a56b5c" }
		},
		{
			scope: ["keyword.operator"],
			settings: { foreground: "#845e6d" }
		},
		{
			scope: [
				"punctuation",
				"meta.brace",
				"meta.delimiter"
			],
			settings: { foreground: "#4e4e4e" }
		}
	]
}, rp = {
	name: "nsx",
	scopeName: "source.nsx",
	aliases: ["ns"],
	patterns: [{ include: "source.tsx" }],
	repository: {},
	injections: { "L:source.nsx -comment -string": { patterns: (ep.patterns ?? []).map((e) => ({ ...e })) } }
}, ip = {
	light: "golden-hour",
	dark: "dusky"
}, ap = [np, tp], op = [
	"ts",
	"tsx",
	rp
];
[...op];
//#endregion
//#region src/code-utils.ts
var sp = Kf({
	themes: [...ap],
	langs: [...op]
});
async function cp(e, t) {
	return (await sp).codeToHtml(e, {
		lang: t,
		themes: ip,
		defaultColor: !1
	});
}
function lp(e) {
	return e.replace(/&/g, "&#x26;").replace(/</g, "&#x3C;").replace(/>/g, "&#x3E;");
}
function up(e) {
	return `<pre class='shiki'><code>${lp(e)}</code></pre>`;
}
//#endregion
//#region src/Code.tsx
function dp(e) {
	let { main: t, alt: n, highlight: r, trusted: i } = e, a = Pn("main", { toggle() {
		a() === "main" ? a.value = "alt" : a.value = "main";
	} }), o = Pn(up(t.code), { "-fetch": () => r(t.code, t.lang ?? t.name) }), s = 0;
	function c() {
		return /* @__PURE__ */ H("remount-view", { children: () => [_$$AwaitSeries([wo(() => [_$$IfSeries([vo(() => a() === "main", () => /* @__PURE__ */ H("div", { innerHTML: {
			html: o,
			trusted: i
		} })), bo(() => /* @__PURE__ */ H("div", { innerHTML: {
			html: Pn("", { "-fetch": () => r(n.code, n.lang ?? n.name) }),
			trusted: i
		} }))])]), To(() => [/* @__PURE__ */ H("div", { innerHTML: {
			html: o,
			trusted: i
		} })])])] });
	}
	return qn([/* @__PURE__ */ H("div", {
		class: "code-container",
		children: () => [/* @__PURE__ */ H("nav", { children: () => [/* @__PURE__ */ H("button", {
			class: "toggle",
			"on:click": () => a.toggle(),
			children: () => [
				/* @__PURE__ */ H("span", {
					class: "option selected",
					style: { transform: () => a() === "alt" ? `translateX(${s}px)` : void 0 },
					children: () => [() => a() === "main" ? t.name : n.name]
				}),
				/* @__PURE__ */ H("span", {
					"at:mount": (e) => s = e.offsetWidth,
					class: "option",
					children: () => [t.name]
				}),
				/* @__PURE__ */ H("span", {
					class: "option",
					children: () => [n.name]
				})
			]
		})] }), c()]
	})]);
}
//#endregion
//#region src/load-home-tour.tsx
var fp = "get count = ion(initial)\nget qty = ion(0, {\n  increment() { qty++ },\n  decrement() { qty-- }\n})\nget total = ion(() => count * qty)\n\n", pp = "const count = ion(initial)\nconst qty = ion(0, {\n  increment() { qty.value++ },\n  decrement() { qty.value-- }\n})\nconst total = ion(() => count() * qty())\n\n", mp = "<button \n  on:click={() => count++} \n  disabled={(count === limit)@}\n>\n  +\n</button>\n\n", hp = "<button \n  on:click={() => count.value++} \n  disabled={() => count() === limit}\n>\n  +\n</button>\n\n", gp = "<section>\n  {If(inStock,\n    <span class='status'>In stock</span>\n    <button on:click={addToCart}>Buy</button>\n  )}\n  {Else(\n    <span class='status'>Sold out</span>\n  )}\n</section>\n\n\n\n\n", _p = "<section>\n  {If(inStock, () =>\n    <>\n      <span class='status'>In stock</span>\n      <button on:click={addToCart}>Buy</button>\n    </>\n  )}\n  {Else(() =>\n    <>\n      <span class='status'>Sold out</span>\n    </>\n  )}\n</section>", vp = "<article>\n  {For(sections, section => {\n    const highlight = HighlighterKit(section)\n    <:>\n    <section>\n      <h2 class={highlight}>{section.title}</h2>\n      <p>{section.body}</p>\n    </section>\n    <hr/>\n  })}\n</article>\n\n", yp = "<article>\n  {For(sections, section => {\n    const highlight = HighlighterKit(section)\n    return (\n      <>\n        <section>\n          <h2 class={highlight}>{section.title}</h2>\n          <p>{section.body}</p>\n        </section>\n        <hr/>\n      </>\n    )\n  })}\n</article>\n", bp = "function Dialog({ Slot }) {\n  get opened = ion(false)\n  const open = () => { opened = true }\n  const close = () => { opened = false }\n\n  <:: as={{ open, close }}>  \n    {If(opened@, \n      <o--body>\n        <div>{Slot()}</div>\n      </o--body>\n    )}\n  </::>\n}\n\n\n\n", xp = "function Dialog({ Slot }) {\n  const opened = ion(false)\n  const open = () => { opened = true }\n  const close = () => { opened = false }\n\n  return JSXComponent({\n    slot: <>\n      {If(opened, \n        <o--body>\n          <div>{Slot()}</div>\n        </o--body>\n      )}\n    </>,\n    as: { open, close }\n  }) \n}\n";
function Sp() {
	return qn([/* @__PURE__ */ H("section", {
		class: "home-tour",
		children: () => [
			/* @__PURE__ */ H("article", {
				class: "tour-row code-right",
				children: () => [/* @__PURE__ */ H("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ H("h3", { children: () => ["Accessor variables"] }),
						/* @__PURE__ */ H("code", { children: () => ["get variable = getter"] }),
						/* @__PURE__ */ H("p", { children: () => ["—scope-level, locally-bound, type-guard-aware counterpart to native accessor properties"] }),
						/* @__PURE__ */ H("p", {
							class: "tour-note",
							children: () => [
								/* @__PURE__ */ H("strong", { children: () => ["Note:"] }),
								" Reactivity depends on the getter implementation, which NextScript does not define. In this example, the getter implementation comes from Luent's ",
								/* @__PURE__ */ H("code", { children: () => ["ion()"] }),
								". "
							]
						}),
						/* @__PURE__ */ H("a", {
							href: "/guide/getter-syntax",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ H("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ H(dp, {
						trusted: !0,
						main: {
							name: "ns",
							code: fp
						},
						alt: {
							name: "ts equivalent",
							code: pp,
							lang: "ts"
						},
						highlight: cp
					})]
				})]
			}),
			/* @__PURE__ */ H("article", {
				class: "tour-row code-left",
				children: () => [/* @__PURE__ */ H("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ H("h3", { children: () => ["Derivation expressions"] }),
						/* @__PURE__ */ H("code", { children: () => ["(expression)@"] }),
						/* @__PURE__ */ H("p", { children: () => ["—derivation-first shorthand for derivational arrow function expressions"] }),
						/* @__PURE__ */ H("p", {
							class: "tour-note",
							children: () => [/* @__PURE__ */ H("strong", { children: () => ["Note:"] }), " This example assumes a conservative JSX to JavaScript transpilation strategy that maps tag bindings directly to object properties. NextScript itself transpiles only to TypeScript and JSX. It does not define how TypeScript and JSX are ultimately transpiled to JavaScript."]
						}),
						/* @__PURE__ */ H("a", {
							href: "/guide/getter-syntax#derivation-expressions",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ H("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ H(dp, {
						trusted: !0,
						main: {
							name: "nsx",
							code: mp
						},
						alt: {
							name: "tsx equivalent",
							code: hp,
							lang: "tsx"
						},
						highlight: cp
					})]
				})]
			}),
			/* @__PURE__ */ H("article", {
				class: "tour-row code-right",
				children: () => [/* @__PURE__ */ H("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ H("h3", { children: () => ["JSX flow expressions"] }),
						/* @__PURE__ */ H("code", { children: () => ["{Fn(...args, <tag/>)}"] }),
						/* @__PURE__ */ H("p", { children: () => ["—template control flow with implicit JSX fragment factories"] }),
						/* @__PURE__ */ H("a", {
							href: "/guide/jsx-syntax",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ H("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ H(dp, {
						trusted: !0,
						main: {
							name: "nsx",
							code: gp
						},
						alt: {
							name: "tsx equivalent",
							code: _p,
							lang: "tsx"
						},
						highlight: cp
					})]
				})]
			}),
			/* @__PURE__ */ H("article", {
				class: "tour-row code-left",
				children: () => [/* @__PURE__ */ H("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ H("h3", { children: () => ["JSX gateway return"] }),
						/* @__PURE__ */ H("code", { children: () => [
							"() => {",
							" ",
							/* @__PURE__ */ H("i", { children: () => ["statements;"] }),
							" ",
							"<:>",
							" ",
							/* @__PURE__ */ H("i", { children: () => ["jsx"] }),
							" ",
							"}"
						] }),
						/* @__PURE__ */ H("p", { children: () => ["—shorthand JSX fragment return statements"] }),
						/* @__PURE__ */ H("a", {
							href: "/guide/jsx-syntax#jsx-gateway",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ H("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ H(dp, {
						trusted: !0,
						main: {
							name: "nsx",
							code: vp
						},
						alt: {
							name: "tsx equivalent",
							code: yp,
							lang: "tsx"
						},
						highlight: cp
					})]
				})]
			}),
			/* @__PURE__ */ H("article", {
				class: "tour-row code-right",
				children: () => [/* @__PURE__ */ H("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ H("h3", { children: () => ["JSX component"] }),
						/* @__PURE__ */ H("code", { children: () => [
							"<::",
							" as=",
							/* @__PURE__ */ H("i", { children: () => ["component"] }),
							">",
							/* @__PURE__ */ H("i", { children: () => ["jsx"] }),
							"</::>"
						] }),
						"| ",
						/* @__PURE__ */ H("code", { children: () => [
							"<::>",
							/* @__PURE__ */ H("i", { children: () => ["jsx"] }),
							"</::>"
						] }),
						/* @__PURE__ */ H("p", { children: () => ["—auto-returned component with component instance type information"] }),
						/* @__PURE__ */ H("a", {
							href: "",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ H("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ H(dp, {
						trusted: !0,
						main: {
							name: "nsx",
							code: bp
						},
						alt: {
							name: "tsx equivalent",
							code: xp,
							lang: "tsx"
						},
						highlight: cp
					})]
				})]
			})
		]
	})]);
}
function Cp() {
	return Lo(() => /* @__PURE__ */ H(Sp, {}));
}
//#endregion
//#region src/luent-islands.ts
var wp = {
	HelloWorld: Bo,
	HomeTour: Cp
};
//#endregion
export { wp as islands, t };
