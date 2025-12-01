from functools import wraps
import logging

logger = logging.getLogger(__name__)


def noop_decorator(func=None):
    def decorator(f):
        return f

    if func:
        return func
    return decorator


def get_limit_decorator(app, rate):
    """Return a limiter decorator if limiter is installed, else a noop decorator.

    Usage:
        @get_limit_decorator(current_app, '10 per minute')
        def login():
            ...
    """
    try:
        limiter = getattr(app, 'extensions', {}).get('limiter') or app.config.get('LIMITER')
        if limiter and hasattr(limiter, 'limit'):
            return limiter.limit(rate)
    except Exception:
        logger.exception('Failed to get limiter')
    return noop_decorator
