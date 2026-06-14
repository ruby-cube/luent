import { createHighlighter } from "shiki";
//#region ../../packages/flask/context/AsyncContext.ts
var AsyncContextStack = class {
	stacks = {};
	stackKeys = [];
	current = {
		value: {},
		prev: void 0
	};
	push(context) {
		this.current = {
			value: context,
			prev: this.current
		};
	}
	pop() {
		if (this.current) this.current = this.current.prev;
	}
};
function $_snap_context() {
	const snapshot = {};
	const keys = asyncContextStack.stackKeys;
	const currentContext = asyncContextStack.current;
	if (!currentContext) return snapshot;
	for (const key of keys) {
		const stackNode = currentContext.value[key];
		if (!stackNode) continue;
		snapshot[key] = {
			prev: stackNode.prev,
			value: stackNode.value
		};
	}
	return snapshot;
}
var asyncContextStack = new AsyncContextStack();
function getCurrentContext() {
	const contextNode = asyncContextStack.current;
	if (!contextNode) return;
	return contextNode.value;
}
function AsyncState(name) {
	asyncContextStack.stackKeys.push(name);
	function push(value, context = getCurrentContext()) {
		if (!context) return;
		context[name] = {
			value,
			prev: context[name]
		};
	}
	function pop(context = getCurrentContext()) {
		if (!context) return;
		const current = context[name];
		if (current) {
			const value = current.value;
			context[name] = current.prev;
			return value;
		}
	}
	const stack = {
		push,
		pop
	};
	asyncContextStack.stacks[name] = stack;
	return [function getCurrentState(context = getCurrentContext()) {
		if (!context) return;
		return context[name]?.value;
	}, stack];
}
function $_run_with_(context, fn, obj) {
	const stacks = obj ? [] : void 0;
	try {
		asyncContextStack.push(context);
		if (stacks && obj) for (const key in obj) {
			const stack = asyncContextStack.stacks[key];
			if (!stack) continue;
			stack.push(obj[key], context);
			stacks.push(stack);
		}
		return fn();
	} finally {
		if (stacks) for (const stack of stacks) stack.pop(context);
		asyncContextStack.pop();
	}
}
//#endregion
//#region ../../packages/luent/src/context/context-stack.ts
function pushContext(context) {
	if (!context) throw new Error(`Provider is undefined`);
	contextStack.push(context);
}
function popContext() {
	contextStack.pop();
}
var [getClosestContext, contextStack] = AsyncState("context");
Array.isArray;
//#endregion
//#region ../../packages/utils/uid.ts
function UIDGenerator(len) {
	let IDX = 36, HEX = "";
	while (IDX--) HEX += IDX.toString(36);
	return function uid() {
		let str = "", num = len || 11;
		while (num--) str += HEX[Math.random() * 36 | 0];
		return str;
	};
}
//#endregion
//#region ../../packages/utils/utils.ts
var noop = () => {};
function normalizeToArray$1(value) {
	if (value === void 0) return [];
	return Array.isArray(value) ? value : [value];
}
//#endregion
//#region ../../packages/utils/SetMap.ts
var SetMap = class extends Map {
	constructor() {
		super();
	}
	initializeSet(key) {
		const set = /* @__PURE__ */ new Set();
		this.set(key, set);
		return set;
	}
	addToSet(value, key) {
		let set = this.get(key);
		if (!set) set = this.initializeSet(key);
		set.add(value);
	}
	deleteFromSet(value, key) {
		this.get(key)?.delete(value);
	}
};
//#endregion
//#region ../../packages/utils/typecheck.ts
function isFunction(value) {
	return typeof value === "function";
}
function isObject(value) {
	return typeof value === "object" && value !== null;
}
function isString(value) {
	return typeof value === "string";
}
//#endregion
//#region ../../packages/utils/debug.ts
var prefix = "@%";
var debug = {
	action(action, ...details) {
		log(prefix);
		log(prefix, `ACTION---------------------`);
		log(prefix, `${action}`);
		log(prefix, `${action}`);
		for (const info of details) log(prefix, ...info);
	},
	log,
	warn,
	error,
	trace,
	throw: throwError
};
var logs = [];
function log(...details) {
	logs.push({
		type: "log",
		details
	});
}
function trace(...details) {
	logs.push({
		type: "trace",
		details
	});
}
function error(...details) {
	logs.push({
		type: "error",
		details
	});
}
function throwError(...details) {
	logs.push({
		type: "error",
		details
	});
}
function warn(...details) {
	logs.push({
		type: "warn",
		details
	});
}
function toError(value) {
	if (value instanceof Error) return value;
	if (typeof value === "string") return new Error(value);
	return new Error(String(value));
}
//#endregion
//#region ../../packages/utils/Stack.ts
function createStack() {
	let stack = void 0;
	function push(value) {
		stack = {
			value,
			prev: stack
		};
		return value;
	}
	function pop() {
		if (stack) stack = stack.prev;
	}
	function getCurrent() {
		return stack?.value;
	}
	return [
		push,
		pop,
		getCurrent
	];
}
//#endregion
//#region ../../packages/luent/src/context/ContextKey.ts
function isMuKey(key) {
	return isFunction(key) && key.name.startsWith("MU_");
}
function toContextKey(key) {
	if (typeof key === "string") return key;
	if ("contextKey" in key) return key.contextKey;
	return key.name === "context-key" ? key : key.name;
}
function ContextKey(key = "context-key") {
	const fnKey = function(v) {
		return {
			0: fnKey,
			1: v
		};
	};
	Object.defineProperty(fnKey, "name", { value: key });
	return fnKey;
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonicDef.ts
var ionicDefMap = /* @__PURE__ */ new Map();
function getIonicDef(constructor) {
	return ionicDefMap.get(constructor);
}
/** Library API */
function defineIonicCollection(constructor, config, def) {
	defineIonicStructure(constructor, config, def);
}
/** Library API */
function defineIonicCollective(constructor, config, def) {
	defineIonicStructure(constructor, config, def);
}
function defineIonicStructure(constructor, config, def) {
	if (ionicDefMap.get(constructor)) debug.warn(`Ionic ops for ${constructor.name} already defined`);
	ionicDefMap.set(constructor, {
		config,
		def
	});
}
//#endregion
//#region ../../packages/quarky/src/abstract/Quark.ts
var QUARK = Symbol("quark");
function hasQuark(value) {
	return (isObject(value) || isFunction(value)) && QUARK in value;
}
function quarkOf(obj) {
	return obj[QUARK];
}
//#endregion
//#region ../../packages/quarky/src/reactivity/RenderCycle.ts
var queueTask = (task) => scheduler.postTask(task);
var { LAYOUT, PRELUDE, RENDER, SYNC, TICK } = /* @__PURE__ */ function(Phase) {
	Phase["SYNC"] = "s";
	Phase["PRELUDE"] = "p";
	Phase["RENDER"] = "r";
	Phase["LAYOUT"] = "l";
	Phase["TICK"] = "t";
	return Phase;
}({});
var phaseKeys = [
	SYNC,
	PRELUDE,
	RENDER,
	LAYOUT,
	TICK
];
function createPhaseMap() {
	const map = Object.create(null);
	for (const phase of phaseKeys) map[phase] = void 0;
	return map;
}
var RenderCycle = class {
	update;
	currentPhase = SYNC;
	phases = createPhaseMap();
	getPhase(phase) {
		return this.phases[phase] ?? (this.phases[phase] = this.createPhase(phase));
	}
	createPhase(phase) {
		return new phaseClasses[phase](phase);
	}
	constructor(update) {
		this.update = update;
	}
	get more() {
		return this.phases[PRELUDE]?.more || this.phases[RENDER]?.more || this.phases[LAYOUT]?.more;
	}
	started = false;
	loop = 0;
	async start() {
		this.started = true;
		while (this.more) {
			this.loop++;
			console.log("@@@ this.loop", this.loop);
			console.log("@@@ prelude---");
			this.currentPhase = PRELUDE;
			const prelude = this.phases[PRELUDE];
			if (prelude) await this.runPhase(prelude);
			if (this.loop === 1) {
				this.update.commit();
				pushUpdate(this.update);
			}
			console.log("@@@ render---");
			this.currentPhase = RENDER;
			const render = this.phases[RENDER];
			if (render) await this.runPhase(render);
			console.log("@@@ layout---");
			this.currentPhase = LAYOUT;
			const layout = this.phases[LAYOUT];
			if (layout) await this.runPhase(layout);
		}
		if (!this.update.committed) this.update.commit();
		console.log("@@@ tick---");
		this.currentPhase = TICK;
		this.runEffects(TICK);
		this.update.complete();
		popUpdate();
	}
	startTime = performance.now();
	timecheck(now) {
		const delta = now - this.startTime;
		const timeMargin = this.update.timeMargin;
		if (timeMargin && delta > timeMargin) {
			if (timeMargin !== 16.7) console.log("Interaction-to-paint time exceeds", timeMargin, "ms:", delta);
		} else if (timeMargin === Infinity) console.log("passed timecheck", timeMargin, delta);
	}
	async runPhase(phase) {
		let effects = phase.effects;
		phase.effects = [];
		let tasks = phase.tasks;
		phase.tasks = [];
		let loop = 0;
		while (effects.length || tasks.length) {
			loop++;
			const ran = /* @__PURE__ */ new Set();
			for (const queue of effects) queue.runEffects(ran, this.update);
			for (const task of tasks) {
				const output = task(this.update);
				if (output instanceof Promise) await output;
			}
			effects = phase.effects;
			tasks = phase.tasks;
			phase.effects = [];
			phase.tasks = [];
		}
	}
	scheduleEffects(effects, phase) {
		this.getPhase(phase).scheduleEffects(effects);
	}
	scheduleTask(task, phase) {
		if (phase === TICK) requestAnimationFrame(() => queueTask(task));
		else this.getPhase(phase).scheduleTask(task);
	}
	runEffects(phaseKey) {
		const phase = this.phases[phaseKey];
		if (!phase) return;
		let effects = phase.effects;
		phase.effects = [];
		while (effects.length) {
			const ran = /* @__PURE__ */ new Set();
			for (const queue of effects) queue.runEffects(ran, this.update);
			effects = phase.effects;
			phase.effects = [];
		}
	}
};
var BasePhase = class {
	phase;
	effects = [];
	get more() {
		return this.effects.length;
	}
	constructor(phase) {
		this.phase = phase;
	}
	scheduleEffects(effects) {
		console.log("@@@ schedule effects", this.effects, "queued?", this.queued(effects));
		if (!this.queued(effects)) this.effects.push(effects);
	}
	queued(effects) {
		return this.effects.indexOf(effects) > -1;
	}
};
var CycledPhase = class extends BasePhase {
	phase;
	tasks = [];
	get more() {
		console.log("this.effects.length", this.effects.length);
		return this.effects.length || this.tasks.length;
	}
	constructor(phase) {
		super(phase);
		this.phase = phase;
	}
	scheduleTask(task) {
		this.tasks.push((update) => {
			try {
				pushUpdate(update);
				return task();
			} finally {
				popUpdate();
			}
		});
	}
};
var phaseClasses = {
	[SYNC]: BasePhase,
	[PRELUDE]: CycledPhase,
	[RENDER]: CycledPhase,
	[LAYOUT]: CycledPhase,
	[TICK]: BasePhase
};
/**
* TEMPORARY
* @returns 
*/
function $currentCycle() {
	const update = getActiveUpdate();
	if (!update) throw new Error("Must wrap in update");
	return update.cycle;
}
function getDefaultPhase() {
	return TICK;
}
function atRender(task) {
	$activeUpdate()?.cycle.scheduleTask(task, RENDER);
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Update.ts
var UpdateType = {
	USER_ANIMATION: 0,
	USER_INTERACTION: 1,
	BACKGROUND_ANIMATION: 2,
	SERVER_RESPONSE: 3,
	INSTANT: 4,
	IDLE: 5
};
var [_pushUpdate, _popUpdate, getActiveUpdate] = createStack();
function pushUpdate(update) {
	_pushUpdate(update);
}
function popUpdate() {
	_popUpdate();
}
var activeUpdate;
function $activeUpdate() {
	const update = getActiveUpdate();
	if (!update) {
		if (activeUpdate) return activeUpdate;
		const update = activeUpdate = new Update(UpdateType.INSTANT, 100, false);
		pushUpdate(update);
		queueMicrotask(() => {
			activeUpdate = null;
			popUpdate();
			update.start();
		});
		return activeUpdate;
	}
	return update;
}
var Update = class {
	type;
	timeMargin;
	idle;
	timestamp = performance.now();
	constructor(type = UpdateType.USER_INTERACTION, timeMargin = 100, idle = true) {
		this.type = type;
		this.timeMargin = timeMargin;
		this.idle = idle;
	}
	tasks = [];
	output;
	queue(task) {
		if (this.started) try {
			pushUpdate(this);
			this.output = task();
		} finally {
			popUpdate();
		}
		else this.tasks.push(task);
		return this;
	}
	_cycle;
	get cycle() {
		return this._cycle ?? (this._cycle = new RenderCycle(this));
	}
	started = false;
	start() {
		if (this.started) return this;
		this.started = true;
		try {
			pushUpdate(this);
			for (const task of this.tasks) this.output = task();
		} finally {
			popUpdate();
			this.cycle.start();
		}
		return this;
	}
	committed = false;
	commit() {
		this.committed = true;
		this.cast("commit");
	}
	cast(hook) {
		const tasks = this.hooks[hook];
		for (const task of tasks) task();
	}
	hooks = {
		commit: [],
		complete: []
	};
	atCommit(task) {
		this.hooks.commit.push(task);
	}
	completed = false;
	complete() {
		this.completed = true;
		this.cast("complete");
	}
	atComplete(task) {
		this.hooks.complete.push(task);
	}
	get closed() {
		return this.started;
	}
	race(rival, ...info) {
		if (rival === null || rival === this) return true;
		return false;
	}
};
function swiftUpdate(task) {
	instantUpdate(task);
}
function instantUpdate(task) {
	return createInstantUpdate().queue(task).start()?.output;
}
function createInstantUpdate() {
	return new Update(UpdateType.USER_ANIMATION, 16.7, false);
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Atom.ts
/**
* @param quark 
* @param op 
* @param args 
* @param output 
* @param preopData 
*/
function trigger(atom) {
	if (!atom) return;
	atom.asTrackedAtom?.triggerEffects();
}
function isTrackableAtom(value) {
	return hasQuark(value) && "asTrackedAtom" in value[QUARK];
}
function asTrackedAtom(watchable) {
	return watchable.asTrackedAtom ?? (watchable.asTrackedAtom = new TrackedAtom(watchable));
}
var Effects = class {
	phase;
	runEffect;
	effects = /* @__PURE__ */ new Set();
	constructor(phase, runEffect = (effect, update) => {
		try {
			pushUpdate(update);
			effect.run();
		} finally {
			popUpdate();
		}
	}) {
		this.phase = phase;
		this.runEffect = runEffect;
	}
	runEffects(ran, update) {
		const effects = this.effects;
		for (const effect of effects) {
			if (!effect.run) continue;
			if (ran.has(effect)) {
				this.effects.add(effect);
				continue;
			}
			ran.add(effect);
			this.runEffect(effect, update);
			if (effect.fn) this.effects.add(effect);
		}
	}
	add(effect) {
		this.effects.add(effect);
	}
};
var TrackedAtom = class {
	entity;
	constructor(entity) {
		this.entity = entity;
	}
	phases = phaseKeys;
	effects = createPhaseMap();
	getEffects(phase) {
		return this.effects[phase] ?? (this.effects[phase] = this.createPhaseEffects(phase));
	}
	createPhaseEffects(phase) {
		if (phase === TICK) return new Effects(TICK, (effect, update) => {
			requestAnimationFrame(() => {
				queueTask(() => {
					if (!effect.run) return;
					new Update(update.type, update.timeMargin, update.type === UpdateType.USER_INTERACTION ? false : update.idle).queue(effect.run).start();
				});
			});
		});
		return new Effects(phase);
	}
	/**
	* To be called by watch() when initializing watcher
	* @param effect 
	*/
	link(effect) {
		this.getEffects(effect.phase).add(effect);
		console.log("link effect", effect, effect.phase, this.effects);
	}
	triggerEffects() {
		const phases = this.phases;
		const cycle = $activeUpdate().cycle;
		for (let i = 1; i < phases.length; i++) {
			const phase = phases[i];
			const effects = this.effects[phase];
			console.log("@@@trigger effects", this.entity, phase, effects);
			if (!effects) continue;
			cycle.scheduleEffects(effects, phase);
		}
		const syncEffects = this.effects[SYNC];
		if (syncEffects) {
			cycle.scheduleEffects(syncEffects, SYNC);
			cycle.runEffects(SYNC);
		}
	}
};
//#endregion
//#region ../../packages/quarky/src/reactivity/Compound.ts
var [pushTracker, popTracker, getActiveTracker] = createStack();
function track(particle) {
	getActiveTracker()?.track(particle);
}
/**
* INTERNAL
*/
var Compound = class {
	_particles = /* @__PURE__ */ new Set();
	particles = [];
	track(particle) {
		if (this._particles.has(particle)) return particle;
		this._particles.add(particle);
		this.particles.push(particle);
		return particle;
	}
	untrackAtoms() {
		this.particles.length = 0;
		this._particles.clear();
	}
	forEachAtom(fn) {
		let particles = [this.particles];
		for (let i = 0; i < particles.length; i++) {
			const atoms = particles[i];
			for (const atom of atoms) if ("forEachAtom" in atom) particles.push(atom.particles);
			else fn(atom);
		}
	}
};
//#endregion
//#region ../../packages/quarky/src/reactivity/State.ts
function getState$1(state) {
	if (state.pendingUpdate && state.pendingUpdate === getActiveUpdate()) return state.pending;
	return state.current;
}
function lockState(state) {
	const update = $activeUpdate();
	if (!update) {
		console.error("nothing to lock to");
		return;
	}
	if (!update.race(state.pendingUpdate)) console.warn("*&^ RACE updates aren't the same", update, state.pendingUpdate, state.get());
	if (state.pendingUpdate === null) {
		state.pendingUpdate = update;
		update.atComplete(() => {
			state.pendingUpdate = null;
		});
	}
	if (update.committed) {
		console.warn("ALREADY COMMITTED", state.pending instanceof Array ? [...state.pending] : state.pending);
		update.atComplete(() => {
			state.commitUpdate();
		});
	} else queueCommit(update, state);
}
function queueCommit(update, state) {
	update.atCommit(() => {
		state.commitUpdate();
	});
}
var SimpleState = class {
	current;
	pending;
	constructor(current) {
		this.current = current;
		this.pending = current;
	}
	get() {
		return getState$1(this);
	}
	lock() {
		return lockState(this);
	}
	_pendingUpdate = null;
	get pendingUpdate() {
		return this._pendingUpdate;
	}
	set pendingUpdate(value) {
		this._pendingUpdate = value;
	}
	cancelUpdate() {
		this.pending = this.current;
	}
	commitUpdate() {
		return this.current = this.pending;
	}
	set(value) {
		this.lock();
		this.pending = value;
		return value;
	}
};
var CollectiveState = class {
	clone;
	current;
	pending;
	constructor(current, clone = (model) => model) {
		this.clone = clone;
		this.current = current;
		this.pending = clone(current);
	}
	get() {
		return getState$1(this);
	}
	lock() {
		return lockState(this);
	}
	pendingUpdate = null;
	cancelUpdate() {
		if (this.mutations.length) {
			this.pending = this.clone(this.current);
			this.mutations = [];
		}
	}
	commitUpdate() {
		if (this.mutations.length) this.applyMutations();
	}
	mutations = [];
	mutate(fn) {
		this.lock();
		this.mutations.push(fn);
		return fn(this.pending);
	}
	mutateSync(fn) {
		this.mutations.push(fn);
		return fn(this.pending);
	}
	applyMutations() {
		console.log("apply mutations", this.mutations);
		for (const mutate of this.mutations) mutate(this.current);
		this.mutations = [];
	}
};
//#endregion
//#region ../../packages/flask/debug.ts
var TRACE = "trace";
var [getAsyncPath, __DEV__traceStack] = [];
function __DEV__buildAsyncPath() {
	const currentTrace = getAsyncPath?.();
	return currentTrace ? "    at async " + currentTrace?.slice(3) : "";
}
//#endregion
//#region ../../packages/quarky/src/debug/Traceable.ts
var Traceable = class {
	name;
	origin;
	constructor(name = "", origin = getOriginTrace()) {
		this.name = name;
		this.origin = origin;
	}
};
function getOriginTrace() {
	return "";
}
//#endregion
//#region ../../packages/flask/Flask.ts
var FLASK = "flask";
var [getActiveFlask, flaskStack] = AsyncState(FLASK);
function getFlask$1() {
	const flask = getActiveFlask();
	if (!flask) throw new Error("No flask found. Must call within the scope of a flask");
	return flask;
}
var ThisFlask = class {
	flask;
	constructor(flask) {
		this.flask = flask;
		flask.thisFlask = this;
	}
	atRemount(task) {
		return this.flask.onRemount(task);
	}
	atMount(task) {
		this.flask.onInitialMount(() => task(true));
		this.flask.onRemount(() => task(false));
	}
	beforeUnmount(task) {
		this.flask.onDemount(() => task(false));
		this.flask.onDiscard(() => task(true));
	}
	beforeDemount(task) {
		return this.flask.onDemount(task);
	}
};
var genUID$1 = UIDGenerator(11);
var Flask = class Flask {
	thisFlask;
	outer;
	type;
	creationScopeID;
	initialLoad = true;
	constructor(config = {}) {
		const { outer, type, creationScope } = config;
		this.outer = outer;
		this.type = type;
		this.creationScopeID = creationScope ? genUID$1() : outer?.creationScopeID ?? "0";
		if (outer) {
			const remountListener = outer.onRemount(() => this.emitRemount());
			const unmountListener = outer.onDemount(() => this.emitDemount());
			const discardListener = outer.onDiscard(() => this.emitDiscard());
			this.onDiscard(() => {
				remountListener.stop();
				unmountListener.stop();
				discardListener.stop();
			});
		}
	}
	spawn(config) {
		return new Flask({
			outer: this,
			type: config.type,
			creationScope: config.creationScope
		});
	}
	tasks = new SetMap();
	emit(hookName) {
		const taskQueue = this.tasks.get(hookName);
		if (!taskQueue) return;
		for (const task of taskQueue) task();
	}
	on(hookName, task) {
		const tasks = this.tasks;
		tasks.addToSet(task, hookName);
		return { stop() {
			tasks.deleteFromSet(task, hookName);
		} };
	}
	emitInitialMount() {
		if (!this.tasks.get("i")) return;
		this.emit("i");
		this.tasks.delete("i");
	}
	onInitialMount(task) {
		return this.on("i", task);
	}
	emitDemount() {
		this.emit("dm");
	}
	onDemount(task) {
		return this.on("dm", task);
	}
	emitRemount() {
		this.emit("rm");
	}
	onRemount(task) {
		return this.on("rm", task);
	}
	onDiscard(task) {
		return this.on("d", task);
	}
	discarded = false;
	emitDiscard() {
		this.emit("d");
		this.discarded = true;
		this.tasks.delete("i");
		this.tasks.delete("rm");
		this.tasks.delete("dm");
		this.tasks.delete("d");
	}
	containCall(fn) {
		try {
			flaskStack.push(this);
			return fn();
		} finally {
			flaskStack.pop();
		}
	}
};
//#endregion
//#region ../../packages/flask/Listener.ts
function makeScheduler(config) {
	const { enroll, remove, callback, options } = config;
	if (!callback) return { stop() {
		return false;
	} };
	const listener = { stop };
	let eager = Boolean(options?.eager);
	const effect = { run: (...args) => {
		if (!effect.run) return;
		const returnVal = runCallback(args);
		if (!eager) stop();
		eager = false;
		return returnVal;
	} };
	const flask = getFlask(options?.within);
	const enclosingFlask = flask === null ? void 0 : flask || getActiveFlask();
	const context = $_snap_context();
	function runCallback(args) {
		$_run_with_(context, () => callback(...args), {
			[FLASK]: enclosingFlask,
			[TRACE]: config.__DEV__asyncPath ?? ""
		});
	}
	const until = options?.until;
	const returnVal = enroll(effect.run);
	const unbind = bindToFlask(listener, until, enclosingFlask);
	function stop() {
		return stopListener(listener, effect, () => remove(returnVal ?? effect.run), unbind);
	}
	stop.isRemover = true;
	setUpCleanup(until, stop, listener, flask, enclosingFlask);
	return listener;
}
function bindToFlask(listener, until, enclosingFlask) {
	return until === null || !enclosingFlask ? void 0 : enclosingFlask.onDiscard(listener.stop).stop;
}
function getFlask(within) {
	return within instanceof ThisFlask ? within.flask : within;
}
function makeListener(config) {
	const { enroll, remove, callback, options } = config;
	if (!callback) return { stop() {
		return false;
	} };
	const listener = { stop };
	const effect = { run: (...args) => {
		if (!effect.run) return;
		return runCallback(args);
	} };
	const flask = getFlask(options?.within);
	const enclosingFlask = flask === null ? void 0 : flask || getActiveFlask();
	const context = $_snap_context();
	let scene;
	function runCallback(args) {
		if (scene) scene.emitDiscard();
		scene = enclosingFlask?.spawn({
			type: "scene",
			creationScope: true
		}) || new Flask({
			type: "scene",
			creationScope: true
		});
		$_run_with_(context, () => callback(...args), {
			[FLASK]: scene,
			[TRACE]: config.__DEV__asyncPath ?? ""
		});
	}
	const until = options?.until;
	const returnVal = enroll(effect.run);
	const unbind = bindToFlask(listener, until, enclosingFlask);
	function stop() {
		return stopListener(listener, effect, () => remove(returnVal ?? effect.run), unbind);
	}
	stop.isRemover = true;
	setUpCleanup(until, stop, listener, flask, enclosingFlask);
	return listener;
}
function noOp() {
	return false;
}
function makePausableListener(config) {
	const { enroll, remove, callback, options } = config;
	if (!callback) return {
		stop: noOp,
		pause: noOp,
		resume: noOp
	};
	let paused = false;
	let dirty = false;
	const activeListener = {
		stop,
		pause() {
			if (!effect.run || paused) return false;
			paused = true;
			dirty = false;
			return true;
		},
		resume() {
			if (!effect.run || !paused) return false;
			paused = false;
			if (dirty) effect.run();
			return true;
		}
	};
	const pausableTask = (args) => {
		if (paused) {
			dirty = true;
			return;
		}
		dirty = false;
		return callback(...args);
	};
	const effect = { run: (...args) => {
		if (!effect.run) return;
		return runCallback(args);
	} };
	const flask = getFlask(options?.within);
	const enclosingFlask = flask === null ? void 0 : flask || getActiveFlask();
	const context = $_snap_context();
	let scene;
	function runCallback(args) {
		if (scene) scene.emitDiscard();
		scene = enclosingFlask?.spawn({
			type: "scene",
			creationScope: true
		}) || new Flask({
			type: "scene",
			creationScope: true
		});
		$_run_with_(context, () => pausableTask(args), {
			[FLASK]: scene,
			[TRACE]: config.__DEV__asyncPath ?? ""
		});
	}
	const returnVal = enroll(effect.run);
	const until = options?.until;
	const unbind = enclosingFlask ? bindListenerToFlask(activeListener, enclosingFlask, until) : void 0;
	function stop() {
		return stopListener(activeListener, effect, () => remove(returnVal ?? effect.run), unbind);
	}
	stop.isRemover = true;
	setUpCleanup(until, stop, activeListener, flask, enclosingFlask);
	return activeListener;
}
function setUpCleanup(until, stop, listener, flask, enclosingFlask) {
	_setUpCleanup(until, stop);
}
function _setUpCleanup(until, stop) {
	if (until === null) return true;
	if (!until) return false;
	if (until instanceof AbortSignal) {
		until.onabort = stop;
		return true;
	}
	if (Array.isArray(until)) until = useCleanupScheduler(...until);
	if (until) {
		until(stop);
		return true;
	}
}
var noopable = { stop: noOp };
function bindListenerToFlask(listener, flask, until) {
	const { stop: cancelStop } = until === null ? noopable : flask.onDiscard(listener.stop);
	const { stop: stopPausing } = flask.onDemount(listener.pause);
	const { stop: stopResuming } = flask.onRemount(listener.resume);
	return function unbind() {
		cancelStop();
		stopPausing();
		stopResuming();
	};
}
function stopListener(listener, effect, remove, unbind) {
	if (!effect.run) return false;
	remove();
	unbind?.();
	effect.run = null;
	return true;
}
//#endregion
//#region ../../packages/flask/flaskableListeners.ts
var _useCleanupScheduler;
function useCleanupScheduler(...args) {
	if (_useCleanupScheduler) return _useCleanupScheduler(...args);
}
function defineCustomCleanupScheduler(scheduler) {
	_useCleanupScheduler = scheduler;
}
function $listen(callback, options, config) {
	const { enroll, remove, pausable = false } = config;
	const { once } = options;
	return (once ? makeScheduler : pausable ? makePausableListener : makeListener)({
		callback,
		enroll,
		remove,
		options,
		__DEV__asyncPath: __DEV__buildAsyncPath()
	});
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Effect.ts
var Effect = class {
	run;
	phase;
	fn;
	constructor(run, phase) {
		this.run = run;
		this.phase = phase;
		this.fn = run;
	}
	link(atom) {
		this.run = this.fn;
		atom.link(this);
	}
	destroy() {
		this.unlink();
		this.fn = null;
	}
	unlink() {
		this.run = null;
	}
};
//#endregion
//#region ../../packages/quarky/src/ion/Get.ts
function isInertIon(value) {
	if (!hasQuark(value)) return false;
	const quark = quarkOf(value);
	return "inert" in quark && quark.inert === true;
}
//#endregion
//#region ../../packages/quarky/src/ion/utils.ts
/**
* Checks if value was created by ion(). Plain getters will return false.
* @param value 
* @returns boolean
*/
function isIon(value) {
	return isFunction(value) && QUARK in value;
}
function toValue(maybeFn) {
	return isFunction(maybeFn) && maybeFn.length === 0 ? maybeFn() : maybeFn;
}
function isGetter(value) {
	if (value instanceof Function && value.length === 0 !== isIon(value)) console.warn(value, "isGetter", !isIon(value), "isIon", isIon(value));
	return value instanceof Function && value.length === 0;
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Subject.ts
function isSubject(value) {
	if ("reactive" in value) return value.reactive;
	return false;
}
var MULTISUBJECT = "--multisubject";
function asSubject(target, retrack) {
	return isMultisubject(target) ? new Multisubject(target, retrack) : asMonosubject(target, retrack);
}
function asMonosubject(subject, retrack) {
	return isIonicProxy(subject) ? new ProxySubject(subject) : isFunction(subject) ? new IonSubject(subject, retrack) : {
		reactive: false,
		getState() {
			return subject;
		},
		linkEffect(effect) {}
	};
}
function isMultisubject(subject) {
	return isObject(subject) && MULTISUBJECT in subject;
}
var Multisubject = class {
	asTraceable;
	subjects = [];
	reactive = true;
	constructor(multisubject, retrack) {
		const subjects = this.subjects;
		for (const subject of multisubject) {
			const monosubject = asMonosubject(subject, retrack);
			subjects.push(monosubject);
		}
	}
	inertCount = 0;
	get = () => {
		this.get = () => {
			const values = [];
			for (const subject of this.subjects) values.push(subject.getState());
			return values;
		};
		const values = [];
		for (const subject of this.subjects) {
			values.push(subject.getState());
			if (!subject.reactive) this.inertCount++;
		}
		if (this.inertCount === this.subjects.length) this.reactive = false;
		return values;
	};
	getState() {
		return this.get();
	}
	linkEffect(effect) {
		const subjects = this.subjects;
		for (const subject of subjects) {
			if (!subject.reactive) continue;
			subject.linkEffect(effect);
		}
	}
};
/**
* Watching ionized models will NOT track absorbed ions and derivations. 
* To watch absorbed ions and derivations, use multisubject
*/
var ProxySubject = class extends Compound {
	proxy;
	reactive = true;
	asTraceable;
	constructor(proxy) {
		super();
		this.proxy = proxy;
		this.track(quarkOf(proxy));
		this.trackAbsorbedIons();
	}
	getState() {
		return quarkOf(this.proxy).state.get();
	}
	linkEffect(effect) {
		this.forEachAtom((atom) => {
			linkEffectToAtom(atom, effect);
		});
	}
	trackAbsorbedIons() {
		const proxy = this.proxy;
		const target = quarkOf(proxy).target;
		const keys = Reflect.ownKeys(target);
		for (const key of keys) {
			const value = target[key];
			if (isIon(value)) {
				if (isTrackableAtom(value)) this.track(quarkOf(value));
			} else proxy[key];
		}
	}
};
/**
* Primitive subject for derivation ions and ionic tasks.
*/
var FunctionSubject = class extends Compound {
	fn;
	retrack;
	warnNoAtoms;
	reactive = true;
	asTraceable;
	constructor(fn, retrack, warnNoAtoms = true) {
		super();
		this.fn = fn;
		this.retrack = retrack;
		this.warnNoAtoms = warnNoAtoms;
	}
	call = () => {
		this.call = () => toValue(this.retrackedCall());
		return toValue(this.trackAtoms(this.fn));
	};
	trackedCall() {
		const value = this.call();
		if (this.particles.length === 0) this.reactive = false;
		return value;
	}
	effect;
	retrackedCall() {
		if (!this.retrack || !this.reactive) return this.fn();
		const effect = this.effect;
		if (!effect) throw new Error("Must call linkEffect before retracking");
		console.log("@&@ retrack call", this.fn);
		effect.unlink();
		this.untrackAtoms();
		const output = this.trackAtoms(this.fn);
		this.forEachAtom((atom) => {
			if ("key" in atom && "modelQuark" in atom && atom.key === "completed") console.log("@&@ link effect", atom);
			linkEffectToAtom(atom, effect);
		});
		return output;
	}
	linkEffect(effect) {
		this.effect = effect;
		this.forEachAtom((atom) => {
			linkEffectToAtom(atom, effect);
		});
	}
	trackAtoms(fn) {
		pushTracker(this);
		try {
			return fn();
		} finally {
			popTracker();
		}
	}
};
/**
* A subject composed of FunctionSubject and (maybe) ProxySubject. Wraps watched ions.
*/
var IonSubject = class {
	retrack;
	get reactive() {
		if (this.proxySubject) return this.subject.reactive || this.proxySubject.reactive;
		return this.subject.reactive;
	}
	subject;
	proxySubject;
	asTraceable;
	get particles() {
		return this.subject.particles;
	}
	constructor(getter, retrack = true) {
		this.retrack = retrack;
		const quark = hasQuark(getter) ? quarkOf(getter) : {};
		this.subject = quark instanceof FunctionSubject ? quark : new FunctionSubject(getter, retrack, false);
	}
	linkEffect(effect) {
		if (this.reactive) this.subject.linkEffect(effect);
		this.proxySubject?.linkEffect(effect);
	}
	relinkProxy = () => {
		if (!this.retrack) {
			this.relinkProxy = noop;
			return;
		}
		this.relinkProxy = () => {
			const effect = this.subject.effect;
			if (!effect) return;
			this.proxySubject?.linkEffect(effect);
		};
	};
	getState() {
		const value = this.subject.trackedCall();
		if (value !== this.proxySubject?.getState() && isIonicProxy(value)) this.proxySubject = new ProxySubject(value);
		this.relinkProxy();
		return value;
	}
};
function linkEffectToAtom(atom, effect) {
	if (!atom) return;
	effect.link(asTrackedAtom(atom));
}
//#endregion
//#region ../../packages/quarky/src/reactivity/Watcher.ts
var StateChangeEvent = class {
	previous;
	current;
	eager;
	constructor(previous, current, eager) {
		this.previous = previous;
		this.current = current;
		this.eager = eager;
	}
};
function watch(subject, effect, options = {}) {
	console.log("*** watching", subject);
	options.retrack = options.retrack ?? true;
	const target = asSubject(subject, options.retrack);
	target.asTraceable = new Traceable(options?.devName ?? "watch" + subject);
	if (!isSubject(target)) {
		console.log("inert A");
		if (options?.eager) scheduleEagerEffect(() => effect(new StateChangeEvent(void 0, subject, true)), getPhase(options));
		return InertWatcher();
	}
	const prevState = new SimpleState(target.getState());
	if (!target.reactive) {
		if (options?.eager) {
			console.log("inert B");
			scheduleEagerEffect(() => effect(new StateChangeEvent(void 0, prevState.get(), true)), getPhase(options));
		}
		return InertWatcher();
	}
	function wrappedEffect() {
		const newState = target.getState();
		try {
			effect(new StateChangeEvent(prevState.get(), newState, !!options.eager));
		} finally {
			options.eager = false;
			prevState.set(newState);
		}
	}
	wrappedEffect.__DEV__fn = effect;
	return setUpWatcher(target, wrappedEffect, options);
}
function getPhase(options) {
	return options?.phase ?? getDefaultPhase();
}
function setUpWatcher(subject, task, options) {
	const phase = options.phase = getPhase(options);
	const eager = options.eager ?? false;
	options.preserve;
	if (options?.["dev.traceTriggers"]) {}
	return $listen(task, options || {}, {
		enroll(_task) {
			const effect = new Effect(_task, phase);
			effect.__DEV__fn = task.__DEV__fn;
			subject.linkEffect(effect);
			if (eager) scheduleEagerEffect(_task, phase);
			return effect;
		},
		remove(effect) {
			effect.destroy();
		},
		pausable: true
	});
}
function scheduleEagerEffect(task, phase) {
	if (!getActiveUpdate()) $activeUpdate();
	const cycle = $currentCycle();
	cycle.scheduleTask(task, phase);
	if (phase === SYNC) cycle.runEffects(SYNC);
}
function InertWatcher() {
	function noOp() {
		return false;
	}
	return {
		stop: noOp,
		pause: noOp,
		resume: noOp
	};
}
/**
* Optimized barebones ion-only watch function. links effect to atoms and flask. No async context used.
* @param ion 
* @param render 
* @param eager 
* @returns 
*/
function watchToRender(ion, render, flask = getActiveFlask(), eager = false) {
	const subject = new IonSubject(() => toValue(ion()));
	let prevState = subject.getState();
	if (!subject.reactive && !eager) return;
	let stale = false;
	let paused = false;
	const effect = new Effect(() => {
		if (paused) {
			stale = true;
			return;
		}
		stale = false;
		_render();
	}, PRELUDE);
	let eagerRun = eager;
	function _render() {
		const newState = subject.getState();
		render({
			current: newState,
			previous: prevState,
			flask,
			eagerRun
		});
		eagerRun = false;
		prevState = newState;
	}
	if (eager) scheduleEagerEffect(_render, PRELUDE);
	subject.linkEffect(effect);
	flask?.onDiscard(() => {
		effect.destroy();
	});
	flask?.onDemount(() => {
		paused = true;
	});
	flask?.onRemount(() => {
		paused = false;
		if (stale) effect.run?.();
	});
}
//#endregion
//#region ../../packages/quarky/src/ion/DerivationIon.ts
var DerivationIonQuark = class extends FunctionSubject {
	constructor(fn, retrack, warnNoAtoms) {
		super(fn, retrack, warnNoAtoms);
	}
	getState() {
		return this.trackedCall();
	}
	get inert() {
		return !this.reactive;
	}
};
var STALE = Symbol("stale");
function createMemoizedDerivation(derive, setup, retrack = true) {
	const previous = new SimpleState(void 0);
	const state = new SimpleState(STALE);
	const quark = new DerivationIonQuark(() => {
		return derive(previous.get());
	}, retrack, void 0);
	let trackCall = () => {
		const value = trackedCall();
		quark.linkEffect(new Effect(() => {
			if (state.get() !== STALE) previous.set(state.get());
			state.set(STALE);
		}, SYNC));
		trackCall = trackedCall;
		return value;
	};
	function trackedCall() {
		return quark.trackedCall();
	}
	function $derivedState() {
		track(quark);
		if (state.get() === STALE) return state.set(trackCall());
		return state.get();
	}
	$derivedState["~ion"] = true;
	$derivedState[QUARK] = quark;
	if (setup) {
		const onSet = setup["@set"];
		const onGet = setup["@get"];
		if (onSet || onGet) Object.defineProperty($derivedState, "value", {
			set: onSet,
			get: onGet
		});
	}
	if (setup) {
		const descriptors = Object.getOwnPropertyDescriptors(setup);
		delete descriptors["@get"];
		delete descriptors["@set"];
		delete descriptors["@init"];
		Object.defineProperties($derivedState, descriptors);
	}
	return $derivedState;
}
//#endregion
//#region ../../packages/quarky/src/ion/AtomicIon.ts
var AtomicIonQuark = class {
	state;
	asTrackedAtom;
	castGet;
	castSet;
	castInit;
	asTraceable;
	constructor(state, hooks) {
		this.state = state;
		this.castGet = hooks?.["@get"];
		this.castSet = hooks?.["@set"];
		this.castInit = hooks?.["@init"];
	}
	getState() {
		return this.state.get();
	}
};
function createAtomicIon(initialState, setup) {
	const quark = new AtomicIonQuark(new SimpleState(initialState), setup);
	const $state = quark.castGet ? withGetHook(getState.bind(quark), quark.castGet) : function() {
		return getState.apply(quark);
	};
	$state[QUARK] = quark;
	if (setup) {
		const descriptors = Object.getOwnPropertyDescriptors(setup);
		delete descriptors["@get"];
		delete descriptors["@set"];
		delete descriptors["@init"];
		Object.defineProperties($state, descriptors);
	}
	Object.defineProperty($state, "value", {
		get: $state,
		set: quark.castSet ? withSetHook(setState.bind(quark), quark.castSet, () => quark.state.get()) : setState.bind(quark)
	});
	return $state;
}
function getState() {
	track(this);
	return this.state.get();
}
function setState(value) {
	this.state.set(value);
	trigger(this);
	return value;
}
function withGetHook(getState, castGet) {
	function $state() {
		const value = getState();
		castGet(value);
		return value;
	}
	$state.value = void 0;
	$state[QUARK] = void 0;
	return $state;
}
function withSetHook(set, castSet, getState) {
	return function setState(value) {
		const previous = getState();
		const output = set(value);
		castSet({
			value,
			previous
		});
		return output;
	};
}
//#endregion
//#region ../../packages/quarky/src/ionic/Pion.ts
/**
* NOTE: We auto-transform only for initial values to 
* prevent unexpected behavior like 
* obj.a = a
* console.log(a === obj.a) // false because a is raw and obj.a is ionic
*/
function createAtomicPion(quark, transform, internal = false) {
	const get = quark.castGet ? withGetHook(getState.bind(quark), quark.castGet) : function() {
		return getState.apply(quark);
	};
	const set = quark.castSet ? withSetHook(setPion.bind(quark), quark.castSet, () => quark.state.get()) : setPion.bind(quark);
	const wrapped = transform ? withTransform(transform, get, set) : [get, set];
	if (internal) return wrapped;
	const [$state, setState] = wrapped;
	$state[QUARK] = quark;
	Object.defineProperty($state, "value", {
		get: $state,
		set: setState
	});
	return [$state, setState];
}
function withTransform(transform, get, set) {
	let initialState = true;
	function $state() {
		const value = get();
		return initialState && isObject(value) ? transform(value) : value;
	}
	$state.value = void 0;
	$state[QUARK] = void 0;
	function setState(value) {
		initialState = false;
		return set(value);
	}
	return [$state, setState];
}
function setPion(value) {
	setState.apply(this, [value]);
	trigger(this.modelQuark);
	return value;
}
var AtomicPionQuark = class extends AtomicIonQuark {
	modelQuark;
	key;
	constructor(initialValue, modelQuark, hooks, key) {
		super(new SimpleState(initialValue), hooks);
		this.modelQuark = modelQuark;
		this.key = key;
	}
};
//#endregion
//#region ../../packages/quarky/src/ionic/TrackedOp.ts
var TrackedOpQuark = class {
	modelQuark;
	op;
	key;
	asTraceable;
	asTrackedAtom;
	constructor(modelQuark, op, key) {
		this.modelQuark = modelQuark;
		this.op = op;
		this.key = key;
	}
	getState() {
		return this.modelQuark.getState()[this.op](this.key);
	}
};
function toString$1(value) {
	if (typeof value === "symbol") return value.description;
	if (typeof value === "object") return JSON.stringify(value);
	return value.toString();
}
var TrackedOps = class {
	modelQuark;
	tracked;
	constructor(modelQuark) {
		this.modelQuark = modelQuark;
		this.tracked = new Map([["[[in]]", /* @__PURE__ */ new Map()]]);
	}
	register(op, key, trackedOp) {
		const traceableModel = this.modelQuark.asTraceable;
		trackedOp.asTraceable = new Traceable(traceableModel.name + " " + toString$1(op) + toString$1(key), traceableModel.origin);
		const ops = this.tracked.get(op) ?? /* @__PURE__ */ new Map();
		if (!(ops instanceof Map)) {
			debug.error(`${String(op)} is not an op`);
			return trackedOp;
		}
		this.tracked.set(op, ops);
		ops.set(key, trackedOp);
		return trackedOp;
	}
	asTracked(op, key) {
		return this.getTracked(op, key) ?? this.register(op, key, new TrackedOpQuark(this.modelQuark, op, key));
	}
	getTracked(op, key) {
		return this.getAllTracked(op)?.get(key);
	}
	getAllTracked(op) {
		const atomicOps = this.tracked.get(op);
		if (!(atomicOps instanceof Map)) return void 0;
		return atomicOps;
	}
};
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedArray.ts
defineIonicCollection(Array, {
	clone: (arr) => [...arr],
	"@initEach"(item, target, transform, index) {
		target[index] = transform(item);
	},
	"@getHookKey"(key) {
		return isIntegerKey(key) ? EACH : key;
	}
}, {
	[Symbol.iterator]() {
		this.trackModel();
		return ionic(this.ionic[Symbol.iterator]());
	},
	at(index) {
		return this.ionic.at(index);
	},
	concat(...args) {
		return ionic(this.ionic.concat(...args));
	},
	filter(predicate, thisArg) {
		return ionic(this.ionic.filter(predicate, thisArg));
	},
	map(callback, thisArg) {
		return ionic(this.ionic.map(callback, thisArg));
	},
	keys() {
		this.track(INTERNAL_OP, "ownKeys");
		return this.raw.keys();
	},
	slice(start, end) {
		return ionic(this.ionic.slice(start, end));
	},
	toSpliced(start, deleteCount, ...args) {
		return ionic(this.ionic.toSpliced(start, deleteCount, ...args));
	},
	toSorted(compare) {
		return ionic(this.ionic.toSorted(compare));
	},
	toReversed() {
		return ionic(this.ionic.toReversed());
	},
	with(index, value) {
		return ionic(this.ionic.with(index, value));
	}
});
function isIntegerKey(key) {
	if (typeof key === "symbol") return false;
	const keyAsNumber = Number(key);
	if (isNaN(keyAsNumber)) return false;
	if (Number.isInteger(keyAsNumber)) return true;
}
//#endregion
//#region ../../packages/quarky/src/ionic/ModelQuark.ts
function nowrite(value) {
	return false;
}
var ModelQuark = class {
	target;
	extension;
	asTraceable;
	asTrackedAtom;
	proto;
	proxy;
	ops;
	constructor(target, extension) {
		this.target = target;
		this.extension = extension;
		this.proto = new Map([
			[QUARK, {
				get: () => this,
				set: nowrite
			}],
			["constructor", {
				get: () => target.constructor,
				set: nowrite
			}],
			["isPrototypeOf", {
				get: this.GetBoundMethod(target.isPrototypeOf, target),
				set: nowrite
			}]
		]);
		this.state = new CollectiveState(target, this.getCloner());
		this.ops = new TrackedOps(this);
		this.initCollection();
	}
	getState() {
		return this.state.get();
	}
	getCloner() {
		let obj = this.target;
		do {
			const cloner = getIonicDef(obj.constructor)?.config.clone;
			if (cloner) return cloner;
			obj = Object.getPrototypeOf(obj);
		} while (obj && obj.constructor !== Object);
		return function clonePlainObject(entity) {
			return Object.assign(Object.create(Object.getPrototypeOf(entity)), entity);
		};
	}
	initCollection() {
		const hooks = this.extension;
		if (hooks && EACH in hooks && hooks[EACH]) {
			const each = hooks[EACH];
			const transform = each["-as"];
			if (each instanceof Function) console.error(`Failed to ionize nested items. Must pass ionizer in config object, e.g. { '-as': ionic } or use as() helper`);
			if (transform) this.initEach(transform);
			if ("@get" in each || "@set" in each) this.overrideGetHooks();
		}
	}
	overrideGetHooks() {
		let obj = this.state.get();
		do {
			const getHookKey = getIonicDef(obj.constructor)?.config["@getHookKey"];
			if (getHookKey) {
				this.getHooks = ((key) => {
					const hooks = this.extension;
					if (!hooks) return void 0;
					return hooks[key] ?? hooks[getHookKey(key)];
				});
				return;
			}
			obj = Object.getPrototypeOf(obj);
		} while (obj && obj.constructor !== Object);
	}
	getHooks = (key) => {
		return this.extension?.[key];
	};
	initEach(transform) {
		let obj = this.state.get();
		do {
			const initEach = getIonicDef(obj.constructor)?.config["@initEach"];
			if (initEach) {
				const collection = this.state.get();
				if (!(Symbol.iterator in collection)) return;
				let i = 0;
				for (const item of collection) {
					const index = i++;
					this.state.mutateSync((target) => {
						initEach(item, target, transform, index);
					});
				}
				this.state.commitUpdate();
				return;
			}
			obj = Object.getPrototypeOf(obj);
		} while (obj && obj.constructor !== Object);
	}
	$isExtensible;
	setIsExtensible;
	initIsExtensible() {
		if (this.$isExtensible) return;
		const target = this.target;
		[this.$isExtensible, this.setIsExtensible] = createAtomicPion(new AtomicPionQuark(Object.isExtensible(target), this, void 0), void 0, true);
	}
	initProperty(key) {
		if (!(key in this.state.get())) {
			const extension = this.extension;
			if (extension && key in extension) return this.initExtension(key, extension[key]);
			else return this.initNonProperty(key);
		}
		return this._initProperty(key);
	}
	initExtension(key, value) {
		return this.initExtensionMethod(key, value);
	}
	initExtensionMethod(key, method) {
		const methodAccess = {
			get: this.GetBoundMethod(method, this.proxy),
			set: nowrite
		};
		this.proto.set(key, methodAccess);
		return methodAccess;
	}
	initNonProperty(key, isNewProperty = false) {
		if (!Object.isExtensible(this.target)) return {
			get: () => void 0,
			set: nowrite
		};
		const valueKey = isIonKey(key) ? key.slice(1) : key;
		const ionKey = valueKey !== key ? key : typeof key === "string" ? "$" + key : void 0;
		if (isNewProperty || ionKey && valueKey in this.state.get()) return this.initPion(key, valueKey, ionKey, key === ionKey ? this.state.get()[valueKey] : void 0);
	}
	setNewProperty(key, value) {
		if (!Object.isExtensible(this.target)) return { set: nowrite };
		if (isFunction(value)) return { set: nowrite };
		const success = this.state.mutate((target) => {
			return Reflect.set(target, key, value);
		});
		if (!success) return { set: nowrite };
		triggerOp(this, INTERNAL_OP, "ownKeys");
		triggerOp(this, "[[in]]", key);
		trigger(this);
		if (success && isIntegerKey(key) && Array.isArray(this.target)) this.proxy.length = this.state.pending.length;
		return !this.proto.has(key) ? this.initNonProperty(key, true) : this.proto.get(key);
	}
	_initProperty(key) {
		let obj = this.state.get();
		do {
			const descriptor = Object.getOwnPropertyDescriptor(obj, key);
			if (descriptor) return this.initializeProperty(key, descriptor, getIonicDef(obj.constructor)?.def?.[key]);
			obj = Object.getPrototypeOf(obj);
		} while (obj && obj.constructor !== Object);
	}
	initializeProperty(key, descriptor, def) {
		const valueKey = isIonKey(key) ? key.slice(1) : key;
		const ionKey = key === valueKey && typeof key === "string" ? "$" + key : void 0;
		if ("value" in descriptor) return this.initValueProperty(key, valueKey, ionKey, descriptor, def);
		else return this.initDerivedProperty(key, valueKey, key === valueKey ? ionKey : void 0, descriptor, def);
	}
	initValueProperty(key, valueKey, ionKey, descriptor, def) {
		const { value, writable } = descriptor;
		if (isFunction(value) && key === ionKey && value.length == 0) return this.initAbsorbedIon(key, valueKey, ionKey, value, def);
		else if (isFunction(value)) return this.initMethod(key, value, isFunction(def) ? def : void 0);
		else if (key === valueKey && writable) return this.initPion(key, valueKey, ionKey, value);
		else return this.initStaticProperty(key, value);
	}
	initPion(key, valueKey, ionKey, value) {
		const { proto, target } = this;
		const hooks = this.getHooks(valueKey);
		const pionAccess = ionKey && !(ionKey in target);
		const [pion, setPion] = createAtomicPion(new AtomicPionQuark(target[valueKey], this, hooks, valueKey), hooks?.["-as"], !pionAccess);
		const state = {
			get: pion,
			set: (value) => {
				setPion(value);
				return true;
			}
		};
		proto.set(valueKey, state);
		const $state = pionAccess ? {
			get: () => pion,
			set: nowrite
		} : void 0;
		if (pionAccess) proto.set(ionKey, $state);
		return key === ionKey ? $state : state;
	}
	initStaticProperty(key, value) {
		const property = {
			get: () => value,
			set: nowrite
		};
		this.proto.set(key, property);
		return property;
	}
	initDerivedProperty(key, valueKey, ionKey, descriptor, def) {
		const { proto, extension, proxy, track, trackModel, trigger, triggerAll, triggerModel, state: raw } = this;
		const descriptor_set = descriptor.set;
		const _getter = descriptor.get ?? (() => void 0);
		const _setter = descriptor_set ? ((value) => {
			descriptor_set(value);
			return true;
		}) : nowrite;
		const get = def?.get ? def.get.bind({
			config: extension,
			get raw() {
				return raw.get();
			},
			get ionic() {
				return { get [key]() {
					return _getter.apply(proxy);
				} };
			},
			track,
			trackModel
		}) : _getter.bind(proxy);
		const set = def?.set ? def.set.bind({
			config: extension,
			get raw() {
				return raw.get();
			},
			get ionic() {
				return { set [key](value) {
					_setter.apply(proxy, [value]);
				} };
			},
			trigger,
			triggerModel,
			triggerAll
		}) : _setter.bind(proxy);
		const hooks = this.getHooks(valueKey) ?? {};
		if (hooks instanceof Function) console.error(`Failed to ionize nested object, ${valueKey.toString()}. Must pass ionizer in config object, e.g. { '-as': ionic } or use as() helper`);
		const transform = hooks["-as"];
		const castGet = hooks["@get"];
		const castSet = hooks["@set"];
		const getWithHook = castGet ? withGetHook(get, castGet) : get;
		const setWithHook = castSet ? withSetHook(set, castSet, () => this.state.get()[valueKey]) : set;
		const [getter, setter] = transform ? withTransform(transform, getWithHook, setWithHook) : [getWithHook, setWithHook];
		const state = {
			get: getter,
			set: setter
		};
		proto.set(valueKey, state);
		const $state = ionKey ? {
			get: PionAccess(getter, setter),
			set: nowrite
		} : void 0;
		if (ionKey) proto.set(ionKey, $state);
		function PionAccess(getter, setter) {
			const pion = () => getter();
			Object.defineProperty(pion, "value", {
				get: getter,
				set: setter
			});
			return () => pion;
		}
		return key === ionKey ? $state : state;
	}
	initMethod(key, fn, def) {
		const castHook = this.getHooks(key)?.["@call"];
		const thisObj = def ? this.CustomThis(key, fn, def) : this.proxy;
		const methodAccess = {
			get: castHook ? this.GetBoundMethodWithHook(key, def ?? fn, thisObj, castHook) : this.GetBoundMethod(def ?? fn, thisObj),
			set: nowrite
		};
		this.proto.set(key, methodAccess);
		return methodAccess;
	}
	CustomThis(key, fn, def) {
		const { state, proxy, track, trackModel, extension } = this;
		return {
			config: extension,
			mutate: (mutationFn, triggerFn) => {
				const { trigger, triggerModel, triggerAll } = this;
				const output = this.state.mutate(mutationFn);
				triggerFn({
					output,
					op: {
						triggerModel,
						triggerAll,
						trigger
					}
				});
				return output;
			},
			get raw() {
				return state.get();
			},
			get ionic() {
				return { [key]: fn.bind(proxy) };
			},
			track,
			trackModel
		};
	}
	GetBoundMethodWithHook(key, method, obj, castHook) {
		const boundMethod = function(...input) {
			const output = method.apply(obj, input);
			castHook({
				input,
				output
			});
			return output;
		};
		return () => boundMethod;
	}
	GetBoundMethod(method, obj) {
		const boundMethod = method.bind(obj);
		return () => boundMethod;
	}
	initAbsorbedIon(key, valueKey, ionKey, ion, def) {
		const { proto, proxy, target, extension: config, track, trackModel, trigger, triggerAll, triggerModel } = this;
		const hooks = this.getHooks(valueKey);
		const setState = "value" in ion ? Object.getOwnPropertyDescriptor(ion, "value")?.set ?? nowrite : nowrite;
		const get = def?.get ? def.get.bind({
			config,
			get raw() {
				return state.get();
			},
			get ionic() {
				const obj = Object.create(null);
				Object.defineProperty(obj, key, { get: ion });
				return obj;
			},
			track,
			trackModel
		}) : ion;
		const set = def?.set ? def.set.bind({
			config,
			get raw() {
				return state.get();
			},
			get ionic() {
				const obj = Object.create(null);
				Object.defineProperty(obj, key, { set: setState });
				return obj;
			},
			trigger,
			triggerModel,
			triggerAll
		}) : setState;
		const state = {
			get: hooks?.["@get"] ? withGetHook(ion, hooks["@get"]) : get,
			set: hooks?.["@set"] ? withSetHook(set, hooks["@set"], ion) : set
		};
		proto.set(valueKey, state);
		const $state = {
			get: !hasQuark(ion) ? this.GetBoundMethod(ion, proxy) : () => target[ionKey],
			set: nowrite
		};
		proto.set(ionKey, $state);
		return key === ionKey ? $state : state;
	}
	state;
	track = (op, key) => {
		trackOp(this, op, key);
	};
	trackModel = () => {
		track(this);
	};
	trigger = (op, key) => {
		triggerOp(this, op, key);
	};
	triggerModel = () => {
		trigger(this);
	};
	triggerAll = (op) => {
		const ops = this.ops.getAllTracked(op);
		if (!ops) return;
		for (const [_, trackedOp] of ops) trigger(trackedOp);
	};
};
function isIonKey(key) {
	return typeof key === "string" && /^\$[a-z]/.test(key);
}
function trackOp(quark, op, key) {
	getActiveTracker()?.track(quark.ops.asTracked(op, key));
}
function triggerOp(quark, op, key) {
	trigger(quark.ops.getTracked(op, key));
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonicModel.ts
function isIonicProxy(value) {
	if (!isObject(value)) return false;
	return hasQuark(value) && quarkOf(value) instanceof ModelQuark;
}
function createIonicModel(target, setup) {
	const modelQuark = new ModelQuark(target, setup);
	const proxy = new Proxy(target, useTraps(modelQuark));
	modelQuark.proxy = proxy;
	return proxy;
}
var INTERNAL_OP$1 = "[[INTERNAL]]";
function useTraps(modelQuark) {
	return {
		get(_, key, receiver) {
			const proto = modelQuark.proto;
			if (!proto.has(key)) return modelQuark.initProperty(key)?.get();
			return proto.get(key)?.get();
		},
		set(_, key, newValue, receiver) {
			const proto = modelQuark.proto;
			if (!proto.has(key) && !(key in modelQuark.state.get())) return Boolean(modelQuark.setNewProperty(key, newValue)?.set(newValue));
			const success = !proto.has(key) ? Boolean(modelQuark.initProperty(key)?.set(newValue)) : proto.get(key).set(newValue);
			if (success) $activeUpdate().atCommit(() => modelQuark.target[key] = modelQuark.state.pending[key] = newValue);
			return success;
		},
		has(_, key) {
			if (key === QUARK) return true;
			if (!modelQuark.proto.has(key)) modelQuark.initProperty(key);
			trackOp(modelQuark, "[[in]]", key);
			return modelQuark.proto.has(key);
		},
		getOwnPropertyDescriptor(_, key) {
			modelQuark.proxy[key];
			return Object.getOwnPropertyDescriptor(modelQuark.state.get(), key);
		},
		defineProperty(_, key, descriptor) {
			if (key in modelQuark.state.get()) return false;
			if (!modelQuark.state.mutate((target) => Reflect.defineProperty(target, key, descriptor))) return false;
			trigger(modelQuark);
			triggerOp(modelQuark, INTERNAL_OP$1, "ownKeys");
			triggerOp(modelQuark, "[[in]]", key);
			modelQuark.proto.get(key)?.set(descriptor.value);
			return true;
		},
		deleteProperty(_, key) {
			if (!modelQuark.state.mutate((target) => Reflect.deleteProperty(target, key))) return false;
			const proto = modelQuark.proto;
			if (proto.has(key)) {
				proto.get(key).set(void 0);
				$activeUpdate().atCommit(() => {
					proto.delete(key);
				});
			}
			trigger(modelQuark);
			triggerOp(modelQuark, INTERNAL_OP$1, "ownKeys");
			triggerOp(modelQuark, "[[in]]", key);
			return true;
		},
		ownKeys(_) {
			trackOp(modelQuark, INTERNAL_OP$1, "ownKeys");
			return Reflect.ownKeys(modelQuark.state.get());
		},
		getPrototypeOf(_) {
			return Reflect.getPrototypeOf(modelQuark.target);
		},
		setPrototypeOf() {
			debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model");
			return false;
		},
		isExtensible(_) {
			modelQuark.initIsExtensible();
			return modelQuark.$isExtensible();
		},
		preventExtensions(_) {
			modelQuark.initIsExtensible();
			return modelQuark.setIsExtensible(false);
		}
	};
}
//#endregion
//#region ../../packages/quarky/src/ionic/Ionic.ts
var INTERNAL_OP = "[[INTERNAL]]";
var EACH = Symbol("each");
var ionicModels = /* @__PURE__ */ new WeakMap();
function ionic(target, setup) {
	if (isIonicProxy(target)) return target;
	if (!isObject(target)) return target;
	const existing = ionicModels.get(target);
	if (existing) return existing;
	const proxy = createIonicModel(target, setup ?? {});
	ionicModels.set(target, proxy);
	return proxy;
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedSet.ts
function installIonicSet() {
	defineIonicCollection(Set, {
		clone: (set) => new Set(set),
		"@initEach"(item, target, transform) {
			target.delete(item);
			target.add(transform(item));
		}
	}, {
		[Symbol.iterator]() {
			this.trackModel();
			return ionic(this.raw[Symbol.iterator]());
		},
		forEach: SetlikeDef.forEach,
		keys: SetlikeDef.keys,
		values: SetlikeDef.values,
		entries: SetlikeDef.entries,
		difference(other) {
			this.trackModel();
			return ionic(this.raw.difference(other));
		},
		union(other) {
			this.trackModel();
			return ionic(this.raw.union(other));
		},
		intersection(other) {
			this.trackModel();
			return ionic(this.raw.intersection(other));
		},
		symmetricDifference(other) {
			this.trackModel();
			return ionic(this.raw.symmetricDifference(other));
		},
		isSubsetOf(other) {
			this.trackModel();
			return this.raw.isSubsetOf(other);
		},
		isSupersetOf(other) {
			this.trackModel();
			return this.raw.isSubsetOf(other);
		},
		isDisjointFrom(other) {
			this.trackModel();
			return this.raw.isDisjointFrom(other);
		},
		add(value) {
			if (this.raw.has(value)) return ionic(this.raw);
			return ionic(this.mutate((raw) => {
				return raw.add(value);
			}, ({ op }) => {
				op.trigger("has", value);
				op.trigger("[[get]]", "size");
				op.triggerModel();
			}));
		},
		has: SetlikeDef.has,
		clear: SetlikeDef.clear,
		delete: SetlikeDef.delete,
		size: SetlikeDef.size
	});
}
var SetlikeDef = {
	forEach(cb) {
		this.trackModel();
		return this.raw.forEach(cb);
	},
	keys() {
		this.trackModel();
		return ionic(this.raw.keys());
	},
	values() {
		this.trackModel();
		return ionic(this.raw.values());
	},
	entries() {
		this.trackModel();
		return ionic(this.raw.entries());
	},
	has(key) {
		this.track("has", key);
		return this.raw.has(key);
	},
	clear() {
		if (this.raw.size === 0) return;
		this.mutate((raw) => raw.clear(), ({ op }) => {
			op.triggerModel();
			op.triggerAll("has");
			op.trigger("[[get]]", "size");
		});
	},
	delete(key) {
		return this.mutate((raw) => raw.delete(key), ({ output: success, op }) => {
			if (success) {
				op.triggerModel();
				op.trigger("has", key);
				op.trigger("[[get]]", "size");
			}
		});
	},
	size: { get() {
		this.track("[[get]]", "size");
		return this.raw.size;
	} }
};
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedMap.ts
function installIonicMap() {
	defineIonicCollection(Map, {
		clone: (map) => new Map(map),
		"@initEach"(entry, target, transform) {
			target.delete(entry.key);
			const [key, value] = transform(entry);
			target.set(key, value);
		}
	}, {
		[Symbol.iterator]() {
			this.trackModel();
			return ionic(this.raw[Symbol.iterator]());
		},
		forEach: SetlikeDef.forEach,
		keys: SetlikeDef.keys,
		values: SetlikeDef.values,
		entries: SetlikeDef.entries,
		set(key, value) {
			return ionic(this.mutate((raw) => raw.set(key, value), ({ op }) => {
				op.trigger("has", key);
				op.trigger("get", key);
				op.trigger("[[get]]", "size");
				op.triggerModel();
			}));
		},
		get(key) {
			this.track("get", key);
			return this.raw.get(key);
		},
		has: SetlikeDef.has,
		clear() {
			if (this.raw.size === 0) return;
			this.mutate((raw) => raw.clear(), ({ op }) => {
				op.triggerModel();
				op.triggerAll("has");
				op.triggerAll("get");
				op.trigger("[[get]]", "size");
			});
		},
		delete(key) {
			return this.mutate((raw) => raw.delete(key), ({ output: success, op }) => {
				if (success) {
					op.triggerModel();
					op.trigger("has", key);
					op.trigger("get", key);
					op.trigger("[[get]]", "size");
				}
			});
		},
		size: SetlikeDef.size
	});
}
//#endregion
//#region ../../packages/quarky/src/ion/HybridIon.ts
function createHybridIon(config, setup) {
	const { derive, initial, watch: $watched } = config;
	const subject = $watched ?? derive;
	const $state = createAtomicIon("initial" in config ? initial : derive(void 0), setup);
	watch(subject, ({ previous }) => {
		$state.value = derive(previous);
	}, { phase: SYNC });
	return $state;
}
//#endregion
//#region ../../packages/quarky/src/async/Suspense.ts
var SUSPENSE_QUARK = Symbol("suspense quark");
function addToSuspense(suspense, quark) {
	suspense[SUSPENSE_QUARK].include(quark);
}
function getSuspenseCount(suspense) {
	return suspense[SUSPENSE_QUARK].quarkCount;
}
var [getAwaiting, suspenseStack] = AsyncState("Suspense");
var pushAwaiting = (n) => {
	suspenseStack.push(n);
};
var popAwaiting = () => {
	suspenseStack.pop();
	getAwaiting();
};
var ASYNC_QUARK = Symbol("async quark");
function toPromise(awaited) {
	if (awaited instanceof Promise) return awaited;
	if (awaited instanceof Object && "asPromise" in awaited) return awaited.asPromise;
	return awaited;
}
function unpackAsyncIonArgs(arg1, arg2, arg3) {
	const fetch = isFunction(arg1) ? arg1 : isFunction(arg2) ? arg2 : () => {
		throw new Error("fetch not provided");
	};
	return {
		fetch,
		initialState: arg1 !== fetch ? arg1 : void 0,
		options: arg1 === fetch ? arg2 : arg3
	};
}
globalThis.$$_createAsyncIon = AsyncIon;
function AsyncIon(arg1, arg2, arg3) {
	const { initialState, fetch, options } = unpackAsyncIonArgs(arg1, arg2, arg3);
	let resolve;
	let reject;
	const $loaded = createAtomicIon(false);
	const $error = createAtomicIon(null);
	const $promise = createAtomicIon(new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	}));
	performance.now();
	const suspense = options?.["-suspend"];
	if (!suspense) $promise.value.catch((err) => {
		if (err === "cancelled") return;
		else throw err;
	});
	const $ion = createAtomicIon(initialState);
	const pendingState = suspense?.pendingState;
	const quark = {
		$promise,
		cancelIfFetching,
		$loaded,
		$error
	};
	const $async = createMemoizedDerivation(suspense && pendingState !== void 0 ? () => suspense() ? pendingState : $ion() : () => {
		const awaiting = getAwaiting();
		if (awaiting) addToSuspense(awaiting, quark);
		return $ion();
	}, {
		[ASYNC_QUARK]: quark,
		get pending() {
			return $promise();
		},
		get loaded() {
			return $loaded();
		},
		get asPromise() {
			return $promise();
		}
	});
	let pendingPromise = null;
	function isFetching() {
		return Boolean(pendingPromise);
	}
	function cancelFetch() {
		console.warn("CANCEL FETCH");
		cancelledPromises.add(pendingPromise);
		pendingPromise = null;
	}
	function cancelIfFetching() {
		if (isFetching()) {
			cancelFetch();
			return true;
		}
		return false;
	}
	const cancelledPromises = /* @__PURE__ */ new Set();
	if (suspense) addToSuspense(suspense, quark);
	watch(fetch instanceof Promise ? () => fetch : fetch, ({ current: output }) => {
		const maybePromise = toPromise(output);
		if (maybePromise === pendingPromise) return;
		cancelIfFetching();
		if (maybePromise instanceof Promise) {
			pendingPromise = maybePromise;
			if (!resolve) {
				$promise.value = new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				});
				if (!suspense) $promise.value.catch((err) => {
					if (err === "cancelled") return;
					else throw err;
				});
			}
			maybePromise.then((value) => {
				if (cancelledPromises.has(maybePromise)) {
					console.warn("canceleld awaited", maybePromise);
					cancelledPromises.delete(maybePromise);
					if (reject) {
						reject("cancelled");
						resolve = null;
						reject = null;
					}
					return;
				}
				pendingPromise = null;
				if (resolve) {
					resolve(value);
					resolve = null;
					reject = null;
				}
				if (suspense?.() && pendingState === void 0) suspense()?.then(() => {
					$ion.value = value;
				});
				else $ion.value = value;
				if ($promise.value) $promise.value = null;
				$loaded.value = true;
			}).catch((err) => {
				pendingPromise = null;
				if (reject) {
					reject(err);
					resolve = null;
					reject = null;
				}
				$error.value = toError(err);
				$promise.value = null;
				$loaded.value = true;
				if (err === "cancelled") return;
				else throw err;
			});
		} else {
			console.log("*** no promise", resolve, $promise());
			if (resolve) {
				resolve(output);
				resolve = null;
				reject = null;
			}
			$error.value = null;
			$promise.value = null;
			$ion.value = output;
		}
	}, {
		phase: PRELUDE,
		eager: true
	});
	return $async;
}
//#endregion
//#region ../../packages/quarky/src/ion/Ion.ts
function ion(initialState, setup) {
	return asIon(initialState, setup);
}
function asIon(initialState, setup) {
	if (isIon(initialState) && !setup) return initialState;
	if (isFunction(initialState)) {
		if (setup && "-writable" in setup) {
			const watch = setup["-watch"];
			delete setup["-writable"];
			delete setup["-watch"];
			return createHybridIon({
				derive: initialState,
				watch
			}, setup);
		}
		return createMemoizedDerivation(initialState, setup);
	}
	if (setup && "-derive" in setup) {
		const derive = setup["-derive"];
		const watch = setup["-watch"];
		delete setup["-derive"];
		delete setup["-watch"];
		return createHybridIon({
			derive,
			initial: initialState,
			watch
		}, setup);
	}
	if (setup && "-fetch" in setup) {
		const fetch = setup["-fetch"];
		setup["-watch"];
		delete setup["-fetch"];
		delete setup["-watch"];
		return AsyncIon(initialState, fetch, setup);
	}
	return createAtomicIon(initialState, setup);
}
//#endregion
//#region ../../packages/quarky/src/ionic/IonizedIterator.ts
defineIonicCollective(Iterator, { clone: (iterator) => iterator }, { next() {
	this.trackModel();
	return this.raw.next();
} });
//#endregion
//#region ../../packages/quarky/src/reactivity/IonicTask.ts
function _queueIonicTask(task, options) {
	const retrack = options?.retrack === void 0 ? true : options.retrack;
	const phase = getPhase(options);
	let initial = true;
	const wrappedEffect = () => {
		try {
			task(initial);
		} finally {
			initial = false;
		}
	};
	const subject = new FunctionSubject(wrappedEffect, retrack);
	subject.asTraceable = new Traceable("ionic task:" + options?.devName);
	return $listen(() => subject.trackedCall(), options || {}, {
		enroll(_task) {
			const effect = new Effect(_task, phase);
			scheduleEagerEffect(() => {
				_task();
				subject.linkEffect(effect);
			}, phase);
			return effect;
		},
		remove(effect) {
			effect.destroy();
		}
	});
}
function queueIonicPrelude(task, options) {
	return _queueIonicTask(task, {
		...options ?? {},
		phase: PRELUDE
	});
}
function runIonicTask(task, options) {
	return _queueIonicTask(task, {
		...options ?? {},
		phase: SYNC
	});
}
function queueIonicRender(task, options) {
	return _queueIonicTask(task, {
		...options ?? {},
		phase: RENDER
	});
}
function queueIonicLayout(task, options) {
	return _queueIonicTask(task, {
		...options ?? {},
		phase: LAYOUT
	});
}
function trackEffect(task, options) {
	return _queueIonicTask(task, {
		...options ?? {},
		phase: TICK
	});
}
trackEffect.atPrelude = queueIonicPrelude;
trackEffect.atRender = queueIonicRender;
trackEffect.atLayout = queueIonicLayout;
trackEffect.sync = runIonicTask;
//#endregion
//#region ../../packages/quarky/src/reactivity/animation.ts
/**
* Throttle by animation frame across mouse events like mouse enter and mouse leave
//  */
/**
* Throttled by animation frame
* @param fn 
* @returns 
*/
//#endregion
//#region ../../packages/quarky/src/specialty/Finitron.ts
var [pushFinitron, popFinitron, getFinitron] = createStack();
//#endregion
//#region ../../packages/quarky/src/index.ts
installIonicSet();
installIonicMap();
//#endregion
//#region ../../packages/luent/src/component/x-Input.ts
function assertMutableIon(value) {
	if (!(isIon(value) && "value" in value)) throw new Error("[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion or ionic proxy");
}
//#endregion
//#region ../../packages/luent/src/context/provide.ts
function markIfMuIon(key, value, context) {
	if (isMuKey(key)) {
		assertMutableIon(value);
		context.muIons ? context.muIons.add(value) : context.muIons = new Set([value]);
	}
}
//#endregion
//#region ../../packages/nextscript/src/component.ts
function JSXComponent(template) {
	return {
		get component() {},
		nodes: normalizeToArray$1(template ? unnestComponent(template) : void 0)
	};
}
function JSXComponentAs(component, template) {
	return {
		get component() {
			return component;
		},
		nodes: normalizeToArray$1(template ? unnestComponent(template) : void 0)
	};
}
JSXComponent.as = function expose(component) {
	return function Component(template) {
		return JSXComponentAs(component, template);
	};
};
function unnestComponent(nodes) {
	const isArray = Array.isArray(nodes);
	if (isArray && nodes.length > 1) return nodes;
	const entity = isArray ? nodes[0] : nodes;
	if (isComponentKit(entity)) {
		if (entity.component) return nodes;
		return entity.nodes;
	}
	return nodes;
}
function isComponentKit(entity) {
	return isObject(entity) && "component" in entity && "nodes" in entity;
}
//#endregion
//#region ../../packages/nextscript/src/index.ts
function isAccessor(value) {
	return typeof value === "function" && value.length === 0;
}
var accessorsProxyCache = /* @__PURE__ */ new WeakMap();
var POSTFIX = Symbol("postfix");
function accessorsOf(target, postfix) {
	let proxy = accessorsProxyCache.get(target);
	if (proxy) {
		proxy[POSTFIX] = postfix;
		return proxy;
	}
	proxy = createAccessorsProxy(target, postfix);
	accessorsProxyCache.set(target, proxy);
	return proxy;
}
function createAccessorsProxy(target, postfix) {
	const accessors = /* @__PURE__ */ new Map();
	return new Proxy(target, {
		get(target, key, receiver) {
			const value = Reflect.get(target, key, receiver);
			if (value == null) {
				if (postfix === "?") return value;
				if (postfix === "!") throw new TypeError("Value must be non-null");
			}
			if (isAccessor(value)) return value;
			return accessors.get(key) ?? createAccessor(target, key, receiver);
		},
		set(_, key, value) {
			if (key === POSTFIX) {
				postfix = value;
				return true;
			}
			return false;
		}
	});
	function createAccessor(target, key, receiver) {
		const accessor = () => Reflect.get(target, key, receiver);
		accessors.set(key, accessor);
		Object.defineProperty(accessor, "value", {
			get: accessor,
			set(value) {
				if (!Reflect.set(target, key, value, receiver)) throw new TypeError(`Cannot set property ${String(key)} via accessor`);
			},
			enumerable: false,
			configurable: false
		});
		return accessor;
	}
}
var ªªof = accessorsOf;
//#endregion
//#region ../../packages/luent/src/context/Context.ts
function Context({ Slot, provide }) {
	if (!Slot) debug.warn(`Extraneous <Context>`);
	return component(callWithContext(Slot, createContextNode(provide)));
}
function createContextNode(provide, parentContext = getClosestContext()) {
	if (!parentContext) throw new Error(`no context found :( This should never happen`);
	const [entries, muIons] = toContextEntries(normalizeToArray$1(provide));
	return {
		entries,
		parent: parentContext,
		root: parentContext?.root,
		ground: parentContext?.ground,
		muIons
	};
}
function callWithContext(Slot, context) {
	pushContext(context);
	const nodeEntities = Slot();
	popContext();
	return unnestComponent(nodeEntities);
}
function wrapWithContext(Slot, provide) {
	const context = createContextNode(provide);
	return (arg) => {
		return callWithContext(() => Slot(arg), context);
	};
}
function toContextEntries(provided) {
	const context = { muIons: void 0 };
	const entries = /* @__PURE__ */ new Map();
	for (const { 0: key, 1: value } of provided) {
		markIfMuIon(key, value, context);
		entries.set(toContextKey(key), value);
	}
	return [entries, context.muIons];
}
//#endregion
//#region ../../packages/luent/src/component/bindings.ts
var MU = Symbol("mu");
var ON = Symbol("on");
var HOOKS = Symbol("hooks");
function toSetup(bindings) {
	const setup = Object.create(null);
	const xray = setup.xray = Object.create(null);
	const keys = Object.keys(bindings);
	const Slot = bindings.Slot;
	for (const rawKey of keys) {
		if (rawKey === "auto-bind") continue;
		const { namespace, key } = analyzeKey(rawKey);
		processBinding(bindings, rawKey, namespace, key);
	}
	if (bindings["auto-bind"]) setup["auto-bind"] = bindings["auto-bind"];
	function processBinding(bindings, rawKey, namespace, key) {
		switch (namespace) {
			case "on":
				const events = setup[ON] ?? (setup[ON] = Object.create(null));
				events[key] = bindings[rawKey];
				break;
			case "mu":
				const mutables = setup.mu ?? (setup.mu = Object.create(null));
				const internal = setup[MU] ?? (setup[MU] = Object.create(null));
				const mutable = bindings[rawKey];
				if (mutable) setup[key] = internal[key] = mutables[key] = mutable;
				break;
			case "at":
			case "pre":
			case "post":
				const hooks = setup[HOOKS] ?? (setup[HOOKS] = Object.create(null));
				hooks[rawKey] = bindings[rawKey];
				break;
			case "Slot":
				const render = bindings[rawKey];
				if (render) Slot[key] = render;
				break;
			case "xray":
				xray[key] = getXrayBindings(bindings[rawKey]);
				break;
			case "xlmns":
			case void 0:
				setup[key] = bindings[rawKey];
				break;
			default:
				const ns = setup[namespace] ?? (setup[namespace] = Object.create(null));
				ns[key] = bindings[rawKey];
				break;
		}
	}
	return setup;
}
function analyzeKey(rawKey) {
	const strings = rawKey.split(":");
	if (strings.length > 2) throw new SyntaxError("attribute may not have more than one namespace");
	const namespaced = strings.length === 2;
	const key = namespaced ? strings[1] : rawKey;
	return {
		namespace: namespaced ? strings[0] : void 0,
		key
	};
}
function composeBindings(bindings) {
	const composed = Object.create(null);
	const keys = Object.keys(bindings);
	for (const rawKey of keys) {
		if (rawKey === "auto-bind") continue;
		const { namespace, key } = analyzeKey(rawKey);
		composeBinding(bindings, rawKey, namespace, key);
	}
	if (bindings["auto-bind"]) composeForwarded(bindings["auto-bind"]);
	function composeForwarded(bindings) {
		const keys = Object.keys(bindings);
		keys.push(MU, HOOKS, ON);
		for (const key of keys) {
			if (key === "auto-bind" || key === "xray" || key === "Slot") continue;
			switch (key) {
				case ON:
					const events = bindings[ON];
					if (!events) break;
					const eventNames = Object.keys(events);
					for (const key of eventNames) composeBinding(events, key, "on", key);
					break;
				case MU:
					const mutables = bindings[MU];
					if (!mutables) break;
					const attributes = Object.keys(mutables);
					for (const key of attributes) composeBinding(attributes, key, "mu", key);
					break;
				case HOOKS:
					const hooks = bindings[HOOKS];
					if (!hooks) break;
					const hookNames = Object.keys(hooks);
					for (const key of hookNames) composeBinding(hooks, key, "hooks", key);
					break;
				default:
					composeAttributes(bindings, key);
					break;
			}
		}
		if (bindings["auto-bind"]) composeForwarded(bindings["auto-bind"]);
	}
	function composeBinding(bindings, rawKey, type, key) {
		switch (type) {
			case "on":
				if (!bindings[rawKey]) break;
				const events = composed.events ?? (composed.events = Object.create(null));
				(events[key] ?? (events[key] = [])).push(bindings[rawKey]);
				break;
			case "mu":
				if (!bindings[rawKey]) break;
				const mutables = composed.mutables ?? (composed.mutables = Object.create(null));
				mutables[key] = bindings[rawKey];
				break;
			case "at":
			case "pre":
			case "post":
			case "hooks":
				if (!bindings[rawKey]) break;
				const hooks = composed.hooks ?? (composed.hooks = Object.create(null));
				(hooks[rawKey] ?? (hooks[rawKey] = [])).push(bindings[rawKey]);
				bindings[rawKey] = void 0;
				break;
			case "Slot":
				const Slot = composed.Slot ?? (composed.Slot = bindings.NamedSlot);
				Slot[key] = bindings[rawKey];
				break;
			default:
				composeAttributes(bindings, rawKey);
				break;
		}
	}
	function composeAttributes(bindings, key) {
		switch (key) {
			case "Slot":
				const slots = composed.slots ?? (composed.slots = []);
				if (bindings.Slot) slots.push(bindings.Slot);
				break;
			case "microclass":
				(composed.microclasses ?? (composed.microclasses = [])).push(bindings.microclass);
				break;
			case "class":
				const classes = composed.classes ?? (composed.classes = []);
				if (bindings.class instanceof Array) composed.classes = classes.concat(bindings.class);
				else classes.push(bindings.class);
				break;
			case "style":
				const styles = composed.styles ?? (composed.styles = []);
				if (bindings.style instanceof Array) composed.styles = styles.concat(bindings.style);
				else styles.push(bindings.style);
				break;
			case "show-if":
				composed.showIf = bindings["show-if"];
				break;
			default:
				const attributes = composed.attributes ?? (composed.attributes = Object.create(null));
				attributes[key] = bindings[key];
				break;
		}
	}
	return composed;
}
function getXrayBindings(xray) {
	return xray(new Proxy({}, { get() {
		return (setup) => {
			return {
				as: void 0,
				nodes: [],
				setup
			};
		};
	} })).setup;
}
//#endregion
//#region ../../packages/luent/src/utils/destructure.ts
function isGetterKey(key) {
	if (typeof key !== "string") return false;
	return key.startsWith("$");
}
function $from(target) {
	if (typeof target !== "object") throw new TypeError("target must be destructurable");
	return new Proxy(target, {
		get(target, key, receiver) {
			if (isGetterKey(key)) {
				const valueKey = key.slice(1);
				if (valueKey in target) return ªªof(target)[valueKey];
				return () => void 0;
			}
			return Reflect.get(target, key, receiver);
		},
		set() {
			return false;
		}
	});
}
//#endregion
//#region ../../packages/luent/src/node/VineNode.tsx
function isNode(value) {
	return isObject(value) && "remove" in value && "after" in value;
}
var VineNode = class {
	parent;
	preceding;
	nodes;
	get precedingLeaf() {
		const preceding = this.preceding;
		if (!preceding) return null;
		if ("remove" in preceding) return preceding;
		return preceding.tailLeaf;
	}
	get tail() {
		return this.nodes?.at(-1) ?? null;
	}
	get tailLeaf() {
		const tail = this.tail;
		if (!tail) return this.precedingLeaf;
		if ("remove" in tail) return tail;
		return tail.tailLeaf;
	}
};
function processJSXOutput$1(rawJSX) {
	return _processJSXOutput$1(normalizeToArray$1(rawJSX));
}
/**
* - spread arrays and components into root array
* - get rid of undefined
* @param jsxNodes 
*/
function _processJSXOutput$1(jsxNodes, flattened = []) {
	console.log("jsxNodes", jsxNodes);
	for (const node of jsxNodes) if (Array.isArray(node)) _processJSXOutput$1(node, flattened);
	else if (isComponentKit(node)) _processJSXOutput$1(node.nodes, flattened);
	else if (isFunction(node)) {
		if (node.length !== 0) throw new Error("render functions must have no parameters");
		flattened.push(new DynamicTextNode(node));
	} else if (node == null || node === "") continue;
	else if (node instanceof VineNode) flattened.push(node);
	else if (isNode(node)) flattened.push(node);
	else {
		console.log("### is text", node);
		flattened.push(createTextNode(node));
	}
	return flattened;
}
function setUpNodeVine(nodes, parent, preceding = null) {
	for (const node of nodes) {
		if (node instanceof VineNode) {
			node.parent = parent;
			node.preceding = preceding;
			if (node.nodes) setUpNodeVine(node.nodes, parent, preceding);
		}
		preceding = node;
	}
	return nodes;
}
var DynamicTextNode = class extends VineNode {
	$text;
	node;
	constructor($text) {
		super();
		this.$text = $text;
		const textNode = this.node = createTextNode($text());
		this.nodes = [textNode];
		watchToRender($text, ({ current, previous, flask }) => {
			atRender(() => {
				textNode.data = toString($text());
			});
		});
	}
};
function createTextNode(value) {
	return document.createTextNode(toString(value));
}
function toString(value) {
	if (value == null) return "";
	if (value instanceof Object) return JSON.stringify(value);
	return value.toString();
}
function mountFragment(fragment, preceding, parent) {
	if (preceding && preceding !== parent) preceding.after(fragment);
	else {
		console.log("PREPEND");
		parent?.prepend(fragment);
	}
}
function mountDOMNodes(nodes, root) {
	for (const node of nodes) if (node instanceof Node) root.appendChild(node);
	else if (node instanceof VineNode) {
		if (!node.nodes) continue;
		mountDOMNodes(node.nodes, root);
	} else debug.error("[[INVALID INPUT]] Invalid node entity", node);
}
function removeDOMNodes(nodes) {
	forEachNode(nodes, (node) => node.remove());
}
function forEachNode(nodes, task) {
	let i = nodes.length;
	while (i--) {
		const node = nodes[i];
		if (isDOMNode(node)) task(node);
		else if ("nodes" in node) {
			const nodes = node.nodes;
			if (nodes) forEachNode(nodes, task);
		} else debug.error("[[INVALID INPUT]] Invalid node entity");
	}
}
function isDOMNode(node) {
	return node instanceof Node;
}
function toAsyncRender(render, context, nestedContext) {
	return (flask, ...args) => {
		nestedContext[FLASK] = flask;
		return $_run_with_(context, () => render(...args), nestedContext);
	};
}
var [getXMLNamespace, XMLNamespaceStack] = AsyncState("xmlns");
//#endregion
//#region ../../packages/luent/src/iteratives/For.ts
var [pushList, popList, getList] = createStack();
//#endregion
//#region ../../packages/luent/src/transitions/transitions.ts
var [markInitialRender, unmarkInitialRender, isInitialRender] = createStack();
//#endregion
//#region ../../packages/luent/src/transitions/Transition.tsx
var transitionConfig;
function setTransition(transition) {
	transitionConfig = transition;
}
function getTransition() {
	const transition = transitionConfig;
	transitionConfig = void 0;
	return transition;
}
ContextKey();
//#endregion
//#region ../../packages/luent/src/element/attributes.ts
var booleanAttributes = {
	async: true,
	autofocus: true,
	autoplay: true,
	checked: true,
	controls: true,
	default: true,
	defer: true,
	disabled: true,
	formnovalidate: true,
	hidden: true,
	inert: true,
	ismap: true,
	itemscope: true,
	loop: true,
	multiple: true,
	muted: true,
	nomodule: true,
	novalidate: true,
	open: true,
	playsinline: true,
	readonly: true,
	required: true,
	reversed: true,
	selected: true,
	truespeed: true
};
function isBooleanAttribute(attribute) {
	return attribute in booleanAttributes;
}
//#endregion
//#region ../../packages/luent/src/events/target.ts
function matchEventTarget(...args) {
	const targ = this.target;
	for (const arg of args) if (typeof arg === "string") {
		if (matchSelector(targ, arg)) return true;
	} else if (isFunction(arg) && arg(targ)) return true;
	return false;
}
function matchSelector(target, selector) {
	if (selector.startsWith(".")) return target.classList.contains(selector);
	else if (selector.startsWith("#")) return target.id === selector;
	else if (selector.startsWith("style.")) {
		const [key, value] = selector.slice(6).split(":");
		return target.style[key] === value;
	} else if (selector.startsWith("x-")) {} else return target.tagName.toLowerCase() === selector;
	return false;
}
//#endregion
//#region ../../packages/luent/src/element/events.ts
function withUpdate(handler, event) {
	const update = getEventUpdater(event) ?? swiftUpdate;
	return (e) => update(() => {
		e.from = matchEventTarget;
		handler(e);
	});
}
function getEventUpdater(event) {
	return htmlEvents[event];
}
var pointerUpdate = instantUpdate;
var htmlEvents = {
	event: swiftUpdate,
	click: swiftUpdate,
	dblclick: swiftUpdate,
	mousedown: swiftUpdate,
	mouseup: swiftUpdate,
	contextmenu: swiftUpdate,
	mouseover: pointerUpdate,
	mousemove: pointerUpdate,
	mouseout: pointerUpdate,
	mouseenter: pointerUpdate,
	mouseleave: pointerUpdate,
	keydown: swiftUpdate,
	keyup: swiftUpdate,
	focus: swiftUpdate,
	blur: swiftUpdate,
	focusin: swiftUpdate,
	focusout: swiftUpdate,
	beforeinput: instantUpdate,
	input: instantUpdate,
	change: swiftUpdate,
	submit: swiftUpdate,
	reset: swiftUpdate,
	select: swiftUpdate,
	invalid: swiftUpdate,
	drag: pointerUpdate,
	dragstart: swiftUpdate,
	dragend: swiftUpdate,
	dragenter: pointerUpdate,
	dragover: pointerUpdate,
	dragleave: pointerUpdate,
	drop: swiftUpdate,
	copy: swiftUpdate,
	cut: swiftUpdate,
	paste: swiftUpdate,
	abort: swiftUpdate,
	canplay: swiftUpdate,
	canplaythrough: swiftUpdate,
	durationchange: swiftUpdate,
	ended: swiftUpdate,
	error: swiftUpdate,
	loadeddata: swiftUpdate,
	loadedmetadata: swiftUpdate,
	loadstart: swiftUpdate,
	pause: swiftUpdate,
	play: swiftUpdate,
	playing: swiftUpdate,
	progress: swiftUpdate,
	ratechange: swiftUpdate,
	seeked: swiftUpdate,
	seeking: swiftUpdate,
	stalled: swiftUpdate,
	suspend: swiftUpdate,
	timeupdate: swiftUpdate,
	volumechange: swiftUpdate,
	waiting: swiftUpdate,
	load: swiftUpdate,
	resize: pointerUpdate,
	scroll: pointerUpdate,
	scrollend: pointerUpdate,
	wheel: pointerUpdate,
	touchstart: swiftUpdate,
	touchend: swiftUpdate,
	touchcancel: swiftUpdate,
	touchmove: swiftUpdate,
	pointerdown: swiftUpdate,
	pointerup: swiftUpdate,
	pointermove: pointerUpdate,
	pointerover: pointerUpdate,
	pointerout: pointerUpdate,
	pointerenter: pointerUpdate,
	pointerleave: pointerUpdate,
	gotpointercapture: swiftUpdate,
	lostpointercapture: swiftUpdate,
	pointercancel: swiftUpdate,
	animationstart: instantUpdate,
	animationend: instantUpdate,
	animationiteration: instantUpdate,
	transitionend: instantUpdate
};
//#endregion
//#region ../../packages/luent/src/node/makeJSXNode.ts
var groupActivationType = void 0;
function getGroupActivationType() {
	return groupActivationType;
}
function resetGroupActivationType() {
	groupActivationType = void 0;
}
/**
* normalizes the last argument of template functions to render function
* @param lastArg 
* @returns 
*/
function normalizeToRenderFunction(lastArg) {
	if (lastArg instanceof Function) return lastArg;
	return function render() {
		return lastArg;
	};
}
//#endregion
//#region ../../packages/luent/src/conditional/IfElse.ts
function createDynamicConditionalKit(statementType, showHideType, render, context, $condition, pending, transitions) {
	let _cache = void 0;
	return {
		pending,
		nodes: null,
		flask: void 0,
		statementType,
		render: toAsyncRender((...args) => {
			try {
				setTransition(transitions);
				return render(...args);
			} finally {
				setTransition(void 0);
			}
		}, context, {
			[FLASK]: void 0,
			[TRACE]: ""
		}),
		type: showHideType,
		$condition,
		get cache() {
			return _cache;
		},
		set cache(nodes) {
			_cache = nodes;
		},
		view: { markDiscard() {
			console.log("@$@ marking discard");
			_cache = void 0;
		} }
	};
}
function toDynamicConditionalKits(kits, showHideType = "create", transitions) {
	const context = $_snap_context();
	const dynamicKits = [];
	for (const kit of kits) {
		if (!kit) continue;
		const { $condition, render, statementType, type = showHideType, pending } = kit;
		dynamicKits.push(createDynamicConditionalKit(statementType, type, render, context, $condition, pending, transitions));
	}
	return dynamicKits;
}
var IfElseKit = class extends VineNode {
	kits;
	outerFlask;
	$activeIndex;
	constructor(kits, outerFlask) {
		super();
		this.kits = kits;
		this.outerFlask = outerFlask;
		this.$activeIndex = $ActiveIndex(getConditions(kits));
		try {
			markInitialRender(true);
			this.activateConditional(this.kits[this.$activeIndex()], (kit) => {
				kit.flask.emitInitialMount();
			});
		} finally {
			unmarkInitialRender();
			watchToRender(this.$activeIndex, ({ previous: prevIndex }) => {
				console.log("@@@ index changed!", this.$activeIndex(), prevIndex);
				if (this.$activeIndex() === prevIndex) return;
				const kit = this.kits[this.$activeIndex()];
				const prevKit = this.pendingDeactivatedKit ?? this.kits[prevIndex];
				console.log("switch?");
				if (this.pendingSwitch) {
					console.log(">>> CANCEL PROMISE");
					this.cancelledPendingSwitch.add(this.pendingSwitch);
					this.pendingSwitch = null;
				}
				if (kit.pending) {
					console.log("await pending switch");
					this.awaitPendingConditional(kit.pending, kit, prevKit);
				} else {
					console.log("@@@ switch!");
					this.deactivateConditional(prevKit);
					this.reactivateConditional(kit);
				}
			});
		}
	}
	cancelledPendingSwitch = /* @__PURE__ */ new Set();
	_pendingSwitchID = 0;
	pendingSwitch = null;
	pendingDeactivatedKit = null;
	awaitPendingConditional(suspense, kit, prevKit) {
		if (!kit.cache) {
			const prevCount = getSuspenseCount(suspense);
			kit.flask = this.outerFlask.spawn({
				type: "view",
				creationScope: kit.type === "create"
			});
			const rawOutput = kit.render(kit.flask, kit.view);
			if (getSuspenseCount(suspense) > prevCount) {
				kit.awaitCache = rawOutput;
				const promise = suspense();
				if (promise) {
					console.log("### B promise...", prevKit && prevKit.nodes ? [...prevKit.nodes] : prevKit.nodes);
					const id = this.pendingSwitch = ++this._pendingSwitchID;
					this.pendingDeactivatedKit = prevKit;
					promise.then(() => {
						if (this.cancelledPendingSwitch.has(id)) {
							console.log(">>> (canceled) B");
							this.cancelledPendingSwitch.delete(id);
							return;
						}
						this.pendingSwitch = null;
						console.log("### B promise switch");
						if (prevKit !== kit) this.deactivateConditional(prevKit);
						this.reactivateConditional(kit);
					});
				} else watch(suspense, ({ current: promise }) => {
					if (promise) {
						console.log("### A promise...", prevKit && prevKit.nodes ? [...prevKit.nodes] : prevKit.nodes);
						const id = this.pendingSwitch = ++this._pendingSwitchID;
						this.pendingDeactivatedKit = prevKit;
						promise.then(() => {
							if (this.cancelledPendingSwitch.has(id)) {
								console.log(">>> (canceled) A");
								this.cancelledPendingSwitch.delete(id);
								return;
							}
							this.pendingSwitch = null;
							console.log("### A promise switch");
							if (prevKit !== kit) this.deactivateConditional(prevKit);
							this.reactivateConditional(kit);
						});
					}
				}, {
					phase: PRELUDE,
					once: true
				});
			} else {
				suspense.value = null;
				console.log("### C switch");
				kit.awaitCache = rawOutput;
				if (prevKit !== kit) this.deactivateConditional(prevKit);
				this.reactivateConditional(kit);
			}
		} else {
			const promise = suspense();
			if (promise) {
				console.log("### D promise...");
				const id = this.pendingSwitch = ++this._pendingSwitchID;
				this.pendingDeactivatedKit = prevKit;
				promise.then(() => {
					if (this.cancelledPendingSwitch.has(id)) {
						console.log(">>> (canceled) D");
						this.cancelledPendingSwitch.delete(id);
						return;
					}
					this.pendingSwitch = null;
					console.log("### D promise switch", prevKit === kit);
					if (prevKit !== kit) this.deactivateConditional(prevKit);
					this.reactivateConditional(kit);
				});
			} else {
				console.log("### E switch");
				if (prevKit !== kit) this.deactivateConditional(prevKit);
				this.reactivateConditional(kit);
			}
		}
	}
	reactivateConditional(activeKit) {
		this.activateConditional(activeKit, (kit, initial) => {
			setUpNodeVine(kit.nodes, this.parent, this.preceding);
			const fragment = new DocumentFragment();
			mountDOMNodes(kit.nodes, fragment);
			atRender(() => {
				mountFragment(fragment, this.precedingLeaf, this.parent);
			});
			initial ? kit.flask.emitInitialMount() : kit.flask.emitRemount();
		});
	}
	activateConditional(kit, emitActivated) {
		if (!kit) return;
		const initialMount = !kit.cache;
		const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({
			type: "view",
			creationScope: kit.type === "create"
		}));
		kit.nodes = this.nodes = kit.type === "remount" ? kit.cache ?? (kit.cache = processJSXOutput$1(kit.awaitCache ? kit.awaitCache : kit.render(flask, kit.view))) : processJSXOutput$1(kit.awaitCache ? kit.awaitCache : kit.render(flask, kit.view));
		kit.awaitCache = void 0;
		emitActivated(kit, initialMount);
	}
	deactivateConditional(kit) {
		if (!kit) return;
		const prevNodes = kit.nodes;
		this.pendingDeactivatedKit = null;
		if (!prevNodes) return;
		kit.nodes = null;
		if (!kit.cache) {
			kit.flask.emitDiscard();
			kit.flask = void 0;
		} else kit.flask.emitDemount();
		atRender(() => {
			removeDOMNodes(prevNodes);
		});
		return kit;
	}
};
function getConditions(statements) {
	const conditions = [];
	for (let i = 0; i < statements.length; i++) {
		const kit = statements[i];
		const $condition = kit.$condition;
		if ($condition) conditions.push($condition);
		if (i === 0 && kit.statementType !== "if" || i !== 0 && kit.statementType === "if") continue;
		if (!("statementType" in kit)) continue;
		if (i !== statements.length - 1 && kit.statementType === "else") continue;
	}
	return conditions;
}
function $ActiveIndex(conditions) {
	return createMemoizedDerivation(() => {
		for (let i = 0; i < conditions.length; i++) {
			const $condition = conditions[i];
			if ($condition()) return i;
		}
		return conditions.length;
	});
}
var showIfMap = /* @__PURE__ */ new WeakMap();
function hideDOMNodes(nodes) {
	forEachNode(nodes, (node) => {
		if (node instanceof CharacterData) {
			showIfMap.set(node, node.data);
			node.data = "";
		} else if (node instanceof HTMLElement || node instanceof SVGAElement || node instanceof MathMLElement) {
			showIfMap.set(node, node.style.display);
			node.style.display = "none";
		}
	});
}
function showDOMNodes(nodes) {
	forEachNode(nodes, (node) => {
		if (node instanceof CharacterData) {
			const text = showIfMap.get(node);
			if (text === void 0) throw new Error("previous text info missing");
			node.data = text;
		} else if (node instanceof HTMLElement || node instanceof SVGAElement || node instanceof MathMLElement) {
			const display = showIfMap.get(node);
			if (display === void 0) node.style.removeProperty("display");
			else node.style.display = display;
		} else console.warn(`Unhandled node type ${node}`);
	});
}
function renderShowHideSeries(kits) {
	getFlask$1();
	const $activeIndex = $ActiveIndex(getConditions(kits));
	const seriesNodes = [];
	for (let i = 0; i < kits.length; i++) {
		const kit = kits[i];
		const nodes = processJSXOutput$1(kit.render(kit.$condition));
		if ($activeIndex() === i) showDOMNodes(nodes);
		else hideDOMNodes(nodes);
		seriesNodes.push(nodes);
		const $match = createMemoizedDerivation(() => $activeIndex() === i);
		watchToRender($match, ({ current: isActive, previous: wasActive, flask }) => {
			if (isActive === wasActive) return;
			if ($match()) atRender(() => {
				showDOMNodes(nodes);
			});
			else if (wasActive) atRender(() => {
				hideDOMNodes(nodes);
			});
		});
	}
	return seriesNodes;
}
//#endregion
//#region ../../packages/luent/src/conditional/If.ts
function If($condition, typeOrRenderConditional, renderConditional) {
	const [render, type, pending] = getParams(typeOrRenderConditional, renderConditional);
	return {
		statementType: "if",
		render,
		type,
		pending: getAwaiting(),
		$condition
	};
}
function ElseIf($condition, typeOrRenderConditional, renderConditional) {
	const [render, type, pending] = getParams(typeOrRenderConditional, renderConditional);
	return {
		statementType: "elseIf",
		render,
		type,
		pending: getAwaiting(),
		$condition
	};
}
function Else(typeOrRenderConditional, renderConditional) {
	const [render, type, pending] = getParams(typeOrRenderConditional, renderConditional);
	return {
		statementType: "else",
		render,
		type,
		pending: getAwaiting(),
		$condition: void 0
	};
}
function getParams(typeOrRenderConditional, renderConditional) {
	return [
		normalizeToRenderFunction(renderConditional ? renderConditional : typeOrRenderConditional),
		renderConditional ? typeof typeOrRenderConditional === "string" ? typeOrRenderConditional : void 0 : void 0,
		renderConditional ? isFunction(typeOrRenderConditional) ? typeOrRenderConditional : void 0 : void 0
	];
}
function createIfSeries(kits, viewBy) {
	const condition = kits[0].$condition;
	if (!isGetter(condition) || isInertIon(condition)) return renderStaticConditional(kits);
	const showHideType = viewBy ?? getGroupActivationType();
	resetGroupActivationType();
	if (showHideType === "show") return renderShowHideSeries(kits);
	const transitions = getTransition();
	try {
		if (kits.at(-1)?.statementType !== "else") kits.push(Else(() => void 0));
		return new IfElseKit(toDynamicConditionalKits(kits, showHideType, transitions), getFlask$1());
	} finally {
		setTransition(transitions);
	}
}
globalThis._$$IfSeries = createIfSeries;
function renderStaticConditional(statements) {
	for (const kit of statements) if (!!toValue(kit.$condition) === true) return kit.render();
}
//#endregion
//#region ../../packages/luent/src/boundaries/Await.ts
function unpackAwaitSeries(series) {
	const { $suspense, renderResolved } = series[0];
	const secondKit = series[1];
	const thirdKit = series[2];
	return {
		$suspense,
		renderResolved,
		renderPlaceholder: secondKit && "renderPlaceholder" in secondKit ? $suspense ? wrapWithSuspense(secondKit.renderPlaceholder, $suspense) : secondKit.renderPlaceholder : (() => void 0),
		renderError: secondKit && "renderError" in secondKit ? secondKit.renderError : thirdKit?.renderError ?? (() => void 0),
		timeout: secondKit && "timeout" in secondKit ? secondKit.timeout : void 0
	};
}
function wrapWithSuspense(render, $suspense) {
	return () => {
		try {
			pushAwaiting($suspense);
			return render($suspense);
		} finally {
			popAwaiting();
		}
	};
}
function createAwaitSeries(series) {
	const { renderError, renderPlaceholder, renderResolved, $suspense, timeout } = unpackAwaitSeries(series);
	const $error = createAtomicIon(void 0);
	const $renderPlaceholder = createAtomicIon(false);
	function syncPlaceholderState() {
		const suspensePending = Boolean($suspense());
		placeholder = renderPlaceholder();
		$renderPlaceholder.value = suspensePending && !shouldHold();
	}
	watch($suspense, () => {
		if ($renderPlaceholder() === Boolean($suspense())) return;
		syncPlaceholderState();
	}, {
		phase: PRELUDE,
		eager: true
	});
	function shouldHold() {
		placeholder = renderPlaceholder();
		if (placeholder === false || placeholder === true) {
			console.log("*** C1");
			return true;
		}
		if (Array.isArray(placeholder)) if (placeholder.length > 1) {
			console.log("*** C2");
			return false;
		} else {
			console.log("*** C3");
			return placeholder[0] === false;
		}
		console.log("*** C4");
		return true;
	}
	let placeholder = renderPlaceholder();
	return createIfSeries([
		If($renderPlaceholder, () => {
			return placeholder;
		}),
		ElseIf($error, () => renderError($error())),
		Else("remount", renderResolved)
	]);
}
globalThis._$$AwaitSeries = createAwaitSeries;
UIDGenerator(11);
//#endregion
//#region ../../packages/luent/src/conditional/MatchCase.ts
function toCasesMap(raw, groupActivationType) {
	const superGroupActivationType = getGroupActivationType();
	const fallbackType = groupActivationType ?? superGroupActivationType === "show" ? "remount" : superGroupActivationType ?? "create";
	const map = /* @__PURE__ */ new Map();
	const context = $_snap_context();
	const pending = getAwaiting();
	console.log("awaiting??", pending);
	let currentKit;
	for (const rawKit of raw) {
		const { case: c, render, type } = rawKit;
		if (currentKit && !currentKit.render) {
			if (render) {
				currentKit.render = toAsyncRender(render, context, {
					[FLASK]: void 0,
					[TRACE]: ""
				});
				currentKit.type = type ?? fallbackType;
			}
		} else currentKit = createCasesKit(type ?? fallbackType, render, context, pending);
		map.set(c, currentKit);
		if (currentKit.render) currentKit = void 0;
	}
	return map;
}
var DEFAULT = Symbol("default");
function createCasesKit(showHideType, render, context, pending) {
	return {
		pending,
		nodes: null,
		flask: void 0,
		render: render ? toAsyncRender(render, context, {
			[FLASK]: void 0,
			[TRACE]: ""
		}) : void 0,
		type: showHideType,
		cache: void 0,
		awaitCache: void 0,
		view: { markDiscard: () => {
			console.log("@$@ noop");
		} }
	};
}
var MatchKit = class extends VineNode {
	cases;
	getKit(caseKey, cacheKey) {
		const protoKit = this.cases.get(caseKey) ?? this.cases.get(DEFAULT);
		if (!protoKit) return;
		if (protoKit.type === "create") return protoKit;
		if (protoKit.type === "remount") return (this.cached ?? (this.cached = /* @__PURE__ */ new Map())).get(cacheKey) ?? this.createCachedKit(cacheKey, protoKit);
	}
	createCachedKit(cacheKey, protoKit) {
		let _cache;
		const kit = {
			...protoKit,
			get cache() {
				return _cache;
			},
			set cache(nodes) {
				_cache = nodes;
			},
			view: { markDiscard() {
				console.log("@$@ markDiscard");
				_cache = void 0;
			} }
		};
		this.cached.set(cacheKey, kit);
		(kit.flask ?? (kit.flask = this.outerFlask.spawn({
			type: "view",
			creationScope: kit.type === "create"
		}))).onDiscard(() => {
			this.cached?.delete(cacheKey);
		});
		return kit;
	}
	cached;
	outerFlask = getFlask$1();
	constructor($key, cases, toCase = (key) => key == null ? DEFAULT : key) {
		super();
		this.cases = cases;
		const caseKey = toCase($key());
		const kit = this.getKit(caseKey, $key());
		if (kit) try {
			markInitialRender(true);
			this.activateConditional(kit, (kit) => {
				kit.flask.emitInitialMount();
				if (kit.type == "remount") kit.flask.onDiscard(() => {
					this.cached?.delete(caseKey);
				});
			});
		} finally {
			unmarkInitialRender();
		}
		watchToRender($key, ({ previous, flask }) => {
			const prevCase = toCase(previous);
			const caseKey = toCase($key());
			const matchKey = $key();
			console.log("prevCase", prevCase);
			console.log("caseKey", caseKey);
			if (matchKey === previous) {
				console.warn("PREVIOUS MATCH", matchKey);
				return;
			}
			const kit = this.getKit(caseKey, matchKey);
			const prevKit = this.pendingDeactivatedKit ?? this.getKit(prevCase, previous);
			if (this.pendingSwitch) {
				console.log(">>> CANCEL PROMISE");
				this.cancelledPendingSwitch.add(this.pendingSwitch);
				this.pendingSwitch = null;
			}
			if (kit.pending) this.awaitPendingConditional(kit.pending, kit, prevKit);
			else {
				this.deactivateConditional(prevKit);
				this.reactivateConditional(kit);
				if (kit.type == "remount") kit.flask.onDiscard(() => {
					this.cached?.delete(matchKey);
				});
			}
		});
	}
	cancelledPendingSwitch = /* @__PURE__ */ new Set();
	_pendingSwitchID = 0;
	pendingSwitch = null;
	pendingDeactivatedKit = null;
	awaitPendingConditional = IfElseKit.prototype.awaitPendingConditional;
	reactivateConditional = IfElseKit.prototype.reactivateConditional;
	activateConditional = IfElseKit.prototype.activateConditional;
	deactivateConditional = IfElseKit.prototype.deactivateConditional;
};
//#endregion
//#region ../../packages/luent/src/events/listen.ts
function listen(element, event, handler, options) {
	if (options?.eager) withUpdate(handler, event)(new Event(event));
	return $listen(withUpdate(handler, event), options || {}, {
		enroll(cb) {
			element.addEventListener(event, cb, options);
		},
		remove(cb) {
			element.removeEventListener(event, cb, options);
		}
	});
}
defineCustomCleanupScheduler((target, event) => (cleanup) => listen(target, event, cleanup));
//#endregion
//#region ../../packages/luent/src/boundaries/Try.tsx
function createTryCatch(renderAttempt, errorKit) {
	try {
		return renderAttempt();
	} catch (err) {
		if (errorKit) return errorKit.renderError(err instanceof Error ? err : new Error(typeof err === "string" ? err : ""));
		return;
	}
}
globalThis._$$TrySeries = createTryCatch;
//#endregion
//#region ../../packages/luent/src/server/renderer.ts
var selfclosing = {
	"area": true,
	"base": true,
	"br": true,
	"col": true,
	"embed": true,
	"hr": true,
	"img": true,
	"input": true,
	"link": true,
	"meta": true,
	"param": true,
	"source": true,
	"track": true,
	"wbr": true
};
function renderElement(tagName, Slot, bindings) {
	if (tagName in selfclosing) return `<${tagName}${renderBindings(bindings)}>`;
	return `<${tagName}${renderBindings(bindings)}>${renderSlot(Slot)}</${tagName}>`;
}
function getValue(value) {
	return toString(isGetter(value) ? toValue(value()) : value);
}
function renderBindings(bindings) {
	const { attributes, classes, microclasses, styles, showIf, transitions } = composeBindings(bindings);
	let renderedAttributes = "";
	if (attributes) renderedAttributes += genAtrributes(attributes);
	if (classes) {
		const classString = genClasses(normalizeToArray$1(classes));
		if (classString) renderedAttributes += ` class="${classString}"`;
	}
	if (styles || showIf) {
		const styleString = genStyles(styles, showIf);
		if (styleString) renderedAttributes += ` style="${styleString}"`;
	}
	return renderedAttributes;
}
function genAtrributes(attributes) {
	for (const [key, value] of Object.entries(attributes)) {
		key.startsWith("mu:") && key.slice(3);
		const value = getValue(attributes[key]);
		return isBooleanAttribute(key) && value ? ` ${key}` : ` ${key}="${value}"`;
	}
}
function genClasses(classes) {
	let classString = "";
	for (const entry of classes) {
		if (!entry) continue;
		classString += addClasses(getValue(entry));
	}
	return classString.trim();
}
function addClasses(value) {
	if (!value) return;
	else if (isString(value)) return ` ` + value.trim();
	else if (isObject(value)) return classesFromObject(value);
}
function classesFromObject(entry) {
	let classString = "";
	for (const key in entry) if (getValue(entry[key])) classString += ` key`;
}
function genStyles(styles, showIf) {
	let styleString = "";
	if (styles) for (const entry of styles) styleString += genStyle(entry);
	if (showIf) {
		if (!getValue(showIf)) styleString += ` display: none;`;
	}
	return styleString.trim();
}
function genStyle(entry) {
	if (isObject(entry)) return genStylesFromObject(entry);
	else if (entry && typeof entry === "string") return " " + normalizeStyle(entry) + ";";
	return "";
}
function genStylesFromObject(entry) {
	let styles = "";
	for (const key in entry) styles += genStyleProperty(key, getValue(entry[key]));
}
function genStyleProperty(key, value) {
	if (!value) return "";
	return " " + key + ": " + String(value) + ";";
}
function normalizeStyle(expression) {
	expression.trim();
	if (expression.endsWith(";")) return expression.substring(0, expression.length - 1);
	return expression;
}
function renderSlot(Slot) {
	if (!Slot) return "";
	return processJSXOutput(typeof Slot === "function" ? Slot() : Slot).join(" ");
}
function processJSXOutput(rawJSX) {
	return _processJSXOutput(normalizeToArray$1(rawJSX));
}
/**
* - spread arrays and components into root array
* - get rid of undefined
* @param jsxNodes 
*/
function _processJSXOutput(jsxNodes, flattened = []) {
	for (const node of jsxNodes) if (Array.isArray(node)) _processJSXOutput(node, flattened);
	else if (isComponentKit(node)) _processJSXOutput(node.nodes, flattened);
	else if (isFunction(node)) {
		if (node.length !== 0) throw new Error("render functions must have no parameters");
		flattened.push(toString(node()));
	} else if (node == null || node === "") continue;
	else flattened.push(toString(node));
	return flattened;
}
function renderComponent(Component, fromTag) {
	return processJSXOutput(Component($from(toSetup(fromTag)))).join(" ");
}
function renderToString(App, config) {
	const flask = new Flask({ type: "view" });
	try {
		flaskStack.push(flask);
		flask.emitInitialMount();
		console.log("RENDER TO STRING");
		const output = processJSXOutput(App()).join(" ");
		console.log("OUTPUT????", output);
		return output;
	} finally {
		flaskStack.pop();
	}
}
//#endregion
//#region ../../packages/luent/src/conditional/As.ts
function createAsSeries(...series) {
	const [kit] = series;
	return new MatchKit(kit.key, toCasesMap(series, void 0), (key) => key == null ? DEFAULT : "as");
}
globalThis._$$AsSeries = createAsSeries;
//#endregion
//#region ../../packages/luent/src/index.ts
globalThis._$$wrapWithContext = wrapWithContext;
//#endregion
//#region ../../packages/luent/src/server/jsx-runtime.ts
function writeJSXNode(nodeType, Slot, config) {
	switch (nodeType) {
		default:
			if (typeof nodeType === "string") return renderElement(nodeType, Slot, config);
			return renderComponent(nodeType, config);
	}
}
//#endregion
//#region ../../packages/luent/src/jsx-runtime/index.ts
function jsx(nodeType, config) {
	let Slot = config.children;
	delete config.children;
	config.Slot = Slot ?? (Slot = config.Slot);
	if (typeof Slot !== "function" && Slot !== void 0) {
		console.warn("Slot is not a function", Slot);
		return;
	}
	if (nodeType === Context) return Context({
		Slot,
		provide: config.provide
	});
	if (nodeType === Fragment$1) return normalizeToArray$1(Slot?.());
	return writeJSXNode(nodeType, Slot, config);
}
function Fragment$1() {}
//#endregion
//#region src/HelloWorld.tsx
function HelloWorld() {
	return /* @__PURE__ */ jsx("div", { children: () => ["Hello world"] });
}
var nsx_get_injection_tmLanguage_default = {
	scopeName: "nsx.get.injection",
	injectionSelector: "L:source.nsx -comment -string, L:source.ns -comment -string",
	patterns: [
		{
			"name": "keyword.control.flow",
			"match": "<::(?=\\s|>)"
		},
		{
			"name": "keyword.control.flow",
			"match": "<\\/::>"
		},
		{
			"match": "^(\\s*)(<:>)",
			"captures": { "2": { "name": "keyword.control.flow" } }
		},
		{
			"name": "storage.type.function.arrow",
			"match": "<:>"
		},
		{
			"name": "keyword.operator.at",
			"match": "(?<=[A-Za-z_$][\\w$]*)@"
		},
		{
			"name": "keyword.operator.at",
			"match": "(?<=\\))@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			"name": "keyword.operator.at",
			"match": "(?<=\\})@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			"name": "keyword.operator.at",
			"match": "(?<=\\])@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			"name": "keyword.operator.at",
			"match": "(?<=[?!])@(?=\\s*(?:\\(\\s*\\))?)"
		},
		{
			"name": "storage.type",
			"match": "\\bget(?=\\s+[A-Za-z_$][\\w$]*\\s*=)"
		},
		{
			"name": "storage.type",
			"match": "\\bget(?=\\s+[A-Za-z_$][\\w$]*\\s*:)"
		},
		{
			"name": "storage.type",
			"match": "\\bget(?=\\s+[A-Za-z_$][\\w$]*\\s*\\()"
		}
	]
};
var dusky_default = {
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
			"scope": ["comment", "punctuation.definition.comment"],
			"settings": {
				"foreground": "#6c7080",
				"fontStyle": "italic"
			}
		},
		{
			"scope": [
				"keyword",
				"storage",
				"storage.type",
				"storage.modifier"
			],
			"settings": { "foreground": "#9a97b8" }
		},
		{
			"scope": [
				"entity.name.type",
				"support.type",
				"entity.name.class"
			],
			"settings": { "foreground": "#a79fff" }
		},
		{
			"scope": [
				"entity.name.function",
				"support.function",
				"meta.function-call"
			],
			"settings": { "foreground": "#c1b8ff" }
		},
		{
			"scope": [
				"variable",
				"variable.parameter",
				"support.variable"
			],
			"settings": { "foreground": "#d8d9e0" }
		},
		{
			"scope": ["string", "string.quoted"],
			"settings": { "foreground": "#e6c77a" }
		},
		{
			"scope": ["entity.name.tag"],
			"settings": { "foreground": "#e6c77a" }
		},
		{
			"scope": ["entity.other.attribute-name"],
			"settings": { "foreground": "#c1b8ff" }
		},
		{
			"scope": ["constant.numeric"],
			"settings": { "foreground": "#f2a65a" }
		},
		{
			"scope": ["constant.language", "constant.character"],
			"settings": { "foreground": "#f0b86c" }
		},
		{
			"scope": ["keyword.operator"],
			"settings": { "foreground": "#b7afff" }
		},
		{
			"scope": [
				"punctuation",
				"meta.brace",
				"meta.delimiter"
			],
			"settings": { "foreground": "#8d91a1" }
		}
	]
};
var golden_hour_default = {
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
			"scope": ["comment", "punctuation.definition.comment"],
			"settings": {
				"foreground": "#afafaf",
				"fontStyle": "italic"
			}
		},
		{
			"scope": [
				"keyword",
				"storage.type",
				"storage.modifier",
				"keyword.control"
			],
			"settings": { "foreground": "#bb4c33" }
		},
		{
			"scope": [
				"entity.name.function",
				"meta.function-call",
				"variable.function",
				"support.function"
			],
			"settings": { "foreground": "#ca791a" }
		},
		{
			"scope": [
				"entity.name.type",
				"support.type",
				"entity.name.class"
			],
			"settings": { "foreground": "#a56b5c" }
		},
		{
			"scope": [
				"variable",
				"variable.parameter",
				"support.variable"
			],
			"settings": { "foreground": "#1e1e1e" }
		},
		{
			"scope": [
				"string",
				"string.quoted",
				"string.template"
			],
			"settings": { "foreground": "#5f55d8" }
		},
		{
			"scope": ["constant.numeric"],
			"settings": { "foreground": "#6a5cff" }
		},
		{
			"scope": [
				"constant.language",
				"constant.character",
				"support.constant"
			],
			"settings": { "foreground": "#7b6fe8" }
		},
		{
			"scope": ["entity.name.tag", "meta.tag"],
			"settings": { "foreground": "#ca791a" }
		},
		{
			"scope": ["entity.other.attribute-name"],
			"settings": { "foreground": "#a56b5c" }
		},
		{
			"scope": ["keyword.operator"],
			"settings": { "foreground": "#845e6d" }
		},
		{
			"scope": [
				"punctuation",
				"meta.brace",
				"meta.delimiter"
			],
			"settings": { "foreground": "#4e4e4e" }
		}
	]
};
var nsxGrammar = {
	name: "nsx",
	scopeName: "source.nsx",
	aliases: ["ns"],
	patterns: [{ include: "source.tsx" }],
	repository: {},
	injections: { "L:source.nsx -comment -string": { patterns: (nsx_get_injection_tmLanguage_default.patterns ?? []).map((pattern) => ({ ...pattern })) } }
};
var shikiThemeNames = {
	light: "golden-hour",
	dark: "dusky"
};
var shikiThemes = [golden_hour_default, dusky_default];
var shikiLanguages = [
	"ts",
	"tsx",
	nsxGrammar
];
[...shikiLanguages];
//#endregion
//#region src/code-utils.ts
var highlighterPromise = createHighlighter({
	themes: [...shikiThemes],
	langs: [...shikiLanguages]
});
async function renderCodeToHtml(code, lang) {
	return (await highlighterPromise).codeToHtml(code, {
		lang,
		themes: shikiThemeNames,
		defaultColor: false
	});
}
function toHtml(code) {
	return code.replace(/&/g, "&#x26;").replace(/</g, "&#x3C;").replace(/>/g, "&#x3E;");
}
function codeHtml(code) {
	return `<pre class='shiki'><code>${toHtml(code)}</code></pre>`;
}
//#endregion
//#region src/Code.tsx
function Code(setup) {
	const { main, alt, highlight, trusted } = setup;
	const $tab = ion("main", { toggle() {
		$tab() === "main" ? $tab.value = "alt" : $tab.value = "main";
	} });
	const $main = ion(codeHtml(main.code), { "-fetch": () => highlight(main.code, main.lang ?? main.name) });
	let mainWidth = 0;
	return JSXComponent([/* @__PURE__ */ jsx("div", {
		class: "code-container",
		children: () => [/* @__PURE__ */ jsx("nav", { children: () => [/* @__PURE__ */ jsx("button", {
			class: "toggle",
			"on:click": () => $tab.toggle(),
			children: () => [
				/* @__PURE__ */ jsx("span", {
					class: "option selected",
					style: { "transform": () => $tab() === "alt" ? `translateX(${mainWidth}px)` : void 0 },
					children: () => [() => $tab() === "main" ? main.name : alt.name]
				}),
				/* @__PURE__ */ jsx("span", {
					"at:mount": (node) => mainWidth = node.offsetWidth,
					class: "option",
					children: () => [main.name]
				}),
				/* @__PURE__ */ jsx("span", {
					class: "option",
					children: () => [alt.name]
				})
			]
		})] }), /* @__PURE__ */ jsx("div", { children: () => [$main()] })]
	})]);
}
//#endregion
//#region src/load-home-tour.tsx
var accessorNsx = `get count = ion(initial)
get qty = ion(0, {
  increment() { qty++ },
  decrement() { qty-- }
})
get total = ion(() => count * qty)

`;
var accessorTranspiled = `const count = ion(initial)
const qty = ion(0, {
  increment() { qty.value++ },
  decrement() { qty.value-- }
})
const total = ion(() => count() * qty())

`;
var derivationNsx = `<button 
  on:click={() => count++} 
  disabled={(count === limit)@}
>
  +
</button>

`;
var derivationTranspiled = `<button 
  on:click={() => count.value++} 
  disabled={() => count() === limit}
>
  +
</button>

`;
var flowNsx = `<section>
  {If(inStock,
    <span class='status'>In stock</span>
    <button on:click={addToCart}>Buy</button>
  )}
  {Else(
    <span class='status'>Sold out</span>
  )}
</section>




`;
var flowTranspiled = `<section>
  {If(inStock, () =>
    <>
      <span class='status'>In stock</span>
      <button on:click={addToCart}>Buy</button>
    </>
  )}
  {Else(() =>
    <>
      <span class='status'>Sold out</span>
    </>
  )}
</section>`;
var gatewayReturn = `<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    <:>
    <section>
      <h2 class={highlight}>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  })}
</article>

`;
var gatewayReturnTranspiled = `<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    return (
      <>
        <section>
          <h2 class={highlight}>{section.title}</h2>
          <p>{section.body}</p>
        </section>
        <hr/>
      </>
    )
  })}
</article>
`;
var componentNsx = `function Dialog({ Slot }) {
  get opened = ion(false)
  const open = () => { opened = true }
  const close = () => { opened = false }

  <:: as={{ open, close }}>  
    {If(opened@, 
      <o--body>
        <div>{Slot()}</div>
      </o--body>
    )}
  </::>
}



`;
var componentTranspiled = `function Dialog({ Slot }) {
  const opened = ion(false)
  const open = () => { opened = true }
  const close = () => { opened = false }

  return JSXComponent({
    slot: <>
      {If(opened, 
        <o--body>
          <div>{Slot()}</div>
        </o--body>
      )}
    </>,
    as: { open, close }
  }) 
}
`;
function HomeTour() {
	return JSXComponent([/* @__PURE__ */ jsx("section", {
		class: "home-tour",
		children: () => [
			/* @__PURE__ */ jsx("article", {
				class: "tour-row code-right",
				children: () => [/* @__PURE__ */ jsx("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ jsx("h3", { children: () => ["Accessor variables"] }),
						/* @__PURE__ */ jsx("code", { children: () => ["get variable = getter"] }),
						/* @__PURE__ */ jsx("p", { children: () => ["—scope-level, locally-bound, type-guard-aware counterpart to native accessor properties"] }),
						/* @__PURE__ */ jsx("p", {
							class: "tour-note",
							children: () => [
								/* @__PURE__ */ jsx("strong", { children: () => ["Note:"] }),
								" Reactivity depends on the getter implementation, which NextScript does not define. In this example, the getter implementation comes from Luent's ",
								/* @__PURE__ */ jsx("code", { children: () => ["ion()"] }),
								". "
							]
						}),
						/* @__PURE__ */ jsx("a", {
							href: "/guide/getter-syntax",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ jsx(Code, {
						trusted: true,
						main: {
							name: "ns",
							code: accessorNsx
						},
						alt: {
							name: "ts equivalent",
							code: accessorTranspiled,
							lang: "ts"
						},
						highlight: renderCodeToHtml
					})]
				})]
			}),
			/* @__PURE__ */ jsx("article", {
				class: "tour-row code-left",
				children: () => [/* @__PURE__ */ jsx("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ jsx("h3", { children: () => ["Derivation expressions"] }),
						/* @__PURE__ */ jsx("code", { children: () => ["(expression)@"] }),
						/* @__PURE__ */ jsx("p", { children: () => ["—derivation-first shorthand for derivational arrow function expressions"] }),
						/* @__PURE__ */ jsx("p", {
							class: "tour-note",
							children: () => [/* @__PURE__ */ jsx("strong", { children: () => ["Note:"] }), " This example assumes a conservative JSX to JavaScript transpilation strategy that maps tag bindings directly to object properties. NextScript itself transpiles only to TypeScript and JSX. It does not define how TypeScript and JSX are ultimately transpiled to JavaScript."]
						}),
						/* @__PURE__ */ jsx("a", {
							href: "/guide/getter-syntax#derivation-expressions",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ jsx(Code, {
						trusted: true,
						main: {
							name: "nsx",
							code: derivationNsx
						},
						alt: {
							name: "tsx equivalent",
							code: derivationTranspiled,
							lang: "tsx"
						},
						highlight: renderCodeToHtml
					})]
				})]
			}),
			/* @__PURE__ */ jsx("article", {
				class: "tour-row code-right",
				children: () => [/* @__PURE__ */ jsx("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ jsx("h3", { children: () => ["JSX flow expressions"] }),
						/* @__PURE__ */ jsx("code", { children: () => [`{Fn(...args, <tag/>)}`] }),
						/* @__PURE__ */ jsx("p", { children: () => ["—template control flow with implicit JSX fragment factories"] }),
						/* @__PURE__ */ jsx("a", {
							href: "/guide/jsx-syntax",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ jsx(Code, {
						trusted: true,
						main: {
							name: "nsx",
							code: flowNsx
						},
						alt: {
							name: "tsx equivalent",
							code: flowTranspiled,
							lang: "tsx"
						},
						highlight: renderCodeToHtml
					})]
				})]
			}),
			/* @__PURE__ */ jsx("article", {
				class: "tour-row code-left",
				children: () => [/* @__PURE__ */ jsx("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ jsx("h3", { children: () => ["JSX gateway return"] }),
						/* @__PURE__ */ jsx("code", { children: () => [
							"() => {",
							" ",
							/* @__PURE__ */ jsx("i", { children: () => ["statements;"] }),
							" ",
							"<:>",
							" ",
							/* @__PURE__ */ jsx("i", { children: () => ["jsx"] }),
							" ",
							"}"
						] }),
						/* @__PURE__ */ jsx("p", { children: () => ["—shorthand JSX fragment return statements"] }),
						/* @__PURE__ */ jsx("a", {
							href: "/guide/jsx-syntax#jsx-gateway",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ jsx(Code, {
						trusted: true,
						main: {
							name: "nsx",
							code: gatewayReturn
						},
						alt: {
							name: "tsx equivalent",
							code: gatewayReturnTranspiled,
							lang: "tsx"
						},
						highlight: renderCodeToHtml
					})]
				})]
			}),
			/* @__PURE__ */ jsx("article", {
				class: "tour-row code-right",
				children: () => [/* @__PURE__ */ jsx("div", {
					class: "tour-copy",
					children: () => [
						/* @__PURE__ */ jsx("h3", { children: () => ["JSX component"] }),
						/* @__PURE__ */ jsx("code", { children: () => [
							"<::",
							" as=",
							/* @__PURE__ */ jsx("i", { children: () => ["component"] }),
							">",
							/* @__PURE__ */ jsx("i", { children: () => ["jsx"] }),
							"</::>"
						] }),
						"| ",
						/* @__PURE__ */ jsx("code", { children: () => [
							"<::>",
							/* @__PURE__ */ jsx("i", { children: () => ["jsx"] }),
							"</::>"
						] }),
						/* @__PURE__ */ jsx("p", { children: () => ["—auto-returned component with component instance type information"] }),
						/* @__PURE__ */ jsx("a", {
							href: "",
							class: "medium brand",
							children: () => ["Learn more"]
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					class: "tour-code",
					children: () => [/* @__PURE__ */ jsx(Code, {
						trusted: true,
						main: {
							name: "nsx",
							code: componentNsx
						},
						alt: {
							name: "tsx equivalent",
							code: componentTranspiled,
							lang: "tsx"
						},
						highlight: renderCodeToHtml
					})]
				})]
			})
		]
	})]);
}
function writeHomeTour() {
	return renderToString(() => /* @__PURE__ */ jsx(HomeTour, {}));
}
//#endregion
//#region src/luent-islands.ts
var islands = {
	HelloWorld,
	HomeTour: writeHomeTour
};
//#endregion
export { islands };
