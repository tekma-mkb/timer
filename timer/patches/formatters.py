import frappe
from frappe.utils import formatters

# simpan original
_orig_format_value = formatters.format_value

def patched_format_value(value, df=None, doc=None, currency=None, translated=False, format=None):
    if isinstance(df, str):
        df = frappe._dict(fieldtype=df)

    # Tangani Timer lebih dulu
    if df and df.get("fieldtype") == "Timer" and value not in (None, ""):
        try:
            total_seconds = int(value)
            h, rem = divmod(total_seconds, 3600)
            m, s = divmod(rem, 60)
            return f"{h:02d}:{m:02d}:{s:02d}"
        except Exception:
            return value

    # fallback ke original
    return _orig_format_value(value, df, doc, currency, translated, format)

def apply_patch():
    formatters.format_value = patched_format_value
