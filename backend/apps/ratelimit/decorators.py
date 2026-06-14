from functools import wraps
from typing import Callable, Optional
try:
    from django.core.cache import cache
except Exception as e:
    print(f"[ratelimit] cache import failed: {e}")
    cache = None

try:
    from django.http import HttpResponse, HttpResponseTooManyRequests
except ImportError:
    try:
        from django.http import HttpResponse
        HttpResponseTooManyRequests = None
    except Exception:
        HttpResponse = None
        HttpResponseTooManyRequests = None

def _parse_rate(rate: str):
    try:
        num_s, per = rate.split("/")
        num = int(num_s)
        per = per.strip().lower()
        if per in ("s", "sec", "second", "seconds"):
            period = 1
        elif per in ("m", "min", "minute", "minutes"):
            period = 60
        elif per in ("h", "hour", "hours"):
            period = 3600
        else:
            period = int(per)
        return num, period
    except Exception:
        return 5, 60


def _default_keyfunc(request, *args, **kwargs):
    ip = getattr(request.META, "get", lambda k: None)("REMOTE_ADDR") or ""
    if ip:
        return ip
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return f"user:{getattr(user, 'pk', 'anon')}"
    return "anon"


def ratelimit(key: Optional[Callable] = None, rate: str = "5/m", block: bool = True):
    """Rate-limit decorator using Django's cache backend.

    Args:
        key: callable(request) -> str identifying the client.
             Strings like 'ip' are NOT supported — pass None for the default
             IP/user-pk logic, or a real callable.
        rate: limit string, e.g. "10/m", "5/s", "100/h".
        block: True  → return HTTP 429 when limit exceeded.
               False → set request._ratelimited = True and still call the view.
    """
    num, period = _parse_rate(rate)

    def decorator(func):
        @wraps(func)
        def _wrapped(request, *args, **kwargs):
            print(f"[ratelimit] _wrapped called for {func.__name__}")  # ADD THIS
            if cache is None:
                return func(request, *args, **kwargs)
            print("this")
            try:
                print("hi")
                key_fn = key if callable(key) else _default_keyfunc
                key_val = key_fn(request, *args, **kwargs)
                cache_key = f"rl:{func.__module__}.{func.__qualname__}:{key_val}:{rate}"
                print("hello")
                if not cache.add(cache_key, 1, timeout=period):
                    try:
                        count = cache.incr(cache_key)
                    except Exception:
                        cache.set(cache_key, 1, timeout=period)
                        count = 1
                else:
                    count = 1
                print(f"[ratelimit] key={cache_key} count={count} limit={num}")

                if count > num:
                    if block:
                        return HttpResponse("Too Many Requests", status=429)
                    setattr(request, "_ratelimited", True)

            except Exception as e:
                print(f"[ratelimit] EXCEPTION: {e}")

            return func(request, *args, **kwargs)

        _wrapped.csrf_exempt = True  # JWT endpoints don't send CSRF tokens
        return _wrapped

    return decorator


__all__ = ["ratelimit"]