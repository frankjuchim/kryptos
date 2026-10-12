from kv import *
import json, os
LOG = os.path.join(os.path.dirname(__file__), "log.jsonl")
def chk(name, got, exp):
    if isinstance(exp, str) and isinstance(got, str):
        ok = norm(got) == norm(exp)
    elif isinstance(exp, float):
        ok = abs(got - exp) < 0.0006
    else:
        ok = got == exp
    print(("OK     " if ok else "FEHLER ") + name, "|", got, "| erwartet:", exp)
    with open(LOG, "a") as f: f.write(json.dumps({"name": name, "ok": ok, "got": str(got), "exp": str(exp)}) + "\n")
    return ok
