# Timer Fieldtype for Frappe

A simple **Timer** fieldtype for Frappe/ERPNext that shows an `HH:MM:SS` timer and stores the elapsed time in **seconds**.

---

## Install

```bash
cd ~/frappe-bench
bench get-app https://github.com/tekma-mkb/timer
bench install-app timer
bench build
bench restart
```

---

## Usage

1. In **Customize Form** or **DocType** editor:
   - Add a field
   - Fieldtype: `Timer`
   - Fieldname: e.g. `work_duration`

2. Use in form:
   - ▶ Start
   - ⏸ Pause (if allowed)
   - ⏹ Stop

3. Value is stored as integer seconds (e.g. `3723` → `01:02:03`).

---

## Options

Set via `options` (JSON):

```json
{
  "can_pause": true,
  "commit_interval_sec": 1,
  "start_by": ["status"]
}
```

- `can_pause`: allow pause/resume (default true)  
- `commit_interval_sec`: auto-save every N sec (default 1)  
- `start_by`: list of fieldnames to auto-start the timer when changed  

---

## Code Access

Client-side:

```js
let timer = frm.fields_dict.work_duration;
timer?.start?.();
timer?.pause?.();
timer?.stop?.();
```

Server-side:

```python
secs = cint(doc.work_duration or 0)
```

---

## License

MIT © Tekma MKB