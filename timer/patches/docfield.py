import frappe


def execute():
    for d in ["DocField", "Custom Field", "Customize Form Field", "Customize Form"]:
        # Load the DocType definition for DocField
        dt = frappe.get_doc("DocType", d)
        
            
        # --- Add new fields if missing ---
        if not any(df.fieldname == "can_pause" for df in dt.fields):
            dt.append("fields", {
                "fieldname": "can_pause",
                "label": "Can Pause",
                "fieldtype": "Check",
                "default": "0",
                "depends_on": "eval:doc.fieldtype=='Timer'",
            })

        if not any(df.fieldname == "start_by" for df in dt.fields):
            dt.append("fields", {
                "fieldname": "start_by",
                "label": "Start By",
                "fieldtype": "Data",
                "description": "Timer started by fieldname set value",
                "depends_on": "eval:doc.fieldtype=='Timer'",
            })
        if not any(df.fieldname == "set_only_once" for df in dt.fields):
            dt.append("fields", {
                "fieldname": "set_only_once",
                "label": "Set Only Once",
                "fieldtype": "Check",
                "depends_on": "eval:doc.fieldtype=='Timer'",
            })
        # --- Add "Timer" to fieldtype options ---
        ft_field = next((f for f in dt.fields if f.fieldname == "fieldtype" and f.fieldtype == "Select"), None)
        if ft_field:
            opts = (ft_field.options or "").split("\n")
            if "Timer" not in opts:
                opts.append("Timer")
                ft_field.options = "\n".join(opts)
        # Save + rebuild schema
        dt.save(ignore_permissions=True)
        frappe.db.commit()

        # Clear meta cache
        frappe.clear_cache(doctype="DocField")
