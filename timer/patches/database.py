# my_app/db_typemap_patch.py
def apply_patch():
    TARGET_DB_TYPE = ("decimal", "21,9")  # ubah sesuai kebutuhan
    TARGET_FIELD = "Timer"

    # --- 1) Monkeypatch class methods agar instance baru juga ikut ---
    try:
        from frappe.database.mariadb.database import MariaDBDatabase as _MDB
        _orig_mdb_setup = _MDB.setup_type_map

        def _patched_mdb_setup(self):
            _orig_mdb_setup(self)
            self.type_map[TARGET_FIELD] = TARGET_DB_TYPE

        _MDB.setup_type_map = _patched_mdb_setup
    except Exception:
        pass

    try:
        from frappe.database.postgres.database import PostgresDatabase as _PG
        _orig_pg_setup = _PG.setup_type_map

        def _patched_pg_setup(self):
            _orig_pg_setup(self)
            self.type_map[TARGET_FIELD] = TARGET_DB_TYPE  # numeric(21,9) di PG

        _PG.setup_type_map = _patched_pg_setup
    except Exception:
        pass

    # --- 2) Patch INSTANSI yang sudah ada + base_document.type_map ---
    try:
        import sys, frappe

        db = getattr(frappe, "db", None)
        if db and getattr(db, "type_map", None) is not None:
            db.type_map[TARGET_FIELD] = TARGET_DB_TYPE

        bd = sys.modules.get("frappe.model.base_document")
        if bd and getattr(bd, "type_map", None) is not None:
            bd.type_map[TARGET_FIELD] = TARGET_DB_TYPE
    except Exception as e:
        print("[my_app] immediate typemap patch failed:", e)

    # --- 3) Tambah ke frappe.model.data_fieldtypes (idempotent, no-duplicate) ---
    try:
        import importlib
        m = importlib.import_module("frappe.model")

        cur = getattr(m, "data_fieldtypes", ())
        if TARGET_FIELD not in cur:
            # simpan sebagai tuple seperti aslinya
            m.data_fieldtypes = (*cur, TARGET_FIELD)

        # pastikan tidak dianggap no-value (Timer punya value bilangan detik)
        if hasattr(m, "no_value_fields"):
            if TARGET_FIELD in m.no_value_fields:
                m.no_value_fields = tuple(ft for ft in m.no_value_fields if ft != TARGET_FIELD)
    except Exception as e:
        print("[my_app] model fieldtypes patch failed:", e)

    # --- 4) Tambah ke .model.meta.data_fieldtypes (idempotent, no-duplicate) ---
    try:
        import importlib
        m = importlib.import_module("frappe.model.meta")
        cur = getattr(m, "data_fieldtypes", ())
        if TARGET_FIELD not in cur:
            # simpan sebagai tuple seperti aslinya
            m.data_fieldtypes = (*cur, TARGET_FIELD)

        # pastikan tidak dianggap no-value (Timer punya value bilangan detik)
        if hasattr(m, "no_value_fields"):
            if TARGET_FIELD in m.no_value_fields:
                m.no_value_fields = tuple(ft for ft in m.no_value_fields if ft != TARGET_FIELD)
    except Exception as e:
        print("[my_app] model fieldtypes patch failed:", e)