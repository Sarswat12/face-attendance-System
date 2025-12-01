"""Application entrypoint for Flask CLI when run from the repository root.
This file exposes `app` so you can run: `flask --app manage db migrate` etc.
It imports `backend.create_app()` and exposes the app instance.
"""
from backend.app import create_app

# Expose app for `flask --app manage ...`
app = create_app()

if __name__ == '__main__':
    # Run development server when executed directly
    app.run(host='127.0.0.1', port=8000)
