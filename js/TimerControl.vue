<!-- Timer Fieldtype Component -->
<script setup>
import { ref, useSlots, onBeforeUnmount } from "vue";

const props = defineProps(["df", "value", "read_only"]);
const emit = defineEmits(["update:modelValue"]);
let slots = useSlots();
let time_zone = ref("");
let placeholder = ref("");

let timerInterval = null;
let isRunning = ref(false);

// format seconds -> hh:mm:ss
function formatTime(sec) {
	let hrs = String(Math.floor(sec / 3600)).padStart(2, "0");
	let mins = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
	let secs = String(sec % 60).padStart(2, "0");
	return `${hrs}:${mins}:${secs}`;
}

function startTimer() {
	if (!isRunning.value) {
		isRunning.value = true;
		timerInterval = setInterval(() => {
			emit("update:modelValue", (props.value || 0) + 1);
		}, 1000);
	}
}

function pauseTimer() {
	isRunning.value = false;
	clearInterval(timerInterval);
}

onBeforeUnmount(() => {
	pauseTimer();
});

// timezone for datetime
if (props.df.fieldtype === "Datetime") {
	let time_zone_text = frappe.boot.time_zone
		? frappe.boot.time_zone.user
		: frappe.sys_defaults.time_zone;
	time_zone.value = time_zone_text;
}

if (props.df.fieldtype === "Color") {
	placeholder.value = __("Choose a color");
}
if (props.df.fieldtype === "Icon") {
	placeholder.value = __("Choose an icon");
}
</script>

<template>
	<div class="control frappe-control" :class="{ editable: slots.label }">
		<!-- Label -->
		<div v-if="slots.label" class="field-controls">
			<slot name="label" />
			<slot name="actions" />
		</div>
		<div v-else class="control-label label" :class="{ reqd: df.reqd }">
			{{ __(df.label) }}
		</div>

		<!-- ✅ TIMER field -->
		<div v-if="df.fieldtype === 'Timer'" class="timer-wrapper">
			<div class="timer-display">
				{{ formatTime(value || 0) }}
				<div class="timer-buttons">
					<!-- Start / Pause toggle -->
					<button
						class="timer-btn"
						:class="isRunning ? 'btn-pause' : 'btn-start'"
						@click="isRunning ? pauseTimer() : startTimer()"
					>
						<span v-html="isRunning ? '⏸' : '▶'"></span>
					</button>

					<!-- Reset -->
					<!-- <button class="timer-btn btn-reset" @click="resetTimer">⏹</button> -->
				</div>
			</div>
		</div>

		<!-- Default input fallback -->
		<input
			v-else
			class="form-control"
			type="text"
			:value="value"
			:disabled="read_only || df.read_only"
			@input="(event) => $emit('update:modelValue', event.target.value)"
		/>

		<!-- Timezone for datetime field -->
		<div v-if="time_zone" class="time-zone mt-2" v-html="time_zone" />
	</div>
</template>

<style lang="scss" scoped>
.timer-wrapper {
	margin-top: 6px;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.timer-display {
	font-weight: bold;
	font-size: 18px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 10px;
	border: 1px solid #ccc;
	border-radius: 6px;
	background: #f8f9fa;
}

.timer-buttons {
	display: flex;
	align-items: center;
	margin-left: 10px;
}

.timer-btn {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 2px solid #333;
	font-size: 16px;
	line-height: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	margin-left: 6px;
}

.btn-start {
	background-color: #007d32;
	color: white;
}

.btn-pause {
	background-color: #ffb100;
	color: white;
}

.btn-reset {
	background-color: #6c757d;
	color: white;
}
</style>
