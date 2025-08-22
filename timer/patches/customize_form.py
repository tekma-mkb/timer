

# my_app/db_typemap_patch.py
def apply_patch():
    # --- MariaDB ---
    try:
        import frappe.custom.doctype.customize_form.customize_form
        from frappe.custom.doctype.customize_form.customize_form import docfield_properties
        _orig_frappe_docfield_properties = docfield_properties

        _orig_frappe_docfield_properties["set_only_once"] = "Check"
        _orig_frappe_docfield_properties["can_pause"] = "Check"
        _orig_frappe_docfield_properties["start_by"] = "Data"
        frappe.custom.doctype.customize_form.customize_form.docfield_properties = _orig_frappe_docfield_properties
    except Exception as e:
        print(e)