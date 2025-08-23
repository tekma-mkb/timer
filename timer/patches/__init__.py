def load(arg = ""):
    try:
        from timer.patches.database import apply_patch
        apply_patch()
    except Exception:
        # jangan gagalkan boot kalau patch gagal
        pass
    
    try:
        from timer.patches.customize_form import apply_patch
        apply_patch()
    except Exception:
        pass

    
    try:
        from timer.patches.formatters import apply_patch
        apply_patch()
    except Exception as e:
        # jangan biarkan error patch menghentikan startup
        print("[my_app] Formatter patch failed:", e)
    
