import imghdr
import os
import logging

logger = logging.getLogger(__name__)


def _is_allowed_magic(header_bytes):
    # imghdr.what works on bytes if given a filename, but we can use imghdr on a temp file name
    # Simpler: use imghdr to detect type from bytes via its tests
    try:
        kind = imghdr.what(None, h=header_bytes)
        return kind in ('jpeg', 'png')
    except Exception:
        logger.exception('magic check failed')
        return False


def validate_upload_stream(stream_or_bytes, filename=None, max_bytes=5 * 1024 * 1024):
    """Validate an uploaded image stream or bytes.

    Returns: (ok: bool, reason: str)
    """
    # Accept either a file-like object or raw bytes
    try:
        if hasattr(stream_or_bytes, 'read'):
            stream = stream_or_bytes
            pos = None
            try:
                pos = stream.tell()
            except Exception:
                pos = None
            header = stream.read(512)
            # reset stream position if possible
            try:
                if pos is not None:
                    stream.seek(pos)
                else:
                    stream.seek(0)
            except Exception:
                pass
            size = None
        else:
            data = stream_or_bytes
            header = data[:512]
            size = len(data)

        if size is not None and size > max_bytes:
            return False, f'file too large (max {max_bytes} bytes)'

        if not _is_allowed_magic(header):
            return False, 'unsupported image type or invalid image'

        return True, 'ok'
    except Exception as e:
        logger.exception('validate_upload_stream failed: %s', e)
        return False, 'validation_error'


def prepare_offload_stub(save_path):
    """Return a dict placeholder describing an S3 offload target (stub).
    Implementation left as a stub to be integrated with S3 in future.
    """
    parent = os.path.dirname(save_path)
    os.makedirs(parent, exist_ok=True)
    return {'offload_target': 's3', 'bucket': os.getenv('S3_BUCKET', ''), 'path': save_path}
