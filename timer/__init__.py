__version__ = "0.0.1"
# my_app/__init__.py
def _boot():

    try:
        from timer.patches.model import apply_patch
        apply_patch()
    except Exception:
        pass
    
    try:
        from timer.patches.customize_form import apply_patch
        apply_patch()
    except Exception:
        pass

    try:
        from timer.patches.database import apply_patch
        apply_patch()
    except Exception:
        # jangan gagalkan boot kalau patch gagal
        pass
    
    try:
        from timer.patches.formatters import apply_patch
        apply_patch()
    except Exception as e:
        # jangan biarkan error patch menghentikan startup
        print("[my_app] Formatter patch failed:", e)
    

_boot()
