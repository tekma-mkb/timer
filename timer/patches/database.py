# my_app/db_typemap_patch.py
def apply_patch():
    # --- MariaDB ---
    try:
        from frappe.database.mariadb.database import MariaDBDatabase as _MDB

        _orig_mdb_setup = _MDB.setup_type_map

        def _patched_mdb_setup(self):
            _orig_mdb_setup(self)  # panggil bawaan
            # Tambah/override mapping
            self.type_map["Timer"] = ("decimal", "21,9")
            # Contoh override lain:
            # self.type_map["Float"] = ("decimal", "21,9")

        _MDB.setup_type_map = _patched_mdb_setup
    except Exception:
        pass

    # --- Postgres (kalau pakai PG) ---
    try:
        from frappe.database.postgres.database import PostgresDatabase as _PG

        _orig_pg_setup = _PG.setup_type_map

        def _patched_pg_setup(self):
            _orig_pg_setup(self)
            # Di PG, varchar juga OK untuk field custom seperti "Timer"
            self.type_map["Timer"] = ("decimal", "21,9")

        _PG.setup_type_map = _patched_pg_setup
    except Exception:
        pass
