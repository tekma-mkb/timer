// ---- timer_control.js (start-only supported, live commit each tick) ---------

(function ensureTimerRegisteredInModel() {
	window.frappe = window.frappe || {};
	frappe.model = frappe.model || {};
	frappe.model.all_fieldtypes = frappe.model.all_fieldtypes || [];
	if (!frappe.model.all_fieldtypes.includes("Timer")) {
		frappe.model.all_fieldtypes.push("Timer");
	}
})();

/* idempotent formatter */
frappe.utils.format_timer =
	frappe.utils.format_timer ||
	function (seconds) {
		seconds = cint(seconds) || 0;
		const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
		const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
		const s = String(seconds % 60).padStart(2, "0");
		return `${h}:${m}:${s}`;
	};

// one-time style injection
(function injectTimerStyles() {
	if (document.getElementById("timer-style")) return;
	const s = document.createElement("style");
	s.id = "timer-style";
	s.textContent = `
    .timer-display{display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-family:sans-serif;}
    .timer-text{font-size:32px;font-weight:600;color:#444;letter-spacing:.5px}
    .timer-action{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:3px solid #007D32;border-radius:50%;cursor:pointer;transition:border-color .3s,background .3s,transform .2s}
    .timer-action .shape{width:20%;height:50%;background:#007D32;transition:all .3s}
    .timer-action .one{-webkit-clip-path:polygon(0 0,100% 25%,100% 75%,0 100%);transform:translateX(30%)}
    .timer-action .two{-webkit-clip-path:polygon(0 24%,100% 50%,100% 50%,0 76%);transform:translateX(25%)}
    .timer-action.active{border-color:#FFB100}
    .timer-action.active .shape{background:#FFB100}
    .timer-action.active .one{-webkit-clip-path:polygon(0 15%,50% 15%,50% 85%,0 85%);transform:translateX(0)}
    .timer-action.active .two{-webkit-clip-path:polygon(50% 15%,100% 15%,100% 85%,50% 85%);transform:translateX(0)}
    .timer-action:hover{background:rgba(0,125,50,.06);transform:scale(1.03)}
    .timer-action.active:hover{background:rgba(255,177,0,.10)}
    .timer-action.is-disabled{opacity:.5;cursor:not-allowed}
  `;
	document.head.appendChild(s);
})();

frappe.ui.form.ControlTimer = class ControlTimer extends frappe.ui.form.ControlData {
	make_input() {
		super.make_input();
		this.$input && this.$input.hide();

		// state
		this.value = cint(this.value) || 0;
		this.isRunning = false;
		this._raf = null;
		this._t0 = null;
		this._accum = 0;

		// config
		this.can_pause = this.df?.can_pause !== 0;
		this.start_by = this._normalizeStartBy(this.df?.start_by);

		// UI
		this.$container = $('<div class="timer-display"></div>').appendTo(this.input_area);
		this.$display = $(`<div class="timer-text">${this._fmt(this.value)}</div>`).appendTo(
			this.$container
		);
		this.$button = $(`
      <div class="timer-action" role="button" aria-label="Start timer" tabindex="0">
        <div class="shape one"></div>
        <div class="shape two"></div>
      </div>
    `).appendTo(this.$container);

		this.$button.on("click", () => this.toggleTimer());
		this.$button.on("keydown", (e) => {
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				this.toggleTimer();
			}
		});

		if (!this.can_pause) this._installStartOnlyBehavior();

		this.refresh_input();
		this._bindStartBy();
		this._bindGlobalStops();
	}

	/* ---------- public controls ---------- */
	toggleTimer() {
		if (this.isRunning) {
			if (!this.can_pause) return;
			this.stopTimer();
		} else {
			this.startTimer();
		}
	}

	startTimer() {
		if (this.isRunning || this._isDisabled()) return;
		this.isRunning = true;
		this.$button.addClass("active").removeClass("is-disabled");
		this._t0 = performance.now();
		this._loop();
	}

	stopTimer() {
		if (!this.isRunning) return;
		this.isRunning = false;
		this.$button.removeClass("active");
		cancelAnimationFrame(this._raf);
		this._raf = null;
		this._t0 = null;
		this._accum = 0;
		// no commit on stop
	}

	/* ---------- Frappe overrides ---------- */
	get_value() {
		return cint(this.value) || 0;
	}
	parse(v) {
		return cint(v) || 0;
	}

	refresh_input() {
		if (typeof super.refresh_input === "function") super.refresh_input();
		this._render();
		if (this._isDisabled()) this.stopTimer();
		if (this.$button && this.$button.is(":visible")) {
			const blockClick = this._isDisabled() || (!this.can_pause && this.isRunning);
			this.$button
				.toggleClass("is-disabled", blockClick)
				.css("pointer-events", blockClick ? "none" : "");
		}
	}

	format_for_input(v) {
		return this._fmt(cint(v) || 0);
	}
	validate() {
		if (this.isRunning) this.stopTimer();
		return true;
	}
	hide() {
		this.stopTimer();
	}

	/* ---------- internals ---------- */
	_loop() {
		if (!this.isRunning) return;
		const now = performance.now();
		let dt = now - (this._t0 ?? now);
		this._t0 = now;

		this._accum += dt;
		if (this._accum >= 1000) {
			const sec = Math.floor(this._accum / 1000);
			this._accum -= sec * 1000;

			// bump value, render, and COMMIT immediately (no interval knob)
			this.value = (cint(this.value) || 0) + sec;
			this._render();
			this._commitToDoc(this.value);
		}
		this._raf = requestAnimationFrame(() => this._loop());
	}

	_commitToDoc(val) {
		const v = cint(val);
		if (this.doctype && this.docname) {
			frappe.model.set_value(this.doctype, this.docname, this.df.fieldname, v);
		} else {
			this.set_value(v);
		}
	}

	_render() {
		this.$display && this.$display.text(this._fmt(this.value));
	}

	_fmt(s) {
		return frappe.utils.format_timer(cint(s) || 0);
	}
	_isDisabled() {
		return !!(this.df?.read_only || this.df?.disabled);
	}

	_normalizeStartBy(v) {
		if (!v) return [];
		if (Array.isArray(v)) return v.filter(Boolean).map(String);
		return String(v)
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	_shouldTrigger(val) {
		if (val === undefined || val === null) return false;
		if (typeof val === "string") return val.trim().length > 0 && val !== "0";
		if (typeof val === "number") return val !== 0;
		if (typeof val === "boolean") return val === true;
		if (val && typeof val === "object" && "value" in val) return !!val.value;
		return !!val;
	}

	_bindStartBy() {
		if (!this.start_by.length || !this.frm) return;

		// immediate check
		for (const f of this.start_by) {
			const current = this.frm.doc ? this.frm.doc[f] : undefined;
			if (this._shouldTrigger(current)) {
				this.startTimer();
				break;
			}
		}

		// reactive bindings
		for (const f of this.start_by) {
			const depCtrl = this.frm.fields_dict?.[f];
			if (!depCtrl) continue;
			const $el = depCtrl.$input || depCtrl.$wrapper?.find(":input");
			if (!$el || !$el.length) continue;

			const handler = () => {
				const v = this.frm.doc ? this.frm.doc[f] : undefined;
                if(this.df.set_only_once && !this.frm.doc?.__islocal) return
				if (!this.isRunning && this._shouldTrigger(v)) this.startTimer();
			};
			$el.on("change.timerdep input.timerdep blur.timerdep", handler);
			// note: no unbind — consistent with core minimalist controls
		}
	}

	/* ----- start-only helper ----- */
	_installStartOnlyBehavior() {
		this.toggleTimer = () => {
			if (!this.isRunning) this.startTimer();
		};
		const hideWhenRunning = () => {
			if (!this.$button) return;
			if (this.isRunning) {
				this.$button.hide().attr("aria-hidden", "true");
			} else {
				this.$button.show().attr("aria-hidden", "false").removeClass("is-disabled");
				this.$button.css("pointer-events", "");
			}
		};
		const _start = this.startTimer.bind(this);
		this.startTimer = () => {
			_start();
			hideWhenRunning();
		};
		const _stop = this.stopTimer.bind(this);
		this.stopTimer = () => {
			_stop();
			hideWhenRunning();
		};
		hideWhenRunning();
	}

	_bindGlobalStops() {
		// stop when leaving the page/route
		frappe.router.on("change", () => this.stopTimer());

		// stop right before any form saves (requires small boot patch below)
		const handler = (_e, frm) => {
			if (!frm || frm.doctype === this.doctype) this.stopTimer();
		};
		this._beforeSaveHandler = handler;
		$(document).on("timer:before_save.timerctrl", handler);
		$(document).on("save", handler);
	}
};

// ---- formatter (ListView / Print) ------------------------------------------
frappe.form.formatters.Timer = function (value) {
	return frappe.utils.format_timer(cint(value));
};
