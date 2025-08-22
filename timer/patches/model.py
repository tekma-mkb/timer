# my_app/db_typemap_patch.py
def apply_patch():
    # --- MariaDB ---
    try:
        import frappe.model
        from frappe.model import data_fieldtypes
        _orig_frappe_field_types = data_fieldtypes

        _orig_frappe_field_types += ("Timer", )
        frappe.model.data_fieldtypes = _orig_frappe_field_types
    except Exception as e:
        print(e)